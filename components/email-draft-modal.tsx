'use client';

import type { ComponentType } from 'react';
import { CheckCircle2, AlertTriangle, Send, Clock, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ChangeType = 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';

const CHANGE_LABEL: Record<ChangeType, string> = {
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
  RATE_REVISION: 'rate revision',
  DISCONNECTION: 'disconnection',
};

type CrmOutcome =
  | { ok: true; orderId: string; orderNumber: string; status: string }
  | { ok: false; error: string; status?: number }
  | { ok: 'disabled' }
  | { ok: 'local-only' }
  | { ok: 'probable-churn' }
  | { ok: 'pending-quick-approval' }
  | { ok: 'pending-approval'; stage: string };

type Tone = 'success' | 'info' | 'pending' | 'error';

const TONE_BADGE: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  info: 'bg-brand-50 text-brand-600 ring-brand-100',
  pending: 'bg-amber-50 text-amber-600 ring-amber-100',
  error: 'bg-red-50 text-red-600 ring-red-100',
};

type Outcome = {
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  detail?: React.ReactNode;
};

/**
 * Post-commit confirmation modal. One clean status card per outcome — a tinted
 * icon badge, a short title, and one or two plain-language lines — instead of
 * stacked pastel banners. The `draft` prop is retained purely as the
 * "there's a result to show" gate so the caller needs no changes.
 */
export function EmailDraftModal({
  open,
  onOpenChange,
  draft,
  changeType,
  clientName,
  crm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: { subject: string; body: string } | null;
  changeType?: ChangeType | null;
  clientName?: string | null;
  crm?: CrmOutcome | null;
}) {
  if (!draft) return null;

  const outcome = resolveOutcome(crm ?? null, changeType ?? null, clientName ?? null);
  const Icon = outcome.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Override the primitive's `sm:max-w-sm` cap (a base `max-w-md` loses to
          it) so the header/footer don't overflow the card on the right. */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{outcome.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center gap-4 pt-2 pb-1">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full ring-1 ${TONE_BADGE[outcome.tone]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{outcome.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">{outcome.body}</p>
          </div>
          {outcome.detail}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)} className="min-w-28">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function resolveOutcome(
  crm: CrmOutcome | null,
  changeType: ChangeType | null,
  clientName: string | null,
): Outcome {
  const action = changeType ? CHANGE_LABEL[changeType] : 'change';
  const forClient = clientName ? ` for ${clientName}` : '';

  if (crm && crm.ok === true) {
    return {
      tone: 'info',
      icon: Send,
      title: 'Sent to CRM',
      body: `The order was created — the CRM team will action it${forClient}.`,
      detail: (
        <DetailChip>
          Order <span className="font-mono">{crm.orderNumber}</span>
          <Dot />
          {formatStatus(crm.status)}
        </DetailChip>
      ),
    };
  }

  if (crm && crm.ok === 'local-only') {
    return {
      tone: 'success',
      icon: CheckCircle2,
      title: 'Applied',
      body: `The ${action}${forClient} is live on the Existing Base dashboard.`,
    };
  }

  if (crm && crm.ok === 'probable-churn') {
    return {
      tone: 'pending',
      icon: Clock,
      title: 'Retention started',
      body: `${
        clientName ?? 'The customer'
      } enters a 21-day window. You'll be prompted to retain or proceed on day 21.`,
    };
  }

  if (crm && crm.ok === 'pending-quick-approval') {
    return {
      tone: 'pending',
      icon: Clock,
      title: 'Awaiting CRM Admin',
      body: 'Quick disconnect skips retention. It stays on hold until CRM Admin decides — you’ll be notified.',
    };
  }

  if (crm && crm.ok === 'pending-approval') {
    const withWhom =
      crm.stage === 'PENDING_SUPER_ADMIN_2' ? 'Super Admin 2' : 'the Accounts team';
    return {
      tone: 'info',
      icon: ShieldCheck,
      title: 'Sent for approval',
      body: `Now with ${withWhom}. It goes live once approved — you'll be notified if it's approved or rejected.`,
      detail: <DetailChip>Awaiting {withWhom}</DetailChip>,
    };
  }

  if (crm && crm.ok === false) {
    return {
      tone: 'error',
      icon: AlertTriangle,
      title: 'Saved — CRM sync failed',
      body: `${crm.error}. The change is saved on SAM; retry the CRM sync from Transactions.`,
    };
  }

  // disabled, or no CRM result at all.
  return {
    tone: 'success',
    icon: CheckCircle2,
    title: `${cap(action)} recorded`,
    body: `The ${action}${forClient} is saved with the client’s approval attached.`,
  };
}

function DetailChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
      {children}
    </span>
  );
}

function Dot() {
  return <span className="text-gray-300">·</span>;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
