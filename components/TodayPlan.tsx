'use client';

import Link from 'next/link';
import { DOMAINS } from '@/data/syllabus';
import { TASK_HOURS, computeStats } from '@/lib/plan';
import { useProgress } from '@/lib/store';
import { useStudyLog } from '@/lib/studylog';

/**
 * "Do these three things today." Turns the 344-task wall into a day-sized list
 * that adds up to the hours actually needed this week.
 */
export default function TodayPlan() {
  const { done, toggle } = useProgress();
  const study = useStudyLog();

  const stats = computeStats(done);
  const dailyTarget = Math.max(1, stats.requiredPerWeek / 6);

  const pending: { id: string; title: string; domain: string; num: number; hours: number }[] = [];
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      for (const t of s.tasks) {
        if (done[t.id]) continue;
        pending.push({
          id: t.id,
          title: t.title,
          domain: d.title,
          num: d.num,
          hours: TASK_HOURS[t.id] ?? 0,
        });
      }
    }
  }

  // take tasks in order until the day's hours are covered (max 4)
  const picks: typeof pending = [];
  let acc = 0;
  for (const t of pending) {
    if (picks.length >= 4) break;
    picks.push(t);
    acc += t.hours;
    if (acc >= dailyTarget && picks.length >= 2) break;
  }

  const logged = study.today;
  const met = logged >= dailyTarget;

  return (
    <section className="card mb-3">
      <div className="flex items-center justify-between">
        <p className="label">Today</p>
        <span className="text-[11px] text-slate-500">
          target {dailyTarget.toFixed(1)} h · logged {logged.toFixed(1)} h
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${Math.min(100, (logged / dailyTarget) * 100)}%`,
            background: met ? '#a3e635' : 'linear-gradient(90deg,#0891b2,#22d3ee)',
          }}
        />
      </div>

      <ul className="mt-3 divide-y divide-white/[0.06]">
        {picks.length === 0 && (
          <li className="py-2 text-[13px] text-lime-300">Nothing left. Mocks and portfolio only.</li>
        )}
        {picks.map((t) => (
          <li key={t.id} className="flex items-start gap-2.5 py-2.5">
            <button
              aria-label={`Mark done: ${t.title}`}
              onClick={() => {
                toggle(t.id);
                study.add(t.hours);
              }}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-white/20 active:scale-95"
            >
              <span className="h-2 w-2 rounded-[2px] bg-transparent" />
            </button>
            <span className="min-w-0 flex-1 text-[13px] leading-snug text-slate-200">
              {t.title}
              <span className="ml-1.5 text-[11px] text-slate-500">
                {t.hours.toFixed(1)} h · D{t.num}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] leading-relaxed text-slate-500">
          {met ? 'Target met. Stop, or bank the surplus.' : 'Tick one, then start the timer.'}
        </p>
        <Link href="/checklist" className="text-[11px] text-cyan-300">
          full list →
        </Link>
      </div>
    </section>
  );
}
