(function attachPlateCalculatorModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VEKTR_PLATES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPlateCalculatorModule() {
  "use strict";

  const AVAILABLE_PLATES = Object.freeze([45, 35, 25, 15, 10, 5]);
  const BAR_WEIGHTS = Object.freeze([45, 35]);

  function normalizePlateList(plates = AVAILABLE_PLATES) {
    return [...new Set(plates.map(Number).filter((plate) => Number.isFinite(plate) && plate > 0))].sort((a, b) => b - a);
  }

  function betterCombination(candidate, current) {
    if (!current) return true;
    if (candidate.length !== current.length) return candidate.length < current.length;
    for (let index = 0; index < candidate.length; index += 1) {
      if (candidate[index] !== current[index]) return candidate[index] > current[index];
    }
    return false;
  }

  function fewestPlatesForSide(sideWeight, availablePlates = AVAILABLE_PLATES) {
    const target = Number(sideWeight);
    const plates = normalizePlateList(availablePlates);
    if (!Number.isFinite(target) || target < 0) return null;
    if (target === 0) return [];
    if (!Number.isInteger(target)) return null;
    const best = Array(target + 1).fill(null);
    best[0] = [];
    for (let total = 1; total <= target; total += 1) {
      for (const plate of plates) {
        if (plate > total || !best[total - plate]) continue;
        const candidate = [...best[total - plate], plate].sort((a, b) => b - a);
        if (betterCombination(candidate, best[total])) best[total] = candidate;
      }
    }
    return best[target];
  }

  function optionForTotal(totalWeight, barWeight, availablePlates = AVAILABLE_PLATES) {
    const total = Number(totalWeight);
    const bar = Number(barWeight);
    const sideWeight = (total - bar) / 2;
    const platesPerSide = fewestPlatesForSide(sideWeight, availablePlates);
    if (!platesPerSide) return null;
    return { weight: total, sideWeight, platesPerSide };
  }

  function calculateTargetLoad(targetWeight, barWeight = 45, availablePlates = AVAILABLE_PLATES) {
    const target = Number(targetWeight);
    const bar = Number(barWeight);
    const plates = normalizePlateList(availablePlates);
    if (!Number.isFinite(target) || !Number.isFinite(bar) || target < 0 || bar <= 0) {
      return { valid: false, exact: false, targetWeight: target, barWeight: bar, platesPerSide: [], achievedWeight: null, lowerOption: null, higherOption: null };
    }
    if (target < bar) {
      const barOnly = optionForTotal(bar, bar, plates);
      return { valid: true, exact: false, belowBar: true, targetWeight: target, barWeight: bar, platesPerSide: [], achievedWeight: bar, lowerOption: null, higherOption: barOnly };
    }

    const exactOption = optionForTotal(target, bar, plates);
    const minimumStep = 2 * Math.min(...plates);
    const offset = target - bar;
    const lowerWeight = bar + Math.floor(offset / minimumStep) * minimumStep;
    const higherWeight = bar + Math.ceil(offset / minimumStep) * minimumStep;
    const lowerOption = optionForTotal(lowerWeight, bar, plates);
    const higherOption = optionForTotal(higherWeight, bar, plates);
    const selected = exactOption || lowerOption || higherOption;
    return {
      valid: true,
      exact: Boolean(exactOption),
      belowBar: false,
      targetWeight: target,
      barWeight: bar,
      platesPerSide: selected?.platesPerSide || [],
      achievedWeight: selected?.weight ?? bar,
      lowerOption,
      higherOption,
    };
  }

  function normalizeCounts(counts = {}) {
    return Object.fromEntries(AVAILABLE_PLATES.map((plate) => [plate, Math.max(0, Math.floor(Number(counts[plate]) || 0))]));
  }

  function calculateLoadedWeight(barWeight = 45, counts = {}) {
    const bar = Number(barWeight);
    const normalizedCounts = normalizeCounts(counts);
    const platesPerSide = [];
    for (const plate of AVAILABLE_PLATES) {
      for (let count = 0; count < normalizedCounts[plate]; count += 1) platesPerSide.push(plate);
    }
    const sideWeight = platesPerSide.reduce((sum, plate) => sum + plate, 0);
    return { valid: Number.isFinite(bar) && bar > 0, barWeight: bar, counts: normalizedCounts, platesPerSide, sideWeight, totalWeight: bar + 2 * sideWeight };
  }

  function countsFromPlates(plates = []) {
    const counts = normalizeCounts();
    for (const plate of plates) if (Object.hasOwn(counts, plate)) counts[plate] += 1;
    return counts;
  }

  function formatPlateList(plates = []) {
    if (!plates.length) return "Bar only";
    const counts = countsFromPlates(plates);
    return AVAILABLE_PLATES.filter((plate) => counts[plate] > 0)
      .map((plate) => counts[plate] > 1 ? `${plate} × ${counts[plate]}` : String(plate))
      .join(" + ");
  }

  return Object.freeze({
    AVAILABLE_PLATES,
    BAR_WEIGHTS,
    fewestPlatesForSide,
    calculateTargetLoad,
    calculateLoadedWeight,
    countsFromPlates,
    formatPlateList,
  });
});
