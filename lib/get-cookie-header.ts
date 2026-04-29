import { headers } from 'next/headers';

export async function getCookieHeader(): Promise<string> {
  const h = await headers();
  return h.get('cookie') ?? '';
}
