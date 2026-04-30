import type { ComponentType, SVGProps } from 'react';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: IconType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-100 relative">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
}
