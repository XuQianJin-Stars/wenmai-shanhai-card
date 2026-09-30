// 文物器物（QW-018 起）。和 artifacts.js 里那批的区别只有一条：这些东西真的存在。
//
// 轩辕剑、盘古斧是传说，这十件是可以买张票去看的实物——后母戊鼎在国博，编钟在湖北省博，
// 神树在三星堆。所以卡面上压的不是「神」印而是「物」印，图鉴里会自动带出那一栏文物说明
// （年代、出土地、现藏机构，数据在 relics.js，靠 relic 字段对上）。
//
// 设计口径承 artifacts.js，另加两条：
//   · 效果尽量从实物本身的特点里长出来，不硬安。素纱襌衣 49 克所以是闪避，银香囊是常平架
//     所以怎么转都不洒（免控），编钟一套 65 件十二律俱全所以是全场增益。
//   · 费用铺在 2–5，和神器那一档错开：神器是终局牌，文物是中局就该上手的东西。
//
// relic 字段指向 relics.js 里的条目 id；两边对不上会在测试里报出来。

export const RELIC_ARTIFACTS = [
  { id: 'QW-018', name: '青铜神树', short: '神树', type: 'artifact', faction: '上古神话', cost: 4, el: 'wood',
    relic: 'sanxingdui-tree', target: 'friendlyGeneral', gear: { atk: 1, hp: 5 },
    text: '【器物·文物】佩戴者 ATK +1、HP +5。佩戴时抽 1 张牌。每回合开始，我方所有灵将回复 1 点 HP。',
    up: '珍品：佩戴时改抽 2 张牌。',
    quote: '汤谷上有扶桑，十日所浴……九日居下枝，一日居上枝。', source: '《山海经·海外东经》',
    flavor: '树还立着，鸟就还认得回来的路。',
    lore: '三星堆二号坑出土，修复后高 3.96 米，是迄今所见最高的青铜器。三层九枝，每枝立一只鸟——《山海经》里扶桑树上「九日居下枝，一日居上枝」，说的大概就是这个形状。顶端残缺，那只本该在上枝的鸟已经找不到了。',
    art: { motif: 'relic-tree', tint: '#6E8F6B' } },

  { id: 'QW-019', name: '红山玉龙', short: '玉龙', type: 'artifact', faction: '上古神话', cost: 3, el: 'earth',
    relic: 'hongshan-dragon', target: 'friendlyGeneral', gear: { def: 2, hp: 3, guard: true },
    text: '【器物·文物】【守护】佩戴者 DEF +2、HP +3，并获得「守护」。佩戴时我方主将回复 2 点气血。',
    up: '珍品：主将改回复 4 点气血。',
    quote: '龙，鳞虫之长，能幽能明，能细能巨。', source: '《说文解字》（东汉·许慎）',
    flavor: '还没有角，也没有爪，可它已经是龙了。',
    lore: '1971 年内蒙古翁牛特旗三星他拉村出土，墨绿色岫岩玉，整体由一块玉料雕成，高 26 厘米。它没有角、没有爪、没有鳞，只是一条蜷成 C 形、吻部前突的身子。在龙成为皇权符号之前，先有一个新石器时代的人，拿石头磨了很久。',
    art: { motif: 'relic-jade-dragon', tint: '#4E6B52' } },

  { id: 'QW-020', name: '何尊', short: '何尊', type: 'artifact', faction: '先秦诸子', cost: 3, el: 'metal',
    relic: 'hezun', target: 'friendlyGeneral', gear: { atk: 2, def: 1 },
    text: '【器物·文物】佩戴者 ATK +2、DEF +1，并按我方文脉张数额外获得等量 ATK（上限 +3）。',
    up: '珍品：额外 ATK 上限提到 +5。',
    quote: '宅兹中国，自之乂民。', source: '何尊铭文（西周成王时）',
    flavor: '「中国」两个字，第一次被人刻下来。',
    lore: '1963 年陕西宝鸡贾村塬出土，内底铭文 122 字，记周成王营建成周之事。「宅兹中国」四个字里的「中国」，是这两个字目前所见最早的文字记录。当时它的意思只是「天下的中央那块地方」，还不是国名。一个词要走三千年，才成为今天的样子。',
    art: { motif: 'relic-zun', tint: '#7E8B6A' } },

  { id: 'QW-021', name: '后母戊鼎', short: '戊鼎', type: 'artifact', faction: '先秦诸子', cost: 5, el: 'earth',
    relic: 'houmuwu', target: 'friendlyGeneral', gear: { def: 3, hp: 6, guard: true },
    text: '【器物·文物】【守护】佩戴者 DEF +3、HP +6，并获得「守护」。佩戴时我方主将回复 4 点气血。',
    up: '珍品：主将改回复 7 点气血。',
    quote: '禹收九牧之金，铸九鼎。', source: '《史记·封禅书》（西汉·司马迁）',
    flavor: '八百多公斤，抬它的人比铸它的人还多。',
    lore: '1939 年河南安阳武官村出土，通高 133 厘米、重 832.84 公斤，是迄今发现最重的古代青铜器。铸这么一件东西要上千公斤铜料、几百人同时操作、几十个熔炉同时浇注——它说明的不只是工艺，是一个王朝能把多少人在同一时刻调到一处。',
    art: { motif: 'relic-ding', tint: '#6b7a5e' } },

  { id: 'QW-022', name: '曾侯乙编钟', short: '编钟', type: 'artifact', faction: '楚辞风骚', cost: 5, el: 'metal',
    relic: 'zenghouyi-bells', target: 'friendlyGeneral', gear: { atk: 2, def: 2 },
    text: '【器物·文物】佩戴者 ATK +2、DEF +2。佩戴时我方所有灵将永久 ATK +1。',
    up: '珍品：我方所有灵将改为永久 ATK +1、DEF +1。',
    quote: '钟鼓既设，一朝飨之。', source: '《诗经·小雅·彤弓》',
    flavor: '一套编钟响起来，站着的人就都站成了一排。',
    lore: '1978 年湖北随州擂鼓墩曾侯乙墓出土，65 件钟分三层八组，总重 4.5 吨。每件钟正鼓、侧鼓能各发一音，十二律俱全，可以旋宫转调——两千四百年前的中国人，已经把音律算清楚到能造一件不会跑调的乐器。它至今还能演奏。',
    art: { motif: 'relic-bells', tint: '#8f7a42' } },

  { id: 'QW-023', name: '越王勾践剑', short: '勾践剑', type: 'artifact', faction: '先秦诸子', cost: 4, el: 'metal',
    relic: 'goujian-sword', target: 'friendlyGeneral', gear: { atk: 4, def: 1 },
    text: '【器物·文物】佩戴者 ATK +4、DEF +1。佩戴时解除其身上的负面状态，并对敌方 ATK 最高的灵将造成 3 点固定伤害。此后每回合开始再解除一次。',
    up: '珍品：改为造成 5 点固定伤害。',
    quote: '越王鸠浅自作用剑。', source: '越王勾践剑铭文（春秋晚期）',
    flavor: '埋了两千年，出土那天还能划破纸。',
    lore: '1965 年湖北江陵望山一号楚墓出土，通长 55.7 厘米。出土时剑身几乎不见锈蚀，寒光逼人，剑格两面嵌蓝色琉璃与绿松石。铭文「鸠浅」即勾践。一把越国的剑埋在楚国的墓里，本身就是那几百年里国与国之间怎么打、怎么嫁、怎么灭的一条线索。',
    art: { motif: 'relic-sword', tint: '#7a8f94' } },

  { id: 'QW-024', name: '铜奔马', short: '奔马', type: 'artifact', faction: '秦汉气象', cost: 3, el: 'fire',
    relic: 'tongbenma', target: 'friendlyGeneral', gear: { atk: 2, hp: 2 },
    text: '【器物·文物】佩戴者 ATK +2、HP +2，并立刻解除「召唤失眠」（本回合即可攻击）。',
    up: '珍品：佩戴者本回合再获得 1 次攻击机会。',
    quote: '天马徕，从西极，涉流沙，九夷服。', source: '《汉书·礼乐志·天马歌》',
    flavor: '三足腾空，一足踏燕——它比鸟还快。',
    lore: '1969 年甘肃武威雷台汉墓出土，高 34.5 厘米。马三足腾空，右后蹄踏在一只飞鸟背上，全部重量压在这一个点上而不倒。它不是靠支架站住的，是靠算准了重心。汉代人想说的大概是：这匹马已经跑过了鸟。',
    art: { motif: 'relic-horse', tint: '#8a6a44' } },

  { id: 'QW-025', name: '长信宫灯', short: '宫灯', type: 'artifact', faction: '秦汉气象', cost: 3, el: 'fire',
    relic: 'changxin-lamp', target: 'friendlyGeneral', gear: { def: 2, hp: 4 },
    text: '【器物·文物】佩戴者 DEF +2、HP +4。每回合开始，佩戴者回复 2 点 HP，并解除其身上的全部负面状态。',
    up: '珍品：改为回复 3 点 HP。',
    quote: '长信尚浴，容一斗少半，重六斤。', source: '长信宫灯铭文（西汉）',
    flavor: '烟顺着袖子走，进了身体里，屋子还是干净的。',
    lore: '1968 年河北满城中山靖王刘胜妻窦绾墓出土，高 48 厘米。宫女跪坐执灯，右臂高举成为灯罩与烟道，燃烧的烟尘顺着中空的手臂沉入体腔积水之中，屋里不留烟。两千年前有人认真想过：怎么点灯才不呛着人。',
    art: { motif: 'relic-lamp', tint: '#b8893c' } },

  { id: 'QW-026', name: '素纱襌衣', short: '襌衣', type: 'artifact', faction: '秦汉气象', cost: 2, el: 'wood',
    relic: 'suoshachanyi', target: 'friendlyGeneral', gear: { atk: 1, hp: 2 },
    text: '【器物·文物】佩戴者 ATK +1、HP +2，并获得「潜行」（免疫 1 次攻击）。',
    up: '珍品：额外解除佩戴者身上的全部负面状态。',
    quote: '轻纱薄如空，举之若无物。', source: '《西京杂记》（旧题西汉·刘歆）',
    flavor: '整件衣服四十九克，叠起来能塞进火柴盒。',
    lore: '1972 年湖南长沙马王堆一号汉墓出土，衣长 128 厘米、通袖长 190 厘米，重仅 49 克。现代人多次复制都做不到这个重量，问题出在蚕——汉代的三眠蚕吐的丝比今天的四眠蚕细得多。技艺可以复原，蚕不行。',
    art: { motif: 'relic-silk', tint: '#c9bfa6' } },

  { id: 'QW-027', name: '银香囊', short: '香囊', type: 'artifact', faction: '大唐气象', cost: 2, el: 'metal',
    relic: 'hejiacun', target: 'friendlyGeneral', gear: { atk: 1, def: 1 },
    text: '【器物·文物】佩戴者 ATK +1、DEF +1。佩戴时解除其身上的全部负面状态；此后佩戴者每次受击都再解除一次。',
    up: '珍品：佩戴者额外 HP +3。',
    quote: '肌肤已坏，而香囊仍在。', source: '《旧唐书·杨贵妃传》',
    flavor: '怎么转都不洒——里头那个小碗永远朝上。',
    lore: '1970 年西安何家村窖藏出土，直径 4.6 厘米。外层银球镂空成葡萄花鸟纹，内部两层同心圆环与一只焚香小碗用轴相连，无论球体怎么滚动，小碗始终保持水平。这套结构现在叫常平架，用在航海罗盘和陀螺仪上，唐朝人把它做成了挂在身上的香囊。',
    art: { motif: 'relic-censer', tint: '#a8a89c' } },
];
