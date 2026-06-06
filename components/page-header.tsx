import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
      <div className="border-l-4 border-brand-600 pl-3 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight break-words">{title}</h1>
        {subtitle && <p className="text-sm text-gray-900 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-l-4 border-brand-600 pl-3 text-base font-semibold text-gray-900 mb-3">
      {children}
    </h2>
  );
}
