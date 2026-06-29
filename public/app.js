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
  chat: ["AI Chat", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Knowledge Base", "PDF, Word, Excel және мәтін материалдары."],
  match: ["Price Match", "Формуласы бар қорап/саны бағандарын өзгертпей, бағасын almat company price арқылы қояды."],
  brain: ["Second Brain", "Құжаттарды сақтап, тегпен байланыстырып, сол базадан CRM жасау."],
  translate: ["Translation", "Мәтінді қалаған тілге аударыңыз."],
  quiz: ["Quiz Generator", "Базаңыздан тест және жауап кілтін жасаңыз."],
  crm: ["CRM Analysis", "Excel/CSV CRM базасын талдаңыз."],
  tasks: ["Tasks", "Trello сияқты тапсырмалар тақтасы."],
  notes: ["Notes", "Ойлар мен конспектілерді сақтаңыз."]
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
on("brainImageFiles", "change", importBrainImages);
on("cloudSaveBtn", "click", saveCloudSettings);
on("cloudPushBtn", "click", () => pushCloud(true));
on("cloudPullBtn", "click", () => pullCloud(true));
on("cloudConfigExportBtn", "click", exportCloudConfig);
on("cloudConfigImportFile", "change", importCloudConfig);
on("cloudClearBtn", "click", clearCloudSettings);
on("clearDocs", "click", () => {
  if (!confirm("Барлық сақталған құжаттарды өшіреміз бе?")) return;
  state.docs = [];
  persist();
  render();
});
document.querySelectorAll("[data-quick-prompt]").forEach(button => {
  button.addEventListener("click", () => runQuickPrompt(button.dataset.quickPrompt));
});

render();
renderCloudSettings();
addMessage("ai", "Сәлем! Price Match бөлімі 1-құжаттың формуласы бар қорап/саны бағандарын сақтап, бағаны almat company price арқылы қояды.");

function setView(view) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === view));
  $("viewTitle").textContent = titles[view][0];
  $("viewSub").textContent = titles[view][1];
}

async function importFiles(event) {
  for (const file of event.target.files) {
    addMessage("ai", `${file.name} импортталып жатыр...`);
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
  const pending = addMessage("ai", "Жауап дайындалып жатыр...");
  try {
    const assistantMode = $("assistantMode")?.value || "auto";
    const result = await ai("chat", prompt, "Kazakh", assistantMode);
    pending.textContent = result.text;
    lastAssistantAnswer = result.text;
    maybeCreateTaskFromPrompt(prompt, result.text);
  } catch (error) {
    pending.textContent = `Қате: ${error.message}`;
  }
}

async function runQuickPrompt(prompt) {
  const input = $("chatPrompt");
  input.value = prompt;
  await chat({ preventDefault() {} });
}

function taskFromLastAssistantAnswer() {
  if (!lastAssistantAnswer.trim()) {
    addMessage("ai", "Алдымен ассистенттен жауап алыңыз, содан кейін соңғы жауаптан task жасауға болады.");
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
  addMessage("ai", "Соңғы жауап Tasks тақтасына қосылды.");
}

function maybeCreateTaskFromPrompt(prompt, answer) {
  const source = prompt.toLowerCase();
  if (!/(task|тапсырма|еске сал|todo|follow.?up)/i.test(source)) return;
  if (!/(жаса|қос|құр|create|add)/i.test(source)) return;
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
  $("translateOut").textContent = "Аударылып жатыр...";
  try {
    const result = await ai("translate", text, $("targetLang").value);
    $("translateOut").textContent = result.text;
  } catch (error) {
    $("translateOut").textContent = `Қате: ${error.message}`;
  }
}

async function quiz() {
  $("quizOut").textContent = "Quiz жасалып жатыр...";
  try {
    const result = await ai("quiz", $("quizPrompt").value || "Барлық білім базасынан quiz жаса.");
    $("quizOut").textContent = result.text;
  } catch (error) {
    $("quizOut").textContent = `Қате: ${error.message}`;
  }
}

async function crm() {
  $("crmOut").textContent = "CRM талдау жасалып жатыр...";
  try {
    const prompt = $("crmPrompt").value || "CRM дерегін толық талда: pipeline, табыс, клиент сегменттері, тәуекелдер, келесі әрекеттер.";
    const result = await ai("crm", prompt);
    $("crmOut").textContent = result.text;
  } catch (error) {
    $("crmOut").textContent = `Қате: ${error.message}`;
  }
}

async function matchPrices() {
  const baseFile = $("basePriceFile").files[0];
  const priceFile = $("almatPriceFile").files[0];
  const out = $("matchOut");
  if (!baseFile || !priceFile) {
    out.textContent = "Екі файлды да таңдаңыз: 1-құжат және almat company price.";
    return;
  }
  if (!window.XLSX) {
    out.textContent = "Excel кітапханасы жүктелмеді. Интернетті тексеріп, бетті қайта ашыңыз.";
    return;
  }

  out.textContent = "Файлдар оқылып жатыр...";
  try {
    const base = await readTableFile(baseFile);
    const price = await readTableFile(priceFile);
    const result = mergeByCode(base, price, {
      updateMode: $("priceUpdateMode")?.value || "fill-empty",
      duplicateMode: $("duplicateMode")?.value || "first"
    });
    downloadWorkbook(result, datedFilename("completed_price"));
    out.textContent = [
      "Дайын файл жүктелді.",
      `1-құжат жолдары: ${result.baseRows}`,
      `almat company price жолдары: ${result.priceRows}`,
      `Код бойынша табылғаны: ${result.matched}`,
      `Табылмаған кодтар: ${result.notFound.length}`,
      `Баға қойылған ұяшықтар: ${result.filled}`,
      `Change log жолдары: ${result.changeLog.length}`,
      `Қосылған баға бағаны: ${result.addedColumns}`,
      `Формуласы бар ұяшықтар өзгермеді: ${result.formulaProtected}`,
      `Қорғалған саны/қорап бағандары: ${result.protectedColumns.join(", ") || "табылмады"}`,
      `Код бағандары: 1-құжат = ${result.baseCodeHeader}, almat = ${result.priceCodeHeader}`
    ].join("\n");
  } catch (error) {
    out.textContent = `Қате: ${error.message}`;
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
    body: "CRM/құжат бойынша келесі әрекетті нақтылау.",
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
  if (!state.docs.length && !state.images.length) {
    out.textContent = "Алдымен PDF, Word, Excel немесе CSV құжаттарын жүктеңіз.";
    return;
  }
  const context = buildContext();
  const links = state.docs.map(doc => {
    const related = findRelatedDocs(doc).map(item => item.name).slice(0, 4).join(", ");
    return `- ${doc.name}: ${related || "байланыс табылмады"}`;
  }).join("\n");
  out.textContent = [
    analyzeCrm(context),
    "",
    "Second Brain байланыстары:",
    links,
    "",
    "Ұсыныс: клиент, тауар, код, статус, жауапты менеджер және келесі әрекет бағандары бар Excel/CSV жүктесеңіз, CRM талдау дәлірек болады."
  ].join("\n");
}

function exportBrain() {
  const payload = {
    exportedAt: new Date().toISOString(),
    docs: state.docs,
    tasks: state.tasks,
    images: state.images,
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
    const incomingImages = Array.isArray(data.images) ? data.images : [];
    const incomingNotes = Array.isArray(data.notes) ? data.notes : [];
    const existingDocKeys = new Set(state.docs.map(doc => doc.id || doc.name));
    const existingTaskKeys = new Set(state.tasks.map(task => task.id || task.title));
    const existingImageKeys = new Set(state.images.map(image => image.id || image.name));
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
    incomingImages.forEach(image => {
      const key = image.id || image.name;
      if (!existingImageKeys.has(key)) {
        state.images.unshift(normalizeImage(image));
        existingImageKeys.add(key);
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
    $("brainOut").textContent = `Импорт дайын: ${incomingDocs.length} құжат, ${incomingTasks.length} task, ${incomingNotes.length} note оқылды.`;
  } catch (error) {
    $("brainOut").textContent = `Import қатесі: ${error.message}`;
  } finally {
    event.target.value = "";
  }
}

async function importBrainImages(event) {
  const files = [...event.target.files].filter(file => file.type.startsWith("image/"));
  if (!files.length) return;
  const folder = $("brainImageFolder")?.value.trim() || "Images";
  const tags = splitList($("brainImageTags")?.value || "");
  $("brainOut").textContent = "Суреттер Brain ішіне сақталып жатыр...";
  try {
    for (const file of files) {
      state.images.unshift(await imageFileToBrainItem(file, folder, tags));
    }
    persist();
    render();
    $("brainOut").textContent = `${files.length} сурет Brain / ${folder} папкасына сақталды.`;
  } catch (error) {
    $("brainOut").textContent = `Сурет сақтау қатесі: ${shortError(error)}`;
  } finally {
    event.target.value = "";
  }
}

async function imageFileToBrainItem(file, folder, tags) {
  const src = await resizeImage(file, 1400, 0.82);
  return normalizeImage({
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "image",
    src,
    folder,
    tags: [...new Set([folder, "image", ...tags, ...keywords(file.name).slice(0, 4)])],
    createdAt: new Date().toISOString()
  });
}

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
  $("brainOut").textContent = `${doc.name} сақталды.`;
}

function saveCloudSettings() {
  cloudConfig.url = cleanSupabaseUrl($("cloudUrl").value);
  cloudConfig.key = $("cloudKey").value.trim();
  cloudConfig.workspace = $("cloudWorkspace").value.trim() || "default";
  if (!cloudConfig.url || !cloudConfig.key) {
    setCloudStatus("Cloud қосу үшін Supabase URL және anon key енгізіңіз. Workspace кодын өзіңіз қоя аласыз.", false);
    return;
  }
  localStorage.setItem("sanabase-cloud", JSON.stringify(cloudConfig));
  renderCloudSettings();
  setCloudStatus("Cloud қосылды. Енді Cloud-қа сақтау басыңыз немесе өзгерістер автоматты сақталады.", true);
}

function clearCloudSettings() {
  cloudConfig.url = "";
  cloudConfig.key = "";
  cloudConfig.workspace = "";
  localStorage.removeItem("sanabase-cloud");
  renderCloudSettings();
  setCloudStatus("Cloud өшірілді. Құжаттар local режимде қалды.", false);
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
    setCloudStatus("Алдымен Supabase URL және anon key енгізіп, Cloud қосу басыңыз.", false);
    return;
  }
  const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sanabase_cloud_${current.workspace}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setCloudStatus("Cloud баптауы жүктелді. Оны телефонда Cloud баптауын енгізу арқылы қосуға болады.", true);
}

async function importCloudConfig(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    cloudConfig.url = cleanSupabaseUrl(data.url || "");
    cloudConfig.key = String(data.key || "").trim();
    cloudConfig.workspace = String(data.workspace || "default").trim() || "default";
    if (!cloudConfig.url || !cloudConfig.key) throw new Error("config ішінде url немесе key жоқ");
    localStorage.setItem("sanabase-cloud", JSON.stringify(cloudConfig));
    renderCloudSettings();
    setCloudStatus("Cloud баптауы енгізілді. Енді Cloud-тан алу немесе Cloud-қа сақтау басыңыз.", true);
  } catch (error) {
    setCloudStatus(`Cloud баптауын оқу қатесі: ${shortError(error)}`, false);
  } finally {
    event.target.value = "";
  }
}

async function pushCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Cloud қосылмаған: осы браузерде Supabase URL/anon key/workspace сақталмаған. Cloud қосу немесе Cloud баптауын енгізу қолданыңыз.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Cloud-қа сақталып жатыр...", true);
    const payload = {
      id: cloudRowId(),
      workspace_id: cloudConfig.workspace,
      payload: {
        docs: state.docs,
        tasks: state.tasks,
        images: state.images,
        notes: state.notes,
        savedAt: new Date().toISOString(),
        version: 3
      },
      updated_at: new Date().toISOString()
    };
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?on_conflict=id`, {
      method: "POST",
      headers: cloudHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    setCloudStatus(`Cloud сақталды: ${new Date().toLocaleString()}`, true);
  } catch (error) {
    setCloudStatus(`Cloud сақтау қатесі: ${shortError(error)}`, false);
  }
}

async function pullCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Cloud қосылмаған: осы браузерде Supabase URL/anon key/workspace сақталмаған. Cloud қосу немесе Cloud баптауын енгізу қолданыңыз.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Cloud-тан оқылып жатыр...", true);
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?id=eq.${encodeURIComponent(cloudRowId())}&select=payload,updated_at`, {
      headers: cloudHeaders()
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (!rows.length) {
      setCloudStatus("Cloud-та бұл workspace үшін база әлі жоқ. Алдымен Cloud-қа сақтау басыңыз.", false);
      return;
    }
    const payload = rows[0].payload || {};
    state.docs = Array.isArray(payload.docs) ? payload.docs.map(normalizeDoc) : [];
    state.tasks = Array.isArray(payload.tasks) ? payload.tasks.map(normalizeTask) : [];
    state.images = Array.isArray(payload.images) ? payload.images.map(normalizeImage) : [];
    state.notes = Array.isArray(payload.notes) ? payload.notes.map(normalizeNote) : [];
    persist({ sync: false });
    render();
    setCloudStatus(`Cloud-тан алынды: ${rows[0].updated_at || "ready"}`, true);
  } catch (error) {
    setCloudStatus(`Cloud оқу қатесі: ${shortError(error)}`, false);
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
  setCloudStatus(cloudReady() ? `Cloud автоматты дайын: ${cloudConfig.workspace}. Өзгерістер сақталады.` : "Cloud уақытша дайын емес. Бетті жаңартып көріңіз немесе Cloud-тан алу басыңыз.", cloudReady());
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
    if (!window.XLSX) return unsupported(file, "Excel оқу кітапханасы жүктелмеді.");
    const table = await readTableFile(file);
    return { name: file.name, type: file.type || ext, text: table.rows.map(row => row.join("\t")).join("\n") };
  }
  if (ext === "docx") {
    if (!window.mammoth) return unsupported(file, "Word оқу кітапханасы жүктелмеді.");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { name: file.name, type: file.type || ext, text: result.value };
  }
  if (ext === "pdf") {
    return readPdf(file);
  }
  return unsupported(file, "Бұл файл түрін браузерде оқу әзірге мүмкін емес.");
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
  if (!sentences.length) return "Бұл сұраққа нақты сәйкес жол табылмады. Базаңыздан ең маңызды үзінді:\n\n" + context.slice(0, 1200) + nextStepBlock();
  if (assistantMode === "brief") return sentences.slice(0, 3).join("\n\n");
  return "База бойынша қысқа жауап:\n\n" + sentences.join("\n\n") + nextStepBlock();
}

function assistantInstruction(mode) {
  const base = "Жауапты қазақша бер. Құжат, CRM, tasks және notes контекстіне сүйен. Нақты дерек жоқ болса, соны айт.";
  const modes = {
    brief: "Өте қысқа жауап бер: максимум 5 bullet.",
    action: "Жауапты міндетті түрде: Қорытынды, Нақты әрекеттер, Тәуекел, Келесі қадам форматында бер.",
    crm: "CRM аналитик сияқты жауап бер: клиент, табыс, pipeline, тәуекел, follow-up.",
    tasks: "Құжаттан орындалатын тапсырмаларды шығар: title, priority, deadline бар болса көрсет."
  };
  return `${base} ${modes[mode] || "Пайдаланушыға ең пайдалы форматты таңда."}`;
}

function emptyAssistantAnswer(mode) {
  const base = "Әзірге база бос. PDF/Word/Excel/CSV жүктесеңіз, мен соның ішінен жауап беремін.";
  if (mode === "tasks") return `${base}\n\nҚосуға болатын нәрсе: құжаттан автоматты task шығару, deadline табу, жауапты адамды белгілеу.`;
  if (mode === "crm") return `${base}\n\nCRM үшін Excel/CSV жүктеңіз: мен клиенттерді, сатылым сомасын, тәуекелді және follow-up task-тарды шығарамын.`;
  return `${base}\n\nМен қазір мынаны істей аламын: құжат оқу, прайс салыстыру, CRM талдау, task жасау, quiz/translation, Second Brain іздеу.`;
}

function actionPlanAnswer(prompt, facts) {
  return [
    "Қорытынды:",
    facts.slice(0, 2).join("\n\n"),
    "",
    "Нақты әрекеттер:",
    "1. Ең маңызды жолдарды тексеріңіз.",
    "2. Қажет болса Tasks батырмасымен follow-up жасаңыз.",
    "3. Егер бұл прайс болса, Price Match арқылы код бойынша толықтырыңыз.",
    "",
    "Тәуекел:",
    "Дерек толық болмаса немесе код/баға бағандары әртүрлі аталса, нәтижені қолмен тексеру керек.",
    "",
    "Келесі қадам:",
    "Маған нақты құжат атауын, клиентті немесе тауар кодын жазсаңыз, жауапты тарылтамын."
  ].join("\n");
}

function taskPlanFromContext(prompt, context, matches) {
  const lines = (matches.length ? matches : context.split(/\n+/))
    .map(line => line.trim())
    .filter(line => line.length > 20)
    .slice(0, 8);
  return [
    "Құжаттардан шығатын тапсырмалар:",
    ...lines.slice(0, 5).map((line, index) => `${index + 1}. ${line.slice(0, 140)}\n   Priority: ${/(urgent|қате|ошибка|долг|төлем|risk|тәуекел)/i.test(line) ? "High" : "Medium"}\n   Status: Істеу`),
    "",
    "Кеңес: осы жауапты бірден Tasks тақтасына қосу үшін `Соңғы жауаптан task` батырмасын басыңыз."
  ].join("\n");
}

function nextStepBlock() {
  return "\n\nКелесі қадам:\n- Нақты task керек болса, `Соңғы жауаптан task` басыңыз.\n- CRM керек болса, режимді `CRM талдау` қылыңыз.\n- Қысқа жауап керек болса, `Қысқа жауап` режимін таңдаңыз.";
}

function firstMeaningfulLine(value) {
  return String(value || "")
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.\s]+/, "").trim())
    .find(line => line.length > 3) || "";
}

function inferPriority(value) {
  return /(urgent|срочно|шұғыл|қате|ошибка|risk|тәуекел|төлем|долг|debt)/i.test(value) ? "high" : "medium";
}

function makeQuiz(context) {
  const pool = context.split(/\n+/).map(line => line.trim()).filter(line => line.length > 40).slice(0, 8);
  const selected = pool.length ? pool : [context.slice(0, 400)];
  return selected.slice(0, 5).map((line, index) => {
    const short = line.slice(0, 120);
    return `${index + 1}. Мына ойдың негізгі мағынасы қандай?\n   "${short}..."\n   A) Негізгі дерек\n   B) Қатысы жоқ ақпарат\n   C) Қате тұжырым\n   Жауап: A`;
  }).join("\n\n");
}

function analyzeCrm(context) {
  const rows = context.split(/\n/).filter(Boolean);
  const header = rows.find(row => row.includes("\t") || row.includes(",")) || "";
  const money = rows.join("\n").match(/\b\d{3,}(?:[.,]\d+)?\b/g) || [];
  return [
    "CRM қысқаша аудит:",
    `- Жол саны: шамамен ${rows.length}`,
    `- Бағандар: ${header.slice(0, 220) || "анықталмады"}`,
    `- Сандық мәндер: ${money.length ? money.slice(0, 12).join(", ") : "табылмады"}`,
    "",
    "Егер екі прайсты код бойынша толықтыру керек болса, Price Match бөлімін қолданыңыз."
  ].join("\n");
}

function simpleTranslate(text, language) {
  const labels = {
    Kazakh: "Қазақша мағынасы",
    English: "English meaning",
    Russian: "Русский смысл",
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
    ["price", /price|баға|прайс|цена|тауар|товар|код/],
    ["crm", /crm|клиент|лид|сатылым|продаж|manager|менеджер/],
    ["contract", /contract|договор|келісім|шарт/],
    ["finance", /invoice|счет|төлем|оплата|payment|amount|сумма/],
    ["warehouse", /склад|қойма|остаток|stock|quantity|саны|қорап|коробка/]
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

function normalizeImage(image) {
  const folder = image.folder || "Images";
  return {
    id: image.id || crypto.randomUUID(),
    name: image.name || "Image",
    type: image.type || "image",
    src: image.src || "",
    folder,
    text: image.text || `Image: ${image.name || "Image"} (${folder})`,
    warning: image.warning || "",
    tags: Array.isArray(image.tags) && image.tags.length ? image.tags : [folder, "image"],
    links: Array.isArray(image.links) ? image.links : [],
    createdAt: image.createdAt || new Date().toISOString()
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
    short: "Қысқа",
    long: "Ұзақ",
    idea: "Идея",
    meeting: "Кездесу"
  }[type] || "Қысқа";
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
  const images = state.images
    .slice(0, 30)
    .map(image => `Image: ${image.name}\nFolder: ${image.folder || "Images"}\nTags: ${(image.tags || []).join(", ")}`);
  return docs.concat(images, tasks, notes).join("\n\n---\n\n");
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
  if (!Array.isArray(state.images)) state.images = [];
  if ($("docCount")) $("docCount").textContent = `${state.docs.length} docs`;
  state.notes = state.notes.map(normalizeNote);
  if ($("imageCount")) $("imageCount").textContent = `${state.images.length} images`;
  if ($("noteCount")) $("noteCount").textContent = `${state.notes.length} notes`;
  if ($("taskCount")) $("taskCount").textContent = `${state.tasks.length} tasks`;
  state.docs = state.docs.map(normalizeDoc);
  state.images = state.images.map(normalizeImage);
  state.tasks = state.tasks.map(normalizeTask);
  const query = $("searchDocs")?.value?.toLowerCase() || "";
  if (!$("docsGrid")) return;
  $("docsGrid").innerHTML = "";
  state.docs
    .filter(doc => `${doc.name} ${doc.text}`.toLowerCase().includes(query))
    .forEach(doc => {
      const card = document.createElement("article");
      card.className = "doc";
      card.innerHTML = `
        <div class="doc-head">
          <div>
            <h3>${escapeHtml(doc.name)}</h3>
            <span>${formatDate(doc.createdAt)} · ${(doc.tags || []).slice(0, 3).map(escapeHtml).join(", ") || "tag жоқ"}</span>
          </div>
          <button type="button" data-doc-delete="${escapeHtml(doc.id)}">Өшіру</button>
        </div>
        <p>${escapeHtml(doc.warning || doc.text || "Selectable text табылмады.")}</p>
      `;
      $("docsGrid").appendChild(card);
    });
  $("docsGrid").querySelectorAll("[data-doc-delete]").forEach(button => {
    button.addEventListener("click", () => deleteDoc(button.dataset.docDelete));
  });
  renderNotes();
  renderTasks();
  renderBrain();
  renderCloudSettings();
}

function deleteDoc(id) {
  const doc = state.docs.find(item => item.id === id);
  if (!doc) return;
  if (!confirm(`${doc.name} құжатын өшіреміз бе?`)) return;
  state.docs = state.docs.filter(item => item.id !== id);
  state.docs.forEach(item => {
    item.links = (item.links || []).filter(link => link !== id && link !== doc.name);
  });
  persist();
  render();
}

function formatDate(value) {
  if (!value) return "күні жоқ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "күні жоқ";
  return date.toLocaleDateString("kk-KZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderNotes() {
  const list = $("notesList");
  if (!list) return;
  const folderFilter = $("noteFolderFilter");
  const folders = noteFolders();
  const current = folderFilter?.value || "all";
  if (folderFilter) {
    folderFilter.innerHTML = `<option value="all">Барлық папка</option>` + folders.map(folder => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`).join("");
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
    list.innerHTML = `<article class="note empty-note"><h3>Жазба жоқ</h3><p>Папка таңдап, қысқа немесе ұзақ ақпарат сақтаңыз.</p></article>`;
    return;
  }
  filtered.forEach(note => {
    const card = document.createElement("article");
    card.className = `note note-${escapeHtml(note.type)}`;
    card.innerHTML = `
      <div class="note-head">
        <div>
          <h3>${escapeHtml(note.title)}</h3>
          <span>${escapeHtml(note.folder || "General")} · ${escapeHtml(noteTypeLabel(note.type))}</span>
        </div>
        <div class="note-actions">
          <button type="button" data-note-brain="${escapeHtml(note.id)}">${note.brain ? "Brain-да" : "Brain-ға"}</button>
          <button type="button" data-note-delete="${escapeHtml(note.id)}">Өшіру</button>
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
  row.innerHTML = [`<button type="button" data-note-folder="all" class="${activeFolder === "all" ? "active" : ""}">Барлығы <span>${allCount}</span></button>`]
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
    ["todo", "Істеу"],
    ["doing", "Жүріп жатыр"],
    ["done", "Дайын"]
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
        ${items.map(task => taskCard(task)).join("") || `<article class="task-card empty-task">Тапсырма жоқ</article>`}
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
    ["todo", "Істеу"],
    ["doing", "Жүру"],
    ["done", "Дайын"]
  ].filter(([status]) => status !== task.status);
  return `
    <article class="task-card priority-${escapeHtml(task.priority)}">
      <div class="task-top">
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(priorityLabel(task.priority))}</span>
      </div>
      <p>${escapeHtml(task.body || "Сипаттама жоқ")}</p>
      <div class="task-meta">
        ${task.due ? `<span>Deadline: ${escapeHtml(task.due)}</span>` : ""}
        ${task.owner ? `<span>Жауапты: ${escapeHtml(task.owner)}</span>` : ""}
        ${task.link ? `<span>Байланыс: ${escapeHtml(task.link)}</span>` : ""}
      </div>
      <div class="task-actions">
        ${moves.map(([status, label]) => `<button type="button" data-task-move="${escapeHtml(task.id)}" data-status="${status}">${label}</button>`).join("")}
        <button type="button" data-task-delete="${escapeHtml(task.id)}">Өшіру</button>
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
    .concat(state.images.map(image => ({ ...image, brainKind: "image" })))
    .concat(state.notes.filter(note => note.brain).map(noteToBrainItem))
    .filter(doc => `${doc.name} ${(doc.tags || []).join(" ")} ${(doc.links || []).join(" ")} ${doc.text} ${doc.folder || ""}`.toLowerCase().includes(query));
  list.innerHTML = "";
  if (!docs.length) {
    list.innerHTML = `<article class="brain-card"><h3>Brain бос</h3><p>Upload арқылы құжат/сурет жүктеңіз немесе Notes ішінде маңызды жазбаны Brain-ға бекітіңіз.</p></article>`;
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
          ${doc.brainKind === "image" && doc.src ? `<img class="brain-image" src="${escapeHtml(doc.src)}" alt="${escapeHtml(doc.name)}">` : ""}
          <p>${escapeHtml(doc.warning || doc.text || "Мәтін табылмады.")}</p>
        </div>
        <span class="brain-type">${escapeHtml(doc.brainKind === "note" ? `note / ${doc.folder || "General"}` : doc.brainKind === "image" ? `image / ${doc.folder || "Images"}` : doc.type || "file")}</span>
      </div>
      <div class="tag-row">${(doc.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || `<span class="tag muted-tag">no tags</span>`}</div>
      ${doc.brainKind === "note" ? `<div class="related"><strong>Notes папкасы:</strong><span>${escapeHtml(doc.folder || "General")}</span></div>` : ""}
      ${doc.brainKind === "image" ? `<div class="related"><strong>Сурет папкасы:</strong><span>${escapeHtml(doc.folder || "Images")}</span></div>` : ""}
      ${doc.brainKind === "doc" ? `<div class="brain-fields">
        <label>
          <span>Тегтер</span>
          <input data-tags-for="${escapeHtml(doc.id)}" value="${escapeHtml((doc.tags || []).join(", "))}" placeholder="price, crm, клиент">
        </label>
        <label>
          <span>Байланысқан құжаттар</span>
          <input data-links-for="${escapeHtml(doc.id)}" value="${escapeHtml((doc.links || []).join(", "))}" placeholder="құжат аты немесе ID">
        </label>
      </div>` : ""}
      <div class="related">
        <strong>Авто байланыс:</strong>
        ${related.length ? related.map(item => `<span>${escapeHtml(item.name)}</span>`).join("") : "<span>табылмады</span>"}
      </div>
      ${doc.brainKind === "doc" ? `<button type="button" data-save-brain="${escapeHtml(doc.id)}">Сақтау</button>` : ""}
      ${doc.brainKind === "note" ? `<button type="button" data-note-unbrain="${escapeHtml(doc.noteId)}">Brain-нан алу</button>` : ""}
      ${doc.brainKind === "image" ? `<button type="button" data-image-delete="${escapeHtml(doc.id)}">Суретті өшіру</button>` : ""}
    `;
    list.appendChild(card);
  });
  list.querySelectorAll("[data-save-brain]").forEach(button => {
    button.addEventListener("click", () => saveBrainMeta(button.dataset.saveBrain));
  });
  list.querySelectorAll("[data-note-unbrain]").forEach(button => {
    button.addEventListener("click", () => toggleNoteBrain(button.dataset.noteUnbrain));
  });
  list.querySelectorAll("[data-image-delete]").forEach(button => {
    button.addEventListener("click", () => deleteBrainImage(button.dataset.imageDelete));
  });
}

function deleteBrainImage(id) {
  const image = state.images.find(item => item.id === id);
  if (!image) return;
  if (!confirm(`${image.name} суретін өшіреміз бе?`)) return;
  state.images = state.images.filter(item => item.id !== id);
  persist();
  render();
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
      images: Array.isArray(saved.images) ? saved.images.map(normalizeImage) : [],
      notes: Array.isArray(saved.notes) ? saved.notes.map(normalizeNote) : []
    };
  } catch {
    return { docs: [], tasks: [], images: [], notes: [] };
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

