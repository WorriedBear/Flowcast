import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { newApiKey, useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { mockApi, type ApiResult } from '../lib/api';
import { ALL_SCOPES } from '../data/developer';
import { Button, Field, PageHeader, Panel, Tabs, copyText, inputCls, usePageTitle } from '../components/ui';
import { JsonView } from '../components/JsonView';
import { toast } from '../components/toast';
import { ttfc } from './DevHome';

const STEPS = ['Sign in', 'Workspace', 'Provision sandbox', 'API key', 'First call'];
const PROVISION = ['Cloning a synthetic company from the Solace Living template', 'Creating 5 entities (US, UK, DE, MX, IN)', 'Enabling 4 currencies on the multi-currency rate table', 'Generating 18 months of transaction history', 'Indexing the forecast graph and events'];

export default function DevStart() {
  usePageTitle('Onboarding & sandbox', 'Sign in, provision a sandbox and make your first call.');
  const d = useApp((s) => s.developer);
  const dev = useApp((s) => s.dev);
  const { items } = useComputed();
  const policy = useApp((s) => s.customer.policy);
  const [err, setErr] = useState('');
  const [prov, setProv] = useState(d.sandboxReady ? PROVISION.length : -1);
  const [reveal, setReveal] = useState(false);
  const [lang, setLang] = useState<'curl' | 'ts' | 'py'>('curl');
  const [res, setRes] = useState<ApiResult | null>(null);
  const step = d.onboardingStep;

  useEffect(() => {
    if (prov < 0 || prov >= PROVISION.length) return;
    const t = setTimeout(() => { setProv(prov + 1); if (prov + 1 === PROVISION.length) { dev({ sandboxReady: true }); toast('Sandbox ready'); } }, 450);
    return () => clearTimeout(t);
  }, [prov, dev]);
  useEffect(() => { if (step === 3 && !d.apiKey) dev({ apiKey: newApiKey() }); }, [step, d.apiKey, dev]);

  const next = () => {
    if (step === 1) {
      if (!/^[\w -]{3,40}$/.test(d.workspace.trim())) { setErr('Workspace name must be 3–40 characters: letters, numbers, spaces, hyphens.'); return; }
      if (!d.useCase) { setErr('Choose a use case.'); return; }
    }
    if (step === 2 && !d.sandboxReady) { setErr('Provision the sandbox first.'); return; }
    setErr(''); dev({ onboardingStep: Math.min(4, step + 1) });
  };
  const masked = d.apiKey ? `${d.apiKey.slice(0, 8)}${'•'.repeat(20)}${d.apiKey.slice(-4)}` : '';
  const code = {
    curl: `curl https://sandbox.api.ies.intuit.example/v1/cash/positions?consolidated=true \\\n  -H "Authorization: Bearer ${masked}"`,
    ts: `import { IES } from '@intuit/ies-agent-sdk';\nconst ies = new IES({ apiKey: process.env.IES_API_KEY, env: 'sandbox' });\nconst res = await ies.cash.positions({ consolidated: true });\nconsole.info(res.consolidated.balance);`,
    py: `from ies_agent_sdk import IES\nies = IES(api_key=os.environ["IES_API_KEY"], env="sandbox")\nres = ies.cash.positions(consolidated=True)\nprint(res["consolidated"]["balance"])`,
  }[lang];

  return (
    <div className="space-y-5">
      <PageHeader title="Onboarding & sandbox" sub="From sign-in to a first successful API call, in minutes." />
      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => <li key={s} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${i < step ? 'border-cash text-cash' : i === step ? 'border-action text-action' : 'border-rule text-muted'}`}>{i < step ? <CheckCircle2 size={14} /> : <span className="num">{i + 1}</span>}{s}</li>)}
      </ol>
      <Panel tour="first-call">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm">Use your Intuit developer account. This sandbox is free and isolated from any real company data.</p>
            <Button variant="primary" action="O-01" onClick={() => { dev({ startedAt: new Date().toISOString(), onboardingStep: 1 }); toast('Signed in as Dev Shah (Northbeam Labs)'); }}>Sign in with Intuit</Button>
          </div>
        )}
        {step === 1 && (
          <div className="grid max-w-xl gap-3">
            <Field label="Workspace name" error={err && err.startsWith('Workspace') ? err : undefined}><input className={inputCls} value={d.workspace} onChange={(e) => { dev({ workspace: e.target.value }); setErr(''); }} placeholder="northbeam-labs" /></Field>
            <Field label="Use case" error={err === 'Choose a use case.' ? err : undefined}>
              <select className={inputCls} value={d.useCase} onChange={(e) => { dev({ useCase: e.target.value }); setErr(''); }}>
                <option value="">Choose a use case</option><option>Forecast signals</option><option>Collections automation</option><option>FX execution</option><option>Reporting and BI</option>
              </select>
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <Button variant="primary" action="O-02" disabled={prov >= 0} onClick={() => setProv(0)}>{d.sandboxReady ? 'Sandbox provisioned' : prov >= 0 ? 'Provisioning…' : 'Provision sandbox'}</Button>
            <ul className="space-y-1.5 font-mono text-xs">
              {PROVISION.map((p, i) => <li key={p} className={`flex items-center gap-2 ${i < prov ? 'text-cash' : i === prov ? 'text-ink' : 'text-muted'}`}>{i < prov ? <CheckCircle2 size={14} /> : i === prov ? <Loader2 size={14} className="animate-spin" /> : <span className="w-3.5" />}{p}</li>)}
            </ul>
            {err && <p role="alert" className="text-sm text-risk">{err}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm">Your sandbox key has all read scopes plus <code>forecast.signals.write</code>. Keep it secret.</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-ctl border border-rule bg-[var(--soft)] px-3 py-2 font-mono text-sm">{reveal ? d.apiKey : masked}</code>
              <Button size="sm" action="O-03" aria-label={reveal ? 'Hide key' : 'Reveal key'} onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff size={14} /> : <Eye size={14} />}{reveal ? 'Hide' : 'Reveal'}</Button>
              <Button size="sm" action="O-04" onClick={() => copyText(d.apiKey, 'API key copied')}>Copy key</Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            <Tabs action="O-05" value={lang} onChange={setLang} tabs={[{ id: 'curl', label: 'curl' }, { id: 'ts', label: 'TypeScript' }, { id: 'py', label: 'Python' }]} />
            <pre className="overflow-auto rounded-ctl bg-[#0A1626] p-3 font-mono text-xs text-[#E6EDF5]">{code}</pre>
            <Button variant="primary" action="O-06" onClick={() => {
              const r = mockApi('cash-positions', { consolidated: 'true' }, { scopes: ALL_SCOPES, items, policy, apiKey: d.apiKey });
              setRes(r);
              if (!d.firstCallAt) dev({ firstCallAt: new Date().toISOString() });
              toast('First call succeeded');
            }}>Run</Button>
            {res && <JsonView value={res.json} status={res.status} />}
            {d.firstCallAt && <div className="rounded-ctl bg-[color-mix(in_srgb,var(--cash)_12%,transparent)] p-3 text-sm"><strong className="text-cash">Time to first call: {ttfc(d.startedAt, d.firstCallAt)}</strong>. Next, <Link to="/dev/build" className="link">build your agent</Link> or <Link to="/dev/api" className="link">explore the API</Link>.</div>}
          </div>
        )}
        <div className="mt-5 flex gap-2 rule-t pt-4">
          <Button action="O-01" disabled={step === 0} onClick={() => { setErr(''); dev({ onboardingStep: step - 1 }); }}>Back</Button>
          {step > 0 && step < 4 && <Button variant="primary" action="O-01" onClick={next}>Continue</Button>}
          {err && step === 1 && !err.startsWith('Workspace') && err !== 'Choose a use case.' && <p className="text-sm text-risk">{err}</p>}
        </div>
      </Panel>
    </div>
  );
}
