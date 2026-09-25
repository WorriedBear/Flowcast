import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../data/entities';
import { SEED_ITEMS } from '../data/flows';
import { BASE_RATES } from '../data/rates';
import { BASE_SCENARIO, buildForecast } from '../lib/forecast';
import { buildRecs, deriveItems, SEED_CUSTOMER, type CustomerCore } from '../lib/derive';
import { checkPolicy } from '../lib/policy';
import { exposures, netting, sensitivity } from '../lib/fx';
import { mape } from '../data/accuracy';

const ANCHORS = [24.0, 22.9, 23.3, 21.5, 20.6, 17.5, 15.2, 17.8, 15.8, 16.7, 22.3, 21.1, 21.6];
const seedItems = deriveItems(SEED_CUSTOMER);

describe('forecast anchors', () => {
  it('consolidated opening equals the sum of converted entity openings', () => {
    const expected = ENTITIES.reduce((a, e) => a + e.opening * BASE_RATES[e.ccy], 0);
    const f = buildForecast(seedItems);
    expect(f.opening).toBeCloseTo(expected, 2);
    expect(f.opening / 1e6).toBeCloseTo(24.62, 2);
  });
  it('hits every W1–W13 anchor within ±0.05M and W7 is the minimum', () => {
    const f = buildForecast(seedItems);
    f.weeks.forEach((p, i) => expect(Math.abs(p.closing / 1e6 - ANCHORS[i])).toBeLessThanOrEqual(0.05));
    expect(f.low.week).toBe(7);
  });
  it('confidence band grows from ±3% to ±11%', () => {
    const f = buildForecast(seedItems);
    expect(f.weeks[0].p90 / f.weeks[0].closing).toBeCloseTo(1.03, 5);
    expect(f.weeks[12].p90 / f.weeks[12].closing).toBeCloseTo(1.11, 5);
  });
  it('accuracy history: FlowCast MAPE ≈ 3.8%, spreadsheet ≈ 14%', () => {
    expect(mape('flowcast')).toBeCloseTo(3.8, 1);
    expect(mape('spreadsheet')).toBeCloseTo(14, 0);
  });
});

describe('UK W6 gap', () => {
  it('is negative without REC-1 and positive with REC-1 approved', () => {
    const uk = (c: CustomerCore) => buildForecast(deriveItems(c)).entities.find((e) => e.id === 'UK')!.closingLocal[5];
    expect(uk(SEED_CUSTOMER)).toBeLessThan(0);
    expect(uk(SEED_CUSTOMER) / 1e6).toBeCloseTo(-0.35, 1);
    expect(uk({ ...SEED_CUSTOMER, recs: { ...SEED_CUSTOMER.recs, 'REC-1': { status: 'approved' } } })).toBeGreaterThan(0);
  });
});

describe('policy routing', () => {
  const recs = buildRecs(SEED_CUSTOMER);
  it('REC-1 → approve', () => expect(recs.find((r) => r.id === 'REC-1')!.policy.route).toBe('approve'));
  it('REC-2 → expert', () => expect(recs.find((r) => r.id === 'REC-2')!.policy.route).toBe('expert'));
  it('REC-3 → approve (tranches under threshold)', () => expect(recs.find((r) => r.id === 'REC-3')!.policy.route).toBe('approve'));
  it('execute_trade → blocked unless partner-executed after approval', () => {
    const p = SEED_CUSTOMER.policy;
    expect(checkPolicy({ kind: 'execute_trade', partnerExecuted: false, approved: false }, p).route).toBe('blocked');
    expect(checkPolicy({ kind: 'execute_trade', partnerExecuted: true, approved: false }, p).route).toBe('blocked');
    expect(checkPolicy({ kind: 'execute_trade', partnerExecuted: false, approved: true }, p).route).toBe('blocked');
    expect(checkPolicy({ kind: 'execute_trade', partnerExecuted: true, approved: true }, p).route).not.toBe('blocked');
  });
  it('intercompany set to Autonomous routes REC-1 to auto', () => {
    const r = buildRecs({ ...SEED_CUSTOMER, autonomy: { ...SEED_CUSTOMER.autonomy, intercompany_transfers: 'auto' } });
    expect(r.find((x) => x.id === 'REC-1')!.policy.route).toBe('auto');
  });
});

describe('capex policy breach', () => {
  it('$3.5M in W7 breaches the $12M floor (low ≈ $11.7M)', () => {
    const f = buildForecast(seedItems, { ...BASE_SCENARIO, capexAmount: 3_500_000, capexWeek: 7 });
    expect(f.low.week).toBe(7);
    expect(f.low.value / 1e6).toBeCloseTo(11.7, 1);
    expect(f.low.value).toBeLessThan(12_000_000);
  });
  it('$3.5M in W11 keeps the low at W7 = $15.2M', () => {
    const f = buildForecast(seedItems, { ...BASE_SCENARIO, capexAmount: 3_500_000, capexWeek: 11 });
    expect(f.low.week).toBe(7);
    expect(Math.abs(f.low.value / 1e6 - 15.2)).toBeLessThanOrEqual(0.05);
  });
});

describe('FX', () => {
  it('net exposures are roughly EUR +2.3M, GBP −0.8M, MXN −96M, INR −120M', () => {
    const ex = Object.fromEntries(exposures(SEED_ITEMS).map((e) => [e.ccy, e.net / 1e6]));
    expect(Math.abs(ex.EUR - 2.3)).toBeLessThan(0.15);
    expect(Math.abs(ex.GBP + 0.8)).toBeLessThan(0.1);
    expect(Math.abs(ex.MXN + 96)).toBeLessThan(3);
    expect(Math.abs(ex.INR + 120)).toBeLessThan(3);
  });
  it('netting reduction is between 30% and 45%', () => {
    const n = netting(seedItems);
    expect(n.reductionPct).toBeGreaterThanOrEqual(30);
    expect(n.reductionPct).toBeLessThanOrEqual(45);
  });
  it('EUR −5% impact equals −5% of EUR net flows and balances at base rate', () => {
    const eurOpen = ENTITIES.filter((e) => e.ccy === 'EUR').reduce((a, e) => a + e.opening, 0);
    const eurFlows = seedItems.filter((i) => i.currency === 'EUR').reduce((a, i) => a + i.amountLocal, 0);
    const expected = -0.05 * (eurOpen + eurFlows) * BASE_RATES.EUR;
    const s = sensitivity(seedItems, 'EUR', -5);
    expect(s).toBeLessThan(0);
    expect(s).toBeCloseTo(expected, 0);
  });
});
