import type { Metadata, Viewport } from 'next';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PWARegister } from '@/components/layout/PWARegister';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MentorHub — Find Your Perfect Mentor',
  description: 'Connect with expert mentors, schedule sessions, and accelerate your growth with AI-powered matching.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MentorHub',
  },
  openGraph: {
    title: 'MentorHub — Find Your Perfect Mentor',
    description: 'AI-powered mentorship platform. Find mentors, book sessions, grow your career.',
    type: 'website',
    siteName: 'MentorHub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MentorHub',
    description: 'AI-powered mentorship platform.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-[var(--cream)]">
        <LayoutShell>{children}</LayoutShell>
        <PWARegister />
      </body>
    </html>
  );
}
