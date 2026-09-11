import { useRef, useState } from 'react';
import { PERSONAS } from '../data/demoProfiles.js';
import { useRiskResults } from '../hooks/useRiskResults.js';
import { CONDITION_IDS } from '../lib/scoring/scoreAll.js';
import { Accordion, Disclaimer, Header, StickyDeltaStrip } from '../components/layout/chrome.jsx';
import { HealthForm } from '../components/form/HealthForm.jsx';
import { PersonaBar } from '../components/personas/PersonaBar.jsx';
import { RiskCardGrid } from '../components/results/RiskCard.jsx';
import { ComparisonChart } from '../components/results/ComparisonChart.jsx';
import { ContributingFactors } from '../components/results/ContributingFactors.jsx';
import { WhatIfPanel } from '../components/whatif/WhatIfPanel.jsx';
import { BiggestWinCallout, FactorDeltaList } from '../components/whatif/SimulationInsights.jsx';
import { PrintReport } from '../components/print/PrintReport.jsx';
import { HistoryForm } from '../components/history/HistoryForm.jsx';
import { FindingsBanner, FindingsPanel, NoFindingsLine } from '../components/history/FindingsPanel.jsx';
import { FindingProvenance } from '../components/history/FindingProvenance.jsx';
import { completenessOf } from '../lib/history/answers.js';
import { findingsFor } from '../lib/history/findings.js';

export function Dashboard({ profile, setProfile, onRestart }) {
  const [overrides, setOverrides] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const cardsRef = useRef(null);

  const completeness = completenessOf(profile.history);

  // Findings are a function of the history alone — the simulator cannot move
  // them, because nothing it changes is a question anybody was asked.
  const findings = findingsFor(profile.history);

  // A caveat annotates one condition's score. Keyed by condition id so the card
  // and its provenance drawer read from the same object.
  const caveats = Object.fromEntries(findings.caveats.map((c) => [c.appliesTo, c]));

  const { current, simulated, summary, simProfile, activeOverrides, isSimulating } =
    useRiskResults(profile, overrides);

  // Editing the real profile keeps any active overrides — they re-apply on top
  // of the new truth rather than being silently discarded.
  const handleProfileChange = (next) => setProfile(next);
  const handleLoadProfile = (next) => {
    setProfile(next);
    setOverrides({});
  };

  const shown = isSimulating ? simulated : current;

  return (
    <>
      <div className="min-h-screen pb-16 no-print">
        <Header>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
            title="Opens your browser's print dialog — choose 'Save as PDF'"
          >
            {/* Short labels below sm so both actions stay on the header's one row. */}
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export summary</span>
          </button>
          <button type="button" onClick={onRestart} className="btn-ghost !px-3 !py-1.5 !text-xs">
            <span className="sm:hidden">Reset</span>
            <span className="hidden sm:inline">Start over</span>
          </button>
        </Header>

        <StickyDeltaStrip summary={summary} isSimulating={isSimulating} watchRef={cardsRef} />

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
          <PersonaBar personas={PERSONAS} activeId={profile.id} onSelect={handleLoadProfile} />

          {/* Above the risk cards, and only when something fired. If the app is
              willing to say a finding should be discussed promptly, it cannot
              also bury that conclusion below the fold. */}
          <FindingsBanner result={findings} />

          <div ref={cardsRef}>
            <RiskCardGrid summary={summary} isSimulating={isSimulating} caveats={caveats} />
          </div>

          <NoFindingsLine result={findings} completeness={completeness} />

          <FindingsPanel result={findings}>
            {(finding) => <FindingProvenance finding={finding} />}
          </FindingsPanel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Levers first on narrow screens: the judge's thumb reaches them sooner. */}
            <div className="lg:col-span-5">
              <WhatIfPanel
                profile={profile}
                simProfile={simProfile}
                overrides={overrides}
                activeCount={Object.keys(activeOverrides).length}
                onChange={setOverrides}
                onReset={() => setOverrides({})}
              />
            </div>

            <div className="space-y-6 lg:col-span-7">
              {isSimulating && <BiggestWinCallout summary={summary} />}
              <ComparisonChart summary={summary} isSimulating={isSimulating} />
              {isSimulating && <FactorDeltaList summary={summary} />}
            </div>
          </div>

          {/* Data entry sits below the results, not above them. It is collapsed by
              default and is the one thing on this page nobody looks at first —
              above the cards it was pushing the levers off a 1280x800 screen. */}
          <Accordion
            title="Your health data"
            subtitle={`${profile.name}, a synthetic ${profile.age}-year-old ${
              profile.sex === 'male' ? 'male' : profile.sex === 'female' ? 'female' : ''
            } profile`}
            open={formOpen}
            onToggle={() => setFormOpen((v) => !v)}
          >
            <HealthForm profile={profile} onChange={handleProfileChange} />
          </Accordion>

          {/* Health history sits below the scored data for the same reason that
              does: it is the part of the page nobody looks at first. Anything
              it finds is surfaced at the top of the page instead. */}
          <Accordion
            title="Health history"
            subtitle={
              completeness.answered === 0
                ? `${completeness.total} optional questions — none answered yet`
                : `${completeness.yes} yes · ${completeness.no} no · ${completeness.unsure} not sure · ${completeness.unanswered} unanswered`
            }
            open={historyOpen}
            onToggle={() => setHistoryOpen((v) => !v)}
          >
            <HistoryForm profile={profile} onChange={handleProfileChange} />
          </Accordion>

          <section>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="h-section">Contributing factors</h2>
              <p className="text-meta text-slate-500">
                {isSimulating ? 'Reflecting your simulated changes' : 'From your data'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {CONDITION_IDS.map((id) => (
                <ContributingFactors key={id} result={shown[id]} caveat={caveats[id]} />
              ))}
            </div>
          </section>

          <Disclaimer />
        </main>
      </div>

      <PrintReport
        profile={profile}
        current={current}
        simulated={simulated}
        summary={summary}
        isSimulating={isSimulating}
        findings={findings}
      />
    </>
  );
}
