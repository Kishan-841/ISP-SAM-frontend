const apiBase = process.env.NEXT_PUBLIC_API_BASE;
if (!apiBase) {
  throw new Error('NEXT_PUBLIC_API_BASE is required');
}

// Server-side fetches can't resolve relative URLs (no origin). They bypass the
// Next.js proxy and hit the backend directly; cookies are forwarded explicitly.
const internalApiBase = process.env.BACKEND_URL ?? 'http://localhost:5500';

export const env = {
  apiBase,
  internalApiBase,
} as const;
