# SanaBase Data Safety Audit

Күні: 2026-07-03

Мақсат: SanaBase ішіндегі деректер жоғалып кетпеуі үшін қазіргі localStorage, Backup Center және Cloud Sync coverage жағдайын тексеру. Бұл файл audit documentation ретінде басталды, кейін бірінші safety MVP implementation нәтижесімен толықтырылды.

Implementation update: audit-тен кейін бірінші safety MVP қосылды. Backup import алдында және Cloud load алдында automatic emergency backup жасалады. Сонымен бірге `sanabase-safety-meta` ішінде соңғы local save, backup export, emergency backup, cloud save/load уақыттарын сақтау басталды.

## 1. Current Storage Architecture

SanaBase қазір browser `localStorage` арқылы offline-first режимде жұмыс істейді. Негізгі толық state бір key ішінде сақталады:

- `sanabase-state` - негізгі app state. Ішінде `docs`, `tasks`, `images`, `calendarOS`, `notes`, `noteFolders`, `goals`, `projects`, `plans`, `challenges`, `oneC`, `crmReports`, `cfo` бар.

Қосымша backward-compatible / legacy mirror key-лер де жазылады:

- `goals` - мақсаттар mirror.
- `projects` - проекттер mirror.
- `challenges` - челлендждер mirror.
- `zhadyra_goals` - мақсаттар mirror.
- `zhadyra_projects` - проекттер mirror.
- `zhadyra_plans` - жоспарлар mirror.
- `zhadyra_tasks` - тапсырмалар mirror.
- `zhadyra_habits` - календарь/әдеттер mirror.
- `zhadyra_challenges` - челлендждер mirror.
- `zhadyra_1c_excel` - 1C Excel analyzer state mirror.
- `zhadyra_crm_reports` - CRM report archive mirror.
- `zhadyra_cfo` - CFO / бухгалтерия state mirror.

Cloud және reminder metadata:

- `sanabase-cloud` - legacy/manual cloud config metadata.
- `sanabase-reminders-enabled` - reminder/notification қосылғанын сақтайды.
- `sanabot-*` prefix - Mimo/SanaBot daily nudge сияқты assistant metadata.
- `sanabase-*` prefix - app-specific metadata және future safe keys.
- `zhadyra_*` prefix - legacy/mirror деректер.

Notes / жазбалар:

- Негізгі жазбалар `sanabase-state.notes` ішінде.
- Notes папкалары `sanabase-state.noteFolders` ішінде.
- Notes бөлек `notes` деген standalone key-ге жазылмайды.

CRM:

- CRM Clients / Schools, orders, payments, documents, suppliers, calendar tasks `sanabase-state.calendarOS` ішінде.
- Нақты ішкі массивтер: `calendarOS.clients`, `calendarOS.orders`, `calendarOS.payments`, `calendarOS.documents`, `calendarOS.suppliers`, `calendarOS.tasks`, `calendarOS.history_logs`.

Tasks:

- Trello-style main tasks `sanabase-state.tasks` ішінде.
- Calendar OS task entities `sanabase-state.calendarOS.tasks` ішінде.
- Mirror ретінде `zhadyra_tasks` жазылады.

Goals / Projects / Plans:

- `sanabase-state.goals`, `sanabase-state.projects`, `sanabase-state.plans`.
- Mirror ретінде `goals`, `projects`, `zhadyra_goals`, `zhadyra_projects`, `zhadyra_plans`.

## 2. Backup Center Coverage

Backup Center `backupKeyList()` арқылы key жинайды.

Exact key list:

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

Қосымша coverage:

- localStorage ішіндегі кез келген `sanabase-` prefix key.
- localStorage ішіндегі кез келген `zhadyra_` prefix key.
- localStorage ішіндегі кез келген `sanabot-` prefix key.

Export format:

- `metadata.app = "SanaBase"`
- `metadata.version = BACKUP_VERSION`
- `metadata.exportedAt`
- `metadata.keys`
- `data[key] = localStorage.getItem(key)`

Notes export ішіне кіре ме:

- Иә, егер `sanabase-state` бар болса, `notes` және `noteFolders` сол key ішінде export болады.

CRM / tasks / goals / orders export ішіне кіре ме:

- CRM clients/orders/payments/documents `sanabase-state.calendarOS` арқылы кіреді.
- Main tasks `sanabase-state.tasks` арқылы кіреді және mirror `zhadyra_tasks` арқылы да кіреді.
- Goals/projects/plans `sanabase-state` арқылы кіреді, goals/projects/challenges standalone mirror арқылы да кіреді.
- Orders `sanabase-state.calendarOS.orders` арқылы кіреді.

Missing болуы мүмкін key-лер:

- Егер болашақта plain `plans`, `tasks`, `notes`, `images`, `calendarOS` сияқты prefix жоқ standalone key жасалса, current Backup Center оларды exact list арқылы алмайды.
- Қазір runtime бұл plain key-лерді негізгі сақтау үшін қолданбайды, сондықтан current risk төмен.
- `BACKUP_VERSION` қазіргі кодта `20260702-16`, ал frontend cache version бөлек. Бұл data format version ретінде бөлек болуы мүмкін, бірақ user-facing audit үшін шатастыруы мүмкін.

## 3. Cloud Sync Coverage

Cloud Sync `public/js/cloudSync.js` ішінде жұмыс істейді.

Cloud table:

- `sanabase_cloud_state`
- `workspace_id = "default"`
- `payloadVersion = 1`

`collectLocalData()`:

- `getLocalKeys()` арқылы Backup Center-ге өте ұқсас key жинайды.
- Exact key list Backup Center exact list-пен бірдей.
- Prefix coverage: `sanabase-`, `zhadyra_`, `sanabot-`.
- Payload ішіне `_metadata` қосады: `app`, `payloadVersion`, `workspaceId`, `exportedAt`.

`restoreLocalData(payload)`:

- `_metadata` key-ін өткізіп жібереді.
- Restore рұқсат етілетін key-лер:
  - `sanabase-` prefix
  - `zhadyra_` prefix
  - `sanabot-` prefix
  - standalone `goals`
  - standalone `projects`
  - standalone `challenges`
- `value === null || undefined` болса key remove болады, әйтпесе `localStorage.setItem(key, String(value))`.
- Restore соңында `window.SanaAppBridge.reloadFromLocalStorage()` шақырады.

Notes cloud payload ішіне кіре ме:

- Иә, `sanabase-state` payload ішінде болса, `notes` және `noteFolders` соның ішінде cloud-қа кетеді.

Cloud payload backup export-пен бірдей ме:

- Негізгі key coverage бірдейге өте жақын.
- Айырмашылық:
  - Backup payload format: `{ metadata, data }`.
  - Cloud payload format: `{ key: value, _metadata }`.
  - Backup restore тек `metadata.keys` ішіндегі key-лерді restore етеді.
  - Cloud restore prefix/standalone whitelist арқылы restore етеді.
  - Cloud payload ішінде `_metadata` бар, Backup data ішінде `_metadata` key жоқ.

## 4. Import / Restore Risk

Backup import алдында:

- User confirmation бар: `confirm(...)`.
- Backup structure validation бар: `isValidBackupPayload(...)`.
- Audit кезінде automatic emergency backup жоқ еді. Кейінгі safety MVP-де import алдында emergency backup қосылды.

Cloud load алдында:

- User confirmation бар: `confirm(...)`.
- Cloud row жоқ болса restore жасамайды.
- Audit кезінде automatic emergency backup жоқ еді. Кейінгі safety MVP-де cloud load алдында emergency backup қосылды.

Overwrite risk:

- Backup import selected key-лерді overwrite/remove жасайды.
- Cloud load cloud payload ішіндегі allowed key-лерді overwrite/remove жасайды.
- Екі жерде де user confirmation бар, бірақ user қате файл немесе ескі cloud таңдаса, local деректер ауысуы мүмкін.

## 5. Data Loss Scenarios

Browser data тазаланса:

- `localStorage` толық кетеді.
- Backup JSON немесе Cloud Sync болмаса деректі қайтару қиын.

Басқа device ашылса:

- Басқа device-де localStorage бөлек болады.
- Cloud Sync sign in + save/load жасалмаса деректер көрінбейді.

Old cloud load басылса:

- Егер cloud payload ескі болса, local жаңа деректі overwrite етуі мүмкін.
- Қазіргі MVP conflict warning бар, бірақ load алдында emergency backup жоқ.

Wrong backup import жасалса:

- User confirm басса, backup ішіндегі key-лер localStorage-ты ауыстырады.
- Emergency backup жоқ болғандықтан қайтару қиын болуы мүмкін.

GitHub Pages path/cache өзгерсе:

- Бір origin/path localStorage-ы басқа path-пен кейде бөлек көрінуі мүмкін.
- Cache ескі JS жүктесе, жаңа state migration/feature көрінбеуі мүмкін.

Incognito/private mode қолданылса:

- localStorage уақытша болуы мүмкін.
- Browser жабылған соң деректер жоғалуы мүмкін.

## 6. Safety Gaps

Жетісіп тұрған қауіпсіздік:

- Export all data бар.
- Import алдында confirm бар.
- Cloud load алдында confirm бар.
- Backup және Cloud key coverage notes/CRM/tasks/goals үшін негізінен толық.
- Runtime негізгі деректі `sanabase-state` ішіне біріктіріп сақтайды.

Жетіспейтін қауіпсіздік:

- Import backup алдында automatic emergency backup енді қосылды.
- Load from cloud алдында automatic emergency backup енді қосылды.
- Last local save time `sanabase-safety-meta.lastLocalSaveAt` ретінде сақталады.
- Last cloud save/load time `sanabase-safety-meta.lastCloudSaveAt` және `sanabase-safety-meta.lastCloudLoadAt` ретінде сақталады.
- Last backup export time `sanabase-safety-meta.lastBackupExportAt` ретінде сақталады.
- Notes included integrity check жоқ.
- Backup export integrity check жоқ.
- Cloud/local newer comparison бар, бірақ auto merge жоқ және user-ге нақты "local newer/cloud newer" decision UI әлі шектеулі.
- Wrong backup import немесе old cloud load кезінде rollback file автоматты жасалмайды.

Notes жоғалу risk:

- Current storage бойынша notes `sanabase-state.notes` ішінде сақталады және backup/cloud coverage ішіне кіреді.
- Risk көбіне user browser data clear, private mode, old cloud load, wrong backup import кезінде.

Sync conflict risk:

- Иә, бар. Екі device-де бөлек өзгеріс жасалып, біреуінен old cloud load басылса, соңғы local дерек overwrite болуы мүмкін.

Cloud/local newer comparison:

- `compareLocalCloud()` бар, бірақ local updated ретінде `collectLocalData()._metadata.exportedAt` қолданылады. Бұл нақты last local save емес, салыстыру сәтіндегі timestamp болуы мүмкін. Сондықтан conflict comparison толық сенімді емес.

## 7. Recommended Implementation Plan

Келесі этапта қосылатын нақты safety функциялар:

1. `createEmergencyBackup(reason)` қосу.
   - Import backup алдында automatic JSON download.
   - Cloud load алдында automatic JSON download.
   - Filename: `sanabase-emergency-before-import-YYYY-MM-DD-HH-mm.json` немесе `sanabase-emergency-before-cloud-load-YYYY-MM-DD-HH-mm.json`.

2. Safety metadata key қосу:
   - `sanabase-safety-meta`
   - `lastLocalSaveAt`
   - `lastCloudSaveAt`
   - `lastCloudLoadAt`
   - `lastBackupExportAt`
   - `lastEmergencyBackupAt`

3. `persist()` ішінде `lastLocalSaveAt` update жасау.

4. Backup Center export соңында `lastBackupExportAt` update жасау.

5. Cloud save/load соңында:
   - save: `lastCloudSaveAt`
   - load: `lastCloudLoadAt`

6. Backup reminder:
   - Егер `lastBackupExportAt` 7 күннен ескі болса, Mimo/Backup Center ескерту көрсетсін.

7. Cloud sync reminder:
   - Егер `lastCloudSaveAt` 24-48 сағаттан ескі болса, Cloud Sync panel ескерту көрсетсін.

8. Notes included check:
   - Export алдында `sanabase-state` parse жасап, `notes` және `noteFolders` array екенін тексеру.
   - Status message: "Notes included: X жазба, Y папка".

9. Export integrity check:
   - Backup JSON build болған соң `metadata.keys` және `data` сәйкестігін тексеру.
   - `sanabase-state` parseable екенін тексеру.
   - Қате болса export-ты тоқтатып, user-ге warning беру.

10. Cloud load conflict prompt жақсарту:
   - Local newer / Cloud newer / Unknown нақты көрсетілсін.
   - Buttons: `Upload local`, `Download cloud`, `Cancel`.
   - `Download cloud` алдында emergency backup mandatory.

## 8. Acceptance Checklist

- Notes refresh кейін сақталады.
- Notes backup export ішінде бар.
- Notes cloud payload ішінде бар.
- Import алдында emergency backup жасалады.
- Load from cloud алдында emergency backup жасалады.
- No automatic delete.
- No automatic overwrite without confirm.
- Console error жоқ.

## Қысқа қорытынды

Current state бойынша ең маңызды деректердің көпшілігі `sanabase-state` ішінде сақталады. Backup Center және Cloud Sync осы key-ді жинайды, сондықтан notes, CRM, tasks, goals, projects, plans жалпы coverage ішінде. Ең үлкен қауіп - overwrite алдында automatic emergency backup жоқ болуы және cloud/local timestamp comparison толық нақты last local save уақытына сүйенбеуі.
