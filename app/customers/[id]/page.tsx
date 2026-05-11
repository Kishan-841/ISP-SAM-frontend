import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Hash,
  Mail,
  Phone,
  Wifi,
  Wallet,
  UserCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  XCircle,
  UserPlus,
  UserMinus,
  Handshake,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { StatusPill, type PillTone } from '../../../components/status-pill';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getCustomerJourney } from '../../../services/customer-journey';
import type {
  CommercialChangeType,
  JourneyEvent,
  JourneyEventKind,
} from '../../../services/customer-journey';
import { formatRupeesCompact, formatRupees } from '../../../lib/format-rupees';

const STATUS_TONE: Record<string, PillTone> = {
  ACTIVE: 'emerald',
  PENDING: 'amber',
  EXPIRED: 'gray',
  TERMINATED: 'red',
};

export default async function CustomerJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getCookieHeader();
  let data;
  try {
    data = await getCustomerJourney(id, { cookieHeader });
  } catch {
    notFound();
  }
  const { account, events } = data;
  const customerName = account.companyName || account.clientName;
  const isNewBase = account.kittyType === 'NEW';

  return (
    <div className="px-8 py-6 max-w-5xl flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 -mb-2 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <PageHeader
        title={customerName}
        subtitle={
          account.companyName && account.companyName !== account.clientName
            ? account.clientName
            : undefined
        }
        right={
          <div className="flex items-center gap-2">
            <KittyPill kitty={account.kittyType} />
            <StatusPill tone={STATUS_TONE[account.contractStatus] ?? 'gray'}>
              {account.contractStatus}
            </StatusPill>
          </div>
        }
      />

      {/* Customer summary card */}
      <CustomerHeaderCard account={account} isNewBase={isNewBase} />

      {/* Journey timeline */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Customer Journey
          </h2>
          <span className="text-xs text-gray-400">
            {events.length} {events.length === 1 ? 'event' : 'events'} · oldest first
          </span>
        </div>
        <Timeline events={events} />
      </section>
    </div>
  );
}

function CustomerHeaderCard({
  account,
  isNewBase,
}: {
  account: import('../../../services/accounts').Account;
  isNewBase: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
      {/* Top strip — colored by kitty */}
      <div
        className={`h-1.5 w-full ${
          isNewBase
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
            : 'bg-gradient-to-r from-orange-400 to-orange-600'
        }`}
      />

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {account.customerCode && (
          <Field icon={Hash} label="Customer code">
            <span className="font-mono text-sm text-brand-600">{account.customerCode}</span>
          </Field>
        )}
        {account.circuitId && (
          <Field icon={Wifi} label="Circuit ID">
            <span className="font-mono text-sm text-gray-900">{account.circuitId}</span>
          </Field>
        )}
        {account.currentPlan && (
          <Field icon={Sparkles} label="Plan">
            {account.currentPlan}
          </Field>
        )}
        {account.bandwidthMbps != null && (
          <Field icon={Wifi} label="Bandwidth">
            <span className="tabular-nums">{account.bandwidthMbps} Mbps</span>
          </Field>
        )}
        <Field icon={Wallet} label="Current ARC">
          <span className="tabular-nums font-semibold">
            {formatRupeesCompact(Number(account.currentArc))}
          </span>
        </Field>
        <Field icon={UserCircle2} label="Owner">
          {account.samOwner ? (
            <span className="text-gray-900">{account.samOwner.name}</span>
          ) : (
            <span className="text-amber-600 font-medium">Unassigned</span>
          )}
        </Field>
        {account.email && (
          <Field icon={Mail} label="Email">
            <a
              href={`mailto:${account.email}`}
              className="text-sm text-gray-900 hover:text-brand-600 truncate block"
            >
              {account.email}
            </a>
          </Field>
        )}
        {account.mobileNumber && (
          <Field icon={Phone} label="Mobile">
            <span className="tabular-nums">{account.mobileNumber}</span>
          </Field>
        )}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
          {label}
        </div>
        <div className="text-sm text-gray-900 truncate">{children}</div>
      </div>
    </div>
  );
}

function KittyPill({ kitty }: { kitty: 'BASE' | 'NEW' }) {
  if (kitty === 'NEW') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <Sparkles className="w-3 h-3" />
        New Customer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-brand-700 ring-1 ring-orange-200">
      <Building2 className="w-3 h-3" />
      Existing Customer
    </span>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────

function Timeline({ events }: { events: JourneyEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
        <Clock className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-gray-100">
      {events.map((e) => (
        <TimelineEvent key={e.id} event={e} />
      ))}
    </ol>
  );
}

function TimelineEvent({ event }: { event: JourneyEvent }) {
  const visual = visualFor(event);
  const Icon = visual.icon;
  return (
    <li className="ml-6 mb-4 last:mb-0">
      <span
        className={`absolute -left-[14px] mt-1 w-7 h-7 rounded-full ring-4 ring-white ${visual.iconBg} flex items-center justify-center`}
      >
        <Icon className={`w-3.5 h-3.5 ${visual.iconColor}`} />
      </span>
      <div className={`bg-white ring-1 ${visual.ring} rounded-xl p-4`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${visual.pill}`}
              >
                {visual.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mt-1.5">{event.title}</h3>
            <EventBody event={event} />
          </div>
          <div className="text-right text-xs text-gray-500 flex-shrink-0">
            <div className="font-medium">{formatDate(event.timestamp)}</div>
            {event.performerName && (
              <div className="mt-0.5 text-gray-400">by {event.performerName}</div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function EventBody({ event }: { event: JourneyEvent }) {
  if (event.kind === 'COMMERCIAL_CHANGE') {
    const oldArc = event.oldArc ?? 0;
    const newArc = event.newArc ?? 0;
    const delta = newArc - oldArc;
    const sign = delta > 0 ? '+' : '';
    const deltaCls = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-400';
    return (
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {/* ARC change */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 w-16">ARC</span>
          <span className="tabular-nums text-gray-500" title={formatRupees(oldArc)}>
            {formatRupeesCompact(oldArc)}
          </span>
          <span className="text-gray-300">→</span>
          <span className="tabular-nums font-semibold text-gray-900" title={formatRupees(newArc)}>
            {formatRupeesCompact(newArc)}
          </span>
          {delta !== 0 && (
            <span className={`text-xs tabular-nums font-semibold ${deltaCls}`}>
              {sign}{formatRupeesCompact(delta)}
            </span>
          )}
        </div>

        {/* Bandwidth change */}
        {event.oldBandwidthMbps != null && event.newBandwidthMbps != null && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 w-16">
              Bandwidth
            </span>
            <span className="tabular-nums text-gray-500">{event.oldBandwidthMbps} Mbps</span>
            <span className="text-gray-300">→</span>
            <span className="tabular-nums font-semibold text-gray-900">
              {event.newBandwidthMbps} Mbps
            </span>
          </div>
        )}

        {/* Reason */}
        {event.reason && (
          <div className="flex items-start gap-3 mt-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 w-16 mt-0.5">
              Reason
            </span>
            <span className="text-gray-600 text-sm leading-relaxed flex-1">{event.reason}</span>
          </div>
        )}

        {/* CRM status footnote */}
        {event.crmOrderNumber && (
          <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-2 border-t border-dashed border-gray-200 mt-1">
            <span className="font-mono">{event.crmOrderNumber}</span>
            {event.crmStatus && (
              <>
                <span>·</span>
                <span className="font-medium">{event.crmStatus.replace(/_/g, ' ').toLowerCase()}</span>
              </>
            )}
            {event.accountAppliedAt && (
              <>
                <span>·</span>
                <span className="text-emerald-600">applied {formatRelative(event.accountAppliedAt)}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (event.kind === 'ASSIGNED' || event.kind === 'UNASSIGNED') {
    return (
      <div className="mt-2 text-sm text-gray-600">
        {event.fromOwnerName && (
          <span>
            from <span className="font-medium text-gray-700">{event.fromOwnerName}</span>
          </span>
        )}
        {event.fromOwnerName && event.toOwnerName && <span className="mx-1.5">→</span>}
        {event.toOwnerName && (
          <span>
            to <span className="font-medium text-gray-700">{event.toOwnerName}</span>
          </span>
        )}
      </div>
    );
  }

  if (event.kind === 'MEETING') {
    return (
      <div className="mt-1 text-sm">
        {event.momSent ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            MOM sent
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
            <Clock className="w-3 h-3" />
            MOM pending
          </span>
        )}
      </div>
    );
  }

  return null;
}

// ─── Visual config per event kind ──────────────────────────────────

function visualFor(event: JourneyEvent): {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  ring: string;
  pill: string;
} {
  if (event.kind === 'ONBOARDED') {
    return {
      label: 'Onboarded',
      icon: Sparkles,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      ring: 'ring-blue-100',
      pill: 'bg-blue-50 text-blue-700',
    };
  }
  if (event.kind === 'ASSIGNED') {
    return {
      label: 'Assigned',
      icon: UserPlus,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      ring: 'ring-indigo-100',
      pill: 'bg-indigo-50 text-indigo-700',
    };
  }
  if (event.kind === 'UNASSIGNED') {
    return {
      label: 'Unassigned',
      icon: UserMinus,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      ring: 'ring-amber-100',
      pill: 'bg-amber-50 text-amber-700',
    };
  }
  if (event.kind === 'MEETING') {
    return {
      label: 'Meeting',
      icon: Handshake,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      ring: 'ring-violet-100',
      pill: 'bg-violet-50 text-violet-700',
    };
  }
  // COMMERCIAL_CHANGE — color depends on type
  const ct = event.changeType ?? 'UPGRADE';
  return CHANGE_VISUAL[ct];
}

const CHANGE_VISUAL: Record<
  CommercialChangeType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    ring: string;
    pill: string;
  }
> = {
  UPGRADE: {
    label: 'Upgrade',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-100',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  DOWNGRADE: {
    label: 'Downgrade',
    icon: TrendingDown,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    ring: 'ring-amber-100',
    pill: 'bg-amber-50 text-amber-700',
  },
  RATE_REVISION: {
    label: 'Rate Revision',
    icon: ArrowUpDown,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    ring: 'ring-violet-100',
    pill: 'bg-violet-50 text-violet-700',
  },
  DISCONNECTION: {
    label: 'Disconnection',
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    ring: 'ring-red-100',
    pill: 'bg-red-50 text-red-700',
  },
};

// ─── Date helpers ──────────────────────────────────────────────────

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}

function formatRelative(value: string): string {
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

// Suppress unused-import warnings — Calendar and Building2 referenced below
void Calendar;
void Building2;
