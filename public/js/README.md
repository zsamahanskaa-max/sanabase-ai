# SanaBase frontend modularization map

`public/app.js` is currently a single browser script that depends on shared globals
(`state`, `$`, `on`, `persist`, `render`, and many DOM ids). Splitting it into
runtime modules in one pass would be risky for the static GitHub Pages deployment.

Safe future module boundaries:

- `public/js/state.js`
  - `loadState`
  - `persist`
  - `normalize*`
  - localStorage keys
- `public/js/documents.js`
  - file import
  - document extraction fallback
  - knowledge base rendering
- `public/js/crm.js`
  - `saveCrmQuickDeal`
  - `renderCrmOperatingPanel`
  - `crmDealRows`
  - CRM reports and import mapping
- `public/js/tasks.js`
  - task form
  - checklist migration
  - `taskCard`
  - task board rendering
- `public/js/cfo.js`
  - Sana CFO state
  - audit warnings
  - auto report generator
  - CFO chat mock
- `public/js/assistant.js`
  - AI chat
  - SanaBot/Mimo
  - local assistant fallbacks
- `public/js/render.js`
  - top-level `render`
  - navigation
  - cross-module dashboards

Refactor rule:

Keep the existing `localStorage` keys and exported browser function names stable
until all inline HTML handlers and event bindings are migrated.
