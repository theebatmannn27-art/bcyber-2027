'use client';

import { useEffect, useState } from 'react';
import { TARGET_DATE, splitCountdown } from '@/lib/plan';

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl border border-white/[0.07] bg-black/30 px-1 py-2 sm:py-3">
      <span
        suppressHydrationWarning
        className="font-mono text-[19px] font-semibold tabular-nums leading-none text-white sm:text-2xl"
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

export default function Countdown() {
  // Seeded during render (not after mount) so the server sends real numbers
  // instead of a flash of 00 00 00 00 on a cold load over mobile data.
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const c = splitCountdown(TARGET_DATE, now);

  return (
    <div>
      <div className="flex gap-1.5 sm:gap-2" suppressHydrationWarning>
        <Cell value={c.days} label="days" />
        <Cell value={c.hours} label="hrs" />
        <Cell value={c.minutes} label="min" />
        <Cell value={c.seconds} label="sec" />
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        to the {TARGET_DATE.getFullYear()} entrance window ·{' '}
        {TARGET_DATE.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}
