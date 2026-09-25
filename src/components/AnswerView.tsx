import { useNavigate } from 'react-router-dom';
import { Copy, ShieldCheck } from 'lucide-react';
import type { Answer, AnswerAction } from '../lib/answers';
import { useApp } from '../store/useApp';
import { useUI } from '../store/ui';
import { useComputed, useRecActions } from '../store/hooks';
import { BASE_SCENARIO } from '../lib/forecast';
import { money } from '../lib/format';
import { Button, Pill, StreamText, Thinking, copyText } from './ui';
import { SourceChips } from './domain';
import { toast } from './toast';

export function useAnswerAction(onAsk?: (t: string) => void) {
  const nav = useNavigate();
  const setScenario = useApp((s) => s.setScenario);
  const log = useApp((s) => s.log);
  const setUI = useUI((s) => s.set);
  const { recs } = useComputed();
  const { approve } = useRecActions();
  return (a: AnswerAction) => {
    switch (a.kind) {
      case 'open_scenario': setScenario({ ...BASE_SCENARIO, ...a.patch }); toast('Scenario loaded in Scenario Lab', 'info'); nav('/app/scenarios'); break;
      case 'approve_rec': { const r = recs.find((x) => x.id === a.recId); if (r) approve(r); break; }
      case 'escalate_rec': setUI({ escalateRecId: a.recId }); break;
      case 'navigate': nav(a.to); break;
      case 'drafts': log('agent', 'auto', 'Drafted 3 collection reminders for Maison Nord (not sent)', ['IES Accounting'], 'REC-4'); setUI({ draftsOpen: true }); break;
      case 'copy': copyText(a.text, 'Summary copied'); break;
      case 'ask': onAsk?.(a.text); break;
    }
  };
}

export function AnswerView({ a, instant, onDone, onAsk, plainText }: { a: Answer; instant?: boolean; onDone?: () => void; onAsk?: (t: string) => void; plainText: string }) {
  const act = useAnswerAction(onAsk);
  const conf = Math.round(a.confidence * 100);
  return (
    <div className="rounded-panel border border-[color-mix(in_srgb,var(--ai)_30%,transparent)] bg-[var(--ai-bg)] p-4">
      <Thinking steps={a.thinking} instant={instant} />
      <div className="text-[15px] leading-relaxed"><StreamText text={a.text} instant={instant} onDone={onDone} /></div>
      {a.viz?.type === 'table' && (
        <div className="scroll-x mt-3 rounded-ctl bg-surface">
          <table className="data"><thead><tr>{a.viz.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{a.viz.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j > 0 ? 'num' : ''}>{c}</td>)}</tr>)}</tbody></table>
        </div>
      )}
      {a.viz?.type === 'bars' && (
        <div className="mt-3 rounded-ctl bg-surface p-3">
          <div className="mb-2 text-xs text-muted">Impact on W13 consolidated cash</div>
          {(() => { const max = Math.max(...a.viz.rows.map((r) => Math.abs(r.value))); return a.viz.rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-xs">
              <span className="w-10 text-right">{r.label}</span>
              <div className="relative h-3 flex-1"><div className="absolute left-1/2 top-0 h-3 w-px bg-rule" />
                <div className={`absolute top-0 h-3 ${r.value < 0 ? 'bg-risk' : 'bg-cash'}`} style={{ width: `${(Math.abs(r.value) / max) * 50}%`, left: r.value < 0 ? `${50 - (Math.abs(r.value) / max) * 50}%` : '50%' }} /></div>
              <span className={`num w-16 ${r.value < 0 ? 'text-risk' : 'text-cash'}`}>{money(r.value, 'USD', { signed: true })}</span>
            </div>)); })()}
        </div>
      )}
      {a.disclaimer && <p className="mt-3 text-xs font-medium text-fx">{a.disclaimer}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {a.sources.length > 0 && <SourceChips sources={a.sources} />}
        <Pill tone={conf >= 80 ? 'cash' : 'fx'}>Confidence {conf}%</Pill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[color-mix(in_srgb,var(--ai)_20%,transparent)] pt-3">
        {a.actions.map((x) => <Button key={x.label} size="sm" variant={x.kind === 'ask' ? 'secondary' : 'ai'} action={x.kind === 'ask' ? 'A-02' : 'A-03'} onClick={() => act(x)}>{x.label}</Button>)}
        <Button size="sm" variant="ghost" action="A-06" onClick={() => copyText(plainText, 'Answer copied')}><Copy size={14} />Copy answer</Button>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted"><ShieldCheck size={13} />{a.autonomy}</span>
      </div>
    </div>
  );
}
