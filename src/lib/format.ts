import { W1_START } from '../data/company';
import type { Ccy } from '../data/types';

const SYM: Record<Ccy, string> = { USD: '$', GBP: '£', EUR: '€', MXN: 'MX$', INR: '₹' };
export const MINUS = '−';

export function money(v: number, ccy: Ccy = 'USD', opts: { signed?: boolean; compact?: boolean; digits?: number } = {}) {
  const { signed = false, compact = true, digits } = opts;
  const abs = Math.abs(v);
  let body: string;
  if (compact && abs >= 1e9) body = (abs / 1e9).toFixed(digits ?? 2) + 'B';
  else if (compact && abs >= 1e6) body = (abs / 1e6).toFixed(digits ?? (abs >= 1e8 ? 0 : 2)) + 'M';
  else if (compact && abs >= 1e4) body = (abs / 1e3).toFixed(digits ?? 0) + 'K';
  else body = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const sign = v < 0 ? MINUS : signed && v > 0 ? '+' : '';
  return `${sign}${SYM[ccy]}${body}`;
}
export const fullMoney = (v: number, ccy: Ccy = 'USD') =>
  `${v < 0 ? MINUS : ''}${SYM[ccy]}${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
export const usdM = (v: number, d = 1) => `${v < 0 ? MINUS : ''}$${(Math.abs(v) / 1e6).toFixed(d)}M`;
export const pct = (v: number, d = 1, signed = false) => `${v < 0 ? MINUS : signed && v > 0 ? '+' : ''}${Math.abs(v).toFixed(d)}%`;
export const fxRate = (v: number) => v.toFixed(v < 0.1 ? 4 : 3);
export function weekDate(w: number) {
  const d = new Date(W1_START.getTime() + (w - 1) * 7 * 86400000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
export const weekLabel = (w: number) => `W${w}`;
export const weekLong = (w: number) => `W${w} · week of ${weekDate(w)}`;
