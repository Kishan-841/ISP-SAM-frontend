'use client';

import { Search } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ReactNode } from 'react';

const PAGE_SIZES = [10, 20, 50, 100];

export function DataTable({
  title,
  count,
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  right,
  children,
}: {
  title: string;
  count: number;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
          <span className="text-sm text-gray-400">({count})</span>
        </div>
        <div className="flex items-center gap-3">
          {right}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 w-64 bg-gray-50 border-gray-200 focus-visible:bg-white"
            />
          </div>
        </div>
      </header>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xs text-gray-500">Show</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">entries</span>
      </div>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

export const dataTableClasses = {
  table: 'w-full',
  thead: 'bg-gray-50/60 border-b border-gray-100',
  th: 'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-r border-gray-100 last:border-r-0',
  tbody: 'divide-y divide-gray-100',
  tr: 'hover:bg-gray-50/60 transition-colors',
  td: 'px-5 py-4 text-sm border-r border-gray-100 last:border-r-0',
  tdPrimary: 'px-5 py-4 text-sm text-gray-900 font-medium border-r border-gray-100 last:border-r-0',
  tdSecondary: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
  twoLine: {
    primary: 'text-sm text-gray-900',
    secondary: 'text-xs text-gray-500 mt-0.5',
  },
};
