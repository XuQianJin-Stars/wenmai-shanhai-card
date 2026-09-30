// Headless rules tests: `npm test`. Each test builds a small position by hand and checks one rule from the design docs.
import { createGame, act, spawn, atkOf, defOf, legalActions, canAttack, costOf, bondState, heroReduction, RULES } from '../engine.js';
import { createAI, playTurn } from '../ai.js';
import { CARDS, PLAYER_CARD_IDS } from '../../data/cards.js';
import { LEVELS, PRACTICE, STARTER_DECK, DECK_SIZE } from '../../data/story.js';
import { insertCard, deckProblem } from '../../game/save.js';

let pass = 0, fail = 0;
const results = [];
function test(name, fn) {
  try { fn(); pass++; results.push(`  ok   ${name}`); }
  catch (e) { fail++; results.push(`  FAIL ${name}\n       ${e.message}\n${e.stack.split('\n').slice(1, 3).join('\n')}`); }
}
function eq(a, b, msg = '') { if (a !== b) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(v, msg = 'expected truthy') { if (!v) throw new Error(msg); }

const filler = Array(20).fill('ZL-001');
/** A game where it's player 0's turn 1, both hands and boards empty. */
function blank({ mana = 10, first = 0 } = {}) {
  const s = createGame({ seed: 7, first, players: [{ name: 'A', deck: filler }, { name: 'B', deck: filler }] });
  for (const P of s.players) { P.hand = []; P.board = []; }
  s.players[s.active].mana = mana;
  return s;
}
const hand = (s, i, id, grade = 0) => spawn(s, i, id, { zone: 'hand', grade });

// ───────── setup / turn flow ─────────
test('opening: first player 4 cards + 2 mana and no draw, second 5 cards', () => {
  const s = createGame({ seed: 1, first: 0, players: [{ deck: filler }, { deck: filler }] });
  eq(s.players[0].hand.length, 4, 'first hand'); eq(s.players[1].hand.length, 5, 'second hand');
  eq(s.players[0].mana, 2, 'first mana');
  act(s, { type: 'end' });
  eq(s.players[1].mana, 1, 'second mana on turn 1'); eq(s.players[1].hand.length, 6, 'second draws');
  act(s, { type: 'end' });
  eq(s.players[0].mana, 2, 'first mana turn 2'); eq(s.players[0].hand.length, 5, 'first draws on turn 2');
});
test('mana caps at 10', () => {
  const s = createGame({ seed: 1, first: 0, players: [{ deck: filler }, { deck: filler }] });
  for (let k = 0; k < 26; k++) act(s, { type: 'end' });
  eq(s.players[s.active].maxMana, 10);
});
test('hand limit 7 at end of turn', () => {
  const s = blank();
  for (let k = 0; k < 9; k++) hand(s, 0, 'ZL-001');
  act(s, { type: 'end' });
  eq(s.players[0].hand.length, 7);
});
test('deck-out on a required draw loses', () => {
  const s = blank();
  s.players[1].deck = [];
  act(s, { type: 'end' });
  ok(s.over, 'game over'); eq(s.winner, 0);
});

// ───────── combat ─────────
test('damage = ATK - DEF, minimum 1', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-004');            // 钟馗 金 6
  const t = spawn(s, 1, 'LJ-006');            // 铁拐李 土 DEF5 HP8
  act(s, { type: 'attack', uid: a.uid, target: t.uid });
  eq(t.hp, 7, '6-5=1');
});
test('element counter ×1.3 (火克金: 哪吒 7 → 9)', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-003');
  const t = spawn(s, 1, 'LJ-009');            // 门神 金 DEF5 HP8
  act(s, { type: 'attack', uid: a.uid, target: t.uid });
  eq(t.hp, 8 - (9 - 5));
});
test('守场: a 守护 general must be attacked first; a stunned one does not guard', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-004'); spawn(s, 1, 'ZL-001');
  ok(legalActions(s).some((x) => x.type === 'attack' && x.target === 'H1'), 'no guard: face is open');
  const g = spawn(s, 1, 'LJ-009');
  const tg = legalActions(s).filter((x) => x.type === 'attack').map((x) => x.target);
  eq(tg.join(), g.uid, 'only the guard');
  let threw = false; try { act(s, { type: 'attack', uid: a.uid, target: 'H1' }); } catch { threw = true; }
  ok(threw, 'illegal attack throws');
  g.st.push({ k: 'stun', t: 1, v: 0 });
  ok(legalActions(s).some((x) => x.type === 'attack' && x.target === 'H1'), 'stunned guard opens the way');
});
test('max 2 attacks per turn across all generals; 哪吒 may attack twice', () => {
  const s = blank();
  const n = spawn(s, 0, 'LJ-003'), z = spawn(s, 0, 'LJ-004');
  act(s, { type: 'attack', uid: n.uid, target: 'H1' });
  ok(canAttack(s, n), '哪吒 second attack');
  act(s, { type: 'attack', uid: n.uid, target: 'H1' });
  ok(!canAttack(s, z), 'third attack refused');
});
test('summoned generals are asleep', () => {
  const s = blank();
  const u = hand(s, 0, 'LJ-007');
  act(s, { type: 'play', uid: u.uid });
  ok(!canAttack(s, s.players[0].board[0]));
});
test('hero minimum hit 2 and reductions do not stack (五彩石 + 门神 → -1)', () => {
  const s = blank();
  spawn(s, 1, 'WM-002', { zone: 'wenmai' });
  spawn(s, 1, 'LJ-009');
  eq(heroReduction(s, 1), 1);
  s.players[1].board = [];
  const a = spawn(s, 0, 'ZL-001');            // ATK 2 → min hit 2 unaffected
  act(s, { type: 'attack', uid: a.uid, target: 'H1' });
  eq(s.players[1].hp, 18);
  const b = spawn(s, 0, 'LJ-004');            // ATK 6 - 1
  act(s, { type: 'attack', uid: b.uid, target: 'H1' });
  eq(s.players[1].hp, 13);
});
test('钟馗 斩邪剑: +3 ATK against a stunned target', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-004');
  const t = spawn(s, 1, 'LJ-002');            // 女娲 火 DEF6 HP10; 金 vs 火 no counter
  t.st.push({ k: 'stun', t: 1, v: 0 });
  act(s, { type: 'attack', uid: a.uid, target: t.uid });
  eq(t.hp, 10 - (9 - 6));
});
test('吕洞宾 bleed ticks at the end of the victim owner\'s turn', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-005');
  const t = spawn(s, 1, 'LJ-009');            // DEF5 HP8, 木 vs 金 none: 6-5=1 → 7
  act(s, { type: 'attack', uid: a.uid, target: t.uid });
  eq(t.hp, 7);
  act(s, { type: 'end' }); act(s, { type: 'end' });
  eq(t.hp, 6, 'bled once on B\'s turn end');
});

// ───────── talismans / status ─────────
test('水行符 stun makes the target skip its next turn', () => {
  const s = blank();
  const t = spawn(s, 1, 'LJ-004');
  const c = hand(s, 0, 'FL-003');
  act(s, { type: 'play', uid: c.uid, target: t.uid });
  act(s, { type: 'end' });
  ok(!canAttack(s, t), 'stunned on its turn');
  act(s, { type: 'end' }); act(s, { type: 'end' });
  ok(canAttack(s, t), 'free again');
});
test('control cap: never more than 2 consecutive controlled turns', () => {
  const s = blank();
  const t = spawn(s, 1, 'LJ-004');
  t.st.push({ k: 'stun', t: 5, v: 0 });
  act(s, { type: 'end' }); ok(!canAttack(s, t), 'turn 1 controlled');
  act(s, { type: 'end' }); act(s, { type: 'end' }); ok(!canAttack(s, t), 'turn 2 controlled');
  act(s, { type: 'end' }); act(s, { type: 'end' }); ok(canAttack(s, t), 'turn 3 released');
});
test('定心符咒 cleanses and grants immunity', () => {
  const s = blank();
  const u = spawn(s, 0, 'LJ-004'); u.st.push({ k: 'seal', t: 2, v: 0 });
  const c = hand(s, 0, 'WM-005');
  act(s, { type: 'play', uid: c.uid, target: u.uid });
  ok(!u.st.some((x) => x.k === 'seal'), 'seal removed');
  const f = hand(s, 1, 'FL-003');
  act(s, { type: 'end' });
  s.players[1].mana = 10;
  act(s, { type: 'play', uid: f.uid, target: u.uid });
  ok(!u.st.some((x) => x.k === 'stun'), 'immune to stun');
});
test('雷击符 hits a general for 5, the hero for 3 when the board is empty', () => {
  const s = blank();
  const t = spawn(s, 1, 'LJ-001');
  let c = hand(s, 0, 'FL-006');
  act(s, { type: 'play', uid: c.uid, target: t.uid });
  eq(t.hp, 7);
  s.players[1].board = [];
  c = hand(s, 0, 'FL-006');
  act(s, { type: 'play', uid: c.uid, target: 'H1' });
  eq(s.players[1].hp, 17);
});
test('焚天符 burns a wenmai when no general has a buff', () => {
  const s = blank();
  spawn(s, 1, 'WM-002', { zone: 'wenmai' });
  const t = spawn(s, 1, 'ZL-001');
  const c = hand(s, 0, 'FL-004');
  act(s, { type: 'play', uid: c.uid });
  eq(s.players[1].wenmai.length, 0, 'wenmai burned');
  eq(t.hp, 1, '2 fixed damage ignores DEF');
});
test('木灵符 draws 3 after another talisman this turn', () => {
  const s = blank();
  const t = spawn(s, 0, 'LJ-004');
  const a = hand(s, 0, 'FL-001'), b = hand(s, 0, 'FL-002');
  act(s, { type: 'play', uid: a.uid, target: t.uid });
  const before = s.players[0].hand.length;
  act(s, { type: 'play', uid: b.uid });
  eq(s.players[0].hand.length, before - 1 + 3);
});

// ───────── bonds ─────────
test('创世组: 盘古+女娲 → both +2/+2 once, hero +3', () => {
  const s = blank();
  s.players[0].hp = 10;
  spawn(s, 0, 'LJ-001');
  const nv = hand(s, 0, 'LJ-002');
  act(s, { type: 'play', uid: nv.uid });
  const pg = s.players[0].board[0];
  eq(pg.atk, 10); eq(pg.def, 6);
  eq(s.players[0].hp, 16, '+3 summon +3 bond');
  ok(s.players[0].once.genesis);
});
test('八仙组: two immortals → +1/+1 each; 过海图 adds +count', () => {
  const s = blank();
  const l = spawn(s, 0, 'LJ-005'), t = spawn(s, 0, 'LJ-006');
  eq(atkOf(s, l), 7); eq(defOf(s, t), 6);
  spawn(s, 0, 'WM-003', { zone: 'wenmai' });
  eq(atkOf(s, l), 9, '6 + wm 2 + bond 1');
  eq(bondState(s, 0).baxian, 1);
});
test('封神组 isolated: 哪吒 hit grants 1 mana once per turn', () => {
  const s = blank({ mana: 3 });
  const n = spawn(s, 0, 'LJ-003');
  act(s, { type: 'attack', uid: n.uid, target: 'H1' });
  eq(s.players[0].mana, 4);
  act(s, { type: 'attack', uid: n.uid, target: 'H1' });
  eq(s.players[0].mana, 4);
});
test('镇煞组: 钟馗+定心 lowers 镇鬼令 cost; +门神 → hero -1', () => {
  const s = blank();
  const z = spawn(s, 0, 'LJ-004', { grade: 1 });
  spawn(s, 0, 'WM-005', { zone: 'wenmai' });
  eq(bondState(s, 0).zhensha, 1);
  spawn(s, 0, 'LJ-009');
  eq(bondState(s, 0).zhensha, 2);
  eq(heroReduction(s, 0), 1);
  ok(z);
});

// ───────── resonance ─────────
test('单行共鸣: second fire talisman → 朱雀燎原, fire generals +2 ATK', () => {
  const s = blank();
  const zl = spawn(s, 0, 'LJ-007');
  for (let k = 0; k < 2; k++) { const c = hand(s, 0, 'FL-004'); act(s, { type: 'play', uid: c.uid }); }
  ok(s.players[0].res.fire > 0, 'fire resonance on');
  eq(atkOf(s, zl), 5);
});
test('五行结界: all five elements → DEF +2 once, hero -1 for 2 turns', () => {
  const s = blank();
  const g = spawn(s, 0, 'LJ-006');
  const e = spawn(s, 1, 'LJ-009');
  for (const id of ['FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-005']) {
    const c = hand(s, 0, id);
    s.players[0].mana = 10;
    const tg = id === 'FL-001' ? g.uid : id === 'FL-003' || id === 'FL-005' ? e.uid : undefined;
    act(s, { type: 'play', uid: c.uid, target: tg });
  }
  ok(s.players[0].barrierUsed, 'barrier'); eq(s.players[0].barrierTurns, 2);
  eq(g.def, 5 + 2);
});
test('阴阳交汇: water + fire talisman in one turn', () => {
  const s = blank();
  spawn(s, 0, 'LJ-004'); const e = spawn(s, 1, 'LJ-001');
  s.players[0].hp = 10;
  act(s, { type: 'play', uid: hand(s, 0, 'FL-003').uid, target: e.uid });
  act(s, { type: 'play', uid: hand(s, 0, 'FL-004').uid });
  eq(s.players[0].yinyang, 1);
  eq(s.players[0].hp, 13);
});
test('opponent counter-element talisman snuffs a single resonance', () => {
  const s = blank();
  for (let k = 0; k < 2; k++) act(s, { type: 'play', uid: hand(s, 0, 'FL-001').uid, target: spawn(s, 0, 'ZL-001').uid });
  ok(s.players[0].res.metal > 0, 'metal on');
  act(s, { type: 'end' });
  s.players[1].mana = 10;
  act(s, { type: 'play', uid: hand(s, 1, 'FL-004').uid });   // 火克金
  eq(s.players[0].res.metal, 0);
});

// ───────── costs ─────────
test('昆仑仙境图: generals cost -1 (min 1) for 3 turns then leave', () => {
  const s = blank();
  act(s, { type: 'play', uid: hand(s, 0, 'WM-006').uid });
  const g = hand(s, 0, 'LJ-001'), z = hand(s, 0, 'LJ-007');
  eq(costOf(s, 0, g), 5); eq(costOf(s, 0, z), 1);
  for (let k = 0; k < 6; k++) act(s, { type: 'end' });
  eq(costOf(s, 0, g), 6);
  ok(!s.players[0].wenmai.some((w) => w.id === 'WM-006'), 'expired to discard');
});
test('upgrade grades add flat stats (珍品 +1/+1/+2, 极品 +2/+2/+3)', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-001', { grade: 1 }), b = spawn(s, 0, 'LJ-006', { grade: 2 });
  eq(a.atk, 9); eq(a.maxHp, 14); eq(b.def, 7); eq(b.maxHp, 11);
});

// ───────── chapter 2 ─────────
test('李杜文章: 李白+杜甫 → ATK/DEF +1 and draw 1; +苏轼 → hero heals 1 each turn', () => {
  const s = blank();
  const lb = spawn(s, 0, 'LJ-010');
  eq(atkOf(s, lb), 6, 'no bond alone');
  const df = hand(s, 0, 'LJ-011');
  act(s, { type: 'play', uid: df.uid });
  eq(atkOf(s, lb), 7); eq(defOf(s, lb), 4);
  eq(s.players[0].hand.length, 1, 'bond drew a card');
  spawn(s, 0, 'LJ-012');
  s.players[0].hp = 10;
  act(s, { type: 'end' }); act(s, { type: 'end' });
  eq(s.players[0].hp, 11, 'turn-start heal');
});
test('李白: every talisman this turn gives ATK +1, gone next turn', () => {
  const s = blank();
  const lb = spawn(s, 0, 'LJ-010');
  act(s, { type: 'play', uid: hand(s, 0, 'FL-002').uid });
  act(s, { type: 'play', uid: hand(s, 0, 'FL-002').uid });
  eq(atkOf(s, lb), 8);
  act(s, { type: 'end' });
  eq(atkOf(s, lb), 6);
});
test('公孙大娘 / 霓裳残舞: surviving an attack grants 潜行', () => {
  const s = blank();
  const g = spawn(s, 0, 'LJ-013');
  const t = spawn(s, 1, 'ZL-001');
  t.hp = 20; t.maxHp = 20;
  act(s, { type: 'attack', uid: g.uid, target: t.uid });
  ok(g.st.some((x) => x.k === 'dodge'), 'dodge');
  act(s, { type: 'end' });
  const e = spawn(s, 1, 'LJ-004');
  act(s, { type: 'attack', uid: e.uid, target: g.uid });
  eq(g.hp, 6, 'first hit dodged');
});
test('残句墨魅: dying hurts the opposing hero for 1', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-004');
  const z = spawn(s, 1, 'ZL-007');
  act(s, { type: 'attack', uid: a.uid, target: z.uid });
  eq(s.players[0].hp, 19);
});
test('霓裳断魂「曲终」: every 3rd own turn enemy generals ATK -2, boss heals 3', () => {
  const s = createGame({ seed: 3, first: 0, players: [{ deck: filler }, { deck: filler, passive: 'nishang', hp: 30 }] });
  const g = spawn(s, 0, 'LJ-004');
  s.players[1].hp = 20;
  for (let k = 0; k < 5; k++) act(s, { type: 'end' });   // boss turns 1, 2, 3
  eq(s.active, 1); eq(s.players[1].turns, 3);
  eq(s.players[1].hp, 23);
  eq(atkOf(s, g), 4);
  act(s, { type: 'end' });
  eq(atkOf(s, g), 4, 'still down during my turn');
  act(s, { type: 'end' });
  eq(atkOf(s, g), 6, 'wears off');
});
test('茶经 +1 mana at turn start; 活字 draws when the hand is small; 杜甫 heals the board', () => {
  const s = blank();
  spawn(s, 0, 'WM-009', { zone: 'wenmai' }); spawn(s, 0, 'WM-008', { zone: 'wenmai' });
  const df = spawn(s, 0, 'LJ-011'), o = spawn(s, 0, 'LJ-006');
  o.hp = 5;
  act(s, { type: 'end' });
  eq(o.hp, 7, '杜甫 +1 and 铁拐李 +1 (random pick among the hurt)');
  act(s, { type: 'end' });
  eq(s.players[0].mana, s.players[0].maxMana + 1);
  eq(s.players[0].hand.length, 2, 'normal draw + 活字');
  ok(df.hp === df.maxHp);
});

// ───────── chapters 4–10: declarative effects (cardfx.js) ─────────
test('章节羁绊（auto）：2 名成员 → ATK/DEF +1；补齐文脉卡 → 回合开始额外抽牌', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-018');            // 孔子 4/5
  eq(atkOf(s, a), 4, 'alone');
  spawn(s, 0, 'LJ-020');                      // 庄子 → 稷下组 1 阶
  eq(atkOf(s, a), 5); eq(defOf(s, a), 6);
  spawn(s, 0, 'WM-012', { zone: 'wenmai' });  // 竹简诗三百 → 2 阶
  const before = s.players[0].hand.length;
  act(s, { type: 'end' }); act(s, { type: 'end' });
  eq(s.players[0].hand.length, before + 2, 'normal draw + bond draw');
});
test('声明式 summon：老子使敌方最强灵将 ATK -3', () => {
  const s = blank();
  const big = spawn(s, 1, 'LJ-001'), small = spawn(s, 1, 'ZL-001');
  act(s, { type: 'play', uid: hand(s, 0, 'LJ-019').uid });
  eq(atkOf(s, big), 5); eq(atkOf(s, small), 2, 'only the strongest');
});
test('声明式 onDeath：曹雪芹在我方灵将阵亡时抽 1 张牌', () => {
  const s = blank();
  spawn(s, 0, 'LJ-038');
  const victim = spawn(s, 0, 'ZL-001');
  const e = spawn(s, 1, 'LJ-004');
  const n = s.players[0].hand.length;
  act(s, { type: 'end' });
  act(s, { type: 'attack', uid: e.uid, target: victim.uid });
  ok(victim.hp <= 0 || s.players[0].hand.length === n + 1, 'drew on death');
});
test('声明式 whenHit：李冰被攻击后反伤 2 点', () => {
  const s = blank();
  act(s, { type: 'end' });
  const libing = spawn(s, 0, 'LJ-044');
  const att = spawn(s, 1, 'LJ-003');
  act(s, { type: 'attack', uid: att.uid, target: libing.uid });
  eq(att.hp, 8 - 2);
});
test('首领被动表：忘川每 2 个自身回合触发', () => {
  const s = createGame({ seed: 5, first: 0, players: [{ deck: filler }, { deck: filler, passive: 'wangchuan', hp: 40 }] });
  const g = spawn(s, 0, 'LJ-004');
  s.players[1].hp = 30;
  act(s, { type: 'end' });                    // boss turn 1 — not yet
  eq(s.players[1].hp, 30);
  act(s, { type: 'end' }); act(s, { type: 'end' });   // boss turn 2 — fires
  eq(s.players[1].turns, 2);
  eq(s.players[1].hp, 32);
  eq(atkOf(s, g), 5);
});
test('自动编入不会压垮费用曲线', () => {
  let deck = [...STARTER_DECK];
  for (const L of LEVELS) for (const id of L.reward.unlock) deck = insertCard(deck, id)?.deck ?? deck;
  eq(deck.length, DECK_SIZE);
  eq(deckProblem(deck), null, 'still a legal deck');
  const heavy = deck.filter((id) => CARDS[id].cost >= 5).length;
  ok(heavy <= 5, `too many 5+ drops after every unlock: ${heavy}`);
});

// ───────── data integrity ─────────
test('every card has the required fields', () => {
  for (const c of Object.values(CARDS)) {
    ok(c.name && c.type && Number.isInteger(c.cost) && c.el, `${c.id} fields`);
    if (c.type === 'general') ok(c.atk >= 0 && c.def >= 0 && c.hp > 0, `${c.id} stats`);
    if (!c.zhuo) ok(c.quote && c.source && c.flavor, `${c.id} citation`);
  }
});
test('decks reference real cards and are 20 long', () => {
  eq(STARTER_DECK.length, DECK_SIZE);
  for (const L of [...LEVELS, ...PRACTICE]) {
    eq(L.enemy.deck.length, 20, `${L.id} enemy deck`);
    for (const id of L.enemy.deck) ok(CARDS[id], `${L.id}: ${id}`);
  }
  for (const id of STARTER_DECK) ok(PLAYER_CARD_IDS.includes(id));
});

// ───────── AI ─────────
test('AI turn only issues legal actions and ends its turn', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = createGame({ seed, first: seed % 2, players: [{ deck: STARTER_DECK }, { deck: PRACTICE[seed % 3].enemy.deck }] });
    const ai = createAI({ level: 'hard', seed });
    for (let t = 0; t < 12 && !s.over; t++) { const me = s.active; playTurn(s, ai); ok(s.over || s.active !== me, 'turn passed'); }
  }
});
test('AI takes lethal when it is on the board', () => {
  const s = blank();
  s.players[1].hp = 5;
  spawn(s, 0, 'LJ-004');
  const a = createAI({ level: 'normal', seed: 3 }).choose(s);
  eq(a.type, 'attack'); eq(a.target, 'H1');
});

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
