import { apiGet, apiPost, type ApiOpts } from './api-client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SAM_HEAD' | 'SAM';
};

export function login(email: string, password: string) {
  return apiPost<{ user: AuthUser }>('/auth/login', { email, password });
}

export function logout() {
  return apiPost<{ ok: boolean }>('/auth/logout', {});
}

export function getMe(opts: ApiOpts = {}) {
  return apiGet<{ user: AuthUser }>('/auth/me', opts);
}
