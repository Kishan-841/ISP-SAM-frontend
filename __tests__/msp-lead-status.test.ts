import { describe, it, expect } from 'vitest';
import { mspLeadPresentation } from '../lib/msp-lead-status';
import type { MspLeadRow } from '../services/msp-leads';

const base: MspLeadRow = {
  id: 'row-1',
  externalRef: 'row-1',
  companyName: 'Accolade Electronics Pvt Ltd',
  contactPerson: 'R. Deshpande',
  phone: '9876543210',
  email: 'r.deshpande@accolade.example',
  requirement: '2 firewalls',
  notes: null,
  customerGstin: null,
  customerState: null,
  billingAddress: null,
  classification: 'HARDWARE',
  subcategories: ['Firewall'],
  sendStatus: 'SENT',
  sendError: null,
  sendAttempts: 1,
  lastAttemptAt: '2026-10-30T06:00:00.000Z',
  mspLeadId: 'msp-1',
  mspStatus: 'ASSIGNED',
  mspStatusLabel: 'Assigned to Sales',
  mspAssignedTo: 'Neha Gupta',
  mspOrderNo: 1,
  mspDropReason: null,
  mspRemovedAt: null,
  mspSyncedAt: '2026-10-30T07:00:00.000Z',
  createdAt: '2026-10-30T06:00:00.000Z',
  updatedAt: '2026-10-30T07:00:00.000Z',
  createdBy: { id: 'u1', name: 'Test SAM', email: 'sam@x.com' },
};

const row = (patch: Partial<MspLeadRow>): MspLeadRow => ({ ...base, ...patch });

describe('mspLeadPresentation', () => {
  it('shows the status MSP gave it', () => {
    const p = mspLeadPresentation(base);
    expect(p.label).toBe('Assigned to Sales');
    expect(p.needsAttention).toBe(false);
  });

  it('shows a status it has never heard of, rather than hiding it', () => {
    const p = mspLeadPresentation(
      row({ mspStatus: 'SITE_SURVEY_BOOKED', mspStatusLabel: 'Site survey booked' }),
    );
    expect(p.label).toBe('Site survey booked');
    expect(p.tone).toBe('gray');
  });

  it('gives the reason a lead was dropped', () => {
    const p = mspLeadPresentation(
      row({
        mspStatus: 'DROPPED',
        mspStatusLabel: 'Dropped',
        mspDropReason: 'Budget not approved this quarter',
      }),
    );
    expect(p.label).toBe('Dropped');
    expect(p.tone).toBe('red');
    expect(p.note).toBe('Budget not approved this quarter');
  });

  it('flags a repeat order as a repeat order, not as a mistake', () => {
    const p = mspLeadPresentation(
      row({ mspStatus: 'ASSIGNED', mspStatusLabel: 'Assigned to Sales', mspOrderNo: 2 }),
    );
    expect(p.repeatOrder).toBe(2);
    expect(p.needsAttention).toBe(false);
    expect(p.tone).not.toBe('red');
  });

  it("repeats MSP's own words when MSP would not accept the lead", () => {
    const p = mspLeadPresentation(
      row({
        sendStatus: 'REJECTED',
        sendError: 'MSP 400: phone must be a valid number',
        mspStatus: null,
        mspStatusLabel: null,
      }),
    );
    expect(p.tone).toBe('red');
    expect(p.needsAttention).toBe(true);
    expect(p.note).toContain('phone must be a valid number');
  });

  it('says a lead that could not be delivered will be sent again', () => {
    const p = mspLeadPresentation(
      row({
        sendStatus: 'PENDING',
        sendError: 'MSP 503: Service Unavailable',
        mspStatus: null,
        mspStatusLabel: null,
      }),
    );
    expect(p.label).toBe('Not sent yet');
    expect(p.needsAttention).toBe(true);
    expect(p.note).toMatch(/again/i);
  });

  it('reads as removed once MSP deletes it', () => {
    const p = mspLeadPresentation(
      row({ mspStatus: 'REMOVED', mspRemovedAt: '2026-10-30T08:00:00.000Z' }),
    );
    expect(p.label).toBe('Removed in MSP CRM');
    expect(p.tone).toBe('gray');
  });

  it('marks a won deal as won', () => {
    const p = mspLeadPresentation(
      row({ mspStatus: 'CLOSED_WON', mspStatusLabel: 'Closed Won' }),
    );
    expect(p.tone).toBe('emerald');
  });
});
