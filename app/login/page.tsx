'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { login } from '../../services/auth';

const FEATURES = [
  { num: '01', title: 'Two-Kitty Architecture', detail: 'Defend Base. Grow New.' },
  { num: '02', title: 'Hard Compliance Gates', detail: 'No change without proof.' },
  { num: '03', title: 'Audit-First', detail: 'Every action recorded.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/existing-base');
      router.refresh();
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white text-stone-900">
      {/* ─── Left: editorial hero, dark warm canvas ─────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden bg-stone-950 text-stone-100">
        {/* Layered radial glows — soft warm orange in the corners */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(55% 45% at 0% 100%, oklch(0.55 0.18 45 / 0.65), transparent 60%), radial-gradient(35% 35% at 110% 0%, oklch(0.6 0.16 35 / 0.4), transparent 60%)',
          }}
        />
        {/* Decorative dotted grid — barely-there texture, fades upward */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(to top, black, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to top, black, transparent 75%)',
          }}
        />

        {/* Top: wordmark */}
        <div className="relative card-stagger flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_18px_4px_oklch(0.65_0.22_40/0.55)]" />
            <span className="font-bold tracking-tight text-xl text-stone-50">gazon</span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
            Service Assurance Manager
          </span>
        </div>

        {/* Middle: headline + supporting copy + numbered features */}
        <div className="relative card-stagger max-w-lg flex flex-col gap-8">
          <h1 className="text-[2.75rem] xl:text-[3.25rem] leading-[1.05] font-bold tracking-tight text-stone-50">
            Defend revenue.{' '}
            <span className="text-brand-500">Grow with discipline.</span>
          </h1>
          <p className="text-stone-300 leading-relaxed text-[15px] max-w-md">
            SAM tracks every commercial change, every meeting, every approval — so the
            numbers in your dashboard are the numbers you can trust.
          </p>

          <ul className="flex flex-col gap-3.5 pt-1">
            {FEATURES.map((f) => (
              <li key={f.num} className="flex items-baseline gap-4">
                <span className="font-mono text-[11px] tabular-nums text-brand-500 tracking-wider">
                  {f.num}
                </span>
                <span className="h-px w-8 bg-stone-700/80" aria-hidden />
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-stone-100">{f.title}</span>
                  <span className="text-xs text-stone-400">{f.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: secured badge */}
        <div className="relative card-stagger flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span>Internal access only · Sessions secured with HTTP-only cookies</span>
        </div>
      </aside>

      {/* ─── Right: form panel ──────────────────────────────────────── */}
      <section className="relative flex items-center justify-center px-4 py-8 sm:p-12">
        {/* Soft hair-line on the left edge (visible on lg+) */}
        <div
          aria-hidden
          className="hidden lg:block absolute left-0 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-stone-200 to-transparent"
        />

        <div className="w-full max-w-md card-stagger flex flex-col gap-6">
          {/* Mobile-only brand mark */}
          <div className="lg:hidden flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
              <span className="font-bold tracking-tight text-2xl">gazon</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Service Assurance Manager
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Sign in
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              Welcome back.
            </h2>
            <p className="text-sm text-stone-500">
              Use your work email — sessions are tied to your role.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-stone-700 text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@gazonindia.com"
                  className="pl-10 h-12 bg-stone-50/60 border-stone-200 focus-visible:bg-white focus-visible:ring-brand-500/30 focus-visible:border-brand-400 transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password" className="text-stone-700 text-xs font-medium uppercase tracking-wider">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-[11px] text-stone-400 hover:text-brand-600 transition-colors duration-150"
                  onClick={() => alert('Ask the platform admin to reset your password.')}
                  tabIndex={-1}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-11 h-12 bg-stone-50/60 border-stone-200 focus-visible:bg-white focus-visible:ring-brand-500/30 focus-visible:border-brand-400 transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-stone-400 hoverable:hover:text-stone-700 hoverable:hover:bg-stone-100 transition-[color,background-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.92]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/70">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="group w-full h-12 text-[15px] font-semibold shadow-[0_8px_24px_-12px_oklch(0.55_0.22_40/0.55)] transition-[transform,box-shadow,opacity] duration-200 ease-[var(--ease-out)] hoverable:hover:shadow-[0_12px_32px_-12px_oklch(0.55_0.22_40/0.7)] active:scale-[0.985] will-change-transform"
              size="lg"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span className="uppercase tracking-[0.18em]">Support</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <p className="text-center text-xs text-stone-500 -mt-1">
            Trouble signing in? Reach the platform admin at{' '}
            <a
              href="mailto:admin@gazonindia.com"
              className="text-brand-600 hover:text-brand-700 hover:underline underline-offset-2"
            >
              admin@gazonindia.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
