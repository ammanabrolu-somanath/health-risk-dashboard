import { QUESTION_IDS, questionById } from '../../data/history/questions.js';
import { getAnswer, getNote } from './answers.js';

/**
 * The findings engine.
 *
 * Takes health-history answers and a rule table, returns the findings they
 * raise. Structurally this is the twin of `scoreCondition`: rules arrive as an
 * argument rather than an import, so the plain-node verification script can
 * exercise it without Vite's JSON loader — and, as there, the reasoning behind
 * each result is emitted here rather than recomputed by the UI, so the
 * provenance drawer is a pure renderer and cannot drift from the finding
 * above it.
 *
 * IT SCORES NOTHING. No output of this module reaches `scoreAll`. A finding and
 * a risk index are two separate signals about the same person, and the only
 * place they touch is the caveat, which annotates a score without changing it.
 *
 * TWO RULES THAT MATTER:
 *
 *   "not sure" never fires. Neither does unanswered. Only an explicit "yes"
 *   raises anything, which is why the third answer state had to exist.
 *
 *   A combination REPLACES the findings it supersedes rather than adding to
 *   them, so one clinical picture is raised once. Without that, answering yes
 *   to chest discomfort and breathlessness would produce three findings from
 *   two answers.
 */

const RANK = { promptly: 3, soon: 2, mention: 1 };

function tierOf(rules, tierId) {
  return rules.tiers.find((t) => t.id === tierId) ?? null;
}

function sourceOf(rules, key) {
  const s = rules.sources[key];
  if (!s) return null;
  return { key, ...s };
}

/** Schedule position, used to order findings that share a tier. */
function positionOf(questionId) {
  const i = QUESTION_IDS.indexOf(questionId);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** The answered question behind a finding, with everything the drawer needs. */
function evidenceFor(history, questionId) {
  const q = questionById(questionId);
  return {
    questionId,
    text: q?.text ?? questionId,
    window: q?.window ?? null,
    section: q?.section ?? null,
    answer: getAnswer(history, questionId),
    note: getNote(history, questionId),
  };
}

function matches(history, trigger) {
  return getAnswer(history, trigger.questionId) === trigger.value;
}

/**
 * @param {object} history  profile.history
 * @param {object} rules    the flags rule table
 */
export function evaluateFindings(history, rules) {
  // 1. Combinations first — they decide which singles are suppressed.
  const combinations = rules.combinations.filter((c) =>
    c.triggers.every((t) => matches(history, t)),
  );

  const superseded = new Set();
  for (const c of combinations) for (const id of c.supersedes) superseded.add(id);

  // 2. Singles, minus anything a combination has already absorbed.
  const singles = rules.single.filter(
    (f) => getAnswer(history, f.questionId) === 'yes' && !superseded.has(f.id),
  );

  const findings = [
    ...combinations.map((c) => ({
      id: c.id,
      kind: 'combination',
      label: c.label,
      tier: c.tier,
      tierLabel: tierOf(rules, c.tier)?.label ?? c.tier,
      rank: RANK[c.tier] ?? 0,
      summary: c.summary,
      rationale: c.rationale,
      source: sourceOf(rules, c.sourceKey),
      evidence: c.triggers.map((t) => evidenceFor(history, t.questionId)),
      supersedes: c.supersedes,
      position: Math.min(...c.triggers.map((t) => positionOf(t.questionId))),
    })),
    ...singles.map((f) => ({
      id: f.id,
      kind: 'single',
      label: null,
      tier: f.tier,
      tierLabel: tierOf(rules, f.tier)?.label ?? f.tier,
      rank: RANK[f.tier] ?? 0,
      summary: f.summary,
      rationale: f.rationale,
      source: sourceOf(rules, f.sourceKey),
      evidence: [evidenceFor(history, f.questionId)],
      supersedes: [],
      position: positionOf(f.questionId),
    })),
  ].sort((a, b) => b.rank - a.rank || a.position - b.position);

  // 3. Caveats. Separate from tiers entirely — a prior event is not a finding
  //    to discuss, it is context that changes whether the instrument applies.
  const caveats = rules.caveats
    .filter((cv) => cv.anyOf.some((a) => matches(history, a)))
    .map((cv) => ({
      id: cv.id,
      appliesTo: cv.appliesTo,
      short: cv.short,
      long: cv.long,
      source: sourceOf(rules, cv.sourceKey),
      evidence: cv.anyOf
        .filter((a) => matches(history, a))
        .map((a) => evidenceFor(history, a.questionId)),
    }));

  const counts = { promptly: 0, soon: 0, mention: 0, total: findings.length };
  for (const f of findings) counts[f.tier] += 1;

  const sourceKeys = new Set(findings.map((f) => f.source?.key).filter(Boolean));
  for (const cv of caveats) if (cv.source?.key) sourceKeys.add(cv.source.key);

  return {
    findings,
    caveats,
    counts,
    /** Highest tier present, or null when nothing fired. Drives the banner. */
    topTier: findings.length > 0 ? findings[0].tier : null,
    /** Cited sources still awaiting verification, among findings actually raised. */
    unverifiedSources: [...sourceKeys].filter((k) => rules.sources[k]?.verified !== true),
  };
}

/** The caveat for one condition, if any. Used by the risk card, PDF and drawer. */
export function caveatFor(result, conditionId) {
  return result.caveats.find((cv) => cv.appliesTo === conditionId) ?? null;
}

/** Every tier that has at least one finding, highest first. */
export function tiersPresent(result, rules) {
  return rules.tiers
    .slice()
    .sort((a, b) => b.rank - a.rank)
    .filter((t) => result.findings.some((f) => f.tier === t.id));
}
