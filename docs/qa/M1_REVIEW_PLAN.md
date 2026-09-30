# M1 阶段 Critic 评审计划 M1_REVIEW_PLAN

> 版本：v1.0 | 撰写：critic | 日期：2026-04-30
> M1 范围：Sprint 1-1 ~ Sprint 1-4（约 2~3 个月）
> 本文件为 M1 阶段所有评审轮次的排期、对象、标准与阻塞规则。

---

## 一、评审原则

1. **阻塞优先**：Blocking 级问题未关闭前，相关工作流不得进入下一 Sprint。
2. **文档先于资产**：任何新功能规格文档须在资产/代码生产前通过 critic 审核。
3. **交叉复审**：凡跨团队依赖（工程↔设计、音频↔工程、叙事↔美术）的接口定义须经 critic 确认一致性后才可实现。
4. **条件通过可开工**：Low 级遗留问题不阻塞 M1，但须在 Sprint 截止前关闭并通知 critic 复核。

---

## 二、M1 评审轮次总览

| 评审轮次 | 触发时间 | 评审对象 | 核心问题 | 报告发送对象 |
|---------|---------|---------|---------|------------|
| M1-R1 | Sprint 1-1 开始前（本周） | CARD_LIST v1.1 + CORE_LOOP_v2 遗留项 | V1.1-001/002 是否落地；FL-006 最终规则确认 | designer, producer |
| M1-R2 | Sprint 1-1 结束 | 工程骨架 PoC + DATA_TABLES v0.2 | EffectStack 优先级规范（E-MED-002）；DT_Cards/DT_Resonance/DT_Bonds 接口完整性 | engineer, producer |
| M1-R3 | Sprint 1-2 结束 | 回合制战斗规则实现文档 | 伤害计算链（五行×1.3 / EffectStack 优先级）；文脉区生命周期实现（CRIT-D-004） | engineer, designer |
| M1-R4 | Sprint 1-3 开始前 | RESONANCE v0.2 + BOND_SYSTEM v0.2 数值同步确认 | V1.1-002 §2.1/§2.3 数值更新；S-CROSS-001 规则写入 | designer, producer |
| M1-R5 | Sprint 1-3 结束 | AI 设计文档 + 羁绊/共鸣系统 BP 文档 | 羁绊激活判断与 DataTable 是否对齐；AI 克制优先策略是否利用五行矩阵 | engineer, designer |
| M1-R6 | Sprint 1-4 开始前 | 音频接口签名协商结果（SFX-SEQ-001） | Stinger 触发时序 T+50ms 规格；MetaSound Patch 与 BP 调用接口 | audio, engineer, producer |
| M1-R7 | Sprint 1-4 结束（M1 验收） | M1 Demo 全面复审（玩法+美术+音频+叙事） | M1 里程碑验收标准全检；M2 启动授权 | 全员 |

---

## 三、各轮次评审详细说明

---

### M1-R1：CARD_LIST v1.1 + 遗留规则确认
**触发**：Sprint 1-1 启动前（即本周内）
**提交方**：designer

**评审对象**：
- `docs/design/CARDS/CARD_LIST_v1.1.md`（新增2费低费灵将）
- `docs/design/CORE_LOOP_v2.md`（FL-006 最终规则确认版本）

**必须关闭的问题**：

| ID | 问题 | 判定标准 |
|----|------|---------|
| V1.1-001 | 新增 ≥1 张 2 费灵将（ATK/DEF 合理，不引入新循环风险） | 卡牌在 CARD_LIST 中完整定义，含典籍来源（若涉及神话人物） |
| V1.1-002 | FL-006 凡品效果：CORE_LOOP_v2 §6 与 CARD_LIST 描述一致 | 两文件必须使用完全相同的效果文本，选定以下其一：①对指定1张灵将5pt固定伤/无灵将3pt直击；②有灵将→AoE 2pt各/无灵将→5pt直击 |

**评审通过条件**：V1.1-001 通过 + FL-006 描述文本在两文件中完全一致。

---

### M1-R2：工程骨架 PoC + DATA_TABLES v0.2
**触发**：Sprint 1-1 结束（M1_skeleton.md 验收标准全部达成后）
**提交方**：engineer

**评审对象**：
- M1_skeleton.md 验收截图/GIF（`docs/engineering/MILESTONES/M1/demo/`）
- `docs/engineering/DATA_TABLES.md` v0.2（含 DT_Resonance 更新方案）
- `docs/engineering/CODING_CONVENTIONS.md`（EffectStack 优先级规范补充）

**必须关闭的问题**：

| ID | 问题 | 判定标准 |
|----|------|---------|
| E-MED-002 | EffectStack 优先级规范写入 CODING_CONVENTIONS 或 DATA_TABLES | 需明确定义：同类增益取高值 vs 不同类叠加的判断顺序；须对应 BOND_SYSTEM §组别D 镇煞组取高值规则 |
| R-ENG-BLK-001 | `BP_WuXingBarrier` 效果同步至 RESONANCE v0.2 | ARCHITECTURE 中 BP_WuXingBarrier 的效果描述须与 RESONANCE.md §3.1 五行结界最终效果一致（DEF+2 all spirits + hero damage-1 × 2 turns） |

**M1 验收标准核查**（对照 M1_skeleton.md）：
- [ ] PIE 启动零 Warning/Error
- [ ] 主菜单可跳转战斗关卡
- [ ] WBP_BattleHUD 占位显示
- [ ] DT_Cards GetDataTableRow 可读取

**低优先级记录**（不阻塞）：
- R-ENG-BLK-002（DT_Resonance 结构重设计）：M4 前截止，本轮仅确认已排期。

---

### M1-R3：回合制战斗核心实现文档
**触发**：Sprint 1-2 结束
**提交方**：engineer

**评审对象**：
- 回合制战斗系统设计文档或 BP 说明文档（需 engineer 输出，路径建议 `docs/engineering/BATTLE_SYSTEM.md`）
- DT_Cards 实际字段与 CORE_LOOP_v2 的对照验证

**核心评审项**：

| 检查项 | 标准 |
|--------|------|
| 伤害计算链 | 五行克制×1.3（单层，无类型克制）；DEF 减伤在克制倍率之后；最大输出 = (ATK × 1.3) - DEF，向下取整 |
| 文脉区生命周期 | 文脉卡打出→文脉区，不经过弃牌堆；皮影「匠心活化」仅检索弃牌堆（CRIT-D-004） |
| 攻击上限 | 每张灵将每回合最多攻击2次；哪吒「逆天斗志」+羁绊叠加后仍上限2次 |
| 手牌上限 | 6张；超过6张须在抽牌环节弃置（CORE_LOOP_v2 §1.x） |
| 主将直击条件 | 有灵将→只能攻灵将；无灵将→可直击；FL-006 珍品特例：HP≤6 可绕过（核查实现是否对齐） |

---

### M1-R4：RESONANCE v0.2 + BOND_SYSTEM v0.2 数值同步确认
**触发**：Sprint 1-3 开始前
**提交方**：designer

**评审对象**：
- `docs/design/RESONANCE.md` v0.2（§2.1 / §2.3 数值更新确认版）
- `docs/design/BOND_SYSTEM.md`（S-CROSS-001 规则写入版）

**必须关闭的问题**：

| ID | 问题 | 判定标准 |
|----|------|---------|
| V1.1-002 | RESONANCE §2.1 五行克制矩阵 | 所有格显示 ×1.3（无 ×1.2 残留）；§2.3 旧双克制公式已删除 |
| S-CROSS-001 | Bond+Resonance 双触发规则 | BOND_SYSTEM 中明确写入：ATK 同类取高值不叠加，DEF 正常叠加单回合上限 +3 |

---

### M1-R5：AI + 羁绊/共鸣系统 BP 文档
**触发**：Sprint 1-3 结束
**提交方**：engineer, designer

**评审对象**：
- AI 行为树设计文档（需 engineer 输出，路径建议 `docs/engineering/AI_SYSTEM.md`）
- 羁绊/共鸣系统 Blueprint 接口文档

**核心评审项**：

| 检查项 | 标准 |
|--------|------|
| AI 五行克制策略 | AI 使用五行×1.3 矩阵选择攻击目标（克制优先），不使用旧类型克制逻辑 |
| 羁绊激活判断 | 激活条件读取自 DT_Bonds DataTable，与 BOND_SYSTEM.md 对齐 |
| 共鸣冷却计时 | 3 回合冷却由 DataTable 字段驱动（ResonanceCooldown_[Element]），不硬编码 |
| 五行结界触发条件 | BP_WuXingBarrier：读取 BattleState 中本局已打出的五行符箓种类数，≥5 种触发（更新后标准） |
| 镇煞组「斩邪剑」 | 只对「有负面状态目标」ATK +3，不再无条件触发（BOND_SYSTEM v0.2 第231行） |

**风险提示**：若 S-CROSS-001 的取高值逻辑在工程侧尚未实现，此轮标记为 **条件通过**，由 engineer 在 Sprint 1-4 内修复。

---

### M1-R6：音频接口签名协商（SFX-SEQ-001）
**触发**：Sprint 1-4 开始前
**提交方**：audio + engineer 联合提交

**评审对象**：
- 音频接口签名文档（建议路径 `docs/audio/INTERFACE.md`）
- 包含：MetaSound Patch 输入参数签名、Stinger 触发事件列表、SFX 触发时序规格

**核心评审项**：

| 检查项 | 标准 |
|--------|------|
| 五行克制 SFX 触发时序 | `MS_WuxingCrit` 触发点在伤害数字显示后 T+50ms（SFX_LIST §10.5 规格） |
| MetaSound Patch 入参签名 | `AttackerElement`（EWuxingElement 枚举）+ `ImpactIntensity`（0.0~1.0 Float） |
| Bond/Resonance Stinger 接口 | 事件名称列表须与 `BP_BondManager` / `BP_ResonanceManager` GameplayEvent 标签一致 |
| 文脉卡打出音效 | `sfx_ui_card_play_wenmai`（古琴 0.8s + 3~5s 尾音）触发条件仅为文脉卡，不误触灵将/符箓 |

---

### M1-R7：M1 全面验收复审
**触发**：Sprint 1-4 结束（M1 Demo 录制完成后）
**提交方**：全员（producer 汇总提交）

**评审对象**：
- M1 PvE Demo（完整一局对战视频/GIF）
- 工程：`docs/engineering/MILESTONES/M1/demo/` 演示材料
- 美术：CARD_CONCEPTS_v2.md（art_director 提交，女娲火色粒子确认）
- 音频：P0 SFX 小样（≥10条）
- 叙事：STORY-LOW-001 加注确认（第185行女娲光芒颜色说明）

**M1 验收全清单**：

**玩法核心（必须全通过）**：
- [ ] 完整一局 PvE 对战无崩溃
- [ ] 五行克制伤害输出值正确（验证 金→木 = ATK×1.3-DEF，无类型克制）
- [ ] 文脉卡不进弃牌堆（场测3次）
- [ ] 皮影「匠心活化」不检索文脉区
- [ ] 灵将单回合攻击≤2次（哪吒+羁绊验证）
- [ ] 主将直击规则正确（有/无灵将两种情况验证）
- [ ] 五行结界触发条件：本局累计 ≥5 种五行符箓（非单回合）

**工程（必须全通过）**：
- [ ] EffectStack 取高值逻辑验证（同类增益不叠加）
- [ ] BP_WuXingBarrier 效果与 RESONANCE v0.2 一致
- [ ] DataTable 字段覆盖 CORE_LOOP_v2 + BOND_SYSTEM + RESONANCE 所有机制变量

**美术（必须全通过）**：
- [ ] 女娲相关 VFX 粒子颜色为火色（朱砂红 #C03A2A），非土黄色
- [ ] 三类卡牌视觉区分明确（金/银/绿边框色系）

**音频（条件通过即可进入 M2）**：
- [ ] P0 基础 SFX ≥10条小样通过盲听（无明显文化冲突，风格与水墨3D一致）
- [ ] MetaSound Patch 五行克制音效：5条各元素 SFX 可正常触发

**叙事（非阻塞，但须关闭）**：
- [ ] STORY-LOW-001：STORY_CHAPTER_1 第185行加注完成

**M1 通过 → M2 启动授权**：全部「必须通过」项清零后，critic 向 producer 发出 M2 启动授权。

---

## 四、M1 阶段风险跟踪

| ID | 风险描述 | 当前状态 | 负责人 | 截止节点 |
|----|---------|---------|--------|---------|
| R-ENG-BLK-001 | BP_WuXingBarrier 未同步 RESONANCE v0.2 | 🔴 未修复 | engineer | M1-R2（Sprint 1-1 结束） |
| R-ENG-BLK-002 | DT_Resonance 不支持 7 种共鸣类型 | 🟡 排期中 | engineer | M4 前截止 |
| V1.1-001 | 缺少2费低费灵将 | 🔴 未修复 | designer | M1-R1（本周） |
| V1.1-002 | RESONANCE §2.1/§2.3 数值残留 | 🔴 未修复 | designer | M1-R4（Sprint 1-3 前） |
| S-CROSS-001 | Bond+Resonance 双触发规则未写入文档 | 🔴 未写入 | designer | M1-R4 |
| SFX-SEQ-001 | 音频触发时序 T+50ms 接口未签名 | 🟡 待协商 | audio + engineer | M1-R6（Sprint 1-4 前） |
| STORY-LOW-001 | 第185行女娲光芒颜色歧义 | 🟡 低优先级 | narrative + designer | M1-R7（M1 结束前） |
| E-MED-002 | EffectStack 优先级规范未写入 | 🔴 未写入 | engineer | M1-R2 |

---

## 五、评审提交格式要求

为确保评审高效，各团队提交评审材料时须附：

1. **版本号**：文档须有明确版本号（如 v1.1、v0.3）
2. **变更摘要**：一段不超过 5 条的「本版本改动清单」
3. **自查清单**：提交方已自检的问题 ID 列表（标注 ✅/❌）
4. **阻塞标记**：如提交方认为存在阻塞，须在消息标题加注 `[BLOCKING]`

Critic 承诺：收到提交后 **24小时内** 给出初步评审结论（通过/条件通过/打回）。

---

*本文件由 critic 维护，每轮评审结束后更新对应行状态。如有评审范围变更，请由 producer 或 team-lead 通知 critic 修订。*
