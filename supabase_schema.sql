create table if not exists sanabase_brain (
  id text primary key,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table sanabase_brain enable row level security;

create policy "sanabase brain public sync"
on sanabase_brain
for all
to anon
using (true)
with check (true);
