import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MessageSquare, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { BASE_SCENARIO, buildForecast } from '../lib/forecast';
import { money, usdM } from '../lib/format';
import type { Scenario } from '../data/types';
import { PRESETS } from '../data/presets';
import { AssumptionBadge, Button, PageHeader, Panel, StreamText, usePageTitle } from '../components/ui';
import { RunwayChart } from '../components/RunwayChart';

type Key = 'EUR' | 'GBP' | 'MXN' | 'INR' | 'dso' | 'rev' | 'hires' | 'capex' | 'mx';
const LABEL: Record<Key, string> = { EUR: 'EUR vs USD', GBP: 'GBP vs USD', MXN: 'MXN vs USD', INR: 'INR vs USD', dso: 'DSO shift', rev: 'Revenue change', hires: 'Additional hires', capex: 'Capex item', mx: 'MX prepayment timing' };
function only(k: Key, s: Scenario): Scenario {
  const b = { ...BASE_SCENARIO, fx: { ...BASE_SCENARIO.fx } };
  if (k === 'EUR' || k === 'GBP' || k === 'MXN' || k === 'INR') b.fx[k] = s.fx[k];
  if (k === 'dso') b.dsoShiftDays = s.dsoShiftDays;
  if (k === 'rev') b.revenuePct = s.revenuePct;
  if (k === 'hires') b.hires = s.hires;
  if (k === 'capex') { b.capexAmount = s.capexAmount; b.capexWeek = s.capexWeek; }
  if (k === 'mx') b.delayMxPrepay = s.delayMxPrepay;
  return b;
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  const id = label.replace(/\W/g, '');
  return (
    <div>
      <div className="flex justify-between text-sm"><label htmlFor={id}>{label}</label><span className="num font-medium">{value > 0 && unit !== ' hires' ? '+' : ''}{value}{unit}</span></div>
      <input id={id} data-action="S-01" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

export default function Scenarios() {
  usePageTitle('Scenario Lab', 'Live what-if modeling on the 13-week forecast.');
  const stored = useApp((s) => s.customer.scenario);
  const setScenario = useApp((s) => s.setScenario);
  const policy = useApp((s) => s.customer.policy);
  const { items, base } = useComputed();
  const nav = useNavigate();
  const [s, setS] = useState<Scenario>(stored);
  const [critique, setCritique] = useState<string | null>(null);
  useEffect(() => { setS((cur) => (JSON.stringify(cur) === JSON.stringify(stored) ? cur : stored)); }, [stored]);
  useEffect(() => {
    if (JSON.stringify(s) === JSON.stringify(useApp.getState().customer.scenario)) return;
    const t = setTimeout(() => setScenario(s), 100);
    return () => clearTimeout(t);
  }, [s, setScenario]);
  const scen = useMemo(() => buildForecast(items, s), [items, s]);
  const breach = scen.low.value < policy.minCash;
  const drivers = useMemo(() => (Object.keys(LABEL) as Key[]).map((k) => ({ k, delta: buildForecast(items, only(k, s)).low.value - base.low.value })).filter((d) => Math.abs(d.delta) > 1).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)), [items, s, base]);
  const maxD = Math.max(1, ...drivers.map((d) => Math.abs(d.delta)));
  const patch = (p: Partial<Scenario>) => { setS({ ...s, ...p }); setCritique(null); };
  const fx = (c: 'EUR' | 'GBP' | 'MXN' | 'INR', v: number) => patch({ fx: { ...s.fx, [c]: v } });

  const buildCritique = () => {
    if (!drivers.length) return 'This is the base case. Move a slider or apply a preset and I will name the input that moves your low point most.';
    const top = drivers[0];
    let safe: number | null = null;
    if (s.capexAmount > 0) for (let w = s.capexWeek; w <= 13; w++) if (buildForecast(items, { ...s, capexWeek: w }).low.value >= policy.minCash) { safe = w; break; }
    const mitigation: Record<Key, string> = {
      capex: safe ? `Move the capex to W${safe}: the low becomes ${usdM(buildForecast(items, { ...s, capexWeek: safe }).low.value)}, inside policy.` : 'Split the capex into tranches or finance it; no single week in the horizon absorbs it.',
      EUR: 'Hedge the EUR long with REC-2 (forward, inside your 40–75% band) to lock in the Maison Nord receipt.',
      GBP: 'Fund the UK entity early with REC-1 so a GBP move does not also create a local gap.',
      MXN: 'Approve REC-3 layered MXN forwards to cap plant payroll and prepayment costs.',
      INR: 'INR exposure is mostly payroll; consider a small layered forward once REC-5 hiring stabilizes.',
      dso: 'Approve REC-4 collection drafts; the three overdue Maison Nord invoices alone are €610K.',
      rev: 'Pull cash forward with REC-4 collections and delay non-critical supplier runs past W7.',
      hires: 'Stagger start dates so the new payroll lands after the W7 low.',
      mx: 'Keep the prepayment in W9 unless the supplier offers a discount for later payment.',
    };
    return `The biggest driver is ${LABEL[top.k].toLowerCase()}: on its own it moves the low by ${money(top.delta, 'USD', { signed: true })}. The scenario low is ${usdM(scen.low.value)} in W${scen.low.week}, ${breach ? `${usdM(policy.minCash - scen.low.value, 2)} below` : `${usdM(scen.low.value - policy.minCash)} above`} your ${usdM(policy.minCash, 0)} floor. Suggested mitigation: ${mitigation[top.k]}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Scenario Lab" sub="Every change recomputes the full 13-week forecast from line items. Nothing here changes your real data." />
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => <Button key={p.id} size="sm" action="S-02" title={p.desc} onClick={() => { setS(p.s); setCritique(null); }}>{p.label}</Button>)}
        <Button size="sm" variant="ghost" action="S-03" onClick={() => { setS(BASE_SCENARIO); setCritique(null); }}><RotateCcw size={14} />Reset to base</Button>
      </div>
      <div data-tour="breach-banner" role="status" className={`flex items-center gap-2 rounded-panel border px-4 py-3 text-sm font-medium ${breach ? 'border-risk bg-[color-mix(in_srgb,var(--risk)_10%,transparent)] text-risk' : 'border-cash bg-[color-mix(in_srgb,var(--cash)_10%,transparent)] text-cash'}`}>
        {breach ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        {breach ? `Policy breach in W${scen.low.week}: low of ${usdM(scen.low.value, 2)} is below the ${usdM(policy.minCash, 0)} minimum.` : `Within policy: the low of ${usdM(scen.low.value)} in W${scen.low.week} stays above the ${usdM(policy.minCash, 0)} minimum.`}
        <span className="ml-auto num font-normal text-ink">Low point Δ {money(scen.low.value - base.low.value, 'USD', { signed: true })}</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Panel title="Inputs">
          <div className="space-y-4">
            {(['EUR', 'GBP', 'MXN', 'INR'] as const).map((c) => <Slider key={c} label={`${c} vs USD`} value={s.fx[c]} min={-10} max={10} step={0.5} unit="%" onChange={(v) => fx(c, v)} />)}
            <Slider label="DSO shift" value={s.dsoShiftDays} min={-10} max={20} step={1} unit=" days" onChange={(v) => patch({ dsoShiftDays: v })} />
            <Slider label="Revenue change" value={s.revenuePct} min={-20} max={20} step={1} unit="%" onChange={(v) => patch({ revenuePct: v })} />
            <Slider label="Additional hires" value={s.hires} min={0} max={50} step={1} unit=" hires" onChange={(v) => patch({ hires: v })} />
            <div className="rule-t pt-3">
              <div className="mb-1 flex items-center text-sm font-medium">Capex item <AssumptionBadge note="Paid by the US parent in a single week." /></div>
              <div className="flex gap-2">
                <label className="flex-1 text-xs text-muted">Amount (USD)
                  <input data-action="S-01" type="number" min={0} step={100000} value={s.capexAmount} onChange={(e) => patch({ capexAmount: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-ctl border border-rule bg-surface px-2 py-1.5 text-sm text-ink" />
                </label>
                <label className="w-24 text-xs text-muted">Week
                  <select data-action="S-01" data-tour="capex-week" value={s.capexWeek} onChange={(e) => patch({ capexWeek: Number(e.target.value) })} className="mt-1 w-full rounded-ctl border border-rule bg-surface px-2 py-1.5 text-sm text-ink">
                    {Array.from({ length: 13 }, (_, i) => <option key={i} value={i + 1}>W{i + 1}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input data-action="S-01" type="checkbox" checked={s.delayMxPrepay} onChange={(e) => patch({ delayMxPrepay: e.target.checked })} />Delay the MX$42M prepayment to W12</label>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel title="Base vs. scenario" sub="Solid: base. Dashed violet: scenario." right={<div className="text-right text-sm"><div className="text-muted">Scenario low</div><div className={`num text-lg font-semibold ${breach ? 'text-risk' : 'text-ink'}`}>{usdM(scen.low.value, 2)} · W{scen.low.week}</div></div>}>
            <RunwayChart f={base} compare={scen} minCash={policy.minCash} height={300} />
          </Panel>
          <Panel title="What moved the low the most" sub="One-at-a-time sensitivity: each input applied alone against the base.">
            {drivers.length === 0 ? <p className="text-sm text-muted">All inputs are at base. Move a slider or apply a preset.</p> : (
              <div className="space-y-2">
                {drivers.map((d) => (
                  <div key={d.k} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0">{LABEL[d.k]}</span>
                    <div className="h-3 flex-1 rounded-sm bg-[var(--soft)]"><div className={`h-3 rounded-sm ${d.delta < 0 ? 'bg-risk' : 'bg-cash'}`} style={{ width: `${(Math.abs(d.delta) / maxD) * 100}%` }} /></div>
                    <span className={`num w-20 text-right ${d.delta < 0 ? 'text-risk' : 'text-cash'}`}>{money(d.delta, 'USD', { signed: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Critique my scenario" right={<div className="flex gap-2"><Button size="sm" variant="ai" action="S-09" onClick={() => setCritique(buildCritique())}><Sparkles size={14} />Critique</Button>
            <Button size="sm" action="S-10" onClick={() => nav(`/app/ask?q=${encodeURIComponent(s.capexAmount ? `Can we afford $${(s.capexAmount / 1e6).toFixed(1)}M capex in week ${s.capexWeek}?` : `What if ${(['EUR', 'GBP', 'MXN', 'INR'] as const).find((c) => s.fx[c] !== 0) ?? 'EUR'} moves ${s.fx[(['EUR', 'GBP', 'MXN', 'INR'] as const).find((c) => s.fx[c] !== 0) ?? 'EUR'] || -5}%?`)}`)}><MessageSquare size={14} />Send to Ask</Button></div>}>
            {critique ? <div className="rounded-ctl bg-[var(--ai-bg)] p-3 text-sm leading-relaxed"><StreamText text={critique} /></div> : <p className="text-sm text-muted">FlowCast names the input that hurts most and suggests a mitigation from your open recommendations.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
