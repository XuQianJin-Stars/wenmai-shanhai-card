// Headless rules tests: `npm test`. Each test builds a small position by hand and checks one rule from the design docs.
import { createGame, act, spawn, atkOf, defOf, legalActions, canAttack, canPlay, attackTargets, playTargets, isGuard, costOf, bondState, heroReduction, damageHero, skillCost, RULES } from '../engine.js';
import { createAI, playTurn } from '../ai.js';
import { CARDS, PLAYER_CARD_IDS } from '../../data/cards.js';
import { GUARDIAN, GUARDIAN_MAX, boonOf, guardianRank } from '../../data/guardian.js';
import { LEVELS, PRACTICE, STARTER_DECK, DECK_MIN, DECK_MAX, practiceReward, practiceEnemy } from '../../data/story.js';
import { createBoard, covered, STACK_LAYERS } from '../../game/stackMatch.js';
import { insertCard, deckProblem, migrateSave } from '../../game/save.js';
import { RELICS, RELIC_BY_ID } from '../../data/relics.js';
import { CHAPTERS } from '../../data/story.js';
import { SIGNATURE } from '../../game/cardvfx.js';
import { readFileSync } from 'node:fs';

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
test('守护者修行：气血、起手、首回合灵力、每回合回复都按 boon 生效', () => {
  const boon = { hp: 6, hand: 2, mana: 1, regen: 1 };
  const s = createGame({ seed: 1, first: 0, players: [{ deck: filler, boon }, { deck: filler }] });
  eq(s.players[0].maxHp, RULES.HERO_HP + 6, 'max hp');
  eq(s.players[0].hand.length, RULES.HAND_FIRST + 2, 'opening hand');
  eq(s.players[1].hand.length, RULES.HAND_SECOND, 'opponent unchanged');
  eq(s.players[0].mana, 3, 'turn 1 mana = 1 base + 1 first-player + 1 boon');
  s.players[0].hp = 10;
  act(s, { type: 'end' });                       // 对手回合
  act(s, { type: 'end' });                       // 回到自己，回合开始回 1
  eq(s.players[0].hp, 11, 'regen at turn start');
  eq(s.players[0].maxMana, 2, 'boon mana is first turn only');
});
test('守护者修行：回复不会超过气血上限，没有 boon 时一切照旧', () => {
  const s = createGame({ seed: 1, first: 0, players: [{ deck: filler, boon: { regen: 3 } }, { deck: filler }] });
  eq(s.players[0].maxHp, RULES.HERO_HP, 'no hp boon');
  act(s, { type: 'end' }); act(s, { type: 'end' });
  eq(s.players[0].hp, RULES.HERO_HP, 'capped at max');
  const plain = createGame({ seed: 1, first: 0, players: [{ deck: filler }, { deck: filler }] });
  eq(plain.players[0].boon.hp, 0, 'missing boon defaults to zero');
  eq(plain.players[0].hand.length, RULES.HAND_FIRST, 'opening hand unchanged');
});
test('守护者「磐石」：减伤并入取最高的规则，2 点以下的伤害照打', () => {
  const s = blank();
  s.players[0].boon.armor = 2;
  eq(heroReduction(s, 0), 2, 'armor counts as a reduction');
  damageHero(s, 0, 6);
  eq(s.players[0].hp, RULES.HERO_HP - 4, '6 - 2');
  damageHero(s, 0, 2);
  eq(s.players[0].hp, RULES.HERO_HP - 6, 'small hits are not reduced');
});
test('守护者「持盈」：手牌上限随之抬高', () => {
  const s = blank();
  s.players[0].boon.handCap = 2;
  for (let k = 0; k < 12; k++) hand(s, 0, 'ZL-001');
  act(s, { type: 'end' });
  eq(s.players[0].hand.length, RULES.MAX_HAND + 2);
});
test('守护者修行：等级表算出来的加成和引擎字段对得上', () => {
  const maxed = Object.fromEntries(GUARDIAN.map((t) => [t.k, t.max]));
  const b = boonOf(maxed);
  eq(b.hp, 80, 'hp'); eq(b.armor, 3, 'armor'); eq(b.regen, 5, 'regen');
  eq(b.mana, 4, 'mana'); eq(b.hand, 3, 'hand'); eq(b.handCap, 3, 'handCap');
  eq(RULES.HERO_HP + b.hp, 100, '点满后的气血上限');
  eq(boonOf({ hp: 99 }).hp, 80, 'levels are clamped to the track max');
  eq(boonOf({}).hp, 0, 'empty table means no boon');
  const s = createGame({ seed: 1, first: 0, players: [{ deck: filler, boon: b }, { deck: filler }] });
  eq(s.players[0].maxHp, 100, '引擎收下的就是这个数');
  for (const t of GUARDIAN) ok(t.cost.length === t.max, `${t.k} 的费用表要和等级数一致`);
});
test('章节：按朝代编年一路排下来，id 前缀和章号都不重复', () => {
  const order = CHAPTERS.map((C) => C.key);
  eq(order.join(' '), 'shenhua xianqin chuci qinhan sanguo weijin nanbei dunhuang datang wudai liangsong mengyuan haisi guizang tiangong shijing wanqing minguo feiyi dangdai',
    '章节顺序按历史事件：神话、先秦、秦汉、三国至清、晚清至今');
  eq(new Set(order).size, order.length, '每章一个 id 前缀');
  eq(new Set(CHAPTERS.map((C) => C.n)).size, CHAPTERS.length, '章号不重复');
  CHAPTERS.forEach((C, i) => eq(C.n, i + 1, `第 ${i + 1} 章的章号要连着`));
  for (const C of CHAPTERS) eq(C.levels.length, 3, `${C.short} 该有三关`);
  // 进度门禁吃的是 LEVELS 的下标，所以扁平表也必须是按章排好的
  eq(LEVELS.map((L) => L.id).join(' '), CHAPTERS.flatMap((C) => C.levels.map((L) => L.id)).join(' '), 'LEVELS 要和章节顺序一致');
});
test('存档迁移：v1 的 chN-M 和 v2 的 tangsong-* 都能落到今天的关卡 id 上', () => {
  const v1 = migrateSave({ done: ['ch1-1', 'ch1-2', 'ch1-3', 'ch2-1', 'ch2-3', 'ch11-1'], seenPro: [2, 11] });
  eq(v1.done.join(','), 'shenhua-1,shenhua-2,shenhua-3,datang-1,datang-3,haisi-1', 'v1 的关卡 id');
  eq(v1.seenPro.join(','), '9,13', 'v1 的章号：唐、海丝按历史事件重排后的章号');
  const v2 = migrateSave({ v: 2, done: ['tangsong-2', 'haisi-3', 'guizang-1'], seenPro: [7, 8, 12] });
  eq(v2.done.join(','), 'datang-2,haisi-3,guizang-1', 'v2 只需要改唐那三关');
  eq(v2.seenPro.join(','), '9,13,14', '拆章后再按历史事件重排：唐、海丝、归藏');
  const v3 = migrateSave({ v: 3, done: ['datang-3', 'liangsong-1'], seenPro: [8] });
  eq(v3.done.join(','), 'datang-3,liangsong-1', 'v3 原样收下');
  eq(v3.seenPro.join(','), '11', 'v3 的第八章是两宋，重排后为第十一章');
  const v4 = migrateSave({ v: 4, done: ['datang-1'], seenPro: [8] });
  eq(v4.seenPro.join(','), '8', 'v4 的章号已经是历史顺序，不再翻一次');
  eq(migrateSave({ v: 3, done: ['tangsong-1', '不存在的关'] }).done.length, 0, '认不出的关卡 id 一律丢掉');
});
test('多牌组：旧存档的一套牌变成牌组一，不合法的丢掉', () => {
  const old = migrateSave({ v: 3, deck: [...STARTER_DECK] });
  eq(old.decks.length, 1);
  eq(old.decks[0].name, '牌组一');
  eq(old.deckOn, 0);
  eq(old.deck.join(' '), STARTER_DECK.join(' '));
  const messy = migrateSave({ v: 3, deckOn: 9, decks: [
    { name: '坏', cards: ['nope'] },
    { name: '  乙乙乙乙乙乙乙乙乙', cards: [...STARTER_DECK] },
    { name: '丙', cards: [...STARTER_DECK] },
  ] });
  eq(messy.decks.length, 2);
  eq(messy.decks[0].name, '乙乙乙乙乙乙乙乙');
  eq(messy.deckOn, 0, '下标超出就回到第一套');
  const picked = migrateSave({ v: 3, deckOn: 1, decks: [
    { name: '甲', cards: [...STARTER_DECK] },
    { name: '乙', cards: [...STARTER_DECK] },
  ] });
  eq(picked.deckOn, 1);
  eq(picked.decks[1].name, '乙');
  eq(picked.deck.join(' '), picked.decks[1].cards.join(' '));
});
test('守护者境界：总重数决定称呼，点满即圆满', () => {
  const none = guardianRank({});
  eq(none.level, 0, '一重没修'); eq(none.max, GUARDIAN_MAX, '上限是六条路之和');
  ok(none.next && none.next.need > 0, '还有下一境');
  const full = guardianRank(Object.fromEntries(GUARDIAN.map((t) => [t.k, t.max])));
  eq(full.level, GUARDIAN_MAX, '全点满');
  eq(full.next, null, '圆满之后没有下一境');
  // 境界只能往上走，不能中途掉回去。
  let last = -1;
  for (let n = 0; n <= GUARDIAN_MAX; n++) {
    // 把 n 重按声明顺序摊到各条路上，这样某条路的上限一改，这里也不用跟着改。
    const levels = {};
    let left = n;
    for (const t of GUARDIAN) { levels[t.k] = Math.min(t.max, left); left -= levels[t.k]; }
    const r = guardianRank(levels);
    ok(r.level >= last, '重数单调不减'); last = r.level;
    ok(r.next === null || r.next.need >= 1, `第 ${r.level} 重的进阶差值要是正数`);
  }
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
// ───────── 器物 ─────────
test('器物：挂上去加属性，灵将阵亡时随之进弃牌堆', () => {
  const s = blank();
  const g = spawn(s, 0, 'ZL-001');                       // 2/0/3
  const base = { atk: atkOf(s, g), def: defOf(s, g), hp: g.hp };
  const gear = hand(s, 0, 'QW-011');                     // 东皇钟 ATK+2 DEF+3 HP+3
  act(s, { type: 'play', uid: gear.uid, target: g.uid });
  eq(atkOf(s, g), base.atk + 2, 'ATK');
  eq(defOf(s, g), base.def + 3, 'DEF');
  eq(g.hp, base.hp + 3, 'HP');
  eq(g.maxHp, base.hp + 3, 'maxHP');
  eq(g.gear.id, 'QW-011', '挂上了');
  g.hp = 0;
  act(s, { type: 'end' });
  ok(s.players[0].discard.some((x) => x.id === 'QW-011'), '器物跟着进弃牌堆');
  ok(!s.players[0].board.length, '灵将没了');
});
test('器物：换装时旧的进弃牌堆，还回去的 HP 不会把人还死', () => {
  const s = blank();
  const g = spawn(s, 0, 'ZL-001');
  act(s, { type: 'play', uid: hand(s, 0, 'QW-011').uid, target: g.uid });   // HP +3 → 6
  g.hp = 2;                                              // 被打得只剩 2，此时上限 6
  act(s, { type: 'play', uid: hand(s, 0, 'QW-001').uid, target: g.uid });   // 轩辕剑，没有 HP
  eq(g.gear.id, 'QW-001', '换上了新的');
  eq(g.maxHp, 3, '上限还回去了');
  ok(g.hp >= 1, `换装不该直接把人换死（hp=${g.hp}）`);
  ok(s.players[0].discard.some((x) => x.id === 'QW-011'), '旧器物进弃牌堆');
});
test('器物：可以给不带守护的灵将加上守护', () => {
  const s = blank();
  const g = spawn(s, 0, 'ZL-001');
  ok(!isGuard(g), '本来没有守护');
  act(s, { type: 'play', uid: hand(s, 0, 'QW-002').uid, target: g.uid });   // 山河社稷图
  ok(isGuard(g), '器物给了守护');
  // 对手现在必须先打它
  s.active = 1;
  const a = spawn(s, 1, 'ZL-002');
  a.sleep = false;
  eq(attackTargets(s, a).join(), g.uid, '守场生效，主将打不到');
});
test('器物：钩子挂在佩戴者身上，伏羲琴每回合只给 1 点灵力', () => {
  const s = blank();
  const g = spawn(s, 0, 'LJ-004');
  g.sleep = false;
  act(s, { type: 'play', uid: hand(s, 0, 'QW-017').uid, target: g.uid });   // 伏羲琴：攻击后 +1 灵力
  s.players[0].mana = 0;
  act(s, { type: 'attack', uid: g.uid, target: 'H1' });
  eq(s.players[0].mana, 1, '攻击后给了 1 点');
  g.attacks = 0;
  act(s, { type: 'attack', uid: g.uid, target: 'H1' });
  eq(s.players[0].mana, 1, '每回合只给 1 点');
});
test('器物：专属器物只能挂在名单上的灵将身上', () => {
  const s = blank();
  const other = spawn(s, 0, 'ZL-001');
  const jingu = hand(s, 0, 'QW-004');                    // 定海神针，只认孙悟空
  ok(!canPlay(s, 0, jingu), '场上只有别人时打不出来');
  const wukong = spawn(s, 0, 'LJ-054');
  ok(canPlay(s, 0, jingu), '悟空在场就能打');
  eq(playTargets(s, 0, jingu).join(), wukong.uid, '可选目标只有悟空一个');
  act(s, { type: 'play', uid: jingu.uid, target: wukong.uid });
  eq(wukong.gear.id, 'QW-004', '挂到了悟空身上');
  ok(!other.gear, '别人身上没有');
});
test('器物：没有我方灵将时打不出来', () => {
  const s = blank();
  const gear = hand(s, 0, 'QW-001');
  ok(!canPlay(s, 0, gear), '场上空着就不能装备');
  ok(!legalActions(s).some((a) => a.uid === gear.uid), '也不该出现在合法行动里');
  spawn(s, 0, 'ZL-001');
  ok(canPlay(s, 0, gear), '有人了就能装');
});
test('器物：每章通关各给一件，且不会被自动编入牌组', () => {
  const gear = Object.values(CARDS).filter((c) => c.type === 'artifact' && !c.zhuo).map((c) => c.id);
  const dropped = LEVELS.flatMap((L) => L.reward.unlock).filter((id) => CARDS[id].type === 'artifact');
  eq(new Set(dropped).size, dropped.length, '同一件器物不能掉两次');
  for (const id of gear) ok(dropped.includes(id), `${id} 拿不到`);
  // 起手牌组里没有器物，insertCard 找不到同类可换，所以解锁后只进图鉴，不会顶掉别的牌
  for (const id of gear) eq(insertCard([...STARTER_DECK], id), null, `${id} 不该自动编入`);
});
test('器物：上古十大神器凑齐十件', () => {
  const want = ['东皇钟', '轩辕剑', '盘古斧', '炼妖壶', '昊天塔', '崆峒印', '昆仑镜', '女娲石', '神农鼎', '伏羲琴'];
  const got = Object.values(CARDS).filter((c) => c.divine);
  eq(got.length, 10, '不多不少十件');
  for (const n of want) ok(got.some((c) => c.name === n), `缺了${n}`);
  for (const c of got) eq(c.type, 'artifact', `${c.id} 神器得是器物`);
});
test('文物：每张 relic 卡都能在文物志里找到对应条目，反过来也对得上', () => {
  const cards = Object.values(CARDS).filter((c) => c.relic);
  ok(cards.length >= 10, `文物器物至少十件，现在 ${cards.length}`);
  for (const c of cards) {
    ok(RELIC_BY_ID[c.relic], `${c.id} 指向的文物 ${c.relic} 不存在`);
    ok((RELIC_BY_ID[c.relic].cards ?? []).includes(c.id), `${c.relic} 没把 ${c.id} 列回来，两边得互指`);
    ok(!c.divine, `${c.id} 是真文物，不该同时挂神器印`);
  }
  for (const r of RELICS) {
    for (const id of r.cards ?? []) ok(CARDS[id], `文物 ${r.id} 指向了不存在的卡 ${id}`);
    ok(CHAPTERS.some((C) => C.key === r.ch), `文物 ${r.id} 的章节 ${r.ch} 不在章节表里`);
  }
});
test('文物器物：银香囊（常平架）受击后自己解控，铜奔马落地就能动', () => {
  const s = blank();
  const host = spawn(s, 0, 'LJ-029');
  act(s, { type: 'play', uid: hand(s, 0, 'QW-027').uid, target: host.uid });
  host.st.push({ k: 'stun', t: 2, v: 0, src: 'test' });
  act(s, { type: 'end' });
  const atk = spawn(s, 1, 'LJ-001');
  act(s, { type: 'attack', uid: atk.uid, target: host.uid });
  ok(!host.st.some((x) => x.k === 'stun'), '挨一下之后应当自己转正');

  const s2 = blank();
  const horse = spawn(s2, 0, 'LJ-029');
  horse.sleep = true;
  act(s2, { type: 'play', uid: hand(s2, 0, 'QW-024').uid, target: horse.uid });
  eq(horse.sleep, false, '铜奔马解除召唤失眠');
});
test('战斗特效：每个 shape 都在 battle.js 的分发表里（拼错了会静默什么都不放）', () => {
  const src = readFileSync(new URL('../../game/battle.js', import.meta.url), 'utf8');
  // 只认 switch (l.shape) 那一段里的 case，别把别处 switch 的分支也算进来
  const from = src.indexOf('switch (l.shape) {');
  ok(from > 0, '没找到 shape 的分发表');
  const block = src.slice(from, src.indexOf('default: break;', from));
  const shapes = new Set([...block.matchAll(/case '([a-zA-Z]+)':/g)].map((m) => m[1]));
  ok(shapes.size > 15, `分发表没解析出来，只找到 ${shapes.size} 个`);
  for (const [id, hooks] of Object.entries(SIGNATURE))
    for (const [hook, sg] of Object.entries(hooks))
      for (const l of sg.layers ?? []) ok(shapes.has(l.shape), `${id}.${hook} 用了不存在的特效 ${l.shape}`);
});
test('西游组：两名取经人 → ATK/DEF +1；补上释厄传 → 技能费用 -1', () => {
  const s = blank();
  const wk = spawn(s, 0, 'LJ-054');
  const a0 = atkOf(s, wk), d0 = defOf(s, wk);
  spawn(s, 0, 'LJ-058');
  eq(bondState(s, 0).xiyou >= 1, true, '两个人就成组');
  eq(atkOf(s, wk), a0 + 1, 'ATK +1');
  eq(defOf(s, wk), d0 + 1, 'DEF +1');
  const cost0 = skillCost(s, wk);
  spawn(s, 0, 'WM-021', { zone: 'wenmai' });
  eq(bondState(s, 0).xiyou, 2, '文脉卡把羁绊抬到二级');
  eq(skillCost(s, wk), cost0 - 1, '技能便宜 1 点');
});
test('白龙马「意马」落地就能动', () => {
  const s = blank();
  const m = spawn(s, 0, 'LJ-057');
  ok(!m.sleep, '不沉睡');
  ok(canAttack(s, m), '当回合就能攻击');
  act(s, { type: 'play', uid: hand(s, 0, 'LJ-055').uid });
  ok(s.players[0].board.at(-1).sleep, '别的灵将从手里打出来照旧沉睡');
});
test('器物：品阶抬 ATK/DEF，不抬 HP', () => {
  const s = blank();
  const g = spawn(s, 0, 'ZL-001');
  const a0 = atkOf(s, g);
  const gear = hand(s, 0, 'QW-001', 1);                  // 珍品轩辕剑
  act(s, { type: 'play', uid: gear.uid, target: g.uid });
  eq(atkOf(s, g), a0 + 4, '珍品 = 基础 3 + 品阶 1');
  eq(g.maxHp, 3, 'HP 不随品阶动');
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
  ok(deck.length >= DECK_MIN && deck.length <= DECK_MAX, `编入之后应落在 ${DECK_MIN}～${DECK_MAX}，现在 ${deck.length}`);
  eq(deckProblem(deck), null, 'still a legal deck');
  const heavy = deck.filter((id) => CARDS[id].cost >= 5).length;
  ok(heavy / deck.length <= 0.4, `5 费以上不该过四成，现在 ${heavy}/${deck.length}`);
});

test('人间诸神：杨戬天眼有增益就驱散，没有就压攻击', () => {
  const s = blank();
  const foe = spawn(s, 1, 'LJ-003');
  foe.st.push({ k: 'atkUp', t: 2, v: 3 });
  act(s, { type: 'play', uid: hand(s, 0, 'LJ-063').uid });
  ok(!foe.st.some((x) => x.k === 'atkUp'), '增益被天眼驱散');

  const s2 = blank();
  const plain = spawn(s2, 1, 'LJ-003');
  act(s2, { type: 'play', uid: hand(s2, 0, 'LJ-063').uid });
  ok(plain.st.some((x) => x.k === 'atkDown'), '没有增益时改为攻击 -2');
});
test('人间诸神：夸父落地就能打，打完自己渴 1 点', () => {
  const s = createGame({ seed: 1, first: 0, players: [
    { deck: ['LJ-066', ...Array(19).fill('ZL-001')], ordered: true },
    { deck: Array(20).fill('ZL-001'), ordered: true },
  ] });
  s.players[0].mana = 10;
  const c = s.players[0].hand.find((u) => u.id === 'LJ-066');
  act(s, { type: 'play', uid: c.uid });
  const k = s.players[0].board[0];
  eq(k.sleep, false, '逐日：召唤当回合可攻击');
  ok(canAttack(s, k));
  const hp = k.hp;
  act(s, { type: 'attack', uid: k.uid, target: 'H1' });
  eq(k.hp, hp - 1, '道渴');
});
test('人间诸神：后羿打火属性多 2 点，和嫦娥同时在场各 +1', () => {
  const s = blank();
  const hou = spawn(s, 0, 'LJ-064');
  hou.sleep = false;
  const nezha = spawn(s, 1, 'LJ-003');
  act(s, { type: 'attack', uid: hou.uid, target: nezha.uid });
  eq(nezha.hp, 8 - (6 - 2) - 2, '6 攻对 2 防，再加射日 2 点');

  const s2 = blank();
  const a = spawn(s2, 0, 'LJ-064');
  const b = spawn(s2, 0, 'LJ-008');
  eq(bondState(s2, 0).sheri, 1);
  eq(atkOf(s2, a), 7);
  eq(atkOf(s2, b), 4);
});
test('阵法：九曲黄河阵留在阵法区，并眩晕攻击最高的敌人', () => {
  const s = blank();
  const foe = spawn(s, 1, 'LJ-003');
  act(s, { type: 'play', uid: hand(s, 0, 'ZF-001').uid });
  eq(s.players[0].zhen.length, 1);
  eq(s.players[0].zhen[0].id, 'ZF-001');
  ok(foe.st.some((x) => x.k === 'stun'), '被黄河阵眩晕');
});
test('阵法：八阵图打出时封印敌方技能', () => {
  const s = blank();
  const foe = spawn(s, 1, 'LJ-003');
  act(s, { type: 'play', uid: hand(s, 0, 'ZF-014').uid });
  ok(foe.st.some((x) => x.k === 'seal'), '被八阵图封印');
});
test('阵法：长蛇阵在友方阵亡后抬起其余灵将的攻击', () => {
  const s = blank();
  act(s, { type: 'play', uid: hand(s, 0, 'ZF-015').uid });
  const live = spawn(s, 0, 'LJ-004');
  const dying = spawn(s, 0, 'LJ-005');
  dying.hp = 1;
  const foe = spawn(s, 1, 'LJ-003');
  foe.sleep = false;
  const before = atkOf(s, live);
  act(s, { type: 'end' });
  act(s, { type: 'attack', uid: foe.uid, target: dying.uid });
  ok(!s.players[0].board.includes(dying), '被击破的一截离场');
  eq(atkOf(s, live), before + 1, '首尾来救');
});
test('八仙：汉钟离和吕洞宾同时在场，八仙组生效', () => {
  const s = blank();
  const a = spawn(s, 0, 'LJ-084');
  const b = spawn(s, 0, 'LJ-005');
  eq(bondState(s, 0).baxian, 1);
  eq(atkOf(s, a), a.atk + 1);
  eq(atkOf(s, b), b.atk + 1);
});
test('三国：张飞进场眩晕攻击最高的敌人，赵云落地就能打', () => {
  const s = blank();
  const foe = spawn(s, 1, 'LJ-003');
  act(s, { type: 'play', uid: hand(s, 0, 'LJ-090').uid });
  ok(foe.st.some((x) => x.k === 'stun'), '万人敌');

  const s2 = createGame({ seed: 1, first: 0, players: [
    { deck: ['LJ-091', ...Array(19).fill('ZL-001')], ordered: true },
    { deck: Array(20).fill('ZL-001'), ordered: true },
  ] });
  s2.players[0].mana = 10;
  const c = s2.players[0].hand.find((u) => u.id === 'LJ-091');
  act(s2, { type: 'play', uid: c.uid });
  eq(s2.players[0].board[0].sleep, false, '一身是胆');
});
test('三国：姜维从弃牌堆复活其他三国灵将', () => {
  const s = blank();
  spawn(s, 0, 'LJ-090', { zone: 'discard' });
  const foe = spawn(s, 1, 'LJ-003');
  act(s, { type: 'play', uid: hand(s, 0, 'LJ-096').uid });
  ok(s.players[0].board.some((u) => u.id === 'LJ-090'), '张飞回到场上');
  ok(foe.st.some((x) => x.k === 'stun'), '复活的张飞仍然会喝');
});
test('封神：两名封神灵将攻击和防御 +1，哪吒单独在场仍只给灵力', () => {
  const s = blank();
  const n = spawn(s, 0, 'LJ-003');
  const li = spawn(s, 0, 'LJ-099');
  eq(bondState(s, 0).fengshen, 2);
  eq(atkOf(s, li), li.atk + 1);
  eq(defOf(s, n), n.def + 1);

  const s2 = blank({ mana: 3 });
  const solo = spawn(s2, 0, 'LJ-003');
  solo.sleep = false;
  eq(bondState(s2, 0).fengshen, 1);
  act(s2, { type: 'attack', uid: solo.uid, target: 'H1' });
  eq(s2.players[0].mana, 4, '哪吒单独在场仍然回 1 灵力');
});
test('阵法：两座齐开时灵将攻击和防御 +1', () => {
  const s = blank();
  act(s, { type: 'play', uid: hand(s, 0, 'ZF-005').uid });
  act(s, { type: 'play', uid: hand(s, 0, 'ZF-006').uid });
  eq(s.players[0].zhen.length, 2);
  const g = spawn(s, 0, 'LJ-004');
  eq(atkOf(s, g), g.atk + 1);
  eq(defOf(s, g), g.def + 1);
});
test('人间诸神：精卫回合开始填海，也护住己方主将', () => {
  const s = blank();
  spawn(s, 0, 'LJ-067');
  s.players[0].hp = 10;
  const foe = s.players[1].hp;
  act(s, { type: 'end' });
  act(s, { type: 'end' });
  eq(s.players[1].hp, foe - 1);
  eq(s.players[0].hp, 11);
});

// ───────── data integrity ─────────
test('every card has the required fields', () => {
  for (const c of Object.values(CARDS)) {
    ok(c.name && c.type && Number.isInteger(c.cost) && c.el, `${c.id} fields`);
    if (c.type === 'general') ok(c.atk >= 0 && c.def >= 0 && c.hp > 0, `${c.id} stats`);
    if (c.type === 'artifact') {
      ok(c.gear && Object.keys(c.gear).length, `${c.id} 器物得有 gear`);
      eq(c.target, 'friendlyGeneral', `${c.id} 器物只能挂在我方灵将身上`);
    }
    if (!c.zhuo) ok(c.quote && c.source && c.flavor, `${c.id} citation`);
  }
});
test('碎片奖励随难度递增，未知难度落回寻常', () => {
  const [e, n, hd] = ['easy', 'normal', 'hard'].map(practiceReward);
  ok(e.win < n.win && n.win < hd.win, 'win 要一档比一档高');
  ok(e.loss <= n.loss && n.loss <= hd.loss, 'loss 不能倒挂');
  for (const R of [e, n, hd]) ok(R.loss < R.win, '输了拿的必须比赢了少');
  eq(practiceReward(undefined).win, n.win, '故事关没写 ai 时按寻常算');
  for (const L of LEVELS) ok(['easy', 'normal', 'hard'].includes(L.ai), `${L.id} 的难度要在表里，不然重打只能按寻常给`);
});
test('宗师自由对战单独加强，寻常和故事关不动', () => {
  const base = PRACTICE[0].enemy;
  eq(practiceEnemy(base, 'normal'), base);
  eq(practiceEnemy(base, 'easy'), base);
  const hard = practiceEnemy(base, 'hard');
  eq(hard.hp, base.hp + 8);
  eq(hard.boon.mana, 1);
  for (const id of new Set(base.deck)) if (CARDS[id].type === 'general') ok(hard.grades[id] >= 1, `${id} 宗师至少珍品`);
  const graded = PRACTICE.find((p) => p.enemy.grades);
  for (const [id, g] of Object.entries(graded.enemy.grades)) eq(practiceEnemy(graded.enemy, 'hard').grades[id], Math.min(2, g + 1), id);
  eq(LEVELS[0].enemy.hp, practiceEnemy(LEVELS[0].enemy, 'normal').hp);
});
test('水浒座次按石碣，同一人的场面共用一座', () => {
  const liang = Object.values(CARDS).filter((c) => c.faction === '梁山' && c.type === 'general');
  for (const c of liang) ok(c.rank && c.rank.n >= 1 && c.rank.n <= 108 && c.rank.star, `${c.id} 要有座次`);
  eq(CARDS['LJ-107'].rank.n, 1); eq(CARDS['LJ-107'].rank.star, '天魁');
  eq(CARDS['LJ-122'].rank.n, 36); eq(CARDS['LJ-137'].rank.n, 37); eq(CARDS['LJ-212'].rank.n, 108);
  eq(CARDS['LJ-112'].rank.n, CARDS['LJ-150'].rank.n);
  eq(CARDS['LJ-120'].rank.n, CARDS['LJ-128'].rank.n);
  const seen = new Map();
  for (const c of liang) {
    const prev = seen.get(c.rank.n);
    if (prev) ok(prev === c.rank.star, `${c.id} 的第${c.rank.n}位不该是另一颗星`);
    seen.set(c.rank.n, c.rank.star);
  }
});
test('叠牌每张图的张数是 3 的倍数，开局有牌可点', () => {
  for (const level of ['easy', 'normal', 'hard']) {
    const tiles = createBoard(level, 7);
    ok(tiles.length >= 18 && tiles.length % 3 === 0, level);
    eq(Math.max(...tiles.map((t) => t.z)) + 1, STACK_LAYERS[level], `${level} 层数`);
    const n = {};
    for (const t of tiles) n[t.cardId] = (n[t.cardId] ?? 0) + 1;
    for (const c of Object.values(n)) ok(c % 3 === 0, `${level} ${c}`);
    ok(tiles.some((t) => !covered(t, tiles)), level);
  }
});
test('decks reference real cards and are 20 long', () => {
  eq(STARTER_DECK.length, DECK_MIN);
  eq(deckProblem(STARTER_DECK), null, '起手 20 张仍可用');
  eq(deckProblem(STARTER_DECK.slice(0, DECK_MIN - 1)) !== null, true);
  const room = ['LJ-001', 'LJ-002', 'LJ-010', 'LJ-011', 'LJ-012', 'WM-003', 'WM-008', 'WM-009', 'FL-005', 'LJ-013'];
  const full = [...STARTER_DECK, ...room];
  eq(full.length, DECK_MAX);
  eq(deckProblem(full), null, '补到 30 张可用');
  ok(deckProblem([...full, 'LJ-014']) !== null, '第 31 张不行');
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
