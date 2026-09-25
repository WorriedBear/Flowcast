import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { toast, useToasts } from './toast';
import { money, MINUS } from '../lib/format';
import type { Ccy } from '../data/types';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'; size?: 'sm' | 'md'; action?: string; tour?: string; destructive?: boolean };
export function Button({ variant = 'secondary', size = 'md', action, tour, destructive, className = '', children, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-action text-white border-action hover:brightness-110',
    secondary: 'bg-surface text-ink border-rule hover:border-action',
    ghost: 'bg-transparent text-action border-transparent hover:bg-[var(--soft)]',
    danger: 'bg-surface text-risk border-rule hover:border-risk',
    ai: 'bg-ai text-white border-ai hover:brightness-110',
  }[variant];
  const s = size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm';
  return (
    <button type="button" data-action={action} data-tour={tour} data-destructive={destructive ? 'true' : undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-ctl border font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${v} ${s} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Panel({ title, sub, right, children, className = '', tour, id }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tour?: string; id?: string }) {
  return (
    <section id={id} data-tour={tour} className={`panel ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 md:px-5">
          <div>
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {sub && <p className="text-sm text-muted">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'cash' | 'risk' | 'fx' | 'ai' | 'action'; className?: string }) {
  const t = { neutral: 'bg-[var(--soft)] text-ink', cash: 'bg-[color-mix(in_srgb,var(--cash)_14%,transparent)] text-cash', risk: 'bg-[color-mix(in_srgb,var(--risk)_14%,transparent)] text-risk', fx: 'bg-[color-mix(in_srgb,var(--fx)_16%,transparent)] text-fx', ai: 'bg-[color-mix(in_srgb,var(--ai)_14%,transparent)] text-ai', action: 'bg-[color-mix(in_srgb,var(--action)_12%,transparent)] text-action' }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${t} ${className}`}>{children}</span>;
}

export const CcyChip = ({ ccy }: { ccy: string }) => <span className="inline-block rounded-ctl border border-[color-mix(in_srgb,var(--fx)_45%,transparent)] px-1.5 text-[11px] font-medium text-fx">{ccy}</span>;

export function Signed({ v, ccy = 'USD', className = '' }: { v: number; ccy?: Ccy; className?: string }) {
  const tone = v > 0 ? 'text-cash' : v < 0 ? 'text-risk' : 'text-muted';
  return <span className={`num ${tone} ${className}`} title={`${v < 0 ? MINUS : ''}${Math.abs(Math.round(v)).toLocaleString('en-US')} ${ccy}`}>{money(v, ccy, { signed: true })}</span>;
}

export function Tooltip({ tip, children, className = '' }: { tip: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <span aria-describedby={id}>{children}</span>
      {open && <span role="tooltip" id={id} className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-ctl bg-[#0E2A47] px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg">{tip}</span>}
    </span>
  );
}

export function AssumptionBadge({ note }: { note: string }) {
  return (
    <Tooltip tip={<><strong>Assumption.</strong> {note}</>}>
      <span tabIndex={0} className="ml-1 inline-flex cursor-help items-center rounded-ctl border border-dashed border-muted px-1 text-[10px] font-medium text-muted">Assumption</span>
    </Tooltip>
  );
}

export function RoadmapChip({ when, why }: { when: 'Next' | 'Later'; why: string }) {
  return (
    <Tooltip tip={why}>
      <Link to="/strategy#roadmap" className="inline-flex items-center rounded-ctl border border-rule px-1.5 py-0.5 text-[11px] text-muted hover:border-action">Roadmap · {when}</Link>
    </Tooltip>
  );
}

export function Ext({ href, children, action = 'L-09' }: { href: string; children: ReactNode; action?: string }) {
  return <a href={href} target="_blank" rel="noreferrer" data-action={action} className="link">{children}</a>;
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(), 30);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            className={`panel max-h-[90vh] w-full overflow-auto text-[var(--text)] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
            <div className="flex items-center justify-between rule-b px-5 py-3">
              <h2 className="text-base font-semibold">{title}</h2>
              <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-ctl p-1 text-muted hover:bg-[var(--soft)]"><X size={18} /></button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 rule-t px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.aside role="dialog" aria-modal="true" aria-label={title} initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: 'tween', duration: 0.2 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-rule bg-surface text-[var(--text)] shadow-xl">
            <div className="flex items-center justify-between rule-b px-5 py-3">
              <h2 className="text-base font-semibold">{title}</h2>
              <button type="button" aria-label="Close drawer" onClick={onClose} className="rounded-ctl p-1 text-muted hover:bg-[var(--soft)]"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-2 rounded-panel border border-rule bg-[#0E2A47] px-3 py-2.5 text-sm text-white shadow-lg">
          {t.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 text-[#5BD6A5]" /> : t.kind === 'error' ? <XCircle size={18} className="mt-0.5 text-[#FF9B73]" /> : <Info size={18} className="mt-0.5 text-[#9DBBFF]" />}
          <span className="flex-1">{t.text}</span>
          {t.undo && <button type="button" data-action="P-08" className="font-semibold text-[#9DBBFF] underline" onClick={() => { t.undo!(); dismiss(t.id); }}>Undo</button>}
          <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-white/70"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** Streams text at 20ms per word. Renders instantly with reduced motion or when `instant`. */
export function StreamText({ text, instant, onDone, className = '' }: { text: string; instant?: boolean; onDone?: () => void; className?: string }) {
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(instant || reduced() ? words.length : 0);
  const done = useRef(false);
  useEffect(() => {
    if (instant || reduced()) { setN(words.length); return; }
    setN(0); done.current = false;
    const id = setInterval(() => setN((x) => { if (x >= words.length) { clearInterval(id); return x; } return x + 2; }), 20);
    return () => clearInterval(id);
  }, [text, instant]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (n >= words.length && !done.current) { done.current = true; onDone?.(); } }, [n, words.length, onDone]);
  const finished = n >= words.length;
  return (
    <span className={className}>
      <span className="whitespace-pre-line">{words.slice(0, n).join('')}</span>
      {!finished && <button type="button" onClick={() => setN(words.length)} className="ml-2 text-xs text-ai underline">Skip</button>}
    </span>
  );
}

export function Thinking({ steps, instant }: { steps: string[]; instant?: boolean }) {
  const [n, setN] = useState(instant || reduced() ? steps.length : 0);
  useEffect(() => {
    if (instant || reduced()) return;
    const id = setInterval(() => setN((x) => (x >= steps.length ? x : x + 1)), 260);
    return () => clearInterval(id);
  }, [steps.length, instant]);
  return (
    <ul className="mb-2 space-y-1 text-xs text-muted">
      {steps.map((s, i) => (
        <motion.li key={s} initial={false} animate={{ opacity: i < n ? 1 : 0.35 }} className="flex items-center gap-1.5">
          {i < n ? <CheckCircle2 size={13} className="text-ai" /> : <Loader2 size={13} className="animate-spin" />} {s}
        </motion.li>
      ))}
    </ul>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-risk">{error}</span>}
    </label>
  );
}
export const inputCls = 'w-full rounded-ctl border border-rule bg-surface px-3 py-2 text-sm text-[var(--text)] focus:border-action';

export function Tabs<T extends string>({ tabs, value, onChange, action }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (t: T) => void; action?: string }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rule-b">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} data-action={action} onClick={() => onChange(t.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${value === t.id ? 'border-action text-action' : 'border-transparent text-muted hover:text-ink'}`}>{t.label}</button>
      ))}
    </div>
  );
}

export function Skeleton({ lines = 4 }: { lines?: number }) {
  return <div className="space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton h-5" style={{ width: `${90 - i * 12}%` }} />)}</div>;
}

const visited = new Set<string>();
/** Simulated fetch: skeleton for 400ms on first visit per session. */
export function useFirstLoad(key: string) {
  const [loading, setLoading] = useState(!visited.has(key));
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => { visited.add(key); setLoading(false); }, 400);
    return () => clearTimeout(t);
  }, [key, loading]);
  return loading;
}

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = `FlowCast · ${title}`;
    const m = document.querySelector('meta[name="description"]');
    if (m && description) m.setAttribute('content', description);
  }, [title, description]);
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 max-w-3xl text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export async function copyText(text: string, what = 'Copied to clipboard') {
  try { await navigator.clipboard.writeText(text); toast(what); } catch { toast('Copy failed. Select the text and press Ctrl+C.', 'error'); }
}
