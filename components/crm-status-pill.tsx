import { StatusPill, type PillTone } from './status-pill';

/**
 * Maps a CRM service-order status string to a SAM-side pill tone.
 * The CRM enum is captured as free text on our side so this stays
 * future-proof — anything we don't recognise renders as gray.
 */
const TONE_BY_STATUS: Record<string, PillTone> = {
  PENDING_DOCS_REVIEW: 'amber',
  PENDING_NOC: 'amber',
  PENDING_SAM_ACTIVATION: 'amber',
  PENDING_ACCOUNTS: 'amber',
  PENDING_APPROVAL: 'amber',
  APPROVED: 'blue',
  COMPLETED: 'emerald',
  DOCS_REJECTED: 'red',
  REJECTED: 'red',
  CANCELLED: 'gray',
  FAILED: 'red',
};

const LABEL_BY_STATUS: Record<string, string> = {
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
