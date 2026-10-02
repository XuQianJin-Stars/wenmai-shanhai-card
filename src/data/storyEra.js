// 第十四至二十章。归藏传灯写的是「书还在」；这七章补先前跳过的年代，
// 最后一章停在还没写完的现在。关卡 id 用新前缀，不改旧章号，旧存档不用迁移。

const lv = (c) => ({ playerFirst: true, ai: 'normal', ...c });
const PAD = ['ZL-001', 'ZL-002', 'ZL-007', 'ZL-008', 'ZL-013', 'ZL-014', 'FL-002', 'FL-003', 'FL-004', 'ZL-006'];
const deck = (core) => {
  const d = [...core];
  let i = 0;
  while (d.length < 20) d.push(PAD[i++ % PAD.length]);
  return d.slice(0, 20);
};

const ch = (n, short, desc, prologue, levels) => ({ n, short, desc, prologue, levels });

export const ERA_CHAPTERS = [
  ch(14, '三国烽烟篇', '书斋的门又开了。进来的不是借书的人，是一本没排进前十三章的书。', {
    id: 'prologue14', title: '第十四章 序 · 漏掉的那些年', scene: 'study',
    lines: [
      { who: '旁白', text: '灯还亮着。女娲之灵说了再见，脚步声却不是来借书的。' },
      { who: '', text: '（门外放下三卷书。封面上的字很旧，目录里没有它们的位置。）', stage: 'glow' },
      { who: '守护者', text: '你不是走了吗？' },
      { who: '女娲之灵', text: '我回去了。书又把我叫出来。' },
      { who: '女娲之灵', text: '你走过的那十三条路，中间空着好几百年。空着的地方，浊灵最喜欢。' },
      { who: '守护者', text: '从哪一年补起？' },
      { who: '女娲之灵', text: '从一张表。有人在出兵前，把该说的话写给了一个皇帝。' },
      { who: '', text: '（镜里浮出夯土高台。台上风很大，有人跪着，把一卷表举过头顶。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'sanguo-1', title: '第一关 · 春秋还在读', scene: 'han', variant: 'ruin',
      desc: '高台残壁。断简残灵被击散时会溅伤主将。',
      enemy: { name: '残卷武影', hp: 36, portrait: 'swordsman', deck: deck(['ZL-019', 'ZL-019', 'ZL-020', 'ZL-020', 'ZL-003', 'ZL-027']) },
      reward: { fragments: 45, unlock: ['LJ-071'] },
      pre: [
        { who: '', text: '（台下散着竹简，简上反复出现两个字：「春秋」。）' },
        { who: '女娲之灵', text: '有个人打仗的时候还在背书。书比刀先被记住，后来戏里才给他配了刀。' },
        { who: '守护者', text: '那我先把书捡起来。' },
      ],
      post: [
        { who: '', text: '（简上的字稳定下来。一个红脸的身影在台边停下，没有拔刀。）', stage: 'card:LJ-071' },
        { who: '关羽之灵', text: '刀是后人画的。书是我自己读的。' },
        { who: '守护者', text: '《左传》？' },
        { who: '关羽之灵', text: '略皆上口。你既然捡起来了，就别再只记得那把刀。' },
      ] }),
    lv({ id: 'sanguo-2', title: '第二关 · 表还没送出', scene: 'han',
      desc: '出征前的夜。蚀文雾灵会永久削掉防御。',
      enemy: { name: '未送之表', hp: 40, portrait: 'scholarGhost', deck: deck(['ZL-002', 'ZL-002', 'ZL-020', 'ZL-027', 'ZL-012', 'FL-005']) },
      ai: 'hard',
      reward: { fragments: 50, unlock: ['WM-025'] },
      pre: [
        { who: '', text: '（案上摊着一篇表，墨干了，字还在。）' },
        { who: '女娲之灵', text: '这是出兵前写的。写的人知道可能回不来，所以把用人的话说在前面。' },
        { who: '守护者', text: '皇帝听了吗？' },
        { who: '女娲之灵', text: '没有听完。所以表比那场仗活得长。' },
      ],
      post: [
        { who: '', text: '（表自己卷好，落到守护者手里。）', stage: 'card:WM-025' },
        { who: '女娲之灵', text: '「亲贤臣，远小人。」这句话后来谁都背，做起来的人很少。' },
        { who: '守护者', text: '那更该留下。' },
      ] }),
    lv({ id: 'sanguo-3', title: '第三关 · 危难之间', scene: 'han', variant: 'ruin', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '北伐前夜。首领：歧路巨影——沿用「散佚」，烧手牌并永久削防御。',
      enemy: { name: '歧路巨影', hp: 44, portrait: 'husk', passive: 'sanyi', deck: deck(['ZL-005', 'ZL-022', 'ZL-020', 'ZL-027', 'ZL-030', 'FL-006', 'FL-004']) },
      reward: { fragments: 65, unlock: ['LJ-070'] },
      pre: [
        { who: '歧路巨影', text: '表送出去也没用。路会在半道断掉。' },
        { who: '守护者', text: '断了也可以有人接着走。' },
        { who: '女娲之灵', text: '他写表的时候，就是这么想的。' },
      ],
      post: [
        { who: '', text: '（风停了一停。一个葛巾的人从高台上下来，手里没有兵符，只有那卷表。）', stage: 'card:LJ-070' },
        { who: '诸葛亮之灵', text: '受任于败军之际。你既然来了，就把后面的路补上。' },
        { who: '守护者', text: '后面还有多少年？' },
        { who: '诸葛亮之灵', text: '很多。先别算胜负，先把人认全。' },
        { who: '', text: '三国烽烟篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(15, '南北朝篇', '南方在写诗，北方有人替父去了边关。两边的字都在掉。', {
    id: 'prologue15', title: '第十五章 序 · 双兔', scene: 'study',
    lines: [
      { who: '女娲之灵', text: '三国的表送出去了。下一截更乱，一个南方，一个北方，各写各的。' },
      { who: '守护者', text: '听得见吗？' },
      { who: '女娲之灵', text: '听得见一首诗，和一条河。诗里有人女扮男装去打仗，河的注比河还长。' },
      { who: '', text: '（镜中一边是军营的火，一边是峡谷里的水。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'nanbei-1', title: '第一关 · 万里赴戎', scene: 'lanting', variant: 'stream',
      desc: '边关的风把诗句吹散。残句墨魅死亡时会伤到主将。',
      enemy: { name: '戍边残句', hp: 36, portrait: 'youth', deck: deck(['ZL-007', 'ZL-007', 'ZL-007', 'ZL-009', 'ZL-011', 'ZL-002']) },
      reward: { fragments: 45, unlock: ['LJ-072'] },
      pre: [
        { who: '', text: '（风里飞着半句诗：「万里赴戎机」。下半句找不着了。）' },
        { who: '女娲之灵', text: '下半句是「关山度若飞」。有人替父亲去了，十二年没人认出她。' },
        { who: '守护者', text: '那把下半句追回来。' },
      ],
      post: [
        { who: '', text: '（两句诗合在一起。一个卸了甲的身影站在河边。）', stage: 'card:LJ-072' },
        { who: '花木兰之灵', text: '同伴吃惊的时候，我已经在织布了。' },
        { who: '守护者', text: '诗里没写你的家乡。' },
        { who: '花木兰之灵', text: '所以很多地方都说我是他们的人。这样也好。' },
      ] }),
    lv({ id: 'nanbei-2', title: '第二关 · 两岸连山', scene: 'lanting',
      desc: '峡谷。水行符和蚀文一起出现，防御会被慢慢啃掉。',
      enemy: { name: '断注水影', hp: 40, portrait: 'river', deck: deck(['ZL-002', 'ZL-023', 'ZL-024', 'FL-003', 'FL-003', 'ZL-006']) },
      ai: 'hard',
      reward: { fragments: 50, unlock: ['WM-026', 'LJ-073'] },
      pre: [
        { who: '', text: '（水很急。岸边的注一条条漂走，注的字比水声还密。）' },
        { who: '女娲之灵', text: '他给《水经》做注，注完三峡，又去注下一条。人是这样把山河留下来的。' },
      ],
      post: [
        { who: '', text: '（注不再漂。一个背着书卷的人站在岸上。）', stage: 'card:LJ-073' },
        { who: '郦道元之灵', text: '两岸连山，略无阙处。你看见的如果只是水，注就白写了。' },
        { who: '', text: '（诗卷同时落下。木兰的那首，终于有了全篇。）', stage: 'card:WM-026' },
      ] }),
    lv({ id: 'nanbei-3', title: '第三关 · 辨得清雄雌', scene: 'lanting', variant: 'stream', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '首领：迷营巨影——沿用「曲终」，压低我方攻击并给自己回血。',
      enemy: { name: '迷营巨影', hp: 44, portrait: 'dancerGhost', passive: 'nishang', deck: deck(['ZL-011', 'ZL-016', 'ZL-009', 'ZL-014', 'FL-001', 'FL-006']) },
      reward: { fragments: 65, unlock: [] },
      pre: [
        { who: '迷营巨影', text: '分不清的东西，就该忘掉。' },
        { who: '花木兰之灵', text: '双兔傍地走，本来就不必分。' },
        { who: '守护者', text: '诗都在。你分不开它们。' },
      ],
      post: [
        { who: '', text: '（军营的火和峡谷的水同时安静下来。）' },
        { who: '女娲之灵', text: '南北朝就这样。乱是乱，诗和注都没断。' },
        { who: '', text: '南北朝篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(16, '五代十国篇', '国很短。一首词，一卷夜宴，比那些国都长。', {
    id: 'prologue16', title: '第十六章 序 · 春水', scene: 'study',
    lines: [
      { who: '女娲之灵', text: '再往下，朝代短得来不及取名字。五个朝代，十个国，叠在几十年里。' },
      { who: '守护者', text: '那还剩什么？' },
      { who: '女娲之灵', text: '剩一个亡国之君的词，和一幅他派人偷看起来的宴席。' },
      { who: '', text: '（镜中是汴京的夜。灯火很密，像一场还没散的席。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'wudai-1', title: '第一关 · 一江春水', scene: 'bianjing', variant: 'night',
      desc: '夜色里的词牌空着。半阙词影会封印技能。',
      enemy: { name: '半阙词影', hp: 38, portrait: 'poet', deck: deck(['ZL-058', 'ZL-057', 'ZL-007', 'ZL-009', 'FL-003']) },
      reward: { fragments: 45, unlock: ['LJ-074'] },
      pre: [
        { who: '', text: '（河里漂着词牌。调子还在，词丢了下片。）' },
        { who: '女娲之灵', text: '「问君能有几多愁」。下句人人会背，写它的人当时已经没有国了。' },
      ],
      post: [
        { who: '', text: '（下片补上。一个穿青衣的人站在桥头，没有侍从。）', stage: 'card:LJ-074' },
        { who: '李煜之灵', text: '春水向东。我的国不在东边了。' },
        { who: '守护者', text: '词还在。' },
        { who: '李煜之灵', text: '所以我还在。这样就够了。' },
      ] }),
    lv({ id: 'wudai-2', title: '第二关 · 夜至其第', scene: 'bianjing', variant: 'bridge',
      desc: '宴席已散，画卷被撕成五段。',
      enemy: { name: '撕卷夜影', hp: 42, portrait: 'zhangzeduan', deck: deck(['ZL-057', 'ZL-058', 'ZL-014', 'ZL-016', 'FL-005']) },
      ai: 'hard',
      reward: { fragments: 50, unlock: ['LJ-075'] },
      pre: [
        { who: '女娲之灵', text: '有个画师被派去看别人的宴席。他看完，画了下来。看的理由不好，画是真的。' },
        { who: '守护者', text: '那把五段拼回去。' },
      ],
      post: [
        { who: '', text: '（五段接成一卷。画师在卷尾停下。）', stage: 'card:LJ-075' },
        { who: '顾闳中之灵', text: '我是被派去的。人要看的如果只是窥探，这卷画就白画了。' },
        { who: '守护者', text: '我看的是宴席还在。' },
      ] }),
    lv({ id: 'wudai-3', title: '第三关 · 宴还未散', scene: 'bianjing', variant: 'night', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '首领：散席巨影——沿用「合卷」之前的散佚：烧牌，削防御。',
      enemy: { name: '散席巨影', hp: 46, portrait: 'sanqie', passive: 'sanyi', deck: deck(['ZL-059', 'ZL-057', 'ZL-016', 'ZL-022', 'FL-004', 'FL-006']) },
      reward: { fragments: 65, unlock: ['WM-027'] },
      pre: [
        { who: '散席巨影', text: '席散了。人走了。画留着也是空的。' },
        { who: '李煜之灵', text: '空的东西如果还有人看，就不是空的。' },
      ],
      post: [
        { who: '', text: '（灯又亮了。夜宴图整卷展开。）', stage: 'card:WM-027' },
        { who: '女娲之灵', text: '五代很短。短过一首词的时间。可词还在唱。' },
        { who: '', text: '五代十国篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(17, '蒙元篇', '一部历要准到天。一首曲只要二十八个字。', {
    id: 'prologue17', title: '第十七章 序 · 测验', scene: 'study',
    lines: [
      { who: '女娲之灵', text: '元朝把历法重做了一遍，也把曲子写得很短。' },
      { who: '守护者', text: '短的和准的，都算文脉？' },
      { who: '女娲之灵', text: '算。一个让人知道今天是哪一天，一个让人在路上就能哼完。' },
      { who: '', text: '（镜里一边是测日的高表，一边是瘦马和枯藤。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'mengyuan-1', title: '第一关 · 历之本', scene: 'tiangong',
      desc: '观星台的仪器缺了零件。碎仪会在阵亡时伤到主将。',
      enemy: { name: '失历残影', hp: 38, portrait: 'zhangheng', deck: deck(['ZL-043', 'ZL-044', 'ZL-045', 'ZL-019', 'FL-006']) },
      reward: { fragments: 45, unlock: ['LJ-076'] },
      pre: [
        { who: '', text: '（高表还立着，影已经量不准了。）' },
        { who: '女娲之灵', text: '郭守敬说，历的根本在测验，测验先要有仪器。仪器一歪，日子就会算错。' },
      ],
      post: [
        { who: '', text: '（影又对准了刻度。一个抱着仪器的人抬起头。）', stage: 'card:LJ-076' },
        { who: '郭守敬之灵', text: '先量，再算。算完不量，历就会慢慢撒谎。' },
        { who: '守护者', text: '《授时历》用了很久。' },
        { who: '郭守敬之灵', text: '因为它肯改。不肯改的历，才是浊的。' },
      ] }),
    lv({ id: 'mengyuan-2', title: '第二关 · 二十八字', scene: 'jiangnan',
      desc: '古道上只剩半句曲。断句会在死亡时伤人。',
      enemy: { name: '断肠曲影', hp: 42, portrait: 'poet', deck: deck(['ZL-007', 'ZL-007', 'ZL-009', 'ZL-042', 'FL-002']) },
      ai: 'hard',
      reward: { fragments: 50, unlock: ['LJ-077'] },
      pre: [
        { who: '', text: '（路上飘着六个字：「古道西风瘦马」。前后都丢了。）' },
        { who: '女娲之灵', text: '全首只有二十八个字。丢六个，曲子就站不住。' },
      ],
      post: [
        { who: '', text: '（二十八个字重新排好。一个骑着瘦马的身影在桥边停下。）', stage: 'card:LJ-077' },
        { who: '马致远之灵', text: '断肠人在天涯。你把字捡齐了，人就不必再断。' },
      ] }),
    lv({ id: 'mengyuan-3', title: '第三关 · 夕阳西下', scene: 'tiangong', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '首领：失测巨影——沿用「焚书」，全体伤害并烧一张手牌。',
      enemy: { name: '失测巨影', hp: 46, portrait: 'deadKiln', passive: 'fenshu', deck: deck(['ZL-044', 'ZL-029', 'ZL-043', 'ZL-007', 'FL-004', 'FL-006']) },
      reward: { fragments: 65, unlock: ['WM-028'] },
      pre: [
        { who: '失测巨影', text: '日子可以含糊。曲子可以只剩半句。' },
        { who: '郭守敬之灵', text: '日子不能含糊。' },
        { who: '马致远之灵', text: '半句也不行。' },
      ],
      post: [
        { who: '', text: '（曲牌落下来，和历表放在一起。）', stage: 'card:WM-028' },
        { who: '女娲之灵', text: '一个准，一个短。元朝把这两样都留下了。' },
        { who: '', text: '蒙元篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(18, '晚清篇', '船和炮已经到了门口。有人去销烟，有人去修一条自己的铁路。', {
    id: 'prologue18', title: '第十八章 序 · 门口', scene: 'study',
    lines: [
      { who: '女娲之灵', text: '再往下，门被敲开了。敲的不是诗，是船。' },
      { who: '守护者', text: '文脉也在门外？' },
      { who: '女娲之灵', text: '在门口。一个人把烟销毁，一个人把铁路修过山。还有一本书，叫人先去看外面长什么样。' },
      { who: '', text: '（镜中是海岸和一条往北的铁路，同时出现。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'wanqing-1', title: '第一关 · 虎门', scene: 'quanzhou',
      desc: '海岸。焚余之影会在回合开始灼烧全场。',
      enemy: { name: '烟尘残影', hp: 40, portrait: 'ember', deck: deck(['ZL-029', 'ZL-029', 'ZL-039', 'ZL-006', 'FL-004']) },
      reward: { fragments: 50, unlock: ['LJ-078'] },
      pre: [
        { who: '', text: '（海滩上有两个池子，池里的火已经灭了，灰还在。）' },
        { who: '女娲之灵', text: '虎门。他把鸦片销毁在这里。后来他被贬去伊犁，路上写下「苟利国家生死以」。' },
      ],
      post: [
        { who: '', text: '（灰散尽。一个戴着风帽的人从池边走来。）', stage: 'card:LJ-078' },
        { who: '林则徐之灵', text: '岂因祸福避趋之。祸我已经遇过了。话还在。' },
        { who: '守护者', text: '诗是去戍所的时候写的。' },
        { who: '林则徐之灵', text: '所以才算数。赢的时候谁都会写。' },
      ] }),
    lv({ id: 'wanqing-2', title: '第二关 · 人字形', scene: 'han',
      desc: '山太陡。失传的图样会封印技能。',
      enemy: { name: '断轨残影', hp: 44, portrait: 'libing', deck: deck(['ZL-045', 'ZL-043', 'ZL-028', 'FL-005', 'ZL-020']) },
      ai: 'hard',
      reward: { fragments: 55, unlock: ['LJ-079'] },
      pre: [
        { who: '', text: '（山坡上有一段铁路，到了最陡的地方断成两截。）' },
        { who: '女娲之灵', text: '京张铁路。外国人说中国人修不过八达岭。詹天佑让火车先折一下，再往上爬。' },
      ],
      post: [
        { who: '', text: '（两截铁轨接上，在山腰折成一个「人」字。）', stage: 'card:LJ-079' },
        { who: '詹天佑之灵', text: '坡太陡，就不要硬冲。折一下，还是这条路。' },
        { who: '守护者', text: '路是自己修的。' },
        { who: '詹天佑之灵', text: '自己修的，才知道下一截该怎么接。' },
      ] }),
    lv({ id: 'wanqing-3', title: '第三关 · 师夷', scene: 'quanzhou', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '首领：闭门巨影——沿用「灭学」，压低攻击并抽牌。',
      enemy: { name: '闭门巨影', hp: 48, portrait: 'gagMist', passive: 'biantong', deck: deck(['ZL-020', 'ZL-021', 'ZL-039', 'ZL-029', 'FL-005', 'FL-006']) },
      reward: { fragments: 70, unlock: ['WM-029'] },
      pre: [
        { who: '闭门巨影', text: '门外的东西，看了就会变。别看。' },
        { who: '林则徐之灵', text: '不看，就会在门口吃亏。' },
        { who: '守护者', text: '有一本书就是为了让人看清楚才写的。' },
      ],
      post: [
        { who: '', text: '（一本很厚的书从海上漂来，封面是《海国图志》。）', stage: 'card:WM-029' },
        { who: '女娲之灵', text: '魏源说：师夷长技以制夷。先看清楚，再谈怎么应对。' },
        { who: '', text: '晚清篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(19, '民国篇', '铁屋子里还有人没睡死。戏台上，旧戏唱给新的观众。', {
    id: 'prologue19', title: '第十九章 序 · 铁屋', scene: 'study',
    lines: [
      { who: '女娲之灵', text: '晚清的门开了之后，是一段很吵的年月。' },
      { who: '守护者', text: '吵什么？' },
      { who: '女娲之灵', text: '有人说铁屋子里的人该不该被喊醒。有人把霸王和虞姬重新唱给城里的观众。' },
      { who: '', text: '（镜中一边是一间没有窗的屋子，一边是亮着灯的戏台。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'minguo-1', title: '第一关 · 铁屋', scene: 'jiangnan', variant: 'night',
      desc: '没有窗的屋子。塞口的雾会压低攻击。',
      enemy: { name: '铁屋之雾', hp: 40, portrait: 'gagMist', deck: deck(['ZL-020', 'ZL-021', 'ZL-031', 'ZL-012', 'FL-005']) },
      reward: { fragments: 50, unlock: ['LJ-080'] },
      pre: [
        { who: '', text: '（屋子没有窗。里面有人在睡觉，有人已经坐起来了。）' },
        { who: '女娲之灵', text: '鲁迅说，假如一间铁屋子万难破毁，你要不要去叫醒里面还没睡死的几个人。' },
        { who: '守护者', text: '要。' },
      ],
      post: [
        { who: '', text: '（墙上裂开一条缝。一个穿长衫的人站在缝边。）', stage: 'card:LJ-080' },
        { who: '鲁迅之灵', text: '我没有说一定破得了。我只是不肯说决没有希望。' },
        { who: '守护者', text: '这就够喊一声了。' },
        { who: '鲁迅之灵', text: '一声不够。所以我写成了一本书。' },
      ] }),
    lv({ id: 'minguo-2', title: '第二关 · 四面楚歌', scene: 'stage', variant: 'dawn',
      desc: '戏台。空衣和断弦还在找它们的戏。',
      enemy: { name: '空台楚影', hp: 44, portrait: 'robeGhost', deck: deck(['ZL-016', 'ZL-009', 'ZL-015', 'ZL-011', 'FL-003']) },
      ai: 'hard',
      reward: { fragments: 55, unlock: ['LJ-081'] },
      pre: [
        { who: '', text: '（台上没有人。霸王的盔头和虞姬的剑还搁在衣箱上。）' },
        { who: '女娲之灵', text: '这出戏的骨头在《史记》里。梅兰芳把它唱给了新的观众。谱子能留，一个转身不能。' },
      ],
      post: [
        { who: '', text: '（衣箱打开。一个旦角走上台，没有开口，先把剑式做完。）', stage: 'card:LJ-081' },
        { who: '梅兰芳之灵', text: '力拔山兮气盖世。他不肯渡江。我唱的是她为什么还把剑舞完。' },
        { who: '守护者', text: '观众记住的是你。' },
        { who: '梅兰芳之灵', text: '记住转身就好。下一个人还得有人教。' },
      ] }),
    lv({ id: 'minguo-3', title: '第三关 · 不能说决没有', scene: 'jiangnan', variant: 'night', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '首领：无窗巨影——沿用「无人」，烧牌并压低攻击。',
      enemy: { name: '无窗巨影', hp: 48, portrait: 'wuren', passive: 'wuren', deck: deck(['ZL-020', 'ZL-052', 'ZL-016', 'ZL-031', 'FL-005', 'FL-006']) },
      reward: { fragments: 70, unlock: ['WM-030'] },
      pre: [
        { who: '无窗巨影', text: '醒了也出不去。不如接着睡。' },
        { who: '鲁迅之灵', text: '几个人既然起来了，你不能说决没有毁坏这铁屋的希望。' },
        { who: '守护者', text: '我站在缝这边。' },
      ],
      post: [
        { who: '', text: '（缝扩大了一点。一本《呐喊》从缝里掉出来。）', stage: 'card:WM-030' },
        { who: '女娲之灵', text: '他不愿意把寂寞再传给做着好梦的青年。书还是印了。' },
        { who: '', text: '民国篇 · 终', stage: 'end' },
      ] }),
  ]),

  ch(20, '当代传灯篇', '前面都是已经发生的事。这一章不写完：墨还没干。', {
    id: 'prologue20', title: '第二十章 序 · 还在写', scene: 'study',
    lines: [
      { who: '旁白', text: '二十章的路走完之前，书斋里的灯还是序章那一盏。' },
      { who: '女娲之灵', text: '前面十九章，写的都是已经过去的人。' },
      { who: '守护者', text: '那这一章写谁？' },
      { who: '女娲之灵', text: '写还在抄书的人，和还在教第一个字的人。他们没有传。因为他们还没走。' },
      { who: '守护者', text: '这样也算一章？' },
      { who: '女娲之灵', text: '不写这一章，前面十九章就会变成藏起来的东西。文脉如果停在最后一盏灯上，就又断了。' },
      { who: '', text: '（镜中没有古人。一张书桌，一页未干的纸，黑板边上一个刚写完的字。）', stage: 'mirror' },
    ],
  }, [
    lv({ id: 'dangdai-1', title: '第一关 · 页码', scene: 'cangshu', variant: 'court',
      desc: '散页爬满院子。断简被击散时仍会伤到主将。',
      enemy: { name: '散页残灵', hp: 42, portrait: 'brokenSlip', deck: deck(['ZL-019', 'ZL-019', 'ZL-053', 'ZL-051', 'ZL-006']) },
      reward: { fragments: 55, unlock: ['LJ-082'] },
      pre: [
        { who: '', text: '（书页没有装订。页码对不上，句子从中间断开。）' },
        { who: '女娲之灵', text: '现在还有人在做这件事：把页码对上，把断句补进目录。他们没有名字写在封面上。' },
        { who: '守护者', text: '那我帮他们对。' },
      ],
      post: [
        { who: '', text: '（页码归位。一个袖口沾着浆糊的人抬起头。）', stage: 'card:LJ-082' },
        { who: '修书人之灵', text: '学而时习之。我不是古人。我只是还在把这一页接上。' },
        { who: '守护者', text: '接上就好。' },
        { who: '修书人之灵', text: '下一页还散着。别停。' },
      ] }),
    lv({ id: 'dangdai-2', title: '第二关 · 第一个字', scene: 'study',
      desc: '黑板是空的。塞口的雾专吃还没说完的话。',
      enemy: { name: '空板之雾', hp: 46, portrait: 'gagMist', deck: deck(['ZL-020', 'ZL-021', 'ZL-031', 'ZL-008', 'FL-002']) },
      ai: 'hard',
      reward: { fragments: 60, unlock: ['LJ-083'] },
      pre: [
        { who: '', text: '（教室里只有一块黑板。第一个字写到一半，粉笔断了。）' },
        { who: '女娲之灵', text: '《三字经》的第一句，许多人是在这种黑板上认识的。先生是谁不重要。' },
      ],
      post: [
        { who: '', text: '（粉笔被捡起来。字写完了：「人」。）', stage: 'card:LJ-083' },
        { who: '开蒙先生之灵', text: '人之初。后面的字，得他们自己认。我只负责这第一个。' },
        { who: '守护者', text: '第一个最难。' },
        { who: '开蒙先生之灵', text: '第一个如果没有，后面十九章都没人读。' },
      ] }),
    lv({ id: 'dangdai-3', title: '第三关 · 墨还未干', scene: 'cangshu', variant: 'court', ai: 'hard', playerFirst: false,
      music: 'boss',
      desc: '终战：绝笔巨影——沿用「无人」，想把还在写的那一页烧成空的。',
      enemy: { name: '绝笔巨影', hp: 52, portrait: 'wuren', passive: 'wuren', deck: deck(['ZL-052', 'ZL-054', 'ZL-020', 'ZL-039', 'ZL-059', 'FL-006', 'FL-004']) },
      reward: { fragments: 80, unlock: ['WM-031'] },
      pre: [
        { who: '绝笔巨影', text: '写到这里就可以停了。再写，也是重复。' },
        { who: '守护者', text: '墨还没干。' },
        { who: '修书人之灵', text: '页码还没对完。' },
        { who: '开蒙先生之灵', text: '第一个字还没教完。' },
        { who: '女娲之灵', text: '所以这一章不写「终」。它只写：还有人在。' },
      ],
      post: [
        { who: '', text: '（绝笔散开。桌上那一页的墨，确实还没干。）', stage: 'card:WM-031' },
        { who: '女娲之灵', text: '二十章你都走过了。神话、朝代、戏台、船、铁屋，还有今天这间还亮着灯的屋子。' },
        { who: '守护者', text: '下一章呢？' },
        { who: '女娲之灵', text: '下一章不在书里。在你出去之后，把第一个字教给下一个人的时候。' },
        { who: '', text: '（院门外又传来脚步声。这次是来上课的。）' },
        { who: '', text: '当代传灯篇 · 终　　文脉不绝，代代有人', stage: 'end' },
      ] }),
  ]),
];

export const ERA_SPEAKERS = {
  '关羽之灵': 'swordsman', '诸葛亮之灵': 'cottage', '歧路巨影': 'husk',
  '花木兰之灵': 'youth', '郦道元之灵': 'river', '迷营巨影': 'dancerGhost',
  '李煜之灵': 'poet', '顾闳中之灵': 'judge', '散席巨影': 'sanqie',
  '郭守敬之灵': 'zhangheng', '马致远之灵': 'poet', '失测巨影': 'deadKiln',
  '林则徐之灵': 'judge', '詹天佑之灵': 'giant', '闭门巨影': 'gagMist',
  '鲁迅之灵': 'judge', '梅兰芳之灵': 'dancer', '无窗巨影': 'wuren',
  '修书人之灵': 'cottage', '开蒙先生之灵': 'poet', '绝笔巨影': 'wuren',
  '残卷武影': 'swordsman', '未送之表': 'scholarGhost',
};

const pdeck = (ids) => {
  const d = [...ids];
  const pad = ['FL-001', 'FL-002', 'FL-003', 'FL-004', 'FL-006', 'LJ-007', 'LJ-008', 'LJ-006', 'LJ-009', 'WM-005'];
  let i = 0;
  while (d.length < 20) d.push(pad[i++ % pad.length]);
  return d.slice(0, 20);
};

export const ERA_PRACTICE = [
  { id: 'p-sanguo', title: '三国 · 出师', scene: 'han', variant: 'ruin', enemy: { name: '汉中书佐', hp: 36, portrait: 'sanguo-clerk', deck: pdeck(['LJ-070', 'LJ-070', 'LJ-071', 'LJ-071', 'WM-025', 'WM-025']) } },
  { id: 'p-nanbei', title: '南北朝 · 双兔', scene: 'lanting', variant: 'stream', enemy: { name: '边关诗卒', hp: 36, portrait: 'youth', deck: pdeck(['LJ-072', 'LJ-072', 'LJ-073', 'LJ-073', 'WM-026', 'WM-026']) } },
  { id: 'p-wudai', title: '五代 · 夜宴', scene: 'bianjing', variant: 'night', enemy: { name: '画院待诏', hp: 36, portrait: 'wudai-painter', deck: pdeck(['LJ-074', 'LJ-074', 'LJ-075', 'LJ-075', 'WM-027']) } },
  { id: 'p-mengyuan', title: '蒙元 · 授时', scene: 'tiangong', enemy: { name: '司天监生', hp: 36, portrait: 'zhangheng', deck: pdeck(['LJ-076', 'LJ-076', 'LJ-077', 'LJ-077', 'WM-028']) } },
  { id: 'p-wanqing', title: '晚清 · 京张', scene: 'han', enemy: { name: '铁路学生', hp: 38, portrait: 'wanqing-student', deck: pdeck(['LJ-078', 'LJ-078', 'LJ-079', 'LJ-079', 'WM-029']) } },
  { id: 'p-minguo', title: '民国 · 铁屋', scene: 'jiangnan', variant: 'night', enemy: { name: '报社编辑', hp: 38, portrait: 'minguo-editor', deck: pdeck(['LJ-080', 'LJ-080', 'LJ-081', 'LJ-081', 'WM-030']) } },
  { id: 'p-dangdai', title: '当下 · 未干的墨', scene: 'cangshu', variant: 'court', enemy: { name: '夜班馆员', hp: 40, portrait: 'cottage', deck: pdeck(['LJ-082', 'LJ-082', 'LJ-083', 'LJ-083', 'WM-031', 'WM-031']) } },
  { id: 'p-penglai', title: '蓬莱 · 八仙过海', scene: 'stage', enemy: { name: '何仙姑', hp: 36, portrait: 'LJ-086', deck: pdeck(['LJ-084', 'LJ-084', 'LJ-085', 'LJ-085', 'LJ-086', 'LJ-086', 'LJ-087', 'LJ-087', 'LJ-088', 'LJ-088', 'LJ-089', 'LJ-089']) } },
  { id: 'p-qishan', title: '岐山 · 封神台', scene: 'kunlun', variant: 'edge', enemy: { name: '闻太师', hp: 38, portrait: 'LJ-104', deck: pdeck(['LJ-099', 'LJ-099', 'LJ-100', 'LJ-100', 'LJ-101', 'LJ-101', 'LJ-104', 'LJ-104', 'LJ-106', 'LJ-106']) } },
  { id: 'p-changban', title: '长坂坡 · 当阳', scene: 'changan', variant: 'palace', enemy: { name: '赵云', hp: 38, portrait: 'LJ-091', deck: pdeck(['LJ-090', 'LJ-090', 'LJ-091', 'LJ-091', 'LJ-092', 'LJ-092', 'LJ-093', 'LJ-093']) } },
];
