import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9333);
const RESULTS_DIR = path.resolve("test-results");
// Keep Chromium's profile path short. CacheStorage still encounters Windows
// path-length failures when the profile is nested inside a deep workspace.
const PROFILE_DIR = path.join(os.tmpdir(), `vektr-${process.pid}-${Date.now()}`);

await mkdir(RESULTS_DIR, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-software-rasterizer",
    "--disable-features=Vulkan,UseSkiaRenderer",
    "--in-process-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

let browserLog = "";
chrome.stderr.on("data", (chunk) => {
  browserLog += chunk.toString();
});

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForJson(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (_error) {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else if (message.method) {
        this.events.push(message);
      }
    };
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
  }

  call(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket?.close();
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let client;
try {
  await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
  const targetResponse = await fetch(
    `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE_URL)}`,
    { method: "PUT" },
  );
  if (!targetResponse.ok) throw new Error(`Unable to create browser target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.call("Runtime.enable");
  await client.call("Page.enable");
  await client.call("Log.enable");
  await client.call("Emulation.setDeviceMetricsOverride", {
    width: 412,
    height: 915,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await client.call("Page.navigate", { url: BASE_URL });
  await delay(800);

  async function evaluate(expression) {
    const result = await client.call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }

  assert(await evaluate("document.body.innerText.includes('Push A')"), "Today screen did not render");
  assert(await evaluate("typeof VEKTR_STATE === 'object'"), "State module did not load");
  assert(await evaluate("typeof VEKTR_EXERCISES === 'object'"), "Exercise module did not load");
  assert(await evaluate("typeof VEKTR_ILLUSTRATIONS === 'object'"), "Illustration module did not load");
  assert(await evaluate("typeof VEKTR_PLATES === 'object'"), "Plate calculator module did not load");
  assert(await evaluate("typeof VEKTR_PROGRAMS === 'object'"), "Program module did not load");
  assert(await evaluate("VEKTR_EXERCISES.EXERCISE_LIBRARY.length >= 100"), "Canonical library is incomplete");
  assert(
    await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
    "Mobile viewport has horizontal overflow",
  );

  const workoutNames = ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"];
  for (const workoutName of workoutNames) {
    const result = await evaluate(`(() => {
      state.active = null;
      pendingWorkoutName = ${JSON.stringify(workoutName)};
      beginWorkoutWithBusy('2');
      const snapshot = { name: state.active?.name, items: state.active?.items?.length || 0 };
      state.active = null;
      save();
      render();
      return snapshot;
    })()`);
    assert(result.name === workoutName, `${workoutName} did not start`);
    assert(result.items > 0, `${workoutName} has no exercises`);
  }

  const swapAudit = await evaluate(`(() => {
    state.active = null;
    pendingWorkoutName = 'Pull A';
    beginWorkoutWithBusy('2');
    swapItem(state.active.items[0].id);
    return {
      cards: document.querySelectorAll('#swapModal .swap-card').length,
      illustrations: document.querySelectorAll('#swapModal svg.exercise-illustration').length,
      identities: [...document.querySelectorAll('#swapModal svg.exercise-illustration')].map(svg => svg.dataset.exerciseId),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);
  assert(swapAudit.cards >= 1, "Swap modal did not render replacement cards");
  assert(swapAudit.illustrations === swapAudit.cards, "A visible swap card has no accurate illustration");
  assert(new Set(swapAudit.identities).size === swapAudit.identities.length, "Swap modal repeated an exercise illustration");
  assert(!swapAudit.overflow, "Swap modal introduced horizontal overflow");
  const swapScreenshot = await client.call("Page.captureScreenshot", { format: "png", fromSurface: true });
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(RESULTS_DIR, "browser-smoke-swap.png"), Buffer.from(swapScreenshot.data, "base64")),
  );
  await evaluate("closeSwapModal(); state.active = null; save(); render();");

  const correctionAudit = await evaluate(`(() => {
    state.gym = 'Travel';
    state.active = null;
    pendingWorkoutName = 'Pull A';
    beginWorkoutWithBusy('2');
    const curl = state.active.items.find(item => item.name === 'Cable Curl');
    curl.weight = 65;
    curl.sets = [10, 9, 8];
    pendingSwapId = curl.id;
    chooseSwap('EZ-Bar Curl');
    renameExercise(curl.id, 'Barbell Curl');
    const corrected = { name: curl.name, exerciseId: curl.exerciseId, originalName: curl.originalName, sets: [...curl.sets], weight: curl.weight };
    restoreOriginalExercise(curl.id);
    const restored = { name: curl.name, exerciseId: curl.exerciseId, sets: [...curl.sets], weight: curl.weight };
    state.active = null;
    save();
    render();
    return { corrected, restored };
  })()`);
  assert(correctionAudit.corrected.name === "Barbell Curl", "Replacement rename did not persist");
  assert(correctionAudit.corrected.exerciseId === "barbell-curl", "Replacement canonical ID is wrong");
  assert(correctionAudit.corrected.originalName === "Cable Curl", "Original exercise was not retained");
  assert(correctionAudit.corrected.sets.join(",") === "10,9,8" && correctionAudit.corrected.weight === 65, "Correction lost logged work");
  assert(correctionAudit.restored.exerciseId === "cable-curl", "Restore original exercise failed");
  assert(correctionAudit.restored.sets.join(",") === "10,9,8" && correctionAudit.restored.weight === 65, "Restore lost logged work");

  const calculatorAudit = await evaluate(`(() => {
    state.active = null;
    pendingWorkoutName = 'Push A';
    beginWorkoutWithBusy('2');
    const bench = state.active.items.find(item => item.name === 'Bench Press');
    openPlateCalculator(bench.id);
    const targetModeVisible = document.body.innerText.includes('TARGET WEIGHT') && document.body.innerText.includes('PLATES LOADED');
    setPlateTarget('180');
    const nearestVisible = document.body.innerText.includes('175 lb') && document.body.innerText.includes('185 lb');
    closePlateModal();
    const unchangedAfterClose = bench.weight === 175;
    openPlateCalculator(bench.id);
    setPlateMode('loaded');
    clearLoadedPlates();
    addLoadedPlate(45);
    addLoadedPlate(25);
    addLoadedPlate(5);
    const loadedTotalVisible = document.body.innerText.includes('195 lb');
    return { id: bench.id, targetModeVisible, nearestVisible, unchangedAfterClose, loadedTotalVisible, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  })()`);
  assert(calculatorAudit.targetModeVisible, "Dual calculator modes are not visible");
  assert(calculatorAudit.nearestVisible, "Target mode nearest loads are wrong");
  assert(calculatorAudit.unchangedAfterClose, "Closing calculator changed the exercise");
  assert(calculatorAudit.loadedTotalVisible, "Loaded mode did not calculate 195 lb");
  assert(!calculatorAudit.overflow, "Plate calculator introduced horizontal overflow");
  const plateScreenshot = await client.call("Page.captureScreenshot", { format: "png", fromSurface: true });
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(RESULTS_DIR, "browser-smoke-plate.png"), Buffer.from(plateScreenshot.data, "base64")),
  );
  const appliedWeight = await evaluate(`(() => { applyPlateWeight(); return state.active.items.find(item => item.id === ${JSON.stringify(calculatorAudit.id)}).weight; })()`);
  assert(appliedWeight === 195, "Apply Weight did not update the active exercise");
  await evaluate("state.active = null; save(); render();");

  const progressAudit = await evaluate(`(() => {
    state.history = [
      { id:'w2', name:'Pull A', date:'2026-07-10', gym:'Home', duration:52, items:[
        { id:'e2', exerciseId:'barbell-row', name:'Barbell Bent-Over Row', displayNameAtTimeOfWorkout:'Barbell Bent-Over Row', weight:135, sets:[10,10,10], workingSets:3, target:10, done:true, skipped:false, coach:'INCREASE', next:140 },
        { id:'e3', exerciseId:'barbell-curl', name:'Barbell Curl', displayNameAtTimeOfWorkout:'Barbell Curl', weight:65, sets:[10,10,9], workingSets:3, target:10, done:true, skipped:false, coach:'REPEAT', next:65 }
      ], core:[{ exerciseId:'plank', name:'Plank', target:45, actual:45, completed:true }] },
      { id:'w1', name:'Pull A', date:'2026-07-03', gym:'Travel', duration:45, items:[
        { id:'e1', exerciseId:'barbell-row', name:'Barbell Bent-Over Row', displayNameAtTimeOfWorkout:'Barbell Bent-Over Row', weight:125, sets:[10,10,10], workingSets:3, target:10, done:true, skipped:false, coach:'INCREASE', next:135 }
      ], core:[] }
    ];
    state.bodyweight = [{ value:180.2, date:'2026-07-10' }, { value:181, date:'2026-07-03' }];
    page='progress';
    render();
    const categories = [...document.querySelectorAll('details.category')].map(node => node.textContent.trim());
    const collapsed = [...document.querySelectorAll('details.category')].every(node => !node.open);
    const bodyweight = document.body.innerText.includes('180.2 lb') && document.body.innerText.includes('-0.8 lb');
    const noDump = !document.body.innerText.includes('Last sets:');
    return { categories, collapsed, bodyweight, noDump, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  })()`);
  assert(progressAudit.categories.some(text => text.includes('Back')), "Progress has no Back category");
  assert(progressAudit.categories.some(text => text.includes('Biceps')), "Progress has no Biceps category");
  assert(progressAudit.categories.some(text => text.includes('Core')), "Logged core is missing from Progress");
  assert(progressAudit.collapsed, "Progress categories do not start collapsed");
  assert(progressAudit.bodyweight, "Compact bodyweight summary is wrong");
  assert(progressAudit.noDump, "Old continuous Progress dump is still visible");
  assert(!progressAudit.overflow, "Progress introduced horizontal overflow");
  const progressScreenshot = await client.call("Page.captureScreenshot", { format: "png", fromSurface: true });
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(RESULTS_DIR, "browser-smoke-progress.png"), Buffer.from(progressScreenshot.data, "base64")),
  );

  const historySettingsCoreAudit = await evaluate(`(() => {
    page='history'; render();
    const historyCollapsed = document.querySelectorAll('details.history-workout').length === 2 && [...document.querySelectorAll('details.history-workout')].every(node => !node.open);
    page='settings'; render();
    const cleanSettings = document.body.innerText.includes('Training Program') && !document.body.innerText.includes('Install app') && !document.body.innerText.includes('Add gym');
    page='today';state.active = null; pendingWorkoutName='Push A'; beginWorkoutWithBusy('2');
    startCoreLog('5');
    setCoreActual(0,15);
    saveCoreLog();
    const savedCore = state.history[0].core;
    return { historyCollapsed, cleanSettings, savedCoreLength:savedCore.length, firstCore:savedCore[0] };
  })()`);
  assert(historySettingsCoreAudit.historyCollapsed, "History is not compact/collapsed");
  assert(historySettingsCoreAudit.cleanSettings, "Settings still contains setup clutter");
  assert(historySettingsCoreAudit.savedCoreLength === 3 && historySettingsCoreAudit.firstCore.actual === 15 && historySettingsCoreAudit.firstCore.completed, "Core was not actually logged");

  const workoutEngineAudit = await evaluate(`(() => {
    state.active = null;
    pendingWorkoutName = 'Push A';
    beginWorkoutWithBusy('2');
    state.active.startedAt = Date.now() - 65000;
    render();
    updateWorkoutTimer();
    const timerText = document.getElementById('workoutTimer')?.textContent;
    const bench = state.active.items.find(item => item.exerciseId === 'bench-press');
    bench.sets = Array(bench.workingSets).fill(bench.target);
    completeItem(bench.id);
    const progression = { coach: bench.coach, next: bench.next };
    xDoneToggle(bench.id);
    changeNextWeight(bench.id, 177.5);
    const override = bench.nextOverride;
    const fourSet = state.active.items[1];
    fourSet.workingSets = 4;
    fourSet.sets = [null, null, null, null];
    render();
    const setLabels = [...document.querySelectorAll('.exercise')].find(card => card.textContent.includes(fourSet.name))?.querySelectorAll('.entry-grid label').length;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { timerText, progression, override, setLabels, overflow };
  })()`);
  assert(workoutEngineAudit.timerText === "1:05", `Persistent timer rendered ${workoutEngineAudit.timerText}`);
  assert(workoutEngineAudit.progression.coach === "INCREASE" && workoutEngineAudit.progression.next === 180, "Workout progression did not increase correctly");
  assert(workoutEngineAudit.override === 177.5, "Manual next-weight override failed");
  assert(workoutEngineAudit.setLabels === 5, "Variable four-set UI did not render Weight + S1-S4");
  assert(!workoutEngineAudit.overflow, "Variable sets introduced horizontal overflow");
  const activeScreenshot = await client.call("Page.captureScreenshot", { format: "png", fromSurface: true });
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(RESULTS_DIR, "browser-smoke-active.png"), Buffer.from(activeScreenshot.data, "base64")),
  );
  await evaluate("state.active = null; save(); render();");

  const legacyState = {
    rotationIndex: 1,
    gym: "Travel Gym",
    notes: { "Bench Press": "test note" },
    history: [
      {
        name: "Push A",
        date: "2026-07-01",
        items: [{ name: "Bench Press", weight: 175, target: 6, sets: [6, 6, 5], done: true }],
      },
    ],
  };
  await evaluate(`localStorage.setItem('flexppl', ${JSON.stringify(JSON.stringify(legacyState))})`);
  await client.call("Page.reload", { ignoreCache: true });
  await delay(500);
  assert(await evaluate("state.stateVersion === VEKTR_STATE.CURRENT_STATE_VERSION"), "Legacy state did not migrate");
  assert(await evaluate("state.history[0].items[0].sets.join(',') === '6,6,5'"), "Legacy sets changed during migration");
  assert(await evaluate("state.notes['Bench Press'] === 'test note'"), "Legacy note was lost");

  await client.call("ServiceWorker.enable");
  const registrationAttempt = await evaluate(`navigator.serviceWorker.register('/sw.js').then(registration => ({ ok:true, scope:registration.scope })).catch(error => ({ ok:false, message:String(error), secure:isSecureContext }))`);
  assert(registrationAttempt.ok, `Service worker registration failed: ${JSON.stringify(registrationAttempt)}`);
  const serviceWorkerState = await evaluate(`Promise.race([
    navigator.serviceWorker.ready.then(registration => ({ ready:true, active:registration.active?.state || null })),
    new Promise(resolve => setTimeout(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      resolve({ ready:false, registrations:registrations.map(registration => ({ installing:registration.installing?.state || null, waiting:registration.waiting?.state || null, active:registration.active?.state || null })) });
    }, 5000))
  ])`);
  if (!serviceWorkerState.ready) {
    const serviceWorkerEvents = client.events.filter((event) => event.method.startsWith("ServiceWorker."));
    throw new Error(`Service worker did not activate: ${JSON.stringify(serviceWorkerState)} ${JSON.stringify(serviceWorkerEvents)}`);
  }
  await client.call("Page.navigate", { url: `${BASE_URL}/` });
  await delay(700);
  const offlinePrerequisites = await evaluate(`Promise.all([
    Promise.resolve(Boolean(navigator.serviceWorker.controller)),
    caches.open('vektr-v12-release-candidate').then(cache => Promise.all([
      cache.match('/index.html').then(Boolean),
      cache.match('/js/exercises.js').then(Boolean),
      cache.match('/js/progress.js').then(Boolean)
    ]))
  ]).then(([controlled, cached]) => ({ controlled, cached }))`);
  assert(offlinePrerequisites.controlled, `Service worker did not control the reloaded page: ${JSON.stringify(offlinePrerequisites)}`);
  assert(offlinePrerequisites.cached.every(Boolean), `Offline shell was not fully cached: ${JSON.stringify(offlinePrerequisites)}`);
  await client.call("Network.enable");
  await client.call("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await client.call("Page.navigate", { url: `${BASE_URL}/` });
  await delay(700);
  const offlinePage = await evaluate(`({
    text: document.body?.innerText || '',
    url: location.href,
    controlled: Boolean(navigator.serviceWorker?.controller),
    readyState: document.readyState
  })`);
  assert(offlinePage.text.includes("Push A"), `Offline navigation did not restore the Today screen: ${JSON.stringify(offlinePage)}`);
  assert(await evaluate("typeof VEKTR_EXERCISES === 'object' && typeof VEKTR_PROGRESS === 'object' && typeof VEKTR_PLATES === 'object'"), "Offline modules did not load from cache");
  await client.call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  const screenshot = await client.call("Page.captureScreenshot", { format: "png", fromSurface: true });
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(path.join(RESULTS_DIR, "browser-smoke-mobile.png"), Buffer.from(screenshot.data, "base64")),
  );

  const runtimeErrors = client.events.filter(
    (event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params.entry.level === "error"),
  );
  assert(runtimeErrors.length === 0, `Browser errors: ${JSON.stringify(runtimeErrors)}`);

  console.log(`browser smoke passed (${workoutNames.length} workouts, 412px viewport, legacy migration)`);
} finally {
  client?.close();
  chrome.kill();
  if (/Uncaught|ReferenceError|SyntaxError|TypeError/.test(browserLog)) {
    console.error(browserLog);
    process.exitCode = 1;
  }
}
