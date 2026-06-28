const state = loadState();
const titles = {
  chat: ["AI Chat", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Knowledge Base", "PDF, Word және мәтін материалдары."],
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
addMessage("ai", "Сәлем! PDF немесе Word жүктеңіз, содан кейін білім базаңызбен сөйлесе аласыз.");

function setView(view) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === view));
  $("viewTitle").textContent = titles[view][0];
  $("viewSub").textContent = titles[view][1];
}

async function importFiles(event) {
  for (const file of event.target.files) {
    addMessage("ai", `${file.name} импортталып жатыр...`);
    const data = await fileToBase64(file);
    const result = await api("/api/import", { name: file.name, type: file.type, data });
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
    const result = await ai("quiz", $("quizPrompt").value || "Create a quiz from the full knowledge base.");
    $("quizOut").textContent = result.text;
  } catch (error) {
    $("quizOut").textContent = `Қате: ${error.message}`;
  }
}

async function crm() {
  $("crmOut").textContent = "CRM талдау жасалып жатыр...";
  try {
    const prompt = $("crmPrompt").value || "Analyze the CRM data. Show pipeline health, revenue signals, customer segments, risks, and recommended next actions.";
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
  return api("/api/ai", {
    mode,
    prompt,
    language,
    context: buildContext(),
    notes: state.notes.map(n => `${n.title}\n${n.body}`).join("\n\n")
  });
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
      card.innerHTML = `<h3>${escapeHtml(doc.name)}</h3><p>${escapeHtml(doc.warning || doc.text || "No selectable text found.")}</p>`;
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
