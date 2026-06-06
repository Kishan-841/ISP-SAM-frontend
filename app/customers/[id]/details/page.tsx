import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Fingerprint,
  Globe,
  Hash,
  IdCard,
  Layers,
  Mail,
  MapPin,
  Network,
  Phone,
  Sparkles,
  TrendingUp,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';
import { PageHeader } from '../../../../components/page-header';
import { StatusPill, type PillTone } from '../../../../components/status-pill';
import { EditSectionButton } from '../../../../components/edit-section-button';
import type { EditSection } from '../../../../components/edit-customer-section-dialog';
import { BackfillDisconnectionButton } from '../../../../components/backfill-disconnection-button';
import { getCookieHeader } from '../../../../lib/get-cookie-header';
import { getCustomerJourney } from '../../../../services/customer-journey';
import { getMe } from '../../../../services/auth';
import { derivePlanName } from '../../../../lib/derive-plan';
import { formatRupees, formatRupeesCompact } from '../../../../lib/format-rupees';
import type { Account } from '../../../../services/accounts';

const STATUS_TONE: Record<string, PillTone> = {
  ACTIVE: 'emerald',
  PENDING: 'amber',
  EXPIRED: 'gray',
  TERMINATED: 'red',
  PROBABLE_CHURN: 'amber',
  DISCONNECTING: 'red',
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getCookieHeader();
  let data;
  let me;
  try {
    [data, me] = await Promise.all([
      getCustomerJourney(id, { cookieHeader }),
      getMe({ cookieHeader }).catch(() => null),
    ]);
  } catch {
    notFound();
  }
  if (!data) notFound();
  const account = data.account;
  const isAdmin = me?.user?.role === 'ADMIN';

  const customerName = account.companyName || account.clientName;
  const isNewBase = account.kittyType === 'NEW';
  const plan = derivePlanName(account);
  const usingFallback = !account.currentPlan?.trim();

  // Admin gets an Edit pill in the header of every editable section.
  const editAction = (section: EditSection): React.ReactNode | undefined =>
    isAdmin ? <EditSectionButton account={account as Account} section={section} /> : undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5">
      <PageHeader title={customerName} subtitle="Customer details" />

      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/customers/${account.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to journey
        </Link>
        {/* Admin-only: backfill a historical disconnection. Hidden once the
            account is already TERMINATED to prevent double-counting. */}
        {isAdmin && account.contractStatus !== 'TERMINATED' && (
          <div className="ml-auto">
            <BackfillDisconnectionButton account={account as Account} />
          </div>
        )}
      </div>

      {/* Identity */}
      <Section title="Identity" icon={Fingerprint} actions={editAction('identity')}>
        <Field
          icon={Building2}
          label="Customer name"
          value={account.companyName?.trim() || account.clientName}
          mono={false}
          hint={
            account.companyName?.trim() && account.companyName.trim() !== account.clientName
              ? `Legal entity name — primary contact recorded as "${account.clientName}".`
              : undefined
          }
        />
        <Field
          icon={Hash}
          label="Customer code"
          value={account.customerCode}
          mono
          accent="brand"
        />
        <Field icon={Hash} label="Lead ID" value={account.leadId} mono />
        <Field icon={Hash} label="CRM customer ID" value={account.externalCrmId} mono />
        <Field icon={Wifi} label="Circuit ID" value={account.circuitId} mono />
        <Field icon={Hash} label="User name (internal)" value={account.userName} mono />
        <KittyAndStatus
          kittyType={account.kittyType}
          contractStatus={account.contractStatus}
        />
      </Section>

      {/* Service / Plan */}
      <Section title="Service" icon={Sparkles} actions={editAction('service')}>
        <Field
          icon={Sparkles}
          label="Plan"
          value={plan}
          mono={false}
          hint={usingFallback ? 'Derived from company × bandwidth (no plan name in source).' : undefined}
        />
        <Field
          icon={Wifi}
          label="Bandwidth"
          value={account.bandwidthMbps != null ? `${account.bandwidthMbps} Mbps` : null}
        />
        <Field
          icon={Wallet}
          label="Current ARC"
          value={`${formatRupees(Number(account.currentArc))}  ·  ${formatRupeesCompact(Number(account.currentArc))}`}
          accent="brand"
        />
        <Field
          icon={TrendingUp}
          label="Start-of-period ARC (April 1 snapshot)"
          value={
            account.startOfPeriodArc != null
              ? `${formatRupees(Number(account.startOfPeriodArc))}  ·  ${formatRupeesCompact(Number(account.startOfPeriodArc))}`
              : null
          }
        />
        <Field icon={Calendar} label="Onboarding date" value={fmtDate(account.onboardingDate)} />
        <Field
          icon={CheckCircle2}
          label="Last MOM sent"
          value={account.lastMomDate ? fmtDate(account.lastMomDate) : null}
        />
        <Field
          icon={Calendar}
          label="Last meeting"
          value={account.lastMeetingDate ? fmtDate(account.lastMeetingDate) : null}
        />
      </Section>

      {/* Contact */}
      <Section title="Contact" icon={Phone} actions={editAction('contact')}>
        <Field
          icon={Mail}
          label="Email"
          value={account.email}
          href={account.email ? `mailto:${account.email}` : undefined}
        />
        <Field icon={Phone} label="Mobile number" value={account.mobileNumber} mono />
        <Field
          icon={UserCircle2}
          label="Contact person"
          value={account.contactPersonName}
          preserveLines
        />
        <Field icon={MapPin} label="Address" value={account.address} preserveLines fullWidth />
      </Section>

      {/* Ownership */}
      <Section title="Ownership" icon={Users} actions={editAction('ownership')}>
        <Field
          icon={UserCircle2}
          label="Owning SAM"
          value={
            account.samOwner
              ? `${account.samOwner.name}  ·  ${account.samOwner.email}`
              : null
          }
          empty="Unassigned"
          emptyTone="amber"
        />
        <Field icon={UserCog} label="Account Manager (internal)" value={account.accountManager} />
      </Section>

      {/* Business / Compliance */}
      <Section title="Business details" icon={Briefcase} actions={editAction('business')}>
        <Field icon={IdCard} label="GST number" value={account.gstNumber} mono accent="brand" />
        <Field icon={Briefcase} label="Industry type" value={account.industryType} />
        <Field icon={Globe} label="Circle / zone" value={account.circle} />
        <Field
          icon={Network}
          label="IP details"
          value={account.ipDetails}
          mono
          preserveLines
          fullWidth
        />
      </Section>

      {/* Anything else captured via Excel metadata */}
      {account.metadata && Object.keys(account.metadata).length > 0 && (
        <Section title="Additional metadata (from import)" icon={Layers}>
          <div className="col-span-full">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(account.metadata).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-2.5 text-gray-500 align-top w-1/3">{key}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-mono text-xs whitespace-pre-wrap break-all">
                        {value == null ? '—' : typeof value === 'string' ? value : JSON.stringify(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These columns were present in the source Excel but don't currently have a dedicated
              field in the platform. They're preserved verbatim for reference.
            </p>
          </div>
        </Section>
      )}

      {/* System */}
      <Section title="System" icon={ClipboardList}>
        <Field icon={Fingerprint} label="Account ID" value={account.id} mono fullWidth />
      </Section>

      <div className="text-center text-xs text-gray-400 mt-2">
        Top of page · <Link href={`/customers/${account.id}`} className="hover:text-brand-600">View timeline / journey →</Link>
      </div>
    </div>
  );

  function KittyAndStatus({
    kittyType,
    contractStatus,
  }: {
    kittyType: 'BASE' | 'NEW';
    contractStatus: string;
  }) {
    return (
      <>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
              Kitty
            </div>
            <StatusPill tone={isNewBase ? 'emerald' : 'orange'}>{kittyType}</StatusPill>
          </div>
        </div>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
              Contract status
            </div>
            <StatusPill tone={STATUS_TONE[contractStatus] ?? 'gray'}>{contractStatus}</StatusPill>
          </div>
        </div>
      </>
    );
  }
}

function Section({
  title,
  icon: Icon,
  actions,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {children}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  mono = false,
  preserveLines = false,
  fullWidth = false,
  href,
  accent,
  hint,
  empty = '—',
  emptyTone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode | string | null | undefined;
  mono?: boolean;
  preserveLines?: boolean;
  fullWidth?: boolean;
  href?: string;
  accent?: 'brand';
  hint?: string;
  empty?: string;
  emptyTone?: PillTone;
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '');

  const valueClasses = [
    'text-sm leading-relaxed',
    mono ? 'font-mono text-[13px]' : '',
    accent === 'brand' ? 'text-brand-600 font-semibold' : 'text-gray-900',
    preserveLines ? 'whitespace-pre-wrap break-words' : 'break-words',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex items-start gap-2.5 min-w-0 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
          {label}
        </div>
        {isEmpty ? (
          emptyTone ? (
            <StatusPill tone={emptyTone}>{empty}</StatusPill>
          ) : (
            <span className="text-sm text-gray-400">{empty}</span>
          )
        ) : href ? (
          <a href={href} className={`${valueClasses} hover:text-brand-600`}>
            {value}
          </a>
        ) : (
          <div className={valueClasses}>{value}</div>
        )}
        {hint && <div className="text-[11px] text-gray-500 mt-1 italic">{hint}</div>}
      </div>
    </div>
  );
}
