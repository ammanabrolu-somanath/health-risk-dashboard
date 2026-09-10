/**
 * One-click scenarios.
 *
 * These exist for demo reliability as much as for UX: under stage lights you
 * want a button, not a slider drag. Each is a function of the real profile so
 * "lose 6 kg" means six kg off whatever the user actually entered.
 */

export const WHO_ACTIVITY_TARGET = 150;

export const PRESETS = [
  {
    id: 'quit-smoking',
    label: 'Quit smoking',
    sublabel: 'Current → former smoker',
    appliesTo: (p) => p.smoking === 'current',
    overrides: () => ({ smoking: 'former' }),
    // The line that proves the model is not naive. Say it out loud in the demo.
    note: 'Moves you to former smoker, not never — risk stays elevated for years after quitting, and the model reflects that.',
  },
  {
    id: 'meet-activity',
    label: 'Meet activity guideline',
    sublabel: '150 min/week',
    appliesTo: (p) => p.activityMinutes < WHO_ACTIVITY_TARGET,
    overrides: () => ({ activityMinutes: WHO_ACTIVITY_TARGET }),
    note: 'The WHO physical-activity guideline for adults is at least 150 minutes of moderate activity per week. Stated as the source of the 150 mark on the slider, not as advice.',
  },
  {
    id: 'lose-weight',
    label: 'Lose 6 kg',
    sublabel: 'Waist adjusts with it',
    appliesTo: (p) => p.weightKg - 6 >= 35,
    overrides: (p) => ({ weightKg: Math.max(35, p.weightKg - 6) }),
    note: 'Waist circumference is estimated to fall by about 0.8 cm per kg. It is scored separately from BMI, so it moves the diabetes result on its own.',
  },
];

/** Every preset at once — the 20-second fallback demo. */
export function allPresetOverrides(profile) {
  return PRESETS.reduce(
    (acc, preset) => ({ ...acc, ...preset.overrides(profile) }),
    {},
  );
}
