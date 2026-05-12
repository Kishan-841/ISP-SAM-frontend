import { getMeetings } from '../../services/meetings';
import { getAccounts } from '../../services/accounts';
import { getMe } from '../../services/auth';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { MeetingsTable } from '../../components/meetings-table';
import { CalendarViewButton } from '../../components/calendar-view-button';

export default async function MeetingsPage() {
  const cookieHeader = await getCookieHeader();
  const [meetingsRes, accountsRes, meRes] = await Promise.all([
    getMeetings({ cookieHeader }),
    getAccounts({}, { cookieHeader }),
    getMe({ cookieHeader }),
  ]);

  const total = meetingsRes.meetings.length;
  const subtitle = total === 0 ? 'No meetings yet' : `${total} total`;

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="Meetings & MoM"
        subtitle={subtitle}
        right={<CalendarViewButton meetings={meetingsRes.meetings} />}
      />
      <MeetingsTable
        meetings={meetingsRes.meetings}
        accounts={accountsRes.accounts}
        currentUser={meRes.user}
      />
    </div>
  );
}
