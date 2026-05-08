'use client';

import { useState, useMemo, type ReactNode, type ComponentType, type SVGProps } from 'react';
import {
  Search, SearchX, Inbox,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from './empty-state';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type SortDir = 'asc' | 'desc';

export type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;             // 'w-32', 'w-20', etc.
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  secondary?: (row: T) => ReactNode;  // optional two-line cell
  className?: string;         // override td class for this column
};

export type DataTableProps<T> = {
  // Header
  title?: string;
  totalCount?: number;
  headerExtra?: ReactNode;
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];   // dotted paths supported
  filters?: ReactNode;
  // Columns + rows
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  // Pagination (client-side; we don't ship server pagination yet)
  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  // Behaviour
  onRowClick?: (row: T) => void;
  renderExpanded?: (row: T) => ReactNode;   // see customers
  isRowExpanded?: (row: T) => boolean;       // controlled expansion
  // States
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: IconType;
  emptyFilteredTitle?: string;
  // Per-row class
  actions?: (row: T) => ReactNode;
  className?: string;
  minWidth?: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function DataTable<T>({
  title,
  totalCount,
  headerExtra,
  searchable = false,
  searchPlaceholder = 'Search…',
  searchKeys = [],
  filters,
  columns,
  rows,
  rowKey,
  pagination = false,
  defaultPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onRowClick,
  renderExpanded,
  isRowExpanded,
  loading = false,
  emptyTitle = 'No data',
  emptySubtitle,
  emptyIcon = Inbox,
  emptyFilteredTitle = 'No results match your search',
  actions,
  className = '',
  minWidth,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    if (!searchable || !searchTerm.trim() || searchKeys.length === 0) return rows;
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((row) =>
      searchKeys.some((path) => {
        const value = readPath(row, String(path));
        return value !== null && value !== undefined && String(value).toLowerCase().includes(q);
      }),
    );
  }, [rows, searchable, searchTerm, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const cmp = (a: T, b: T) => {
      const av = readPath(a, sortKey) as unknown;
      const bv = readPath(b, sortKey) as unknown;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    };
    const out = [...filtered].sort(cmp);
    return sortDir === 'desc' ? out.reverse() : out;
  }, [filtered, sortKey, sortDir, columns]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(page, totalPages);
  const visible = pagination
    ? sorted.slice((activePage - 1) * pageSize, activePage * pageSize)
    : sorted;

  const startItem = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endItem = Math.min(activePage * pageSize, totalItems);

  const displayCount = totalCount ?? totalItems;

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir('asc');
    }
  }

  function handleSearchChange(v: string) {
    setSearchTerm(v);
    setPage(1);
  }

  function handlePageSizeChange(v: number) {
    setPageSize(v);
    setPage(1);
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      {(title || searchable || filters || headerExtra) && (
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 tracking-tight truncate">
                {title}
                {displayCount !== undefined && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({displayCount})</span>
                )}
              </h3>
            )}
            {headerExtra}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9 h-9 w-64 bg-gray-50 border-gray-200 focus-visible:bg-white"
                />
              </div>
            )}
            {filters}
          </div>
        </div>
      )}

      {/* Page size selector */}
      {pagination && (
        <div className="px-5 py-3 flex items-center gap-2 text-xs text-gray-500 border-b border-gray-100">
          <span>Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => handlePageSizeChange(Number(v))}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth ?? ''}`.trim()}>
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr className="divide-x divide-gray-100">
              {columns.map((col) => {
                const sortIcon =
                  col.sortable && sortKey === col.key
                    ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                    : null;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col)}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${alignClass(col.align)} ${col.sortable ? 'cursor-pointer hover:text-gray-950 select-none' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {sortIcon}
                    </span>
                  </th>
                );
              })}
              {actions && (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={`s-${i}`} className="divide-x divide-gray-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div
                        className="h-4 bg-gray-100 rounded animate-pulse"
                        style={{ width: `${40 + ((i * 7 + col.key.length * 3) % 50)}%` }}
                      />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-4">
                      <div className="h-4 w-8 bg-gray-100 rounded animate-pulse ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState
                    icon={searchTerm ? SearchX : emptyIcon}
                    title={searchTerm ? emptyFilteredTitle : emptyTitle}
                    subtitle={searchTerm ? 'Try adjusting your search.' : emptySubtitle}
                  />
                </td>
              </tr>
            ) : (
              visible.map((row, i) => {
                const expanded = renderExpanded && isRowExpanded ? isRowExpanded(row) : false;
                const key = rowKey ? rowKey(row, i) : String(i);
                return (
                  <Row<T>
                    key={key}
                    row={row}
                    index={i}
                    columns={columns}
                    actions={actions}
                    onRowClick={onRowClick}
                    renderExpanded={renderExpanded}
                    expanded={expanded}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && totalItems > 0 && (
        <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing {startItem} to {endItem} of {totalItems} {totalItems === 1 ? 'result' : 'results'}
          </span>
          <div className="flex items-center gap-1">
            <PaginationButton onClick={() => setPage(1)} disabled={activePage <= 1}>
              <ChevronsLeft className="w-4 h-4" />
            </PaginationButton>
            <PaginationButton onClick={() => setPage(activePage - 1)} disabled={activePage <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </PaginationButton>
            <span className="px-3 py-1 text-sm font-medium text-gray-700 tabular-nums">
              {activePage} <span className="text-gray-400">/</span> {totalPages}
            </span>
            <PaginationButton onClick={() => setPage(activePage + 1)} disabled={activePage >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </PaginationButton>
            <PaginationButton onClick={() => setPage(totalPages)} disabled={activePage >= totalPages}>
              <ChevronsRight className="w-4 h-4" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Row<T>({
  row,
  columns,
  actions,
  onRowClick,
  renderExpanded,
  expanded,
}: {
  row: T;
  index: number;
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  renderExpanded?: (row: T) => ReactNode;
  expanded: boolean;
}) {
  const interactive = !!onRowClick || !!renderExpanded;
  return (
    <>
      <tr
        className={`divide-x divide-gray-100 transition-colors hover:bg-gray-50/60 ${interactive ? 'cursor-pointer' : ''}`}
        onClick={() => onRowClick?.(row)}
      >
        {columns.map((col) => (
          <td
            key={col.key}
            className={`${col.className ?? `px-5 py-4 text-sm text-gray-700 ${alignClass(col.align)}`}`}
          >
            {col.secondary ? (
              <>
                <div className="text-sm text-gray-900">{col.cell(row)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{col.secondary(row)}</div>
              </>
            ) : (
              col.cell(row)
            )}
          </td>
        ))}
        {actions && (
          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
            {actions(row)}
          </td>
        )}
      </tr>
      {expanded && renderExpanded && (
        <tr className="bg-gray-50/60 border-b border-gray-100">
          <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-4">
            {renderExpanded(row)}
          </td>
        </tr>
      )}
    </>
  );
}

function PaginationButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function alignClass(align: 'left' | 'right' | 'center' | undefined): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return '';
}

function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}
