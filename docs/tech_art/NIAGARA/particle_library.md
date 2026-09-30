# particle_library.md — Niagara 粒子库清单

版本：v0.5 | 适用引擎：UE5.7.4

**变更记录**：
- v0.5：依据 art_director 正式授权规格（CONCEPTS v2 §02 终稿）更新 NS_NuWa_FireAppear §10.1：Spawn Rate 修正为爆发聚合曲线（0–0.5s 400粒爆发，0.5–1.5s 降至 80粒/秒）；新增聚合方向 Vector Field（由下向上，蛇尾→腰→肩→头顺序凝聚）；补充 Emissive 曲线（出生 2.0 → 消亡 0.2）；新增 Post Process 联动（暖色偏移 +500K + 地面朱砂红 Decal）；确认禁止颜色规则（2026-04-30）
- v0.4：依据 CARD_CONCEPTS_v2.md §02 预注册女娲三个 Niagara 系统（NS_NuWa_FireAppear / NS_Fire_TalismanBeam / NS_NuWa_FiveStoneOrbit）；更新总览表（#15–#17）、资源路径、对应关系表（§八）；新增§十 女娲技能粒子系统规格（2026-04-30）
- v0.3：依据 VFX_VISUAL.md v1.2 同步 A-MED-001 修复（NS_Ultimate_InkTide 颜色参数更新：主色 `#1A1A1A`，轮廓边缘色 `#C03A2A` Emissive 1.5）；新增§九 场景 VFX LOD 降级策略（A-LOW-002）（2026-04-30）
- v0.2：依据 VFX_VISUAL.md v1.0 补录 4 个新粒子系统（NS_Attack_BrushStroke / NS_Chang_E_Moonlight / NS_Pangu_EarthCrack / NS_Study_IncenseSmoke）；NS_TalismanGlow 升级说明；总览表更新（2026-04-30）

---

## 一、粒子库总览

| # | 系统名 | 触发场景 | GPU/CPU | Draw Call | 粒子数上限 |
|---|--------|----------|---------|-----------|-----------|
| 1 | NS_InkSplash | 攻击命中/卡牌打出落地 | GPU | 1 | 300 |
| 2 | NS_TalismanGlow | 符箓卡打出/符箓共鸣激活 | GPU | 1 | 150 |
| 3 | NS_AuspiciousCloud | 文脉羁绊激活/胜利/场景装饰 | GPU | 1 | 200 |
| 4 | NS_Crane | 文脉羁绊（仙鹤组）专属 | CPU+GPU | 2 | 5（网格粒子） |
| 5 | NS_WuxingBarrier | 五行结界触发（符箓共鸣结果） | GPU | 2 | 500 |
| 6 | NS_CreationBond | 创世组羁绊激活（最高级羁绊） | GPU | 3 | 800 |
| 7 | NS_CardFloat | 卡牌悬浮粒子（持续环绕） | GPU | 1 | 80 |
| 8 | NS_CardSummon | 灵将召唤入场动画 | GPU | 1 | 250 |
| 9 | NS_CardDeath | 灵将阵亡离场动画 | GPU | 1 | 200 |
| 10 | NS_Attack_BrushStroke | 灵将普通攻击轨迹（Ribbon 飞白笔触） | GPU | 1 | 50（Ribbon 段数） |
| 11 | NS_Skill_FuluWrite | 符箓卡书写轨迹（Ribbon Spline 跟随） | GPU | 1 | 80（Ribbon 段数） |
| 12 | NS_Chang_E_Moonlight | 嫦娥专属月光散点（持续+技能增强） | GPU | 1 | 150 |
| 13 | NS_Pangu_EarthCrack | 盘古专属地裂（Mesh + Beam 组合） | GPU | 2 | 30（Mesh）+20（Beam） |
| 14 | NS_Study_IncenseSmoke | 书斋香炉细腻烟雾（持续循环） | GPU | 1 | 40 |
| 15 | NS_NuWa_FireAppear | 女娲召唤/出场 — 笔触状火焰升腾 | GPU | 1 | 120（Ribbon 段）|
| 16 | NS_Fire_TalismanBeam | 女娲普攻 — 朱砂红→藤黄光轨 Ribbon | GPU | 1 | 60（Ribbon 段）|
| 17 | NS_NuWa_FiveStoneOrbit | 女娲炼石技能 — 五色石环绕+火核 | GPU | 2 | 250 |

---

## 二、各粒子系统详细规格

---

### 2.1 NS_InkSplash — 水墨飞溅

**触发场景**：攻击命中时、卡牌打出落地时  
**视觉描述**：大块水墨从命中点向外飞溅，落地后形成墨渍扩散，边缘毛糙感

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite | — |
| Spawn Rate | 0（Burst） | — |
| Burst Count | 80–300（按伤害量缩放） | SpawnCount = damage / MaxDamage * 300 |
| Lifetime | 0.6 – 1.2 s | Random Range |
| Initial Velocity | Cone，半角 45°，速度 200–600 cm/s | 向外飞溅 |
| Gravity | -150 cm/s²（轻微重力） | 墨滴抛物线 |
| Drag | 3.0 | 空气阻力，模拟墨汁粘性 |
| Size | 5 – 25 px（随 Lifetime 缩小） | |
| Color | (0.02, 0.02, 0.05) → Transparent | 深墨色，末尾透明 |
| Material | MI_Particle_InkDrop（Additive 或 Translucent） | 水滴形状 Sprite |
| Ribbon Trail | 可选：每个粒子拖出短墨线（20 ms 历史） | |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 300 |
| GPU 内存占用 | ~0.8 MB |
| 帧时间贡献 | ≤ 0.3 ms |

**可配置参数**（供 Engineer 暴露给蓝图）：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `SplashScale` | 1.0 | 0.3 – 2.0 | 整体缩放（小伤害/大伤害） |
| `InkColor` | (0.02,0.02,0.05) | Color | 墨色，五行攻击时改为对应颜色 |
| `BurstCount` | 150 | 50 – 300 | 粒子数量 |
| `SpeedMultiplier` | 1.0 | 0.5 – 2.0 | 飞溅速度 |

---

### 2.2 NS_TalismanGlow — 符箓光影

**触发场景**：符箓卡打出时、符箓共鸣检测中  
**视觉描述**：金色/五行色光纹从卡牌中心向外扩展，符文线条闪烁，微微旋转消散

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite + Static Mesh（符文片段） | — |
| Spawn Rate | 0（Burst） | — |
| Burst Count | 50（符文碎片）+ 100（光点） | 分 2 个 Emitter |
| Lifetime | 0.8 – 1.5 s | — |
| Rotation | 初始随机，持续旋转 45°/s | — |
| Initial Velocity | 沿法线方向 50–150 cm/s | 向外扩散 |
| Scale | 放大 → 缩小（Curve：0→1→0） | 出现再消失 |
| Color | ElementColor（五行颜色） + Alpha Fade | — |
| Emissive | 强度 2.0–5.0（触发 Bloom） | — |
| Material | MI_Particle_TalismanLine（Additive） | 符文线条形状 |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 150 |
| GPU 内存占用 | ~0.5 MB |
| 帧时间贡献 | ≤ 0.2 ms |

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `ElementColor` | (1.0, 0.8, 0.2) 金色 | HDR Color | 五行颜色 |
| `GlowIntensity` | 3.0 | 1.0 – 8.0 | 发光强度 |
| `RotationSpeed` | 45 | 0 – 180 °/s | 旋转速度 |
| `BurstScale` | 1.0 | 0.5 – 2.0 | 整体大小 |

---

### 2.3 NS_AuspiciousCloud — 祥云

**触发场景**：文脉羁绊激活、回合胜利、场景背景装饰  
**视觉描述**：淡金/淡白色祥云翻卷飘动，水墨晕染风格，低速飘过画面

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite（大尺寸云朵 Sprite） | — |
| Spawn Rate | 5 /s（持续发射） | — |
| Lifetime | 3.0 – 5.0 s | — |
| Initial Position | 屏幕边缘随机入射 | — |
| Velocity | 水平 30–80 cm/s，垂直 5–15 cm/s | 缓慢飘动 |
| Size | 80 – 200 px | 较大 Sprite |
| Color | (0.9, 0.85, 0.75) → Fade Out | 米白/淡金 |
| Turbulence | Curl Noise Force，Strength=50 | 自然翻卷感 |
| Material | MI_Particle_Cloud（Translucent，Soft） | 软边云朵 |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 200 |
| GPU 内存占用 | ~0.6 MB |
| 帧时间贡献 | ≤ 0.25 ms |

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `CloudColor` | (0.9,0.85,0.75) | Color | 祥云颜色 |
| `CloudDensity` | 1.0 | 0.0 – 3.0 | 云密度（影响 SpawnRate） |
| `CloudSpeed` | 1.0 | 0.2 – 3.0 | 飘动速度倍数 |
| `CloudSize` | 1.0 | 0.5 – 2.0 | 尺寸缩放 |

---

### 2.4 NS_Crane — 仙鹤

**触发场景**：仙鹤文脉羁绊组专属激活动画  
**视觉描述**：1–5 只仙鹤网格粒子从画面下方升起，盘旋一圈后消散，仙鹤白色带墨边线条风格

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | CPU Mesh Particle（Skeletal Mesh 不支持，用 Static Mesh） | — |
| Mesh | SM_Crane_Simple（1500 tri，翅膀展开姿势，4 帧 Flipbook 动画 via UV） | — |
| Spawn Count | 1 – 5（随羁绊级别） | — |
| Lifetime | 4.0 – 6.0 s | — |
| Path | Spline 路径飞行（上升弧线） | — |
| Scale | 30 – 50 cm 翼展 | — |
| Color | 白色 + 深墨描边（材质控制） | — |
| Material | MI_Crane_InkStyle（两面材质，Emissive 描边） | — |

**性能预算**：

| 指标 | 值 |
|------|----|
| Draw Call | 2（Mesh 粒子额外 1 DC） |
| 最大粒子数（网格数） | 5 |
| CPU 开销 | 极低（仅 5 个粒子） |
| 帧时间贡献 | ≤ 0.15 ms |

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `CraneCount` | 3 | 1 – 5 | 仙鹤数量 |
| `FlightSpeed` | 1.0 | 0.5 – 2.0 | 飞行速度 |
| `CraneScale` | 1.0 | 0.5 – 1.5 | 大小缩放 |

---

### 2.5 NS_WuxingBarrier — 五行结界

**触发场景**：符箓共鸣（金木水火土凑齐）触发时  
**视觉描述**：五色光柱从场地四角升起，形成六边形光盾结界轮廓，内部充满五色流光旋转，持续 2 回合

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite × 2（光柱 + 流光） | — |
| 光柱 Emitter | 竖直发射，5 个固定位点（四角+中心） | Burst Count 100 × 5 点 |
| 流光 Emitter | 环形轨道（Torus），半径 = 结界大小 | Spawn Rate 80/s，持续 |
| Lifetime | 光柱：0.8s 入场；流光：持续至结界结束 | — |
| Color | 五行颜色交替（金木水火土，每 0.5s 循环） | Dynamic Color via Curve |
| Size | 流光粒子：3–8 px | — |
| Emissive | 4.0–8.0（强 Bloom 效果） | — |
| Material | MI_Particle_BarrierLine（Additive） | — |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 2 |
| 最大粒子数 | 500 |
| GPU 内存占用 | ~1.5 MB |
| 帧时间贡献 | ≤ 0.5 ms（持续存在时） |

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `BarrierRadius` | 400 cm | 200 – 800 cm | 结界半径（跟随场地大小） |
| `GlowIntensity` | 5.0 | 2.0 – 10.0 | 发光强度 |
| `ColorCycleSpeed` | 0.5 | 0.1 – 2.0 | 五色切换速度（Hz） |
| `ParticleCount` | 1.0 | 0.3 – 1.0 | 粒子数量倍数（性能调节） |
| `BarrierDuration` | -1（由蓝图控制结束） | — | -1 表示持续 |

---

### 2.6 NS_CreationBond — 创世组羁绊

**触发场景**：创世文脉羁绊激活（最高级，场面全场景特效）  
**视觉描述**：全屏光芒爆发，星辰粒子从四方汇聚，形成创世轮盘图案，场地背景瞬间切换为宇宙混沌态，持续 3 秒入场动画

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite × 3（星尘 + 光线 + 轮盘符文） | — |
| 星尘 Emitter | 全屏随机，Burst 800 粒子，向中心收拢 | — |
| 光线 Emitter | 从中心向外放射 12 条光线，Ribbon Trail | — |
| 轮盘 Emitter | 圆形排布 80 个符文粒子，旋转 | — |
| Lifetime | 入场 3.0s，持续 Loop 到蓝图手动停止 | — |
| Color | 金白色主体 + 五行色点缀 | — |
| Emissive | 8.0–15.0（极强 Bloom） | — |
| Material | MI_Particle_StarDust + MI_Particle_LightRay | — |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 3 |
| 最大粒子数 | 800 |
| GPU 内存占用 | ~2.5 MB |
| 帧时间贡献 | ≤ 0.8 ms（入场峰值，随后降低） |

> **注意**：创世羁绊为全场最高规格特效，触发时建议暂停其他粒子系统（通过蓝图 Deactivate 调用），确保总粒子数控制在 PERF_BUDGET 上限内。

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `BurstIntensity` | 1.0 | 0.5 – 2.0 | 入场爆发规模 |
| `GlowIntensity` | 10.0 | 5.0 – 15.0 | 发光强度 |
| `RotationSpeed` | 30 °/s | 10 – 90 | 轮盘旋转速度 |
| `StarCount` | 800 | 400 – 800 | 星尘数量（性能调节） |

---

### 2.7 NS_CardFloat — 卡牌悬浮粒子

**触发场景**：卡牌处于手牌/场地悬浮状态时持续播放  
**视觉描述**：微小光点/墨尘粒子围绕卡牌缓慢漂浮，随五行颜色微发光

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 80 |
| 帧时间贡献 | ≤ 0.1 ms / 卡牌 |

> **重要**：手牌中最多 7 张卡牌，场地最多 10 张，峰值 17 个 NS_CardFloat 实例，总粒子 17 × 80 = 1360，仍在预算内。

---

### 2.8 NS_CardSummon — 灵将召唤入场

**触发场景**：灵将卡打出进入场地时  
**视觉描述**：从卡牌中心爆发出元素粒子，角色 3D 模型从粒子中"浮现"，带入场光效

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 250 |
| 持续时间 | 1.5 s（非循环） |
| 帧时间贡献 | ≤ 0.3 ms |

---

### 2.9 NS_CardDeath — 灵将阵亡离场

**触发场景**：灵将 HP 归零阵亡时  
**视觉描述**：角色碎裂成水墨粒子消散，五行元素光点飞散

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 200 |
| 持续时间 | 1.2 s（非循环） |
| 帧时间贡献 | ≤ 0.25 ms |

---

## 三、全场同时激活性能峰值评估

| 场景 | 激活粒子系统 | 总 Draw Call | 总粒子数 |
|------|-------------|-------------|---------|
| 日常对战（无特殊效果） | NS_CardFloat × 17 | 17 | 1360 |
| 攻击命中 + 符箓打出 | +NS_InkSplash + NS_TalismanGlow | 19 | 1810 |
| 五行结界激活（峰值） | +NS_WuxingBarrier + NS_AuspiciousCloud | 22 | 2510 |
| 创世羁绊（最高峰值） | NS_CreationBond（其他降级） | 10 | 2500 |

**全场峰值**：Draw Call ≤ 22（粒子部分），总粒子 ≤ 3000，符合 PERF_BUDGET 50,000 上限。

---

## 四、粒子材质列表

| 材质名 | 混合模式 | 用途 |
|--------|----------|------|
| MI_Particle_InkDrop | Translucent | 水墨飞溅墨滴 |
| MI_Particle_TalismanLine | Additive | 符箓光纹 |
| MI_Particle_Cloud | Translucent Soft | 祥云 |
| MI_Crane_InkStyle | Default Lit（两面） | 仙鹤网格 |
| MI_Particle_BarrierLine | Additive | 五行结界流光 |
| MI_Particle_StarDust | Additive | 创世星尘 |
| MI_Particle_LightRay | Additive | 创世光线 |
| MI_Particle_FloatDust | Additive | 卡牌悬浮尘 |

---

## 五、Niagara 资源存放路径

```
Content/Art/VFX/Niagara/
  ├── Systems/
  │   ├── NS_InkSplash.uasset
  │   ├── NS_TalismanGlow.uasset
  │   ├── NS_AuspiciousCloud.uasset
  │   ├── NS_Crane.uasset
  │   ├── NS_WuxingBarrier.uasset
  │   ├── NS_CreationBond.uasset
  │   ├── NS_CardFloat.uasset
  │   ├── NS_CardSummon.uasset
  │   ├── NS_CardDeath.uasset
  │   ├── NS_Attack_BrushStroke.uasset      ← v0.2 新增
  │   ├── NS_Skill_FuluWrite.uasset         ← v0.2 新增（NS_TalismanGlow 书写轨迹拆分）
  │   ├── NS_Chang_E_Moonlight.uasset       ← v0.2 新增
  │   ├── NS_Pangu_EarthCrack.uasset        ← v0.2 新增
  │   └── NS_Study_IncenseSmoke.uasset      ← v0.2 新增
  │   ├── NS_NuWa_FireAppear.uasset         ← v0.4 新增（女娲出场火焰）
  │   ├── NS_Fire_TalismanBeam.uasset       ← v0.4 新增（女娲普攻光轨）
  │   └── NS_NuWa_FiveStoneOrbit.uasset    ← v0.4 新增（女娲炼石环绕）
  ├── Emitters/         # 共享 Emitter 模板
  ├── Modules/          # 自定义 HLSL 模块
  └── Materials/        # 粒子材质
```

---

## 六、v0.2 新增粒子系统详细规格（依据 VFX_VISUAL.md v1.0）

---

### 6.1 NS_Attack_BrushStroke — 攻击飞白笔触

**触发场景**：灵将卡发动基础攻击  
**视觉描述**：毛笔横扫宣纸的飞白笔触向目标射出，粗细随路径衰减

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Ribbon | — |
| Ribbon 路径 | 攻击者 → 目标 直线 | SplinePoints = [Source, Target] |
| Ribbon Speed | 15–25 m/s | 0.1–0.15s 跨场 |
| Ribbon Width | Source 端 0.15m → Target 端 0.02m（衰减曲线） | |
| Ribbon Segments | 20 段 | 平滑度/Draw Call 平衡 |
| Lifetime | 0.3s（非循环） | |
| Material | MI_Particle_BrushStroke（Translucent，横纹贴图） | 贴图：`T_BrushStroke_FlyWhite` |
| Color | `#2C2C2C`（墨分五色·焦墨），Alpha 0.9 → 0 | |
| Emissive | 0（无发光，纯墨色） | |

**命中溅散**：触发 NS_InkSplash，BurstCount=80，飞溅方向偏向攻击来向反方向

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| Ribbon 段数（粒子等效） | 50 |
| 帧时间贡献 | ≤ 0.2 ms |

**可配置参数**：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `SourcePos` | Vector3 | 攻击者世界位置（蓝图传入） |
| `TargetPos` | Vector3 | 目标世界位置（蓝图传入） |
| `StrokeWidth` | 1.0 | 笔触宽度倍数 |
| `StrokeColor` | `#2C2C2C` | 可改为五行色（特殊技能攻击时） |

---

### 6.2 NS_Skill_FuluWrite — 符箓书写轨迹

> **说明**：从 NS_TalismanGlow 中拆分出 Ribbon 书写轨迹部分，独立为本系统。  
> NS_TalismanGlow 保留 Sprite 消散光纹（NS_Skill_FuluBurst 效果），两者配合使用。

**触发场景**：符箓卡发动，触发 FuluWrite（书写）→ 2 秒后自动触发 TalismanGlow（消散）

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Ribbon（多段，沿 Spline 播放） | |
| Spline 配置 | 每个符箓技能单独 Spline Asset（存于 DT_Skills 中 SplineRef 字段） | |
| Ribbon 播放速度 | 8 m/s 沿笔画路径 | |
| Ribbon Width | 重笔段 0.08m，轻笔段 0.03m（由 Spline Point Weight 驱动） | |
| Lifetime | Spline 播放时长（0.8–1.5s，随笔画长度变化）+ 短暂残留 0.3s | |
| Material | MI_Particle_FuluRibbon（Additive） | 贴图：`T_Fulu_Strokes` |
| Color | `#C0392B`（朱砂红），Emissive 2.0 | |
| 消散触发 | Ribbon 播放完毕后，自动 SpawnSystem NS_TalismanGlow（BurstCount 300，颜色 `#C0392B` + `#D4AF37`） | |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1（Ribbon） |
| Ribbon 段数 | ≤ 80 |
| 帧时间贡献 | ≤ 0.2 ms |

---

### 6.3 NS_Chang_E_Moonlight — 嫦娥月光散点

**触发场景**：嫦娥卡在场时持续发散；技能激活时爆发增强

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Sprite | |
| Spawn Rate | 持续 30 粒/秒；技能激活时 150 粒/秒（蓝图传 `SpawnMultiplier` 参数控制） | |
| Lifetime | 2–4s | Random Range |
| Initial Position | 以嫦娥卡为中心，球形随机分布，半径 40–80 cm | |
| Velocity | 向上缓浮 0.2–0.8 m/s + Curl Noise（Strength=20） | |
| Size | 0.01–0.04m | |
| Rotation | 随机初始 + 持续旋转 10–30°/s | |
| Color | `#C0C0C0`（螺钿银）→ `#F5F0E8`（宣纸白），随机 Lerp | |
| Emissive | 0.3–0.8（微发光，不触发 Bloom） | |

**Lumen 联动（蓝图控制，非粒子内部）**：
- 嫦娥技能激活 → 蓝图修改 Directional Light 强度 0.5→2.0，Color 偏 `#2E86C1`（石青二青）
- 3s 后 Timeline 曲线恢复

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数 | 150（技能激活峰值） |
| 帧时间贡献 | ≤ 0.15 ms（持续状态 0.05 ms） |

**可配置参数**：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `SpawnMultiplier` | 1.0 | 技能激活时设为 5.0，之后 Timeline 归 1.0 |
| `EmissiveIntensity` | 0.5 | |
| `ParticleRadius` | 60 cm | 散布半径（随卡牌位置动态） |

---

### 6.4 NS_Pangu_EarthCrack — 盘古地裂

**触发场景**：盘古灵将技能释放（召唤时 / 主动技能）

| Emitter | 参数 | 值 |
|---------|------|----|
| **地裂碎块** Mesh Particle | Mesh：SM_RockChunk_* （5 种形状，Blender 烘焙，500–1500 tri/个） | |
| | Spawn Count | 爆发 30 个（非循环） |
| | Velocity | 2–5 m/s，低速向外，抛物线（Gravity -200 cm/s²） |
| | Rotation | 随机初始 + 随机翻滚 30–90°/s | |
| | Size | 0.1–0.5m，随机缩放 |
| | Color / Material | MI_RockChunk（PBR，赭石 `#7B3F00` + 尘土 `#8C8C8C` Blend） |
| | Lifetime | 1.5–2.5s |
| **裂缝光线** Beam Particle | 从地面向上，锯齿形 Spline | Beam Count = 4（X 形两条） |
| | Beam Width | 0.05m |
| | Color | `#D35400`（赭红热光）→ `#F4D03F`（金光边） |
| | Emissive | 3.0–5.0（触发 Bloom） |
| | Lifetime | 0.8s（非循环） |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 2（Mesh Particle + Beam） |
| Mesh 粒子数 | 30 |
| 帧时间贡献 | ≤ 0.4 ms（爆发帧） |

---

### 6.5 NS_Study_IncenseSmoke — 书斋香炉烟

**触发场景**：书斋场景持续循环（低优先级，低端机可关闭）

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Ribbon + Turbulence | |
| Spawn Rate | 2 粒/秒（极低速） | |
| Lifetime | 4–8s | |
| Initial Position | 香炉口位置（绑定至 `Prop_Incense_Burner` Socket） | |
| Velocity | 向上 0.1 m/s | |
| Turbulence | Curl Noise，Strength=5，Frequency=0.3 | 缓慢弯曲 |
| Ribbon Width | 起始 0.005m → 随 Lifetime 扩展至 0.02m | |
| Color | `#8C8C8C`，Opacity 0.05–0.15 | |
| Material | MI_Particle_IncenseSmoke（Translucent，极软边） | 贴图：`T_Smoke_Wisp` |
| LOD / 开关 | 低端配置时蓝图调用 `Deactivate()`；优先级最低 | |

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| 最大粒子数（Ribbon 段） | 40 |
| 帧时间贡献 | ≤ 0.05 ms |

---

## 七、NS_TalismanGlow 升级说明（v0.2）

原 v0.1 中 NS_TalismanGlow 承担"书写轨迹 + 消散"两个职责，但书写轨迹需要 Ribbon（Spline 跟随），与 Sprite 方案不兼容，故拆分：

| 职责 | 系统 | 实现方式 |
|------|------|---------|
| 符箓书写轨迹 | **NS_Skill_FuluWrite**（新） | Ribbon Particle，Spline 跟随，朱砂红 |
| 符文消散光纹 | **NS_TalismanGlow**（保留，职责收窄） | Sprite Burst，ElementColor 驱动，五行颜色 |

NS_TalismanGlow 在 DT_Skills 中继续作为通用符箓消散特效使用（符箓卡共鸣检测、增益等），不需要书写轨迹的场景仍直接调用此系统。

---

## 八、VFX_VISUAL ↔ particle_library 对应关系终稿（v0.2）

| VFX_VISUAL 命名 | particle_library 对应 | 状态 |
|---|---|---|
| NS_CardSummon_InkBurst | NS_CardSummon（主体）+ NS_InkSplash（落地溅射） | ✅ 已覆盖 |
| NS_Attack_BrushStroke | NS_Attack_BrushStroke（新，#10）+ NS_InkSplash | ✅ 已补录 |
| NS_Hit_InkSplash | NS_InkSplash | ✅ 已覆盖 |
| NS_Skill_FuluWrite | NS_Skill_FuluWrite（新，#11）+ NS_TalismanGlow（消散） | ✅ 已补录 |
| NS_Skill_FuluBurst | NS_TalismanGlow（职责保留）| ✅ 对应 |
| NS_Ultimate_InkTide | NS_CreationBond（#6）+ Post Process 联动（RENDER_PLAN 4.1） | ✅ 对应（大招泼墨主体用 NS_CreationBond Mesh Wave，非新建）<br>**v1.2 色值更新（A-MED-001）**：主色 `#1A1A1A`（墨面主体），轮廓边缘色 `#C03A2A`（朱砂红，Emissive 1.5）<br>嫦娥大招联动：NS_Chang_E_Moonlight 不暂停，降至 Spawn Rate 15粒/秒 |
| NS_Chang_E_Moonlight | NS_Chang_E_Moonlight（新，#12）| ✅ 已补录 |
| NS_Pangu_EarthCrack | NS_Pangu_EarthCrack（新，#13）| ✅ 已补录 |
| NS_Kunlun_CloudDrift | NS_AuspiciousCloud（CloudDensity 调低，CloudSpeed 极慢）| ✅ 复用 |
| NS_Stage_LanternFlicker | 光源 Perlin Noise 驱动（蓝图，不需要粒子系统）| ✅ 正确 |
| NS_Study_IncenseSmoke | NS_Study_IncenseSmoke（新，#14）| ✅ 已补录 |
| NS_NuWa_FireAppear | NS_NuWa_FireAppear（新，#15，CONCEPTS v2 §02）| ✅ 已预注册（v0.4）|
| NS_Fire_TalismanBeam | NS_Fire_TalismanBeam（新，#16，CONCEPTS v2 §02）| ✅ 已预注册（v0.4）|
| NS_NuWa_FiveStoneOrbit | NS_NuWa_FiveStoneOrbit（新，#17，CONCEPTS v2 §02）| ✅ 已预注册（v0.4）|

*版本：v0.5 | 更新日期：2026-04-30 | 维护人：tech_artist*

---

## 九、场景 VFX LOD 降级策略（A-LOW-002，依据 VFX_VISUAL.md v1.2 §5.1）

> **触发机制**：BP_BattleController 在战斗开始/结束/大招激活时广播事件；所有可降级场景 VFX Actor 挂载 `BP_VFX_BattleLODController` 组件，监听以下三个事件自动响应：
> - `OnBattleStart` → 战斗降级
> - `OnBattleEnd` → 恢复默认
> - `OnUltimateActivate` → 大招暂停

| 场景 VFX 系统 | 非战斗（默认） | 战斗中（OnBattleStart） | 大招激活（OnUltimateActivate） |
|--------------|--------------|----------------------|------------------------------|
| NS_AuspiciousCloud（昆仑墟云雾，CloudDensity 极低模式） | Spawn Rate 正常，CloudDensity 0.3 | Spawn Rate 降至 50%，CloudDensity 0.15 | `SetSystemActive(false)` 暂停 |
| NS_Stage_LanternFlicker（灯笼光晕，Perlin 驱动光源） | 正常，全部灯笼激活 | 仅前景 2 个灯笼保持，其余 `SetSystemActive(false)` | `SetSystemActive(false)` 全部暂停 |
| NS_Study_IncenseSmoke（香炉烟） | 正常，Spawn Rate 2粒/秒 | `SetSystemActive(false)` 暂停 | `SetSystemActive(false)` 暂停 |
| VFX_CraneFlying（仙鹤，NS_Crane 触发式） | 正常触发 | 禁止新触发（当前实例播放完毕后不再生成） | `SetSystemActive(false)` 暂停 |
| VFX_InkWash_Ambient（水墨晕染 Post Process） | 强度 0.6 | 强度降至 0.3 | 强度 0（大招 PP 接管） |
| KL_GroundFog_Sheet（地面薄雾 Plane Mesh） | 可见，Opacity 0.4 | 可见，Opacity 0.2 | 可见（不占粒子预算，不暂停） |

**NS_Chang_E_Moonlight 特殊规则（大招联动）**：
- 大招激活时：**不暂停**，但 Spawn Rate 降至 **15粒/秒**（由 BP_VFX_BattleLODController 通过 `SpawnMultiplier` 参数动态设置）
- 视觉意图：月光银作为大招黑红墨面中的零星光点，强化「月在墨中」意境对比

**粒子预算核算（配合 A-LOW-002 策略后）**：

| 场景状态 | 估算粒子数 | 预算上限 | 余量 |
|---------|----------|---------|------|
| 战斗中（无大招） | 战斗特效 ≤1500 + 环境降配 ≤300 | 2000 | ~200 |
| 大招激活峰值 | NS_CreationBond 800 + 其余清零 + 月光 ≤15粒存活 | 3500 | ~2685 |
| 低端配置 | 仅攻击/出牌特效 ≤600 | 800 | ~200 |

---

## 十、女娲技能粒子系统规格（v0.4，依据 CARD_CONCEPTS_v2.md §02）

---

### 10.1 NS_NuWa_FireAppear — 女娲出场火焰升腾（v0.5 终稿，art_director 正式授权）

**触发场景**：① 女娲卡牌召唤进入战场（OnSummon 事件）；② 第二章剧情出场过场动画

**视觉描述**：朱砂矿物粒子从卡牌底部向上聚合成形，类似古代窑变——粒子由蛇尾→腰→肩→头顺序凝聚（1.5–2.0s），非爆炸式出场。细长笔触带状，边缘毛糙飞白感，非西方球形/锥形火焰。

**视觉参考锚点**（art_director 定调）：
- 形态参考：《封神演义》炉火——烈而有形，火势聚拢不散
- 色彩参考：传统朱砂矿物色（非卡通橙黄，是沉重宝石红）
- 笔触感参考：吴道子线描中的衣纹飞动——Ribbon 宽窄随机，非均匀

**模块配置**：

| 模块 | 参数 | 值 |
|------|------|----|
| Emitter Type | GPU Ribbon | — |
| 粒子形态 | Ribbon 带 Curl Noise 轻微摇曳，边缘毛糙（飞白感），Ribbon 宽窄随机 | MVP 替代手绘贴图 |
| **聚合方向** | Vector Field 引导，由下向上，蛇尾→腰→肩→头顺序凝聚 | 非全向发散 |
| **Spawn Rate（爆发阶段）** | 0–0.5s：Burst **400 粒**（聚合爆发） | — |
| **Spawn Rate（衰减阶段）** | 0.5–1.5s：持续 **80 粒/秒**（衰减维持） | — |
| Lifetime | 0.6–1.2 s | — |
| 尺寸 | 0.02–0.08m 笔触宽度 | 宽窄随机 |
| Initial Position | 卡牌底部，Spawn Y 偏随机 ±5 cm | — |
| 覆盖范围 | 卡牌底部向上，画面 40–60% 高度 | — |
| Color — 主色（70%） | `#C03A2A`（朱砂红） | — |
| Color — 飞散色（30%） | `#D35400`（朱磦橙，扩散飞散粒子） | — |
| Color — 消亡色 | `#8C8C8C`（淡墨，粒子消亡时渐变至此） | — |
| 内发光细节 | `#F4D03F` 藤黄，仅允许作极细内发光，占比 ≤ 10% | — |
| **禁止颜色** | `#8C6040` 土色 / 赭石系；`#F4D03F` 藤黄不可单独大面积使用；`#2A4A7A` 石青/蓝光 | — |
| **Emissive 曲线** | 出生 2.0 → 消亡 0.2（随 Lifetime 线性衰减） | — |
| Opacity Curve | 先快后慢（出现快，消散慢）| — |
| Material | MI_Particle_NuWaFire（Additive，横纹贴图 `T_BrushStroke_FlyWhite`）| — |

**Post Process 联动（出场动画专属）**：
- 出场瞬间：暖色偏移 **+500K**（0.3s 内恢复至默认色温）
- 地面朱砂红 Decal：半径 0.5m，材质 `MI_Decal_ZhuSha`，持续至粒子消散后 0.2s 淡出

**LOD 降级**：战斗激烈时 Spawn Rate ×0.5（按 VFX_VISUAL v1.2 §九策略）

**性能预算**：

| 指标 | 值 |
|------|----|
| GPU Draw Call | 1 |
| Ribbon 段数（粒子等效上限） | 120 |
| 爆发帧粒子峰值 | ≤ 400（0–0.5s），≤ 120（0.5s 后） |
| 帧时间贡献 | ≤ 0.35 ms（爆发帧）/ ≤ 0.15 ms（衰减阶段） |

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `FireColor` | `#C03A2A` | HDR Color | 主火色（朱砂红） |
| `ScatterColor` | `#D35400` | HDR Color | 飞散粒子色（朱磦橙） |
| `BurstCount` | 400 | 200–400 | 爆发聚合粒子数 |
| `SustainRate` | 80 | 40–120 粒/秒 | 衰减阶段持续速率 |
| `HeightCoverage` | 0.5 | 0.4–0.6 | 覆盖画面高度比例 |
| `EmissiveIntensity` | 2.0 | 1.0–3.0 | 出生 Emissive 强度（消亡固定 0.2） |
| `NoiseStrength` | 0.3 | 0.0–0.8 | Curl Noise 扰动幅度 |
| `PostProcessWarmth` | 500 | 0–1000 K | 出场色温偏移（0 = 禁用） |

---

### 10.2 NS_Fire_TalismanBeam — 女娲普攻符箓光轨

**触发场景**：女娲卡发动基础攻击

**视觉描述**：朱砂红符箓光轨从攻击者射向目标，抵达时转变为藤黄收束爆散

| 模块 | 参数 | 值 |
|------|------|----||
| Emitter Type | GPU Ribbon | — |
| Ribbon 颜色渐变 | Source 端 `#C03A2A`（朱砂红）→ Target 端 `#F4D03F`（藤黄）| 沿路径颜色渐变 |
| Emissive | 2.0（朱砂红段）→ 3.5（藤黄收束段）| — |
| Ribbon Speed | 20–30 m/s | 0.08–0.12s 跨场 |
| Ribbon Width | Source 0.12m → Target 0.05m | 收束形态 |
| Ribbon Segments | 20 段 | — |
| Lifetime | 0.25s（非循环）| — |
| Material | MI_Particle_FuluRibbon（Additive，贴图 `T_Fulu_Strokes`）| — |

**命中**：触发 NS_TalismanGlow（BurstCount 200，ElementColor `#C03A2A`）

**性能预算**：

| 指标 | 值 |
|------|----||
| GPU Draw Call | 1 |
| Ribbon 段数 | 60 |
| 帧时间贡献 | ≤ 0.15 ms |

---

### 10.3 NS_NuWa_FiveStoneOrbit — 女娲炼石五色石环绕

**触发场景**：女娲主动技能「炼石补天」激活

**视觉描述**：五色石（金木水火土五行色）环绕女娲卡牌旋转，中心有朱砂红火核发光；激活后五石飞散命中目标

| Emitter | 参数 | 值 |
|---------|------|----||
| **五色石环绕** Mesh Particle | Mesh：SM_Stone_Round（800 tri）× 5 个，五行色分别着色 | — |
| | Orbit Radius | 20–30 cm（以女娲卡为中心）|
| | Rotation Speed | 60–90°/s 逆时针旋转 |
| | Scale | 0.05–0.08m |
| | Color | 五行色：金`#C8A04A` 木`#4A8C5C` 水`#2A4A7A` 火`#C03A2A` 土`#8C6040` |
| | Emissive | 2.0（技能激活前蓄力阶段 3.0）|
| **火核** Sprite Emitter | 中心朱砂红火球，Spawn Rate 30/s，Lifetime 0.2s | — |
| | Size | 5–12 px，随旋转速度缩放 |
| | Color | `#C03A2A` Emissive 2.5 |
| **飞散阶段**（激活触发）| 五石 Velocity 按各自目标方向飞出，Mesh 粒子 Burst | — |

**性能预算**：

| 指标 | 值 |
|------|----||
| GPU Draw Call | 2（Mesh Particle + 火核 Sprite）|
| Mesh 粒子数 | 5 |
| Sprite 粒子数 | 250（火核 + 飞散轨迹）|
| 帧时间贡献 | ≤ 0.35 ms（飞散爆发帧）|

**可配置参数**：

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| `OrbitRadius` | 25 cm | 环绕半径 |
| `OrbitSpeed` | 75 °/s | 旋转速度 |
| `FireCoreIntensity` | 2.5 | 火核 Emissive 强度 |
| `ChargeMultiplier` | 1.0 | 蓄力时设为 1.5，加速旋转+增亮 |
