(function attachStateModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_STATE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createStateModule() {
  "use strict";

  const STORAGE_KEY = "flexppl";
  const CURRENT_STATE_VERSION = 2;
  const DEFAULT_GYMS = ["Crunch Gym", "Travel Gym", "Hotel Gym"];
  const DEFAULT_STATE = Object.freeze({
    stateVersion: CURRENT_STATE_VERSION,
    rotationIndex: 0,
    active: null,
    history: [],
    bodyweight: [],
    gym: "Crunch Gym",
    customGyms: DEFAULT_GYMS,
    notes: {},
    lastWeights: {},
    gymWeights: {},
    skippedCore: 0,
    replacementPrefs: {},
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

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
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
    const count = Math.max(1, finiteNumber(requestedCount, Math.max(3, source.length)));
    while (source.length < count) source.push(null);
    return source.map((value) =>
      value === "" || value === undefined || value === null
        ? null
        : finiteNumber(value, null),
    );
  }

  function normalizeItem(item = {}, index = 0, options = {}) {
    const idFactory = options.idFactory || createId;
    const requestedSets = finiteNumber(item.workingSets, Math.max(3, item.sets?.length || 0));
    const sets = normalizeSets(item.sets, requestedSets);
    return {
      ...item,
      id: item.id || idFactory(),
      exerciseId: item.exerciseId || item.canonicalExerciseId || null,
      name: item.name || "Exercise",
      displayNameAtTimeOfWorkout: item.displayNameAtTimeOfWorkout || item.name || "Exercise",
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
      active: merged.active ? normalizeWorkout(merged.active, fallbackName, sharedOptions) : null,
    };
  }

  function loadState(storage, options = {}) {
    try {
      const raw = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      return normalizeState(raw, options);
    } catch (_error) {
      return cloneDefault();
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
