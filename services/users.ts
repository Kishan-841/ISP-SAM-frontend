import { apiGet, apiPost, type ApiOpts } from './api-client';
import type { AuthUser } from './auth';

export type UserRecord = AuthUser & {
  createdAt: string;
  samHead?: { id: string; name: string } | null;
};

export function getUsers(opts: ApiOpts = {}) {
  return apiGet<{ users: UserRecord[] }>('/users', opts);
}

export function createUser(input: {
  email: string;
  name: string;
  role: 'ADMIN' | 'SAM_HEAD' | 'SAM';
  password: string;
  samHeadId?: string;
}) {
  return apiPost<{ user: UserRecord }>('/users', input);
}
