import { ANSWER_LABEL } from '../../data/history/questions.js';

/**
 * "Outside the intended population."
 *
 * Not a finding and not a tier. A reported prior heart attack or stroke does
 * not need discussing — it is established history, and what it changes is
 * whether the instrument applies at all. The non-laboratory Framingham model
 * estimates the risk of a FIRST event; for someone who has had one, the number
 * is still arithmetically correct and no longer means what it means for
 * everybody else.
 *
 * Renders in three places, deliberately: on the card where the number is, in
 * the export, and in full inside the condition's existing provenance drawer
 * beside the source and adaptation notes. The score is never shown without it.
 */

/** Compact form, for the risk card. */
export function CaveatBadge({ caveat }) {
  if (!caveat) return null;

  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-meta leading-relaxed text-amber-900">
      <span aria-hidden="true">⚠</span>
      <span>{caveat.short}</span>
    </p>
  );
}

/** Full form, for inside the provenance drawer. */
export function CaveatDetail({ caveat }) {
  if (!caveat) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="flex items-center gap-1.5 text-meta font-semibold text-amber-900">
        <span aria-hidden="true">⚠</span> Outside this instrument&rsquo;s intended population
      </p>

      <p className="mt-1 text-meta leading-relaxed text-amber-900">{caveat.long}</p>

      <ul className="mt-2 space-y-0.5 border-t border-amber-200 pt-2">
        {caveat.evidence.map((e) => (
          <li key={e.questionId} className="flex flex-wrap items-baseline gap-x-2 text-meta text-amber-900">
            <span className="min-w-0 flex-1">{e.text}</span>
            <span className="shrink-0 font-semibold">{ANSWER_LABEL[e.answer] ?? '—'}</span>
            {e.note && <span className="shrink-0 italic">({e.note})</span>}
          </li>
        ))}
      </ul>

      {caveat.source && (
        <p className="mt-2 text-meta leading-relaxed text-amber-800">
          <span className="font-semibold">Source {caveat.source.key}</span> · {caveat.source.org}
          {!caveat.source.verified && ' · pending verification'}
        </p>
      )}
    </div>
  );
}
