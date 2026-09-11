import {
  ANSWER_LABEL,
  NOTE_MAX,
  QUESTIONS,
  SCOPE_NOTE,
  SECTIONS,
  questionNumber,
  questionsInSection,
} from '../../data/history/questions.js';
import { getAnswer, getNote, withAnswer, withNote } from '../../lib/history/answers.js';
import { labelForValue } from '../../data/factors.js';

/**
 * The health-history questionnaire.
 *
 * Like HealthForm, every change writes straight through to the profile — no
 * submit button. Unlike HealthForm, nothing here moves a risk score, so the
 * only thing recalculating above is the findings panel.
 *
 * Every question is optional. Leaving one blank is a real state and is counted
 * as such; it is never silently read as "no".
 */

const ANSWER_STYLE = {
  yes: 'bg-white text-slate-900 shadow-sm',
  no: 'bg-white text-slate-900 shadow-sm',
  unsure: 'bg-white text-slate-900 shadow-sm',
};

function AnswerControl({ question, value, onPick }) {
  return (
    <div
      role="radiogroup"
      aria-label={question.text}
      className="grid w-full max-w-xs grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
    >
      {['yes', 'no', 'unsure'].map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(active ? null : opt)}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
              active ? ANSWER_STYLE[opt] : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {ANSWER_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}

function Question({ question, history, onAnswer, onNote }) {
  const value = getAnswer(history, question.id);
  const note = getNote(history, question.id);
  const noteId = `history-note-${question.id}`;
  const showNote = question.note && value === 'yes';

  return (
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-body leading-snug text-slate-900">
            <span className="mr-2 text-meta text-slate-400 tnum">
              {questionNumber(question.id)}
            </span>
            {question.text}
          </p>
          <p className="mt-1 text-meta text-slate-500">{question.window}</p>
        </div>

        <div className="shrink-0">
          <AnswerControl
            question={question}
            value={value}
            onPick={(v) => onAnswer(question.id, v)}
          />
        </div>
      </div>

      {showNote && (
        <div className="mt-3 sm:max-w-md">
          <label className="label mb-1.5" htmlFor={noteId}>
            {question.note} <span className="font-normal text-slate-400">— optional</span>
          </label>
          <input
            id={noteId}
            type="text"
            className="field"
            value={note}
            maxLength={NOTE_MAX}
            placeholder={question.note}
            onChange={(e) => onNote(question.id, e.target.value)}
          />
          <p className="mt-1 text-meta text-slate-400 tnum">
            {note.length}/{NOTE_MAX}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The scored fields a section deliberately does not re-ask, shown read-only.
 *
 * Without this the questionnaire looks like it forgot to ask about family
 * history or blood-pressure medication. With it, the reason those are missing
 * is visible: they are already recorded, once, somewhere else.
 */
function ContextField({ fieldId, profile }) {
  const LABEL = {
    familyHistory: 'Family history of diabetes, high BP or heart disease',
    onBpMedication: 'Currently taking blood-pressure medication',
  };

  return (
    <div className="inset mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0">
        <p className="text-meta font-semibold text-slate-500">{LABEL[fieldId] ?? fieldId}</p>
        <p className="text-meta text-slate-500">
          Already recorded in your health data — not re-asked here
        </p>
      </div>
      <p className="text-body font-semibold text-slate-900">
        {labelForValue(fieldId, profile[fieldId])}
      </p>
    </div>
  );
}

export function HistoryForm({ profile, onChange }) {
  const history = profile.history;

  const handleAnswer = (id, value) =>
    onChange({ ...profile, history: withAnswer(history, id, value) });

  const handleNote = (id, text) =>
    onChange({ ...profile, history: withNote(history, id, text) });

  return (
    <div>
      {/* Scope, stated once and always. Not a tier, and not advice about what to
          do — a statement about what this questionnaire is for. */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-meta leading-relaxed text-amber-900">{SCOPE_NOTE}</p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-meta text-slate-400 tnum">§{section.number}</span>
              <h3 className="h-card">{section.label}</h3>
              <span className="text-meta text-slate-400">
                {questionsInSection(section.id).length}
              </span>
            </div>

            {section.note && (
              <p className="mb-3 text-meta leading-relaxed text-slate-500">{section.note}</p>
            )}

            {section.contextField && (
              <ContextField fieldId={section.contextField} profile={profile} />
            )}

            <div className="card px-4 py-2 sm:px-5">
              {questionsInSection(section.id).map((q) => (
                <Question
                  key={q.id}
                  question={q}
                  history={history}
                  onAnswer={handleAnswer}
                  onNote={handleNote}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Every question is optional. Tap a selected answer again to clear it. Nothing you answer
        here changes a risk score — these answers are recorded, summarised and exported, and some
        of them raise findings to discuss with a clinician.
      </p>
    </div>
  );
}

/** Exported for the smoke test, which renders the form against every persona. */
export const HISTORY_QUESTION_COUNT = QUESTIONS.length;
