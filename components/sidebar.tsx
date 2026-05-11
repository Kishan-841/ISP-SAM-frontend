'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Plug,
  ListChecks,
  Activity,
  History,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { AuthUser } from '../services/auth';
import { logout } from '../services/auth';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  roles?: AuthUser['role'][];  // when set, only these roles see the item
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Existing Base', href: '/existing-base', icon: BarChart3 },
  { label: 'New Base', href: '/new-base', icon: TrendingUp },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Commercial Change', href: '/commercial-change', icon: ClipboardList },
  { label: 'Transactions', href: '/transactions', icon: ListChecks },
  { label: 'Meetings & MoM', href: '/meetings', icon: CalendarDays },
  { label: 'Team Performance', href: '/team-performance', icon: Activity, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Excel Import', href: '/excel-import', icon: FileDown },
  { label: 'Users', href: '/users', icon: UserCog, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Audit Log', href: '/audit', icon: History, roles: ['ADMIN', 'SAM_HEAD'] },
  { label: 'Integration Log', href: '/integrations', icon: Plug, roles: ['ADMIN'] },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const visibleNavItems = NAV_ITEMS.filter(
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

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <span className="text-brand-600 font-bold text-lg lowercase tracking-tight">gazon</span>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="w-6 h-6 grid place-items-center rounded text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-2">
        <ul>
          {visibleNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const baseClass =
              'flex items-center gap-3 px-4 py-2.5 text-sm border-l-4 transition-colors';
            const activeClass = 'bg-brand-50 text-brand-700 font-semibold border-brand-600';
            const inactiveClass =
              'text-gray-700 hover:bg-gray-50 border-transparent';
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-gray-100 py-2">
        <Link
          href="/change-password"
          className={`flex items-center gap-3 px-4 py-2.5 text-sm border-l-4 transition-colors ${
            isActive(pathname, '/change-password')
              ? 'bg-brand-50 text-brand-700 font-semibold border-brand-600'
              : 'text-gray-700 hover:bg-gray-50 border-transparent'
          }`}
        >
          <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Change password</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-l-4 border-transparent transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
