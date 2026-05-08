'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CalendarPlus, Loader2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { refreshCrmStatus, setActivationDate } from '../services/commercial-changes';

/**
 * Per-row action cluster for the transactions table.
 *  - Refresh: pulls latest status from CRM and persists.
 *  - Set Activation Date: appears only when crmStatus=PENDING_SAM_ACTIVATION;
 *    opens a small dialog for the SAM operator to enter the customer-confirmed
 *    billing-start date and POSTs to CRM's /set-activation-date endpoint.
 */
export function CrmRowActions({
  changeId,
  crmStatus,
  hasCrmOrder,
}: {
  changeId: string;
  crmStatus: string | null;
  hasCrmOrder: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'refresh' | 'activate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activationOpen, setActivationOpen] = useState(false);
  const [activationDate, setActivationDateValue] = useState(todayIso());

  if (!hasCrmOrder) return <span className="text-xs text-gray-400">—</span>;

  async function onRefresh(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy('refresh');
    setError(null);
    try {
      await refreshCrmStatus(changeId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setBusy(null);
    }
  }

  async function onSubmitActivation() {
    setBusy('activate');
    setError(null);
    try {
      await setActivationDate(changeId, activationDate);
      setActivationOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setBusy(null);
    }
  }

  const showActivationCta = crmStatus === 'PENDING_SAM_ACTIVATION';

  return (
    <div className="flex items-center justify-center gap-1.5">
      {showActivationCta && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActivationOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-brand-700/20 hover:from-brand-600 hover:to-brand-700 hover:shadow transition-all whitespace-nowrap"
          title="Enter the customer-confirmed billing-start date"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Set Activation
        </button>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy === 'refresh'}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-brand-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:opacity-50 transition-all"
        title="Refresh status from CRM"
      >
        {busy === 'refresh' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-600 max-w-[120px] truncate" title={error}>
          {error}
        </span>
      )}

      {/* Set-activation-date dialog */}
      <Dialog open={activationOpen} onOpenChange={setActivationOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-1 ring-orange-200/50 flex-shrink-0">
                <CalendarPlus className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <DialogTitle className="text-base">Set activation date</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Confirm the billing-start date the customer agreed to.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="bg-gray-50/60 px-6 pt-5 pb-8 flex flex-col gap-4">
            {/* Status transition hint */}
            <div className="rounded-xl bg-white ring-1 ring-gray-200 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                What this does
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-mono px-2 py-1 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  PENDING_SAM_ACTIVATION
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono px-2 py-1 rounded bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  PENDING_ACCOUNTS
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2.5">
                CRM Accounts will pick the order up from here and finalise billing.
              </p>
            </div>

            {/* Date input */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="activation-date"
                className="text-[11px] font-semibold uppercase tracking-wider text-gray-500"
              >
                Activation date
              </Label>
              <Input
                id="activation-date"
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDateValue(e.target.value)}
                className="h-11 bg-white"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-6 bg-white border-t border-gray-100 sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setActivationOpen(false)}
              disabled={busy === 'activate'}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmitActivation}
              disabled={busy === 'activate'}
              className="bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 min-w-[120px]"
            >
              {busy === 'activate' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
