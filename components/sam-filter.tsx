'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Users } from 'lucide-react';
import { dashboardHref, type FyQuarter } from '../lib/dashboard-filters';

export type SamOption = { id: string; name: string; email: string };

/**
 * SAM-wise filter for the Existing Base / New Base dashboards. Pushes
 * `?sam=<id>` and carries the current quarter along, so the two filters
 * compose instead of clobbering each other.
 *
 * Renders nothing when there is nobody to choose between — a SAM viewing
 * their own dashboard has exactly one possible value.
 */
export function SamFilter({
  sams,
  active,
  quarter,
}: {
  sams: SamOption[];
  active?: string;
  quarter?: FyQuarter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (sams.length === 0) return null;

  function pick(samId: string) {
    startTransition(() => {
      router.push(dashboardHref(pathname, { quarter, sam: samId || undefined }));
    });
  }

  return (
    <div className="relative flex items-center">
      <Users className="pointer-events-none absolute left-2 w-3.5 h-3.5 text-gray-500" />
      <select
        aria-label="Filter by SAM"
        value={active ?? ''}
        disabled={pending}
        onChange={(e) => pick(e.target.value)}
        className="h-8 pl-7 pr-7 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 appearance-none cursor-pointer transition-[background-color] duration-150 ease-[var(--ease-out)] hoverable:hover:bg-gray-50 disabled:opacity-50 max-w-[180px] truncate"
      >
        <option value="">All SAMs</option>
        {sams.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-gray-500 text-[10px]">▼</span>
    </div>
  );
}
