(function attachProgramModule(root, factory) {
  const exercises = root?.VEKTR_EXERCISES || (typeof require === "function" ? require("./exercises.js") : null);
  const api = factory(exercises);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_PROGRAMS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgramModule(exercises) {
  "use strict";

  if (!exercises) throw new Error("VEKTR exercise library must load before programs");

  const entry = (exerciseId, legacyName, startWeight, targetReps, increment, substitutions, workingSets = 3) => ({
    exerciseId,
    legacyName,
    startWeight,
    targetReps,
    workingSets,
    increment,
    substitutionIds: substitutions,
  });

  const WORKOUT_TEMPLATES = {
    pushA: {
      id: "pushA",
      name: "Push A",
      exercises: [
        entry("bench-press", "Bench Press", 175, 6, 5, ["db-bench-press", "smith-bench-press", "machine-chest-press", "push-up"]),
        entry("incline-db-press", "Incline DB Press", 65, 12, 5, ["incline-smith-press", "incline-machine-press", "low-to-high-cable-press"]),
        entry("machine-shoulder-press", "Machine Shoulder Press", 90, 10, 5, ["db-shoulder-press", "smith-shoulder-press", "landmine-press"]),
        entry("cable-fly-high-to-low", "Cable Fly (High to Low)", 60, 12, 5, ["pec-deck", "db-fly", "band-fly"]),
        entry("cable-lateral-raise", "Cable Lateral Raise", 30, 15, 5, ["db-lateral-raise", "machine-lateral-raise"]),
        entry("bar-pushdown", "Bar Triceps Pushdown", 110, 12, 10, ["rope-pushdown", "single-arm-pushdown"]),
        entry("skull-crusher", "Skull Crushers", 60, 10, 5, ["overhead-rope-extension", "db-overhead-extension"]),
      ],
    },
    pullA: {
      id: "pullA",
      name: "Pull A",
      exercises: [
        entry("lat-pulldown", "Lat Pulldown", 110, 12, 10, ["assisted-pull-up", "pull-up", "single-arm-pulldown"]),
        entry("chest-supported-db-row", "Chest-Supported Row", 100, 10, 10, ["seated-cable-row", "machine-row", "one-arm-db-row"]),
        entry("face-pull", "Face Pull", 100, 15, 10, ["rear-delt-db-fly", "chest-supported-rear-delt-raise", "reverse-pec-deck"]),
        entry("cable-curl", "Cable Curl", 40, 12, 5, ["db-curl", "ez-bar-curl", "barbell-curl"]),
        entry("rope-hammer-curl", "Rope Hammer Curl", 90, 12, 10, ["hammer-curl", "cross-body-hammer-curl", "reverse-barbell-curl"]),
        entry("rear-delt-db-fly", "Rear-Delt Fly", 50, 15, 5, ["reverse-pec-deck", "face-pull", "chest-supported-rear-delt-raise"]),
      ],
    },
    legsA: {
      id: "legsA",
      name: "Legs A",
      exercises: [
        entry("hack-squat", "Hack Squat / Leg Press", 180, 8, 10, ["leg-press", "smith-squat", "goblet-squat", "belt-squat"]),
        entry("bulgarian-split-squat", "Bulgarian Split Squat", 25, 10, 5, ["walking-lunge", "step-up", "reverse-lunge"]),
        entry("leg-extension", "Leg Extension", 100, 12, 10, ["sissy-squat", "spanish-squat"]),
        entry("seated-hamstring-curl", "Seated Hamstring Curl", 70, 10, 10, ["lying-hamstring-curl", "standing-hamstring-curl"]),
        entry("standing-calf-raise", "Standing Calf Raise", 90, 15, 10, ["leg-press-calf-raise", "smith-calf-raise", "single-leg-calf-raise", "seated-calf-raise"]),
      ],
    },
    pushB: {
      id: "pushB",
      name: "Push B",
      exercises: [
        entry("incline-bench-press", "Incline Bench Press", 145, 10, 5, ["incline-db-press", "incline-smith-press", "incline-machine-press"]),
        entry("db-bench-press", "Flat DB Press", 70, 10, 5, ["bench-press", "smith-bench-press", "machine-chest-press"]),
        entry("cable-fly-low-to-high", "Cable Fly (Low to High)", 50, 15, 5, ["incline-pec-deck", "low-incline-db-fly"]),
        entry("db-lateral-raise", "DB / Cable Lateral Raise", 30, 15, 5, ["cable-lateral-raise", "machine-lateral-raise"]),
        entry("overhead-rope-extension", "Overhead Rope Extension", 80, 12, 10, ["skull-crusher", "db-overhead-extension"]),
        entry("rope-pushdown", "Rope Pushdown", 110, 12, 10, ["bar-pushdown", "single-arm-pushdown"]),
      ],
    },
    pullB: {
      id: "pullB",
      name: "Pull B",
      exercises: [
        entry("assisted-pull-up", "Pull-Up / Assisted Pull-Up", 0, 8, 0, ["pull-up", "lat-pulldown", "neutral-grip-pulldown"]),
        entry("seated-cable-row", "Seated Cable Row", 130, 10, 10, ["chest-supported-db-row", "machine-row", "barbell-row"]),
        entry("straight-arm-pulldown", "Straight-Arm Pulldown", 70, 15, 10, ["cable-pullover", "db-pullover", "barbell-pullover"]),
        entry("preacher-curl", "Preacher Curl", 55, 10, 5, ["machine-curl", "ez-bar-curl", "barbell-curl"]),
        entry("incline-db-curl", "Incline DB Curl", 30, 12, 5, ["bayesian-cable-curl", "alternating-db-curl"]),
        entry("face-pull", "Face Pull", 100, 15, 10, ["rear-delt-db-fly", "reverse-pec-deck"]),
      ],
    },
    legsB: {
      id: "legsB",
      name: "Legs B",
      exercises: [
        entry("smith-squat", "Smith Squat", 135, 10, 10, ["hack-squat", "leg-press", "goblet-squat", "back-squat"]),
        entry("walking-lunge", "Walking Lunge", 25, 12, 5, ["reverse-lunge", "step-up", "bulgarian-split-squat"]),
        entry("leg-extension", "Leg Extension", 90, 15, 10, ["spanish-squat", "sissy-squat"]),
        entry("lying-hamstring-curl", "Lying Hamstring Curl", 70, 12, 10, ["seated-hamstring-curl", "standing-hamstring-curl"]),
        entry("seated-calf-raise", "Seated Calf Raise", 90, 20, 10, ["plate-loaded-seated-calf-raise", "seated-db-calf-raise", "standing-calf-raise"]),
      ],
    },
  };

  const PROGRAMS = {
    ppl6: {
      id: "ppl6",
      name: "Push / Pull / Legs",
      description: "Six-workout rotating PPL",
      scheduleType: "rotation",
      workoutTemplateIds: ["pushA", "pullA", "legsA", "pushB", "pullB", "legsB"],
      productionReady: true,
    },
  };

  const ACTIVE_PROGRAM_ID = "ppl6";
  const ACTIVE_PROGRAM = PROGRAMS[ACTIVE_PROGRAM_ID];
  const ROTATION = ACTIVE_PROGRAM.workoutTemplateIds.map((id) => WORKOUT_TEMPLATES[id].name);
  const LEGACY_PROGRAM = Object.fromEntries(
    ACTIVE_PROGRAM.workoutTemplateIds.map((templateId) => {
      const template = WORKOUT_TEMPLATES[templateId];
      const rows = template.exercises.map((item) => {
        const substitutions = item.substitutionIds.map((id) => exercises.EXERCISE_BY_ID[id]?.displayName).filter(Boolean);
        return [item.legacyName, item.startWeight, item.targetReps, item.increment, substitutions];
      });
      return [template.name, rows];
    }),
  );

  function findTemplateByName(name) {
    return Object.values(WORKOUT_TEMPLATES).find((template) => template.name === name) || null;
  }

  return {
    ACTIVE_PROGRAM_ID,
    ACTIVE_PROGRAM,
    PROGRAMS,
    WORKOUT_TEMPLATES,
    ROTATION,
    LEGACY_PROGRAM,
    findTemplateByName,
  };
});
