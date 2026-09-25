import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { useApp } from '../store/useApp';
import { DEMO_STEPS } from '../data/demo';
import { PRESETS } from '../data/presets';
import { Button } from './ui';

export function DemoPanel() {
  const demo = useApp((s) => s.demo);
  const setDemo = useApp((s) => s.setDemo);
  const setScenario = useApp((s) => s.setScenario);
  const reset = useApp((s) => s.reset);
  const nav = useNavigate();
  const loc = useLocation();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const total = DEMO_STEPS.length;
  const done = demo.step >= total;
  const step = DEMO_STEPS[Math.min(demo.step, total - 1)];

  useEffect(() => {
    if (!demo.active || done) return;
    let el: Element | null = null;
    const t = setTimeout(() => {
      el = document.querySelector(`[data-tour="${step.tour}"]`);
      if (el) { el.classList.add('tour-spot'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 700);
    return () => { clearTimeout(t); el?.classList.remove('tour-spot'); document.querySelectorAll('.tour-spot').forEach((n) => n.classList.remove('tour-spot')); };
  }, [demo.active, demo.step, done, step.tour, loc.pathname]);

  if (!demo.active) return null;

  const go = (i: number) => {
    setDemo({ step: i });
    const s = DEMO_STEPS[i];
    if (!s) return;
    if (s.setup === 'mexico') setScenario(PRESETS.find((p) => p.id === 'mexico')!.s);
    nav(s.route);
  };
  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined;
  return (
    <div role="region" aria-label="Guided demo" style={style}
      className="fixed bottom-4 right-4 z-[75] w-[calc(100%-2rem)] max-w-[360px] rounded-panel border border-ai bg-surface text-[var(--text)] shadow-2xl">
      <div className="flex cursor-move items-center gap-2 rounded-t-panel bg-ai px-3 py-2 text-sm text-white"
        onPointerDown={(e) => { const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect(); drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current && window.innerWidth > 768) setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) }); }}
        onPointerUp={() => { drag.current = null; }}>
        <GripHorizontal size={16} aria-hidden="true" />
        <span className="font-medium">Guided demo {done ? '· complete' : `· step ${demo.step + 1} of ${total}`}</span>
        <button type="button" aria-label={demo.collapsed ? 'Expand demo panel' : 'Collapse demo panel'} className="ml-auto" onPointerDown={(e) => e.stopPropagation()} onClick={() => setDemo({ collapsed: !demo.collapsed })}>{demo.collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      <div className="h-1 bg-[var(--soft)]"><div className="h-1 bg-ai transition-all" style={{ width: `${(Math.min(demo.step + 1, total) / total) * 100}%` }} /></div>
      {!demo.collapsed && (
        <div className="p-3">
          {done ? (
            <>
              <div className="font-semibold">That&apos;s the loop: CFO, advisor, developer.</div>
              <p className="mt-1 text-sm text-muted">One forecast graph, extended by experts and third-party agents, with a human in every money decision.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/strategy#roadmap" className="inline-flex h-8 items-center rounded-ctl bg-action px-3 text-sm font-medium text-white" onClick={() => setDemo({ active: false })}>See the roadmap</Link>
                <Button size="sm" onClick={() => { reset(); setDemo({ active: true, step: 0 }); nav('/'); }}>Restart demo</Button>
                <Button size="sm" variant="ghost" onClick={() => setDemo({ active: false, step: 0 })}>Exit</Button>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">{step.title}</div>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
              {loc.pathname !== step.route.split('?')[0] && <button type="button" className="mt-1 text-xs text-action underline" onClick={() => go(demo.step)}>Go to this step&apos;s page</button>}
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" disabled={demo.step === 0} onClick={() => go(demo.step - 1)}>Back</Button>
                <Button size="sm" variant="ai" onClick={() => (demo.step + 1 >= total ? setDemo({ step: total }) : go(demo.step + 1))}>{demo.step + 1 >= total ? 'Finish' : 'Next'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDemo({ active: false, step: 0 })}>Exit</Button>
                <span className="ml-auto text-xs text-muted">~{total - demo.step} min left</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
