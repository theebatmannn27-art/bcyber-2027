import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase-server';
import { reminderText } from '@/lib/plan-shared';

export const dynamic = 'force-dynamic';

/**
 * Daily reminder.
 *
 * Vercel Cron hits this at 13:30 UTC (19:00 IST) with
 * Authorization: Bearer $CRON_SECRET, or ?secret=$CRON_SECRET when testing by hand.
 *
 * Sends a Telegram message if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set.
 * Falls back to returning the text as JSON so the endpoint is still useful
 * without any credentials configured.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const qs = req.nextUrl.searchParams.get('secret');

  const authorised = !secret || auth === `Bearer ${secret}` || qs === secret;
  if (!authorised) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  // Pull the most recently updated progress row so the nudge is truthful.
  let done: Record<string, boolean> = {};
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from('progress')
      .select('done')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.done) done = data.done as Record<string, boolean>;
  }

  const text = reminderText(done);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat) {
    return NextResponse.json({ ok: true, sent: false, reason: 'telegram not configured', text });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
    const payload = await res.json();
    return NextResponse.json({ ok: res.ok, sent: res.ok, telegram: payload?.ok ?? false, text });
  } catch (err) {
    return NextResponse.json(
      { ok: false, sent: false, error: String(err), text },
      { status: 502 }
    );
  }
}
