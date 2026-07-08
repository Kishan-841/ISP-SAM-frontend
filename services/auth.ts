import { apiGet, apiPost, type ApiOpts } from './api-client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SAM_HEAD' | 'SAM' | 'ACCOUNTS' | 'SUPER_ADMIN_2';
};

export function login(email: string, password: string) {
  return apiPost<{ user: AuthUser }>('/auth/login', { email, password });
}

export function logout() {
  return apiPost<{ ok: boolean }>('/auth/logout', {});
}

/**
 * Change the caller's password. Signed-in (in-app) usage omits `email` and
 * relies on the session cookie; the signed-out login-page modal passes `email`
 * to identify the account by email + current password.
 */
export function changePassword(
  currentPassword: string,
  newPassword: string,
  email?: string,
) {
  return apiPost<{ ok: boolean }>('/auth/change-password', {
    currentPassword,
    newPassword,
    ...(email ? { email } : {}),
  });
}

export function getMe(opts: ApiOpts = {}) {
  return apiGet<{ user: AuthUser }>('/auth/me', opts);
}
