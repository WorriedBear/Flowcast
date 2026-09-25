import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Ext, copyText, usePageTitle } from '../components/ui';
import { REPO_URL } from '../config';

const STEPS = [
  { id: 'Empathize', tools: 'Claude (web research)', prompts: ['Intuit Enterprise Suite 2026 AI agents new features', 'Intuit App Partner Program API tiers CorePlus pricing', 'NetSuite Next AI agents SuiteAgent MCP 2026', 'survey finance teams cash forecasting spreadsheets 2025', 'mid-market FX risk unhedged survey 2025', 'AI-native ERP startups Rillet Campfire DualEntry', 'Shopify app store revenue share'], worked: 'Findings were synthesized into evidence items R1–R19, each with a source link.', rejected: 'Uncited statistics and vendor claims without a named survey were dropped or labeled as vendor research.' },
  { id: 'Define', tools: 'Claude', prompts: ['Using R1–R19, write personas and jobs-to-be-done for a mid-market CFO, a controller, a fintech developer and a treasury advisor. Mark every quote as a composite.', 'Write a one-sentence D4D problem statement for mid-market cash and FX forecasting.'], worked: 'Persona + JTBD framing and the problem statement on the Research page.', rejected: 'A generic "AI for all finance workflows" framing: too broad to prototype credibly.' },
  { id: 'Ideate', tools: 'Claude', prompts: ['Propose three wedges for an AI-powered IES platform. For each: user, data advantage, competitive gap, why now, and what would kill it.'], worked: 'Chose the cash & FX forecasting agent: it uses IES’s unified data, rides the multi-currency beta and plays to the builder’s FX background.', rejected: 'Multi-entity close automation (crowded; Intuit already ships AI close features, R3). Marketplace-first (cold start).' },
  { id: 'Prototype', tools: 'Claude (spec), Claude Code (build)', prompts: ['Turn the case, research and decisions into a build spec: routes, interaction inventory with IDs, data anchors and unit tests.', 'Build the spec as a front-end-only React app. Write the data layer and tests first; no stubs, no dead links.'], worked: 'This app: a deterministic engine with tests, then the UI on top.', rejected: 'Live LLM calls: unreliable during judging, and "the LLM explains, the engine calculates" is itself a product principle.' },
  { id: 'Experiment', tools: 'Claude', prompts: ['List the five riskiest assumptions behind FlowCast with a cheap test, a success threshold and a kill criterion for each.'], worked: 'The riskiest-assumptions board on the Strategy page.', rejected: 'Tests that needed production data access Intuit would not grant in a pilot.' },
];
const LIBRARY = [
  ['Research synthesis', 'Summarize each source into a single paraphrased claim with date, source name and URL. Flag secondary and vendor sources. Output as R1..Rn.'],
  ['Persona builder', 'Using only the evidence items, write four personas with goals, pains, a day in the life, a JTBD and one composite quote each.'],
  ['Wedge evaluation', 'Score three product wedges on customer pain, IES data advantage, competitive gap and prototype feasibility. Recommend one and say what you rejected.'],
  ['Data anchors', 'Design weekly line items for five entities so the consolidated 13-week closing cash hits these anchors within ±$0.05M and W7 is the minimum.'],
  ['Interaction inventory', 'For every page, list each interactive element with an ID, the element and its exact observable behavior.'],
  ['Honesty pass', 'Review the copy: every assumed number needs an assumption note, every fact a source link, every quote a composite label.'],
];

export default function AiProcess() {
  usePageTitle('How I used AI', 'The design-for-delight process and prompts behind FlowCast.');
  const [step, setStep] = useState(0);
  const [openLib, setOpenLib] = useState<number | null>(0);
  const s = STEPS[step];
  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
      <header>
        <h1 className="text-[28px] font-semibold text-ink md:text-[40px] md:leading-[46px]">How I used AI</h1>
        <p className="mt-2 text-muted">Intuit&apos;s Design for Delight, with the tools, the exact prompts, what worked and what I rejected at each step.</p>
      </header>
      <ol className="flex flex-wrap gap-2" role="tablist">
        {STEPS.map((x, i) => <li key={x.id}><button type="button" role="tab" aria-selected={i === step} onClick={() => setStep(i)} className={`rounded-full border px-3 py-1 text-sm ${i === step ? 'border-action bg-action text-white' : 'border-rule bg-surface hover:border-action'}`}>{i + 1}. {x.id}</button></li>)}
      </ol>
      <section className="panel p-5">
        <h2 className="text-xl font-semibold">{s.id}</h2>
        <p className="mt-1 text-sm text-muted">Tools: {s.tools}</p>
        <h3 className="mt-4 text-sm font-semibold">{s.id === 'Empathize' ? 'Queries run' : 'Prompts used'}</h3>
        <div className="mt-2 space-y-2">
          {s.prompts.map((p) => <div key={p} className="flex items-start gap-2 rounded-ctl bg-[#0A1626] p-2"><code className="flex-1 whitespace-pre-wrap font-mono text-xs text-[#E6EDF5]">{p}</code><Button size="sm" variant="ghost" onClick={() => copyText(p, 'Prompt copied')}>Copy</Button></div>)}
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-ctl bg-[color-mix(in_srgb,var(--cash)_10%,transparent)] p-3"><div className="font-semibold text-cash">What worked</div><p className="mt-1">{s.worked}</p></div>
          <div className="rounded-ctl bg-[color-mix(in_srgb,var(--risk)_8%,transparent)] p-3"><div className="font-semibold text-risk">Rejected, and why</div><p className="mt-1">{s.rejected}</p></div>
        </div>
        {s.id === 'Experiment' && <p className="mt-3 text-sm">See the board: <Link to="/strategy#experiments" className="link">Strategy · riskiest assumptions</Link>.</p>}
        <div className="mt-4 flex gap-2"><Button size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous step</Button><Button size="sm" variant="primary" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next step</Button></div>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Prompt library</h2>
        <div className="mt-3 divide-y divide-[var(--rule)] rounded-panel border border-rule bg-surface">
          {LIBRARY.map(([t, p], i) => (
            <div key={t}>
              <button type="button" aria-expanded={openLib === i} onClick={() => setOpenLib(openLib === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium">{t}<span className="text-muted">{openLib === i ? 'Hide' : 'Show'}</span></button>
              {openLib === i && <div className="flex items-start gap-2 px-4 pb-4"><code className="flex-1 whitespace-pre-wrap rounded-ctl bg-[#0A1626] p-2 font-mono text-xs text-[#E6EDF5]">{p}</code><Button size="sm" variant="ghost" onClick={() => copyText(p, 'Prompt copied')}>Copy</Button></div>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm">The full build spec Claude Code worked from: <a href="/build-spec.md" download className="link">download build-spec.md</a>. Source code: <Ext href={REPO_URL}>GitHub repository</Ext>.</p>
      </section>
    </div>
  );
}
