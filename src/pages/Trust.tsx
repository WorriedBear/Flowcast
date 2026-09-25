import { Fragment, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../store/useApp';
import { agentById } from '../data/agents';
import { agentPaused } from '../lib/derive';
import type { TaskId } from '../lib/policy';
import type { Policy, Tier } from '../data/types';
import { Button, Field, PageHeader, Panel, Pill, Tooltip, inputCls, usePageTitle } from '../components/ui';
import { toast } from '../components/toast';

const TASKS: { id: TaskId; label: string; effect: string; lock?: string; tiers: Tier[] }[] = [
  { id: 'data_consolidation', label: 'Data consolidation', effect: 'Pulls and reconciles IES data', tiers: ['auto', 'approve'] },
  { id: 'fx_rate_refresh', label: 'FX rate refresh', effect: 'Refreshes the permissioned rate table', tiers: ['auto', 'approve'] },
  { id: 'forecast_refresh', label: 'Forecast refresh', effect: 'Recomputes the 13-week forecast', tiers: ['auto', 'approve'] },
  { id: 'anomaly_alerts', label: 'Anomaly alerts', effect: 'Off hides REC-5', tiers: ['auto', 'approve', 'off'] },
  { id: 'collection_drafts', label: 'Collection drafts', effect: 'Off removes REC-4', tiers: ['auto', 'approve', 'off'] },
  { id: 'intercompany_transfers', label: 'Intercompany transfers', effect: 'Autonomous executes REC-1 on the next brief regeneration', tiers: ['auto', 'approve', 'expert'] },
  { id: 'payment_timing', label: 'Payment timing changes', effect: 'Proposals from PayTiming-style agents', tiers: ['auto', 'approve', 'expert'] },
  { id: 'hedges_below_threshold', label: 'Hedges under the threshold', effect: 'e.g. REC-3 tranches', tiers: ['approve', 'expert'] },
  { id: 'hedges_above_threshold', label: 'Hedges at or above the threshold', effect: 'e.g. REC-2', lock: 'Locked by policy: hedges at or above the approval threshold always need an expert.', tiers: ['expert'] },
  { id: 'money_movement', label: 'Moving money / executing trades', effect: 'Always a licensed partner after approval', lock: 'Hard-locked: FlowCast never moves money or executes trades on its own.', tiers: ['never'] },
];
const TIER_LABEL: Record<Tier, string> = { auto: 'Autonomous', approve: 'Suggest & approve', expert: 'Expert required', never: 'Never autonomous', off: 'Off' };
const ALL_TIERS: Tier[] = ['auto', 'approve', 'expert', 'never', 'off'];

function PolicyEditor() {
  const policy = useApp((s) => s.customer.policy);
  const setPolicy = useApp((s) => s.setPolicy);
  const [f, setF] = useState({ minCash: String(policy.minCash / 1e6), bmin: String(policy.hedgeBandMin), bmax: String(policy.hedgeBandMax), thr: String(policy.approvalThresholdUSD / 1e3), inst: policy.allowedInstruments });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    const mc = Number(f.minCash), a = Number(f.bmin), b = Number(f.bmax), t = Number(f.thr);
    if (f.minCash === '' || isNaN(mc) || mc < 0) e.minCash = 'Enter a minimum cash of 0 or more (in $M).';
    if (isNaN(a) || a < 0 || a > 100) e.bmin = 'Band minimum must be between 0 and 100.';
    if (isNaN(b) || b < 0 || b > 100) e.bmax = 'Band maximum must be between 0 and 100.';
    if (!e.bmin && !e.bmax && a >= b) e.bmax = 'Band maximum must be greater than the minimum.';
    if (isNaN(t) || t <= 0) e.thr = 'Threshold must be greater than 0.';
    if (!f.inst.length) e.inst = 'Allow at least one instrument.';
    setErr(e);
    if (Object.keys(e).length) { toast('Policy not saved. Fix the highlighted fields.', 'error'); return; }
    const p: Policy = { minCash: mc * 1e6, hedgeBandMin: a, hedgeBandMax: b, approvalThresholdUSD: t * 1e3, allowedInstruments: f.inst };
    setPolicy(p);
    toast('Policy saved. Routes and banners recalculated.');
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Minimum consolidated cash ($M)" error={err.minCash}><input className={inputCls} inputMode="decimal" value={f.minCash} onChange={(e) => setF({ ...f, minCash: e.target.value })} /></Field>
      <Field label="Hedge band min (%)" error={err.bmin}><input className={inputCls} inputMode="numeric" value={f.bmin} onChange={(e) => setF({ ...f, bmin: e.target.value })} /></Field>
      <Field label="Hedge band max (%)" error={err.bmax}><input className={inputCls} inputMode="numeric" value={f.bmax} onChange={(e) => setF({ ...f, bmax: e.target.value })} /></Field>
      <Field label="Expert review threshold ($K)" error={err.thr}><input className={inputCls} inputMode="numeric" value={f.thr} onChange={(e) => setF({ ...f, thr: e.target.value })} /></Field>
      <Field label="Allowed instruments" error={err.inst}>
        <div className="flex flex-wrap gap-3 py-1">{['forward', 'layered forwards', 'options'].map((i) => (
          <label key={i} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.inst.includes(i)} onChange={(e) => setF({ ...f, inst: e.target.checked ? [...f.inst, i] : f.inst.filter((x) => x !== i) })} />{i}</label>
        ))}</div>
      </Field>
      <div className="flex items-end sm:col-span-2 lg:col-span-3"><Button variant="primary" action="T-02" onClick={save}>Save policy</Button></div>
    </div>
  );
}

export default function Trust() {
  usePageTitle('Trust Center', 'Autonomy, policy, access and the audit log.');
  const autonomy = useApp((s) => s.customer.autonomy);
  const setAutonomy = useApp((s) => s.setAutonomy);
  const c = useApp((s) => s.customer);
  const toggleScope = useApp((s) => s.toggleScope);
  const audit = useApp((s) => s.audit);
  const [actor, setActor] = useState('');
  const [tier, setTier] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const logRows = audit.filter((a) => (!actor || a.actor === actor) && (!tier || a.tier === tier) && (!q || a.message.toLowerCase().includes(q.toLowerCase()))
    && (!from || a.ts.slice(0, 10) >= from) && (!to || a.ts.slice(0, 10) <= to));
  const installed = c.installedAgents.map((id) => agentById(id)!).filter((a) => a && !a.firstParty);

  return (
    <div className="space-y-5">
      <PageHeader title="Trust Center" sub="What the agent may do on its own, what needs you, what needs an expert, and what it can never do. Every action lands in the audit log." />
      <Panel id="autonomy" title="Autonomy matrix" sub="Changing a tier changes behavior across the app immediately.">
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Task</th>{ALL_TIERS.map((t) => <th key={t} className="text-center">{TIER_LABEL[t]}</th>)}</tr></thead>
            <tbody>
              {TASKS.map((t) => (
                <tr key={t.id}>
                  <td><div className="font-medium">{t.label}</div><div className="text-xs text-muted">{t.effect}</div></td>
                  {ALL_TIERS.map((tr) => {
                    const on = autonomy[t.id] === tr;
                    const allowed = t.tiers.includes(tr);
                    return (
                      <td key={tr} className="text-center">
                        {allowed ? (
                          <button type="button" data-action="T-01" aria-pressed={on} aria-label={`${t.label}: ${TIER_LABEL[tr]}`} disabled={!!t.lock}
                            onClick={() => { if (!on) { setAutonomy(t.id, tr); toast(`${t.label} set to ${TIER_LABEL[tr]}`); } }}
                            className={`inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded-ctl border px-2 text-xs ${on ? 'border-action bg-action text-white' : 'border-rule text-muted hover:border-action'} disabled:cursor-not-allowed`}>
                            {t.lock && <Lock size={12} />}{on ? 'On' : 'Set'}
                          </button>
                        ) : t.lock ? <Tooltip tip={t.lock}><span tabIndex={0} className="text-muted"><Lock size={13} className="inline" /></span></Tooltip> : <span className="text-rule">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel id="policy" title="Treasury policy" sub="Saving recomputes every route, banner and answer in the app.">
        <PolicyEditor />
      </Panel>

      <Panel id="access" title="Third-party access" sub="Scopes each installed agent holds. Revoking a required scope pauses the agent and removes its contribution.">
        {installed.length === 0 ? <p className="text-sm text-muted">No third-party agents installed.</p> : (
          <div className="space-y-4">
            {installed.map((a) => (
              <div key={a.id} className="rule-b pb-3 last:border-0">
                <div className="mb-2 flex items-center gap-2"><strong>{a.name}</strong><span className="text-xs text-muted">{a.publisher}</span>{agentPaused(c, a.id) ? <Pill tone="risk">Paused: missing scope</Pill> : <Pill tone="cash">Active</Pill>}</div>
                <div className="space-y-1.5">
                  {a.scopes.map((s) => {
                    const revoked = (c.revokedScopes[a.id] ?? []).includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" data-action="T-03" checked={!revoked} onChange={() => { toggleScope(a.id, s.id); toast(`${revoked ? 'Restored' : 'Revoked'} ${s.id} for ${a.name}`); }} />
                        <code className="text-xs">{s.id}</code><span className="text-muted">{s.label}{s.required ? ' (required)' : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel id="log" title="Audit log" sub={`${logRows.length} of ${audit.length} entries`}>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select data-action="T-04" aria-label="Filter by actor" className={inputCls} value={actor} onChange={(e) => setActor(e.target.value)}><option value="">All actors</option><option value="agent">Agent</option><option value="user">User</option><option value="expert">Expert</option><option value="thirdParty">Third party</option></select>
          <select data-action="T-04" aria-label="Filter by tier" className={inputCls} value={tier} onChange={(e) => setTier(e.target.value)}><option value="">All tiers</option>{ALL_TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</select>
          <input data-action="T-04" aria-label="From date" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          <input data-action="T-04" aria-label="To date" type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          <input data-action="T-04" aria-label="Search the log" className={inputCls} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Time</th><th>Actor</th><th>Tier</th><th>Event</th></tr></thead>
            <tbody>
              {logRows.map((a) => (
                <Fragment key={a.id}>
                  <tr role="button" tabIndex={0} className="cursor-pointer hover:bg-[var(--soft)]" onClick={() => setOpen(open === a.id ? null : a.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                    <td className="whitespace-nowrap text-xs">{new Date(a.ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="capitalize">{a.actor === 'thirdParty' ? 'Third party' : a.actor}</td>
                    <td><Pill>{TIER_LABEL[a.tier]}</Pill></td>
                    <td>{a.message}</td>
                  </tr>
                  {open === a.id && <tr className="bg-[var(--soft)]"><td colSpan={4} className="text-xs">Sources: {a.sourceIds.length ? a.sourceIds.join(', ') : 'none (user setting)'} · ID {a.id}{a.refId ? ` · ${a.refId}` : ''}</td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
          {logRows.length === 0 && <p className="py-3 text-sm text-muted">No entries match these filters. Clear a filter to see more.</p>}
        </div>
      </Panel>

      <Panel id="guardrails" title="Guardrails" sub="Five mechanisms that keep the agent trustworthy.">
        <ol className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          {[
            ['Deterministic engine', 'Every number comes from pure calculation functions over IES line items. The language model only explains; it never produces figures.'],
            ['Citations', 'Every claim carries source chips that open the underlying line items.'],
            ['Abstain threshold', 'Confidence starts at 90%, drops 2 points per week beyond 4 and 10 points when a needed signal is missing. Below 70%, FlowCast abstains and offers to escalate.'],
            ['Scoped permissions', 'Third-party agents get only the scopes you grant, and you can revoke any of them here at any time.'],
            ['Human checkpoints', 'Money movement is never autonomous. Hedges at or above the threshold need an expert, then you.'],
          ].map(([t, d], i) => <li key={t} className="rounded-ctl border border-rule p-3"><div className="font-semibold">{i + 1}. {t}</div><p className="mt-1 text-muted">{d}</p></li>)}
        </ol>
      </Panel>
    </div>
  );
}
