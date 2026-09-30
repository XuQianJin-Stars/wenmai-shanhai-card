// Headless GPU screenshot harness (system Chrome + ANGLE/Metal), adapted from Long Wind's tools/shot.mjs.
// Usage:
//   node tools/shot.mjs --q "scene=gallery" --out shots/a.png [--w 1600 --h 900] [--wait 2000]
//        [--eval "js"] [--eval2 "js" --wait2 1000] [--port 5188] [--steps "js1|||js2|||..." --stepwait 800]
// Waits for window.__ready, runs --eval, waits, screenshots. Prints console errors and page errors; exit 2 on errors.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
  return acc;
}, []));
const port = args.port ?? 5188;
const W = +(args.w ?? 1600), H = +(args.h ?? 900);
const out = args.out ?? 'shots/shot.png';
const url = args.url ?? `http://127.0.0.1:${port}/?harness=1&${args.q ?? ''}`;
const waitMs = +(args.wait ?? 1500);

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: +(args.dpr ?? 1) });
const logs = [];
let pageErrors = 0;
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) || args.verbose) logs.push(`[console.${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => { pageErrors++; logs.push(`[pageerror] ${e.message}\n${e.stack ?? ''}`); });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
let ready = false;
try { await page.waitForFunction(() => window.__ready === true, null, { timeout: +(args.timeout ?? 60000), polling: 100 }); ready = true; }
catch { logs.push('[harness] window.__ready never became true'); }
const tReady = Date.now() - t0;
async function run(js, tag) {
  try { const r = await page.evaluate(js); if (r !== undefined) logs.push(`[${tag}] ${JSON.stringify(r)}`); }
  catch (e) { logs.push(`[${tag} error] ${e.message}`); }
}
if (ready && args.eval) await run(args.eval, 'eval');
await page.waitForTimeout(waitMs);
if (args.steps) {
  let k = 0;
  for (const js of args.steps.split('|||')) {
    await run(js, `step${k}`);
    await page.waitForTimeout(+(args.stepwait ?? 800));
    if (args.stepshots) { fs.mkdirSync(path.dirname(out), { recursive: true }); await page.screenshot({ path: out.replace(/\.png$/, `-${k}.png`) }); }
    k++;
  }
}
if (args.eval2) { await run(args.eval2, 'eval2'); await page.waitForTimeout(+(args.wait2 ?? 1000)); }
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: !!args.full });
console.log(`[harness] ${url} ready=${ready} in ${tReady}ms -> ${out}`);
for (const l of logs) console.log(l);
await browser.close();
process.exit(!ready || pageErrors ? 2 : 0);
