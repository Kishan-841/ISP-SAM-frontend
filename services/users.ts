import { apiDelete, apiGet, apiPatch, apiPost, type ApiOpts } from './api-client';
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

export type UpdateUserInput = {
  name?: string;
  role?: 'ADMIN' | 'SAM_HEAD' | 'SAM';
  /** null clears the reports-to. undefined leaves it alone. */
  samHeadId?: string | null;
  /** Admin password reset. */
  password?: string;
};

export function updateUser(id: string, input: UpdateUserInput) {
  return apiPatch<{ user: UserRecord }>(`/users/${id}`, input);
}

export function deleteUser(id: string) {
  return apiDelete<{ deleted: true; snapshot: Record<string, unknown> }>(
    `/users/${id}`,
  );
}
