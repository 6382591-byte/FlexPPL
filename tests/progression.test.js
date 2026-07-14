const test = require("node:test");
const assert = require("node:assert/strict");
const progression = require("../js/progression.js");

test("increases only when every required working set reaches target", () => {
  assert.equal(progression.evaluateSession({ weight: 175, sets: [6, 6, 6], target: 6, increment: 5, workingSets: 3 }).coach, "INCREASE");
  const miss = progression.evaluateSession({ weight: 175, sets: [6, 6, 5], target: 6, increment: 5, workingSets: 3 });
  assert.equal(miss.coach, "REPEAT");
  assert.equal(miss.nextWeight, 175);
});

test("one bad workout never triggers a reduction", () => {
  const result = progression.evaluateSession({ weight: 175, sets: [4, 4, 4], target: 6, increment: 5, workingSets: 3 });
  assert.equal(result.coach, "REPEAT");
});

test("two meaningful underperformances can trigger one-increment reduction", () => {
  const result = progression.evaluateSession({
    weight: 175, sets: [4, 4, 4], target: 6, increment: 5, workingSets: 3,
    recentSessions: [{ weight: 175, sets: [5, 5, 5], target: 6, workingSets: 3, coach: "REPEAT" }],
  });
  assert.equal(result.coach, "REDUCE");
  assert.equal(result.nextWeight, 170);
});

test("zero-increment and bodyweight work progresses reps", () => {
  const result = progression.evaluateSession({ weight: 0, sets: [8, 8, 8], target: 8, increment: 0, workingSets: 3 });
  assert.equal(result.coach, "ADD REPS");
  assert.equal(result.nextTarget, 9);
});

test("supports variable set counts", () => {
  assert.equal(progression.evaluateSession({ weight: 100, sets: [10, 10], target: 10, increment: 5, workingSets: 2 }).coach, "INCREASE");
  assert.equal(progression.evaluateSession({ weight: 100, sets: [10, 10, 10, 9], target: 10, increment: 5, workingSets: 4 }).coach, "REPEAT");
});

test("manual next-weight override wins without changing outcome label", () => {
  const result = progression.evaluateSession({ weight: 175, sets: [6, 6, 6], target: 6, increment: 5, workingSets: 3, manualNextWeight: 177.5 });
  assert.equal(result.coach, "INCREASE");
  assert.equal(result.nextWeight, 177.5);
});

test("stall is quiet and only appears after three non-progressing sessions", () => {
  const recentSessions = [
    { sets: [6, 6, 5], target: 6, workingSets: 3, coach: "REPEAT" },
    { sets: [6, 5, 5], target: 6, workingSets: 3, coach: "REPEAT" },
  ];
  assert.equal(progression.evaluateSession({ weight: 175, sets: [6, 6, 5], target: 6, increment: 5, workingSets: 3, recentSessions }).stalled, true);
});
