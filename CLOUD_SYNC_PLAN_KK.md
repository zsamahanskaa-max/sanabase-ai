# SanaBase Cloud Sync жоспары

Бұл құжат SanaBase деректерін ноутбук пен телефон арасында қауіпсіз синхрондау үшін analysis және MVP architecture жоспары. Бұл қадамда runtime code өзгермейді.

## 1. Қазіргі сақтау архитектурасы

SanaBase қазір browser `localStorage` арқылы жұмыс істейді. Негізгі state `sanabase-state` ішінде сақталады, ал backward compatibility үшін бірнеше жеке key де қатар жазылады.

Негізгі helper:
- `public/js/storage.js`: `getItem`, `setItem`, `removeItem`, `readJson`, `writeJson`.
- `public/app.js`: `loadState()` және `persist()`.

Негізгі load логикасы:
- `loadState()` `sanabase-state` оқиды.
- Кейбір ескі key-лерден fallback оқиды: `goals`, `projects`, `zhadyra_goals`, `zhadyra_projects`, `zhadyra_plans`, `challenges`, `zhadyra_challenges`, `zhadyra_1c_excel`, `zhadyra_crm_reports`, `zhadyra_cfo`.

Негізгі save логикасы:
- `persist()` толық `state` объектісін `sanabase-state` ішіне жазады.
- Сонымен бірге compatibility key-лерге бөлек жазады.
- `persist({ sync: false })` cloud push-ты өшіру үшін қолданылады.

Қазіргі cloud logic:
- `sanabase-cloud` ішінде Supabase URL/key/workspace config сақталады.
- `pushCloud()` / `pullCloud()` қазір `sanabase_brain` table-мен жұмыс істейді.
- Қазіргі schema development mode үшін `anon all true` policy қолданады. Бұл production үшін қауіпсіз емес.

## 2. Табылған localStorage key-лер

`persist()` жазатын key-лер:
- `sanabase-state`
- `goals`
- `projects`
- `challenges`
- `zhadyra_goals`
- `zhadyra_projects`
- `zhadyra_plans`
- `zhadyra_tasks`
- `zhadyra_habits`
- `zhadyra_challenges`
- `zhadyra_1c_excel`
- `zhadyra_crm_reports`
- `zhadyra_cfo`

Backup Center export/import қамтитын exact key-лер:
- `sanabase-state`
- `sanabase-cloud`
- `sanabase-reminders-enabled`
- `goals`
- `projects`
- `challenges`
- `zhadyra_goals`
- `zhadyra_projects`
- `zhadyra_plans`
- `zhadyra_tasks`
- `zhadyra_habits`
- `zhadyra_challenges`
- `zhadyra_1c_excel`
- `zhadyra_crm_reports`
- `zhadyra_cfo`

Backup Center қосымша автоматты түрде мыналарды да алады:
- `sanabase-*` prefix-пен басталатын барлық key.
- `zhadyra_` prefix-пен басталатын барлық key.
- `sanabot-` prefix-пен басталатын барлық key.

Reminder/notification key-лер:
- `sanabase-reminders-enabled`
- `sanabase-reminder-sent-YYYY-MM-DD`

Cloud config key:
- `sanabase-cloud`

## 3. Sync болуы керек деректер map

Бірінші Cloud Sync MVP үшін негізгі source of truth ретінде `sanabase-state` payload қолданған дұрыс.

Payload ішінде sync болатын деректер:
- `calendarOS.clients`: Clients / Schools CRM.
- `calendarOS.orders`: CRM orders, pipeline status, client link.
- `calendarOS.payments`: payments/cash flow.
- `calendarOS.tasks`: Calendar OS ішіндегі task/order task/reminder task.
- `tasks`: негізгі Tasks / checklist.
- `goals`: goals.
- `projects`: projects.
- `plans`: plans.
- `challenges`: habits/challenges style progress.
- `docs`: imported documents metadata.
- `images`: Brain images metadata/base64 first MVP.
- `notes`: notes/second brain notes.
- `oneC`: 1C Excel analyzer state.
- `crmReports`: CRM reports.
- `cfo`: CFO / AI Бас Бухгалтер module state.
- `calendarOS.settings`: UI/calendar settings.

Sync-ке кіргізбеу немесе бөлек қарау керек:
- `sanabase-cloud`: device-level connection config. Мұны cloud payload ішіне sync жасамаған дұрыс, себебі key/session әр browser-де бөлек болуы керек.
- `sanabase-reminders-enabled`: device preference. Телефон мен ноутбукта бөлек болуы мүмкін.
- `sanabase-reminder-sent-*`: notification sent history. Бұл cloud sync үшін міндетті емес.

## 4. Supabase Cloud Sync MVP architecture

Ең қауіпсіз бірінші MVP:

1. Supabase Auth қосу.
   - Email magic link немесе email/password.
   - User login болмай cloud sync қосылмайды.

2. Бір workspace row сақтау.
   - MVP-де `workspace_id = default` болады.
   - Кейін team/workspace керек болса, `workspace_id` app-generated uuid-қа көшіріледі.

3. Бір table арқылы толық JSON payload сақтау.
   - Table: `sanabase_cloud_state`.
   - `payload jsonb` ішінде барлық SanaBase state сақталады.
   - Бұл current localStorage architecture-ға ең аз өзгеріс жасайды.

4. Save behavior:
   - Local save бұрынғыдай бірден жүреді.
   - Cloud save қосымша debounce арқылы жүреді.
   - Cloud error болса app тоқтамайды, localStorage сақтала береді.

5. Pull behavior:
   - Login кейін cloud row бар ма тексеріледі.
   - Local және cloud `updated_at` салыстырылады.
   - Conflict болса user таңдайды: `Upload local`, `Download cloud`, `Cancel`.

## 5. Supabase table draft

```sql
create table if not exists sanabase_cloud_state (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  payload_version integer not null default 1,
  device_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, owner_id)
);

create index if not exists sanabase_cloud_state_owner_idx
on sanabase_cloud_state (owner_id);

create index if not exists sanabase_cloud_state_workspace_idx
on sanabase_cloud_state (workspace_id);
```

Optional кейінгі table:

```sql
create table if not exists sanabase_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'SanaBase',
  created_at timestamptz not null default now()
);

create table if not exists sanabase_workspace_members (
  workspace_id uuid not null references sanabase_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
```

## 6. RLS қауіпсіз policy draft

Development policy `anon all true` қолданбау керек. Production үшін тек authenticated user өз row-ын ғана көрсін.

```sql
alter table sanabase_cloud_state enable row level security;

create policy "sanabase cloud owner select"
on sanabase_cloud_state
for select
to authenticated
using (owner_id = auth.uid());

create policy "sanabase cloud owner insert"
on sanabase_cloud_state
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "sanabase cloud owner update"
on sanabase_cloud_state
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "sanabase cloud owner delete"
on sanabase_cloud_state
for delete
to authenticated
using (owner_id = auth.uid());
```

Team/workspace access керек болса:

```sql
using (
  exists (
    select 1
    from sanabase_workspace_members m
    where m.workspace_id = sanabase_cloud_state.workspace_id
      and m.user_id = auth.uid()
  )
)
```

## 7. Offline/localStorage fallback plan

Cloud Sync localStorage-ты алмастырмайды, үстінен қосылады.

1. `persist()` бұрынғыдай localStorage-қа жаза береді.
2. Cloud enabled және user authenticated болса ғана `scheduleCloudPush()` cloud-қа жібереді.
3. Internet жоқ болса:
   - local save сақталады.
   - UI status: "Offline: local saved, cloud pending".
   - Келесі online/pull/push кезінде sync қайталанады.
4. Conflict жағдайы:
   - Local `lastSavedAt` және cloud `updated_at` салыстырылады.
   - Local newer болса: user-ге `Upload local` ұсынылады.
   - Cloud newer болса: user-ге `Download cloud` ұсынылады.
   - Екі жақта да өзгеріс болса: user нақты таңдайды:
     - `Upload local`: осы құрылғыдағы localStorage state cloud-қа жазылады.
     - `Download cloud`: cloud state осы browser-ге түсіріледі.
     - `Cancel`: ештеңе өзгермейді, user Backup Center арқылы сақтық export жасай алады.
5. First MVP-де automatic deep merge жасамау қауіпсіз.
6. Backup Center қалуы керек. Ол cloud sync алдында safety net болады.

## 8. Қауіптер

- `payload jsonb` өте үлкейсе, әсіресе Brain images base64 көп болса, Supabase row ауыр болады.
- Бір JSON row бүкіл app state-ті сақтайды, сондықтан conflict resolution маңызды.
- `anon key` браузерде public болады. Сондықтан RLS міндетті.
- `sanabase-cloud` ішіндегі anon key-ді Backup Center export қазір алып кетуі мүмкін. Cloud Auth енгізілгенде session/config backup саясатын бөлек қарау керек.
- Телефонда clipboard, notification permission, file import desktop-пен бірдей жұмыс істемеуі мүмкін.
- Current `sanabase_brain` public sync schema production үшін unsafe. Оны жаңа safe table-ге көшіру керек.

## 9. Келесі exact safe code step

Келесі қадамда runtime-ды үлкен өзгертпей, тек Cloud Sync module skeleton қосу:

1. `public/js/cloudSync.js` жасау.
2. Онда тек helper skeleton болсын:
   - `getCloudSession()`
   - `buildCloudPayload(state)`
   - `compareCloudState(localMeta, cloudMeta)`
   - `safeCloudStatus(message)`
3. `public/index.html` және root `index.html` script order-ға `cloudSync.js` app.js-тен бұрын қосу.
4. `app.js` behavior өзгертпеу немесе тек optional `window.SanaCloudSync` бар-жоғын тексеру.
5. Supabase Auth UI-ды әлі қоспау.
6. `node --check` және HTTP asset check жасау.

Одан кейін ғана Auth login panel және safe `sanabase_cloud_state` push/pull қосылады.
