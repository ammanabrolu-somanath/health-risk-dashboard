import { FORM_FIELDS } from '../../data/factors.js';
import { bmiOf, bpCategoryOf } from '../../lib/scoring/derive.js';
import { RULES } from '../../lib/scoring/scoreAll.js';

/**
 * Health and lifestyle data entry.
 *
 * Every change writes straight through to the profile — there is no submit
 * button and no debounce, so the three scores above recalculate as you type.
 */
function Field({ field, value, onChange }) {
  const id = `field-${field.id}`;

  const control = () => {
    switch (field.control) {
      case 'number':
        return (
          <div className="relative">
            <input
              id={id}
              type="number"
              className="field pr-14"
              value={value}
              min={field.min}
              max={field.max}
              onChange={(e) => {
                const n = e.target.value === '' ? '' : Number(e.target.value);
                onChange(field.id, n);
              }}
            />
            {field.unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            id={id}
            className="field"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );

      case 'segmented':
        return (
          <div role="radiogroup" aria-label={field.label} className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {field.options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={o.value === value}
                onClick={() => onChange(field.id, o.value)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  o.value === value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );

      case 'toggle':
        return (
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            onClick={() => onChange(field.id, !value)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              value
                ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <span>{value ? 'Yes' : 'No'}</span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${value ? 'bg-indigo-600' : 'bg-slate-300'}`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  value ? 'left-[1.125rem]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className={field.full ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <label className="label mb-1.5" htmlFor={id}>
        {field.label}
      </label>
      {control()}
      {field.help && <p className="mt-1 text-meta leading-relaxed text-slate-500">{field.help}</p>}
    </div>
  );
}

export function HealthForm({ profile, onChange }) {
  const bmi = bmiOf(profile.weightKg, profile.heightCm);
  const bpCat = bpCategoryOf(profile.systolic, profile.diastolic);
  const bpLabel =
    RULES.hypertension.factors.find((f) => f.id === 'bpCategory').valueLabels[bpCat];

  const handle = (id, value) => onChange({ ...profile, [id]: value });

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {FORM_FIELDS.map((field) => (
          <Field key={field.id} field={field} value={profile[field.id]} onChange={handle} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <div className="rounded-xl bg-slate-50 px-4 py-2.5">
          <p className="text-meta font-semibold uppercase tracking-wide text-slate-500">
            Body-mass index
          </p>
          <p className="text-lg font-semibold text-slate-900 tnum">
            {bmi ? bmi.toFixed(1) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-2.5">
          <p className="text-meta font-semibold uppercase tracking-wide text-slate-500">
            Blood-pressure category
          </p>
          <p className="text-lg font-semibold text-slate-900">{bpLabel}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Results above update as you type — there is no recalculate button.
      </p>
    </div>
  );
}
