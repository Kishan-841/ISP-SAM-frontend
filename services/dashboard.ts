import { apiGet, type ApiOpts } from './api-client';

export type ExistingBaseMetrics = {
  totalCustomers: number;
  totalBaseArcLakh: number;
  totalBaseMrrLakh: number;
  currentCustomers: number;
  currentArcLakh: number;
  terminatedCount: number;
  upgrades: { count: number; arcAddedLakh: number };
  downgrades: { count: number; arcReducedLakh: number };
  rateRevisions: { count: number; arcChangeLakh: number };
  terminations: { count: number; arcLostLakh: number };
};

export function getExistingBaseMetrics(opts: ApiOpts = {}) {
  return apiGet<ExistingBaseMetrics>('/dashboard/existing-base', opts);
}
