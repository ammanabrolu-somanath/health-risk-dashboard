import { useMemo } from 'react';
import { scoreAll } from '../lib/scoring/scoreAll.js';
import { applyOverrides, activeOverrides } from '../lib/simulation/applyOverrides.js';
import { summarizeSimulation } from '../lib/simulation/summarizeSimulation.js';

/**
 * The whole data flow, in one hook.
 *
 * Scoring is a few dozen table lookups, so there is no debounce and no
 * throttling anywhere — recalculation is genuinely instant on every keystroke
 * and every slider pixel. The useMemo calls are tidiness, not necessity.
 */
export function useRiskResults(profile, overrides) {
  const active = useMemo(() => activeOverrides(profile, overrides), [profile, overrides]);
  const simProfile = useMemo(() => applyOverrides(profile, overrides), [profile, overrides]);

  const current = useMemo(() => scoreAll(profile), [profile]);
  const simulated = useMemo(() => scoreAll(simProfile), [simProfile]);

  const isSimulating = Object.keys(active).length > 0;

  const summary = useMemo(
    () => summarizeSimulation(current, simulated),
    [current, simulated],
  );

  return { current, simulated, summary, simProfile, activeOverrides: active, isSimulating };
}
