import { apiDelete, apiGet, apiPost, type ApiOpts } from './api-client';

export type MeetingType = 'ONLINE' | 'PHYSICAL';

export type ActionItem = {
  srNo: number;
  discussionDescription: string;
  actionOwner: string;
  planOfAction: string;
  closureDate: string | null;
  currentStatus: 'Open' | 'In Progress' | 'Closed';
};

export type MeetingRow = {
  id: string;
  accountId: string;
  scheduledAt: string;
  heldAt: string | null;
  momSentAt: string | null;
  momContent: string | null;
  agenda: string | null;
  meetingType: MeetingType;
  location: string | null;
  clientParticipants: string | null;
  gazonParticipants: string | null;
  actionItems: ActionItem[] | null;
  account: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
    circuitId: string | null;
    kittyType: 'BASE' | 'NEW';
    samOwnerId: string | null;
    samOwner: { id: string; name: string; email: string } | null;
  };
  createdByUser: { id: string; name: string; email: string } | null;
};

export type MeetingDetail = MeetingRow;

export function getMeetings(opts: ApiOpts & { recent?: boolean } = {}) {
  const { recent, ...rest } = opts;
  const qs = recent ? '?recent=true' : '';
  return apiGet<{ meetings: MeetingRow[] }>(`/meetings${qs}`, rest);
}

export function getMeeting(id: string, opts: ApiOpts = {}) {
  return apiGet<{ meeting: MeetingDetail }>(`/meetings/${id}`, opts);
}

export type LogMeetingInput = {
  accountId: string;
  scheduledAt: string;
  agenda?: string;
  meetingType: MeetingType;
  location?: string;
  clientParticipants?: string;
  gazonParticipants?: string;
  actionItems?: ActionItem[];
};

export function logMeeting(input: LogMeetingInput) {
  return apiPost<{ meeting: MeetingRow }>('/meetings', input);
}

export function markHeld(id: string, heldAt?: string) {
  return apiPost<{ meeting: MeetingRow }>(`/meetings/${id}/held`, { heldAt });
}

export function submitMom(id: string, momContent: string) {
  return apiPost<{ meeting: MeetingRow }>(`/meetings/${id}/mom`, { momContent });
}

export type SendMomEmailInput = {
  accountId: string;
  scheduledAt: string;
  meetingType: MeetingType;
  location?: string;
  agenda?: string;
  clientParticipants?: string;
  gazonParticipants?: string;
  actionItems?: ActionItem[];
  momContent: string;
  to?: string;
  cc?: string[];
  subject?: string;
  samDesignation?: string;
  samPhone?: string;
  testMode?: boolean;
};

export type CompleteMeetingInput = {
  agenda?: string;
  clientParticipants?: string;
  gazonParticipants?: string;
  actionItems?: ActionItem[];
  momContent: string;
  to?: string;
  cc?: string[];
  subject?: string;
  samDesignation?: string;
  samPhone?: string;
  testMode?: boolean;
};

export type EmailDispatchStatus = 'SENT' | 'SKIPPED' | 'MISCONFIGURED' | 'FAILED';

export type EmailDispatchResult = {
  meeting: MeetingRow;
  emailStatus: EmailDispatchStatus;
  /** Human-readable reason from the transport (e.g. "Netcore rejected: invalid api_key").
   *  Present for non-SENT outcomes and as a SKIPPED note for testMode runs. */
  emailReason?: string;
  emailMessageId?: string;
};

export function sendMomEmail(input: SendMomEmailInput) {
  return apiPost<EmailDispatchResult>('/meetings/send-mom-email', input);
}

export function completeMeeting(id: string, input: CompleteMeetingInput) {
  return apiPost<EmailDispatchResult>(`/meetings/${id}/send-mom-email`, input);
}

export function deleteMeeting(id: string) {
  return apiDelete<{ deleted: true; snapshot: Record<string, unknown> }>(
    `/meetings/${id}`,
  );
}
