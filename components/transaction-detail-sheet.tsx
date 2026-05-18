'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusPill, type PillTone } from './status-pill';
import { CrmStatusPill } from './crm-status-pill';
import { CrmRowActions } from './crm-row-actions';
import { formatRupeesCompact } from '../lib/format-rupees';
import type { CommercialChangeListItem } from '../services/commercial-changes';

const TYPE_TONE: Record<CommercialChangeListItem['changeType'], PillTone> = {
  UPGRADE: 'emerald',
  DOWNGRADE: 'amber',
  RATE_REVISION: 'purple',
  DISCONNECTION: 'red',
};

const TYPE_LABEL: Record<CommercialChangeListItem['changeType'], string> = {
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RATE_REVISION: 'Rate Revision',
  DISCONNECTION: 'Disconnection',
};

export function TransactionDetailSheet({
  change,
  open,
  onOpenChange,
}: {
  change: CommercialChangeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-xl w-full sm:max-w-xl flex flex-col gap-0 p-0"
      >
        {change && <SheetBodyContent change={change} />}
      </SheetContent>
    </Sheet>
  );
}

function SheetBodyContent({ change }: { change: CommercialChangeListItem }) {
  const oldArc = Number(change.oldArc);
  const newArc = Number(change.newArc);
  const delta = newArc - oldArc;
  const samRef = `SAM-${change.id.slice(0, 8).toUpperCase()}`;
  const isLocalOnly = !change.account.externalCrmId;

  return (
    <>
      <SheetHeader className="!gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone={TYPE_TONE[change.changeType]}>
            {TYPE_LABEL[change.changeType]}
          </StatusPill>
          <StatusPill tone={change.account.kittyType === 'NEW' ? 'emerald' : 'purple'}>
            {change.account.kittyType === 'NEW' ? 'New Base' : 'Existing Base'}
          </StatusPill>
        </div>
        <SheetTitle>{change.account.clientName}</SheetTitle>
        <SheetDescription>
          {change.account.customerCode && (
            <span className="font-mono text-brand-600">{change.account.customerCode}</span>
          )}
          {change.account.customerCode && change.account.circuitId && (
            <span className="text-gray-300 mx-1.5">·</span>
          )}
          {change.account.circuitId && (
            <span className="font-mono">{change.account.circuitId}</span>
          )}
          {!change.account.customerCode && !change.account.circuitId && (
            <span>No customer code or circuit ID on file.</span>
          )}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
        {/* Change summary */}
        <Section title="Change">
          <KeyValue label="ARC">
            <span className="text-sm tabular-nums text-gray-500" title={`₹${oldArc.toLocaleString('en-IN')} per year`}>
              {formatRupeesCompact(oldArc)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 inline mx-2 text-gray-400" />
            <span
              className="text-sm tabular-nums font-medium text-gray-900"
              title={`₹${newArc.toLocaleString('en-IN')} per year`}
            >
              {formatRupeesCompact(newArc)}
            </span>
            <DeltaPill delta={delta} className="ml-2" />
          </KeyValue>
          {(change.oldBandwidthMbps !== null || change.newBandwidthMbps !== null) && (
            <KeyValue label="Bandwidth">
              <span className="text-sm tabular-nums text-gray-500">
                {change.oldBandwidthMbps ?? '—'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 inline mx-2 text-gray-400" />
              <span className="text-sm tabular-nums font-medium text-gray-900">
                {change.newBandwidthMbps !== null
                  ? `${change.newBandwidthMbps} Mbps`
                  : '—'}
              </span>
            </KeyValue>
          )}
          <KeyValue label="Effective date">
            <span className="text-sm text-gray-900">{formatDate(change.effectiveDate)}</span>
          </KeyValue>
          <KeyValue label="Mail received">
            {change.mailReceivedDate ? (
              <span className="text-sm text-gray-900">{formatDate(change.mailReceivedDate)}</span>
            ) : (
              <span className="text-sm text-gray-400">Not recorded</span>
            )}
          </KeyValue>
          <KeyValue label="Recorded at">
            <span className="text-sm text-gray-700">{formatDateTime(change.createdAt)}</span>
          </KeyValue>
        </Section>

        {/* Reason (full text, no truncation) */}
        <Section title="Reason">
          {change.reason ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
              {change.reason}
            </p>
          ) : (
            <p className="text-sm text-gray-400">No reason recorded for this change.</p>
          )}
        </Section>

        {/* Disconnection-specific block */}
        {change.changeType === 'DISCONNECTION' && (
          <Section title="Disconnection details">
            <KeyValue label="Category">
              <span className="text-sm text-gray-900">
                {change.disconnectionCategoryId ?? '—'}
              </span>
            </KeyValue>
            <KeyValue label="Sub-category">
              <span className="text-sm text-gray-900">
                {change.disconnectionSubCategoryId ?? '—'}
              </span>
            </KeyValue>
            <KeyValue label="Customer's reason">
              {change.disconnectionReason ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {change.disconnectionReason}
                </p>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </KeyValue>
          </Section>
        )}

        {/* Documents */}
        <Section title="Documents">
          {change.approvalFileUrl ? (
            <Link
              href={`/api/${change.approvalFileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Customer approval document
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <p className="text-sm text-gray-400">No approval document attached.</p>
          )}
        </Section>

        {/* CRM linkage */}
        <Section title="CRM order">
          {isLocalOnly ? (
            <p className="text-sm text-gray-500">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-2">
                Local-only
              </span>
              This customer was added via Excel import, so there is no CRM service order.
              The change is recorded in SAM only.
            </p>
          ) : (
            <>
              <KeyValue label="SAM reference">
                <span className="font-mono text-xs text-gray-700">{samRef}</span>
              </KeyValue>
              <KeyValue label="CRM order number">
                {change.crmOrderNumber ? (
                  <span className="font-mono text-xs text-gray-900">
                    {change.crmOrderNumber}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Not yet assigned</span>
                )}
              </KeyValue>
              {change.crmServiceOrderId && (
                <KeyValue label="CRM service order ID">
                  <span className="font-mono text-[11px] text-gray-500 break-all">
                    {change.crmServiceOrderId}
                  </span>
                </KeyValue>
              )}
              <KeyValue label="Status">
                <CrmStatusPill status={change.crmStatus} />
                {change.crmStatusUpdatedAt && (
                  <span className="ml-2 text-xs text-gray-500">
                    updated {formatDateTime(change.crmStatusUpdatedAt)}
                  </span>
                )}
              </KeyValue>
              {change.activationDate && (
                <KeyValue label="Activation date">
                  <span className="text-sm text-gray-900">
                    {formatDate(change.activationDate)}
                  </span>
                </KeyValue>
              )}
            </>
          )}
        </Section>
      </div>

      {!isLocalOnly && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/customers/${change.account.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            Open customer journey
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <CrmRowActions
            changeId={change.id}
            crmStatus={change.crmStatus}
            hasCrmOrder={!!change.crmServiceOrderId}
          />
        </div>
      )}
      {isLocalOnly && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 flex items-center justify-end">
          <Link
            href={`/customers/${change.account.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            Open customer journey
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
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

function DeltaPill({ delta, className = '' }: { delta: number; className?: string }) {
  if (delta === 0) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 ${className}`}>
        ₹0
      </span>
    );
  }
  const positive = delta > 0;
  const cls = positive
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-red-50 text-red-700';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${cls} ${className}`}
      title={`${positive ? '+' : ''}₹${Math.round(delta).toLocaleString('en-IN')} per year`}
    >
      {positive ? '+' : ''}{formatRupeesCompact(delta)}
    </span>
  );
}

// ─── Dates ────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = d.getDate();
  const mo = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mo} ${yr} · ${hh}:${mm}`;
}

