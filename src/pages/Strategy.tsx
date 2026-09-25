import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssumptionBadge, Ext, usePageTitle } from '../components/ui';
import { THESIS, factById } from '../data/research';
import { POSITIONING_LINE } from '../config';

const TOC = [
  ['thesis', 'Thesis'], ['vision', 'Vision'], ['pillars', 'Pillars'], ['moat', 'Why IES wins'], ['operating-model', 'Human + AI model'], ['platform', 'Platform flywheel'],
  ['prioritization', 'Prioritization'], ['roadmap', 'Roadmap'], ['business-model', 'Business model'], ['metrics', 'Metrics'], ['experiments', 'Riskiest assumptions'],
  ['risks', 'Risks'], ['competition', 'Competition'], ['trade-offs', 'Trade-offs'],
];
const RICE = [
  ['Consolidated 13-week forecast + lineage', 9, 3, 0.9, 3], ['AI brief with citations', 9, 2, 0.8, 2], ['FX exposure + netting', 7, 3, 0.8, 3], ['Scenario Lab', 7, 2, 0.8, 3],
  ['Approvals + policy engine', 8, 2, 0.8, 2], ['Forecast Signals API + sandbox', 6, 3, 0.6, 4], ['Expert escalation + advisor workspace', 5, 2, 0.7, 3],
  ['Marketplace + revenue share', 6, 3, 0.5, 6], ['Partner FX execution', 3, 3, 0.4, 6], ['Autonomous hedging', 2, 3, 0.2, 8],
] as const;
const moscow = (f: string, s: number) => (f === 'Autonomous hedging' ? "Won't (now)" : s >= 5 ? 'Must' : s >= 2.5 ? 'Should' : 'Could');

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-20 rule-b py-8"><h2 className="text-xl font-semibold text-ink md:text-[22px]">{title}</h2><div className="mt-3 space-y-3 text-[15px] leading-relaxed">{children}</div></section>;
}
const R = ({ id }: { id: string }) => { const f = factById(id); return <Ext href={f.url}>{id}</Ext>; };

export default function Strategy() {
  usePageTitle('Strategy', 'Vision, pillars, prioritization, roadmap, business model, metrics and risks for FlowCast.');
  const [sort, setSort] = useState<'score' | 'name'>('score');
  const rice = useMemo(() => RICE.map(([f, r, i, c, e]) => ({ f, r, i, c, e, s: (r * i * c) / e })).sort((a, b) => (sort === 'name' ? a.f.localeCompare(b.f) : b.s - a.s)), [sort]);
  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="On this page" className="hidden lg:block"><ul className="sticky top-20 space-y-1 text-sm">{TOC.map(([id, l]) => <li key={id}><a href={`#${id}`} className="text-muted hover:text-action">{l}</a></li>)}</ul></nav>
      <article className="min-w-0 max-w-4xl">
        <h1 className="text-[28px] font-semibold text-ink md:text-[40px] md:leading-[46px]">FlowCast strategy</h1>
        <p className="mt-2 text-muted">How Intuit Enterprise Suite becomes an AI-powered finance and business platform for the mid-market, starting with cash and currency.</p>

        <Section id="thesis" title="IES should win forward-looking cash and currency decisions, then open that graph to others.">
          <blockquote className="border-l-4 border-action pl-4 text-lg">{THESIS}</blockquote>
          <p className="border-l-2 border-ai pl-3">{POSITIONING_LINE}</p>
          <p className="text-sm text-muted">Evidence: spreadsheets dominate planning (<R id="R11" />, <R id="R12" />), FX losses are near-universal (<R id="R15" />), and IES now has multi-currency and conversational AI (<R id="R3" />).</p>
        </Section>

        <Section id="vision" title="IES becomes where mid-market finance teams decide the future, not just record the past.">
          <p>Today IES records transactions across entities. FlowCast turns that ledger into a forward-looking decision surface: what cash will be, in which currency, and what to do about it, with humans approving every consequential move.</p>
        </Section>

        <Section id="pillars" title="Four pillars turn the vision into product.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Agents that do the work', 'The agent consolidates, forecasts and drafts on its own.', 'Morning brief, autonomous refresh, collection drafts.', '/app'],
              ['Trust by design', 'A deterministic engine calculates; AI only explains, with citations.', 'Source chips, confidence, abstain rule, audit log.', '/app/trust'],
              ['An open financial graph', 'Developers read the forecast and post signals into it.', 'Signals API, sandbox, evals, marketplace.', '/dev'],
              ['Experts in the loop', 'Consequential decisions route to certified advisors.', 'Escalate modal → advisor workspace → approval.', '/advisor'],
            ].map(([t, m, p, to]) => <div key={t} className="rounded-panel border border-rule bg-surface p-4"><div className="font-semibold">{t}</div><p className="mt-1 text-sm"><span className="text-muted">What it means:</span> {m}</p><p className="mt-1 text-sm"><span className="text-muted">How FlowCast proves it:</span> <Link to={to} className="link">{p}</Link></p></div>)}
          </div>
        </Section>

        <Section id="moat" title="IES has assets incumbents and entrants lack at the same time.">
          <ul className="list-disc space-y-1 pl-5">
            <li>Unified ledger, payroll, commerce and bank data in one product (<R id="R1" />).</li>
            <li>Native multi-currency on one permissioned rate table with an audit log (<R id="R3" />).</li>
            <li>An existing human + AI expert network (<R id="R6" />).</li>
            <li>Accounting firms already building agents on the platform (<R id="R4" />).</li>
            <li>The Anthropic partnership for custom agents (<R id="R5" />).</li>
          </ul>
        </Section>

        <Section id="operating-model" title="Autonomy is earned per task, and money never moves without a human.">
          <div className="scroll-x"><table className="data"><thead><tr><th>Tier</th><th>Meaning</th><th>Examples</th></tr></thead><tbody>
            <tr><td className="font-medium">Autonomous</td><td>Acts without asking, logs everything</td><td>Consolidation, rate refresh, forecast refresh, anomaly detection, collection drafts</td></tr>
            <tr><td className="font-medium">Suggest & approve</td><td>Proposes; a human clicks Approve</td><td>Intercompany transfers, hedges under the threshold, payment timing</td></tr>
            <tr><td className="font-medium">Expert required</td><td>Routed to an expert, then approval</td><td>Hedges at or above the threshold, anything outside policy</td></tr>
            <tr><td className="font-medium">Never autonomous</td><td>Hard-locked</td><td>Moving money or executing trades: always a licensed partner after approval</td></tr>
          </tbody></table></div>
          <p className="text-sm">Trust mechanics: deterministic engine, source chips on every claim, confidence with a 70% abstain threshold, scoped and revocable third-party permissions, and a complete audit log. <Link to="/app/trust" className="link">See the Trust Center</Link>.</p>
        </Section>

        <Section id="platform" title="Every signal a developer adds makes the forecast better for every CFO.">
          <svg viewBox="0 0 640 300" className="w-full max-w-2xl" role="img" aria-label="Platform flywheel diagram">
            <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#236CFF" /></marker></defs>
            {[[230, 40, 'More signals'], [400, 130, 'Better forecasts'], [230, 220, 'More CFO usage'], [60, 130, 'Bigger market for developers']].map(([x, y, t]) => <g key={t as string}><rect x={x as number} y={y as number} width="170" height="40" rx="8" fill="#FFFFFF" stroke="#DDE3EA" /><text x={(x as number) + 85} y={(y as number) + 25} textAnchor="middle" fontSize="13" fill="#0E2A47">{t}</text></g>)}
            <path d="M400 60 Q480 70 485 125" stroke="#236CFF" strokeWidth="2" fill="none" markerEnd="url(#ar)" />
            <path d="M485 170 Q480 230 402 238" stroke="#236CFF" strokeWidth="2" fill="none" markerEnd="url(#ar)" />
            <path d="M230 240 Q150 235 145 172" stroke="#236CFF" strokeWidth="2" fill="none" markerEnd="url(#ar)" />
            <path d="M145 128 Q150 65 228 60" stroke="#236CFF" strokeWidth="2" fill="none" markerEnd="url(#ar)" />
            <rect x="470" y="252" width="160" height="40" rx="8" fill="#F4F1FE" stroke="#6E56CF" /><text x="550" y="270" textAnchor="middle" fontSize="11" fill="#6E56CF">Advisors: escalations →</text><text x="550" y="284" textAnchor="middle" fontSize="11" fill="#6E56CF">paid sessions → packaged agents</text>
            <path d="M400 242 Q440 262 468 268" stroke="#6E56CF" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
          </svg>
        </Section>

        <Section id="prioritization" title="The forecast and approvals ship first; autonomous hedging does not ship now.">
          <p className="text-sm text-muted">RICE = Reach × Impact × Confidence ÷ Effort. Reach: companies per quarter in the beta cohort, scaled 1–10. Impact: 0.25–3. Confidence: %. Effort: person-months.<AssumptionBadge note="Scores are the builder's estimates for prioritization, not measured data." /></p>
          <div className="flex gap-2 text-sm"><span className="text-muted">Sort:</span><button type="button" className={sort === 'score' ? 'font-semibold text-action' : 'text-muted'} onClick={() => setSort('score')}>By score</button><button type="button" className={sort === 'name' ? 'font-semibold text-action' : 'text-muted'} onClick={() => setSort('name')}>By name</button></div>
          <div className="scroll-x"><table className="data"><thead><tr><th>Feature</th><th className="r">R</th><th className="r">I</th><th className="r">C</th><th className="r">E</th><th className="r">Score</th><th>MoSCoW</th></tr></thead>
            <tbody>{rice.map((x) => <tr key={x.f}><td>{x.f}</td><td className="r">{x.r}</td><td className="r">{x.i}</td><td className="r">{Math.round(x.c * 100)}%</td><td className="r">{x.e}</td><td className="r num font-semibold">{x.s.toFixed(2)}</td><td>{moscow(x.f, x.s)}</td></tr>)}</tbody></table></div>
          <p className="text-sm">Autonomous hedging is <strong>Won&apos;t (now)</strong>: low confidence, high effort, and it conflicts with the rule that money never moves without a human. It stays out until partner execution and expert review have proven trust.</p>
        </Section>

        <Section id="roadmap" title="Now proves trust, Next opens the platform, Later scales the ecosystem.">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Now · 0–3 months', 'Read-only forecast, FX exposure, AI brief and approvals. Shadow mode with 20 design-partner CFOs.', 'Why: earn trust on numbers before actions.', 'Exit: 4-week MAPE beats their spreadsheet for 70% of partners; ≥60% open the weekly brief.', 'Metrics: MAPE, brief open rate, time to first insight.'],
              ['Next · 3–9 months', 'Scenarios, hedge proposals, expert escalation, developer sandbox and the Signals API beta with 10 partners.', 'Why: move from insight to decisions; seed supply before the marketplace.', 'Exit: ≥40% recommendation acceptance; 10 partner agents passing evals.', 'Metrics: acceptance rate, escalations, time to first API call.'],
              ['Later · 9–18 months', 'Marketplace GA, revenue share, partner FX execution and more agent types.', 'Why: scale the flywheel once trust and supply exist.', 'Exit: ≥2 installs per active company; ecosystem revenue positive.', 'Metrics: installs per company, ecosystem revenue, signal acceptance.'],
            ].map(([h, what, why, exit, m]) => <div key={h} className="rounded-panel border border-rule bg-surface p-4 text-sm"><div className="font-semibold text-ink">{h}</div><p className="mt-2">{what}</p><p className="mt-2 text-muted">{why}</p><p className="mt-2">{exit}</p><p className="mt-2 text-muted">{m}</p></div>)}
          </div>
        </Section>

        <Section id="business-model" title="Five revenue streams, priced for how agents actually use data.">
          <div className="scroll-x"><table className="data"><thead><tr><th>Stream</th><th>Price</th><th>Rationale</th></tr></thead><tbody>
            <tr><td>FlowCast Treasury add-on</td><td>$150 per entity / month<AssumptionBadge note="Anchored against IES price estimates (R7) and below standalone treasury tools." /></td><td>Solace Living (5 entities) = $9,000 a year on top of an estimated $12K–15K+ IES subscription (<R id="R7" />).</td></tr>
            <tr><td>Developer agent access</td><td>Per active connected company, not per read<AssumptionBadge note="Proposed model answering R8/R9." /></td><td>Agents are read-heavy; per-read metering penalizes them (<R id="R8" />, <R id="R9" />).</td></tr>
            <tr><td>Marketplace revenue share</td><td>0% on first $1M, then 15%<AssumptionBadge note="Benchmarked to Shopify (R10)." /></td><td>Removes the cold-start tax on small developers (<R id="R10" />).</td></tr>
            <tr><td>Expert sessions</td><td>Intuit takes a 20% platform fee<AssumptionBadge note="Illustrative take rate." /></td><td>Extends the existing expert model (<R id="R6" />) to treasury.</td></tr>
            <tr><td>Partner FX execution</td><td>Referral fee, disclosed to customers<AssumptionBadge note="Illustrative; disclosed per trade." /></td><td>FlowCast never executes; licensed partners do.</td></tr>
          </tbody></table></div>
        </Section>

        <Section id="metrics" title="The North Star counts decisions, not dashboards.">
          <p><strong>North Star:</strong> weekly finance leaders making a cash or FX decision in FlowCast (approvals + scenarios modeled + escalations).</p>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div><div className="font-semibold">Customer</div><ul className="mt-1 list-disc pl-5"><li>4-week MAPE</li><li>Recommendation acceptance rate</li><li>Hours saved per week</li><li>Time to first insight</li></ul></div>
            <div><div className="font-semibold">Ecosystem</div><ul className="mt-1 list-disc pl-5"><li>Developers onboarded; time to first API call</li><li>Active agents; task completion</li><li>Signal acceptance rate; installs per company</li><li>Ecosystem revenue; eval pass rate</li></ul></div>
            <div><div className="font-semibold">Guardrails</div><ul className="mt-1 list-disc pl-5"><li>Hallucination incidents = 0</li><li>Override rate on AI numbers &lt; 2%</li><li>Scope violations = 0</li><li>FlowCast account churn</li></ul></div>
          </div>
          <p className="text-sm text-muted">51% of CFOs rank forecast accuracy a top-five 2026 priority (<R id="R14" />), which is why MAPE leads the customer KPIs.</p>
        </Section>

        <Section id="experiments" title="Five riskiest assumptions, each with a cheap test and a kill criterion.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['CFOs will act on an AI forecast', 'Four-week shadow mode vs. their spreadsheet', 'MAPE beats baseline and ≥60% open the weekly brief', 'Weeks 1–4', 'Kill if fewer than 30% open the brief by week 4.'],
              ['Enough IES customers have material FX exposure', 'Query the share of IES companies with ≥2 currencies on the multi-currency beta, plus foreign-currency volume', '≥25% of multi-entity customers', 'Week 1', 'Pivot to single-currency cash forecasting if under 10%.'],
              ['Customers will grant third-party agents read scopes', 'A/B test two consent-screen designs', '≥40% install conversion', 'Weeks 2–5', 'Pivot to first-party signals if under 20% on both designs.'],
              ['Developers prefer per-company pricing over per-read', 'Fake-door pricing page plus 30 developer interviews', '≥60% prefer it', 'Weeks 2–4', 'Keep per-read with a larger free tier if under 40%.'],
              ['CFOs will pay for the Treasury add-on', 'Van Westendorp survey plus pilot conversion', '≥30% of pilots convert', 'Weeks 4–6', 'Bundle into IES tiers if under 15%.'],
            ].map(([a, t, s, w, k], i) => (
              <div key={a} className="rounded-panel border border-rule bg-surface p-4 text-sm">
                <div className="text-xs text-muted">Assumption {i + 1}</div><div className="font-semibold">{a}</div>
                <p className="mt-2"><span className="text-muted">Test:</span> {t}</p><p><span className="text-muted">Success:</span> {s}</p><p><span className="text-muted">Timeline:</span> {w}</p>
                <p className="mt-2 text-risk">Kill / pivot: {k}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">Rapid test plan: week 1 data query (A2); weeks 1–4 shadow mode (A1); weeks 2–5 consent A/B (A3) and pricing fake door (A4); weeks 4–6 pricing survey and pilot conversion (A5).</p>
        </Section>

        <Section id="risks" title="The biggest risks are trust and compliance, not technology.">
          <div className="scroll-x"><table className="data"><thead><tr><th>Type</th><th>Risk</th><th>L</th><th>I</th><th>Mitigation</th></tr></thead><tbody>
            {[
              ['Technical', 'AI states a wrong number', 'M', 'H', 'Deterministic engine; AI never produces figures; citations; abstain < 70%'],
              ['Technical', 'Stale FX rates', 'M', 'M', 'Autonomous rate refresh from the permissioned IES table, with timestamps'],
              ['Compliance', 'Hedge proposals read as financial advice', 'M', 'H', '"Decision support, not advice" on every hedge answer; expert review above threshold'],
              ['Compliance', 'Money-movement licensing', 'L', 'H', 'Never autonomous; execution only via licensed partners after approval'],
              ['Compliance', 'Data residency for UK, EU, India entities', 'M', 'M', 'Region-pinned processing; scopes per entity'],
              ['Security', 'Over-scoped third-party agents', 'M', 'H', 'Minimal scopes enforced at certification; revocable in the Trust Center'],
              ['Security', 'Prompt injection through agent signals', 'M', 'H', 'Signals are data, never instructions; provenance required. Vendors, including Oracle, rank prompt injection as a top agent risk (R17)'],
              ['Adoption', 'CFOs distrust AI forecasts', 'H', 'H', 'Shadow mode and accuracy history before actions'],
              ['Competitive', 'NetSuite Next / SuiteAgents, SAP Joule Studio, AI-native ERPs', 'H', 'M', 'Differentiate on multi-currency treasury, the expert network and an open graph'],
              ['Business model', 'Cannibalizes Intuit first-party agents', 'M', 'M', 'First-party owns the core forecast; third parties add signals'],
              ['Ecosystem', 'Cold start: no agents, no installs', 'H', 'M', 'Launch fund, 0% revenue share on first $1M, seeded partners in Next'],
            ].map((r) => <tr key={r[1]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}
          </tbody></table></div>
        </Section>

        <Section id="competition" title="Nobody combines forward-looking cash and FX with an open agent and advisor ecosystem.">
          <svg viewBox="0 0 520 380" className="w-full max-w-xl" role="img" aria-label="Competitive positioning 2 by 2">
            <rect x="60" y="20" width="440" height="320" fill="#FFFFFF" stroke="#DDE3EA" />
            <line x1="280" y1="20" x2="280" y2="340" stroke="#DDE3EA" /><line x1="60" y1="180" x2="500" y2="180" stroke="#DDE3EA" />
            <text x="280" y="372" textAnchor="middle" fontSize="12" fill="#5B6B7C">Openness to third-party agents & advisors →</text>
            <text x="18" y="180" textAnchor="middle" fontSize="12" fill="#5B6B7C" transform="rotate(-90 18 180)">Forward-looking cash & FX intelligence →</text>
            {[[430, 60, 'IES + FlowCast', '#236CFF'], [320, 200, 'NetSuite', '#5B6B7C'], [250, 130, 'SAP (Joule)', '#5B6B7C'], [170, 230, 'Workday', '#5B6B7C'], [180, 290, 'AI-native ERPs', '#5B6B7C'], [130, 80, 'Treasury tools', '#5B6B7C']].map(([x, y, t, c]) => <g key={t as string}><circle cx={x as number} cy={y as number} r="7" fill={c as string} /><text x={(x as number) + 10} y={(y as number) + 4} fontSize="12" fill="#0E2A47">{t}</text></g>)}
          </svg>
          <div className="scroll-x"><table className="data"><thead><tr><th>Player</th><th>Cash & FX forecasting</th><th>Agent platform</th><th>Expert network</th><th>Mid-market price fit</th><th>Source</th></tr></thead><tbody>
            <tr><td>IES + FlowCast</td><td>Native multi-currency + agent</td><td>Open graph, SDK, MCP</td><td>Yes</td><td>Strong</td><td><R id="R3" /></td></tr>
            <tr><td>Oracle NetSuite</td><td>Conversational ERP rolling out</td><td>SuiteAgents (maturing), MCP connector</td><td>Partner-led</td><td>Heavier</td><td><R id="R17" /></td></tr>
            <tr><td>SAP (Joule)</td><td>Role assistants incl. cash</td><td>Joule Studio GA</td><td>Partner-led</td><td>Enterprise</td><td><R id="R18" /></td></tr>
            <tr><td>Workday</td><td>Strong financials</td><td>Enterprise focus</td><td>Partner-led</td><td>Upper mid-market</td><td>Positioning based on public info; verify</td></tr>
            <tr><td>AI-native ERPs</td><td>Ledger and close focus</td><td>Early</td><td>No</td><td>Strong</td><td><R id="R19" /></td></tr>
          </tbody></table></div>
          <p className="text-xs text-muted">Illustrative positioning from public sources; verify before external use.</p>
        </Section>

        <Section id="trade-offs" title="Three deliberate trade-offs shaped this prototype.">
          <ol className="list-decimal space-y-2 pl-5">
            <li><strong>Treasury wedge over close automation.</strong> Close is crowded and Intuit already ships AI close features (<R id="R3" />); cash and FX is under-served and rides the new multi-currency beta.</li>
            <li><strong>Scripted AI in the prototype for reliability.</strong> The engine calculates and the AI explains; that principle is the product, and the demo cannot fail live.</li>
            <li><strong>Per-company agent pricing over per-call pricing.</strong> Agents read constantly; pricing reads would tax exactly the developers IES needs (<R id="R8" />).</li>
          </ol>
        </Section>
      </article>
    </div>
  );
}
