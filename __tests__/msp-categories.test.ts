import { describe, it, expect } from 'vitest';
import {
  MSP_SUBCATEGORIES,
  GST_STATES,
  isValidGstin,
  stateCodeFromGstin,
} from '../lib/msp-categories';

describe('MSP classification', () => {
  it('offers the hardware products MSP sells', () => {
    expect(MSP_SUBCATEGORIES.HARDWARE).toEqual([
      'Firewall',
      'Access Point',
      'Servers',
      'Switches',
      'Routers',
      'NAS',
    ]);
  });

  it('offers cloud under software', () => {
    expect(MSP_SUBCATEGORIES.SOFTWARE).toContain('Cloud');
  });
});

describe('GSTIN', () => {
  it('accepts a well-formed GSTIN', () => {
    expect(isValidGstin('27AAACA4321P1Z3')).toBe(true);
  });

  it('rejects one that is the wrong shape', () => {
    expect(isValidGstin('not-a-gstin')).toBe(false);
    expect(isValidGstin('27AAACA4321P1Z')).toBe(false);
  });

  it('rejects a state code that does not exist', () => {
    // 99 is not a GST state.
    expect(isValidGstin('99AAACA4321P1Z3')).toBe(false);
  });

  it('reads the state out of a GSTIN, the way MSP does', () => {
    expect(stateCodeFromGstin('27AAACA4321P1Z3')).toBe('27');
    expect(GST_STATES['27']).toBe('Maharashtra');
    expect(stateCodeFromGstin('nonsense')).toBeNull();
  });
});
