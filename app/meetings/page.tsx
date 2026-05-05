import { getMeetings } from '../../services/meetings';
import { getAccounts } from '../../services/accounts';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { MeetingsView } from '../../components/meetings-view';

export default async function MeetingsPage() {
  const cookieHeader = await getCookieHeader();
  const [meetingsRes, accountsRes] = await Promise.all([
    getMeetings({ cookieHeader }),
    getAccounts({}, { cookieHeader }),
  ]);

  return (
    <div className="px-8 py-6 flex flex-col gap-6">
      <PageHeader
        title="Meetings & MoM"
        subtitle={`${meetingsRes.meetings.length} total`}
      />
      <MeetingsView meetings={meetingsRes.meetings} accounts={accountsRes.accounts} />
    </div>
  );
}
