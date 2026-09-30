// 器物卡面的水墨小品。和灵将不同，这里画的是物不是人，所以构图统一：
// 一片素底 + 背后一圈微光 + 器物居中，几笔写意，不描细节。
// 入口是 gearMotifs(H)，H 由 cardArt.js 传进来（共用那边的 sky 等积木）。
//
// 画幅是 452×318 的横窗，所以尺寸一律按 h 折算（u = h/100），不要直接写像素。
import { rgba, INK } from './ink.js';

const GOLD = '#C8A04A', RED = '#C03A2A', JADE = '#4A8C5C', BLUE = '#2A4A7A', OCHRE = '#8C6040';
const BRONZE = '#5f8079';      // 青铜绿锈
const IRON = '#39424b';

/**
 * 两点直线。ink.js 的 stroke() 把首尾宽度都收到 0，只给两个点的话整条线会退化成
 * 零面积的多边形、什么都画不出来，所以这里必须补一个中点（顺手歪一点，像手画的）。
 */
const line = (b, a, z, o = {}) => b.stroke([a, [(a[0] + z[0]) / 2 + (o.bow ?? 0), (a[1] + z[1]) / 2 + (o.sag ?? 0)], z], o);

export function gearMotifs({ sky }) {
  const M = {};

  /** 素底 + 背光 + 台面。draw(b, w, h, u) 画器物本身，u = h 的百分之一。 */
  const piece = ({ top = '#ded4c2', bottom = '#efe6d4', glow = GOLD, shadow = 1, draw }) => (b, w, h) => {
    sky(b, w, h, { top, bottom });
    // 器物是「宝」，背后得有自己的光，也把中间压亮、四周压暗，物体轮廓才跳得出来
    const g = b.ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, h * 0.62);
    g.addColorStop(0, rgba(glow, 0.34)); g.addColorStop(0.55, rgba(glow, 0.1)); g.addColorStop(1, rgba(glow, 0));
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    const u = h / 100;
    b.wash([[w * 0.04, h * 0.82], [w * 0.96, h * 0.8], [w * 0.94, h * 0.97], [w * 0.06, h * 0.99]],
      { color: OCHRE, alpha: 0.2, blur: 12, edge: 0.2 });
    if (shadow) b.wash(b.blob(w * 0.5, h * 0.855, w * 0.2 * shadow, h * 0.035, { wob: 0.25 }), { color: INK, alpha: 0.3, blur: 9, edge: 0 });
    draw(b, w, h, u);
    b.mist(w, h, h * 0.9, { alpha: 0.3, n: 3 });
    return null;
  };

  // ── 轩辕·帝剑：直身长剑，剑尖朝上 ──
  M['gear-sword'] = piece({ glow: GOLD, draw: (b, w, h, u) => {
    const cx = w * 0.5;
    b.stroke([[cx, 6 * u], [cx - 0.6 * u, 34 * u], [cx, 58 * u]], { w: 9 * u, color: '#54606b', taper: [0.66, 0.03], dry: 0.18 });
    b.stroke([[cx - 1.4 * u, 14 * u], [cx - 1.6 * u, 36 * u], [cx - 1.4 * u, 56 * u]], { w: 1.8 * u, color: '#eef4f8', alpha: 0.55, taper: [0.5, 0.2], dry: 0 });
    line(b, [cx - 15 * u, 60 * u], [cx + 15 * u, 60 * u], { w: 5.5 * u, color: '#a8842e', taper: [0.18, 0.18], dry: 0.12, sag: -0.8 * u });   // 剑格
    line(b, [cx, 61 * u], [cx, 78 * u], { w: 7 * u, color: '#33261a', taper: [0.1, 0.12], dry: 0.28 });                                      // 剑柄
    for (let k = 0; k < 4; k++) line(b, [cx - 3.4 * u, (64 + k * 3.4) * u], [cx + 3.4 * u, (65 + k * 3.4) * u], { w: 1.2 * u, color: '#8a6a3a', alpha: 0.75, dry: 0.1 });
    b.wash(b.blob(cx, 82 * u, 6.5 * u, 5.5 * u), { color: JADE, alpha: 0.9, blur: 1.5, edge: 0.9 });                                         // 玉首
  } });

  // ── 山河社稷图：展开的画卷，里头是一角江山 ──
  M['gear-map'] = piece({ glow: OCHRE, shadow: 0.9, draw: (b, w, h, u) => {
    const x0 = w * 0.15, x1 = w * 0.85, y0 = 24 * u, y1 = 74 * u;
    b.wash([[x0, y0], [x1, y0 - 2 * u], [x1, y1], [x0, y1 + 2 * u]], { color: '#f2e9d4', alpha: 0.97, blur: 2, edge: 1, smooth: false });
    b.ctx.save(); b.ctx.beginPath(); b.ctx.rect(x0, y0, x1 - x0, y1 - y0); b.ctx.clip();
    // 山画在卷子里：远山淡、近山浓，底下留一条水
    for (const [k, alpha] of [[0.62, 0.22], [0.72, 0.34], [0.84, 0.5]]) {
      const pts = [[x0 - 4, y1]];
      for (let t = 0; t <= 1.001; t += 0.14) {
        const x = x0 + (x1 - x0) * t;
        pts.push([x, y1 - (y1 - y0) * (1 - k) * (0.55 + 0.45 * Math.sin(t * 7.3 + k * 9))]);
      }
      pts.push([x1 + 4, y1]);
      b.wash(pts, { color: BLUE, alpha, blur: 3, edge: 0.35 });
    }
    for (let i = 0; i < 3; i++) line(b, [x0 + 8 * u + i * 14 * u, y1 - 5 * u], [x0 + 20 * u + i * 14 * u, y1 - 4 * u], { w: 1.4 * u, color: BLUE, alpha: 0.45, dry: 0.5, sag: 1.2 * u });
    b.ctx.restore();
    for (const x of [x0, x1]) {   // 两端的轴
      b.stroke([[x, y0 - 6 * u], [x, (y0 + y1) / 2], [x, y1 + 6 * u]], { w: 6 * u, color: '#5a3f24', taper: [0.14, 0.14], dry: 0.2 });
      for (const y of [y0 - 6 * u, y1 + 6 * u]) b.wash(b.blob(x, y, 4 * u, 3.4 * u), { color: GOLD, alpha: 0.9, blur: 1, edge: 0.7 });
    }
  } });

  // ── 混天绫：一条红绫，抖成 S 形 ──
  M['gear-sash'] = piece({ top: '#e6d2c2', glow: RED, shadow: 0, draw: (b, w, h, u) => {
    const s = [[w * 0.16, 12 * u], [w * 0.64, 28 * u], [w * 0.3, 52 * u], [w * 0.76, 72 * u], [w * 0.38, 92 * u]];
    b.stroke(s, { w: 16 * u, color: RED, alpha: 0.28, taper: [0.42, 0.8], dry: 0.55 });
    b.stroke(s, { w: 9 * u, color: '#cf3826', alpha: 0.95, taper: [0.34, 0.9], dry: 0.28 });
    b.stroke(s.map(([x, y]) => [x + 2.4 * u, y - 1.6 * u]), { w: 2.2 * u, color: '#ffd2bc', alpha: 0.6, taper: [0.45, 0.85], dry: 0.2 });
    b.splatter(w * 0.74, 26 * u, 18 * u, { n: 14, color: RED, alpha: 0.4, size: 3 });
  } });

  // ── 定海神针：一根铁柱，两头箍金 ──
  M['gear-pillar'] = piece({ glow: '#e0c878', shadow: 0.7, draw: (b, w, h, u) => {
    const cx = w * 0.5;
    b.wash(b.blob(cx, 50 * u, 22 * u, 34 * u), { color: '#9fd8e8', alpha: 0.24, blur: 16, edge: 0 });   // 水光
    b.stroke([[cx, 7 * u], [cx, 45 * u], [cx, 85 * u]], { w: 14 * u, color: IRON, taper: [0.03, 0.03], dry: 0.22 });
    b.stroke([[cx - 3.6 * u, 11 * u], [cx - 3.8 * u, 46 * u], [cx - 3.6 * u, 81 * u]], { w: 2.6 * u, color: '#b6c2cc', alpha: 0.5, taper: [0.22, 0.22], dry: 0 });
    for (const y of [13, 79]) line(b, [cx - 11 * u, y * u], [cx + 11 * u, y * u], { w: 8 * u, color: '#b8922f', taper: [0.14, 0.14], dry: 0.1 });
    for (let k = 0; k < 5; k++) line(b, [cx - 6 * u, (26 + k * 10) * u], [cx + 6 * u, (26.6 + k * 10) * u], { w: 1.2 * u, color: '#1f2830', alpha: 0.5, dry: 0.3 });
  } });

  // ── 昆仑·照世镜：一面铜镜，背面的钮和圈纹 ──
  M['gear-mirror'] = piece({ top: '#d2d8d6', glow: '#9fc8d8', shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.5, cy = 44 * u, r = 31 * u;
    b.wash(b.blob(cx, cy, r, r, { wob: 0.035 }), { color: BRONZE, alpha: 0.95, blur: 2, edge: 0.95 });
    b.wash(b.blob(cx, cy, r * 0.84, r * 0.84, { wob: 0.04 }), { color: '#c6dade', alpha: 0.6, blur: 3, edge: 0.5 });
    b.ctx.save();
    for (const [k, a] of [[0.66, 0.6], [0.46, 0.45], [0.88, 0.5]]) {
      b.ctx.strokeStyle = rgba('#24403f', a); b.ctx.lineWidth = 1.2 * u;
      b.ctx.beginPath(); b.ctx.arc(cx, cy, r * k, 0, Math.PI * 2); b.ctx.stroke();
    }
    b.ctx.restore();
    for (let i = 0; i < 8; i++) {   // 圈纹之间的短辐
      const a = (i / 8) * Math.PI * 2 + 0.3;
      line(b, [cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5], [cx + Math.cos(a) * r * 0.64, cy + Math.sin(a) * r * 0.64],
        { w: 1.6 * u, color: '#24403f', alpha: 0.55, dry: 0.2 });
    }
    b.wash(b.blob(cx, cy, r * 0.17, r * 0.17), { color: '#1e3634', alpha: 0.85, blur: 1.5, edge: 0.8 });     // 镜钮
    b.stroke([[cx - r * 1.05, cy + r * 1.02], [cx, cy + r * 1.12], [cx + r * 1.08, cy + r * 1.0]], { w: 3.6 * u, color: '#5a3f24', taper: [0.3, 0.3], dry: 0.4 });   // 镜架
  } });

  // ── 神农药鼎：三足两耳，上头冒药气 ──
  M['gear-cauldron'] = piece({ glow: JADE, shadow: 0.9, draw: (b, w, h, u) => {
    const cx = w * 0.5, ty = 42 * u, bw = 27 * u;
    for (const sgn of [-1, 1]) line(b, [cx + sgn * bw * 0.62, 70 * u], [cx + sgn * bw * 0.78, 88 * u], { w: 6 * u, color: '#31463f', taper: [0.08, 0.3], dry: 0.28 });
    line(b, [cx, 70 * u], [cx, 88 * u], { w: 6 * u, color: '#31463f', taper: [0.08, 0.3], dry: 0.28 });
    b.wash([[cx - bw, ty], [cx + bw, ty], [cx + bw * 0.74, 72 * u], [cx - bw * 0.74, 72 * u]], { color: BRONZE, alpha: 0.95, blur: 2.5, edge: 0.9 });
    for (let k = 0; k < 2; k++) line(b, [cx - bw * 0.8, (52 + k * 8) * u], [cx + bw * 0.8, (52.5 + k * 8) * u], { w: 1.6 * u, color: '#26382f', alpha: 0.5, dry: 0.35 });   // 饕餮纹的意思
    b.stroke([[cx - bw * 1.16, ty], [cx, ty - 1.4 * u], [cx + bw * 1.16, ty]], { w: 6.5 * u, color: '#3c574d', taper: [0.16, 0.16], dry: 0.14 });   // 口沿
    for (const sgn of [-1, 1]) {   // 两耳
      b.stroke([[cx + sgn * bw * 0.92, ty - 2 * u], [cx + sgn * bw * 1.3, ty - 10 * u], [cx + sgn * bw * 0.6, ty - 11 * u]], { w: 4 * u, color: '#3c574d', dry: 0.2 });
    }
    for (let i = 0; i < 3; i++) {   // 药气
      const x = cx + (i - 1) * 13 * u;
      b.stroke([[x, ty - 6 * u], [x + 5 * u, ty - 17 * u], [x - 4 * u, ty - 29 * u]], { w: 3.4 * u, color: '#d8ecdc', alpha: 0.65, taper: [0.4, 0.9], dry: 0.55 });
    }
  } });

  // ── 芭蕉扇：一片大芭蕉叶，连柄 ──
  M['gear-fan'] = piece({ top: '#e7dcc0', glow: JADE, shadow: 0.5, draw: (b, w, h, u) => {
    const cx = w * 0.5, tip = 8 * u, base = 70 * u;
    b.wash([[cx, base], [cx - 34 * u, 44 * u], [cx - 26 * u, 15 * u], [cx, tip], [cx + 26 * u, 15 * u], [cx + 34 * u, 44 * u]],
      { color: '#6d9a52', alpha: 0.82, blur: 4, edge: 0.75 });
    b.stroke([[cx, 92 * u], [cx, base], [cx, tip + 4 * u]], { w: 4.4 * u, color: '#3a5628', taper: [0.12, 0.8], dry: 0.2 });   // 扇柄接主脉
    for (let i = 1; i <= 4; i++) for (const sgn of [-1, 1]) {   // 叶脉
      const y = base - i * 13 * u;
      line(b, [cx, y], [cx + sgn * (10 + i * 4.5) * u, y - 9 * u], { w: 1.8 * u, color: '#31481f', alpha: 0.6, dry: 0.5 });
    }
    line(b, [cx - 8 * u, 90 * u], [cx + 8 * u, 90 * u], { w: 5 * u, color: '#5a3f24', taper: [0.25, 0.25], dry: 0.2 });        // 柄箍
  } });

  // ── 紫毫笔：挂在架上，笔尖朝下，一滴墨 ──
  M['gear-brush'] = piece({ glow: '#9a84bc', shadow: 0.4, draw: (b, w, h, u) => {
    const cx = w * 0.5;
    b.stroke([[w * 0.18, 11 * u], [cx, 9.5 * u], [w * 0.82, 11 * u]], { w: 4 * u, color: '#5a3f24', taper: [0.22, 0.22], dry: 0.3 });   // 笔架横杆
    for (const x of [w * 0.2, w * 0.8]) b.stroke([[x, 11 * u], [x - 1 * u, 22 * u], [x, 34 * u]], { w: 3 * u, color: '#5a3f24', taper: [0.2, 0.2], dry: 0.35 });
    line(b, [cx, 11 * u], [cx, 20 * u], { w: 1.6 * u, color: '#8a6a40', dry: 0.2 });                                                    // 挂绳
    line(b, [cx, 21 * u], [cx, 56 * u], { w: 8 * u, color: '#6b4a2a', taper: [0.08, 0.08], dry: 0.2 });                                 // 笔杆
    line(b, [cx, 55 * u], [cx, 61 * u], { w: 10 * u, color: '#b8922f', taper: [0.16, 0.16], dry: 0.1 });                                // 笔箍
    b.stroke([[cx, 60 * u], [cx + 1.4 * u, 72 * u], [cx + 2 * u, 84 * u]], { w: 9.5 * u, color: '#35263a', taper: [0.06, 0.92], dry: 0.22 });   // 紫毫
    b.wash(b.blob(cx + 3 * u, 92 * u, 4 * u, 2.8 * u), { color: INK, alpha: 0.8, blur: 2, edge: 0.5 });                                 // 落下的那滴墨
    b.splatter(cx + 3 * u, 93 * u, 11 * u, { n: 10, alpha: 0.4, size: 2.4 });
  } });

  // ── 青铜纵目：三星堆面具，柱状眼、翼状耳 ──
  M['gear-mask'] = piece({ top: '#d0d6d2', glow: BRONZE, shadow: 0.9, draw: (b, w, h, u) => {
    const cx = w * 0.5, cy = 46 * u, fw = 26 * u, fh = 19 * u;
    for (const sgn of [-1, 1]) {   // 翼状耳，先画好压在脸下面
      b.wash([[cx + sgn * fw * 0.9, cy - fh * 0.55], [cx + sgn * fw * 2.0, cy - fh * 1.25], [cx + sgn * fw * 1.85, cy + fh * 0.35], [cx + sgn * fw * 0.9, cy + fh * 0.2]],
        { color: '#54736c', alpha: 0.9, blur: 2, edge: 0.8 });
    }
    b.wash([[cx - fw, cy - fh], [cx + fw, cy - fh], [cx + fw * 0.86, cy + fh * 1.35], [cx - fw * 0.86, cy + fh * 1.35]], { color: BRONZE, alpha: 0.96, blur: 2.5, edge: 0.9 });
    for (const sgn of [-1, 1]) {   // 纵目：眼球柱状外凸
      const ex = cx + sgn * fw * 0.44, ey = cy - fh * 0.28;
      b.wash(b.blob(ex, ey, fw * 0.3, fh * 0.24), { color: '#24403c', alpha: 0.85, blur: 1.5, edge: 0.7 });
      line(b, [ex, ey], [ex + sgn * fw * 0.62, ey - fh * 0.12], { w: fh * 0.36, color: '#2c4c46', taper: [0.1, 0.22], dry: 0.12 });
      b.wash(b.blob(ex + sgn * fw * 0.66, ey - fh * 0.14, fh * 0.22, fh * 0.22), { color: '#162624', alpha: 0.95, blur: 1, edge: 0.6 });
    }
    b.stroke([[cx - fw * 0.55, cy + fh * 0.62], [cx, cy + fh * 0.8], [cx + fw * 0.55, cy + fh * 0.62]], { w: fh * 0.17, color: '#1c2e2a', taper: [0.35, 0.35], dry: 0.25 });   // 阔口
    line(b, [cx, cy - fh * 0.05], [cx, cy + fh * 0.4], { w: fh * 0.13, color: '#24403c', alpha: 0.6, dry: 0.3 });                                                              // 鼻梁
  } });

  // ── 九节杖：一根竹杖，九个节 ──
  M['gear-staff'] = piece({ glow: JADE, shadow: 0.5, draw: (b, w, h, u) => {
    const x0 = w * 0.36, y0 = 92 * u, x1 = w * 0.62, y1 = 7 * u;
    const at = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    b.stroke([at(0), [at(0.5)[0] - 3 * u, at(0.5)[1]], at(1)], { w: 9 * u, color: '#8a9a52', taper: [0.1, 0.16], dry: 0.28 });
    b.stroke([at(0.04), [at(0.52)[0] - 4.6 * u, at(0.52)[1]], at(0.96)], { w: 2 * u, color: '#d6e0a8', alpha: 0.5, taper: [0.2, 0.2], dry: 0.1 });
    for (let i = 0; i < 9; i++) {   // 九节
      const [x, y] = at((i + 0.5) / 9);
      line(b, [x - 6 * u, y + 0.8 * u], [x + 6 * u, y - 0.8 * u], { w: 2.4 * u, color: '#4a5c2c', alpha: 0.9, dry: 0.18 });
    }
    b.stroke([[x1 - 3 * u, y1 + 4 * u], [x1 + 7 * u, y1 + 1 * u], [x1 + 5 * u, y1 + 12 * u]], { w: 2.6 * u, color: RED, alpha: 0.85, taper: [0.3, 0.6], dry: 0.3 });   // 杖头系的红绳
  } });

  // ── 蚀骨枷：断了的木枷，拖着一截铁链 ──
  M['gear-shackle'] = piece({ top: '#c4bfb4', bottom: '#d6cfc0', glow: BLUE, shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.44, cy = 44 * u, r = 26 * u;
    b.wash(b.blob(cx, cy, r, r * 0.94, { wob: 0.09 }), { color: '#63523f', alpha: 0.95, blur: 2, edge: 0.85 });
    b.wash(b.blob(cx, cy, r * 0.46, r * 0.44, { wob: 0.11 }), { color: '#c4bfb4', alpha: 1, blur: 1.5, edge: 0.95 });        // 中间的孔
    b.stroke([[cx + r * 0.25, cy - r * 1.06], [cx + r * 0.36, cy], [cx + r * 0.6, cy + r * 1.08]], { w: 3.4 * u, color: '#c4bfb4', alpha: 1, taper: [0.1, 0.1], dry: 0 });   // 裂口
    for (let i = 0; i < 5; i++) {   // 铁链
      const t = i / 5;
      b.ctx.save(); b.ctx.strokeStyle = rgba(IRON, 0.85); b.ctx.lineWidth = 2.4 * u;
      b.ctx.beginPath(); b.ctx.ellipse(cx + r * (1.05 + t * 1.5), cy + r * (0.8 + t * 0.7), 5 * u, 3 * u, 0.55, 0, Math.PI * 2); b.ctx.stroke(); b.ctx.restore();
    }
    b.splatter(cx - r * 0.5, cy + r * 0.85, r * 0.9, { n: 16, alpha: 0.35, size: 3 });
  } });

  // ── 无名碑：一块圆首石碑，碑面空白 ──
  M['gear-stele'] = piece({ top: '#cdc7ba', glow: OCHRE, shadow: 0.9, draw: (b, w, h, u) => {
    const cx = w * 0.5, bw = 24 * u, top = 16 * u, bot = 82 * u;
    b.wash([[cx - bw, top + 7 * u], [cx - bw * 0.62, top], [cx + bw * 0.62, top], [cx + bw, top + 7 * u], [cx + bw, bot], [cx - bw, bot]],
      { color: '#857e6f', alpha: 0.95, blur: 2.5, edge: 0.9 });
    b.wash([[cx - bw * 0.74, top + 12 * u], [cx + bw * 0.74, top + 12 * u], [cx + bw * 0.74, bot - 5 * u], [cx - bw * 0.74, bot - 5 * u]],
      { color: '#a49c89', alpha: 0.6, blur: 3, edge: 0.4, smooth: false });
    for (let i = 0; i < 4; i++) {   // 字迹只剩几道磨平的痕
      const y = top + (22 + i * 13) * u;
      line(b, [cx - bw * 0.42, y], [cx + bw * 0.38, y + 0.6 * u], { w: 2 * u, color: '#6a6254', alpha: 0.28 - i * 0.05, dry: 0.7 });
    }
    b.stroke([[cx - bw * 1.35, bot], [cx, bot + 2 * u], [cx + bw * 1.35, bot]], { w: 7 * u, color: '#6b6558', taper: [0.16, 0.16], dry: 0.3 });   // 碑座
    b.mist(w, h, 64 * u, { alpha: 0.42, n: 4 });   // 字是被风沙磨没的
  } });

  // ── 东皇钟：悬钟，钟唇下荡开几圈声波 ──
  M['gear-bell'] = piece({ glow: GOLD, shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.5, top = 18 * u, bot = 70 * u, bw = 26 * u;
    line(b, [cx, 2 * u], [cx, top], { w: 2.2 * u, color: '#5a3f24', dry: 0.2 });                                            // 悬梁的绳
    b.stroke([[cx - 6 * u, top], [cx, top - 6 * u], [cx + 6 * u, top]], { w: 4.4 * u, color: '#8a6a2a', dry: 0.15 });        // 钟钮
    b.wash([[cx - bw * 0.62, top], [cx + bw * 0.62, top], [cx + bw, bot - 6 * u], [cx + bw * 1.06, bot], [cx - bw * 1.06, bot], [cx - bw, bot - 6 * u]],
      { color: BRONZE, alpha: 0.96, blur: 2.5, edge: 0.9 });
    b.wash([[cx - bw * 0.5, top + 3 * u], [cx - bw * 0.2, top + 3 * u], [cx - bw * 0.7, bot - 4 * u], [cx - bw * 0.86, bot - 4 * u]],
      { color: '#a8cfc4', alpha: 0.4, blur: 4, edge: 0.3 });                                                                 // 钟身高光
    for (let k = 0; k < 3; k++) line(b, [cx - bw * (0.72 + k * 0.1), (32 + k * 12) * u], [cx + bw * (0.72 + k * 0.1), (32.5 + k * 12) * u],
      { w: 1.6 * u, color: '#24403f', alpha: 0.5, dry: 0.35 });                                                              // 弦纹
    for (let i = 0; i < 6; i++) {   // 钟身上的乳钉
      const col = i % 3, row = (i / 3) | 0;
      b.wash(b.blob(cx + (col - 1) * bw * 0.44, (46 + row * 11) * u, 2.2 * u, 2 * u), { color: '#2c4c46', alpha: 0.7, blur: 1, edge: 0.6 });
    }
    b.stroke([[cx - bw * 1.1, bot], [cx, bot + 3 * u], [cx + bw * 1.1, bot]], { w: 5 * u, color: '#3c574d', taper: [0.18, 0.18], dry: 0.12 });   // 钟唇
    for (let k = 1; k <= 3; k++) {   // 荡出去的钟声
      const r = bw * (1.2 + k * 0.42);
      b.ctx.save(); b.ctx.strokeStyle = rgba('#f0dca0', 0.34 - k * 0.08); b.ctx.lineWidth = 1.8 * u;
      b.ctx.beginPath(); b.ctx.ellipse(cx, bot + 6 * u, r, r * 0.3, 0, 0, Math.PI * 2); b.ctx.stroke(); b.ctx.restore();
    }
  } });

  // ── 盘古斧：宽刃巨斧，刃口后面裂出一线天光 ──
  M['gear-axe'] = piece({ top: '#2b2620', bottom: '#d8ccb4', glow: '#f0e0a8', shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.5;
    // 开天的那一线：斧刃斜过去，背后是刚被劈开的缝
    b.wash([[cx - 4 * u, 0], [cx + 9 * u, 0], [cx + 2 * u, 62 * u], [cx - 2 * u, 62 * u]], { color: '#fff4c8', alpha: 0.5, blur: 14, edge: 0 });
    line(b, [cx - 7 * u, 94 * u], [cx - 7 * u, 14 * u], { w: 7 * u, color: '#4a3320', taper: [0.1, 0.08], dry: 0.28 });         // 斧柄，竖着
    // 斧身：新月形的阔刃，背厚刃薄，挂在柄的右侧
    const ay = 30 * u;
    b.wash([[cx - 5 * u, ay - 16 * u], [cx + 14 * u, ay - 22 * u], [cx + 30 * u, ay + 2 * u], [cx + 14 * u, ay + 26 * u], [cx - 5 * u, ay + 20 * u], [cx + 7 * u, ay + 2 * u]],
      { color: '#6b737b', alpha: 0.96, blur: 2.5, edge: 0.88 });
    b.stroke([[cx + 13 * u, ay - 21 * u], [cx + 29 * u, ay + 2 * u], [cx + 13 * u, ay + 25 * u]], { w: 3.4 * u, color: '#f4f8fa', alpha: 0.9, taper: [0.15, 0.15], dry: 0 });   // 刃口的光
    for (let k = 0; k < 3; k++) line(b, [cx + 2 * u, ay - 8 * u + k * 8 * u], [cx + 16 * u, ay - 9 * u + k * 8 * u], { w: 1.6 * u, color: '#2c343a', alpha: 0.45, dry: 0.45 });
    for (const y of [16, 44]) line(b, [cx - 11 * u, y * u], [cx - 3 * u, y * u], { w: 5 * u, color: '#b8922f', taper: [0.16, 0.16], dry: 0.1 });   // 柄上两道箍
    b.splatter(cx + 16 * u, ay, 26 * u, { n: 18, color: '#f0e0a8', alpha: 0.4, size: 3 });
  } });

  // ── 炼妖壶：葫芦壶，口上一缕妖气正被收进去 ──
  M['gear-gourd'] = piece({ top: '#2f2228', bottom: '#d8c8b8', glow: RED, shadow: 0.7, draw: (b, w, h, u) => {
    const cx = w * 0.5;
    // 妖气：从上方拧成一股往壶口里钻
    b.stroke([[cx + 22 * u, 2 * u], [cx - 14 * u, 14 * u], [cx + 12 * u, 26 * u], [cx, 36 * u]],
      { w: 11 * u, color: '#8a4ab0', alpha: 0.42, taper: [0.85, 0.35], dry: 0.6 });
    b.stroke([[cx + 20 * u, 4 * u], [cx - 11 * u, 15 * u], [cx + 10 * u, 26 * u], [cx, 36 * u]],
      { w: 4 * u, color: '#d0a0ec', alpha: 0.6, taper: [0.9, 0.3], dry: 0.4 });
    b.wash(b.blob(cx, 44 * u, 14 * u, 13 * u, { wob: 0.06 }), { color: '#8a3a2a', alpha: 0.95, blur: 2, edge: 0.88 });         // 上球
    b.wash(b.blob(cx, 72 * u, 24 * u, 20 * u, { wob: 0.05 }), { color: '#9a4230', alpha: 0.96, blur: 2.5, edge: 0.9 });        // 下球
    b.wash(b.blob(cx - 8 * u, 70 * u, 6 * u, 9 * u, { wob: 0.2 }), { color: '#e8a878', alpha: 0.4, blur: 5, edge: 0.2 });      // 高光
    line(b, [cx - 13 * u, 34 * u], [cx + 13 * u, 34 * u], { w: 5.5 * u, color: '#5a3f24', taper: [0.16, 0.16], dry: 0.14 });   // 壶口
    b.wash(b.blob(cx, 34 * u, 7 * u, 2.6 * u), { color: '#1c1014', alpha: 0.8, blur: 1.5, edge: 0.5 });                        // 壶里是黑的
    for (let k = 0; k < 3; k++) {   // 壶身上的符文
      const y = (64 + k * 9) * u;
      line(b, [cx - 14 * u + k * 2 * u, y], [cx + 14 * u - k * 2 * u, y + 0.6 * u], { w: 1.6 * u, color: '#f0c070', alpha: 0.55, dry: 0.45 });
    }
    line(b, [cx - 10 * u, 56 * u], [cx + 10 * u, 56 * u], { w: 3.4 * u, color: '#c8a04a', alpha: 0.8, dry: 0.2 });              // 束腰的绳
  } });

  // ── 昊天塔：七级浮屠，层层出檐 ──
  M['gear-pagoda'] = piece({ glow: '#e8c878', shadow: 0.9, draw: (b, w, h, u) => {
    const cx = w * 0.5, bot = 84 * u, n = 7, hh = 9.5 * u;
    for (let i = 0; i < n; i++) {
      const y = bot - i * hh, bw = (23 - i * 2.4) * u;
      b.wash([[cx - bw, y - hh], [cx + bw, y - hh], [cx + bw * 1.04, y], [cx - bw * 1.04, y]], { color: '#8a7a62', alpha: 0.95, blur: 1.8, edge: 0.88 });
      // 每层的檐，两头翘起来
      b.stroke([[cx - bw * 1.5, y - hh + 2.4 * u], [cx, y - hh - 1.6 * u], [cx + bw * 1.5, y - hh + 2.4 * u]],
        { w: 3.4 * u, color: '#5f4a34', taper: [0.22, 0.22], dry: 0.16 });
      b.wash(b.blob(cx, y - hh * 0.45, bw * 0.24, hh * 0.3), { color: '#2a2018', alpha: 0.6, blur: 1.2, edge: 0.5 });          // 每层一个窗
    }
    const ty = bot - n * hh;
    line(b, [cx, ty - 13 * u], [cx, ty - 1 * u], { w: 2.6 * u, color: '#b8922f', dry: 0.1 });                                   // 塔刹
    b.wash(b.blob(cx, ty - 15 * u, 3.6 * u, 3.4 * u), { color: GOLD, alpha: 0.95, blur: 1.5, edge: 0.6 });
    b.stroke([[cx - 27 * u, bot], [cx, bot + 3 * u], [cx + 27 * u, bot]], { w: 6 * u, color: '#6b6558', taper: [0.16, 0.16], dry: 0.28 });   // 塔基
  } });

  // ── 崆峒印：一方大印，印面朝下，旁边一抹朱砂 ──
  M['gear-seal'] = piece({ top: '#d8d0bc', glow: GOLD, shadow: 0.7, draw: (b, w, h, u) => {
    const cx = w * 0.5, top = 30 * u, bot = 74 * u, bw = 23 * u;
    b.wash([[cx - bw, top], [cx + bw, top], [cx + bw, bot], [cx - bw, bot]], { color: '#6e6a5c', alpha: 0.96, blur: 2.5, edge: 0.92, smooth: false });   // 印身
    b.wash([[cx - bw, top], [cx - bw * 0.5, top], [cx - bw * 0.62, bot], [cx - bw, bot]], { color: '#a8a290', alpha: 0.4, blur: 4, edge: 0.3, smooth: false });
    b.stroke([[cx - bw * 1.1, bot], [cx, bot + 3 * u], [cx + bw * 1.1, bot]], { w: 6 * u, color: '#4e4a40', taper: [0.14, 0.14], dry: 0.14 });           // 印面那条边
    // 钮：蹲着的兽，只写两笔
    b.wash(b.blob(cx, top - 7 * u, 11 * u, 7 * u, { wob: 0.18 }), { color: '#5e5a4c', alpha: 0.95, blur: 1.8, edge: 0.8 });
    b.wash(b.blob(cx + 7 * u, top - 12 * u, 5 * u, 4.5 * u, { wob: 0.22 }), { color: '#6a6658', alpha: 0.95, blur: 1.5, edge: 0.75 });
    for (const dx of [5, 9]) b.wash(b.blob(cx + dx * u, top - 13 * u, 1.2 * u, 1.2 * u), { color: '#1a1a14', alpha: 0.9, blur: 0.6, edge: 0.4 });
    // 旁边印出来的那一方朱迹
    b.ctx.save(); b.ctx.fillStyle = rgba('#b23a2f', 0.72); b.ctx.fillRect(cx + bw * 1.5, bot - 22 * u, 19 * u, 19 * u);
    b.ctx.fillStyle = rgba('#d8c8b0', 0.9); b.ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) b.ctx.fillRect(cx + bw * 1.5 + 3 * u, bot - 19 * u + k * 5 * u, 13 * u, 1.6 * u);
    b.ctx.restore();
    b.splatter(cx + bw * 1.9, bot - 12 * u, 14 * u, { n: 10, color: '#b23a2f', alpha: 0.4, size: 2.4 });
  } });

  // ── 女娲石：一块五色石，裂缝里透着补天的火 ──
  M['gear-stone'] = piece({ top: '#2a2430', bottom: '#d4c4bc', glow: '#e87a52', shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.5, cy = 50 * u;
    // 石头本体：五色一色一块washed上去，边界故意不齐
    const facets = [
      [['#8a4a3a', 0.95], [[-26, -4], [-12, -24], [4, -18], [-4, 6]]],
      [['#3a5a8a', 0.92], [[4, -18], [22, -22], [26, 2], [6, 6]]],
      [['#6a8a4a', 0.9], [[-24, 6], [6, 4], [10, 26], [-14, 24]]],
      [['#8a7a3a', 0.9], [[8, 6], [26, 2], [24, 24], [10, 26]]],
      [['#6a4a7a', 0.88], [[-12, -24], [6, -30], [22, -22], [4, -18]]],
    ];
    for (const [[col, a], pts] of facets) b.wash(pts.map(([x, y]) => [cx + x * u, cy + y * u]), { color: col, alpha: a, blur: 3, edge: 0.75, smooth: false });
    // 裂缝：补天时烧过的地方还亮着
    b.stroke([[cx - 20 * u, cy - 14 * u], [cx - 2 * u, cy - 2 * u], [cx + 8 * u, cy + 18 * u]], { w: 3.2 * u, color: '#ffd8a0', alpha: 0.85, taper: [0.3, 0.4], dry: 0.2 });
    b.stroke([[cx - 2 * u, cy - 2 * u], [cx + 14 * u, cy - 6 * u], [cx + 25 * u, cy + 2 * u]], { w: 2.2 * u, color: '#ffc880', alpha: 0.7, taper: [0.3, 0.6], dry: 0.25 });
    b.wash(b.blob(cx - 2 * u, cy - 2 * u, 9 * u, 8 * u), { color: '#ffb060', alpha: 0.35, blur: 10, edge: 0 });
    b.splatter(cx, cy - 24 * u, 26 * u, { n: 20, color: '#ffc070', alpha: 0.42, size: 2.6 });   // 溅上去的火星
  } });

  // ── 伏羲琴：横陈的古琴，七弦一岳山 ──
  M['gear-qin'] = piece({ top: '#ddd4be', glow: JADE, shadow: 0, draw: (b, w, h, u) => {
    const x0 = w * 0.08, x1 = w * 0.92, cy = 52 * u, bh = 13 * u;
    // 琴身：头宽尾窄，肩上鼓一点
    b.wash([[x0, cy - bh * 0.72], [x0 + 40 * u, cy - bh], [x1 - 18 * u, cy - bh * 0.78], [x1, cy - bh * 0.5],
      [x1, cy + bh * 0.5], [x1 - 18 * u, cy + bh * 0.78], [x0 + 40 * u, cy + bh], [x0, cy + bh * 0.72]],
      { color: '#4a3324', alpha: 0.96, blur: 2.5, edge: 0.9 });
    b.wash([[x0 + 6 * u, cy - bh * 0.5], [x1 - 24 * u, cy - bh * 0.5], [x1 - 26 * u, cy - bh * 0.2], [x0 + 6 * u, cy - bh * 0.2]],
      { color: '#8a6a44', alpha: 0.4, blur: 4, edge: 0.3 });                                                                     // 面板的光
    for (let i = 0; i < 7; i++) {   // 七弦
      const y = cy - bh * 0.42 + i * bh * 0.145;
      b.stroke([[x0 + 10 * u, y], [(x0 + x1) / 2, y + 0.5 * u], [x1 - 12 * u, y]], { w: 1.1 * u, color: '#e8dcb0', alpha: 0.85, taper: [0.06, 0.06], dry: 0 });
    }
    line(b, [x0 + 10 * u, cy - bh * 0.78], [x0 + 10 * u, cy + bh * 0.78], { w: 3 * u, color: '#c8a04a', taper: [0.2, 0.2], dry: 0.1 });   // 岳山
    for (let i = 0; i < 13; i++) {   // 十三徽
      const t = 0.12 + (i / 12) * 0.74, r = 1.4 + 1.2 * Math.sin((i / 12) * Math.PI);
      b.wash(b.blob(x0 + (x1 - x0) * t, cy - bh * 0.66, r * u, r * u), { color: '#f0ead8', alpha: 0.9, blur: 0.8, edge: 0.6 });
    }
    b.wash(b.blob((x0 + x1) / 2, cy + bh * 1.5, w * 0.3, 3 * u, { wob: 0.2 }), { color: INK, alpha: 0.26, blur: 10, edge: 0 });   // 琴自己的影子（piece 的通用影子对不上）
  } });

  return M;
}
