'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function EmailDraftModal({
  open,
  onOpenChange,
  draft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: { subject: string; body: string } | null;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Accounts Team Draft Generated</DialogTitle>
          <DialogDescription>
            Copy-paste into your mail client, or download as .eml. Compliance is
            satisfied either way.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 rounded-md border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">{draft.subject}</p>
          <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-96 overflow-y-auto">
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
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
