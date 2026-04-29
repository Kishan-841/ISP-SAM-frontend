import { env } from '../lib/env';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${env.apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}
