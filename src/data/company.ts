export const COMPANY = {
  name: 'Solace Living Inc.',
  hq: 'Austin, TX',
  employees: 640,
  revenueUSD: 180_000_000,
  note: 'Fictional company. Headcount, revenue, balances and flows are illustrative assumptions.',
};

/** Fixed demo "today". Business data never reads the system clock. */
export const DEMO_TODAY = new Date(Date.UTC(2026, 8, 25)); // Fri 25 Sep 2026
export const W1_START = new Date(Date.UTC(2026, 8, 28)); // Mon 28 Sep 2026
export const WEEKS = 13;
