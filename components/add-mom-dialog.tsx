'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Clipboard,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  completeMeeting,
  previewMomEmail,
  sendMomEmail,
  type ActionItem,
  type EmailDispatchStatus,
  type MeetingRow,
  type MeetingType,
} from '../services/meetings';
import { parseParticipants } from '../lib/participants';
import { MomFormattedPreview } from './mom-formatted-preview';
import type { Account } from '../services/accounts';

type Participant = { name: string; position: string };
type Step = 1 | 2;

const STATUS_OPTIONS: ActionItem['currentStatus'][] = ['Open', 'In Progress', 'Closed'];

export function AddMomDialog({
  accounts,
  existingMeeting = null,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  accounts: Account[];
  /** When set, the dialog runs in "complete existing meeting" mode:
   *  customer/date/type are locked to the existing meeting; submit updates
   *  the existing record instead of creating a new one. */
  existingMeeting?: MeetingRow | null;
  /** Replace the default "Add MOM" button. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const editing = existingMeeting !== null;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (o: boolean) => {
    onOpenChange?.(o);
    if (controlledOpen === undefined) setUncontrolledOpen(o);
  };

  const [step, setStep] = useState<Step>(1);

  // Initial values come from the existing meeting (edit mode) or defaults.
  const initialClientPpts =
    existingMeeting && parseParticipants(existingMeeting.clientParticipants).length > 0
      ? parseParticipants(existingMeeting.clientParticipants)
      : [{ name: '', position: '' }];
  const initialGazonPpts =
    existingMeeting && parseParticipants(existingMeeting.gazonParticipants).length > 0
      ? parseParticipants(existingMeeting.gazonParticipants)
      : [{ name: '', position: '' }];
  const initialItems =
    existingMeeting?.actionItems && existingMeeting.actionItems.length > 0
      ? existingMeeting.actionItems
      : [blankItem(1)];

  // ── Step 1: meeting details ────────────────────────────────────────
  const [accountId, setAccountId] = useState(existingMeeting?.accountId ?? '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [date, setDate] = useState(
    existingMeeting ? isoDateOf(existingMeeting.scheduledAt) : todayIso(),
  );
  const [time, setTime] = useState(
    existingMeeting ? isoTimeOf(existingMeeting.scheduledAt) : nowHm(),
  );
  const [meetingType, setMeetingType] = useState<MeetingType>(
    existingMeeting?.meetingType ?? 'ONLINE',
  );
  const [location, setLocation] = useState(existingMeeting?.location ?? '');
  const [clientPpts, setClientPpts] = useState<Participant[]>(initialClientPpts);
  const [gazonPpts, setGazonPpts] = useState<Participant[]>(initialGazonPpts);
  const [items, setItems] = useState<ActionItem[]>(initialItems);

  // ── Step 2: email composer ────────────────────────────────────────
  const [to, setTo] = useState('');
  const [toEdited, setToEdited] = useState(false);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [body, setBody] = useState(existingMeeting?.momContent ?? '');
  const [bodyEdited, setBodyEdited] = useState(!!existingMeeting?.momContent);
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [testMode, setTestMode] = useState(false);

  const [previewKey, setPreviewKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedAccount = useMemo<Account | null>(() => {
    if (existingMeeting) {
      // The meetings list may have fewer fields than Account; reuse what we have.
      const fromList = accounts.find((a) => a.id === existingMeeting.accountId);
      if (fromList) return fromList;
      // Synthesize a minimal Account from the embedded meeting.account for display.
      return {
        ...existingMeeting.account,
        contractStatus: 'ACTIVE',
        currentArc: '0',
        onboardingDate: existingMeeting.scheduledAt,
        externalCrmId: null,
        lastMomDate: null,
        lastMeetingDate: null,
      } as unknown as Account;
    }
    return accounts.find((a) => a.id === accountId) ?? null;
  }, [accounts, accountId, existingMeeting]);

  const filteredAccounts = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return accounts.slice(0, 25);
    return accounts
      .filter((a) =>
        [a.clientName, a.companyName, a.customerCode, a.circuitId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [accounts, customerSearch]);

  const cleanClient = useMemo(
    () => clientPpts.filter((p) => p.name.trim()),
    [clientPpts],
  );
  const cleanGazon = useMemo(
    () => gazonPpts.filter((p) => p.name.trim()),
    [gazonPpts],
  );
  const cleanItems = useMemo(
    () =>
      items
        .filter((i) => i.discussionDescription.trim())
        .map((i, idx) => ({ ...i, srNo: idx + 1 })),
    [items],
  );

  // Whenever step 1 data changes, refresh step 2 auto-fills (unless edited).
  useEffect(() => {
    if (!selectedAccount) return;
    if (!toEdited) setTo(selectedAccount.email ?? '');
    if (!subjectEdited) {
      const customerName = selectedAccount.companyName || selectedAccount.clientName;
      setSubject(`Minutes of Meeting — ${customerName} — ${formatHumanDate(date)}`);
    }
    if (!bodyEdited) {
      setBody(
        composeBodyFromMeeting({
          clientName: selectedAccount.clientName,
          companyName: selectedAccount.companyName ?? null,
          actionItems: cleanItems,
        }),
      );
    }
  }, [selectedAccount, date, cleanItems, toEdited, subjectEdited, bodyEdited]);

  function reset() {
    setStep(1);
    setAccountId(existingMeeting?.accountId ?? '');
    setCustomerSearch('');
    setSearchOpen(false);
    setDate(existingMeeting ? isoDateOf(existingMeeting.scheduledAt) : todayIso());
    setTime(existingMeeting ? isoTimeOf(existingMeeting.scheduledAt) : nowHm());
    setMeetingType(existingMeeting?.meetingType ?? 'ONLINE');
    setLocation(existingMeeting?.location ?? '');
    setClientPpts(initialClientPpts);
    setGazonPpts(initialGazonPpts);
    setItems(initialItems);
    setTo('');
    setToEdited(false);
    setCc('');
    setSubject('');
    setSubjectEdited(false);
    setBody(existingMeeting?.momContent ?? '');
    setBodyEdited(!!existingMeeting?.momContent);
    setDesignation('');
    setPhone('');
    setTestMode(false);
    setPreviewKey(0);
    setError(null);
    setSuccess(null);
  }

  function goToStep2() {
    if (!accountId) {
      setError('Pick a customer.');
      return;
    }
    if (!date || !time) {
      setError('Date and time are required.');
      return;
    }
    setError(null);
    setStep(2);
  }

  async function copyForOutlook() {
    if (!accountId) return setError('Pick a customer first.');
    if (!subject.trim()) return setError('Subject is required.');
    if (!body.trim()) return setError('Email body is required.');

    setCopying(true);
    setError(null);
    setSuccess(null);
    try {
      const ccList = cc
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const preview = await previewMomEmail({
        accountId,
        scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
        meetingType,
        location: meetingType === 'PHYSICAL' ? location.trim() || undefined : undefined,
        clientParticipants: cleanClient.length ? JSON.stringify(cleanClient) : undefined,
        gazonParticipants: cleanGazon.length ? JSON.stringify(cleanGazon) : undefined,
        actionItems: cleanItems.length ? cleanItems : undefined,
        momContent: body.trim(),
        subject: subject.trim(),
        samDesignation: designation.trim() || undefined,
        samPhone: phone.trim() || undefined,
      });

      // Write both HTML and plain text so Outlook picks up the styled version
      // while non-HTML clients still get something readable.
      if (typeof window === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Clipboard API not available in this browser.');
      }
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([preview.html], { type: 'text/html' }),
          'text/plain': new Blob([preview.text], { type: 'text/plain' }),
        }),
      ]);

      const recipient = to.trim() || selectedAccount?.email || '';
      const ccLine = ccList.length > 0 ? ` (CC: ${ccList.join(', ')})` : '';
      const next = recipient
        ? `Open Outlook → New Email → paste in body (Ctrl+V). To: ${recipient}${ccLine}. Subject: "${preview.subject}".`
        : 'Open Outlook → New Email → paste in body (Ctrl+V). Add the customer email in the To field.';
      setSuccess(`Email copied to clipboard. ${next}`);
      toast.success('Email copied to clipboard', {
        description: next,
        duration: 10000,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to copy email';
      setError(msg);
      toast.error('Copy failed', { description: msg, duration: 10000 });
      // eslint-disable-next-line no-console
      console.error('[MoM copy for Outlook]', err);
    } finally {
      setCopying(false);
    }
  }

  async function submit() {
    if (!testMode && !to.trim()) return setError('Recipient email is required.');
    if (!subject.trim()) return setError('Subject is required.');
    if (!body.trim()) return setError('Email body is required.');

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const ccList = cc
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const sharedPayload = {
        clientParticipants: cleanClient.length ? JSON.stringify(cleanClient) : undefined,
        gazonParticipants: cleanGazon.length ? JSON.stringify(cleanGazon) : undefined,
        actionItems: cleanItems.length ? cleanItems : undefined,
        momContent: body.trim(),
        to: to.trim() || undefined,
        cc: ccList.length > 0 ? ccList : undefined,
        subject: subject.trim(),
        samDesignation: designation.trim() || undefined,
        samPhone: phone.trim() || undefined,
        testMode,
      };

      const result = editing
        ? await completeMeeting(existingMeeting!.id, sharedPayload)
        : await sendMomEmail({
            accountId,
            scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
            meetingType,
            location: meetingType === 'PHYSICAL' ? location.trim() || undefined : undefined,
            ...sharedPayload,
          });
      const { emailStatus, emailReason } = result;
      const recipient = to.trim() || selectedAccount?.email || 'the customer';

      if (testMode) {
        const msg =
          'Test run complete — meeting saved, no email dispatched. Toggle off "Test mode" to send for real.';
        setSuccess(msg);
        toast.info('Test run saved', {
          description: 'No email was dispatched (test mode was on).',
        });
      } else if (emailStatus === 'SENT') {
        toast.success(`MoM email sent to ${recipient}`, {
          description: emailReason ? undefined : 'Customer should receive it within a few seconds.',
        });
        setOpen(false);
        reset();
      } else {
        const fallback = fallbackMessage(emailStatus);
        const rawReason = emailReason || fallback;
        const friendly = friendlyEmailError(emailReason);
        const inlineMessage = friendly
          ? `MoM saved, but the email did not go out. ${friendly.headline} ${friendly.hint}`
          : `MoM saved, but the email did not go out. ${rawReason}`;
        setError(inlineMessage);
        toast.error(friendly?.headline ?? 'Email not sent', {
          description: friendly?.hint ?? rawReason,
          duration: 10000,
        });
        // Dump the raw provider error to the console so devs / support can
        // copy-paste it without re-running the request.
        // eslint-disable-next-line no-console
        console.warn('[MoM email send failed]', { emailStatus, emailReason, recipient });
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send MoM email';
      setError(msg);
      toast.error('Failed to send MoM email', { description: msg, duration: 10000 });
      // eslint-disable-next-line no-console
      console.error('[MoM email send threw]', err);
    } finally {
      setSubmitting(false);
    }
  }

  const customerName =
    selectedAccount?.companyName || selectedAccount?.clientName || 'Customer';
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add MOM
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-5xl w-[90vw] max-h-[90vh] !gap-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {step === 1
              ? editing
                ? 'Complete Meeting'
                : 'Add MOM'
              : 'Send MOM Email'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {step === 1
              ? editing
                ? 'Fill in participants, action items and minutes — then compose the email.'
                : 'Record minutes of a meeting'
              : 'Compose the minutes-of-meeting email — preview it, then send to the customer.'}
          </DialogDescription>
          <StepIndicator step={step} />
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToStep2();
            }}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 relative">
                <Label htmlFor="mom-customer">
                  Customer<RequiredStar />
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="mom-customer"
                    value={selectedAccount ? labelFor(selectedAccount) : customerSearch}
                    onChange={(e) => {
                      if (editing) return;
                      setCustomerSearch(e.target.value);
                      setAccountId('');
                      setSearchOpen(true);
                    }}
                    onFocus={() => !editing && setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                    placeholder="Search by company, username, circuit ID"
                    className="pl-9"
                    readOnly={editing}
                    disabled={editing}
                  />
                </div>
                {!editing && searchOpen && filteredAccounts.length > 0 && (
                  <div className="absolute z-[60] left-0 top-full mt-1 w-[320px] max-w-[420px] bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                    {filteredAccounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAccountId(a.id);
                          setCustomerSearch('');
                          setSearchOpen(false);
                          setToEdited(false);
                          setSubjectEdited(false);
                          setBodyEdited(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm text-gray-900 font-medium truncate">
                          {a.companyName || a.clientName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {[a.customerCode, a.circuitId, a.companyName ? a.clientName : null]
                            .filter(Boolean)
                            .join(' · ') || a.clientName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mom-date">
                  Date<RequiredStar />
                </Label>
                <Input
                  id="mom-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  readOnly={editing}
                  disabled={editing}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mom-time">
                  Time<RequiredStar />
                </Label>
                <Input
                  id="mom-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  readOnly={editing}
                  disabled={editing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mom-type">Meeting Type</Label>
                <Select
                  value={meetingType}
                  onValueChange={(v) => setMeetingType(v as MeetingType)}
                  disabled={editing}
                >
                  <SelectTrigger id="mom-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {meetingType === 'PHYSICAL' && (
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="mom-venue">Venue</Label>
                  <Input
                    id="mom-venue"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune office, 10th floor"
                    readOnly={editing}
                    disabled={editing}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ParticipantList
                title="Client Participants"
                rows={clientPpts}
                onChange={setClientPpts}
              />
              <ParticipantList
                title="Gazon Participants"
                rows={gazonPpts}
                onChange={setGazonPpts}
              />
            </div>

            <ActionItemsTable items={items} onChange={setItems} />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-white flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!accountId || !date || !time}>
                Next: Compose Email
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mom-to">
                  To<RequiredStar />
                </Label>
                <Input
                  id="mom-to"
                  type="email"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setToEdited(true);
                  }}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mom-cc">CC</Label>
                <Input
                  id="mom-cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mom-subject">
                Subject<RequiredStar />
              </Label>
              <Input
                id="mom-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSubjectEdited(true);
                }}
                placeholder="Minutes of Meeting — Acme — 11 May 2026"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mom-body">
                Email Body<RequiredStar />
              </Label>
              <Textarea
                id="mom-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setBodyEdited(true);
                }}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Plain text. Paragraph breaks are preserved in the email. The body was
                auto-filled from your action items — edit as needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mom-designation">Designation</Label>
                <Input
                  id="mom-designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. AGM Service Assurance"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mom-phone">Phone</Label>
                <Input
                  id="mom-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 89562 38065"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewKey((k) => k + 1)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh Preview
              </Button>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                <span className="text-sm text-gray-700">
                  Test mode <span className="text-gray-500">— don&apos;t send email</span>
                </span>
              </label>
            </div>

            {testMode && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Test mode is ON. Submitting will save the meeting and MoM record, but no email
                will leave the box. Audit logs the attempt with{' '}
                <code className="bg-amber-100 px-1 rounded">testMode=true</code>.
              </div>
            )}

            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Email Preview</span>
              </div>

              {/* Envelope header */}
              <div className="rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700 flex flex-col gap-0.5 max-w-3xl mx-auto">
                <div>
                  <span className="text-gray-400 inline-block w-14">To:</span>
                  <span className="text-gray-900">{to || '—'}</span>
                </div>
                {cc.trim() && (
                  <div>
                    <span className="text-gray-400 inline-block w-14">CC:</span>
                    <span className="text-gray-900">{cc}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 inline-block w-14">Subject:</span>
                  <span className="text-gray-900 font-medium">{subject || '—'}</span>
                </div>
              </div>

              <div className="rounded-b-lg overflow-hidden" key={previewKey}>
                <MomFormattedPreview
                  customerName={customerName}
                  scheduledAt={new Date(`${date}T${time || '00:00'}:00`).toISOString()}
                  heldAt={null}
                  meetingType={meetingType}
                  location={meetingType === 'PHYSICAL' ? location : null}
                  clientParticipants={cleanClient}
                  gazonParticipants={cleanGazon}
                  actionItems={cleanItems}
                  body={body}
                  samName="Owning SAM"
                  designation={designation}
                  phone={phone}
                />
              </div>
            </div>

            {success && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <AlertDescription className="text-emerald-800">{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            </div>

            <div className="flex justify-between gap-2 px-6 py-3 border-t border-gray-100 bg-white flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setStep(1);
                }}
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting || copying}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void copyForOutlook();
                  }}
                  disabled={!accountId || !subject || !body || submitting || copying}
                  title="Copy the styled email to clipboard so you can paste it into Outlook and send from your own account."
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  {copying ? 'Copying…' : 'Copy for Outlook'}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    (!testMode && !to) || !subject || !body || submitting || copying
                  }
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting
                    ? testMode
                      ? 'Saving…'
                      : 'Sending…'
                    : testMode
                      ? 'Save (Test)'
                      : 'Send Email'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <StepPill index={1} active={step === 1} done={step > 1} label="Meeting details" />
      <div className="flex-1 h-px bg-orange-200" />
      <StepPill index={2} active={step === 2} done={false} label="Email preview & send" />
    </div>
  );
}

function StepPill({
  index,
  active,
  done,
  label,
}: {
  index: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  const tone = done
    ? 'bg-emerald-600 text-white'
    : active
      ? 'bg-brand-600 text-white'
      : 'bg-white text-gray-500 border border-gray-300';
  const labelTone = active || done ? 'text-gray-900 font-medium' : 'text-gray-500';
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${tone}`}
      >
        {index}
      </span>
      <span className={`text-xs ${labelTone}`}>{label}</span>
    </div>
  );
}

// ─── Participants ─────────────────────────────────────────────────────

function ParticipantList({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Participant[];
  onChange: (p: Participant[]) => void;
}) {
  function update(idx: number, patch: Partial<Participant>) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function add() {
    onChange([...rows, { name: '', position: '' }]);
  }
  function remove(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <button
          type="button"
          onClick={add}
          className="text-sm text-orange-600 font-medium hover:text-orange-700 inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder="Name"
              value={row.name}
              onChange={(e) => update(idx, { name: e.target.value })}
            />
            <Input
              placeholder="Position"
              value={row.position}
              onChange={(e) => update(idx, { position: e.target.value })}
            />
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-gray-400 hover:text-red-600 p-1"
                aria-label="Remove participant"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="w-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Action items table ───────────────────────────────────────────────

function ActionItemsTable({
  items,
  onChange,
}: {
  items: ActionItem[];
  onChange: (i: ActionItem[]) => void;
}) {
  function update(idx: number, patch: Partial<ActionItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function add() {
    onChange([...items, blankItem(items.length + 1)]);
  }
  function remove(idx: number) {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 }));
    onChange(next.length ? next : [blankItem(1)]);
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Action Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-orange-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">SR</th>
              <th className="px-3 py-2 text-left font-medium">Discussion Description</th>
              <th className="px-3 py-2 text-left font-medium">Action Owner</th>
              <th className="px-3 py-2 text-left font-medium">Plan of Action</th>
              <th className="px-3 py-2 text-left font-medium w-40">Closure Date</th>
              <th className="px-3 py-2 text-left font-medium w-32">Status</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Describe discussion..."
                    value={item.discussionDescription}
                    onChange={(e) => update(idx, { discussionDescription: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Owner"
                    value={item.actionOwner}
                    onChange={(e) => update(idx, { actionOwner: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Plan..."
                    value={item.planOfAction}
                    onChange={(e) => update(idx, { planOfAction: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="date"
                    value={item.closureDate ?? ''}
                    onChange={(e) => update(idx, { closureDate: e.target.value || null })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Select
                    value={item.currentStatus}
                    onValueChange={(v) =>
                      update(idx, { currentStatus: v as ActionItem['currentStatus'] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      aria-label="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fallbackMessage(status: EmailDispatchStatus): string {
  switch (status) {
    case 'SKIPPED':
      return 'Email transport is currently disabled — no email was sent.';
    case 'MISCONFIGURED':
      return 'Recipient or sender misconfigured. Check audit log for details.';
    case 'FAILED':
      return 'Email transport returned a failure. Check audit log for details.';
    case 'SENT':
      return '';
  }
}

/**
 * Translate the raw provider error string from the audit log into a one-line
 * headline + a one-line actionable hint. Picks the first pattern that matches.
 * Returns null when nothing matches — caller falls back to the raw text.
 *
 * Patterns are matched substring-insensitive against the WHOLE reason string
 * so they catch both the orchestrator's prefix (e.g. "Netcore rejected: …")
 * and the provider's own wording.
 */
function friendlyEmailError(
  reason: string | undefined,
): { headline: string; hint: string } | null {
  if (!reason) return null;
  const r = reason.toLowerCase();

  if (r.includes('whitelist your ip') || r.includes('please whitelist')) {
    return {
      headline: 'Netcore rejected: this server’s IP isn’t allowlisted.',
      hint:
        'Ask your admin to add the backend’s public IP to the Netcore API-key allowlist. ' +
        'See backend audit log for the exact reason.',
    };
  }
  if (r.includes('invalid api_key') || r.includes('invalid api key')) {
    return {
      headline: 'Netcore rejected: API key is invalid.',
      hint:
        'The NETCORE_API_KEY in the backend env doesn’t match any active key on Netcore. ' +
        'Admin needs to re-copy from the Netcore dashboard.',
    };
  }
  if (r.includes('domain') && (r.includes('not verified') || r.includes('unverified'))) {
    return {
      headline: 'Sender domain not verified on Netcore.',
      hint: 'The sender address’ domain has to be DKIM/SPF-verified in Netcore.',
    };
  }
  if (r.includes('no customer email')) {
    return {
      headline: 'This customer has no email address on record.',
      hint: 'Edit the customer to add an email, then resend.',
    };
  }
  if (r.includes('not configured') || r.includes('transport not configured')) {
    return {
      headline: 'Email transport is disabled on the server.',
      hint: 'Admin needs to flip EMAIL_TRANSPORT to netcore/resend/smtp and restart the backend.',
    };
  }
  if (r.includes('network error') || r.includes('econnrefused') || r.includes('etimedout')) {
    return {
      headline: 'Couldn’t reach the email provider.',
      hint: 'Likely a network / firewall issue. Try again in a minute; if it persists, contact admin.',
    };
  }
  return null;
}

// ─── Body autocompose ─────────────────────────────────────────────────

function composeBodyFromMeeting(input: {
  clientName: string;
  companyName: string | null;
  actionItems: ActionItem[];
}): string {
  const lines: string[] = [];
  lines.push(`Dear ${input.clientName},`);
  lines.push('');
  lines.push(
    'Thank you for your time. Please find below the minutes of our recent meeting.',
  );
  if (input.actionItems.length > 0) {
    lines.push('');
    lines.push('Action items:');
    for (const it of input.actionItems) {
      const owner = it.actionOwner ? ` (Owner: ${it.actionOwner})` : '';
      const plan = it.planOfAction ? ` — ${it.planOfAction}` : '';
      lines.push(`- ${it.discussionDescription}${owner}${plan}`);
    }
  }
  lines.push('');
  lines.push('Reply to this email if anything needs correction.');
  return lines.join('\n');
}

// ─── Tiny utils ───────────────────────────────────────────────────────

function RequiredStar() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden="true">
      *
    </span>
  );
}

function blankItem(srNo: number): ActionItem {
  return {
    srNo,
    discussionDescription: '',
    actionOwner: '',
    planOfAction: '',
    closureDate: null,
    currentStatus: 'Open',
  };
}

function labelFor(a: Account): string {
  return a.companyName || a.clientName;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowHm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isoDateOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return todayIso();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoTimeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowHm();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatHumanDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHumanDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
