# PERF_BUDGET.md — 《文脉·山海卡》性能预算

版本：v0.2 | 引擎：Unreal Engine 5.7.4

**变更记录**：
- v0.2：新增 Bloom 性能监控指标（TECH-002 评审反馈）；新增 M0 Nanite 实测数据记录节；后处理帧预算细化

---

## 一、目标平台与帧率

| 平台 | 分辨率 | 帧率目标 | 优先级 |
|------|--------|----------|--------|
| PC（GTX 1060 级别起） | 1080p | 60 fps 稳定 | **P0 当前迭代** |
| PC 高画质（RTX 3070+） | 1440p | 60 fps+ | P1 |
| 移动端（Android / iOS 中端） | 720p | 30 fps | P2（后续迭代） |

**帧时间预算（PC 1080p 60fps）**：每帧 ≤ 16.67 ms

---

## 二、帧时间分配

| 渲染阶段 | 预算 (ms) | 说明 |
|----------|-----------|------|
| 几何渲染（Nanite） | ≤ 3.0 | 含 Nanite 光栅化 + Depth Pre-pass |
| Lumen GI + 反射 | ≤ 3.5 | 软件 Lumen，Final Gather Quality=1 |
| Virtual Shadow Maps | ≤ 1.5 | 含缓存命中，动态物体额外 |
| 后处理（全部） | ≤ 2.5 | LUT + Bloom + DoF + InkWash 材质；含 Bloom Pass（见第十一节监控） |
| Niagara 粒子 GPU | ≤ 2.0 | 含粒子模拟 + 渲染 |
| UI 渲染 | ≤ 1.0 | UMG / Slate，手牌/HUD |
| CPU → GPU 提交 / 其他 | ≤ 2.67 | 余量，含驱动开销 |
| **合计** | **≤ 16.17** | **留 0.5ms 安全余量** |

---

## 三、Draw Call 上限

| 场景 | Draw Call 上限 | 说明 |
|------|----------------|------|
| 卡牌对战界面（手牌 + 场地） | ≤ 300 | Nanite 合并 + Instancing |
| 昆仑墟场景（背景） | ≤ 500 | Nanite 场景 + 植被 Instance |
| 粒子系统（全部激活） | ≤ 150 | 每个 Niagara 系统独立 Draw |
| UI 层（HUD + 手牌动画） | ≤ 100 | UMG 合批 |
| **峰值上限（全激活）** | **≤ 1000** | 含后处理 Pass |

> **Nanite 说明**：Nanite 下 Static Mesh 的 Draw Call 近似于 1 个 Nanite Pass，场景几何 Draw Call 计数不按传统方式计算；上表 500 指的是 Nanite 之外的非 Nanite 物体 Draw Call。

---

## 四、显存（VRAM）预算

| 类别 | 显存上限 | 说明 |
|------|----------|------|
| 纹理（Texture Streaming） | ≤ 1500 MB | 水墨 LUT、卡牌贴图、宣纸纹理等 |
| 几何 / Nanite Page Pool | ≤ 512 MB | `r.Nanite.MaxPagePoolSize` 默认 512MB |
| Virtual Shadow Maps | ≤ 256 MB | `r.Shadow.Virtual.MaxPhysicalPages=2048` |
| Lumen Scene Data | ≤ 256 MB | 表面缓存 + 辐照缓存 |
| Niagara GPU 缓冲区 | ≤ 128 MB | 粒子属性缓冲区 |
| RenderTarget / GBuffer | ≤ 300 MB | 1080p GBuffer，约 7 个通道 |
| **总计（峰值）** | **≤ 3000 MB** | GTX 1060（6GB）可用约 5.5GB，有余量 |

---

## 五、LOD 分层策略

### 5.1 角色灵将（Skeletal Mesh）

| LOD | 触发距离 | 三角面数上限 | 说明 |
|-----|----------|-------------|------|
| LOD0 | 0 – 200 cm | ≤ 15,000 tri | 卡牌特写，全细节 |
| LOD1 | 200 – 600 cm | ≤ 6,000 tri | 场地战斗视图 |
| LOD2 | 600 cm+ | ≤ 2,000 tri | 远景/背景装饰 |

> 骨骼网格不用 Nanite，必须手动制作 LOD 链（Blender 减面 + 导入时 `Import LODs`）。

### 5.2 场景静态道具（Nanite 启用）

- Nanite 自动处理 LOD，**无需手动制作 LOD 链**。
- 超过 400m 视距的背景物件可标记 `Nanite Fallback Relative Error = 0.5`，进一步降低远景面数。

### 5.3 卡牌静态网格

| LOD | 触发距离 | 说明 |
|-----|----------|------|
| LOD0（Nanite） | 全程 | Nanite 自动，卡牌花纹浮雕保留 |
| 手牌 UI 模式 | — | 用 UMG 渲染，不走 3D mesh |

### 5.4 植被

| 类型 | LOD 数量 | Billboard 距离 |
|------|----------|----------------|
| 松树（场景装饰） | 3 LOD + Billboard | 2000 cm 切换 Billboard |
| 草丛 | 2 LOD | 800 cm 切换 |

---

## 六、Occlusion 遮挡剔除策略

### 6.1 硬件遮挡查询（HW Occlusion Query）

```ini
r.HZBOcclusion = 1          # 启用 HZB（Hierarchical Z-Buffer）遮挡剔除
r.AllowOcclusionQueries = 1
```

- 对所有非 Nanite 物体启用 Occlusion Bounds（在 Actor 属性中设置紧凑 AABB）。
- Nanite 内置遮挡剔除，自动处理。

### 6.2 视锥体剔除（Frustum Culling）

- 手牌区域的卡牌（场外手牌槽）：使用 `bOnlyOwnerSee` / 基于游戏逻辑的 SetVisibility，减少场外卡牌参与渲染。
- 背景场景在卡牌特写时整体降低 `MaxDrawDistance`（可通过 PPV 切换）。

### 6.3 距离剔除

```ini
r.SkipRenderingSimpleElements = 0  # 保留简单元素（调试用）
```

| 物体类型 | Max Draw Distance |
|----------|------------------|
| 背景植被 | 3000 cm |
| 场景装饰石块 | 5000 cm |
| 粒子特效 | 1500 cm（远处自动停止模拟） |

---

## 七、纹理优化规范

| 纹理类型 | 最大分辨率 | 格式 | MipMap |
|----------|-----------|------|--------|
| 卡牌正面 Albedo | 1024×1024 | BC7 | 是 |
| 卡牌 Normal Map | 1024×1024 | BC5 | 是 |
| 宣纸纹理（后处理） | 512×512 | BC4（单通道） | 否（全屏 Tile） |
| 水墨噪声贴图 | 512×512 | BC4 | 是 |
| LUT 贴图 | 256×16 | 不压缩 Volume | 否 |
| 角色贴图 | 2048×2048 | BC7 | 是 |
| 场景贴图 | 2048×2048 | BC7 | 是 |
| UI 图标 | 256×256 | BC7 | 否 |

**Streaming 策略**：
- 卡牌贴图（当前手牌）标记为 `Texture Streaming Priority = 1`（高优先级常驻）。
- 场景背景贴图默认 Streaming，闲置时可降级到 Mip2。

---

## 八、CPU 性能预算

| 系统 | CPU 预算 (ms) | 说明 |
|------|--------------|------|
| 游戏逻辑 / 状态机 | ≤ 2.0 | 回合制逻辑，非每帧高频 |
| 动画（AnimBP）更新 | ≤ 1.5 | 最多 10 张灵将同时在场 |
| Niagara CPU 粒子 | ≤ 1.0 | 绝大多数粒子走 GPU，CPU 负责调度 |
| AI / Pathfinding | ≤ 1.0 | PvAI 回合制，非实时 |
| 网络 / 序列化（后续） | ≤ 1.5 | PvP 迭代预留 |
| 渲染线程提交 | ≤ 2.0 | Draw Call 提交 |
| **合计** | **≤ 9.0 ms** | 60fps CPU 预算 16.67ms，余量充足 |

---

## 九、性能分析工具

| 工具 | 用途 |
|------|------|
| `stat GPU` | GPU 帧时间分解 |
| `stat SceneRendering` | Draw Call 数量 |
| `r.ProfileGPU` | 单帧 GPU 分析 |
| Unreal Insights | 完整 CPU/GPU 时间线 |
| `Nanite.Stats 1` | Nanite 三角面/簇统计 |
| `stat Niagara` | 粒子系统各项开销 |
| RenderDoc（外部） | 精细 Draw Call 调试 |

---

## 十、性能红线（超出即阻断发布）

- [ ] GPU 帧时间 > 18ms（1080p，GTX 1060）
- [ ] VRAM 峰值 > 5GB
- [ ] Draw Call > 1500（单帧峰值）
- [ ] Niagara 粒子数 > 50,000（单帧总计）
- [ ] 任何场景首次进入卡顿 > 500ms（Shader 编译/资产流入）

---

## 十一、Bloom Pass 专项监控（TECH-002 评审补充）

Bloom Pass 成本随场景中 **Emissive 光源数量** 线性上升。卡牌对战场景最多同时存在 17 张发光卡牌（手牌 7 + 场地 10），需特别监控。

| 场景 | 发光卡牌数 | Bloom 预估耗时 | 操作 |
|------|-----------|--------------|------|
| 日常对战 | 1–5 张 | ≤ 0.3 ms | 正常 |
| 场地满员（10 张在场） | 10 张 | ≤ 0.6 ms | 可接受 |
| 全手牌 + 全场地 | 17 张 | ≤ 0.8 ms | 接近预算上限，监控 |
| 五行结界 + 创世羁绊 | 17 张 + 特效 Emissive | > 1.0 ms | **触发降级** |

**降级策略（Bloom 超预算时）**：
1. 将 `Bloom Intensity` 从 0.6 降至 0.3（PostProcessVolume 动态调整）。
2. 将 `Bloom Threshold` 从 1.5 提高至 2.5，减少触发 Bloom 的 Emissive 数量。
3. 关闭背景场景卡牌（非当前焦点）的 Emissive 自发光（`SetScalarParameterValue("ElementIntensity", 0)`）。

**监控命令**：`r.ProfileGPU` → 查找 `Bloom` Pass 耗时，应 ≤ 1.0ms。

---

## 十二、M0 阶段 Nanite 实测数据记录

（待 PoC 1 完成后填写）

| 测试场景 | Nanite 卡牌数 | Draw Call | 帧率 | 测试人 | 日期 |
|----------|-------------|-----------|------|--------|------|
| PoC 1：旋转卡牌（单张） | 1 | — | — | — | — |
| PoC 1：20 张同屏 Nanite 卡牌 | 20 | — | — | — | — |
| PoC 1：20 张 ISM 卡牌（对比） | 20 | — | — | — | — |

**验收标准**：20 张 Nanite 卡牌 Draw Call ≤ 50，帧率 ≥ 55fps。若未达标，改用 ISM 方案。

---

*性能预算版本 v0.2，待首个 PoC Demo 完成后根据实测数据修正。*
