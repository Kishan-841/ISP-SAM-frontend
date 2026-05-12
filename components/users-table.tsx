'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import { EditUserDialog } from './edit-user-dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import type { UserRecord } from '../services/users';
import { deleteUser } from '../services/users';
import type { AuthUser } from '../services/auth';

const ROLE_TONE: Record<UserRecord['role'], PillTone> = {
  ADMIN: 'purple',
  SAM_HEAD: 'orange',
  SAM: 'blue',
};

const ROLE_LABEL: Record<UserRecord['role'], string> = {
  ADMIN: 'Admin',
  SAM_HEAD: 'SAM Head',
  SAM: 'SAM',
};

export function UsersTable({
  users,
  currentUser,
  canCreate = true,
}: {
  users: UserRecord[];
  currentUser?: AuthUser;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingUser = users.find((u) => u.id === editingId) ?? null;
  const deletingUser = users.find((u) => u.id === confirmDeleteId) ?? null;
  const samHeads = users.filter((u) => u.role === 'SAM_HEAD');

  async function onConfirmDelete() {
    if (!confirmDeleteId) return;
    setBusyId(confirmDeleteId);
    setError(null);
    try {
      await deleteUser(confirmDeleteId);
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      align: 'center',
      sortable: true,
      cell: (u) => u.name,
      className: 'px-5 py-4 text-sm text-gray-900 text-center',
    },
    {
      key: 'email',
      header: 'Email',
      align: 'center',
      cell: (u) => u.email,
      className: 'px-5 py-4 text-sm text-gray-500 text-center',
    },
    {
      key: 'role',
      header: 'Role',
      align: 'center',
      cell: (u) => <StatusPill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</StatusPill>,
      className: 'px-5 py-4 text-center',
    },
    {
      key: 'reportsTo',
      header: 'Reports to',
      align: 'center',
      cell: (u) =>
        u.samHead ? (
          <span className="text-sm text-gray-700">{u.samHead.name}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
      className: 'px-5 py-4 text-center',
    },
  ];

  return (
    <>
      <DataTable<UserRecord>
        title="Users"
        totalCount={users.length}
        searchable
        searchPlaceholder="Search by name, email, role"
        searchKeys={['name', 'email', 'role']}
        pagination
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        emptyTitle="No users yet"
        emptySubtitle="Create the first SAM Head, then add SAMs underneath."
        emptyIcon={UsersIcon}
        actions={
          isAdmin
            ? (u) => (
                <div
                  className="inline-flex items-center gap-1.5 justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setEditingId(u.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(u.id)}
                    disabled={u.id === currentUser?.id || busyId === u.id}
                    title={
                      u.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    {busyId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              )
            : undefined
        }
        headerExtra={
          canCreate &&
          isAdmin && (
            <Button asChild size="sm" className="ml-2">
              <Link href="/users/new">
                <Plus className="w-4 h-4 mr-1.5" />
                New user
              </Link>
            </Button>
          )
        }
      />

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          samHeads={samHeads}
          onOpenChange={(o) => {
            if (!o) setEditingId(null);
          }}
        />
      )}

      {deletingUser && (
        <ConfirmDeleteDialog
          title="Delete user?"
          description={
            <>
              <span className="font-semibold text-gray-900">
                {deletingUser.name}
              </span>{' '}
              ({deletingUser.email}) will be permanently deleted. Their accounts will become
              unassigned and any direct reports will lose their reports-to link. The deletion
              is recorded in the audit log.
            </>
          }
          confirmLabel="Delete user"
          busy={busyId === deletingUser.id}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={onConfirmDelete}
        />
      )}
    </>
  );
}
