/**
 * Cross-device sync primitives.
 *
 * Every tick carries the millisecond timestamp it was changed at. Merging is
 * then trivial and conflict-free: for each task the newer timestamp wins, so a
 * tick on your phone and an un-tick on your laptop resolve deterministically
 * instead of one silently winning.
 *
 * The browser never holds a Supabase key. It only talks to /api/sync, which is
 * behind the passcode gate and uses the service role key server-side.
 */

export interface Tick {
  on: boolean;
  at: number;
}
export interface HourEntry {
  h: number;
  at: number;
}

export type TickMap = Record<string, Tick>;
export type HourMap = Record<string, HourEntry>;

const TICKS_KEY = 'bcyber.ticks.v2';
const HOURS_KEY = 'bcyber.hours.v2';
const LEGACY_PROGRESS = 'bcyber.progress.v1';
const LEGACY_HOURS = 'bcyber.hours.v1';

export function readTicks(): TickMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TICKS_KEY);
    if (raw) return JSON.parse(raw) as TickMap;
    // one-time migration from the old boolean map
    const legacy = localStorage.getItem(LEGACY_PROGRESS);
    if (!legacy) return {};
    const parsed = JSON.parse(legacy) as { done?: Record<string, boolean> };
    const at = Date.now() - 86400000;
    const out: TickMap = {};
    for (const [id, on] of Object.entries(parsed.done ?? {})) {
      if (on) out[id] = { on: true, at };
    }
    localStorage.setItem(TICKS_KEY, JSON.stringify(out));
    return out;
  } catch {
    return {};
  }
}

export function readHours(): HourMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(HOURS_KEY);
    if (raw) return JSON.parse(raw) as HourMap;
    const legacy = localStorage.getItem(LEGACY_HOURS);
    if (!legacy) return {};
    const parsed = JSON.parse(legacy) as Record<string, number>;
    const at = Date.now() - 86400000;
    const out: HourMap = {};
    for (const [day, h] of Object.entries(parsed)) {
      if (Number.isFinite(h) && h > 0) out[day] = { h, at };
    }
    localStorage.setItem(HOURS_KEY, JSON.stringify(out));
    return out;
  } catch {
    return {};
  }
}

export function writeTicks(t: TickMap) {
  try {
    localStorage.setItem(TICKS_KEY, JSON.stringify(t));
  } catch {}
}

export function writeHours(h: HourMap) {
  try {
    localStorage.setItem(HOURS_KEY, JSON.stringify(h));
  } catch {}
}

/** Newer timestamp wins, per key. Returns whether anything actually changed. */
export function mergeTicks(local: TickMap, remote: TickMap): { merged: TickMap; changed: boolean } {
  const merged: TickMap = { ...local };
  let changed = false;
  for (const [id, r] of Object.entries(remote)) {
    const l = merged[id];
    if (!l || r.at > l.at) {
      merged[id] = r;
      changed = true;
    }
  }
  return { merged, changed };
}

export function mergeHours(local: HourMap, remote: HourMap): { merged: HourMap; changed: boolean } {
  const merged: HourMap = { ...local };
  let changed = false;
  for (const [day, r] of Object.entries(remote)) {
    const l = merged[day];
    if (!l || r.at > l.at) {
      merged[day] = r;
      changed = true;
    }
  }
  return { merged, changed };
}

export interface RemoteState {
  enabled: boolean;
  ticks: TickMap;
  hours: HourMap;
  serverTime: number;
}

export async function pullRemote(): Promise<RemoteState | null> {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      enabled?: boolean;
      ticks?: Record<string, { on: boolean; at: number }>;
      hours?: Record<string, { h: number; at: number }>;
      serverTime?: number;
    };
    const ticks: TickMap = {};
    for (const [id, v] of Object.entries(data.ticks ?? {})) {
      ticks[id] = { on: Boolean(v.on), at: Number(v.at) || 0 };
    }
    const hours: HourMap = {};
    for (const [d, v] of Object.entries(data.hours ?? {})) {
      hours[d] = { h: Number(v.h) || 0, at: Number(v.at) || 0 };
    }
    return { enabled: Boolean(data.enabled), ticks, hours, serverTime: data.serverTime ?? Date.now() };
  } catch {
    return null;
  }
}

export async function pushRemote(ticks: TickMap, hours: HourMap): Promise<RemoteState | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ticks, hours }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { enabled?: boolean; serverTime?: number };
    return { enabled: Boolean(data.enabled), ticks: {}, hours: {}, serverTime: data.serverTime ?? Date.now() };
  } catch {
    return null;
  }
}

/** Streak derived from tick timestamps, so it is identical on every device. */
export function streakFromTicks(ticks: TickMap): number {
  const days = new Set<string>();
  for (const t of Object.values(ticks)) {
    if (!t.on || !t.at) continue;
    const d = new Date(t.at);
    const pad = (n: number) => String(n).padStart(2, '0');
    days.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  const key = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const pad = (n: number) => String(n).padStart(2, '0');

  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);
  if (!days.has(key(today))) {
    // yesterday still counts — you have not broken it until a full day passes
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key(cursor))) return 0;
  }
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
