const state = loadState();
const titles = {
  chat: ["AI Chat", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Knowledge Base", "PDF, Word, Excel және мәтін материалдары."],
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
$("noteForm").addEventListener("submit", saveNote);
$("searchDocs").addEventListener("input", render);
$("clearDocs").addEventListener("click", () => {
  state.docs = [];
  persist();
  render();
});

render();
addMessage("ai", "Сәлем! PDF, Word, Excel немесе CSV жүктеңіз. Сервер жоқ кезде де сайт файлды браузерде оқып, база бойынша қысқа жауап, quiz, аударма және CRM талдау жасайды.");

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
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheets = workbook.SheetNames.map(name => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
      return `Sheet: ${name}\n` + rows.map(row => row.join("\t")).join("\n");
    });
    return { name: file.name, type: file.type || ext, text: sheets.join("\n\n---\n\n") };
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
    return "Алдымен PDF, Word, Excel немесе CSV файл жүктеңіз. Содан кейін мен сол база бойынша жауап беремін.";
  }
  if (mode === "quiz") return makeQuiz(context, prompt);
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
  return "База бойынша қысқа жауап:\n\n" + sentences.join("\n\n") + "\n\nНақтырақ сұрасаңыз, осы үзінділерге сүйеніп тереңдетіп беремін.";
}

function makeQuiz(context, prompt) {
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
  const statuses = countMatches(rows.join(" ").toLowerCase(), ["new", "lead", "won", "lost", "open", "closed", "paid", "pending", "жаңа", "жеңді", "жабық", "төленді"]);
  return [
    "CRM қысқаша аудит:",
    `- Жол саны: шамамен ${rows.length}`,
    `- Бағандар: ${header.slice(0, 220) || "анықталмады"}`,
    `- Сандық мәндер: ${money.length ? money.slice(0, 12).join(", ") : "табылмады"}`,
    `- Статус сигналдары: ${Object.entries(statuses).map(([k, v]) => `${k}: ${v}`).join(", ") || "аз"}`,
    "",
    "Ұсыныс:",
    "1. Лид статустарын бір форматқа келтіріңіз.",
    "2. Табысы жоғары клиенттерді бөлек сегментке шығарыңыз.",
    "3. Жабылмай тұрған сделкаларға жауапты менеджер мен соңғы байланыс күнін тексеріңіз.",
    "4. Келесі қадам ретінде Excel-де status, amount, manager, date бағандарын нақтылап қайта жүктеңіз."
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
  return `${labels[language] || "Translation"}:\n\n${text}\n\nЕскерту: бұл карта жоқ статикалық нұсқаның жеңіл аударма режимі. Толық сапалы AI аударма үшін кейін серверлік deploy және API лимиті керек.`;
}

function countMatches(text, words) {
  return words.reduce((acc, word) => {
    const count = (text.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, "g")) || []).length;
    if (count) acc[word] = count;
    return acc;
  }, {});
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
