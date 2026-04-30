'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logMeeting } from '../services/meetings';
import type { Account } from '../services/accounts';

export function LogMeetingDialog({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayIso());
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [agenda, setAgenda] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAccountId('');
    setScheduledDate(todayIso());
    setScheduledTime('10:00');
    setAgenda('');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId || !scheduledDate || !scheduledTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await logMeeting({
        accountId,
        scheduledAt,
        agenda: agenda.trim() || undefined,
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log meeting');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="w-4 h-4 mr-2" />
          Log New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a new meeting</DialogTitle>
          <DialogDescription>
            Schedule the meeting now. Mark it as held and write the MoM after the meeting.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="meeting-customer">
              Customer
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            </Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="meeting-customer" className="w-full h-9">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.clientName}
                    {a.customerCode ? ` (${a.customerCode})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meeting-date">
                Date
                <span className="ml-0.5 text-red-500" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="meeting-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meeting-time">
                Time
                <span className="ml-0.5 text-red-500" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="meeting-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meeting-agenda">Agenda (optional)</Label>
            <Textarea
              id="meeting-agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="e.g. Q1 review, discuss bandwidth uplift"
              rows={3}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!accountId || !scheduledDate || !scheduledTime || submitting}
            >
              {submitting ? 'Logging…' : 'Log meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
