# SanaBase Keep / Hide / Later Decision List

Күні: 2026-07-10

Мақсат: SanaBase ішінде қай модуль core үшін міндетті, қайсысы advanced ретінде қалсын, қайсысын уақытша жасыру керек екенін шешуге көмектесу.

Бұл құжат ештеңені өшірмейді. Тек шешім тізімі.

## 1. Міндетті Қалдыру Керек

### Product Catalog / Тауар Базасы

Статус: қалдыру.

Себеп:

- электро магазин үшін ең негізгі база;
- сатылым, приход, склад бәрі осыған тіреледі.

Жетілдіру:

- duplicate warning;
- edit/ archive;
- import preview;
- barcode/manual search.

### Sales / Сатылым

Статус: қалдыру.

Себеп:

- күнделікті ақша осы жерден жүреді;
- stock және CFO осыған байланысты.

Жетілдіру:

- бірнеше тауардан тұратын cart;
- payment status;
- undo sale;
- receipt/nakladnaya.

### Stock In / Приход

Статус: қалдыру.

Себеп:

- тауар келуі болмаса склад дұрыс болмайды.

Жетілдіру:

- supplier;
- invoice number;
- bulk import;
- purchase price update history.

### Clients / Schools CRM

Статус: қалдыру.

Себеп:

- B2B мектептер және қарыз үшін керек.

Жетілдіру:

- client 360 profile;
- payment behavior;
- debt limit;
- WhatsApp follow-up.

### Nakladnaya / Warranty

Статус: қалдыру.

Себеп:

- нақты бизнес құжат.

Жетілдіру:

- PDF export;
- шаблон таңдау;
- paid/debt action;
- document numbering.

### Backup / Cloud Sync

Статус: қалдыру.

Себеп:

- “өшпейтін база” үшін міндетті.

Жетілдіру:

- visible sync status;
- table-based sync;
- conflict screen;
- restore preview.

## 2. Advanced Ішіне Жасыру Керек

### 1C Excel Analyzer

Статус: жасыру емес, Advanced ішінде қалдыру.

Себеп:

- пайдалы, бірақ күнделікті сатушыға бірінші экранда керек емес.

Жетілдіру:

- column mapping wizard;
- import templates;
- validation report.

### CFO / AI Бас бухгалтер

Статус: Advanced немесе Finance tab ішінде қалдыру.

Себеп:

- бизнес иесіне керек, сатушыға емес.
- заңдық wording абай болу керек.

Жетілдіру:

- “AI CFO көмекші” wording;
- tax disclaimer;
- report generator.

### Price Matching

Статус: Advanced ішінде қалдыру.

Себеп:

- пайдалы арнайы workflow, бірақ core емес.

Жетілдіру:

- separate wizard;
- example template;
- better error messages.

### Documents / Second Brain

Статус: Advanced ішінде қалдыру.

Себеп:

- пайдалы, бірақ Core v1 бизнес workflow-ды ауырлатпауы керек.

Жетілдіру:

- folders;
- tags;
- client/order linking;
- image compression.

### Tasks / Goals / Projects / Habits

Статус: Personal OS mode ішіне бөлу.

Себеп:

- жеке productivity үшін жақсы;
- бизнес сатылым core экранында көп орын алмауы керек.

Жетілдіру:

- business task және personal task бөлек.

### Mimo Assistant

Статус: қалдыру, бірақ тыныш режимде.

Себеп:

- smart assistant identity береді;
- бірақ UI-ды жаппауы керек.

Жетілдіру:

- top 3 focus;
- risk action;
- no decorative overload.

## 3. Уақытша Жасыруға Болатын Модульдер

### Quiz

Статус: уақытша жасыру.

Себеп:

- бизнес core үшін міндетті емес;
- app-ты ауырлатады.

Қай кезде қайтару:

- егер SanaBase learning/knowledge product ретінде бөлек сатылса.

### Translation

Статус: Advanced ішінде немесе уақытша жасыру.

Себеп:

- пайдалы, бірақ core business database емес.

Қай кезде қалдыру:

- егер құжат аудару нақты user workflow болса.

### Decorative Assistant Animations

Статус: азайту.

Себеп:

- business app-та басты focus data/action болуы керек.

Қалдыру:

- fixed small assistant;
- no roaming;
- no screen blocking.

## 4. Қауіпті Немесе Абай Болу Керек Модульдер

### Accounting / Tax Claims

Қауіп:

- нақты салық ставка/мерзім ескі болуы мүмкін;
- user қате шешім қабылдауы мүмкін.

Шешім:

- “көмекші/бақылаушы” деп атау;
- official law check warning;
- ешқашан automatic декларация/payment жасамау.

### Cloud Restore / Import

Қауіп:

- ескі cloud payload жаңа local data-ны басып кетуі мүмкін.

Шешім:

- emergency backup;
- preview;
- conflict screen;
- user confirm.

### Scanner

Қауіп:

- әр телефонда әртүрлі жұмыс істейді.

Шешім:

- manual input негізгі;
- scanner optional;
- photo capture fallback;
- clear status/error.

## 5. Decision Matrix

| Модуль | Core v1 | Advanced | Hide Now | Себеп |
|---|---:|---:|---:|---|
| Product Catalog | yes | no | no | негізгі база |
| Sales | yes | no | no | күнделікті ақша |
| Stock In | yes | no | no | склад дұрыстығы |
| Clients/Debts | yes | no | no | B2B және қарыз |
| Nakladnaya | yes | no | no | құжат workflow |
| Backup/Cloud | yes | no | no | дерек қауіпсіздігі |
| CFO | no | yes | no | owner/finance үшін |
| 1C Excel | no | yes | no | арнайы workflow |
| Documents/Brain | no | yes | no | knowledge layer |
| Tasks/Goals | no | yes | no | personal/business planning |
| Mimo | small | yes | no | assistant, бірақ quiet |
| Translation | no | yes | maybe | core емес |
| Quiz | no | no | yes | business core емес |

## 6. Ұсынылатын Шешім

Бірінші экранда тек Core v1 көрсетілсін:

- Тауар базасы;
- Сату;
- Приход;
- Клиенттер/Қарыз;
- Накладной;
- Backup/Cloud status.

Қалғандары:

- Advanced;
- Finance;
- Personal OS;
- AI Tools.

Осылай SanaBase кәсіби, түсінікті және сатылымға жақын өнімге айналады.

