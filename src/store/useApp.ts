import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_MANIFEST } from '../data/developer';
import type { AuditActor, AuditEntry, Persona, Policy, Scenario, Tier } from '../data/types';
import { BASE_SCENARIO } from '../lib/forecast';
import { SEED_CUSTOMER, type CustomerCore, type RecState } from '../lib/derive';
import type { TaskId } from '../lib/policy';
import type { Answer } from '../lib/answers';

export interface ChatMsg { id: string; role: 'user' | 'ai'; text: string; answer?: Answer; streamed?: boolean }
export interface Escalation {
  id: string; recId: string; client: string; question: string; expertId: string; urgency: string; note: string;
  createdAt: string; status: 'open' | 'resolved'; seeded?: boolean;
  response?: { decision: 'approve' | 'modify' | 'reject'; ratio?: number; rationale: string; followUp: boolean; at: string };
  snapshot: { low: string; exposure: string; policy: string; sources: string[] };
}
export interface Listing { name: string; short: string; long: string; category: string; pricing: 'free' | 'per_company' | 'usage'; price: string; email: string; privacy: string }
export type PublishStatus = 'draft' | 'submitted' | 'in_review' | 'intuit_review' | 'live';

export interface AppState {
  persona: Persona;
  demo: { active: boolean; step: number; collapsed: boolean };
  customer: CustomerCore & { chat: ChatMsg[]; briefStreamed: boolean; lastBriefAt: string };
  developer: {
    onboardingStep: number; workspace: string; useCase: string; apiKey: string; sandboxReady: boolean;
    manifestText: string; evalRuns: { at: string; passed: number }[]; sandboxRun: boolean;
    listing: Listing; publishStatus: PublishStatus; firstCallAt: string | null; startedAt: string | null;
  };
  advisor: { queue: Escalation[] };
  audit: AuditEntry[];
  seq: number;

  setPersona: (p: Persona) => void;
  setDemo: (d: Partial<AppState['demo']>) => void;
  reset: () => void;
  log: (actor: AuditActor, tier: Tier, message: string, sourceIds?: string[], refId?: string) => void;
  setScenario: (s: Partial<Scenario>) => void;
  setRec: (id: string, patch: Partial<RecState>) => void;
  setAutonomy: (task: TaskId, tier: Tier) => void;
  setPolicy: (p: Policy) => void;
  install: (id: string, scopes: string[]) => void;
  uninstall: (id: string) => void;
  toggleScope: (agentId: string, scope: string) => void;
  pushChat: (m: ChatMsg) => void;
  markStreamed: (id: string) => void;
  clearChat: () => void;
  setBrief: (patch: Partial<{ briefStreamed: boolean; lastBriefAt: string }>) => void;
  escalate: (e: Omit<Escalation, 'id' | 'createdAt' | 'status'>) => void;
  respond: (id: string, r: NonNullable<Escalation['response']>) => void;
  dev: (patch: Partial<AppState['developer']>) => void;
  setRevforecastLive: (live: boolean) => void;
}

const nowIso = () => new Date().toISOString();
const randKey = () => 'ies_sbx_' + Array.from({ length: 28 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');

const SEED_QUEUE: Escalation[] = [{
  id: 'ESC-101', recId: 'EXT-1', client: 'Brightline Outdoor Co. (fictional)', question: 'Should we roll our CAD forward hedge into Q1 or let it expire?',
  expertId: 'elena', urgency: 'This week', note: 'Board meets on the 8th. We want a view on rolling vs. letting it expire given the CAD rally.',
  createdAt: '2026-09-24T15:10:00Z', status: 'open', seeded: true,
  snapshot: { low: '13-week low $6.4M in W9 (policy floor $5.0M)', exposure: 'CAD long C$3.1M, 45% hedged; forward matures W3', policy: 'Hedge band 40–70%, expert review ≥ $250K', sources: ['IES Accounting', 'Rate table'] },
}];

export const SEED_LISTING: Listing = { name: 'RevForecast for DTC', short: '', long: '', category: 'signals', pricing: 'per_company', price: '149', email: '', privacy: '' };

function seedState() {
  return {
    persona: 'cfo' as Persona,
    demo: { active: false, step: 0, collapsed: false },
    customer: { ...SEED_CUSTOMER, recs: { ...SEED_CUSTOMER.recs }, chat: [] as ChatMsg[], briefStreamed: false, lastBriefAt: '6:02 AM' },
    developer: {
      onboardingStep: 0, workspace: '', useCase: '', apiKey: '', sandboxReady: false, manifestText: SEED_MANIFEST, evalRuns: [], sandboxRun: false,
      listing: SEED_LISTING, publishStatus: 'draft' as PublishStatus, firstCallAt: null, startedAt: null,
    },
    advisor: { queue: SEED_QUEUE },
    audit: [
      { id: 'AU-3', ts: '2026-09-25T06:02:00Z', actor: 'agent' as AuditActor, tier: 'auto' as Tier, message: 'Refreshed forecast from IES Accounting, IES Payroll, IES Commerce and bank feeds', sourceIds: ['IES Accounting', 'IES Payroll', 'IES Commerce', 'Bank feed'] },
      { id: 'AU-2', ts: '2026-09-25T06:01:00Z', actor: 'agent' as AuditActor, tier: 'auto' as Tier, message: 'Refreshed FX rate table (IES multi-currency beta)', sourceIds: ['Rate table'] },
      { id: 'AU-1', ts: '2026-09-24T22:00:00Z', actor: 'thirdParty' as AuditActor, tier: 'auto' as Tier, message: 'ShipSignal posted 3 freight surcharge signals', sourceIds: ['Marketplace: ShipSignal'] },
    ] as AuditEntry[],
    seq: 10,
  };
}

export const useApp = create<AppState>()(persist((set, get) => ({
  ...seedState(),
  setPersona: (persona) => set({ persona }),
  setDemo: (d) => set((s) => ({ demo: { ...s.demo, ...d } })),
  reset: () => set({ ...seedState() }),
  log: (actor, tier, message, sourceIds = [], refId) => set((s) => ({ seq: s.seq + 1, audit: [{ id: `AU-${s.seq + 1}`, ts: nowIso(), actor, tier, message, sourceIds, refId }, ...s.audit] })),
  setScenario: (p) => set((s) => ({ customer: { ...s.customer, scenario: { ...s.customer.scenario, ...p } } })),
  setRec: (id, patch) => set((s) => ({ customer: { ...s.customer, recs: { ...s.customer.recs, [id]: { ...s.customer.recs[id], ...patch } } } })),
  setAutonomy: (task, tier) => { set((s) => ({ customer: { ...s.customer, autonomy: { ...s.customer.autonomy, [task]: tier } } })); get().log('user', tier, `Autonomy for "${task.replace(/_/g, ' ')}" set to ${tier}`, ['Policy']); },
  setPolicy: (policy) => { set((s) => ({ customer: { ...s.customer, policy } })); get().log('user', 'approve', 'Treasury policy updated', ['Policy']); },
  install: (id, scopes) => { set((s) => ({ customer: { ...s.customer, installedAgents: [...new Set([...s.customer.installedAgents, id])], revokedScopes: { ...s.customer.revokedScopes, [id]: [] } } })); get().log('user', 'approve', `Installed ${id} with scopes: ${scopes.join(', ')}`, [`Marketplace: ${id}`]); },
  uninstall: (id) => { set((s) => ({ customer: { ...s.customer, installedAgents: s.customer.installedAgents.filter((a) => a !== id) } })); get().log('user', 'approve', `Uninstalled ${id}; its contributions were removed`, [`Marketplace: ${id}`]); },
  toggleScope: (agentId, scope) => {
    const cur = get().customer.revokedScopes[agentId] ?? [];
    const revoked = cur.includes(scope) ? cur.filter((x) => x !== scope) : [...cur, scope];
    set((s) => ({ customer: { ...s.customer, revokedScopes: { ...s.customer.revokedScopes, [agentId]: revoked } } }));
    get().log('user', 'approve', `${cur.includes(scope) ? 'Restored' : 'Revoked'} scope ${scope} for ${agentId}`, [`Marketplace: ${agentId}`]);
  },
  pushChat: (m) => set((s) => ({ customer: { ...s.customer, chat: [...s.customer.chat, m] } })),
  markStreamed: (id) => set((s) => ({ customer: { ...s.customer, chat: s.customer.chat.map((m) => (m.id === id ? { ...m, streamed: true } : m)) } })),
  clearChat: () => set((s) => ({ customer: { ...s.customer, chat: [] } })),
  setBrief: (p) => set((s) => ({ customer: { ...s.customer, ...p } })),
  escalate: (e) => {
    const id = `ESC-${200 + get().seq}`;
    set((s) => ({ advisor: { queue: [{ ...e, id, createdAt: nowIso(), status: 'open' }, ...s.advisor.queue] } }));
    get().setRec(e.recId, { status: 'escalated' });
    get().log('user', 'expert', `Escalated ${e.recId} to ${e.expertId === 'elena' ? 'Elena Vogt' : e.expertId} (${e.urgency})`, e.snapshot.sources, e.recId);
  },
  respond: (id, r) => {
    const esc = get().advisor.queue.find((q) => q.id === id);
    set((s) => ({ advisor: { queue: s.advisor.queue.map((q) => (q.id === id ? { ...q, status: 'resolved', response: r } : q)) } }));
    if (esc && esc.recId.startsWith('REC-')) {
      if (r.decision === 'reject') get().setRec(esc.recId, { status: 'dismissed', expertNote: r.rationale, dismissReason: 'Rejected by expert' });
      else get().setRec(esc.recId, { status: 'open', expertReviewed: true, expertNote: r.rationale, ...(r.decision === 'modify' && r.ratio ? { ratio: r.ratio } : {}) });
    }
    get().log('expert', 'expert', `Elena Vogt responded to ${esc?.recId ?? id}: ${r.decision}${r.decision === 'modify' ? ` (ratio ${r.ratio}%)` : ''}`, esc?.snapshot.sources ?? [], esc?.recId);
  },
  dev: (patch) => set((s) => ({ developer: { ...s.developer, ...patch } })),
  setRevforecastLive: (live) => set((s) => ({ customer: { ...s.customer, revforecastLive: live } })),
}), { name: 'flowcast-v1', version: 1 }));

export const newApiKey = randKey;
export { BASE_SCENARIO };
