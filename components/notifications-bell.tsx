'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BellRing } from 'lucide-react';
import { getUnreadCount } from '../services/notifications';

const POLL_INTERVAL_MS = 60_000;

/**
 * Topbar bell — link-only. Click navigates to /notifications; never opens
 * a popover. The badge polls the unread-count endpoint every minute and
 * also refreshes whenever the route changes (so marking-all-read on the
 * notifications page reflects immediately when you come back).
 */
export function NotificationsBell() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname() ?? '';

  const refresh = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnread(data.unread);
    } catch {
      // Silent — bell shouldn't blow up the topbar on a hiccup.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const isActive = pathname === '/notifications' || pathname.startsWith('/notifications/');

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      className={`relative w-9 h-9 grid place-items-center rounded-md transition-colors ${
        isActive ? 'bg-orange-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {unread > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
