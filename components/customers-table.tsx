'use client';

import { useMemo, useState } from 'react';
import type { Account } from '../services/accounts';
import { AccountList } from './account-list';
import { DataTable } from './data-table';

export function CustomersTable({ accounts }: { accounts: Account[] }) {
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const fields = [
        a.clientName,
        a.companyName,
        a.mobileNumber,
        a.customerCode,
        a.leadId,
      ];
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q));
    });
  }, [accounts, searchValue]);

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);

  return (
    <DataTable
      title="Customers"
      count={accounts.length}
      searchPlaceholder="Search customers…"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
    >
      <AccountList accounts={visible} />
    </DataTable>
  );
}
