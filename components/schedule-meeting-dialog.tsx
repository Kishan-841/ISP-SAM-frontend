'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { logMeeting, type MeetingType } from '../services/meetings';
import type { Account } from '../services/accounts';

/**
 * Schedule a future meeting (no MOM yet). Lands on the calendar as
 * SCHEDULED. Later, when the meeting actually happens, the SAM clicks
 * into the meeting detail and uses 'Mark as Held' + the existing MOM
 * flow to record the outcome.
 */
export function ScheduleMeetingDialog({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('10:00');
  const [meetingType, setMeetingType] = useState<MeetingType>('ONLINE');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  const filteredAccounts = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return accounts.slice(0, 25);
    return accounts
      .filter((a) =>
        [a.clientName, a.companyName, a.customerCode, a.circuitId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [accounts, customerSearch]);

  function reset() {
    setAccountId('');
    setCustomerSearch('');
    setSearchOpen(false);
    setDate(todayIso());
    setTime('10:00');
    setMeetingType('ONLINE');
    setLocation('');
    setAgenda('');
    setError(null);
  }

  async function submit() {
    if (!accountId || !date || !time) {
      setError('Customer, date and time are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await logMeeting({
        accountId,
        scheduledAt,
        meetingType,
        location: meetingType === 'PHYSICAL' ? location.trim() || undefined : undefined,
        agenda: agenda.trim() || undefined,
        // No participants, no action items — gets filled in when MOM is recorded later.
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
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
        <Button variant="outline">
          <CalendarClock className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl w-[90vw] !gap-0 p-0 overflow-hidden">
        <DialogHeader className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Schedule Meeting</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Add a meeting to the calendar. Record the MOM after the meeting actually happens.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="px-6 py-5 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2 relative">
            <Label htmlFor="schedule-customer">
              Customer<RequiredStar />
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                id="schedule-customer"
                value={selectedAccount ? labelFor(selectedAccount) : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setAccountId('');
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search by company, name, customer code, circuit ID"
                className="pl-9"
              />
            </div>
            {searchOpen && filteredAccounts.length > 0 && (
              <div className="absolute z-[60] left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                {filteredAccounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAccountId(a.id);
                      setCustomerSearch('');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm text-gray-900 font-medium truncate">
                      {a.companyName || a.clientName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {[a.customerCode, a.circuitId, a.companyName ? a.clientName : null]
                        .filter(Boolean)
                        .join(' · ') || a.clientName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="schedule-date">
                Date<RequiredStar />
              </Label>
              <Input
                id="schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="schedule-time">
                Time<RequiredStar />
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Meeting Type</Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {meetingType === 'PHYSICAL' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="schedule-venue">Venue</Label>
              <Input
                id="schedule-venue"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Customer office, 4th floor"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule-agenda">Agenda (optional)</Label>
            <Textarea
              id="schedule-agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Topics, items to discuss, follow-ups…"
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 -mx-6 px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Scheduling…' : 'Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function labelFor(a: Account): string {
  const company = a.companyName || a.clientName;
  return a.customerCode ? `${company} · ${a.customerCode}` : company;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>;
}
