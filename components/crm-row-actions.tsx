'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CalendarPlus, Loader2 } from 'lucide-react';
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
    <div className="flex items-center justify-center gap-1">
      {showActivationCta && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActivationOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded border border-brand-300 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100"
          title="Enter the customer-confirmed billing-start date"
        >
          <CalendarPlus className="w-3 h-3" />
          Set Activation
        </button>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy === 'refresh'}
        className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Activation Date</DialogTitle>
            <DialogDescription>
              Enter the billing-start date the customer agreed to. This advances the order from
              <span className="mx-1 font-mono text-xs">PENDING_SAM_ACTIVATION</span>
              to
              <span className="ml-1 font-mono text-xs">PENDING_ACCOUNTS</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="activation-date">Activation date</Label>
            <Input
              id="activation-date"
              type="date"
              value={activationDate}
              onChange={(e) => setActivationDateValue(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActivationOpen(false)}
              disabled={busy === 'activate'}
            >
              Cancel
            </Button>
            <Button onClick={onSubmitActivation} disabled={busy === 'activate'}>
              {busy === 'activate' ? 'Submitting…' : 'Submit'}
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
