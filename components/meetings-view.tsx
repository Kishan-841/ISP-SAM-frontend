'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, List } from 'lucide-react';
import { MeetingsCalendar } from './meetings-calendar';
import { MeetingsTable } from './meetings-table';
import { ScheduleMeetingDialog } from './schedule-meeting-dialog';
import { AddMomDialog } from './add-mom-dialog';
import type { MeetingRow } from '../services/meetings';
import type { Account } from '../services/accounts';

type Tab = 'calendar' | 'list';

/**
 * Client wrapper for the Meetings & MOM page. Manages the calendar/list
 * tab state and renders the two top-right CTAs:
 *   - Schedule Meeting → adds to calendar (no MOM yet)
 *   - Direct MOM       → records MOM for an ad-hoc meeting in one go
 *                        (the existing AddMomDialog flow, unchanged)
 */
export function MeetingsView({
  meetings,
  accounts,
}: {
  meetings: MeetingRow[];
  accounts: Account[];
}) {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher + CTAs row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-white rounded-md p-1 border border-gray-200">
          <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')}>
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </TabButton>
          <TabButton active={tab === 'list'} onClick={() => setTab('list')}>
            <List className="w-3.5 h-3.5" />
            List
          </TabButton>
        </div>
        <div className="flex items-center gap-2">
          <ScheduleMeetingDialog accounts={accounts} />
          <AddMomDialog accounts={accounts} />
        </div>
      </div>

      {/* Active view */}
      {tab === 'calendar' ? (
        <MeetingsCalendar meetings={meetings} />
      ) : (
        <MeetingsTable meetings={meetings} accounts={accounts} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-brand-600 text-white'
          : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200'
      }
    >
      {children}
    </button>
  );
}
