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

export function FeedbacksView({ rows }: { rows: FeedbackListRow[] }) {
  const [sam, setSam] = useState('all');

  const sams = useMemo(() => {
    const byId = new Map<string, string>();
    for (const r of rows) byId.set(r.sam.id, r.sam.name);
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filtered = sam === 'all' ? rows : rows.filter((r) => r.sam.id === sam);

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
      <TabsList>
        <TabsTrigger value="responses">Responses</TabsTrigger>
        <TabsTrigger value="by-sam">By SAM</TabsTrigger>
      </TabsList>

      <TabsContent value="responses">
        <FeedbacksTable rows={filtered} filters={samFilter} />
      </TabsContent>

      <TabsContent value="by-sam">
        <FeedbackAnalytics rows={rows} />
      </TabsContent>
    </Tabs>
  );
}
