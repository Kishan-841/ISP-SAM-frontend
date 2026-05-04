import { getUsers } from '../../services/users';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { UsersTable } from '../../components/users-table';

export default async function UsersPage() {
  const cookieHeader = await getCookieHeader();
  const { users } = await getUsers({ cookieHeader });

  return (
    <div className="px-8 py-6">
      <PageHeader title="Users" subtitle="Team members" />
      <UsersTable users={users} />
    </div>
  );
}
