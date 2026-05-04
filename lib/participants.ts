export type Participant = { name: string; position: string };

/**
 * Tolerant parser for the participants column. Accepts:
 *  - JSON-stringified array of {name, position}
 *  - Legacy comma-separated names ("Mr. X, Mr. Y") — position becomes ''
 *  - null / empty → []
 */
export function parseParticipants(raw: string | null | undefined): Participant[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((p) => ({
            name: String(p?.name ?? '').trim(),
            position: String(p?.position ?? '').trim(),
          }))
          .filter((p) => p.name);
      }
    } catch {
      /* fall through to legacy */
    }
  }
  return trimmed
    .split(',')
    .map((n) => ({ name: n.trim(), position: '' }))
    .filter((p) => p.name);
}
