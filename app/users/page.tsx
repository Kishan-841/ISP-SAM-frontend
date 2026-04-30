import Link from 'next/link';
import { getUsers } from '../../services/users';
import { getCookieHeader } from '../../lib/get-cookie-header';

export default async function UsersPage() {
  const cookieHeader = await getCookieHeader();
  const { users } = await getUsers({ cookieHeader });

  return (
    <main className="max-w-6xl mx-auto p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link
          href="/users/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          New user
        </Link>
      </header>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="text-left text-sm text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Reports To</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.role === 'SAM' ? u.samHead?.name ?? '—' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
