'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { login } from '../../services/auth';

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
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-brand-50 via-orange-50 to-white">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-brand-700 font-bold tracking-tight text-xl">gazon</div>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">Service Assurance Manager</div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Defend revenue.<br />
            <span className="text-brand-600">Grow with discipline.</span>
          </h1>
          <p className="text-gray-600 leading-relaxed">
            The SAM platform tracks every commercial change, every meeting, every approval —
            so the numbers in your dashboard are the numbers you can trust.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Pill>Two-Kitty Architecture</Pill>
            <Pill>Hard Compliance Gates</Pill>
            <Pill>Audit-First</Pill>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Internal access only · Sessions secured with HTTP-only cookies</span>
        </div>
      </aside>

      {/* Right — form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand mark */}
          <div className="lg:hidden mb-10">
            <div className="text-brand-700 font-bold tracking-tight text-2xl">gazon</div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">Service Assurance Manager</div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in with your work email to continue.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@gazonindia.com"
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
                  onClick={() => alert('Ask the platform admin to reset your password.')}
                  tabIndex={-1}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 group"
              size="lg"
            >
              {submitting ? (
                <span>Signing in…</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400">
            Trouble signing in? Reach the platform admin on{' '}
            <a href="mailto:admin@gazonindia.com" className="text-brand-600 hover:underline">
              admin@gazonindia.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/70 border border-brand-200/60 text-gray-700 backdrop-blur-sm">
      {children}
    </span>
  );
}
