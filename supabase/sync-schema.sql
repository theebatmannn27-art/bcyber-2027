-- B.Cyber 2027 — cross-device sync schema
-- Run in the Supabase SQL editor. Then set SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY (server-only) in Vercel.

create table if not exists public.ticks (
  profile    text    not null default 'owner',
  task_id    text    not null,
  on_state   boolean not null,
  at         bigint  not null,          -- ms timestamp of the change
  primary key (profile, task_id)
);

create table if not exists public.hours (
  profile text    not null default 'owner',
  day     text    not null,
  hours   numeric not null,
  at      bigint  not null,
  primary key (profile, day)
);

create table if not exists public.meta (
  profile    text not null primary key,
  streak     int  not null default 0,
  last_tick  text,
  updated_at timestamptz not null default now()
);

-- RLS on, no policies: anon/authenticated keys can read nothing.
-- Only the service role, held server-side, can touch these tables.
alter table public.ticks enable row level security;
alter table public.hours enable row level security;
alter table public.meta  enable row level security;

-- Atomic last-write-wins merge per task: newer timestamp decides, always.
create or replace function public.push_ticks(p jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.ticks (profile, task_id, on_state, at)
  select 'owner', key, (value->>'on')::boolean, (value->>'at')::bigint
  from jsonb_each(p)
  where (value->>'at') is not null
  on conflict (profile, task_id) do update
    set on_state = case when excluded.at > ticks.at then excluded.on_state else ticks.on_state end,
        at       = greatest(excluded.at, ticks.at);
$$;

create or replace function public.push_hours(p jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.hours (profile, day, hours, at)
  select 'owner', key, (value->>'h')::numeric, (value->>'at')::bigint
  from jsonb_each(p)
  where (value->>'at') is not null
  on conflict (profile, day) do update
    set hours = case when excluded.at > hours.at then excluded.hours else hours.hours end,
        at    = greatest(excluded.at, hours.at);
$$;

create index if not exists ticks_at_idx on public.ticks (at);
create index if not exists hours_at_idx on public.hours (at);

insert into public.meta (profile) values ('owner') on conflict (profile) do nothing;
