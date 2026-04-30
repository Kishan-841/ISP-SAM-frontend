import Link from 'next/link';
import { getMeetings } from '../../services/meetings';
import { getAccounts } from '../../services/accounts';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { LogMeetingDialog } from '../../components/log-meeting-dialog';
import { Within48hBadge } from '../../components/within-48h-badge';

export default async function MeetingsPage() {
  const cookieHeader = await getCookieHeader();
  const [meetingsRes, accountsRes] = await Promise.all([
    getMeetings({ cookieHeader }),
    getAccounts({}, { cookieHeader }),
  ]);

  return (
    <div className="px-8 py-6 max-w-6xl flex flex-col gap-4">
      <PageHeader
        title="Meetings & MoM"
        subtitle={`${meetingsRes.meetings.length} total`}
        right={<LogMeetingDialog accounts={accountsRes.accounts} />}
      />

      <section className="flex flex-col gap-3">
        <SectionHeading>Meetings</SectionHeading>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-3 py-3">Scheduled</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Kitty</th>
                  <th className="px-3 py-3">SAM</th>
                  <th className="px-3 py-3">Held</th>
                  <th className="px-3 py-3">MOM Sent</th>
                  <th className="px-3 py-3">Within 48h</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {meetingsRes.meetings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 italic">
                      No meetings yet. Click &quot;Log New Meeting&quot; to schedule one.
                    </td>
                  </tr>
                ) : (
                  meetingsRes.meetings.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 text-gray-900">{formatDateTime(m.scheduledAt)}</td>
                      <td className="px-3 py-3 text-gray-900">{m.account.clientName}</td>
                      <td className="px-3 py-3">
                        <KittyPill kitty={m.account.kittyType} />
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {m.account.samOwner?.name ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{formatDateOrDash(m.heldAt)}</td>
                      <td className="px-3 py-3 text-gray-700">{formatDateOrDash(m.momSentAt)}</td>
                      <td className="px-3 py-3">
                        <Within48hBadge heldAt={m.heldAt} momSentAt={m.momSentAt} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/meetings/${m.id}`}
                          className="text-brand-600 hover:underline font-medium"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

function formatDateOrDash(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function KittyPill({ kitty }: { kitty: 'BASE' | 'NEW' }) {
  const cls =
    kitty === 'BASE' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-800';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {kitty === 'BASE' ? 'Base' : 'New'}
    </span>
  );
}
