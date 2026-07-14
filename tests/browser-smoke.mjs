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
    `--user-data-dir=${path.join(RESULTS_DIR, "chrome-profile")}`,
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
