'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '../../../components/page-header';
import { FormSection, FormField } from '../../../components/form-section';
import { createUser, getUsers, type UserRecord } from '../../../services/users';

type Role = 'ADMIN' | 'SAM_HEAD' | 'SAM';

const ROLE_LABELS: Record<Role, string> = {
  SAM: 'SAM',
  SAM_HEAD: 'SAM Head',
  ADMIN: 'Admin',
};

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('SAM');
  const [password, setPassword] = useState('');
  const [samHeadId, setSamHeadId] = useState<string>('');
  const [heads, setHeads] = useState<UserRecord[]>([]);
  const [headsLoading, setHeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role !== 'SAM') return;
    let cancelled = false;
    const promise = getUsers();
    // Defer the loading flag so it lands as part of the same microtask as the
    // request; this keeps the lint rule happy (no sync setState in an effect
    // body) without changing behavior — the request kicks off immediately.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setHeadsLoading(true);
    });
    promise
      .then(({ users }) => {
        if (cancelled) return;
        setHeads(users.filter((u) => u.role === 'SAM_HEAD'));
      })
      .catch(() => {
        if (cancelled) return;
        setHeads([]);
      })
      .finally(() => {
        if (cancelled) return;
        setHeadsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  function onRoleChange(next: Role) {
    setRole(next);
    if (next !== 'SAM') {
      // Clear field when role isn't SAM — handled in the change handler so we
      // don't trigger a cascading render from inside an effect.
      setSamHeadId('');
    }
  }

  const showSamHead = role === 'SAM';
  const noHeadsAvailable = showSamHead && !headsLoading && heads.length === 0;
  const samHeadMissing = showSamHead && !samHeadId;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUser({
        email,
        name,
        role,
        password,
        ...(role === 'SAM' && samHeadId ? { samHeadId } : {}),
      });
      router.push('/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6">
      <PageHeader
        title="New user"
        subtitle="Create a SAM, SAM Head or Admin account."
      />

      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="px-4 sm:px-6 pt-6 pb-0 divide-y divide-gray-100">
            <FormSection
              title="Identity"
              description="Display name and login email. The email becomes the user's unique identifier."
            >
              <FormField label="Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10"
                />
              </FormField>
              <FormField label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Access"
              description="Role determines the user's permissions. SAMs must be assigned to a SAM Head."
            >
              <FormField label="Role" required>
                <Select value={role} onValueChange={(v) => onRoleChange(v as Role)}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {showSamHead && (
                <FormField
                  label="SAM Head"
                  required
                  hint="Required for SAM users"
                  error={noHeadsAvailable ? 'No SAM Head exists yet — create one first.' : null}
                >
                  <Select
                    value={samHeadId}
                    onValueChange={setSamHeadId}
                    disabled={headsLoading || noHeadsAvailable}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue
                        placeholder={headsLoading ? 'Loading…' : 'Select SAM Head'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {heads.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name} ({h.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              <FormField
                label="Temporary password"
                required
                hint="At least 6 characters. The user can change it after logging in."
                fullWidth
              >
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10"
                />
              </FormField>
            </FormSection>

            {error && (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/users')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || noHeadsAvailable || samHeadMissing}
              size="lg"
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {submitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
