import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountList } from '../components/account-list';
import type { Account } from '../services/accounts';

const acct = (over: Partial<Account> = {}): Account => ({
  id: '11111111-1111-1111-1111-111111111111',
  clientName: 'Acme',
  kittyType: 'BASE',
  currentMrr: '10000',
  contractStatus: 'ACTIVE',
  lastMomDate: null,
  lastMeetingDate: null,
  onboardingDate: '2025-01-01',
  externalCrmId: null,
  ...over,
});

describe('AccountList', () => {
  it('renders empty state', () => {
    render(<AccountList accounts={[]} />);
    expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument();
  });

  it('renders one row per account', () => {
    render(<AccountList accounts={[acct({ clientName: 'Acme' }), acct({ id: '2', clientName: 'Globex' })]} />);
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('shows BASE/NEW badge per account', () => {
    render(<AccountList accounts={[acct({ kittyType: 'NEW' })]} />);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });
});
