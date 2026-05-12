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
  return apiMutate<T>('POST', path, body, opts);
}

export async function apiPatch<T>(path: string, body: unknown, opts: ApiOpts = {}): Promise<T> {
  return apiMutate<T>('PATCH', path, body, opts);
}

export async function apiDelete<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  return apiMutate<T>('DELETE', path, undefined, opts);
}

async function apiMutate<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  opts: ApiOpts = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.cookieHeader) headers.Cookie = opts.cookieHeader;
  const base = typeof window === 'undefined' ? env.internalApiBase : env.apiBase;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    // Surface backend error message when JSON, fall back to status code.
    let parsed: { error?: string } | null = null;
    try {
      parsed = JSON.parse(text) as { error?: string };
    } catch {
      parsed = null;
    }
    if (parsed?.error) throw new Error(parsed.error);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
