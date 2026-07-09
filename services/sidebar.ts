import { apiGet, type ApiOpts } from './api-client';

export type SidebarCounts = {
  approvals: number;
  probableChurn: number;
  unassignedCustomers: number;
};

export function getSidebarCounts(opts: ApiOpts = {}) {
  return apiGet<SidebarCounts>('/sidebar/counts', opts);
}
