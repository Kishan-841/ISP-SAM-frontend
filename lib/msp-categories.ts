/**
 * MSP CRM's own product list and GST tables, mirrored so SAM's MSP lead form
 * asks for exactly what theirs does.
 *
 * Source of truth is theirs — `frontend/src/lib/categories.ts` and
 * `frontend/src/lib/gst.ts` in the ISP_CRM_MSP repo. If they add a product,
 * add it here too; sending a name they don't know isn't rejected, it just
 * won't match anything on their side.
 */
export type MspClassification = 'HARDWARE' | 'SOFTWARE';

export const MSP_CLASSIFICATIONS: MspClassification[] = ['HARDWARE', 'SOFTWARE'];

export const MSP_SUBCATEGORIES: Record<MspClassification, string[]> = {
  HARDWARE: ['Firewall', 'Access Point', 'Servers', 'Switches', 'Routers', 'NAS'],
  SOFTWARE: ['Cloud'],
};

export const MSP_CLASSIFICATION_LABEL: Record<MspClassification, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
};

export const MSP_CLASSIFICATION_HINT: Record<MspClassification, string> = {
  HARDWARE: 'Physical devices',
  SOFTWARE: 'Software & cloud',
};

/** GST state codes — the first two digits of a GSTIN. */
export const GST_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

/** 2-digit state code + 10-char PAN + entity no. + "Z" + checksum char. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstin(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return GSTIN_PATTERN.test(g) && g.slice(0, 2) in GST_STATES;
}

/** The state code a GSTIN carries, or null if it isn't a usable GSTIN.
 *  MSP derives the state this way, which is why State is only worth asking
 *  for when there's no GSTIN. */
export function stateCodeFromGstin(gstin: string): string | null {
  return isValidGstin(gstin) ? gstin.trim().toUpperCase().slice(0, 2) : null;
}

/** State options for a dropdown, sorted by name. */
export function gstStateOptions(): Array<{ code: string; name: string }> {
  return Object.entries(GST_STATES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
