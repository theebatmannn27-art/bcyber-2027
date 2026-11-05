import { DOMAINS, HOURS_BY_DOMAIN, TOTAL_HOURS, TOTAL_TASKS, ALL_TASKS } from '@/data/syllabus';

export const TARGET_DATE = new Date(
  process.env.NEXT_PUBLIC_TARGET_DATE || '2027-07-05T09:00:00'
);
export const START_DATE = new Date('2026-11-05T00:00:00');

export const WEEKLY_TARGET_HOURS = 30;
export const HOURS_REQUIRED = TOTAL_HOURS; // 740

const MS_DAY = 86400000;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_DAY);
}

/** Local-midnight "today", so countdowns do not drift by timezone. */
export function today(): Date {
  return startOfDay(new Date());
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Split a whole-number day count into d / h / m / s style parts for the timer. */
export function splitCountdown(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalDays = ms / MS_DAY;
  return {
    totalDays: Math.floor(totalDays),
    days: Math.floor(totalDays),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    finished: ms <= 0,
  };
}

/** Hours attributed to a single task = its subtopic hours split evenly across tasks. */
export const TASK_HOURS: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      const per = s.hours / Math.max(1, s.tasks.length);
      for (const t of s.tasks) out[t.id] = per;
    }
  }
  return out;
})();

export const TASK_DOMAIN: Record<string, string> = Object.fromEntries(
  ALL_TASKS.map((t) => [t.id, t.domainId])
);

export interface PlanStats {
  daysLeft: number;
  weeksLeft: number;
  totalTasks: number;
  doneTasks: number;
  pct: number;
  hoursDone: number;
  hoursLeft: number;
  availableHours: number;
  bufferHours: number;
  /** hours per week needed from today to finish on time */
  requiredPerWeek: number;
  /** how far ahead/behind the pace line, in hours (positive = ahead) */
  paceDelta: number;
  status: 'notstarted' | 'ahead' | 'ontrack' | 'behind' | 'done';
  currentDomainId: string;
}

export function computeStats(done: Record<string, boolean>): PlanStats {
  const now = today();
  const daysLeft = Math.max(0, daysBetween(now, TARGET_DATE));
  const weeksLeft = Math.max(0.5, daysLeft / 7);

  let hoursDone = 0;
  let doneTasks = 0;
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      const per = s.hours / Math.max(1, s.tasks.length);
      for (const t of s.tasks) {
        if (done[t.id]) {
          hoursDone += per;
          doneTasks += 1;
        }
      }
    }
  }

  const hoursLeft = Math.max(0, HOURS_REQUIRED - hoursDone);
  const availableHours = weeksLeft * WEEKLY_TARGET_HOURS;
  const elapsedDays = Math.max(0, daysBetween(START_DATE, now));
  const elapsedWeeks = elapsedDays / 7;
  const elapsedCapacity = elapsedWeeks * WEEKLY_TARGET_HOURS;
  const paceDelta = hoursDone - elapsedCapacity;

  const pct = TOTAL_TASKS === 0 ? 0 : (doneTasks / TOTAL_TASKS) * 100;
  const requiredPerWeek = hoursLeft / weeksLeft;

  let status: PlanStats['status'] = 'ontrack';
  if (hoursLeft <= 0) status = 'done';
  else if (doneTasks === 0) status = 'notstarted';
  else if (paceDelta > 15) status = 'ahead';
  else if (requiredPerWeek > WEEKLY_TARGET_HOURS * 1.12) status = 'behind';

  // The domain you should currently be working in = first one that is not fully ticked.
  let currentDomainId = DOMAINS[DOMAINS.length - 1].id;
  for (const d of DOMAINS) {
    const all = d.subtopics.flatMap((s) => s.tasks);
    const complete = all.filter((t) => done[t.id]).length;
    if (complete < all.length) {
      currentDomainId = d.id;
      break;
    }
  }

  return {
    daysLeft,
    weeksLeft,
    totalTasks: TOTAL_TASKS,
    doneTasks,
    pct,
    hoursDone,
    hoursLeft,
    availableHours,
    bufferHours: availableHours - hoursLeft,
    requiredPerWeek,
    paceDelta,
    status,
    currentDomainId,
  };
}

export function domainProgress(done: Record<string, boolean>, domainId: string) {
  const d = DOMAINS.find((x) => x.id === domainId)!;
  const all = d.subtopics.flatMap((s) => s.tasks);
  const complete = all.filter((t) => done[t.id]).length;
  return {
    total: all.length,
    complete,
    pct: all.length ? (complete / all.length) * 100 : 0,
    hours: d.hours,
  };
}

/**
 * Spread the ten domains across the window in proportion to their hours.
 * Returns the calendar slot each domain is meant to occupy, so the dashboard can
 * say "you should be in Domain 1 right now".
 */
export function domainSchedule() {
  const total = HOURS_REQUIRED;
  const spanDays = Math.max(1, daysBetween(START_DATE, TARGET_DATE));
  const out: { id: string; start: Date; end: Date; hours: number }[] = [];
  let cursor = 0;
  for (const d of DOMAINS) {
    const share = (HOURS_BY_DOMAIN[d.id] / total) * spanDays;
    const start = new Date(START_DATE.getTime() + cursor * MS_DAY);
    const end = new Date(START_DATE.getTime() + (cursor + share) * MS_DAY);
    out.push({ id: d.id, start, end, hours: d.hours });
    cursor += share;
  }
  return out;
}

export function scheduledDomainNow(): string {
  const now = today().getTime();
  for (const slot of domainSchedule()) {
    if (now <= slot.end.getTime()) return slot.id;
  }
  return DOMAINS[DOMAINS.length - 1].id;
}
