import { ALL_SCOPES } from '../data/developer';

export interface Manifest {
  name: string; version: string; description?: string; triggers: string[]; tools: string[]; scopes: string[];
  autonomy: 'insight' | 'suggest' | 'act'; humanCheckpoint?: { when: string; route: string }; pricing?: { model: string; usd_month?: number };
  flags?: Record<string, boolean>;
}
export interface ManifestError { message: string; line?: number }
export interface ParseResult { ok: boolean; errors: ManifestError[]; manifest?: Manifest }

const TOOL_SCOPE: Record<string, string> = {
  get_commerce_payouts: 'commerce.read', get_forecast: 'forecast.read', post_forecast_signal: 'forecast.signals.write',
  get_entities: 'entities.read', get_cash_positions: 'cash.read', get_fx_exposures: 'fx.read', post_recommendation: 'recommendations.write',
};
export const KNOWN_TOOLS = Object.keys(TOOL_SCOPE);

function lineOf(text: string, key: string) {
  const i = text.split('\n').findIndex((l) => l.includes(`"${key}"`));
  return i >= 0 ? i + 1 : undefined;
}

export function parseManifest(text: string): ParseResult {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) {
    const m = /position (\d+)/.exec(String(e));
    const line = m ? text.slice(0, Number(m[1])).split('\n').length : undefined;
    return { ok: false, errors: [{ message: 'Manifest is not valid JSON. Check for a missing comma or quote.', line }] };
  }
  const errors: ManifestError[] = [];
  const m = raw as Partial<Manifest>;
  if (!m || typeof m !== 'object') return { ok: false, errors: [{ message: 'Manifest must be a JSON object.' }] };
  if (!m.name || typeof m.name !== 'string') errors.push({ message: 'Missing "name". Add a display name for your agent.', line: lineOf(text, 'name') ?? 1 });
  if (!m.version) errors.push({ message: 'Missing "version". Use semver, e.g. "1.0.0".', line: 1 });
  if (!Array.isArray(m.scopes) || m.scopes.length === 0) errors.push({ message: 'Declare at least one scope in "scopes".', line: lineOf(text, 'scopes') });
  else m.scopes.forEach((s) => { if (!ALL_SCOPES.includes(s)) errors.push({ message: `Unknown scope "${s}". Valid scopes: ${ALL_SCOPES.join(', ')}.`, line: lineOf(text, s) ?? lineOf(text, 'scopes') }); });
  if (!Array.isArray(m.tools)) errors.push({ message: 'Declare "tools" as an array.', line: lineOf(text, 'tools') });
  else m.tools.forEach((t) => { if (!TOOL_SCOPE[t]) errors.push({ message: `Unknown tool "${t}".`, line: lineOf(text, t) }); else if (Array.isArray(m.scopes) && !m.scopes.includes(TOOL_SCOPE[t])) errors.push({ message: `Tool "${t}" needs scope "${TOOL_SCOPE[t]}".`, line: lineOf(text, t) }); });
  if (!['insight', 'suggest', 'act'].includes(String(m.autonomy))) errors.push({ message: '"autonomy" must be insight, suggest or act.', line: lineOf(text, 'autonomy') });
  if (m.autonomy === 'act' && !m.humanCheckpoint) errors.push({ message: 'autonomy "act" requires a "humanCheckpoint". Add {"when": ..., "route": "approve"}.', line: lineOf(text, 'autonomy') });
  if (!Array.isArray(m.triggers)) errors.push({ message: 'Declare "triggers" as an array.', line: lineOf(text, 'triggers') });
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], manifest: m as Manifest };
}

/** Scopes declared but not needed by any tool. */
export function unusedScopes(m: Manifest) {
  const needed = new Set(m.tools.map((t) => TOOL_SCOPE[t]));
  return m.scopes.filter((s) => !needed.has(s));
}
