/**
 * Sidebar navigation. The grouping is cosmetic, but losing a link while
 * rearranging would not be — so these tests pin down exactly which routes
 * each role can reach, and that every group header has something under it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
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

/** Hrefs in the desktop expanded rail (the component renders 3 copies). */
function navHrefs(): string[] {
  const rails = document.querySelectorAll('aside');
  const rail = rails[0]!;
  return Array.from(rail.querySelectorAll('nav a')).map((a) => a.getAttribute('href')!);
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
    const hrefs = navHrefs();
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const route of ADMIN_ROUTES) {
      expect(hrefs).toContain(route);
    }
  });

  it('keeps leadership-only routes away from a plain SAM', () => {
    renderFor('SAM');
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
    const hrefs = navHrefs();
    expect(hrefs).toEqual(
      expect.arrayContaining(['/team-performance', '/geography', '/meeting-summary', '/users']),
    );
    expect(hrefs).not.toContain('/integrations');
  });

  it('never renders a group heading with nothing under it', () => {
    renderFor('SAM');
    const rail = document.querySelectorAll('aside')[0]!;
    const groups = rail.querySelectorAll('[data-nav-group]');
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
    const rail = document.querySelectorAll('aside')[0]!;
    const hrefs = Array.from(rail.querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/create-lead');
    expect(hrefs).not.toContain('/my-leads');
    vi.doUnmock('../lib/env');
  });

  it('keeps Change password and Logout reachable outside the scrolling nav', () => {
    renderFor('ADMIN');
    const rail = document.querySelectorAll('aside')[0]!;
    // They must NOT live inside <nav> — that region scrolls once the list
    // is long, and these two need to stay put.
    expect(rail.querySelector('nav a[href="/change-password"]')).toBeNull();
    expect(within(rail as HTMLElement).getAllByRole('link', { name: /change password/i }).length)
      .toBeGreaterThan(0);
  });

  it('labels its groups when expanded', () => {
    renderFor('ADMIN');
    const rail = document.querySelectorAll('aside')[0]!;
    const headings = Array.from(rail.querySelectorAll('[data-nav-group-label]')).map(
      (el) => el.textContent,
    );
    expect(headings).toEqual(expect.arrayContaining(['Customers', 'Commercial']));
  });
});
