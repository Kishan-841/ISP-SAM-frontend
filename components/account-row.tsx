import type { Account } from '../services/accounts';

export function AccountRow({ account }: { account: Account }) {
  const badgeColor = account.kittyType === 'BASE' ? 'bg-brand-100 text-brand-900' : 'bg-emerald-100 text-emerald-800';
  return (
    <tr className="border-b">
      <td className="px-4 py-3 font-medium">{account.clientName}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeColor}`}>
          {account.kittyType}
        </span>
      </td>
      <td className="px-4 py-3 text-right">₹{Number(account.currentMrr).toLocaleString('en-IN')}</td>
      <td className="px-4 py-3">{account.contractStatus}</td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {account.lastMeetingDate ?? '—'}
      </td>
    </tr>
  );
}
