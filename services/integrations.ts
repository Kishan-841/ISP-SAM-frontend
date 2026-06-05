import { apiGet, type ApiOpts } from './api-client';

export type IntegrationStatus = 'PROCESSED' | 'DUPLICATE' | 'REJECTED' | 'FAILED';

export type IntegrationEventRow = {
  id: string;
  source: string;
  eventType: string;
  externalEventId: string;
  occurredAt: string | null;
  receivedAt: string;
  status: IntegrationStatus;
  statusReason: string | null;
  accountId: string | null;
  payload: unknown;
  signatureHeader: string | null;
  timestampHeader: string | null;
  remoteAddr: string | null;
  account: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
  } | null;
};

export type IntegrationEventsResponse = {
  events: IntegrationEventRow[];
  total: number;
  page: number;
  pageSize: number;
};

export function getIntegrationEvents(
  filters: { status?: IntegrationStatus; source?: string; page?: number; pageSize?: number } = {},
  opts: ApiOpts = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.source) params.set('source', filters.source);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiGet<IntegrationEventsResponse>(`/integrations/events${qs}`, opts);
}

export type OutboundCrmFailure = {
  id: string;
  accountId: string;
  changeType: 'UPGRADE' | 'DOWNGRADE' | 'RATE_REVISION' | 'DISCONNECTION';
  oldArc: number;
  newArc: number;
  effectiveDate: string;
  crmStatus: string | null;
  crmStatusUpdatedAt: string | null;
  createdAt: string;
  account: {
    id: string;
    clientName: string;
    companyName: string | null;
    customerCode: string | null;
    kittyType: 'BASE' | 'NEW';
    samOwner: { id: string; name: string; email: string } | null;
  };
};

export type OutboundCrmFailuresResponse = {
  failures: OutboundCrmFailure[];
  total: number;
};

export function getOutboundCrmFailures(opts: ApiOpts = {}) {
  return apiGet<OutboundCrmFailuresResponse>('/integrations/outbound-failures', opts);
}
