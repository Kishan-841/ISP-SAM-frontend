import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import './globals.css';
import { Header } from '../components/header';
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
        {user && <Header user={user} />}
        {children}
      </body>
    </html>
  );
}
