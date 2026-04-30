import type { Account } from '../services/accounts';
import { AccountRow } from './account-row';
import { dataTableClasses } from './data-table';

export function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <table className={`${dataTableClasses.table} min-w-[1000px]`}>
      <thead className={dataTableClasses.thead}>
        <tr>
          <th className={`${dataTableClasses.th} w-8`} aria-label="Expand row" />
          <th className={dataTableClasses.th}>Code</th>
          <th className={dataTableClasses.th}>Customer</th>
          <th className={dataTableClasses.th}>Company</th>
          <th className={dataTableClasses.th}>Plan</th>
          <th className={`${dataTableClasses.th} text-right`}>Bandwidth</th>
          <th className={dataTableClasses.th}>Kitty</th>
          <th className={`${dataTableClasses.th} text-right`}>Current MRR</th>
          <th className={dataTableClasses.th}>Status</th>
        </tr>
      </thead>
      <tbody className={dataTableClasses.tbody}>
        {accounts.length === 0 ? (
          <tr>
            <td colSpan={9} className="px-5 py-10 text-center text-gray-500 italic">
              No accounts yet.
            </td>
          </tr>
        ) : (
          accounts.map((a) => <AccountRow key={a.id} account={a} />)
        )}
      </tbody>
    </table>
  );
}
