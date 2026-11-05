import type { PillTone } from '../components/status-pill';
import type { MspLeadRow } from '../services/msp-leads';

/**
 * How one MSP lead should read in the UI.
 *
 * Two layers sit on top of each other here. Our own send state comes first:
 * a lead MSP never accepted, or hasn't received yet, is the SAM's problem to
 * know about and outranks any status. Only once MSP has the lead do we show
 * their status — and we show it by `statusLabel`, never by re-wording their
 * `status`, because the contract says new statuses will be added and an
 * unknown one must still be legible.
 */
export type MspLeadPresentation = {
  label: string;
  tone: PillTone;
  /** The reason behind the status, when there is one worth a line. */
  note: string | null;
  /** 2 or more → the customer has ordered again. Normal, per the contract. */
  repeatOrder: number | null;
  /** The SAM (or an admin) has to do something: the lead isn't with MSP. */
  needsAttention: boolean;
};

/**
 * Tone per known status. Anything missing falls through to grey with MSP's
 * own label, which is exactly what the contract asks for.
 */
const TONE: Record<string, PillTone> = {
  RECEIVED: 'amber',
  ASSIGNED: 'blue',
  IN_DISCUSSION: 'blue',
  QUOTATION_IN_PROGRESS: 'purple',
  QUOTATION_SENT: 'purple',
  ORDER_IN_PROGRESS: 'orange',
  INVOICED: 'orange',
  CLOSED_WON: 'emerald',
  DROPPED: 'red',
  REMOVED: 'gray',
};

export function mspLeadPresentation(row: MspLeadRow): MspLeadPresentation {
  const repeatOrder = row.mspOrderNo && row.mspOrderNo > 1 ? row.mspOrderNo : null;

  // MSP refused the data. Nothing will change until someone fixes it, so say
  // so in their words rather than ours.
  if (row.sendStatus === 'REJECTED') {
    return {
      label: 'Not accepted',
      tone: 'red',
      note: row.sendError ?? 'The MSP CRM would not accept this lead.',
      repeatOrder: null,
      needsAttention: true,
    };
  }

  // Saved here but not delivered. The sweep keeps trying, so reassure rather
  // than alarm — but it still counts as needing attention if it persists.
  if (row.sendStatus === 'PENDING') {
    return {
      label: 'Not sent yet',
      tone: 'amber',
      note: `Couldn't reach the MSP CRM${
        row.sendError ? ` (${row.sendError})` : ''
      }. It will be sent again automatically.`,
      repeatOrder: null,
      needsAttention: true,
    };
  }

  if (row.mspRemovedAt) {
    return {
      label: 'Removed in MSP CRM',
      tone: 'gray',
      note: 'This lead was deleted on the MSP side.',
      repeatOrder,
      needsAttention: false,
    };
  }

  const status = row.mspStatus ?? '';
  return {
    // Their wording wins. The fallback only bites if MSP sent a status with
    // no label at all.
    label: row.mspStatusLabel ?? humanise(status),
    tone: TONE[status] ?? 'gray',
    note: status === 'DROPPED' ? row.mspDropReason : null,
    repeatOrder,
    needsAttention: false,
  };
}

/** Last-resort label: ASSIGNED_TO_SALES → "Assigned to sales". */
function humanise(status: string): string {
  if (status === '') return 'Awaiting MSP';
  const words = status.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
