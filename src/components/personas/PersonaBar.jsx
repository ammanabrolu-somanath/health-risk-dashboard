/**
 * Demo persona switcher.
 *
 * Deliberately sits ABOVE the risk cards rather than inside the data-entry
 * accordion. A judge's first action is switching persona, and clicking one here
 * changes the three cards already on screen — the same cause-and-effect
 * co-visibility the what-if panel is built around. The form accordion keeps the
 * other job: editing a single field.
 *
 * Selecting a persona calls straight through to the Dashboard's existing
 * profile loader, so there is no new state and nothing reloads.
 *
 * The mark on each card is the person's AGE, not an emoji. Age is the heaviest
 * factor the simulator cannot move, so it is the one number worth carrying on
 * the card — and it keeps the strip reading as a clinical record rather than a
 * consumer app.
 */
export function PersonaBar({ personas, activeId, onSelect }) {
  return (
    <section aria-label="Demo personas">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="h-section">Load a demo persona</h2>
        <p className="text-meta text-slate-500">
          Synthetic people — one click swaps the data and recalculates everything below
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {personas.map((p) => {
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(p)}
              className={`card min-w-[15rem] shrink-0 p-4 text-left transition sm:min-w-0 ${
                active
                  ? 'border-indigo-300 ring-2 ring-indigo-500 ring-offset-1'
                  : 'hover:border-indigo-200 hover:bg-indigo-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg leading-none ${
                    active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-body font-semibold tnum">{p.age}</span>
                  <span className="mt-0.5 text-[9px] uppercase opacity-70">yrs</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-body font-semibold ${
                        active ? 'text-indigo-700' : 'text-slate-900'
                      }`}
                    >
                      {p.name}
                    </span>
                    {active && (
                      <span
                        className="shrink-0 text-meta font-bold text-indigo-600"
                        aria-label="currently loaded"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-meta text-slate-500">{p.tagline}</p>
                </div>
              </div>

              <p className="mt-3 text-meta leading-relaxed text-slate-500">{p.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
