'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hourglass,
  ShieldAlert,
  UserX,
  Zap,
} from 'lucide-react';

/**
 * Post-submit confirmation panel for a disconnection commercial change.
 *
 * The form's "Customer notice date" field is the *trigger* for a 21-day
 * retention window — service stays live until day 21, then a PROCEED action
 * opens, and termination follows 10 days after that via the CRM flow.
 * SAMs don't always grasp this from a one-line success toast, so we render
 * a stepped timeline that makes every milestone (and its date) explicit.
 *
 * Constants match backend `PROBABLE_CHURN_WINDOW_DAYS` (21) plus the
 * downstream 10-day disconnection notice handled by CRM workflow.
 */

const RETENTION_DAYS = 21;
const NOTICE_DAYS = 10;

export function DisconnectionTimeline({
  customerName,
  customerNoticeDateIso,
  accountId,
  onRaiseAnother,
  mode = 'NORMAL',
  quickRequestedDays,
  quickApprovalReason,
}: {
  customerName: string;
  /** YYYY-MM-DD string from the form (formerly "effective date"). */
  customerNoticeDateIso: string;
  accountId: string;
  /** Called when the user wants to reset and raise another change. */
  onRaiseAnother: () => void;
  /** 'NORMAL' (21-day retention) or 'QUICK' (waiting on CRM Admin). */
  mode?: 'NORMAL' | 'QUICK';
  /** Required when mode='QUICK' — surfaced on the pending-approval timeline. */
  quickRequestedDays?: number;
  /** Required when mode='QUICK' — echoed back so SAM can confirm what they sent. */
  quickApprovalReason?: string;
}) {
  if (mode === 'QUICK') {
    return (
      <QuickDisconnectPendingPanel
        customerName={customerName}
        customerNoticeDateIso={customerNoticeDateIso}
        accountId={accountId}
        onRaiseAnother={onRaiseAnother}
        quickRequestedDays={quickRequestedDays ?? 7}
        quickApprovalReason={quickApprovalReason ?? ''}
      />
    );
  }

  const notice = parseIsoDate(customerNoticeDateIso);
  const retentionEnds = addDays(notice, RETENTION_DAYS);
  const terminatedOn = addDays(retentionEnds, NOTICE_DAYS);

  const steps: Step[] = [
    {
      tone: 'done',
      icon: CalendarDays,
      label: 'Notice received',
      date: notice,
      hint: `${customerName} notified you they want to disconnect.`,
    },
    {
      tone: 'active',
      icon: ShieldAlert,
      label: 'Retention window',
      date: retentionEnds,
      hint: `Until ${formatLong(retentionEnds)}, you can RETAIN the customer if they change their mind. Submit any non-disconnection change to auto-retain.`,
    },
    {
      tone: 'future',
      icon: Clock,
      label: 'Proceed available',
      date: retentionEnds,
      hint: 'On day 21 the PROCEED button opens on the Probable Churn queue. Click it to raise the CRM disconnection order.',
    },
    {
      tone: 'future',
      icon: UserX,
      label: 'Customer terminated',
      date: terminatedOn,
      hint: `If you proceed on day 21, CRM completes termination ${NOTICE_DAYS} days later (the contractual notice period).`,
    },
  ];

  return (
    <section
      className="bg-white rounded-xl border border-gray-200 px-6 py-6 flex flex-col gap-6"
      aria-label="Disconnection timeline"
    >
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            Disconnection notice recorded for {customerName}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Service stays live for {RETENTION_DAYS + NOTICE_DAYS} more days unless you retain. Here&apos;s what
            happens next.
          </p>
        </div>
      </header>

      {/* Timeline */}
      <ol className="relative flex flex-col gap-5 pl-7 border-l-2 border-gray-100">
        {steps.map((step, i) => (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[34px] grid place-items-center w-7 h-7 rounded-full ring-4 ring-white ${STEP_TONE[step.tone].bg}`}
            >
              <step.icon className={`w-3.5 h-3.5 ${STEP_TONE[step.tone].icon}`} />
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${STEP_TONE[step.tone].label}`}>
                  {step.label}
                </span>
                <span className="text-xs text-gray-500 tabular-nums">
                  {formatLong(step.date)}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onRaiseAnother}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
        >
          Raise another change
        </button>
        <Link
          href={`/customers/${accountId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
        >
          Open customer journey
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/probable-churn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
        >
          View on Probable Churn
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

// ─── Quick-disconnect pending panel ───────────────────────────────────

function QuickDisconnectPendingPanel({
  customerName,
  customerNoticeDateIso,
  accountId,
  onRaiseAnother,
  quickRequestedDays,
  quickApprovalReason,
}: {
  customerName: string;
  customerNoticeDateIso: string;
  accountId: string;
  onRaiseAnother: () => void;
  quickRequestedDays: number;
  quickApprovalReason: string;
}) {
  const notice = parseIsoDate(customerNoticeDateIso);
  const earliestTermination = addDays(new Date(), quickRequestedDays);

  return (
    <section
      className="bg-white rounded-xl border border-amber-200 px-6 py-6 flex flex-col gap-6"
      aria-label="Quick disconnect pending approval"
    >
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 grid place-items-center flex-shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            Quick disconnect request sent for {customerName}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Waiting on CRM Admin to approve. The 21-day retention window is bypassed for this
            request.
          </p>
        </div>
      </header>

      {/* Reason echo so SAM can confirm what they sent */}
      <div className="rounded-md bg-amber-50/60 border border-amber-200 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
          Reason sent to CRM Admin
        </p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {quickApprovalReason || <span className="italic text-gray-400">No reason recorded</span>}
        </p>
      </div>

      {/* Two-step pending timeline */}
      <ol className="relative flex flex-col gap-5 pl-7 border-l-2 border-gray-100">
        <li className="relative">
          <span className="absolute -left-[34px] grid place-items-center w-7 h-7 rounded-full ring-4 ring-white bg-emerald-50">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">Notice received</span>
              <span className="text-xs text-gray-500 tabular-nums">{formatLong(notice)}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              You raised a quick-disconnect request for {customerName}. The account is on hold
              until CRM Admin decides.
            </p>
          </div>
        </li>
        <li className="relative">
          <span className="absolute -left-[34px] grid place-items-center w-7 h-7 rounded-full ring-4 ring-white bg-amber-50">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-amber-900">
                Awaiting CRM Admin approval
              </span>
              <span className="text-xs text-gray-500">pending</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Once approved, the customer is terminated {quickRequestedDays}{' '}
              {quickRequestedDays === 1 ? 'day' : 'days'} later — earliest{' '}
              <span className="font-medium text-gray-900">{formatLong(earliestTermination)}</span>{' '}
              if the admin approves today. If rejected, the account returns to ACTIVE and you can
              resubmit as a normal disconnection.
            </p>
          </div>
        </li>
        <li className="relative">
          <span className="absolute -left-[34px] grid place-items-center w-7 h-7 rounded-full ring-4 ring-white bg-gray-50">
            <UserX className="w-3.5 h-3.5 text-gray-400" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Customer terminated</span>
              <span className="text-xs text-gray-500">
                {quickRequestedDays} day{quickRequestedDays === 1 ? '' : 's'} after approval
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              CRM applies the termination on the scheduled day. You&apos;ll be notified the moment
              the decision lands either way.
            </p>
          </div>
        </li>
      </ol>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onRaiseAnother}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
        >
          Raise another change
        </button>
        <Link
          href={`/customers/${accountId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
        >
          Open customer journey
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

type StepTone = 'done' | 'active' | 'future';

type Step = {
  tone: StepTone;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  date: Date;
  hint: string;
};

const STEP_TONE: Record<StepTone, { bg: string; icon: string; label: string }> = {
  done:   { bg: 'bg-emerald-50', icon: 'text-emerald-600', label: 'text-gray-900' },
  active: { bg: 'bg-amber-50',   icon: 'text-amber-600',   label: 'text-amber-900' },
  future: { bg: 'bg-gray-50',    icon: 'text-gray-400',    label: 'text-gray-700' },
};

function parseIsoDate(iso: string): Date {
  // Force midday UTC so timezone offsets don't shift the displayed date.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 12));
  return new Date(iso);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatLong(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
