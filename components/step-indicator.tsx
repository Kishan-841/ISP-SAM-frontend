import { Check } from 'lucide-react';

export function StepIndicator({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <ol className="flex items-center w-full">
      {steps.map((label, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={label} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${
                  isPast
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                      ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-600'
                      : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                }`}
              >
                {isPast ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-px mx-4 ${isPast ? 'bg-brand-300' : 'bg-gray-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
