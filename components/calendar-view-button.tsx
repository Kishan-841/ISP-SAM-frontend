'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { MeetingsCalendar } from './meetings-calendar';
import type { MeetingRow } from '../services/meetings';

/**
 * Header CTA on /meetings — pops a near-full-screen dialog with the existing
 * MeetingsCalendar component. Kept separate from the tab strip below so the
 * calendar is reachable from any tab without consuming a tab slot.
 */
export function CalendarViewButton({ meetings }: { meetings: MeetingRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all"
      >
        <CalendarIcon className="w-4 h-4 text-brand-600" />
        View Calendar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-10 overflow-y-auto"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Meetings calendar"
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center ring-1 ring-orange-200/50">
                  <CalendarIcon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Meetings calendar</h2>
                  <p className="text-xs text-gray-500">
                    Month view · color-coded by status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <MeetingsCalendar meetings={meetings} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
