'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import type { AuthUser } from '../services/auth';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb';
import { NotificationsBell } from './notifications-bell';

const ROUTE_LABELS: Record<string, { dashboard?: boolean; label: string }> = {
  '/': { label: 'Home' },
  '/existing-base': { dashboard: true, label: 'Existing Base' },
  '/new-base': { dashboard: true, label: 'New Base' },
  '/customers': { label: 'Customers' },
  '/commercial-change': { label: 'Commercial Change' },
  '/meetings': { label: 'Meetings & MoM' },
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

function openSidebar() {
  // Sidebar listens for this event; this keeps us free of a context provider
  // for what is genuinely a one-way fire-and-forget signal.
  window.dispatchEvent(new CustomEvent('sam:open-sidebar'));
}

export function TopBar({ user }: { user: AuthUser }) {
  const pathname = usePathname() ?? '/';
  const crumbs = buildCrumbs(pathname);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Mobile-only hamburger — desktop has its own sidebar collapse toggle */}
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open navigation"
          className="md:hidden -ml-1 w-9 h-9 grid place-items-center rounded-md text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 truncate">
          <Breadcrumb items={crumbs} />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <NotificationsBell />
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold"
            aria-hidden="true"
          >
            {initial}
          </div>
          {/* Hide the name/role block on phones — avatar alone is enough */}
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[10rem]">
              {user.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-brand-700 font-semibold">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
