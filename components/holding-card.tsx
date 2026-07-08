import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * A compact "holding area" card for dashboard states where value is committed
 * but not yet final — pending approval, retention/probable-churn. Reads like a
 * refined stat card (count + amount + CTA) rather than a loud alert banner.
 */

type Tone = 'indigo' | 'amber';

const TONE: Record<
  Tone,
  { bar: string; iconWrap: string; amount: string; ctaHover: string; hoverBorder: string }
> = {
  indigo: {
    bar: 'bg-indigo-400',
    iconWrap: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    amount: 'text-indigo-600',
    ctaHover: 'group-hover:text-indigo-600',
    hoverBorder: 'hoverable:hover:border-indigo-300',
  },
  amber: {
    bar: 'bg-amber-400',
    iconWrap: 'bg-amber-50 text-amber-600 ring-amber-100',
    amount: 'text-amber-600',
    ctaHover: 'group-hover:text-amber-600',
    hoverBorder: 'hoverable:hover:border-amber-300',
  },
};

export function HoldingCard({
  tone,
  icon: Icon,
  count,
  headline,
  detail,
  amount,
  amountClassName,
  href,
  cta,
}: {
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
  count: number;
  /** Short phrase after the count, e.g. "changes awaiting approval". */
  headline: string;
  /** Secondary explainer line. */
  detail: string;
  /** Right-aligned figure, e.g. "+₹4.2L" or "₹5.1L". */
  amount: string;
  /** Override the amount colour (defaults to the tone colour). */
  amountClassName?: string;
  href: string;
  cta: string;
}) {
  const t = TONE[tone];
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 pl-5 shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-[var(--ease-out)] hoverable:hover:shadow-md ${t.hoverBorder} active:scale-[0.995]`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} aria-hidden />

      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ${t.iconWrap}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-gray-900">{count}</span>
          <span className="text-sm font-medium text-gray-700">{headline}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{detail}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-bold tabular-nums ${amountClassName ?? t.amount}`}>
          {amount}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors ${t.ctaHover}`}
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-out)] hoverable:group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
