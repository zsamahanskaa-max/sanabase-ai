# SanaBase құжат оқу және 1C Excel audit

## Қазіргі архитектура

SanaBase құжаттарды екі жолмен оқиды:

1. `public/js/documents.js`
   - `extractFile(file)` алдымен `/api/import` server endpoint арқылы оқуға тырысады.
   - Server істемесе, browser fallback іске қосылады.
   - PDF, Word, Excel, CSV, TSV, TXT/MD файлдарын text ретінде шығарады.

2. `public/js/spreadsheet.js`
   - Excel/CSV/TSV кестелерін `readTableFile(file)` арқылы оқиды.
   - Бұл helper 1C Excel, price matching, CRM/CFO import және document fallback үшін shared dependency.

3. `public/app.js`
   - `importFiles()` жалпы document import жасайды.
   - `importOneCExcel()` 1C Excel файлын оқып, `analyzeOneCTable()` арқылы талдайды.
   - `syncOneCToCfo()` оқылған 1C дерегін Sana CFO ішіне түсіреді.

## Табылған негізгі мәселелер

1. Excel бірінші sheet-ке байланып тұрған.
   - Егер 1C export-та бірінші sheet бос немесе титул sheet болса, дұрыс дерек оқылмай қалуы мүмкін.

2. CSV тек comma арқылы бөлінді.
   - 1C CSV жиі `;` delimiter қолданады. Сондықтан бағандар бір cell болып кетуі мүмкін.

3. Excel formatted value толық пайдаланылмады.
   - Date/number кейде raw number болып оқылып, адамға түсініксіз көрінуі мүмкін.

4. 1C parser `Сумма` және `Оплачено` бағандарын толық пайдаланбады.
   - Реализация/төлем анализінде totalAmount және paidAmount дұрыс түспей қалуы мүмкін.

5. `Итого / Всего` summary жолдары кейде дерек ретінде түсіп кетуі мүмкін.

## Осы қадамда түзелгені

1. `readTableFile()` енді Excel ішінен ең ықтимал дұрыс sheet таңдайды.
2. CSV delimiter автомат анықталады: comma, semicolon, tab, pipe.
3. Quoted CSV values дұрыс бөлінеді.
4. Excel cell text енді formatted value (`cell.w`) бар болса, соны бірінші алады.
5. Сан/ақша parsing жақсарды: пробел, non-breaking space, теңге/валюта символы, negative parentheses өңделеді.
6. 1C parser енді `amount` және `paid` бағандарын таниды.
7. `Итого / Всего / Барлығы / Total` жолдары негізгі дерек ретінде саналмайды.
8. CFO import кезінде `totalAmount` және `paidAmount` дұрысырақ толтырылады.

## Қалған risk

1. PDF ішіндегі scanned image text OCR жасалмайды.
   - Егер PDF сурет ретінде болса, text шықпауы мүмкін.

2. 1C export template әр компанияда әртүрлі.
   - Кейбір custom column атаулары әлі танылмауы мүмкін.

3. Excel merged header өте күрделі болса, header row қате таңдалуы мүмкін.

4. GitHub Pages static hosting болғандықтан `/api/import` backend жұмыс істемеуі мүмкін.
   - Live static сайтта browser fallback негізгі жол болып қалады.

## Келесі қауіпсіз қадам

1. 1C Inspector ішінде "Бағанды қолмен сәйкестендіру" режимін қосу.
2. PDF OCR үшін optional image-to-text pipeline бөлек қосу.
3. Import preview screen жасау: файлды сақтау алдында 10 жол preview және detected columns көрсету.
4. 1C template presets қосу:
   - Остатки товаров
   - Реализация товаров
   - Взаиморасчеты с контрагентами
   - Поступление товаров
   - ЭСФ / документы

## Acceptance checklist

- Excel бірнеше sheet болса, дерегі бар sheet таңдалады.
- CSV `;` арқылы болса да бағандарға бөлінеді.
- 1C `Сумма` бағаны totalAmount ретінде түседі.
- 1C `Оплачено` бағаны paidAmount ретінде түседі.
- `Итого/Всего` жолдары жеке клиент/тауар болып кетпейді.
- Жалпы құжат import бұрынғыдай жұмыс істейді.
- CRM, CFO, Backup, Cloud Sync, Electro sales бұзылмайды.
