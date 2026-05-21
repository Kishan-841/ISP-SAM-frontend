import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, Plus, UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { MyLeadsTable } from '../../components/my-leads-table';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { listMyLeads } from '../../services/leads';
import { getMe } from '../../services/auth';
import { env } from '../../lib/env';

export const dynamic = 'force-dynamic';

export default async function MyLeadsPage() {
  if (!env.leadDispatchEnabled) {
    redirect('/');
  }

  const cookieHeader = await getCookieHeader();
  const me = await getMe({ cookieHeader });
  const data = await listMyLeads({ cookieHeader });

  const isHeadOrAdmin = me.user.role === 'ADMIN' || me.user.role === 'SAM_HEAD';
  const scopeSubtitle = isHeadOrAdmin
    ? `All SAM-created leads across the team · ${data.rows.length} ${data.rows.length === 1 ? 'lead' : 'leads'}`
    : `Leads you created · ${data.rows.length} ${data.rows.length === 1 ? 'lead' : 'leads'}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">
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

      {!data.liveDataAvailable && (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 text-sm">
            <p className="font-medium text-amber-900">Couldn&apos;t load live CRM status</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Showing your dispatch history with the originally-assigned BDM. The live current
              owner + CRM stage will appear once CRM is reachable.
              {data.liveDataError && (
                <span className="ml-1 font-mono text-[11px] text-amber-700">
                  ({data.liveDataError})
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {data.rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Plus className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">No leads yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Raise your first lead from{' '}
            <Link href="/create-lead" className="text-brand-600 hover:underline">
              Create Lead
            </Link>{' '}
            — it&apos;ll show up here with the current owner and status.
          </p>
        </div>
      ) : (
        <MyLeadsTable rows={data.rows} liveDataAvailable={data.liveDataAvailable} />
      )}
    </div>
  );
}
