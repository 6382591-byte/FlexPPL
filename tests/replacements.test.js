const test = require("node:test");
const assert = require("node:assert/strict");
const exercises = require("../js/exercises.js");
const replacements = require("../js/replacements.js");

const names = (results) => results.map((result) => result.name);
const categories = (results) => results.map((result) => result.meta.progressCategory);

test("calf replacements never leak upper-body or lunge exercises", () => {
  for (const source of ["standing-calf-raise", "seated-calf-raise", "leg-press-calf-raise"]) {
    const results = replacements.rankReplacements({ baseExerciseId: source, limit: 20 });
    assert.ok(results.length > 0, source);
    assert.deepEqual([...new Set(categories(results))], ["Calves"]);
    assert.ok(!names(results).some((name) => /curl|lunge|row|pullover|shrug/i.test(name)));
  }
});

test("squat replacements stay in the squat family", () => {
  const results = replacements.rankReplacements({ baseExerciseId: "hack-squat", limit: 20 });
  assert.ok(results.length >= 5);
  assert.ok(results.every((result) => result.meta.movementFamily === "squat" && result.meta.primaryMuscleGroup === "Quads"));
});

test("curl replacements never contain leg exercises", () => {
  const results = replacements.rankReplacements({ baseExerciseId: "cable-curl", limit: 20 });
  assert.ok(results.every((result) => ["supinated curl", "reverse curl"].includes(result.meta.movementFamily)));
  assert.ok(!categories(results).some((category) => ["Quads", "Hamstrings / Glutes", "Calves"].includes(category)));
});

test("Travel mode reorders only valid options toward common free weights", () => {
  const home = replacements.rankReplacements({ baseExerciseId: "cable-curl", gymMode: "Home", limit: 10 });
  const travel = replacements.rankReplacements({ baseExerciseId: "cable-curl", gymMode: "Travel", limit: 10 });
  assert.ok(travel.slice(0, 3).some((result) => result.exerciseId === "barbell-curl"));
  assert.ok(travel.every((result) => replacements.passesStrictFilter(exercises.EXERCISE_BY_ID["cable-curl"], result.meta)));
  assert.deepEqual(new Set(travel.map((result) => result.exerciseId)), new Set(home.map((result) => result.exerciseId)));
});

test("Travel Pull alternatives are practical and honestly classified", () => {
  const pulldown = replacements.rankReplacements({ baseExerciseId: "lat-pulldown", gymMode: "Travel", limit: 20 });
  assert.ok(names(pulldown).includes("Barbell Pullover"));
  const pullover = pulldown.find((result) => result.exerciseId === "barbell-pullover");
  assert.equal(pullover.relation, "fallback");
  assert.equal(pullover.reason, "Same primary muscle — different movement");

  const row = replacements.rankReplacements({ baseExerciseId: "chest-supported-db-row", gymMode: "Travel", limit: 20 });
  assert.ok(names(row).includes("Barbell Bent-Over Row"));
  assert.ok(names(row).includes("Trap-Bar Row"));

  const facePull = replacements.rankReplacements({ baseExerciseId: "face-pull", gymMode: "Travel", limit: 20 });
  assert.ok(names(facePull).includes("Plate Rear-Delt Raise"));
  assert.ok(names(facePull).includes("Wide-Grip Barbell Row"));
});

test("replacement preference can influence ranking but cannot bypass eligibility", () => {
  const results = replacements.rankReplacements({
    baseExerciseId: "standing-calf-raise",
    preferenceCounts: { "barbell-curl": 100, "single-leg-calf-raise": 3 },
    limit: 20,
  });
  assert.ok(!results.some((result) => result.exerciseId === "barbell-curl"));
  assert.equal(results.find((result) => result.exerciseId === "single-leg-calf-raise").reason, "Your usual replacement");
});

test("global replacement integrity audit has no invalid candidates", () => {
  assert.deepEqual(replacements.auditReplacementIntegrity(), []);
});
