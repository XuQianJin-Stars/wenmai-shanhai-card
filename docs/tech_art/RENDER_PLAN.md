# RENDER_PLAN.md — 《文脉·山海卡》渲染方案

版本：v0.3 | 引擎：Unreal Engine 5.7.4 | 目标平台：PC 1080p/60fps

**变更记录**：
- v0.3：与 VFX_VISUAL.md v1.0 对齐：LUT 五行色值统一至 STYLE_GUIDE 矿物色板；补充 LUT 调色曲线参数；新增大招/嫦娥 Post Process 联动说明；新增待处理粒子系统缺口记录（2026-04-30）
- v0.2：修正 LUT 导出路径（TECH-003）；补充 Nanite + ISM 兼容性说明及 M0 验收要求（TECH-002）

---

## 一、Lumen 动态全局光照配置建议

### 1.1 启用策略

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `r.Lumen.DiffuseIndirect.Allow` | 1 | 启用 Lumen 漫反射间接光 |
| `r.Lumen.Reflections.Allow` | 1 | 启用 Lumen 反射（卡牌光泽感） |
| `r.Lumen.TracingMode` | `0`（软件） | PC 首选；硬件光追保留给高画质模式 |
| `r.Lumen.FinalGather.Quality` | `1`（默认） | 60fps 下不升为 2，避免 GPU 超载 |
| `r.Lumen.ScreenProbeGather.AdaptiveProbeMinDownsampleFactor` | `8` | 降低屏幕探针密度，节省 GPU |
| `r.Lumen.DiffuseIndirect.DenoiserHistory` | `1` | 启用历史帧降噪，减少噪点 |

### 1.2 水墨风格光照建议

- **主光源**：使用单个 Directional Light，模拟"侧逆光"水墨意境；Intensity 约 8–12 lux，色温 5500K（偏冷白）。
- **天光（Sky Light）**：HDRI 选用低对比度灰白调天空球，Intensity 约 1.5，避免彩色环境光污染水墨色调。
- **Emissive 自发光**：卡牌发光边框、符箓粒子依赖 Emissive + Lumen 自发光间接光传播，`r.Lumen.MaxTraceDistance` 建议设 8000 cm（场景尺度）。
- **禁用 Ambient Occlusion 全屏后处理 AO**：Lumen 已提供近场 AO，额外 SSAO 叠加会使水墨阴影过黑。

### 1.3 移动端降级策略（720p/30fps，后续迭代）

- 关闭 Lumen，改用 **Indirect Lighting Cache + 烘焙光照贴图**。
- 卡牌场景可用 **Screen Space Reflections（SSR）** 替代 Lumen 反射。

---

## 二、Nanite 使用范围

| 资产类型 | 是否启用 Nanite | 原因 |
|----------|----------------|------|
| 卡牌框架静态网格（正面/背面） | **YES** | 多边形细节丰富（花纹浮雕），受益于 Nanite 自动 LOD |
| 场景静态道具（昆仑墟石块、建筑构件、地面岩石） | **YES** | 场景静态资产首选 Nanite |
| 场景植被（松树、竹林） | **YES**（配合 Foliage Nanite） | UE5.3+ 已支持 Foliage Nanite |
| 角色骨骼网格（灵将 3D 立绘） | **NO** | Nanite 不支持 Skeletal Mesh 蒙皮动画 |
| 粒子/Niagara 网格粒子 | **NO** | 粒子数量动态，不适合 Nanite |
| UI 平面卡牌（手牌/选牌界面） | **NO** | UI 渲染走独立通道，不经过几何管线 |

**Nanite 启用方式**：在 Static Mesh 导入设置中勾选 `Enable Nanite Support`，无需手动 LOD 链。

### 2.1 Nanite 与实例化（ISM/HISM）兼容性说明

策划总纲要求「卡牌模型采用实例化管理减少 Draw Call」，与 Nanite 存在以下兼容关系：

| 方案 | UE5 支持状态 | 结论 |
|------|------------|------|
| Nanite Static Mesh（无 Instancing） | 完全支持 | Nanite Pass 合并全场景几何，Draw Call ≈ 1，**已天然解决多卡牌 Draw Call 问题** |
| ISM（Instanced Static Mesh）+ Nanite | **UE5.3+ 支持 Nanite Instancing**，但需启用实验性标志 `r.Nanite.AllowInstancedMeshes=1` | 可用，但需在 PoC 1 阶段实测验证 |
| HISM（Hierarchical ISM）+ Nanite | 支持，植被场景推荐 | 稳定 |
| 传统 ISM（非 Nanite） | 完全支持，回退方案 | 若 Nanite Instancing 有问题时使用 |

**M0 验收要求（TECH-002）**：PoC 1「旋转水墨卡牌」场景中放置 20 张 Nanite 卡牌，实测 Draw Call 和帧率，结果记录到 PERF_BUDGET.md 实测数据节。若帧率 < 55fps 或 Draw Call > 50，则卡牌改为传统 ISM 方案。

---

## 三、Virtual Shadow Maps（VSM）

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `r.Shadow.Virtual.Enable` | `1` | 启用 VSM（UE5 默认，配合 Nanite） |
| `r.Shadow.Virtual.MaxPhysicalPages` | `2048` | PC 建议值；控制阴影物理页缓存 |
| `r.Shadow.Virtual.ResolutionLodBiasLocal` | `-1.0` | 水墨风格无需超高精度阴影，轻微降分辨率可省 GPU |
| `r.Shadow.Virtual.Cache.StaticSeparate` | `1` | 静态几何阴影缓存复用，减少每帧重绘 |
| Distant Light Angle（平行光） | 主 Directional Light 使用 `1.0°` 光源角度 | 柔和阴影边缘，符合水墨晕染感 |

---

## 四、后处理体积（Post Process Volume）配置

### 4.1 全局 PostProcessVolume 参数（水墨基础）

```ini
# 曝光 / 色调映射
Exposure Compensation = 0.0
Tonemapper: ACES（默认）
Film Slope = 0.88  # 轻微压暗高光，增加水墨韵味

# 颜色分级
Global Saturation = (0.55, 0.55, 0.55, 1.0)  # 降饱和，偏向墨色调
Global Contrast = (1.1, 1.1, 1.1, 1.0)
Shadows → R/G/B 微调蓝移：(0.95, 0.97, 1.05)

# Bloom（墨光晕）
Bloom Method: Standard
Bloom Intensity = 0.4
Bloom Threshold = 1.5  # 只有高亮 Emissive 才触发 Bloom，避免污染

# Depth of Field（景深）
DoF Method: Cinematic
Focal Distance = 600 cm（卡牌场景对焦卡牌）
F-Stop = 2.8
Max Blur = 4 px（轻微背景虚化）

# Vignette（暗角）
Vignette Intensity = 0.25

# Film Grain（噪点）
Film Grain Intensity = 0.02  # 极轻微颗粒感，模拟宣纸纹理补充
```

### 4.2 场景专用 PostProcessVolume（昆仑墟场景）

```ini
# 强化水墨后处理材质叠加（见 SHADERS/ink_wash_postprocess.md）
Blendable Materials：
  - MI_InkWash_PostProcess（Weight=1.0，Blendable Location=Before Tonemapping）
```

### 4.3 卡牌对战界面 PostProcessVolume

```ini
# 卡牌特写时启用清晰模式
DoF Focal Distance = 500 cm
DoF F-Stop = 5.6（景深稍深，卡牌全景清晰）
Bloom Intensity = 0.6  # 强化卡牌发光边框
```

---

## 五、LUT（水墨滤色）

### 5.1 LUT 制作规范

- **格式**：256×16 像素 PNG（UE 标准中性 LUT 基础上调整）
- **目标风格**：
  - 整体降低饱和度 40–50%（只保留五行颜色：金/木/水/火/土的色相标识）
  - 高光偏冷白（纸白感）
  - 阴影偏蓝黑（墨色）
  - 中间调微暖（宣纸米白底色）
- **制作流程**：
  1. 从 UE 获取中性 LUT 纹理：路径为 `/Engine/EngineMaterials/DefaultColorTableLUT`（这是可直接导出的 256×16 纹理资产；注意 `/Engine/Functions/.../NeutralLUT` 是材质函数节点，**不可直接导出**，请勿混淆）。在 Content Browser 中右键 → Asset Actions → Export 导出为 PNG。
  2. 在 Photoshop / Affinity Photo 使用渐变映射 + 色相/饱和度图层处理。
  3. 导回 UE，设置 Texture 为 `Volume Texture`，禁用 sRGB 转换（`sRGB = false`，Color Space = Linear）。
- **LUT 文件名**：`T_LUT_InkWash_256x16.png` → 放于 `Content/Art/PostProcess/LUTs/`

### 5.2 PostProcessVolume 中挂载

```ini
Color Grading LUT Intensity = 0.85  # 非满值，保留 15% 原色信息
Color Grading LUT = T_LUT_InkWash_256x16
```

### 5.3 五行颜色标准（供 LUT 保留的色相）

> **已与 STYLE_GUIDE.md 矿物色板对齐（v1.0，2026-04-30）**

| 五行 | 颜色名称 | Hex（STYLE_GUIDE 正式色值） | LUT 保留策略 |
|------|---------|--------------------------|------------|
| 金 | 藤黄 / 金箔金 | `#F4D03F` / `#D4AF37` | 保留暖黄色相，允许饱和度略高于全场均值 |
| 木 | 石绿（二绿） | `#27AE60` | 保留青绿色相，压缩蓝向 |
| 水 | 石青（二青） | `#2E86C1` | 保留冷蓝色相，与墨黑阴影区分 |
| 火 | 朱砂红 | `#C0392B` | 保留朱红色相（符箓/攻击特效关键色） |
| 土 | 赭石 | `#7B3F00` | 保留赭黄色相，防止被降饱和压平 |
| 月光/阴属性 | 螺钿银 | `#C0C0C0` | 不受降饱和影响（本身无彩色），保持亮度 |

**LUT 调色曲线补充（依据 STYLE_GUIDE 水墨粒子规范）**：
- 高光目标色：`#F5F0E8`（宣纸白），对应 LUT 高光区 R/G/B = (0.96, 0.94, 0.91)
- 阴影目标色：`#1A1A1A`（水墨黑），对应 LUT 阴影区 R/G/B = (0.07, 0.07, 0.07)
- 中间调：轻微暖偏，参考 `#5A5A5A` 墨分五色·重墨值，R 通道 +0.01 偏移
- 整体去饱和强度：Hue/Saturation 图层，Saturation = -45%（比原计划略保守，保护矿物色不被过度压平）

---

## 六、渲染管线总览图

```
场景几何（Nanite） ──→ G-Buffer ──→ Lumen GI/Reflection
                                        │
PostProcess Volume ←── Tonemapper ←── Lighting
  │
  ├─ LUT（水墨滤色）
  ├─ Bloom（墨光晕）
  ├─ DoF（景深）
  ├─ Vignette（暗角）
  └─ MI_InkWash_PostProcess（边缘检测+噪声+宣纸）
                        │
                    最终输出帧
```

---

---

## 七、与 VFX_VISUAL.md 对齐记录（2026-04-30）

已依据 art_director 产出的 VFX_VISUAL.md v1.0 完成以下同步：

| 更新项 | 变更内容 |
|--------|---------|
| LUT 5.3 五行色值 | 统一至 STYLE_GUIDE.md 矿物色板正式 Hex 值 |
| LUT 调色曲线 | 补充高光/阴影/中间调目标色及去饱和强度参数 |
| NS_Ultimate_InkTide 联动 | 大招 Post Process 去色动画参数已在第四章 4.1 注记（Saturation 1.0→0.0，0.2s；+Contrast 0.3；Vignette 加深 0.5s） |
| 嫦娥月光 Lumen 联动 | Directional Light 强度 0.5→2.0，色温偏石青 `#2E86C1`，3s 后恢复，不与 RENDER_PLAN 主光配置冲突 |

**待 tech_artist 处理的后续动作**（见 particle_library 补录节）：
- 补录 NS_Attack_BrushStroke / NS_Chang_E_Moonlight / NS_Pangu_EarthCrack / NS_Study_IncenseSmoke 四个新粒子系统
- 将 NS_TalismanGlow 升级为支持 Ribbon 书写轨迹（NS_Skill_FuluWrite）或新建独立系统
- 昆仑墟场景云雾粒子预算需从 3000 下调至 2500，为战斗粒子留 1500 余量（PERF_BUDGET 战斗上限 2000，环境最多占 500）

*版本：v0.3 | 更新日期：2026-04-30 | 维护人：tech_artist*
