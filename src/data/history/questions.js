/**
 * The health-history question schedule.
 *
 * PURE CONTENT. These objects carry wording, grouping and input affordances —
 * nothing about tiers, findings or sources. That lives in
 * `src/data/rules/flags.rules.json`, for the same reason the point tables live
 * in JSON: the rules should be openable and readable on their own.
 *
 * Two invariants worth keeping:
 *
 * 1. NOTHING HERE IS SCORED. `scoreAll()` never reads a history answer. Adding
 *    a question cannot move a risk index, which is what makes the frozen demo
 *    arc and the 525 scoring assertions safe from this whole feature.
 *
 * 2. NO QUESTION DUPLICATES A SCORED FIELD. Smoking, activity, diet, weight,
 *    blood pressure, BP medication, prior high glucose and the shared
 *    `familyHistory` field are all scored inputs — the schedule stays out of
 *    them, and where a topic would overlap the wording excludes it explicitly
 *    (see `ma-daily-meds`) or the section shows the scored field read-only
 *    instead (see `contextField`).
 */

/** The three answer states. `unsure` is a real answer, never a silent `no`. */
export const ANSWERS = ['yes', 'no', 'unsure'];

export const ANSWER_LABEL = { yes: 'Yes', no: 'No', unsure: 'Not sure' };

/** Free-text notes are documentation only — no rule ever reads one. */
export const NOTE_MAX = 120;

/**
 * Shown at the head of the questionnaire, always.
 *
 * This states what the tool is FOR, which the app is entitled to say. It is
 * deliberately not advice about what to do, which it is not. Every symptom
 * question asks about a pattern over a window rather than an event happening
 * now, and this line is the backstop for the person who answers "yes" while it
 * is happening.
 */
export const SCOPE_NOTE =
  'This questionnaire asks about your health history. It is not for symptoms you are having right now — if something is happening now and it worries you, contact a clinician or your local emergency number.';

export const SECTIONS = [
  {
    id: 'medical',
    number: 1,
    label: 'Medical history',
    note: 'Permanent facts, so these ask about your lifetime rather than a recent window.',
  },
  {
    id: 'family',
    number: 2,
    label: 'Family history',
    note: 'Diabetes, high blood pressure and heart disease are already recorded in your health data and are not repeated here.',
    contextField: 'familyHistory',
  },
  {
    id: 'symptoms',
    number: 3,
    label: 'Symptoms and warning signs',
    note: 'These ask about patterns over a period of time, not about how you feel at this moment.',
  },
  {
    id: 'chronic',
    number: 4,
    label: 'Chronic conditions',
    note: 'Conditions a doctor has told you about, whether or not you are being treated for them now.',
  },
  {
    id: 'medications',
    number: 5,
    label: 'Medications and allergies',
    note: 'Blood-pressure medication is already recorded in your health data, so it is excluded below.',
    contextField: 'onBpMedication',
  },
  {
    id: 'surgery',
    number: 6,
    label: 'Surgery and hospital care',
    note: null,
  },
  {
    id: 'infections',
    number: 7,
    label: 'Infections',
    note: null,
  },
  {
    id: 'lifestyle',
    number: 8,
    label: 'Lifestyle',
    note: 'Smoking, physical activity, diet and weight are already recorded in your health data and adjustable in the simulator, so only alcohol is asked here.',
  },
];

/**
 * The 23 questions, in schedule order.
 *
 * `window` is the timeframe, written into the question text rather than asked
 * as a second control — so one answer is unambiguous about what it covers.
 * `note` is the optional free-text hint offered when the answer is "yes".
 */
export const QUESTIONS = [
  // -------------------------------------------------- 1. Medical history
  {
    id: 'mh-heart-attack',
    section: 'medical',
    text: 'Have you ever been told by a doctor that you have had a heart attack?',
    window: 'Lifetime',
    note: 'Year, if you remember',
  },
  {
    id: 'mh-stroke',
    section: 'medical',
    text: 'Have you ever been told by a doctor that you have had a stroke or a mini-stroke (TIA)?',
    window: 'Lifetime',
    note: 'Year, if you remember',
  },
  {
    id: 'mh-cancer',
    section: 'medical',
    text: 'Have you ever been diagnosed with cancer?',
    window: 'Lifetime',
    note: 'Type and year',
  },
  {
    id: 'mh-clot',
    section: 'medical',
    text: 'Have you ever had a blood clot in your leg or your lung?',
    window: 'Lifetime',
    note: 'Year, if you remember',
  },

  // --------------------------------------------------- 2. Family history
  {
    id: 'fh-stroke',
    section: 'family',
    text: 'Has a parent, brother or sister had a stroke?',
    window: 'Lifetime',
    note: null,
  },
  {
    id: 'fh-cancer-early',
    section: 'family',
    text: 'Has a parent, brother or sister been diagnosed with cancer before the age of 50?',
    window: 'Lifetime',
    note: 'Which relative, and what type',
  },
  {
    id: 'fh-kidney',
    section: 'family',
    text: 'Has a parent, brother or sister had kidney disease needing dialysis or a transplant?',
    window: 'Lifetime',
    note: null,
  },

  // ------------------------------------------ 3. Symptoms and warning signs
  {
    id: 'sx-chest-discomfort',
    section: 'symptoms',
    text: 'In the last 3 months, have you had chest pain, pressure or tightness — either during activity or at rest?',
    window: 'Last 3 months',
    note: null,
  },
  {
    id: 'sx-breathless',
    section: 'symptoms',
    text: 'In the last 3 months, have you become short of breath doing things that did not used to leave you breathless?',
    window: 'Last 3 months',
    note: null,
  },
  {
    id: 'sx-weight-loss',
    section: 'symptoms',
    text: 'In the last 6 months, have you lost 5 kg or more without trying to?',
    window: 'Last 6 months',
    note: null,
  },
  {
    id: 'sx-fatigue',
    section: 'symptoms',
    text: 'In the last 3 months, have you had unusual tiredness lasting more than two weeks at a time?',
    window: 'Last 3 months',
    note: null,
  },
  {
    id: 'sx-vision',
    section: 'symptoms',
    text: 'In the last 3 months, has your eyesight become blurred or changed noticeably?',
    window: 'Last 3 months',
    note: null,
  },
  {
    id: 'sx-neuro-episodes',
    section: 'symptoms',
    text: 'In the last 3 months, have you had episodes of numbness or weakness on one side of your body, or sudden difficulty finding words?',
    window: 'Last 3 months',
    note: 'How many times',
  },

  // ----------------------------------------------- 4. Chronic conditions
  {
    id: 'cc-cholesterol',
    section: 'chronic',
    text: 'Have you ever been told by a doctor that your cholesterol is high?',
    window: 'Lifetime',
    note: null,
  },
  {
    id: 'cc-kidney',
    section: 'chronic',
    text: 'Have you ever been told you have kidney disease or reduced kidney function?',
    window: 'Lifetime',
    note: null,
  },
  {
    id: 'cc-sleep-apnoea',
    section: 'chronic',
    text: 'Have you ever been told you have sleep apnoea, or been told that you stop breathing while asleep?',
    window: 'Lifetime',
    note: null,
  },

  // ------------------------------------------ 5. Medications and allergies
  {
    id: 'ma-anaphylaxis',
    section: 'medications',
    text: 'Have you ever had a severe allergic reaction that needed emergency treatment?',
    window: 'Lifetime',
    note: 'What triggered it',
  },
  {
    id: 'ma-drug-allergy',
    section: 'medications',
    text: 'Do you have a known allergy or bad reaction to any medicine?',
    window: 'Lifetime',
    note: 'Which medicine',
  },
  {
    id: 'ma-daily-meds',
    section: 'medications',
    text: 'Other than blood-pressure medication, do you take any prescription medicine every day?',
    window: 'Current',
    note: 'What it is for',
  },

  // ------------------------------------------ 6. Surgery and hospital care
  {
    id: 'sh-surgery',
    section: 'surgery',
    text: 'Have you had any surgery in the last 10 years?',
    window: 'Last 10 years',
    note: 'What, and roughly when',
  },
  {
    id: 'sh-hospital',
    section: 'surgery',
    text: 'In the last 5 years, have you stayed overnight in hospital for anything other than planned surgery or childbirth?',
    window: 'Last 5 years',
    note: 'Reason',
  },

  // ---------------------------------------------------- 7. Infections
  {
    id: 'inf-recurrent',
    section: 'infections',
    text: 'In the last 12 months, have you needed antibiotics three or more times?',
    window: 'Last 12 months',
    note: null,
  },

  // ---------------------------------------------------- 8. Lifestyle
  {
    id: 'ls-alcohol',
    section: 'lifestyle',
    text: 'In a typical week, do you drink more than 14 units of alcohol — roughly six pints of beer or six medium glasses of wine?',
    window: 'Typical week',
    note: null,
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function questionById(id) {
  return BY_ID.get(id) ?? null;
}

export function questionsInSection(sectionId) {
  return QUESTIONS.filter((q) => q.section === sectionId);
}

/** Display number in the schedule, 1-based. Used by the form and the PDF. */
export function questionNumber(id) {
  const i = QUESTION_IDS.indexOf(id);
  return i === -1 ? null : i + 1;
}
