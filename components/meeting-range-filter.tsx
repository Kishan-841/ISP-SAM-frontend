'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Format a Date to YYYY-MM-DD in local time. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** First and last day of the previous calendar month, as YYYY-MM-DD. */
function lastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: ymd(first), to: ymd(last) };
}

type Preset = 'all' | 'last_month' | 'custom';

/** Which preset the current from/to correspond to. */
function detectPreset(from?: string, to?: string): Preset {
  if (!from && !to) return 'all';
  const lm = lastMonthRange();
  if (from === lm.from && to === lm.to) return 'last_month';
  return 'custom';
}

export function MeetingRangeFilter({ from, to }: { from?: string; to?: string }) {
  const router = useRouter();
  const active = detectPreset(from, to);
  const [customFrom, setCustomFrom] = useState(from ?? '');
  const [customTo, setCustomTo] = useState(to ?? '');
  const [showCustom, setShowCustom] = useState(active === 'custom');

  function go(next: { from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (next.from) qs.set('from', next.from);
    if (next.to) qs.set('to', next.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    router.push(`/meeting-summary${suffix}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    // Normalise reversed inputs.
    const [f, t] = customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
    go({ from: f, to: t });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex rounded-lg ring-1 ring-gray-200 bg-white p-0.5 self-start">
        <PresetButton
          label="All time"
          active={active === 'all'}
          onClick={() => {
            setShowCustom(false);
            go({});
          }}
        />
        <PresetButton
          label="Last month"
          active={active === 'last_month'}
          onClick={() => {
            setShowCustom(false);
            go(lastMonthRange());
          }}
        />
        <PresetButton
          label="Custom"
          active={active === 'custom' || showCustom}
          onClick={() => setShowCustom((v) => !v)}
        />
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="From date"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-9 rounded-md border border-gray-200 px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="To date"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="h-9 rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
