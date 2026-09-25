import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { Button, PageHeader, Panel, Tabs, usePageTitle } from '../components/ui';
import { RecActions, RoutePill, SourceChips, StatusPill } from '../components/domain';
import { toast } from '../components/toast';
import type { RecStatus } from '../data/types';

type Tab = 'mine' | 'expert' | 'approved' | 'executed' | 'dismissed';
const TAB_STATUS: Record<Tab, RecStatus> = { mine: 'open', expert: 'escalated', approved: 'approved', executed: 'executed', dismissed: 'dismissed' };

export default function Approvals() {
  usePageTitle('Approvals', 'Recommendations waiting for a decision, routed by policy.');
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'mine';
  const { recs } = useComputed();
  const audit = useApp((s) => s.audit);
  const setRec = useApp((s) => s.setRec);
  const log = useApp((s) => s.log);
  const queue = useApp((s) => s.advisor.queue);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const visible = recs.filter((r) => r.visible);
  const count = (t: Tab) => visible.filter((r) => r.state.status === TAB_STATUS[t]).length;
  const rows = visible.filter((r) => r.state.status === TAB_STATUS[tab]);

  const bulk = () => {
    const chosen = rows.filter((r) => sel.includes(r.id));
    const ok = chosen.filter((r) => r.policy.route === 'approve' || r.policy.route === 'auto');
    const skip = chosen.filter((r) => !ok.includes(r));
    ok.forEach((r) => { setRec(r.id, { status: 'approved' }); log('user', 'approve', `Bulk-approved ${r.id} · ${r.title}`, r.sources, r.id); });
    setSkipped(skip.map((r) => `${r.id} skipped: ${r.policy.reasons.join(' ')}`));
    setSel([]);
    toast(`${ok.length} approved${skip.length ? `, ${skip.length} skipped` : ''}`, ok.length ? 'success' : 'info', ok.length ? () => ok.forEach((r) => setRec(r.id, { status: 'open' })) : undefined);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" sub="Every recommendation is routed by your policy: autonomous, suggest & approve, expert required, or never autonomous." />
      <Tabs<Tab> action="P-01" value={tab} onChange={(t) => { setParams({ tab: t }); setSel([]); setSkipped([]); }} tabs={[
        { id: 'mine', label: `Needs my approval (${count('mine')})` }, { id: 'expert', label: `With expert (${count('expert')})` },
        { id: 'approved', label: `Approved (${count('approved')})` }, { id: 'executed', label: `Executed (${count('executed')})` }, { id: 'dismissed', label: `Dismissed (${count('dismissed')})` },
      ]} />
      {tab === 'mine' && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" data-action="P-06" aria-label="Select all" checked={sel.length === rows.length} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} />Select all</label>
          <Button size="sm" variant="primary" action="P-07" disabled={!sel.length} onClick={bulk}>Approve selected ({sel.length})</Button>
          <span className="text-xs text-muted">Bulk approve only applies to items routed to suggest & approve.</span>
        </div>
      )}
      {skipped.length > 0 && <div role="status" className="rounded-panel border border-fx bg-[color-mix(in_srgb,var(--fx)_10%,transparent)] p-3 text-sm">{skipped.map((s) => <div key={s}>{s}</div>)}</div>}
      <Panel tour="approvals-list">
        {rows.length === 0 ? <p className="text-sm text-muted">Nothing here. {tab === 'mine' ? 'New recommendations appear as the forecast refreshes.' : 'Items move here as you act on them.'}</p> : (
          <div className="divide-y divide-[var(--rule)]">
            {rows.map((r) => {
              const hist = audit.filter((a) => a.refId === r.id);
              const esc = queue.find((q) => q.recId === r.id);
              return (
                <div key={r.id} className="py-3">
                  <div className="flex flex-wrap items-start gap-3">
                    {tab === 'mine' && <input type="checkbox" data-action="P-06" aria-label={`Select ${r.id}`} className="mt-1" checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} />}
                    <button type="button" data-action="P-02" aria-expanded={openId === r.id} aria-label={`Expand ${r.id}`} onClick={() => setOpenId(openId === r.id ? null : r.id)} className="mt-0.5 text-muted">{openId === r.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">{r.id}</span><RoutePill route={r.policy.route} /><StatusPill status={r.state.status} />{r.state.expertReviewed && <span className="text-xs text-fx">Expert reviewed</span>}</div>
                      <div className="mt-0.5 font-medium">{r.title}</div>
                      <div className="text-sm text-muted">{r.impact}</div>
                      {r.state.expertNote && <div className="mt-1 rounded-ctl bg-[color-mix(in_srgb,var(--fx)_10%,transparent)] px-2 py-1 text-sm">Elena Vogt, CTP: {r.state.expertNote}</div>}
                    </div>
                    <div className="w-full sm:w-auto">{r.state.status === 'open' ? <RecActions rec={r} inbox /> : tab === 'expert' ? <span className="text-sm text-muted">Waiting on {esc ? 'Elena Vogt' : 'the expert'}</span> : null}</div>
                  </div>
                  {openId === r.id && (
                    <div className="ml-7 mt-3 grid gap-3 rounded-ctl bg-[var(--soft)] p-3 text-sm md:grid-cols-2">
                      <div><div className="text-xs text-muted">Detail</div><p>{r.detail}</p><div className="mt-2 text-xs text-muted">Sources</div><SourceChips sources={r.sources} /></div>
                      <div><div className="text-xs text-muted">Policy routing</div><ul>{r.policy.reasons.map((x) => <li key={x}>• {x}</li>)}</ul>
                        <div className="mt-2 text-xs text-muted">History</div>
                        {hist.length ? <ul className="text-xs">{hist.map((h) => <li key={h.id}>{new Date(h.ts).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })} · {h.message}</li>)}</ul> : <p className="text-xs">Proposed by FlowCast at the 6:02 AM refresh.</p>}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
