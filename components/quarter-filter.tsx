'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'All Time'] as const;
type Quarter = (typeof QUARTERS)[number];

export function QuarterFilter() {
  const [active, setActive] = useState<Quarter>('All Time');

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-white rounded-md p-1 border border-gray-200">
        {QUARTERS.map((q) => {
          const isActive = q === active;
          return (
            <button
              key={q}
              type="button"
              onClick={() => setActive(q)}
              className={
                isActive
                  ? 'px-3 py-1 text-xs font-medium rounded bg-brand-600 text-white'
                  : 'px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            >
              {q}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Refresh"
        className="w-8 h-8 grid place-items-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
