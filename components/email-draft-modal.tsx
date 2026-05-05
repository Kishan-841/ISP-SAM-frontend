'use client';

import { useState } from 'react';
import { Copy, Download, Check, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
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
  | { ok: 'disabled' };

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
  const [copied, setCopied] = useState(false);

  if (!draft) return null;

  async function copy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!draft) return;
    const blob = new Blob([draft.body], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.subject.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60)}.eml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actionLabel = changeType ? CHANGE_LABEL[changeType] : 'change';
  const actionTitle = changeType
    ? `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} confirmed`
    : 'Change confirmed';
  const forClient = clientName ? ` for ${clientName}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{actionTitle}</DialogTitle>
        </DialogHeader>

        {/* Confirmation banner — green, prominent, action-aware */}
        <div className="flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-emerald-900">{actionTitle}</p>
            <p className="text-sm text-emerald-800 leading-relaxed">
              The {actionLabel}{forClient} has been recorded on this side with the client&apos;s
              approval attached.
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
        {crm && crm.ok === false && (
          <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-red-900">
                CRM service-order failed{crm.status ? ` (${crm.status})` : ''}
              </p>
              <p className="text-sm text-red-800 leading-relaxed">{crm.error}</p>
              <p className="text-xs text-red-700 mt-1">
                The SAM-side change is saved. Use the email draft below as a fallback while the
                CRM bridge is investigated.
              </p>
            </div>
          </div>
        )}

        {/* Email draft preview */}
        <div className="bg-gray-50 rounded-md border border-gray-200 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Accounts Team Draft</p>
          <p className="text-sm font-semibold text-gray-900 mb-2">{draft.subject}</p>
          <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-80 overflow-y-auto">
            {draft.body}
          </pre>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={download}>
            <Download className="w-4 h-4 mr-2" />
            Download .eml
          </Button>
          <Button onClick={copy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
