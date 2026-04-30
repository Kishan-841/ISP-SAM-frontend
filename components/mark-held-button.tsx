'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markHeld } from '../services/meetings';

export function MarkHeldButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      await markHeld(meetingId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark held');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onClick} disabled={busy}>
        <Check className="w-4 h-4 mr-2" />
        {busy ? 'Marking…' : 'Mark as Held'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
