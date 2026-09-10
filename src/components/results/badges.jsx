import { BAND_STYLE, signed, pluralPoints } from '../../lib/format.js';

/** Low / Moderate / High chip. Glyph + word, never colour alone. */
export function RiskBadge({ band, size = 'md' }) {
  const s = BAND_STYLE[band];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-meta' : 'px-2.5 py-1 text-meta';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${pad} ${s.bg} ${s.text} ${s.border}`}
    >
      <span aria-hidden="true">{s.glyph}</span>
      {s.label} risk
    </span>
  );
}

/** The delta chip. Sign + arrow + colour, so it survives a bad projector. */
export function DeltaChip({ delta, direction }) {
  if (direction === 'unchanged') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-meta font-semibold text-slate-500">
        no change
      </span>
    );
  }
  const improved = direction === 'improved';
  return (
    <span
      className={`inline-flex animate-pop-in items-center gap-1 rounded-full px-2.5 py-1 text-meta font-bold tnum ${
        improved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      <span aria-hidden="true">{improved ? '▼' : '▲'}</span>
      {signed(delta)}
    </span>
  );
}

/** Shown only when a simulated change actually crosses a boundary. */
export function BandTransitionPill({ from, to }) {
  const f = BAND_STYLE[from];
  const t = BAND_STYLE[to];
  return (
    <span className="inline-flex animate-pop-in items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-meta font-semibold shadow-sm">
      <span className={f.text}>{f.label}</span>
      <span className="text-slate-500" aria-hidden="true">
        →
      </span>
      <span className={t.text}>{t.label}</span>
    </span>
  );
}

/**
 * "4 points from Low".
 * Keeps a card informative even when nothing crossed a band — which is most of
 * the time, and is exactly when a user would otherwise feel nothing happened.
 */
export function DistanceToBand({ distance }) {
  if (!distance) return null;
  const target = BAND_STYLE[distance.target].label;
  return (
    <p className="text-meta text-slate-500 tnum">
      {distance.direction === 'down'
        ? `${pluralPoints(distance.points)} from ${target}`
        : `${pluralPoints(distance.points)} below ${target}`}
    </p>
  );
}
