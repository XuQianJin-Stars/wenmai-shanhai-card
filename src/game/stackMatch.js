// 叠牌：点开没被压住的牌，放进七格槽。槽里同名凑满三张就消掉。槽满七张仍消不掉即负。
// 牌面是按「每次都能拿走三张露在外面的牌」倒推出来的，所以每一局都解得开。
import { mulberry32 } from '../rules/rng.js';

const POOL = [
  'LJ-001', 'LJ-002', 'LJ-003', 'LJ-004', 'LJ-005', 'LJ-006', 'LJ-007', 'LJ-008',
  'LJ-009', 'LJ-010', 'LJ-054', 'LJ-063', 'LJ-084', 'LJ-090', 'LJ-099', 'WM-001',
];
const TILE_W = 70;
const TILE_H = 98;
const SX = TILE_W + 8;
const SY = TILE_H + 8;

export const STACK_REWARD = { easy: 4, normal: 8, hard: 12 };

function layer(cols, rows, z, ox, oy) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push({ x: ox + c * SX, y: oy + r * SY, z, w: TILE_W, h: TILE_H });
  }
  return out;
}

/** 上层比下层少两列两行，居中压在接缝上，边缘仍露得出。 */
function piled(cols, rows, z, baseCols, baseRows) {
  const ox = (baseCols - cols) * SX / 2;
  const oy = (baseRows - rows) * SY / 2;
  return layer(cols, rows, z, ox, oy);
}
// 入门三层、寻常五层、宗师八层。张数都是 3 的倍数。
const LAYOUT = {
  easy: [...piled(6, 3, 0, 6, 3), ...piled(4, 2, 1, 6, 3), ...piled(2, 2, 2, 6, 3)],
  normal: [...piled(6, 3, 0, 6, 3), ...piled(5, 2, 1, 6, 3), ...piled(4, 2, 2, 6, 3), ...piled(3, 2, 3, 6, 3), ...piled(1, 3, 4, 6, 3)],
  hard: [...piled(9, 3, 0, 9, 3), ...piled(7, 2, 1, 9, 3), ...piled(6, 2, 2, 9, 3), ...piled(5, 2, 3, 9, 3), ...piled(4, 2, 4, 9, 3), ...piled(3, 2, 5, 9, 3), ...piled(2, 2, 6, 9, 3), ...piled(1, 3, 7, 9, 3)],
};
const TYPES = { easy: 6, normal: 9, hard: 14 };
export const STACK_LAYERS = { easy: 3, normal: 5, hard: 8 };
export const STACK_LAYER_NAME = { easy: '三层', normal: '五层', hard: '八层' };

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** 更高一层的牌压住了这一张，就不能点。 */
export function covered(tile, tiles) {
  return tiles.some((o) => o !== tile && !o.out && o.z > tile.z && overlaps(o, tile));
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tryBuild(level, seed) {
  const rng = mulberry32(seed);
  const alive = LAYOUT[level].map((p) => ({ ...p, gone: false }));
  const groups = [];
  while (alive.some((t) => !t.gone)) {
    const free = alive.filter((t) => !t.gone && !alive.some((o) => o !== t && !o.gone && o.z > t.z && overlaps(o, t)));
    if (free.length < 3) return null;
    const pool = [...free];
    const pick = [];
    for (let i = 0; i < 3; i++) pick.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    pick.forEach((t) => { t.gone = true; });
    groups.push(pick);
  }
  const types = shuffle(rng, POOL).slice(0, TYPES[level]);
  groups.forEach((g, i) => {
    const cardId = types[i % types.length];
    g.forEach((t) => { t.cardId = cardId; });
  });
  return alive.map(({ gone, ...t }, i) => ({ ...t, uid: `${level}-${seed}-${i}`, out: false }));
}

/** 生成一局。level 为 easy | normal | hard。 */
export function createBoard(level, seed = 1) {
  for (let k = 0; k < 40; k++) {
    const board = tryBuild(level, (seed + k * 97) >>> 0);
    if (board) return board;
  }
  const rng = mulberry32(seed || 1);
  const types = shuffle(rng, POOL).slice(0, TYPES.easy);
  return layer(6, 4, 0, 0, 0).map((p, i) => ({ ...p, uid: `flat-${i}`, cardId: types[Math.floor(i / 3) % types.length], out: false }));
}

function clearTriples(slot, tiles) {
  const by = new Map();
  for (const uid of slot) {
    const id = tiles.find((t) => t.uid === uid).cardId;
    if (!by.has(id)) by.set(id, []);
    by.get(id).push(uid);
  }
  const drop = new Set();
  for (const ids of by.values()) ids.slice(0, Math.floor(ids.length / 3) * 3).forEach((uid) => drop.add(uid));
  return { slot: slot.filter((uid) => !drop.has(uid)), cleared: drop };
}

/**
 * 把叠牌铺进已经建好的画面。
 * api: { h, audio, save, faceEl, scheduleFacePaint, toast }
 */
export function mountStackMatch(body, api) {
  const { h, audio, save, faceEl, scheduleFacePaint, toast } = api;
  let level = 'normal';
  let tiles = [];
  let slot = [];
  let undos = 5;
  let shuffles = 1;
  let history = [];
  let over = null;
  let lock = false;
  let popTimer = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const faces = new Map();
  let placeGen = 0;

  const bar = h('div.stack-bar');
  const board = h('div.stack-board');
  const tray = h('div.stack-slot');
  const end = h('div.stack-end');
  body.append(h('div.stack-match', bar, board, tray), end);

  function faceFor(tile, w) {
    const prev = faces.get(tile.uid);
    if (prev && prev.dataset.cardId === tile.cardId) return prev;
    const c = faceEl(tile.cardId, 0, { w, defer: true });
    scheduleFacePaint(c, tile.cardId, 0);
    faces.set(tile.uid, c);
    return c;
  }

  function snap() {
    return { out: tiles.map((t) => t.out), slot: [...slot], ids: tiles.map((t) => t.cardId) };
  }
  function restore(s) {
    tiles.forEach((t, i) => { t.out = s.out[i]; t.cardId = s.ids[i]; });
    slot = [...s.slot];
  }

  function deal() {
    clearTimeout(popTimer);
    lock = false;
    tiles = createBoard(level, (Date.now() ^ (Math.random() * 1e9)) >>> 0);
    slot = [];
    undos = 5;
    shuffles = 1;
    history = [];
    over = null;
    faces.clear();
    end.replaceChildren();
    draw();
  }

  function finish(won) {
    if (over) return;
    over = won ? 'win' : 'lose';
    if (won) {
      const n = STACK_REWARD[level];
      save.data.fragments += n;
      save.write();
      audio.sfx('victory');
    } else audio.sfx('error');
    const canUndo = !won && undos > 0 && history.length > 0;
    end.append(h('div.stack-end-card',
      h('div.stack-end-t', { text: won ? '卷尽' : '槽满' }),
      h('p', { text: won ? `三张相同的都消完了。文脉碎片 +${STACK_REWARD[level]}` : canUndo ? '七格都占满了，相同的三张凑不齐。可以撤回上一步。' : '七格都占满了，撤回也已经用完。这一局只能重开。' }),
      h('div.stack-end-btns',
        canUndo ? h('button.btn', { text: '撤回', onclick: () => { audio.sfx('click'); undo(); } }) : null,
        h('button.btn.primary', { text: '再来一局', onclick: () => { audio.sfx('click'); deal(); } }),
      )));
  }

  function settle() {
    const left = tiles.some((t) => !t.out);
    if (!left && slot.length === 0) finish(true);
    else if (slot.length >= 7) finish(false);
    draw();
  }

  function play(tile) {
    if (over || lock || tile.out || covered(tile, tiles)) { audio.sfx('error'); return; }
    if (slot.length >= 7) return;
    history.push(snap());
    if (history.length > 30) history.shift();
    tile.out = true;
    slot.push(tile.uid);
    const next = clearTriples(slot, tiles);
    audio.sfx('pick');
    if (!next.cleared.size) {
      settle();
      return;
    }
    lock = true;
    audio.sfx('match');
    draw({ pop: next.cleared });
    popTimer = setTimeout(() => {
      slot = next.slot;
      lock = false;
      settle();
    }, reduceMotion ? 0 : 460);
  }

  function undo() {
    if (undos <= 0 || !history.length) {
      audio.sfx('error');
      toast?.('撤回已经用完');
      return;
    }
    clearTimeout(popTimer);
    lock = false;
    if (over === 'lose') { over = null; end.replaceChildren(); }
    if (over) { audio.sfx('error'); return; }
    undos--;
    restore(history.pop());
    audio.sfx('back');
    draw();
  }

  function shuffleLeft() {
    if (over || lock || shuffles <= 0) { audio.sfx('error'); return; }
    const left = tiles.filter((t) => !t.out);
    if (left.length < 2) return;
    shuffles--;
    history.push(snap());
    const rng = mulberry32((Math.random() * 1e9) >>> 0);
    const ids = shuffle(rng, left.map((t) => t.cardId));
    left.forEach((t, i) => { t.cardId = ids[i]; });
    audio.sfx('click');
    draw();
  }

  function draw({ pop = null } = {}) {
    const reward = STACK_REWARD[level];
    bar.replaceChildren(
      h('div.seg', [['easy', '入门'], ['normal', '寻常'], ['hard', '宗师']].map(([k, t]) =>
        h('button' + (k === level ? '.on' : ''), { text: t, onclick: () => { if (k === level) return; audio.sfx('click'); level = k; deal(); } }))),
      h('span.dim', { text: `${STACK_LAYER_NAME[level]} · 场上 ${tiles.filter((t) => !t.out).length} · 过关 +${reward} 碎片` }),
      h('button.btn.small', { text: `撤回 ${undos}`, onclick: undo }),
      h('button.btn.small', { text: `洗牌 ${shuffles}`, onclick: shuffleLeft }),
    );
    const maxX = Math.max(...tiles.map((t) => t.x + t.w));
    const maxY = Math.max(...tiles.map((t) => t.y + t.h));
    const gen = ++placeGen;
    board.replaceChildren();
    const place = () => {
      if (gen !== placeGen) return;
      if (board.clientWidth < 8 || board.clientHeight < 8) { requestAnimationFrame(place); return; }
      board.replaceChildren();
      const s = Math.min(board.clientWidth / maxX, board.clientHeight / maxY);
      const ox = Math.max(0, (board.clientWidth - maxX * s) / 2);
      const oy = Math.max(0, (board.clientHeight - maxY * s) / 2);
      for (const t of [...tiles].filter((t) => !t.out).sort((a, b) => a.z - b.z)) {
        const block = covered(t, tiles);
        const btn = h('button.stack-tile' + (block ? '.covered' : ''), {
          style: { left: `${ox + t.x * s}px`, top: `${oy + t.y * s}px`, width: `${t.w * s}px`, height: `${t.h * s}px`, zIndex: String(t.z + 1) },
          onclick: () => play(t),
        }, faceFor(t, Math.max(48, Math.round(t.w * s))));
        board.append(btn);
      }
    };
    requestAnimationFrame(place);
    tray.replaceChildren();
    for (let i = 0; i < 7; i++) {
      const uid = slot[i];
      const popping = uid && pop?.has(uid);
      const cell = h('div.stack-cell' + (uid ? '.on' : '') + (popping ? '.pop' : ''));
      if (uid) cell.append(faceFor(tiles.find((t) => t.uid === uid), 48));
      tray.append(cell);
    }
    if (pop?.size) tray.append(h('div.stack-burst', { text: '消' }, h('i'), h('i'), h('i')));
  }

  deal();
}
