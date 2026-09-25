/** 8 past weeks: actual consolidated closing cash (USD) and forecasts made 4 weeks earlier. Illustrative assumption. */
const ACTUALS = [22_400_000, 21_900_000, 23_100_000, 24_300_000, 23_600_000, 22_800_000, 24_900_000, 24_100_000];
const FC_ERR = [0.031, -0.045, 0.028, -0.039, 0.046, -0.032, 0.041, -0.042];
const BASE_ERR = [0.12, -0.16, 0.15, -0.11, 0.17, -0.13, 0.14, -0.14];
export const ACCURACY = ACTUALS.map((a, i) => ({
  label: `W${i - 8}`,
  actual: a,
  flowcast: Math.round(a * (1 + FC_ERR[i])),
  spreadsheet: Math.round(a * (1 + BASE_ERR[i])),
}));
export const mape = (key: 'flowcast' | 'spreadsheet') =>
  (ACCURACY.reduce((s, r) => s + Math.abs(r[key] - r.actual) / r.actual, 0) / ACCURACY.length) * 100;
export const ACCURACY_NOTE = 'Illustrative. The real target is validated in shadow mode (see Experiments).';
