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

## 24. Notes reader mode MVP

Frontend asset query versions were updated to `20260703-05`. Manual checks to run:

1. Open `Жазбалар`.
2. Create a note with a long multi-line body.
3. Confirm the note card shows `Оқу`, `Редактировать`, `Маңызды`, `Қайта оқу`, `Архив`, and `Өшіру`.
4. Click `Оқу` and confirm the Reader Mode modal opens with folder tree, readable text, progress bar, resume, fullscreen, and close buttons.
5. Scroll the reader, close it, reopen with reading history, and confirm progress is saved.
6. Mark a note as `Маңызды`, `Қайта оқу`, and `Архив`; confirm the status filter works.
7. Click `Редактировать`, change title/body/folder, save, and confirm the same note is updated instead of duplicated.
8. Confirm archived notes are hidden from the default active filter.
9. Confirm Backup Center export includes notes with reading progress fields.
10. Confirm no browser Console error appears.

## 25. Notes folders v1

Frontend asset query versions were updated to `20260703-06`. Manual checks to run:

1. Open `Жазбалар`.
2. Confirm the `Папкалар` panel appears under the note form.
3. Create a top-level folder.
4. Create a subfolder by selecting a parent folder.
5. Confirm the folder tree shows nested folders and note counts.
6. Select a folder and confirm the breadcrumb changes.
7. Create a note inside the selected folder.
8. Move an existing note with the `Переместить` select.
9. Rename a folder and confirm notes in that folder keep working under the new path.
10. Archive a folder and confirm notes are not deleted.
11. Confirm Reader Mode still opens.
12. Confirm Backup Center export includes `noteFolders` through `sanabase-state`.
13. Confirm no browser Console error appears.

## 26. Goals, plans, and tasks edit MVP

Frontend asset query versions were updated to `20260703-08`. Manual checks to run:

1. Open `Тапсырмалар`.
2. Create a task with a multi-line checklist.
3. Click `Редактировать` on the task card.
4. Confirm the task form is filled with title, body, status, priority, due date, owner, and link.
5. Save and confirm the existing task updates instead of creating a duplicate.
6. Open `Фокус орталығы`.
7. Create a goal with stages, then click `Редактировать` on the goal card.
8. Save and confirm the existing goal updates while checked stages stay checked when the same stage text remains.
9. Create a project with modules/tasks, then click `Редактировать` on the project card.
10. Save and confirm the existing project updates instead of creating a duplicate.
11. Create a plan with tasks, then click `Редактировать` on the plan card.
12. Save and confirm the existing plan updates while checked plan tasks stay checked when the same task text remains.
13. Refresh the browser and confirm edited tasks/goals/projects/plans remain in localStorage.
14. Confirm no browser Console error appears.

## 27. Data safety emergency backup MVP

Frontend asset query versions were updated to `20260703-09`. Manual checks to run:

1. Open `Backup Center`.
2. Export all data and confirm `sanabase-safety-meta` is included when metadata exists.
3. Import a valid backup JSON.
4. Confirm the browser downloads `sanabase-emergency-before-import-...json` before restore completes.
5. Confirm Backup Center status shows the emergency backup filename.
6. Sign in to Cloud Sync if available.
7. Click `Бұлттан алу`.
8. Confirm the browser downloads `sanabase-emergency-before-cloud-load-...json` before cloud payload restore.
9. Confirm `sanabase-safety-meta` contains `lastLocalSaveAt`, `lastBackupExportAt`, `lastEmergencyBackupAt`, and cloud save/load timestamps after those actions.
10. Confirm notes, CRM clients, tasks, goals, projects, and plans still appear after restore.
11. Confirm no browser Console error appears.

## 28. Version History and Undo MVP

Frontend asset query versions were updated to `20260703-10`. Manual checks to run:

1. Open `Backup Center`.
2. Confirm `Version History / Undo` panel is visible.
3. Click `Restore point жасау`.
4. Confirm `Version History` list shows a latest restore point.
5. Add or edit a test note/task.
6. Click `Соңғысын қайтару`.
7. Confirm an emergency backup JSON downloads before restore.
8. Confirm data returns to the restore point state.
9. Import backup and confirm a `before-import` restore point is created.
10. Cloud load and confirm a `before-cloud-load` restore point is created.
11. Export a restore point and confirm JSON downloads.
12. Confirm CRM, Tasks, Notes, Backup Center, Cloud Sync, and Mimo still open.
13. Confirm no browser Console error appears.

## 29. Mimo Daily Command Brief MVP

Frontend asset query versions were updated to `20260704-01`. Manual checks to run:

1. Open the app and confirm Mimo stays fixed at the bottom-right.
2. Open Mimo and confirm `Daily Command Brief` is visible.
3. Confirm `Top 3 focus`, `Critical risks`, `Next actions`, and `Safety` cards render in the mini panel.
4. Click the mini-panel `Ашу` button in `Top 3 focus` and confirm it opens `Тапсырмалар`.
5. Click the mini-panel `Ашу` button in `Critical risks` or `Next actions` and confirm it opens the relevant CRM/Tasks/Backup/1C/Brain view.
6. Click the mini-panel `Ашу` button in `Safety` and confirm it opens `Backup Center`.
7. Click `Бүгінгі жоспар` and confirm the reply lists top focus plus backup/cloud status.
8. Click `Қате тап` and confirm Mimo shows risk scanner results.
9. Click `Күндік отчет` if visible from chat/mock flow and confirm task/order/debt/safety summary appears.
10. Confirm Backup/Cloud warnings are only recommendations and do not overwrite data automatically.
11. Confirm CRM, Tasks, Backup Center, Cloud Sync, Order Pipeline, and Mimo visual shell still open.
12. Confirm no browser Console error appears.

## 30. Mimo Risk Scanner MVP

Frontend asset query versions were updated to `20260704-02`. Manual checks to run:

1. Open Mimo and confirm the `Risk Scanner` card is visible.
2. Confirm each risk row shows title, short reason, severity style, and action buttons.
3. Click `Ашу` on a debt/order/backup/stock/document risk and confirm the related view opens.
4. Click `Task` on a risk and confirm a new Mimo task is created.
5. Click `Reminder` on a risk and confirm a calendar task/reminder is created.
6. Click `WhatsApp` on a debt risk and confirm text is copied or shown in chat, but not sent automatically.
7. Confirm no automatic delete, archive, overwrite, payment, WhatsApp send, or order status change happens.
8. Confirm CRM, Tasks, Backup Center, Cloud Sync, Order Pipeline, and Mimo still work.
9. Confirm no browser Console error appears.

## 31. Notes folder rename without browser prompt

Frontend asset query versions were updated to `20260704-03`. Manual checks to run:

1. Open `Жазбалар`.
2. Click `Редактировать` on a note folder.
3. Confirm the folder form is filled with the folder name and parent folder.
4. Change the folder name and click `Папканы сақтау`.
5. Confirm notes inside that folder keep their data and move to the renamed path.
6. Click `Болдырмау` during edit mode and confirm the form returns to add mode.
7. Confirm no browser `prompt()` error appears in Console.
8. Confirm Mimo Risk Scanner, Backup Center, and Tasks still open.

## 32. 1C Excel connection stabilization

Frontend asset query versions were updated to `20260704-05`. Manual checks to run:

1. Open `1С Excel`.
2. Upload a 1C Excel/CSV file where the first rows are report title/period and the real headers start lower.
3. Click `1С Excel оқу`.
4. Confirm the report shows `Header жолы` with the detected header row.
5. Confirm the inspector shows file name, data type, detected columns, warnings, and preview table.
6. Confirm low stock, no stock, debt, stock value, and document counts still render in KPI cards.
7. Confirm `Не істеу керек?` action plan appears under the inspector.
8. Click `CFO-ға қосу` and confirm Sana CFO receives products/clients/orders/documents without duplicate overwrite.
9. Click `Task жасау` and confirm low-stock/debt tasks are created only when matching rows exist.
10. Confirm `Екінші миға сақтау` and `CRM құжат жасау` still work after import.
11. Confirm no browser Console error appears.

## 33. ElectroPro Assistant MVP

Frontend asset query versions were updated to `20260704-06`. Manual checks to run:

1. Open `Электро Кеңесші` from sidebar.
2. Confirm dashboard stats, tabs, and safety disclaimer render.
3. In `Клиент кеңесі`, enter `Маған далаға розетка керек` and click `Кеңес беру`.
4. Confirm the answer asks IP/outdoor/load/budget/electrician clarification questions and includes safety disclaimer.
5. Enter `Қалай жалғаймын?` and confirm it refuses wiring/installation instructions.
6. Save consultation and convert it to CRM order draft.
7. Add a product card, refresh, and confirm it stays in catalog.
8. Edit and delete a product card.
9. Add a brand and China product.
10. Select 2 products and run compare.
11. Run calculator and confirm preliminary safety warning appears.
12. Import Excel catalog with SKU/Barcode/Name/Brand/Category/PurchasePrice/SalePrice/StockQty columns.
13. Confirm Backup export includes ElectroPro data through `sanabase-state`.
14. Confirm mobile layout does not overflow.
15. Confirm Console error is empty.

## 34. PWA / App-like install

Frontend manifest version was updated to `20260708-01`. Manual checks to run:

1. Open the live site on phone: `https://zsamahanskaa-max.github.io/sanabase-ai/`.
2. Android Chrome: open menu and choose `Add to Home screen` / `Install app`.
3. iPhone Safari: tap Share and choose `Add to Home Screen`.
4. Launch SanaBase from the home screen and confirm it opens without browser toolbar when supported.
5. Confirm icon appears as SanaBase `SB`.
6. Confirm `/public/manifest.json?v=20260708-01`, `/sw.js`, and `/public/icons/sanabase-icon.svg` return 200.
7. Confirm app shortcuts with `?view=electro`, `?view=crm`, and `?view=tasks` open the correct section.
8. Confirm normal browser mode still works.

## 35. ElectroPro sales and stock workflow

Frontend asset query versions were updated to `20260708-02`. Manual checks to run:

1. Open `Электро Кеңесші` -> `Каталог`.
2. Add product with SKU/barcode/name, sale price, purchase price, and stock quantity.
3. Open `Сату / Склад`.
4. Type SKU, barcode, or product name in sale search and confirm the product appears automatically.
5. Enter sale quantity and click `Саттым деп енгізу`.
6. Confirm product stock decreases and sale appears in movement history.
7. Type the same product in stock-in search, enter received quantity, and click `Складқа қосу`.
8. Confirm product stock increases and stock-in appears in movement history.
9. In stock-in form, type a new product name that does not exist and confirm it creates a new product.
10. Refresh page and confirm products, stock, and movement history remain saved.
11. Confirm Sana CFO receives retail sale income entry.
12. Confirm Console error is empty.

## 36. ElectroPro barcode scanner

Frontend asset query versions were updated to `20260708-03`. Manual checks to run:

1. Open `Электро Кеңесші` -> `Сату / Склад` on phone.
2. Click `Сатылымға сканер` and allow camera permission.
3. Scan a barcode that exists in catalog and confirm sale search fills automatically.
4. Click `Сканер тоқтату` and confirm camera closes.
5. Click `Приходқа сканер` and scan a barcode.
6. If barcode exists, confirm stock-in form is filled with SKU/barcode/prices.
7. If barcode does not exist, confirm the scanned code stays in the search field for creating a new product.
8. On unsupported browsers, confirm the UI shows fallback text and manual code input still works.
9. Confirm mobile layout stays inside viewport.
10. Confirm Console error is empty.

## 37. PWA cache recovery / phone open fix

Frontend asset query versions were updated to `20260708-04`. Service worker navigation now uses network-first behavior so phone browsers receive the latest HTML before falling back to cache. Manual checks to run:

1. Open live reset page: `https://zsamahanskaa-max.github.io/sanabase-ai/reset.html`.
2. Confirm it redirects to `https://zsamahanskaa-max.github.io/sanabase-ai/?fresh=20260708-04`.
3. Confirm localStorage business data is not deleted.
4. Confirm `/sw.js` and `/public/sw.js` return 200.
5. Confirm `/public/app.js?v=20260708-04` returns 200.
6. Confirm `/public/styles.css?v=20260708-04` returns 200.
7. On phone, close the old tab and open the live link again.
8. If installed as app, remove the old home-screen app and add it again after reset.
9. Confirm ElectroPro opens with `?view=electro`.
10. Confirm Console error is empty.

## 38. CRM Nakladnaya / Warranty generator

Frontend asset query versions were updated to `20260708-10`. Manual checks to run:

1. Open CRM.
2. In `Накладной / Гарантия жасау`, enter seller data once and click `Құжат жасау`.
3. Refresh page and confirm seller data stays saved.
4. Create a CRM quick order, then select it in `Order таңдамау / бос шаблон`.
5. Click `Order-ден толтыру` and confirm buyer/product/quantity/price fields are filled.
6. Add 2-3 extra product rows in `Тауар жолдары`.
7. Type an existing ElectroPro SKU/barcode/name in a product row and confirm datalist/autofill fills name, unit, and sale price.
8. Confirm preview table shows every product row and total sum is calculated from all rows.
9. Select `Накладной`, `Гарантия`, and `Накладной + гарантия` and confirm preview title changes.
10. Click `Печать` and confirm print window opens without changing stock.
11. Enable `CRM-ге сақтағанда складтан сатылды деп азайту`.
12. Click `CRM-ге сақтау`, confirm the warning, and confirm ElectroPro stock decreases.
13. Confirm ElectroPro movement history gets a sale row from the nakladnaya.
14. Confirm `Накладной сатылым отчеты` shows sale count, total amount, margin, client, and product rows.
15. Use the report period filter: `Барлық уақыт`, `Бүгін`, `Соңғы 7 күн`, `Осы ай`.
16. Search the report by client, product name, SKU/barcode, or nakladnaya number.
17. Click `Excel export` and confirm an `.xlsx` file downloads; if XLSX is unavailable, confirm CSV fallback downloads.
18. Click `Бос шаблон` and confirm blank printable document can be generated.
19. Confirm existing CRM quick order save still works.

## 39. IP / OUR accountant v2

Frontend asset query versions were updated to `20260709-02`. Manual checks to run:

1. Open `AI Бас бухгалтер`.
2. Open the `ИП / ОУР` tab.
3. Confirm the new command cards show readiness percent, tax base, risk count, bank/cash/Kaspi status.
4. Add a `Payment / төлем` without category and confirm it appears in IP accountant warnings.
5. Add a `TaxTask / салық` with a near due date and confirm it appears in the tax calendar/warnings.
6. Ask the CFO chat: `ИП ОУР бойынша не тексеру керек?`
7. Confirm the answer shows a step-by-step IP accountant brief and safety note.
8. Click `ИП ОУР отчет` and confirm an Excel report downloads with summary, checklist, next actions, and warnings.
9. Confirm Dashboard, Cash Flow, P&L, Kaspi, Backup, CRM and Tasks still open without console errors.

## 40. Visible sales and stock entry

Frontend asset query versions were updated to `20260709-05`. Manual checks to run:

1. Confirm the left menu has a separate `Сату / Склад` button.
2. Click `Сату / Склад` and confirm ElectroPro opens directly on the inventory tab.
3. Add or import a product in `Каталог`.
4. Return to `Сату / Склад`, type product code/name in the sale search, and confirm the product auto-fills.
5. Enter quantity, price, client, and click `Саттым деп енгізу`.
6. Confirm stock decreases and the sale appears in movement history.
7. Confirm CFO receives the retail sale income row.
8. Confirm the receipt/накладной preview appears after saving a sale.
9. Fill and save seller реквизиттері: ИП/дүкен аты, ИИН/БИН, телефон, адрес, банк/Kaspi.
10. Click `Соңғы сатылым чек/накладной` and confirm the print window opens with seller реквизиттері, buyer/client, product table, totals and signatures.
11. Click `PDF ретінде сақтау` and confirm the same print window opens so the browser can save as PDF.
12. Click `WhatsApp мәтін көшіру` and confirm the customer-ready text appears and copies to clipboard.
13. Refresh the page and confirm seller реквизиттері stay saved.
14. Click `Күндік сатылым отчет` and confirm totals, cost, margin, and sale rows appear.
15. Click `Күндік Excel export` and confirm an `.xlsx` file downloads.
17. Confirm Console error is empty.

## 41. Electro sales and product base split

Frontend asset query versions were updated to `20260709-06`. Manual checks to run:

1. Open `/?view=electro&electro=inventory&fresh=20260709-06`.
2. Confirm the top menu has separate `Сату` and `Тауар базасы` buttons.
3. In `Сату`, type a product code/name that does not exist.
4. Confirm the app warns that the product must be added to stock first.
5. Press `Тауар базада жоқ па? Складқа қосу`.
6. Confirm the same code/name is moved into the stock-in form.
7. Save the stock-in product, then search it again in the sale form.
8. Confirm sale saves, stock decreases, and movement history updates.

## 42. Sale payment method and 1C document reading hardening

Frontend asset query versions were updated to `20260709-07`. Manual checks to run:

1. Open `/?view=electro&electro=inventory&fresh=20260709-07`.
2. Create a sale with `Касса / наличный`, then confirm CFO payment category is cash retail sale.
3. Create a sale with `Банк аударым`, then confirm CFO payment method is bank.
4. Create a sale with `Kaspi магазин`, then confirm CFO business is Kaspi and category is Kaspi sale.
5. Upload a 1C Excel file with multiple sheets and confirm the non-empty/data sheet is read.
6. Upload a semicolon CSV export from 1C and confirm columns split correctly.
7. Confirm `Сумма` and `Оплачено` columns appear in 1C report/CFO import.
8. Confirm general document import still works for TXT/CSV/XLSX/DOCX/PDF fallback.

## 43. Electro catalog import and camera fallback

Frontend asset query versions were updated to `20260709-09`. Manual checks to run:

1. Open `/?view=electro&electro=catalog&fresh=20260709-09`.
2. Upload an Excel/CSV catalog and click `Preview / Import`.
3. Confirm import result appears inside `Тауар базасы`, not only in compare/output area.
4. Confirm header row is detected even if 1C/export title rows are above the table.
5. Confirm rows with code/barcode but missing product name still import using code as fallback name.
6. Open `Сату`, press scanner button on phone.
7. Confirm camera preview opens even if auto barcode detection is unsupported.
8. Confirm stop scanner closes the camera preview.
9. Confirm fractional stock such as `25,3` or `1,63` is shown with a `1C fractional stock` explanation instead of looking like a random broken value.

## 44. Auto Cloud Sync and conflict protection

Frontend asset query versions were updated to `20260710-01`. Manual checks to run:

1. Open `/?view=brain&fresh=20260710-01` on laptop and phone.
2. Sign in to Cloud Sync with the same email/password on both devices.
3. Confirm `Auto Sync` status appears under the Cloud Sync buttons.
4. Create or edit one CRM client/order/task on the laptop and wait 2-4 seconds.
5. Confirm Auto Sync says the local data was saved to cloud.
6. Open the phone, sign in, and press `Sync тексеру` or `Бұлттан алу`.
7. Confirm the same CRM client/order/task appears on the phone.
8. Create a newer local change on one device while another device has newer cloud data.
9. Confirm Auto Sync pauses and shows the conflict panel instead of overwriting automatically.
10. Confirm `Upload local`, `Download cloud`, and `Cancel` work.
11. Confirm cloud download still creates an emergency backup before restore.
12. Confirm Backup Center export/import still works.
13. Confirm no browser Console error appears.

## 45. Electro sales correction, catalog search, invoice cleanup, translate tools

Frontend asset query versions were updated to `20260710-02`. Manual checks to run:

1. Open `/?view=electro&electro=catalog&fresh=20260710-02`.
2. Confirm product catalog search filters by SKU, barcode, name and brand.
3. Click `Edit` on a product, update price/stock/name, save, refresh and confirm it remains.
4. Open `/?view=electro&electro=inventory&fresh=20260710-02`.
5. Create a sale, confirm stock decreases.
6. Click `Қате сатылымды өшіру`, confirm the sale movement disappears and stock is restored.
7. Print or preview the last sale invoice and confirm margin/internal warning text is not shown.
8. Open Translate, choose a mode, translate, copy output and save to Notes.
9. Confirm Auto Sync status appears and changes still call sync after `persist()`.
10. Confirm no browser Console error appears.

## 46. Auto Cloud Sync polling from phone to laptop

Frontend asset query versions were updated to `20260710-03`. Manual checks to run:

1. Open `/?view=electro&electro=inventory&fresh=20260710-03` on laptop and phone.
2. Sign in to Cloud Sync with the same account on both devices.
3. On the laptop, keep the page open and confirm `Auto Sync` status is visible.
4. On the phone, create one Electro sale and wait 2-4 seconds for cloud save.
5. On the laptop, wait up to 20 seconds or focus the browser tab.
6. Confirm the phone sale appears in the laptop movement list without pressing `Бұлттан алу`.
7. If the laptop also has unsynced local edits, confirm conflict panel appears instead of overwriting automatically.
8. Confirm stock quantity updates on the laptop after the phone sale arrives.
9. Confirm no browser Console error appears.

## 47. CRM nakladnaya multiple item rows

Frontend asset query versions were updated to `20260710-04`. Manual checks to run:

1. Open `/?view=crm&fresh=20260710-04`.
2. In `Накладной / Гарантия жасау`, fill seller/buyer data.
3. Add 3-5 product rows using `+ Тауар жолын қосу` and `+5 жол`.
4. Search product by code/name in different rows and confirm each row auto-fills independently.
5. Change quantity/price and confirm row total plus `Жалпы` total updates.
6. Delete one row with `×` and confirm remaining rows stay.
7. Generate and print the document; confirm all product rows appear.
8. Save CRM document and confirm no Console error appears.

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
