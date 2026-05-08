import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { getMe } from '../services/auth';
import { getAlerts, type Alert, type AlertSeverity } from '../services/alerts';
import { getCookieHeader } from '../lib/get-cookie-header';

const ROLE_GREETING: Record<string, string> = {
  ADMIN: 'Admin overview',
  SAM_HEAD: 'Team overview',
  SAM: 'Your priorities today',
};

export default async function HomePage() {
  const cookieHeader = await getCookieHeader();
  const [me, alertsRes] = await Promise.all([
    getMe({ cookieHeader }),
    getAlerts({ cookieHeader }),
  ]);

  const { user } = me;
  const { alerts } = alertsRes;
  const allClear = alerts.length === 1 && alerts[0]?.id === 'all-clear';

  // Severity counts for the strip at the top.
  const sevCounts = alerts.reduce(
    (acc, a) => {
      if (a.id !== 'all-clear') acc[a.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<AlertSeverity, number>,
  );

  return (
    <div className="px-8 py-6 max-w-6xl flex flex-col gap-6">
      <PageHeader
        title={`${greeting()}, ${user.name.split(/\s+/)[0]}`}
        subtitle={ROLE_GREETING[user.role] ?? 'Welcome back'}
      />

      {/* Severity strip — always visible, even when all-clear */}
      <div className="flex flex-wrap gap-3">
        <SevPill
          tone="critical"
          count={sevCounts.critical}
          label={sevCounts.critical === 1 ? 'critical' : 'critical'}
        />
        <SevPill
          tone="warning"
          count={sevCounts.warning}
          label={sevCounts.warning === 1 ? 'warning' : 'warnings'}
        />
        <SevPill
          tone="info"
          count={sevCounts.info}
          label={sevCounts.info === 1 ? 'info' : 'info'}
        />
      </div>

      {allClear ? (
        <AllClearCard alert={alerts[0]!} />
      ) : (
        <section className="flex flex-col gap-3">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </section>
      )}

      {/* Quick links footer */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 flex flex-wrap items-center gap-2 justify-between">
        <div className="text-sm text-gray-700">Need to dig deeper?</div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickLink href="/customers">Customers</QuickLink>
          <QuickLink href="/transactions">Transactions</QuickLink>
          <QuickLink href="/meetings">Meetings & MoM</QuickLink>
          {(user.role === 'SAM_HEAD' || user.role === 'ADMIN') && (
            <QuickLink href="/team-performance">Team performance</QuickLink>
          )}
          {(user.role === 'SAM_HEAD' || user.role === 'ADMIN') && (
            <QuickLink href="/audit">Audit log</QuickLink>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const tone = TONE[alert.severity];
  const Icon = tone.icon;
  return (
    <Link
      href={alert.href}
      className={`group block bg-white rounded-xl ring-1 ${tone.ring} hover:shadow-md transition-shadow overflow-hidden`}
    >
      <div className="flex items-stretch">
        {/* Severity stripe */}
        <div className={`w-1.5 ${tone.stripe} flex-shrink-0`} />
        <div className="flex-1 p-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl ${tone.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-5 h-5 ${tone.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900">{alert.title}</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tone.pill}`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1.5">{alert.description}</p>
              {alert.samples && alert.samples.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {alert.samples.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                    >
                      {s}
                    </span>
                  ))}
                  {alert.count > alert.samples.length && (
                    <span className="text-[11px] text-gray-500">
                      + {alert.count - alert.samples.length} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center text-gray-400 group-hover:text-brand-600 transition-colors flex-shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AllClearCard({ alert }: { alert: Alert }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl ring-1 ring-emerald-200 p-8 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-emerald-900 mb-1">{alert.title}</h2>
      <p className="text-sm text-emerald-800/70 max-w-md mx-auto">{alert.description}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <Sparkles className="w-3.5 h-3.5" />
        Keep up the discipline.
      </div>
    </div>
  );
}

function SevPill({
  tone,
  count,
  label,
}: {
  tone: AlertSeverity;
  count: number;
  label: string;
}) {
  const t = TONE[tone];
  const dim = count === 0;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${
        dim ? 'bg-gray-50 ring-gray-200' : `${t.iconBg} ${t.ring}`
      }`}
    >
      <span
        className={`text-base font-bold tabular-nums ${dim ? 'text-gray-400' : t.iconColor}`}
      >
        {count}
      </span>
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${dim ? 'text-gray-400' : t.iconColor}`}
      >
        {label}
      </span>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-orange-50 hover:text-brand-600 transition-colors border border-gray-200 hover:border-orange-200"
    >
      {children}
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

const TONE: Record<
  AlertSeverity,
  {
    ring: string;
    stripe: string;
    iconBg: string;
    iconColor: string;
    pill: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  critical: {
    ring: 'ring-red-200',
    stripe: 'bg-red-500',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    pill: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  warning: {
    ring: 'ring-amber-200',
    stripe: 'bg-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    pill: 'bg-amber-100 text-amber-700',
    icon: AlertCircle,
  },
  info: {
    ring: 'ring-blue-200',
    stripe: 'bg-blue-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    pill: 'bg-blue-100 text-blue-700',
    icon: Info,
  },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
