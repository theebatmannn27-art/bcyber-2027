'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DOMAINS, TOTAL_HOURS } from '@/data/syllabus';
import {
  computeStats,
  domainProgress,
  fmtShort,
  scheduledDomainNow,
  today,
  domainSchedule,
  TARGET_DATE,
} from '@/lib/plan';
import { useProgress } from '@/lib/store';
import { useStudyLog } from '@/lib/store';
import Countdown from './Countdown';
import TodayPlan from './TodayPlan';
import FocusTimer from './FocusTimer';
import LockButton from './LockButton';
import Ring from './Ring';
import Bar from './Bar';

const STATUS_COPY: Record<string, { label: string; color: string; note: string }> = {
  notstarted: { label: 'Day one', color: '#94a3b8', note: 'Nothing ticked yet. Start with Bandit.' },
  ahead: { label: 'Ahead of pace', color: '#a3e635', note: 'Keep the ratio. Do not coast.' },
  ontrack: { label: 'On pace', color: '#22d3ee', note: 'Protect the 30 hours a week.' },
  behind: { label: 'Behind pace', color: '#fbbf24', note: 'Cut scope, never cut aptitude.' },
  done: { label: 'Syllabus complete', color: '#a3e635', note: 'Now drill mocks and the portfolio.' },
};

export default function Dashboard() {
  const { done, ready, streak, sync, cloudEnabled, resetAll } = useProgress();
  const stats = useMemo(() => computeStats(done), [done]);
  const schedNow = useMemo(() => scheduledDomainNow(), []);
  const current = DOMAINS.find((d) => d.id === stats.currentDomainId)!;
  const schedule = useMemo(() => domainSchedule(), []);
  const study = useStudyLog();
  const [confirmReset, setConfirmReset] = useState(false);

  const nextTasks = useMemo(() => {
    const out: { id: string; title: string; kind: string; domain: string; color: string }[] = [];
    for (const d of DOMAINS) {
      for (const s of d.subtopics) {
        for (const t of s.tasks) {
          if (!done[t.id]) out.push({ ...t, domain: d.title, color: d.accent });
          if (out.length >= 5) return out;
        }
      }
    }
    return out;
  }, [done]);

  const status = STATUS_COPY[stats.status];
  const scheduledDomain = DOMAINS.find((d) => d.id === schedNow)!;
  const driftDays = Math.round((stats.hoursDone - (stats.hoursDone + stats.paceDelta)) / 30 * 7);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:pt-8">
      {/* header */}
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label">IIT Kanpur · Wadhwani School of AI</p>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            B.Cyber <span className="text-cyan-300">2027</span>
          </h1>
          <p className="mt-1 text-[13px] text-slate-400">
            {TOTAL_HOURS} hours · {stats.totalTasks} tasks · one target
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="chip"
            style={{ color: status.color, borderColor: `${status.color}44`, background: `${status.color}14` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
            {status.label}
          </span>
          <LockButton />
        </div>
      </header>

      {/* countdown */}
      <section className="card mb-3">
        <Countdown />
      </section>

      {/* headline stats */}
      <section className="card mb-3">
        <div className="flex items-center gap-4">
          <Ring pct={stats.pct} color={status.color}>
            <span className="font-mono text-lg font-semibold leading-none">{Math.round(stats.pct)}%</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">done</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="stat-num">{Math.round(stats.hoursDone)}</span>
              <span className="text-sm text-slate-500">/ {TOTAL_HOURS} hrs</span>
            </div>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {stats.doneTasks} of {stats.totalTasks} tasks · {Math.round(stats.hoursLeft)} hrs left
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-slate-500">Need / week</span>
              <span className="text-right font-mono text-slate-200">
                {stats.requiredPerWeek.toFixed(1)} h
              </span>
              <span className="text-slate-500">Capacity / week</span>
              <span className="text-right font-mono text-slate-200">30 h</span>
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2 text-[12px] leading-relaxed text-slate-400">
          {stats.status === 'notstarted'
            ? 'Nothing logged yet. The first tick is the only one that matters today — open the checklist and finish Bandit 0.'
            : stats.status === 'behind'
            ? `You need ${stats.requiredPerWeek.toFixed(1)} h a week against a 30 h plan — roughly ${Math.abs(
                driftDays
              )} days behind. Compress Foundations and Web; they are the least new material for you.`
            : stats.status === 'done'
            ? 'Every box is ticked. Switch to timed mocks twice a week and keep the portfolio current.'
            : `You are carrying a ${Math.round(
                stats.bufferHours
              )} hour buffer. The clock is not the risk — drifting is.`}
        </p>
      </section>

      {/* streak + today */}
      <section className="mb-3 grid grid-cols-2 gap-3">
        <div className="card">
          <p className="label">Streak</p>
          <p className="stat-num mt-1 text-amber-300">
            {streak}
            <span className="ml-1 text-xs font-normal text-slate-500">days</span>
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">any tick keeps it alive</p>
        </div>
        <div className="card">
          <p className="label">Logged today</p>
          <p className="stat-num mt-1">
            {study.today}
            <span className="ml-1 text-xs font-normal text-slate-500">/ 4.3 h</span>
          </p>
          <div className="mt-1.5 flex gap-1.5">
            {[0.5, 1, 2].map((h) => (
              <button
                key={h}
                onClick={() => study.add(h)}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 font-mono text-[11px] text-slate-300 active:scale-95"
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>
      </section>

      <TodayPlan />

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <FocusTimer />
      </div>

      {/* where you should be */}
      <section className="card mb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="label">Where you should be</p>
          <span className="text-[11px] text-slate-500">{scheduledDomain.window}</span>
        </div>
        <p className="mt-1.5 text-[15px] font-medium">
          Domain {scheduledDomain.num} · {scheduledDomain.title}
        </p>
        <p className="mt-0.5 text-[12px] text-slate-400">
          {scheduledDomain.hours} hrs scheduled · you are actually in{' '}
          <span className="text-slate-200">
            Domain {current.num} · {current.title}
          </span>
        </p>
        {schedNow !== stats.currentDomainId && (
          <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-200/90">
            Schedule and progress disagree. That is normal after a compression — but if the gap
            stays for two weeks, re-balance the plan.
          </p>
        )}
        <Link href={`/checklist?d=${current.id}`} className="btn btn-primary mt-3 w-full">
          Continue Domain {current.num} →
        </Link>
      </section>

      {/* next up */}
      <section className="card mb-3">
        <div className="flex items-center justify-between">
          <p className="label">Next five</p>
          <span className="text-[11px] text-slate-500">top of the list, not random</span>
        </div>
        <ul className="mt-2 divide-y divide-white/[0.06]">
          {nextTasks.length === 0 && (
            <li className="py-3 text-[13px] text-lime-300">Everything is ticked. Go do a mock.</li>
          )}
          {nextTasks.map((t) => (
            <li key={t.id} className="flex items-start gap-2.5 py-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: t.color }}
              />
              <span className="min-w-0 text-[13px] leading-snug text-slate-200">
                {t.kind === 'milestone' && <span className="mr-1 text-amber-300">◆</span>}
                {t.kind === 'build' && <span className="mr-1 text-cyan-300">▣</span>}
                {t.title}
                <span className="ml-1.5 text-[11px] text-slate-500">{t.domain}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* domain progress */}
      <section className="card mb-3">
        <div className="flex items-center justify-between">
          <p className="label">Domains</p>
          <Link href="/checklist" className="text-[11px] text-cyan-300">
            open checklist →
          </Link>
        </div>
        <div className="mt-2.5 space-y-2.5">
          {DOMAINS.map((d) => {
            const p = domainProgress(done, d.id);
            return (
              <Link key={d.id} href={`/checklist?d=${d.id}`} className="block active:opacity-70">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] text-slate-200">
                    <span className="mr-1.5 font-mono text-[11px] text-slate-500">{d.num}</span>
                    {d.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {p.complete}/{p.total}
                  </span>
                </div>
                <div className="mt-1">
                  <Bar pct={p.pct} color={d.accent} h={5} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* calendar strip */}
      <section className="card mb-3">
        <p className="label">The year, in order</p>
        <ol className="mt-2 space-y-1.5">
          {schedule.map((slot) => {
            const d = DOMAINS.find((x) => x.id === slot.id)!;
            const isNow = today() >= slot.start && today() <= slot.end;
            return (
              <li
                key={slot.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] ${
                  isNow ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-400'
                }`}
              >
                <span className="truncate">
                  <span className="mr-1.5 font-mono text-[10px] opacity-60">{d.num}</span>
                  {d.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] opacity-70">
                  {fmtShort(slot.start)} – {fmtShort(slot.end)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* footer / settings */}
      <section className="card">
        <p className="label">Data</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
          {cloudEnabled ? (
            <>
              Synced to Supabase ·{' '}
              <span className="text-slate-200">
                {sync === 'saving' ? 'saving…' : sync === 'error' ? 'sync failed, kept locally' : 'up to date'}
              </span>
            </>
          ) : (
            <>
              Stored on this device only. Add Supabase keys to sync across devices — every tick is
              still saved locally either way.
            </>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/ics" className="btn text-[12px]">
            Add checkpoints to calendar
          </a>
          <Link href="/checklist" className="btn text-[12px]">
            Full checklist
          </Link>
          <Link href="/settings" className="btn text-[12px]">
            Settings
          </Link>
          {!confirmReset ? (
            <button className="btn text-[12px] text-red-300" onClick={() => setConfirmReset(true)}>
              Reset
            </button>
          ) : (
            <button
              className="btn border-red-400/30 bg-red-400/15 text-[12px] text-red-200"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              Tap again to erase all ticks
            </button>
          )}
        </div>
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] leading-relaxed text-slate-600">
          IIT Kanpur has not published the 2027 syllabus. This list reconstructs it from the six
          published hackathon topics and the stated aptitude areas. Re-check iitk.ac.in/wsais/b-cyber.php
          when the notification drops.
        </p>
      </section>

      {!ready && null}
    </main>
  );
}
