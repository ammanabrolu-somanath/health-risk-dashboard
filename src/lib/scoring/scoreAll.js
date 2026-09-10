import diabetesRules from '../../data/rules/diabetes.rules.json';
import hypertensionRules from '../../data/rules/hypertension.rules.json';
import cardiovascularRules from '../../data/rules/cardiovascular.rules.json';
import { deriveMetrics } from './derive.js';
import { scoreCondition } from './scoreCondition.js';

export { CONDITION_IDS } from './conditions.js';

export const RULES = {
  diabetes: diabetesRules,
  hypertension: hypertensionRules,
  cardiovascular: cardiovascularRules,
};

/**
 * Score all three conditions for a profile.
 *
 * PURE: same input, same output, no mutation of `profile`. The entire What-If
 * simulator is built on that guarantee — simulating is just calling this again
 * with a patched copy.
 *
 * ORDERING IS LOAD-BEARING: diabetes must be scored before cardiovascular,
 * because the CVD table has a `diabetesCoupling` factor that reads the diabetes
 * band. Non-circular by construction (nothing feeds back into diabetes), but do
 * not reorder these three lines.
 */
export function scoreAll(profile) {
  const enriched = deriveMetrics(profile);

  const diabetes = scoreCondition(enriched, diabetesRules);
  const hypertension = scoreCondition(enriched, hypertensionRules);
  const cardiovascular = scoreCondition(enriched, cardiovascularRules, {
    diabetesBand: diabetes.band,
  });

  return { diabetes, hypertension, cardiovascular };
}
