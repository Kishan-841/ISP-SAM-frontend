'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Plus, Search, Trash2, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logMeeting, type ActionItem, type MeetingType } from '../services/meetings';
import type { Account } from '../services/accounts';

type Participant = { name: string; position: string };

const STATUS_OPTIONS: ActionItem['currentStatus'][] = ['Open', 'In Progress', 'Closed'];

export function AddMomDialog({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('ONLINE');
  const [location, setLocation] = useState('');
  const [clientPpts, setClientPpts] = useState<Participant[]>([{ name: '', position: '' }]);
  const [gazonPpts, setGazonPpts] = useState<Participant[]>([{ name: '', position: '' }]);
  const [items, setItems] = useState<ActionItem[]>([blankItem(1)]);
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
    setTime('');
    setMeetingType('ONLINE');
    setLocation('');
    setClientPpts([{ name: '', position: '' }]);
    setGazonPpts([{ name: '', position: '' }]);
    setItems([blankItem(1)]);
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
      const cleanClient = clientPpts.filter((p) => p.name.trim());
      const cleanGazon = gazonPpts.filter((p) => p.name.trim());
      const cleanItems = items
        .filter((i) => i.discussionDescription.trim())
        .map((i, idx) => ({ ...i, srNo: idx + 1 }));
      await logMeeting({
        accountId,
        scheduledAt,
        meetingType,
        location: meetingType === 'PHYSICAL' ? location.trim() || undefined : undefined,
        clientParticipants: cleanClient.length ? JSON.stringify(cleanClient) : undefined,
        gazonParticipants: cleanGazon.length ? JSON.stringify(cleanGazon) : undefined,
        actionItems: cleanItems.length ? cleanItems : undefined,
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save MOM');
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
          Add MOM
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl w-[80vw] !gap-0 p-0 overflow-hidden">
        <DialogHeader className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">Add MOM</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Record minutes of a meeting
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 relative">
              <Label htmlFor="mom-customer">
                Customer<RequiredStar />
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="mom-customer"
                  value={selectedAccount ? labelFor(selectedAccount) : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setAccountId('');
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Search by company, username, circuit ID"
                  className="pl-9"
                />
              </div>
              {searchOpen && filteredAccounts.length > 0 && (
                <div className="absolute z-[60] left-0 top-full mt-1 w-[320px] max-w-[420px] bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="mom-date">
                Date<RequiredStar />
              </Label>
              <Input
                id="mom-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mom-time">
                Time<RequiredStar />
              </Label>
              <Input
                id="mom-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mom-type">Meeting Type</Label>
              <Select
                value={meetingType}
                onValueChange={(v) => setMeetingType(v as MeetingType)}
              >
                <SelectTrigger id="mom-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {meetingType === 'PHYSICAL' && (
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="mom-venue">Venue</Label>
                <Input
                  id="mom-venue"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pune office, 10th floor"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ParticipantList
              title="Client Participants"
              rows={clientPpts}
              onChange={setClientPpts}
            />
            <ParticipantList
              title="Gazon Participants"
              rows={gazonPpts}
              onChange={setGazonPpts}
            />
          </div>

          <ActionItemsTable items={items} onChange={setItems} />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
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
              disabled={!accountId || !date || !time || submitting}
            >
              {submitting ? 'Saving…' : 'Save MOM'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ParticipantList({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Participant[];
  onChange: (p: Participant[]) => void;
}) {
  function update(idx: number, patch: Partial<Participant>) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function add() {
    onChange([...rows, { name: '', position: '' }]);
  }
  function remove(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <button
          type="button"
          onClick={add}
          className="text-sm text-orange-600 font-medium hover:text-orange-700 inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder="Name"
              value={row.name}
              onChange={(e) => update(idx, { name: e.target.value })}
            />
            <Input
              placeholder="Position"
              value={row.position}
              onChange={(e) => update(idx, { position: e.target.value })}
            />
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-gray-400 hover:text-red-600 p-1"
                aria-label="Remove participant"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="w-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionItemsTable({
  items,
  onChange,
}: {
  items: ActionItem[];
  onChange: (i: ActionItem[]) => void;
}) {
  function update(idx: number, patch: Partial<ActionItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function add() {
    onChange([...items, blankItem(items.length + 1)]);
  }
  function remove(idx: number) {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 }));
    onChange(next.length ? next : [blankItem(1)]);
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Action Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-orange-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-12">SR</th>
              <th className="px-3 py-2 text-left font-medium">Discussion Description</th>
              <th className="px-3 py-2 text-left font-medium">Action Owner</th>
              <th className="px-3 py-2 text-left font-medium">Plan of Action</th>
              <th className="px-3 py-2 text-left font-medium w-40">Closure Date</th>
              <th className="px-3 py-2 text-left font-medium w-32">Status</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Describe discussion..."
                    value={item.discussionDescription}
                    onChange={(e) => update(idx, { discussionDescription: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Owner"
                    value={item.actionOwner}
                    onChange={(e) => update(idx, { actionOwner: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    placeholder="Plan..."
                    value={item.planOfAction}
                    onChange={(e) => update(idx, { planOfAction: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="date"
                    value={item.closureDate ?? ''}
                    onChange={(e) => update(idx, { closureDate: e.target.value || null })}
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  <Select
                    value={item.currentStatus}
                    onValueChange={(v) =>
                      update(idx, { currentStatus: v as ActionItem['currentStatus'] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      aria-label="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequiredStar() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden="true">
      *
    </span>
  );
}

function blankItem(srNo: number): ActionItem {
  return {
    srNo,
    discussionDescription: '',
    actionOwner: '',
    planOfAction: '',
    closureDate: null,
    currentStatus: 'Open',
  };
}

function labelFor(a: Account): string {
  return a.companyName || a.clientName;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
