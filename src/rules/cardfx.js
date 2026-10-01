// Declarative card effects for chapters 4–10 and the boss passives.
//
// Chapters 1–3 are wired directly into engine.js with bespoke switch cases (they came first and the
// tests pin their exact behaviour). Everything after that is written here instead: the engine builds a
// context `c` of primitives and calls the hook, so a card is a few lines of data rather than a new branch
// in five different switches.
//
// Hooks: play (talisman/wenmai resolves) · summon (general arrives) · equip (器物 attaches, c.u = wearer)
// · skill (珍品 active) · turn (owner's
// turn starts, for board units and wenmai) · endTurn (owner's turn ends) · afterAttack (this unit attacked)
// · onHit (this unit connected, c.T = victim) · whenHit (this unit was attacked, c.T = attacker)
// · onDeath (a friendly general died, c.T = the dead unit) · auraSelf ({atk, def} added to this unit).
//
// The context (see ctxFor in engine.js) gives: s i u T P O · foe() mine() rnd(list) strongest(list)
// weakest(list) hurt() · dmg(t,n) dmgHero(n) heal(t,n) healHero(n) · draw(n) mana(n) · neg(t,k,turns,v)
// buff(t,k,turns,v) cleanse(t) immune(t,turns) dodge(t) dispel(t,n) · recover(fn) summonFrom(fn)
// discardPile(fn) · atk(t) wenmaiCount() elCount(el) fx(kind, extra) log.

import { XIYOU_BOND } from '../data/cardsXiyou.js';
import { MYTH_BOND } from '../data/cardsMyth.js';

/** 取经五众的 id，《西游释厄传》要数场上有没有取经人。 */
const XIYOU = new Set(XIYOU_BOND.xiyou.auto.generals);
const RENJIAN = new Set(MYTH_BOND.renjian.auto.generals);

export const FX = {
  // ───────── 第四章 · 先秦诸子（稷下学宫） ─────────
  'LJ-018': {   // 孔子·杏坛  弘道
    summon: (c) => { c.fx('tan'); for (const u of c.mine()) if (u !== c.u) c.buff(u, 'defUp', 99, 1); },
    skill: (c) => { c.draw(2); for (const u of c.mine()) c.cleanse(u); },
  },
  'LJ-019': {   // 老子·上善若水
    summon: (c) => { c.fx('water'); const t = c.strongest(c.foe()); if (t) c.neg(t, 'atkDown', 2, 3); },
    skill: (c) => { for (const u of c.mine()) c.dodge(u); },
  },
  'LJ-020': {   // 庄子·逍遥  鲲鹏
    summon: (c) => { c.fx('kun'); c.draw(1); },
    afterAttack: (c) => { if (c.u.hp > 0) c.buff(c.u, 'atkUp', 1, 2); },
    skill: (c) => { const t = c.T; c.dmg(t, 3); if (t.hp > 0) c.neg(t, 'seal', 2, 0); },
  },
  'LJ-021': {   // 墨子·兼爱  守城
    whenHit: (c) => { const o = c.rnd(c.mine().filter((x) => x !== c.u && x.hp < x.maxHp)); if (o) c.heal(o, 2); },
    skill: (c) => { for (const u of c.mine()) c.buff(u, 'defUp', 2, 2); c.healHero(2); },
  },
  'WM-012': {   // 竹简·诗三百
    turn: (c) => { if (c.up) c.draw(1); else if (c.s.turn % 2 === 0) c.draw(1); },
    play: (c) => { for (const u of c.mine()) c.buff(u, 'atkUp', 99, 1); },
  },
  'ZL-019': { onDeath: (c) => c.dmgHero(1) },                                   // 断简残灵
  'ZL-020': { summon: (c) => { const t = c.strongest(c.foe()); if (t) c.neg(t, 'atkDown', 2, 2); } },
  'ZL-021': { onHit: (c) => { if (c.T.hp > 0) c.neg(c.T, 'seal', 1, 0); } },     // 诡辩之影
  'ZL-022': { turn: (c) => c.healHero(2) },                                      // 佚书壁影

  // ───────── 第五章 · 楚辞山鬼（云梦泽） ─────────
  'LJ-022': {   // 屈原·求索
    summon: (c) => { c.fx('qiusuo'); c.draw(1); c.mana(1); },
    skill: (c) => { for (const t of c.foe()) c.dmg(t, 2); c.draw(1); },
  },
  'LJ-023': {   // 山鬼·薜荔
    summon: (c) => { c.dodge(c.u); },
    afterAttack: (c) => { if (c.u.hp > 0 && !c.has(c.u, 'dodge')) c.dodge(c.u); },
    skill: (c) => { c.dmg(c.T, 3); c.neg(c.T, 'atkDown', 2, 2); },
  },
  'LJ-024': {   // 湘君·洞庭
    turn: (c) => { const t = c.rnd(c.hurt()); if (t) c.heal(t, 2); },
    skill: (c) => { c.cleanse(c.T); c.heal(c.T, 4); c.immune(c.T, 2); },
  },
  'LJ-025': {   // 国殇·魂魄毅
    onDeath: (c) => { c.buff(c.u, 'atkUp', 99, 1); },
    skill: (c) => { c.dmg(c.T, 4); c.dmg(c.u, 2); },
  },
  'WM-013': {   // 九歌·湘夫人
    play: (c) => { c.draw(1); },
    turn: (c) => { for (const u of c.mine()) if (c.el(u) === 'water') c.buff(u, 'atkUp', 1, 1); if (c.up) c.healHero(1); },
  },
  'ZL-023': { onDeath: (c) => { const t = c.rnd(c.foe()); if (t) c.neg(t, 'atkDown', 1, 1); } },
  'ZL-024': { summon: (c) => { for (const t of c.foe()) c.dmg(t, 1); } },
  'ZL-025': { whenHit: (c) => { if (c.T.hp > 0) c.neg(c.T, 'bleed', 2, 1); } },
  'ZL-026': { turn: (c) => { const t = c.rnd(c.hurt()); if (t) c.heal(t, 2); } },

  // ───────── 第六章 · 秦汉气象（未央宫） ─────────
  'LJ-026': {   // 司马迁·史记
    summon: (c) => { c.fx('shiji'); c.recover((d) => d.type === 'wenmai' || d.type === 'general'); },
    skill: (c) => { c.draw(2); for (const u of c.mine()) c.buff(u, 'atkUp', 2, 1); },
  },
  'LJ-027': {   // 张骞·凿空
    summon: (c) => { c.fx('road'); c.draw(1); c.mana(1); },
    afterAttack: (c) => { if (c.u.hp > 0 && c.oncePerTurn('zaokong')) c.draw(1); },
    skill: (c) => { c.mana(2); c.draw(1); },
  },
  'LJ-028': {   // 蔡伦·造纸
    turn: (c) => { if (c.handSize() < 4) c.draw(1); },
    skill: (c) => { c.draw(1); c.costDown('talisman'); c.costDown('wenmai'); },
  },
  'LJ-029': {   // 无名戍卒·十五从军征
    summon: (c) => { for (const u of c.mine()) if (u !== c.u) c.buff(u, 'defUp', 99, 1); },
    onDeath: (c) => { c.buff(c.u, 'defUp', 99, 1); },
  },
  'WM-014': {   // 太史公书
    turn: (c) => { if (c.s.turn % 2 === 0 || c.up) c.recover((d) => d.cost <= 4); },
  },
  'ZL-027': { onHit: (c) => { if (c.T.hp > 0 && c.T.def > 0) { c.T.def -= 1; c.mark(c.T, 'def', -1); } } },
  'ZL-028': { summon: (c) => { const t = c.rnd(c.foe()); if (t) c.neg(t, 'stun', 1, 0); } },
  'ZL-029': { turn: (c) => { for (const u of c.foe()) c.dmg(u, 1); } },
  'ZL-030': { whenHit: (c) => c.dmg(c.T, 2) },

  // ───────── 第七章 · 魏晋风骨（兰亭） ─────────
  'LJ-030': {   // 王羲之·兰亭
    play: (c) => {},
    summon: (c) => { c.fx('lanting'); c.draw(1); for (const u of c.mine()) c.buff(u, 'defUp', 2, 1); },
    skill: (c) => { c.draw(2); c.costDown('any'); c.costDown('any'); },
  },
  'LJ-031': {   // 陶渊明·东篱
    turn: (c) => { c.healHero(2); },
    skill: (c) => { c.healHero(4); for (const u of c.mine()) c.heal(u, 2); },
  },
  'LJ-032': {   // 嵇康·广陵散
    summon: (c) => { c.fx('guangling'); for (const t of c.foe()) c.neg(t, 'atkDown', 2, 1); },
    skill: (c) => { for (const t of c.foe()) { c.dmg(t, 2); if (t.hp > 0) c.neg(t, 'seal', 1, 0); } },
  },
  'LJ-033': {   // 顾恺之·传神
    summon: (c) => { const t = c.strongest(c.mine().filter((x) => x !== c.u)); if (t) { c.buff(t, 'atkUp', 99, 2); c.buff(t, 'defUp', 99, 1); } },
    skill: (c) => { c.summonFrom((d) => d.type === 'general' && d.cost <= 5); },
  },
  'WM-015': {   // 世说新语
    turn: (c) => { if (c.handSize() < 5) c.draw(1); else c.mana(1); },
  },
  'ZL-031': { onDeath: (c) => c.draw ? null : null },                            // 空谈之影（纯白板身材）
  'ZL-032': { summon: (c) => { for (const t of c.foe()) c.neg(t, 'atkDown', 1, 1); } },
  'ZL-033': { onHit: (c) => { if (c.T.hp > 0) c.neg(c.T, 'stun', 1, 0); } },
  'ZL-034': { turn: (c) => { for (const u of c.mine()) c.buff(u, 'atkUp', 1, 1); } },

  // ───────── 第八章 · 敦煌丝路（莫高窟） ─────────
  'LJ-034': {   // 玄奘·取经
    summon: (c) => { c.fx('road'); c.draw(2); },
    turn: (c) => { if (c.oncePerTurn('xuanzang')) c.healHero(1); },
    skill: (c) => { c.recover(() => true); c.recover(() => true); c.healHero(3); },
  },
  'LJ-035': {   // 飞天·反弹琵琶
    summon: (c) => { c.dodge(c.u); c.fx('feitian'); },
    afterAttack: (c) => { if (c.u.hp > 0) c.buff(c.u, 'atkUp', 1, 2); },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'atkUp', 2, 2); c.dodge(u); } },
  },
  'LJ-036': {   // 乐僔·凿窟
    summon: (c) => { for (const u of c.mine()) c.buff(u, 'defUp', 99, 1); },
    turn: (c) => { const t = c.rnd(c.hurt()); if (t) c.heal(t, 2); },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'defUp', 2, 2); c.cleanse(u); } },
  },
  'LJ-037': {   // 藏经洞画工
    play: (c) => {},
    summon: (c) => { c.draw(1); c.costDown('wenmai'); },
    skill: (c) => { c.recover((d) => d.type === 'wenmai'); c.draw(1); },
  },
  'WM-016': {   // 莫高窟壁画
    turn: (c) => { for (const u of c.mine()) c.buff(u, 'atkUp', 1, 1); if (c.up) c.healHero(1); },
    play: (c) => { c.draw(1); },
  },
  'ZL-035': { onDeath: (c) => c.dmgHero(1) },
  'ZL-036': { summon: (c) => { const t = c.strongest(c.foe()); if (t) c.neg(t, 'seal', 2, 0); } },
  'ZL-037': { onHit: (c) => { if (c.T.hp > 0) c.neg(c.T, 'bleed', 2, 1); } },
  'ZL-038': { turn: (c) => { c.healHero(1); for (const u of c.mine()) c.heal(u, 1); } },

  // ───────── 第九章 · 明清市井（江南） ─────────
  'LJ-038': {   // 曹雪芹·石头记
    summon: (c) => { c.fx('dream'); c.draw(2); },
    onDeath: (c) => { c.draw(1); },
    skill: (c) => { c.draw(2); c.healHero(3); },
  },
  'LJ-039': {   // 吴承恩·齐天
    afterAttack: (c) => { if (c.u.hp > 0 && c.oncePerTurn('wucheng')) c.mana(1); },
    skill: (c) => { c.dmg(c.T, 4); if (c.T.hp > 0) c.neg(c.T, 'stun', 1, 0); },
  },
  'LJ-040': {   // 李时珍·本草
    turn: (c) => { c.healHero(1); const t = c.rnd(c.hurt()); if (t) c.heal(t, 2); },
    skill: (c) => { c.heal(c.T, 5); c.cleanse(c.T); c.immune(c.T, 2); },
  },
  'LJ-041': {   // 徐霞客·游记
    summon: (c) => { c.draw(1); c.mana(1); },
    turn: (c) => { if (c.handSize() < 4) c.draw(1); },
    skill: (c) => { c.draw(2); c.mana(2); },
  },
  'WM-017': {   // 永乐大典
    turn: (c) => { c.recover((d) => d.cost <= (c.up ? 5 : 3)); },
  },
  'ZL-039': { onDeath: (c) => { const t = c.rnd(c.foe()); if (t) c.dmg(t, 2); } },
  'ZL-040': { summon: (c) => { for (const t of c.foe()) c.neg(t, 'defDown', 2, 1); } },
  'ZL-041': { onHit: (c) => { if (c.T.hp > 0 && c.T.atk > 0) { c.T.atk -= 1; c.mark(c.T, 'atk', -1); } } },
  'ZL-042': { turn: (c) => { c.healHero(2); } },

  // ───────── 第十章 · 天工星汉（观星台 · 终章） ─────────
  'LJ-042': {   // 张衡·浑天
    summon: (c) => { c.fx('sky'); c.draw(1); for (const u of c.mine()) c.buff(u, 'defUp', 99, 1); },
    skill: (c) => { for (const t of c.foe()) { c.dmg(t, 2); if (t.hp > 0) c.neg(t, 'stun', 1, 0); } },
  },
  'LJ-043': {   // 祖冲之·密率
    turn: (c) => { c.mana(1); },
    skill: (c) => { c.draw(3); },
  },
  'LJ-044': {   // 李冰·都江堰
    summon: (c) => { for (const u of c.mine()) c.buff(u, 'defUp', 99, 2); },
    whenHit: (c) => { if (c.T.hp > 0) c.dmg(c.T, 2); },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'defUp', 2, 2); c.heal(u, 2); } c.healHero(3); },
  },
  'LJ-045': {   // 宋应星·天工开物
    summon: (c) => { c.draw(2); c.mana(1); },
    turn: (c) => { if (c.oncePerTurn('songyx')) c.costDown('any'); },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'atkUp', 2, 2); c.buff(u, 'defUp', 2, 1); } c.draw(1); },
  },
  'WM-018': {   // 九章算术
    turn: (c) => { c.mana(1); if (c.up) c.draw(1); },
    play: (c) => { c.draw(1); },
  },
  'ZL-043': { onDeath: (c) => c.dmgHero(2) },
  'ZL-044': { summon: (c) => { for (const t of c.foe()) c.dmg(t, 2); } },
  'ZL-045': { onHit: (c) => { if (c.T.hp > 0) c.neg(c.T, 'seal', 1, 0); } },
  'ZL-046': { turn: (c) => { c.healHero(2); for (const u of c.mine()) c.buff(u, 'atkUp', 1, 1); } },

  // ───────── 第十一章 · 海丝远航（泉州港） ─────────
  'LJ-046': {   // 郑和·宝船
    summon: (c) => { c.fx('sail'); c.draw(2); c.mana(1); },
    skill: (c) => { for (const t of c.foe()) c.dmg(t, 2); for (const u of c.mine()) c.buff(u, 'defUp', 2, 2); },
  },
  'LJ-047': {   // 妈祖·天妃
    turn: (c) => { c.healHero(1); const t = c.rnd(c.hurt()); if (t) c.heal(t, 2); },
    skill: (c) => { for (const u of c.mine()) { c.cleanse(u); c.heal(u, 2); } },
  },
  'LJ-048': {   // 马欢·瀛涯
    summon: (c) => { c.draw(1); },
    turn: (c) => { if (c.handSize() < 4) c.draw(1); },
    skill: (c) => { c.draw(2); c.costDown('any'); },
  },
  'LJ-049': {   // 窑工·青花
    summon: (c) => { c.fx('kiln'); for (const u of c.mine()) { u.atk += 1; c.mark(u, 'atk', 1); } },
    skill: (c) => { const t = c.T; c.dmg(t, 4); if (t.hp <= 0) c.draw(1); },
  },
  'WM-019': {   // 针路·指南针
    play: (c) => { c.draw(1); },
    turn: (c) => { c.mana(1); if (c.up) c.draw(1); },
  },
  'ZL-047': { onDeath: (c) => c.dmgHero(1) },
  'ZL-048': { summon: (c) => { for (const t of c.foe()) c.dmg(t, 1); } },
  'ZL-049': { onHit: (c) => { if (c.T.hp > 0 && c.T.def > 0) { c.T.def -= 1; c.mark(c.T, 'def', -1); } } },
  'ZL-050': { turn: (c) => c.healHero(2) },

  // ───────── 第十二章 · 归藏传灯（藏书楼 · 终章） ─────────
  'LJ-050': {   // 范钦·天一阁
    summon: (c) => { c.fx('tianyi'); for (const u of c.mine()) { u.def += 2; c.mark(u, 'def', 2); } },
    onDeath: (c) => { c.u.def += 1; c.mark(c.u, 'def', 1); },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'defUp', 2, 2); c.immune(u, 2); } },
  },
  'LJ-051': {   // 朱熹·白鹿洞
    summon: (c) => { c.draw(1); },
    turn: (c) => { if (c.handSize() < 4) c.draw(1); },
    skill: (c) => { c.draw(2); for (const u of c.mine()) c.buff(u, 'atkUp', 2, 1); },
  },
  'LJ-052': {   // 郑樵·校雠
    summon: (c) => { c.fx('catalog'); c.recover(() => true); },
    skill: (c) => { c.recover(() => true); c.recover(() => true); c.costDown('any'); },
  },
  'LJ-053': {   // 贞人·灼甲
    summon: (c) => { c.fx('oracle'); c.draw(1); const t = c.strongest(c.foe()); if (t) c.neg(t, 'atkDown', 2, 1); },
    skill: (c) => { c.dmg(c.T, 3); if (c.T.hp > 0) c.neg(c.T, 'seal', 2, 0); },
  },
  'WM-020': {   // 雕版·书坊
    turn: (c) => { c.recover((d) => d.cost <= (c.up ? 5 : 3)); if (c.up) c.draw(1); },
  },
  'ZL-051': { onHit: (c) => { if (c.T.hp > 0 && c.T.atk > 0) { c.T.atk -= 1; c.mark(c.T, 'atk', -1); } } },
  'ZL-052': { turn: (c) => c.healHero(2) },
  'ZL-053': { onDeath: (c) => c.dmgHero(1) },
  'ZL-054': { summon: (c) => { const t = c.strongest(c.foe()); if (t) c.neg(t, 'seal', 2, 0); } },

  // ───────── 西游取经五众（src/data/cardsXiyou.js） ─────────
  'LJ-054': {   // 孙悟空：火眼金睛看破一切障眼法，所以是驱散而不是伤害
    summon: (c) => {
      for (const t of c.foe()) c.dispel(t, 3);
      const t = c.strongest(c.foe()); if (t) c.neg(t, 'atkDown', 2, c.up ? 3 : 2);
    },
    afterAttack: (c) => c.dodge(c.u),
    // 筋斗云：一棒打死就再来一下。attacks 是已攻击次数，退一格等于多一次
    skill: (c) => { c.dmg(c.T, c.atk(c.u)); if (c.T.hp <= 0) c.u.attacks = Math.max(0, c.u.attacks - 1); },
  },
  'LJ-055': {   // 猪八戒
    whenHit: (c) => { c.neg(c.T, 'atkDown', 1, 1); if (c.up) c.heal(c.u, 1); },
    skill: (c) => { for (const u of c.mine()) c.heal(u, 2); c.heal(c.u, 2); },
  },
  'LJ-056': {   // 沙悟净
    turn: (c) => { for (const u of c.mine()) c.buff(u, 'defUp', 1, 1); if (c.up) c.heal(c.u, 1); },
    skill: (c) => { c.dmg(c.T, 4); c.neg(c.T, 'defDown', 2, 2); },
  },
  'LJ-057': {   // 白龙马：「意马」是卡表上的 rush，引擎在 makeInst 里就把它叫醒了
    summon: (c) => { if (c.up) c.mana(1); },
    afterAttack: (c) => { if (!c.T && c.oncePerTurn('LJ-057')) c.draw(1); },   // T 为空 = 这一下打的是主将
    skill: (c) => { c.buff(c.u, 'atkUp', 2, 3); c.dodge(c.u); },
  },
  'LJ-058': {   // 唐三藏
    summon: (c) => { const t = c.strongest(c.foe()); if (t) c.neg(t, 'stun', 1, 0); },
    turn: (c) => c.healHero(c.up ? 3 : 2),
    skill: (c) => { c.draw(2); for (const u of c.mine()) c.cleanse(u); },
  },
  'WM-021': {   // 西游释厄传
    turn: (c) => { if (c.mine().some((u) => XIYOU.has(u.id))) { c.draw(1); if (c.up) c.healHero(1); } },
  },

  // ───────── 人间诸神（src/data/cardsMyth.js） ─────────
  // 杨戬就是二郎神。天眼先看增益：有就驱散，没有就压攻击。
  'LJ-063': {
    summon: (c) => {
      const t = c.strongest(c.foe());
      if (!t) return;
      const had = t.st.some((x) => x.k === 'atkUp' || x.k === 'defUp' || x.k === 'reflect');
      if (had) c.dispel(t, 6);
      else c.neg(t, 'atkDown', 2, 2);
    },
    skill: (c) => c.dmg(c.T, c.atk(c.u)),
  },
  'LJ-064': {   // 后羿：弓是对着太阳的，所以只在打火属性时多一下
    onHit: (c) => { if (c.T.hp > 0 && c.el(c.T) === 'fire') c.dmg(c.T, 2); },
    skill: (c) => c.dmg(c.T, 5),
  },
  'LJ-065': {   // 姜子牙：榜点到的是别人，不是他自己
    summon: (c) => { for (const u of c.mine()) if (u !== c.u) c.buff(u, 'atkUp', 99, 1); },
    skill: (c) => { c.draw(2); c.healHero(2); },
  },
  'LJ-066': {   // 夸父：逐日是卡上的 rush；道渴在每次攻击之后
    afterAttack: (c) => { if (c.u.hp > 0) c.dmg(c.u, 1); },
    skill: (c) => { c.dmg(c.T, 4); c.dmg(c.u, 2); },
  },
  'LJ-067': {   // 精卫：一块石头填一点海，也护住自己这边一点
    turn: (c) => { c.dmgHero(1); c.healHero(1); },
    skill: (c) => { c.dmgHero(2); c.healHero(2); },
  },
  'LJ-068': {   // 伏羲
    summon: (c) => { c.draw(1); c.costDown('any'); },
    skill: (c) => { c.draw(2); for (const u of c.mine()) c.buff(u, 'defUp', 2, 2); },
  },
  'LJ-069': {   // 白素贞
    whenHit: (c) => { if (c.u.hp > 0) c.heal(c.u, 2); },
    skill: (c) => { for (const t of c.foe()) c.neg(t, 'atkDown', 2, 2); for (const u of c.mine()) c.heal(u, 2); },
  },
  'WM-024': {   // 山海经
    turn: (c) => { if (c.mine().some((u) => RENJIAN.has(u.id))) { c.draw(1); if (c.up) c.healHero(1); } },
  },

  // ───────── 器物（src/data/artifacts.js） ─────────
  // 器物的钩子由 runFx 挂在佩戴者身上跑，所以这里的 c.u 是那名灵将，c.up 看的是器物自己的品阶。
  // ATK/DEF/HP/守护 这些静态加成不写在这儿——它们在卡表的 gear 字段里，引擎直接读。
  'QW-001': {   // 轩辕·帝剑
    equip: (c) => { const t = c.strongest(c.foe()); if (t) c.dmg(t, 2); } },
  'QW-003': {   // 混天绫
    equip: (c) => c.dodge(c.u) },
  'QW-004': {   // 定海神针
    afterAttack: (c) => { if (c.u.hp > 0) c.buff(c.u, 'atkUp', 2, 1); } },
  'QW-005': {   // 昆仑·照世镜
    equip: (c) => c.draw(1),
    turn: (c) => { if (c.handSize() < 4) c.draw(1); } },
  'QW-006': {   // 神农药鼎
    turn: (c) => { c.heal(c.u, 2); c.healHero(2); } },
  'QW-007': {   // 芭蕉扇
    equip: (c) => { for (const t of c.foe()) { c.dmg(t, c.up ? 2 : 1); if (t.hp > 0) c.neg(t, 'atkDown', 1, 1); } } },
  'QW-008': {   // 紫毫笔
    afterAttack: (c) => { if (c.u.hp > 0 && c.oncePerTurn('QW-008')) { c.draw(1); if (c.up) c.mana(1); } } },
  'QW-009': {   // 青铜纵目
    equip: (c) => { c.cleanse(c.u); c.immune(c.u, c.up ? 3 : 2); } },
  'QW-010': {   // 九节杖
    turn: (c) => { for (const u of c.mine()) c.heal(u, c.up ? 2 : 1); } },
  'QW-011': {   // 东皇钟
    equip: (c) => { for (const t of c.foe()) c.neg(t, 'stun', 1, 0); } },
  'QW-012': {   // 盘古斧
    equip: (c) => { for (const t of c.foe()) c.dmg(t, 3); } },
  'QW-013': {   // 炼妖壶：收妖成了，壶把那口气还给佩戴者，所以挂 99 回合（引擎里 >=99 视为永久）
    equip: (c) => { const t = c.weakest(c.foe()); if (!t) return; c.dmg(t, c.up ? 8 : 6); if (t.hp <= 0) c.buff(c.u, 'atkUp', 99, 2); } },
  'QW-014': {   // 昊天塔
    equip: (c) => c.healHero(3) },
  'QW-015': {   // 崆峒印
    equip: (c) => { const t = c.strongest(c.foe()); if (!t) return; c.neg(t, 'stun', c.up ? 2 : 1, 0); c.neg(t, 'defDown', 2, 2); } },
  'QW-016': {   // 女娲石
    equip: (c) => { for (const u of c.mine()) c.cleanse(u); },
    turn: (c) => c.healHero(c.up ? 3 : 2) },
  'QW-017': {   // 伏羲琴
    equip: (c) => c.draw(c.up ? 3 : 2),
    afterAttack: (c) => { if (c.u.hp > 0 && c.oncePerTurn('QW-017')) c.mana(1); } },

  // ───────── 第八章 · 两宋风雅（src/data/cardsSong.js） ─────────
  'LJ-059': {   // 李清照：《金石录》两千卷聚了又散，所以她做的事是「把丢掉的捡回来」
    summon: (c) => { c.recover(() => true); c.draw(1); },
    skill: (c) => { for (const u of c.foe()) c.neg(u, 'atkDown', 2, 2); c.healHero(3); },
  },
  'LJ-060': {   // 辛弃疾：越打越凶，但上限压在 +3——他一辈子也只带过五十骑
    summon: (c) => { const t = c.strongest(c.foe()); if (t) c.dmg(t, 3); },
    afterAttack: (c) => { if (c.u.hp > 0 && (c.u.tiaodeng ?? 0) < 3) { c.u.tiaodeng = (c.u.tiaodeng ?? 0) + 1; c.u.atk += 1; c.mark(c.u, 'atk', 1); } },
    skill: (c) => { for (const u of c.mine()) { c.buff(u, 'atkUp', 2, 2); c.wake(u); } },
  },
  'LJ-061': {   // 张择端：画的是满城的人，所以文脉区越热闹他越站得住
    summon: (c) => { const n = Math.min(c.wenmaiCount(), 3); if (n > 0) { c.u.def += n; c.mark(c.u, 'def', n); } },
    skill: (c) => { c.draw(2); c.costDown('any'); },
  },
  'LJ-062': {   // 王希孟：十八岁画完就走了，所以他给的是一阵子的锐气和一份身后的余荫
    summon: (c) => { for (const u of c.mine()) c.buff(u, 'atkUp', 2, 1); },
    onDeath: (c) => c.draw(2),
    skill: (c) => { for (const u of c.mine()) { c.heal(u, 3); u.def += 1; c.mark(u, 'def', 1); } },
  },
  // 全场 DEF 那一半是光环，写在 engine.js 的 auraDef 里（和盘古创世图同一个位置）——
  // 光环得随文脉卡在不在场实时变，不能在这儿一次性加死。
  'WM-022': {   // 千里江山图：青绿是厚涂上去的，护得住
    turn: (c) => { for (const u of c.mine()) c.heal(u, c.up ? 2 : 1); },
  },
  'WM-023': {   // 清明上河图：一整座城在做生意，所以出的是灵力
    turn: (c) => { c.mana(1); if (c.up) c.draw(1); },
  },
  'ZL-057': { onHit: (c) => { if (c.T.hp > 0 && c.T.def > 0) { c.T.def -= 1; c.mark(c.T, 'def', -1); } } },
  'ZL-058': { summon: (c) => { const t = c.rnd(c.foe()); if (t) c.neg(t, 'seal', 2, 0); } },
  'ZL-059': { turn: (c) => c.healHero(2) },

  // ── 文物器物（cardsRelic.js）。效果都从实物本身的特点长出来，不硬安。 ──
  'QW-018': {   // 青铜神树：九枝九鸟，树在鸟就回得来
    equip: (c) => c.draw(c.up ? 2 : 1),
    turn: (c) => { for (const u of c.mine()) c.heal(u, 1); } },
  'QW-019': {   // 红山玉龙
    equip: (c) => c.healHero(c.up ? 4 : 2) },
  'QW-020': {   // 何尊：铭文记的是「宅兹中国」，所以攒的文脉越多，它越有分量
    equip: (c) => { const n = Math.min(c.wenmaiCount(), c.up ? 5 : 3); if (n > 0) c.buff(c.u, 'atkUp', 99, n); } },
  'QW-021': {   // 后母戊鼎
    equip: (c) => c.healHero(c.up ? 7 : 4) },
  'QW-022': {   // 曾侯乙编钟：一套 65 件十二律俱全，响起来是全场的事
    equip: (c) => { for (const u of c.mine()) { c.buff(u, 'atkUp', 99, 1); if (c.up) c.buff(u, 'defUp', 99, 1); } } },
  'QW-023': {   // 越王勾践剑：两千年不锈，所以也封不住
    equip: (c) => { c.cleanse(c.u); const t = c.strongest(c.foe()); if (t) c.dmg(t, c.up ? 5 : 3); },
    turn: (c) => c.cleanse(c.u) },
  'QW-024': {   // 铜奔马：三足腾空，落地就已经在跑了
    equip: (c) => { c.wake(c.u); if (c.up) c.u.attacks = Math.max(0, c.u.attacks - 1); } },
  'QW-025': {   // 长信宫灯：烟顺着袖子沉进体腔，屋里不留烟
    turn: (c) => { c.heal(c.u, c.up ? 3 : 2); c.cleanse(c.u); } },
  'QW-026': {   // 素纱襌衣：49 克，轻到打不着
    equip: (c) => { c.dodge(c.u); if (c.up) c.cleanse(c.u); } },
  'QW-027': {   // 银香囊：常平架，怎么转小碗都朝上
    equip: (c) => c.cleanse(c.u),
    whenHit: (c) => c.cleanse(c.u) },

  'ZL-055': {   // 蚀骨枷
    equip: (c) => { const t = c.strongest(c.foe()); if (t) c.neg(t, 'atkDown', 2, 2); } },
};

/**
 * Boss passives. Each fires at the start of the owner's turn when `turns % every === 0`.
 * chip/info text lives in battle.js (PASSIVE_ZH).
 */
export const PASSIVES = {
  // chapters 1–3 keep their original behaviour, now expressed here so every boss goes through one path
  chaos: { every: 3, run: (c) => { c.fx('chaos'); for (const u of c.foe()) if (u.def > 0) { u.def -= 1; c.mark(u, 'def', -1); } for (const u of c.foe()) c.dmg(u, 1); } },
  nishang: { every: 3, run: (c) => { c.fx('nishang'); for (const u of c.foe()) c.neg(u, 'atkDown', 1, 2); c.healHero(3); } },
  juexiang: { every: 3, run: (c) => { c.fx('juexiang'); for (const u of c.foe()) c.neg(u, 'seal', 1, 0); c.mana(1); } },
  // chapters 4–10
  biantong: { every: 3, run: (c) => { c.fx('biantong'); c.draw(2); for (const u of c.foe()) c.neg(u, 'atkDown', 1, 1); } },
  zhaohun: { every: 3, run: (c) => { c.fx('zhaohun'); c.summonFrom((d) => d.type === 'general' && d.cost <= 4); c.healHero(2); } },
  fenshu: { every: 3, run: (c) => { c.fx('fenshu'); for (const u of c.foe()) c.dmg(u, 1); c.burnHand(1); } },
  qingtan: { every: 3, run: (c) => { c.fx('qingtan'); for (const u of c.foe()) c.neg(u, 'seal', 1, 0); c.draw(1); } },
  liusha: { every: 3, run: (c) => { c.fx('liusha'); for (const u of c.foe()) { c.dmg(u, 1); if (u.hp > 0 && u.def > 0) { u.def -= 1; c.mark(u, 'def', -1); } } c.healHero(2); } },
  jinhui: { every: 3, run: (c) => { c.fx("jinhui"); c.draw(2); c.mana(1); for (const u of c.foe()) c.neg(u, 'defDown', 1, 1); } },
  wangchuan: { every: 2, run: (c) => { c.fx('wangchuan'); for (const u of c.foe()) c.neg(u, 'atkDown', 1, 1); c.healHero(2); c.draw(1); } },
  chenzhou: { every: 3, run: (c) => { c.fx('chenzhou'); for (const u of c.foe()) { c.dmg(u, 1); c.neg(u, 'atkDown', 1, 1); } c.draw(1); c.healHero(2); } },
  wuren: { every: 3, run: (c) => { c.fx('wuren'); c.burnHand(1); for (const u of c.foe()) c.neg(u, 'atkDown', 1, 1); c.healHero(1); } },
  // 散佚：丢东西的那种打法——烧一张手牌，再从场上永久刮掉 1 点防御。
  // 和「合卷」的区别在"永久"两个字：南渡路上扔下去的箱子，是捡不回来的。
  sanyi: { every: 3, run: (c) => { c.fx('sanyi'); c.burnHand(1); for (const u of c.foe()) if (u.def > 0) { u.def -= 1; c.mark(u, 'def', -1); } c.healHero(2); } },
};
