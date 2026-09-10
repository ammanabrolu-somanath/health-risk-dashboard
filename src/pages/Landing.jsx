import { Disclaimer } from '../components/layout/chrome.jsx';
import { RULES, scoreAll } from '../lib/scoring/scoreAll.js';
import { PERSONA_HIGH_RISK } from '../data/demoProfiles.js';
import { applyOverrides } from '../lib/simulation/applyOverrides.js';
import { allPresetOverrides } from '../lib/simulation/presets.js';
import { BAND_STYLE } from '../lib/format.js';

const CONDITIONS = ['diabetes', 'hypertension', 'cardiovascular'];

/**
 * The hero is the product, not a description of it.
 *
 * These three numbers are not hard-coded marketing copy — they are the real
 * scorer run twice on the frozen high-risk persona, once as-is and once with the
 * three lifestyle presets applied. If the rule tables change, this panel changes
 * with them, because it cannot disagree with the dashboard it is advertising.
 */
function usePreview() {
  const before = scoreAll(PERSONA_HIGH_RISK);
  const after = scoreAll(applyOverrides(PERSONA_HIGH_RISK, allPresetOverrides(PERSONA_HIGH_RISK)));
  return CONDITIONS.map((id) => ({
    id,
    label: RULES[id].label,
    before: before[id],
    after: after[id],
  }));
}

function PreviewRow({ row }) {
  const from = BAND_STYLE[row.before.band];
  const to = BAND_STYLE[row.after.band];
  const moved = row.before.band !== row.after.band;

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-slate-800">{row.label}</p>
        <p className="mt-0.5 text-meta text-slate-500">
          {from.label}
          {moved ? ` becomes ${to.label}` : ' — unchanged'}
        </p>
      </div>

      <div className="flex shrink-0 items-baseline gap-2">
        <span className="text-xl font-semibold tnum text-slate-500 line-through">
          {row.before.index}
        </span>
        <span className="text-slate-300" aria-hidden="true">
          →
        </span>
        <span className={`text-3xl font-semibold tnum ${to.text}`}>{row.after.index}</span>
      </div>
    </div>
  );
}

export function Landing({ onStart }) {
  const preview = usePreview();

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Every point on your risk score, and what moves it.
            </h1>

            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-slate-600">
              A screening-level dashboard for three conditions. It shows the rule that awarded
              each point, cites the instrument the rule came from, and recalculates the moment
              you change something you could actually change.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" onClick={onStart} className="btn-primary !px-5 !py-3 !text-base">
                Open the dashboard
              </button>
              <span className="text-meta text-slate-500">
                Loads a synthetic profile. Nothing to type.
              </span>
            </div>

            <p className="mt-8 max-w-[52ch] text-meta leading-relaxed text-slate-500">
              Scoring is rule-based and fully readable: three published point tables held as JSON,
              no model weights and nothing learned from data.
            </p>
          </div>

          {/* The product moment, computed live. */}
          <div className="lg:col-span-6">
            <div className="card-raised p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="h-card">If this person quit smoking, walked and lost 6 kg</h2>
              </div>
              <p className="mt-1 text-meta text-slate-500">
                A synthetic 58-year-old, scored before and after the three changes
              </p>

              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {preview.map((row) => (
                  <PreviewRow key={row.id} row={row} />
                ))}
              </div>

              <p className="mt-4 border-t border-slate-100 pt-3 text-meta leading-relaxed text-slate-500">
                Exact rule arithmetic, not an estimate of importance. The dashboard shows every
                row that changed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CONDITIONS.map((id) => (
            <div key={id} className="border-t border-slate-200 pt-4">
              <h2 className="h-card">{RULES[id].label}</h2>
              <p className="mt-2 text-meta leading-relaxed text-slate-500">{RULES[id].blurb}</p>
              <p className="mt-3 text-meta leading-relaxed text-slate-500">{RULES[id].source}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
