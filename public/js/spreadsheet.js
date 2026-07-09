(function () {
  async function readTableFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (["xlsx", "xls"].includes(ext)) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellFormula: true, cellStyles: true, cellNF: true, cellDates: true });
      const sheetName = chooseBestSheetName(workbook);
      const sheet = workbook.Sheets[sheetName];
      return { name: file.name, sheetName, workbook, sheet, rows: trimRows(worksheetToRows(sheet)) };
    }
    if (["csv", "tsv"].includes(ext)) {
      const text = await file.text();
      const delimiter = ext === "tsv" ? "\t" : detectDelimiter(text);
      const rows = text.split(/\r?\n/).map(line => parseDelimitedLine(line, delimiter));
      return { name: file.name, rows: trimRows(rows) };
    }
    throw new Error("Тек Excel, CSV немесе TSV файл салыңыз.");
  }

  function chooseBestSheetName(workbook) {
    const sheetNames = workbook.SheetNames || [];
    if (!sheetNames.length) throw new Error("Excel sheet not found.");
    let best = { name: sheetNames[0], score: -1 };
    sheetNames.forEach(name => {
      const rows = trimRows(worksheetToRows(workbook.Sheets[name] || {}));
      const preview = rows.slice(0, 25).flat().join(" ").toLowerCase();
      let score = rows.length;
      if (/номенклатура|товар|тауар|контрагент|клиент|остаток|қалдық|количество|сумма|цена|баға|документ|реализация|эсф|esf/i.test(preview)) score += 80;
      if (/итого|барлығы|всего/i.test(preview)) score += 5;
      if (score > best.score) best = { name, score };
    });
    return best.name;
  }

  function worksheetToRows(sheet) {
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    const rows = [];
    for (let r = range.s.r; r <= range.e.r; r += 1) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c += 1) {
        row.push(cellText(sheet[XLSX.utils.encode_cell({ r, c })]));
      }
      rows.push(row);
    }
    return rows;
  }

  function detectDelimiter(text) {
    const sample = text.split(/\r?\n/).slice(0, 10).join("\n");
    const candidates = [",", ";", "\t", "|"];
    return candidates
      .map(delimiter => ({ delimiter, count: sample.split(delimiter).length }))
      .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
  }

  function parseDelimitedLine(line, delimiter) {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === "\"" && quoted && next === "\"") {
        current += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  function normalizeHeader(row) {
    return row.map((value, index) => String(value || `Column ${index + 1}`).trim());
  }

  function trimRows(rows) {
    return rows.filter(row => row.some(cell => String(cell ?? "").trim())).map(row => row.map(cellValue));
  }

  function findColumn(header, hint, keywords) {
    const cleanHint = normalizeText(hint);
    if (cleanHint) {
      const exact = header.findIndex(name => normalizeText(name) === cleanHint);
      if (exact >= 0) return exact;
      const partial = header.findIndex(name => normalizeText(name).includes(cleanHint));
      if (partial >= 0) return partial;
    }
    return header.findIndex(name => {
      const value = normalizeText(name);
      return keywords.some(keyword => value === keyword || value.includes(keyword));
    });
  }

  function normalizeCode(value) {
    return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function headerKey(value) {
    return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, "");
  }

  function cellValue(value) {
    return value == null ? "" : String(value).trim();
  }

  function cellText(cell) {
    if (!cell) return "";
    if (cell.w != null) return cellValue(cell.w);
    if (cell.v != null) return cellValue(cell.v);
    if (cell.f != null) return cellValue(cell.f);
    return "";
  }

  function parseNumber(value) {
    const clean = String(value ?? "")
      .replace(/\u00a0/g, "")
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^\d().-]/g, "")
      .replace(/^\((.*)\)$/, "-$1");
    if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  const helpers = {
    readTableFile,
    chooseBestSheetName,
    worksheetToRows,
    detectDelimiter,
    parseDelimitedLine,
    normalizeHeader,
    trimRows,
    findColumn,
    normalizeCode,
    normalizeText,
    headerKey,
    cellValue,
    cellText,
    parseNumber
  };

  window.SanaSpreadsheet = helpers;
  Object.assign(window, helpers);
})();
