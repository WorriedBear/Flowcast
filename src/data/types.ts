export type Ccy = 'USD' | 'GBP' | 'EUR' | 'MXN' | 'INR';
export type EntityId = 'US' | 'UK' | 'DE' | 'MX' | 'IN';
export type Category =
  | 'ar_collections' | 'commerce_payouts' | 'wholesale_receipts' | 'ap_suppliers' | 'payroll'
  | 'rent' | 'tax' | 'intercompany' | 'capex' | 'other';
export type SourceSystem =
  | 'IES Accounting' | 'IES Payroll' | 'IES Commerce' | 'Bank feed'
  | 'Marketplace: ShipSignal' | 'Marketplace: RevForecast' | 'Scenario' | 'FlowCast action';

export interface LineItem {
  id: string;
  entity: EntityId;
  week: number; // 1..13
  category: Category;
  amountLocal: number; // signed, in `currency`
  currency: Ccy;
  sourceSystem: SourceSystem;
  counterparty?: string;
  memo: string;
  confidence: number;
}

export interface Entity {
  id: EntityId;
  name: string;
  ccy: Ccy;
  role: string;
  opening: number;
  headcount: number;
  avgAnnualSalaryLocal: number;
}

export type Tier = 'auto' | 'approve' | 'expert' | 'never' | 'off';
export type RecStatus = 'open' | 'approved' | 'dismissed' | 'escalated' | 'executed';
export type Persona = 'cfo' | 'developer' | 'advisor';

export interface Policy {
  minCash: number;
  hedgeBandMin: number;
  hedgeBandMax: number;
  approvalThresholdUSD: number;
  allowedInstruments: string[];
}

export interface Scenario {
  fx: Record<'EUR' | 'GBP' | 'MXN' | 'INR', number>; // % change vs USD (negative = weakens)
  dsoShiftDays: number;
  revenuePct: number;
  hires: number;
  capexAmount: number;
  capexWeek: number;
  delayMxPrepay: boolean;
}

export type AuditActor = 'agent' | 'user' | 'expert' | 'thirdParty';
export interface AuditEntry {
  id: string;
  ts: string;
  actor: AuditActor;
  tier: Tier;
  message: string;
  sourceIds: string[];
  refId?: string;
}
