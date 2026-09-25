import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { AssumptionBadge, Button, Field, PageHeader, Panel, Pill, StreamText, Tabs, inputCls, usePageTitle } from '../components/ui';
import { toast } from '../components/toast';
import { SourceChips } from '../components/domain';

export default function Advisor() {
  usePageTitle('Advisor workspace', 'Client escalations with an AI-built context package.');
  const queue = useApp((s) => s.advisor.queue);
  const respond = useApp((s) => s.respond);
  const policy = useApp((s) => s.customer.policy);
  const setPersona = useApp((s) => s.setPersona);
  const { recs } = useComputed();
  const nav = useNavigate();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const list = queue.filter((q) => q.status === tab);
  const [sel, setSel] = useState<string | null>(null);
  const item = queue.find((q) => q.id === sel) ?? list[0];
  const [decision, setDecision] = useState<'approve' | 'modify' | 'reject' | ''>('');
  const [ratio, setRatio] = useState(55);
  const [rationale, setRationale] = useState('');
  const [follow, setFollow] = useState(true);
  const [err, setErr] = useState<Record<string, string>>({});
  const [justResolved, setJustResolved] = useState<string | null>(null);
  const rec = item ? recs.find((r) => r.id === item.recId) : undefined;
  const prep = item ? (rec?.hedge
    ? `Key considerations: the exposure is driven by one large receipt (Maison Nord, W11), so timing risk matters as much as rate risk. The proposed ${rec.hedge.ratio}% is inside the client's ${policy.hedgeBandMin}–${policy.hedgeBandMax}% band; a slightly lower ratio leaves room if the receipt slips or shrinks. Three overdue Maison Nord invoices (€610K) suggest payment-behavior risk. A 3-month forward matches the receipt date. Check that the client understands forward settlement obligations if the receipt is late.`
    : 'Key considerations: the forward matures in W3, so the decision is roll vs. let expire. A roll locks in carry at today’s rate; letting it expire leaves 55% of the CAD long unhedged into the board meeting. The client’s band floor is 40%, so partial rolling is within policy.') : '';

  const submit = () => {
    const e: Record<string, string> = {};
    if (!decision) e.decision = 'Choose a recommendation.';
    if (rationale.trim().length < 30) e.rationale = `Rationale must be at least 30 characters (${rationale.trim().length} so far).`;
    setErr(e);
    if (Object.keys(e).length || !item || !decision) return;
    respond(item.id, { decision, ratio: decision === 'modify' ? ratio : undefined, rationale: rationale.trim(), followUp: follow, at: new Date().toISOString() });
    toast(`Response sent to ${item.client.split(' (')[0]}`);
    setJustResolved(item.id); setDecision(''); setRationale(''); setSel(null);
  };

  const resolved = queue.filter((q) => q.status === 'resolved').length;
  return (
    <div className="space-y-5">
      <PageHeader title="Good afternoon, Elena" sub="Harbor & Vale Advisory · Escalations from FlowCast clients arrive with the question, exposures, forecast, policy and sources already assembled." />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><div className="flex items-center text-xs text-muted">Median response time<AssumptionBadge note="Illustrative advisor metrics for the prototype." /></div><div className="num mt-1 text-xl font-semibold">38 min</div></div>
        <div className="panel p-4"><div className="text-xs text-muted">Clients served this quarter</div><div className="num mt-1 text-xl font-semibold">{23 + resolved}</div></div>
        <div className="panel p-4"><div className="flex items-center text-xs text-muted">Session revenue this quarter<AssumptionBadge note="$149 per session after included sessions, with Intuit taking a 20% platform fee." /></div><div className="num mt-1 text-xl font-semibold">${((23 + resolved) * 149 * 0.8).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div></div>
      </div>
      {justResolved && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-panel border border-cash bg-[color-mix(in_srgb,var(--cash)_10%,transparent)] p-3 text-sm">
          Response delivered. The client&apos;s recommendation, notification and audit log are updated.
          <Button size="sm" variant="primary" action="V-05" onClick={() => { setPersona('cfo'); nav('/app/approvals'); }}>Switch to CFO to see result</Button>
        </div>
      )}
      <Tabs action="V-04" value={tab} onChange={(t) => { setTab(t); setSel(null); }} tabs={[{ id: 'open', label: `Queue (${queue.filter((q) => q.status === 'open').length})` }, { id: 'resolved', label: `Resolved (${resolved})` }]} />
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-2">
          {list.length === 0 && <p className="panel p-4 text-sm text-muted">{tab === 'open' ? 'No open escalations. New ones arrive when a CFO escalates from FlowCast.' : 'Nothing resolved yet.'}</p>}
          {list.map((q) => (
            <button key={q.id} type="button" data-action="V-01" onClick={() => setSel(q.id)} className={`panel block w-full p-3 text-left ${item?.id === q.id ? 'border-action' : 'hover:border-action'}`}>
              <div className="flex items-center justify-between text-xs text-muted"><span>{q.id}</span><Pill tone={q.urgency.includes('4') ? 'risk' : 'fx'}>{q.urgency}</Pill></div>
              <div className="mt-1 text-sm font-medium">{q.client}</div>
              <div className="text-xs text-muted">{q.question}</div>
            </button>
          ))}
        </div>
        {item && (
          <div className="space-y-5">
            <Panel title="Context package" sub="Assembled by FlowCast. Read-only.">
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs text-muted">Question</dt><dd>{item.question}</dd></div>
                <div><dt className="text-xs text-muted">Client note</dt><dd>{item.note}</dd></div>
                <div><dt className="text-xs text-muted">Exposure</dt><dd>{item.snapshot.exposure}</dd></div>
                <div><dt className="text-xs text-muted">Forecast snapshot</dt><dd>{item.snapshot.low}</dd></div>
                <div><dt className="text-xs text-muted">Policy</dt><dd>{item.snapshot.policy}</dd></div>
                <div><dt className="text-xs text-muted">Sources</dt><dd><SourceChips sources={item.snapshot.sources} /></dd></div>
              </dl>
            </Panel>
            <section className="rounded-panel border border-[color-mix(in_srgb,var(--ai)_35%,transparent)] bg-[var(--ai-bg)] p-4 text-sm">
              <div className="mb-1 font-semibold text-ai">AI prep notes</div>
              <StreamText key={item.id} text={prep} />
            </section>
            {item.status === 'resolved' && item.response ? (
              <Panel title="Your response"><p className="text-sm"><strong className="capitalize">{item.response.decision}</strong>{item.response.ratio ? ` · ratio ${item.response.ratio}%` : ''}. {item.response.rationale}</p></Panel>
            ) : (
              <Panel title="Response" tour="advisor-response">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Recommendation" error={err.decision}>
                    <select data-action="V-02" className={inputCls} value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
                      <option value="">Choose</option><option value="approve">Approve as proposed</option><option value="modify">Modify</option><option value="reject">Reject</option>
                    </select>
                  </Field>
                  {decision === 'modify' && (
                    <Field label={`Modified hedge ratio: ${ratio}%`} hint={`Constrained to the client band ${policy.hedgeBandMin}–${policy.hedgeBandMax}%`}>
                      <input data-action="V-02" type="range" min={policy.hedgeBandMin} max={policy.hedgeBandMax} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} className="w-full" />
                    </Field>
                  )}
                  <div className="md:col-span-2"><Field label="Rationale" error={err.rationale} hint="At least 30 characters. The client sees this.">
                    <textarea data-action="V-02" rows={3} className={inputCls} value={rationale} onChange={(e) => setRationale(e.target.value)} />
                  </Field>
                  <Button size="sm" variant="ghost" className="mt-1" onClick={() => { setDecision('modify'); setRatio(55); setRationale('Reduce to 55% to leave headroom if the Maison Nord receipt slips; keep the 3-month tenor to match W11.'); }}>Use suggested response</Button></div>
                  <label className="flex items-center gap-2 text-sm"><input data-action="V-02" type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />Schedule a follow-up after execution</label>
                  <div className="md:col-span-2"><Button variant="primary" action="V-03" onClick={submit}>Send response</Button></div>
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
