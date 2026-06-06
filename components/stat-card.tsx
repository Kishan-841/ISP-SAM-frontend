import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/*
 * StatCard motion notes (Emil's design framework):
 *  - Specific transitions only (no `transition-all`) — only border-color,
 *    box-shadow and transform change here.
 *  - `:active` scales to 0.97 so the card feels pressable, but only on
 *    clickable variants (href present). 160ms feedback duration.
 *  - Hover effects gated by `(hover: hover) and (pointer: fine)` so touch
 *    devices don't trigger false-positive hover on tap.
 *  - Custom ease-out curve from globals.css (--ease-out). The default CSS
 *    ease-out feels mushy; this variant has more punch.
 *  - Icon nudges 1px on hover for a sub-conscious "this is clickable" cue.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  href,
}: {
  title: string;
  /** Plain string for simple values, or a ReactNode for interactive widgets
   *  like <ExpandableArc> that intercept clicks before the card link fires. */
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: IconType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  href?: string;
}) {
  const baseClasses =
    'group/card bg-white shadow-sm rounded-lg p-5 border border-gray-100 relative h-full flex flex-col';
  const motionClasses = href
    ? 'transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hoverable:hover:border-brand-300 hoverable:hover:shadow-md active:scale-[0.985] cursor-pointer will-change-transform'
    : '';

  const inner = (
    <div className={`${baseClasses} ${motionClasses}`}>
      <div className="flex items-start justify-between gap-3 flex-1">
        <div className="min-w-0 flex-1 flex flex-col">
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColor ?? 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div
          className={`w-9 h-9 rounded-md grid place-items-center shrink-0 ${iconBg} ${iconColor} ${
            href
              ? 'transition-transform duration-200 ease-[var(--ease-out)] hoverable:group-hover/card:-translate-y-px'
              : ''
          }`}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
