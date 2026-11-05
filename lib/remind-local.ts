import { ALL_TASKS, DOMAINS, TOTAL_HOURS } from '@/data/syllabus';
import { TARGET_DATE } from './plan';

function hoursFor(taskId: string): number {
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      if (s.tasks.some((t) => t.id === taskId)) return s.hours / Math.max(1, s.tasks.length);
    }
  }
  return 0;
}

export function progressLocal(done: Record<string, boolean>) {
  let h = 0;
  let n = 0;
  for (const t of ALL_TASKS) {
    if (done[t.id]) {
      h += hoursFor(t.id);
      n++;
    }
  }
  const ms = Math.max(0, TARGET_DATE.getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const weeks = Math.max(0.5, days / 7);
  return {
    hoursDone: Math.round(h * 10) / 10,
    done: n,
    total: ALL_TASKS.length,
    hoursLeft: Math.round((TOTAL_HOURS - h) * 10) / 10,
    days,
    perWeek: Math.round(((TOTAL_HOURS - h) / weeks) * 10) / 10,
  };
}

export function nextMilestoneLocal(done: Record<string, boolean>) {
  for (const d of DOMAINS) {
    for (const s of d.subtopics) {
      for (const t of s.tasks) {
        if (t.kind === 'milestone' && !done[t.id]) {
          return { title: t.title.replace(/^MILESTONE:\s*/, ''), num: d.num, domain: d.title };
        }
      }
    }
  }
  return null;
}

export function reminderTextLocal(done: Record<string, boolean>): string {
  const p = progressLocal(done);
  const m = nextMilestoneLocal(done);
  return [
    `B.Cyber 2027 — ${p.days} days left`,
    `${p.hoursDone}/${TOTAL_HOURS} hrs · ${p.done}/${p.total} tasks`,
    `Pace needed: ${p.perWeek} hrs/week`,
    m ? `Next gate: ${m.title} (Domain ${m.num})` : 'All gates cleared',
  ].join('\n');
}
