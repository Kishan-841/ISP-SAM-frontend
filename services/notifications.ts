import { env } from '../lib/env';
import { apiGet, type ApiOpts } from './api-client';

export type NotificationKind =
  | 'COMMERCIAL_CHANGE_COMMITTED'
  | 'CUSTOMER_ASSIGNED'
  | 'CUSTOMER_UNASSIGNED'
  | 'CUSTOMER_ACTIVATED'
  | 'ACCOUNTS_TEAM_NOTIFIED'
  | 'CRM_ACTIVATION_PENDING'
  | 'CRM_COMPLETED'
  | 'OTHER';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  description: string;
  actorName: string | null;
  timestamp: string;
  href: string;
  meta?: Record<string, string>;
  readAt: string | null;
};

export type NotificationFeed = {
  notifications: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

export function getNotifications(opts: ApiOpts = {}, page = 1, pageSize = 50) {
  const params = new URLSearchParams();
  if (page !== 1) params.set('page', String(page));
  if (pageSize !== 50) params.set('pageSize', String(pageSize));
  const qs = params.toString();
  return apiGet<NotificationFeed>(`/notifications${qs ? `?${qs}` : ''}`, opts);
}

export function getUnreadCount(opts: ApiOpts = {}) {
  return apiGet<{ unread: number }>('/notifications/unread-count', opts);
}

// Browser-side mutations.

async function postClient(path: string): Promise<{ ok: boolean }> {
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export function markNotificationRead(id: string) {
  return postClient(`/notifications/${id}/read`);
}

export function dismissNotification(id: string) {
  return postClient(`/notifications/${id}/dismiss`);
}

export function markAllNotificationsRead() {
  return postClient('/notifications/mark-all-read');
}
