import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { getCookieHeader } from '../../../lib/get-cookie-header';
import { getMeeting } from '../../../services/meetings';
import { getMe } from '../../../services/auth';
import {
  MomFormattedPreview,
  type Participant,
} from '../../../components/mom-formatted-preview';
import { DeleteMeetingButton } from '../../../components/delete-meeting-button';
import { parseParticipants } from '../../../lib/participants';
import { formatDateTime } from '../../../lib/format-date';

export default async function MeetingViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getCookieHeader();
  let meeting;
  try {
    const res = await getMeeting(id, { cookieHeader });
    meeting = res.meeting;
  } catch {
    notFound();
  }
  if (!meeting) notFound();
  const { user: me } = await getMe({ cookieHeader });

  const customerName = meeting.account.companyName || meeting.account.clientName;
  const clientParticipants: Participant[] = parseParticipants(meeting.clientParticipants);
  const gazonParticipants: Participant[] = parseParticipants(meeting.gazonParticipants);
  const samName = meeting.account.samOwner?.name ?? meeting.createdByUser?.name ?? 'Owning SAM';

  return (
    <div className="px-8 py-6 max-w-6xl flex flex-col gap-6">
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to meetings
        </Link>
        <PageHeader
          title="Minutes of Meeting"
          subtitle={`${customerName} · ${formatDateTime(meeting.scheduledAt) ?? ''}`}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <StatusBadge sent={!!meeting.momSentAt} sentAt={meeting.momSentAt} />
        <div className="flex items-center gap-2">
          <a
            href="javascript:window.print()"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </a>
          {me.role === 'ADMIN' && (
            <DeleteMeetingButton
              meetingId={meeting.id}
              customerName={meeting.account.companyName || meeting.account.clientName}
            />
          )}
        </div>
      </div>

      <MomFormattedPreview
        customerName={customerName}
        scheduledAt={meeting.scheduledAt}
        heldAt={meeting.heldAt}
        meetingType={meeting.meetingType}
        location={meeting.location}
        clientParticipants={clientParticipants}
        gazonParticipants={gazonParticipants}
        actionItems={meeting.actionItems ?? []}
        body={meeting.momContent ?? ''}
        samName={samName}
        designation=""
        phone=""
      />

      {!meeting.momSentAt && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            This meeting has no MoM sent yet. Go back to the meetings list and click
            <span className="font-semibold"> Add MOM </span>
            on this row to record outcome and send the email.
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ sent, sentAt }: { sent: boolean; sentAt: string | null }) {
  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        MoM sent · {formatDateTime(sentAt!) ?? ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      Pending
    </span>
  );
}
