// Entry. ?scene=gallery shows every card face flat (art review); otherwise the game boots.
import { CARDS } from './data/cards.js';
import { faceCanvas, backCanvas } from './render/cardFace.js';

const params = new URLSearchParams(location.search);

async function fontsReady() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load("48px 'Ma Shan Zheng'"), document.fonts.load("20px 'Noto Serif SC'")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* offline: fall back to system Kaiti/Songti */ }
}

async function gallery() {
  await fontsReady();
  document.getElementById('load')?.remove();
  const ui = document.getElementById('ui');
  ui.style.cssText = 'position:fixed;inset:0;overflow:auto;display:flex;flex-wrap:wrap;gap:10px;padding:10px;background:#1b1a17;pointer-events:auto';
  const ids = params.get('ids')?.split(',') ?? Object.keys(CARDS);
  const scale = +(params.get('s') ?? 0.4);
  for (const id of ids) {
    const c = faceCanvas(id, +(params.get('g') ?? 0));
    c.style.width = `${512 * scale}px`;
    ui.appendChild(c);
  }
  const b = backCanvas(); b.style.width = `${512 * scale}px`; ui.appendChild(b);
  window.__ready = true;
}

if (params.get('scene') === 'gallery') gallery();
else import('./game/boot.js').then((m) => m.boot(params, fontsReady));
