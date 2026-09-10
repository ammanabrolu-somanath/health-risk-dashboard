/** Waist shrinks/grows with weight at roughly this rate. Labelled as an estimate in the UI. */
export const WAIST_CM_PER_KG = 0.8;

/**
 * Merge a sparse override patch onto the real profile.
 *
 * Two behaviours worth knowing about:
 *
 * 1. An override equal to the underlying value is DROPPED. Nudge a slider away
 *    and back and the app leaves simulation mode cleanly, instead of sitting in
 *    a "simulating" state that changes nothing.
 *
 * 2. Changing weight also moves waist circumference, because the diabetes table
 *    scores waist separately from BMI. Leaving waist frozen while weight drops
 *    would understate the effect. The estimate is surfaced in the panel, not hidden.
 */
export function applyOverrides(profile, overrides) {
  const active = activeOverrides(profile, overrides);
  if (Object.keys(active).length === 0) return profile;

  const next = { ...profile, ...active };

  if (active.weightKg !== undefined && overrides.waistCm === undefined) {
    const deltaKg = active.weightKg - profile.weightKg;
    next.waistCm = Math.max(40, round1(profile.waistCm + deltaKg * WAIST_CM_PER_KG));
  }

  return next;
}

/** The subset of overrides that actually differ from the profile. */
export function activeOverrides(profile, overrides) {
  const active = {};
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (value !== undefined && value !== profile[key]) active[key] = value;
  }
  return active;
}

export function isSimulating(profile, overrides) {
  return Object.keys(activeOverrides(profile, overrides)).length > 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
