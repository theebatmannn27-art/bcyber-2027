'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { DOMAINS, TOTAL_TASKS, type Domain, type Task } from '@/data/syllabus';
import { useProgress } from '@/lib/store';
import Bar from './Bar';

type Filter = 'all' | 'todo' | 'done' | 'milestone';

function KindDot({ kind }: { kind: Task['kind'] }) {
  if (kind === 'milestone')
    return (
      <span className="mr-1.5 font-mono text-[10px] text-amber-300" aria-label="milestone">
        ◆
      </span>
    );
  if (kind === 'build')
    return (
      <span className="mr-1.5 font-mono text-[10px] text-cyan-300" aria-label="build">
        ▣
      </span>
    );
  return null;
}

function Row({ task, accent }: { task: Task; accent: string }) {
  const { done, toggle } = useProgress();
  const checked = Boolean(done[task.id]);
  return (
    <li>
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={() => toggle(task.id)}
        className="flex w-full items-start gap-3 rounded-lg px-1 py-2.5 text-left transition active:bg-white/[0.04]"
      >
        <span
          className={`mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-md border transition ${
            checked ? 'border-transparent' : 'border-white/20 bg-white/[0.03]'
          }`}
          style={checked ? { background: accent } : undefined}
        >
          {checked && (
            <svg viewBox="0 0 20 20" className="pop h-3.5 w-3.5" fill="none" stroke="#05070d" strokeWidth="3">
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span
          className={`min-w-0 flex-1 text-[13.5px] leading-snug transition ${
            checked ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'
          }`}
        >
          <KindDot kind={task.kind} />
          {task.title}
        </span>
      </button>
    </li>
  );
}

function SubtopicBlock({
  domain,
  sub,
  filter,
}: {
  domain: Domain;
  sub: Domain['subtopics'][number];
  filter: Filter;
}) {
  const { done, setMany } = useProgress();
  const [open, setOpen] = useState(true);
  const total = sub.tasks.length;
  const complete = sub.tasks.filter((t) => done[t.id]).length;
  const pct = total ? (complete / total) * 100 : 0;

  const visible = sub.tasks.filter((t) => {
    if (filter === 'todo') return !done[t.id];
    if (filter === 'done') return Boolean(done[t.id]);
    if (filter === 'milestone') return t.kind === 'milestone';
    return true;
  });

  if (filter !== 'all' && visible.length === 0) return null;

  return (
    <section className="border-t border-white/[0.06] py-3 first:border-t-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className={`text-[10px] text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-slate-100">{sub.title}</span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">
              {complete}/{total}
            </span>
            <span className="w-16">
              <Bar pct={pct} color={domain.accent} h={3} />
            </span>
            <span className="text-[10px] text-slate-600">{sub.hours} hrs</span>
          </span>
        </span>
      </button>

      {open && (
        <>
          <ul className="mt-1">
            {visible.map((t) => (
              <Row key={t.id} task={t} accent={domain.accent} />
            ))}
          </ul>
          {filter === 'all' && complete < total && (
            <button
              onClick={() => setMany(sub.tasks.map((t) => t.id), true)}
              className="mt-1 text-[11px] text-slate-500 underline decoration-dotted underline-offset-2"
            >
              tick all {total} in this subtopic
            </button>
          )}
          {filter === 'all' && complete === total && (
            <button
              onClick={() => setMany(sub.tasks.map((t) => t.id), false)}
              className="mt-1 text-[11px] text-slate-600 underline decoration-dotted underline-offset-2"
            >
              clear this subtopic
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default function Checklist() {
  const { done, ready } = useProgress();
  const [domainId, setDomainId] = useState(DOMAINS[0].id);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showPicker, setShowPicker] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // read ?d= on mount so the page prerenders instead of flashing a spinner
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('d');
    if (d && DOMAINS.some((x) => x.id === d)) setDomainId(d);

    const onPop = () => {
      const next = new URLSearchParams(window.location.search).get('d');
      if (next && DOMAINS.some((x) => x.id === next)) setDomainId(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const domain = DOMAINS.find((d) => d.id === domainId)!;

  const searching = query.trim().length > 1;

  const results = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    const out: { task: Task; domain: Domain; sub: string }[] = [];
    for (const d of DOMAINS) {
      for (const s of d.subtopics) {
        for (const t of s.tasks) {
          if (t.title.toLowerCase().includes(q)) out.push({ task: t, domain: d, sub: s.title });
        }
      }
    }
    return out.slice(0, 80);
  }, [query, searching]);

  const domainTotal = domain.subtopics.flatMap((s) => s.tasks);
  const domainComplete = domainTotal.filter((t) => done[t.id]).length;
  const domainPct = domainTotal.length ? (domainComplete / domainTotal.length) * 100 : 0;

  const globalDone = Object.keys(done).filter((k) => done[k]).length;

  return (
    <main className="mx-auto w-full max-w-3xl pb-28">
      {/* sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#05070d]/85 backdrop-blur-md">
        <div className="px-4 pb-2.5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="text-[13px] text-slate-400 active:text-white">
              ← Dashboard
            </Link>
            <span className="font-mono text-[11px] text-slate-500">
              {globalDone}/{TOTAL_TASKS}
            </span>
          </div>

          <button
            onClick={() => setShowPicker((v) => !v)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-left"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: domain.accent }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">
                <span className="mr-1 font-mono text-[10px] text-slate-500">{domain.num}</span>
                {domain.title}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">
              {domainComplete}/{domainTotal.length}
            </span>
            <span className="text-[10px] text-slate-500">{showPicker ? '▲' : '▼'}</span>
          </button>

          {showPicker && (
            <div className="mt-1.5 max-h-[46vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080d16]">
              {DOMAINS.map((d) => {
                const all = d.subtopics.flatMap((s) => s.tasks);
                const c = all.filter((t) => done[t.id]).length;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDomainId(d.id);
                      setShowPicker(false);
                      setQuery('');
                      topRef.current?.scrollIntoView({ block: 'start' });
                      history.replaceState(null, '', `/checklist?d=${d.id}`);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left active:bg-white/[0.05] ${
                      d.id === domainId ? 'bg-white/[0.05]' : ''
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.accent }} />
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      <span className="mr-1 font-mono text-[10px] text-slate-500">{d.num}</span>
                      {d.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">
                      {c}/{all.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all 10 domains…"
              inputMode="search"
              className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-[13px] placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          {!searching && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {(['all', 'todo', 'done', 'milestone'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`chip shrink-0 ${
                    filter === f
                      ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                      : 'text-slate-400'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'todo' ? 'To do' : f === 'done' ? 'Done' : '◆ Milestones'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-[2px] w-full bg-white/[0.06]">
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${domainPct}%`, background: domain.accent }}
          />
        </div>
      </div>

      <div ref={topRef} />

      {/* search results */}
      {searching ? (
        <div className="px-4 pt-3">
          <p className="mb-1 text-[11px] text-slate-500">
            {results.length} match{results.length === 1 ? '' : 'es'}
          </p>
          <ul>
            {results.map(({ task, domain: d, sub }) => (
              <li key={task.id}>
                <button
                  onClick={() => {
                    setQuery('');
                    setDomainId(d.id);
                  }}
                  className="flex w-full items-start gap-2.5 py-2.5 text-left"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: d.accent }} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[13px] leading-snug ${
                        done[task.id] ? 'text-slate-500 line-through' : 'text-slate-200'
                      }`}
                    >
                      <KindDot kind={task.kind} />
                      {task.title}
                    </span>
                    <span className="text-[10.5px] text-slate-500">
                      {d.title} · {sub}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="px-4">
          <div className="pt-3">
            <h2 className="text-[17px] font-semibold leading-snug">
              Domain {domain.num} · {domain.title}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{domain.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip text-slate-400">{domain.hours} hrs</span>
              <span className="chip text-slate-400">{domain.tier}</span>
              <span className="chip text-slate-400">{domain.window}</span>
            </div>
          </div>

          {domain.subtopics.map((s) => (
            <SubtopicBlock key={s.id} domain={domain} sub={s} filter={filter} />
          ))}

          {domainComplete === domainTotal.length && (
            <div className="my-4 rounded-xl border border-lime-400/25 bg-lime-400/10 px-4 py-3">
              <p className="text-[13px] font-medium text-lime-300">Domain complete.</p>
              <p className="mt-0.5 text-[12px] text-lime-200/70">
                Move down. Do not go back and re-read it — the next domain needs the hours more.
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2 pb-4">
            {(() => {
              const i = DOMAINS.findIndex((d) => d.id === domain.id);
              const prev = DOMAINS[i - 1];
              const next = DOMAINS[i + 1];
              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => {
                        setDomainId(prev.id);
                        topRef.current?.scrollIntoView({ block: 'start' });
                      }}
                      className="btn text-[12px]"
                    >
                      ← {prev.num} {prev.title}
                    </button>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <button
                      onClick={() => {
                        setDomainId(next.id);
                        topRef.current?.scrollIntoView({ block: 'start' });
                      }}
                      className="btn btn-primary text-[12px]"
                    >
                      {next.num} {next.title} →
                    </button>
                  ) : (
                    <Link href="/" className="btn btn-primary text-[12px]">
                      Back to dashboard
                    </Link>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {!ready && <p className="px-4 py-6 text-center text-[12px] text-slate-600">Loading…</p>}
    </main>
  );
}
