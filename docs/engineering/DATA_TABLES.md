# DATA_TABLES.md — 《文脉·山海卡》DataTable 结构定义

**项目**：文脉·山海卡（Wenmai Shanhai Card）  
**引擎**：UE5.7.4（2026-03-10 官方 Hotfix，已确认为正式稳定版本）  
**版本**：v1.1  
**维护人**：engineer  

---

## 说明

所有数据表均使用 UE5 DataTable（CSV/JSON 导入），对应行结构体在 C++ 中定义（继承 `FTableRowBase`），蓝图直接读取，无需修改代码即可增删数据。资产路径：`Content/WX_Data/DataTables/`。

---

## 一、DT_Cards — 卡牌基础属性表

**结构体**：`FWX_CardRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Cards`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `CardID` | `FName` (Row Key) | 卡牌唯一ID（格式：LJ-001/FL-001/WM-001） | `LJ-001` |
| `CardName_CN` | `FText` | 中文名（支持本地化） | `盘古·开天` |
| `Faction` | `EWX_Faction` (枚举) | 阵营：`ShangGu`/`BaXian`/`FeiYi`/`DaoFa` | `ShangGu` |
| `CardType` | `EWX_CardType` (枚举) | 卡牌类型：`LingJiang`/`FuLu`/`WenMai` | `LingJiang` |
| `Cost` | `int32` | 出牌灵力费用（1–8） | `6` |
| `ATK` | `int32` | 攻击力（灵将/符箓专用，文脉卡填0） | `8` |
| `DEF` | `int32` | 防御力（灵将专用，其余填0） | `4` |
| `HP` | `int32` | 生命值（灵将专用，其余填0） | `12` |
| `WuXing` | `EWX_Element` (枚举) | 五行属性：`Metal`/`Wood`/`Water`/`Fire`/`Earth` | `Earth` |
| `Skill_Base` | `FText` | 凡品基础技能文本描述 | `开天辟地：召唤时对所有敌方造成2点固定伤害` |
| `Skill_Upgraded` | `FText` | 珍品解锁技能文本描述 | `混沌斧击：消耗3灵力，ATK×1.5伤害+眩晕1回合` |
| `SkillID_Lv1` | `FName` | 基础技能ID（引用DT_Skills RowKey，蓝图执行效果用） | `Skill_PanGu_Split` |
| `SkillID_Lv2` | `FName` | 珍品技能ID（升阶至珍品后激活） | `Skill_PanGu_Creation` |
| `BondTag` | `FGameplayTagContainer` | 羁绊组标签（支持多标签，如 `WX.Bond.Creation` ） | `[WX.Bond.Creation]` |
| `CulturalRef` | `FText` | 文化典籍出处说明 | `《三五历纪》（三国·徐整）` |
| `ArtTags` | `FString` | 美术关键词，逗号分隔 | `巍峨,粗犷,斧纹,原始力量,土黄暖色` |
| `Counter` | `FText` | 克制/弱点说明 | `木克土受20%额外伤害；封山印可封印技能` |
| `Tier` | `EWX_Grade` (枚举) | 品级：`Common`(凡品)/`Rare`(珍品)/`Epic`(极品) | `Common` |
| `FlavorText` | `FText` | 风味文案（40字以内，诗意风格） | `斧落混沌处，无声胜万雷...` |
| `Mesh_Lv1` | `TSoftObjectPtr<UStaticMesh>` | 凡品3D模型（软引用，懒加载） | `SM_Card_PanGu_Lv1` |
| `Mesh_Lv2` | `TSoftObjectPtr<UStaticMesh>` | 珍品3D模型 | `SM_Card_PanGu_Lv2` |
| `Mesh_Lv3` | `TSoftObjectPtr<UStaticMesh>` | 极品3D模型 | `SM_Card_PanGu_Lv3` |
| `SummonVFX` | `TSoftObjectPtr<UNiagaraSystem>` | 召唤粒子特效 | `NS_Summon_PanGu` |
| `CardFrontTexture` | `TSoftObjectPtr<UTexture2D>` | 卡牌正面纹理 | `T_Card_LJ001_PanGu_Front` |
| `UpgradeCost_Lv2` | `int32` | 升至珍品所需文脉碎片数量 | `30` |
| `UpgradeCost_Lv3` | `int32` | 升至极品所需文脉碎片数量 | `80` |

**EWX_Faction 枚举**：
```
ShangGu   // 上古神话
BaXian    // 八仙传说
FeiYi     // 非遗文脉
DaoFa     // 道法通用（跨阵营）
```

**EWX_CardType 枚举**：
```
LingJiang  // 灵将卡（入场战斗单位）
FuLu       // 符箓卡（立即结算，检测共鸣）
WenMai     // 文脉卡（持续增益，检测羁绊）
```

**EWX_Element 枚举**：
```
Metal / Wood / Water / Fire / Earth
```

**升阶倍率基准**：
```
珍品：ATK/DEF × 1.04，HP × 1.05（四舍五入）
极品：ATK/DEF × 1.08，HP × 1.10（四舍五入）
```

> **字段设计决策说明（v0.2 更新）**：
> 1. `CardType` 使用 `EWX_CardType` 枚举（不用字符串），蓝图 Switch 逻辑直接读取枚举值，无字符串比较开销，数据填写时 CSV 用整型索引即可。
> 2. `BondTag` 使用 `FGameplayTagContainer`（支持多标签），一张卡可同时属于多个羁绊组（如吕洞宾同属「八仙组」+「剑仙组」），比逗号分隔字符串更易于 BP 遍历和标签比较。
> 3. `Skill_Base`/`Skill_Upgraded` 保留人读文本字段（UI展示用），同时通过独立的 `SkillID_Lv1`/`SkillID_Lv2` 引用 `DT_Skills` 中的 `EffectType + EffectValue`，蓝图按 SkillID 读取结构体执行效果，两套字段互不干扰。

---

## 二、DT_Skills — 技能定义表

**结构体**：`FWX_SkillRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Skills`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `SkillID` | `FName` (Row Key) | 技能唯一ID | `Skill_PanGu_Split` |
| `DisplayName` | `FText` | 技能显示名 | `开天一斧` |
| `SkillType` | `EWX_SkillType` (枚举) | `Active`（主动）/ `Passive`（被动）/ `OnSummon`（召唤触发） | `Active` |
| `ManaCost` | `int32` | 技能额外灵力消耗（被动为0） | `2` |
| `TargetType` | `EWX_TargetType` | 技能目标类型 | `AnyEnemy` |
| `EffectType` | `EWX_EffectType` (枚举) | `Damage`/`Heal`/`Buff`/`Debuff`/`DrawCard`/`Custom` | `Damage` |
| `EffectValue` | `float` | 效果数值（伤害量/治疗量/增益值） | `4.0` |
| `EffectDuration` | `int32` | 持续回合（0=即时） | `0` |
| `ConditionTag` | `FGameplayTag` | 触发条件标签（空=无条件） | `` |
| `VFX` | `TSoftObjectPtr<UNiagaraSystem>` | 技能特效 | `NS_Skill_PanGu_Split` |
| `SFX` | `TSoftObjectPtr<USoundBase>` | 技能音效 | `SFX_Skill_PanGu_Split` |
| `Description` | `FText` | UI显示技能描述 | `对一个敌方单位造成4点伤害` |

**EWX_SkillType 枚举**：
```
Active      // 主动技能，需消耗灵力手动激活
Passive     // 被动效果，永久生效（卡牌存活期间）
OnSummon    // 入场时自动触发一次
OnDeath     // 阵亡时自动触发一次
```

**EWX_EffectType 枚举**：
```
Damage / Heal / Buff_ATK / Buff_DEF / Debuff_Stun / Debuff_Seal / DrawCard / DestroyCard / Custom
```

---

## 三、DT_Bonds — 文脉羁绊定义表

**结构体**：`FWX_BondRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Bonds`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `BondID` | `FName` (Row Key) | 羁绊唯一ID | `Bond_Creation` |
| `DisplayName` | `FText` | 羁绊显示名 | `神话创世` |
| `RequiredTags` | `FGameplayTagContainer` | 激活所需的卡牌BondTag集合（全部在场才激活） | `WX.Bond.Creation`（需两张拥有此Tag的卡） |
| `RequiredCardIDs` | `TArray<FName>` | 精确匹配的CardID列表（与RequiredTags二选一，精确匹配优先） | `[Card_PanGu, Card_NuWa]` |
| `MinCardCount` | `int32` | 最少需要几张成员在场（用于八仙等多人羁绊） | `2` |
| `EffectType` | `EWX_EffectType` | 羁绊激活效果类型 | `Buff_ATK` |
| `EffectValue` | `float` | 效果数值 | `2.0` |
| `EffectScope` | `EWX_EffectScope` (枚举) | 作用范围：`AllAllies`/`BondMembers`/`Self` | `AllAllies` |
| `ActivationVFX` | `TSoftObjectPtr<UNiagaraSystem>` | 激活特效 | `NS_Bond_Creation` |
| `CultureStoryID` | `FName` | 对应文化小故事ID（引用DT_Dialogues） | `Story_Bond_Creation` |
| `Description` | `FText` | 羁绊效果描述（UI显示） | `盘古与女娲同时在场，所有我方卡牌攻击力+2` |

**EWX_EffectScope 枚举**：
```
AllAllies    // 己方全体
BondMembers  // 仅羁绊成员
SingleTarget // 指定单体
```

### 预设羁绊组（v0.1）

| BondID | 成员 | 效果 |
|--------|------|------|
| `Bond_Creation` | 盘古 + 女娲 | 全场ATK+2 |
| `Bond_EightImmortal` | 八仙组（≥4人） | 每回合额外抽1张牌 |
| `Bond_Intangible` | 皮影+剪纸+刺绣 | 己方文脉卡持续效果+1回合 |

---

## 四、DT_Resonance — 五行共鸣定义表

> **ENG-BLK-002 重新设计（2026-04-30）**：原结构仅支持单一共鸣状态，不支持多种共鸣同时激活及效果堆栈管理。本次重新设计字段结构，引入 `ActiveResonances: TArray<FResonanceState>` 以支持：
> 1. 同一局内多种共鸣同时激活（如后续迭代增加「三行共鸣」「对立共鸣」等）
> 2. 共鸣效果堆栈管理（激活时间戳、剩余回合、效果叠加规则）

---

### 4.1 DT_Resonance — 共鸣类型定义表（静态配置）

**结构体**：`FWX_ResonanceRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Resonance`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `ResonanceID` | `FName` (Row Key) | 共鸣唯一ID | `Resonance_WuXing_Full` |
| `DisplayName` | `FText` | 共鸣名称 | `五行结界` |
| `ResonanceType` | `EWX_ResonanceType` (枚举) | 共鸣类型（见枚举说明） | `WuXing_Full` |
| `RequiredElements` | `TArray<EWX_Element>` | 需要集齐的五行元素列表 | `[Metal, Wood, Water, Fire, Earth]` |
| `RequiredCount` | `int32` | 每种元素最少需打出的符箓数量 | `1` |
| `TriggerScope` | `EWX_TriggerScope` (枚举) | 检测范围：`Cumulative`（本局累计）/`SingleTurn`（单回合） | `Cumulative` |
| `MaxActivations` | `int32` | 每局最多激活次数（0=无限） | `1` |
| `EffectDEFBonus` | `int32` | 全场DEF加成 | `2` |
| `EffectHPShield` | `int32` | 主将每回合减伤值（固定值） | `1` |
| `EffectDuration` | `int32` | 持续回合数 | `2` |
| `StackBehavior` | `EWX_StackBehavior` (枚举) | 效果叠加方式：`Replace`/`Stack`/`Refresh` | `Replace` |
| `ActivationVFX` | `TSoftObjectPtr<UNiagaraSystem>` | 五行结界粒子特效 | `NS_WuXing_Resonance` |
| `ActivationSFX` | `TSoftObjectPtr<USoundBase>` | 触发音效 | `SFX_Resonance_WuXing` |
| `Description` | `FText` | UI说明文本 | `集齐五行符箓，召唤五行结界：全场DEF+2，主将减伤1，持续2回合` |

**EWX_ResonanceType 枚举**（可扩展）：
```
WuXing_Full     // 五行全套（金木水火土，当前唯一激活类型）
WuXing_Partial  // 部分五行共鸣（如三行，后续迭代预留）
Elemental_Clash // 对立元素共鸣（预留）
```

**EWX_TriggerScope 枚举**：
```
Cumulative   // 本局累计（跨回合计数）
SingleTurn   // 单回合内（旧逻辑，已废弃，保留枚举供兼容）
```

**EWX_StackBehavior 枚举**：
```
Replace  // 新激活替换旧效果（重置持续时间）
Stack    // 效果数值叠加（需配合 MaxStack 限制）
Refresh  // 刷新持续时间，数值不叠加
```

---

### 4.2 FResonanceState — 运行时共鸣状态结构体

**说明**：此结构体用于运行时追踪每个已激活共鸣的状态，**不存 DataTable**，由 `BP_ResonanceDetector` 在内存中维护。

```cpp
// C++ 结构体定义（WX_ResonanceTypes.h）
USTRUCT(BlueprintType)
struct FResonanceState
{
    UPROPERTY() FName       ResonanceID;        // 引用 DT_Resonance RowKey
    UPROPERTY() int32       RemainingTurns;     // 剩余持续回合数
    UPROPERTY() int32       ActivationTurn;     // 激活时的回合数（用于日志/调试）
    UPROPERTY() int32       StackCount;         // 当前叠加层数（StackBehavior=Stack时使用）
    UPROPERTY() bool        bIsActive;          // 当前是否生效
};
```

**BP_ResonanceDetector 中的 ActiveResonances 字段**：
```
ActiveResonances : TArray<FResonanceState>
  - 存储当前局所有已激活的共鸣状态
  - 每次打出符箓后遍历 DT_Resonance，检测所有共鸣类型的激活条件
  - 回合结束时对每个激活中的共鸣执行 RemainingTurns--，归零时移除并广播失效事件
  - 支持同时存在多个激活共鸣（如五行结界 + 三行共鸣同时生效）
```

**激活/失效流程**：
```
打出符箓卡
  → BP_ResonanceDetector::OnFuluPlayed()
      ├─ 更新本局已打出五行标签集合（CumulativeElements）
      ├─ 遍历 DT_Resonance 所有行
      │    ├─ 检查 RequiredElements 是否全部 >= RequiredCount
      │    ├─ 检查 ActivationCount < MaxActivations
      │    └─ 满足条件 → 创建 FResonanceState，追加到 ActiveResonances
      └─ 广播 OnResonanceActivated(ResonanceID, FResonanceState)

回合结束
  → BP_ResonanceDetector::OnTurnEnd()
      ├─ 遍历 ActiveResonances
      │    ├─ RemainingTurns--
      │    └─ RemainingTurns <= 0 → 移除，广播 OnResonanceExpired(ResonanceID)
      └─ 通知 EffectStack 更新防御加成
```

---

### 4.3 预设共鸣配置（v1.1，与 RESONANCE.md v1.1 对齐）

| ResonanceID | 类型 | 触发条件 | 效果 | 每局次数 |
|-------------|------|----------|------|----------|
| `Resonance_WuXing_Full` | `WuXing_Full` | 本局累计金木水火土各≥1张符箓 | 全场DEF+2 + 主将减伤1点，持续2回合 | **1次** |

> **后续迭代预留**：`Resonance_WuXing_Three`（任意3种五行，效果较弱，每局2次）、`Resonance_Elemental_Clash`（水+火同时存在，特殊效果）。

---

> **字段设计决策说明（ENG-BLK-002，v1.1 重设计）**：
> 1. **静态配置与运行时分离**：DT_Resonance 仅存静态配置（触发条件、效果参数），运行时状态由 `BP_ResonanceDetector` 内的 `TArray<FResonanceState>` 管理，互不干扰。
> 2. **TArray 而非单字段**：原版本只有一个共鸣状态字段，无法支持多种共鸣并存。改为数组后，系统可在同一局中同时维护多个激活共鸣（如五行结界 + 三行共鸣）。
> 3. **StackBehavior 枚举**：不同共鸣有不同的叠加语义（五行结界 Replace，刷新不叠加；未来可能有 Stack 类型共鸣），通过枚举统一管理，无需逐个硬编码。
> 4. **MaxActivations 限制**：五行结界每局仅能激活1次，通过 DataTable 字段控制，不需改蓝图即可调整。

---

## 五、DT_Levels — 关卡/故事模式定义表

**结构体**：`FWX_LevelRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Levels`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `LevelID` | `FName` (Row Key) | 关卡唯一ID | `Level_Ch1_L1` |
| `Chapter` | `int32` | 所属章节 | `1` |
| `LevelIndex` | `int32` | 章节内序号 | `1` |
| `DisplayName` | `FText` | 关卡名称 | `浑沌初开` |
| `SceneMap` | `TSoftObjectPtr<UWorld>` | 对应UE关卡资产（软引用） | `L_Battle_KunlunXu` |
| `EnemyDeckID` | `FName` | AI敌人使用的牌组ID（引用DT_EnemyDecks） | `Deck_Ch1_L1_Chaos` |
| `EnemyHP` | `int32` | 敌方主将初始HP | `20` |
| `EnemyAITree` | `TSoftObjectPtr<UBehaviorTree>` | 使用的AI行为树 | `BT_EnemyAI_Basic` |
| `PreBattleDialogueID` | `FName` | 战前对话节点ID（引用DT_Dialogues，空=无） | `Dia_Ch1_L1_Pre` |
| `PostBattleDialogueID` | `FName` | 战后对话节点ID | `Dia_Ch1_L1_Post` |
| `RewardFragmentCount` | `int32` | 通关奖励文脉碎片数量 | `10` |
| `RewardCardID` | `FName` | 通关奖励卡牌ID（空=无） | `Card_NuWa` |
| `UnlockCondition` | `FName` | 解锁条件（引用前置LevelID，空=默认解锁） | `` |
| `IsCompleted` | `bool` | 运行时标志（不存表，SaveGame维护） | — |

---

## 六、DT_Dialogues — 对话节点表

**结构体**：`FWX_DialogueRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_Dialogues`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `NodeID` | `FName` (Row Key) | 对话节点唯一ID | `Dia_Ch1_L1_Pre_001` |
| `SpeakerID` | `FName` | 说话者ID（对应角色立绘资产Key） | `Speaker_Guardian` |
| `SpeakerName` | `FText` | 显示名称 | `文脉守护者` |
| `DialogueText` | `FText` | 对话正文（支持本地化） | `浑沌之力再度侵蚀昆仑，守护者，准备战斗！` |
| `PortraitTexture` | `TSoftObjectPtr<UTexture2D>` | 说话者立绘（软引用） | `T_Portrait_Guardian` |
| `AnimTag` | `FGameplayTag` | 角色播放的动作标签（空=默认Idle） | `WX.Anim.Speak` |
| `VoiceOver` | `TSoftObjectPtr<USoundBase>` | 配音音频（空=仅文字） | — |
| `NextNodeID` | `FName` | 下一个节点ID（空=对话结束） | `Dia_Ch1_L1_Pre_002` |
| `BranchCondition` | `FGameplayTag` | 分支条件Tag（空=无条件直接跳Next） | — |
| `BranchNodeID_True` | `FName` | 条件为True时跳转（有BranchCondition时用） | — |
| `AutoAdvance` | `bool` | 是否自动前进（不等待玩家点击） | `false` |
| `AutoDelay` | `float` | AutoAdvance时等待秒数 | `0.0` |
| `StoryUnlockID` | `FName` | 触发此节点时解锁的文化故事ID（空=无） | — |

---

## 七、DT_EnemyDecks — 敌方预设牌组表（补充）

**结构体**：`FWX_EnemyDeckRow`  
**资产路径**：`Content/WX_Data/DataTables/DT_EnemyDecks`

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `DeckID` | `FName` (Row Key) | 牌组唯一ID | `Deck_Ch1_L1_Chaos` |
| `DisplayName` | `FText` | 牌组名称 | `浊灵基础牌组` |
| `CardEntries` | `TArray<FWX_DeckEntry>` | 包含的卡牌列表（每项：CardID + Count） | `[{Card_ZhuoLing_A, 3}, ...]` |

**FWX_DeckEntry（内嵌结构）**：
```
CardID  : FName   // 引用DT_Cards RowKey
Count   : int32   // 该卡在牌组中的数量（建议1-3）
```

---

## 八、枚举速查表

| 枚举名 | 值 |
|--------|----|
| `EWX_CardType` | `LingJiang`, `FuLu`, `WenMai` |
| `EWX_Element` | `Metal`, `Wood`, `Water`, `Fire`, `Earth`, `None` |
| `EWX_Grade` | `Common`(凡品), `Rare`(珍品), `Epic`(极品) |
| `EWX_TargetType` | `AnyEnemy`, `AllEnemies`, `Ally`, `AllAllies`, `Self`, `None` |
| `EWX_SkillType` | `Active`, `Passive`, `OnSummon`, `OnDeath` |
| `EWX_EffectType` | `Damage`, `Heal`, `Buff_ATK`, `Buff_DEF`, `Debuff_Stun`, `Debuff_Seal`, `DrawCard`, `DestroyCard`, `Custom` |
| `EWX_EffectScope` | `AllAllies`, `BondMembers`, `SingleTarget` |
| `EWX_TurnPhase` | `TurnStart`, `PlayCards`, `BattleResolve`, `TurnEnd`, `SwitchTurn` |

---

## 九、DataTable 与系统的对应关系

| DataTable | 读取方 | 读取时机 |
|-----------|--------|----------|
| `DT_Cards` | `BP_CardManager`, `WBP_CardDetail`, `BP_CardUpgradeManager` | 对局初始化、UI展示、升阶触发 |
| `DT_Skills` | `BP_CardBase`, `BP_EffectStack`, `WBP_SkillBar` | 技能激活、效果结算 |
| `DT_Bonds` | `BP_BondDetector`, `BP_BondEffectHandler` | 每次场上卡牌变化 |
| `DT_Resonance` | `BP_ResonanceDetector`（静态配置读取）；运行时状态由 `ActiveResonances: TArray<FResonanceState>` 维护 | 每次打出符箓卡时遍历所有共鸣类型检测激活条件 |
| `DT_Levels` | `BP_StoryFlowController` | 故事模式关卡加载 |
| `DT_Dialogues` | `BP_DialogueManager` | 对话节点推进 |
| `DT_EnemyDecks` | `WX_AIController` | 对局初始化AI牌组 |

---

---

**变更记录（v1.1，2026-04-30）**：
- ENG-BLK-002：DT_Resonance 字段结构重新设计——静态配置表新增 `ResonanceType`/`TriggerScope`/`MaxActivations`/`StackBehavior`/`EffectHPShield` 字段；废弃旧版 `BarrierDEFBonus`/`EnemyExtraDamage` 字段（已替换为新字段）
- 引入运行时结构体 `FResonanceState` + `ActiveResonances: TArray<FResonanceState>`，支持多种共鸣同时激活及效果堆栈管理
- 效果数值与 RESONANCE.md v1.1 对齐：DEF+2（非+3），主将减伤1点（新增），触发条件改为本局累计

*版本：v1.1 | 创建日期：2026-04-30 | 最后更新：2026-04-30 | 维护人：engineer*
