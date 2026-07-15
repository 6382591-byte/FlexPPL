const test = require("node:test");
const assert = require("node:assert/strict");
const plates = require("../js/plate-calculator.js");

const targetCases = [
  [95, 45, true, [25]],
  [105, 45, true, [25, 5]],
  [135, 45, true, [45]],
  [175, 45, true, [45, 15, 5]],
  [185, 45, true, [45, 25]],
  [225, 45, true, [45, 45]],
  [105, 35, true, [35]],
  [185, 35, true, [45, 25, 5]],
];

test("target mode returns the fewest plates with larger plates winning ties", () => {
  for (const [target, bar, exact, expected] of targetCases) {
    const result = plates.calculateTargetLoad(target, bar);
    assert.equal(result.valid, true, `${target}/${bar}`);
    assert.equal(result.exact, exact, `${target}/${bar}`);
    assert.deepEqual(result.platesPerSide, expected, `${target}/${bar}`);
    assert.equal(result.achievedWeight, target, `${target}/${bar}`);
  }
});

test("non-exact targets expose correct lower and higher loads", () => {
  const result110 = plates.calculateTargetLoad(110, 45);
  assert.equal(result110.exact, false);
  assert.equal(result110.lowerOption.weight, 105);
  assert.equal(result110.higherOption.weight, 115);
  assert.deepEqual(result110.lowerOption.platesPerSide, [25, 5]);
  assert.deepEqual(result110.higherOption.platesPerSide, [35]);

  const result180 = plates.calculateTargetLoad(180, 45);
  assert.equal(result180.lowerOption.weight, 175);
  assert.equal(result180.higherOption.weight, 185);
});

test("targets below the bar and invalid input are handled safely", () => {
  const below = plates.calculateTargetLoad(20, 45);
  assert.equal(below.valid, true);
  assert.equal(below.belowBar, true);
  assert.equal(below.lowerOption, null);
  assert.equal(below.higherOption.weight, 45);
  for (const invalid of ["", "nope", -10, Number.NaN]) {
    const value = invalid === "" ? Number.NaN : invalid;
    assert.equal(plates.calculateTargetLoad(value, 45).valid, false);
  }
});

test("loaded mode totals plates tapped on one side", () => {
  const result = plates.calculateLoadedWeight(45, { 45: 1, 25: 1, 5: 1 });
  assert.deepEqual(result.platesPerSide, [45, 25, 5]);
  assert.equal(result.sideWeight, 75);
  assert.equal(result.totalWeight, 195);

  const doubled = plates.calculateLoadedWeight(35, { 45: 2, 10: 1 });
  assert.deepEqual(doubled.platesPerSide, [45, 45, 10]);
  assert.equal(doubled.totalWeight, 235);
});

test("plate formatting exposes repeated plates clearly", () => {
  assert.equal(plates.formatPlateList([]), "Bar only");
  assert.equal(plates.formatPlateList([45, 45, 25, 5]), "45 × 2 + 25 + 5");
});


test('plate-loaded machine calculations are honest about plates-only and total system load', () => {
  const bothUnknown = plates.calculateMachineLoad({ baseResistance: 0, counts: { 45: 2 }, loadingConfiguration: 'both-sides', trackingMode: 'plates-only' });
  assert.equal(bothUnknown.displayedWeight, 180);
  assert.equal(bothUnknown.label, '180 lb plates loaded');
  assert.equal(bothUnknown.helper, 'Machine starting resistance not included');

  const bothKnown = plates.calculateMachineLoad({ baseResistance: 75, counts: { 45: 2 }, loadingConfiguration: 'both-sides', trackingMode: 'total-system' });
  assert.equal(bothKnown.displayedWeight, 255);
  assert.equal(bothKnown.label, '255 lb total system load');
  assert.equal(bothKnown.helper, 'Includes 75 lb machine resistance');

  const single = plates.calculateMachineLoad({ baseResistance: 0, counts: { 45: 1, 25: 1 }, loadingConfiguration: 'single-point', trackingMode: 'plates-only' });
  assert.equal(single.displayedWeight, 70);
});
