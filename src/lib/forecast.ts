import { ENTITIES } from '../data/entities';
import { BASE_RATES } from '../data/rates';
import { WEEKS } from '../data/company';
import type { Ccy, EntityId, LineItem, Scenario } from '../data/types';

export const BASE_SCENARIO: Scenario = {
  fx: { EUR: 0, GBP: 0, MXN: 0, INR: 0 },
  dsoShiftDays: 0, revenuePct: 0, hires: 0, capexAmount: 0, capexWeek: 7, delayMxPrepay: false,
};

export function scenarioRates(s: Scenario = BASE_SCENARIO): Record<Ccy, number> {
  return {
    USD: 1,
    EUR: BASE_RATES.EUR * (1 + s.fx.EUR / 100),
    GBP: BASE_RATES.GBP * (1 + s.fx.GBP / 100),
    MXN: BASE_RATES.MXN * (1 + s.fx.MXN / 100),
    INR: BASE_RATES.INR * (1 + s.fx.INR / 100),
  };
}

/** Apply scenario transformations to line items (pure). */
export function applyScenario(items: LineItem[], s: Scenario): LineItem[] {
  const shift = Math.round(s.dsoShiftDays / 7);
  const out: LineItem[] = [];
  for (const it of items) {
    let n = it;
    if (s.revenuePct !== 0 && (it.category === 'commerce_payouts' || it.category === 'wholesale_receipts') && it.amountLocal > 0) {
      n = { ...n, amountLocal: n.amountLocal * (1 + s.revenuePct / 100) };
    }
    if (shift !== 0 && it.category === 'ar_collections') {
      const w = Math.max(1, n.week + shift);
      if (w > WEEKS) continue;
      n = { ...n, week: w };
    }
    if (s.delayMxPrepay && it.entity === 'MX' && it.memo.startsWith('Raw-materials prepayment')) n = { ...n, week: 12 };
    out.push(n);
  }
  if (s.hires > 0) {
    const totalHead = ENTITIES.reduce((a, e) => a + e.headcount, 0);
    for (const e of ENTITIES) {
      const h = (s.hires * e.headcount) / totalHead;
      for (let w = 1; w <= WEEKS; w++) {
        out.push({ id: `SC-HIRE-${e.id}-${w}`, entity: e.id, week: w, category: 'payroll', amountLocal: -(h * e.avgAnnualSalaryLocal * 1.25) / 52, currency: e.ccy, sourceSystem: 'Scenario', memo: `Scenario: ${s.hires} additional hires (loaded cost)`, confidence: 0.7 });
      }
    }
  }
  if (s.capexAmount > 0) {
    out.push({ id: 'SC-CAPEX', entity: 'US', week: s.capexWeek, category: 'capex', amountLocal: -s.capexAmount, currency: 'USD', sourceSystem: 'Scenario', memo: 'Scenario: capex item', confidence: 0.9 });
  }
  return out;
}

export interface WeekPoint {
  week: number;
  inflows: number; // USD
  outflows: number; // USD (negative)
  net: number;
  closing: number;
  p10: number;
  p90: number;
}
export interface EntitySeries { id: EntityId; ccy: Ccy; openingLocal: number; closingLocal: number[]; closingUSD: number[] }
export interface Forecast {
  opening: number;
  weeks: WeekPoint[];
  entities: EntitySeries[];
  low: { week: number; value: number };
  items: LineItem[];
  rates: Record<Ccy, number>;
}

export const bandPct = (w: number) => 0.03 + ((0.11 - 0.03) * (w - 1)) / (WEEKS - 1);

export function toUSD(it: LineItem, rates: Record<Ccy, number>) { return it.amountLocal * rates[it.currency]; }

export function buildForecast(baseItems: LineItem[], scenario: Scenario = BASE_SCENARIO): Forecast {
  const rates = scenarioRates(scenario);
  const items = applyScenario(baseItems, scenario);
  const opening = ENTITIES.reduce((a, e) => a + e.opening * rates[e.ccy], 0);
  const weeks: WeekPoint[] = [];
  let bal = opening;
  for (let w = 1; w <= WEEKS; w++) {
    let inflows = 0, outflows = 0;
    for (const it of items) if (it.week === w) { const u = toUSD(it, rates); if (u >= 0) inflows += u; else outflows += u; }
    const net = inflows + outflows;
    bal += net;
    const b = bandPct(w);
    weeks.push({ week: w, inflows, outflows, net, closing: bal, p10: bal * (1 - b), p90: bal * (1 + b) });
  }
  const entities: EntitySeries[] = ENTITIES.map((e) => {
    const closingLocal: number[] = [];
    let lb = e.opening;
    for (let w = 1; w <= WEEKS; w++) {
      for (const it of items) if (it.entity === e.id && it.week === w) lb += (it.amountLocal * rates[it.currency]) / rates[e.ccy];
      closingLocal.push(lb);
    }
    return { id: e.id, ccy: e.ccy, openingLocal: e.opening, closingLocal, closingUSD: closingLocal.map((v) => v * rates[e.ccy]) };
  });
  const low = weeks.reduce((m, p) => (p.closing < m.value ? { week: p.week, value: p.closing } : m), { week: 1, value: Infinity });
  return { opening, weeks, entities, low, items, rates };
}

export function entityStatus(series: EntitySeries): 'OK' | 'Watch' | 'Gap' {
  const min = Math.min(...series.closingLocal);
  if (min < 0) return 'Gap';
  if (min < series.openingLocal * 0.15) return 'Watch';
  return 'OK';
}

export const earliestNegativeWeek = (s: EntitySeries) => { const i = s.closingLocal.findIndex((v) => v < 0); return i < 0 ? null : i + 1; };
