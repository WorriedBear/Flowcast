import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { buildBrief } from '../lib/answers';
import { money, usdM } from '../lib/format';
import { entityStatus } from '../lib/forecast';
import { ENTITIES } from '../data/entities';
import { mape } from '../data/accuracy';
import { AssumptionBadge, Button, CcyChip, PageHeader, Panel, Pill, Skeleton, StreamText, Tooltip, useFirstLoad, usePageTitle } from '../components/ui';
import { RecActions, RoutePill, SourceChips, WeekDrawer } from '../components/domain';
import { RunwayChart, Sparkline } from '../components/RunwayChart';
import { toast } from '../components/toast';

export default function CommandCenter() {
  usePageTitle('Command Center', 'Priya’s 13-week cash and FX command center.');
  const loading = useFirstLoad('app');
  const c = useApp((s) => s.customer);
  const setBrief = useApp((s) => s.setBrief);
  const setRec = useApp((s) => s.setRec);
  const log = useApp((s) => s.log);
  const { base, recs, exposures } = useComputed();
  const nav = useNavigate();
  const [week, setWeek] = useState<number | null>(null);
  const [briefKey, setBriefKey] = useState(0);
  const brief = useMemo(() => buildBrief(c), [c]);
  const [instant] = useState(c.briefStreamed);

  // Autonomous intercompany transfers execute on brief regeneration.
  const regenerate = () => {
    const r1 = recs.find((r) => r.id === 'REC-1')!;
    if (r1.state.status === 'open' && r1.policy.route === 'auto') {
      setRec('REC-1', { status: 'approved' });
      log('agent', 'auto', 'Auto-executed REC-1 (DE → UK €720K) because intercompany transfers are set to Autonomous', r1.sources, 'REC-1');
      toast('REC-1 executed autonomously per your Trust Center setting', 'info');
    }
    setBriefKey((k) => k + 1);
    log('agent', 'auto', 'Regenerated the morning brief from current state', ['IES Accounting', 'IES Payroll']);
  };
  useEffect(() => { if (!c.briefStreamed) setBrief({ briefStreamed: true }); }, [c.briefStreamed, setBrief]);

  const headroom = base.low.value - c.policy.minCash;
  const unhedged = exposures.reduce((a, e) => a + Math.abs(e.netUSD), 0) - recs.filter((r) => r.hedge && (r.state.status === 'approved' || r.state.status === 'executed')).reduce((a, r) => a + r.hedge!.notionalUSD, 0);
  const open = recs.filter((r) => r.visible && r.state.status === 'open');

  const kpis = [
    { label: 'Consolidated cash', value: usdM(base.opening, 2), full: money(base.opening, 'USD', { compact: false }), sub: '5 entities, converted at the IES rate table', go: () => setWeek(1), hint: 'Opens the W1 drill-down' },
    { label: '13-week low', value: usdM(base.low.value), full: money(base.low.value, 'USD', { compact: false }), sub: `W${base.low.week}: US payroll + AP run`, go: () => setWeek(base.low.week), hint: `Opens the W${base.low.week} drill-down` },
    { label: 'Headroom vs. policy', value: usdM(headroom), full: money(headroom, 'USD', { compact: false }), sub: `Floor ${usdM(c.policy.minCash, 0)}`, go: () => nav('/app/trust#policy'), hint: 'Opens the policy editor', tone: headroom < 0 ? 'risk' : 'cash' },
    { label: 'Unhedged exposure', value: usdM(unhedged), full: money(unhedged, 'USD', { compact: false }), sub: 'Net 13-week, all currencies', go: () => nav('/app/fx'), hint: 'Opens FX & hedging' },
    { label: 'Forecast accuracy', value: `${mape('flowcast').toFixed(1)}% MAPE`, full: `Spreadsheet baseline ${mape('spreadsheet').toFixed(1)}%`, sub: `vs. ${mape('spreadsheet').toFixed(0)}% spreadsheet baseline`, go: () => nav('/app/ask?q=Why%20is%20week%207%20the%20low%20point%3F'), hint: 'Asks FlowCast about the forecast', assumption: 'Illustrative. The real target is validated in shadow mode (see Experiments).' },
  ];

  if (loading) return <div className="space-y-4"><Skeleton lines={2} /><div className="panel p-5"><Skeleton lines={6} /></div></div>;
  return (
    <div className="space-y-5">
      <PageHeader title="Good morning, Priya" sub={<>Solace Living Inc. · 5 entities · 4 foreign currencies · Friday, 25 Sep 2026</>}
        right={<Tooltip tip="Refreshed autonomously from IES Accounting, IES Payroll, IES Commerce, bank feeds, the rate table and ShipSignal."><span tabIndex={0}><Pill tone="ai">Refreshed {c.lastBriefAt} · Autonomous</Pill></span></Tooltip>} />

      <section data-tour="brief" className="rounded-panel border border-[color-mix(in_srgb,var(--ai)_35%,transparent)] bg-[var(--ai-bg)] p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ai">AI brief <span className="hidden text-xs font-normal text-muted sm:inline">Numbers from the deterministic engine; AI writes the words</span></h2>
          <Button size="sm" variant="ghost" action="C-09" onClick={regenerate}><RefreshCw size={14} />Regenerate</Button>
        </div>
        <p className="text-[15px] leading-relaxed"><StreamText key={briefKey} text={brief} instant={instant && briefKey === 0} /></p>
        <div className="mt-3"><SourceChips sources={['IES Accounting', 'IES Payroll', 'IES Commerce', 'Bank feed', 'Rate table', 'Marketplace: ShipSignal']} /></div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <button key={k.label} type="button" data-action="C-02" onClick={k.go} title={k.hint} className="panel p-3 text-left hover:border-action">
            <div className="flex items-center text-xs text-muted">{k.label}{k.assumption && <AssumptionBadge note={k.assumption} />}</div>
            <div className={`num mt-1 text-xl font-semibold ${k.tone === 'risk' ? 'text-risk' : k.tone === 'cash' ? 'text-cash' : 'text-ink'}`} title={k.full}>{k.value}</div>
            <div className="text-xs text-muted">{k.sub}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="13-week cash runway" sub="Consolidated closing cash with P10–P90 band. Click any week to see its line items." tour="runway"
          right={<div className="flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-ink" />Closing</span><span className="flex items-center gap-1"><span className="h-2.5 w-4 bg-[color-mix(in_srgb,var(--action)_15%,transparent)]" />P10–P90</span><span className="flex items-center gap-1"><span className="h-0 w-4 border-t-2 border-dashed border-risk" />Policy</span></div>}>
          <div data-action="C-03"><RunwayChart f={base} minCash={c.policy.minCash} onWeek={setWeek} height={320} /></div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {base.weeks.map((p) => (
              <button key={p.week} type="button" data-action="C-03" onClick={() => setWeek(p.week)} className={`rounded-ctl border px-2 py-0.5 text-xs ${p.week === base.low.week ? 'border-risk text-risk' : 'border-rule text-muted hover:border-action'}`} aria-label={`Open week ${p.week} detail`}>W{p.week}</button>
            ))}
          </div>
        </Panel>

        <Panel title="Action rail" sub={`${open.length} open recommendation${open.length === 1 ? '' : 's'}`} right={<Link to="/app/approvals" data-action="C-08" className="text-sm text-action">View all approvals</Link>}>
          <div className="space-y-4">
            {open.slice(0, 3).map((r) => (
              <div key={r.id} className="rule-b pb-3 last:border-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5"><span className="text-xs text-muted">{r.id}</span><RoutePill route={r.policy.route} /><span className="text-xs text-muted">{Math.round(r.confidence * 100)}% conf.</span></div>
                <div className="text-sm font-medium">{r.title}</div>
                <div className="mb-2 text-xs text-muted">{r.impact}</div>
                <RecActions rec={r} compact />
              </div>
            ))}
            {open.length === 0 && <p className="text-sm text-muted">Nothing needs you right now. New recommendations appear here as the forecast refreshes.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Entities" sub="Local balance today and 13-week trajectory. US and UK rows open their low week; foreign-currency rows open FX exposure.">
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Entity</th><th>Currency</th><th className="r">Local balance</th><th className="r">USD equivalent</th><th>13 weeks</th><th>Status</th></tr></thead>
            <tbody>
              {base.entities.map((s) => {
                const e = ENTITIES.find((x) => x.id === s.id)!;
                const st = entityStatus(s);
                const minW = s.closingLocal.indexOf(Math.min(...s.closingLocal)) + 1;
                const open = () => (s.id === 'UK' || s.id === 'US' ? setWeek(minW) : nav('/app/fx'));
                return (
                  <tr key={s.id} data-action="C-04" tabIndex={0} role="button" aria-label={`Open details for ${e.name}`} className="cursor-pointer hover:bg-[var(--soft)]"
                    onClick={open} onKeyDown={(ev) => ev.key === 'Enter' && open()}>
                    <td><div className="font-medium">{e.id} · {e.name}</div><div className="text-xs text-muted">{e.role}</div></td>
                    <td><CcyChip ccy={e.ccy} /></td>
                    <td className="r num">{money(e.opening, e.ccy)}</td>
                    <td className="r num">{usdM(s.closingUSD[0] - (s.closingLocal[0] - e.opening) * base.rates[e.ccy], 2)}</td>
                    <td><Sparkline values={s.closingLocal} /></td>
                    <td>{st === 'Gap' ? <Pill tone="risk"><TrendingDown size={12} />Gap · W{s.closingLocal.findIndex((v) => v < 0) + 1}</Pill> : st === 'Watch' ? <Pill tone="fx">Watch · low W{minW}</Pill> : <Pill tone="cash"><TrendingUp size={12} />OK</Pill>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <WeekDrawer week={week} onClose={() => setWeek(null)} />
    </div>
  );
}
