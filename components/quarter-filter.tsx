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

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-white rounded-md p-1 border border-gray-200">
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
                  ? 'min-w-[64px] px-3 py-1 text-xs font-medium rounded bg-brand-600 text-white text-center disabled:opacity-70'
                  : 'min-w-[64px] px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-center disabled:opacity-50'
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
        className="w-8 h-8 grid place-items-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      >
        <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
