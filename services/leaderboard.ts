import { apiGet, type ApiOpts } from './api-client';

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SAM_HEAD' | 'SAM';
  accountsCount: number;
  revenueScore: number;
  momScore: number;
  complianceScore: number;
  onboardingScore: number;
  finalScore: number;
  revenueDeltaPercent: number;
  momSlaPercent: number;
  approvalPercent: number;
  cleanHandoverPercent: number;
};

export function getLeaderboard(role: 'SAM' | 'SAM_HEAD', opts: ApiOpts = {}) {
  return apiGet<{ ranking: LeaderboardRow[] }>(`/leaderboard?role=${role}`, opts);
}
