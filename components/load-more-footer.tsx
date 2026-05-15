'use client';

import { ArrowDown, Loader2 } from 'lucide-react';

/**
 * Shared "Load more" pagination footer used by activity-feed surfaces
 * (notifications, audit log). Owns no fetch state of its own — the parent
 * passes counts and a click handler.
 */
export function LoadMoreFooter({
  shown,
  total,
  hasMore,
  loading,
  error,
  onLoadMore,
  pageSize = 50,
}: {
  shown: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  pageSize?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-brand-600 bg-white ring-1 ring-gray-200 hover:bg-orange-50 hover:ring-orange-200 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              Load {Math.min(pageSize, total - shown)} more
              <ArrowDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      ) : (
        shown > 0 && <p className="text-xs text-gray-400">All {total} loaded</p>
      )}
      {hasMore && !loading && (
        <p className="text-[11px] text-gray-400">
          Showing {shown} of {total}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
