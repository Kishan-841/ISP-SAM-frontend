'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  submitFeedback,
  type FeedbackForm,
  type FeedbackQuestion,
  type FeedbackAnswers,
} from '../services/feedback';

type Value = string | number | string[];

export function FeedbackForm({ form }: { form: FeedbackForm }) {
  const [answers, setAnswers] = useState<Record<string, Value>>({});
  const [others, setOthers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const steps = form.steps;
  const isLast = step === steps.length - 1;

  const isVisible = useMemo(
    () => (q: FeedbackQuestion) => {
      if (!q.showIf) return true;
      const trigger = answers[q.showIf.questionId];
      return typeof trigger === 'string' && q.showIf.in.includes(trigger);
    },
    [answers],
  );

  function questionsForStep(i: number): FeedbackQuestion[] {
    const secs = steps[i]?.sections ?? [];
    return form.questions.filter((q) => secs.includes(q.section) && isVisible(q));
  }

  function setAnswer(id: string, value: Value) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function toggleMulti(id: string, opt: string) {
    const cur = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    setAnswer(id, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  }

  function answered(q: FeedbackQuestion): boolean {
    const v = answers[q.id];
    if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }

  function validateStep(i: number): boolean {
    const errs: Record<string, string> = {};
    for (const q of questionsForStep(i)) {
      if (q.required && !answered(q)) errs[q.id] = 'This field is required.';
      if (q.type === 'email' && answered(q) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(answers[q.id]))) {
        errs[q.id] = 'Enter a valid email address.';
      }
      if (q.type === 'tel' && answered(q) && String(answers[q.id]).replace(/\D/g, '').length < 10) {
        errs[q.id] = 'Enter a valid mobile number.';
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please check the highlighted fields', {
        description: 'A few required answers are missing or need fixing.',
      });
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    // Validate every step, jump to the first with an error.
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    // Merge any "Other" free text into its multi array.
    const payload: FeedbackAnswers = {};
    for (const q of form.questions) {
      if (!isVisible(q)) continue;
      let v = answers[q.id];
      if (q.type === 'multi' && q.allowOther) {
        const other = (others[q.id] ?? '').trim();
        const arr = Array.isArray(v) ? [...v] : [];
        if (other) arr.push(other);
        v = arr;
      }
      if (v === undefined || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      payload[q.id] = v;
    }

    setSubmitting(true);
    try {
      await submitFeedback(payload);
      setDone(true);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Could not submit', {
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <ThankYou />;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress steps={steps.map((s) => s.title)} current={step} />

      <div className="mt-6 flex flex-col gap-6">
        {steps[step]!.sections.map((sectionId) => {
          const section = form.sections.find((s) => s.id === sectionId);
          const qs = form.questions.filter((q) => q.section === sectionId && isVisible(q));
          if (qs.length === 0) return null;
          return (
            <section
              key={sectionId}
              className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden"
            >
              <header className="bg-orange-50 border-b border-orange-100 px-5 sm:px-6 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900">{section?.title}</h2>
              </header>
              <div className="px-5 sm:px-6 py-5 flex flex-col gap-6">
                {qs.map((q) => (
                  <QuestionField
                    key={q.id}
                    q={q}
                    form={form}
                    value={answers[q.id]}
                    otherText={others[q.id] ?? ''}
                    error={errors[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                    onToggleMulti={(opt) => toggleMulti(q.id, opt)}
                    onOtherChange={(t) => setOthers((o) => ({ ...o, [q.id]: t }))}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent">
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {!isLast ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                'Submit feedback'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Progress({ steps, current }: { steps: string[]; current: number }) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">{steps[current]}</span>
        <span>
          Step {current + 1} of {steps.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestionField({
  q,
  form,
  value,
  otherText,
  error,
  onChange,
  onToggleMulti,
  onOtherChange,
}: {
  q: FeedbackQuestion;
  form: FeedbackForm;
  value: Value | undefined;
  otherText: string;
  error?: string;
  onChange: (v: Value) => void;
  onToggleMulti: (opt: string) => void;
  onOtherChange: (t: string) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">
        {q.label}
        {q.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {q.help && <p className="text-xs text-gray-500 mt-0.5">{q.help}</p>}

      <div className="mt-2.5">
        {(q.type === 'text' || q.type === 'email' || q.type === 'tel') && (
          <input
            type={q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'text'}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls(error)}
          />
        )}

        {q.type === 'textarea' && (
          <textarea
            rows={4}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls(error)}
          />
        )}

        {q.type === 'sam' && (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls(error)}
          >
            <option value="">Select your SAM…</option>
            {form.sams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {q.type === 'rating5' && (
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-lg ring-1 transition-colors',
                    active
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-gray-700 ring-gray-200 hover:bg-orange-50',
                  )}
                >
                  <span className="text-base font-semibold">{n}</span>
                  <span className={cn('text-[10px] leading-tight', active ? 'text-white/90' : 'text-gray-500')}>
                    {form.ratingLabels[String(n)]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'nps' && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 11 }, (_, n) => {
              const active = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={cn(
                    'w-9 h-9 rounded-lg ring-1 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-gray-700 ring-gray-200 hover:bg-orange-50',
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'single' && (
          <div className="flex flex-wrap gap-2">
            {q.options?.map((opt) => {
              const active = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg ring-1 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-gray-700 ring-gray-200 hover:bg-orange-50',
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'multi' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options?.map((opt) => {
                const active = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onToggleMulti(opt)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg ring-1 text-sm text-left transition-colors',
                      active
                        ? 'bg-orange-50 text-gray-900 ring-brand-300'
                        : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center ring-1 flex-shrink-0',
                        active ? 'bg-brand-600 ring-brand-600' : 'bg-white ring-gray-300',
                      )}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {q.allowOther && (
              <input
                type="text"
                placeholder="Other (please specify)"
                value={otherText}
                onChange={(e) => onOtherChange(e.target.value)}
                className={inputCls(undefined)}
              />
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2',
    error
      ? 'border-red-300 focus:ring-red-200'
      : 'border-gray-200 focus:ring-brand-500/30 focus:border-brand-400',
  );
}

function ThankYou() {
  return (
    <div className="w-full max-w-lg mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-full bg-emerald-50 grid place-items-center mx-auto mb-5">
        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Thank you for your valuable feedback.</h1>
      <p className="text-sm text-gray-600 mt-2">
        Your response has been submitted successfully. It helps us enhance our services and deliver
        better solutions for your business.
      </p>
    </div>
  );
}
