import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Search, Star } from 'lucide-react';
import { useApp } from '../store/useApp';
import { AGENTS, CATEGORY_LABEL, agentById, type Agent } from '../data/agents';
import { agentPaused } from '../lib/derive';
import { Button, Modal, PageHeader, Panel, Pill, inputCls, usePageTitle } from '../components/ui';
import { toast } from '../components/toast';
import NotFound from './NotFound';

function useCatalog() {
  const live = useApp((s) => s.customer.revforecastLive);
  return AGENTS.filter((a) => a.status === 'live' || (a.id === 'revforecast' && live));
}

export function Marketplace() {
  usePageTitle('Agent marketplace', 'Agents that extend the FlowCast forecast graph.');
  const [p, setP] = useSearchParams();
  const installed = useApp((s) => s.customer.installedAgents);
  const catalog = useCatalog();
  const nav = useNavigate();
  const q = p.get('q') ?? '', cat = p.get('category') ?? '', inst = p.get('installed') === '1', sort = p.get('sort') ?? 'rating';
  const upd = (k: string, v: string) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); setP(n, { replace: true }); };
  const rows = catalog
    .filter((a) => (!q || `${a.name} ${a.description} ${a.publisher}`.toLowerCase().includes(q.toLowerCase())) && (!cat || a.category === cat) && (!inst || installed.includes(a.id)))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'installs' ? b.installs - a.installs : b.rating - a.rating));
  return (
    <div className="space-y-5">
      <PageHeader title="Agent marketplace" sub="Certified agents from developers and advisor firms. Each one declares its scopes; you grant them at install and can revoke them in the Trust Center." />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-muted" /><input data-action="M-01" aria-label="Search agents" className={`${inputCls} pl-9`} placeholder="Search agents" value={q} onChange={(e) => upd('q', e.target.value)} /></div>
        <select data-action="M-02" aria-label="Category" className={`${inputCls} w-auto`} value={cat} onChange={(e) => upd('category', e.target.value)}><option value="">All categories</option>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input data-action="M-02" type="checkbox" checked={inst} onChange={(e) => upd('installed', e.target.checked ? '1' : '')} />Installed only</label>
        <select data-action="M-03" aria-label="Sort" className={`${inputCls} w-auto`} value={sort} onChange={(e) => upd('sort', e.target.value)}><option value="rating">Sort by rating</option><option value="installs">Sort by installs</option><option value="name">Sort by name</option></select>
      </div>
      {rows.length === 0 ? <Panel><p className="text-sm text-muted">No agents match. Clear the search or filters to see all {catalog.length}.</p></Panel> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => (
            <button key={a.id} type="button" data-action="M-04" onClick={() => nav(`/app/marketplace/${a.id}`)} className="panel flex flex-col p-4 text-left hover:border-action">
              <div className="flex items-start justify-between gap-2">
                <div><div className="flex items-center gap-1.5 font-semibold">{a.name}{a.verified && <BadgeCheck size={16} className="text-action" aria-label="Verified" />}</div><div className="text-xs text-muted">{a.publisher}</div></div>
                {installed.includes(a.id) ? <Pill tone="cash">Installed</Pill> : a.id === 'revforecast' ? <Pill tone="ai">New</Pill> : null}
              </div>
              <p className="mt-2 flex-1 text-sm">{a.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted"><span>{CATEGORY_LABEL[a.category]}</span><span className="flex items-center gap-0.5"><Star size={12} className="fill-current text-fx" />{a.rating.toFixed(1)}</span><span>{a.installs.toLocaleString('en-US')} installs</span></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsentModal({ a, onClose }: { a: Agent; onClose: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const install = useApp((s) => s.install);
  const ready = a.scopes.filter((s) => s.required).every((s) => checked.includes(s.id));
  return (
    <Modal open onClose={onClose} title={`Install ${a.name}`} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" action="M-07" disabled={!ready} onClick={() => {
      install(a.id, checked); toast(`${a.name} installed. ${a.contributes === 'signal' ? 'Its signals now feed your forecast.' : a.id === 'hedgeloop' ? 'Partner execution is enabled for approved hedges.' : 'It is now active.'}`); onClose();
    }}>Install agent</Button></>}>
      <p className="mb-3 text-sm">{a.name} asks for these scopes. Check each required scope to allow it. You can revoke any scope later in the Trust Center.</p>
      <div className="space-y-2">
        {a.scopes.map((s) => (
          <label key={s.id} className="flex items-start gap-2 rounded-ctl border border-rule p-2 text-sm">
            <input data-action="M-06" type="checkbox" className="mt-1" checked={checked.includes(s.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, s.id] : checked.filter((x) => x !== s.id))} />
            <span><code className="text-xs">{s.id}</code> {s.required ? <Pill tone="fx">Required</Pill> : <Pill>Optional</Pill>}<br />{s.label}. <span className="text-muted">{s.why}</span></span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

export function AgentDetail() {
  const { agentId } = useParams();
  const [p] = useSearchParams();
  const a = agentById(agentId ?? '');
  const catalog = useCatalog();
  const c = useApp((s) => s.customer);
  const uninstall = useApp((s) => s.uninstall);
  const [consent, setConsent] = useState(false);
  const [confirm, setConfirm] = useState(false);
  usePageTitle(a ? a.name : 'Agent not found', a?.description);
  if (!a || !catalog.includes(a)) return <NotFound inline />;
  const installed = c.installedAgents.includes(a.id);
  return (
    <div className="space-y-5">
      <Link to="/app/marketplace" className="text-sm text-action">Back to marketplace</Link>
      {p.get('new') === '1' && <div role="status" className="rounded-panel border border-ai bg-[var(--ai-bg)] p-3 text-sm"><strong className="text-ai">Just published.</strong> Northbeam Labs released this agent minutes ago. It passed 50/50 certification evals.</div>}
      <PageHeader title={<span className="flex flex-wrap items-center gap-2">{a.name}{a.verified && <BadgeCheck className="text-action" aria-label="Verified" />}{installed && (agentPaused(c, a.id) ? <Pill tone="risk">Paused: missing scope</Pill> : <Pill tone="cash">Installed</Pill>)}</span>}
        sub={`${a.publisher} · ${CATEGORY_LABEL[a.category]} · ${a.rating.toFixed(1)} rating · ${a.installs.toLocaleString('en-US')} installs`}
        right={<div className="flex gap-2">{installed ? <><Link to="/app/trust#access" data-action="M-09" className="inline-flex h-10 items-center rounded-ctl border border-rule px-4 text-sm font-medium hover:border-action">Manage access</Link><Button variant="danger" action="M-08" destructive onClick={() => setConfirm(true)}>Uninstall</Button></> : <Button variant="primary" action="M-05" tour="install" onClick={() => setConsent(true)}>Install</Button>}</div>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Overview"><p className="text-sm">{a.description}</p></Panel>
          <Panel title="What it adds to your forecast"><p className="text-sm">{a.adds}</p>{a.contributes === 'signal' && <p className="mt-2 text-xs text-muted">Signals appear as line items labeled with this agent as the source, in the week drawers and source drawers.</p>}</Panel>
          <Panel title="Data scopes">
            <ul className="space-y-2 text-sm">{a.scopes.map((s) => <li key={s.id}><code className="text-xs">{s.id}</code> {s.required ? '' : '(optional)'} · {s.label}. <span className="text-muted">{s.why}</span></li>)}</ul>
          </Panel>
          <Panel title="Reviews"><ul className="space-y-3 text-sm">{a.reviews.map((r) => <li key={r.who}><div className="flex items-center gap-1 text-fx">{'★'.repeat(r.stars)}<span className="text-xs text-muted">{r.who}</span></div>{r.text}</li>)}</ul></Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Pricing"><p className="text-sm">{a.pricing}</p></Panel>
          <Panel title="Certification"><div className="flex flex-wrap gap-1.5">{a.badges.map((b) => <Pill key={b} tone="action">{b}</Pill>)}</div></Panel>
          <Panel title="Publisher"><p className="text-sm">{a.publisher}{a.firstParty ? '' : '. Fictional publisher for this prototype.'}</p></Panel>
        </div>
      </div>
      {consent && <ConsentModal a={a} onClose={() => setConsent(false)} />}
      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Uninstall ${a.name}?`} footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" action="M-08" onClick={() => { uninstall(a.id); toast(`${a.name} uninstalled; its contributions were removed`); setConfirm(false); }}>Uninstall</Button></>}>
        <p className="text-sm">{a.contributes === 'signal' ? 'Its signal line items will be removed from your forecast.' : a.id === 'hedgeloop' ? 'Partner execution will be disabled for approved hedges.' : 'It will stop running.'}</p>
      </Modal>
    </div>
  );
}
