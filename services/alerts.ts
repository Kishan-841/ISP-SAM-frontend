import { apiGet, type ApiOpts } from './api-client';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type Alert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  count: number;
  href: string;
  samples?: string[];
};

export function getAlerts(opts: ApiOpts = {}) {
  return apiGet<{ alerts: Alert[] }>('/dashboard/alerts', opts);
}
