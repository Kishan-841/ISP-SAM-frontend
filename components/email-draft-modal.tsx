'use client';

import { useState } from 'react';
import { Copy, Download, Check, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ChangeType = 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'TERMINATION';

const CHANGE_LABEL: Record<ChangeType, string> = {
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
  RATE_REVISION: 'rate revision',
  TERMINATION: 'termination',
};

export function EmailDraftModal({
  open,
  onOpenChange,
  draft,
  changeType,
  clientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: { subject: string; body: string } | null;
  changeType?: ChangeType | null;
  clientName?: string | null;
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
              The {actionLabel}{forClient} has been recorded with the client&apos;s approval
              attached. The Accounts team will be notified and will update billing — copy or
              download the draft below to send the alert immediately.
            </p>
          </div>
        </div>

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
