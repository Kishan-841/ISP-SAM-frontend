'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  Home,
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
  CalendarDays,
  FileDown,
  UserCog,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plug,
  ListChecks,
  Activity,
  History,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { AuthUser } from '../services/auth';
import { logout } from '../services/auth';
import { env } from '../lib/env';
import { setSidebarCollapsed } from '../app/actions/sidebar';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  roles?: AuthUser['role'][];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Existing Base', href: '/existing-base', icon: BarChart3 },
  { label: 'New Base', href: '/new-base', icon: TrendingUp },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Commercial Change', href: '/commercial-change', icon: ClipboardList },
  { label: 'Transactions', href: '/transactions', icon: ListChecks },
  { label: 'Probable Churn', href: '/probable-churn', icon: ShieldAlert },
  { label: 'Quick Approvals', href: '/quick-approvals', icon: ShieldCheck, roles: ['ADMIN'] },
  { label: 'Meetings & MoM', href: '/meetings', icon: CalendarDays },
  { label: 'Team Performance', href: '/team-performance', icon: Activity, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Excel Import', href: '/excel-import', icon: FileDown },
  { label: 'Users', href: '/users', icon: UserCog, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Audit Log', href: '/audit', icon: History, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Integration Log', href: '/integrations', icon: Plug, roles: ['ADMIN'] },
];

const FLAGGED_NAV_ITEMS: Array<NavItem & { enabled: boolean }> = [
  { label: 'Create Lead', href: '/create-lead', icon: UserPlus, enabled: env.leadDispatchEnabled },
  { label: 'My Leads', href: '/my-leads', icon: ListChecks, enabled: env.leadDispatchEnabled },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The sidebar has three render modes (one component, gated by viewport):
 *
 *   1. EXPANDED desktop (>= md, !collapsed)     → 224px, label + icon
 *   2. COLLAPSED desktop (>= md, collapsed)     → 56px,  icon only, label as title tooltip
 *   3. MOBILE drawer (< md)                     → fixed overlay, opened by hamburger,
 *                                                  dismissed by tap-on-backdrop / Escape
 *
 * Collapsed state is persisted via cookie (read in app/layout.tsx) so the
 * server render matches the user's preference and we avoid an FOUC.
 */
export function Sidebar({
  user,
  initialCollapsed,
}: {
  user: AuthUser;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Close the mobile drawer whenever the route changes — otherwise tapping a
  // nav item leaves the drawer hanging over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Lock body scroll while drawer is open so the page beneath doesn't move.
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Expose drawer-open for the TopBar hamburger via a custom event. Keeps
  // the API simple — no context provider required.
  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener('sam:open-sidebar', open);
    return () => window.removeEventListener('sam:open-sidebar', open);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    startTransition(() => {
      void setSidebarCollapsed(next);
    });
  }

  const allItems = [
    ...NAV_ITEMS,
    ...FLAGGED_NAV_ITEMS.filter((item) => item.enabled).map(({ enabled: _e, ...rest }) => rest),
  ];
  const visibleNavItems = allItems.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  async function onLogout() {
    try {
      await logout();
    } catch {
      // ignore — bounce to login regardless
    }
    router.push('/login');
    router.refresh();
  }

  // ---- Shared rail (rendered for both desktop variants and inside the
  //      mobile drawer). `mode` controls width + label visibility. ------
  function Rail({ mode }: { mode: 'expanded' | 'collapsed' | 'drawer' }) {
    const showLabels = mode !== 'collapsed';
    const widthClass =
      mode === 'collapsed' ? 'w-14' : mode === 'drawer' ? 'w-64' : 'w-56';
    const itemPadX = mode === 'collapsed' ? 'px-0 justify-center' : 'px-4';
    return (
      <aside
        className={`${widthClass} shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto`}
      >
        <div
          className={`py-4 flex items-center border-b border-gray-100 ${
            mode === 'collapsed' ? 'px-0 justify-center' : 'px-4 justify-between'
          }`}
        >
          {showLabels && (
            <span className="text-brand-600 font-bold text-lg lowercase tracking-tight">
              gazon
            </span>
          )}
          {mode === 'drawer' ? (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
              className="w-7 h-7 grid place-items-center rounded text-gray-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
              onClick={toggleCollapsed}
              className="w-7 h-7 grid place-items-center rounded text-gray-500 hover:bg-gray-100"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <nav className="flex-1 py-2">
          <ul>
            {visibleNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={mode === 'collapsed' ? item.label : undefined}
                    aria-label={item.label}
                    className={`flex items-center gap-3 ${itemPadX} py-2.5 text-sm border-l-4 transition-colors ${
                      active
                        ? 'bg-brand-50 text-brand-700 font-semibold border-brand-600'
                        : 'text-gray-700 hover:bg-gray-50 border-transparent'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {showLabels && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-gray-100 py-2">
          <Link
            href="/change-password"
            title={mode === 'collapsed' ? 'Change password' : undefined}
            aria-label="Change password"
            className={`flex items-center gap-3 ${itemPadX} py-2.5 text-sm border-l-4 transition-colors ${
              isActive(pathname, '/change-password')
                ? 'bg-brand-50 text-brand-700 font-semibold border-brand-600'
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
            {showLabels && <span>Change password</span>}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            title={mode === 'collapsed' ? 'Logout' : undefined}
            aria-label="Logout"
            className={`w-full flex items-center gap-3 ${itemPadX} py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-l-4 border-transparent transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {showLabels && <span>Logout</span>}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Desktop rail — sticky strip on the left, hidden under md */}
      <div className="hidden md:block sticky top-0 h-screen z-20">
        <Rail mode={collapsed ? 'collapsed' : 'expanded'} />
      </div>

      {/* Mobile drawer — opened via the hamburger in TopBar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* Drawer */}
          <div className="relative z-50">
            <Rail mode="drawer" />
          </div>
        </div>
      )}
    </>
  );
}
