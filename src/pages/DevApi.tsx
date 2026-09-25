import { useRef, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { ALL_SCOPES, ENDPOINTS, MCP_CONFIG, endpointById, type Endpoint } from '../data/developer';
import { mockApi, type ApiResult } from '../lib/api';
import { Button, PageHeader, Panel, Pill, inputCls, usePageTitle } from '../components/ui';
import { Code, JsonView } from '../components/JsonView';
import NotFound from './NotFound';

function TryIt({ ep }: { ep: Endpoint }) {
  const { items } = useComputed();
  const policy = useApp((s) => s.customer.policy);
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(ep.params.map((p) => [p.name, p.example])));
  const [scopes, setScopes] = useState<string[]>(ALL_SCOPES);
  const [res, setRes] = useState<(ApiResult & { ms: number }) | null>(null);
  const hits = useRef<number[]>([]);
  const send = () => {
    const now = Date.now();
    hits.current = hits.current.filter((t) => now - t < 10000).concat(now);
    const ms = 80 + Math.floor(Math.random() * 100);
    if (hits.current.length > 10) { setRes({ status: 429, json: { error: { code: 'rate_limited', message: 'More than 10 requests in 10 seconds. Wait a few seconds and retry; production limits are per company.' } }, ms }); return; }
    const params = Object.fromEntries(Object.entries(vals).filter(([, v]) => v !== ''));
    setRes({ ...mockApi(ep.id, params, { scopes, items, policy }), ms });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="text-sm font-semibold">Parameters</div>
        {ep.params.length === 0 && <p className="text-sm text-muted">No parameters.</p>}
        {ep.params.map((p) => (
          <label key={p.name} className="block text-sm">
            <span className="font-mono text-xs">{p.name}</span> <span className="text-xs text-muted">{p.type}{p.required ? ', required' : ''}{p.enum ? `: ${p.enum.join(' | ')}` : ''}</span>
            {p.type === 'json'
              ? <textarea data-action="I-02" rows={8} className={`${inputCls} mt-1 font-mono text-xs`} value={vals[p.name]} onChange={(e) => setVals({ ...vals, [p.name]: e.target.value })} />
              : <input data-action="I-02" className={`${inputCls} mt-1`} value={vals[p.name]} placeholder={p.desc} onChange={(e) => setVals({ ...vals, [p.name]: e.target.value })} />}
          </label>
        ))}
        <div className="text-sm font-semibold">Key scopes (simulated)</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ALL_SCOPES.map((s) => <label key={s} className="flex items-center gap-1.5 text-xs"><input data-action="I-03" type="checkbox" checked={scopes.includes(s)} onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))} /><code>{s}</code></label>)}
        </div>
        <Button variant="primary" action="I-04" onClick={send}>Send request</Button>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-semibold">Response</div>
        {res ? (
          <>
            <div className="font-mono text-xs text-muted">HTTP {res.status} · {res.ms} ms · x-ies-env: sandbox · x-ratelimit-remaining: {Math.max(0, 10 - hits.current.length)}</div>
            <JsonView value={res.json} status={res.status} />
          </>
        ) : <p className="text-sm text-muted">Send the request to see status, latency, headers and JSON. Try an invalid entity (400) or untick the required scope (403).</p>}
      </div>
    </div>
  );
}

export function DevApi() {
  const { endpointId } = useParams();
  const ep = endpointId ? endpointById(endpointId) : undefined;
  usePageTitle(ep ? `${ep.method} ${ep.path}` : 'API explorer', 'The IES forecast graph API, AI-ready by design.');
  if (endpointId && !ep) return <NotFound inline />;
  return (
    <div className="space-y-5">
      <PageHeader title="API explorer" sub="Sandbox endpoints on the forecast graph. Every response carries semantic field descriptions, entity and currency context, and provenance IDs." />
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Endpoints" className="panel h-fit p-2">
          {ENDPOINTS.map((e) => (
            <NavLink key={e.id} to={`/dev/api/${e.id}`} data-action="I-01" className={({ isActive }) => `block rounded-ctl px-2 py-1.5 text-sm ${isActive ? 'bg-[var(--soft)] text-action' : 'hover:bg-[var(--soft)]'}`}>
              <span className={`mr-1.5 font-mono text-[10px] font-semibold ${e.method === 'GET' ? 'text-cash' : 'text-fx'}`}>{e.method}</span><span className="font-mono text-xs">{e.path}</span>
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 space-y-5">
          {ep ? (
            <Panel title={<span className="font-mono">{ep.method} {ep.path}</span>} sub={ep.desc} right={<Pill tone="action">scope: {ep.scope}</Pill>}>
              <TryIt key={ep.id} ep={ep} />
            </Panel>
          ) : (
            <Panel title="Endpoints" sub="Choose an endpoint to open its try-it console.">
              <div className="scroll-x"><table className="data"><thead><tr><th>Group</th><th>Endpoint</th><th>Scope</th></tr></thead>
                <tbody>{ENDPOINTS.map((e) => <tr key={e.id}><td>{e.group}</td><td><Link to={`/dev/api/${e.id}`} data-action="I-01" className="link font-mono text-xs">{e.method} {e.path}</Link><div className="text-xs text-muted">{e.desc}</div></td><td><code className="text-xs">{e.scope}</code></td></tr>)}</tbody></table></div>
            </Panel>
          )}
          <Panel title="AI-ready by design" sub="Built for agents, not reports.">
            <ul className="mb-4 grid gap-2 text-sm md:grid-cols-3">
              <li><strong>_semantic</strong><br /><span className="text-muted">Plain-language field descriptions an LLM can read.</span></li>
              <li><strong>Entity and currency context</strong><br /><span className="text-muted">Every amount says whose it is and in what currency.</span></li>
              <li><strong>provenance</strong><br /><span className="text-muted">IDs that trace each value back to IES records.</span></li>
            </ul>
            <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold">IES MCP server config</div></div>
            <Code code={MCP_CONFIG} onCopy="MCP config copied" action="I-06" />
          </Panel>
        </div>
      </div>
    </div>
  );
}
