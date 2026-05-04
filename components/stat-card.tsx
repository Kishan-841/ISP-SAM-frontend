import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

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
  value: string;
  subtitle?: string;
  icon: IconType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`bg-white shadow-sm rounded-lg p-5 border border-gray-100 relative h-full flex flex-col ${
        href ? 'hover:border-brand-300 hover:shadow-md transition-all cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-1">
        <div className="min-w-0 flex-1 flex flex-col">
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColor ?? 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div
          className={`w-9 h-9 rounded-md grid place-items-center shrink-0 ${iconBg} ${iconColor}`}
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
