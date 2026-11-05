'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabase, deviceId } from './supabase';

const LOCAL_KEY = 'bcyber.progress.v1';

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface Store {
  done: Record<string, boolean>;
  toggle: (id: string) => void;
  setMany: (ids: string[], value: boolean) => void;
  resetAll: () => void;
  ready: boolean;
  sync: SyncState;
  streak: number;
  cloudEnabled: boolean;
}

const Ctx = createContext<Store | null>(null);

interface Snapshot {
  done: Record<string, boolean>;
  lastTick?: string;
  streak?: number;
}

function readLocal(): Snapshot {
  if (typeof window === 'undefined') return { done: {} };
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { done: {} };
    const parsed = JSON.parse(raw) as Snapshot;
    return { done: parsed.done ?? {}, lastTick: parsed.lastTick, streak: parsed.streak ?? 0 };
  } catch {
    return { done: {} };
  }
}

function writeLocal(s: Snapshot) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked — the app still works in memory */
  }
}

/** Streak = consecutive calendar days with at least one new tick. */
function bumpStreak(prev: Snapshot, tickedNow: boolean): Snapshot {
  if (!tickedNow) return prev;
  const todayKey = new Date().toISOString().slice(0, 10);
  if (prev.lastTick === todayKey) return prev;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = prev.lastTick === yesterday ? (prev.streak ?? 0) + 1 : 1;
  return { ...prev, lastTick: todayKey, streak };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>({ done: {} });
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>('idle');
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => getSupabase(), []);

  // hydrate from local storage, then try the cloud if configured
  useEffect(() => {
    const local = readLocal();
    setSnap(local);
    setReady(true);
    if (!supabase) {
      setSync('offline');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('progress')
          .select('done, updated_at')
          .eq('device_id', deviceId())
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setSync('error');
          return;
        }
        if (data?.done) {
          const remote = data.done as Record<string, boolean>;
          // union: never lose a tick made offline on this device
          setSnap((cur) => {
            const merged = { ...remote, ...cur.done };
            const next = { ...cur, done: merged };
            writeLocal(next);
            return next;
          });
        }
        setSync('saved');
      } catch {
        if (!cancelled) setSync('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const persist = useCallback(
    (next: Snapshot) => {
      writeLocal(next);
      if (!supabase) return;
      if (pending.current) clearTimeout(pending.current);
      setSync('saving');
      pending.current = setTimeout(async () => {
        try {
          const { error } = await supabase.from('progress').upsert(
            {
              device_id: deviceId(),
              done: next.done,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'device_id' }
          );
          setSync(error ? 'error' : 'saved');
        } catch {
          setSync('error');
        }
      }, 900);
    },
    [supabase]
  );

  const toggle = useCallback(
    (id: string) => {
      setSnap((cur) => {
        const nowDone = !cur.done[id];
        const base: Snapshot = {
          ...cur,
          done: { ...cur.done, [id]: nowDone },
        };
        if (!nowDone) delete base.done[id];
        const next = nowDone ? bumpStreak(base, true) : base;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setMany = useCallback(
    (ids: string[], value: boolean) => {
      setSnap((cur) => {
        const doneNext = { ...cur.done };
        for (const id of ids) {
          if (value) doneNext[id] = true;
          else delete doneNext[id];
        }
        const base: Snapshot = { ...cur, done: doneNext };
        const next = value ? bumpStreak(base, true) : base;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetAll = useCallback(() => {
    const next: Snapshot = { done: {}, streak: 0 };
    setSnap(next);
    persist(next);
  }, [persist]);

  const value = useMemo<Store>(
    () => ({
      done: snap.done,
      toggle,
      setMany,
      resetAll,
      ready,
      sync,
      streak: snap.streak ?? 0,
      cloudEnabled: Boolean(supabase),
    }),
    [snap, toggle, setMany, resetAll, ready, sync, supabase]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
