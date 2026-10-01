// Battle rules (BattleSystem + BondSystem + ResonanceSystem). Pure data in, pure data out:
//   const s = createGame(cfg); const ev = act(s, action); — mutates s, returns the events it produced.
// The state is plain JSON (structuredClone-able) so the AI can simulate, tests can replay, and the view can re-sync.
// Rules: docs/design/CORE_LOOP_v2.md (v1.1), BOND_SYSTEM.md, RESONANCE.md, CARD_LIST_v1.md.
import { card, COUNTERS, GRADE_BONUS, GEAR_GRADE, EL_KEYS, BONDS } from '../data/cards.js';
import { rand, randInt, pick, shuffle } from './rng.js';
import { FX, PASSIVES } from './cardfx.js';

export const RULES = Object.freeze({
  HERO_HP: 20, MAX_MANA: 10, MAX_HAND: 7, MAX_BOARD: 5, MAX_WENMAI: 6, MAX_ZHEN: 2, MAX_ATTACKS: 2,
  HAND_FIRST: 4, HAND_SECOND: 5, CTRL_CAP: 2, HERO_MIN_HIT: 2, ELEMENT_MULT: 1.3,
});
const NEG = new Set(['stun', 'seal', 'bleed', 'atkDown', 'defDown']);
const MARKED = new Set(['stun', 'seal', 'bleed']);          // 「负面状态」 for 钟馗 / 烛龙
const BUFF = new Set(['defUp', 'atkUp', 'reflect']);        // 「增益」 that talismans can dispel
const CONTROL = new Set(['stun', 'seal']);

// ───────────────────────────── setup ─────────────────────────────
function makeInst(s, owner, id, grade = 0) {
  const d = card(id), b = GRADE_BONUS[grade] ?? GRADE_BONUS[0];
  const u = { uid: `u${++s.uidc}`, id, owner, grade, costMod: 0 };
  if (d.type === 'general') {
    Object.assign(u, { atk: d.atk + b.atk, def: d.def + b.def, hp: d.hp + b.hp, maxHp: d.hp + b.hp,
      // rush（白龙马的「意马」）：落地就能动。写在 makeInst 里而不是 summon 钩子里，
      // 这样 emit 出去的那份 unit 快照就已经是醒着的，前端不用再补一次刷新。
      st: [], sleep: !d.rush, attacks: 0, skillUsed: false, ctrl: 0 });
  }
  return u;
}
function resetInst(s, u) { // a card leaving play forgets everything that happened to it
  const fresh = makeInst(s, u.owner, u.id, u.grade);
  fresh.uid = u.uid; s.uidc--;
  return fresh;
}

/**
 * 佩戴中的器物给的属性；没戴就是 null。品阶只抬 ATK/DEF（cards.js 的 GEAR_GRADE），
 * HP 是佩戴那一刻实打实加到灵将身上的，卸下要原样还回去，所以不跟品阶走。
 */
export function gearOf(u) {
  if (!u?.gear) return null;
  const g = card(u.gear.id).gear ?? {}, b = GEAR_GRADE[u.gear.grade] ?? 0;
  return { atk: (g.atk ?? 0) + b, def: (g.def ?? 0) + b, hp: g.hp ?? 0, guard: !!g.guard };
}

/** 守护者修行带来的永久加成（src/data/guardian.js 算好后传进来）。缺省全 0。 */
function boonOf(raw) {
  const n = (v, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0);
  // 上界是防篡改存档的，不是平衡阀门——要跟着 guardian.js 的「点满值」走，
  // 压低了会把正常点满的守护者也削掉（固本满 8 重 = +80，主将 20 → 100）。
  return { hp: n(raw?.hp, 80), armor: n(raw?.armor, 5), regen: n(raw?.regen, 6),
    mana: n(raw?.mana, 6), hand: n(raw?.hand, 4), handCap: n(raw?.handCap, 5) };
}

/**
 * cfg.players[i] = { name, deck: [cardId], grades: {cardId: 0|1|2}, hp, passive, ordered,
 *                    boon: {hp, hand, mana, regen} }
 * cfg.first = 0|1 (who moves first), cfg.seed
 */
export function createGame(cfg) {
  const s = { rng: (cfg.seed ?? 1) >>> 0, uidc: 0, turn: 0, active: cfg.first ?? 0, first: cfg.first ?? 0,
    over: false, winner: -1, ev: [], players: [] };
  cfg.players.forEach((pc, i) => {
    const boon = boonOf(pc.boon);
    const hp = (pc.hp ?? RULES.HERO_HP) + boon.hp;
    const P = { i, name: pc.name ?? `P${i}`, passive: pc.passive ?? null, boon, hp, maxHp: hp,
      heroSt: [], mana: 0, maxMana: 0, turns: 0, attacksUsed: 0,
      deck: [], hand: [], board: [], wenmai: [], zhen: [], discard: [],
      res: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 }, resCd: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
      resLog: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0, total: 0 }, resTurn: [],
      barrierUsed: false, barrierTurns: 0, yinyang: 0, yinyangTurn: -1, heavenUsed: false,
      once: {}, bondOn: {}, litTurn: -1, freeTalisman: false, nezhaTurn: -1, played: 0, craftGain: 0,
      kunlun: 0, kunlunUp: false, lastRecovered: null, talismansThisTurn: 0, fatigue: false };
    for (const id of pc.deck) P.deck.push(makeInst(s, i, id, pc.grades?.[id] ?? 0));
    if (!pc.ordered) shuffle(s, P.deck);
    s.players.push(P);
  });
  const f = s.first, o = 1 - f;
  for (let k = 0; k < RULES.HAND_FIRST + s.players[f].boon.hand; k++) drawCard(s, f, true);
  for (let k = 0; k < RULES.HAND_SECOND + s.players[o].boon.hand; k++) drawCard(s, o, true);
  startTurn(s);
  return s;
}

// ───────────────────────────── queries ─────────────────────────────
export const opp = (i) => 1 - i;
export function findUnit(s, uid) {
  for (const P of s.players) for (const u of P.board) if (u.uid === uid) return u;
  return null;
}
export function findAny(s, uid) {
  for (const P of s.players) for (const z of ['hand', 'board', 'wenmai', 'zhen', 'discard', 'deck']) {
    const u = P[z].find((x) => x.uid === uid);
    if (u) return { u, zone: z, P };
  }
  return null;
}
const hasSt = (u, k) => u.st?.some((x) => x.k === k);
export const isMarked = (u) => u.st?.some((x) => MARKED.has(x.k));
const onBoard = (P, id) => P.board.some((u) => u.id === id);
const inWenmai = (P, id) => P.wenmai.find((u) => u.id === id);
const baxianCount = (P) => P.board.filter((u) => card(u.id).bonds.includes('baxian')).length;
const fengshenCount = (P) => P.board.filter((u) => card(u.id).bonds.includes('fengshen')).length;

export function bondState(s, i) {
  const P = s.players[i];
  const genesis = onBoard(P, 'LJ-001') && onBoard(P, 'LJ-002');
  const zs = onBoard(P, 'LJ-004') && !!inWenmai(P, 'WM-005');
  const fy = ['WM-004', 'WM-007', 'WM-010'].filter((id) => inWenmai(P, id)).length;
  return {
    genesis: genesis ? (inWenmai(P, 'WM-001') && inWenmai(P, 'WM-002') ? 3 : inWenmai(P, 'WM-001') || inWenmai(P, 'WM-002') ? 2 : 1) : 0,
    baxian: baxianCount(P) >= 2 ? 1 : 0,
    fengshen: fengshenCount(P) >= 2 ? 2 : (onBoard(P, 'LJ-003') ? 1 : 0),
    zhensha: zs ? (onBoard(P, 'LJ-009') ? 2 : 1) : 0,
    feiyi: fy,
    shisheng: onBoard(P, 'LJ-010') && onBoard(P, 'LJ-011') ? (onBoard(P, 'LJ-012') ? 2 : 1) : 0,
    zhenfa: (P.zhen?.length ?? 0) >= 2 ? 1 : 0,
    ...autoBonds(P),
  };
}
/** Bonds declared with an `auto` spec in the card table: N of the listed generals on board, plus an optional wenmai for level 2. */
const AUTO_BONDS = Object.entries(BONDS).filter(([, B]) => B.auto);
function autoBonds(P) {
  const out = {};
  for (const [k, B] of AUTO_BONDS) {
    const n = B.auto.generals.filter((id) => onBoard(P, id)).length;
    out[k] = n >= (B.auto.need ?? 2) ? (B.auto.wenmai && inWenmai(P, B.auto.wenmai) ? 2 : 1) : 0;
  }
  return out;
}
const bondOn = (s, u, k) => card(u.id).bonds.includes(k) && bondState(s, u.owner)[k] >= 1;
/** +1 ATK / +1 DEF while any of the unit's auto bonds is active. */
function autoBondAura(s, u) {
  const bs = bondState(s, u.owner);
  return card(u.id).bonds.some((k) => BONDS[k]?.auto && bs[k] >= 1) ? 1 : 0;
}

function auraAtk(s, u, target) {
  const P = s.players[u.owner], d = card(u.id);
  let wm = 0, bond = 0, res = 0;
  for (const w of P.wenmai) {
    if (w.id === 'WM-001' && d.el === 'earth') wm += w.grade >= 1 ? 3 : 2;
    if (w.id === 'WM-003' && d.bonds.includes('baxian')) wm += Math.min(4, baxianCount(P));
  }
  if (d.bonds.includes('baxian') && baxianCount(P) >= 2) bond += 1;
  if (d.bonds.includes('fengshen') && fengshenCount(P) >= 2) bond += 1;
  bond += Math.max(bondOn(s, u, 'shisheng') ? 1 : 0, autoBondAura(s, u));
  if ((P.zhen?.length ?? 0) >= 2 && d.type === 'general') bond += 1;   // 两阵齐开
  wm += FX[u.id]?.auraSelf?.atk?.(s, u) ?? 0;
  if (P.res.fire > 0 && d.el === 'fire') res += 2;
  if (target && P.res.metal > 0 && ['metal', 'wood'].includes(card(target.id).el)) res += 1;
  // Bond + Resonance on the same unit: ATK takes the higher (S-CROSS-001); total aura capped at base × 1.5
  const cap = Math.max(2, Math.floor(u.atk * 0.5));
  return Math.min(cap, wm + Math.max(bond, res));
}
function auraDef(s, u) {
  const P = s.players[u.owner], d = card(u.id);
  let a = 0;
  for (const w of P.wenmai) {
    if (w.id === 'WM-001' && d.el === 'earth' && w.grade >= 1) a += 1;
    if (w.id === 'WM-003' && d.bonds.includes('baxian')) a += Math.min(4, baxianCount(P));
    if (w.id === 'WM-022') a += w.grade >= 1 ? 2 : 1;               // 千里江山图：青绿厚涂，护的是整幅
  }
  if (d.bonds.includes('baxian') && baxianCount(P) >= 2) a += 1;
  if (d.bonds.includes('fengshen') && fengshenCount(P) >= 2) a += 1;
  a += Math.max(bondOn(s, u, 'shisheng') ? 1 : 0, autoBondAura(s, u));
  if ((P.zhen?.length ?? 0) >= 2 && d.type === 'general') a += 1;      // 两阵齐开
  a += FX[u.id]?.auraSelf?.def?.(s, u) ?? 0;
  if (u.id === 'LJ-016') a += Math.min(3, P.wenmai.length);        // 经纬
  if (P.res.earth > 0 && d.el === 'earth') a += 2;
  const bs = bondState(s, u.owner);
  if (d.bonds.includes('zhensha') && bs.zhensha >= 2) a += 1;
  if (bs.feiyi >= 3) a += 1;                                        // 手艺三生完阵
  return Math.min(3, a);   // single-turn DEF bonus cap +3 (S-CROSS-001)
}
// 器物加成走在光环封顶之外：光环是「场面给的」，会被 cap 压住；器物是玩家花一张牌换的，不该被压。
export function atkOf(s, u, target = null) {
  let v = u.atk + auraAtk(s, u, target) + (gearOf(u)?.atk ?? 0);
  for (const x of u.st) { if (x.k === 'atkUp') v += x.v; if (x.k === 'atkDown') v -= x.v; }
  return Math.max(0, v);
}
export function defOf(s, u) {
  let v = u.def + auraDef(s, u) + (gearOf(u)?.def ?? 0);
  for (const x of u.st) { if (x.k === 'defUp') v += x.v; if (x.k === 'defDown') v -= x.v; }
  return Math.max(0, v);
}
export function heroReduction(s, i) {
  const P = s.players[i];
  let r = 0;
  const wc = inWenmai(P, 'WM-002');
  if (wc) r = Math.max(r, wc.grade >= 1 ? 2 : 1);
  if (P.barrierTurns > 0) r = Math.max(r, 1);
  if (P.res.metal > 0) r = Math.max(r, 1);
  if (onBoard(P, 'LJ-009')) r = Math.max(r, 1);
  if (bondState(s, i).zhensha >= 2) r = Math.max(r, 1);
  if (P.boon.armor > 0) r = Math.max(r, P.boon.armor);   // 守护者「磐石」
  return r;   // defensive effects never stack: the highest wins (CORE_LOOP §八)
}

export function costOf(s, i, u) {
  const d = card(u.id), P = s.players[i];
  let c = d.cost + (u.costMod ?? 0);
  if (d.type === 'general' && P.kunlun > 0) c = Math.max(1, c - 1);
  if (d.type === 'talisman' && P.freeTalisman && d.cost <= 3) c = 0;
  return Math.max(0, c);
}
export function skillCost(s, u) {
  const sk = card(u.id).skill;
  if (!sk) return Infinity;
  let c = sk.cost;
  if ((u.id === 'LJ-001' || u.id === 'LJ-002') && s.players[u.owner].once.genesisFull) c -= 1;
  if (u.id === 'LJ-004' && bondState(s, u.owner).zhensha >= 1) c -= 1;
  const bs = bondState(s, u.owner);
  for (const k of card(u.id).bonds) if (BONDS[k]?.auto?.perk === 'skill' && bs[k] >= 2) c -= 1;
  return Math.max(0, c);
}

// ───────────────────────────── events / helpers ─────────────────────────────
const emit = (s, e) => { s.ev.push(e); return e; };
const heroId = (i) => `H${i}`;

function drawCard(s, i, silent = false) {
  const P = s.players[i];
  if (!P.deck.length) return null;
  const u = P.deck.shift();
  P.hand.push(u);
  emit(s, { t: 'draw', p: i, uid: u.uid, id: u.id, silent });
  return u;
}

function applyNeg(s, u, k, t, v = 0, src = '') {
  if (hasSt(u, 'immune') || (CONTROL.has(k) && hasSt(u, 'ctrlImmune'))) {
    emit(s, { t: 'resist', uid: u.uid, k });
    return false;
  }
  const ex = u.st.find((x) => x.k === k);
  if (ex) { ex.t = Math.max(ex.t, t); ex.v = Math.max(ex.v ?? 0, v); }
  else u.st.push({ k, t, v, src });
  emit(s, { t: 'status', uid: u.uid, k, on: true });
  return true;
}
function addBuff(s, u, k, t, v = 0) {
  const ex = u.st.find((x) => x.k === k && x.t === t);
  if (ex) ex.v += v; else u.st.push({ k, t, v });
  emit(s, { t: 'status', uid: u.uid, k, on: true });
}
function cleanse(s, u, n = Infinity) {
  let c = 0;
  u.st = u.st.filter((x) => {
    if (c < n && NEG.has(x.k)) { c++; emit(s, { t: 'status', uid: u.uid, k: x.k, on: false }); return false; }
    return true;
  });
  return c;
}
function dispelOne(s, u) {
  const k = u.st.findIndex((x) => BUFF.has(x.k));
  if (k < 0) return false;
  const [x] = u.st.splice(k, 1);
  emit(s, { t: 'status', uid: u.uid, k: x.k, on: false, dispel: true });
  return true;
}

function healHero(s, i, n) {
  const P = s.players[i];
  const a = Math.min(n, P.maxHp - P.hp);
  if (a <= 0) return 0;
  P.hp += a;
  emit(s, { t: 'heal', target: heroId(i), amount: a, hp: P.hp });
  return a;
}
function healUnit(s, u, n) {
  const a = Math.min(n, u.maxHp - u.hp);
  if (a <= 0) return 0;
  u.hp += a;
  emit(s, { t: 'heal', target: u.uid, amount: a, hp: u.hp });
  return a;
}

export function damageHero(s, i, raw, src = null) {
  if (raw <= 0) return 0;
  const P = s.players[i];
  const red = heroReduction(s, i);
  const dmg = raw <= RULES.HERO_MIN_HIT ? raw : Math.max(RULES.HERO_MIN_HIT, raw - red);
  P.hp -= dmg;
  emit(s, { t: 'damage', target: heroId(i), amount: dmg, blocked: raw - dmg, hp: P.hp, src });
  checkOver(s);
  return dmg;
}
function damageUnit(s, u, dmg, { src = null, fixed = false } = {}) {
  const P = s.players[u.owner];
  if (P.res.earth > 0) dmg = Math.max(1, dmg - 1);
  u.hp -= dmg;
  emit(s, { t: 'damage', target: u.uid, amount: dmg, hp: u.hp, fixed, src });
  return dmg;
}
function reapDead(s) {
  let any = false;
  for (const P of s.players) {
    for (const u of [...P.board]) {
      if (u.hp > 0) continue;
      P.board.splice(P.board.indexOf(u), 1);
      if (u.gear) dropGear(s, u, 'death');      // 器物押在这名灵将身上，人没了，东西也碎
      P.discard.push(resetInst(s, u));
      emit(s, { t: 'die', uid: u.uid, p: P.i, id: u.id });
      any = true;
      if (u.id === 'ZL-007') { emit(s, { t: 'fx', kind: 'ink', target: heroId(opp(P.i)) }); damageHero(s, opp(P.i), 1, u.uid); }
      // 感天动地: 关汉卿 turns a friendly death into 1 damage on the enemy hero
      if (P.board.some((x) => x.id === 'LJ-014' && x.hp > 0)) { emit(s, { t: 'fx', kind: 'snow', p: P.i }); damageHero(s, opp(P.i), 1, 'LJ-014'); }
      for (const w of [...P.board]) if (w.hp > 0) runFx('onDeath', s, P.i, w, u);
      for (const w of [...(P.zhen ?? [])]) runFx('onDeath', s, P.i, w, u);
    }
  }
  if (any) { checkBonds(s, 0); checkBonds(s, 1); }
}
function checkOver(s) {
  if (s.over) return;
  const dead = s.players.filter((P) => P.hp <= 0).map((P) => P.i);
  if (!dead.length) return;
  s.over = true;
  s.winner = dead.length === 2 ? s.active : opp(dead[0]);
  emit(s, { t: 'over', winner: s.winner, reason: 'hp' });
}

// ───────────────────────────── bonds ─────────────────────────────
function checkBonds(s, i) {
  const P = s.players[i], b = bondState(s, i);
  if (b.genesis >= 1 && !P.once.genesis) {
    P.once.genesis = true;
    for (const id of ['LJ-001', 'LJ-002']) {
      const u = P.board.find((x) => x.id === id);
      if (u) { u.atk += 2; u.def += 2; emit(s, { t: 'buff', uid: u.uid, atk: 2, def: 2 }); }
    }
    emit(s, { t: 'bond', p: i, bond: 'genesis', level: 1 });
    healHero(s, i, 3);
  }
  if (b.genesis >= 2 && P.once.genesis && !P.once.genesisEnh) {
    P.once.genesisEnh = true;
    emit(s, { t: 'bond', p: i, bond: 'genesis', level: 2 });
    for (const u of P.board) { u.maxHp += 2; u.hp += 2; emit(s, { t: 'heal', target: u.uid, amount: 2, hp: u.hp }); }
  }
  if (b.genesis >= 3 && !P.once.genesisFull) {
    P.once.genesisFull = true;
    emit(s, { t: 'bond', p: i, bond: 'genesis', level: 3 });
  }
  for (const k of ['baxian', 'fengshen', 'zhensha', 'feiyi', 'shisheng', 'zhenfa', ...AUTO_BONDS.map(([x]) => x)]) {
    const was = P.bondOn[k] ?? 0;
    if (b[k] > was) {
      emit(s, { t: 'bond', p: i, bond: k, level: b[k] });
      if (k === 'shisheng' && was === 0) drawCard(s, i);
    }
    P.bondOn[k] = b[k];
  }
  if (b.zhensha >= 1) { // 驱邪入场: 定心 immunity stretches to 3
    for (const u of P.board) for (const x of u.st) if (x.k === 'immune' && x.src === 'WM-005' && !x.ext) { x.t += 1; x.ext = true; }
  }
}

// ───────────────────────────── resonance ─────────────────────────────
function endResonance(s, i, el, why) {
  const P = s.players[i];
  if (!P.res[el]) return;
  P.res[el] = 0;
  P.resCd[el] = 3;
  emit(s, { t: 'resonanceEnd', p: i, kind: el, why });
}
function onTalismanPlayed(s, i, el) {
  const P = s.players[i], O = s.players[opp(i)];
  P.resLog[el]++; P.resLog.total++;
  if (!P.resTurn.includes(el)) P.resTurn.push(el);
  // a talisman of the countering element snuffs the opponent's single-element resonance (RESONANCE §四 反制)
  for (const e of EL_KEYS) if (O.res[e] > 0 && COUNTERS[el] === e) endResonance(s, opp(i), e, 'countered');
  if (P.resLog[el] >= 2 && !P.res[el] && !P.resCd[el]) {
    P.res[el] = 2;
    emit(s, { t: 'resonance', p: i, kind: el });
    if (el === 'water') for (const u of P.board) if (card(u.id).el === 'water') addBuff(s, u, 'dodge', 99, 1);
  }
  if (!P.barrierUsed && EL_KEYS.every((e) => P.resLog[e] >= 1)) {
    P.barrierUsed = true; P.barrierTurns = 2;
    emit(s, { t: 'resonance', p: i, kind: 'barrier' });
    for (const u of P.board) { u.def += 2; emit(s, { t: 'buff', uid: u.uid, def: 2 }); }
  }
  if (P.yinyang < 2 && P.yinyangTurn !== s.turn && P.resTurn.includes('fire') && P.resTurn.includes('water')) {
    P.yinyang++; P.yinyangTurn = s.turn;
    emit(s, { t: 'resonance', p: i, kind: 'yinyang' });
    for (const u of P.board) { addBuff(s, u, 'atkUp', 1, 2); addBuff(s, u, 'defUp', 1, 2); }
    const act = EL_KEYS.filter((e) => O.res[e] > 0);
    if (act.length) endResonance(s, opp(i), pick(s, act), 'yinyang');
    else if (O.barrierTurns > 0) { O.barrierTurns = 0; emit(s, { t: 'resonanceEnd', p: opp(i), kind: 'barrier', why: 'yinyang' }); }
    healHero(s, i, 3);
  }
  if (!P.heavenUsed && P.resLog.total >= 10) {
    P.heavenUsed = true;
    emit(s, { t: 'resonance', p: i, kind: 'heaven' });
    for (let k = 0; k < 2; k++) {
      const pool = P.discard.filter((u) => card(u.id).type === 'talisman');
      const u = pick(s, pool);
      if (!u) break;
      P.discard.splice(P.discard.indexOf(u), 1); P.hand.push(u);
      emit(s, { t: 'recover', p: i, uid: u.uid, id: u.id });
    }
    healHero(s, i, P.hp < P.maxHp / 2 ? Math.ceil(P.maxHp / 2) - P.hp : 3);
  }
}

// ───────────────────────────── targeting ─────────────────────────────
/** Legal targets for playing hand card u (array of uid / 'H0'/'H1'), or null when it needs none. */
export function playTargets(s, i, u) {
  const d = card(u.id), P = s.players[i], O = s.players[opp(i)];
  switch (d.target) {
    case 'enemyGeneral': return O.board.map((x) => x.uid);
    // 专属器物只认名单上的人（gear.only）；别的卡没有这个字段，行为不变。
    case 'friendlyGeneral': return P.board.filter((x) => !d.gear?.only || d.gear.only.includes(x.id)).map((x) => x.uid);
    case 'friendlyGeneralOpt': return P.board.length ? P.board.map((x) => x.uid) : null;
    case 'enemyGeneralOrHero': return O.board.length ? O.board.map((x) => x.uid) : [heroId(opp(i))];
    default: return null;
  }
}
export function canPlay(s, i, u) {
  const d = card(u.id), P = s.players[i];
  if (s.over || s.active !== i) return false;
  if (costOf(s, i, u) > P.mana) return false;
  if (d.type === 'general' && P.board.length >= RULES.MAX_BOARD) return false;
  if ((d.target === 'enemyGeneral' || d.target === 'friendlyGeneral') && !playTargets(s, i, u).length) return false;
  return true;
}
/** 守场: a 守护 general that is not stunned must be attacked first. 器物也能给「守护」。 */
export const isGuard = (u) => !!(card(u.id).guard || gearOf(u)?.guard) && !hasSt(u, 'stun');
export function attackTargets(s, u) {
  const O = s.players[opp(u.owner)];
  const guards = O.board.filter(isGuard);
  if (guards.length) return guards.map((x) => x.uid);
  return [...O.board.map((x) => x.uid), heroId(O.i)];
}
export function canAttack(s, u) {
  const P = s.players[u.owner];
  if (s.over || s.active !== u.owner || u.sleep) return false;
  if (P.attacksUsed >= RULES.MAX_ATTACKS) return false;
  if (hasSt(u, 'stun')) return false;
  const maxA = u.id === 'LJ-003' ? 2 : 1;
  if (u.attacks >= maxA) return false;
  return atkOf(s, u) > 0;
}
export function skillTargets(s, u) {
  const t = card(u.id).skill?.target;
  if (t === 'enemyGeneral') return s.players[opp(u.owner)].board.map((x) => x.uid);
  if (t === 'friendlyGeneral') return s.players[u.owner].board.map((x) => x.uid);
  return null;
}
export function canSkill(s, u) {
  const d = card(u.id);
  if (!d.skill || u.grade < 1 || u.skillUsed || s.over || s.active !== u.owner) return false;
  if (hasSt(u, 'stun') || hasSt(u, 'seal')) return false;
  if (skillCost(s, u) > s.players[u.owner].mana) return false;
  const tg = skillTargets(s, u);
  if (tg && !tg.length) return false;
  if (u.id === 'LJ-002' && !s.players[u.owner].discard.some((x) => card(x.id).type === 'wenmai')) return false;
  if (u.id === 'LJ-005' && s.players[u.owner].freeTalisman) return false;
  if (u.id === 'LJ-014' && !s.players[opp(u.owner)].board.length) return false;
  if (u.id === 'LJ-015' && (s.players[u.owner].board.length >= RULES.MAX_BOARD
    || !s.players[u.owner].discard.some((x) => card(x.id).type === 'general' && card(x.id).cost <= 4))) return false;
  return true;
}

/** Every legal action for the active player (the AI and tests enumerate this). */
export function legalActions(s) {
  if (s.over) return [];
  const i = s.active, P = s.players[i], out = [{ type: 'end' }];
  for (const u of P.hand) {
    if (!canPlay(s, i, u)) continue;
    const tg = playTargets(s, i, u);
    if (tg) for (const t of tg) out.push({ type: 'play', uid: u.uid, target: t });
    else out.push({ type: 'play', uid: u.uid });
  }
  for (const u of P.board) {
    if (canAttack(s, u)) for (const t of attackTargets(s, u)) out.push({ type: 'attack', uid: u.uid, target: t });
    if (canSkill(s, u)) {
      const tg = skillTargets(s, u);
      if (tg) for (const t of tg) out.push({ type: 'skill', uid: u.uid, target: t });
      else out.push({ type: 'skill', uid: u.uid });
    }
  }
  return out;
}

// ───────────────────────────── actions ─────────────────────────────
export function act(s, a) {
  s.ev = [];
  if (s.over) return s.ev;
  const i = s.active;
  switch (a.type) {
    case 'play': doPlay(s, i, a); break;
    case 'attack': doAttack(s, i, a); break;
    case 'skill': doSkill(s, i, a); break;
    case 'end': endTurn(s); break;
    default: throw new Error(`bad action ${a.type}`);
  }
  reapDead(s);
  checkOver(s);
  return s.ev;
}

// ───────────────────────────── declarative effects (chapters 4–10, see cardfx.js) ─────────────────────────────
/** Primitives handed to a card's effect hook. `u` is the card doing it, `T` the relevant other card. */
function ctxFor(s, i, u, T = null) {
  const P = s.players[i], O = s.players[opp(i)];
  const c = {
    s, i, u, T, P, O, up: (u.grade ?? 0) >= 1,
    foe: () => [...O.board],
    mine: () => [...P.board],
    hurt: () => P.board.filter((x) => x.hp < x.maxHp),
    rnd: (list) => pick(s, list),
    strongest: (list) => [...list].sort((a, b) => atkOf(s, b) - atkOf(s, a))[0] ?? null,
    weakest: (list) => [...list].sort((a, b) => atkOf(s, a) - atkOf(s, b))[0] ?? null,
    has: (t, k) => hasSt(t, k),
    el: (t) => card(t.id).el,
    atk: (t) => atkOf(s, t),          // 结算后的 ATK（含光环、器物、增益），给「造成 ATK 伤害」这类效果用

    handSize: () => P.hand.length,
    wenmaiCount: () => P.wenmai.length,
    dmg: (t, n) => { if (t && t.hp > 0) damageUnit(s, t, n, { src: u.uid, fixed: true }); },
    dmgHero: (n) => damageHero(s, opp(i), n, u.uid),
    heal: (t, n) => { if (t) healUnit(s, t, n); },
    healHero: (n) => healHero(s, i, n),
    draw: (n = 1) => { for (let k = 0; k < n; k++) drawCard(s, i); },
    mana: (n = 1) => gainMana(s, i, n, u.id),
    neg: (t, k, turns, v = 0) => { if (t && t.hp > 0) applyNeg(s, t, k, CONTROL.has(k) ? ctrlTurns(s, i, turns) : turns, v, u.id); },
    buff: (t, k, turns, v = 1) => { if (t && t.hp > 0) addBuff(s, t, k, turns, v); },
    dodge: (t) => { if (t && t.hp > 0 && !hasSt(t, 'dodge')) addBuff(s, t, 'dodge', 99, 1); },
    /** 提前解除召唤失眠。前端的「能不能攻击」直接读 u.sleep，所以改状态就够了。 */
    wake: (t) => { if (t && t.hp > 0) t.sleep = false; },
    cleanse: (t) => { if (t) cleanse(s, t); },
    /** 驱散对方身上的增益，n 次。给「火眼金睛」这类看破的效果用。 */
    dispel: (t, n = 1) => { if (t) for (let k = 0; k < n; k++) dispelOne(s, t); },
    immune: (t, turns) => {
      if (!t || t.hp <= 0) return;
      const ex = t.st.find((x) => x.k === 'immune');
      if (ex) ex.t = Math.max(ex.t, turns); else t.st.push({ k: 'immune', t: turns, v: 0, src: u.id });
      emit(s, { t: 'status', uid: t.uid, k: 'immune', on: true });
    },
    /** Pull one matching card out of the discard pile into hand. */
    recover: (fn) => {
      const r = pick(s, P.discard.filter((x) => fn(card(x.id), x)));
      if (!r) return null;
      P.discard.splice(P.discard.indexOf(r), 1); P.hand.push(r);
      emit(s, { t: 'recover', p: i, uid: r.uid, id: r.id });
      return r;
    },
    /** Put one matching general from the discard pile straight onto the board. */
    summonFrom: (fn) => {
      if (P.board.length >= RULES.MAX_BOARD) return null;
      const g = pick(s, P.discard.filter((x) => fn(card(x.id), x)));
      if (!g) return null;
      P.discard.splice(P.discard.indexOf(g), 1); P.board.push(g);
      emit(s, { t: 'summon', p: i, uid: g.uid, id: g.id, unit: structuredClone(g) });
      summonEffect(s, i, g);
      checkBonds(s, i);
      return g;
    },
    costDown: (type) => {
      const w = P.hand.find((x) => (type === 'any' || card(x.id).type === type) && x.costMod >= 0);
      if (w) { w.costMod = -1; emit(s, { t: 'costMod', uid: w.uid }); }
    },
    burnHand: (n = 1) => {
      for (let k = 0; k < n; k++) {
        const x = pick(s, O.hand);
        if (!x) break;
        O.hand.splice(O.hand.indexOf(x), 1); O.discard.push(x);
        emit(s, { t: 'discard', p: O.i, uid: x.uid, id: x.id, why: 'burn' });
      }
    },
    /** Permanent stat edit that the view should re-read. */
    mark: (t, stat, delta) => emit(s, { t: 'buff', uid: t.uid, [stat]: delta }),
    oncePerTurn: (key) => { P.fxOnce ??= {}; if (P.fxOnce[key] === s.turn) return false; P.fxOnce[key] = s.turn; return true; },
    fx: (kind, extra = {}) => emit(s, { t: 'fx', kind, p: i, uid: u.uid, ...extra }),
  };
  return c;
}
function runFx(hook, s, i, u, T = null) {
  FX[u.id]?.[hook]?.(ctxFor(s, i, u, T));
  // 器物的钩子挂在佩戴者身上：c.u 还是那名灵将（卡面文案因此一律写「佩戴者」），
  // 但 c.up 得看器物自己的品阶，不是灵将的。
  const g = u.gear && FX[u.gear.id]?.[hook];
  if (g) { const c = ctxFor(s, i, u, T); c.up = (u.gear.grade ?? 0) >= 1; g(c); }
}

function bumpPlayed(s, i) {
  const P = s.players[i], fy = bondState(s, i).feiyi;
  P.played++;
  if (fy >= 2 && P.played % 2 === 0 && P.craftGain < (fy >= 3 ? 8 : 5)) { P.craftGain++; gainMana(s, i, 1, 'feiyi'); }
  else if (fy === 1 && inWenmai(P, 'WM-007') && P.played % 3 === 0 && P.craftGain < 3) { P.craftGain++; gainMana(s, i, 1, 'WM-007'); }
}
function gainMana(s, i, n, why) {
  const P = s.players[i];
  P.mana = Math.min(RULES.MAX_MANA, P.mana + n);
  emit(s, { t: 'mana', p: i, mana: P.mana, gain: n, why });
}

function doPlay(s, i, a) {
  const P = s.players[i], O = s.players[opp(i)];
  const k = P.hand.findIndex((u) => u.uid === a.uid);
  if (k < 0) throw new Error('card not in hand');
  const u = P.hand[k], d = card(u.id);
  if (!canPlay(s, i, u)) throw new Error(`cannot play ${u.id}`);
  const tg = playTargets(s, i, u);
  if (tg && d.target !== 'friendlyGeneralOpt' && !tg.includes(a.target)) throw new Error('bad target');
  if (d.target === 'friendlyGeneralOpt' && a.target && !tg?.includes(a.target)) throw new Error('bad target');
  const cost = costOf(s, i, u);
  if (d.type === 'talisman' && P.freeTalisman && d.cost <= 3) P.freeTalisman = false;
  P.mana -= cost;
  P.hand.splice(k, 1);
  u.costMod = 0; delete u.recovered;
  emit(s, { t: 'play', p: i, uid: u.uid, id: u.id, cost, target: a.target ?? null, mana: P.mana });

  if (d.type === 'general') {
    P.board.push(u);
    emit(s, { t: 'summon', p: i, uid: u.uid, id: u.id, unit: structuredClone(u) });
    summonEffect(s, i, u);
    if (P.kunlun > 0 && P.kunlunUp) drawCard(s, i);
  } else if (d.type === 'talisman') {
    P.talismansThisTurn++;
    talismanEffect(s, i, u, a.target);
    for (const x of P.board) if (x.id === 'LJ-010') addBuff(s, x, 'atkUp', 1, 1);
    P.discard.push(u);
    emit(s, { t: 'discard', p: i, uid: u.uid, id: u.id });
    reapDead(s);
    if (P.res.fire > 0 && !s.over) { // 朱雀燎原: every talisman singes for 1 more
      const t = pick(s, O.board);
      if (t) damageUnit(s, t, 1, { src: 'fire', fixed: true }); else damageHero(s, O.i, 1, 'fire');
      reapDead(s);
    }
    onTalismanPlayed(s, i, d.el);
  } else if (d.type === 'artifact') {
    equipGear(s, i, u, a.target);
  } else if (d.type === 'formation') {
    if (P.zhen.length >= RULES.MAX_ZHEN) {
      const old = P.zhen.shift();
      P.discard.push(old);
      emit(s, { t: 'zhenOut', p: i, uid: old.uid, id: old.id, why: 'full' });
    }
    P.zhen.push(u);
    emit(s, { t: 'zhen', p: i, uid: u.uid, id: u.id });
    runFx('play', s, i, u, a.target ? findUnit(s, a.target) : null);
  } else {
    if (P.wenmai.length >= RULES.MAX_WENMAI) {
      const old = P.wenmai.shift();
      P.discard.push(old);
      emit(s, { t: 'wenmaiOut', p: i, uid: old.uid, id: old.id, why: 'full' });
    }
    P.wenmai.push(u);
    emit(s, { t: 'wenmai', p: i, uid: u.uid, id: u.id });
    wenmaiEffect(s, i, u, a.target);
  }
  checkBonds(s, i);
  bumpPlayed(s, i);
}

/** 把器物挂到 host 身上。身上已有的那件先卸下来。 */
function equipGear(s, i, u, targetUid) {
  const host = findUnit(s, targetUid);
  if (!host || host.owner !== i) throw new Error('bad gear target');
  if (host.gear) dropGear(s, host, 'replaced');
  host.gear = u;
  const g = gearOf(host);
  if (g.hp) { host.maxHp += g.hp; host.hp += g.hp; }
  emit(s, { t: 'equip', p: i, uid: host.uid, gearUid: u.uid, id: u.id, unit: structuredClone(host) });
  runFx('equip', s, i, host);
}
/**
 * 器物离身，进弃牌堆。灵将阵亡时也走这里（`why: 'death'`），那种情况 HP 已经没意义了。
 * 换装时要把 gear.hp 还回去——还回去之后可能只剩 0，所以兜底留 1 点，不让「换个器物」变成自杀。
 */
function dropGear(s, host, why) {
  const u = host.gear;
  if (!u) return null;
  const g = gearOf(host);
  host.gear = null;
  if (g.hp && why !== 'death') {
    host.maxHp = Math.max(1, host.maxHp - g.hp);
    host.hp = Math.max(1, Math.min(host.hp, host.maxHp));
  }
  s.players[u.owner].discard.push(resetInst(s, u));
  emit(s, { t: 'unequip', p: u.owner, uid: host.uid, gearUid: u.uid, id: u.id, why });
  return u;
}

function summonEffect(s, i, u) {
  const P = s.players[i], O = s.players[opp(i)];
  switch (u.id) {
    case 'LJ-001':
      emit(s, { t: 'fx', kind: 'kaitian', p: i, uid: u.uid });
      for (const t of [...O.board]) damageUnit(s, t, 2, { src: u.uid, fixed: true });
      break;
    case 'LJ-002': healHero(s, i, 3); break;
    case 'LJ-007': P.litTurn = s.turn; emit(s, { t: 'fx', kind: 'lit', p: i, uid: u.uid }); break;
    case 'LJ-008': {
      const t = [...O.board].sort((a, b) => atkOf(s, b) - atkOf(s, a))[0];
      if (t) applyNeg(s, t, 'atkDown', 1, 2, u.id);
      break;
    }
    case 'ZL-003': {
      const t = [...O.board].sort((a, b) => atkOf(s, b) - atkOf(s, a))[0];
      if (t) applyNeg(s, t, 'seal', 1, 0, u.id);
      break;
    }
    case 'ZL-005': {
      const t = pick(s, O.board);
      if (t) applyNeg(s, t, 'stun', 1, 0, u.id);
      break;
    }
    case 'LJ-010': emit(s, { t: 'fx', kind: 'poem', p: i, uid: u.uid }); drawCard(s, i); break;
    case 'LJ-012': {
      const t = pick(s, O.board);
      emit(s, { t: 'fx', kind: 'river', p: i, target: t ? t.uid : heroId(opp(i)) });
      if (t) damageUnit(s, t, 3, { src: u.uid, fixed: true }); else damageHero(s, opp(i), 2, u.uid);
      break;
    }
    case 'ZL-009':
      emit(s, { t: 'fx', kind: 'string', p: i });
      for (const t of O.board) applyNeg(s, t, 'atkDown', 1, 1, u.id);
      break;
    case 'LJ-015': {
      const g = pick(s, P.discard.filter((x) => card(x.id).type === 'general'));
      if (g) {
        P.discard.splice(P.discard.indexOf(g), 1); P.hand.push(g);
        emit(s, { t: 'fx', kind: 'huanhun', p: i, uid: u.uid });
        emit(s, { t: 'recover', p: i, uid: g.uid, id: g.id });
      }
      break;
    }
    case 'LJ-017':
      emit(s, { t: 'fx', kind: 'shuimo', p: i });
      for (const t of O.board) applyNeg(s, t, 'seal', 1, 0, u.id);
      break;
    case 'ZL-015': {
      const t = pick(s, O.board);
      if (t) applyNeg(s, t, 'seal', ctrlTurns(s, i, 2), 0, u.id);
      break;
    }
  }
  runFx('summon', s, i, u);
  // a new general arriving under an active 五行/玄武 resonance still gets the per-unit bits
  if (P.res.water > 0 && card(u.id).el === 'water') addBuff(s, u, 'dodge', 99, 1);
}

function ctrlTurns(s, i, base) { return base + (s.players[i].res.water > 0 ? 1 : 0); }

function talismanEffect(s, i, u, target) {
  const P = s.players[i], O = s.players[opp(i)], up = u.grade >= 1;
  const T = target ? findUnit(s, target) : null;
  switch (u.id) {
    case 'FL-001':
      addBuff(s, T, 'defUp', 2, 3);
      if (up) addBuff(s, T, 'reflect', 2, 1);
      break;
    case 'FL-002': {
      const n = P.talismansThisTurn > 1 ? 3 : 2;
      for (let k = 0; k < n; k++) drawCard(s, i);
      if (up) { const w = P.hand.find((x) => card(x.id).type === 'wenmai' && x.costMod >= 0); if (w) { w.costMod = -1; emit(s, { t: 'costMod', uid: w.uid }); } }
      break;
    }
    case 'FL-003': {
      const t = ctrlTurns(s, i, up ? 2 : 1);
      if (applyNeg(s, T, 'stun', t, 0, u.id) && up) applyNeg(s, T, 'atkDown', t, 2, u.id);
      break;
    }
    case 'FL-004': {
      emit(s, { t: 'fx', kind: 'fentian', p: i });
      for (const t of [...O.board]) damageUnit(s, t, up ? 3 : 2, { src: u.uid, fixed: true });
      const withBuff = O.board.filter((x) => x.hp > 0 && x.st.some((y) => BUFF.has(y.k)));
      if (withBuff.length) dispelOne(s, pick(s, withBuff));
      else if (O.wenmai.length) burnWenmai(s, opp(i));
      break;
    }
    case 'FL-005': {
      const t = ctrlTurns(s, i, 2);
      if (applyNeg(s, T, 'seal', t, 0, u.id) && up) applyNeg(s, T, 'defDown', t, 2, u.id);
      break;
    }
    case 'FL-006':
    case 'ZL-006': {
      const zl = u.id === 'ZL-006';
      if (T) { emit(s, { t: 'fx', kind: zl ? 'mist' : 'thunder', target: T.uid }); damageUnit(s, T, zl ? 3 : up ? 7 : 5, { src: u.uid, fixed: true }); if (up && !zl) dispelOne(s, T); }
      else { emit(s, { t: 'fx', kind: zl ? 'mist' : 'thunder', target: heroId(opp(i)) }); damageHero(s, opp(i), zl ? 2 : 3, u.uid); }
      break;
    }
    case 'ZL-012':
      emit(s, { t: 'fx', kind: 'ink', target: T.uid });
      damageUnit(s, T, 3, { src: u.uid, fixed: true });
      if (T.hp > 0) applyNeg(s, T, 'seal', ctrlTurns(s, i, 1), 0, u.id);
      break;
    case 'ZL-018':
      emit(s, { t: 'fx', kind: 'curtain', target: T.uid });
      if (applyNeg(s, T, 'stun', ctrlTurns(s, i, 1), 0, u.id)) applyNeg(s, T, 'defDown', 2, 2, u.id);
      break;
  }
  runFx('play', s, i, u, T);
}
function burnWenmai(s, i) {
  const P = s.players[i];
  const w = P.wenmai.pop();
  if (!w) return;
  if (w.id === 'WM-006') P.kunlun = 0;
  P.discard.push(w);
  emit(s, { t: 'wenmaiOut', p: i, uid: w.uid, id: w.id, why: 'burn' });
  checkBonds(s, i);
}

function wenmaiEffect(s, i, u, target) {
  const P = s.players[i], up = u.grade >= 1;
  switch (u.id) {
    case 'WM-003': if (up) drawCard(s, i); break;
    case 'WM-005': {
      const T = target ? findUnit(s, target) : null;
      if (T) {
        cleanse(s, T);
        const zs = onBoard(P, 'LJ-004');
        T.st.push({ k: 'immune', t: (up ? 3 : 2) + (zs ? 1 : 0), v: 0, src: 'WM-005', ext: zs });
        emit(s, { t: 'status', uid: T.uid, k: 'immune', on: true });
      }
      break;
    }
    case 'WM-006': P.kunlun = up ? 5 : 3; P.kunlunUp = up; emit(s, { t: 'fx', kind: 'kunlun', p: i }); break;
    case 'WM-007': if (up) healHero(s, i, 2); break;
    case 'WM-010':
      emit(s, { t: 'fx', kind: 'embroider', p: i });
      for (const x of P.board) { x.def += 1; emit(s, { t: 'buff', uid: x.uid, def: 1 }); }
      break;
  }
  runFx('play', s, i, u, target ? findUnit(s, target) : null);
}

function strike(s, att, T, mult = 1, { fixedAtk = null, src = 'attack' } = {}) {
  const P = s.players[att.owner];
  const dA = card(att.id), dT = card(T.id);
  let atk = fixedAtk ?? atkOf(s, att, T);
  if (att.id === 'LJ-004' && isMarked(T)) atk += 3;
  const countered = dA.el && COUNTERS[dA.el] === dT.el;
  let raw = Math.floor(atk * mult * (countered ? RULES.ELEMENT_MULT : 1));
  if (src === 'attack') {
    const dg = T.st.find((x) => x.k === 'dodge');
    if (dg) {
      T.st.splice(T.st.indexOf(dg), 1);
      emit(s, { t: 'dodge', uid: T.uid });
      return { dmg: 0, countered };
    }
  }
  let dmg = Math.max(1, raw - defOf(s, T));
  const marked = isMarked(T);
  dmg = damageUnit(s, T, dmg, { src: att.uid });
  if (countered) emit(s, { t: 'counter', uid: T.uid, from: att.uid });
  if (P.litTurn === s.turn && marked) damageUnit(s, T, 1, { src: 'lit', fixed: true });
  if (att.id === 'LJ-005' && T.hp > 0) applyNeg(s, T, 'bleed', 2, 1, att.id);
  if (att.id === 'ZL-002' && T.hp > 0 && T.def > 0) { T.def -= 1; emit(s, { t: 'buff', uid: T.uid, def: -1 }); }
  if (att.id === 'ZL-017' && T.hp > 0 && T.atk > 0) { T.atk -= 1; emit(s, { t: 'buff', uid: T.uid, atk: -1 }); }
  if (T.id === 'ZL-014' && T.hp > 0 && src === 'attack') applyNeg(s, att, 'atkDown', 1, 1, T.id);   // 油彩
  if (src === 'attack') {
    runFx('onHit', s, att.owner, att, T);
    if (T.hp > 0) runFx('whenHit', s, T.owner, T, att);
  }
  return { dmg, countered };
}

function doAttack(s, i, a) {
  const P = s.players[i];
  const u = P.board.find((x) => x.uid === a.uid);
  if (!u || !canAttack(s, u)) throw new Error('cannot attack');
  const tg = attackTargets(s, u);
  if (!tg.includes(a.target)) throw new Error('bad attack target');
  u.attacks++; P.attacksUsed++;
  emit(s, { t: 'attack', p: i, uid: u.uid, target: a.target });
  let hit = false;
  if (a.target.startsWith('H')) {
    hit = damageHero(s, opp(i), atkOf(s, u), u.uid) > 0;
  } else {
    const T = findUnit(s, a.target);
    const r = strike(s, u, T);
    hit = r.dmg > 0;
    if (T.hp > 0 && hasSt(T, 'reflect') && hit) {
      const rf = T.st.find((x) => x.k === 'reflect');
      damageUnit(s, u, rf.v, { src: T.uid, fixed: true });
    }
  }
  if (hit && u.id === 'LJ-003' && P.nezhaTurn !== s.turn) { P.nezhaTurn = s.turn; gainMana(s, i, 1, 'fengshen'); }
  if ((u.id === 'LJ-013' || u.id === 'ZL-011') && u.hp > 0 && !hasSt(u, 'dodge')) addBuff(s, u, 'dodge', 99, 1);
  if (u.id === 'ZL-013' && u.hp > 0) damageUnit(s, u, 1, { src: 'duanxian', fixed: true });
  if (u.hp > 0) runFx('afterAttack', s, i, u, a.target.startsWith('H') ? null : findUnit(s, a.target));
}

function doSkill(s, i, a) {
  const P = s.players[i];
  const u = P.board.find((x) => x.uid === a.uid);
  if (!u || !canSkill(s, u)) throw new Error('cannot use skill');
  const tg = skillTargets(s, u);
  if (tg && !tg.includes(a.target)) throw new Error('bad skill target');
  const cost = skillCost(s, u);
  P.mana -= cost;
  u.skillUsed = true;
  emit(s, { t: 'skill', p: i, uid: u.uid, id: u.id, target: a.target ?? null, cost, mana: P.mana });
  const T = a.target ? findUnit(s, a.target) : null;
  switch (u.id) {
    case 'LJ-001': strike(s, u, T, 1.5, { src: 'skill' }); if (T.hp > 0) applyNeg(s, T, 'stun', 1, 0, u.id); break;
    case 'LJ-002': {
      const w = pick(s, P.discard.filter((x) => card(x.id).type === 'wenmai'));
      P.discard.splice(P.discard.indexOf(w), 1); P.hand.push(w);
      emit(s, { t: 'recover', p: i, uid: w.uid, id: w.id });
      break;
    }
    case 'LJ-003': for (let k = 0; k < 3 && T.hp > 0; k++) strike(s, u, T, 0.5, { src: 'skill' }); break;
    case 'LJ-004': applyNeg(s, T, 'stun', 1, 0, u.id); break;
    case 'LJ-005': P.freeTalisman = true; emit(s, { t: 'fx', kind: 'freeTalisman', p: i }); break;
    case 'LJ-006': healUnit(s, T, 4); cleanse(s, T, 1); break;
    case 'LJ-007': healHero(s, i, 2); break;
    case 'LJ-008': addBuff(s, T, 'dodge', 99, 1); break;
    case 'LJ-009': applyNeg(s, T, 'atkDown', 2, 2, u.id); break;
    case 'LJ-010': {
      const O = s.players[opp(i)];
      emit(s, { t: 'fx', kind: 'poem', p: i, uid: u.uid, aoe: true });
      for (const t of [...O.board]) damageUnit(s, t, 2, { src: u.uid, fixed: true });
      break;
    }
    case 'LJ-011': cleanse(s, T); addBuff(s, T, 'defUp', 2, 2); break;
    case 'LJ-012':
      for (const x of P.board) {
        cleanse(s, x);
        const ex = x.st.find((y) => y.k === 'immune');
        if (ex) ex.t = Math.max(ex.t, 2); else x.st.push({ k: 'immune', t: 2, v: 0, src: 'LJ-012' });
        emit(s, { t: 'status', uid: x.uid, k: 'immune', on: true });
      }
      break;
    case 'LJ-013':
      emit(s, { t: 'fx', kind: 'sword', target: T.uid });
      damageUnit(s, T, 4, { src: u.uid, fixed: true });
      break;
    case 'LJ-014': {
      const O = s.players[opp(i)];
      emit(s, { t: 'fx', kind: 'snow', p: i });
      const top = [...O.board].sort((a, b) => atkOf(s, b) - atkOf(s, a))[0];
      for (const t of [...O.board]) damageUnit(s, t, 1, { src: u.uid, fixed: true });
      if (top && top.hp > 0) applyNeg(s, top, 'stun', 1, 0, u.id);
      break;
    }
    case 'LJ-015': {
      const pool = P.discard.filter((x) => card(x.id).type === 'general' && card(x.id).cost <= 4);
      const g = pick(s, pool);
      if (g) {
        P.discard.splice(P.discard.indexOf(g), 1);
        P.board.push(g);
        emit(s, { t: 'fx', kind: 'huanhun', p: i, uid: u.uid });
        emit(s, { t: 'summon', p: i, uid: g.uid, id: g.id, unit: structuredClone(g) });
        summonEffect(s, i, g);
        checkBonds(s, i);
      }
      break;
    }
    case 'LJ-016': {
      drawCard(s, i);
      const w = P.hand.find((x) => card(x.id).type === 'wenmai' && x.costMod >= 0);
      if (w) { w.costMod = -1; emit(s, { t: 'costMod', uid: w.uid }); }
      break;
    }
    case 'LJ-017':
      if (applyNeg(s, T, 'stun', 1, 0, u.id)) applyNeg(s, T, 'atkDown', 2, 1, u.id);
      break;
  }
  runFx('skill', s, i, u, T);
}

// ───────────────────────────── turn flow ─────────────────────────────
function startTurn(s) {
  const i = s.active, P = s.players[i];
  s.turn++;
  P.turns++;
  P.maxMana = Math.min(RULES.MAX_MANA, P.turns + (i === s.first && P.turns === 1 ? 1 : 0) + (P.turns === 1 ? P.boon.mana : 0));
  P.mana = P.maxMana;
  P.attacksUsed = 0; P.talismansThisTurn = 0; P.resTurn = [];
  emit(s, { t: 'turn', p: i, turn: s.turn, mana: P.mana, maxMana: P.maxMana });
  for (const u of P.board) {
    u.sleep = false; u.attacks = 0; u.skillUsed = false;
    if (u.ctrl >= RULES.CTRL_CAP) { // 连续控制上限: a third turn of control is refused
      const had = u.st.some((x) => CONTROL.has(x.k));
      u.st = u.st.filter((x) => !CONTROL.has(x.k));
      u.ctrl = 0;
      if (had) { u.st.push({ k: 'ctrlImmune', t: 1, v: 0 }); emit(s, { t: 'status', uid: u.uid, k: 'ctrlCap', on: false }); }
    }
  }
  // draw (the first player skips the very first draw); an empty deck when a draw is due loses the game
  if (!(i === s.first && P.turns === 1)) {
    if (!P.deck.length) {
      P.fatigue = true;
      s.over = true; s.winner = opp(i);
      emit(s, { t: 'over', winner: s.winner, reason: 'deck' });
      return;
    }
    drawCard(s, i);
    if (P.res.wood > 0) drawCard(s, i);
  }
  // turn-start triggers
  if (P.boon.regen) healHero(s, i, P.boon.regen);
  for (const w of [...P.wenmai]) {
    if (w.id === 'WM-001') healHero(s, i, 1);
    if (w.id === 'WM-004') {
      const lim = w.grade >= 1 ? 3 : 2;
      const pool = P.discard.filter((x) => card(x.id).cost <= lim && x.id !== P.lastRecovered);
      pool.sort((a, b) => card(b.id).cost - card(a.id).cost || (card(a.id).type === 'general' ? -1 : 1));
      const r = pool[0];
      if (r) {
        P.discard.splice(P.discard.indexOf(r), 1);
        P.hand.push(r); P.lastRecovered = r.id; r.recovered = true;
        if (bondState(s, i).feiyi === 1) r.costMod = -1;   // 匠心活化 (孤立自激活)
        emit(s, { t: 'recover', p: i, uid: r.uid, id: r.id, from: 'WM-004' });
        if (w.grade >= 1) gainMana(s, i, 1, 'WM-004');
      }
    }
    if (w.id === 'WM-008' && P.hand.length < (w.grade >= 1 ? 4 : 3)) drawCard(s, i);
    if (w.id === 'WM-009') { gainMana(s, i, 1, 'WM-009'); if (w.grade >= 1) healHero(s, i, 1); }
    if (w.id === 'WM-010') { const t = pick(s, P.board.filter((x) => x.hp < x.maxHp)); if (t) healUnit(s, t, w.grade >= 1 ? 2 : 1); }
    if (w.id === 'WM-011') {   // 易聚易散
      const full = P.hand.length >= 5;
      if (full || w.grade >= 1) gainMana(s, i, 1, 'WM-011');
      if (!full || w.grade >= 1) drawCard(s, i);
    }
  }
  if (bondState(s, i).shisheng >= 2) healHero(s, i, 1);
  for (const w of [...P.wenmai]) runFx('turn', s, i, w);
  for (const w of [...(P.zhen ?? [])]) runFx('turn', s, i, w);
  for (const u of [...P.board]) runFx('turn', s, i, u);
  const bs = bondState(s, i);
  for (const [k, B] of AUTO_BONDS) {   // level-2 perk of a chapter bond
    if (bs[k] < 2) continue;
    if (B.auto.perk === 'draw') drawCard(s, i);
    else if (B.auto.perk === 'mana') gainMana(s, i, 1, k);
    else if (B.auto.perk === 'heal') healHero(s, i, 2);
  }
  const pas = PASSIVES[P.passive];
  if (pas && P.turns % pas.every === 0) pas.run(ctxFor(s, i, P.board[0] ?? { uid: heroId(i), id: P.passive, owner: i, grade: 0 }));
  reapDead(s);
}

function endTurn(s) {
  const i = s.active, P = s.players[i];
  emit(s, { t: 'endTurn', p: i });
  while (P.hand.length > RULES.MAX_HAND + P.boon.handCap) {
    const u = P.hand.pop();
    P.discard.push(u);
    emit(s, { t: 'discard', p: i, uid: u.uid, id: u.id, why: 'handLimit' });
  }
  for (const u of P.board) if (u.id === 'LJ-006') {
    const hurt = P.board.filter((x) => x.hp < x.maxHp);
    const t = pick(s, hurt);
    if (t) healUnit(s, t, 1);
  }
  for (const u of P.board) {
    if (u.id === 'LJ-011') for (const x of P.board) healUnit(s, x, 1);
    if (u.id === 'ZL-010') healHero(s, i, 1);
    if (u.id === 'ZL-016') { const t = pick(s, P.board.filter((x) => x.hp < x.maxHp)); if (t) healUnit(s, t, 2); }
  }
  for (const u of [...P.board]) runFx('endTurn', s, i, u);
  for (const u of [...P.board]) {
    const b = u.st.find((x) => x.k === 'bleed');
    if (b) damageUnit(s, u, b.v || 1, { src: 'bleed', fixed: true });
  }
  reapDead(s);
  if (s.over) return;
  for (const u of P.board) {
    u.ctrl = u.st.some((x) => CONTROL.has(x.k)) ? u.ctrl + 1 : 0;
    u.st = u.st.filter((x) => {
      if (x.t >= 99) return true;
      x.t--;
      if (x.t <= 0) { emit(s, { t: 'status', uid: u.uid, k: x.k, on: false }); return false; }
      return true;
    });
  }
  for (const e of EL_KEYS) {
    if (P.res[e] > 0) { P.res[e]--; if (!P.res[e]) { P.resCd[e] = 3; emit(s, { t: 'resonanceEnd', p: i, kind: e, why: 'time' }); } }
    else if (P.resCd[e] > 0) P.resCd[e]--;
  }
  if (P.barrierTurns > 0 && --P.barrierTurns === 0) emit(s, { t: 'resonanceEnd', p: i, kind: 'barrier', why: 'time' });
  if (P.kunlun > 0 && --P.kunlun === 0) {
    const w = P.wenmai.find((x) => x.id === 'WM-006');
    if (w) { P.wenmai.splice(P.wenmai.indexOf(w), 1); P.discard.push(w); emit(s, { t: 'wenmaiOut', p: i, uid: w.uid, id: w.id, why: 'expire' }); }
  }
  P.freeTalisman = false;
  for (const u of P.hand) if (u.costMod < 0 && card(u.id).type === 'wenmai' && !u.recovered) u.costMod = 0;
  s.active = opp(i);
  startTurn(s);
}

/** Put a fresh card straight into a zone (tests, debug console). Generals arrive awake. */
export function spawn(s, i, id, { grade = 0, zone = 'board' } = {}) {
  const u = makeInst(s, i, id, grade);
  if (u.st) u.sleep = zone !== 'board';
  s.players[i][zone].push(u);
  if (zone === 'board' || zone === 'wenmai' || zone === 'zhen') checkBonds(s, i);
  return u;
}

// ───────────────────────────── view helpers ─────────────────────────────
export function unitView(s, u) {
  return { atk: atkOf(s, u), def: defOf(s, u), hp: u.hp, maxHp: u.maxHp, gear: u.gear?.id ?? null,
    canAttack: canAttack(s, u), canSkill: canSkill(s, u), st: u.st.map((x) => x.k) };
}
export { rand, randInt };
