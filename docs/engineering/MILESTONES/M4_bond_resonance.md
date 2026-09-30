# M4_bond_resonance.md — Milestone 4：羁绊 + 五行共鸣

**目标**：文脉羁绊系统 + 符箓五行共鸣系统完整接入，含UI弹窗与效果结算  
**阶段对应**：ROADMAP Sprint 2-2 / 2-3  
**版本**：v0.1 | 维护人：engineer  
**前置依赖**：M3_combat 验收通过  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `BP_BondDetector` | Blueprint Component | `Content/WX_Core/BondSystem/` | [ ] |
| `BP_BondEffectHandler` | Blueprint Actor | `Content/WX_Core/BondSystem/` | [ ] |
| `BP_ResonanceDetector` | Blueprint Component | `Content/WX_Core/ResonanceSystem/` | [ ] |
| `BP_WuXingBarrier` | Blueprint Actor | `Content/WX_Core/ResonanceSystem/` | [ ] |
| `WBP_BondPopup` | UMG Widget | `Content/WX_UI/Popup/` | [ ] |
| `WBP_CultureStory` | UMG Widget | `Content/WX_UI/Popup/` | [ ] |
| `DT_Bonds`（3组完整数据） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `DT_Resonance`（1条完整数据） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `NS_Bond_Creation`（占位粒子） | Niagara System | `Content/WX_Art/VFX/` | [ ] |
| `NS_WuXing_Resonance`（占位粒子） | Niagara System | `Content/WX_Art/VFX/` | [ ] |
| `L_Test_Bond` | 测试地图 | `Content/WX_Maps/` | [ ] |
| `L_Test_Resonance` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. 羁绊检测（BondDetector）
- [ ] 挂载到 `BP_CardManager`
- [ ] 订阅 `OnCardPlayed` 和 `OnCardDeath` 事件
- [ ] 每次触发时，遍历 `DT_Bonds` 所有行：
  - 检查 `RequiredCardIDs` 或 `RequiredTags` 中的成员是否全部在场（OnField 状态）
  - 满足且之前未激活 → 广播 `OnBondActivated(BondID)`
  - 之前激活但成员不足 → 广播 `OnBondDeactivated(BondID)`

### 2. 羁绊效果处理（BondEffectHandler）
- [ ] 接收 `OnBondActivated`：从 DT_Bonds 读取效果 → 提交到 EffectStack
- [ ] 接收 `OnBondDeactivated`：从 EffectStack 移除对应羁绊效果
- [ ] 激活时：触发 `NS_Bond_*` 粒子特效（Spawn at location）
- [ ] 激活时：向 UI 广播 `OnShowBondPopup(BondID)` Event Dispatcher
- [ ] 激活时：向 NarrativeSystem 发送 `UnlockCultureStory(CultureStoryID)`（占位接口，M6接入）

### 3. 羁绊UI
- [ ] `WBP_BondPopup`：接收 `OnShowBondPopup`，显示羁绊名称 + 效果描述 + 「查看故事」按钮
- [ ] 弹窗自动 3 秒后消失，或点击「查看故事」打开 `WBP_CultureStory`
- [ ] `WBP_CultureStory`：显示 `DT_Bonds` 中对应 `CultureStoryID` 的故事文本

### 4. 五行共鸣检测（ResonanceDetector）
- [ ] 挂载到 `BP_CardManager`
- [ ] 订阅 `OnCardPlayed`（仅符箓卡触发）
- [ ] 维护本局「已打符箓五行集合」（TSet<EWX_Element>）
- [ ] 检测集合是否包含 Metal/Wood/Water/Fire/Earth 全5种 → 触发 `OnResonanceActivated(ResonanceID)`
- [ ] 每局仅触发一次（已触发则不再检测）

### 5. 五行结界（WuXingBarrier）
- [ ] 接收 `OnResonanceActivated`：从 DT_Resonance 读取参数
- [ ] 提交到 EffectStack：全场 DEF+3，持续2回合
- [ ] 注册每次敌方五行卡攻击时额外+1固定伤害的 Hook（绑定 BattleResolver 的 `OnPreDamageCalc` 事件）
- [ ] 触发 `NS_WuXing_Resonance` 粒子特效

### 6. DataTable 填写
- [ ] `DT_Bonds`：填入神话创世、八仙组（4人+）、非遗组 共3组完整数据
- [ ] `DT_Resonance`：填入五行结界1条数据

### 7. 测试地图
- [ ] `L_Test_Bond`：牌组构造使盘古+女娲同时入场，验证羁绊激活弹窗 + ATK增益
- [ ] `L_Test_Resonance`：牌组中含五行符各1张，验证结界触发 + DEF效果

---

## 验收标准

- [ ] 盘古+女娲同场时 `Bond_Creation` 自动激活，全场ATK+2，WBP_BondPopup显示
- [ ] 羁绊成员阵亡后效果立即撤销
- [ ] 凑齐五行符 → 五行结界触发，全场DEF+3，持续2回合后自动消失
- [ ] 结界期间敌方五行卡每次攻击额外受1点伤害
- [ ] `NS_Bond_Creation` 和 `NS_WuXing_Resonance` 粒子正确播放（占位白色粒子可接受）
- [ ] Output Log 零 Warning / 零 Error
- [ ] 两个测试地图分别可一键复现

---

## Demo 录制说明

录制 2 个 GIF：
1. 羁绊激活：盘古+女娲入场 → 弹窗出现 → ATK增益生效
2. 五行共鸣：打出五行符 → 结界效果触发 → 敌方受额外伤害

放置于：`docs/engineering/MILESTONES/M4/demo/`

---

*版本：v0.1 | 2026-04-30*
