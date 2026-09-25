import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useComputed, useRecActions } from '../store/hooks';
import { activeAgents, type Rec } from '../lib/derive';
import { hedgeProposal, netting, sensitivity } from '../lib/fx';
import { checkPolicy } from '../lib/policy';
import { money, usdM } from '../lib/format';
import { HEDGE_DISCLAIMER } from '../lib/answers';
import { entityById } from '../data/entities';
import { AssumptionBadge, Button, CcyChip, Modal, PageHeader, Panel, Pill, Signed, usePageTitle } from '../components/ui';
import { RoutePill, StatusPill } from '../components/domain';
import { useUI } from '../store/ui';
import { toast } from '../components/toast';

function AdjustModal({ rec, onClose }: { rec: Rec | null; onClose: () => void }) {
  const policy = useApp((s) => s.customer.policy);
  const setRec = useApp((s) => s.setRec);
  const log = useApp((s) => s.log);
  const { exposures } = useComputed();
  const [ratio, setRatio] = useState(rec?.hedge?.ratio ?? 60);
  if (!rec?.hedge) return null;
  const ex = exposures.find((e) => e.ccy === rec.hedge!.ccy)!;
  const p = hedgeProposal(ex, ratio, policy, { layered: rec.hedge.tranches > 1 });
  return (
    <Modal open onClose={onClose} title={`Adjust ${rec.id}`} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" action="X-04" onClick={() => {
      setRec(rec.id, { ratio, expertReviewed: false });
      log('user', 'approve', `Adjusted ${rec.id} hedge ratio to ${ratio}%`, rec.sources, rec.id);
      toast(`Hedge proposal updated to ${ratio}%`); onClose();
    }}>Save proposal</Button></>}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><label htmlFor="ratio">Hedge ratio</label><span className="num font-semibold">{ratio}%</span></div>
        <input id="ratio" type="range" min={policy.hedgeBandMin} max={policy.hedgeBandMax} step={1} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} className="w-full" />
        <p className="text-xs text-muted">Constrained to your policy band of {policy.hedgeBandMin}–{policy.hedgeBandMax}%.</p>
        <div className="grid grid-cols-2 gap-2 rounded-ctl bg-[var(--soft)] p-3">
          <div><div className="text-xs text-muted">Notional</div><div className="num font-semibold">{money(p.notionalLocal, p.ccy)} · {money(p.notionalUSD)}</div></div>
          <div><div className="text-xs text-muted">Routing</div><RoutePill route={p.policy.route} /></div>
        </div>
        <ul className="space-y-1">{p.policy.checks.map((c) => <li key={c.label} className="flex items-center gap-1.5">{c.ok ? <CheckCircle2 size={14} className="text-cash" /> : <AlertTriangle size={14} className="text-fx" />}{c.label}</li>)}</ul>
        {rec.state.expertReviewed && <p className="text-xs text-fx">Saving a new ratio clears the expert review; policy re-routes it.</p>}
      </div>
    </Modal>
  );
}

export default function Fx() {
  usePageTitle('FX exposure & hedging', 'Net 13-week currency exposure, netting and hedge proposals.');
  const c = useApp((s) => s.customer);
  const setRec = useApp((s) => s.setRec);
  const log = useApp((s) => s.log);
  const setUI = useUI((s) => s.set);
  const { items, exposures, recs } = useComputed();
  const { approve } = useRecActions();
  const [open, setOpen] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<Rec | null>(null);
  const [exec, setExec] = useState<Rec | null>(null);
  const net = useMemo(() => netting(items), [items]);
  const hedges = recs.filter((r) => r.hedge);
  const hedgedLocal = (ccy: string) => hedges.filter((r) => r.hedge!.ccy === ccy && (r.state.status === 'approved' || r.state.status === 'executed')).reduce((a, r) => a + r.hedge!.notionalLocal, 0);
  const hasPartner = activeAgents(c).includes('hedgeloop');
  const approved = hedges.filter((r) => r.state.status === 'approved' || r.state.status === 'executed');

  return (
    <div className="space-y-5">
      <PageHeader title="FX exposure & hedging" sub="Exposures are computed from forecast line items in each currency (intercompany excluded). Rates from the IES multi-currency rate table." />
      <Panel title="Net 13-week exposure by currency" sub="Click a row to see which entities contribute.">
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Currency</th><th className="r">Inflows</th><th className="r">Outflows</th><th className="r">Net</th><th className="r">Hedged</th><th className="r">Unhedged (USD)</th><th className="r">±1% impact</th></tr></thead>
            <tbody>
              {exposures.map((e) => {
                const h = Math.min(1, hedgedLocal(e.ccy) / Math.abs(e.net));
                const s1 = sensitivity(items, e.ccy, 1);
                return (
                  <Fragment key={e.ccy}>
                    <tr data-action="X-01" role="button" tabIndex={0} aria-expanded={open === e.ccy} className="cursor-pointer hover:bg-[var(--soft)]" onClick={() => setOpen(open === e.ccy ? null : e.ccy)} onKeyDown={(k) => k.key === 'Enter' && setOpen(open === e.ccy ? null : e.ccy)}>
                      <td className="whitespace-nowrap">{open === e.ccy ? <ChevronDown size={14} className="inline" /> : <ChevronRight size={14} className="inline" />} <CcyChip ccy={e.ccy} /> {e.net >= 0 ? 'Long' : 'Short'}</td>
                      <td className="r num">{money(e.inflows, e.ccy)}</td>
                      <td className="r num">{money(e.outflows, e.ccy)}</td>
                      <td className="r"><Signed v={e.net} ccy={e.ccy} /></td>
                      <td className="r num">{Math.round(h * 100)}%</td>
                      <td className="r num">{usdM(Math.abs(e.netUSD) * (1 - h), 2)}</td>
                      <td className="r num">±{money(Math.abs(s1))}</td>
                    </tr>
                    {open === e.ccy && e.byEntity.map((b) => (
                      <tr key={b.entity} className="bg-[var(--soft)] text-xs"><td className="pl-8" colSpan={3}>{b.entity} · {entityById(b.entity)!.name}</td><td className="r"><Signed v={b.net} ccy={e.ccy} /></td><td colSpan={3} className="r num">{money(b.netUSD, 'USD', { signed: true })}</td></tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">±1% impact is on 13-week consolidated closing cash, including balances held in that currency.</p>
      </Panel>

      <Panel title="Net first, hedge second" sub="Offsetting positions across subsidiaries cancel before anything is hedged." tour="netting">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {[{ l: 'Entity-by-entity hedge requirement', v: net.entityByEntity, c: 'bg-muted' }, { l: 'Group-level requirement after netting', v: net.group, c: 'bg-action' }].map((b) => (
              <div key={b.l}><div className="flex justify-between text-sm"><span>{b.l}</span><span className="num font-semibold">{usdM(b.v, 2)}</span></div>
                <div className="mt-1 h-5 rounded-sm bg-[var(--soft)]"><div className={`h-5 rounded-sm ${b.c}`} style={{ width: `${(b.v / net.entityByEntity) * 100}%` }} /></div></div>
            ))}
            <div className="text-2xl font-semibold text-cash">{net.reductionPct.toFixed(1)}% less to hedge</div>
          </div>
          <div className="text-sm">
            <p>Each entity hedging its own net position would cover {usdM(net.entityByEntity, 2)}. At group level, offsetting flows cancel, leaving {usdM(net.group, 2)}. Hedging less means lower forward costs and fewer trades to approve.</p>
            <ul className="mt-2 space-y-1">
              {net.offsets.map((o) => <li key={o.ccy}>• <CcyChip ccy={o.ccy} /> {o.long.join(', ')} long offsets {o.short.join(', ')} short: {money(o.savedUSD)} less to hedge. Settle intercompany balances in {o.ccy} before buying cover.</li>)}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {hedges.map((r) => {
          const h = r.hedge!;
          return (
            <Panel key={r.id} title={<span className="flex flex-wrap items-center gap-2">{r.id} <CcyChip ccy={h.ccy} /> <RoutePill route={r.policy.route} /> {r.state.status !== 'open' && <StatusPill status={r.state.status} />}</span>} sub={r.title}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-muted">Instrument</dt><dd className="capitalize">{h.instrument}</dd></div>
                <div><dt className="text-xs text-muted">Tenor</dt><dd>{h.tenor}</dd></div>
                <div><dt className="text-xs text-muted">Notional</dt><dd className="num">{money(h.notionalLocal, h.ccy)} · {money(h.notionalUSD)}</dd></div>
                <div><dt className="text-xs text-muted">Confidence</dt><dd>{Math.round(r.confidence * 100)}%</dd></div>
              </dl>
              <p className="mt-2 text-sm">{r.detail}</p>
              <ul className="mt-2 space-y-1 text-sm">{r.policy.checks.map((ck) => <li key={ck.label} className="flex items-center gap-1.5">{ck.ok ? <CheckCircle2 size={14} className="text-cash" /> : <AlertTriangle size={14} className="text-fx" />}{ck.label}</li>)}</ul>
              <p className="mt-2 text-xs text-fx">{HEDGE_DISCLAIMER}</p>
              {r.state.status === 'open' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" action="X-02" tour={`approve-${r.id}`} onClick={() => approve(r)}>Approve hedge</Button>
                  <Button size="sm" action="X-03" onClick={() => setUI({ escalateRecId: r.id })}>Escalate to expert</Button>
                  <Button size="sm" variant="ghost" action="X-04" onClick={() => setAdjust(r)}>Adjust</Button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel title="Execution" sub="Only approved hedges appear here. FlowCast never moves money; a licensed partner executes.">
        {approved.length === 0 ? <p className="text-sm text-muted">No approved hedges yet. Approve a proposal above (or get it back from an expert) to execute it.</p> : (
          <div className="space-y-3">
            {approved.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rule-b pb-3 last:border-0">
                <div className="flex-1 text-sm"><div className="font-medium">{r.id} · {r.hedge!.instrument} {money(r.hedge!.notionalLocal, r.hedge!.ccy)} ({r.hedge!.ratio}%)</div>{r.state.expertNote && <div className="text-xs text-muted">Expert note: {r.state.expertNote}</div>}</div>
                {r.state.status === 'executed' ? <Pill tone="cash">Executed via {r.state.executedVia}</Pill>
                  : hasPartner ? <Button size="sm" variant="primary" action="X-05" onClick={() => setExec(r)}>Execute via partner</Button>
                    : <Link to="/app/marketplace?category=fx-execution" data-action="X-06" className="inline-flex h-8 items-center rounded-ctl border border-rule px-3 text-sm font-medium text-action hover:border-action">Install an execution partner</Link>}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Policy summary" right={<Link to="/app/trust#policy" data-action="X-07" className="text-sm text-action">Edit policy</Link>}>
        <p className="text-sm">Minimum cash {usdM(c.policy.minCash)} · Hedge band {c.policy.hedgeBandMin}–{c.policy.hedgeBandMax}% of net forecast exposure · Expert review at or above {money(c.policy.approvalThresholdUSD)} notional · Instruments: {c.policy.allowedInstruments.join(', ')}<AssumptionBadge note="Seed policy for the fictional company, anchored to the 50–75% cover guidance for highly certain flows (R16)." /></p>
      </Panel>

      {adjust && <AdjustModal rec={adjust} onClose={() => setAdjust(null)} />}
      <Modal open={!!exec} onClose={() => setExec(null)} title="Execute via HedgeLoop?" footer={<><Button onClick={() => setExec(null)}>Cancel</Button><Button variant="primary" action="X-05" onClick={() => {
        const res = checkPolicy({ kind: 'execute_trade', partnerExecuted: true, approved: true }, c.policy);
        if (res.route === 'blocked') { toast(res.reasons[0], 'error'); return; }
        setRec(exec!.id, { status: 'executed', executedVia: 'HedgeLoop' });
        log('thirdParty', 'never', `HedgeLoop executed ${exec!.id} (${exec!.hedge!.instrument}, ${money(exec!.hedge!.notionalLocal, exec!.hedge!.ccy)}) after human approval`, ['Marketplace: hedgeloop'], exec!.id);
        toast('Hedge executed via HedgeLoop'); setExec(null);
      }}>Confirm execution</Button></>}>
        <p className="text-sm">FlowCast never moves money itself. HedgeLoop, a licensed partner, will execute {exec?.hedge && `${exec.hedge.instrument} for ${money(exec.hedge.notionalLocal, exec.hedge.ccy)}`}. Confirm?</p>
      </Modal>
    </div>
  );
}
