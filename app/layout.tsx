import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProgressProvider } from '@/lib/store';
import NotificationOnboarding from '@/components/NotificationOnboarding';

export const metadata: Metadata = {
  title: 'B.Cyber 2027 — Syllabus Tracker',
  description:
    'Countdown, syllabus checklist, streak and daily study targets for the IIT Kanpur B.Cyber 2027 entrance.',
  manifest: '/manifest.webmanifest',
  applicationName: 'B.Cyber 2027',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'B.Cyber' },
  icons: { icon: '/icon-192.svg', apple: '/icon-192.svg' },
  // keep this out of search engines entirely
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#05070d',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          {children}
          <NotificationOnboarding />
        </ProgressProvider>
      </body>
    </html>
  );
}
