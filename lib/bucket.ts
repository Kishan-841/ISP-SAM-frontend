import type { Bucket } from '../services/dashboard';

const SLUG_TO_BUCKET: Record<string, Bucket> = {
  upgrades: 'UPGRADE',
  downgrades: 'DOWNGRADE',
  'rate-revisions': 'RATE_REVISION',
  disconnections: 'DISCONNECTION',
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  UPGRADE: 'Upgrades',
  DOWNGRADE: 'Downgrades',
  RATE_REVISION: 'Rate Revisions',
  DISCONNECTION: 'Disconnections',
};

export const BUCKET_SUBTITLE: Record<Bucket, string> = {
  UPGRADE: 'ARC added',
  DOWNGRADE: 'ARC reduced',
  RATE_REVISION: 'Bandwidth uplift at the same ARC',
  DISCONNECTION: 'ARC lost',
};

export function bucketFromSlug(slug: string): Bucket | null {
  return SLUG_TO_BUCKET[slug] ?? null;
}
