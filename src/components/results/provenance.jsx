import { BAND_STYLE } from '../../lib/format.js';

/**
 * Where this score sits against the instrument's own cut-points.
 *
 * Segment widths are proportional to the real point ranges, so a threshold that
 * sits high in the scale looks high. The three conditions deliberately have
 * different cut-points — this is what makes that visible rather than confusing.
 */
export function ThresholdScale({ thresholds, max, raw, band }) {
  const segments = [
    { key: 'low', from: 0, to: thresholds.moderate - 1 },
    { key: 'moderate', from: thresholds.moderate, to: thresholds.high - 1 },
    { key: 'high', from: thresholds.high, to: max },
  ];

  const markerPct = max > 0 ? Math.min(100, Math.max(0, (raw / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-meta font-semibold text-slate-500">Band thresholds</p>
        <p className="text-meta text-slate-500 tnum">
          raw score {raw} of {max}
        </p>
      </div>

      <div className="flex h-11 w-full overflow-hidden rounded-lg border border-slate-200">
        {segments.map((seg) => {
          const style = BAND_STYLE[seg.key];
          const width = max > 0 ? ((seg.to - seg.from + 1) / (max + 1)) * 100 : 33;
          const isCurrent = seg.key === band;
          return (
            <div
              key={seg.key}
              style={{ width: `${width}%` }}
              className={`flex flex-col items-center justify-center gap-px border-r border-white/60 px-1 text-meta leading-tight last:border-r-0 ${
                isCurrent ? `${style.bar} text-white` : `${style.bg} ${style.text}`
              }`}
            >
              <span className="font-semibold">{style.label}</span>
              <span className="tnum opacity-80">
                {seg.from}–{seg.to}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-1 h-4">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap text-meta font-semibold text-slate-700 tnum"
          style={{ left: `${markerPct}%` }}
        >
          ▲ {raw}
        </span>
      </div>
    </div>
  );
}

/**
 * The rule rows themselves.
 *
 * Every row the factor could have matched, with the one that fired ticked. The
 * rows come straight off the scoring engine (`contribution.rule`), so this
 * component computes nothing — it cannot disagree with the score above it.
 */
export function RuleRowTable({ contributions }) {
  return (
    <div className="space-y-3">
      {contributions.map((c) => (
        <div key={c.factorId}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="text-meta font-semibold text-slate-700">{c.label}</p>
            <p className="text-meta text-slate-500 tnum">your value: {c.displayValue}</p>
          </div>

          {c.rule.reference && (
            <p className="text-meta italic text-slate-500">
              using the {c.rule.reference} reference table
            </p>
          )}

          <ul className="mt-1 overflow-hidden rounded-md border border-slate-100">
            {c.rule.rows.map((row, i) => (
              <li
                key={`${c.factorId}-${i}`}
                className={`flex items-center gap-2 px-2 py-1 text-meta ${
                  row.active
                    ? 'bg-indigo-50 font-semibold text-indigo-900'
                    : 'text-slate-500 odd:bg-slate-50/60'
                }`}
              >
                <span className="w-3 shrink-0 text-center" aria-hidden="true">
                  {row.active ? '▶' : ''}
                </span>
                <span className="min-w-0 flex-1">{row.label}</span>
                <span className="shrink-0 tnum">{row.points} pts</span>
                <span className="w-3 shrink-0 text-center" aria-hidden="true">
                  {row.active ? '✓' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
