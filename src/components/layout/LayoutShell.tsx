'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

const HIDE_NAV_ROUTES = ['/auth'];
// Routes that handle their own top spacing (hero sections with pt-[72px])
const SELF_PADDED_ROUTES = ['/'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.some((r) => pathname.startsWith(r));
  const selfPadded = SELF_PADDED_ROUTES.includes(pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      <main className={!hideNav && !selfPadded ? 'pt-[72px]' : ''}>
        {children}
      </main>
    </>
  );
}
