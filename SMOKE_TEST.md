# SanaBase smoke test

Run the local server:

```bash
node server.js
```

Open:

```text
http://localhost:5173/
```

## Latest automated smoke result

Date: 2026-07-01

Local asset checks passed:

```text
local root=200 app=200 utils=200
```

GitHub Pages cache updated to `20260701-13`. The live HTML now loads the modular helper scripts in this order:

```text
public/js/utils.js?v=20260701-13
public/js/storage.js?v=20260701-13
public/js/api.js?v=20260701-13
public/js/spreadsheet.js?v=20260701-13
public/js/documents.js?v=20260701-13
public/js/priceMatching.js?v=20260701-13
public/app.js?v=20260701-13
```

Live GitHub Pages asset URLs returned `200`:

```text
200 https://zsamahanskaa-max.github.io/sanabase-ai/?smoke=20260701-13c
200 https://zsamahanskaa-max.github.io/sanabase-ai/public/js/utils.js?v=20260701-13
200 https://zsamahanskaa-max.github.io/sanabase-ai/public/js/priceMatching.js?v=20260701-13
200 https://zsamahanskaa-max.github.io/sanabase-ai/public/app.js?v=20260701-13
```

Important limitation:

GitHub Pages is static hosting. Backend API routes like `/api/ai` and `/api/import` may not work there. Use the local Node server or a Render/Vercel backend for full backend behavior.

Cache version note:

All frontend asset query versions were unified to `20260701-14` for `manifest.json`, `styles.css`, helper modules, and `app.js`.

Clients / Schools CRM note:

Frontend asset query versions were updated to `20260701-16`. Manual checks to run:

- Clients / Schools section is visible.
- `crmClientSearch` filters by client, school, BIN, phone, WhatsApp, and address.
- `crmClientStatusFilter` switches between active, archived, and all.
- Duplicate BIN warning appears in `crmClientOut` but does not block save.
- Existing CRM quick order save still works.

Clients / Schools edit/archive note:

Frontend asset query versions were updated to `20260702-01`. Manual checks to run:

- Create a client card.
- Edit the same client card and confirm it updates instead of creating a duplicate.
- Archive the card and confirm it disappears from active.
- Switch filter to archived and confirm the card appears.
- Restore the card and confirm it returns to active.
- Refresh the browser and confirm the saved client state remains.
- Existing CRM quick order save still works.

Clients / Schools mini CRM note:

Frontend asset query versions were updated to `20260702-02`. Manual checks to run:

- Click `Orders` on a client card and confirm related CRM orders appear in `crmClientOut`.
- Click `Debts` and confirm open debt total appears.
- Click `WhatsApp` and confirm a ready debt/follow-up message appears.
- Confirm these actions do not create, edit, archive, or delete client records.
- Existing CRM quick order save still works.

Clients / Schools mini CRM panel note:

Frontend asset query versions were updated to `20260702-03`. Manual checks to run:

- `Orders`, `Debts`, and `WhatsApp` open the mini CRM panel under the client cards.
- The mini panel shows KPI chips and wrapped text.
- `WhatsApp` shows `Copy text`.
- Clicking `Copy text` copies the prepared WhatsApp message and shows `Text copied.`
- Existing edit/archive/restore and CRM quick order save still work.

Clients / Schools task/reminder note:

Frontend asset query versions were updated to `20260702-04`. Manual checks to run:

- Open `Orders`, `Debts`, or `WhatsApp` from a client card.
- Click `Task жасау` and confirm a new CRM task appears in Tasks.
- Click `Reminder жасау` and confirm a calendar reminder is created for tomorrow.
- Confirm these actions do not archive, restore, or hard-delete client records.

Clients / Schools open saved items note:

Frontend asset query versions were updated to `20260702-05`. Manual checks to run:

- After `Task жасау`, click `Tasks ашу` and confirm the app opens Tasks.
- After `Reminder жасау`, click `Calendar ашу` and confirm the app opens Zhadyra Calendar OS.
- Confirm task/reminder status text explains where the item was saved.

## 1. Utility load check

Open browser DevTools Console and run:

```js
window.SanaUtils &&
typeof window.SanaUtils.isoDate === "function" &&
typeof window.SanaUtils.money === "function"
```

Expected result:

```text
true
```

Then check storage helpers:

```js
window.SanaStorage &&
typeof window.SanaStorage.readJson === "function" &&
typeof window.SanaStorage.writeJson === "function"
```

Expected result:

```text
true
```

Then check API helpers:

```js
window.SanaApi &&
typeof window.SanaApi.ai === "function" &&
typeof window.SanaApi.importFile === "function"
```

Expected result:

```text
true
```

Then check document helpers:

```js
window.SanaDocuments &&
typeof window.SanaDocuments.extractFile === "function" &&
typeof window.SanaDocuments.browserImport === "function"
```

Expected result:

```text
true
```

Then check spreadsheet helpers:

```js
window.SanaSpreadsheet &&
typeof window.SanaSpreadsheet.readTableFile === "function" &&
typeof window.readTableFile === "function"
```

Expected result:

```text
true
```

Then check price matching helpers:

```js
window.SanaPriceMatching &&
typeof window.SanaPriceMatching.hasFormula === "function" &&
typeof window.SanaPriceMatching.downloadWorkbook === "function"
```

Expected result:

```text
true
```

## 2. CRM quick save

1. Open the CRM section.
2. Fill the quick deal/order form with a small test order.
3. Save it.
4. Confirm the new row appears in the CRM operating panel.
5. Confirm total, paid, and debt values render without console errors.
6. Confirm the Clients / Schools section is visible.
7. Save a simple Clients / Schools card.
8. Confirm the new client card appears in the Clients / Schools list.
9. Confirm the existing CRM quick save still works after the new section appears.
10. Confirm no browser Console error appears.

## 3. Task add

1. Open Tasks / Тапсырмалар.
2. Add a task with a multi-line checklist, for example:

```text
Магазинге бару
- нан алу
- сүт алу
- чек алу
```

3. Confirm the card appears.
4. Click the checklist items or full view button.
5. Confirm the task stays saved after refresh.

## 4. CFO auto report

1. Open Sana CFO / AI Бас Бухгалтер.
2. Click the auto report button.
3. Confirm the report text appears.
4. Confirm KPI cards still render.

## 5. Import file

1. Open document import / knowledge base.
2. Upload a small `.txt`, `.csv`, `.xlsx`, `.docx`, or `.pdf` test file.
3. Confirm the document appears in the list or Brain/knowledge base.
4. Confirm the page does not show a JavaScript console error.

## 6. AI chat fallback

1. Keep `OPENAI_API_KEY` empty or unavailable.
2. Open AI chat.
3. Ask a simple question.
4. Confirm a local fallback answer appears instead of a broken request.

## 7. Manual browser checklist still required

- CRM quick save
- Clients / Schools section visible
- Clients / Schools card save
- Tasks add
- CFO auto report
- Excel document import
- Price matching
- AI chat fallback

## 8. Backup Center

Frontend asset query versions were updated to `20260702-06`. Manual checks to run:

1. Open Backup Center.
2. Click `Export all data`.
3. Confirm `sanabase-backup-YYYY-MM-DD.json` downloads.
4. Choose that JSON file in `Choose backup JSON`.
5. Click `Import backup`.
6. Confirm the restore prompt appears before overwrite.
7. Confirm import status appears after approval.
8. Refresh the page after import.
9. Confirm CRM clients are still saved.
10. Confirm Tasks are still saved.
11. Confirm Goals are still saved.
12. Confirm no browser Console error appears.

## 9. Clients / Schools Profile Modal

Frontend asset query versions were updated to `20260702-07`. Manual checks to run:

1. Open CRM -> Clients / Schools.
2. Create or find a client card.
3. Click `Profile`.
4. Confirm modal `crmClientProfileModal` opens.
5. Check tabs: Overview, Orders, Debts, WhatsApp, Tasks, Notes.
6. Confirm Overview shows clientName, schoolName, BIN, phone, whatsapp, address, paymentTerms, debtLimit, comment.
7. Confirm Orders uses clientName/schoolName fallback matching.
8. Confirm Debts shows totalAmount, paidAmount, debtAmount, debt order count.
9. Open WhatsApp tab and copy one draft.
10. Open Tasks tab and create a client task.
11. Close the modal.
12. Confirm existing CRM quick order save still works.
13. Confirm Backup Center still opens.

## 10. Client persistence and Brain image batch save

Frontend asset query versions were updated to `20260702-08`. Manual checks to run:

1. Open CRM -> Clients / Schools.
2. Add a new client card.
3. Confirm `localStorage saved clients` appears in `crmClientOut`.
4. Press Ctrl+R / refresh the browser.
5. Confirm the client card is still visible.
6. Edit the client, refresh again, and confirm changes stay saved.
7. Open Brain / Екінші ми.
8. Select a folder and tags for images.
9. Upload many images at once.
10. Confirm progress text appears.
11. Refresh the page.
12. Confirm saved images are still visible in Brain.
13. If browser storage is full, confirm skipped image names appear instead of breaking the app.

## 11. Clients edit, archive, restore, duplicate warning

Frontend asset query versions were updated to `20260702-09`. Manual checks to run:

1. Open CRM -> Clients / Schools.
2. Create a client card.
3. Click `Edit` and confirm the form is filled with that client data.
4. Change phone or comment and save.
5. Refresh the page and confirm the edited data stays saved.
6. Click `Archive` and confirm the card disappears from active filter.
7. Switch filter to `archived` and confirm the card appears.
8. Click `Restore` and confirm the card returns to active filter.
9. Create another client with the same BIN and confirm duplicate warning appears.
10. Create another client without BIN but with similar school/client name and confirm warning appears.
11. Confirm warning does not block save.
12. Open `Profile` and confirm Client Profile Modal still works.
13. Confirm Backup Center export/import still opens.
14. Confirm CRM quick order save still works.

## 12. CRM quick order optional client linking

Frontend asset query versions were updated to `20260702-10`. Manual checks to run:

1. Open CRM -> Clients / Schools.
2. Create an active client card.
3. In CRM quick order form, open `crmOrderClientSelect`.
4. Confirm active clients appear and archived clients do not appear by default.
5. Select a client and confirm `crmClientName` and `crmSchoolName` auto-fill.
6. Save a quick order with selected client.
7. Open that client's `Profile`.
8. Confirm Orders tab shows the linked order by `clientId`.
9. Confirm Debts tab totals update.
10. Save another quick order without selected client using manual clientName/schoolName.
11. Confirm old/manual orders still appear by fallback matching.
12. Confirm Backup Center export/import still works.
13. Confirm no browser Console error appears.

## 13. CRM quick order pipeline

Frontend asset query versions were updated to `20260702-11`. Manual checks to run:

1. Create a quick order with selected client.
2. Create a quick order without selected client.
3. Confirm new orders show pipeline status `Жаңа заказ`.
4. Click `Next status`.
5. Confirm the status moves to the next stage.
6. Refresh the page and confirm the new pipeline status stays saved.
7. Open Client Profile -> Orders and confirm pipeline status is visible.
8. Open Client Profile -> Debts and confirm debt calculation is unchanged.
9. Confirm old orders without `pipelineStatus` show default `Жаңа заказ`.
10. Confirm Backup Center export/import still opens.
11. Confirm no browser Console error appears.

## 14. CRM pipeline summary and Kanban

Frontend asset query versions were updated to `20260702-12`. Manual checks to run:

1. Create a quick order.
2. Confirm `crmPipelineSummary` shows count, totalAmount, and debtAmount by status.
3. Confirm the order card appears in the correct Kanban column.
4. Confirm the card shows orderNumber, client/school, productName, totalAmount, debtAmount, and pipeline status.
5. Click `Next status` inside the Kanban card.
6. Confirm the card moves to the next status column.
7. Confirm the summary count/total/debt updates.
8. Confirm CRM table is still visible.
9. Confirm Client Profile -> Orders status updates.
10. Confirm Backup Center export/import still works.
11. Confirm no browser Console error appears.

## 15. CRM order status action panel

Frontend asset query versions were updated to `20260702-13`. Manual checks to run:

1. Create a quick order.
2. Confirm the Kanban order card shows `Status action`.
3. Confirm the CRM table row shows `Actions`.
4. Open the action panel and confirm status-specific actions appear.
5. Use a WhatsApp copy action and confirm text is copied or visible in the panel.
6. Use a task action and confirm a CRM task is created.
7. Use a reminder action and confirm a CRM reminder/calendar event is created.
8. Click `Next status` and confirm the order still moves to the next column.
9. Confirm Client Profile -> Orders still opens and shows the order.
10. Confirm Backup Center export/import still works.
11. Confirm no browser Console error appears.

## 16. CRM order detail modal

Frontend asset query versions were updated to `20260702-14`. Manual checks to run:

1. Create a quick order.
2. Confirm the CRM table row shows `Details`.
3. Confirm the Kanban card shows `Details`.
4. Open Details from the table row.
5. Open Details from the Kanban card.
6. Switch tabs: Overview, Pipeline, Client, Payment, Tasks, WhatsApp, Notes.
7. Confirm Pipeline -> `Next status` still updates the order.
8. Confirm Pipeline -> `Status action` still opens the action panel.
9. Confirm Tasks -> `Create order task` creates a task.
10. Confirm WhatsApp copy buttons copy or report a copy fallback.
11. Confirm Client tab opens Client Profile when `clientId` exists.
12. Confirm Backup Center export/import still works.
13. Confirm no browser Console error appears.

## 17. Supabase Cloud Sync skeleton

Frontend asset query versions were updated to `20260702-15`. Manual checks to run:

1. Open the app locally.
2. Confirm `window.SanaCloudSync` exists in Console.
3. Confirm `window.SanaCloudSync.CLOUD_TABLE` is `sanabase_cloud_state`.
4. Confirm `window.SanaCloudSync.getLocalKeys()` returns SanaBase localStorage keys.
5. Confirm Backup Center export/import still opens.
6. Confirm existing Cloud panel buttons still render.
7. Confirm no browser Console error appears.

## 18. Supabase Cloud Sync MVP

Frontend asset query versions were updated to `20260702-16`. Manual checks to run:

1. Confirm Supabase JS CDN loads before `cloudSync.js`.
2. Confirm `window.SanaCloudSync` exports `signUp`, `signIn`, `signOut`, `saveToCloud`, and `loadFromCloud`.
3. If config is missing, confirm Cloud Sync panel shows `Not configured` and the app does not crash.
4. Set `window.SANABASE_SUPABASE_URL` and `window.SANABASE_SUPABASE_ANON_KEY`, then reload.
5. Sign up with email/password.
6. Sign in with email/password.
7. Create or edit one CRM client/order locally.
8. Click `Save to cloud`.
9. Open the app on another browser/device with the same config.
10. Sign in and click `Load from cloud`.
11. Confirm before restore, then confirm CRM client/order appears on the second device.
12. Confirm Backup Center export/import still works.
13. Confirm no browser Console error appears.

## 19. Supabase Cloud Sync configured

Frontend asset query versions were updated to `20260702-17`. Supabase frontend config was added with the project URL and publishable public key. Manual checks to run:

1. Open the app locally or on GitHub Pages.
2. Confirm Cloud Sync no longer says `Not configured`.
3. Sign up or sign in with email/password.
4. Create or edit one CRM client/order locally.
5. Click `Save to cloud`.
6. Open the app on phone or another browser.
7. Sign in with the same account and click `Load from cloud`.
8. Confirm before restore, then confirm CRM client/order appears.
9. Confirm Backup Center export/import still works.
10. Confirm no browser Console error appears.

GitHub Pages deploy note:

- A dedicated Pages workflow publishes only `index.html` and `public/`.
- Local files such as `.env.local`, `work/`, and backend server files are not included in the Pages artifact.
- `.nojekyll` is included so GitHub Pages serves static files exactly as uploaded.

## 20. Mobile Cloud Sync usability fix

Frontend asset query versions were updated to `20260703-01`. Manual checks to run:

1. Open the Brain / Екінші ми section on phone.
2. Confirm Cloud Sync shows Kazakh step-by-step text.
3. Confirm `Бұлтқа сақтау` and `Бұлттан алу` are disabled before sign in.
4. Enter email/password and sign in.
5. Confirm save/load buttons become enabled.
6. Confirm Mimo stays at the mobile bottom corner and does not cover Cloud Sync buttons.
7. Confirm no browser Console error appears.

## 21. Mobile Cloud Sync login error guidance

Frontend asset query versions were updated to `20260703-02`. Manual checks to run:

1. Open the Brain / Екінші ми section on phone.
2. Enter a wrong email/password and tap `Кіру`.
3. Confirm the error explains in Kazakh that email/password is wrong or the user should use `Тіркелу` first.
4. Confirm `Invalid login credentials` is not shown raw to the user.
5. Confirm no browser Console error appears.

## 22. Cloud Sync diagnostics

Frontend asset query versions were updated to `20260703-03`. Manual checks to run:

1. Open the Brain / Екінші ми section on phone and laptop.
2. Confirm the Cloud Sync helper text says email confirmation is not enough: after email link, enter the same email/password and tap `Кіру`.
3. Tap `Sync тексеру` before sign in and confirm diagnostics show account is not signed in.
4. Sign in with the same email/password.
5. Tap `Sync тексеру` and confirm it shows local key count and whether cloud data exists.
6. On the device that already has SanaBase data, tap `Бұлтқа сақтау`.
7. On the second device, sign in with the same account, tap `Sync тексеру`, then tap `Бұлттан алу`.
8. Confirm CRM clients/orders/tasks appear after restore.
9. Confirm Backup Center export/import still works.
10. Confirm no browser Console error appears.

## 23. Mimo v2 visual shell

Frontend asset query versions were updated to `20260703-04`. Manual checks to run:

1. Open the app on desktop and phone.
2. Confirm Mimo appears as a full robot persona, not a plain circle/icon and not a heavy card.
3. Confirm the robot has head, face screen, expressive eyes, small body, small arms, tiny checklist/tablet, and antenna glow node.
4. Confirm the speech bubble is separate from the robot.
5. Click/tap Mimo and confirm a separate glass mini panel opens.
6. Confirm states render without console errors: normal, thinking, alert, success.
7. Confirm quick actions are visible: `Бүгінгі жоспар`, `Қарыздарды тексер`, `Клиенттерді қара`, `Қате тап`.
8. Confirm mobile view stays compact and does not cover Cloud Sync controls.
9. Confirm CRM quick save, Tasks, Backup Center, Cloud Sync, and Order Pipeline still work.
10. Confirm no browser Console error appears.
11. Confirm Mimo stays fixed at the bottom-right corner on desktop.
12. Confirm Mimo does not roam or jump randomly after waiting 6-8 seconds.
13. Confirm Mimo stays below modal overlays and does not cover critical modal/buttons/form inputs.
14. Confirm the mobile mini panel stays inside the viewport when opened.

## Pass criteria

- `public/js/utils.js` loads before `public/app.js`.
- `public/js/storage.js` loads after `utils.js` and before `public/app.js`.
- `public/js/api.js` loads after `storage.js` and before `public/app.js`.
- `public/js/spreadsheet.js` loads after `api.js` and before `documents.js`.
- `public/js/documents.js` loads after `spreadsheet.js` and before `priceMatching.js`.
- `public/js/priceMatching.js` loads after `documents.js` and before `cloudSync.js`.
- Supabase JS CDN loads after `priceMatching.js` and before `cloudSync.js`.
- `public/js/cloudSync.js` loads after `priceMatching.js` and before `public/app.js`.
- `window.SanaUtils` exists.
- `window.SanaStorage` exists.
- `window.SanaApi` exists.
- `window.SanaSpreadsheet` exists.
- `window.SanaDocuments` exists.
- `window.SanaPriceMatching` exists.
- `window.SanaCloudSync` exists.
- No `SanaUtils is undefined` error appears.
- No `SanaStorage is undefined` error appears.
- No `SanaApi is undefined` error appears.
- No `SanaSpreadsheet is undefined` error appears.
- No `SanaDocuments is undefined` error appears.
- No `SanaPriceMatching is undefined` error appears.
- No `SanaCloudSync is undefined` error appears.
- CRM, tasks, CFO, import, and AI fallback still work.
