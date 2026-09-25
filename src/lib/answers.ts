import { BASE_RATES } from '../data/rates';
import { EXPERTS } from '../data/experts';
import { SEED_ITEMS } from '../data/flows';
import { BASE_SCENARIO, buildForecast } from './forecast';
import { computeAll, type CustomerCore } from './derive';
import { money, pct, usdM, weekLong } from './format';
import { INTENTS, isInDomain, matchIntent, parseAmount, parseFx, parseWeek, scoreIntents, type IntentId } from './intents';
import { sensitivity } from './fx';

export type AnswerAction =
  | { kind: 'open_scenario'; label: string; patch: Record<string, unknown> }
  | { kind: 'approve_rec'; label: string; recId: string }
  | { kind: 'escalate_rec'; label: string; recId: string }
  | { kind: 'navigate'; label: string; to: string }
  | { kind: 'drafts'; label: string }
  | { kind: 'copy'; label: string; text: string }
  | { kind: 'ask'; label: string; text: string };

export interface Answer {
  intent: IntentId | 'clarify' | 'out_of_domain' | 'abstain';
  thinking: string[];
  text: string;
  sources: string[];
  confidence: number;
  viz?: { type: 'table'; head: string[]; rows: string[][] } | { type: 'bars'; rows: { label: string; value: number }[] };
  actions: AnswerAction[];
  autonomy: string;
  disclaimer?: string;
}

export const HEDGE_DISCLAIMER = 'Decision support, not financial advice. Execution happens only through a licensed partner after your approval.';

export function confidenceFor(horizonWeeks: number, dependsOnUninstalled = false) {
  let c = 0.9 - Math.max(0, horizonWeeks - 4) * 0.02;
  if (dependsOnUninstalled) c -= 0.1;
  return Math.round(c * 100) / 100;
}

export const OVERDUE = [
  { inv: 'INV-40718', customer: 'Maison Nord', eur: 240_000, days: 31 },
  { inv: 'INV-40752', customer: 'Maison Nord', eur: 205_000, days: 19 },
  { inv: 'INV-40790', customer: 'Maison Nord', eur: 165_000, days: 12 },
];
export const DRAFTS = OVERDUE.map((o) => ({
  inv: o.inv,
  subject: `Reminder: ${o.inv} (€${o.eur.toLocaleString('en-US')}) is ${o.days} days past due`,
  body: `Bonjour,\n\nOur records show invoice ${o.inv} for €${o.eur.toLocaleString('en-US')} is ${o.days} days past its due date. Could you confirm the expected payment date? Remittance details are unchanged.\n\nMerci,\nAccounts Receivable, Solace GmbH`,
}));

export function buildAnswer(text: string, c: CustomerCore): Answer {
  const intent = matchIntent(text);
  const { items, base, recs, exposures: ex } = computeAll(c);
  const low = base.low;
  const policy = c.policy;
  const itemCount = items.length.toLocaleString('en-US');
  const steps = (...s: string[]) => [`Pulled ${itemCount} line items across 5 entities`, ...s];

  if (!intent) {
    const top = scoreIntents(text).slice(0, 3).map((s) => INTENTS.find((i) => i.id === s.id)!);
    const inDomain = isInDomain(text);
    return {
      intent: inDomain ? 'clarify' : 'out_of_domain',
      thinking: ['Matched your question against 8 supported intents', inDomain ? 'No intent reached the 0.45 match threshold' : 'Question is outside cash, currency and approvals'],
      text: inDomain
        ? `I want to be sure I answer the right question. Did you mean one of these?`
        : `I only work with Solace Living's cash, currency, and approvals data. Try one of these instead:`,
      sources: [], confidence: 1, autonomy: 'I can answer these from your IES data.',
      actions: top.map((t) => ({ kind: 'ask', label: t.question, text: t.question })),
    };
  }

  switch (intent) {
    case 'fx_shock': {
      const { ccy, pct: p } = parseFx(text);
      const shocked = buildForecast(items, { ...BASE_SCENARIO, fx: { ...BASE_SCENARIO.fx, [ccy]: p } });
      const d13 = shocked.weeks[12].closing - base.weeks[12].closing;
      const dLow = shocked.low.value - low.value;
      const exp = ex.find((e) => e.ccy === ccy)!;
      const rows = [-10, -5, -1, 1, 5, 10].map((m) => ({ label: `${m > 0 ? '+' : ''}${m}%`, value: sensitivity(items, ccy, m) }));
      return {
        intent, thinking: steps('Converted at today’s rate table', `Re-ran the 13-week forecast with ${ccy} ${pct(p, 1, true)}`, 'Checked the new low point against your minimum-cash policy'),
        text: `If ${ccy} moves ${pct(p, 1, true)} against the dollar, 13-week closing cash changes by ${money(d13, 'USD', { signed: true })} (to ${usdM(shocked.weeks[12].closing)}). The low point moves by ${money(dLow, 'USD', { signed: true })} to ${usdM(shocked.low.value)} in W${shocked.low.week}, ${shocked.low.value >= policy.minCash ? `still ${usdM(shocked.low.value - policy.minCash)} above` : `${usdM(policy.minCash - shocked.low.value)} below`} your ${usdM(policy.minCash, 0)} floor. Your net ${ccy} position is ${exp.net >= 0 ? 'long' : 'short'} ${money(exp.net, ccy)} plus balances held in ${ccy}, so ${exp.net >= 0 ? 'a weaker' : 'a stronger'} ${ccy} hurts.`,
        sources: ['Rate table', 'IES Accounting', 'IES Payroll'], confidence: confidenceFor(13),
        viz: { type: 'bars', rows }, autonomy: 'I can model this; you decide what to do.',
        actions: [{ kind: 'open_scenario', label: 'Open in Scenario Lab', patch: { fx: { ...BASE_SCENARIO.fx, [ccy]: p } } }],
      };
    }
    case 'afford_capex': {
      const amt = parseAmount(text) ?? 3_500_000;
      const wk = parseWeek(text) ?? 7;
      const f = buildForecast(items, { ...BASE_SCENARIO, capexAmount: amt, capexWeek: wk });
      const breach = f.low.value < policy.minCash;
      let safe: number | null = null;
      for (let w = 1; w <= 13; w++) { const g = buildForecast(items, { ...BASE_SCENARIO, capexAmount: amt, capexWeek: w }); if (g.low.value >= policy.minCash) { safe = w; if (w >= wk) break; } }
      let earliestAfter: number | null = null;
      for (let w = wk; w <= 13; w++) { const g = buildForecast(items, { ...BASE_SCENARIO, capexAmount: amt, capexWeek: w }); if (g.low.value >= policy.minCash) { earliestAfter = w; break; } }
      const suggestion = earliestAfter ?? safe;
      return {
        intent, thinking: steps(`Added a ${money(amt)} capex outflow in W${wk}`, 'Recomputed the 13-week runway', 'Checked against your minimum-cash policy'),
        text: breach
          ? `Not in W${wk}. A ${money(amt)} outflow that week takes the low to ${usdM(f.low.value)} in W${f.low.week}, which breaches your ${usdM(policy.minCash, 0)} minimum by ${usdM(policy.minCash - f.low.value, 2)}. ${suggestion ? `The earliest safe week is W${suggestion}: the low then stays at ${usdM(buildForecast(items, { ...BASE_SCENARIO, capexAmount: amt, capexWeek: suggestion }).low.value)}.` : 'No week in the horizon keeps you above policy; consider financing or splitting the payment.'}`
          : `Yes. With ${money(amt)} in W${wk}, the low is ${usdM(f.low.value)} in W${f.low.week}, ${usdM(f.low.value - policy.minCash)} above your ${usdM(policy.minCash, 0)} minimum.`,
        sources: ['IES Accounting', 'IES Payroll', 'IES Commerce'], confidence: confidenceFor(13),
        autonomy: 'I can model it; spending needs your approval.',
        actions: [
          { kind: 'open_scenario', label: 'Model it', patch: { capexAmount: amt, capexWeek: breach && suggestion ? wk : wk } },
          { kind: 'escalate_rec', label: 'Ask an expert', recId: 'REC-2' },
        ],
      };
    }
    case 'uk_gap': {
      const uk = base.entities.find((e) => e.id === 'UK')!;
      const r1 = recs.find((r) => r.id === 'REC-1')!;
      const resolved = r1.state.status === 'approved' || r1.state.status === 'executed';
      const w6 = items.filter((i) => i.entity === 'UK' && i.week === 6 && i.amountLocal < 0);
      return {
        intent, thinking: steps('Rolled forward the UK entity balance in GBP', 'Matched W6 outflows to IES Payroll and the VAT calendar', 'Checked REC-1 status in approvals'),
        text: resolved
          ? `The UK gap is resolved. REC-1 moved €720K from Solace GmbH in W5, so Solace UK closes W6 at ${money(uk.closingLocal[5], 'GBP')}. Consolidated cash was never at risk; this was a local-currency funding gap.`
          : `Solace UK closes W6 at ${money(uk.closingLocal[5], 'GBP')} because monthly payroll (£950K) and the quarterly VAT return (£900K) land in the same week. Consolidated cash is fine at ${usdM(base.weeks[5].closing)}, so this is a local funding gap. REC-1 moves €720K from DE in W5 and lifts W6 to about +£0.28M.`,
        sources: ['IES Payroll', 'IES Accounting', 'Bank feed'], confidence: confidenceFor(6),
        viz: { type: 'table', head: ['Item', 'Amount'], rows: w6.map((i) => [i.memo, money(i.amountLocal, 'GBP')]) },
        autonomy: 'I can prepare this transfer; you approve.',
        actions: resolved ? [{ kind: 'navigate', label: 'View approvals', to: '/app/approvals' }] : [{ kind: 'approve_rec', label: 'Approve REC-1', recId: 'REC-1' }],
      };
    }
    case 'low_point': {
      const w = low.week;
      const out = items.filter((i) => i.week === w && i.amountLocal < 0 && i.category !== 'intercompany');
      const byCat = new Map<string, number>();
      out.forEach((i) => byCat.set(i.memo, (byCat.get(i.memo) ?? 0) + i.amountLocal * BASE_RATES[i.currency]));
      const top = [...byCat.entries()].sort((a, b) => a[1] - b[1]).slice(0, 3);
      return {
        intent, thinking: steps('Found the minimum of the 13-week consolidated series', `Ranked W${w} outflows by USD size`),
        text: `The low is ${usdM(low.value)} in ${weekLong(w)}, ${usdM(low.value - policy.minCash)} above your minimum. The top three drivers that week: ${top.map(([m, v]) => `${m.toLowerCase()} (${money(v)})`).join('; ')}. Cash recovers in W8 as holiday wholesale collections arrive.`,
        sources: ['IES Payroll', 'IES Accounting'], confidence: confidenceFor(w),
        viz: { type: 'table', head: ['Driver', 'USD'], rows: top.map(([m, v]) => [m, money(v)]) },
        autonomy: 'Insight only; nothing to approve.',
        actions: [{ kind: 'navigate', label: 'Open Scenario Lab', to: '/app/scenarios' }],
      };
    }
    case 'hedge_eur': {
      const r2 = recs.find((r) => r.id === 'REC-2')!;
      const h = r2.hedge!;
      return {
        intent, thinking: steps('Computed net 13-week EUR exposure from line items', 'Built a hedge proposal inside your policy band', 'Checked against your hedge policy'),
        text: `Your net 13-week EUR position is long €${(Math.abs(ex.find((e) => e.ccy === 'EUR')!.net) / 1e6).toFixed(2)}M, mostly the Maison Nord receipt in W11. REC-2 proposes a ${h.ratio}% forward (≈€${(h.notionalLocal / 1e6).toFixed(2)}M, ${h.tenor}), inside your ${policy.hedgeBandMin}–${policy.hedgeBandMax}% band. Because the notional (${money(h.notionalUSD)}) is at or above your ${money(policy.approvalThresholdUSD)} threshold, policy routes it to an expert before you approve. Current status: ${r2.state.status}.`,
        sources: ['IES Accounting', 'Rate table'], confidence: confidenceFor(11),
        disclaimer: HEDGE_DISCLAIMER, autonomy: 'I can prepare this; an expert reviews and you approve.',
        actions: r2.state.status === 'open' ? [{ kind: 'escalate_rec', label: 'Escalate to expert', recId: 'REC-2' }] : [{ kind: 'navigate', label: 'View in approvals', to: '/app/approvals' }],
      };
    }
    case 'collections': {
      return {
        intent, thinking: steps('Filtered AR to invoices past due', 'Converted at today’s rate table'),
        text: `Three Maison Nord invoices totaling €610K (${money(610_000 * BASE_RATES.EUR)}) are overdue by 12–31 days. They are forecast for W8 at 62% confidence. Reminders would raise that confidence; I can draft them now, and you send them.`,
        sources: ['IES Accounting'], confidence: confidenceFor(8),
        viz: { type: 'table', head: ['Invoice', 'Customer', 'Amount', 'Days overdue'], rows: OVERDUE.map((o) => [o.inv, o.customer, money(o.eur, 'EUR'), String(o.days)]) },
        autonomy: 'Autonomous (drafts only): nothing is sent without you.',
        actions: [{ kind: 'drafts', label: 'Draft reminders' }],
      };
    }
    case 'board_summary': {
      const open = recs.filter((r) => r.visible && r.state.status === 'open').length;
      const uk = base.entities.find((e) => e.id === 'UK')!;
      const unhedged = ex.reduce((a, e) => a + Math.abs(e.netUSD), 0);
      const bullets = [
        `Consolidated cash is ${usdM(base.opening)} across 5 entities and 4 foreign currencies.`,
        `The 13-week low is ${usdM(low.value)} in W${low.week}, ${usdM(low.value - policy.minCash)} above the ${usdM(policy.minCash, 0)} policy floor.`,
        Math.min(...uk.closingLocal) < 0 ? `Solace UK has a local GBP gap in W6 (${money(uk.closingLocal[5], 'GBP')}); an intercompany transfer is proposed.` : 'The Solace UK W6 funding gap is closed by an approved intercompany transfer.',
        `Net unhedged FX exposure is ${usdM(unhedged)}; the largest is the MXN short, followed by the EUR long.`,
        `${open} recommendation${open === 1 ? '' : 's'} await approval; forecast accuracy (4-week MAPE) is 3.8% vs. 14% for the spreadsheet baseline.`,
      ];
      const md = `# Solace Living: cash & FX summary (week of 28 Sep 2026)\n\n${bullets.map((b) => `- ${b}`).join('\n')}\n\n_Prepared by FlowCast from IES data. Figures are deterministic engine outputs._`;
      return {
        intent, thinking: steps('Summarized the forecast, FX exposure and approvals', 'Checked every number against the engine output'),
        text: bullets.map((b) => `• ${b}`).join('\n'), sources: ['IES Accounting', 'IES Payroll', 'IES Commerce', 'Rate table'], confidence: confidenceFor(13),
        autonomy: 'Draft only; you decide what to share.', actions: [{ kind: 'copy', label: 'Copy', text: md }],
      };
    }
    case 'policy': {
      return {
        intent, thinking: ['Read your treasury policy from the Trust Center', 'Recomputed routes for open recommendations'],
        text: `Minimum consolidated cash: ${usdM(policy.minCash, 1)}. Hedge band: ${policy.hedgeBandMin}–${policy.hedgeBandMax}% of net forecast exposure. Expert review at or above ${money(policy.approvalThresholdUSD)} notional. Allowed instruments: ${policy.allowedInstruments.join(', ')}. Under this policy, ${recs.filter((r) => r.visible && r.policy.route === 'expert').length} open recommendation needs an expert and ${recs.filter((r) => r.visible && r.policy.route === 'approve').length} need your approval. Experts on call: ${EXPERTS.map((e) => e.name.split(',')[0]).join(', ')}.`,
        sources: ['Policy'], confidence: 0.99, autonomy: 'Only you can change policy.',
        actions: [{ kind: 'navigate', label: 'Edit policy', to: '/app/trust#policy' }],
      };
    }
  }
}

export function buildBrief(c: CustomerCore) {
  const { base, recs, exposures: ex } = computeAll(c);
  const uk = base.entities.find((e) => e.id === 'UK')!;
  const ukGap = Math.min(...uk.closingLocal) < 0;
  const unhedged = ex.reduce((a, e) => a + Math.abs(e.netUSD), 0);
  const pending = recs.filter((r) => r.visible && r.state.status === 'open' && r.policy.route !== 'auto').length;
  const escalated = recs.filter((r) => r.state.status === 'escalated').length;
  return `Consolidated cash is ${usdM(base.opening, 2)} across 5 entities. The 13-week low is ${usdM(base.low.value)} in W${base.low.week}, when US payroll and the quarterly supplier run coincide; that is ${usdM(base.low.value - c.policy.minCash)} above your minimum. ${ukGap ? `Solace UK goes to ${money(uk.closingLocal[5], 'GBP')} in W6 (payroll plus VAT) and needs funding; REC-1 closes it.` : 'The Solace UK W6 gap is closed by the approved DE → UK transfer.'} Net unhedged FX exposure is ${usdM(unhedged)}. ${pending} recommendation${pending === 1 ? '' : 's'} need${pending === 1 ? 's' : ''} your approval${escalated ? `, and ${escalated} ${escalated === 1 ? 'is' : 'are'} with an expert` : ''}.`;
}

export const SEED_ITEM_COUNT = SEED_ITEMS.length;
