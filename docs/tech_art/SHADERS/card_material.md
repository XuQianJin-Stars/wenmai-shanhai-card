# card_material.md — 卡牌材质方案

版本：v0.3 | 适用引擎：UE5.7.4

**变更记录**：
- v0.3：合并并扩充§九文脉区定义；依据 CORE_LOOP_v2 写定文脉区上限 6 张（非 9 张，已与设计文档对齐）；补充文脉区三类材质规格（WenMai_InactiveFrame / WenMai_ActiveGlow / WenMai_ZoneBG）；补充入场动画规格（依据 UI_VISUAL.md v1.1 §3.5）；更新§八 Shader 复杂度控制表（2026-04-30）
- v0.2：新增§九 战场三层布局定义（文脉区位置已拍板：底部手牌区上方独立横条）；写定文脉卡 FloatHeight 3cm + 平放参数；解除文脉区位置挂起状态（2026-04-30）

---

## 一、卡牌结构概述

每张卡牌由以下层次构成：

```
┌─────────────────────────────────────────────┐
│  悬浮粒子特效（Niagara，独立系统）           │
│  发光边框（Emissive Mesh 或材质层）          │
├─────────────────────────────────────────────┤
│  卡牌正面                                    │
│  ├─ 立体角色区域（3D 灵将 Mesh 叠加）        │
│  └─ 薄片背景（2D 插画 + 宣纸纹）             │
├─────────────────────────────────────────────┤
│  卡牌背面（统一花纹/LOGO）                   │
└─────────────────────────────────────────────┘
```

---

## 二、卡牌正面材质（M_Card_Front）

### 2.1 基础结构

**材质类型**：Surface，Translucent（用于悬浮特效透明部分）或 Opaque（主体）  
**Shading Model**：Default Lit  
**Two-Sided**：FALSE（正面/背面各为独立材质）

### 2.2 纹理通道分配

| 贴图槽 | 纹理 | 说明 |
|--------|------|------|
| BaseColor (RGB) | `T_Card_[ID]_Albedo` | 卡牌插画 |
| BaseColor Alpha | 无（Opaque） | — |
| Normal (RG) | `T_Card_[ID]_Normal` | 卡牌浮雕/纹理法线 |
| Roughness (R) | `T_Card_[ID]_ORM.G` | 0.6–0.8，偏哑光水墨纸感 |
| Metallic (R) | `T_Card_[ID]_ORM.R` | 0.0（非金属） |
| AO (R) | `T_Card_[ID]_ORM.B` | 环境光遮蔽 |
| Emissive (RGB) | `T_Card_[ID]_Emissive` | 可选：咒文符箓自发光区域 |

**ORM 合并贴图**：R=Metallic，G=Roughness，B=AO，一张 1024×1024 BC7 贴图。

### 2.3 宣纸纹理叠加（材质内层）

```
// 材质节点逻辑
PaperUV = TexCoord * PaperTiling
PaperTexture = T_XuanPaper_512.r
PaperBlend = Lerp(BaseColor, BaseColor * PaperTexture, PaperStrength)
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `PaperTiling` | 8.0 | 2.0 – 16.0 | 宣纸纹理 Tiling |
| `PaperStrength` | 0.2 | 0.0 – 0.6 | 宣纸纹理混合强度 |

### 2.4 五行颜色标识层（Color Identity）

每张卡牌材质实例通过颜色参数快速区分五行：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `ElementColor` | (1,1,1) | 五行颜色，叠加于 Emissive 边缘 |
| `ElementIntensity` | 1.5 | Emissive 自发光强度（HDR，>1 触发 Bloom） |

五行默认颜色参考：RENDER_PLAN.md 第五节色表。

---

## 三、发光边框材质（M_Card_GlowBorder）

**实现方式**：在卡牌 Static Mesh 上额外建立一个略大一圈的薄层 Mesh（或通过顶点偏移实现），挂载发光边框材质。

**材质类型**：Unlit，Translucent（Additive Blend）

```
// 材质节点逻辑
BorderMask = T_Card_BorderMask.r      // 边框形状遮罩（1=边框区域）
GlowColor = ElementColor * GlowIntensity
GlowPulse = sin(Time * PulseSpeed) * 0.5 + 0.5   // 脉动动画
FinalEmissive = GlowColor * BorderMask * (BaseGlow + GlowPulse * PulseAmplitude)

Output → Emissive Color = FinalEmissive
Output → Opacity = BorderMask * OpacityScale
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `ElementColor` | (1,1,1) | HDR Color | 五行对应颜色 |
| `GlowIntensity` | 3.0 | 1.0 – 8.0 | 基础发光强度 |
| `PulseSpeed` | 1.2 | 0.0 – 5.0 | 脉动频率（0=静态常亮） |
| `PulseAmplitude` | 0.4 | 0.0 – 1.0 | 脉动幅度（0=无脉动） |
| `BaseGlow` | 0.6 | 0.0 – 1.0 | 脉动最低亮度基底 |
| `OpacityScale` | 0.9 | 0.1 – 1.0 | 边框整体透明度 |

---

## 四、卡牌背面材质（M_Card_Back）

**统一设计**：所有卡牌背面使用同一材质，展示游戏 LOGO + 暗纹花纹。

```
// 材质节点逻辑
BackAlbedo = T_Card_Back_Albedo        // 统一背面设计贴图
PatternNormal = T_Card_Back_Normal     // 暗纹法线（水波纹/山海纹）
Roughness = 0.65                       // 偏哑光
Metallic = 0.0

// 翻牌时隐藏正面、显示背面（逻辑层控制，材质无需处理）
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `BackColor` | (0.08, 0.06, 0.1) | RGB | 背面底色（深紫黑） |
| `PatternIntensity` | 0.3 | 0.0 – 1.0 | 暗纹可见度 |
| `LogoEmissive` | 0.8 | 0.0 – 2.0 | LOGO 微发光（低调） |

---

## 五、悬浮特效材质（M_Card_Float）

**说明**：卡牌悬浮在空中时，卡牌底部产生扰动阴影/光圈，顶部有粒子浮动。  
此材质为 **贴花（Decal）材质** 投射在桌面/场地上。

```
// 材质节点逻辑（Decal）
FloatRingMask = RadialGradient(UV, Center, Radius)    // 圆形衰减
FloatNoise = T_InkNoise_512(UV * 2.0 + Time * 0.1)   // 动态扰动
FloatAlpha = FloatRingMask * (0.5 + FloatNoise * 0.5)
FloatColor = ElementColor * 0.3                        // 淡淡五行色光圈

Output → Emissive = FloatColor * FloatAlpha
Output → Opacity = FloatAlpha * FloatOpacity
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `FloatHeight` | 5.0 cm | 0 – 20 cm | 悬浮高度（驱动卡牌 Z 位移动画） |
| `FloatSpeed` | 0.8 | 0.2 – 3.0 | 上下浮动周期 |
| `FloatOpacity` | 0.4 | 0.0 – 1.0 | 地面光圈透明度 |
| `ElementColor` | 与正面一致 | HDR Color | 光圈颜色 |

---

## 六、交互反馈材质参数（按下/悬停）

通过材质动态参数（Dynamic Material Instance）在蓝图中实时驱动：

| 交互状态 | 参数变化 | 说明 |
|----------|----------|------|
| Hover（鼠标悬停） | GlowIntensity × 1.5，FloatHeight → 8cm | 边框加亮，卡牌上浮 |
| Pressed（按下） | GlowIntensity × 0.7，Scale 缩小 5% | 按压感，边框变暗 |
| Selected（选中打出） | PulseSpeed → 3.0，ElementIntensity × 2.0 | 快速脉动，强发光 |
| Disabled（无法使用） | BaseColor Desaturate 50%，GlowIntensity = 0 | 灰化，无边框光 |

**蓝图调用示例**：
```
// UE Blueprint: Set Scalar Parameter Value
CardMaterialInstance → SetScalarParameterValue("GlowIntensity", 4.5)
CardMaterialInstance → SetVectorParameterValue("ElementColor", FireColor)
```

---

## 七、材质实例命名规范

```
MI_Card_[CardID]_[Element]_Front     // 如：MI_Card_NuWa_Fire_Front
MI_Card_[CardID]_[Element]_GlowBorder
MI_Card_Back                         // 统一背面，无 ID
MI_Card_[CardID]_FloatDecal
MI_WenMai_InactiveFrame              // 文脉区非激活边框（v0.3 新增）
MI_WenMai_ActiveGlow                 // 文脉区激活光晕（v0.3 新增）
MI_WenMai_ZoneBG                     // 文脉区背景（v0.3 新增）
```

存放路径：`Content/Art/Cards/Materials/`

---

## 八、Shader 复杂度控制

| 材质 | 指令数上限（Instruction Count） | 说明 |
|------|-------------------------------|------|
| M_Card_Front | ≤ 120 | 含宣纸叠加 |
| M_Card_GlowBorder | ≤ 60 | Additive，简单 |
| M_Card_Back | ≤ 80 | 简单材质 |
| M_Card_FloatDecal | ≤ 80 | Decal 节省开销 |
| M_WenMai_InactiveFrame | ≤ 40 | 极简线框，无 Emissive |
| M_WenMai_ActiveGlow | ≤ 60 | 含脉冲动画，Additive |
| M_WenMai_ZoneBG | ≤ 50 | 半透明宣纸背景，Translucent |

*在 UE Material Editor 左下角查看 Shader Complexity 热力图验证。*

---

## 九、战场三层布局与文脉区完整定义（v0.3）

> **决策日期**：2026-04-30 | **方案**：方案 3 — 底部手牌区上方独立横条  
> **设计权威来源**：CORE_LOOP_v2.md（文脉区上限 6 张）、UI_VISUAL.md v1.1 §3.5（入场动画规格）

### 9.1 战场布局层级

```
┌─────────────────────────────────────────────────────┐
│  中央战斗区（Combat Zone）                            │
│  灵将卡牌 / 符箓卡打出 / 战斗动效主体                  │
├─────────────────────────────────────────────────────┤
│  文脉区 WBP_WenMaiZone（独立横条）                    │
│  位置：底部手牌区正上方，竖向紧贴手牌区                  │
│  文脉卡在此区域平放，光纹亮起；最多容纳 6 张            │
├─────────────────────────────────────────────────────┤
│  底部手牌区 WBP_HandArea（已有）                      │
│  手牌上限 7 张                                        │
└─────────────────────────────────────────────────────┘
```

### 9.2 文脉区容量说明

| 参数 | 值 | 来源 |
|------|----|------|
| 文脉区上限 | **6 张** | CORE_LOOP_v2.md §文脉区规则（超出时玩家自选 1 张移入弃牌堆） |
| 手牌上限 | 7 张 | designer 2026-04-30 拍板 |
| 容量关系 | 独立计数 | 文脉卡从手牌打出后驻留文脉区，多回合累积，不受手牌上限约束 |

> **不调整为 7 张的原因**：文脉区和手牌区是独立计数的不同区域，文脉区可多回合累积；CORE_LOOP_v2 已明确定义 6 张上限（配合超出时弃牌机制），保持 6 张。

### 9.3 HUD 层级位置（engineer 执行）

```
HUD_BattleOverlay
  ├─ WBP_WenMaiZone        // 文脉区横条（新增，HandArea 正上方）
  │    宽度：与 WBP_HandArea 等宽
  │    高度：WBP_HandArea 高度的 40–50%
  │    最大容量：6 张（超出触发弃牌选择 UI）
  ├─ WBP_HandArea          // 底部手牌区（已有）
  ├─ WBP_StatusBar_Player
  ├─ WBP_StatusBar_Enemy
  ├─ WBP_SkillPanel
  ├─ WBP_TurnIndicator
  └─ WBP_BattleLog
```

### 9.4 文脉卡材质参数（驻留状态）

文脉卡进入文脉区后，材质参数写定如下：

| 参数名 | 文脉区值 | 说明 |
|--------|---------|------|
| `FloatHeight` | **3 cm** | 低伏平放（对比灵将 8cm，符箓 0cm） |
| `FloatSpeed` | 0.3 | 极慢上下浮动，接近静止 |
| `FloatOpacity` | 0.2 | 地面光圈极淡（文脉静谧气质） |

### 9.5 文脉卡入场动画规格（依据 UI_VISUAL.md v1.1 §3.5）

**入场平移动画**：

| 参数 | 值 |
|------|----|
| 动画曲线 | EaseOut |
| 动画时长 | 0.45s |
| 位移方向 | 向上平移（斜线路径，从手牌槽 → 文脉槽，非折线） |
| 入场尾迹粒子 | 淡墨 `#8C8C8C`，透明度 30%，宽 2px，持续 0.3s 后淡出 |

**落位时触发序列**：

```
1. 卡牌从手牌区沿斜线滑入文脉区（0.45s，EaseOut）
2. FloatHeight Timeline: 手牌默认值 → 3cm（0.2s 插值）
3. 落位瞬间：边框从无光晕渐亮至赭石底光 #8C6040（0.2s EaseIn）
   → 材质切换：M_GlowBorder → MI_WenMai_InactiveFrame（赭石线框，无发光）
4. 若羁绊已激活：落位 0.1s 后触发属性色光晕脉冲
   → 材质切换：MI_WenMai_InactiveFrame → MI_WenMai_ActiveGlow
   → GlowIntensity 0.8，PulseSpeed 对应 2s 周期（PulseSpeed = π ≈ 3.14159 / 2 = 0.5Hz）
5. 被摧毁：0.4s 内 Dissolve 材质从外向内溶解（与现有泼墨溶解 shader 同源）
```

**蓝图调用参考**：
```
// 进入文脉区
WenMaiCardMI → SetScalarParameterValue("FloatHeight", 3.0)
// 激活羁绊时切换为 ActiveGlow
WenMaiCardMI_Border → SetVectorParameterValue("ElementColor", BondColor)
WenMaiCardMI_Border → SetScalarParameterValue("GlowIntensity", 0.8)
WenMaiCardMI_Border → SetScalarParameterValue("PulseSpeed", 0.5)  // 2s 周期
```

---

## 十、文脉区专属材质规格（v0.3）

### 10.1 WenMai_InactiveFrame — 文脉卡非激活边框

**用途**：文脉卡落位文脉区但羁绊未激活时的默认边框  
**材质类型**：Unlit，Translucent（Additive Blend）

```
// 材质节点逻辑
BorderMask = T_Card_BorderMask.r
FrameColor = #8C6040（赭石）× FrameIntensity
// 无脉动，无 Bloom（Emissive < 1.0）
Output → Emissive = FrameColor × BorderMask
Output → Opacity = BorderMask × 0.7
```

**可配置参数**：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `FrameColor` | `#8C6040`（赭石） | 非激活线框色 |
| `FrameIntensity` | 0.6 | 发光强度（<1，不触发 Bloom） |

**Instruction Count**：≤ 40

---

### 10.2 WenMai_ActiveGlow — 文脉卡激活光晕

**用途**：羁绊激活后的文脉卡边框光晕，含脉冲动画  
**材质类型**：Unlit，Translucent（Additive Blend）

```
// 材质节点逻辑（复用 M_Card_GlowBorder 脉冲逻辑，参数收窄）
BorderMask = T_Card_BorderMask.r
GlowColor = ElementColor × GlowIntensity     // Emissive 0.8，不过 Bloom 阈值
GlowPulse = sin(Time × PulseSpeed) × 0.5 + 0.5
FinalEmissive = GlowColor × BorderMask × (0.5 + GlowPulse × 0.3)
// 注意：Emissive 最大 0.8，有意不触发 Bloom（文脉卡静谧气质，不抢战斗视线）
Output → Emissive = FinalEmissive
Output → Opacity = BorderMask × 0.85
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `ElementColor` | `#4A8C5C`（竹青绿） | HDR Color | 属性色（随所属羁绊组动态设置） |
| `GlowIntensity` | 0.8 | 0.3 – 1.2 | 发光强度（有意低于 1.0，不触发 Bloom） |
| `PulseSpeed` | 0.5 | 0.2 – 1.0 Hz | 脉动频率（0.5 = 2s 周期） |

**Instruction Count**：≤ 60

---

### 10.3 WenMai_ZoneBG — 文脉区背景材质

**用途**：文脉区 WBP_WenMaiZone 的背景底色（宣纸半透明底）  
**材质类型**：Unlit，Translucent

```
// 材质节点逻辑
PaperColor = #F5F0E8（宣纸白）
PaperTexture = T_XuanPaper_512（Tiling 4.0，覆盖整个横条区域）
EdgeMask = T_InkEdge_Irregular（不规则毛边遮罩，边缘笔触感）
EdgeLine = #8C8C8C × 0.4（淡墨细线，0.5px 等效笔触宽度）

BaseLayer = PaperColor × T_XuanPaper_512 × PaperOpacity
EdgeLayer = EdgeLine × EdgeMask
Output → BaseColor = BaseLayer + EdgeLayer
Output → Opacity = 0.4（整体 40% 透明度，不遮挡战斗区）
```

**可配置参数**：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `PaperColor` | `#F5F0E8` | 宣纸底色 |
| `PaperOpacity` | 0.4 | 整体透明度（40%，扁平化无凸起） |
| `EdgeColor` | `#8C8C8C` | 边缘笔触色（淡墨） |
| `EdgeIntensity` | 0.4 | 边缘可见度 |

**Instruction Count**：≤ 50

---

*card_material.md v0.3 | 更新日期：2026-04-30 | 维护人：tech_artist*
