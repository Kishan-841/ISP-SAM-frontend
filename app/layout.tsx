import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { TopBar } from '../components/top-bar';
import { Toaster } from '../components/ui/sonner';
import { getMe } from '../services/auth';
import { readSidebarCollapsed } from '../lib/sidebar-state';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'SAM — Gazon',
  description: 'Service Assurance Manager platform',
};

// Tell mobile Safari/Chrome we render mobile-first — without this the
// browser zooms out to a "desktop" 980px viewport and our breakpoints
// never fire.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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

  const sidebarCollapsed = user ? await readSidebarCollapsed() : false;

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {user ? (
          <div className="min-h-screen flex bg-gray-50">
            <Sidebar user={user} initialCollapsed={sidebarCollapsed} />
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar user={user} />
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
