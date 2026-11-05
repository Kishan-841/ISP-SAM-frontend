import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, Plus, ShieldCheck, UserPlus, Wifi } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { MyLeadsTable } from '../../components/my-leads-table';
import { MspLeadsTable } from '../../components/msp-leads-table';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { listMyLeads, type EnrichedLeadRow } from '../../services/leads';
import { listMspLeads, type MspLeadRow } from '../../services/msp-leads';
import { getMe } from '../../services/auth';
import { env } from '../../lib/env';

// The ILL / MSP chips push ?kind=…, so the page must re-run per value.
export const dynamic = 'force-dynamic';

type LeadKind = 'ILL' | 'MSP';

export default async function MyLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  if (!env.leadDispatchEnabled && !env.mspLeadsEnabled) {
    redirect('/');
  }

  const sp = await searchParams;
  // Default to whichever is enabled; ILL first when both are.
  const requested: LeadKind = sp.kind?.toLowerCase() === 'msp' ? 'MSP' : 'ILL';
  const kind: LeadKind =
    requested === 'MSP' && !env.mspLeadsEnabled
      ? 'ILL'
      : requested === 'ILL' && !env.leadDispatchEnabled
        ? 'MSP'
        : requested;

  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });

  // Fetch both when both are on — the counts go on the chips, and it's two
  // cheap queries against our own tables.
  const [ill, msp] = await Promise.all([
    env.leadDispatchEnabled
      ? listMyLeads({ cookieHeader })
      : Promise.resolve({
          rows: [] as EnrichedLeadRow[],
          liveDataAvailable: true,
          liveDataError: undefined,
        }),
    env.mspLeadsEnabled
      ? listMspLeads({ cookieHeader })
      : Promise.resolve({ rows: [] as MspLeadRow[], lastSyncedAt: null }),
  ]);

  const isHeadOrAdmin = me.user.role === 'ADMIN' || me.user.role === 'SAM_HEAD';
  const bothEnabled = env.leadDispatchEnabled && env.mspLeadsEnabled;
  const count = kind === 'MSP' ? msp.rows.length : ill.rows.length;
  const scopeSubtitle = `${
    isHeadOrAdmin ? 'All SAM-created leads across the team' : 'Leads you created'
  } · ${count} ${count === 1 ? 'lead' : 'leads'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5">
      <PageHeader
        title={isHeadOrAdmin ? 'SAM-Created Leads' : 'My Leads'}
        subtitle={scopeSubtitle}
        right={
          <Link
            href="/create-lead"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
          >
            <UserPlus className="w-4 h-4" />
            Create new lead
          </Link>
        }
      />

      {bothEnabled && (
        <div className="flex items-center gap-2">
          <KindChip
            href="/my-leads"
            selected={kind === 'ILL'}
            icon={Wifi}
            label="ILL leads"
            count={ill.rows.length}
          />
          <KindChip
            href="/my-leads?kind=msp"
            selected={kind === 'MSP'}
            icon={ShieldCheck}
            label="MSP leads"
            count={msp.rows.length}
          />
        </div>
      )}

      {kind === 'ILL' ? (
        <>
          {!ill.liveDataAvailable && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-sm">
                <p className="font-medium text-amber-900">Couldn&apos;t load live CRM status</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Showing your dispatch history with the originally-assigned BDM. The live current
                  owner + CRM stage will appear once CRM is reachable.
                  {ill.liveDataError && (
                    <span className="ml-1 font-mono text-[11px] text-amber-700">
                      ({ill.liveDataError})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {ill.rows.length === 0 ? (
            <EmptyState
              line="No ILL leads yet"
              detail="Raise your first one from Create Lead — it’ll show up here with the current owner and status."
            />
          ) : (
            <MyLeadsTable rows={ill.rows} liveDataAvailable={ill.liveDataAvailable} />
          )}
        </>
      ) : msp.rows.length === 0 ? (
        <EmptyState
          line="No MSP leads yet"
          detail="Met someone who needs firewalls or managed networking? Raise it from Create Lead and pick MSP Lead — the MSP team lead assigns it and the status shows up here."
        />
      ) : (
        <MspLeadsTable rows={msp.rows} lastSyncedAt={msp.lastSyncedAt} />
      )}
    </div>
  );
}

function KindChip({
  href,
  selected,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  selected: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors ${
        selected
          ? 'bg-brand-50 text-brand-700 ring-brand-300'
          : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={selected ? 'text-brand-500' : 'text-gray-400'}>{count}</span>
    </Link>
  );
}

function EmptyState({ line, detail }: { line: string; detail: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
      <Plus className="mx-auto h-8 w-8 text-gray-300" />
      <p className="mt-3 text-sm font-medium text-gray-700">{line}</p>
      <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto leading-relaxed">{detail}</p>
    </div>
  );
}
