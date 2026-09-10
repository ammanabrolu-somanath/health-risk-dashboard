/**
 * Band logic.
 *
 * Bands are always computed from the RAW point total, never from the 0-100 index,
 * so the number on screen and the category beside it can never disagree because
 * of rounding.
 *
 * Boundaries are inclusive-lower throughout: raw >= threshold enters the band.
 */

export const BANDS = ['low', 'moderate', 'high'];

export const BAND_LABEL = { low: 'Low', moderate: 'Moderate', high: 'High' };

export function bandFor(raw, thresholds) {
  if (raw >= thresholds.high) return 'high';
  if (raw >= thresholds.moderate) return 'moderate';
  return 'low';
}

/**
 * How far this score sits from the next band down (or up, if already Low).
 * Powers the "4 points from Low" readout, which keeps a card informative even
 * when a simulated change did not cross a boundary.
 */
export function distanceToNextBand(raw, thresholds) {
  const band = bandFor(raw, thresholds);
  if (band === 'high') return { direction: 'down', target: 'moderate', points: raw - thresholds.high + 1 };
  if (band === 'moderate') return { direction: 'down', target: 'low', points: raw - thresholds.moderate + 1 };
  return { direction: 'up', target: 'moderate', points: thresholds.moderate - raw };
}

/** Band boundaries expressed on the 0-100 index scale, for drawing tick marks. */
export function bandTicks(thresholds, max) {
  if (!max) return { moderate: 0, high: 0 };
  return {
    moderate: Math.round((thresholds.moderate / max) * 100),
    high: Math.round((thresholds.high / max) * 100),
  };
}
