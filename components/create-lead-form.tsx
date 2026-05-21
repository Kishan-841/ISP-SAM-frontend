'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from './page-header';
import { createLead, type BdmAssignable, type BdmType } from '../services/leads';

const TYPE_LABEL: Record<BdmType, string> = {
  TEAM_LEADER: 'Team Leader',
  SOLO_BDM: 'Solo BDM',
};

export function CreateLeadForm({
  bdms,
  bdmFetchError,
}: {
  bdms: BdmAssignable[];
  bdmFetchError: string | null;
}) {
  const router = useRouter();

  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

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
  const emailValid = email.trim() === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const submitDisabled =
    submitting ||
    !assignedToUserId ||
    companyName.trim().length < 2 ||
    contactName.trim().length < 2 ||
    !phoneValid ||
    !emailValid;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await createLead({
        assignedToUserId,
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        phone: normalisedPhone,
        email: email.trim() || undefined,
        designation: designation.trim() || undefined,
        industry: industry.trim() || undefined,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Lead created · ${result.crmLeadNumber}`, {
        description: `Assigned to ${result.assignedToName}. CRM will notify them.`,
        duration: 6000,
      });
      // Clear the form so the operator can raise another one.
      resetForm();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create lead';
      const friendly = friendlyCreateLeadError(msg);
      setFormError(friendly ?? msg);
      toast.error('Lead not created', {
        description: friendly ?? msg,
        duration: 10000,
      });
      // eslint-disable-next-line no-console
      console.warn('[create-lead failed]', err);
    } finally {
      setSubmitting(false);
    }
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
    setNotes('');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      <PageHeader
        title="Create Lead"
        subtitle="Capture a lead and assign it to a BDM Team Leader or Solo BDM. The lead lands in their New Leads Assigned tab on CRM."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* BDM picker — orange-themed callout so it's clearly the first step */}
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
              label="Contact Name"
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
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="email@company.com"
              type="email"
              error={!emailValid ? 'Invalid email format' : undefined}
              disabled={submitting}
            />
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
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Creating…' : 'Create & Assign Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
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
      {error && <p className="text-xs text-red-600">{error}</p>}
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
