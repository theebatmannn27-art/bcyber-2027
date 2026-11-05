import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verifySession, gateEnabled } from '@/lib/auth';

export const config = {
  matcher: [
    // everything except build assets, the icons/manifest the browser fetches before auth,
    // and the service worker (which must be reachable or install prompts fail)
    '/((?!_next/static|_next/image|favicon.ico|icon-192.svg|icon-512.svg|manifest.webmanifest|sw.js|robots.txt).*)',
  ],
};

const OPEN = ['/unlock', '/api/unlock', '/api/lock', '/api/remind'];

export async function middleware(req: NextRequest) {
  if (!gateEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (await verifySession(req.cookies.get(COOKIE)?.value)) {
    const res = NextResponse.next();
    res.headers.set('x-robots-tag', 'noindex, nofollow');
    return res;
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'locked' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/unlock';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
