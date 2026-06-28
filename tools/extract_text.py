import json
import os
import re
import sys
import zipfile


def extract_txt(path):
    with open(path, "rb") as f:
        data = f.read()
    for enc in ("utf-8", "utf-16", "cp1251", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    return data.decode("utf-8", errors="ignore")


def extract_docx(path):
    texts = []
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if n.startswith("word/") and n.endswith(".xml")]
        for name in names:
            xml = z.read(name).decode("utf-8", errors="ignore")
            xml = re.sub(r"<[^>]+>", " ", xml)
            texts.append(xml)
    return " ".join(texts)


def extract_pdf(path):
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        return "", f"PDF text extraction needs selectable text. Details: {exc}"


def extract_excel(path):
    try:
        import pandas as pd
    except Exception as exc:
        return "", f"Excel support requires pandas/openpyxl in the bundled Python runtime. Details: {exc}"

    parts = []
    try:
        sheets = pd.read_excel(path, sheet_name=None)
    except Exception as exc:
        return "", f"Excel file could not be read. Details: {exc}"

    for sheet_name, df in sheets.items():
        df = df.dropna(how="all").dropna(axis=1, how="all")
        parts.append(f"Sheet: {sheet_name}")
        parts.append(f"Rows: {len(df)} Columns: {len(df.columns)}")
        parts.append("Columns: " + ", ".join(str(c) for c in df.columns))

        if len(df):
            preview = df.head(30).fillna("").to_csv(index=False)
            parts.append("Preview CSV:")
            parts.append(preview)

        numeric = df.select_dtypes(include="number")
        if not numeric.empty:
            parts.append("Numeric summary:")
            summary = numeric.describe().transpose()[["count", "mean", "min", "max"]]
            parts.append(summary.to_csv())

        for col in df.columns:
            col_name = str(col)
            lower = col_name.lower()
            if any(term in lower for term in ["status", "stage", "source", "manager", "owner", "customer", "client", "lead"]):
                counts = df[col].astype(str).replace("nan", "").value_counts().head(12)
                if not counts.empty:
                    parts.append(f"Top values for {col_name}:")
                    parts.append(counts.to_csv(header=["count"]))

        date_cols = [c for c in df.columns if any(term in str(c).lower() for term in ["date", "created", "closed", "time"])]
        for col in date_cols[:3]:
            dates = pd.to_datetime(df[col], errors="coerce").dropna()
            if not dates.empty:
                parts.append(f"Date range for {col}: {dates.min().date()} to {dates.max().date()}")

        parts.append("---")

    return "\n".join(parts), ""


def main():
    path = sys.argv[1]
    ext = os.path.splitext(path)[1].lower()
    warning = ""
    if ext == ".pdf":
        text, warning = extract_pdf(path)
    elif ext == ".docx":
        text = extract_docx(path)
    elif ext in (".xlsx", ".xls"):
        text, warning = extract_excel(path)
    elif ext in (".txt", ".md", ".csv"):
        text = extract_txt(path)
    else:
        text = extract_txt(path)
        warning = "Unsupported file type; imported raw text where possible."

    text = re.sub(r"\s+\n", "\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text).strip()
    print(json.dumps({"text": text[:250000], "warning": warning}, ensure_ascii=False))


if __name__ == "__main__":
    main()
