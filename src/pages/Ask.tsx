import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import { buildAnswer } from '../lib/answers';
import { INTENTS } from '../lib/intents';
import { Button, Modal, PageHeader, usePageTitle } from '../components/ui';
import { AnswerView } from '../components/AnswerView';

let mid = 0;
export default function Ask() {
  usePageTitle('Ask FlowCast', 'Ask questions about cash, currency and approvals.');
  const chat = useApp((s) => s.customer.chat);
  const push = useApp((s) => s.pushChat);
  const markStreamed = useApp((s) => s.markStreamed);
  const clear = useApp((s) => s.clearChat);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [params, setParams] = useSearchParams();
  const endRef = useRef<HTMLDivElement>(null);
  const handled = useRef<string | null>(null);

  const send = (q: string) => {
    const t = q.trim();
    if (!t) return;
    const core = useApp.getState().customer;
    const now = Date.now();
    push({ id: `u${now}-${++mid}`, role: 'user', text: t });
    push({ id: `a${now}-${++mid}`, role: 'ai', text: t, answer: buildAnswer(t, core), streamed: false });
    setText('');
  };
  useEffect(() => {
    const q = params.get('q');
    if (q && handled.current !== q) { handled.current = q; send(q); setParams({}, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat.length]);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col">
      <PageHeader title="Ask FlowCast" sub="Answers are computed from your live state by the deterministic engine. Change a scenario, approval or policy and the answers change with it."
        right={chat.length > 0 && <Button size="sm" variant="ghost" action="A-05" destructive onClick={() => setConfirm(true)}><Trash2 size={14} />Clear conversation</Button>} />
      <div data-tour="ask-thread" className="flex-1 space-y-4" aria-live="polite">
        {chat.length === 0 && (
          <div className="panel p-5 text-sm text-muted">
            <p className="font-medium text-ink">Try a question below, or type your own.</p>
            <p className="mt-1">FlowCast covers FX shocks, capex affordability, entity gaps, the low point, hedging, collections, board summaries and policy.</p>
          </div>
        )}
        {chat.map((m) => m.role === 'user'
          ? <div key={m.id} className="ml-auto max-w-[80%] rounded-panel bg-ink px-4 py-2.5 text-sm text-[var(--paper)]">{m.text}</div>
          : <AnswerView key={m.id} a={m.answer!} instant={m.streamed} onDone={() => !m.streamed && markStreamed(m.id)} onAsk={send} plainText={m.answer!.text} />)}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 mt-4 bg-paper pb-2 pt-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {INTENTS.map((i) => <button key={i.id} type="button" data-action="A-02" onClick={() => send(i.question)} className="whitespace-nowrap rounded-ctl border border-rule bg-surface px-2.5 py-1 text-xs hover:border-ai hover:text-ai">{i.question}</button>)}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <label className="sr-only" htmlFor="ask-input">Ask a question</label>
          <input id="ask-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about cash, currency or approvals…" className="h-11 flex-1 rounded-ctl border border-rule bg-surface px-3 text-sm" />
          <Button type="submit" variant="primary" action="A-01" disabled={!text.trim()} className="h-11"><Send size={16} />Send</Button>
        </form>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Clear this conversation?" footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" action="A-05" onClick={() => { clear(); setConfirm(false); }}>Clear conversation</Button></>}>
        <p className="text-sm">The thread is removed from this browser. Your approvals and audit log are unaffected.</p>
      </Modal>
    </div>
  );
}
