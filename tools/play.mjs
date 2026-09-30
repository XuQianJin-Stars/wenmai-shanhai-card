// Mouse-driven playtest: plays the player side with real pointer events (click-select, drag, targeting, end turn).
// Usage: node tools/play.mjs [--q "battle=ch1-1&reset=1"] [--turns 6] [--out shots/play]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => { if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1]]); return a; }, []));
const q = args.q ?? 'battle=ch1-1&reset=1&speed=2';
const turns = +(args.turns ?? 6), out = args.out ?? 'shots/play';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:5188/?${q}`);
await page.waitForFunction(() => window.__battle, null, { timeout: 60000 });
const sleep = (ms) => page.waitForTimeout(ms);
const idle = () => page.waitForFunction(() => { const b = window.__battle; return !b || b.s.over || (b.s.active === 0 && b.mode === 'idle'); }, null, { timeout: 90000, polling: 100 });
const B = (fn, arg) => page.evaluate(fn, arg);
let shot = 0, acts = 0;
for (let t = 0; t < turns; t++) {
  await idle();
  if (await B(() => !window.__battle || window.__battle.s.over)) break;
  await sleep(400);
  for (let k = 0; k < 12; k++) {
    await idle();
    if (await B(() => !window.__battle || window.__battle.s.over)) break;
    const legal = await B(() => window.__battle.legal());
    const a = legal.find((x) => x.type === 'play') ?? legal.find((x) => x.type === 'attack') ?? legal.find((x) => x.type === 'skill');
    if (!a) break;
    const src = await B((u) => window.__battle.screenOf(u), a.uid);
    if (!src) { console.log('no screen pos for', a); break; }
    if (a.type === 'play' && !a.target && k % 2 === 0) {           // drag onto the table
      await page.mouse.move(src.x, src.y + 20); await sleep(250);
      await page.mouse.down(); await page.mouse.move(src.x, src.y - 80, { steps: 5 }); await page.mouse.move(800, 380, { steps: 10 }); await page.mouse.up();
    } else if (a.type === 'play' && !a.target) {                      // click, click
      await page.mouse.move(src.x, src.y + 20); await sleep(300);
      const s2 = await B((u) => window.__battle.screenOf(u), a.uid);
      await page.mouse.click(s2.x, s2.y); await sleep(250); await page.mouse.click(s2.x, s2.y);
    } else if (a.type === 'skill') {
      await page.mouse.click(src.x, src.y); await sleep(300);
      await page.click('.skill-btn.show').catch(() => {});
      if (a.target) { await sleep(300); const tp = await B((u) => window.__battle.screenOf(u), a.target); await page.mouse.click(tp.x, tp.y); }
    } else {                                                          // select, then target
      await page.mouse.move(src.x, src.y + 20); await sleep(300);
      const s2 = await B((u) => window.__battle.screenOf(u), a.uid);
      await page.mouse.click(s2.x, s2.y); await sleep(350);
      const tp = await B((u) => window.__battle.screenOf(u), a.target);
      await page.mouse.move(tp.x, tp.y, { steps: 8 }); await sleep(150);
      if (shot < 3) await page.screenshot({ path: `${out}/aim${shot++}.png` });
      await page.mouse.click(tp.x, tp.y);
    }
    acts++;
    await sleep(300);
    const busy = await B(() => window.__battle?.mode);
    if (busy === 'target') { console.log('stuck in target mode after', JSON.stringify(a)); await page.keyboard.press('Escape'); }
  }
  await page.screenshot({ path: `${out}/turn${t}.png` });
  await idle();
  if (await B(() => !window.__battle || window.__battle.s.over)) break;
  await page.click('.endturn');
  await sleep(800);
}
const st = await B(() => window.__battle ? { over: window.__battle.s.over, winner: window.__battle.s.winner, hp: window.__battle.s.players.map((p) => p.hp), turn: window.__battle.s.turn } : 'finished');
console.log('actions', acts, 'state', JSON.stringify(st));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
await browser.close();
