-- SanaBase Cloud Sync MVP schema.
-- Run this in Supabase SQL Editor after enabling Supabase Auth.
--
-- Security notes:
-- - Never put the service_role key in frontend code, GitHub Pages, or localStorage.
-- - The public anon key is acceptable in frontend only when Row Level Security
--   policies strictly limit access to auth.uid().
-- - This schema does not add any anon public all policy.

create extension if not exists pgcrypto;

create table if not exists public.sanabase_cloud_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id text not null default 'default',
  payload jsonb not null default '{}'::jsonb,
  local_keys jsonb not null default '[]'::jsonb,
  device_label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, workspace_id)
);

create index if not exists sanabase_cloud_state_user_idx
on public.sanabase_cloud_state (user_id);

create index if not exists sanabase_cloud_state_workspace_idx
on public.sanabase_cloud_state (workspace_id);

alter table public.sanabase_cloud_state enable row level security;

drop policy if exists "sanabase cloud select own row" on public.sanabase_cloud_state;
drop policy if exists "sanabase cloud insert own row" on public.sanabase_cloud_state;
drop policy if exists "sanabase cloud update own row" on public.sanabase_cloud_state;
drop policy if exists "sanabase cloud delete own row" on public.sanabase_cloud_state;

create policy "sanabase cloud select own row"
on public.sanabase_cloud_state
for select
to authenticated
using (user_id = auth.uid());

create policy "sanabase cloud insert own row"
on public.sanabase_cloud_state
for insert
to authenticated
with check (user_id = auth.uid());

create policy "sanabase cloud update own row"
on public.sanabase_cloud_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "sanabase cloud delete own row"
on public.sanabase_cloud_state
for delete
to authenticated
using (user_id = auth.uid());
