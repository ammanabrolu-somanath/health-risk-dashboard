/**
 * Scoring verification — run with `npm run verify`.
 *
 * Checks the three synthetic profiles and the full What-If demo arc against
 * expected values. Band-boundary off-by-ones are the likeliest bug in a
 * points-table model, so this also probes each boundary directly.
 *
 * Loads the rule JSON via fs rather than `import ... with { type: 'json' }`
 * so it runs on plain node without Vite.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { deriveMetrics, bmiOf, bpCategoryOf } from '../src/lib/scoring/derive.js';
import { scoreCondition } from '../src/lib/scoring/scoreCondition.js';
import { bandFor } from '../src/lib/scoring/bands.js';
import { applyOverrides } from '../src/lib/simulation/applyOverrides.js';
import {
  summarizeSimulation,
  diffContributions,
} from '../src/lib/simulation/summarizeSimulation.js';
import {
  PERSONAS,
  PERSONA_STUDENT,
  PERSONA_OFFICE,
  PERSONA_HIGH_RISK,
  PERSONA_SENIOR,
} from '../src/data/demoProfiles.js';

const here = dirname(fileURLToPath(import.meta.url));
const rules = (name) =>
  JSON.parse(readFileSync(join(here, '../src/data/rules/', `${name}.rules.json`), 'utf8'));

const R = {
  diabetes: rules('diabetes'),
  hypertension: rules('hypertension'),
  cardiovascular: rules('cardiovascular'),
};

// Mirrors scoreAll.js, including the diabetes-before-cardiovascular ordering.
function scoreAll(profile) {
  const e = deriveMetrics(profile);
  const diabetes = scoreCondition(e, R.diabetes);
  const hypertension = scoreCondition(e, R.hypertension);
  const cardiovascular = scoreCondition(e, R.cardiovascular, { diabetesBand: diabetes.band });
  return { diabetes, hypertension, cardiovascular };
}

const RULE_HEADER = '\n=== Provenance metadata ===';
let failures = 0;
let checks = 0;

function check(name, actual, expected) {
  checks += 1;
  const ok = actual === expected;
  if (!ok) {
    failures += 1;
    console.error(`  FAIL  ${name}\n        expected ${expected}, got ${actual}`);
  }
  return ok;
}

function report(label, r) {
  const line = (c) =>
    `${c.short.padEnd(15)} raw ${String(c.raw).padStart(2)}/${String(c.max).padEnd(2)}  index ${String(c.index).padStart(3)}  ${c.band.toUpperCase()}`;
  console.log(`\n${label}`);
  console.log(`  ${line(r.diabetes)}`);
  console.log(`  ${line(r.hypertension)}`);
  console.log(`  ${line(r.cardiovascular)}`);
}

// ---------------------------------------------------------------- derived
console.log('\n=== Derived metrics ===');
check('BMI 89kg/172cm', Number(bmiOf(89, 172).toFixed(2)), 30.08);
check('BMI 83kg/172cm', Number(bmiOf(83, 172).toFixed(2)), 28.06);
check('BMI guards zero height', bmiOf(80, 0), 0);
check('BMI guards blank weight', bmiOf(null, 170), 0);
check('BP 138/86 -> stage1', bpCategoryOf(138, 86), 'stage1');
check('BP 112/70 -> normal', bpCategoryOf(112, 70), 'normal');
check('BP 126/78 -> elevated', bpCategoryOf(126, 78), 'elevated');
check('BP 142/80 -> stage2 (systolic wins)', bpCategoryOf(142, 80), 'stage2');
check('BP 118/92 -> stage2 (diastolic wins)', bpCategoryOf(118, 92), 'stage2');
console.log(`  ${checks - failures}/${checks} passed`);

// ------------------------------------------------------- boundary probes
console.log('\n=== Band boundaries (inclusive-lower) ===');
const th = R.diabetes.thresholds;
check('raw 6  -> low', bandFor(6, th), 'low');
check('raw 7  -> moderate', bandFor(7, th), 'moderate');
check('raw 14 -> moderate', bandFor(14, th), 'moderate');
check('raw 15 -> high', bandFor(15, th), 'high');

// BMI exactly on a boundary must land in the upper band (bands use `<`).
const bmiFactor = R.diabetes.factors.find((f) => f.id === 'bmi');
const bmiPointsAt = (v) =>
  scoreCondition({ ...PERSONA_STUDENT, bmi: v, waist: 70, bpCategory: 'normal' }, R.diabetes)
    .contributions.find((c) => c.factorId === 'bmi').points;
check('BMI 24.9 -> 0 pts', bmiPointsAt(24.9), 0);
check('BMI 25.0 -> 1 pt', bmiPointsAt(25.0), 1);
check('BMI 29.9 -> 1 pt', bmiPointsAt(29.9), 1);
check('BMI 30.0 -> 3 pts', bmiPointsAt(30.0), 3);
void bmiFactor;

// ------------------------------------------------------ synthetic profiles
console.log('\n=== Personas ===');

const a = scoreAll(PERSONA_HIGH_RISK);
report('High-Risk Adult', a);
check('high-risk diabetes raw', a.diabetes.raw, 17);
check('high-risk diabetes band', a.diabetes.band, 'high');
check('high-risk hypertension raw', a.hypertension.raw, 19);
check('high-risk hypertension band', a.hypertension.band, 'high');
check('high-risk cardiovascular raw', a.cardiovascular.raw, 28);
check('high-risk cardiovascular band', a.cardiovascular.band, 'high');
check(
  'A cardiovascular carries diabetes coupling',
  a.cardiovascular.contributions.find((c) => c.factorId === 'diabetesCoupling').points,
  3,
);

const b = scoreAll(PERSONA_STUDENT);
report('Healthy College Student', b);
check('student diabetes band', b.diabetes.band, 'low');
check('student hypertension band', b.hypertension.band, 'low');
check('student cardiovascular band', b.cardiovascular.band, 'low');

const c = scoreAll(PERSONA_SENIOR);
report('Senior Citizen', c);
check('senior diabetes band', c.diabetes.band, 'high');
check('senior hypertension band', c.hypertension.band, 'moderate');
check('senior cardiovascular band', c.cardiovascular.band, 'moderate');

const d = scoreAll(PERSONA_OFFICE);
report('Busy Office Worker', d);
check('office diabetes band', d.diabetes.band, 'moderate');
check('office hypertension band', d.hypertension.band, 'moderate');
// Young and never smoked, so cardiovascular stays Low while the other two do
// not. If this ever goes Moderate the personas stop demonstrating that the
// three models disagree.
check('office cardiovascular band', d.cardiovascular.band, 'low');

// Persona metadata must be complete — the strip renders all of it.
console.log('\n=== Persona metadata ===');
check('four personas', PERSONAS.length, 4);
for (const p of PERSONAS) {
  check(`${p.id} has a name`, typeof p.name === 'string' && p.name.length > 0, true);
  check(`${p.id} has a tagline`, typeof p.tagline === 'string' && p.tagline.length > 0, true);
  check(`${p.id} has a description`, typeof p.description === 'string' && p.description.length > 0, true);
}
check('persona ids are unique', new Set(PERSONAS.map((p) => p.id)).size, 4);

// Every persona must score cleanly — no NaN leaking through a missing field.
for (const p of PERSONAS) {
  const r = scoreAll(p);
  for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
    check(`${p.id} ${id} raw is a finite integer`, Number.isInteger(r[id].raw), true);
    check(`${p.id} ${id} index in range`, r[id].index >= 0 && r[id].index <= 100, true);
  }
}

// The four personas must not all land on the same band, or the set fails its job.
const allBands = PERSONAS.flatMap((p) => {
  const r = scoreAll(p);
  return [r.diabetes.band, r.hypertension.band, r.cardiovascular.band];
});
check('personas span all three bands', new Set(allBands).size, 3);

// --------------------------------------------------------- the demo arc
console.log('\n=== What-If demo arc (Profile A) ===');

const step1 = { smoking: 'former' };
const step2 = { ...step1, activityMinutes: 150 };
const step3 = { ...step2, weightKg: 83 };

const s1 = scoreAll(applyOverrides(PERSONA_HIGH_RISK, step1));
report('Step 1 — quit smoking', s1);
check('S1 diabetes unchanged (the no-change case)', s1.diabetes.raw, a.diabetes.raw);
check('S1 cardiovascular still high', s1.cardiovascular.band, 'high');

const s2 = scoreAll(applyOverrides(PERSONA_HIGH_RISK, step2));
report('Step 2 — + meet activity guideline', s2);
check('S2 cardiovascular crosses to moderate', s2.cardiovascular.band, 'moderate');
check('S2 hypertension still high', s2.hypertension.band, 'high');

const s3profile = applyOverrides(PERSONA_HIGH_RISK, step3);
const s3 = scoreAll(s3profile);
report('Step 3 — + lose 6 kg', s3);
check('S3 waist tracked weight', s3profile.waistCm, 98.2);
check('S3 diabetes crosses to moderate', s3.diabetes.band, 'moderate');
check('S3 hypertension crosses to moderate', s3.hypertension.band, 'moderate');
check('S3 cardiovascular moderate', s3.cardiovascular.band, 'moderate');
check(
  'S3 diabetes coupling switched off',
  s3.cardiovascular.contributions.find((x) => x.factorId === 'diabetesCoupling').points,
  0,
);

console.log('\n  Headline deltas:');
for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
  console.log(
    `    ${a[id].short.padEnd(15)} ${a[id].index} -> ${s3[id].index}  (${s3[id].index - a[id].index})  ${a[id].band} -> ${s3[id].band}`,
  );
}

// ------------------------------------------------------ override hygiene
console.log('\n=== Override hygiene ===');
const noop = applyOverrides(PERSONA_HIGH_RISK, { smoking: 'current' });
check('no-op override returns the original object', noop === PERSONA_HIGH_RISK, true);
const frozen = { ...PERSONA_HIGH_RISK };
applyOverrides(PERSONA_HIGH_RISK, { weightKg: 70 });
check('profile not mutated', JSON.stringify(PERSONA_HIGH_RISK), JSON.stringify(frozen));

// ------------------------------------------------- simulation summary
console.log('\n=== Simulation summary ===');

const arc = summarizeSimulation(a, s3);

check('arc reports a change', arc.anyChange, true);
check('arc crosses three bands', arc.bandsCrossed, 3);
check('biggest win is cardiovascular', arc.biggestWin.id, 'cardiovascular');
check('biggest win delta', arc.biggestWin.deltaIndex, s3.cardiovascular.index - a.cardiovascular.index);
check('diabetes direction', arc.perCondition.diabetes.direction, 'improved');

// Step 1 is the "no change" edge case, live in the demo.
const step1Summary = summarizeSimulation(a, s1);
check('step 1 leaves diabetes unchanged', step1Summary.perCondition.diabetes.direction, 'unchanged');
check('step 1 diabetes has no factor deltas', step1Summary.perCondition.diabetes.factorDeltas.length, 0);
check('step 1 still reports an overall change', step1Summary.anyChange, true);

// A worsening change must be handled symmetrically, not just gracefully.
const worse = scoreAll(applyOverrides(PERSONA_STUDENT, { smoking: 'current', weightKg: 95 }));
const worseSummary = summarizeSimulation(scoreAll(PERSONA_STUDENT), worse);
check('worsening is detected', worseSummary.perCondition.cardiovascular.direction, 'worsened');
check('worsening yields no biggest win', worseSummary.biggestWin, null);

// An identical profile must produce a completely empty diff.
const same = summarizeSimulation(a, a);
check('identical scores -> no change', same.anyChange, false);
check('identical scores -> no deltas', same.list.every((c) => c.factorDeltas.length === 0), true);
check('identical scores -> no biggest win', same.biggestWin, null);

// The attribution list is the demo's headline claim: exact arithmetic.
const cvdDeltas = arc.perCondition.cardiovascular.factorDeltas;
const smokingRow = cvdDeltas.find((d) => d.factorId === 'smoking');
check('smoking row before', smokingRow.pointsBefore, 6);
check('smoking row after', smokingRow.pointsAfter, 2);
check('smoking row change', smokingRow.change, -4);
check('deltas sorted by impact', cvdDeltas[0].change <= cvdDeltas[cvdDeltas.length - 1].change, true);
check(
  'factor deltas sum to the raw delta',
  cvdDeltas.reduce((n, d) => n + d.change, 0),
  arc.perCondition.cardiovascular.deltaRaw,
);
check(
  'coupling row appears in the diff',
  Boolean(cvdDeltas.find((d) => d.factorId === 'diabetesCoupling')),
  true,
);
check('unchanged factors are excluded', diffContributions(a.diabetes.contributions, a.diabetes.contributions).length, 0);

// ------------------------------------------------- provenance metadata
console.log(RULE_HEADER);

// These are the assertions that make the provenance drawer trustworthy. If a
// factor could show a rule row whose points disagree with the score it awarded,
// the drawer would be lying, and it would look exactly like a correct one.
let ruleFactors = 0;
for (const persona of PERSONAS) {
  const scored = scoreAll(persona);
  for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
    for (const c of scored[id].contributions) {
      ruleFactors += 1;
      const active = c.rule.rows.filter((r) => r.active);
      check(`${persona.id}/${id}/${c.factorId}: exactly one row fires`, active.length, 1);
      check(
        `${persona.id}/${id}/${c.factorId}: fired row matches the score`,
        active[0]?.points,
        c.points,
      );
      check(
        `${persona.id}/${id}/${c.factorId}: maxPoints is the row ceiling`,
        Math.max(...c.rule.rows.map((r) => r.points)),
        c.maxPoints,
      );
      check(`${persona.id}/${id}/${c.factorId}: every row is labelled`,
        c.rule.rows.every((r) => typeof r.label === 'string' && r.label.length > 0), true);
    }
  }
}
console.log(`  checked ${ruleFactors} factor evaluations`);

// The sex-dependent waist table must declare which reference table it used.
const waistRule = scoreAll(PERSONA_HIGH_RISK).diabetes.contributions.find(
  (c) => c.factorId === 'waist',
).rule;
check('waist rule is sex-referenced', waistRule.kind, 'range-by-sex');
check('waist rule names the male table', waistRule.reference, 'male');
check(
  'female persona gets the female waist table',
  scoreAll(PERSONA_SENIOR).diabetes.contributions.find((c) => c.factorId === 'waist').rule
    .reference,
  'female',
);

// Rule rows must sum-check against the total, per condition.
for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
  const r = scoreAll(PERSONA_HIGH_RISK)[id];
  check(
    `${id}: fired rows sum to raw`,
    r.contributions.reduce((n, c) => n + c.rule.rows.find((x) => x.active).points, 0),
    r.raw,
  );
}

// ------------------------------------------------------------------ done
console.log(
  `\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed\n`,
);
process.exit(failures === 0 ? 0 : 1);
