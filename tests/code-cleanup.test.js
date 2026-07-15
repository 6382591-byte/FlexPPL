const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const count = (pattern) => (index.match(pattern) || []).length;

test('index keeps one active implementation for primary production functions', () => {
  for (const name of [
    'openPlateCalculator',
    'closePlateModal',
    'setPlateBar',
    'setPlateTarget',
    'plateResultsHtml',
    'updatePlateResults',
    'renderPlateModal',
    'applyPlateWeight',
    'renderProgress',
    'renderHistory',
    'renderSettings',
    'finishWithCore',
  ]) {
    assert.equal(count(new RegExp(`function\\s+${name}\\s*\\(`, 'g')), 1, `${name} should have one declaration`);
  }
});

test('index no longer carries dead legacy program or exercise seed databases', () => {
  assert.equal(index.includes('LEGACY_ROTATION_SEED'), false);
  assert.equal(index.includes('LEGACY_PROGRAM_SEED'), false);
  assert.equal(index.includes('LEGACY_EXERCISE_SEEDS'), false);
  assert.equal(index.includes('function link()'), false);
});
