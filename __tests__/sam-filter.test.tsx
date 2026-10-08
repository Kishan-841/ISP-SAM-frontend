import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/existing-base',
}));

import { SamFilter } from '../components/sam-filter';

const SAMS = [
  { id: 'sam-a', name: 'Asha Rao', email: 'asha@x.com' },
  { id: 'sam-b', name: 'Vikram Shah', email: 'vikram@x.com' },
];

describe('SamFilter', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('offers every SAM plus an all-SAMs option', () => {
    render(<SamFilter sams={SAMS} />);
    const select = screen.getByLabelText(/filter by sam/i);
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: /all sams/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vikram Shah' })).toBeInTheDocument();
  });

  it('shows the active SAM as selected', () => {
    render(<SamFilter sams={SAMS} active="sam-b" />);
    expect(screen.getByLabelText(/filter by sam/i)).toHaveValue('sam-b');
  });

  it('navigates to the selected SAM, keeping the quarter', () => {
    render(<SamFilter sams={SAMS} quarter="Q2" />);
    fireEvent.change(screen.getByLabelText(/filter by sam/i), { target: { value: 'sam-a' } });
    expect(pushMock).toHaveBeenCalledWith('/existing-base?quarter=Q2&sam=sam-a');
  });

  it('clears the sam param when All SAMs is chosen', () => {
    render(<SamFilter sams={SAMS} active="sam-a" quarter="Q2" />);
    fireEvent.change(screen.getByLabelText(/filter by sam/i), { target: { value: '' } });
    expect(pushMock).toHaveBeenCalledWith('/existing-base?quarter=Q2');
  });

  it('renders nothing when there are no SAMs to choose between', () => {
    const { container } = render(<SamFilter sams={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
