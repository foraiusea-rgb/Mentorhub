'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

const HIDE_NAV_ROUTES = ['/auth'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {!hideNav && <Navbar />}
      <main>{children}</main>
    </>
  );
}
