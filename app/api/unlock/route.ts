import { NextRequest, NextResponse } from 'next/server';
import { checkPasscode, makeSession, COOKIE, SESSION_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Per-instance throttle. Not bulletproof on serverless, but it turns a fast
// brute force into a very slow one, and the passcode is long enough that
// slow is enough.
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

function ip(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const key = ip(req);
  const now = Date.now();
  const rec = attempts.get(key);

  if (rec && rec.until > now && rec.n >= MAX) {
    const mins = Math.ceil((rec.until - now) / 60000);
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${mins} min.` },
      { status: 429 }
    );
  }

  let passcode = '';
  try {
    const body = (await req.json()) as { passcode?: unknown };
    passcode = typeof body.passcode === 'string' ? body.passcode.slice(0, 256) : '';
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }

  const ok = await checkPasscode(passcode);

  if (!ok) {
    const next = rec && rec.until > now ? { n: rec.n + 1, until: rec.until } : { n: 1, until: now + WINDOW };
    attempts.set(key, next);
    // uniform delay: removes the timing signal and slows scripted guessing
    await new Promise((r) => setTimeout(r, 400));
    const left = Math.max(0, MAX - next.n);
    return NextResponse.json(
      { ok: false, error: left > 0 ? `Wrong passcode. ${left} tries left.` : 'Locked out for 10 minutes.' },
      { status: 401 }
    );
  }

  attempts.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await makeSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
}
