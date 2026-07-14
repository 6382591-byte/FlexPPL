const fs = require("node:fs");
const vm = require("node:vm");
const exercises = require("./js/exercises.js");
const illustrations = require("./js/illustrations.js");
const replacements = require("./js/replacements.js");
const plates = require("./js/plate-calculator.js");
const progression = require("./js/progression.js");
const progress = require("./js/progress.js");
const programs = require("./js/programs.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
const serviceWorker = fs.readFileSync("sw.js", "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());
for (const script of inlineScripts) new vm.Script(script);

for (const exercise of exercises.EXERCISE_LIBRARY) {
  assert(["compound", "isolation"].includes(exercise.exerciseType), `Bad type: ${exercise.id}`);
  assert(exercise.progressCategory, `Missing progress category: ${exercise.id}`);
  if (exercise.imageAsset) assert(fs.existsSync(exercise.imageAsset), `Missing image: ${exercise.id} -> ${exercise.imageAsset}`);
  for (const replacementId of [
    ...exercise.closestMatchIds,
    ...exercise.goodAlternativeIds,
    ...exercise.fallbackIds,
  ]) {
    assert(exercises.EXERCISE_BY_ID[replacementId], `Missing replacement: ${exercise.id} -> ${replacementId}`);
  }
}

const visibleExerciseIds = new Set();
for (const template of Object.values(programs.WORKOUT_TEMPLATES)) {
  for (const item of template.exercises) visibleExerciseIds.add(item.exerciseId);
}
for (const exercise of exercises.EXERCISE_LIBRARY) {
  for (const id of [...exercise.closestMatchIds, ...exercise.goodAlternativeIds, ...exercise.fallbackIds]) visibleExerciseIds.add(id);
}
for (const exerciseId of visibleExerciseIds) {
  const exercise = exercises.EXERCISE_BY_ID[exerciseId];
  assert(exercise, `Illustration audit references missing exercise: ${exerciseId}`);
  assert(illustrations.canRenderExercise(exercise), `No accurate illustration scene: ${exerciseId}`);
  const rendered = illustrations.renderExerciseIllustration(exercise);
  assert(rendered.includes(`data-exercise-id="${exerciseId}"`), `Illustration identity mismatch: ${exerciseId}`);
  assert(rendered.includes(`aria-label="${exercise.displayName}`), `Illustration label mismatch: ${exerciseId}`);
}

for (const template of Object.values(programs.WORKOUT_TEMPLATES)) {
  for (const item of template.exercises) {
    assert(exercises.EXERCISE_BY_ID[item.exerciseId], `Missing program exercise: ${template.id}/${item.exerciseId}`);
  }
}

assert(html.includes("BEST REPLACEMENT") && html.includes("OTHER OPTIONS") && html.includes("More options"), "Swap hierarchy missing");
assert(/PLATE CALCULATOR/.test(html) && /TARGET WEIGHT/.test(html) && /PER SIDE/.test(html), "Plate labels missing");
assert(html.includes('src="js/exercises.js"'), "Exercise module not loaded");
assert(html.includes('src="js/illustrations.js"'), "Illustration module not loaded");
assert(html.includes('src="js/replacements.js"'), "Replacement module not loaded");
assert(html.includes('src="js/plate-calculator.js"'), "Plate calculator module not loaded");
assert(html.includes('src="js/progression.js"'), "Progression module not loaded");
assert(html.includes('src="js/progress.js"'), "Progress module not loaded");
assert(html.includes('src="js/programs.js"'), "Program module not loaded");
assert(html.includes('src="js/state.js"'), "State module not loaded");

assert(replacements.auditReplacementIntegrity().length === 0, "Replacement integrity audit failed");
assert(plates.calculateLoadedWeight(45,{45:1,25:1,5:1}).totalWeight===195,"Loaded plate audit failed");
assert(progression.evaluateSession({weight:175,sets:[6,6,6],target:6,increment:5,workingSets:3}).nextWeight===180,"Progression audit failed");
assert(progress.buildProgress([],[]).summary.workouts===0,"Progress summary audit failed");
assert(!serviceWorker.includes("/assets/exercises/"), "Obsolete exercise art is still precached");
assert(!html.includes("Add to Home screen") && !html.includes("Install app"), "Install tutorial still present");
console.log(`validation passed (${exercises.EXERCISE_LIBRARY.length} canonical exercises, ${visibleExerciseIds.size} audited illustrations, strict swap integrity, ${Object.keys(programs.WORKOUT_TEMPLATES).length} workouts)`);
