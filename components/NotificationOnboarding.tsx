'use client';

import { useEffect, useState } from 'react';

const KEY = 'bcyber.onboard.v1';
const CFG = 'bcyber.notify.v1';

/**
 * First-run prompt. Asks for notification permission once, on open, instead of
 * hiding it three taps deep in Settings where it never gets found.
 */
export default function NotificationOnboarding() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === 'done';
    } catch {}
    if (!seen) setTimeout(() => setShow(true), 1200);
  }, []);

  const close = (remember: boolean) => {
    if (remember) {
      try {
        localStorage.setItem(KEY, 'done');
      } catch {}
    }
    setShow(false);
  };

  const allow = async () => {
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        const cfg = { enabled: true, hour: 19, minute: 0 };
        localStorage.setItem(CFG, JSON.stringify(cfg));
        setGranted(true);
        setTimeout(() => close(true), 2600);
        return;
      }
    } catch {}
    close(true);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0b1220]/95 p-4 shadow-2xl backdrop-blur">
        {granted ? (
          <div className="py-1">
            <p className="text-[14px] font-semibold text-cyan-300">Notifications on</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              You&apos;ll get a nudge at 19:00 while the app is open. Telegram covers the rest —
              it already messages you daily.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10.3 21a2 2 0 0 0 3.4 0" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">Get the daily nudge?</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                  19:00 every evening: days left, hours done, and the next gate. One tap to allow.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={allow}
                className="flex-1 rounded-xl bg-cyan-400 py-2.5 text-[13px] font-semibold text-[#04121a] active:scale-[0.99]"
              >
                Allow
              </button>
              <button
                onClick={() => close(true)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-slate-300"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
