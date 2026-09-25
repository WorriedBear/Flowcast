import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../store/useApp';
import { SDK_SNIPPET, SEED_MANIFEST } from '../data/developer';
import { parseManifest, KNOWN_TOOLS } from '../lib/manifest';
import { applyFixes, runEvals, type EvalFailure, type EvalResult } from '../lib/evals';
import { REVFORECAST_ITEMS } from '../data/flows';
import { Button, Modal, PageHeader, Panel, Pill, inputCls, usePageTitle } from '../components/ui';
import { Code } from '../components/JsonView';
import { toast } from '../components/toast';

const SCOPE_OPTS = ['commerce.read', 'forecast.read', 'forecast.signals.write', 'cash.read', 'fx.read', 'entities.read', 'recommendations.write'];
const LOG = ['Fetched 52 weeks of commerce payouts (sandbox, 3 channels)', 'Detected seasonality: holiday uplift W9–W12, promo spikes on 2 dates', 'Computed signal delta vs. the current forecast: +9.6% over W9–W12', 'Human checkpoint: delta ≤ 15%, no approval needed in sandbox', 'Posted 4 forecast signals with provenance rf-sbx-0925-01'];

export default function DevBuild() {
  usePageTitle('Agent builder & evals', 'Write the manifest, run in sandbox and pass certification evals.');
  const d = useApp((s) => s.developer);
  const dev = useApp((s) => s.dev);
  const text = d.manifestText;
  const parsed = useMemo(() => parseManifest(text), [text]);
  const [validated, setValidated] = useState<ReturnType<typeof parseManifest> | null>(null);
  const [runLines, setRunLines] = useState(d.sandboxRun ? LOG.length : -1);
  const [runErr, setRunErr] = useState('');
  const [evalProg, setEvalProg] = useState(-1);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [trace, setTrace] = useState<EvalFailure | null>(null);

  useEffect(() => {
    if (runLines < 0 || runLines >= LOG.length) return;
    const t = setTimeout(() => { setRunLines(runLines + 1); if (runLines + 1 === LOG.length) { dev({ sandboxRun: true }); toast('Sandbox run complete'); } }, 380);
    return () => clearTimeout(t);
  }, [runLines, dev]);
  useEffect(() => {
    if (evalProg < 0 || evalProg >= 100) return;
    const t = setTimeout(() => {
      const n = evalProg + 10;
      setEvalProg(n);
      if (n >= 100 && parsed.manifest) {
        const r = runEvals(parsed.manifest);
        setResult(r);
        dev({ evalRuns: [...d.evalRuns, { at: new Date().toISOString(), passed: r.passed }] });
        toast(`Evals: ${r.passed}/${r.total} passed`, r.passed === r.total ? 'success' : 'info');
      }
    }, 120);
    return () => clearTimeout(t);
  }, [evalProg]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = parsed.manifest;
  const rewrite = (patch: Record<string, unknown>) => {
    if (!m) return;
    dev({ manifestText: JSON.stringify({ ...m, ...patch }, null, 2) });
    setValidated(null);
  };
  const lines = text.split('\n').length;
  const preview = [9, 10, 11, 12].map((w) => ({ week: `W${w}`, before: 1.9, after: 1.9 + REVFORECAST_ITEMS.find((i) => i.week === w)!.amountLocal / 1e6 }));

  return (
    <div className="space-y-5">
      <PageHeader title="Agent builder & evals" sub="RevForecast for DTC by Northbeam Labs. Edit the manifest or use the form; they stay in sync." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="manifest.json" right={<div className="flex gap-2"><Button size="sm" variant="primary" action="B-01" onClick={() => { setValidated(parseManifest(text)); }}>Validate</Button><Button size="sm" variant="ghost" action="B-07" destructive onClick={() => { dev({ manifestText: SEED_MANIFEST }); setValidated(null); setResult(null); toast('Manifest reset to the seed'); }}>Reset manifest</Button></div>}>
          <div className="flex overflow-hidden rounded-ctl border border-rule bg-[#0A1626]">
            <pre aria-hidden="true" className="select-none border-r border-[#22405F] px-2 py-2 text-right font-mono text-xs leading-5 text-[#5B7A99]">{Array.from({ length: lines }, (_, i) => i + 1).join('\n')}</pre>
            <textarea aria-label="Manifest JSON" spellCheck={false} value={text} onChange={(e) => { dev({ manifestText: e.target.value }); setValidated(null); }} rows={lines + 1}
              className="w-full resize-none bg-transparent px-3 py-2 font-mono text-xs leading-5 text-[#E6EDF5] outline-none" />
          </div>
          {validated && (validated.ok
            ? <p role="status" className="mt-2 flex items-center gap-1.5 text-sm text-cash"><CheckCircle2 size={16} />Valid manifest</p>
            : <ul role="alert" className="mt-2 space-y-1 text-sm text-risk">{validated.errors.map((e) => <li key={e.message} className="flex gap-1.5"><XCircle size={16} className="mt-0.5 shrink-0" />{e.line ? `Line ${e.line}: ` : ''}{e.message}</li>)}</ul>)}
        </Panel>
        <Panel title="Form" sub={m ? 'Edits rewrite the JSON.' : 'Fix the JSON to edit with the form.'}>
          <fieldset disabled={!m} className="space-y-3 text-sm">
            <label className="block">Name<input data-action="B-02" className={`${inputCls} mt-1`} value={m?.name ?? ''} onChange={(e) => rewrite({ name: e.target.value })} /></label>
            <label className="block">Autonomy<select data-action="B-02" className={`${inputCls} mt-1`} value={m?.autonomy ?? 'suggest'} onChange={(e) => rewrite({ autonomy: e.target.value })}><option value="insight">insight</option><option value="suggest">suggest</option><option value="act">act</option></select></label>
            <div>Scopes<div className="mt-1 space-y-1">{SCOPE_OPTS.map((s) => <label key={s} className="flex items-center gap-1.5 text-xs"><input data-action="B-02" type="checkbox" checked={m?.scopes?.includes(s) ?? false} onChange={(e) => rewrite({ scopes: e.target.checked ? [...(m?.scopes ?? []), s] : (m?.scopes ?? []).filter((x) => x !== s) })} /><code>{s}</code></label>)}</div></div>
            <p className="text-xs text-muted">Known tools: {KNOWN_TOOLS.join(', ')}</p>
          </fieldset>
        </Panel>
      </div>
      <Panel title="SDK example" sub="@intuit/ies-agent-sdk (illustrative)"><Code code={SDK_SNIPPET} /></Panel>
      <Panel title="Run in sandbox" right={<Button variant="primary" action="B-03" onClick={() => {
        if (!parsed.ok) { setRunErr('invalid'); return; }
        if (!d.sandboxReady) { setRunErr('sandbox'); return; }
        setRunErr(''); setRunLines(0);
      }}>Run in sandbox</Button>}>
        {runErr === 'invalid' && <p role="alert" className="mb-2 text-sm text-risk">The manifest is invalid. Click Validate to see the errors, then fix them.</p>}
        {runErr === 'sandbox' && <p role="alert" className="mb-2 text-sm text-risk">No sandbox yet. <Link to="/dev/start" className="link">Provision one in onboarding</Link>, then run again.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <pre className="min-h-[140px] rounded-ctl bg-[#0A1626] p-3 font-mono text-xs leading-6 text-[#E6EDF5]">{runLines < 0 ? 'Logs appear here.' : LOG.slice(0, runLines).map((l, i) => `09:4${i}:${String(12 + i * 7).padStart(2, '0')}  ${l}`).join('\n')}</pre>
          {runLines >= LOG.length && (
            <div className="h-48"><ResponsiveContainer><BarChart data={preview}><CartesianGrid stroke="var(--rule)" vertical={false} /><XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted)' }} /><YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v) => `$${v}M`} /><Tooltip formatter={(v: number) => `$${v.toFixed(2)}M`} /><Legend /><Bar dataKey="before" name="Sandbox payouts before" fill="var(--muted)" /><Bar dataKey="after" name="With RevForecast signal" fill="var(--ai)" /></BarChart></ResponsiveContainer></div>
          )}
        </div>
      </Panel>
      <Panel title="Certification evals" sub="50 cases across currencies, entities, holidays and provenance. Publishing needs ≥ 95%." tour="evals"
        right={<div className="flex gap-2">{result && result.failures.length > 0 && <Button action="B-06" onClick={() => { dev({ manifestText: applyFixes(text) }); setResult(null); toast('Suggested fixes applied to the manifest'); }}>Apply suggested fixes</Button>}<Button variant="primary" action="B-04" disabled={evalProg >= 0 && evalProg < 100} onClick={() => { if (!parsed.ok) { toast('Fix the manifest before running evals', 'error'); return; } setResult(null); setEvalProg(0); }}>Run evals</Button></div>}>
        {evalProg >= 0 && evalProg < 100 && <div className="h-2 rounded bg-[var(--soft)]"><div className="h-2 rounded bg-ai transition-all" style={{ width: `${evalProg}%` }} /></div>}
        {!result && evalProg < 0 && <p className="text-sm text-muted">{d.evalRuns.length ? `Last run: ${d.evalRuns[d.evalRuns.length - 1].passed}/50.` : 'Not run yet.'}</p>}
        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3"><span className={`num text-[28px] font-semibold ${result.passed === result.total ? 'text-cash' : 'text-fx'}`}>{result.passed}/{result.total}</span>{result.passed === result.total ? <Pill tone="cash">Certified. Ready to publish</Pill> : <Pill tone="fx">{result.failures.length} failures</Pill>}{result.passed === result.total && <Link to="/dev/publish" className="link text-sm">Go to publish</Link>}</div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div><div className="text-xs text-muted">Accuracy vs. holdout</div><div className="num font-semibold">{result.metrics.accuracy}%</div></div>
              <div><div className="text-xs text-muted">Hallucination rate</div><div className="num font-semibold">{result.metrics.hallucination}%</div></div>
              <div><div className="text-xs text-muted">Scope violations</div><div className="num font-semibold">{result.metrics.scopeViolations}</div></div>
              <div><div className="text-xs text-muted">p95 latency</div><div className="num font-semibold">{result.metrics.p95ms} ms</div></div>
            </div>
            {result.failures.map((f) => (
              <div key={f.id} className="flex flex-wrap items-start gap-3 rounded-ctl border border-rule p-3 text-sm">
                <XCircle size={16} className="mt-0.5 text-risk" />
                <div className="flex-1"><div className="font-medium">{f.id} · {f.name}</div><div className="text-muted">Suggested fix: {f.fix}</div></div>
                <Button size="sm" action="B-05" onClick={() => setTrace(f)}>View trace</Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Modal open={!!trace} onClose={() => setTrace(null)} title={`Trace · ${trace?.id} ${trace?.name}`} footer={<Button onClick={() => setTrace(null)}>Close</Button>}>
        <pre className="whitespace-pre-wrap rounded-ctl bg-[#0A1626] p-3 font-mono text-xs text-[#E6EDF5]">{trace?.trace}</pre>
        <p className="mt-3 text-sm"><strong>Fix:</strong> {trace?.fix}</p>
      </Modal>
    </div>
  );
}
