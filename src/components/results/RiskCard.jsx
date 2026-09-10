import { BAND_STYLE } from '../../lib/format.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { RiskBadge, DeltaChip, BandTransitionPill, DistanceToBand } from './badges.jsx';
import { ScoreTrack } from './ScoreTrack.jsx';

/**
 * One condition. In simulation mode it shows both numbers at once —
 * the old value stays on screen, greyed, so the judge sees what moved.
 */
export function RiskCard({ detail, isSimulating }) {
  const { current, simulated, deltaIndex, direction, bandChanged, bandFrom, bandTo, distance } =
    detail;

  const shown = isSimulating ? simulated : current;
  const animated = useCountUp(shown.index);
  const style = BAND_STYLE[shown.band];

  return (
    <article
      className={`card-raised flex h-full flex-col gap-4 p-6 transition-colors duration-500 ${
        isSimulating && direction !== 'unchanged' ? style.border : ''
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="h-card">{current.label}</h3>
          <p className="mt-1 text-meta leading-snug text-slate-500">{current.blurb}</p>
        </div>
        <RiskBadge band={shown.band} />
      </header>

      <div className="flex items-end gap-3">
        {isSimulating && direction !== 'unchanged' && (
          <span className="pb-1 text-2xl font-semibold text-slate-500 line-through tnum">
            {current.index}
          </span>
        )}
        <span className={`text-display font-semibold tnum ${style.text}`}>{animated}</span>
        <span className="pb-1 text-meta text-slate-500">/ 100</span>
        {isSimulating && (
          <span className="ml-auto pb-1.5">
            <DeltaChip delta={deltaIndex} direction={direction} />
          </span>
        )}
      </div>

      <ScoreTrack
        index={shown.index}
        band={shown.band}
        thresholds={shown.thresholds}
        max={shown.max}
        ghostIndex={isSimulating ? current.index : undefined}
      />

      <div className="flex min-h-[1.75rem] flex-wrap items-center gap-2">
        {isSimulating && bandChanged && <BandTransitionPill from={bandFrom} to={bandTo} />}
        <DistanceToBand distance={isSimulating ? distance : undefined} />
        {!isSimulating && (
          <p className="text-meta text-slate-500 tnum">
            {shown.raw} of {shown.max} rule points
          </p>
        )}
      </div>

      {/* The null case, explained. A blank card here would read as a broken app. */}
      {isSimulating && direction === 'unchanged' && (
        <p className="inset px-3 py-2 text-meta leading-relaxed text-slate-500">
          No change to this risk — none of the factors you adjusted feed this score.
        </p>
      )}
    </article>
  );
}

export function RiskCardGrid({ summary, isSimulating }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* The one orchestrated moment on the page: the three answers arrive left
          to right, once, on mount. Everything after that is response to input. */}
      {summary.list.map((detail, i) => (
        <div key={detail.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
          <RiskCard detail={detail} isSimulating={isSimulating} />
        </div>
      ))}
    </div>
  );
}
