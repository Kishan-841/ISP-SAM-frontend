// Browser-side requests go through Next.js's same-origin proxy at /api,
// which is rewritten in next.config.ts → BACKEND_URL. The value is purely
// a routing convention; defaulting is safe.
const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

// Server-side fetches can't resolve relative URLs (no origin). They bypass
// the Next.js proxy and hit the backend directly; cookies are forwarded
// explicitly. MUST be set in production — the localhost fallback only
// makes sense for local dev.
const internalApiBase = process.env.BACKEND_URL ?? 'http://localhost:5500';

export const env = {
  apiBase,
  internalApiBase,
} as const;
