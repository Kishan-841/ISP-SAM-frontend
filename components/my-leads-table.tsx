'use client';

import { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { StatusPill, type PillTone } from './status-pill';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { EnrichedLeadRow } from '../services/leads';

/**
 * "My Leads" table — each row carries SAM-side dispatch info + live CRM
 * current-owner + stage. Click a row to see the full form snapshot + a
 * reassignment-detection callout when the lead has moved to a different
 * BDM since SAM raised it.
 */
export function MyLeadsTable({
  rows,
  liveDataAvailable,
}: {
  rows: EnrichedLeadRow[];
  liveDataAvailable: boolean;
}) {
  const [selected, setSelected] = useState<EnrichedLeadRow | null>(null);

  return (
    <>
      <div className="rounded-lg ring-1 ring-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-700">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Lead</th>
              <th className="px-4 py-2.5 text-left font-semibold">Current owner</th>
              <th className="px-4 py-2.5 text-center font-semibold">CRM stage</th>
              <th className="px-4 py-2.5 text-center font-semibold">Dispatch</th>
              <th className="px-4 py-2.5 text-left font-semibold">Created</th>
              <th className="px-4 py-2.5 text-left font-semibold">By</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const reassigned =
                r.currentOwner.id !== r.originalAssignedTo.id &&
                r.dispatchStatus !== 'FAILED';
              return (
                <tr
                  key={r.dispatchId}
                  className="hover:bg-gray-50/40 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.companyName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.contactName}</div>
                    {r.crmLeadNumber && (
                      <div className="font-mono text-[11px] text-brand-600 mt-0.5">
                        {r.crmLeadNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      {r.currentOwner.name}
                    </div>
                    {r.currentOwner.email && (
                      <div className="text-[11px] text-gray-500 ml-5">
                        {r.currentOwner.email}
                      </div>
                    )}
                    {reassigned && (
                      <div className="text-[10px] text-amber-700 ml-5 mt-0.5 flex items-center gap-1">
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        Reassigned from {r.originalAssignedTo.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.liveStatus ? (
                      <StatusPill tone={stageTone(r.liveStatus)}>
                        {stageLabel(r.liveStatus)}
                      </StatusPill>
                    ) : liveDataAvailable ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">
                        unavailable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DispatchPill status={r.dispatchStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {formatRelative(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.createdBy.name}</td>
                  <td className="px-2 py-3 text-gray-300">
                    <ExternalLink className="w-3.5 h-3.5 inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="!max-w-xl w-full sm:max-w-xl flex flex-col p-0">
          {selected && <LeadDetail row={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function LeadDetail({ row }: { row: EnrichedLeadRow }) {
  const reassigned =
    row.currentOwner.id !== row.originalAssignedTo.id && row.dispatchStatus !== 'FAILED';
  return (
    <>
      <SheetHeader className="!gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <DispatchPill status={row.dispatchStatus} />
          {row.liveStatus && (
            <StatusPill tone={stageTone(row.liveStatus)}>{stageLabel(row.liveStatus)}</StatusPill>
          )}
        </div>
        <SheetTitle>{row.companyName}</SheetTitle>
        <SheetDescription>
          {row.contactName}
          {row.crmLeadNumber && (
            <>
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="font-mono text-brand-600">{row.crmLeadNumber}</span>
            </>
          )}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {row.dispatchStatus === 'FAILED' && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p className="font-semibold mb-1">Dispatch failed</p>
            <p className="text-xs">{row.dispatchErrorReason ?? 'Unknown error'}</p>
          </div>
        )}

        {reassigned && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Lead reassigned on CRM
            </p>
            <p className="text-xs">
              Originally sent to <strong>{row.originalAssignedTo.name}</strong>; currently owned by{' '}
              <strong>{row.currentOwner.name}</strong>.
            </p>
          </div>
        )}

        <Section title="Current ownership">
          <KeyValue label="Owner">
            <span className="text-sm text-gray-900">{row.currentOwner.name}</span>
            {row.currentOwner.email && (
              <span className="block text-xs text-gray-500">{row.currentOwner.email}</span>
            )}
          </KeyValue>
          <KeyValue label="Role">
            <span className="text-sm text-gray-900">
              {row.currentOwner.type === 'TEAM_LEADER' ? 'BDM Team Leader' : 'Solo BDM'}
            </span>
          </KeyValue>
          <KeyValue label="CRM stage">
            {row.liveStatus ? (
              <StatusPill tone={stageTone(row.liveStatus)}>
                {stageLabel(row.liveStatus)}
              </StatusPill>
            ) : (
              <span className="text-xs text-gray-400">
                Live CRM data unavailable — endpoint may not be live yet
              </span>
            )}
          </KeyValue>
          <KeyValue label="Last updated on CRM">
            <span className="text-xs text-gray-600">{formatDateTime(row.lastUpdatedAt)}</span>
          </KeyValue>
        </Section>

        <Section title="Contact details">
          <KeyValue label="Company">{row.companyName}</KeyValue>
          <KeyValue label="Contact">{row.contactName}</KeyValue>
          <KeyValue label="Phone">
            <span className="font-mono text-sm text-gray-900 inline-flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-gray-400" />
              {row.phone}
            </span>
          </KeyValue>
          {row.email && (
            <KeyValue label="Email">
              <span className="text-sm text-gray-900 inline-flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gray-400" />
                {row.email}
              </span>
            </KeyValue>
          )}
          {row.designation && <KeyValue label="Designation">{row.designation}</KeyValue>}
          {row.industry && <KeyValue label="Industry">{row.industry}</KeyValue>}
          {row.city && <KeyValue label="City">{row.city}</KeyValue>}
        </Section>

        {row.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-md px-3 py-2">
              {row.notes}
            </p>
          </Section>
        )}

        <Section title="Dispatch history">
          <KeyValue label="Sent at">{formatDateTime(row.createdAt)}</KeyValue>
          <KeyValue label="Sent by">
            <span className="text-sm text-gray-900">{row.createdBy.name}</span>
            <span className="block text-xs text-gray-500">{row.createdBy.email}</span>
          </KeyValue>
          <KeyValue label="SAM dispatch ID">
            <span className="font-mono text-[11px] text-gray-500 break-all">{row.samLeadId}</span>
          </KeyValue>
          {row.crmLeadId && (
            <KeyValue label="CRM lead ID">
              <span className="font-mono text-[11px] text-gray-500 break-all">{row.crmLeadId}</span>
            </KeyValue>
          )}
        </Section>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 flex justify-end">
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </div>
    </>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-3">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function DispatchPill({ status }: { status: 'SENT' | 'DEDUPED' | 'FAILED' }) {
  if (status === 'SENT')
    return (
      <StatusPill tone="emerald">
        <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
        Sent
      </StatusPill>
    );
  if (status === 'DEDUPED')
    return (
      <StatusPill tone="blue">
        <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
        Deduped
      </StatusPill>
    );
  return (
    <StatusPill tone="red">
      <XCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
      Failed
    </StatusPill>
  );
}

// CRM stage strings are free-text — these are best-effort tones for the
// stage names we currently know about. Anything unknown renders gray.
function stageTone(stage: string): PillTone {
  const s = stage.toUpperCase();
  if (s === 'NEW' || s === 'ASSIGNED') return 'blue';
  if (s === 'CONTACTED' || s === 'IN_PROGRESS') return 'amber';
  if (s === 'QUALIFIED' || s === 'NEGOTIATING') return 'purple';
  if (s === 'WON') return 'emerald';
  if (s === 'LOST' || s === 'REJECTED') return 'red';
  return 'gray';
}

function stageLabel(stage: string): string {
  // Convert SNAKE_CASE → Title Case for display.
  return stage
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / (60 * 1000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(diffMs / (60 * 60 * 1000));
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (day < 7) return `${day}d ago`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const mo = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mo} ${yr} · ${hh}:${mm}`;
}
