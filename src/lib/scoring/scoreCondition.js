import { bandFor } from './bands.js';
import { referenceSex } from './derive.js';

/**
 * Generic rule-table evaluator.
 *
 * One function scores all three conditions; the difference between them lives
 * entirely in JSON. That is what makes the explanation exact rather than
 * approximated — every point on screen came from a row you can open and read.
 */

/** Bands are ordered and use an exclusive upper bound; max: null is the open-ended top band. */
function matchBand(value, bands) {
  const v = Number(value);
  for (const band of bands) {
    if (band.max === null || band.max === undefined) return band;
    if (v < band.max) return band;
  }
  return bands[bands.length - 1];
}

function maxPointsOf(factor, profile) {
  switch (factor.type) {
    case 'range':
      return Math.max(...factor.bands.map((b) => b.points));
    case 'range-by-sex':
      return Math.max(...factor.bandsBySex[referenceSex(profile.sex)].map((b) => b.points));
    default:
      return Math.max(...Object.values(factor.map));
  }
}

/** Evaluate one factor into a contribution row. */
function evaluateFactor(factor, profile, context) {
  const raw =
    factor.type === 'context' ? context[factor.field] : profile[factor.field];

  let points;
  let valueLabel;
  // Provenance: every row this factor could have matched, with the one that
  // actually fired flagged. Emitted here rather than recomputed by the UI, so
  // the drawer is a pure renderer and cannot drift from the scoring.
  let rule;

  if (factor.type === 'range' || factor.type === 'range-by-sex') {
    const bySex = factor.type === 'range-by-sex';
    const bands = bySex ? factor.bandsBySex[referenceSex(profile.sex)] : factor.bands;
    const band = matchBand(raw, bands);
    points = band.points;
    valueLabel = band.label;
    rule = {
      kind: factor.type,
      reference: bySex ? referenceSex(profile.sex) : undefined,
      rows: bands.map((b) => ({ label: b.label, points: b.points, active: b === band })),
    };
  } else {
    // map + context both key off a stringified value, so booleans work unchanged
    const key = String(raw);
    points = factor.map[key] ?? 0;
    valueLabel = factor.valueLabels?.[key] ?? key;
    rule = {
      kind: factor.type,
      reference: undefined,
      rows: Object.entries(factor.map).map(([k, p]) => ({
        label: factor.valueLabels?.[k] ?? k,
        points: p,
        active: k === key,
      })),
    };
  }

  const displayValue =
    factor.decimals !== undefined
      ? `${Number(raw).toFixed(factor.decimals)}${factor.unit ? ` ${factor.unit}` : ''}`
      : factor.unit
        ? `${raw} ${factor.unit}`
        : valueLabel;

  return {
    factorId: factor.id,
    label: factor.label,
    value: raw,
    displayValue,
    valueLabel,
    points,
    maxPoints: maxPointsOf(factor, profile),
    note: factor.note,
    rule,
  };
}

/**
 * @param {object} profile  enriched profile (run deriveMetrics first)
 * @param {object} rules    one of the three rule tables
 * @param {object} context  cross-condition inputs, e.g. { diabetesBand: 'high' }
 */
export function scoreCondition(profile, rules, context = {}) {
  const contributions = rules.factors.map((f) => evaluateFactor(f, profile, context));

  const raw = contributions.reduce((sum, c) => sum + c.points, 0);
  const max = contributions.reduce((sum, c) => sum + c.maxPoints, 0);
  const index = max > 0 ? Math.round((raw / max) * 100) : 0;

  return {
    id: rules.id,
    label: rules.label,
    short: rules.short,
    blurb: rules.blurb,
    source: rules.source,
    adaptation: rules.adaptation,
    thresholds: rules.thresholds,
    raw,
    max,
    index,
    band: bandFor(raw, rules.thresholds),
    contributions,
  };
}
