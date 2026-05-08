import { redirect } from 'next/navigation';
import { History } from 'lucide-react';
import { getMe } from '../../services/auth';
import { getAuditLogs } from '../../services/audit';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { AuditTimeline } from '../../components/audit-timeline';

const ENTITY_TYPES: ReadonlySet<string> = new Set([
  'Account',
  'CommercialChange',
  'Meeting',
  'User',
]);

const ACTIONS: ReadonlySet<string> = new Set([
  'COMMIT',
  'ASSIGN',
  'UNASSIGN',
  'NOTIFY_ACCOUNTS_TEAM',
]);

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const cookieHeader = await getCookieHeader();

  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'ADMIN' && me.user.role !== 'SAM_HEAD') {
    redirect('/');
  }

  const entityType = sp.entityType && ENTITY_TYPES.has(sp.entityType) ? sp.entityType : undefined;
  const action = sp.action && ACTIONS.has(sp.action) ? sp.action : undefined;
  const page = sp.page ? Math.max(1, Number(sp.page)) : 1;

  const data = await getAuditLogs(
    { entityType, action, page, pageSize: 50 },
    { cookieHeader },
  );

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="px-8 py-6 max-w-5xl flex flex-col gap-6">
      <PageHeader
        title="Audit Log"
        subtitle={`${data.total} ${data.total === 1 ? 'event' : 'events'} recorded · who did what, when`}
      />

      {/* Filter chips */}
      <div className="flex flex-col gap-3">
        <FilterRow
          label="Entity"
          options={[
            { value: '', label: 'All' },
            { value: 'CommercialChange', label: 'Commercial changes' },
            { value: 'Account', label: 'Accounts' },
            { value: 'Meeting', label: 'Meetings' },
            { value: 'User', label: 'Users' },
          ]}
          paramKey="entityType"
          activeValue={entityType ?? ''}
        />
        <FilterRow
          label="Action"
          options={[
            { value: '', label: 'All' },
            { value: 'COMMIT', label: 'Commit' },
            { value: 'ASSIGN', label: 'Assign' },
            { value: 'UNASSIGN', label: 'Unassign' },
            { value: 'NOTIFY_ACCOUNTS_TEAM', label: 'Notify accounts' },
          ]}
          paramKey="action"
          activeValue={action ?? ''}
        />
      </div>

      {data.entries.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
          <History className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No events match the filters</p>
          <p className="text-xs text-gray-500 mt-1">
            Try clearing them, or perform a commercial change / assignment to populate the log.
          </p>
        </div>
      ) : (
        <AuditTimeline entries={data.entries} />
      )}

      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
          <span>
            Page {data.page} / {totalPages}
          </span>
          <PageLink page={data.page - 1} disabled={data.page <= 1} sp={sp}>
            ← Prev
          </PageLink>
          <PageLink page={data.page + 1} disabled={data.page >= totalPages} sp={sp}>
            Next →
          </PageLink>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  paramKey,
  activeValue,
}: {
  label: string;
  options: { value: string; label: string }[];
  paramKey: string;
  activeValue: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-16">
        {label}
      </span>
      {options.map((o) => {
        const params = new URLSearchParams();
        if (o.value) params.set(paramKey, o.value);
        const href = `/audit${params.toString() ? `?${params.toString()}` : ''}`;
        const isActive = activeValue === o.value;
        return (
          <a
            key={o.value}
            href={href}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {o.label}
          </a>
        );
      })}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  sp,
  children,
}: {
  page: number;
  disabled: boolean;
  sp: { entityType?: string; action?: string; page?: string };
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-1.5 rounded-md text-xs text-gray-300 cursor-not-allowed">
        {children}
      </span>
    );
  }
  const params = new URLSearchParams();
  if (sp.entityType) params.set('entityType', sp.entityType);
  if (sp.action) params.set('action', sp.action);
  params.set('page', String(page));
  return (
    <a
      href={`/audit?${params.toString()}`}
      className="px-3 py-1.5 rounded-md text-xs font-medium text-brand-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-200"
    >
      {children}
    </a>
  );
}
