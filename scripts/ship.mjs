#!/usr/bin/env node
/**
 * One-shot: push to GitHub, create the Vercel project, upload env vars, deploy to production.
 *
 *   node scripts/ship.mjs --vercel=<token> --github=<token> \
 *        [--repo=bcyber-2027] [--telegram-token=...] [--telegram-chat=...] [--supabase-url=...] [--supabase-key=...]
 *
 * Tokens are used in memory only and are never written to disk.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  })
);
const VERCEL = args.vercel;
const GITHUB = args.github;
const REPO = args.repo || 'bcyber-2027';
const ROOT = process.cwd();

if (!VERCEL && !GITHUB) {
  console.error('Need --vercel=<token> and/or --github=<token>.');
  process.exit(1);
}

const log = (...a) => console.log(...a);

/* ---------- GitHub ---------- */
async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'bcyber-ship',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function shipGitHub() {
  log('\n── GitHub ──');
  const me = await gh('/user');
  if (!me.ok) throw new Error(`GitHub auth failed (${me.status})`);
  const login = me.json.login;
  log(`authenticated as ${login}`);

  const exist = await gh(`/repos/${login}/${REPO}`);
  if (exist.ok) log(`repo exists: ${exist.json.html_url}`);
  else {
    const made = await gh('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: REPO,
        description: 'B.Cyber 2027 syllabus tracker — countdown, 344-task checklist, streak, daily reminders.',
        private: false,
        has_issues: true,
        auto_init: false,
      }),
    });
    if (!made.ok) throw new Error(`repo create failed ${made.status}: ${JSON.stringify(made.json)}`);
    log(`created ${made.json.html_url}`);
  }

  const remote = `https://x-access-token:${GITHUB}@github.com/${login}/${REPO}.git`;
  const run = (c, opts = {}) => execSync(c, { stdio: 'inherit', ...opts });

  try { run('git rev-parse --git-dir', { stdio: 'ignore' }); } catch { run('git init -b main'); }
  run('git add -A');
  try {
    run('git -c user.email=tracker@bcyber.local -c user.name="B.Cyber Tracker" commit -m "B.Cyber 2027 tracker"');
  } catch { log('nothing new to commit'); }
  run('git branch -M main');
  try { run(`git remote set-url origin ${remote}`); } catch { run(`git remote add origin ${remote}`); }
  run('git push -u origin main --force');
  log(`pushed → https://github.com/${login}/${REPO}`);
  return `https://github.com/${login}/${REPO}`;
}

/* ---------- Vercel ---------- */
const TEAM = 'team_IH599By8OSrcsZR3PZ1J1ZWr';

async function vc(path, init = {}) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out', '.vercel', 'dist', 'coverage']);
const SKIP_FILES = new Set(['tsconfig.tsbuildinfo', 'next-env.d.ts', '.env', '.env.local']);

function collect(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || SKIP_FILES.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) collect(full, acc);
    else acc.push({ file: relative(ROOT, full), data: readFileSync(full, 'utf8') });
  }
  return acc;
}

async function shipVercel() {
  log('\n── Vercel ──');

  let project = (await vc(`/v9/projects/${REPO}`)).json;
  if (!project?.id) {
    const made = await vc('/v11/projects', {
      method: 'POST',
      body: JSON.stringify({ name: REPO, framework: 'nextjs' }),
    });
    if (!made.ok) throw new Error(`project create failed ${made.status}: ${JSON.stringify(made.json)}`);
    project = made.json;
    log(`created project ${project.name}`);
  } else {
    log(`project exists: ${project.name}`);
  }
  const projectId = project.id;

  // env vars
  const envs = [
    ['NEXT_PUBLIC_TARGET_DATE', '2027-07-05T09:00:00'],
    ['TELEGRAM_BOT_TOKEN', args['telegram-token']],
    ['TELEGRAM_CHAT_ID', args['telegram-chat']],
    ['NEXT_PUBLIC_SUPABASE_URL', args['supabase-url']],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', args['supabase-key']],
  ].filter(([, v]) => v);

  if (envs.length) {
    const existing = (await vc(`/v10/projects/${projectId}/env`)).json;
    const keys = new Set((existing?.envs || []).map((e) => e.key));
    for (const [key, value] of envs) {
      if (keys.has(key)) { log(`env ${key} already set`); continue; }
      const r = await vc(`/v10/projects/${projectId}/env`, {
        method: 'POST',
        body: JSON.stringify({ key, value, type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted', target: ['production', 'preview', 'development'] }),
      });
      log(r.ok ? `env ${key} set` : `env ${key} FAILED ${r.status}`);
    }
  }

  // upload the tree
  const files = collect(ROOT);
  log(`uploading ${files.length} files…`);
  const dep = await vc('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: REPO,
      files,
      project: projectId,
      target: 'production',
      projectSettings: { framework: 'nextjs', buildCommand: 'next build', outputDirectory: null, rootDirectory: null },
    }),
  });
  if (!dep.ok) throw new Error(`deploy failed ${dep.status}: ${JSON.stringify(dep.json).slice(0, 600)}`);
  log(`deployment ${dep.json.id} → ${dep.json.url} (${dep.json.readyState || 'QUEUED'})`);
  return dep.json;
}

/* ---------- go ---------- */
(async () => {
  const out = {};
  if (GITHUB) out.github = await shipGitHub();
  if (VERCEL) out.vercel = await shipVercel();
  log('\n── done ──');
  log(JSON.stringify(out, null, 2));
})().catch((e) => {
  console.error('\nFAILED:', e.message);
  process.exit(1);
});
