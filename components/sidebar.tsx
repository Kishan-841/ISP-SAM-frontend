'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  Home,
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
  CalendarDays,
  CalendarCheck,
  MessageSquareText,
  FileDown,
  UserCog,
  Lock,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plug,
  ListChecks,
  Activity,
  History,
  ShieldAlert,
  ShieldCheck,
  Map,
  UserPlus,
  X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { AuthUser } from '../services/auth';
import { logout } from '../services/auth';
import { getSidebarCounts, type SidebarCounts } from '../services/sidebar';
import { env } from '../lib/env';
import { setSidebarCollapsed } from '../app/actions/sidebar';

const COUNTS_POLL_MS = 45_000;
const EMPTY_COUNTS: SidebarCounts = { approvals: 0, probableChurn: 0, unassignedCustomers: 0 };

// Which nav hrefs carry a badge, and which count field feeds each.
const COUNT_FIELD_BY_HREF: Record<string, keyof SidebarCounts> = {
  '/approvals': 'approvals',
  '/probable-churn': 'probableChurn',
  '/customers': 'unassignedCustomers',
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  roles?: AuthUser['role'][];
  /** Feature-flagged items: false removes the item (and maybe its group). */
  enabled?: boolean;
};

/**
 * Nav grouped by the job you came to do, not by permission level.
 *
 * Nineteen flat links was more list than anyone reads — the eye has to scan
 * every label to find one. Six short groups means it scans headings instead,
 * and only the group you are actually in is open (see `openGroups` below),
 * so the rail shows roughly ten rows rather than twenty-five.
 * A group whose items are all filtered out by role or feature flag is
 * dropped entirely, so nobody sees an empty heading: a plain SAM gets no
 * "Admin" group at all rather than a bare one.
 *
 * Excel Import sits under Customers rather than Admin because it is not an
 * admin tool — every role can reach it, and it now writes the zone and
 * industry that Zones & Cities reports on, so they belong next to each other.
 */
type NavGroup = { label?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  // Ungrouped lead-in — Home needs no heading above it.
  { items: [{ label: 'Home', href: '/', icon: Home }] },
  {
    label: 'Overview',
    items: [
      { label: 'Existing Base', href: '/existing-base', icon: BarChart3 },
      { label: 'New Base', href: '/new-base', icon: TrendingUp },
      { label: 'Team Performance', href: '/team-performance', icon: Activity, roles: ['ADMIN', 'SAM_HEAD'] },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Zones & Cities', href: '/geography', icon: Map, roles: ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD'] },
      { label: 'Probable Churn', href: '/probable-churn', icon: ShieldAlert },
      { label: 'Excel Import', href: '/excel-import', icon: FileDown },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { label: 'Commercial Change', href: '/commercial-change', icon: ClipboardList },
      { label: 'Transactions', href: '/transactions', icon: ListChecks },
      { label: 'Approvals', href: '/approvals', icon: ShieldCheck, roles: ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD', 'ACCOUNTS'] },
    ],
  },
  {
    label: 'Meetings',
    items: [
      { label: 'Meetings & MoM', href: '/meetings', icon: CalendarDays },
      { label: 'Meeting Summary', href: '/meeting-summary', icon: CalendarCheck, roles: ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD'] },
      { label: 'Feedbacks', href: '/feedbacks', icon: MessageSquareText, roles: ['ADMIN', 'SUPER_ADMIN_2', 'SAM_HEAD'] },
    ],
  },
  {
    label: 'Leads',
    items: [
      // Either destination being on is enough — the page itself offers
      // whichever of ILL / MSP is enabled.
      {
        label: 'Create Lead',
        href: '/create-lead',
        icon: UserPlus,
        enabled: env.leadDispatchEnabled || env.mspLeadsEnabled,
      },
      {
        label: 'My Leads',
        href: '/my-leads',
        icon: ListChecks,
        enabled: env.leadDispatchEnabled || env.mspLeadsEnabled,
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Users', href: '/users', icon: UserCog, roles: ['ADMIN', 'SAM_HEAD'] },
      { label: 'Audit Log', href: '/audit', icon: History, roles: ['ADMIN', 'SAM_HEAD'] },
      { label: 'Integration Log', href: '/integrations', icon: Plug, roles: ['ADMIN'] },
    ],
  },
];

/** Drop items this role or feature flag hides, then drop groups left empty. */
function visibleGroups(role: AuthUser['role']): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.enabled !== false && (!item.roles || item.roles.includes(role)),
    ),
  })).filter((group) => group.items.length > 0);
}

/**
 * The nav list, with a fade at whichever edge has more content past it.
 *
 * Nineteen items don't fit a laptop viewport even grouped, so this region
 * scrolls while the logo and account actions stay pinned. Without the fade
 * a list cut off mid-group reads as "those pages are gone" rather than
 * "scroll down" — the gradient is the only cue that there is more.
 */
function ScrollableNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setEdges({
        top: el.scrollTop > 4,
        bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    // Guarded: jsdom (tests) has no ResizeObserver, and a missing fade is
    // never worth throwing inside the app shell.
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="relative flex-1 min-h-0">
      {edges.top && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-4 z-10 bg-gradient-to-b from-white to-transparent"
        />
      )}
      <nav ref={ref} className="h-full overflow-y-auto py-1">
        {children}
      </nav>
      {edges.bottom && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-5 z-10 bg-gradient-to-t from-white to-transparent"
        />
      )}
    </div>
  );
}

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

  // Sidebar badge counts — polled (same approach as the notification bell):
  // interval + on navigation + when the tab regains focus. Cheap, robust, and
  // consistent with the rest of the app; no websockets needed.
  const [counts, setCounts] = useState<SidebarCounts>(EMPTY_COUNTS);
  const refreshCounts = useCallback(async () => {
    try {
      setCounts(await getSidebarCounts());
    } catch {
      // Silent — a badge hiccup must never break the sidebar.
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, pathname]);

  useEffect(() => {
    const t = setInterval(refreshCounts, COUNTS_POLL_MS);
    const onFocus = () => refreshCounts();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshCounts();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshCounts]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    startTransition(() => {
      void setSidebarCollapsed(next);
    });
  }

  const navGroups = visibleGroups(user.role);

  /**
   * Which groups are open.
   *
   * The baseline is "only the group you are in" — that is what keeps the
   * rail short. A click on a heading overrides that for this visit, and the
   * overrides are dropped on navigation, so the rail re-settles to the one
   * relevant group instead of accumulating everything the user ever opened.
   * Clicking an item inside a group you opened is safe: once you land there
   * it IS the active group, so it stays open on its own.
   */
  const activeGroupLabel = navGroups.find((g) =>
    g.items.some((item) => isActive(pathname, item.href)),
  )?.label;
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGroupOverrides({});
  }, [pathname]);

  const isGroupOpen = (label: string) => groupOverrides[label] ?? label === activeGroupLabel;
  const toggleGroup = (label: string) =>
    setGroupOverrides((prev) => ({ ...prev, [label]: !(prev[label] ?? label === activeGroupLabel) }));

  /** Pending work inside a group, so shutting it can never hide a queue. */
  const groupCount = (group: NavGroup) =>
    group.items.reduce((sum, item) => {
      const field = COUNT_FIELD_BY_HREF[item.href];
      return sum + (field ? counts[field] : 0);
    }, 0);

  async function onLogout() {
    try {
      await logout();
    } catch {
      // ignore — bounce to login regardless
    }
    router.push('/login');
    router.refresh();
  }

  // Everything the rail needs. Bundled so the two call sites below can't
  // drift apart — a prop passed to one rail and not the other is exactly
  // how the drawer ends up behaving differently from the desktop strip.
  const railProps = {
    pathname,
    collapsed,
    navGroups,
    counts,
    isGroupOpen,
    toggleGroup,
    groupCount,
    onToggleCollapsed: toggleCollapsed,
    onCloseMobile: () => setMobileOpen(false),
    onLogout,
  };

  return (
    <>
      {/* Desktop rail — sticky strip on the left, hidden under md */}
      <div className="hidden md:block sticky top-0 h-screen z-20">
        <Rail mode={collapsed ? 'collapsed' : 'expanded'} {...railProps} />
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
            <Rail mode="drawer" {...railProps} />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * One rail, rendered up to three ways (see Sidebar's doc comment).
 *
 * Module-level on purpose. It used to be declared inside Sidebar, which
 * made it a NEW component type on every render — so React tore the whole
 * sidebar down and rebuilt it each time any state changed, including the
 * 45-second badge poll. That silently reset the nav's scroll position and
 * made the group accordion impossible to drive.
 */
function Rail({
  mode,
  pathname,
  collapsed,
  navGroups,
  counts,
  isGroupOpen,
  toggleGroup,
  groupCount,
  onToggleCollapsed,
  onCloseMobile,
  onLogout,
}: {
  mode: 'expanded' | 'collapsed' | 'drawer';
  pathname: string;
  collapsed: boolean;
  navGroups: NavGroup[];
  counts: SidebarCounts;
  isGroupOpen: (label: string) => boolean;
  toggleGroup: (label: string) => void;
  groupCount: (group: NavGroup) => number;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const showLabels = mode !== 'collapsed';
  const widthClass =
    mode === 'collapsed' ? 'w-14' : mode === 'drawer' ? 'w-64' : 'w-56';
  const itemPadX = mode === 'collapsed' ? 'px-0 justify-center' : 'px-4';
  return (
    <aside
      className={`${widthClass} shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden`}
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
            onClick={onCloseMobile}
            className="w-7 h-7 grid place-items-center rounded text-gray-500 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            onClick={onToggleCollapsed}
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

      {/* Only this region scrolls. The logo above and the account
          actions below stay put however long the list gets. */}
      <ScrollableNav>
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.label ?? `group-${groupIndex}`}
            data-nav-group={group.label ?? 'main'}
            className={groupIndex > 0 ? 'mt-1' : ''}
          >
            {group.label &&
              (showLabels ? (
                (() => {
                  const open = isGroupOpen(group.label);
                  const pending = groupCount(group);
                  return (
                    <button
                      type="button"
                      data-nav-group-toggle
                      aria-expanded={open}
                      // A shut group still announces its queue, so a
                      // screen-reader user is told about pending work
                      // without having to open every group to find it.
                      aria-label={
                        !open && pending > 0
                          ? `${group.label} (${pending} pending)`
                          : group.label
                      }
                      onClick={() => toggleGroup(group.label!)}
                      className={`w-full flex items-center gap-1.5 ${itemPadX} pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                        open ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                          open ? '' : '-rotate-90'
                        }`}
                      />
                      <span data-nav-group-label>{group.label}</span>
                      {/* Only while shut — once open each item shows its own. */}
                      {!open && pending > 0 && (
                        <span
                          aria-hidden="true"
                          className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold leading-none flex items-center justify-center"
                        >
                          {pending > 99 ? '99+' : pending}
                        </span>
                      )}
                    </button>
                  );
                })()
              ) : (
                // Collapsed rail has no room for a heading, so the grouping
                // survives as a hairline between icon clusters.
                <div className="mx-3 my-2 border-t border-gray-100" aria-hidden="true" />
              ))}
            {/* Collapsing applies to the labelled, expanded rail only. The
                icon-only rail has no headings to click, so it stays flat. */}
            <ul hidden={Boolean(group.label) && showLabels && !isGroupOpen(group.label!)}>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const countField = COUNT_FIELD_BY_HREF[item.href];
                const count = countField ? counts[countField] : 0;
                const badgeLabel = count > 99 ? '99+' : String(count);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={mode === 'collapsed' ? item.label : undefined}
                      aria-label={count > 0 ? `${item.label} (${count} pending)` : item.label}
                      className={`flex items-center gap-3 ${itemPadX} py-1.5 text-sm border-l-4 transition-colors ${
                        active
                          ? 'bg-brand-50 text-brand-700 font-semibold border-brand-600'
                          : 'text-gray-700 hover:bg-gray-50 border-transparent'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="relative shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        {/* Collapsed rail: a compact badge over the icon. */}
                        {count > 0 && !showLabels && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold leading-none flex items-center justify-center ring-2 ring-white"
                          >
                            {badgeLabel}
                          </span>
                        )}
                      </span>
                      {showLabels && <span className="truncate">{item.label}</span>}
                      {/* Expanded rail: a pill pushed to the right edge. */}
                      {count > 0 && showLabels && (
                        <span
                          aria-hidden="true"
                          className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none flex items-center justify-center ${
                            active ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </ScrollableNav>

      <div className="border-t border-gray-100 py-2">
        <Link
          href="/change-password"
          title={mode === 'collapsed' ? 'Change password' : undefined}
          aria-label="Change password"
          className={`flex items-center gap-3 ${itemPadX} py-2 text-sm border-l-4 transition-colors ${
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
          className={`w-full flex items-center gap-3 ${itemPadX} py-2 text-sm text-gray-700 hover:bg-gray-50 border-l-4 border-transparent transition-colors`}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
