import { apiGet, type ApiOpts } from './api-client';

/** A city row, or (minus `zone`) the shape a zone row is built on. */
export type GeoCityRow = {
  name: string;
  zone: string;
  customerCount: number;
  totalArc: number;
  baseCount: number;
  newCount: number;
  baseArc: number;
  newArc: number;
  /** % of MAPPED ARC — zone shares sum to 100, unmapped sits outside. */
  arcSharePercent: number;
  avgArc: number;
};

export type GeoZoneRow = Omit<GeoCityRow, 'zone'> & {
  cities: GeoCityRow[];
  /** In the zone's totals but not in `cities` — zone known, city blank. */
  unknownCityCount: number;
};

export type Geography = {
  totals: {
    customerCount: number;
    totalArc: number;
    mappedCustomerCount: number;
    mappedArc: number;
    zoneCount: number;
    cityCount: number;
    coveragePercent: number;
  };
  zones: GeoZoneRow[];
  cities: GeoCityRow[];
  unmapped: { customerCount: number; totalArc: number };
};

/**
 * Zone/city rollup of the live book. Zone = the CRM's `circle`, city = `city`;
 * both land on the account via the customer.activated webhook. TERMINATED
 * accounts are excluded by the backend.
 */
export function getGeography(filters: { sam?: string } = {}, opts: ApiOpts = {}) {
  const qs = filters.sam ? `?sam=${encodeURIComponent(filters.sam)}` : '';
  return apiGet<Geography>(`/dashboard/geography${qs}`, opts);
}
