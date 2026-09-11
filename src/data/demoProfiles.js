/**
 * Demo personas. Every one of these people is fictional — no real patient data
 * appears anywhere in this project.
 *
 * The set is chosen so the three models visibly disagree with each other. If
 * every persona scored the same band across all three conditions, a judge would
 * reasonably suspect one underlying "health score" wearing three hats.
 *
 * PERSONA_HIGH_RISK is numerically frozen: the What-If demo arc is tuned to it.
 *   start          Diabetes High · Hypertension High · Cardiovascular High
 *   quit smoking   -> nothing moves on diabetes (the "no change" case, live)
 *   +150 min/week  -> cardiovascular crosses High -> Moderate
 *   +lose 6 kg     -> diabetes and hypertension both cross, and the diabetes
 *                     carry-over into cardiovascular switches off
 */

import { QUESTION_IDS } from './history/questions.js';

/**
 * Build a complete history from the exceptions.
 *
 * Every question a persona is not listed against is answered "no" — these
 * people have all sat through the whole questionnaire, so a blank would mean
 * "not asked", which is a different and less useful state to demo.
 */
function historyOf({ yes = {}, unsure = [] } = {}) {
  const answers = {};
  for (const id of QUESTION_IDS) answers[id] = 'no';
  for (const id of unsure) answers[id] = 'unsure';

  const notes = {};
  for (const [id, note] of Object.entries(yes)) {
    answers[id] = 'yes';
    if (note) notes[id] = note;
  }

  return { answers, notes };
}

export const PERSONA_STUDENT = {
  id: 'college-student',
  name: 'Healthy College Student',
  tagline: 'Active, never smoked',
  description:
    'Low across all three. Proves the dashboard is not simply printing "High" for everyone.',
  age: 20,
  sex: 'female',
  heightCm: 163,
  weightKg: 58,
  waistCm: 74,
  smoking: 'never',
  activityMinutes: 120,
  dietQuality: 'average',
  familyHistory: 'none',
  systolic: 112,
  diastolic: 70,
  onBpMedication: false,
  priorHighGlucose: false,
  /** Nothing fires. Exercises the "No findings identified" indicator. */
  history: historyOf(),
};

export const PERSONA_OFFICE = {
  id: 'office-worker',
  name: 'Busy Office Worker',
  tagline: 'Desk job, poor diet',
  description:
    'Moderate diabetes and blood-pressure risk but low cardiovascular risk — the three models do not move together.',
  age: 38,
  sex: 'male',
  heightCm: 176,
  weightKg: 88,
  waistCm: 97,
  smoking: 'never',
  activityMinutes: 45,
  dietQuality: 'poor',
  familyHistory: 'second',
  systolic: 128,
  diastolic: 84,
  onBpMedication: false,
  priorHighGlucose: false,
  /** One low-tier finding, plus a "not sure" that must NOT fire anything. */
  history: historyOf({
    yes: { 'cc-cholesterol': null },
    unsure: ['fh-cancer-early'],
  }),
};

export const PERSONA_HIGH_RISK = {
  id: 'high-risk-adult',
  name: 'High-Risk Adult',
  tagline: 'Current smoker, sedentary',
  description:
    'High on all three. This is the profile the what-if simulator is tuned for — every lever moves something.',
  age: 58,
  sex: 'male',
  heightCm: 172,
  weightKg: 89,
  waistCm: 103,
  smoking: 'current',
  activityMinutes: 20,
  dietQuality: 'average',
  familyHistory: 'first',
  systolic: 138,
  diastolic: 86,
  onBpMedication: false,
  priorHighGlucose: false,
  /**
   * Two low-tier findings and DELIBERATELY NO PRIOR EVENT.
   *
   * This is the profile the what-if arc is tuned to. A reported heart attack
   * would caveat the cardiovascular score, and the demo would end by telling
   * someone with established disease that their risk is now Moderate. The prior
   * event lives on the Senior Citizen instead, off the demo path.
   */
  history: historyOf({
    yes: {
      'cc-cholesterol': null,
      'cc-sleep-apnoea': null,
      'sh-surgery': 'Knee arthroscopy, 2018',
      'ma-daily-meds': 'Statin',
    },
  }),
};

export const PERSONA_SENIOR = {
  id: 'senior-citizen',
  name: 'Senior Citizen',
  tagline: 'Never smoked, prior high glucose',
  description:
    'Diabetes-dominant. Shows a high result driven by factors a lifestyle change cannot reach.',
  age: 68,
  sex: 'female',
  heightCm: 158,
  weightKg: 79,
  waistCm: 96,
  smoking: 'never',
  activityMinutes: 90,
  dietQuality: 'poor',
  familyHistory: 'first',
  systolic: 126,
  diastolic: 78,
  onBpMedication: false,
  priorHighGlucose: true,
  /**
   * The combination rule and the caveat, on one persona.
   *
   * Recurrent infections with changed eyesight fires C-3 as a single
   * "discuss promptly" finding — a pattern associated with unrecognised high
   * blood glucose, which none of the three scoring models can see. Her prior
   * stroke simultaneously caveats the cardiovascular score.
   */
  history: historyOf({
    yes: {
      'mh-stroke': '2019',
      'inf-recurrent': null,
      'sx-vision': null,
      'ma-daily-meds': 'Blood thinner',
    },
    unsure: ['fh-kidney'],
  }),
};

/** Display order: ascending overall risk, so the strip reads left to right. */
export const PERSONAS = [
  PERSONA_STUDENT,
  PERSONA_OFFICE,
  PERSONA_HIGH_RISK,
  PERSONA_SENIOR,
];

/** The app opens on the persona the what-if demo arc is tuned for. */
export const DEFAULT_PROFILE = PERSONA_HIGH_RISK;
