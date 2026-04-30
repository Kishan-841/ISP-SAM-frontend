import { apiGet, apiPost, type ApiOpts } from './api-client';

export type MeetingRow = {
  id: string;
  accountId: string;
  scheduledAt: string;
  heldAt: string | null;
  momSentAt: string | null;
  momContent: string | null;
  agenda: string | null;
  account: {
    id: string;
    clientName: string;
    kittyType: 'BASE' | 'NEW';
    samOwnerId: string | null;
    samOwner: { id: string; name: string; email: string } | null;
  };
};

export type MeetingDetail = MeetingRow & {
  account: MeetingRow['account'] & {
    customerCode?: string | null;
    circuitId?: string | null;
  };
};

export function getMeetings(opts: ApiOpts & { recent?: boolean } = {}) {
  const { recent, ...rest } = opts;
  const qs = recent ? '?recent=true' : '';
  return apiGet<{ meetings: MeetingRow[] }>(`/meetings${qs}`, rest);
}

export function getMeeting(id: string, opts: ApiOpts = {}) {
  return apiGet<{ meeting: MeetingDetail }>(`/meetings/${id}`, opts);
}

export function logMeeting(input: { accountId: string; scheduledAt: string; agenda?: string }) {
  return apiPost<{ meeting: MeetingRow }>('/meetings', input);
}

export function markHeld(id: string, heldAt?: string) {
  return apiPost<{ meeting: MeetingRow }>(`/meetings/${id}/held`, { heldAt });
}

export function submitMom(id: string, momContent: string) {
  return apiPost<{ meeting: MeetingRow }>(`/meetings/${id}/mom`, { momContent });
}
