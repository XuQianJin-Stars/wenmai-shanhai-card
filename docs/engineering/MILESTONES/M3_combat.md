# M3_combat.md — Milestone 3：基础战斗 + AI出牌

**目标**：基础战斗伤害结算跑通 + AI可以自主出牌  
**阶段对应**：ROADMAP Sprint 2-1 / Sprint 1-4（AI基础）  
**版本**：v0.1 | 维护人：engineer  
**前置依赖**：M2_card_flow 验收通过  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `BP_BattleResolver` | Blueprint Actor | `Content/WX_Core/BattleSystem/` | [ ] |
| `BP_TargetingSystem` | Blueprint Actor | `Content/WX_Core/BattleSystem/` | [ ] |
| `BP_EffectStack` | Blueprint Actor | `Content/WX_Core/BattleSystem/` | [ ] |
| `WX_AIController` | Blueprint（继承AIController） | `Content/WX_Core/AISystem/` | [ ] |
| `BT_EnemyAI_Basic` | 行为树 | `Content/WX_Core/AISystem/` | [ ] |
| `BB_EnemyAI` | Blackboard | `Content/WX_Core/AISystem/` | [ ] |
| `BTTask_PlayCard` | BT Task | `Content/WX_Core/AISystem/` | [ ] |
| `BTTask_DeclareAttack` | BT Task | `Content/WX_Core/AISystem/` | [ ] |
| `BTService_EvalHand` | BT Service | `Content/WX_Core/AISystem/` | [ ] |
| `WBP_HPManaBar` | UMG Widget | `Content/WX_UI/Battle/` | [ ] |
| `S_WX_Effect` | BP Struct | `Content/WX_Data/Structs/` | [ ] |
| `L_Test_Combat` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. 战斗结算（BattleResolver）
- [ ] `BP_BattleResolver::ResolveBattle(AttackerRef, DefenderRef)`：
  - 读取 ATK/DEF 基础值
  - 卡牌类型克制修正（灵将克符箓、符箓克文脉、文脉克灵将，×1.2 / DEF×0.8）
  - 五行克制修正（ATK×1.2 / DEF×0.8，两种叠加上限×1.44）
  - 最终伤害 = Max(1, FinalATK - FinalDEF)
  - 扣减 DefenderHP；HP≤0 → 触发 `OnCardDeath(CardRef)`
- [ ] 反击判定：防守方存活 且有 `WX.Tag.Counterattack` Tag → 防守方对攻击方造成等量 DEF 伤害
- [ ] 主将伤害：攻击目标为主将时，直接扣 GameState 中的 PlayerHP / EnemyHP

### 2. 目标选择（TargetingSystem）
- [ ] 进入目标选择模式：高亮所有可选目标（敌方灵将 + 主将）
- [ ] 鼠标点击目标 → 触发 `OnTargetSelected(TargetRef)` → 通知 BattleResolver
- [ ] 按 Esc 或右键取消目标选择

### 3. 效果堆栈（EffectStack）
- [ ] 管理 `TArray<S_WX_Effect>` 效果列表
- [ ] `ApplyEffect(Effect)`：添加到堆栈并立即执行（Buff/Debuff）
- [ ] 每回合结束：遍历堆栈，Duration -1，Duration=0 时移除并广播 `OnEffectExpired`
- [ ] 支持状态：`Stun`（本回合无法攻击/技能）、`Seal`（无法使用主动技能）、`Buff_ATK/DEF`（数值加成）

### 4. AI系统（基础版）
- [ ] `BB_EnemyAI`：黑板变量：`HandCards`（手牌列表）、`BestCardToPlay`（出牌选择）、`AttackTarget`（攻击目标）、`CurrentMana`
- [ ] `BTService_EvalHand`：每次AI回合更新黑板，为每张手牌计算「价值分」（ManaCost≤CurrentMana且可克制得分高）
- [ ] `BTTask_PlayCard`：取 BestCardToPlay → 调用 CardManager::PlayCard()；Mana不足时 Fail
- [ ] `BTTask_DeclareAttack`：场上有灵将 → 选优先目标（有反击标签的主将最后打）→ 调用 BattleResolver
- [ ] `BT_EnemyAI_Basic` 行为树结构：
  ```
  Root → Selector
    ├─ Sequence [出牌] → BTService_EvalHand → BTTask_PlayCard（Loop直到Mana不足）
    └─ Sequence [攻击] → BTTask_DeclareAttack（场上所有灵将各攻击一次）→ EndTurn
  ```

### 5. HP / Mana UI
- [ ] `WBP_HPManaBar`：分玩家/敌方两组，绑定 GameState 变量，实时更新
- [ ] HP 变化时播放简单数字跳动动画（+/-X）

### 6. 测试地图
- [ ] `L_Test_Combat`：玩家 vs AI 完整对局，含胜负判定（HP≤0弹出结算提示）

---

## 验收标准

- [ ] 玩家出牌攻击：伤害按克制公式正确扣减，Output Log 打印计算过程
- [ ] 反击机制生效
- [ ] AI 可自主出牌并攻击（每回合有效行动）
- [ ] 双方 HP 在 WBP_HPManaBar 实时更新
- [ ] 一方 HP≤0 触发游戏结束流程（简单弹窗即可）
- [ ] 效果 Duration 每回合递减，到期移除
- [ ] Output Log 零 Warning / 零 Error
- [ ] `L_Test_Combat` 可完整跑完一局（玩家胜/负均可）

---

## Demo 录制说明

录制 GIF（时长 ≤ 20秒）：展示完整一局对战（玩家出牌→攻击→AI回合出牌攻击→HP变化）。  
放置于：`docs/engineering/MILESTONES/M3/demo/`

---

*版本：v0.1 | 2026-04-30*
