import { StatusPill, type PillTone } from './status-pill';

/**
 * Maps a CRM service-order status string to a SAM-side pill tone.
 * The CRM enum is captured as free text on our side so this stays
 * future-proof — anything we don't recognise renders as gray.
 */
/*
 * Maps CRM-side service-order status strings to SAM-side pill tones + labels.
 *
 * Two generations of CRM enum names are supported simultaneously so the SAM
 * UI is forward + backward compatible:
 *
 *   New stages (post-rename — coordinated with CRM team May 2026):
 *     DELIVERY_APPROVAL → DOCS → NOC → ACCOUNTS → COMPLETED
 *
 *   Legacy stages (still emitted by older CRM rows / pre-rename data):
 *     PENDING_APPROVAL / PENDING_DOCS_REVIEW / PENDING_NOC /
 *     PENDING_SAM_ACTIVATION / PENDING_ACCOUNTS → COMPLETED
 *
 * Unknown strings fall through to the gray pill, so a CRM-side rename
 * never crashes the UI — worst case it reads as `<UNKNOWN_STATE>` in gray
 * until added here.
 */
const TONE_BY_STATUS: Record<string, PillTone> = {
  // New workflow (preferred). Two-track approval:
  //   UPGRADE / DOWNGRADE:                DELIVERY_APPROVAL → SALES_DIRECTOR_APPROVAL → DOCS → NOC → ACCOUNTS → COMPLETED
  //   RATE_REVISION / DISCONNECTION:      SALES_DIRECTOR_APPROVAL → DOCS → NOC → ACCOUNTS → COMPLETED
  DELIVERY_APPROVAL: 'amber',
  SALES_DIRECTOR_APPROVAL: 'amber',
  DOCS: 'amber',
  NOC: 'amber',
  ACCOUNTS: 'amber',
  // Legacy (still supported)
  PENDING_DOCS_REVIEW: 'amber',
  PENDING_NOC: 'amber',
  PENDING_SAM_ACTIVATION: 'amber',
  PENDING_ACCOUNTS: 'amber',
  PENDING_APPROVAL: 'amber',
  APPROVED: 'blue',
  // Terminal states
  COMPLETED: 'emerald',
  DOCS_REJECTED: 'red',
  REJECTED: 'red',
  CANCELLED: 'gray',
  FAILED: 'red',
};

const LABEL_BY_STATUS: Record<string, string> = {
  // New workflow
  DELIVERY_APPROVAL: 'Delivery Approval',
  SALES_DIRECTOR_APPROVAL: 'Sales Director Approval',
  DOCS: 'Docs',
  NOC: 'NOC',
  ACCOUNTS: 'Accounts',
  // Legacy
  PENDING_DOCS_REVIEW: 'Docs Review',
  PENDING_NOC: 'NOC',
  PENDING_SAM_ACTIVATION: 'Activation Pending',
  PENDING_ACCOUNTS: 'Accounts',
  PENDING_APPROVAL: 'Approval Pending',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  DOCS_REJECTED: 'Docs Rejected',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  FAILED: 'CRM Call Failed',
};

export function CrmStatusPill({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  return (
    <StatusPill tone={TONE_BY_STATUS[status] ?? 'gray'}>
      {LABEL_BY_STATUS[status] ?? status}
    </StatusPill>
  );
}
