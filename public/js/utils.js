(function () {
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function splitList(value) {
    return String(value || "")
      .split(/[,;\n]/)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  function keywords(value) {
    return value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 20);
  }

  window.SanaUtils = {
    isoDate,
    nowIso,
    addDays,
    isPast,
    inNextDays,
    money,
    escapeHtml,
    splitList,
    keywords
  };
})();
