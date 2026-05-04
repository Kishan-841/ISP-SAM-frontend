import { PageHeader } from '../../components/page-header';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { getIntegrationEvents } from '../../services/integrations';
import { IntegrationLogTable } from '../../components/integration-log-table';

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const cookieHeader = await getCookieHeader();
  const status =
    sp.status === 'PROCESSED' ||
    sp.status === 'DUPLICATE' ||
    sp.status === 'REJECTED' ||
    sp.status === 'FAILED'
      ? sp.status
      : undefined;
  const data = await getIntegrationEvents({ status, pageSize: 100 }, { cookieHeader });

  return (
    <div className="px-8 py-6 flex flex-col gap-4">
      <PageHeader
        title="Integration Log"
        subtitle="Every webhook received from upstream systems (CRM, billing, etc.)"
      />
      <IntegrationLogTable events={data.events} initialStatus={status} />
    </div>
  );
}
