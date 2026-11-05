'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Cloud,
  Cpu,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Send,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from './page-header';
import { createLead, type BdmAssignable, type BdmType } from '../services/leads';
import { createMspLead } from '../services/msp-leads';
import {
  MSP_SUBCATEGORIES,
  MSP_CLASSIFICATION_LABEL,
  MSP_CLASSIFICATION_HINT,
  gstStateOptions,
  isValidGstin,
  stateCodeFromGstin,
  type MspClassification,
} from '../lib/msp-categories';

const TYPE_LABEL: Record<BdmType, string> = {
  TEAM_LEADER: 'Team Leader',
  SOLO_BDM: 'Solo BDM',
};

/**
 * Where a lead goes. ILL is connectivity, raised on the ISP CRM with the SAM
 * choosing the BDM. MSP is managed services — firewalls, managed networking —
 * raised on the MSP CRM, where their team lead does the assigning.
 */
export type LeadKind = 'ILL' | 'MSP';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function CreateLeadForm({
  bdms,
  bdmFetchError,
  illEnabled = true,
  mspEnabled = false,
}: {
  bdms: BdmAssignable[];
  bdmFetchError: string | null;
  illEnabled?: boolean;
  mspEnabled?: boolean;
}) {
  const router = useRouter();

  const [kind, setKind] = useState<LeadKind>(illEnabled ? 'ILL' : 'MSP');
  const isMsp = kind === 'MSP';

  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [requirement, setRequirement] = useState('');
  const [notes, setNotes] = useState('');

  // MSP-only: optional tax details and the classification their form asks for.
  const [gstin, setGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [classification, setClassification] = useState<MspClassification | ''>('');
  const [subcategories, setSubcategories] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Group dropdown options: Team Leaders first, Solo BDMs below.
  const grouped = useMemo(() => {
    const tls = bdms.filter((b) => b.type === 'TEAM_LEADER');
    const solos = bdms.filter((b) => b.type === 'SOLO_BDM');
    return { tls, solos };
  }, [bdms]);

  const normalisedPhone = phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  const phoneValid = /^[0-9]{10}$/.test(normalisedPhone);
  const trimmedEmail = email.trim();
  // The one rule that differs by destination: MSP refuses a lead with no
  // email, so require it there and leave it optional for ILL.
  const emailValid = isMsp
    ? EMAIL_RE.test(trimmedEmail)
    : trimmedEmail === '' || EMAIL_RE.test(trimmedEmail);

  // A GSTIN is optional, but a half-typed one is worth catching here: MSP
  // accepts the lead either way and files the bad value in its notes, which
  // helps nobody.
  const trimmedGstin = gstin.trim().toUpperCase();
  const gstinValid = trimmedGstin === '' || isValidGstin(trimmedGstin);
  const derivedState = stateCodeFromGstin(trimmedGstin);

  const submitDisabled =
    submitting ||
    companyName.trim().length < 2 ||
    contactName.trim().length < 2 ||
    !phoneValid ||
    !emailValid ||
    (isMsp && !gstinValid) ||
    (!isMsp && !assignedToUserId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setSubmitting(true);
    setFormError(null);
    try {
      if (isMsp) {
        await submitMspLead();
      } else {
        await submitIllLead();
      }
      // Clear the form so the operator can raise another one.
      resetForm();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create lead';
      const friendly = isMsp ? friendlyMspLeadError(msg) : friendlyCreateLeadError(msg);
      setFormError(friendly ?? msg);
      toast.error(isMsp ? 'MSP lead not sent' : 'Lead not created', {
        description: friendly ?? msg,
        duration: 10000,
      });
      console.warn('[create-lead failed]', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitIllLead() {
    const result = await createLead({
      assignedToUserId,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: normalisedPhone,
      email: trimmedEmail || undefined,
      designation: designation.trim() || undefined,
      industry: industry.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast.success(`Lead created · ${result.crmLeadNumber}`, {
      description: `Assigned to ${result.assignedToName}. CRM will notify them.`,
      duration: 6000,
    });
  }

  async function submitMspLead() {
    const company = companyName.trim();
    const result = await createMspLead({
      companyName: company,
      contactPerson: contactName.trim(),
      phone: normalisedPhone,
      email: trimmedEmail,
      requirement: requirement.trim() || undefined,
      notes: notes.trim() || undefined,
      customerGstin: trimmedGstin || undefined,
      // Skip the state when the GSTIN already carries it — MSP reads it from
      // the first two digits anyway.
      customerState: derivedState ?? (customerState || undefined),
      billingAddress: billingAddress.trim() || undefined,
      classification: classification || undefined,
      subcategories: subcategories.length ? subcategories : undefined,
    });
    // A 202 means we saved the lead but couldn't hand it over yet. Say so
    // plainly — the SAM's work isn't lost, but it isn't done either.
    if (result.status === 'QUEUED') {
      toast.warning(`Saved, but not delivered yet · ${company}`, {
        description:
          "Couldn't reach the MSP CRM. The lead is safe in SAM and will be sent again automatically — watch My Leads for it to turn green.",
        duration: 12000,
      });
      return;
    }
    toast.success(`MSP lead sent · ${company}`, {
      description:
        'The MSP CRM has it. Their team lead will assign it to a Sales person, and the status will show up in My Leads.',
      duration: 6000,
    });
  }

  function resetForm() {
    setAssignedToUserId('');
    setCompanyName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setDesignation('');
    setIndustry('');
    setCity('');
    setRequirement('');
    setNotes('');
    setGstin('');
    setCustomerState('');
    setBillingAddress('');
    setClassification('');
    setSubcategories([]);
  }

  /** Picking a different classification clears products that belonged to the
   *  old one — "Firewall" means nothing under Software. */
  function chooseClassification(next: MspClassification) {
    setClassification((current) => (current === next ? '' : next));
    setSubcategories([]);
  }

  function toggleSubcategory(name: string) {
    setSubcategories((current) =>
      current.includes(name) ? current.filter((s) => s !== name) : [...current, name],
    );
  }

  // Switching destination mid-form shouldn't carry over a choice that doesn't
  // apply, but it should keep what the SAM has already typed.
  function switchKind(next: LeadKind) {
    if (next === kind) return;
    setKind(next);
    setFormError(null);
    if (next === 'MSP') setAssignedToUserId('');
  }

  const bothEnabled = illEnabled && mspEnabled;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      <PageHeader
        title="Create Lead"
        subtitle={
          isMsp
            ? 'Hand a managed-services opportunity to the MSP CRM. Their team lead assigns it to a Sales person — you can follow the status in My Leads.'
            : 'Capture a lead and assign it to a BDM Team Leader or Solo BDM. The lead lands in their New Leads Assigned tab on CRM.'
        }
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {bothEnabled && (
          <Card>
            <CardContent className="px-6 py-5 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-900">
                What kind of lead is this?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <KindOption
                  selected={!isMsp}
                  onSelect={() => switchKind('ILL')}
                  icon={Wifi}
                  title="ILL Lead"
                  line="Connectivity — ILL, broadband, links"
                  detail="Goes to the ISP CRM. You pick the BDM."
                  disabled={submitting}
                />
                <KindOption
                  selected={isMsp}
                  onSelect={() => switchKind('MSP')}
                  icon={ShieldCheck}
                  title="MSP Lead"
                  line="Managed services — firewalls, networking"
                  detail="Goes to the MSP CRM. Their team lead assigns it."
                  disabled={submitting}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* BDM picker — ILL only; on an MSP lead their team lead assigns. */}
        {!isMsp && (
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="px-6 py-5 flex flex-col gap-2">
              <label
                htmlFor="bdm"
                className="text-sm font-semibold text-brand-700 inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Assign to BDM Team Leader<span className="text-red-500 ml-0.5">*</span>
              </label>
              {bdmFetchError ? (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Couldn&apos;t load the BDM list from CRM. {bdmFetchError}. Refresh the page to retry.
                  </AlertDescription>
                </Alert>
              ) : (
                <select
                  id="bdm"
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
                  disabled={submitting}
                >
                  <option value="">Select Team Leader…</option>
                  {grouped.tls.length > 0 && (
                    <optgroup label="BDM Team Leaders">
                      {grouped.tls.map((b) => (
                        <option key={b.id} value={b.id}>
                          {bdmLabel(b)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {grouped.solos.length > 0 && (
                    <optgroup label="Solo BDMs">
                      {grouped.solos.map((b) => (
                        <option key={b.id} value={b.id}>
                          {bdmLabel(b)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {bdms.length === 0 && (
                    <option value="" disabled>
                      No assignable BDMs available
                    </option>
                  )}
                </select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lead details */}
        <Card>
          <CardContent className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Company Name"
              required
              icon={Building2}
              value={companyName}
              onChange={setCompanyName}
              placeholder="e.g. Acme Corp"
              disabled={submitting}
            />
            <FormField
              label={isMsp ? 'Contact Person' : 'Contact Name'}
              required
              icon={UserIcon}
              value={contactName}
              onChange={setContactName}
              placeholder="e.g. John Doe"
              disabled={submitting}
            />
            <FormField
              label="Phone"
              required
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="10-digit phone number"
              type="tel"
              error={phone.length > 0 && !phoneValid ? '10-digit number required' : undefined}
              disabled={submitting}
            />
            <FormField
              label="Email"
              required={isMsp}
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="email@company.com"
              type="email"
              error={
                trimmedEmail !== '' && !EMAIL_RE.test(trimmedEmail)
                  ? 'Invalid email format'
                  : undefined
              }
              hint={
                isMsp ? 'The MSP CRM will not accept a lead without an email.' : undefined
              }
              disabled={submitting}
            />

            {isMsp ? (
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="requirement" className="text-sm font-medium text-gray-700">
                  Requirement
                </label>
                <Textarea
                  id="requirement"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="What do they need? e.g. 2 firewalls for the new Chakan plant"
                  rows={3}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500">
                  This is what the MSP Sales person works from. Worth a line.
                </p>
              </div>
            ) : (
              <>
                <FormField
                  label="Designation"
                  icon={Briefcase}
                  value={designation}
                  onChange={setDesignation}
                  placeholder="e.g. IT Manager"
                  disabled={submitting}
                />
                <FormField
                  label="Industry"
                  value={industry}
                  onChange={setIndustry}
                  placeholder="e.g. IT Services"
                  disabled={submitting}
                />
                <FormField
                  label="City"
                  icon={MapPin}
                  value={city}
                  onChange={setCity}
                  placeholder="e.g. Mumbai"
                  disabled={submitting}
                  className="md:col-span-2 md:max-w-[50%]"
                />
              </>
            )}

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this lead…"
                rows={4}
                disabled={submitting}
              />
            </div>
          </CardContent>
        </Card>

        {isMsp && (
          <>
            <Card>
              <CardContent className="px-6 py-5 flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                    <ReceiptText className="w-4 h-4 text-gray-400" />
                    Tax details
                  </p>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400">
                    Optional
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="GSTIN"
                    value={gstin}
                    onChange={setGstin}
                    placeholder="27AAACA4321P1Z3"
                    disabled={submitting}
                    error={!gstinValid ? "That doesn't look like a valid GSTIN" : undefined}
                    hint={
                      derivedState
                        ? `State reads as ${gstStateName(derivedState)} — taken from the GSTIN.`
                        : undefined
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="msp-state" className="text-sm font-medium text-gray-700">
                      State
                    </label>
                    <select
                      id="msp-state"
                      value={derivedState ?? customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                      // A valid GSTIN already says which state it is.
                      disabled={submitting || derivedState !== null}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none"
                    >
                      <option value="">Select state…</option>
                      {gstStateOptions().map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="msp-billing" className="text-sm font-medium text-gray-700">
                      Billing address
                    </label>
                    <Textarea
                      id="msp-billing"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Plot 14, Chakan MIDC, Pune 410501"
                      rows={3}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-6 py-5 flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-semibold text-gray-900">Classification</p>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400">
                    Optional
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['HARDWARE', 'SOFTWARE'] as const).map((c) => (
                    <KindOption
                      key={c}
                      selected={classification === c}
                      onSelect={() => chooseClassification(c)}
                      icon={c === 'HARDWARE' ? Cpu : Cloud}
                      title={MSP_CLASSIFICATION_LABEL[c]}
                      line={MSP_CLASSIFICATION_HINT[c]}
                      detail=""
                      disabled={submitting}
                    />
                  ))}
                </div>

                {classification && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-gray-700">Subcategories</p>
                      <span className="text-xs text-gray-400">
                        {subcategories.length} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MSP_SUBCATEGORIES[classification].map((name) => {
                        const on = subcategories.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleSubcategory(name)}
                            aria-pressed={on}
                            disabled={submitting}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-60 ${
                              on
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Pick at least one and the lead reaches MSP already categorised — their
                      team lead only has to assign it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitDisabled}
            size="lg"
            className="bg-brand-600 text-white hover:bg-brand-700 inline-flex items-center gap-2"
          >
            {isMsp ? <Send className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {submitting
              ? isMsp
                ? 'Sending…'
                : 'Creating…'
              : isMsp
                ? 'Send to MSP CRM'
                : 'Create & Assign Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function KindOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  line,
  detail,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  line: string;
  detail?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`text-left rounded-lg border px-4 py-3 transition-colors disabled:opacity-60 ${
        selected
          ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-300'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
      }`}
    >
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
          selected ? 'text-brand-700' : 'text-gray-900'
        }`}
      >
        <Icon className="w-4 h-4" />
        {title}
      </span>
      <span className="block text-xs text-gray-600 mt-1">{line}</span>
      {detail && <span className="block text-[11px] text-gray-500 mt-0.5">{detail}</span>}
    </button>
  );
}

function FormField({
  label,
  required,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  hint,
  disabled,
  className,
}: {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={Icon ? 'pl-9' : ''}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

function bdmLabel(b: BdmAssignable): string {
  const typeBit = TYPE_LABEL[b.type];
  if (b.email) return `${b.name} · ${typeBit} · ${b.email}`;
  return `${b.name} · ${typeBit}`;
}

function friendlyCreateLeadError(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes('bdm_not_found')) {
    return 'The selected BDM is no longer assignable. Reload the page and pick another.';
  }
  if (m.includes('bdm_list_unavailable')) {
    return 'Couldn’t reach CRM to validate the BDM. Try again in a minute.';
  }
  if (m.includes('crm_rejected')) {
    return 'CRM rejected the lead — likely a duplicate phone, missing field, or business rule. Check the lead history page for details.';
  }
  if (m.includes('lead_dispatch_disabled')) {
    return 'Lead-from-SAM is disabled on this environment. Ask admin to flip the feature flag.';
  }
  if (m.includes('validation_failed')) {
    return 'One of the fields failed validation. Check phone (10 digits) and email format.';
  }
  return null;
}

function friendlyMspLeadError(message: string): string | null {
  const m = message.toLowerCase();
  // Strip our own code and MSP's status prefix, leaving their wording.
  const detail = message
    .replace(/^[A-Z_]+:\s*/, '')
    .replace(/^MSP \d+:\s*/, '')
    .trim();
  if (m.includes('msp_rejected')) {
    return `The MSP CRM would not accept this lead: ${
      detail || 'check the details and try again'
    }`;
  }
  if (m.includes('msp_leads_disabled')) {
    return 'MSP leads are switched off on this environment. Ask an admin to enable them.';
  }
  if (m.includes('msp_not_configured')) {
    return 'The MSP CRM connection isn’t set up yet — ask an admin for the integration key.';
  }
  if (m.includes('validation_failed')) {
    return detail || 'One of the fields failed validation. Check phone (10 digits) and email.';
  }
  return null;
}

function gstStateName(code: string): string {
  return gstStateOptions().find((o) => o.code === code)?.name ?? code;
}
