/**
 * Derived metrics. Everything the rule tables read but the user does not type directly.
 * Kept pure so the What-If simulator can call it on a hypothetical profile.
 */

/** Body-mass index. Returns 0 for unusable input so scoring never sees NaN/Infinity. */
export function bmiOf(weightKg, heightCm) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return 0;
  const bmi = w / (h * h);
  return Number.isFinite(bmi) ? bmi : 0;
}

/**
 * ACC/AHA 2017 blood-pressure category.
 * Stage 2 wins over Stage 1 wins over Elevated — a reading is categorised by
 * whichever of systolic/diastolic is worse.
 */
export function bpCategoryOf(systolic, diastolic) {
  const s = Number(systolic);
  const d = Number(diastolic);
  if (!Number.isFinite(s) || !Number.isFinite(d)) return 'normal';
  if (s >= 140 || d >= 90) return 'stage2';
  if (s >= 130 || d >= 80) return 'stage1';
  if (s >= 120) return 'elevated';
  return 'normal';
}

/**
 * The rule tables are sex-binary because the published instruments are.
 * 'other' resolves to the female table, which uses the lower waist thresholds —
 * the more conservative choice. Surfaced in the UI rather than hidden.
 */
export function referenceSex(sex) {
  return sex === 'male' ? 'male' : 'female';
}

/** Enrich a raw profile with every derived field the rule tables reference. */
export function deriveMetrics(profile) {
  return {
    ...profile,
    bmi: bmiOf(profile.weightKg, profile.heightCm),
    waist: Number(profile.waistCm) || 0,
    bpCategory: bpCategoryOf(profile.systolic, profile.diastolic),
  };
}
