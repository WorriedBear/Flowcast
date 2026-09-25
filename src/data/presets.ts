import type { Scenario } from './types';
import { BASE_SCENARIO } from '../lib/forecast';

export const PRESETS: { id: string; label: string; desc: string; s: Scenario }[] = [
  { id: 'strong-dollar', label: 'Strong dollar', desc: 'USD +5% against all four currencies', s: { ...BASE_SCENARIO, fx: { EUR: -5, GBP: -5, MXN: -5, INR: -5 } } },
  { id: 'recession-lite', label: 'Recession-lite', desc: 'Revenue −10%, customers pay 14 days later', s: { ...BASE_SCENARIO, revenuePct: -10, dsoShiftDays: 14 } },
  { id: 'growth-push', label: 'Growth push', desc: 'Revenue +8%, 30 additional hires', s: { ...BASE_SCENARIO, revenuePct: 8, hires: 30 } },
  { id: 'mexico', label: 'Mexico expansion', desc: '$3.5M plant capex in W7', s: { ...BASE_SCENARIO, capexAmount: 3_500_000, capexWeek: 7 } },
];
