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
  chat: ["AI чат", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Білім базасы", "PDF, Word, Excel және мәтін материалдары."],
  match: ["Прайс салыстыру", "Формуласы бар қорап/саны бағандарын өзгертпей, бағасын almat company price арқылы қояды."],
  onec: ["1С Excel байланыс", "1С-тен шыққан Excel/CSV арқылы товар, остаток, баға, клиент, қарыз және құжаттарды талдау."],
  calendaros: ["Жадыра күнтізбе жүйесі", "Клиент, заказ, поставщик, төлем, құжат, ESF, есеп және тарих бір календарь ішінде."],
  brain: ["Екінші ми", "Құжаттарды сақтап, тегпен байланыстырып, сол базадан CRM жасау."],
  translate: ["Аударма", "Мәтінді қалаған тілге аударыңыз."],
  quiz: ["Тест жасау", "Базаңыздан тест және жауап кілтін жасаңыз."],
  crm: ["CRM талдау", "Excel/CSV CRM базасын талдаңыз."],
  tasks: ["Тапсырмалар", "Trello сияқты тапсырмалар тақтасы."],
  goals: ["Мақсаттар орталығы / Focus Center", "Мақсат, проект, жоспар, тапсырма және әдет бір жерде байланысып тұрады."],
  notes: ["Жазбалар", "Ойлар мен конспектілерді сақтаңыз."]
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
on("notifyEnableBtn", "click", enableNotifications);
on("chatForm", "submit", chat);
on("assistantTaskBtn", "click", taskFromLastAssistantAnswer);
on("assistantPlanBtn", "click", planFromLastAssistantAnswer);
on("assistantCrmDocBtn", "click", crmDocFromLastAssistantAnswer);
on("translateBtn", "click", translate);
on("quizBtn", "click", quiz);
on("crmBtn", "click", crm);
on("crmDocBtn", "click", createCrmDocument);
on("crmDownloadBtn", "click", downloadCrmDocument);
on("crmQuickForm", "submit", saveCrmQuickDeal);
on("crmSearch", "input", render);
on("crmStatusFilter", "change", render);
on("matchBtn", "click", matchPrices);
on("onecImportBtn", "click", importOneCExcel);
on("onecSaveBrainBtn", "click", saveOneCToBrain);
on("onecCrmDocBtn", "click", oneCToCrmDocument);
on("taskForm", "submit", saveTask);
on("taskSearch", "input", render);
on("taskQuickCrmBtn", "click", taskFromCrm);
on("goalForm", "submit", saveGoal);
on("projectForm", "submit", saveProject);
on("planForm", "submit", savePlan);
on("challengeForm", "submit", saveChallenge);
on("goalSearch", "input", render);
on("goalFilter", "change", render);
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
on("calForm", "submit", saveCalendarRecord);
on("calSearch", "input", render);
on("calFilter", "change", render);
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
document.querySelectorAll("[data-cal-quick]").forEach(button => {
  button.addEventListener("click", () => calendarQuick(button.dataset.calQuick));
});
document.querySelectorAll("[data-cal-view]").forEach(button => {
  button.addEventListener("click", () => setCalendarView(button.dataset.calView));
});
document.querySelectorAll("[data-cal-export]").forEach(button => {
  button.addEventListener("click", () => exportCalendarData(button.dataset.calExport));
});
document.querySelectorAll("[data-crm-template]").forEach(button => {
  button.addEventListener("click", () => useCrmTemplate(button.dataset.crmTemplate));
});

render();
renderCloudSettings();
startReminderEngine();
addMessage("ai", "Сәлем! Прайс салыстыру бөлімі 1-құжаттың формуласы бар қорап/саны бағандарын сақтап, бағаны almat company price арқылы қояды.");

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
  const title = firstMeaningfulLine(lastAssistantAnswer) || "AI келесі әрекеті";
  state.tasks.unshift(normalizeTask({
    id: crypto.randomUUID(),
    title: title.slice(0, 90),
    body: lastAssistantAnswer.slice(0, 1400),
    status: "todo",
    priority: inferPriority(lastAssistantAnswer),
    link: "AI чат",
    createdAt: new Date().toISOString()
  }));
  persist();
  render();
  addMessage("ai", "Соңғы жауап Тапсырмалар тақтасына қосылды.");
}

function planFromLastAssistantAnswer() {
  if (!lastAssistantAnswer.trim()) {
    addMessage("ai", "Алдымен ассистенттен жауап алыңыз, содан кейін оны жоспарға айналдырамын.");
    return;
  }
  state.plans.unshift(normalizePlan({
    title: firstMeaningfulLine(lastAssistantAnswer).slice(0, 90) || `AI жоспар ${isoDate()}`,
    type: "daily",
    category: "Бизнес",
    date: isoDate(),
    focus: lastAssistantAnswer.slice(0, 500),
    tasks: extractActionLines(lastAssistantAnswer).map(title => ({ id: crypto.randomUUID(), title, done: false })),
    status: "today"
  }));
  persist();
  render();
  addMessage("ai", "Соңғы жауап Фокус орталығы / Жоспарлар ішіне қосылды.");
}

function crmDocFromLastAssistantAnswer() {
  if (!lastAssistantAnswer.trim()) {
    addMessage("ai", "Алдымен CRM немесе бизнес бойынша жауап алыңыз, содан кейін CRM құжат жасаймын.");
    return;
  }
  const name = `AI CRM құжат ${isoDate()}`;
  const documentText = crmDocumentEnvelope(name, lastAssistantAnswer);
  state.docs.unshift(normalizeDoc({
    name: `${name}.txt`,
    type: "crm_report",
    text: documentText,
    tags: ["crm", "ai", "есеп"],
    links: ["AI чат", "CRM"]
  }));
  state.notes.unshift(normalizeNote({
    title: name,
    folder: "CRM",
    type: "long",
    body: documentText,
    tags: ["crm", "ai"],
    brain: true
  }));
  createCrmCalendarDocument(name, documentText);
  persist();
  render();
  addMessage("ai", "Соңғы жауап CRM құжат ретінде сақталды: Білім базасы, Жазбалар / CRM, Екінші ми және Күнтізбе / Құжаттар.");
}

function extractActionLines(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(line => line.length > 8 && line.length < 160)
    .filter(line => /(керек|жасау|тексеру|хабарласу|жіберу|төлеу|сұрау|енгізу|бақылау|follow|call|send|check)/i.test(line));
  return [...new Set(lines)].slice(0, 8);
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
    link: "AI чат",
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
  $("quizOut").textContent = "Тест жасалып жатыр...";
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

function currentCrmDocumentText() {
  const existing = $("crmOut")?.textContent?.trim() || "";
  if (existing && !existing.startsWith("Қате:") && existing !== "CRM талдау жасалып жатыр...") return existing;
  const context = buildContext();
  if (!context.trim()) return "";
  return analyzeCrm(context);
}

function createCrmDocument() {
  const text = currentCrmDocumentText();
  if (!text) {
    $("crmOut").textContent = "CRM құжат жасау үшін алдымен Excel/CSV/PDF/Word жүктеңіз немесе CRM талдау жасаңыз.";
    return;
  }
  const name = `CRM құжат ${isoDate()}`;
  const documentText = crmDocumentEnvelope(name, text);
  const doc = normalizeDoc({
    name: `${name}.txt`,
    type: "crm_report",
    text: documentText,
    tags: ["crm", "есеп", "құжат"],
    links: ["CRM", "Екінші ми"],
    createdAt: new Date().toISOString()
  });
  state.docs.unshift(doc);
  state.notes.unshift(normalizeNote({
    title: name,
    folder: "CRM",
    type: "long",
    body: documentText,
    tags: ["crm", "есеп"],
    brain: true
  }));
  createCrmCalendarDocument(name, documentText);
  persist();
  render();
  $("crmOut").textContent = `${documentText}\n\n---\nCRM құжат дайын: Білім базасына, Жазбалар / CRM папкасына, Екінші миға және Күнтізбе / Құжаттар ішіне сақталды.`;
}

function downloadCrmDocument() {
  const text = currentCrmDocumentText();
  if (!text) {
    $("crmOut").textContent = "Жүктеу үшін алдымен CRM талдау жасаңыз немесе құжат жүктеңіз.";
    return;
  }
  downloadText(`crm_report_${isoDate()}.txt`, text);
}

function crmDocumentEnvelope(name, body) {
  const summary = crmSourceSummary();
  return [
    name,
    `Жасалған уақыты: ${new Date().toLocaleString("kk-KZ")}`,
    `Қалай жасалды: сайттағы жүктелген құжаттар, CRM мәтіндері, жазбалар, тапсырмалар және календарь деректері талданып құрастырылды.`,
    `Дерек көзі: ${summary}`,
    "",
    "Нәтиже:",
    body,
    "",
    "Электр дүкені / B2B үшін бақылау:",
    "- Клиент бойынша келесі байланыс күнін белгілеу",
    "- Коммерциялық ұсыныс жіберілгенін бақылау",
    "- Төлем/қарыз мерзімін бақылау",
    "- Поставщик заказ және жеткізілім мерзімін бақылау",
    "- Тауар коды, остаток, сатып алу бағасы және сату бағасын бөлек тексеру"
  ].join("\n");
}

function createCrmCalendarDocument(title, text) {
  const cal = calendarData();
  const row = {
    id: crypto.randomUUID(),
    documentType: "crm_report",
    documentNumber: title,
    documentDate: isoDate(),
    clientId: "",
    supplierId: "",
    orderId: "",
    amount: 0,
    status: "open",
    deadline: "",
    fileUrl: "",
    esfStatus: "",
    esfDeadline: "",
    comment: text.slice(0, 1000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.documents.unshift(row);
  addCalendarEvent({ title: `CRM құжат: ${title}`, type: "crm_document", category: "CRM", startDate: isoDate(), relatedDocumentId: row.id, priority: "medium" });
  logHistory("crm_document", row.id, "құжат жасау", null, row, "CRM бөлімінен жасалды");
  return row;
}

function saveCrmQuickDeal(event) {
  event.preventDefault();
  const title = $("crmDealTitle")?.value?.trim();
  if (!title) return;
  const clientName = $("crmDealClient")?.value?.trim();
  const amount = Number($("crmDealAmount")?.value || 0);
  const status = $("crmDealStatus")?.value || "client_order_received";
  const due = $("crmDealDue")?.value || addDays(isoDate(), 1);
  const comment = $("crmDealComment")?.value?.trim() || "";
  const order = createOrder({
    entity: "client_order",
    title,
    date: isoDate(),
    endDate: due,
    category: "CRM",
    priority: amount >= 1000000 ? "high" : "medium",
    clientName,
    supplierName: "",
    amount,
    status,
    comment
  });
  if (amount > 0) {
    const payment = createPayment({
      title: `Төлем: ${title}`,
      amount,
      status: "planned",
      date: due,
      category: "CRM",
      priority: "high",
      clientName,
      supplierName: "",
      comment: `CRM заказ: ${title}`
    });
    payment.orderId = order.id;
    order.relatedPaymentId = payment.id;
  }
  logHistory("crm_deal", order.id, "CRM сделка қосу", null, order, "CRM толық панелі");
  event.target.reset();
  persist();
  render();
  if ($("crmOut")) $("crmOut").textContent = `CRM-ге қосылды: ${title}. Енді ол pipeline, кесте, төлем және еске салғыш ішінде көрінеді.`;
}

function crmSourceSummary() {
  const cal = calendarData();
  return [
    `${state.docs.length} құжат`,
    `${state.notes.filter(note => (note.folder || "").toLowerCase() === "crm").length} CRM жазба`,
    `${activeCalItems(cal.clients).length} клиент`,
    `${activeCalItems(cal.orders).length} заказ`,
    `${activeCalItems(cal.payments).length} төлем`,
    `${activeCalItems(cal.documents).length} календарь-құжат`
  ].join(", ");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function useCrmTemplate(kind) {
  const templates = {
    audit: [
      "B2B электр дүкені CRM аудиті",
      "",
      "1. Клиенттер: тұрақты B2B клиент, жаңа лид, ұйықтап жатқан клиент деп бөл.",
      "2. Продажа: қай клиенттен қай тауар/категория бойынша табыс бар екенін шығар.",
      "3. Қарыз: төлем мерзімі өткен клиенттерді бөлек көрсет.",
      "4. Заказ: поставщикке берілмеген, жолда тұрған, клиентке жеткізілмеген заказдарды тап.",
      "5. Келесі әрекет: әр клиентке нақты бір қадам жаз."
    ],
    quote: [
      "Коммерциялық ұсыныс шаблоны",
      "",
      "Клиент:",
      "Жоба/объект:",
      "Тауарлар: кабель, автомат, щит, розетка, жарық, расходник",
      "Баға:",
      "Жеткізу мерзімі:",
      "Төлем шарты:",
      "Келесі байланыс күні:"
    ],
    debt: [
      "Қарыз бақылау құжаты",
      "",
      "Клиент:",
      "Сома:",
      "Құжат/счет:",
      "Мерзім:",
      "Жауапты адам:",
      "Соңғы сөйлесу:",
      "Келесі әрекет:"
    ],
    supplier: [
      "Поставщик заказ бақылауы",
      "",
      "Поставщик:",
      "Заказ номері:",
      "Тауар коды/атауы:",
      "Саны:",
      "Сатып алу бағасы:",
      "Күтілетін келу күні:",
      "Клиент заказымен байланыс:"
    ]
  };
  const text = (templates[kind] || templates.audit).join("\n");
  if ($("crmPrompt")) $("crmPrompt").value = text;
  $("crmOut").textContent = text;
}

function renderCrmWorkspace() {
  if (!$("crmDashboard")) return;
  const cal = calendarData();
  const crmDocs = state.docs.filter(doc => doc.type === "crm_report" || (doc.tags || []).includes("crm"));
  const crmNotes = state.notes.filter(note => (note.folder || "").toLowerCase() === "crm" || (note.tags || []).includes("crm"));
  const crmCalendarDocs = activeCalItems(cal.documents).filter(doc => doc.documentType === "crm_report" || String(doc.documentNumber || "").toLowerCase().includes("crm"));
  const openOrders = activeCalItems(cal.orders).filter(order => !["closed", "received"].includes(order.status)).length;
  const unpaid = activeCalItems(cal.payments).filter(payment => payment.status !== "paid").reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0);
  const esfPending = activeCalItems(cal.documents).filter(doc => doc.esfDeadline && doc.esfStatus !== "sent").length;
  $("crmDashboard").innerHTML = [
    ["CRM құжат", crmDocs.length + crmCalendarDocs.length],
    ["CRM жазба", crmNotes.length],
    ["Клиент", activeCalItems(cal.clients).length],
    ["Ашық заказ", openOrders],
    ["Қарыз/төлем", `${Math.round(unpaid).toLocaleString("kk-KZ")} ₸`],
    ["ESF бақылау", esfPending]
  ].map(([label, value]) => `<article class="crm-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");

  const rows = crmDocs.slice(0, 8).map(doc => ({
    title: doc.name,
    date: doc.createdAt,
    where: "Білім базасы + Екінші ми",
    text: doc.text
  })).concat(crmNotes.slice(0, 6).map(note => ({
    title: note.title,
    date: note.createdAt,
    where: `Жазбалар / ${note.folder || "CRM"}`,
    text: note.body
  }))).concat(crmCalendarDocs.slice(0, 6).map(doc => ({
    title: doc.documentNumber,
    date: doc.createdAt,
    where: "Күнтізбе / Құжаттар",
    text: doc.comment
  }))).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 10);

  $("crmDocList").innerHTML = rows.map(row => `
    <article class="crm-doc-card">
      <div>
        <h4>${escapeHtml(row.title)}</h4>
        <span>${escapeHtml(formatDate(row.date))} · ${escapeHtml(row.where)}</span>
      </div>
      <p>${escapeHtml(row.text || "Ішкі мәтін жоқ").slice(0, 280)}</p>
      <small>Қалай жасалды: CRM талдауынан немесе CRM шаблонынан құрастырылып, сайттың базасына сақталды.</small>
    </article>
  `).join("") || `<article class="crm-doc-card"><h4>CRM құжат жоқ</h4><p>Алдымен CRM талдау жасап, “CRM құжат жасау” басыңыз.</p></article>`;

  $("crmPlaybook").innerHTML = [
    "Күн сайын: жаңа лид, төлем, поставщик заказын тексеру.",
    "Апта сайын: B2B клиенттерді A/B/C сегментке бөлу.",
    "Әр ұсыныстан кейін: коммерциялық ұсыныс жіберілді ме, жауап келді ме, келесі қоңырау күні бар ма.",
    "Қауіпті жер: қарыз, кешіккен жеткізілім, код/баға сәйкес келмеуі, ESF мерзімі."
  ].map(item => `<p>${item}</p>`).join("");
  renderCrmOperatingPanel(cal);
}

function renderCrmOperatingPanel(cal = calendarData()) {
  if (!$("crmPipeline") || !$("crmTable")) return;
  const query = $("crmSearch")?.value?.toLowerCase() || "";
  const filter = $("crmStatusFilter")?.value || "all";
  const rows = crmDealRows(cal).filter(row => {
    const haystack = `${row.title} ${row.clientName} ${row.statusLabel} ${row.comment}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (filter === "debt") return row.debt > 0;
    if (filter !== "all") return row.status === filter;
    return true;
  });
  const stages = [
    ["client_order_received", "Жаңа заказ"],
    ["need_to_order", "Поставщик керек"],
    ["sent_to_supplier", "Жіберілді"],
    ["received", "Келді"],
    ["closed", "Жабылды"]
  ];
  $("crmPipeline").innerHTML = stages.map(([status, label]) => {
    const stageRows = rows.filter(row => row.status === status);
    const total = stageRows.reduce((sum, row) => sum + row.amount, 0);
    return `
      <section class="crm-stage">
        <h4>${escapeHtml(label)} <span>${stageRows.length}</span></h4>
        <strong>${money(total)}</strong>
        ${stageRows.slice(0, 5).map(crmDealCard).join("") || `<p class="crm-empty">Жазба жоқ</p>`}
      </section>
    `;
  }).join("");
  $("crmTable").innerHTML = `
    <div class="crm-row crm-row-head">
      <span>Клиент</span><span>Заказ</span><span>Статус</span><span>Сома</span><span>Қарыз</span><span>Келесі әрекет</span><span></span>
    </div>
    ${rows.map(row => `
      <div class="crm-row ${row.overdue ? "overdue" : ""}">
        <span>${escapeHtml(row.clientName || "-")}</span>
        <span><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.comment || "")}</small></span>
        <span>${escapeHtml(row.statusLabel)}</span>
        <span>${money(row.amount)}</span>
        <span>${money(row.debt)}</span>
        <span>${escapeHtml(row.nextAction || "-")}</span>
        <span class="crm-row-actions">
          <button type="button" data-crm-task="${escapeHtml(row.id)}">Task</button>
          <button type="button" data-crm-close="${escapeHtml(row.id)}">Жабу</button>
        </span>
      </div>
    `).join("") || `<div class="crm-row"><span>CRM ішінде жазба жоқ. Жоғарыдағы форма арқылы клиент/заказ қосыңыз немесе Күнтізбе жүйесінен заказ енгізіңіз.</span></div>`}
  `;
  $("crmTable").querySelectorAll("[data-crm-task]").forEach(button => {
    button.addEventListener("click", () => createCrmFollowUpTask(button.dataset.crmTask));
  });
  $("crmTable").querySelectorAll("[data-crm-close]").forEach(button => {
    button.addEventListener("click", () => closeCrmDeal(button.dataset.crmClose));
  });
}

function crmDealRows(cal = calendarData()) {
  const clients = new Map(activeCalItems(cal.clients).map(client => [client.id, client]));
  const payments = activeCalItems(cal.payments);
  return activeCalItems(cal.orders).map(order => {
    const client = clients.get(order.clientId);
    const orderPayments = payments.filter(payment => payment.orderId === order.id);
    const linkedPayments = orderPayments.length ? orderPayments : payments.filter(payment => order.clientId && payment.clientId === order.clientId);
    const unpaid = linkedPayments.filter(payment => payment.status !== "paid").reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0);
    const nextTask = activeCalItems(cal.tasks)
      .filter(task => task.orderId === order.id && !["done", "closed"].includes(task.status))
      .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))[0];
    const nextAction = nextTask?.dueDate || order.expectedDeliveryDate || client?.nextActionDate || "";
    return {
      id: order.id,
      title: order.title || order.orderNumber || "CRM заказ",
      clientName: client?.name || "",
      status: order.status || "client_order_received",
      statusLabel: crmStatusLabel(order.status),
      amount: Number(order.totalAmount || 0),
      debt: unpaid || Number(order.debtAmount || 0),
      nextAction,
      overdue: Boolean(nextAction && nextAction < isoDate() && !["closed", "received"].includes(order.status)),
      comment: order.comment || order.productsJson || ""
    };
  }).sort((a, b) => Number(b.overdue) - Number(a.overdue) || String(a.nextAction || "9999").localeCompare(String(b.nextAction || "9999")));
}

function crmDealCard(row) {
  return `
    <article class="crm-deal-card ${row.overdue ? "overdue" : ""}">
      <b>${escapeHtml(row.title)}</b>
      <span>${escapeHtml(row.clientName || "Клиент жоқ")} · ${money(row.amount)}</span>
      <small>${row.debt > 0 ? `Қарыз: ${money(row.debt)} · ` : ""}${escapeHtml(row.nextAction || "күн жоқ")}</small>
    </article>
  `;
}

function crmStatusLabel(status) {
  return {
    client_order_received: "Жаңа заказ",
    need_to_order: "Поставщик керек",
    sent_to_supplier: "Поставщикке жіберілді",
    waiting_delivery: "Жеткізуді күту",
    received: "Келді",
    delivered: "Клиентке берілді",
    closed: "Жабылды",
    overdue_delivery: "Кешіккен"
  }[status] || status || "Ашық";
}

function createCrmFollowUpTask(orderId) {
  const cal = calendarData();
  const order = cal.orders.find(item => item.id === orderId);
  if (!order) return;
  createCalendarTask({
    title: `CRM follow-up: ${order.title}`,
    date: addDays(isoDate(), 1),
    category: "CRM",
    priority: order.priority || "medium",
    status: "open",
    orderId: order.id,
    comment: order.comment || ""
  });
  logHistory("crm_deal", order.id, "Follow-up task қосу", null, order, "CRM толық панелі");
  persist();
  render();
}

function closeCrmDeal(orderId) {
  const cal = calendarData();
  const order = cal.orders.find(item => item.id === orderId);
  if (!order) return;
  order.status = "closed";
  order.closedDate = isoDate();
  order.updatedAt = nowIso();
  logHistory("crm_deal", order.id, "CRM сделка жабу", null, order, "CRM толық панелі");
  persist();
  render();
}

function renderAssistantDashboard() {
  if (!$("assistantDashboard")) return;
  const cal = calendarData();
  const today = isoDate();
  const openTasks = state.tasks.filter(task => task.status !== "done");
  const overdueTasks = openTasks.filter(task => task.due && task.due < today);
  const todayPlans = state.plans.filter(plan => plan.date === today && plan.status !== "done");
  const unpaid = activeCalItems(cal.payments).filter(payment => payment.status !== "paid");
  const openOrders = activeCalItems(cal.orders).filter(order => !["closed", "received"].includes(order.status));
  const esf = activeCalItems(cal.documents).filter(doc => doc.esfDeadline && doc.esfStatus !== "sent");
  $("assistantDashboard").innerHTML = [
    ["Бүгінгі жоспар", todayPlans.length],
    ["Ашық task", openTasks.length],
    ["Кешіккен", overdueTasks.length],
    ["Ашық заказ", openOrders.length],
    ["Төлем/қарыз", unpaid.length],
    ["ESF", esf.length]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
}

async function importOneCExcel() {
  const file = $("onecFile")?.files?.[0];
  const out = $("onecOut");
  if (!file) {
    out.textContent = "Алдымен 1С-тен шыққан Excel/CSV файлды таңдаңыз.";
    return;
  }
  if (!window.XLSX && /\.(xlsx|xls)$/i.test(file.name)) {
    out.textContent = "Excel оқу кітапханасы жүктелмеді. Бетті жаңартып көріңіз.";
    return;
  }
  out.textContent = "1С файлы оқылып жатыр...";
  try {
    const table = await readTableFile(file);
    const result = analyzeOneCTable(table, $("onecType")?.value || "auto");
    state.oneC = normalizeOneC({
      fileName: file.name,
      importedAt: new Date().toISOString(),
      rows: result.rows.slice(0, 500),
      summary: result.summary,
      kind: result.kind,
      headers: result.headers,
      text: result.text
    });
    persist();
    render();
    out.textContent = result.text;
  } catch (error) {
    out.textContent = `1С файл оқу қатесі: ${shortError(error)}`;
  }
}

function analyzeOneCTable(table, forcedKind = "auto") {
  const rows = table.rows || [];
  if (!rows.length) throw new Error("Файл ішінде жол табылмады");
  const headers = normalizeHeader(rows[0]);
  const data = rows.slice(1).filter(row => row.some(cell => String(cell || "").trim()));
  const kind = forcedKind === "auto" ? detectOneCKind(headers) : forcedKind;
  const cols = oneCColumns(headers);
  const parsed = data.map(row => oneCRow(row, cols)).filter(row => Object.values(row).some(Boolean));
  const summary = oneCSummary(parsed, kind);
  const text = oneCReport(table.name, kind, headers, parsed, summary, cols);
  return { kind, headers, rows: parsed, summary, text };
}

function detectOneCKind(headers) {
  const source = headers.map(normalizeText).join(" ");
  if (/остат|склад|номенклат|артикул|товар|цена|бага|қалдық|калдык/.test(source)) return "products";
  if (/клиент|контрагент|долг|қарыз|карыз|задолж|дебитор/.test(source)) return "clients";
  if (/заказ|order|статус|поставщик|жеткізу|доставка/.test(source)) return "orders";
  if (/реализац|поступлен|счет|счёт|эсф|esf|документ|наклад/.test(source)) return "documents";
  return "products";
}

function oneCColumns(headers) {
  return {
    code: findColumn(headers, "", ["код", "артикул", "sku", "номеркод", "кодтовара"]),
    name: findColumn(headers, "", ["атауы", "наименование", "номенклатура", "товар", "тауар", "name"]),
    stock: findColumn(headers, "", ["остаток", "остат", "қалдық", "калдык", "склад", "саны", "количество", "qty"]),
    buyPrice: findColumn(headers, "", ["закуп", "сатыпалу", "себестоимость", "кірісбаға", "покуп"]),
    sellPrice: findColumn(headers, "", ["продаж", "сату", "цена", "баға", "бага", "розниц"]),
    client: findColumn(headers, "", ["клиент", "контрагент", "покупатель", "сатыпалушы"]),
    debt: findColumn(headers, "", ["долг", "қарыз", "карыз", "задолж", "дебет", "debt"]),
    date: findColumn(headers, "", ["дата", "күн", "куні", "date"]),
    doc: findColumn(headers, "", ["документ", "номер", "нөмір", "номердок", "счет", "эсф", "esf"]),
    status: findColumn(headers, "", ["статус", "состояние", "күйі", "куйі"])
  };
}

function oneCRow(row, cols) {
  const get = (key) => cols[key] >= 0 ? String(row[cols[key]] ?? "").trim() : "";
  return {
    code: get("code"),
    name: get("name"),
    stock: parseMoney(get("stock")),
    buyPrice: parseMoney(get("buyPrice")),
    sellPrice: parseMoney(get("sellPrice")),
    client: get("client"),
    debt: parseMoney(get("debt")),
    date: get("date"),
    document: get("doc"),
    status: get("status")
  };
}

function parseMoney(value) {
  const clean = String(value || "").replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function oneCSummary(rows, kind) {
  const products = rows.filter(row => row.name || row.code);
  const clients = rows.filter(row => row.client);
  const lowStock = products.filter(row => row.stock > 0 && row.stock <= 3).length;
  const noStock = products.filter(row => row.stock === 0 && (row.name || row.code)).length;
  const debtRows = rows.filter(row => row.debt > 0);
  const debtTotal = debtRows.reduce((sum, row) => sum + row.debt, 0);
  const stockValue = products.reduce((sum, row) => sum + (row.stock || 0) * (row.sellPrice || row.buyPrice || 0), 0);
  const docs = rows.filter(row => row.document);
  return {
    kind,
    totalRows: rows.length,
    products: products.length,
    clients: new Set(clients.map(row => row.client)).size,
    lowStock,
    noStock,
    debtRows: debtRows.length,
    debtTotal,
    stockValue,
    documents: docs.length
  };
}

function oneCReport(fileName, kind, headers, rows, summary, cols) {
  const risky = rows.filter(row => row.debt > 0 || row.stock === 0 || (row.stock > 0 && row.stock <= 3)).slice(0, 12);
  return [
    `1С Excel талдау: ${fileName}`,
    `Түрі: ${oneCKindLabel(kind)}`,
    `Оқылған жол: ${summary.totalRows}`,
    "",
    "Танылған бағандар:",
    Object.entries(cols).filter(([, index]) => index >= 0).map(([key, index]) => `- ${oneCColumnLabel(key)}: ${headers[index]}`).join("\n") || "- Бағандар толық танылмады",
    "",
    "Қысқаша нәтиже:",
    `- Тауар/позиция: ${summary.products}`,
    `- Клиент саны: ${summary.clients}`,
    `- Қалдық аз: ${summary.lowStock}`,
    `- Қалдық жоқ: ${summary.noStock}`,
    `- Қарыз жолы: ${summary.debtRows}`,
    `- Қарыз сомасы: ${Math.round(summary.debtTotal).toLocaleString("kk-KZ")} ₸`,
    `- Склад құны шамамен: ${Math.round(summary.stockValue).toLocaleString("kk-KZ")} ₸`,
    `- Құжат саны: ${summary.documents}`,
    "",
    "Назар керек жолдар:",
    risky.map((row, index) => `${index + 1}. ${row.client || row.name || row.document || row.code || "Жол"}${row.debt ? ` · қарыз ${Math.round(row.debt).toLocaleString("kk-KZ")} ₸` : ""}${row.stock === 0 ? " · остаток жоқ" : row.stock > 0 && row.stock <= 3 ? ` · остаток аз (${row.stock})` : ""}`).join("\n") || "Қауіпті жол табылмады.",
    "",
    "Не істей алады:",
    "- Остаток жоқ/аз тауарларға заказ тапсырмасын шығару",
    "- Қарызы бар клиенттерге follow-up жасау",
    "- 1С бағасын прайспен салыстыруға дайындау",
    "- CRM құжат жасап, Екінші миға сақтау"
  ].join("\n");
}

function oneCKindLabel(kind) {
  return { products: "Тауар / остаток / баға", clients: "Клиент / қарыз", orders: "Заказдар", documents: "Құжаттар / ESF" }[kind] || "Авто";
}

function oneCColumnLabel(key) {
  return { code: "Код", name: "Атауы", stock: "Остаток", buyPrice: "Сатып алу бағасы", sellPrice: "Сату бағасы", client: "Клиент", debt: "Қарыз", date: "Дата", doc: "Құжат", status: "Статус" }[key] || key;
}

function saveOneCToBrain() {
  if (!state.oneC?.text) {
    if ($("onecOut")) $("onecOut").textContent = "Алдымен 1С Excel оқу батырмасын басыңыз.";
    return;
  }
  state.docs.unshift(normalizeDoc({
    name: `1C_${state.oneC.kind}_${isoDate()}.txt`,
    type: "1c_excel",
    text: state.oneC.text,
    tags: ["1c", "excel", state.oneC.kind],
    links: ["1С", "Екінші ми"]
  }));
  persist();
  render();
  if ($("onecOut")) $("onecOut").textContent = `${state.oneC.text}\n\n---\n1С талдау Екінші ми / Білім базасына сақталды.`;
}

function oneCToCrmDocument() {
  if (!state.oneC?.text) {
    if ($("onecOut")) $("onecOut").textContent = "Алдымен 1С Excel оқу батырмасын басыңыз.";
    return;
  }
  const name = `1С CRM құжат ${isoDate()}`;
  const text = crmDocumentEnvelope(name, state.oneC.text);
  state.docs.unshift(normalizeDoc({ name: `${name}.txt`, type: "crm_report", text, tags: ["1c", "crm", "excel"], links: ["1С Excel", "CRM"] }));
  state.notes.unshift(normalizeNote({ title: name, folder: "CRM", type: "long", body: text, tags: ["1c", "crm"], brain: true }));
  createCrmCalendarDocument(name, text);
  persist();
  render();
  if ($("onecOut")) $("onecOut").textContent = `${text}\n\n---\n1С талдау CRM құжат болып сақталды.`;
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
    folder: $("noteFolder")?.value.trim() || "Жалпы",
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

function postponeTaskTomorrow(id) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  task.due = addDays(isoDate(), 1);
  if (task.status === "done") task.status = "todo";
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
  const title = "CRM келесі әрекеті";
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

function saveGoal(event) {
  event.preventDefault();
  const title = $("goalTitle")?.value.trim();
  if (!title) return;
  const stages = splitLines($("goalStages")?.value).map(name => ({
    id: crypto.randomUUID(),
    title: name,
    description: "",
    deadline: $("goalEnd")?.value || "",
    status: "todo",
    done: false
  }));
  state.goals.unshift(normalizeGoal({
    title,
    description: $("goalDescription")?.value.trim() || "",
    category: $("goalCategory")?.value || "Бизнес",
    status: $("goalStatus")?.value || "active",
    startDate: $("goalStart")?.value || isoDate(),
    endDate: $("goalEnd")?.value || "",
    stages
  }));
  event.target.reset();
  persist();
  render();
}

function saveProject(event) {
  event.preventDefault();
  const title = $("projectTitle")?.value.trim();
  if (!title) return;
  const modules = splitLines($("projectModules")?.value).map(name => ({ id: crypto.randomUUID(), title: name }));
  const tasks = splitLines($("projectTasks")?.value).map(name => ({
    id: crypto.randomUUID(),
    title: name,
    description: "",
    status: "todo",
    done: false,
    deadline: $("projectEnd")?.value || "",
    owner: ""
  }));
  state.projects.unshift(normalizeProject({
    title,
    goal: $("projectGoal")?.value.trim() || "",
    category: $("projectCategory")?.value || "Бизнес",
    priority: $("projectPriority")?.value || "medium",
    status: $("projectStatus")?.value || "active",
    startDate: $("projectStart")?.value || isoDate(),
    endDate: $("projectEnd")?.value || "",
    modules,
    tasks
  }));
  event.target.reset();
  persist();
  render();
}

function savePlan(event) {
  event.preventDefault();
  const title = $("planTitle")?.value.trim();
  if (!title) return;
  const tasks = splitLines($("planTasks")?.value).map(name => ({
    id: crypto.randomUUID(),
    title: name,
    done: false
  }));
  state.plans.unshift(normalizePlan({
    title,
    type: $("planType")?.value || "daily",
    category: $("planCategory")?.value || "Бизнес",
    date: $("planDate")?.value || isoDate(),
    goalTitle: $("planGoal")?.value.trim() || "",
    projectTitle: $("planProject")?.value.trim() || "",
    focus: $("planFocus")?.value.trim() || "",
    status: "today",
    tasks
  }));
  event.target.reset();
  persist();
  render();
}

function saveChallenge(event) {
  event.preventDefault();
  const title = $("challengeTitle")?.value.trim();
  if (!title) return;
  const totalDays = Math.max(1, Number($("challengeTotal")?.value || 30));
  const startDate = $("challengeStart")?.value || isoDate();
  state.challenges.unshift(normalizeChallenge({
    title,
    description: $("challengeDescription")?.value.trim() || "",
    totalDays,
    startDate,
    endDate: addDays(startDate, totalDays - 1),
    doneDates: [],
    missedDates: []
  }));
  event.target.reset();
  if ($("challengeTotal")) $("challengeTotal").value = "30";
  persist();
  render();
}

function splitLines(value) {
  return String(value || "").split(/\n/).map(line => line.trim()).filter(Boolean).slice(0, 80);
}

function toggleGoalStage(goalId, stageId) {
  const goal = state.goals.find(item => item.id === goalId);
  const stage = goal?.stages.find(item => item.id === stageId);
  if (!stage) return;
  stage.done = !stage.done;
  stage.status = stage.done ? "done" : "todo";
  goal.updatedAt = new Date().toISOString();
  persist();
  render();
}

function toggleProjectTask(projectId, taskId) {
  const project = state.projects.find(item => item.id === projectId);
  const task = project?.tasks.find(item => item.id === taskId);
  if (!task) return;
  task.done = !task.done;
  task.status = task.done ? "done" : "todo";
  project.updatedAt = new Date().toISOString();
  persist();
  render();
}

function togglePlanTask(planId, taskId) {
  const plan = state.plans.find(item => item.id === planId);
  const task = plan?.tasks.find(item => item.id === taskId);
  if (!task) return;
  task.done = !task.done;
  const progress = planProgress(plan);
  plan.status = progress.percent === 100 ? "done" : plan.date === isoDate() ? "today" : plan.date < isoDate() ? "late" : "planned";
  plan.updatedAt = new Date().toISOString();
  persist();
  render();
}

function markChallengeToday(id) {
  const challenge = state.challenges.find(item => item.id === id);
  if (!challenge) return;
  const today = isoDate();
  challenge.doneDates = Array.isArray(challenge.doneDates) ? challenge.doneDates : [];
  challenge.missedDates = Array.isArray(challenge.missedDates) ? challenge.missedDates : [];
  if (challenge.doneDates.includes(today)) {
    challenge.doneDates = challenge.doneDates.filter(date => date !== today);
  } else {
    challenge.doneDates.push(today);
    challenge.missedDates = challenge.missedDates.filter(date => date !== today);
  }
  challenge.updatedAt = new Date().toISOString();
  persist();
  render();
}

function markChallengeMissedToday(id) {
  const challenge = state.challenges.find(item => item.id === id);
  if (!challenge) return;
  const today = isoDate();
  challenge.doneDates = (challenge.doneDates || []).filter(date => date !== today);
  challenge.missedDates = Array.isArray(challenge.missedDates) ? challenge.missedDates : [];
  if (challenge.missedDates.includes(today)) {
    challenge.missedDates = challenge.missedDates.filter(date => date !== today);
  } else {
    challenge.missedDates.push(today);
  }
  challenge.updatedAt = new Date().toISOString();
  persist();
  render();
}

function deleteGoalItem(type, id) {
  const map = { goal: "goals", project: "projects", plan: "plans", challenge: "challenges" };
  const key = map[type];
  if (!key) return;
  if (!confirm("Өшіреміз бе?")) return;
  state[key] = state[key].filter(item => item.id !== id);
  persist();
  render();
}

async function enableNotifications() {
  localStorage.setItem("sanabase-reminders-enabled", "1");
  if (!("Notification" in window)) {
    setNotifyStatus("Бұл браузер notification қолдамайды. Сайт ашық тұрғанда ішкі ескерту ғана көрсетіледі.");
    checkReminders(true);
    return;
  }
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission === "granted") {
    setNotifyStatus("Еске салғыш қосылды. Маңызды істер мен даталар сайт ашық тұрғанда хабарланады.");
    checkReminders(true);
  } else {
    setNotifyStatus("Notification рұқсаты берілмеді. Браузер баптауынан рұқсат берсеңіз, еске салғыш жұмыс істейді.");
  }
}

function startReminderEngine() {
  updateNotifyUi();
  checkReminders(false);
  setInterval(() => checkReminders(false), 5 * 60 * 1000);
}

function updateNotifyUi() {
  const enabled = remindersEnabled();
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  if ($("notifyEnableBtn")) $("notifyEnableBtn").textContent = enabled && permission === "granted" ? "Еске салғыш қосулы" : "Еске салғышты қосу";
  if (enabled && permission === "granted") setNotifyStatus("Еске салғыш қосулы. Бүгінгі маңызды істер автоматты тексеріледі.");
}

function remindersEnabled() {
  return localStorage.getItem("sanabase-reminders-enabled") === "1";
}

function checkReminders(force = false) {
  if (!remindersEnabled() && !force) return;
  const items = reminderCandidates();
  const due = items.filter(item => item.urgency !== "later").slice(0, 8);
  if (!due.length) {
    if (force) setNotifyStatus("Қазір еске салатын кешіккен немесе бүгінгі маңызды іс жоқ.");
    return;
  }
  setNotifyStatus(`Еске салғыш: ${due.length} маңызды іс/дата бар.`);
  due.forEach(item => sendReminder(item, force));
}

function reminderCandidates() {
  const cal = calendarData();
  const today = isoDate();
  const tomorrow = addDays(today, 1);
  const items = [];
  state.tasks.forEach(task => {
    if (task.status === "done" || !task.due) return;
    items.push(reminderItem(`task:${task.id}`, task.title, task.due, task.priority, "Тапсырма", task.body));
  });
  state.goals.forEach(goal => {
    if (goal.status === "done" || !goal.endDate) return;
    items.push(reminderItem(`goal:${goal.id}`, goal.title, goal.endDate, "high", "Мақсат", goal.description));
  });
  state.projects.forEach(project => {
    if (project.status === "done" || !project.endDate) return;
    items.push(reminderItem(`project:${project.id}`, project.title, project.endDate, project.priority === "critical" ? "high" : project.priority, "Проект", project.goal));
  });
  state.plans.forEach(plan => {
    if (plan.status === "done" || !plan.date) return;
    items.push(reminderItem(`plan:${plan.id}`, plan.title, plan.date, "medium", "Жоспар", plan.focus));
  });
  state.challenges.forEach(challenge => {
    if (challenge.doneDates?.includes(today) || challenge.missedDates?.includes(today)) return;
    items.push(reminderItem(`challenge:${challenge.id}`, challenge.title, today, "medium", "Челлендж", "Бүгін орындауды белгілеңіз."));
  });
  activeCalItems(cal.calendar_events).forEach(event => {
    if (["done", "closed", "paid", "sent"].includes(event.status)) return;
    items.push(reminderItem(`event:${event.id}`, event.title, event.startDate, event.priority, event.category || "Күнтізбе", event.description));
  });
  activeCalItems(cal.tasks).forEach(task => {
    if (["done", "closed"].includes(task.status)) return;
    items.push(reminderItem(`cal-task:${task.id}`, task.title, task.dueDate, task.priority, task.category || "Тапсырма", task.comment || task.description));
  });
  activeCalItems(cal.orders).forEach(order => {
    if (order.expectedDeliveryDate && !order.receivedDate) {
      items.push(reminderItem(`order:${order.id}`, `Жеткізілім: ${order.title}`, order.expectedDeliveryDate, order.status === "overdue_delivery" ? "high" : order.priority, "Заказ", order.comment));
    }
  });
  activeCalItems(cal.documents).forEach(doc => {
    if (doc.esfDeadline && doc.esfStatus !== "sent") {
      items.push(reminderItem(`esf:${doc.id}`, `ESF мерзімі: ${doc.documentNumber}`, doc.esfDeadline, "high", "ESF", doc.comment));
    }
  });
  activeCalItems(cal.payments).forEach(payment => {
    if (payment.status !== "paid" && payment.dueDate) {
      items.push(reminderItem(`payment:${payment.id}`, `Төлем: ${payment.title}`, payment.dueDate, "high", "Қаржы", payment.comment));
    }
  });
  return items
    .map(item => ({
      ...item,
      urgency: item.date < today ? "overdue" : item.date === today ? "today" : item.date === tomorrow ? "tomorrow" : "later"
    }))
    .filter(item => item.date && item.date <= tomorrow)
    .sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency) || a.date.localeCompare(b.date));
}

function reminderItem(id, title, date, priority, category, body = "") {
  return {
    id,
    title: title || "Еске салғыш",
    date,
    priority: priority || "medium",
    category,
    body: body || ""
  };
}

function urgencyRank(value) {
  return { overdue: 0, today: 1, tomorrow: 2, later: 3 }[value] ?? 3;
}

function sendReminder(item, force) {
  const dayKey = `sanabase-reminder-sent-${isoDate()}`;
  const sent = JSON.parse(localStorage.getItem(dayKey) || "[]");
  const key = `${item.id}:${item.urgency}`;
  if (!force && sent.includes(key)) return;
  const title = item.urgency === "overdue" ? `Кешіккен: ${item.title}` : item.urgency === "today" ? `Бүгін: ${item.title}` : `Ертең: ${item.title}`;
  const body = `${item.category} · ${item.date} · ${priorityLabel(item.priority)}${item.body ? `\n${item.body.slice(0, 120)}` : ""}`;
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, tag: key, renotify: false });
  }
  sent.push(key);
  localStorage.setItem(dayKey, JSON.stringify([...new Set(sent)].slice(-100)));
}

function setNotifyStatus(message) {
  if ($("notifyStatus")) $("notifyStatus").textContent = message;
}

function calendarData() {
  if (!state.calendarOS) state.calendarOS = defaultCalendarOS();
  const defaults = defaultCalendarOS();
  Object.keys(defaults).forEach(key => {
    if (!Array.isArray(defaults[key])) return;
    if (!Array.isArray(state.calendarOS[key])) state.calendarOS[key] = [];
  });
  if (!state.calendarOS.settings) state.calendarOS.settings = defaults.settings;
  return state.calendarOS;
}

function normalizeCalendarOS(data) {
  const next = defaultCalendarOS();
  Object.keys(next).forEach(key => {
    if (Array.isArray(next[key])) next[key] = Array.isArray(data?.[key]) ? data[key] : [];
  });
  next.settings = { ...next.settings, ...(data?.settings || {}) };
  return next;
}

function mergeCalendarBackup(data) {
  const cal = calendarData();
  const incoming = normalizeCalendarOS(data);
  Object.keys(defaultCalendarOS()).forEach(key => {
    if (!Array.isArray(cal[key]) || !Array.isArray(incoming[key])) return;
    const existing = new Set(cal[key].map(item => item.id));
    incoming[key].forEach(item => {
      if (!existing.has(item.id)) {
        cal[key].unshift(item);
        existing.add(item.id);
      }
    });
  });
  cal.settings = { ...cal.settings, ...incoming.settings };
}

function defaultCalendarOS() {
  return {
    calendar_events: [],
    orders: [],
    tasks: [],
    clients: [],
    suppliers: [],
    documents: [],
    payments: [],
    habits: [],
    reports: [],
    history_logs: [],
    settings: { activeView: "week", currency: "KZT" }
  };
}

function calendarQuick(kind) {
  const today = isoDate();
  const presets = {
    event: ["event", "Кездесу / оқиға", "Бизнес", "open"],
    task: ["task", "Жаңа тапсырма", "Бизнес", "open"],
    client_order: ["client_order", "Клиент заказы келді", "Заказдар", "client_order_received"],
    need_supplier: ["supplier_order", "Поставщикке заказ беру керек", "Поставщиктер", "need_to_order"],
    sent_supplier: ["supplier_order", "Заказ поставщикке жіберілді", "Поставщиктер", "sent_to_supplier"],
    received: ["supplier_order", "Заказ келді", "Заказдар", "received"],
    payment: ["payment", "Төлем", "Қаржы", "payment_waiting"],
    document: ["document", "Құжат / ESF", "Құжаттар", "open"],
    report: ["report", "Күндік есеп", "Есептер", "open"],
    habit: ["habit", "Әдет", "Әдеттер", "open"]
  }[kind] || ["event", "Оқиға", "Бизнес", "open"];
  $("calEntity").value = presets[0];
  $("calTitle").value = presets[1];
  $("calCategory").value = presets[2];
  $("calStatus").value = presets[3];
  $("calDate").value = today;
  $("calEndDate").value = kind === "sent_supplier" ? addDays(today, 3) : "";
  $("calTitle").focus();
}

function setCalendarView(view) {
  const cal = calendarData();
  cal.settings.activeView = view;
  persist();
  renderCalendarOS();
}

function saveCalendarRecord(event) {
  event.preventDefault();
  const cal = calendarData();
  const input = calendarFormValue();
  if (!input.title) return;
  if (input.entity === "client") createClient(input);
  else if (input.entity === "supplier") createSupplier(input);
  else if (input.entity === "client_order" || input.entity === "supplier_order") createOrder(input);
  else if (input.entity === "task") createCalendarTask(input);
  else if (input.entity === "payment") createPayment(input);
  else if (input.entity === "document") createDocument(input);
  else if (input.entity === "habit") createHabit(input);
  else if (input.entity === "report") createReport(input);
  else addCalendarEvent({ title: input.title, type: "event", category: input.category, startDate: input.date, endDate: input.endDate, priority: input.priority, status: input.status, description: input.comment, amount: input.amount });
  logHistory(input.entity, input.title, "қосу", null, input, "Күнтізбе формасы");
  event.target.reset();
  $("calDate").value = isoDate();
  persist();
  render();
}

function calendarFormValue() {
  return {
    entity: $("calEntity").value,
    title: $("calTitle").value.trim(),
    date: $("calDate").value || isoDate(),
    endDate: $("calEndDate").value || $("calDate").value || isoDate(),
    category: $("calCategory").value || "Business",
    priority: $("calPriority").value || "medium",
    clientName: $("calClient").value.trim(),
    supplierName: $("calSupplier").value.trim(),
    amount: Number($("calAmount").value || 0),
    status: $("calStatus").value || "open",
    comment: $("calComment").value.trim()
  };
}

function createClient(input) {
  const cal = calendarData();
  const client = {
    id: crypto.randomUUID(),
    name: input.title,
    type: "client",
    contactName: input.clientName,
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    notes: input.comment,
    totalSales: 0,
    totalDebt: 0,
    lastContactDate: input.date,
    nextActionDate: input.endDate,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.clients.unshift(client);
  addCalendarEvent({ title: `Клиент бойынша келесі әрекет: ${client.name}`, type: "reminder", category: "Клиенттер", startDate: input.endDate, relatedClientId: client.id, priority: input.priority });
  return client;
}

function createSupplier(input) {
  const cal = calendarData();
  const supplier = {
    id: crypto.randomUUID(),
    name: input.title,
    contactName: input.supplierName,
    phone: "",
    whatsapp: "",
    email: "",
    productCategories: input.category,
    notes: input.comment,
    totalOrders: 0,
    totalPaid: 0,
    totalDebt: 0,
    lastOrderDate: input.date,
    nextActionDate: input.endDate,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.suppliers.unshift(supplier);
  addCalendarEvent({ title: `Поставщик бойынша келесі әрекет: ${supplier.name}`, type: "reminder", category: "Поставщиктер", startDate: input.endDate, relatedSupplierId: supplier.id, priority: input.priority });
  return supplier;
}

function createOrder(input) {
  const cal = calendarData();
  const client = input.clientName ? upsertClient(input.clientName) : null;
  const supplier = input.supplierName ? upsertSupplier(input.supplierName) : null;
  const order = {
    id: crypto.randomUUID(),
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    title: input.title,
    clientId: client?.id || "",
    supplierId: supplier?.id || "",
    orderType: input.entity,
    status: input.status === "open" ? "client_order_received" : input.status,
    priority: input.priority,
    clientOrderDate: input.entity === "client_order" ? input.date : "",
    needToOrderDate: input.status === "need_to_order" ? input.date : "",
    sentToSupplierDate: input.status === "sent_to_supplier" ? input.date : "",
    expectedDeliveryDate: input.endDate,
    receivedDate: input.status === "received" ? input.date : "",
    deliveredToClientDate: "",
    closedDate: "",
    totalAmount: input.amount,
    paidAmount: 0,
    debtAmount: input.amount,
    productsJson: input.comment,
    missingProductsJson: "",
    comment: input.comment,
    problemComment: "",
    relatedCalendarEventId: "",
    relatedPaymentId: "",
    relatedDocumentId: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.orders.unshift(order);
  applyOrderWorkflow(order, input);
  return order;
}

function applyOrderWorkflow(order, input) {
  if (order.status === "client_order_received") {
    addCalendarEvent({ title: `Клиент заказы келді: ${order.title}`, type: "client_order", category: "Заказдар", startDate: input.date, relatedOrderId: order.id, relatedClientId: order.clientId, priority: order.priority });
    ["Бағаны есептеу", "Поставщикте бар-жоғын тексеру", "Поставщикке заказ беру керек"].forEach((title, index) => {
      createCalendarTask({ ...input, title: `${title}: ${order.title}`, date: addDays(input.date, index), category: "Заказдар", status: "open", orderId: order.id });
    });
  }
  if (order.status === "sent_to_supplier" || order.status === "waiting_delivery") {
    order.status = "sent_to_supplier";
    addCalendarEvent({ title: `Заказ поставщикке жіберілді: ${order.title}`, type: "order_sent", category: "Поставщиктер", startDate: input.date, relatedOrderId: order.id, relatedSupplierId: order.supplierId, priority: order.priority });
    addCalendarEvent({ title: `Заказ бүгін келуі керек: ${order.title}`, type: "order_expected", category: "Заказдар", startDate: input.endDate, relatedOrderId: order.id, relatedSupplierId: order.supplierId, priority: "high" });
    createCalendarTask({ ...input, title: `Поставщик бойынша келесі әрекет: ${order.title}`, date: input.endDate, category: "Поставщиктер", status: "open", orderId: order.id });
  }
  if (order.status === "received") {
    addCalendarEvent({ title: `Заказ келді: ${order.title}`, type: "order_received", category: "Заказдар", startDate: input.date, relatedOrderId: order.id, priority: order.priority });
    ["Келген тауарды тексеру", "Жетпеген тауарды белгілеу", "Накладная жасау", "1C ішінде реализация жасау", "Клиентке жеткізу", "ESF мерзімін бақылау", "Төлемді бақылау"].forEach((title, index) => {
      createCalendarTask({ ...input, title: `${title}: ${order.title}`, date: addDays(input.date, index), category: index < 2 ? "Заказдар" : index < 5 ? "Құжаттар" : "Қаржы", status: "open", orderId: order.id });
    });
  }
}

function createCalendarTask(input) {
  const cal = calendarData();
  const task = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.comment || "",
    category: input.category || "Business",
    priority: input.priority || "medium",
    status: input.status || "open",
    dueDate: input.date,
    calendarEventId: "",
    clientId: input.clientId || "",
    supplierId: input.supplierId || "",
    orderId: input.orderId || "",
    documentId: "",
    paymentId: "",
    amount: input.amount || 0,
    resultNote: "",
    comment: input.comment || "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: "",
    archivedAt: ""
  };
  cal.tasks.unshift(task);
  addCalendarEvent({ title: task.title, type: "task", category: task.category, startDate: task.dueDate, relatedOrderId: task.orderId, priority: task.priority, status: task.status });
  return task;
}

function createPayment(input) {
  const cal = calendarData();
  const payment = {
    id: crypto.randomUUID(),
    title: input.title,
    amount: input.amount,
    direction: input.amount >= 0 ? "income" : "expense",
    status: input.status === "paid" ? "paid" : "planned",
    dueDate: input.date,
    paidDate: input.status === "paid" ? input.date : "",
    clientId: input.clientName ? upsertClient(input.clientName).id : "",
    supplierId: input.supplierName ? upsertSupplier(input.supplierName).id : "",
    orderId: "",
    documentId: "",
    category: input.category,
    comment: input.comment,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.payments.unshift(payment);
  addCalendarEvent({ title: `Төлем: ${payment.title}`, type: payment.status === "paid" ? "payment" : "debt", category: "Қаржы", startDate: payment.dueDate, relatedPaymentId: payment.id, amount: payment.amount, priority: input.priority });
  return payment;
}

function createDocument(input) {
  const cal = calendarData();
  const documentDate = input.date || isoDate();
  const documentTitle = input.title || `Құжат ${documentDate}`;
  const documentType = detectDocumentType(`${documentTitle} ${input.comment || ""}`);
  const esfDeadline = documentType === "realization" || documentType === "esf" ? addDays(documentDate, 15) : "";
  const doc = {
    id: crypto.randomUUID(),
    documentType,
    documentNumber: documentTitle,
    documentDate,
    clientId: input.clientName ? upsertClient(input.clientName).id : "",
    supplierId: input.supplierName ? upsertSupplier(input.supplierName).id : "",
    orderId: "",
    amount: input.amount,
    status: input.status || "open",
    deadline: input.endDate,
    fileUrl: "",
    esfStatus: documentType === "esf" ? "pending" : "",
    esfDeadline,
    comment: input.comment,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    archivedAt: ""
  };
  cal.documents.unshift(doc);
  addCalendarEvent({ title: `Құжат: ${doc.documentNumber}`, type: "document", category: "Құжаттар", startDate: documentDate, relatedDocumentId: doc.id, amount: doc.amount, priority: input.priority });
  if (esfDeadline) {
    addCalendarEvent({ title: `ESF мерзімі: ${doc.documentNumber}`, type: "esf_deadline", category: "ESF", startDate: esfDeadline, relatedDocumentId: doc.id, priority: "high" });
    addCalendarEvent({ title: `ESF ескерту 2 күн бұрын: ${doc.documentNumber}`, type: "reminder", category: "ESF", startDate: addDays(esfDeadline, -2), relatedDocumentId: doc.id, priority: "high" });
    addCalendarEvent({ title: `ESF ескерту 1 күн бұрын: ${doc.documentNumber}`, type: "reminder", category: "ESF", startDate: addDays(esfDeadline, -1), relatedDocumentId: doc.id, priority: "high" });
  }
  return doc;
}

function createHabit(input) {
  const cal = calendarData();
  const habit = {
    id: crypto.randomUUID(),
    title: input.title,
    category: input.category,
    target: input.comment,
    repeatRule: "daily",
    status: input.status || "open",
    progress: 0,
    streak: 0,
    date: input.date,
    comment: input.comment,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  cal.habits.unshift(habit);
  addCalendarEvent({ title: `Әдет: ${habit.title}`, type: "habit", category: "Әдеттер", startDate: habit.date, priority: input.priority });
  return habit;
}

function createReport(input) {
  const cal = calendarData();
  const report = {
    id: crypto.randomUUID(),
    reportType: input.title.toLowerCase().includes("month") ? "monthly" : input.title.toLowerCase().includes("week") ? "weekly" : "daily",
    title: input.title,
    periodStart: input.date,
    periodEnd: input.endDate || input.date,
    summaryJson: JSON.stringify(buildReportSummary()),
    totalOrders: activeCalItems(cal.orders).length,
    closedOrders: activeCalItems(cal.orders).filter(o => o.status === "closed").length,
    openOrders: activeCalItems(cal.orders).filter(o => o.status !== "closed").length,
    delayedOrders: activeCalItems(cal.orders).filter(o => o.status === "overdue_delivery").length,
    totalIncome: sumPayments("income"),
    totalExpense: sumPayments("expense"),
    totalDebt: sumDebts(),
    documentsCount: activeCalItems(cal.documents).length,
    esfPendingCount: activeCalItems(cal.documents).filter(d => d.esfDeadline && d.esfStatus !== "sent").length,
    comment: input.comment,
    createdAt: nowIso()
  };
  cal.reports.unshift(report);
  addCalendarEvent({ title: report.title, type: "report_day", category: "Reports", startDate: input.date, priority: input.priority });
  return report;
}

function addCalendarEvent(event) {
  const cal = calendarData();
  const row = {
    id: crypto.randomUUID(),
    title: event.title,
    description: event.description || "",
    category: event.category || "Business",
    type: event.type || "event",
    startDate: event.startDate || isoDate(),
    endDate: event.endDate || event.startDate || isoDate(),
    allDay: true,
    priority: event.priority || "medium",
    status: event.status || "open",
    relatedClientId: event.relatedClientId || "",
    relatedSupplierId: event.relatedSupplierId || "",
    relatedOrderId: event.relatedOrderId || "",
    relatedDocumentId: event.relatedDocumentId || "",
    relatedPaymentId: event.relatedPaymentId || "",
    amount: event.amount || 0,
    currency: "KZT",
    repeatRule: event.repeatRule || "",
    reminderMinutes: event.reminderMinutes || 1440,
    isPrivate: Boolean(event.isPrivate),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: "",
    archivedAt: ""
  };
  cal.calendar_events.unshift(row);
  return row;
}

function upsertClient(name) {
  const cal = calendarData();
  let client = cal.clients.find(item => !item.archivedAt && item.name.toLowerCase() === name.toLowerCase());
  if (!client) client = createClient({ title: name, clientName: name, date: isoDate(), endDate: isoDate(), comment: "", priority: "medium" });
  return client;
}

function upsertSupplier(name) {
  const cal = calendarData();
  let supplier = cal.suppliers.find(item => !item.archivedAt && item.name.toLowerCase() === name.toLowerCase());
  if (!supplier) supplier = createSupplier({ title: name, supplierName: name, date: isoDate(), endDate: isoDate(), category: "Поставщиктер", comment: "", priority: "medium" });
  return supplier;
}

function renderCalendarOS() {
  if (!$("calDashboard")) return;
  const cal = calendarData();
  if (updateCalendarAutomation()) {
    localStorage.setItem("sanabase-state", JSON.stringify(state));
    scheduleCloudPush();
  }
  const filter = $("calFilter")?.value || "all";
  const query = $("calSearch")?.value?.toLowerCase() || "";
  const events = filterCalendarEvents(cal.calendar_events, filter, query);
  renderCalendarDashboard(cal);
  renderCalendarBoard(events, cal);
  renderCalendarHistory(cal);
  document.querySelectorAll("[data-cal-view]").forEach(button => button.classList.toggle("active", button.dataset.calView === cal.settings.activeView));
}

function renderCalendarDashboard(cal) {
  const today = isoDate();
  const activeOrders = activeCalItems(cal.orders);
  const activeTasks = activeCalItems(cal.tasks);
  const activeDocs = activeCalItems(cal.documents);
  const cards = [
    ["Бүгінгі басты тапсырмалар", activeTasks.filter(t => t.dueDate <= today && t.status !== "done").length],
    ["Бүгінгі күнтізбе", activeCalItems(cal.calendar_events).filter(e => e.startDate === today).length],
    ["Жаңа клиент заказдары", activeOrders.filter(o => o.status === "client_order_received").length],
    ["Поставщикке заказ керек", activeOrders.filter(o => o.status === "need_to_order").length],
    ["Күтілетін жеткізілімдер", activeOrders.filter(o => o.expectedDeliveryDate === today).length],
    ["Келген заказдар", activeOrders.filter(o => o.status === "received").length],
    ["Кешіккен заказдар", activeOrders.filter(o => o.status === "overdue_delivery").length],
    ["Алдағы төлемдер", activeCalItems(cal.payments).filter(p => p.status !== "paid" && p.dueDate >= today).length],
    ["Клиент қарыздары", money(activeCalItems(cal.payments).filter(p => p.direction === "income" && p.status !== "paid").reduce((s, p) => s + Number(p.amount || 0), 0))],
    ["Поставщик қарыздары", money(activeCalItems(cal.payments).filter(p => p.direction === "expense" && p.status !== "paid").reduce((s, p) => s + Math.abs(Number(p.amount || 0)), 0))],
    ["ESF мерзімдері", activeDocs.filter(d => d.esfDeadline && d.esfStatus !== "sent").length],
    ["Әдет прогресі", `${activeCalItems(cal.habits).filter(h => h.status === "done").length}/${activeCalItems(cal.habits).length}`]
  ];
  $("calDashboard").innerHTML = cards.map(([label, value]) => `<article class="cal-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
}

function renderCalendarBoard(events, cal) {
  const view = cal.settings.activeView || "week";
  const groups = groupCalendarEvents(events, view);
  $("calBoard").innerHTML = Object.entries(groups).map(([label, rows]) => `
    <section class="cal-column">
      <h3>${escapeHtml(label)}</h3>
      ${rows.map(event => calendarEventCard(event)).join("") || `<article class="cal-empty">Жазба жоқ</article>`}
    </section>
  `).join("");
  $("calBoard").querySelectorAll("[data-cal-archive]").forEach(button => {
    button.addEventListener("click", () => archiveCalendarEntity("calendar_events", button.dataset.calArchive));
  });
}

function calendarEventCard(event) {
  const overdue = isPast(event.startDate) && !["done", "closed", "paid", "sent"].includes(event.status);
  return `
    <article class="cal-item ${overdue ? "overdue" : ""}">
      <div class="cal-item-top">
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(event.type)}</span>
      </div>
      <p>${escapeHtml(event.category)} · ${escapeHtml(event.startDate)} · ${escapeHtml(priorityLabel(event.priority))}</p>
      ${event.amount ? `<p>${money(event.amount)}</p>` : ""}
      <button type="button" data-cal-archive="${escapeHtml(event.id)}">Архивке жіберу</button>
    </article>
  `;
}

function renderCalendarHistory(cal) {
  $("calHistory").innerHTML = `
    <h3>Тарих журналы</h3>
    ${cal.history_logs.slice(0, 20).map(log => `<article><strong>${escapeHtml(log.action)}</strong> ${escapeHtml(log.entityType)} · ${escapeHtml(log.comment || "")}<span>${escapeHtml(log.createdAt)}</span></article>`).join("") || "<p>Тарих бос</p>"}
  `;
}

function filterCalendarEvents(events, filter, query) {
  return activeCalItems(events).filter(event => {
    const haystack = `${event.title} ${event.description} ${event.category} ${event.type} ${event.status} ${event.amount} ${event.startDate}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (filter === "today") return event.startDate === isoDate();
    if (filter === "tomorrow") return event.startDate === addDays(isoDate(), 1);
    if (filter === "week") return inNextDays(event.startDate, 7);
    if (filter === "month") return event.startDate?.slice(0, 7) === isoDate().slice(0, 7);
    if (filter === "overdue") return isPast(event.startDate) && !["done", "closed", "paid", "sent"].includes(event.status);
    if (filter === "open") return !["done", "closed", "paid", "sent"].includes(event.status);
    if (filter === "closed") return ["done", "closed", "paid", "sent"].includes(event.status);
    if (filter !== "all") return event.category === filter;
    return true;
  }).sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
}

function groupCalendarEvents(events, view) {
  if (view === "timeline") return { Таймлайн: events };
  const today = isoDate();
  if (view === "day") return { [today]: events.filter(e => e.startDate === today) };
  if (view === "month") {
    return events.reduce((groups, event) => {
      const key = event.startDate?.slice(0, 7) || "No date";
      groups[key] = groups[key] || [];
      groups[key].push(event);
      return groups;
    }, {});
  }
  const groups = {};
  for (let i = 0; i < 7; i += 1) groups[addDays(today, i)] = [];
  events.forEach(event => {
    const key = groups[event.startDate] ? event.startDate : (inNextDays(event.startDate, 7) ? event.startDate : "Кейін");
    groups[key] = groups[key] || [];
    groups[key].push(event);
  });
  return groups;
}

function updateCalendarAutomation() {
  const cal = calendarData();
  const today = isoDate();
  let changed = false;
  cal.orders.forEach(order => {
    if (!order.archivedAt && order.expectedDeliveryDate && order.expectedDeliveryDate < today && !order.receivedDate && order.status !== "overdue_delivery") {
      const old = { status: order.status };
      order.status = "overdue_delivery";
      order.updatedAt = nowIso();
      addCalendarEvent({ title: `Кешіккен заказ бойынша поставщикке хабарласу: ${order.title}`, type: "reminder", category: "Поставщиктер", startDate: today, relatedOrderId: order.id, relatedSupplierId: order.supplierId, priority: "high", status: "open" });
      logHistory("orders", order.id, "auto_overdue_delivery", old, { status: order.status }, "Күтілетін жеткізу күні өтті");
      changed = true;
    }
  });
  return changed;
}

function archiveCalendarEntity(table, id) {
  const cal = calendarData();
  const row = cal[table]?.find(item => item.id === id);
  if (!row) return;
  row.archivedAt = nowIso();
  row.updatedAt = nowIso();
  logHistory(table, id, "архив", null, row, "Өшіру орнына архивке жіберілді");
  persist();
  render();
}

function logHistory(entityType, entityId, action, oldValue, newValue, comment = "") {
  const cal = calendarData();
  cal.history_logs.unshift({
    id: crypto.randomUUID(),
    entityType,
    entityId: String(entityId || ""),
    action,
    oldValue: oldValue ? JSON.stringify(oldValue) : "",
    newValue: newValue ? JSON.stringify(newValue) : "",
    comment,
    createdAt: nowIso()
  });
}

function exportCalendarData(kind) {
  const cal = calendarData();
  if (kind === "backup") {
    downloadJson(`zhadyra_calendar_os_${isoDate()}.json`, cal);
    return;
  }
  const map = { orders: cal.orders, tasks: cal.tasks, payments: cal.payments, documents: cal.documents };
  const rows = activeCalItems(map[kind] || []);
  if (window.XLSX && rows.length) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), kind);
    XLSX.writeFile(wb, `zhadyra_${kind}_${isoDate()}.xlsx`);
  } else {
    downloadJson(`zhadyra_${kind}_${isoDate()}.json`, rows);
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildReportSummary() {
  const cal = calendarData();
  return {
    ordersToday: cal.orders.filter(o => o.clientOrderDate === isoDate()).length,
    ordersExpectedToday: cal.orders.filter(o => o.expectedDeliveryDate === isoDate()).length,
    delayedOrders: cal.orders.filter(o => o.status === "overdue_delivery").length,
    documentsCreated: cal.documents.filter(d => d.documentDate === isoDate()).length,
    esfDeadlines: cal.documents.filter(d => d.esfDeadline && d.esfStatus !== "sent").length,
    paymentsReceived: cal.payments.filter(p => p.paidDate === isoDate()).length,
    completedTasks: cal.tasks.filter(t => t.completedAt?.slice(0, 10) === isoDate()).length,
    uncompletedTasks: cal.tasks.filter(t => !t.completedAt && !t.archivedAt).length
  };
}

function sumPayments(direction) {
  return activeCalItems(calendarData().payments).filter(p => p.direction === direction && p.status === "paid").reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);
}

function sumDebts() {
  return activeCalItems(calendarData().payments).filter(p => p.status !== "paid").reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);
}

function activeCalItems(rows) {
  return (rows || []).filter(row => !row.archivedAt);
}

function detectDocumentType(value) {
  const text = value.toLowerCase();
  if (text.includes("realization") || text.includes("реал")) return "realization";
  if (text.includes("esf") || text.includes("эсф")) return "esf";
  if (text.includes("invoice") || text.includes("счет")) return "invoice";
  if (text.includes("naklad") || text.includes("наклад")) return "nakladnaya";
  if (text.includes("contract") || text.includes("договор")) return "contract";
  return "document";
}

function isoDate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return isoDate(value);
}

function isPast(date) {
  return date && date < isoDate();
}

function inNextDays(date, days) {
  return date >= isoDate() && date <= addDays(isoDate(), days);
}

function money(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} KZT`;
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
    "Екінші ми байланыстары:",
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
    calendarOS: state.calendarOS,
    notes: state.notes,
    goals: state.goals,
    projects: state.projects,
    plans: state.plans,
    challenges: state.challenges,
    oneC: state.oneC
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
    const incomingGoals = Array.isArray(data.goals) ? data.goals : [];
    const incomingProjects = Array.isArray(data.projects) ? data.projects : [];
    const incomingPlans = Array.isArray(data.plans) ? data.plans : [];
    const incomingChallenges = Array.isArray(data.challenges) ? data.challenges : [];
    if (data.oneC) state.oneC = normalizeOneC(data.oneC);
    if (data.calendarOS) mergeCalendarBackup(data.calendarOS);
    const existingDocKeys = new Set(state.docs.map(doc => doc.id || doc.name));
    const existingTaskKeys = new Set(state.tasks.map(task => task.id || task.title));
    const existingImageKeys = new Set(state.images.map(image => image.id || image.name));
    const existingNoteKeys = new Set(state.notes.map(note => note.id || `${note.title}:${note.createdAt}`));
    const existingGoalKeys = new Set(state.goals.map(item => item.id || item.title));
    const existingProjectKeys = new Set(state.projects.map(item => item.id || item.title));
    const existingPlanKeys = new Set(state.plans.map(item => item.id || item.title));
    const existingChallengeKeys = new Set(state.challenges.map(item => item.id || item.title));
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
    incomingGoals.forEach(goal => {
      const key = goal.id || goal.title;
      if (!existingGoalKeys.has(key)) {
        state.goals.unshift(normalizeGoal(goal));
        existingGoalKeys.add(key);
      }
    });
    incomingProjects.forEach(project => {
      const key = project.id || project.title;
      if (!existingProjectKeys.has(key)) {
        state.projects.unshift(normalizeProject(project));
        existingProjectKeys.add(key);
      }
    });
    incomingPlans.forEach(plan => {
      const key = plan.id || plan.title;
      if (!existingPlanKeys.has(key)) {
        state.plans.unshift(normalizePlan(plan));
        existingPlanKeys.add(key);
      }
    });
    incomingChallenges.forEach(challenge => {
      const key = challenge.id || challenge.title;
      if (!existingChallengeKeys.has(key)) {
        state.challenges.unshift(normalizeChallenge(challenge));
        existingChallengeKeys.add(key);
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
  const folder = $("brainImageFolder")?.value.trim() || "Суреттер";
  const tags = splitList($("brainImageTags")?.value || "");
  $("brainOut").textContent = "Суреттер Екінші ми ішіне сақталып жатыр...";
  try {
    for (const file of files) {
      state.images.unshift(await imageFileToBrainItem(file, folder, tags));
    }
    persist();
    render();
    $("brainOut").textContent = `${files.length} сурет Екінші ми / ${folder} папкасына сақталды.`;
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
    tags: [...new Set([folder, "сурет", ...tags, ...keywords(file.name).slice(0, 4)])],
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
    setCloudStatus("Бұлт қосу үшін Supabase URL және anon key енгізіңіз. Жұмыс кеңістігі кодын өзіңіз қоя аласыз.", false);
    return;
  }
  localStorage.setItem("sanabase-cloud", JSON.stringify(cloudConfig));
  renderCloudSettings();
  setCloudStatus("Бұлт қосылды. Енді Бұлтқа сақтау басыңыз немесе өзгерістер автоматты сақталады.", true);
}

function clearCloudSettings() {
  cloudConfig.url = "";
  cloudConfig.key = "";
  cloudConfig.workspace = "";
  localStorage.removeItem("sanabase-cloud");
  renderCloudSettings();
  setCloudStatus("Бұлт өшірілді. Құжаттар жергілікті режимде қалды.", false);
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
    setCloudStatus("Алдымен Supabase URL және anon key енгізіп, Бұлт қосу басыңыз.", false);
    return;
  }
  const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sanabase_cloud_${current.workspace}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  setCloudStatus("Бұлт баптауы жүктелді. Оны телефонда Бұлт баптауын енгізу арқылы қосуға болады.", true);
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
    setCloudStatus("Бұлт баптауы енгізілді. Енді Бұлттан алу немесе Бұлтқа сақтау басыңыз.", true);
  } catch (error) {
    setCloudStatus(`Бұлт баптауын оқу қатесі: ${shortError(error)}`, false);
  } finally {
    event.target.value = "";
  }
}

async function pushCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Бұлт қосылмаған: осы браузерде Supabase URL/anon key/жұмыс кеңістігі сақталмаған. Бұлт қосу немесе Бұлт баптауын енгізу қолданыңыз.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Бұлтқа сақталып жатыр...", true);
    const payload = {
      id: cloudRowId(),
      workspace_id: cloudConfig.workspace,
      payload: {
        docs: state.docs,
        tasks: state.tasks,
        images: state.images,
        calendarOS: state.calendarOS,
        notes: state.notes,
        goals: state.goals,
        projects: state.projects,
        plans: state.plans,
        challenges: state.challenges,
        oneC: state.oneC,
        savedAt: new Date().toISOString(),
        version: 7
      },
      updated_at: new Date().toISOString()
    };
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?on_conflict=id`, {
      method: "POST",
      headers: cloudHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    setCloudStatus(`Бұлт сақталды: ${new Date().toLocaleString()}`, true);
  } catch (error) {
    setCloudStatus(`Бұлт сақтау қатесі: ${shortError(error)}`, false);
  }
}

async function pullCloud(showStatus = false) {
  if (!cloudReady()) {
    if (showStatus) setCloudStatus("Бұлт қосылмаған: осы браузерде Supabase URL/anon key/жұмыс кеңістігі сақталмаған. Бұлт қосу немесе Бұлт баптауын енгізу қолданыңыз.", false);
    return;
  }
  try {
    if (showStatus) setCloudStatus("Бұлттан оқылып жатыр...", true);
    const response = await fetch(`${cloudConfig.url}/rest/v1/sanabase_brain?id=eq.${encodeURIComponent(cloudRowId())}&select=payload,updated_at`, {
      headers: cloudHeaders()
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (!rows.length) {
      setCloudStatus("Бұлтта бұл жұмыс кеңістігі үшін база әлі жоқ. Алдымен Бұлтқа сақтау басыңыз.", false);
      return;
    }
    const payload = rows[0].payload || {};
    state.docs = Array.isArray(payload.docs) ? payload.docs.map(normalizeDoc) : [];
    state.tasks = Array.isArray(payload.tasks) ? payload.tasks.map(normalizeTask) : [];
    state.images = Array.isArray(payload.images) ? payload.images.map(normalizeImage) : [];
    state.calendarOS = normalizeCalendarOS(payload.calendarOS || defaultCalendarOS());
    state.notes = Array.isArray(payload.notes) ? payload.notes.map(normalizeNote) : [];
    state.goals = Array.isArray(payload.goals) ? payload.goals.map(normalizeGoal) : [];
    state.projects = Array.isArray(payload.projects) ? payload.projects.map(normalizeProject) : [];
    state.plans = Array.isArray(payload.plans) ? payload.plans.map(normalizePlan) : [];
    state.challenges = Array.isArray(payload.challenges) ? payload.challenges.map(normalizeChallenge) : [];
    state.oneC = normalizeOneC(payload.oneC || {});
    persist({ sync: false });
    render();
    setCloudStatus(`Бұлттан алынды: ${rows[0].updated_at || "дайын"}`, true);
  } catch (error) {
    setCloudStatus(`Бұлт оқу қатесі: ${shortError(error)}`, false);
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
  $("cloudBadge").textContent = cloudReady() ? "Бұлт" : "Жергілікті";
  setCloudStatus(cloudReady() ? `Бұлт автоматты дайын: ${cloudConfig.workspace}. Өзгерістер сақталады.` : "Бұлт уақытша дайын емес. Бетті жаңартып көріңіз немесе Бұлттан алу басыңыз.", cloudReady());
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
  if (assistantMode === "owner") return ownerBriefing(context);
  if (assistantMode === "b2b") return b2bBriefing(context);
  if (assistantMode === "finance") return financeBriefing(context);
  if (assistantMode === "focus") return focusBriefing(context);
  if (assistantMode === "action") return actionPlanAnswer(prompt, sentences.length ? sentences : [context.slice(0, 1200)]);
  if (!sentences.length) return "Бұл сұраққа нақты сәйкес жол табылмады. Базаңыздан ең маңызды үзінді:\n\n" + context.slice(0, 1200) + nextStepBlock();
  if (assistantMode === "brief") return sentences.slice(0, 3).join("\n\n");
  return "База бойынша қысқа жауап:\n\n" + sentences.join("\n\n") + nextStepBlock();
}

function assistantInstruction(mode) {
  const base = "Жауапты қазақша бер. Құжат, CRM, тапсырмалар және жазбалар контекстіне сүйен. Нақты дерек жоқ болса, соны айт.";
  const modes = {
    brief: "Өте қысқа жауап бер: максимум 5 bullet.",
    action: "Жауапты міндетті түрде: Қорытынды, Нақты әрекеттер, Тәуекел, Келесі қадам форматында бер.",
    crm: "CRM аналитик сияқты жауап бер: клиент, табыс, pipeline, тәуекел, келесі әрекет.",
    tasks: "Құжаттан орындалатын тапсырмаларды шығар: атауы, маңыздылығы, мерзімі бар болса көрсет.",
    owner: "Екі бизнес иесінің операционный директоры сияқты жауап бер: электр дүкені, B2B клиент, ақша, қарыз, заказ, поставщик, құжат, ESF және бүгінгі 3 фокус бойынша нақты айт.",
    b2b: "B2B сату жетекшісі сияқты жауап бер: клиент сегменті, follow-up, коммерциялық ұсыныс, төлем сұрау, повторная продажа және келесі байланыс күнін шығар.",
    finance: "Қаржы бақылаушысы сияқты жауап бер: қарыз, төлем мерзімі, кешіккен сумма, ESF, счет, поставщик төлемі және қауіп деңгейін шығар.",
    focus: "Фокус коуч сияқты жауап бер: бүгін міндетті 3 әрекет, ертеңге қалатын нәрсе, 15 минутта басталатын бірінші қадам."
  };
  return `${base} ${modes[mode] || "Пайдаланушыға ең пайдалы форматты таңда."}`;
}

function emptyAssistantAnswer(mode) {
  const base = "Әзірге база бос. PDF/Word/Excel/CSV жүктесеңіз, мен соның ішінен жауап беремін.";
  if (mode === "tasks") return `${base}\n\nҚосуға болатын нәрсе: құжаттан автоматты тапсырма шығару, мерзім табу, жауапты адамды белгілеу.`;
  if (mode === "crm") return `${base}\n\nCRM үшін Excel/CSV жүктеңіз: мен клиенттерді, сатылым сомасын, тәуекелді және келесі әрекет тапсырмаларын шығарамын.`;
  if (mode === "owner") return `${base}\n\nИесінің штабы үшін: құжат, CRM, заказ, төлем, қарыз, мақсат және бүгінгі фокус деректерін жүктеңіз.`;
  if (mode === "b2b") return `${base}\n\nB2B үшін: клиенттер, заказдар, коммерциялық ұсыныстар және төлем файлдарын жүктеңіз.`;
  if (mode === "finance") return `${base}\n\nҚаржы бақылауы үшін: төлем, қарыз, счет, ESF және поставщик деректерін жүктеңіз.`;
  if (mode === "focus") return `${base}\n\nФокус үшін: мақсат, жоспар, task немесе бүгінгі ойларыңызды енгізіңіз.`;
  return `${base}\n\nМен қазір мынаны істей аламын: құжат оқу, прайс салыстыру, CRM талдау, тапсырма жасау, тест/аударма, Екінші ми ішінен іздеу.`;
}

function actionPlanAnswer(prompt, facts) {
  return [
    "Қорытынды:",
    facts.slice(0, 2).join("\n\n"),
    "",
    "Нақты әрекеттер:",
    "1. Ең маңызды жолдарды тексеріңіз.",
    "2. Қажет болса Тапсырмалар батырмасымен келесі әрекет жасаңыз.",
    "3. Егер бұл прайс болса, Прайс салыстыру арқылы код бойынша толықтырыңыз.",
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
    ...lines.slice(0, 5).map((line, index) => `${index + 1}. ${line.slice(0, 140)}\n   Маңыздылық: ${/(urgent|қате|ошибка|долг|төлем|risk|тәуекел)/i.test(line) ? "Жоғары" : "Орташа"}\n   Статус: Істеу`),
    "",
    "Кеңес: осы жауапты бірден Тапсырмалар тақтасына қосу үшін `Соңғы жауаптан тапсырма` батырмасын басыңыз."
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
    "Егер екі прайсты код бойынша толықтыру керек болса, Прайс салыстыру бөлімін қолданыңыз."
  ].join("\n");
}

function ownerBriefing(context) {
  const cal = calendarData();
  const today = isoDate();
  const openTasks = state.tasks.filter(task => task.status !== "done");
  const overdueTasks = openTasks.filter(task => task.due && task.due < today);
  const openOrders = activeCalItems(cal.orders).filter(order => !["closed", "received"].includes(order.status));
  const unpaid = activeCalItems(cal.payments).filter(payment => payment.status !== "paid");
  return [
    "Иесінің штабы:",
    `- Ашық тапсырма: ${openTasks.length}, кешіккені: ${overdueTasks.length}`,
    `- Ашық заказ: ${openOrders.length}`,
    `- Бақылаудағы төлем/қарыз: ${unpaid.length}`,
    `- Құжат/ESF бақылау: ${activeCalItems(cal.documents).filter(doc => doc.esfDeadline && doc.esfStatus !== "sent").length}`,
    "",
    "Бүгінгі 3 фокус:",
    "1. Ақша: төлемі кешіккен клиент пен поставщик міндеттемесін тексеру.",
    "2. Продажа: B2B клиенттерге follow-up және коммерциялық ұсыныс жіберу.",
    "3. Операция: заказ, остаток, код/баға сәйкестігін тексеру.",
    "",
    "Келесі әрекет:",
    extractActionLines(context).slice(0, 5).map((line, index) => `${index + 1}. ${line}`).join("\n") || "1. CRM/заказ/төлем құжатын жүктеп, қайта аудит жасаңыз."
  ].join("\n");
}

function b2bBriefing(context) {
  const clientLines = context.split(/\n+/).filter(line => /клиент|client|заказ|ұсыныс|счет|төлем|payment/i.test(line)).slice(0, 8);
  return [
    "B2B сату штабы:",
    "- Клиенттерді A/B/C деп бөліңіз: тұрақты, жылы лид, ұйықтап жатқан клиент.",
    "- Әр клиентке келесі байланыс күні керек.",
    "- Коммерциялық ұсыныс жіберілгеннен кейін 1-2 күнде follow-up жасаңыз.",
    "",
    "Бүгінгі follow-up:",
    ...(clientLines.length ? clientLines.map((line, index) => `${index + 1}. ${line.slice(0, 160)}`) : ["1. Бүгін төлем/заказ/ұсыныс күтіп тұрған клиенттер тізімін жүктеңіз."]),
    "",
    "Сату мүмкіндігі:",
    "- Электр тауарларында комплектпен сату: кабель + автомат + щит + розетка + расходник."
  ].join("\n");
}

function financeBriefing(context) {
  const cal = calendarData();
  const unpaid = activeCalItems(cal.payments).filter(payment => payment.status !== "paid");
  const total = unpaid.reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0);
  const docs = activeCalItems(cal.documents).filter(doc => doc.esfDeadline && doc.esfStatus !== "sent");
  return [
    "Қаржы / қарыз бақылауы:",
    `- Ашық төлем саны: ${unpaid.length}`,
    `- Шамамен қарыз/төлем сомасы: ${Math.round(total).toLocaleString("kk-KZ")} ₸`,
    `- ESF/құжат бақылауы: ${docs.length}`,
    "",
    "Қауіптер:",
    "- Мерзімі өткен төлем клиентпен қатынасты да, cashflow-ды да тежейді.",
    "- ESF мерзімі өтіп кетсе, құжаттық проблема шығады.",
    "- Поставщикке төлем кешіксе, келесі поставка тоқтауы мүмкін.",
    "",
    "Бүгін істеу:",
    "1. Ең үлкен 3 қарызды сұрау.",
    "2. ESF мерзімі жақын құжаттарды тексеру.",
    "3. Поставщик төлемін және клиенттен күтілетін ақшаны салыстыру."
  ].join("\n");
}

function focusBriefing(context) {
  const today = isoDate();
  const tasks = state.tasks.filter(task => task.status !== "done" && (!task.due || task.due <= today)).slice(0, 5);
  const plans = state.plans.filter(plan => plan.status !== "done" && plan.date <= today).slice(0, 3);
  return [
    "Фокус режимі:",
    "",
    "Бүгін міндетті 3 әрекет:",
    ...(tasks.length ? tasks.slice(0, 3).map((task, index) => `${index + 1}. ${task.title}`) : ["1. CRM/заказ/төлем бойынша ең маңызды бір істі таңдаңыз.", "2. Бір B2B клиентке хабарласыңыз.", "3. Бір құжат/төлемді реттеңіз."]),
    "",
    "Жоспардан:",
    ...(plans.length ? plans.map(plan => `- ${plan.title}: ${planProgress(plan).percent}%`) : ["- Бүгінгі жоспар әлі жоқ. Соңғы жауаптан “Жоспар” батырмасын басып қосуға болады."]),
    "",
    "Ертеңге қалдыруға болады:",
    "- Маңызсыз, ақшаға/клиентке/мерзімге әсер етпейтін ұсақ жұмыстар.",
    "",
    "15 минуттық старт:",
    extractActionLines(context)[0] || "Бір клиент/бір төлем/бір заказды ашып, нақты статусын белгілеңіз."
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

function normalizeGoal(goal) {
  return {
    id: goal.id || crypto.randomUUID(),
    title: goal.title || "Мақсат",
    description: goal.description || "",
    category: goal.category || "Жеке даму",
    status: ["planned", "active", "done", "paused"].includes(goal.status) ? goal.status : "active",
    startDate: goal.startDate || "",
    endDate: goal.endDate || "",
    stages: Array.isArray(goal.stages) ? goal.stages.map(normalizeGoalStage) : [],
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: goal.updatedAt || goal.createdAt || new Date().toISOString()
  };
}

function normalizeGoalStage(stage) {
  const done = Boolean(stage.done || stage.status === "done");
  return {
    id: stage.id || crypto.randomUUID(),
    title: stage.title || "Этап",
    description: stage.description || "",
    deadline: stage.deadline || "",
    status: done ? "done" : (["todo", "doing"].includes(stage.status) ? stage.status : "todo"),
    done
  };
}

function normalizeProject(project) {
  return {
    id: project.id || crypto.randomUUID(),
    title: project.title || "Проект",
    goal: project.goal || "",
    category: project.category || "Бизнес",
    priority: ["low", "medium", "high", "critical"].includes(project.priority) ? project.priority : "medium",
    status: ["idea", "planned", "active", "review", "done"].includes(project.status) ? project.status : "active",
    startDate: project.startDate || "",
    endDate: project.endDate || "",
    modules: Array.isArray(project.modules) ? project.modules.map(module => ({ id: module.id || crypto.randomUUID(), title: module.title || "Бөлім" })) : [],
    tasks: Array.isArray(project.tasks) ? project.tasks.map(normalizeProjectTask) : [],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || project.createdAt || new Date().toISOString()
  };
}

function normalizeProjectTask(task) {
  const done = Boolean(task.done || task.status === "done");
  return {
    id: task.id || crypto.randomUUID(),
    title: task.title || "Тапсырма",
    description: task.description || "",
    status: done ? "done" : (["todo", "doing"].includes(task.status) ? task.status : "todo"),
    done,
    deadline: task.deadline || "",
    owner: task.owner || ""
  };
}

function normalizePlan(plan) {
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  return {
    id: plan.id || crypto.randomUUID(),
    title: plan.title || "Жоспар",
    type: ["daily", "weekly", "monthly", "yearly"].includes(plan.type) ? plan.type : "daily",
    category: plan.category || "Бизнес",
    date: plan.date || isoDate(),
    goalTitle: plan.goalTitle || "",
    projectTitle: plan.projectTitle || "",
    focus: plan.focus || "",
    status: ["planned", "today", "done", "late"].includes(plan.status) ? plan.status : "planned",
    tasks: tasks.map(item => ({ id: item.id || crypto.randomUUID(), title: item.title || "Тапсырма", done: Boolean(item.done) })),
    createdAt: plan.createdAt || new Date().toISOString(),
    updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString()
  };
}

function normalizeChallenge(challenge) {
  const totalDays = Math.max(1, Number(challenge.totalDays || 30));
  const startDate = challenge.startDate || isoDate();
  return {
    id: challenge.id || crypto.randomUUID(),
    title: challenge.title || "Челлендж",
    description: challenge.description || "",
    totalDays,
    startDate,
    endDate: challenge.endDate || addDays(startDate, totalDays - 1),
    doneDates: Array.isArray(challenge.doneDates) ? [...new Set(challenge.doneDates)].sort() : [],
    missedDates: Array.isArray(challenge.missedDates) ? [...new Set(challenge.missedDates)].sort() : [],
    createdAt: challenge.createdAt || new Date().toISOString(),
    updatedAt: challenge.updatedAt || challenge.createdAt || new Date().toISOString()
  };
}

function normalizeOneC(data = {}) {
  return {
    fileName: data.fileName || "",
    importedAt: data.importedAt || "",
    kind: data.kind || "auto",
    headers: Array.isArray(data.headers) ? data.headers : [],
    rows: Array.isArray(data.rows) ? data.rows : [],
    summary: data.summary || {},
    text: data.text || ""
  };
}

function normalizeImage(image) {
  const folder = image.folder || "Суреттер";
  return {
    id: image.id || crypto.randomUUID(),
    name: image.name || "Сурет",
    type: image.type || "image",
    src: image.src || "",
    folder,
    text: image.text || `Сурет: ${image.name || "Сурет"} (${folder})`,
    warning: image.warning || "",
    tags: Array.isArray(image.tags) && image.tags.length ? image.tags : [folder, "сурет"],
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
    folder: note.folder || "Жалпы",
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
    folder: note.folder || "Жалпы",
    text: note.body || "",
    warning: "",
    tags: [...new Set([note.folder || "Жалпы", note.type || "жазба", ...(note.tags || [])])],
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
  return [...new Set(state.notes.map(note => note.folder || "Жалпы"))].sort((a, b) => a.localeCompare(b));
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
    .map(doc => `Құжат: ${doc.name}\nТегтер: ${(doc.tags || []).join(", ")}\nБайланыстар: ${(doc.links || []).join(", ")}\n${doc.text.slice(0, 12000)}`);
  const notes = state.notes
    .slice(0, 10)
    .map(note => `Жазба: ${note.title}\nПапка: ${note.folder || "Жалпы"}\nТүрі: ${note.type || "қысқа"}\nТегтер: ${(note.tags || []).join(", ")}\n${note.body}`);
  const tasks = state.tasks
    .slice(0, 30)
    .map(task => `Тапсырма: ${task.title}\nСтатус: ${task.status}\nМаңыздылық: ${task.priority}\nМерзім: ${task.due || "-"}\nЖауапты: ${task.owner || "-"}\n${task.body}`);
  const images = state.images
    .slice(0, 30)
    .map(image => `Сурет: ${image.name}\nПапка: ${image.folder || "Суреттер"}\nТегтер: ${(image.tags || []).join(", ")}`);
  const goals = state.goals
    .slice(0, 20)
    .map(goal => `Мақсат: ${goal.title}\nКатегория: ${goal.category}\nСтатус: ${goalStatusLabel(goal.status)}\nДедлайн: ${goal.endDate || "-"}\nПрогресс: ${goalProgress(goal).percent}%\n${goal.description}`);
  const projects = state.projects
    .slice(0, 20)
    .map(project => `Проект: ${project.title}\nСтатус: ${projectStatusLabel(project.status)}\nПриоритет: ${goalPriorityLabel(project.priority)}\nДедлайн: ${project.endDate || "-"}\nПрогресс: ${projectProgress(project).percent}%\n${project.goal}`);
  const plans = state.plans
    .slice(0, 20)
    .map(plan => `Жоспар: ${plan.title}\nТүрі: ${planTypeLabel(plan.type)}\nКүні: ${plan.date}\nКатегория: ${plan.category}\nПрогресс: ${planProgress(plan).percent}%\nФокус: ${plan.focus}`);
  const challenges = state.challenges
    .slice(0, 20)
    .map(challenge => `Челлендж: ${challenge.title}\nКүн: ${challengeProgress(challenge).done}/${challenge.totalDays}\nПрогресс: ${challengeProgress(challenge).percent}%\nStreak: ${challengeProgress(challenge).streak}\n${challenge.description}`);
  const oneC = state.oneC?.text ? [`1С Excel:\n${state.oneC.text}`] : [];
  return docs.concat(images, tasks, notes, goals, projects, plans, challenges, oneC).join("\n\n---\n\n");
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
  if (!Array.isArray(state.goals)) state.goals = [];
  if (!Array.isArray(state.projects)) state.projects = [];
  if (!Array.isArray(state.plans)) state.plans = [];
  if (!Array.isArray(state.challenges)) state.challenges = [];
  state.oneC = normalizeOneC(state.oneC || {});
  if (!state.calendarOS) state.calendarOS = defaultCalendarOS();
  if ($("docCount")) $("docCount").textContent = `${state.docs.length} құжат`;
  state.notes = state.notes.map(normalizeNote);
  if ($("imageCount")) $("imageCount").textContent = `${state.images.length} сурет`;
  if ($("noteCount")) $("noteCount").textContent = `${state.notes.length} жазба`;
  if ($("taskCount")) $("taskCount").textContent = `${state.tasks.length} тапсырма`;
  state.docs = state.docs.map(normalizeDoc);
  state.images = state.images.map(normalizeImage);
  state.tasks = state.tasks.map(normalizeTask);
  state.goals = state.goals.map(normalizeGoal);
  state.projects = state.projects.map(normalizeProject);
  state.plans = state.plans.map(normalizePlan);
  state.challenges = state.challenges.map(normalizeChallenge);
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
  renderCalendarOS();
  renderGoals();
  renderCrmWorkspace();
  renderOneC();
  renderAssistantDashboard();
  renderCloudSettings();
}

function renderOneC() {
  if (!$("onecDashboard")) return;
  const summary = state.oneC?.summary || {};
  $("onecDashboard").innerHTML = [
    ["Жол", summary.totalRows || 0],
    ["Тауар", summary.products || 0],
    ["Клиент", summary.clients || 0],
    ["Қалдық аз", summary.lowStock || 0],
    ["Қарыз", `${Math.round(summary.debtTotal || 0).toLocaleString("kk-KZ")} ₸`],
    ["Құжат", summary.documents || 0]
  ].map(([label, value]) => `<article class="crm-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");
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
          <span>${escapeHtml(note.folder || "Жалпы")} · ${escapeHtml(noteTypeLabel(note.type))}</span>
        </div>
        <div class="note-actions">
          <button type="button" data-note-brain="${escapeHtml(note.id)}">${note.brain ? "Екінші мида" : "Екінші миға"}</button>
          <button type="button" data-note-delete="${escapeHtml(note.id)}">Өшіру</button>
        </div>
      </div>
      <p>${escapeHtml(note.body)}</p>
      <div class="tag-row">${(note.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || `<span class="tag muted-tag">тег жоқ</span>`}</div>
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
  board.querySelectorAll("[data-task-tomorrow]").forEach(button => {
    button.addEventListener("click", () => postponeTaskTomorrow(button.dataset.taskTomorrow));
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
        ${task.due ? `<span>Мерзім: ${escapeHtml(task.due)}</span>` : ""}
        ${task.owner ? `<span>Жауапты: ${escapeHtml(task.owner)}</span>` : ""}
        ${task.link ? `<span>Байланыс: ${escapeHtml(task.link)}</span>` : ""}
      </div>
      <div class="task-actions">
        ${moves.map(([status, label]) => `<button type="button" data-task-move="${escapeHtml(task.id)}" data-status="${status}">${label}</button>`).join("")}
        <button type="button" data-task-tomorrow="${escapeHtml(task.id)}">Ертеңге</button>
        <button type="button" data-task-delete="${escapeHtml(task.id)}">Өшіру</button>
      </div>
    </article>
  `;
}

function priorityLabel(priority) {
  return { low: "Төмен", medium: "Орташа", high: "Жоғары" }[priority] || "Орташа";
}

function renderGoals() {
  if (!$("goalDashboard")) return;
  const query = $("goalSearch")?.value?.toLowerCase() || "";
  const filter = $("goalFilter")?.value || "all";
  const goals = state.goals.filter(item => passGoalFilter(item, "goal", query, filter));
  const projects = state.projects.filter(item => passGoalFilter(item, "project", query, filter));
  const plans = state.plans.filter(item => passGoalFilter(item, "plan", query, filter));
  const challenges = state.challenges.filter(item => passGoalFilter(item, "challenge", query, filter));
  renderGoalDashboard();
  $("goalList").innerHTML = goals.map(goalCard).join("") || emptyGoalCard("Мақсат жоқ", "Үлкен нәтижені этаптарға бөліп қосыңыз.");
  $("projectList").innerHTML = projects.map(projectCard).join("") || emptyGoalCard("Проект жоқ", "Жоба бөлімдері мен тапсырмаларын қосыңыз.");
  if ($("planList")) $("planList").innerHTML = plans.map(planCard).join("") || emptyGoalCard("Жоспар жоқ", "Күндік/апталық жоспар қосыңыз.");
  $("challengeList").innerHTML = challenges.map(challengeCard).join("") || emptyGoalCard("Челлендж жоқ", "Күн сайын орындалатын әдет қосыңыз.");
  $("goals").querySelectorAll("[data-goal-stage]").forEach(button => {
    button.addEventListener("change", () => toggleGoalStage(button.dataset.goalId, button.dataset.goalStage));
  });
  $("goals").querySelectorAll("[data-project-task]").forEach(button => {
    button.addEventListener("change", () => toggleProjectTask(button.dataset.projectId, button.dataset.projectTask));
  });
  $("goals").querySelectorAll("[data-plan-task]").forEach(button => {
    button.addEventListener("change", () => togglePlanTask(button.dataset.planId, button.dataset.planTask));
  });
  $("goals").querySelectorAll("[data-challenge-today]").forEach(button => {
    button.addEventListener("click", () => markChallengeToday(button.dataset.challengeToday));
  });
  $("goals").querySelectorAll("[data-challenge-missed]").forEach(button => {
    button.addEventListener("click", () => markChallengeMissedToday(button.dataset.challengeMissed));
  });
  $("goals").querySelectorAll("[data-goal-delete]").forEach(button => {
    button.addEventListener("click", () => deleteGoalItem(button.dataset.goalType, button.dataset.goalDelete));
  });
}

function renderGoalDashboard() {
  const activeGoals = state.goals.filter(item => item.status !== "done").length;
  const activeProjects = state.projects.filter(item => item.status !== "done").length;
  const activePlans = state.plans.filter(item => item.status !== "done").length;
  const activeChallenges = state.challenges.filter(item => challengeProgress(item).percent < 100).length;
  const todayTasks = state.tasks.filter(task => task.status !== "done" && (task.due || isoDate()) <= isoDate()).length;
  const progresses = [
    ...state.goals.map(goalProgress),
    ...state.projects.map(projectProgress),
    ...state.plans.map(planProgress),
    ...state.challenges.map(challengeProgress)
  ];
  const average = progresses.length ? Math.round(progresses.reduce((sum, item) => sum + item.percent, 0) / progresses.length) : 0;
  const today = isoDate();
  const dueToday = [
    ...state.goals.filter(item => item.endDate === today),
    ...state.projects.filter(item => item.endDate === today),
    ...state.plans.filter(item => item.date === today),
    ...state.challenges.filter(item => item.endDate === today)
  ].length;
  const overdue = [
    ...state.goals.filter(item => isGoalOverdue(item)),
    ...state.projects.filter(item => isGoalOverdue(item)),
    ...state.plans.filter(item => item.date < today && item.status !== "done"),
    ...state.tasks.filter(task => task.due && task.due < today && task.status !== "done"),
    ...state.challenges.filter(item => item.endDate < today && challengeProgress(item).percent < 100)
  ].length;
  $("goalDashboard").innerHTML = [
    ["Белсенді мақсат", activeGoals],
    ["Белсенді проект", activeProjects],
    ["Жоспарлар", activePlans],
    ["Бүгінгі task", todayTasks],
    ["Әдет/челлендж", activeChallenges],
    ["Орташа прогресс", `${average}%`],
    ["Кешіккен", overdue]
  ].map(([label, value]) => `<article class="goal-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function passGoalFilter(item, type, query, filter) {
  const text = JSON.stringify(item).toLowerCase();
  if (query && !text.includes(query)) return false;
  if (filter === "all") return true;
  if (["Бизнес", "Қаржы", "Денсаулық", "Оқу", "Отбасы", "Даму", "Үй", "Дін", "Басқа"].includes(filter)) return item.category === filter;
  if (filter === "today") return type === "plan" ? item.date === isoDate() : type === "task" ? item.due === isoDate() : false;
  if (filter === "active") return type === "challenge" ? challengeProgress(item).percent < 100 : item.status !== "done";
  if (filter === "done") return type === "challenge" ? challengeProgress(item).percent >= 100 : item.status === "done";
  if (filter === "overdue") return type === "challenge" ? item.endDate < isoDate() && challengeProgress(item).percent < 100 : type === "plan" ? item.date < isoDate() && item.status !== "done" : isGoalOverdue(item);
  if (filter === "high") return item.priority === "high" || item.priority === "critical";
  return true;
}

function goalCard(goal) {
  const progress = goalProgress(goal);
  return `
    <article class="goal-card ${isGoalOverdue(goal) ? "is-overdue" : ""}">
      <div class="goal-card-head">
        <div><h4>${escapeHtml(goal.title)}</h4><span>${escapeHtml(goal.category)} · ${escapeHtml(goalStatusLabel(goal.status))}</span></div>
        <button type="button" data-goal-delete="${escapeHtml(goal.id)}" data-goal-type="goal">Өшіру</button>
      </div>
      <p>${escapeHtml(goal.description || "Сипаттама жоқ")}</p>
      ${progressBar(progress.percent)}
      <div class="goal-meta"><span>${progress.percent}% орындалды</span><span>${progress.remaining} этап қалды</span>${goal.endDate ? `<span>Дедлайн: ${escapeHtml(goal.endDate)}</span>` : ""}</div>
      <div class="goal-checks">
        ${goal.stages.map(stage => `<label><input type="checkbox" data-goal-id="${escapeHtml(goal.id)}" data-goal-stage="${escapeHtml(stage.id)}" ${stage.done ? "checked" : ""}> <span>${escapeHtml(stage.title)}</span></label>`).join("") || `<span class="muted-tag">Этап жоқ</span>`}
      </div>
    </article>
  `;
}

function projectCard(project) {
  const progress = projectProgress(project);
  return `
    <article class="goal-card priority-${escapeHtml(project.priority)} ${isGoalOverdue(project) ? "is-overdue" : ""}">
      <div class="goal-card-head">
        <div><h4>${escapeHtml(project.title)}</h4><span>${escapeHtml(projectStatusLabel(project.status))} · ${escapeHtml(goalPriorityLabel(project.priority))}</span></div>
        <button type="button" data-goal-delete="${escapeHtml(project.id)}" data-goal-type="project">Өшіру</button>
      </div>
      <p>${escapeHtml(project.goal || "Проект мақсаты жазылмаған")}</p>
      ${progressBar(progress.percent)}
      <div class="goal-meta"><span>${progress.percent}%</span><span>${progress.done}/${progress.total} тапсырма</span>${project.endDate ? `<span>Дедлайн: ${escapeHtml(project.endDate)}</span>` : ""}</div>
      <div class="module-row">${project.modules.map(module => `<span>${escapeHtml(module.title)}</span>`).join("") || `<span>Бөлім жоқ</span>`}</div>
      <div class="goal-checks">
        ${project.tasks.map(task => `<label><input type="checkbox" data-project-id="${escapeHtml(project.id)}" data-project-task="${escapeHtml(task.id)}" ${task.done ? "checked" : ""}> <span>${escapeHtml(task.title)}</span></label>`).join("") || `<span class="muted-tag">Тапсырма жоқ</span>`}
      </div>
    </article>
  `;
}

function planCard(plan) {
  const progress = planProgress(plan);
  return `
    <article class="goal-card plan-card ${plan.status === "late" ? "is-overdue" : ""}">
      <div class="goal-card-head">
        <div><h4>${escapeHtml(plan.title)}</h4><span>${escapeHtml(planTypeLabel(plan.type))} · ${escapeHtml(plan.category)} · ${escapeHtml(planStatusLabel(plan.status))}</span></div>
        <button type="button" data-goal-delete="${escapeHtml(plan.id)}" data-goal-type="plan">Өшіру</button>
      </div>
      <p>${escapeHtml(plan.focus || "Фокус жазылмаған")}</p>
      ${progressBar(progress.percent)}
      <div class="goal-meta"><span>${progress.percent}%</span><span>${progress.done}/${progress.total} тапсырма</span><span>${escapeHtml(plan.date)}</span></div>
      <div class="module-row">
        ${plan.goalTitle ? `<span>Мақсат: ${escapeHtml(plan.goalTitle)}</span>` : ""}
        ${plan.projectTitle ? `<span>Проект: ${escapeHtml(plan.projectTitle)}</span>` : ""}
      </div>
      <div class="goal-checks">
        ${plan.tasks.map(task => `<label><input type="checkbox" data-plan-id="${escapeHtml(plan.id)}" data-plan-task="${escapeHtml(task.id)}" ${task.done ? "checked" : ""}> <span>${escapeHtml(task.title)}</span></label>`).join("") || `<span class="muted-tag">Жоспар тапсырмасы жоқ</span>`}
      </div>
    </article>
  `;
}

function challengeCard(challenge) {
  const progress = challengeProgress(challenge);
  const doneToday = challenge.doneDates.includes(isoDate());
  const missedToday = (challenge.missedDates || []).includes(isoDate());
  return `
    <article class="goal-card challenge-card">
      <div class="goal-card-head">
        <div><h4>${escapeHtml(challenge.title)}</h4><span>${progress.done} күн орындалды · streak ${progress.streak}</span></div>
        <button type="button" data-goal-delete="${escapeHtml(challenge.id)}" data-goal-type="challenge">Өшіру</button>
      </div>
      <p>${escapeHtml(challenge.description || "Күн сайын белгілеуге арналған челлендж")}</p>
      ${progressBar(progress.percent)}
      <div class="goal-meta"><span>${progress.percent}%</span><span>${progress.remaining} күн қалды</span><span>${escapeHtml(challenge.startDate)} - ${escapeHtml(challenge.endDate)}</span></div>
      <button type="button" class="${doneToday ? "done-today" : ""}" data-challenge-today="${escapeHtml(challenge.id)}">${doneToday ? "Бүгін орындалды" : "Бүгін орындадым"}</button>
      <button type="button" class="missed-today ${missedToday ? "is-missed" : ""}" data-challenge-missed="${escapeHtml(challenge.id)}">${missedToday ? "Бүгін орындалмады" : "Бүгін орындалмады"}</button>
      <div class="challenge-days">${challengeDays(challenge).map(day => `<span class="${day.className}" title="${escapeHtml(day.date)}"></span>`).join("")}</div>
    </article>
  `;
}

function progressBar(percent) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  return `<div class="progress-bar"><span style="width:${safe}%"></span></div>`;
}

function emptyGoalCard(title, body) {
  return `<article class="goal-card empty-goal"><h4>${title}</h4><p>${body}</p></article>`;
}

function goalProgress(goal) {
  const total = goal.stages.length;
  const done = goal.stages.filter(stage => stage.done).length;
  return progressParts(done, total);
}

function projectProgress(project) {
  const total = project.tasks.length;
  const done = project.tasks.filter(task => task.done).length;
  return progressParts(done, total);
}

function planProgress(plan) {
  const total = plan.tasks.length;
  const done = plan.tasks.filter(task => task.done).length;
  return progressParts(done, total);
}

function challengeProgress(challenge) {
  const done = Math.min(challenge.doneDates.length, challenge.totalDays);
  return { ...progressParts(done, challenge.totalDays), streak: challengeStreak(challenge) };
}

function progressParts(done, total) {
  return { done, total, remaining: Math.max(0, total - done), percent: total ? Math.round((done / total) * 100) : 0 };
}

function challengeStreak(challenge) {
  const done = new Set(challenge.doneDates);
  let cursor = isoDate();
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function challengeDays(challenge) {
  const today = isoDate();
  const done = new Set(challenge.doneDates);
  const missed = new Set(challenge.missedDates || []);
  return Array.from({ length: Math.min(challenge.totalDays, 120) }, (_, index) => {
    const date = addDays(challenge.startDate, index);
    return {
      date,
      className: [done.has(date) ? "done" : missed.has(date) || date < today ? "missed" : "", date === today ? "today" : ""].filter(Boolean).join(" ")
    };
  });
}

function isGoalOverdue(item) {
  return item.endDate && item.endDate < isoDate() && item.status !== "done";
}

function goalStatusLabel(status) {
  return { planned: "Жоспарда", active: "Орындалып жатыр", done: "Аяқталды", paused: "Тоқтап тұр" }[status] || "Орындалып жатыр";
}

function projectStatusLabel(status) {
  return { idea: "Идея", planned: "Жоспарда", active: "Жасалып жатыр", review: "Тексеруде", done: "Аяқталды" }[status] || "Жасалып жатыр";
}

function goalPriorityLabel(priority) {
  return { low: "Төмен", medium: "Орта", high: "Жоғары", critical: "Өте маңызды" }[priority] || "Орта";
}

function planTypeLabel(type) {
  return { daily: "Күндік жоспар", weekly: "Апталық жоспар", monthly: "Айлық жоспар", yearly: "Жылдық жоспар" }[type] || "Жоспар";
}

function planStatusLabel(status) {
  return { planned: "Жоспарда", today: "Бүгін", done: "Орындалды", late: "Кешікті" }[status] || "Жоспарда";
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
    list.innerHTML = `<article class="brain-card"><h3>Екінші ми бос</h3><p>Жүктеу арқылы құжат/сурет жүктеңіз немесе Жазбалар ішінде маңызды жазбаны Екінші миға бекітіңіз.</p></article>`;
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
        <span class="brain-type">${escapeHtml(doc.brainKind === "note" ? `жазба / ${doc.folder || "Жалпы"}` : doc.brainKind === "image" ? `сурет / ${doc.folder || "Суреттер"}` : doc.type || "файл")}</span>
      </div>
      <div class="tag-row">${(doc.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || `<span class="tag muted-tag">тег жоқ</span>`}</div>
      ${doc.brainKind === "note" ? `<div class="related"><strong>Жазба папкасы:</strong><span>${escapeHtml(doc.folder || "Жалпы")}</span></div>` : ""}
      ${doc.brainKind === "image" ? `<div class="related"><strong>Сурет папкасы:</strong><span>${escapeHtml(doc.folder || "Суреттер")}</span></div>` : ""}
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
      ${doc.brainKind === "note" ? `<button type="button" data-note-unbrain="${escapeHtml(doc.noteId)}">Екінші мидан алу</button>` : ""}
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
    const savedGoals = JSON.parse(localStorage.getItem("goals") || localStorage.getItem("zhadyra_goals") || "null");
    const savedProjects = JSON.parse(localStorage.getItem("projects") || localStorage.getItem("zhadyra_projects") || "null");
    const savedPlans = JSON.parse(localStorage.getItem("zhadyra_plans") || "null");
    const savedChallenges = JSON.parse(localStorage.getItem("challenges") || localStorage.getItem("zhadyra_challenges") || "null");
    const savedOneC = JSON.parse(localStorage.getItem("zhadyra_1c_excel") || "null");
    return {
      docs: Array.isArray(saved.docs) ? saved.docs.map(normalizeDoc) : [],
      tasks: Array.isArray(saved.tasks) ? saved.tasks.map(normalizeTask) : [],
      images: Array.isArray(saved.images) ? saved.images.map(normalizeImage) : [],
      calendarOS: normalizeCalendarOS(saved.calendarOS || {}),
      notes: Array.isArray(saved.notes) ? saved.notes.map(normalizeNote) : [],
      goals: Array.isArray(saved.goals) ? saved.goals.map(normalizeGoal) : (Array.isArray(savedGoals) ? savedGoals.map(normalizeGoal) : []),
      projects: Array.isArray(saved.projects) ? saved.projects.map(normalizeProject) : (Array.isArray(savedProjects) ? savedProjects.map(normalizeProject) : []),
      plans: Array.isArray(saved.plans) ? saved.plans.map(normalizePlan) : (Array.isArray(savedPlans) ? savedPlans.map(normalizePlan) : []),
      challenges: Array.isArray(saved.challenges) ? saved.challenges.map(normalizeChallenge) : (Array.isArray(savedChallenges) ? savedChallenges.map(normalizeChallenge) : []),
      oneC: normalizeOneC(saved.oneC || savedOneC || {})
    };
  } catch {
    return { docs: [], tasks: [], images: [], calendarOS: defaultCalendarOS(), notes: [], goals: [], projects: [], plans: [], challenges: [], oneC: normalizeOneC({}) };
  }
}

function persist(options = {}) {
  localStorage.setItem("sanabase-state", JSON.stringify(state));
  localStorage.setItem("goals", JSON.stringify(state.goals || []));
  localStorage.setItem("projects", JSON.stringify(state.projects || []));
  localStorage.setItem("challenges", JSON.stringify(state.challenges || []));
  localStorage.setItem("zhadyra_goals", JSON.stringify(state.goals || []));
  localStorage.setItem("zhadyra_projects", JSON.stringify(state.projects || []));
  localStorage.setItem("zhadyra_plans", JSON.stringify(state.plans || []));
  localStorage.setItem("zhadyra_tasks", JSON.stringify(state.tasks || []));
  localStorage.setItem("zhadyra_habits", JSON.stringify(calendarData().habits || []));
  localStorage.setItem("zhadyra_challenges", JSON.stringify(state.challenges || []));
  localStorage.setItem("zhadyra_1c_excel", JSON.stringify(state.oneC || {}));
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

