'use client';

import { useState } from 'react';

/** Immediate re-lock — closes the session cookie and bounces to /unlock. */
export default function LockButton() {
  const [busy, setBusy] = useState(false);

  const lock = async () => {
    setBusy(true);
    try {
      await fetch('/api/lock', { method: 'POST' });
    } catch {}
    window.location.href = '/unlock';
  };

  return (
    <button
      onClick={lock}
      disabled={busy}
      aria-label="Lock the app"
      title="Lock"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition active:scale-95 disabled:opacity-40"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="10" width="16" height="10" rx="2.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </button>
  );
}
