'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'All'] as const;
type Quarter = (typeof QUARTERS)[number];
type ActiveQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | undefined;

export function QuarterFilter({ active }: { active?: ActiveQuarter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function pick(q: Quarter) {
    startTransition(() => {
      router.push(q === 'All' ? pathname : `${pathname}?quarter=${q}`);
    });
  }

  // Motion notes (per Emil's framework):
  //  - Buttons need :active scale for tactile press feedback (subtle, 0.96).
  //  - Specific transitions only — background-color + transform here.
  //  - 160ms duration; tab/filter is "tens of times/day" so we reduce, not remove.
  //  - Hover gated by `hoverable:` so touch doesn't strand a stale hover state.
  const chipBase =
    'shrink-0 min-w-[52px] sm:min-w-[64px] px-2 sm:px-3 py-1 text-xs font-medium rounded text-center ' +
    'transition-[background-color,transform] duration-150 ease-[var(--ease-out)] ' +
    'active:scale-[0.96] will-change-transform';
  return (
    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto -mx-1 px-1 max-w-full">
      <div className="flex items-center gap-1 bg-white rounded-md p-1 border border-gray-200 flex-nowrap">
        {QUARTERS.map((q) => {
          const isActive = q === 'All' ? !active : q === active;
          return (
            <button
              key={q}
              type="button"
              onClick={() => pick(q)}
              disabled={pending}
              className={
                isActive
                  ? `${chipBase} bg-brand-600 text-white disabled:opacity-70`
                  : `${chipBase} bg-gray-100 text-gray-600 hoverable:hover:bg-gray-200 disabled:opacity-50`
              }
            >
              {q === 'All' ? 'All Time' : q}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Refresh"
        onClick={() => router.refresh()}
        className="shrink-0 w-8 h-8 grid place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hoverable:hover:bg-gray-50 active:scale-[0.94]"
      >
        <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
