import { BAND_STYLE } from '../../lib/format.js';
import { bandTicks } from '../../lib/scoring/bands.js';

/**
 * The 0-100 bar under each score.
 *
 * Each condition draws ITS OWN band boundaries as ticks, because the three
 * instruments have different cut-points. Forcing them onto a shared 33/66 split
 * would have made the chart tidier and the model wrong.
 *
 * `ghostIndex` marks where the score sat before simulation, so the bar shows
 * travel rather than just a new length.
 */
export function ScoreTrack({ index, band, thresholds, max, ghostIndex }) {
  const ticks = bandTicks(thresholds, max);
  const style = BAND_STYLE[band];
  const showGhost = ghostIndex !== undefined && ghostIndex !== index;

  return (
    <div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${style.bar}`}
          style={{ width: `${Math.max(2, index)}%` }}
        />
        {showGhost && (
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-900/45"
            style={{ left: `${ghostIndex}%` }}
            aria-hidden="true"
          />
        )}
        {[ticks.moderate, ticks.high].map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full w-px bg-white/80"
            style={{ left: `${t}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="relative mt-1 h-3.5 text-meta font-medium text-slate-500">
        <span className="absolute left-0">Low</span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: `${Math.min(88, Math.max(12, ticks.moderate))}%` }}
        >
          Moderate
        </span>
        <span className="absolute right-0">High</span>
      </div>
    </div>
  );
}
