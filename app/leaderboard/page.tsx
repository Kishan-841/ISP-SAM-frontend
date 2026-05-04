import { getLeaderboard } from '../../services/leaderboard';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { PageHeader, SectionHeading } from '../../components/page-header';
import { LeaderboardTabs } from '../../components/leaderboard-tabs';
import { Card, CardContent } from '@/components/ui/card';

export default async function LeaderboardPage() {
  const cookieHeader = await getCookieHeader();
  const [samRes, headRes] = await Promise.all([
    getLeaderboard('SAM', { cookieHeader }),
    getLeaderboard('SAM_HEAD', { cookieHeader }),
  ]);

  return (
    <div className="px-8 py-6 max-w-7xl flex flex-col gap-6">
      <PageHeader
        title="SAM Reliability Leaderboard"
        subtitle="Composite score · Revenue 40 / MOM 20 / Compliance 25 / Onboarding 15 · Compliance is tie-breaker"
      />

      <section className="flex flex-col gap-3">
        <SectionHeading>Ranking</SectionHeading>
        <LeaderboardTabs samRanking={samRes.ranking} samHeadRanking={headRes.ranking} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading>Pillar Weights</SectionHeading>
        <Card>
          <CardContent className="pt-6 text-sm space-y-3">
            <p>
              <span className="font-semibold text-gray-900">Revenue (40%)</span>
              <span className="text-gray-600"> — Net ARC Δ on owned Base + Expansion ratio</span>
            </p>
            <p>
              <span className="font-semibold text-gray-900">MOM Discipline (20%)</span>
              <span className="text-gray-600"> — MOM-within-48h rate + Meeting coverage</span>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Compliance Hygiene (25%)</span>
              <span className="text-gray-600"> — Approval attachment rate + Notification success</span>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Onboarding Quality (15%)</span>
              <span className="text-gray-600"> — Clean Handover rate + Time-to-first-MoM (only for SAMs owning New Base accounts)</span>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
