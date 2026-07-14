const test = require("node:test");
const assert = require("node:assert/strict");
const exercises = require("../js/exercises.js");
const programs = require("../js/programs.js");

test("canonical library has unique IDs and unambiguous aliases", () => {
  const ids = exercises.EXERCISE_LIBRARY.map((exercise) => exercise.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(exercises.canonicalExerciseId("One-Arm DB Row"), "one-arm-db-row");
  assert.equal(exercises.canonicalExerciseId("EZ Bar Curl"), "ez-bar-curl");
  assert.equal(exercises.canonicalExerciseId("Bar Curl"), "barbell-curl");
});

test("genuinely different exercises remain separate", () => {
  assert.notEqual(exercises.canonicalExerciseId("Barbell Curl"), exercises.canonicalExerciseId("EZ-Bar Curl"));
  assert.notEqual(exercises.canonicalExerciseId("Pull-Up"), exercises.canonicalExerciseId("Assisted Pull-Up"));
  assert.notEqual(exercises.canonicalExerciseId("Rope Pushdown"), exercises.canonicalExerciseId("Bar Pushdown"));
  assert.notEqual(exercises.canonicalExerciseId("Dumbbell Pullover"), exercises.canonicalExerciseId("Cable Pullover"));
});

test("known bad metadata from the prototype is corrected", () => {
  const barbellCurl = exercises.getExercise("Barbell Curl");
  const sealRow = exercises.getExercise("Seal Row");
  assert.equal(barbellCurl.imageAsset, null);
  assert.equal(barbellCurl.equipment, "Barbell");
  assert.equal(sealRow.equipment, "Barbell");
  assert.equal(sealRow.movementVariant, "barbell bench-supported");
  assert.equal(sealRow.gymModes, "Both");
});

test("every exercise has explicit progress and movement metadata", () => {
  for (const exercise of exercises.EXERCISE_LIBRARY) {
    assert.ok(exercise.progressCategory, `${exercise.id} missing progress category`);
    assert.ok(exercise.primaryMuscleGroup, `${exercise.id} missing primary muscle`);
    assert.ok(exercise.movementFamily, `${exercise.id} missing movement family`);
    assert.ok(exercise.equipment, `${exercise.id} missing equipment`);
    assert.ok(["compound", "isolation"].includes(exercise.exerciseType), `${exercise.id} bad type`);
  }
});

test("PPL program references only canonical exercises", () => {
  assert.deepEqual(programs.ROTATION, ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"]);
  for (const template of Object.values(programs.WORKOUT_TEMPLATES)) {
    for (const item of template.exercises) {
      assert.ok(exercises.EXERCISE_BY_ID[item.exerciseId], `${template.id} missing ${item.exerciseId}`);
      assert.ok(item.workingSets > 0, `${template.id}/${item.exerciseId} invalid set count`);
      for (const replacementId of item.substitutionIds) {
        assert.ok(exercises.EXERCISE_BY_ID[replacementId], `${template.id} missing replacement ${replacementId}`);
      }
    }
  }
});

test("future program framework ships only the tested PPL plan", () => {
  assert.equal(programs.ACTIVE_PROGRAM_ID, "ppl6");
  assert.deepEqual(Object.keys(programs.PROGRAMS), ["ppl6"]);
  assert.equal(programs.PROGRAMS.ppl6.productionReady, true);
});
