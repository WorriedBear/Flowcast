import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { useApp, type Listing, type PublishStatus } from '../store/useApp';
import { parseManifest, unusedScopes } from '../lib/manifest';
import { Button, Field, Modal, PageHeader, Panel, Pill, inputCls, usePageTitle } from '../components/ui';
import { toast } from '../components/toast';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https:\/\/[^\s.]+\.[^\s]{2,}$/;
export function listingErrors(l: Listing) {
  const e: Partial<Record<keyof Listing, string>> = {};
  if (l.name.trim().length < 3) e.name = 'Name must be at least 3 characters.';
  if (!l.short.trim()) e.short = 'Add a short description.';
  else if (l.short.length > 140) e.short = 'Keep it to 140 characters or fewer.';
  if (l.long.trim().length < 40) e.long = 'Long description must be at least 40 characters.';
  if (l.pricing !== 'free' && !(Number(l.price) > 0)) e.price = 'Enter a price greater than 0.';
  if (!EMAIL.test(l.email)) e.email = 'Enter a valid support email, e.g. support@northbeam.dev.';
  if (!URL_RE.test(l.privacy)) e.privacy = 'Enter an https:// privacy policy URL.';
  return e;
}

const STAGES: { id: PublishStatus; label: string }[] = [{ id: 'submitted', label: 'Submitted' }, { id: 'in_review', label: 'Automated review' }, { id: 'intuit_review', label: 'Intuit review' }, { id: 'live', label: 'Live' }];

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ i, x: (Math.random() - 0.5) * 700, y: -200 - Math.random() * 300, r: Math.random() * 540, c: ['#236CFF', '#0F8A5F', '#B7791F', '#6E56CF', '#C2410C'][i % 5] })), []);
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center">
      {bits.map((b) => <motion.span key={b.i} className="absolute h-2 w-3 rounded-sm" style={{ background: b.c }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: b.x, y: [0, b.y, b.y + 600], rotate: b.r, opacity: [1, 1, 0] }} transition={{ duration: 1.8, ease: 'easeOut' }} />)}
    </div>
  );
}

export default function DevPublish() {
  usePageTitle('Certification & publish', 'Complete the listing, pass the checklist and go live.');
  const d = useApp((s) => s.developer);
  const dev = useApp((s) => s.dev);
  const setLive = useApp((s) => s.setRevforecastLive);
  const setPersona = useApp((s) => s.setPersona);
  const uninstall = useApp((s) => s.uninstall);
  const installed = useApp((s) => s.customer.installedAgents);
  const log = useApp((s) => s.log);
  const nav = useNavigate();
  const [touched, setTouched] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const l = d.listing;
  const errs = listingErrors(l);
  const set = (p: Partial<Listing>) => dev({ listing: { ...l, ...p } });
  const pm = parseManifest(d.manifestText);
  const last = d.evalRuns.length ? d.evalRuns[d.evalRuns.length - 1].passed : 0;
  const checks = [
    { label: 'Manifest valid', ok: pm.ok, to: '/dev/build' },
    { label: 'Evals ≥ 95% (48/50)', ok: last >= 48, to: '/dev/build', sub: d.evalRuns.length ? `Last run ${last}/50` : 'Not run' },
    { label: 'Scopes minimized', ok: !!pm.manifest && unusedScopes(pm.manifest).length === 0, to: '/dev/build', sub: pm.manifest && unusedScopes(pm.manifest).length ? `Unused: ${unusedScopes(pm.manifest).join(', ')}` : undefined },
    { label: 'Human checkpoint present', ok: !!pm.manifest && (pm.manifest.autonomy === 'insight' || !!pm.manifest.humanCheckpoint), to: '/dev/build' },
    { label: 'Provenance on all outputs', ok: !!pm.manifest?.flags?.attachProvenance, to: '/dev/build', sub: 'Apply the eval fix "attach provenance"' },
    { label: 'Listing complete', ok: Object.keys(errs).length === 0, to: '#listing' },
  ];
  const allOk = checks.every((c) => c.ok);
  const stageIdx = STAGES.findIndex((s) => s.id === d.publishStatus);

  useEffect(() => {
    if (d.publishStatus === 'draft' || d.publishStatus === 'live') return;
    const t = setTimeout(() => {
      const next = STAGES[stageIdx + 1].id;
      dev({ publishStatus: next });
      if (next === 'live') { setLive(true); setConfetti(true); log('user', 'approve', 'RevForecast for DTC went live in the marketplace', ['Marketplace: revforecast']); toast('RevForecast for DTC is live'); setTimeout(() => setConfetti(false), 2000); }
    }, 1500);
    return () => clearTimeout(t);
  }, [d.publishStatus, stageIdx, dev, setLive, log]);

  const E = (k: keyof Listing) => (touched ? errs[k] : undefined);
  return (
    <div className="space-y-5">
      {confetti && <Confetti />}
      <PageHeader title="Certification & publish" sub="RevForecast for DTC goes from sandbox to the IES marketplace." right={d.publishStatus === 'live' && <Pill tone="cash">Live in marketplace</Pill>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel id="listing" title="Marketplace listing">
          <fieldset disabled={d.publishStatus !== 'draft'} className="grid gap-3 md:grid-cols-2">
            <Field label="Name" error={E('name')}><input data-action="U-01" className={inputCls} value={l.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Category"><select data-action="U-01" className={inputCls} value={l.category} onChange={(e) => set({ category: e.target.value })}><option value="signals">Forecast signals</option><option value="collections">Collections</option><option value="payments">Payments</option></select></Field>
            <div className="md:col-span-2"><Field label={`Short description (${l.short.length}/140)`} error={E('short')}><input data-action="U-01" className={inputCls} value={l.short} maxLength={160} onChange={(e) => set({ short: e.target.value })} placeholder="Holiday-aware payout forecasts for DTC brands" /></Field></div>
            <div className="md:col-span-2"><Field label="Long description" error={E('long')}><textarea data-action="U-01" rows={3} className={inputCls} value={l.long} onChange={(e) => set({ long: e.target.value })} /></Field></div>
            <Field label="Pricing"><select data-action="U-01" className={inputCls} value={l.pricing} onChange={(e) => set({ pricing: e.target.value as Listing['pricing'] })}><option value="per_company">Per active company / month</option><option value="usage">Usage based</option><option value="free">Free</option></select></Field>
            {l.pricing !== 'free' && <Field label="Price (USD)" error={E('price')}><input data-action="U-01" className={inputCls} inputMode="decimal" value={l.price} onChange={(e) => set({ price: e.target.value })} /></Field>}
            <Field label="Support email" error={E('email')}><input data-action="U-01" type="email" className={inputCls} value={l.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Privacy policy URL" error={E('privacy')}><input data-action="U-01" className={inputCls} value={l.privacy} onChange={(e) => set({ privacy: e.target.value })} placeholder="https://" /></Field>
            <div className="md:col-span-2"><Button size="sm" variant="ghost" onClick={() => { set({ short: 'Holiday-aware revenue and payout forecasts for DTC brands on IES.', long: 'RevForecast reads your commerce payouts, detects seasonality and promotions, and posts signals into the FlowCast forecast with full provenance.', email: 'support@northbeam.dev', privacy: 'https://northbeam.dev/privacy' }); setTouched(true); }}>Fill with Northbeam details</Button></div>
          </fieldset>
        </Panel>
        <div className="space-y-5">
          <Panel title="Checklist">
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  {c.ok ? <CheckCircle2 size={16} className="mt-0.5 text-cash" /> : <XCircle size={16} className="mt-0.5 text-risk" />}
                  <div className="flex-1">{c.label}{c.sub && !c.ok && <div className="text-xs text-muted">{c.sub}</div>}</div>
                  {!c.ok && (c.to.startsWith('#') ? <a href={c.to} data-action="U-02" className="link text-xs" onClick={() => setTouched(true)}>Fix</a> : <Link to={c.to} data-action="U-02" className="link text-xs">Fix</Link>)}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {d.publishStatus === 'draft'
                ? <Button variant="primary" action="U-03" tour="publish-submit" className="w-full" disabled={!allOk} onClick={() => { dev({ publishStatus: 'submitted' }); toast('Submitted for review'); }}>Submit for review</Button>
                : d.publishStatus === 'live'
                  ? <div className="space-y-2"><Button variant="primary" action="U-04" tour="publish-submit" className="w-full" onClick={() => { setPersona('cfo'); nav('/app/marketplace/revforecast?new=1'); }}>See it as a customer</Button><Button variant="danger" action="U-05" destructive className="w-full" onClick={() => setConfirm(true)}>Unpublish</Button></div>
                  : <p className="text-sm text-muted">Review in progress…</p>}
              {!allOk && d.publishStatus === 'draft' && <p className="mt-2 text-xs text-muted">Submit unlocks when every check passes.</p>}
            </div>
          </Panel>
          <Panel title="Review timeline">
            <ol className="space-y-3 text-sm">
              {STAGES.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  {i < stageIdx || d.publishStatus === 'live' ? <CheckCircle2 size={16} className="text-cash" /> : i === stageIdx ? <Loader2 size={16} className="animate-spin text-action" /> : <Circle size={16} className="text-muted" />}
                  <span className={i <= stageIdx ? 'font-medium' : 'text-muted'}>{s.label}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Unpublish RevForecast?" footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" action="U-05" onClick={() => {
        dev({ publishStatus: 'draft' }); setLive(false); if (installed.includes('revforecast')) uninstall('revforecast');
        log('user', 'approve', 'RevForecast for DTC unpublished and removed from the catalog', ['Marketplace: revforecast']); toast('Unpublished. RevForecast is back in draft.'); setConfirm(false);
      }}>Unpublish</Button></>}>
        <p className="text-sm">RevForecast returns to draft and disappears from the marketplace. Customers who installed it lose its signals.</p>
      </Modal>
    </div>
  );
}
