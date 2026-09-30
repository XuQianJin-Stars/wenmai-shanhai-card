# CODING_CONVENTIONS.md — 《文脉·山海卡》编码规范

**项目**：文脉·山海卡（Wenmai Shanhai Card）  
**引擎**：UE5.7.4  
**版本**：v0.1  
**维护人**：engineer  

---

## 一、总体原则

1. **蓝图优先**：所有游戏逻辑默认用 Blueprint，避免为炫技写 C++。
2. **数据驱动**：属性、配置一律放 DataTable，蓝图不硬编码数值。
3. **不可变数据**：运行时状态用新对象/副本传递，不直接修改传入参数。
4. **单一职责**：每个 Blueprint Actor/Component 只做一件事。
5. **零警告原则**：提交前确保 Output Log 无 Warning / 无 Error。

---

## 二、资产命名前缀规范

所有项目资产以 `WX_` 或下方对应前缀开头，区别于模板库资产。

### 2.1 Blueprint 前缀

| 前缀 | 类型 | 示例 |
|------|------|------|
| `BP_` | Blueprint Actor | `BP_CardBase`, `BP_TurnManager` |
| `BPC_` | Blueprint Component | `BPC_HandComponent`, `BPC_DeckComponent` |
| `WBP_` | Widget Blueprint (UMG) | `WBP_BattleHUD`, `WBP_CardDetail` |
| `ABP_` | Animation Blueprint | `ABP_CardSummon`, `ABP_Hero` |
| `BT_` | Behavior Tree | `BT_EnemyAI_Basic` |
| `BB_` | Blackboard | `BB_EnemyAI` |
| `BTTask_` | BT Task | `BTTask_PlayCard`, `BTTask_DeclareAttack` |
| `BTService_` | BT Service | `BTService_EvalHand` |
| `BTDecorator_` | BT Decorator | `BTDecorator_HasMana` |
| `EQS_` | EQS Query | `EQS_TargetPriority` |

### 2.2 资产前缀

| 前缀 | 类型 | 示例 |
|------|------|------|
| `SM_` | Static Mesh | `SM_Card_PanGu_Lv1` |
| `SK_` | Skeletal Mesh | `SK_Hero_Guardian` |
| `T_` | Texture 2D | `T_Card_PanGu_Front`, `T_CardBack_CN` |
| `TC_` | Texture Cube (环境贴图) | `TC_KunlunXu_IBL` |
| `M_` | Material | `M_CardBase_Master` |
| `MI_` | Material Instance | `MI_Card_PanGu` |
| `MF_` | Material Function | `MF_InkWash_Blend` |
| `NS_` | Niagara System | `NS_Skill_Attack`, `NS_Bond_Creation` |
| `NC_` | Niagara Component | — |
| `A_` / `SFX_` | Sound Asset | `A_BGM_KunlunXu`, `SFX_Skill_PanGu` |
| `ASC_` | Sound Cue | `ASC_CardDraw` |
| `DT_` | DataTable | `DT_Cards`, `DT_Skills` |
| `L_` | Level / Map | `L_Battle_KunlunXu`, `L_Test_Bond` |
| `LS_` | Level Sequence | `LS_Ch1_Intro` |
| `DA_` | Data Asset | `DA_CardDeck_Default` |
| `E_` | Enum (BP枚举) | `E_WX_CardType`, `E_WX_Element` |
| `S_` | Struct (BP结构体) | `S_WX_CardState`, `S_WX_Effect` |

### 2.3 C++ 命名

遵循 UE5 标准 + 项目 `WX` 命名空间：

| 类型 | 规则 | 示例 |
|------|------|------|
| Class（UObject子类） | `UWX_` 前缀 | `UWX_CardStateComponent` |
| Class（AActor子类） | `AWX_` 前缀 | `AWX_GameMode` |
| Struct | `FWX_` 前缀 | `FWX_CardRow`, `FWX_Effect` |
| Enum | `EWX_` 前缀 | `EWX_CardType` |
| Interface | `IWX_` 前缀 | `IWX_Targetable` |
| 文件名 | 与类名一致 | `WX_CardStateComponent.h` |

---

## 三、Blueprint 内部规范

### 3.1 Category（分类）前缀

蓝图中所有变量、函数、事件必须设置 Category，使用 `WX|子分类` 格式：

```
WX|Card        // 卡牌属性/方法
WX|Battle      // 战斗/结算
WX|Bond        // 羁绊系统
WX|Resonance   // 五行共鸣
WX|UI          // UI事件/绑定
WX|AI          // AI相关
WX|Progression // 养成/存档
WX|Narrative   // 叙事/对话
WX|VFX         // 特效控制
WX|Debug       // 调试用，发布前移除
```

### 3.2 变量命名

- 使用 **PascalCase**：`CurrentMana`, `HandCardList`, `IsPlayerTurn`
- Bool 变量以 `b` 开头或用 `Is/Has/Can` 前缀：`bIsStunned`, `HasCounterAttack`
- 数组变量以 `List` 或 `Array` 结尾：`HandCardList`, `ActiveEffectArray`
- 禁止使用 `Temp`, `Var1`, `NewVar` 等无意义名称

### 3.3 函数命名

- 使用 **动词+名词** 形式：`DrawCard()`, `PlayCard()`, `CalculateDamage()`
- 纯函数（无副作用）加 `Get` 前缀：`GetCardATK()`, `GetBondList()`
- 事件（Event Dispatcher）以 `On` 前缀：`OnCardPlayed`, `OnTurnChanged`
- Blueprint Interface 函数名全大写+下划线：`WX_ON_CARD_SUMMONED`

### 3.4 节点注释规范

所有复杂逻辑块（>5个节点）必须用 Comment Box 标注，格式：
```
[系统名] 功能描述
例：[BattleResolver] 计算五行克制伤害修正
```

### 3.5 禁止项

- **禁止**在蓝图中使用 `Delay` 节点替代真正的状态机（用 `SetTimer` 或状态枚举）
- **禁止** Cast To 层级超过 3 层（过度耦合信号，改用 Interface 或 Event Dispatcher）
- **禁止**在 Tick 事件中执行高开销操作（循环遍历全部卡牌等），改用事件驱动
- **禁止**硬编码数值，一律引用 DataTable 或常量变量
- **禁止**在 Widget 蓝图中直接调用 GameMode/GameState，通过 Interface 或 BindingEvent

---

## 四、目录规范

```
Content/
├── WX_Core/          # 游戏逻辑蓝图（不含UI/美术）
├── WX_UI/            # 所有 Widget Blueprint + UI纹理
├── WX_Art/           # 模型/纹理/材质/粒子
├── WX_Data/          # DataTable + Struct + Enum
├── WX_Maps/          # 所有关卡（含L_Test_*）
└── ThirdParty/       # 外部模板资产（Card Games Template等，不修改）
```

**规则**：
- `ThirdParty/` 内的资产只引用，不修改。需要改动时，复制到 `WX_Core/` 并重命名。
- 测试地图统一放 `WX_Maps/` 下，命名格式 `L_Test_<系统名>`。
- 不在 Content 根目录直接放资产，必须归入子目录。

---

## 五、DataTable 维护规范

1. 每次新增字段，在 `DATA_TABLES.md` 同步更新结构定义。
2. 字段类型变更需通知所有读取该表的蓝图维护人。
3. 软引用（`TSoftObjectPtr`）用于模型/纹理/特效等大资产，硬引用仅用于必须立即加载的小资产（如技能枚举）。
4. 所有 RowKey（FName）使用 `PascalCase_Category` 格式：`Card_PanGu`, `Skill_PanGu_Split`。

---

## 六、提交前检查清单

在每个功能完成后，提交代码/资产前逐项确认：

- [ ] Output Log 无 Warning / 无 Error
- [ ] 新蓝图已设置正确 Category 前缀
- [ ] 硬编码数值已移入 DataTable 或常量
- [ ] 新系统附带独立测试地图（`L_Test_*`）
- [ ] 测试地图含至少1组 DataTable 测试数据
- [ ] 不超过 800 行节点的蓝图（过大请拆分组件）
- [ ] Cast To 链不超过 3 层
- [ ] Tick 事件内无重循环
- [ ] 存档数据通过 `WX_SaveGame`，无裸字符串拼接

---

## 七、Git 提交规范

遵循 Conventional Commits 格式：

```
<type>: <description>

类型：feat / fix / refactor / docs / art / data / perf / test / chore
```

示例：
```
feat: 实现BP_BondDetector羁绊检测逻辑
data: 新增DT_Bonds三组核心羁绊数据
art: 添加NS_Bond_Creation粒子特效
fix: 修复DrawCards回合末手牌超限未弃牌的bug
```

---

*版本：v0.1 | 创建日期：2026-04-30 | 维护人：engineer*
