const state = loadState();
const titles = {
  chat: ["AI Chat", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Knowledge Base", "PDF, Word, Excel және мәтін материалдары."],
  match: ["Price Match", "Екі Excel-ді код бойынша салыстырып, бірінші құжаттың санын өзгертпей толықтырады."],
  translate: ["Translation", "Мәтінді қалаған тілге аударыңыз."],
  quiz: ["Quiz Generator", "Базаңыздан тест және жауап кілтін жасаңыз."],
  crm: ["CRM Analysis", "Excel/CSV CRM базасын талдаңыз."],
  notes: ["Notes", "Ойлар мен конспектілерді сақтаңыз."]
};

const $ = (id) => document.getElementById(id);

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

$("fileInput").addEventListener("change", importFiles);
$("chatForm").addEventListener("submit", chat);
$("translateBtn").addEventListener("click", translate);
$("quizBtn").addEventListener("click", quiz);
$("crmBtn").addEventListener("click", crm);
$("matchBtn").addEventListener("click", matchPrices);
$("noteForm").addEventListener("submit", saveNote);
$("searchDocs").addEventListener("input", render);
$("clearDocs").addEventListener("click", () => {
  state.docs = [];
  persist();
  render();
});

render();
addMessage("ai", "Сәлем! PDF, Word, Excel немесе CSV жүктеңіз. Нақты прайс салыстыру үшін Price Match бөліміне өтіп, 1-құжат пен almat company price файлын салыңыз.");

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
    const result = await ai("chat", prompt);
    pending.textContent = result.text;
  } catch (error) {
    pending.textContent = `Қате: ${error.message}`;
  }
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
    const result = mergeByCode(base, price, "", "");
    downloadWorkbook(result.rows, "sanabase_completed_price.xlsx");
    out.textContent = [
      "Дайын файл жүктелді: sanabase_completed_price.xlsx",
      `1-құжат жолдары: ${result.baseRows}`,
      `almat company price жолдары: ${result.priceRows}`,
      `Код бойынша табылғаны: ${result.matched}`,
      `Толықтырылған ұяшықтар: ${result.filled}`,
      `Қосылған жаңа бағандар: ${result.addedColumns}`,
      `Қорғалған сан бағандары: ${result.protectedColumns.join(", ") || "табылмады"}`,
      `Код бағандары: 1-құжат = ${result.baseCodeHeader}, almat = ${result.priceCodeHeader}`
    ].join("\n");
  } catch (error) {
    out.textContent = `Қате: ${error.message}`;
  }
}

function mergeByCode(base, price, codeHint, qtyHint) {
  const baseHeader = normalizeHeader(base.rows[0]);
  const priceHeader = normalizeHeader(price.rows[0]);
  const baseCodeIndex = resolveCodeColumn(base.rows, baseHeader, codeHint);
  const priceCodeIndex = resolveCodeColumn(price.rows, priceHeader, codeHint);

  const qtyIndexes = findQuantityColumns(baseHeader, qtyHint);
  const outputHeader = [...baseHeader];
  const headerMap = new Map(baseHeader.map((header, index) => [headerKey(header), index]));
  const priceToOutput = priceHeader.map(header => {
    const key = headerKey(header);
    if (headerMap.has(key)) return headerMap.get(key);
    outputHeader.push(header);
    const newIndex = outputHeader.length - 1;
    headerMap.set(key, newIndex);
    return newIndex;
  });

  const priceMap = new Map();
  price.rows.slice(1).forEach(row => {
    const code = normalizeCode(row[priceCodeIndex]);
    if (code && !priceMap.has(code)) priceMap.set(code, row);
  });

  let matched = 0;
  let filled = 0;
  const outputRows = [outputHeader];
  base.rows.slice(1).forEach(baseRow => {
    const code = normalizeCode(baseRow[baseCodeIndex]);
    const outRow = new Array(outputHeader.length).fill("");
    baseHeader.forEach((_, index) => {
      outRow[index] = cellValue(baseRow[index]);
    });

    const priceRow = priceMap.get(code);
    if (priceRow) {
      matched += 1;
      priceHeader.forEach((_, priceIndex) => {
        const outputIndex = priceToOutput[priceIndex];
        if (qtyIndexes.includes(outputIndex)) return;
        const next = cellValue(priceRow[priceIndex]);
        if (!next) return;
        if (!outRow[outputIndex]) {
          outRow[outputIndex] = next;
          filled += 1;
        }
      });
    }
    outputRows.push(outRow);
  });

  return {
    rows: outputRows,
    baseRows: Math.max(base.rows.length - 1, 0),
    priceRows: Math.max(price.rows.length - 1, 0),
    matched,
    filled,
    addedColumns: outputHeader.length - baseHeader.length,
    protectedColumns: qtyIndexes.map(index => outputHeader[index]),
    baseCodeHeader: baseHeader[baseCodeIndex],
    priceCodeHeader: priceHeader[priceCodeIndex]
  };
}

async function readTableFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (["xlsx", "xls"].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return { name: file.name, rows: trimRows(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })) };
  }
  if (["csv", "tsv"].includes(ext)) {
    const delimiter = ext === "tsv" ? "\t" : ",";
    const rows = (await file.text()).split(/\r?\n/).map(line => line.split(delimiter));
    return { name: file.name, rows: trimRows(rows) };
  }
  throw new Error("Тек Excel, CSV немесе TSV файл салыңыз.");
}

function downloadWorkbook(rows, filename) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Completed");
  XLSX.writeFile(workbook, filename);
}

function normalizeHeader(row) {
  return row.map((value, index) => String(value || `Column ${index + 1}`).trim());
}

function trimRows(rows) {
  return rows
    .filter(row => row.some(cell => String(cell ?? "").trim()))
    .map(row => row.map(cellValue));
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

function resolveCodeColumn(rows, header, hint) {
  const direct = findColumn(header, hint, codeKeywords());
  if (direct >= 0) return direct;

  const sample = rows.slice(1, 80);
  const scores = header.map((_, index) => {
    const values = sample.map(row => normalizeCode(row[index])).filter(Boolean);
    const unique = new Set(values).size;
    const codeLike = values.filter(value => /[A-ZА-Я0-9]/i.test(value) && value.length >= 2 && value.length <= 40).length;
    const numericOnly = values.filter(value => /^\d+$/.test(value)).length;
    return { index, score: unique * 3 + codeLike * 2 + numericOnly };
  });
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.index ?? 0;
}

function findQuantityColumns(header, hint) {
  const hinted = findColumn(header, hint, quantityKeywords());
  const found = header
    .map((name, index) => ({ name: normalizeText(name), index }))
    .filter(item => quantityKeywords().some(keyword => item.name === keyword || item.name.includes(keyword)))
    .map(item => item.index);
  if (hinted >= 0 && !found.includes(hinted)) found.push(hinted);
  return found;
}

function codeKeywords() {
  return ["код", "code", "sku", "артикул", "article", "item", "id", "barcode", "штрих", "номенклатура"];
}

function quantityKeywords() {
  return ["саны", "сан", "количество", "кол-во", "qty", "quantity", "остаток", "stock", "count", "көлем"];
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

function saveNote(event) {
  event.preventDefault();
  const title = $("noteTitle").value.trim() || "Untitled note";
  const body = $("noteBody").value.trim();
  if (!body) return;
  state.notes.unshift({ id: crypto.randomUUID(), title, body, createdAt: new Date().toISOString() });
  $("noteTitle").value = "";
  $("noteBody").value = "";
  persist();
  render();
}

async function ai(mode, prompt, language = "Kazakh") {
  try {
    return await api("api/ai", {
      mode,
      prompt,
      language,
      context: buildContext(),
      notes: state.notes.map(n => `${n.title}\n${n.body}`).join("\n\n")
    });
  } catch {
    return { text: localAnswer(mode, prompt, language) };
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

function localAnswer(mode, prompt, language) {
  const context = buildContext();
  if (!context.trim()) {
    return "Алдымен PDF, Word, Excel немесе CSV файл жүктеңіз. Прайс салыстыру үшін Price Match бөлімін қолданыңыз.";
  }
  if (mode === "quiz") return makeQuiz(context);
  if (mode === "crm") return analyzeCrm(context);
  if (mode === "translate") return simpleTranslate(prompt, language);
  return answerFromContext(prompt, context);
}

function answerFromContext(prompt, context) {
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

  if (!sentences.length) {
    return "Бұл сұраққа нақты сәйкес жол табылмады. Базаңыздан ең маңызды үзінді:\n\n" + context.slice(0, 1200);
  }
  return "База бойынша қысқа жауап:\n\n" + sentences.join("\n\n");
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
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 20);
}

function buildContext() {
  return state.docs
    .filter(doc => doc.text)
    .slice(0, 8)
    .map(doc => `Document: ${doc.name}\n${doc.text.slice(0, 12000)}`)
    .join("\n\n---\n\n");
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
  $("docCount").textContent = `${state.docs.length} docs`;
  $("noteCount").textContent = `${state.notes.length} notes`;

  const query = $("searchDocs").value?.toLowerCase() || "";
  $("docsGrid").innerHTML = "";
  state.docs
    .filter(doc => `${doc.name} ${doc.text}`.toLowerCase().includes(query))
    .forEach(doc => {
      const card = document.createElement("article");
      card.className = "doc";
      card.innerHTML = `<h3>${escapeHtml(doc.name)}</h3><p>${escapeHtml(doc.warning || doc.text || "Selectable text табылмады.")}</p>`;
      $("docsGrid").appendChild(card);
    });

  $("notesList").innerHTML = "";
  state.notes.forEach(note => {
    const card = document.createElement("article");
    card.className = "note";
    card.innerHTML = `<h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p>`;
    $("notesList").appendChild(card);
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
    return JSON.parse(localStorage.getItem("sanabase-state")) || { docs: [], notes: [] };
  } catch {
    return { docs: [], notes: [] };
  }
}

function persist() {
  localStorage.setItem("sanabase-state", JSON.stringify(state));
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
