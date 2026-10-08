import { getMe } from './auth';
import { getTeam, type TeamMember } from './accounts';
import type { ApiOpts } from './api-client';

/**
 * SAMs offered by the dashboard's SAM-wise filter.
 *
 * Only ADMIN and SAM_HEAD get a dropdown: `/users/team` is restricted to
 * those two roles, and a SAM's dashboard is already scoped to their own
 * customers, so there would be nothing to choose. ADMIN sees every SAM,
 * SAM_HEAD sees their own reports — the endpoint already handles that.
 *
 * Never throws: a failure here hides the filter rather than taking the whole
 * dashboard down with it.
 */
export async function getSamFilterOptions(opts: ApiOpts = {}): Promise<TeamMember[]> {
  try {
    const { user } = await getMe(opts);
    if (user.role !== 'ADMIN' && user.role !== 'SAM_HEAD') return [];
    return await getTeam(opts);
  } catch {
    return [];
  }
}
