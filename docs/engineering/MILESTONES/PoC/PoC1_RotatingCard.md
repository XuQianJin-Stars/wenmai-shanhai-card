# PoC1_RotatingCard.md — 旋转水墨卡牌 PoC Demo 技术方案

**项目**：文脉·山海卡（Wenmai Shanhai Card）  
**引擎**：UE5.7.4（2026-03-10 官方 Hotfix）  
**版本**：v1.0  
**负责人**：engineer  
**测试地图**：`L_Test_RotatingCard`  
**验收标准**：60fps 稳定运行，Output Log 零 Warning / 零 Error  

---

## 一、PoC 目标

验证以下核心技术点在 UE5.7.4 环境下的可行性：

1. **旋转动画**：卡牌绕 Z 轴持续旋转，支持暂停/恢复，曲线可配置
2. **悬浮效果**：卡牌上下浮动（正弦波形），参数参照 `docs/tech_art/SHADERS/card_material.md §五`
3. **水墨描边**：后处理描边效果，参数参照 `docs/tech_art/SHADERS/ink_wash_postprocess.md §3.1`
4. **按下反馈**：点击/触摸时触发缩放动画 + 音效
5. **帧率验证**：单场景 ≥20 张 Nanite 卡牌同屏，维持 60fps

---

## 二、BP_CardDemo_Actor 蓝图结构

### 2.1 组件层级

```
BP_CardDemo_Actor（Blueprint Actor）
  ├─ SceneComponent（根组件）
  ├─ StaticMeshComponent（SM_Card_Demo）
  │    材质实例：MI_Card_NuWa_Fire_Front（测试用）
  │    碰撞：Simple Box Collision，响应 Click/Touch
  ├─ StaticMeshComponent（SM_Card_Demo_Back）
  │    材质：MI_Card_Back
  ├─ StaticMeshComponent（SM_Card_GlowBorder）
  │    材质实例：MI_Card_NuWa_Fire_GlowBorder
  │    Scale：略大于主体 Card Mesh（+2%）
  └─ NiagaraComponent（NS_Card_FloatParticle）
       跟随卡牌 Z 轴实时更新位置
```

### 2.2 变量定义

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `bIsRotating` | `bool` | `true` | 是否启用旋转 |
| `RotationSpeed` | `float` | `45.0` | 旋转速度（度/秒） |
| `RotationAxis` | `FRotator` | `(0, 0, 1)` | 旋转轴（默认 Z 轴） |
| `bIsFloating` | `bool` | `true` | 是否启用悬浮 |
| `FloatAmplitude` | `float` | `5.0 cm` | 悬浮幅度（峰值偏移） |
| `FloatSpeed` | `float` | `0.8` | 悬浮周期（Hz，对应 card_material §五 FloatSpeed） |
| `BaseZ` | `float` | `0.0` | 初始 Z 坐标（运行时缓存） |
| `bIsPressed` | `bool` | `false` | 当前是否处于按下状态 |
| `PressScaleMultiplier` | `float` | `0.95` | 按下时缩放比例 |
| `CardMaterialInstance` | `UMaterialInstanceDynamic` | — | 运行时动态材质实例引用 |
| `BorderMaterialInstance` | `UMaterialInstanceDynamic` | — | 发光边框动态材质实例引用 |

---

## 三、旋转动画实现

### 3.1 方案：AddActorLocalRotation（Event Tick）

```
Event Tick (DeltaTime)
  │
  ├─ [bIsRotating = true]
  │     DeltaRot = Make Rotator(0, RotationSpeed * DeltaTime, 0)
  │     AddActorLocalRotation(DeltaRot)
  │
  └─ [bIsRotating = false] → 跳过
```

> **备注**：使用 `AddActorLocalRotation` 而非 `SetActorRotation`，避免绝对旋转累积浮点误差。旋转轴默认为 Yaw（Y 轴），视觉上为绕竖轴旋转展示卡牌正背面。

### 3.2 Timeline 平滑启停

```
// 启动旋转时（调用 StartRotation）
Timeline_RotateIn (0.0→1.0, 时长 0.3s, EaseOut 曲线)
  → 将 RotationSpeed 从 0 插值至目标值

// 停止旋转时（调用 StopRotation）
Timeline_RotateOut (1.0→0.0, 时长 0.3s, EaseIn 曲线)
  → 将 RotationSpeed 从当前值插值至 0
```

---

## 四、悬浮效果实现

### 4.1 参数对应关系

参照 `docs/tech_art/SHADERS/card_material.md §五`：

| card_material 参数 | BP 对应变量 | 说明 |
|--------------------|-------------|------|
| `FloatHeight` | `FloatAmplitude` | 悬浮峰值高度（cm） |
| `FloatSpeed` | `FloatSpeed` | 上下浮动周期 |
| `FloatOpacity` | 材质参数，通过 DMI 设置 | 地面光圈透明度 |

### 4.2 实现方案：Event Tick 正弦驱动

```
Event Tick (DeltaTime)
  │
  ├─ [bIsFloating = true]
  │     FloatTime += DeltaTime * FloatSpeed * 2π
  │     ZOffset = Sin(FloatTime) * FloatAmplitude
  │     NewLocation = (X, Y, BaseZ + ZOffset)
  │     SetActorLocation(NewLocation)
  │     // 同步更新材质地面光圈参数
  │     CardMaterialInstance → SetScalarParameterValue("FloatHeight", Abs(ZOffset))
  │
  └─ [bIsFloating = false] → 跳过

BeginPlay
  └─ BaseZ = GetActorLocation().Z   // 缓存初始 Z 坐标
```

> **文脉卡专用参数**（驻留文脉区时）：`FloatAmplitude = 3 cm`，`FloatSpeed = 0.3`，与 card_material.md §9.4 一致。

---

## 五、描边效果（水墨后处理）

### 5.1 配置方式

在测试地图 `L_Test_RotatingCard` 中添加 `PostProcessVolume`，挂载材质实例：

```
PostProcessVolume → Infinite Extent (Unbound) = true
  └─ Blendables → MI_InkWash_PostProcess（Blendable Weight = 1.0）
```

### 5.2 关键参数（参照 ink_wash_postprocess.md §3.1）

| 参数名 | 推荐值 | 说明 |
|--------|--------|------|
| `EdgeColor` | `(0.02, 0.02, 0.04, 1)` | 描边颜色（蓝黑墨色） |
| `DepthSensitivity` | `0.8` | 深度边缘灵敏度 |
| `NormalSensitivity` | `0.5` | 法线边缘灵敏度 |
| `EdgeThickness` | `1.0` | 描边粗细（采样偏移倍数） |
| `EdgeOpacity` | `0.85` | 描边不透明度 |

### 5.3 PoC 验证要点

- [ ] 卡牌旋转时描边跟随稳定，无闪烁
- [ ] 描边仅在卡牌边缘生效，不污染背景
- [ ] 材质指令数符合 ink_wash_postprocess.md 预算（整体后处理 ≤200 指令）

---

## 六、按下反馈

### 6.1 交互实现（OnClicked / OnBeginCursorOver）

```
OnClicked（鼠标点击 / 触摸）
  │
  ├─ bIsPressed = true
  ├─ Timeline_PressDown（0.0→1.0，时长 0.1s，EaseIn）
  │     → SetActorScale3D(Lerp(1.0, PressScaleMultiplier, Alpha))
  │     → BorderMaterialInstance → SetScalarParameterValue("GlowIntensity", Lerp(3.0, 2.1, Alpha))
  ├─ 播放音效：SFX_Card_Press（通过 GameplayTag Audio.SFX.UI.CardPress 触发）
  └─ OnReleased → Timeline_PressUp（1.0→0.0，时长 0.15s，EaseOut）
                    → 恢复 Scale 至 1.0，GlowIntensity 恢复至 3.0

OnBeginCursorOver（鼠标悬停）
  └─ BorderMaterialInstance → SetScalarParameterValue("GlowIntensity", 4.5)
     CardMaterialInstance → SetScalarParameterValue("FloatHeight", 8.0)

OnEndCursorOver（鼠标离开）
  └─ GlowIntensity 恢复 3.0，FloatHeight 恢复正常悬浮值
```

> 参数对应关系参照 `docs/tech_art/SHADERS/card_material.md §六 交互反馈材质参数`。

### 6.2 音效触发

- 音效事件 Tag：`Audio.SFX.UI.CardPress`
- 接收方：`BP_WuxiaAudioManager`
- 音效资产（暂用占位）：`SFX_UI_CardPress_Placeholder`

---

## 七、测试地图 L_Test_RotatingCard

### 7.1 地图配置

```
WX_Maps/L_Test_RotatingCard
  ├─ PostProcessVolume（Infinite Extent）
  │    └─ MI_InkWash_PostProcess
  ├─ DirectionalLight（模拟日光，Lumen 开启）
  ├─ SkyAtmosphere
  ├─ BP_CardDemo_Actor × 20（排成 4×5 阵列，间距 15cm）
  │    各自随机初始旋转角度（BeginPlay 时随机偏移 0–360°，避免同步）
  └─ CameraActor（俯视 45° 固定镜头，可鼠标拖动旋转）
```

### 7.2 DataTable 测试数据

至少填充以下卡牌数据用于 20 张同屏测试：

| 卡牌 | 模型资产 | 材质实例 |
|------|----------|----------|
| 女娲（占位） | `SM_Card_Placeholder_Lv1` | `MI_Card_NuWa_Fire_Front` |
| 盘古（占位） | `SM_Card_Placeholder_Lv1` | `MI_Card_PanGu_Earth_Front` |

> 占位模型可使用 UE 内置 Cube/Plane，替换为正式美术资产后无需改动蓝图。

### 7.3 性能监控配置

在地图的 `WorldSettings` 中启用：
- `stat fps` 显示帧率
- Profiler Target Frame Rate = 60fps
- 建议同时打开 `stat unit` 观察 Frame/Game/Draw/GPU 耗时分布

---

## 八、验收标准

| 验收项 | 标准 | 检测方式 |
|--------|------|----------|
| 帧率 | **≥60fps（1080p，PC）** | stat fps，持续30秒无掉帧 |
| Log 洁净 | **Output Log 零 Warning / 零 Error** | 运行后检查 Output Log 过滤 Warning/Error |
| 旋转动画 | 卡牌绕 Y 轴匀速旋转，无抖动/跳变 | 目视检查 |
| 悬浮效果 | 正弦上下浮动，FloatHeight 参数与地面光圈同步 | 目视 + 材质调试面板 |
| 描边效果 | 卡牌边缘有水墨描边，旋转时稳定不闪烁 | 目视检查 |
| 按下反馈 | 点击卡牌触发缩放 + GlowIntensity 变化 + 音效 | 功能测试 |
| 同屏数量 | 20 张卡牌同屏，帧率达标 | stat fps + Niagara 粒子全开 |

---

## 九、已知限制与后续迭代

| 限制 | 说明 | 迭代计划 |
|------|------|----------|
| 占位美术资产 | 使用 Cube/Plane 占位模型 | M1-Sprint1 替换为正式卡牌 Mesh |
| 翻牌动画 | 本 PoC 不含正背面翻转动画 | M1-Sprint2 补充 |
| 3D 灵将 Mesh 叠加 | 不含角色立体模型叠加效果 | M2 跟进 |
| 触摸端输入 | 仅测试鼠标输入 | M3 补充移动端 Touch 支持 |

---

## 十、相关文档引用

| 文档 | 相关章节 | 说明 |
|------|----------|------|
| `docs/tech_art/SHADERS/card_material.md` | §五 悬浮特效、§六 交互反馈 | FloatHeight/FloatSpeed 参数、按下材质变化 |
| `docs/tech_art/SHADERS/ink_wash_postprocess.md` | §3.1 边缘检测 | EdgeColor/DepthSensitivity 参数 |
| `docs/engineering/ARCHITECTURE.md` | §3.2 CardSystem、§3.7 UI | BP_CardBase 接口参考 |
| `docs/art/VFX_VISUAL.md` | §五行标准色 | ElementColor 参数取值 |

---

*版本：v1.0 | 创建日期：2026-04-30 | 维护人：engineer*
