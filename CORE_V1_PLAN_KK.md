# SanaBase Core v1 Plan

Күні: 2026-07-10

Мақсат: SanaBase-ты толық қолдануға жарайтын, өшпейтін, көпфункционалды, бірақ түсінікті бизнес базасына айналдырудың бірінші нақты жоспары.

Core v1 - барлық мүмкіндікті емес, ең маңызды күнделікті бизнес workflow-ды тұрақты қылатын версия.

## 1. Core v1 Vision

SanaBase Core v1 мына сұрақтарға нақты жауап беруі керек:

- Менде қандай тауар бар?
- Қанша қалды?
- Қай тауар сатылды?
- Қай тауар келді?
- Қай клиент алды?
- Ақша түсті ме?
- Қарыз қалды ма?
- Накладной/гарантия керек пе?
- Телефон мен ноутбукта бірдей дерек көріне ме?
- Қате болса, қайтаруға бола ма?

## 2. Core v1 Ішінде Қалатын Негізгі Модульдер

### 1. Тауар Базасы / Product Catalog

Міндеті:

- SKU/code/barcode/name арқылы іздеу;
- жаңа тауар қосу;
- edit;
- archive/delete емес, safe archive;
- purchasePrice;
- salePrice;
- stockQty;
- minStock;
- brand/category;
- supplier;
- image optional.

Acceptance:

- code жазғанда тауар бірден табылады;
- name жазғанда suggestion шығады;
- edit refresh кейін сақталады;
- duplicate SKU/barcode warning шығады.

### 2. Сатылым / Sales POS

Міндеті:

- code/barcode/name арқылы тауар таңдау;
- qty енгізу;
- payment method таңдау;
- client optional;
- sale save;
- stock reduce;
- receipt/nakladnaya print;
- қате сатылымды өшіру және stock restore.

Acceptance:

- сатылым save болғанда movement пайда болады;
- stock дұрыс азаяды;
- қате сатылым delete stock-ты қайтарады;
- CFO income row түседі;
- Auto Sync schedule болады.

### 3. Приход / Stock In

Міндеті:

- бар тауарға qty қосу;
- жаңа тауар қосу;
- purchase/sale price update;
- supplier/comment;
- Excel import арқылы көп тауар қосу.

Acceptance:

- приход save болғанда stock өседі;
- movement history пайда болады;
- price update optional түсінікті болады.

### 4. Клиент / Қарыз / CRM Lite

Міндеті:

- клиент/мектеп карточкасы;
- phone/WhatsApp;
- debtLimit;
- orders;
- debts;
- WhatsApp follow-up text.

Acceptance:

- client profile ашылады;
- order/debt көрсетіледі;
- қарыз бойынша WhatsApp мәтін copy болады.

### 5. Құжат / Накладной / Гарантия

Міндеті:

- бірнеше тауар жолы;
- seller profile;
- buyer profile;
- paid/debt;
- print;
- save to CRM/CFO;
- stock reduce optional.

Acceptance:

- маржа сияқты ішкі сөздер print құжатқа шықпайды;
- бірнеше тауар print-та толық көрінеді;
- debt CFO-ға түседі.

### 6. Backup / Cloud Sync

Міндеті:

- local save status;
- cloud save status;
- last sync time;
- conflict warning;
- backup export;
- emergency restore point.

Acceptance:

- user дерек қайда сақталғанын көреді;
- phone/laptop sync түсінікті болады;
- cloud load алдында confirm бар.

## 3. Core v1 UI

Бірінші экранда тек 5 негізгі батырма болсын:

1. Тауар базасы
2. Сату
3. Приход
4. Клиенттер / Қарыз
5. Накладной

Қосымша панель:

- Backup/Cloud status;
- Today sales;
- Low stock;
- Open debts;
- Mimo short warning.

Advanced module-дер бөлек жерде болсын:

- 1C Excel;
- CFO;
- Екінші ми;
- Tasks/Goals;
- Translation;
- Quiz;
- Price matching.

## 4. Database Target

Core v1 үшін кейін керек Supabase tables:

- `workspaces`
- `users`
- `products`
- `stock_movements`
- `sales`
- `sale_items`
- `clients`
- `orders`
- `payments`
- `documents`
- `tasks`
- `settings`
- `audit_logs`

MVP migration:

1. localStorage сақтала береді.
2. Supabase table sync қосылады.
3. Бірінші products/sales/stock movements көшеді.
4. Кейін clients/orders/payments көшеді.
5. Соңында notes/docs/tasks көшеді.

## 5. Implementation Phases

### Phase 1: Core Mode UI

Runtime өзгеріс аз:

- жаңа Core mode section;
- негізгі quick links;
- existing modules-ге route/link;
- артық module-дерді Advanced ішінде жасыру.

Risk төмен.

### Phase 2: Product Catalog Hardening

- duplicate check;
- edit modal;
- archive;
- import preview;
- barcode/manual search priority.

Risk орта.

### Phase 3: Sales Flow Hardening

- cart/multiple sale items;
- payment status;
- receipt;
- undo sale;
- daily report.

Risk орта.

### Phase 4: Stock In Flow Hardening

- supplier;
- bulk import;
- price update rules;
- stock audit.

Risk орта.

### Phase 5: Client Debt Center

- debt list;
- overdue;
- WhatsApp text;
- paid button with confirmation.

Risk орта.

### Phase 6: Table-Based Cloud Database

- Supabase tables;
- RLS;
- migration;
- conflict handling.

Risk жоғары, бірақ product үшін міндетті.

## 6. What “Done” Means

Core v1 дайын деп санау үшін:

- телефоннан тауар сатуға болады;
- ноутбукта сол сатылым көрінеді;
- тауар қалдығы дұрыс;
- қате сатылымды қайтаруға болады;
- клиент қарызы көрінеді;
- накладной print болады;
- backup/cloud status түсінікті;
- refresh кейін дерек жоғалмайды;
- console error жоқ.

## 7. Бірінші Нақты Code Step

Келесі implementation үшін ең қауіпсіз қадам:

**Core Mode shell қосу.**

Файлдар:

- `index.html`
- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `SMOKE_TEST.md`

Scope:

- жаңа `core` view;
- негізгі 5 action card;
- existing electro/crm/backup sections-ге link;
- runtime business logic өзгермейді.

Бұл пайдаланушыға app-ты түсінікті етеді, бірақ бар функцияларды бұзбайды.

