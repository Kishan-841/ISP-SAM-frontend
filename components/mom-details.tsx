import { StatusPill, type PillTone } from './status-pill';
import { parseParticipants } from '../lib/participants';
import type { ActionItem, MeetingType } from '../services/meetings';

const STATUS_TONE: Record<ActionItem['currentStatus'], PillTone> = {
  Open: 'amber',
  'In Progress': 'blue',
  Closed: 'emerald',
};

export function MomDetails({
  meetingType,
  location,
  clientParticipants,
  gazonParticipants,
  actionItems,
}: {
  meetingType: MeetingType;
  location: string | null;
  clientParticipants: string | null;
  gazonParticipants: string | null;
  actionItems: ActionItem[] | null;
}) {
  const client = parseParticipants(clientParticipants);
  const gazon = parseParticipants(gazonParticipants);
  const items = actionItems ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Type</div>
          <div className="text-gray-900">{meetingType === 'PHYSICAL' ? 'Physical' : 'Online'}</div>
        </div>
        {meetingType === 'PHYSICAL' && (
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Venue</div>
            <div className="text-gray-900">{location || '—'}</div>
          </div>
        )}
      </div>

      {(client.length > 0 || gazon.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParticipantPanel title="Client Participants" rows={client} />
          <ParticipantPanel title="Gazon Participants" rows={gazon} />
        </div>
      )}

      {items.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-12">SR</th>
                <th className="px-3 py-2 text-left font-medium">Discussion Description</th>
                <th className="px-3 py-2 text-left font-medium">Action Owner</th>
                <th className="px-3 py-2 text-left font-medium">Plan of Action</th>
                <th className="px-3 py-2 text-left font-medium w-32">Closure Date</th>
                <th className="px-3 py-2 text-left font-medium w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t border-gray-100 even:bg-gray-50/40">
                  <td className="px-3 py-2 text-gray-600">{it.srNo || idx + 1}</td>
                  <td className="px-3 py-2 text-gray-900">{it.discussionDescription}</td>
                  <td className="px-3 py-2 text-gray-700">{it.actionOwner || '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{it.planOfAction || '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{it.closureDate || '—'}</td>
                  <td className="px-3 py-2">
                    <StatusPill tone={STATUS_TONE[it.currentStatus] ?? 'gray'}>
                      {it.currentStatus}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {client.length === 0 && gazon.length === 0 && items.length === 0 && (
        <p className="text-sm text-gray-500">
          No MOM participants or action items recorded for this meeting.
        </p>
      )}
    </div>
  );
}

function ParticipantPanel({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; position: string }[];
}) {
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-400">—</div>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {rows.map((p, idx) => (
            <li key={idx} className="text-gray-900">
              {p.name}
              {p.position && <span className="text-gray-500"> · {p.position}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
