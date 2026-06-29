const state = loadState();
const DEFAULT_CLOUD_CONFIG = {
  url: "https://koszjmsanlxdakqvdkgc.supabase.co",
  key: "sb_publishable_y7IIJav4n99Z1dbfROh3SA_TtlAn5tO",
  workspace: "sanabase-main-zsamahanskaa"
};
const cloudConfig = loadCloudConfig();
let cloudTimer = null;
let lastAssistantAnswer = "";
const titles = {
  chat: ["AI Chat", "ТљТ±Р¶Р°С‚С‚Р°СЂС‹ТЈС‹Р·Т“Р° СЃТЇР№РµРЅС–Рї Р¶Р°СѓР°Рї Р±РµСЂРµРґС–."],
  library: ["Knowledge Base", "PDF, Word, Excel Р¶У™РЅРµ РјУ™С‚С–РЅ РјР°С‚РµСЂРёР°Р»РґР°СЂС‹."],
  match: ["Price Match", "Р¤РѕСЂРјСѓР»Р°СЃС‹ Р±Р°СЂ Т›РѕСЂР°Рї/СЃР°РЅС‹ Р±Р°Т“Р°РЅРґР°СЂС‹РЅ У©Р·РіРµСЂС‚РїРµР№, Р±Р°Т“Р°СЃС‹РЅ almat company price Р°СЂТ›С‹Р»С‹ Т›РѕСЏРґС‹."],
  brain: ["Second Brain", "ТљТ±Р¶Р°С‚С‚Р°СЂРґС‹ СЃР°Т›С‚Р°Рї, С‚РµРіРїРµРЅ Р±Р°Р№Р»Р°РЅС‹СЃС‚С‹СЂС‹Рї, СЃРѕР» Р±Р°Р·Р°РґР°РЅ CRM Р¶Р°СЃР°Сѓ."],
  translate: ["Translation", "РњУ™С‚С–РЅРґС– Т›Р°Р»Р°Т“Р°РЅ С‚С–Р»РіРµ Р°СѓРґР°СЂС‹ТЈС‹Р·."],
  quiz: ["Quiz Generator", "Р‘Р°Р·Р°ТЈС‹Р·РґР°РЅ С‚РµСЃС‚ Р¶У™РЅРµ Р¶Р°СѓР°Рї РєС–Р»С‚С–РЅ Р¶Р°СЃР°ТЈС‹Р·."],
  crm: ["CRM Analysis", "Excel/CSV CRM Р±Р°Р·Р°СЃС‹РЅ С‚Р°Р»РґР°ТЈС‹Р·."],
  tasks: ["Tasks", "Trello СЃРёСЏТ›С‚С‹ С‚Р°РїСЃС‹СЂРјР°Р»Р°СЂ С‚Р°Т›С‚Р°СЃС‹."],
  notes: ["Notes", "РћР№Р»Р°СЂ РјРµРЅ РєРѕРЅСЃРїРµРєС‚С–Р»РµСЂРґС– СЃР°Т›С‚Р°ТЈС‹Р·."]
};

const $ = (id) => document.getElementById(id);
const on = (id, event, handler) => {
  const node = $(id);
  if (node) node.addEventListener(event, handler);
};

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

on("fileInput", "change", importFiles);
on("chatForm", "submit", chat);
on("assistantTaskBtn", "click", taskFromLastAssistantAnswer);
on("translateBtn", "click", translate);
on("quizBtn", "click", quiz);
on("crmBtn", "click", crm);
on("matchBtn", "click", matchPrices);
on("taskForm", "submit", saveTask);
on("taskSearch", "input", render);
on("taskQuickCrmBtn", "click", taskFromCrm);
on("noteForm", "submit", saveNote);
on("noteSearch", "input", render);
on("noteFolderFilter", "change", render);
on("noteQuickFolderBtn", "click", useSelectedNoteFolder);
on("searchDocs", "input", render);
on("brainSearch", "input", render);
on("brainCrmBtn", "click", brainCrm);
on("brainExportBtn", "click", exportBrain);
on("brainImportFile", "change", importBrain);
on("cloudSaveBtn", "click", saveCloudSettings);
on("cloudPushBtn", "click", () => pushCloud(true));
on("cloudPullBtn", "click", () => pullCloud(true));
on("cloudConfigExportBtn", "click", exportCloudConfig);
on("cloudConfigImportFile", "change", importCloudConfig);
on("cloudClearBtn", "click", clearCloudSettings);
on("clearDocs", "click", () => {
  state.docs = [];
  persist();
  render();
});
document.querySelectorAll("[data-quick-prompt]").forEach(button => {
  button.addEventListener("click", () => runQuickPrompt(button.dataset.quickPrompt));
});

render();
renderCloudSettings();
addMessage("ai", "РЎУ™Р»РµРј! Price Match Р±У©Р»С–РјС– 1-Т›Т±Р¶Р°С‚С‚С‹ТЈ С„РѕСЂРјСѓР»Р°СЃС‹ Р±Р°СЂ Т›РѕСЂР°Рї/СЃР°РЅС‹ Р±Р°Т“Р°РЅРґР°СЂС‹РЅ СЃР°Т›С‚Р°Рї, Р±Р°Т“Р°РЅС‹ almat company price Р°СЂТ›С‹Р»С‹ Т›РѕСЏРґС‹.");

function setView(view) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === view));
  $("viewTitle").textContent = titles[view][0];
  $("viewSub").textContent = titles[view][1];
}

async function importFiles(event) {
  for (const file of event.target.files) {
    addMessage("ai", `${file.name} РёРјРїРѕСЂС‚С‚Р°Р»С‹Рї Р¶Р°С‚С‹СЂ...`);
    const result = await extractFile(file);
    state.docs.unshift({
      id: crypto.randomUUID(),
      name: result.name,
      type: result.type,
      text: result.text || "",
      warning: result.warning || "",
      tags: inferTags(result.name, result.text || ""),
      links: [],
      createdAt: new Date().toISOString()
    });
    persist();
  }
  event.target.value = "";
  render();
}

async function chat(event) {
  event.preventDefault();
  const prompt = $("chatPrompt").value.trim();
  if (!prompt) return;
  $("chatPrompt").value = "";
  addMessage("user", prompt);
  const pending = addMessage("ai", "Р–Р°СѓР°Рї РґР°Р№С‹РЅРґР°Р»С‹Рї Р¶Р°С‚С‹СЂ...");
  try {
    const assistantMode = $("assistantMode")?.value || "auto";
    const result = await ai("chat", prompt, "Kazakh", assistantMode);
    pending.textContent = result.text;
    lastAssistantAnswer = result.text;
    maybeCreateTaskFromPrompt(prompt, result.text);
  } catch (error) {
    pending.textContent = `ТљР°С‚Рµ: ${error.message}`;
  }
}

async function runQuickPrompt(prompt) {
  const input = $("chatPrompt");
  input.value = prompt;
  await chat({ preventDefault() {} });
}

function taskFromLastAssistantAnswer() {
  if (!lastAssistantAnswer.trim()) {
    addMessage("ai", "РђР»РґС‹РјРµРЅ Р°СЃСЃРёСЃС‚РµРЅС‚С‚РµРЅ Р¶Р°СѓР°Рї Р°Р»С‹ТЈС‹Р·, СЃРѕРґР°РЅ РєРµР№С–РЅ СЃРѕТЈТ“С‹ Р¶Р°СѓР°РїС‚Р°РЅ task Р¶Р°СЃР°СѓТ“Р° Р±РѕР»Р°РґС‹.");
    return;
  }
  const title = firstMeaningfulLine(lastAssistantAnswer) || "AI follow-up";
  state.tasks.unshift(normalizeTask({
    id: crypto.randomUUID(),
    title: title.slice(0, 90),
    body: lastAssistantAnswer.slice(0, 1400),
    status: "todo",
    priority: inferPriority(lastAssistantAnswer),
    link: "AI Chat",
    createdAt: new Date().toISOString()
  }));
  persist();
  render();
  addMessage("ai", "РЎРѕТЈТ“С‹ Р¶Р°СѓР°Рї Tasks С‚Р°Т›С‚Р°СЃС‹РЅР° Т›РѕСЃС‹Р»РґС‹.");
}

function maybeCreateTaskFromPrompt(prompt, answer) {
  const source = prompt.toLowerCase();
  if (!/(task|С‚Р°РїСЃС‹СЂРјР°|РµСЃРєРµ СЃР°Р»|todo|follow.?up)/i.test(source)) return;
  if (!/(Р¶Р°СЃР°|Т›РѕСЃ|Т›Т±СЂ|create|add)/i.test(source)) return;
  state.tasks.unshift(normalizeTask({
    id: crypto.randomUUID(),
    title: firstMeaningfulLine(prompt).slice(0, 90) || "AI task",
    body: answer.slice(0, 1200),
    status: "todo",
    priority: inferPriority(`${prompt}\n${answer}`),
    link: "AI Chat",
    createdAt: new Date().toISOString()
  }));
  persist();
  render();
}

async function translate() {
  const text = $("translateInput").value.trim();
  if (!text) return;
  $("translateOut").textContent = "РђСѓРґР°СЂС‹Р»С‹Рї Р¶Р°С‚С‹СЂ...";
  try {
    const result = await ai("translate", text, $("targetLang").value);
    $("translateOut").textContent = result.text;
  } catch (error) {
    $("translateOut").textContent = `ТљР°С‚Рµ: ${error.message}`;
  }
}

async function quiz() {
  $("quizOut").textContent = "Quiz Р¶Р°СЃР°Р»С‹Рї Р¶Р°С‚С‹СЂ...";
  try {
    const result = await ai("quiz", $("quizPrompt").value || "Р‘Р°СЂР»С‹Т› Р±С–Р»С–Рј Р±Р°Р·Р°СЃС‹РЅР°РЅ quiz Р¶Р°СЃР°.");
    $("quizOut").textContent = result.text;
  } catch (error) {
    $("quizOut").textContent = `ТљР°С‚Рµ: ${error.message}`;
  }
}

async function crm() {
  $("crmOut").textContent = "CRM С‚Р°Р»РґР°Сѓ Р¶Р°СЃР°Р»С‹Рї Р¶Р°С‚С‹СЂ...";
  try {
    const prompt = $("crmPrompt").value || "CRM РґРµСЂРµРіС–РЅ С‚РѕР»С‹Т› С‚Р°Р»РґР°: pipeline, С‚Р°Р±С‹СЃ, РєР»РёРµРЅС‚ СЃРµРіРјРµРЅС‚С‚РµСЂС–, С‚У™СѓРµРєРµР»РґРµСЂ, РєРµР»РµСЃС– У™СЂРµРєРµС‚С‚РµСЂ.";
    const result = await ai("crm", prompt);
    $("crmOut").textContent = result.text;
  } catch (error) {
    $("crmOut").textContent = `ТљР°С‚Рµ: ${error.message}`;
  }
}

async function matchPrices() {
  const baseFile = $("basePriceFile").files[0];
  const priceFile = $("almatPriceFile").files[0];
  const out = $("matchOut");
  if (!baseFile || !priceFile) {
    out.textContent = "Р•РєС– С„Р°Р№Р»РґС‹ РґР° С‚Р°ТЈРґР°ТЈС‹Р·: 1-Т›Т±Р¶Р°С‚ Р¶У™РЅРµ almat company price.";
    return;
  }
  if (!window.XLSX) {
    out.textContent = "Excel РєС–С‚Р°РїС…Р°РЅР°СЃС‹ Р¶ТЇРєС‚РµР»РјРµРґС–. РРЅС‚РµСЂРЅРµС‚С‚С– С‚РµРєСЃРµСЂС–Рї, Р±РµС‚С‚С– Т›Р°Р№С‚Р° Р°С€С‹ТЈС‹Р·.";
    return;
  }

  out.textContent = "Р¤Р°Р№Р»РґР°СЂ РѕТ›С‹Р»С‹Рї Р¶Р°С‚С‹СЂ...";
  try {
    const base = await readTableFile(baseFile);
    const price = await readTableFile(priceFile);
    const result = mergeByCode(base, price, {
      updateMode: $("priceUpdateMode")?.value || "fill-empty",
      duplicateMode: $("duplicateMode")?.value || "first"
    });
    downloadWorkbook(result, datedFilename("completed_price"));
    out.textContent = [
      "Р”Р°Р№С‹РЅ С„Р°Р№Р» Р¶ТЇРєС‚РµР»РґС–.",
      `1-Т›Т±Р¶Р°С‚ Р¶РѕР»РґР°СЂС‹: ${result.baseRows}`,
      `almat company price Р¶РѕР»РґР°СЂС‹: ${result.priceRows}`,
      `РљРѕРґ Р±РѕР№С‹РЅС€Р° С‚Р°Р±С‹Р»Т“Р°РЅС‹: ${result.matched}`,
      `РўР°Р±С‹Р»РјР°Т“Р°РЅ РєРѕРґС‚Р°СЂ: ${result.notFound.length}`,
      `Р‘Р°Т“Р° Т›РѕР№С‹Р»Т“Р°РЅ Т±СЏС€С‹Т›С‚Р°СЂ: ${result.filled}`,
      `Change log Р¶РѕР»РґР°СЂС‹: ${result.changeLog.length}`,
      `ТљРѕСЃС‹Р»Т“Р°РЅ Р±Р°Т“Р° Р±Р°Т“Р°РЅС‹: ${result.addedColumns}`,
      `Р¤РѕСЂРјСѓР»Р°СЃС‹ Р±Р°СЂ Т±СЏС€С‹Т›С‚Р°СЂ У©Р·РіРµСЂРјРµРґС–: ${result.formulaProtected}`,
      `ТљРѕСЂТ“Р°Р»Т“Р°РЅ СЃР°РЅС‹/Т›РѕСЂР°Рї Р±Р°Т“Р°РЅРґР°СЂС‹: ${result.protectedColumns.join(", ") || "С‚Р°Р±С‹Р»РјР°РґС‹"}`,
      `РљРѕРґ Р±Р°Т“Р°РЅРґР°СЂС‹: 1-Т›Т±Р¶Р°С‚ = ${result.baseCodeHeader}, almat = ${result.priceCodeHeader}`
    ].join("\n");
  } catch (error) {
    out.textContent = `ТљР°С‚Рµ: ${error.message}`;
  }
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
  throw new Error("РўРµРє Excel, CSV РЅРµРјРµСЃРµ TSV С„Р°Р№Р» СЃР°Р»С‹ТЈС‹Р·.");
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
  const protectedKeys = [...codeKeywords(), ...quantityKeywords(), ...packageKeywords(), "Р°С‚Р°СѓС‹", "РЅР°РёРјРµРЅРѕРІР°РЅРёРµ", "name", "С‚РѕРІР°СЂ"];
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
  const nameIndex = header.findIndex(name => ["Р°С‚Р°СѓС‹", "РЅР°РёРјРµРЅРѕРІР°РЅРёРµ", "name", "С‚РѕРІР°СЂ", "product"].some(key => normalizeText(name).includes(key)));
  if (nameIndex >= 0) return cellValue(row[nameIndex]);
  return cellValue(row[codeIndex + 1]) || cellValue(row[0]);
}

function codeKeywords() {
  return ["РєРѕРґ", "code", "sku", "Р°СЂС‚РёРєСѓР»", "article", "item", "id", "barcode", "С€С‚СЂРёС…", "РЅРѕРјРµРЅРєР»Р°С‚СѓСЂР°"];
}

function quantityKeywords() {
  return ["СЃР°РЅС‹", "СЃР°РЅ", "РєРѕР»РёС‡РµСЃС‚РІРѕ", "РєРѕР»-РІРѕ", "qty", "quantity", "РѕСЃС‚Р°С‚РѕРє", "stock", "count", "РєУ©Р»РµРј", "РґР°РЅР°"];
}

function packageKeywords() {
  return ["РєРѕСЂРѕР±РєР°", "РєРѕСЂРѕР±", "Т›РѕСЂР°Рї", "РєРѕСЂР°Рї", "СѓРїР°РєРѕРІРєР°", "РїР°С‡РєР°", "pack", "package", "box", "carton", "СЏС‰РёРє"];
}

function priceKeywords() {
  return ["Р±Р°Т“Р°", "Р±Р°Т“Р°СЃС‹", "С†РµРЅР°", "price", "СЃС‚РѕРёРјРѕСЃС‚СЊ", "cost", "РїСЂР°Р№СЃ", "РѕРїС‚", "СЂРѕР·РЅРёС†Р°", "retail", "amount"];
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

function parseNumber(value) {
  const clean = String(value ?? "").replace(/\s+/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}

function datedFilename(prefix) {
  return `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

function uniqueIndexes(indexes) {
  return [...new Set(indexes.filter(index => Number.isInteger(index) && index >= 0))];
}

function saveNote(event) {
  event.preventDefault();
  const title = $("noteTitle").value.trim() || "Untitled note";
  const body = $("noteBody").value.trim();
  if (!body) return;
  state.notes.unshift(normalizeNote({
    id: crypto.randomUUID(),
    title,
    body,
    folder: $("noteFolder")?.value.trim() || "General",
    type: $("noteType")?.value || autoNoteType(body),
    tags: splitList($("noteTags")?.value || ""),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  ["noteTitle", "noteBody", "noteTags"].forEach(id => { if ($(id)) $(id).value = ""; });
  if ($("noteType")) $("noteType").value = "short";
  persist();
  render();
}

function useSelectedNoteFolder() {
  const selected = $("noteFolderFilter")?.value || "all";
  if (selected !== "all" && $("noteFolder")) $("noteFolder").value = selected;
}

function saveTask(event) {
  event.preventDefault();
  const title = $("taskTitle").value.trim();
  if (!title) return;
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    body: $("taskBody").value.trim(),
    status: $("taskStatus").value || "todo",
    priority: $("taskPriority").value || "medium",
    due: $("taskDue").value || "",
    owner: $("taskOwner").value.trim(),
    link: $("taskLink").value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  ["taskTitle", "taskBody", "taskDue", "taskOwner", "taskLink"].forEach(id => { $(id).value = ""; });
  $("taskPriority").value = "medium";
  $("taskStatus").value = "todo";
  persist();
  render();
}

function moveTask(id, status) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  task.status = status;
  task.updatedAt = new Date().toISOString();
  persist();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(task => task.id !== id);
  persist();
  render();
}

function taskFromCrm() {
  const title = "CRM follow-up";
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    body: "CRM/Т›Т±Р¶Р°С‚ Р±РѕР№С‹РЅС€Р° РєРµР»РµСЃС– У™СЂРµРєРµС‚С‚С– РЅР°Т›С‚С‹Р»Р°Сѓ.",
    status: "todo",
    priority: "high",
    due: "",
    owner: "",
    link: "CRM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  persist();
  render();
  setView("tasks");
}

function brainCrm() {
  const out = $("brainOut");
  if (!state.docs.length) {
    out.textContent = "РђР»РґС‹РјРµРЅ PDF, Word, Excel РЅРµРјРµСЃРµ CSV Т›Т±Р¶Р°С‚С‚Р°СЂС‹РЅ Р¶ТЇРєС‚РµТЈС–Р·.";
    return;
  }
  const context = buildContext();
  const links = state.docs.map(doc => {
    const related = findRelatedDocs(doc).map(item => item.name).slice(0, 4).join(", ");
    return `- ${doc.name}: ${related || "Р±Р°Р№Р»Р°РЅС‹СЃ С‚Р°Р±С‹Р»РјР°РґС‹"}`;
  }).join("\n");
  out.textContent = [
    analyzeCrm(context),
    "",
    "Second Brain Р±Р°Р№Р»Р°РЅС‹СЃС‚Р°СЂС‹:",
    links,
    "",
    "Т°СЃС‹РЅС‹СЃ: РєР»РёРµРЅС‚, С‚Р°СѓР°СЂ, РєРѕРґ, СЃС‚Р°С‚СѓСЃ, Р¶Р°СѓР°РїС‚С‹ РјРµРЅРµРґР¶РµСЂ Р¶У™РЅРµ РєРµР»РµСЃС– У™СЂРµРєРµС‚ Р±Р°Т“Р°РЅРґР°СЂС‹ Р±Р°СЂ Excel/CSV Р¶ТЇРєС‚РµСЃРµТЈС–Р·, CRM С‚Р°Р»РґР°Сѓ РґУ™Р»С–СЂРµРє Р±РѕР»Р°РґС‹."
  ].join("\n");
}

function exportBrain() {
  const payload = {
    exportedAt: new Date().toISOString(),
    docs: state.docs,
    tasks: state.tasks,
    notes: state.notes
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sanabase_brain_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function importBrain(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incomingDocs = Array.isArray(data.docs) ? data.docs : [];
    const incomingTasks = Array.isArray(data.tasks) ? data.tasks : [];
    const incomingNotes = Array.isArray(data.notes) ? data.notes : [];
    const existingDocKeys = new Set(state.docs.map(doc => doc.id || doc.name));
    const existingTaskKeys = new Set(state.tasks.map(task => task.id || task.title));
    const existingNoteKeys = new Set(state.notes.map(note => note.id || `${note.title}:${note.createdAt}`));
    incomingDocs.forEach(doc => {
      const key = doc.id || doc.name;
      if (!existingDocKeys.has(key)) {
        state.docs.unshift(normalizeDoc(doc));
        existingDocKeys.add(key);
      }
    });
    incomingTasks.forEach(task => {
      const key = task.id || task.title;
      if (!existingTaskKeys.has(key)) {
        state.tasks.unshift(normalizeTask(task));
        existingTaskKeys.add(key);
      }
    });
    incomingNotes.forEach(note => {
      const key = note.id || `${note.title}:${note.createdAt}`;
      if (!existingNoteKeys.has(key)) {
        state.notes.unshift(normalizeNote(note));
        existingNoteKeys.add(key);
      }
    });
    persist();
    render();
    $("brainOut").textContent = `РРјРїРѕСЂС‚ РґР°Р№С‹РЅ: ${incomingDocs.length} Т›Т±Р¶Р°С‚, ${incomingTasks.length} task, ${incomingNotes.length} note РѕТ›С‹Р»РґС‹.`;
  } catch (error) {
    $("brainOut").textContent = `Import Т›Р°С‚РµСЃС–: ${error.message}`;
  } finally {
    event.target.value = "";
  }
}

function saveBrainMeta(id) {
  const doc = state.docs.find(item => item.id === id);
  if (!doc) return;
  const tagsInput = document.querySelector(`[data-tags-for="${CSS.escape(id)}"]`);
  const linksInput = document.querySelector(`[data-links-for="${CSS.escape(id)}"]`);
  doc.tags = splitList(tagsInput?.value || "");
  doc.links = splitList(linksInput?.value || "");
  persist();
  render();
  $("brainOut").textContent = `${doc.name} СЃР°Т›С‚Р°Р»РґС‹.`;
}

function saveCloudSettings() {
  cloudConfig.url = cleanSupabaseUrl($("cloudUrl").value);
  cloudConfig.key = $("cloudKey").value.trim();
  cloudConfig.workspace = $("cloudWorkspace").value.trim() || "default";
  if (!cloudConfig.url || !cloudConfig.key) {
    setCloudStatus("Cloud Т›РѕСЃСѓ ТЇС€С–РЅ Supabase URL Р¶У™РЅРµ anon key РµРЅРіС–Р·С–ТЈС–Р·. Workspace РєРѕРґС‹РЅ У©Р·С–ТЈС–Р· Т›РѕСЏ Р°Р»Р°СЃС‹Р·.", false);
    return;
  }
  localStorage.setItem("sanabase-cloud", JSON.stringify(cloudConfig));
  renderCloudSettings();
  setCloudStatus("Cloud Т›РѕСЃС‹Р»РґС‹. Р•РЅРґС– Cloud-Т›Р° СЃР°Т›С‚Р°Сѓ Р±Р°СЃС‹ТЈС‹Р· РЅРµРјРµСЃРµ У©Р·РіРµСЂС–СЃС‚РµСЂ Р°РІС‚РѕРјР°С‚С‚С‹ СЃР°Т›С‚Р°Р»Р°РґС‹.", true);
}

function clearCloudSettings() {
  cloudConfig.url = "";
  cloudConfig.key = "";
  cloudConfig.workspace = "";
  localStorage.removeItem("sanabase-cloud");
  renderCloudSettings();
  setCloudStatus("Cloud У©С€С–СЂС–Р»РґС–. ТљТ±Р¶Р°С‚С‚Р°СЂ local СЂРµР¶РёРјРґРµ Т›Р°Р»РґС‹.", false);
}

function exportCloudConfig() {
  const current = {
    url: cleanSupabaseUrl($("cloudUrl")?.value || cloudConfig.url),
    key: $("cloudKey")?.value?.trim() || cloudConfig.key,
    workspace: $("cloudWorkspace")?.value?.trim() || cloudConfig.workspace || "default",
    exportedAt: new Date().toISOString(),
    app: "SanaBase AI"
  };
  if (!current.url || !current.key) {
    setCloudStatus("РђР»РґС‹РјРµРЅ Supabase URL Р¶У™РЅРµ anon key РµРЅРіС–Р·С–Рї, Cloud Т›РѕСЃСѓ Р±Р°СЃС‹ТЈС‹Р·.", false);
    return;
  }
  const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sanabase_cloud_${current.workspace}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setCloudStatus("Cloud Р±Р°РїС‚Р°СѓС‹ Р¶ТЇРєС‚РµР»РґС–. РћРЅС‹ С‚РµР»РµС„РѕРЅРґР° Cloud Р±Р°РїС‚Р°СѓС‹РЅ РµРЅРіС–Р·Сѓ Р°СЂТ›С‹Р»С‹ Т›РѕСЃСѓТ“Р° Р±РѕР»Р°РґС‹.", true);
}

async function importCloudConfig(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    cloudConfig.url = cleanSupabaseUrl(data.url || "");
    cloudConfig.key = String(data.key || "").trim();
    cloudConfig.workspace = String(data.workspace || "default").trim() || "default";
    if (!cloudConfig.url || !cloudConfig.key) throw new Error("config С–С€С–РЅРґРµ url РЅРµРјРµСЃРµ key Р¶РѕТ›");
    localStorage.setItem("sanabase-cloud", JSON.stringify(cloudConfig));
    renderCloudSettings();
    setCloudStatus("Cloud Р±Р°РїС‚Р°СѓС‹ РµРЅРіС–Р·С–Р»РґС–. Р•РЅРґС– Cloud-С‚Р°РЅ Р°Р»Сѓ РЅРµРјРµСЃРµ Cloud-Т›Р° СЃР°Т›С‚Р°Сѓ Р±Р°СЃС‹ТЈС‹Р·.", true);
  } catch (error) {
    setCloudStatus(`Cloud Р±Р°РїС‚Р°СѓС‹РЅ РѕТ›Сѓ Т›Р°С‚РµСЃС–: ${shortError(error)}`, false);
  } finally {
    event.target.value = "";
  }
}

async function pushCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Cloud Т›РѕСЃС‹Р»РјР°Т“Р°РЅ: РѕСЃС‹ Р±СЂР°СѓР·РµСЂРґРµ Supabase URL/anon key/workspace СЃР°Т›С‚Р°Р»РјР°Т“Р°РЅ. Cloud Т›РѕСЃСѓ РЅРµРјРµСЃРµ Cloud Р±Р°РїС‚Р°СѓС‹РЅ РµРЅРіС–Р·Сѓ Т›РѕР»РґР°РЅС‹ТЈС‹Р·.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Cloud-Т›Р° СЃР°Т›С‚Р°Р»С‹Рї Р¶Р°С‚С‹СЂ...", true);
    const payload = {
      id: cloudRowId(),
      workspace_id: cloudConfig.workspace,
      payload: {
        docs: state.docs,
        tasks: state.tasks,
        notes: state.notes,
        savedAt: new Date().toISOString(),
        version: 2
      },
      updated_at: new Date().toISOString()
    };
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?on_conflict=id`, {
      method: "POST",
      headers: cloudHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    setCloudStatus(`Cloud СЃР°Т›С‚Р°Р»РґС‹: ${new Date().toLocaleString()}`, true);
  } catch (error) {
    setCloudStatus(`Cloud СЃР°Т›С‚Р°Сѓ Т›Р°С‚РµСЃС–: ${shortError(error)}`, false);
  }
}

async function pullCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Cloud Т›РѕСЃС‹Р»РјР°Т“Р°РЅ: РѕСЃС‹ Р±СЂР°СѓР·РµСЂРґРµ Supabase URL/anon key/workspace СЃР°Т›С‚Р°Р»РјР°Т“Р°РЅ. Cloud Т›РѕСЃСѓ РЅРµРјРµСЃРµ Cloud Р±Р°РїС‚Р°СѓС‹РЅ РµРЅРіС–Р·Сѓ Т›РѕР»РґР°РЅС‹ТЈС‹Р·.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Cloud-С‚Р°РЅ РѕТ›С‹Р»С‹Рї Р¶Р°С‚С‹СЂ...", true);
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?id=eq.${encodeURIComponent(cloudRowId())}&select=payload,updated_at`, {
      headers: cloudHeaders()
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (!rows.length) {
      setCloudStatus("Cloud-С‚Р° Р±Т±Р» workspace ТЇС€С–РЅ Р±Р°Р·Р° У™Р»С– Р¶РѕТ›. РђР»РґС‹РјРµРЅ Cloud-Т›Р° СЃР°Т›С‚Р°Сѓ Р±Р°СЃС‹ТЈС‹Р·.", false);
      return;
    }
    const payload = rows[0].payload || {};
    state.docs = Array.isArray(payload.docs) ? payload.docs.map(normalizeDoc) : [];
    state.tasks = Array.isArray(payload.tasks) ? payload.tasks.map(normalizeTask) : [];
    state.notes = Array.isArray(payload.notes) ? payload.notes.map(normalizeNote) : [];
    persist({ sync: false });
    render();
    setCloudStatus(`Cloud-С‚Р°РЅ Р°Р»С‹РЅРґС‹: ${rows[0].updated_at || "ready"}`, true);
  } catch (error) {
    setCloudStatus(`Cloud РѕТ›Сѓ Т›Р°С‚РµСЃС–: ${shortError(error)}`, false);
  }
}

function scheduleCloudPush() {
  if (!cloudReady()) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => pushCloud(false), 1200);
}

function renderCloudSettings() {
  if (!$("cloudUrl")) return;
  $("cloudUrl").value = cloudConfig.url || "";
  $("cloudKey").value = cloudConfig.key || "";
  $("cloudWorkspace").value = cloudConfig.workspace || "";
  $("cloudBadge").textContent = cloudReady() ? "Cloud" : "Local";
  setCloudStatus(cloudReady() ? `Cloud Р°РІС‚РѕРјР°С‚С‚С‹ РґР°Р№С‹РЅ: ${cloudConfig.workspace}. УЁР·РіРµСЂС–СЃС‚РµСЂ СЃР°Т›С‚Р°Р»Р°РґС‹.` : "Cloud СѓР°Т›С‹С‚С€Р° РґР°Р№С‹РЅ РµРјРµСЃ. Р‘РµС‚С‚С– Р¶Р°ТЈР°СЂС‚С‹Рї РєУ©СЂС–ТЈС–Р· РЅРµРјРµСЃРµ Cloud-С‚Р°РЅ Р°Р»Сѓ Р±Р°СЃС‹ТЈС‹Р·.", cloudReady());
}

function loadCloudConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("sanabase-cloud")) || {};
    const config = {
      url: cleanSupabaseUrl(saved.url || ""),
      key: saved.key || "",
      workspace: saved.workspace || ""
    };
    return cloudConfigComplete(config) ? config : { ...DEFAULT_CLOUD_CONFIG };
  } catch {
    return { ...DEFAULT_CLOUD_CONFIG };
  }
}

function cloudReady() {
  return cloudConfigComplete(cloudConfig);
}

function cloudConfigComplete(config) {
  return Boolean(config?.url && config?.key && config?.workspace);
}

function cleanSupabaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function cloudRowId() {
  return `brain:${cloudConfig.workspace}`;
}

function cloudHeaders(extra = {}) {
  return {
    apikey: cloudConfig.key,
    Authorization: `Bearer ${cloudConfig.key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function setCloudStatus(message, good) {
  const node = $("cloudStatus");
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("ok", Boolean(good));
  node.classList.toggle("bad", !good);
}

function shortError(error) {
  return String(error?.message || error).slice(0, 280);
}

async function ai(mode, prompt, language = "Kazakh", assistantMode = "auto") {
  try {
    return await api("api/ai", {
      mode,
      prompt,
      language,
      assistantMode,
      system: assistantInstruction(assistantMode),
      context: buildContext(),
      notes: state.notes.map(n => `${n.title}\n${n.body}`).join("\n\n")
    });
  } catch {
    return { text: localAnswer(mode, prompt, language, assistantMode) };
  }
}

async function extractFile(file) {
  try {
    return await serverImport(file);
  } catch {
    return browserImport(file);
  }
}

async function serverImport(file) {
  const data = await fileToBase64(file);
  return api("api/import", { name: file.name, type: file.type, data });
}

async function browserImport(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (["txt", "md", "csv", "tsv"].includes(ext)) {
    return { name: file.name, type: file.type || ext, text: await file.text() };
  }
  if (["xlsx", "xls"].includes(ext)) {
    if (!window.XLSX) return unsupported(file, "Excel РѕТ›Сѓ РєС–С‚Р°РїС…Р°РЅР°СЃС‹ Р¶ТЇРєС‚РµР»РјРµРґС–.");
    const table = await readTableFile(file);
    return { name: file.name, type: file.type || ext, text: table.rows.map(row => row.join("\t")).join("\n") };
  }
  if (ext === "docx") {
    if (!window.mammoth) return unsupported(file, "Word РѕТ›Сѓ РєС–С‚Р°РїС…Р°РЅР°СЃС‹ Р¶ТЇРєС‚РµР»РјРµРґС–.");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { name: file.name, type: file.type || ext, text: result.value };
  }
  if (ext === "pdf") {
    return readPdf(file);
  }
  return unsupported(file, "Р‘Т±Р» С„Р°Р№Р» С‚ТЇСЂС–РЅ Р±СЂР°СѓР·РµСЂРґРµ РѕТ›Сѓ У™Р·С–СЂРіРµ РјТЇРјРєС–РЅ РµРјРµСЃ.");
}

async function readPdf(file) {
  const pdfjs = globalThis.pdfjsLib || await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }
  return { name: file.name, type: file.type || "pdf", text: pages.join("\n\n") };
}

function unsupported(file, warning) {
  return { name: file.name, type: file.type || "unknown", text: "", warning };
}

function localAnswer(mode, prompt, language, assistantMode = "auto") {
  const context = buildContext();
  if (!context.trim()) {
    return emptyAssistantAnswer(assistantMode);
  }
  if (mode === "quiz") return makeQuiz(context);
  if (mode === "crm") return analyzeCrm(context);
  if (mode === "translate") return simpleTranslate(prompt, language);
  return answerFromContext(prompt, context, assistantMode);
}

function answerFromContext(prompt, context, assistantMode = "auto") {
  const queryWords = keywords(prompt);
  const sentences = context
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(sentence => ({
      sentence,
      score: queryWords.reduce((sum, word) => sum + (sentence.toLowerCase().includes(word) ? 1 : 0), 0)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => item.sentence);
  if (assistantMode === "crm") return analyzeCrm(context);
  if (assistantMode === "tasks") return taskPlanFromContext(prompt, context, sentences);
  if (assistantMode === "action") return actionPlanAnswer(prompt, sentences.length ? sentences : [context.slice(0, 1200)]);
  if (!sentences.length) return "Р‘Т±Р» СЃТ±СЂР°Т›Т›Р° РЅР°Т›С‚С‹ СЃУ™Р№РєРµСЃ Р¶РѕР» С‚Р°Р±С‹Р»РјР°РґС‹. Р‘Р°Р·Р°ТЈС‹Р·РґР°РЅ РµТЈ РјР°ТЈС‹Р·РґС‹ ТЇР·С–РЅРґС–:\n\n" + context.slice(0, 1200) + nextStepBlock();
  if (assistantMode === "brief") return sentences.slice(0, 3).join("\n\n");
  return "Р‘Р°Р·Р° Р±РѕР№С‹РЅС€Р° Т›С‹СЃТ›Р° Р¶Р°СѓР°Рї:\n\n" + sentences.join("\n\n") + nextStepBlock();
}

function assistantInstruction(mode) {
  const base = "Р–Р°СѓР°РїС‚С‹ Т›Р°Р·Р°Т›С€Р° Р±РµСЂ. ТљТ±Р¶Р°С‚, CRM, tasks Р¶У™РЅРµ notes РєРѕРЅС‚РµРєСЃС‚С–РЅРµ СЃТЇР№РµРЅ. РќР°Т›С‚С‹ РґРµСЂРµРє Р¶РѕТ› Р±РѕР»СЃР°, СЃРѕРЅС‹ Р°Р№С‚.";
  const modes = {
    brief: "УЁС‚Рµ Т›С‹СЃТ›Р° Р¶Р°СѓР°Рї Р±РµСЂ: РјР°РєСЃРёРјСѓРј 5 bullet.",
    action: "Р–Р°СѓР°РїС‚С‹ РјС–РЅРґРµС‚С‚С– С‚ТЇСЂРґРµ: ТљРѕСЂС‹С‚С‹РЅРґС‹, РќР°Т›С‚С‹ У™СЂРµРєРµС‚С‚РµСЂ, РўУ™СѓРµРєРµР», РљРµР»РµСЃС– Т›Р°РґР°Рј С„РѕСЂРјР°С‚С‹РЅРґР° Р±РµСЂ.",
    crm: "CRM Р°РЅР°Р»РёС‚РёРє СЃРёСЏТ›С‚С‹ Р¶Р°СѓР°Рї Р±РµСЂ: РєР»РёРµРЅС‚, С‚Р°Р±С‹СЃ, pipeline, С‚У™СѓРµРєРµР», follow-up.",
    tasks: "ТљТ±Р¶Р°С‚С‚Р°РЅ РѕСЂС‹РЅРґР°Р»Р°С‚С‹РЅ С‚Р°РїСЃС‹СЂРјР°Р»Р°СЂРґС‹ С€С‹Т“Р°СЂ: title, priority, deadline Р±Р°СЂ Р±РѕР»СЃР° РєУ©СЂСЃРµС‚."
  };
  return `${base} ${modes[mode] || "РџР°Р№РґР°Р»Р°РЅСѓС€С‹Т“Р° РµТЈ РїР°Р№РґР°Р»С‹ С„РѕСЂРјР°С‚С‚С‹ С‚Р°ТЈРґР°."}`;
}

function emptyAssistantAnswer(mode) {
  const base = "УР·С–СЂРіРµ Р±Р°Р·Р° Р±РѕСЃ. PDF/Word/Excel/CSV Р¶ТЇРєС‚РµСЃРµТЈС–Р·, РјРµРЅ СЃРѕРЅС‹ТЈ С–С€С–РЅРµРЅ Р¶Р°СѓР°Рї Р±РµСЂРµРјС–РЅ.";
  if (mode === "tasks") return `${base}\n\nТљРѕСЃСѓТ“Р° Р±РѕР»Р°С‚С‹РЅ РЅУ™СЂСЃРµ: Т›Т±Р¶Р°С‚С‚Р°РЅ Р°РІС‚РѕРјР°С‚С‚С‹ task С€С‹Т“Р°СЂСѓ, deadline С‚Р°Р±Сѓ, Р¶Р°СѓР°РїС‚С‹ Р°РґР°РјРґС‹ Р±РµР»РіС–Р»РµСѓ.`;
  if (mode === "crm") return `${base}\n\nCRM ТЇС€С–РЅ Excel/CSV Р¶ТЇРєС‚РµТЈС–Р·: РјРµРЅ РєР»РёРµРЅС‚С‚РµСЂРґС–, СЃР°С‚С‹Р»С‹Рј СЃРѕРјР°СЃС‹РЅ, С‚У™СѓРµРєРµР»РґС– Р¶У™РЅРµ follow-up task-С‚Р°СЂРґС‹ С€С‹Т“Р°СЂР°РјС‹РЅ.`;
  return `${base}\n\nРњРµРЅ Т›Р°Р·С–СЂ РјС‹РЅР°РЅС‹ С–СЃС‚РµР№ Р°Р»Р°РјС‹РЅ: Т›Т±Р¶Р°С‚ РѕТ›Сѓ, РїСЂР°Р№СЃ СЃР°Р»С‹СЃС‚С‹СЂСѓ, CRM С‚Р°Р»РґР°Сѓ, task Р¶Р°СЃР°Сѓ, quiz/translation, Second Brain С–Р·РґРµСѓ.`;
}

function actionPlanAnswer(prompt, facts) {
  return [
    "ТљРѕСЂС‹С‚С‹РЅРґС‹:",
    facts.slice(0, 2).join("\n\n"),
    "",
    "РќР°Т›С‚С‹ У™СЂРµРєРµС‚С‚РµСЂ:",
    "1. Р•ТЈ РјР°ТЈС‹Р·РґС‹ Р¶РѕР»РґР°СЂРґС‹ С‚РµРєСЃРµСЂС–ТЈС–Р·.",
    "2. ТљР°Р¶РµС‚ Р±РѕР»СЃР° Tasks Р±Р°С‚С‹СЂРјР°СЃС‹РјРµРЅ follow-up Р¶Р°СЃР°ТЈС‹Р·.",
    "3. Р•РіРµСЂ Р±Т±Р» РїСЂР°Р№СЃ Р±РѕР»СЃР°, Price Match Р°СЂТ›С‹Р»С‹ РєРѕРґ Р±РѕР№С‹РЅС€Р° С‚РѕР»С‹Т›С‚С‹СЂС‹ТЈС‹Р·.",
    "",
    "РўУ™СѓРµРєРµР»:",
    "Р”РµСЂРµРє С‚РѕР»С‹Т› Р±РѕР»РјР°СЃР° РЅРµРјРµСЃРµ РєРѕРґ/Р±Р°Т“Р° Р±Р°Т“Р°РЅРґР°СЂС‹ У™СЂС‚ТЇСЂР»С– Р°С‚Р°Р»СЃР°, РЅУ™С‚РёР¶РµРЅС– Т›РѕР»РјРµРЅ С‚РµРєСЃРµСЂСѓ РєРµСЂРµРє.",
    "",
    "РљРµР»РµСЃС– Т›Р°РґР°Рј:",
    "РњР°Т“Р°РЅ РЅР°Т›С‚С‹ Т›Т±Р¶Р°С‚ Р°С‚Р°СѓС‹РЅ, РєР»РёРµРЅС‚С‚С– РЅРµРјРµСЃРµ С‚Р°СѓР°СЂ РєРѕРґС‹РЅ Р¶Р°Р·СЃР°ТЈС‹Р·, Р¶Р°СѓР°РїС‚С‹ С‚Р°СЂС‹Р»С‚Р°РјС‹РЅ."
  ].join("\n");
}

function taskPlanFromContext(prompt, context, matches) {
  const lines = (matches.length ? matches : context.split(/\n+/))
    .map(line => line.trim())
    .filter(line => line.length > 20)
    .slice(0, 8);
  return [
    "ТљТ±Р¶Р°С‚С‚Р°СЂРґР°РЅ С€С‹Т“Р°С‚С‹РЅ С‚Р°РїСЃС‹СЂРјР°Р»Р°СЂ:",
    ...lines.slice(0, 5).map((line, index) => `${index + 1}. ${line.slice(0, 140)}\n   Priority: ${/(urgent|Т›Р°С‚Рµ|РѕС€РёР±РєР°|РґРѕР»Рі|С‚У©Р»РµРј|risk|С‚У™СѓРµРєРµР»)/i.test(line) ? "High" : "Medium"}\n   Status: Р†СЃС‚РµСѓ`),
    "",
    "РљРµТЈРµСЃ: РѕСЃС‹ Р¶Р°СѓР°РїС‚С‹ Р±С–СЂРґРµРЅ Tasks С‚Р°Т›С‚Р°СЃС‹РЅР° Т›РѕСЃСѓ ТЇС€С–РЅ `РЎРѕТЈТ“С‹ Р¶Р°СѓР°РїС‚Р°РЅ task` Р±Р°С‚С‹СЂРјР°СЃС‹РЅ Р±Р°СЃС‹ТЈС‹Р·."
  ].join("\n");
}

function nextStepBlock() {
  return "\n\nРљРµР»РµСЃС– Т›Р°РґР°Рј:\n- РќР°Т›С‚С‹ task РєРµСЂРµРє Р±РѕР»СЃР°, `РЎРѕТЈТ“С‹ Р¶Р°СѓР°РїС‚Р°РЅ task` Р±Р°СЃС‹ТЈС‹Р·.\n- CRM РєРµСЂРµРє Р±РѕР»СЃР°, СЂРµР¶РёРјРґС– `CRM С‚Р°Р»РґР°Сѓ` Т›С‹Р»С‹ТЈС‹Р·.\n- ТљС‹СЃТ›Р° Р¶Р°СѓР°Рї РєРµСЂРµРє Р±РѕР»СЃР°, `ТљС‹СЃТ›Р° Р¶Р°СѓР°Рї` СЂРµР¶РёРјС–РЅ С‚Р°ТЈРґР°ТЈС‹Р·.";
}

function firstMeaningfulLine(value) {
  return String(value || "")
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.\s]+/, "").trim())
    .find(line => line.length > 3) || "";
}

function inferPriority(value) {
  return /(urgent|СЃСЂРѕС‡РЅРѕ|С€Т±Т“С‹Р»|Т›Р°С‚Рµ|РѕС€РёР±РєР°|risk|С‚У™СѓРµРєРµР»|С‚У©Р»РµРј|РґРѕР»Рі|debt)/i.test(value) ? "high" : "medium";
}

function makeQuiz(context) {
  const pool = context.split(/\n+/).map(line => line.trim()).filter(line => line.length > 40).slice(0, 8);
  const selected = pool.length ? pool : [context.slice(0, 400)];
  return selected.slice(0, 5).map((line, index) => {
    const short = line.slice(0, 120);
    return `${index + 1}. РњС‹РЅР° РѕР№РґС‹ТЈ РЅРµРіС–Р·РіС– РјР°Т“С‹РЅР°СЃС‹ Т›Р°РЅРґР°Р№?\n   "${short}..."\n   A) РќРµРіС–Р·РіС– РґРµСЂРµРє\n   B) ТљР°С‚С‹СЃС‹ Р¶РѕТ› Р°Т›РїР°СЂР°С‚\n   C) ТљР°С‚Рµ С‚Т±Р¶С‹СЂС‹Рј\n   Р–Р°СѓР°Рї: A`;
  }).join("\n\n");
}

function analyzeCrm(context) {
  const rows = context.split(/\n/).filter(Boolean);
  const header = rows.find(row => row.includes("\t") || row.includes(",")) || "";
  const money = rows.join("\n").match(/\b\d{3,}(?:[.,]\d+)?\b/g) || [];
  return [
    "CRM Т›С‹СЃТ›Р°С€Р° Р°СѓРґРёС‚:",
    `- Р–РѕР» СЃР°РЅС‹: С€Р°РјР°РјРµРЅ ${rows.length}`,
    `- Р‘Р°Т“Р°РЅРґР°СЂ: ${header.slice(0, 220) || "Р°РЅС‹Т›С‚Р°Р»РјР°РґС‹"}`,
    `- РЎР°РЅРґС‹Т› РјУ™РЅРґРµСЂ: ${money.length ? money.slice(0, 12).join(", ") : "С‚Р°Р±С‹Р»РјР°РґС‹"}`,
    "",
    "Р•РіРµСЂ РµРєС– РїСЂР°Р№СЃС‚С‹ РєРѕРґ Р±РѕР№С‹РЅС€Р° С‚РѕР»С‹Т›С‚С‹СЂСѓ РєРµСЂРµРє Р±РѕР»СЃР°, Price Match Р±У©Р»С–РјС–РЅ Т›РѕР»РґР°РЅС‹ТЈС‹Р·."
  ].join("\n");
}

function simpleTranslate(text, language) {
  const labels = {
    Kazakh: "ТљР°Р·Р°Т›С€Р° РјР°Т“С‹РЅР°СЃС‹",
    English: "English meaning",
    Russian: "Р СѓСЃСЃРєРёР№ СЃРјС‹СЃР»",
    Turkish: "Turkish meaning",
    Chinese: "Chinese meaning"
  };
  return `${labels[language] || "Translation"}:\n\n${text}`;
}

function keywords(value) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(word => word.length > 2).slice(0, 20);
}

function splitList(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function inferTags(name, text) {
  const source = `${name} ${text}`.toLowerCase();
  const tags = [];
  [
    ["price", /price|Р±Р°Т“Р°|РїСЂР°Р№СЃ|С†РµРЅР°|С‚Р°СѓР°СЂ|С‚РѕРІР°СЂ|РєРѕРґ/],
    ["crm", /crm|РєР»РёРµРЅС‚|Р»РёРґ|СЃР°С‚С‹Р»С‹Рј|РїСЂРѕРґР°Р¶|manager|РјРµРЅРµРґР¶РµСЂ/],
    ["contract", /contract|РґРѕРіРѕРІРѕСЂ|РєРµР»С–СЃС–Рј|С€Р°СЂС‚/],
    ["finance", /invoice|СЃС‡РµС‚|С‚У©Р»РµРј|РѕРїР»Р°С‚Р°|payment|amount|СЃСѓРјРјР°/],
    ["warehouse", /СЃРєР»Р°Рґ|Т›РѕР№РјР°|РѕСЃС‚Р°С‚РѕРє|stock|quantity|СЃР°РЅС‹|Т›РѕСЂР°Рї|РєРѕСЂРѕР±РєР°/]
  ].forEach(([tag, pattern]) => {
    if (pattern.test(source)) tags.push(tag);
  });
  return [...new Set(tags.concat(keywords(name).slice(0, 4)))].slice(0, 8);
}

function normalizeDoc(doc) {
  const text = doc.text || "";
  return {
    id: doc.id || crypto.randomUUID(),
    name: doc.name || "Imported document",
    type: doc.type || "unknown",
    text,
    warning: doc.warning || "",
    tags: Array.isArray(doc.tags) && doc.tags.length ? doc.tags : inferTags(doc.name || "", text),
    links: Array.isArray(doc.links) ? doc.links : [],
    createdAt: doc.createdAt || new Date().toISOString()
  };
}

function normalizeTask(task) {
  return {
    id: task.id || crypto.randomUUID(),
    title: task.title || "Untitled task",
    body: task.body || "",
    status: ["todo", "doing", "done"].includes(task.status) ? task.status : "todo",
    priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
    due: task.due || "",
    owner: task.owner || "",
    link: task.link || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
  };
}

function normalizeNote(note) {
  const body = note.body || "";
  return {
    id: note.id || crypto.randomUUID(),
    title: note.title || "Untitled note",
    body,
    folder: note.folder || "General",
    type: ["short", "long", "idea", "meeting"].includes(note.type) ? note.type : autoNoteType(body),
    tags: Array.isArray(note.tags) ? note.tags : splitList(note.tags || ""),
    brain: Boolean(note.brain),
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || note.createdAt || new Date().toISOString()
  };
}

function noteToBrainItem(note) {
  return {
    id: `note:${note.id}`,
    noteId: note.id,
    name: note.title,
    type: note.type || "note",
    brainKind: "note",
    folder: note.folder || "General",
    text: note.body || "",
    warning: "",
    tags: [...new Set([note.folder || "General", note.type || "note", ...(note.tags || [])])],
    links: [],
    createdAt: note.createdAt
  };
}

function autoNoteType(body) {
  return String(body || "").length > 700 ? "long" : "short";
}

function noteTypeLabel(type) {
  return {
    short: "ТљС‹СЃТ›Р°",
    long: "Т°Р·Р°Т›",
    idea: "РРґРµСЏ",
    meeting: "РљРµР·РґРµСЃСѓ"
  }[type] || "ТљС‹СЃТ›Р°";
}

function noteFolders() {
  return [...new Set(state.notes.map(note => note.folder || "General"))].sort((a, b) => a.localeCompare(b));
}

function findRelatedDocs(doc) {
  const tags = new Set(doc.tags || []);
  const manual = new Set((doc.links || []).map(item => item.toLowerCase()));
  return state.docs
    .filter(item => item.id !== doc.id)
    .map(item => {
      const tagScore = (item.tags || []).filter(tag => tags.has(tag)).length;
      const manualScore = manual.has(item.id.toLowerCase()) || manual.has(item.name.toLowerCase()) ? 5 : 0;
      return { ...item, score: tagScore + manualScore };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function buildContext() {
  const docs = state.docs
    .filter(doc => doc.text)
    .slice(0, 10)
    .map(doc => `Document: ${doc.name}\nTags: ${(doc.tags || []).join(", ")}\nLinks: ${(doc.links || []).join(", ")}\n${doc.text.slice(0, 12000)}`);
  const notes = state.notes
    .slice(0, 10)
    .map(note => `Note: ${note.title}\nFolder: ${note.folder || "General"}\nType: ${note.type || "short"}\nTags: ${(note.tags || []).join(", ")}\n${note.body}`);
  const tasks = state.tasks
    .slice(0, 30)
    .map(task => `Task: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}\nDue: ${task.due || "-"}\nOwner: ${task.owner || "-"}\n${task.body}`);
  return docs.concat(tasks, notes).join("\n\n---\n\n");
}

async function api(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function addMessage(kind, text) {
  const node = document.createElement("div");
  node.className = `message ${kind}`;
  node.textContent = text;
  $("messages").appendChild(node);
  $("messages").scrollTop = $("messages").scrollHeight;
  return node;
}

function render() {
  if ($("docCount")) $("docCount").textContent = `${state.docs.length} docs`;
  state.notes = state.notes.map(normalizeNote);
  if ($("noteCount")) $("noteCount").textContent = `${state.notes.length} notes`;
  if ($("taskCount")) $("taskCount").textContent = `${state.tasks.length} tasks`;
  state.docs = state.docs.map(normalizeDoc);
  state.tasks = state.tasks.map(normalizeTask);
  const query = $("searchDocs")?.value?.toLowerCase() || "";
  if (!$("docsGrid")) return;
  $("docsGrid").innerHTML = "";
  state.docs
    .filter(doc => `${doc.name} ${doc.text}`.toLowerCase().includes(query))
    .forEach(doc => {
      const card = document.createElement("article");
      card.className = "doc";
      card.innerHTML = `<h3>${escapeHtml(doc.name)}</h3><p>${escapeHtml(doc.warning || doc.text || "Selectable text С‚Р°Р±С‹Р»РјР°РґС‹.")}</p>`;
      $("docsGrid").appendChild(card);
    });
  renderNotes();
  renderTasks();
  renderBrain();
  renderCloudSettings();
}

function renderNotes() {
  const list = $("notesList");
  if (!list) return;
  const folderFilter = $("noteFolderFilter");
  const folders = noteFolders();
  const current = folderFilter?.value || "all";
  if (folderFilter) {
    folderFilter.innerHTML = `<option value="all">Р‘Р°СЂР»С‹Т› РїР°РїРєР°</option>` + folders.map(folder => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`).join("");
    folderFilter.value = folders.includes(current) ? current : "all";
  }
  const activeFolder = folderFilter?.value || "all";
  const query = $("noteSearch")?.value?.toLowerCase() || "";
  const filtered = state.notes.filter(note => {
    const inFolder = activeFolder === "all" || note.folder === activeFolder;
    const text = `${note.title} ${note.body} ${note.folder} ${note.type} ${(note.tags || []).join(" ")}`.toLowerCase();
    return inFolder && text.includes(query);
  });
  renderNoteFolders(folders, activeFolder);
  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<article class="note empty-note"><h3>Р–Р°Р·Р±Р° Р¶РѕТ›</h3><p>РџР°РїРєР° С‚Р°ТЈРґР°Рї, Т›С‹СЃТ›Р° РЅРµРјРµСЃРµ Т±Р·Р°Т› Р°Т›РїР°СЂР°С‚ СЃР°Т›С‚Р°ТЈС‹Р·.</p></article>`;
    return;
  }
  filtered.forEach(note => {
    const card = document.createElement("article");
    card.className = `note note-${escapeHtml(note.type)}`;
    card.innerHTML = `
      <div class="note-head">
        <div>
          <h3>${escapeHtml(note.title)}</h3>
          <span>${escapeHtml(note.folder || "General")} В· ${escapeHtml(noteTypeLabel(note.type))}</span>
        </div>
        <div class="note-actions">
          <button type="button" data-note-brain="${escapeHtml(note.id)}">${note.brain ? "Brain-РґР°" : "Brain-Т“Р°"}</button>
          <button type="button" data-note-delete="${escapeHtml(note.id)}">УЁС€С–СЂСѓ</button>
        </div>
      </div>
      <p>${escapeHtml(note.body)}</p>
      <div class="tag-row">${(note.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || `<span class="tag muted-tag">no tags</span>`}</div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll("[data-note-delete]").forEach(button => {
    button.addEventListener("click", () => deleteNote(button.dataset.noteDelete));
  });
  list.querySelectorAll("[data-note-brain]").forEach(button => {
    button.addEventListener("click", () => toggleNoteBrain(button.dataset.noteBrain));
  });
}

function renderNoteFolders(folders, activeFolder) {
  const row = $("noteFolders");
  if (!row) return;
  const allCount = state.notes.length;
  row.innerHTML = [`<button type="button" data-note-folder="all" class="${activeFolder === "all" ? "active" : ""}">Р‘Р°СЂР»С‹Т“С‹ <span>${allCount}</span></button>`]
    .concat(folders.map(folder => {
      const count = state.notes.filter(note => note.folder === folder).length;
      return `<button type="button" data-note-folder="${escapeHtml(folder)}" class="${activeFolder === folder ? "active" : ""}">${escapeHtml(folder)} <span>${count}</span></button>`;
    }))
    .join("");
  row.querySelectorAll("[data-note-folder]").forEach(button => {
    button.addEventListener("click", () => {
      if ($("noteFolderFilter")) $("noteFolderFilter").value = button.dataset.noteFolder;
      if (button.dataset.noteFolder !== "all" && $("noteFolder")) $("noteFolder").value = button.dataset.noteFolder;
      render();
    });
  });
}

function deleteNote(id) {
  state.notes = state.notes.filter(note => note.id !== id);
  persist();
  render();
}

function toggleNoteBrain(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  note.brain = !note.brain;
  note.updatedAt = new Date().toISOString();
  persist();
  render();
}

function renderTasks() {
  const board = $("taskBoard");
  if (!board) return;
  const query = $("taskSearch").value?.toLowerCase() || "";
  const columns = [
    ["todo", "Р†СЃС‚РµСѓ"],
    ["doing", "Р–ТЇСЂС–Рї Р¶Р°С‚С‹СЂ"],
    ["done", "Р”Р°Р№С‹РЅ"]
  ];
  board.innerHTML = "";
  columns.forEach(([status, label]) => {
    const items = state.tasks.filter(task => task.status === status && `${task.title} ${task.body} ${task.owner} ${task.link}`.toLowerCase().includes(query));
    const column = document.createElement("section");
    column.className = "kanban-column";
    column.innerHTML = `
      <div class="kanban-head">
        <h3>${label}</h3>
        <span>${items.length}</span>
      </div>
      <div class="kanban-list">
        ${items.map(task => taskCard(task)).join("") || `<article class="task-card empty-task">РўР°РїСЃС‹СЂРјР° Р¶РѕТ›</article>`}
      </div>
    `;
    board.appendChild(column);
  });
  board.querySelectorAll("[data-task-move]").forEach(button => {
    button.addEventListener("click", () => moveTask(button.dataset.taskMove, button.dataset.status));
  });
  board.querySelectorAll("[data-task-delete]").forEach(button => {
    button.addEventListener("click", () => deleteTask(button.dataset.taskDelete));
  });
}

function taskCard(task) {
  const moves = [
    ["todo", "Р†СЃС‚РµСѓ"],
    ["doing", "Р–ТЇСЂСѓ"],
    ["done", "Р”Р°Р№С‹РЅ"]
  ].filter(([status]) => status !== task.status);
  return `
    <article class="task-card priority-${escapeHtml(task.priority)}">
      <div class="task-top">
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(priorityLabel(task.priority))}</span>
      </div>
      <p>${escapeHtml(task.body || "РЎРёРїР°С‚С‚Р°РјР° Р¶РѕТ›")}</p>
      <div class="task-meta">
        ${task.due ? `<span>Deadline: ${escapeHtml(task.due)}</span>` : ""}
        ${task.owner ? `<span>Р–Р°СѓР°РїС‚С‹: ${escapeHtml(task.owner)}</span>` : ""}
        ${task.link ? `<span>Р‘Р°Р№Р»Р°РЅС‹СЃ: ${escapeHtml(task.link)}</span>` : ""}
      </div>
      <div class="task-actions">
        ${moves.map(([status, label]) => `<button type="button" data-task-move="${escapeHtml(task.id)}" data-status="${status}">${label}</button>`).join("")}
        <button type="button" data-task-delete="${escapeHtml(task.id)}">УЁС€С–СЂСѓ</button>
      </div>
    </article>
  `;
}

function priorityLabel(priority) {
  return { low: "Low", medium: "Medium", high: "High" }[priority] || "Medium";
}

function renderBrain() {
  const list = $("brainList");
  if (!list) return;
  const query = $("brainSearch").value?.toLowerCase() || "";
  const docs = state.docs
    .map(doc => ({ ...doc, brainKind: "doc" }))
    .concat(state.notes.filter(note => note.brain).map(noteToBrainItem))
    .filter(doc => `${doc.name} ${(doc.tags || []).join(" ")} ${(doc.links || []).join(" ")} ${doc.text} ${doc.folder || ""}`.toLowerCase().includes(query));
  list.innerHTML = "";
  if (!docs.length) {
    list.innerHTML = `<article class="brain-card"><h3>Brain Р±РѕСЃ</h3><p>Upload Р°СЂТ›С‹Р»С‹ Т›Т±Р¶Р°С‚ Р¶ТЇРєС‚РµТЈС–Р· РЅРµРјРµСЃРµ Notes С–С€С–РЅРґРµ РјР°ТЈС‹Р·РґС‹ Р¶Р°Р·Р±Р°РЅС‹ Brain-Т“Р° Р±Р°С‚С‹СЂРјР°СЃС‹РјРµРЅ Р±РµРєС–С‚С–ТЈС–Р·.</p></article>`;
    return;
  }
  docs.forEach(doc => {
    const related = findRelatedDocs(doc).slice(0, 5);
    const card = document.createElement("article");
    card.className = `brain-card brain-${escapeHtml(doc.brainKind || "doc")}`;
    card.innerHTML = `
      <div class="brain-head">
        <div>
          <h3>${escapeHtml(doc.name)}</h3>
          <p>${escapeHtml(doc.warning || doc.text || "РњУ™С‚С–РЅ С‚Р°Р±С‹Р»РјР°РґС‹.")}</p>
        </div>
        <span class="brain-type">${escapeHtml(doc.brainKind === "note" ? `note / ${doc.folder || "General"}` : doc.type || "file")}</span>
      </div>
      <div class="tag-row">${(doc.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || `<span class="tag muted-tag">no tags</span>`}</div>
      ${doc.brainKind === "note" ? `<div class="related"><strong>Notes РїР°РїРєР°СЃС‹:</strong><span>${escapeHtml(doc.folder || "General")}</span></div>` : ""}
      ${doc.brainKind === "doc" ? `<div class="brain-fields">
        <label>
          <span>РўРµРіС‚РµСЂ</span>
          <input data-tags-for="${escapeHtml(doc.id)}" value="${escapeHtml((doc.tags || []).join(", "))}" placeholder="price, crm, РєР»РёРµРЅС‚">
        </label>
        <label>
          <span>Р‘Р°Р№Р»Р°РЅС‹СЃТ›Р°РЅ Т›Т±Р¶Р°С‚С‚Р°СЂ</span>
          <input data-links-for="${escapeHtml(doc.id)}" value="${escapeHtml((doc.links || []).join(", "))}" placeholder="Т›Т±Р¶Р°С‚ Р°С‚С‹ РЅРµРјРµСЃРµ ID">
        </label>
      </div>` : ""}
      <div class="related">
        <strong>РђРІС‚Рѕ Р±Р°Р№Р»Р°РЅС‹СЃ:</strong>
        ${related.length ? related.map(item => `<span>${escapeHtml(item.name)}</span>`).join("") : "<span>С‚Р°Р±С‹Р»РјР°РґС‹</span>"}
      </div>
      ${doc.brainKind === "doc" ? `<button type="button" data-save-brain="${escapeHtml(doc.id)}">РЎР°Т›С‚Р°Сѓ</button>` : `<button type="button" data-note-unbrain="${escapeHtml(doc.noteId)}">Brain-РЅР°РЅ Р°Р»Сѓ</button>`}
    `;
    list.appendChild(card);
  });
  list.querySelectorAll("[data-save-brain]").forEach(button => {
    button.addEventListener("click", () => saveBrainMeta(button.dataset.saveBrain));
  });
  list.querySelectorAll("[data-note-unbrain]").forEach(button => {
    button.addEventListener("click", () => toggleNoteBrain(button.dataset.noteUnbrain));
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("sanabase-state")) || {};
    return {
      docs: Array.isArray(saved.docs) ? saved.docs.map(normalizeDoc) : [],
      tasks: Array.isArray(saved.tasks) ? saved.tasks.map(normalizeTask) : [],
      notes: Array.isArray(saved.notes) ? saved.notes.map(normalizeNote) : []
    };
  } catch {
    return { docs: [], tasks: [], notes: [] };
  }
}

function persist(options = {}) {
  localStorage.setItem("sanabase-state", JSON.stringify(state));
  if (options.sync !== false) scheduleCloudPush();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

