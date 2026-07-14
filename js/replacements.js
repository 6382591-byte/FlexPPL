(function attachReplacementModule(root, factory) {
  const exercises = root?.VEKTR_EXERCISES || (typeof require === "function" ? require("./exercises.js") : null);
  const api = factory(exercises);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_REPLACEMENTS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createReplacementModule(exercises) {
  "use strict";

  if (!exercises) throw new Error("VEKTR exercise library must load before replacements");

  const TRAVEL_EQUIPMENT_PRIORITY = Object.freeze({
    Bodyweight: 90,
    Barbell: 80,
    "Trap bar": 75,
    Plate: 70,
    Kettlebell: 65,
    Dumbbell: 60,
    "Bench-supported": 45,
    "Resistance band": 5,
    Cable: -60,
    Machine: -70,
    "Smith machine": -75,
  });

  function normalizeGymMode(value) {
    return /travel|hotel/i.test(String(value || "")) ? "Travel" : "Home";
  }

  function relationship(base, candidate) {
    if (!base || !candidate || base.id === candidate.id) return null;
    if (base.closestMatchIds.includes(candidate.id)) return "closest";
    if (base.goodAlternativeIds.includes(candidate.id)) return "good";
    if (base.fallbackIds.includes(candidate.id)) return "fallback";
    if (candidate.movementFamily === base.movementFamily && candidate.primaryMuscleGroup === base.primaryMuscleGroup) return "same-family";
    return null;
  }

  function passesStrictFilter(base, candidate) {
    return relationship(base, candidate) !== null;
  }

  function travelScore(candidate) {
    return TRAVEL_EQUIPMENT_PRIORITY[candidate.equipment] ?? 0;
  }

  function reasonFor(base, candidate, relation, context) {
    if (context.preferenceCount >= 2) return "Your usual replacement";
    if (context.gymMode === "Travel" && travelScore(candidate) >= 60 && relation !== "fallback") return "Travel-friendly equipment";
    if (relation === "closest") return "Same movement pattern";
    if (relation === "same-family") return "Same movement pattern";
    if (relation === "good") return "Similar training stimulus";
    return "Same primary muscle — different movement";
  }

  function scoreCandidate(base, candidate, relation, options) {
    let score = { closest: 1000, "same-family": 900, good: 760, fallback: 360 }[relation];
    if (candidate.primaryMuscleGroup === base.primaryMuscleGroup) score += 120;
    if (candidate.movementFamily === base.movementFamily) score += 120;
    if (candidate.exerciseType === base.exerciseType) score += 25;
    if (candidate.equipment === base.equipment) score += 20;
    if (options.explicitIds.has(candidate.id)) score += 40;
    if (options.gymMode === "Travel") score += travelScore(candidate);
    if (options.gymMode === "Home" && (candidate.gymModes === "Home" || candidate.gymModes === "Both")) score += 25;
    score += Math.min(120, options.preferenceCount * 30);
    return score;
  }

  function candidateIds(base, explicitIds) {
    return [...new Set([
      ...base.closestMatchIds,
      ...base.goodAlternativeIds,
      ...base.fallbackIds,
      ...explicitIds,
      ...exercises.EXERCISE_LIBRARY
        .filter((candidate) => candidate.movementFamily === base.movementFamily && candidate.primaryMuscleGroup === base.primaryMuscleGroup)
        .map((candidate) => candidate.id),
    ])];
  }

  function rankReplacements({ baseExerciseId, explicitIds = [], gymMode = "Home", preferenceCounts = {}, limit = 11 } = {}) {
    const base = exercises.getExercise(baseExerciseId);
    if (!base) return [];
    const normalizedMode = normalizeGymMode(gymMode);
    const canonicalExplicitIds = new Set(explicitIds.map((id) => exercises.canonicalExerciseId(id)));

    return candidateIds(base, canonicalExplicitIds)
      .map((id) => exercises.EXERCISE_BY_ID[id])
      .filter((candidate) => passesStrictFilter(base, candidate))
      .map((candidate) => {
        const relation = relationship(base, candidate);
        const preferenceCount = Number(preferenceCounts[candidate.id] || 0);
        const score = scoreCandidate(base, candidate, relation, {
          explicitIds: canonicalExplicitIds,
          gymMode: normalizedMode,
          preferenceCount,
        });
        return {
          exerciseId: candidate.id,
          name: candidate.displayName,
          meta: candidate,
          relation,
          lessExact: relation === "fallback",
          score,
          reason: reasonFor(base, candidate, relation, { gymMode: normalizedMode, preferenceCount }),
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, Math.max(0, Number(limit) || 0));
  }

  function auditReplacementIntegrity() {
    const failures = [];
    for (const base of exercises.EXERCISE_LIBRARY) {
      for (const result of rankReplacements({ baseExerciseId: base.id, limit: 100 })) {
        if (!passesStrictFilter(base, result.meta)) failures.push(`${base.id} -> ${result.exerciseId}`);
      }
    }
    return failures;
  }

  return Object.freeze({
    TRAVEL_EQUIPMENT_PRIORITY,
    normalizeGymMode,
    relationship,
    passesStrictFilter,
    rankReplacements,
    auditReplacementIntegrity,
  });
});
