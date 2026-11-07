import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * The only door to the database. Reached only by passcode-holder sessions
 * (middleware), using the service role key that lives in server env.
 */
function client() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET() {
  const sb = client();
  if (!sb) {
    return NextResponse.json({ enabled: false, ticks: {}, hours: {}, serverTime: Date.now() });
  }

  const [ticks, hours] = await Promise.all([
    sb.from('ticks').select('task_id, on_state, at'),
    sb.from('hours').select('day, hours, at'),
  ]);

  if (ticks.error || hours.error) {
    return NextResponse.json(
      { enabled: true, error: ticks.error?.message || hours.error?.message, ticks: {}, hours: {} },
      { status: 200 }
    );
  }

  const t: Record<string, { on: boolean; at: number }> = {};
  for (const row of ticks.data ?? []) {
    t[row.task_id as string] = { on: Boolean(row.on_state), at: Number(row.at) };
  }
  const h: Record<string, { h: number; at: number }> = {};
  for (const row of hours.data ?? []) {
    h[row.day as string] = { h: Number(row.hours), at: Number(row.at) };
  }

  return NextResponse.json({ enabled: true, ticks: t, hours: h, serverTime: Date.now() });
}

export async function POST(req: NextRequest) {
  const sb = client();
  if (!sb) return NextResponse.json({ enabled: false, ok: false, serverTime: Date.now() });

  let body: { ticks?: unknown; hours?: unknown };
  try {
    body = (await req.json()) as { ticks?: unknown; hours?: unknown };
  } catch {
    return NextResponse.json({ enabled: true, ok: false, error: 'bad json' }, { status: 400 });
  }

  const ticks = (body.ticks ?? {}) as Record<string, { on: boolean; at: number }>;
  const hours = (body.hours ?? {}) as Record<string, { h: number; at: number }>;

  // Keep the payload honest: only shapes we expect, and a sane size cap.
  const cleanTicks: Record<string, { on: boolean; at: number }> = {};
  for (const [id, v] of Object.entries(ticks).slice(0, 2000)) {
    if (v && typeof v.at === 'number') cleanTicks[String(id).slice(0, 40)] = { on: Boolean(v.on), at: Math.round(v.at) };
  }
  const cleanHours: Record<string, { h: number; at: number }> = {};
  for (const [day, v] of Object.entries(hours).slice(0, 800)) {
    if (v && typeof v.at === 'number' && Number.isFinite(v.h)) {
      cleanHours[String(day).slice(0, 10)] = { h: Math.max(0, Math.min(24, v.h)), at: Math.round(v.at) };
    }
  }

  const jobs: Promise<unknown>[] = [];
  if (Object.keys(cleanTicks).length) jobs.push(Promise.resolve(sb.rpc('push_ticks', { p: cleanTicks })));
  if (Object.keys(cleanHours).length) jobs.push(Promise.resolve(sb.rpc('push_hours', { p: cleanHours })));
  await Promise.all(jobs);

  return NextResponse.json({
    enabled: true,
    ok: true,
    pushedTicks: Object.keys(cleanTicks).length,
    pushedHours: Object.keys(cleanHours).length,
    serverTime: Date.now(),
  });
}
