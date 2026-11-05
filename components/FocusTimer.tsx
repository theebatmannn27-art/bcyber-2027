'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudyLog } from '@/lib/studylog';

const KEY = 'bcyber.focus.v1';
const LENGTHS = [25, 45, 60] as const;

interface Persisted {
  endsAt: number;
  length: number;
}

/**
 * Pomodoro that logs its own hours. The point: you should never have to
 * remember to write down that you studied.
 */
export default function FocusTimer() {
  const study = useStudyLog();
  const [length, setLength] = useState<number>(25);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [paused, setPaused] = useState<{ left: number } | null>(null);
  const [left, setLeft] = useState(25 * 60000);
  const [doneMsg, setDoneMsg] = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  const finish = useCallback(() => {
    stop();
    setEndsAt(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
    study.add(length / 60);
    setLeft(length * 60000);
    setDoneMsg(`${length} min logged · ${(length / 60).toFixed(2)} h`);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Session done', {
        body: `${length} minutes logged. Tick something off before you stand up.`,
        icon: '/icon-192.svg',
      });
    }
    setTimeout(() => setDoneMsg(''), 6000);
  }, [length, study, stop]);

  // restore a session that was running before a reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Persisted;
      if (p.endsAt > Date.now()) {
        setLength(p.length);
        setEndsAt(p.endsAt);
      } else {
        localStorage.removeItem(KEY);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (endsAt == null) return;
    const loop = () => {
      const ms = Math.max(0, endsAt - Date.now());
      setLeft(ms);
      if (ms <= 0) finish();
    };
    loop();
    tick.current = setInterval(loop, 500);
    return stop;
  }, [endsAt, finish, stop]);

  const start = () => {
    const end = Date.now() + length * 60000;
    setEndsAt(end);
    setPaused(null);
    setDoneMsg('');
    try {
      localStorage.setItem(KEY, JSON.stringify({ endsAt: end, length } satisfies Persisted));
    } catch {}
  };

  const pause = () => {
    if (endsAt == null) return;
    setPaused({ left: Math.max(0, endsAt - Date.now()) });
    setEndsAt(null);
    stop();
    try {
      localStorage.removeItem(KEY);
    } catch {}
  };

  const resume = () => {
    if (!paused) return;
    const end = Date.now() + paused.left;
    setPaused(null);
    setEndsAt(end);
    try {
      localStorage.setItem(KEY, JSON.stringify({ endsAt: end, length } satisfies Persisted));
    } catch {}
  };

  const shown = paused ? paused.left : endsAt != null ? left : length * 60000;
  const mm = Math.floor(shown / 60000);
  const ss = Math.floor((shown % 60000) / 1000);
  const running = endsAt != null;
  const pct = 1 - shown / (length * 60000);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Focus session</p>
        {!running && !paused && (
          <div className="flex gap-1">
            {LENGTHS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLength(l);
                  setLeft(l * 60000);
                }}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  length === l ? 'bg-cyan-400/15 text-cyan-300' : 'text-slate-500'
                }`}
              >
                {l}m
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-[26px] font-semibold tabular-nums leading-none text-white">
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-[width] duration-500"
            style={{ width: `${Math.min(100, pct * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {running ? (
          <button onClick={pause} className="btn flex-1 text-[12px]">
            Pause
          </button>
        ) : paused ? (
          <button onClick={resume} className="btn flex-1 text-[12px]">
            Resume
          </button>
        ) : (
          <button
            onClick={start}
            className="flex-1 rounded-lg bg-cyan-400 py-2 text-[12px] font-semibold text-[#04121a] active:scale-[0.99]"
          >
            Start {length} min
          </button>
        )}
        {(running || paused) && (
          <button
            onClick={() => {
              stop();
              setEndsAt(null);
              setPaused(null);
              setLeft(length * 60000);
              try {
                localStorage.removeItem(KEY);
              } catch {}
            }}
            className="btn text-[12px]"
          >
            Stop
          </button>
        )}
      </div>

      <p className="mt-2 min-h-[14px] text-[11px] text-slate-500">
        {doneMsg || 'Completing a session logs the hours automatically.'}
      </p>
    </div>
  );
}
