import flagRules from '../../data/rules/flags.rules.json';
import { evaluateFindings, caveatFor, tiersPresent } from './evaluateFindings.js';

/**
 * App-facing wrapper around the findings engine.
 *
 * Mirrors `scoreAll.js`: the rule table is imported here, so everything below
 * this line is Vite-only, while `evaluateFindings.js` stays importable from
 * plain node for the verification script.
 */

export const FLAG_RULES = flagRules;

export { caveatFor };

export function findingsFor(history) {
  return evaluateFindings(history, flagRules);
}

export function tiersWithFindings(result) {
  return tiersPresent(result, flagRules);
}

/** Total citations in the table still marked unverified — reported by `npm run verify`. */
export function unverifiedSourceCount() {
  return Object.values(flagRules.sources).filter((s) => s.verified !== true).length;
}
