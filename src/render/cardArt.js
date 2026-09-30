// Procedural ink paintings for every card motif (写意 style: few bold strokes, washes, one accent colour).
// paintArt(ctx, w, h, motif, { tint, seed }) paints into the given rectangle at (0, 0).
import { brush, paper, seal, rgba, mix, INK, PAPER, FONT_BRUSH } from './ink.js';
import { EL } from '../data/cards.js';
import { lateMotifs } from './cardArtLate.js';

const GOLD = '#C8A04A', RED = '#C03A2A', CINNABAR = '#B8322A', JADE = '#4A8C5C', BLUE = '#2A4A7A', OCHRE = '#8C6040';

function sky(b, w, h, { top = '#e9e1d0', bottom = PAPER, sun = null } = {}) {
  const { ctx } = b;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (sun) {
    const [x, y, r, c] = sun;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
    rg.addColorStop(0, rgba(c, 0.55)); rg.addColorStop(0.4, rgba(c, 0.18)); rg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(c, 0.85); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

/** Freehand robed figure. (x, y) = feet, h = height. Returns key points for props. */
function figure(b, x, y, h, { lean = 0, robe = INK, accent = null, sleeve = 1, width = 1, head = 'bun', alpha = 0.9, stance = 0 } = {}) {
  const r = b.r, s = h / 100;
  const hx = x + lean * 18 * s, hy = y - h + 9 * s;                      // head centre
  const sh = [hx + lean * 2 * s, hy + 16 * s];                            // shoulders
  const W = 26 * s * width;
  // robe body wash
  const hem = y;
  b.wash([[sh[0] - W * 0.45, sh[1]], [sh[0] + W * 0.45, sh[1]], [x + W * 0.9 + stance * 10 * s, hem - 2 * s], [x + W * 0.2, hem + 3 * s], [x - W * 0.3, hem + 1 * s], [x - W * 0.95 - stance * 6 * s, hem - 3 * s]],
    { color: robe, alpha: 0.55 * alpha, blur: 2.5, edge: 0.6 });
  if (accent) b.wash([[sh[0] - W * 0.3, sh[1] + 16 * s], [sh[0] + W * 0.35, sh[1] + 16 * s], [x + W * 0.3, sh[1] + 30 * s], [x - W * 0.4, sh[1] + 30 * s]], { color: accent, alpha: 0.75, blur: 2, edge: 0.3 });
  // outline strokes (骨法用笔)
  b.stroke([[sh[0] - W * 0.4, sh[1]], [x - W * 0.6, (sh[1] + hem) / 2 + r(-4, 4) * s], [x - W * 0.95 - stance * 6 * s, hem - 3 * s]], { w: 5 * s, alpha: alpha, dry: 0.5 });
  b.stroke([[sh[0] + W * 0.4, sh[1]], [x + W * 0.55, (sh[1] + hem) / 2], [x + W * 0.9 + stance * 10 * s, hem - 2 * s]], { w: 4.2 * s, alpha: alpha * 0.9, dry: 0.5 });
  b.stroke([[x - W * 0.9, hem - 2 * s], [x, hem + 3 * s], [x + W * 0.85, hem - 1 * s]], { w: 3 * s, alpha: alpha * 0.8, dry: 0.6, taper: [0.3, 0.3] });
  // sleeves
  const lh = [sh[0] - W * (0.9 + 0.5 * sleeve), sh[1] + 26 * s], rh = [sh[0] + W * (0.85 + 0.4 * sleeve), sh[1] + 22 * s];
  b.stroke([[sh[0] - W * 0.35, sh[1] + 2 * s], [sh[0] - W * 0.8, sh[1] + 12 * s], lh, [lh[0] + 6 * s, lh[1] + 12 * s * sleeve]], { w: 7 * s * sleeve, alpha: alpha * 0.85, dry: 0.45 });
  b.stroke([[sh[0] + W * 0.35, sh[1] + 2 * s], [sh[0] + W * 0.75, sh[1] + 10 * s], rh, [rh[0] - 5 * s, rh[1] + 14 * s * sleeve]], { w: 6 * s * sleeve, alpha: alpha * 0.8, dry: 0.45 });
  // head
  b.wash(b.blob(hx, hy, 7 * s, 8.5 * s, { wob: 0.08 }), { color: '#caa98a', alpha: 0.5, blur: 1, edge: 0.9 });
  b.stroke([[hx - 7 * s, hy - 1 * s], [hx - 5 * s, hy - 8 * s], [hx + 2 * s, hy - 10 * s], [hx + 7 * s, hy - 4 * s]], { w: 4.5 * s, alpha, dry: 0.2 });
  if (head === 'bun') b.wash(b.blob(hx + 1 * s, hy - 11 * s, 4.5 * s, 3.8 * s), { color: INK, alpha: 0.85, blur: 0.8, edge: 0 });
  if (head === 'hat') {
    b.wash([[hx - 9 * s, hy - 6 * s], [hx + 9 * s, hy - 6 * s], [hx + 7 * s, hy - 17 * s], [hx - 7 * s, hy - 17 * s]], { color: INK, alpha: 0.9, blur: 0.6, edge: 0, smooth: false });
    b.stroke([[hx - 26 * s, hy - 12 * s], [hx - 8 * s, hy - 12 * s]], { w: 3.5 * s, dry: 0.1 });
    b.stroke([[hx + 8 * s, hy - 12 * s], [hx + 26 * s, hy - 12 * s]], { w: 3.5 * s, dry: 0.1 });
  }
  if (head === 'twin') { // 哪吒 double buns
    b.wash(b.blob(hx - 6 * s, hy - 10 * s, 3.8 * s, 3.8 * s), { color: INK, alpha: 0.9, blur: 0.6, edge: 0 });
    b.wash(b.blob(hx + 6 * s, hy - 10 * s, 3.8 * s, 3.8 * s), { color: INK, alpha: 0.9, blur: 0.6, edge: 0 });
  }
  if (head === 'long') b.stroke([[hx + 5 * s, hy - 6 * s], [hx + 9 * s, hy + 8 * s], [hx + 6 * s, hy + 28 * s], [hx + 10 * s, hy + 44 * s]], { w: 5 * s, alpha: alpha * 0.9, dry: 0.5 });
  return { head: [hx, hy], sh, lh, rh, s };
}

function flame(b, x, y, hgt, { color = RED, n = 5 } = {}) {
  for (let i = 0; i < n; i++) {
    const ox = b.r(-hgt * 0.25, hgt * 0.25);
    b.stroke([[x + ox, y], [x + ox + b.r(-6, 6), y - hgt * 0.4], [x + ox + b.r(-10, 10), y - hgt * b.r(0.6, 1)]], { w: hgt * 0.16, color: i % 2 ? '#D35400' : color, alpha: 0.75, dry: 0.3, taper: [0.05, 0.9] });
  }
}
function pine(b, x, y, s, dir = 1) {
  b.stroke([[x, y], [x + dir * 20 * s, y - 30 * s], [x + dir * 16 * s, y - 60 * s], [x + dir * 34 * s, y - 90 * s]], { w: 9 * s, dry: 0.7, alpha: 0.85 });
  for (let k = 0; k < 4; k++) {
    const bx = x + dir * (16 + k * 6) * s, by = y - (40 + k * 16) * s;
    b.stroke([[bx, by], [bx + dir * (30 + k * 4) * s, by - 6 * s]], { w: 3 * s, dry: 0.4 });
    for (let j = 0; j < 7; j++) {
      const px = bx + dir * (10 + j * 4) * s, py = by - 4 * s;
      b.stroke([[px, py], [px + dir * 5 * s, py - 12 * s]], { w: 2 * s, color: mix(INK, JADE, 0.3), alpha: 0.8, dry: 0 });
      b.stroke([[px, py], [px - dir * 4 * s, py - 11 * s]], { w: 2 * s, color: mix(INK, JADE, 0.3), alpha: 0.7, dry: 0 });
    }
  }
}
function wave(b, x, y, w, { color = BLUE, n = 4, s = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    const cx = x + (i / n) * w + b.r(-5, 5);
    const pts = [[cx - 26 * s, y + 8 * s], [cx - 10 * s, y - 4 * s], [cx + 6 * s, y - 10 * s], [cx + 16 * s, y - 2 * s], [cx + 8 * s, y + 2 * s], [cx + 2 * s, y - 3 * s]];
    b.stroke(pts, { w: 4 * s, color, alpha: 0.85, dry: 0.3 });
  }
}

function eye(ctx, x, y, r, color = '#F4D03F') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, rgba(color, 0.9)); g.addColorStop(0.25, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
}

// ───────────────────────────── motifs ─────────────────────────────
const M = {};

M.giant = (b, w, h) => {
  sky(b, w, h, { top: '#d9ccb2', bottom: '#efe6d4', sun: [w * 0.8, h * 0.2, h * 0.06, GOLD] });
  b.mountains(w, h, { base: 0.66, alpha: 0.18 });
  // the sky split by the axe
  b.stroke([[w * 0.05, h * 0.18], [w * 0.4, h * 0.34], [w * 0.95, h * 0.5]], { w: 3, color: GOLD, alpha: 0.7, dry: 0.3 });
  const f = figure(b, w * 0.44, h * 0.99, h * 0.76, { width: 1.8, robe: '#3b2f25', accent: OCHRE, sleeve: 1.3, head: 'long', lean: -0.2, stance: 1 });
  // axe raised over the head
  const hx = f.rh[0] + 10, hy = Math.max(h * 0.17, f.head[1] - 30);
  b.stroke([[hx - w * 0.16, hy + h * 0.5], [hx - w * 0.07, hy + h * 0.22], [hx, hy]], { w: 7, dry: 0.4, taper: [0.3, 0.1] });
  b.wash([[hx - 30, hy - 26], [hx + 30, hy - 36], [hx + 38, hy + 4], [hx + 6, hy + 10], [hx - 10, hy - 4]], { color: '#2a241e', alpha: 0.85, blur: 1, edge: 0.6 });
  b.stroke([[hx - 28, hy - 26], [hx + 8, hy - 44], [hx + 40, hy + 2]], { w: 3, color: GOLD, alpha: 0.9, dry: 0.2 });
  // stone cracks on the body
  for (let i = 0; i < 6; i++) {
    const x0 = f.sh[0] + b.r(-30, 30), y0 = f.sh[1] + b.r(10, 120);
    b.stroke([[x0, y0], [x0 + b.r(-12, 12), y0 + b.r(8, 18)], [x0 + b.r(-16, 16), y0 + b.r(18, 30)]], { w: 1.6, color: '#e2b964', alpha: 0.75, dry: 0.1 });
  }
  b.mist(w, h, h * 0.9, { alpha: 0.5 });
};

M.goddess = (b, w, h) => {
  sky(b, w, h, { top: '#e8d7c2', bottom: '#f3e9da' });
  b.mountains(w, h, { base: 0.7, alpha: 0.12 });
  // five-coloured stones in an arc
  const cols = ['#C8A04A', '#4A8C5C', '#2A4A7A', '#C03A2A', '#8C6040'];
  cols.forEach((c, i) => {
    const a = Math.PI * (0.15 + i * 0.175), x = w * 0.5 + Math.cos(a) * w * 0.36, y = h * 0.42 - Math.sin(a) * h * 0.3;
    const g = b.ctx.createRadialGradient(x, y, 0, x, y, 26);
    g.addColorStop(0, rgba(c, 0.55)); g.addColorStop(1, rgba(c, 0));
    b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(x, y, 26, 0, Math.PI * 2); b.ctx.fill();
    b.wash(b.blob(x, y, 9, 8), { color: c, alpha: 0.95, blur: 0.6, edge: 0.8 });
  });
  // serpent tail coil
  const cx = w * 0.5, cy = h * 0.9;
  const coil = [];
  for (let t = 0; t < 1.7; t += 0.05) coil.push([cx + Math.cos(t * Math.PI * 2) * (70 - t * 26), cy + Math.sin(t * Math.PI * 2) * (14 - t * 4) - t * 8]);
  b.stroke(coil, { w: 20, color: '#5a3a2a', alpha: 0.75, dry: 0.4, taper: [0.02, 0.9] });
  b.stroke(coil, { w: 6, color: RED, alpha: 0.55, dry: 0.2, taper: [0.02, 0.9] });
  const f = figure(b, w * 0.5, h * 0.84, h * 0.68, { robe: '#4a2a22', accent: RED, sleeve: 1.4, head: 'bun' });
  // hands raised holding a glowing stone
  const sx = f.head[0] + 26, sy = f.head[1] - 18;
  b.stroke([[f.rh[0], f.rh[1] - 6], [sx - 4, sy + 16]], { w: 6, dry: 0.5 });
  const g = b.ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
  g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(0.3, rgba(RED, 0.4)); g.addColorStop(1, rgba(RED, 0));
  b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(sx, sy, 40, 0, Math.PI * 2); b.ctx.fill();
  flame(b, w * 0.2, h * 0.98, 50); flame(b, w * 0.82, h * 0.98, 40);
};

M.youth = (b, w, h) => {
  sky(b, w, h, { top: '#d8cdb8', bottom: '#efe4d0' });
  wave(b, 0, h * 0.94, w, { n: 7, s: 1.3 });
  const f = figure(b, w * 0.5, h * 0.74, h * 0.6, { robe: '#3a2622', accent: RED, head: 'twin', lean: 0.4, stance: 1.2, width: 0.9 });
  // 混天绫: long red sash swirling
  const sash = [[f.sh[0] - 20, f.sh[1] + 10], [w * 0.15, h * 0.3], [w * 0.1, h * 0.08], [w * 0.4, h * 0.12], [w * 0.7, h * 0.05], [w * 0.95, h * 0.25], [w * 0.8, h * 0.45]];
  b.stroke(sash, { w: 14, color: RED, alpha: 0.8, dry: 0.3, taper: [0.1, 0.4] });
  // 风火轮 under the feet
  for (const [wx, wy] of [[w * 0.4, h * 0.82], [w * 0.6, h * 0.84]]) {
    const ring = []; for (let t = 0; t <= 1.02; t += 0.05) ring.push([wx + Math.cos(t * 6.283) * 20, wy + Math.sin(t * 6.283) * 7]);
    b.stroke(ring, { w: 5, color: '#D35400', alpha: 0.9, dry: 0.2, taper: [0.05, 0.05] });
    flame(b, wx, wy + 4, 26, { n: 3 });
  }
  // 乾坤圈
  const ring = []; for (let t = 0; t <= 1.02; t += 0.04) ring.push([f.rh[0] + 12 + Math.cos(t * 6.283) * 16, f.rh[1] - 8 + Math.sin(t * 6.283) * 16]);
  b.stroke(ring, { w: 4.5, color: GOLD, alpha: 0.95, dry: 0.1, taper: [0.02, 0.02] });
};

M.judge = (b, w, h) => {
  sky(b, w, h, { top: '#cfc6b4', bottom: '#ebe2cf' });
  b.mountains(w, h, { base: 0.72, alpha: 0.14 });
  const f = figure(b, w * 0.46, h * 0.97, h * 0.84, { width: 1.7, robe: '#2c2622', accent: '#1A5276', head: 'hat', sleeve: 1.2 });
  // beard
  for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 5], [f.head[0] + k * 5, f.head[1] + 20], [f.head[0] + k * 7, f.head[1] + 34]], { w: 2.5, dry: 0.4 });
  eye(b.ctx, f.head[0] - 3, f.head[1] - 1, 2, '#F4D03F');
  // sword diagonal
  b.stroke([[f.rh[0] - 6, f.rh[1] + 6], [w * 0.95, h * 0.1]], { w: 4, color: '#3d3d3d', dry: 0.1, taper: [0.02, 0.6] });
  b.stroke([[f.rh[0] + 8, f.rh[1] - 4], [f.rh[0] - 10, f.rh[1] + 12]], { w: 5, color: GOLD, dry: 0.1 });
  // cowering imp
  b.wash(b.blob(w * 0.15, h * 0.88, 22, 16), { color: INK, alpha: 0.8, blur: 2, edge: 0.4 });
  eye(b.ctx, w * 0.13, h * 0.86, 1.6, '#e8e0d0'); eye(b.ctx, w * 0.17, h * 0.86, 1.6, '#e8e0d0');
  b.splatter(w * 0.15, h * 0.88, 40, { n: 20, alpha: 0.5, size: 2 });
};

M.swordsman = (b, w, h) => {
  sky(b, w, h, { top: '#dcd6c6', bottom: '#f0e9da', sun: [w * 0.78, h * 0.22, h * 0.09, '#f6f0dc'] });
  b.mountains(w, h, { base: 0.62, alpha: 0.2, layers: 3 });
  pine(b, w * 0.02, h * 0.95, 1.4, 1);
  b.mist(w, h, h * 0.78, { alpha: 0.7 });
  const f = figure(b, w * 0.56, h * 0.9, h * 0.7, { robe: '#2f3a32', accent: JADE, head: 'bun', sleeve: 1.5, lean: 0.1 });
  b.stroke([[f.sh[0] - 30, f.sh[1] + 50], [f.sh[0] + 34, f.sh[1] - 40]], { w: 3.5, color: '#2c2c2c', dry: 0, taper: [0.02, 0.4] });
  b.stroke([[f.sh[0] - 22, f.sh[1] + 38], [f.sh[0] - 14, f.sh[1] + 30]], { w: 5, color: GOLD, dry: 0 });
  b.cloud(w * 0.42, h * 0.93, 14, { color: JADE, alpha: 0.7, w: 3 });
};

M.beggar = (b, w, h) => {
  sky(b, w, h, { top: '#d8cfbc', bottom: '#eee5d2' });
  b.mountains(w, h, { base: 0.7, alpha: 0.13 });
  const f = figure(b, w * 0.5, h * 0.96, h * 0.72, { robe: '#3a3026', accent: OCHRE, head: 'long', lean: 0.55, stance: 0.5 });
  // iron crutch
  b.stroke([[f.rh[0] + 6, f.rh[1] - 20], [f.rh[0] + 16, h * 0.98]], { w: 7, color: '#2a2a2a', dry: 0.6, taper: [0.05, 0.1] });
  // gourd with rising smoke
  const gx = f.sh[0] - 40, gy = f.sh[1] + 40;
  b.wash(b.blob(gx, gy + 12, 16, 16), { color: '#7a5a2a', alpha: 0.9, blur: 1, edge: 0.8 });
  b.wash(b.blob(gx, gy - 10, 10, 10), { color: '#7a5a2a', alpha: 0.9, blur: 1, edge: 0.8 });
  const smoke = []; for (let t = 0; t < 1; t += 0.05) smoke.push([gx + Math.sin(t * 9) * 16 * t, gy - 20 - t * h * 0.5]);
  b.stroke(smoke, { w: 8, color: '#8C8C8C', alpha: 0.4, dry: 0.3, taper: [0.1, 0.8] });
  b.cloud(gx - 20, h * 0.2, 12, { color: '#8C8C8C', alpha: 0.5, w: 2.5 });
};

M.serpent = (b, w, h) => {
  sky(b, w, h, { top: '#2b2622', bottom: '#b9a78c' });
  b.mountains(w, h, { base: 0.74, alpha: 0.35 });
  const body = [[w * 0.05, h * 0.9], [w * 0.25, h * 0.6], [w * 0.5, h * 0.78], [w * 0.72, h * 0.5], [w * 0.62, h * 0.28], [w * 0.5, h * 0.22]];
  b.stroke(body, { w: 30, color: '#6a1e14', alpha: 0.9, dry: 0.4, taper: [0.02, 0.2] });
  b.stroke(body, { w: 12, color: RED, alpha: 0.8, dry: 0.3, taper: [0.02, 0.2] });
  const P = b.spline(body, 14);
  for (const p of P) b.ctx.fillStyle = rgba('#f0c060', 0.5), b.ctx.beginPath(), b.ctx.arc(p[0] + b.r(-5, 5), p[1] + b.r(-5, 5), 1.6, 0, 6.3), b.ctx.fill();
  const hx = w * 0.46, hy = h * 0.2;
  b.wash(b.blob(hx, hy, 20, 24), { color: '#c9a58a', alpha: 0.85, blur: 1, edge: 0.9 });
  b.stroke([[hx - 20, hy - 6], [hx - 10, hy - 26], [hx + 14, hy - 22], [hx + 22, hy + 2]], { w: 8, color: '#5a1a10', dry: 0.3 });
  eye(b.ctx, hx, hy - 2, 5, '#F4D03F');
  const g = b.ctx.createRadialGradient(hx, hy, 0, hx, hy, h * 0.6);
  g.addColorStop(0, 'rgba(255,210,120,0.35)'); g.addColorStop(1, 'rgba(255,210,120,0)');
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
};

M.moon = (b, w, h) => {
  sky(b, w, h, { top: '#1f2a3a', bottom: '#6d7a88' });
  const mx = w * 0.62, my = h * 0.38, mr = h * 0.3;
  const g = b.ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 1.8);
  g.addColorStop(0, 'rgba(250,244,225,0.95)'); g.addColorStop(0.55, 'rgba(250,244,225,0.9)'); g.addColorStop(0.56, 'rgba(250,244,225,0.18)'); g.addColorStop(1, 'rgba(250,244,225,0)');
  b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(mx, my, mr * 1.8, 0, Math.PI * 2); b.ctx.fill();
  b.wash(b.blob(mx + 20, my + 10, mr * 0.3, mr * 0.2), { color: '#9aa4ae', alpha: 0.25, blur: 6, edge: 0 });
  // osmanthus branch
  b.stroke([[w, h * 0.1], [w * 0.85, h * 0.18], [w * 0.72, h * 0.12]], { w: 4, dry: 0.5, color: '#1a1a1a' });
  for (let i = 0; i < 16; i++) b.wash(b.blob(w * (0.72 + b.R() * 0.28), h * (0.08 + b.R() * 0.14), 3, 3), { color: '#F4D03F', alpha: 0.9, blur: 0.5, edge: 0 });
  const f = figure(b, w * 0.34, h * 0.9, h * 0.66, { robe: '#dfe6ee', accent: '#8fa6c0', head: 'bun', sleeve: 1.6, lean: -0.3, alpha: 0.85 });
  const trail = [[f.lh[0], f.lh[1]], [w * 0.1, h * 0.95], [w * 0.02, h * 0.7]];
  b.stroke(trail, { w: 9, color: '#dfe6ee', alpha: 0.7, dry: 0.4 });
  b.mist(w, h, h * 0.95, { alpha: 0.35, color: '#c9d2dc' });
};

M.guardians = (b, w, h) => {
  sky(b, w, h, { top: '#e2d6c0', bottom: '#efe6d4' });
  // red door
  b.wash([[w * 0.36, h * 0.22], [w * 0.64, h * 0.22], [w * 0.64, h], [w * 0.36, h]], { color: CINNABAR, alpha: 0.85, blur: 1, edge: 0.5, smooth: false });
  for (let r0 = 0; r0 < 4; r0++) for (let c = 0; c < 3; c++) {
    b.ctx.fillStyle = rgba(GOLD, 0.9); b.ctx.beginPath(); b.ctx.arc(w * (0.4 + c * 0.1), h * (0.35 + r0 * 0.15), 3.5, 0, 6.3); b.ctx.fill();
  }
  // peach tree above
  b.stroke([[0, h * 0.1], [w * 0.3, h * 0.14], [w * 0.55, h * 0.06], [w, h * 0.12]], { w: 7, dry: 0.6 });
  for (let i = 0; i < 22; i++) b.wash(b.blob(b.r(0, w), b.r(h * 0.02, h * 0.2), 5, 4), { color: '#d98c8c', alpha: 0.8, blur: 0.8, edge: 0.4 });
  figure(b, w * 0.18, h * 0.98, h * 0.72, { robe: '#2c2622', accent: GOLD, head: 'hat', width: 1.3, lean: 0.2 });
  figure(b, w * 0.82, h * 0.98, h * 0.72, { robe: '#2c2622', accent: '#1A5276', head: 'hat', width: 1.3, lean: -0.2 });
};

function talisman(b, w, h, el, { glyph = null, dark = false, bolt = false } = {}) {
  const c = el ? EL[el].color : INK;
  sky(b, w, h, { top: dark ? '#1c1c1c' : mix(c, '#e8dcc4', 0.72), bottom: dark ? '#3a3a3a' : mix(c, '#f3eadb', 0.85) });
  const g = b.ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.7);
  g.addColorStop(0, rgba(c, dark ? 0.2 : 0.45)); g.addColorStop(1, rgba(c, 0));
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
  // swirling element strokes behind
  for (let i = 0; i < 5; i++) {
    const a0 = b.r(0, 6.28), pts = [];
    for (let t = 0; t < 1; t += 0.06) pts.push([w / 2 + Math.cos(a0 + t * 3) * (60 + t * 100), h / 2 + Math.sin(a0 + t * 3) * (40 + t * 60)]);
    b.stroke(pts, { w: 5, color: c, alpha: 0.45, dry: 0.5 });
  }
  if (bolt) {
    b.stroke([[w * 0.7, 0], [w * 0.6, h * 0.3], [w * 0.72, h * 0.34], [w * 0.55, h * 0.75], [w * 0.62, h * 0.7], [w * 0.5, h]], { w: 6, color: '#fff6d0', alpha: 0.95, dry: 0.1, taper: [0.05, 0.3] });
  }
  // the paper strip
  const pw = w * 0.3, ph = h * 0.92, px = w / 2 - pw / 2, py = h * 0.04;
  b.ctx.save();
  b.ctx.translate(w / 2, h / 2); b.ctx.rotate(b.r(-0.05, 0.05)); b.ctx.translate(-w / 2, -h / 2);
  b.ctx.fillStyle = dark ? '#2a2a2a' : '#E8C872';
  b.ctx.fillRect(px, py, pw, ph);
  b.ctx.strokeStyle = dark ? '#555' : CINNABAR; b.ctx.lineWidth = 2; b.ctx.strokeRect(px + 5, py + 5, pw - 10, ph - 10);
  const ink = dark ? '#8a8a8a' : CINNABAR;
  b.ctx.fillStyle = ink; b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
  b.ctx.font = `${pw * 0.3}px ${FONT_BRUSH}`;
  b.ctx.fillText('敕', w / 2, py + pw * 0.3);
  b.ctx.fillText('令', w / 2, py + pw * 0.62);
  b.ctx.font = `${pw * 0.78}px ${FONT_BRUSH}`;
  b.ctx.fillText(glyph ?? (el ? EL[el].zh : '浊'), w / 2, py + ph * 0.55);
  const sq = []; for (let t = 0; t < 1; t += 0.05) sq.push([w / 2 + Math.sin(t * 22) * pw * 0.22, py + ph * (0.72 + t * 0.22)]);
  b.stroke(sq, { w: 3, color: ink, alpha: 0.9, dry: 0.2 });
  b.ctx.restore();
}
M['seal-metal'] = (b, w, h) => talisman(b, w, h, 'metal', { glyph: '金' });
M['seal-wood'] = (b, w, h) => talisman(b, w, h, 'wood', { glyph: '木' });
M['seal-water'] = (b, w, h) => talisman(b, w, h, 'water', { glyph: '水' });
M['seal-fire'] = (b, w, h) => talisman(b, w, h, 'fire', { glyph: '火' });
M['seal-earth'] = (b, w, h) => talisman(b, w, h, 'earth', { glyph: '土' });
M['seal-thunder'] = (b, w, h) => talisman(b, w, h, 'metal', { glyph: '雷', bolt: true });
M['seal-mist'] = (b, w, h) => talisman(b, w, h, null, { glyph: '蚀', dark: true });

function scrollFrame(b, w, h, fn, { bg = '#efe6d2' } = {}) {
  const { ctx } = b;
  ctx.fillStyle = '#2f3b33'; ctx.fillRect(0, 0, w, h);
  const ix = w * 0.08, iy = h * 0.06, iw = w * 0.84, ih = h * 0.88;
  ctx.save();
  ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
  ctx.translate(ix, iy);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, iw, ih);
  fn(iw, ih);
  ctx.restore();
  ctx.strokeStyle = rgba(GOLD, 0.8); ctx.lineWidth = 2; ctx.strokeRect(ix - 3, iy - 3, iw + 6, ih + 6);
  // scroll rods
  for (const y of [iy - 10, iy + ih + 10]) {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(w * 0.03, y - 4, w * 0.94, 8);
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(w * 0.03, y, 6, 0, 6.3); ctx.arc(w * 0.97, y, 6, 0, 6.3); ctx.fill();
  }
}
M['scroll-mountain'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  sky(b, iw, ih, { top: '#e6dcc8', bottom: '#f2eadb', sun: [iw * 0.2, ih * 0.2, 12, RED] });
  b.ctx.fillStyle = 'rgba(240,236,220,0.9)'; b.ctx.beginPath(); b.ctx.arc(iw * 0.8, ih * 0.2, 10, 0, 6.3); b.ctx.fill();
  b.mountains(iw, ih, { base: 0.5, alpha: 0.25, peak: 0.35, color: OCHRE });
  b.mountains(iw, ih, { base: 0.72, alpha: 0.3, peak: 0.25 });
  b.mist(iw, ih, ih * 0.6, { alpha: 0.5 });
});
M['scroll-stones'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  sky(b, iw, ih, { top: '#e9dcc6', bottom: '#f3e8d6' });
  const g = b.ctx.createLinearGradient(iw / 2 - 30, 0, iw / 2 + 30, 0);
  g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,236,190,0.8)'); g.addColorStop(1, 'rgba(255,240,200,0)');
  b.ctx.fillStyle = g; b.ctx.fillRect(iw / 2 - 30, 0, 60, ih);
  ['#C8A04A', '#4A8C5C', '#2A4A7A', '#C03A2A', '#8C6040'].forEach((c, i) => {
    const x = iw * (0.2 + i * 0.15), y = ih * (0.72 - Math.sin(i / 4 * Math.PI) * 0.2);
    b.wash(b.blob(x, y, 15, 12), { color: c, alpha: 0.95, blur: 0.8, edge: 0.9 });
    b.ctx.fillStyle = 'rgba(255,255,255,0.4)'; b.ctx.beginPath(); b.ctx.arc(x - 4, y - 4, 3, 0, 6.3); b.ctx.fill();
  });
  b.cloud(iw * 0.15, ih * 0.2, 12, { color: INK, alpha: 0.6, w: 2.5 });
});
M['scroll-sea'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  sky(b, iw, ih, { top: '#dfe0d6', bottom: '#e9e6da' });
  b.mountains(iw, ih, { base: 0.35, alpha: 0.14, peak: 0.15 });
  for (let row = 0; row < 4; row++) wave(b, -20, ih * (0.55 + row * 0.12), iw + 40, { n: 6, s: 0.9 + row * 0.15 });
  for (let i = 0; i < 8; i++) {
    const x = iw * (0.1 + i * 0.11), y = ih * (0.5 + (i % 3) * 0.08);
    figure(b, x, y, 34, { robe: INK, accent: ['#C03A2A', '#4A8C5C', '#C8A04A'][i % 3], head: 'bun', alpha: 0.85 });
  }
});
M['scroll-papercut'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  const cx = iw / 2, cy = ih / 2, R = ih * 0.42;
  b.ctx.fillStyle = CINNABAR; b.ctx.beginPath(); b.ctx.arc(cx, cy, R, 0, 6.3); b.ctx.fill();
  b.ctx.save(); b.ctx.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 6.283;
    b.ctx.save(); b.ctx.translate(cx, cy); b.ctx.rotate(a);
    b.ctx.beginPath(); b.ctx.ellipse(R * 0.62, 0, R * 0.2, R * 0.07, 0, 0, 6.3); b.ctx.fill();
    b.ctx.beginPath(); b.ctx.arc(R * 0.88, 0, R * 0.05, 0, 6.3); b.ctx.fill();
    b.ctx.beginPath(); b.ctx.moveTo(R * 0.22, 0); b.ctx.lineTo(R * 0.36, R * 0.05); b.ctx.lineTo(R * 0.36, -R * 0.05); b.ctx.fill();
    b.ctx.restore();
  }
  b.ctx.beginPath(); b.ctx.arc(cx, cy, R * 0.14, 0, 6.3); b.ctx.fill();
  b.ctx.restore();
}, { bg: '#f1e6cf' });
M['scroll-ding'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  b.ctx.fillStyle = '#E8C872'; b.ctx.fillRect(0, 0, iw, ih);
  const g = b.ctx.createRadialGradient(iw / 2, ih / 2, 0, iw / 2, ih / 2, ih * 0.6);
  g.addColorStop(0, 'rgba(255,248,220,0.8)'); g.addColorStop(1, 'rgba(255,248,220,0)');
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, iw, ih);
  b.ctx.fillStyle = CINNABAR; b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
  b.ctx.font = `${ih * 0.78}px ${FONT_BRUSH}`;
  b.ctx.fillText('定', iw / 2, ih * 0.54);
  b.splatter(iw * 0.7, ih * 0.3, 30, { color: CINNABAR, n: 16, size: 2.4 });
}, { bg: '#E8C872' });
M['scroll-kunlun'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  sky(b, iw, ih, { top: '#cfd8d6', bottom: '#eee8da', sun: [iw * 0.75, ih * 0.18, 10, GOLD] });
  for (const [x, y, s] of [[0.3, 0.45, 1], [0.65, 0.35, 0.8], [0.85, 0.6, 0.6]]) {
    const px = iw * x, py = ih * y, W = 70 * s, H = 90 * s;
    b.wash([[px - W, py], [px - W * 0.3, py - H], [px, py - H * 0.8], [px + W * 0.4, py - H * 1.1], [px + W, py], [px + W * 0.4, py + H * 0.35], [px - W * 0.4, py + H * 0.3]], { color: '#2f3b33', alpha: 0.7, blur: 2, edge: 0.6 });
    b.wash([[px - W * 0.8, py], [px + W * 0.8, py], [px, py + H * 0.4]], { color: JADE, alpha: 0.35, blur: 3, edge: 0 });
    b.cloud(px - W * 0.9, py + 10 * s, 10 * s, { color: '#fff', alpha: 0.8, w: 3 * s });
  }
  b.mist(iw, ih, ih * 0.9, { alpha: 0.6 });
});
M['scroll-shadow'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  const g = b.ctx.createRadialGradient(iw / 2, ih / 2, 0, iw / 2, ih / 2, ih * 0.8);
  g.addColorStop(0, '#f7d9a0'); g.addColorStop(0.6, '#d9964a'); g.addColorStop(1, '#6a3a18');
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, iw, ih);
  const f = figure(b, iw * 0.5, ih * 0.95, ih * 0.82, { robe: '#3a0e08', accent: CINNABAR, head: 'bun', sleeve: 1.5, alpha: 0.95 });
  // puppet rods
  b.stroke([[f.lh[0], f.lh[1]], [f.lh[0] - 20, ih]], { w: 1.6, dry: 0 });
  b.stroke([[f.rh[0], f.rh[1]], [f.rh[0] + 24, ih]], { w: 1.6, dry: 0 });
  b.stroke([[f.head[0], f.head[1] + 16], [f.head[0] + 6, ih]], { w: 1.6, dry: 0 });
}, { bg: '#e0a860' });

// 浊灵
function murk(b, w, h, { top = '#3a3632', bottom = '#8a8070' } = {}) {
  sky(b, w, h, { top, bottom });
  for (let i = 0; i < 6; i++) b.wash(b.blob(b.r(0, w), b.r(0, h), b.r(40, 100), b.r(20, 50)), { color: INK, alpha: 0.25, blur: 14, edge: 0 });
}
M.mist = (b, w, h) => {
  murk(b, w, h);
  for (let i = 0; i < 3; i++) {
    const x = w * (0.25 + i * 0.25), y = h * (0.55 + (i % 2) * 0.12);
    b.wash(b.blob(x, y, 40, 34, { wob: 0.35 }), { color: INK, alpha: 0.85, blur: 6, edge: 0.3 });
    eye(b.ctx, x - 8, y - 6, 2.4, '#dcd6c8'); eye(b.ctx, x + 8, y - 6, 2.4, '#dcd6c8');
  }
};
M.mist2 = (b, w, h) => {
  murk(b, w, h, { top: '#2c3a2e', bottom: '#7c8474' });
  b.wash(b.blob(w / 2, h * 0.55, 90, 70, { wob: 0.4 }), { color: INK, alpha: 0.9, blur: 8, edge: 0.3 });
  b.ctx.fillStyle = 'rgba(220,210,190,0.35)'; b.ctx.font = `22px ${FONT_BRUSH}`;
  for (let i = 0; i < 14; i++) b.ctx.fillText('之乎者也天地人和'[i % 8], b.r(20, w - 20), b.r(20, h - 20));
  eye(b.ctx, w / 2 - 14, h * 0.5, 3, JADE); eye(b.ctx, w / 2 + 14, h * 0.5, 3, JADE);
};
M.shade = (b, w, h) => {
  murk(b, w, h, { top: '#2a2530', bottom: '#6e6878' });
  const pts = [[w * 0.5, h * 0.1], [w * 0.62, h * 0.3], [w * 0.7, h * 0.95], [w * 0.3, h * 0.95], [w * 0.38, h * 0.3]];
  b.wash(pts, { color: INK, alpha: 0.9, blur: 5, edge: 0.3 });
  eye(b.ctx, w * 0.46, h * 0.24, 3, '#b8a0d8'); eye(b.ctx, w * 0.54, h * 0.24, 3, '#b8a0d8');
};
M.stele = (b, w, h) => {
  murk(b, w, h, { top: '#35302a', bottom: '#8a7c66' });
  b.wash([[w * 0.35, h * 0.95], [w * 0.36, h * 0.25], [w * 0.5, h * 0.12], [w * 0.62, h * 0.3], [w * 0.58, h * 0.5], [w * 0.66, h * 0.95]], { color: '#4a4238', alpha: 0.95, blur: 1.5, edge: 0.8, smooth: false });
  for (let i = 0; i < 5; i++) b.stroke([[w * 0.42, h * (0.35 + i * 0.1)], [w * 0.56, h * (0.35 + i * 0.1)]], { w: 2, color: '#9a8c70', alpha: 0.5, dry: 0.7 });
  b.splatter(w / 2, h * 0.5, 120, { n: 40, alpha: 0.6, size: 3 });
};
M.husk = (b, w, h) => {
  murk(b, w, h, { top: '#1e1a18', bottom: '#5a4a3a' });
  const f = figure(b, w * 0.5, h * 1.02, h * 0.95, { width: 2, robe: '#141210', head: 'long', sleeve: 1.4, lean: 0.3, stance: 1.5 });
  for (let i = 0; i < 10; i++) {
    const x0 = f.sh[0] + b.r(-50, 50), y0 = f.sh[1] + b.r(0, 150);
    b.stroke([[x0, y0], [x0 + b.r(-15, 15), y0 + b.r(10, 25)]], { w: 1.8, color: '#e2b964', alpha: 0.45, dry: 0.2 });
  }
  eye(b.ctx, f.head[0] - 4, f.head[1], 3, '#ff6a3a');
};

// ───────────────────────────── 第二章 · 长安 ─────────────────────────────
function moonDisc(b, x, y, r, { color = '250,244,225', glow = 1.8 } = {}) {
  const g = b.ctx.createRadialGradient(x, y, r * 0.2, x, y, r * glow);
  g.addColorStop(0, `rgba(${color},0.95)`); g.addColorStop(0.55, `rgba(${color},0.9)`); g.addColorStop(0.56, `rgba(${color},0.16)`); g.addColorStop(1, `rgba(${color},0)`);
  b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(x, y, r * glow, 0, Math.PI * 2); b.ctx.fill();
}
/** Seven-storey pagoda silhouette (大雁塔), feet at (x, y). */
function pagoda(b, x, y, hgt, { color = '#3a2e26', alpha = 0.85 } = {}) {
  const tiers = 7, th = hgt / (tiers + 0.8);
  for (let i = 0; i < tiers; i++) {
    const w0 = hgt * (0.3 - i * 0.03), yb = y - i * th, yt = yb - th * 0.82;
    b.wash([[x - w0 / 2, yb], [x + w0 / 2, yb], [x + w0 * 0.44, yt], [x - w0 * 0.44, yt]], { color, alpha, blur: 0.8, edge: 0.4, smooth: false });
    b.stroke([[x - w0 * 0.66, yt + 3], [x - w0 * 0.3, yt - 2], [x + w0 * 0.3, yt - 2], [x + w0 * 0.66, yt + 3]], { w: Math.max(2, th * 0.14), color, alpha, dry: 0.2 });
    b.ctx.fillStyle = 'rgba(255,210,140,0.55)'; b.ctx.fillRect(x - th * 0.08, yb - th * 0.55, th * 0.16, th * 0.3);
  }
  b.stroke([[x, y - tiers * th + th * 0.2], [x, y - tiers * th - th * 0.6]], { w: Math.max(2, th * 0.12), color, alpha, dry: 0 });
}
function cup(b, x, y, s = 1, color = GOLD) {
  b.wash([[x - 9 * s, y - 6 * s], [x + 9 * s, y - 6 * s], [x + 5 * s, y + 4 * s], [x - 5 * s, y + 4 * s]], { color, alpha: 0.95, blur: 0.5, edge: 0.8, smooth: false });
  b.stroke([[x, y + 4 * s], [x, y + 10 * s]], { w: 2.4 * s, color, dry: 0 });
  b.stroke([[x - 6 * s, y + 10 * s], [x + 6 * s, y + 10 * s]], { w: 2.4 * s, color, dry: 0 });
}
function floatGlyphs(b, w, h, str, { color = '255,226,160', n = 10, size = 22, y0 = 0, y1 = 1 } = {}) {
  b.ctx.save(); b.ctx.font = `${size}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    b.ctx.fillStyle = `rgba(${color},${b.r(0.35, 0.8).toFixed(2)})`;
    b.ctx.fillText(str[i % str.length], b.r(w * 0.06, w * 0.94), b.r(h * y0, h * y1));
  }
  b.ctx.restore();
}

M.poet = (b, w, h) => {
  sky(b, w, h, { top: '#1c2436', bottom: '#58607a' });
  moonDisc(b, w * 0.7, h * 0.24, h * 0.13);
  floatGlyphs(b, w, h, '长安一片月万户捣衣声', { n: 12, y0: 0.05, y1: 0.6 });
  b.mountains(w, h, { base: 0.82, alpha: 0.3, color: '#1a1e2a' });
  const f = figure(b, w * 0.42, h * 0.98, h * 0.72, { robe: '#e4dccb', accent: GOLD, head: 'bun', sleeve: 1.6, lean: -0.35, stance: 0.8, alpha: 0.9 });
  // cup lifted to the moon
  const cx = f.head[0] + 34, cy = f.head[1] - 26;
  b.stroke([[f.rh[0], f.rh[1]], [cx - 2, cy + 12]], { w: 6, color: '#e4dccb', alpha: 0.9, dry: 0.4 });
  cup(b, cx, cy, 1.1);
  // wine jar at the feet
  const jx = w * 0.16, jy = h * 0.9;
  b.wash(b.blob(jx, jy, 22, 26), { color: '#6a3a1e', alpha: 0.9, blur: 1, edge: 0.8 });
  b.wash([[jx - 9, jy - 26], [jx + 9, jy - 26], [jx + 7, jy - 34], [jx - 7, jy - 34]], { color: CINNABAR, alpha: 0.9, blur: 0.5, edge: 0.5, smooth: false });
  b.ctx.fillStyle = '#f0e0b0'; b.ctx.font = `20px ${FONT_BRUSH}`; b.ctx.textAlign = 'center'; b.ctx.fillText('酒', jx, jy + 7);
};
M.cottage = (b, w, h) => {
  sky(b, w, h, { top: '#8a8272', bottom: '#cfc4ae' });
  // wind-driven rain
  for (let i = 0; i < 40; i++) { const x = b.r(0, w * 1.2), y = b.r(0, h); b.stroke([[x, y], [x - 16, y + 30]], { w: 1.2, color: '#4a4a44', alpha: 0.35, dry: 0 }); }
  // thatched hut, roof straw torn off by the wind
  const hx = w * 0.64, hy = h * 0.72;
  b.wash([[hx - 70, hy], [hx + 70, hy], [hx + 70, hy + 70], [hx - 70, hy + 70]], { color: '#5a4a38', alpha: 0.8, blur: 1, edge: 0.6, smooth: false });
  b.wash([[hx - 92, hy + 4], [hx - 10, hy - 56], [hx + 92, hy + 4]], { color: '#a08650', alpha: 0.9, blur: 1, edge: 0.7, smooth: false });
  for (let i = 0; i < 14; i++) { const x = hx + b.r(-60, 80), y = hy - b.r(0, 50); b.stroke([[x, y], [x - b.r(40, 110), y - b.r(30, 90)]], { w: 2, color: '#b89a5a', alpha: 0.75, dry: 0.3, taper: [0.1, 0.8] }); }
  b.ctx.fillStyle = 'rgba(255,200,120,0.7)'; b.ctx.fillRect(hx - 18, hy + 26, 20, 22);
  const f = figure(b, w * 0.26, h * 0.98, h * 0.66, { robe: '#3a3026', accent: OCHRE, head: 'bun', sleeve: 1.1, lean: 0.4, width: 0.9 });
  b.stroke([[f.rh[0] + 4, f.rh[1] - 10], [f.rh[0] + 12, h * 0.99]], { w: 4, color: '#2a221a', dry: 0.5 });
};
M.river = (b, w, h) => {
  sky(b, w, h, { top: '#c8ccc4', bottom: '#e8e4d8', sun: [w * 0.22, h * 0.18, h * 0.05, '#f6f0dc'] });
  // 赤壁 cliff
  b.wash([[w * 0.62, 0], [w, 0], [w, h * 0.78], [w * 0.78, h * 0.7], [w * 0.7, h * 0.4], [w * 0.74, h * 0.2]], { color: '#8a3a2a', alpha: 0.8, blur: 2, edge: 0.7 });
  for (let i = 0; i < 8; i++) b.stroke([[w * b.r(0.7, 0.98), h * b.r(0.02, 0.6)], [w * b.r(0.7, 0.98), h * b.r(0.1, 0.7)]], { w: 3, color: '#4a1a10', alpha: 0.5, dry: 0.7 });
  for (let row = 0; row < 5; row++) wave(b, -30, h * (0.62 + row * 0.08), w + 60, { n: 6, s: 1 + row * 0.2 });
  // boat with a figure in straw cape
  const bx = w * 0.38, by = h * 0.66;
  b.wash([[bx - 60, by], [bx + 60, by], [bx + 40, by + 14], [bx - 44, by + 14]], { color: '#3a2a1e', alpha: 0.95, blur: 0.6, edge: 0.6, smooth: false });
  const f = figure(b, bx - 6, by + 2, h * 0.3, { robe: '#5a5040', accent: null, head: 'bun', sleeve: 1, width: 1.2 });
  b.wash([[f.head[0] - 22, f.head[1] - 4], [f.head[0], f.head[1] - 20], [f.head[0] + 22, f.head[1] - 4]], { color: '#6a5a3a', alpha: 0.95, blur: 0.5, edge: 0.5, smooth: false });
  b.mist(w, h, h * 0.62, { alpha: 0.4 });
};
M.dancer = (b, w, h) => {
  sky(b, w, h, { top: '#e8d8c0', bottom: '#f4e8d4' });
  const f = figure(b, w * 0.5, h * 0.94, h * 0.7, { robe: '#5a1a14', accent: RED, head: 'bun', sleeve: 1.7, lean: 0.5, stance: 1.5, width: 0.9 });
  // two swords and the light they leave
  for (const [hx, hy, dir] of [[f.lh[0], f.lh[1], -1], [f.rh[0], f.rh[1], 1]]) {
    const arc = []; for (let t = 0; t <= 1; t += 0.05) arc.push([w / 2 + dir * Math.cos(t * 2.6 - 0.3) * w * 0.4, h * 0.45 - Math.sin(t * 2.6 - 0.3) * h * 0.32]);
    b.stroke(arc, { w: 9, color: RED, alpha: 0.55, dry: 0.5, taper: [0.02, 0.9] });
    b.stroke(arc, { w: 3, color: '#5a5a66', alpha: 0.6, dry: 0.2, taper: [0.02, 0.9] });
    b.stroke([[hx, hy], [hx + dir * 50, hy - 60]], { w: 4, color: '#3d3d46', dry: 0, taper: [0.02, 0.6] });
  }
  b.splatter(w * 0.5, h * 0.4, 140, { n: 24, color: RED, alpha: 0.5, size: 2 });
};
M['scroll-type'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  b.ctx.fillStyle = '#6a4a2a'; b.ctx.fillRect(iw * 0.08, ih * 0.1, iw * 0.84, ih * 0.8);
  const cols = 5, rows = 6, cw = iw * 0.84 / cols, ch = ih * 0.8 / rows, chars = '文脉不绝薪火相传诗书礼乐天下同文古今一脉字字千秋';
  b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = iw * 0.08 + c * cw, y = ih * 0.1 + r * ch;
    b.ctx.fillStyle = mix('#c8a47a', '#8a6a48', b.R() * 0.5); b.ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
    b.ctx.save(); b.ctx.translate(x + cw / 2, y + ch / 2); b.ctx.scale(-1, 1);
    b.ctx.fillStyle = '#3a2618'; b.ctx.font = `${ch * 0.62}px ${FONT_BRUSH}`; b.ctx.fillText(chars[(r * cols + c) % chars.length], 0, 2);
    b.ctx.restore();
  }
}, { bg: '#e8dcc4' });
M['scroll-tea'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  sky(b, iw, ih, { top: '#e4e4d4', bottom: '#f1ecdc' });
  // tea branch
  b.stroke([[0, ih * 0.2], [iw * 0.4, ih * 0.26], [iw * 0.7, ih * 0.16]], { w: 4, dry: 0.5 });
  for (let i = 0; i < 9; i++) { const x = iw * (0.08 + i * 0.08), y = ih * (0.18 + (i % 2) * 0.1); b.wash(b.blob(x, y, 12, 6), { color: JADE, alpha: 0.85, blur: 0.6, edge: 0.6 }); }
  // bowl + steam
  const cx = iw / 2, cy = ih * 0.74;
  b.wash([[cx - 52, cy - 18], [cx + 52, cy - 18], [cx + 36, cy + 22], [cx - 36, cy + 22]], { color: '#3a3a36', alpha: 0.9, blur: 0.8, edge: 0.8 });
  b.ctx.fillStyle = 'rgba(160,170,90,0.9)'; b.ctx.beginPath(); b.ctx.ellipse(cx, cy - 18, 50, 7, 0, 0, 6.3); b.ctx.fill();
  for (let k = -1; k <= 1; k++) { const st = []; for (let t = 0; t < 1; t += 0.06) st.push([cx + k * 16 + Math.sin(t * 8 + k) * 10, cy - 26 - t * ih * 0.3]); b.stroke(st, { w: 4, color: '#9a9a90', alpha: 0.45, dry: 0.3, taper: [0.1, 0.9] }); }
});

M.inkling = (b, w, h) => {
  murk(b, w, h, { top: '#2e2a34', bottom: '#7a6e64' });
  floatGlyphs(b, w, h, '床前明月光疑是', { color: '220,210,190', n: 8, size: 26, y0: 0.1, y1: 0.5 });
  for (let i = 0; i < 2; i++) {
    const x = w * (0.35 + i * 0.3), y = h * (0.62 + i * 0.06);
    b.wash(b.blob(x, y, 38, 32, { wob: 0.4 }), { color: INK, alpha: 0.92, blur: 3, edge: 0.3 });
    b.splatter(x, y, 50, { n: 18, alpha: 0.8, size: 3 });
    eye(b.ctx, x - 9, y - 6, 2.2, '#d8d0c0'); eye(b.ctx, x + 9, y - 6, 2.2, '#d8d0c0');
  }
};
M.scholarGhost = (b, w, h) => {
  murk(b, w, h, { top: '#3a3430', bottom: '#8a7e6a' });
  pagoda(b, w * 0.8, h * 0.8, h * 0.62, { color: '#2a2420', alpha: 0.5 });
  const f = figure(b, w * 0.42, h * 0.98, h * 0.78, { robe: '#d8d0c0', accent: '#9a9080', head: 'hat', sleeve: 1.2, alpha: 0.55 });
  // blank name placard held in front
  b.wash([[f.sh[0] - 22, f.sh[1] + 30], [f.sh[0] + 22, f.sh[1] + 30], [f.sh[0] + 22, f.sh[1] + 90], [f.sh[0] - 22, f.sh[1] + 90]], { color: '#e8dcc0', alpha: 0.7, blur: 0.6, edge: 0.8, smooth: false });
  for (let k = 0; k < 3; k++) b.stroke([[f.sh[0] - 6, f.sh[1] + 42 + k * 16], [f.sh[0] + 6, f.sh[1] + 44 + k * 16]], { w: 3, color: '#8a8070', alpha: 0.35, dry: 0.8 });
};
M.lute = (b, w, h) => {
  murk(b, w, h, { top: '#2a2432', bottom: '#6e6270' });
  const cx = w * 0.5, cy = h * 0.62;
  b.wash(b.blob(cx, cy, 58, 74, { wob: 0.05 }), { color: '#5a3a24', alpha: 0.9, blur: 1, edge: 0.8 });
  b.wash([[cx - 12, cy - 70], [cx + 12, cy - 70], [cx + 8, cy - 160], [cx - 8, cy - 160]], { color: '#4a2e1c', alpha: 0.95, blur: 0.6, edge: 0.6, smooth: false });
  for (let k = -1.5; k <= 1.5; k++) {
    const x = cx + k * 7, broken = k > 0;
    b.stroke(broken ? [[x, cy + 50], [x + 2, cy - 10], [x + 14 * k, cy - 30]] : [[x, cy + 50], [x * 0.2 + cx * 0.8, cy - 155]], { w: 1.4, color: '#e8d8a0', alpha: 0.85, dry: 0 });
  }
  eye(b.ctx, cx - 12, cy - 4, 2.4, '#c8b0e0'); eye(b.ctx, cx + 12, cy - 4, 2.4, '#c8b0e0');
};
M.nameplate = (b, w, h) => {
  murk(b, w, h, { top: '#342e28', bottom: '#8a7a62' });
  // brick wall of carved names, fading from bottom to top
  b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
  const names = '王李张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗';
  for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
    const x = w * (0.1 + c * 0.2) + (r % 2) * w * 0.05, y = h * (0.1 + r * 0.12);
    b.ctx.fillStyle = `rgba(90,78,62,${0.5 + r * 0.05})`; b.ctx.fillRect(x - w * 0.09, y - h * 0.05, w * 0.18, h * 0.1);
    b.ctx.fillStyle = `rgba(220,206,176,${Math.max(0.05, 0.65 - r * 0.09 + b.r(-0.1, 0.1))})`;
    b.ctx.font = `${h * 0.06}px ${FONT_BRUSH}`; b.ctx.fillText(names[(r * 5 + c) % names.length], x, y);
  }
  b.wash(b.blob(w / 2, h * 0.8, 70, 50, { wob: 0.3 }), { color: INK, alpha: 0.7, blur: 8, edge: 0 });
  eye(b.ctx, w / 2 - 12, h * 0.78, 2.6, '#e8d8b0'); eye(b.ctx, w / 2 + 12, h * 0.78, 2.6, '#e8d8b0');
};
M.dancerGhost = (b, w, h) => {
  murk(b, w, h, { top: '#1c2034', bottom: '#5a5a78' });
  const f = figure(b, w * 0.5, h * 0.96, h * 0.74, { robe: '#c8c8e0', accent: '#8a7aa8', head: 'bun', sleeve: 1.8, lean: -0.4, stance: 1.4, alpha: 0.5 });
  for (const [x0, y0, d] of [[f.lh[0], f.lh[1], -1], [f.rh[0], f.rh[1], 1]]) {
    const pts = []; for (let t = 0; t < 1; t += 0.05) pts.push([x0 + d * t * w * 0.35, y0 - Math.sin(t * 4) * 40 - t * h * 0.2]);
    b.stroke(pts, { w: 12, color: '#d8d0f0', alpha: 0.45, dry: 0.5, taper: [0.1, 0.9] });
  }
};
M['seal-ink'] = (b, w, h) => talisman(b, w, h, null, { glyph: '忘', dark: true });
M.nishang = (b, w, h) => {
  sky(b, w, h, { top: '#0e1226', bottom: '#3a3a5a' });
  moonDisc(b, w * 0.5, h * 0.28, h * 0.16, { color: '230,232,250' });
  // broken strings crossing the sky
  for (let k = 0; k < 5; k++) {
    const y = h * (0.12 + k * 0.1);
    b.stroke([[0, y], [w * b.r(0.3, 0.45), y + b.r(-6, 6)]], { w: 1.5, color: '#d8d0a0', alpha: 0.6, dry: 0 });
    b.stroke([[w * b.r(0.55, 0.7), y + b.r(-6, 6)], [w, y + 4]], { w: 1.5, color: '#d8d0a0', alpha: 0.6, dry: 0 });
  }
  const f = figure(b, w * 0.5, h * 1.04, h * 0.84, { robe: '#b8b8d8', accent: '#6a5a90', head: 'bun', sleeve: 2, width: 1.4, alpha: 0.6 });
  for (const d of [-1, 1]) {
    const pts = []; for (let t = 0; t < 1; t += 0.04) pts.push([w / 2 + d * (30 + t * w * 0.48), f.sh[1] + 20 - Math.sin(t * 3.4) * h * 0.26]);
    b.stroke(pts, { w: 22, color: '#dcd4f4', alpha: 0.4, dry: 0.5, taper: [0.05, 0.9] });
  }
  floatGlyphs(b, w, h, '霓裳羽衣曲', { color: '220,220,255', n: 8, size: 24, y0: 0.5, y1: 0.95 });
};

// ───────────────────────────── 第三章 · 古戏台 ─────────────────────────────
/** Warm lamp-lit shadow-play glow used across the 非遗 motifs. */
function lampGlow(b, w, h, { cx = 0.5, cy = 0.5, inner = '#f7dca8', outer = '#8a5a28' } = {}) {
  const g = b.ctx.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, h * 0.95);
  g.addColorStop(0, inner); g.addColorStop(0.55, mix(inner, outer, 0.6)); g.addColorStop(1, outer);
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
}
function curtainFrame(b, w, h, { color = '#5a1410', alpha = 0.95 } = {}) {
  b.wash([[0, 0], [w, 0], [w, h * 0.12], [w * 0.7, h * 0.16], [w * 0.3, h * 0.1], [0, h * 0.15]], { color, alpha, blur: 2, edge: 0.4 });
  for (const x of [0.04, 0.96]) b.wash([[w * (x - 0.05), 0], [w * (x + 0.05), 0], [w * (x + 0.04), h], [w * (x - 0.04), h]], { color, alpha: alpha * 0.9, blur: 2, edge: 0.4, smooth: false });
}
function snowflakes(b, w, h, n = 40) {
  for (let i = 0; i < n; i++) {
    const x = b.r(0, w), y = b.r(0, h), r = b.r(1.5, 4);
    b.ctx.fillStyle = `rgba(250,250,255,${b.r(0.4, 0.95).toFixed(2)})`;
    b.ctx.beginPath(); b.ctx.arc(x, y, r, 0, 6.28); b.ctx.fill();
  }
}

M.snowOath = (b, w, h) => {          // 关汉卿 · 六月飞雪
  sky(b, w, h, { top: '#3a3a44', bottom: '#8e8c92' });
  b.mountains(w, h, { base: 0.78, alpha: 0.2, color: '#2a2a32' });
  // white silk hung from above (血溅白练)
  b.wash([[w * 0.66, 0], [w * 0.82, 0], [w * 0.8, h * 0.74], [w * 0.64, h * 0.7]], { color: '#f0ece0', alpha: 0.92, blur: 1.5, edge: 0.5 });
  b.splatter(w * 0.74, h * 0.34, 46, { color: CINNABAR, n: 22, size: 3.4, alpha: 0.75 });
  const f = figure(b, w * 0.4, h * 0.97, h * 0.76, { robe: '#2a2630', accent: '#6a6a78', head: 'hat', sleeve: 1.3, width: 1.1, lean: -0.1 });
  for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 22], [f.head[0] + k * 6, f.head[1] + 36]], { w: 2.4, color: '#4a4a52', dry: 0.4 });
  // brush in hand, pointed at heaven
  b.stroke([[f.rh[0], f.rh[1]], [f.rh[0] + 26, f.rh[1] - 40]], { w: 5, color: '#3a2a1e', dry: 0.2, taper: [0.1, 0.5] });
  snowflakes(b, w, h, 52);
};
M.peony = (b, w, h) => {             // 汤显祖 · 牡丹亭
  sky(b, w, h, { top: '#d8dcc8', bottom: '#f2ecda' });
  b.mist(w, h, h * 0.62, { alpha: 0.5 });
  // garden railing
  b.stroke([[0, h * 0.72], [w, h * 0.7]], { w: 5, color: '#5a4030', dry: 0.5 });
  for (let x = 0.06; x < 1; x += 0.12) b.stroke([[w * x, h * 0.72], [w * x, h * 0.86]], { w: 3.5, color: '#5a4030', alpha: 0.8, dry: 0.4 });
  const f = figure(b, w * 0.36, h * 0.94, h * 0.66, { robe: '#e6dcc8', accent: '#b0567a', head: 'bun', sleeve: 1.5, lean: 0.15, alpha: 0.85 });
  // peonies in bloom around her
  for (const [x, y, r] of [[0.74, 0.5, 26], [0.86, 0.66, 18], [0.64, 0.74, 15], [0.9, 0.38, 12]]) {
    const cx = w * x, cy = h * y;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * 6.28;
      b.wash(b.blob(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.5, r * 0.4, { wob: 0.3 }), { color: k % 2 ? '#d98aa8' : '#c05a80', alpha: 0.8, blur: 1.4, edge: 0.4 });
    }
    b.wash(b.blob(cx, cy, r * 0.28, r * 0.24), { color: '#f4e2a0', alpha: 0.9, blur: 0.8, edge: 0.6 });
  }
  b.stroke([[w * 0.62, h], [w * 0.7, h * 0.78], [w * 0.88, h * 0.62]], { w: 4, color: JADE, alpha: 0.7, dry: 0.5 });
  // a dream-mist figure echoing her (还魂)
  figure(b, w * 0.5, h * 0.9, h * 0.6, { robe: '#dfe8e0', accent: null, head: 'bun', sleeve: 1.4, lean: -0.2, alpha: 0.28 });
};
M.loom = (b, w, h) => {              // 黄道婆 · 纺织
  sky(b, w, h, { top: '#e0d4bc', bottom: '#f2e8d6' });
  // loom frame
  const lx = w * 0.56, ly = h * 0.92, lw = w * 0.42, lh = h * 0.62;
  b.wash([[lx - lw * 0.5, ly], [lx + lw * 0.5, ly], [lx + lw * 0.5, ly - lh], [lx - lw * 0.5, ly - lh]], { color: '#6a4a2e', alpha: 0.35, blur: 3, edge: 0.3 });
  for (const s of [-0.5, 0.5]) b.stroke([[lx + lw * s, ly], [lx + lw * s, ly - lh]], { w: 8, color: '#4a3220', dry: 0.5 });
  b.stroke([[lx - lw * 0.56, ly - lh], [lx + lw * 0.56, ly - lh]], { w: 8, color: '#4a3220', dry: 0.5 });
  // warp threads + woven cloth
  for (let k = 0; k <= 14; k++) { const x = lx - lw * 0.46 + (k / 14) * lw * 0.92; b.stroke([[x, ly - lh + 6], [x, ly - 10]], { w: 1.4, color: '#c8b48a', alpha: 0.85, dry: 0 }); }
  b.wash([[lx - lw * 0.46, ly - 10], [lx + lw * 0.46, ly - 10], [lx + lw * 0.46, ly - lh * 0.4], [lx - lw * 0.46, ly - lh * 0.4]], { color: '#e8dcc0', alpha: 0.9, blur: 1, edge: 0.5, smooth: false });
  for (let k = 0; k < 7; k++) b.stroke([[lx - lw * 0.46, ly - lh * 0.4 + k * 6], [lx + lw * 0.46, ly - lh * 0.4 + k * 6]], { w: 2, color: '#b8a480', alpha: 0.6, dry: 0.3 });
  const f = figure(b, w * 0.24, h * 0.96, h * 0.62, { robe: '#5a4a38', accent: '#8a6a44', head: 'bun', sleeve: 1, width: 1.1, lean: 0.25 });
  b.stroke([[f.rh[0], f.rh[1]], [lx - lw * 0.42, ly - lh * 0.3]], { w: 4, color: '#5a4a38', alpha: 0.85, dry: 0.4 });
  // cotton bolls
  for (let i = 0; i < 6; i++) b.wash(b.blob(w * b.r(0.04, 0.2), h * b.r(0.62, 0.9), 9, 8, { wob: 0.4 }), { color: '#f4f0e4', alpha: 0.95, blur: 1, edge: 0.4 });
};
M.flute = (b, w, h) => {             // 魏良辅 · 水磨调
  sky(b, w, h, { top: '#243040', bottom: '#8a97a6' });
  // still water with a slow ripple
  for (let row = 0; row < 4; row++) wave(b, -20, h * (0.74 + row * 0.07), w + 40, { n: 5, s: 0.8 + row * 0.15, color: '#3a5a7a' });
  const mx = w * 0.74, my = h * 0.24;
  const g = b.ctx.createRadialGradient(mx, my, 0, mx, my, h * 0.3);
  g.addColorStop(0, 'rgba(236,240,250,0.85)'); g.addColorStop(1, 'rgba(236,240,250,0)');
  b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(mx, my, h * 0.3, 0, 6.28); b.ctx.fill();
  const f = figure(b, w * 0.44, h * 0.9, h * 0.66, { robe: '#dfe4ea', accent: '#4a6a8a', head: 'hat', sleeve: 1.3, alpha: 0.9 });
  // flute held crosswise
  b.stroke([[f.head[0] - 30, f.head[1] + 14], [f.head[0] + 40, f.head[1] + 8]], { w: 5, color: '#8a6a3a', dry: 0.1 });
  for (let k = 0; k < 6; k++) { b.ctx.fillStyle = '#2a2018'; b.ctx.beginPath(); b.ctx.arc(f.head[0] + 2 + k * 6, f.head[1] + 11 - k * 0.5, 1.4, 0, 6.28); b.ctx.fill(); }
  // the long drawn-out note
  b.ctx.font = `${h * 0.075}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
  '水磨腔'.split('').forEach((c, i) => { b.ctx.fillStyle = `rgba(230,238,250,${0.7 - i * 0.14})`; b.ctx.fillText(c, w * (0.16 + i * 0.07), h * (0.3 + i * 0.1)); });
  b.mist(w, h, h * 0.74, { alpha: 0.35, color: '#c8d4e0' });
};
M['scroll-embroidery'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  b.ctx.fillStyle = '#f0e4d0'; b.ctx.fillRect(0, 0, iw, ih);
  // embroidery hoop
  const cx = iw / 2, cy = ih * 0.52, R = ih * 0.4;
  b.ctx.strokeStyle = '#8a6a3a'; b.ctx.lineWidth = 8; b.ctx.beginPath(); b.ctx.arc(cx, cy, R, 0, 6.28); b.ctx.stroke();
  b.ctx.fillStyle = '#faf4e6'; b.ctx.beginPath(); b.ctx.arc(cx, cy, R - 4, 0, 6.28); b.ctx.fill();
  b.ctx.save(); b.ctx.beginPath(); b.ctx.arc(cx, cy, R - 4, 0, 6.28); b.ctx.clip();
  // a cat, the classic 双面绣 subject — same body, two directions of gaze
  b.wash(b.blob(cx, cy + R * 0.22, R * 0.52, R * 0.36, { wob: 0.15 }), { color: '#d8cdb8', alpha: 0.9, blur: 1.5, edge: 0.6 });
  b.wash(b.blob(cx - R * 0.3, cy - R * 0.2, R * 0.27, R * 0.25, { wob: 0.1 }), { color: '#e0d6c2', alpha: 0.95, blur: 1, edge: 0.7 });
  b.wash([[cx - R * 0.52, cy - R * 0.34], [cx - R * 0.42, cy - R * 0.6], [cx - R * 0.3, cy - R * 0.36]], { color: '#e0d6c2', alpha: 0.95, blur: 0.6, edge: 0.6 });
  b.wash([[cx - R * 0.2, cy - R * 0.38], [cx - R * 0.08, cy - R * 0.6], [cx - R * 0.02, cy - R * 0.32]], { color: '#e0d6c2', alpha: 0.95, blur: 0.6, edge: 0.6 });
  eye(b.ctx, cx - R * 0.38, cy - R * 0.2, 3.2, '#5aa86a'); eye(b.ctx, cx - R * 0.2, cy - R * 0.2, 3.2, '#5aa86a');
  b.stroke([[cx + R * 0.44, cy + R * 0.3], [cx + R * 0.7, cy + R * 0.02], [cx + R * 0.5, cy - R * 0.2]], { w: 7, color: '#d8cdb8', alpha: 0.9, dry: 0.3, taper: [0.1, 0.5] });
  // silk stitches catching the light
  for (let i = 0; i < 70; i++) {
    const a = b.r(0, 6.28), rr = Math.pow(b.R(), 0.6) * R;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.9;
    b.stroke([[x, y], [x + b.r(-6, 6), y + b.r(-6, 6)]], { w: 1.1, color: ['#c8a04a', '#b0567a', '#4a8c5c', '#8a8a9a'][i % 4], alpha: 0.5, dry: 0 });
  }
  b.ctx.restore();
  // needle and thread
  b.stroke([[iw * 0.82, ih * 0.1], [iw * 0.62, ih * 0.34]], { w: 2.4, color: '#b8b8c0', dry: 0 });
  b.stroke([[iw * 0.84, ih * 0.06], [iw * 0.92, ih * 0.2], [iw * 0.86, ih * 0.36]], { w: 1.6, color: CINNABAR, alpha: 0.85, dry: 0.2 });
}, { bg: '#f0e4d0' });
M['scroll-wazi'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
  lampGlow(b, iw, ih, { cy: 0.62, inner: '#f2d6a0', outer: '#6a3a1a' });
  // the railed enclosure of a 勾栏, seen from the back of the crowd
  b.wash([[iw * 0.18, ih * 0.3], [iw * 0.82, ih * 0.3], [iw * 0.86, ih * 0.62], [iw * 0.14, ih * 0.62]], { color: '#5a2a18', alpha: 0.85, blur: 1.5, edge: 0.5 });
  b.wash([[iw * 0.22, ih * 0.34], [iw * 0.78, ih * 0.34], [iw * 0.8, ih * 0.56], [iw * 0.2, ih * 0.56]], { color: '#f0d8a0', alpha: 0.6, blur: 2, edge: 0.3 });
  for (const x of [0.18, 0.82]) b.stroke([[iw * x, ih * 0.26], [iw * x, ih * 0.64]], { w: 6, color: '#3a1a10', dry: 0.4 });
  b.stroke([[iw * 0.12, ih * 0.28], [iw * 0.88, ih * 0.28]], { w: 7, color: '#3a1a10', dry: 0.4 });
  // two tiny performers on the platform
  figure(b, iw * 0.42, ih * 0.55, ih * 0.2, { robe: '#8a2a20', accent: GOLD, head: 'hat', alpha: 0.9 });
  figure(b, iw * 0.58, ih * 0.55, ih * 0.18, { robe: '#2a3a5a', accent: '#d8c8a0', head: 'bun', alpha: 0.9 });
  // audience heads in the dark foreground
  for (let i = 0; i < 16; i++) {
    const x = iw * (0.06 + (i % 8) * 0.12) + b.r(-8, 8), y = ih * (0.78 + Math.floor(i / 8) * 0.12);
    b.wash(b.blob(x, y, 11, 9), { color: '#2a1a12', alpha: 0.8, blur: 2, edge: 0.3 });
  }
  b.ctx.fillStyle = 'rgba(40,24,16,0.8)'; b.ctx.font = `${ih * 0.11}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
  b.ctx.fillText('瓦舍', iw * 0.5, ih * 0.16);
}, { bg: '#e8d0a0' });

M.puppet = (b, w, h) => {
  murk(b, w, h, { top: '#3a2a1a', bottom: '#a87a44' });
  lampGlow(b, w, h, { cy: 0.56, inner: 'rgba(250,220,160,0.55)', outer: 'rgba(60,30,12,0.75)' });
  const f = figure(b, w * 0.5, h * 0.84, h * 0.6, { robe: '#8a2a18', accent: GOLD, head: 'hat', sleeve: 1.2, lean: 0.3, stance: 1, alpha: 0.95 });
  // joints and snapped strings
  for (const [x, y] of [f.lh, f.rh, [f.head[0], f.head[1] - 6], [f.sh[0] - 18, f.sh[1] + 60]]) {
    b.ctx.fillStyle = 'rgba(40,24,14,0.9)'; b.ctx.beginPath(); b.ctx.arc(x, y, 3.4, 0, 6.28); b.ctx.fill();
    const cut = b.r(0.2, 0.55);
    b.stroke([[x, y], [x + b.r(-10, 10), y - h * cut]], { w: 1.3, color: '#f0dcb0', alpha: 0.8, dry: 0 });
  }
  b.splatter(w * 0.5, h * 0.5, 120, { color: '#2a1a0e', n: 22, alpha: 0.4, size: 2.4 });
};
M.mask = (b, w, h) => {
  murk(b, w, h, { top: '#2e2622', bottom: '#8a7a64' });
  const cx = w * 0.5, cy = h * 0.5, R = h * 0.34;
  b.wash(b.blob(cx, cy, R * 0.82, R, { wob: 0.08 }), { color: '#e8e0d0', alpha: 0.9, blur: 1.5, edge: 0.7 });
  // opera face paint, half faded away
  b.ctx.save(); b.ctx.beginPath(); b.ctx.ellipse(cx, cy, R * 0.82, R, 0, 0, 6.28); b.ctx.clip();
  b.wash([[cx - R * 0.9, cy - R], [cx, cy - R], [cx, cy + R], [cx - R * 0.9, cy + R]], { color: CINNABAR, alpha: 0.7, blur: 3, edge: 0.2, smooth: false });
  b.wash([[cx, cy - R], [cx + R * 0.9, cy - R], [cx + R * 0.9, cy + R], [cx, cy + R]], { color: '#b8b0a0', alpha: 0.28, blur: 6, edge: 0, smooth: false });
  b.stroke([[cx - R * 0.6, cy - R * 0.42], [cx - R * 0.16, cy - R * 0.3]], { w: 8, color: '#1a1a1a', alpha: 0.85, dry: 0.2, taper: [0.2, 0.5] });
  b.stroke([[cx + R * 0.16, cy - R * 0.3], [cx + R * 0.6, cy - R * 0.42]], { w: 8, color: '#1a1a1a', alpha: 0.35, dry: 0.5, taper: [0.2, 0.5] });
  b.stroke([[cx - R * 0.3, cy + R * 0.44], [cx, cy + R * 0.52], [cx + R * 0.3, cy + R * 0.44]], { w: 5, color: '#8a2a20', alpha: 0.5, dry: 0.4 });
  b.ctx.restore();
  eye(b.ctx, cx - R * 0.3, cy - R * 0.08, 3, '#f0e8d8'); eye(b.ctx, cx + R * 0.3, cy - R * 0.08, 3, '#f0e8d8');
  b.mist(w, h, h * 0.86, { alpha: 0.4, color: '#b8a888' });
};
M.gong = (b, w, h) => {
  murk(b, w, h, { top: '#2a2620', bottom: '#7a6a4a' });
  const cx = w * 0.5, cy = h * 0.5, R = h * 0.3;
  const g = b.ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, '#c8a04a'); g.addColorStop(0.7, '#8a6a2a'); g.addColorStop(1, '#5a4418');
  b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(cx, cy, R, 0, 6.28); b.ctx.fill();
  b.ctx.strokeStyle = 'rgba(60,44,16,0.8)'; b.ctx.lineWidth = 3;
  for (const r of [R * 0.9, R * 0.62]) { b.ctx.beginPath(); b.ctx.arc(cx, cy, r, 0, 6.28); b.ctx.stroke(); }
  b.ctx.fillStyle = '#6a5020'; b.ctx.beginPath(); b.ctx.arc(cx, cy, R * 0.3, 0, 6.28); b.ctx.fill();
  // a crack running through, and sound waves that stop short
  b.stroke([[cx - R, cy - R * 0.2], [cx - R * 0.3, cy + R * 0.1], [cx + R * 0.2, cy - R * 0.25], [cx + R, cy + R * 0.15]], { w: 3, color: '#1a1410', alpha: 0.9, dry: 0.3 });
  for (let k = 1; k <= 3; k++) {
    const rr = R * (1 + k * 0.3), arc = [];
    for (let t = -0.5; t <= 0.5; t += 0.05) arc.push([cx + Math.cos(t * 3.1) * rr, cy + Math.sin(t * 3.1) * rr]);
    b.stroke(arc, { w: 3, color: '#d8c890', alpha: 0.35 / k, dry: 0.6 });
  }
  b.stroke([[cx - R * 1.3, cy - R * 1.2], [cx + R * 1.3, cy - R * 1.2]], { w: 4, color: '#3a2a18', dry: 0.5 });
  b.stroke([[cx, cy - R], [cx, cy - R * 1.2]], { w: 3, color: '#3a2a18', dry: 0.3 });
};
M.robeGhost = (b, w, h) => {
  murk(b, w, h, { top: '#2a1418', bottom: '#8a5a44' });
  lampGlow(b, w, h, { cy: 0.6, inner: 'rgba(240,190,130,0.4)', outer: 'rgba(40,14,12,0.8)' });
  // an empty court robe holding its own shape
  const cx = w * 0.5, top = h * 0.24, bot = h * 0.99;
  b.wash([[cx - w * 0.2, top], [cx + w * 0.2, top], [cx + w * 0.3, bot], [cx - w * 0.3, bot]], { color: '#8a1c14', alpha: 0.92, blur: 2, edge: 0.5 });
  b.wash([[cx - w * 0.2, top + 6], [cx, top + h * 0.12], [cx + w * 0.2, top + 6], [cx, top + h * 0.2]], { color: '#e8d8a8', alpha: 0.85, blur: 1, edge: 0.6 });
  // wide sleeves lifted as if mid-gesture
  for (const d of [-1, 1]) {
    const pts = []; for (let t = 0; t < 1; t += 0.05) pts.push([cx + d * (w * 0.18 + t * w * 0.28), top + h * 0.1 + Math.sin(t * 2.6) * h * 0.22]);
    b.stroke(pts, { w: 26, color: '#8a1c14', alpha: 0.75, dry: 0.4, taper: [0.1, 0.8] });
  }
  for (let k = 0; k < 5; k++) b.cloud(cx + b.r(-w * 0.16, w * 0.16), h * (0.6 + k * 0.08), 10, { color: GOLD, alpha: 0.45, w: 2.4 });
  // nobody inside the collar
  b.wash(b.blob(cx, top + 4, 22, 12), { color: '#120a0a', alpha: 0.95, blur: 3, edge: 0.2 });
};
M.worm = (b, w, h) => {
  murk(b, w, h, { top: '#2e2e24', bottom: '#8a8460' });
  // a 工尺谱 page eaten through
  b.wash([[w * 0.2, h * 0.1], [w * 0.8, h * 0.12], [w * 0.82, h * 0.92], [w * 0.18, h * 0.9]], { color: '#e0d6b4', alpha: 0.9, blur: 1.5, edge: 0.6 });
  b.ctx.save();
  b.ctx.beginPath(); b.ctx.rect(w * 0.2, h * 0.1, w * 0.62, h * 0.82); b.ctx.clip();
  b.ctx.font = `${h * 0.075}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
  const gc = '上尺工凡六五乙';
  for (let c = 0; c < 4; c++) for (let r = 0; r < 8; r++) {
    b.ctx.fillStyle = `rgba(40,34,24,${b.r(0.25, 0.8).toFixed(2)})`;
    b.ctx.fillText(gc[(c * 8 + r) % gc.length], w * (0.28 + c * 0.15), h * (0.2 + r * 0.09));
  }
  b.ctx.restore();
  // worm holes punched through the page
  for (let i = 0; i < 16; i++) {
    const x = w * b.r(0.22, 0.8), y = h * b.r(0.12, 0.9), r = b.r(4, 13);
    b.wash(b.blob(x, y, r, r * 0.85, { wob: 0.45 }), { color: '#1a1a14', alpha: 0.92, blur: 1.2, edge: 0.3 });
  }
  const body = [[w * 0.3, h * 0.82], [w * 0.45, h * 0.7], [w * 0.58, h * 0.8], [w * 0.7, h * 0.66]];
  b.stroke(body, { w: 13, color: '#6a6a3a', alpha: 0.9, dry: 0.3, taper: [0.05, 0.4] });
  eye(b.ctx, w * 0.71, h * 0.65, 2.2, '#c8e060');
};
M['seal-curtain'] = (b, w, h) => talisman(b, w, h, null, { glyph: '幕', dark: true });
M.juexiang = (b, w, h) => {          // 空台绝响（首领）
  sky(b, w, h, { top: '#1a1214', bottom: '#6a5240' });
  curtainFrame(b, w, h, { color: '#3a0e0c' });
  // the empty stage floor, first light creeping in
  const g = b.ctx.createLinearGradient(0, h * 0.5, 0, h);
  g.addColorStop(0, 'rgba(240,200,140,0.18)'); g.addColorStop(1, 'rgba(240,200,140,0)');
  b.ctx.fillStyle = g; b.ctx.fillRect(0, h * 0.5, w, h * 0.5);
  b.stroke([[0, h * 0.72], [w, h * 0.7]], { w: 4, color: '#2a1a12', alpha: 0.8, dry: 0.5 });
  // a figure made of dust: half troupe-leader, half stage
  const f = figure(b, w * 0.5, h * 0.99, h * 0.84, { robe: '#6a5a4a', accent: '#3a2a20', head: 'hat', sleeve: 1.8, width: 1.5, alpha: 0.45 });
  for (let i = 0; i < 60; i++) {
    const x = f.sh[0] + b.r(-w * 0.26, w * 0.26), y = f.sh[1] + b.r(-20, h * 0.5);
    b.ctx.fillStyle = `rgba(210,190,160,${b.r(0.15, 0.55).toFixed(2)})`;
    b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3.2), 0, 6.28); b.ctx.fill();
  }
  // toppled drum + gong frame behind
  b.wash(b.blob(w * 0.14, h * 0.86, 26, 18, { rot: 0.4 }), { color: '#5a2a18', alpha: 0.85, blur: 1.5, edge: 0.6 });
  b.stroke([[w * 0.82, h * 0.92], [w * 0.86, h * 0.6], [w * 0.96, h * 0.62]], { w: 4, color: '#3a2a18', dry: 0.5 });
  eye(b.ctx, f.head[0] - 4, f.head[1], 3, '#ffd88a');
  b.mist(w, h, h * 0.94, { alpha: 0.4, color: '#c8b8a0' });
};

// hero portraits reuse figures
M.guardian = (b, w, h) => {
  sky(b, w, h, { top: '#d8d0bd', bottom: '#efe7d6', sun: [w * 0.75, h * 0.25, h * 0.08, GOLD] });
  b.mountains(w, h, { base: 0.7, alpha: 0.18 });
  const f = figure(b, w * 0.5, h * 1.05, h * 0.86, { robe: '#2a3440', accent: '#1A5276', head: 'bun', sleeve: 1.2 });
  b.wash([[f.rh[0] - 8, f.rh[1] - 8], [f.rh[0] + 18, f.rh[1] - 12], [f.rh[0] + 20, f.rh[1] + 8], [f.rh[0] - 6, f.rh[1] + 12]], { color: '#e8dcc0', alpha: 0.95, blur: 0.5, edge: 1, smooth: false });
};
M.nvwaSpirit = (b, w, h) => {
  sky(b, w, h, { top: '#e6d6b8', bottom: '#f4ead8' });
  const g = b.ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.6);
  g.addColorStop(0, 'rgba(255,230,170,0.8)'); g.addColorStop(1, 'rgba(255,230,170,0)');
  b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
  figure(b, w * 0.5, h * 1.02, h * 0.86, { robe: '#8a6a40', accent: RED, head: 'bun', sleeve: 1.1, alpha: 0.6 });
};

Object.assign(M, lateMotifs({ sky, figure, flame, pine, wave, eye, talisman, scrollFrame, murk }));

export const MOTIFS = Object.keys(M);

export function paintArt(ctx, w, h, motif, { seed = 1 } = {}) {
  const b = brush(ctx, seed);
  ctx.save();
  (M[motif] ?? M.mist)(b, w, h);
  // paper grain over the painting so it sits in the card
  ctx.globalAlpha = 0.18; ctx.globalCompositeOperation = 'multiply';
  const pc = document.createElement('canvas'); pc.width = w; pc.height = h;
  paper(pc.getContext('2d'), w, h, { seed: seed + 9, fibres: 1.5 });
  ctx.drawImage(pc, 0, 0);
  ctx.restore();
}
export { seal };
