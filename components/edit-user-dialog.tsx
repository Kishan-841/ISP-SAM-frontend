'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateUser, type UserRecord } from '../services/users';

type Role = UserRecord['role'];

export function EditUserDialog({
  user,
  samHeads,
  onOpenChange,
}: {
  user: UserRecord;
  /** All users currently in role SAM_HEAD — used to populate reports-to. */
  samHeads: UserRecord[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [samHeadId, setSamHeadId] = useState<string | null>(user.samHead?.id ?? null);
  const [password, setPassword] = useState('');
  const [resetPassword, setResetPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diff to backend — only send fields the admin actually touched.
  function buildPatch() {
    const patch: Parameters<typeof updateUser>[1] = {};
    if (name.trim() && name.trim() !== user.name) patch.name = name.trim();
    if (role !== user.role) patch.role = role;

    const currentHeadId = user.samHead?.id ?? null;
    if (role === 'SAM') {
      if (samHeadId !== currentHeadId) patch.samHeadId = samHeadId;
    } else if (currentHeadId !== null) {
      // promoting to SAM_HEAD/ADMIN clears the reports-to link
      patch.samHeadId = null;
    }
    if (resetPassword && password.trim().length >= 6) patch.password = password;
    return patch;
  }

  async function submit() {
    setError(null);
    if (role === 'SAM' && !samHeadId) {
      setError('Pick a SAM Head for this SAM.');
      return;
    }
    if (resetPassword && password.trim().length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }
    setBusy(true);
    try {
      await updateUser(user.id, patch);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            {user.email} · changes are recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                const next = v as Role;
                setRole(next);
                if (next !== 'SAM') setSamHeadId(null);
              }}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SAM_HEAD">SAM Head</SelectItem>
                <SelectItem value="SAM">SAM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'SAM' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-reports-to">Reports to</Label>
              <Select
                value={samHeadId ?? ''}
                onValueChange={(v) => setSamHeadId(v || null)}
              >
                <SelectTrigger id="edit-reports-to">
                  <SelectValue placeholder="Pick a SAM Head" />
                </SelectTrigger>
                <SelectContent>
                  {samHeads.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No SAM Heads available
                    </div>
                  ) : (
                    samHeads.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} ({h.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={resetPassword}
                onChange={(e) => setResetPassword(e.target.checked)}
                className="w-4 h-4 accent-orange-600"
              />
              <span className="text-sm text-gray-700">Reset password</span>
            </label>
            {resetPassword && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                autoComplete="new-password"
              />
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
