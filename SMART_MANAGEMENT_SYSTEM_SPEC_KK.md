# SanaBase Smart Management System Spec

Күні: 2026-07-03

Мақсат: SanaBase-ты жай CRM емес, бизнес пен жеке өмірді бір жүйеде ақылды басқаруға арналған Smart Business/Life Operating System деңгейіне көтеру.

Бұл құжат product/architecture spec ретінде басталды. Кейін Phase 1 MVP implementation нәтижесімен толықтырылды.

Implementation update: Phase 1 MVP басталды. Backup Center ішіне Version History / Undo панелі, manual restore point, latest restore, restore point export және import/cloud load алдында restore point сақтау логикасы қосылды.

## 1. Vision

SanaBase тек клиенттерді, заказдарды немесе тапсырмаларды сақтайтын CRM болмауы керек. Ол Жадыраның екі бизнесін, жеке мақсаттарын, құжаттарын, қаржысын, 1C/Excel деректерін және күнделікті шешім қабылдау процесін бір ортаға жинайтын smart operating system болуы керек.

Негізгі vision:

- Барлық маңызды дерек бір жерде сақталады.
- Жүйе деректі жай көрсетпейді, оны түсіндіреді.
- Қауіп, қарыз, кешіккен заказ, жетіспейтін құжат, backup/cloud sync проблемасын өзі байқайды.
- Әр проблемаға нақты next action ұсынады.
- Қауіпті әрекетті автоматты орындамайды, user confirmation сұрайды.
- Mimo күн сайын қысқа command brief беріп, ең маңызды 3 фокусты көрсетеді.

SanaBase болашақта мына рөлдерді біріктіреді:

- CRM manager
- CFO / AI Бас бухгалтер
- 1C Excel analyzer
- Document inspector
- Task/reminder manager
- Client memory
- Backup/cloud guardian
- Personal AI operating assistant

## 2. Core Concept

SanaBase жұмыс логикасы:

`Data -> Analysis -> Risk -> Next Action -> User Confirmation -> Result`

Түсіндіру:

- `Data`: localStorage, Cloud Sync, Backup, Excel/1C import, CRM forms, tasks, notes, documents.
- `Analysis`: жүйе деректерді байланыстырып, қарыз, кешіккен тапсырма, stuck order, missing document сияқты жағдайды түсінеді.
- `Risk`: қауіпті немесе назар керек нәрсені бөлек шығарады.
- `Next Action`: нақты әрекет ұсынады: WhatsApp text copy, task жасау, reminder қою, client profile ашу, backup export, cloud save.
- `User Confirmation`: destructive немесе business-impact әрекет алдында міндетті түрде растау сұрайды.
- `Result`: әрекеттен кейін status/log/history сақталады.

Ешқандай қауіпті әрекет автоматты жасалмайды:

- Delete автоматты емес.
- Archive автоматты емес.
- WhatsApp send автоматты емес.
- Payment/status change автоматты емес.
- Cloud restore/import автоматты емес.
- Тек user click/confirmation арқылы орындалады.

## 3. Main Layers

### Data Safety Layer

SanaBase дерек жоғалтпау үшін бірінші қорғаныс қабаты.

Міндеттері:

- Backup Center export/import.
- Supabase Cloud Sync.
- Emergency backup before import/cloud load.
- Version History.
- Undo/Restore.
- Last saved/cloud/backup status.
- Backup reminder.

### Unified Business Memory

Барлық бизнес объектілерін бір-бірімен байланыстыратын memory қабаты.

Міндеттері:

- Client 360 profile.
- Order history.
- Debt history.
- Tasks/reminders байланысы.
- Documents/1C imports байланысы.
- Notes and context memory.

### Mimo Intelligence Core

Mimo деректерді қарап, user-ге қысқа әрі нақты ұсыныс беретін intelligence қабаты.

Міндеттері:

- Daily command brief.
- Top 3 focus.
- Risk warning.
- Next action suggestion.
- Backup/cloud safety warning.

### Risk Scanner

Деректерден қауіпті жағдайларды табатын scanner.

Міндеттері:

- Overdue tasks.
- Stale orders.
- Debt risks.
- Missing ESF/documents.
- Low margin.
- No recent backup/cloud sync.

### Smart Next Action Engine

Әр risk бойынша нақты action ұсынатын engine.

Міндеттері:

- Copy WhatsApp text.
- Create task.
- Create reminder.
- Open client profile.
- Open order detail.
- Export backup.
- Save to cloud.

### Dashboard Command Center

Күнделікті басқару орталығы.

Міндеттері:

- Today focus.
- Critical risks.
- Debt summary.
- Stuck orders.
- Today tasks.
- Backup/cloud status.
- Mimo recommendations.

### Reports & Insights

Бизнес және жеке productivity есептері.

Міндеттері:

- Daily report.
- Weekly report.
- Monthly CFO summary.
- B2B school debt report.
- Store/Kaspi stock and sales insights.
- 1C reconciliation insights.

### Automation With Confirmation

Қауіпсіз automation қабаты.

Міндеттері:

- Reminder suggestion.
- Task creation suggestion.
- Status change suggestion.
- Backup/cloud reminder.
- Барлық маңызды action user confirmation арқылы ғана.

## 4. Data Safety Layer

Data Safety Layer SanaBase үшін foundational layer болуы керек. Жүйе пайдалы болуы үшін ең алдымен дерек жоғалмауы керек.

Компоненттер:

- `Backup Center`: барлық localStorage деректі JSON ретінде export/import жасайды.
- `Supabase Cloud Sync`: ноутбук пен телефон арасында sync жасауға арналған cloud layer.
- `Emergency backup`: restore/import/cloud load алдында current local деректің snapshot файлын сақтайды.
- `Version History`: әр маңызды save/import/cloud load алдында snapshot history сақтау.
- `Undo/Restore`: соңғы restore/import әрекетін қайтаруға мүмкіндік.
- `Last saved status`: соңғы local save, backup export, cloud save/load уақыттарын көрсетеді.

Қазіргі foundation:

- `sanabase-state` негізгі state сақтайды.
- `sanabase-safety-meta` safety timestamp metadata үшін қолданылады.
- Emergency backup before import/cloud load бірінші MVP ретінде қосылды.

Келесі improvement:

- Version History list UI.
- Restore point browser.
- One-click rollback.
- Backup integrity check.
- Notes included check.

## 5. Unified Business Memory

Unified Business Memory барлық деректерді бөлек-бөлек емес, байланысқан business graph ретінде қарауы керек.

Негізгі байланыстар:

- `Client -> Orders`
- `Client -> Debts`
- `Client -> Tasks`
- `Client -> Reminders`
- `Client -> Documents`
- `Client -> 1C imports`
- `Order -> Pipeline`
- `Order -> Payment`
- `Order -> WhatsApp follow-up`
- `Task -> Client/Order`

Client memory ішінде:

- Клиент атауы.
- Мектеп атауы.
- БИН.
- Контакт адам.
- Телефон/WhatsApp.
- Қарыз лимиті.
- Соңғы заказ.
- Соңғы төлем.
- Жиі алатын товарлар.
- Құжат статусы.
- Notes/comments.
- Risk flags.

Order memory ішінде:

- Order number.
- Client/school.
- Product list.
- Pipeline status.
- Total/paid/debt.
- Margin.
- Document status.
- ESF status.
- 1C status.
- WhatsApp follow-up text.
- Related tasks/reminders.

## 6. Mimo Intelligence Core

Mimo SanaBase ішіндегі smart companion болуы керек. Ол жай chatbot емес, деректерді қарап, user-ге басқару шешімін жеңілдететін assistant.

Modes:

- `Daily Mode`
- `CFO Mode`
- `CRM Mode`
- `1C Mode`
- `Document Mode`
- `Backup Mode`

Mimo міндеттері:

- Daily command brief.
- Top 3 focus.
- Debt warning.
- Stuck order warning.
- Task/reminder warning.
- Backup/cloud warning.
- Next action suggestion.

Daily Mode:

- Бүгінгі жоспар.
- Бүгінгі task.
- Мерзімі өткен task.
- Бүгінгі клиент/қарыз follow-up.
- Backup/cloud status.

CFO Mode:

- Debt summary.
- Cash flow warning.
- Low margin warning.
- Missing category/payment warning.
- ОУР/салық reminder.

CRM Mode:

- Client risk.
- Stuck orders.
- Client follow-up.
- Missing contact data.
- Debt WhatsApp text.

1C Mode:

- Realization without payment.
- Payment without realization.
- Missing ESF.
- Nomenclature mismatch.
- Reconciliation difference.

Document Mode:

- Document type detection.
- Missing BIN/date/signature warning.
- Auto tag suggestion.
- Link document to client/order.

Backup Mode:

- Last backup status.
- Last cloud sync status.
- Emergency backup reminder.
- Cloud/local conflict warning.

## 7. Risk Scanner

Risk Scanner SanaBase деректерінен user назар аударуы керек нәрсені табады.

Risk types:

- `overdue task`
- `debt limit exceeded`
- `stale pipeline order`
- `low margin order`
- `missing ESF`
- `realization without payment`
- `payment without realization`
- `no recent backup`
- `no recent cloud sync`
- `missing client contact`
- `missing document data`

Risk object draft:

```json
{
  "id": "risk-id",
  "type": "stale_pipeline_order",
  "severity": "high",
  "title": "Заказ статусында тұрып қалды",
  "description": "Заказ 5 күннен бері supplier_sent статусында.",
  "entityType": "order",
  "entityId": "order-id",
  "nextActions": ["copy_whatsapp", "create_task", "open_order_detail"]
}
```

Severity levels:

- `critical`: ақша/құжат/restore risk.
- `high`: қарыз, stuck order, deadline.
- `medium`: missing data, no recent sync.
- `low`: толықтыру керек metadata.

## 8. Smart Next Action Engine

Әр risk үшін system нақты action ұсынуы керек.

Action types:

- `copy WhatsApp text`
- `create task`
- `create reminder`
- `open client profile`
- `open order detail`
- `change status with confirmation`
- `export backup`
- `save to cloud`

Action rules:

- Action suggestion автоматты көрінеді.
- Action execution user click арқылы ғана.
- Destructive немесе overwrite action алдында confirm керек.
- WhatsApp message тек copy болады, автоматты send болмайды.
- Status/payment/archive өзгерісі user confirmation арқылы ғана.

Examples:

- Debt risk -> WhatsApp қарыз мәтінін copy + reminder жасау.
- Stale order -> supplier follow-up text + task жасау.
- No backup -> Backup Center ашу + export backup button.
- Missing ESF -> ESF reminder task + order detail ашу.
- Payment without realization -> 1C Analyzer tab ашу + reconciliation task.

## 9. Dashboard Command Center

Dashboard SanaBase-тың басқару орталығы болуы керек. User сайтты ашқанда бірден бүгін не маңызды екенін көруі керек.

Dashboard-та болсын:

- Today focus.
- Critical risks.
- Debt summary.
- Stuck orders.
- Today tasks.
- Backup/cloud status.
- Mimo recommendations.
- Quick action buttons.

Recommended layout:

- Top row: Today focus + Mimo brief.
- KPI row: debt, tasks, orders, backup/cloud.
- Risk panel: critical/high risks.
- Next actions panel: suggested actions.
- Business tabs: B2B schools, store/Kaspi, personal OS.
- Safety panel: last backup, last cloud sync, emergency backup status.

Quick action buttons:

- Backup export.
- Save to cloud.
- Create task.
- Create reminder.
- Open CRM.
- Open CFO.
- Open 1C analyzer.
- Ask Mimo.

## 10. Safety Rules

SanaBase safety rules міндетті:

- No automatic delete.
- No automatic overwrite.
- No automatic archive.
- No automatic WhatsApp send.
- No automatic payment/status change.
- Confirmation required for destructive actions.
- Emergency backup before restore/import/cloud load.
- Cloud load алдында user confirmation керек.
- Backup import алдында user confirmation керек.
- Wrong file import болса restore жасалмайды.
- Sensitive key/password/ЭЦП сұралмайды.
- Service role key frontend-ке салынбайды.
- Financial/legal decision final болмайды, user және қажет болса бухгалтер/консультант тексереді.

Dangerous action examples:

- Delete client/order/task.
- Archive client.
- Restore backup.
- Load from cloud.
- Change payment status.
- Mark order paid.
- Send ESF.
- Send WhatsApp message.

Барлығы user confirmation немесе explicit click арқылы ғана.

## 11. MVP Implementation Plan

### Phase 1: Version History + Undo

Мақсат: дерек жоғалу risk-ін минимумға түсіру.

Scope:

- Restore point жасау.
- Version History UI.
- Last 10 snapshots.
- Undo latest import/cloud load.
- Backup integrity check.

Неге бірінші:

- Smart system көп дерекпен жұмыс істейді.
- Data safety болмаса, intelligence layer қауіпті болады.

### Phase 2: Mimo Daily Command Brief

Мақсат: Mimo сайт ашылғанда бүгінгі top 3 focus берсін.

Scope:

- Today tasks.
- Overdue tasks.
- Debts.
- Stuck orders.
- Backup/cloud status.
- Top 3 focus.

### Phase 3: Risk Scanner MVP

Мақсат: ең маңызды risk-терді автоматты табу.

Scope:

- Overdue task.
- Stale pipeline order.
- Debt warning.
- No recent backup.
- No recent cloud sync.
- Missing client contact.

### Phase 4: Smart Next Action Buttons

Мақсат: risk көрінсе, user бірден action жасай алсын.

Scope:

- Copy WhatsApp text.
- Create task.
- Create reminder.
- Open client profile.
- Open order detail.
- Export backup.
- Save to cloud.

### Phase 5: Client 360 Profile

Мақсат: әр client бойынша толық memory.

Scope:

- Overview.
- Orders.
- Debts.
- Documents.
- Tasks.
- Notes.
- WhatsApp texts.
- Risk history.

### Phase 6: Debt Control Center

Мақсат: B2B мектептер және магазин/Kaspi қарызын нақты бақылау.

Scope:

- Total debt.
- Overdue debt.
- Client debt ranking.
- Payment follow-up.
- WhatsApp templates.
- Reminder schedule.

### Phase 7: 1C Analyzer

Мақсат: Excel/1C файлдарын салыстырып, қате табу.

Scope:

- Realization vs payment.
- Payment without realization.
- Missing ESF.
- Nomenclature mismatch.
- Reconciliation difference.

### Phase 8: Document Inspector

Мақсат: PDF/Word/Excel құжаттарды client/order/document memory-ге қосу.

Scope:

- Document type detection.
- Amount/date/BIN extraction.
- Missing field warning.
- Auto tag suggestion.
- Link to client/order.

## 12. Acceptance Checklist

- System shows top 3 daily focus.
- System detects at least one risk.
- System suggests next action.
- System does not perform destructive action automatically.
- Backup/cloud safety visible.
- CRM/Tasks/Backup/Cloud Sync not broken.
- Mimo recommendations are visible and understandable.
- User confirmation required for destructive actions.
- Emergency backup happens before restore/import/cloud load.
- Console error жоқ.

## Қорытынды

SanaBase-тың келесі үлкен бағыты - smart management жүйеге айналу. Ең дұрыс бірінші қадам: Data Safety толық бекіту, содан кейін Mimo Daily Command Brief және Risk Scanner MVP қосу. Осыдан кейін ғана automation және deeper AI analysis қосу қауіпсіз болады.
