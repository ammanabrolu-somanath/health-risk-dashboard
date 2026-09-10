import { CONDITION_IDS } from '../scoring/conditions.js';
import { distanceToNextBand } from '../scoring/bands.js';

/**
 * Diff two contribution lists by factorId.
 *
 * This is the explainability payload, and it is EXACT — not a feature-importance
 * estimate. Both sides came from the same point tables, so subtracting them gives
 * the literal arithmetic behind the score change.
 */
export function diffContributions(before, after) {
  const beforeById = new Map(before.map((c) => [c.factorId, c]));

  return after
    .map((a) => {
      const b = beforeById.get(a.factorId);
      if (!b) return null;
      return {
        factorId: a.factorId,
        label: a.label,
        valueBefore: b.valueLabel,
        valueAfter: a.valueLabel,
        displayBefore: b.displayValue,
        displayAfter: a.displayValue,
        pointsBefore: b.points,
        pointsAfter: a.points,
        change: a.points - b.points,
        note: a.note,
      };
    })
    .filter(Boolean)
    .filter((d) => d.change !== 0 || d.valueBefore !== d.valueAfter)
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
}

/**
 * Everything the simulated UI needs, computed once.
 * Negative deltas are improvements throughout.
 */
export function summarizeSimulation(current, simulated) {
  const perCondition = {};

  for (const id of CONDITION_IDS) {
    const c = current[id];
    const s = simulated[id];
    const deltaIndex = s.index - c.index;

    perCondition[id] = {
      id,
      label: c.label,
      short: c.short,
      current: c,
      simulated: s,
      deltaIndex,
      deltaRaw: s.raw - c.raw,
      bandChanged: s.band !== c.band,
      bandFrom: c.band,
      bandTo: s.band,
      direction: deltaIndex < 0 ? 'improved' : deltaIndex > 0 ? 'worsened' : 'unchanged',
      distance: distanceToNextBand(s.raw, s.thresholds),
      factorDeltas: diffContributions(c.contributions, s.contributions),
    };
  }

  const list = CONDITION_IDS.map((id) => perCondition[id]);

  // The headline. Prefer a band crossing over a bigger bare number: crossing
  // Moderate -> Low is the more meaningful result to lead with.
  const improved = list.filter((c) => c.deltaIndex < 0);
  const biggestWin =
    improved.slice().sort((a, b) => {
      if (a.bandChanged !== b.bandChanged) return a.bandChanged ? -1 : 1;
      return a.deltaIndex - b.deltaIndex;
    })[0] ?? null;

  return {
    perCondition,
    list,
    biggestWin,
    anyChange: list.some((c) => c.direction !== 'unchanged'),
    bandsCrossed: list.filter((c) => c.bandChanged).length,
  };
}
