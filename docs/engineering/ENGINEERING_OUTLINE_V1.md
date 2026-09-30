# ENGINEERING_OUTLINE_V1.md — 《文脉·山海卡》工程架构 Outline

**版本**：v1.0  
**维护人**：engineer  
**对齐文档**：ARCHITECTURE.md v0.1 / DATA_TABLES.md v0.1 / ROADMAP.md / PERF_BUDGET.md v0.2

---

## 一、Card Games Template 适配评估

### 1.1 模板能力概览

UE5 Marketplace「Card Games Template」提供以下开箱即用能力：

| 功能模块 | 模板提供程度 | 适配策略 |
|---------|------------|---------|
| 卡牌创建/分发/回收 Blueprint | ★★★ 完整 | 直接继承扩展，新增文脉/符箓/灵将类型判断节点 |
| 3D 卡牌拖拽交互 | ★★★ 完整 | 直接复用，叠加 Chaos 物理推动效果 |
| 回合制状态机框架 | ★★ 半完整 | 基础可用，需扩展 TurnPhase 枚举（补 BattleResolve 阶段） |
| 手牌扇形排列布局 | ★★★ 完整 | 直接复用，调整为中式悬浮卡牌视觉风格 |
| AI 出牌逻辑 | ★ 基础随机 | 以行为树重写，集成克制/羁绊/共鸣评分维度 |
| 胜负判定 | ★★ 基础 | 扩展为主将 HP 归零触发，加叙事解锁钩子 |
| 多人联机框架 | ★★ 骨架 | MVP 阶段禁用，预留接口待后续迭代 |

**结论**：模板可覆盖约 60% 的基础卡牌交互逻辑，节省 M1 阶段约 3–4 周开发量。核心扩展点集中在羁绊/共鸣/AI 三个模块，均已在 ARCHITECTURE.md 中给出详细蓝图设计。

### 1.2 关键适配风险

| 风险点 | 风险等级 | 应对 |
|--------|---------|------|
| 模板卡牌数据结构与 FWX_CardRow 不兼容 | 中 | M0 第一周读取模板源码，决定继承还是替换 DataModel |
| 模板硬编码 2D UI 手牌区，3D 悬浮扇形需重写 | 中 | WBP_HandArea 参考模板逻辑重新实现，保留交互蓝图节点 |
| 模板回合计时器无超时自动结算 | 低 | TurnManager 扩展 30s 计时器 + OnTurnTimeout 事件 |

---

## 二、DataTable 结构设计要点

详细字段定义见 DATA_TABLES.md，此处汇总关键设计决策：

### 2.1 七张核心数据表

| 表名 | 行结构 | 用途 |
|------|--------|------|
| DT_Cards | FWX_CardRow | 卡牌全量属性（类型/五行/费用/ATK/DEF/HP/技能/模型/贴图） |
| DT_Skills | FWX_SkillRow | 技能效果（类型/目标/数值/持续时间/特效/音效） |
| DT_Bonds | FWX_BondRow | 文脉羁绊定义（激活条件/效果/文化故事/特效） |
| DT_Resonance | FWX_ResonanceRow | 五行共鸣定义（集齐条件/结界效果/持续回合） |
| DT_Levels | FWX_LevelRow | 故事模式关卡（场景/AI牌组/奖励/解锁条件） |
| DT_Dialogues | FWX_DialogueRow | 对话节点（链式，支持分支/自动前进/故事解锁） |
| DT_EnemyDecks | FWX_EnemyDeckRow | AI预设牌组（CardID + Count 数组） |

### 2.2 关键设计原则

- **零硬编码**：所有卡牌属性、技能参数、羁绊配置均从 DataTable 读取，代码层不出现魔法数字
- **软引用资产**：模型/特效/贴图均使用 `TSoftObjectPtr` 软引用，懒加载，避免对局初始化时全量加载
- **GameplayTag 驱动**：五行属性、羁绊标签、技能条件均用 `FGameplayTag`，避免 string 比较
- **M1 阶段交付物**：20 张核心卡牌的 DT_Cards CSV 初始数据，3 组羁绊的 DT_Bonds 初始数据

---

## 三、蓝图架构：核心三大系统职责

### 3.1 CardManager — 卡牌状态枢纽

```
BP_CardManager（GameMode 持有，全局单例）
│
├── 持有：DeckComponent / HandComponent / DiscardComponent（×2，玩家+AI）
├── 持有：BondDetector / ResonanceDetector（Component，每次卡牌变化自动检测）
│
├── 核心方法
│   ├── DrawCards(Count, PlayerID)     → 抽牌到手牌
│   ├── PlayCard(CardRef, TargetRef)   → 手牌→场上，扣费用，触发召唤
│   ├── DiscardCard(CardRef)           → 移入弃牌堆
│   └── ShuffleDeck(PlayerID)         → 洗牌
│
└── 广播 EventDispatcher
    ├── OnFieldChanged(PlayerID)       → 触发 BondDetector / ResonanceDetector
    ├── OnCardPlayed(CardRef)          → 通知 TurnManager 扣出牌次数
    └── OnHandChanged(PlayerID)        → 通知 UI 更新手牌区
```

**职责边界**：CardManager 只管卡牌的"在哪里"（位置/所有权），不管"打了之后发生什么"（效果计算交给 BattleResolver/EffectStack）。

---

### 3.2 TurnManager — 回合节奏控制器

```
BP_TurnManager（GameMode 持有）
│
├── 状态机：EWX_TurnPhase
│   TurnStart → PlayCards → BattleResolve → TurnEnd → SwitchTurn → (回到 TurnStart)
│
├── 30s 计时器
│   └── OnTurnTimeout → 强制进入 BattleResolve（自动宣布结束出牌）
│
├── 核心方法
│   ├── StartTurn(PlayerID)           → 进入 TurnStart，发牌，重置 Mana
│   ├── EndPlayPhase(PlayerID)        → 玩家/AI 宣布结束出牌，进入 BattleResolve
│   ├── ResolveBattle()               → 调用 BattleResolver 执行结算序列
│   └── SwitchTurn()                  → 切换当前玩家，进入下一回合
│
└── 广播 EventDispatcher
    ├── OnTurnPhaseChanged(Phase, PlayerID)
    ├── OnTurnTimeout(PlayerID)
    └── OnBattleResolveComplete()      → 通知 UI 结算动画完毕，可继续操作
```

**职责边界**：TurnManager 只管"现在是谁的回合/什么阶段"，不管伤害计算。

---

### 3.3 BattleController（BattleResolver + EffectStack 组合）

```
BP_BattleResolver（GameMode 持有）
│
├── 结算公式（见 ARCHITECTURE.md §3.3.3）
│   FinalATK = BaseATK × CardTypeMultiplier × WuXingMultiplier × BondBonus
│   FinalDEF = BaseDEF × ResonanceBarrierBonus
│   Damage    = Max(1, FinalATK - FinalDEF)
│
├── 结算流程（顺序执行）
│   1. 读取场上双方卡牌
│   2. 查询 EffectStack 当前持续效果（Buff/Debuff/结界）
│   3. 按目标类型（AnyEnemy / AllEnemies 等）分配攻击
│   4. 执行 Damage → 扣 HP → 判断死亡 → 触发 OnDeath
│   5. 反击判定（带 Counterattack Tag 的灵将）
│   6. 广播 OnResolveComplete
│
└── BP_EffectStack（BattleResolver 依赖注入）
    ├── 持有当前所有持续效果（FWX_Effect 数组）
    ├── AddEffect(Effect)             → 新增效果
    ├── TickEffects()                 → 每回合结束递减 Duration，到期移除
    └── GetEffectsForTarget(CardID)   → 查询目标当前所有效果（供 Resolver 读取）
```

**职责边界**：BattleResolver 执行"一次结算序列"，EffectStack 维护"跨回合持续效果"。两者职责分离，避免 Resolver 持有跨帧状态。

---

## 四、PoC Demo 搭建条件确认

以下条件已全部满足，**工程可进入 M0 PoC Demo 阶段**：

| 条件 | 状态 | 来源 |
|------|------|------|
| VFX 视觉参数对齐 | ✅ 完成 | VFX_VISUAL.md v1.0 + particle_library.md v0.2 对应关系终稿 |
| LUT 参数确认 | ✅ 完成 | RENDER_PLAN.md v0.3 §5.3 五行色值已统一至 STYLE_GUIDE 矿物色板 |
| 场景技术参数无冲突 | ✅ 确认 | SCENE_DESIGN_v1.md ↔ RENDER_PLAN / PERF_BUDGET 核验通过（昆仑墟云雾粒子上限需调整至 ≤500，在 particle_library v0.2 中已注记） |
| 性能预算在红线内 | ✅ 确认 | 峰值粒子 ≤3000（战斗大招），Draw Call 峰值 ≤24（粒子部分），均在 PERF_BUDGET 红线内 |
| DataTable 结构 | ✅ 完成 | DATA_TABLES.md v0.1，7 张核心表 |
| 蓝图架构 | ✅ 完成 | ARCHITECTURE.md v0.1，CardManager/TurnManager/BattleResolver 职责清晰 |

### PoC Demo M0 交付物（优先级顺序）

1. **PoC-1：旋转水墨卡牌**
   - 场景：L_Test_CardDraw
   - 验收：20 张 Nanite 卡牌同屏，Draw Call ≤50，帧率 ≥55fps
   - 数据填入：PERF_BUDGET.md §十二 M0 实测数据表

2. **PoC-2：水墨后处理链**
   - 场景：任意测试关卡
   - 验收：LUT + InkWash PostProcess + Bloom 全链路，帧时间后处理部分 ≤2.5ms

3. **PoC-3：CardManager 抽牌/出牌闭环**
   - 场景：L_Test_Battle
   - 验收：玩家出牌 → 费用扣减 → BattleResolve → HP 变化，全链路无 Blueprint Error

---

## 五、当前已知风险与阻塞项

| 风险 | 等级 | 行动项 |
|------|------|--------|
| NS_TalismanGlow 需拆分为 Ribbon 书写轨迹系统 | 中 | particle_library v0.2 已记录，tech_artist M1 前完成 NS_Skill_FuluWrite |
| 昆仑墟场景云雾粒子预算超出战斗预算 | 低 | SCENE_DESIGN 昆仑墟场景云雾从 ≤3000 下调至 ≤500（仅限环境粒子），战斗粒子预算不受影响；待 art_director 确认 |
| DT_Skills 中符箓技能 Spline 资产配置方式 | 低 | M1 阶段与 art_director 对齐每个技能的 Spline Asset 命名规范 |

---

*版本：v1.0 | 创建日期：2026-04-30 | 维护人：engineer*
