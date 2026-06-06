import { cookies } from 'next/headers';

const COOKIE_NAME = 'sam_sidebar_collapsed';
// 1 year — sidebar preference is persistent UX, not session-scoped.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Read the user's saved sidebar-collapsed preference (server-side, inside
 * RSC / route handlers). Returns `false` when no cookie is set — i.e. the
 * default is expanded on first visit.
 */
export async function readSidebarCollapsed(): Promise<boolean> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value === '1';
}

export const SIDEBAR_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
} as const;
