'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { submitMom } from '../services/meetings';

export function MomEditor({
  meetingId,
  initialContent,
  alreadySent,
}: {
  meetingId: string;
  initialContent: string | null;
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await submitMom(meetingId, content.trim());
      setConfirmation('MoM recorded and timestamp captured. Compliance: ✓');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit MoM');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="mom-content">
          Minutes of Meeting
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="mom-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What was discussed?\n\nAction items:\n- ...\n- ...\n\nNext steps:\n- ...`}
          rows={10}
          required
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {confirmation && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-emerald-800">{confirmation}</AlertDescription>
        </Alert>
      )}
      <div>
        <Button type="submit" disabled={!content.trim() || busy}>
          <Send className="w-4 h-4 mr-2" />
          {busy ? 'Sending…' : alreadySent ? 'Re-send MoM' : 'Send MoM'}
        </Button>
      </div>
    </form>
  );
}
