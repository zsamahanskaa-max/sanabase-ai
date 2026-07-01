# SanaBase frontend refactor plan

`public/app.js` is a single browser script with shared globals. Do not split it
in one pass. The current static deployment depends on global functions, inline
event handlers, DOM ids, and stable localStorage keys.

## Current block map

- Bootstrap, global state, DOM helpers, event binding: `public/app.js:1-139`
  - `state`, `DEFAULT_CLOUD_CONFIG`, `cloudConfig`
  - `$`, `on`
  - all top-level event listeners
  - initial `render()`, cloud settings, Mimo init, reminder engine
- Navigation and file import: `public/app.js:140-166`
  - `setView`
  - `importFiles`
- Main AI chat, assistant actions, translate, quiz: `public/app.js:167-305`
  - `chat`, `runQuickPrompt`
  - last assistant answer to task/plan/CRM document
  - `translate`, `quiz`
- CRM core and CRM operating panel: `public/app.js:306-1222`
  - `crm`, CRM document generation/download
  - `saveCrmQuickDeal`
  - `renderCrmWorkspace`, `renderCrmOperatingPanel`
  - CRM business report parsing and smart archive
  - CRM assistant dashboard
- 1C Excel, price matching, spreadsheet utilities: `public/app.js:1223-1765`
  - `importOneCExcel`, `analyzeOneCTable`
  - `matchPrices`, `mergeByCode`
  - workbook/table helpers and code/price detection
- Notes, tasks, goals, projects, plans, challenges, reminders: `public/app.js:1766-2180`
  - `saveNote`, `saveTask`, task movement/deletion
  - goals/projects/plans/challenges saving and toggles
  - notification permission and reminder engine
- Calendar OS, business entities, date/money helpers: `public/app.js:2181-2847`
  - `calendarData`, `normalizeCalendarOS`, default data
  - clients, suppliers, orders, payments, documents, habits, reports
  - calendar render/export/history
  - shared helpers: `isoDate`, `addDays`, `money`
- Brain, image import, cloud sync: `public/app.js:2848-3262`
  - `brainCrm`, `exportBrain`, `importBrain`
  - image storage in Brain
  - cloud settings, push/pull, Supabase REST headers/status
- AI API wrapper, import fallback, local assistant logic, normalizers: `public/app.js:3263-4003`
  - `ai`, `extractFile`, `serverImport`, `browserImport`
  - `localAnswer`, context answers, quiz/CRM analysis
  - document/task/note/image normalizers
  - `buildContext`, `api`, `addMessage`
- Mimo/SanaBot floating assistant: `public/app.js:4004-4431`
  - Mimo init, roam/move/open/close
  - quick actions, mood, metrics, mock/AI reply
  - Mimo-created tasks, follow-ups, WhatsApp drafts
- Sana CFO / AI Бас Бухгалтер: `public/app.js:4432-5188`
  - CFO default state and normalizers
  - import/export/clear/quick record
  - metrics, audit warnings, dashboard tabs
  - auto report generator and mock accountant chat
- Main render and section renderers: `public/app.js:5189-5776`
  - top-level `render`
  - OneC, documents, notes, tasks, goals, Brain rendering
  - task card/detail rendering
- Storage and final utilities: `public/app.js:5777-5831`
  - `loadState`
  - `persist`
  - final HTML escaping utility

## First safe extraction candidates

1. Pure utility module
   - Candidate functions: `isoDate`, `nowIso`, `addDays`, `isPast`,
     `inNextDays`, `money`, `escapeHtml`, `splitList`, `keywords`.
   - Reason: mostly pure and low DOM dependency.
   - Risk: some functions are used before/after many sections, so expose them
     on `window` during the transition.

2. Spreadsheet helper module
   - Candidate functions: `worksheetToRows`, `normalizeHeader`, `trimRows`,
     `findColumn`, `parseNumber`, `normalizeCode`, `cellText`.
   - Reason: internal logic is isolated from UI.
   - Risk: used by CRM report, 1C import, and price matching, so test all three.

3. Local normalizers module
   - Candidate functions: `normalizeDoc`, `normalizeTask`, `normalizeNote`,
     `normalizeImage`, `normalizeOneC`, goal/project/plan/challenge normalizers.
   - Reason: predictable data-shaping functions.
   - Risk: must preserve localStorage migrations and defaults exactly.

4. AI fallback module
   - Candidate functions: `localAnswer`, `answerFromContext`,
     `assistantInstruction`, `emptyAssistantAnswer`, `makeQuiz`, `analyzeCrm`.
   - Reason: can be tested without DOM.
   - Risk: depends on `buildContext` and user-facing Kazakh/Russian text.

5. Rendering modules last
   - CRM, CFO, tasks, Brain, Mimo, and `render()` should be split only after
     utilities/state are stable.
   - Reason: these sections depend heavily on shared `state`, DOM ids,
     event bindings, and cross-module helpers.

## Guardrails for each future refactor

- Keep these localStorage keys unchanged:
  - `sanabase-state`
  - `goals`, `projects`, `challenges`
  - `zhadyra_goals`, `zhadyra_projects`, `zhadyra_plans`, `zhadyra_tasks`
  - `zhadyra_habits`, `zhadyra_challenges`, `zhadyra_1c_excel`
  - `zhadyra_crm_reports`, `zhadyra_cfo`
  - `sanabase-cloud`
- Keep browser global function names stable until HTML event bindings are fully
  migrated.
- After every small extraction, run:
  - `node --check public/app.js`
  - browser smoke test for CRM quick deal, CFO auto report, task card modal,
    file import, AI fallback.
- Do not move `render()` until all child renderers have stable module exports.

## Documents/import analysis

This section is analysis only. No runtime code was changed for this step.

### Import/document function map

- File input / upload handler: `public/app.js:58`, `public/app.js:167-185`
  - `on("fileInput", "change", importFiles)` binds the upload field.
  - `importFiles(event)` loops through uploaded files, calls `extractFile`,
    pushes a normalized document into `state.docs`, calls `persist()`, clears the
    input, and calls `render()`.
- `/api/import` server call: `public/app.js:3273-3284`
  - `extractFile(file)` tries server import first.
  - `serverImport(file)` converts the file with `fileToBase64` and calls
    `requestImportFile({ name, type, data })`, which maps to `/api/import`.
- Browser fallback import: `public/app.js:3273-3325`
  - If server import fails, `extractFile` returns `browserImport(file)`.
  - `browserImport(file)` handles local text, Excel, Word, PDF, and unsupported
    files without changing server behavior.
- Excel parsing: `public/app.js:1557-1609`, plus shared spreadsheet helpers after
  that block.
  - `readTableFile(file)` reads XLS/XLSX through `window.XLSX` and CSV/TSV
    through text splitting.
  - `worksheetToRows`, `normalizeHeader`, `trimRows`, and `findColumn` are shared
    by import, CRM reports, 1C, and price matching.
- PDF/Word/Text handling: `public/app.js:3286-3325`
  - Text/Markdown/CSV/TSV use `file.text()`.
  - Excel uses `readTableFile`.
  - DOCX uses `window.mammoth.extractRawText`.
  - PDF uses `readPdf`, which loads pdf.js when needed.
  - Unsupported files return `unsupported(file, warning)`.
- Imported document state update: `public/app.js:167-185`,
  `public/app.js:3570-3627`, `public/app.js:5160-5243`
  - `importFiles` creates a document record.
  - `normalizeDoc`, `smartDocMeta`, `detectDocCategory`,
    `detectDocBusiness`, and `detectDocProject` enrich document metadata.
  - `render` normalizes `state.docs`, updates counts, renders cards, and wires
    delete buttons.
- Brain / knowledge base logic: `public/app.js:2842-3052`,
  `public/app.js:5669-5738`
  - `brainCrm`, `exportBrain`, `importBrain`, `importBrainImages`,
    `imageFileToBrainItem`, `resizeImage`, and `saveBrainMeta` manage Brain
    import/export and document metadata.
  - `renderBrain` combines `state.docs`, `state.images`, and Brain-enabled
    notes into the Brain view.
- Render/update UI calls:
  - `importFiles`: `persist()` inside the file loop, then one final `render()`.
  - `importBrain`: `persist()` and `render()` after merge.
  - `importBrainImages`: `persist()` and `render()` after image conversion.
  - `saveBrainMeta`: `persist()` and `render()` after tag/link edits.
  - `deleteDoc` and `deleteBrainImage`: `persist()` and `render()` after delete.

### Safe-to-extract candidates for `documents.js`

- Safe first, if globals are preserved through `window.SanaDocuments`:
  - `extractFile`
  - `serverImport`
  - `browserImport`
  - `readPdf`
  - `unsupported`
- Safe second, after import smoke tests:
  - `normalizeDoc`
  - `smartDocMeta`
  - `detectDocCategory`
  - `detectDocBusiness`
  - `detectDocProject`
- Safe only if shared exports are stable:
  - `readTableFile`
  - `worksheetToRows`
  - `normalizeHeader`
  - `trimRows`
  - `findColumn`
  - These are shared by documents/import, CRM reports, 1C import, and price
    matching, so they may belong in a later `spreadsheet.js`, not
    `documents.js`.

### Keep in `app.js` for now

- `importFiles`
  - It directly mutates `state.docs`, calls `persist()`, uses `addMessage`, and
    triggers `render()`. Move it only after document helpers are stable.
- `render`
  - Top-level render stays in `app.js`.
- `renderBrain`
  - It mixes docs, images, notes, DOM rendering, Brain metadata editing, and
    delete handlers.
- `brainCrm`, `exportBrain`, `importBrain`, `importBrainImages`,
  `saveBrainMeta`
  - These belong to a broader Brain module, not the first documents extraction.
- `readTableFile` family
  - It is document-related, but also business-critical for CRM/1C/price
    matching. Extract separately and test all spreadsheet flows.

### Next exact extraction step

Create `public/js/documents.js` with only:

- `extractFile`
- `serverImport`
- `browserImport`
- `readPdf`
- `unsupported`

Expose them as `window.SanaDocuments`, load the file after `api.js` and before
`app.js`, and in `app.js` replace only the matching local helper references.
Do not move `importFiles`, `render`, Brain functions, or spreadsheet helpers in
that first extraction.

## Spreadsheet/Excel analysis

This section is analysis only. No runtime code was changed for this step.

### Spreadsheet function map

- CRM business report import: `public/app.js:811-874`
  - `buildCrmBusinessReport()` reads CRM upload inputs, calls `readTableFile`
    for each file, builds a report, stores it in `state.crmReports`, then calls
    `persist()` and `render()`.
  - `analyzeCrmBusinessTables()` connects parsed realization, Kaspi/bank,
    counterparty, and nomenclature tables into B2B/store report data.
- CRM table parsers: `public/app.js:875-965`
  - `parseRealizationTable`
  - `parseKaspiTable`
  - `parseCounterpartyTable`
  - `parseNomenclatureTable`
  - These use shared spreadsheet helpers such as `normalizeHeader`,
    `findColumn`, `cell`, and `parseMoney`.
- 1C Excel import/export logic: `public/app.js:1250-1434`
  - `importOneCExcel()` reads the selected 1C file, calls `readTableFile`,
    analyzes it, writes `state.oneC`, then calls `persist()` and `render()`.
  - `analyzeOneCTable`, `detectOneCKind`, `oneCColumns`, `oneCRow`,
    `parseMoney`, `oneCSummary`, `oneCReport`, `oneCKindLabel`, and
    `oneCColumnLabel` parse and explain 1C exports.
  - `saveOneCToBrain()` and `oneCToCrmDocument()` convert 1C analysis into
    Brain/docs/notes/CRM records, then call `persist()` and `render()`.
- Price matching logic: `public/app.js:1435-1563`
  - `matchPrices()` reads base and Almat price files, calls `readTableFile`,
    calls `mergeByCode`, downloads the completed workbook, and updates UI text.
  - `mergeByCode()` protects formula cells and quantity/package columns, matches
    rows by code, fills price columns, and builds change log / not-found sheets.
- Core spreadsheet helpers: `public/app.js:1564-1789`
  - `readTableFile`
  - `worksheetToRows`
  - `downloadWorkbook`
  - `appendOrReplaceSheet`
  - `normalizeHeader`
  - `trimRows`
  - `findColumn`
  - `resolveCodeColumns`
  - `columnMatchScore`
  - `chooseDuplicateRow`
  - `findQuantityColumns`
  - `findPackageColumns`
  - `findPriceColumns`
  - `resolvePriceColumn`
  - `findMatchingPriceSource`
  - `guessItemName`
  - keyword helpers: `codeKeywords`, `quantityKeywords`, `packageKeywords`,
    `priceKeywords`
  - cell/value helpers: `normalizeCode`, `normalizeText`, `headerKey`,
    `cellValue`, `cellText`, `getSheetCellValue`, `hasFormula`, `setSheetCell`,
    `parseNumber`
  - file helpers: `datedFilename`, `uniqueIndexes`
- CFO file import: `public/app.js:4504-4562`
  - `importCfoFiles()` calls `readTableFile` for CFO source files.
  - `cfoImportTables()` uses CRM parsers and spreadsheet helpers to merge
    realization, bank, counterparty, and stock data into CFO state.
- Document import shared dependency: `public/js/documents.js`
  - `browserImport()` still calls global `readTableFile(file)` for XLS/XLSX.
  - This is why spreadsheet helpers must stay globally available until a
    dedicated spreadsheet module is loaded before `documents.js` or app helpers
    are rewired.
- XLSX library usage:
  - `public/index.html` and root `index.html` load
    `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js`.
  - `readTableFile` uses `XLSX.read`.
  - `worksheetToRows`, `mergeByCode`, `downloadWorkbook`,
    `appendOrReplaceSheet`, `exportCalendarData`, and cell helpers use
    `XLSX.utils`.
  - `downloadWorkbook` and `exportCalendarData` use `XLSX.writeFile`.
- Render/update UI calls:
  - `buildCrmBusinessReport`: `persist()` and `render()` after report creation.
  - `importOneCExcel`: `persist()` and `render()` after state.oneC update.
  - `saveOneCToBrain`: `persist()` and `render()` after document creation.
  - `oneCToCrmDocument`: `persist()` and `render()` after CRM document creation.
  - `importCfoFiles`: `persist()` and `render()` after CFO import merge.
  - `matchPrices`: updates output text and downloads workbook; it does not
    mutate app state.

### Safe-to-extract candidates for `spreadsheet.js`

- Safe first, if exposed as `window.SanaSpreadsheet` and loaded before
  `documents.js` and `app.js`:
  - `readTableFile`
  - `worksheetToRows`
  - `normalizeHeader`
  - `trimRows`
  - `findColumn`
  - `normalizeCode`
  - `normalizeText`
  - `headerKey`
  - `cellValue`
  - `cellText`
  - `parseNumber`
- Safe second, after import/CRM/1C smoke tests:
  - `downloadWorkbook`
  - `appendOrReplaceSheet`
  - `getSheetCellValue`
  - `hasFormula`
  - `setSheetCell`
  - `datedFilename`
  - `uniqueIndexes`
- Safe only with price-matching tests:
  - `resolveCodeColumns`
  - `columnMatchScore`
  - `chooseDuplicateRow`
  - `findQuantityColumns`
  - `findPackageColumns`
  - `findPriceColumns`
  - `resolvePriceColumn`
  - `findMatchingPriceSource`
  - `guessItemName`
  - `codeKeywords`
  - `quantityKeywords`
  - `packageKeywords`
  - `priceKeywords`

### Keep in `app.js` for now

- `matchPrices`
  - It reads DOM inputs, updates UI output, calls download, and coordinates the
    full price-matching workflow.
- `mergeByCode`
  - Business-critical and tightly coupled to price matching, formula protection,
    duplicate mode, and workbook mutation. Move only after core spreadsheet
    helpers are extracted and tested.
- `importOneCExcel`
  - It reads DOM input, writes `state.oneC`, calls `persist()` and `render()`.
- 1C analysis/report functions
  - `analyzeOneCTable`, `detectOneCKind`, `oneCColumns`, `oneCRow`,
    `oneCSummary`, `oneCReport`, labels.
  - These are domain logic and should move later into a `onec.js` or business
    module, not the first spreadsheet helper extraction.
- CRM/CFO import coordinators
  - `buildCrmBusinessReport`, `analyzeCrmBusinessTables`, `importCfoFiles`,
    `cfoImportTables`.
  - These mutate business state and call render.
- CRM/CFO table parsers
  - `parseRealizationTable`, `parseKaspiTable`, `parseCounterpartyTable`,
    `parseNomenclatureTable`.
  - They are domain-specific parsers. Keep them until core helpers are stable.

### Dependencies to preserve

- `window.XLSX` must already be loaded before spreadsheet helpers run.
- `documents.js` currently depends on global `readTableFile` for Excel browser
  fallback.
- Price matching depends on:
  - `XLSX.utils.decode_range`
  - `XLSX.utils.encode_cell`
  - `XLSX.utils.encode_range`
  - formula detection through cell `.f`
- CRM/CFO parsers depend on shared app helpers:
  - `cell`
  - `parseMoney`
  - `money`
  - `normalizeParty`
  - business report functions
- 1C and CRM/CFO import flows depend on `state`, `persist()`, and `render()` and
  should not be moved in the first helper extraction.

### Next exact extraction step

Create `public/js/spreadsheet.js` with only the lowest-risk helper set:

- `readTableFile`
- `worksheetToRows`
- `normalizeHeader`
- `trimRows`
- `findColumn`
- `normalizeCode`
- `normalizeText`
- `headerKey`
- `cellValue`
- `cellText`
- `parseNumber`

Expose them as `window.SanaSpreadsheet`, load it after `api.js` and before
`documents.js`, then replace only those helper references in `app.js` and
`documents.js`. Do not move `matchPrices`, `mergeByCode`, 1C import, CRM import,
CFO import, or any render/state mutation in that first extraction.

## Price matching analysis

This section is analysis only. No runtime code was changed for this step.

### Price matching function map

- UI event binding: `public/app.js:104`
  - `on("matchBtn", "click", matchPrices)` binds the price matching button.
- Price matching DOM inputs: `public/index.html:347-374`, `index.html:347-374`
  - `basePriceFile`: request/order/base file.
  - `almatPriceFile`: Almat company price file.
  - `priceUpdateMode`: controls fill-empty vs overwrite behavior.
  - `duplicateMode`: controls duplicate code handling.
  - `matchOut`: status and result output.
- `matchPrices`: `public/app.js:1448-1486`
  - Reads DOM files and options.
  - Checks `window.XLSX`.
  - Calls `readTableFile` for both files.
  - Calls `mergeByCode`.
  - Calls `downloadWorkbook(result, datedFilename("completed_price"))`.
  - Writes summary text to `matchOut`.
  - Does not mutate `state`, does not call `persist()`, and does not call
    `render()`.
- `mergeByCode`: `public/app.js:1488-1575`
  - Reads headers with `normalizeHeader`.
  - Resolves code columns with `resolveCodeColumns`.
  - Protects quantity/package columns through `findQuantityColumns` and
    `findPackageColumns`.
  - Resolves source/target price columns.
  - Builds a code-to-price row map.
  - Handles duplicate codes through `chooseDuplicateRow`.
  - Mutates the original workbook sheet when `base.workbook` exists.
  - Produces array output rows when the base file is CSV/TSV.
  - Builds `changeLog`, `notFound`, and summary counters.
- Formula cell handling: `public/app.js:1515-1549`,
  `public/app.js:1698-1715`
  - `mergeByCode` uses `sheetRange` from `XLSX.utils.decode_range`.
  - Adds "Almat price" header through `XLSX.utils.encode_cell`.
  - Updates `!ref` with `XLSX.utils.encode_range`.
  - `hasFormula` checks cell `.f`.
  - Formula cells are not overwritten; `formulaProtected` is incremented.
  - `setSheetCell` deletes formula metadata only after formula protection has
    allowed the write.
- Workbook mutation and download/export: `public/app.js:1577-1590`
  - `downloadWorkbook` writes either the original workbook or a new workbook.
  - `appendOrReplaceSheet` replaces "Change log" and "Not found" sheets.
  - `XLSX.writeFile` downloads the result as `.xlsx`.
- Price matching helper functions:
  - `resolveCodeColumns`: `public/app.js:1592-1607`
  - `columnMatchScore`: `public/app.js:1609-1616`
  - `chooseDuplicateRow`: `public/app.js:1618-1631`
  - `findQuantityColumns`: `public/app.js:1633-1638`
  - `findPackageColumns`: `public/app.js:1640-1645`
  - `findPriceColumns`: `public/app.js:1647-1652`
  - `resolvePriceColumn`: `public/app.js:1654-1667`
  - `findMatchingPriceSource`: `public/app.js:1669-1674`
  - `guessItemName`: `public/app.js:1676-1680`
  - `codeKeywords`: `public/app.js:1682-1684`
  - `quantityKeywords`: `public/app.js:1686-1688`
  - `packageKeywords`: `public/app.js:1690-1692`
  - `priceKeywords`: `public/app.js:1694-1696`
  - `getSheetCellValue`: `public/app.js:1698-1700`
  - `hasFormula`: `public/app.js:1702-1705`
  - `setSheetCell`: `public/app.js:1707-1714`
  - `datedFilename`: `public/app.js:1716-1718`
  - `uniqueIndexes`: `public/app.js:1720-1722`

### Dependencies

- Spreadsheet helpers from `window.SanaSpreadsheet`:
  - `readTableFile`
  - `normalizeHeader`
  - `normalizeCode`
  - `normalizeText`
  - `headerKey`
  - `cellValue`
  - `cellText`
  - `parseNumber`
- XLSX dependency:
  - `window.XLSX` is loaded by CDN before app scripts.
  - `mergeByCode`, `downloadWorkbook`, `appendOrReplaceSheet`,
    `getSheetCellValue`, `hasFormula`, and `setSheetCell` use `XLSX.utils` or
    `XLSX.writeFile`.
- DOM dependencies:
  - `$`
  - `basePriceFile`
  - `almatPriceFile`
  - `priceUpdateMode`
  - `duplicateMode`
  - `matchOut`
- State/render dependencies:
  - `matchPrices` does not use `state`.
  - `matchPrices` does not call `persist()`.
  - `matchPrices` does not call `render()`.
  - This makes it safer than CRM/CFO/1C extraction, but workbook mutation still
    needs careful smoke testing.

### Safe-to-extract candidates for `priceMatching.js`

- Safe first as one grouped module, loaded after `spreadsheet.js` and before
  `app.js`:
  - `downloadWorkbook`
  - `appendOrReplaceSheet`
  - `resolveCodeColumns`
  - `columnMatchScore`
  - `chooseDuplicateRow`
  - `findQuantityColumns`
  - `findPackageColumns`
  - `findPriceColumns`
  - `resolvePriceColumn`
  - `findMatchingPriceSource`
  - `guessItemName`
  - `codeKeywords`
  - `quantityKeywords`
  - `packageKeywords`
  - `priceKeywords`
  - `getSheetCellValue`
  - `hasFormula`
  - `setSheetCell`
  - `datedFilename`
  - `uniqueIndexes`
- Safe second, after workbook smoke tests:
  - `mergeByCode`
- Safe third:
  - `matchPrices`, because it reads DOM and writes UI output.

### Keep in `app.js` for now

- `matchPrices`
  - Keep until helper module is stable because it is the DOM coordinator.
- `mergeByCode`
  - Keep until formula protection, duplicate handling, and workbook mutation are
    manually smoke tested.
- CRM/1C/CFO flows
  - Do not move as part of price matching.

### Next exact extraction step

Create `public/js/priceMatching.js` with only the helper set below, exposed as
`window.SanaPriceMatching`, and load it after `spreadsheet.js` and before
`documents.js`/`app.js`:

- `downloadWorkbook`
- `appendOrReplaceSheet`
- `resolveCodeColumns`
- `columnMatchScore`
- `chooseDuplicateRow`
- `findQuantityColumns`
- `findPackageColumns`
- `findPriceColumns`
- `resolvePriceColumn`
- `findMatchingPriceSource`
- `guessItemName`
- `codeKeywords`
- `quantityKeywords`
- `packageKeywords`
- `priceKeywords`
- `getSheetCellValue`
- `hasFormula`
- `setSheetCell`
- `datedFilename`
- `uniqueIndexes`

Do not move `matchPrices` or `mergeByCode` in that first price matching
extraction. After smoke tests pass, move `mergeByCode` as a second step.

## `mergeByCode` deep analysis

This section is analysis only. No runtime code was changed for this step.

### Line range

- `mergeByCode`: `public/app.js:1510-1597`

### Inputs

- `base`
  - Produced by `readTableFile(baseFile)`.
  - Expected shape:
    - `base.rows`: two-dimensional table array, first row is header.
    - `base.workbook`: present when source is XLS/XLSX.
    - `base.sheet`: first worksheet when source is XLS/XLSX.
- `price`
  - Produced by `readTableFile(priceFile)`.
  - Expected shape:
    - `price.rows`: two-dimensional price table, first row is header.
- `options`
  - `updateMode`
    - default: `"fill-empty"`.
    - if `"fill-empty"` and target already has an old value, it skips writing.
    - any other value currently behaves like overwrite.
  - `duplicateMode`
    - default: `"first"`.
    - passed to `chooseDuplicateRow`.

### Output

`mergeByCode` returns an object:

- `workbook`
  - original `base.workbook` for XLS/XLSX input, otherwise undefined/null.
- `rows`
  - only populated for CSV/TSV-style flow where there is no workbook.
  - includes output header plus modified rows.
- `changeLog`
  - array table with header:
    `Row, Code, Item, Column, Old price, New price, Duplicate mode, Update mode`.
- `notFound`
  - array table with header:
    `Row, Code, Item`.
- `baseRows`
- `priceRows`
- `matched`
- `filled`
- `addedColumns`
- `formulaProtected`
- `protectedColumns`
- `baseCodeHeader`
- `priceCodeHeader`

### Internal flow

1. Reads `updateMode` and `duplicateMode`.
2. Normalizes base and price headers.
3. Resolves matching code columns between base and price.
4. Builds protected column indexes from quantity and package columns.
5. Resolves source price column in the price file.
6. Resolves target price columns in the base file.
7. Adds a new `Almat price` output column if no editable price column exists.
8. Builds `priceMap` by normalized product code.
9. Iterates base rows:
   - normalizes base code
   - finds matching price row
   - chooses item name for reporting
   - writes into workbook sheet or output row
   - appends to `changeLog`
   - appends missing codes to `notFound`
10. Returns workbook/rows and summary counters.

### Helper dependencies

From `window.SanaSpreadsheet`:

- `normalizeHeader`
- `normalizeCode`
- `cellValue`
- `parseNumber`

From `window.SanaPriceMatching`:

- `resolveCodeColumns`
- `findQuantityColumns`
- `findPackageColumns`
- `resolvePriceColumn`
- `findPriceColumns`
- `chooseDuplicateRow`
- `findMatchingPriceSource`
- `guessItemName`
- `getSheetCellValue`
- `hasFormula`
- `setSheetCell`
- `uniqueIndexes`

From XLSX:

- `XLSX.utils.decode_range`
- `XLSX.utils.encode_cell`
- `XLSX.utils.encode_range`

### Formula protection

Formula protection happens only when the base file has a real workbook/sheet:

1. `targetSheet` is set from `base.sheet`.
2. Before writing into a target cell, `mergeByCode` calls:
   - `hasFormula(targetSheet, rowIndex, outputIndex)`
3. `hasFormula` checks whether the worksheet cell has `.f`.
4. If `.f` exists:
   - the cell is not overwritten
   - `formulaProtected` increments by 1
   - the function returns from that target column write
5. If there is no formula:
   - `setSheetCell` writes the new value
   - `setSheetCell` removes `.f` and `.w` after write

Important risk:

- Formula protection depends on checking before `setSheetCell`.
- Moving `mergeByCode` must preserve this order exactly.

### Duplicate mode

Duplicate handling happens while building `priceMap`:

- Each price row gets a normalized code through `normalizeCode`.
- If the code is new, it is stored in `priceMap`.
- If the code already exists, `chooseDuplicateRow` decides which row remains.

Modes:

- `first`
  - default behavior.
  - keeps the first row.
- `last`
  - replaces with the newest row.
- `min`
  - compares parsed source price and keeps the lower price row.
- `max`
  - compares parsed source price and keeps the higher price row.

Risk:

- `min/max` depend on `parseNumber(current[priceIndex])`.
- If parsed price is null, fallback behavior must remain identical.

### Change log

`changeLog` starts with a header row:

```text
Row | Code | Item | Column | Old price | New price | Duplicate mode | Update mode
```

Rows are added only when a value is actually written:

- matched code exists
- target column is not protected quantity/package column
- new price value exists
- `fill-empty` does not skip due to old value
- formula protection does not skip the cell

### Not found sheet

`notFound` starts with a header row:

```text
Row | Code | Item
```

Rows are added when:

- base row has a normalized code
- no matching price row exists in `priceMap`

### Can `mergeByCode` move into `priceMatching.js`?

Yes, but only after manual smoke tests for the helper extraction pass.

Reasons it can move:

- It does not touch DOM directly.
- It does not read or write `state`.
- It does not call `persist()`.
- It does not call `render()`.
- Its current dependencies are already separated into `SanaSpreadsheet` and
  `SanaPriceMatching`.

Risks:

- It mutates workbook cells for XLS/XLSX files.
- It updates worksheet range `!ref`.
- It must preserve formula protection order.
- It must preserve CSV/TSV behavior where `rows` output is used instead of
  workbook mutation.
- It must preserve duplicate mode behavior exactly.

### Safe extraction plan

1. Create no new public behavior.
2. Move only `mergeByCode` into `public/js/priceMatching.js`.
3. Export it through `window.SanaPriceMatching.mergeByCode`.
4. Keep backward compatibility:
   - `window.mergeByCode = mergeByCode`
5. In `public/app.js`, bind:
   - `mergeByCode` from `window.SanaPriceMatching`
6. Do not change `matchPrices`.
7. Do not change workbook helpers.
8. Run syntax checks.
9. Manual smoke test:
   - xlsx base + xlsx price
   - csv/tsv base path if used
   - formula cells are not overwritten
   - quantity/package columns are not overwritten
   - `Change log` sheet appears
   - `Not found` sheet appears
   - duplicate mode first/last/min/max still works
