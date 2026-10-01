// 人人皆知的神话人物。杨戬就是二郎神：灌江口的二郎显圣真君，不是两尊神，所以只做一张卡。
// 后羿跟已有的嫦娥结成「射日组」——灵药和十日是同一则故事的两头。
// 羁绊用 auto：场上两名即可 +1，不必凑齐七人。

const G = (c) => ({ type: 'general', faction: '人间诸神', bonds: ['renjian'], ...c });

export const MYTH_IDS = ['LJ-063', 'LJ-064', 'LJ-065', 'LJ-066', 'LJ-067', 'LJ-068', 'LJ-069'];

export const MYTH_CARDS = [
  G({ id: 'LJ-063', name: '杨戬·二郎神', short: '二郎神', cost: 5, atk: 7, def: 4, hp: 10, el: 'metal',
    text: '【天眼】召唤时驱散敌方攻击最高灵将的全部增益；若其没有增益，改为使其攻击 -2，持续 2 回合。',
    skill: { name: '三尖两刃', cost: 3, target: 'enemyGeneral', text: '对单体造成等同于攻击力的伤害。' },
    quote: '心高不认天家眷，性傲归神住灌江。', source: '《西游记》第六回（明·吴承恩）',
    flavor: '额上那只眼一睁，什么变化都藏不住。',
    lore: '杨戬就是二郎神。灌江口的二郎显圣真君，额生天眼，手执三尖两刃刀，牵着哮天犬。《西游记》第六回写他与孙悟空赌斗，自称「玉帝外甥」；《封神演义》里他是玉鼎真人的弟子。两个名字是同一个人。',
    art: { motif: 'myth-erlang', tint: '#C8A04A' } }),

  G({ id: 'LJ-064', name: '后羿·射日', short: '后羿', cost: 4, atk: 6, def: 2, hp: 7, el: 'fire', bonds: ['renjian', 'sheri'],
    text: '【射日】攻击火属性灵将时，额外造成 2 点固定伤害。',
    skill: { name: '落日弓', cost: 2, target: 'enemyGeneral', text: '对单体造成 5 点固定伤害。' },
    quote: '上射十日而下杀猰貐，断修蛇于洞庭，禽封豨于桑林。', source: '《淮南子·本经训》（西汉·刘安）',
    flavor: '天上有十个太阳的时候，他只留下了一个。',
    lore: '尧之时十日并出，焦禾稼、杀草木。羿上射九日，又诛凿齿、杀九婴、断修蛇。后来的故事里，他向西王母求来不死药，嫦娥窃药奔月——射日的人和奔月的人，是同一则故事的两头。',
    art: { motif: 'myth-houyi', tint: '#C03A2A' } }),

  G({ id: 'LJ-065', name: '姜子牙·封神', short: '姜子牙', cost: 5, atk: 3, def: 5, hp: 11, el: 'earth',
    guard: true,
    text: '【守护】【封神榜】召唤时，我方其他灵将攻击 +1。',
    skill: { name: '渭水', cost: 2, target: null, text: '抽 2 张牌，我方主将回复 2 点生命。' },
    quote: '太公望吕尚者，东海上人。', source: '《史记·齐太公世家》（西汉·司马迁）',
    flavor: '榜上有名的，才算被记住。',
    lore: '吕尚，姜姓，周人称太公望，辅武王伐纣。《史记》记他是东海上人。明代《封神演义》把他写成封神的人：一场大战之后，谁留下、谁散去，都写在他那本榜上。',
    art: { motif: 'myth-jiang', tint: '#8C6040' } }),

  G({ id: 'LJ-066', name: '夸父·逐日', short: '夸父', cost: 4, atk: 7, def: 2, hp: 8, el: 'fire',
    rush: true,
    text: '【逐日】召唤后立即可攻击。【道渴】每次攻击后自身受到 1 点伤害。',
    skill: { name: '弃杖', cost: 2, target: 'enemyGeneral', text: '对单体造成 4 点固定伤害，自身受到 2 点伤害。' },
    quote: '夸父与日逐走，入日。渴欲得饮，饮于河渭。河渭不足，北饮大泽。未至，道渴而死。弃其杖，化为邓林。', source: '《山海经·海外北经》',
    flavor: '他没追上太阳。他丢下的杖，长成了一片林子。',
    lore: '夸父追日，饮干河渭仍渴，死在去大泽的路上。杖化为邓林，给后来的人遮荫。追不上的那一步，比追上更常被记住。',
    art: { motif: 'myth-kuafu', tint: '#C03A2A' } }),

  G({ id: 'LJ-067', name: '精卫·填海', short: '精卫', cost: 2, atk: 2, def: 2, hp: 6, el: 'water',
    text: '【填海】每回合开始，对敌方主将造成 1 点伤害，我方主将回复 1 点生命。',
    skill: { name: '衔石', cost: 1, target: null, text: '对敌方主将造成 2 点伤害，我方主将回复 2 点生命。' },
    quote: '是炎帝之少女，名曰女娃。女娃游于东海，溺而不返，故为精卫，常衔西山之木石，以堙于东海。', source: '《山海经·北山经》',
    flavor: '一只鸟，一块石。海不会满，她也不停。',
    lore: '炎帝的小女儿女娃游于东海，溺而不返，化为精卫。文首、白喙、赤足，常衔西山木石去填海。填不满，是这则故事一直被讲下去的原因。',
    art: { motif: 'myth-jingwei', tint: '#2A4A7A' } }),

  G({ id: 'LJ-068', name: '伏羲·八卦', short: '伏羲', cost: 4, atk: 4, def: 4, hp: 9, el: 'wood',
    text: '【八卦】召唤时抽 1 张牌，并使手牌中 1 张卡本回合费用 -1。',
    skill: { name: '观象', cost: 2, target: null, text: '抽 2 张牌。我方所有灵将防御 +2，持续 2 回合。' },
    quote: '古者包牺氏之王天下也，仰则观象于天，俯则观法于地……于是始作八卦。', source: '《周易·系辞下》',
    flavor: '天上一笔，地上一笔，中间才有人站的地方。',
    lore: '包牺就是伏羲。《系辞》说他仰观天文、俯察地理，近取诸身、远取诸物，画出八卦，用来通神明、类万物。后人把他和女娲画在一起，一个执规，一个执矩。',
    art: { motif: 'myth-fuxi', tint: '#4A8C5C' } }),

  G({ id: 'LJ-069', name: '白素贞·雷峰', short: '白素贞', cost: 4, atk: 4, def: 5, hp: 10, el: 'water',
    guard: true,
    text: '【守护】【断桥】被攻击后若仍在场，回复 2 点生命。',
    skill: { name: '水漫', cost: 3, target: null, text: '敌方所有灵将攻击 -2，持续 2 回合；我方所有灵将回复 2 点生命。' },
    quote: '西湖水干，江湖不起。雷峰塔倒，白蛇出世。', source: '冯梦龙《警世通言》卷二十八《白娘子永镇雷峰塔》（明）',
    flavor: '塔压得住身子，压不住西湖上那场雨。',
    lore: '白娘子的故事至晚在明代冯梦龙《警世通言》里写定：白蛇、青鱼，法海，雷峰塔。塔倒她才出世——这则故事被记住的，是压她的那座塔，也是她不肯散的那场雨。',
    art: { motif: 'myth-baishe', tint: '#2A4A7A' } }),
];

export const MYTH_WENMAI = {
  id: 'WM-024', name: '山海经', short: '山海经', type: 'wenmai', faction: '人间诸神', bonds: ['renjian'], cost: 3, el: 'wood',
  text: '【异闻】每回合开始，若我方场上有人间诸神，抽 1 张牌。',
  up: '珍品：并使我方主将回复 1 点生命。',
  quote: '南山经之首曰鹊山。其首曰招摇之山，临于西海之上。', source: '《山海经·南山经》',
  flavor: '山一座一座记下去，海里的、山上的，才不至于没人认得。',
  lore: '《山海经》分山经和海经，记下山川、异兽和远方的神。精卫、夸父都在这本书里。它不是故事集，是一份怕被忘掉的名册。',
  art: { motif: 'myth-scroll', tint: '#4A8C5C' },
};

export const MYTH_BOND = {
  renjian: {
    name: '诸神组', title: '人间皆知', members: [...MYTH_IDS, 'WM-024'],
    text: '场上 ≥2 名诸神：这些灵将攻击/防御 +1（持续）；再有《山海经》在文脉区：诸神技能费用 -1。',
    line: '有的人开过天，有的人射过日，有的人只是一只衔石头的鸟。都被记住了，就都还在。',
    auto: { generals: MYTH_IDS, need: 2, wenmai: 'WM-024', perk: 'skill' },
  },
  sheri: {
    name: '射日组', title: '九日已落', members: ['LJ-064', 'LJ-008'],
    text: '后羿与嫦娥同时在场：两者攻击/防御 +1（持续）。',
    line: '他射下九日。她带走了那颗药。月亮上从此有人，地上只剩一个太阳。',
    auto: { generals: ['LJ-064', 'LJ-008'], need: 2 },
  },
};
