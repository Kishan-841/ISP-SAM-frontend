'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '../services/auth';
import { logout } from '../services/auth';

export function Header({ user }: { user: AuthUser }) {
  const router = useRouter();
  const canSeeUsers = user.role === 'ADMIN' || user.role === 'SAM_HEAD';

  async function onLogout() {
    try {
      await logout();
    } catch {
      // ignore — we still want to bounce to login
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/accounts" className="text-brand-600 font-bold tracking-tight text-lg">
            GAZON SAM
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/accounts" className="text-gray-700 hover:text-brand-600">Accounts</Link>
            {canSeeUsers && (
              <Link href="/users" className="text-gray-700 hover:text-brand-600">Users</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.name}</span>
          <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">{user.role}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-700 hover:text-brand-600 font-medium"
            type="button"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
