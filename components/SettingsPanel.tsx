'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/lib/store';
import { reminderTextLocal, nextMilestoneLocal } from '@/lib/remind-local';
import { useStudyLog } from '@/lib/studylog';

const NOTIFY_KEY = 'bcyber.notify.v1';

interface NotifyCfg {
  enabled: boolean;
  hour: number;
  minute: number;
}

function readCfg(): NotifyCfg {
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    const fallback: NotifyCfg = { enabled: false, hour: 19, minute: 0 };
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<NotifyCfg>;
    return { ...fallback, ...parsed };
  } catch {
    return { enabled: false, hour: 19, minute: 0 };
  }
}

function writeCfg(c: NotifyCfg) {
  try {
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(c));
  } catch {}
}

export default function SettingsPanel() {
  const { done, resetAll, sync, cloudEnabled, streak } = useProgress();
  const study = useStudyLog();
  const [cfg, setCfg] = useState<NotifyCfg>({ enabled: false, hour: 19, minute: 0 });
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [swReady, setSwReady] = useState(false);
  const [tested, setTested] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCfg(readCfg());
    if (typeof Notification === 'undefined') {
      setPerm('unsupported');
    } else {
      setPerm(Notification.permission);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setSwReady(true))
        .catch(() => setSwReady(false));
    }
  }, []);

  const message = useMemo(() => reminderTextLocal(done), [done]);
  const milestone = useMemo(() => nextMilestoneLocal(done), [done]);

  const showNow = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      setPerm(res);
      if (res !== 'granted') return;
    }
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      reg.active?.postMessage({ type: 'notify', title: 'B.Cyber 2027', body: message });
    } else {
      new Notification('B.Cyber 2027', { body: message, icon: '/icon-192.svg' });
    }
    setTested(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }, [message]);

  // schedule the next occurrence of the chosen time, while the tab stays open
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!cfg.enabled) return;
    const now = new Date();
    const next = new Date();
    next.setHours(cfg.hour, cfg.minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = Math.min(next.getTime() - now.getTime(), 2 ** 31 - 1);
    timer.current = setTimeout(() => {
      showNow();
      // re-arm for the following day
      const again = setInterval(showNow, 86400000);
      return () => clearInterval(again);
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cfg, showNow]);

  const toggle = async (v: boolean) => {
    if (v) {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        const res = await Notification.requestPermission();
        setPerm(res);
        if (res !== 'granted') return;
      }
    }
    const next = { ...cfg, enabled: v };
    setCfg(next);
    writeCfg(next);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-5">
      <Link href="/" className="text-[13px] text-slate-400">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Settings</h1>

      {/* notifications */}
      <section className="card mt-4">
        <p className="label">Daily reminder</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
          A nudge with days left, hours done and the next gate. Phone notifications need permission;
          in-app scheduling only fires while this tab is open.
        </p>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5">
          <span className="text-[13px]">Enable on this device</span>
          <button
            onClick={() => toggle(!cfg.enabled)}
            role="switch"
            aria-checked={cfg.enabled}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              cfg.enabled ? 'bg-cyan-400' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#05070d] transition-transform ${
                cfg.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5">
          <span className="text-[13px]">Remind me at</span>
          <input
            type="time"
            value={`${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              const next = { ...cfg, hour: h ?? 19, minute: m ?? 0 };
              setCfg(next);
              writeCfg(next);
            }}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 font-mono text-[13px]"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={showNow} className="btn text-[12px]">
            Send a test notification
          </button>
          <span className="text-[11px] text-slate-500">
            permission: {perm === 'unsupported' ? 'unsupported in this browser' : perm}
            {tested && ` · last test ${tested}`}
          </span>
        </div>

        {!swReady && (
          <p className="mt-2 text-[11px] text-amber-300/80">
            Service worker not registered — the tab must be served over HTTPS (it is, on Vercel).
          </p>
        )}

        <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Today&apos;s message</p>
          <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-slate-300">
            {message}
          </pre>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          <strong className="text-slate-300">For a reminder that arrives when the app is closed</strong>,
          set <code className="text-cyan-300">TELEGRAM_BOT_TOKEN</code> and{' '}
          <code className="text-cyan-300">TELEGRAM_CHAT_ID</code> in Vercel. The cron job at{' '}
          <code className="text-slate-300">/api/remind</code> then messages you every evening at
          19:00 IST — no app, no tab, no permission needed.
        </p>
      </section>

      {/* study log */}
      <section className="card mt-3">
        <p className="label">Study log</p>
        <p className="mt-1.5 text-[12px] text-slate-400">
          Log hours to see whether 30 a week is actually happening. This is the number that decides
          everything.
        </p>
        <div className="mt-3 flex items-end gap-1.5">
          {study.weekTotal().map((d) => {
            const max = Math.max(4, ...study.weekTotal().map((x) => x.hours));
            const h = Math.max(3, (d.hours / max) * 56);
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px] text-slate-500">{d.hours || ''}</span>
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-cyan-500/40 to-cyan-300"
                  style={{ height: h }}
                />
                <span className="text-[9px] text-slate-600">
                  {new Date(`${d.key}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'narrow' })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-slate-400">
            This week: <span className="font-mono text-slate-200">{study.weekTotal().reduce((a, b) => a + b.hours, 0).toFixed(1)}</span> / 30 h
          </span>
          <button className="btn text-[12px]" onClick={() => study.set(0)}>
            Clear today
          </button>
        </div>
      </section>

      {/* data */}
      <section className="card mt-3">
        <p className="label">Data</p>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-slate-400">
          <li className="flex justify-between gap-3">
            <span>Sync</span>
            <span className="text-slate-200">
              {cloudEnabled
                ? sync === 'error'
                  ? 'Supabase configured, last write failed'
                  : `Supabase · ${sync}`
                : 'local only'}
            </span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Streak</span>
            <span className="font-mono text-slate-200">{streak} days</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Next gate</span>
            <span className="max-w-[60%] text-right text-slate-200">
              {milestone ? milestone.title : 'all milestones cleared'}
            </span>
          </li>
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn text-[12px]" href="/api/ics">
            Export calendar (.ics)
          </a>
          <a
            className="btn text-[12px]"
            href="/api/remind"
            target="_blank"
            rel="noreferrer"
          >
            Preview today&apos;s reminder
          </a>
          <button
            className="btn border-red-400/30 text-[12px] text-red-300"
            onClick={() => {
              if (confirm('Erase all ticks on this device? This cannot be undone.')) resetAll();
            }}
          >
            Reset progress
          </button>
        </div>
      </section>

      <p className="mt-4 px-1 text-[10.5px] leading-relaxed text-slate-600">
        Progress is written to localStorage first, then to Supabase if keys are present. Nothing is
        lost when the network drops.
      </p>
    </main>
  );
}
