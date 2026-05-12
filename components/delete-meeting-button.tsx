'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import { deleteMeeting } from '../services/meetings';

/**
 * Admin-only "Delete meeting" trigger for the per-meeting viewer page.
 * On success, navigates back to /meetings.
 */
export function DeleteMeetingButton({
  meetingId,
  customerName,
}: {
  meetingId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteMeeting(meetingId);
      router.push('/meetings');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete meeting
      </button>
      {open && (
        <ConfirmDeleteDialog
          title="Delete meeting?"
          description={
            <>
              The meeting for{' '}
              <span className="font-semibold text-gray-900">{customerName}</span> will be
              permanently removed (including the MoM content). The deletion is recorded in the
              audit log.
            </>
          }
          confirmLabel="Delete meeting"
          busy={busy}
          onCancel={() => {
            setOpen(false);
            setError(null);
          }}
          onConfirm={onConfirm}
        />
      )}
      {error && (
        <span className="text-xs text-red-700 self-center" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
