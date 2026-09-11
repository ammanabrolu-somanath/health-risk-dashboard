import { QUESTIONS, QUESTION_IDS, NOTE_MAX } from '../../data/history/questions.js';

/**
 * Reading and writing health-history answers.
 *
 * The shape lives nested on the profile:
 *
 *   profile.history = { answers: { [questionId]: 'yes'|'no'|'unsure' },
 *                       notes:   { [questionId]: string } }
 *
 * One object is one person, so switching persona swaps the history along with
 * everything else and there is no way for one fictional person's stroke to
 * follow another around. `handleLoadProfile` needs no new code for that.
 *
 * Everything here is PURE — same input, same output, no mutation — for the same
 * reason the scoring engine is: the findings engine is just a function of this
 * data, and a stale copy can never disagree with a fresh one.
 *
 * ABSENT MEANS UNANSWERED. A missing key is not a 'no'. That distinction is the
 * whole reason the third answer state exists, so nothing here may quietly
 * default one to the other.
 */

export const EMPTY_HISTORY = { answers: {}, notes: {} };

/** Tolerate a profile that predates this feature, or a hand-written one. */
export function normalizeHistory(history) {
  if (!history || typeof history !== 'object') return { answers: {}, notes: {} };
  return {
    answers: history.answers && typeof history.answers === 'object' ? history.answers : {},
    notes: history.notes && typeof history.notes === 'object' ? history.notes : {},
  };
}

/** @returns {'yes'|'no'|'unsure'|null} null when the question was never answered. */
export function getAnswer(history, questionId) {
  const { answers } = normalizeHistory(history);
  const v = answers[questionId];
  return v === 'yes' || v === 'no' || v === 'unsure' ? v : null;
}

export function getNote(history, questionId) {
  const { notes } = normalizeHistory(history);
  const v = notes[questionId];
  return typeof v === 'string' ? v : '';
}

/**
 * Set one answer.
 *
 * Notes are offered on "yes" only, so moving away from "yes" drops the note
 * rather than leaving an orphaned detail attached to a "no" — which would print
 * in the PDF as a denial with supporting evidence.
 */
export function withAnswer(history, questionId, value) {
  const { answers, notes } = normalizeHistory(history);
  const nextAnswers = { ...answers };
  const nextNotes = { ...notes };

  if (value === null) delete nextAnswers[questionId];
  else nextAnswers[questionId] = value;

  if (value !== 'yes') delete nextNotes[questionId];

  return { answers: nextAnswers, notes: nextNotes };
}

/** Set one free-text note. Truncated rather than rejected, so typing never blocks. */
export function withNote(history, questionId, text) {
  const { answers, notes } = normalizeHistory(history);
  const nextNotes = { ...notes };
  const trimmed = String(text ?? '').slice(0, NOTE_MAX);

  if (trimmed === '') delete nextNotes[questionId];
  else nextNotes[questionId] = trimmed;

  return { answers, notes: nextNotes };
}

/**
 * Four counts, tracked separately.
 *
 * "Not sure" is answered — the person engaged with the question — but it is not
 * information, so it is never folded into either of the definite counts. A
 * clinician reading the export can tell "asked and unsure" from "never asked".
 */
export function completenessOf(history) {
  const counts = { yes: 0, no: 0, unsure: 0, unanswered: 0, total: QUESTIONS.length };

  for (const id of QUESTION_IDS) {
    const a = getAnswer(history, id);
    if (a === null) counts.unanswered += 1;
    else counts[a] += 1;
  }

  counts.answered = counts.yes + counts.no + counts.unsure;
  return counts;
}

/** Questions answered "yes", in schedule order, with their notes. */
export function positiveAnswers(history) {
  return QUESTIONS.filter((q) => getAnswer(history, q.id) === 'yes').map((q) => ({
    id: q.id,
    text: q.text,
    section: q.section,
    window: q.window,
    note: getNote(history, q.id),
  }));
}

/** Questions answered "not sure", in schedule order. */
export function uncertainAnswers(history) {
  return QUESTIONS.filter((q) => getAnswer(history, q.id) === 'unsure').map((q) => ({
    id: q.id,
    text: q.text,
    section: q.section,
  }));
}

/** True when nothing at all has been recorded — drives the form's empty state. */
export function isHistoryEmpty(history) {
  return completenessOf(history).answered === 0;
}
