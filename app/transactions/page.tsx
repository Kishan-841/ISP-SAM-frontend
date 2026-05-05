import { getCommercialChanges } from '../../services/commercial-changes';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { TransactionsTable } from '../../components/transactions-table';

const VALID_TYPES = ['UPGRADE', 'DOWNGRADE', 'RATE_REVISION', 'DISCONNECTION'] as const;
type ValidType = (typeof VALID_TYPES)[number];

const META: Record<ValidType, { label: string; subtitle: string }> = {
  UPGRADE: { label: 'Upgrades', subtitle: 'ARC added' },
  DOWNGRADE: { label: 'Downgrades', subtitle: 'ARC reduced' },
  RATE_REVISION: { label: 'Rate Revisions', subtitle: 'Bandwidth uplift; ARC neutral or down' },
  DISCONNECTION: { label: 'Disconnections', subtitle: 'ARC lost' },
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const validType: ValidType | undefined =
    type && (VALID_TYPES as readonly string[]).includes(type) ? (type as ValidType) : undefined;

  const cookieHeader = await getCookieHeader();
  const { changes } = await getCommercialChanges(
    validType ? { type: validType } : {},
    { cookieHeader },
  );

  const title = validType ? META[validType].label : 'All Commercial Changes';
  const subtitle = validType ? META[validType].subtitle : 'Audit trail of every commercial change';

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-4">
      <PageHeader title={title} subtitle={subtitle} />
      <TransactionsTable changes={changes} />
    </div>
  );
}
