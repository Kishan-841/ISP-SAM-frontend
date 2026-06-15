import React from 'react';
import type { ActionItem } from '../services/meetings';

export type Participant = { name: string; position?: string };

export type MomFormattedPreviewInput = {
  customerName: string;
  scheduledAt: string;
  heldAt: string | null;
  meetingType: 'ONLINE' | 'PHYSICAL';
  location: string | null;
  clientParticipants: Participant[];
  gazonParticipants: Participant[];
  actionItems: ActionItem[];
  body: string;
  samName: string;
  designation: string;
  phone: string;
};

const STATUS_PILL: Record<ActionItem['currentStatus'], string> = {
  Open: 'bg-red-100 text-red-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  Closed: 'bg-emerald-100 text-emerald-800',
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : TIME_FMT.format(d).toLowerCase();
}

/**
 * Mirrors backend `plainBodyToHtml` exactly. Plain text in →
 * paragraphs / bullet lists / bold formatting out.
 *
 * Rules:
 *  - blank lines → paragraph break
 *  - consecutive `- ` lines → <ul>
 *  - `**word**` → <strong>
 *  - lone newlines inside paragraphs → <br>
 */
export function FormattedBody({ raw }: { raw: string }) {
  const text = raw.trim();
  if (!text) return null;
  const blocks = text.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const allBullets = lines.length > 0 && lines.every((l) => /^\s*-\s+/.test(l));
        if (allBullets) {
          return (
            <ul key={i} className="list-disc pl-5 my-2 text-[14px] leading-relaxed">
              {lines.map((l, j) => (
                <li key={j} className="my-1 text-gray-900">
                  {renderBold(l.replace(/^\s*-\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="my-2 text-[14px] leading-relaxed text-gray-900 whitespace-pre-wrap"
          >
            {lines.flatMap((ln, j) =>
              j === 0
                ? [renderBold(ln)]
                : [
                    React.createElement('br', { key: `br-${j}` }),
                    renderBold(ln) as React.ReactNode,
                  ],
            )}
          </p>
        );
      })}
    </>
  );
}

function renderBold(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

/**
 * Visual replica of the customer-facing MoM email.
 *
 * Used in:
 *  - add-mom-dialog.tsx step 2 (live preview)
 *  - /meetings/[id] view-MOM page
 *
 * Must stay 1:1 with backend `mom-to-customer.ts` so the SAM
 * sees exactly what the customer will see.
 */
export function MomFormattedPreview(input: MomFormattedPreviewInput) {
  const heldOrScheduled = input.heldAt ?? input.scheduledAt;
  const allParticipants = [
    ...input.clientParticipants.map((p) => ({ ...p, org: input.customerName })),
    ...input.gazonParticipants.map((p) => ({ ...p, org: 'Gazon Communications' })),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* SAM's body content — rendered OUTSIDE the styled card so it reads
          like a personal plain-text note that happens to be followed by a
          formatted attachment. Matches mom-to-customer.ts. */}
      {input.body.trim() && (
        <div className="px-1 py-2 mb-5 text-[14px] text-gray-900 leading-relaxed">
          <FormattedBody raw={input.body} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-[#ea580c] px-8 py-7">
          <div className="text-[22px] font-bold text-white tracking-tight">
            Minutes of Meeting
          </div>
          <div className="mt-2 text-sm text-orange-100">{input.customerName}</div>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          {/* Key/value details */}
          <table className="w-full mb-6">
            <tbody>
              <DetailRow label="Date" value={formatDate(heldOrScheduled)} />
              <DetailRow label="Time" value={formatTime(heldOrScheduled)} />
              <DetailRow
                label="Type"
                value={input.meetingType === 'PHYSICAL' ? 'Physical' : 'Online'}
              />
              {input.meetingType === 'PHYSICAL' && input.location && (
                <DetailRow label="Venue" value={input.location} />
              )}
            </tbody>
          </table>

          {/* Participants */}
        {allParticipants.length > 0 && (
          <>
            <div className="text-[15px] font-bold text-gray-900 mb-2.5">Participants</div>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#ea580c] text-white">
                    <th className="px-3.5 py-3 text-left font-semibold">Sr No</th>
                    <th className="px-3.5 py-3 text-left font-semibold">Name</th>
                    <th className="px-3.5 py-3 text-left font-semibold">Organisation</th>
                  </tr>
                </thead>
                <tbody>
                  {allParticipants.map((p, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-700">
                        {p.org}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Action items */}
        {input.actionItems.length > 0 && (
          <>
            <div className="text-[15px] font-bold text-gray-900 mb-2.5 mt-4">
              Action Items
            </div>
            <div className="border border-gray-200 rounded-lg overflow-x-auto mb-2">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#ea580c] text-white">
                    <th className="px-3.5 py-3 text-left font-semibold">SR No</th>
                    <th className="px-3.5 py-3 text-left font-semibold">
                      Issue Description
                    </th>
                    <th className="px-3.5 py-3 text-left font-semibold">Action Owner</th>
                    <th className="px-3.5 py-3 text-left font-semibold">Plan of Action</th>
                    <th className="px-3.5 py-3 text-left font-semibold whitespace-nowrap">
                      Closure Date
                    </th>
                    <th className="px-3.5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {input.actionItems.map((it, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-900 align-top">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-900 align-top">
                        {it.discussionDescription}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-700 align-top">
                        {it.actionOwner || '—'}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-700 align-top">
                        {it.planOfAction || '—'}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 text-gray-700 align-top whitespace-nowrap">
                        {it.closureDate || '—'}
                      </td>
                      <td className="px-3.5 py-3 border-t border-gray-100 align-top">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_PILL[it.currentStatus]}`}
                        >
                          {it.currentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="mt-6 text-[14px] text-gray-700 leading-relaxed">
          Thank you for your time. Please feel free to reach out for any clarifications.
        </p>

        <hr className="my-6 border-gray-200" />

        {/* Signature */}
        <div className="text-[14px]">
          <div className="text-gray-900">Best Regards,</div>
          <div className="mt-1 font-bold text-[15px] text-[#ea580c]">{input.samName}</div>
          <div className="mt-0.5 text-[13px] text-gray-500">
            {input.designation.trim()
              ? `${input.designation} - Gazon Communications`
              : 'Gazon Communications India Ltd.'}
          </div>
          {input.phone.trim() && (
            <div className="mt-1 text-[13px] text-gray-500">Phone: {input.phone}</div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 pr-4 text-gray-500 text-[14px] align-top" style={{ width: 110 }}>
        {label}:
      </td>
      <td className="py-1.5 text-gray-900 text-[14px] font-semibold align-top">{value}</td>
    </tr>
  );
}
