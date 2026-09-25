export interface Param { name: string; type: 'string' | 'boolean' | 'number' | 'json'; required?: boolean; enum?: string[]; example: string; desc: string }
export interface Endpoint { id: string; method: 'GET' | 'POST'; path: string; group: string; desc: string; scope: string; params: Param[] }

export const ENTITY_IDS = ['US', 'UK', 'DE', 'MX', 'IN'];
export const ALL_SCOPES = ['entities.read', 'cash.read', 'forecast.read', 'fx.read', 'forecast.signals.write', 'recommendations.write', 'commerce.read'];

export const ENDPOINTS: Endpoint[] = [
  { id: 'entities', method: 'GET', path: '/v1/entities', group: 'Entities', scope: 'entities.read', desc: 'Lists legal entities with functional currency and role.', params: [] },
  { id: 'cash-positions', method: 'GET', path: '/v1/cash/positions', group: 'Cash', scope: 'cash.read', desc: 'Current cash by entity, converted at the permissioned IES rate table.', params: [
    { name: 'consolidated', type: 'boolean', example: 'true', desc: 'Return the consolidated USD total.' },
    { name: 'entity', type: 'string', enum: ENTITY_IDS, example: '', desc: 'Filter to one entity.' },
    { name: 'currency', type: 'string', enum: ['USD', 'local'], example: 'USD', desc: 'Reporting currency.' },
  ] },
  { id: 'forecast', method: 'GET', path: '/v1/forecast', group: 'Forecast', scope: 'forecast.read', desc: 'Weekly closing-cash forecast with P10/P90 band.', params: [
    { name: 'horizon', type: 'number', example: '13', desc: 'Weeks, 1–13.' },
    { name: 'entity', type: 'string', enum: ENTITY_IDS, example: '', desc: 'Filter to one entity (omit for consolidated).' },
  ] },
  { id: 'fx-exposures', method: 'GET', path: '/v1/fx/exposures', group: 'FX', scope: 'fx.read', desc: 'Net 13-week exposure per currency, by entity.', params: [
    { name: 'currency', type: 'string', enum: ['EUR', 'GBP', 'MXN', 'INR'], example: '', desc: 'Filter to one currency.' },
  ] },
  { id: 'forecast-signals', method: 'POST', path: '/v1/forecast/signals', group: 'Forecast', scope: 'forecast.signals.write', desc: 'Third parties contribute forecast signals. The key platform hook: signals appear as labeled line items with provenance.', params: [
    { name: 'body', type: 'json', required: true, example: '{\n  "entity": "US",\n  "week": 10,\n  "category": "commerce_payouts",\n  "amount": 260000,\n  "currency": "USD",\n  "provenance": "rf-run-2026-09-25-01"\n}', desc: 'Signal payload. entity, week (1–13), amount and provenance are required.' },
  ] },
  { id: 'recommendations', method: 'POST', path: '/v1/recommendations', group: 'Recommendations', scope: 'recommendations.write', desc: 'Agents propose actions. The host policy routes each one: autonomous, approve, expert, or blocked.', params: [
    { name: 'body', type: 'json', required: true, example: '{\n  "kind": "hedge",\n  "currency": "EUR",\n  "ratio": 60,\n  "instrument": "forward",\n  "notional_usd": 1517000\n}', desc: 'kind is one of hedge, intercompany_transfer, execute_trade.' },
  ] },
];
export const endpointById = (id: string) => ENDPOINTS.find((e) => e.id === id);

export const SEED_MANIFEST = JSON.stringify({
  name: 'RevForecast for DTC',
  version: '0.9.0',
  description: 'Improves revenue and payout forecasts for e-commerce brands.',
  triggers: ['forecast.updated', 'schedule:daily'],
  tools: ['get_commerce_payouts', 'get_forecast', 'post_forecast_signal'],
  scopes: ['commerce.read', 'forecast.read', 'forecast.signals.write'],
  autonomy: 'suggest',
  humanCheckpoint: { when: 'signal_delta_pct > 15', route: 'approve' },
  pricing: { model: 'per_active_company', usd_month: 149 },
}, null, 2);

export const MCP_CONFIG = `{
  "mcpServers": {
    "ies": {
      "command": "npx",
      "args": ["-y", "@intuit/ies-mcp-server"],
      "env": { "IES_API_KEY": "<your sandbox key>", "IES_ENV": "sandbox" }
    }
  }
}`;

export const SDK_SNIPPET = `import { defineAgent } from '@intuit/ies-agent-sdk';

export default defineAgent({
  manifest: './manifest.json',
  async run({ ies, signal }) {
    const payouts = await ies.commerce.payouts({ weeks: 52 });
    const forecast = await ies.forecast.get({ horizon: 13 });
    const uplift = seasonality(payouts).against(forecast);
    for (const w of uplift.weeks) {
      await signal.post({ entity: 'US', week: w.week, category: 'commerce_payouts',
        amount: w.delta, currency: 'USD', provenance: w.runId });
    }
  },
});`;
