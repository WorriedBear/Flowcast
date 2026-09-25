import { ENTITIES } from '../data/entities';
import { BASE_RATES, FOREIGN } from '../data/rates';
import type { Ccy, EntityId, LineItem, Policy } from '../data/types';
import { buildForecast, BASE_SCENARIO } from './forecast';
import { checkPolicy, type PolicyResult } from './policy';

export type FCcy = Exclude<Ccy, 'USD'>;
export interface Exposure {
  ccy: FCcy;
  inflows: number; // local
  outflows: number; // local (negative)
  net: number; // local
  netUSD: number;
  byEntity: { entity: EntityId; net: number; netUSD: number }[];
}

/** External 13-week forecast flows by currency (intercompany excluded: it nets to zero inside the group). */
export function exposures(items: LineItem[], rates: Record<Ccy, number> = BASE_RATES): Exposure[] {
  return FOREIGN.map((ccy) => {
    const rel = items.filter((i) => i.currency === ccy && i.category !== 'intercompany');
    const inflows = rel.filter((i) => i.amountLocal > 0).reduce((a, i) => a + i.amountLocal, 0);
    const outflows = rel.filter((i) => i.amountLocal < 0).reduce((a, i) => a + i.amountLocal, 0);
    const byEntity = ENTITIES.map((e) => {
      const net = rel.filter((i) => i.entity === e.id).reduce((a, i) => a + i.amountLocal, 0);
      return { entity: e.id, net, netUSD: net * rates[ccy] };
    }).filter((x) => Math.abs(x.net) > 0);
    const net = inflows + outflows;
    return { ccy, inflows, outflows, net, netUSD: net * rates[ccy], byEntity };
  });
}

export interface Netting { entityByEntity: number; group: number; reductionPct: number; offsets: { ccy: FCcy; long: EntityId[]; short: EntityId[]; savedUSD: number }[] }
export function netting(items: LineItem[]): Netting {
  const ex = exposures(items);
  const entityByEntity = ex.reduce((a, e) => a + e.byEntity.reduce((b, x) => b + Math.abs(x.netUSD), 0), 0);
  const group = ex.reduce((a, e) => a + Math.abs(e.netUSD), 0);
  const offsets = ex
    .map((e) => ({
      ccy: e.ccy,
      long: e.byEntity.filter((x) => x.net > 0).map((x) => x.entity),
      short: e.byEntity.filter((x) => x.net < 0).map((x) => x.entity),
      savedUSD: e.byEntity.reduce((b, x) => b + Math.abs(x.netUSD), 0) - Math.abs(e.netUSD),
    }))
    .filter((o) => o.long.length && o.short.length);
  return { entityByEntity, group, reductionPct: ((entityByEntity - group) / entityByEntity) * 100, offsets };
}

/** USD impact on 13-week closing consolidated cash of a `pct` move in `ccy` vs USD. */
export function sensitivity(items: LineItem[], ccy: FCcy, pctMove: number): number {
  const base = buildForecast(items, BASE_SCENARIO);
  const s = buildForecast(items, { ...BASE_SCENARIO, fx: { ...BASE_SCENARIO.fx, [ccy]: pctMove } });
  return s.weeks[12].closing - base.weeks[12].closing;
}

export interface HedgeProposal {
  ccy: FCcy;
  direction: 'long' | 'short';
  instrument: 'forward' | 'layered forwards';
  ratio: number;
  notionalLocal: number;
  notionalUSD: number;
  tranches: number;
  trancheUSD: number;
  tenor: string;
  policy: PolicyResult;
}
export function hedgeProposal(ex: Exposure, ratio: number, policy: Policy, opts: { layered?: boolean; expertReviewed?: boolean } = {}): HedgeProposal {
  const notionalLocal = Math.abs(ex.net) * (ratio / 100);
  const notionalUSD = notionalLocal * BASE_RATES[ex.ccy];
  const tranches = opts.layered ? 6 : 1;
  const trancheUSD = notionalUSD / tranches;
  const instrument = opts.layered ? 'layered forwards' : 'forward';
  return {
    ccy: ex.ccy, direction: ex.net >= 0 ? 'long' : 'short', instrument, ratio, notionalLocal, notionalUSD, tranches, trancheUSD,
    tenor: opts.layered ? '6 monthly tranches, 1–6 months' : '3 months',
    policy: checkPolicy({ kind: 'hedge', notionalUSD, trancheUSD: opts.layered ? trancheUSD : undefined, instrument, ratio, expertReviewed: opts.expertReviewed }, policy),
  };
}
