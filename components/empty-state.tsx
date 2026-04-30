import type { ComponentType, SVGProps } from 'react';
import { Inbox } from 'lucide-react';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
}: {
  icon?: IconType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-50 grid place-items-center text-gray-400">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 max-w-md">{subtitle}</p>}
    </div>
  );
}
