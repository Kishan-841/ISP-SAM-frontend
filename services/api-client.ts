import { env } from '../lib/env';

export type ApiOpts = { cookieHeader?: string };

export async function apiGet<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookieHeader) headers.Cookie = opts.cookieHeader;
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}${path}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookieHeader) headers.Cookie = opts.cookieHeader;
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
