'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardTable } from './leaderboard-table';
import type { LeaderboardRow } from '../services/leaderboard';

export function LeaderboardTabs({
  samRanking,
  samHeadRanking,
}: {
  samRanking: LeaderboardRow[];
  samHeadRanking: LeaderboardRow[];
}) {
  return (
    <Tabs defaultValue="sam">
      <TabsList>
        <TabsTrigger value="sam">SAM ({samRanking.length})</TabsTrigger>
        <TabsTrigger value="sam_head">SAM Head ({samHeadRanking.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="sam" className="mt-4">
        <LeaderboardTable rows={samRanking} />
      </TabsContent>
      <TabsContent value="sam_head" className="mt-4">
        <LeaderboardTable rows={samHeadRanking} />
      </TabsContent>
    </Tabs>
  );
}
