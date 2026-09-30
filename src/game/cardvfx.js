// Per-card signature VFX. Keyed by card id and phase, so a card gets its own flourish without the
// rules engine knowing anything about it — battle.js looks the card up when it plays a summon / skill /
// play event. Effects triggered *mid-resolution* (e.g. 焚天符's AoE) still come from engine fx events.
//
// A spec is a list of layers. Each layer: { shape, color, color2, n, r, size, life, glyphs, text, at }
//   shape: burst ring rings pillar dome orbit petals ribbon rain shards beam sparks fire lightning
//          splash glyphs text
//   at:    'self' (default) · 'target' · 'foe' (enemy side centre) · 'mine' · 'hero' · 'foeHero' · 'sky'
// Top level also takes { sfx, flash: [color, strength], shake, wait }.

const L = (shape, o = {}) => ({ shape, ...o });
const sig = (layers, o = {}) => ({ layers, ...o });

/** Shared palettes so a faction reads consistently across its cards. */
const C = {
  gold: '#e8c070', jade: '#7ad0a0', water: '#8ac8f0', fire: '#ff8a50', earth: '#c8a878',
  ink: '#6a6a78', paper: '#f0e6cc', blood: '#c8402a', moon: '#dfe6ff', bronze: '#c8a04a',
  silk: '#e8a0b8', sea: '#6ab0e0', star: '#c8d8ff', lamp: '#ffc070',
};

export const SIGNATURE = {
  // ───────── 第一章 · 上古神话 ─────────
  'LJ-001': { skill: sig([L('beam', { color: '#ffd070', at: 'target' }), L('shards', { color: '#8a7a5a', at: 'target', n: 16 })], { sfx: 'thunder', shake: 0.35, flash: ['#ffe6a0', 0.35] }) },
  'LJ-002': { summon: sig([L('orbit', { color: '#ff9a70', n: 16, r: 1 }), L('petals', { color: '#ffb0a0', n: 12 })], { sfx: 'heal' }),
    skill: sig([L('ring', { color: '#ffb070', r: 3 }), L('glyphs', { glyphs: '造化', color: '#ffd0b0' })], { sfx: 'bond' }) },
  'LJ-003': { summon: sig([L('fire'), L('ring', { color: '#ff7a30', r: 2.6 })], { sfx: 'burn' }),
    skill: sig([L('rings', { color: '#ffb040', n: 3, at: 'target' }), L('sparks', { color: '#ffd070', at: 'target', n: 30 })], { sfx: 'attack', shake: 0.2 }) },
  'LJ-004': { summon: sig([L('glyphs', { glyphs: '敕', color: '#ffe0a0' }), L('sparks', { color: C.bronze, n: 22 })], { sfx: 'buff' }),
    skill: sig([L('beam', { color: '#ffd8a0', at: 'target' }), L('glyphs', { glyphs: '镇', color: '#ffc880', at: 'target' })], { sfx: 'stun' }) },
  'LJ-005': { summon: sig([L('ribbon', { color: C.jade, n: 3 })], { sfx: 'buff' }),
    skill: sig([L('orbit', { color: C.jade, n: 12 }), L('text', { text: '经咏', color: '#bfe8cf' })], { sfx: 'bond' }) },
  // 铁拐李：拐杖顿地，葫芦倾出丹光。
  'LJ-006': { summon: sig([L('spikes', { color: '#7a6244', n: 5, r: 1.5, h: 1.2, life: 1.3 }), L('pillar', { color: '#ffc070', h: 3.2, r: 0.3, life: 1.4 }), L('dome', { color: '#e8b070', r: 1.9 }), L('orbit', { color: '#ffd8a0', n: 12, r: 1 }), L('sparks', { color: '#ffc880', n: 24 }), L('glyphs', { glyphs: '丹', color: '#ffd8a0' })], { sfx: 'buff', shake: 0.16 }),
    skill: sig([L('pillar', { color: '#ffd8a0', at: 'target', h: 3.4, r: 0.35, life: 1.2 }), L('dome', { color: '#e8c890', at: 'target', r: 1.8 }), L('orbit', { color: '#ffd8a0', at: 'target', n: 12 }), L('glyphs', { glyphs: '药', color: '#ffe0b0', at: 'target' })], { sfx: 'heal' }) },
  'LJ-007': { skill: sig([L('pillar', { color: '#ffb060', r: 0.4 }), L('orbit', { color: '#ffd090', n: 10 })], { sfx: 'heal' }) },
  // 嫦娥：月轮垂照，广寒飘带随身而起。
  'LJ-008': { summon: sig([L('pillar', { color: '#93a7d4', h: 7, r: 0.2, life: 1.8 }), L('dome', { color: '#8ba1cf', r: 1.5 }), L('petals', { color: '#b6c6e8', n: 14, spread: 2.2 }), L('rain', { color: '#cfdcf8', n: 30, speed: 4, spread: 3.4 }), L('glyphs', { glyphs: '奔月', color: '#eaf0ff' })], { sfx: 'resonance', el: 'water', flash: ['#dfe6ff', 0.14] }),
    skill: sig([L('pillar', { color: C.moon, at: 'target', h: 5, r: 0.4, life: 1.3 }), L('dome', { color: C.moon, at: 'target', r: 1.8 }), L('petals', { color: '#cfd8f0', at: 'target', n: 12 }), L('glyphs', { glyphs: '清辉', color: '#e0e8ff', at: 'target' })], { sfx: 'buff' }) },
  'LJ-009': { summon: sig([L('ring', { color: C.bronze, r: 3 }), L('glyphs', { glyphs: '桃符', color: '#ffd8a0' })], { sfx: 'playGeneral' }),
    skill: sig([L('beam', { color: '#c8a04a', at: 'target' }), L('ribbon', { color: '#8a6a3a', n: 2, at: 'target' })], { sfx: 'stun' }) },
  'FL-001': { play: sig([L('blades', { color: '#ffe6a0', n: 8, at: 'target' }), L('dome', { color: '#ffe0a0', at: 'target' })], { sfx: 'buff' }) },
  'FL-002': { play: sig([L('vines', { color: C.jade, n: 5 }), L('orbit', { color: '#a8e0b8', n: 10, at: 'hero' })], { sfx: 'draw' }) },
  'FL-003': { play: sig([L('waterColumn', { color: C.water, at: 'target' }), L('rings', { color: C.water, n: 2, at: 'target' })], { sfx: 'stun', shake: 0.18 }) },
  'FL-004': { play: sig([L('flame', { color: '#ffd070', color2: '#c8320a', at: 'foe', h: 3.4, r: 1 })], { sfx: 'burn', flash: ['#ff8a40', 0.3], shake: 0.25 }) },
  'FL-005': { play: sig([L('spikes', { color: C.earth, at: 'target', n: 8 })], { sfx: 'stun', shake: 0.25 }) },
  'FL-006': { play: sig([L('bolt', { color: '#fff6d0', at: 'target' })], { flash: ['#f0f4ff', 0.4], shake: 0.35 }) },
  'WM-001': { play: sig([L('pillar', { color: '#c8a878', h: 5 }), L('glyphs', { glyphs: '开天', color: '#e8d0a0' })], { sfx: 'bond' }) },
  // 女娲五彩石：五色补天，石入苍穹。
  'WM-002': { play: sig([L('pillar', { color: '#ff8a50', h: 11, r: 0.6, life: 1.9 }), L('sparks', { color: '#ff6a4a', n: 14 }), L('sparks', { color: '#ffd070', n: 14 }), L('sparks', { color: '#7ad0a0', n: 14 }), L('sparks', { color: '#8ac8f0', n: 14 }), L('sparks', { color: '#c8a0e0', n: 14 }), L('glyphs', { glyphs: '补天', color: '#ffe0b0' })], { sfx: 'bond', flash: ['#ffd8a0', 0.25] }) },
  // 八仙过海：海涛拔起，各显神通。
  'WM-003': { play: sig([L('waterColumn', { color: C.sea, h: 3.2, r: 1.1, life: 1.6 }), L('rings', { color: C.sea, n: 3, r: 2.8 }), L('ribbon', { color: '#5f93ad', n: 4, len: 3 }), L('glyphs', { glyphs: '过海', color: '#bfe4ff' })], { sfx: 'bond' }) },
  // 皮影剪纸谱：纸影翻飞，剪落成形。
  'WM-004': { play: sig([L('petals', { color: '#d8604a', n: 22, spread: 2.6 }), L('orbit', { color: '#e8806a', n: 12, r: 1.2 }), L('glyphs', { glyphs: '剪', color: '#ffb0a0' })], { sfx: 'draw' }) },
  'WM-005': { play: sig([L('glyphs', { glyphs: '定', color: '#ffd8a0', at: 'target' }), L('dome', { color: '#e8c060', at: 'target' })], { sfx: 'buff' }) },
  // 皮影·旦角：灯影一亮，水袖翻出戏台。
  'WM-007': { play: sig([L('pillar', { color: C.lamp, h: 4, r: 0.45, life: 1.4 }), L('ribbon', { color: '#a86c7e', n: 3, len: 2.8 }), L('petals', { color: '#ffc0b0', n: 12 }), L('glyphs', { glyphs: '旦', color: '#ffd8b0' })], { sfx: 'buff' }) },

  // ───────── 第二章 · 唐宋古风 ─────────
  'LJ-011': { summon: sig([L('rain', { color: '#9aa8b8', n: 30, speed: 7 }), L('dome', { color: '#c8b48a', r: 1.6 })], { sfx: 'playGeneral' }),
    skill: sig([L('dome', { color: '#d8c8a0', at: 'target' }), L('glyphs', { glyphs: '春望', color: '#e8dcc0', at: 'target' })], { sfx: 'buff' }) },
  // 苏轼：大江东去，浪涛卷过阵前；定风波则一船风雨忽止。
  'LJ-012': { summon: sig([L('waterColumn', { color: '#6ab0e0', h: 3.4, r: 1.2, life: 1.6 }), L('rings', { color: '#8ac8f0', n: 3, r: 3.2 }), L('ribbon', { color: '#6e9db4', n: 3 }), L('glyphs', { glyphs: '大江', color: '#cfe8ff' })], { sfx: 'attack', shake: 0.2 }),
    skill: sig([L('dome', { color: '#a0d8f0', at: 'mine', r: 3.4 }), L('rings', { color: '#8ac8f0', at: 'mine', n: 3, r: 3 }), L('text', { text: '定风波', color: '#cfe8ff', at: 'mine' })], { sfx: 'bond' }) },
  // 公孙大娘：剑器浑脱，一舞动四方。
  'LJ-013': { summon: sig([L('blades', { color: '#ffd0a0', n: 10, life: 0.95 }), L('ribbon', { color: '#c03a2a', n: 3, len: 3 }), L('sparks', { color: '#ffb070', n: 20 }), L('glyphs', { glyphs: '剑器', color: '#ffd8b0' })], { sfx: 'attack' }),
    skill: sig([L('blades', { color: '#ffe0b0', at: 'target', n: 14, life: 0.9 }), L('beam', { color: '#ffd0a0', at: 'target' }), L('text', { text: '剑器行', color: '#ffd8a0', at: 'target' })], { sfx: 'counter', shake: 0.3, flash: ['#ffd8a0', 0.25] }) },
  'WM-008': { play: sig([L('shards', { color: '#c8a870', n: 12, size: 0.14 }), L('glyphs', { glyphs: '活字', color: '#e8d0a0' })], { sfx: 'playWenmai' }) },
  // 陆羽茶经：茶树抽条，汤气袅袅。
  'WM-009': { play: sig([L('vines', { color: '#5c8a58', n: 4, h: 2.2, r: 1 }), L('petals', { color: '#9ac88a', n: 12 }), L('glyphs', { glyphs: '茶', color: '#cfe8c0' })], { sfx: 'buff' }) },

  // ───────── 第三章 · 非遗薪传 ─────────
  // 关汉卿·窦娥：六月飞雪，血溅白练。
  'LJ-014': { summon: sig([L('rain', { color: '#f0f4ff', n: 30, speed: 3 }), L('ribbon', { color: '#9aa0ac', n: 2, len: 3 }), L('glyphs', { glyphs: '冤', color: '#e8eaf0' })], { sfx: 'mist' }),
    skill: sig([L('rain', { color: '#ffffff', at: 'foe', n: 44, speed: 5, spread: 5 }), L('blades', { color: '#e0e8f0', at: 'foe', n: 8, life: 0.9 }), L('rings', { color: '#dfe6ff', at: 'foe', n: 3, r: 3.4 }), L('text', { text: '六月飞雪', color: '#f0f4ff', at: 'foe' })], { sfx: 'stun', shake: 0.32, flash: ['#eef2ff', 0.3] }) },
  'LJ-015': { skill: sig([L('petals', { color: C.silk, n: 20 }), L('pillar', { color: '#ff9ab8', r: 0.6 })], { sfx: 'bond' }) },
  'LJ-016': { summon: sig([L('ribbon', { color: '#c8a878', n: 3, len: 2 })], { sfx: 'buff' }),
    skill: sig([L('orbit', { color: '#e0c090', n: 12 }), L('text', { text: '错纱配色', color: '#f0dcb0' })], { sfx: 'draw' }) },
  'LJ-017': { skill: sig([L('rings', { color: '#8ab4d8', n: 3, at: 'target' }), L('glyphs', { glyphs: '慢', color: '#cfe4f4', at: 'target' })], { sfx: 'stun' }) },
  // 苏绣·双面绣：银针引线，两面成纹。
  'WM-010': { play: sig([L('ribbon', { color: '#b8788c', n: 4, len: 3 }), L('orbit', { color: '#ffd0e0', n: 14, r: 1.1 }), L('sparks', { color: C.gold, n: 18 }), L('glyphs', { glyphs: '绣', color: '#ffd8e8' })], { sfx: 'buff' }) },
  'WM-011': { play: sig([L('ring', { color: '#e8b070', r: 2.4 }), L('glyphs', { glyphs: '瓦舍', color: '#ffd8a0' })], { sfx: 'playWenmai' }) },

  // ───────── 第四章 · 先秦诸子 ─────────
  'LJ-018': { skill: sig([L('dome', { color: '#e8d0a0', r: 2, at: 'mine' }), L('glyphs', { glyphs: '有教无类', color: '#f0e0b0', at: 'mine' })], { sfx: 'bond' }) },
  // 老子：上善若水，水绕而不争。
  'LJ-019': { summon: sig([L('waterColumn', { color: '#9ad0e8', h: 2.8, r: 1, life: 1.7 }), L('rings', { color: '#a0d8f0', n: 3, r: 2.8 }), L('ribbon', { color: '#6f9ab4', n: 2 }), L('glyphs', { glyphs: '道', color: '#d8f0ff' })], { sfx: 'bond' }),
    skill: sig([L('dome', { color: '#a0d8f0', at: 'mine', r: 3.6 }), L('rings', { color: '#bfe4f8', at: 'mine', n: 3, r: 3 }), L('text', { text: '柔弱胜刚强', color: '#d8f0ff', at: 'mine' })], { sfx: 'buff' }) },
  'LJ-020': { skill: sig([L('beam', { color: '#9fd0b0', at: 'target' }), L('ribbon', { color: '#7ac0a0', n: 2, at: 'target' })], { sfx: 'attack' }) },
  // 墨子：墨守成城，非攻止戈。
  'LJ-021': { summon: sig([L('blades', { color: '#c8c0a8', n: 8, life: 1 }), L('dome', { color: '#d8d0b8', r: 2.4 }), L('glyphs', { glyphs: '墨', color: '#e8e0c8' })], { sfx: 'buff' }),
    skill: sig([L('dome', { color: '#d8d0b8', at: 'mine', r: 3.8 }), L('rings', { color: '#c8c0a8', at: 'mine', n: 3, r: 3.2 }), L('text', { text: '非攻', color: '#e8e0c8', at: 'mine' })], { sfx: 'bond' }) },
  'WM-012': { play: sig([L('shards', { color: '#c8a870', n: 14, size: 0.2 }), L('glyphs', { glyphs: '思无邪', color: '#e8d8a0' })], { sfx: 'playWenmai' }) },

  // ───────── 第五章 · 楚辞山鬼 ─────────
  'LJ-022': { skill: sig([L('glyphs', { glyphs: '天问', color: '#c8b0e8', at: 'foe' }), L('rain', { color: '#b0a0d8', n: 26, at: 'foe', spread: 5 })], { sfx: 'poem', shake: 0.2 }) },
  'LJ-023': { summon: sig([L('petals', { color: '#7ab060', n: 16 }), L('ribbon', { color: '#5a8a4a', n: 2 })], { sfx: 'mist' }),
    skill: sig([L('beam', { color: '#9ad080', at: 'target' })], { sfx: 'attack' }) },
  // 湘君：洞庭波起，沅芷澧兰。
  'LJ-024': { summon: sig([L('waterColumn', { color: '#7ac0e8', h: 3, r: 1.1, life: 1.6 }), L('rings', { color: '#8ac8f0', n: 3, r: 3 }), L('petals', { color: '#bfe4c8', n: 14 }), L('glyphs', { glyphs: '沅芷', color: '#cfe8ff' })], { sfx: 'heal' }),
    skill: sig([L('waterColumn', { color: '#8ad0f0', at: 'target', h: 2.6, r: 0.8, life: 1.3 }), L('dome', { color: '#a0d8f0', at: 'target', r: 1.8 }), L('glyphs', { glyphs: '玦', color: '#d8f0ff', at: 'target' })], { sfx: 'heal' }) },
  'LJ-025': { summon: sig([L('shards', { color: '#8a5a4a', n: 14 }), L('glyphs', { glyphs: '殇', color: '#e0806a' })], { sfx: 'die' }),
    skill: sig([L('beam', { color: '#ff8a6a', at: 'target' }), L('sparks', { color: '#ffb090', n: 26, at: 'target' })], { sfx: 'attack', shake: 0.25 }) },
  // 九歌·湘夫人：帝子降兮北渚，秋风袅袅洞庭波。
  'WM-013': { play: sig([L('waterColumn', { color: '#7ac0e8', h: 3.2, r: 1, life: 1.6 }), L('ribbon', { color: '#6f9ab4', n: 3, len: 3 }), L('petals', { color: '#cfe8d8', n: 14 }), L('glyphs', { glyphs: '九歌', color: '#d8f0ff' })], { sfx: 'draw' }) },

  // ───────── 第六章 · 秦汉气象 ─────────
  'LJ-026': { skill: sig([L('orbit', { color: '#e8d0a0', n: 14 }), L('glyphs', { glyphs: '通古今', color: '#f0e0b0' })], { sfx: 'bond' }) },
  // 张骞：凿空西域，黄沙里凿出一条路。
  'LJ-027': { summon: sig([L('beam', { color: C.bronze, at: 'foe' }), L('shards', { color: '#c8a870', n: 16 }), L('rings', { color: C.bronze, n: 3, r: 2.8 }), L('glyphs', { glyphs: '凿空', color: '#ffd8a0' })], { sfx: 'playGeneral' }),
    skill: sig([L('rings', { color: C.gold, at: 'mine', n: 4, r: 2.6 }), L('orbit', { color: '#ffd8a0', at: 'mine', n: 16, r: 1.4 }), L('text', { text: '通西域', color: '#ffe0b0', at: 'mine' })], { sfx: 'draw' }) },
  'LJ-028': { summon: sig([L('petals', { color: C.paper, n: 16 })], { sfx: 'playGeneral' }),
    skill: sig([L('petals', { color: '#f6f0e0', n: 14, at: 'hero' }), L('text', { text: '蔡侯纸', color: '#f0ecd8' })], { sfx: 'draw' }) },
  // 戍卒：夯土为垒，八十始得归。
  'LJ-029': { summon: sig([L('spikes', { color: '#6a5a44', n: 6, r: 1.8, h: 1.3 }), L('shards', { color: '#7a6a54', n: 14 }), L('glyphs', { glyphs: '袍泽', color: '#d8c8a8' })], { sfx: 'buff', shake: 0.18 }),
    skill: sig([L('dome', { color: '#c8b090', at: 'target', r: 1.9 }), L('petals', { color: '#d8c8a0', at: 'target', n: 12 }), L('text', { text: '始得归', color: '#e8d8b8', at: 'target' })], { sfx: 'heal' }) },
  'WM-014': { play: sig([L('shards', { color: '#b0a070', n: 12 }), L('glyphs', { glyphs: '史', color: '#e8d0a0' })], { sfx: 'playWenmai' }) },

  // ───────── 第七章 · 魏晋风骨 ─────────
  'LJ-030': { skill: sig([L('ribbon', { color: '#cfe0ea', n: 4, len: 3 }), L('glyphs', { glyphs: '永和九年', color: '#e8f0f4' })], { sfx: 'poem' }) },
  // 陶渊明：采菊东篱下，悠然见南山。
  'LJ-031': { summon: sig([L('vines', { color: '#5c8a58', n: 5, h: 2.4, r: 1.1 }), L('petals', { color: '#e8d070', n: 16 }), L('glyphs', { glyphs: '东篱', color: '#cfe8b0' })], { sfx: 'buff' }),
    skill: sig([L('vines', { color: '#6a9a60', at: 'mine', n: 5, h: 2.2, r: 1.4 }), L('petals', { color: '#e8d070', at: 'mine', n: 20 }), L('text', { text: '归去来兮', color: '#d8e8b0', at: 'mine' })], { sfx: 'heal' }) },
  'LJ-032': { skill: sig([L('rings', { color: '#d8c890', n: 3, at: 'foe' }), L('glyphs', { glyphs: '广陵散', color: '#e8d8a0', at: 'foe' })], { sfx: 'snap', shake: 0.2 }) },
  'LJ-033': { summon: sig([L('beam', { color: '#ffb0a0', at: 'mine' })], { sfx: 'buff' }),
    skill: sig([L('pillar', { color: '#ff9a80', r: 0.7 }), L('orbit', { color: '#ffc0b0', n: 12 })], { sfx: 'bond' }) },
  'WM-015': { play: sig([L('ribbon', { color: '#c8d8e0', n: 3 }), L('glyphs', { glyphs: '兴尽而返', color: '#dfe8ee' })], { sfx: 'playWenmai' }) },

  // ───────── 第八章 · 敦煌丝路 ─────────
  'LJ-034': { skill: sig([L('orbit', { color: C.lamp, n: 16, r: 1.1 }), L('glyphs', { glyphs: '西行', color: '#ffd8a0' })], { sfx: 'bond' }) },
  // 反弹琵琶：飞天反手一挑，急雨骤落。
  'LJ-035': { summon: sig([L('ribbon', { color: '#e8a060', n: 4, len: 3.2 }), L('orbit', { color: C.lamp, n: 14, r: 1.2 }), L('sparks', { color: '#ffc070', n: 20 }), L('glyphs', { glyphs: '飞天', color: '#ffd8a0' })], { sfx: 'buff' }),
    skill: sig([L('rain', { color: '#ffd0a0', at: 'mine', n: 36, speed: 7 }), L('ribbon', { color: '#e8a060', at: 'mine', n: 3 }), L('sparks', { color: '#ffc070', at: 'mine', n: 24 }), L('text', { text: '急雨私语', color: '#ffd8a0', at: 'mine' })], { sfx: 'attack' }) },
  // 乐僔：忽见金光，状有千佛，于是凿窟。
  'LJ-036': { summon: sig([L('pillar', { color: '#ffd070', h: 10, r: 0.7, life: 1.8 }), L('spikes', { color: '#7a6a54', n: 5, r: 1.6, h: 1.2 }), L('glyphs', { glyphs: '开窟', color: '#ffe0a0' })], { sfx: 'bond', flash: ['#ffe6a0', 0.24] }),
    skill: sig([L('dome', { color: '#e8c890', at: 'mine', r: 3.6 }), L('rings', { color: C.gold, at: 'mine', n: 3, r: 3 }), L('text', { text: '戒行清虚', color: '#ffe0b0', at: 'mine' })], { sfx: 'buff' }) },
  'LJ-037': { summon: sig([L('petals', { color: '#7ab0a0', n: 12 }), L('sparks', { color: '#c8a04a', n: 18 })], { sfx: 'playGeneral' }),
    skill: sig([L('orbit', { color: '#8ac0b0', n: 12 }), L('text', { text: '传神', color: '#cfe8e0' })], { sfx: 'draw' }) },
  'WM-016': { play: sig([L('ribbon', { color: '#e8b070', n: 3 }), L('glyphs', { glyphs: '千般愿', color: '#ffd8a0' })], { sfx: 'playWenmai' }) },

  // ───────── 第九章 · 明清市井 ─────────
  'LJ-038': { skill: sig([L('petals', { color: '#c8b0d8', n: 18 }), L('glyphs', { glyphs: '荒唐言', color: '#d8c8e8' })], { sfx: 'poem' }) },
  'LJ-039': { summon: sig([L('ring', { color: C.gold, r: 3 }), L('sparks', { color: '#ffd070', n: 28 })], { sfx: 'playGeneral', shake: 0.2 }),
    skill: sig([L('beam', { color: C.gold, at: 'target', w: 0.12 }), L('shards', { color: '#ffd070', n: 14, at: 'target' })], { sfx: 'attack', shake: 0.3 }) },
  // 李时珍：遍尝百草，藤蔓与药香一同长出来。
  'LJ-040': { summon: sig([L('vines', { color: '#4a8c5c', n: 5, h: 2.5, r: 1.1 }), L('petals', { color: '#a0d890', n: 14 }), L('glyphs', { glyphs: '本草', color: '#cfe8c0' })], { sfx: 'heal' }),
    skill: sig([L('vines', { color: '#5a9c68', at: 'target', n: 4, h: 2.2, r: 0.9 }), L('dome', { color: '#a0d890', at: 'target', r: 1.8 }), L('petals', { color: '#cfe8b0', at: 'target', n: 12 }), L('glyphs', { glyphs: '药', color: '#d8f0c8', at: 'target' })], { sfx: 'heal' }) },
  // 徐霞客：朝碧海而暮苍梧，万峰在脚下伏倒。
  'LJ-041': { summon: sig([L('spikes', { color: '#7a6a54', n: 7, r: 2, h: 1.6 }), L('shards', { color: '#8a7a5a', n: 14 }), L('glyphs', { glyphs: '游', color: '#d8c8a8' })], { sfx: 'draw', shake: 0.2 }),
    skill: sig([L('spikes', { color: '#6a5a44', n: 10, r: 2.8, h: 2.1, life: 1.7 }), L('rings', { color: '#a08a68', n: 3, r: 3.2 }), L('text', { text: '万峰下伏', color: '#e8d8b8' })], { sfx: 'attack', shake: 0.3 }) },
  'WM-017': { play: sig([L('shards', { color: '#b03a2a', n: 14, size: 0.2 }), L('glyphs', { glyphs: '大典', color: '#e8c890' })], { sfx: 'playWenmai' }) },

  // ───────── 第十章 · 天工星汉 ─────────
  // 张衡：浑天仪环环相套，候风地动一触而发。
  'LJ-042': { summon: sig([L('orbit', { color: C.bronze, n: 18, r: 1.6, turns: 2 }), L('orbit', { color: '#e8c070', n: 12, r: 0.9, turns: 2.5 }), L('rings', { color: C.bronze, n: 2, r: 2.6 }), L('glyphs', { glyphs: '浑天', color: '#ffe0a0' })], { sfx: 'playGeneral' }),
    skill: sig([L('spikes', { color: '#6a5a44', at: 'foe', n: 8, r: 3, h: 1.4 }), L('rings', { color: C.bronze, at: 'foe', n: 3, r: 3.4 }), L('shards', { color: '#8a7a5a', at: 'foe', n: 18 }), L('text', { text: '候风地动', color: '#ffe0a0', at: 'foe' })], { sfx: 'stun', shake: 0.4 }) },
  'LJ-043': { summon: sig([L('orbit', { color: C.star, n: 16, r: 1, turns: 2 })], { sfx: 'playGeneral' }),
    skill: sig([L('orbit', { color: '#bfd4ff', n: 18, r: 1.2, turns: 2.5 }), L('text', { text: '355 / 113', color: '#dfe8ff' })], { sfx: 'draw' }) },
  // 李冰：鱼嘴分水，一江裂作两股。
  'LJ-044': { summon: sig([L('spikes', { color: '#6a5a44', n: 4, r: 1.6, h: 1.1 }), L('waterColumn', { color: '#7ac0e8', h: 2.8, r: 1, life: 1.6 }), L('rings', { color: '#8ac8f0', n: 3, r: 3 }), L('glyphs', { glyphs: '分水', color: '#cfe8ff' })], { sfx: 'bond', shake: 0.2 }),
    skill: sig([L('waterColumn', { color: '#8ac8f0', at: 'mine', h: 2.6, r: 1.2, life: 1.5 }), L('dome', { color: '#a0d8f0', at: 'mine', r: 3.4 }), L('text', { text: '深淘滩', color: '#cfe8ff', at: 'mine' })], { sfx: 'heal' }) },
  'LJ-045': { summon: sig([L('fire'), L('sparks', { color: '#ffb060', n: 26 })], { sfx: 'burn' }),
    skill: sig([L('ribbon', { color: '#ffa050', n: 4, at: 'mine' }), L('sparks', { color: '#ffd070', n: 30, at: 'mine' })], { sfx: 'buff' }) },
  'WM-018': { play: sig([L('orbit', { color: '#a8d0b0', n: 14 }), L('glyphs', { glyphs: '勾股割圆', color: '#c8e0c0' })], { sfx: 'playWenmai' }) },

  // ───────── 第十一章 · 海丝远航 ─────────
  // 郑和：宝船涉沧溟，七下西洋。
  'LJ-046': { summon: sig([L('waterColumn', { color: C.sea, h: 3.4, r: 1.2, life: 1.7 }), L('rings', { color: '#8ac8f0', n: 3, r: 3.2 }), L('ribbon', { color: '#5c7382', n: 2, len: 3.4 }), L('glyphs', { glyphs: '宝船', color: '#cfe8ff' })], { sfx: 'draw' }),
    skill: sig([L('rings', { color: C.sea, at: 'foe', n: 7, r: 2.2 }), L('waterColumn', { color: '#8ac8f0', at: 'foe', h: 3, r: 1.3, life: 1.5 }), L('text', { text: '七下西洋', color: '#cfe8ff', at: 'foe' })], { sfx: 'attack', shake: 0.3 }) },
  // 妈祖：夜航见一点红灯，风波乍息。
  'LJ-047': { summon: sig([L('pillar', { color: '#ff9a60', h: 9, r: 0.6, life: 1.8 }), L('orbit', { color: C.lamp, n: 14, r: 1.2 }), L('petals', { color: '#ffc0a0', n: 12 }), L('glyphs', { glyphs: '天妃', color: '#ffd8b0' })], { sfx: 'heal', flash: ['#ffd8a0', 0.18] }),
    skill: sig([L('vortex', { color: '#c8b0a0', at: 'mine', h: 2.6, r: 1.4, n: 4, life: 1.3 }), L('dome', { color: '#ffc8a0', at: 'mine', r: 3.6 }), L('text', { text: '风波乍息', color: '#ffd8b0', at: 'mine' })], { sfx: 'buff' }) },
  'LJ-048': { summon: sig([L('petals', { color: C.paper, n: 12 })], { sfx: 'playGeneral' }),
    skill: sig([L('petals', { color: '#f0ecd8', n: 14, at: 'hero' }), L('text', { text: '目击身履', color: '#f0ecd8' })], { sfx: 'draw' }) },
  'LJ-049': { skill: sig([L('beam', { color: '#ff9040', at: 'target' }), L('shards', { color: '#eef2f0', n: 16, at: 'target' })], { sfx: 'burn', shake: 0.2 }) },
  'WM-019': { play: sig([L('orbit', { color: '#c8b48a', n: 12, turns: 2 }), L('glyphs', { glyphs: '子午', color: '#e8dcc0' })], { sfx: 'playWenmai' }) },

  // ───────── 第十二章 · 归藏传灯 ─────────
  'LJ-050': { skill: sig([L('dome', { color: '#7ab0c8', r: 2.2, at: 'mine' }), L('glyphs', { glyphs: '天一生水', color: '#bfe4f4', at: 'mine' })], { sfx: 'buff' }) },
  'LJ-051': { summon: sig([L('rain', { color: C.water, n: 20, speed: 4 }), L('orbit', { color: '#a8d8e8', n: 10 })], { sfx: 'playGeneral' }),
    skill: sig([L('ribbon', { color: '#8ac0d8', n: 3 }), L('glyphs', { glyphs: '源头活水', color: '#bfe4f4' })], { sfx: 'poem' }) },
  'LJ-052': { skill: sig([L('orbit', { color: C.paper, n: 16, r: 1.1 }), L('glyphs', { glyphs: '经史子集', color: '#f0e6cc' })], { sfx: 'bond' }) },
  'LJ-053': { skill: sig([L('beam', { color: '#ffb060', at: 'target' }), L('shards', { color: '#e8dcc0', n: 12, at: 'target' })], { sfx: 'burn' }) },
  'WM-020': { play: sig([L('shards', { color: '#7a5434', n: 14, size: 0.2 }), L('glyphs', { glyphs: '刻梓', color: '#e0d4b8' })], { sfx: 'playWenmai' }) },

  // ───────── 西游取经五众 ─────────
  'LJ-054': { summon: sig([L('burst', { color: '#ffb030', r: 2.4 }), L('orbit', { color: '#ffd060', n: 14, r: 1.3 }), L('glyphs', { glyphs: '齐天大圣', color: '#ffe8b0' })], { sfx: 'playGeneral', shake: 0.22, flash: ['#ffd88a', 0.18] }),
    skill: sig([L('ring', { color: '#e8e0d0', r: 3 }), L('beam', { color: '#ffd060', at: 'target' }), L('shards', { color: '#c8951f', n: 14, at: 'target' })], { sfx: 'attack', shake: 0.28 }) },
  'LJ-055': { summon: sig([L('spikes', { color: '#8a9a52', n: 9, r: 1.6, h: 1.2 }), L('splash', { color: 0x3a4a28, size: 1.4 })], { sfx: 'playGeneral' }),
    skill: sig([L('petals', { color: '#bfe0a8', n: 14, at: 'mine' }), L('dome', { color: '#8ac06a', r: 2.2, at: 'mine' })], { sfx: 'heal' }) },
  'LJ-056': { summon: sig([L('waterColumn', { color: '#7a8a80', h: 2.6, r: 1 }), L('dome', { color: '#a8b0a0', r: 2 })], { sfx: 'playGeneral' }),
    skill: sig([L('beam', { color: '#c8b890', at: 'target' }), L('shards', { color: '#6a5a46', n: 12, at: 'target' })], { sfx: 'attack' }) },
  'LJ-057': { summon: sig([L('flame', { color: '#e06a3a', n: 12 }), L('ribbon', { color: '#efe8dc', n: 3 })], { sfx: 'playGeneral', flash: ['#ffd0a0', 0.14] }),
    skill: sig([L('vortex', { color: '#e8894a', r: 2.2 }), L('glyphs', { glyphs: '化龙', color: '#ffd8b0' })], { sfx: 'buff', shake: 0.18 }) },
  'LJ-058': { summon: sig([L('rings', { color: '#f0d890', n: 4, r: 2.8 }), L('dome', { color: '#f4e4b0', r: 2.4 }), L('glyphs', { glyphs: '金蝉', color: '#fff0c8' })], { sfx: 'playGeneral' }),
    skill: sig([L('orbit', { color: C.paper, n: 14, r: 1.2, at: 'mine' }), L('glyphs', { glyphs: '通关文牒', color: '#f0e6cc', at: 'mine' })], { sfx: 'draw' }) },
  'WM-021': { play: sig([L('ribbon', { color: '#c8b48c', n: 3, len: 3.4 }), L('glyphs', { glyphs: '释厄', color: '#e8dcc0' })], { sfx: 'playWenmai' }) },

  // ───────── 浊灵中几个有标志性登场的 ─────────
  'ZL-005': { summon: sig([L('splash', { color: 0x181210, size: 1.8 }), L('spikes', { color: '#564a3a', n: 6, r: 1.8, h: 1.4 }), L('shards', { color: '#6a5a4a', n: 16 }), L('ring', { color: '#7a5a40', r: 2.6 })], { sfx: 'die', shake: 0.25 }) },
  'ZL-011': { summon: sig([L('splash', { color: 0x181210, size: 1.6 }), L('flame', { color: '#8a5a7a', color2: '#2a1020', h: 2.4, r: 0.6, life: 1.2 }), L('ribbon', { color: '#8878a0', n: 3 }), L('petals', { color: '#a890b8', n: 10 })], { sfx: 'mist' }) },
  'ZL-016': { summon: sig([L('splash', { color: 0x181210, size: 1.5 }), L('flame', { color: '#a04a3a', color2: '#2a0c08', h: 2.2, r: 0.55, life: 1.1 }), L('ribbon', { color: '#c85a4a', n: 3 })], { sfx: 'mist' }) },
  'ZL-026': { summon: sig([L('splash', { color: 0x181210, size: 1.6 }), L('flame', { color: '#9a6a8a', color2: '#2a1224', h: 2.6, r: 0.5, life: 1.3 }), L('ribbon', { color: '#8e7d90', n: 3, len: 3.2 }), L('rain', { color: '#b0a0b0', n: 14 })], { sfx: 'mist' }) },
  'ZL-046': { summon: sig([L('splash', { color: 0x181210, size: 1.5 }), L('spikes', { color: '#5a4e3c', n: 5, r: 1.5, h: 1.2 }), L('sparks', { color: '#c8813c', n: 22 }), L('ring', { color: '#8a6a44', r: 2.6 })], { sfx: 'playGeneral' }) },
  'ZL-052': { summon: sig([L('splash', { color: 0x181210, size: 1.4 }), L('spikes', { color: '#564a3a', n: 4, r: 1.4, h: 1 }), L('shards', { color: '#5a4a38', n: 12 })], { sfx: 'die' }) },

  // ───────── 补漏：两张此前没有专属特效的玩家卡 ─────────
  // 李白·诗仙：召唤是月下独酌，技能「将进酒」把酒气化作金锋扫过敌阵。
  'LJ-010': {
    summon: sig([
      L('dome', { color: '#dfe6ff', r: 2.2 }), L('orbit', { color: C.gold, n: 14, r: 1.1 }),
      L('glyphs', { glyphs: '诗酒', color: '#ffe6b0' }), L('petals', { color: '#e8d8a0', n: 10 }),
    ], { sfx: 'draw' }),
    skill: sig([
      L('blades', { color: '#ffe6a0', at: 'foe', n: 10 }), L('rings', { color: C.gold, at: 'foe', n: 3, r: 3 }),
      L('text', { text: '将进酒', color: '#ffe0a0', at: 'foe' }),
    ], { sfx: 'counter', shake: 0.3, flash: ['#ffe6a0', 0.3] }),
  },
  // 昆仑仙境图：卷轴展开成玉山，九门开明兽俱在其中。
  'WM-006': {
    play: sig([
      L('pillar', { color: '#cfe0f0', h: 8, r: 1.5, life: 2.2 }), L('dome', { color: '#e8f0ff', r: 3 }),
      L('orbit', { color: '#d8e8ff', n: 16, r: 1.4 }), L('glyphs', { glyphs: '昆仑', color: '#eaf2ff' }),
    ], { sfx: 'bond', flash: ['#dfe8ff', 0.22] }),
  },

  // ───────── 器物：都在 equip 这一相，落点是佩戴者 ─────────
  'QW-001': { equip: sig([L('blades', { color: C.gold, n: 5 }), L('beam', { color: '#ffe0a0', at: 'target' }), L('glyphs', { glyphs: '轩辕', color: '#ffe8c0' })], { sfx: 'attack', shake: 0.18, flash: ['#ffe8b0', 0.18] }) },
  'QW-002': { equip: sig([L('dome', { color: C.earth, r: 2.2 }), L('spikes', { color: '#8a7250', n: 6, r: 1.6, h: 1.4 }), L('glyphs', { glyphs: '山河', color: '#e8d8b0' })], { sfx: 'buff' }) },
  'QW-003': { equip: sig([L('ribbon', { color: '#e8503a', n: 4 }), L('orbit', { color: '#ff9a80', n: 12, r: 1 })], { sfx: 'buff' }) },
  'QW-004': { equip: sig([L('pillar', { color: '#cfe0f0', h: 7, r: 0.28, life: 1.8 }), L('waterColumn', { color: '#8ac8f0', h: 2.4, r: 0.8 }), L('glyphs', { glyphs: '定海', color: '#e0f0ff' })], { sfx: 'thunder', shake: 0.28 }) },
  'QW-005': { equip: sig([L('rings', { color: '#bfe0ee', n: 3 }), L('dome', { color: '#cfe8f4', r: 1.8 }), L('glyphs', { glyphs: '照', color: '#eaf6ff' })], { sfx: 'resonance', el: 'water' }) },
  'QW-006': { equip: sig([L('orbit', { color: C.jade, n: 14, r: 1.1 }), L('petals', { color: '#bfe0b8', n: 10 }), L('glyphs', { glyphs: '百草', color: '#d8f0d0' })], { sfx: 'heal' }) },
  'QW-007': { equip: sig([L('ribbon', { color: '#8fbf6a', n: 3 }), L('rings', { color: '#a8d08a', n: 2, at: 'foe' }), L('sparks', { color: '#c8e0a0', n: 24, at: 'foe' })], { sfx: 'resonance', el: 'wood', shake: 0.14 }) },
  'QW-008': { equip: sig([L('glyphs', { glyphs: '紫毫', color: '#d8c8f0' }), L('sparks', { color: '#b8a0e0', n: 18 })], { sfx: 'pick' }) },
  'QW-009': { equip: sig([L('dome', { color: '#7fb2bd', r: 2 }), L('rings', { color: '#9fd0d8', n: 2 }), L('glyphs', { glyphs: '纵目', color: '#d0eef2' })], { sfx: 'bond' }) },
  'QW-010': { equip: sig([L('vines', { color: '#6f8f4a', n: 4, h: 2, r: 0.9 }), L('petals', { color: '#bfe0a8', n: 10 })], { sfx: 'heal' }) },
  // 上古十大神器余下的七件：分量比一般器物重，都配了闪屏或震屏
  'QW-011': { equip: sig([L('rings', { color: '#e8d8a0', n: 4, r: 3.2 }), L('dome', { color: '#cfe0d8', r: 2.6 }), L('glyphs', { glyphs: '东皇', color: '#ffe8c0' })], { sfx: 'thunder', shake: 0.22, flash: ['#f4e8c0', 0.2] }) },
  'QW-012': { equip: sig([L('pillar', { color: '#fff4c8', h: 10, r: 0.8, life: 1.5 }), L('blades', { color: '#b8c4cc', n: 3 }), L('shards', { color: '#6b737b', n: 16 })], { sfx: 'attack', shake: 0.34, flash: ['#fff8d8', 0.26] }) },
  'QW-013': { equip: sig([L('vortex', { color: '#a060c8', r: 2.4 }), L('orbit', { color: '#d0a0ec', n: 14, r: 1.4 }), L('glyphs', { glyphs: '炼妖', color: '#e8c0ff' })], { sfx: 'mist', shake: 0.18 }) },
  'QW-014': { equip: sig([L('pillar', { color: '#e8c878', h: 7, r: 1.2, life: 2 }), L('rings', { color: '#f0dca0', n: 3, r: 2.2 }), L('glyphs', { glyphs: '昊天', color: '#ffe8b0' })], { sfx: 'buff' }) },
  'QW-015': { equip: sig([L('dome', { color: '#b23a2f', r: 2 }), L('splash', { color: 0xb23a2f, size: 1.8 }), L('glyphs', { glyphs: '崆峒', color: '#ffd8c8' })], { sfx: 'attack', shake: 0.2 }) },
  'QW-016': { equip: sig([L('petals', { color: '#ffc070', n: 14 }), L('sparks', { color: '#ffd8a0', n: 18 }), L('dome', { color: '#e87a52', r: 2.2 })], { sfx: 'heal', flash: ['#ffd8a0', 0.14] }) },
  'QW-017': { equip: sig([L('ribbon', { color: '#e8dcb0', n: 7, len: 2.2 }), L('rings', { color: '#bfe0a8', n: 3, r: 2 })], { sfx: 'upgrade' }) },

  // 文物器物：底色统一偏青铜绿／银灰，和神器那批的金红分得开
  'QW-018': { equip: sig([L('petals', { color: '#8fa890', n: 12 }), L('pillar', { color: '#a8c4a0', h: 6, r: 1.1, life: 1.8 }), L('sparks', { color: '#d8e8c0', n: 14 })], { sfx: 'buff' }) },
  'QW-019': { equip: sig([L('ring', { color: '#7fae8c', r: 2.4 }), L('dome', { color: '#4e6b52', r: 2 })], { sfx: 'heal', flash: ['#bfe0a8', 0.12] }) },
  'QW-020': { equip: sig([L('glyphs', { glyphs: '宅兹中国', color: '#e8dcb0' }), L('rings', { color: '#9cb3a4', n: 3, r: 2 })], { sfx: 'upgrade' }) },
  'QW-021': { equip: sig([L('pillar', { color: '#8fa89a', h: 5, r: 1.6, life: 2.2 }), L('splash', { color: 0x56695f, size: 1.8 }), L('rings', { color: '#b8c8a8', n: 2, r: 2.6 })], { sfx: 'buff', shake: 0.3 }) },
  'QW-022': { equip: sig([L('rings', { color: '#c8a04a', n: 5, r: 2.8 }), L('ribbon', { color: '#e8dcb0', n: 8, len: 2.4 }), L('sparks', { color: '#ffe8b0', n: 20 })], { sfx: 'resonance', flash: ['#f0e0b0', 0.16] }) },
  'QW-023': { equip: sig([L('blades', { color: '#cfe4ee', n: 3 }), L('shards', { color: '#7a8f94', n: 14, at: 'target' })], { sfx: 'attack', shake: 0.24 }) },
  'QW-024': { equip: sig([L('ribbon', { color: '#d8a34a', n: 4, len: 3.2 }), L('sparks', { color: '#ffd08a', n: 18 }), L('ring', { color: '#b8863c', r: 2.2 })], { sfx: 'attack' }) },
  'QW-025': { equip: sig([L('pillar', { color: '#ffd98a', h: 6, r: 0.9, life: 2 }), L('sparks', { color: '#f0a63c', n: 16 })], { sfx: 'heal', flash: ['#ffd98a', 0.14] }) },
  'QW-026': { equip: sig([L('petals', { color: '#f2ece0', n: 16 }), L('dome', { color: '#cfc6ae', r: 2 })], { sfx: 'mist' }) },
  'QW-027': { equip: sig([L('orbit', { color: '#c9ced0', n: 10, r: 1.2 }), L('sparks', { color: '#ffd08a', n: 12 })], { sfx: 'buff' }) },

  'ZL-055': { equip: sig([L('shards', { color: '#4a5a66', n: 14 }), L('ring', { color: '#6e8694', r: 2.2 })], { sfx: 'mist' }) },
  'ZL-056': { equip: sig([L('spikes', { color: '#564a3a', n: 5, r: 1.4, h: 1.6 }), L('splash', { color: 0x181210, size: 1.4 })], { sfx: 'mist' }) },
};

// ───────── 浊灵通用：五行的浊化倒影 ─────────
// The 48 rank-and-file 浊灵 share one flourish per element rather than 48 hand-written ones: they are
// corrupted echoes of the player's five elements, so they reuse the same shapes in a muted, inky key.
const MURK = {
  metal: [L('blades', { color: '#a09a8a', n: 6, life: 0.85 }), L('ring', { color: '#6a6458', r: 2.4 })],
  wood: [L('vines', { color: '#46543a', n: 3, h: 1.8, r: 0.85, life: 1.4 }), L('petals', { color: '#5e6b48', n: 6 })],
  water: [L('waterColumn', { color: '#6e8694', h: 2.0, r: 0.7, life: 1.1 }), L('rain', { color: '#74838e', n: 12 })],
  fire: [L('flame', { color: '#c86a20', color2: '#3a1204', h: 2.4, r: 0.55, life: 1.1 }), L('sparks', { color: '#c87a30', n: 16 })],
  earth: [L('spikes', { color: '#564a3a', n: 5, r: 1.3, h: 1.7, life: 1.2 }), L('shards', { color: '#5a4a38', n: 10 })],
};

/** Fallback flourish for a 浊灵 with no bespoke entry; null for anything else. */
export function murkSignature(id, phase, el, type) {
  if (!id.startsWith('ZL-')) return null;
  if (phase !== (type === 'talisman' ? 'play' : 'summon')) return null;
  const layers = MURK[el] ?? [L('shards', { color: '#5a4a38', n: 12 })];
  return sig([L('splash', { color: 0x181210, size: 1.5 }), ...layers], { sfx: 'mist' });
}
