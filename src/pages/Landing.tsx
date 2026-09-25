import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Code2, LineChart, PlayCircle } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useComputed } from '../store/hooks';
import { RunwayChart } from '../components/RunwayChart';
import { Button, Ext, usePageTitle } from '../components/ui';
import { factById } from '../data/research';
import { POSITIONING_LINE } from '../config';

export default function Landing() {
  usePageTitle('Cash and FX, before it moves', 'FlowCast is an AI cash and FX agent inside Intuit Enterprise Suite, and an open forecast graph.');
  const { base } = useComputed();
  const policy = useApp((s) => s.customer.policy);
  const setPersona = useApp((s) => s.setPersona);
  const setDemo = useApp((s) => s.setDemo);
  const nav = useNavigate();
  const go = (p: 'cfo' | 'developer' | 'advisor', to: string) => { setPersona(p); nav(to); };
  const stats = [
    { n: '96%', t: 'of FP&A teams still plan in spreadsheets; only 23% use AI in forecasting regularly.', f: factById('R11') },
    { n: '96%', t: 'of mid-market corporates lost money on unhedged FX in a single quarter (avg. ~£908K).', f: factById('R15') },
    { n: '$465K', t: 'a year: the estimated cost of unreliable cash forecasts for US mid-sized companies (vendor research).', f: factById('R13') },
  ];
  const why = [
    { t: 'One ledger, payroll, commerce and bank data', to: '/strategy#pillars', a: 'L-05' },
    { t: 'Multi-currency is now native (beta)', to: '/strategy#moat', a: 'L-06' },
    { t: 'Human + AI experts in the loop', to: '/strategy#operating-model', a: 'L-07' },
    { t: 'An open agent platform', to: '/strategy#platform', a: 'L-08' },
  ];
  return (
    <div>
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px] md:leading-[46px]">Know where your cash will be, in every currency, before it moves.</h1>
            <p className="mt-4 text-base text-muted">FlowCast is an AI cash and FX agent inside Intuit Enterprise Suite, and an open forecast graph that developers and advisors can build on.</p>
            <p className="mt-3 border-l-2 border-ai pl-3 text-sm text-ink">{POSITIONING_LINE}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="primary" action="L-01" onClick={() => { setDemo({ active: true, step: 0, collapsed: false }); }}><PlayCircle size={18} />Start the 10-minute guided demo</Button>
              <Button onClick={() => go('cfo', '/app')}>Open the CFO app</Button>
            </div>
          </div>
          <div className="panel p-3">
            <div className="flex items-baseline justify-between px-2 pt-1 text-sm"><span className="font-medium">Solace Living · 13-week cash runway</span><span className="text-xs text-muted">Fictional company</span></div>
            <RunwayChart f={base} minCash={policy.minCash} height={220} mini />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 py-10">
        <h2 className="text-xl font-semibold text-ink">Mid-market finance still forecasts cash by hand, and sees FX after it hits.</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.f.id} className="rule-t pt-4">
              <div className="num text-[40px] font-semibold leading-none text-ink">{s.n}</div>
              <p className="mt-2 text-sm">{s.t}</p>
              <p className="mt-1 text-xs text-muted">{s.f.id} · <Ext href={s.f.url}>{s.f.sourceName}</Ext></p>
            </div>
          ))}
        </div>
        <blockquote className="mt-8 max-w-3xl border-l-4 border-fx pl-4 text-lg text-ink">&ldquo;Every Monday I rebuild the cash forecast from four exports, and I still find out about FX after it&apos;s hit us.&rdquo;<footer className="mt-1 text-xs text-muted">Composite quote, synthesized from research</footer></blockquote>
      </section>
      <section className="border-y border-rule bg-surface">
        <div data-tour="journeys" className="mx-auto grid max-w-[1280px] gap-5 px-4 py-10 md:grid-cols-3">
          {[
            { icon: <LineChart />, t: 'Run finance as Priya', d: 'CFO of Solace Living: 5 entities, 4 foreign currencies, a 13-week runway and a policy to respect.', a: 'L-02', go: () => go('cfo', '/app'), cta: 'Open the Command Center' },
            { icon: <Code2 />, t: 'Build as Dev', d: 'Co-founder of Northbeam Labs: sandbox, first call, evals, publish RevForecast to the marketplace.', a: 'L-03', go: () => go('developer', '/dev'), cta: 'Open the developer platform' },
            { icon: <Briefcase />, t: 'Advise as Elena', d: 'Treasury advisor at Harbor & Vale: escalations arrive with the full context package.', a: 'L-04', go: () => go('advisor', '/advisor'), cta: 'Open the advisor workspace' },
          ].map((j) => (
            <div key={j.t} className="flex flex-col">
              <div className="text-action">{j.icon}</div>
              <h3 className="mt-2 text-lg font-semibold">{j.t}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{j.d}</p>
              <Button variant="primary" action={j.a} className="mt-3 self-start" onClick={j.go}>{j.cta}</Button>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 py-10">
        <h2 className="text-xl font-semibold text-ink">IES is the platform that can win cash and currency decisions.</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {why.map((w) => <li key={w.t}><Link to={w.to} data-action={w.a} className="flex items-center justify-between rounded-panel border border-rule bg-surface px-4 py-3 text-sm font-medium hover:border-action">{w.t}<ArrowRight size={16} className="text-action" /></Link></li>)}
        </ul>
      </section>
    </div>
  );
}
