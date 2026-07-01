(function () {
  function downloadWorkbook(result, filename) {
    const workbook = result.workbook || XLSX.utils.book_new();
    if (!result.workbook) XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(result.rows), "Completed");
    appendOrReplaceSheet(workbook, "Change log", result.changeLog);
    appendOrReplaceSheet(workbook, "Not found", result.notFound);
    XLSX.writeFile(workbook, filename, { bookType: "xlsx", cellStyles: true });
  }

  function appendOrReplaceSheet(workbook, name, rows) {
    const existing = workbook.SheetNames.indexOf(name);
    if (existing >= 0) workbook.SheetNames.splice(existing, 1);
    delete workbook.Sheets[name];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }

  function mergeByCode(base, price, options = {}) {
    const updateMode = options.updateMode || "fill-empty";
    const duplicateMode = options.duplicateMode || "first";
    const baseHeader = normalizeHeader(base.rows[0]);
    const priceHeader = normalizeHeader(price.rows[0]);
    const { baseCodeIndex, priceCodeIndex } = resolveCodeColumns(base.rows, baseHeader, price.rows, priceHeader);
    const protectedIndexes = uniqueIndexes([...findQuantityColumns(baseHeader), ...findPackageColumns(baseHeader)]);
    const sourcePriceIndex = resolvePriceColumn(price.rows, priceHeader);
    const basePriceIndexes = findPriceColumns(baseHeader).filter(index => !protectedIndexes.includes(index));
    const targetPriceIndexes = basePriceIndexes.length ? basePriceIndexes : [baseHeader.length];
    const outputHeader = [...baseHeader];
    if (!basePriceIndexes.length) outputHeader.push("Almat price");

    const priceMap = new Map();
    price.rows.slice(1).forEach(row => {
      const code = normalizeCode(row[priceCodeIndex]);
      if (!code) return;
      priceMap.set(code, chooseDuplicateRow(priceMap.get(code), row, duplicateMode, sourcePriceIndex));
    });

    let matched = 0;
    let filled = 0;
    let formulaProtected = 0;
    const changeLog = [["Row", "Code", "Item", "Column", "Old price", "New price", "Duplicate mode", "Update mode"]];
    const notFound = [["Row", "Code", "Item"]];
    const outputRows = base.workbook ? null : [outputHeader];
    const targetSheet = base.sheet;
    const sheetRange = targetSheet ? XLSX.utils.decode_range(targetSheet["!ref"] || "A1") : null;

    if (targetSheet && outputHeader.length > baseHeader.length) {
      const address = XLSX.utils.encode_cell({ r: 0, c: outputHeader.length - 1 });
      targetSheet[address] = { t: "s", v: "Almat price" };
      sheetRange.e.c = Math.max(sheetRange.e.c, outputHeader.length - 1);
      targetSheet["!ref"] = XLSX.utils.encode_range(sheetRange);
    }

    base.rows.slice(1).forEach((baseRow, rowOffset) => {
      const rowIndex = rowOffset + 1;
      const code = normalizeCode(baseRow[baseCodeIndex]);
      const priceRow = priceMap.get(code);
      const itemName = guessItemName(baseRow, baseHeader, baseCodeIndex);
      const outRow = outputRows ? new Array(outputHeader.length).fill("") : null;
      if (outRow) baseHeader.forEach((_, index) => { outRow[index] = cellValue(baseRow[index]); });

      if (priceRow) {
        matched += 1;
        targetPriceIndexes.forEach(outputIndex => {
          if (protectedIndexes.includes(outputIndex)) return;
          const sourceIndex = findMatchingPriceSource(baseHeader[outputIndex], priceHeader, sourcePriceIndex);
          const next = cellValue(priceRow[sourceIndex]);
          if (!next) return;
          const oldValue = targetSheet ? getSheetCellValue(targetSheet, rowIndex, outputIndex) : cellValue(outRow?.[outputIndex]);
          if (updateMode === "fill-empty" && oldValue) return;

          if (targetSheet) {
            if (hasFormula(targetSheet, rowIndex, outputIndex)) {
              formulaProtected += 1;
              return;
            }
            setSheetCell(targetSheet, rowIndex, outputIndex, next);
          } else if (outRow) {
            outRow[outputIndex] = next;
          }
          changeLog.push([rowIndex + 1, code, itemName, outputHeader[outputIndex], oldValue, next, duplicateMode, updateMode]);
          filled += 1;
        });
      } else if (code) {
        notFound.push([rowIndex + 1, code, itemName]);
      }
      if (outRow) outputRows.push(outRow);
    });

    return {
      workbook: base.workbook,
      rows: outputRows,
      changeLog,
      notFound,
      baseRows: Math.max(base.rows.length - 1, 0),
      priceRows: Math.max(price.rows.length - 1, 0),
      matched,
      filled,
      addedColumns: outputHeader.length - baseHeader.length,
      formulaProtected,
      protectedColumns: protectedIndexes.map(index => outputHeader[index]),
      baseCodeHeader: baseHeader[baseCodeIndex],
      priceCodeHeader: priceHeader[priceCodeIndex]
    };
  }

  function resolveCodeColumns(baseRows, baseHeader, priceRows, priceHeader) {
    const baseDirect = findColumn(baseHeader, "", codeKeywords());
    const priceDirect = findColumn(priceHeader, "", codeKeywords());
    if (baseDirect >= 0 && priceDirect >= 0) return { baseCodeIndex: baseDirect, priceCodeIndex: priceDirect };

    let best = { baseCodeIndex: baseDirect >= 0 ? baseDirect : 0, priceCodeIndex: priceDirect >= 0 ? priceDirect : 0, score: -1 };
    baseHeader.forEach((_, baseIndex) => {
      priceHeader.forEach((__, priceIndex) => {
        if (baseDirect >= 0 && baseIndex !== baseDirect) return;
        if (priceDirect >= 0 && priceIndex !== priceDirect) return;
        const score = columnMatchScore(baseRows, baseIndex, priceRows, priceIndex);
        if (score > best.score) best = { baseCodeIndex: baseIndex, priceCodeIndex: priceIndex, score };
      });
    });
    return best;
  }

  function columnMatchScore(baseRows, baseIndex, priceRows, priceIndex) {
    const baseValues = new Set(baseRows.slice(1, 250).map(row => normalizeCode(row[baseIndex])).filter(Boolean));
    const priceValues = new Set(priceRows.slice(1, 500).map(row => normalizeCode(row[priceIndex])).filter(Boolean));
    let matches = 0;
    baseValues.forEach(value => { if (priceValues.has(value)) matches += 1; });
    const codeLike = [...baseValues].filter(value => value.length >= 2 && value.length <= 40 && /[\p{L}\p{N}]/u.test(value)).length;
    return matches * 20 + codeLike;
  }

  function chooseDuplicateRow(current, next, mode, priceIndex) {
    if (!current) return next;
    if (mode === "last") return next;
    if (mode === "min" || mode === "max") {
      const currentPrice = parseNumber(current[priceIndex]);
      const nextPrice = parseNumber(next[priceIndex]);
      if (currentPrice == null) return next;
      if (nextPrice == null) return current;
      return mode === "min"
        ? (nextPrice < currentPrice ? next : current)
        : (nextPrice > currentPrice ? next : current);
    }
    return current;
  }

  function findQuantityColumns(header) {
    return header
      .map((name, index) => ({ name: normalizeText(name), index }))
      .filter(item => quantityKeywords().some(keyword => item.name === keyword || item.name.includes(keyword)))
      .map(item => item.index);
  }

  function findPackageColumns(header) {
    return header
      .map((name, index) => ({ name: normalizeText(name), index }))
      .filter(item => packageKeywords().some(keyword => item.name === keyword || item.name.includes(keyword)))
      .map(item => item.index);
  }

  function findPriceColumns(header) {
    return header
      .map((name, index) => ({ name: normalizeText(name), index }))
      .filter(item => priceKeywords().some(keyword => item.name === keyword || item.name.includes(keyword)))
      .map(item => item.index);
  }

  function resolvePriceColumn(rows, header) {
    const direct = findColumn(header, "", priceKeywords());
    if (direct >= 0) return direct;
    const protectedKeys = [...codeKeywords(), ...quantityKeywords(), ...packageKeywords(), "атауы", "наименование", "name", "товар"];
    const candidates = header.map((name, index) => {
      const clean = normalizeText(name);
      const values = rows.slice(1, 80).map(row => cellValue(row[index])).filter(Boolean);
      const numeric = values.filter(value => parseNumber(value) != null).length;
      const protectedColumn = protectedKeys.some(keyword => clean === keyword || clean.includes(keyword));
      return { index, score: numeric - (protectedColumn ? 1000 : 0) };
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.index ?? Math.max(header.length - 1, 0);
  }

  function findMatchingPriceSource(targetHeader, priceHeader, fallbackIndex) {
    const targetKey = headerKey(targetHeader);
    const exact = priceHeader.findIndex(header => headerKey(header) === targetKey);
    if (exact >= 0 && priceKeywords().some(keyword => normalizeText(priceHeader[exact]).includes(keyword))) return exact;
    return fallbackIndex;
  }

  function guessItemName(row, header, codeIndex) {
    const nameIndex = header.findIndex(name => ["атауы", "наименование", "name", "товар", "product"].some(key => normalizeText(name).includes(key)));
    if (nameIndex >= 0) return cellValue(row[nameIndex]);
    return cellValue(row[codeIndex + 1]) || cellValue(row[0]);
  }

  function codeKeywords() {
    return ["код", "code", "sku", "артикул", "article", "item", "id", "barcode", "штрих", "номенклатура"];
  }

  function quantityKeywords() {
    return ["саны", "сан", "количество", "кол-во", "qty", "quantity", "остаток", "stock", "count", "көлем", "дана"];
  }

  function packageKeywords() {
    return ["коробка", "короб", "қорап", "корап", "упаковка", "пачка", "pack", "package", "box", "carton", "ящик"];
  }

  function priceKeywords() {
    return ["баға", "бағасы", "цена", "price", "стоимость", "cost", "прайс", "опт", "розница", "retail", "amount"];
  }

  function getSheetCellValue(sheet, rowIndex, columnIndex) {
    return cellText(sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })]);
  }

  function hasFormula(sheet, rowIndex, columnIndex) {
    const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
    return Boolean(cell && cell.f);
  }

  function setSheetCell(sheet, rowIndex, columnIndex, value) {
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
    const existing = sheet[address] || {};
    const numeric = parseNumber(value);
    sheet[address] = { ...existing, t: numeric == null ? "s" : "n", v: numeric == null ? value : numeric };
    delete sheet[address].f;
    delete sheet[address].w;
  }

  function datedFilename(prefix) {
    return `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  }

  function uniqueIndexes(indexes) {
    return [...new Set(indexes.filter(index => Number.isInteger(index) && index >= 0))];
  }

  const helpers = {
    downloadWorkbook,
    appendOrReplaceSheet,
    mergeByCode,
    resolveCodeColumns,
    columnMatchScore,
    chooseDuplicateRow,
    findQuantityColumns,
    findPackageColumns,
    findPriceColumns,
    resolvePriceColumn,
    findMatchingPriceSource,
    guessItemName,
    codeKeywords,
    quantityKeywords,
    packageKeywords,
    priceKeywords,
    getSheetCellValue,
    hasFormula,
    setSheetCell,
    datedFilename,
    uniqueIndexes
  };

  window.SanaPriceMatching = helpers;
  Object.assign(window, helpers);
})();
