# M2_card_flow.md — Milestone 2：卡牌核心流程

**目标**：抽牌 / 出牌 / 弃牌 / 回合切换 完整跑通  
**阶段对应**：ROADMAP Sprint 1-2 / 2-1  
**版本**：v0.1 | 维护人：engineer  
**前置依赖**：M1_skeleton 验收通过  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `BP_CardBase` | Blueprint Actor | `Content/WX_Core/CardSystem/` | [ ] |
| `BP_CardManager` | Blueprint Actor | `Content/WX_Core/CardSystem/` | [ ] |
| `BPC_HandComponent` | Blueprint Component | `Content/WX_Core/CardSystem/` | [ ] |
| `BPC_DeckComponent` | Blueprint Component | `Content/WX_Core/CardSystem/` | [ ] |
| `BPC_DiscardComponent` | Blueprint Component | `Content/WX_Core/CardSystem/` | [ ] |
| `BP_TurnManager` | Blueprint Actor | `Content/WX_Core/BattleSystem/` | [ ] |
| `WX_CardStateComponent` | C++ ActorComponent | `Source/WuXia3DCard/CardSystem/` | [ ] |
| `WBP_HandArea` | UMG Widget | `Content/WX_UI/Battle/` | [ ] |
| `WBP_TurnIndicator` | UMG Widget | `Content/WX_UI/Battle/` | [ ] |
| `DT_Cards`（15条完整数据） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `L_Test_CardFlow` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. CardBase
- [ ] `BP_CardBase`：持有 CardID（FName），BeginPlay 时从 DT_Cards 读取属性
- [ ] 拖拽逻辑：手牌区拖拽 → 拖至出牌区域 → 释放触发出牌
- [ ] 悬停高亮：鼠标悬停时卡牌轻微上浮（Z位移动画）
- [ ] `WX_CardStateComponent`（C++）：枚举状态机 `InHand/OnField/InDiscard/Selected/Dead`，提供 `TransitionTo(EState)` 接口

### 2. CardManager
- [ ] `BP_CardManager`：初始化时从 DataTable 按 DeckID 构建牌库（BPC_DeckComponent）
- [ ] `DrawCards(Count, PlayerID)`：从牌库顶取 N 张放入手牌；牌库空→触发 `OnDeckEmpty` 事件
- [ ] `PlayCard(CardRef, TargetRef)`：验证 ManaCost ≤ CurrentMana；扣 Mana；Card 进入 OnField 状态；触发 `OnCardPlayed` Dispatcher
- [ ] `DiscardCard(CardRef)`：移入弃牌堆；触发 `OnCardDiscarded` Dispatcher
- [ ] 手牌超限检测：手牌 > 7 时触发 `OnHandOverflow`，等待玩家选弃

### 3. TurnManager
- [ ] 状态机：`TurnStart → PlayCards → TurnEnd → SwitchTurn`（先跳过 BattleResolve，M3再接入）
- [ ] 回合开始：灵力重置+1（上限10）；调用 `CardManager::DrawCards(1)`（先手首回合跳过）
- [ ] 30秒计时器：超时自动触发 `EndTurn()`
- [ ] 事件广播：`OnTurnPhaseChanged(Phase, PlayerID)` → WBP_TurnIndicator 更新显示
- [ ] 「结束回合」按钮绑定：PlayerController → TurnManager::EndTurn()

### 4. 手牌UI
- [ ] `WBP_HandArea`：接收 `OnCardPlayed/OnCardDrawn` 事件，刷新手牌列表显示
- [ ] 手牌扇形排列（简化版：等间距水平排列，后续M3优化为3D悬浮扇形）
- [ ] `WBP_TurnIndicator`：显示"我方回合 / 敌方回合" + 倒计时数字

### 5. DataTable 扩充
- [ ] `DT_Cards` 填满15条数据（灵将6张/符箓5张/文脉卡4张），每条包含完整字段

### 6. 测试地图
- [ ] `L_Test_CardFlow`：放置 CardManager + TurnManager；PIE可执行：抽牌 → 出牌 → 回合切换 → 回合超时自动跳过

---

## 验收标准

- [ ] PIE 中可抽初始4张手牌（显示在 WBP_HandArea）
- [ ] 拖拽出牌成功：Mana 正确扣减，手牌移除
- [ ] 弃牌时手牌更新
- [ ] 回合切换正常（TurnIndicator 更新）
- [ ] 30秒超时自动结束回合
- [ ] 牌库耗尽时 Output Log 输出 `DeckEmpty` 提示
- [ ] Output Log 零 Warning / 零 Error

---

## Demo 录制说明

录制 GIF（时长 ≤ 15秒）：展示完整抽牌→出牌→回合切换流程。  
放置于：`docs/engineering/MILESTONES/M2/demo/`

---

*版本：v0.1 | 2026-04-30*
