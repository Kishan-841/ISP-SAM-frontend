'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ExternalLink,
  Mail,
  Phone,
  RefreshCw,
  Repeat,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusPill } from './status-pill';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '../lib/format-date';
import { mspLeadPresentation } from '../lib/msp-lead-status';
import { syncMspLeads, type MspLeadRow } from '../services/msp-leads';
import {
  GST_STATES,
  MSP_CLASSIFICATION_LABEL,
  type MspClassification,
} from '../lib/msp-categories';

/**
 * MSP leads table. The status here is a cache of MSP's own, refreshed by a
 * five-minute sweep on the backend — hence the "last refreshed" line and the
 * manual Refresh button, so a SAM checking after a call isn't told to wait.
 */
export function MspLeadsTable({
  rows,
  lastSyncedAt,
}: {
  rows: MspLeadRow[];
  lastSyncedAt: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<MspLeadRow | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [syncing, setSyncing] = useState(false);

  async function refresh() {
    setSyncing(true);
    try {
      const result = await syncMspLeads();
      const changed = result.updated + result.removed;
      toast.success(
        changed > 0
          ? `Refreshed · ${changed} ${changed === 1 ? 'lead' : 'leads'} updated`
          : 'Refreshed · nothing has changed on the MSP side',
        { duration: 4000 },
      );
      startRefresh(() => router.refresh());
    } catch (err) {
      toast.error('Could not refresh from the MSP CRM', {
        description: err instanceof Error ? err.message : 'Try again in a minute.',
        duration: 8000,
      });
    } finally {
      setSyncing(false);
    }
  }

  const busy = syncing || refreshing;

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          {lastSyncedAt ? (
            <>Statuses last refreshed {formatDateTime(lastSyncedAt)} · updates every 5 minutes</>
          ) : (
            <>Statuses haven&apos;t been refreshed yet</>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Refreshing…' : 'Refresh status'}
        </Button>
      </div>

      <div className="rounded-lg ring-1 ring-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-700">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Lead</th>
              <th className="px-4 py-2.5 text-left font-semibold">MSP Sales</th>
              <th className="px-4 py-2.5 text-center font-semibold">Status</th>
              <th className="px-4 py-2.5 text-left font-semibold">Raised</th>
              <th className="px-4 py-2.5 text-left font-semibold">By</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const p = mspLeadPresentation(r);
              return (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/40 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.companyName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.contactPerson}</div>
                    {r.requirement && (
                      <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 max-w-xs">
                        {r.requirement}
                      </div>
                    )}
                    {r.classification && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {classificationLine(r)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.mspAssignedTo ? (
                      <span className="text-sm text-gray-900 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                        {r.mspAssignedTo}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not assigned yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StatusPill tone={p.tone}>{p.label}</StatusPill>
                      {p.repeatOrder && (
                        <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5" />
                          Repeat order #{p.repeatOrder}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {formatDateTime(r.createdAt)}
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
          {selected && <MspLeadDetail row={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MspLeadDetail({ row }: { row: MspLeadRow }) {
  const p = mspLeadPresentation(row);
  return (
    <>
      <SheetHeader className="!gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone="purple">
            <ShieldCheck className="w-3 h-3 inline mr-1 -mt-0.5" />
            MSP
          </StatusPill>
          <StatusPill tone={p.tone}>{p.label}</StatusPill>
          {p.repeatOrder && (
            <StatusPill tone="blue">Repeat order #{p.repeatOrder}</StatusPill>
          )}
        </div>
        <SheetTitle>{row.companyName}</SheetTitle>
        <SheetDescription>{row.contactPerson}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {p.needsAttention && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {row.sendStatus === 'REJECTED'
                ? 'The MSP CRM would not accept this lead'
                : 'Not delivered to the MSP CRM yet'}
            </p>
            <p className="text-xs">{p.note}</p>
            {row.sendStatus === 'REJECTED' && (
              <p className="text-xs mt-1.5">
                Nothing will change on its own — raise it again with the detail corrected.
              </p>
            )}
          </div>
        )}

        {p.note && !p.needsAttention && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            <p className="text-xs font-semibold mb-0.5">Reason</p>
            <p className="text-xs">{p.note}</p>
          </div>
        )}

        <Section title="Status on the MSP CRM">
          <KeyValue label="Status">
            <StatusPill tone={p.tone}>{p.label}</StatusPill>
          </KeyValue>
          <KeyValue label="Sales person">
            <span className="text-sm text-gray-900">
              {row.mspAssignedTo ?? 'Not assigned yet'}
            </span>
          </KeyValue>
          <KeyValue label="Order no.">
            <span className="text-sm text-gray-900">{row.mspOrderNo ?? '—'}</span>
          </KeyValue>
          <KeyValue label="Last refreshed">
            <span className="text-xs text-gray-600">
              {row.mspSyncedAt ? formatDateTime(row.mspSyncedAt) : 'Never'}
            </span>
          </KeyValue>
        </Section>

        <Section title="Lead">
          <KeyValue label="Company">
            <span className="text-sm text-gray-900">{row.companyName}</span>
          </KeyValue>
          <KeyValue label="Contact">
            <span className="text-sm text-gray-900">{row.contactPerson}</span>
          </KeyValue>
          <KeyValue label="Phone">
            <span className="text-sm text-gray-900 inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {row.phone}
            </span>
          </KeyValue>
          <KeyValue label="Email">
            <span className="text-sm text-gray-900 inline-flex items-center gap-1.5 break-all">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {row.email}
            </span>
          </KeyValue>
          <KeyValue label="Requirement">
            <span className="text-sm text-gray-900 whitespace-pre-wrap">
              {row.requirement ?? '—'}
            </span>
          </KeyValue>
          <KeyValue label="Classification">
            {row.classification ? (
              <span className="text-sm text-gray-900">{classificationLine(row)}</span>
            ) : (
              <span className="text-xs text-gray-400">
                Not classified — the MSP team lead categorises it
              </span>
            )}
          </KeyValue>
          <KeyValue label="Notes">
            <span className="text-sm text-gray-900 whitespace-pre-wrap">{row.notes ?? '—'}</span>
          </KeyValue>
        </Section>

        {(row.customerGstin || row.customerState || row.billingAddress) && (
          <Section title="Tax details">
            <KeyValue label="GSTIN">
              <span className="font-mono text-sm text-gray-900">
                {row.customerGstin ?? '—'}
              </span>
            </KeyValue>
            <KeyValue label="State">
              <span className="text-sm text-gray-900">
                {row.customerState ? stateName(row.customerState) : '—'}
              </span>
            </KeyValue>
            <KeyValue label="Billing address">
              <span className="text-sm text-gray-900 whitespace-pre-wrap">
                {row.billingAddress ?? '—'}
              </span>
            </KeyValue>
          </Section>
        )}

        <Section title="Hand-over">
          <KeyValue label="Raised">
            <span className="text-xs text-gray-600">{formatDateTime(row.createdAt)}</span>
          </KeyValue>
          <KeyValue label="Raised by">
            <span className="text-sm text-gray-900">{row.createdBy.name}</span>
            <span className="block text-xs text-gray-500">{row.createdBy.email}</span>
          </KeyValue>
          <KeyValue label="Send attempts">
            <span className="text-xs text-gray-600">
              {row.sendAttempts}
              {row.lastAttemptAt && ` · last ${formatDateTime(row.lastAttemptAt)}`}
            </span>
          </KeyValue>
          {/* Shown because it's the reference both sides can search on when
              something needs chasing with the MSP team. */}
          <KeyValue label="Our ref">
            <span className="font-mono text-[11px] text-gray-600 break-all">
              {row.externalRef}
            </span>
          </KeyValue>
          <KeyValue label="MSP ref">
            <span className="font-mono text-[11px] text-gray-600 break-all">
              {row.mspLeadId ?? '—'}
            </span>
          </KeyValue>
        </Section>
      </div>
    </>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
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

/** "Hardware · Firewall, Switches" — or just the classification when no
 *  products were picked. */
function classificationLine(row: MspLeadRow): string {
  const label =
    MSP_CLASSIFICATION_LABEL[row.classification as MspClassification] ?? row.classification;
  return row.subcategories.length ? `${label} · ${row.subcategories.join(', ')}` : String(label);
}

/** MSP sends the state as a GST code; show the name. */
function stateName(code: string): string {
  return GST_STATES[code] ?? code;
}
