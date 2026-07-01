(function () {
  async function requestJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function ai(payload) {
    return requestJson("api/ai", payload);
  }

  function importFile(payload) {
    return requestJson("api/import", payload);
  }

  window.SanaApi = {
    requestJson,
    ai,
    importFile
  };
})();
