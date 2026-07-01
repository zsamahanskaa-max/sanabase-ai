create table if not exists sanabase_brain (
  id text primary key,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table sanabase_brain enable row level security;

-- DEVELOPMENT ONLY:
-- This policy lets anonymous clients read and write every workspace row.
-- It is useful for the current static GitHub Pages/localStorage sync MVP,
-- but it is unsafe for production because anyone with the public anon key
-- can read, overwrite, or delete data for any workspace_id.
create policy "sanabase brain public sync"
on sanabase_brain
for all
to anon
using (true)
with check (true);

-- PRODUCTION RLS PROPOSAL:
-- 1. Add authenticated user ownership to each workspace row, for example:
--      alter table sanabase_brain add column owner_id uuid references auth.users(id);
--      create index on sanabase_brain (workspace_id, owner_id);
-- 2. Remove the development policy above:
--      drop policy if exists "sanabase brain public sync" on sanabase_brain;
-- 3. Allow only authenticated users to access their own workspace rows:
--      create policy "sanabase brain owner select"
--      on sanabase_brain for select to authenticated
--      using (owner_id = auth.uid());
--
--      create policy "sanabase brain owner insert"
--      on sanabase_brain for insert to authenticated
--      with check (owner_id = auth.uid());
--
--      create policy "sanabase brain owner update"
--      on sanabase_brain for update to authenticated
--      using (owner_id = auth.uid())
--      with check (owner_id = auth.uid());
--
--      create policy "sanabase brain owner delete"
--      on sanabase_brain for delete to authenticated
--      using (owner_id = auth.uid());
-- 4. For teams, use a separate workspace_members table:
--      workspace_id text, user_id uuid, role text
--    Then RLS should check exists(...) membership instead of only owner_id.
