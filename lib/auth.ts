/**
 * Session helpers shared by the Edge middleware and the Node route handlers.
 * Everything here uses Web Crypto so the same code runs in both runtimes.
 */

export const COOKIE = 'bcyber_session';
export const SESSION_DAYS = 14;

const enc = new TextEncoder();

function secret(): string {
  return process.env.APP_SESSION_SECRET || process.env.APP_PASSCODE || '';
}

/** The gate is off unless a passcode is configured — the app still works standalone. */
export function gateEnabled(): boolean {
  return Boolean(process.env.APP_PASSCODE);
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmac(payload: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(payload)));
}

/** Length-independent comparison so response time never leaks the passcode. */
export function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Constant-time passcode check — both sides are hashed first. */
export async function checkPasscode(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSCODE || '';
  if (!expected || !input) return false;
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  return timingSafeEqual(a, b);
}

/** `<expiry>.<hmac>` — the cookie carries no passcode, only proof it was entered. */
export async function makeSession(days = SESSION_DAYS): Promise<string> {
  const exp = Date.now() + days * 86400000;
  const sig = await hmac(String(exp), secret());
  return `${exp}.${sig}`;
}

export async function verifySession(value?: string | null): Promise<boolean> {
  if (!value || !secret()) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig) return false;
  const expiry = Number(exp);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const good = await hmac(exp, secret());
  return timingSafeEqual(sig, good);
}
