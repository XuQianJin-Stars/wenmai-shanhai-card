# ARCHITECTURE.md — 《文脉·山海卡》模块架构设计

**项目**：文脉·山海卡（Wenmai Shanhai Card）  
**引擎**：UE5.7.4（2026-03-10 官方 Hotfix，已确认正式稳定版本）（蓝图优先 + Card Games Template）  
**版本**：v0.2  
**维护人**：engineer  

---

## 一、整体架构原则

1. **蓝图优先**：所有游戏逻辑默认用 Blueprint 实现，仅在蓝图力不从心时写 C++（如卡牌状态机核心、序列化）。
2. **数据驱动**：卡牌属性、技能参数、羁绊配置、关卡数据全部通过 DataTable 驱动，代码零硬编码。
3. **单一职责**：每个 Blueprint 类/组件只做一件事，保持高内聚低耦合。
4. **命名前缀**：所有项目资产使用 `WX_` 前缀（见 CODING_CONVENTIONS.md）。
5. **复用 Card Games Template**：优先扩展模板类，不重复造轮子。

---

## 二、目录结构

```
Content/
├── WX_Core/
│   ├── GameFramework/       # GameMode, GameState, PlayerController
│   ├── CardSystem/          # CardBase, CardManager, Hand, Deck, Discard
│   ├── BattleSystem/        # TurnManager, Targeting, Resolver, EffectStack
│   ├── BondSystem/          # BondDetector, BondEffects
│   ├── ResonanceSystem/     # ResonanceDetector, WuXingBarrier
│   ├── AISystem/            # BT, EQS, AIController, Evaluators
│   ├── NarrativeSystem/     # DialogueManager, StoryFlow, CinematicTrigger
│   └── Progression/         # UpgradeManager, FragmentManager, SaveGame
├── WX_UI/
│   ├── Battle/              # HUD, HandArea, SkillBar, HPBar, ManaBar
│   ├── Menus/               # MainMenu, PauseMenu, CardDetail
│   ├── Popup/               # BondPopup, CultureStory, Upgrade
│   └── Common/              # WX_ButtonBase, WX_PanelBase
├── WX_Art/
│   ├── Cards/               # SM_Card_*, T_Card_*, M_Card_*
│   ├── Scenes/              # L_KunlunXu, L_GuXiTai, L_ShuZhai
│   ├── VFX/                 # NS_Skill_*, NS_Bond_*, NS_Resonance_*
│   └── Characters/          # SK_*, ABP_*, AnimSequences
├── WX_Data/
│   ├── DataTables/          # DT_Cards, DT_Skills, DT_Bonds, DT_Resonance, DT_Levels, DT_Dialogues
│   └── Structs/             # FCardData, FSkillData, FBondData 等（C++ Struct 或 BP Struct）
└── WX_Maps/
    ├── L_MainMenu
    ├── L_Battle_KunlunXu
    ├── L_Battle_GuXiTai
    ├── L_Battle_ShuZhai
    └── L_Test_*/            # 各系统独立测试地图

Source/
└── WuXia3DCard/
    ├── Core/                # AGameMode, AGameState, APlayerController 子类（轻量C++壳）
    ├── CardSystem/          # FCardState 状态机（C++核心，蓝图可调用）
    └── Serialization/       # USaveGame 子类、存档序列化
```

---

## 三、模块详细设计

### 3.1 GameFramework（游戏框架）

| 类名 | 类型 | 职责 |
|------|------|------|
| `WX_GameMode` | Blueprint（继承 GameMode） | 决定对战规则；初始化 TurnManager、CardManager；处理胜负判定 |
| `WX_GameState` | Blueprint（继承 GameState） | 持有全局对战状态：当前回合、双方HP/Mana、胜负标志 |
| `WX_PlayerController` | Blueprint（继承 PlayerController） | 处理输入映射（Enhanced Input）；转发操作到手牌/场上选择逻辑 |
| `WX_AIController` | Blueprint（继承 AIController） | 运行行为树 BT_EnemyAI；向 CardManager 提交出牌决策 |

**关键事件流**：
```
BeginPlay
  → WX_GameMode::InitBattle()
      ├─ 创建 TurnManager、CardManager
      ├─ 双方洗牌并发初始手牌（4张）
      └─ 决定先后手 → TurnManager::StartTurn()
```

---

### 3.2 CardSystem（卡牌系统）

#### 3.2.1 CardBase

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_CardBase` | Blueprint Actor | 单张卡牌实体；持有 FCardState（HP/ATK/DEF/Mana cost/Tags）；处理拖拽/放置输入 |
| `WX_CardStateComponent` | C++ ActorComponent | 卡牌状态机：待机/手牌/场上/弃牌/选中/阵亡；仅状态转换逻辑在C++，效果触发回调蓝图 |

**CardBase 核心接口（蓝图可重写）**：
- `OnSummoned()` — 入场时调用，触发召唤特效
- `OnAttack(Target)` — 发起攻击
- `OnDeath()` — 阵亡，触发离场效果后移入弃牌堆
- `OnBuffApplied(BuffData)` / `OnBuffRemoved(BuffData)`
- `GetCardTags()` → `TArray<FGameplayTag>`

#### 3.2.2 CardManager

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_CardManager` | Blueprint Actor（单例，GameMode持有） | 管理牌库/手牌/弃牌堆；处理抽牌/出牌/弃牌；广播卡牌区域变化事件 |

**关键方法**：
- `DrawCards(Count, PlayerID)` — 从牌库抽取N张到手牌
- `PlayCard(CardRef, TargetRef)` — 手牌→场上，触发费用扣减和召唤
- `DiscardCard(CardRef)` — 手牌/场上→弃牌堆
- `ShuffleDeck(PlayerID)` — 洗牌

#### 3.2.3 Hand / Deck / Discard

| 类名 | 类型 | 职责 |
|------|------|------|
| `WX_HandComponent` | Blueprint Component（挂 PlayerController） | 管理手牌数组；处理手牌布局（3D悬浮扇形排列）；手牌上限检测（>7张→弃牌） |
| `WX_DeckComponent` | Blueprint Component | 持有洗牌后的卡牌索引列表；提供 TopCard / IsEmpty 接口 |
| `WX_DiscardComponent` | Blueprint Component | 弃牌堆记录；提供查询接口供羁绊/共鸣检测 |

---

### 3.3 BattleSystem（战斗系统）

#### 3.3.1 TurnManager

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_TurnManager` | Blueprint Actor | 维护回合状态机（回合开始→出牌→战斗结算→回合结束→切换）；管理30秒回合计时器；广播回合阶段变化事件 |

**回合状态枚举** `EWX_TurnPhase`：
```
TurnStart → PlayCards → BattleResolve → TurnEnd → SwitchTurn
```

**关键事件（Blueprint Dispatcher）**：
- `OnTurnPhaseChanged(Phase, PlayerID)`
- `OnTurnTimeout(PlayerID)` — 超时自动跳过出牌

#### 3.3.2 Targeting

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_TargetingSystem` | Blueprint Actor | 管理目标选择逻辑；高亮可选目标；处理「选目标」鼠标/触摸输入；广播 `OnTargetSelected(TargetRef)` |

目标优先级规则（由 DT_Cards 中 TargetType 字段驱动）：
- `AnyEnemy`：敌方灵将 or 主将
- `AllEnemies`：场上所有敌方
- `Ally`：己方灵将
- `Self`：自身

#### 3.3.3 Resolver（结算器）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_BattleResolver` | Blueprint Actor | 执行战斗结算流程：ATK计算→DEF计算→伤害扣减→死亡判断→反击判定 |

**结算公式**（见 CORE_LOOP.md 五行克制矩阵）：
```
FinalATK = BaseATK × CardTypeMultiplier × WuXingMultiplier × BondBonus
FinalDEF = BaseDEF × ResonanceBarrierBonus
Damage    = Max(1, FinalATK - FinalDEF)   // 最低1点穿透
```

#### 3.3.4 EffectStack（效果堆栈）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_EffectStack` | Blueprint Actor | 管理所有持续效果（增幅/眩晕/封印/五行结界）；每回合结束 Tick 计时器；效果失效时广播事件 |

**效果数据结构** `FWX_Effect`：
```
EffectType  : EWX_EffectType   (Stun / Seal / Buff / Barrier)
Value       : float            (数值，如DEF+3)
Duration    : int32            (剩余回合数)
SourceCardID: FName
TargetCardID: FName
```

---

### 3.4 BondSystem（羁绊系统）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_BondDetector` | Blueprint Component（挂 CardManager） | 每次场上卡牌变化时，遍历 DT_Bonds 检测羁绊组是否完整激活；激活/失效时广播事件 |
| `BP_BondEffectHandler` | Blueprint Actor | 接收羁绊激活事件，从 DT_Bonds 读取效果，提交给 EffectStack；向 UI 广播弹窗事件；向 NarrativeSystem 广播文化故事解锁 |

**触发时机**：
1. 打出灵将卡 / 文脉卡后
2. 灵将阵亡后（检测羁绊是否失效）

**DT_Bonds 驱动**：羁绊条件、效果描述、文化故事 Key、特效资产引用全部存于数据表，无需修改蓝图即可添加新羁绊。

---

### 3.5 ResonanceSystem（五行共鸣系统）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_ResonanceDetector` | Blueprint Component（挂 CardManager） | 每次打出符箓卡后，检测本局已打符箓的五行标签集合；集齐金木水火土 → 触发五行结界 |
| `BP_WuXingBarrier` | Blueprint Actor | 执行五行结界效果（全场DEF+2，主将减伤1点持续2回合）；提交到 EffectStack |

**触发条件（ENG-BLK-001，已更新）**：
- 检测范围：**本局累计**打出的符箓卡五行标签集合（非单回合内）
- 触发门槛：金木水火土五行各至少打出 **≥1 张** 符箓卡（共5种全覆盖）
- 每局触发次数：**1次**（已触发后不再重复检测）
- 效果：全场 DEF+2 + 主将减伤1点，持续2回合（纯防御，见 RESONANCE.md v1.1 §2.1）

> **与旧逻辑的区别**：旧逻辑为「同回合打出3种五行符箓」，已废弃。新逻辑跨回合累计，门槛更高但更公平，与 CORE_LOOP_v2 v1.1 / RESONANCE v1.1 对齐。

**五行标签**（GameplayTag）：
```
WX.Element.Metal / Wood / Water / Fire / Earth
```

---

### 3.6 AISystem（AI系统）

| 资产 | 类型 | 职责 |
|------|------|------|
| `BT_EnemyAI_Basic` | 行为树 | M1阶段：优先打出克制牌 → 随机出牌 → 宣布攻击 |
| `BT_EnemyAI_Enhanced` | 行为树 | M3阶段：理解羁绊、共鸣价值；优先组合克制+共鸣 |
| `BTService_EvalHand` | 行为树服务 | 每次AI回合开始时，评估手牌中各卡牌的「出牌价值分」 |
| `BTTask_PlayCard` | 行为树任务 | 选择价值最高的卡牌调用 CardManager::PlayCard() |
| `BTTask_DeclareAttack` | 行为树任务 | 选择最优攻击目标（优先攻主将/优先打带增益的卡） |
| `EQS_TargetPriority` | EQS查询 | 计算敌方目标优先级分 |

**AI评分维度**（`BTService_EvalHand`）：
- Mana可负担性（负担不起=0分）
- 克制加成（目标存在被克制卡+权重）
- 五行共鸣进度（缺少的五行标签+权重）
- 羁绊激活机会（+高权重）

---

### 3.7 UI（UMG界面系统）

| 类名 | 位置 | 职责 |
|------|------|------|
| `WBP_BattleHUD` | WX_UI/Battle/ | 战斗主HUD容器；持有手牌区/文脉区/技能区/血量/能量/回合计时 |
| `WBP_WenMaiZone` | WX_UI/Battle/ | **文脉横条**（新增，已拍板）：位于 WBP_HandArea 正上方独立横条；最多容纳 6 张文脉卡；超出时触发弃牌选择UI；与手牌区独立计数 |
| `WBP_HandArea` | WX_UI/Battle/ | 手牌区：3D卡牌悬浮扇形排列；拖拽出牌交互；手牌上限 7 张 |
| `WBP_SkillBar` | WX_UI/Battle/ | 技能释放区：已激活技能图标列表；点击触发 Targeting |
| `WBP_HPManaBar` | WX_UI/Battle/ | 双方HP/Mana显示；中式纹样边框 |
| `WBP_TurnIndicator` | WX_UI/Battle/ | 回合归属 + 30秒倒计时 |
| `WBP_BondPopup` | WX_UI/Popup/ | 羁绊激活弹窗；展示羁绊名称+文化故事 |
| `WBP_CultureStory` | WX_UI/Popup/ | 文化小故事详情面板 |
| `WBP_CardDetail` | WX_UI/Menus/ | 卡牌详情：3D旋转展示 + 属性 + 技能 + 文化故事 |
| `WBP_MainMenu` | WX_UI/Menus/ | 主菜单：故事模式/休闲对战/卡牌集/设置 |
| `WBP_UpgradePanel` | WX_UI/Popup/ | 升阶界面：碎片数量 + 升阶按钮 + 升阶后预览 |

**HUD 战斗层级（最新，2026-04-30 拍板）**：
```
HUD_BattleOverlay
  ├─ WBP_CombatArea       // 中央战斗区（灵将/符箓动效主体）
  ├─ WBP_WenMaiZone       // 文脉横条（新增）
  │    宽度：与 WBP_HandArea 等宽
  │    高度：WBP_HandArea 高度的 40–50%
  │    maxSlots = 6（超出触发 WBP_WenMai_DiscardPicker）
  ├─ WBP_HandArea         // 底部手牌区
  ├─ WBP_HPManaBar
  ├─ WBP_SkillBar
  ├─ WBP_TurnIndicator
  └─ WBP_BondPopup
```

> **执行备注（engineer）**：将 WBP_WenMaiZone Widget 加入 HUD_BattleOverlay，位于 WBP_HandArea 正上方，M1-Sprint1-1 完成。材质规格见 docs/tech_art/SHADERS/card_material.md §九。

**UI通信模式**：UI不直接引用游戏逻辑类，统一通过 `GameState` 上的 Event Dispatcher 或 Blueprint Interface 接收数据更新（单向数据流）。

---

### 3.8 Progression（成长系统）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_FragmentManager` | Blueprint Actor | 管理「文脉碎片」的收集与消耗；读写 SaveGame |
| `BP_CardUpgradeManager` | Blueprint Actor | 验证升阶条件（碎片数量）；执行升阶：更新卡牌DataTable记录指针 → 切换3D模型/解锁技能 |
| `WX_SaveGame` | C++ USaveGame子类 | 存储玩家数据：卡牌收藏、碎片数量、关卡进度、已解锁故事；JSON序列化（无裸SQL/字符串拼接） |

**升阶等级**：凡品（Lv1）→ 珍品（Lv2）→ 极品（Lv3）  
每级属性提升 ≤5%，Lv2解锁专属技能。

---

### 3.9 NarrativeSystem（叙事系统）

| 类名 | 类型 | 职责 |
|------|------|------|
| `BP_DialogueManager` | Blueprint Actor | 读取 DT_Dialogues；按对话节点序列驱动 UMG 对话窗口；播放角色动作（AnimMontage） |
| `BP_StoryFlowController` | Blueprint Actor | 管理故事模式关卡序列；触发关卡解锁、剧情过场（Cinematic）、奖励发放 |
| `BP_CinematicTrigger` | Blueprint Actor | 关卡内触发器；播放 Level Sequence（简单3D过场动画） |
| `WBP_DialogueBox` | UMG Widget | 对话框UI：角色立绘区 + 对话文本区 + 下一句按钮 |

**对话驱动方式**：`DT_Dialogues` 中每行记录一个对话节点（SpeakerID、Text、AnimTag、NextNodeID），`BP_DialogueManager` 按 NextNodeID 链式播放，无需修改蓝图即可扩展剧情。

### 3.10 AudioSystem（音频系统）

音频系统由 audio 成员负责设计，工程模块负责接入点和触发事件。

| 类名 | 位置 | 职责 |
|------|------|------|
| `BP_WuxiaAudioManager` | GameState Component | 订阅所有 `Audio.*` GameplayTag 事件；管理 BGM 交叉淡入淡出；剖分播放 SFX、UI音效、个人特效音 |
| `BP_CombatIntensityComponent` | ActorComponent（挂 `WX_GameState`） | 每回合计算战斗紧张度（`IntensityLevel 0~1.0`）；HP差、回合数、羁绊状态定权重输出；向 AudioManager 广播 `Audio.BGM.IntensityUpdate`；提供 `TemporaryIntensityBoost` 接口供 BondSystem/ResonanceSystem 调用 |

**BP_CombatIntensityComponent 接口补充（AU-MED-001，2026-04-30）**：

```
TemporaryIntensityBoost(delta: float, duration: float)
  - delta    : 紧张度提升幅度（0.0–1.0），叠加到当前 IntensityLevel
  - duration : 持续时长（秒），超时后线性回退至原始值
  - 触发时机 : BondSystem 激活羁绊效果时 / ResonanceSystem 触发五行结界时
  - 用途     : BGM MetaSound 分层短暂提升 Stem 音量（由 BP_WuxiaAudioManager 订阅
               Audio.BGM.IntensityUpdate 响应）
  - 上限保护 : IntensityLevel 最终 Clamp(0.0, 1.0)，不超出范围
```

> **调用示例（蓝图）**：
> ```
> // 在 BP_BondEffectHandler 激活羁绊时
> CombatIntensityComp → TemporaryIntensityBoost(delta=0.25, duration=4.0)
> // 在 BP_WuXingBarrier 触发五行结界时
> CombatIntensityComp → TemporaryIntensityBoost(delta=0.35, duration=6.0)
> ```

**Sound Class 树结构**（详见 docs/audio/IMPLEMENTATION.md 第二章）：
```
SC_Master
├── SC_Music
├── SC_SFX
│   ├── SC_SFX_Card
│   └── SC_SFX_Skill
├── SC_UI
├── SC_Voice
└── SC_Ambient
```

**GameplayTag 音频事件订阅层级**（全部以 `Audio.*` 为前缀，与工程 `WX_` 前缀区分）：
- `Audio.BGM.*` — BGM 控制（发送方：GameMode/TurnManager）
- `Audio.SFX.UI.*` — UI 音效（发送方：CardManager/TurnManager/ManaSystem）
- `Audio.SFX.Card.*` — 卡牌召唤音效（发送方：CardAnimController）
- `Audio.SFX.Combat.*` — 战斗命中/亡両音效（发送方：BP_BattleResolver）
  - `Audio.SFX.Combat.WuxingCrit` — 五行克制命中专用音效事件（发送方：BP_BattleResolver，参数见下方）
- `Audio.SFX.Skill.*` — 技能音效（发送方：SkillSystem）
- `Audio.SFX.Bond.*` / `Audio.SFX.Resonance.*` — 羁绊/共鸣音效（发送方：BondSystem/ResonanceSystem）
- `Audio.Ambient.*` — 场景环境音（发送方：SceneManager）

**BP_BattleResolver 五行克制音效事件广播（2026-04-30 补充）**：

当五行克制命中时，`BP_BattleResolver` 在结算完伤害后广播以下 GameplayTag 事件：

```
GameplayTag : Audio.SFX.Combat.WuxingCrit
参数：
  AttackerElement  : EWuXingElement   // 攻击方五行（Metal/Wood/Water/Fire/Earth）
  ImpactIntensity  : float            // 冲击强度，取值 0.0–1.0
                                      // 建议计算：Damage / MaxExpectedDamage，Clamp(0,1)
触发条件 : 仅当本次攻击存在五行克制加成（×1.3倍率）时才广播
接收方   : BP_WuxiaAudioManager → 订阅此事件后，按 AttackerElement 选取对应
           五行克制音效资产，按 ImpactIntensity 缩放播放音量
```

> **蓝图实现建议**：在 BattleResolver 结算公式计算完 WuXingMultiplier 后，判断是否 > 1.0，若是则通过 GameplayMessageSubsystem（或 Event Dispatcher）广播带上述参数的事件。

**MetaSound BGM 分层**：每首战斗 BGM 需要均为即长/5个独立 Stem 音频文件（L0–L4）。音频文件导入由 engineer 负责放入 `Content/Audio/BGM/Layers/`，技美管线见 PIPELINE.md。

---



各系统通过以下方式解耦通信，不直接持有对方引用：

| 通信方式 | 使用场景 |
|----------|----------|
| **Event Dispatcher**（蓝图） | 跨Actor广播：如 TurnManager→UI、BondDetector→UI |
| **Blueprint Interface** | 跨层调用：UI→GameLogic（如点击卡牌→CardManager） |
| **GameplayTag** | 状态标签传递（五行属性、卡牌类型、状态效果） |
| **GameState（共享状态）** | UI轮询读取双方HP/Mana/回合信息 |

---

## 五、C++ 最小化原则

仅在以下情况写 C++，其余全用蓝图：

| C++ 必要场景 | 类/文件 |
|---|---|
| 卡牌状态机核心（防止蓝图循环引用） | `WX_CardStateComponent.h/cpp` |
| SaveGame 序列化（USaveGame 子类） | `WX_SaveGame.h/cpp` |
| GameplayTag 定义宏 | `WX_GameplayTags.h` |
| 性能热点（EffectStack大量Tick时） | 按需，仅在Profile确认后 |

---

## 六、关键依赖关系图

```
WX_GameMode
  ├─ BP_TurnManager          (管理回合节奏)
  ├─ BP_CardManager          (管理所有卡牌)
  │    ├─ WX_HandComponent   (玩家/AI手牌)
  │    ├─ WX_DeckComponent   (牌库)
  │    ├─ WX_DiscardComponent(弃牌堆)
  │    ├─ BP_BondDetector    (检测羁绊)
  │    └─ BP_ResonanceDetector(检测五行共鸣)
  ├─ BP_BattleResolver       (战斗结算)
  ├─ BP_EffectStack          (持续效果管理)
  ├─ BP_TargetingSystem      (目标选择)
  ├─ BP_StoryFlowController  (故事模式)
  └─ WX_GameState            (全局状态，UI读取)
       └─ EventDispatchers → WBP_BattleHUD
```

---

## 七、测试地图规范

每个新系统上线后，须在 `WX_Maps/` 下创建独立测试地图：

| 测试地图 | 覆盖系统 |
|----------|----------|
| `L_Test_RotatingCard` | BP_CardDemo_Actor 旋转水墨卡牌 PoC（见 MILESTONES/PoC/PoC1_RotatingCard.md） |
| `L_Test_CardDraw` | CardManager抽牌/弃牌 |
| `L_Test_Battle` | TurnManager + Resolver |
| `L_Test_Bond` | BondDetector + BondEffectHandler |
| `L_Test_Resonance` | ResonanceDetector + WuXingBarrier |
| `L_Test_AI` | BT_EnemyAI全流程 |
| `L_Test_Save` | SaveGame读写 |
| `L_Test_Dialogue` | DialogueManager |

**上线标准**（24小时内）：
- [ ] Output Log 零 Warning / 零 Error
- [ ] 附至少1组 DataTable 测试数据
- [ ] 对应测试地图可一键复现功能

---

---

**变更记录（v0.3，2026-04-30）**：
- ENG-BLK-001：BP_WuXingBarrier 触发条件更新为「本局累计打出全部5种五行符箓各≥1张」，与 CORE_LOOP_v2 v1.1 / RESONANCE v1.1 对齐
- WBP_WenMaiZone 新增至 §3.7 UI 模块及 HUD 层级结构（maxSlots=6，HandArea 正上方）
- §3.10 AudioSystem：BP_CombatIntensityComponent 补充 TemporaryIntensityBoost 接口（羁绊/共鸣激活时调用）
- §3.10 AudioSystem：BP_BattleResolver 新增 Audio.SFX.Combat.WuxingCrit 事件广播（五行克制命中）
- §七 测试地图新增 L_Test_RotatingCard（PoC Demo）

*版本：v0.3 | 创建日期：2026-04-30 | 最后更新：2026-04-30 | 维护人：engineer*
