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

  function setActionState(session) {
    const signedIn = Boolean(session?.user?.id);
    const saveButton = document.getElementById("cloudSaveBtn");
    const loadButton = document.getElementById("cloudLoadBtn");
    const signOutButton = document.getElementById("cloudSignOutBtn");
    [saveButton, loadButton].forEach(button => {
      if (!button) return;
      button.disabled = !signedIn;
      button.title = signedIn ? "" : "Алдымен email/password енгізіп, Кіру батырмасын басыңыз.";
    });
    if (signOutButton) {
      signOutButton.disabled = !signedIn;
      signOutButton.title = signedIn ? "" : "Әлі аккаунтқа кірмегенсіз.";
    }
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
      setActionState(null);
      setStatus("Cloud Sync: баптау жоқ. Supabase URL және public key қосылуы керек.", false);
      return null;
    }
    if (!window.supabase?.createClient) {
      setBadge("Not ready");
      setActionState(null);
      setStatus("Cloud Sync: Supabase library жүктелмеді. Интернетті тексеріп, бетті жаңартыңыз.", false);
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
    setStatus("Cloud Sync: тіркелу сұранысы жіберілді. Егер Supabase email confirmation сұраса, почтаңызды растаңыз, содан кейін Кіру басыңыз.", true);
    return data;
  }

  async function signIn(email, password) {
    const supabase = initSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await renderCloudStatus();
    setStatus("Cloud Sync: кірдіңіз. Енді Бұлтқа сақтау немесе Бұлттан алу батырмасын басуға болады.", true);
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
    setStatus("Cloud Sync: аккаунттан шықтыңыз. Осы браузердегі localStorage деректері орнында қалды.", false);
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
      setActionState(null);
      throw new Error("Алдымен email/password енгізіп, Кіру батырмасын басыңыз. Содан кейін ғана Save to cloud немесе Load from cloud жұмыс істейді.");
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
    setStatus("Cloud Sync: localStorage деректері бұлтқа сақталып жатыр...", true);
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .upsert(row, { onConflict: "user_id,workspace_id" })
      .select("updated_at")
      .single();
    if (error) throw error;
    lastCloudState = { payload, updated_at: data?.updated_at || row.updated_at };
    renderConflict(null);
    setStatus(`Cloud Sync: бұлтқа сақталды. Уақыты: ${lastCloudState.updated_at}.`, true);
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
      setStatus("Cloud Sync: бұлтта дерек әлі жоқ. Алдымен негізгі құрылғыдан Бұлтқа сақтау басыңыз.", false);
      return null;
    }
    renderConflict(cloud);
    const ok = confirm(`Бұлттағы деректі осы құрылғыға жүктейміз бе?\n\nCloud updated: ${cloud.updated_at || "unknown"}\n\nБұл осы браузердегі SanaBase localStorage дерегін ауыстырады.`);
    if (!ok) {
      setStatus("Cloud Sync: жүктеу тоқтатылды. Local дерек өзгерген жоқ.", false);
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
      setActionState(null);
      setStatus("Cloud Sync: баптау жоқ. Supabase URL және public key қосылуы керек.", false);
      return;
    }
    try {
      const session = await getSession();
      if (session?.user?.email) {
        setBadge("Signed in");
        setActionState(session);
        setStatus(`Cloud Sync: ${session.user.email} аккаунтымен кірдіңіз. Енді сақтау/жүктеу дайын.`, true);
      } else {
        setBadge("Configured");
        setActionState(null);
        setStatus("Cloud Sync: дайын. 1) Email/password жазыңыз. 2) Егер жаңа аккаунт болса Тіркелу басыңыз. 3) Бар аккаунт болса Кіру басыңыз. 4) Содан кейін Бұлтқа сақтау/Бұлттан алу қолданыңыз.", false);
      }
    } catch (error) {
      setBadge("Error");
      setActionState(null);
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
