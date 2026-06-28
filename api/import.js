const xlsx = require("xlsx");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const buffer = Buffer.from(body.data || "", "base64");
    const name = body.name || "upload";
    const ext = name.toLowerCase().slice(name.lastIndexOf("."));
    let text = "";
    let warning = "";

    if (ext === ".xlsx" || ext === ".xls") {
      text = parseWorkbook(buffer);
    } else if (ext === ".docx") {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else if (ext === ".pdf") {
      text = (await pdfParse(buffer)).text;
    } else {
      text = buffer.toString("utf8");
    }

    res.status(200).json({ name, type: body.type || "", text: text.slice(0, 250000), warning });
  } catch (error) {
    res.status(200).json({
      name: req.body?.name || "upload",
      type: req.body?.type || "",
      text: "",
      warning: error.message || "Import failed"
    });
  }
};

function parseWorkbook(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const parts = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    const csv = xlsx.utils.sheet_to_csv(sheet);
    parts.push(`Sheet: ${sheetName}`);
    parts.push(`Rows: ${rows.length}`);
    if (rows[0]) parts.push(`Columns: ${Object.keys(rows[0]).join(", ")}`);
    parts.push(`Preview CSV:\n${csv.split("\n").slice(0, 35).join("\n")}`);

    const counts = {};
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (/status|stage|source|manager|owner|customer|client|lead/i.test(key)) {
          counts[key] ||= {};
          const value = String(row[key] || "blank");
          counts[key][value] = (counts[key][value] || 0) + 1;
        }
      }
    }
    for (const key of Object.keys(counts)) {
      const top = Object.entries(counts[key]).sort((a, b) => b[1] - a[1]).slice(0, 12);
      parts.push(`Top values for ${key}: ${top.map(([value, count]) => `${value}: ${count}`).join(", ")}`);
    }
  }
  return parts.join("\n\n");
}
