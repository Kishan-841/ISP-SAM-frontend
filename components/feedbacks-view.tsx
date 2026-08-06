'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedbacksTable } from './feedbacks-table';
import { FeedbackAnalytics } from './feedback-analytics';
import type { FeedbackListRow } from '../services/feedback';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export function FeedbacksView({ rows }: { rows: FeedbackListRow[] }) {
  const [sam, setSam] = useState('all');
  const [month, setMonth] = useState('all');

  // Distinct months present in the data, newest first.
  const months = useMemo(() => {
    const set = new Set(rows.map((r) => monthKey(r.submittedAt)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const monthRows = useMemo(
    () => (month === 'all' ? rows : rows.filter((r) => monthKey(r.submittedAt) === month)),
    [rows, month],
  );

  // SAM options come from the month-filtered set so the dropdown stays relevant.
  const sams = useMemo(() => {
    const byId = new Map<string, string>();
    for (const r of monthRows) byId.set(r.sam.id, r.sam.name);
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [monthRows]);

  const listRows = sam === 'all' ? monthRows : monthRows.filter((r) => r.sam.id === sam);

  const samFilter = (
    <Select value={sam} onValueChange={setSam}>
      <SelectTrigger className="h-9 w-full sm:w-52 text-sm">
        <SelectValue placeholder="All SAMs" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All SAMs</SelectItem>
        {sams.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Tabs defaultValue="responses">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="by-sam">By SAM</TabsTrigger>
        </TabsList>

        <Select value={month} onValueChange={(v) => setMonth(v)}>
          <SelectTrigger className="h-9 w-full sm:w-44 text-sm">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsContent value="responses">
        <FeedbacksTable rows={listRows} filters={samFilter} />
      </TabsContent>

      <TabsContent value="by-sam">
        <FeedbackAnalytics rows={monthRows} />
      </TabsContent>
    </Tabs>
  );
}
