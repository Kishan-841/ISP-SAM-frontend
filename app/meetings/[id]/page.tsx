import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { getMeeting, type MeetingDetail } from '../../../services/meetings';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { PageHeader, SectionHeading } from '../../../components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { MarkHeldButton } from '../../../components/mark-held-button';
import { MomEditor } from '../../../components/mom-editor';
import { Within48hBadge } from '../../../components/within-48h-badge';

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getCookieHeader();
  let meeting: MeetingDetail;
  try {
    meeting = (await getMeeting(id, { cookieHeader })).meeting;
  } catch {
    notFound();
  }

  return (
    <div className="px-8 py-6 max-w-5xl flex flex-col gap-4">
      <Link
        href="/meetings"
        className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to meetings
      </Link>

      <PageHeader
        title="Meeting Detail"
        subtitle={
          meeting.account.clientName +
          (meeting.account.customerCode ? ` · ${meeting.account.customerCode}` : '')
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 pt-4 text-sm">
          <Field label="Scheduled" value={formatDateTime(meeting.scheduledAt)} />
          <Field label="SAM" value={meeting.account.samOwner?.name ?? '—'} />
          <Field label="Held" value={meeting.heldAt ? formatDateTime(meeting.heldAt) : '—'} />
          <Field
            label="MoM Sent"
            value={meeting.momSentAt ? formatDateTime(meeting.momSentAt) : '—'}
          />
          <Field label="Customer" value={meeting.account.clientName} />
          <Field label="Circuit ID" value={meeting.account.circuitId ?? '—'} />
          <Field label="Within 48h" value={null}>
            <Within48hBadge heldAt={meeting.heldAt} momSentAt={meeting.momSentAt} />
          </Field>
          <Field label="Kitty" value={meeting.account.kittyType} />
        </CardContent>
      </Card>

      {meeting.agenda && (
        <section className="flex flex-col gap-3">
          <SectionHeading>Agenda</SectionHeading>
          <Card>
            <CardContent className="pt-4 text-sm whitespace-pre-wrap text-gray-700">
              {meeting.agenda}
            </CardContent>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeading>1 · Mark as Held</SectionHeading>
        {meeting.heldAt ? (
          <Card>
            <CardContent className="pt-4 text-sm text-emerald-700">
              ✓ Held on {formatDateTime(meeting.heldAt)}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <p className="text-sm text-gray-700">
                Once the meeting actually takes place, mark it as held. This stops the clock — the
                MoM must follow within 48 hours to stay compliant per CLAUDE.md §3.
              </p>
              <MarkHeldButton meetingId={meeting.id} />
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading>2 · Minutes of Meeting</SectionHeading>
        <Card>
          <CardContent className="pt-4">
            <MomEditor
              meetingId={meeting.id}
              initialContent={meeting.momContent}
              alreadySent={!!meeting.momSentAt}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string | null;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      {children ?? <div className="text-gray-900">{value && value !== '' ? value : '—'}</div>}
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
