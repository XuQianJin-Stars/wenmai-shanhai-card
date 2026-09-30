# 《文脉·山海卡》粒子/光效视觉语言 VFX_VISUAL

**版本：** v1.2  
**作者：** Art Director  
**交付目标：** tech_artist（Niagara 实现参考）  
**对齐文档：** STYLE_GUIDE.md v1.1 / CARD_ART_SPEC.md  
**变更记录：**
- v1.0：初版
- v1.1：整合五行标准色值（来自 RENDER_PLAN.md LUT 规范）；粒子颜色统一对齐五行色板
- v1.2：修复 A-MED-001（NS_Ultimate_InkTide 与嫦娥月光色冲突）；补充 A-LOW-002（战斗状态场景 VFX LOD 降级策略）

---

## 一、VFX 设计哲学

**核心原则：** 特效是水墨语言的动态延伸，而非叠加在水墨上的现代游戏特效。

- 特效来源：笔触运动 / 墨迹扩散 / 符箓笔画 / 仙气祥云
- 特效颜色：严格遵循风格手册矿物色板，禁止霓虹和饱和色
- 特效密度：宁少勿多，"留白"原则同样适用于特效——留给画面呼吸的空间
- 特效参考意象：泼墨山水 / 汉代博山炉香烟 / 传统皮影表演灯光 / 符箓朱砂笔画

---

## 二、视觉→技术映射表

**五行标准色对照（与 RENDER_PLAN.md LUT 对齐）：**
金`#C8A04A` | 木`#4A8C5C` | 水`#2A4A7A` | 火`#C03A2A` | 土`#8C6040`

| 视觉意象 | Niagara 实现方案 | 粒子贴图类型 | 主色 |
|----------|-----------------|-------------|------|
| 散墨溅落 | GPU Particle Spray，速度由中心向外 | 手绘墨滴贴图集（8帧；MVP可用程序化噪点替代） | `#2C2C2C` → `#8C8C8C` |
| 墨面扩散（泼墨） | Mesh Particle + 材质溶解，由内向外 | 手绘墨面贴图（Flipbook 16帧；MVP可用噪点溶解替代） | `#1A1A1A` fade to `#F5F0E8` |
| 飞白笔触 | Ribbon Particle，带抖动噪点 | 干笔横纹贴图 | `#C8C8C8` 半透明 |
| 朱砂符箓（火属性） | Ribbon Particle（轨迹跟随），楷书笔画 | 符箓笔画贴图集（12帧） | `#C03A2A` + 内发光 `#F4D03F` |
| 祥云舒展（金属性） | Mesh Particle，螺旋路径，低速 | 卷云形态贴图（4变体） | `#C8A04A` + `#F4D03F` 半透明 |
| 木系粒子 | Sprite Particle，缓慢飘散 | 叶形/藤蔓 | `#4A8C5C` → `#27AE60` |
| 水系粒子 | GPU Ribbon + 流动动画 | 水纹贴图 | `#2A4A7A` → `#2E86C1` |
| 土系粒子（尘石碎屑） | Mesh Particle（岩石碎块），低速翻滚 | 岩石 Mesh | `#8C6040` + `#7B3F00` |
| 仙鹤剪影 | Skeletal Mesh Particle（简化骨骼） | 简化鹤形 3D Mesh | `#F5F0E8` 轮廓 |
| 月光散点 | Sprite Particle，随机旋转，缓慢漂浮 | 点状光斑贴图 | `#C0C0C0` `#F5F0E8` |
| 香炉细烟 | GPU Ribbon + Turbulence 噪点 | 烟雾半透明贴图 | `#8C8C8C` 极低不透明度 |
| 符箓光轨 | Beam Particle，两点间描绘 | 笔画纹理贴图 | `#C03A2A` → `#F4D03F` |
| 卡牌水墨边缘溶解 | Material-based Particle (Dissolve) | 噪点溶解贴图 | 与角色原色同步 |

---

## 三、战斗特效分类规格

### 3.1 出牌/召唤特效

**触发时机：** 玩家将卡牌拖入战场

```
视觉描述：
卡牌在落地瞬间，从卡面向外扩散一圈"泼墨"效果——
如同将墨水滴在宣纸上的瞬间扩散，圆形向外辐射，边缘自然毛糙。
随后，角色从墨面中"浮现"，边缘带墨迹溶解。

Niagara 参数：
- System Name: NS_CardSummon_InkBurst
- 粒子类型: GPU Sprite + Mesh 混合
- Spawn Rate: 爆发式（0.1s内发射 200 粒子）
- 速度: 径向向外，3–8 m/s
- 寿命: 0.4–0.8s
- 贴图: 墨滴 Flipbook（8帧）
- 颜色: `#1A1A1A`（出生）→ `#8C8C8C`（消亡），Alpha 曲线先快后慢
- 尺寸: 0.05–0.15m，随机变化
- 附加: 卡面 Material 参数触发 Dissolve In（0.3s）
```

---

### 3.2 普通攻击特效

**触发时机：** 灵将卡发动基础攻击

```
视觉描述：
笔触状冲击波——如同毛笔用力横扫宣纸的笔锋轨迹，
粗细变化的黑色飞白笔触向目标方向射出，
在目标处产生墨迹溅散（飞溅方向朝后）。

Niagara 参数（攻击轨迹）：
- System Name: NS_Attack_BrushStroke
- 粒子类型: Ribbon Particle
- 路径: 从攻击者到目标直线路径
- 速度: 15–25 m/s
- 宽度: 随路径衰减（起点 0.15m → 终点 0.02m）
- 贴图: 飞白横笔纹理
- 颜色: `#2C2C2C`
- 寿命: 0.3s

Niagara 参数（命中溅散）：
- System Name: NS_Hit_InkSplash
- Spawn Rate: 爆发 80 粒子
- 速度: 随机方向（偏向攻击来向反方向），2–6 m/s
- 贴图: 墨滴贴图集
- 颜色: `#1A1A1A` → `#5A5A5A`
- 寿命: 0.3–0.6s
```

---

### 3.3 技能特效（符箓卡）

**触发时机：** 符箓卡发动

```
视觉描述：
朱砂红光沿笔画轨迹在空中"书写"符箓图案，
如同无形的手用朱砂在空中书写符文，
笔画完成后全图闪烁金光，随后消散为朱砂粒子雨。

Niagara 参数（书写轨迹）：
- System Name: NS_Skill_FuluWrite
- 粒子类型: Ribbon（多段，模拟楷书笔画）
- 轨迹预定义: 在 Spline 上播放（每个技能单独 Spline 配置）
- 速度: 沿笔画路径 8 m/s
- 宽度: 动态（重笔 0.08m，轻笔 0.03m）
- 颜色: `#C03A2A`（火属性标准色）
- 发光: Emissive Intensity 2.0

Niagara 参数（消散）：
- System Name: NS_Skill_FuluBurst
- Spawn Rate: 爆发 300 粒子
- 颜色: `#C03A2A`（60%) + `#C8A04A`（40%，金属性发光）
- 速度: 向上缓慢飘散，0.5–2 m/s
- 寿命: 0.8–1.5s
- 尺寸: 0.02–0.06m 细小粒子
```

---

### 3.4 大招/文脉羁绊激活特效

**触发时机：** 文脉羁绊组合激活

> **A-MED-001 修复说明（v1.2）：** 原大招使用大面积蓝/石青色粒子，与嫦娥月光银（`#C0C0C0`/`#2E86C1`）同色叠加，导致嫦娥卡触发大招时"全场蓝白"丢失辨识度。修复方案：大招主色改为水墨黑爆发 + 朱砂红轮廓，与月光银形成明确对比。

```
视觉描述：
全场黑白化（Post Process 瞬间去色 0.2s），
随后从场景中心涌出大面积泼墨——
以浓重的水墨黑为主体，朱砂红为能量轮廓边缘，
天地墨面扩散后矿物色逐渐回归（色彩恢复 0.8s），
角色在墨面中以更大更清晰的姿态"重生"显现。

【色彩辨识度设计】
大招主色：水墨黑 `#1A1A1A` + 朱砂红轮廓 `#C03A2A`
嫦娥月光：螺钿银 `#C0C0C0` + 冷石青 `#2E86C1`
两套色系明度/色相均有明确区分，同场叠加时大招的黑红与月光的银蓝不会混淆。

Niagara 参数（泼墨波）：
- System Name: NS_Ultimate_InkTide
- 粒子类型: Mesh Particle（大片墨面 Mesh）
- 范围: 场景内 8m 半径
- Spawn: 从中心向外扩散 Wave
- 主色: `#1A1A1A`（墨面主体）
- 轮廓边缘色: `#C03A2A`（朱砂红，Emissive 1.5）
- 寿命: 1.5s（向外扩散 0.8s + 淡出 0.7s）

Post Process 联动：
- 去色: Saturation 1.0 → 0.0（0.2s）→ 1.0（0.8s）
- 对比: Contrast 短暂提升（+0.3，持续 0.3s）
- 墨迹晕: 屏幕边缘 Vignette 加深（0.5s）

附加: 祥云 NS_CloudBurst_Gold 同时触发（伴随羁绊类型调整颜色）
嫦娥大招触发时：月光 NS_Chang_E_Moonlight 不暂停，但降至 Spawn Rate 15粒/秒
（月光银作为大招黑红墨面中的零星光点，强化"月在墨中"的意境对比）
```

---

### 3.5 嫦娥专属月光特效

```
视觉描述：
月光如碎银散落——螺钿银色光斑从角色周围缓慢飘起，
同时月轮材质激活 Emissive 增强，
远处背景的月光在 Lumen 中实时影响环境色温（偏冷石青）。

Niagara 参数：
- System Name: NS_Chang_E_Moonlight
- 粒子类型: Sprite，随机旋转
- Spawn Rate: 持续 30 粒/秒（技能激活时增至 150 粒/秒）
- 速度: 缓慢向上飘浮，0.2–0.8 m/s，带 Curl Noise
- 颜色: `#C0C0C0`（螺钿银）到 `#F5F0E8`（宣纸白）随机
- Emissive: 0.3–0.8
- 尺寸: 0.01–0.04m 微小光斑
- 寿命: 2–4s

月光环境变化（Lumen 联动）：
- 月光 Directional Light: 强度从 0.5 → 2.0（技能激活时）
- 颜色: 偏石青 `#2E86C1` 冷色调
- 持续时间: 3s 后恢复
```

---

### 3.6 盘古专属创世特效

```
视觉描述：
大地开裂的宏观感——粗犷的岩石碎裂从脚下扩散，
天地分裂感的光线从裂缝中射出（赭石暖光），
不是华丽爆炸，而是地质运动的厚重感。

Niagara 参数（地裂）：
- System Name: NS_Pangu_EarthCrack
- 粒子类型: Mesh Particle（岩石碎块 Mesh，5种形状）
- 速度: 低速向外飞散，2–5 m/s，高弧线
- 颜色: 赭石纹理 `#7B3F00` + 尘土颗粒 `#8C8C8C`
- 旋转: 随机翻滚
- 尺寸: 0.1–0.5m 不等

Niagara 参数（地裂光线）：
- Beam Particle 从地面向上，裂缝形态（锯齿 Spline）
- 颜色: `#D35400`（赭红热光）+ `#F4D03F`（金光边）
- Emissive: 3.0–5.0（强烈光源感）
- 寿命: 0.8s
```

---

## 四、场景环境特效

### 4.1 昆仑墟云雾

```
- System: NS_Kunlun_CloudDrift
- 持续型（Loop），低频更新
- 大团云朵 Mesh Particle，缓慢横移
- 速度: 0.1–0.3 m/s（极缓）
- 颜色: `#F5F0E8`（主云体）+ `#C8C8C8`（阴影面）
- 同时: Volumetric Fog 参数配置（石青色调）
- 性能: 限制为 5 个大型云 Mesh，不使用大量粒子
```

### 4.2 古戏台灯笼光晕

```
- System: NS_Stage_LanternFlicker
- 绑定至灯笼 Mesh
- Spot Light 强度变化：Perlin Noise 驱动，频率 0.5–2 Hz
- 偶发"灯光跳动"（短暂增强后迅速恢复）：概率 10%/秒
- 颜色: `#F4D03F` → `#D35400` 轻微色温波动
```

### 4.3 书斋香炉烟

```
- System: NS_Study_IncenseSmoke
- Ribbon + Turbulence，极细腻
- 速度: 0.1 m/s 向上，受 Curl Noise 影响缓慢弯曲
- 颜色: `#8C8C8C`（烟体），Opacity 0.05–0.15（极半透明）
- 宽度: 0.005–0.02m（极细）
- 性能: 最低优先级，可在低端机关闭
```

---

## 五、性能预算分配（与 PERF_BUDGET.md 对齐）

| 场景状态 | 粒子预算上限 | 优先保留 | 可削减 |
|----------|------------|---------|--------|
| 战斗中（无大招） | 2000 粒子 | 攻击/出牌特效 | 环境特效降配 |
| 大招激活 | 3500 粒子（峰值，持续 <2s） | 大招主体 | 环境特效暂停 |
| 菜单/剧情 | 500 粒子 | 环境氛围 | 关闭所有战斗特效 |
| 低端配置模式 | 800 粒子 | 攻击/出牌 | 关闭所有环境+月光特效 |

### 5.1 战斗状态下场景 VFX LOD 降级策略（A-LOW-002 补充）

> **触发条件：** 战斗开始（BP_BattleController 广播 OnBattleStart 事件）时执行降级；战斗结束后恢复。

| 场景 VFX 系统 | 非战斗（默认） | 战斗中 | 大招激活时 |
|--------------|--------------|--------|-----------|
| NS_Kunlun_CloudDrift（昆仑墟云雾） | Spawn Rate 正常，CloudDensity 0.3 | Spawn Rate 降至 50%，CloudDensity 0.15 | **暂停**（Deactivate） |
| KL_GroundFog_Sheet（地面薄雾 Plane） | 可见，Opacity 0.4 | 可见，Opacity 0.2 | 可见，不影响预算 |
| NS_Stage_LanternFlicker（灯笼光晕） | 正常闪烁，全部灯笼激活 | 仅前景 2 个灯笼保持，其余暂停 | **暂停** |
| NS_Study_IncenseSmoke（香炉烟） | 正常，Spawn Rate 5粒/秒 | **暂停** | **暂停** |
| VFX_CraneFlying（仙鹤飞过） | 正常触发 | **禁止新触发**（当前播放完毕后不再生成） | **暂停** |
| VFX_InkWash_Ambient（水墨晕染 PP） | 强度 0.6 | 强度降至 0.3 | 强度 0（大招期间由大招 PP 接管） |

**实现方式（供 engineer/tech_artist 参考）：**
- 在 Niagara System 上使用 `SetSystemActive(false)` / `SetSystemActive(true)` 控制激活状态
- 通过 UE5 蓝图事件绑定 `OnBattleStart` / `OnBattleEnd` / `OnUltimateActivate` 广播
- 所有可降级的场景 VFX Actor 挂载统一组件 `BP_VFX_BattleLODController`，监听上述事件自动响应

---

## 六、贴图资源清单（需 tech_artist 制作/采购）

| 贴图名 | 规格 | 制作方式 | 优先级 |
|--------|------|----------|--------|
| `T_InkDrop_Flipbook` | 256×256，8帧 | 手绘扫描 + AI 生成 | ★★★ |
| `T_InkSplash_Flipbook` | 512×512，16帧 | 手绘扫描 | ★★★ |
| `T_BrushStroke_FlyWhite` | 256×64，横向 | 手绘扫描 | ★★★ |
| `T_Fulu_Strokes` | 256×256，12帧 | AI生成后处理 | ★★★ |
| `T_Cloud_Scroll` | 512×256，4变体 | AI生成 | ★★ |
| `T_Smoke_Wisp` | 128×128 | AI生成 | ★★ |
| `T_Moonlight_Sparkle` | 64×64 | 程序化 | ★ |
| `T_RockChunk_*` | 各异 | Blender 烘焙 | ★★ |

---

*本文档交 tech_artist 参考实现，如 Niagara 技术限制与视觉意图冲突，请通过 send_message 联系 art_director 协商调整。*
