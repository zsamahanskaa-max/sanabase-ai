(function () {
  const CLOUD_TABLE = "sanabase_cloud_state";
  const WORKSPACE_ID = "default";
  const PAYLOAD_VERSION = 1;
  let client = null;
  let lastCloudState = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function statusNode() {
    return document.getElementById("cloudStatus");
  }

  function conflictNode() {
    return document.getElementById("cloudConflictPanel");
  }

  function setStatus(message, ok = false) {
    const node = statusNode();
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("ok", Boolean(ok));
    node.classList.toggle("bad", !ok);
  }

  function setBadge(message) {
    const node = document.getElementById("cloudBadge");
    if (node) node.textContent = message;
  }

  function config() {
    return {
      url: String(window.SANABASE_SUPABASE_URL || "").trim().replace(/\/+$/, ""),
      anonKey: String(window.SANABASE_SUPABASE_ANON_KEY || "").trim()
    };
  }

  function hasConfig() {
    const cfg = config();
    return Boolean(cfg.url && cfg.anonKey);
  }

  function initSupabase() {
    if (client) return client;
    const cfg = config();
    if (!cfg.url || !cfg.anonKey) {
      setBadge("Not configured");
      setStatus("Cloud Sync: Not configured. Set window.SANABASE_SUPABASE_URL and window.SANABASE_SUPABASE_ANON_KEY.", false);
      return null;
    }
    if (!window.supabase?.createClient) {
      setBadge("Not ready");
      setStatus("Cloud Sync: Supabase JS CDN did not load.", false);
      return null;
    }
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    setBadge("Configured");
    return client;
  }

  async function getSession() {
    const supabase = initSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function signUp(email, password) {
    const supabase = initSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    await renderCloudStatus();
    setStatus("Cloud Sync: sign up sent. Email confirmation may be required.", true);
    return data;
  }

  async function signIn(email, password) {
    const supabase = initSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await renderCloudStatus();
    setStatus("Cloud Sync: signed in.", true);
    return data;
  }

  async function signOut() {
    const supabase = initSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    lastCloudState = null;
    renderConflict(null);
    await renderCloudStatus();
    setStatus("Cloud Sync: signed out. Local data is still saved in this browser.", false);
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
      if (key.startsWith("sanabase-") || key.startsWith("zhadyra_") || key.startsWith("sanabot-")) keys.add(key);
    }
    return [...keys].sort();
  }

  function collectLocalData() {
    const payload = {};
    getLocalKeys().forEach(key => {
      payload[key] = localStorage.getItem(key);
    });
    payload._metadata = {
      app: "SanaBase",
      payloadVersion: PAYLOAD_VERSION,
      workspaceId: WORKSPACE_ID,
      exportedAt: nowIso()
    };
    return payload;
  }

  function restoreLocalData(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Cloud payload is invalid.");
    }
    Object.entries(payload).forEach(([key, value]) => {
      if (key === "_metadata") return;
      if (typeof key !== "string") return;
      if (!(key.startsWith("sanabase-") || key.startsWith("zhadyra_") || key.startsWith("sanabot-") || ["goals", "projects", "challenges"].includes(key))) return;
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, String(value));
    });
    if (window.SanaAppBridge?.reloadFromLocalStorage) {
      window.SanaAppBridge.reloadFromLocalStorage();
    } else {
      window.location.reload();
    }
  }

  async function requireSession() {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Please sign in first.");
    }
    return session;
  }

  async function saveToCloud() {
    const supabase = initSupabase();
    if (!supabase) return null;
    const session = await requireSession();
    const payload = collectLocalData();
    const row = {
      user_id: session.user.id,
      workspace_id: WORKSPACE_ID,
      payload,
      local_keys: Object.keys(payload).filter(key => key !== "_metadata"),
      device_label: navigator.userAgent.slice(0, 180),
      updated_at: nowIso()
    };
    setStatus("Cloud Sync: saving local data to cloud...", true);
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .upsert(row, { onConflict: "user_id,workspace_id" })
      .select("updated_at")
      .single();
    if (error) throw error;
    lastCloudState = { payload, updated_at: data?.updated_at || row.updated_at };
    renderConflict(null);
    setStatus(`Cloud Sync: saved to cloud at ${lastCloudState.updated_at}.`, true);
    return lastCloudState;
  }

  async function getCloudState() {
    const supabase = initSupabase();
    if (!supabase) return null;
    const session = await requireSession();
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .select("payload, local_keys, updated_at, device_label")
      .eq("user_id", session.user.id)
      .eq("workspace_id", WORKSPACE_ID)
      .maybeSingle();
    if (error) throw error;
    lastCloudState = data || null;
    return lastCloudState;
  }

  async function loadFromCloud() {
    const cloud = await getCloudState();
    if (!cloud?.payload) {
      setStatus("Cloud Sync: no cloud data found yet. Save to cloud first.", false);
      return null;
    }
    renderConflict(cloud);
    const ok = confirm(`Download cloud data?\n\nCloud updated: ${cloud.updated_at || "unknown"}\n\nThis will overwrite SanaBase localStorage in this browser.`);
    if (!ok) {
      setStatus("Cloud Sync: download cancelled. Local data was not changed.", false);
      return null;
    }
    restoreLocalData(cloud.payload);
    return cloud;
  }

  async function compareLocalCloud() {
    const local = collectLocalData();
    const cloud = await getCloudState();
    const localUpdatedAt = local._metadata?.exportedAt || "";
    const cloudUpdatedAt = cloud?.updated_at || "";
    const result = compareDates(localUpdatedAt, cloudUpdatedAt);
    renderConflict(cloud, result, localUpdatedAt);
    return { result, localUpdatedAt, cloudUpdatedAt, cloud };
  }

  function compareDates(localUpdatedAt, cloudUpdatedAt) {
    const localTime = Date.parse(localUpdatedAt || "");
    const cloudTime = Date.parse(cloudUpdatedAt || "");
    if (!Number.isFinite(localTime) && !Number.isFinite(cloudTime)) return "unknown";
    if (!Number.isFinite(localTime)) return "cloud-newer";
    if (!Number.isFinite(cloudTime)) return "local-newer";
    if (Math.abs(localTime - cloudTime) < 1000) return "same";
    return localTime > cloudTime ? "local-newer" : "cloud-newer";
  }

  function renderConflict(cloud, result = "", localUpdatedAt = "") {
    const node = conflictNode();
    if (!node) return;
    if (!cloud) {
      node.hidden = true;
      node.innerHTML = "";
      return;
    }
    node.hidden = false;
    node.innerHTML = `
      <strong>Cloud conflict protection</strong>
      <span>Local snapshot: ${escapeHtml(localUpdatedAt || "now")}</span>
      <span>Cloud updated: ${escapeHtml(cloud.updated_at || "unknown")}</span>
      <span>Status: ${escapeHtml(result || "manual choice required")}</span>
      <div class="cloud-actions">
        <button type="button" data-cloud-conflict="upload">Upload local</button>
        <button type="button" data-cloud-conflict="download">Download cloud</button>
        <button type="button" data-cloud-conflict="cancel">Cancel</button>
      </div>
    `;
    node.querySelectorAll("[data-cloud-conflict]").forEach(button => {
      button.addEventListener("click", () => {
        const action = button.dataset.cloudConflict;
        if (action === "upload") saveToCloud().catch(error => setStatus(`Cloud Sync error: ${shortError(error)}`, false));
        if (action === "download") loadFromCloud().catch(error => setStatus(`Cloud Sync error: ${shortError(error)}`, false));
        if (action === "cancel") renderConflict(null);
      });
    });
  }

  async function renderCloudStatus() {
    if (!hasConfig()) {
      setBadge("Not configured");
      setStatus("Cloud Sync: Not configured. Add window.SANABASE_SUPABASE_URL and window.SANABASE_SUPABASE_ANON_KEY before cloud sync.", false);
      return;
    }
    try {
      const session = await getSession();
      if (session?.user?.email) {
        setBadge("Signed in");
        setStatus(`Cloud Sync: signed in as ${session.user.email}.`, true);
      } else {
        setBadge("Configured");
        setStatus("Cloud Sync: configured. Sign in to sync laptop and phone.", false);
      }
    } catch (error) {
      setBadge("Error");
      setStatus(`Cloud Sync error: ${shortError(error)}`, false);
    }
  }

  function shortError(error) {
    return String(error?.message || error).slice(0, 280);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  window.SanaCloudSync = {
    CLOUD_TABLE,
    WORKSPACE_ID,
    PAYLOAD_VERSION,
    initSupabase,
    signUp,
    signIn,
    signOut,
    getSession,
    collectLocalData,
    restoreLocalData,
    saveToCloud,
    loadFromCloud,
    getCloudState,
    compareLocalCloud,
    renderCloudStatus,
    getLocalKeys
  };

  window.addEventListener("DOMContentLoaded", () => {
    renderCloudStatus();
  });
})();
