# SanaBase / Zhadyra AI OS Roadmap

Бұл файл SanaBase жобасының қазіргі архитектурасын, аяқталған refactor жұмыстарын және келесі қауіпсіз даму бағытын көрсетеді. Runtime code өзгермейді.

## 1. Current Architecture

SanaBase қазір static frontend + Node API форматында жұмыс істейді.

- Frontend shell: `index.html`, `public/index.html`
- Main UI logic: `public/app.js`
- Styles: `public/styles.css`
- Frontend helper modules: `public/js/*.js`
- Backend server: `server.js`
- API endpoints: `api/ai.js`, `api/import.js`
- Database schema draft: `supabase_schema.sql`
- Storage now: `localStorage`
- Later storage target: Supabase / PostgreSQL

App негізгі data-ны браузердегі `localStorage` ішінде сақтайды. Бұл MVP үшін ыңғайлы, бірақ бірнеше құрылғы, команда, cloud backup және real database керек болғанда Supabase/PostgreSQL-ға көшу қажет.

## 2. Refactor Completed

`public/app.js` өте үлкен болғандықтан, қауіпсіз түрде тек helper деңгейіндегі кодтар бөлек файлдарға шығарылды.

Аяқталған frontend extraction:

- `public/js/utils.js` - date, money, escape, list, keyword helper functions
- `public/js/storage.js` - localStorage read/write helper functions
- `public/js/api.js` - frontend API request wrappers
- `public/js/documents.js` - file/document import helper functions
- `public/js/spreadsheet.js` - Excel/CSV/TSV core helper functions
- `public/js/priceMatching.js` - price matching helper functions және `mergeByCode`

`matchPrices` әлі `public/app.js` ішінде қалды. Бұл дұрыс, себебі ол DOM, UI state, file input және download flow-ға қатты байланысқан.

Script loading order:

1. `utils.js`
2. `storage.js`
3. `api.js`
4. `spreadsheet.js`
5. `documents.js`
6. `priceMatching.js`
7. `app.js`

## 3. Target Product Vision

SanaBase мақсаты - Жадыраның бизнесіне арналған жеке AI OS жасау.

Негізгі vision:

- B2B мектептерге тауар жеткізу бизнесін басқару
- Электр тауарлар магазині мен Kaspi магазинін басқару
- Клиенттер, мектептер, заказдар, қарыздар, склад және құжаттарды бір жерде көру
- Excel, Word, PDF, 1C export/import файлдарын талдау
- CFO dashboard арқылы ақша, маржа, налог, дебиторка, кредиторка бақылау
- Mimo assistant арқылы күнделікті ескерту, quick action және AI chat
- Кейін cloud database қосып, телефоннан да тұрақты қолдану

## 4. Core Modules

### Clients / Schools CRM

Мақсаты:

- Мектептерді, клиенттерді, контакт адамдарды және қарыз статусын сақтау
- Әр мектеп бойынша заказ history, payment history, document status көру
- WhatsApp message draft жасау

Керек fields:

- client name
- school name
- BIN/IIN
- phone
- contact person
- debt amount
- last payment date
- comment

### Order Pipeline

Мақсаты:

- Заказды жаңа күйден жабылған күйге дейін бақылау
- Заказ status, payment status, document status, ESF status, 1C status көру

Pipeline мысалы:

1. Жаңа заказ
2. Баға есептелді
3. Клиентке жіберілді
4. Жеткізілді
5. Реализация жасалды
6. ЭСФ жіберілді
7. Төленді
8. Жабылды

### Document AI

Мақсаты:

- PDF, Word, Excel, text құжаттарды оқу
- Құжат түрін анықтау
- Құжаттан клиент, сумма, дата, тауар, қарыз сияқты ақпараттарды шығару
- Brain / Knowledge base ішіне сақтау

Құжат түрлері:

- счет
- договор
- накладной
- реализация
- ЭСФ
- акт сверки
- Kaspi выписка
- 1C export

### CFO Finance Dashboard

Мақсаты:

- Ақша қозғалысын, пайда/шығынды, маржаны және қарыздарды көру
- ОУР режиміндегі ИП үшін налогқа дайындық checklist беру
- Айлық және жарты жылдық report жасау

Негізгі KPI:

- бүгінгі түсім
- айлық түсім
- жалпы шығын
- таза пайда
- клиенттер қарызы
- поставщиктерге қарыз
- касса қалдығы
- банк қалдығы
- маржа
- налогқа дайындық status

Маңызды: нақты налог ставкасы мен мерзімін әрқашан актуалды заңнамамен тексеру керек.

### 1C Excel Analyzer

Мақсаты:

- 1C-тен шыққан Excel файлдарды оқу
- Реализация, платеж, склад, контрагент, номенклатура бойынша анализ жасау
- Қай құжат жетіспейтінін көрсету
- Қандай order 1C ішінде толық жабылмағанын табу

Файл түрлері:

- реализации
- счета
- платежи
- остатки склада
- номенклатура
- контрагенты
- акт сверки

### Price Matching

Мақсаты:

- Екі Excel файлды code арқылы салыстыру
- Бірдей code бар тауарларға price file ішіндегі бағаны қою
- Quantity/package/formula cell қорғалуын сақтау
- Change log және Not found sheet шығару

Қазір:

- `mergeByCode` бөлек `public/js/priceMatching.js` ішіне шығарылды
- `matchPrices` app.js ішінде қалды
- Formula protection сақталған

### Tasks And Reminders

Мақсаты:

- Күнделікті tasks, checklist, reminder сақтау
- Маңызды дата мен deadline бойынша ескерту шығару
- Тапсырманы ертеңге ауыстыру
- Checklist пункттерін done / not done белгілеу

Кейін керек:

- browser notification
- calendar integration
- recurring tasks
- overdue priority

### Mimo Assistant

Мақсаты:

- Сайттың ішінде тірі digital companion сияқты көмектесу
- Quick actions арқылы бүгінгі жоспар, қарыз, заказ, склад, report көрсету
- Task орындалғанда қуану
- Қарыз, deadline, склад азайғанда ескерту

Қазір MVP:

- Floating assistant
- mock replies
- local logic

Кейін:

- real AI API
- CRM/CFO/Tasks context reading
- proactive reminders
- voice input

## 5. Priority Order

Ұсынылатын даму тәртібі:

1. Data model тұрақтандыру
2. CRM және order pipeline-ды толық көрінетін ету
3. Excel/1C import нәтижесін нақты business entities-ке map жасау
4. CFO dashboard-ты нақты data-мен байланыстыру
5. Document AI import history және duplicate cleanup қосу
6. Tasks/reminders-ті CRM/CFO events-пен байланыстыру
7. Mimo assistant-ті real app context арқылы жауап беретін ету
8. Supabase/PostgreSQL cloud database қосу
9. Role/auth/workspace structure қосу
10. Mobile UX және deploy тұрақтандыру

## 6. Database Tables Needed Later

Supabase/PostgreSQL үшін кейін керек негізгі tables:

- `workspaces`
- `users`
- `workspace_members`
- `clients`
- `schools`
- `suppliers`
- `products`
- `orders`
- `order_items`
- `payments`
- `documents`
- `document_links`
- `imports`
- `import_rows`
- `crm_reports`
- `cfo_reports`
- `tax_tasks`
- `audit_rules`
- `tasks`
- `task_items`
- `reminders`
- `notes`
- `brain_folders`
- `brain_items`
- `assistant_messages`
- `activity_log`

Негізгі relation:

- әр record ішінде `workspace_id` болуы керек
- user access RLS арқылы тексерілуі керек
- import files бастапқы raw data ретінде сақталуы керек
- parsed data бөлек normalized tables ішіне түсуі керек

## 7. Risks

Негізгі risks:

- `public/app.js` әлі үлкен, сондықтан үлкен өзгерістер regression тудыруы мүмкін
- localStorage бір құрылғыға ғана тәуелді
- Excel файлдар әр клиентте әртүрлі format-та болуы мүмкін
- 1C export column names тұрақты болмауы мүмкін
- CFO/tax module нақты заңдық есепті толық алмастырмайды
- AI қате interpretation жасауы мүмкін, сондықтан адам растауы керек
- Supabase RLS дұрыс жасалмаса, data leak қаупі бар
- Browser file parsing үлкен Excel/PDF файлдарда баяу болуы мүмкін

## 8. Next 5 Safe Development Steps

1. `matchPrices` функциясын тек analysis жасау
   - Line range
   - DOM dependency
   - state dependency
   - safe extraction possibility

2. CRM data model audit жасау
   - Қазіргі order/client fields қандай
   - Қандай fields жетіспейді
   - localStorage migration керек пе

3. CRM UI-ды redesign емес, clarity pass жасау
   - Filters
   - Search
   - Empty state
   - Full order detail modal

4. CFO dashboard-ты CRM/order/payment data-мен байланыстыру
   - KPI formulas
   - debt warnings
   - margin warnings
   - missing document warnings

5. Supabase migration plan жазу
   - Tables
   - RLS policy
   - localStorage to cloud sync strategy
   - development vs production security mode

