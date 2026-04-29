import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('../lib/env', () => ({ env: { apiBase: '/api' } }));

import { Header } from '../components/header';
import type { AuthUser } from '../services/auth';

const adminUser: AuthUser = { id: 'a', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' };
const samUser: AuthUser = { id: 's', email: 'sam@x.com', name: 'Sam One', role: 'SAM' };

describe('Header', () => {
  it('renders the brand wordmark', () => {
    render(<Header user={adminUser} />);
    expect(screen.getByText(/gazon sam/i)).toBeInTheDocument();
  });

  it('shows the current user name', () => {
    render(<Header user={samUser} />);
    expect(screen.getByText('Sam One')).toBeInTheDocument();
  });

  it('shows Users nav link for ADMIN', () => {
    render(<Header user={adminUser} />);
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
  });

  it('hides Users nav link for SAM', () => {
    render(<Header user={samUser} />);
    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
  });

  it('shows logout button', () => {
    render(<Header user={adminUser} />);
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });
});
