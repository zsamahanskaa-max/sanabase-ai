(function () {
  function getItem(key) {
    return localStorage.getItem(key);
  }

  function setItem(key, value) {
    localStorage.setItem(key, value);
  }

  function removeItem(key) {
    localStorage.removeItem(key);
  }

  function readJson(key, fallback = null) {
    const raw = getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  }

  function writeJson(key, value) {
    setItem(key, JSON.stringify(value));
  }

  window.SanaStorage = {
    getItem,
    setItem,
    removeItem,
    readJson,
    writeJson
  };
})();
