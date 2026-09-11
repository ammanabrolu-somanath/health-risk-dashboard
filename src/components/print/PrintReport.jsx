import { deriveMetrics } from '../../lib/scoring/derive.js';
import { CONDITION_IDS, RULES } from '../../lib/scoring/scoreAll.js';
import { BAND_STYLE, signed } from '../../lib/format.js';
import { completenessOf, positiveAnswers } from '../../lib/history/answers.js';
import { ANSWER_LABEL } from '../../data/history/questions.js';

/**
 * Consultation-style summary, built for print.
 *
 * This is a purpose-built document, not the dashboard with pieces hidden — a
 * masthead, a profile table, per-condition results and the simulated changes.
 * It is hidden on screen and revealed by the print stylesheet, so "Export
 * summary" is just window.print() and the output is real vector text rather
 * than a screenshot: sharp, selectable and a few dozen KB.
 *
 * It renders from the same `current` / `simulated` / `summary` objects the
 * dashboard uses, so it can never disagree with what is on screen.
 */

const SEX_LABEL = { male: 'Male', female: 'Female', other: 'Not stated' };

function Row({ label, value }) {
  return (
    <div className="flex gap-3 border-b border-slate-200 py-1">
      <span className="w-44 shrink-0 text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function PrintReport({ profile, current, simulated, summary, isSimulating, findings }) {
  const enriched = deriveMetrics(profile);

  // Health history. A consultation document is the one place where what was
  // asked and denied matters as much as what was reported, so the counts travel
  // with the positives — a blank is never presented as a negative finding.
  const completeness = completenessOf(profile.history);
  const positives = positiveAnswers(profile.history);
  const caveats = Object.fromEntries((findings?.caveats ?? []).map((c) => [c.appliesTo, c]));
  const reportFindings = findings?.findings ?? [];
  const bpLabel =
    RULES.hypertension.factors.find((f) => f.id === 'bpCategory').valueLabels[
      enriched.bpCategory
    ];
  const shown = isSimulating ? simulated : current;

  const generated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="print-only p-0 text-meta leading-relaxed text-slate-900">
      {/* Masthead */}
      <header className="mb-4 border-b-2 border-slate-900 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Health Risk Lens</h1>
            <p className="text-slate-600">Screening summary — not a diagnosis</p>
          </div>
          <div className="text-right text-slate-500">
            <p>Generated {generated}</p>
            <p className="font-semibold uppercase tracking-wide">Synthetic data</p>
          </div>
        </div>
      </header>

      {/* Profile */}
      <section className="mb-4" style={{ breakInside: 'avoid' }}>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Profile
        </h2>
        <Row label="Persona" value={`${profile.name ?? 'Custom entry'} (synthetic)`} />
        <Row
          label="Age / sex"
          value={`${profile.age} years · ${SEX_LABEL[profile.sex] ?? 'Not stated'}`}
        />
        <Row
          label="Height / weight"
          value={`${profile.heightCm} cm · ${profile.weightKg} kg`}
        />
        <Row
          label="Body-mass index"
          value={`${enriched.bmi.toFixed(1)} · waist ${Number(profile.waistCm).toFixed(0)} cm`}
        />
        <Row
          label="Blood pressure"
          value={`${profile.systolic}/${profile.diastolic} mmHg · ${bpLabel}`}
        />
        <Row
          label="Smoking / activity"
          value={`${profile.smoking} · ${profile.activityMinutes} min/week`}
        />
        <Row label="Diet quality" value={profile.dietQuality} />
        <Row label="Family history" value={profile.familyHistory} />
      </section>

      {/* Results */}
      <section className="mb-4" style={{ breakInside: 'avoid' }}>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Screening results
          {isSimulating && ' — simulated'}
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-900 text-left">
              <th className="py-1 font-semibold">Condition</th>
              <th className="py-1 text-right font-semibold">Index</th>
              <th className="py-1 text-right font-semibold">Rule points</th>
              <th className="py-1 text-right font-semibold">Category</th>
            </tr>
          </thead>
          <tbody>
            {CONDITION_IDS.map((id) => {
              const r = shown[id];
              return (
                <tr key={id} className="border-b border-slate-200">
                  <td className="py-1">
                    {r.label}
                    {caveats[id] && <span className="font-bold"> &#9888;</span>}
                  </td>
                  <td className="py-1 text-right tnum">
                    {isSimulating && current[id].index !== r.index && (
                      <span className="text-slate-400">{current[id].index} → </span>
                    )}
                    {r.index}/100
                  </td>
                  <td className="py-1 text-right tnum">
                    {r.raw} of {r.max}
                  </td>
                  <td className="py-1 text-right font-bold uppercase">
                    {BAND_STYLE[r.band].label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1 text-meta text-slate-500">
          Each condition uses its own instrument and its own thresholds, so the indices are not
          directly comparable to one another.
        </p>
        {Object.values(caveats).map((cv) => (
          <p key={cv.id} className="mt-1 text-meta font-medium text-slate-900">
            &#9888; {cv.long}
          </p>
        ))}
      </section>

      {/* Simulated changes — only when the what-if simulator is active */}
      {isSimulating && summary.anyChange && (
        <section className="mb-4" style={{ breakInside: 'avoid' }}>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
            Simulated changes
          </h2>
          {summary.list
            .filter((cond) => cond.factorDeltas.length > 0)
            .map((cond) => (
              <div key={cond.id} className="mb-2">
                <p className="font-semibold">
                  {cond.label}: {cond.current.index} → {cond.simulated.index}{' '}
                  <span className="tnum">({signed(cond.deltaIndex)})</span>
                  {cond.bandChanged && (
                    <span className="uppercase">
                      {' '}
                      · {BAND_STYLE[cond.bandFrom].label} → {BAND_STYLE[cond.bandTo].label}
                    </span>
                  )}
                </p>
                <ul className="ml-4 list-disc">
                  {cond.factorDeltas.map((d) => (
                    <li key={d.factorId}>
                      {d.label}: {d.displayBefore} → {d.displayAfter} ({d.pointsBefore} →{' '}
                      {d.pointsAfter} pts, <span className="tnum">{signed(d.change)}</span>)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          <p className="text-meta text-slate-500">
            Modelled instantly. A real-world change of this kind takes months to years.
          </p>
        </section>
      )}

      {/* Health history — reported positives, findings, and what was NOT reported.
          The counts are load-bearing: a clinician reading this has to be able to
          tell "asked and denied" from "never asked", which is the whole reason
          the questionnaire has a third answer state. */}
      <section className="mb-4" style={{ breakInside: 'avoid' }}>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Health history
        </h2>

        {completeness.answered === 0 ? (
          <p className="text-slate-500">No health-history questions were answered.</p>
        ) : (
          <>
            {reportFindings.length > 0 ? (
              <div className="mb-2">
                <p className="font-semibold">Findings to discuss</p>
                <ul className="ml-4 list-disc">
                  {reportFindings.map((f) => (
                    <li key={f.id}>
                      <span className="font-semibold uppercase">{f.tierLabel}</span>
                      {f.kind === 'combination' && <span> ({f.label})</span>} — {f.summary}
                      <span className="text-slate-500">
                        {' '}
                        [{f.evidence.map((e) => e.text).join(' + ')}]
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mb-2 font-semibold">
                No findings identified from {completeness.answered} answered questions.
              </p>
            )}

            {positives.length > 0 && (
              <div className="mb-2">
                <p className="font-semibold">Reported</p>
                <ul className="ml-4 list-disc">
                  {positives.map((q) => (
                    <li key={q.id}>
                      {q.text} <span className="font-semibold">Yes</span>
                      {q.note && <span> — {q.note}</span>}
                      <span className="text-slate-500"> ({q.window.toLowerCase()})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-slate-500">
              Answered {completeness.answered} of {completeness.total} —{' '}
              <span className="tnum">{completeness.yes}</span> yes,{' '}
              <span className="tnum">{completeness.no}</span> no,{' '}
              <span className="tnum">{completeness.unsure}</span> not sure,{' '}
              <span className="tnum">{completeness.unanswered}</span> unanswered. Findings are
              conversation priorities raised by predefined rules — not a diagnosis, and not a
              measure of clinical urgency.
            </p>
          </>
        )}
      </section>

      {/* Contributing factors */}
      <section className="mb-4">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
          Contributing factors
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {CONDITION_IDS.map((id) => {
            const r = shown[id];
            const scoring = r.contributions
              .filter((c) => c.points > 0)
              .sort((x, y) => y.points - x.points);
            return (
              <div key={id} style={{ breakInside: 'avoid' }}>
                <h3 className="border-b border-slate-400 pb-0.5 font-semibold">{r.short}</h3>
                {scoring.length === 0 ? (
                  <p className="pt-1 text-slate-500">No factor contributed points.</p>
                ) : (
                  <ul>
                    {scoring.map((c) => (
                      <li
                        key={c.factorId}
                        className="flex justify-between gap-2 border-b border-slate-100 py-0.5"
                      >
                        <span className="min-w-0 flex-1 truncate">{c.label}</span>
                        <span className="shrink-0 tnum">
                          {c.points}/{c.maxPoints}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-[9px] leading-snug text-slate-500">{r.source}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disclaimer — verbatim, and never omitted */}
      <footer
        className="mt-6 border-2 border-slate-900 p-3"
        style={{ breakInside: 'avoid' }}
      >
        <p className="mb-1 text-xs font-bold uppercase tracking-widest">Important</p>
        <p>
          This is a screening-level educational estimate produced by predefined scoring rules —{' '}
          <strong>not a diagnosis</strong>. It does not recommend any medicine or treatment. All
          data shown is synthetic. Consult a qualified healthcare professional about your health.
        </p>
      </footer>
    </div>
  );
}
