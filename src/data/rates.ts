import type { Ccy } from './types';

/** USD per 1 unit. Illustrative, not live. */
export const BASE_RATES: Record<Ccy, number> = { USD: 1, GBP: 1.27, EUR: 1.09, MXN: 0.055, INR: 0.012 };
export const RATE_TABLE_LABEL = 'Rate table · IES multi-currency (beta)';
export const RATE_NOTE = 'Illustrative rates fixed for the demo, not live market data.';
export const FOREIGN: Exclude<Ccy, 'USD'>[] = ['EUR', 'GBP', 'MXN', 'INR'];
