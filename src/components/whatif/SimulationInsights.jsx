import { BAND_STYLE, signed, pluralPoints } from '../../lib/format.js';

/**
 * The headline. Prefers a band crossing over a bigger bare number, because
 * "High → Moderate" is the more meaningful result to lead with.
 */
export function BiggestWinCallout({ summary }) {
  if (!summary.biggestWin) {
    return (
      <div className="card p-6">
        <p className="text-body text-slate-500">
          No improvement yet — adjust a lever to see what moves.
        </p>
      </div>
    );
  }

  const w = summary.biggestWin;
  const to = BAND_STYLE[w.bandTo];

  return (
    <div className="card-raised animate-fade-up border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
      <p className="text-meta font-semibold text-emerald-700">Biggest impact</p>
      <p className="mt-1 text-section font-semibold text-slate-900">
        {w.label}{' '}
        <span className="tnum text-emerald-600">{signed(w.deltaIndex)} points</span>
      </p>
      <p className="mt-1 text-body text-slate-600">
        {w.bandChanged ? (
          <>
            Moves from{' '}
            <span className={`font-semibold ${BAND_STYLE[w.bandFrom].text}`}>
              {BAND_STYLE[w.bandFrom].label}
            </span>{' '}
            to <span className={`font-semibold ${to.text}`}>{to.label}</span>.
          </>
        ) : (
          <>
            Still {to.label} — {pluralPoints(w.distance.points)} from{' '}
            {BAND_STYLE[w.distance.target].label}.
          </>
        )}
      </p>
      {summary.bandsCrossed > 1 && (
        <p className="mt-2 text-meta text-slate-500">
          {summary.bandsCrossed} of 3 conditions changed category.
        </p>
      )}
    </div>
  );
}

/**
 * "What changed" — the attribution table.
 *
 * These numbers are not an approximation of feature importance. Both sides came
 * out of the same point tables, so the difference IS the arithmetic.
 */
export function FactorDeltaList({ summary }) {
  const withChanges = summary.list.filter((c) => c.factorDeltas.length > 0);

  if (withChanges.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="h-card">What changed</h3>
        <p className="mt-2 text-body text-slate-500">
          Nothing yet. Apply a scenario or move a lever.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="h-card">What changed</h3>
        <span className="text-meta text-slate-500">exact rule arithmetic</span>
      </div>
      <p className="mb-4 text-meta leading-relaxed text-slate-500">
        Every row below is a rule from the scoring table, with the points it awarded before and
        after your change.
      </p>

      <div className="space-y-5">
        {withChanges.map((condition) => (
          <div key={condition.id}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h4 className="text-meta font-semibold text-slate-500">{condition.short}</h4>
              <span
                className={`text-meta font-bold tnum ${
                  condition.deltaRaw < 0
                    ? 'text-emerald-600'
                    : condition.deltaRaw > 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                }`}
              >
                {signed(condition.deltaRaw)} pts
              </span>
            </div>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {condition.factorDeltas.map((d) => (
                <li key={d.factorId} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-slate-700">{d.label}</p>
                    <p className="text-meta text-slate-500">
                      {d.displayBefore} <span aria-hidden="true">→</span> {d.displayAfter}
                    </p>
                  </div>
                  <span className="shrink-0 text-meta text-slate-500 tnum">
                    {d.pointsBefore} <span aria-hidden="true">→</span> {d.pointsAfter}
                  </span>
                  <span
                    className={`w-9 shrink-0 text-right text-body font-bold tnum ${
                      d.change < 0
                        ? 'text-emerald-600'
                        : d.change > 0
                          ? 'text-rose-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {d.change === 0 ? '—' : signed(d.change)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Surfaces the cross-condition coupling when it fires. */}
            {condition.factorDeltas
              .filter((d) => d.note && d.change !== 0)
              .map((d) => (
                <p key={d.factorId} className="mt-2 text-meta italic leading-relaxed text-slate-500">
                  {d.note}
                </p>
              ))}
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-meta leading-relaxed text-slate-500">
        Modelled instantly. A real-world change of this kind takes months to years, and the
        estimate remains screening-level.
      </p>
    </div>
  );
}
