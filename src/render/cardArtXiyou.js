// 西游取经五众的卡面。构图沿用灵将那一套：一片天、一个人、几件道具。
// 入口 xiyouMotifs(H)，H 由 cardArt.js 传进来。
import { rgba, INK, FONT_BRUSH } from './ink.js';

const GOLD = '#C8A04A', RED = '#C03A2A', JADE = '#4A8C5C', OCHRE = '#8C6040';

/** 两点直线。ink.js 的 stroke() 首尾宽度都收到 0，只给两点会画不出东西，必须补中点。 */
const line = (b, a, z, o = {}) => b.stroke([a, [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2 + (o.sag ?? 0)], z], o);

export function xiyouMotifs({ sky, figure, flame, wave, scrollFrame }) {
  const M = {};

  /** 一路向西：背景都压一轮低日头和远山，五张放一起能看出是同一条路。 */
  const road = (b, w, h, { top, bottom, sun = '#e8b060', sunY = 0.26 }) => {
    sky(b, w, h, { top, bottom, sun: [w * 0.8, h * sunY, h * 0.1, sun] });
    b.mountains(w, h, { base: 0.58, layers: 3, color: '#6a5f50', alpha: 0.2, peak: 0.2 });
    b.wash([[0, h * 0.86], [w, h * 0.84], [w, h], [0, h]], { color: '#b09a72', alpha: 0.35, blur: 8, edge: 0.2 });
  };

  // ── 孙悟空：金箍棒扛肩上，脚下一朵筋斗云 ──
  M['xy-wukong'] = (b, w, h) => {
    road(b, w, h, { top: '#e4d2ae', bottom: '#f2e8d2' });
    b.cloud(w * 0.5, h * 0.9, 26, { color: '#d8b060', alpha: 0.8, w: 4 });     // 筋斗云
    const f = figure(b, w * 0.47, h * 0.9, h * 0.72, { robe: '#b8722a', accent: RED, head: 'bun', sleeve: 0.8, width: 0.85, lean: -0.05 });
    // 金箍棒：从右肩斜到左下
    b.stroke([[f.rh[0] + 22, f.rh[1] - 46], [f.sh[0] - 4, f.sh[1] + 18], [f.lh[0] - 26, f.lh[1] + 52]], { w: 7, color: '#c8951f', taper: [0.06, 0.06], dry: 0.2 });
    for (const [x, y] of [[f.rh[0] + 20, f.rh[1] - 42], [f.lh[0] - 24, f.lh[1] + 48]]) b.wash(b.blob(x, y, 6, 5), { color: '#8a6a2a', alpha: 0.95, blur: 1, edge: 0.7 });
    // 金箍 + 火眼金睛
    line(b, [f.head[0] - 9, f.head[1] - 7], [f.head[0] + 9, f.head[1] - 8], { w: 3.6, color: GOLD, dry: 0.1 });
    for (const dx of [-4, 4]) b.wash(b.blob(f.head[0] + dx, f.head[1] - 1, 2.6, 2.2), { color: '#ff9a30', alpha: 0.95, blur: 1.5, edge: 0.3 });
    b.splatter(w * 0.72, h * 0.34, 34, { n: 16, color: '#c8951f', alpha: 0.35, size: 2.6 });
  };

  // ── 猪八戒：九齿钉耙拄地，身后一担行李 ──
  M['xy-bajie'] = (b, w, h) => {
    road(b, w, h, { top: '#dfdcc0', bottom: '#f0ecd8', sun: '#cfd8a0' });
    const f = figure(b, w * 0.46, h * 0.95, h * 0.7, { robe: '#5f6a44', accent: '#8a9a52', head: 'bun', sleeve: 1.3, width: 1.4 });
    // 钉耙：竖杆 + 九齿
    const px = f.rh[0] + 26;
    b.stroke([[px, h * 0.22], [px - 3, h * 0.55], [px, h * 0.95]], { w: 6, color: '#6b4a2a', taper: [0.08, 0.1], dry: 0.25 });
    line(b, [px - 26, h * 0.24], [px + 22, h * 0.22], { w: 6, color: '#8a8a92', dry: 0.15 });
    for (let i = 0; i < 9; i++) {
      const x = px - 24 + i * 5.7;
      line(b, [x, h * 0.245], [x - 1, h * 0.305], { w: 2.4, color: '#b4b4bc', dry: 0.1 });
    }
    // 大耳朵和长嘴
    for (const sgn of [-1, 1]) b.wash(b.blob(f.head[0] + sgn * 11, f.head[1] - 1, 6, 8, { rot: sgn * 0.4 }), { color: '#c9a58a', alpha: 0.85, blur: 1.2, edge: 0.5 });
    b.wash(b.blob(f.head[0] + 5, f.head[1] + 4, 7, 4.5), { color: '#d0a890', alpha: 0.9, blur: 1, edge: 0.6 });
  };

  // ── 沙僧：挑着担子，降妖宝杖在手，身后流沙河 ──
  M['xy-shaseng'] = (b, w, h) => {
    road(b, w, h, { top: '#ded6c0', bottom: '#eee6d0', sun: '#c8b890' });
    for (let r = 0; r < 3; r++) wave(b, -20, h * (0.66 + r * 0.06), w + 40, { n: 6, s: 1, color: '#7a8a80' });
    const f = figure(b, w * 0.46, h * 0.95, h * 0.72, { robe: '#6a5a46', accent: '#8a7050', head: 'bun', sleeve: 1.1, width: 1.15 });
    // 扁担横过双肩，两头各一件行李
    line(b, [f.sh[0] - 46, f.sh[1] - 6], [f.sh[0] + 46, f.sh[1] - 10], { w: 5, color: '#6b4a2a', dry: 0.3 });
    for (const sgn of [-1, 1]) {
      const x = f.sh[0] + sgn * 44, y = f.sh[1] - 8 + sgn * 2;
      line(b, [x, y], [x + sgn * 2, y + 22], { w: 2, color: '#6b4a2a', dry: 0.2 });
      b.wash(b.blob(x + sgn * 3, y + 32, 11, 9, { wob: 0.2 }), { color: '#9a7a52', alpha: 0.9, blur: 1.5, edge: 0.6 });
    }
    // 脖子上那串骷髅，只画成一圈小白点
    for (let i = 0; i < 7; i++) {
      const a = -0.4 + i * 0.22;
      b.wash(b.blob(f.head[0] + Math.sin(a) * 15, f.head[1] + 17 + Math.cos(a) * 4, 2.6, 2.4), { color: '#e8e2d2', alpha: 0.85, blur: 0.8, edge: 0.5 });
    }
  };

  // ── 白龙马：一匹白马，鬃毛化成一缕龙形火气 ──
  M['xy-bailong'] = (b, w, h) => {
    road(b, w, h, { top: '#e8d0bc', bottom: '#f4e6d4', sun: '#e07a4a', sunY: 0.22 });
    const bx = w * 0.46, by = h * 0.62;
    b.wash(b.blob(bx, by, w * 0.2, h * 0.13, { wob: 0.12 }), { color: '#efe8dc', alpha: 0.95, blur: 3, edge: 0.75 });      // 身
    b.stroke([[bx + w * 0.16, by - h * 0.04], [bx + w * 0.26, by - h * 0.2], [bx + w * 0.3, by - h * 0.3]], { w: 15, color: '#efe8dc', taper: [0.25, 0.3], dry: 0.2 });   // 颈
    b.wash(b.blob(bx + w * 0.31, by - h * 0.32, 15, 9, { rot: -0.5 }), { color: '#f2ece0', alpha: 0.95, blur: 1.5, edge: 0.7 });   // 头
    for (let i = 0; i < 4; i++) {   // 四条腿
      const x = bx + (i - 1.5) * w * 0.09;
      line(b, [x, by + h * 0.1], [x + (i < 2 ? -4 : 4), h * 0.9], { w: 7, color: '#e4dccc', dry: 0.25 });
    }
    // 鬃毛和尾巴烧成龙形火气
    flame(b, bx + w * 0.24, by - h * 0.18, h * 0.24, { color: '#e06a3a', n: 4 });
    b.stroke([[bx - w * 0.19, by - h * 0.02], [bx - w * 0.3, by - h * 0.14], [bx - w * 0.28, by - h * 0.3]], { w: 9, color: '#e8894a', alpha: 0.8, taper: [0.2, 0.8], dry: 0.5 });
    b.wash(b.blob(bx + w * 0.33, by - h * 0.335, 2.4, 2.2), { color: '#c03a2a', alpha: 0.95, blur: 0.8, edge: 0.3 });      // 眼
  };

  // ── 唐三藏：合十而立，身后一圈佛光，手里通关文牒 ──
  M['xy-sanzang'] = (b, w, h) => {
    road(b, w, h, { top: '#dcd8c8', bottom: '#f0ecdc', sun: '#d8c890' });
    const g = b.ctx.createRadialGradient(w * 0.46, h * 0.36, 0, w * 0.46, h * 0.36, h * 0.34);
    g.addColorStop(0, rgba('#f0d890', 0.55)); g.addColorStop(1, rgba('#f0d890', 0));
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);                                                     // 佛光
    const f = figure(b, w * 0.46, h * 0.95, h * 0.74, { robe: '#8a5a3a', accent: '#c8902a', head: 'bun', sleeve: 1.35, width: 1.05, alpha: 0.92 });
    // 袈裟上的田相格
    for (let i = 0; i < 3; i++) line(b, [f.sh[0] - 22, f.sh[1] + 20 + i * 13], [f.sh[0] + 22, f.sh[1] + 18 + i * 13], { w: 2, color: '#c8902a', alpha: 0.7, dry: 0.3 });
    // 光头 + 眉心一点
    b.wash(b.blob(f.head[0], f.head[1] - 6, 7.5, 5.5), { color: '#d6b494', alpha: 0.9, blur: 1.2, edge: 0.6 });
    b.wash(b.blob(f.head[0], f.head[1] - 3, 1.8, 1.8), { color: RED, alpha: 0.9, blur: 0.6, edge: 0.3 });
    // 手里的文牒
    b.ctx.save(); b.ctx.translate(f.lh[0] - 4, f.lh[1] + 6); b.ctx.rotate(-0.25);
    b.ctx.fillStyle = '#efe6d2'; b.ctx.fillRect(-9, -16, 18, 32);
    b.ctx.strokeStyle = rgba(GOLD, 0.9); b.ctx.lineWidth = 1.5; b.ctx.strokeRect(-9, -16, 18, 32);
    b.ctx.fillStyle = 'rgba(30,24,16,0.8)'; b.ctx.font = `11px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    for (let k = 0; k < 3; k++) b.ctx.fillText('文牒经'[k], 0, -4 + k * 11);
    b.ctx.restore();
  };

  // ── 西游释厄传：一卷书，页上是取经路 ──
  M['xy-scroll'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
    b.mountains(iw, ih, { base: 0.5, layers: 3, color: '#6a5f50', alpha: 0.26, peak: 0.24 });
    // 一条向西的小路，四个小小的人影走在上面
    b.stroke([[iw * 0.08, ih * 0.94], [iw * 0.42, ih * 0.78], [iw * 0.62, ih * 0.66], [iw * 0.94, ih * 0.58]], { w: 9, color: '#c8b48c', alpha: 0.75, taper: [0.1, 0.5], dry: 0.4 });
    for (let i = 0; i < 4; i++) {
      const t = 0.18 + i * 0.13, x = iw * (0.1 + t * 0.85), y = ih * (0.93 - t * 0.34);
      b.wash(b.blob(x, y - 7, 3.2, 6.5), { color: INK, alpha: 0.6, blur: 1.2, edge: 0.4 });
    }
    b.ctx.save(); b.ctx.fillStyle = 'rgba(40,32,20,0.62)'; b.ctx.font = `${Math.round(ih * 0.17)}px ${FONT_BRUSH}`; b.ctx.textAlign = 'left';
    b.ctx.fillText('释厄', iw * 0.06, ih * 0.26);
    b.ctx.restore();
  }, { bg: '#f0e8d4' });

  return M;
}
