import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProgressProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'B.Cyber 2027 — Syllabus Tracker',
  description:
    'Countdown, syllabus checklist, streak and daily study targets for the IIT Kanpur B.Cyber 2027 entrance.',
  manifest: '/manifest.webmanifest',
  applicationName: 'B.Cyber 2027',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'B.Cyber' },
  icons: { icon: '/icon-192.svg', apple: '/icon-192.svg' },
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
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
