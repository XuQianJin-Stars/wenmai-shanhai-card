// 守护者修行：花文脉碎片永久强化主将本身，和卡牌升阶共用碎片池。
// 这是碎片的长线去处——六条路全点满约 1800 碎片，而自由对战每胜 5 枚可以一直刷，
// 所以后期永远有地方花，但也不会随便就圆满。
// 数值口径见 docs/design/CORE_LOOP_v2.md：主将基础 20 气血，手牌上限 7，先手起手 4 张。

export const GUARDIAN = [
  // 每重 +10，点满 20 → 90。后期首领气血 34–46（最终战 54），所以撑满的主将是明显吃得住的，
  // 这条路故意给得厚：碎片有别的去处（升阶、其余五条），肯把 343 枚砸在气血上就该换到安全感。
  // 第一级压到 10，是想让第一章打完就能修一次——先尝到甜头，后面的曲线才拉得动。
  { k: 'hp', name: '固　本', sub: '气血上限', max: 7, cost: [10, 20, 30, 42, 56, 75, 100], per: 10,
    text: (n) => `主将气血上限 +${n * 10}`,
    lore: '守得住的不是城墙，是还愿意记着的人。' },
  // 减伤沿用「防御效果不叠加、取最高」的规矩，且单次 2 点以下的伤害不减（HERO_MIN_HIT）。
  { k: 'armor', name: '磐　石', sub: '受伤减免', max: 3, cost: [40, 90, 160], per: 1,
    text: (n) => `主将受到的伤害 -${n}（与其他减伤取最高，不叠加）`,
    lore: '风沙来了又走，碑还站着。' },
  { k: 'regen', name: '养　元', sub: '回合回复', max: 5, cost: [35, 60, 95, 140, 200], per: 1,
    text: (n) => `每回合开始主将回复 ${n} 点气血`,
    lore: '文脉自己会慢慢长回来，只要还有人翻书。' },
  { k: 'mana', name: '通　灵', sub: '首回合灵力', max: 4, cost: [30, 55, 90, 140], per: 1,
    text: (n) => `第一个回合灵力 +${n}`,
    lore: '起笔那一下最难，墨够浓就顺了。' },
  { k: 'hand', name: '博　闻', sub: '起手牌', max: 3, cost: [25, 55, 100], per: 1,
    text: (n) => `开局起手多抽 ${n} 张牌`,
    lore: '读得多了，手边总有一两句可用的。' },
  // 起手抽多了会在回合结束被弃掉，所以博闻点深之前多半得先把这条撑起来。
  { k: 'handCap', name: '持　盈', sub: '手牌上限', max: 3, cost: [20, 40, 70], per: 1,
    text: (n) => `手牌上限 +${n}（回合结束不再弃掉这些）`,
    lore: '书架总要留几格空的，才装得下新抄来的。' },
];

export const GUARDIAN_KEYS = GUARDIAN.map((g) => g.k);
export const guardianTrack = (k) => GUARDIAN.find((g) => g.k === k) ?? null;

/** 升到下一级要多少碎片；已满则 null。 */
export function guardianCost(k, level) {
  const t = guardianTrack(k);
  if (!t || level >= t.max) return null;
  return t.cost[level];
}

const levelOf = (levels, t) => {
  const n = Math.floor(levels?.[t.k] ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(t.max, n)) : 0;
};

/** 等级表 → 引擎认识的加成。引擎只吃算好的数值，不认识「第几级」。 */
export function boonOf(levels = {}) {
  return Object.fromEntries(GUARDIAN.map((t) => [t.k, levelOf(levels, t) * t.per]));
}

/** 六条路加起来的总重数，也就是守护者本身的等级上限。 */
export const GUARDIAN_MAX = GUARDIAN.reduce((n, t) => n + t.max, 0);

// 守护者的境界：把六条路的总重数折成一个称呼。「登堂入室」拆成两阶，读着顺。
const RANKS = [
  { at: 0, name: '蒙　学' },
  { at: 4, name: '入　门' },
  { at: 9, name: '登　堂' },
  { at: 14, name: '入　室' },
  { at: 19, name: '通　玄' },
  { at: GUARDIAN_MAX, name: '圆　满' },
];

/** 当前境界：level 是已修的总重数，next 是再修几重进下一境（已圆满则 null）。 */
export function guardianRank(levels = {}) {
  const level = GUARDIAN.reduce((n, t) => n + levelOf(levels, t), 0);
  const i = RANKS.findLastIndex((r) => level >= r.at);
  const up = RANKS[i + 1];
  return { level, max: GUARDIAN_MAX, name: RANKS[i].name, next: up ? { name: up.name, need: up.at - level } : null };
}
