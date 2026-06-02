'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Fingerprint,
  Phone,
  Save,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  updateAccount,
  type Account,
  type AccountUpdatePatch,
} from '../services/accounts';

const STATUS_OPTIONS: Array<{ value: Account['contractStatus']; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'PROBABLE_CHURN', label: 'Probable Churn' },
  { value: 'DISCONNECTING', label: 'Disconnecting' },
];

export type EditSection = 'identity' | 'service' | 'contact' | 'ownership' | 'business';

const SECTION_META: Record<
  EditSection,
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  identity: { title: 'Identity', icon: Fingerprint },
  service: { title: 'Service', icon: Sparkles },
  contact: { title: 'Contact', icon: Phone },
  ownership: { title: 'Ownership', icon: Users },
  business: { title: 'Business details', icon: Briefcase },
};

export function EditCustomerSectionDialog({
  account,
  section,
  open,
  onOpenChange,
}: {
  account: Account;
  section: EditSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local form state — only the fields relevant to this section are
  // initialised, but we declare them all so the type stays uniform.
  const [clientName, setClientName] = useState(account.clientName);
  const [companyName, setCompanyName] = useState(account.companyName ?? '');
  const [customerCode, setCustomerCode] = useState(account.customerCode ?? '');
  const [leadId, setLeadId] = useState(account.leadId ?? '');
  const [externalCrmId, setExternalCrmId] = useState(account.externalCrmId ?? '');
  const [circuitId, setCircuitId] = useState(account.circuitId ?? '');
  const [userName, setUserName] = useState(account.userName ?? '');
  const [contractStatus, setContractStatus] = useState<Account['contractStatus']>(
    account.contractStatus,
  );

  const [currentPlan, setCurrentPlan] = useState(account.currentPlan ?? '');
  const [bandwidthMbps, setBandwidthMbps] = useState(
    account.bandwidthMbps != null ? String(account.bandwidthMbps) : '',
  );
  const [currentArc, setCurrentArc] = useState(String(account.currentArc ?? ''));

  const [email, setEmail] = useState(account.email ?? '');
  const [mobileNumber, setMobileNumber] = useState(account.mobileNumber ?? '');
  const [contactPersonName, setContactPersonName] = useState(account.contactPersonName ?? '');
  const [address, setAddress] = useState(account.address ?? '');

  const [accountManager, setAccountManager] = useState(account.accountManager ?? '');

  const [gstNumber, setGstNumber] = useState(account.gstNumber ?? '');
  const [industryType, setIndustryType] = useState(account.industryType ?? '');
  const [circle, setCircle] = useState(account.circle ?? '');
  const [ipDetails, setIpDetails] = useState(account.ipDetails ?? '');

  const meta = SECTION_META[section];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const patch: AccountUpdatePatch = {};
    const orEmpty = (s: string | null | undefined) => (s ?? '').trim();

    if (section === 'identity') {
      if (clientName.trim() !== account.clientName) patch.clientName = clientName.trim();
      if (companyName.trim() !== orEmpty(account.companyName))
        patch.companyName = companyName.trim() || null;
      if (customerCode.trim() !== orEmpty(account.customerCode))
        patch.customerCode = customerCode.trim() || null;
      if (leadId.trim() !== orEmpty(account.leadId)) patch.leadId = leadId.trim() || null;
      if (externalCrmId.trim() !== orEmpty(account.externalCrmId))
        patch.externalCrmId = externalCrmId.trim() || null;
      if (circuitId.trim() !== orEmpty(account.circuitId))
        patch.circuitId = circuitId.trim() || null;
      if (userName.trim() !== orEmpty(account.userName))
        patch.userName = userName.trim() || null;
      if (contractStatus !== account.contractStatus) patch.contractStatus = contractStatus;
    } else if (section === 'service') {
      if (currentPlan.trim() !== orEmpty(account.currentPlan))
        patch.currentPlan = currentPlan.trim() || null;
      if (bandwidthMbps.trim() !== '') {
        const n = Number(bandwidthMbps);
        if (!Number.isFinite(n) || n < 0) {
          setError('Bandwidth must be a non-negative number');
          setSubmitting(false);
          return;
        }
        if (n !== account.bandwidthMbps) patch.bandwidthMbps = n;
      } else if (account.bandwidthMbps != null) {
        patch.bandwidthMbps = null;
      }
      if (currentArc.trim() !== '') {
        const n = Number(currentArc.replace(/[, ]/g, ''));
        if (!Number.isFinite(n) || n < 0) {
          setError('Current ARC must be a non-negative number');
          setSubmitting(false);
          return;
        }
        if (n !== Number(account.currentArc)) patch.currentArc = n;
      }
    } else if (section === 'contact') {
      if (email.trim() !== orEmpty(account.email)) patch.email = email.trim() || null;
      if (mobileNumber.trim() !== orEmpty(account.mobileNumber))
        patch.mobileNumber = mobileNumber.trim() || null;
      if (contactPersonName !== (account.contactPersonName ?? ''))
        patch.contactPersonName = contactPersonName.trim() || null;
      if (address !== (account.address ?? '')) patch.address = address.trim() || null;
    } else if (section === 'ownership') {
      if (accountManager.trim() !== orEmpty(account.accountManager))
        patch.accountManager = accountManager.trim() || null;
    } else if (section === 'business') {
      if (gstNumber.trim() !== orEmpty(account.gstNumber))
        patch.gstNumber = gstNumber.trim() || null;
      if (industryType.trim() !== orEmpty(account.industryType))
        patch.industryType = industryType.trim() || null;
      if (circle.trim() !== orEmpty(account.circle)) patch.circle = circle.trim() || null;
      if (ipDetails !== (account.ipDetails ?? '')) patch.ipDetails = ipDetails.trim() || null;
    }

    if (Object.keys(patch).length === 0) {
      toast.info('No changes to save');
      setSubmitting(false);
      onOpenChange(false);
      return;
    }

    try {
      const result = await updateAccount(account.id, patch);
      toast.success(
        `Saved ${result.changedFields.length} change${result.changedFields.length === 1 ? '' : 's'}`,
        { description: result.changedFields.join(', ') },
      );
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setError(msg);
      toast.error('Update failed', { description: msg, duration: 10000 });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-b from-orange-50/70 to-white flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
              <meta.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-gray-900 leading-tight">
                Edit {meta.title.toLowerCase()}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {account.companyName || account.clientName} · each change is
                audit-logged with your IP
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="edit-section-form"
          onSubmit={submit}
          className="overflow-y-auto px-6 py-5 flex-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            {section === 'identity' && (
              <>
                <FormField label="Customer / company name" required>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </FormField>
                <FormField label="Company name (separate)">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Leave blank if same"
                  />
                </FormField>
                <FormField label="Customer code">
                  <Input
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="Lead ID">
                  <Input
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="CRM customer ID">
                  <Input
                    value={externalCrmId}
                    onChange={(e) => setExternalCrmId(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="Circuit ID">
                  <Input
                    value={circuitId}
                    onChange={(e) => setCircuitId(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="User name (internal)">
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="Contract status">
                  <Select
                    value={contractStatus}
                    onValueChange={(v) =>
                      setContractStatus(v as Account['contractStatus'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            )}

            {section === 'service' && (
              <>
                <FormField label="Plan" fullWidth>
                  <Input
                    value={currentPlan}
                    onChange={(e) => setCurrentPlan(e.target.value)}
                    placeholder="Auto-derived from company + bandwidth if blank"
                  />
                </FormField>
                <FormField label="Bandwidth (Mbps)">
                  <Input
                    type="number"
                    min="0"
                    value={bandwidthMbps}
                    onChange={(e) => setBandwidthMbps(e.target.value)}
                  />
                </FormField>
                <FormField label="Current ARC (₹ / year)">
                  <Input
                    inputMode="numeric"
                    value={currentArc}
                    onChange={(e) => setCurrentArc(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <p className="md:col-span-2 text-[11px] text-gray-500">
                  Editing ARC here bypasses the normal commercial-change flow — use
                  sparingly. Both values are audit-logged.
                </p>
              </>
            )}

            {section === 'contact' && (
              <>
                <FormField label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </FormField>
                <FormField label="Mobile number">
                  <Input
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </FormField>
                <FormField label="Contact person" fullWidth>
                  <Textarea
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    rows={2}
                  />
                </FormField>
                <FormField label="Address" fullWidth>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                  />
                </FormField>
              </>
            )}

            {section === 'ownership' && (
              <>
                <FormField label="Account Manager (internal)" fullWidth>
                  <Input
                    value={accountManager}
                    onChange={(e) => setAccountManager(e.target.value)}
                    placeholder="The internal AM — distinct from the SAM owner"
                  />
                </FormField>
                <p className="md:col-span-2 text-[11px] text-gray-500">
                  To reassign the SAM owner, use the Assign button on the customers
                  list — that flow includes the proper audit + notification.
                </p>
              </>
            )}

            {section === 'business' && (
              <>
                <FormField label="GST number">
                  <Input
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="15-char GSTIN"
                    className="font-mono uppercase"
                  />
                </FormField>
                <FormField label="Industry">
                  <Input
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                  />
                </FormField>
                <FormField label="Circle / zone">
                  <Input value={circle} onChange={(e) => setCircle(e.target.value)} />
                </FormField>
                <FormField label="IP details" fullWidth>
                  <Textarea
                    value={ipDetails}
                    onChange={(e) => setIpDetails(e.target.value)}
                    rows={2}
                    placeholder="Comma-separated IPs"
                    className="font-mono text-xs"
                  />
                </FormField>
              </>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button type="submit" form="edit-section-form" disabled={submitting}>
            <Save className="w-4 h-4 mr-1.5" />
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  required,
  fullWidth,
  children,
}: {
  label: string;
  required?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <Label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
