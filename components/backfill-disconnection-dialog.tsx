'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Save, UserMinus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { backfillDisconnection } from '../services/commercial-changes';
import { formatRupees } from '../lib/format-rupees';
import type { Account } from '../services/accounts';

/**
 * Admin-only modal for recording a historical disconnection. The
 * customer should already be in a non-TERMINATED state (operators
 * typically re-activate a wrongly-imported "Deactive" row first).
 *
 * On submit:
 *  - One commercial_change row is created with everything pre-stamped
 *    (effectiveDate=last billing date, accountAppliedAt=same,
 *    crmStatus=BACKFILL_LOCAL, retentionDecision=PROCEED).
 *  - The account flips to TERMINATED with currentArc=0.
 *  - Audit-logged with the admin's IP.
 */
export function BackfillDisconnectionDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerName = account.companyName || account.clientName;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!effectiveDate) {
      setError('Last billing date is required');
      setSubmitting(false);
      return;
    }
    if (reason.trim().length < 3) {
      setError('Reason must be at least 3 characters');
      setSubmitting(false);
      return;
    }

    try {
      const result = await backfillDisconnection({
        accountId: account.id,
        effectiveDate,
        reason: reason.trim(),
      });
      toast.success('Disconnection backfilled', {
        description: `${result.account.clientName} terminated as of ${result.commercialChange.effectiveDate}. ARC of ${formatRupees(result.commercialChange.oldArc)} now counts as lost.`,
        duration: 8000,
      });
      onOpenChange(false);
      // Reset for the next backfill on a different customer.
      setEffectiveDate('');
      setReason('');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Backfill failed';
      setError(msg);
      toast.error('Backfill failed', { description: msg, duration: 10000 });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-b from-red-50/70 to-white flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-gray-900 leading-tight">
                Backfill disconnection
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {customerName} · records a historical disconnection without going through CRM
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-5">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-xs text-amber-900">
              <strong>Use this only for events that already happened.</strong> No CRM service order
              is raised, no approval is required. The account immediately flips to TERMINATED with
              ARC=0 and the dashboard counts this loss in the month of the last billing date.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                Current ARC at disconnection
              </Label>
              <div className="text-sm font-mono text-gray-900 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {formatRupees(Number(account.currentArc))}
              </div>
              <p className="text-[11px] text-gray-500">
                Snapshotted into the commercial_change row as oldArc.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                Last billing date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Used as effectiveDate AND accountAppliedAt.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Office Closed, Shifted to WFH, Service issue, Customer not responding on call/mail"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
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
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {submitting ? 'Recording…' : 'Record disconnection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
