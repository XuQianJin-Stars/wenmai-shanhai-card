# IMPLEMENTATION.md — 《文脉·山海卡》UE5 音频接入方案

> 版本：v1.1  
> 音频总监：audio  
> 目标引擎：Unreal Engine 5.7.4  
> 音频系统：MetaSound（UE5.4+ 成熟方案，推荐）  
> 最后更新：2026-04-30  
> 变更 v1.1：补充 §4.5 Music Stinger 触发规格（响应 critic AU-LOW-002）；更新 §6.2 Bond/Resonance 事件 BGM Stinger 参数

---

## 一、系统架构总览

```
                    ┌─────────────────────────────┐
                    │      MetaSound 音频图层       │
                    │  (MSSource + MSPatch 组成)    │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────▼──────────────────────────┐
        │                  Sound Class 树                       │
        │  Master                                               │
        │  ├── Music (BGM 层)                                   │
        │  ├── SFX (战斗/技能/召唤 音效层)                      │
        │  ├── UI (界面音效层)                                   │
        │  ├── Voice (旁白/文化小故事音频，预留)                 │
        │  └── Ambient (环境音层)                                │
        └──────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     Sound Mix / EQ 处理      │
        │  DuckingMix（战斗压 BGM）     │
        │  BossMix（全频谱推进）        │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   3D Attenuation / Spatialization │
        │   （卡牌/技能 SFX 使用）    │
        └─────────────────────────────┘
```

---

## 二、Sound Class 结构

### 2.1 Sound Class 树定义

```
SC_Master
├── SC_Music           （BGM, 调制音量受 PlayerSettings.MusicVolume 控制）
├── SC_SFX             （战斗音效, 受 PlayerSettings.SFXVolume 控制）
│   ├── SC_SFX_Card    （卡牌召唤/出牌专属，允许独立调节）
│   └── SC_SFX_Skill   （技能释放/命中专属）
├── SC_UI              （UI音效，受 SFXVolume 控制，但不受 Ducking 影响）
├── SC_Voice           （预留：文化小故事旁白）
└── SC_Ambient         （环境音, 单独音量通道）
```

### 2.2 Sound Class 属性配置

| Sound Class | 默认音量 | 最大并发数 | Pitch Variation | 备注 |
|------------|---------|---------|----------------|------|
| SC_Music | 0.75 | 2（交叉淡入淡出用） | 0% | 线性播放，无 Pitch 变化 |
| SC_SFX | 1.0 | 24 | ±5% | 轻微随机 Pitch 增加自然感 |
| SC_SFX_Card | 0.9 | 6 | ±3% | 卡牌音效不宜过多并发 |
| SC_SFX_Skill | 1.0 | 12 | ±8% | 技能音效允许更多 Pitch 变化 |
| SC_UI | 0.85 | 4 | 0% | UI 音效精确一致 |
| SC_Voice | 1.0 | 1 | 0% | 语音唯一性 |
| SC_Ambient | 0.5 | 8 | ±2% | 环境音轻微自然变化 |

---

## 三、Sound Mix 配置

### 3.1 主混音（SM_Default）

| 通道 | 音量调整 | EQ 说明 |
|------|---------|---------|
| SC_Master | 1.0 | 无处理 |
| SC_Music | 0.75 | 轻微低频 Roll-off < 80Hz |
| SC_SFX | 1.0 | 平坦 |
| SC_UI | 0.85 | 高频轻微提升（+1dB @8kHz）增加清晰度 |
| SC_Ambient | 0.5 | 中频轻微削减（-2dB @1kHz）防止与 BGM 打架 |

### 3.2 战斗混音（SM_Combat_Duck）

> 战斗中 BGM 适度降低，让技能音效更清晰。

| 通道 | 音量调整 | 触发条件 | 过渡时长 |
|------|---------|---------|---------|
| SC_Music | 0.55 | 战斗开始（OnCombatBegin） | 1.5s 渐变 |
| SC_SFX | 1.0 | — | 即时 |
| SC_Ambient | 0.3 | 战斗开始 | 2s 渐变 |

### 3.3 Boss 战混音（SM_Boss）

| 通道 | 音量调整 | 说明 |
|------|---------|------|
| SC_Music | 0.9 | Boss BGM 需要全力呈现 |
| SC_SFX_Skill | 1.1 | 技能音效微微加强 |
| SC_Ambient | 0.1 | 环境音几乎静音 |

### 3.4 UI 覆盖混音（SM_UI_Focus）

> 打开弹窗/面板时，战斗音效降低，UI 清晰度提升。

| 通道 | 音量调整 | 触发条件 |
|------|---------|---------|
| SC_Music | 0.6 | OnUIModalOpen |
| SC_SFX | 0.4 | OnUIModalOpen |
| SC_UI | 1.0 | — |
| SC_Ambient | 0.2 | OnUIModalOpen |

---

## 四、MetaSound 音频图设计

### 4.1 BGM 分层控制（MSSource: MS_BGM_Battle）

```
MetaSound Graph: MS_BGM_Battle
─────────────────────────────────────────────────────────
输入参数 (Input):
  float: IntensityLevel (0.0~1.0)    ← 由 WuxiaCombatComponent 驱动
  float: MusicVolume (0.0~1.0)       ← 玩家设置
  bool:  IsBossFight                 ← Boss 战标识

音频层 (Layers):
  [Wave Asset] L0_Ambient    → Gain(1.0)  → 始终输出
  [Wave Asset] L1_Melody     → Gain(1.0)  → 始终输出
  [Wave Asset] L2_Rhythm     → Gain( IntensityLevel > 0.2 ? lerp(0,1) : 0 )
  [Wave Asset] L3_Harmony    → Gain( IntensityLevel > 0.5 ? lerp(0,1) : 0 )
  [Wave Asset] L4_Intensity  → Gain( IntensityLevel > 0.8 ? lerp(0,1) : 0 )
  [Wave Asset] L5_Drama      → Gain( IsBossFight ? 1.0 : 0 ) [短暂4s触发]

所有层 → Mix → MusicVolume × 0.75 → SC_Music 输出
─────────────────────────────────────────────────────────
注意：各层音频文件须为同一 BPM 和 Loop 点，确保同步
```

### 4.2 UI 音效（MSSource: MS_UI_SFX）

```
MetaSound Graph: MS_UI_SFX
─────────────────────────────────────────────────────────
输入参数:
  enum: UIEventType  (BtnClick, CardDraw, CardPlay, TurnStart, ...)
  float: PitchVariation (-0.03~0.03)  ← 随机 Pitch

逻辑:
  Switch(UIEventType) → 选择对应 Wave Asset
  → Pitch Shift(PitchVariation)
  → SC_UI 输出
─────────────────────────────────────────────────────────
```

### 4.3 卡牌召唤音效（MSSource: MS_Card_Summon）

```
MetaSound Graph: MS_Card_Summon
─────────────────────────────────────────────────────────
输入参数:
  enum: CardType    (General, Talisman, Wenmai)
  int:  SummonVariant (1~6)   ← 对应 6 个差异化音效
  float: CardRarity (1~3)     ← 品质：凡品/珍品/极品

逻辑:
  Switch(CardType + SummonVariant) → 选择音效文件
  → if CardRarity == 3: 叠加额外光辉感 Reverb Layer
  → if CardRarity == 2: 轻微额外混响
  → SC_SFX_Card 输出
─────────────────────────────────────────────────────────
```

### 4.4 技能音效（MSSource: MS_Skill_SFX）

```
MetaSound Graph: MS_Skill_SFX
─────────────────────────────────────────────────────────
输入参数:
  string: SkillID           ← 从 GameplayTag 映射
  Vector3: WorldPosition    ← 3D 位置（卡牌所在位置）
  float: SkillPower (0~1)   ← 技能威力（影响 Reverb 量）

逻辑:
  SkillID → Asset Registry 查找对应 Wave Asset
  → Pitch Variation (random ±8%)
  → Reverb Send Amount = lerp(0.1, 0.4, SkillPower)
  → 3D Attenuation（见第五章）
  → SC_SFX_Skill 输出
─────────────────────────────────────────────────────────
```

### 4.5 Music Stinger — 羁绊/共鸣激活时 BGM 增强层（AU-LOW-002 响应）

> **设计决策**：羁绊激活（`Audio.SFX.Bond.Activate`）和五行结界激活（`Audio.SFX.Resonance.Activate`）是局内最高戏剧张力时刻，需要 BGM 层面的配合响应，而不仅仅是 SFX 叠加。  
> **实现方式**：不单独播放一首 BGM，而是在当前战斗 BGM 上叠加一段 **4–8s 的 MetaSound Stinger 层**，结束后自动消散回到当前 BGM 状态。

```
MetaSound Graph: MS_Stinger
─────────────────────────────────────────────────────────
输入参数:
  enum: StingerType         ← BondActivate / ResonanceActivate
  float: CurrentIntensity   ← 当前 BGM 紧张度（继承主 BGM 状态）
  float: FadeOutTime        ← 默认 2.0s（Stinger 尾部渐出时间）

音频层:
  [Wave Asset] Stinger_Bond      → 用于 BondActivate
              ├── 编钟齐鸣 3 声（宏大感，与 sfx_bond_activate 同步但加宽混响）
              └── 时长：4s（2s 主体 + 2s 渐出）

  [Wave Asset] Stinger_Resonance → 用于 ResonanceActivate
              ├── 五行气流汇聚感（上行扫频 + 编钟宏鸣）
              └── 时长：6s（4s 主体 + 2s 渐出）

逻辑:
  1. 接收 StingerType → 选择对应 Wave Asset
  2. 播放前：将当前 BGM（SC_Music）音量 lerp 到 0.45（压低 -5dB 腾出空间）
  3. Stinger 播放（SC_Music 独立子通道，不中断主 BGM 播放位置）
  4. Stinger 进入 FadeOutTime 段时：BGM 音量 lerp 回 CombatDuck 标准值（0.55）
  5. Stinger 播放完毕：SC_Music 恢复正常，主 BGM 无缝继续

Sound Class: SC_Music（与主 BGM 同级通道，但使用独立 AudioComponent_Stinger）
Priority:  120（高于羁绊 SFX 的 110，确保 Stinger 不被打断）
最大并发: 1（同时只允许一个 Stinger 播放；Resonance 激活中途触发 Bond 则排队等待）
─────────────────────────────────────────────────────────
```

**与 SFX 的协同触发时序**：

```
羁绊激活事件帧 (T=0)
  ├── [SFX]    sfx_bond_activate 播放（SC_SFX_Card，2.0s）      T+0ms
  ├── [BGM]    主 BGM 音量开始 lerp 到 0.45                     T+0ms
  ├── [Stinger] MS_Stinger(BondActivate) 开始播放（4.0s）        T+200ms  ← 稍微延后，让 SFX 先建立感知
  └── [BGM]    主 BGM 音量 lerp 回 0.55（Stinger 进入尾段时）    T+2200ms

五行结界激活事件帧 (T=0)
  ├── [SFX]    sfx_resonance_activate 播放（SC_SFX_Card，2.5s）  T+0ms
  ├── [BGM]    主 BGM 音量开始 lerp 到 0.40（更大压低，结界感更强）T+0ms
  ├── [Stinger] MS_Stinger(ResonanceActivate) 开始播放（6.0s）   T+300ms
  └── [BGM]    主 BGM 音量 lerp 回 0.55                          T+4300ms
```

**音频素材规格（audio 负责制作）**：

| 素材 ID | 类型 | 时长 | 调式 | 音色描述 | 大小上限 |
|---------|------|------|------|---------|--------|
| `stinger_bond_activate` | Wave（非循环） | 4.0s | 与当前战斗 BGM 同调，宫/羽调均可 | 编钟三声渐强 + 磬长余韵，比 sfx_bond_activate 多 2 倍混响空间感 | 400KB |
| `stinger_resonance_activate` | Wave（非循环） | 6.0s | 五声调式，调式模糊（五行融合感） | 五行气流扫频上行 + 编钟宏鸣 + 上行笛音穿透，最高戏剧张力 | 600KB |

---

## 五、3D Attenuation 默认配置

### 5.1 卡牌场景音效衰减（SA_Card_Default）

> 适用于：卡牌召唤音效、技能音效、战斗音效

```
Sound Attenuation Settings: SA_Card_Default
─────────────────────────────────────────────
Attenuation Model: Inverse (1/r 距离衰减)
Min Distance (内半径，全音量):  50 cm
Max Distance (外半径，静音):    400 cm
Falloff Distance:              350 cm

Override Attenuation (Distance Curve):
  0.0 → 1.0   (0 ~ 50cm  全音量)
  0.3 → 0.8   (50 ~ 150cm)
  0.7 → 0.3   (150 ~ 300cm)
  1.0 → 0.0   (300 ~ 400cm)

Spatialization:
  Spatialization Method: Binaural (耳机) / Panning (扬声器)
  3D Stereo Spread: 0° (单点声源)

Reverb:
  Send to Reverb: true
  Reverb Send Level:
    Inner radius (50cm): 0.05
    Outer radius (400cm): 0.35  (距离越远，混响比例越大)

Focus:
  Enable Listener Focus: true  (玩家朝向音源时更清晰)
  Focus Azimuth: 30°
  Focus Gain: 1.2
  Non-Focus Gain: 0.8
─────────────────────────────────────────────
```

### 5.2 环境音衰减（SA_Ambient_Default）

```
Sound Attenuation Settings: SA_Ambient_Default
─────────────────────────────────────────────
Attenuation Model: Linear
Min Distance:  100 cm
Max Distance:  800 cm

Reverb: Send Level 0.5 (固定，营造空间感)
3D Stereo Spread: 45° (环境音宽泛空间感)
─────────────────────────────────────────────
```

---

## 六、与 Engineer 约定的触发事件清单

### 6.1 GameplayTag 音频事件约定

所有音频事件通过 **GameplayTag** 标识，由 `WuxiaAudioManager` 订阅处理。

```
GameplayTag 命名约定：
  Audio.BGM.[EventName]
  Audio.SFX.[Category].[EventName]
  Audio.SFX.Card.[EventName]
  Audio.SFX.Skill.[SkillID]
  Audio.Ambient.[Scene].[EventName]
```

### 6.2 事件清单

#### BGM 控制事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.BGM.MainMenu` | 进入主菜单场景 | GameMode | 无 |
| `Audio.BGM.CombatStart` | 战斗开始 | CombatManager | `SceneType: enum(Kunlun/Theater/Study)` |
| `Audio.BGM.BossEnter` | Boss 战开始（Boss 首次出场） | CombatManager | 无 |
| `Audio.BGM.BossExit` | Boss 战结束 | CombatManager | 无 |
| `Audio.BGM.Victory` | 对局胜利 | CombatManager | 无 |
| `Audio.BGM.Defeat` | 对局失败 | CombatManager | 无 |
| `Audio.BGM.IntensityUpdate` | 战斗紧张度变化 | CombatIntensityComponent | `float: NewIntensity (0.0~1.0)` |

#### UI 音效事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.SFX.UI.BtnClick` | 所有 WuxiaButton 点击 | WuxiaButtonWidget | 无 |
| `Audio.SFX.UI.BtnHover` | WuxiaButton hover 进入 | WuxiaButtonWidget | 无 |
| `Audio.SFX.UI.Confirm` | 确认弹窗确认 | DialogWidget | 无 |
| `Audio.SFX.UI.Error` | 操作失败（灵力不足等） | CombatManager | 无 |
| `Audio.SFX.UI.PopupOpen` | 任意面板 / Modal 打开 | UIManager | 无 |
| `Audio.SFX.UI.PopupClose` | 任意面板 / Modal 关闭 | UIManager | 无 |
| `Audio.SFX.UI.CardDraw` | 每次抽牌 | CardManager | 无 |
| `Audio.SFX.UI.CardPlay` | 打出卡牌 | CardManager | `CardType: enum` |
| `Audio.SFX.UI.CardDiscard` | 弃牌 | CardManager | 无 |
| `Audio.SFX.UI.HandLimit` | 触发手牌上限 | CardManager | 无 |
| `Audio.SFX.UI.TurnStart_Self` | 己方回合开始 | TurnManager | 无 |
| `Audio.SFX.UI.TurnStart_Opponent` | 对手回合开始 | TurnManager | 无 |
| `Audio.SFX.UI.ManaRefill` | 回合灵力重置 | ManaSystem | 无 |
| `Audio.SFX.UI.ManaSpend` | 消耗灵力 | ManaSystem | `int: Amount` |

#### 卡牌/战斗音效事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.SFX.Card.SummonGeneral` | 灵将卡召唤进场动画开始 | CardAnimController | `int: Variant(1~6), enum: Rarity` |
| `Audio.SFX.Card.SummonTalisman` | 符箓卡打出 | CardAnimController | `enum: ElementType(Fire/Water/...)` |
| `Audio.SFX.Card.SummonWenmai` | 文脉卡打出 | CardAnimController | `int: Variant(1~6)` |
| `Audio.SFX.Combat.AttackLight` | 轻型攻击命中 | CombatResolver | `Vector3: HitPosition` |
| `Audio.SFX.Combat.AttackMedium` | 中型攻击命中 | CombatResolver | `Vector3: HitPosition` |
| `Audio.SFX.Combat.AttackHeavy` | 重型攻击命中 | CombatResolver | `Vector3: HitPosition` |
| `Audio.SFX.Combat.AttackMagic` | 法术/符箓攻击 | CombatResolver | `Vector3: HitPosition` |
| `Audio.SFX.Combat.AttackMiss` | 闪避/未命中 | CombatResolver | 无 |
| `Audio.SFX.Combat.AttackCounter` | 反击触发 | CombatResolver | `Vector3: Position` |
| `Audio.SFX.Combat.AttackCrit` | 克制加成命中 | CombatResolver | `Vector3: HitPosition` |
| `Audio.SFX.Combat.UnitDeath` | 灵将阵亡 | UnitController | `Vector3: Position` |
| `Audio.SFX.Combat.UnitHeal` | 单位恢复生命 | UnitController | `Vector3: Position` |
| `Audio.SFX.Combat.HPCriticalLow` | HP ≤ 30%（玩家主将） | PlayerController | 无 |

#### 技能音效事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.SFX.Skill.Cast` | 技能施放动画开始 | SkillSystem | `string: SkillID, Vector3: CastPosition, float: Power` |
| `Audio.SFX.Skill.Impact` | 技能命中/效果触发 | SkillSystem | `string: SkillID, Vector3: ImpactPosition` |

#### 特殊机制事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.SFX.Bond.Activate` | 文脉羁绊首次激活 | BondSystem | `bool: TriggerStinger=true`（触发 MS_Stinger BondActivate） |
| `Audio.SFX.Bond.Break` | 羁绊失效 | BondSystem | 无 |
| `Audio.SFX.Bond.Notify` | 羁绊即将触发（UI 提示时） | BondSystem | 无 |
| `Audio.SFX.Resonance.BuildElement` | 单个五行符打出 | ResonanceSystem | `enum: Element` |
| `Audio.SFX.Resonance.Activate` | 五行结界激活 | ResonanceSystem | `bool: TriggerStinger=true`（触发 MS_Stinger ResonanceActivate） |
| `Audio.SFX.Resonance.Expire` | 五行结界消散 | ResonanceSystem | 无 |
| `Audio.SFX.Upgrade.Start` | 升阶动画开始 | UpgradeSystem | 无 |
| `Audio.SFX.Upgrade.Complete` | 升阶完成 | UpgradeSystem | `enum: NewRarity` |
| `Audio.SFX.Upgrade.SkillUnlock` | 专属技能解锁 | UpgradeSystem | 无 |

#### 环境音控制事件

| GameplayTag | 触发时机 | 发送方 | 参数 |
|------------|---------|--------|------|
| `Audio.Ambient.Scene.Enter` | 进入/切换场景 | SceneManager | `enum: SceneType(Kunlun/Theater/Study)` |
| `Audio.Ambient.Scene.Exit` | 离开场景 | SceneManager | 无 |

---

## 七、WuxiaAudioManager 模块设计（蓝图）

### 7.1 蓝图组件结构

```
BP_WuxiaAudioManager (Actor Component，挂载于 WX_GameState)
├── Components:
│   ├── AudioComponent_BGM_A      ← BGM 交叉淡入淡出 A 轨
│   ├── AudioComponent_BGM_B      ← BGM 交叉淡入淡出 B 轨
│   ├── AudioComponent_Stinger    ← Music Stinger 专用轨（v1.1 新增）
│   ├── AudioComponent_Ambient    ← 环境音循环
│   └── MetaSoundSource_BGM       ← MetaSound 实例（控制分层参数）
│
├── Interfaces:
│   └── GameplayTagResponseTable  ← 监听所有 Audio.* GameplayTag 事件
│
├── Variables:
│   ├── CurrentIntensity: float   ← 当前战斗紧张度
│   ├── CurrentScene: ESceneType  ← 当前场景类型
│   ├── IsBossFight: bool
│   └── SFX_Pool: Array[AudioComponent]  ← SFX 播放器池（12 个）
│
└── Functions:
    ├── PlayBGM(SceneType, bCrossFade, FadeTime)
    ├── StopBGM(FadeTime)
    ├── UpdateIntensity(NewIntensity)
    ├── PlaySFX(SFXTag, WorldLocation)
    ├── PlayUISFX(UIEventType)
    ├── PlayCardSFX(CardType, Variant, Rarity)
    ├── PlaySkillSFX(SkillID, CastPosition, Power)
    ├── PlayStinger(StingerType, CurrentIntensity)  ← v1.1 新增
    ├── SetSceneAmbient(SceneType)
    └── ApplySoundMix(MixType)
```

### 7.2 BGM 交叉淡入淡出实现（蓝图逻辑）

```
Function: PlayBGM(SceneType, bCrossFade=true, FadeTime=2.0s)
─────────────────────────────────────────────────────────────
1. 根据 SceneType 确定 BGM MetaSound Asset
2. 确定当前活跃 BGM 轨（A 或 B）
3. 新 BGM 加载到另一轨，Set Volume = 0，Play
4. Timeline: 
   - 新轨 Volume: 0 → 1.0 （FadeTime 秒）
   - 旧轨 Volume: 1.0 → 0 （FadeTime 秒）
5. FadeTime 后：旧轨 Stop，清空 Asset
6. 更新 CurrentActiveBGMTrack
─────────────────────────────────────────────────────────────
```

---

## 八、工程目录结构（UE5 Content Browser）

```
Content/
└── Audio/
    ├── BGM/
    │   ├── MS_BGM_MainMenu.uasset          ← MetaSound Source
    │   ├── MS_BGM_Battle_Kunlun.uasset
    │   ├── MS_BGM_Battle_Theater.uasset
    │   ├── MS_BGM_Battle_Study.uasset
    │   ├── MS_BGM_Boss.uasset
    │   ├── BGM_Victory.uasset              ← 简单 Wave，非分层
    │   ├── BGM_Defeat.uasset
    │   └── Layers/                         ← 各 BGM 的分层音频文件
    │       ├── BGM_Kunlun_L0_Ambient.uasset
    │       ├── BGM_Kunlun_L1_Melody.uasset
    │       └── ...
    ├── SFX/
    │   ├── UI/
    │   │   ├── MS_UI_SFX.uasset            ← MetaSound Source (UI 总入口)
    │   │   └── Waves/                      ← 原始 Wave 文件
    │   ├── Card/
    │   │   ├── MS_Card_Summon.uasset
    │   │   └── Waves/
    │   ├── Combat/
    │   │   └── Waves/
    │   ├── Skill/
    │   │   ├── MS_Skill_SFX.uasset
    │   │   └── Waves/
    │   └── Special/                        ← 羁绊/共鸣/升阶
    │       └── Waves/
    ├── Ambient/
    │   ├── MS_Ambient_Kunlun.uasset        ← MetaSound Patch (场景底层)
    │   ├── MS_Ambient_Theater.uasset
    │   ├── MS_Ambient_Study.uasset
    │   └── Waves/
    ├── SoundClasses/
    │   ├── SC_Master.uasset
    │   ├── SC_Music.uasset
    │   ├── SC_SFX.uasset
    │   ├── SC_SFX_Card.uasset
    │   ├── SC_SFX_Skill.uasset
    │   ├── SC_UI.uasset
    │   ├── SC_Voice.uasset
    │   └── SC_Ambient.uasset
    ├── SoundMixes/
    │   ├── SM_Default.uasset
    │   ├── SM_Combat_Duck.uasset
    │   ├── SM_Boss.uasset
    │   └── SM_UI_Focus.uasset
    └── Attenuation/
        ├── SA_Card_Default.uasset
        └── SA_Ambient_Default.uasset
```

---

## 八·五、Bond / Resonance 激活时的 Music Stinger 触发逻辑（AU-LOW-002）

> 响应 critic 预评审 AU-LOW-002：羁绊激活音效与 BGM 的动态整合点

### 8.5.1 设计原则

**Music Stinger** = 短暂叠加在当前 BGM 之上的 1-3 秒戏剧性音乐刺点，用于强化特殊事件的情感冲击，而不中断 BGM 主体。

```
正在播放：MS_BGM_Battle_Kunlun（IntensityLevel=0.6，Layer 0-3 激活）
    ↓ Audio.SFX.Bond.Activate 触发
叠加播放：MS_Stinger_Bond（独立 AudioComponent，SC_Music 分类）
    持续约 2.5s，结束后自动停止
BGM 继续：MS_BGM_Battle_Kunlun 不中断，继续从当前播放位置
```

### 8.5.2 Stinger 分类与规格

| 事件 | Stinger ID | 时长 | 音色描述 | MetaSound Asset |
|------|-----------|------|---------|----------------|
| 文脉羁绊首次激活（Bond.Activate） | `STG_Bond_Activate` | 2.5s | 箜篌上行琶音 + 磬清越一击 + 高频余韵 | `MS_Stinger_Bond.uasset` |
| 五行结界激活（Resonance.Activate） | `STG_Resonance_Activate` | 3.0s | 编钟和音（三音叠加）→ 铜锣远击余韵 | `MS_Stinger_Resonance.uasset` |
| 羁绊失效（Bond.Break） | `STG_Bond_Break` | 1.5s | 古琴弦断逆向采样 + 低频沉落 | `MS_Stinger_BondBreak.uasset` |
| 卡牌升阶完成（Upgrade.Complete） | `STG_Upgrade_Complete` | 2.0s | 磬三连击（渐强）+ 高音箜篌泛音 | `MS_Stinger_Upgrade.uasset` |

### 8.5.3 蓝图触发逻辑（伪码）

```
// BP_WuxiaAudioManager — OnGameplayTagEvent 处理

Function: HandleBondActivate()
─────────────────────────────────────────────────────────────
1. 停止正在播放的 Stinger（如有），避免重叠失控
2. AudioComponent_Stinger → Set Sound = MS_Stinger_Bond
3. AudioComponent_Stinger → Set Volume = 0.7   // 不盖过 BGM
4. AudioComponent_Stinger → Play
5. BGM IntensityLevel += 0.15（短暂推高，2s 后恢复原值）
   → BP_CombatIntensityComponent → TemporaryBoost(0.15, Duration=2s)
─────────────────────────────────────────────────────────────
注意：Stinger 使用独立 AudioComponent（AudioComponent_Stinger）
     不与 BGM A/B 轨共用，不触发交叉淡入淡出逻辑
```

### 8.5.4 BGM IntensityLevel 短暂增益

羁绊激活属于戏剧性转折点，在 Stinger 播放期间同步短暂提升紧张度，使 BGM 分层在该时刻更饱满：

| 事件 | IntensityLevel 增益 | 持续时长 | 过渡 |
|------|-------------------|---------|------|
| Bond.Activate | +0.15 | 2s（Stinger 结束后恢复） | 0.3s 渐入/渐出 |
| Resonance.Activate | +0.20 | 3s | 0.3s 渐入/渐出 |
| Bond.Break | -0.10（降低） | 1.5s | 0.5s 渐出 |

> 此逻辑通过 `BP_CombatIntensityComponent → TemporaryIntensityBoost(delta, duration)` 接口实现，audio 与 engineer 需在 M2 前确认接口参数签名。

### 8.5.5 UE5 Content Browser 存放路径

```
Content/Audio/BGM/Stingers/
├── MS_Stinger_Bond.uasset
├── MS_Stinger_Resonance.uasset
├── MS_Stinger_BondBreak.uasset
└── MS_Stinger_Upgrade.uasset
```

---

## 九、接入检查清单（供 engineer 验收）

### P0 优先级（战斗可玩基础）

- [ ] WuxiaAudioManager 蓝图创建并注册为 GameState 组件
- [ ] Sound Class 树创建完毕（SC_Master → 各子类）
- [ ] SM_Default / SM_Combat_Duck Sound Mix 创建并测试
- [ ] BGM 交叉淡入淡出功能验证（主菜单→战斗→胜利/失败）
- [ ] GameplayTag 事件监听器：UI / 卡牌出牌 / 回合切换
- [ ] 基础 UI 音效全部接通（按钮、抽牌、出牌、回合开始）
- [ ] 卡牌召唤音效接通（6 个 General 变体）
- [ ] 战斗基础命中/阵亡音效接通

### P1 优先级（体验完整）

- [ ] MetaSound 分层 BGM 实现（IntensityLevel 驱动）
- [ ] 技能音效通过 SkillID → GameplayTag 映射自动播放
- [ ] 3D Attenuation 应用到卡牌/技能音效
- [ ] 羁绊激活 / 五行结界 特殊机制音效接通
- [ ] **Music Stinger 系统：MS_Stinger 实现（羁绊/共鸣激活时 BGM 增强层）**（v1.1 新增）
- [ ] 卡牌升阶音效接通
- [ ] Sound Mix Boss 模式切换

### P2 优先级（polish 阶段）

- [ ] 场景环境循环音实现（Ambient MetaSound Patch）
- [ ] 战斗紧张度动态计算组件（CombatIntensityComponent）
- [ ] 玩家音量设置 UI 接入（Master/Music/SFX 独立滑块）
- [ ] 音频性能测试（同屏多卡并发上限验证）

---

*本文档由 audio 维护，工程接入相关问题直接通过 SendMessage 联系 engineer 协调。*
