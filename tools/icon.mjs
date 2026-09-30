// 生成主屏幕图标（iOS 的 apple-touch-icon 只吃 PNG，不认 SVG）。
// 用法：node tools/icon.mjs —— 覆盖写入 public/icon-180.png 与 public/icon-512.png。
// 楷体取系统字库，产物是静态 PNG，玩家没有这个字体也不影响。
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const SIZES = [180, 512];
const page = await (await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})).newPage({ viewport: { width: 512, height: 512 } });

const html = `<!doctype html><meta charset="utf-8"><style>
  html, body { margin: 0; width: 512px; height: 512px; }
  .icon { position: relative; width: 512px; height: 512px; overflow: hidden;
    background: radial-gradient(ellipse at 50% 42%, #2a2720 0%, #14130f 72%); }
  /* 远山：和加载页、标题页的水墨背景同一个调子 */
  .hill { position: absolute; left: -6%; width: 112%; height: 46%; bottom: 0;
    background: rgba(233, 224, 204, 0.055); clip-path: polygon(0 100%, 0 62%, 16% 30%, 31% 58%, 47% 14%, 63% 52%, 80% 26%, 100% 60%, 100% 100%); }
  .hill.back { bottom: 8%; opacity: 0.55; transform: scaleX(-1); }
  .wen { position: absolute; inset: 0; display: grid; place-items: center;
    font-family: 'Ma Shan Zheng', 'STKaiti', 'Kaiti SC', 'KaiTi', serif;
    font-size: 300px; line-height: 1; color: #f0e7d6; padding-bottom: 54px;
    text-shadow: 0 0 26px rgba(0, 0, 0, 0.55), 0 10px 30px rgba(0, 0, 0, 0.4); }
  /* iOS 会把图标裁成圆角方，角上留足余量 */
  .seal { position: absolute; right: 58px; bottom: 54px; width: 80px; height: 80px;
    border: 6px solid #b8322a; border-radius: 9px; color: #d8483c; background: rgba(184, 50, 42, 0.14);
    font-family: 'Ma Shan Zheng', 'STKaiti', 'Kaiti SC', 'KaiTi', serif;
    font-size: 54px; display: grid; place-items: center; }
</style>
<div class="icon">
  <div class="hill back"></div><div class="hill"></div>
  <div class="wen">文</div>
  <div class="seal">守</div>
</div>`;

await page.setContent(html, { waitUntil: 'load' });
fs.mkdirSync('public', { recursive: true });
const el = page.locator('.icon');
for (const s of SIZES) {
  await page.setViewportSize({ width: s, height: s });
  await page.addStyleTag({ content: `.icon { zoom: ${s / 512}; }` });
  await el.screenshot({ path: `public/icon-${s}.png` });
  console.log(`public/icon-${s}.png`);
}
await page.context().browser().close();
