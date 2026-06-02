'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { AuditTable } from './audit-table';
import { LoadMoreFooter } from './load-more-footer';
import { getAuditLogs, type AuditEntry, type AuditList } from '../services/audit';

/**
 * Table-mode counterpart to `AuditTimelineLoader`. Used on the global
 * /audit page where rows are easier to scan than a vertical timeline.
 * The per-customer journey page continues to use the timeline.
 */
export function AuditTableLoader({
  initial,
  filters,
}: {
  initial: AuditList;
  filters: { entityType?: string; action?: string };
}) {
  const [items, setItems] = useState<AuditEntry[]>(initial.entries);
  const [total, setTotal] = useState(initial.total);
  const [nextPage, setNextPage] = useState(initial.page + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLoadMore() {
    setLoading(true);
    setError(null);
    try {
      const next = await getAuditLogs({
        ...filters,
        page: nextPage,
        pageSize: initial.pageSize,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return [...prev, ...next.entries.filter((e) => !seen.has(e.id))];
      });
      setTotal(next.total);
      setNextPage((p) => p + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
        <History className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No events match the filters</p>
        <p className="text-xs text-gray-500 mt-1">
          Try clearing them, or perform an action to populate the log.
        </p>
      </div>
    );
  }

  return (
    <>
      <AuditTable entries={items} />
      <LoadMoreFooter
        shown={items.length}
        total={total}
        hasMore={items.length < total}
        loading={loading}
        error={error}
        onLoadMore={onLoadMore}
      />
    </>
  );
}
