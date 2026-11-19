/**
 * Sidebar navigation. The grouping is cosmetic, but losing a link while
 * rearranging would not be — so these tests pin down exactly which routes
 * each role can reach, and that every group header has something under it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// Pretend we're on Zones & Cities, so "the group holding the current page"
// is a real group (Customers) rather than the ungrouped Home entry.
vi.mock('next/navigation', () => ({
  usePathname: () => '/geography',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('../services/auth', () => ({ logout: vi.fn() }));
vi.mock('../app/actions/sidebar', () => ({ setSidebarCollapsed: vi.fn() }));

const { getSidebarCountsMock } = vi.hoisted(() => ({ getSidebarCountsMock: vi.fn() }));
vi.mock('../services/sidebar', () => ({ getSidebarCounts: getSidebarCountsMock }));

// Both lead flags on, so Create Lead / My Leads are in play.
vi.mock('../lib/env', () => ({
  env: { leadDispatchEnabled: true, mspLeadsEnabled: true, apiBase: '/api' },
}));

import { Sidebar } from '../components/sidebar';
import type { AuthUser } from '../services/auth';

beforeEach(() => {
  getSidebarCountsMock.mockReset();
  getSidebarCountsMock.mockResolvedValue({
    approvals: 0,
    probableChurn: 0,
    unassignedCustomers: 0,
  });
});

function renderFor(role: AuthUser['role']) {
  return render(
    <Sidebar
      user={{ id: 'u1', name: 'Test', email: 't@x.com', role } as AuthUser}
      initialCollapsed={false}
    />,
  );
}

function firstRail(): HTMLElement {
  return document.querySelectorAll('aside')[0]! as HTMLElement;
}

/**
 * Groups are collapsed unless you're in them, so reaching every link means
 * opening every group first. Route coverage is asserted against the fully
 * expanded rail — collapsing must hide links, never lose them.
 */
function expandAllGroups(): void {
  const rail = firstRail();
  for (const btn of Array.from(rail.querySelectorAll('button[data-nav-group-toggle]'))) {
    if (btn.getAttribute('aria-expanded') === 'false') fireEvent.click(btn);
  }
}

/** Hrefs in the desktop expanded rail (the component renders 3 copies). */
function navHrefs(): string[] {
  return Array.from(firstRail().querySelectorAll('nav a')).map((a) => a.getAttribute('href')!);
}

const ADMIN_ROUTES = [
  '/',
  '/existing-base',
  '/new-base',
  '/team-performance',
  '/customers',
  '/geography',
  '/probable-churn',
  '/commercial-change',
  '/transactions',
  '/approvals',
  '/meetings',
  '/meeting-summary',
  '/feedbacks',
  '/create-lead',
  '/my-leads',
  '/excel-import',
  '/users',
  '/audit',
  '/integrations',
];

describe('Sidebar', () => {
  it('gives an ADMIN every route, with none duplicated', () => {
    renderFor('ADMIN');
    expandAllGroups();
    const hrefs = navHrefs();
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const route of ADMIN_ROUTES) {
      expect(hrefs).toContain(route);
    }
  });

  it('keeps leadership-only routes away from a plain SAM', () => {
    renderFor('SAM');
    expandAllGroups();
    const hrefs = navHrefs();
    // Still has their daily work…
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/customers', '/meetings', '/commercial-change']),
    );
    // …but none of the leadership or admin views.
    for (const forbidden of [
      '/team-performance',
      '/geography',
      '/meeting-summary',
      '/feedbacks',
      '/users',
      '/audit',
      '/integrations',
      '/approvals',
    ]) {
      expect(hrefs).not.toContain(forbidden);
    }
  });

  it('gives a SAM_HEAD the leadership views but not the integration log', () => {
    renderFor('SAM_HEAD');
    expandAllGroups();
    const hrefs = navHrefs();
    expect(hrefs).toEqual(
      expect.arrayContaining(['/team-performance', '/geography', '/meeting-summary', '/users']),
    );
    expect(hrefs).not.toContain('/integrations');
  });

  it('never renders a group heading with nothing under it', () => {
    renderFor('SAM');
    expandAllGroups();
    const groups = firstRail().querySelectorAll('[data-nav-group]');
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(within(group as HTMLElement).getAllByRole('link').length).toBeGreaterThan(0);
    }
  });

  it('hides the lead routes when both lead flags are off', async () => {
    vi.resetModules();
    vi.doMock('../lib/env', () => ({
      env: { leadDispatchEnabled: false, mspLeadsEnabled: false, apiBase: '/api' },
    }));
    const { Sidebar: Fresh } = await import('../components/sidebar');
    render(
      <Fresh
        user={{ id: 'u1', name: 'T', email: 't@x.com', role: 'ADMIN' } as AuthUser}
        initialCollapsed={false}
      />,
    );
    expandAllGroups();
    const hrefs = Array.from(firstRail().querySelectorAll('nav a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).not.toContain('/create-lead');
    expect(hrefs).not.toContain('/my-leads');
    vi.doUnmock('../lib/env');
  });

  it('keeps Change password and Logout reachable outside the scrolling nav', () => {
    renderFor('ADMIN');
    const rail = firstRail();
    // They must NOT live inside <nav> — that region scrolls once the list
    // is long, and these two need to stay put.
    expect(rail.querySelector('nav a[href="/change-password"]')).toBeNull();
    expect(within(rail as HTMLElement).getAllByRole('link', { name: /change password/i }).length)
      .toBeGreaterThan(0);
  });

  it('labels its groups when expanded', () => {
    renderFor('ADMIN');
    const headings = Array.from(firstRail().querySelectorAll('[data-nav-group-label]')).map(
      (el) => el.textContent,
    );
    expect(headings).toEqual(expect.arrayContaining(['Customers', 'Commercial']));
  });
});

/**
 * The collapsing itself. The point of the accordion is that you see the
 * handful of links you need, not all nineteen — but nothing you need may
 * become unreachable or invisible because of it.
 */
describe('Sidebar group collapsing', () => {
  it('opens only the group holding the current page', () => {
    renderFor('ADMIN'); // usePathname is mocked to '/geography'
    const rail = firstRail();

    // Zones & Cities lives in Customers, so that group is open…
    expect(within(rail).getByRole('link', { name: /zones & cities/i })).toBeInTheDocument();
    expect(within(rail).getByRole('link', { name: /probable churn/i })).toBeInTheDocument();
    // …and every other group is shut.
    expect(within(rail).queryByRole('link', { name: /transactions/i })).toBeNull();
    expect(within(rail).queryByRole('link', { name: /audit log/i })).toBeNull();
  });

  it('keeps Home reachable without belonging to any group', () => {
    renderFor('ADMIN');
    expect(within(firstRail()).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('reveals a group when its header is clicked, and hides it again', () => {
    renderFor('ADMIN');
    const rail = firstRail();
    const toggle = within(rail).getByRole('button', { name: /commercial/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(rail).getByRole('link', { name: /transactions/i })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(within(rail).queryByRole('link', { name: /transactions/i })).toBeNull();
  });

  it('rolls pending counts up onto a shut group so work is never hidden', async () => {
    getSidebarCountsMock.mockResolvedValue({
      approvals: 4,
      probableChurn: 0,
      unassignedCustomers: 0,
    });
    renderFor('ADMIN');
    const rail = firstRail();

    // Approvals is inside Commercial, which is shut on /geography.
    const toggle = await within(rail).findByRole('button', { name: /commercial.*4 pending/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('drops the rolled-up badge once the group is open and the item shows its own', async () => {
    getSidebarCountsMock.mockResolvedValue({
      approvals: 4,
      probableChurn: 0,
      unassignedCustomers: 0,
    });
    renderFor('ADMIN');
    const rail = firstRail();
    const toggle = await within(rail).findByRole('button', { name: /commercial.*4 pending/i });

    fireEvent.click(toggle);
    expect(within(rail).getByRole('button', { name: /^commercial$/i })).toBeInTheDocument();
    expect(
      within(rail).getByRole('link', { name: /approvals \(4 pending\)/i }),
    ).toBeInTheDocument();
  });
});
