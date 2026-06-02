import { apiGet, type ApiOpts } from './api-client';

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  performer: { id: string; name: string; email: string; role: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: unknown;
  timestamp: string;
};

export type AuditList = {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export function getAuditLogs(
  filters: {
    entityType?: string;
    entityId?: string;
    performedBy?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  } = {},
  opts: ApiOpts = {},
) {
  const params = new URLSearchParams();
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.entityId) params.set('entityId', filters.entityId);
  if (filters.performedBy) params.set('performedBy', filters.performedBy);
  if (filters.action) params.set('action', filters.action);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return apiGet<AuditList>(`/audit-logs${qs ? `?${qs}` : ''}`, opts);
}
