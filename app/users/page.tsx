import { getUsers } from '../../services/users';
import { getMe } from '../../services/auth';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { UsersTable } from '../../components/users-table';

export default async function UsersPage() {
  const cookieHeader = await getCookieHeader();
  const [{ users }, { user: me }] = await Promise.all([
    getUsers({ cookieHeader }),
    getMe({ cookieHeader }),
  ]);

  return (
    <div className="px-8 py-6">
      <PageHeader title="Users" subtitle="Team members" />
      <UsersTable users={users} currentUser={me} />
    </div>
  );
}
