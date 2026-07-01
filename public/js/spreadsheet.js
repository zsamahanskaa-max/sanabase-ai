(function () {
  async function readTableFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (["xlsx", "xls"].includes(ext)) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellFormula: true, cellStyles: true, cellNF: true, cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return { name: file.name, workbook, sheet, rows: trimRows(worksheetToRows(sheet)) };
    }
    if (["csv", "tsv"].includes(ext)) {
      const delimiter = ext === "tsv" ? "\t" : ",";
      const rows = (await file.text()).split(/\r?\n/).map(line => line.split(delimiter));
      return { name: file.name, rows: trimRows(rows) };
    }
    throw new Error("Тек Excel, CSV немесе TSV файл салыңыз.");
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
    if (cell.v != null) return cellValue(cell.v);
    if (cell.w != null) return cellValue(cell.w);
    if (cell.f != null) return cellValue(cell.f);
    return "";
  }

  function parseNumber(value) {
    const clean = String(value ?? "").replace(/\s+/g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  const helpers = {
    readTableFile,
    worksheetToRows,
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
