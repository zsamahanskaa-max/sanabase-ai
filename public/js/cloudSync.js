(function () {
  const CLOUD_TABLE = "sanabase_cloud_state";
  const WORKSPACE_ID = "default";
  const PAYLOAD_VERSION = 1;
  const AUTO_SAVE_DELAY_MS = 1800;
  const AUTO_CHECK_DELAY_MS = 3500;
  let client = null;
  let lastCloudState = null;
  let autoSaveTimer = null;
  let autoCheckTimer = null;
  let autoBusy = false;
  let autoPaused = false;

  function nowIso() {
    return new Date().toISOString();
  }

  function statusNode() {
    return document.getElementById("cloudStatus");
  }

  function conflictNode() {
    return document.getElementById("cloudConflictPanel");
  }

  function diagnosticsNode() {
    return document.getElementById("cloudDiagnostics");
  }

  function autoStatusNode() {
    return document.getElementById("cloudAutoStatus");
  }

  function setStatus(message, ok = false) {
    const node = statusNode();
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("ok", Boolean(ok));
    node.classList.toggle("bad", !ok);
  }

  function setAutoStatus(message, ok = true) {
    const node = autoStatusNode();
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

  function nextStepText({ signedIn, cloudFound, localCount }) {
    if (!signedIn) {
      return "Email link расталғаннан кейін де осы жерде email/password жазып, Кіру басыңыз.";
    }
    if (!cloudFound && localCount > 0) {
      return "Бұл негізгі құрылғы болса, Бұлтқа сақтау басыңыз. Содан кейін телефонда Кіру және Бұлттан алу басылады.";
    }
    if (!cloudFound) {
      return "Cloud-та дерек жоқ. Алдымен дерек бар құрылғыдан Бұлтқа сақтау басу керек.";
    }
    return "Cloud-та дерек бар. Екінші құрылғыда Бұлттан алу бассаңыз, дерек көшеді.";
  }

  function renderDiagnostics(info = {}) {
    const node = diagnosticsNode();
    if (!node) return;
    const localKeys = Array.isArray(info.localKeys) ? info.localKeys : getLocalKeys();
    const signedIn = Boolean(info.session?.user?.id);
    const cloudFound = Boolean(info.cloud?.payload);
    const cloudKeys = Array.isArray(info.cloud?.local_keys)
      ? info.cloud.local_keys.length
      : Object.keys(info.cloud?.payload || {}).filter(key => key !== "_metadata").length;
    const email = info.session?.user?.email || "Кірмеген";
    const nextStep = nextStepText({ signedIn, cloudFound, localCount: localKeys.length });
    node.hidden = false;
    node.innerHTML = `
      <strong>Sync диагностика</strong>
      <span>Аккаунт: ${escapeHtml(email)}</span>
      <span>Local дерек: ${localKeys.length} key</span>
      <span>Cloud дерек: ${cloudFound ? `${cloudKeys} key` : "жоқ"}</span>
      <span>Cloud updated: ${escapeHtml(info.cloud?.updated_at || "жоқ")}</span>
      <span>Келесі қадам: ${escapeHtml(nextStep)}</span>
    `;
  }

  async function fetchCloudStateForSession(session) {
    const supabase = initSupabase();
    if (!supabase || !session?.user?.id) return null;
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .select("payload, local_keys, updated_at, device_label")
      .eq("user_id", session.user.id)
      .eq("workspace_id", WORKSPACE_ID)
      .maybeSingle();
    if (error) throw error;
    return data || null;
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

  function localSafetyMeta() {
    try {
      return JSON.parse(localStorage.getItem("sanabase-safety-meta") || "{}") || {};
    } catch {
      return {};
    }
  }

  function localUpdatedAt() {
    const meta = localSafetyMeta();
    return meta.lastLocalSaveAt || meta.updatedAt || "";
  }

  function cloudUpdatedAt(cloud) {
    return cloud?.updated_at || cloud?.payload?._metadata?.exportedAt || "";
  }

  function isMeaningfulConflict(compareResult) {
    return compareResult === "cloud-newer";
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

  async function saveToCloud(options = {}) {
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
    if (!options.silent) setStatus("Cloud Sync: localStorage data is saving to cloud...", true);
    setAutoStatus("Auto Sync: saving local data to cloud...", true);
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .upsert(row, { onConflict: "user_id,workspace_id" })
      .select("updated_at")
      .single();
    if (error) throw error;
    lastCloudState = { payload, updated_at: data?.updated_at || row.updated_at };
    window.SanaAppBridge?.markCloudSaveComplete?.();
    renderConflict(null);
    setAutoStatus(`Auto Sync: saved ${lastCloudState.updated_at}.`, true);
    if (!options.silent) setStatus(`Cloud Sync: saved to cloud. Time: ${lastCloudState.updated_at}.`, true);
    return lastCloudState;
  }

  async function getCloudState() {
    const supabase = initSupabase();
    if (!supabase) return null;
    const session = await requireSession();
    lastCloudState = await fetchCloudStateForSession(session);
    return lastCloudState;
  }

  async function loadFromCloud(options = {}) {
    const cloud = await getCloudState();
    if (!cloud?.payload) {
      setStatus("Cloud Sync: бұлтта дерек әлі жоқ. Алдымен негізгі құрылғыдан Бұлтқа сақтау басыңыз.", false);
      return null;
    }
    renderConflict(cloud, "download requested", localUpdatedAt());
    const ok = confirm(`Бұлттағы деректі осы құрылғыға жүктейміз бе?\n\nCloud updated: ${cloud.updated_at || "unknown"}\n\nБұл осы браузердегі SanaBase localStorage дерегін ауыстырады.`);
    if (!ok) {
      setStatus("Cloud Sync: жүктеу тоқтатылды. Local дерек өзгерген жоқ.", false);
      return null;
    }
    window.SanaAppBridge?.createRestorePoint?.("before-cloud-load");
    const emergency = window.SanaAppBridge?.createEmergencyBackup?.("before-cloud-load");
    if (emergency?.filename) {
      setStatus(`Cloud Sync: emergency backup дайын: ${emergency.filename}. Cloud дерек жүктеліп жатыр...`, true);
    }
    restoreLocalData(cloud.payload);
    window.SanaAppBridge?.markCloudLoadComplete?.();
    setAutoStatus(`Auto Sync: cloud loaded ${cloud.updated_at || "ready"}.`, true);
    if (!options.silent) setStatus(`Cloud Sync: cloud data loaded ${cloud.updated_at || "ready"}.`, true);
    return cloud;
  }

  async function compareLocalCloud() {
    const local = collectLocalData();
    const cloud = await getCloudState();
    const localTime = localUpdatedAt() || local._metadata?.exportedAt || "";
    const cloudTime = cloudUpdatedAt(cloud);
    const result = compareDates(localTime, cloudTime);
    renderConflict(cloud, result, localTime);
    return { result, localUpdatedAt: localTime, cloudUpdatedAt: cloudTime, cloud };
  }

  async function autoCheckCloud() {
    if (autoBusy || autoPaused || !hasConfig()) return null;
    const session = await getSession();
    setActionState(session);
    if (!session?.user?.id) {
      setAutoStatus("Auto Sync: sign in required.", false);
      return null;
    }
    const cloud = await fetchCloudStateForSession(session);
    lastCloudState = cloud;
    if (!cloud?.payload) {
      setAutoStatus("Auto Sync: no cloud data yet. Local changes will upload after save.", true);
      return { result: "no-cloud", cloud: null };
    }
    const localTime = localUpdatedAt();
    const cloudTime = cloudUpdatedAt(cloud);
    const result = compareDates(localTime, cloudTime);
    if (isMeaningfulConflict(result)) {
      autoPaused = true;
      renderConflict(cloud, result, localTime);
      setAutoStatus("Auto Sync paused: cloud is newer. Choose Upload local or Download cloud.", false);
      setStatus("Cloud Sync: conflict found. Cloud has newer data, so auto overwrite is paused.", false);
    } else {
      setAutoStatus(`Auto Sync: ready. Local ${localTime || "unknown"}, cloud ${cloudTime || "none"}.`, true);
    }
    return { result, cloud, localUpdatedAt: localTime, cloudUpdatedAt: cloudTime };
  }

  function scheduleAutoCheck() {
    clearTimeout(autoCheckTimer);
    autoCheckTimer = setTimeout(() => {
      autoCheckCloud().catch(error => setAutoStatus(`Auto Sync check error: ${shortError(error)}`, false));
    }, AUTO_CHECK_DELAY_MS);
  }

  function scheduleAutoSave() {
    if (autoPaused || !hasConfig()) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      if (autoBusy || autoPaused) return;
      autoBusy = true;
      try {
        const session = await getSession();
        setActionState(session);
        if (!session?.user?.id) {
          setAutoStatus("Auto Sync: sign in to sync phone and laptop.", false);
          return;
        }
        const cloud = await fetchCloudStateForSession(session);
        lastCloudState = cloud;
        const result = compareDates(localUpdatedAt(), cloudUpdatedAt(cloud));
        if (cloud?.payload && isMeaningfulConflict(result)) {
          autoPaused = true;
          renderConflict(cloud, result, localUpdatedAt());
          setAutoStatus("Auto Sync paused: cloud is newer. Select an action.", false);
          setStatus("Cloud Sync: cloud has newer data. Auto save stopped to protect your data.", false);
          return;
        }
        await saveToCloud({ silent: true, auto: true });
      } catch (error) {
        setAutoStatus(`Auto Sync error: ${shortError(error)}`, false);
      } finally {
        autoBusy = false;
      }
    }, AUTO_SAVE_DELAY_MS);
  }

  async function checkSync() {
    if (!hasConfig()) {
      setBadge("Not configured");
      setActionState(null);
      setStatus("Cloud Sync: баптау жоқ. Supabase URL және anon key қосылуы керек.", false);
      renderDiagnostics({ localKeys: getLocalKeys(), session: null, cloud: null });
      return null;
    }
    const session = await getSession();
    setActionState(session);
    if (!session?.user?.id) {
      setBadge("Configured");
      renderDiagnostics({ localKeys: getLocalKeys(), session: null, cloud: null });
      setStatus("Cloud Sync: әлі аккаунтқа кірмегенсіз. Email/password жазып, Кіру басыңыз.", false);
      return null;
    }
    const cloud = await fetchCloudStateForSession(session);
    lastCloudState = cloud;
    renderDiagnostics({ localKeys: getLocalKeys(), session, cloud });
    if (cloud?.payload) {
      setBadge("Cloud ready");
      setStatus("Cloud Sync: cloud-та дерек бар. Бұлттан алу арқылы екінші құрылғыға көшіруге болады.", true);
    } else {
      setBadge("No cloud data");
      setStatus("Cloud Sync: аккаунтқа кірдіңіз, бірақ cloud-та дерек жоқ. Дерек бар құрылғыдан Бұлтқа сақтау басыңыз.", false);
    }
    return { session, cloud };
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
        if (action === "upload") {
          autoPaused = false;
          saveToCloud().catch(error => setStatus(`Cloud Sync error: ${shortError(error)}`, false));
        }
        if (action === "download") {
          autoPaused = false;
          loadFromCloud().catch(error => setStatus(`Cloud Sync error: ${shortError(error)}`, false));
        }
        if (action === "cancel") {
          autoPaused = false;
          renderConflict(null);
          setAutoStatus("Auto Sync: conflict dismissed. Next local save will sync.", true);
        }
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
        setAutoStatus("Auto Sync: signed in. Checking cloud freshness...", true);
        scheduleAutoCheck();
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
    const message = String(error?.message || error);
    if (/invalid login credentials/i.test(message)) {
      return "Email немесе password дұрыс емес. Егер бұл телефонда бірінші рет кіріп тұрсаңыз, алдымен дәл осы email/password-пен Тіркелу басыңыз. Егер бұрын тіркелген болсаңыз, password-ты қайта тексеріңіз.";
    }
    if (/email not confirmed/i.test(message)) {
      return "Email әлі расталмаған. Почтаңызды ашып, Supabase жіберген confirmation хатты растаңыз, содан кейін Кіру басыңыз.";
    }
    if (/signup.*disabled/i.test(message)) {
      return "Тіркелу Supabase баптауында өшірулі. Бұл жағдайда бұрын тіркелген email/password-пен Кіру керек.";
    }
    return message.slice(0, 280);
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
    checkSync,
    autoCheckCloud,
    scheduleAutoCheck,
    scheduleAutoSave,
    getLocalKeys
  };

  window.addEventListener("DOMContentLoaded", () => {
    renderCloudStatus();
    scheduleAutoCheck();
  });
})();
