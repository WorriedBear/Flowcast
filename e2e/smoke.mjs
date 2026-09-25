// Smoke test (Part 0-A QA): visits every kept route, asserts no console errors, no links to
// non-kept routes, initial interaction IDs present, and no horizontal scroll at 390px.
// Then runs the two core round-trips (escalation and publish flywheel).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 4179;
const BASE = `http://localhost:${PORT}`;
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));
const KEPT = [/^\/$/, /^\/app$/, /^\/app\/ask$/, /^\/app\/scenarios$/, /^\/app\/fx$/, /^\/app\/approvals$/, /^\/app\/marketplace$/, /^\/app\/marketplace\/[\w-]+$/, /^\/app\/trust$/,
  /^\/dev$/, /^\/dev\/start$/, /^\/dev\/api$/, /^\/dev\/api\/[\w-]+$/, /^\/dev\/build$/, /^\/dev\/publish$/, /^\/advisor$/, /^\/strategy$/, /^\/research$/, /^\/ai-process$/, /^\/about$/, /^\/build-spec\.md$/];
const ROUTES = ['/', '/app', '/app/ask', '/app/scenarios', '/app/fx', '/app/approvals', '/app/marketplace', '/app/marketplace/shipsignal', '/app/marketplace/hedgeloop', '/app/trust', '/dev', '/dev/start', '/dev/api', '/dev/api/forecast', '/dev/build', '/dev/publish', '/advisor', '/strategy', '/research', '/ai-process', '/about', '/no-such-page'];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const fails = [];
const fail = (m) => { fails.push(m); console.error('FAIL', m); };
try {
  for (let i = 0; i < 40; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
  const { INTERACTIONS } = await import('../dist-qa/interactions.js').catch(() => ({ INTERACTIONS: null }));
  const browser = await chromium.launch({ executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let route = '';
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location()?.url ?? ''))) fail(`${route}: console error: ${m.text()}`); });
  page.on('pageerror', (e) => fail(`${route}: page error: ${e.message}`));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());

  for (route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) {
      if (!h || /^(https?:|mailto:)/.test(h)) continue;
      if (h.startsWith('#')) continue;
      const path = h.split(/[?#]/)[0];
      if (!KEPT.some((re) => re.test(path))) fail(`${route}: link to non-kept route ${h}`);
    }
    const unnamed = await page.$$eval('button', (bs) => bs.filter((b) => b.offsetParent !== null && !(b.getAttribute('aria-label') || b.textContent.trim() || b.getAttribute('title'))).length);
    if (unnamed) fail(`${route}: ${unnamed} visible button(s) without an accessible name`);
    if (INTERACTIONS) for (const it of INTERACTIONS.filter((x) => x.initial && x.route === route)) {
      if (!(await page.$(`[data-action="${it.id}"]`))) fail(`${route}: missing data-action ${it.id} (${it.element})`);
    }
    const title = await page.title();
    if (!title.startsWith('FlowCast · ')) fail(`${route}: bad document.title "${title}"`);
  }

  // Mobile: no horizontal scroll on key pages
  await page.setViewportSize({ width: 390, height: 844 });
  for (route of ['/', '/app', '/app/scenarios', '/app/fx', '/dev/build', '/strategy']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) fail(`${route}: horizontal scroll of ${over}px at 390px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Flow: scenario breach
  route = 'flow:scenario';
  await page.goto(BASE + '/app/scenarios', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Mexico expansion' }).click();
  await page.waitForTimeout(300);
  if (!(await page.getByText(/Policy breach in W7/).count())) fail('Mexico preset does not show the breach banner');
  await page.locator('[data-tour="capex-week"]').selectOption('11');
  await page.waitForTimeout(300);
  if (!(await page.getByText(/Within policy/).count())) fail('Moving capex to W11 does not clear the breach');

  // Flow: escalation round-trip
  route = 'flow:escalation';
  await page.goto(BASE + '/app/fx', { waitUntil: 'networkidle' });
  await page.locator('[data-tour="approve-REC-2"]').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Use suggested note' }).click();
  await page.locator('[data-tour="escalate-submit"]').click();
  await page.waitForURL(/approvals/);
  await page.goto(BASE + '/advisor', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Solace Living/ }).first().click();
  await page.getByRole('button', { name: 'Use suggested response' }).click();
  await page.getByRole('button', { name: 'Send response' }).click();
  await page.getByRole('button', { name: 'Switch to CFO to see result' }).click();
  await page.waitForURL(/approvals/);
  await page.waitForTimeout(300);
  if (!(await page.getByText(/Forward-hedge 55%/).count())) fail('Advisor 55% response did not return to CFO approvals');
  await page.locator('[data-tour="approve-REC-2"]').click();
  await page.waitForTimeout(300);
  if (!(await page.getByText('Hedge approved').count())) fail('Expert-reviewed REC-2 could not be approved');

  // Flow: publish flywheel
  route = 'flow:publish';
  await page.goto(BASE + '/app/marketplace', { waitUntil: 'networkidle' });
  if (await page.getByText('RevForecast for DTC').count()) fail('RevForecast visible in catalog before publish');
  await page.goto(BASE + '/dev/start', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign in with Intuit' }).click();
  await page.getByLabel('Workspace name').fill('northbeam-labs');
  await page.getByLabel('Use case').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Provision sandbox' }).click();
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await page.goto(BASE + '/dev/build', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Run evals' }).click();
  await page.waitForTimeout(1800);
  if (!(await page.getByText('47/50').count())) fail('First eval run is not 47/50');
  await page.getByRole('button', { name: 'Apply suggested fixes' }).click();
  await page.getByRole('button', { name: 'Run evals' }).click();
  await page.waitForTimeout(1800);
  if (!(await page.getByText('50/50').count())) fail('Eval run after fixes is not 50/50');
  await page.goto(BASE + '/dev/publish', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Fill with Northbeam details' }).click();
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await page.waitForTimeout(6000);
  await page.getByRole('button', { name: 'See it as a customer' }).click();
  await page.waitForURL(/revforecast/);
  await page.getByRole('button', { name: 'Install', exact: true }).click();
  for (const cb of await page.getByRole('dialog').getByRole('checkbox').all()) await cb.check();
  await page.getByRole('button', { name: 'Install agent' }).click();
  await page.waitForTimeout(300);
  await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Marketplace: ShipSignal' }).waitFor({ timeout: 3000 }).catch(() => {});
  const low = await page.evaluate(() => JSON.parse(localStorage.getItem('flowcast-v1')).state.customer.installedAgents);
  if (!low.includes('revforecast')) fail('RevForecast not installed after publish flywheel');

  await browser.close();
} catch (e) {
  fail(`smoke crashed: ${e.message.split('\n')[0]}`);
} finally {
  server.kill();
}
if (fails.length) { console.error(`\nsmoke: ${fails.length} failure(s)`); process.exit(1); }
process.stdout.write('smoke: all kept routes and flows passed.\n');
process.exit(0);
