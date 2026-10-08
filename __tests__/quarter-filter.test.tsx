import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/existing-base',
}));

import { QuarterFilter } from '../components/quarter-filter';

describe('QuarterFilter', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('pushes the picked quarter', () => {
    render(<QuarterFilter />);
    fireEvent.click(screen.getByRole('button', { name: 'Q3' }));
    expect(pushMock).toHaveBeenCalledWith('/existing-base?quarter=Q3');
  });

  it('keeps the selected SAM when the quarter changes', () => {
    render(<QuarterFilter sam="sam-a" />);
    fireEvent.click(screen.getByRole('button', { name: 'Q3' }));
    expect(pushMock).toHaveBeenCalledWith('/existing-base?quarter=Q3&sam=sam-a');
  });

  it('keeps the selected SAM when the quarter is cleared to All Time', () => {
    render(<QuarterFilter active="Q3" sam="sam-a" />);
    fireEvent.click(screen.getByRole('button', { name: /all time/i }));
    expect(pushMock).toHaveBeenCalledWith('/existing-base?sam=sam-a');
  });
});
