// Card table (DT_Cards). Source of truth: docs/design/CARDS/CARD_LIST_v1.md (v1.1) + docs/narrative/CARD_FLAVOR/*.md.
// Quotes are copied from the narrative files; do not paraphrase them.
//
import { LATE_CARDS, LATE_BONDS } from './cardsLate.js';
import { ARTIFACTS } from './artifacts.js';
import { RELIC_ARTIFACTS } from './cardsRelic.js';
import { XIYOU_CARDS, XIYOU_WENMAI, XIYOU_BOND } from './cardsXiyou.js';
import { SONG_CARDS, SONG_BOND } from './cardsSong.js';
import { MYTH_CARDS, MYTH_WENMAI, MYTH_BOND } from './cardsMyth.js';
import { ERA_CARDS, ERA_BONDS } from './cardsEra.js';
import { FORMATIONS, FORMATION_BOND } from './cardsForm.js';
import { CAST_CARDS } from './cardsCast.js';

// type: general 灵将 | talisman 符箓 | wenmai 文脉 | artifact 器物 | formation 阵法
// el:   metal 金 | wood 木 | water 水 | fire 火 | earth 土
// target: null | 'enemyGeneral' | 'friendlyGeneral' | 'friendlyGeneralOpt' (may be played with no target)
// skill (珍品 active, generals only): { name, cost, target, text }
// gear (器物 only): { atk, def, hp, guard, only } — 佩戴时加给灵将的属性，灵将阵亡时随之进弃牌堆。
//                   only: [灵将 id]，专属器物只有名单里的人拿得动（定海神针只有孙悟空抡得起来）

export const EL = {
  metal: { zh: '金', color: '#C8A04A', beast: '白虎' },
  wood: { zh: '木', color: '#4A8C5C', beast: '青龙' },
  water: { zh: '水', color: '#2A4A7A', beast: '玄武' },
  fire: { zh: '火', color: '#C03A2A', beast: '朱雀' },
  earth: { zh: '土', color: '#8C6040', beast: '勾陈' },
};
export const EL_KEYS = ['metal', 'wood', 'water', 'fire', 'earth'];
// 金克木 → 木克土 → 土克水 → 水克火 → 火克金
export const COUNTERS = { metal: 'wood', wood: 'earth', earth: 'water', water: 'fire', fire: 'metal' };
export const TYPE_ZH = { general: '灵将', talisman: '符箓', wenmai: '文脉', artifact: '器物', formation: '阵法' };
export const GRADE_ZH = ['凡品', '珍品', '极品'];
export const GRADE_BONUS = [{ atk: 0, def: 0, hp: 0 }, { atk: 1, def: 1, hp: 2 }, { atk: 2, def: 2, hp: 3 }];
// 器物升阶只抬 ATK/DEF，不抬 HP——HP 是佩戴那一刻加到灵将身上的，跟着品阶变会让卸下时的账很难算。
export const GEAR_GRADE = [0, 1, 2];
export const UPGRADE_COST = [10, 25]; // 凡→珍, 珍→极 (文脉碎片)

export const BONDS = {
  genesis: { name: '创世组', title: '开天绪脉', members: ['LJ-001', 'LJ-002', 'WM-001', 'WM-002'],
    text: '盘古+女娲同时在场：两者 ATK/DEF 永久 +2，主将回复 3；再有创世图或五彩石：全体灵将 HP +2；两图俱在：盘古女娲技能费用 -1。',
    line: '天地初开，鸿蒙判分。盘古以身化山川，女娲以手补苍天——创世之力，一现于此。' },
  baxian: { name: '八仙组', title: '八仙同渡', members: ['LJ-005', 'LJ-006', 'LJ-084', 'LJ-085', 'LJ-086', 'LJ-087', 'LJ-088', 'LJ-089', 'WM-003'],
    text: '场上 ≥2 张八仙灵将：所有八仙灵将 ATK/DEF +1（持续）。',
    line: '八仙各持法器，踏海而行——蓬莱在望，诸仙神通，天下共见。' },
  fengshen: { name: '封神组', title: '逆天斗志', members: ['LJ-003', 'LJ-099', 'LJ-100', 'LJ-101', 'LJ-102', 'LJ-103', 'LJ-104', 'LJ-105', 'LJ-106'],
    text: '哪吒在场：攻击命中后获得 1 灵力（每回合 1 次）。场上有两名封神灵将：这些灵将攻击/防御 +1。',
    line: '榜还没写完。哪吒先动了手，后面的人一个一个往西岐赶。' },
  zhensha: { name: '镇煞组', title: '驱邪入场', members: ['LJ-004', 'WM-005', 'LJ-009'],
    text: '钟馗+定心符咒：定心免疫延长至 3 回合，钟馗技能费用 -1；再有门神在场（镇煞完阵）：主将每次受伤 -1，镇煞灵将 DEF +1。',
    line: '朱砂一笔，鬼神退避——钟馗在此，百邪不侵。' },
  feiyi: { name: '非遗组', title: '手艺三生', members: ['WM-004', 'WM-007', 'WM-010'],
    text: '单张在文脉区：皮影剪纸谱回收的卡牌费用 -1；两张同在：每打出 2 张卡获得 1 灵力（整局上限 5）；三张俱在：上限提至 8，我方灵将 DEF +1。',
    line: '皮影灯下人影绰绰，剪纸窗前年年岁岁，绣绷上一针一线——这是活着的历史，是千年不断的文脉。' },
  liyuan: { name: '梨园组', title: '梨园同台', members: ['LJ-014', 'LJ-015', 'LJ-017', 'WM-011'],
    text: '场上 ≥2 张梨园灵将：所有梨园灵将 ATK/DEF +1（持续）；再有瓦舍勾栏在文脉区（满堂彩）：梨园灵将技能费用 -1。',
    line: '一方氍毹，几盏油灯。台上唱的是别人的悲欢，台下坐的是自己的一生。',
    auto: { generals: ['LJ-014', 'LJ-015', 'LJ-017'], need: 2, wenmai: 'WM-011', perk: 'skill' } },
  ...LATE_BONDS,
  ...XIYOU_BOND,
  ...SONG_BOND,
  ...MYTH_BOND,
  ...ERA_BONDS,
  ...FORMATION_BOND,
  shisheng: { name: '诗文组', title: '李杜文章', members: ['LJ-010', 'LJ-011', 'LJ-012'],
    text: '李白+杜甫同时在场：诗文组灵将 ATK/DEF +1（持续），激活时抽 1 张牌；再有苏轼在场：我方主将每回合开始回复 1 点 HP。',
    line: '李杜文章在，光焰万丈长。——韩愈《调张籍》' },
};

export const RESONANCES = {
  metal: { name: '白虎肃杀', text: '2 回合：我方灵将攻击金/木属性目标 ATK +1；主将每次受伤 -1。' },
  wood: { name: '青龙生旺', text: '2 回合：我方每回合开始额外抽 1 张牌。' },
  water: { name: '玄武困锁', text: '2 回合：我方控制类符箓持续 +1 回合；水属性灵将获得「潜行」（免疫 1 次攻击）。' },
  fire: { name: '朱雀燎原', text: '2 回合：我方符箓打出后额外造成 1 点固定伤害；火属性灵将 ATK +2。' },
  earth: { name: '勾陈稳固', text: '2 回合：我方灵将每次受伤 -1（最低 1）；土属性灵将 DEF +2。' },
  barrier: { name: '五行结界', text: '本局累计打出五行符箓各 1 张：我方灵将 DEF +2，主将 2 回合内每次受伤 -1。（每局 1 次）' },
  yinyang: { name: '阴阳交汇', text: '同回合打出水符与火符：我方灵将本回合 ATK/DEF +2，驱散敌方 1 个共鸣，主将回复 3。（每局 2 次）' },
  heaven: { name: '天地玄黄', text: '累计打出 10 张符箓：从弃牌堆取回 2 张符箓，主将回复至 50% HP（或 +3）。（每局 1 次）' },
};

const C = [];
const add = (c) => { C.push(c); return c; };

// ───────────────────────────── 灵将 ─────────────────────────────
add({ id: 'LJ-001', name: '盘古·开天', short: '盘古', type: 'general', faction: '上古神话', cost: 6, atk: 8, def: 4, hp: 12, el: 'earth', bonds: ['genesis'],
  text: '【开天辟地】召唤时对敌方所有灵将造成 2 点固定伤害。',
  skill: { name: '混沌斧击', cost: 3, target: 'enemyGeneral', text: '对单体造成 ATK×1.5 伤害并眩晕 1 回合。' },
  quote: '昔盘古氏之死也，头为四岳，目为日月，脂膏为江海，毛发为草木。', source: '《五运历年纪》（三国·吴·徐整，辑录见《绎史》卷一）',
  flavor: '斧落混沌分，非为杀，为开。',
  lore: '天地混沌如鸡子，盘古一斧劈开，轻者上升为天，重者下沉为地。他以身撑天，死后化为万物：气成风云，声为雷霆，双目为日月，血脉为江河。中国神话里的世界，是用一个生命的全部换来的。',
  art: { motif: 'giant', tint: '#8C6040' } });
add({ id: 'LJ-002', name: '女娲·补天', short: '女娲', type: 'general', faction: '上古神话', cost: 5, atk: 5, def: 6, hp: 10, el: 'fire', bonds: ['genesis'],
  guard: true, text: '【守护】【五彩炼石】召唤时为我方主将恢复 3 点 HP。',
  skill: { name: '造化之手', cost: 2, target: null, text: '从弃牌堆随机取回 1 张文脉卡加入手牌。' },
  quote: '往古之时，四极废，九州裂……女娲炼五色石以补苍天，断鳌足以立四极。', source: '《淮南子·览冥训》（西汉·刘安）',
  flavor: '天破了就去补，人没了就去造。她从不问值不值得，只问还缺什么。',
  lore: '四极崩坏、九州裂开之时，女娲炼五色石补苍天，断鳌足立四极。造人之说另见东汉应劭《风俗通义》。她是中国神话里最早的"修复者"。',
  art: { motif: 'goddess', tint: '#C03A2A' } });
add({ id: 'LJ-003', name: '哪吒·闹海', short: '哪吒', type: 'general', faction: '封神传说', cost: 4, atk: 7, def: 2, hp: 8, el: 'fire', bonds: ['fengshen'],
  text: '【风火轮】每回合可攻击 2 次。',
  skill: { name: '乾坤圈连击', cost: 3, target: 'enemyGeneral', text: '对单体连续攻击 3 次，每次 ATK×0.5。' },
  quote: '哪吒……将身一抖，变作三头六臂，手持六般兵器，脚踏风火二轮。', source: '《封神演义》（明末·许仲琳）第十四回',
  flavor: '割肉还父，剔骨还母，然后重新活过来。',
  lore: '《封神演义》第十二至十四回：哪吒闹海、割肉还父，后由太乙真人以莲花化身重生。更早的原型是唐代佛教护法神那吒俱钵罗。',
  art: { motif: 'youth', tint: '#C03A2A' } });
add({ id: 'LJ-004', name: '钟馗·驱鬼', short: '钟馗', type: 'general', faction: '非遗文脉', cost: 4, atk: 6, def: 3, hp: 9, el: 'metal', bonds: ['zhensha'],
  text: '【斩邪剑】攻击带有负面状态（眩晕/封印/流血）的灵将时 ATK +3。',
  skill: { name: '镇鬼令', cost: 2, target: 'enemyGeneral', text: '眩晕敌方 1 张灵将 1 回合。' },
  quote: '臣终南山进士钟馗也，因武德中应举不捷，羞归故里，触阶而死。', source: '《太平广记》卷二九〇引《唐逸史》（唐·卢肇）',
  flavor: '鬼不怕刀，怕的是他那双眼睛。',
  lore: '唐明皇病中梦见大鬼捉小鬼而啖之，自称终南山进士钟馗。后世岁末贴钟馗像以驱邪，《燕京岁时记》载其俗。',
  art: { motif: 'judge', tint: '#C8A04A' } });
add({ id: 'LJ-005', name: '吕洞宾·纯阳', short: '吕洞宾', type: 'general', faction: '八仙传说', cost: 5, atk: 6, def: 4, hp: 9, el: 'wood', bonds: ['baxian'],
  text: '【纯阳剑气】攻击命中附带「流血」：每回合结束受 1 点伤害，持续 2 回合。',
  skill: { name: '度人经咏', cost: 2, target: null, text: '本回合下一张费用 ≤3 的符箓免费。' },
  quote: '洞宾，字纯阳，河中府永乐县人，唐末举进士不第，浪游江湖。', source: '《历世真仙体道通鉴》卷四十九（元·赵道一）',
  flavor: '三醉岳阳人不识，朗吟飞过洞庭湖。',
  lore: '吕洞宾遇钟离权授剑术与金丹之法，是八仙中故事最多的一位。明代吴元泰《东游记》详载八仙故事。',
  art: { motif: 'swordsman', tint: '#4A8C5C' } });
add({ id: 'LJ-006', name: '铁拐李·葫芦丹', short: '铁拐李', type: 'general', faction: '八仙传说', cost: 3, atk: 4, def: 5, hp: 8, el: 'earth', bonds: ['baxian'],
  guard: true, text: '【守护】【济世葫芦】回合结束时，随机治愈我方 1 张受伤灵将 1 点 HP。',
  skill: { name: '仙丹妙药', cost: 3, target: 'friendlyGeneral', text: '为我方灵将恢复 4 点 HP 并清除 1 个负面状态。' },
  quote: '一日神游，嘱其徒曰："吾魄游上界，七日不返，当化吾魄。"', source: '《历世真仙体道通鉴》（元·赵道一）',
  flavor: '跛着一条腿，背着一只破葫芦。那葫芦里装的，是别人治不好的病。',
  lore: '铁拐李神游上界，其徒提前焚化了他的肉身，魂归无所托，只得附在路旁一具饿殍身上，从此跛足持拐，以葫芦丹药济世。',
  art: { motif: 'beggar', tint: '#8C6040' } });
add({ id: 'LJ-007', name: '烛龙·燃明', short: '烛龙', type: 'general', faction: '上古神话', cost: 2, atk: 3, def: 2, hp: 5, el: 'fire', bonds: [],
  text: '【燃照天地】召唤时本回合我方灵将命中带负面状态的目标，额外造成 1 点固定伤害。',
  skill: { name: '长夜之灯', cost: 1, target: null, text: '我方主将回复 2 点 HP。' },
  quote: '有神，人面蛇身而赤，直目正乘，其瞑乃晦，其视乃明。是烛九阴，是谓烛龙。', source: '《山海经·大荒北经》',
  flavor: '它闭眼是黑夜，睁眼是白天。天地太暗的时候，就靠它撑着。',
  lore: '烛龙人面蛇身而赤，不食不寝不息，闭眼为夜、睁眼为昼，是《山海经》里最古老的神兽之一。',
  art: { motif: 'serpent', tint: '#C03A2A' } });
add({ id: 'LJ-008', name: '嫦娥·奔月', short: '嫦娥', type: 'general', faction: '上古神话', cost: 3, atk: 3, def: 3, hp: 7, el: 'water', bonds: ['sheri'],
  text: '【月辉】召唤时使敌方 ATK 最高的灵将 ATK -2，持续 1 回合。',
  skill: { name: '广寒清辉', cost: 2, target: 'friendlyGeneral', text: '我方灵将获得「潜行」：免疫下一次攻击。' },
  quote: '羿请不死之药于西王母，姮娥窃以奔月，怅然有丧，无以续之。', source: '《淮南子·览冥训》（西汉·刘安）',
  flavor: '月光并不温柔，它只是离得太远，所以看起来安静。',
  lore: '嫦娥本名姮娥，因避汉文帝刘恒讳而改称。张衡《灵宪》记她托身于月化为蟾蜍，后世才演变为广寒宫中的仙子。李商隐："嫦娥应悔偷灵药，碧海青天夜夜心。"',
  art: { motif: 'moon', tint: '#2A4A7A' } });
add({ id: 'LJ-009', name: '门神·神荼郁垒', short: '门神', type: 'general', faction: '民间信仰', cost: 3, atk: 2, def: 5, hp: 8, el: 'metal', bonds: ['zhensha'],
  guard: true, text: '【守护】【桃符】在场时，我方主将每次受到的伤害 -1（与其他减伤取高值）。',
  skill: { name: '苇索缚鬼', cost: 2, target: 'enemyGeneral', text: '敌方灵将 ATK -2，持续 2 回合。' },
  quote: '东海中有山焉，名曰度朔，上有大桃木……二神居其门，主阅领众鬼。', source: '《论衡·订鬼篇》（东汉·王充）引古本《山海经》',
  flavor: '门不需要说话，它存在的意义就是让你知道：有些东西，进不来。',
  lore: '神荼、郁垒居度朔山大桃树下，以苇索缚恶鬼饲虎。后人刻桃木为其像悬于门上，即"桃符"之源。王安石："总把新桃换旧符。"',
  art: { motif: 'guardians', tint: '#C8A04A' } });

// ───────────────────────────── 符箓 ─────────────────────────────
add({ id: 'FL-001', name: '金光护体符', short: '金光符', type: 'talisman', faction: '道法通用', cost: 2, el: 'metal', target: 'friendlyGeneral',
  text: '我方灵将 DEF +3，持续 2 回合。', up: '珍品：目标额外获得「反击」（被攻击时反伤 1 点）。',
  quote: '体有金光，覆映吾身。视之不见，听之不闻。', source: '《金光神咒》，见《道藏》',
  flavor: '金光不是盔甲，是一句话：你现在不能动他。', lore: '金光神咒是道教八大神咒之一，诵之以护身。',
  art: { motif: 'seal-metal' } });
add({ id: 'FL-002', name: '木灵生机符', short: '木灵符', type: 'talisman', faction: '道法通用', cost: 2, el: 'wood', target: null,
  text: '抽 2 张牌；若本回合已打出过符箓，改为抽 3 张。', up: '珍品：手牌中 1 张文脉卡本回合费用 -1。',
  quote: '东方青色，入通于肝，开窍于目……其应四时，上为岁星，是以春气在头也。', source: '《黄帝内经·素问·金匮真言论》',
  flavor: '春风不问你准没准备好，它来了，一切就开始生长。', lore: '五行之中，木主生发，应春，应东方。',
  art: { motif: 'seal-wood' } });
add({ id: 'FL-003', name: '水行困龙符', short: '水行符', type: 'talisman', faction: '道法通用', cost: 3, el: 'water', target: 'enemyGeneral',
  text: '眩晕敌方灵将 1 回合（无法攻击/使用技能）。', up: '珍品：眩晕 2 回合，眩晕期间 ATK -2。',
  quote: '习坎，有孚，维心亨，行有尚。', source: '《周易·坎卦》卦辞',
  flavor: '水不急着淹，它只是绕着你转，等你自己站不稳。', lore: '坎为水，为险。重坎相叠，险中又险。',
  art: { motif: 'seal-water' } });
add({ id: 'FL-004', name: '火焰焚天符', short: '焚天符', type: 'talisman', faction: '道法通用', cost: 3, el: 'fire', target: null,
  text: '对敌方所有灵将造成 2 点固定伤害，并消除敌方 1 个增益（无增益则焚毁敌方最新的文脉卡）。', up: '珍品：固定伤害 3 点。',
  quote: '南方，火也，其帝炎帝，其佐朱明，执衡而治夏。', source: '《淮南子·天文训》（西汉·刘安）',
  flavor: '火不分贵贱，它烧什么，什么就一样平等地成为灰。', lore: '南方属火，其帝炎帝，其神朱明，主夏。',
  art: { motif: 'seal-fire' } });
add({ id: 'FL-005', name: '土封山印符', short: '土封符', type: 'talisman', faction: '道法通用', cost: 2, el: 'earth', target: 'enemyGeneral',
  text: '封印敌方灵将的主动技能 2 回合（不影响攻击）。', up: '珍品：封印期间目标 DEF -2。',
  quote: '西北方，不周之山，天门也。', source: '《淮南子·天文训》（西汉·刘安）',
  flavor: '山压下来，不是要伤你，只是让你先停一停，想清楚再说。', lore: '不周山为天柱，共工怒触之，天倾西北，地陷东南。',
  art: { motif: 'seal-earth' } });
add({ id: 'FL-006', name: '雷霆天罚符', short: '雷击符', type: 'talisman', faction: '道法通用', cost: 4, el: 'metal', target: 'enemyGeneralOrHero',
  text: '对敌方灵将造成 5 点固定伤害；敌方无灵将时改为对主将造成 3 点伤害。', up: '珍品：对灵将 7 点，并消除其 1 个增益。',
  quote: '雷公以斧击之，击物有声，谓之雷；雷光谓之电。', source: '《搜神记》（东晋·干宝）卷十四',
  flavor: '天不会无故发怒，但一旦发怒，就不讲道理了。', lore: '道家雷法出自《道藏》雷部神将体系，天罚属金行。',
  art: { motif: 'seal-thunder' } });

// ───────────────────────────── 文脉 ─────────────────────────────
add({ id: 'WM-001', name: '盘古创世图', short: '创世图', type: 'wenmai', faction: '上古神话', cost: 3, el: 'earth', bonds: ['genesis'],
  text: '我方土属性灵将 ATK +2；每回合开始我方主将回复 1 点 HP。', up: '珍品：土属性灵将 ATK +3、DEF +1。',
  quote: '首生盘古，垂死化身。气成风云，声为雷霆，左眼为日，右眼为月。', source: '《述异记》（南朝梁·任昉）卷上',
  flavor: '山是他的骨，江是他的血，云是他最后一口气。', lore: '盘古垂死化身，四肢五体化为四极五岳，血液为江河，皮毛为草木。',
  art: { motif: 'scroll-mountain' } });
add({ id: 'WM-002', name: '女娲五彩石', short: '五彩石', type: 'wenmai', faction: '上古神话', cost: 2, el: 'fire', bonds: ['genesis'],
  text: '我方主将每次受到伤害时抵消 1 点。', up: '珍品：抵消 2 点。',
  quote: '于是女娲炼五色石以补苍天，断鳌足以立四极，杀黑龙以济冀州。', source: '《淮南子·览冥训》（西汉·刘安）',
  flavor: '五色的石头，补的不是天上的洞，是人心里"这世界可以好起来"的念头。', lore: '五彩石补天是女娲传说最核心的文化符号。',
  art: { motif: 'scroll-stones' } });
add({ id: 'WM-003', name: '八仙过海图', short: '过海图', type: 'wenmai', faction: '八仙传说', cost: 4, el: 'water', bonds: ['baxian'],
  text: '场上每有 1 张八仙灵将，所有八仙灵将 ATK/DEF 各 +1（最多 +4）。', up: '珍品：打出时抽 1 张牌。',
  quote: '八仙同至东海之滨，各以法器投海，各乘法器，凌波而过。', source: '《东游记》（明·吴元泰）第三十二回',
  flavor: '八个人，八样法器，没有一个用法一样。各显神通，才是真的同行。', lore: '铁拐乘葫芦，锺离乘芭蕉扇，果老乘纸驴，洞宾乘长剑。',
  art: { motif: 'scroll-sea' } });
add({ id: 'WM-004', name: '皮影剪纸谱', short: '剪纸谱', type: 'wenmai', faction: '非遗文脉', cost: 2, el: 'wood', bonds: ['feiyi'],
  text: '每回合开始，从弃牌堆取回 1 张费用 ≤2 的卡牌（不重复选同一张）。', up: '珍品：费用上限 ≤3，每次触发额外获得 1 点灵力。',
  quote: '中瓦里有大影戏棚，每夜五更方散，耍闹之所无如此也。', source: '《东京梦华录》卷二（北宋·孟元老）',
  flavor: '灯一亮，皮影就活了。那个故事死去又活来，每次都是第一次。', lore: '皮影戏与剪纸均入选联合国教科文组织人类非物质文化遗产代表作名录。',
  art: { motif: 'scroll-papercut' } });
add({ id: 'WM-005', name: '定心符咒', short: '定心咒', type: 'wenmai', faction: '道法通用', cost: 1, el: 'earth', bonds: ['zhensha'], target: 'friendlyGeneralOpt',
  text: '清除我方 1 张灵将的所有负面状态，并使其免疫负面状态 2 回合。', up: '珍品：免疫 3 回合。',
  quote: '（民间镇宅写"定"字辟邪之俗，见《燕京岁时记》）', source: '《道藏·太上三洞神咒》；《燕京岁时记》',
  flavor: '心乱才会被缚，心定了，什么枷锁都只是挂着的装饰。', lore: '民间镇宅符咒文化，朱砂写"定"字以安宅辟邪。',
  art: { motif: 'scroll-ding' } });
add({ id: 'WM-006', name: '昆仑仙境图', short: '昆仑图', type: 'wenmai', faction: '上古神话', cost: 5, el: 'metal', bonds: [],
  text: '我方灵将召唤费用 -1（下限 1），持续 3 回合，结束后移入弃牌堆。', up: '珍品：持续 5 回合，每次召唤灵将抽 1 张牌。',
  quote: '海内昆仑之虚，在西北，帝之下都……面有九门，门有开明兽守之，百神之所在。', source: '《山海经·海内西经》',
  flavor: '那座山没有路，但所有神祇都知道怎么回去。', lore: '昆仑之虚方八百里，高万仞，百神之所在。《穆天子传》载周穆王西游昆仑见西王母。',
  art: { motif: 'scroll-kunlun' } });
add({ id: 'WM-007', name: '皮影·旦角', short: '旦角', type: 'wenmai', faction: '非遗文脉', cost: 2, el: 'fire', bonds: ['feiyi'],
  text: '在场时，我方每打出 3 张卡获得 1 点灵力（整局上限 3）。', up: '珍品：打出时我方主将回复 2 点 HP。',
  quote: '中瓦里有大影戏棚，每夜五更方散。', source: '《东京梦华录》卷二（北宋·孟元老）',
  flavor: '皮上不过几道刻痕，灯后却是一整个江湖。', lore: '皮影人偶需经选皮、刮制、描样、雕刻、上色等数十道工序。2011 年中国皮影戏入选非遗名录。',
  art: { motif: 'scroll-shadow' } });

// ───────────────────────────── 大唐气象篇（原「唐宋古风」拆出的唐这一半）─────────────────────────────
// 苏轼和活字印刷（毕昇）是宋人，跟着第八章走，牌面上的势力也改成了「两宋风雅」。
add({ id: 'LJ-010', name: '李白·诗仙', short: '李白', type: 'general', faction: '大唐气象', cost: 5, atk: 6, def: 3, hp: 9, el: 'metal', bonds: ['shisheng'],
  text: '【斗酒诗百篇】召唤时抽 1 张牌；我方每打出 1 张符箓，李白本回合 ATK +1。',
  skill: { name: '将进酒', cost: 3, target: null, text: '对敌方所有灵将造成 2 点固定伤害。' },
  quote: '李白斗酒诗百篇，长安市上酒家眠。天子呼来不上船，自称臣是酒中仙。', source: '杜甫《饮中八仙歌》',
  flavor: '一壶酒，一轮月，整个盛唐都在他笔下。',
  lore: '李白字太白，号青莲居士。《新唐书》载其母梦长庚星而生，故以"太白"为字。天宝初供奉翰林，不久赐金放还，此后漫游天下，存诗近千首。',
  art: { motif: 'poet', tint: '#C8A04A' } });
add({ id: 'LJ-011', name: '杜甫·诗圣', short: '杜甫', type: 'general', faction: '大唐气象', cost: 4, atk: 3, def: 5, hp: 10, el: 'earth', bonds: ['shisheng'],
  guard: true, text: '【守护】【广厦千万间】回合结束时，我方所有灵将回复 1 点 HP。',
  skill: { name: '春望', cost: 2, target: 'friendlyGeneral', text: '清除我方灵将所有负面状态，并使其 DEF +2，持续 2 回合。' },
  quote: '安得广厦千万间，大庇天下寒士俱欢颜！风雨不动安如山。', source: '杜甫《茅屋为秋风所破歌》',
  flavor: '自己的屋顶被秋风卷走的那一夜，他想的是天下所有漏雨的屋子。',
  lore: '杜甫字子美，自号少陵野老。应试不第，困守长安十年，安史之乱中辗转流离。他的诗记下了一个时代的疼痛，后世称为"诗史"。',
  art: { motif: 'cottage', tint: '#8C6040' } });
add({ id: 'LJ-012', name: '苏轼·东坡', short: '苏轼', type: 'general', faction: '两宋风雅', cost: 4, atk: 5, def: 3, hp: 8, el: 'water', bonds: ['shisheng'],
  text: '【大江东去】召唤时对敌方随机 1 张灵将造成 3 点固定伤害（敌方无灵将时对主将造成 2 点）。',
  skill: { name: '定风波', cost: 2, target: null, text: '我方所有灵将免疫负面状态 2 回合。' },
  quote: '大江东去，浪淘尽，千古风流人物。', source: '苏轼《念奴娇·赤壁怀古》',
  flavor: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。（苏轼《定风波》）',
  lore: '苏轼字子瞻，号东坡居士，北宋文学家、书画家。一生屡遭贬谪，黄州、惠州、儋州越走越远，却在每一处都留下了诗文与笑谈。',
  art: { motif: 'river', tint: '#2A4A7A' } });
add({ id: 'LJ-013', name: '公孙大娘·剑器', short: '公孙大娘', type: 'general', faction: '大唐气象', cost: 3, atk: 4, def: 2, hp: 6, el: 'fire', bonds: [],
  text: '【剑器浑脱】攻击后若存活，获得「潜行」（免疫下一次攻击）。',
  skill: { name: '剑器行', cost: 2, target: 'enemyGeneral', text: '对敌方灵将造成 4 点固定伤害。' },
  quote: '昔有佳人公孙氏，一舞剑器动四方。观者如山色沮丧，天地为之久低昂。', source: '杜甫《观公孙大娘弟子舞剑器行》',
  flavor: '她舞剑的时候，连天地都要屏住呼吸。',
  lore: '公孙大娘是唐玄宗时的舞者，以剑器舞名动一时。杜甫幼年曾观其舞，五十年后见其弟子李十二娘再舞，作诗追忆；诗序说张旭观公孙大娘舞剑器，自此草书长进。',
  art: { motif: 'dancer', tint: '#C03A2A' } });
add({ id: 'WM-008', name: '活字印刷', short: '活字', type: 'wenmai', faction: '两宋风雅', cost: 3, el: 'earth', bonds: [],
  text: '每回合开始，若手牌少于 3 张，额外抽 1 张牌。', up: '珍品：手牌少于 4 张即触发。',
  quote: '庆历中，有布衣毕昇，又为活板。其法用胶泥刻字，薄如钱唇，每字为一印，火烧令坚。', source: '沈括《梦溪笔谈》卷十八·技艺',
  flavor: '一个字刻一次，却能印一万次。记忆也是这样被传下去的。',
  lore: '北宋毕昇发明胶泥活字，比欧洲早约四百年。2010 年"中国木活字印刷术"列入联合国教科文组织急需保护的非物质文化遗产名录。',
  art: { motif: 'scroll-type' } });
add({ id: 'WM-009', name: '陆羽茶经', short: '茶经', type: 'wenmai', faction: '大唐气象', cost: 4, el: 'wood', bonds: [],
  text: '每回合开始获得 1 点额外灵力。', up: '珍品：并使我方主将回复 1 点 HP。',
  quote: '茶者，南方之嘉木也。一尺、二尺乃至数十尺。', source: '陆羽《茶经·一之源》',
  flavor: '一盏茶的工夫，足够让人慢下来，想起一些事。',
  lore: '唐代陆羽著《茶经》三卷，是世界上第一部茶学专著，陆羽被后世尊为"茶圣"。2022 年"中国传统制茶技艺及其相关习俗"列入人类非物质文化遗产代表作名录。',
  art: { motif: 'scroll-tea' } });

// ───────────────────────────── 第三章 · 非遗薪传篇 ─────────────────────────────
add({ id: 'LJ-014', name: '关汉卿·窦娥', short: '关汉卿', type: 'general', faction: '梨园非遗', cost: 4, atk: 5, def: 3, hp: 8, el: 'metal', bonds: ['liyuan'],
  text: '【感天动地】我方灵将阵亡时，对敌方主将造成 1 点伤害。',
  skill: { name: '六月飞雪', cost: 3, target: null, text: '对敌方所有灵将造成 1 点固定伤害，并眩晕其中 ATK 最高的 1 张 1 回合。' },
  quote: '地也，你不分好歹何为地！天也，你错勘贤愚枉做天！', source: '关汉卿《感天动地窦娥冤》第三折【滚绣球】',
  flavor: '六月飞雪，血溅白练，三年大旱——她要的不是报复，是有人承认她冤。',
  lore: '关汉卿是元曲四大家之首，《录鬼簿》列其为"前辈已死名公才人"之首。《窦娥冤》写一个被冤杀的普通女子，把状告到了天上。王国维称元曲"一代之文学"。',
  art: { motif: 'snowOath', tint: '#C8A04A' } });
add({ id: 'LJ-015', name: '汤显祖·临川', short: '汤显祖', type: 'general', faction: '梨园非遗', cost: 5, atk: 4, def: 4, hp: 11, el: 'wood', bonds: ['liyuan'],
  text: '【情不知所起】召唤时从弃牌堆取回 1 张灵将卡加入手牌。',
  skill: { name: '牡丹还魂', cost: 3, target: null, text: '从弃牌堆直接召唤 1 张费用 ≤4 的灵将到我方场上。' },
  quote: '情不知所起，一往而深。生者可以死，死可以生。', source: '汤显祖《牡丹亭·题词》',
  flavor: '杜丽娘因梦而死，又因情而生。这世上真有什么能把人从死里唤回来，那大概就是有人还记着她。',
  lore: '汤显祖字义仍，号海若，江西临川人，作《紫钗记》《牡丹亭》《南柯记》《邯郸记》，合称"临川四梦"。《牡丹亭》至今仍是昆曲舞台上演出最多的戏。',
  art: { motif: 'peony', tint: '#4A8C5C' } });
add({ id: 'LJ-016', name: '黄道婆·纺织', short: '黄道婆', type: 'general', faction: '梨园非遗', cost: 4, atk: 3, def: 5, hp: 10, el: 'earth', bonds: [],
  guard: true, text: '【守护】【经纬】我方文脉区每有 1 张文脉卡，黄道婆 DEF +1（最多 +3）。',
  skill: { name: '错纱配色', cost: 2, target: null, text: '抽 1 张牌，并使手牌中 1 张文脉卡本回合费用 -1。' },
  quote: '有一妪名黄道婆者，自崖州来，乃教以做造捍弹纺织之具，至于错纱配色，综线挈花，各有其法。', source: '陶宗仪《南村辍耕录》卷二十四·黄道婆（元）',
  flavor: '她没写过一个字，却把一门手艺教给了整座松江城。',
  lore: '黄道婆流落崖州（今海南）数十年，习得黎族棉纺技艺，元代晚年归乌泥泾，改良捍、弹、纺、织工具并传授乡人，松江由此成为江南棉纺中心。民间尊为"黄母"。',
  art: { motif: 'loom', tint: '#8C6040' } });
add({ id: 'LJ-017', name: '魏良辅·水磨', short: '魏良辅', type: 'general', faction: '梨园非遗', cost: 3, atk: 4, def: 2, hp: 7, el: 'water', bonds: ['liyuan'],
  text: '【冷板慢拍】召唤时封印敌方所有灵将的主动技能 1 回合。',
  skill: { name: '度曲', cost: 2, target: 'enemyGeneral', text: '眩晕敌方灵将 1 回合，并使其 ATK -1，持续 2 回合。' },
  quote: '愤南曲之讹陋也，尽洗乖声，别开堂奥，调用水磨，拍捱冷板。', source: '沈宠绥《度曲须知·曲运隆衰》（明）',
  flavor: '一个字要唱足几拍，一支曲要磨上十年。慢，是他留给后人的方法。',
  lore: '魏良辅为明嘉靖年间曲家，与张野塘等人改革昆山腔，创"水磨调"，讲究字正腔圆、行腔婉转，昆曲由此风靡南北。2001 年昆曲列入联合国教科文组织首批"人类口头和非物质遗产代表作"。',
  art: { motif: 'flute', tint: '#2A4A7A' } });
add({ id: 'WM-010', name: '苏绣·双面绣', short: '双面绣', type: 'wenmai', faction: '梨园非遗', cost: 3, el: 'fire', bonds: ['feiyi'],
  text: '打出时我方所有灵将 DEF +1（永久）；每回合开始，随机 1 张我方受伤灵将回复 1 点 HP。', up: '珍品：回复 2 点 HP。',
  quote: '藻、火、粉米、黼、黻、絺绣，以五采彰施于五色，作服。', source: '《尚书·虞书·益稷》',
  flavor: '一面是猫，翻过来还是猫，眼睛却望着另一个方向。同一根丝，两个世界。',
  lore: '苏绣为四大名绣之一，双面绣在同一块底料上正反两面绣出不同画面，针脚互不外露。2006 年苏绣列入第一批国家级非物质文化遗产名录。',
  art: { motif: 'scroll-embroidery' } });
add({ id: 'WM-011', name: '瓦舍勾栏', short: '瓦舍', type: 'wenmai', faction: '梨园非遗', cost: 2, el: 'earth', bonds: ['liyuan'],
  text: '每回合开始：手牌 ≥5 时获得 1 点灵力，否则抽 1 张牌。', up: '珍品：两者兼得。',
  quote: '瓦舍者，谓其来时瓦合，去时瓦解之义，易聚易散也。', source: '吴自牧《梦粱录》卷十九·瓦舍（南宋）',
  flavor: '来的时候像瓦片堆在一起，散的时候像瓦片碎了一地。热闹从来都是这样。',
  lore: '瓦舍是宋代城市的娱乐街区，其中围起来的演出场地叫"勾栏"。《东京梦华录》载汴京中瓦"大小勾栏五十余座"，说书、杂剧、傀儡、影戏终日不绝——中国戏曲就是在这里长大的。',
  art: { motif: 'scroll-wazi' } });

// ───────────────────────────── 浊灵（故事模式敌方） ─────────────────────────────
// 浊灵 are the game's own creatures (LORE_BIBLE): forgotten memory given shape. No classical quote.
const ZL = (c) => add({ faction: '浊灵', bonds: [], zhuo: true, quote: '', source: '本作原创（LORE_BIBLE）', ...c });
ZL({ id: 'ZL-001', name: '迷雾小灵', short: '迷雾', type: 'general', cost: 1, atk: 2, def: 0, hp: 3, el: 'water',
  text: '游荡的遗忘之雾。', flavor: '曾经有人知道这里的名字，后来他们忘了。', lore: 'Ⅰ级浊灵。由零散的遗忘聚成，行动迟缓。', art: { motif: 'mist' } });
ZL({ id: 'ZL-002', name: '蚀文雾灵', short: '蚀文', type: 'general', cost: 2, atk: 3, def: 1, hp: 4, el: 'wood',
  text: '【腐蚀】命中灵将后，目标 DEF 永久 -1（最低 0）。', flavor: '它们不攻击，只让人遗忘。', lore: 'Ⅰ级浊灵（进化）。以文字为食，所过之处碑文褪色。', art: { motif: 'mist2' } });
ZL({ id: 'ZL-003', name: '噬名浊影', short: '噬名', type: 'general', cost: 3, atk: 4, def: 2, hp: 6, el: 'metal',
  text: '【吞名】召唤时封印我方 ATK 最高的灵将 1 回合。', flavor: '没人记得，名字便自己消失了。', lore: 'Ⅱ级浊灵。盘踞在记名碑周围，吞噬残余的文脉光迹。', art: { motif: 'shade' } });
ZL({ id: 'ZL-004', name: '残碑怨影', short: '残碑', type: 'general', cost: 4, atk: 5, def: 3, hp: 8, el: 'earth',
  guard: true, text: '【守护】沉重的碑石残片凝成的怨影。', flavor: '碑还在，字已空。', lore: 'Ⅱ级浊灵。由破碎的石刻纹路拼合而成。', art: { motif: 'stele' } });
ZL({ id: 'ZL-005', name: '混沌残骸', short: '残骸', type: 'general', cost: 6, atk: 7, def: 3, hp: 12, el: 'earth',
  guard: true, text: '【守护】【开天之痛】召唤时眩晕我方随机 1 张灵将 1 回合。', flavor: '不是他。是那段被遗忘的痛苦，自己找到了形状。', lore: 'Ⅱ级沉迹怨灵。盘古文脉变质后的产物，四肢扭曲如折断的树干。', art: { motif: 'husk' } });
ZL({ id: 'ZL-006', name: '浊雾侵蚀', short: '侵蚀', type: 'talisman', cost: 2, el: 'water', target: 'enemyGeneralOrHero',
  text: '对敌方灵将造成 3 点固定伤害；敌方无灵将时改为对主将造成 2 点伤害。', flavor: '遗忘不需要声音。', lore: '浊灵的混沌之气。', art: { motif: 'seal-mist' } });
// 第二章：长安城。被遗忘的诗句、题名与乐曲。
ZL({ id: 'ZL-007', name: '残句墨魅', short: '墨魅', type: 'general', cost: 1, atk: 2, def: 1, hp: 3, el: 'water',
  text: '【残句】死亡时，对敌方主将造成 1 点伤害。', flavor: '只剩半句诗，另外半句，没人记得了。', lore: 'Ⅰ级浊灵。被遗忘的诗句碎片聚成的墨团，墨迹未干。', art: { motif: 'inkling' } });
ZL({ id: 'ZL-008', name: '失名举子', short: '举子', type: 'general', cost: 2, atk: 2, def: 4, hp: 6, el: 'earth',
  guard: true, text: '【守护】褪色的名字凝成的书生残影。', flavor: '他曾在塔下写下自己的名字。', lore: 'Ⅰ级浊灵。唐代新科进士有"雁塔题名"之俗，那些早已无人记得的名字，化成了它们。', art: { motif: 'scholarGhost' } });
ZL({ id: 'ZL-009', name: '断弦琴魅', short: '断弦', type: 'general', cost: 3, atk: 3, def: 2, hp: 6, el: 'metal',
  text: '【断弦】召唤时使敌方所有灵将 ATK -1，持续 1 回合。', flavor: '弦断了，曲子还在找它的下一个音。', lore: 'Ⅱ级浊灵。失传乐曲的残响，附在断了弦的琵琶上。', art: { motif: 'lute' } });
ZL({ id: 'ZL-010', name: '褪色题名', short: '题名', type: 'general', cost: 5, atk: 4, def: 5, hp: 10, el: 'earth',
  guard: true, text: '【守护】【碑影】回合结束时，己方主将回复 1 点 HP。', flavor: '塔上的字，一年淡一分。', lore: 'Ⅱ级浊灵。雁塔砖上层层叠叠的题名被遗忘后凝成的碑影。', art: { motif: 'nameplate' } });
ZL({ id: 'ZL-011', name: '霓裳残舞', short: '残舞', type: 'general', cost: 4, atk: 5, def: 2, hp: 7, el: 'fire',
  text: '【残舞】攻击后若存活，获得「潜行」。', flavor: '舞步还记得，曲子已经忘了。', lore: 'Ⅱ级浊灵。梨园舞者的残影，随着失传的曲调无休止地旋转。', art: { motif: 'dancerGhost' } });
ZL({ id: 'ZL-012', name: '遗忘之墨', short: '忘墨', type: 'talisman', cost: 2, el: 'water', target: 'enemyGeneral',
  text: '对敌方灵将造成 3 点固定伤害，并封印其技能 1 回合。', flavor: '墨落之处，字迹尽失。', lore: '浊灵泼洒的墨。', art: { motif: 'seal-ink' } });
// 第三章：古戏台。散了的班子、没人再演的戏。
ZL({ id: 'ZL-013', name: '断线偶人', short: '偶人', type: 'general', cost: 2, atk: 3, def: 1, hp: 4, el: 'wood',
  text: '【断线】攻击后自身受到 1 点伤害。', flavor: '线断了，它还在做那个动作。', lore: 'Ⅰ级浊灵。提线木偶的残影，关节仍记得戏文里的每一个身段。', art: { motif: 'puppet' } });
ZL({ id: 'ZL-014', name: '褪色脸谱', short: '脸谱', type: 'general', cost: 3, atk: 2, def: 3, hp: 7, el: 'earth',
  guard: true, text: '【守护】【油彩】被攻击后，攻击者 ATK -1，持续 1 回合。', flavor: '红为忠，白为奸——颜色淡了，谁也认不出他演的是谁。', lore: 'Ⅰ级浊灵。褪了色的戏曲脸谱，还想让人看懂自己。', art: { motif: 'mask' } });
ZL({ id: 'ZL-015', name: '哑锣怨影', short: '哑锣', type: 'general', cost: 3, atk: 4, def: 2, hp: 6, el: 'metal',
  text: '【失声】召唤时封印敌方 1 张随机灵将的技能 2 回合。', flavor: '锣面还在震，却发不出声音。', lore: 'Ⅱ级浊灵。锣鼓点是戏的骨头，骨头散了，戏就站不起来。', art: { motif: 'gong' } });
ZL({ id: 'ZL-016', name: '空衣戏影', short: '空衣', type: 'general', cost: 5, atk: 5, def: 3, hp: 9, el: 'fire',
  guard: true, text: '【守护】【无人穿】回合结束时，己方随机 1 张受伤灵将回复 2 点 HP。', flavor: '戏服挂在那里，无风自动。', lore: 'Ⅱ级浊灵。没有人再穿的行头，自己撑起了身段。', art: { motif: 'robeGhost' } });
ZL({ id: 'ZL-017', name: '蠹谱残影', short: '蠹谱', type: 'general', cost: 4, atk: 4, def: 3, hp: 8, el: 'wood',
  text: '【蛀蚀】命中灵将后，目标 ATK 永久 -1（最低 0）。', flavor: '工尺谱被虫蛀空，剩下的音连不成调。', lore: 'Ⅱ级浊灵。吃掉曲谱的蠹虫聚成的影子，所过之处，曲子少一句。', art: { motif: 'worm' } });
ZL({ id: 'ZL-018', name: '尘封之幕', short: '落幕', type: 'talisman', cost: 3, el: 'earth', target: 'enemyGeneral',
  text: '眩晕敌方灵将 1 回合，并使其 DEF -2，持续 2 回合。', flavor: '幕布一落，台上的人就不存在了。', lore: '浊灵扬起的积尘。', art: { motif: 'seal-curtain' } });

for (const c of LATE_CARDS) add(c);          // chapters 4–10 (src/data/cardsLate.js)
for (const c of XIYOU_CARDS) add(c);         // 西游取经五众 (src/data/cardsXiyou.js)
for (const c of SONG_CARDS) add(c);          // 两宋风雅 (src/data/cardsSong.js)
for (const c of MYTH_CARDS) add(c);          // 人间诸神 (src/data/cardsMyth.js)
for (const c of ERA_CARDS) add(c);           // 第十四至二十章 (src/data/cardsEra.js)
for (const c of FORMATIONS) add(c);          // 阵法 (src/data/cardsForm.js)
for (const c of CAST_CARDS) add(c);          // 八仙、三国、封神补全 (src/data/cardsCast.js)
add(XIYOU_WENMAI);
add(MYTH_WENMAI);
for (const c of ARTIFACTS) add({ bonds: [], quote: '', source: '本作原创（LORE_BIBLE）', ...c });   // 器物 (src/data/artifacts.js)
for (const c of RELIC_ARTIFACTS) add({ bonds: [], quote: '', source: '本作原创（LORE_BIBLE）', ...c });   // 文物器物 (src/data/cardsRelic.js)

export const CARDS = Object.fromEntries(C.map((c) => [c.id, Object.freeze(c)]));
export const PLAYER_CARD_IDS = C.filter((c) => !c.zhuo).map((c) => c.id);
export const card = (id) => {
  const c = CARDS[id];
  if (!c) throw new Error(`unknown card ${id}`);
  return c;
};
