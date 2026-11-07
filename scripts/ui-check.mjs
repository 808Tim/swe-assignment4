// UI checks in a real browser (Microsoft Edge via playwright-core), desktop 1280px and mobile 375px.
// Demonstrates filtering (successful / unsuccessful), room switching and availability checks.
// The build is served with `vite preview`; screenshots + log go to ../evidence/ui and ../evidence/06_ui_checks.md.
// Usage: npm run build && node scripts/ui-check.mjs
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, '..', 'evidence', 'ui');
mkdirSync(OUT, { recursive: true });
const PORT = 4179 + Math.floor(Math.random() * 500);

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true });
await new Promise((ok, fail) => {
  const t = setTimeout(() => fail(new Error('preview did not start')), 30000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); ok(); } });
});

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const rows = [];
const flat = (s) => s.replace(/\s*\n+\s*/g, ' ').trim();

async function fill(page, now, start, end) {
  await page.fill('#current-time', now);
  await page.fill('#start-time', start);
  await page.fill('#end-time', end);
  await page.click('text=Check availability');
}
const result = (page) => page.locator('section.mt-5').innerText().then(flat).catch(() => '(no result)');
const shownRooms = (page) =>
  page.locator('button[aria-pressed]').evaluateAll((els) => els.map((e) => e.querySelector('span.font-semibold').textContent));
const toggle = (page, item) => page.getByRole('checkbox', { name: item }).click();
async function reset(page) {
  await page.goto(`http://localhost:${PORT}/`);
}

for (const vp of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const step = async (id, action, expected, observed, pass) => {
    const shot = `${vp.name}_${id}.png`;
    await page.mouse.move(0, 0); // no hover styles in the screenshot
    await page.waitForTimeout(400); // let the card border transition finish
    await page.screenshot({ path: resolve(OUT, shot), fullPage: true });
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const fits = scrollW <= vp.width;
    rows.push({ id: `${id}-${vp.name}`, action, expected, observed: `${observed}; scrollWidth=${scrollW}`, pass: pass && fits, shot });
    console.log(`${pass && fits ? 'PASS' : 'FAIL'} ${id}-${vp.name} ${action} -> ${observed}`);
  };

  // U1 (AC1–AC5): default list, A101, 11:00–12:00 next to the 10:00–11:00 booking
  await reset(page);
  let rooms = await shownRooms(page);
  await fill(page, '540', '660', '720');
  let r = await result(page);
  await step('U1_available', 'No filters; Room A101, now 540, check 660–720', 'All 5 rooms listed; Available',
    `rooms: ${rooms.join(', ')}; result: ${r}`, rooms.length === 5 && r.startsWith('Available'));

  // U2 (F1 success, exact capacity)
  await reset(page);
  await page.fill('#attendees', '30');
  rooms = await shownRooms(page);
  await step('U2_capacity_exact', 'Attendees = 30', 'A101 (30 seats) and C303 (40) shown',
    `rooms: ${rooms.join(', ')}`, rooms.join() === 'Room A101,Room C303');

  // U3 (F1 unsuccessful, insufficient capacity)
  await page.fill('#attendees', '31');
  rooms = await shownRooms(page);
  await step('U3_capacity_insufficient', 'Attendees = 31', 'A101 hidden, only C303 shown',
    `rooms: ${rooms.join(', ')}`, rooms.join() === 'Room C303');

  // U4 (F2 success): all selected items required
  await reset(page);
  await toggle(page, 'Projector');
  await toggle(page, 'Computers');
  rooms = await shownRooms(page);
  await fill(page, '540', '660', '720');
  r = await result(page);
  await step('U4_equipment', 'Projector + Computers, check 660–720', 'Only E505 shown; Available',
    `rooms: ${rooms.join(', ')}; result: ${r}`, rooms.join() === 'Room E505' && r.startsWith('Available'));

  // U5 (F4): no match → empty state, button disabled
  await reset(page);
  await toggle(page, 'Computers');
  await toggle(page, 'Video conference');
  rooms = await shownRooms(page);
  const empty = await page.isVisible('text=No rooms match');
  const disabled = await page.locator('button:has-text("Check availability")').isDisabled();
  await step('U5_empty_state', 'Computers + Video conference', 'Empty state "No rooms match", check button disabled',
    `rooms: ${rooms.length}; empty state: ${empty}; button disabled: ${disabled}`, rooms.length === 0 && empty && disabled);

  // U6 (F3): only match is blocked
  await reset(page);
  await page.fill('#attendees', '10');
  await toggle(page, 'Video conference');
  rooms = await shownRooms(page);
  await fill(page, '540', '660', '720');
  r = await result(page);
  await step('U6_blocked', 'Attendees 10 + Video conference, check 660–720', 'Only blocked C303 shown; Unavailable (blocked)',
    `rooms: ${rooms.join(', ')}; result: ${r}`, rooms.join() === 'Room C303' && r.startsWith('Unavailable') && /blocked/i.test(r));

  // U7 (F5): switching rooms refreshes the result
  await reset(page);
  await fill(page, '540', '660', '720');
  const first = await result(page);
  await page.click('button:has-text("Room D404")');
  const second = await result(page);
  await step('U7_switch_D404', 'Check 660–720 on A101, then click Room D404', 'Result changes to Unavailable (D404 booked 660–720)',
    `A101: ${first} → D404: ${second}`, first.startsWith('Available') && second.startsWith('Unavailable') && /660–720/.test(second) && /D404/.test(second));
  await page.click('button:has-text("Room B202")');
  const third = await result(page);
  await step('U8_switch_B202', 'Then click Room B202', 'Result changes to Available for B202',
    `B202: ${third}`, third.startsWith('Available') && /B202/.test(third));

  // U9 (AC6): validation feedback
  await reset(page);
  await fill(page, '540', '660', '');
  r = await result(page);
  await step('U9_validation', 'Empty End time, submit', 'Understandable validation message', `result: ${r}`, /fill in all three/i.test(r));

  // U10 (AC5): repeated checks keep bookings
  await reset(page);
  const before = flat(await page.locator('text=Existing bookings for').locator('..').innerText());
  for (const [s, e] of [['660', '720'], ['630', '690'], ['720', '840'], ['570', '600']]) await fill(page, '540', s, e);
  await page.click('button:has-text("Room D404")');
  await page.click('button:has-text("Room A101")');
  const after = flat(await page.locator('text=Existing bookings for').locator('..').innerText());
  await step('U10_repeat', '4 checks on A101 + switching rooms', 'A101 bookings unchanged', `before: "${before}" / after: "${after}"`, before === after);

  await page.close();
}

await browser.close();
// server.kill() leaves the vite child running on Windows; kill the whole tree.
if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']); else server.kill();

const passed = rows.filter((x) => x.pass).length;
const md = ['| ID | Action | Expected | Observed | Result | Screenshot |', '|---|---|---|---|---|---|',
  ...rows.map((x) => `| ${x.id} | ${x.action} | ${x.expected} | ${x.observed.replace(/\|/g, '/')} | ${x.pass ? 'PASS' : 'FAIL'} | ui/${x.shot} |`)];
writeFileSync(resolve(OUT, '..', '06_ui_checks.md'),
  `# UI check log (${new Date().toISOString()}, Microsoft Edge headless)\n\nCommand: \`npm run build && node scripts/ui-check.mjs\` (in final/)\n\n**${passed}/${rows.length} PASS** (every row also requires no horizontal scroll: scrollWidth <= viewport width)\n\n${md.join('\n')}\n`);
console.log(`${passed}/${rows.length} PASS`);
process.exit(0);
