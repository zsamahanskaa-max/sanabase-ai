(function () {
  async function extractFile(file) {
    try {
      return await serverImport(file);
    } catch {
      return browserImport(file);
    }
  }

  async function serverImport(file) {
    const data = await fileToBase64(file);
    return window.SanaApi.importFile({ name: file.name, type: file.type, data });
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

  window.SanaDocuments = {
    extractFile,
    serverImport,
    browserImport,
    readPdf,
    unsupported
  };
})();
