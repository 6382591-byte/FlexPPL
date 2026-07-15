(function attachStateModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_STATE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createStateModule() {
  "use strict";

  const STORAGE_KEY = "flexppl";
  const CURRENT_STATE_VERSION = 3;
  const DEFAULT_GYMS = ["Home", "Travel"];
  const DEFAULT_STATE = Object.freeze({
    stateVersion: CURRENT_STATE_VERSION,
    rotationIndex: 0,
    active: null,
    history: [],
    bodyweight: [],
    gym: "Home",
    customGyms: DEFAULT_GYMS,
    activeProgramId: "ppl6",
    notes: {},
    lastWeights: {},
    gymWeights: {},
    skippedCore: 0,
    replacementPrefs: {},
    customExercises: [],
    machineSettings: {},
  });

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cloneDefault() {
    return deepClone(DEFAULT_STATE);
  }

  function createId() {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function todayISO(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isTrue(value) {
    return value === true || value === 1 || value === "true";
  }

  function finiteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function plainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function normalizeSets(rawSets, requestedCount) {
    const source = Array.isArray(rawSets) ? rawSets.slice() : [];
    const rawCount = Math.trunc(finiteNumber(requestedCount, Math.max(3, source.length)));
    const count = Math.min(6, Math.max(1, rawCount));
    while (source.length < count) source.push(null);
    source.length = count;
    return source.map((value) =>
      value === "" || value === undefined || value === null
        ? null
        : finiteNumber(value, null),
    );
  }

  const LEGACY_EXERCISE_IDS = {
    "hack squat / leg press": "hack-squat",
    "hack squat leg press": "hack-squat",
    "hack squat or leg press": "hack-squat",
    "one-arm db row": "one-arm-db-row",
    "one-arm dumbbell row": "one-arm-db-row",
    "rear-delt fly": "rear-delt-db-fly",
    "rear delt fly": "rear-delt-db-fly",
    "ez bar curl": "ez-bar-curl",
    "ez-bar curl": "ez-bar-curl",
    "bar curl": "barbell-curl",
    "pull-up / assisted pull-up": "assisted-pull-up",
    "db rdl": "db-rdl",
    "straight-leg dumbbell deadlift": "db-rdl",
    "straight leg dumbbell deadlift": "db-rdl",
    "dumbbell straight-leg deadlift": "db-rdl",
    "dumbbell stiff-leg deadlift": "db-stiff-leg-deadlift",
    "db stiff-leg deadlift": "db-stiff-leg-deadlift",
    "db sldl": "db-stiff-leg-deadlift",
  };

  function resolveLegacyExerciseId(item = {}) {
    if (item.exerciseId || item.canonicalExerciseId) return item.exerciseId || item.canonicalExerciseId;
    const key = String(item.originalExerciseName || item.originalName || item.name || "").trim().toLowerCase();
    return LEGACY_EXERCISE_IDS[key] || null;
  }

  function normalizeItem(item = {}, index = 0, options = {}) {
    const idFactory = options.idFactory || createId;
    const requestedSets = finiteNumber(item.workingSets, Math.max(3, item.sets?.length || 0));
    const sets = normalizeSets(item.sets, requestedSets);
    return {
      ...item,
      id: item.id || idFactory(),
      exerciseId: resolveLegacyExerciseId(item),
      name: item.name || "Exercise",
      displayNameAtTimeOfWorkout: item.displayNameAtTimeOfWorkout || item.name || "Exercise",
      originalExerciseId: item.originalExerciseId || resolveLegacyExerciseId(item),
      originalExerciseName: item.originalExerciseName || item.originalName || item.name || "Exercise",
      weight: finiteNumber(item.weight),
      target: finiteNumber(item.target),
      inc: finiteNumber(item.inc),
      workingSets: sets.length,
      swaps: Array.isArray(item.swaps) ? item.swaps.slice() : [],
      sets,
      done: isTrue(item.done),
      skipped: isTrue(item.skipped),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    };
  }

  function normalizeWorkout(workout = {}, fallbackName, options = {}) {
    const idFactory = options.idFactory || createId;
    const now = finiteNumber(options.now, Date.now());
    const fallbackGym = options.fallbackGym || DEFAULT_STATE.gym;
    return {
      ...workout,
      id: workout.id || idFactory(),
      programId: workout.programId || "ppl6",
      workoutTemplateId: workout.workoutTemplateId || null,
      name: workout.name || fallbackName || "Workout",
      date: workout.date || options.today || todayISO(),
      startedAt: finiteNumber(workout.startedAt, now),
      gym: workout.gym || fallbackGym,
      busy: String(workout.busy || "2"),
      items: (Array.isArray(workout.items) ? workout.items : []).map((item, index) =>
        normalizeItem(item, index, { idFactory }),
      ),
      core: Array.isArray(workout.core) ? workout.core.map((item) => ({ ...item })) : workout.core || null,
    };
  }

  function migrateState(raw = {}) {
    const source = plainObject(raw);
    const sourceVersion = finiteNumber(source.stateVersion, 0);
    let migrated = { ...source };

    if (sourceVersion < 1) {
      migrated = { ...migrated, replacementPrefs: plainObject(migrated.replacementPrefs) };
    }
    if (sourceVersion < 2) migrated = { ...migrated, stateVersion: 2 };
    if (sourceVersion < 3) {
      const mapGym = (gym) => /travel|hotel/i.test(String(gym || "")) ? "Travel" : "Home";
      migrated = {
        ...migrated,
        gym: mapGym(migrated.gym),
        customGyms: DEFAULT_GYMS.slice(),
        activeProgramId: migrated.activeProgramId || "ppl6",
        active: migrated.active ? { ...migrated.active, gym: mapGym(migrated.active.gym || migrated.gym) } : null,
        history: Array.isArray(migrated.history) ? migrated.history.map((workout) => ({ ...workout, gym: mapGym(workout.gym) })) : [],
        stateVersion: 3,
      };
    }

    return { ...migrated, stateVersion: CURRENT_STATE_VERSION };
  }

  function normalizeState(raw = {}, options = {}) {
    const migrated = migrateState(raw);
    const defaults = cloneDefault();
    const merged = { ...defaults, ...migrated };
    const rotation = Array.isArray(options.rotation) && options.rotation.length
      ? options.rotation
      : ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"];
    const rotationIndex = Math.max(0, finiteNumber(merged.rotationIndex));
    const fallbackName = rotation[rotationIndex % rotation.length] || rotation[0];
    const idFactory = options.idFactory || createId;
    const sharedOptions = {
      idFactory,
      now: options.now,
      today: options.today,
      fallbackGym: merged.gym || defaults.gym,
    };

    return {
      ...merged,
      stateVersion: CURRENT_STATE_VERSION,
      rotationIndex,
      customGyms:
        Array.isArray(merged.customGyms) && merged.customGyms.length
          ? [...new Set(merged.customGyms.filter(Boolean))]
          : defaults.customGyms.slice(),
      history: Array.isArray(merged.history)
        ? merged.history.map((workout) => normalizeWorkout(workout, fallbackName, sharedOptions))
        : [],
      bodyweight: Array.isArray(merged.bodyweight)
        ? merged.bodyweight
            .filter((entry) => entry && Number.isFinite(Number(entry.value)))
            .map((entry) => ({ ...entry, value: Number(entry.value) }))
        : [],
      notes: plainObject(merged.notes),
      lastWeights: plainObject(merged.lastWeights),
      gymWeights: plainObject(merged.gymWeights),
      replacementPrefs: plainObject(merged.replacementPrefs),
      machineSettings: plainObject(merged.machineSettings),
      customExercises: Array.isArray(merged.customExercises) ? merged.customExercises.filter((exercise) => exercise && exercise.id && exercise.displayName) : [],
      active: merged.active ? normalizeWorkout(merged.active, fallbackName, sharedOptions) : null,
    };
  }

  function loadState(storage, options = {}) {
    const stored = storage.getItem(STORAGE_KEY);
    try {
      const raw = JSON.parse(stored || "{}");
      return normalizeState(raw, options);
    } catch (_error) {
      if (stored) {
        try {
          storage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, stored);
        } catch (_preserveError) {
          // If preservation storage also fails, still return a safe recovery state.
        }
      }
      return { ...cloneDefault(), storageRecovery: { corrupted: true, message: "Stored VEKTR data could not be parsed. Export or import a backup before resetting." } };
    }
  }

  function saveState(storage, state) {
    const normalized = { ...state, stateVersion: CURRENT_STATE_VERSION };
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  return {
    STORAGE_KEY,
    CURRENT_STATE_VERSION,
    DEFAULT_STATE,
    cloneDefault,
    createId,
    todayISO,
    normalizeItem,
    normalizeWorkout,
    migrateState,
    normalizeState,
    loadState,
    saveState,
  };
});
