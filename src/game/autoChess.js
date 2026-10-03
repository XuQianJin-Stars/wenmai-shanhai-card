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
export const FORM_SLOTS = 2;
const STAR_MAX = 3;

export const ENEMY_POOL = [
  'LJ-001', 'LJ-003', 'LJ-004', 'LJ-007', 'LJ-008', 'LJ-009', 'LJ-010',
  'LJ-013', 'LJ-054', 'LJ-063', 'LJ-090', 'LJ-099',
];

export const boardCap = (round) => Math.min(6, 2 + round);
export const isPlayerCell = (i) => i >= COLS * 2 && i < COLS * ROWS;
export const pieceCost = (id) => card(id).cost ?? 1;
export const sellValue = (p) => pieceCost(p.id) + p.star - 1;

export const isFormation = (id) => CARDS[id]?.type === 'formation';

export function generalPool(owned) {
  const ids = (owned ?? []).filter((id) => CARDS[id]?.type === 'general' && !CARDS[id].zhuo);
  return ids.length ? ids : ['LJ-007', 'LJ-008', 'LJ-009', 'LJ-006'];
}

export function formationPool(owned) {
  return (owned ?? []).filter((id) => isFormation(id));
}

/** 火、金的阵加攻击，水、木、土的阵加防御，阶数就是加的点数。两座齐开再各 +1。 */
export function formationAura(forms) {
  const list = (forms ?? []).filter(Boolean);
  let atk = 0;
  let def = 0;
  for (const f of list) {
    const n = f.star;
    if (card(f.id).el === 'fire' || card(f.id).el === 'metal') atk += n;
    else def += n;
  }
  if (list.length >= 2) { atk += 1; def += 1; }
  return { atk, def };
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

export function pieceStats(id, star, bonus = 0, aura = null) {
  const c = card(id);
  return {
    hp: (c.hp ?? 6) + (star - 1) * 4,
    atk: (c.atk ?? 3) + (star - 1) * 2 + bonus + (aura?.atk ?? 0),
    def: (c.def ?? 1) + (star - 1) + Math.floor(bonus / 2) + (aura?.def ?? 0),
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
  const forms = state.formations ?? [];
  for (let i = 0; i < SHOP_N; i++) {
    const useForm = forms.length > 0 && rng() < 0.4;
    const bag = useForm ? forms : state.pool;
    const id = bag[Math.floor(rng() * bag.length)];
    shop.push({ uid: state.seq++, id, star: 1 });
  }
  return shop;
}

export function createMatch(pool, seed = 1, formations = []) {
  const rng = mulberry32(seed >>> 0);
  const state = {
    round: 1,
    hp: PLAYER_HP,
    gold: 8,
    cap: boardCap(1),
    pool: pool.length ? [...pool] : generalPool([]),
    formations: formations.filter((id) => isFormation(id)),
    shop: [],
    bench: Array(BENCH).fill(null),
    board: Array(COLS * ROWS).fill(null),
    forms: Array(FORM_SLOTS).fill(null),
    over: null,
    seq: 1,
    rng,
  };
  state.shop = rollShop(state, rng);
  return state;
}

function listOf(state, zone) {
  if (zone === 'board') return state.board;
  if (zone === 'form') return state.forms;
  return state.bench;
}
function peek(state, loc) {
  return listOf(state, loc.zone)[loc.i];
}
function put(state, loc, piece) {
  listOf(state, loc.zone)[loc.i] = piece;
}

function merge(state) {
  let merged = false;
  for (;;) {
    const locs = [];
    state.board.forEach((p, i) => { if (p) locs.push({ zone: 'board', i, p }); });
    state.bench.forEach((p, i) => { if (p) locs.push({ zone: 'bench', i, p }); });
    state.forms.forEach((p, i) => { if (p) locs.push({ zone: 'form', i, p }); });
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
    const bornForm = isFormation(born.id);
    for (const loc of take) put(state, loc, null);
    const home = bornForm
      ? take.find((l) => l.zone === 'form')
      : take.find((l) => l.zone === 'board' && isPlayerCell(l.i));
    if (home) put(state, home, born);
    else if (bornForm) {
      const f = state.forms.findIndex((x) => !x);
      if (f >= 0) state.forms[f] = born;
      else {
        const b = state.bench.findIndex((x) => !x);
        if (b >= 0) state.bench[b] = born;
      }
    } else {
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

function locate(state, uid) {
  if (!uid) return null;
  let i = state.bench.findIndex((p) => p?.uid === uid);
  if (i >= 0) return { zone: 'bench', i };
  i = state.forms.findIndex((p) => p?.uid === uid);
  if (i >= 0) return { zone: 'form', i };
  i = state.board.findIndex((p) => p?.uid === uid);
  if (i >= 0) return { zone: 'board', i };
  return null;
}

/** 点到另一类牌时改选中，不把阵法硬搬到灵将身上。空格才是落子。 */
export function clickSlot(state, selUid, loc) {
  const here = peek(state, loc);
  const from = locate(state, selUid);
  const moving = from ? peek(state, from) : null;
  if (here && here.uid !== selUid && (!moving || isFormation(moving.id) !== isFormation(here.id))) {
    return { ok: true, sel: here.uid, moved: false };
  }
  if (from) {
    const res = relocate(state, from, loc);
    return { ...res, sel: res.ok ? (peek(state, loc)?.uid ?? null) : selUid, moved: !!res.ok };
  }
  return { ok: true, sel: here?.uid ?? null, moved: false };
}

export function relocate(state, from, to) {
  if (from.zone === to.zone && from.i === to.i) return { ok: true, merged: false };
  const piece = peek(state, from);
  if (!piece) return { ok: false, reason: '这里是空的' };
  const formPiece = isFormation(piece.id);
  if (formPiece && to.zone === 'board') return { ok: false, reason: '阵法放在阵法区' };
  if (!formPiece && to.zone === 'form') return { ok: false, reason: '这里只放阵法' };
  if (to.zone === 'board' && !isPlayerCell(to.i)) return { ok: false, reason: '只能布在己方半场' };
  const dest = peek(state, to);
  if (dest && isFormation(dest.id) !== formPiece) return { ok: false, reason: formPiece ? '阵法放在阵法区' : '这里只放阵法' };
  const entering = to.zone === 'board' && from.zone !== 'board' && !dest;
  if (entering && state.board.filter(Boolean).length >= state.cap) return { ok: false, reason: '上场人数已满' };
  if (!dest && to.zone === 'bench' && from.zone !== 'bench' && state.bench.every(Boolean)) return { ok: false, reason: '备战席已满' };
  if (!dest && to.zone === 'form' && from.zone !== 'form' && state.forms.every(Boolean)) return { ok: false, reason: '阵法区已满' };
  put(state, from, dest);
  put(state, to, piece);
  return { ok: true, merged: merge(state) };
}

export function sell(state, loc) {
  const piece = peek(state, loc);
  if (!piece) return { ok: false, reason: '这里是空的' };
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
export function fight(pieces, forms = []) {
  const allies = pieces.filter((p) => p.side === 'p');
  const foes = pieces.filter((p) => p.side === 'e');
  const allyBond = bondBonus(allies);
  const foeBond = bondBonus(foes);
  const aura = formationAura(forms);
  const units = pieces.map((p) => {
    const bonus = (p.side === 'p' ? allyBond : foeBond).bonusOf(p.id);
    const st = pieceStats(p.id, p.star, bonus, p.side === 'p' ? aura : null);
    return { ...p, ...st, max: st.hp };
  });
  const cast = (aura.atk || aura.def) ? { atk: aura.atk, def: aura.def } : null;
  const frames = [{ units: units.map(snap), hits: [], cast }];
  const log = [];
  for (let tick = 0; tick < 28; tick++) {
    const living = units.filter((u) => u.hp > 0);
    if (!living.some((u) => u.side === 'p') || !living.some((u) => u.side === 'e')) break;
    const order = [...living].sort((a, b) => b.atk - a.atk || a.y - b.y || a.x - b.x);
    const hits = [];
    for (const u of order) {
      if (u.hp <= 0) continue;
      const targets = units.filter((v) => v.hp > 0 && v.side !== u.side);
      if (!targets.length) break;
      targets.sort((a, b) => chebyshev(u, a) - chebyshev(u, b) || a.y - b.y || a.x - b.x);
      const t = targets[0];
      if (chebyshev(u, t) <= 1) {
        const counter = COUNTERS[u.el] === t.el;
        const dmg = strikeDamage(u.atk, t.def, u.el, t.el);
        t.hp -= dmg;
        const hit = { from: u.uid, to: t.uid, dmg, counter, kill: t.hp <= 0, fx: u.x, fy: u.y, tx: t.x, ty: t.y };
        hits.push(hit);
        log.push({ tick, ...hit });
      } else {
        const step = stepToward(u, t, occupy(units));
        if (step) { u.x = step.x; u.y = step.y; }
      }
    }
    frames.push({ units: units.map(snap), hits });
  }
  const pLeft = units.filter((u) => u.side === 'p' && u.hp > 0);
  const eLeft = units.filter((u) => u.side === 'e' && u.hp > 0);
  const pHp = pLeft.reduce((s, u) => s + u.hp, 0);
  const eHp = eLeft.reduce((s, u) => s + u.hp, 0);
  let winner = 'draw';
  if (pLeft.length && !eLeft.length) winner = 'player';
  else if (eLeft.length && !pLeft.length) winner = 'enemy';
  else if (pHp !== eHp) winner = pHp > eHp ? 'player' : 'enemy';
  return { winner, pLeft: pLeft.length, eLeft: eLeft.length, frames, log, units };
}

/** 一拍交锋的双方合计：上场人数、攻击、防御、气血，以及这一拍打出的伤害。 */
export function fightTally(units, log = []) {
  const of = (side) => (units ?? []).filter((u) => u.side === side);
  const sum = (list, key) => list.reduce((n, u) => n + (u[key] || 0), 0);
  const dealt = (side) => {
    const ids = new Set(of(side).map((u) => u.uid));
    return log.filter((h) => ids.has(h.from)).reduce((n, h) => n + h.dmg, 0);
  };
  const pack = (side) => {
    const list = of(side);
    return { n: list.length, atk: sum(list, 'atk'), def: sum(list, 'def'), hp: sum(list, 'max'), dmg: dealt(side) };
  };
  return { p: pack('p'), e: pack('e') };
}

export function emptyTally() {
  const z = () => ({ n: 0, atk: 0, def: 0, hp: 0, dmg: 0 });
  return { rounds: 0, wins: 0, losses: 0, draws: 0, p: z(), e: z() };
}

export function addTally(total, part, winner) {
  total.rounds += 1;
  if (winner === 'player') total.wins += 1;
  else if (winner === 'enemy') total.losses += 1;
  else total.draws += 1;
  for (const side of ['p', 'e']) for (const key of ['n', 'atk', 'def', 'hp', 'dmg']) total[side][key] += part[side][key];
  return total;
}

function snap(u) {
  return { uid: u.uid, id: u.id, star: u.star, side: u.side, x: u.x, y: u.y, hp: u.hp, max: u.max, atk: u.atk, def: u.def };
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
 * api: { h, audio, save, faceEl, toast, btn, modal, back }
 */
export function mountAutoChess(body, api) {
  const { h, audio, save, faceEl, toast, btn, modal, back } = api;
  const pool = generalPool(save.data.owned);
  const formations = formationPool(save.data.owned);
  let state = createMatch(pool, (Date.now() ^ (Math.random() * 0x100000000)) >>> 0, formations);
  let tally = emptyTally();
  let sel = null;
  let fighting = false;
  let paid = false;
  let endShown = false;

  const root = h('div.ac-match');
  body.append(root);

  const face = (p, w) => faceEl(p.id, p.star - 1, { w });
  const statRow = (st, hp) => h('span.ac-stats',
    h('em.atk', { text: `攻${st.atk}` }),
    h('em.def', { text: `防${st.def}` }),
    hp == null ? null : h('em.hp', { text: `血${hp}` }));
  const cardStats = (p) => isFormation(p.id) ? formationAura([p]) : pieceStats(p.id, p.star);
  const formStat = (p) => {
    const a = formationAura([p]);
    return h('span.ac-stats',
      a.atk ? h('em.atk', { text: `攻+${a.atk}` }) : null,
      a.def ? h('em.def', { text: `防+${a.def}` }) : null);
  };

  function findSel() {
    if (!sel) return null;
    const b = state.bench.findIndex((p) => p?.uid === sel);
    if (b >= 0) return { zone: 'bench', i: b };
    const f = state.forms.findIndex((p) => p?.uid === sel);
    if (f >= 0) return { zone: 'form', i: f };
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
    const res = clickSlot(state, sel, loc);
    if (!res.ok) { audio.sfx('error'); toast(res.reason); return; }
    sel = res.sel;
    if (res.merged) audio.sfx('upgrade');
    else audio.sfx(res.moved ? 'click' : 'pick');
    draw();
  }

  async function startFight() {
    if (fighting || state.over) return;
    if (!state.board.some(Boolean)) { audio.sfx('error'); toast('先放上灵将'); return; }
    fighting = true;
    sel = null;
    draw();
    const result = fight([...playerPieces(state), ...spawnEnemy(state.round, state.rng)], state.forms.filter(Boolean));
    addTally(tally, fightTally(result.units, result.log), result.winner);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const frame of result.frames) {
      renderFight(frame);
      if (frame.cast) playCast(frame.cast);
      if (frame.hits?.length) audio.sfx(frame.hits.some((h) => h.kill) ? 'hit' : 'attack', { heavy: frame.hits.some((h) => h.kill) });
      const wait = frame.cast ? 720 : frame.hits?.length ? 340 : 130;
      if (!reduce) await new Promise((r) => setTimeout(r, wait));
    }
    const { dmg } = afterFight(state, result);
    fighting = false;
    const line = result.winner === 'player' ? '我方占住了棋盘' : result.winner === 'enemy' ? `敌方残阵还在，气血 -${dmg}` : `打成平手，气血 -${dmg}`;
    audio.sfx(result.winner === 'player' ? 'victory' : 'defeat');
    toast(line);
    draw();
    if (state.over) await showEnd();
  }

  function playCast(cast) {
    audio.sfx('bond');
    root.querySelectorAll('.ac-forms .ac-cell').forEach((c) => {
      if (!c.querySelector('.ac-piece')) return;
      c.classList.add('casting');
      c.append(h('span.ac-cast', { text: '阵' }));
    });
    const bits = [];
    if (cast.atk) bits.push(`攻+${cast.atk}`);
    if (cast.def) bits.push(`防+${cast.def}`);
    root.querySelectorAll('.ac-board .ac-cell.mine').forEach((c) => {
      if (!c.querySelector('.ac-piece')) return;
      c.classList.add('ward');
      c.append(h('span.ac-ward', { text: bits.join(' ') }));
    });
  }

  function renderFight(frame) {
    const cells = root.querySelectorAll('.ac-board .ac-cell');
    const hits = frame.hits ?? [];
    const killed = new Set(hits.filter((x) => x.kill).map((x) => x.to));
    cells.forEach((c) => {
      c.classList.remove('struck', 'counter', 'ward');
      c.querySelector('.ac-piece')?.remove();
      c.querySelector('.ac-dmg')?.remove();
      c.querySelector('.ac-ward')?.remove();
      c.querySelector('em')?.remove();
    });
    for (const u of frame.units) {
      const dying = u.hp <= 0;
      if (dying && !killed.has(u.uid)) continue;
      const cell = cells[u.y * COLS + u.x];
      if (!cell) continue;
      const blow = hits.find((x) => x.to === u.uid);
      const swing = hits.find((x) => x.from === u.uid);
      const piece = h('div.ac-piece.fight' + (u.side === 'e' ? '.foe' : '') + (dying ? '.fall' : '') + (blow ? '.hit' : '') + (swing ? '.lunge' : ''),
        face(u, 48),
        h('i', { text: '★'.repeat(u.star) }),
        dying ? null : statRow(u, Math.max(0, u.hp)));
      if (swing) {
        piece.style.setProperty('--dx', `${(swing.tx - swing.fx) * 18}px`);
        piece.style.setProperty('--dy', `${(swing.ty - swing.fy) * 16}px`);
      }
      cell.append(piece);
      if (!blow) continue;
      cell.classList.add('struck');
      if (blow.counter) cell.classList.add('counter');
      cell.append(h('span.ac-dmg' + (blow.counter ? '.counter' : '') + (blow.kill ? '.kill' : ''), {
        text: blow.counter ? `克 ${blow.dmg}` : `-${blow.dmg}`,
      }));
    }
  }

  function draw() {
    const bonds = bondBonus(state.board.filter(Boolean));
    const aura = formationAura(state.forms);
    const count = state.board.filter(Boolean).length;
    sel = findSel() ? sel : null;
    const rows = [h('div.ac-bar',
      h('span', { text: `第 ${state.round} / ${ROUNDS} 回合` }),
      h('span', { text: `气血 ${state.hp}` }),
      h('span', { text: `灵石 ${state.gold}` }),
      h('span', { text: `上场 ${count}/${state.cap}` }),
      h('span.dim', { text: '灵将布在己方半场，阵法放在阵法区。三张同名同阶合成上一阶。' })),
    bonds.active.length
      ? h('div.ac-bonds', bonds.active.map((b) => h('span', { text: `${b.name} ${b.n}` })))
      : h('div.ac-bonds', h('span.dim', { text: '同羁绊凑满两人，攻击就会抬一截。' })),
    h('div.ac-board', cells()),
    h('div.ac-form-label', { text: aura.atk || aura.def ? `阵法区 · 攻击 +${aura.atk}  防御 +${aura.def}` : '阵法区 · 最多两座。火、金加攻击，水、木、土加防御' }),
    h('div.ac-forms', formCells()),
    h('div.ac-bench-label', { text: '备战席' }),
    h('div.ac-bench', benchCells()),
    h('div.ac-shop', shopCells())];
    root.replaceChildren(...rows);
  }

  function cells() {
    const placed = state.board.filter(Boolean);
    const bondsNow = bondBonus(placed);
    const auraNow = formationAura(state.forms);
    const nodes = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const p = state.board[i];
      const mine = isPlayerCell(i);
      const st = p ? pieceStats(p.id, p.star, bondsNow.bonusOf(p.id), auraNow) : null;
      nodes.push(h('button.ac-cell' + (mine ? '.mine' : '.far') + (p && sel === p.uid ? '.on' : ''), {
        onclick: () => onCell({ zone: 'board', i }),
      }, p ? h('div.ac-piece', face(p, 52), h('i', { text: '★'.repeat(p.star) }), statRow(st, st.hp)) : mine ? null : h('em', { text: '敌' })));
    }
    return nodes;
  }

  function formCells() {
    return state.forms.map((p, i) => h('button.ac-cell.form' + (p && sel === p.uid ? '.on' : ''), {
      onclick: () => onCell({ zone: 'form', i }),
    }, p ? h('div.ac-piece', face(p, 56), h('i', { text: '★'.repeat(p.star) }), h('em', { text: card(p.id).short || card(p.id).name }), formStat(p)) : h('em', { text: '阵法' })));
  }

  function benchCells() {
    return state.bench.map((p, i) => h('button.ac-cell.mine' + (p && sel === p.uid ? '.on' : ''), {
      onclick: () => onCell({ zone: 'bench', i }),
    }, p ? h('div.ac-piece', face(p, 56), h('i', { text: '★'.repeat(p.star) }), h('em', { text: card(p.id).short || card(p.id).name }), isFormation(p.id) ? formStat(p) : statRow(cardStats(p))) : null));
  }

  function shopCells() {
    const from = findSel();
    return [
      ...state.shop.map((p, i) => h('button.ac-shop-card' + (p ? '' : '.empty') + (p && isFormation(p.id) ? '.form' : ''), {
        onclick: () => { if (fighting || state.over || !p) return; act(buy(state, i)); },
      }, p ? [face(p, 64), h('b', { text: card(p.id).short || card(p.id).name }), isFormation(p.id) ? formStat(p) : statRow(cardStats(p)), h('em', { text: `${isFormation(p.id) ? '阵 · ' : ''}${pieceCost(p.id)} 灵石` })] : h('em', { text: '空' }))),
      h('div.ac-shop-ops',
        btn(`刷新 · ${REROLL_COST}`, () => { if (fighting || state.over) return; act(reroll(state)); }),
        from ? btn('卖出', () => { if (fighting || state.over) return; sel = null; act(sell(state, from)); }) : null,
        btn('开战', () => { if (!fighting && !state.over) startFight(); }, 'primary')),
    ];
  }

  async function showEnd() {
    if (endShown) return;
    endShown = true;
    const won = state.over === 'win';
    const n = rewardOf(state);
    if (!paid) {
      paid = true;
      save.data.fragments += n;
      save.data.stats.games++;
      if (won) save.data.stats.wins++; else save.data.stats.losses++;
      save.write();
      const frag = document.querySelector('.top .frag-n');
      if (frag) frag.textContent = String(save.data.fragments);
    }
    const again = await modal(
      won ? '棋盘守住了' : '气血见底',
      h('div.ac-result-copy',
        h('div.ac-result-mark', { text: won ? '胜' : '败' }),
        h('div.ac-sum',
          h('div.ac-sum-head', h('span', { text: '本局' }), h('b', { text: '我方' }), h('b.foe', { text: '敌方' })),
          ...[['人数', 'n'], ['攻击', 'atk'], ['防御', 'def'], ['气血', 'hp'], ['伤害', 'dmg']].map(([label, key]) =>
            h('div.ac-sum-row', h('span', { text: label }), h('b', { text: String(tally.p[key]) }), h('b.foe', { text: String(tally.e[key]) })))),
        h('p', { text: `${tally.rounds} 回合 · 交锋 ${tally.wins} 胜 ${tally.losses} 负${tally.draws ? ` ${tally.draws} 平` : ''} · 文脉碎片 +${n}` })),
      [
        { label: '返回', value: false },
        { label: '再来一局', value: true, primary: true },
      ],
      { cls: won ? 'ac-result' : 'ac-result lose', closable: false },
    );
    if (again) {
      state = createMatch(pool, (Date.now() ^ (Math.random() * 0x100000000)) >>> 0, formations);
      tally = emptyTally();
      sel = null;
      fighting = false;
      paid = false;
      endShown = false;
      draw();
    } else back?.();
  }

  draw();
}
