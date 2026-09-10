import { labelForValue } from '../../data/factors.js';

/**
 * A lever with a live readout and an optional guideline marker on the track.
 * Arrow keys work natively on range inputs — use them on stage, not the trackpad.
 */
export function LeverSlider({
  label,
  value,
  baseline,
  min,
  max,
  step = 1,
  unit,
  marker,
  markerLabel,
  secondary,
  note,
  onChange,
}) {
  const changed = value !== baseline;
  const pct = (n) => ((n - min) / (max - min)) * 100;

  return (
    <div className="py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-body font-medium text-slate-700" htmlFor={`lever-${label}`}>
          {label}
        </label>
        <div className="text-right">
          <span
            className={`text-body font-semibold tnum ${changed ? 'text-indigo-600' : 'text-slate-900'}`}
          >
            {value}
            {unit ? ` ${unit}` : ''}
          </span>
          {changed && (
            <span className="ml-1.5 text-meta text-slate-500 tnum line-through">
              {baseline}
              {unit ? ` ${unit}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          id={`lever-${label}`}
          type="range"
          className="w-full py-2.5"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {marker !== undefined && marker > min && marker < max && (
          <div
            className="pointer-events-none absolute top-[18px] h-2 w-0.5 -translate-x-1/2 bg-slate-400"
            style={{ left: `${pct(marker)}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        {markerLabel ? (
          <span className="text-meta text-slate-500">{markerLabel}</span>
        ) : (
          <span />
        )}
        {secondary && <span className="text-meta text-slate-500 tnum">{secondary}</span>}
      </div>

      {note && <p className="mt-1.5 text-meta leading-relaxed text-slate-500">{note}</p>}
    </div>
  );
}

/** Segmented control for the categorical levers. */
export function LeverSegmented({ label, options, value, baseline, note, onChange }) {
  const changed = value !== baseline;

  return (
    <div className="py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-body font-medium text-slate-700">{label}</span>
        {changed && (
          <span className="text-meta text-slate-500">
            was {options.find((o) => o.value === baseline)?.label}
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`rounded-lg px-2 py-2 text-meta font-semibold transition ${
                selected
                  ? changed
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {note && <p className="mt-1.5 text-meta leading-relaxed text-slate-500">{note}</p>}
    </div>
  );
}

/**
 * The factors the simulator deliberately does NOT let you change.
 *
 * Showing them locked is the point: a what-if tool that lets you pretend to be
 * 30 years younger is a toy. This one only moves what a person could move.
 */
export function LockedFactorList({ profile, fieldIds }) {
  return (
    <div className="inset p-4">
      <p className="mb-2 text-meta font-semibold text-slate-500">Not modifiable</p>
      <dl className="space-y-1">
        {fieldIds.map((id) => (
          <div key={id} className="flex items-baseline justify-between gap-4 text-meta">
            <dt className="shrink-0 text-slate-500">{SHORT_LABEL[id]}</dt>
            <dd className="text-right font-medium text-slate-700">
              {labelForValue(id, profile[id])}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-meta leading-relaxed text-slate-500">
        These affect your score but a lifestyle change cannot alter them, so the simulator
        leaves them fixed.
      </p>
    </div>
  );
}

const SHORT_LABEL = {
  age: 'Age',
  sex: 'Sex',
  familyHistory: 'Family history',
  priorHighGlucose: 'Prior high glucose',
};
