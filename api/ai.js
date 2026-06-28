module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({ text: fallback(body, "OPENAI_API_KEY is not configured") });
  }

  const input = [
    {
      role: "system",
      content: `You are SanaBase AI. Answer in ${body.language || "Kazakh"}. Use uploaded context. For CRM, give pipeline, sales, risks, and next actions.`
    },
    {
      role: "user",
      content: [
        `Request:\n${body.prompt || ""}`,
        body.context ? `Context:\n${body.context}` : "",
        body.notes ? `Notes:\n${body.notes}` : ""
      ].filter(Boolean).join("\n\n")
    }
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input })
  });

  const data = await response.json();
  if (!response.ok) {
    const reason = data.error?.message || "OpenAI request failed";
    return res.status(200).json({ text: fallback(body, reason), providerWarning: reason });
  }

  res.status(200).json({ text: data.output_text || collect(data) || "" });
};

function collect(data) {
  return (data.output || [])
    .flatMap(item => item.content || [])
    .map(part => part.text || "")
    .join("\n");
}

function fallback(body, reason) {
  const source = `${body.context || ""}\n${body.notes || ""}`.trim();
  if (body.mode === "crm") {
    const rows = source.split(/\r?\n/).filter(line => /Rows:|Columns:|Top values|amount|status|client|owner|sales|lead/i.test(line));
    return [
      "CRM local analysis",
      `AI provider warning: ${reason}`,
      "",
      rows.slice(0, 80).join("\n") || "Upload Excel/CSV CRM data first.",
      "",
      "Actions:",
      "- Standardize client, source, owner, status, amount, next action date.",
      "- Track conversion by source and manager.",
      "- Separate hot leads, stuck deals, and lost reasons."
    ].join("\n");
  }
  if (body.mode === "quiz") {
    return [
      "Local quiz draft",
      `Reason: ${reason}`,
      "",
      source.split(/[.!?]\s+/).filter(s => s.length > 40).slice(0, 6)
        .map((s, i) => `${i + 1}. What is the key idea? ${s.slice(0, 180)}`)
        .join("\n") || "Upload a richer document to generate a quiz."
    ].join("\n");
  }
  return [
    "OpenAI is not available right now.",
    `Reason: ${reason}`,
    "",
    "Relevant context:",
    source.slice(0, 2500) || "Upload a document first."
  ].join("\n");
}
