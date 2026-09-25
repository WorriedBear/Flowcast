import type { Category, Ccy, EntityId, LineItem, SourceSystem } from './types';

/**
 * Seed line items for the 13-week horizon (W1 = week of Mon 28 Sep 2026).
 * Every figure is an illustrative assumption for the fictional Solace Living Inc.
 */
const items: LineItem[] = [];
let seq = 0;
function add(
  entity: EntityId, week: number, category: Category, amountLocal: number, currency: Ccy,
  sourceSystem: SourceSystem, memo: string, counterparty?: string, confidence = 0.92,
) {
  seq += 1;
  items.push({ id: `LI-${String(seq).padStart(4, '0')}`, entity, week, category, amountLocal, currency, sourceSystem, memo, counterparty, confidence });
}
const weeks = (from = 1, to = 13) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/* ---------------- US parent (USD) ---------------- */
// Shopify / Amazon / D2C payouts, net of fees, from IES Commerce.
export const US_COMMERCE_PAYOUTS = [2_552_000, 1_164_000, 1_572_000, 752_000, 1_963_000, 627_000, 1_118_000, 1_731_000, 1_674_000, 3_313_000, 1_673_000, 1_001_000, 1_110_000];
const channels: [string, number][] = [['Shopify Payments', 0.52], ['Amazon Seller Central', 0.31], ['Wayfair Partner', 0.17]];
weeks().forEach((w) => {
  channels.forEach(([cp, share]) => add('US', w, 'commerce_payouts', Math.round(US_COMMERCE_PAYOUTS[w - 1] * share), 'USD', 'IES Commerce', `Weekly marketplace payout`, cp, 0.9));
});
// Wholesale AR (US retailers)
const usWholesale: [number, number, string][] = [
  [1, 420_000, 'Crate Row Stores'], [2, 380_000, 'Hearth & Oak'], [3, 910_000, 'Crate Row Stores'], [4, 350_000, 'Pineline Home'],
  [5, 520_000, 'Hearth & Oak'], [6, 60_000, 'Pineline Home'], [7, 90_000, 'Crate Row Stores'], [8, 1_150_000, 'Hearth & Oak'],
  [9, 480_000, 'Pineline Home'], [10, 1_380_000, 'Crate Row Stores'], [11, 450_000, 'Hearth & Oak'], [12, 390_000, 'Pineline Home'], [13, 760_000, 'Crate Row Stores'],
];
usWholesale.forEach(([w, a, cp]) => add('US', w, 'ar_collections', a, 'USD', 'IES Accounting', 'Wholesale invoice collections', cp, 0.86));
// Payroll: biweekly
[1, 3, 5, 7, 9, 11, 13].forEach((w) => add('US', w, 'payroll', -1_180_000, 'USD', 'IES Payroll', 'Biweekly payroll (310 employees)', 'IES Payroll run', 0.99));
// AP suppliers weekly
weeks().forEach((w) => add('US', w, 'ap_suppliers', -640_000, 'USD', 'IES Accounting', 'Scheduled supplier bills', 'Domestic suppliers (42 vendors)', 0.93));
// Large supplier AP run W7
add('US', 7, 'ap_suppliers', -1_450_000, 'USD', 'IES Accounting', 'Quarterly inventory AP run', 'Northfield Textiles', 0.95);
add('US', 7, 'ap_suppliers', -620_000, 'USD', 'IES Accounting', 'Quarterly inventory AP run', 'Ridgeway Ceramics', 0.95);
// Rent monthly
[1, 5, 10].forEach((w) => add('US', w, 'rent', -310_000, 'USD', 'IES Accounting', 'Austin HQ + Dallas DC lease', 'Crescent Realty', 0.99));
add('US', 4, 'tax', -1_200_000, 'USD', 'IES Accounting', 'State sales tax remittance, Q3', 'Texas Comptroller', 0.98);
add('US', 4, 'other', -1_000_000, 'USD', 'IES Accounting', 'Annual commercial insurance premium', 'Lonestar Mutual', 0.97);
add('US', 12, 'payroll', -900_000, 'USD', 'IES Payroll', 'Holiday bonus run', 'IES Payroll run', 0.95);
// Estimated tax Q4 (Dec 15)
add('US', 12, 'tax', -1_050_000, 'USD', 'IES Accounting', 'Federal estimated tax, Q4', 'IRS', 0.97);
// SaaS & other
weeks().forEach((w) => add('US', w, 'other', -95_000, 'USD', 'Bank feed', 'Card spend, SaaS, utilities', 'Various', 0.8));
// EUR-denominated component purchases from EU suppliers
[[2, -500_000], [6, -500_000], [10, -500_000]].forEach(([w, a]) => add('US', w, 'ap_suppliers', a, 'EUR', 'IES Accounting', 'EU component supplier (invoiced in EUR)', 'Keller Formteile GmbH', 0.94));
// MXN-denominated wholesale sales into Mexico
[[5, 7_000_000], [13, 7_000_000]].forEach(([w, a]) => add('US', w, 'wholesale_receipts', a, 'MXN', 'IES Accounting', 'Wholesale receipts, Mexican retail partner (MXN)', 'Casa Alameda', 0.85));
// Intercompany funding to MX (USD legs on both sides)
[[3, 800_000], [8, 1_500_000], [11, 1_100_000], [13, 300_000]].forEach(([w, a]) => add('US', w, 'intercompany', -a, 'USD', 'IES Accounting', 'Intercompany funding to Solace Manufactura', 'Solace Manufactura', 0.99));
// Marketplace: ShipSignal freight surcharge signals (seeded as installed)
[[5, -140_000], [8, -180_000], [12, -120_000]].forEach(([w, a]) => add('US', w, 'ap_suppliers', a, 'USD', 'Marketplace: ShipSignal', 'Freight surcharge forecast (peak season)', 'Ocean freight carriers', 0.78));

/* ---------------- UK (GBP) ---------------- */
const ukRetail = [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.55];
weeks().forEach((w) => add('UK', w, 'commerce_payouts', ukRetail[w - 1] * 1e6, 'GBP', 'IES Commerce', 'UK web + store receipts', 'Stripe UK', 0.9));
weeks().forEach((w) => add('UK', w, 'ap_suppliers', -200_000, 'GBP', 'IES Accounting', 'UK supplier bills', 'UK suppliers (18 vendors)', 0.93));
[2, 6, 10].forEach((w) => add('UK', w, 'payroll', -950_000, 'GBP', 'IES Payroll', 'Monthly payroll (95 employees)', 'IES Payroll run', 0.99));
add('UK', 6, 'tax', -900_000, 'GBP', 'IES Accounting', 'Quarterly VAT return', 'HMRC', 0.98);
[1, 5, 9].forEach((w) => add('UK', w, 'rent', -120_000, 'GBP', 'IES Accounting', 'Manchester showroom + warehouse lease', 'Albion Estates', 0.99));
add('UK', 7, 'wholesale_receipts', 450_000, 'GBP', 'IES Accounting', 'Wholesale collection', 'Harrow & Lane', 0.84);

/* ---------------- DE (EUR) ---------------- */
weeks().forEach((w) => add('DE', w, 'wholesale_receipts', 300_000, 'EUR', 'IES Accounting', 'EU distributor collections', 'EU distributors (11 accounts)', 0.88));
// Overdue Maison Nord invoices, expected W8 after reminders (lower confidence)
[['INV-40718', 240_000], ['INV-40752', 205_000], ['INV-40790', 165_000]].forEach(([inv, a]) =>
  add('DE', 8, 'ar_collections', a as number, 'EUR', 'IES Accounting', `Overdue invoice ${inv}`, 'Maison Nord', 0.62));
add('DE', 11, 'wholesale_receipts', 4_800_000, 'EUR', 'IES Accounting', 'Holiday wholesale order, net 60', 'Maison Nord', 0.9);
weeks().forEach((w) => add('DE', w, 'ap_suppliers', -300_000, 'EUR', 'IES Accounting', 'EU logistics and supplier bills', 'EU suppliers (23 vendors)', 0.93));
[1, 5, 10].forEach((w) => add('DE', w, 'payroll', -450_000, 'EUR', 'IES Payroll', 'Monthly payroll (60 employees)', 'IES Payroll run', 0.99));
[1, 5, 10].forEach((w) => add('DE', w, 'rent', -80_000, 'EUR', 'IES Accounting', 'Hamburg DC lease', 'Hafen Logistikpark', 0.99));
// GBP-denominated sales to UK department stores
[[4, 150_000], [9, 150_000]].forEach(([w, a]) => add('DE', w, 'wholesale_receipts', a, 'GBP', 'IES Accounting', 'UK department store order (GBP)', 'Whitcombe & Sons', 0.86));

/* ---------------- MX (MXN) ---------------- */
weeks().forEach((w) => add('MX', w, 'payroll', -700_000, 'MXN', 'IES Payroll', 'Weekly plant payroll (120 employees)', 'IES Payroll run', 0.99));
weeks().forEach((w) => add('MX', w, 'ap_suppliers', -4_300_000, 'MXN', 'IES Accounting', 'Local suppliers and utilities', 'Proveedores locales', 0.92));
[1, 5, 10].forEach((w) => add('MX', w, 'rent', -1_300_000, 'MXN', 'IES Accounting', 'Monterrey plant lease', 'Parque Industrial Norte', 0.99));
add('MX', 9, 'ap_suppliers', -42_000_000, 'MXN', 'IES Accounting', 'Raw-materials prepayment (holiday production)', 'Maderas del Bajío', 0.95);
[[3, 800_000], [8, 1_500_000], [11, 1_100_000], [13, 300_000]].forEach(([w, a]) => add('MX', w, 'intercompany', a, 'USD', 'IES Accounting', 'Intercompany funding from parent', 'Solace Living Inc.', 0.99));

/* ---------------- IN (INR) ---------------- */
add('IN', 1, 'payroll', -32_000_000, 'INR', 'IES Payroll', 'Monthly payroll (41 employees)', 'IES Payroll run', 0.99);
[5, 10].forEach((w) => add('IN', w, 'payroll', -34_880_000, 'INR', 'IES Payroll', 'Monthly payroll (55 employees, incl. 14 new hires)', 'IES Payroll run', 0.97));
weeks().forEach((w) => add('IN', w, 'ap_suppliers', -800_000, 'INR', 'IES Accounting', 'Vendors, contractors and utilities', 'Local vendors', 0.9));
[1, 5, 10].forEach((w) => add('IN', w, 'rent', -2_100_000, 'INR', 'IES Accounting', 'Bengaluru studio lease', 'Prestige Tech Park', 0.99));
[3, 12].forEach((w) => add('IN', w, 'tax', -800_000, 'INR', 'IES Accounting', 'GST and TDS remittance', 'Income Tax Dept / GSTN', 0.97));

export const SEED_ITEMS: LineItem[] = items;

/** RevForecast for DTC signal items: added only when that agent is live, installed and fully scoped. */
export const REVFORECAST_ITEMS: LineItem[] = [
  [9, 140_000], [10, 260_000], [11, 310_000], [12, 220_000],
].map(([w, a], i) => ({
  id: `RF-${i + 1}`, entity: 'US', week: w, category: 'commerce_payouts', amountLocal: a, currency: 'USD',
  sourceSystem: 'Marketplace: RevForecast', memo: 'Holiday DTC payout uplift (seasonality signal)', counterparty: 'Shopify Payments', confidence: 0.8,
}));
