'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { UserRecord } from '../services/users';
import { DataTable, dataTableClasses } from './data-table';
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
      const fields = [u.name, u.email, u.role];
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q));
    });
  }, [users, searchValue]);

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);

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
          <Link
            href="/users/new"
            className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
          >
            New user
          </Link>
        ) : null
      }
    >
      <table className={dataTableClasses.table}>
        <thead className={dataTableClasses.thead}>
          <tr>
            <th className={dataTableClasses.th}>Name</th>
            <th className={dataTableClasses.th}>Email</th>
            <th className={dataTableClasses.th}>Role</th>
            <th className={dataTableClasses.th}>Reports To</th>
          </tr>
        </thead>
        <tbody className={dataTableClasses.tbody}>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-gray-500 italic">
                No users found.
              </td>
            </tr>
          ) : (
            visible.map((u) => (
              <tr key={u.id} className={dataTableClasses.tr}>
                <td className={dataTableClasses.tdPrimary}>{u.name}</td>
                <td className={dataTableClasses.tdSecondary}>{u.email}</td>
                <td className="px-5 py-4">
                  <StatusPill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</StatusPill>
                </td>
                <td className={dataTableClasses.tdSecondary}>
                  {u.role === 'SAM' ? u.samHead?.name ?? '—' : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DataTable>
  );
}
