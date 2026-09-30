// 器物（QW）。第四类卡：打出时挂到我方一名灵将身上，给它加属性、有时再加一条钩子。
// 灵将阵亡、或者换上新器物时，旧器物进弃牌堆——所以这是「押注在某张牌上」，而不是白给的增益。
//
// 设计口径：
//   · 费用 2–5，属性收益比同费灵将低一档，换来的是不占场上格位、不怕召唤失眠。
//   · 带钩子的器物钩子挂在佩戴者身上（引擎里 runFx 会连器物一起跑），所以文案一律写「佩戴者」。
//   · gear.hp 是佩戴那一刻加到灵将身上的，卸下会还回去，因此不随品阶变化（见 cards.js 的 GEAR_GRADE）。
//   · 效果实现在 src/rules/cardfx.js 里，按器物 id 挂钩子。
//
// 专属（gear.only）：有些东西认主。定海神针只有孙悟空抡得动，混天绫是哪吒生下来就带着的，
// 药鼎得是尝过百草的人才用得明白。专属的那几件属性给得比同费狠一档——代价是那名灵将不在场
// 就打不出来，是一笔明账。名单可以写多个人（紫毫笔给执笔的，九节杖给远行的）。
//
// 上古十大神器（民间流传的那份名单）在这里凑齐了，是全套最贵、最靠后的一档：
//   东皇钟 · 轩辕剑 · 盘古斧 · 炼妖壶 · 昊天塔 · 崆峒印 · 昆仑镜 · 女娲石 · 神农鼎 · 伏羲琴
// 十件都带 divine: true，卡面上压一枚「神器」小印；其中三件认主（盘古斧归盘古、女娲石归女娲、
// 神农鼎归尝过百草的人），别的七件谁都拿得动，但费用压在 3–6，不是前期能随手甩的牌。

export const ARTIFACTS = [
  { id: 'QW-001', divine: true, name: '轩辕剑', short: '轩辕剑', type: 'artifact', faction: '上古神话', cost: 4, el: 'metal',
    target: 'friendlyGeneral', gear: { atk: 3 },
    text: '【器物】佩戴者 ATK +3。佩戴时对敌方 ATK 最高的灵将造成 2 点固定伤害。',
    up: '珍品：ATK 加成 +1。',
    quote: '黄帝采首山之铜，铸鼎于荆山之下。', source: '《史记·封禅书》（西汉·司马迁）',
    flavor: '剑不认人，只认这一下该不该落。',
    lore: '轩辕剑相传为黄帝所铸，采首山之铜，天下神兵之祖。涿鹿之战，黄帝执此剑败蚩尤。后世凡说「帝王之剑」，说的都是它——不是因为锋利，是因为它背后站着一个刚刚把部落捏成华夏的人。',
    art: { motif: 'gear-sword', tint: '#C8A04A' } },

  { id: 'QW-002', name: '山河社稷图', short: '社稷图', type: 'artifact', faction: '封神传说', cost: 3, el: 'earth',
    target: 'friendlyGeneral', gear: { def: 2, hp: 2, guard: true },
    text: '【器物】【守护】佩戴者 DEF +2、HP +2，并获得「守护」。',
    up: '珍品：DEF 加成 +1。',
    quote: '此宝乃女娲娘娘炼石补天时所遗，内藏山河，别有洞天。', source: '《封神演义》第八十四回（明·许仲琳）',
    flavor: '图一展开，人就走进了山里，敌人找不着路。',
    lore: '《封神演义》里女娲赐给广成子的宝物，展开便是一方天地：山川草木俱全，人入其中如坠幻境。中国人把「江山」画进一张图里，图在，社稷就在——这是把国土当成一件可以随身带走的东西的想法。',
    art: { motif: 'gear-map', tint: '#8C6040' } },

  { id: 'QW-003', name: '混天绫', short: '混天绫', type: 'artifact', faction: '封神传说', cost: 2, el: 'fire',
    target: 'friendlyGeneral', gear: { atk: 2, def: 2, only: ['LJ-003'] },
    text: '【器物·哪吒专属】佩戴者 ATK/DEF +2，并获得「潜行」（免疫 1 次攻击）。',
    up: '珍品：ATK/DEF 加成各 +1。',
    quote: '哪吒将混天绫向水里一搅，江河晃动，水晶宫摇。', source: '《封神演义》第十二回（明·许仲琳）',
    flavor: '一条红绫抖开，海就翻了。',
    lore: '哪吒出生时带来的两件法宝之一，长七尺，赤色。他在九湾河里洗澡，用它一搅，东海龙宫都跟着晃。一个孩子随手玩出来的祸事，掀翻了半个神话——混天绫从来不是武器，是哪吒那股不管不顾的劲儿。',
    art: { motif: 'gear-sash', tint: '#C03A2A' } },

  { id: 'QW-004', name: '定海神针', short: '神针', type: 'artifact', faction: '西游取经', cost: 5, el: 'metal',
    target: 'friendlyGeneral', gear: { atk: 6, hp: 4, only: ['LJ-054'] },
    text: '【器物·孙悟空专属】佩戴者 ATK +6、HP +4。佩戴者攻击后若存活，ATK +1，持续 2 回合。',
    up: '珍品：ATK 加成 +1。',
    quote: '此乃大禹治水之时，定江海浅深的一个定子，是一块神铁。', source: '《西游记》第三回（明·吴承恩）',
    flavor: '它原本是拿来量水深的，后来被人抡了起来。',
    lore: '东海龙宫的定海神针铁，一万三千五百斤，大禹治水时用来定江海深浅。孙悟空一句「再小些」，它就成了如意金箍棒。一件测量工具变成了兵器——这大概是神话里最痛快的一次误用。',
    art: { motif: 'gear-pillar', tint: '#C8A04A' } },

  { id: 'QW-005', divine: true, name: '昆仑镜', short: '昆仑镜', type: 'artifact', faction: '上古神话', cost: 3, el: 'water',
    target: 'friendlyGeneral', gear: { def: 1 },
    text: '【器物】佩戴者 DEF +1。佩戴时抽 1 张牌；此后每回合开始，若手牌少于 4 张，额外抽 1 张。',
    up: '珍品：DEF 加成 +1。',
    quote: '昆仑之丘，实惟帝之下都。', source: '《山海经·西山经》',
    flavor: '照出来的不是脸，是还没想明白的那一步。',
    lore: '昆仑山上的宝镜，照人照物，也照过去未来。古人相信镜子能辨妖，因为妖照镜子会现原形——照妖镜的道理其实很朴素：看清楚了，就不怕了。',
    art: { motif: 'gear-mirror', tint: '#2A4A7A' } },

  { id: 'QW-006', divine: true, name: '神农鼎', short: '神农鼎', type: 'artifact', faction: '上古神话', cost: 4, el: 'earth',
    target: 'friendlyGeneral', gear: { def: 1, hp: 6, only: ['LJ-040'] },
    text: '【器物·李时珍专属】佩戴者 DEF +1、HP +6。每回合开始，佩戴者回复 2 点 HP，我方主将回复 2 点。',
    up: '珍品：DEF 加成 +1。',
    quote: '神农尝百草，一日而遇七十毒。', source: '《淮南子·修务训》（西汉·刘安）',
    flavor: '鼎里熬的是药，也是一个人试出来的命。',
    lore: '神农氏遍尝百草，以身试毒，日中七十毒而不死，终于分出了能吃的和能治病的。中医的起点不是理论，是一个人用自己的身体做的实验——这口鼎熬的每一味药，都是他替后人先喝过的。',
    art: { motif: 'gear-cauldron', tint: '#4A8C5C' } },

  { id: 'QW-007', name: '芭蕉扇', short: '芭蕉扇', type: 'artifact', faction: '民间信仰', cost: 4, el: 'fire',
    target: 'friendlyGeneral', gear: { atk: 2 },
    text: '【器物】佩戴者 ATK +2。佩戴时对敌方所有灵将造成 1 点固定伤害，并使其 ATK -1，持续 1 回合。',
    up: '珍品：改为造成 2 点固定伤害。',
    quote: '这扇子是昆仑山后，自混沌开辟以来，天地产成的一个灵宝。', source: '《西游记》第五十九回（明·吴承恩）',
    flavor: '一扇熄火，二扇生风，三扇下雨——顺序不能错。',
    lore: '铁扇公主的芭蕉扇，能灭火焰山八百里烈焰。它本是昆仑山的灵宝，天地开辟时自然生成。有意思的是这把扇子从不用来伤人，它的全部威力都在「让一件事停下来」。',
    art: { motif: 'gear-fan', tint: '#C03A2A' } },

  { id: 'QW-008', name: '紫毫笔', short: '紫毫', type: 'artifact', faction: '唐宋风华', cost: 2, el: 'wood',
    target: 'friendlyGeneral', gear: { atk: 2, only: ['LJ-010', 'LJ-011', 'LJ-012', 'LJ-030'] },
    text: '【器物·执笔者专属】只能佩于李白、杜甫、苏轼或王羲之。佩戴者 ATK +2，攻击后抽 1 张牌（每回合 1 次）。',
    up: '珍品：抽牌时额外获得 1 点灵力。',
    quote: '紫毫笔，尖如锥兮利如刀。江南石上有老兔，吃竹饮泉生紫毫。', source: '《紫毫笔》（唐·白居易）',
    flavor: '写下去的每一笔，都会有人在很久以后读到。',
    lore: '紫毫是野兔脊背上那一小撮紫黑毫毛制的笔，一只兔子取不了几根，故极名贵。白居易写《紫毫笔》却不是夸它，是提醒执笔的人：这么贵的笔，该拿来写值得写的话。',
    art: { motif: 'gear-brush', tint: '#4A8C5C' } },

  { id: 'QW-009', name: '青铜纵目', short: '纵目', type: 'artifact', faction: '上古神话', cost: 3, el: 'metal',
    target: 'friendlyGeneral', gear: { def: 3 },
    text: '【器物】佩戴者 DEF +3。佩戴时净化其所有负面状态，并免疫 2 回合。',
    up: '珍品：免疫延长至 3 回合。',
    quote: '有蜀侯蚕丛，其目纵，始称王。', source: '《华阳国志·蜀志》（东晋·常璩）',
    flavor: '眼睛突出来那么长，是为了看见比人更远的东西。',
    lore: '三星堆出土的青铜纵目面具，眼球呈柱状外凸十六厘米，耳朵张开如翼。《华阳国志》说古蜀王蚕丛「其目纵」，两相印证。三千年前有人这样铸神的样子——他们想象中的神，最重要的器官是眼睛。',
    art: { motif: 'gear-mask', tint: '#C8A04A' } },

  { id: 'QW-010', name: '九节杖', short: '九节杖', type: 'artifact', faction: '道法通用', cost: 3, el: 'wood',
    target: 'friendlyGeneral', gear: { atk: 1, hp: 5, only: ['LJ-034', 'LJ-041'] },
    text: '【器物·远行者专属】只能佩于玄奘或徐霞客。佩戴者 ATK +1、HP +5。每回合开始，我方所有灵将回复 1 点 HP。',
    up: '珍品：改为回复 2 点。',
    quote: '入山宜持九节杖，辟除虎狼山精。', source: '《抱朴子·登涉》（东晋·葛洪）',
    flavor: '拄着它进山，山就肯让路。',
    lore: '葛洪说进山要带九节杖，可以辟虎狼山精。竹节九段，取「九」之极数。道士入山采药，前路凶险，这根杖一半是法器，一半是实实在在的拐棍——中国的方术总是这样，玄的东西底下压着很具体的用处。',
    art: { motif: 'gear-staff', tint: '#4A8C5C' } },

  // ── 上古十大神器里余下的七件（轩辕剑 QW-001、昆仑镜 QW-005、神农鼎 QW-006 在上面） ──

  { id: 'QW-011', divine: true, name: '东皇钟', short: '东皇钟', type: 'artifact', faction: '楚辞风骚', cost: 6, el: 'metal',
    target: 'friendlyGeneral', gear: { atk: 2, def: 3, hp: 3 },
    text: '【器物·神器】佩戴者 ATK +2、DEF +3、HP +3。佩戴时钟声一响，敌方所有灵将眩晕 1 回合。',
    up: '珍品：ATK/DEF 加成各 +1。',
    quote: '吉日兮辰良，穆将愉兮上皇。抚长剑兮玉珥，璆锵鸣兮琳琅。', source: '《九歌·东皇太一》（战国·屈原）',
    flavor: '钟一响，天地间所有声音都得先停下来让它。',
    lore: '东皇太一是楚人心中至高的天神，《九歌》开篇便是祭他。后世把十大神器之首派给这口钟，大约是因为屈原写祭祀时那句「璆锵鸣兮琳琅」——满堂玉石相击的声音里，神来了。钟声不伤人，它只是让一切暂时静止。',
    art: { motif: 'gear-bell', tint: '#C8A04A' } },

  { id: 'QW-012', divine: true, name: '盘古斧', short: '盘古斧', type: 'artifact', faction: '上古神话', cost: 5, el: 'earth',
    target: 'friendlyGeneral', gear: { atk: 7, def: 2, only: ['LJ-001'] },
    text: '【器物·神器·盘古专属】佩戴者 ATK +7、DEF +2。佩戴时对敌方所有灵将造成 3 点固定伤害。',
    up: '珍品：ATK 加成 +1。',
    quote: '天地混沌如鸡子，盘古生其中，万八千岁。天地开辟，阳清为天，阴浊为地。', source: '《三五历纪》（三国吴·徐整）',
    flavor: '这一斧下去，才有了上和下。',
    lore: '中国创世神话里唯一的一件工具。混沌本无内外，盘古在里头抡了一斧，轻的浮成天，重的沉成地。有意思的是神话没说这斧头哪儿来的——它和天地同时出现，仿佛「劈开」这个动作本身就该配一把斧。',
    art: { motif: 'gear-axe', tint: '#8C6040' } },

  { id: 'QW-013', divine: true, name: '炼妖壶', short: '炼妖壶', type: 'artifact', faction: '道法通用', cost: 5, el: 'fire',
    target: 'friendlyGeneral', gear: { atk: 3, hp: 2 },
    text: '【器物·神器】佩戴者 ATK +3、HP +2。佩戴时对敌方 ATK 最低的灵将造成 6 点固定伤害；若其阵亡，佩戴者永久 ATK +2。',
    up: '珍品：改为造成 8 点固定伤害。',
    quote: '壶中日月长，洞里乾坤大。', source: '《后汉书·方术传》所记壶公事，后世化为俗谚',
    flavor: '收进去的东西，出来时就不是原来那个了。',
    lore: '壶公悬壶于市，夜里跳进壶中，里头是另一重天地。道教把这个意象一路演到「炼妖壶」——收妖不是杀妖，是把它关进一个小世界里慢慢熬。中国人的收纳想象总带着这种温和的残忍。',
    art: { motif: 'gear-gourd', tint: '#C03A2A' } },

  { id: 'QW-014', divine: true, name: '昊天塔', short: '昊天塔', type: 'artifact', faction: '封神传说', cost: 4, el: 'earth',
    target: 'friendlyGeneral', gear: { def: 4, hp: 4, guard: true },
    text: '【器物·神器】【守护】佩戴者 DEF +4、HP +4，并获得「守护」。佩戴时我方主将回复 3 点 HP。',
    up: '珍品：DEF 加成 +1。',
    quote: '燃灯将玲珑宝塔祭起，把哪吒装在塔中。', source: '《封神演义》第十四回（明·许仲琳）',
    flavor: '塔镇的不是妖，是一段没法和解的父子。',
    lore: '玲珑宝塔本是燃灯道人给李靖的，用来镇住要弑父的哪吒。它是十件神器里唯一一件不为杀伐而生的——它的全部用处就是「拦住」。中国神话最沉重的镇物，往往镇的都是自家人。',
    art: { motif: 'gear-pagoda', tint: '#8C6040' } },

  { id: 'QW-015', divine: true, name: '崆峒印', short: '崆峒印', type: 'artifact', faction: '道法通用', cost: 4, el: 'metal',
    target: 'friendlyGeneral', gear: { atk: 2, def: 2 },
    text: '【器物·神器】佩戴者 ATK/DEF +2。佩戴时封印敌方 ATK 最高的灵将：眩晕 1 回合，且 DEF -2，持续 2 回合。',
    up: '珍品：改为眩晕 2 回合。',
    quote: '黄帝立为天子十九年，令行天下，闻广成子在于崆峒之上，故往见之。', source: '《庄子·在宥》（战国·庄周）',
    flavor: '盖下去的那一下，是替天说话。',
    lore: '崆峒山是广成子修道处，黄帝两次登门问道。印在中国从来不是装饰，是权力落到实物上的样子：一枚印按下去，事情就算数了。把「印」列进神器，等于承认最厉害的法术是让人不得不认。',
    art: { motif: 'gear-seal', tint: '#C8A04A' } },

  { id: 'QW-016', divine: true, name: '女娲石', short: '女娲石', type: 'artifact', faction: '上古神话', cost: 3, el: 'fire',
    target: 'friendlyGeneral', gear: { def: 2, hp: 6, only: ['LJ-002'] },
    text: '【器物·神器·女娲专属】佩戴者 DEF +2、HP +6，佩戴时净化我方全体负面状态。每回合开始，我方主将回复 2 点 HP。',
    up: '珍品：改为回复 3 点。',
    quote: '往古之时，四极废，九州裂……于是女娲炼五色石以补苍天。', source: '《淮南子·览冥训》（西汉·刘安）',
    flavor: '补天剩下的那一块，后来落进了《红楼梦》。',
    lore: '女娲炼五色石补天，三万六千五百零一块，用剩一块弃在青埂峰下——曹雪芹就是从这块废石头写起的。一件神器最动人的地方在于它有剩余：补完天之后，还剩一块没用上的石头，于是有了《石头记》。',
    art: { motif: 'gear-stone', tint: '#C03A2A' } },

  { id: 'QW-017', divine: true, name: '伏羲琴', short: '伏羲琴', type: 'artifact', faction: '上古神话', cost: 3, el: 'wood',
    target: 'friendlyGeneral', gear: { atk: 1, def: 1, hp: 2 },
    text: '【器物·神器】佩戴者 ATK/DEF +1、HP +2。佩戴时抽 2 张牌；此后佩戴者攻击后获得 1 点灵力（每回合 1 次）。',
    up: '珍品：改为抽 3 张牌。',
    quote: '伏羲作琴，神农作瑟。', source: '《世本·作篇》（战国佚名，汉人辑录）',
    flavor: '弦是照着日月星辰的数目定的，所以弹起来像在说话。',
    lore: '伏羲画八卦、结网罟、作琴瑟。琴长三尺六寸五分，象周天之数；五弦象五行，文王武王各加一弦成七。中国人把琴造成一件小小的宇宙模型，弹琴因此不只是发声，是把自己调到跟天地一个调上。',
    art: { motif: 'gear-qin', tint: '#4A8C5C' } },

  // ── 浊灵器物：给新玩法里的对手用，暂不进故事关的既有牌组（免得动到已经调平的曲线） ──
  { id: 'ZL-055', name: '蚀骨枷', short: '骨枷', type: 'artifact', faction: '遗忘', zhuo: true, cost: 3, el: 'water',
    target: 'friendlyGeneral', gear: { atk: 2 },
    text: '【器物】佩戴者 ATK +2。佩戴时使敌方 ATK 最高的灵将 ATK -2，持续 2 回合。',
    flavor: '枷是给活人戴的，戴久了，就分不清谁锁着谁。',
    lore: '浊灵从被销毁的刑具残影里凝出来的东西。它记得每一个被锁住的名字，却一个也说不出。',
    art: { motif: 'gear-shackle', tint: '#2A4A7A' } },

  { id: 'ZL-056', name: '无名碑', short: '无名碑', type: 'artifact', faction: '遗忘', zhuo: true, cost: 3, el: 'earth',
    target: 'friendlyGeneral', gear: { def: 2, hp: 3, guard: true },
    text: '【器物】【守护】佩戴者 DEF +2、HP +3，并获得「守护」。',
    flavor: '碑还立着，字已经没了。',
    lore: '字迹被风沙磨平的墓碑。没人知道底下埋的是谁，于是它就成了所有被忘掉的人共用的一块碑。',
    art: { motif: 'gear-stele', tint: '#8C6040' } },
];
