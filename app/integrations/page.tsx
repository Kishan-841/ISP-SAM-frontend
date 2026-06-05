import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { getCookieHeader } from '../../lib/get-cookie-header';
import {
  getIntegrationEvents,
  getOutboundCrmFailures,
} from '../../services/integrations';
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
  // Fetch in parallel — the outbound-failures call is small and the page
  // header chip needs the count for the banner.
  const [data, outbound] = await Promise.all([
    getIntegrationEvents({ status, pageSize: 100 }, { cookieHeader }),
    getOutboundCrmFailures({ cookieHeader }).catch(() => ({ failures: [], total: 0 })),
  ]);

  return (
    <div className="px-8 py-6 flex flex-col gap-4">
      <PageHeader
        title="Integration Log"
        subtitle="Every webhook received from upstream systems (CRM, billing, etc.)"
      />
      {outbound.total > 0 && <OutboundFailuresBanner failures={outbound.failures} />}
      <IntegrationLogTable events={data.events} initialStatus={status} />
    </div>
  );
}

/**
 * Surface "SAM committed but CRM didn't take" cases. These rows are
 * commercial_changes where the outbound CRM service-order POST failed —
 * SAM advanced locally because we don't want a CRM blip to block
 * disconnection workflows, but the CRM side never got the order. Ops
 * needs to chase manually.
 */
function OutboundFailuresBanner({
  failures,
}: {
  failures: import('../../services/integrations').OutboundCrmFailure[];
}) {
  const top = failures.slice(0, 5);
  const rest = Math.max(0, failures.length - top.length);
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-red-900">
        <AlertTriangle className="w-5 h-5" />
        <h2 className="font-semibold">
          {failures.length} outbound CRM call{failures.length === 1 ? '' : 's'} failed
        </h2>
      </div>
      <p className="text-sm text-red-800">
        SAM committed the commercial change locally but the CRM service-order POST didn&apos;t
        succeed. The SAM-side state has advanced; the CRM side hasn&apos;t. Chase each customer
        manually or via the CRM admin.
      </p>
      <ul className="divide-y divide-red-200 text-sm">
        {top.map((f) => (
          <li key={f.id} className="py-2 flex items-center justify-between gap-3">
            <Link
              href={`/customers/${f.account.id}/details`}
              className="font-medium text-red-900 hover:underline truncate"
            >
              {f.account.companyName || f.account.clientName}
            </Link>
            <span className="text-xs text-red-800 font-mono">
              {f.changeType} · {f.effectiveDate}
            </span>
          </li>
        ))}
        {rest > 0 && (
          <li className="py-2 text-xs text-red-800">+ {rest} more</li>
        )}
      </ul>
    </div>
  );
}
