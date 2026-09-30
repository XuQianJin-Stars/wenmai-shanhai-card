# 《文脉·山海卡》风险登记册 RISK_LOG

> 版本：v3.1 | 更新：2026-04-30 | 负责人：producer
> 评级说明：**概率** P1=低/P2=中/P3=高；**影响** I1=轻微/I2=中等/I3=严重；**综合风险** = 概率×影响

---

## 风险汇总

| ID | 类别 | 风险描述 | 概率 | 影响 | 综合 | 状态 | 负责人 |
|----|------|---------|------|------|------|------|--------|
| R-T01 | 技术 | UE5蓝图复杂度超出个人能力（战斗系统/AI/联机） | P3 | I3 | 🔴 高 | 开放 | engineer |
| R-T02 | 技术 | Card Games Templates 与目标功能不兼容 | P2 | I2 | 🟡 中 | 开放 | engineer |
| R-T03 | 技术 | Nanite/Lumen 在目标硬件上性能不达标（<60fps） | P2 | I3 | 🔴 高 | 开放 | tech_artist |
| R-T04 | 技术 | 数据表格设计不合理导致后期大规模重构 | P2 | I2 | 🟡 中 | 开放 | engineer |
| R-T05 | 技术 | Chaos物理引擎卡牌交互产生非预期碰撞行为 | P2 | I1 | 🟢 低 | 开放 | engineer |
| R-A01 | 美术 | 美术工作量超出预期，卡牌建模/纹理进度严重滞后 | P3 | I3 | 🔴 高 | 开放 | art_director |
| R-A02 | 美术 | AI生成基础模型质量不稳定，手动优化成本高 | P3 | I2 | 🟡 中 | 开放 | art_director |
| R-A03 | 美术 | Marketplace中式资源风格不统一，影响整体视觉 | P2 | I2 | 🟡 中 | 开放 | art_director |
| R-A04 | 美术 | Niagara水墨特效制作难度大，达不到预期效果 | P2 | I2 | 🟡 中 | 开放 | tech_artist |
| R-M01 | 动力 | 个人开发周期过长，开发者失去动力或长期停工 | P3 | I3 | 🔴 高 | 开放 | producer |
| R-M02 | 动力 | M0基础搭建遇到重重困难，挫败感导致项目搁置 | P2 | I3 | 🔴 高 | 开放 | producer |
| R-M03 | 动力 | 功能蔓延（Feature Creep），不断加需求偏离MVP | P3 | I2 | 🟡 中 | 开放 | producer |
| R-B01 | 平衡性 | 三类卡牌克制关系设计不当，导致单一策略制霸 | P2 | I2 | 🟡 中 | 开放 | designer |
| R-B02 | 平衡性 | 文脉羁绊某组合过强，破坏卡牌多样性 | P3 | I2 | 🟡 中 | 开放 | designer |
| R-B03 | 平衡性 | 低阶与高阶卡牌实际差距超过5%，违背轻量化原则 | P2 | I2 | 🟡 中 | 开放 | designer |
| R-B04 | 平衡性 | AI难度分级不足，初级太弱/中级太强，影响体验 | P2 | I1 | 🟢 低 | 开放 | engineer |
| R-C01 | 内容 | 文化元素流于表面（只贴皮），缺乏内核深度 | P2 | I2 | 🟡 中 | 开放 | narrative |
| R-C02 | 内容 | 故事模式剧情文本工作量低估，进入 M2 前未完成 | P2 | I2 | 🟡 中 | 开放 | narrative |
| R-PM01 | 项目管理 | **[阻塞]** ROADMAP 无砍需触发机制，里程碑无"最小可交付版本"定义，单人精力衰减后极易拖期 | P3 | I3 | 🔴 高 | **处理中** | producer |
| R-PM02 | 技术 | ~~**[阻塞]** 文档中 UE5 版本号"5.7.4"疑似不存在，所有技术方案依赖前提可能有误~~ **[已关闭]** engineer 核实：UE5.7.4 为 2026-03-10 官方正式 Hotfix，版本号完全正确，无风险 | P1 | I1 | ✅ 关闭 | **已核实-无风险-关闭** | engineer |
| R-PL01 | 平衡性 | **[阻塞]** 先手补偿（首回合不抽牌）远不足以平衡先手场面优势，存在系统性先手优势 | P3 | I2 | 🟡 中 | **处理中** | designer |
| R-PL02 | 平衡性 | **[阻塞]** 卡牌 ATK/DEF 数值范围未定义，无法验证 1.44× 克制叠加是否造成 one-shot | P3 | I3 | 🔴 高 | **处理中** | designer |
| R-PL03 | 平衡性 | **[阻塞]** 五行结界（全场DEF+3+额外伤害）20张牌库中凑齐5张五行符不难，疑似必胜 combo | P3 | I3 | 🔴 高 | **处理中** | designer |
| R-UX01 | 体验 | **[新]** 三类卡牌结算逻辑各异（灵将上场/符箓立即结算/文脉持续），零基础玩家5分钟内能否理解存疑，无教程系统开发成本极高 | P3 | I2 | 🟡 中 | **缓解中**（audio 跨感官方案已作为有效缓解标注进 Review #3，见 AUDIO_STYLE.md） | designer |
| R-D01 | 设计 | **[新]** 新手引导成本：三类卡牌结算逻辑不同，克制关系为数值感知，新手5分钟内可能无法直觉理解，引导系统开发额外增加成本 | P3 | I2 | 🟡 中 | 处理中 | designer + art_director |
| R-N01 | 文化可信度 | ~~**[阻塞]** 吕洞宾卡诗句作者标注错误—"三醉岳阳人不识"系吕岩（吕洞宾）本人作品~~ **[已关闭]** narrative 修复 N-BLK-001：引诗来源改为吕岩《绝句》《全唐诗》，CITATION_CHECKLIST 记录 | P1 | I1 | ✅ 关闭 | **已修复-关闭** | narrative |
| R-N02 | 文化可信度 | ~~**[阻塞]** 嫦娥卡将高诱注《淮南子》的概括语标为"典籍原文"，引用规范错误~~ **[已关闭]** narrative 修复 N-BLK-002：高诱注已移出原文区，改为单独注标，CITATION_CHECKLIST v1.0 建立引用规范 | P1 | I1 | ✅ 关闭 | **已修复-关闭** | narrative |
| R-N03 | 内容一致性 | ~~**[跨文档冲突]** 女娲五行属性在 LORE_BIBLE（土属性）与 CARD_LIST（火属性）之间矛盾~~ **[已关闭]** producer 拍板统一为火，LORE_BIBLE + nvwa.md 已对齐 CARD_LIST | P1 | I1 | ✅ 关闭 | **已拍板-对齐完成** | narrative + designer |
| D-BLK-001 | 平衡性 | **[已解决]** 雷击符直伤机制破坏守场博弈 — CORE_LOOP_v2 已修复为「空场直伤」：仅当对方场上无灵将时，雷击符才可对主将直接造成伤害 | P1 | I1 | ✅ 关闭 | **已修复-CORE_LOOP_v2-关闭** | designer |
| D-BLK-002 | 平衡性 | **[已解决]** 双克制体系叠加导致 ATK×1.44 倍率失控 — CORE_LOOP_v2 已取消灵将类型克制，统一为五行克制单一维度，最大倍率回归 1.2× | P1 | I1 | ✅ 关闭 | **已修复-CORE_LOOP_v2-关闭** | designer |
| D-HIGH-001 | 平衡性 | **[已解决]** FL-006 极品版"HP≤20%时×2=8点直击" — CARD_LIST_v0.3 已修复，条件通过复审 | P1 | I1 | ✅ 关闭 | **复审通过-关闭** | designer |
| D-HIGH-002 | 设计 | **[已解决]** WM-004 皮影剪纸谱自回收引擎 — 文脉区隔离+每回合上限1次+吕洞宾上限1次，三重封堵，条件通过复审 | P1 | I1 | ✅ 关闭 | **复审通过-关闭** | designer |
| D-HIGH-003 | 体验 | 无1费灵将卡，导致前2回合无有效决策空间，新手体验空转 — producer 已拍板：新增2张1-2费小灵将（山海经小型神兽），纳入 M1 Sprint 1-1 CARD_LIST v2 | P3 | I2 | 🟡 中 | **已决策-纳入M1** | designer |
| D-MED-001 | 平衡性 | 镇煞组+女娲五彩石防御效果无叠加上限，全组齐时理论无敌 | P2 | I2 | 🟡 中 | **处理中** | designer |
| D-MED-002 | 平衡性 | 哪吒单回合攻击次数无上限规定，封神组完整后存在无限连击风险 | P2 | I2 | 🟡 中 | **处理中** | designer |
| D-MED-003 | 平衡性 | **[Critic建议]** 先手补偿建议改为「先手第1回合+1灵力」替代「首回合不抽牌」，现有方案先手实际劣势仍存 | P2 | I2 | 🟡 中 | **处理中** | designer |
| D-PL-001 | 平衡性 | **[已拍板]** 五行结界新效果（每回合对方主将受2点固定伤害）— critic 复审裁定：触发最低需7灵力（回合7），纯防御型，每局仅触发1次，机会成本对等，不破坏博弈平衡。producer 拍板通过，写入 RESONANCE.md 正式版 | P1 | I1 | ✅ 关闭 | **已拍板-通过-关闭** | designer |
| N-HIGH-001 | 内容一致性 | ~~**[跨团队阻塞]** 女娲 CARD_FLAVOR/nvwa.md 标注"土行"，与 CARD_LIST_v1.md"火"属性直接矛盾~~ **[已关闭]** narrative 已建立 CARD_FLAVOR/nvwa.md，标注「火行（炼石·补天·造化之力）」，含完整典籍引用，LORE_BIBLE 女娲五行表已对齐 | P1 | I1 | ✅ 关闭 | **DECISION-001对齐完成-关闭** | narrative |
| AUD-HIGH-002 | 技术/音频 | **[跨团队-工程隐性任务]** BGM 分层 Stems 的 MetaSound 实现路径未列入 M3 里程碑任务明细，存在 M3 冲刺期临时补任务导致进度风险；需 engineer 在 M3_combat.md 中补充 MetaSound 音频分层触发任务项 | P3 | I2 | 🔴 高 | **处理中-等待engineer补录** | engineer |
| S-MED-001 | 平衡性 | **[Critic Review #3]** 创世组羁绊（Bond_Creation：盘古+女娲）2张卡触发、全场持续ATK+2/DEF+1，门槛过低，形成必带羁绊 | P3 | I2 | 🟡 中 | **处理中-等待designer修订** | designer |
| S-MED-003 | 平衡性 | **[Critic Review #3]** 五行结界 DEF+3 持续2回合，在15-20张小卡池下5种属性各1张即可触发，门槛过低疑似必胜 | P3 | I3 | 🔴 高 | **处理中-等待designer修订** | designer |
| S-CROSS-001 | 平衡性 | **[已决策]** Bond_Creation + WuXing Resonance 双触发同回合：producer 拍板允许作为「游戏高光时刻」保留，但加上限规则：同回合双触发时 ATK 加成取较高值（不叠加），DEF 加成正常叠加但单回合上限+3。designer 写入 BOND_SYSTEM v0.2 | P2 | I2 | 🟡 中 | **已决策-等待designer写入BOND_SYSTEM v0.2** | designer |
| R-D-COMBO01 | 平衡性 | **[已解决]** Combo Alpha：钟馗激活镇煞组 + FL-006极品 — 与 D-HIGH-001 联动，FL-006 修复后 Combo Alpha 同步解除 | P1 | I1 | ✅ 关闭 | **FL-006修复后联动关闭** | designer |
| R-D-DEF01 | 平衡性 | **[高优先级]** 镇煞组每回合减伤1 + 女娲五彩石减伤2可叠加，部分主将实质免伤，需明确「同类防御效果取高值不叠加」规则 | P3 | I2 | 🟡 中 | **处理中** | designer |
| R-ENG-BLK-001 | 技术 | **[阻塞-M4开工前须关闭]** ARCHITECTURE.md 中 BP_WuXingBarrier 效果描述仍为旧版（DEF+3/2回合），需同步至 RESONANCE.md v0.2 修订版（护盾一次性+DEF+1/1回合） | P3 | I2 | 🟡 中 | **处理中-等待engineer同步** | engineer |
| R-ENG-BLK-002 | 技术 | **[阻塞-M4开工前须关闭]** DT_Resonance 结构仅支持五行结界单一类型，无法扩展5种单行共鸣+2种特殊共鸣，须在M4开工前重新设计结构 | P3 | I3 | 🔴 高 | **处理中-须M4前重构** | engineer |
| R-ENG-HIGH-002 | 技术 | **[存档风险]** M5 存档槽命名含版本号，无迁移方案，建议统一改为固定槽名+内部版本字段 | P2 | I2 | 🟡 中 | **处理中** | engineer |
| ART-LOW-001 | 美术 | CARD_ART_SPEC.md 缺少文脉卡边框色（#8C6040）与赭石矿物色（#7B3F00）使用分工说明，v1.3 跟进 | P1 | I1 | 🟢 低 | **v1.3待补充** | art_director |
| SFX-SEQ-001 | 技术/音频 | **[M2集成测试必验项]** 五行克制浮字（T+50ms）与HP扣减动画帧顺序需确认，时序错误会导致视听不同步，需 engineer+audio 在 M2 集成测试中验证 | P2 | I2 | 🟡 中 | **M2集成测试前确认** | engineer + audio |
| STINGER-IF-001 | 技术/音频 | **[M2前必确认]** Bond/Resonance Stinger 触发时的 BGM 强度同步接口 `TemporaryIntensityBoost(delta, duration)` 签名尚未与 engineer 确认；Stinger 独立 AudioComponent 播放不受阻塞，但 BGM 强度同步效果依赖此接口，M2前若未确认将导致 Bond/Resonance 音效高光时刻视听体验不完整 | P2 | I2 | 🟡 中 | **等待engineer确认** | audio + engineer |
| E-MED-001 | 技术 | **[Critic Review #4]** Card Games Template 接入改造范围未评估，若改造超60%不如从空项目开始；需PoC 0后出Template Fitness评估报告 | P2 | I2 | 🟡 中 | **PoC 0后跟进** | engineer |
| E-MED-002 | 技术 | **[Critic Review #4 HIGH]** EffectStack 效果叠加优先级未定义（Bond增益+符箓技能+属性克制同时结算），工程实现前需确定优先级规范 | P3 | I2 | 🟡 中 | **M1前处理** | engineer |
| E-MED-003 | 技术 | **[Critic Review #4]** DT_Cards 缺少 WenMai 区持续增益专属字段（SkillID无法区分瞬发vs常驻），需新增 WenMaiZoneEffect 字段或 EffectCategory 枚举 | P2 | I2 | 🟡 中 | **M1前处理** | engineer + designer |
| AU-MED-001 | 版权/音频 | ~~**[Critic 音频预审 HIGH]** AI生成音频版权边界模糊~~ **[已关闭]** LICENSES.md v1.1 已建立：Suno/Udio/ElevenLabs逐工具细化，三阶段合规Checklist，RIAA风险记录及替换预案，critic 复审通过 | P1 | I1 | ✅ 关闭 | **已修复-关闭** | audio |
| RV-H-001 | 技术/设计 | ~~**[v1.1必修-工程优先]** RESONANCE_v0.2 文档错误两处：§2.1 五行克制矩阵显示×1.2（应为×1.3）；§2.3「双重克制叠加上限」整节仍保留旧版1.44×计算，与已拍板删除类型克制矛盾~~ **[已关闭]** designer v1.1 修复通过 critic 设计文档批次复审：§2.1 已更新为×1.3，§2.3 旧版双重克制节已删除 | P1 | I1 | ✅ 关闭 | **已修复-关闭** | designer |
| RV-H-002 | 文化可信度 | ~~**[v1.1必修]** BOND_SYSTEM_v0.2 镇煞组典籍出处残留错误：仍引用《补笔谈》，正确来源为《太平广记》卷290引《唐逸史》（唐·卢肇）~~ **[已关闭]** narrative v1.1 修复：BOND_SYSTEM 第213-215行已更新为《太平广记》卷290，并加注《补笔谈》有误说明，「斩邪剑」效果已同步为条件版，critic 复审通过 | P1 | I1 | ✅ 关闭 | **已修复-关闭** | narrative + designer |
| STORY-LOW-001 | 叙事/美术 | **[低优先级-非阻塞]** STORY_CHAPTER_1 第185行女娲之灵「指尖触点扩散出泥土色温暖光芒（对应'抟土造人'的土属性文脉）」，与机制属性「火行」存在视觉层面轻微歧义；建议 narrative/designer 加注说明，避免 art_director 将女娲第二关出场粒子颜色实现为土黄色而非火色 | P1 | I1 | 🟢 低 | **非阻塞-v1.2跟进** | narrative + designer |
| DOC-TRAIL-001 | 文档一致性 | **[M1第一周必修-文字级别]** CORE_LOOP_v2.md 有两处文字残留就版：±1 变更摘要[PLAY-003]行仍写「同回合3种」（应为「本局累计5种」）；±2 时序流程图注释仍写「同回合3种五行→触发」旧版。文档正文已是新版，两处为 engineer 实现的直接参考源，须在 M1 第一周内修正 | P2 | I2 | 🟡 中 | **M1第一周内修正** | designer |
| DOC-TRAIL-002 | 文档一致性 | **[M1第一周必确认]** 手牌上限数值不一致：CORE_LOOP_v2.md 写「手牌上限=7」，MEMORY 记录写　6」，两处都是 engineer 实现直接参考源，必须由 designer 拍板确认最终值并统一两处文档 | P2 | I2 | 🟡 中 | **M1第一周必确认** | designer |
| RV-H-003 | 体验 | **[v1.1阻塞]** 最低费灵将3费（铁拐李），先手回合1仅1灵力强制空过，后手回合1可打符箓但场上无目标等同空过 — v1.1必须追加至少1张2费灵将（ATK 3-4/DEF 2-3/HP 5-6） | P3 | I3 | 🔴 高 | **v1.1阻塞** | designer |
| RV-M-001 | 设计 | **[v1.1中优先级]** 升阶极品HP值矛盾：CORE_LOOP §2.3 写+4，CARD_LIST §四写+3，须统一为+3 | P2 | I2 | 🟡 中 | **v1.1必修** | designer |
| RV-M-002 | 设计 | **[v1.1文档完整性]** RESONANCE §3.2 单行共鸣冷却起点未定义，须补充说明（从「效果结束回合结束」起算） | P1 | I1 | 🟢 低 | **v1.1补充** | designer |
| RV-DOC-001 | 文档一致性 | **[复审细节]** CORE_LOOP_v2 §6 写「有灵将时AoE 2点」，CARD_LIST FL-006 写「单体5点」，两者机制完全不同，须统一为 CARD_LIST 版本（单体5点） | P2 | I2 | 🟡 中 | **v1.1修复** | designer |

---

## 风险详情

### R-T01｜蓝图复杂度超出能力
- **场景**：战斗系统（AI行为树+技能触发+回合管理）蓝图节点数量膨胀，个人难以调试
- **应对**：
  1. 优先复用 Card Games Templates 现有逻辑，最小化自写节点
  2. 拆分蓝图为小粒度 Function Library，单个函数 <50 节点
  3. 每周 Demo 验证，发现复杂度超标立即裁剪功能
- **触发阈值**：任一蓝图模块调试超过2周未解决 → 启动裁剪方案

### R-T03｜性能不达标
- **场景**：Lumen动态GI + Niagara粒子 + 多卡牌同屏 = PC中配无法60fps
- **应对**：
  1. 建立 PERF_BUDGET.md 明确各类资源预算上限（Draw Call/内存/粒子数）
  2. 早期（M1阶段）跑性能基准测试，而非留到 M3
  3. 预备降级方案：Lumen降为静态GI、粒子数减半
- **触发阈值**：M1 Demo 在中配 PC 低于 45fps

### R-A01｜美术工作量超出预期
- **场景**：20张卡牌 × 完整建模+4K纹理+动画 = 单人根本无法按时交付
- **应对**：
  1. M0 阶段锁定"低模+高精度贴图"规范，禁止范围蔓延
  2. 前10张核心卡牌4K，后10张2K，严格分级
  3. AI生成 → 手动修改占比 = 7:3（不从零建模）
  4. MVP只要求5~8张完整品质卡牌，其余占位贴图先行
- **触发阈值**：M0结束时完成卡牌不足 3 张 → 降级美术标准

### R-M01｜开发者失去动力
- **场景**：个人独立开发常见问题，项目遇阻后长期放置
- **应对**：
  1. 每个 Sprint（2周）必须产出一个可玩/可见的成果
  2. 设置"里程碑奖励"：M1完成后公开展示给圈内朋友
  3. 保持"最小可见进度"原则：每天至少完成一个小任务
  4. producer 每周生成进度日报，可视化完成比例
- **触发阈值**：连续10天无任何代码/美术提交

### R-M03｜功能蔓延
- **场景**：开发中不断加入新想法（联机、移动端、新系统），偏离MVP
- **应对**：
  1. 建立"功能冻结墙"：MVP范围锁定，所有新想法放入迭代池
  2. 任何功能新增需经过 producer 评审，确认在 MVP 范围内
  3. ROADMAP 版本控制，变更需留记录

### R-B02｜文脉羁绊某组合过强
- **场景**："神话创世组"（盘古+女娲）设计时数值过高，一套流让其他卡牌无价值
- **应对**：
  1. designer 输出羁绊效果时按"无羁绊 + 10%~20%加成"为基准
  2. critic 对每个羁绊组合进行压测，超过 20% 优势需重新设计
  3. 平衡测试周期：M1 每个 Sprint 至少一次对战数据记录

---

## 风险矩阵

```
影响 I3 │ R-T01(🔴)  R-T03(🔴)  R-M01(🔴)  R-M02(🔴)
影响 I2 │            R-T02(🟡)  R-A01(🔴)  R-A02(🟡)  R-A03(🟡)  R-A04(🟡)
        │            R-M03(🟡)  R-B01(🟡)  R-B02(🟡)  R-B03(🟡)
        │            R-C01(🟡)  R-C02(🟡)
影响 I1 │            R-T05(🟢)  R-B04(🟢)
        ├────────────────────────────────────
          概率 P1(低)  概率 P2(中)  概率 P3(高)
```

---

## 风险变更记录

| 日期 | 操作 | 风险ID | 说明 |
|------|------|--------|------|
| 2026-04-30 | 新增 | R-T01~R-C02 | v1.0 初始建立 |
| 2026-04-30 | 新增 | R-PM01~R-PL03 | v1.2 来源：critic 初审报告 INITIAL_REVIEW.md，5条阻塞级问题登记，已分发 engineer / designer 处理 |
| 2026-04-30 | 新增 | R-UX01 | v1.3 来源：critic 灵魂拷问#1，新手引导与卡牌类型可理解性风险，已转 designer |
| 2026-04-30 | 新增 | R-D01 | v1.4 来源：team-lead 指示，新手引导成本风险，designer 补 Onboarding Flow，art_director 视觉差异化三类卡，触发阈值：首测50%新手第3回合前茫然 |
| 2026-04-30 | 新增 | D-BLK-001, D-BLK-002 | v1.6 来源：critic 第二批评审，设计阻塞2项（雷击符直伤机制、双克制叠加倍率），designer 需在 v0.2 修复后 art/engineer 方可正式开工 |
| 2026-04-30 | 关闭 | R-PM02 | v1.7 engineer 核实 UE5.7.4 为 2026-03-10 官方正式 Hotfix，版本完全正确，无风险 |
| 2026-04-30 | 关闭 | D-BLK-001, D-BLK-002 | v1.8 designer CORE_LOOP_v2 已修复：雷击符改为空场直伤，取消灵将类型克制统一为五行克制，两项阻塞均解除 |
| 2026-04-30 | 更新 | R-N03 | v1.8 producer 拍板：女娲五行属性统一为火，LORE_BIBLE 需对齐 CARD_LIST |
| 2026-04-30 | 新增 | D-HIGH-001~003, D-MED-001~002, N-HIGH-001 | v1.9 来源：critic Review #1（FL-006必杀/WM-004引擎/无1费灵将/镇煞叠加/哪吒无限攻）+ Review #2（女娲属性三方冲突），D-HIGH-003 producer 已拍板纳入M1，N-HIGH-001 producer 已拍板以火属性为权威 |
| 2026-04-30 | 新增 | D-MED-003, D-PL-001 | v2.0 来源：Critic Review #1 补录 — 先手补偿建议(+1灵力)和五行结界新效果待复审，补充进风险汇总 |
| 2026-04-30 | 决策 | D-HIGH-003 | v2.0 producer 拍板：新增2张1-2费小灵将（山海经小型神兽），纳入 M1 Sprint 1-1 CARD_LIST v2 范围 |
| 2026-04-30 | 新增 | AUD-HIGH-002 | v2.1 来源：critic 音频预审副本，BGM 分层 Stems MetaSound 实现路径为工程隐性任务，未列入 M3 里程碑，已协调 engineer 补录 |
| 2026-04-30 | 决策 | R-N03 / N-HIGH-001 | v2.0 producer 拍板：女娲五行属性统一为「火」，以 CARD_LIST 为权威，LORE_BIBLE 需对齐 |
| 2026-04-30 | 待定 | D-PL-001 | v2.0 五行结界新效果强度暂不拍板，等 critic 复审结论后再决策 |
| 2026-04-30 | 更新 | R-UX01 | v2.2 audio 跨感官方案已作为有效缓解标注进 Critic Review #3，状态更新为「缓解中」 |
| 2026-04-30 | 新增 | R-D-COMBO01, R-D-DEF01 | v2.3 来源：Critic Review #3 — 钟馗+FL-006必杀序列(Combo Alpha)，镇煞组+五彩石防守无叠加上限 |
| 2026-04-30 | 新增 | R-ENG-BLK-001, R-ENG-BLK-002, R-ENG-HIGH-002 | v2.4 来源：Critic Review #4 — BP_WuXingBarrier版本不同步，DT_Resonance结构不可扩展，存档槽命名含版本号，标记为M4开工前须关闭 |
| 2026-04-30 | 决策 | S-CROSS-001 | v2.5 producer 拍板：Bond+Resonance双触发允许保留为高光时刻，同回合ATK加成取较高值（不叠加），DEF叠加上限+3；designer写入BOND_SYSTEM v0.2 |
| 2026-04-30 | 关闭 | D-HIGH-001, D-HIGH-002, R-D-COMBO01 | v2.7 来源：critic 复审报告条件通过 — FL-006修复/WM-004三重封堵/Combo Alpha联动解除，阻塞全部清零 |
| 2026-04-30 | 拍板 | D-PL-001 | v2.7 五行结界新效果 — critic 裁定合理（触发需7灵力/纯防御/每局1次），producer 拍板通过，写入RESONANCE正式版 |
| 2026-04-30 | 新增 | RV-H-001, RV-H-002, RV-H-003, RV-M-001, RV-M-002, RV-DOC-001 | v2.7 来源：critic 复审报告 v1.1 修复清单 — RESONANCE文档错误（H-001最高优先级影响工程实现），镇煞组出处(H-002)，2费灵将阻塞(H-003)，HP数值统一(M-001)，冷却起点定义(M-002)，FL-006机制文本一致性(DOC-001) |
| 2026-04-30 | 开工授权 | — | v2.7 critic 复审结论：条件通过，art_director + engineer 可正式基于 CORE_LOOP_v2 + CARD_LIST_v0.3 开工；engineer 五行克制倍率以 CORE_LOOP_v2 §3.2 为准（×1.3） |
| 2026-04-30 | 更新 | R-UX01 | v2.8 audio 跨感官方案已作为有效缓解标注进 Critic Review #3，状态更新为「缓解中」 |
| 2026-04-30 | 关闭 | S-CROSS-001 | v2.8 producer 拍板完成：Bond+Resonance双触发允许作为高光时刻，ATK取较高值不叠加，DEF叠加上限+3；designer写入BOND_SYSTEM v0.2，风险降级为已决策 |
| 2026-04-30 | 关闭 | D-PL-001 | v2.8 producer 确认五行结界修订（本局累计5种五行触发）符合预期，触发门槛已充分提高，关闭此风险项 |
| 2026-04-30 | 催促 | R-ENG-BLK-001, R-ENG-BLK-002 | v2.8 producer 已向 engineer 发出本周处理要求，两项工程阻塞为项目唯一剩余未关闭阻塞项 |
| 2026-04-30 | 新增 | SFX-SEQ-001 | v2.8 来源：SFX_LIST v3 预审 — 五行克制浮字(T+50ms)与HP扣减动画帧时序待M2集成测试验证，已通知 engineer+audio |
| 2026-04-30 | 完成 | AU-MED-001, AU-MED-002, AU-LOW-001, AU-LOW-002 | v2.8 来源：Critic Review #6 音频四项全部通过，LICENSES.md v1.1/盲听标准/书斋反差原则/Stinger设计均复审通过，音频生产阶段正式启动 |
| 2026-04-30 | 关闭 | N-HIGH-001 | v2.8 narrative v1.1 完成：CARD_FLAVOR/nvwa.md 新建，LORE_BIBLE v1.1 女娲五行表对齐，DECISION-001 执行完毕 |
| 2026-04-30 | 关闭 | AU-MED-001 | v2.8 LICENSES.md v1.1 通过 critic Review #6，逐工具授权边界+合规Checklist+RIAA预案全部落地 |
| 2026-04-30 | 新增 | ART-LOW-001 | v2.8 CARD_ART_SPEC.md 缺少文脉卡边框色与赭石矿物色使用分工，v1.3 补充，非阻塞 |
| 2026-04-30 | 新增 | SFX-SEQ-001 | v2.8 SFX_LIST v3 预审发现：五行克制浮字(T+50ms)与HP扣减动画帧顺序需 M2 集成测试验证 |
| 2026-04-30 | 关闭 | R-N01, R-N02 | v2.6 narrative N-BLK-001（吕洞宾引诗）+ N-BLK-002（嫦娥高诱注）均已修复，CITATION_CHECKLIST v1.0 建立，两条文化可信度风险关闭 |
| 2026-04-30 | 关闭 | R-N03 | v2.6 女娲五行统一为火已对齐：LORE_BIBLE + nvwa.md 均已更新，CARD_LIST 为权威，风险关闭 |
| 2026-04-30 | 新增 | S-MED-001, S-MED-003, S-CROSS-001 | v2.6 来源：Critic Review #3（BOND_SYSTEM + RESONANCE），创世组过强/五行结界门槛低/双触发叠加必胜组合，S-CROSS-001 需 producer+designer 拍板 |
| 2026-04-30 | 新增 | E-MED-001, E-MED-002, E-MED-003 | v2.6 来源：Critic Review #4（工程文档），Template Fitness评估缺失/EffectStack优先级未定义/DT_Cards WenMai字段缺失 |
| 2026-04-30 | 关闭 | RV-H-002 | v2.9 narrative v1.1 修复通过 critic 复审：BOND_SYSTEM 第213-215行《太平广记》卷290正典已更新，「斩邪剑」效果同步为条件版，关闭 |
| 2026-04-30 | 新增 | STORY-LOW-001 | v2.9 来源：critic narrative v1.1 终版复审低优先级提醒 — STORY_CHAPTER_1 第185行「泥土色光芒」与女娲火行视觉歧义，narrative/designer M1前确认加注，非阻塞 |
| 2026-04-30 | 关闭 | RV-H-001 | v3.0 designer v1.1 修复通过 critic 设计文档批次复审：RESONANCE §2.1 五行克制倍率已更正为×1.3，§2.3 旧版双重克制节已删除，关闭 |
| 2026-04-30 | 新增 | DOC-TRAIL-001 | v3.0 来源：critic 设计文档批次复审 — CORE_LOOP_v2.md 变更摘要[PLAY-003]行 + 时序流程图注释两处仍写「同回合3种」旧版，designer 必须在 M1 第一周内修正 |
| 2026-04-30 | 新增 | DOC-TRAIL-002 | v3.0 来源：critic 设计文档批次复审 — 手牌上限数值不一致：CORE_LOOP_v2.md 写「7」 vs MEMORY 记录写「6」，designer 必须拍板确认并统一 |
| 2026-04-30 | 关门 | — | v3.0 critic 设计文档 v1.1 批次复审：S-CROSS-001/S-MED-001/002/003/RV-H-001/DECISION-001 全部通过。叠加 narrative v1.1 终版关门，M0 设计+叙事预研全部关门，M1 正式启动 |
| 2026-04-30 | 新增 | STINGER-IF-001 | v3.1 来源：audio M1启动响应 — Bond/Resonance Stinger BGM强度同步接口 `TemporaryIntensityBoost(delta, duration)` 尚未与engineer确认，M2前必须对齐，audio已主动联系等待回复 |
| 2026-04-30 | 完成 | A-MED-001（美术验收） | v3.1 art_director 完成 NS_Ultimate_InkTide 美术验收：#1A1A1A主色+#C03A2A轮廓Emissive 1.5全通过，tech_artist particle_library.md已同步，嫦娥月光银对比度监控建议已发tech_artist |
| 2026-04-30 | 完成 | — | v3.1 art_director CARD_CONCEPTS v2（10张卡）正式交付：盘古/女娲/嫦娥/吕洞宾/门神/皮影人/哪吒/太乙真人/九天玄女/山海经·夔，女娲属性全文件统一为火行#C03A2A，NS_NuWa_FireAppear粒子规格已通知tech_artist |
| 2026-04-30 | 完成 | — | v3.1 critic 输出 docs/qa/M1_REVIEW_PLAN.md（7轮评审计划），M1-R1本周触发CARD_LIST v1.1+FL-006复审，所有评审节点承诺24h内初步结论 |

---

*风险登记每个 Sprint 结束时由 producer 更新，新风险由任意成员提交给 producer 登记。*
