import { useState } from 'react';
import { PRESETS, allPresetOverrides, WHO_ACTIVITY_TARGET } from '../../lib/simulation/presets.js';
import { LOCKED_IN_SIMULATOR, SMOKING_OPTIONS, DIET_OPTIONS } from '../../data/factors.js';
import { bmiOf } from '../../lib/scoring/derive.js';
import { LeverSlider, LeverSegmented, LockedFactorList } from './controls.jsx';

/**
 * The What-If simulator.
 *
 * Every control writes into a sparse `overrides` patch. The profile itself is
 * never touched — that is what makes "Reset to my data" honest and what lets the
 * banner promise it.
 */
export function WhatIfPanel({ profile, simProfile, overrides, activeCount, onChange, onReset }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = (key) => (value) => onChange({ ...overrides, [key]: value });

  const applyPreset = (preset) => onChange({ ...overrides, ...preset.overrides(profile) });
  const applyAll = () => onChange({ ...overrides, ...allPresetOverrides(profile) });

  const weightMin = Math.max(35, Math.round(profile.weightKg - 25));
  const weightMax = Math.round(profile.weightKg + 25);
  const currentBmi = bmiOf(simProfile.weightKg, simProfile.heightCm);
  const baselineBmi = bmiOf(profile.weightKg, profile.heightCm);
  const isSimulating = activeCount > 0;

  const presetActive = (preset) => {
    const o = preset.overrides(profile);
    return Object.entries(o).every(([k, v]) => simProfile[k] === v);
  };

  // "Apply all three" was the only control that could not show its own state:
  // it applied three presets and then rendered as though nothing had happened.
  const applicable = PRESETS.filter((preset) => preset.appliesTo(profile));
  const allApplied = applicable.length > 0 && applicable.every(presetActive);

  return (
    <section className="card overflow-hidden">
      <header className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="h-section">What-if simulator</h2>
            <p className="mt-1 text-meta leading-relaxed text-slate-500">
              Change something you could actually change, and watch the three scores above
              recalculate.
            </p>
          </div>
          {isSimulating && (
            <button type="button" onClick={onReset} className="btn-ghost shrink-0 !px-3 !py-1.5 !text-meta">
              Reset
            </button>
          )}
        </div>
      </header>

      {isSimulating && (
        <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-6 py-3">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
          </span>
          <p className="text-meta font-medium text-indigo-900">
            Simulation mode · {activeCount} change{activeCount === 1 ? '' : 's'} — your saved
            data has not changed.
          </p>
        </div>
      )}

      <div className="px-6 py-5">
        {/* Presets first: on stage you want a button, not a slider drag. */}
        <p className="label mb-2">Try a scenario</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active = presetActive(preset);
            const available = preset.appliesTo(profile);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={!available}
                title={available ? preset.sublabel : 'Not applicable to this profile'}
                className={`btn !px-3 !py-2 !text-meta ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {active && <span aria-hidden="true">✓</span>}
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={applyAll}
            aria-pressed={allApplied}
            className={`btn !px-3 !py-2 !text-meta border border-dashed ${
              allApplied
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-indigo-300 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {allApplied && <span aria-hidden="true">✓</span>}
            Apply all three
          </button>
        </div>

        {/* The notes attached to whichever presets are in effect. Kept in one
            block rather than three stacked ones: with all three applied the old
            layout spent 221px of panel height on prose and pushed the sliders —
            the thing the judge came to touch — off the screen. */}
        {PRESETS.some(presetActive) && (
          <ul className="mt-3 space-y-1.5 border-l-2 border-indigo-300 bg-slate-50 px-3 py-2">
            {PRESETS.filter(presetActive).map((preset) => (
              <li key={preset.id} className="text-meta leading-snug text-slate-600">
                {preset.note}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          <LeverSegmented
            label="Smoking status"
            options={SMOKING_OPTIONS}
            value={simProfile.smoking}
            baseline={profile.smoking}
            onChange={set('smoking')}
          />

          <LeverSlider
            label="Weight"
            value={simProfile.weightKg}
            baseline={profile.weightKg}
            min={weightMin}
            max={weightMax}
            unit="kg"
            secondary={`BMI ${currentBmi.toFixed(1)}${
              currentBmi.toFixed(1) !== baselineBmi.toFixed(1) ? ` (was ${baselineBmi.toFixed(1)})` : ''
            } · waist ${Number(simProfile.waistCm).toFixed(0)} cm`}
            note="Waist is estimated to move about 0.8 cm per kg. It is scored separately from BMI by the diabetes model."
            onChange={set('weightKg')}
          />

          <LeverSlider
            label="Moderate activity"
            value={simProfile.activityMinutes}
            baseline={profile.activityMinutes}
            min={0}
            max={400}
            step={10}
            unit="min/week"
            marker={WHO_ACTIVITY_TARGET}
            markerLabel="↑ WHO guideline: 150 min/week"
            onChange={set('activityMinutes')}
          />

          <LeverSegmented
            label="Fruit & vegetables"
            options={DIET_OPTIONS}
            value={simProfile.dietQuality}
            baseline={profile.dietQuality}
            onChange={set('dietQuality')}
          />
        </div>

        {/* Blood pressure is an outcome, not a lever — kept out of the main four. */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between text-meta font-semibold text-slate-500 hover:text-slate-700"
          >
            Advanced
            <span aria-hidden="true">{advancedOpen ? '−' : '+'}</span>
          </button>
          {advancedOpen && (
            <LeverSlider
              label="Systolic blood pressure"
              value={simProfile.systolic}
              baseline={profile.systolic}
              min={90}
              max={200}
              unit="mmHg"
              note="An outcome measure, not a lever — in reality this changes as a result of the factors above. Adjustable here for exploration."
              onChange={set('systolic')}
            />
          )}
        </div>

        <div className="mt-4">
          <LockedFactorList profile={profile} fieldIds={LOCKED_IN_SIMULATOR} />
        </div>

        {isSimulating && (
          <button type="button" onClick={onReset} className="btn-ghost mt-4 w-full">
            Reset to my data
          </button>
        )}
      </div>
    </section>
  );
}
