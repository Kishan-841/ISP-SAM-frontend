'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserRecord } from '../services/users';
import { DataTable } from './data-table';
import { DataGrid, type Column } from './data-grid';
import { StatusPill, type PillTone } from './status-pill';

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
  canCreate = true,
}: {
  users: UserRecord[];
  canCreate?: boolean;
}) {
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fields = [u.name, u.email, u.role, u.samHead?.name];
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q));
    });
  }, [users, searchValue]);

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);

  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => u.name,
      className: 'px-5 py-4 text-sm text-gray-900 font-medium border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => u.email,
      className: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => (
        <StatusPill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</StatusPill>
      ),
    },
    {
      key: 'samHead',
      header: 'Reports To',
      cell: (u) => (u.role === 'SAM' ? u.samHead?.name ?? '—' : '—'),
      className: 'px-5 py-4 text-sm text-gray-500 border-r border-gray-100 last:border-r-0',
    },
  ];

  return (
    <DataTable
      title="Users"
      count={users.length}
      searchPlaceholder="Search users…"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      right={
        canCreate ? (
          <Button asChild>
            <Link href="/users/new">
              <Plus className="w-4 h-4 mr-1.5" />
              New user
            </Link>
          </Button>
        ) : null
      }
    >
      <DataGrid
        columns={columns}
        rows={visible}
        rowKey={(u) => u.id}
        emptyMessage={searchValue ? 'No users match your search.' : 'No users yet.'}
      />
    </DataTable>
  );
}
