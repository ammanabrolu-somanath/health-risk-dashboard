import { useState } from 'react';
import { BAND_STYLE } from '../../lib/format.js';
import { RiskBadge } from './badges.jsx';
import { ThresholdScale, RuleRowTable } from './provenance.jsx';

/**
 * The full point breakdown for one condition — every row that produced the score,
 * with its source cited. This is the "explain the major contributing factors"
 * requirement, and it is also the proof that nothing here is a black box.
 */
function FactorRow({ contribution, isTop }) {
  const { label, displayValue, valueLabel, points, maxPoints, note } = contribution;
  const share = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  const tone = points === 0 ? 'text-slate-500' : points >= maxPoints ? 'text-rose-600' : 'text-amber-600';

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-body text-slate-700">{label}</span>
          {isTop && points > 0 && (
            <span className="shrink-0 rounded border border-slate-300 px-1.5 py-px text-meta font-semibold text-slate-600">
              Top factor
            </span>
          )}
        </div>
        <p className="text-meta text-slate-500">
          {displayValue}
          {valueLabel && valueLabel !== displayValue ? ` · ${valueLabel}` : ''}
        </p>
        {note && <p className="mt-1 text-meta italic text-slate-500">{note}</p>}
      </div>

      <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 sm:w-16">
        <div
          className={`h-full rounded-full ${points === 0 ? 'bg-slate-200' : 'bg-slate-700'}`}
          style={{ width: `${Math.max(share, points === 0 ? 0 : 6)}%` }}
        />
      </div>

      <span className={`w-11 shrink-0 text-right text-body font-semibold tnum ${tone}`}>
        {points}/{maxPoints}
      </span>
    </li>
  );
}

export function ContributingFactors({ result, initialProvenanceOpen = false }) {
  const [open, setOpen] = useState(false);
  // `initialProvenanceOpen` lets the SSR smoke test render the expanded tree.
  const [provenanceOpen, setProvenanceOpen] = useState(initialProvenanceOpen);
  const style = BAND_STYLE[result.band];

  const sorted = [...result.contributions].sort((a, b) => b.points - a.points);
  const topPoints = sorted[0]?.points ?? 0;
  const visible = open ? sorted : sorted.filter((c) => c.points > 0);
  const hiddenCount = sorted.length - visible.length;

  return (
    <section className="card p-6">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="h-card">{result.label}</h3>
          <p className="mt-1 text-meta text-slate-500 tnum">
            {result.raw} of {result.max} points
          </p>
        </div>
        <RiskBadge band={result.band} size="sm" />
      </header>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-meta text-emerald-700">
          No scoring factor contributed points for this condition.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((c) => (
            <FactorRow
              key={c.factorId}
              contribution={c}
              isTop={c.points === topPoints && topPoints > 0}
            />
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 text-meta font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Show {hiddenCount} factor{hiddenCount === 1 ? '' : 's'} scoring zero
        </button>
      )}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 text-meta font-semibold text-slate-500 hover:text-slate-700"
        >
          Hide zero-point factors
        </button>
      )}

      {/* Data provenance. Everything below comes off the scoring engine's own
          output — nothing here recalculates anything. */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setProvenanceOpen((v) => !v)}
          aria-expanded={provenanceOpen}
          className="flex w-full items-center justify-between gap-2 text-meta font-semibold text-indigo-600 hover:text-indigo-700"
        >
          How was this calculated?
          <span
            className={`text-slate-500 transition-transform ${provenanceOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {provenanceOpen && (
          <div className="inset mt-3 space-y-4 p-4">
            <ThresholdScale
              thresholds={result.thresholds}
              max={result.max}
              raw={result.raw}
              band={result.band}
            />

            <div>
              <p className="mb-2 text-meta font-semibold text-slate-500">
                Rule rows — the row that fired is ticked
              </p>
              <RuleRowTable contributions={result.contributions} />
            </div>
          </div>
        )}
      </div>

      <footer className="mt-4 border-l-2 border-slate-200 pl-3">
        <p className="flex items-center gap-1.5 text-meta font-semibold text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
          Source
        </p>
        <p className="mt-1 text-meta leading-relaxed text-slate-600">{result.source}</p>
        <p className="mt-1.5 text-meta leading-relaxed text-slate-500">{result.adaptation}</p>
      </footer>
    </section>
  );
}
