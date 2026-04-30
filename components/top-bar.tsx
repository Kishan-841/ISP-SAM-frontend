'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import type { AuthUser } from '../services/auth';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb';

const ROUTE_LABELS: Record<string, { dashboard?: boolean; label: string }> = {
  '/': { label: 'Home' },
  '/existing-base': { dashboard: true, label: 'Existing Base' },
  '/new-base': { dashboard: true, label: 'New Base' },
  '/customers': { label: 'Customers' },
  '/commercial-change': { label: 'Commercial Change' },
  '/meetings': { label: 'Meetings & MoM' },
  '/leaderboard': { label: 'Leaderboard' },
  '/excel-import': { label: 'Excel Import' },
  '/change-password': { label: 'Change password' },
  '/users': { label: 'Users' },
  '/users/new': { label: 'New user' },
  '/accounts': { label: 'Accounts' },
};

function buildCrumbs(pathname: string): BreadcrumbItem[] {
  const route =
    ROUTE_LABELS[pathname] ??
    ROUTE_LABELS[pathname.replace(/\/$/, '')] ?? { label: pathname };

  if (route.dashboard) {
    return [{ label: 'Dashboard' }, { label: route.label }];
  }
  return [{ label: route.label }];
}

export function TopBar({ user }: { user: AuthUser }) {
  const pathname = usePathname() ?? '/';
  const crumbs = buildCrumbs(pathname);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
      <Breadcrumb items={crumbs} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 grid place-items-center rounded-md text-gray-600 hover:bg-gray-50"
        >
          <Bell className="w-5 h-5" />
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"
          />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-900">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-brand-700 font-semibold">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
