import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button, CcyChip, Drawer, Field, Modal, Pill, inputCls, copyText } from './ui';
import { toast } from './toast';
import { useUI } from '../store/ui';
import { useApp } from '../store/useApp';
import { useComputed, useRecActions } from '../store/hooks';
import { EXPERTS } from '../data/experts';
import { ENTITIES } from '../data/entities';
import { BASE_RATES, RATE_TABLE_LABEL } from '../data/rates';
import type { LineItem } from '../data/types';
import { money, usdM, weekLong } from '../lib/format';
import { ROUTE_LABEL, type Route } from '../lib/policy';
import type { Rec } from '../lib/derive';
import { DRAFTS } from '../lib/answers';

export const CAT_LABEL: Record<string, string> = {
  ar_collections: 'AR collections', commerce_payouts: 'Commerce payouts', wholesale_receipts: 'Wholesale receipts', ap_suppliers: 'Supplier AP',
  payroll: 'Payroll', rent: 'Rent', tax: 'Tax', intercompany: 'Intercompany', capex: 'Capex', other: 'Other',
};

export function RoutePill({ route }: { route: Route }) {
  const tone = route === 'auto' ? 'ai' : route === 'approve' ? 'action' : route === 'expert' ? 'fx' : 'risk';
  return <Pill tone={tone}>{route === 'expert' ? <ShieldAlert size={12} /> : route === 'blocked' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}{ROUTE_LABEL[route]}</Pill>;
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === 'approved' ? 'cash' : status === 'executed' ? 'cash' : status === 'escalated' ? 'fx' : status === 'dismissed' ? 'neutral' : 'action';
  const label = { open: 'Open', approved: 'Approved', executed: 'Executed via partner', escalated: 'With expert', dismissed: 'Dismissed' }[status] ?? status;
  return <Pill tone={tone}>{label}</Pill>;
}

export function SourceChips({ sources, week }: { sources: string[]; week?: number }) {
  const set = useUI((s) => s.set);
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <button key={s} type="button" data-action="C-01" onClick={() => set({ source: { name: s, week } })}
          className="rounded-ctl border border-rule bg-surface px-2 py-0.5 text-xs text-muted hover:border-ai hover:text-ai">{s}</button>
      ))}
    </div>
  );
}

function ItemTable({ items }: { items: LineItem[] }) {
  return (
    <div className="scroll-x">
      <table className="data">
        <thead><tr><th>Week</th><th>Entity</th><th>Item</th><th className="r">Local</th><th className="r">USD</th></tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>W{i.week}</td><td>{i.entity}</td>
              <td><div>{i.memo}</div><div className="text-xs text-muted">{i.counterparty} · {i.sourceSystem} · {Math.round(i.confidence * 100)}% conf.</div></td>
              <td className="r whitespace-nowrap">{money(i.amountLocal, i.currency)} <CcyChip ccy={i.currency} /></td>
              <td className={`r num ${i.amountLocal < 0 ? 'text-risk' : 'text-cash'}`}>{money(i.amountLocal * BASE_RATES[i.currency], 'USD', { signed: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SourceDrawer() {
  const source = useUI((s) => s.source);
  const set = useUI((s) => s.set);
  const { items } = useComputed();
  const policy = useApp((s) => s.customer.policy);
  const rows = useMemo(() => {
    if (!source) return [];
    return items.filter((i) => i.sourceSystem === source.name && (!source.week || i.week === source.week)).sort((a, b) => a.week - b.week);
  }, [items, source]);
  return (
    <Drawer open={!!source} onClose={() => set({ source: null })} title={`Source: ${source?.name ?? ''}${source?.week ? ` · W${source.week}` : ''}`}>
      {source?.name === 'Rate table' ? (
        <div className="space-y-2 text-sm">
          <p className="text-muted">{RATE_TABLE_LABEL}. Illustrative rates fixed for the demo, not live market data.</p>
          <table className="data"><thead><tr><th>Currency</th><th className="r">USD per unit</th></tr></thead>
            <tbody>{Object.entries(BASE_RATES).filter(([c]) => c !== 'USD').map(([c, r]) => <tr key={c}><td><CcyChip ccy={c} /></td><td className="r">{r}</td></tr>)}</tbody></table>
        </div>
      ) : source?.name === 'Policy' ? (
        <div className="space-y-1 text-sm">
          <p>Minimum cash {usdM(policy.minCash)} · Hedge band {policy.hedgeBandMin}–{policy.hedgeBandMax}% · Expert review ≥ {money(policy.approvalThresholdUSD)} · Instruments: {policy.allowedInstruments.join(', ')}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">{rows.length} line items feed the forecast from this source. Total {money(rows.reduce((a, i) => a + i.amountLocal * BASE_RATES[i.currency], 0), 'USD', { signed: true })} at base rates.</p>
          <ItemTable items={rows} />
        </>
      )}
    </Drawer>
  );
}

export function WeekDrawer({ week, onClose }: { week: number | null; onClose: () => void }) {
  const { scen } = useComputed();
  const rows = useMemo(() => (week ? scen.items.filter((i) => i.week === week) : []), [scen, week]);
  const p = week ? scen.weeks[week - 1] : null;
  const rate = (i: LineItem) => i.amountLocal * scen.rates[i.currency];
  return (
    <Drawer open={!!week} onClose={onClose} title={week ? weekLong(week) : ''}>
      {p && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div><div className="text-muted">Inflows</div><div className="num font-semibold text-cash">+{usdM(p.inflows, 2)}</div></div>
            <div><div className="text-muted">Outflows</div><div className="num font-semibold text-risk">{usdM(p.outflows, 2)}</div></div>
            <div><div className="text-muted">Closing</div><div className="num font-semibold">{usdM(p.closing, 2)}</div></div>
          </div>
          {ENTITIES.map((e) => {
            const er = rows.filter((i) => i.entity === e.id);
            if (!er.length) return null;
            const cats = [...new Set(er.map((i) => i.category))];
            const tot = er.reduce((a, i) => a + rate(i), 0);
            return (
              <div key={e.id}>
                <div className="flex items-center justify-between rule-b pb-1 text-sm font-semibold"><span>{e.id} · {e.name}</span><span className={`num ${tot < 0 ? 'text-risk' : 'text-cash'}`}>{money(tot, 'USD', { signed: true })}</span></div>
                {cats.map((c) => {
                  const ci = er.filter((i) => i.category === c);
                  return (
                    <div key={c} className="py-1.5 text-sm">
                      <div className="flex justify-between text-muted"><span>{CAT_LABEL[c]}</span><span className="num">{money(ci.reduce((a, i) => a + rate(i), 0), 'USD', { signed: true })}</span></div>
                      {ci.map((i) => <div key={i.id} className="flex justify-between pl-3 text-xs"><span>{i.counterparty} · {i.sourceSystem}</span><span className="num">{money(i.amountLocal, i.currency, { signed: true })}</span></div>)}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <p className="rule-t pt-2 text-xs text-muted">Entity totals sum to the week&apos;s net {money(p.net, 'USD', { signed: true })}, which reconciles to the chart.</p>
        </div>
      )}
    </Drawer>
  );
}

export function EscalateModal() {
  const recId = useUI((s) => s.escalateRecId);
  const set = useUI((s) => s.set);
  const { base, recs, exposures } = useComputed();
  const policy = useApp((s) => s.customer.policy);
  const escalate = useApp((s) => s.escalate);
  const nav = useNavigate();
  const [expertId, setExpert] = useState('elena');
  const [urgency, setUrgency] = useState('Within 24 hours');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const rec = recs.find((r) => r.id === recId);
  const close = () => { set({ escalateRecId: null }); setErr(''); };
  if (!rec) return null;
  const eur = exposures.find((e) => e.ccy === (rec.hedge?.ccy ?? 'EUR'))!;
  const snapshot = {
    low: `13-week low ${usdM(base.low.value)} in W${base.low.week} (policy floor ${usdM(policy.minCash, 0)})`,
    exposure: `${eur.ccy} net ${eur.net >= 0 ? 'long' : 'short'} ${money(eur.net, eur.ccy)} (${usdM(eur.netUSD)}); 0% hedged today`,
    policy: `Hedge band ${policy.hedgeBandMin}–${policy.hedgeBandMax}%, expert review ≥ ${money(policy.approvalThresholdUSD)}, instruments: ${policy.allowedInstruments.join(', ')}`,
    sources: rec.sources,
  };
  const submit = () => {
    if (note.trim().length < 10) { setErr('Add a note of at least 10 characters so the expert knows what you need.'); return; }
    escalate({ recId: rec.id, client: 'Solace Living Inc.', question: rec.title, expertId, urgency, note: note.trim(), snapshot });
    toast(`Escalated to ${EXPERTS.find((e) => e.id === expertId)!.name.split(',')[0]}`, 'success');
    setNote(''); close();
    nav('/app/approvals?tab=expert');
  };
  return (
    <Modal open={!!rec} onClose={close} title={`Escalate ${rec.id} to an expert`} wide
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" action="P-05" tour="escalate-submit" onClick={submit}>Send to expert</Button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-ctl bg-[var(--ai-bg)] p-3 text-sm">
          <div className="mb-1 font-semibold text-ai">Context package (built by FlowCast)</div>
          <dl className="space-y-1.5">
            <div><dt className="text-xs text-muted">Question</dt><dd>{rec.title}</dd></div>
            <div><dt className="text-xs text-muted">Exposure</dt><dd>{snapshot.exposure}</dd></div>
            <div><dt className="text-xs text-muted">Forecast snapshot</dt><dd>{snapshot.low}</dd></div>
            <div><dt className="text-xs text-muted">Policy</dt><dd>{snapshot.policy}</dd></div>
            <div><dt className="text-xs text-muted">Routing</dt><dd>{rec.policy.reasons.join(' ')}</dd></div>
            <div><dt className="text-xs text-muted">Sources</dt><dd>{rec.sources.join(', ')}</dd></div>
          </dl>
        </div>
        <div className="space-y-3">
          <Field label="Expert">
            <select className={inputCls} value={expertId} onChange={(e) => setExpert(e.target.value)}>
              {EXPERTS.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.focus}</option>)}
            </select>
          </Field>
          <Field label="Urgency">
            <select className={inputCls} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option>Within 4 hours</option><option>Within 24 hours</option><option>This week</option>
            </select>
          </Field>
          <Field label="Note for the expert" error={err} hint="Required, at least 10 characters.">
            <textarea className={inputCls} rows={4} value={note} onChange={(e) => { setNote(e.target.value); setErr(''); }} placeholder="e.g. Is 60% the right ratio given the Maison Nord payment risk?" />
          </Field>
          <Button size="sm" variant="ghost" onClick={() => setNote('Is 60% the right cover given the Maison Nord receipt could slip? Board wants a view this week.')}>Use suggested note</Button>
        </div>
      </div>
    </Modal>
  );
}

export function DismissModal({ rec, onClose }: { rec: Rec | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [err, setErr] = useState('');
  const { dismiss } = useRecActions();
  return (
    <Modal open={!!rec} onClose={onClose} title={`Dismiss ${rec?.id ?? ''}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="danger" action="C-07" onClick={() => {
        if (!reason) { setErr('Choose a reason so FlowCast can learn from it.'); return; }
        dismiss(rec!, detail ? `${reason} (${detail})` : reason); setReason(''); setDetail(''); onClose();
      }}>Dismiss recommendation</Button></>}>
      <div className="space-y-3">
        <p className="text-sm">{rec?.title}</p>
        <Field label="Reason" error={err}>
          <select className={inputCls} value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }}>
            <option value="">Choose a reason</option><option>Already handled outside FlowCast</option><option>Numbers look wrong</option><option>Timing is not right</option><option>Not relevant to us</option>
          </select>
        </Field>
        <Field label="Details (optional)"><input className={inputCls} value={detail} onChange={(e) => setDetail(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export function DraftsModal() {
  const open = useUI((s) => s.draftsOpen);
  const set = useUI((s) => s.set);
  return (
    <Modal open={open} onClose={() => set({ draftsOpen: false })} title="Collection reminder drafts (3)" wide footer={<Button onClick={() => set({ draftsOpen: false })}>Done</Button>}>
      <p className="mb-3 text-sm text-muted">Drafted autonomously. Nothing is sent: copy each one into your email client or IES Accounting.</p>
      <div className="space-y-3">
        {DRAFTS.map((d) => (
          <div key={d.inv} className="rounded-ctl border border-rule p-3">
            <div className="mb-1 flex items-center justify-between gap-2"><strong className="text-sm">{d.subject}</strong><Button size="sm" onClick={() => copyText(`${d.subject}\n\n${d.body}`, 'Draft copied')}>Copy draft</Button></div>
            <pre className="whitespace-pre-wrap text-xs text-muted">{d.body}</pre>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function RecActions({ rec, compact, inbox }: { rec: Rec; compact?: boolean; inbox?: boolean }) {
  const { approve } = useRecActions();
  const set = useUI((s) => s.set);
  const nav = useNavigate();
  const [dismissing, setDismissing] = useState(false);
  if (rec.state.status !== 'open') return <StatusPill status={rec.state.status} />;
  const why = { 'REC-1': 'Why is the UK short in week 6?', 'REC-2': 'Should we hedge the EUR exposure?', 'REC-3': 'What if MXN strengthens 5%?', 'REC-4': 'Which invoices are overdue?', 'REC-5': 'What is our treasury policy?' }[rec.id]!;
  return (
    <div className="flex flex-wrap gap-1.5">
      {rec.kind === 'collection_draft' && <Button size="sm" onClick={() => set({ draftsOpen: true })}>View drafts</Button>}
      <Button size="sm" variant="primary" action={inbox ? 'P-03' : 'C-05'} tour={`approve-${rec.id}`} onClick={() => approve(rec)}>{rec.policy.route === 'expert' ? 'Approve (needs expert)' : rec.approveLabel}</Button>
      {!compact && rec.policy.route === 'expert' && <Button size="sm" action="P-05" onClick={() => set({ escalateRecId: rec.id })}>Escalate</Button>}
      <Button size="sm" variant="ghost" action="C-06" onClick={() => nav(`/app/ask?q=${encodeURIComponent(why)}`)}>Why?</Button>
      <Button size="sm" variant="ghost" action={inbox ? 'P-04' : 'C-07'} destructive onClick={() => setDismissing(true)}>Dismiss</Button>
      <DismissModal rec={dismissing ? rec : null} onClose={() => setDismissing(false)} />
    </div>
  );
}
