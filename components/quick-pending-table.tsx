'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { StatusPill } from './status-pill';
import { formatRupeesCompact } from '../lib/format-rupees';
import type { ProbableChurnRow } from '../services/probable-churn';

/**
 * Compact table for accounts sitting in `PENDING_QUICK_APPROVAL`. Renders
 * the SAM's request + reason so SAM_HEAD/ADMIN can see what's awaiting CRM
 * Admin sign-off. No actions yet — APPROVE/REJECT happens on the CRM side
 * (or via the webhook in a follow-up PR).
 */
export function QuickPendingTable({ rows }: { rows: ProbableChurnRow[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-lg ring-1 ring-amber-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-amber-50/60 border-b border-amber-100 text-[11px] uppercase tracking-wider text-amber-900">
          <tr>
            <th className="w-8" />
            <th className="px-4 py-2.5 text-left font-semibold">Customer</th>
            <th className="px-4 py-2.5 text-left font-semibold">Base</th>
            <th className="px-4 py-2.5 text-left font-semibold">SAM</th>
            <th className="px-4 py-2.5 text-right font-semibold">ARC at risk</th>
            <th className="px-4 py-2.5 text-center font-semibold">Requested</th>
            <th className="px-4 py-2.5 text-left font-semibold">Raised</th>
            <th className="px-4 py-2.5 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100/60">
          {rows.map((r) => {
            const isOpen = !!expanded[r.commercialChangeId];
            const customer = r.customer.companyName ?? r.customer.clientName;
            return (
              <>
                <tr
                  key={r.commercialChangeId}
                  className="hover:bg-amber-50/40 cursor-pointer"
                  onClick={() =>
                    setExpanded((p) => ({
                      ...p,
                      [r.commercialChangeId]: !p[r.commercialChangeId],
                    }))
                  }
                >
                  <td className="px-2 py-3 text-center align-middle">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${r.customer.id}`}
                      className="font-medium text-gray-900 hover:text-brand-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {customer}
                    </Link>
                    {r.customer.customerCode && (
                      <div className="font-mono text-[11px] text-brand-600 mt-0.5">
                        {r.customer.customerCode}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={r.account.kittyType === 'NEW' ? 'emerald' : 'purple'}>
                      {r.account.kittyType === 'NEW' ? 'New' : 'Existing'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.samOwner?.name ?? <span className="text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                    {formatRupeesCompact(r.account.currentArc)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-amber-700">
                    {r.quickRequestedDays ?? '—'}{' '}
                    <span className="font-normal text-gray-500">
                      {r.quickRequestedDays === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {formatRelative(r.raisedAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusPill tone="amber">
                      <Zap className="w-3 h-3 inline mr-1 -mt-0.5" />
                      Awaiting CRM
                    </StatusPill>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${r.commercialChangeId}-detail`} className="bg-amber-50/30">
                    <td />
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1">
                            Justification sent to CRM Admin
                          </p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-white rounded-md border border-amber-100 px-3 py-2">
                            {r.quickApprovalReason ?? (
                              <span className="italic text-gray-400">No reason recorded</span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          On approval, customer terminates{' '}
                          <span className="font-semibold text-gray-700">
                            {r.quickRequestedDays} day{r.quickRequestedDays === 1 ? '' : 's'}
                          </span>{' '}
                          later. On rejection, the account returns to ACTIVE and SAM can resubmit
                          as a normal disconnection.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

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
  return `${day}d ago`;
}
