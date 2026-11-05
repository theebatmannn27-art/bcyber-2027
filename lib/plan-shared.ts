// Server-safe subset of the plan maths (no browser globals).
import { DOMAINS, TOTAL_HOURS, ALL_TASKS } from '@/data/syllabus';

export const TARGET_ISO = process.env.NEXT_PUBLIC_TARGET_DATE || '2027-07-05T09:00:00';
export const START_ISO = '2026-11-05T00:00:00';

export const MS_DAY = 86400000;

export function daysToTarget(from = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const t = new Date(TARGET_ISO);
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / MS_DAY));
}

export function hoursForTask(taskId: string): number {
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      if (s.tasks.some((t) => t.id === taskId)) return s.hours / Math.max(1, s.tasks.length);
    }
  }
  return 0;
}

export function progressSummary(done: Record<string, boolean>) {
  let hoursDone = 0;
  let doneCount = 0;
  for (const t of ALL_TASKS) {
    if (done[t.id]) {
      hoursDone += hoursForTask(t.id);
      doneCount += 1;
    }
  }
  const daysLeft = daysToTarget();
  const weeksLeft = Math.max(0.5, daysLeft / 7);
  return {
    hoursDone: Math.round(hoursDone * 10) / 10,
    doneCount,
    totalTasks: ALL_TASKS.length,
    totalHours: TOTAL_HOURS,
    hoursLeft: Math.round((TOTAL_HOURS - hoursDone) * 10) / 10,
    daysLeft,
    requiredPerWeek: Math.round(((TOTAL_HOURS - hoursDone) / weeksLeft) * 10) / 10,
  };
}

/** The next unfinished milestone — the thing worth nagging about. */
export function nextMilestone(done: Record<string, boolean>) {
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      for (const t of s.tasks) {
        if (t.kind === 'milestone' && !done[t.id]) {
          return { title: t.title.replace(/^MILESTONE:\s*/, ''), domain: d.title, num: d.num };
        }
      }
    }
  }
  return null;
}

/** Compact reminder text used by the cron job and the client notification. */
export function reminderText(done: Record<string, boolean>): string {
  const p = progressSummary(done);
  const ms = nextMilestone(done);
  const lines = [
    `B.Cyber 2027 — ${p.daysLeft} days left`,
    `${p.hoursDone}/${p.totalHours} hrs · ${p.doneCount}/${p.totalTasks} tasks`,
    `Pace needed: ${p.requiredPerWeek} hrs/week`,
  ];
  if (ms) lines.push(`Next gate: ${ms.title} (Domain ${ms.num})`);
  return lines.join('\n');
}
