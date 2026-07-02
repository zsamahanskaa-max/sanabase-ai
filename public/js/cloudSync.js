(function () {
  const CLOUD_TABLE = "sanabase_cloud_state";
  const DEFAULT_WORKSPACE_ID = "default";
  const PAYLOAD_VERSION = 1;

  function nowIso() {
    return new Date().toISOString();
  }

  function safeJsonParse(value, fallback = null) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getLocalKeys() {
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
    const keys = new Set(exactKeys.filter(key => localStorage.getItem(key) !== null));
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key.startsWith("sanabase-") || key.startsWith("zhadyra_") || key.startsWith("sanabot-")) {
        keys.add(key);
      }
    }
    return [...keys].sort();
  }

  function readLocalState() {
    return safeJsonParse(localStorage.getItem("sanabase-state"), {}) || {};
  }

  function buildCloudPayload(state = readLocalState()) {
    return {
      app: "SanaBase",
      payloadVersion: PAYLOAD_VERSION,
      exportedAt: nowIso(),
      state
    };
  }

  function buildCloudRow({ userId, workspaceId = DEFAULT_WORKSPACE_ID, deviceLabel = "" } = {}) {
    return {
      user_id: userId || "",
      workspace_id: workspaceId || DEFAULT_WORKSPACE_ID,
      payload: buildCloudPayload(),
      local_keys: getLocalKeys(),
      device_label: deviceLabel || "",
      updated_at: nowIso()
    };
  }

  function compareCloudState(localUpdatedAt, cloudUpdatedAt) {
    const localTime = Date.parse(localUpdatedAt || "");
    const cloudTime = Date.parse(cloudUpdatedAt || "");
    if (!Number.isFinite(localTime) && !Number.isFinite(cloudTime)) return "unknown";
    if (!Number.isFinite(localTime)) return "cloud-newer";
    if (!Number.isFinite(cloudTime)) return "local-newer";
    if (Math.abs(localTime - cloudTime) < 1000) return "same";
    return localTime > cloudTime ? "local-newer" : "cloud-newer";
  }

  function conflictOptions() {
    return ["Upload local", "Download cloud", "Cancel"];
  }

  function getCloudSession() {
    return {
      authenticated: false,
      userId: "",
      table: CLOUD_TABLE,
      workspaceId: DEFAULT_WORKSPACE_ID,
      note: "Supabase Auth UI is not connected yet."
    };
  }

  function safeCloudStatus(message, ok = false) {
    const node = document.getElementById("cloudStatus");
    if (!node) return;
    node.textContent = message;
    node.className = ok ? "ok" : "bad";
  }

  window.SanaCloudSync = {
    CLOUD_TABLE,
    DEFAULT_WORKSPACE_ID,
    PAYLOAD_VERSION,
    getLocalKeys,
    readLocalState,
    buildCloudPayload,
    buildCloudRow,
    compareCloudState,
    conflictOptions,
    getCloudSession,
    safeCloudStatus
  };
})();
