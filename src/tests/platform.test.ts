import { describe, expect, it } from 'vitest';
import { SEED_MANIFEST, ALL_SCOPES } from '../data/developer';
import { parseManifest } from '../lib/manifest';
import { applyFixes, runEvals } from '../lib/evals';
import { mockApi } from '../lib/api';
import { deriveItems, SEED_CUSTOMER } from '../lib/derive';
import { buildAnswer } from '../lib/answers';
import { matchIntent } from '../lib/intents';

const seed = JSON.parse(SEED_MANIFEST);
describe('parseManifest', () => {
  it('accepts the seed manifest', () => expect(parseManifest(SEED_MANIFEST).ok).toBe(true));
  it('rejects a missing name', () => { const { name: _n, ...m } = seed; expect(parseManifest(JSON.stringify(m)).ok).toBe(false); });
  it('rejects an unknown scope', () => expect(parseManifest(JSON.stringify({ ...seed, scopes: [...seed.scopes, 'payroll.write'] })).ok).toBe(false));
  it('rejects autonomy act without humanCheckpoint', () => { const { humanCheckpoint: _h, ...m } = seed; expect(parseManifest(JSON.stringify({ ...m, autonomy: 'act' })).ok).toBe(false); });
});

describe('runEvals', () => {
  it('is deterministic: 47/50 with 3 named failures, then 50/50 after fixes', () => {
    const a = runEvals(parseManifest(SEED_MANIFEST).manifest!);
    const b = runEvals(parseManifest(SEED_MANIFEST).manifest!);
    expect(a.passed).toBe(47);
    expect(a.failures.map((f) => f.name)).toEqual(['INR holiday calendar ignored', 'Currency mismatch in multi-entity rollup', 'Signal posted without provenance']);
    expect(b).toEqual(a);
    expect(runEvals(parseManifest(applyFixes(SEED_MANIFEST)).manifest!).passed).toBe(50);
  });
});

describe('mockApi', () => {
  const ctx = { scopes: ALL_SCOPES, items: deriveItems(SEED_CUSTOMER), policy: SEED_CUSTOMER.policy };
  it('returns 403 when the key lacks a scope', () => expect(mockApi('cash-positions', {}, { ...ctx, scopes: ['entities.read'] }).status).toBe(403));
  it('returns 400 on an invalid entity', () => expect(mockApi('forecast', { entity: 'FR' }, ctx).status).toBe(400));
  it('returns 200 with correct numbers', () => {
    const r = mockApi('cash-positions', { consolidated: 'true' }, ctx);
    expect(r.status).toBe(200);
    expect((r.json as { consolidated: { balance: number } }).consolidated.balance).toBeCloseTo(24_621_500, 0);
  });
});

describe('Ask FlowCast', () => {
  it('matches the 8 core intents', () => {
    expect(matchIntent('What if EUR weakens 5%?')).toBe('fx_shock');
    expect(matchIntent('Can we afford $3.5M capex in week 7?')).toBe('afford_capex');
    expect(matchIntent('Why is the UK short in week 6?')).toBe('uk_gap');
    expect(matchIntent('Why is week 7 the low point?')).toBe('low_point');
    expect(matchIntent('Should we hedge the EUR exposure?')).toBe('hedge_eur');
    expect(matchIntent('Which invoices are overdue?')).toBe('collections');
    expect(matchIntent('Write a board summary of our cash position')).toBe('board_summary');
    expect(matchIntent('What is our treasury policy?')).toBe('policy');
  });
  it('declines out-of-domain questions with suggestions', () => {
    const a = buildAnswer('what is the weather tomorrow', SEED_CUSTOMER);
    expect(a.intent).toBe('out_of_domain');
    expect(a.actions.length).toBe(3);
  });
  it('capex answer flags the W7 breach', () => {
    const a = buildAnswer('Can we afford $3.5M capex in week 7?', SEED_CUSTOMER);
    expect(a.text).toMatch(/Not in W7/);
  });
});
