import type { Account } from '../services/accounts';

/**
 * Customer plan label, with a sensible fallback when the operator hasn't
 * filled in a plan name in the Excel:
 *   <currentPlan>                       — preferred
 *   <companyName>_<bandwidth>           — fallback when bandwidth is known
 *   <clientName>_<bandwidth>            — when companyName is missing
 *   <bandwidth> Mbps                    — when both names are missing
 *   '—'                                 — when nothing usable exists
 *
 * Centralised so the customers list, the customer-details page, and any
 * future export all show the same derived label.
 */
export function derivePlanName(
  account: Pick<Account, 'currentPlan' | 'companyName' | 'clientName' | 'bandwidthMbps'>,
): string {
  const explicit = account.currentPlan?.trim();
  if (explicit) return explicit;

  const bw = account.bandwidthMbps;
  if (bw == null) return '—';

  const baseName = account.companyName?.trim() || account.clientName?.trim();
  if (baseName) return `${baseName}_${bw}`;
  return `${bw} Mbps`;
}
