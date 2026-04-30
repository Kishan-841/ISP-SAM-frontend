import { cn } from '@/lib/utils';

export type PillTone = 'orange' | 'purple' | 'red' | 'emerald' | 'blue' | 'amber' | 'gray';

const TONE_CLASS: Record<PillTone, string> = {
  orange:  'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/60',
  purple:  'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60',
  red:     'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60',
  blue:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60',
  amber:   'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  gray:    'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
};

export function StatusPill({
  tone = 'gray',
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
