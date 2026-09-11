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
import { evaluateFindings, caveatFor } from '../src/lib/history/evaluateFindings.js';
import {
  withAnswer,
  withNote,
  completenessOf,
  getNote,
  positiveAnswers,
} from '../src/lib/history/answers.js';
import { QUESTIONS, QUESTION_IDS, NOTE_MAX } from '../src/data/history/questions.js';

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


// ============================================================ health history
//
// Parity with the scoring assertions above. The findings engine is a second
// rule-driven signal on the same page, and the same argument applies to it: a
// drawer that cites a rule which did not actually fire would look exactly like
// a correct one. These checks are what make it trustworthy.

const FLAGS = JSON.parse(readFileSync(join(here, '../src/data/rules/flags.rules.json'), 'utf8'));

const blankHistory = { answers: {}, notes: {} };
const historyWith = (...pairs) =>
  pairs.reduce((acc, [id, v]) => withAnswer(acc, id, v), blankHistory);
const findings = (history) => evaluateFindings(history, FLAGS);

console.log('\n=== Flag table integrity ===');

const qids = new Set(QUESTION_IDS);
const tierIds = new Set(FLAGS.tiers.map((t) => t.id));
const sourceKeys = new Set(Object.keys(FLAGS.sources));
const singleIds = new Set(FLAGS.single.map((f) => f.id));

check('question ids are unique', new Set(QUESTION_IDS).size, QUESTIONS.length);
check('tier ids are unique', tierIds.size, FLAGS.tiers.length);
check('tier ranks are unique', new Set(FLAGS.tiers.map((t) => t.rank)).size, FLAGS.tiers.length);
check('flag ids are unique', singleIds.size, FLAGS.single.length);

for (const f of FLAGS.single) {
  check(`${f.id}: targets a real question`, qids.has(f.questionId), true);
  check(`${f.id}: has a known tier`, tierIds.has(f.tier), true);
  check(`${f.id}: cites a real source`, sourceKeys.has(f.sourceKey), true);
  check(`${f.id}: has a summary`, typeof f.summary === 'string' && f.summary.length > 0, true);
  check(`${f.id}: has a rationale`, typeof f.rationale === 'string' && f.rationale.length > 0, true);
}

for (const c of FLAGS.combinations) {
  check(`${c.id}: has at least two triggers`, c.triggers.length >= 2, true);
  check(`${c.id}: cites a real source`, sourceKeys.has(c.sourceKey), true);
  check(`${c.id}: has a known tier`, tierIds.has(c.tier), true);
  for (const t of c.triggers) {
    check(`${c.id}: trigger ${t.questionId} exists`, qids.has(t.questionId), true);
  }
  for (const sup of c.supersedes) {
    check(`${c.id}: supersedes real flag ${sup}`, singleIds.has(sup), true);
  }
}

for (const cv of FLAGS.caveats) {
  check(`${cv.id}: cites a real source`, sourceKeys.has(cv.sourceKey), true);
  for (const a of cv.anyOf) {
    check(`${cv.id}: trigger ${a.questionId} exists`, qids.has(a.questionId), true);
  }
}

// Every source must be reachable from something, or it is dead weight nobody
// will ever be asked to verify.
const usedSources = new Set([
  ...FLAGS.single.map((f) => f.sourceKey),
  ...FLAGS.combinations.map((c) => c.sourceKey),
  ...FLAGS.caveats.map((c) => c.sourceKey),
]);
check('every source is cited by something', usedSources.size, sourceKeys.size);

for (const [key, src] of Object.entries(FLAGS.sources)) {
  check(`${key}: names an organisation`, typeof src.org === 'string' && src.org.length > 0, true);
  check(
    `${key}: states the claim it supports`,
    typeof src.claim === 'string' && src.claim.length > 0,
    true,
  );
  check(`${key}: declares a verification state`, typeof src.verified === 'boolean', true);
}

console.log(
  `  ${FLAGS.single.length} single rules, ${FLAGS.combinations.length} combinations, ${sourceKeys.size} sources`,
);

// ------------------------------------------------------- firing discipline
console.log('\n=== Findings: what fires and what does not ===');

check('empty history raises nothing', findings(blankHistory).counts.total, 0);
check('empty history raises no caveat', findings(blankHistory).caveats.length, 0);

const allNo = historyWith(...QUESTION_IDS.map((id) => [id, 'no']));
check('every answer "no" raises nothing', findings(allNo).counts.total, 0);

// The reason the third answer state exists. If "not sure" ever fired, the
// questionnaire would be punishing people for honesty about their own records.
const allUnsure = historyWith(...QUESTION_IDS.map((id) => [id, 'unsure']));
check('every answer "not sure" raises nothing', findings(allUnsure).counts.total, 0);
check('"not sure" raises no caveat', findings(allUnsure).caveats.length, 0);

for (const f of FLAGS.single) {
  const fired = findings(historyWith([f.questionId, 'yes']));
  check(`${f.id}: fires on yes`, fired.findings.some((x) => x.id === f.id), true);
  check(`${f.id}: at its declared tier`, fired.findings.find((x) => x.id === f.id)?.tier, f.tier);
  check(`${f.id}: silent on no`, findings(historyWith([f.questionId, 'no'])).counts.total, 0);
  check(`${f.id}: silent on unsure`, findings(historyWith([f.questionId, 'unsure'])).counts.total, 0);
}

// --------------------------------------------------------- combinations
console.log('\n=== Combination rules ===');

for (const c of FLAGS.combinations) {
  const all = historyWith(...c.triggers.map((t) => [t.questionId, t.value]));
  const result = findings(all);

  check(
    `${c.id}: fires when every trigger matches`,
    result.findings.some((f) => f.id === c.id),
    true,
  );

  // The merge. Two answers must produce one finding, not three.
  check(`${c.id}: replaces the flags it supersedes`, result.counts.total, 1);
  check(`${c.id}: the survivor is the combination`, result.findings[0].kind, 'combination');
  for (const sup of c.supersedes) {
    check(`${c.id}: ${sup} is absorbed`, result.findings.some((f) => f.id === sup), false);
  }

  // A partial match must fall back to the individual findings.
  for (const t of c.triggers) {
    const partial = findings(historyWith([t.questionId, 'yes']));
    check(
      `${c.id}: does not fire on ${t.questionId} alone`,
      partial.findings.some((f) => f.id === c.id),
      false,
    );
  }

  // One trigger answered "not sure" must not be enough.
  const withUnsure = historyWith(
    [c.triggers[0].questionId, 'yes'],
    [c.triggers[1].questionId, 'unsure'],
  );
  check(
    `${c.id}: does not fire when a trigger is "not sure"`,
    findings(withUnsure).findings.some((f) => f.id === c.id),
    false,
  );
}

// --------------------------------------------------------------- caveats
console.log('\n=== Prior-event caveat ===');

const afterMI = findings(historyWith(['mh-heart-attack', 'yes']));
const afterStroke = findings(historyWith(['mh-stroke', 'yes']));
const afterBoth = findings(historyWith(['mh-heart-attack', 'yes'], ['mh-stroke', 'yes']));

check('heart attack raises the caveat', Boolean(caveatFor(afterMI, 'cardiovascular')), true);
check('stroke raises the caveat', Boolean(caveatFor(afterStroke, 'cardiovascular')), true);
check('both together raise it once', afterBoth.caveats.length, 1);
check('both together cite both answers', afterBoth.caveats[0].evidence.length, 2);

// The caveat is cardiovascular-only. Prior high glucose is already a scored
// field on the diabetes side, so those instruments are unaffected.
check('diabetes is not caveated', caveatFor(afterMI, 'diabetes'), null);
check('hypertension is not caveated', caveatFor(afterMI, 'hypertension'), null);

// A prior event is context, not a conversation topic — it must not also become
// a tiered finding.
check('prior heart attack raises no finding', afterMI.counts.total, 0);
check('prior stroke raises no finding', afterStroke.counts.total, 0);
check(
  'caveat is silent on "not sure"',
  findings(historyWith(['mh-stroke', 'unsure'])).caveats.length,
  0,
);

// ---------------------------------------------------------- answer store
console.log('\n=== Answer handling ===');

const noted = withNote(withAnswer(blankHistory, 'sh-surgery', 'yes'), 'sh-surgery', 'Knee, 2018');
check('a note is stored against a yes', getNote(noted, 'sh-surgery'), 'Knee, 2018');

// A note surviving a change to "no" would print in the export as a denial with
// supporting detail attached.
check(
  'changing to no drops the note',
  getNote(withAnswer(noted, 'sh-surgery', 'no'), 'sh-surgery'),
  '',
);
check(
  'changing to unsure drops the note',
  getNote(withAnswer(noted, 'sh-surgery', 'unsure'), 'sh-surgery'),
  '',
);
check(
  'clearing the answer drops the note',
  getNote(withAnswer(noted, 'sh-surgery', null), 'sh-surgery'),
  '',
);

const longNote = withNote(blankHistory, 'sh-surgery', 'x'.repeat(400));
check('notes are truncated, not rejected', getNote(longNote, 'sh-surgery').length, NOTE_MAX);

const mixed = historyWith(['mh-cancer', 'yes'], ['mh-clot', 'no'], ['fh-stroke', 'unsure']);
const mixedCounts = completenessOf(mixed);
check('counts: yes', mixedCounts.yes, 1);
check('counts: no', mixedCounts.no, 1);
check('counts: unsure', mixedCounts.unsure, 1);
check('counts: unanswered', mixedCounts.unanswered, QUESTIONS.length - 3);
check(
  'counts sum to the total',
  mixedCounts.yes + mixedCounts.no + mixedCounts.unsure + mixedCounts.unanswered,
  QUESTIONS.length,
);
check('"not sure" counts as answered', mixedCounts.answered, 3);
check('positives list only yes answers', positiveAnswers(mixed).length, 1);

// ------------------------------------------------------- persona findings
console.log('\n=== Persona histories ===');

for (const p of PERSONAS) {
  const c = completenessOf(p.history);
  check(`${p.id}: history is complete`, c.unanswered, 0);
  check(`${p.id}: every answer is valid`, c.answered, QUESTIONS.length);
}

const student = findings(PERSONA_STUDENT.history);
check('student: no findings', student.counts.total, 0);
check('student: no caveat', student.caveats.length, 0);
check('student: nothing uncertain', completenessOf(PERSONA_STUDENT.history).unsure, 0);

const office = findings(PERSONA_OFFICE.history);
check('office: one finding', office.counts.total, 1);
check('office: at the lowest tier', office.counts.mention, 1);
check('office: has an uncertain answer', completenessOf(PERSONA_OFFICE.history).unsure, 1);

const highRisk = findings(PERSONA_HIGH_RISK.history);
check('high-risk: two findings', highRisk.counts.total, 2);
check('high-risk: both at the lowest tier', highRisk.counts.mention, 2);

// THE ARC PROTECTION. The what-if demo ends by moving this persona from High to
// Moderate on all three. A reported prior event would caveat the cardiovascular
// score and make that ending incoherent, so this persona must never have one.
check(
  'high-risk: reports no prior heart attack',
  PERSONA_HIGH_RISK.history.answers['mh-heart-attack'],
  'no',
);
check('high-risk: reports no prior stroke', PERSONA_HIGH_RISK.history.answers['mh-stroke'], 'no');
check('high-risk: carries no caveat', highRisk.caveats.length, 0);

const senior = findings(PERSONA_SENIOR.history);
check('senior: one finding', senior.counts.total, 1);
check('senior: it is discuss-promptly', senior.counts.promptly, 1);
check('senior: raised by the combination rule', senior.findings[0].id, 'c-glycaemic');
check('senior: from two answers', senior.findings[0].evidence.length, 2);
check('senior: carries the cardiovascular caveat', Boolean(caveatFor(senior, 'cardiovascular')), true);
check('senior: the caveat cites her stroke', senior.caveats[0].evidence[0].questionId, 'mh-stroke');
check('senior: the caveat carries her note', senior.caveats[0].evidence[0].note, '2019');

// -------------------------------------------------- provenance integrity
//
// The findings-side equivalent of the rule-row assertions above: every finding
// on screen must be traceable to answers that genuinely say what it claims.
console.log('\n=== Findings provenance ===');

let evidenceRows = 0;
for (const p of PERSONAS) {
  const r = findings(p.history);
  for (const f of r.findings) {
    evidenceRows += f.evidence.length;
    check(`${p.id}/${f.id}: cites at least one answer`, f.evidence.length >= 1, true);
    check(
      `${p.id}/${f.id}: every cited answer is "yes"`,
      f.evidence.every((e) => e.answer === 'yes'),
      true,
    );
    check(`${p.id}/${f.id}: cites a source`, Boolean(f.source && f.source.key), true);
    check(`${p.id}/${f.id}: the source exists in the table`, sourceKeys.has(f.source.key), true);
    check(
      `${p.id}/${f.id}: has a tier label`,
      typeof f.tierLabel === 'string' && f.tierLabel.length > 0,
      true,
    );
  }
  for (const cv of r.caveats) {
    check(`${p.id}/${cv.id}: cites at least one answer`, cv.evidence.length >= 1, true);
    check(
      `${p.id}/${cv.id}: every cited answer is "yes"`,
      cv.evidence.every((e) => e.answer === 'yes'),
      true,
    );
  }
}
console.log(`  checked ${evidenceRows} evidence rows`);

// Findings are sorted most-serious first, which is what the banner and the
// export both assume.
const ordered = findings(
  historyWith(['cc-cholesterol', 'yes'], ['sx-chest-discomfort', 'yes'], ['ls-alcohol', 'yes']),
);
check(
  'findings are ordered by tier',
  ordered.findings.map((f) => f.tier).join(','),
  'promptly,soon,mention',
);

// ------------------------------------------------- scoring is untouched
//
// The load-bearing claim of this whole feature. Answering the questionnaire
// must not move a single risk point.
console.log('\n=== History does not affect scoring ===');

for (const p of PERSONAS) {
  const withoutHistory = { ...p };
  delete withoutHistory.history;
  const a = scoreAll(p);
  const b = scoreAll(withoutHistory);
  for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
    check(`${p.id}/${id}: raw unchanged by history`, a[id].raw, b[id].raw);
    check(`${p.id}/${id}: index unchanged by history`, a[id].index, b[id].index);
    check(`${p.id}/${id}: band unchanged by history`, a[id].band, b[id].band);
  }
}

// An all-yes history is the worst case, and must still move nothing.
const alarming = {
  ...PERSONA_STUDENT,
  history: historyWith(...QUESTION_IDS.map((id) => [id, 'yes'])),
};
for (const id of ['diabetes', 'hypertension', 'cardiovascular']) {
  check(
    `all-yes history leaves ${id} raw alone`,
    scoreAll(alarming)[id].raw,
    scoreAll(PERSONA_STUDENT)[id].raw,
  );
  check(
    `all-yes history leaves ${id} index alone`,
    scoreAll(alarming)[id].index,
    scoreAll(PERSONA_STUDENT)[id].index,
  );
}

// ------------------------------------------------------ source verification
const unverified = Object.entries(FLAGS.sources).filter(([, src]) => src.verified !== true);
const weak = Object.entries(FLAGS.sources).filter(([, src]) => src.weak);
console.log('\n=== Source verification ===');
console.log(`  ${sourceKeys.size - unverified.length} of ${sourceKeys.size} sources verified`);
if (unverified.length > 0) {
  console.log(`  PENDING: ${unverified.map(([k]) => k).join(', ')}`);
  console.log('  These render as "source pending verification" in the app until checked.');
}
if (weak.length > 0) {
  console.log(`  FLAGGED AS WEAK: ${weak.map(([k]) => k).join(', ')}`);
}

// ------------------------------------------------------------------ done

console.log(
  `\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed\n`,
);
process.exit(failures === 0 ? 0 : 1);
