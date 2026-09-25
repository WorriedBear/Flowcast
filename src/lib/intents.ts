export type IntentId = 'fx_shock' | 'afford_capex' | 'uk_gap' | 'low_point' | 'hedge_eur' | 'collections' | 'board_summary' | 'policy';

export const INTENTS: { id: IntentId; label: string; question: string; keywords: [string, number][] }[] = [
  { id: 'fx_shock', label: 'FX shock', question: 'What if EUR weakens 5%?', keywords: [['what if', 0.2], ['weaken', 0.4], ['strengthen', 0.4], ['moves', 0.2], ['drop', 0.25], ['falls', 0.25], ['rises', 0.25], ['shock', 0.4], ['%', 0.25], ['percent', 0.25], ['eur', 0.15], ['gbp', 0.15], ['mxn', 0.15], ['inr', 0.15], ['euro', 0.15], ['pound', 0.15], ['peso', 0.15], ['rupee', 0.15], ['devalue', 0.4]] },
  { id: 'afford_capex', label: 'Afford capex', question: 'Can we afford $3.5M capex in week 7?', keywords: [['afford', 0.5], ['capex', 0.5], ['spend', 0.25], ['purchase', 0.25], ['investment', 0.3], ['buy', 0.2], ['week', 0.1], ['expansion', 0.3], ['$', 0.1], ['million', 0.1]] },
  { id: 'uk_gap', label: 'UK gap', question: 'Why is the UK short in week 6?', keywords: [['uk', 0.35], ['gbp', 0.15], ['britain', 0.3], ['gap', 0.35], ['short', 0.2], ['negative', 0.25], ['payroll', 0.1], ['vat', 0.3], ['w6', 0.2], ['week 6', 0.2]] },
  { id: 'low_point', label: 'Low point', question: 'Why is week 7 the low point?', keywords: [['low point', 0.6], ['lowest', 0.5], ['low', 0.3], ['minimum', 0.4], ['trough', 0.5], ['w7', 0.2], ['week 7', 0.2], ['dip', 0.35], ['why', 0.1]] },
  { id: 'hedge_eur', label: 'Hedge EUR', question: 'Should we hedge the EUR exposure?', keywords: [['hedge', 0.55], ['forward', 0.35], ['cover', 0.2], ['eur', 0.15], ['euro', 0.15], ['exposure', 0.25], ['protect', 0.25], ['lock', 0.2]] },
  { id: 'collections', label: 'Collections', question: 'Which invoices are overdue?', keywords: [['overdue', 0.55], ['collection', 0.5], ['invoice', 0.4], ['receivable', 0.4], ['ar', 0.2], ['late', 0.3], ['remind', 0.35], ['maison nord', 0.3], ['chase', 0.35], ['dso', 0.3]] },
  { id: 'board_summary', label: 'Board summary', question: 'Write a board summary of our cash position', keywords: [['board', 0.55], ['summary', 0.45], ['summarize', 0.45], ['update', 0.2], ['brief', 0.25], ['investors', 0.3], ['recap', 0.35], ['overview', 0.3]] },
  { id: 'policy', label: 'Policy', question: 'What is our treasury policy?', keywords: [['policy', 0.55], ['threshold', 0.4], ['band', 0.3], ['minimum cash', 0.4], ['rules', 0.3], ['limit', 0.3], ['allowed', 0.25], ['guardrail', 0.3]] },
];

export const THRESHOLD = 0.45;
export const normalize = (t: string) => ` ${t.toLowerCase().replace(/[^a-z0-9$%. ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;

export function scoreIntents(text: string) {
  const n = normalize(text);
  return INTENTS.map((it) => {
    let s = 0;
    for (const [kw, w] of it.keywords) {
      const hit = kw.length <= 3 && /^[a-z0-9]+$/.test(kw) ? new RegExp(`\\b${kw}\\b`).test(n) : n.includes(kw);
      if (hit) s += w;
    }
    return { id: it.id, score: Math.min(1, s) };
  }).sort((a, b) => b.score - a.score);
}

export function matchIntent(text: string): IntentId | null {
  const [best] = scoreIntents(text);
  return best && best.score >= THRESHOLD ? best.id : null;
}

export const DOMAIN_WORDS = ['cash', 'fx', 'currency', 'forecast', 'week', 'entity', 'hedge', 'approval', 'payroll', 'invoice', 'policy', 'eur', 'gbp', 'mxn', 'inr', 'uk', 'mexico', 'india', 'runway', 'money', 'balance'];
export const isInDomain = (text: string) => { const n = normalize(text); return DOMAIN_WORDS.some((w) => n.includes(w)) || scoreIntents(text)[0].score > 0.15; };

/** Parse amounts like $3.5M, 3500000, 3.5 million, 750k. */
export function parseAmount(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, '');
  const m = /\$?\s*(\d+(?:\.\d+)?)\s*(m\b|mm\b|million|k\b|thousand|b\b|billion)?/.exec(t.replace(/week\s*\d+|w\d+|\d+\s*%/g, ' '));
  if (!m) return null;
  const v = parseFloat(m[1]);
  const u = m[2] ?? '';
  if (u.startsWith('m')) return v * 1e6;
  if (u.startsWith('k') || u.startsWith('t')) return v * 1e3;
  if (u.startsWith('b')) return v * 1e9;
  return v >= 1000 ? v : null;
}
export function parseWeek(text: string): number | null {
  const m = /(?:week|wk|w)\s*(\d{1,2})\b/i.exec(text);
  const w = m ? Number(m[1]) : NaN;
  return w >= 1 && w <= 13 ? w : null;
}
export function parseFx(text: string): { ccy: 'EUR' | 'GBP' | 'MXN' | 'INR'; pct: number } {
  const n = text.toLowerCase();
  const ccy = /gbp|pound|sterling/.test(n) ? 'GBP' : /mxn|peso/.test(n) ? 'MXN' : /inr|rupee/.test(n) ? 'INR' : 'EUR';
  const m = /([+-]?\d+(?:\.\d+)?)\s*%/.exec(n);
  let pct = m ? Math.abs(parseFloat(m[1])) : 5;
  const down = /weaken|drop|fall|down|devalue|decline|lose|loses|-\d/.test(n);
  const up = /strengthen|rise|rises|up\b|gain|appreciat|\+\d/.test(n);
  if (down || !up) pct = -pct;
  return { ccy, pct: Math.max(-10, Math.min(10, pct)) };
}
