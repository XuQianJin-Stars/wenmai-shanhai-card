// 两宋风雅（第八章）的卡面。cardArt.js 出画笔和人物骨架，这里只说每张画的是什么。
//
// 这一章整体压在石青石绿上，和大唐那批的金红分开——把两章的牌摊在桌上，
// 一眼就该看得出是两个朝代。唯一例外是辛弃疾：他那张要有火，不然不像他。
import { mix, INK, FONT_BRUSH } from './ink.js';

const GOLD = '#C8A04A', JADE = '#4A8C5C', OCHRE = '#8C6040';
const QING = '#1C6070', LU = '#2A7254';   // 石青 / 石绿（矿物色，压得住才像厚涂）

export function songMotifs(H) {
  const { sky, figure, flame, wave, eye, scrollFrame, murk } = H;
  const M = {};

  /**
   * 青绿山水的一组山脊。每层都是一个铺到画底的多边形，所以画的顺序必须是「高的先画」：
   * 先石青占住峰顶，再用石绿盖住半山以下，最后赭石只露出山脚。顺序反过来就只剩一片青。
   * 颜色也要下得狠——这批是厚涂的矿物色，淡淡一层在卡面尺寸上会糊成灰绿。
   */
  const qinglv = (b, w, h, { base = 0.6, amp = 0.3, x0 = 0, x1 = 1, seed = 1, foot = true } = {}) => {
    const shape = (y0, a, k) => {
      const pts = [[w * x0 - 10, h + 10]];
      for (let t = 0; t <= 1.001; t += 0.08) pts.push([w * (x0 + t * (x1 - x0)), h * (y0 - a * (0.3 + 0.7 * Math.abs(Math.sin(t * 5.2 + k))))]);
      pts.push([w * x1 + 10, h + 10]);
      return pts;
    };
    const top = shape(base - 0.04, amp, seed);
    b.wash(top, { color: QING, alpha: 0.94, blur: 2, edge: 0.7 });                                                // 石青：峰
    b.stroke(top.slice(1, -1), { w: 3, color: '#0d3a45', alpha: 0.8, dry: 0.35, taper: [0.05, 0.05] });           // 脊线
    b.wash(shape(base + 0.08, amp * 0.72, seed + 1.3), { color: LU, alpha: 0.94, blur: 2, edge: 0.65 });          // 石绿：半山
    // 赭石只给最近的一重。远山露出赭石会显得比近山还实，整幅的纵深就塌了。
    if (foot) b.wash(shape(base + 0.17, amp * 0.36, seed + 2.1), { color: '#8f5a33', alpha: 0.92, blur: 2, edge: 0.6 });
  };

  /** 一摞书箱／拓本箱。open 为真时盖子掀着，里面是空的——这一章的东西都是这么没的。 */
  const chest = (b, x, y, s, { open = false, color = '#5e3f26' } = {}) => {
    const { ctx } = b;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x - s, y - s * 0.5, s * 2, s);
    ctx.fillStyle = mix(color, '#000', 0.4);                       // 侧板的暗面，不然是一块死色
    ctx.fillRect(x - s, y + s * 0.2, s * 2, s * 0.3);
    ctx.strokeStyle = '#c8a04a'; ctx.lineWidth = Math.max(1.4, s * 0.09);
    ctx.strokeRect(x - s, y - s * 0.5, s * 2, s);                  // 包角的铜条
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.5); ctx.lineTo(x, y + s * 0.5); ctx.stroke();
    if (open) {
      ctx.fillStyle = '#0e0b09';                                   // 里头什么都没有
      ctx.fillRect(x - s * 0.82, y - s * 0.38, s * 1.64, s * 0.62);
      ctx.fillStyle = mix(color, '#000', 0.25);                    // 掀起来的盖子
      ctx.beginPath();
      ctx.moveTo(x - s, y - s * 0.5); ctx.lineTo(x + s, y - s * 0.5);
      ctx.lineTo(x + s * 1.18, y - s * 1.3); ctx.lineTo(x - s * 0.82, y - s * 1.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  /** 画里的一个小人：一点头、一竖身。人一多，画面才像宋画。 */
  const figurine = (b, x, y, { s = 1, alpha = 0.9, color = '#26201a' } = {}) => {
    b.ctx.save();
    b.ctx.globalAlpha = alpha; b.ctx.fillStyle = color;
    b.ctx.fillRect(x - 2 * s, y - 13 * s, 4 * s, 13 * s);
    b.ctx.beginPath(); b.ctx.arc(x, y - 16 * s, 3 * s, 0, 6.3); b.ctx.fill();
    b.ctx.restore();
  };

  // ── 灵将 ────────────────────────────────────────────────────────────────
  // 李清照：雨夜，身后三只拓本箱，最上面那只已经空了。她手里只剩一卷。
  M.liqingzhao = (b, w, h) => {
    sky(b, w, h, { top: '#2e3c4a', bottom: '#8f9ea4' });
    b.mountains(w, h, { base: 0.42, alpha: 0.2, color: '#22323c' });
    chest(b, w * 0.8, h * 0.9, 34, { open: true });
    chest(b, w * 0.9, h * 0.62, 24);
    const f = figure(b, w * 0.34, h * 0.99, h * 0.76, { robe: '#2f4257', accent: '#b8ccd4', head: 'bun', sleeve: 1.5, lean: -0.14, alpha: 0.95 });
    // 手里那一卷，也是最后一卷
    b.wash([[f.rh[0] - 24, f.rh[1] - 4], [f.rh[0] + 16, f.rh[1] - 14], [f.rh[0] + 19, f.rh[1] + 12], [f.rh[0] - 21, f.rh[1] + 24]],
      { color: '#f0e6cc', alpha: 0.98, blur: 0.6, edge: 0.8 });
    b.stroke([[f.rh[0] - 20, f.rh[1] + 2], [f.rh[0] + 14, f.rh[1] - 6]], { w: 2, color: '#6a5a44', alpha: 0.7, dry: 0.2 });
    // 雨画在最上面，才压得住底下的深色
    for (let i = 0; i < 90; i++) {
      const x = b.r(-20, w), y = b.r(-20, h * 0.94);
      b.ctx.strokeStyle = `rgba(226,238,242,${b.r(0.3, 0.7).toFixed(2)})`;
      b.ctx.lineWidth = 1.4;
      b.ctx.beginPath(); b.ctx.moveTo(x, y); b.ctx.lineTo(x - 7, y + b.r(26, 44)); b.ctx.stroke();
    }
    b.ctx.fillStyle = 'rgba(214,230,236,0.35)'; b.ctx.font = `${h * 0.11}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('寻', w * 0.12, h * 0.24);
  };

  // 辛弃疾：深夜，一盏灯，一把横过整幅的剑，远处是只在梦里的连营。
  M.xinqiji = (b, w, h) => {
    sky(b, w, h, { top: '#0e1420', bottom: '#5a3524' });
    for (let k = 0; k < 8; k++) {                        // 梦回吹角连营：远处一排帐篷
      const x = w * (0.04 + k * 0.13), y = h * 0.5;
      b.wash([[x - 26, y], [x, y - 30], [x + 26, y]], { color: '#1a1c22', alpha: 0.85, blur: 2, edge: 0.5 });
      if (k % 2) { b.ctx.fillStyle = 'rgba(255,164,70,0.55)'; b.ctx.fillRect(x - 3.5, y - 13, 7, 12); }
    }
    const g = b.ctx.createRadialGradient(w * 0.76, h * 0.56, 0, w * 0.76, h * 0.56, h * 0.62);
    g.addColorStop(0, 'rgba(255,186,96,0.65)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
    const f = figure(b, w * 0.4, h * 1.0, h * 0.76, { robe: '#3e211a', accent: GOLD, head: 'hat', width: 1.25, lean: 0.16, alpha: 0.96 });
    // 剑横在膝前：一条深背压一条亮刃，再加护手和柄。三件都画上，才不会读成一道高光。
    const y0 = f.rh[1] + 34;
    const bar = (x0, x1, yy0, yy1, wd, color, alpha) => {
      b.ctx.save(); b.ctx.globalAlpha = alpha; b.ctx.strokeStyle = color; b.ctx.lineWidth = wd; b.ctx.lineCap = 'round';
      b.ctx.beginPath(); b.ctx.moveTo(x0, yy0); b.ctx.lineTo(x1, yy1); b.ctx.stroke(); b.ctx.restore();
    };
    bar(w * 0.14, w * 0.93, y0 + 14, y0 - 12, 10, '#0e1014', 0.92);
    bar(w * 0.16, w * 0.91, y0 + 12, y0 - 13, 4, '#f4f8ff', 1);
    bar(w * 0.11, w * 0.23, y0 + 16, y0 + 12, 12, '#4a2f1e', 1);                      // 柄
    bar(w * 0.24, w * 0.25, y0 + 2, y0 + 24, 7, '#c8a04a', 1);                        // 护手
    // 灯
    b.wash(b.blob(w * 0.8, h * 0.54, 16, 21, { wob: 0.1 }), { color: '#f4c874', alpha: 0.95, blur: 2, edge: 0.55 });
    flame(b, w * 0.8, h * 0.49, 26, { n: 3 });
    b.ctx.fillStyle = 'rgba(255,206,140,0.42)'; b.ctx.font = `${h * 0.1}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('剑', w * 0.1, h * 0.2);
  };

  // 张择端：人站在左，右边一卷画正在展开，画里是虹桥、船和赶集的人。
  M.zhangzeduan = (b, w, h) => {
    sky(b, w, h, { top: '#9a9382', bottom: '#d8d0b8' });
    // 展开的长卷：一条比背景亮一档、四边压边的带子
    const y0 = h * 0.24, hh = h * 0.46, x0 = w * 0.28;
    b.ctx.fillStyle = '#efe6cc'; b.ctx.fillRect(x0, y0, w - x0, hh);
    b.ctx.strokeStyle = '#8a6a3a'; b.ctx.lineWidth = 3; b.ctx.strokeRect(x0, y0, w - x0 + 4, hh);
    b.ctx.fillStyle = '#5a4630'; b.ctx.fillRect(x0 - 8, y0 - 6, 10, hh + 12);            // 卷首的轴
    // 汴河与虹桥
    const wy = y0 + hh * 0.72;
    b.ctx.fillStyle = 'rgba(122,150,158,0.5)'; b.ctx.fillRect(x0, wy, w - x0, hh * 0.28);
    for (let r = 0; r < 3; r++) wave(b, x0, wy + hh * (0.06 + r * 0.07), w - x0, { n: 5, s: 0.7, color: '#4e7280' });
    const bx0 = x0 + (w - x0) * 0.12, bx1 = x0 + (w - x0) * 0.92, rise = hh * 0.34;
    const arcY = (t) => wy - Math.sin(t * Math.PI) * rise;
    b.ctx.strokeStyle = '#6b4526'; b.ctx.lineWidth = 7;
    b.ctx.beginPath(); b.ctx.moveTo(bx0, wy);
    for (let t = 0; t <= 1.001; t += 0.05) b.ctx.lineTo(bx0 + (bx1 - bx0) * t, arcY(t));
    b.ctx.stroke();
    b.ctx.lineWidth = 2;   // 桥下的支撑；桥上只放人，不放栏杆（见 scroll-qingming 的注释）
    for (let k = 1; k < 10; k++) { const t = k / 10, x = bx0 + (bx1 - bx0) * t; b.ctx.beginPath(); b.ctx.moveTo(x, arcY(t)); b.ctx.lineTo(x, wy); b.ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const t = b.r(0.04, 0.96); figurine(b, bx0 + (bx1 - bx0) * t, arcY(t) - 2, { s: 1 }); }
    for (let i = 0; i < 6; i++) figurine(b, b.r(x0 + 10, w - 10), b.r(wy + hh * 0.16, y0 + hh - 6), { s: 0.8, alpha: 0.7 });
    const f = figure(b, w * 0.15, h * 0.99, h * 0.72, { robe: '#4a3a2a', accent: OCHRE, head: 'hat', width: 1.15, alpha: 0.95 });
    b.stroke([[f.rh[0], f.rh[1]], [x0 - 6, y0 + hh * 0.42]], { w: 3.4, color: '#3a2c1e', alpha: 0.85, dry: 0.2 });   // 手扶着卷首
  };

  // 王希孟：人很小，山很大——十八岁那一卷就是这个比例。
  M.wangximeng = (b, w, h) => {
    sky(b, w, h, { top: '#4c7f92', bottom: '#cfe0d8' });
    qinglv(b, w, h, { base: 0.26, amp: 0.26, x0: 0.24, x1: 1.12, seed: 3, foot: false });
    qinglv(b, w, h, { base: 0.4, amp: 0.26, x0: -0.14, x1: 0.62, seed: 7 });
    b.ctx.fillStyle = '#4e7886'; b.ctx.fillRect(0, h * 0.78, w, h * 0.22);
    for (let r = 0; r < 4; r++) wave(b, -20, h * (0.81 + r * 0.05), w + 40, { n: 6, s: 0.9, color: '#2f5f70' });
    const f = figure(b, w * 0.22, h * 0.9, h * 0.32, { robe: '#23433c', accent: JADE, head: 'bun', alpha: 0.95 });
    b.stroke([[f.rh[0] - 2, f.rh[1] + 6], [f.rh[0] + 14, f.rh[1] - 22]], { w: 3, color: '#4a2e18', alpha: 0.95, dry: 0.1 });   // 笔
    b.ctx.fillStyle = 'rgba(18,65,76,0.45)'; b.ctx.font = `${h * 0.11}px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
    b.ctx.fillText('青', w * 0.9, h * 0.15);
  };

  // ── 文脉（卷轴） ────────────────────────────────────────────────────────
  M['scroll-qianli'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
    const g = b.ctx.createLinearGradient(0, 0, 0, ih);
    g.addColorStop(0, '#8fb8c4'); g.addColorStop(1, '#dfe4c8');
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, iw, ih);
    // 一卷十一米九的山，塞进这一格只能靠层层往后退。石青石绿要压足，淡了就成了一片灰。
    const band = (y0, amp, color, alpha, k) => {
      const pts = [[-12, ih + 12]];
      for (let t = 0; t <= 1.001; t += 0.06) pts.push([-12 + (iw + 24) * t, ih * y0 - ih * amp * (0.25 + 0.75 * Math.abs(Math.sin(t * (5 + k) + k * 1.7)))]);
      pts.push([iw + 12, ih + 12]);
      b.wash(pts, { color, alpha, blur: 2, edge: 0.6 });
      return pts.slice(1, -1);
    };
    const crest = band(0.5, 0.44, QING, 0.94, 0);                  // 高的先画，见 qinglv 的注释
    b.stroke(crest, { w: 2.6, color: '#0d3a45', alpha: 0.75, dry: 0.4, taper: [0.04, 0.04] });
    band(0.66, 0.28, LU, 0.94, 2);
    band(0.79, 0.14, '#8f5a33', 0.92, 4);
    b.ctx.fillStyle = 'rgba(78,120,134,0.5)'; b.ctx.fillRect(0, ih * 0.84, iw, ih * 0.16);
    for (let r = 0; r < 3; r++) b.stroke([[-10, ih * (0.86 + r * 0.045)], [iw + 10, ih * (0.86 + r * 0.045) + b.r(-3, 3)]], { w: 1.8, color: '#2f5f70', alpha: 0.6, dry: 0.4 });
    for (let i = 0; i < 5; i++) {                        // 山脚下的屋，小到几乎看不见——原卷就是这样
      const x = b.r(iw * 0.1, iw * 0.9), y = ih * b.r(0.78, 0.86);
      b.ctx.fillStyle = 'rgba(46,38,28,0.85)';
      b.ctx.beginPath(); b.ctx.moveTo(x - 8, y); b.ctx.lineTo(x, y - 7); b.ctx.lineTo(x + 8, y); b.ctx.closePath(); b.ctx.fill();
    }
    b.mist(iw, ih, ih * 0.58, { alpha: 0.14, color: '#eef4ea', n: 3 });
  }, { bg: '#dfe4c8' });

  M['scroll-qingming'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
    b.ctx.fillStyle = '#e4dbc0'; b.ctx.fillRect(0, 0, iw, ih);
    // 汴河从左下斜到右上，虹桥横在中间
    b.ctx.fillStyle = '#7f989e';
    b.ctx.beginPath(); b.ctx.moveTo(-10, ih * 0.92); b.ctx.lineTo(iw * 0.5, ih * 0.66); b.ctx.lineTo(iw + 10, ih * 0.6);
    b.ctx.lineTo(iw + 10, ih + 10); b.ctx.lineTo(-10, ih + 10); b.ctx.closePath(); b.ctx.fill();
    for (let r = 0; r < 3; r++) b.stroke([[-10, ih * (0.78 + r * 0.06)], [iw + 10, ih * (0.68 + r * 0.06)]], { w: 1.6, color: '#5a7a84', alpha: 0.45, dry: 0.5 });
    const arc = []; for (let t = 0; t <= 1.001; t += 0.05) arc.push([iw * (0.16 + t * 0.7), ih * 0.72 - Math.sin(t * Math.PI) * ih * 0.26]);
    b.stroke(arc, { w: 6, color: '#7a5434', alpha: 0.92, dry: 0.12, taper: [0.06, 0.06] });
    // 桥下的支撑画出来，桥上不画栏杆——栏杆和人在这个尺寸上会糊成一排毛刺，人更要紧
    for (let k = 1; k < 9; k++) {
      const t = k / 9, x = iw * (0.16 + t * 0.7), yt = ih * 0.72 - Math.sin(t * Math.PI) * ih * 0.26;
      b.stroke([[x, yt], [x, ih * 0.74]], { w: 1.8, color: '#8a6440', alpha: 0.5, dry: 0.35, taper: [0.15, 0.15] });
    }
    // 那条快要撞上桥的船
    b.wash([[iw * 0.42, ih * 0.8], [iw * 0.64, ih * 0.78], [iw * 0.62, ih * 0.87], [iw * 0.44, ih * 0.88]], { color: '#5a4430', alpha: 0.92, blur: 1, edge: 0.6 });
    b.stroke([[iw * 0.53, ih * 0.78], [iw * 0.56, ih * 0.56]], { w: 2.6, color: '#4a3a26', alpha: 0.85, dry: 0.2 });
    for (let i = 0; i < 18; i++) {                       // 桥上的人：八百多个，这里只放得下十几个
      const t = b.r(0.02, 0.98);
      figurine(b, iw * (0.16 + t * 0.7), ih * 0.72 - Math.sin(t * Math.PI) * ih * 0.26 - 2, { s: 0.8 });
    }
    for (let i = 0; i < 8; i++) figurine(b, b.r(iw * 0.05, iw * 0.95), b.r(ih * 0.88, ih * 0.98), { s: 0.75, alpha: 0.7 });
    for (let k = 0; k < 4; k++) {                        // 岸上的店招
      const x = iw * (0.06 + k * 0.26), y = ih * 0.44;
      b.wash([[x, y], [x + 26, y - 4], [x + 26, y + 16], [x, y + 20]], { color: '#c8a870', alpha: 0.85, blur: 1, edge: 0.6 });
      b.ctx.fillStyle = 'rgba(50,38,26,0.8)'; b.ctx.font = `11px ${FONT_BRUSH}`; b.ctx.textAlign = 'center';
      b.ctx.fillText('酒饼绸茶'[k], x + 13, y + 13);
    }
  }, { bg: '#e4dbc0' });

  // ── 浊灵 ────────────────────────────────────────────────────────────────
  M.fadedScroll = (b, w, h) => {
    murk(b, w, h, { top: '#2a2620', bottom: '#7a6e56' });
    // 一幅正在褪的画：绢底只占中间一条，左边的人还看得清，越往右越淡，最右只剩一片空绢
    b.ctx.fillStyle = '#d4c8a8'; b.ctx.fillRect(w * 0.06, h * 0.3, w * 0.88, h * 0.5);
    b.ctx.strokeStyle = 'rgba(70,56,38,0.7)'; b.ctx.lineWidth = 3; b.ctx.strokeRect(w * 0.06, h * 0.3, w * 0.88, h * 0.5);
    for (let i = 0; i < 11; i++) {
      const t = i / 10, x = w * (0.13 + t * 0.76), y = h * (0.7 + (i % 2) * 0.05);
      figurine(b, x, y, { s: 1.15, alpha: Math.max(0.04, 0.92 - t * 0.95) });
    }
    // 右半边的绢在起雾，把还剩下的那点人影一并吃掉
    const g = b.ctx.createLinearGradient(w * 0.4, 0, w * 0.96, 0);
    g.addColorStop(0, 'rgba(214,202,172,0)'); g.addColorStop(1, 'rgba(222,212,186,0.95)');
    b.ctx.fillStyle = g; b.ctx.fillRect(w * 0.4, h * 0.3, w * 0.54, h * 0.5);
    b.wash(b.blob(w * 0.5, h * 0.42, 54, 34, { wob: 0.45 }), { color: INK, alpha: 0.6, blur: 8, edge: 0.05 });
    eye(b.ctx, w * 0.5 - 12, h * 0.4, 2.8, '#e8dcb0'); eye(b.ctx, w * 0.5 + 12, h * 0.4, 2.8, '#e8dcb0');
  };

  M.halfCi = (b, w, h) => {
    murk(b, w, h, { top: '#242c34', bottom: '#70808a' });
    b.wash([[w * 0.16, h * 0.12], [w * 0.84, h * 0.12], [w * 0.84, h * 0.94], [w * 0.16, h * 0.94]], { color: '#dcd6c2', alpha: 0.88, blur: 1.2, edge: 0.6, smooth: false });
    // 上半阕写满，下半阕空着——空的那一半才是这张牌的意思
    b.ctx.textAlign = 'center'; b.ctx.textBaseline = 'middle';
    const up = '醉里挑灯看剑梦回吹角连营';
    for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) {
      b.ctx.fillStyle = `rgba(40,34,26,${b.r(0.55, 0.85).toFixed(2)})`;
      b.ctx.font = `${h * 0.085}px ${FONT_BRUSH}`;
      b.ctx.fillText(up[(c * 3 + r) % up.length], w * (0.74 - c * 0.15), h * (0.22 + r * 0.11));
    }
    b.wash([[w * 0.18, h * 0.56], [w * 0.82, h * 0.56], [w * 0.82, h * 0.92], [w * 0.18, h * 0.92]], { color: '#1a1a18', alpha: 0.45, blur: 8, edge: 0.05 });
    b.stroke([[w * 0.2, h * 0.56], [w * 0.8, h * 0.555]], { w: 3, color: '#8a8272', alpha: 0.6, dry: 0.5 });
    eye(b.ctx, w * 0.5 - 12, h * 0.74, 2.8, '#b8ccd8'); eye(b.ctx, w * 0.5 + 12, h * 0.74, 2.8, '#b8ccd8');
  };

  M.lostChest = (b, w, h) => {
    murk(b, w, h, { top: '#2a2620', bottom: '#7a6c54' });
    chest(b, w * 0.3, h * 0.84, 34, { open: true });
    chest(b, w * 0.68, h * 0.9, 30, { open: true });
    chest(b, w * 0.55, h * 0.56, 26, { open: true, color: '#5a3e28' });
    for (let i = 0; i < 9; i++) {                        // 散在地上的几页，风一吹就没了
      const x = w * b.r(0.1, 0.9), y = h * b.r(0.62, 0.98);
      b.ctx.save(); b.ctx.translate(x, y); b.ctx.rotate(b.r(-0.5, 0.5));
      b.ctx.fillStyle = 'rgba(232,220,192,0.7)'; b.ctx.fillRect(-9, -12, 18, 24);
      b.ctx.restore();
    }
    eye(b.ctx, w * 0.55 - 11, h * 0.42, 2.6, '#d8c8a0'); eye(b.ctx, w * 0.55 + 11, h * 0.42, 2.6, '#d8c8a0');
  };

  // 首领：散箧巨影。一座由书箱垒起来的山，全是空的；底下是南渡的那条江。
  M.sanqie = (b, w, h) => {
    murk(b, w, h, { top: '#0e1620', bottom: '#4a4a50' });
    for (let r = 0; r < 4; r++) wave(b, -20, h * (0.84 + r * 0.05), w + 40, { n: 6, s: 1, color: '#3a5260' });
    const stack = [[0.5, 0.78, 40], [0.3, 0.64, 30], [0.7, 0.62, 32], [0.5, 0.48, 26], [0.38, 0.36, 20], [0.64, 0.34, 18]];
    for (const [x, y, s] of stack) chest(b, w * x, h * y, s, { open: b.R() < 0.7 });
    b.wash(b.blob(w * 0.5, h * 0.52, 78, 66, { wob: 0.4 }), { color: INK, alpha: 0.42, blur: 10, edge: 0.05 });
    for (let i = 0; i < 16; i++) {                       // 书页往上飘，飘出画外就不回来了
      const x = w * b.r(0.14, 0.86), y = h * b.r(0.06, 0.6);
      b.ctx.save(); b.ctx.translate(x, y); b.ctx.rotate(b.r(-0.8, 0.8));
      b.ctx.fillStyle = `rgba(226,216,190,${b.r(0.2, 0.6).toFixed(2)})`; b.ctx.fillRect(-8, -11, 16, 22);
      b.ctx.restore();
    }
    eye(b.ctx, w * 0.5 - 15, h * 0.48, 3.4, '#a8c4d8'); eye(b.ctx, w * 0.5 + 15, h * 0.48, 3.4, '#a8c4d8');
  };

  // 汴京的两张场景肖像：第一关的敌方主将和第二关的敌方主将
  M.shishengGhost = (b, w, h) => {
    murk(b, w, h, { top: '#2e2a22', bottom: '#8a7c60' });
    const arc = []; for (let t = 0; t <= 1.001; t += 0.06) arc.push([w * (0.08 + t * 0.84), h * 0.7 - Math.sin(t * Math.PI) * h * 0.24]);
    b.stroke(arc, { w: 8, color: '#4a3826', alpha: 0.75, dry: 0.3, taper: [0.08, 0.08] });
    b.wash(b.blob(w * 0.5, h * 0.62, 56, 44, { wob: 0.4 }), { color: INK, alpha: 0.8, blur: 5, edge: 0.2 });
    for (let i = 0; i < 10; i++) {                       // 还没走掉的那几个人，只剩轮廓
      const x = w * b.r(0.12, 0.88), y = h * b.r(0.74, 0.96);
      b.stroke([[x, y - 12], [x + b.r(-2, 2), y]], { w: 2.4, color: '#2a241c', alpha: b.r(0.15, 0.5), dry: 0.3, taper: [0.3, 0.3] });
    }
    eye(b.ctx, w * 0.5 - 11, h * 0.56, 2.8, '#e8d8a8'); eye(b.ctx, w * 0.5 + 11, h * 0.56, 2.8, '#e8d8a8');
  };

  M.peeledGreen = (b, w, h) => {
    murk(b, w, h, { top: '#1e2a2c', bottom: '#6a8078' });
    qinglv(b, w, h, { base: 0.5, amp: 0.3, alpha: 0.8 });
    for (let i = 0; i < 26; i++) {                       // 石青石绿一片片翘起来，底下的绢是灰的
      const x = w * b.r(0.06, 0.94), y = h * b.r(0.32, 0.86), s = b.r(6, 16);
      b.wash(b.blob(x, y, s, s * 0.8, { wob: 0.6 }), { color: '#8a8878', alpha: 0.75, blur: 1, edge: 0.45 });
    }
    b.wash(b.blob(w * 0.5, h * 0.58, 52, 42, { wob: 0.35 }), { color: '#16201e', alpha: 0.7, blur: 7, edge: 0.1 });
    eye(b.ctx, w * 0.5 - 11, h * 0.54, 2.8, '#9fdcc0'); eye(b.ctx, w * 0.5 + 11, h * 0.54, 2.8, '#9fdcc0');
  };

  return M;
}
