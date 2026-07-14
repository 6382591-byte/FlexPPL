const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CURRENT_STATE_VERSION,
  STORAGE_KEY,
  normalizeState,
  loadState,
  saveState,
} = require("../js/state.js");

function ids() {
  let index = 0;
  return () => `test-${++index}`;
}

function storageWith(value) {
  const entries = new Map();
  if (value !== undefined) entries.set(STORAGE_KEY, value);
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, next) => entries.set(key, next),
    value: () => entries.get(STORAGE_KEY),
  };
}

test("migrates legacy state without losing user data", () => {
  const legacy = {
    rotationIndex: 3,
    gym: "Travel Gym",
    notes: { "Bench Press": "Pinky on ring" },
    replacementPrefs: { "lat-pulldown": { "barbell-row": 2 } },
    bodyweight: [{ date: "2026-07-10", value: "181.4" }],
    history: [
      {
        name: "Push A",
        date: "2026-07-09",
        gym: "Crunch Gym",
        customField: "keep me",
        items: [
          {
            name: "Bench Press",
            weight: "175",
            target: "6",
            sets: [6, 6, 5],
            done: "true",
            legacyField: "keep me too",
          },
        ],
      },
    ],
  };

  const migrated = normalizeState(legacy, {
    idFactory: ids(),
    now: 1_720_000_000_000,
    today: "2026-07-13",
  });

  assert.equal(migrated.stateVersion, CURRENT_STATE_VERSION);
  assert.equal(migrated.gym, "Travel");
  assert.equal(migrated.notes["Bench Press"], "Pinky on ring");
  assert.equal(migrated.replacementPrefs["lat-pulldown"]["barbell-row"], 2);
  assert.equal(migrated.bodyweight[0].value, 181.4);
  assert.equal(migrated.history[0].customField, "keep me");
  assert.equal(migrated.history[0].items[0].legacyField, "keep me too");
  assert.deepEqual(migrated.history[0].items[0].sets, [6, 6, 5]);
  assert.equal(migrated.history[0].items[0].displayNameAtTimeOfWorkout, "Bench Press");
});

test("preserves more than three sets for the future variable-set model", () => {
  const migrated = normalizeState(
    {
      active: {
        name: "Pull A",
        items: [{ name: "Pull-Up", workingSets: 4, sets: [8, 7, 6, 5] }],
      },
    },
    { idFactory: ids(), now: 1000, today: "2026-07-13" },
  );

  assert.equal(migrated.active.items[0].workingSets, 4);
  assert.deepEqual(migrated.active.items[0].sets, [8, 7, 6, 5]);
});

test("normalizes malformed collections instead of crashing", () => {
  const migrated = normalizeState(
    { history: "bad", notes: [], gymWeights: null, bodyweight: [{ value: "bad" }] },
    { idFactory: ids() },
  );

  assert.deepEqual(migrated.history, []);
  assert.deepEqual(migrated.notes, {});
  assert.deepEqual(migrated.gymWeights, {});
  assert.deepEqual(migrated.bodyweight, []);
});

test("load recovers from invalid JSON", () => {
  const loaded = loadState(storageWith("{not-json"), { idFactory: ids() });
  assert.equal(loaded.stateVersion, CURRENT_STATE_VERSION);
  assert.deepEqual(loaded.history, []);
  assert.equal(loaded.active, null);
});

test("save keeps the legacy storage key and stamps the schema version", () => {
  const storage = storageWith();
  saveState(storage, { history: [{ name: "Push A" }] });
  const stored = JSON.parse(storage.value());
  assert.equal(stored.stateVersion, CURRENT_STATE_VERSION);
  assert.equal(stored.history[0].name, "Push A");
});

test("migrates legacy gym profiles to zero-setup Home and Travel modes", () => {
  const migrated = normalizeState({ gym: "Crunch Gym", customGyms: ["Crunch Gym", "Hotel Gym", "Gold's"], history: [{ name: "Push A", gym: "Hotel Gym", items: [] }] }, { today: "2026-07-12" });
  assert.equal(migrated.gym, "Home");
  assert.deepEqual(migrated.customGyms, ["Home", "Travel"]);
  assert.equal(migrated.history[0].gym, "Travel");
  assert.equal(migrated.activeProgramId, "ppl6");
});
