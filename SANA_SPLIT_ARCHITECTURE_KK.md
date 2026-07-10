# Sana Mind және SanaBase Business бөлу жоспары

## 1. Неге бөлу керек

SanaBase ішінде қазір жеке өмір, мақсат, тапсырма, екінші ми, CRM, склад, бухгалтерия, 1C Excel, накладной, сатылым және AI assistant бірге тұр. Бұл көп функцияны бір жерде жинайды, бірақ күнделікті қолданғанда интерфейс ауыр сезіледі.

Ең дұрыс бағыт:

- **Sana Mind** - жеке AI OS, фокус, жоспар, тапсырма, notes, Mimo.
- **SanaBase Business** - бизнес операциялары, CRM, склад, сатылым, приход, қарыз, накладной, CFO, 1C Excel.

## 2. Sana Mind ішінде қалатын бөлімдер

- Күндік фокус
- Жеке тапсырмалар
- Мақсаттар
- Проекттер
- Әдеттер
- Календарь
- Екінші ми / notes
- Mimo daily assistant
- Business Portal батырмасы

## 3. SanaBase Business ішінде болатын бөлімдер

- Сату
- Тауар базасы
- Приход / склад қозғалысы
- Клиенттер / мектептер CRM
- Қарыз бақылау
- Накладной / гарантия
- AI Бас бухгалтер / CFO
- 1C Excel анализ
- Прайс салыстыру
- Backup / Cloud Sync status

## 4. Екі сайт қалай байланысады

Бірінші MVP-де екі сайт бір repository ішінде static page ретінде тұрады:

- Негізгі сайт: `/`
- Бизнес портал: `/public/business/index.html` немесе `/business/index.html`

Sana Mind немесе Core бетінде бір батырма болады:

- **SanaBase Business ашу**

Business бетінде әр action негізгі app ішіндегі дайын view-ға апарады:

- Сату -> `?view=electro&electro=inventory`
- Тауар базасы -> `?view=electro&electro=catalog`
- CRM -> `?view=crm`
- CFO -> `?view=cfo`
- 1C Excel -> `?view=onec`
- Backup -> `?view=backupCenter`

## 5. Business task логикасы

Кейінгі этапта task ішінде `scope` field қосылады:

- `personal`
- `business`
- `development`

Sana Mind тек personal және development focus көрсетеді, бірақ business task summary береді. Business task толық ашылғанда SanaBase Business бетіне өтеді.

## 6. Дерек сақтау

Бірінші MVP-де дерек бұрынғы localStorage key-лерде қалады. Ешқандай migration жасалмайды.

Кейін:

- ортақ Supabase workspace
- `task.scope`
- `linkedClientId`
- `linkedOrderId`
- `linkedBusinessModule`

## 7. Қауіпсіз көшу тәртібі

1. Бөлек Business portal shell қосу.
2. Негізгі Core беттен Business portal батырмасын қосу.
3. Business task filter қосу.
4. Business-only navigation жеңілдету.
5. Кейін жеке Sana Mind app ретінде бөлу.

## 8. Қазіргі MVP acceptance

- Негізгі сайт бұзылмайды.
- Business portal жеке URL арқылы ашылады.
- Business portal негізгі app view-ларына апарады.
- localStorage key өзгермейді.
- Cloud Sync логикасы өзгермейді.
- Mobile-де portal оқылады.
