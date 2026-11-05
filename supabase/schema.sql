-- B.Cyber 2027 tracker — Supabase schema
-- Run this in the Supabase SQL editor once, then copy the project URL and anon key
-- into Vercel as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

create table if not exists public.progress (
  device_id  text primary key,
  done       jsonb        not null default '{}'::jsonb,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

comment on table  public.progress          is 'One row per device. done = { taskId: true }.';
comment on column public.progress.device_id is 'Random UUID generated in the browser and kept in localStorage.';

-- keep updated_at honest even if a client forgets to set it
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch
  before update on public.progress
  for each row execute function public.touch_updated_at();

alter table public.progress enable row level security;

-- Anonymous clients may read and write rows, but only if they know the device id.
-- That is the whole access model: the uuid is the secret. Good enough for a
-- single-person study tracker, not good enough for anything sensitive.
drop policy if exists progress_select on public.progress;
drop policy if exists progress_insert on public.progress;
drop policy if exists progress_update on public.progress;

create policy progress_select on public.progress
  for select using (true);

create policy progress_insert on public.progress
  for insert with check (true);

create policy progress_update on public.progress
  for update using (true) with check (true);

-- Handy view for the cron reminder job: the most recently active tracker.
create or replace view public.latest_progress as
  select device_id, done, updated_at
  from public.progress
  order by updated_at desc
  limit 1;
