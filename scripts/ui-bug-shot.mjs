// Screenshot one UI scenario (Room A101, now 540, request 660–720 touching the 10:00–11:00 booking)
// for the current build. Usage: npm run build && node scripts/ui-bug-shot.mjs <label>
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const label = process.argv[2] ?? 'current';
const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, '..', 'evidence', 'ui');
mkdirSync(OUT, { recursive: true });
const PORT = 4700 + Math.floor(Math.random() * 500);

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true });
await new Promise((ok, fail) => {
  const t = setTimeout(() => fail(new Error('preview did not start')), 30000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); ok(); } });
});

const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const vp of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.fill('#current-time', '540');
  await page.fill('#start-time', '660');
  await page.fill('#end-time', '720');
  await page.click('text=Check availability');
  const result = (await page.locator('section.mt-5').innerText()).replace(/\n+/g, ' ');
  const file = `${label}_${vp.name}_touching_660-720.png`;
  await page.screenshot({ path: resolve(OUT, file), fullPage: true });
  console.log(`${label} ${vp.name}: ${result} -> ui/${file}`);
  await page.close();
}
await browser.close();
if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']); else server.kill();
process.exit(0);
