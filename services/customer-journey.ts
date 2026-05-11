import { apiGet, type ApiOpts } from './api-client';
import type { Account } from './accounts';

export type JourneyEventKind =
  | 'ONBOARDED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'COMMERCIAL_CHANGE'
  | 'MEETING';

export type CommercialChangeType =
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'RATE_REVISION'
  | 'DISCONNECTION';

export type JourneyEvent = {
  id: string;
  kind: JourneyEventKind;
  timestamp: string;
  title: string;
  changeType?: CommercialChangeType;
  oldArc?: number;
  newArc?: number;
  oldBandwidthMbps?: number | null;
  newBandwidthMbps?: number | null;
  reason?: string | null;
  crmStatus?: string | null;
  crmOrderNumber?: string | null;
  accountAppliedAt?: string | null;
  fromOwnerName?: string | null;
  toOwnerName?: string | null;
  momSent?: boolean;
  performerName?: string | null;
};

export type CustomerJourney = {
  account: Account;
  events: JourneyEvent[];
};

export function getCustomerJourney(id: string, opts: ApiOpts = {}) {
  return apiGet<CustomerJourney>(`/accounts/${id}/journey`, opts);
}
