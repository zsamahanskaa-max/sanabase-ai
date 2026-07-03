# Sana Mimo v2 Design Spec

Бұл құжат SanaBase / Zhadyra AI OS ішіндегі Mimo assistant үшін келесі intelligence қабатын сипаттайды. Бұл spec runtime code емес: мұнда жазылған behavior кейін жеке қауіпсіз қадамдармен implement жасалады.

## Sana Mimo Intelligence Requirements

### 1. Daily Command Brief

Mimo күн сайын қолданушыға қысқа command brief беруі керек:

- бүгінгі task тізімі
- бүгінгі debt / қарыз сигналы
- stuck orders / тоқтап қалған заказдар
- backup/cloud status
- top 3 focus

Brief форматы қысқа болуы керек:

1. Бүгін ең маңызды 3 нәрсе
2. Қауіп бар жер
3. Қандай action басу керек

### 2. Risk Scanner

Mimo жүйедегі тәуекелдерді автоматты түрде оқып, бірақ destructive action жасамай көрсетуі керек:

- debt limit exceeded
- overdue tasks
- stale pipeline orders
- low margin orders
- missing ESF
- no recent backup

Әр risk үшін Mimo мынаны көрсетеді:

- мәселе
- қауіп деңгейі
- нақты next action
- қай module ашу керек

### 3. Debt Watcher

Mimo клиент қарыздарын бақылауы керек:

- client debt
- total debt
- overdue debt
- WhatsApp follow-up suggestion
- reminder suggestion

Mimo қарыз бойынша WhatsApp мәтінін тек дайындайды. Өз бетімен жібермейді.

### 4. Order Pipeline Watcher

Mimo order pipeline ішіндегі тоқтап қалған заказдарды табуы керек:

- order stuck in status
- next best action
- supplier follow-up
- client ready notice
- close order suggestion

Мысалы:

- `supplier_sent` статусында ұзақ тұрса: поставщикке follow-up мәтін ұсыну
- `ready` статусында тұрса: клиентке дайын хабарлама ұсыну
- `paid` статусында тұрса: order close suggestion шығару

### 5. Client Memory

Mimo client profile және CRM деректерінен клиент туралы memory жинауы керек:

- last order
- last payment
- payment behavior
- common products
- notes
- warnings

Бұл memory клиент карточкасын ашқанда және Mimo daily brief ішінде қолданылуы керек.

### 6. Task/Reminder Watcher

Mimo task және reminder тәртібін бақылауы керек:

- overdue tasks
- today tasks
- no-task client warning
- reminder due

Егер клиентте қарыз немесе ашық заказ бар, бірақ task жоқ болса, Mimo `no-task client warning` көрсетуі керек.

### 7. Backup & Cloud Guardian

Mimo data safety үшін Backup Center және Cloud Sync статусын түсінікті бақылауы керек:

- last backup time
- last cloud sync time
- cloud newer/local newer warning
- save before load warning

Маңызды safety rule:

- cloud-тан load жасамас бұрын local backup ұсыну
- cloud newer/local newer conflict болса user таңдауы керек
- overwrite автоматты жасалмайды

### 8. Document Inspector

Mimo жүктелген құжаттарды түсініп, бастапқы inspection беруі керек:

- document type detection
- client detection
- amount extraction
- missing BIN/date/signature warning
- auto tag suggestion

Document Inspector PDF, Word, Excel және image OCR қабатына кейін дайын болуы керек.

### 9. 1C Analyzer Assistant

Mimo 1C Excel және бизнес құжаттарынан бухгалтерлік mismatch табуға көмектесуі керек:

- realization without payment
- payment without realization
- reconciliation difference
- missing ESF
- document number gap
- nomenclature mismatch

Mimo нақты бухгалтерлік action ұсынғанда, 1C бөлім атауын орысша терминмен көрсетуі керек:

- Реализация товаров и услуг
- Банк/Касса выписка
- Контрагенты
- Номенклатура
- ЭСФ
- Акт сверки

### 10. Smart Next Action Engine

Әр alert үшін Mimo нақты next action ұсынуы керек:

- copy WhatsApp
- create task
- create reminder
- open client profile
- open order detail

Next action әрқашан user click арқылы орындалуы керек. Mimo өз бетімен action орындамайды.

### 11. Decision Helper

Mimo қысқа recommendation беруі керек:

- не істеу керек
- неге солай
- қандай risk бар
- қай жерде тексеру керек

Маңызды: Mimo final financial/legal decision автоматты қабылдамайды. Салық, заң, төлем, ЭСФ, декларация, банк action бойынша кәсіби бухгалтер/салық консультантымен тексеру ұсынылады.

### 12. Safety Rules

Mimo ешқашан мынаны автоматты жасамауы керек:

- no automatic delete
- no automatic overwrite
- no automatic archive
- no automatic WhatsApp send
- no automatic payment/order status change without user click

Барлық маңызды action алдында адам растауы керек.

### 13. Mimo Modes

Mimo бірнеше режиммен жұмыс істеуі керек:

- Daily Mode
- CFO Mode
- CRM Mode
- 1C Mode
- Document Mode
- Backup Mode

Әр mode өз контекстін қолданады, бірақ ортақ safety rules сақталады.

### 14. Acceptance Checklist

Sana Mimo v2 дайын деп санау үшін:

- Mimo gives top 3 daily focus
- detects at least one debt risk
- detects stuck order
- shows backup/cloud warning
- suggests next action
- does not perform destructive action automatically

## Кейін Implement Болатын Behavior

Бұл spec бойынша кейін бөлек қауіпсіз қадамдармен мыналар жасалады:

- Mimo metrics aggregator
- risk scanner helper
- debt watcher helper
- pipeline stale order detector
- backup/cloud status reader
- document inspector MVP
- 1C analyzer warning layer
- next action buttons
- mode switcher

## Risks

- Дерек localStorage ішінде болса, басқа құрылғыда cloud sync дұрыс жасалмайынша Mimo толық контекст көрмеуі мүмкін.
- 1C, ESF, салық және қаржы recommendation нақты заңды шешім емес, тек operational assistant деңгейінде болуы керек.
- Auto action қоссақ, қате overwrite/delete/payment risk туады. Сондықтан v2-де барлық sensitive action тек user click және confirm арқылы орындалады.
