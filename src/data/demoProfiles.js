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
