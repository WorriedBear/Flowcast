import { ENTITIES } from '../data/entities';
import { ENTITY_IDS, endpointById } from '../data/developer';
import { BASE_RATES } from '../data/rates';
import type { LineItem, Policy } from '../data/types';
import { buildForecast } from './forecast';
import { exposures } from './fx';
import { checkPolicy } from './policy';

export interface ApiCtx { scopes: string[]; items: LineItem[]; policy: Policy; apiKey?: string }
export interface ApiResult { status: number; json: unknown }

const r2 = (v: number) => Math.round(v * 100) / 100;
const semantic = (fields: Record<string, string>) => ({ _semantic: fields });
const err = (status: number, code: string, message: string): ApiResult => ({ status, json: { error: { code, message } } });

export function mockApi(endpointId: string, params: Record<string, string>, ctx: ApiCtx): ApiResult {
  const ep = endpointById(endpointId);
  if (!ep) return err(404, 'not_found', `Unknown endpoint "${endpointId}".`);
  if (!ctx.scopes.includes(ep.scope)) return err(403, 'insufficient_scope', `This key lacks the "${ep.scope}" scope. Add it to the key and retry.`);
  const entity = params.entity?.trim();
  if (entity && !ENTITY_IDS.includes(entity)) return err(400, 'invalid_param', `entity must be one of ${ENTITY_IDS.join(', ')}; got "${entity}".`);
  const f = buildForecast(ctx.items);
  const provenance = (id: string) => ({ provenance: [`ies:${id}:2026-09-25T06:02:00Z`] });

  switch (endpointId) {
    case 'entities':
      return { status: 200, json: { data: ENTITIES.map((e) => ({ id: e.id, name: e.name, currency: e.ccy, role: e.role })), ...semantic({ currency: 'ISO 4217 functional currency of the entity' }), ...provenance('entities') } };
    case 'cash-positions': {
      const cur = params.currency || 'USD';
      if (!['USD', 'local'].includes(cur)) return err(400, 'invalid_param', 'currency must be "USD" or "local".');
      if (params.consolidated && !['true', 'false'].includes(params.consolidated)) return err(400, 'invalid_param', 'consolidated must be true or false.');
      const rows = ENTITIES.filter((e) => !entity || e.id === entity).map((e) => ({
        entity: e.id, currency: cur === 'USD' ? 'USD' : e.ccy, balance: cur === 'USD' ? r2(e.opening * BASE_RATES[e.ccy]) : e.opening, as_of: '2026-09-25',
      }));
      const body: Record<string, unknown> = { data: rows };
      if (params.consolidated === 'true') body.consolidated = { currency: 'USD', balance: r2(f.opening) };
      return { status: 200, json: { ...body, ...semantic({ balance: 'Opening cash position at start of W1', consolidated: 'Sum of entity balances converted at the IES rate table' }), ...provenance('bank-feed') } };
    }
    case 'forecast': {
      const h = params.horizon ? Number(params.horizon) : 13;
      if (!Number.isInteger(h) || h < 1 || h > 13) return err(400, 'invalid_param', 'horizon must be an integer from 1 to 13.');
      const weeks = entity
        ? f.entities.find((e) => e.id === entity)!.closingLocal.slice(0, h).map((v, i) => ({ week: i + 1, closing: r2(v) }))
        : f.weeks.slice(0, h).map((p) => ({ week: p.week, closing: r2(p.closing), p10: r2(p.p10), p90: r2(p.p90) }));
      return { status: 200, json: { entity: entity || 'consolidated', currency: entity ? ENTITIES.find((e) => e.id === entity)!.ccy : 'USD', weeks, ...semantic({ closing: 'Forecast closing cash for the week', p10: 'Pessimistic band', p90: 'Optimistic band' }), ...provenance('forecast') } };
    }
    case 'fx-exposures': {
      const c = params.currency;
      if (c && !['EUR', 'GBP', 'MXN', 'INR'].includes(c)) return err(400, 'invalid_param', 'currency must be EUR, GBP, MXN or INR.');
      const data = exposures(ctx.items).filter((e) => !c || e.ccy === c).map((e) => ({ currency: e.ccy, net: r2(e.net), net_usd: r2(e.netUSD), direction: e.net >= 0 ? 'long' : 'short' }));
      return { status: 200, json: { data, ...semantic({ net: '13-week net external flows in the currency', direction: 'long = net inflows' }), ...provenance('fx') } };
    }
    case 'forecast-signals': {
      let b: Record<string, unknown>;
      try { b = JSON.parse(params.body || ''); } catch { return err(400, 'invalid_body', 'Body must be valid JSON.'); }
      if (!ENTITY_IDS.includes(String(b.entity))) return err(400, 'invalid_param', `entity must be one of ${ENTITY_IDS.join(', ')}.`);
      const w = Number(b.week);
      if (!Number.isInteger(w) || w < 1 || w > 13) return err(400, 'invalid_param', 'week must be an integer from 1 to 13.');
      if (typeof b.amount !== 'number') return err(400, 'invalid_param', 'amount must be a number.');
      if (!b.provenance) return err(400, 'missing_provenance', 'Every signal needs a provenance ID so CFOs can trace it.');
      return { status: 201, json: { id: 'sig_7Q2KD', status: 'accepted', applies_to: { entity: b.entity, week: w }, label: 'Shown to the customer as a third-party signal with your agent as the source' } };
    }
    case 'recommendations': {
      let b: Record<string, unknown>;
      try { b = JSON.parse(params.body || ''); } catch { return err(400, 'invalid_body', 'Body must be valid JSON.'); }
      const kind = String(b.kind);
      if (!['hedge', 'intercompany_transfer', 'execute_trade'].includes(kind)) return err(400, 'invalid_param', 'kind must be hedge, intercompany_transfer or execute_trade.');
      const res = kind === 'hedge'
        ? checkPolicy({ kind: 'hedge', notionalUSD: Number(b.notional_usd) || 0, instrument: String(b.instrument || 'forward'), ratio: Number(b.ratio) || 0 }, ctx.policy)
        : kind === 'execute_trade'
          ? checkPolicy({ kind: 'execute_trade', partnerExecuted: false, approved: false }, ctx.policy)
          : checkPolicy({ kind: 'intercompany_transfer', notionalUSD: Number(b.notional_usd) || 0 }, ctx.policy);
      return { status: 200, json: { id: 'rec_ext_31', route: res.route, reasons: res.reasons } };
    }
  }
  return err(404, 'not_found', 'Unknown endpoint.');
}
