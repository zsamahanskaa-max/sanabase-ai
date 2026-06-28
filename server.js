const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const UPLOADS = path.join(ROOT, "work", "uploads");
const PORT = Number(process.env.PORT || 5173);

loadEnv(path.join(ROOT, ".env.local"));
fs.mkdirSync(UPLOADS, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/import") {
      return handleImport(req, res);
    }
    if (req.method === "POST" && url.pathname === "/api/ai") {
      return handleAi(req, res);
    }
    return serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`SanaBase AI running at http://localhost:${PORT}`);
});

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function serveStatic(pathname, res) {
  const clean = pathname === "/" ? "/index.html" : pathname;
  const file = path.normalize(path.join(PUBLIC, clean));
  if (!file.startsWith(PUBLIC)) return sendText(res, 403, "Forbidden");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return sendText(res, 404, "Not found");
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

async function handleImport(req, res) {
  const body = await readJson(req);
  if (!body.name || !body.data) return sendJson(res, 400, { error: "Missing file data" });

  const safeName = body.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  const filePath = path.join(UPLOADS, `${Date.now()}-${safeName}`);
  fs.writeFileSync(filePath, Buffer.from(body.data, "base64"));

  const extracted = await extractText(filePath);
  sendJson(res, 200, {
    name: body.name,
    type: body.type || "",
    text: extracted.text,
    warning: extracted.warning || ""
  });
}

async function handleAi(req, res) {
  const body = await readJson(req);

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 200, { text: localAnswer(body, "OPENAI_API_KEY is not configured.") });
  }

  const mode = body.mode || "chat";
  const system = buildSystemPrompt(mode, body.language || "Kazakh");
  const input = [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        `User request:\n${body.prompt || ""}`,
        body.context ? `Knowledge base context:\n${body.context}` : "",
        body.notes ? `Notes:\n${body.notes}` : ""
      ].filter(Boolean).join("\n\n")
    }
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const reason = data.error?.message || "OpenAI request failed";
    return sendJson(res, 200, { text: localAnswer(body, reason), providerWarning: reason });
  }

  const text = data.output_text || collectOutputText(data) || "";
  sendJson(res, 200, { text });
}

function buildSystemPrompt(mode, language) {
  const base = `You are SanaBase AI, a calm knowledge-base assistant. Answer in ${language}. Use uploaded context when it is relevant. Be accurate, structured, and concise.`;
  const modes = {
    chat: "Answer questions and cite which uploaded document or note informed the answer when possible.",
    translate: "Translate the user's text faithfully. Preserve meaning, formatting, names, and numbers.",
    quiz: "Create a useful quiz from the context. Include questions, four options when suitable, and an answer key.",
    crm: "Analyze CRM, sales, leads, client, pipeline, and spreadsheet context. Identify trends, bottlenecks, risks, opportunities, and next actions.",
    notes: "Turn the request and context into clean study notes with headings, bullets, and key takeaways.",
    summary: "Summarize the context into executive summary, key facts, and next actions."
  };
  return `${base}\n${modes[mode] || modes.chat}`;
}

function collectOutputText(data) {
  return (data.output || [])
    .flatMap(item => item.content || [])
    .filter(part => part.type === "output_text" || part.text)
    .map(part => part.text || "")
    .join("\n");
}

function localAnswer(body, reason) {
  const mode = body.mode || "chat";
  const context = String(body.context || "").trim();
  const prompt = String(body.prompt || "").trim();
  const notes = String(body.notes || "").trim();
  const source = [context, notes].filter(Boolean).join("\n\n");

  if (!source) {
    return [
      "AI service is not available right now.",
      `Reason: ${reason}`,
      "",
      "Upload PDF, Word, Excel, CSV, or CRM data and I can still search/summarize imported text locally."
    ].join("\n");
  }

  if (mode === "crm") return localCrmAnalysis(source, reason);
  if (mode === "quiz") return localQuiz(source, reason);
  if (mode === "translate") {
    return [
      "Translation needs the OpenAI quota/billing issue to be fixed.",
      `Reason: ${reason}`,
      "",
      "Imported context is available, but high-quality translation is disabled until the API account can process requests."
    ].join("\n");
  }

  const terms = prompt.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2);
  const paragraphs = source.split(/\n{2,}|---/).map(p => p.trim()).filter(Boolean);
  const ranked = paragraphs
    .map(p => ({ p, score: terms.reduce((sum, term) => sum + (p.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => `- ${item.p.slice(0, 700)}`);

  return [
    "OpenAI quota/billing is not active, so this is a local knowledge-base answer.",
    `Reason: ${reason}`,
    "",
    "Most relevant imported context:",
    ranked.join("\n") || source.slice(0, 1800),
    "",
    "Next step: enable Platform billing/quota for full AI chat."
  ].join("\n");
}

function localCrmAnalysis(source, reason) {
  const lines = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const structure = lines.filter(line => /count,mean,min,max|Rows:|Columns:|Numeric summary|Top values|Date range/i.test(line)).slice(0, 70);
  const money = lines.filter(line => /(revenue|amount|deal|sales|price|total|sum|сумма|сатылым|төлем)/i.test(line)).slice(0, 24);
  const status = lines.filter(line => /(status|stage|pipeline|lead|won|lost|new|closed|статус|лид)/i.test(line)).slice(0, 32);

  return [
    "CRM local analysis",
    `AI provider warning: ${reason}`,
    "",
    "Data structure found:",
    structure.length ? structure.join("\n") : "- CRM structure was imported, but no obvious summary rows were found.",
    "",
    "Sales and pipeline signals:",
    money.length ? money.map(x => `- ${x}`).join("\n") : "- Add columns like revenue, amount, deal value, stage, status, owner, date for deeper CRM metrics.",
    "",
    "Lead/status signals:",
    status.length ? status.map(x => `- ${x}`).join("\n") : "- No obvious status/stage fields detected.",
    "",
    "Recommended CRM actions:",
    "- Standardize columns: client, phone/email, source, owner, status/stage, amount, created date, next action date.",
    "- Track conversion by source and manager.",
    "- Separate hot leads, stuck deals, lost reasons, and repeat customers.",
    "- Enable OpenAI billing/quota for full natural-language CRM recommendations."
  ].join("\n");
}

function localQuiz(source, reason) {
  const sentences = source
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 40)
    .slice(0, 6);
  const questions = sentences.map((s, i) => `${i + 1}. What is the key idea in this statement?\n   ${s.slice(0, 220)}\n   Answer: explain the main fact in your own words.`);
  return [
    "Local quiz draft",
    `AI provider warning: ${reason}`,
    "",
    questions.join("\n\n") || "Upload a richer document to generate a quiz.",
    "",
    "Enable OpenAI billing/quota for multiple-choice questions and answer keys."
  ].join("\n");
}

function extractText(filePath) {
  return new Promise((resolve) => {
    const py = resolvePython();
    const child = spawn(py, [path.join(ROOT, "tools", "extract_text.py"), filePath], {
      windowsHide: true
    });
    let out = "";
    let err = "";
    child.stdout.on("data", chunk => out += chunk);
    child.stderr.on("data", chunk => err += chunk);
    child.on("close", code => {
      if (code !== 0) return resolve({ text: "", warning: err.trim() || "Text extraction failed" });
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ text: out.trim(), warning: "" });
      }
    });
  });
}

function resolvePython() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const bundled = path.join(
    process.env.USERPROFILE || "",
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe"
  );
  return fs.existsSync(bundled) ? bundled : "python";
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
