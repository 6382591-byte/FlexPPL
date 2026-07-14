import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9333);
const RESULTS_DIR = path.resolve("test-results");

await mkdir(RESULTS_DIR, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=old",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-software-rasterizer",
    "--disable-features=Vulkan,UseSkiaRenderer",
    "--in-process-gpu",
    "--no-sandbox",
    "--no-first-run",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${path.join(RESULTS_DIR, `chrome-profile-${process.pid}`)}`,
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
