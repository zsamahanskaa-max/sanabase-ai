# SanaBase smoke test

Run the local server:

```bash
node server.js
```

Open:

```text
http://localhost:5173/
```

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

## Pass criteria

- `public/js/utils.js` loads before `public/app.js`.
- `public/js/storage.js` loads after `utils.js` and before `public/app.js`.
- `public/js/api.js` loads after `storage.js` and before `public/app.js`.
- `public/js/spreadsheet.js` loads after `api.js` and before `documents.js`.
- `public/js/documents.js` loads after `spreadsheet.js` and before `priceMatching.js`.
- `public/js/priceMatching.js` loads after `documents.js` and before `public/app.js`.
- `window.SanaUtils` exists.
- `window.SanaStorage` exists.
- `window.SanaApi` exists.
- `window.SanaSpreadsheet` exists.
- `window.SanaDocuments` exists.
- `window.SanaPriceMatching` exists.
- No `SanaUtils is undefined` error appears.
- No `SanaStorage is undefined` error appears.
- No `SanaApi is undefined` error appears.
- No `SanaSpreadsheet is undefined` error appears.
- No `SanaDocuments is undefined` error appears.
- No `SanaPriceMatching is undefined` error appears.
- CRM, tasks, CFO, import, and AI fallback still work.
