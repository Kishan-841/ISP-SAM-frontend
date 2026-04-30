'use client';

import { Trophy } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import type { LeaderboardRow } from '../services/leaderboard';

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const columns: Column<LeaderboardRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      align: 'left',
      width: '64px',
      cell: (r) => <span className="font-semibold text-gray-900">{r.rank}</span>,
    },
    {
      key: 'name',
      header: 'SAM',
      sortable: true,
      cell: (r) => r.name,
    },
    {
      key: 'accountsCount',
      header: 'Accounts',
      align: 'right',
      sortable: true,
      cell: (r) => r.accountsCount,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      cell: (r) => (
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-gray-900">{r.revenueScore.toFixed(1)}</span>
          <span className={`text-xs ${r.revenueDeltaPercent > 0 ? 'text-emerald-600' : r.revenueDeltaPercent < 0 ? 'text-red-600' : 'text-gray-400'}`}>
            ({r.revenueDeltaPercent > 0 ? '+' : ''}{r.revenueDeltaPercent.toFixed(1)}%)
          </span>
        </div>
      ),
    },
    {
      key: 'mom',
      header: 'MOM',
      sortable: true,
      cell: (r) => (
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-gray-900">{r.momScore.toFixed(1)}</span>
          <span className="text-xs text-gray-400">(SLA {r.momSlaPercent.toFixed(1)}%)</span>
        </div>
      ),
    },
    {
      key: 'compliance',
      header: 'Compliance',
      sortable: true,
      cell: (r) => (
        <div className="flex flex-col">
          <span className={`font-medium ${r.complianceScore >= 80 ? 'text-emerald-600' : 'text-gray-900'}`}>
            {r.complianceScore.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">approval {r.approvalPercent.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: 'onboarding',
      header: 'Onboarding',
      sortable: true,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{r.onboardingScore.toFixed(1)}</span>
          <span className="text-xs text-gray-400">(clean {r.cleanHandoverPercent.toFixed(1)}%)</span>
        </div>
      ),
    },
    {
      key: 'finalScore',
      header: 'Final Score',
      sortable: true,
      align: 'right',
      cell: (r) => (
        <span className="text-base font-bold text-gray-900 tabular-nums">{r.finalScore.toFixed(1)}</span>
      ),
    },
  ];

  return (
    <DataTable<LeaderboardRow>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.userId}
      emptyTitle="No one on the leaderboard yet"
      emptySubtitle="As you assign customers to SAMs and they log changes/meetings, scores populate here."
      emptyIcon={Trophy}
    />
  );
}
