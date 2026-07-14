const fs = require("node:fs");
const vm = require("node:vm");
const exercises = require("./js/exercises.js");
const programs = require("./js/programs.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync("index.html", "utf8");
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

for (const template of Object.values(programs.WORKOUT_TEMPLATES)) {
  for (const item of template.exercises) {
    assert(exercises.EXERCISE_BY_ID[item.exerciseId], `Missing program exercise: ${template.id}/${item.exerciseId}`);
  }
}

assert(html.includes("BEST REPLACEMENT") && html.includes("OTHER OPTIONS") && html.includes("More options"), "Swap hierarchy missing");
assert(/PLATE CALCULATOR/.test(html) && /TARGET WEIGHT/.test(html) && /PER SIDE/.test(html), "Plate labels missing");
assert(html.includes('src="js/exercises.js"'), "Exercise module not loaded");
assert(html.includes('src="js/programs.js"'), "Program module not loaded");
assert(html.includes('src="js/state.js"'), "State module not loaded");

console.log(`validation passed (${exercises.EXERCISE_LIBRARY.length} canonical exercises, ${Object.keys(programs.WORKOUT_TEMPLATES).length} workouts)`);
