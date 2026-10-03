// 卡牌战棋。备战席买灵将，布在己方半场，三张同名同阶合成上一阶，开战双方自己打。
// 只动灵将的攻防气血和五行相克，不把对战里的技能整套搬进来。
import { CARDS, card, COUNTERS, BONDS } from '../data/cards.js';
import { mulberry32 } from '../rules/rng.js';

export const COLS = 7;
export const ROWS = 4;
export const BENCH = 8;
export const SHOP_N = 5;
export const ROUNDS = 8;
export const PLAYER_HP = 24;
export const REROLL_COST = 2;
const STAR_MAX = 3;

export const ENEMY_POOL = [
  'LJ-001', 'LJ-003', 'LJ-004', 'LJ-007', 'LJ-008', 'LJ-009', 'LJ-010',
  'LJ-013', 'LJ-054', 'LJ-063', 'LJ-090', 'LJ-099',
];

export const boardCap = (round) => Math.min(6, 2 + round);
export const isPlayerCell = (i) => i >= COLS * 2 && i < COLS * ROWS;
export const pieceCost = (id) => card(id).cost ?? 1;
export const sellValue = (p) => pieceCost(p.id) + p.star - 1;

export function generalPool(owned) {
  const ids = (owned ?? []).filter((id) => CARDS[id]?.type === 'general' && !CARDS[id].zhuo);
  return ids.length ? ids : ['LJ-007', 'LJ-008', 'LJ-009', 'LJ-006'];
}

/** 场上同一羁绊的人数。2/3/4 人分别给 +1/+2/+3 攻击，防御吃一半。 */
export function bondBonus(pieces) {
  const counts = {};
  for (const p of pieces) for (const b of new Set(card(p.id).bonds ?? [])) counts[b] = (counts[b] ?? 0) + 1;
  const bonusOf = (id) => {
    let best = 0;
    for (const b of card(id).bonds ?? []) {
      const n = counts[b] ?? 0;
      const v = n >= 4 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0;
      if (v > best) best = v;
    }
    return best;
  };
  const active = Object.entries(counts).filter(([, n]) => n >= 2).map(([k, n]) => ({ k, n, name: BONDS[k]?.name ?? k }));
  return { counts, bonusOf, active };
}

export function pieceStats(id, star, bonus = 0) {
  const c = card(id);
  return {
    hp: (c.hp ?? 6) + (star - 1) * 4,
    atk: (c.atk ?? 3) + (star - 1) * 2 + bonus,
    def: (c.def ?? 1) + (star - 1) + Math.floor(bonus / 2),
    el: c.el,
  };
}

export function strikeDamage(atk, def, atkEl, defEl) {
  let dmg = Math.max(1, atk - def);
  if (COUNTERS[atkEl] === defEl) dmg = Math.ceil(dmg * 1.3);
  return dmg;
}

function rollShop(state, rng) {
  const shop = [];
  for (let i = 0; i < SHOP_N; i++) {
    const id = state.pool[Math.floor(rng() * state.pool.length)];
    shop.push({ uid: state.seq++, id, star: 1 });
  }
  return shop;
}

export function createMatch(pool, seed = 1) {
  const rng = mulberry32(seed >>> 0);
  const state = {
    round: 1,
    hp: PLAYER_HP,
    gold: 8,
    cap: boardCap(1),
    pool: pool.length ? [...pool] : generalPool([]),
    shop: [],
    bench: Array(BENCH).fill(null),
    board: Array(COLS * ROWS).fill(null),
    over: null,
    seq: 1,
    rng,
  };
  state.shop = rollShop(state, rng);
  return state;
}

function peek(state, loc) {
  return loc.zone === 'board' ? state.board[loc.i] : state.bench[loc.i];
}
function put(state, loc, piece) {
  if (loc.zone === 'board') state.board[loc.i] = piece;
  else state.bench[loc.i] = piece;
}

function merge(state) {
  let merged = false;
  for (;;) {
    const locs = [];
    state.board.forEach((p, i) => { if (p) locs.push({ zone: 'board', i, p }); });
    state.bench.forEach((p, i) => { if (p) locs.push({ zone: 'bench', i, p }); });
    const groups = new Map();
    for (const loc of locs) {
      if (loc.p.star >= STAR_MAX) continue;
      const k = `${loc.p.id}#${loc.p.star}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(loc);
    }
    const hit = [...groups.values()].find((g) => g.length >= 3);
    if (!hit) break;
    const take = hit.slice(0, 3);
    const born = { uid: state.seq++, id: take[0].p.id, star: take[0].p.star + 1 };
    for (const loc of take) put(state, loc, null);
    const home = take.find((l) => l.zone === 'board' && isPlayerCell(l.i));
    if (home) put(state, home, born);
    else {
      const b = state.bench.findIndex((x) => !x);
      if (b >= 0) state.bench[b] = born;
      else {
        const c = state.board.findIndex((x, i) => !x && isPlayerCell(i));
        if (c >= 0) state.board[c] = born;
      }
    }
    merged = true;
  }
  return merged;
}

export function buy(state, index) {
  const item = state.shop[index];
  if (!item) return { ok: false, reason: '这格已经空了' };
  if (state.gold < pieceCost(item.id)) return { ok: false, reason: '灵石不足' };
  const slot = state.bench.findIndex((x) => !x);
  if (slot < 0) return { ok: false, reason: '备战席已满' };
  state.gold -= pieceCost(item.id);
  state.shop[index] = null;
  state.bench[slot] = item;
  return { ok: true, merged: merge(state) };
}

export function relocate(state, from, to) {
  if (from.zone === to.zone && from.i === to.i) return { ok: true, merged: false };
  const piece = peek(state, from);
  if (!piece) return { ok: false, reason: '没有灵将' };
  if (to.zone === 'board' && !isPlayerCell(to.i)) return { ok: false, reason: '只能布在己方半场' };
  const dest = peek(state, to);
  const entering = to.zone === 'board' && from.zone !== 'board' && !dest;
  if (entering && state.board.filter(Boolean).length >= state.cap) return { ok: false, reason: '上场人数已满' };
  if (!dest && to.zone === 'bench' && from.zone !== 'bench' && state.bench.every(Boolean)) return { ok: false, reason: '备战席已满' };
  put(state, from, dest);
  put(state, to, piece);
  return { ok: true, merged: merge(state) };
}

export function sell(state, loc) {
  const piece = peek(state, loc);
  if (!piece) return { ok: false, reason: '没有灵将' };
  put(state, loc, null);
  state.gold += sellValue(piece);
  return { ok: true, gold: state.gold };
}

export function reroll(state) {
  if (state.gold < REROLL_COST) return { ok: false, reason: '灵石不足' };
  state.gold -= REROLL_COST;
  state.shop = rollShop(state, state.rng);
  return { ok: true };
}

function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
function stepToward(u, t, occ) {
  const dx = Math.sign(t.x - u.x);
  const dy = Math.sign(t.y - u.y);
  const diag = dx && dy ? [{ x: u.x + dx, y: u.y + dy }] : [];
  const straight = Math.abs(t.x - u.x) >= Math.abs(t.y - u.y)
    ? [...(dx ? [{ x: u.x + dx, y: u.y }] : []), ...(dy ? [{ x: u.x, y: u.y + dy }] : [])]
    : [...(dy ? [{ x: u.x, y: u.y + dy }] : []), ...(dx ? [{ x: u.x + dx, y: u.y }] : [])];
  for (const p of [...diag, ...straight]) {
    if (p.x < 0 || p.y < 0 || p.x >= COLS || p.y >= ROWS) continue;
    if (occ.has(`${p.x},${p.y}`)) continue;
    return p;
  }
  return null;
}

function occupy(units) {
  const occ = new Set();
  for (const u of units) if (u.hp > 0) occ.add(`${u.x},${u.y}`);
  return occ;
}

/**
 * 双方已经放好的灵将自己打。pieces: { uid, id, star, x, y, side: 'p'|'e' }
 * 返回 winner、残兵数，以及每拍的站位，给画面逐拍放。
 */
export function fight(pieces) {
  const allies = pieces.filter((p) => p.side === 'p');
  const foes = pieces.filter((p) => p.side === 'e');
  const allyBond = bondBonus(allies);
  const foeBond = bondBonus(foes);
  const units = pieces.map((p) => {
    const bonus = (p.side === 'p' ? allyBond : foeBond).bonusOf(p.id);
    const st = pieceStats(p.id, p.star, bonus);
    return { ...p, ...st, max: st.hp };
  });
  const frames = [units.map(snap)];
  const log = [];
  for (let tick = 0; tick < 28; tick++) {
    const living = units.filter((u) => u.hp > 0);
    if (!living.some((u) => u.side === 'p') || !living.some((u) => u.side === 'e')) break;
    const order = [...living].sort((a, b) => b.atk - a.atk || a.y - b.y || a.x - b.x);
    for (const u of order) {
      if (u.hp <= 0) continue;
      const targets = units.filter((v) => v.hp > 0 && v.side !== u.side);
      if (!targets.length) break;
      targets.sort((a, b) => chebyshev(u, a) - chebyshev(u, b) || a.y - b.y || a.x - b.x);
      const t = targets[0];
      if (chebyshev(u, t) <= 1) {
        const dmg = strikeDamage(u.atk, t.def, u.el, t.el);
        t.hp -= dmg;
        log.push({ tick, from: u.uid, to: t.uid, dmg });
      } else {
        const step = stepToward(u, t, occupy(units));
        if (step) { u.x = step.x; u.y = step.y; }
      }
    }
    frames.push(units.map(snap));
  }
  const pLeft = units.filter((u) => u.side === 'p' && u.hp > 0);
  const eLeft = units.filter((u) => u.side === 'e' && u.hp > 0);
  const pHp = pLeft.reduce((s, u) => s + u.hp, 0);
  const eHp = eLeft.reduce((s, u) => s + u.hp, 0);
  let winner = 'draw';
  if (pLeft.length && !eLeft.length) winner = 'player';
  else if (eLeft.length && !pLeft.length) winner = 'enemy';
  else if (pHp !== eHp) winner = pHp > eHp ? 'player' : 'enemy';
  return { winner, pLeft: pLeft.length, eLeft: eLeft.length, frames, log };
}

function snap(u) {
  return { uid: u.uid, id: u.id, star: u.star, side: u.side, x: u.x, y: u.y, hp: u.hp, max: u.max };
}

export function roundDamage(result) {
  if (result.winner === 'player') return 0;
  if (result.winner === 'draw') return 1;
  return 2 + result.eLeft;
}

export function spawnEnemy(round, rng) {
  const n = Math.min(6, 2 + Math.floor((round - 1) * 0.7));
  const cells = [];
  for (let i = 0; i < COLS * 2; i++) cells.push(i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = ENEMY_POOL[Math.floor(rng() * ENEMY_POOL.length)];
    const star = round >= 7 && i === 0 ? 3 : round >= 4 && i < 2 ? 2 : 1;
    const cell = cells[i];
    out.push({ uid: `e-${round}-${i}`, id, star, side: 'e', x: cell % COLS, y: Math.floor(cell / COLS) });
  }
  return out;
}

export function playerPieces(state) {
  const out = [];
  state.board.forEach((p, i) => {
    if (!p) return;
    out.push({ uid: p.uid, id: p.id, star: p.star, side: 'p', x: i % COLS, y: Math.floor(i / COLS) });
  });
  return out;
}

/** 打完这一回合。没倒下就进下一回合，发 5 灵石并刷新商店。 */
export function afterFight(state, result) {
  const dmg = roundDamage(result);
  state.hp = Math.max(0, state.hp - dmg);
  if (state.hp <= 0) { state.over = 'lose'; return { dmg }; }
  if (state.round >= ROUNDS) { state.over = 'win'; return { dmg }; }
  state.round += 1;
  state.gold += 5;
  state.cap = boardCap(state.round);
  state.shop = rollShop(state, state.rng);
  return { dmg };
}

export function rewardOf(state) {
  if (state.over === 'win') return 8 + Math.floor(state.hp / 4);
  return 3;
}

/**
 * 铺进已经建好的画面。
 * api: { h, audio, save, faceEl, toast, btn }
 */
export function mountAutoChess(body, api) {
  const { h, audio, save, faceEl, toast, btn } = api;
  const pool = generalPool(save.data.owned);
  let state = createMatch(pool, (Date.now() ^ (Math.random() * 0x100000000)) >>> 0);
  let sel = null;
  let fighting = false;
  let paid = false;

  const root = h('div.ac-match');
  body.append(root);

  const face = (p, w) => faceEl(p.id, p.star - 1, { w });

  function findSel() {
    if (!sel) return null;
    const b = state.bench.findIndex((p) => p?.uid === sel);
    if (b >= 0) return { zone: 'bench', i: b };
    const i = state.board.findIndex((p) => p?.uid === sel);
    if (i >= 0) return { zone: 'board', i };
    return null;
  }

  function act(res) {
    if (!res.ok) { audio.sfx('error'); toast(res.reason); return; }
    if (res.merged) audio.sfx('upgrade');
    else audio.sfx('click');
    draw();
  }

  function onCell(loc) {
    if (fighting || state.over) return;
    const here = peek(state, loc);
    const from = findSel();
    if (from) {
      const res = relocate(state, from, loc);
      if (res.ok) sel = peek(state, loc)?.uid ?? peek(state, from)?.uid ?? null;
      act(res);
      return;
    }
    if (here) { audio.sfx('pick'); sel = here.uid; draw(); }
  }

  async function startFight() {
    if (fighting || state.over) return;
    if (!state.board.some(Boolean)) { audio.sfx('error'); toast('先放上灵将'); return; }
    fighting = true;
    sel = null;
    draw();
    const result = fight([...playerPieces(state), ...spawnEnemy(state.round, state.rng)]);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const frame of result.frames) {
      renderFight(frame);
      if (!reduce) await new Promise((r) => setTimeout(r, 160));
    }
    const { dmg } = afterFight(state, result);
    fighting = false;
    const line = result.winner === 'player' ? '我方占住了棋盘' : result.winner === 'enemy' ? `敌方残阵还在，气血 -${dmg}` : `打成平手，气血 -${dmg}`;
    audio.sfx(result.winner === 'player' ? 'victory' : 'defeat');
    toast(line);
    draw();
  }

  function renderFight(frame) {
    const cells = root.querySelectorAll('.ac-board .ac-cell');
    cells.forEach((c) => { c.querySelector('.ac-piece')?.remove(); c.querySelector('em')?.remove(); });
    for (const u of frame) {
      if (u.hp <= 0) continue;
      const cell = cells[u.y * COLS + u.x];
      cell?.append(h('div.ac-piece.fight' + (u.side === 'e' ? '.foe' : ''),
        face(u, 54),
        h('i', { text: '★'.repeat(u.star) }),
        h('b', { text: String(Math.max(0, u.hp)) })));
    }
  }

  function draw() {
    const bonds = bondBonus(state.board.filter(Boolean));
    const count = state.board.filter(Boolean).length;
    sel = findSel() ? sel : null;
    const rows = [h('div.ac-bar',
      h('span', { text: `第 ${state.round} / ${ROUNDS} 回合` }),
      h('span', { text: `气血 ${state.hp}` }),
      h('span', { text: `灵石 ${state.gold}` }),
      h('span', { text: `上场 ${count}/${state.cap}` }),
      h('span.dim', { text: '点灵将，再点格子。三张同名同阶合成上一阶。' })),
    bonds.active.length
      ? h('div.ac-bonds', bonds.active.map((b) => h('span', { text: `${b.name} ${b.n}` })))
      : h('div.ac-bonds', h('span.dim', { text: '同羁绊凑满两人，攻击就会抬一截。' })),
    h('div.ac-board', cells()),
    h('div.ac-bench-label', { text: '备战席' }),
    h('div.ac-bench', benchCells()),
    h('div.ac-shop', shopCells())];
    if (state.over) rows.push(endPane());
    root.replaceChildren(...rows);
  }

  function cells() {
    const nodes = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const p = state.board[i];
      const mine = isPlayerCell(i);
      nodes.push(h('button.ac-cell' + (mine ? '.mine' : '.far') + (p && sel === p.uid ? '.on' : ''), {
        onclick: () => onCell({ zone: 'board', i }),
      }, p ? h('div.ac-piece', face(p, 58), h('i', { text: '★'.repeat(p.star) })) : mine ? null : h('em', { text: '敌' })));
    }
    return nodes;
  }

  function benchCells() {
    return state.bench.map((p, i) => h('button.ac-cell.mine' + (p && sel === p.uid ? '.on' : ''), {
      onclick: () => onCell({ zone: 'bench', i }),
    }, p ? h('div.ac-piece', face(p, 64), h('i', { text: '★'.repeat(p.star) }), h('em', { text: card(p.id).short || card(p.id).name })) : null));
  }

  function shopCells() {
    const from = findSel();
    return [
      ...state.shop.map((p, i) => h('button.ac-shop-card' + (p ? '' : '.empty'), {
        onclick: () => { if (fighting || state.over || !p) return; act(buy(state, i)); },
      }, p ? [face(p, 72), h('b', { text: card(p.id).short || card(p.id).name }), h('em', { text: `${pieceCost(p.id)} 灵石` })] : h('em', { text: '空' }))),
      h('div.ac-shop-ops',
        btn(`刷新 · ${REROLL_COST}`, () => { if (fighting || state.over) return; act(reroll(state)); }),
        from ? btn('卖出', () => { if (fighting || state.over) return; sel = null; act(sell(state, from)); }) : null,
        btn('开战', () => { if (!fighting && !state.over) startFight(); }, 'primary')),
    ];
  }

  function endPane() {
    if (!paid) {
      paid = true;
      const n = rewardOf(state);
      save.data.fragments += n;
      save.data.stats.games++;
      if (state.over === 'win') save.data.stats.wins++; else save.data.stats.losses++;
      save.write();
      const frag = document.querySelector('.top .frag-n');
      if (frag) frag.textContent = String(save.data.fragments);
    }
    const n = rewardOf(state);
    return h('div.ac-end',
      h('b', { text: state.over === 'win' ? '棋盘守住了' : '气血见底' }),
      h('span', { text: `文脉碎片 +${n}` }),
      btn('再来一局', () => {
        state = createMatch(pool, (Date.now() ^ (Math.random() * 0x100000000)) >>> 0);
        sel = null; fighting = false; paid = false;
        draw();
      }, 'primary'));
  }

  draw();
}
