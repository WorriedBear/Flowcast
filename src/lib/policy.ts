import type { Policy, Tier } from '../data/types';

export type Route = 'auto' | 'approve' | 'expert' | 'blocked';
export type TaskId =
  | 'data_consolidation' | 'fx_rate_refresh' | 'forecast_refresh' | 'anomaly_alerts' | 'collection_drafts'
  | 'intercompany_transfers' | 'payment_timing' | 'hedges_below_threshold' | 'hedges_above_threshold' | 'money_movement';

export type PolicyAction =
  | { kind: 'intercompany_transfer'; notionalUSD: number }
  | { kind: 'hedge'; notionalUSD: number; trancheUSD?: number; instrument: string; ratio: number; expertReviewed?: boolean }
  | { kind: 'execute_trade'; partnerExecuted: boolean; approved: boolean }
  | { kind: 'collection_draft' }
  | { kind: 'insight' }
  | { kind: 'payment_timing'; notionalUSD: number };

export interface PolicyResult { allowed: boolean; route: Route; reasons: string[]; checks: { ok: boolean; label: string }[] }

const fmt = (v: number) => `$${Math.round(v / 1000).toLocaleString('en-US')}K`;
const tierToRoute = (t: Tier | undefined, fallback: Route): Route =>
  t === 'auto' ? 'auto' : t === 'approve' ? 'approve' : t === 'expert' ? 'expert' : t === 'never' || t === 'off' ? 'blocked' : fallback;

export function checkPolicy(action: PolicyAction, policy: Policy, autonomy: Partial<Record<TaskId, Tier>> = {}): PolicyResult {
  const checks: { ok: boolean; label: string }[] = [];
  const reasons: string[] = [];
  switch (action.kind) {
    case 'execute_trade': {
      const ok = action.partnerExecuted && action.approved;
      checks.push({ ok: action.approved, label: 'Approved by a human before execution' });
      checks.push({ ok: action.partnerExecuted, label: 'Executed by a licensed partner, never by FlowCast' });
      reasons.push(ok ? 'Approved trade executed by a licensed partner after explicit confirmation.' : 'Moving money or executing trades is never autonomous. It needs prior approval and a licensed partner.');
      return { allowed: ok, route: ok ? 'approve' : 'blocked', reasons, checks };
    }
    case 'collection_draft': {
      const route = tierToRoute(autonomy.collection_drafts, 'auto');
      reasons.push(route === 'blocked' ? 'Collection drafts are turned off in the Trust Center.' : 'Drafting reminders never sends anything; a person sends them.');
      checks.push({ ok: true, label: 'Drafts only, nothing is sent' });
      return { allowed: route !== 'blocked', route, reasons, checks };
    }
    case 'insight': {
      const route = tierToRoute(autonomy.anomaly_alerts, 'auto');
      reasons.push(route === 'blocked' ? 'Anomaly alerts are turned off in the Trust Center.' : 'Insight only; no action is taken.');
      checks.push({ ok: true, label: 'Read-only insight' });
      return { allowed: route !== 'blocked', route, reasons, checks };
    }
    case 'intercompany_transfer':
    case 'payment_timing': {
      const task: TaskId = action.kind === 'intercompany_transfer' ? 'intercompany_transfers' : 'payment_timing';
      checks.push({ ok: true, label: 'Stays inside the group; cash does not leave Solace Living' });
      checks.push({ ok: true, label: `Notional ${fmt(action.notionalUSD)}; moves between Solace bank accounts only` });
      const route = tierToRoute(autonomy[task], 'approve');
      reasons.push(route === 'auto' ? 'Autonomy for this task is set to Autonomous in the Trust Center.' : route === 'blocked' ? 'This task is turned off in the Trust Center.' : 'Intercompany transfers and payment-timing changes need a human approval.');
      return { allowed: route !== 'blocked', route, reasons, checks };
    }
    case 'hedge': {
      const size = action.trancheUSD ?? action.notionalUSD;
      const instrumentOk = policy.allowedInstruments.includes(action.instrument);
      const bandOk = action.ratio >= policy.hedgeBandMin && action.ratio <= policy.hedgeBandMax;
      const underThreshold = size < policy.approvalThresholdUSD;
      checks.push({ ok: instrumentOk, label: `Instrument "${action.instrument}" is on the allowed list` });
      checks.push({ ok: bandOk, label: `Hedge ratio ${action.ratio}% is inside the ${policy.hedgeBandMin}–${policy.hedgeBandMax}% band` });
      checks.push({ ok: underThreshold, label: `${action.trancheUSD ? 'Largest tranche' : 'Notional'} ${fmt(size)} vs. ${fmt(policy.approvalThresholdUSD)} expert threshold` });
      if (action.expertReviewed && instrumentOk && bandOk) {
        reasons.push('An expert has reviewed this hedge; it now needs your approval.');
        return { allowed: true, route: 'approve', reasons, checks };
      }
      if (!instrumentOk) reasons.push('Instrument is not on the allowed list, so an expert must review it.');
      if (!bandOk) reasons.push('Hedge ratio is outside the policy band, so an expert must review it.');
      if (!underThreshold) reasons.push('Notional is at or above the approval threshold, so an expert must review it first.');
      if (!instrumentOk || !bandOk || !underThreshold) return { allowed: true, route: 'expert', reasons, checks };
      reasons.push('Inside policy and below the threshold: suggest and approve.');
      return { allowed: true, route: 'approve', reasons, checks };
    }
  }
}

export const ROUTE_LABEL: Record<Route, string> = { auto: 'Autonomous', approve: 'Suggest & approve', expert: 'Expert required', blocked: 'Never autonomous' };
