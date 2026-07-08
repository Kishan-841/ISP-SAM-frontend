'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { changePassword } from '../services/auth';

const MIN_LENGTH = 6;

/**
 * Signed-out "change password" for the login screen. Identifies the account by
 * email + current password (no session), then lets the user sign in with the
 * new one. For the in-app, already-signed-in flow, use /change-password.
 */
export function ChangePasswordModal({
  open,
  onOpenChange,
  defaultEmail,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  onChanged: (email: string) => void;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset transient fields each time the modal opens; seed the email.
  useEffect(() => {
    if (open) {
      setEmail(defaultEmail ?? '');
      setCurrent('');
      setNext('');
      setConfirm('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultEmail]);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const sameAsCurrent = next.length > 0 && next === current;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    email.trim().length > 0 &&
    current.length > 0 &&
    next.length >= MIN_LENGTH &&
    next !== current &&
    confirm === next &&
    !submitting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await changePassword(current, next, email.trim().toLowerCase());
      onChanged(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your email and current password to set a new one, then sign in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cp-email" className="text-xs font-medium uppercase tracking-wider text-gray-600">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                id="cp-email"
                type="email"
                autoComplete="email"
                autoFocus={!defaultEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@gazonindia.com"
                className="pl-10 h-11 bg-gray-50/60 border-gray-200 focus-visible:bg-white"
              />
            </div>
          </div>

          <PasswordField
            id="cp-current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
            placeholder="Enter your current password"
            autoFocus={!!defaultEmail}
          />

          <div className="flex flex-col gap-1.5">
            <PasswordField
              id="cp-new"
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              invalid={tooShort || sameAsCurrent}
            />
            {tooShort ? (
              <p className="text-xs text-red-600">Must be at least {MIN_LENGTH} characters.</p>
            ) : sameAsCurrent ? (
              <p className="text-xs text-red-600">Must differ from your current password.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <PasswordField
              id="cp-confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              invalid={mismatch}
            />
            {mismatch && <p className="text-xs text-red-600">Passwords don&apos;t match.</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Updating…' : 'Update password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  autoFocus,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
  autoFocus?: boolean;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-gray-600">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="pl-10 pr-11 h-11 bg-gray-50/60 border-gray-200 focus-visible:bg-white"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
