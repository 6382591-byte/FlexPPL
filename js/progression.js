(function attachProgressionModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_PROGRESSION = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgressionModule() {
  "use strict";

  function validSets(sets = []) {
    return sets.map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  }

  function metTarget(session) {
    const sets = validSets(session.sets);
    const required = Math.max(1, Number(session.workingSets || session.sets?.length || 0));
    return sets.length >= required && sets.slice(0, required).every((reps) => reps >= Number(session.target));
  }

  function meaningfulUnderperformance(session) {
    const sets = validSets(session.sets);
    const required = Math.max(1, Number(session.workingSets || session.sets?.length || 0));
    const target = Number(session.target);
    if (sets.length < required || !Number.isFinite(target)) return false;
    const used = sets.slice(0, required);
    const average = used.reduce((sum, reps) => sum + reps, 0) / used.length;
    const missedSets = used.filter((reps) => reps < target).length;
    return missedSets === required && average <= target - 1;
  }

  function priorOutcome(session) {
    if (session.coach) return String(session.coach).toUpperCase();
    if (metTarget(session)) return Number(session.inc || session.increment) === 0 ? "ADD REPS" : "INCREASE";
    return "REPEAT";
  }

  function evaluateSession({ weight, sets, target, increment = 0, workingSets, recentSessions = [], manualNextWeight } = {}) {
    const session = { weight, sets, target, inc: increment, workingSets };
    const complete = validSets(sets).length >= Math.max(1, Number(workingSets || sets?.length || 0));
    if (!complete) return { complete: false, coach: "BASELINE", status: "first", nextWeight: Number(weight) || 0, nextTarget: Number(target) || 0, stalled: false };

    const achieved = metTarget(session);
    const currentUnderperformance = meaningfulUnderperformance(session);
    const previous = recentSessions[0];
    const repeatedUnderperformance = currentUnderperformance && previous && meaningfulUnderperformance(previous);
    const numericWeight = Number(weight) || 0;
    const numericIncrement = Math.max(0, Number(increment) || 0);
    const numericTarget = Math.max(0, Number(target) || 0);
    let coach;
    let nextWeight = numericWeight;
    let nextTarget = numericTarget;

    if (achieved) {
      if (numericIncrement === 0) {
        coach = "ADD REPS";
        nextTarget = numericTarget + 1;
      } else {
        coach = "INCREASE";
        nextWeight = numericWeight + numericIncrement;
      }
    } else if (repeatedUnderperformance && numericIncrement > 0) {
      coach = "REDUCE";
      nextWeight = Math.max(0, numericWeight - numericIncrement);
    } else {
      coach = "REPEAT";
    }

    if (manualNextWeight !== undefined && manualNextWeight !== null && manualNextWeight !== "" && Number.isFinite(Number(manualNextWeight))) {
      nextWeight = Number(manualNextWeight);
    }

    const outcomes = [coach, ...recentSessions.slice(0, 2).map(priorOutcome)];
    const stalled = outcomes.length >= 3 && outcomes.every((outcome) => !["INCREASE", "ADD REPS"].includes(outcome));
    const status = { "INCREASE": "increase", "ADD REPS": "increase", "REPEAT": "repeat", "REDUCE": "reduce" }[coach] || "first";
    const message = coach === "INCREASE" ? `Increase to ${nextWeight}`
      : coach === "ADD REPS" ? `Aim for ${nextTarget} reps`
      : coach === "REDUCE" ? `Reduce to ${nextWeight}`
      : "Repeat and own it";
    return { complete: true, coach, status, nextWeight, nextTarget, stalled, meaningfulUnderperformance: currentUnderperformance, message };
  }

  return Object.freeze({ validSets, metTarget, meaningfulUnderperformance, evaluateSession });
});
