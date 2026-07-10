# SanaBase Product Audit

Күні: 2026-07-10

Мақсат: SanaBase жобасының қазіргі күйін өнім ретінде бағалау, қай жері мықты, қай жері әлсіз, және толыққанды өшпейтін көпфункционалды базаға айналу үшін нақты бағыт беру.

Бұл құжат runtime code өзгертпейді. Бұл product, architecture және UX decision құжаты.

## 1. Қазіргі Жоба Қысқаша

SanaBase қазір static frontend + Node API + localStorage + Supabase Cloud Sync MVP форматында жұмыс істейді.

Негізгі файлдар:

- `public/index.html` және root `index.html` - app shell.
- `public/app.js` - негізгі runtime logic. Қазір өте үлкен файл.
- `public/styles.css` - негізгі UI style.
- `public/js/*` - helper modules: utils, storage, API, documents, spreadsheet, price matching, cloud sync.
- `server.js` - local Node server, `/api/ai` және `/api/import`.
- `supabase_cloud_sync.sql` - cloud sync MVP table schema.

Қазіргі сақтау моделі:

- Негізгі data: `localStorage`.
- Негізгі key: `sanabase-state`.
- Қосымша legacy/compatibility keys: `goals`, `projects`, `challenges`, `zhadyra_*`, `sanabase-*`, `sanabot-*`.
- Backup Center барлық маңызды key-лерді JSON ретінде export/import жасайды.
- Cloud Sync MVP localStorage payload-ты Supabase-та JSON ретінде сақтайды.

## 2. Қазіргі Мықты Жақтары

### Нақты Бизнес Workflow Бар

SanaBase тек идея емес, нақты күнделікті бизнес операцияларын жаба бастады:

- тауар базасы;
- сатылым;
- приход;
- склад қалдығы;
- қате сатылымды өшіру;
- накладной және гарантия;
- клиенттер;
- қарыз;
- CFO dashboard;
- 1C Excel import;
- barcode scanner;
- WhatsApp мәтіндері;
- task/reminder;
- backup және cloud sync.

Бұл шағын бизнеске нақты пайдалы foundation.

### Offline-First Жұмыс Істейді

localStorage арқасында app интернетсіз де ашылып, дерек сақтай алады. Бұл дүкенде немесе телефонда қолдануға ыңғайлы.

### Safety Layer Басталған

Backup Center, emergency backup, version history және cloud sync бар. Бұл дерек жоғалу қаупін азайтады.

### Multi-Device Бағыты Бар

Supabase Cloud Sync MVP қосылған. Телефон мен ноутбук арасында data payload sync идеясы жұмыс істей бастады.

### Product Vision Кең

Жоба жай CRM емес:

- business OS;
- personal OS;
- second brain;
- CFO assistant;
- document analyzer;
- Mimo assistant.

Бұл дұрыс дамытылса, бірегей өнім болуы мүмкін.

## 3. Ең Үлкен Әлсіз Жерлер

### 1. Data Layer Production Деңгейде Емес

Қазір негізгі data browser localStorage ішінде. Бұл MVP үшін жақсы, бірақ production үшін қауіпті:

- browser cache тазаланса дерек жоғалады;
- басқа device-де data бөлек болады;
- conflict дұрыс шешілмесе ескі data жаңа data-ны басып кетуі мүмкін;
- бір company ішінде бірнеше user/role жасау қиын;
- audit/report жасау қиындайды.

Қорытынды: нағыз өшпейтін база үшін Supabase/PostgreSQL table-based database керек.

### 2. `public/app.js` Өте Үлкен

`public/app.js` ішінде көптеген module logic араласып тұр:

- CRM;
- CFO;
- tasks;
- goals;
- electro;
- scanner;
- documents;
- Mimo;
- backup;
- cloud;
- 1C;
- render.

Бұл regression risk тудырады. Бір функцияны өзгерткенде басқа жер бұзылуы мүмкін.

Қорытынды: жаңа feature қоспас бұрын app.js-ты біртіндеп module-дерге бөлу керек.

### 3. UI Көп Функциядан Ауырлаған

Қазір app ішінде көп module бар. Қолданушыға бірінші ашқанда не істеу керек екені бірден түсініксіз болуы мүмкін.

Қорытынды: mode-based UI керек:

- Core Business Mode;
- Electro Store Mode;
- B2B Schools Mode;
- CFO Mode;
- Personal OS Mode;
- Advanced Tools.

### 4. Scanner Browser-ге Тәуелді

Barcode scanner web browser мүмкіндігіне тәуелді:

- iPhone/Safari native barcode support әлсіз;
- camera permission әр браузерде әртүрлі;
- live video decoding тұрақсыз;
- photo capture fallback бар, бірақ production-level scanner емес.

Қорытынды: scanner көмекші құрал болсын, ал main reliable path - manual code/search.

### 5. 1C / Excel Import Әлі Mapping Wizard Емес

Excel файлдар әртүрлі болуы мүмкін. Қазір автомат тану бар, бірақ user өзі:

- қай колонка code;
- қай колонка name;
- қай колонка qty;
- қай колонка purchase price;
- қай колонка sale price;
- қай колонка counterparty;

деп mapping жасай алуы керек.

Қорытынды: 1C/Excel Import Wizard керек.

### 6. AI Assistant Әлі Толық Intelligence Емес

Mimo/Risk scanner жақсы foundation, бірақ әлі толық “ақылды менеджер” емес.

Керек:

- daily command brief нақты data-дан шықсын;
- risk scanner толық rules engine болсын;
- әр risk бойынша next action болсын;
- user confirmation міндетті болсын;
- action history сақталсын.

### 7. Accounting Module Заңдық Risk Тудырады

`AI Бас бухгалтер` пайдалы, бірақ “бухгалтерді толық алмастырады” дегендей көрінбеуі керек.

Қорытынды: wording қауіпсіз болуы керек:

- “AI бухгалтер көмекші”;
- “ескерту және бақылау жүйесі”;
- нақты салық/заң бойынша “актуалды заңнамамен тексеріңіз” warning.

## 4. Product Readiness Бағасы

### Қазіргі деңгей

MVP+ / prototype product.

### Күнделікті өз бизнесіңізге қолдануға жарай ма

Иә, бірақ абайлап:

- backup жиі жасау керек;
- cloud sync status тексеру керек;
- маңызды құжатты 1C/Excel original-пен салыстыру керек;
- scanner шықпаса manual code қолдану керек.

### Басқа адамдарға сатуға дайын ба

Әлі жоқ.

Себебі:

- data layer production емес;
- onboarding жоқ;
- role/account/company model толық емес;
- UX тым кең әрі ауыр;
- import/scanner әр device-де тұрақсыз болуы мүмкін;
- error logging және support diagnostics жоқ.

## 5. Сатылымға Жақындау Үшін Ең Қажет 10 Нәрсе

1. Supabase/PostgreSQL table-based database.
2. Company/workspace model.
3. User auth және role.
4. Core Business Mode.
5. Product catalog + stock movement тұрақтандыру.
6. Sales / Receipt / Nakladnaya / Debt flow толық жабу.
7. Excel/1C Import Wizard.
8. Backup/Cloud status always visible.
9. Error diagnostics panel.
10. Clean onboarding.

## 6. Recommended Product Direction

Қазір ең дұрыс бағыты:

**SanaBase Core v1 - шағын бизнеске арналған басқару базасы.**

Core v1 мақсаты:

- сатушы телефоннан тауарды тауып сата алады;
- товар базаға қосылады;
- қалдық автомат өзгереді;
- чек/накладной жасалады;
- төлем және қарыз тіркеледі;
- клиент/мектеп бойынша қарыз көрінеді;
- data телефон/ноутбук арасында жоғалмайды;
- backup және cloud status түсінікті.

## 7. Негізгі Шешім

SanaBase-ты “бәрін бірден істейтін AI OS” ретінде емес, алдымен нақты бір күшті өнім ретінде бекіту керек:

**Тауар + Сатылым + Склад + Клиент + Қарыз + Құжат + Cloud.**

Осы foundation мықты болғаннан кейін ғана Mimo, CFO, 1C, Personal OS, advanced AI қосу қауіпсіз болады.

