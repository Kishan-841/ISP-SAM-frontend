import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { TopBar } from '../components/top-bar';
import { getMe } from '../services/auth';

export const metadata: Metadata = {
  title: 'SAM — Gazon',
  description: 'Service Assurance Manager platform',
};

const PUBLIC_PATHS = new Set(['/login']);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const path = h.get('x-pathname') ?? '';
  const isPublic = PUBLIC_PATHS.has(path);

  let user = null;
  if (!isPublic) {
    try {
      const cookieHeader = h.get('cookie') ?? '';
      const me = await getMe({ cookieHeader });
      user = me.user;
    } catch {
      redirect('/login');
    }
  }

  return (
    <html lang="en">
      <body>
        {user ? (
          <div className="min-h-screen flex bg-gray-50">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar user={user} />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
