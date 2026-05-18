'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatRupees } from '../lib/format-rupees';

/**
 * Human-readable view over an integration webhook payload.
 *
 * The same `payload` is shown in two layers:
 *   1. A friendly, labelled grid suited to the event type (no JSON noise).
 *   2. A collapsible "Show raw JSON" block for engineers / forensics.
 *
 * The friendly renderer only kicks in for event types we know the shape of —
 * everything else falls back to a generic key/value list and the raw block
 * stays open by default.
 */
export function IntegrationPayloadView({
  eventType,
  payload,
}: {
  eventType: string;
  payload: unknown;
}) {
  const known = eventType === 'customer.activated';
  const [rawOpen, setRawOpen] = useState(!known);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
        Payload
      </div>

      {known ? (
        <CustomerActivatedView payload={payload} />
      ) : (
        <GenericPayloadView payload={payload} />
      )}

      <button
        type="button"
        onClick={() => setRawOpen((v) => !v)}
        className="self-start inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        {rawOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {rawOpen ? 'Hide raw JSON' : 'Show raw JSON'}
      </button>
      {rawOpen && (
        <pre className="bg-gray-900 text-gray-100 text-[11px] rounded-md p-4 overflow-x-auto max-h-72 leading-relaxed font-mono">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── customer.activated ───────────────────────────────────────────────

type CustomerActivatedPayload = {
  eventId?: string;
  eventType?: string;
  occurredAt?: string;
  customer?: {
    externalId?: string;
    companyName?: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    circuitId?: string | null;
    bandwidthMbps?: number | null;
    currentPlan?: string | null;
    currentArc?: number;
    currentMrr?: number;
    onboardingDate?: string;
  };
};

function CustomerActivatedView({ payload }: { payload: unknown }) {
  const p = (payload ?? {}) as CustomerActivatedPayload;
  const c = p.customer ?? {};
  const arc = typeof c.currentArc === 'number'
    ? c.currentArc
    : typeof c.currentMrr === 'number'
      ? c.currentMrr * 12
      : null;
  const arcSource = typeof c.currentArc === 'number' ? 'annual' : 'derived from monthly MRR × 12';

  return (
    <div className="flex flex-col gap-4">
      <Section title="Customer">
        <Row label="Company name" value={c.companyName} mono={false} />
        <Row label="Contact name" value={c.contactName ?? null} />
        <Row label="Email" value={c.email ?? null} />
        <Row label="Phone" value={c.phone ?? null} mono />
        <Row label="External CRM ID" value={c.externalId} mono />
      </Section>

      <Section title="Service">
        <Row label="Plan" value={c.currentPlan ?? null} />
        <Row
          label="Bandwidth"
          value={
            typeof c.bandwidthMbps === 'number' ? `${c.bandwidthMbps} Mbps` : null
          }
        />
        <Row label="Circuit ID" value={c.circuitId ?? null} mono />
        <Row
          label="Annual revenue (ARC)"
          value={arc !== null ? formatRupees(arc) : null}
          hint={arc !== null ? arcSource : undefined}
        />
        <Row
          label="Onboarding date"
          value={c.onboardingDate ? formatDate(c.onboardingDate) : null}
        />
      </Section>
    </div>
  );
}

// ─── Generic fallback ─────────────────────────────────────────────────

function GenericPayloadView({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== 'object') {
    return (
      <p className="text-sm text-gray-500 italic">
        Payload is empty or not an object.
      </p>
    );
  }
  const entries = Object.entries(payload as Record<string, unknown>);
  return (
    <div className="flex flex-col gap-1.5">
      {entries.map(([key, value]) => (
        <Row
          key={key}
          label={key}
          value={renderGenericValue(value)}
          mono={typeof value === 'string' && /^[a-z0-9-]{16,}$/i.test(value)}
        />
      ))}
    </div>
  );
}

function renderGenericValue(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  // Nested objects/arrays — collapse to compact JSON so the row stays readable.
  return JSON.stringify(v);
}

// ─── Bits ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white border border-gray-200">
      <header className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 text-[10px] uppercase tracking-wider font-semibold text-gray-600">
        {title}
      </header>
      <div className="p-4 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono = false,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  hint?: string;
}) {
  const isPresent = value !== null && value !== undefined && value !== '';
  return (
    <div className="grid grid-cols-[160px_1fr] items-baseline gap-3 text-sm">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="min-w-0">
        {isPresent ? (
          <span
            className={`text-gray-900 break-words ${mono ? 'font-mono text-xs' : ''}`}
            title={hint}
          >
            {value}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">not provided</span>
        )}
        {hint && isPresent && (
          <span className="block text-[10px] text-gray-400 mt-0.5">{hint}</span>
        )}
      </div>
    </div>
  );
}

// ─── Dates ────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, y, mo, d] = m;
    const monthIdx = Number(mo) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${Number(d)} ${MONTHS[monthIdx]} ${y}`;
    }
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return value;
}
