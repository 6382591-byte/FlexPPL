(function attachExerciseModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_EXERCISES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createExerciseModule() {
  "use strict";

  const MOVEMENT_FAMILIES = [
    "horizontal press",
    "incline press",
    "chest fly",
    "vertical press",
    "lateral raise",
    "rear-delt raise",
    "vertical pull",
    "horizontal pull",
    "straight-arm shoulder extension",
    "upper-back/rear-delt pull",
    "supinated curl",
    "neutral-grip curl",
    "reverse curl",
    "triceps pushdown",
    "overhead triceps extension",
    "squat",
    "unilateral squat/lunge",
    "knee extension",
    "hip hinge",
    "knee flexion",
    "standing calf raise",
    "seated calf raise",
    "shrug",
    "loaded carry",
    "trunk flexion",
    "anti-extension",
    "anti-rotation",
    "lateral core",
  ];

  const CATEGORY_BY_PRIMARY = {
    Chest: "Chest",
    Lats: "Back",
    "Upper back": "Back",
    Shoulders: "Shoulders",
    "Side delts": "Shoulders",
    "Rear delts": "Shoulders",
    Biceps: "Biceps",
    Forearms: "Biceps",
    Triceps: "Triceps",
    Quads: "Quads",
    Hamstrings: "Hamstrings / Glutes",
    Glutes: "Hamstrings / Glutes",
    Calves: "Calves",
    Core: "Core",
    Traps: "Other",
  };

  const records = [];
  function add(id, displayName, config) {
    records.push({
      id,
      displayName,
      name: displayName,
      aliases: [],
      progressCategory: CATEGORY_BY_PRIMARY[config.primary] || "Other",
      primaryMuscleGroup: config.primary,
      primaryMuscle: config.primary,
      secondaryMuscleGroups: config.secondary || [],
      secondaryMuscles: config.secondary || [],
      movementFamily: config.family,
      movementPattern: config.family,
      movementVariant: config.variant || config.family,
      equipment: config.equipment,
      equipmentType: config.equipment,
      exerciseType: config.type || "isolation",
      type: config.type || "isolation",
      gymModes: config.gymModes || "Both",
      supportsPlateCalculator: Boolean(config.supportsPlateCalculator),
      imageAsset: config.image ? `assets/exercises/${config.image}.svg` : null,
      aliases: config.aliases || [],
      closestMatchIds: [],
      goodAlternativeIds: [],
      fallbackIds: [],
      validReplacementIds: [],
      lessExactReplacementIds: [],
    });
  }

  // Chest
  add("bench-press", "Bench Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "horizontal press", variant: "barbell flat", equipment: "Barbell", type: "compound", supportsPlateCalculator: true, aliases: ["Barbell Bench Press"], image: "bench-press" });
  add("db-bench-press", "Dumbbell Bench Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "horizontal press", variant: "dumbbell flat", equipment: "Dumbbell", type: "compound", aliases: ["DB Bench Press", "Flat DB Press"], image: "db-bench-press" });
  add("smith-bench-press", "Smith Bench Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "horizontal press", variant: "smith flat", equipment: "Smith machine", type: "compound", gymModes: "Home", aliases: ["Smith Bench"], image: "smith-bench-press" });
  add("machine-chest-press", "Machine Chest Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "horizontal press", variant: "selectorized flat", equipment: "Machine", type: "compound", gymModes: "Home", image: "machine-chest-press" });
  add("push-up", "Push-Up", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "horizontal press", variant: "bodyweight flat", equipment: "Bodyweight", type: "compound", aliases: ["Push-Ups", "Push Up", "Pushups"], image: "push-ups" });
  add("incline-bench-press", "Incline Bench Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "incline press", variant: "barbell incline", equipment: "Barbell", type: "compound", supportsPlateCalculator: true, image: "incline-bench-press" });
  add("incline-db-press", "Incline Dumbbell Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "incline press", variant: "dumbbell incline", equipment: "Dumbbell", type: "compound", aliases: ["Incline DB Press"], image: "incline-db-press" });
  add("incline-smith-press", "Incline Smith Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "incline press", variant: "smith incline", equipment: "Smith machine", type: "compound", gymModes: "Home", image: "incline-smith-press" });
  add("incline-machine-press", "Incline Machine Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "incline press", variant: "machine incline", equipment: "Machine", type: "compound", gymModes: "Home", aliases: ["Machine Incline Press"], image: "incline-machine-press" });
  add("low-to-high-cable-press", "Low-to-High Cable Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"], family: "incline press", variant: "cable incline", equipment: "Cable", type: "compound", gymModes: "Home", image: "low-to-high-cable-press" });
  add("cable-fly-high-to-low", "Cable Fly (High to Low)", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "high-to-low cable", equipment: "Cable", gymModes: "Home", aliases: ["Cable Fly High to Low"], image: "cable-fly-high-to-low" });
  add("cable-fly-low-to-high", "Cable Fly (Low to High)", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "low-to-high cable", equipment: "Cable", gymModes: "Home", aliases: ["Cable Fly Low to High"], image: "cable-fly-low-to-high" });
  add("pec-deck", "Pec Deck", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "selectorized", equipment: "Machine", gymModes: "Home", image: "pec-deck" });
  add("incline-pec-deck", "Incline Pec Deck", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "incline machine", equipment: "Machine", gymModes: "Home", image: "incline-pec-deck" });
  add("db-fly", "Dumbbell Fly", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "flat dumbbell", equipment: "Dumbbell", aliases: ["DB Fly"], image: "db-fly" });
  add("low-incline-db-fly", "Low-Incline Dumbbell Fly", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "incline dumbbell", equipment: "Dumbbell", aliases: ["Low Incline DB Fly"], image: "low-incline-db-fly" });
  add("band-fly", "Band Fly", { primary: "Chest", secondary: ["Shoulders"], family: "chest fly", variant: "band", equipment: "Resistance band", gymModes: "Home", image: "band-fly" });

  // Shoulders and triceps
  add("machine-shoulder-press", "Machine Shoulder Press", { primary: "Shoulders", secondary: ["Triceps"], family: "vertical press", variant: "selectorized", equipment: "Machine", type: "compound", gymModes: "Home", image: "machine-shoulder-press" });
  add("db-shoulder-press", "Dumbbell Shoulder Press", { primary: "Shoulders", secondary: ["Triceps"], family: "vertical press", variant: "dumbbell", equipment: "Dumbbell", type: "compound", aliases: ["DB Shoulder Press"], image: "db-shoulder-press" });
  add("smith-shoulder-press", "Smith Shoulder Press", { primary: "Shoulders", secondary: ["Triceps"], family: "vertical press", variant: "smith", equipment: "Smith machine", type: "compound", gymModes: "Home", image: "smith-shoulder-press" });
  add("landmine-press", "Landmine Press", { primary: "Shoulders", secondary: ["Triceps", "Chest"], family: "vertical press", variant: "landmine", equipment: "Barbell", type: "compound", image: "landmine-press" });
  add("cable-lateral-raise", "Cable Lateral Raise", { primary: "Side delts", secondary: ["Shoulders"], family: "lateral raise", variant: "cable", equipment: "Cable", gymModes: "Home", image: "cable-lateral-raise" });
  add("db-lateral-raise", "Dumbbell Lateral Raise", { primary: "Side delts", secondary: ["Shoulders"], family: "lateral raise", variant: "dumbbell", equipment: "Dumbbell", aliases: ["DB Lateral Raise", "DB / Cable Lateral Raise"], image: "db-lateral-raise" });
  add("machine-lateral-raise", "Machine Lateral Raise", { primary: "Side delts", secondary: ["Shoulders"], family: "lateral raise", variant: "selectorized", equipment: "Machine", gymModes: "Home", image: "machine-lateral-raise" });
  add("bar-pushdown", "Bar Triceps Pushdown", { primary: "Triceps", family: "triceps pushdown", variant: "straight bar cable", equipment: "Cable", gymModes: "Home", aliases: ["Bar Pushdown"], image: "bar-triceps-pushdown" });
  add("rope-pushdown", "Rope Pushdown", { primary: "Triceps", family: "triceps pushdown", variant: "rope cable", equipment: "Cable", gymModes: "Home", image: "rope-pushdown" });
  add("single-arm-pushdown", "Single-Arm Pushdown", { primary: "Triceps", family: "triceps pushdown", variant: "single-arm cable", equipment: "Cable", gymModes: "Home", image: "single-arm-pushdown" });
  add("skull-crusher", "Skull Crusher", { primary: "Triceps", family: "overhead triceps extension", variant: "barbell lying", equipment: "Barbell", supportsPlateCalculator: true, aliases: ["Skull Crushers"], image: "skull-crushers" });
  add("overhead-rope-extension", "Overhead Rope Extension", { primary: "Triceps", family: "overhead triceps extension", variant: "rope cable overhead", equipment: "Cable", gymModes: "Home", image: "overhead-rope-extension" });
  add("db-overhead-extension", "Dumbbell Overhead Extension", { primary: "Triceps", family: "overhead triceps extension", variant: "dumbbell overhead", equipment: "Dumbbell", aliases: ["DB Overhead Extension"], image: "db-overhead-extension" });

  // Back and rear delts
  add("lat-pulldown", "Lat Pulldown", { primary: "Lats", secondary: ["Biceps", "Upper back"], family: "vertical pull", variant: "wide cable", equipment: "Cable", type: "compound", gymModes: "Home", image: "lat-pulldown" });
  add("neutral-grip-pulldown", "Neutral-Grip Pulldown", { primary: "Lats", secondary: ["Biceps"], family: "vertical pull", variant: "neutral cable", equipment: "Cable", type: "compound", gymModes: "Home", image: "neutral-grip-pulldown" });
  add("single-arm-pulldown", "Single-Arm Pulldown", { primary: "Lats", secondary: ["Biceps"], family: "vertical pull", variant: "single-arm cable", equipment: "Cable", gymModes: "Home", image: "single-arm-pulldown" });
  add("pull-up", "Pull-Up", { primary: "Lats", secondary: ["Biceps", "Upper back"], family: "vertical pull", variant: "bodyweight", equipment: "Bodyweight", type: "compound", gymModes: "Home", aliases: ["Pull Up"], image: "pull-up" });
  add("assisted-pull-up", "Assisted Pull-Up", { primary: "Lats", secondary: ["Biceps", "Upper back"], family: "vertical pull", variant: "assisted machine", equipment: "Machine", type: "compound", gymModes: "Home", aliases: ["Pull-Up / Assisted Pull-Up"], image: "assisted-pull-up" });
  add("barbell-pullover", "Barbell Pullover", { primary: "Lats", secondary: ["Chest"], family: "straight-arm shoulder extension", variant: "barbell", equipment: "Barbell", supportsPlateCalculator: true });
  add("db-pullover", "Dumbbell Pullover", { primary: "Lats", secondary: ["Chest"], family: "straight-arm shoulder extension", variant: "dumbbell", equipment: "Dumbbell", aliases: ["DB Pullover"], image: "db-pullover" });
  add("cable-pullover", "Cable Pullover", { primary: "Lats", secondary: ["Chest"], family: "straight-arm shoulder extension", variant: "cable", equipment: "Cable", gymModes: "Home", image: "cable-pullover" });
  add("straight-arm-pulldown", "Straight-Arm Pulldown", { primary: "Lats", family: "straight-arm shoulder extension", variant: "cable", equipment: "Cable", gymModes: "Home", image: "straight-arm-pulldown" });
  add("inverted-row", "Inverted Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "bodyweight under bar", equipment: "Bodyweight", type: "compound" });
  add("chest-supported-db-row", "Chest-Supported Dumbbell Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "chest-supported dumbbell", equipment: "Dumbbell", type: "compound", aliases: ["Chest-Supported Row", "Chest Supported Row"], image: "chest-supported-row" });
  add("chest-supported-barbell-row", "Chest-Supported Barbell Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "chest-supported barbell", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });
  add("seated-cable-row", "Seated Cable Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "seated cable", equipment: "Cable", type: "compound", gymModes: "Home", image: "seated-cable-row" });
  add("machine-row", "Machine Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "selectorized", equipment: "Machine", type: "compound", gymModes: "Home", image: "machine-row" });
  add("barbell-row", "Barbell Bent-Over Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "barbell bent-over", equipment: "Barbell", type: "compound", supportsPlateCalculator: true, aliases: ["Barbell Row"], image: "horizontal-pull" });
  add("pendlay-row", "Pendlay Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "barbell from floor", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });
  add("one-arm-barbell-row", "One-Arm Barbell Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "one-arm barbell", equipment: "Barbell", type: "compound" });
  add("meadows-row", "Meadows Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "landmine one-arm", equipment: "Barbell", type: "compound" });
  add("trap-bar-row", "Trap-Bar Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "trap bar", equipment: "Trap bar", type: "compound" });
  add("one-arm-db-row", "One-Arm Dumbbell Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "one-arm dumbbell", equipment: "Dumbbell", type: "compound", aliases: ["One-Arm DB Row", "Single-Arm Dumbbell Row", "Single Arm Row"], image: "one-arm-db-row" });
  add("seal-row", "Seal Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "barbell bench-supported", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });
  add("t-bar-row", "T-Bar Row", { primary: "Upper back", secondary: ["Lats", "Biceps"], family: "horizontal pull", variant: "landmine two-arm", equipment: "Barbell", type: "compound" });
  add("face-pull", "Face Pull", { primary: "Rear delts", secondary: ["Upper back"], family: "upper-back/rear-delt pull", variant: "rope cable", equipment: "Cable", gymModes: "Home", image: "face-pull" });
  add("rear-delt-db-fly", "Rear-Delt Dumbbell Fly", { primary: "Rear delts", secondary: ["Upper back"], family: "rear-delt raise", variant: "bent-over dumbbell", equipment: "Dumbbell", aliases: ["Rear-Delt Fly", "Rear Delt Fly", "Rear Delt Raise"], image: "rear-delt-fly" });
  add("chest-supported-rear-delt-raise", "Chest-Supported Rear-Delt Raise", { primary: "Rear delts", secondary: ["Upper back"], family: "rear-delt raise", variant: "chest-supported dumbbell", equipment: "Dumbbell" });
  add("reverse-pec-deck", "Reverse Pec Deck", { primary: "Rear delts", secondary: ["Upper back"], family: "rear-delt raise", variant: "selectorized", equipment: "Machine", gymModes: "Home", image: "reverse-pec-deck" });
  add("plate-rear-delt-raise", "Plate Rear-Delt Raise", { primary: "Rear delts", secondary: ["Upper back"], family: "rear-delt raise", variant: "plate", equipment: "Plate" });
  add("prone-y-raise", "Prone Y Raise", { primary: "Rear delts", secondary: ["Upper back"], family: "rear-delt raise", variant: "prone bodyweight", equipment: "Bodyweight" });
  add("wide-grip-barbell-row", "Wide-Grip Barbell Row", { primary: "Rear delts", secondary: ["Upper back"], family: "upper-back/rear-delt pull", variant: "wide-grip barbell", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });

  // Biceps and forearms
  add("cable-curl", "Cable Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "straight cable", equipment: "Cable", gymModes: "Home", image: "cable-curl" });
  add("bayesian-cable-curl", "Bayesian Cable Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "behind-body cable", equipment: "Cable", gymModes: "Home", aliases: ["Cable Bayesian Curl"], image: "cable-bayesian-curl" });
  add("ez-bar-curl", "EZ-Bar Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "ez bar", equipment: "EZ bar", aliases: ["EZ Bar Curl"], image: "ez-bar-curl" });
  add("barbell-curl", "Barbell Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "straight bar", equipment: "Barbell", supportsPlateCalculator: true, aliases: ["Bar Curl"] });
  add("db-curl", "Dumbbell Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "bilateral dumbbell", equipment: "Dumbbell", aliases: ["DB Curl"], image: "db-curl" });
  add("alternating-db-curl", "Alternating Dumbbell Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "alternating dumbbell", equipment: "Dumbbell", aliases: ["Alternating DB Curl"], image: "alternating-db-curl" });
  add("incline-db-curl", "Incline Dumbbell Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "incline dumbbell", equipment: "Dumbbell", aliases: ["Incline DB Curl"], image: "incline-db-curl" });
  add("machine-curl", "Machine Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "selectorized", equipment: "Machine", gymModes: "Home", image: "machine-curl" });
  add("preacher-curl", "Preacher Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "preacher bench", equipment: "EZ bar", gymModes: "Home", image: "preacher-curl" });
  add("plate-curl", "Plate Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "plate", equipment: "Plate" });
  add("kettlebell-curl", "Kettlebell Curl", { primary: "Biceps", secondary: ["Forearms"], family: "supinated curl", variant: "kettlebell", equipment: "Kettlebell" });
  add("hammer-curl", "Hammer Curl", { primary: "Biceps", secondary: ["Forearms"], family: "neutral-grip curl", variant: "dumbbell", equipment: "Dumbbell", aliases: ["DB Hammer Curl"], image: "db-hammer-curl" });
  add("cross-body-hammer-curl", "Cross-Body Hammer Curl", { primary: "Biceps", secondary: ["Forearms"], family: "neutral-grip curl", variant: "cross-body dumbbell", equipment: "Dumbbell", image: "cross-body-hammer-curl" });
  add("rope-hammer-curl", "Rope Hammer Curl", { primary: "Biceps", secondary: ["Forearms"], family: "neutral-grip curl", variant: "rope cable", equipment: "Cable", gymModes: "Home", image: "rope-hammer-curl" });
  add("reverse-barbell-curl", "Reverse Barbell Curl", { primary: "Forearms", secondary: ["Biceps"], family: "reverse curl", variant: "barbell pronated", equipment: "Barbell", supportsPlateCalculator: true });

  // Legs and glutes
  add("hack-squat", "Hack Squat", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "hack machine", equipment: "Machine", type: "compound", gymModes: "Home", image: "hack-squat" });
  add("leg-press", "Leg Press", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "sled machine", equipment: "Machine", type: "compound", gymModes: "Home", image: "leg-press" });
  add("smith-squat", "Smith Squat", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "smith", equipment: "Smith machine", type: "compound", gymModes: "Home", image: "smith-squat" });
  add("back-squat", "Barbell Back Squat", { primary: "Quads", secondary: ["Glutes", "Hamstrings"], family: "squat", variant: "barbell back", equipment: "Barbell", type: "compound", supportsPlateCalculator: true, aliases: ["Back Squat"], image: "squat" });
  add("front-squat", "Front Squat", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "barbell front", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });
  add("goblet-squat", "Goblet Squat", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "goblet", equipment: "Dumbbell", type: "compound", image: "goblet-squat" });
  add("belt-squat", "Belt Squat", { primary: "Quads", secondary: ["Glutes"], family: "squat", variant: "belt machine", equipment: "Machine", type: "compound", gymModes: "Home", image: "belt-squat" });
  add("walking-lunge", "Walking Lunge", { primary: "Quads", secondary: ["Glutes", "Hamstrings"], family: "unilateral squat/lunge", variant: "walking", equipment: "Dumbbell", type: "compound", image: "walking-lunge" });
  add("reverse-lunge", "Reverse Lunge", { primary: "Quads", secondary: ["Glutes", "Hamstrings"], family: "unilateral squat/lunge", variant: "reverse", equipment: "Dumbbell", type: "compound", image: "reverse-lunge" });
  add("step-up", "Step-Up", { primary: "Quads", secondary: ["Glutes", "Hamstrings"], family: "unilateral squat/lunge", variant: "step", equipment: "Dumbbell", type: "compound", image: "step-up" });
  add("bulgarian-split-squat", "Bulgarian Split Squat", { primary: "Quads", secondary: ["Glutes", "Hamstrings"], family: "unilateral squat/lunge", variant: "rear-foot elevated", equipment: "Dumbbell", type: "compound", image: "bulgarian-split-squat" });
  add("leg-extension", "Leg Extension", { primary: "Quads", family: "knee extension", variant: "selectorized", equipment: "Machine", gymModes: "Home", image: "leg-extension" });
  add("spanish-squat", "Spanish Squat", { primary: "Quads", family: "knee extension", variant: "band-supported", equipment: "Resistance band", image: "spanish-squat" });
  add("sissy-squat", "Sissy Squat", { primary: "Quads", family: "knee extension", variant: "bodyweight", equipment: "Bodyweight", image: "sissy-squat" });
  add("seated-hamstring-curl", "Seated Hamstring Curl", { primary: "Hamstrings", family: "knee flexion", variant: "seated machine", equipment: "Machine", gymModes: "Home", aliases: ["Seated Ham Curl"], image: "seated-hamstring-curl" });
  add("lying-hamstring-curl", "Lying Hamstring Curl", { primary: "Hamstrings", family: "knee flexion", variant: "lying machine", equipment: "Machine", gymModes: "Home", aliases: ["Lying Ham Curl"], image: "lying-hamstring-curl" });
  add("standing-hamstring-curl", "Standing Hamstring Curl", { primary: "Hamstrings", family: "knee flexion", variant: "standing machine", equipment: "Machine", gymModes: "Home", aliases: ["Standing Ham Curl"], image: "standing-ham-curl" });
  add("barbell-rdl", "Barbell Romanian Deadlift", { primary: "Hamstrings", secondary: ["Glutes"], family: "hip hinge", variant: "barbell", equipment: "Barbell", type: "compound", supportsPlateCalculator: true, aliases: ["Barbell RDL", "Romanian Deadlift"], image: "hinge" });
  add("db-rdl", "Dumbbell Romanian Deadlift", { primary: "Hamstrings", secondary: ["Glutes"], family: "hip hinge", variant: "dumbbell", equipment: "Dumbbell", type: "compound", aliases: ["DB RDL"], image: "hinge" });
  add("hip-thrust", "Hip Thrust", { primary: "Glutes", secondary: ["Hamstrings"], family: "hip hinge", variant: "barbell hip thrust", equipment: "Barbell", type: "compound", supportsPlateCalculator: true });

  // Calves
  add("standing-calf-raise", "Standing Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "machine", equipment: "Machine", gymModes: "Home", image: "standing-calf-raise" });
  add("leg-press-calf-raise", "Leg Press Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "leg press", equipment: "Machine", gymModes: "Home", image: "leg-press-calf-raise" });
  add("smith-calf-raise", "Smith Machine Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "smith", equipment: "Smith machine", gymModes: "Home" });
  add("single-leg-calf-raise", "Single-Leg Standing Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "single-leg bodyweight", equipment: "Bodyweight", image: "standing-calf-raise" });
  add("db-standing-calf-raise", "Dumbbell Standing Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "dumbbell", equipment: "Dumbbell", image: "standing-calf-raise" });
  add("barbell-standing-calf-raise", "Barbell Standing Calf Raise", { primary: "Calves", family: "standing calf raise", variant: "barbell", equipment: "Barbell", supportsPlateCalculator: true, image: "standing-calf-raise" });
  add("seated-calf-raise", "Seated Calf Raise", { primary: "Calves", family: "seated calf raise", variant: "machine", equipment: "Machine", gymModes: "Home", image: "seated-calf-raise" });
  add("plate-loaded-seated-calf-raise", "Plate-Loaded Seated Calf Raise", { primary: "Calves", family: "seated calf raise", variant: "plate-loaded machine", equipment: "Machine", gymModes: "Home", image: "seated-calf-raise" });
  add("seated-db-calf-raise", "Seated Dumbbell Calf Raise", { primary: "Calves", family: "seated calf raise", variant: "dumbbell", equipment: "Dumbbell", image: "seated-calf-raise" });
  add("seated-barbell-calf-raise", "Seated Barbell Calf Raise", { primary: "Calves", family: "seated calf raise", variant: "barbell", equipment: "Barbell", image: "seated-calf-raise" });
  add("bent-knee-calf-raise", "Bent-Knee Calf Raise", { primary: "Calves", family: "seated calf raise", variant: "bodyweight", equipment: "Bodyweight", image: "seated-calf-raise" });

  // Traps, grip, and core
  add("barbell-shrug", "Barbell Shrug", { primary: "Traps", secondary: ["Grip"], family: "shrug", variant: "barbell", equipment: "Barbell", supportsPlateCalculator: true, image: "shrug-carry" });
  add("trap-bar-shrug", "Trap-Bar Shrug", { primary: "Traps", secondary: ["Grip"], family: "shrug", variant: "trap bar", equipment: "Trap bar", image: "shrug-carry" });
  add("db-shrug", "Dumbbell Shrug", { primary: "Traps", secondary: ["Grip"], family: "shrug", variant: "dumbbell", equipment: "Dumbbell", image: "shrug-carry" });
  add("farmer-carry", "Farmer Carry", { primary: "Traps", secondary: ["Grip", "Core"], family: "loaded carry", variant: "bilateral", equipment: "Dumbbell", type: "compound", image: "shrug-carry" });
  add("suitcase-carry", "Suitcase Carry", { primary: "Core", secondary: ["Grip", "Traps"], family: "lateral core", variant: "unilateral carry", equipment: "Dumbbell", type: "compound" });
  add("cable-crunch", "Cable Crunch", { primary: "Core", family: "trunk flexion", variant: "cable kneeling", equipment: "Cable", gymModes: "Home" });
  add("reverse-crunch", "Reverse Crunch", { primary: "Core", family: "trunk flexion", variant: "bodyweight reverse", equipment: "Bodyweight" });
  add("hanging-knee-raise", "Hanging Knee Raise", { primary: "Core", family: "trunk flexion", variant: "hanging", equipment: "Bodyweight", gymModes: "Home" });
  add("dead-bug", "Dead Bug", { primary: "Core", family: "anti-extension", variant: "bodyweight", equipment: "Bodyweight", aliases: ["Dead Bug / side"] });
  add("plank", "Plank", { primary: "Core", family: "anti-extension", variant: "bodyweight", equipment: "Bodyweight", aliases: ["Plank (sec)"] });
  add("pallof-press", "Pallof Press", { primary: "Core", family: "anti-rotation", variant: "cable", equipment: "Cable", gymModes: "Home", aliases: ["Pallof Press / side"] });
  add("side-plank", "Side Plank", { primary: "Core", family: "lateral core", variant: "bodyweight", equipment: "Bodyweight", aliases: ["Side Plank / side (sec)"] });

  const EXERCISE_BY_ID = Object.fromEntries(records.map((record) => [record.id, record]));

  function relations(id, closest = [], good = [], fallback = []) {
    const record = EXERCISE_BY_ID[id];
    if (!record) throw new Error(`Unknown exercise relation source: ${id}`);
    record.closestMatchIds = closest.filter((candidate) => candidate !== id);
    record.goodAlternativeIds = good.filter((candidate) => candidate !== id);
    record.fallbackIds = fallback.filter((candidate) => candidate !== id);
    record.validReplacementIds = [...new Set([...record.closestMatchIds, ...record.goodAlternativeIds])];
    record.lessExactReplacementIds = [...new Set(record.fallbackIds)];
  }

  function familyRelations(ids, good = [], fallback = []) {
    ids.forEach((id) => relations(id, ids, good, fallback));
  }

  familyRelations(["bench-press", "db-bench-press", "smith-bench-press", "machine-chest-press", "push-up"]);
  familyRelations(["incline-bench-press", "incline-db-press", "incline-smith-press", "incline-machine-press", "low-to-high-cable-press"]);
  familyRelations(["cable-fly-high-to-low", "cable-fly-low-to-high", "pec-deck", "incline-pec-deck", "db-fly", "low-incline-db-fly", "band-fly"]);
  familyRelations(["machine-shoulder-press", "db-shoulder-press", "smith-shoulder-press", "landmine-press"]);
  familyRelations(["cable-lateral-raise", "db-lateral-raise", "machine-lateral-raise"]);
  familyRelations(["bar-pushdown", "rope-pushdown", "single-arm-pushdown"]);
  familyRelations(["skull-crusher", "overhead-rope-extension", "db-overhead-extension"]);
  familyRelations(["lat-pulldown", "neutral-grip-pulldown", "single-arm-pulldown", "pull-up", "assisted-pull-up"], [], ["db-pullover", "barbell-pullover", "inverted-row", "barbell-row"]);
  familyRelations(["barbell-pullover", "db-pullover", "cable-pullover", "straight-arm-pulldown"]);
  familyRelations(["inverted-row", "chest-supported-db-row", "chest-supported-barbell-row", "seated-cable-row", "machine-row", "barbell-row", "pendlay-row", "one-arm-barbell-row", "meadows-row", "trap-bar-row", "one-arm-db-row", "seal-row", "t-bar-row"]);
  familyRelations(["face-pull", "wide-grip-barbell-row"], ["rear-delt-db-fly", "chest-supported-rear-delt-raise", "reverse-pec-deck", "plate-rear-delt-raise", "prone-y-raise"]);
  familyRelations(["rear-delt-db-fly", "chest-supported-rear-delt-raise", "reverse-pec-deck", "plate-rear-delt-raise", "prone-y-raise"], ["face-pull"], ["wide-grip-barbell-row"]);
  familyRelations(["cable-curl", "bayesian-cable-curl", "ez-bar-curl", "barbell-curl", "db-curl", "alternating-db-curl", "incline-db-curl", "machine-curl", "preacher-curl", "plate-curl", "kettlebell-curl"], [], ["reverse-barbell-curl"]);
  familyRelations(["hammer-curl", "cross-body-hammer-curl", "rope-hammer-curl"], ["kettlebell-curl"], ["reverse-barbell-curl", "barbell-curl"]);
  familyRelations(["hack-squat", "leg-press", "smith-squat", "back-squat", "front-squat", "goblet-squat", "belt-squat"]);
  familyRelations(["walking-lunge", "reverse-lunge", "step-up", "bulgarian-split-squat"]);
  familyRelations(["leg-extension", "spanish-squat", "sissy-squat"]);
  familyRelations(["seated-hamstring-curl", "lying-hamstring-curl", "standing-hamstring-curl"]);
  familyRelations(["barbell-rdl", "db-rdl", "hip-thrust"]);
  familyRelations(["standing-calf-raise", "leg-press-calf-raise", "smith-calf-raise", "single-leg-calf-raise", "db-standing-calf-raise", "barbell-standing-calf-raise"], [], ["seated-calf-raise"]);
  familyRelations(["seated-calf-raise", "plate-loaded-seated-calf-raise", "seated-db-calf-raise", "seated-barbell-calf-raise", "bent-knee-calf-raise"], [], ["standing-calf-raise"]);
  familyRelations(["barbell-shrug", "trap-bar-shrug", "db-shrug"]);
  familyRelations(["farmer-carry", "suitcase-carry"]);

  const EXERCISE_ALIASES = {};
  records.forEach((record) => {
    [record.displayName, ...record.aliases].forEach((name) => {
      const key = String(name).trim().toLowerCase();
      if (EXERCISE_ALIASES[key] && EXERCISE_ALIASES[key] !== record.id) {
        throw new Error(`Ambiguous exercise alias: ${name}`);
      }
      EXERCISE_ALIASES[key] = record.id;
    });
  });

  const META_DEFAULT = {
    id: "generic",
    displayName: "Exercise",
    aliases: [],
    progressCategory: "Other",
    primaryMuscleGroup: "General",
    primaryMuscle: "General",
    secondaryMuscleGroups: [],
    secondaryMuscles: [],
    movementFamily: "General",
    movementPattern: "General",
    movementVariant: "generic",
    equipment: "Unknown",
    equipmentType: "Unknown",
    exerciseType: "compound",
    type: "compound",
    gymModes: "Both",
    supportsPlateCalculator: false,
    imageAsset: null,
    closestMatchIds: [],
    goodAlternativeIds: [],
    fallbackIds: [],
    validReplacementIds: [],
    lessExactReplacementIds: [],
  };

  function slugify(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "generic";
  }

  function canonicalExerciseId(nameOrId) {
    if (EXERCISE_BY_ID[nameOrId]) return nameOrId;
    return EXERCISE_ALIASES[String(nameOrId || "").trim().toLowerCase()] || slugify(nameOrId);
  }

  function getExercise(nameOrId) {
    return EXERCISE_BY_ID[canonicalExerciseId(nameOrId)] || null;
  }

  return {
    MOVEMENT_FAMILIES,
    META_DEFAULT,
    EXERCISE_LIBRARY: records,
    EXERCISE_BY_ID,
    EXERCISE_ALIASES,
    canonicalExerciseId,
    getExercise,
    slugify,
  };
});
