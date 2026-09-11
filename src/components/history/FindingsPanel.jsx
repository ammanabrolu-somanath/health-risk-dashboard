import { ANSWER_LABEL } from '../../data/history/questions.js';

/**
 * Findings: the banner, the panel, and the empty-state line.
 *
 * The second signal on the dashboard. A risk index and a finding answer
 * different questions about the same person, and the layout says so — findings
 * get their own panel rather than being folded into the risk cards, and the
 * copy never ranks one against the other.
 *
 * TIERS ARE CONVERSATION PRIORITY, NOT CARE URGENCY. "Discuss promptly" is the
 * strongest thing this application says. It does not tell anyone to seek urgent
 * care, because it is a screening-level educational tool and saying so would be
 * triage. The standing scope line at the head of the questionnaire is what
 * covers the person whose symptom is happening right now.
 */

export const TIER_STYLE = {
  promptly: {
    dot: 'bg-rose-500',
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
    rail: 'border-l-rose-400',
  },
  soon: {
    dot: 'bg-amber-500',
    chip: 'border-amber-200 bg-amber-50 text-amber-900',
    rail: 'border-l-amber-400',
  },
  mention: {
    dot: 'bg-slate-400',
    chip: 'border-slate-200 bg-slate-100 text-slate-700',
    rail: 'border-l-slate-300',
  },
};

const FINDINGS_ANCHOR = 'findings-panel';

/**
 * Shown only when something fired.
 *
 * Zero footprint on a clean profile — which is most of the reason the
 * questionnaire could stay collapsed below the results without burying
 * anything that matters.
 */
export function FindingsBanner({ result }) {
  if (result.counts.total === 0) return null;

  const style = TIER_STYLE[result.topTier];
  const n = result.counts.total;

  const jump = () => {
    if (typeof document === 'undefined') return;
    document.getElementById(FINDINGS_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`card flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 px-4 py-3 ${style.rail}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-slate-900">
          {n} {n === 1 ? 'finding' : 'findings'} from your health history
        </p>
        <p className="text-meta text-slate-500">
          {[
            result.counts.promptly && `${result.counts.promptly} to discuss promptly`,
            result.counts.soon && `${result.counts.soon} to discuss soon`,
            result.counts.mention && `${result.counts.mention} worth mentioning`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <button type="button" onClick={jump} className="btn-ghost !px-3 !py-1.5 !text-xs">
        View findings
      </button>
    </div>
  );
}

/**
 * The compact "nothing fired" line.
 *
 * Distinct from "nothing was asked" on purpose: a clinician reading a summary
 * needs to tell a denial from a blank, which is the same reason the
 * questionnaire has a third answer state.
 */
export function NoFindingsLine({ result, completeness }) {
  if (result.counts.total > 0) return null;
  if (completeness.answered === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
      <p className="text-meta font-semibold text-slate-700">No findings identified</p>
      <p className="text-meta text-slate-500">
        from {completeness.answered} answered {completeness.answered === 1 ? 'question' : 'questions'}
        {completeness.unsure > 0 && ` · ${completeness.unsure} not sure`}
        {completeness.unanswered > 0 && ` · ${completeness.unanswered} unanswered`}
      </p>
    </div>
  );
}

/** One evidence row — the answer that put this finding on the page. */
export function EvidenceRow({ item }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="min-w-0 flex-1 text-meta text-slate-600">{item.text}</span>
      <span className="shrink-0 text-meta font-semibold text-slate-900">
        {ANSWER_LABEL[item.answer] ?? '—'}
      </span>
      {item.note && <span className="shrink-0 text-meta italic text-slate-500">({item.note})</span>}
    </li>
  );
}

export function Finding({ finding, children }) {
  const style = TIER_STYLE[finding.tier];

  return (
    <div className={`border-l-4 bg-white px-4 py-3 ${style.rail}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 text-meta font-semibold ${style.chip}`}>
          {finding.tierLabel}
        </span>
        {finding.kind === 'combination' && (
          <span className="text-meta font-semibold text-slate-500 tnum">
            {finding.label} · combination
          </span>
        )}
      </div>

      <p className="text-body font-semibold leading-snug text-slate-900">{finding.summary}</p>

      <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
        {finding.evidence.map((e) => (
          <EvidenceRow key={e.questionId} item={e} />
        ))}
      </ul>

      {children}
    </div>
  );
}

export function FindingsPanel({ result, children }) {
  if (result.counts.total === 0) return null;

  return (
    <section id={FINDINGS_ANCHOR} className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-5 py-3">
        <h2 className="h-card">Findings from your health history</h2>
        <p className="text-meta text-slate-500">
          Conversation priorities — not a diagnosis, and not a measure of urgency
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {result.findings.map((f) => (
          <Finding key={f.id} finding={f}>
            {children ? children(f) : null}
          </Finding>
        ))}
      </div>

      <p className="border-t border-slate-100 px-5 py-3 text-meta leading-relaxed text-slate-500">
        These findings come from what you reported, not from your risk scores. The three risk
        models ask nothing about symptoms, so a finding can appear beside a Low score — and often
        that is the point.
      </p>
    </section>
  );
}
