import { redirect } from 'next/navigation';
import { getMe } from '../../services/auth';
import { getAuditLogs } from '../../services/audit';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader } from '../../components/page-header';
import { AuditTableLoader } from '../../components/audit-table-loader';

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
  'UPDATE_FIELD',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'NOTIFY_ACCOUNTS_TEAM',
]);

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const cookieHeader = await getCookieHeader();

  const me = await getMe({ cookieHeader });
  if (me.user.role !== 'ADMIN' && me.user.role !== 'SAM_HEAD') {
    redirect('/');
  }

  const entityType = sp.entityType && ENTITY_TYPES.has(sp.entityType) ? sp.entityType : undefined;
  const action = sp.action && ACTIONS.has(sp.action) ? sp.action : undefined;

  const data = await getAuditLogs(
    { entityType, action, page: 1, pageSize: 50 },
    { cookieHeader },
  );

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-6">
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
            { value: 'LOGIN', label: 'Login' },
            { value: 'LOGIN_FAILED', label: 'Failed login' },
            { value: 'LOGOUT', label: 'Logout' },
            { value: 'UPDATE_FIELD', label: 'Field edits' },
            { value: 'COMMIT', label: 'Commit' },
            { value: 'ASSIGN', label: 'Assign' },
            { value: 'UNASSIGN', label: 'Unassign' },
            { value: 'NOTIFY_ACCOUNTS_TEAM', label: 'Notify accounts' },
          ]}
          paramKey="action"
          activeValue={action ?? ''}
        />
      </div>

      {/* `key` resets the accumulated Load More state when filters change. */}
      <AuditTableLoader
        key={`${entityType ?? ''}|${action ?? ''}`}
        initial={data}
        filters={{ entityType, action }}
      />
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
