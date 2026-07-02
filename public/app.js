const {
  isoDate,
  nowIso,
  addDays,
  isPast,
  inNextDays,
  money,
  escapeHtml,
  splitList,
  keywords
} = window.SanaUtils;
const {
  readJson: storageReadJson,
  writeJson: storageWriteJson
} = window.SanaStorage;
const {
  ai: requestAi,
  importFile: requestImportFile
} = window.SanaApi;
const {
  extractFile,
  serverImport,
  browserImport,
  readPdf,
  unsupported
} = window.SanaDocuments;
const {
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
} = window.SanaSpreadsheet;
const {
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
} = window.SanaPriceMatching;

const state = loadState();
const BACKUP_VERSION = "20260702-07";
const DEFAULT_CLOUD_CONFIG = {
  url: "https://koszjmsanlxdakqvdkgc.supabase.co",
  key: "sb_publishable_y7IIJav4n99Z1dbfROh3SA_TtlAn5tO",
  workspace: "sanabase-main-zsamahanskaa"
};
const cloudConfig = loadCloudConfig();
let cloudTimer = null;
let lastAssistantAnswer = "";
let lastMimoAnswer = "";
let lastMimoAction = "chat";
let sanaBotRoamTimer = null;
const titles = {
  chat: ["AI чат", "Құжаттарыңызға сүйеніп жауап береді."],
  library: ["Білім базасы", "PDF, Word, Excel және мәтін материалдары."],
  match: ["Прайс салыстыру", "Формуласы бар қорап/саны бағандарын өзгертпей, бағасын almat company price арқылы қояды."],
  onec: ["1С Excel байланыс", "1С-тен шыққан Excel/CSV арқылы товар, остаток, баға, клиент, қарыз және құжаттарды талдау."],
  calendaros: ["Жадыра күнтізбе жүйесі", "Клиент, заказ, поставщик, төлем, құжат, ESF, есеп және тарих бір календарь ішінде."],  cfo: ["Sana CFO / AI Бас Бухгалтер", "B2B мектептер, электр дүкені, ОУР режимі, қарыз, cash flow, P&L, склад, құжат, 1С және салық бақылауы."],
  brain: ["Екінші ми", "Құжаттарды сақтап, тегпен байланыстырып, сол базадан CRM жасау."],
  translate: ["Аударма", "Мәтінді қалаған тілге аударыңыз."],
  quiz: ["Тест жасау", "Базаңыздан тест және жауап кілтін жасаңыз."],
  crm: ["CRM талдау", "Excel/CSV CRM базасын талдаңыз."],
  tasks: ["Тапсырмалар", "Trello сияқты тапсырмалар тақтасы."],
  goals: ["Мақсаттар орталығы / Focus Center", "Мақсат, проект, жоспар, тапсырма және әдет бір жерде байланысып тұрады."],
  notes: ["Жазбалар", "Ойлар мен конспектілерді сақтаңыз."],
  backupCenter: ["Backup Center", "Export/import SanaBase localStorage data."]
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
on("crmClientForm", "submit", saveCrmClientCard);
on("crmClientSearch", "input", render);
on("crmClientStatusFilter", "change", render);
document.addEventListener("click", handleCrmClientCardAction);
on("crmQuickForm", "submit", saveCrmQuickDeal);
on("crmSearch", "input", render);
on("crmStatusFilter", "change", render);
on("crmReportBtn", "click", buildCrmBusinessReport);
on("crmReportSaveBtn", "click", saveCrmBusinessReport);
on("crmReportTaskBtn", "click", tasksFromCrmBusinessReport);
on("sanabotToggle", "click", toggleMimo);
on("sanabotClose", "click", closeMimo);
on("sanabotForm", "submit", sendMimoMessage);
on("sanabotMakeTaskBtn", "click", taskFromMimoAnswer);
on("sanabotFollowUpBtn", "click", crmFollowUpFromMimoAnswer);
on("sanabotWhatsappBtn", "click", whatsappFromMimoAnswer);
on("sanabotDebtTaskBtn", "click", debtTaskFromMimoAnswer);
on("sanabotSupplierTaskBtn", "click", supplierTaskFromMimoAnswer);
on("sanabotOpenReportBtn", "click", openLatestCrmReportFromMimo);
on("matchBtn", "click", matchPrices);
on("onecImportBtn", "click", importOneCExcel);
on("onecSaveBrainBtn", "click", saveOneCToBrain);
on("onecCrmDocBtn", "click", oneCToCrmDocument);
on("cfoQuickForm", "submit", saveCfoQuickRecord);
on("cfoSearch", "input", render);
on("cfoBusinessFilter", "change", render);
on("cfoChatForm", "submit", askCfoMock);
on("cfoAutoReportBtn", "click", generateCfoAutoReport);
on("cfoSeedBtn", "click", seedCfoDemoData);
on("cfoExportBtn", "click", exportCfoData);
on("cfoClearBtn", "click", clearCfoData);
on("cfoImportBtn", "click", importCfoFiles);
on("cfoImportReportBtn", "click", showCfoImportReport);
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
on("exportAllDataBtn", "click", exportAllData);
on("importBackupBtn", "click", importBackupData);
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
document.querySelectorAll("[data-sanabot-action]").forEach(button => {
  button.addEventListener("click", () => runMimoAction(button.dataset.sanabotAction));
});
document.querySelectorAll("[data-cfo-tab]").forEach(button => {
  button.addEventListener("click", () => setCfoTab(button.dataset.cfoTab));
});

render();
renderCloudSettings();
initMimo();
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
    state.docs.unshift(normalizeDoc({
      id: crypto.randomUUID(),
      name: result.name,
      type: result.type,
      text: result.text || "",
      warning: result.warning || "",
      tags: inferTags(result.name, result.text || ""),
      links: [],
      createdAt: new Date().toISOString()
    }));
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
  const orderNumber = $("crmOrderNumber")?.value?.trim() || `ORD-${Date.now().toString().slice(-6)}`;
  const date = $("crmOrderDate")?.value || isoDate();
  const clientName = $("crmClientName")?.value?.trim() || "";
  const schoolName = $("crmSchoolName")?.value?.trim() || clientName;
  const productName = $("crmProductName")?.value?.trim() || "";
  const quantity = Number($("crmQuantity")?.value || 0);
  const purchasePrice = Number($("crmPurchasePrice")?.value || 0);
  const salePrice = Number($("crmSalePrice")?.value || 0);
  const paidAmount = Number($("crmPaidAmount")?.value || 0);
  const paymentMethod = $("crmPaymentMethod")?.value || "bank";
  const documentStatus = $("crmDocumentStatus")?.value || "жоқ";
  const esfStatus = $("crmEsfStatus")?.value || "жоқ";
  const oneCStatus = $("crmOneCStatus")?.value || "енгізілмеді";
  const comment = $("crmComment")?.value?.trim() || "";
  if (!clientName && !schoolName && !productName) return;
  const totalAmount = quantity * salePrice;
  const costAmount = quantity * purchasePrice;
  const marginAmount = totalAmount - costAmount;
  const debtAmount = Math.max(0, totalAmount - paidAmount);
  const status = debtAmount > 0 ? "client_order_received" : "closed";
  const order = createOrder({
    entity: "client_order",
    title: `${orderNumber} · ${productName || schoolName || clientName}`,
    date,
    endDate: date,
    category: "CRM",
    priority: debtAmount > 0 ? "high" : "medium",
    clientName: schoolName || clientName,
    supplierName: "",
    amount: totalAmount,
    status,
    comment
  });
  Object.assign(order, {
    orderNumber,
    date,
    clientName,
    schoolName,
    productName,
    quantity,
    purchasePrice,
    salePrice,
    totalAmount,
    costAmount,
    marginAmount,
    paidAmount,
    debtAmount,
    paymentMethod,
    paymentStatus: debtAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
    documentStatus,
    esfStatus,
    oneCStatus,
    comment,
    productsJson: productName,
    updatedAt: nowIso()
  });
  if (paidAmount > 0) {
    const payment = createPayment({
      title: `Төлем: ${orderNumber}`,
      amount: paidAmount,
      status: "paid",
      date,
      category: paymentMethod,
      priority: "medium",
      clientName: schoolName || clientName,
      supplierName: "",
      comment: `CRM order ${orderNumber}: ${productName}`
    });
    payment.orderId = order.id;
    payment.method = paymentMethod;
    order.relatedPaymentId = payment.id;
  }
  logHistory("crm_order", order.id, "CRM order қосу", null, order, "CRM order form");
  event.target.reset();
  persist();
  render();
  if ($("crmOut")) $("crmOut").textContent = `CRM order сақталды: ${orderNumber}. Total: ${money(totalAmount)}, paid: ${money(paidAmount)}, debt: ${money(debtAmount)}.`;
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
  renderCrmClientPlaceholder();
  renderCrmOperatingPanel(cal);
}

function renderCrmClientPlaceholder() {
  const cal = calendarData();
  const query = ($("crmClientSearch")?.value || "").trim().toLowerCase();
  const filter = $("crmClientStatusFilter")?.value || "active";
  const clients = (cal.clients || []).map(normalizeCrmClientCard).filter(client => {
    const archived = Boolean(client.archivedAt);
    if (filter === "active" && archived) return false;
    if (filter === "archived" && !archived) return false;
    const haystack = [
      client.clientName,
      client.schoolName,
      client.name,
      client.bin,
      client.phone,
      client.whatsapp,
      client.address
    ].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
  if ($("crmClientList")) {
    $("crmClientList").innerHTML = clients.slice(0, 12).map(client => `
      <article class="crm-doc-card">
        <div>
          <h4>${escapeHtml(client.schoolName || client.name || "\u041a\u043b\u0438\u0435\u043d\u0442")}</h4>
          <span>${escapeHtml(client.bin || "BIN \u0436\u043e\u049b")} · ${escapeHtml(client.phone || client.whatsapp || "\u0431\u0430\u0439\u043b\u0430\u043d\u044b\u0441 \u0436\u043e\u049b")}</span>
        </div>
        <p>${escapeHtml(client.contactPerson || client.paymentTerms || client.comment || "\u041a\u043b\u0438\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u0441\u044b \u0441\u0430\u049b\u0442\u0430\u043b\u0434\u044b.")}</p>
        <small>\u049a\u0430\u0440\u044b\u0437 \u043b\u0438\u043c\u0438\u0442\u0456: ${money(client.debtLimit)} · Status: ${client.archivedAt ? "archived" : "active"}</small>
        <div class="crm-client-actions">
          <button type="button" data-crm-client-edit="${escapeHtml(client.id)}">Edit</button>
          <button type="button" data-crm-client-profile="${escapeHtml(client.id)}">Profile</button>
          <button type="button" data-crm-client-orders="${escapeHtml(client.id)}">Orders</button>
          <button type="button" data-crm-client-debts="${escapeHtml(client.id)}">Debts</button>
          <button type="button" data-crm-client-whatsapp="${escapeHtml(client.id)}">WhatsApp</button>
          ${client.archivedAt
            ? `<button type="button" data-crm-client-restore="${escapeHtml(client.id)}">Restore</button>`
            : `<button type="button" data-crm-client-archive="${escapeHtml(client.id)}">Archive</button>`}
        </div>
      </article>
    `).join("") || `<article class="crm-doc-card"><h4>Clients / Schools</h4><p>\u041a\u043b\u0438\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u044b \u043a\u0435\u043b\u0435\u0441\u0456 \u049b\u0430\u0434\u0430\u043c\u0434\u0430 \u049b\u043e\u0441\u044b\u043b\u0430\u0434\u044b.</p></article>`;
  }
  if ($("crmClientOut")) $("crmClientOut").textContent = clients.length
    ? `\u041a\u043b\u0438\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u044b: ${clients.length}`
    : "\u041a\u043b\u0438\u0435\u043d\u0442 \u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b \u043d\u0435\u043c\u0435\u0441\u0435 \u04d9\u043b\u0456 \u0441\u0430\u049b\u0442\u0430\u043b\u043c\u0430\u0493\u0430\u043d.";
}
function normalizeCrmClientCard(client = {}) {
  return {
    ...client,
    id: client.id || crypto.randomUUID(),
    type: client.type || "client",
    businessType: client.businessType || "b2b_school",
    name: client.name || client.clientName || client.schoolName || "",
    clientName: client.clientName || client.name || "",
    schoolName: client.schoolName || client.name || "",
    bin: client.bin || "",
    contactPerson: client.contactPerson || client.contactName || "",
    phone: client.phone || "",
    whatsapp: client.whatsapp || "",
    address: client.address || "",
    paymentTerms: client.paymentTerms || "",
    debtLimit: Number(client.debtLimit || 0),
    currentDebt: Number(client.currentDebt || client.totalDebt || 0),
    comment: client.comment || client.notes || "",
    createdAt: client.createdAt || nowIso(),
    updatedAt: client.updatedAt || nowIso(),
    archivedAt: client.archivedAt || ""
  };
}

function crmClientDuplicateWarning(client, clients = []) {
  const normalized = normalizeCrmClientCard(client);
  const normalizedBin = normalized.bin.trim().toLowerCase();
  const normalizedName = `${normalized.schoolName || ""} ${normalized.clientName || ""} ${normalized.name || ""}`.trim().toLowerCase();
  const existingClients = clients.map(normalizeCrmClientCard);
  if (normalizedBin) {
    const match = existingClients.find(existing => existing.bin.trim().toLowerCase() === normalizedBin);
    if (match) return `\u0415\u0441\u043a\u0435\u0440\u0442\u0443: \u043e\u0441\u044b\u043d\u0434\u0430\u0439 BIN \u0431\u0430\u0440 \u043a\u043b\u0438\u0435\u043d\u0442 \u0431\u04b1\u0440\u044b\u043d \u0441\u0430\u049b\u0442\u0430\u043b\u0493\u0430\u043d: ${match.schoolName || match.name || match.clientName || match.bin}.`;
  }
  if (normalizedName) {
    const match = existingClients.find(existing => {
      const existingName = `${existing.schoolName || ""} ${existing.clientName || ""} ${existing.name || ""}`.trim().toLowerCase();
      return existingName && (existingName.includes(normalizedName) || normalizedName.includes(existingName));
    });
    if (match) return `\u0415\u0441\u043a\u0435\u0440\u0442\u0443: \u0430\u0442\u0430\u0443\u044b \u04b1\u049b\u0441\u0430\u0441 \u043a\u043b\u0438\u0435\u043d\u0442 \u0431\u0430\u0440: ${match.schoolName || match.name || match.clientName}.`;
  }
  return "";
}

function setCrmClientForm(client) {
  const normalized = normalizeCrmClientCard(client);
  if ($("crmClientEditingId")) $("crmClientEditingId").value = normalized.id;
  if ($("crmClientCardName")) $("crmClientCardName").value = normalized.clientName || "";
  if ($("crmClientSchoolName")) $("crmClientSchoolName").value = normalized.schoolName || "";
  if ($("crmClientBin")) $("crmClientBin").value = normalized.bin || "";
  if ($("crmClientContactPerson")) $("crmClientContactPerson").value = normalized.contactPerson || "";
  if ($("crmClientPhone")) $("crmClientPhone").value = normalized.phone || "";
  if ($("crmClientWhatsapp")) $("crmClientWhatsapp").value = normalized.whatsapp || "";
  if ($("crmClientAddress")) $("crmClientAddress").value = normalized.address || "";
  if ($("crmClientPaymentTerms")) $("crmClientPaymentTerms").value = normalized.paymentTerms || "";
  if ($("crmClientDebtLimit")) $("crmClientDebtLimit").value = normalized.debtLimit || "";
  if ($("crmClientComment")) $("crmClientComment").value = normalized.comment || "";
  if ($("crmClientOut")) $("crmClientOut").textContent = `Edit \u0440\u0435\u0436\u0438\u043c\u0456: ${normalized.schoolName || normalized.name || normalized.clientName || normalized.bin}`;
}

function editCrmClientCard(id) {
  const client = (calendarData().clients || []).find(item => item.id === id);
  if (!client) return;
  setCrmClientForm(client);
  $("crmClientForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setCrmClientArchived(id, archived) {
  const cal = calendarData();
  const index = (cal.clients || []).findIndex(item => item.id === id);
  if (index < 0) return;
  const oldValue = { ...cal.clients[index] };
  cal.clients[index] = {
    ...cal.clients[index],
    archivedAt: archived ? nowIso() : null,
    updatedAt: nowIso()
  };
  logHistory("crm_client", id, archived ? "CRM client archive" : "CRM client restore", oldValue, cal.clients[index], "Clients / Schools action");
  persist();
  render();
  if ($("crmClientOut")) $("crmClientOut").textContent = archived
    ? "\u041a\u043b\u0438\u0435\u043d\u0442 \u0430\u0440\u0445\u0438\u0432\u043a\u0435 \u0436\u0456\u0431\u0435\u0440\u0456\u043b\u0434\u0456."
    : "\u041a\u043b\u0438\u0435\u043d\u0442 \u0430\u0440\u0445\u0438\u0432\u0442\u0435\u043d \u049b\u0430\u0439\u0442\u0430\u0440\u044b\u043b\u0434\u044b.";
}

function findCrmClientById(id) {
  return (calendarData().clients || []).map(normalizeCrmClientCard).find(client => client.id === id);
}

function crmClientMatchValues(client) {
  return [
    client.clientName,
    client.schoolName,
    client.name,
    client.bin
  ].map(value => String(value || "").trim().toLowerCase()).filter(Boolean);
}

function crmClientRelatedOrders(client) {
  const values = crmClientMatchValues(client);
  if (!values.length) return [];
  return crmDealRows(calendarData()).filter(row => {
    const haystack = [
      row.clientName,
      row.schoolName,
      row.orderNumber,
      row.comment
    ].join(" ").toLowerCase();
    return values.some(value => haystack.includes(value) || value.includes(String(row.clientName || "").toLowerCase()) || value.includes(String(row.schoolName || "").toLowerCase()));
  });
}

function crmClientDebtSummary(client) {
  const orders = crmClientRelatedOrders(client);
  return {
    orders,
    totalAmount: orders.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    paidAmount: orders.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0),
    debtAmount: orders.reduce((sum, row) => sum + Number(row.debt || 0), 0),
    debtOrderCount: orders.filter(row => Number(row.debt || 0) > 0).length
  };
}

function crmClientProfileName(client) {
  return client.schoolName || client.name || client.clientName || client.bin || "Client";
}

function crmClientWhatsappDrafts(client, summary = crmClientDebtSummary(client)) {
  const name = crmClientProfileName(client);
  return {
    debt: [
      `Сәлеметсіз бе! ${name} бойынша біздің есепте ${money(summary.debtAmount)} төлем қалды деп көрініп тұр.`,
      `Ашық заказ саны: ${summary.debtOrderCount}.`,
      "Мүмкін болса, төлем статусын нақтылап жібересіз бе?",
      "Егер төлем жасалған болса, платежка/чек жіберсеңіз, 1С/CRM ішінде белгілеп қоямыз."
    ].join("\n"),
    followUp: [
      `Сәлеметсіз бе! ${name} бойынша заказ/қажетті тауарлар бар ма?`,
      "Қажет болса, алдын ала тізім жіберсеңіз, бағасын және жеткізу уақытын дайындап береміз."
    ].join("\n"),
    docs: [
      `Сәлеметсіз бе! ${name} бойынша құжаттарды нақтылап жіберейік.`,
      "Счет, накладная, реализация, ЭСФ немесе акт сверки керек болса, қай құжат қажет екенін жазыңыз."
    ].join("\n")
  };
}

function crmClientProfileTabs(active = "overview", clientId = "") {
  const tabs = [
    ["overview", "Overview"],
    ["orders", "Orders"],
    ["debts", "Debts"],
    ["whatsapp", "WhatsApp"],
    ["tasks", "Tasks"],
    ["notes", "Notes"]
  ];
  return tabs.map(([id, label]) => `<button type="button" class="${id === active ? "active" : ""}" data-crm-client-profile-tab="${escapeHtml(id)}" data-client-id="${escapeHtml(clientId)}">${escapeHtml(label)}</button>`).join("");
}

function crmClientProfileOverview(client) {
  const rows = [
    ["clientName", client.clientName],
    ["schoolName", client.schoolName],
    ["BIN", client.bin],
    ["phone", client.phone],
    ["whatsapp", client.whatsapp],
    ["address", client.address],
    ["paymentTerms", client.paymentTerms],
    ["debtLimit", money(client.debtLimit)],
    ["comment", client.comment]
  ];
  return `<div class="crm-client-profile-grid">${rows.map(([label, value]) => `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value || "-"))}</strong>
    </div>
  `).join("")}</div>`;
}

function crmClientProfileOrders(client) {
  const rows = crmClientRelatedOrders(client);
  return `
    <div class="crm-client-profile-list">
      ${rows.slice(0, 20).map(row => `
        <article>
          <strong>${escapeHtml(row.orderNumber || row.title || "Order")}</strong>
          <span>${escapeHtml(row.date || "-")} · ${escapeHtml(row.productName || "-")}</span>
          <small>Total: ${money(row.amount)} · Paid: ${money(row.paidAmount)} · Debt: ${money(row.debt)}</small>
        </article>
      `).join("") || `<p class="crm-empty">Order табылмады. Matching clientName немесе schoolName арқылы жасалады.</p>`}
    </div>
  `;
}

function crmClientProfileDebts(client) {
  const summary = crmClientDebtSummary(client);
  return `
    <div class="crm-client-profile-kpis">
      <span><b>${money(summary.totalAmount)}</b><small>totalAmount</small></span>
      <span><b>${money(summary.paidAmount)}</b><small>paidAmount</small></span>
      <span><b>${money(summary.debtAmount)}</b><small>debtAmount</small></span>
      <span><b>${summary.debtOrderCount}</b><small>debt order count</small></span>
    </div>
    ${crmClientProfileOrders(client)}
  `;
}

function crmClientProfileWhatsapp(client) {
  const drafts = crmClientWhatsappDrafts(client);
  return `
    <div class="crm-client-whatsapp-drafts">
      ${Object.entries(drafts).map(([type, text]) => `
        <article>
          <div class="crm-panel-head">
            <div>
              <h4>${escapeHtml(type === "debt" ? "Қарыз сұрау мәтіні" : type === "followUp" ? "Заказ follow-up мәтіні" : "Құжат сұрау мәтіні")}</h4>
            </div>
            <button type="button" data-crm-client-profile-copy="${escapeHtml(type)}">Copy</button>
          </div>
          <pre>${escapeHtml(text)}</pre>
        </article>
      `).join("")}
    </div>
  `;
}

function crmClientProfileTasks(client) {
  return `
    <div class="crm-client-profile-empty">
      <p>Осы client бойынша follow-up task жасауға болады.</p>
      <button type="button" data-crm-client-profile-task="${escapeHtml(client.id)}">Create client task</button>
    </div>
  `;
}

function crmClientProfileNotes(client) {
  return `
    <div class="crm-client-profile-empty">
      <h4>Read-only comment</h4>
      <pre>${escapeHtml(client.comment || "Comment жоқ.")}</pre>
    </div>
  `;
}

function renderCrmClientProfile(client, activeTab = "overview") {
  const modal = $("crmClientProfileModal");
  if (!modal) return;
  const normalized = normalizeCrmClientCard(client);
  const title = $("crmClientProfileTitle");
  const sub = $("crmClientProfileSub");
  const tabs = $("crmClientProfileTabs");
  const body = $("crmClientProfileBody");
  const summary = crmClientDebtSummary(normalized);
  if (title) title.textContent = crmClientProfileName(normalized);
  if (sub) sub.textContent = `${normalized.bin || "BIN жоқ"} · debt ${money(summary.debtAmount)} · orders ${summary.orders.length}`;
  if (tabs) tabs.innerHTML = crmClientProfileTabs(activeTab, normalized.id);
  if (!body) return;
  body.dataset.clientId = normalized.id;
  body.dataset.activeTab = activeTab;
  body.dataset.whatsappDebt = crmClientWhatsappDrafts(normalized, summary).debt;
  body.dataset.whatsappFollowUp = crmClientWhatsappDrafts(normalized, summary).followUp;
  body.dataset.whatsappDocs = crmClientWhatsappDrafts(normalized, summary).docs;
  body.innerHTML = {
    overview: crmClientProfileOverview(normalized),
    orders: crmClientProfileOrders(normalized),
    debts: crmClientProfileDebts(normalized),
    whatsapp: crmClientProfileWhatsapp(normalized),
    tasks: crmClientProfileTasks(normalized),
    notes: crmClientProfileNotes(normalized)
  }[activeTab] || crmClientProfileOverview(normalized);
}

function openCrmClientProfile(id, tab = "overview") {
  const client = findCrmClientById(id);
  if (!client) return;
  const modal = $("crmClientProfileModal");
  if (!modal) return;
  modal.hidden = false;
  modal.dataset.clientId = id;
  renderCrmClientProfile(client, tab);
}

function closeCrmClientProfile() {
  const modal = $("crmClientProfileModal");
  if (modal) modal.hidden = true;
}

async function copyCrmClientProfileText(type) {
  const body = $("crmClientProfileBody");
  const text = {
    debt: body?.dataset.whatsappDebt || "",
    followUp: body?.dataset.whatsappFollowUp || "",
    docs: body?.dataset.whatsappDocs || ""
  }[type] || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if ($("crmClientOut")) $("crmClientOut").textContent = "Profile WhatsApp text copied.";
  } catch (error) {
    if ($("crmClientOut")) $("crmClientOut").textContent = `Copy error: ${error.message}`;
  }
}

function createTaskFromCrmClientProfile(id) {
  const client = findCrmClientById(id);
  if (!client) return;
  const summary = crmClientDebtSummary(client);
  state.tasks.unshift(normalizeTask({
    title: `CRM client follow-up: ${crmClientProfileName(client)}`.slice(0, 120),
    body: [
      `Client: ${crmClientProfileName(client)}`,
      `Phone: ${client.phone || client.whatsapp || "-"}`,
      `Debt: ${money(summary.debtAmount)}`,
      `Orders: ${summary.orders.length}`,
      client.comment ? `Comment: ${client.comment}` : ""
    ].filter(Boolean).join("\n"),
    status: "todo",
    priority: summary.debtAmount > 0 ? "high" : "medium",
    due: addDays(isoDate(), 1),
    owner: "CRM",
    link: "Client Profile"
  }));
  persist();
  renderTasks();
  if ($("crmClientOut")) $("crmClientOut").textContent = `Profile task дайын: ${crmClientProfileName(client)}.`;
}

function showCrmClientMiniPanel({ title, kpis = [], body = "", copyText = "" }) {
  const panel = $("crmClientMiniPanel");
  if (!panel) return;
  panel.hidden = false;
  panel.dataset.title = title || "CRM client follow-up";
  panel.dataset.copyText = copyText || body || "";
  panel.innerHTML = `
    <div class="crm-panel-head">
      <div>
        <h4>${escapeHtml(title)}</h4>
        <p>Mini CRM profile</p>
      </div>
      <div class="crm-client-mini-actions">
        ${copyText ? `<button type="button" data-crm-client-copy>Copy text</button>` : ""}
        <button type="button" data-crm-client-task>Task жасау</button>
        <button type="button" data-crm-client-reminder>Reminder жасау</button>
        <button type="button" data-crm-client-open-view="tasks">Tasks \u0430\u0448\u0443</button>
        <button type="button" data-crm-client-open-view="calendaros">Calendar \u0430\u0448\u0443</button>
      </div>
    </div>
    <div class="crm-client-mini-kpis">
      ${kpis.map(item => `<span><strong>${escapeHtml(item[0])}</strong><br>${escapeHtml(String(item[1]))}</span>`).join("")}
    </div>
    <pre>${escapeHtml(body)}</pre>
  `;
}

async function copyCrmClientMiniPanelText() {
  const panel = $("crmClientMiniPanel");
  const text = panel?.dataset.copyText || "";
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    if ($("crmClientOut")) $("crmClientOut").textContent = "Text copied.";
  } catch (error) {
    if ($("crmClientOut")) $("crmClientOut").textContent = `Copy error: ${error.message}`;
  }
}

function createTaskFromCrmClientMiniPanel() {
  const panel = $("crmClientMiniPanel");
  const title = panel?.dataset.title || "CRM client follow-up";
  const body = panel?.dataset.copyText || panel?.innerText || "";
  state.tasks.unshift(normalizeTask({
    title: `CRM: ${title}`.slice(0, 120),
    body,
    status: "todo",
    priority: body.toLowerCase().includes("debt") || body.includes("қарыз") ? "high" : "medium",
    due: addDays(isoDate(), 1),
    owner: "CRM",
    link: "Clients / Schools"
  }));
  persist();
  renderTasks();
  if ($("crmClientOut")) $("crmClientOut").textContent = `Task \u0434\u0430\u0439\u044b\u043d: CRM: ${title}. Tasks \u0430\u0448\u0443 \u0431\u0430\u0442\u044b\u0440\u043c\u0430\u0441\u044b\u043d \u0431\u0430\u0441\u044b\u043f \u043a\u04e9\u0440\u0456\u04a3\u0456\u0437.`;
}

function createReminderFromCrmClientMiniPanel() {
  const panel = $("crmClientMiniPanel");
  const title = panel?.dataset.title || "CRM client follow-up";
  const body = panel?.dataset.copyText || panel?.innerText || "";
  addCalendarEvent({
    title: `CRM reminder: ${title}`.slice(0, 140),
    description: body,
    type: "reminder",
    category: "CRM",
    startDate: addDays(isoDate(), 1),
    priority: body.toLowerCase().includes("debt") || body.includes("қарыз") ? "high" : "medium",
    status: "open"
  });
  persist();
  renderCalendarOS();
  if ($("crmClientOut")) $("crmClientOut").textContent = `Reminder \u0434\u0430\u0439\u044b\u043d: ${addDays(isoDate(), 1)} · ${title}. Calendar \u0430\u0448\u0443 \u0431\u0430\u0442\u044b\u0440\u043c\u0430\u0441\u044b\u043d \u0431\u0430\u0441\u044b\u043f \u043a\u04e9\u0440\u0456\u04a3\u0456\u0437.`;
}

function showCrmClientOrders(id) {
  const client = findCrmClientById(id);
  if (!client || !$("crmClientOut")) return;
  const rows = crmClientRelatedOrders(client);
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const debt = rows.reduce((sum, row) => sum + Number(row.debt || 0), 0);
  const body = [
    `Orders: ${client.schoolName || client.name || client.clientName}`,
    `Count: ${rows.length}`,
    `Total: ${money(total)}`,
    `Debt: ${money(debt)}`,
    "",
    rows.slice(0, 8).map((row, index) => `${index + 1}. ${row.orderNumber || "-"} · ${row.date || "-"} · ${row.productName || "-"} · ${money(row.amount)} · debt ${money(row.debt)}`).join("\n") || "Order \u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b."
  ].join("\n");
  $("crmClientOut").textContent = body;
  showCrmClientMiniPanel({
    title: `Orders ? ${client.schoolName || client.name || client.clientName}`,
    kpis: [["Orders", rows.length], ["Total", money(total)], ["Debt", money(debt)]],
    body
  });
}

function showCrmClientDebts(id) {
  const client = findCrmClientById(id);
  if (!client || !$("crmClientOut")) return;
  const rows = crmClientRelatedOrders(client).filter(row => Number(row.debt || 0) > 0);
  const debt = rows.reduce((sum, row) => sum + Number(row.debt || 0), 0);
  const body = [
    `Debts: ${client.schoolName || client.name || client.clientName}`,
    `Open debt: ${money(debt)}`,
    "",
    rows.slice(0, 8).map((row, index) => `${index + 1}. ${row.orderNumber || "-"} · ${money(row.debt)} · ${row.paymentStatus || "-"}`).join("\n") || "\u0410\u0448\u044b\u049b \u049b\u0430\u0440\u044b\u0437 \u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b."
  ].join("\n");
  $("crmClientOut").textContent = body;
  showCrmClientMiniPanel({
    title: `Debts ? ${client.schoolName || client.name || client.clientName}`,
    kpis: [["Open rows", rows.length], ["Open debt", money(debt)], ["Limit", money(client.debtLimit)]],
    body
  });
}

function showCrmClientWhatsapp(id) {
  const client = findCrmClientById(id);
  if (!client || !$("crmClientOut")) return;
  const rows = crmClientRelatedOrders(client).filter(row => Number(row.debt || 0) > 0);
  const debt = rows.reduce((sum, row) => sum + Number(row.debt || 0), 0);
  const name = client.schoolName || client.name || client.clientName || "\u043a\u043b\u0438\u0435\u043d\u0442";
  const body = debt > 0
    ? [
      `WhatsApp draft: ${name}`,
      "",
      `\u0421\u04d9\u043b\u0435\u043c\u0435\u0442\u0441\u0456\u0437 \u0431\u0435! ${name} \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0431\u0456\u0437\u0434\u0456\u04a3 \u0435\u0441\u0435\u043f\u0442\u0435 ${money(debt)} \u0442\u04e9\u043b\u0435\u043c \u049b\u0430\u043b\u0434\u044b \u0434\u0435\u043f \u043a\u04e9\u0440\u0456\u043d\u0456\u043f \u0442\u04b1\u0440.`,
      `\u049a\u04b1\u0436\u0430\u0442/\u0437\u0430\u043a\u0430\u0437 \u0441\u0430\u043d\u044b: ${rows.length}.`,
      "\u041c\u04af\u043c\u043a\u0456\u043d \u0431\u043e\u043b\u0441\u0430, \u0442\u04e9\u043b\u0435\u043c \u0441\u0442\u0430\u0442\u0443\u0441\u044b\u043d \u043d\u0430\u049b\u0442\u044b\u043b\u0430\u043f \u0436\u0456\u0431\u0435\u0440\u0435\u0441\u0456\u0437 \u0431\u0435?",
      "\u0415\u0433\u0435\u0440 \u0442\u04e9\u043b\u0435\u043c \u0436\u0430\u0441\u0430\u043b\u0493\u0430\u043d \u0431\u043e\u043b\u0441\u0430, \u043f\u043b\u0430\u0442\u0435\u0436\u043a\u0430/\u0447\u0435\u043a \u0436\u0456\u0431\u0435\u0440\u0441\u0435\u04a3\u0456\u0437, 1\u0421/CRM \u0456\u0448\u0456\u043d\u0434\u0435 \u0431\u0435\u043b\u0433\u0456\u043b\u0435\u043f \u049b\u043e\u044f\u043c\u044b\u0437."
    ].join("\n")
    : [
      `WhatsApp draft: ${name}`,
      "",
      `\u0421\u04d9\u043b\u0435\u043c\u0435\u0442\u0441\u0456\u0437 \u0431\u0435! ${name} \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0430\u0448\u044b\u049b \u049b\u0430\u0440\u044b\u0437 \u043a\u04e9\u0440\u0456\u043d\u0431\u0435\u0439 \u0442\u04b1\u0440.`,
      "\u041a\u0435\u043b\u0435\u0441\u0456 \u0437\u0430\u043a\u0430\u0437/\u049b\u0430\u0436\u0435\u0442\u0442\u0456 \u0442\u0430\u0443\u0430\u0440\u043b\u0430\u0440 \u0431\u043e\u043b\u0441\u0430, \u0430\u043b\u0434\u044b\u043d \u0430\u043b\u0430 \u0442\u0456\u0437\u0456\u043c \u0436\u0456\u0431\u0435\u0440\u0441\u0435\u04a3\u0456\u0437 \u0431\u043e\u043b\u0430\u0434\u044b."
    ].join("\n");
  $("crmClientOut").textContent = body;
  showCrmClientMiniPanel({
    title: `WhatsApp ? ${name}`,
    kpis: [["Open rows", rows.length], ["Open debt", money(debt)], ["Copy", "ready"]],
    body,
    copyText: body
  });
}

function handleCrmClientCardAction(event) {
  const closeProfileButton = event.target.closest("[data-crm-client-profile-close]");
  if (closeProfileButton) {
    closeCrmClientProfile();
    return;
  }
  const profileTabButton = event.target.closest("[data-crm-client-profile-tab]");
  if (profileTabButton) {
    openCrmClientProfile(profileTabButton.dataset.clientId, profileTabButton.dataset.crmClientProfileTab);
    return;
  }
  const profileCopyButton = event.target.closest("[data-crm-client-profile-copy]");
  if (profileCopyButton) {
    copyCrmClientProfileText(profileCopyButton.dataset.crmClientProfileCopy);
    return;
  }
  const profileTaskButton = event.target.closest("[data-crm-client-profile-task]");
  if (profileTaskButton) {
    createTaskFromCrmClientProfile(profileTaskButton.dataset.crmClientProfileTask);
    return;
  }
  const profileButton = event.target.closest("[data-crm-client-profile]");
  if (profileButton) {
    openCrmClientProfile(profileButton.dataset.crmClientProfile);
    return;
  }
  const copyButton = event.target.closest("[data-crm-client-copy]");
  if (copyButton) {
    copyCrmClientMiniPanelText();
    return;
  }
  const taskButton = event.target.closest("[data-crm-client-task]");
  if (taskButton) {
    createTaskFromCrmClientMiniPanel();
    return;
  }
  const reminderButton = event.target.closest("[data-crm-client-reminder]");
  if (reminderButton) {
    createReminderFromCrmClientMiniPanel();
    return;
  }
  const openViewButton = event.target.closest("[data-crm-client-open-view]");
  if (openViewButton) {
    setView(openViewButton.dataset.crmClientOpenView);
    return;
  }
  const editButton = event.target.closest("[data-crm-client-edit]");
  if (editButton) {
    editCrmClientCard(editButton.dataset.crmClientEdit);
    return;
  }
  const ordersButton = event.target.closest("[data-crm-client-orders]");
  if (ordersButton) {
    showCrmClientOrders(ordersButton.dataset.crmClientOrders);
    return;
  }
  const debtsButton = event.target.closest("[data-crm-client-debts]");
  if (debtsButton) {
    showCrmClientDebts(debtsButton.dataset.crmClientDebts);
    return;
  }
  const whatsappButton = event.target.closest("[data-crm-client-whatsapp]");
  if (whatsappButton) {
    showCrmClientWhatsapp(whatsappButton.dataset.crmClientWhatsapp);
    return;
  }
  const archiveButton = event.target.closest("[data-crm-client-archive]");
  if (archiveButton) {
    setCrmClientArchived(archiveButton.dataset.crmClientArchive, true);
    return;
  }
  const restoreButton = event.target.closest("[data-crm-client-restore]");
  if (restoreButton) {
    setCrmClientArchived(restoreButton.dataset.crmClientRestore, false);
  }
}

function saveCrmClientCard(event) {
  event.preventDefault();
  const cal = calendarData();
  const editingId = $("crmClientEditingId")?.value || "";
  const client = normalizeCrmClientCard({
    clientName: $("crmClientCardName")?.value?.trim() || "",
    schoolName: $("crmClientSchoolName")?.value?.trim() || "",
    bin: $("crmClientBin")?.value?.trim() || "",
    contactPerson: $("crmClientContactPerson")?.value?.trim() || "",
    phone: $("crmClientPhone")?.value?.trim() || "",
    whatsapp: $("crmClientWhatsapp")?.value?.trim() || "",
    address: $("crmClientAddress")?.value?.trim() || "",
    paymentTerms: $("crmClientPaymentTerms")?.value?.trim() || "",
    debtLimit: Number($("crmClientDebtLimit")?.value || 0),
    comment: $("crmClientComment")?.value?.trim() || ""
  });
  if (!client.clientName && !client.schoolName && !client.bin) return;
  client.name = client.schoolName || client.clientName || client.bin;
  const warning = crmClientDuplicateWarning(client, (cal.clients || []).filter(item => item.id !== editingId));
  const existingIndex = editingId ? (cal.clients || []).findIndex(item => item.id === editingId) : -1;
  if (existingIndex >= 0) {
    const oldValue = { ...cal.clients[existingIndex] };
    cal.clients[existingIndex] = {
      ...oldValue,
      ...client,
      id: editingId,
      createdAt: oldValue.createdAt || client.createdAt,
      updatedAt: nowIso(),
      archivedAt: oldValue.archivedAt || ""
    };
    logHistory("crm_client", editingId, "CRM client card update", oldValue, cal.clients[existingIndex], "Clients / Schools form");
  } else {
    cal.clients.unshift(client);
    logHistory("crm_client", client.id, "CRM client card add", null, client, "Clients / Schools form");
  }
  event.target.reset();
  if ($("crmClientEditingId")) $("crmClientEditingId").value = "";
  persist();
  render();
  if ($("crmClientOut")) $("crmClientOut").textContent = [
    existingIndex >= 0 ? `\u041a\u043b\u0438\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u0441\u044b \u0436\u0430\u04a3\u0430\u0440\u0442\u044b\u043b\u0434\u044b: ${client.name}` : `\u041a\u043b\u0438\u0435\u043d\u0442 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u0441\u044b \u0441\u0430\u049b\u0442\u0430\u043b\u0434\u044b: ${client.name}`,
    warning
  ].filter(Boolean).join("\n");
}
function renderCrmOperatingPanel(cal = calendarData()) {
  if (!$("crmPipeline") || !$("crmTable")) return;
  const query = $("crmSearch")?.value?.toLowerCase() || "";
  const filter = $("crmStatusFilter")?.value || "all";
  const rows = crmDealRows(cal).filter(row => {
    const haystack = `${row.orderNumber} ${row.date} ${row.clientName} ${row.schoolName} ${row.productName} ${row.paymentMethod} ${row.documentStatus} ${row.esfStatus} ${row.oneCStatus} ${row.comment}`.toLowerCase();
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
    <div class="crm-row crm-row-head crm-order-row">
      <span>orderNumber</span><span>date</span><span>clientName</span><span>schoolName</span><span>productName</span><span>quantity</span><span>purchasePrice</span><span>salePrice</span><span>paidAmount</span><span>paymentMethod</span><span>documentStatus</span><span>esfStatus</span><span>oneCStatus</span><span>comment</span><span></span>
    </div>
    ${rows.map(row => `
      <div class="crm-row crm-order-row ${row.overdue ? "overdue" : ""}">
        <span>${escapeHtml(row.orderNumber || "-")}</span>
        <span>${escapeHtml(String(row.date || "").slice(0, 10) || "-")}</span>
        <span>${escapeHtml(row.clientName || "-")}</span>
        <span>${escapeHtml(row.schoolName || "-")}</span>
        <span><strong>${escapeHtml(row.productName || "-")}</strong><small>Total: ${money(row.amount)} · Debt: ${money(row.debt)}</small></span>
        <span>${escapeHtml(row.quantity || 0)}</span>
        <span>${money(row.purchasePrice)}</span>
        <span>${money(row.salePrice)}</span>
        <span>${money(row.paidAmount)}</span>
        <span>${escapeHtml(row.paymentMethod || "-")}</span>
        <span>${escapeHtml(row.documentStatus || "-")}</span>
        <span>${escapeHtml(row.esfStatus || "-")}</span>
        <span>${escapeHtml(row.oneCStatus || "-")}</span>
        <span>${escapeHtml(row.comment || "-")}</span>
        <span class="crm-row-actions">
          <button type="button" data-crm-task="${escapeHtml(row.id)}">Task</button>
          <button type="button" data-crm-close="${escapeHtml(row.id)}">Жабу</button>
        </span>
      </div>
    `).join("") || `<div class="crm-row crm-order-row"><span>CRM ішінде order жазба жоқ. Жоғарыдағы форма арқылы orderNumber, clientName, productName енгізіңіз.</span></div>`}
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
    const quantity = Number(order.quantity || 0);
    const purchasePrice = Number(order.purchasePrice || 0);
    const salePrice = Number(order.salePrice || 0);
    const computedTotal = quantity && salePrice ? quantity * salePrice : Number(order.totalAmount || 0);
    const computedCost = quantity && purchasePrice ? quantity * purchasePrice : Number(order.costAmount || 0);
    const orderPayments = payments.filter(payment => payment.orderId === order.id);
    const paidAmount = Number(order.paidAmount ?? orderPayments.filter(payment => payment.status === "paid").reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0));
    const debt = Math.max(0, computedTotal - paidAmount);
    const nextTask = activeCalItems(cal.tasks)
      .filter(task => task.orderId === order.id && !["done", "closed"].includes(task.status))
      .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))[0];
    const nextAction = nextTask?.dueDate || order.expectedDeliveryDate || client?.nextActionDate || order.date || "";
    return {
      id: order.id,
      orderNumber: order.orderNumber || "",
      date: order.date || order.clientOrderDate || order.createdAt || "",
      clientName: order.clientName || client?.name || "",
      schoolName: order.schoolName || client?.name || "",
      productName: order.productName || order.productsJson || order.title || "",
      quantity,
      purchasePrice,
      salePrice,
      paidAmount,
      paymentMethod: order.paymentMethod || "",
      documentStatus: order.documentStatus || "жоқ",
      esfStatus: order.esfStatus || "жоқ",
      oneCStatus: order.oneCStatus || "енгізілмеді",
      comment: order.comment || "",
      title: order.title || order.orderNumber || "CRM заказ",
      status: order.status || "client_order_received",
      statusLabel: crmStatusLabel(order.status),
      amount: computedTotal,
      costAmount: computedCost,
      marginAmount: Number(order.marginAmount ?? (computedTotal - computedCost)),
      debt,
      nextAction,
      overdue: Boolean(nextAction && nextAction < isoDate() && !["closed", "received"].includes(order.status))
    };
  }).sort((a, b) => Number(b.overdue) - Number(a.overdue) || String(a.date || "9999").localeCompare(String(b.date || "9999")));
}

function crmDealCard(row) {
  return `
    <article class="crm-deal-card ${row.overdue ? "overdue" : ""}">
      <b>${escapeHtml(row.orderNumber || row.title)}</b>
      <span>${escapeHtml(row.schoolName || row.clientName || "Клиент жоқ")} · ${money(row.amount)}</span>
      <small>${escapeHtml(row.productName || "Тауар жоқ")} · ${row.quantity || 0} дана · debt ${money(row.debt)}</small>
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

async function buildCrmBusinessReport() {
  const out = $("crmReportOut");
  if (!out) return;
  const files = {
    realization: $("crmRealizationFile")?.files?.[0],
    kaspi: $("crmKaspiFile")?.files?.[0],
    counterparties: $("crmCounterpartyFile")?.files?.[0],
    nomenclature: $("crmNomenclatureFile")?.files?.[0]
  };
  if (!files.realization && !files.nomenclature) {
    out.textContent = "Кемінде 1С реализация немесе номенклатура/остаток файлын жүктеңіз.";
    return;
  }
  out.textContent = "CRM толық отчет жасалып жатыр...";
  try {
    const tables = {};
    for (const [key, file] of Object.entries(files)) {
      if (file) tables[key] = await readTableFile(file);
    }
    const report = analyzeCrmBusinessTables(tables, $("crmReportType")?.value || "both", $("crmReportProject")?.value.trim() || "");
    state.crmReports = Array.isArray(state.crmReports) ? state.crmReports : [];
    state.crmReports.unshift(report);
    state.crmReports = state.crmReports.slice(0, 12);
    persist();
    render();
    out.textContent = report.text;
  } catch (error) {
    out.textContent = `CRM отчет қатесі: ${shortError(error)}`;
  }
}

function analyzeCrmBusinessTables(tables, type = "both", project = "") {
  const realization = tables.realization ? parseRealizationTable(tables.realization) : [];
  const kaspi = tables.kaspi ? parseKaspiTable(tables.kaspi) : [];
  const counterparties = tables.counterparties ? parseCounterpartyTable(tables.counterparties) : [];
  const nomenclature = tables.nomenclature ? parseNomenclatureTable(tables.nomenclature) : [];
  const b2b = analyzeB2B(realization, kaspi, counterparties);
  const store = analyzeStore(nomenclature, realization);
  const business = type === "b2b" ? "school" : type === "store" ? "store" : "mixed";
  const projectName = project || `${businessLabel(business)} ${isoDate()}`;
  const text = crmBusinessReportText({ b2b, store, type, files: Object.keys(tables), project: projectName });
  return normalizeCrmReport({
    title: `${projectName} · CRM толық отчет`,
    type,
    business,
    project: projectName,
    folder: `${businessLabel(business)} / ${projectName}`,
    sourceTypes: Object.keys(tables),
    createdAt: new Date().toISOString(),
    summary: {
      sales: b2b.totalSales,
      paid: b2b.totalPaid,
      debt: b2b.totalDebt,
      margin: b2b.margin,
      estimatedTax: b2b.estimatedTax,
      lowStock: store.lowStock.length,
      noStock: store.noStock.length
    },
    recommendations: [...b2b.recommendations, ...store.recommendations],
    whatsapp: b2b.whatsapp,
    text
  });
}

function parseRealizationTable(table) {
  const rows = table.rows || [];
  if (!rows.length) return [];
  const headers = normalizeHeader(rows[0]);
  const cols = {
    client: findColumn(headers, "", ["контрагент", "клиент", "покупатель", "мектеп", "школа", "сатыпалушы"]),
    bin: findColumn(headers, "", ["бин", "иин", "бсн", "жсн"]),
    item: findColumn(headers, "", ["номенклатура", "товар", "тауар", "наименование", "атауы"]),
    code: findColumn(headers, "", ["код", "артикул", "sku"]),
    qty: findColumn(headers, "", ["количество", "саны", "qty"]),
    amount: findColumn(headers, "", ["сумма", "итого", "сомасы", "реализация", "выручка"]),
    cost: findColumn(headers, "", ["себестоимость", "закуп", "сатып алу", "cost"]),
    date: findColumn(headers, "", ["дата", "күн", "date"]),
    doc: findColumn(headers, "", ["документ", "номер", "накладная", "реализация"])
  };
  return rows.slice(1).map(row => ({
    client: cell(row, cols.client),
    bin: cell(row, cols.bin),
    item: cell(row, cols.item),
    code: cell(row, cols.code),
    qty: parseMoney(cell(row, cols.qty)),
    amount: parseMoney(cell(row, cols.amount)),
    cost: parseMoney(cell(row, cols.cost)),
    date: cell(row, cols.date),
    doc: cell(row, cols.doc)
  })).filter(row => row.client || row.item || row.amount);
}

function parseKaspiTable(table) {
  const rows = table.rows || [];
  if (!rows.length) return [];
  const headers = normalizeHeader(rows[0]);
  const cols = {
    name: findColumn(headers, "", ["контрагент", "отправитель", "плательщик", "клиент", "наименование", "атауы"]),
    amount: findColumn(headers, "", ["сумма", "поступление", "кредит", "amount", "сомасы"]),
    date: findColumn(headers, "", ["дата", "күн", "date"]),
    purpose: findColumn(headers, "", ["назначение", "описание", "комментарий", "purpose", "детали"]),
    bin: findColumn(headers, "", ["бин", "иин", "бсн", "жсн"])
  };
  return rows.slice(1).map(row => ({
    name: cell(row, cols.name) || cell(row, cols.purpose),
    bin: cell(row, cols.bin),
    amount: parseMoney(cell(row, cols.amount)),
    date: cell(row, cols.date),
    purpose: cell(row, cols.purpose)
  })).filter(row => row.amount || row.name);
}

function parseCounterpartyTable(table) {
  const rows = table.rows || [];
  if (!rows.length) return [];
  const headers = normalizeHeader(rows[0]);
  const cols = {
    name: findColumn(headers, "", ["контрагент", "клиент", "наименование", "атауы", "школа", "мектеп"]),
    bin: findColumn(headers, "", ["бин", "иин", "бсн", "жсн"]),
    phone: findColumn(headers, "", ["телефон", "whatsapp", "ватсап", "phone"]),
    debt: findColumn(headers, "", ["долг", "қарыз", "карыз", "задолж"])
  };
  return rows.slice(1).map(row => ({
    name: cell(row, cols.name),
    bin: cell(row, cols.bin),
    phone: cell(row, cols.phone),
    debt: parseMoney(cell(row, cols.debt))
  })).filter(row => row.name || row.bin);
}

function parseNomenclatureTable(table) {
  const rows = table.rows || [];
  if (!rows.length) return [];
  const headers = normalizeHeader(rows[0]);
  const cols = {
    code: findColumn(headers, "", ["код", "артикул", "sku"]),
    name: findColumn(headers, "", ["номенклатура", "товар", "тауар", "наименование", "атауы"]),
    stock: findColumn(headers, "", ["остаток", "қалдық", "калдык", "склад", "наличие"]),
    supplier: findColumn(headers, "", ["поставщик", "жеткізуші", "supplier"]),
    buyPrice: findColumn(headers, "", ["закуп", "сатып алу", "себестоимость"]),
    sellPrice: findColumn(headers, "", ["цена", "сату", "баға", "бага", "розница"])
  };
  return rows.slice(1).map(row => ({
    code: cell(row, cols.code),
    name: cell(row, cols.name),
    stock: parseMoney(cell(row, cols.stock)),
    supplier: cell(row, cols.supplier),
    buyPrice: parseMoney(cell(row, cols.buyPrice)),
    sellPrice: parseMoney(cell(row, cols.sellPrice))
  })).filter(row => row.name || row.code);
}

function analyzeB2B(realization, kaspi, counterparties) {
  const paidByName = groupSum(kaspi, row => normalizeParty(row.name || row.purpose), row => row.amount);
  const paidByBin = groupSum(kaspi, row => normalizeParty(row.bin), row => row.amount);
  const counterpartyMap = new Map(counterparties.map(row => [normalizeParty(row.name), row]));
  const schools = [...groupRows(realization, row => normalizeParty(row.client || row.bin)).entries()].map(([key, rows]) => {
    const first = rows[0] || {};
    const name = first.client || key || "Контрагент жоқ";
    const sold = rows.reduce((sum, row) => sum + row.amount, 0);
    const cost = rows.reduce((sum, row) => sum + (row.cost || 0), 0);
    const paid = paidByBin.get(normalizeParty(first.bin)) || paidByName.get(normalizeParty(name)) || fuzzyPaid(name, kaspi);
    const cp = counterpartyMap.get(normalizeParty(name)) || {};
    const debt = Math.max(0, sold - paid) || Math.max(0, cp.debt || 0);
    const margin = sold - cost;
    return { name, bin: first.bin, sold, paid, debt, margin, phone: cp.phone || "", rows };
  }).sort((a, b) => b.debt - a.debt || b.sold - a.sold);
  const totalSales = schools.reduce((sum, row) => sum + row.sold, 0);
  const totalPaid = schools.reduce((sum, row) => sum + row.paid, 0);
  const totalDebt = schools.reduce((sum, row) => sum + row.debt, 0);
  const margin = schools.reduce((sum, row) => sum + row.margin, 0);
  const estimatedTax = Math.max(0, totalSales * 0.03);
  const unpaidSchools = schools.filter(row => row.debt > 0);
  const whatsapp = unpaidSchools.slice(0, 10).map(row => whatsappDebtText(row));
  const recommendations = [
    ...unpaidSchools.slice(0, 5).map(row => `${row.name}: төлем түспеген/қарыз ${money(row.debt)}. WhatsApp follow-up жіберу.`),
    ...schools.filter(row => row.sold > 0 && row.debt === 0).slice(0, 3).map(row => `${row.name}: төлем тәртібі жақсы, келесі айға повторный ұсыныс жіберу.`)
  ];
  return { schools, totalSales, totalPaid, totalDebt, margin, estimatedTax, unpaidSchools, whatsapp, recommendations };
}

function analyzeStore(nomenclature, realization) {
  const soldByCode = groupSum(realization, row => normalizeParty(row.code || row.item), row => row.qty || 1);
  const items = nomenclature.map(item => ({
    ...item,
    soldQty: soldByCode.get(normalizeParty(item.code || item.name)) || 0,
    marginEach: (item.sellPrice || 0) - (item.buyPrice || 0)
  }));
  const noStock = items.filter(item => item.stock === 0);
  const lowStock = items.filter(item => item.stock > 0 && item.stock <= 3);
  const topSold = [...items].sort((a, b) => b.soldQty - a.soldQty).slice(0, 10);
  const bySupplier = groupRows(lowStock.concat(noStock), row => row.supplier || "Поставщик жоқ");
  const supplierOrders = [...bySupplier.entries()].map(([supplier, rows]) => ({ supplier, rows }));
  const recommendations = [
    ...noStock.slice(0, 6).map(item => `${item.name || item.code}: складта жоқ, заказ беру керек${item.supplier ? ` (${item.supplier})` : ""}.`),
    ...lowStock.slice(0, 6).map(item => `${item.name || item.code}: аз қалды (${item.stock}), минимум заказ жоспарына қосу.`),
    ...topSold.filter(item => item.soldQty > 0).slice(0, 5).map(item => `${item.name || item.code}: жақсы өтіп жатыр (${item.soldQty}), витрина/қорды күшейту.`)
  ];
  return { items, noStock, lowStock, topSold, supplierOrders, recommendations };
}

function crmBusinessReportText({ b2b, store, type, files, project }) {
  const sections = [
    `CRM толық отчет: ${new Date().toLocaleString("kk-KZ")}`,
    `Жоба: ${project || "Аталмаған жоба"}`,
    `Жүктелген файлдар: ${files.join(", ") || "жоқ"}`,
    "",
    "Бұл отчет толық болуы үшін керек файлдар:",
    "- 1С Реализациялар: мектеп/контрагент, товар, сумма, себестоимость, дата",
    "- Kaspi выписка: плательщик/назначение, сумма, дата",
    "- 1С Контрагенттер: атауы, БИН, телефон/WhatsApp, қарыз",
    "- 1С Номенклатура/Остаток: код, атауы, қалдық, поставщик, сатып алу/сату бағасы"
  ];
  if (type !== "store") {
    sections.push(
      "",
      "B2B мектептер бойынша:",
      `- Реализация шамасы: ${money(b2b.totalSales)}`,
      `- Kaspi/банк бойынша түскен төлем: ${money(b2b.totalPaid)}`,
      `- Шамамен қарыз: ${money(b2b.totalDebt)}`,
      `- Шамамен маржа: ${money(b2b.margin)}`,
      `- Шамамен налог (3% есеппен): ${money(b2b.estimatedTax)}`,
      "",
      "Төлем түспеген / қарызы бар мектептер:",
      b2b.unpaidSchools.slice(0, 15).map((row, index) => `${index + 1}. ${row.name}: реализация ${money(row.sold)}, төлем ${money(row.paid)}, қарыз ${money(row.debt)}`).join("\n") || "Қарыз анықталмады.",
      "",
      "WhatsApp дайын тексттері:",
      b2b.whatsapp.join("\n\n---\n\n") || "Қарыз бар мектеп табылса, текст осы жерде шығады."
    );
  }
  if (type !== "b2b") {
    sections.push(
      "",
      "Магазин / склад бойынша:",
      `- Номенклатура саны: ${store.items.length}`,
      `- Складта жоқ товар: ${store.noStock.length}`,
      `- Аз қалған товар: ${store.lowStock.length}`,
      "",
      "Заказ беру керек товарлар:",
      store.noStock.concat(store.lowStock).slice(0, 20).map((item, index) => `${index + 1}. ${item.code || "-"} · ${item.name || "-"} · қалдық ${item.stock} · поставщик ${item.supplier || "-"}`).join("\n") || "Аз/жоқ товар табылмады.",
      "",
      "Жақсы өтіп жатқан товарлар:",
      store.topSold.filter(item => item.soldQty > 0).map((item, index) => `${index + 1}. ${item.name || item.code} · сатылған саны ${item.soldQty} · маржа/дана ${money(item.marginEach)}`).join("\n") || "Сату саны бар номенклатура табылмады.",
      "",
      "Поставщик бойынша заказ:",
      store.supplierOrders.slice(0, 12).map(group => `${group.supplier}: ${group.rows.slice(0, 8).map(item => item.name || item.code).join(", ")}`).join("\n") || "Поставщик бойынша заказ тізімі жоқ."
    );
  }
  sections.push(
    "",
    "Ұсыныстар:",
    b2b.recommendations.concat(store.recommendations).slice(0, 20).map((item, index) => `${index + 1}. ${item}`).join("\n") || "Ұсыныс жасау үшін көбірек 1С/Kaspi дерегін жүктеңіз."
  );
  return sections.join("\n");
}

function whatsappDebtText(row) {
  return [
    `${row.name} бойынша WhatsApp текст:`,
    `Сәлеметсіз бе! Біздің құжат бойынша сіздерде ${money(row.debt)} төлем қалды деп көрініп тұр.`,
    `Реализация сомасы: ${money(row.sold)}. Түскен төлем: ${money(row.paid)}.`,
    "Өтінеміз, төлем статусын нақтылап жібересіз бе? Егер төленген болса, платежка/чек жіберіңіз."
  ].join("\n");
}

function saveCrmBusinessReport() {
  const report = state.crmReports?.[0];
  if (!report?.text) {
    if ($("crmReportOut")) $("crmReportOut").textContent = "Алдымен толық отчет жасаңыз.";
    return;
  }
  const doc = normalizeDoc({
    name: `${report.title}.txt`,
    type: "crm_report",
    text: report.text,
    tags: ["crm", "b2b", "магазин", "отчет"],
    links: ["CRM", "1С", "Kaspi"],
    folder: report.folder,
    category: "crm_report",
    business: report.business,
    project: report.project
  });
  state.docs.unshift(doc);
  state.notes.unshift(normalizeNote({ title: report.title, folder: "CRM", type: "long", body: report.text, tags: ["crm", "отчет"], brain: true }));
  createCrmCalendarDocument(report.title, report.text);
  persist();
  render();
  if ($("crmReportOut")) $("crmReportOut").textContent = `${report.text}\n\n---\nОтчет CRM, Notes, Brain және Күнтізбе құжаттарына сақталды.`;
}

function tasksFromCrmBusinessReport() {
  const report = state.crmReports?.[0];
  if (!report?.recommendations?.length) {
    if ($("crmReportOut")) $("crmReportOut").textContent = "Task жасау үшін алдымен отчет жасаңыз.";
    return;
  }
  report.recommendations.slice(0, 8).forEach(title => {
    state.tasks.unshift(normalizeTask({ title, body: report.title, status: "todo", priority: "high", due: addDays(isoDate(), 1), owner: "CRM", link: "CRM отчет" }));
  });
  persist();
  render();
  if ($("crmReportOut")) $("crmReportOut").textContent = `${report.text}\n\n---\nҰсыныстардан ${Math.min(8, report.recommendations.length)} task жасалды.`;
}

function renderCrmReportDashboard() {
  if (!$("crmReportDashboard")) return;
  const report = state.crmReports?.[0] || {};
  const summary = report.summary || {};
  $("crmReportDashboard").innerHTML = [
    ["Реализация", money(summary.sales || 0)],
    ["Төлем", money(summary.paid || 0)],
    ["Қарыз", money(summary.debt || 0)],
    ["Маржа", money(summary.margin || 0)],
    ["Налог шамасы", money(summary.estimatedTax || 0)],
    ["Аз/жоқ товар", (summary.lowStock || 0) + (summary.noStock || 0)]
  ].map(([label, value]) => `<article class="crm-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");
  renderCrmSmartArchive();
}

function normalizeCrmReport(report = {}) {
  const business = report.business || (report.type === "b2b" ? "school" : report.type === "store" ? "store" : "mixed");
  const project = report.project || report.title || `CRM ${isoDate()}`;
  return {
    id: report.id || crypto.randomUUID(),
    title: report.title || "CRM отчет",
    type: report.type || "both",
    business,
    project,
    folder: report.folder || `${businessLabel(business)} / ${project}`,
    sourceTypes: Array.isArray(report.sourceTypes) ? report.sourceTypes : [],
    createdAt: report.createdAt || new Date().toISOString(),
    summary: report.summary || {},
    recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    whatsapp: Array.isArray(report.whatsapp) ? report.whatsapp : [],
    text: report.text || ""
  };
}

function renderCrmSmartArchive() {
  if (!$("crmFolderBoard") || !$("crmReportHistory")) return;
  const docs = state.docs.map(normalizeDoc);
  const reports = (state.crmReports || []).map(normalizeCrmReport);
  const folderMap = new Map();
  docs.forEach(doc => addCrmFolderItem(folderMap, doc.folder || smartDocMeta(doc.name, doc.text, doc.type).folder, "doc", doc));
  reports.forEach(report => addCrmFolderItem(folderMap, report.folder, "report", report));
  const folders = [...folderMap.entries()].sort((a, b) => b[1].updated.localeCompare(a[1].updated));
  $("crmFolderBoard").innerHTML = folders.map(([folder, data]) => `
    <article class="crm-folder-card">
      <strong>${escapeHtml(folder)}</strong>
      <span>${data.docs} құжат · ${data.reports} отчет</span>
      <small>${escapeHtml(data.examples.slice(0, 3).join(", ") || "ішінде жазба жоқ")}</small>
    </article>
  `).join("") || `<article class="crm-folder-card"><strong>Папка жоқ</strong><span>Құжат немесе CRM отчет жасаңыз.</span></article>`;
  $("crmReportHistory").innerHTML = reports.slice(0, 10).map(report => `
    <article class="crm-report-card">
      <div>
        <strong>${escapeHtml(report.title)}</strong>
        <span>${escapeHtml(formatDate(report.createdAt))} · ${escapeHtml(report.folder)}</span>
      </div>
      <p>Реализация ${money(report.summary.sales || 0)} · Қарыз ${money(report.summary.debt || 0)} · Маржа ${money(report.summary.margin || 0)}</p>
      <button type="button" data-crm-report-view="${escapeHtml(report.id)}">Толық көру</button>
    </article>
  `).join("") || `<article class="crm-report-card"><strong>CRM отчет жоқ</strong><p>Толық отчет жасағанда осы жерде сақталады.</p></article>`;
  $("crmReportHistory").querySelectorAll("[data-crm-report-view]").forEach(button => {
    button.addEventListener("click", () => viewCrmReport(button.dataset.crmReportView));
  });
}

function addCrmFolderItem(map, folder, kind, item) {
  const key = folder || "Жеке құжаттар";
  if (!map.has(key)) map.set(key, { docs: 0, reports: 0, examples: [], updated: "" });
  const data = map.get(key);
  data[kind === "report" ? "reports" : "docs"] += 1;
  data.examples.push(item.title || item.name || "Жазба");
  data.updated = [data.updated, item.createdAt || ""].sort().pop() || "";
}

function viewCrmReport(id) {
  const report = (state.crmReports || []).map(normalizeCrmReport).find(item => item.id === id);
  if (!report) return;
  if ($("crmReportOut")) $("crmReportOut").textContent = report.text;
  if ($("crmReportProject")) $("crmReportProject").value = report.project || "";
}

function cell(row, index) {
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}

function normalizeParty(value) {
  return normalizeText(value).replace(/\b(тоо|ип|кгу|кмм|школа|мектеп|гккп|кгкп)\b/g, "").replace(/\s+/g, " ").trim();
}

function groupRows(rows, keyFn) {
  return rows.reduce((map, row) => {
    const key = keyFn(row) || "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());
}

function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  rows.forEach(row => {
    const key = keyFn(row);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + Number(valueFn(row) || 0));
  });
  return map;
}

function fuzzyPaid(name, kaspi) {
  const clean = normalizeParty(name);
  if (!clean) return 0;
  return kaspi
    .filter(row => normalizeParty(`${row.name} ${row.purpose}`).includes(clean) || clean.includes(normalizeParty(row.name)))
    .reduce((sum, row) => sum + row.amount, 0);
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
  const body = $("taskBody").value.trim();
  state.tasks.unshift(normalizeTask({
    id: crypto.randomUUID(),
    title,
    body,
    checklist: taskChecklistFromBody(body),
    status: $("taskStatus").value || "todo",
    priority: $("taskPriority").value || "medium",
    due: $("taskDue").value || "",
    owner: $("taskOwner").value.trim(),
    link: $("taskLink").value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  ["taskTitle", "taskBody", "taskDue", "taskOwner", "taskLink"].forEach(id => { $(id).value = ""; });
  $("taskPriority").value = "medium";
  $("taskStatus").value = "todo";
  persist();
  render();
}

function moveTask(id, status) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  const wasDone = task.status === "done";
  task.status = status;
  task.updatedAt = new Date().toISOString();
  persist();
  render();
  if (status === "done" && !wasDone) sanaBotReactToTask(task);
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
    orderNumber: input.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
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
    totalAmount: input.totalAmount ?? input.amount,
    costAmount: input.costAmount || 0,
    marginAmount: input.marginAmount ?? ((input.totalAmount ?? input.amount) - (input.costAmount || 0)),
    paidAmount: input.paidAmount || 0,
    debtAmount: input.debtAmount ?? ((input.totalAmount ?? input.amount) - (input.paidAmount || 0)),
    productName: input.productName || "",
    quantity: input.quantity || 0,
    purchasePrice: input.purchasePrice || 0,
    salePrice: input.salePrice || 0,
    paymentMethod: input.paymentMethod || "",
    paymentStatus: input.paymentStatus || "",
    documentStatus: input.documentStatus || "",
    esfStatus: input.esfStatus || "",
    oneCStatus: input.oneCStatus || "",
    clientName: input.clientName || "",
    schoolName: input.schoolName || input.clientName || "",
    date: input.date || isoDate(),
    productsJson: input.productName || input.comment,
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

function setBackupStatus(message) {
  const out = $("backupOut");
  if (out) out.textContent = message;
}

function backupKeyList() {
  const exactKeys = [
    "sanabase-state",
    "sanabase-cloud",
    "sanabase-reminders-enabled",
    "goals",
    "projects",
    "challenges",
    "zhadyra_goals",
    "zhadyra_projects",
    "zhadyra_plans",
    "zhadyra_tasks",
    "zhadyra_habits",
    "zhadyra_challenges",
    "zhadyra_1c_excel",
    "zhadyra_crm_reports",
    "zhadyra_cfo"
  ];
  const keys = new Set();
  exactKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) keys.add(key);
  });
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (key.startsWith("sanabase-") || key.startsWith("zhadyra_") || key.startsWith("sanabot-")) keys.add(key);
  }
  return [...keys].sort();
}

function buildBackupPayload() {
  const keys = backupKeyList();
  const data = {};
  keys.forEach(key => {
    data[key] = localStorage.getItem(key);
  });
  return {
    metadata: {
      app: "SanaBase",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      keys
    },
    data
  };
}

function exportAllData() {
  const backup = buildBackupPayload();
  downloadJson(`sanabase-backup-${isoDate()}.json`, backup);
  setBackupStatus(`Export ready.\nVersion: ${backup.metadata.version}\nKeys: ${backup.metadata.keys.length}\nFile: sanabase-backup-${isoDate()}.json`);
}

function isValidBackupPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.metadata || payload.metadata.app !== "SanaBase") return false;
  if (!Array.isArray(payload.metadata.keys)) return false;
  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) return false;
  return payload.metadata.keys.every(key =>
    typeof key === "string" &&
    Object.prototype.hasOwnProperty.call(payload.data, key) &&
    (typeof payload.data[key] === "string" || payload.data[key] === null)
  );
}

async function importBackupData() {
  const input = $("importBackupFile");
  const file = input?.files?.[0];
  if (!file) {
    setBackupStatus("Choose a SanaBase backup JSON file first.");
    return;
  }

  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    setBackupStatus("Import failed: JSON file could not be read.");
    return;
  }

  if (!isValidBackupPayload(backup)) {
    setBackupStatus("Import failed: this is not a valid SanaBase backup file.");
    return;
  }

  const keys = backup.metadata.keys;
  const exportedAt = backup.metadata.exportedAt || "unknown";
  const ok = confirm(`Restore SanaBase backup?\n\nFile: ${file.name}\nExported: ${exportedAt}\nKeys: ${keys.length}\n\nThis will overwrite these localStorage values in this browser.`);
  if (!ok) {
    setBackupStatus("Import cancelled. No data was changed.");
    return;
  }

  keys.forEach(key => {
    const value = backup.data[key];
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  });

  const restoredState = loadState();
  Object.keys(state).forEach(key => delete state[key]);
  Object.assign(state, restoredState);
  render();
  renderCloudSettings();
  updateNotifyUi();
  setBackupStatus(`Import complete.\nRestored keys: ${keys.length}\nRefresh the page to double-check CRM, Tasks and Goals.`);
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
    oneC: state.oneC,
    crmReports: state.crmReports
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
    const incomingCrmReports = Array.isArray(data.crmReports) ? data.crmReports : [];
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
    state.crmReports = Array.isArray(state.crmReports) ? state.crmReports : [];
    const existingCrmReportKeys = new Set((state.crmReports || []).map(report => report.id || report.title));
    incomingCrmReports.forEach(report => {
      const key = report.id || report.title;
      if (!existingCrmReportKeys.has(key)) {
        state.crmReports.unshift(normalizeCrmReport(report));
        existingCrmReportKeys.add(key);
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
        crmReports: state.crmReports,
        savedAt: new Date().toISOString(),
        version: 8
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
    state.crmReports = Array.isArray(payload.crmReports) ? payload.crmReports.map(normalizeCrmReport) : [];
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
    return await requestAi({
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

function localAnswer(mode, prompt, language, assistantMode = "auto") {
  const context = buildContext();
  if (mode === "sanabot") return sanaBotMockReply(prompt);
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
  modes.sanabot = "Mimo персонажы сияқты жауап бер: жылы, қысқа, нақты, бизнес дерегіне сүйенген. Тапсырма, қарыз, заказ, склад, күндік фокус бойынша 1-3 келесі әрекет шығар.";
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
  const meta = smartDocMeta(doc.name || "", text, doc.type || "unknown");
  return {
    id: doc.id || crypto.randomUUID(),
    name: doc.name || "Imported document",
    type: doc.type || "unknown",
    text,
    warning: doc.warning || "",
    tags: Array.isArray(doc.tags) && doc.tags.length ? doc.tags : inferTags(doc.name || "", text),
    links: Array.isArray(doc.links) ? doc.links : [],
    category: doc.category || meta.category,
    business: doc.business || meta.business,
    project: doc.project || meta.project,
    folder: doc.folder || meta.folder,
    createdAt: doc.createdAt || new Date().toISOString()
  };
}

function smartDocMeta(name, text = "", type = "unknown") {
  const source = normalizeText(`${name} ${text.slice(0, 3000)}`);
  const category = detectDocCategory(source, type);
  const business = detectDocBusiness(source, category);
  const project = detectDocProject(name, business);
  return {
    category,
    business,
    project,
    folder: `${businessLabel(business)} / ${categoryLabel(category)}`
  };
}

function detectDocCategory(source, type) {
  if (type === "crm_report" || /crm|отчет|есеп|report/.test(source)) return "crm_report";
  if (/реализац|наклад|продаж|сатылым|сату/.test(source)) return "realization";
  if (/контрагент|клиент|покупатель|мектеп|школа/.test(source)) return "counterparty";
  if (/счет|счёт|invoice|шот|счетфактура|эсф|esf/.test(source)) return "invoice";
  if (/kaspi|каспи|выписк|банк|платеж|төлем|оплата/.test(source)) return "bank_statement";
  if (/номенклатур|остат|склад|тауар|товар|артикул|stock/.test(source)) return "nomenclature";
  if (/договор|келісім|contract/.test(source)) return "contract";
  return "personal";
}

function detectDocBusiness(source, category) {
  if (/мектеп|школа|b2b|контрагент|реализац/.test(source)) return "school";
  if (/магазин|склад|номенклатур|остат|поставщик|тауар|товар/.test(source) || category === "nomenclature") return "store";
  if (category === "bank_statement" || category === "crm_report") return "mixed";
  return "personal";
}

function detectDocProject(name, business) {
  const clean = String(name || "").replace(/\.[^.]+$/, "").slice(0, 80);
  return clean || `${businessLabel(business)} ${isoDate()}`;
}

function businessLabel(value) {
  return { school: "Мектептер / B2B", store: "Магазин / склад", mixed: "Ортақ CRM", personal: "Жеке құжаттар" }[value] || "Ортақ CRM";
}

function categoryLabel(value) {
  return {
    crm_report: "Дайын CRM отчеттар",
    realization: "Реализациялар",
    counterparty: "Контрагенттер",
    invoice: "Счеттар / ESF",
    bank_statement: "Kaspi / банк выписка",
    nomenclature: "Номенклатура / склад",
    contract: "Договорлар",
    personal: "Жеке құжаттар"
  }[value] || "Жеке құжаттар";
}

function taskChecklistFromBody(body = "") {
  const lines = String(body || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const listLike = lines.filter(line => /^([-*•]|□|☐|✓|✔|\[[ xх]\]|\d+[.)])\s*/i.test(line));
  const source = listLike.length ? listLike : (lines.length > 1 ? lines : []);
  return source.map((line, index) => {
    const done = /^(✓|✔|\[[xх]\])/i.test(line);
    const text = line
      .replace(/^([-*•]|□|☐|✓|✔|\[[ xх]\]|\d+[.)])\s*/i, "")
      .trim();
    return { id: `check-${index}-${crypto.randomUUID()}`, text: text || line, done };
  }).filter(item => item.text);
}

function taskBodyIntro(task) {
  const checklist = task.checklist || [];
  if (!checklist.length) return task.body || "";
  const checklistTexts = new Set(checklist.map(item => normalizeText(item.text)));
  return String(task.body || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !checklistTexts.has(normalizeText(line.replace(/^([-*•]|□|☐|✓|✔|\[[ xх]\]|\d+[.)])\s*/i, ""))))
    .filter(line => normalizeText(line) !== normalizeText(task.title))
    .join("\n");
}

function taskChecklistProgress(checklist = []) {
  const total = checklist.length;
  const done = checklist.filter(item => item.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}
function toggleTaskChecklist(taskId, itemId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  task.checklist = Array.isArray(task.checklist) ? task.checklist : taskChecklistFromBody(task.body);
  const item = task.checklist.find(check => check.id === itemId);
  if (!item) return;
  const wasDone = task.status === "done";
  item.done = !item.done;
  const progress = taskChecklistProgress(task.checklist);
  if (progress.total && progress.done === progress.total) task.status = "done";
  else if (task.status === "done") task.status = "doing";
  task.updatedAt = new Date().toISOString();
  persist();
  render();
  if (task.status === "done" && !wasDone) sanaBotReactToTask(task);
}

function openTaskDetail(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  const checklist = Array.isArray(task.checklist) ? task.checklist : taskChecklistFromBody(task.body);
  const progress = taskChecklistProgress(checklist);
  const intro = taskBodyIntro(task);
  const old = $("taskModalRoot");
  if (old) old.remove();
  const root = document.createElement("div");
  root.id = "taskModalRoot";
  root.className = "task-modal-backdrop";
  root.innerHTML = `
    <section class="task-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(task.title)}">
      <div class="task-modal-head">
        <div>
          <h3>${escapeHtml(task.title)}</h3>
          <span>${escapeHtml(priorityLabel(task.priority))}${task.due ? ` · ${escapeHtml(task.due)}` : ""}</span>
        </div>
        <button type="button" data-task-modal-close>Жабу</button>
      </div>
      ${progress.total ? `<div class="task-progress"><div><strong>${progress.done}/${progress.total} орындалды</strong><span>${progress.percent}%</span></div><meter min="0" max="100" value="${progress.percent}"></meter></div>` : ""}
      ${intro ? `<p class="task-body-full">${escapeHtml(intro)}</p>` : ""}
      <div class="task-checklist full">
        ${checklist.map(item => `<label><input type="checkbox" data-task-check="${escapeHtml(task.id)}" data-check-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""}> <span>${escapeHtml(item.text)}</span></label>`).join("") || `<p class="task-body-full">${escapeHtml(task.body || "Сипаттама жоқ")}</p>`}
      </div>
    </section>
  `;
  document.body.appendChild(root);
  root.querySelectorAll("[data-task-modal-close]").forEach(button => button.addEventListener("click", () => root.remove()));
  root.addEventListener("click", event => { if (event.target === root) root.remove(); });
  root.querySelectorAll("[data-task-check]").forEach(input => {
    input.addEventListener("change", () => {
      toggleTaskChecklist(input.dataset.taskCheck, input.dataset.checkId);
      openTaskDetail(taskId);
    });
  });
}
function normalizeTask(task) {
  const body = task.body || "";
  const parsedChecklist = taskChecklistFromBody(body);
  const checklist = Array.isArray(task.checklist) && task.checklist.length
    ? task.checklist.map((item, index) => ({ id: item.id || `item-${index}-${crypto.randomUUID()}`, text: item.text || item.title || "Пункт", done: Boolean(item.done) }))
    : parsedChecklist;
  return {
    id: task.id || crypto.randomUUID(),
    title: task.title || "Untitled task",
    body,
    checklist,
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
  const crmReports = (state.crmReports || [])
    .slice(0, 3)
    .map(report => `CRM отчет: ${report.title}\n${report.text}`);
  return docs.concat(images, tasks, notes, goals, projects, plans, challenges, oneC, crmReports).join("\n\n---\n\n");
}

function addMessage(kind, text) {
  const node = document.createElement("div");
  node.className = `message ${kind}`;
  node.textContent = text;
  $("messages").appendChild(node);
  $("messages").scrollTop = $("messages").scrollHeight;
  return node;
}

function initMimo() {
  if (!$("sanabotMessages")) return;
  renderMimoFocus();
  setMimoMood(sanaBotDashboardMood());
  if (!$("sanabotMessages").children.length) {
    addMimoMessage("bot", "Сәлем, мен Mimo-пын. Бүгінгі фокус, заказ, қарыз, склад және күндік отчет бойынша көмектесемін. Әзірге local mock режиміндемін.");
  }
  startMimoRoaming();
  maybeMimoDailyNudge();
}

function maybeMimoDailyNudge() {
  const root = $("sanabot");
  if (!root) return;
  const key = `sanabot-daily-nudge-${isoDate()}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  setTimeout(() => {
    const metrics = sanaBotMetrics();
    const important = metrics.todayTasks + metrics.openOrders + metrics.docs + metrics.lowStock + (metrics.unpaid > 0 ? 1 : 0);
    const message = important
      ? [
          `Бүгін ${important} маңызды сигнал бар.`,
          `Фокус: ${metrics.focus}`,
          `Task: ${metrics.todayTasks} · заказ: ${metrics.openOrders} · қарыз: ${money(metrics.unpaid)} · склад сигналы: ${metrics.lowStock}`,
          "Mimo ұсынысы: ең қауіпті бір нәрсені таңдап, бірден task немесе WhatsApp текст қылып қойыңыз."
        ].join("\n")
      : [
          "Бүгін жүйе тыныш көрініп тұр.",
          `Фокус: ${metrics.focus}`,
          "Mimo ұсынысы: бір қысқа task қосып, күнді жеңіл бастаңыз."
        ].join("\n");
    moveMimoHome();
    root.classList.add("open", "is-waving");
    setMimoMood(important ? "alert" : "focus");
    addMimoMessage("bot", message);
    rememberMimoAnswer(message, important ? "daily" : "today");
    setTimeout(() => root.classList.remove("is-waving"), 3800);
  }, 850);
}

function startMimoRoaming() {
  const root = $("sanabot");
  if (!root || sanaBotRoamTimer) return;
  moveMimoHome();
  const roam = () => {
    if (!root.classList.contains("open")) moveMimoRandom();
  };
  setTimeout(roam, 1300);
  sanaBotRoamTimer = setInterval(roam, 5200);
  window.addEventListener("resize", () => root.classList.contains("open") ? moveMimoHome() : moveMimoRandom());
}

function moveMimoHome() {
  const root = $("sanabot");
  if (!root) return;
  root.style.setProperty("--sanabot-x", `${Math.max(16, window.innerWidth - 94)}px`);
  root.style.setProperty("--sanabot-y", `${Math.max(16, window.innerHeight - 94)}px`);
  root.classList.remove("is-roaming-left");
}

function moveMimoRandom() {
  const root = $("sanabot");
  if (!root) return;
  const margin = window.innerWidth < 700 ? 14 : 22;
  const maxX = Math.max(margin, window.innerWidth - 92);
  const maxY = Math.max(margin + 72, window.innerHeight - 98);
  const minY = window.innerWidth < 700 ? 86 : 74;
  const nextX = Math.round(margin + Math.random() * (maxX - margin));
  const nextY = Math.round(minY + Math.random() * (maxY - minY));
  const currentX = Number.parseFloat(root.style.getPropertyValue("--sanabot-x")) || maxX;
  root.style.setProperty("--sanabot-x", `${nextX}px`);
  root.style.setProperty("--sanabot-y", `${nextY}px`);
  root.classList.toggle("is-roaming-left", nextX < currentX);
}

function toggleMimo() {
  const root = $("sanabot");
  if (!root) return;
  root.classList.toggle("open");
  if (root.classList.contains("open")) moveMimoHome();
  renderMimoFocus();
}

function closeMimo() {
  $("sanabot")?.classList.remove("open");
  setTimeout(moveMimoRandom, 400);
}

function addMimoMessage(kind, text) {
  const box = $("sanabotMessages");
  if (!box) return;
  const node = document.createElement("div");
  node.className = `sanabot-msg ${kind}`;
  node.textContent = text;
  box.appendChild(node);
  box.scrollTop = box.scrollHeight;
  return node;
}

async function sendMimoMessage(event) {
  event.preventDefault();
  const input = $("sanabotInput");
  const text = input?.value.trim();
  if (!text) return;
  input.value = "";
  addMimoMessage("user", text);
  setMimoMood("thinking");
  const pending = addMimoMessage("bot", "Ойланып жатырмын...");
  const answer = await sanaBotAiReply(text, "chat");
  pending.textContent = answer;
  rememberMimoAnswer(answer, "chat");
}

async function runMimoAction(action) {
  addMimoMessage("user", sanaBotActionLabel(action));
  const local = sanaBotActionReply(action);
  setMimoMood(action === "debt" || action === "stock" ? "alert" : action === "daily" ? "focus" : "thinking");
  const pending = addMimoMessage("bot", local);
  const answer = await sanaBotAiReply(`${sanaBotActionLabel(action)}\n\nLocal summary:\n${local}`, action, local);
  pending.textContent = answer;
  rememberMimoAnswer(answer, action);
  renderMimoFocus();
}

function renderMimoFocus() {
  const focus = $("sanabotFocus");
  if (!focus) return;
  const metrics = sanaBotMetrics();
  focus.innerHTML = `
    <span>Бүгінгі фокус</span>
    <strong>${escapeHtml(metrics.focus)}</strong>
    <small>${metrics.todayTasks} task · ${metrics.openOrders} заказ · ${money(metrics.unpaid)} қарыз</small>
  `;
  setMimoMood(sanaBotDashboardMood(), false);
}

function rememberMimoAnswer(text, action) {
  lastMimoAnswer = text || "";
  lastMimoAction = action || "chat";
  if ($("sanabotSuggestions")) $("sanabotSuggestions").classList.toggle("show", Boolean(lastMimoAnswer));
  updateMimoActionCards();
  if (lastMimoAction === "debt" || /қарыз|карыз|төлем|оплата|debt/i.test(lastMimoAnswer)) setMimoMood("alert");
  else if (lastMimoAction === "stock" || /склад|остат|тауар|stock/i.test(lastMimoAnswer)) setMimoMood("alert");
  else setMimoMood("focus");
}

function updateMimoActionCards() {
  const text = `${lastMimoAction} ${lastMimoAnswer}`.toLowerCase();
  toggleMimoCard("sanabotWhatsappBtn", /қарыз|карыз|төлем|оплата|debt|whatsapp/.test(text));
  toggleMimoCard("sanabotDebtTaskBtn", /қарыз|карыз|төлем|оплата|debt/.test(text));
  toggleMimoCard("sanabotSupplierTaskBtn", /склад|остат|тауар|товар|stock|поставщик|заказ/.test(text));
  toggleMimoCard("sanabotOpenReportBtn", Boolean(state.crmReports?.length));
}

function toggleMimoCard(id, show) {
  const node = $(id);
  if (node) node.classList.toggle("is-suggested", Boolean(show));
}

function setMimoMood(mood, force = true) {
  const root = $("sanabot");
  if (!root) return;
  if (!force && root.dataset.mood === "happy") return;
  const next = mood || "ready";
  root.dataset.mood = next;
  const labels = {
    ready: "Mimo · ready",
    focus: "Focus mode · жоспар",
    alert: "Alert mode · тексеру керек",
    happy: "Happy mode · жарайсыз",
    thinking: "Thinking · бұртиып ойлануда",
    sad: "Sad mode · бұртиып қалды",
    angry: "Angry mode · қабағын түйді"
  };
  if ($("sanabotMoodText")) $("sanabotMoodText").textContent = labels[next] || labels.ready;
}

function sanaBotDashboardMood() {
  const metrics = sanaBotMetrics();
  if (metrics.unpaid > 0 || metrics.lowStock > 0 || metrics.docs > 0) return "alert";
  if (metrics.todayTasks || metrics.openOrders) return "focus";
  return "ready";
}

function sanaBotMetrics() {
  const cal = calendarData();
  const today = isoDate();
  const todayTasks = state.tasks.filter(task => task.status !== "done" && (!task.due || task.due <= today));
  const plans = (state.plans || []).filter(plan => plan.date === today && plan.status !== "done");
  const openOrders = activeCalItems(cal.orders).filter(order => !["closed", "received"].includes(order.status));
  const unpaid = activeCalItems(cal.payments).filter(payment => payment.status !== "paid").reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0);
  const docs = activeCalItems(cal.documents).filter(doc => doc.esfDeadline && doc.esfStatus !== "sent");
  const stock = state.oneC?.summary || {};
  const focus = plans[0]?.title || todayTasks[0]?.title || (openOrders.length ? "Заказдарды реттеу" : unpaid ? "Қарыздарды тексеру" : "Күнді жеңіл жоспарлау");
  return {
    today,
    focus,
    todayTasks: todayTasks.length,
    openOrders: openOrders.length,
    unpaid,
    docs: docs.length,
    lowStock: Number(stock.lowStock || 0) + Number(stock.noStock || 0)
  };
}

function sanaBotActionLabel(action) {
  return { today: "Бүгінгі жоспар", debt: "Қарыздарды тексер", orders: "Заказдарды тексер", stock: "Складты қара", daily: "Күндік отчет" }[action] || "Mimo";
}

function sanaBotActionReply(action) {
  const metrics = sanaBotMetrics();
  const cal = calendarData();
  if (action === "today") {
    const tasks = state.tasks.filter(task => task.status !== "done" && (!task.due || task.due <= metrics.today)).slice(0, 5);
    return [`Бүгінгі фокус: ${metrics.focus}.`, `Ашық task: ${metrics.todayTasks}.`, tasks.map((task, index) => `${index + 1}. ${task.title}`).join("\n") || "Бүгінге нақты task жоқ. Бір кішкентай task қосуды ұсынамын."].join("\n");
  }
  if (action === "debt") {
    const debts = activeCalItems(cal.payments).filter(payment => payment.status !== "paid").slice(0, 5);
    return [`Қарыз/төлем бақылауы: ${money(metrics.unpaid)}.`, debts.map((payment, index) => `${index + 1}. ${payment.title}: ${money(payment.amount)} · ${payment.dueDate || "күні жоқ"}`).join("\n") || "Қарыз жазбасы табылмады."].join("\n");
  }
  if (action === "orders") {
    const orders = activeCalItems(cal.orders).filter(order => !["closed", "received"].includes(order.status)).slice(0, 5);
    return [`Ашық заказдар: ${metrics.openOrders}.`, orders.map((order, index) => `${index + 1}. ${order.title} · ${crmStatusLabel(order.status)} · ${order.expectedDeliveryDate || "күні жоқ"}`).join("\n") || "Ашық заказ жоқ."].join("\n");
  }
  if (action === "stock") {
    return `Склад сигналы: аз/жоқ товар ${metrics.lowStock}. Толық көру үшін 1С Excel немесе CRM отчет орталығына номенклатура/остаток файлын жүктеңіз.`;
  }
  if (action === "daily") {
    return [`Күндік отчет (${metrics.today})`, `Фокус: ${metrics.focus}`, `Task: ${metrics.todayTasks}`, `Заказ: ${metrics.openOrders}`, `Қарыз: ${money(metrics.unpaid)}`, `Құжат/ESF бақылауы: ${metrics.docs}`, `Склад сигналы: ${metrics.lowStock}`].join("\n");
  }
  return "Мен дайынмын. Бүгінгі жоспар, қарыз, заказ, склад немесе күндік отчетты таңдай аласыз.";
}

function sanaBotMockReply(text) {
  const query = text.toLowerCase();
  if (/қарыз|карыз|төлем|оплата|debt/.test(query)) return sanaBotActionReply("debt");
  if (/заказ|order|поставщик|жеткіз/.test(query)) return sanaBotActionReply("orders");
  if (/склад|остат|тауар|товар|stock/.test(query)) return sanaBotActionReply("stock");
  if (/отчет|есеп|күндік|daily/.test(query)) return sanaBotActionReply("daily");
  if (/жоспар|бүгін|today|focus/.test(query)) return sanaBotActionReply("today");
  return "Түсіндім. MVP режимінде мен local деректерге қараймын: жоспар, task, заказ, қарыз, склад, күндік отчет. Кейін осы жерге AI API жауап беру қабатын қосамыз.";
}

async function sanaBotAiReply(prompt, action = "chat", fallbackText = "") {
  const local = fallbackText || sanaBotMockReply(prompt);
  try {
    const result = await ai("sanabot", sanaBotPrompt(prompt, action, local), "Kazakh", "sanabot");
    const text = String(result?.text || "").trim();
    if (!text || /OpenAI is not available|AI service is not available|OPENAI_API_KEY/i.test(text)) return local;
    return text;
  } catch {
    return local;
  }
}

function sanaBotPrompt(prompt, action, local) {
  const metrics = sanaBotMetrics();
  return [
    `Mimo action: ${action}`,
    `User message: ${prompt}`,
    "",
    "Current dashboard signals:",
    `- Focus: ${metrics.focus}`,
    `- Today tasks: ${metrics.todayTasks}`,
    `- Open orders: ${metrics.openOrders}`,
    `- Unpaid/debt: ${money(metrics.unpaid)}`,
    `- Docs/ESF alerts: ${metrics.docs}`,
    `- Low/no stock: ${metrics.lowStock}`,
    "",
    "Local draft:",
    local,
    "",
    "Answer as Mimo: warm, original, concise, business-aware. Give concrete next actions."
  ].join("\n");
}

function taskFromMimoAnswer() {
  if (!lastMimoAnswer) {
    addMimoMessage("bot", "Алдымен Mimo-тан жауап алыңыз, содан кейін оны task қыламын.");
    return;
  }
  const title = sanaBotTaskTitle(lastMimoAnswer);
  state.tasks.unshift(normalizeTask({
    title,
    body: lastMimoAnswer,
    status: "todo",
    priority: /қарыз|карыз|төлем|заказ|склад|alert/i.test(lastMimoAnswer) ? "high" : "medium",
    due: isoDate(),
    owner: "Mimo",
    link: `Mimo · ${lastMimoAction}`
  }));
  persist();
  render();
  setMimoMood("happy");
  addMimoMessage("bot", `Task дайын: ${title}`);
}

function crmFollowUpFromMimoAnswer() {
  if (!lastMimoAnswer) {
    addMimoMessage("bot", "Алдымен қарыз/заказ/CRM туралы жауап алыңыз, содан кейін follow-up жасаймын.");
    return;
  }
  const cal = calendarData();
  const order = activeCalItems(cal.orders).find(item => !["closed", "received"].includes(item.status));
  if (order) {
    createCalendarTask({
      title: `Mimo CRM follow-up: ${order.title}`,
      date: addDays(isoDate(), 1),
      category: "CRM",
      priority: "high",
      status: "open",
      orderId: order.id,
      comment: lastMimoAnswer
    });
    logHistory("crm_deal", order.id, "Mimo follow-up", null, order, "Mimo action");
  } else {
    state.tasks.unshift(normalizeTask({
      title: "Mimo CRM follow-up",
      body: lastMimoAnswer,
      status: "todo",
      priority: "high",
      due: addDays(isoDate(), 1),
      owner: "CRM",
      link: "Mimo"
    }));
  }
  persist();
  render();
  setMimoMood("happy");
  addMimoMessage("bot", "CRM follow-up дайын. Мен оны ертеңге task ретінде қойдым.");
}

function whatsappFromMimoAnswer() {
  const report = state.crmReports?.[0];
  const text = report?.whatsapp?.[0] || sanaBotWhatsappDraft();
  lastMimoAnswer = text;
  addMimoMessage("bot", text);
  setMimoMood("focus");
}

function debtTaskFromMimoAnswer() {
  const cal = calendarData();
  const debt = activeCalItems(cal.payments).find(payment => payment.status !== "paid");
  const title = debt ? `Қарызды сұрау: ${debt.title}` : "Қарыздарды тексеру";
  state.tasks.unshift(normalizeTask({
    title,
    body: debt ? `${debt.title}\nСома: ${money(debt.amount)}\nМерзім: ${debt.dueDate || "-"}` : (lastMimoAnswer || "Қарыз/төлем тізімін тексеру."),
    status: "todo",
    priority: "high",
    due: isoDate(),
    owner: "Mimo",
    link: "Қарыз бақылау"
  }));
  persist();
  render();
  setMimoMood("happy");
  addMimoMessage("bot", `Қарыз task дайын: ${title}`);
}

function supplierTaskFromMimoAnswer() {
  const report = state.crmReports?.[0];
  const body = supplierOrderDraft(report);
  state.tasks.unshift(normalizeTask({
    title: "Поставщикке заказ дайындау",
    body,
    status: "todo",
    priority: "high",
    due: addDays(isoDate(), 1),
    owner: "Mimo",
    link: "Склад / поставщик"
  }));
  persist();
  render();
  setMimoMood("happy");
  addMimoMessage("bot", "Поставщик заказ task дайын. Складтағы аз/жоқ товарларды тексеруге қойдым.");
}

function openLatestCrmReportFromMimo() {
  const report = state.crmReports?.[0];
  if (!report) {
    addMimoMessage("bot", "Әзірге сақталған CRM отчет жоқ. CRM бөлімінде толық отчет жасап сақтаңыз.");
    setMimoMood("alert");
    return;
  }
  setView("crm");
  viewCrmReport(report.id);
  $("sanabot")?.classList.remove("open");
}

function sanaBotWhatsappDraft() {
  const cal = calendarData();
  const debt = activeCalItems(cal.payments).find(payment => payment.status !== "paid");
  if (!debt) {
    return "WhatsApp текст:\nСәлеметсіз бе! Төлем/қарыз бойынша нақты сумма шығару үшін Kaspi выписка немесе 1С контрагент/реализация файлын жүктеңіз.";
  }
  return [
    "WhatsApp текст:",
    "Сәлеметсіз бе!",
    `Біздің есеп бойынша ${debt.title} төлемі әлі жабылмаған болып тұр.`,
    `Сома: ${money(debt.amount)}. Мерзім: ${debt.dueDate || "көрсетілмеген"}.`,
    "Төлем жасалған болса, чек/платежка жіберіп қоясыз ба?"
  ].join("\n");
}

function supplierOrderDraft(report) {
  if (report?.text) {
    const lines = report.text.split(/\r?\n/).filter(line => /поставщик|складта жоқ|аз қалды|заказ беру/i.test(line));
    if (lines.length) return lines.slice(0, 18).join("\n");
  }
  const oneC = state.oneC?.text || "";
  if (oneC) return oneC.split(/\r?\n/).filter(line => /остаток жоқ|остаток аз|заказ|поставщик/i.test(line)).slice(0, 18).join("\n") || oneC.slice(0, 1200);
  return "1С Excel немесе CRM отчет орталығына номенклатура/остаток файлын жүктеңіз. Mimo аз/жоқ товарларды поставщик бойынша task қылып береді.";
}

function sanaBotTaskTitle(text) {
  const first = String(text || "").split(/\r?\n/).find(line => line.trim()) || "Mimo task";
  return first.replace(/^[-\d.\s]+/, "").slice(0, 90) || "Mimo task";
}

function sanaBotReactToTask(task) {
  if (!$("sanabotMessages")) return;
  $("sanabot")?.classList.add("open");
  setMimoMood("happy");
  addMimoMessage("bot", `Жарайсыз! “${task.title}” орындалды. Кішкентай жеңіс те жүйені алға жылжытады.`);
  renderMimoFocus();
}

function defaultCfoState() {
  return {
    activeTab: "dashboard",
    profile: {
      taxRegime: "ИП ОУР",
      employees: 0,
      businesses: [
        { id: "b2b", name: "B2B мектептер", description: "Канцтовар және хозтовар жеткізу, реализация, ЭСФ, дебиторка" },
        { id: "retail", name: "Электр дүкені", description: "Teklet және Viko электр тауарлары, касса, склад, поставщик" },
        { id: "kaspi", name: "Kaspi магазин", description: "Kaspi сатылым, комиссия, логистика, возврат және банк түсімі" }
      ],
      taxChecklist: [
        "ИП ОУР декларация/салық мерзімін бақылау",
        "Касса мен банк түсімін күнделікті сверка жасау",
        "Kaspi комиссия, логистика және возвратты бөлек категориялау",
        "1С реализация, ЭСФ, накладной, акт сверки тәртібін тексеру",
        "Teklet/Viko поставщик қарызы мен склад минимумын бақылау"
      ]
    },
    orders: [], payments: [], clients: [], suppliers: [], products: [], documents: [], taxTasks: [],
    auditRules: [
      { id: "delivered-unpaid", title: "Жеткізілді, бірақ толық төленбеді", severity: "high", description: "paidAmount < totalAmount болса дебиторкаға шығару", status: "active" },
      { id: "missing-esf", title: "Реализация бар, ЭСФ жоқ", severity: "high", description: "ЭСФ бос болса ескерту беру", status: "active" },
      { id: "unlinked-payment", title: "Төлем заказға байланыспаған", severity: "medium", description: "relatedOrderId жоқ төлемдерді тексеру", status: "active" },
      { id: "low-stock", title: "Склад минимумы", severity: "high", description: "quantity < minQuantity болса заказға ұсыну", status: "active" },
      { id: "missing-documents", title: "Құжат толық емес", severity: "medium", description: "documentStatus толық емес болса бақылауға алу", status: "active" },
      { id: "low-margin", title: "Маржа төмен", severity: "medium", description: "Маржа 15%-дан төмен болса profitability warning", status: "active" },
      { id: "kaspi-reconcile", title: "Kaspi сверка", severity: "medium", description: "Kaspi түсім, комиссия, возврат және 1С сатылымын салыстыру", status: "active" },
      { id: "ip-our-tax", title: "ИП ОУР салық бақылауы", severity: "high", description: "Салық мерзімі, төлем, декларация және категориясыз шығындарды бақылау", status: "active" }
    ]
  };
}

function normalizeCfo(cfo = {}) {
  const base = defaultCfoState();
  return {
    ...base,
    ...cfo,
    profile: { ...base.profile, ...(cfo.profile || {}), businesses: base.profile.businesses, taxChecklist: base.profile.taxChecklist },
    orders: Array.isArray(cfo.orders) ? cfo.orders.map(normalizeCfoOrder) : [],
    payments: Array.isArray(cfo.payments) ? cfo.payments.map(normalizeCfoPayment) : [],
    clients: Array.isArray(cfo.clients) ? cfo.clients.map(normalizeCfoClient) : [],
    suppliers: Array.isArray(cfo.suppliers) ? cfo.suppliers.map(normalizeCfoSupplier) : [],
    products: Array.isArray(cfo.products) ? cfo.products.map(normalizeCfoProduct) : [],
    documents: Array.isArray(cfo.documents) ? cfo.documents.map(normalizeCfoDocument) : [],
    taxTasks: Array.isArray(cfo.taxTasks) ? cfo.taxTasks.map(normalizeCfoTaxTask) : [],
    auditRules: Array.isArray(cfo.auditRules) && cfo.auditRules.length ? cfo.auditRules : base.auditRules
  };
}

function normalizeCfoOrder(order = {}) {
  const total = Number(order.totalAmount || order.amount || 0);
  const cost = Number(order.costAmount || 0);
  const paid = Number(order.paidAmount || 0);
  const margin = Number(order.marginAmount || (total - cost));
  return { id: order.id || crypto.randomUUID(), business: order.business || "b2b", clientName: order.clientName || order.counterparty || "", schoolName: order.schoolName || order.clientName || "", date: order.date || isoDate(), status: order.status || "open", totalAmount: total, costAmount: cost, marginAmount: margin, paidAmount: paid, debtAmount: Math.max(0, Number(order.debtAmount ?? (total - paid))), paymentStatus: order.paymentStatus || (paid >= total && total > 0 ? "paid" : "payment_waiting"), documentStatus: order.documentStatus || "толық емес", esfStatus: order.esfStatus || "", oneCStatus: order.oneCStatus || "", responsible: order.responsible || "Иесі", comment: order.comment || "" };
}

function normalizeCfoPayment(payment = {}) {
  return { id: payment.id || crypto.randomUUID(), business: payment.business || "b2b", date: payment.date || isoDate(), type: payment.type || "income", method: payment.method || "bank", category: payment.category || "", amount: Number(payment.amount || 0), counterparty: payment.counterparty || "", relatedOrderId: payment.relatedOrderId || "", comment: payment.comment || "" };
}

function normalizeCfoClient(client = {}) {
  return { id: client.id || crypto.randomUUID(), business: client.business || "b2b", name: client.name || "", bin: client.bin || "", contactPerson: client.contactPerson || "", phone: client.phone || "", debtAmount: Number(client.debtAmount || 0), lastPaymentDate: client.lastPaymentDate || "", comment: client.comment || "" };
}

function normalizeCfoSupplier(supplier = {}) {
  return { id: supplier.id || crypto.randomUUID(), business: supplier.business || "retail", name: supplier.name || "", bin: supplier.bin || "", contactPerson: supplier.contactPerson || "", phone: supplier.phone || "", payableAmount: Number(supplier.payableAmount || 0), comment: supplier.comment || "" };
}

function normalizeCfoProduct(product = {}) {
  const purchase = Number(product.purchasePrice || 0);
  const sale = Number(product.salePrice || 0);
  return { id: product.id || crypto.randomUUID(), business: product.business || "retail", name: product.name || "", oneCName: product.oneCName || product.name || "", category: product.category || "", purchasePrice: purchase, salePrice: sale, quantity: Number(product.quantity || 0), minQuantity: Number(product.minQuantity || 0), marginPercent: Number(product.marginPercent || (sale ? ((sale - purchase) / sale) * 100 : 0)) };
}

function normalizeCfoDocument(doc = {}) {
  return { id: doc.id || crypto.randomUUID(), business: doc.business || "b2b", orderId: doc.orderId || "", type: doc.type || "реализация", status: doc.status || "жоқ", date: doc.date || isoDate(), fileUrl: doc.fileUrl || "", comment: doc.comment || "" };
}

function normalizeCfoTaxTask(task = {}) {
  return { id: task.id || crypto.randomUUID(), business: task.business || "all", taxType: task.taxType || "ОУР", period: task.period || "", dueDate: task.dueDate || "", paymentDueDate: task.paymentDueDate || "", status: task.status || "open", amount: Number(task.amount || 0), reminderDate: task.reminderDate || "", comment: task.comment || "" };
}

function setCfoTab(tab) {
  state.cfo = normalizeCfo(state.cfo || {});
  state.cfo.activeTab = tab || "dashboard";
  persist();
  renderCfo();
}

function seedCfoDemoData() {
  state.cfo = normalizeCfo(state.cfo || {});
  state.cfo.orders = [
    normalizeCfoOrder({ business: "b2b", clientName: "№23 мектеп", schoolName: "№23 мектеп канцтовар заказ", date: addDays(isoDate(), -18), status: "delivered", totalAmount: 485000, costAmount: 352000, paidAmount: 250000, documentStatus: "толық емес", esfStatus: "", oneCStatus: "", comment: "Реализация бар, төлем толық емес, ЭСФ тексеру керек" }),
    normalizeCfoOrder({ business: "b2b", clientName: "№7 мектеп", schoolName: "№7 мектеп хозтовар заказ", date: addDays(isoDate(), -4), status: "delivered", totalAmount: 310000, costAmount: 255000, paidAmount: 310000, documentStatus: "толық", esfStatus: "жіберілді", oneCStatus: "1С реализация жасалды", comment: "Маржа төмендеу" }),
    normalizeCfoOrder({ business: "retail", clientName: "Дүкен клиенттері", schoolName: "Viko/Teklet күндік сатылым", date: isoDate(), status: "closed", totalAmount: 190000, costAmount: 128000, paidAmount: 190000, documentStatus: "толық", esfStatus: "қажет емес", oneCStatus: "1С чек/сатылым түсті", comment: "Электр дүкені" }),
    normalizeCfoOrder({ business: "kaspi", clientName: "Kaspi.kz", schoolName: "Kaspi магазин күндік сатылым", date: isoDate(), status: "closed", totalAmount: 260000, costAmount: 185000, paidAmount: 240000, documentStatus: "толық", esfStatus: "қажеттілігін тексеру", oneCStatus: "Kaspi/1С салыстыру керек", comment: "Kaspi комиссия мен возвратты бөлек тексеру" })
  ];
  state.cfo.payments = [
    normalizeCfoPayment({ business: "b2b", date: isoDate(), type: "income", method: "bank", category: "мектеп төлемі", amount: 250000, counterparty: "№23 мектеп", relatedOrderId: "", comment: "Заказға байланыстыру керек" }),
    normalizeCfoPayment({ business: "retail", date: isoDate(), type: "income", method: "cash", category: "дүкен түсімі", amount: 190000, counterparty: "Касса", relatedOrderId: "retail-day", comment: "Күндік сатылым" }),
    normalizeCfoPayment({ business: "retail", date: isoDate(), type: "expense", method: "bank", category: "", amount: 76000, counterparty: "Поставщик Viko", comment: "Категория қою керек" }),
    normalizeCfoPayment({ business: "kaspi", date: isoDate(), type: "income", method: "bank", category: "Kaspi магазин түсімі", amount: 240000, counterparty: "Kaspi.kz", relatedOrderId: "", comment: "Kaspi выпискасын 1С сатылыммен байланыстыру" }),
    normalizeCfoPayment({ business: "kaspi", date: isoDate(), type: "expense", method: "bank", category: "Kaspi комиссия/логистика", amount: 18000, counterparty: "Kaspi.kz", comment: "Комиссия және логистика" })
  ];
  state.cfo.clients = [
    normalizeCfoClient({ business: "b2b", name: "№23 мектеп", bin: "000000000023", contactPerson: "Завхоз", phone: "+7 700 000 23 23", debtAmount: 235000, lastPaymentDate: isoDate(), comment: "Қарыз қалды" }),
    normalizeCfoClient({ business: "b2b", name: "№7 мектеп", bin: "000000000007", contactPerson: "Бухгалтер", phone: "+7 700 000 07 07", debtAmount: 0, lastPaymentDate: isoDate(), comment: "Таза" }),
    normalizeCfoClient({ business: "kaspi", name: "Kaspi.kz", bin: "", contactPerson: "Маркетплейс", phone: "", debtAmount: 20000, lastPaymentDate: isoDate(), comment: "Kaspi түсімін выпискамен салыстыру" })
  ];
  state.cfo.suppliers = [
    normalizeCfoSupplier({ business: "retail", name: "Teklet", bin: "", contactPerson: "Менеджер", phone: "", payableAmount: 120000, comment: "Келесі заказ алдында сверка" }),
    normalizeCfoSupplier({ business: "retail", name: "Viko", bin: "", contactPerson: "Менеджер", phone: "", payableAmount: 76000, comment: "Төлем категориясын нақтылау" }),
    normalizeCfoSupplier({ business: "kaspi", name: "Kaspi.kz", bin: "", contactPerson: "Маркетплейс", phone: "", payableAmount: 18000, comment: "Комиссия/логистика есепте тұр" })
  ];
  state.cfo.products = [
    normalizeCfoProduct({ business: "retail", name: "Viko розетка", oneCName: "VIKO розетка белая", category: "Viko", purchasePrice: 950, salePrice: 1450, quantity: 4, minQuantity: 10 }),
    normalizeCfoProduct({ business: "retail", name: "Teklet автомат 16A", oneCName: "TEKLET автомат 16A", category: "Teklet", purchasePrice: 1800, salePrice: 2300, quantity: 2, minQuantity: 8 }),
    normalizeCfoProduct({ business: "kaspi", name: "Viko выключатель Kaspi", oneCName: "VIKO выключатель", category: "Viko/Kaspi", purchasePrice: 1200, salePrice: 2100, quantity: 3, minQuantity: 12 })
  ];
  state.cfo.documents = [
    normalizeCfoDocument({ business: "b2b", type: "реализация", status: "дайын", date: addDays(isoDate(), -18), comment: "№23 мектеп ЭСФ жоқ" }),
    normalizeCfoDocument({ business: "b2b", type: "акт сверки", status: "жоқ", date: isoDate(), comment: "№23 мектеппен сверка керек" }),
    normalizeCfoDocument({ business: "kaspi", type: "Kaspi отчет", status: "дайын", date: isoDate(), comment: "Kaspi комиссия/возврат файлын банкпен салыстыру" })
  ];
  state.cfo.taxTasks = [
    normalizeCfoTaxTask({ business: "all", taxType: "ИП ОУР декларация", period: "ай/квартал", dueDate: addDays(isoDate(), 7), paymentDueDate: addDays(isoDate(), 10), status: "open", amount: 0, reminderDate: addDays(isoDate(), 3), comment: "Нақты сома мен форманы бухгалтер/КГД күнтізбесімен тексеру" }),
    normalizeCfoTaxTask({ business: "kaspi", taxType: "Kaspi түсім/комиссия сверкасы", period: "ай соңы", dueDate: addDays(isoDate(), 5), paymentDueDate: addDays(isoDate(), 5), status: "open", amount: 0, reminderDate: addDays(isoDate(), 2), comment: "Kaspi есебін банк және 1С сатылыммен салыстыру" })
  ];
  state.cfo.activeTab = "dashboard";
  persist();
  render();
}

function exportCfoData() {
  state.cfo = normalizeCfo(state.cfo || {});
  downloadText(`sana_cfo_${isoDate()}.json`, JSON.stringify(state.cfo, null, 2));
}

function clearCfoData() {
  if (!confirm("AI Бас бухгалтер ішіндегі CFO деректерін өшіреміз бе?")) return;
  state.cfo = defaultCfoState();
  persist();
  render();
}

async function importCfoFiles() {
  const out = $("cfoImportOut");
  const files = {
    realization: $("cfoRealizationFile")?.files?.[0],
    bank: $("cfoBankFile")?.files?.[0],
    counterparties: $("cfoCounterpartyFile")?.files?.[0],
    stock: $("cfoStockFile")?.files?.[0]
  };
  if (!Object.values(files).some(Boolean)) {
    if (out) out.textContent = "Кемінде бір Excel/CSV файл таңдаңыз.";
    return;
  }
  if (out) out.textContent = "AI Бас бухгалтер файлдарды оқып жатыр...";
  try {
    const tables = {};
    for (const [key, file] of Object.entries(files)) {
      if (file) tables[key] = await readTableFile(file);
    }
    const result = cfoImportTables(tables);
    state.cfo = normalizeCfo(state.cfo || {});
    state.cfo.orders = mergeCfoRows(state.cfo.orders, result.orders);
    state.cfo.payments = mergeCfoRows(state.cfo.payments, result.payments);
    state.cfo.clients = mergeCfoRows(state.cfo.clients, result.clients);
    state.cfo.suppliers = mergeCfoRows(state.cfo.suppliers, result.suppliers);
    state.cfo.products = mergeCfoRows(state.cfo.products, result.products);
    state.cfo.documents = mergeCfoRows(state.cfo.documents, result.documents);
    state.cfo.lastImport = {
      at: new Date().toISOString(),
      files: Object.values(files).filter(Boolean).map(file => file.name),
      summary: result.summary,
      report: result.report
    };
    persist();
    render();
    if (out) out.textContent = result.report;
  } catch (error) {
    if (out) out.textContent = `Импорт қатесі: ${shortError(error)}`;
  }
}

function inferCfoBusiness(source = "") {
  const text = normalizeText(source);
  if (/kaspi|kaspi\.kz|маркетплейс|маркет|возврат|комиссия/.test(text)) return "kaspi";
  if (/мектеп|school|школ|лицей|гимназ|садик|балабақша/.test(text)) return "b2b";
  if (/viko|teklet|электр|розетка|кабель|автомат|выключатель|лампа|магазин|касса/.test(text)) return "retail";
  return "retail";
}

function cfoImportTables(tables) {
  const realization = tables.realization ? parseRealizationTable(tables.realization) : [];
  const bank = tables.bank ? parseKaspiTable(tables.bank) : [];
  const counterparties = tables.counterparties ? parseCounterpartyTable(tables.counterparties) : [];
  const stock = tables.stock ? parseNomenclatureTable(tables.stock) : [];
  const paidByName = groupSum(bank, row => normalizeParty(row.name || row.purpose), row => Math.abs(row.amount || 0));
  const orders = realization.map(row => {
    const business = inferCfoBusiness(`${row.client} ${row.item} ${row.doc}`);
    const paid = paidByName.get(normalizeParty(row.client)) || 0;
    return normalizeCfoOrder({
      business,
      clientName: row.client,
      schoolName: row.client,
      date: normalizeDateInput(row.date) || isoDate(),
      status: "delivered",
      totalAmount: row.amount,
      costAmount: row.cost,
      paidAmount: Math.min(row.amount || 0, paid || 0),
      documentStatus: row.doc ? "дайын" : "толық емес",
      esfStatus: "",
      oneCStatus: row.doc ? `1С ${row.doc}` : "1С реализация табылды",
      comment: row.item || ""
    });
  });
  const payments = bank.map(row => {
    const business = inferCfoBusiness(`${row.name || ""} ${row.purpose || ""}`);
    return normalizeCfoPayment({
      business,
      date: normalizeDateInput(row.date) || isoDate(),
      type: row.amount < 0 ? "expense" : "income",
      method: "bank",
      category: inferCfoPaymentCategory(row),
      amount: Math.abs(row.amount || 0),
      counterparty: row.name || row.purpose || "",
      relatedOrderId: "",
      comment: row.purpose || ""
    });
  });
  const clients = counterparties.map(row => normalizeCfoClient({
    business: inferCfoBusiness(row.name),
    name: row.name,
    bin: row.bin,
    phone: row.phone,
    debtAmount: row.debt,
    lastPaymentDate: "",
    comment: "1С контрагент импорт"
  }));
  const products = stock.map(row => normalizeCfoProduct({
    business: inferCfoBusiness(`${row.name} ${row.supplier}`),
    name: row.name || row.code,
    oneCName: row.name || row.code,
    category: row.supplier || "",
    purchasePrice: row.buyPrice,
    salePrice: row.sellPrice,
    quantity: row.stock,
    minQuantity: cfoMinStock(row)
  }));
  const suppliers = [...new Set(stock.map(row => row.supplier).filter(Boolean))].map(name => normalizeCfoSupplier({
    business: inferCfoBusiness(name),
    name,
    payableAmount: 0,
    comment: "Номенклатура файлы бойынша поставщик"
  }));
  const documents = realization.map(row => normalizeCfoDocument({
    business: inferCfoBusiness(`${row.client} ${row.doc}`),
    orderId: "",
    type: "реализация",
    status: row.doc ? "дайын" : "жоқ",
    date: normalizeDateInput(row.date) || isoDate(),
    comment: row.doc || `${row.client} реализация`
  }));
  const summary = {
    orders: orders.length,
    payments: payments.length,
    clients: clients.length,
    products: products.length,
    documents: documents.length,
    debt: orders.reduce((sum, order) => sum + order.debtAmount, 0),
    lowStock: products.filter(product => product.quantity < product.minQuantity).length,
    b2b: orders.filter(row => row.business === "b2b").length + payments.filter(row => row.business === "b2b").length,
    retail: orders.filter(row => row.business === "retail").length + payments.filter(row => row.business === "retail").length,
    kaspi: orders.filter(row => row.business === "kaspi").length + payments.filter(row => row.business === "kaspi").length
  };
  const report = [
    "AI Бас бухгалтер импорт отчеты",
    `Файлдар: ${Object.keys(tables).join(", ")}`,
    `Заказ/реализация: ${summary.orders}`,
    `Төлем: ${summary.payments}`,
    `Клиент/контрагент: ${summary.clients}`,
    `Товар/остаток: ${summary.products}`,
    `Құжат: ${summary.documents}`,
    `B2B танылған жолдар: ${summary.b2b}`,
    `Электр дүкені танылған жолдар: ${summary.retail}`,
    `Kaspi танылған жолдар: ${summary.kaspi}`,
    `Импорттан кейінгі қарыз: ${money(summary.debt)}`,
    `Склад warning: ${summary.lowStock}`,
    "",
    "Келесі қадам: Audit Check, Kaspi магазин, ИП / ОУР және Финанс табтарын қарап шығыңыз."
  ].join("\n");
  return { orders, payments, clients, suppliers, products, documents, summary, report };
}

function mergeCfoRows(existing = [], incoming = []) {
  const seen = new Set(existing.map(row => cfoMergeKey(row)));
  const merged = [...existing];
  incoming.forEach(row => {
    const key = cfoMergeKey(row);
    if (seen.has(key)) return;
    seen.add(key);
    merged.unshift(row);
  });
  return merged;
}

function cfoMergeKey(row = {}) {
  return [
    row.clientName || row.name || row.counterparty || row.type || "",
    row.schoolName || row.oneCName || row.comment || "",
    row.date || row.dueDate || "",
    row.totalAmount || row.amount || row.debtAmount || row.quantity || ""
  ].map(value => normalizeText(value)).join("|");
}

function inferCfoPaymentCategory(row = {}) {
  const source = normalizeText(`${row.name || ""} ${row.purpose || ""}`);
  if (/аренда|rent/.test(source)) return "аренда";
  if (/налог|салық|салык/.test(source)) return "салық";
  if (/viko|teklet|поставщик|жеткізуші/.test(source)) return "поставщик төлемі";
  if (/мектеп|school|школ/.test(source)) return "мектеп төлемі";
  return "";
}

function cfoMinStock(row = {}) {
  const name = normalizeText(`${row.name || ""} ${row.supplier || ""}`);
  if (/viko|teklet|розетка|автомат|кабель/.test(name)) return 8;
  return 3;
}

function normalizeDateInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  const match = text.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function showCfoImportReport() {
  const out = $("cfoImportOut");
  state.cfo = normalizeCfo(state.cfo || {});
  if (!out) return;
  out.textContent = state.cfo.lastImport?.report || "Әзірге импорт отчеты жоқ. Алдымен файл жүктеп, “Бухгалтерге импорттау” басыңыз.";
}

function saveCfoQuickRecord(event) {
  event.preventDefault();
  state.cfo = normalizeCfo(state.cfo || {});
  const entity = $("cfoEntity")?.value || "order";
  const business = $("cfoBusiness")?.value || "b2b";
  const title = $("cfoTitle")?.value?.trim() || "";
  const counterparty = $("cfoCounterparty")?.value?.trim() || "";
  const amount = Number($("cfoAmount")?.value || 0);
  const cost = Number($("cfoCost")?.value || 0);
  const paid = Number($("cfoPaid")?.value || 0);
  const qty = Number($("cfoQty")?.value || 0);
  const minQty = Number($("cfoMinQty")?.value || 0);
  const dueDate = $("cfoDueDate")?.value || "";
  const status = $("cfoStatus")?.value || "open";
  const method = $("cfoMethod")?.value || "bank";
  const category = $("cfoCategory")?.value?.trim() || "";
  const comment = $("cfoComment")?.value?.trim() || "";
  if (entity === "order") state.cfo.orders.unshift(normalizeCfoOrder({ business, clientName: counterparty || title, schoolName: title, date: dueDate || isoDate(), status, totalAmount: amount, costAmount: cost, paidAmount: paid, documentStatus: status === "closed" ? "толық" : "толық емес", comment }));
  else if (entity === "payment") state.cfo.payments.unshift(normalizeCfoPayment({ business, date: dueDate || isoDate(), type: amount < 0 ? "expense" : "income", method, category, amount: Math.abs(amount), counterparty, comment }));
  else if (entity === "client") state.cfo.clients.unshift(normalizeCfoClient({ business, name: title || counterparty, debtAmount: amount, lastPaymentDate: dueDate, comment }));
  else if (entity === "supplier") state.cfo.suppliers.unshift(normalizeCfoSupplier({ business, name: title || counterparty, payableAmount: amount, comment }));
  else if (entity === "product") state.cfo.products.unshift(normalizeCfoProduct({ business, name: title, oneCName: counterparty || title, category, purchasePrice: cost, salePrice: amount, quantity: qty, minQuantity: minQty }));
  else if (entity === "document") state.cfo.documents.unshift(normalizeCfoDocument({ business, type: category || title || "реализация", status, date: dueDate || isoDate(), comment }));
  else if (entity === "tax") state.cfo.taxTasks.unshift(normalizeCfoTaxTask({ business, taxType: title || "ОУР", period: category, dueDate, paymentDueDate: dueDate, status, amount, comment }));
  event.target.reset();
  persist();
  render();
}

function cfoFilteredData() {
  const cfo = normalizeCfo(state.cfo || {});
  const query = ($("cfoSearch")?.value || "").toLowerCase();
  const business = $("cfoBusinessFilter")?.value || "all";
  const matchBusiness = item => business === "all" || item.business === business || item.business === "all";
  const matchQuery = item => !query || JSON.stringify(item).toLowerCase().includes(query);
  const filter = rows => rows.filter(item => matchBusiness(item) && matchQuery(item));
  return { ...cfo, orders: filter(cfo.orders), payments: filter(cfo.payments), clients: filter(cfo.clients), suppliers: filter(cfo.suppliers), products: filter(cfo.products), documents: filter(cfo.documents), taxTasks: filter(cfo.taxTasks) };
}

function cfoMetrics(cfo = cfoFilteredData()) {
  const today = isoDate();
  const month = today.slice(0, 7);
  const income = cfo.payments.filter(p => p.type === "income");
  const expenses = cfo.payments.filter(p => p.type === "expense");
  const byBusiness = business => {
    const orderRevenue = cfo.orders.filter(o => o.business === business).reduce((sum, order) => sum + order.totalAmount, 0);
    const paymentIncome = income.filter(p => p.business === business).reduce((sum, p) => sum + p.amount, 0);
    const paymentExpense = expenses.filter(p => p.business === business).reduce((sum, p) => sum + p.amount, 0);
    const orderCost = cfo.orders.filter(o => o.business === business).reduce((sum, order) => sum + order.costAmount, 0);
    return { revenue: orderRevenue + paymentIncome, expense: paymentExpense + orderCost };
  };
  const b2b = byBusiness("b2b");
  const retail = byBusiness("retail");
  const kaspi = byBusiness("kaspi");
  const todayIncome = income.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0);
  const monthIncome = income.filter(p => String(p.date).startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, p) => sum + p.amount, 0) + cfo.orders.reduce((sum, order) => sum + order.costAmount, 0);
  const revenue = cfo.orders.reduce((sum, order) => sum + order.totalAmount, 0) + income.reduce((sum, p) => sum + p.amount, 0);
  const debtors = cfo.orders.reduce((sum, order) => sum + order.debtAmount, 0) + cfo.clients.reduce((sum, client) => sum + client.debtAmount, 0);
  const creditors = cfo.suppliers.reduce((sum, supplier) => sum + supplier.payableAmount, 0);
  const cash = cfo.payments.filter(p => p.method === "cash").reduce((sum, p) => sum + (p.type === "expense" ? -p.amount : p.amount), 0);
  const bank = cfo.payments.filter(p => p.method === "bank").reduce((sum, p) => sum + (p.type === "expense" ? -p.amount : p.amount), 0);
  const taxOpen = cfo.taxTasks.filter(task => task.status !== "done").length;
  return {
    todayIncome,
    monthIncome,
    totalExpense,
    netProfit: revenue - totalExpense,
    debtors,
    creditors,
    cash,
    bank,
    b2bRevenue: b2b.revenue,
    retailRevenue: retail.revenue,
    kaspiRevenue: kaspi.revenue,
    kaspiExpense: kaspi.expense,
    taxOpen,
    missingEsf: cfo.orders.filter(order => order.status === "delivered" && !order.esfStatus).length,
    openRealizations: cfo.documents.filter(doc => normalizeText(doc.type).includes("реализация") && doc.status !== "жабылды").length,
    missingDocs: cfo.orders.filter(order => order.documentStatus !== "толық").length,
    taxSoon: cfo.taxTasks.filter(task => task.status !== "done" && daysUntil(task.dueDate) <= 10).length
  };
}

function cfoAuditWarnings(cfo = cfoFilteredData()) {
  const warnings = [];
  cfo.orders.forEach(order => {
    if (["delivered", "closed", "received"].includes(order.status) && order.paidAmount < order.totalAmount) warnings.push({ severity: "high", title: "Жеткізілген заказда қарыз бар", description: `${order.schoolName || order.clientName}: ${money(order.totalAmount - order.paidAmount)}` });
    if (order.status === "delivered" && !order.esfStatus) warnings.push({ severity: "high", title: "ЭСФ жіберілмеген", description: `${order.schoolName || order.clientName} бойынша реализация бар, ЭСФ бос.` });
    if (order.documentStatus !== "толық") warnings.push({ severity: "medium", title: "Құжат жетіспейді", description: `${order.schoolName || order.clientName}: documentStatus толық емес.` });
    if (order.debtAmount > 0 && daysUntil(order.date) < -14) warnings.push({ severity: "high", title: "Мерзімі өткен дебиторка", description: `${order.clientName}: ${money(order.debtAmount)} 14 күннен асты.` });
    const marginPercent = order.totalAmount ? (order.marginAmount / order.totalAmount) * 100 : 0;
    if (order.totalAmount > 0 && marginPercent < 15) warnings.push({ severity: "medium", title: "Маржа төмен", description: `${order.clientName}: ${marginPercent.toFixed(1)}% ғана.` });
    if (!order.oneCStatus) warnings.push({ severity: "low", title: "1С статус бос", description: `${order.clientName}: 1С-ке түсті ме, тексеріңіз.` });
    if (order.business === "kaspi" && !normalizeText(order.oneCStatus).includes("1с")) warnings.push({ severity: "medium", title: "Kaspi сатылымы 1С-пен салыстырылмаған", description: `${order.clientName}: Kaspi отчет пен 1С сатылымын сверка жасаңыз.` });
  });
  cfo.payments.forEach(payment => {
    if (!payment.relatedOrderId && payment.type === "income") warnings.push({ severity: "medium", title: "Төлем заказға байланыспаған", description: `${payment.counterparty}: ${money(payment.amount)}` });
    if (!payment.category) warnings.push({ severity: "low", title: "Төлем категориясыз", description: `${payment.counterparty || "Төлем"} категориясын қойыңыз.` });
    if (payment.business === "kaspi" && payment.type === "expense" && !/комиссия|логистика|возврат/i.test(payment.category || payment.comment)) warnings.push({ severity: "medium", title: "Kaspi шығыны нақты категориясыз", description: `${payment.counterparty}: комиссия, логистика немесе возврат екенін белгілеңіз.` });
    if (state.cfo?.profile?.employees === 0 && /зарплата|еңбек|жалақы|оклад/i.test(`${payment.category} ${payment.comment}`)) warnings.push({ severity: "medium", title: "Жұмысшы жоқ, бірақ жалақыға ұқсас шығын бар", description: `${payment.counterparty}: ИП профилін немесе категорияны тексеріңіз.` });
  });
  cfo.products.forEach(product => {
    if (product.quantity < product.minQuantity) warnings.push({ severity: "high", title: "Складта товар аз", description: `${product.name}: ${product.quantity}/${product.minQuantity}` });
    if (product.marginPercent < 15 && product.salePrice > 0) warnings.push({ severity: "medium", title: "Товар маржасы төмен", description: `${product.name}: ${product.marginPercent.toFixed(1)}%` });
    if (product.business === "kaspi" && product.quantity < product.minQuantity) warnings.push({ severity: "high", title: "Kaspi витринасына товар жетпей қалуы мүмкін", description: `${product.name}: поставщикке заказ дайындаңыз.` });
  });
  cfo.taxTasks.forEach(task => {
    const due = daysUntil(task.dueDate);
    if (task.status !== "done" && due <= 10) warnings.push({ severity: due < 0 ? "high" : "medium", title: "Салық мерзімі жақын", description: `${task.taxType} ${task.period || ""}: ${task.dueDate || "күні жоқ"}` });
  });
  if (!cfo.taxTasks.length) warnings.push({ severity: "high", title: "ИП ОУР салық календарі бос", description: "Декларация, төлем және еске салу күндерін енгізіңіз." });
  if (!cfo.payments.some(payment => payment.business === "kaspi") && !cfo.orders.some(order => order.business === "kaspi")) warnings.push({ severity: "medium", title: "Kaspi магазин дерегі жоқ", description: "Kaspi выписка немесе сатылым файлын импорттаңыз." });
  return warnings;
}

function daysUntil(date) {
  if (!date) return 9999;
  const start = new Date(`${isoDate()}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  return Math.ceil((end - start) / 86400000);
}

function renderCfo() {
  if (!$("cfoKpis")) return;
  state.cfo = normalizeCfo(state.cfo || {});
  const cfo = cfoFilteredData();
  const metrics = cfoMetrics(cfo);
  const warnings = cfoAuditWarnings(cfo);
  const tab = state.cfo.activeTab || "dashboard";
  document.querySelectorAll("[data-cfo-tab]").forEach(button => button.classList.toggle("active", button.dataset.cfoTab === tab));
  $("cfoKpis").innerHTML = [["Бүгінгі түсім", money(metrics.todayIncome)], ["Айлық түсім", money(metrics.monthIncome)], ["Таза пайда", money(metrics.netProfit)], ["B2B түсім", money(metrics.b2bRevenue)], ["Дүкен түсім", money(metrics.retailRevenue)], ["Kaspi түсім", money(metrics.kaspiRevenue)], ["Клиент қарызы", money(metrics.debtors)], ["Поставщик қарызы", money(metrics.creditors)], ["Касса қалдығы", money(metrics.cash)], ["Банк қалдығы", money(metrics.bank)], ["ЭСФ warning", metrics.missingEsf], ["ОУР бақылау", metrics.taxSoon || metrics.taxOpen]].map(([label, value]) => `<article class="cfo-kpi"><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("cfoWarnings").innerHTML = warnings.slice(0, tab === "audit" ? 50 : 5).map(warning => `<article class="cfo-warning ${escapeHtml(warning.severity)}"><strong>${escapeHtml(warning.title)}</strong><span>${escapeHtml(warning.description)}</span></article>`).join("") || `<article class="cfo-warning ok"><strong>Audit таза</strong><span>Қазір автоматты warning жоқ. Дерек енгізген сайын қайта тексеріледі.</span></article>`;
  $("cfoList").innerHTML = cfoTabContent(tab, cfo, metrics, warnings);
}

function cfoTabContent(tab, cfo, metrics, warnings) {
  if (tab === "dashboard") return cfoDashboardCards(metrics, warnings);
  if (tab === "debtors") return cfoRows("Клиенттер қарызы / Дебиторка", cfo.orders.filter(o => o.debtAmount > 0).map(o => [`${o.schoolName || o.clientName}`, money(o.debtAmount), o.paymentStatus, o.date]));
  if (tab === "creditors") return cfoRows("Поставщиктер қарызы / Кредиторка", cfo.suppliers.filter(s => s.payableAmount > 0).map(s => [s.name, money(s.payableAmount), s.phone || "-", s.comment || "-"]));
  if (tab === "cashflow") return cfoRows("Ақша қозғалысы / Cash Flow", cfo.payments.map(p => [p.date, p.type === "expense" ? "Шығын" : "Түсім", money(p.amount), `${p.method} · ${p.category || "категория жоқ"}`]));
  if (tab === "pnl") return cfoDashboardCards({ "Түсім": metrics.monthIncome, "Шығын": metrics.totalExpense, "Таза пайда": metrics.netProfit, "Дебиторка": metrics.debtors, "B2B түсім": metrics.b2bRevenue, "Дүкен түсім": metrics.retailRevenue, "Kaspi түсім": metrics.kaspiRevenue }, warnings);
  if (tab === "stock") return cfoRows("Склад бақылау", cfo.products.map(p => [p.name, `${p.quantity}/${p.minQuantity}`, money(p.salePrice), `${p.marginPercent.toFixed(1)}%`]));
  if (tab === "documents") return cfoRows("Құжаттар бақылауы", cfo.documents.map(d => [d.type, d.status, d.date, d.comment || "-"]).concat(cfo.orders.filter(o => o.documentStatus !== "толық").map(o => [o.clientName, o.documentStatus, o.date, "Заказ құжаты толық емес"])));
  if (tab === "onec") return cfoRows("1С бақылау", cfo.orders.map(o => [o.clientName, o.oneCStatus || "1С статус бос", money(o.totalAmount), o.comment || "-"]));
  if (tab === "tax") return cfoRows("Салық календарь", cfo.taxTasks.map(t => [t.taxType, t.period || "-", t.dueDate || "-", `${money(t.amount)} · ${t.status}`]));
  if (tab === "tax-ip") return cfoTaxView(cfo, metrics, warnings);
  if (tab === "kaspi") return cfoKaspiView(cfo, metrics);
  if (tab === "finance") return cfoFinanceView(metrics);
  if (tab === "audit") return cfoRows("Audit Check", warnings.map(w => [w.severity, w.title, w.description, "AI Бас бухгалтер"]));
  if (tab === "chat") return `<article class="cfo-empty"><strong>AI Бас бухгалтер чат</strong><p>Төмендегі чатқа сұрақ жазыңыз. MVP mock режимде B2B, электр дүкен, Kaspi, ИП ОУР және финанс деректеріне сүйеніп жауап береді.</p></article>`;
  return "";
}

function cfoDashboardCards(metrics, warnings) {
  const entries = Object.entries(metrics).slice(0, 10);
  const firstRisk = warnings[0] ? `${warnings[0].title}: ${warnings[0].description}` : "Қазір үлкен warning жоқ. Дерек енгізген сайын қайта тексеремін.";
  return `
    <div class="cfo-accountant-grid">
      <article class="cfo-accountant-card primary">
        <span>Бас бухгалтер фокусы</span>
        <strong>${escapeHtml(firstRisk)}</strong>
        <p>Бірінші кезекте қарыз, ЭСФ, құжат, 1С статус, Kaspi сверка және ОУР салық мерзімін жабу керек.</p>
      </article>
      <article class="cfo-accountant-card">
        <span>Бизнес профиль</span>
        <strong>ИП ОУР · жұмысшы жоқ</strong>
        <p>B2B мектептер, электр дүкені, Teklet/Viko поставщиктері және Kaspi магазин бір CFO бақылауында.</p>
      </article>
      <article class="cfo-accountant-card">
        <span>Күндік бухгалтер чеклист</span>
        <strong>Банк/Kaspi -> 1С -> ЭСФ -> Склад -> Салық</strong>
        <p>Kaspi және банк выпискасын заказға байлау, реализацияны 1С-те тексеру, ЭСФ пен акт/накладной статусын жабу.</p>
      </article>
    </div>
    <div class="cfo-business-grid">
      <article><span>B2B мектептер</span><strong>${money(metrics.b2bRevenue)}</strong><p>Мектеп заказдары, дебиторка, ЭСФ, акт сверки.</p></article>
      <article><span>Электр дүкені</span><strong>${money(metrics.retailRevenue)}</strong><p>Касса, Teklet/Viko склад, поставщик қарызы.</p></article>
      <article><span>Kaspi магазин</span><strong>${money(metrics.kaspiRevenue)}</strong><p>Маркетплейс түсімі, комиссия, логистика, возврат.</p></article>
      <article><span>ИП ОУР</span><strong>${metrics.taxSoon || metrics.taxOpen} бақылау</strong><p>Салық мерзімі, категориясыз шығын, банк/касса тәртібі.</p></article>
    </div>
    <div class="cfo-mini-grid">${entries.map(([label, value]) => `<article class="cfo-mini-card"><span>${escapeHtml(label)}</span><strong>${typeof value === "number" ? money(value) : escapeHtml(value)}</strong></article>`).join("")}</div>
    <article class="cfo-empty"><strong>№1 Бас бухгалтер режимі</strong><p>Демо дерек батырмасын бассаңыз, мектеп қарызы, ЭСФ, Viko/Teklet склад, Kaspi сверка және ОУР warning-тері бірден көрінеді.</p></article>
  `;
}

function cfoKaspiView(cfo, metrics) {
  const rows = [];
  cfo.orders.filter(order => order.business === "kaspi").forEach(order => rows.push([order.date, order.clientName, money(order.totalAmount), `төленді ${money(order.paidAmount)}`, order.oneCStatus || "1С статус жоқ"]));
  cfo.payments.filter(payment => payment.business === "kaspi").forEach(payment => rows.push([payment.date, payment.type === "expense" ? "Kaspi шығын" : "Kaspi түсім", money(payment.amount), payment.category || "категория жоқ", payment.comment || "-"]));
  cfo.products.filter(product => product.business === "kaspi").forEach(product => rows.push(["Склад", product.name, `${product.quantity}/${product.minQuantity}`, money(product.salePrice), `${product.marginPercent.toFixed(1)}%`]));
  const table = cfoRows("Kaspi магазин бақылауы", rows);
  return `<div class="cfo-accountant-grid"><article class="cfo-accountant-card primary"><span>Kaspi таза көрініс</span><strong>${money(metrics.kaspiRevenue - metrics.kaspiExpense)}</strong><p>Түсімнен комиссия, логистика және себестоимость бөлек көрінуі керек.</p></article><article class="cfo-accountant-card"><span>Сверка</span><strong>Kaspi отчет = банк = 1С</strong><p>Ай сайын Kaspi отчет, банк выписка және 1С сатылымын салыстырыңыз.</p></article><article class="cfo-accountant-card"><span>Товар</span><strong>Витрина + склад</strong><p>Аз қалған позициялар автоматты түрде заказға ұсынылады.</p></article></div>${table}`;
}

function cfoFinanceView(metrics) {
  return `
    <div class="cfo-accountant-grid">
      <article class="cfo-accountant-card primary"><span>Cash Flow</span><strong>${money(metrics.cash + metrics.bank)}</strong><p>Касса мен банктің жалпы қалдығы.</p></article>
      <article class="cfo-accountant-card"><span>P&L</span><strong>${money(metrics.netProfit)}</strong><p>Түсім, себестоимость және шығыннан кейінгі болжамды таза пайда.</p></article>
      <article class="cfo-accountant-card"><span>Қарыз балансы</span><strong>${money(metrics.debtors - metrics.creditors)}</strong><p>Дебиторкадан кредиторканы алғандағы қысқа позиция.</p></article>
    </div>
    <div class="cfo-mini-grid">
      <article class="cfo-mini-card"><span>B2B</span><strong>${money(metrics.b2bRevenue)}</strong></article>
      <article class="cfo-mini-card"><span>Дүкен</span><strong>${money(metrics.retailRevenue)}</strong></article>
      <article class="cfo-mini-card"><span>Kaspi</span><strong>${money(metrics.kaspiRevenue)}</strong></article>
      <article class="cfo-mini-card"><span>Жалпы шығын</span><strong>${money(metrics.totalExpense)}</strong></article>
    </div>`;
}

function cfoTaxView(cfo, metrics, warnings) {
  const checklist = state.cfo?.profile?.taxChecklist || [];
  const taxWarnings = warnings.filter(warning => /салық|ОУР|ИП|категория|Касса|Банк/i.test(`${warning.title} ${warning.description}`));
  return `
    <div class="cfo-accountant-grid">
      <article class="cfo-accountant-card primary"><span>ИП ОУР бақылауы</span><strong>${metrics.taxSoon || metrics.taxOpen} ашық пункт</strong><p>Бұл заңды бухгалтерді алмастырмайды, бірақ мерзім, төлем, категория және құжат тәртібін күнде бақылауға көмектеседі.</p></article>
      <article class="cfo-accountant-card"><span>Профиль</span><strong>ИП ОУР · жұмысшы жоқ</strong><p>Жалақыға ұқсас шығын шықса, жүйе бөлек warning береді.</p></article>
      <article class="cfo-accountant-card"><span>Салыққа база</span><strong>Банк + касса + Kaspi</strong><p>Толық есеп үшін банк/Kaspi выписка, 1С реализация және шығын категориялары керек.</p></article>
    </div>
    <section class="cfo-table"><h3>ОУР чеклист</h3>${checklist.map(item => `<div class="cfo-row"><span>${escapeHtml(item)}</span><span>бақылауда</span></div>`).join("")}</section>
    ${cfoRows("Салық календарь", cfo.taxTasks.map(t => [t.taxType, t.period || "-", t.dueDate || "-", `${money(t.amount)} · ${t.status}`]))}
    ${taxWarnings.length ? cfoRows("Салық/финанс warning", taxWarnings.map(w => [w.severity, w.title, w.description])) : ""}`;
}
function cfoRows(title, rows) {
  if (!rows.length) return `<article class="cfo-empty"><strong>${escapeHtml(title)}</strong><p>Бұл бөлімде әзірге дерек жоқ. Сол жақтағы форма арқылы енгізіңіз немесе 1С/Excel импортын кейін қосамыз.</p></article>`;
  return `<section class="cfo-table"><h3>${escapeHtml(title)}</h3>${rows.map(row => `<div class="cfo-row">${row.map(cell => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`).join("")}</section>`;
}

function cfoPersonaIntro() {
  return [
    "Сен — Жадыраның жеке AI Бас бухгалтері және финансисісің.",
    "Стиль: қазақша, қысқа, нақты, по шагово. 1С және бухгалтерия терминдері орысша атауымен көрсетіледі.",
    "Шектеу: құпия логин, ЭЦП, банк кілтін сұрамаймын; өз бетімше декларация, төлем, ЭСФ жібермеймін; маңызды әрекетке адам растауы керек.",
    "Салық/заң бойынша нақты ставка немесе мерзім айтылса, міндетті түрде актуалды заңнамамен тексеру керек. Қауіпті жағдайда кәсіби бухгалтер/салық консультантымен тексеріңіз."
  ].join("\n");
}

function cfoAnalysisBlock(problem, cause, risk, solution, docs, next) {
  return [
    `1. Мәселе: ${problem}`,
    `2. Себеп: ${cause}`,
    `3. Қауіп: ${risk}`,
    `4. Шешім: ${solution}`,
    `5. Қай құжат/1С бөлімі тексеріледі: ${docs}`,
    `6. Келесі нақты қадам: ${next}`
  ].join("\n");
}

function cfoTopRows(rows, count = 5) {
  return rows.slice(0, count);
}

function cfoWhatsappDebtTexts(cfo) {
  const debts = cfo.orders
    .filter(order => order.business === "b2b" && order.debtAmount > 0)
    .sort((a, b) => b.debtAmount - a.debtAmount);
  if (!debts.length) return "WhatsApp мәтіні: B2B бойынша ашық қарыз табылмады.";
  return debts.slice(0, 5).map(order => [
    `${order.clientName || order.schoolName} үшін WhatsApp мәтіні:`,
    `Сәлеметсіз бе! ${order.schoolName || order.clientName} бойынша біздің есепте ${money(order.debtAmount)} төлем қалды деп тұр.`,
    "Өтінемін, төлем статусын және төлем жасалған болса платежное поручение/выписка жіберіп растап бересіз бе?",
    "Құжат бойынша сверка керек болса, акт сверки дайындап жібереміз. Рақмет!"
  ].join("\n")).join("\n\n");
}

function buildCfoAutoReport(cfo = normalizeCfo(state.cfo || {})) {
  const metrics = cfoMetrics(cfo);
  const warnings = cfoAuditWarnings(cfo);
  const b2bDebt = cfo.orders.filter(order => order.business === "b2b" && order.debtAmount > 0).sort((a, b) => b.debtAmount - a.debtAmount);
  const kaspiPayments = cfo.payments.filter(payment => payment.business === "kaspi");
  const kaspiOrders = cfo.orders.filter(order => order.business === "kaspi");
  const lowStock = cfo.products.filter(product => product.quantity < product.minQuantity).sort((a, b) => (a.quantity - a.minQuantity) - (b.quantity - b.minQuantity));
  const taxOpen = cfo.taxTasks.filter(task => task.status !== "done");
  const missingDocs = cfo.documents.filter(doc => !/қол қойылды|жабылды|дайын|жіберілді/i.test(doc.status || ""));
  const sections = [
    cfoPersonaIntro(),
    "",
    `AUTO CFO REPORT · ${isoDate()}`,
    "",
    "Қысқа қаржы қорытынды:",
    `- Бүгінгі түсім: ${money(metrics.todayIncome)}`,
    `- Айлық түсім: ${money(metrics.monthIncome)}`,
    `- Таза пайда болжамы: ${money(metrics.netProfit)}`,
    `- Дебиторка: ${money(metrics.debtors)}`,
    `- Кредиторка: ${money(metrics.creditors)}`,
    `- Касса: ${money(metrics.cash)} · Банк: ${money(metrics.bank)}`,
    `- B2B түсім: ${money(metrics.b2bRevenue)} · Дүкен: ${money(metrics.retailRevenue)} · Kaspi: ${money(metrics.kaspiRevenue)}`,
    "",
    cfoAnalysisBlock(
      `B2B қарыз бақылауы: ${b2bDebt.length} ашық позиция, жалпы ${money(b2bDebt.reduce((sum, order) => sum + order.debtAmount, 0))}`,
      "Жеткізілген заказдарда paidAmount < totalAmount немесе төлем заказға байланыспаған.",
      "Ақша айналымы тежеледі, акт сверки/төлем статусы шатасады, клиентпен қарыз дауы шығуы мүмкін.",
      "Дебиторка тізімін шығарып, әр мектепке акт сверки және WhatsApp еске салу дайындау.",
      "1С: Реализация товаров и услуг, Контрагенты, Акт сверки, Банк/Касса выписка.",
      b2bDebt[0] ? `${b2bDebt[0].clientName || b2bDebt[0].schoolName} бойынша ${money(b2bDebt[0].debtAmount)} қарызды бірінші тексеру.` : "B2B дебиторка таза болса, жаңа реализацияларды тексеру."
    ),
    "",
    cfoAnalysisBlock(
      `Kaspi сверка: ${kaspiOrders.length} сатылым және ${kaspiPayments.length} төлем/комиссия жолы бар.` ,
      "Kaspi отчет, банк выписка және 1С сатылым бір-бірімен толық байланыспауы мүмкін.",
      "Комиссия, логистика, возврат бөлек көрінбесе, маржа мен салыққа база бұрмалануы мүмкін.",
      "Kaspi түсімін, комиссиясын, логистикасын, возвратты бөлек категориялап, 1С сатылыммен салыстыру.",
      "Kaspi отчет, Банк выписка, 1С: Отчет о розничных продажах/Реализация, Номенклатура.",
      "Kaspi / Банк выписка файлын жүктеп, Kaspi магазин табындағы айырманы қарау."
    ),
    "",
    cfoAnalysisBlock(
      `Магазин склад: ${lowStock.length} товар минимумнан төмен.` ,
      "Складтағы quantity < minQuantity, әсіресе Teklet/Viko және Kaspi витринасына шыққан товарлар азайған.",
      "Сатылым тоқтайды, Kaspi рейтинг/доставка бұзылады, клиент жоғалуы мүмкін.",
      "Аз қалған позицияларды поставщик бойынша жинап, заказ тізімін дайындау.",
      "1С: Номенклатура, Остатки товаров, Поступление товаров, Поставщики.",
      lowStock[0] ? `${lowStock[0].name} бойынша ${lowStock[0].quantity}/${lowStock[0].minQuantity}; поставщикке заказ дайындау.` : "Склад минимумдары таза, бірақ аптасына бір рет остаток импорттау."
    ),
    "",
    cfoAnalysisBlock(
      `ИП ОУР салыққа дайындық: ${taxOpen.length} ашық салық/есеп пункті бар.` ,
      "Салық календарь, банк/касса/Kaspi түсімдері және шығын категориялары толық жабылмаған болуы мүмкін.",
      "Декларацияға база толық емес түседі, мерзім өткізу немесе қате есеп тәуекелі бар.",
      "ОУР чеклистін толтырып, нақты ставка/мерзімді актуалды заңнамамен және бухгалтермен тексеру.",
      "1С: Банк, Касса, Реализация, Поступление, Доходы/расходы, Салық календарь.",
      taxOpen[0] ? `${taxOpen[0].taxType} (${taxOpen[0].dueDate || "күні жоқ"}) пунктін бірінші жабу.` : "Келесі есеп кезеңіне reminder қосу."
    ),
    "",
    cfoAnalysisBlock(
      `Құжат тәртібі: ${metrics.missingEsf} ЭСФ warning, ${metrics.missingDocs} заказда құжат толық емес.` ,
      "Реализация бар, бірақ ЭСФ/documentStatus/oneCStatus толық жабылмаған.",
      "Контрагентпен сверкада айырма, төлем кешігуі немесе салық есебінде қате пайда болуы мүмкін.",
      "Әр реализацияға счет, накладной, ЭСФ, акт сверки статусын белгілеу.",
      "1С: Реализация товаров и услуг, ЭСФ, Счет на оплату, Акт сверки.",
      missingDocs[0] ? `${missingDocs[0].type} құжатын тексеру: ${missingDocs[0].comment || "комментарий жоқ"}.` : "Құжаттар тізімін аптасына бір рет экспорттау."
    ),
    "",
    "Күндік отчет:",
    `- Бүгінгі түсім: ${money(metrics.todayIncome)}`,
    `- Ашық warning: ${warnings.length}`,
    "- Бүгін: төлемдерді заказға байлау, категориясыз шығындарды жабу, Kaspi сверка қарау.",
    "",
    "Апталық отчет:",
    "- B2B дебиторка бойынша топ мектептерге WhatsApp/акт сверки жіберу.",
    "- Teklet/Viko және Kaspi витринасы бойынша аз қалған товарларға заказ дайындау.",
    "- Поставщиктерге кредиторка сверка жасау.",
    "",
    "Айлық отчет:",
    "- P&L, Cash Flow, Банк/Касса/Kaspi сверка, ОУР салыққа дайындық, ЭСФ/реализация статусын жабу.",
    "- Нақты салық ставкасы мен мерзімдерін міндетті түрде актуалды заңнамамен тексеру керек.",
    "",
    "WhatsApp қарыз мәтіндері:",
    cfoWhatsappDebtTexts(cfo),
    "",
    "Адам растауы керек әрекеттер:",
    "- Декларация жіберу, салық төлеу, ЭСФ жіберу, банк төлемі жасау, ЭЦП қолдану. Мен бұларды өз бетімше жасамаймын.",
    "",
    "Топ тәуекелдер:",
    warnings.slice(0, 8).map((warning, index) => `${index + 1}. [${warning.severity}] ${warning.title}: ${warning.description}`).join("\n") || "Қазір автоматты warning жоқ."
  ];
  return sections.join("\n");
}

function generateCfoAutoReport() {
  state.cfo = normalizeCfo(state.cfo || {});
  const report = buildCfoAutoReport(state.cfo);
  state.cfo.lastAutoReport = { at: new Date().toISOString(), report };
  persist();
  if ($("cfoChatOut")) $("cfoChatOut").textContent = report;
}
function askCfoMock(event) {
  event.preventDefault();
  const prompt = $("cfoChatPrompt")?.value?.trim() || "";
  const cfo = cfoFilteredData();
  const metrics = cfoMetrics(cfo);
  const warnings = cfoAuditWarnings(cfo);
  const lowerPrompt = normalizeText(prompt);
  if (/отчет|есеп|айлық|апталық|күндік|whatsapp|қарыз мәтін|kaspi сверка|оур/i.test(lowerPrompt)) {
    if ($("cfoChatOut")) $("cfoChatOut").textContent = buildCfoAutoReport(cfo);
    return;
  }
  const topWarning = warnings[0];
  const problem = topWarning ? topWarning.title : "Жалпы бухгалтериялық бақылау";
  const cause = topWarning ? topWarning.description : "Қазір үлкен warning жоқ, бірақ банк, касса, 1С, Kaspi және салық календарь үнемі сверка қажет.";
  const risk = topWarning ? "Егер уақытында жабылмаса, ақша айналымы, салық есебі немесе құжат тәртібі бұзылуы мүмкін." : "Дерек жаңартылмаса, отчет толық емес болады.";
  const answer = [
    cfoPersonaIntro(),
    "",
    `Сұрақ: ${prompt || "жалпы жағдай"}`,
    "",
    cfoAnalysisBlock(
      problem,
      cause,
      risk,
      "Алдымен деректі 1С/банк/Kaspi файлдарымен салыстырып, категориясыз төлем мен құжат статусын жабу.",
      "1С: Реализация товаров и услуг, Банк/Касса выписка, Контрагенты, Номенклатура, ЭСФ, Акт сверки.",
      "Auto отчет генераторды басып, толық B2B қарыз, Kaspi сверка, склад және ОУР дайындық есебін алыңыз."
    ),
    "",
    "Қысқа қаржы суреті:",
    `- Таза пайда болжамы: ${money(metrics.netProfit)}`,
    `- Дебиторка: ${money(metrics.debtors)}`,
    `- Кредиторка: ${money(metrics.creditors)}`,
    `- B2B: ${money(metrics.b2bRevenue)} · Дүкен: ${money(metrics.retailRevenue)} · Kaspi: ${money(metrics.kaspiRevenue)}`,
    "",
    "Маңызды ескерту: нақты салық ставкасы, мерзімі немесе декларация формасы айтылса, міндетті түрде актуалды заңнамамен тексеру керек. Қауіпті жағдайда кәсіби бухгалтер/салық консультантымен тексеріңіз."
  ].join("\n");
  if ($("cfoChatOut")) $("cfoChatOut").textContent = answer;
}

function render() {
  if (!Array.isArray(state.images)) state.images = [];
  if (!Array.isArray(state.goals)) state.goals = [];
  if (!Array.isArray(state.projects)) state.projects = [];
  if (!Array.isArray(state.plans)) state.plans = [];
  if (!Array.isArray(state.challenges)) state.challenges = [];
  if (!Array.isArray(state.crmReports)) state.crmReports = [];
  state.cfo = normalizeCfo(state.cfo || {});
  state.oneC = normalizeOneC(state.oneC || {});
  state.crmReports = state.crmReports.map(normalizeCrmReport);
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
  renderCrmReportDashboard();
  renderCfo();
  renderOneC();
  renderAssistantDashboard();
  renderCloudSettings();
  renderMimoFocus();
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
    const items = state.tasks.filter(task => task.status === status && `${task.title} ${task.body} ${task.owner} ${task.link} ${(task.checklist || []).map(item => item.text).join(" ")}`.toLowerCase().includes(query));
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
  board.querySelectorAll("[data-task-check]").forEach(input => {
    input.addEventListener("change", () => toggleTaskChecklist(input.dataset.taskCheck, input.dataset.checkId));
  });
  board.querySelectorAll("[data-task-detail]").forEach(button => {
    button.addEventListener("click", () => openTaskDetail(button.dataset.taskDetail));
  });
}

function taskCard(task) {
  const moves = [
    ["todo", "Істеу"],
    ["doing", "Жүру"],
    ["done", "Дайын"]
  ].filter(([status]) => status !== task.status);
  const checklist = Array.isArray(task.checklist) ? task.checklist : taskChecklistFromBody(task.body);
  const progress = taskChecklistProgress(checklist);
  const previewItems = checklist.slice(0, 3);
  const moreCount = Math.max(0, checklist.length - previewItems.length);
  const intro = taskBodyIntro(task);
  const checklistHtml = checklist.length ? `
    <div class="task-checklist">
      <div class="task-progress"><div><strong>${progress.done}/${progress.total} орындалды</strong><span>${progress.percent}%</span></div><meter min="0" max="100" value="${progress.percent}"></meter></div>
      ${previewItems.map(item => `<label><input type="checkbox" data-task-check="${escapeHtml(task.id)}" data-check-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""}> <span>${escapeHtml(item.text)}</span></label>`).join("")}
      ${moreCount ? `<button type="button" class="task-more" data-task-detail="${escapeHtml(task.id)}">+ тағы ${moreCount} пункт</button>` : ""}
      <button type="button" class="task-detail-btn" data-task-detail="${escapeHtml(task.id)}">Толық көру</button>
    </div>` : "";
  return `
    <article class="task-card priority-${escapeHtml(task.priority)} ${progress.total && progress.done === progress.total ? "task-complete" : ""}">
      <div class="task-top">
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(priorityLabel(task.priority))}</span>
      </div>
      ${intro ? `<p class="task-body-text">${escapeHtml(intro)}</p>` : ""}
      ${checklistHtml || `<p class="task-body-text">${escapeHtml(task.body || "Сипаттама жоқ")}</p>`}
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
    const saved = storageReadJson("sanabase-state", {}) || {};
    const savedGoals = storageReadJson("goals", null) || storageReadJson("zhadyra_goals", null);
    const savedProjects = storageReadJson("projects", null) || storageReadJson("zhadyra_projects", null);
    const savedPlans = storageReadJson("zhadyra_plans", null);
    const savedChallenges = storageReadJson("challenges", null) || storageReadJson("zhadyra_challenges", null);
    const savedOneC = storageReadJson("zhadyra_1c_excel", null);
    const savedCrmReports = storageReadJson("zhadyra_crm_reports", null);
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
      oneC: normalizeOneC(saved.oneC || savedOneC || {}),
      crmReports: Array.isArray(saved.crmReports) ? saved.crmReports.map(normalizeCrmReport) : (Array.isArray(savedCrmReports) ? savedCrmReports.map(normalizeCrmReport) : []),
      cfo: normalizeCfo(saved.cfo || storageReadJson("zhadyra_cfo", null) || {})
    };
  } catch {
    return { docs: [], tasks: [], images: [], calendarOS: defaultCalendarOS(), notes: [], goals: [], projects: [], plans: [], challenges: [], oneC: normalizeOneC({}), crmReports: [], cfo: defaultCfoState() };
  }
}

function persist(options = {}) {
  storageWriteJson("sanabase-state", state);
  storageWriteJson("goals", state.goals || []);
  storageWriteJson("projects", state.projects || []);
  storageWriteJson("challenges", state.challenges || []);
  storageWriteJson("zhadyra_goals", state.goals || []);
  storageWriteJson("zhadyra_projects", state.projects || []);
  storageWriteJson("zhadyra_plans", state.plans || []);
  storageWriteJson("zhadyra_tasks", state.tasks || []);
  storageWriteJson("zhadyra_habits", calendarData().habits || []);
  storageWriteJson("zhadyra_challenges", state.challenges || []);
  storageWriteJson("zhadyra_1c_excel", state.oneC || {});
  storageWriteJson("zhadyra_crm_reports", state.crmReports || []);
  storageWriteJson("zhadyra_cfo", state.cfo || defaultCfoState());
  if (options.sync !== false) scheduleCloudPush();
}

