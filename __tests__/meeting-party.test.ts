import { describe, it, expect } from 'vitest';
import { meetingParty } from '../lib/meeting-party';
import type { MeetingRow } from '../services/meetings';

const base = {
  id: 'm1',
  prospectCompany: null,
  prospectContactName: null,
  prospectPhone: null,
  prospectEmail: null,
} as unknown as MeetingRow;

const customer = {
  ...base,
  account: {
    id: 'acc-1',
    clientName: 'Acme Industries',
    companyName: 'Acme Industries Pvt Ltd',
    customerCode: 'GZ-0042',
    circuitId: 'CKT-9',
    kittyType: 'BASE' as const,
    samOwnerId: 'sam-1',
    samOwner: { id: 'sam-1', name: 'Asha Rao', email: 'asha@x.com' },
  },
} as MeetingRow;

const prospect = {
  ...base,
  account: null,
  prospectCompany: 'Accolade Electronics Pvt Ltd',
  prospectContactName: 'R. Deshpande',
  prospectEmail: 'r.deshpande@accolade.example',
} as unknown as MeetingRow;

describe('meetingParty', () => {
  it('describes a customer meeting with a link to the customer', () => {
    const party = meetingParty(customer);
    expect(party.name).toBe('Acme Industries Pvt Ltd');
    expect(party.href).toBe('/customers/acc-1');
    expect(party.isProspect).toBe(false);
    expect(party.customerCode).toBe('GZ-0042');
  });

  it('describes a prospect meeting by the typed-in company, with no link', () => {
    const party = meetingParty(prospect);
    expect(party.name).toBe('Accolade Electronics Pvt Ltd');
    expect(party.href).toBeNull();
    expect(party.isProspect).toBe(true);
    expect(party.customerCode).toBeNull();
  });

  it('shows the contact person as the prospect subtitle', () => {
    expect(meetingParty(prospect).contact).toBe('R. Deshpande');
    expect(meetingParty(customer).contact).toBeNull();
  });

  it('gives search text covering both shapes', () => {
    expect(meetingParty(customer).searchText).toContain('GZ-0042');
    expect(meetingParty(prospect).searchText).toContain('Accolade');
    expect(meetingParty(prospect).searchText).toContain('Deshpande');
  });
});
