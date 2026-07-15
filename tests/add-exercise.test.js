const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../js/exercises.js');

test('browse categories expose required muscle groups with curated exercises', () => {
  for (const category of ['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings / Glutes','Calves','Core','Other']) {
    assert.ok(exercises.CATEGORY_ORDER.includes(category));
    assert.ok(Array.isArray(exercises.exercisesByCategory(category)));
  }
  assert.ok(exercises.exercisesByCategory('Quads').some((exercise) => exercise.id === 'hack-squat'));
  assert.ok(exercises.exercisesByCategory('Calves').some((exercise) => exercise.id === 'hack-squat-calf-raise'));
});

test('add-exercise search ranks exact aliases and common abbreviations', () => {
  const first = (query) => exercises.searchExercises(query, 5).map((exercise) => exercise.id);
  assert.equal(first('hack squat')[0], 'hack-squat');
  assert.equal(first('bar curl')[0], 'barbell-curl');
  assert.equal(first('one arm DB row')[0], 'one-arm-db-row');
  assert.ok(first('DB RDL').includes('db-rdl'));
  assert.ok(first('DB SLDL').includes('db-stiff-leg-deadlift'));
  assert.ok(first('straight leg dumbbell deadlift').includes('db-rdl'));
});

test('custom exercise metadata defaults are safe when persisted through state', () => {
  const custom = {
    id: 'custom-test',
    displayName: 'Hotel Band Press',
    category: 'Other',
    progressCategory: 'Other',
    equipment: 'Resistance band',
    exerciseType: 'isolation',
    loadingType: 'custom',
    loadSemantics: 'unknown',
    supportsEstimated1RM: false,
    imageAsset: null,
  };
  assert.equal(custom.id.startsWith('custom-'), true);
  assert.equal(custom.supportsEstimated1RM, false);
  assert.equal(custom.imageAsset, null);
});
