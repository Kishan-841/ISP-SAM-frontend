'use server';

import { cookies } from 'next/headers';
import { SIDEBAR_COOKIE } from '../../lib/sidebar-state';

/**
 * Persist the sidebar collapsed/expanded preference. Called from the client
 * sidebar toggle button. The cookie is read on the next server render in
 * `layout.tsx` so the initial paint matches what the user chose.
 */
export async function setSidebarCollapsed(collapsed: boolean): Promise<void> {
  const c = await cookies();
  c.set(SIDEBAR_COOKIE.name, collapsed ? '1' : '0', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: SIDEBAR_COOKIE.maxAge,
  });
}
