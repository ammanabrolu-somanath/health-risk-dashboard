import { useState } from 'react';
import { ANSWER_LABEL } from '../../data/history/questions.js';

/**
 * "Why was this flagged?" — the findings-side twin of the scoring drawer.
 *
 * Same promise as "How was this calculated?": the chain from what you answered,
 * through the rule that matched, to the source the rule cites. Everything shown
 * here comes off the findings engine's own output, so it cannot disagree with
 * the finding above it.
 *
 * The unverified marker is deliberately loud. A citation nobody has checked is
 * the one failure mode that survives code review — it looks exactly like a
 * correct one — so an unverified source announces itself on screen until
 * somebody turns it true in the rule table.
 */

function SourceBlock({ source }) {
  if (!source) return null;

  return (
    <div className="border-l-2 border-slate-200 pl-3">
      <p className="text-meta font-semibold text-slate-500">
        Source <span className="tnum text-slate-400">{source.key}</span>
      </p>
      <p className="mt-0.5 text-meta leading-relaxed text-slate-700">{source.org}</p>
      <p className="mt-0.5 text-meta leading-relaxed text-slate-500">{source.claim}</p>

      {source.verified ? (
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-meta font-semibold text-emerald-800">
          <span aria-hidden="true">✓</span> Source verified
        </p>
      ) : (
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-meta font-semibold text-slate-500">
          <span aria-hidden="true">○</span> Source pending verification
        </p>
      )}

      {!source.verified && source.candidateDocument && (
        <p className="mt-1 text-meta italic leading-relaxed text-slate-500">
          Candidate document: {source.candidateDocument}
        </p>
      )}
    </div>
  );
}

export function FindingProvenance({ finding }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-meta font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Why was this flagged?
        <span
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="inset mt-2 space-y-3 p-3">
          <div>
            <p className="mb-1 text-meta font-semibold text-slate-500">
              {finding.kind === 'combination'
                ? `Rule ${finding.label} — fires only when every answer below is "Yes"`
                : 'Rule — fires on a "Yes" to this question'}
            </p>
            <ul className="overflow-hidden rounded-md border border-slate-100">
              {finding.evidence.map((e) => (
                <li
                  key={e.questionId}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 bg-indigo-50 px-2 py-1.5 text-meta text-indigo-900"
                >
                  <span className="shrink-0" aria-hidden="true">
                    ▶
                  </span>
                  <span className="min-w-0 flex-1">{e.text}</span>
                  <span className="shrink-0 font-semibold">{ANSWER_LABEL[e.answer] ?? '—'}</span>
                  {e.note && <span className="shrink-0 italic">({e.note})</span>}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-meta text-slate-500">
              A &ldquo;Not sure&rdquo; or an unanswered question never fires a finding.
            </p>
          </div>

          <div>
            <p className="mb-0.5 text-meta font-semibold text-slate-500">Why this tier</p>
            <p className="text-meta leading-relaxed text-slate-600">{finding.rationale}</p>
          </div>

          {finding.supersedes.length > 0 && (
            <p className="text-meta leading-relaxed text-slate-500">
              Raised as one finding. On its own each of these answers would have been reported
              separately and at a lower priority — together they describe one picture, so they are
              listed once.
            </p>
          )}

          <SourceBlock source={finding.source} />
        </div>
      )}
    </div>
  );
}
