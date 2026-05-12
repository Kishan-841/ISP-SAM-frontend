'use client';

import { CheckCircle2, AlertTriangle, Send } from 'lucide-react';
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
  | { ok: 'probable-churn' };

/*
 * Post-commit confirmation modal. Originally exposed an email draft + copy /
 * download buttons; that's been removed — operators didn't use it and the
 * accounts-team notification fires via the backend's notification bridge
 * anyway. The modal now just confirms the change + reports the CRM outcome.
 * The `draft` prop is retained as the "there's a result to show" gate so
 * the caller in CommercialChangeForm needs no changes.
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

  const actionLabel = changeType ? CHANGE_LABEL[changeType] : 'change';
  const actionTitle = changeType
    ? `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} confirmed`
    : 'Change confirmed';
  const forClient = clientName ? ` for ${clientName}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">{actionTitle}</DialogTitle>
        </DialogHeader>

        {/* Confirmation banner — green, prominent, action-aware */}
        <div className="flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-emerald-900">{actionTitle}</p>
            <p className="text-sm text-emerald-800 leading-relaxed">
              The {actionLabel}
              {forClient} has been recorded with the client&apos;s approval attached.
            </p>
          </div>
        </div>

        {/* CRM service-order outcome */}
        {crm && crm.ok === true && (
          <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4">
            <Send className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-blue-900">
                Service order created in CRM · {crm.orderNumber}
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
                Status:{' '}
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200">
                  {crm.status}
                </span>{' '}
                — the relevant CRM team has been notified and will action it.
              </p>
            </div>
          </div>
        )}
        {crm && crm.ok === 'local-only' && (
          <div className="flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-emerald-900">
                Applied immediately — no CRM order
              </p>
              <p className="text-sm text-emerald-800 leading-relaxed">
                This customer was imported (no CRM external ID), so the new ARC, bandwidth and
                status have been written to the account directly. The change is already visible on
                the Existing Base dashboard.
              </p>
            </div>
          </div>
        )}
        {crm && crm.ok === 'probable-churn' && (
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-amber-900">
                Probable churn — 21-day retention window started
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                The customer is in the retention queue. SAM will be prompted on day 21 to either
                retain (via a rate revision) or proceed with disconnection.
              </p>
            </div>
          </div>
        )}
        {crm && crm.ok === false && (
          <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-red-900">
                CRM service-order failed{crm.status ? ` (${crm.status})` : ''}
              </p>
              <p className="text-sm text-red-800 leading-relaxed">{crm.error}</p>
              <p className="text-xs text-red-700 mt-1">
                The SAM-side change is saved; the CRM bridge can be retried from the Transactions
                page.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
