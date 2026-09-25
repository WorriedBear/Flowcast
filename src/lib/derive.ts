import { AGENTS, agentById } from '../data/agents';
import { REVFORECAST_ITEMS, SEED_ITEMS } from '../data/flows';
import { BASE_RATES } from '../data/rates';
import type { LineItem, Policy, RecStatus, Scenario, Tier } from '../data/types';
import { buildForecast, BASE_SCENARIO, type Forecast } from './forecast';
import { exposures, hedgeProposal, type HedgeProposal } from './fx';
import { checkPolicy, type PolicyResult, type TaskId } from './policy';

export interface RecState { status: RecStatus; ratio?: number; expertReviewed?: boolean; expertNote?: string; dismissReason?: string; executedVia?: string }
export interface CustomerCore {
  scenario: Scenario;
  recs: Record<string, RecState>;
  autonomy: Record<TaskId, Tier>;
  policy: Policy;
  installedAgents: string[];
  revokedScopes: Record<string, string[]>;
  revforecastLive: boolean;
}

export const SEED_POLICY: Policy = { minCash: 12_000_000, hedgeBandMin: 40, hedgeBandMax: 75, approvalThresholdUSD: 500_000, allowedInstruments: ['forward', 'layered forwards'] };
export const SEED_AUTONOMY: Record<TaskId, Tier> = {
  data_consolidation: 'auto', fx_rate_refresh: 'auto', forecast_refresh: 'auto', anomaly_alerts: 'auto', collection_drafts: 'auto',
  intercompany_transfers: 'approve', payment_timing: 'approve', hedges_below_threshold: 'approve', hedges_above_threshold: 'expert', money_movement: 'never',
};
export const SEED_RECS: Record<string, RecState> = {
  'REC-1': { status: 'open' }, 'REC-2': { status: 'open', ratio: 60 }, 'REC-3': { status: 'open', ratio: 50 }, 'REC-4': { status: 'open' }, 'REC-5': { status: 'open' },
};
export const SEED_CUSTOMER: CustomerCore = {
  scenario: BASE_SCENARIO, recs: SEED_RECS, autonomy: SEED_AUTONOMY, policy: SEED_POLICY,
  installedAgents: ['shipsignal'], revokedScopes: {}, revforecastLive: false,
};

export function agentPaused(c: Pick<CustomerCore, 'revokedScopes'>, id: string) {
  const a = agentById(id);
  const revoked = c.revokedScopes[id] ?? [];
  return !!a && a.scopes.some((s) => s.required && revoked.includes(s.id));
}
export function activeAgents(c: Pick<CustomerCore, 'installedAgents' | 'revokedScopes' | 'revforecastLive'>) {
  return c.installedAgents.filter((id) => !agentPaused(c, id) && (id !== 'revforecast' || c.revforecastLive));
}

export const REC1_EUR = 720_000;
export function rec1Items(): LineItem[] {
  return [
    { id: 'REC1-OUT', entity: 'DE', week: 5, category: 'intercompany', amountLocal: -REC1_EUR, currency: 'EUR', sourceSystem: 'FlowCast action', memo: 'REC-1 intercompany transfer to Solace UK', counterparty: 'Solace UK Ltd', confidence: 0.99 },
    { id: 'REC1-IN', entity: 'UK', week: 5, category: 'intercompany', amountLocal: REC1_EUR, currency: 'EUR', sourceSystem: 'FlowCast action', memo: 'REC-1 intercompany transfer from Solace GmbH', counterparty: 'Solace GmbH', confidence: 0.99 },
  ];
}

/** Line items in effect for the current customer state (before scenario transforms). */
export function deriveItems(c: Pick<CustomerCore, 'installedAgents' | 'revokedScopes' | 'revforecastLive' | 'recs'>): LineItem[] {
  const active = activeAgents(c);
  let items = SEED_ITEMS.filter((i) => i.sourceSystem !== 'Marketplace: ShipSignal' || active.includes('shipsignal'));
  if (active.includes('revforecast')) items = items.concat(REVFORECAST_ITEMS);
  const r1 = c.recs['REC-1']?.status;
  if (r1 === 'approved' || r1 === 'executed') items = items.concat(rec1Items());
  return items;
}

export interface Rec {
  id: string; title: string; detail: string; impact: string; confidence: number;
  kind: 'intercompany_transfer' | 'hedge' | 'collection_draft' | 'insight';
  task: TaskId; policy: PolicyResult; state: RecState; visible: boolean; approveLabel: string; toast: string; sources: string[];
  hedge?: HedgeProposal;
}

const k = (v: number) => `${Math.round(v / 1000).toLocaleString('en-US')}K`;
export function buildRecs(c: CustomerCore): Rec[] {
  const items = deriveItems(c);
  const noRec1 = deriveItems({ ...c, recs: { ...c.recs, 'REC-1': { status: 'open' } } });
  const f0 = buildForecast(noRec1);
  const f1 = buildForecast(noRec1.concat(rec1Items()));
  const ukBefore = f0.entities.find((e) => e.id === 'UK')!.closingLocal[5];
  const ukAfter = f1.entities.find((e) => e.id === 'UK')!.closingLocal[5];
  const ex = exposures(items);
  const eur = ex.find((e) => e.ccy === 'EUR')!;
  const mxn = ex.find((e) => e.ccy === 'MXN')!;
  const r2 = c.recs['REC-2'] ?? { status: 'open' as RecStatus, ratio: 60 };
  const r3 = c.recs['REC-3'] ?? { status: 'open' as RecStatus, ratio: 50 };
  const h2 = hedgeProposal(eur, r2.ratio ?? 60, c.policy, { expertReviewed: r2.expertReviewed });
  const h3 = hedgeProposal(mxn, r3.ratio ?? 50, c.policy, { layered: true, expertReviewed: r3.expertReviewed });
  const rec4 = checkPolicy({ kind: 'collection_draft' }, c.policy, c.autonomy);
  const rec5 = checkPolicy({ kind: 'insight' }, c.policy, c.autonomy);
  const gbp = (v: number) => `${v < 0 ? '−' : '+'}£${(Math.abs(v) / 1e6).toFixed(2)}M`;
  return [
    {
      id: 'REC-1', kind: 'intercompany_transfer', task: 'intercompany_transfers',
      title: `Move €${k(REC1_EUR)} from DE to UK in W5`,
      detail: `Covers the W6 GBP gap from UK payroll plus quarterly VAT. Estimated saving vs. a spot purchase plus fees: ~$9.4K.`,
      impact: `UK W6 balance ${gbp(ukBefore)} → ${gbp(ukAfter)}`, confidence: 0.91,
      policy: checkPolicy({ kind: 'intercompany_transfer', notionalUSD: REC1_EUR * BASE_RATES.EUR }, c.policy, c.autonomy),
      state: c.recs['REC-1'], visible: true, approveLabel: 'Approve transfer', toast: 'Transfer approved', sources: ['IES Payroll', 'IES Accounting', 'Bank feed'],
    },
    {
      id: 'REC-2', kind: 'hedge', task: 'hedges_above_threshold', hedge: h2,
      title: `Forward-hedge ${h2.ratio}% of the net EUR long (≈€${(h2.notionalLocal / 1e6).toFixed(2)}M, 3-month tenor)`,
      detail: `Net 13-week EUR long of €${(eur.net / 1e6).toFixed(2)}M, driven by the €4.8M Maison Nord receipt in W11. Notional ≈ $${k(h2.notionalUSD)}.${r2.expertNote ? ` Expert note: ${r2.expertNote}` : ''}`,
      impact: `Locks in ≈$${k(h2.notionalUSD)} of W11 receipts`, confidence: 0.84, policy: h2.policy, state: r2, visible: true,
      approveLabel: 'Approve hedge', toast: 'Hedge approved', sources: ['IES Accounting', 'Rate table'],
    },
    {
      id: 'REC-3', kind: 'hedge', task: 'hedges_below_threshold', hedge: h3,
      title: `Layered forwards for ${h3.ratio}% of the MXN short`,
      detail: `MX$${(h3.notionalLocal / 1e6).toFixed(1)}M across ${h3.tranches} monthly tranches of ≈$${k(h3.trancheUSD)} each, covering plant payroll and the W9 prepayment.`,
      impact: `Caps MXN cost on ≈$${k(h3.notionalUSD)} of outflows`, confidence: 0.82, policy: h3.policy, state: r3, visible: true,
      approveLabel: 'Approve hedge', toast: 'Hedge approved', sources: ['IES Payroll', 'IES Accounting', 'Rate table'],
    },
    {
      id: 'REC-4', kind: 'collection_draft', task: 'collection_drafts',
      title: 'Draft reminders for 3 overdue Maison Nord invoices (€610K)',
      detail: 'INV-40718, INV-40752 and INV-40790 are 12–31 days overdue. Drafts are prepared; nothing is sent until you send it.',
      impact: 'Pulls €610K into W8 with higher confidence', confidence: 0.88, policy: rec4, state: c.recs['REC-4'], visible: rec4.route !== 'blocked',
      approveLabel: 'Approve drafts', toast: 'Drafts approved', sources: ['IES Accounting'],
    },
    {
      id: 'REC-5', kind: 'insight', task: 'anomaly_alerts',
      title: 'India payroll +9% vs. trailing average',
      detail: 'Traced to 14 new hires in IES Payroll data (41 → 55 employees). Monthly run rises from ₹32.0M to ₹34.9M.',
      impact: `≈$${k((34_880_000 - 32_000_000) * BASE_RATES.INR)} more per month`, confidence: 0.95, policy: rec5, state: c.recs['REC-5'], visible: rec5.route !== 'blocked',
      approveLabel: 'Acknowledge insight', toast: 'Insight acknowledged', sources: ['IES Payroll'],
    },
  ];
}

export function computeAll(c: CustomerCore) {
  const items = deriveItems(c);
  const base: Forecast = buildForecast(items);
  const scen: Forecast = buildForecast(items, c.scenario);
  return { items, base, scen, recs: buildRecs(c), exposures: exposures(items) };
}
export { AGENTS };
