# ink_wash_postprocess.md — 水墨后处理材质方案

版本：v0.1 | 适用引擎：UE5.7.4

---

## 一、材质概述

**材质名**：`M_InkWash_PostProcess`（实例：`MI_InkWash_PostProcess`）  
**材质类型**：Post Process Material  
**Blendable Location**：`Before Tonemapping`（保留 HDR 信息供边缘检测）  
**混合权重**：由 PostProcessVolume 参数 `Blendable Weight` 控制（0.0–1.0，默认 1.0）

---

## 二、三大效果层架构

```
SceneTexture(PostProcessInput0)
         │
    ① 边缘检测（Sobel/Roberts Cross）
         │
    ② 噪声扰动（水墨流动感）
         │
    ③ 宣纸纹理叠加（Screen-space Tile）
         │
    → Lerp 合成 → 输出至 Emissive Color
```

---

## 三、效果层详细方案

### 3.1 边缘检测（Ink Edge Detection）

**算法**：Roberts Cross（轻量，适合 GPU 后处理）

```
// 材质蓝图逻辑（伪代码）
PixelSize = 1.0 / ScreenResolution    // 通过 ViewSize 节点获取

Sample_TL = SceneDepth(UV + PixelSize * (-1, -1))
Sample_TR = SceneDepth(UV + PixelSize * ( 1, -1))
Sample_BL = SceneDepth(UV + PixelSize * (-1,  1))
Sample_BR = SceneDepth(UV + PixelSize * ( 1,  1))

Gradient_X = Sample_TL - Sample_BR
Gradient_Y = Sample_TR - Sample_BL
EdgeStrength = sqrt(Gradient_X² + Gradient_Y²)

// 深度归一化：避免远景过度描边
EdgeStrength = Clamp(EdgeStrength * DepthSensitivity / max(Depth, 0.01), 0, 1)

// 法线辅助边缘（增强结构感）
Normal_TL = SceneTexture(WorldNormal, UV + PixelSize * (-1, -1))
Normal_BR = SceneTexture(WorldNormal, UV + PixelSize * ( 1,  1))
NormalEdge = length(Normal_TL - Normal_BR) * NormalSensitivity

FinalEdge = Saturate(EdgeStrength + NormalEdge)
```

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `EdgeColor` | (0.02, 0.02, 0.04, 1) | HDR 颜色 | 描边颜色，偏蓝黑墨色 |
| `DepthSensitivity` | 0.8 | 0.1 – 3.0 | 深度边缘灵敏度，越大描边越多 |
| `NormalSensitivity` | 0.5 | 0.0 – 2.0 | 法线边缘灵敏度 |
| `EdgeThickness` | 1.0 | 0.5 – 3.0 | 采样偏移倍数（描边粗细） |
| `EdgeOpacity` | 0.85 | 0.0 – 1.0 | 最终描边不透明度 |

---

### 3.2 噪声扰动（Water Ink Flow Distortion）

水墨笔触边缘具有毛糙感，通过噪声贴图对采样 UV 进行微小扰动实现。

```
// 材质蓝图逻辑
NoiseUV = UV * NoiseScale + Time * NoiseSpeed   // 动态流动
NoiseValue = Texture2D(T_InkNoise_512, NoiseUV).r  // 单通道噪声

// 扰动量
Distortion = (NoiseValue - 0.5) * DistortionAmount

// 对边缘采样 UV 施加扰动（仅对 EdgeStrength > 0.1 的区域）
DistortedUV = UV + Distortion * PixelSize * EdgeMask

// 最终用扰动 UV 重采样原始画面
FinalColor = SceneTexture(PostProcessInput0, DistortedUV)
```

**噪声纹理**：`T_InkNoise_512`（512×512，单通道，Perlin/Simplex 噪声，BC4 压缩，tiling=1）

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `NoiseScale` | 3.0 | 1.0 – 10.0 | 噪声 UV 缩放（影响毛糙颗粒大小） |
| `NoiseSpeed` | 0.05 | 0.0 – 0.5 | 流动速度（0 = 静态毛边） |
| `DistortionAmount` | 0.8 | 0.0 – 3.0 | 扰动强度（过高会导致画面撕裂感） |

---

### 3.3 宣纸纹理叠加（Xuan Paper Overlay）

屏幕空间 Tiling 叠加宣纸纤维纹理，增加手绘质感。

```
// 材质蓝图逻辑
PaperUV = UV * PaperTiling                 // 屏幕空间 Tiling
PaperAlpha = Texture2D(T_XuanPaper_512, PaperUV).r  // 单通道纸纹

// 屏幕亮度影响纸纹可见度（暗部不叠加）
LuminanceMask = Luminance(SceneColor) * LuminanceBlend

// 叠加模式：Multiply（压暗亮部纤维）
PaperBlend = Lerp(1.0, PaperAlpha, PaperOpacity * LuminanceMask)
FinalColor = SceneColor * PaperBlend
```

**宣纸纹理**：`T_XuanPaper_512`（512×512，单通道灰度，BC4，高频纤维纹理，可无缝 Tile）

**可配置参数**：

| 参数名 | 默认值 | 取值范围 | 说明 |
|--------|--------|----------|------|
| `PaperTiling` | 4.0 | 1.0 – 16.0 | 宣纸 Tiling 密度（分辨率相关） |
| `PaperOpacity` | 0.15 | 0.0 – 0.5 | 纸纹叠加强度（过高会失去真实感） |
| `LuminanceBlend` | 0.7 | 0.0 – 1.0 | 亮度遮罩混合（控制纸纹在暗部的消退） |

---

## 四、材质最终合成

```
// 合成顺序（材质输出节点 → Emissive Color）

Step 1: BaseColor = SceneTexture(PostProcessInput0, DistortedUV)
Step 2: EdgeOverlay = Lerp(BaseColor, EdgeColor, FinalEdge * EdgeOpacity)
Step 3: FinalOutput = EdgeOverlay * PaperBlend

Output → Emissive Color = FinalOutput
```

---

## 五、性能成本

| 操作 | GPU 成本估算 |
|------|-------------|
| 深度采样（Roberts Cross，4 次采样） | 低 |
| 法线采样（2 次） | 低 |
| 噪声纹理采样（1 次） | 低 |
| 宣纸纹理采样（1 次） | 低 |
| 总计（1080p） | **≈ 0.6–1.0 ms**（GTX 1060 实测预估） |

---

## 六、LOD/质量开关

| 质量等级 | 操作 |
|----------|------|
| 高（PC） | 全效果，DistortionAmount=0.8，NormalSensitivity=0.5 |
| 中（PC 低配） | 关闭 NormalEdge（NormalSensitivity=0），DistortionAmount=0.3 |
| 低（移动端后续） | 整体材质权重降至 0.5，或换轻量版（仅 EdgeDetection） |

---

## 七、参考资源

- UE 文档：Post Process Materials → Blendable Interface
- 噪声纹理推荐：[Blue Noise Textures Pack]，或 Blender 程序化生成
- 宣纸纹理：AI 生成（Stable Diffusion，prompt: "xuan paper texture seamless, ink fiber, grayscale"）

---

*待 art_director 视觉验收后调整 EdgeColor、PaperOpacity、DistortionAmount 三项核心参数。*
