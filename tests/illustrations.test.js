const test = require("node:test");
const assert = require("node:assert/strict");
const exercises = require("../js/exercises.js");
const illustrations = require("../js/illustrations.js");
const programs = require("../js/programs.js");

test("every exercise in the active PPL program has an accurate native scene", () => {
  for (const template of Object.values(programs.WORKOUT_TEMPLATES)) {
    for (const item of template.exercises) {
      const exercise = exercises.EXERCISE_BY_ID[item.exerciseId];
      assert.equal(illustrations.canRenderExercise(exercise), true, item.exerciseId);
    }
  }
});

test("every curated replacement has a renderable exercise-aware scene", () => {
  for (const source of exercises.EXERCISE_LIBRARY) {
    const replacements = [...source.closestMatchIds, ...source.goodAlternativeIds, ...source.fallbackIds];
    for (const id of replacements) {
      const replacement = exercises.EXERCISE_BY_ID[id];
      assert.ok(replacement, `${source.id} -> ${id}`);
      assert.equal(illustrations.canRenderExercise(replacement), true, id);
      const svg = illustrations.renderExerciseIllustration(replacement);
      assert.match(svg, new RegExp(`data-exercise-id="${id}"`));
      assert.match(svg, new RegExp(`data-illustration-key="${illustrations.illustrationKey(replacement)}`));
    }
  }
});

test("genuinely different movements do not collapse to one generic scene", () => {
  const ids = ["bench-press", "lat-pulldown", "barbell-curl", "leg-press", "standing-calf-raise", "pallof-press"];
  const keys = ids.map((id) => illustrations.illustrationKey(exercises.EXERCISE_BY_ID[id]));
  assert.equal(new Set(keys).size, ids.length);
});

test("equipment and exercise identity are exposed accessibly", () => {
  const barbellCurl = illustrations.renderExerciseIllustration(exercises.EXERCISE_BY_ID["barbell-curl"]);
  const ezCurl = illustrations.renderExerciseIllustration(exercises.EXERCISE_BY_ID["ez-bar-curl"]);
  assert.match(barbellCurl, /Barbell Curl — BARBELL/);
  assert.match(ezCurl, /EZ-Bar Curl — EZ BAR/);
  assert.notEqual(barbellCurl, ezCurl);
});
