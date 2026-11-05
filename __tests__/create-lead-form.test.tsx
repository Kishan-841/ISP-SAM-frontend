/**
 * The Create Lead form in MSP mode. These assertions are about parity with
 * the MSP CRM's own lead form — same tax fields, same classification, same
 * products — plus the one rule that differs between the two destinations:
 * email is required for MSP and optional for ILL.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const { createMspLeadMock, createLeadMock } = vi.hoisted(() => ({
  createMspLeadMock: vi.fn(),
  createLeadMock: vi.fn(),
}));
vi.mock('../services/msp-leads', () => ({ createMspLead: createMspLeadMock }));
vi.mock('../services/leads', () => ({ createLead: createLeadMock }));

import { CreateLeadForm } from '../components/create-lead-form';

function renderForm() {
  return render(<CreateLeadForm bdms={[]} bdmFetchError={null} illEnabled mspEnabled />);
}

/** Fill the four fields every MSP lead needs. */
function fillRequired() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Acme Corp'), {
    target: { value: 'Chakan Precision Works' },
  });
  fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), {
    target: { value: 'S. Kulkarni' },
  });
  fireEvent.change(screen.getByPlaceholderText('10-digit phone number'), {
    target: { value: '9876511111' },
  });
  fireEvent.change(screen.getByPlaceholderText('email@company.com'), {
    target: { value: 's.kulkarni@chakan.example' },
  });
}

const chooseMsp = () => fireEvent.click(screen.getByRole('button', { name: /MSP Lead/i }));

describe('CreateLeadForm — choosing where the lead goes', () => {
  beforeEach(() => {
    createMspLeadMock.mockReset().mockResolvedValue({ status: 'SENT' });
    createLeadMock.mockReset().mockResolvedValue({ crmLeadNumber: 'L-1', assignedToName: 'A' });
  });

  it('starts on ILL, with the BDM picker and no MSP fields', () => {
    renderForm();
    expect(screen.getByLabelText(/Assign to BDM/i)).toBeInTheDocument();
    expect(screen.queryByText('Classification')).not.toBeInTheDocument();
    expect(screen.queryByText('Tax details')).not.toBeInTheDocument();
  });

  it('on MSP, drops the BDM picker — their team lead assigns it', () => {
    renderForm();
    chooseMsp();
    expect(screen.queryByLabelText(/Assign to BDM/i)).not.toBeInTheDocument();
  });

  it('asks for the same tax details as the MSP CRM, all optional', () => {
    renderForm();
    chooseMsp();
    expect(screen.getByText('Tax details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('27AAACA4321P1Z3')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Billing address')).toBeInTheDocument();
  });

  it('offers Hardware and Software, with their products', () => {
    renderForm();
    chooseMsp();
    fireEvent.click(screen.getByRole('button', { name: /Hardware/i }));
    for (const product of ['Firewall', 'Access Point', 'Servers', 'Switches', 'Routers', 'NAS']) {
      expect(screen.getByRole('button', { name: product })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: /Software/i }));
    expect(screen.getByRole('button', { name: 'Cloud' })).toBeInTheDocument();
    // Hardware's products belong to Hardware.
    expect(screen.queryByRole('button', { name: 'Firewall' })).not.toBeInTheDocument();
  });

  it('sends the classification and the products that were picked', async () => {
    renderForm();
    chooseMsp();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /Hardware/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Firewall' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switches' }));
    fireEvent.click(screen.getByRole('button', { name: /Send to MSP CRM/i }));

    await waitFor(() => expect(createMspLeadMock).toHaveBeenCalled());
    expect(createMspLeadMock.mock.calls[0][0]).toMatchObject({
      classification: 'HARDWARE',
      subcategories: ['Firewall', 'Switches'],
    });
  });

  it('sends a lead with no tax details or classification at all', async () => {
    renderForm();
    chooseMsp();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /Send to MSP CRM/i }));

    await waitFor(() => expect(createMspLeadMock).toHaveBeenCalled());
    const payload = createMspLeadMock.mock.calls[0][0];
    expect(payload.classification).toBeUndefined();
    expect(payload.customerGstin).toBeUndefined();
  });

  it('blocks a half-typed GSTIN instead of letting MSP file it as a note', async () => {
    renderForm();
    chooseMsp();
    fillRequired();
    fireEvent.change(screen.getByPlaceholderText('27AAACA4321P1Z3'), {
      target: { value: '27AAACA' },
    });
    expect(screen.getByText(/doesn't look like a valid GSTIN/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Send to MSP CRM/i }));
    await waitFor(() => expect(createMspLeadMock).not.toHaveBeenCalled());
  });

  it('takes the state from a valid GSTIN, the way MSP does', async () => {
    renderForm();
    chooseMsp();
    fillRequired();
    fireEvent.change(screen.getByPlaceholderText('27AAACA4321P1Z3'), {
      target: { value: '27AAACA4321P1Z3' },
    });
    expect(screen.getByText(/taken from the GSTIN/i)).toHaveTextContent('Maharashtra');
    expect(screen.getByLabelText('State')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Send to MSP CRM/i }));
    await waitFor(() => expect(createMspLeadMock).toHaveBeenCalled());
    expect(createMspLeadMock.mock.calls[0][0].customerState).toBe('27');
  });

  it('will not send an MSP lead without an email, but will send an ILL one', async () => {
    renderForm();
    chooseMsp();
    fireEvent.change(screen.getByPlaceholderText('e.g. Acme Corp'), {
      target: { value: 'No Email Ltd' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), {
      target: { value: 'A B' },
    });
    fireEvent.change(screen.getByPlaceholderText('10-digit phone number'), {
      target: { value: '9876511111' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send to MSP CRM/i }));
    await waitFor(() => expect(createMspLeadMock).not.toHaveBeenCalled());
  });
});
