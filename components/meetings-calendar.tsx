'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { MeetingRow } from '../services/meetings';
import { formatDate } from '../lib/format-date';

/**
 * DIY month calendar for the Meetings & MOM page. No external deps.
 *
 * Two buckets, matching the meetings table:
 *   momSentAt null → PENDING    (amber dot)
 *   momSentAt set  → COMPLETED  (green dot)
 */

type Status = 'PENDING' | 'COMPLETED';

function statusOf(m: MeetingRow): Status {
  return m.momSentAt ? 'COMPLETED' : 'PENDING';
}

const STATUS_COLOUR: Record<Status, string> = {
  PENDING: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
};

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

const STATUS_ICON: Record<Status, typeof Clock> = {
  PENDING: Clock,
  COMPLETED: CheckCircle2,
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isoDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Build a 6-row × 7-col matrix of dates that frames the month, Mon-first. */
function buildGrid(month: Date): Date[][] {
  const first = startOfMonth(month);
  // JS getDay(): 0=Sun .. 6=Sat. Convert to Mon=0..Sun=6.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const rows: Date[][] = [];
  let cursor = new Date(start);
  for (let r = 0; r < 6; r++) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }
  return rows;
}

export function MeetingsCalendar({ meetings }: { meetings: MeetingRow[] }) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  /** Bucket meetings by yyyy-mm-dd of scheduledAt. */
  const byDay = useMemo(() => {
    const map = new Map<string, MeetingRow[]>();
    for (const m of meetings) {
      const d = new Date(m.scheduledAt);
      const key = isoDateKey(d);
      const list = map.get(key);
      if (list) list.push(m);
      else map.set(key, [m]);
    }
    return map;
  }, [meetings]);

  const grid = useMemo(() => buildGrid(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const selectedKey = isoDateKey(selectedDay);
  const selectedMeetings = (byDay.get(selectedKey) ?? []).slice().sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  function shiftMonth(delta: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function goToday() {
    setViewMonth(startOfMonth(today));
    setSelectedDay(today);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="w-8 h-8 grid place-items-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 h-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="w-8 h-8 grid place-items-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-center"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.flatMap((row) =>
            row.map((d) => {
              const key = isoDateKey(d);
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isToday = sameDay(d, today);
              const isSelected = sameDay(d, selectedDay);
              const dayMeetings = byDay.get(key) ?? [];

              const baseCls = 'min-h-[88px] border-r border-b border-gray-100 px-2 py-2 text-left transition-colors';
              const cls = isSelected
                ? 'bg-orange-50 ring-1 ring-inset ring-brand-500'
                : 'hover:bg-gray-50/60';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`${baseCls} ${cls} ${inMonth ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        isToday
                          ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-semibold'
                          : 'text-xs font-medium text-gray-700'
                      }
                    >
                      {d.getDate()}
                    </span>
                    {dayMeetings.length > 0 && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {dayMeetings.length}
                      </span>
                    )}
                  </div>
                  {dayMeetings.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {dayMeetings.slice(0, 3).map((m) => {
                        const s = statusOf(m);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 text-[11px] text-gray-700 truncate"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOUR[s]}`} />
                            <span className="truncate">
                              {m.account.companyName || m.account.clientName}
                            </span>
                          </div>
                        );
                      })}
                      {dayMeetings.length > 3 && (
                        <div className="text-[10px] text-gray-500">
                          +{dayMeetings.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        {(['PENDING', 'COMPLETED'] as Status[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLOUR[s]}`} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Selected-day panel */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-600" />
          <h4 className="text-sm font-semibold text-gray-900">{formatDate(selectedDay.toISOString())}</h4>
          <span className="text-xs text-gray-500">
            ({selectedMeetings.length} {selectedMeetings.length === 1 ? 'meeting' : 'meetings'})
          </span>
        </div>
        {selectedMeetings.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No meetings on this date.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {selectedMeetings.map((m) => {
              const s = statusOf(m);
              const Icon = STATUS_ICON[s];
              const time = new Date(m.scheduledAt).toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <li key={m.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full grid place-items-center text-white ${STATUS_COLOUR[s]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <span className="tabular-nums text-gray-500 text-xs">{time}</span>
                      <span className="font-medium truncate">
                        {m.account.companyName || m.account.clientName}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {m.meetingType.toLowerCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{STATUS_LABEL[s]}</div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {s === 'PENDING' ? 'MoM pending' : 'Completed'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
