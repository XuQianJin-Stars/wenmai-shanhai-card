// Story mode (DT_Levels + DT_Dialogues). Chapter 1 dialogue: docs/narrative/STORY_CHAPTER_1.md (verbatim lines).
// Chapters 2–3 are written here; chapters 4–10 live in storyLate.js. All of them are original text built on the
// scene settings in docs/narrative/LORE_BIBLE.md §2 — quoted classical lines are real and named in place.
import { LATE_CHAPTERS, LATE_PRACTICE, LATE_SPEAKERS } from './storyLate.js';
import { ERA_CHAPTERS, ERA_PRACTICE, ERA_SPEAKERS } from './storyEra.js';

export const STARTER_CARDS = [
  'LJ-003', 'LJ-004', 'LJ-005', 'LJ-006', 'LJ-007', 'LJ-008', 'LJ-009',
  'LJ-063', 'LJ-064', 'LJ-065', 'LJ-066', 'LJ-067', 'LJ-068', 'LJ-069', 'WM-024',
  'FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-006',
  'WM-001', 'WM-002', 'WM-003', 'WM-004', 'WM-005', 'WM-007',
];
export const STARTER_DECK = [
  'LJ-007', 'LJ-007', 'LJ-006', 'LJ-006', 'LJ-008', 'LJ-008', 'LJ-004', 'LJ-004', 'LJ-009', 'LJ-003',
  'LJ-005', 'FL-001', 'FL-001', 'FL-003', 'FL-004', 'FL-006', 'FL-002', 'WM-005', 'WM-002', 'WM-001',
];
export const DECK_SIZE = 20;
export const MAX_COPIES = 2;

// The tutorial hand is stacked so the three card types arrive one per turn (CORE_LOOP §十一 Onboarding Flow).
const TUTORIAL_DECK = [
  'LJ-007', 'LJ-006', 'FL-001', 'WM-005', // opening hand (first player: 4)
  'FL-003', 'LJ-008', 'LJ-004', 'FL-006', 'LJ-007', 'WM-002', 'LJ-009', 'FL-004', 'LJ-006', 'FL-001',
  'LJ-005', 'WM-001', 'FL-002', 'LJ-003', 'LJ-008', 'FL-003',
];

export const TUTORIAL_HINTS = {
  1: { card: 'LJ-007', text: '金色边框的是「灵将」。拖动或点击烛龙打出——灵将会留在场上，下回合起可以攻击。' },
  2: { card: 'FL-001', text: '银白边框的是「符箓」。它立即生效，打出后便消散。试试为烛龙施加金光护体符。' },
  3: { card: 'WM-005', text: '竹青边框的是「文脉」。它进入文脉区持续生效。打出定心符咒，为灵将驱除负面状态。' },
  4: { text: '点选己方灵将，再点选目标即可攻击。对方有【守护】灵将时必须先击破它，否则可直取主将。每回合最多攻击 2 次。' },
  5: { text: '五行相克：金克木、木克土、土克水、水克火、火克金。克制时伤害 ×1.3，目标会闪红光。' },
};

export const PROLOGUE = {
  id: 'prologue', title: '序章 · 觉醒', scene: 'study',
  lines: [
    { who: '旁白', text: '你知道为何典籍会泛黄？' },
    { who: '旁白', text: '不是因为时间，而是因为遗忘。每一次被人遗忘，书页便老去一分。' },
    { who: '', text: '（金光溢出书页，凝成一道轮廓——一位穿着朴素的老妇人，发间插有一支五色石簪。）', stage: 'glow' },
    { who: '女娲之灵', text: '醒了。' },
    { who: '守护者', text: '（缓缓抬头，凝视眼前的影像。）' },
    { who: '女娲之灵', text: '别怕。我不是鬼，我是记忆。是这本书记住了我，于是我还在。' },
    { who: '女娲之灵', text: '但有些地方，记忆正在消失。那里的混沌，已经开始吃人了。' },
    { who: '守护者', text: '……去哪里？' },
    { who: '女娲之灵', text: '昆仑墟。那是一切开始的地方。你去，我便能随你同行。' },
    { who: '', text: '（书斋的铜镜表面泛起涟漪，镜中现出云雾缭绕的悬浮山台。）', stage: 'mirror' },
  ],
};

export const LEVELS = [
  {
    id: 'shenhua-1', title: '第一关 · 混沌余烬', scene: 'kunlun', variant: 'edge',
    desc: '昆仑墟边缘，文脉晶石台地。教学关：认识三类卡牌。',
    enemy: { name: '迷雾小灵', hp: 12, portrait: 'mist', deck: [
      'ZL-001', 'ZL-001', 'ZL-001', 'ZL-001', 'ZL-001', 'ZL-001', 'ZL-002', 'ZL-002', 'ZL-001', 'ZL-002',
      'ZL-001', 'ZL-002', 'ZL-001', 'ZL-006', 'ZL-001', 'ZL-002', 'ZL-001', 'ZL-001', 'ZL-002', 'ZL-001'], ordered: false },
    ai: 'easy', playerFirst: true, tutorial: true, playerDeck: TUTORIAL_DECK, ordered: true,
    reward: { fragments: 10, unlock: ['LJ-001', 'QW-019'] },
    pre: [
      { who: '', text: '（守护者抵达昆仑墟边缘，前方有数团黑色雾气在地面游荡，侵蚀着文脉晶石，石面被染成暗灰色。）' },
      { who: '女娲之灵', text: '看到了吗？那些黑雾，是迷失的记忆。曾经有人知道这里的名字，后来他们忘了。' },
      { who: '守护者', text: '它们有危险吗？' },
      { who: '女娲之灵', text: '对文脉有危险。对你……暂时还没有。' },
      { who: '女娲之灵', text: '看这里。' },
      { who: '', text: '（一张发光的卡片自衣袋中浮出——正面是一尊粗犷的巨人轮廓，手持巨斧，浑身有石纹裂痕。）', stage: 'card:LJ-001' },
      { who: '女娲之灵', text: '开天者的残影。他不会说话，但他记得怎么打开混沌。' },
      { who: '守护者', text: '……打开混沌？' },
      { who: '女娲之灵', text: '驱散黑雾，就是驱散混沌。去吧。' },
    ],
    post: [
      { who: '', text: '（盘古卡牌在场地中央金光大盛，巨人轮廓破框而出，巨斧落向黑雾。）', stage: 'card:LJ-001' },
      { who: '', text: '（金色光圈向外扩散，黑雾触圈即散，露出原本清澈的文脉晶石地面。）' },
      { who: '', text: '（云层裂开一道光缝，冷金色晨光穿透而出。女娲之灵望向光缝，微微点头。）' },
    ],
  },
  {
    id: 'shenhua-2', title: '第二关 · 遗落的名字', scene: 'kunlun', variant: 'stele',
    desc: '昆仑墟中心台地，残缺的记名碑。浊灵会腐蚀灵将的防御。',
    enemy: { name: '蚀名浊灵', hp: 18, portrait: 'shade', deck: [
      'ZL-001', 'ZL-001', 'ZL-001', 'ZL-002', 'ZL-002', 'ZL-002', 'ZL-003', 'ZL-003', 'ZL-004', 'ZL-004',
      'ZL-006', 'ZL-006', 'FL-003', 'FL-001', 'ZL-002', 'ZL-001', 'ZL-003', 'ZL-004', 'ZL-006', 'ZL-002'] },
    ai: 'normal', playerFirst: true,
    reward: { fragments: 15, unlock: ['LJ-002', 'FL-005', 'QW-016'] },
    pre: [
      { who: '', text: '（守护者走近残缺石碑，碑上文字几乎全部消失，只余两个依稀可辨的字："造化"。）' },
      { who: '守护者', text: '这是什么碑？' },
      { who: '女娲之灵', text: '记名碑。最早一批被创造出来的生灵，名字曾刻在这里。' },
      { who: '守护者', text: '名字被……抹掉了？' },
      { who: '女娲之灵', text: '没人记得，名字便自己消失了。这正是浊灵的力量——它们不攻击，只让人遗忘。' },
      { who: '', text: '（石碑周围有数只浊灵盘旋，它们正在吞噬碑石上残余的文脉光迹。）' },
      { who: '守护者', text: '我们能把名字找回来吗？' },
      { who: '女娲之灵', text: '打散它们，先把吞进去的还回来。' },
    ],
    post: [
      { who: '', text: '（最后一只浊灵散开的黑雾凝成一串光文，飘向石碑。"造化"二字变得清晰。）' },
      { who: '', text: '（石碑上新出现的字迹中，一个名字若隐若现：女娲。）', stage: 'card:LJ-002' },
      { who: '女娲之灵', text: '下次遇见我，就不是这副样子了。' },
    ],
  },
  {
    id: 'shenhua-3', title: '第三关 · 开天之痛', scene: 'kunlun', variant: 'summit',
    desc: '昆仑墟最高台，贯穿虚空的古老裂缝。首领：沉迹怨灵——每 3 回合施放「混沌之压」。',
    music: 'boss',
    enemy: { name: '沉迹怨灵', hp: 26, portrait: 'husk', passive: 'chaos', deck: [
      'ZL-005', 'ZL-005', 'ZL-004', 'ZL-004', 'ZL-004', 'ZL-003', 'ZL-003', 'ZL-002', 'ZL-002', 'ZL-002',
      'ZL-001', 'ZL-001', 'ZL-006', 'ZL-006', 'FL-003', 'FL-004', 'FL-005', 'FL-001', 'ZL-003', 'ZL-001'],
      grades: { 'FL-003': 1, 'FL-004': 0 } },
    ai: 'hard', playerFirst: false,
    reward: { fragments: 25, unlock: ['WM-006', 'QW-005', 'QW-018'] },
    pre: [
      { who: '', text: '（守护者站在最高台，面对虚空裂缝。浓厚的混沌之气中，一个巨大的扭曲身影正在成型。）' },
      { who: '女娲之灵', text: '你感觉到了吗？' },
      { who: '守护者', text: '……沉重。像有什么东西压着胸口。' },
      { who: '女娲之灵', text: '那是痛苦。他开天时，承受了一切混沌的重量。后来人们只记得他开了天，却忘了他痛过。' },
      { who: '守护者', text: '他……也成了浊灵？' },
      { who: '女娲之灵', text: '不是他。是那段被遗忘的痛苦，自己找到了形状。' },
      { who: '', text: '（沉迹怨灵完全成型——面目模糊的巨人，四肢扭曲如折断的树干，身上的古代石刻纹路全部破碎错位。）' },
      { who: '女娲之灵', text: '让他知道，还有人记得他痛过。' },
      { who: '守护者', text: '……我记得。' },
    ],
    post: [
      { who: '', text: '（扭曲巨人身上的黑色开始裂开，如焦炭崩解，露出金色的石刻纹路——盘古真正的文脉残影。）' },
      { who: '', text: '（金光柱撑破昆仑墟上方的乌云。天空显现旋转的星宿，隐约可见"日、月、山、川"四字。）', stage: 'sky' },
      { who: '女娲之灵', text: '开天的故事，现在多了一个听见的人。' },
      { who: '', text: '上古神话篇 · 终', stage: 'end' },
    ],
  },
];

// ───────────────────────────── 第七章 · 大唐气象篇（长安）─────────────────────────────
// Scene: LORE_BIBLE §2.2 长安城. Quoted verse is real and attributed in-line; everything else is original.
export const PROLOGUE2 = {
  id: 'prologue7', title: '第七章 序 · 长安月', scene: 'study',
  lines: [
    { who: '旁白', text: '洞窟里的颜色安顿下来之后，书斋里多了一卷新展开的典籍。' },
    { who: '', text: '（书页上的字一行行亮起，又一行行暗下去。那是诗——许多许多诗，大半只剩开头半句。）', stage: 'glow' },
    { who: '女娲之灵', text: '你认得这些字吗？' },
    { who: '守护者', text: '……"长安一片月"。后面是什么？' },
    { who: '女娲之灵', text: '"万户捣衣声。"李白写的。你看，连你也只记得半句。' },
    { who: '玄奘之灵', text: '我就是从那座城出发的。走的时候是夜里，城门没开，我翻出去的。' },
    { who: '女娲之灵', text: '沙里的洞是往外走的人留下的，长安是他们出发和回来的地方。文脉流到唐朝，最盛——整座城的人都在写诗、唱曲、跳舞。' },
    { who: '女娲之灵', text: '可越盛的东西，一旦被忘，碎得就越彻底。那些只剩半句的诗，正在长安城里游荡。' },
    { who: '守护者', text: '它们也会变成浊灵？' },
    { who: '女娲之灵', text: '已经变了。去朱雀大街看看吧——天快黑了，灯要亮了。' },
    { who: '', text: '（铜镜泛起涟漪。镜中是黄昏的长安：朱雀大街灯火初上，远处大雁塔的轮廓浸在晚霞里。）', stage: 'mirror' },
  ],
};

LEVELS.push(
  {
    id: 'datang-1', chapter: 7, title: '第一关 · 朱雀残句', scene: 'changan', variant: 'street',
    desc: '黄昏的朱雀大街，飘着只剩半句的诗。残句墨魅被击散时会溅伤主将。',
    enemy: { name: '残句墨魅', hp: 30, portrait: 'inkling', deck: [
      'ZL-007', 'ZL-007', 'ZL-007', 'ZL-007', 'ZL-007', 'ZL-007', 'ZL-002', 'ZL-002', 'ZL-002', 'ZL-008',
      'ZL-008', 'ZL-008', 'ZL-009', 'ZL-009', 'ZL-003', 'ZL-003', 'ZL-012', 'ZL-012', 'ZL-012', 'FL-006'] },
    ai: 'normal', playerFirst: true,
    reward: { fragments: 35, unlock: ['LJ-010', 'LJ-013'] },
    pre: [
      { who: '', text: '（守护者走上朱雀大街。灯笼一盏盏亮起，空气里漂着金色的字，像夏夜的萤火。）' },
      { who: '守护者', text: '这些字……在飞。' },
      { who: '女娲之灵', text: '那是还被人记着的诗。记得的人越多，它们飞得越高。' },
      { who: '', text: '（几团墨色从巷口涌出，撞上半空的光字。字被墨染黑，断成半截，落在石板上扭动。）' },
      { who: '女娲之灵', text: '那些，就是被忘掉的半句。它们想把别的诗也拖下来，变得和自己一样。' },
      { who: '守护者', text: '半句诗……也会疼吗？' },
      { who: '女娲之灵', text: '会。所以它们才闹。小心，它们散开的时候会溅墨。' },
    ],
    post: [
      { who: '', text: '（最后一团墨魅散开，墨点落回石板，竟拼成了两行完整的字，重新飞上夜空。）' },
      { who: '', text: '（光字之间，一个醉醺醺的身影从灯影里走出，手里拎着酒壶。）', stage: 'card:LJ-010' },
      { who: '李白之灵', text: '好诗不怕人忘，怕的是没人再念。小友，陪我喝一杯？' },
      { who: '守护者', text: '……我还有事要办。' },
      { who: '李白之灵', text: '哈！那就边走边喝。塔那边的字，比我的诗还要冷清。' },
      { who: '', text: '（街角有人拔剑起舞，剑光如水。一曲舞罢，那道身影也化作一张卡牌，落进守护者手中。）', stage: 'card:LJ-013' },
    ],
  },
  {
    id: 'datang-2', chapter: 7, title: '第二关 · 雁塔题名', scene: 'changan', variant: 'pagoda',
    desc: '大雁塔下，历代进士的题名正在褪色。失名举子层层守护，碑影不断为主将续命。',
    enemy: { name: '褪色题名', hp: 34, portrait: 'nameplate', deck: [
      'ZL-008', 'ZL-008', 'ZL-008', 'ZL-010', 'ZL-010', 'ZL-007', 'ZL-007', 'ZL-007', 'ZL-009', 'ZL-009',
      'ZL-003', 'ZL-003', 'ZL-004', 'ZL-004', 'ZL-012', 'ZL-012', 'ZL-002', 'ZL-002', 'FL-005', 'FL-001'] },
    ai: 'hard', playerFirst: true,
    reward: { fragments: 40, unlock: ['LJ-011', 'WM-008', 'QW-017'] },
    pre: [
      { who: '', text: '（大雁塔在暮色里静立。塔砖上刻满了名字，一层叠着一层，大多已模糊得认不出笔画。）' },
      { who: '李白之灵', text: '新科进士登塔题名，是长安最风光的事。孟郊考了半辈子，中了以后写："春风得意马蹄疾，一日看尽长安花。"' },
      { who: '守护者', text: '那这些名字……' },
      { who: '李白之灵', text: '大多数，连他们的后人都不记得了。' },
      { who: '', text: '（塔下浮起一排书生的影子，面目空白，手里捧着看不清的名帖，一动不动地挡在塔前。）' },
      { who: '女娲之灵', text: '和昆仑墟的记名碑一样。只是这一次，被忘掉的不是神，是人。' },
      { who: '守护者', text: '普通人的名字，也算文脉吗？' },
      { who: '李白之灵', text: '小友，写诗的人，哪个不是普通人？' },
    ],
    post: [
      { who: '', text: '（书生的影子一个个低头作揖，化作光点飞回塔砖。有几个名字重新变得清晰。）' },
      { who: '', text: '（光点里，一个清瘦的身影扶着塔栏，衣衫上打着补丁。）', stage: 'card:LJ-011' },
      { who: '杜甫之灵', text: '我也在这城里应过试，没考中。塔上没有我的名字。' },
      { who: '李白之灵', text: '子美！你的名字不在塔上，在每个人背过的诗里。' },
      { who: '杜甫之灵', text: '……太白兄还是老样子。走吧，梨园那边的曲子，已经断了很久了。' },
    ],
  },
  {
    id: 'datang-3', chapter: 7, title: '第三关 · 霓裳断魂', scene: 'changan', variant: 'palace',
    desc: '夜色里的梨园旧台。首领：霓裳断魂——每 3 回合奏响「曲终」，削弱我方灵将并回复自身。',
    music: 'nishang',
    enemy: { name: '霓裳断魂', hp: 26, portrait: 'nishang', passive: 'nishang', deck: [
      'ZL-011', 'ZL-011', 'ZL-011', 'ZL-009', 'ZL-009', 'ZL-010', 'ZL-010', 'ZL-008', 'ZL-008', 'ZL-005',
      'ZL-012', 'ZL-012', 'ZL-012', 'ZL-003', 'ZL-003', 'ZL-007', 'ZL-007', 'FL-003', 'FL-004', 'FL-006'],
      grades: { 'FL-003': 1, 'FL-004': 1 } },
    ai: 'hard', playerFirst: false,
    reward: { fragments: 60, unlock: ['LJ-012', 'WM-009', 'QW-008', 'QW-027'] },
    pre: [
      { who: '', text: '（梨园空无一人。月光落在旧戏台上，台板缝里长出了草。）' },
      { who: '杜甫之灵', text: '这里曾聚着天下最好的乐工。后世说"梨园弟子"，就是从这儿来的。' },
      { who: '', text: '（远处传来断断续续的乐声，只有几个音，一遍一遍地重复，每次都停在同一个地方。）' },
      { who: '守护者', text: '这曲子……为什么总是断在那里？' },
      { who: '李白之灵', text: '因为后面的，没人记得了。《霓裳羽衣曲》——当年整座长安都会哼的曲子。' },
      { who: '女娲之灵', text: '后来白居易写："渔阳鼙鼓动地来，惊破霓裳羽衣曲。"盛世散了，乐工散了，曲谱也一点点散了。' },
      { who: '', text: '（月光下，一个巨大的身影缓缓舒展长袖——半是舞者，半是断裂的琴弦，面容清晰而哀伤。）' },
      { who: '女娲之灵', text: '断脉巨魂。它是一整支失传的曲子。' },
      { who: '守护者', text: '我们……能把它找回来吗？' },
      { who: '女娲之灵', text: '有些东西，失去了就是失去了。但我们可以让它知道——有人还记得，它曾经有多美。' },
    ],
    post: [
      { who: '', text: '（长袖停在半空。那几个重复的音，第一次没有断在老地方，而是轻轻落下，像一声叹息。）' },
      { who: '', text: '（巨魂化作漫天光尘，光尘里隐约有一队舞者旋转而过，然后散入夜空。）', stage: 'sky' },
      { who: '杜甫之灵', text: '曲子没有回来。' },
      { who: '李白之灵', text: '可它听见我们了。' },
      { who: '女娲之灵', text: '记得一样东西曾经在过，也是一种守护。文脉不只是"留下"，也是"记得"。' },
      { who: '', text: '（东方泛白。铜镜里浮出一叶小舟，舟上有人披着蓑衣，朗声吟诵。）', stage: 'card:LJ-012' },
      { who: '苏轼之灵', text: '"大江东去，浪淘尽，千古风流人物。"——诸位，唐的月看过了，也来看看宋的江吧。' },
      { who: '', text: '大唐气象篇 · 终', stage: 'end' },
    ],
  },
);

// ───────────────────────────── 第十二章 · 非遗薪传篇（古戏台）─────────────────────────────
// Scene: LORE_BIBLE §2.3 古戏台（活态文脉）. Quoted lines are real and attributed; the rest is original.
export const PROLOGUE3 = {
  id: 'prologue12', title: '第十二章 序 · 散场之后', scene: 'study',
  lines: [
    { who: '旁白', text: '观星台的炉火熄了。书斋里安静了很久。' },
    { who: '', text: '（这一次，铜镜里没有光。镜面蒙着一层灰，像很久没人擦过。）', stage: 'glow' },
    { who: '守护者', text: '镜子……坏了？' },
    { who: '女娲之灵', text: '没坏。是那边太暗了。' },
    { who: '女娲之灵', text: '我们一路看下来，神话有人讲，诗有人背，工序有人画成图。这些都落在纸上，纸在，它们就在。' },
    { who: '女娲之灵', text: '可还有一种文脉，从来没落到纸上——它在手上，在嗓子里，在师父递给徒弟的那一下。' },
    { who: '苏轼之灵', text: '皮影、剪纸、刺绣、戏文。这些东西不靠典籍活着，靠人活着。' },
    { who: '守护者', text: '那没有人了呢？' },
    { who: '女娲之灵', text: '……那就断了。不是慢慢褪色，是某一天，最后一个会的人走了，它就没有了。' },
    { who: '', text: '（铜镜上的灰自己散开一道缝。缝里是一座空戏台，红漆剥落，台上没有人。）', stage: 'mirror' },
    { who: '女娲之灵', text: '去古戏台看看吧。那里的戏，已经很久没开锣了。' },
  ],
};

LEVELS.push(
  {
    id: 'feiyi-1', chapter: 12, title: '第一关 · 灯影残戏', scene: 'stage', variant: 'shadow',
    desc: '皮影棚里，白幕后的影人还在演一出没人看的戏。断线偶人攻击后会伤到自己。',
    enemy: { name: '断线偶人', hp: 34, portrait: 'puppet', deck: [
      'ZL-013', 'ZL-013', 'ZL-013', 'ZL-013', 'ZL-014', 'ZL-014', 'ZL-014', 'ZL-015', 'ZL-015', 'ZL-017',
      'ZL-017', 'ZL-018', 'ZL-018', 'ZL-002', 'ZL-002', 'ZL-008', 'ZL-008', 'ZL-009', 'FL-002', 'FL-006'] },
    ai: 'normal', playerFirst: true,
    reward: { fragments: 50, unlock: ['LJ-014', 'LJ-017'] },
    pre: [
      { who: '', text: '（守护者走进一座低矮的棚子。一盏油灯，一方白幕，幕后的影人自己在动。）' },
      { who: '守护者', text: '没有人在操纵它们。' },
      { who: '苏轼之灵', text: '线早就断了。它们只是还记得最后一场戏该怎么演。' },
      { who: '', text: '（影人翻了个跟头，落地时僵住，又从头开始翻。一遍，又一遍。）' },
      { who: '女娲之灵', text: '皮影戏最迟汉代就有了。宋人的瓦舍里，影戏棚"每夜五更方散"。' },
      { who: '守护者', text: '现在呢？' },
      { who: '女娲之灵', text: '现在这个棚子里，只有你一个看客。' },
      { who: '守护者', text: '……那我就好好看完。' },
    ],
    post: [
      { who: '', text: '（影人停下，缓缓向白幕前鞠了一躬，然后化作光屑落进灯油里。）' },
      { who: '', text: '（灯焰忽然拔高。幕上出现一行墨字，笔锋硬得像刀。）', stage: 'card:LJ-014' },
      { who: '关汉卿之灵', text: '"地也，你不分好歹何为地！"——这句唱了七百年，还有人听得懂么？' },
      { who: '守护者', text: '窦娥……冤。' },
      { who: '关汉卿之灵', text: '好。她要的从来不是雪，是有人肯说这一句。' },
      { who: '', text: '（棚外传来慢得出奇的一段笛声，一个字拖了整整八拍。）', stage: 'card:LJ-017' },
      { who: '魏良辅之灵', text: '慢些走。有些东西，快了就丢了。' },
    ],
  },
  {
    id: 'feiyi-2', chapter: 12, title: '第二关 · 满堂空座', scene: 'stage',
    desc: '夜里的古戏台，台下坐满了看不清的影子。空衣戏影守在台口，回合结束时为同伴续命。',
    enemy: { name: '空衣戏影', hp: 40, portrait: 'robeGhost', deck: [
      'ZL-016', 'ZL-014', 'ZL-014', 'ZL-014', 'ZL-015', 'ZL-015', 'ZL-017', 'ZL-017', 'ZL-013', 'ZL-013',
      'ZL-013', 'ZL-018', 'ZL-018', 'ZL-010', 'ZL-007', 'ZL-009', 'ZL-004', 'FL-003', 'FL-004', 'FL-001'] },
    ai: 'hard', playerFirst: true,
    reward: { fragments: 55, unlock: ['LJ-015', 'WM-011'] },
    pre: [
      { who: '', text: '（戏台前的空地上坐满了人影，看不清面目，一动不动。台上的戏服自己立着，无风而颤。）' },
      { who: '守护者', text: '这些观众……是真的吗？' },
      { who: '关汉卿之灵', text: '是历代看过这出戏的人。戏在，他们就还在。' },
      { who: '魏良辅之灵', text: '可台上已经没有角儿了。行头自己撑起了身段——那不是戏，那是戏的影子。' },
      { who: '', text: '（一件大红蟒袍从衣架上飘落，缓缓挺起腰身，对着满堂空座亮了个相。）' },
      { who: '守护者', text: '它在等人鼓掌。' },
      { who: '女娲之灵', text: '所以别只是打散它。看完，再鼓掌。' },
    ],
    post: [
      { who: '', text: '（蟒袍软软落回衣架。台下的人影一个接一个站起来，无声地拍手，然后散去。）' },
      { who: '', text: '（后台的帷幔被掀开，一个书生模样的人走出来，手里握着一卷未完的戏文。）', stage: 'card:LJ-015' },
      { who: '汤显祖之灵', text: '"情不知所起，一往而深。生者可以死，死可以生。"' },
      { who: '守护者', text: '死了的，真的能再活过来吗？' },
      { who: '汤显祖之灵', text: '杜丽娘能。因为有人年年替她唱。只要还有人肯开口，就不算死透。' },
      { who: '魏良辅之灵', text: '……可这戏台上，最后一个开口的人，还没散。' },
    ],
  },
  {
    id: 'feiyi-3', chapter: 12, title: '第三关 · 空台绝响', scene: 'stage', variant: 'dawn',
    desc: '天亮前的空台。首领：空台绝响——每 3 回合「散场」，封印我方全部技能并让自身多得 1 点灵力。',
    music: 'juexiang',
    enemy: { name: '空台绝响', hp: 40, portrait: 'juexiang', passive: 'juexiang', deck: [
      'ZL-016', 'ZL-017', 'ZL-017', 'ZL-015', 'ZL-015', 'ZL-014', 'ZL-014', 'ZL-007', 'ZL-007', 'ZL-013',
      'ZL-010', 'ZL-018', 'ZL-018', 'ZL-013', 'ZL-013', 'ZL-011', 'FL-003', 'FL-004', 'FL-005', 'FL-006'],
      grades: { 'FL-003': 1 } },
    ai: 'hard', playerFirst: false,
    reward: { fragments: 75, unlock: ['LJ-016', 'WM-010', 'QW-003'] },
    pre: [
      { who: '', text: '（天快亮了。戏台空着，锣鼓架翻倒在一旁，台口积着厚厚一层灰。）' },
      { who: '', text: '（灰自己动起来，聚成一个人形——像班主，像伶人，又像一整座戏台站了起来。）' },
      { who: '女娲之灵', text: '这不是一个人。这是一整个班子散了以后，剩下的那口气。' },
      { who: '汤显祖之灵', text: '孔尚任写过："眼看他起朱楼，眼看他宴宾客，眼看他楼塌了。"' },
      { who: '守护者', text: '它想干什么？' },
      { who: '关汉卿之灵', text: '它想散场。它觉得没人看了，不如都别演了——连你手里的本事，它也要一并收走。' },
      { who: '', text: '（人形抬手，虚空中落下一道幕布的影子。台下所有人影同时消失。）' },
      { who: '守护者', text: '……可我还在这儿。' },
      { who: '女娲之灵', text: '那就够了。一个看客，也是满堂。' },
    ],
    post: [
      { who: '', text: '（灰烬人形停住。它慢慢转向台下唯一的那个人，抬手，端端正正亮了一个相。）' },
      { who: '', text: '（然后它散了。不是崩碎，是像散场一样，从容地散在晨光里。）', stage: 'sky' },
      { who: '', text: '（台角的绣绷上，一幅双面绣被晨风翻了个面。织机的声音从远处传来。）', stage: 'card:LJ-016' },
      { who: '黄道婆之灵', text: '我不识字，也没写过戏。我只会一件事：把手艺教给下一个人。' },
      { who: '守护者', text: '教给我吗？' },
      { who: '黄道婆之灵', text: '教给你，你再教给别人。这样就断不了。' },
      { who: '女娲之灵', text: '守护者，你现在明白了吧——文脉不在书里，不在碑上，也不在戏台上。' },
      { who: '女娲之灵', text: '它在"还有人记得"这件事里。而你，已经记得了三个时代。' },
      { who: '', text: '（晨光漫过戏台。远处传来锣声，第一声很轻，接着一声比一声响。）' },
      { who: '', text: '非遗薪传篇 · 终　　文脉不绝，代代有人', stage: 'end' },
    ],
  },
);

/** Dialogue speaker → card-art motif used for the portrait beside their lines. */
export const SPEAKER_ART = {
  '女娲之灵': 'nvwaSpirit', '守护者': 'guardian',
  '李白之灵': 'poet', '杜甫之灵': 'cottage', '苏轼之灵': 'river',
  '关汉卿之灵': 'snowOath', '汤显祖之灵': 'peony', '黄道婆之灵': 'loom', '魏良辅之灵': 'flute',
  ...LATE_SPEAKERS,
  ...ERA_SPEAKERS,
};

// 神话之后的各章住在 storyLate.js，汇进同一张扁平的 LEVELS 表。
for (const C of LATE_CHAPTERS) for (const L of C.levels) LEVELS.push({ ...L, chapter: C.n });
for (const C of ERA_CHAPTERS) for (const L of C.levels) LEVELS.push({ ...L, chapter: C.n });
// 章节是按朝代编年排的，而声明顺序是当初写的顺序，两者早就不一致了。
// 进度门禁（save.levelOpen）吃的是 LEVELS 的下标，所以这里必须按章号重排一次。
LEVELS.sort((a, b) => (a.chapter ?? 1) - (b.chapter ?? 1));

const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
/** 1 → 一, 10 → 十, 12 → 十二, 21 → 二十一. Chapter counts have outgrown a hand-written list twice now. */
const numeral = (n) => (n < 10 ? DIGITS[n] : n < 20 ? `十${DIGITS[n - 10]}` : `${DIGITS[Math.floor(n / 10)]}十${DIGITS[n % 10]}`);
const chapter = (n, short, prologue, desc) => {
  const levels = LEVELS.filter((L) => (L.chapter ?? 1) === n);
  // key 是关卡 id 的前缀（shenhua / xianqin …），也就是这一章的稳定标识。
  // 章号会随重排变，key 不会，所以文物志一类的外部数据一律按 key 挂。
  return { n, key: levels[0].id.replace(/-\d+$/, ''), short, title: `第${numeral(n)}章 · ${short}`, num: numeral(n), prologue, desc, levels };
};

// 章节顺序 = 中国神话 → 朝代编年 → 传承 → 终章。想插一章进去，改这里的章号即可，
// 关卡 id 用的是朝代拼音（shenhua-1 / xianqin-1 …）而不是章号，重排不会动到存档。
export const CHAPTERS = [
  chapter(1, '上古神话篇', PROLOGUE, '书斋之中，泛黄典籍里溢出一缕金光。'),
  chapter(7, '大唐气象篇', PROLOGUE2, '典籍里的诗只剩半句，铜镜映出黄昏的长安。'),
  chapter(12, '非遗薪传篇', PROLOGUE3, '铜镜蒙尘。有一种文脉不写在书上，只活在人手里。'),
  ...LATE_CHAPTERS.map((C) => chapter(C.n, C.short, C.prologue, C.desc)),
  ...ERA_CHAPTERS.map((C) => chapter(C.n, C.short, C.prologue, C.desc)),
].sort((a, b) => a.n - b.n);
/** Closing banner for a chapter's last 'end' cue. */
export const chapterEnd = (n) => {
  const C = CHAPTERS.find((x) => x.n === n) ?? CHAPTERS[0], next = CHAPTERS.find((x) => x.n === n + 1);
  return { title: `${C.short} · 终`, sub: next ? `${next.title} 已开启` : '文脉不绝，代代有人' };
};

// 自由对战 opponents: one per scene (SCENE_DESIGN_v1: 昆仑墟 / 古戏台 / 书斋)
export const PRACTICE = [
  { id: 'p-kunlun', title: '昆仑墟 · 创世之试', scene: 'kunlun', variant: 'summit', enemy: { name: '昆仑守山人', hp: 40, portrait: 'giant',
    deck: ['LJ-001', 'LJ-004', 'LJ-002', 'LJ-009', 'LJ-007', 'LJ-007', 'LJ-008', 'LJ-008', 'LJ-006', 'LJ-006',
      'WM-001', 'WM-002', 'ZL-001', 'FL-003', 'FL-005', 'FL-005', 'FL-001', 'FL-002', 'FL-002', 'LJ-009'] } },
  { id: 'p-stage', title: '古戏台 · 八仙献艺', scene: 'stage', enemy: { name: '戏台班主', hp: 40, portrait: 'swordsman',
    deck: ['LJ-005', 'LJ-005', 'LJ-006', 'LJ-006', 'LJ-003', 'LJ-003', 'LJ-007', 'LJ-007', 'LJ-009', 'WM-003',
      'WM-003', 'WM-004', 'WM-007', 'FL-002', 'FL-002', 'FL-004', 'FL-001', 'FL-006', 'LJ-008', 'FL-003'] } },
  { id: 'p-study', title: '书斋 · 五行符阵', scene: 'study', enemy: { name: '书斋老道', hp: 40, portrait: 'judge',
    deck: ['FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-005', 'FL-006', 'LJ-003', 'FL-003', 'FL-004', 'LJ-008',
      'LJ-004', 'LJ-004', 'LJ-009', 'LJ-007', 'LJ-007', 'LJ-008', 'WM-005', 'WM-005', 'LJ-006', 'WM-002'] } },
  { id: 'p-changan', title: '长安 · 诗酒夜宴', scene: 'changan', variant: 'street', enemy: { name: '酒肆诗客', hp: 40, portrait: 'poet',
    deck: ['LJ-010', 'LJ-011', 'LJ-011', 'LJ-012', 'LJ-013', 'LJ-013', 'LJ-007', 'LJ-007', 'LJ-008', 'LJ-004',
      'LJ-006', 'WM-009', 'WM-005', 'FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-006', 'FL-006', 'LJ-009'] } },
  { id: 'p-liyuan', title: '古戏台 · 梨园绝唱', scene: 'stage', variant: 'dawn', enemy: { name: '末代班主', hp: 40, portrait: 'juexiang',
    deck: ['LJ-014', 'LJ-014', 'LJ-015', 'LJ-017', 'LJ-017', 'LJ-016', 'LJ-006', 'LJ-006', 'LJ-013', 'LJ-009',
      'WM-010', 'WM-011', 'WM-004', 'WM-007', 'FL-001', 'FL-003', 'FL-003', 'FL-005', 'FL-006', 'LJ-008'] } },
  { id: 'p-guankou', title: '灌江口 · 诸神夜话', scene: 'kunlun', variant: 'summit', enemy: { name: '灌口二郎', hp: 40, portrait: 'myth-erlang',
    deck: ['LJ-063', 'LJ-063', 'LJ-064', 'LJ-064', 'LJ-065', 'LJ-066', 'LJ-066', 'LJ-067', 'LJ-067', 'LJ-068',
      'LJ-069', 'LJ-008', 'LJ-003', 'WM-024', 'WM-024', 'FL-004', 'FL-006', 'FL-001', 'FL-003', 'LJ-068'] } },
];

PRACTICE.push(...LATE_PRACTICE, ...ERA_PRACTICE);

// 自由对战与故事关重打的碎片奖励，按 AI 难度分档——宗师一局约等于入门四局。
// 这也是守护者修行的主要碎片来源（src/data/guardian.js 点满约 1800）。
export const REWARD_PRACTICE = {
  easy: { win: 3, loss: 1 },
  normal: { win: 6, loss: 2 },
  hard: { win: 12, loss: 3 },
};
export const practiceReward = (ai) => REWARD_PRACTICE[ai] ?? REWARD_PRACTICE.normal;
