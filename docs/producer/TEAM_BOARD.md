# 《文脉·山海卡》团队看板 TEAM_BOARD

> 版本：v2.9 | 更新：2026-04-30 | 负责人：producer
> 当前阶段：**M1 · 资产生产 + 工程 PoC（M0 已正式关门）**

---

## 团队成员与职责

| 成员 | 角色 | 核心职责 |
|------|------|---------|
| producer | 制作人 | 统筹协调、进度管理、风险跟踪 |
| designer | 系统策划 | 核心玩法、数值设计、关卡设计 |
| narrative | 剧情策划 | 世界观、剧情文本、卡牌文化故事 |
| art_director | 美术总监 | 美术风格定调、资源规范、美术审核 |
| tech_artist | 技术美术 | Shader、Niagara特效、性能优化 |
| engineer | 技术工程师 | UE5蓝图架构、系统实现、Data Table |
| audio | 音频策划 | 音乐风格、音效规范、BGM选取 |
| critic | 质检评审 | 策划评审、风险预警、玩法测试 |

---

## M0 阶段首批任务（Sprint 0-1 / 0-2 — ✅ 已关门）

### producer（自我）
| 任务 | 优先级 | 状态 | 截止 |
|------|--------|------|------|
| 产出 ROADMAP.md | P0 | ✅ 完成 | 48h |
| 产出 TEAM_BOARD.md | P0 | ✅ 完成 | 48h |
| 产出 RISK_LOG.md | P0 | ✅ 完成 | 48h |
| 统筹 M0-Sprint0-1 启动 | P1 | ✅ 完成 | 本周 |

---

### designer（系统策划）— **✅ v1.1 批次复审全部通过，M1 第一周内完成 2 处文字修正 + 手牌上限确认**

> critic 设计文档 v1.1 批次复审结论：S-CROSS-001/S-MED-001/002/003/RV-H-001/DECISION-001 全部通过。残留 2 处文字级别修正（CORE_LOOP_v2 变更摘要+流程图注释仍写「同回合3种」旧版）及手牌上限数值确认（7 vs 6），M1 第一周内完成后 designer 阶段正式收尾。

| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 CORE_LOOP.md（核心循环文档） | P0 | ✅ 完成 | 48h | — |
| 输出 CARDS/CARD_LIST_v1.md（18张卡牌首版） | P0 | ✅ 完成 | 48h | — |
| 输出 BOND_SYSTEM.md（5组文脉羁绊） | P0 | ✅ 完成 | 本周 | CARD_LIST_v1 |
| 输出 RESONANCE.md（符箓共鸣矩阵） | P0 | ✅ 完成 | 本周 | 羁绊列表 |
| 输出 CORE_LOOP_v2.md（修复雷击符+取消类型克制+动画暂停计时） | P0 | ✅ 完成 | — | — |
| 输出 CARD_LIST_v0.3（FL-006/WM-004/WM-006修复，critic复审通过） | P0 | ✅ 完成 | — | — |
| 输出 BOND_SYSTEM_v0.2（S-CROSS-001双触发上限规则） | P0 | ✅ 完成 | — | — |
| 输出 RESONANCE_v0.2（五行结界新效果+共鸣扩展） | P0 | ✅ 完成 | — | — |
| Onboarding Flow — critic 复审通过 ✅ | P0 | ✅ 完成 | M0结束 | — |
| **[已拍板] 主将初始 HP = 20** | P0 | ✅ 已决策 | — | producer |
| **[已拍板] 五行结界触发：「本局累计打出5种五行」** | P0 | ✅ 已决策 | — | producer |
| **[已拍板] 五行结界新效果每回合-2固定伤害** — critic裁定合理，producer拍板通过 | P0 | ✅ 已决策 | — | producer |
| **[已拍板] 封神/非遗孤立卡：不设单卡激活奖励** | P1 | ✅ 已决策 | — | producer |
| **[已拍板] 女娲五行属性 = 火** | P0 | ✅ 已决策 | — | producer |
| **[已拍板] S-CROSS-001：Bond+Resonance双触发允许，ATK取较高值不叠加，DEF叠加上限+3** | P0 | ✅ 已决策 | — | producer |
| 解决 R-PL01：先手补偿更新为「先手第1回合+1灵力」 | P0 | 🔄 处理中 | M1前 | — |
| **[RV-H-001] 删除 RESONANCE §2.3，更新 §2.1 克制倍率为×1.3** | P0 | ✅ 完成（critic 设计文档批次复审通过） | v1.1 | — |
| **[RV-H-002] 修正 BOND_SYSTEM 镇煞组典籍出处：《补笔谈》→《太平广记》引《唐逸史》** | P0 | ✅ 完成（narrative v1.1 + critic 设计批次复审通过） | v1.1 | narrative |
| **[DOC-TRAIL-001] CORE_LOOP_v2.md 变更摘要[PLAY-003]行修正「同回合3种」→「本局累计5种」** | P0 | ✅ 完成（v1.1已更正，流程图第73行也已对齐） | M1第一周 | — |
| **[DOC-TRAIL-002] 手牌上限拍板：7张（CORE_LOOP_v2明文，取CORE_LOOP_v2为准）** | P0 | ✅ 完成（CORE_LOOP_v2「手牌>7→弃至7张」为唯一权威数值，已确认） | M1第一周 | — |
| **[RV-H-003] 追加至少1张2费灵将** | P0 | ✅ 完成（新增 LJ-007 烛龙·燃明，2费/ATK3/DEF2/HP5，《山海经·大荒北经》正典，CARD_LIST_v1.md §一已写入） | v1.1 | — |
| **[RV-M-001] 统一升阶极品HP为+3** | P1 | ✅ 完成（CORE_LOOP_v2 §十二关键规则索引已更新：「珍品ATK/DEF+1/HP+2；极品ATK/DEF+2/HP+3」，与CARD_LIST §四一致） | v1.1 | — |
| **[RV-M-002] 补充 RESONANCE 单行共鸣冷却起点定义** | P1 | ✅ 完成（RESONANCE.md 5种单行共鸣冷却字段均已更新为「从效果结束的当前回合结束时起算，即第4回合方可再触发」） | v1.1 | — |
| **[RV-DOC-001] 统一 FL-006 机制描述为「单体5点」** | P1 | ✅ 完成（CORE_LOOP_v2 §十二关键规则索引已写入「FL-006单体5点固定伤害（目标：灵将）；无灵将时直伤主将3点」） | v1.1 | — |
| **[D-HIGH-003] 新增2张1-2费小灵将（山海经神兽）** — 与RV-H-003合并，纳入v1.1 | P0 | 🔄 已合并至RV-H-003 | v1.1 | — |
| **[D-MED-001] 为镇煞组+五彩石防御叠加设置上限（「同类防御取高值不叠加」）** | P1 | 🔄 处理中 | M1前 | — |
| **[D-MED-002] 为哪吒单回合攻击次数设置上限** | P1 | 🔄 处理中 | M1前 | — |
| **[D-MED-003] 更新先手补偿为「先手第1回合+1灵力」** | P1 | 🔄 与R-PL01合并处理 | M1前 | — |
| **[S-CROSS-001] 将 Bond+Resonance 双触发上限规则写入 BOND_SYSTEM v0.2**（ATK取较高值，DEF叠加上限+3） | P0 | ✅ 完成（BOND_SYSTEM.md §四已写入，含三条示例） | M1前 | producer已拍板 |
| **[R-D-COMBO01/D-HIGH-001] 修改 FL-006 极品版触发条件，消除 Combo Alpha 必杀序列** | P0 | ⛔ 修订中-阻塞 | v0.3 | — |
| **[R-D-DEF01] 明确「同类防御效果取高值不叠加」规则，写入 CORE_LOOP** | P1 | ✅ 完成（CORE_LOOP_v2 §八防御叠加规则已写入，含「同类防御取高值不叠加」+「主将单次最低伤害=2」） | M1前 | — |
| **[M1-文脉区位置-001] 文脉区战场位置拍板：方案3「底部手牌区上方独立横条」** | P0 | ✅ 完成（designer已拍板，tech_artist/art_director/engineer已通知，详见下方M1任务区） | M1前 | — |
| **[CARD_LIST v1.1] 新增第2张2费灵将（V1.1-001）** | P1 | 📋 待认领 | M1-Sprint1-2 | — |
| **[M1-设计-001] 设计CARD_LIST v1.1稳定版（供 narrative解锁 flavor text）** | P0 | 🔄 进行中 | M1-Sprint1-1 | — |

---

### narrative（剧情策划）— **✅ v1.1 全部通过，critic 终版复审关门，M1 可继续 flavor text**

> **2026-04-30 critic 终版复审结论**：N-BLK-001/002、N-HIGH-001/002/003、RV-H-002 全部通过。STORY-LOW-001 已由 narrative 处理完毕——第185行光芒改为火行色（戱砂红+暖金），第189行泥土意象保留但注明美术执行以暖金代山黄，**STORY-LOW-001 已正式关闭**。M0 叙事预研正式关门。

| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 LORE_BIBLE.md 初版（世界观圣经） | P0 | ✅ 完成 | 48h | — |
| 输出 STORY_CHAPTER_1.md（第一章剧本） | P1 | ✅ 完成 | M0结束 | LORE_BIBLE |
| 输出 CULTURE_NOTES.md（文化小故事库） | P1 | ✅ 完成 | M0结束 | — |
| 输出 GLOSSARY.md（术语表） | P1 | ✅ 完成 | M0结束 | — |
| 输出 CARD_FLAVOR/ 初版6张卡牌文案 | P1 | ✅ 完成 | M0结束 | — |
| 为 CARD_LIST_v1 全部卡牌补充 flavor text | P1 | ⛔ 阻塞中 | M0结束 | CARD_LIST_v1（等待designer） |
| 撰写故事模式12章剧情大纲 | P1 | ✅ 完成（v1.3 扩充为十二章，全部章节剧本已落地） | M0结束 | LORE_BIBLE |
| 提供场景13处的文化背景描述（昆仑墟/长安城/古戏台/书斋 + 稷下学宫/云梦泽/未央宫/兰亭/莫高窟/江南市井/观星台/泉州港/藏书楼） | P2 | ✅ 完成（v1.3） | M0结束 | — |
| **[N-BLK-001] 修正吕洞宾卡引诗作者：袁枚→吕岩，更新 CARD_FLAVOR v1.1** | P0 | ✅ 完成 | — | — |
| **[N-BLK-002] 修正嫦娥卡高诱注引用规范，标注为注疏非典籍原文** | P0 | ✅ 完成 | — | — |
| **[N-HIGH-001] 修改 CARD_FLAVOR/nvwa.md 女娲属性为「火行」（producer已拍板）** | P0 | ✅ 完成 | — | — |
| **[N-HIGH-002] 修改 LORE_BIBLE 女娲属性为「火」以对齐 CARD_LIST（producer已拍板）** | P0 | ✅ 完成 | — | — |
| **[N-MED-001] 修正嫦娥卡典籍原文栏：分离原文与释义，符合引用规范** | P1 | ✅ 完成（change.md v1.1已修复） | — | — |
| **[N-MED-002] 明确盘古卡引用层级：标注《绎史》引《五运历年纪》关系** | P1 | ✅ 完成（pangu.md 已修复） | — | — |
| **[N-MED-003] CULTURE_NOTES.md 补充修正（N-HIGH-002 女娲火行词条 / N-HIGH-003 嫦娥月宫细节 / N-MED-003 皮影戏台引用升级至《东京梦华录》正文）** | P1 | ✅ 完成（CULTURE_NOTES v1.1） | — | — |
| **[P1-NEW] 为剩余12张卡牌补充 flavor text（CARD_LIST_v1 第7-18张）** | P1 | 📋 待认领 | M1前 | CARD_LIST v0.2 |
| **[N-HIGH-003 已修复] STORY_CHAPTER_1 序章女娲揭示提示（延迟感知设计）** | P0 | ✅ 完成（第27行加入揭示提示，critic终版复审通过） | — | — |
| **[STORY-LOW-001 已关闭] STORY_CHAPTER_1 第185/189行「泥土色」光芒加注** | P2 | ✅ 完成（narrative已修订：第185行改为「朱砂红与暖金交织光芒，对应女娲火行属性#C03A2A」；第189行泥土意象保留但注明美术执行以暖金代替土黄） | M1前 | — |

---

### art_director（美术总监）
| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 STYLE_GUIDE.md 初版（美术风格规范） | P0 | ✅ 完成 | 48h | — |
| 整理 Marketplace 中式资源候选清单 | P0 | ✅ 完成 | 本周 | — |
| 定义卡牌视觉规范（尺寸/纹理分辨率/PBR要求） | P1 | ✅ 完成（CARD_ART_SPEC.md） | 本周 | STYLE_GUIDE |
| 定义3个场景的情绪板（昆仑墟/古戏台/书斋） | P1 | ✅ 完成（SCENE_DESIGN_v1.md） | 本周 | STYLE_GUIDE |
| 审核 tech_artist 首批特效方向 | P2 | ✅ 完成（VFX_VISUAL.md v1.2已发tech_artist） | M0结束 | RENDER_PLAN |
| **[P0-NEW] 用视觉语言强化三类卡差异（响应 R-D01）** | P0 | ✅ 完成（STYLE_GUIDE v1.2 三类卡牌视觉语言速查表+AI Prompt参考，已通过Review #6） | M1前 | R-D01 |
| 协同 engineer 确认 UMG 接口（UI_VISUAL.md v1.1） | P1 | ⛔ 等待engineer反馈 | M1前 | engineer |
| **[A-MED-001 已修复] NS_Ultimate_InkTide 大招改为黑+朱砂红主色，避免嫦娥月光色冲突** | P0 | ✅ 完成（VFX_VISUAL v1.2） | — | — |
| **[A-LOW-002 已补充] VFX_VISUAL 补充战斗状态场景 VFX LOD 降级策略** | P1 | ✅ 完成（VFX_VISUAL v1.2） | — | — |
| **[A-LOW-001 待处理] 明确 UI 功能色 vs 五行标识色区分（朱砂红双用途冲突）** | P2 | 📋 待认领 | M2前 | UI_VISUAL |
| **[A-MED-001 验收完成] NS_Ultimate_InkTide 美术验收通过** — 主色 #1A1A1A（焦墨）✅，轮廓 #C03A2A Emissive 1.5 ✅，已向 tech_artist 发送月光银对比度监控建议 | P0 | ✅ 完成 | — | — |
| **[CARD_CONCEPTS v2 完成] 10张卡牌概念稿（盘古/女娲🔥/嫦娥/吕洞宾/门神/皮影人/哪吒/太乙真人/九天玄女/山海经·夔）全覆盖，女娲火行 #C03A2A 统一，NS_NuWa_FireAppear 粒子视觉需求已通知 tech_artist** | P1 | ✅ 完成（v2.1已覆盖更新，docs/art/CONCEPTS/CARD_CONCEPTS_v2.md） | M1前 | STYLE_GUIDE v1.2 |
| **[P1待续] FL-006 + WM-004 CONCEPTS 待 designer v1.1 修订完成后补充（Addendum）；文脉卡 WM-001~006 Prompt 待 CARD_LIST 稳定后一并补充** | P1 | 📋 待触发 | M1前 | designer CARD_LIST v1.1 |
| **[STYLE_GUIDE v1.2 已通过 Review #6] ART-NEW-001/002 全部通过，可正式指导美术生产** | P0 | ✅ 完成 | — | — |
| **[LOW 遗留] CARD_ART_SPEC.md 补充文脉卡边框色(#8C6040)与赭石矿物色(#7B3F00)使用分工** | P2 | 📋 待认领 | v1.3 | — |

---

### tech_artist（技术美术）
| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 RENDER_PLAN.md 初版（渲染方案） | P0 | ✅ 完成 | 48h | — |
| 输出 PERF_BUDGET.md 初版（性能预算） | P0 | ✅ 完成 | 48h | — |
| 确定 Lumen / Nanite 参数基线 | P1 | ✅ 完成（含软件Lumen+VSM方案） | 本周 | RENDER_PLAN |
| 制作1个水墨粒子特效原型（Niagara） | P1 | 📋 待认领 | M0结束 | STYLE_GUIDE |
| 建立 LOD / 纹理压缩规范 | P2 | 📋 待认领 | M0结束 | PERF_BUDGET |
| PoC Demo 后实测数据修正性能预算 | P1 | 🔄 待触发（engineer已启动PoC） | M1-Sprint1-2 | PoC Demo |
| **[P1-NEW] 更新 particle_library.md：NS_Ultimate_InkTide 颜色参数改为黑+朱砂红（A-MED-001）** | P1 | ✅ 完成（#1A1A1A主色 + #C03A2A轮廓 Emissive 1.5，美术验收通过） | PoC期间 | VFX_VISUAL v1.2 |
| **[M1-TA-WenMai-001] 根据文脉区位置拍板（方案3：底部手牌区上方独立横条，依据 designer 拍板）更新 card_material.md 文脉区布局参数** | P0 | 📋 待认领 | M1-Sprint1-1 | designer已拍板 |

---

### engineer（技术工程师）
| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 ARCHITECTURE.md 初版（蓝图架构） | P0 | ✅ 完成（v0.2含版本注释） | 48h | — |
| 输出 DATA_TABLES.md 初版（数据表设计） | P0 | ✅ 完成（v0.2含版本注释） | 48h | — |
| 搭建 UE5 工程基础目录结构 | P0 | 📋 待认领 | 本周 | — |
| 评估 Card Games Templates 复用点 | P0 | 📋 待认领 | 本周 | — |
| 创建 CardData / BondData / FuluData 数据表骨架 | P1 | 📋 待认领 | 本周 | DATA_TABLES |
| 实现单张 3D 卡牌可拖拽原型 | P1 | 📋 待认领 | M0结束 | 工程框架 |
| **[已关闭] 确认实际使用 UE5 版本号（R-PM02）** | P1 | ✅ 完成（UE5.7.4核实为官方正式Hotfix，无风险） | 本周 | — |
| **[P1] 审阅 docs/art/UI_VISUAL.md 并反馈 UMG 接口可行性给 art_director** | P1 | 📋 待认领 | 本周 | — |
| 确认 BondTag 多值存储方案 + Skill Effect 字段拆分方案（来自 designer） | P1 | 📋 待认领 | M1前 | DATA_TABLES |
| **[P0-NEW] 基于 CORE_LOOP_v2 + CARD_LIST_v0.3 正式开始战斗蓝图对齐** | P0 | 🔄 已启动（tech_artist确认PoC就绪） | M1-S1-1 | CORE_LOOP_v2 |
| **注意：五行克制倍率以 CORE_LOOP_v2 §3.2 为准（×1.3）— RV-H-001 已关闭，RESONANCE §2.1 已更正，engineer 可正式参考** | P0 | ✅ 已解除（RV-H-001关闭） | — | — |
| **[M1-ENG-001/E-MED-002] PoC前完成 EffectStack 效果叠加优先级规范（Bond增益/符箓技能/属性克制同帧冲突）** | P0 | 📋 待认领 | M1-Sprint1-1前 | ARCHITECTURE + CORE_LOOP_v2 |
| **[M1-ENG-WenMai-001] 文脉区 HUD_BattleOverlay 层级接入（底部手牌区上方独立横条，依据 designer 拍板）** | P0 | 📋 待认领 | M1-Sprint1-1 | designer已拍板 |
| **[E-MED-001] PoC 0完成后出 Template Fitness 评估报告（1页）** | P1 | 📋 待认领 | PoC 0后2周 | — |
| **[E-MED-003] DT_Cards 新增 WenMaiZoneEffect 字段（或 EffectCategory 枚举）** | P1 | 📋 待认领 | M1前 | designer确认 |
| **[AUD-HIGH-002] 在 M3_combat.md 中补充 MetaSound 音频分层触发任务项** | P1 | 📋 待认领 | M3前 | AUDIO_STYLE |
| **[R-ENG-BLK-001] 同步 ARCHITECTURE.md BP_WuXingBarrier 描述至 RESONANCE.md v0.2（护盾一次性+DEF+1/1回合）** | P0 | 📋 待认领 | M4前 | RESONANCE v0.2 |
| **[R-ENG-BLK-002] 重新设计 DT_Resonance 结构以支持5种单行共鸣+2种特殊共鸣** | P0 | 📋 待认领 | M4前 | RESONANCE v0.2 |
| **[R-ENG-HIGH-002] 将存档槽命名从含版本号改为固定槽名+内部版本字段** | P1 | 📋 待认领 | M3前 | — |
| **[SFX-SEQ-001] M2集成测试验证：五行克制浮字动画（T+50ms）须先于HP扣减动画帧触发，防止视听不同步** | P1 | 📋 待认领 | M2集成测试 | audio确认时序 |
| **[STINGER-IF-001] 确认 Bond/Resonance Stinger 接口签名 `TemporaryIntensityBoost(delta, duration)`，供 audio M2前完成 BGM 强度同步** | P1 | 📋 待认领 | M2前 | audio |

---

### audio（音频策划）
| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 输出 AUDIO_STYLE.md 初版（音频风格规范） | P0 | ✅ 完成 | 48h | — |
| 收集免费中式音效候选（古琴/竹笛/符箓音效） | P1 | ✅ 完成（BGM_LIST+SFX_LIST已输出） | 本周 | AUDIO_STYLE |
| 规划3个场景的 BGM 情绪与乐器配置 | P1 | ✅ 完成（昆仑墟羽调/古戏台徵调/书斋宫调） | 本周 | STYLE_GUIDE |
| 定义卡牌召唤/技能触发/胜负音效规范 | P2 | ✅ 完成（IMPLEMENTATION文档已输出） | M0结束 | — |
| **[AU-MED-001] LICENSES.md v1.1 商用授权标注** | P0 | ✅ 完成（Suno/Udio/ElevenLabs逐工具细化，三阶段合规Checklist已建立，通过Review #6） | — | — |
| **[AU-MED-002] BGM 盲听评审标准（AUDIO_STYLE.md §9）** | P1 | ✅ 完成（5维度量化，风格<4分直接淘汰，附评审记录模板，通过Review #6） | — | — |
| **[AU-LOW-001] 书斋BGM vs 战斗BGM反差原则** | P2 | ✅ 完成（古琴+无节拍+76BPM，与战斗96-132BPM本质区分写入文档） | — | — |
| **[AU-LOW-002] Bond/Resonance Music Stinger设计** | P2 | ✅ 完成（4类Stinger，独立AudioComponent叠加方案，M2前与engineer确认接口签名） | — | — |
| **[P1-NEW] BGM 小样制作按 AUDIO_STYLE.md v1.2 §9 盲听标准提交** | P1 | 🔄 **生产中**（优先级：#1主菜单→#2昆仑墟战斗→#4书斋战斗→其余；≥6候选版/首） | M2前 | AUDIO_STYLE v1.2 |
| **[P1-NEW] Suno生成后通过 ACRCloud 相似度检测（>80%重新生成）** | P1 | 🔄 进行中（已内置 LICENSES.md v1.2 SOP） | BGM生产中执行 | — |
| **[M2前] Bond/Resonance Stinger 接口签名与 engineer 确认（STINGER-IF-001）** | P1 | ⛔ 等待 engineer 回复 | M2前 | engineer |
| **[M1-M2] P0基础SFX 52条 + 五行克制层 MetaSound Patch 15条制作** | P1 | 🔄 准备中（M1-M2执行） | M2结束 | — |
| **[SFX_LIST v3] 五行克制音效方案通过预审，「水克火=瓷碗」需补充文化注释** | P1 | 📋 待认领 | M1-M2阶段 | — |

---

### critic（质检评审）
| 任务 | 优先级 | 状态 | 截止 | 依赖 |
|------|--------|------|------|------|
| 阅读策划总纲并提交初步风险点给 producer | P0 | ✅ 完成（INITIAL_REVIEW.md，19条问题，5条阻塞） | 48h | — |
| 评审 CORE_LOOP.md 可行性 | P1 | ✅ 完成（Review #1 已发，CORE_LOOP_v2 待复审） | M1前 | CORE_LOOP_v2 |
| 评审 CARD_LIST_v1 平衡性 | P1 | ✅ 完成（Review #1 已发，CARD_LIST v0.2 待复审） | M1前 | CARD_LIST v0.2 |
| **[P0-NEW] 复审 CORE_LOOP_v2 + CARD_LIST_v0.2（确认 D-HIGH-001/002 修复情况）** | P0 | ✅ 完成（批次复审通过，含6项全通过） | M1前 | designer v0.2/v0.3 |
| **[P0-NEW] 复审五行结界新效果（每回合-2固定伤害）是否过强（D-PL-001）** | P0 | ✅ 完成（critic裁定合理，producer拍板通过） | M1前 | RESONANCE v2 |
| 输出首版 docs/qa/REVIEWS/M0_REVIEW.md | P1 | ✅ 完成（含M0全阶段评审总结） | M0结束 | 各 M0 交付物 |
| **[已发送] Review #3 — BOND_SYSTEM + RESONANCE（S-MED-001/003/S-CROSS-001 HIGH）** | P0 | ✅ 完成 | — | — |
| **[已发送] Review #4 — 工程文档（E-MED-001/002 HIGH）** | P0 | ✅ 完成 | — | — |
| **[已发送] Review #5 — 美术复审（STYLE+VFX v1.1通过，A-MED-001 MED）** | P0 | ✅ 完成 | — | — |
| **[已发送] Review #6 — STYLE_GUIDE v1.2复审通过 + 音频AU四项全部通过** | P0 | ✅ 完成 | — | — |
| **[已发送] narrative v1.1 终版复审通过 — N-BLK-001/002/N-HIGH-001/002/003/RV-H-002 全部通过，M0叙事关门授权** | P0 | ✅ 完成 | — | — |
| **[已发送] 设计文档 v1.1 批次复审通过 — S-CROSS-001/S-MED-001/002/003/RV-H-001/DECISION-001 全部通过，M0设计关门授权** | P0 | ✅ 完成 | — | — |
| **[M1阶段] M1_REVIEW_PLAN.md 输出（M1阶段评审计划）** | P1 | ✅ 完成（docs/qa/M1_REVIEW_PLAN.md 已输出，包含Sprint1-1/1-2评审计划） | M1-Sprint1-1 | — |
| **[已发送] 音频预审（AU-MED-001 HIGH 版权/AU-MED-002 盲听标准）** | P0 | ✅ 完成 | — | — |
| **[S-CROSS-001 已拍板] Bond+Resonance双触发允许保留为高光时刻，ATK取较高值+DEF叠加上限+3** | P0 | ✅ 已决策 | — | producer |

---

## 任务状态图例

| 符号 | 含义 |
|------|------|
| ✅ | 已完成 |
| 🔄 | 进行中 |
| 📋 | 待认领/待开始 |
| ⛔ | 阻塞中 |
| ❌ | 取消 |

---

## 跨角色依赖关键路径

```
designer(CARD_LIST_v0.2)  ──→ narrative(flavor text) ──→ engineer(DataTable 填充)
designer(CORE_LOOP_v2)    ──→ engineer(战斗蓝图正式开工) ──→ tech_artist(特效绑定)
art_director(STYLE_GUIDE) ──→ tech_artist(特效方向) + audio(场景情绪)
art_director(UI_VISUAL)   ──→ engineer(UMG接口确认) ──→ art_director(UI_VISUAL v1.1)

⚠️ 当前阻塞路径：
engineer(R-ENG-BLK-001/002) ──→ M4开工前须关闭
SFX-SEQ-001(T+50ms时序) ──→ M2集成测试验证 ──→ audio+engineer确认
STINGER-IF-001(接口签名确认) ──→ audio BGM强度同步效果 ──→ M2前engineer回复
designer CARD_LIST v1.1 第2张低费灵将 ──→ narrative 12张 flavor text 可解锁

✅ 已解除阻塞：
designer v0.2(D-BLK-001+D-BLK-002) ──→ art/engineer 可正式对齐数值开工
R-PM02 关闭 ──→ 所有技术文档版本前提确认
DECISION-001(女娲=火) + S-CROSS-001拍板 ──→ narrative LORE_BIBLE对齐 + designer BOND_SYSTEM v0.2
narrative v1.1(N-BLK-001+002+N-HIGH-001/002+N-MED-001/002/003 全7项) ──→ 全卡牌 flavor text 可解锁（依赖designer CARD_LIST稳定）
RV-H-001 关闭 ──→ RESONANCE §2.1/§2.3 已修正，engineer 可正式参考 ×1.3 倍率
RV-H-002 关闭 ──→ 镇煞组典籍正典已更新，BOND_SYSTEM 文化可信度通过
RV-H-003 关闭 ──→ LJ-007 烛龙 2费灵将写入，前2回合空窗问题解决
RV-M-001/002/DOC-TRAIL-001/002/RV-DOC-001 全部关闭 ──→ designer M1设计文档修复阶段正式收尾
STORY-LOW-001 关闭 ──→ 女娲视觉歧义已加注，art_director可正式参考#C03A2A火行粒子色
文脉区位置-001 拍板 ──→ 方案3底部横条，tech_artist可更新card_material.md，engineer加入HUD层级
```

---

*本看板每个 Sprint 结束后由 producer 更新，成员有任务变更请通知 producer。*
