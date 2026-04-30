import type { ReactNode } from 'react';

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid md:grid-cols-3 gap-x-8 gap-y-4 py-6 first:pt-0 border-t border-gray-100 first:border-t-0">
      <div className="md:col-span-1">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  fullWidth = false,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
