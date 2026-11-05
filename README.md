# B.Cyber 2027 — Syllabus Tracker

A mobile-first checklist for the **IIT Kanpur B.Cyber 2027** entrance: a live countdown, 344 tickable
topics across 10 domains, weighted hour progress, a streak, a study log, and daily reminders that
arrive even when the app is closed.

Built for one person's gap year. Everything works offline-first: ticks are written to
`localStorage` immediately and synced to Supabase only if you add keys.

**Live:** https://bcyber-2027.vercel.app

---

## What it actually does

| Screen | What you get |
|---|---|
| **Dashboard** (`/`) | Countdown to the entrance window, % complete, hours done against 740, required hours per week, streak, today's logged hours, the next five tasks, per-domain progress bars, and the full 34-week calendar strip |
| **Checklist** (`/checklist`) | All 344 tasks grouped domain → subtopic. Collapsible sections, per-subtopic progress, filter by *To do* / *Done* / *Milestones*, search across all ten domains, tick-all for a subtopic |
| **Settings** (`/settings`) | Notification permission, reminder time, test notification, 7-day study log, `.ics` calendar export, reset |

### The three things that make it useful

1. **It tells you the truth about pace.** It does not just show a percentage — it compares hours
   completed against hours you *should* have completed by today, and says `Ahead` / `On pace` /
   `Behind`, with the hours-per-week you now actually need.
2. **It survives a dead network.** Every tick lands in `localStorage` first. Supabase is a
   convenience, not a dependency.
3. **It nags you without needing the app open.** A Vercel Cron job messages you on Telegram every
   evening at 19:00 IST.

---

## The syllabus

740 hours, 10 domains, 344 tasks — reconstructed from the six hackathon topics
IIT Kanpur has actually published (cryptography, web, API, network, reverse engineering, OSINT)
plus the stated aptitude areas (basic maths, logical reasoning, cyber aptitude).

| # | Domain | Hours | Tasks |
|---|---|---|---|
| 0 | Foundations | 60 | 52 |
| 1 | Cryptography | 55 | 40 |
| 2 | Web security | 130 | 62 |
| 3 | API security | 55 | 30 |
| 4 | Network security | 60 | 27 |
| 5 | OSINT | 40 | 22 |
| 6 | Reverse engineering | 70 | 29 |
| 7 | Aptitude | 110 | 41 |
| 8 | Practice | 100 | 21 |
| 9 | Portfolio & evidence | 60 | 20 |
| | **Total** | **740** | **344** |

The whole list lives in **`data/syllabus.ts`** as plain TypeScript. Add a task, change an hour
count, reorder a domain — it is all one file, no database migration.

```ts
t('d0s1t1', 'Filesystem hierarchy — /etc, /var, /usr, /home, /tmp, /opt'),  // normal task
m('d0s1m1', 'OverTheWire Bandit levels 0–34 complete'),                     // ◆ hard gate
b('d0s2b1', 'Network port scanner, written and documented'),                // ▣ portfolio artifact
```

Task ids are the storage key. **If you rename an id, existing ticks for it are lost.** Append, don't rename.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are needed — it runs local-only out of the box.

```bash
npm run build && npm start   # production build
npx tsc --noEmit             # type check
```

---

## Deploy

Pushing to `main` deploys automatically once the Vercel project is linked.

```bash
git init && git add -A && git commit -m "init"
git remote add origin git@github.com:<you>/bcyber-2027.git
git push -u origin main
```

Then import the repo at [vercel.com/new](https://vercel.com/new). Framework preset is detected as
Next.js; no build settings to change.

---

## Optional: the three integrations

Every one of these is optional. Skip them and the app still works — it just keeps everything on
one device.

### 1. Supabase — sync ticks across devices

1. Create a project at [supabase.com](https://supabase.com) (free tier is plenty).
2. Open **SQL Editor** and paste all of **`supabase/schema.sql`**. Run it.
3. Go to **Project Settings → API** and copy the Project URL and the `anon` `public` key.
4. Add both to Vercel → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
```

5. Redeploy.

The schema creates one `progress` table with a row per device, keyed by a random UUID that lives in
the browser. Row-level security allows read/write on that table only. That is the entire model —
**the device UUID is the secret**, which is fine for a personal study tracker and not fine for
anything sensitive. Do not put personal data in it.

### 2. Telegram — reminders with the app closed

This is the part that actually nags you.

1. Message [@BotFather](https://t.me/botfather) → `/newbot` → copy the token.
2. Message your new bot once (anything). Then open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy the `chat.id` you see.
3. Add to Vercel:

```
TELEGRAM_BOT_TOKEN = 8100...:AA...
TELEGRAM_CHAT_ID   = 123456789
CRON_SECRET        = any-long-random-string
```

`vercel.json` already declares the cron job — it hits `/api/remind` daily at 13:30 UTC (19:00 IST).

Test it by hand any time:

```bash
curl "https://your-app.vercel.app/api/remind?secret=YOUR_CRON_SECRET"
```

You should get `{"ok":true,"sent":true,...}` and a Telegram message reading roughly:

```
B.Cyber 2027 — 242 days left
46.5/740 hrs · 31/344 tasks
Pace needed: 18.2 hrs/week
Next gate: Cryptography done, CUET registered (Domain 1)
```

> **Note on Vercel plans:** daily cron jobs run on Hobby, but they fire at an approximate time.
> If your plan rejects the schedule, either upgrade or point any external scheduler
> (cron-job.org, GitHub Actions, your own laptop) at the same URL.

### 3. Browser notifications — in-tab only

Settings → *Enable on this device* asks for permission and fires a notification at your chosen time
**while the tab is open**. That is a real limitation of static client-side scheduling; it is why the
Telegram route exists. The service worker (`public/sw.js`) is registered and also handles a real
`push` event if you later add VAPID keys server-side.

### Not included: Google Drive

Google Drive cannot serve as the storage layer for this app. Drive is a file store, not a database —
it has no row-level reads or per-field writes, and OAuth tokens cannot live in a static bundle
without exposing them. Supabase's free tier does the job properly and costs nothing. The app also
exports `.ics`, which you can drop straight into Drive and open in Google Calendar if you want the
checkpoints there.

---

## Push the code to GitHub

The repo helper creates the repo and pushes in one step:

```bash
node scripts/push-github.mjs <github-token> bcyber-2027
```

Create the token at [github.com/settings/tokens/new?scopes=repo](https://github.com/settings/tokens/new?scopes=repo).
The token is used once and never written to disk.

Or do it by hand:

```bash
git init -b main
git add -A
git commit -m "B.Cyber 2027 tracker"
git remote add origin https://github.com/<you>/bcyber-2027.git
git push -u origin main
```

---

## File map

```
app/
  page.tsx                 dashboard
  checklist/page.tsx       full syllabus checklist
  settings/page.tsx        notifications, study log, data
  api/remind/route.ts      cron target → Telegram message
  api/ics/route.ts         calendar export
  layout.tsx  globals.css
components/
  Dashboard.tsx  Checklist.tsx  SettingsPanel.tsx
  Countdown.tsx  Ring.tsx  Bar.tsx
data/syllabus.ts           ← the entire syllabus lives here
lib/
  plan.ts                  countdown, pace maths, domain scheduling
  store.tsx                progress state, localStorage + Supabase sync
  studylog.ts              hours per day
  remind-local.ts          reminder text built on the client
supabase/schema.sql        one table, RLS, updated_at trigger
public/sw.js               offline shell + notification handling
scripts/push-github.mjs    create repo and push
vercel.json                cron schedule
```

---

## Design notes

- **Hours, not just ticks.** A task is worth `subtopic_hours / task_count` hours, so progress is
  weighted by real effort. Ticking "Bandit 0–34" is worth more than ticking "café".
- **Server-rendered checklist.** No `useSearchParams`, so `/checklist` prerenders and there is no
  spinner on a cold load over mobile data.
- **Dark, fixed, single column.** Built at 375 px first. Tap targets are 44 px, `viewport-fit=cover`
  respects the notch, and there is no horizontal scroll anywhere.
- **No login.** A random device UUID is the identity. Nothing to sign up for, nothing to forget.

---

*IIT Kanpur has not published the 2027 syllabus. This list is a reconstruction from published
hackathon topics and stated aptitude areas — re-check
[iitk.ac.in/wsais/b-cyber.php](https://www.iitk.ac.in/wsais/b-cyber.php) when the notification drops.*
