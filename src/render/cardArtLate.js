// Procedural ink art for chapters 4–10. cardArt.js owns the shared brush helpers and passes them in,
// so this file only describes what each card looks like: a palette, a figure, and one telling prop.
import { rgba, mix, INK, FONT_BRUSH } from './ink.js';

const GOLD = '#C8A04A', RED = '#C03A2A', CINNABAR = '#B8322A', JADE = '#4A8C5C', BLUE = '#2A4A7A', OCHRE = '#8C6040';

export function lateMotifs(H) {
  const { sky, figure, flame, wave, eye, talisman, scrollFrame, murk } = H;
  const M = {};

  // ── shared building blocks ──────────────────────────────────────────────
  /** A figure standing in a painted setting. `back` paints behind, `prop` in front (gets the figure's anchors). */
  const person = ({ top, bottom, sun = null, robe, accent = null, head = 'bun', x = 0.46, foot = 0.96, h: hh = 0.72,
    lean = 0, width = 1, sleeve = 1.2, alpha = 0.9, back = null, prop = null, mist = 0 }) => (b, w, h) => {
    sky(b, w, h, { top, bottom, sun: sun ? [w * sun[0], h * sun[1], h * sun[2], sun[3]] : null });
    back?.(b, w, h);
    const f = figure(b, w * x, h * foot, h * hh, { robe, accent, head, sleeve, width, lean, alpha });
    prop?.(b, w, h, f);
    if (mist) b.mist(w, h, h * 0.92, { alpha: mist });
  };
  /** A 浊灵: murky ground, a shape, two glowing eyes. */
  const wraith = ({ top, bottom, color = '#d8d0c0', body, glow = 3 }) => (b, w, h) => {
    murk(b, w, h, { top, bottom });
    const c = body(b, w, h);
    if (c) { eye(b.ctx, c[0] - 10, c[1], glow, color); eye(b.ctx, c[0] + 10, c[1], glow, color); }
  };
  const blobBody = (bx, by, rx, ry, col = INK, wob = 0.35) => (b, w, h) => {
    b.wash(b.blob(w * bx, h * by, rx, ry, { wob }), { color: col, alpha: 0.9, blur: 4, edge: 0.3 });
    return [w * bx, h * by - ry * 0.25];
  };
  const glyphs = (b, w, h, str, { color = '200,190,160', n = 10, size = 22, y0 = 0.05, y1 = 0.6 } = {}) => {
    b.ctx.save(); b.ctx.font = `${size}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      b.ctx.fillStyle = `rgba(${color},${b.r(0.3, 0.8).toFixed(2)})`;
      b.ctx.fillText(str[i % str.length], b.r(w * 0.06, w * 0.94), b.r(h * y0, h * y1));
    }
    b.ctx.restore();
  };
  /** A stack / scatter of bamboo slips. */
  const slips = (b, w, h, { x, y, n = 7, len = 70, wide = 7, col = '#c8a870', spread = 0.25, chars = '道德仁义礼智信' }) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n - 0.5) * spread * 6.28, sx = x + Math.cos(a) * 12, sy = y + i * 2;
      b.ctx.save(); b.ctx.translate(sx, sy); b.ctx.rotate(a * 0.4);
      b.ctx.fillStyle = mix(col, '#7a5a30', b.R() * 0.4); b.ctx.fillRect(-wide / 2, -len / 2, wide, len);
      b.ctx.fillStyle = 'rgba(30,24,16,0.75)'; b.ctx.font = `${wide * 0.9}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      for (let k = 0; k < 4; k++) b.ctx.fillText(chars[(i + k) % chars.length], 0, -len / 2 + 12 + k * 14);
      b.ctx.restore();
    }
  };
  const water = (b, w, h, y, rows = 4, color = BLUE) => { for (let r = 0; r < rows; r++) wave(b, -20, h * (y + r * 0.07), w + 40, { n: 6, s: 0.9 + r * 0.15, color }); };
  const scroll = (bg, paint) => (b, w, h) => scrollFrame(b, w, h, (iw, ih) => paint(b, iw, ih), { bg });

  // ── 第四章 · 稷下学宫 ────────────────────────────────────────────────────
  M.kongzi = person({ top: '#dfd8c2', bottom: '#f2ecda', robe: '#3a3a30', accent: OCHRE, head: 'hat', width: 1.3, h: 0.78,
    back: (b, w, h) => {
      b.stroke([[w * 0.06, h * 0.9], [w * 0.1, h * 0.5], [w * 0.02, h * 0.2]], { w: 9, color: '#3a2a1e', dry: 0.7 });   // 杏树
      for (let i = 0; i < 20; i++) b.wash(b.blob(b.r(0, w * 0.35), b.r(h * 0.05, h * 0.4), 5, 4), { color: '#e8b8c0', alpha: 0.8, blur: 0.8, edge: 0.4 });
      b.wash([[w * 0.2, h * 0.86], [w * 0.95, h * 0.86], [w * 0.95, h], [w * 0.2, h]], { color: '#8a7248', alpha: 0.5, blur: 2, edge: 0.4, smooth: false });
    },
    prop: (b, w, h, f) => {
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 24], [f.head[0] + k * 6, f.head[1] + 38]], { w: 2.4, color: '#4a4034', dry: 0.4 });
      slips(b, w, h, { x: w * 0.82, y: h * 0.72, n: 5, len: 80, chars: '学而时习之' });
      for (let i = 0; i < 4; i++) figure(b, w * (0.2 + i * 0.16), h * 0.99, h * 0.2, { robe: '#5a5448', head: 'bun', alpha: 0.35 });   // 弟子
    } });
  M.laozi = person({ top: '#cfd8da', bottom: '#eef0e6', robe: '#dfe4e2', accent: '#8aa0a8', head: 'long', x: 0.5, h: 0.7, alpha: 0.85, mist: 0.4,
    back: (b, w, h) => { water(b, w, h, 0.7, 5, '#5a7a8a'); b.mountains(w, h, { base: 0.5, alpha: 0.14 }); },
    prop: (b, w, h, f) => {
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 4, f.head[1] + 8], [f.head[0] + k * 7, f.head[1] + 34], [f.head[0] + k * 9, f.head[1] + 58]], { w: 2.6, color: '#b8b8ac', alpha: 0.8, dry: 0.4 });
      b.stroke([[f.rh[0] + 4, f.rh[1] - 26], [f.rh[0] + 10, h * 0.99]], { w: 5, color: '#6a5a3a', dry: 0.5 });
      b.ctx.fillStyle = 'rgba(60,80,90,0.5)'; b.ctx.font = `${h * 0.1}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      b.ctx.fillText('水', w * 0.14, h * 0.3);
    } });
  M.zhuangzi = (b, w, h) => {
    sky(b, w, h, { top: '#c8d4dc', bottom: '#eef0e4' });
    // 鲲化为鹏: one huge wing sweeping across the sky
    const arc = []; for (let t = 0; t <= 1; t += 0.05) arc.push([w * (0.02 + t * 1.02), h * (0.42 - Math.sin(t * 3.14) * 0.34)]);
    b.stroke(arc, { w: 26, color: '#3a4450', alpha: 0.7, dry: 0.5, taper: [0.05, 0.8] });
    for (let k = 0; k < 7; k++) { const t = 0.2 + k * 0.1; b.stroke([[w * (0.02 + t * 1.02), h * (0.42 - Math.sin(t * 3.14) * 0.34)], [w * (0.02 + t * 1.02) + 18, h * (0.5 - Math.sin(t * 3.14) * 0.3) + 42]], { w: 6, color: '#3a4450', alpha: 0.5, dry: 0.6, taper: [0.1, 0.8] }); }
    water(b, w, h, 0.78, 4, '#3a5a6a');
    const f = figure(b, w * 0.32, h * 0.97, h * 0.5, { robe: '#6a6a5a', accent: JADE, head: 'bun', lean: -0.3, alpha: 0.85 });
    for (let i = 0; i < 5; i++) { const x = w * b.r(0.5, 0.95), y = h * b.r(0.6, 0.85); b.wash(b.blob(x, y, 7, 5, { wob: 0.5 }), { color: '#d8a8c0', alpha: 0.8, blur: 1, edge: 0.4 }); }  // 蝴蝶
    b.mist(w, h, h * 0.8, { alpha: 0.35 });
  };
  M.mozi = person({ top: '#ccc6b8', bottom: '#e8e2d2', robe: '#4a4438', accent: '#7a6a4a', head: 'bun', width: 1.2, h: 0.72, lean: 0.15,
    back: (b, w, h) => {   // city wall + siege ladder
      b.wash([[0, h * 0.5], [w * 0.55, h * 0.5], [w * 0.55, h], [0, h]], { color: '#8a7a60', alpha: 0.8, blur: 1.5, edge: 0.5, smooth: false });
      for (let k = 0; k < 5; k++) b.ctx.fillRect(k * w * 0.11, h * 0.44, w * 0.07, h * 0.07);
      b.ctx.fillStyle = 'rgba(90,78,60,0.9)';
      for (let k = 0; k < 5; k++) b.ctx.fillRect(k * w * 0.11, h * 0.44, w * 0.07, h * 0.07);
      b.stroke([[w * 0.62, h], [w * 0.78, h * 0.42]], { w: 6, color: '#3a2a18', dry: 0.5 });
      for (let k = 0; k < 6; k++) b.stroke([[w * (0.63 + k * 0.026), h * (0.98 - k * 0.1)], [w * (0.69 + k * 0.026), h * (0.95 - k * 0.1)]], { w: 3, color: '#3a2a18', dry: 0.4 });
    },
    prop: (b, w, h, f) => { b.stroke([[f.rh[0] - 6, f.rh[1] - 10], [f.rh[0] + 30, f.rh[1] - 34]], { w: 6, color: '#5a5a5a', dry: 0.2 }); } });
  M['scroll-bamboo'] = scroll('#e6dcc0', (b, iw, ih) => {
    b.ctx.fillStyle = '#e6dcc0'; b.ctx.fillRect(0, 0, iw, ih);
    for (let i = 0; i < 9; i++) {
      const x = iw * (0.08 + i * 0.1);
      b.ctx.fillStyle = mix('#c8a870', '#8a6a3a', (i % 3) * 0.2); b.ctx.fillRect(x, ih * 0.1, iw * 0.07, ih * 0.8);
      b.ctx.fillStyle = 'rgba(30,24,16,0.8)'; b.ctx.font = `${iw * 0.055}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      for (let k = 0; k < 6; k++) b.ctx.fillText('关关雎鸠在河之洲窈窕淑女'[(i * 6 + k) % 12], x + iw * 0.035, ih * (0.2 + k * 0.12));
    }
    for (const y of [0.24, 0.72]) { b.ctx.strokeStyle = 'rgba(60,40,20,0.7)'; b.ctx.lineWidth = 3; b.ctx.beginPath(); b.ctx.moveTo(iw * 0.06, ih * y); b.ctx.lineTo(iw * 0.94, ih * y); b.ctx.stroke(); }
  });
  M.brokenSlip = wraith({ top: '#33301f', bottom: '#8a8060', color: '#e0d8a0',
    body: (b, w, h) => { slips(b, w, h, { x: w * 0.5, y: h * 0.56, n: 9, len: 90, spread: 0.5 }); b.splatter(w * 0.5, h * 0.6, 90, { n: 20, alpha: 0.5, size: 2.4 }); return [w * 0.5, h * 0.46]; } });
  M.gagMist = wraith({ top: '#3a3a3a', bottom: '#9a9a90', color: '#c8c8c0',
    body: (b, w, h) => { blobBody(0.5, 0.56, 62, 50)(b, w, h); b.stroke([[w * 0.36, h * 0.6], [w * 0.64, h * 0.58]], { w: 10, color: '#1a1a18', alpha: 0.9, dry: 0.3 }); glyphs(b, w, h, '言语说道论', { n: 8, color: '160,160,150', y0: 0.08, y1: 0.4 }); return [w * 0.5, h * 0.48]; } });
  M.sophist = wraith({ top: '#2a2c3a', bottom: '#7a7a92', color: '#b0a8e0',
    body: (b, w, h) => {
      for (let i = 0; i < 5; i++) { const x = w * (0.28 + (i % 3) * 0.22), y = h * (0.4 + Math.floor(i / 3) * 0.24); b.wash(b.blob(x, y, 26, 18, { wob: 0.4 }), { color: INK, alpha: 0.8, blur: 3, edge: 0.3 }); b.stroke([[x - 12, y + 6], [x + 12, y + 4]], { w: 5, color: '#c8c0e0', alpha: 0.6, dry: 0.2 }); }
      glyphs(b, w, h, '白马非马', { n: 8, color: '190,180,230', y0: 0.06, y1: 0.9 });
      return [w * 0.5, h * 0.3];
    } });
  M.wallBook = wraith({ top: '#33302a', bottom: '#8a7c62', color: '#e0d0a0',
    body: (b, w, h) => {
      b.wash([[w * 0.18, h * 0.16], [w * 0.82, h * 0.16], [w * 0.82, h], [w * 0.18, h]], { color: '#6a5a44', alpha: 0.9, blur: 1.5, edge: 0.5, smooth: false });
      for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { b.ctx.strokeStyle = 'rgba(40,32,22,0.6)'; b.ctx.lineWidth = 2; b.ctx.strokeRect(w * (0.2 + c * 0.155), h * (0.2 + r * 0.13), w * 0.14, h * 0.11); }
      b.wash([[w * 0.42, h * 0.5], [w * 0.6, h * 0.48], [w * 0.62, h * 0.86], [w * 0.4, h * 0.88]], { color: '#1a1814', alpha: 0.85, blur: 3, edge: 0.3 });
      slips(b, w, h, { x: w * 0.51, y: h * 0.66, n: 3, len: 48, wide: 6, chars: '尚书' });
      return [w * 0.51, h * 0.56];
    } });

  // ── 第五章 · 云梦泽 ─────────────────────────────────────────────────────
  M.quyuan = person({ top: '#5a4a6a', bottom: '#b8aec0', robe: '#2a2438', accent: '#8a6aa0', head: 'hat', h: 0.8, width: 1.1, x: 0.44, mist: 0.35,
    back: (b, w, h) => { water(b, w, h, 0.72, 5, '#3a3a5a'); b.mountains(w, h, { base: 0.48, alpha: 0.18, color: '#4a4058' }); },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0] - 4, f.rh[1] + 4], [f.rh[0] + 8, h * 0.99]], { w: 4, color: '#3a3040', dry: 0.3 });   // 长剑
      for (let i = 0; i < 7; i++) { const x = f.sh[0] - 30 + i * 9, y = f.sh[1] + 28 + (i % 2) * 8; b.wash(b.blob(x, y, 6, 4, { wob: 0.4 }), { color: JADE, alpha: 0.8, blur: 0.8, edge: 0.5 }); }  // 香草
      for (let k = -1; k <= 1; k++) b.stroke([[f.head[0] + k * 4, f.head[1] + 8], [f.head[0] + k * 6, f.head[1] + 30]], { w: 2.4, color: '#4a4048', dry: 0.4 });
    } });
  M.shangui = person({ top: '#2e3a2c', bottom: '#8aa088', robe: '#4a5a44', accent: JADE, head: 'long', h: 0.7, x: 0.5, lean: 0.2, alpha: 0.8, mist: 0.5,
    back: (b, w, h) => { for (let i = 0; i < 5; i++) { const x = w * b.r(0, 1); b.stroke([[x, h], [x + b.r(-20, 20), h * 0.1]], { w: 12, color: '#2a3826', alpha: 0.5, dry: 0.7 }); } },
    prop: (b, w, h, f) => {
      for (let i = 0; i < 12; i++) { const t = i / 12, x = f.sh[0] + Math.sin(t * 9) * 30, y = f.sh[1] + t * h * 0.5; b.wash(b.blob(x, y, 8, 5, { wob: 0.5 }), { color: '#5a8a50', alpha: 0.8, blur: 1, edge: 0.4 }); }
      const vine = []; for (let t = 0; t < 1; t += 0.05) vine.push([f.sh[0] - 40 + Math.sin(t * 7) * 24, f.sh[1] - 20 + t * h * 0.7]);
      b.stroke(vine, { w: 3, color: '#3a6a34', alpha: 0.9, dry: 0.3 });
    } });
  M.xiangjun = person({ top: '#3a4a66', bottom: '#b8c6d2', robe: '#dfe6ee', accent: '#6a8ab0', head: 'bun', h: 0.68, x: 0.5, alpha: 0.85, mist: 0.45,
    back: (b, w, h) => { water(b, w, h, 0.68, 6, '#4a6a8a'); },
    prop: (b, w, h, f) => {
      b.ctx.fillStyle = rgba('#9adcd8', 0.9); b.ctx.beginPath(); b.ctx.arc(f.rh[0] + 8, f.rh[1], 9, 0, 6.28); b.ctx.fill();
      b.ctx.strokeStyle = rgba('#e8fbfa', 0.9); b.ctx.lineWidth = 3; b.ctx.beginPath(); b.ctx.arc(f.rh[0] + 8, f.rh[1], 9, 0.6, 5.8); b.ctx.stroke();
      const trail = []; for (let t = 0; t < 1; t += 0.05) trail.push([f.lh[0] - t * w * 0.36, f.lh[1] + Math.sin(t * 5) * 18 + t * 40]);
      b.stroke(trail, { w: 12, color: '#dfe6ee', alpha: 0.55, dry: 0.4, taper: [0.1, 0.8] });
    } });
  M.guoshang = person({ top: '#4a2420', bottom: '#b08a72', robe: '#5a3028', accent: '#8a3a2a', head: 'hat', h: 0.76, width: 1.3, x: 0.48,
    back: (b, w, h) => { for (let i = 0; i < 12; i++) { const x = w * b.r(0, 1), y = h * b.r(0.5, 0.95); b.stroke([[x, y], [x + b.r(-8, 8), y - b.r(30, 70)]], { w: 3, color: '#3a2a22', alpha: 0.6, dry: 0.4 }); } },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0] - 20, f.rh[1] + 40], [f.rh[0] + 40, f.rh[1] - 50]], { w: 4, color: '#c8c8d0', dry: 0.1, taper: [0.02, 0.5] });
      b.wash([[f.sh[0] - 22, f.sh[1] + 14], [f.sh[0] + 22, f.sh[1] + 14], [f.sh[0] + 18, f.sh[1] + 52], [f.sh[0] - 18, f.sh[1] + 52]], { color: '#6a4a3a', alpha: 0.8, blur: 1, edge: 0.6 });
      b.splatter(f.sh[0], f.sh[1] + 30, 60, { color: CINNABAR, n: 16, size: 2.6, alpha: 0.6 });
    } });
  M['scroll-jiuge'] = scroll('#dfe4e0', (b, iw, ih) => {
    sky(b, iw, ih, { top: '#b8c4c8', bottom: '#eef0e8' });
    for (let r = 0; r < 4; r++) wave(b, -10, ih * (0.6 + r * 0.1), iw + 20, { n: 5, s: 0.8 + r * 0.2, color: '#5a7a8a' });
    for (let i = 0; i < 14; i++) { const x = iw * b.r(0.05, 0.95), y = ih * b.r(0.45, 0.62); b.wash(b.blob(x, y, 10, 4, { wob: 0.5 }), { color: '#8a7a4a', alpha: 0.75, blur: 1, edge: 0.4 }); }
    b.ctx.fillStyle = 'rgba(40,50,60,0.75)'; b.ctx.font = `${ih * 0.13}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('九歌', iw * 0.5, ih * 0.22);
    b.mist(iw, ih, ih * 0.56, { alpha: 0.4 });
  });
  M.sunkSpirit = wraith({ top: '#1f2c38', bottom: '#6a8090', color: '#a8d8e0',
    body: (b, w, h) => { water(b, w, h, 0.5, 5, '#2a4a5a'); return blobBody(0.5, 0.64, 36, 26, '#12202a')(b, w, h); } });
  M.marshWalker = wraith({ top: '#2a3430', bottom: '#8a9484', color: '#d0e0b8',
    body: (b, w, h) => {
      for (let i = 0; i < 9; i++) { const x = w * b.r(0, 1); b.stroke([[x, h], [x + b.r(-14, 14), h * b.r(0.1, 0.4)]], { w: 5, color: '#4a5a44', alpha: 0.55, dry: 0.6 }); }
      const f = figure(b, w * 0.5, h * 0.96, h * 0.66, { robe: '#1a2018', accent: null, head: 'hat', alpha: 0.85, lean: 0.25 });
      return [f.head[0], f.head[1]];
    } });
  M.vineGhost = wraith({ top: '#26301f', bottom: '#7c8a68', color: '#c8e090',
    body: (b, w, h) => {
      for (let k = 0; k < 6; k++) { const v = []; for (let t = 0; t < 1; t += 0.05) v.push([w * (0.15 + k * 0.14) + Math.sin(t * 8 + k) * 18, h * t]); b.stroke(v, { w: 5, color: '#3a5a2e', alpha: 0.85, dry: 0.4 }); }
      return blobBody(0.5, 0.58, 44, 40, '#1a2414', 0.45)(b, w, h);
    } });
  M.banner = wraith({ top: '#2a2438', bottom: '#8a7a90', color: '#e0c8f0',
    body: (b, w, h) => {
      for (const [x, tilt] of [[0.3, -0.06], [0.5, 0.02], [0.7, 0.07]]) {
        b.ctx.save(); b.ctx.translate(w * x, h * 0.1); b.ctx.rotate(tilt);
        b.ctx.fillStyle = 'rgba(210,190,200,0.85)'; b.ctx.fillRect(-w * 0.055, 0, w * 0.11, h * 0.74);
        b.ctx.fillStyle = 'rgba(120,40,40,0.5)'; b.ctx.font = `${w * 0.07}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
        b.ctx.fillText('魂', 0, h * 0.26);
        b.ctx.restore();
      }
      return [w * 0.5, h * 0.84];
    } });
  M.zhaohun = (b, w, h) => {   // 第五章首领
    sky(b, w, h, { top: '#1a1828', bottom: '#6a5a78' });
    water(b, w, h, 0.76, 4, '#2a2a4a');
    const f = figure(b, w * 0.5, h * 1.02, h * 0.92, { robe: '#3a3048', accent: '#7a5a90', head: 'long', sleeve: 1.8, width: 1.5, alpha: 0.55 });
    for (let k = 0; k < 7; k++) {
      const x = w * (0.12 + k * 0.13);
      b.ctx.fillStyle = `rgba(220,200,215,${0.4 + (k % 2) * 0.25})`; b.ctx.fillRect(x - w * 0.02, h * 0.06, w * 0.04, h * 0.5);
    }
    eye(b.ctx, f.head[0] - 5, f.head[1], 3.4, '#e0c0ff');
    b.mist(w, h, h * 0.9, { alpha: 0.45, color: '#b0a0c0' });
  };

  // ── 第六章 · 未央宫 ─────────────────────────────────────────────────────
  M.sima = person({ top: '#c8b894', bottom: '#eadfc4', robe: '#3a3428', accent: OCHRE, head: 'hat', h: 0.74, width: 1.15, x: 0.42,
    back: (b, w, h) => { b.wash([[w * 0.55, h * 0.3], [w, h * 0.3], [w, h], [w * 0.55, h]], { color: '#8a7248', alpha: 0.4, blur: 3, edge: 0.4, smooth: false }); },
    prop: (b, w, h, f) => {
      slips(b, w, h, { x: w * 0.8, y: h * 0.62, n: 8, len: 96, spread: 0.12, chars: '史记太初本纪' });
      b.stroke([[f.rh[0], f.rh[1]], [f.rh[0] + 16, f.rh[1] - 20]], { w: 3.4, color: '#2a2018', dry: 0.1 });
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 26]], { w: 2.2, color: '#4a4436', dry: 0.4 });
    } });
  M.zhangqian = person({ top: '#d8b880', bottom: '#f0dcb0', sun: [0.78, 0.2, 0.05, '#fff0c0'], robe: '#6a5438', accent: GOLD, head: 'hat', h: 0.72, x: 0.38, lean: 0.1,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.7, alpha: 0.2, color: '#a08858' });
      for (let i = 0; i < 3; i++) {   // camel train
        const x = w * (0.62 + i * 0.13), y = h * (0.84 + i * 0.02), s = 1 - i * 0.18;
        b.wash(b.blob(x, y, 20 * s, 11 * s), { color: '#7a5a3a', alpha: 0.85, blur: 1.5, edge: 0.5 });
        b.wash(b.blob(x - 7 * s, y - 12 * s, 7 * s, 8 * s), { color: '#7a5a3a', alpha: 0.85, blur: 1, edge: 0.5 });
        b.wash(b.blob(x + 7 * s, y - 13 * s, 7 * s, 9 * s), { color: '#7a5a3a', alpha: 0.85, blur: 1, edge: 0.5 });
        b.stroke([[x + 18 * s, y - 4 * s], [x + 26 * s, y - 20 * s]], { w: 4 * s, color: '#7a5a3a', dry: 0.3 });
      }
    },
    prop: (b, w, h, f) => {   // 节杖
      b.stroke([[f.rh[0] + 4, f.rh[1] - 40], [f.rh[0] + 10, h * 0.99]], { w: 5, color: '#4a3420', dry: 0.4 });
      for (let k = 0; k < 4; k++) b.stroke([[f.rh[0] + 4, f.rh[1] - 40 + k * 7], [f.rh[0] + 20, f.rh[1] - 34 + k * 8]], { w: 3, color: '#c8a870', alpha: 0.9, dry: 0.3 });
    } });
  M.cailun = person({ top: '#dfe0d0', bottom: '#f2f0e2', robe: '#4a5a48', accent: JADE, head: 'bun', h: 0.66, x: 0.36, lean: 0.3,
    back: (b, w, h) => {
      b.wash([[w * 0.45, h * 0.62], [w, h * 0.62], [w, h * 0.96], [w * 0.45, h * 0.96]], { color: '#5a6a70', alpha: 0.75, blur: 2, edge: 0.5, smooth: false });  // 纸槽
      for (let i = 0; i < 5; i++) b.stroke([[w * 0.5, h * (0.66 + i * 0.05)], [w * 0.96, h * (0.67 + i * 0.05)]], { w: 3, color: '#8a9aa0', alpha: 0.5, dry: 0.5 });
      for (let i = 0; i < 4; i++) { const x = w * (0.55 + i * 0.12), y = h * (0.2 + (i % 2) * 0.14); b.wash([[x - 26, y], [x + 26, y - 6], [x + 24, y + 26], [x - 24, y + 30]], { color: '#f6f2e4', alpha: 0.9, blur: 1, edge: 0.6 }); }  // drying sheets
    },
    prop: (b, w, h, f) => { b.wash([[f.rh[0] - 22, f.rh[1] - 6], [f.rh[0] + 24, f.rh[1] - 12], [f.rh[0] + 22, f.rh[1] + 12], [f.rh[0] - 20, f.rh[1] + 16]], { color: '#faf6ea', alpha: 0.95, blur: 0.6, edge: 0.7 }); } });
  M.shuzu = person({ top: '#b8a888', bottom: '#e0d4b8', robe: '#5a5042', accent: '#8a7a5a', head: 'hat', h: 0.74, width: 1.25, x: 0.5,
    back: (b, w, h) => {
      b.wash([[0, h * 0.62], [w, h * 0.58], [w, h], [0, h]], { color: '#8a7858', alpha: 0.7, blur: 2, edge: 0.4, smooth: false });   // 城墙
      for (let k = 0; k < 6; k++) b.ctx.fillRect(k * w * 0.18, h * 0.55, w * 0.1, h * 0.06);
      b.ctx.fillStyle = 'rgba(110,96,70,0.9)'; for (let k = 0; k < 6; k++) b.ctx.fillRect(k * w * 0.18, h * 0.55, w * 0.1, h * 0.06);
      for (let i = 0; i < 26; i++) { const x = b.r(0, w); b.stroke([[x, b.r(0, h * 0.5)], [x - 16, b.r(0, h * 0.5) + 30]], { w: 1.2, color: '#c8b894', alpha: 0.3, dry: 0 }); }
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0] + 4, f.rh[1] - 44], [f.rh[0] + 8, h * 0.99]], { w: 5, color: '#4a3a24', dry: 0.4 });   // 戈
      b.wash([[f.rh[0] + 2, f.rh[1] - 44], [f.rh[0] + 26, f.rh[1] - 52], [f.rh[0] + 12, f.rh[1] - 34]], { color: '#8a8a90', alpha: 0.9, blur: 0.6, edge: 0.6 });
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 6, f.head[1] + 30]], { w: 2.4, color: '#cfc8bc', alpha: 0.8, dry: 0.4 });
    } });
  M['scroll-shiji'] = scroll('#e8dcc0', (b, iw, ih) => {
    b.ctx.fillStyle = '#e8dcc0'; b.ctx.fillRect(0, 0, iw, ih);
    slips(b, iw, ih, { x: iw * 0.5, y: ih * 0.52, n: 11, len: ih * 0.7, wide: iw * 0.055, spread: 0.06, chars: '究天人之际通古今之变' });
    b.ctx.fillStyle = 'rgba(150,40,30,0.8)'; b.ctx.font = `${ih * 0.16}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('史', iw * 0.18, ih * 0.2);
  });
  M.rustSlip = wraith({ top: '#2e3230', bottom: '#7a8a80', color: '#a8e0c0',
    body: (b, w, h) => {
      b.wash([[w * 0.32, h * 0.26], [w * 0.68, h * 0.26], [w * 0.72, h * 0.86], [w * 0.28, h * 0.86]], { color: '#4a6a5a', alpha: 0.9, blur: 2, edge: 0.5 });
      for (let i = 0; i < 16; i++) b.wash(b.blob(w * b.r(0.3, 0.7), h * b.r(0.3, 0.82), 10, 7, { wob: 0.5 }), { color: '#7ab08a', alpha: 0.5, blur: 3, edge: 0.2 });
      return [w * 0.5, h * 0.44];
    } });
  M.beacon = wraith({ top: '#2a2018', bottom: '#8a6a44', color: '#ffc070',
    body: (b, w, h) => {
      b.wash([[w * 0.34, h], [w * 0.4, h * 0.34], [w * 0.6, h * 0.34], [w * 0.66, h]], { color: '#6a5436', alpha: 0.95, blur: 1.5, edge: 0.5, smooth: false });
      flame(b, w * 0.5, h * 0.34, h * 0.3, { n: 6 });
      for (let i = 0; i < 3; i++) { const x = w * (0.08 + i * 0.36); b.wash([[x, h * 0.9], [x + 14, h * 0.7], [x + 28, h * 0.9]], { color: '#5a4a32', alpha: 0.5, blur: 3, edge: 0.3 }); }
      return [w * 0.5, h * 0.52];
    } });
  M.ember = wraith({ top: '#1c1410', bottom: '#7a4a2a', color: '#ff9040',
    body: (b, w, h) => {
      for (let i = 0; i < 40; i++) { const x = b.r(0, w), y = b.r(h * 0.45, h); b.ctx.fillStyle = `rgba(255,${100 + b.r(0, 90) | 0},40,${b.r(0.3, 0.9).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3.4), 0, 6.28); b.ctx.fill(); }
      glyphs(b, w, h, '经史子集', { n: 7, color: '90,70,60', y0: 0.1, y1: 0.5, size: 26 });
      return blobBody(0.5, 0.5, 48, 38, '#2a1408', 0.5)(b, w, h);
    } });
  M.stoneBeast = wraith({ top: '#2e2c26', bottom: '#8a8474', color: '#d8c890',
    body: (b, w, h) => {
      b.wash([[w * 0.22, h], [w * 0.28, h * 0.5], [w * 0.46, h * 0.36], [w * 0.68, h * 0.42], [w * 0.76, h * 0.7], [w * 0.74, h]], { color: '#6a6458', alpha: 0.95, blur: 1.5, edge: 0.6 });
      b.wash(b.blob(w * 0.4, h * 0.34, 24, 20, { wob: 0.1 }), { color: '#6a6458', alpha: 0.95, blur: 1, edge: 0.7 });
      b.stroke([[w * 0.6, h * 0.42], [w * 0.86, h * 0.26]], { w: 7, color: '#6a6458', dry: 0.3 });
      for (let i = 0; i < 8; i++) { const x = w * b.r(0.25, 0.75), y = h * b.r(0.45, 0.95); b.stroke([[x, y], [x + b.r(-14, 14), y + b.r(8, 20)]], { w: 1.6, color: '#3a3830', alpha: 0.6, dry: 0.4 }); }
      return [w * 0.38, h * 0.33];
    } });
  M.fenshu = (b, w, h) => {   // 第六章首领
    sky(b, w, h, { top: '#180e08', bottom: '#8a3a14' });
    for (let i = 0; i < 50; i++) { const x = b.r(0, w), y = b.r(0, h); b.ctx.fillStyle = `rgba(255,${120 + b.r(0, 90) | 0},50,${b.r(0.2, 0.8).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3), 0, 6.28); b.ctx.fill(); }
    const col = []; for (let t = 0; t <= 1; t += 0.05) col.push([w * 0.5 + Math.sin(t * 7) * w * 0.1, h * (1 - t)]);
    b.stroke(col, { w: 60, color: '#c04a14', alpha: 0.6, dry: 0.5, taper: [0.1, 0.6] });
    b.stroke(col, { w: 26, color: '#ffb050', alpha: 0.8, dry: 0.4, taper: [0.1, 0.7] });
    glyphs(b, w, h, '诗书礼乐春秋', { n: 10, color: '60,40,30', y0: 0.2, y1: 0.9, size: 28 });
    eye(b.ctx, w * 0.5 - 12, h * 0.34, 4, '#fff0c0'); eye(b.ctx, w * 0.5 + 12, h * 0.34, 4, '#fff0c0');
  };

  // ── 第七章 · 兰亭 ───────────────────────────────────────────────────────
  const bamboo = (b, w, h, n = 6) => {
    for (let i = 0; i < n; i++) {
      const x = w * (0.04 + i * (0.92 / n)) + b.r(-10, 10);
      b.stroke([[x, h], [x + b.r(-6, 6), 0]], { w: 8, color: mix(JADE, INK, 0.35), alpha: 0.6, dry: 0.5 });
      for (let k = 1; k < 5; k++) { const y = h * (0.15 * k); b.stroke([[x, y], [x + b.r(20, 40), y - b.r(10, 26)]], { w: 2.4, color: mix(JADE, INK, 0.2), alpha: 0.6, dry: 0.2 }); }
    }
  };
  M.wangxizhi = person({ top: '#dfe4d8', bottom: '#f4f0e2', robe: '#e0e4dc', accent: '#7a8a70', head: 'bun', h: 0.7, x: 0.42, alpha: 0.9,
    back: (b, w, h) => { bamboo(b, w, h, 5); for (let r = 0; r < 3; r++) wave(b, -10, h * (0.82 + r * 0.06), w + 20, { n: 5, s: 0.7, color: '#7a9aa8' }); },
    prop: (b, w, h, f) => {
      b.wash([[f.rh[0] - 40, f.rh[1] + 26], [f.rh[0] + 44, f.rh[1] + 20], [f.rh[0] + 46, f.rh[1] + 62], [f.rh[0] - 38, f.rh[1] + 68]], { color: '#faf6e8', alpha: 0.95, blur: 1, edge: 0.7 });
      b.ctx.fillStyle = 'rgba(30,28,24,0.8)'; b.ctx.font = `${h * 0.075}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      '永和九年'.split('').forEach((c, i) => b.ctx.fillText(c, f.rh[0] - 24 + i * 22, f.rh[1] + 48));
      b.stroke([[f.rh[0], f.rh[1] - 4], [f.rh[0] + 6, f.rh[1] + 22]], { w: 4, color: '#6a4a2a', dry: 0.1 });
      b.ctx.fillStyle = rgba('#a8c8b0', 0.8); b.ctx.beginPath(); b.ctx.ellipse(w * 0.86, h * 0.86, 13, 7, 0, 0, 6.28); b.ctx.fill();  // 羽觞
    } });
  M.taoyuanming = person({ top: '#d8dcc0', bottom: '#f0eeda', robe: '#6a6a50', accent: '#a8a870', head: 'bun', h: 0.66, x: 0.36, lean: 0.2,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.42, alpha: 0.2, color: '#7a8a78' });
      b.stroke([[0, h * 0.72], [w, h * 0.68]], { w: 4, color: '#6a5a3a', dry: 0.6 });
      for (let x = 0.04; x < 1; x += 0.08) b.stroke([[w * x, h * 0.72], [w * x, h * 0.86]], { w: 3, color: '#6a5a3a', alpha: 0.8, dry: 0.5 });
      for (let i = 0; i < 16; i++) { const x = w * b.r(0.05, 0.98), y = h * b.r(0.6, 0.76); b.wash(b.blob(x, y, 8, 7, { wob: 0.35 }), { color: '#e8d060', alpha: 0.9, blur: 0.8, edge: 0.5 }); }
    },
    prop: (b, w, h, f) => { b.wash(b.blob(f.rh[0] + 6, f.rh[1], 9, 8, { wob: 0.4 }), { color: '#e8d060', alpha: 0.95, blur: 0.6, edge: 0.6 }); } });
  M.jikang = person({ top: '#c8ccc0', bottom: '#e8e8dc', robe: '#3a4038', accent: '#8a8a70', head: 'bun', h: 0.7, x: 0.48, lean: -0.15,
    back: (b, w, h) => { bamboo(b, w, h, 7); },
    prop: (b, w, h, f) => {
      const qx = f.sh[0] - 6, qy = f.sh[1] + 44;
      b.wash([[qx - 62, qy - 8], [qx + 62, qy - 12], [qx + 58, qy + 12], [qx - 58, qy + 14]], { color: '#5a3a22', alpha: 0.95, blur: 1, edge: 0.7 });
      for (let k = 0; k < 5; k++) b.stroke([[qx - 58, qy - 6 + k * 4], [qx + 58, qy - 9 + k * 4]], { w: 1.3, color: '#e8d8a0', alpha: 0.9, dry: 0 });
      const geese = [[0.7, 0.14], [0.78, 0.2], [0.86, 0.15]];
      for (const [gx, gy] of geese) b.stroke([[w * gx - 12, h * gy], [w * gx, h * gy - 6], [w * gx + 12, h * gy]], { w: 2.6, color: '#3a3a34', alpha: 0.8, dry: 0.2 });
    } });
  M.gukaizhi = person({ top: '#e0d4c0', bottom: '#f4ecda', robe: '#8a3a30', accent: GOLD, head: 'bun', h: 0.68, x: 0.34,
    back: (b, w, h) => {
      b.wash([[w * 0.5, h * 0.08], [w * 0.98, h * 0.08], [w * 0.98, h * 0.88], [w * 0.5, h * 0.88]], { color: '#f2ece0', alpha: 0.95, blur: 1, edge: 0.7, smooth: false });
      figure(b, w * 0.74, h * 0.82, h * 0.6, { robe: '#c8b8a0', accent: '#a08060', head: 'bun', alpha: 0.6 });
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0], f.rh[1] - 4], [f.rh[0] + 30, f.rh[1] - 34]], { w: 4, color: '#5a3a22', dry: 0.1 });
      eye(b.ctx, w * 0.71, h * 0.42, 3.4, '#2a2a2a'); eye(b.ctx, w * 0.78, h * 0.42, 3.4, '#2a2a2a');
    } });
  M['scroll-shishuo'] = scroll('#efe8d6', (b, iw, ih) => {
    sky(b, iw, ih, { top: '#dfe4dc', bottom: '#f2eee0' });
    for (let i = 0; i < 40; i++) { const x = b.r(0, iw), y = b.r(0, ih); b.ctx.fillStyle = `rgba(250,250,255,${b.r(0.3, 0.9).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3), 0, 6.28); b.ctx.fill(); }
    b.wash([[iw * 0.12, ih * 0.72], [iw * 0.62, ih * 0.7], [iw * 0.56, ih * 0.84], [iw * 0.16, ih * 0.86]], { color: '#3a2a1e', alpha: 0.9, blur: 1, edge: 0.6 });  // 小舟
    figure(b, iw * 0.34, ih * 0.73, ih * 0.3, { robe: '#5a5a4a', head: 'bun', alpha: 0.8 });
    for (let r = 0; r < 3; r++) wave(b, -10, ih * (0.86 + r * 0.05), iw + 20, { n: 5, s: 0.7, color: '#7a8a90' });
    b.ctx.fillStyle = 'rgba(40,36,30,0.7)'; b.ctx.font = `${ih * 0.11}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('兴尽而返', iw * 0.7, ih * 0.24);
  });
  M.talker = wraith({ top: '#2a2e34', bottom: '#8a9098', color: '#c8d8e8',
    body: (b, w, h) => {
      for (let i = 0; i < 4; i++) { const x = w * (0.3 + (i % 2) * 0.32), y = h * (0.34 + Math.floor(i / 2) * 0.3); b.wash(b.blob(x, y, 30, 22, { wob: 0.3 }), { color: '#dfe6ee', alpha: 0.28, blur: 8, edge: 0 }); }
      glyphs(b, w, h, '有无玄之又玄', { n: 12, color: '200,214,230', y0: 0.08, y1: 0.9, size: 24 });
      return blobBody(0.5, 0.52, 40, 44, '#39414a', 0.25)(b, w, h);
    } });
  M.drunkInk = wraith({ top: '#2c2a22', bottom: '#8a8470', color: '#e0d8b0',
    body: (b, w, h) => {
      b.wash([[w * 0.1, h * 0.16], [w * 0.9, h * 0.14], [w * 0.92, h * 0.92], [w * 0.08, h * 0.94]], { color: '#efe6d0', alpha: 0.85, blur: 1, edge: 0.6 });
      for (let i = 0; i < 5; i++) { const p = []; for (let t = 0; t < 1; t += 0.08) p.push([w * b.r(0.15, 0.85), h * b.r(0.2, 0.9)]); b.stroke(p, { w: 9, color: INK, alpha: 0.8, dry: 0.4, taper: [0.1, 0.6] }); }
      b.splatter(w * 0.5, h * 0.5, 110, { n: 26, alpha: 0.6, size: 3.4 });
      b.wash(b.blob(w * 0.78, h * 0.86, 16, 12), { color: '#5a3a22', alpha: 0.9, blur: 1, edge: 0.6 });   // 酒杯
      return [w * 0.46, h * 0.44];
    } });
  M.cutString = wraith({ top: '#26241e', bottom: '#7a7060', color: '#e8d8a0',
    body: (b, w, h) => {
      const qy = h * 0.56;
      b.wash([[w * 0.06, qy - 14], [w * 0.94, qy - 20], [w * 0.9, qy + 18], [w * 0.1, qy + 22]], { color: '#4a2e1c', alpha: 0.95, blur: 1, edge: 0.7 });
      for (let k = 0; k < 5; k++) {
        const y = qy - 10 + k * 5, cut = k % 2 === 0;
        if (cut) { b.stroke([[w * 0.08, y], [w * 0.42, y + 2]], { w: 1.4, color: '#e8d8a0', alpha: 0.9, dry: 0 }); b.stroke([[w * 0.56, y + 6], [w * 0.92, y - 3]], { w: 1.4, color: '#e8d8a0', alpha: 0.9, dry: 0 }); }
        else b.stroke([[w * 0.08, y], [w * 0.92, y - 4]], { w: 1.4, color: '#e8d8a0', alpha: 0.85, dry: 0 });
      }
      return [w * 0.5, h * 0.3];
    } });
  M.oldScroll = wraith({ top: '#302c24', bottom: '#8a8068', color: '#d8c8a0',
    body: (b, w, h) => {
      b.wash([[w * 0.16, h * 0.12], [w * 0.84, h * 0.1], [w * 0.86, h * 0.9], [w * 0.14, h * 0.92]], { color: '#e8dcc0', alpha: 0.9, blur: 1, edge: 0.6 });
      b.ctx.font = `${h * 0.1}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { b.ctx.fillStyle = `rgba(40,34,26,${Math.max(0.08, 0.6 - r * 0.1).toFixed(2)})`; b.ctx.fillText('临摹帖'[c], w * (0.32 + c * 0.18), h * (0.26 + r * 0.15)); }
      return [w * 0.5, h * 0.52];
    } });

  // ── 第八章 · 莫高窟 ─────────────────────────────────────────────────────
  const cliff = (b, w, h) => {
    b.wash([[0, h * 0.1], [w, h * 0.04], [w, h], [0, h]], { color: '#8a6a4a', alpha: 0.85, blur: 2, edge: 0.5 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const x = w * (0.06 + c * 0.16) + (r % 2) * w * 0.05, y = h * (0.2 + r * 0.2);
      b.wash(b.blob(x, y, w * 0.05, h * 0.06, { wob: 0.15 }), { color: '#2a1a12', alpha: 0.9, blur: 2, edge: 0.4 });
      if (b.R() < 0.5) { const g = b.ctx.createRadialGradient(x, y, 0, x, y, w * 0.06); g.addColorStop(0, 'rgba(255,200,120,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)'); b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(x, y, w * 0.06, 0, 6.28); b.ctx.fill(); }
    }
  };
  M.xuanzang = person({ top: '#d8b078', bottom: '#f0dcb0', sun: [0.2, 0.18, 0.05, '#fff0c8'], robe: '#8a5a30', accent: CINNABAR, head: 'bun', h: 0.76, x: 0.46, lean: 0.2, width: 1.1,
    back: (b, w, h) => { b.mountains(w, h, { base: 0.74, alpha: 0.25, color: '#b08850' }); for (let i = 0; i < 22; i++) { const x = b.r(0, w); b.stroke([[x, b.r(h * 0.6, h)], [x + 18, b.r(h * 0.6, h) + 6]], { w: 1.4, color: '#c8a070', alpha: 0.4, dry: 0 }); } },
    prop: (b, w, h, f) => {
      b.wash([[f.sh[0] - 30, f.sh[1] - 6], [f.sh[0] + 6, f.sh[1] - 12], [f.sh[0] + 10, f.sh[1] + 54], [f.sh[0] - 34, f.sh[1] + 58]], { color: '#5a3a1e', alpha: 0.9, blur: 1, edge: 0.6 });   // 经箱
      for (let k = 0; k < 4; k++) b.stroke([[f.sh[0] - 32, f.sh[1] + 4 + k * 13], [f.sh[0] + 8, f.sh[1] - 2 + k * 13]], { w: 2.4, color: '#c8a870', alpha: 0.8, dry: 0.2 });
      b.stroke([[f.rh[0] + 4, f.rh[1] - 44], [f.rh[0] + 8, h * 0.99]], { w: 4.6, color: '#4a3420', dry: 0.4 });
      const g = b.ctx.createRadialGradient(f.head[0], f.head[1], 0, f.head[0], f.head[1], 34);
      g.addColorStop(0, 'rgba(255,230,160,0.5)'); g.addColorStop(1, 'rgba(255,230,160,0)');
      b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(f.head[0], f.head[1], 34, 0, 6.28); b.ctx.fill();
    } });
  M.pipa = (b, w, h) => {
    sky(b, w, h, { top: '#7a2a2a', bottom: '#d8a860' });
    for (let i = 0; i < 4; i++) b.cloud(w * (0.1 + i * 0.28), h * (0.12 + (i % 2) * 0.1), 16, { color: '#f0d0a0', alpha: 0.5, w: 3 });
    const f = figure(b, w * 0.48, h * 0.94, h * 0.72, { robe: '#c85a4a', accent: GOLD, head: 'bun', sleeve: 1.6, lean: 0.35, stance: 1.3, alpha: 0.95 });
    // pipa held behind the head
    const px = f.head[0] + 6, py = f.head[1] - 22;
    b.wash(b.blob(px, py + 16, 20, 26, { wob: 0.08 }), { color: '#8a5a2a', alpha: 0.95, blur: 1, edge: 0.7 });
    b.wash([[px - 6, py - 10], [px + 6, py - 10], [px + 4, py - 42], [px - 4, py - 42]], { color: '#6a4420', alpha: 0.95, blur: 0.6, edge: 0.6, smooth: false });
    for (let k = -1.5; k <= 1.5; k++) b.stroke([[px + k * 4, py + 34], [px + k * 1.5, py - 40]], { w: 1.2, color: '#f0e0a0', alpha: 0.9, dry: 0 });
    for (const d of [-1, 1]) { const p = []; for (let t = 0; t < 1; t += 0.05) p.push([f.sh[0] + d * (24 + t * w * 0.3), f.sh[1] + 10 - Math.sin(t * 3.2) * h * 0.24]); b.stroke(p, { w: 16, color: '#f0c070', alpha: 0.6, dry: 0.4, taper: [0.1, 0.85] }); }
    b.splatter(w * 0.5, h * 0.4, 130, { color: GOLD, n: 22, size: 2.2, alpha: 0.5 });
  };
  M.lezun = person({ top: '#c8a070', bottom: '#e8d0a0', sun: [0.74, 0.16, 0.06, '#fff0b0'], robe: '#8a6a3a', accent: '#c8a04a', head: 'bun', h: 0.66, x: 0.28,
    back: cliff,
    prop: (b, w, h, f) => { b.stroke([[f.rh[0], f.rh[1]], [f.rh[0] + 26, f.rh[1] + 14]], { w: 6, color: '#4a4a4a', dry: 0.2 }); b.splatter(f.rh[0] + 28, f.rh[1] + 16, 26, { color: '#c8b090', n: 14, size: 2, alpha: 0.7 }); } });
  M.painter = person({ top: '#5a3a28', bottom: '#b08a5a', robe: '#4a6a5a', accent: '#c8a04a', head: 'bun', h: 0.68, x: 0.4, lean: 0.25,
    back: (b, w, h) => {
      b.wash([[w * 0.45, 0], [w, 0], [w, h], [w * 0.45, h]], { color: '#d8b078', alpha: 0.5, blur: 3, edge: 0.3, smooth: false });
      for (let i = 0; i < 3; i++) { const y = h * (0.18 + i * 0.28); figure(b, w * (0.62 + (i % 2) * 0.2), y + h * 0.22, h * 0.2, { robe: ['#2a6a7a', '#8a3a2a', '#c8a04a'][i], head: 'bun', alpha: 0.75 }); }
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0], f.rh[1] - 6], [f.rh[0] + 24, f.rh[1] - 26]], { w: 3.4, color: '#5a3a22', dry: 0.1 });
      for (const [c, dx] of [['#2a6a7a', -24], [CINNABAR, -10], [GOLD, 4]]) b.wash(b.blob(f.lh[0] + dx, f.lh[1] + 14, 8, 6), { color: c, alpha: 0.9, blur: 0.8, edge: 0.6 });
    } });
  M['scroll-dunhuang'] = scroll('#e8d0a0', (b, iw, ih) => {
    b.ctx.fillStyle = '#e8d8b8'; b.ctx.fillRect(0, 0, iw, ih);
    for (let i = 0; i < 6; i++) { b.ctx.fillStyle = `rgba(${[42, 106, 122]},0.12)`; b.ctx.fillRect(0, ih * i * 0.17, iw, ih * 0.08); }
    b.ctx.font = `${ih * 0.085}px ${FONT_BRUSH}`; b.ctx.textAlign = 'left';
    const txt = '枕前发尽千般愿要休且待青山烂水面上秤锤浮';
    for (let c = 0; c < 4; c++) for (let r = 0; r < 7; r++) { b.ctx.fillStyle = `rgba(40,30,20,${b.r(0.45, 0.85).toFixed(2)})`; b.ctx.fillText(txt[(c * 7 + r) % txt.length], iw * (0.76 - c * 0.2), ih * (0.16 + r * 0.115)); }
    b.ctx.strokeStyle = 'rgba(120,60,30,0.5)'; b.ctx.lineWidth = 2;
    for (let c = 0; c < 5; c++) { b.ctx.beginPath(); b.ctx.moveTo(iw * (0.84 - c * 0.2), ih * 0.06); b.ctx.lineTo(iw * (0.84 - c * 0.2), ih * 0.94); b.ctx.stroke(); }
  });
  M.quicksand = wraith({ top: '#3a2c1c', bottom: '#b09060', color: '#e8d0a0',
    body: (b, w, h) => {
      for (let r = 0; r < 5; r++) { const y = h * (0.5 + r * 0.1); b.wash([[0, y], [w * 0.3, y - 14], [w * 0.7, y + 10], [w, y - 6], [w, h], [0, h]], { color: '#8a6a40', alpha: 0.35, blur: 6, edge: 0.2 }); }
      for (let i = 0; i < 5; i++) { const x = w * (0.2 + i * 0.15); b.stroke([[x, h * 0.78], [x + b.r(-6, 6), h * 0.52]], { w: 7, color: '#3a2a18', alpha: 0.85, dry: 0.3, taper: [0.2, 0.6] }); }
      return [w * 0.5, h * 0.4];
    } });
  M.donor = wraith({ top: '#4a3020', bottom: '#b08a58', color: '#f0d8a0',
    body: (b, w, h) => {
      b.wash([[w * 0.1, h * 0.08], [w * 0.9, h * 0.08], [w * 0.9, h * 0.94], [w * 0.1, h * 0.94]], { color: '#c8a070', alpha: 0.5, blur: 4, edge: 0.3, smooth: false });
      const f = figure(b, w * 0.5, h * 0.9, h * 0.6, { robe: '#8a6a4a', accent: '#6a4a2a', head: 'hat', alpha: 0.45 });
      b.wash([[w * 0.36, h * 0.92], [w * 0.64, h * 0.92], [w * 0.64, h], [w * 0.36, h]], { color: '#e8dcc0', alpha: 0.55, blur: 2, edge: 0.4, smooth: false });
      return [f.head[0], f.head[1]];
    } });
  M.peelFlyer = wraith({ top: '#4a2420', bottom: '#c09060', color: '#ffd0a0',
    body: (b, w, h) => {
      for (const d of [-1, 1]) { const p = []; for (let t = 0; t < 1; t += 0.05) p.push([w * 0.5 + d * (20 + t * w * 0.34), h * 0.4 - Math.sin(t * 3) * h * 0.24 + t * h * 0.2]); b.stroke(p, { w: 16, color: '#e8b070', alpha: 0.55, dry: 0.5, taper: [0.1, 0.85] }); }
      for (let i = 0; i < 26; i++) { const x = b.r(0, w), y = b.r(h * 0.2, h); b.ctx.fillStyle = `rgba(${[200, 120, 70]},${b.r(0.3, 0.8).toFixed(2)})`; b.ctx.fillRect(x, y, b.r(3, 9), b.r(3, 8)); }
      return blobBody(0.5, 0.42, 26, 30, '#6a3020', 0.2)(b, w, h);
    } });
  M.sealedCave = wraith({ top: '#2e2418', bottom: '#8a7048', color: '#e8c890',
    body: (b, w, h) => {
      b.wash([[w * 0.14, h * 0.1], [w * 0.86, h * 0.1], [w * 0.86, h], [w * 0.14, h]], { color: '#6a5436', alpha: 0.95, blur: 1.5, edge: 0.5, smooth: false });
      for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { b.ctx.strokeStyle = 'rgba(40,30,18,0.7)'; b.ctx.lineWidth = 2; b.ctx.strokeRect(w * (0.16 + c * 0.175) + (r % 2) * 10, h * (0.14 + r * 0.115), w * 0.16, h * 0.1); }
      b.wash(b.blob(w * 0.5, h * 0.52, 34, 40, { wob: 0.2 }), { color: '#14100a', alpha: 0.9, blur: 4, edge: 0.3 });
      return [w * 0.5, h * 0.46];
    } });

  // ── 第九章 · 江南市井 ───────────────────────────────────────────────────
  const town = (b, w, h) => {
    sky(b, w, h, { top: '#5a6068', bottom: '#c8ccc8' });
    for (let i = 0; i < 4; i++) {
      const x = w * (i * 0.27), hh = h * (0.34 + (i % 2) * 0.1);
      b.wash([[x, h * 0.9 - hh], [x + w * 0.26, h * 0.9 - hh], [x + w * 0.26, h * 0.9], [x, h * 0.9]], { color: '#e8e6de', alpha: 0.92, blur: 1, edge: 0.6, smooth: false });
      b.wash([[x - 8, h * 0.9 - hh], [x + w * 0.13, h * 0.9 - hh - 22], [x + w * 0.26 + 8, h * 0.9 - hh]], { color: '#3a3a3e', alpha: 0.95, blur: 1, edge: 0.6 });
      if (b.R() < 0.7) { b.ctx.fillStyle = 'rgba(255,200,120,0.75)'; b.ctx.fillRect(x + w * 0.09, h * 0.9 - hh + 24, w * 0.07, h * 0.08); }
    }
    for (let r = 0; r < 3; r++) wave(b, -10, h * (0.92 + r * 0.04), w + 20, { n: 6, s: 0.8, color: '#6a8a88' });
  };
  M.caoxueqin = person({ top: '#2a2c34', bottom: '#8a8a90', robe: '#4a4a56', accent: '#8a6a7a', head: 'bun', h: 0.68, x: 0.42, lean: 0.25,
    back: (b, w, h) => {
      const g = b.ctx.createRadialGradient(w * 0.72, h * 0.5, 0, w * 0.72, h * 0.5, h * 0.45);
      g.addColorStop(0, 'rgba(255,214,140,0.7)'); g.addColorStop(1, 'rgba(255,214,140,0)');
      b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
      b.wash([[w * 0.58, h * 0.66], [w, h * 0.62], [w, h], [w * 0.56, h]], { color: '#5a4a38', alpha: 0.9, blur: 1.5, edge: 0.5, smooth: false });
      for (let i = 0; i < 12; i++) b.wash([[w * b.r(0.6, 0.95), h * b.r(0.5, 0.64)], [w * b.r(0.6, 0.95) + 26, h * b.r(0.5, 0.64) - 4], [w * b.r(0.6, 0.95) + 24, h * b.r(0.5, 0.64) + 16]], { color: '#f2ecd8', alpha: 0.8, blur: 1, edge: 0.5 });
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0], f.rh[1] - 4], [f.rh[0] + 18, f.rh[1] - 26]], { w: 3.4, color: '#5a3a22', dry: 0.1 });
      b.wash(b.blob(w * 0.16, h * 0.84, 20, 16, { wob: 0.2 }), { color: '#7a7a86', alpha: 0.9, blur: 1.5, edge: 0.5 });   // 那块石头
      b.ctx.fillStyle = 'rgba(240,230,210,0.8)'; b.ctx.font = `${h * 0.05}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center'; b.ctx.fillText('石', w * 0.16, h * 0.86);
    } });
  M.wuchengen = person({ top: '#c8ccb8', bottom: '#eae8d2', robe: '#c87a2a', accent: GOLD, head: 'bun', h: 0.68, x: 0.5, lean: 0.4, stance: 1.2,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.62, alpha: 0.24, color: '#6a7a5a' });
      const g = b.ctx.createLinearGradient(w * 0.6, h * 0.1, w * 0.6, h * 0.8);
      g.addColorStop(0, 'rgba(230,240,245,0.85)'); g.addColorStop(1, 'rgba(230,240,245,0.1)');
      b.ctx.fillStyle = g; b.ctx.fillRect(w * 0.54, h * 0.08, w * 0.2, h * 0.72);    // 水帘
      for (let i = 0; i < 18; i++) { const x = w * b.r(0.54, 0.74); b.stroke([[x, h * 0.1], [x + b.r(-4, 4), h * 0.8]], { w: 2, color: '#f0f6f8', alpha: 0.6, dry: 0 }); }
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.lh[0] - 14, f.lh[1] + 30], [f.rh[0] + 40, f.rh[1] - 44]], { w: 6, color: GOLD, dry: 0.1, taper: [0.05, 0.05] });   // 金箍棒
      b.ctx.strokeStyle = rgba('#f0e0a0', 0.9); b.ctx.lineWidth = 3;
      b.ctx.beginPath(); b.ctx.arc(f.head[0], f.head[1] - 10, 11, 3.6, 6.1); b.ctx.stroke();   // 金箍
    } });
  M.lishizhen = person({ top: '#ccd4bc', bottom: '#eef0dc', robe: '#5a6a4a', accent: JADE, head: 'bun', h: 0.7, x: 0.4, lean: 0.15,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.5, alpha: 0.16, color: '#6a7a60' });
      for (let i = 0; i < 16; i++) { const x = w * b.r(0.05, 0.98), y = h * b.r(0.6, 0.98); b.stroke([[x, y], [x + b.r(-6, 6), y - b.r(16, 34)]], { w: 2.4, color: '#4a6a3a', alpha: 0.8, dry: 0.3 }); b.wash(b.blob(x + b.r(-6, 6), y - b.r(16, 34), 7, 5, { wob: 0.4 }), { color: '#5a8a48', alpha: 0.85, blur: 0.8, edge: 0.5 }); }
    },
    prop: (b, w, h, f) => {
      b.wash([[f.sh[0] + 20, f.sh[1] + 18], [f.sh[0] + 54, f.sh[1] + 12], [f.sh[0] + 58, f.sh[1] + 54], [f.sh[0] + 22, f.sh[1] + 60]], { color: '#8a6a44', alpha: 0.9, blur: 1, edge: 0.6 });   // 药篓
      for (let k = 0; k < 5; k++) b.stroke([[f.sh[0] + 26 + k * 7, f.sh[1] + 16], [f.sh[0] + 22 + k * 8, f.sh[1] - 12]], { w: 2.2, color: '#4a6a3a', alpha: 0.85, dry: 0.3 });
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 26]], { w: 2.2, color: '#b8b4a8', alpha: 0.8, dry: 0.4 });
    } });
  M.xuxiake = person({ top: '#b8c4cc', bottom: '#e4e8e0', robe: '#6a6250', accent: '#a09070', head: 'hat', h: 0.68, x: 0.36, lean: 0.3,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.36, alpha: 0.3, peak: 0.3, color: '#5a6a72' });
      b.mountains(w, h, { base: 0.58, alpha: 0.24, peak: 0.22, color: '#46545c' });
      b.mist(w, h, h * 0.62, { alpha: 0.55 });
    },
    prop: (b, w, h, f) => {
      b.stroke([[f.rh[0] + 4, f.rh[1] - 36], [f.rh[0] + 12, h * 0.99]], { w: 4, color: '#4a3a22', dry: 0.5 });
      b.wash([[f.sh[0] - 40, f.sh[1] + 14], [f.sh[0] - 12, f.sh[1] + 10], [f.sh[0] - 8, f.sh[1] + 48], [f.sh[0] - 44, f.sh[1] + 52]], { color: '#7a6a4a', alpha: 0.9, blur: 1, edge: 0.6 });
    } });
  M['scroll-dadian'] = scroll('#e8e0cc', (b, iw, ih) => {
    b.ctx.fillStyle = '#d8c8a0'; b.ctx.fillRect(0, 0, iw, ih);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = iw * (0.06 + c * 0.186), y = ih * (0.1 + r * 0.29);
      b.ctx.fillStyle = mix('#8a3a2a', '#5a2418', (r + c) % 3 * 0.25); b.ctx.fillRect(x, y, iw * 0.15, ih * 0.24);
      b.ctx.fillStyle = 'rgba(240,226,190,0.9)'; b.ctx.fillRect(x + iw * 0.05, y + ih * 0.03, iw * 0.05, ih * 0.14);
      b.ctx.fillStyle = 'rgba(40,24,16,0.85)'; b.ctx.font = `${ih * 0.05}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      b.ctx.fillText('典', x + iw * 0.075, y + ih * 0.1);
    }
    b.ctx.fillStyle = 'rgba(60,40,24,0.55)'; b.ctx.font = `${ih * 0.1}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('永乐大典', iw * 0.5, ih * 0.96);
  });
  M.bannedBook = wraith({ top: '#2a1a14', bottom: '#8a5a3a', color: '#ffb070',
    body: (b, w, h) => {
      for (let i = 0; i < 5; i++) {
        const x = w * (0.2 + i * 0.14), y = h * (0.5 + (i % 2) * 0.16);
        b.ctx.save(); b.ctx.translate(x, y); b.ctx.rotate(b.r(-0.4, 0.4));
        b.ctx.fillStyle = 'rgba(60,40,28,0.9)'; b.ctx.fillRect(-16, -22, 32, 44);
        b.ctx.strokeStyle = rgba(CINNABAR, 0.85); b.ctx.lineWidth = 4;
        b.ctx.beginPath(); b.ctx.moveTo(-12, -18); b.ctx.lineTo(12, 18); b.ctx.moveTo(12, -18); b.ctx.lineTo(-12, 18); b.ctx.stroke();
        b.ctx.restore();
      }
      flame(b, w * 0.5, h * 0.98, 60, { n: 5 });
      return [w * 0.5, h * 0.34];
    } });
  M.mothSilk = wraith({ top: '#2e2a22', bottom: '#8a8068', color: '#d8e0a0',
    body: (b, w, h) => {
      b.wash([[w * 0.14, h * 0.18], [w * 0.86, h * 0.16], [w * 0.88, h * 0.86], [w * 0.12, h * 0.88]], { color: '#c8a8b0', alpha: 0.85, blur: 1.5, edge: 0.5 });
      for (let i = 0; i < 40; i++) { const x = w * b.r(0.16, 0.84), y = h * b.r(0.2, 0.86); b.stroke([[x, y], [x + b.r(-8, 8), y + b.r(-8, 8)]], { w: 1.2, color: ['#c8a04a', '#4a8c5c', '#8a3a4a'][i % 3], alpha: 0.5, dry: 0 }); }
      for (let i = 0; i < 9; i++) b.wash(b.blob(w * b.r(0.2, 0.8), h * b.r(0.25, 0.82), 9, 7, { wob: 0.5 }), { color: '#2a2418', alpha: 0.9, blur: 1.5, edge: 0.3 });
      return [w * 0.5, h * 0.5];
    } });
  M.lostCure = wraith({ top: '#28302c', bottom: '#7a8a80', color: '#a8e0c0',
    body: (b, w, h) => {
      for (let i = 0; i < 6; i++) {
        const x = w * (0.16 + (i % 3) * 0.28), y = h * (0.34 + Math.floor(i / 3) * 0.3);
        b.wash([[x - 22, y - 16], [x + 22, y - 18], [x + 20, y + 18], [x - 20, y + 20]], { color: '#c8b48a', alpha: 0.85, blur: 1, edge: 0.6 });
        b.ctx.fillStyle = `rgba(40,34,24,${b.r(0.1, 0.5).toFixed(2)})`; b.ctx.font = `${h * 0.06}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
        b.ctx.fillText('方', x, y + 6);
      }
      return blobBody(0.5, 0.86, 34, 18, '#1a2420', 0.4)(b, w, h);
    } });
  M.ghostBoat = wraith({ top: '#1f2630', bottom: '#6a7a84', color: '#c8e0f0',
    body: (b, w, h) => {
      water(b, w, h, 0.72, 4, '#2a3a4a');
      b.wash([[w * 0.1, h * 0.6], [w * 0.9, h * 0.58], [w * 0.8, h * 0.76], [w * 0.18, h * 0.78]], { color: '#2a2018', alpha: 0.95, blur: 1, edge: 0.6 });
      b.wash([[w * 0.32, h * 0.6], [w * 0.68, h * 0.58], [w * 0.62, h * 0.3], [w * 0.38, h * 0.32]], { color: '#3a3a34', alpha: 0.9, blur: 1.5, edge: 0.5 });
      b.ctx.fillStyle = 'rgba(255,200,120,0.35)'; b.ctx.beginPath(); b.ctx.arc(w * 0.5, h * 0.46, 12, 0, 6.28); b.ctx.fill();
      return [w * 0.5, h * 0.44];
    } });
  M.jinhui = (b, w, h) => {   // 第九章首领
    sky(b, w, h, { top: '#1a1410', bottom: '#6a5038' });
    const g = b.ctx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, h * 0.5);
    g.addColorStop(0, 'rgba(255,200,120,0.4)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    const f = figure(b, w * 0.5, h * 1.0, h * 0.86, { robe: '#3a2e24', accent: '#6a4a30', head: 'hat', sleeve: 1.5, width: 1.4, alpha: 0.6 });
    for (let i = 0; i < 9; i++) {   // stacks of books being sorted away
      const x = w * (0.1 + (i % 3) * 0.05), y = h * (0.94 - Math.floor(i / 3) * 0.07);
      b.ctx.fillStyle = `rgba(60,44,30,0.9)`; b.ctx.fillRect(x, y, w * 0.14, h * 0.05);
    }
    b.ctx.fillStyle = rgba(CINNABAR, 0.8); b.ctx.font = `${h * 0.1}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('禁', w * 0.82, h * 0.3);
    eye(b.ctx, f.head[0] - 5, f.head[1], 3.2, '#ffd890');
  };

  // ── 第十章 · 观星台 ─────────────────────────────────────────────────────
  const starfield = (b, w, h, n = 70) => {
    for (let i = 0; i < n; i++) { const x = b.r(0, w), y = b.r(0, h * 0.7); b.ctx.fillStyle = `rgba(230,238,255,${b.r(0.25, 0.95).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(0.7, 2.2), 0, 6.28); b.ctx.fill(); }
  };
  M.zhangheng = person({ top: '#0e1626', bottom: '#4a5464', robe: '#3a4454', accent: '#8aa0c0', head: 'hat', h: 0.68, x: 0.34,
    back: (b, w, h) => {
      starfield(b, w, h);
      const cx = w * 0.72, cy = h * 0.42, R = h * 0.22;
      b.ctx.strokeStyle = rgba(GOLD, 0.9); b.ctx.lineWidth = 3;
      for (const [rx, ry, rot] of [[R, R, 0], [R, R * 0.35, 0], [R * 0.35, R, 0], [R * 0.8, R * 0.8, 0.6]]) { b.ctx.save(); b.ctx.translate(cx, cy); b.ctx.rotate(rot); b.ctx.beginPath(); b.ctx.ellipse(0, 0, rx, ry, 0, 0, 6.28); b.ctx.stroke(); b.ctx.restore(); }
      b.ctx.fillStyle = rgba('#ffe6a0', 0.9); b.ctx.beginPath(); b.ctx.arc(cx, cy, 7, 0, 6.28); b.ctx.fill();
      b.stroke([[cx, cy + R], [cx, h]], { w: 6, color: '#5a4a2a', dry: 0.3 });
    },
    prop: (b, w, h, f) => { for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 24]], { w: 2.2, color: '#b8c0cc', alpha: 0.7, dry: 0.4 }); } });
  M.zuchongzhi = person({ top: '#152030', bottom: '#5a6a7a', robe: '#4a5a6a', accent: '#a0c0d8', head: 'hat', h: 0.66, x: 0.32, lean: 0.2,
    back: (b, w, h) => {
      starfield(b, w, h, 40);
      const cx = w * 0.68, cy = h * 0.55;
      for (let k = 1; k <= 5; k++) { b.ctx.strokeStyle = `rgba(200,220,240,${0.7 - k * 0.1})`; b.ctx.lineWidth = 2; b.ctx.beginPath(); b.ctx.arc(cx, cy, h * 0.05 * k, 0, 6.28); b.ctx.stroke(); }
      const R = h * 0.25;
      b.ctx.strokeStyle = rgba(GOLD, 0.7); b.ctx.lineWidth = 2; b.ctx.beginPath();
      for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28; const p = [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; k ? b.ctx.lineTo(...p) : b.ctx.moveTo(...p); }
      b.ctx.closePath(); b.ctx.stroke();
      b.ctx.fillStyle = 'rgba(230,240,255,0.85)'; b.ctx.font = `${h * 0.075}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      b.ctx.fillText('355', cx, cy - 6); b.ctx.fillText('113', cx, cy + h * 0.08);
      b.ctx.strokeStyle = 'rgba(230,240,255,0.85)'; b.ctx.lineWidth = 2; b.ctx.beginPath(); b.ctx.moveTo(cx - 26, cy + 4); b.ctx.lineTo(cx + 26, cy + 4); b.ctx.stroke();
    },
    prop: (b, w, h, f) => { b.stroke([[f.rh[0], f.rh[1]], [f.rh[0] + 22, f.rh[1] + 10]], { w: 3, color: '#c8b890', dry: 0.1 }); } });
  M.libing = person({ top: '#b0bcb4', bottom: '#e0e4d6', robe: '#4a4438', accent: OCHRE, head: 'hat', h: 0.72, x: 0.3, width: 1.2,
    back: (b, w, h) => {
      // 鱼嘴分水: the river splitting round a stone nose
      b.wash([[w * 0.38, h * 0.36], [w * 0.62, h * 0.42], [w, h * 0.34], [w, h], [w * 0.3, h]], { color: '#6a8a9a', alpha: 0.55, blur: 3, edge: 0.3 });
      b.wash([[w * 0.42, h * 0.3], [w * 0.7, h * 0.24], [w, h * 0.3], [w, h * 0.06], [w * 0.5, h * 0.1]], { color: '#7a9aa8', alpha: 0.45, blur: 4, edge: 0.2 });
      b.wash([[w * 0.36, h * 0.34], [w * 0.56, h * 0.3], [w * 0.68, h * 0.44], [w * 0.5, h * 0.52]], { color: '#8a8478', alpha: 0.95, blur: 1.5, edge: 0.6 });
      for (let r = 0; r < 4; r++) wave(b, w * 0.3, h * (0.6 + r * 0.1), w * 0.8, { n: 4, s: 1, color: '#4a6a7a' });
    },
    prop: (b, w, h, f) => { b.stroke([[f.rh[0] + 2, f.rh[1] - 30], [f.rh[0] + 10, h * 0.99]], { w: 6, color: '#4a3a24', dry: 0.4 }); b.wash([[f.rh[0] - 6, f.rh[1] - 40], [f.rh[0] + 16, f.rh[1] - 44], [f.rh[0] + 14, f.rh[1] - 24], [f.rh[0] - 4, f.rh[1] - 22]], { color: '#6a6a6a', alpha: 0.9, blur: 0.6, edge: 0.6 }); } });
  M.songyingxing = person({ top: '#2a1a14', bottom: '#b06a38', robe: '#5a4430', accent: '#c87a2a', head: 'hat', h: 0.7, x: 0.62, lean: -0.2,
    back: (b, w, h) => {
      b.wash([[0, h * 0.5], [w * 0.46, h * 0.5], [w * 0.46, h], [0, h]], { color: '#3a2a1e', alpha: 0.9, blur: 1.5, edge: 0.5, smooth: false });
      const g = b.ctx.createRadialGradient(w * 0.22, h * 0.72, 0, w * 0.22, h * 0.72, h * 0.3);
      g.addColorStop(0, 'rgba(255,170,60,0.95)'); g.addColorStop(1, 'rgba(255,120,30,0)');
      b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(w * 0.22, h * 0.72, h * 0.3, 0, 6.28); b.ctx.fill();
      flame(b, w * 0.22, h * 0.82, 54, { n: 5 });
      for (let i = 0; i < 14; i++) { const x = w * b.r(0.05, 0.42), y = h * b.r(0.4, 0.8); b.ctx.fillStyle = `rgba(255,${180 + b.r(0, 60) | 0},90,${b.r(0.3, 0.9).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 2.6), 0, 6.28); b.ctx.fill(); }
    },
    prop: (b, w, h, f) => {
      b.wash([[f.lh[0] - 34, f.lh[1] - 4], [f.lh[0] + 14, f.lh[1] - 12], [f.lh[0] + 16, f.lh[1] + 28], [f.lh[0] - 32, f.lh[1] + 34]], { color: '#f2e8d0', alpha: 0.95, blur: 0.8, edge: 0.7 });
      for (let k = 0; k < 4; k++) b.stroke([[f.lh[0] - 28, f.lh[1] + 2 + k * 8], [f.lh[0] + 10, f.lh[1] - 4 + k * 8]], { w: 1.6, color: '#4a3a24', alpha: 0.8, dry: 0.2 });
    } });
  M['scroll-jiuzhang'] = scroll('#e4e8d8', (b, iw, ih) => {
    b.ctx.fillStyle = '#eef0e0'; b.ctx.fillRect(0, 0, iw, ih);
    b.ctx.strokeStyle = 'rgba(40,60,50,0.75)'; b.ctx.lineWidth = 2.4;
    // 勾股 + 割圆
    b.ctx.beginPath(); b.ctx.moveTo(iw * 0.14, ih * 0.8); b.ctx.lineTo(iw * 0.5, ih * 0.8); b.ctx.lineTo(iw * 0.14, ih * 0.34); b.ctx.closePath(); b.ctx.stroke();
    b.ctx.strokeRect(iw * 0.14, ih * 0.8, iw * 0.1, -ih * 0.1);
    const cx = iw * 0.72, cy = ih * 0.46, R = ih * 0.22;
    b.ctx.beginPath(); b.ctx.arc(cx, cy, R, 0, 6.28); b.ctx.stroke();
    b.ctx.beginPath();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; const p = [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; k ? b.ctx.lineTo(...p) : b.ctx.moveTo(...p); }
    b.ctx.closePath(); b.ctx.stroke();
    b.ctx.fillStyle = 'rgba(40,60,50,0.8)'; b.ctx.font = `${ih * 0.09}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('勾股', iw * 0.26, ih * 0.94); b.ctx.fillText('割圆', cx, ih * 0.94);
    b.ctx.fillText('九章', iw * 0.5, ih * 0.16);
  });
  M.brokenGear = wraith({ top: '#20242c', bottom: '#7a8288', color: '#c8d8f0',
    body: (b, w, h) => {
      for (let i = 0; i < 3; i++) {
        const x = w * (0.28 + i * 0.22), y = h * (0.42 + (i % 2) * 0.2), R = h * (0.16 - i * 0.02);
        b.ctx.strokeStyle = 'rgba(160,170,180,0.9)'; b.ctx.lineWidth = 5;
        b.ctx.beginPath(); b.ctx.arc(x, y, R, 0.4, 5.6); b.ctx.stroke();
        for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28; b.ctx.beginPath(); b.ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); b.ctx.lineTo(x + Math.cos(a) * R * 1.2, y + Math.sin(a) * R * 1.2); b.ctx.stroke(); }
      }
      return [w * 0.5, h * 0.24];
    } });
  M.deadKiln = wraith({ top: '#1e1a18', bottom: '#6a5040', color: '#ff9a50',
    body: (b, w, h) => {
      b.wash([[w * 0.22, h], [w * 0.28, h * 0.4], [w * 0.72, h * 0.4], [w * 0.78, h]], { color: '#4a3a2e', alpha: 0.95, blur: 1.5, edge: 0.5 });
      b.wash(b.blob(w * 0.5, h * 0.72, 30, 22, { wob: 0.2 }), { color: '#120c08', alpha: 0.95, blur: 2, edge: 0.4 });
      const g = b.ctx.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, h * 0.16);
      g.addColorStop(0, 'rgba(255,120,40,0.7)'); g.addColorStop(1, 'rgba(255,120,40,0)');
      b.ctx.fillStyle = g; b.ctx.beginPath(); b.ctx.arc(w * 0.5, h * 0.72, h * 0.16, 0, 6.28); b.ctx.fill();
      for (let i = 0; i < 10; i++) { const x = w * b.r(0.3, 0.7), y = h * b.r(0.5, 0.82); b.ctx.fillStyle = `rgba(255,${100 + b.r(0, 80) | 0},40,${b.r(0.3, 0.8).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3), 0, 6.28); b.ctx.fill(); }
      return [w * 0.5, h * 0.5];
    } });
  M.lostPlan = wraith({ top: '#28282a', bottom: '#82868a', color: '#b8d0e0',
    body: (b, w, h) => {
      b.wash([[w * 0.1, h * 0.14], [w * 0.9, h * 0.12], [w * 0.92, h * 0.9], [w * 0.08, h * 0.92]], { color: '#dfe2e0', alpha: 0.9, blur: 1, edge: 0.6 });
      b.ctx.strokeStyle = 'rgba(50,60,70,0.7)'; b.ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { b.ctx.beginPath(); b.ctx.moveTo(w * b.r(0.12, 0.88), h * b.r(0.16, 0.88)); b.ctx.lineTo(w * b.r(0.12, 0.88), h * b.r(0.16, 0.88)); b.ctx.stroke(); }
      b.ctx.fillStyle = '#1a1c1e';
      for (let i = 0; i < 3; i++) b.ctx.fillRect(w * b.r(0.2, 0.7), h * b.r(0.2, 0.7), w * 0.16, h * 0.14);
      return [w * 0.5, h * 0.5];
    } });
  M.namelessSmith = wraith({ top: '#221c18', bottom: '#7a6450', color: '#ffc880',
    body: (b, w, h) => {
      const f = figure(b, w * 0.5, h * 1.0, h * 0.8, { robe: '#3a2e24', accent: '#6a4a30', head: 'bun', width: 1.4, alpha: 0.6 });
      for (const [dx, tool] of [[-40, 'hammer'], [38, 'chisel']]) {
        b.stroke([[f.sh[0] + dx, f.sh[1] + 30], [f.sh[0] + dx * 1.3, f.sh[1] - 10]], { w: 5, color: '#4a3a28', dry: 0.3 });
        b.wash(b.blob(f.sh[0] + dx * 1.35, f.sh[1] - 16, tool === 'hammer' ? 12 : 6, 8), { color: '#6a6a6a', alpha: 0.9, blur: 0.8, edge: 0.6 });
      }
      for (let i = 0; i < 16; i++) { const x = b.r(0, w), y = b.r(h * 0.6, h); b.ctx.fillStyle = `rgba(255,${160 + b.r(0, 60) | 0},80,${b.r(0.2, 0.7).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 2.4), 0, 6.28); b.ctx.fill(); }
      return [f.head[0], f.head[1]];
    } });
  M.wangchuan = (b, w, h) => {   // 终章首领：遗忘之渊
    sky(b, w, h, { top: '#05060c', bottom: '#1a2030' });
    starfield(b, w, h, 90);
    // a hole in the sky: everything bends toward it and nothing comes out
    const cx = w * 0.5, cy = h * 0.5, R = h * 0.3;
    for (let k = 6; k >= 1; k--) {
      b.ctx.fillStyle = `rgba(6,8,14,${0.18 + k * 0.05})`;
      b.ctx.beginPath(); b.ctx.arc(cx, cy, R * (0.5 + k * 0.12), 0, 6.28); b.ctx.fill();
    }
    b.ctx.fillStyle = '#04050a'; b.ctx.beginPath(); b.ctx.arc(cx, cy, R * 0.62, 0, 6.28); b.ctx.fill();
    for (let i = 0; i < 26; i++) {   // fragments spiralling in
      const a = b.r(0, 6.28), d = R * b.r(0.8, 2.1);
      const p = []; for (let t = 0; t < 1; t += 0.12) p.push([cx + Math.cos(a + t * 1.1) * d * (1 - t * 0.7), cy + Math.sin(a + t * 1.1) * d * (1 - t * 0.7)]);
      b.stroke(p, { w: 2.4, color: '#8aa0c8', alpha: 0.4, dry: 0.3, taper: [0.1, 0.9] });
    }
    glyphs(b, w, h, '忘', { n: 12, color: '120,140,180', y0: 0.02, y1: 0.98, size: 26 });
    b.ctx.strokeStyle = rgba('#6a80b0', 0.5); b.ctx.lineWidth = 2;
    b.ctx.beginPath(); b.ctx.arc(cx, cy, R * 0.64, 0, 6.28); b.ctx.stroke();
  };
  M['seal-forget'] = (b, w, h) => talisman(b, w, h, null, { glyph: '渊', dark: true });

  // ── 第十一章 · 泉州港 ───────────────────────────────────────────────────
  /** A junk seen broadside: hull, battened sails, mast. */
  const junk = (b, w, h, { x, y, s = 1, sail = '#c8a878', hull = '#3a2418', alpha = 1, torn = false } = {}) => {
    b.wash([[x - 70 * s, y], [x + 70 * s, y], [x + 50 * s, y + 20 * s], [x - 54 * s, y + 18 * s]], { color: hull, alpha, blur: 1, edge: 0.6 });
    for (const [mx, mh, sw] of [[-32 * s, 78 * s, 26 * s], [6 * s, 104 * s, 34 * s], [40 * s, 70 * s, 22 * s]]) {
      b.stroke([[x + mx, y], [x + mx, y - mh]], { w: 4 * s, color: '#2a1c12', alpha, dry: 0.3 });
      const top = y - mh + 8 * s, bot = y - 10 * s;
      if (torn) {
        b.wash([[x + mx - sw * 0.2, top], [x + mx + sw, top + 6 * s], [x + mx + sw * 0.7, bot], [x + mx - sw * 0.2, bot - 8 * s]], { color: sail, alpha: alpha * 0.8, blur: 1.5, edge: 0.35 });
        for (let k = 0; k < 3; k++) b.wash(b.blob(x + mx + b.r(0, sw), b.r(top, bot), 7 * s, 9 * s, { wob: 0.6 }), { color: '#1a1410', alpha: alpha * 0.8, blur: 1.5, edge: 0.3 });
      } else {
        b.wash([[x + mx - sw * 0.15, top], [x + mx + sw, top + 4 * s], [x + mx + sw, bot], [x + mx - sw * 0.15, bot]], { color: sail, alpha, blur: 1, edge: 0.6, smooth: false });
        for (let k = 1; k < 5; k++) b.stroke([[x + mx - sw * 0.15, top + (bot - top) * k / 5], [x + mx + sw, top + (bot - top) * k / 5]], { w: 1.6 * s, color: '#8a6a44', alpha: alpha * 0.8, dry: 0.2 });
      }
    }
  };
  const seaBack = (top, bottom, rows = 5, wcol = BLUE) => (b, w, h) => { sky(b, w, h, { top, bottom }); for (let r = 0; r < rows; r++) wave(b, -20, h * (0.66 + r * 0.075), w + 40, { n: 6, s: 0.9 + r * 0.18, color: wcol }); };

  M.zhenghe = (b, w, h) => {
    sky(b, w, h, { top: '#1e3450', bottom: '#b8cad8', sun: [w * 0.78, h * 0.18, h * 0.05, '#fff0c8'] });
    for (let r = 0; r < 5; r++) wave(b, -20, h * (0.7 + r * 0.07), w + 40, { n: 6, s: 1 + r * 0.2, color: '#2a5070' });
    junk(b, w, h, { x: w * 0.62, y: h * 0.72, s: 0.9, sail: '#d8b070' });
    const f = figure(b, w * 0.3, h * 0.96, h * 0.7, { robe: '#2a3a52', accent: GOLD, head: 'hat', width: 1.2, sleeve: 1.1, lean: -0.1 });
    b.stroke([[f.rh[0] + 4, f.rh[1] - 36], [f.rh[0] + 10, h * 0.99]], { w: 5, color: '#4a3420', dry: 0.4 });
    b.wash([[f.rh[0] - 2, f.rh[1] - 44], [f.rh[0] + 22, f.rh[1] - 50], [f.rh[0] + 18, f.rh[1] - 30]], { color: CINNABAR, alpha: 0.9, blur: 0.8, edge: 0.6 });
    b.mist(w, h, h * 0.7, { alpha: 0.3, color: '#cfe0ea' });
  };
  M.mazu = (b, w, h) => {
    sky(b, w, h, { top: '#2a1a28', bottom: '#c88a70' });
    for (let r = 0; r < 4; r++) wave(b, -20, h * (0.78 + r * 0.06), w + 40, { n: 5, s: 1, color: '#5a3a44' });
    const g = b.ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, h * 0.45);
    g.addColorStop(0, 'rgba(255,220,150,0.75)'); g.addColorStop(1, 'rgba(255,180,110,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    const f = figure(b, w * 0.5, h * 0.9, h * 0.72, { robe: '#b8322a', accent: GOLD, head: 'bun', sleeve: 1.5, alpha: 0.95 });
    b.wash([[f.head[0] - 16, f.head[1] - 12], [f.head[0] + 16, f.head[1] - 12], [f.head[0] + 12, f.head[1] - 24], [f.head[0] - 12, f.head[1] - 24]], { color: GOLD, alpha: 0.95, blur: 0.6, edge: 0.6, smooth: false });
    for (let k = 0; k < 5; k++) { b.ctx.fillStyle = rgba('#f0e0a0', 0.9); b.ctx.fillRect(f.head[0] - 12 + k * 6, f.head[1] - 34, 2.4, 11); }
    for (const [lx, ly] of [[w * 0.12, h * 0.72], [w * 0.88, h * 0.72]]) {   // 岸上的灯
      b.wash(b.blob(lx, ly, 10, 13), { color: '#ff6a3a', alpha: 0.9, blur: 1.5, edge: 0.5 });
      b.stroke([[lx, ly + 13], [lx, h]], { w: 3, color: '#3a2418', dry: 0.4 });
    }
  };
  M.mahuan = (b, w, h) => {
    sky(b, w, h, { top: '#cfd8cc', bottom: '#f0ecd8' });
    junk(b, w, h, { x: w * 0.76, y: h * 0.5, s: 0.5, sail: '#c8b48a', alpha: 0.45 });
    for (let r = 0; r < 3; r++) wave(b, -10, h * (0.56 + r * 0.06), w + 20, { n: 5, s: 0.7, color: '#7a9aa8' });
    const f = figure(b, w * 0.4, h * 0.96, h * 0.66, { robe: '#5a6a4a', accent: JADE, head: 'hat', lean: 0.2 });
    b.wash([[f.lh[0] - 30, f.lh[1] - 6], [f.lh[0] + 18, f.lh[1] - 14], [f.lh[0] + 20, f.lh[1] + 26], [f.lh[0] - 28, f.lh[1] + 32]], { color: '#f6f0e0', alpha: 0.95, blur: 0.8, edge: 0.7 });
    b.ctx.fillStyle = 'rgba(40,34,24,0.75)'; b.ctx.font = `${h * 0.05}px ${FONT_BRUSH}`; b.ctx.textAlign = 'left';
    for (let k = 0; k < 4; k++) b.ctx.fillText('瀛涯胜览'[k], f.lh[0] - 22 + k * 11, f.lh[1] + 8);
    b.stroke([[f.rh[0], f.rh[1] - 4], [f.rh[0] + 18, f.rh[1] - 26]], { w: 3.2, color: '#5a3a22', dry: 0.1 });
  };
  M.kilnman = (b, w, h) => {
    sky(b, w, h, { top: '#2a1a14', bottom: '#c08a58' });
    const g = b.ctx.createRadialGradient(w * 0.74, h * 0.62, 0, w * 0.74, h * 0.62, h * 0.4);
    g.addColorStop(0, 'rgba(255,170,60,0.9)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    b.wash([[w * 0.56, h], [w * 0.6, h * 0.42], [w * 0.92, h * 0.42], [w * 0.96, h]], { color: '#4a3226', alpha: 0.95, blur: 1.5, edge: 0.5 });
    b.wash(b.blob(w * 0.75, h * 0.72, 26, 20, { wob: 0.15 }), { color: '#160e08', alpha: 0.95, blur: 2, edge: 0.4 });
    flame(b, w * 0.75, h * 0.8, 46, { n: 5 });
    const f = figure(b, w * 0.3, h * 0.97, h * 0.66, { robe: '#6a5a44', accent: '#2a4a8a', head: 'bun', lean: 0.25 });
    // a blue-and-white jar held up to the light
    const jx = f.rh[0] + 10, jy = f.rh[1] - 6;
    b.wash(b.blob(jx, jy, 17, 21, { wob: 0.05 }), { color: '#f2f4f0', alpha: 0.97, blur: 0.8, edge: 0.8 });
    b.wash([[jx - 7, jy - 20], [jx + 7, jy - 20], [jx + 5, jy - 28], [jx - 5, jy - 28]], { color: '#f2f4f0', alpha: 0.97, blur: 0.6, edge: 0.7, smooth: false });
    for (let k = 0; k < 4; k++) { const a = k * 1.6; b.stroke([[jx - 10 + k * 5, jy - 10], [jx - 7 + k * 5, jy + 2], [jx - 11 + k * 5, jy + 12]], { w: 2.4, color: '#2a4a8a', alpha: 0.85, dry: 0.2 }); }
    b.stroke([[jx - 14, jy - 14], [jx + 14, jy - 15]], { w: 2, color: '#2a4a8a', alpha: 0.8, dry: 0.1 });
  };
  M['scroll-compass'] = scroll('#e4e4d6', (b, iw, ih) => {
    sky(b, iw, ih, { top: '#cfd8dc', bottom: '#eef0e4' });
    const cx = iw / 2, cy = ih * 0.52, R = ih * 0.34;
    b.wash(b.blob(cx, cy, R * 1.12, R * 1.12, { wob: 0.03 }), { color: '#3a2a1e', alpha: 0.9, blur: 1, edge: 0.7 });
    b.ctx.fillStyle = '#efe6d2'; b.ctx.beginPath(); b.ctx.arc(cx, cy, R, 0, 6.28); b.ctx.fill();
    b.ctx.strokeStyle = rgba(CINNABAR, 0.75); b.ctx.lineWidth = 2;
    for (const r of [R * 0.92, R * 0.66]) { b.ctx.beginPath(); b.ctx.arc(cx, cy, r, 0, 6.28); b.ctx.stroke(); }
    b.ctx.fillStyle = 'rgba(40,32,20,0.85)'; b.ctx.font = `${R * 0.24}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
    '子丑寅卯辰巳午未申酉戌亥'.split('').forEach((ch, i) => { const a = (i / 12) * 6.28 - Math.PI / 2; b.ctx.fillText(ch, cx + Math.cos(a) * R * 0.79, cy + Math.sin(a) * R * 0.79); });
    b.wash([[cx, cy - R * 0.5], [cx + R * 0.1, cy], [cx, cy + R * 0.5], [cx - R * 0.1, cy]], { color: CINNABAR, alpha: 0.95, blur: 0.6, edge: 0.7 });
    b.ctx.fillStyle = '#2a2a2a'; b.ctx.beginPath(); b.ctx.arc(cx, cy, R * 0.08, 0, 6.28); b.ctx.fill();
    for (let i = 0; i < 26; i++) { const x = b.r(0, iw), y = b.r(0, ih); b.ctx.fillStyle = `rgba(240,244,250,${b.r(0.2, 0.7).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(0.8, 2), 0, 6.28); b.ctx.fill(); }
  });
  M.wreck = wraith({ top: '#1e2a34', bottom: '#6a8090', color: '#a8d0e0',
    body: (b, w, h) => {
      for (let r = 0; r < 4; r++) wave(b, -10, h * (0.52 + r * 0.1), w + 20, { n: 5, s: 1, color: '#22384a' });
      b.wash([[w * 0.16, h * 0.62], [w * 0.7, h * 0.52], [w * 0.62, h * 0.8], [w * 0.2, h * 0.84]], { color: '#231810', alpha: 0.95, blur: 1.5, edge: 0.5 });
      b.stroke([[w * 0.46, h * 0.56], [w * 0.7, h * 0.16]], { w: 7, color: '#231810', alpha: 0.9, dry: 0.4, taper: [0.1, 0.7] });
      b.wash(b.blob(w * 0.82, h * 0.72, 26, 18, { wob: 0.4 }), { color: '#4a5a60', alpha: 0.8, blur: 3, edge: 0.3 });
      return [w * 0.4, h * 0.66];
    } });
  M.saltFog = wraith({ top: '#3a4650', bottom: '#c0ccd0', color: '#e8f4f8',
    body: (b, w, h) => {
      for (let i = 0; i < 12; i++) b.wash(b.blob(b.r(0, w), b.r(h * 0.25, h * 0.9), b.r(60, 150), b.r(20, 50), { wob: 0.4 }), { color: '#dfe8ec', alpha: 0.35, blur: 16, edge: 0 });
      junk(b, w, h, { x: w * 0.52, y: h * 0.7, s: 0.6, sail: '#b8c4c8', alpha: 0.4, torn: true });
      return [w * 0.5, h * 0.44];
    } });
  M.sunkCargo = wraith({ top: '#14242e', bottom: '#5a7a88', color: '#a8e0f0',
    body: (b, w, h) => {
      for (let i = 0; i < 12; i++) {
        const x = w * b.r(0.1, 0.9), y = h * b.r(0.45, 0.95), s = b.r(0.6, 1.2);
        b.wash(b.blob(x, y, 13 * s, 16 * s, { wob: 0.08 }), { color: '#dfe8ea', alpha: 0.82, blur: 1, edge: 0.7 });
        b.stroke([[x - 7 * s, y - 4 * s], [x - 4 * s, y + 6 * s]], { w: 2 * s, color: '#2a4a8a', alpha: 0.7, dry: 0.2 });
      }
      for (let i = 0; i < 6; i++) b.wash(b.blob(b.r(0, w), b.r(0, h * 0.4), b.r(50, 120), b.r(14, 30)), { color: '#0c1a22', alpha: 0.3, blur: 14, edge: 0 });
      return [w * 0.5, h * 0.26];
    } });
  M.deadPort = wraith({ top: '#20252c', bottom: '#7a7a72', color: '#d8d0b0',
    body: (b, w, h) => {
      b.wash([[0, h * 0.72], [w, h * 0.7], [w, h], [0, h]], { color: '#3a3830', alpha: 0.9, blur: 1.5, edge: 0.4 });
      for (let i = 0; i < 7; i++) { const x = w * (0.08 + i * 0.13); b.stroke([[x, h * 0.72], [x + b.r(-6, 6), h * b.r(0.1, 0.35)]], { w: 5, color: '#2a2620', alpha: 0.85, dry: 0.4 }); }
      for (let i = 0; i < 4; i++) { const x = w * (0.16 + i * 0.22); b.wash(b.blob(x, h * 0.78, 12, 9), { color: '#5a5448', alpha: 0.85, blur: 1, edge: 0.5 }); }
      return [w * 0.5, h * 0.56];
    } });
  M.chenzhou = (b, w, h) => {   // 第十一章首领
    sky(b, w, h, { top: '#080f1a', bottom: '#2a4050' });
    for (let r = 0; r < 5; r++) wave(b, -20, h * (0.6 + r * 0.09), w + 40, { n: 6, s: 1.2 + r * 0.25, color: '#14283a' });
    const g = b.ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, h * 0.5);
    g.addColorStop(0, 'rgba(150,180,210,0.3)'); g.addColorStop(1, 'rgba(150,180,210,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    junk(b, w, h, { x: w * 0.5, y: h * 0.74, s: 1.05, sail: '#5a6470', hull: '#120e0c', alpha: 0.92, torn: true });
    for (let i = 0; i < 20; i++) { const x = b.r(0, w), y = b.r(h * 0.5, h); b.ctx.fillStyle = `rgba(200,220,235,${b.r(0.15, 0.5).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(1, 3), 0, 6.28); b.ctx.fill(); }
    eye(b.ctx, w * 0.5 - 13, h * 0.42, 3.6, '#bcd8f0'); eye(b.ctx, w * 0.5 + 13, h * 0.42, 3.6, '#bcd8f0');
    b.mist(w, h, h * 0.78, { alpha: 0.35, color: '#8aa0b0' });
  };

  // ── 第十二章 · 藏书楼 ───────────────────────────────────────────────────
  /** A wall of book cases; `fill` decides how full each slot is (0–1). */
  const shelves = (b, w, h, { rows = 5, cols = 4, x0 = 0.08, x1 = 0.92, y0 = 0.08, y1 = 0.94, fill = () => 1, wood = '#5a3c24' } = {}) => {
    const W = w * (x1 - x0), H = h * (y1 - y0), cw = W / cols, ch = H / rows;
    b.wash([[w * x0, h * y0], [w * x1, h * y0], [w * x1, h * y1], [w * x0, h * y1]], { color: wood, alpha: 0.92, blur: 1, edge: 0.55, smooth: false });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = w * x0 + c * cw + 5, y = h * y0 + r * ch + 5, iw = cw - 10, ih = ch - 10;
      b.ctx.fillStyle = 'rgba(30,20,12,0.85)'; b.ctx.fillRect(x, y, iw, ih);
      const k = fill(r, c);
      let bx = x + 3;
      while (bx < x + iw * k - 4) {
        const bw = 5 + b.R() * 9;
        b.ctx.fillStyle = mix(['#8a6a48', '#6a4a3a', '#4a5a4a', '#7a5a5a'][Math.floor(b.R() * 4)], '#2a1a12', b.R() * 0.35);
        b.ctx.fillRect(bx, y + ih * 0.12, bw, ih * 0.82);
        bx += bw + 2;
      }
    }
  };
  M.fanqin = person({ top: '#4a4438', bottom: '#c0b090', robe: '#4a4a3e', accent: OCHRE, head: 'hat', h: 0.72, x: 0.34, width: 1.15,
    back: (b, w, h) => {
      shelves(b, w, h, { rows: 4, cols: 3, x0: 0.44, x1: 0.99, y0: 0.06, y1: 0.86 });
      b.wash([[0, h * 0.86], [w * 0.44, h * 0.86], [w * 0.44, h], [0, h]], { color: '#2a4450', alpha: 0.55, blur: 4, edge: 0.3 });   // 天一池
      for (let r = 0; r < 2; r++) wave(b, 0, h * (0.9 + r * 0.05), w * 0.44, { n: 3, s: 0.7, color: '#4a6a78' });
    },
    prop: (b, w, h, f) => {
      for (let k = -2; k <= 2; k++) b.stroke([[f.head[0] + k * 3, f.head[1] + 6], [f.head[0] + k * 5, f.head[1] + 28]], { w: 2.2, color: '#c8c0b0', alpha: 0.8, dry: 0.4 });
      b.wash([[f.rh[0] - 18, f.rh[1] - 6], [f.rh[0] + 14, f.rh[1] - 12], [f.rh[0] + 16, f.rh[1] + 16], [f.rh[0] - 16, f.rh[1] + 22]], { color: '#e8dcc0', alpha: 0.95, blur: 0.8, edge: 0.7 });
    } });
  M.zhuxi = person({ top: '#c8d0c0', bottom: '#eef0dc', robe: '#dfe2d8', accent: '#6a8a70', head: 'hat', h: 0.7, x: 0.38,
    back: (b, w, h) => {
      b.mountains(w, h, { base: 0.44, alpha: 0.18, color: '#7a8a78' });
      b.wash([[w * 0.5, h * 0.66], [w, h * 0.62], [w, h * 0.94], [w * 0.48, h * 0.98]], { color: '#4a6a72', alpha: 0.6, blur: 3, edge: 0.3 });   // 方塘
      for (let r = 0; r < 3; r++) wave(b, w * 0.48, h * (0.72 + r * 0.07), w * 0.55, { n: 4, s: 0.7, color: '#6a8a92' });
      const st = []; for (let t = 0; t < 1; t += 0.06) st.push([w * (0.82 + Math.sin(t * 5) * 0.05), h * (0.62 - t * 0.5)]);
      b.stroke(st, { w: 5, color: '#a8c0c8', alpha: 0.5, dry: 0.4, taper: [0.1, 0.8] });   // 活水
    },
    prop: (b, w, h, f) => {
      b.wash([[f.rh[0] - 24, f.rh[1] + 4], [f.rh[0] + 16, f.rh[1] - 4], [f.rh[0] + 18, f.rh[1] + 30], [f.rh[0] - 22, f.rh[1] + 36]], { color: '#f2ecd8', alpha: 0.95, blur: 0.8, edge: 0.7 });
      for (let k = 0; k < 4; k++) b.stroke([[f.rh[0] - 18, f.rh[1] + 12 + k * 6], [f.rh[0] + 10, f.rh[1] + 6 + k * 6]], { w: 1.4, color: '#5a4a34', alpha: 0.7, dry: 0.2 });
    } });
  M.zhengqiao = person({ top: '#3a3a30', bottom: '#b0a888', robe: '#4a4438', accent: GOLD, head: 'bun', h: 0.68, x: 0.36, lean: 0.2,
    back: (b, w, h) => {
      shelves(b, w, h, { rows: 5, cols: 3, x0: 0.46, x1: 0.99, y0: 0.04, y1: 0.92, fill: (r, c) => 0.55 + ((r + c) % 3) * 0.15 });
      const gl = b.ctx.createRadialGradient(w * 0.3, h * 0.6, 0, w * 0.3, h * 0.6, h * 0.4);
      gl.addColorStop(0, 'rgba(255,200,120,0.4)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
      b.ctx.fillStyle = gl; b.ctx.fillRect(0, 0, w, h);
    },
    prop: (b, w, h, f) => {
      // slips of paper with class marks, pinned in the air
      for (let i = 0; i < 6; i++) {
        const x = f.sh[0] - 40 + (i % 3) * 30, y = f.sh[1] - 40 + Math.floor(i / 3) * 24;
        b.ctx.save(); b.ctx.translate(x, y); b.ctx.rotate(b.r(-0.2, 0.2));
        b.ctx.fillStyle = 'rgba(244,238,220,0.95)'; b.ctx.fillRect(-13, -9, 26, 18);
        b.ctx.fillStyle = 'rgba(40,32,20,0.8)'; b.ctx.font = `12px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
        b.ctx.fillText('经史子集类例'[i], 0, 5);
        b.ctx.restore();
      }
      b.stroke([[f.rh[0], f.rh[1] - 4], [f.rh[0] + 20, f.rh[1] - 26]], { w: 3.2, color: '#5a3a22', dry: 0.1 });
    } });
  M.zhenren = (b, w, h) => {
    sky(b, w, h, { top: '#2a1410', bottom: '#b06a40' });
    const g = b.ctx.createRadialGradient(w * 0.5, h * 0.66, 0, w * 0.5, h * 0.66, h * 0.4);
    g.addColorStop(0, 'rgba(255,160,60,0.7)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    const f = figure(b, w * 0.36, h * 0.96, h * 0.68, { robe: '#5a2a1e', accent: GOLD, head: 'hat', lean: 0.3 });
    // the shell, cracking under heat
    const sx = w * 0.72, sy = h * 0.66;
    b.wash(b.blob(sx, sy, 40, 32, { wob: 0.1 }), { color: '#e8dcc0', alpha: 0.95, blur: 1, edge: 0.75 });
    for (let k = 0; k < 5; k++) {
      const a = b.r(0, 6.28);
      b.stroke([[sx, sy], [sx + Math.cos(a) * 34, sy + Math.sin(a) * 26], [sx + Math.cos(a + 0.5) * 42, sy + Math.sin(a + 0.5) * 30]], { w: 2, color: '#2a2018', alpha: 0.85, dry: 0.2 });
    }
    b.ctx.fillStyle = 'rgba(40,30,20,0.8)'; b.ctx.font = `${h * 0.05}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    for (let k = 0; k < 4; k++) b.ctx.fillText('王贞卜雨'[k], sx - 22 + (k % 2) * 40, sy - 12 + Math.floor(k / 2) * 26);
    flame(b, sx, sy + 34, 28, { n: 3 });
    b.stroke([[f.rh[0], f.rh[1]], [sx - 40, sy + 8]], { w: 4, color: '#3a2a1e', dry: 0.3 });
  };
  M['scroll-woodblock'] = scroll('#e0d4b8', (b, iw, ih) => {
    b.ctx.fillStyle = '#7a5434'; b.ctx.fillRect(0, 0, iw, ih);
    b.ctx.fillStyle = '#6a4628'; b.ctx.fillRect(iw * 0.06, ih * 0.08, iw * 0.88, ih * 0.84);
    const cols = 6, rows = 5, cw = iw * 0.88 / cols, ch = ih * 0.84 / rows, chars = '刻梓印本传之久远书林清话雕版流通天下';
    b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = iw * 0.06 + c * cw + cw / 2, y = ih * 0.08 + r * ch + ch / 2;
      b.ctx.save(); b.ctx.translate(x, y); b.ctx.scale(-1, 1);   // mirror-carved, as a real block is
      b.ctx.fillStyle = 'rgba(30,18,10,0.85)'; b.ctx.font = `${ch * 0.66}px ${FONT_BRUSH}`;
      b.ctx.fillText(chars[(r * cols + c) % chars.length], 0, 2);
      b.ctx.restore();
    }
    for (let i = 0; i < 22; i++) b.stroke([[b.r(0, iw), b.r(0, ih)], [b.r(0, iw), b.r(0, ih)]], { w: 1.2, color: '#4a2e18', alpha: 0.2, dry: 0.6 });
    b.splatter(iw * 0.2, ih * 0.84, 40, { color: '#1a1008', n: 14, size: 2, alpha: 0.5 });
  });
  M.bookworm = wraith({ top: '#2e2a20', bottom: '#8a8060', color: '#d8e0a0',
    body: (b, w, h) => {
      b.wash([[w * 0.12, h * 0.16], [w * 0.88, h * 0.14], [w * 0.9, h * 0.88], [w * 0.1, h * 0.9]], { color: '#e8dcc0', alpha: 0.92, blur: 1, edge: 0.6 });
      b.ctx.font = `${h * 0.072}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) { b.ctx.fillStyle = `rgba(40,32,22,${b.r(0.2, 0.7).toFixed(2)})`; b.ctx.fillText('书虫蠹食字'[(r + c) % 5], w * (0.2 + c * 0.15), h * (0.24 + r * 0.1)); }
      for (let i = 0; i < 20; i++) b.wash(b.blob(w * b.r(0.14, 0.86), h * b.r(0.18, 0.88), b.r(4, 10), b.r(3, 8), { wob: 0.5 }), { color: '#1a1610', alpha: 0.9, blur: 1, edge: 0.3 });
      const body = []; for (let t = 0; t < 1; t += 0.08) body.push([w * (0.22 + t * 0.56), h * (0.66 + Math.sin(t * 7) * 0.09)]);
      b.stroke(body, { w: 11, color: '#b8bc80', alpha: 0.9, dry: 0.2, taper: [0.05, 0.5] });
      return [w * 0.78, h * 0.64];
    } });
  M.emptyShelf = wraith({ top: '#2a2620', bottom: '#8a7c64', color: '#e0d0a0',
    body: (b, w, h) => {
      shelves(b, w, h, { rows: 5, cols: 3, x0: 0.06, x1: 0.94, y0: 0.06, y1: 0.96, fill: () => 0 });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {   // the labels are all that's left
        b.ctx.fillStyle = 'rgba(232,220,192,0.8)'; b.ctx.fillRect(w * (0.1 + c * 0.29), h * (0.1 + r * 0.18), w * 0.07, h * 0.04);
      }
      b.wash(b.blob(w * 0.5, h * 0.54, 40, 46, { wob: 0.25 }), { color: '#14100a', alpha: 0.75, blur: 8, edge: 0.15 });
      return [w * 0.5, h * 0.48];
    } });
  M.loosePage = wraith({ top: '#2c2c26', bottom: '#8a8878', color: '#e8e0c0',
    body: (b, w, h) => {
      for (let i = 0; i < 14; i++) {
        const x = b.r(w * 0.1, w * 0.9), y = b.r(h * 0.15, h * 0.9);
        b.ctx.save(); b.ctx.translate(x, y); b.ctx.rotate(b.r(-1, 1));
        b.ctx.fillStyle = `rgba(238,230,208,${b.r(0.6, 0.95).toFixed(2)})`; b.ctx.fillRect(-18, -24, 36, 48);
        b.ctx.fillStyle = 'rgba(50,40,28,0.5)'; b.ctx.font = `10px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
        for (let k = 0; k < 4; k++) b.ctx.fillText('文', 0, -12 + k * 12);
        b.ctx.restore();
      }
      return [w * 0.5, h * 0.5];
    } });
  M.blankSpine = wraith({ top: '#232830', bottom: '#78808a', color: '#c8d8e8',
    body: (b, w, h) => {
      for (let i = 0; i < 7; i++) {
        const x = w * (0.1 + i * 0.115), tilt = b.r(-0.08, 0.08);
        b.ctx.save(); b.ctx.translate(x, h * 0.5); b.ctx.rotate(tilt);
        b.ctx.fillStyle = mix('#4a4a56', '#2a2a34', b.R() * 0.5); b.ctx.fillRect(0, -h * 0.34, w * 0.085, h * 0.68);
        b.ctx.fillStyle = 'rgba(200,210,225,0.18)'; b.ctx.fillRect(w * 0.012, -h * 0.2, w * 0.06, h * 0.16);
        b.ctx.restore();
      }
      return [w * 0.5, h * 0.2];
    } });
  M.wuren = (b, w, h) => {   // 终章首领：无人读
    sky(b, w, h, { top: '#0e0c0a', bottom: '#3a2e20' });
    shelves(b, w, h, { rows: 4, cols: 5, x0: 0.02, x1: 0.98, y0: 0.02, y1: 0.7, fill: () => 1, wood: '#2a1c12' });
    // one lamp, one desk, one seated shape that never turns a page
    const lx = w * 0.26, ly = h * 0.74;
    const g = b.ctx.createRadialGradient(lx, ly, 0, lx, ly, h * 0.42);
    g.addColorStop(0, 'rgba(255,196,110,0.85)'); g.addColorStop(0.4, 'rgba(255,170,80,0.3)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    b.wash([[w * 0.1, h * 0.84], [w * 0.9, h * 0.82], [w * 0.92, h * 0.92], [w * 0.08, h * 0.94]], { color: '#3a2a1c', alpha: 0.95, blur: 1, edge: 0.6 });
    b.wash([[w * 0.44, h * 0.8], [w * 0.74, h * 0.79], [w * 0.75, h * 0.86], [w * 0.43, h * 0.87]], { color: '#f0e6cc', alpha: 0.95, blur: 0.8, edge: 0.7 });
    b.stroke([[w * 0.595, h * 0.79], [w * 0.59, h * 0.87]], { w: 2, color: '#a89878', alpha: 0.8, dry: 0.2 });
    b.wash(b.blob(lx, ly - 4, 9, 12), { color: '#ffd890', alpha: 0.95, blur: 1.5, edge: 0.4 });
    b.wash([[lx - 13, ly + 8], [lx + 13, ly + 8], [lx + 9, ly + 18], [lx - 9, ly + 18]], { color: '#4a3826', alpha: 0.95, blur: 0.8, edge: 0.6 });
    const f = figure(b, w * 0.6, h * 0.99, h * 0.5, { robe: '#26221c', accent: null, head: 'hat', sleeve: 1, width: 1.3, alpha: 0.5 });
    eye(b.ctx, f.head[0] - 5, f.head[1], 2.6, '#ffd070'); eye(b.ctx, f.head[0] + 6, f.head[1], 2.6, '#ffd070');
    for (let i = 0; i < 26; i++) { const x = b.r(0, w), y = b.r(h * 0.1, h); b.ctx.fillStyle = `rgba(220,206,180,${b.r(0.1, 0.4).toFixed(2)})`; b.ctx.beginPath(); b.ctx.arc(x, y, b.r(0.8, 2), 0, 6.28); b.ctx.fill(); }
  };

  return M;
}
