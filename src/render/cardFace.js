// Card face / back textures (Canvas 2D). Layout follows docs/art/CARD_ART_SPEC.md: art window, 回纹 corners,
// type-coloured frame (灵将 bronze-gold, 符箓 silver-white, 文脉 bamboo-green — hue gap > 90°), cost jade, element seal.
import { card, EL, TYPE_ZH, GRADE_ZH, GRADE_BONUS, GEAR_GRADE, BONDS } from '../data/cards.js';
import { canvas, paper, seal, roundRect, huiwen, wrap, brush, rgba, INK, FONT_BRUSH, FONT_SERIF } from './ink.js';
import { paintArt } from './cardArt.js';

export const FACE_W = 512, FACE_H = 720;
export const FRAME = {
  general: { a: '#6e4c1e', b: '#d9b45a', line: '#3a2810', label: '灵将' },
  talisman: { a: '#8d949a', b: '#f2f0ea', line: '#4a5058', label: '符箓' },
  wenmai: { a: '#24503a', b: '#7aa87c', line: '#123022', label: '文脉' },
  // 器物取青铜绿锈：色相约 190°，和金 45°、竹青 122°、银白都隔得开（CARD_ART_SPEC 要求 > 90°）
  artifact: { a: '#274a54', b: '#7fb2bd', line: '#12303a', label: '器物' },
  zhuo: { a: '#1a1a1a', b: '#5a5550', line: '#000', label: '浊灵' },
};
const ART = { x: 30, y: 78, w: 452, h: 318 };
const seedOf = (id) => [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;

// Custom AI-generated art (古画长卷风) loaded from card-art/{id}.png.
// The site is published under /wenmai-shanhai-card/, so the path has to follow Vite's base.
// An absolute "/card-art/..." hits the github.io root and 404s, and every card falls back to ink.
// Cards not listed here fall back to procedural ink painting.
const CUSTOM_ART_IDS = ['FL-001','FL-002','FL-003','FL-004','FL-005','FL-006','LJ-001','LJ-002','LJ-003','LJ-004','LJ-005','LJ-006','LJ-007','LJ-008','LJ-009','LJ-010','LJ-011','LJ-012','LJ-013','LJ-014','LJ-015','LJ-016','LJ-017','LJ-018','LJ-019','LJ-020','LJ-021','LJ-022','LJ-023','LJ-024','LJ-025','LJ-026','LJ-027','LJ-028','LJ-029','LJ-030','LJ-031','LJ-032','LJ-033','LJ-034','LJ-035','LJ-036','LJ-037','LJ-038','LJ-039','LJ-040','LJ-041','LJ-042','LJ-043','LJ-044','LJ-045','LJ-046','LJ-047','LJ-048','LJ-049','LJ-050','LJ-051','LJ-052','LJ-053','LJ-054','LJ-055','LJ-056','LJ-057','LJ-058','LJ-059','LJ-060','LJ-061','LJ-062','LJ-063','LJ-064','LJ-065','LJ-066','LJ-067','LJ-068','LJ-069','QW-001','QW-002','QW-003','QW-004','QW-005','QW-006','QW-007','QW-008','QW-009','QW-010','QW-011','QW-012','QW-013','QW-014','QW-015','QW-016','QW-017','QW-018','QW-019','QW-020','QW-021','QW-022','QW-023','QW-024','QW-025','QW-026','QW-027','WM-001','WM-002','WM-003','WM-004','WM-005','WM-006','WM-007','WM-008','WM-009','WM-010','WM-011','WM-012','WM-013','WM-014','WM-015','WM-016','WM-017','WM-018','WM-019','WM-020','WM-021','WM-022','WM-023','WM-024','ZL-001','ZL-002','ZL-003','ZL-004','ZL-005','ZL-006','ZL-007','ZL-008','ZL-009','ZL-010','ZL-011','ZL-012','ZL-013','ZL-014','ZL-015','ZL-016','ZL-017','ZL-018','ZL-019','ZL-020','ZL-021','ZL-022','ZL-023','ZL-024','ZL-025','ZL-026','ZL-027','ZL-028','ZL-029','ZL-030','ZL-031','ZL-032','ZL-033','ZL-034','ZL-035','ZL-036','ZL-037','ZL-038','ZL-039','ZL-040','ZL-041','ZL-042','ZL-043','ZL-044','ZL-045','ZL-046','ZL-047','ZL-048','ZL-049','ZL-050','ZL-051','ZL-052','ZL-053','ZL-054','ZL-055','ZL-056','ZL-057','ZL-058','ZL-059'];
const customArtMap = new Map(); // id → HTMLImageElement (loaded or null while loading)
const artListeners = new Set();
/** Fired after a painted card image arrives, so already-drawn faces can be recopied. */
export function onCustomArtLoad(fn) { artListeners.add(fn); }

function artSrc(id) {
  const base = import.meta.env.BASE_URL || './';
  return `${base}card-art/${id}.png`;
}

function preloadCustomArt() {
  for (const id of CUSTOM_ART_IDS) {
    const img = new Image();
    img.onload = () => {
      customArtMap.set(id, img);
      invalidateArtCacheFor(id);
      for (const fn of artListeners) fn(id);
    };
    img.src = artSrc(id);
    customArtMap.set(id, null); // placeholder until loaded
  }
}
preloadCustomArt();

function invalidateArtCacheFor(id) {
  for (const key of [...artCache.keys()]) if (key.startsWith(id + ':')) artCache.delete(key);
  for (const key of [...faceCache.keys()]) if (key.startsWith(id + ':')) faceCache.delete(key);
}

const artCache = new Map();
export function artCanvas(id, w = ART.w, h = ART.h) {
  const key = `${id}:${w}x${h}`;
  let c = artCache.get(key);
  if (!c) {
    c = canvas(w, h);
    const ctx = c.getContext('2d');
    const img = customArtMap.get(id);
    if (img) {
      // Cover-crop the generated image to fill the art window
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale, sh = h / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      const d = card(id);
      paintArt(ctx, w, h, d.art?.motif ?? 'mist', { seed: seedOf(id) });
    }
    artCache.set(key, c);
  }
  return c;
}

function frameStyle(d) { return d.zhuo ? FRAME.zhuo : FRAME[d.type]; }

export function drawFace(ctx, id, grade = 0, { dim = false } = {}) {
  const d = card(id), F = frameStyle(d), W = FACE_W, H = FACE_H;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  // frame
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, F.a); g.addColorStop(0.45, F.b); g.addColorStop(0.55, F.b); g.addColorStop(1, F.a);
  ctx.fillStyle = g; roundRect(ctx, 0, 0, W, H, 30); ctx.fill();
  // paper panel
  ctx.save(); roundRect(ctx, 14, 14, W - 28, H - 28, 20); ctx.clip();
  paper(ctx, W, H, { seed: seedOf(id) + 1, base: d.zhuo ? '#d9d2c4' : '#F3ECDD' });
  ctx.restore();
  ctx.strokeStyle = F.line; ctx.lineWidth = 3; roundRect(ctx, 14, 14, W - 28, H - 28, 20); ctx.stroke();
  ctx.strokeStyle = rgba(F.line, 0.5); ctx.lineWidth = 1.2; roundRect(ctx, 21, 21, W - 42, H - 42, 16); ctx.stroke();
  // art
  ctx.drawImage(artCanvas(id), ART.x, ART.y);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(ART.x, ART.y, ART.w, ART.h);
  const b = brush(ctx, seedOf(id) + 3);
  // corners
  huiwen(ctx, 26, 26, 30, { color: F.line, lw: 2.5 });
  huiwen(ctx, W - 26, 26, 30, { color: F.line, lw: 2.5, flipX: -1 });
  huiwen(ctx, 26, H - 26, 30, { color: F.line, lw: 2.5, flipY: -1 });
  huiwen(ctx, W - 26, H - 26, 30, { color: F.line, lw: 2.5, flipX: -1, flipY: -1 });
  // name
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${d.name.length > 6 ? 40 : 46}px ${FONT_BRUSH}`;
  ctx.fillText(d.name, W / 2, 48);
  // type ribbon under the art
  const ry = ART.y + ART.h + 6;
  ctx.fillStyle = rgba(F.line, 0.85);
  ctx.fillRect(ART.x, ry, ART.w, 30);
  ctx.fillStyle = '#f3ecdd'; ctx.font = `20px ${FONT_SERIF}`; ctx.textAlign = 'left';
  const bondTxt = (d.bonds ?? []).map((k) => BONDS[k].name).join(' · ');
  const guardTxt = d.guard || d.gear?.guard ? ' · 守护' : '';
  ctx.fillText(`${d.zhuo ? '浊灵' : TYPE_ZH[d.type]} · ${d.faction}${guardTxt}`, ART.x + 10, ry + 16);
  ctx.textAlign = 'right';
  // 专属器物把主人写在绶带右端，跟灵将的羁绊占同一个位置
  const only = d.gear?.only;
  if (only) ctx.fillText(`专属 · ${only.map((x) => card(x).short ?? card(x).name).join('／')}`, ART.x + ART.w - 10, ry + 16);
  else if (bondTxt) ctx.fillText(bondTxt, ART.x + ART.w - 10, ry + 16);
  // rules text
  const tx = 44, tw = W - 88;
  let y = ry + 50;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = INK; ctx.font = `21px ${FONT_SERIF}`;
  for (const line of wrap(ctx, d.text, tw)) { ctx.fillText(line, tx, y); y += 27; }
  const up = d.skill ? `珍品技·${d.skill.name}（${d.skill.cost}灵力）：${d.skill.text}` : d.up;
  if (up) {
    y += 4;
    ctx.font = `19px ${FONT_SERIF}`;
    ctx.fillStyle = grade >= 1 ? '#9a2a1e' : 'rgba(26,26,26,0.38)';
    for (const line of wrap(ctx, up, tw)) { ctx.fillText(line, tx, y); y += 24; }
  }
  const bottomLimit = d.type === 'general' || d.type === 'artifact' ? H - 108 : H - 50;
  if (d.flavor && y < bottomLimit - 30) {
    ctx.font = `italic 17px ${FONT_SERIF}`; ctx.fillStyle = 'rgba(60,50,40,0.7)';
    const fl = wrap(ctx, d.flavor, tw - 20);
    let fy = Math.max(y + 8, bottomLimit - fl.length * 22);
    if (fy + fl.length * 22 <= bottomLimit + 4) for (const line of fl) { ctx.fillText(line, tx + 10, fy); fy += 22; }
  }
  // cost jade
  const cg = ctx.createRadialGradient(44, 40, 4, 50, 50, 44);
  cg.addColorStop(0, '#9fd0b4'); cg.addColorStop(0.6, '#3f7a5c'); cg.addColorStop(1, '#1c3a2a');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(50, 50, 40, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c38a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fbf6e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold 50px ${FONT_SERIF}`; ctx.fillText(String(d.cost), 50, 53);
  // element seal
  seal(ctx, W - 52, 50, 60, EL[d.el].zh, { color: EL[d.el].color, seed: seedOf(id) });
  // 上古十大神器另压一枚朱印，压在五行印下面，跟品阶印分左右不打架
  if (d.divine) seal(ctx, 50, ART.y + ART.h - 30, 40, '神', { color: '#B23A2F', seed: seedOf(id) + 7 });
  // 以真实文物为原型的器物压「物」印，和神器的「神」印占同一个位置——两者互斥
  else if (d.relic) seal(ctx, 50, ART.y + ART.h - 30, 40, '物', { color: '#4A6B6E', seed: seedOf(id) + 7 });
  // stats
  if (d.type === 'general') drawStats(ctx, statsOf(id, grade), { y: H - 58 });
  if (d.type === 'artifact') drawStats(ctx, gearStats(id, grade), { y: H - 58 });
  // grade marks
  if (grade >= 1) {
    ctx.strokeStyle = grade >= 2 ? '#e8c35a' : '#c9a24a'; ctx.lineWidth = grade >= 2 ? 5 : 3;
    roundRect(ctx, 8, 8, W - 16, H - 16, 26); ctx.stroke();
    seal(ctx, W - 50, ART.y + ART.h - 30, 40, GRADE_ZH[grade][0], { color: grade >= 2 ? '#C0392B' : '#8a6a2a', seed: 11 });
  }
  if (d.zhuo) b.splatter(W * 0.8, H * 0.85, 60, { n: 18, alpha: 0.4, size: 3 });
  if (dim) { ctx.fillStyle = 'rgba(20,20,20,0.55)'; roundRect(ctx, 0, 0, W, H, 30); ctx.fill(); }
  ctx.restore();
}

export function statsOf(id, grade = 0) {
  const d = card(id), g = GRADE_BONUS[grade];
  return { atk: d.atk + g.atk, def: d.def + g.def, hp: d.hp + g.hp, maxHp: d.hp + g.hp, base: { atk: d.atk + g.atk, def: d.def + g.def, hp: d.hp + g.hp } };
}

/** 器物卡面上那三颗牌子显示的是「佩戴后加多少」，所以 base 和 val 一样，不该染色。 */
export function gearStats(id, grade = 0) {
  const g = card(id).gear ?? {}, b = GEAR_GRADE[grade] ?? 0;
  const v = { atk: (g.atk ?? 0) + b, def: (g.def ?? 0) + b, hp: g.hp ?? 0 };
  return { ...v, maxHp: v.hp, base: { ...v } };
}

/** Three stat medallions: 攻 / 防 / 血. Values that differ from base are tinted (green up, red down). */
export function drawStats(ctx, v, { y, cx = FACE_W / 2, gap = 150, r = 38, font = 44 } = {}) {
  const items = [
    { k: 'atk', label: '攻', c1: '#c0503a', c2: '#5a1a10', val: v.atk, base: v.base?.atk },
    { k: 'def', label: '防', c1: '#5a7a9a', c2: '#1a2a3a', val: v.def, base: v.base?.def },
    { k: 'hp', label: '血', c1: '#6a9a5a', c2: '#1e3a1a', val: v.hp, base: v.maxHp },
  ];
  items.forEach((it, i) => {
    const x = cx + (i - 1) * gap;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
    g.addColorStop(0, it.c1); g.addColorStop(1, it.c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    if (it.k === 'atk') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
    else if (it.k === 'def') { ctx.moveTo(x - r * 0.85, y - r * 0.8); ctx.lineTo(x + r * 0.85, y - r * 0.8); ctx.lineTo(x + r * 0.8, y + r * 0.1); ctx.quadraticCurveTo(x, y + r * 1.1, x - r * 0.8, y + r * 0.1); ctx.closePath(); }
    else ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8d49a'; ctx.lineWidth = 2.5; ctx.stroke();
    let col = '#fbf6e8';
    if (it.base !== undefined) {
      if (it.k === 'hp') { if (it.val < it.base) col = '#ff8a7a'; else if (it.base > (v.base?.hp ?? it.base)) col = '#b8f0a0'; }
      else if (it.val > it.base) col = '#b8f0a0'; else if (it.val < it.base) col = '#ff8a7a';
    }
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${font}px ${FONT_SERIF}`;
    ctx.fillText(String(Math.max(0, it.val)), x, y + 3);
    ctx.fillStyle = 'rgba(251,246,232,0.85)'; ctx.font = `${font * 0.4}px ${FONT_SERIF}`;
    ctx.fillText(it.label, x + r * 0.95, y + r * 0.72);
  });
}

export function drawBack(ctx, { seed = 17, tint = '#1c2430' } = {}) {
  const W = FACE_W, H = FACE_H;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#6e4c1e'); g.addColorStop(0.5, '#d9b45a'); g.addColorStop(1, '#6e4c1e');
  ctx.fillStyle = g; roundRect(ctx, 0, 0, W, H, 30); ctx.fill();
  ctx.fillStyle = tint; roundRect(ctx, 14, 14, W - 28, H - 28, 20); ctx.fill();
  const b = brush(ctx, seed);
  ctx.save(); roundRect(ctx, 14, 14, W - 28, H - 28, 20); ctx.clip();
  for (let row = 0; row < 7; row++) for (let col = 0; col < 4; col++) {
    b.cloud(40 + col * 130 + (row % 2) * 60, 60 + row * 105, 16, { color: '#c8a04a', alpha: 0.22, w: 3 });
  }
  const rg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 200);
  rg.addColorStop(0, 'rgba(200,160,74,0.35)'); rg.addColorStop(1, 'rgba(200,160,74,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = '#c8a04a'; ctx.lineWidth = 3;
  roundRect(ctx, 30, 30, W - 60, H - 60, 14); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 110, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 98, 0, Math.PI * 2); ctx.lineWidth = 1.2; ctx.stroke();
  for (const [x, y, fx, fy] of [[36, 36, 1, 1], [W - 36, 36, -1, 1], [36, H - 36, 1, -1], [W - 36, H - 36, -1, -1]]) huiwen(ctx, x, y, 34, { color: '#c8a04a', lw: 2.5, flipX: fx, flipY: fy });
  ctx.fillStyle = '#e8d49a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `92px ${FONT_BRUSH}`; ctx.fillText('文', W / 2, H / 2 - 42); ctx.fillText('脈', W / 2, H / 2 + 52);
  ctx.restore();
}

// ───────────────────────────── caches ─────────────────────────────
const faceCache = new Map();
export function faceCanvas(id, grade = 0) {
  const key = `${id}:${grade}`;
  let c = faceCache.get(key);
  if (!c) { c = canvas(FACE_W, FACE_H); drawFace(c.getContext('2d'), id, grade); faceCache.set(key, c); }
  return c;
}
let backC = null;
export function backCanvas() {
  if (!backC) { backC = canvas(FACE_W, FACE_H); drawBack(backC.getContext('2d')); }
  return backC;
}
export function clearFaceCache() { faceCache.clear(); }
