import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ext, Tabs, usePageTitle } from '../components/ui';
import { PERSONAS, RESEARCH, type Theme } from '../data/research';

const CURRENT = [
  ['Export', 'IES reports, bank portals', 'Downloads 4 exports', '😩 Tedious', 'Manual, error-prone', 'Autonomous consolidation'],
  ['Reconcile', 'Spreadsheet', 'Matches intercompany', '😤 Frustrated', 'Hours lost each week', 'Entity-aware ledger graph'],
  ['Convert FX', 'Spreadsheet, rate site', 'Applies yesterday’s rates', '😟 Uneasy', 'Stale rates, no audit', 'Permissioned rate table'],
  ['Build 13-week model', 'Spreadsheet', 'Rolls forward by hand', '😐 Resigned', 'No confidence band', 'Deterministic forecast + band'],
  ['Present', 'Slides, email', 'Explains the numbers', '😬 Exposed', 'Can’t trace a number', 'Brief with source chips'],
  ['Discover FX hit later', 'Month-end close', 'Finds realized losses', '😞 Blindsided', 'Too late to act', 'Exposure + hedge proposals'],
];
const FUTURE = [
  ['Brief', 'FlowCast Command Center', 'Reads the 6 AM AI brief', '🙂 Informed', 'Low point and gaps flagged'],
  ['Explore', 'Week drawer, Ask FlowCast', 'Drills into W7, asks what-ifs', '😌 Confident', 'Every number cited'],
  ['Decide', 'Scenario Lab, FX', 'Moves capex; reviews hedge', '💡 Aha', 'Breach caught before it happens'],
  ['Approve', 'Approvals, expert escalation', 'Approves transfer; escalates hedge', '🤝 Supported', 'Expert in the loop within hours'],
  ['Extend', 'Marketplace', 'Installs RevForecast', '🚀 Empowered', 'Forecast improves with signals'],
];

export default function Research() {
  usePageTitle('Research', 'Evidence, personas and the customer journey behind FlowCast.');
  const [theme, setTheme] = useState<'All' | Theme>('All');
  const [map, setMap] = useState<'current' | 'future'>('current');
  const facts = RESEARCH.filter((r) => theme === 'All' || r.theme === theme);
  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-4 py-8">
      <header>
        <h1 className="text-[28px] font-semibold text-ink md:text-[40px] md:leading-[46px]">Research</h1>
        <p className="mt-2 max-w-3xl text-muted">Desk research run with Claude (queries listed on <Link to="/ai-process" className="link">How I used AI</Link>), synthesized into 19 evidence items. Primary sources are Intuit, Shopify, APQC and survey publishers; items marked secondary cite a third party summarizing a survey, and vendor research is labeled as such. Personas are composites, not real individuals.</p>
      </header>
      <section>
        <h2 className="text-xl font-semibold">Evidence (R1–R19)</h2>
        <div className="mt-3"><Tabs value={theme} onChange={setTheme} tabs={(['All', 'Customer', 'Developer', 'Competitive', 'Intuit'] as const).map((t) => ({ id: t, label: `${t} (${t === 'All' ? RESEARCH.length : RESEARCH.filter((r) => r.theme === t).length})` }))} /></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {facts.map((f) => (
            <article key={f.id} id={f.id} className="panel p-4 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted"><span className="font-semibold text-ink">{f.id}</span>{f.theme} · {f.date}{f.secondary && ' · secondary'}{f.vendor && ' · vendor research'}</div>
              <p className="mt-1">{f.claim}</p>
              <p className="mt-2 text-xs">Source: <Ext href={f.url}>{f.sourceName}</Ext></p>
              <p className="mt-1 text-xs text-muted">Used in: {f.usedFor.map((u, i) => <span key={u.to + u.label}>{i > 0 && ', '}<Link to={u.to} className="link">{u.label}</Link></span>)}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Personas</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">Priya (CFO), Marcus (Controller) and Aisha (FP&amp;A Manager) share the CFO workspace: Command Center, Ask FlowCast, Scenario Lab, FX, Approvals and the Trust Center. Dev uses the developer platform and Elena the advisor workspace.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PERSONAS.map((p) => (
            <article key={p.n} className="panel p-4 text-sm">
              <div className="text-base font-semibold">{p.n}</div><div className="text-xs text-muted">{p.r}{p.age ? ` · age ${p.age}` : ''}</div>
              <dl className="mt-2 space-y-1.5"><div><dt className="text-xs text-muted">Goals</dt><dd>{p.goals}</dd></div><div><dt className="text-xs text-muted">Pains</dt><dd>{p.pains}</dd></div><div><dt className="text-xs text-muted">A day in the life</dt><dd>{p.day}</dd></div><div><dt className="text-xs text-muted">Job to be done</dt><dd>{p.jtbd}</dd></div>{p.uses && <div><dt className="text-xs text-muted">Uses in FlowCast</dt><dd>{p.uses.map((u, i) => <span key={u.to + u.label}>{i > 0 && ', '}<Link to={u.to} className="link">{u.label}</Link></span>)}</dd></div>}</dl>
              <blockquote className="mt-2 border-l-2 border-fx pl-2 italic">&ldquo;{p.q}&rdquo;<footer className="not-italic text-xs text-muted">Composite quote, synthesized from research</footer></blockquote>
              <p className="mt-2 text-xs text-muted">Composite persona, synthesized from research; not a real individual.</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Journey map: the Monday cash forecast ritual</h2>
        <div className="mt-3"><Tabs value={map} onChange={setMap} tabs={[{ id: 'current', label: 'Current state' }, { id: 'future', label: 'Future state with FlowCast' }]} /></div>
        <div className="scroll-x mt-3 panel">
          {map === 'current' ? (
            <table className="data"><thead><tr><th>Stage</th><th>Touchpoint</th><th>Action</th><th>Emotion</th><th>Pain</th><th>Opportunity</th></tr></thead><tbody>{CURRENT.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
          ) : (
            <table className="data"><thead><tr><th>Stage</th><th>Touchpoint</th><th>Action</th><th>Emotion</th><th>Outcome</th></tr></thead><tbody>{FUTURE.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
          )}
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="panel p-4"><div className="font-semibold">Aha moment</div><p className="mt-1">Scenario Lab catches a W7 policy breach from the Mexico capex before anything is committed, and suggests W11.</p></div>
          <div className="panel p-4"><div className="font-semibold">Moments of truth</div><p className="mt-1">The first brief matches her own spreadsheet; the first source chip shows real line items; the first escalation comes back the same day.</p></div>
          <div className="panel p-4"><div className="font-semibold">Churn triggers</div><p className="mt-1">One uncited or wrong number; an agent acting without approval; a recommendation that ignores policy.</p></div>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Where AI creates step-change value</h2>
        <ol className="mt-3 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-5">
          {[['Consolidated forecast in minutes, not a morning', '/app'], ['What-if answers in seconds', '/app/ask'], ['Breaches caught before commitments', '/app/scenarios'], ['Netting before hedging', '/app/fx'], ['Expert advice with context attached', '/advisor']].map(([t, to], i) => <li key={t} className="panel p-3"><span className="text-xs text-muted">{i + 1}</span><div className="font-medium">{t}</div><Link to={to} className="link text-xs">See it</Link></li>)}
        </ol>
      </section>
    </div>
  );
}
