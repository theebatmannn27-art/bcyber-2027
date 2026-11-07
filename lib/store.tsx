'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  type TickMap,
  type HourMap,
  readTicks,
  readHours,
  writeTicks,
  writeHours,
  mergeTicks,
  mergeHours,
  pullRemote,
  pushRemote,
  streakFromTicks,
} from './sync';

const POLL_MS = 12000;
const PUSH_DEBOUNCE_MS = 700;

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error' | 'local';

interface Store {
  done: Record<string, boolean>;
  toggle: (id: string) => void;
  setMany: (ids: string[], value: boolean) => void;
  resetAll: () => void;
  ready: boolean;
  sync: SyncState;
  lastSyncedAt: number | null;
  refresh: () => Promise<void>;
  cloudEnabled: boolean;
  streak: number;
  // study hours, kept next to the ticks so both sync the same way
  hours: Record<string, number>;
  today: number;
  addHours: (h: number, day?: string) => void;
  setHours: (h: number, day?: string) => void;
  weekTotal: () => { key: string; hours: number }[];
}

const Ctx = createContext<Store | null>(null);

export function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [ticks, setTicks] = useState<TickMap>({});
  const [hours, setHoursMap] = useState<HourMap>({});
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [cloudEnabled, setCloudEnabled] = useState(false);

  const dirtyTicks = useRef<TickMap>({});
  const dirtyHours = useRef<HourMap>({});
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const ticksRef = useRef<TickMap>({});
  const hoursRef = useRef<HourMap>({});

  ticksRef.current = ticks;
  hoursRef.current = hours;

  /* ---------- persistence ---------- */
  const commitTicks = useCallback((next: TickMap) => {
    setTicks(next);
    writeTicks(next);
  }, []);

  const commitHours = useCallback((next: HourMap) => {
    setHoursMap(next);
    writeHours(next);
  }, []);

  /* ---------- push (debounced) ---------- */
  const push = useCallback(async () => {
    if (busy.current) return;
    const t = dirtyTicks.current;
    const h = dirtyHours.current;
    if (!Object.keys(t).length && !Object.keys(h).length) return;

    dirtyTicks.current = {};
    dirtyHours.current = {};
    busy.current = true;
    setSync('saving');

    const res = await pushRemote(t, h);
    busy.current = false;

    if (!res) {
      // put them back so the next attempt does not lose work
      dirtyTicks.current = { ...t, ...dirtyTicks.current };
      dirtyHours.current = { ...h, ...dirtyHours.current };
      setSync(navigator.onLine ? 'error' : 'offline');
      return;
    }
    setCloudEnabled(res.enabled);
    setSync(res.enabled ? 'saved' : 'local');
    if (res.enabled) setLastSyncedAt(Date.now());
  }, []);

  const queuePush = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void push();
    }, PUSH_DEBOUNCE_MS);
  }, [push]);

  /* ---------- pull ---------- */
  const pull = useCallback(async () => {
    const remote = await pullRemote();
    if (!remote) {
      setSync(navigator.onLine ? 'error' : 'offline');
      return;
    }
    setCloudEnabled(remote.enabled);
    if (!remote.enabled) {
      setSync('local');
      return;
    }

    const t = mergeTicks(ticksRef.current, remote.ticks);
    if (t.changed) commitTicks(t.merged);

    const h = mergeHours(hoursRef.current, remote.hours);
    if (h.changed) commitHours(h.merged);

    setSync('saved');
    setLastSyncedAt(Date.now());
  }, [commitTicks, commitHours]);

  /* ---------- boot ---------- */
  useEffect(() => {
    setTicks(readTicks());
    setHoursMap(readHours());
    setReady(true);
    void pull();

    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) void pull();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull();
    };
    const onOnline = () => {
      void push();
      void pull();
    };
    const onOffline = () => setSync('offline');

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onVisible);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [pull, push]);

  /* ---------- mutations ---------- */
  const setTick = useCallback(
    (id: string, on: boolean) => {
      const at = Date.now();
      const next = { ...ticksRef.current, [id]: { on, at } };
      commitTicks(next);
      dirtyTicks.current = { ...dirtyTicks.current, [id]: { on, at } };
      queuePush();
    },
    [commitTicks, queuePush]
  );

  const toggle = useCallback(
    (id: string) => {
      const cur = ticksRef.current[id];
      setTick(id, !(cur?.on ?? false));
    },
    [setTick]
  );

  const setMany = useCallback(
    (ids: string[], value: boolean) => {
      const at = Date.now();
      const next = { ...ticksRef.current };
      for (const id of ids) next[id] = { on: value, at };
      commitTicks(next);
      const d = { ...dirtyTicks.current };
      for (const id of ids) d[id] = { on: value, at };
      dirtyTicks.current = d;
      queuePush();
    },
    [commitTicks, queuePush]
  );

  const resetAll = useCallback(() => {
    const at = Date.now();
    const next: TickMap = {};
    const d: TickMap = {};
    for (const id of Object.keys(ticksRef.current)) {
      next[id] = { on: false, at };
      d[id] = { on: false, at };
    }
    commitTicks(next);
    dirtyTicks.current = { ...dirtyTicks.current, ...d };
    queuePush();
  }, [commitTicks, queuePush]);

  const addHours = useCallback(
    (h: number, day = todayKey()) => {
      if (!Number.isFinite(h) || h <= 0) return;
      const cur = hoursRef.current[day]?.h ?? 0;
      const entry = { h: Math.round((cur + h) * 100) / 100, at: Date.now() };
      commitHours({ ...hoursRef.current, [day]: entry });
      dirtyHours.current = { ...dirtyHours.current, [day]: entry };
      queuePush();
    },
    [commitHours, queuePush]
  );

  const setHours = useCallback(
    (h: number, day = todayKey()) => {
      const next = { ...hoursRef.current };
      const entry = { h: Math.max(0, Math.round(h * 100) / 100), at: Date.now() };
      if (h > 0) next[day] = entry;
      else delete next[day];
      commitHours(next);
      dirtyHours.current = { ...dirtyHours.current, [day]: entry };
      queuePush();
    },
    [commitHours, queuePush]
  );

  const done = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const [id, t] of Object.entries(ticks)) if (t.on) out[id] = true;
    return out;
  }, [ticks]);

  const hoursFlat = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [day, e] of Object.entries(hours)) out[day] = e.h;
    return out;
  }, [hours]);

  const streak = useMemo(() => streakFromTicks(ticks), [ticks]);

  const weekTotal = useCallback(() => {
    const out: { key: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      out.push({ key: k, hours: hoursFlat[k] ?? 0 });
    }
    return out;
  }, [hoursFlat]);

  const refresh = useCallback(async () => {
    await pull();
  }, [pull]);

  const value = useMemo<Store>(
    () => ({
      done,
      toggle,
      setMany,
      resetAll,
      ready,
      sync,
      lastSyncedAt,
      refresh,
      cloudEnabled,
      streak,
      hours: hoursFlat,
      today: hoursFlat[todayKey()] ?? 0,
      addHours,
      setHours,
      weekTotal,
    }),
    [
      done,
      toggle,
      setMany,
      resetAll,
      ready,
      sync,
      lastSyncedAt,
      refresh,
      cloudEnabled,
      streak,
      hoursFlat,
      addHours,
      setHours,
      weekTotal,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

/** Study-hour hook, kept in the same provider so hours sync like ticks do. */
export function useStudyLog() {
  const { hours, today, addHours, setHours, weekTotal, ready } = useProgress();
  return {
    log: hours,
    add: addHours,
    set: setHours,
    ready,
    weekTotal,
    today,
  };
}
