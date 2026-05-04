'use client';

import Link from 'next/link';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from './data-table';
import { StatusPill, type PillTone } from './status-pill';
import type { UserRecord } from '../services/users';

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

export function UsersTable({ users, canCreate = true }: { users: UserRecord[]; canCreate?: boolean }) {
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
  ];

  return (
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
      headerExtra={canCreate && (
        <Button asChild size="sm" className="ml-2">
          <Link href="/users/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New user
          </Link>
        </Button>
      )}
    />
  );
}
