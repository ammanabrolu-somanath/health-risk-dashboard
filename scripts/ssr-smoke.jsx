/* Render every screen AND every simulation state to a string.
   Any component that throws fails this check. */
import { renderToString } from 'react-dom/server';
import { Landing } from '../src/pages/Landing.jsx';
import { PersonaBar } from '../src/components/personas/PersonaBar.jsx';
import { PrintReport } from '../src/components/print/PrintReport.jsx';
import { Dashboard } from '../src/pages/Dashboard.jsx';
import { RiskCardGrid } from '../src/components/results/RiskCard.jsx';
import { ComparisonChart } from '../src/components/results/ComparisonChart.jsx';
import { ContributingFactors } from '../src/components/results/ContributingFactors.jsx';
import { WhatIfPanel } from '../src/components/whatif/WhatIfPanel.jsx';
import {
  BiggestWinCallout,
  FactorDeltaList,
} from '../src/components/whatif/SimulationInsights.jsx';
import { HistoryForm } from '../src/components/history/HistoryForm.jsx';
import {
  FindingsBanner,
  FindingsPanel,
  NoFindingsLine,
} from '../src/components/history/FindingsPanel.jsx';
import { FindingProvenance } from '../src/components/history/FindingProvenance.jsx';
import {
  PERSONAS,
  PERSONA_HIGH_RISK,
  PERSONA_STUDENT,
  PERSONA_SENIOR,
} from '../src/data/demoProfiles.js';
import { findingsFor } from '../src/lib/history/findings.js';
import { completenessOf } from '../src/lib/history/answers.js';
import { scoreAll } from '../src/lib/scoring/scoreAll.js';
import { applyOverrides, activeOverrides } from '../src/lib/simulation/applyOverrides.js';
import { summarizeSimulation } from '../src/lib/simulation/summarizeSimulation.js';

const noop = () => {};

function scenario(profile, overrides) {
  const sim = applyOverrides(profile, overrides);
  return {
    profile,
    simProfile: sim,
    overrides,
    active: activeOverrides(profile, overrides),
    summary: summarizeSimulation(scoreAll(profile), scoreAll(sim)),
  };
}

// Every edge case named in the plan, plus the demo arc.
const scenarios = {
  'no overrides': scenario(PERSONA_HIGH_RISK, {}),
  'single change': scenario(PERSONA_HIGH_RISK, { smoking: 'former' }),
  'full demo arc': scenario(PERSONA_HIGH_RISK, { smoking: 'former', activityMinutes: 150, weightKg: 83 }),
  'change makes it worse': scenario(PERSONA_STUDENT, { weightKg: 95, smoking: 'current' }),
  'no-op override': scenario(PERSONA_HIGH_RISK, { smoking: 'current' }),
  'already-low profile': scenario(PERSONA_STUDENT, { activityMinutes: 300 }),
};

let bad = 0;
const attempt = (name, fn) => {
  try {
    const html = fn();
    console.log(`  ok   ${name.padEnd(38)} ${String(html.length).padStart(6)} chars`);
  } catch (err) {
    bad += 1;
    console.error(`  FAIL ${name}\n       ${err.message}`);
  }
};

console.log('\n=== Pages ===');
attempt('landing', () => renderToString(<Landing onStart={noop} />));
attempt('dashboard', () =>
  renderToString(<Dashboard profile={PERSONA_HIGH_RISK} setProfile={noop} onRestart={noop} />),
);
attempt('persona bar', () =>
  renderToString(
    <PersonaBar personas={PERSONAS} activeId={PERSONA_HIGH_RISK.id} onSelect={noop} />,
  ),
);
attempt('persona bar (nothing active)', () =>
  renderToString(<PersonaBar personas={PERSONAS} activeId={undefined} onSelect={noop} />),
);

for (const [name, s] of Object.entries(scenarios)) {
  const simulating = Object.keys(s.active).length > 0;
  console.log(`\n=== ${name} (${simulating ? 'simulating' : 'idle'}) ===`);

  attempt('  risk cards', () =>
    renderToString(<RiskCardGrid summary={s.summary} isSimulating={simulating} />),
  );
  attempt('  comparison chart', () =>
    renderToString(<ComparisonChart summary={s.summary} isSimulating={simulating} />),
  );
  attempt('  what-if panel', () =>
    renderToString(
      <WhatIfPanel
        profile={s.profile}
        simProfile={s.simProfile}
        overrides={s.overrides}
        activeCount={Object.keys(s.active).length}
        onChange={noop}
        onReset={noop}
      />,
    ),
  );
  attempt('  biggest win', () => renderToString(<BiggestWinCallout summary={s.summary} />));
  attempt('  factor delta list', () => renderToString(<FactorDeltaList summary={s.summary} />));
  attempt('  contributing factors', () =>
    renderToString(
      <>
        {['diabetes', 'hypertension', 'cardiovascular'].map((id) => (
          <ContributingFactors key={id} result={s.summary.perCondition[id].simulated} />
        ))}
      </>,
    ),
  );
  attempt('  print report', () =>
    renderToString(
      <PrintReport
        profile={s.profile}
        current={s.summary.list.reduce((acc, c) => ({ ...acc, [c.id]: c.current }), {})}
        simulated={s.summary.list.reduce((acc, c) => ({ ...acc, [c.id]: c.simulated }), {})}
        summary={s.summary}
        isSimulating={simulating}
        findings={findingsFor(s.profile.history)}
      />,
    ),
  );
  attempt('  provenance drawer (expanded)', () =>
    renderToString(
      <>
        {['diabetes', 'hypertension', 'cardiovascular'].map((id) => (
          <ContributingFactors
            key={id}
            result={s.summary.perCondition[id].simulated}
            initialProvenanceOpen
            caveat={findingsFor(s.profile.history).caveats.find((c) => c.appliesTo === id)}
          />
        ))}
      </>,
    ),
  );
}

// Health history renders against every persona, including the empty history a
// hand-written profile would have. The Senior Citizen is the one that fires a
// combination rule AND a caveat, so she exercises the most code here.
console.log(`
=== Health history ===`);
const historyProfiles = [
  ...PERSONAS,
  { ...PERSONA_STUDENT, id: 'no-history', name: 'Profile with no history', history: undefined },
];

for (const p of historyProfiles) {
  const result = findingsFor(p.history);
  const completeness = completenessOf(p.history);

  attempt(`  form: ${p.name}`, () =>
    renderToString(<HistoryForm profile={p} onChange={noop} />),
  );
  attempt(`  banner: ${p.name} (${result.counts.total})`, () =>
    renderToString(<FindingsBanner result={result} />),
  );
  attempt(`  no-findings line: ${p.name}`, () =>
    renderToString(<NoFindingsLine result={result} completeness={completeness} />),
  );
  attempt(`  panel + drawers: ${p.name}`, () =>
    renderToString(
      <FindingsPanel result={result}>
        {(finding) => <FindingProvenance finding={finding} />}
      </FindingsPanel>,
    ),
  );
}

attempt('  dashboard: persona with caveat', () =>
  renderToString(<Dashboard profile={PERSONA_SENIOR} setProfile={noop} onRestart={noop} />),
);

console.log(bad === 0 ? '\nSSR smoke: PASS\n' : `\nSSR smoke: FAIL (${bad})\n`);
if (bad) process.exit(1);
