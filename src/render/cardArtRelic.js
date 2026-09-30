// 文物器物的卡面（cardsRelic.js 那十件）。构图沿用 cardArtGear 的 gearPiece：
// 素底 + 背光 + 台面，物体居中。区别在于这些画的是真东西，所以形体要对得上实物的
// 关键特征——神树是三层九枝，玉龙是没有角爪的 C 形，奔马是三足腾空一足踏鸟。
// 只抓这一个特征，剩下的照旧写意，别去描细节。
//
// 画幅 452×318，尺寸一律按 u = h/100 折算。
import { rgba } from './ink.js';
import { gearPiece, line, GEAR_PALETTE } from './cardArtGear.js';

const { GOLD, JADE, OCHRE } = GEAR_PALETTE;
const PATINA = '#6f8c7e';      // 出土青铜的锈色，比 BRONZE 更绿
const SILVER = '#a9aeb0';

export function relicMotifs({ sky }) {
  const M = {};
  const piece = gearPiece({ sky });

  // ── 青铜神树：三层九枝，每枝一鸟，顶端残缺 ──
  M['relic-tree'] = piece({ glow: JADE, shadow: 0.8, draw: (b, w, h, u) => {
    const cx = w * 0.5, base = 84 * u;
    b.wash([[cx - 16 * u, base], [cx + 16 * u, base], [cx + 11 * u, base - 9 * u], [cx - 11 * u, base - 9 * u]],
      { color: PATINA, alpha: 0.9, blur: 3, edge: 0.7 });                                   // 树座
    line(b, [cx, base - 8 * u], [cx, 14 * u], { w: 5 * u, color: PATINA, taper: [0.14, 0.3], dry: 0.22 });
    // 三层九枝：每层三根，左右交错向下弯，枝头各栖一鸟
    for (let lv = 0; lv < 3; lv++) {
      const y = 26 * u + lv * 20 * u, len = (26 + lv * 8) * u;
      for (const dir of [-1, 1, lv % 2 ? -1 : 1]) {
        const tipX = cx + dir * len * (dir === 1 ? 1 : 0.94), tipY = y + 13 * u;
        b.stroke([[cx, y], [cx + dir * len * 0.55, y - 4 * u], [tipX, tipY]],
          { w: 2.6 * u, color: PATINA, taper: [0.2, 0.5], dry: 0.3 });
        b.wash(b.blob(tipX, tipY - 3 * u, 4.2 * u, 3 * u, { wob: 0.4 }), { color: '#8fa890', alpha: 0.9, blur: 1.6, edge: 0.6 });   // 鸟身
        line(b, [tipX + dir * 2 * u, tipY - 4.5 * u], [tipX + dir * 7 * u, tipY - 8 * u], { w: 1.4 * u, color: '#8fa890', alpha: 0.8, taper: [0.2, 0.6], dry: 0.2 });   // 尾羽
      }
    }
    // 顶端那截是残的——上枝的鸟至今没找到，所以只留一道断口和一点光
    line(b, [cx, 18 * u], [cx + 3 * u, 11 * u], { w: 2.2 * u, color: PATINA, alpha: 0.5, taper: [0.3, 0.9], dry: 0.5 });
    const g = b.ctx.createRadialGradient(cx + 2 * u, 10 * u, 0, cx + 2 * u, 10 * u, 16 * u);
    g.addColorStop(0, rgba('#f4e8c0', 0.5)); g.addColorStop(1, rgba('#f4e8c0', 0));
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
  } });

  // ── 红山玉龙：C 形，吻部前突，没有角也没有爪 ──
  M['relic-jade-dragon'] = piece({ top: '#d8d2c0', glow: JADE, shadow: 0.7, draw: (b, w, h, u) => {
    const cx = w * 0.5, cy = 46 * u, r = 28 * u;
    // 身子是一整条 C：从吻部起顺时针绕到尾尖，缺口留在右上
    const pts = [];
    for (let t = -0.34; t <= 1.42; t += 0.055) {
      const a = t * Math.PI * 2 * 0.62 - Math.PI * 0.32;
      const rr = r * (1 - 0.06 * Math.sin(t * 4));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.04]);
    }
    b.stroke(pts, { w: 9.5 * u, color: '#46614e', taper: [0.5, 0.86], dry: 0.12 });
    b.stroke(pts.map(([x, y]) => [x - 1.6 * u, y - 1.8 * u]), { w: 3 * u, color: '#8fae8c', alpha: 0.45, taper: [0.5, 0.9], dry: 0 });   // 玉的高光
    // 吻部：向前突出的一截，玉龙最认得出来的地方
    const [hx, hy] = pts[0];
    b.wash([[hx - 3 * u, hy - 7 * u], [hx + 16 * u, hy - 12 * u], [hx + 20 * u, hy - 6 * u], [hx + 14 * u, hy - 1 * u], [hx - 2 * u, hy + 2 * u]],
      { color: '#46614e', alpha: 0.95, blur: 2, edge: 0.85 });
    b.wash(b.blob(hx + 4 * u, hy - 7 * u, 1.8 * u, 1.4 * u), { color: '#1e2a22', alpha: 0.9, blur: 0.6, edge: 0.7 });                    // 眼
    // 颈上那道长鬣，向后扬起
    b.stroke([[hx + 1 * u, hy - 10 * u], [hx - 14 * u, hy - 22 * u], [hx - 30 * u, hy - 26 * u]],
      { w: 5 * u, color: '#3d5545', taper: [0.3, 0.95], dry: 0.2 });
  } });

  // 青铜器身上别点两只对称的深色饕餮眼——在这个尺寸下，任何器物加两个眼睛都会立刻读成一张脸。
  // 纹样一律用横向的雷纹短线和竖向的扉棱来交代。
  const leiwen = (b, x0, x1, y, u, { rows = 2, color = '#44574c', alpha = 0.4 } = {}) => {
    for (let r = 0; r < rows; r++) for (let x = x0; x < x1 - 3 * u; x += 5 * u)
      line(b, [x, y + r * 4 * u], [x + 3 * u, y + r * 4 * u], { w: 1 * u, color, alpha, taper: [0.1, 0.1], dry: 0.35 });
  };

  // ── 何尊：侈口如喇叭、鼓腹、高圈足，四道扉棱通体而下 ──
  M['relic-zun'] = piece({ glow: GOLD, draw: (b, w, h, u) => {
    const cx = w * 0.5, top = 14 * u, bot = 86 * u;
    // 轮廓：口最阔 → 颈收 → 腹鼓 → 足微撇。三段叠加而不是分段直线——
    // 分段写过一版，转折处出现硬折角，整件东西读成一个纸袋。
    const half = (y) => {
      const t = (y - top) / (bot - top);
      const mouth = 12 * Math.max(0, 1 - t / 0.28) ** 1.4;                                  // 侈口
      const belly = 7 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.25) / 0.45)));    // 鼓腹
      const foot = 8 * Math.max(0, (t - 0.8) / 0.2) ** 1.3;                                 // 圈足
      return (20 + mouth + belly + foot) * u;
    };
    const L = [], R = [];
    for (let y = top; y <= bot; y += 2 * u) { L.push([cx - half(y), y]); R.push([cx + half(y), y]); }
    b.wash([...L, ...R.reverse()], { color: PATINA, alpha: 0.95, blur: 3, edge: 0.84 });
    b.wash(L.map(([x, y]) => [x + 2 * u, y]).concat(L.map(([x, y]) => [x + 9 * u, y]).reverse()),
      { color: '#9cb5a6', alpha: 0.32, blur: 6, edge: 0.25 });                                 // 左侧受光
    line(b, [cx - 30 * u, top], [cx + 30 * u, top], { w: 3.4 * u, color: '#586e63', sag: 1.6 * u, taper: [0.2, 0.2], dry: 0.1 });
    for (const dx of [-13, -4.5, 4.5, 13]) {                                                   // 四道扉棱，通体竖下来
      const x = cx + dx * u * 1.5;
      b.stroke([[x * 1, top + 12 * u], [x, top + 40 * u], [x, bot - 12 * u]],
        { w: 1.8 * u, color: '#4d6157', alpha: 0.55, taper: [0.3, 0.3], dry: 0.35 });
    }
    leiwen(b, cx - 22 * u, cx + 22 * u, top + 34 * u, u, { rows: 2 });                          // 腹上一圈雷纹
    // 铭文在内底，看不见，所以另起一方拓片摆在旁边——「宅兹中国」就是从这上面读出来的
    const px = w * 0.845, py = 30 * u;
    b.wash([[px - 13 * u, py], [px + 13 * u, py - 1 * u], [px + 14 * u, py + 40 * u], [px - 12 * u, py + 41 * u]],
      { color: '#efe7d2', alpha: 0.85, blur: 3, edge: 0.5 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++)
      line(b, [px - 8 * u + i * 8 * u, py + 8 * u + j * 8 * u], [px - 3 * u + i * 8 * u, py + 8 * u + j * 8 * u],
        { w: 1.3 * u, color: '#33403a', alpha: 0.6, taper: [0.1, 0.1], dry: 0.45 });
  } });

  // ── 后母戊鼎：长方腹、四条粗柱足、口沿上两只立耳。整张画就写一个「重」字 ──
  M['relic-ding'] = piece({ glow: OCHRE, shadow: 1.35, draw: (b, w, h, u) => {
    const cx = w * 0.5, top = 22 * u, bh = 38 * u, hw = 33 * u;
    for (const dir of [-1, 1]) {                                                               // 立耳：口沿上竖起来的方环
      const ex = cx + dir * 19 * u;
      b.wash([[ex - 5 * u, top + 1 * u], [ex + 5 * u, top + 1 * u], [ex + 5 * u, top - 15 * u], [ex - 5 * u, top - 15 * u]],
        { color: '#5e7368', alpha: 0.95, blur: 2, edge: 0.8 });
      b.wash([[ex - 2 * u, top - 1 * u], [ex + 2 * u, top - 1 * u], [ex + 2 * u, top - 11 * u], [ex - 2 * u, top - 11 * u]],
        { color: '#e3dcc8', alpha: 0.75, blur: 1.6, edge: 0.6 });                              // 耳上的孔，透出底色才看得出是个环
    }
    // 方腹：blur 压小、edge 拉高，四个角才是角。糊掉了就成了一口圆锅
    b.wash([[cx - hw, top], [cx + hw, top], [cx + hw - 3 * u, top + bh], [cx - hw + 3 * u, top + bh]],
      { color: PATINA, alpha: 0.96, blur: 1.2, edge: 0.95 });
    b.wash([[cx - hw, top], [cx + hw, top], [cx + hw - 1 * u, top + 7 * u], [cx - hw + 1 * u, top + 7 * u]],
      { color: '#9cb5a6', alpha: 0.5, blur: 3, edge: 0.4 });                                   // 口沿受光
    leiwen(b, cx - 27 * u, cx + 27 * u, top + 14 * u, u, { rows: 2 });
    for (const dx of [-26, -9, 9, 26]) {                                                       // 四道扉棱
      const x = cx + dx * u;
      b.stroke([[x, top + 4 * u], [x, top + bh * 0.55], [x, top + bh - 2 * u]],
        { w: 2 * u, color: '#4d6157', alpha: 0.5, taper: [0.25, 0.25], dry: 0.3 });
    }
    // 四条柱足：后两条淡、前两条实，靠这个交代进深。足要粗且不收尖，鼎才压得住
    for (const [dx, a, wd] of [[-20, 0.45, 8], [18, 0.45, 8], [-26, 1, 10], [24, 1, 10]]) {
      const x = cx + dx * u;
      b.stroke([[x, top + bh - 4 * u], [x + 0.8 * u, top + bh + 11 * u], [x + 1.2 * u, top + bh + 25 * u]],
        { w: wd * u, color: '#56695f', alpha: a, taper: [0.04, 0.06], dry: 0.22 });
    }
  } });

  // ── 曾侯乙编钟：三层横梁，一排排甬钟由大到小垂下 ──
  M['relic-bells'] = piece({ glow: GOLD, shadow: 0, draw: (b, w, h, u) => {
    const x0 = w * 0.1, x1 = w * 0.9;
    for (const dir of [-1, 1]) line(b, [dir < 0 ? x0 : x1, 16 * u], [dir < 0 ? x0 + 3 * u : x1 - 3 * u, 88 * u],
      { w: 5 * u, color: '#4a3324', taper: [0.15, 0.1], dry: 0.2 });                          // 立柱
    for (let lv = 0; lv < 3; lv++) {
      const y = 22 * u + lv * 24 * u, n = 5 + lv, sc = 1 - lv * 0.18;
      line(b, [x0, y], [x1, y], { w: 3.4 * u, color: '#5a3f2a', sag: 0.8 * u, taper: [0.15, 0.15], dry: 0.15 });
      for (let i = 0; i < n; i++) {
        const bx = x0 + 14 * u + (x1 - x0 - 26 * u) * (i / (n - 1)), bw = (8 - lv * 1.2) * u, bhh = (17 - lv * 3) * u;
        b.wash([[bx - bw, y + 2 * u], [bx + bw, y + 2 * u], [bx + bw * 0.82, y + bhh], [bx, y + bhh + 2.2 * u], [bx - bw * 0.82, y + bhh]],
          { color: PATINA, alpha: 0.94, blur: 1.8, edge: 0.82 });                             // 钟体：合瓦形，下口内凹
        b.wash([[bx - bw * 0.55, y + 4 * u], [bx - bw * 0.1, y + 4 * u], [bx - bw * 0.12, y + bhh * 0.8], [bx - bw * 0.5, y + bhh * 0.8]],
          { color: '#9cb3a4', alpha: 0.35 * sc, blur: 2, edge: 0.3 });                        // 高光
        line(b, [bx, y - 4 * u], [bx, y + 2.5 * u], { w: 2 * u, color: '#5e7368', taper: [0.3, 0.1], dry: 0.1 });   // 甬
      }
    }
  } });

  // ── 越王勾践剑：剑身竖立，菱形暗格纹，格上嵌琉璃 ──
  M['relic-sword'] = piece({ top: '#d6d2c8', glow: '#7a8f94', draw: (b, w, h, u) => {
    const cx = w * 0.5;
    b.stroke([[cx, 8 * u], [cx - 0.5 * u, 32 * u], [cx, 56 * u]], { w: 8.5 * u, color: '#5b666e', taper: [0.7, 0.04], dry: 0.12 });
    b.stroke([[cx - 1.2 * u, 15 * u], [cx - 1.4 * u, 34 * u], [cx - 1.2 * u, 54 * u]],
      { w: 2 * u, color: '#f2f8fb', alpha: 0.7, taper: [0.5, 0.2], dry: 0 });                  // 出土时几乎不见锈，所以刃口要亮
    for (let i = 0; i < 7; i++) {                                                              // 菱形暗格纹
      const y = 16 * u + i * 5.4 * u, r = 2.4 * u;
      b.stroke([[cx - r, y], [cx, y - r * 0.8], [cx + r, y], [cx, y + r * 0.8], [cx - r, y]],
        { w: 0.9 * u, color: '#2f3b42', alpha: 0.5, taper: [0.1, 0.1], dry: 0.3 });
    }
    line(b, [cx - 13 * u, 58 * u], [cx + 13 * u, 58 * u], { w: 4.5 * u, color: '#6b6040', taper: [0.2, 0.2], dry: 0.15 });       // 剑格
    for (const dir of [-1, 1]) b.wash(b.blob(cx + dir * 7 * u, 58 * u, 2.2 * u, 1.8 * u), { color: '#2a5f8a', alpha: 0.85, blur: 1, edge: 0.6 });   // 嵌的蓝琉璃
    line(b, [cx, 61 * u], [cx, 80 * u], { w: 5.5 * u, color: '#4a3a26', taper: [0.1, 0.2], dry: 0.2 });                          // 茎
    b.wash(b.blob(cx, 84 * u, 7 * u, 2.6 * u), { color: '#6b6040', alpha: 0.9, blur: 1.4, edge: 0.6 });                          // 首
  } });

  // ── 铜奔马：侧身向右疾驰，三足腾空，右后蹄踏在一只飞鸟背上 ──
  // 侧影必须一眼是马：胸深、颈拱、头小、四腿细长且各朝不同方向，尾巴平着飘。
  M['relic-horse'] = piece({ glow: '#b8863c', shadow: 0, draw: (b, w, h, u) => {
    const cx = w * 0.44, by = 44 * u;                                 // by = 躯干中线
    const HIDE = '#7d6134', DARK = '#5c4523';
    const P = (x, y) => [cx + x * u, by + y * u];
    // 躯干 + 颈 + 头画成一条闭合的侧影。分件画过一版，结果几块 wash 拼出来像只甲虫——
    // 马之所以是马，全在这一条从吻到臀的外轮廓上，拆开就没了。
    b.wash([P(53, -30), P(47, -37), P(38, -38), P(26, -26), P(14, -13), P(0, -12), P(-16, -14),
      P(-27, -9), P(-29, 1), P(-18, 8), P(0, 11), P(14, 10), P(24, 3), P(31, -11), P(41, -24)],
      { color: HIDE, alpha: 0.96, blur: 2, edge: 0.88 });
    b.wash([P(-14, -10), P(8, -9), P(6, -4), P(-16, -5)], { color: '#a88a52', alpha: 0.24, blur: 5, edge: 0.2 });   // 背上受光
    b.wash(b.blob(cx + 45 * u, by - 32 * u, 1.6 * u, 1.3 * u), { color: '#2d2214', alpha: 0.8, blur: 0.6, edge: 0.6 });   // 眼
    b.stroke([P(39, -37), P(40, -42), P(41, -44)], { w: 2 * u, color: DARK, taper: [0.3, 0.6], dry: 0.2 });               // 耳
    b.stroke([P(34, -33), P(22, -27), P(12, -16)], { w: 4 * u, color: DARK, alpha: 0.88, taper: [0.25, 0.85], dry: 0.4 }); // 鬃，向后倒
    b.stroke([P(-28, -7), P(-43, -13), P(-60, -9)], { w: 5 * u, color: DARK, alpha: 0.92, taper: [0.15, 0.92], dry: 0.4 }); // 尾，平着甩出去
    // 四条腿都从腹线下方出来，各朝各的方向——前抛、后蹬、一条落下去踏鸟
    const leg = (x0, y0, x1, y1, x2, y2, a = 1, wd = 5) =>
      b.stroke([P(x0, y0), P(x1, y1), P(x2, y2)], { w: wd * u, color: HIDE, alpha: a, taper: [0.16, 0.62], dry: 0.2 });
    leg(17, 9, 31, 17, 45, 14, 0.95);          // 右前，抛在最前
    leg(11, 10, 20, 22, 31, 28, 0.66, 4.2);    // 左前，稍后一点
    leg(-20, 7, -35, 16, -48, 12, 0.66, 4.2);  // 左后，向后蹬
    const fy = 80 * u;
    b.stroke([P(-12, 9), P(-8, 22), [cx - 4 * u, fy - 4 * u]],
      { w: 5.4 * u, color: HIDE, taper: [0.14, 0.34], dry: 0.18 });                            // 右后，一路落到鸟背
    // 飞鸟：一个小小的横身加两片后掠的翅膀，整匹马的重量都压在这一点上
    b.wash(b.blob(cx - 4 * u, fy, 10 * u, 2.6 * u, { wob: 0.25 }), { color: '#8a7040', alpha: 0.95, blur: 1.6, edge: 0.72 });
    for (const dir of [-1, 1]) b.stroke([[cx - 4 * u, fy - 1 * u], [cx - 4 * u + dir * 13 * u, fy - 6 * u], [cx - 4 * u + dir * 26 * u, fy - 4 * u]],
      { w: 2.4 * u, color: '#8a7040', alpha: 0.85, taper: [0.2, 0.88], dry: 0.3 });
    b.wash(b.blob(cx - 14 * u, fy - 1 * u, 3 * u, 2 * u), { color: '#8a7040', alpha: 0.95, blur: 1, edge: 0.6 });   // 鸟头
  } });

  // ── 长信宫灯：宫女跪坐，右臂高举成灯罩与烟道 ──
  M['relic-lamp'] = piece({ glow: '#d8a34a', shadow: 0.9, draw: (b, w, h, u) => {
    const cx = w * 0.48, base = 84 * u;
    b.wash([[cx - 20 * u, base], [cx + 18 * u, base], [cx + 12 * u, base - 22 * u], [cx - 14 * u, base - 24 * u]],
      { color: '#7d6a3e', alpha: 0.95, blur: 3, edge: 0.78 });                                 // 跪坐的下裳
    b.wash([[cx - 13 * u, base - 22 * u], [cx + 11 * u, base - 24 * u], [cx + 8 * u, base - 46 * u], [cx - 10 * u, base - 45 * u]],
      { color: '#8a7442', alpha: 0.95, blur: 2.4, edge: 0.8 });                                // 上身
    b.wash(b.blob(cx - 1 * u, base - 52 * u, 7 * u, 8 * u, { wob: 0.2 }), { color: '#8a7442', alpha: 0.96, blur: 1.6, edge: 0.75 });   // 头
    b.wash(b.blob(cx - 1 * u, base - 59 * u, 7.5 * u, 3.6 * u, { wob: 0.3 }), { color: '#5e4c28', alpha: 0.9, blur: 1.4, edge: 0.6 }); // 巾帼
    // 右臂：举过头顶，袖子就是烟道，烟从这里沉进体腔
    b.stroke([[cx + 6 * u, base - 46 * u], [cx + 16 * u, base - 62 * u], [cx + 14 * u, base - 74 * u]],
      { w: 6.5 * u, color: '#8a7442', taper: [0.2, 0.2], dry: 0.2 });
    line(b, [cx - 9 * u, base - 44 * u], [cx - 2 * u, base - 30 * u], { w: 5.5 * u, color: '#8a7442', taper: [0.2, 0.3], dry: 0.2 });  // 左臂扶灯
    // 灯盘与灯罩，中间那点火是整张画唯一的暖色
    b.wash(b.blob(cx + 4 * u, base - 76 * u, 15 * u, 4.4 * u, { wob: 0.2 }), { color: '#7d6a3e', alpha: 0.95, blur: 1.8, edge: 0.7 });
    b.stroke([[cx - 8 * u, base - 77 * u], [cx - 7 * u, base - 87 * u], [cx + 2 * u, base - 90 * u]],
      { w: 3 * u, color: '#6e5c32', taper: [0.2, 0.3], dry: 0.25 });
    const g = b.ctx.createRadialGradient(cx + 3 * u, base - 80 * u, 0, cx + 3 * u, base - 80 * u, 26 * u);
    g.addColorStop(0, rgba('#ffd98a', 0.85)); g.addColorStop(0.4, rgba('#f0a63c', 0.3)); g.addColorStop(1, rgba('#f0a63c', 0));
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);
  } });

  // ── 素纱襌衣：一件几乎看不见的衣服，重点是「轻」 ──
  M['relic-silk'] = piece({ top: '#e4ddcd', bottom: '#f4eee0', glow: '#d8cfb4', shadow: 0, draw: (b, w, h, u) => {
    const cx = w * 0.5, top = 18 * u;
    // 衣身：还是要看得见一件衣服的形，只是薄到能透出背后的底色。
    // 先铺一层略深的，再压一层亮的，边缘留虚——「轻」靠对比度低，不靠干脆不画。
    const robe = [[cx - 16 * u, top], [cx + 16 * u, top], [cx + 21 * u, top + 14 * u], [cx + 30 * u, top + 62 * u],
      [cx + 15 * u, top + 66 * u], [cx - 15 * u, top + 66 * u], [cx - 30 * u, top + 62 * u], [cx - 21 * u, top + 14 * u]];
    b.wash(robe, { color: '#b9ae93', alpha: 0.4, blur: 5, edge: 0.4 });
    b.wash(robe.map(([x, y]) => [cx + (x - cx) * 0.9, y + 2 * u]), { color: '#fbf8ef', alpha: 0.6, blur: 6, edge: 0.2 });
    // 通袖：190 厘米，向两侧平伸出画外，末端散成雾
    for (const dir of [-1, 1]) {
      const sleeve = [[cx + dir * 18 * u, top + 9 * u], [cx + dir * 66 * u, top + 16 * u],
        [cx + dir * 68 * u, top + 31 * u], [cx + dir * 19 * u, top + 31 * u]];
      b.wash(sleeve, { color: '#b9ae93', alpha: 0.3, blur: 7, edge: 0.22 });
      b.wash(sleeve.map(([x, y]) => [x, y + 2 * u]), { color: '#fbf8ef', alpha: 0.45, blur: 8, edge: 0.12 });
      b.stroke([[cx + dir * 18 * u, top + 9 * u], [cx + dir * 44 * u, top + 13 * u], [cx + dir * 66 * u, top + 16 * u]],
        { w: 1.4 * u, color: '#9d9077', alpha: 0.65, taper: [0.15, 0.85], dry: 0.35 });        // 袖的上缘
      b.stroke([[cx + dir * 19 * u, top + 31 * u], [cx + dir * 45 * u, top + 33 * u], [cx + dir * 67 * u, top + 31 * u]],
        { w: 1.2 * u, color: '#9d9077', alpha: 0.5, taper: [0.15, 0.85], dry: 0.4 });          // 下缘
    }
    // 交领与下摆：三笔就够，是这三笔让它成为一件衣服而不是一团雾
    line(b, [cx - 14 * u, top + 1 * u], [cx + 1 * u, top + 26 * u], { w: 2 * u, color: '#8e8269', alpha: 0.7, taper: [0.15, 0.4], dry: 0.3 });
    line(b, [cx + 14 * u, top + 1 * u], [cx - 1 * u, top + 26 * u], { w: 2 * u, color: '#8e8269', alpha: 0.7, taper: [0.15, 0.4], dry: 0.3 });
    b.stroke([[cx - 29 * u, top + 62 * u], [cx, top + 67 * u], [cx + 29 * u, top + 62 * u]],
      { w: 1.6 * u, color: '#9d9077', alpha: 0.55, taper: [0.25, 0.25], dry: 0.35 });
    b.mist(w, h, h * 0.78, { alpha: 0.4, n: 4 });                                              // 四十九克，底下还得是一团雾
  } });

  // ── 银香囊：镂空银球 + 剖面里那只永远水平的小碗 ──
  M['relic-censer'] = piece({ top: '#dcd8cc', glow: '#b8bcbe', draw: (b, w, h, u) => {
    const cx = w * 0.5, cy = 48 * u, R = 27 * u;
    const ball = [];
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 22) ball.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    b.wash(ball, { color: SILVER, alpha: 0.9, blur: 2.6, edge: 0.7 });
    b.wash(ball.map(([x, y]) => [x - 3 * u, y - 4 * u]), { color: '#e8ecee', alpha: 0.3, blur: 5, edge: 0.25 });
    // 镂空的葡萄花鸟纹：不画纹样，打一圈孔就够了
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) for (const rr of [0.4, 0.72]) {
      const x = cx + Math.cos(a) * R * rr, y = cy + Math.sin(a) * R * rr;
      b.wash(b.blob(x, y, 2.6 * u, 2.2 * u, { wob: 0.4 }), { color: '#3c4246', alpha: 0.5, blur: 1.4, edge: 0.4 });
    }
    // 两层同心环 + 小碗：无论球怎么滚，碗口始终朝上，这是常平架
    for (const rr of [0.62, 0.42]) {
      const ring = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 20) ring.push([cx + Math.cos(a) * R * rr, cy + Math.sin(a) * R * rr * 0.9]);
      b.stroke([...ring, ring[0]], { w: 1.4 * u, color: '#8d9295', alpha: 0.85, taper: [0.1, 0.1], dry: 0.1 });
    }
    b.wash([[cx - 7 * u, cy + 2 * u], [cx + 7 * u, cy + 2 * u], [cx + 5 * u, cy + 9 * u], [cx - 5 * u, cy + 9 * u]],
      { color: '#6f7578', alpha: 0.95, blur: 1.4, edge: 0.7 });
    const g = b.ctx.createRadialGradient(cx, cy + 2 * u, 0, cx, cy + 2 * u, 14 * u);
    g.addColorStop(0, rgba('#ffd08a', 0.6)); g.addColorStop(1, rgba('#ffd08a', 0));
    b.ctx.fillStyle = g; b.ctx.fillRect(0, 0, w, h);                                           // 碗里那点香
    line(b, [cx, cy - R], [cx, 12 * u], { w: 1.6 * u, color: '#8d9295', taper: [0.2, 0.3], dry: 0.2 });                   // 挂链
    b.wash(b.blob(cx, 10 * u, 4 * u, 2.4 * u), { color: SILVER, alpha: 0.9, blur: 1.2, edge: 0.6 });
  } });

  return M;
}
