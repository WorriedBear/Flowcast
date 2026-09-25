import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../store/useApp';
import { AssumptionBadge, Ext, PageHeader, Panel, Pill, usePageTitle } from '../components/ui';
import { REV_SHARE } from '../config';

export function ttfc(startedAt: string | null, firstCallAt: string | null) {
  if (!startedAt || !firstCallAt) return null;
  const s = Math.max(1, Math.round((new Date(firstCallAt).getTime() - new Date(startedAt).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function DevHome() {
  usePageTitle('Developer home', 'Build agents on the mid-market’s financial graph.');
  const d = useApp((s) => s.developer);
  const evalBest = d.evalRuns.length ? Math.max(...d.evalRuns.map((r) => r.passed)) : null;
  const steps = [
    { label: 'Discover', done: true, to: '/dev', sub: 'You are here' },
    { label: 'Onboard', done: !!d.firstCallAt, to: '/dev/start', sub: d.firstCallAt ? 'First call made' : 'Sandbox + first call' },
    { label: 'Build', done: d.sandboxRun, to: '/dev/build', sub: d.sandboxRun ? 'Ran in sandbox' : 'Manifest + sandbox run' },
    { label: 'Certify', done: evalBest === 50, to: '/dev/build', sub: evalBest ? `Best eval ${evalBest}/50` : 'Evals ≥ 95%' },
    { label: 'Publish', done: d.publishStatus === 'live', to: '/dev/publish', sub: d.publishStatus === 'live' ? 'Live' : 'Listing + review' },
    { label: 'Earn', done: d.publishStatus === 'live', to: '/dev#earn', sub: '0% on first $1M' },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Build agents on the mid-market's financial graph." sub="Real-time, entity- and currency-aware data from Intuit Enterprise Suite, an agent SDK with an MCP server, and a marketplace with a fair revenue share." right={<div className="flex gap-2"><Link to="/dev/start" data-action="D-02" className="inline-flex h-10 items-center rounded-ctl bg-action px-4 text-sm font-medium text-white">Start building</Link><Link to="/dev/api" data-action="D-03" className="inline-flex h-10 items-center rounded-ctl border border-rule px-4 text-sm font-medium">Explore the API</Link></div>} />
      <Panel title="Your journey">
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {steps.map((s, i) => (
            <li key={s.label}><Link to={s.to} data-action="D-01" className={`block rounded-ctl border p-3 hover:border-action ${s.done ? 'border-cash' : 'border-rule'}`}>
              <div className="flex items-center gap-1.5 text-sm font-semibold">{s.done ? <CheckCircle2 size={16} className="text-cash" /> : <Circle size={16} className="text-muted" />}{i + 1}. {s.label}</div>
              <div className="mt-1 text-xs text-muted">{s.sub}</div>
            </Link></li>
          ))}
        </ol>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><div className="text-xs text-muted">Time to first call</div><div className="num mt-1 text-xl font-semibold">{ttfc(d.startedAt, d.firstCallAt) ?? 'Not yet'}</div></div>
        <div className="panel p-4"><div className="text-xs text-muted">Eval status</div><div className="num mt-1 text-xl font-semibold">{evalBest ? `${evalBest}/50` : 'Not run'}</div></div>
        <div className="panel p-4"><div className="text-xs text-muted">Publish status</div><div className="mt-1 text-xl font-semibold capitalize">{d.publishStatus.replace('_', ' ')}</div></div>
      </div>
      <Panel title="Why build on IES" sub="How the FlowCast developer model differs from today's integration path.">
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Today</th><th>With FlowCast on IES</th><th>Evidence</th></tr></thead>
            <tbody>
              <tr><td>Report-centric APIs</td><td>Event-driven forecast graph with entity, currency and provenance on every record</td><td><Link to="/research" className="link">R3</Link></td></tr>
              <tr><td>Reads (CorePlus) are metered per call; Builder tier blocks calls above 500K credits a month</td><td>Agent access priced per active connected company; sandbox reads free<AssumptionBadge note="Proposed model. AI agents are read-heavy, so per-read metering penalizes exactly the agents IES wants." /></td><td><Ext href="https://blogs.intuit.com/2025/05/15/introducing-the-intuit-app-partner-program/">R8</Ext> · <Ext href="https://truto.one/blog/how-much-does-the-quickbooks-api-cost-2026-pricing-rate-limits/">R9</Ext></td></tr>
              <tr><td>No agent framework</td><td>Agent SDK, manifest with scopes and human checkpoints, and an IES MCP server</td><td><Ext href="https://investors.intuit.com/news-events/press-releases/detail/1305/intuit-and-anthropic-partner-to-bring-trusted-financial-intelligence-and-custom-ai-agents-to-consumers-and-businesses">R5</Ext></td></tr>
              <tr><td>Weeks to integrate</td><td>Sandbox company clone in minutes</td><td><Link to="/dev/start" className="link">Try it</Link></td></tr>
              <tr><td>Unclear monetization</td><td>0% revenue share on your first $1M, then 15%<AssumptionBadge note="Benchmarked to Shopify's App Store revenue share (R10)." /></td><td><Ext href="https://shopify.dev/docs/apps/store/revenue-share">R10</Ext></td></tr>
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel id="earn" title="How you earn" sub="Revenue share and pricing, explained.">
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div><div className="font-semibold">Per-active-company pricing</div><p className="mt-1 text-muted">You set a monthly price per connected company (RevForecast: $149). Customers pay through their IES bill; you never chase invoices.</p></div>
          <div><div className="font-semibold">0% on the first ${(REV_SHARE.freeUpToUSD / 1e6).toFixed(0)}M, then {REV_SHARE.pctAbove}%</div><p className="mt-1 text-muted">Lifetime app revenue up to $1M is yours in full. Above that, Intuit keeps {REV_SHARE.pctAbove}%. Example: at $1.4M lifetime, you keep $1.34M.</p></div>
          <div><div className="font-semibold">Incentives</div><p className="mt-1 text-muted">Free sandbox reads, launch credits, co-marketing for Verified agents and a referral bounty when your agent brings a new company to IES.</p><Pill tone="action" className="mt-2">Built for IES badge</Pill></div>
        </div>
      </Panel>
    </div>
  );
}
