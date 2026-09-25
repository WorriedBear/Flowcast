import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Briefcase, Building2, ChevronDown, Code2, FlaskConical, Gauge, Hammer, Home, Inbox, LineChart, Menu, MessageSquare, PlayCircle, Rocket, ScrollText, ShieldCheck, Store, TerminalSquare, UserRound, X } from 'lucide-react';
import { useApp } from '../store/useApp';
import { useUI } from '../store/ui';
import { Button, Modal, Toasts } from '../components/ui';
import { toast } from '../components/toast';
import { DraftsModal, EscalateModal, SourceDrawer } from '../components/domain';
import { DemoPanel } from '../components/DemoPanel';
import type { Persona } from '../data/types';

type NavItem = { to: string; label: string; icon: ReactNode };
const NAV: Record<Persona, { group: string; items: NavItem[] }[]> = {
  cfo: [
    { group: 'Overview', items: [{ to: '/app', label: 'Command Center', icon: <Gauge size={18} /> }, { to: '/app/ask', label: 'Ask FlowCast', icon: <MessageSquare size={18} /> }] },
    { group: 'Plan', items: [{ to: '/app/scenarios', label: 'Scenario Lab', icon: <FlaskConical size={18} /> }, { to: '/app/fx', label: 'FX & hedging', icon: <LineChart size={18} /> }] },
    { group: 'Act', items: [{ to: '/app/approvals', label: 'Approvals', icon: <Inbox size={18} /> }] },
    { group: 'Extend', items: [{ to: '/app/marketplace', label: 'Marketplace', icon: <Store size={18} /> }] },
    { group: 'Govern', items: [{ to: '/app/trust', label: 'Trust Center', icon: <ShieldCheck size={18} /> }] },
  ],
  developer: [
    { group: 'Developer', items: [
      { to: '/dev', label: 'Developer home', icon: <Home size={18} /> }, { to: '/dev/start', label: 'Onboarding & sandbox', icon: <TerminalSquare size={18} /> },
      { to: '/dev/api', label: 'API explorer', icon: <Code2 size={18} /> }, { to: '/dev/build', label: 'Builder & evals', icon: <Hammer size={18} /> },
      { to: '/dev/publish', label: 'Publish', icon: <Rocket size={18} /> },
    ] },
  ],
  advisor: [{ group: 'Advisor', items: [{ to: '/advisor', label: 'Advisor workspace', icon: <Briefcase size={18} /> }] }],
};
const STORY: NavItem[] = [
  { to: '/strategy', label: 'Strategy', icon: <ScrollText size={18} /> }, { to: '/research', label: 'Research', icon: <Building2 size={18} /> },
  { to: '/ai-process', label: 'How I used AI', icon: <Bot size={18} /> }, { to: '/about', label: 'About', icon: <UserRound size={18} /> },
];
export const PERSONA_HOME: Record<Persona, string> = { cfo: '/app', developer: '/dev', advisor: '/advisor' };
const PERSONA_LABEL: Record<Persona, string> = { cfo: 'CFO', developer: 'Developer', advisor: 'Advisor' };

export function useResetDemo() {
  const reset = useApp((s) => s.reset);
  const nav = useNavigate();
  return () => { reset(); try { sessionStorage.clear(); } catch { /* storage unavailable */ } toast('Demo reset to the seed state'); nav('/'); };
}

function Sidebar({ persona, onNav }: { persona: Persona; onNav?: () => void }) {
  const link = (i: NavItem) => (
    <NavLink key={i.to} to={i.to} end onClick={onNav} title={i.label}
      className={({ isActive }) => `flex items-center gap-2.5 rounded-ctl px-2.5 py-2 text-sm ${isActive ? 'bg-[color-mix(in_srgb,var(--action)_12%,transparent)] font-medium text-action' : 'text-muted hover:bg-[var(--soft)] hover:text-ink'}`}>
      {i.icon}<span className="sidebar-label">{i.label}</span>
    </NavLink>
  );
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      {NAV[persona].map((g) => (
        <div key={g.group}>
          <div className="sidebar-label mb-1 px-2.5 text-xs text-muted">{g.group}</div>
          <div className="space-y-0.5">{g.items.map(link)}</div>
        </div>
      ))}
      <div className="mt-auto">
        <div className="sidebar-label mb-1 px-2.5 text-xs text-muted">The case</div>
        <div className="space-y-0.5">{STORY.map(link)}</div>
      </div>
    </nav>
  );
}

function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const persona = useApp((s) => s.persona);
  const doReset = useResetDemo();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const who = { cfo: ['Priya Raman', 'CFO, Solace Living Inc.', 'Wants to know where cash will be across every entity and currency for the next 13 weeks, to decide what to fund, hedge or delay.'], developer: ['Dev Shah', 'Co-founder, Northbeam Labs', 'Building RevForecast for DTC; wants AI-ready data and a clear path to paying customers.'], advisor: ['Elena Vogt, CTP', 'Treasury advisor, Harbor & Vale Advisory', 'Wants the full context of a client escalation instantly, to advise in 30 minutes, not 3 days.'] }[persona];
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-9 items-center gap-1 rounded-full border border-rule bg-surface p-1 text-sm sm:pr-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-semibold text-[var(--paper)]">{who[0].split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><ChevronDown size={14} className="hidden sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-52 rounded-panel border border-rule bg-surface py-1 text-sm text-[var(--text)] shadow-lg">
          <button role="menuitem" type="button" className="block w-full px-3 py-2 text-left hover:bg-[var(--soft)]" onClick={() => { setProfile(true); setOpen(false); }}>Profile</button>
          <button role="menuitem" type="button" data-destructive="true" className="block w-full px-3 py-2 text-left hover:bg-[var(--soft)]" onClick={() => { setConfirm(true); setOpen(false); }}>Reset demo</button>
          <Link role="menuitem" to="/about" className="block px-3 py-2 hover:bg-[var(--soft)]" onClick={() => setOpen(false)}>About the builder</Link>
        </div>
      )}
      <Modal open={profile} onClose={() => setProfile(false)} title="Profile" footer={<Button onClick={() => setProfile(false)}>Close</Button>}>
        <div className="text-sm"><div className="text-base font-semibold">{who[0]}</div><div className="text-muted">{who[1]}</div><p className="mt-2">{who[2]}</p><p className="mt-2 text-xs text-muted">Fictional persona, synthesized from research.</p></div>
      </Modal>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset the demo?" footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { setConfirm(false); doReset(); }}>Reset demo</Button></>}>
        <p className="text-sm">This restores the seed state: approvals, scenarios, installed agents, developer progress and the audit log.</p>
      </Modal>
    </div>
  );
}

export function TopBar() {
  const persona = useApp((s) => s.persona);
  const setPersona = useApp((s) => s.setPersona);
  const setDemo = useApp((s) => s.setDemo);
  const demo = useApp((s) => s.demo);
  const setUI = useUI((s) => s.set);
  const nav = useNavigate();
  const loc = useLocation();
  const inApp = /^\/(app|dev|advisor)/.test(loc.pathname);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-1.5 border-b border-rule bg-surface px-2 sm:gap-2 md:px-4">
      {inApp && <button type="button" aria-label="Open navigation" className="rounded-ctl p-1.5 md:hidden" onClick={() => setUI({ navOpen: true })}><Menu size={20} /></button>}
      <Link to="/" className="mr-1 flex items-baseline sm:mr-2 gap-1.5 whitespace-nowrap">
        <span className="text-base font-bold tracking-tight text-ink sm:text-lg">FlowCast</span>
        <span className="hidden text-xs text-muted lg:inline">for Intuit Enterprise Suite</span>
      </Link>
      <div role="radiogroup" aria-label="Persona" className="flex rounded-ctl border border-rule p-0.5 text-sm">
        {(['cfo', 'developer', 'advisor'] as Persona[]).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={persona === p && inApp} onClick={() => { setPersona(p); nav(PERSONA_HOME[p]); }}
            aria-label={PERSONA_LABEL[p]} className={`rounded-[5px] px-1.5 py-1 text-xs sm:px-3 sm:text-sm ${persona === p && inApp ? 'bg-ink font-medium text-[var(--paper)]' : 'text-muted hover:text-ink'}`}><span className="sm:hidden">{p === 'developer' ? 'Dev' : PERSONA_LABEL[p]}</span><span className="hidden sm:inline">{PERSONA_LABEL[p]}</span></button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!demo.active && <Button size="sm" variant="primary" action="L-01" aria-label="Guided demo" className="px-2 sm:px-3" onClick={() => { setDemo({ active: true, step: 0, collapsed: false }); nav('/'); }}><PlayCircle size={16} /><span className="hidden sm:inline">Guided demo</span></Button>}
        <AvatarMenu />
      </div>
    </header>
  );
}

export function AppFrame() {
  const persona = useApp((s) => s.persona);
  const loc = useLocation();
  const navOpen = useUI((s) => s.navOpen);
  const setUI = useUI((s) => s.set);
  const area: Persona | null = loc.pathname.startsWith('/app') ? 'cfo' : loc.pathname.startsWith('/dev') ? 'developer' : loc.pathname.startsWith('/advisor') ? 'advisor' : null;
  const setPersona = useApp((s) => s.setPersona);
  useEffect(() => { if (area && area !== persona) setPersona(area); }, [area, persona, setPersona]);
  useEffect(() => { setUI({ navOpen: false }); }, [loc.pathname, setUI]);
  useEffect(() => {
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
    else window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);
  const dark = area === 'developer';
  return (
    <div className={`min-h-screen bg-paper text-[var(--text)] ${dark ? 'theme-dev' : ''}`}>
      <TopBar />
      {area ? (
        <div className="flex">
          <aside className="sidebar sticky top-14 hidden h-[calc(100vh-56px)] w-[240px] shrink-0 border-r border-rule bg-surface md:block"><Sidebar persona={area} /></aside>
          {navOpen && (
            <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setUI({ navOpen: false })}>
              <aside className="h-full w-[260px] bg-surface" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end p-2"><button type="button" aria-label="Close navigation" onClick={() => setUI({ navOpen: false })}><X size={20} /></button></div>
                <Sidebar persona={area} onNav={() => setUI({ navOpen: false })} />
              </aside>
            </div>
          )}
          <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8"><div className="mx-auto max-w-[1280px]"><Outlet /></div></main>
        </div>
      ) : (
        <>
          <main><Outlet /></main>
          <StoryFooter />
        </>
      )}
      <Toasts />
      <SourceDrawer />
      <EscalateModal />
      <DraftsModal />
      <DemoPanel />
    </div>
  );
}

function StoryFooter() {
  const [confirm, setConfirm] = useState(false);
  const doReset = useResetDemo();
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-muted">
        <span className="font-semibold text-ink">FlowCast</span>
        <Link to="/strategy" className="hover:text-ink">Strategy</Link>
        <Link to="/research" className="hover:text-ink">Research</Link>
        <Link to="/strategy#experiments" className="hover:text-ink">Experiments</Link>
        <Link to="/ai-process" className="hover:text-ink">How I used AI</Link>
        <Link to="/about" className="hover:text-ink">About</Link>
        <button type="button" data-destructive="true" className="hover:text-ink" onClick={() => setConfirm(true)}>Reset demo</button>
        <span className="ml-auto text-xs">A product case prototype. Fictional company data; not affiliated with or endorsed by Intuit.</span>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset the demo?" footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { setConfirm(false); doReset(); }}>Reset demo</Button></>}>
        <p className="text-sm">This restores the seed state everywhere in the prototype.</p>
      </Modal>
    </footer>
  );
}

