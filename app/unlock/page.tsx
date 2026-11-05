'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LockForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ passcode: value }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        const next = params.get('next');
        router.replace(next && next.startsWith('/') ? next : '/');
        router.refresh();
        return;
      }
      setError(data.error || 'Wrong passcode.');
      setValue('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      input.current?.focus();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-6">
      <div className={`w-full max-w-sm ${shake ? 'animate-[shake_0.4s]' : ''}`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-cyan-300">
            <rect x="4" y="10" width="16" height="10" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h1 className="mt-5 text-center text-[19px] font-semibold tracking-tight">Private tracker</h1>
        <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-slate-500">
          This is one person&apos;s study plan. Enter the passcode to open it.
        </p>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="passcode" className="sr-only">
            Passcode
          </label>
          <input
            id="passcode"
            ref={input}
            type="password"
            inputMode="text"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Passcode"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-[15px] tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
          />
          <button
            type="submit"
            disabled={busy || !value}
            className="mt-3 w-full rounded-xl bg-cyan-400 py-3 text-[14px] font-semibold text-[#04121a] transition active:scale-[0.99] disabled:opacity-40"
          >
            {busy ? 'Checking…' : 'Unlock'}
          </button>
          <p className="mt-3 min-h-[16px] text-center text-[11.5px] text-red-400" role="alert">
            {error}
          </p>
        </form>

        <p className="mt-6 text-center text-[10.5px] leading-relaxed text-slate-600">
          Unlocks last 14 days on this device. Progress is stored locally and never leaves the
          browser unless you connect Supabase.
        </p>
      </div>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense
      fallback={<main className="flex min-h-[100svh] items-center justify-center text-slate-500">…</main>}
    >
      <LockForm />
    </Suspense>
  );
}
