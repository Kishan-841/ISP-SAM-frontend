import type { Account } from '../services/accounts';

/**
 * Status filter chips on /customers. Living in a plain module (no
 * `'use client'`) so the server-rendered page can import the constants
 * and helper without RSC stripping them. The chip-rendering UI lives
 * in components/customers-table.tsx (client) and re-imports from here.
 *
 *   ACTIVE       — billing, healthy
 *   PENDING      — provisioning / not yet billing
 *   AT_RISK      — anywhere in the churn workflow:
 *                  PROBABLE_CHURN, DISCONNECTING, PENDING_QUICK_APPROVAL
 *   TERMINATED   — disconnection completed
 *   EXPIRED      — contract lapsed without a disconnection event
 */
export const STATUS_FILTERS = [
  'all',
  'ACTIVE',
  'PENDING',
  'AT_RISK',
  'TERMINATED',
  'EXPIRED',
] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: 'All',
  ACTIVE: 'Active',
  PENDING: 'Pending',
  AT_RISK: 'At Risk',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
};

export function matchesStatusFilter(
  status: Account['contractStatus'],
  filter: Exclude<StatusFilter, 'all'>,
): boolean {
  if (filter === 'AT_RISK') {
    return (
      status === 'PROBABLE_CHURN' ||
      status === 'DISCONNECTING' ||
      status === 'PENDING_QUICK_APPROVAL'
    );
  }
  return status === filter;
}
