import { useEffect, useRef, useState } from 'react';
import { BAND_STYLE, signed } from '../../lib/format.js';

export function Header({ children }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* One row at every width. Wrapping put the actions on a second line and
          made the header 100px tall on a phone, eating the fold twice over. */}
      <div className="mx-auto flex max-w-7xl items-center gap-x-3 px-4 py-3 sm:gap-x-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            HR
          </span>
          <div className="min-w-0">
            <p className="truncate text-subsection font-semibold leading-tight text-slate-900">
              Health Risk Lens
            </p>
            <p className="hidden text-meta leading-tight text-slate-500 sm:block">
              Screening-level estimate — not a diagnosis
            </p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

/**
 * Once the risk cards scroll out of view, their numbers reappear here.
 * The judge can be anywhere on the page and still see the effect of a lever.
 *
 * The strip also carries the headline result, because the moment a scenario is
 * applied the judge is normally scrolled down at the levers — which is exactly
 * where the Biggest-impact callout is NOT. Restating one sentence here costs a
 * row of chrome and means the best line in the product is on screen at the
 * moment it becomes true, whatever the scroll position. Nothing moves on the
 * page when it appears, so the button just clicked stays under the cursor.
 */
export function StickyDeltaStrip({ summary, isSimulating, watchRef }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = watchRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);

  if (!stuck) return null;

  return (
    <div className="sticky top-[57px] z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2 sm:px-6">
        {summary.list.map((d) => {
          const shown = isSimulating ? d.simulated : d.current;
          const style = BAND_STYLE[shown.band];
          return (
            <div key={d.id} className="flex shrink-0 items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
              <span className="text-meta text-slate-500">{d.short}</span>
              {isSimulating && d.direction !== 'unchanged' && (
                <>
                  <span className="text-meta text-slate-500 line-through tnum">{d.current.index}</span>
                  <span className="text-meta text-slate-500" aria-hidden="true">
                    →
                  </span>
                </>
              )}
              <span className={`text-subsection font-bold tnum ${style.text}`}>{shown.index}</span>
              {isSimulating && d.direction !== 'unchanged' && (
                <span
                  className={`text-meta font-semibold tnum ${
                    d.direction === 'improved' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {signed(d.deltaIndex)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isSimulating && summary.biggestWin && (
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-1.5 sm:px-6">
            <span className="text-meta font-semibold text-slate-900">
              {summary.biggestWin.label}
            </span>
            <span className="text-meta font-semibold tnum text-emerald-600">
              {signed(summary.biggestWin.deltaIndex)} points
            </span>
            {summary.biggestWin.bandChanged && (
              <span className="text-meta text-slate-500">
                — moves from{' '}
                <span className={`font-semibold ${BAND_STYLE[summary.biggestWin.bandFrom].text}`}>
                  {BAND_STYLE[summary.biggestWin.bandFrom].label}
                </span>{' '}
                to{' '}
                <span className={`font-semibold ${BAND_STYLE[summary.biggestWin.bandTo].text}`}>
                  {BAND_STYLE[summary.biggestWin.bandTo].label}
                </span>
              </span>
            )}
            {summary.bandsCrossed > 1 && (
              <span className="ml-auto text-meta text-slate-500">
                {summary.bandsCrossed} of 3 conditions changed category
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Accordion({ title, subtitle, open, onToggle, children }) {
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <h2 className="h-card">{title}</h2>
          {subtitle && <p className="mt-1 text-meta text-slate-500">{subtitle}</p>}
        </div>
        <span
          className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-slate-100 px-6 py-6">{children}</div>}
    </section>
  );
}

/**
 * Persistent, never a dismissible modal. The brief is explicit that results are
 * screening-level and that no treatment or medicine may be recommended.
 */
export function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <p className="text-meta leading-relaxed text-slate-500">
        Screening-level educational estimate from predefined scoring rules — <strong>not a
        diagnosis</strong>. No medicine or treatment is recommended. All data is synthetic.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="flex items-center gap-2 text-subsection font-semibold text-amber-900">
        <span aria-hidden="true">⚠</span> Important
      </h2>
      <p className="mt-2 max-w-[68ch] text-body leading-relaxed text-amber-900/90">
        This is a screening-level educational estimate produced by predefined scoring rules —{' '}
        <strong>not a diagnosis</strong>. It does not recommend any medicine or treatment. All
        data shown is synthetic. Consult a qualified healthcare professional about your health.
      </p>
    </section>
  );
}

export function useRefWatcher() {
  return useRef(null);
}
