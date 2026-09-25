import type { Manifest } from './manifest';

export interface EvalFailure { id: string; name: string; trace: string; fix: string; flag: string }
export interface EvalResult { passed: number; total: number; failures: EvalFailure[]; metrics: { accuracy: number; hallucination: number; scopeViolations: number; p95ms: number } }

export const EVAL_FAILURES: EvalFailure[] = [
  { id: 'EV-17', name: 'INR holiday calendar ignored', flag: 'holidayCalendars', fix: 'Enable regional holiday calendars so payouts shift around Diwali bank holidays.', trace: 'case: sandbox-IN-2025-11\nexpected payout week: W6 (post-Diwali settlement)\nagent posted: W5\nroot cause: holidayCalendars=false; settlement date not rolled forward' },
  { id: 'EV-31', name: 'Currency mismatch in multi-entity rollup', flag: 'convertAtRateTable', fix: 'Convert signals with the IES permissioned rate table before rollup, not the agent’s own rate.', trace: 'case: sandbox-multi-entity-DE\nsignal currency: EUR\nagent rollup currency: USD at 1.12 (agent cache)\nhost rate table: 1.09\nroot cause: convertAtRateTable=false' },
  { id: 'EV-44', name: 'Signal posted without provenance', flag: 'attachProvenance', fix: 'Attach the run ID as provenance on every posted signal.', trace: 'case: sandbox-US-promo-week\nPOST /v1/forecast/signals\nbody.provenance: (missing)\nhost response: accepted in sandbox, would be rejected in production\nroot cause: attachProvenance=false' },
];

/** Deterministic: failures are exactly the fixes whose flag is not set in the manifest. */
export function runEvals(manifest: Manifest): EvalResult {
  const flags = manifest.flags ?? {};
  const failures = EVAL_FAILURES.filter((f) => !flags[f.flag]);
  const total = 50;
  const passed = total - failures.length;
  return {
    passed, total, failures,
    metrics: {
      accuracy: failures.length ? 91.8 : 96.4,
      hallucination: 0,
      scopeViolations: 0,
      p95ms: failures.length ? 840 : 610,
    },
  };
}

export function applyFixes(manifestText: string): string {
  const m = JSON.parse(manifestText) as Manifest;
  m.flags = { ...(m.flags ?? {}), holidayCalendars: true, convertAtRateTable: true, attachProvenance: true };
  return JSON.stringify(m, null, 2);
}
