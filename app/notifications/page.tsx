import { getCookieHeader } from '../../lib/get-cookie-header';
import { getNotifications } from '../../services/notifications';
import { PageHeader } from '../../components/page-header';
import { NotificationsList } from '../../components/notifications-list';

export default async function NotificationsPage() {
  const cookieHeader = await getCookieHeader();
  const data = await getNotifications({ cookieHeader });

  return (
    <div className="px-8 py-6 max-w-4xl flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        subtitle={
          data.total === 0
            ? 'You will see customer assignments, commercial changes, CRM updates, and more here.'
            : `${data.unread} unread · ${data.total} ${data.total === 1 ? 'event' : 'events'} in your scope`
        }
      />
      <NotificationsList initial={data} />
    </div>
  );
}
