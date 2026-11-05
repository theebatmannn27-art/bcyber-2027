#!/usr/bin/env node
/**
 * Creates the GitHub repo and pushes this project.
 *
 *   node scripts/push-github.mjs <github-token> [repo-name] [owner]
 *
 * Needs a Personal Access Token with `repo` scope:
 *   https://github.com/settings/tokens/new?scopes=repo
 * The token is used once and never written to disk.
 */
import { execSync } from 'node:child_process';

const [token, repo = 'bcyber-2027', owner] = process.argv.slice(2);

if (!token) {
  console.error(`
Usage: node scripts/push-github.mjs <github-token> [repo-name] [owner]

  1. Create a token with repo scope:
     https://github.com/settings/tokens/new?scopes=repo
  2. Run the command with that token.
`);
  process.exit(1);
}

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'bcyber-2027-push',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

(async () => {
  const me = await api('/user');
  if (!me.ok) {
    console.error(`GitHub auth failed (${me.status}). Check the token.`);
    process.exit(1);
  }
  const login = owner || me.json.login;
  console.log(`Authenticated as ${me.json.login} → target ${login}/${repo}`);

  const existing = await api(`/repos/${login}/${repo}`);
  if (existing.ok) {
    console.log('Repository already exists — pushing into it.');
  } else {
    const created = await api('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: repo,
        description: 'B.Cyber 2027 syllabus tracker — countdown, checklist, streak and daily reminders.',
        private: false,
        has_issues: true,
        has_wiki: false,
        auto_init: false,
      }),
    });
    if (!created.ok) {
      console.error('Could not create repo:', created.status, JSON.stringify(created.json));
      process.exit(1);
    }
    console.log('Created', created.json.html_url);
  }

  const remote = `https://x-access-token:${token}@github.com/${login}/${repo}.git`;

  try { run('git rev-parse --git-dir', { stdio: 'ignore' }); }
  catch { run('git init -b main'); }

  run('git add -A');
  try {
    run('git -c user.email=tracker@bcyber.local -c user.name="B.Cyber Tracker" commit -m "B.Cyber 2027 tracker: checklist, countdown, streak, reminders"');
  } catch {
    console.log('Nothing new to commit.');
  }
  run('git branch -M main');
  try { run(`git remote set-url origin ${remote}`); }
  catch { run(`git remote add origin ${remote}`); }

  run('git push -u origin main --force');
  console.log(`\nDone → https://github.com/${login}/${repo}`);
})().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
