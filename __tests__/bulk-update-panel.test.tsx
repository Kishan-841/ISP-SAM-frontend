/**
 * The "Update zone, city & industry" panel. What matters here is that the
 * operator can tell, without reading the backend, (a) that this mode never
 * creates a customer and (b) exactly what each row changed — a mis-mapped
 * column is only catchable by seeing old → new.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { bulkUpdateMock } = vi.hoisted(() => ({ bulkUpdateMock: vi.fn() }));
vi.mock('../services/bulk-update', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/bulk-update')>();
  return { ...actual, bulkUpdateAccounts: bulkUpdateMock };
});

import { BulkUpdatePanel } from '../components/bulk-update-panel';

function emptySummary(over: Partial<import('../services/bulk-update').BulkUpdateSummary> = {}) {
  return {
    updated: 0,
    unchanged: 0,
    skipped: 0,
    updatedAccounts: [],
    errors: [],
    ...over,
  };
}

async function uploadFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['a,b'], 'zones.csv', { type: 'text/csv' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
  await waitFor(() => expect(screen.getByRole('button', { name: /update customers/i })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: /update customers/i }));
}

beforeEach(() => {
  bulkUpdateMock.mockReset();
});

describe('BulkUpdatePanel', () => {
  it('says up front that it never creates a customer', () => {
    render(<BulkUpdatePanel />);
    expect(screen.getByText(/no new customer is ever created/i)).toBeInTheDocument();
  });

  it('keeps the submit button disabled until a file is chosen', () => {
    render(<BulkUpdatePanel />);
    expect(screen.getByRole('button', { name: /update customers/i })).toBeDisabled();
  });

  it('shows each change as old → new so a wrong column is visible', async () => {
    bulkUpdateMock.mockResolvedValue(
      emptySummary({
        updated: 1,
        updatedAccounts: [
          {
            rowNumber: 2,
            accountId: 'a1',
            clientName: 'Accolade Electronics',
            circuitId: 'CKT-001',
            changes: [
              { field: 'circle', from: 'Old Zone', to: 'Pune' },
              { field: 'city', from: null, to: 'Pune- Chakan' },
            ],
          },
        ],
      }),
    );
    render(<BulkUpdatePanel />);
    await uploadFile();

    await waitFor(() => expect(screen.getByText(/updated 1 customer/i)).toBeInTheDocument());
    expect(screen.getByText('Accolade Electronics')).toBeInTheDocument();
    expect(screen.getByText('Old Zone')).toBeInTheDocument();
    expect(screen.getByText('Pune')).toBeInTheDocument();
    // A field that had nothing before reads "empty", not a blank cell.
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('explains an unmatched row rather than implying it was added', async () => {
    bulkUpdateMock.mockResolvedValue(
      emptySummary({
        skipped: 1,
        errors: [
          {
            rowNumber: 2,
            reason: 'No customer with circuit ID "CKT-999".',
            kind: 'not_found',
            clientName: 'Ghost',
            circuitId: 'CKT-999',
          },
        ],
      }),
    );
    render(<BulkUpdatePanel />);
    await uploadFile();

    await waitFor(() => expect(screen.getByText(/nothing was updated/i)).toBeInTheDocument());
    expect(screen.getByText('No match')).toBeInTheDocument();
    expect(screen.getByText(/Nothing was created for them/i)).toBeInTheDocument();
  });

  it('distinguishes "already correct" from "failed"', async () => {
    bulkUpdateMock.mockResolvedValue(emptySummary({ unchanged: 3 }));
    render(<BulkUpdatePanel />);
    await uploadFile();

    await waitFor(() =>
      expect(screen.getByText(/every row already had these values/i)).toBeInTheDocument(),
    );
    expect(screen.getByText('Already correct')).toBeInTheDocument();
  });

  it('surfaces a failed upload instead of a blank screen', async () => {
    bulkUpdateMock.mockRejectedValue(new Error('Update failed (422): bad file'));
    render(<BulkUpdatePanel />);
    await uploadFile();

    await waitFor(() => expect(screen.getByText(/bad file/i)).toBeInTheDocument());
  });

  it('offers a link to Zones & Cities once something changed', async () => {
    bulkUpdateMock.mockResolvedValue(
      emptySummary({
        updated: 1,
        updatedAccounts: [
          {
            rowNumber: 2,
            accountId: 'a1',
            clientName: 'X',
            circuitId: 'C1',
            changes: [{ field: 'industryType', from: null, to: 'IT' }],
          },
        ],
      }),
    );
    render(<BulkUpdatePanel />);
    await uploadFile();

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /zones & cities/i })).toHaveAttribute(
        'href',
        '/geography',
      ),
    );
  });
});
