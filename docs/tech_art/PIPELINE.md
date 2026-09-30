# PIPELINE.md — 美术 → 引擎接入流水线

版本：v0.1 | 适用引擎：UE5.7.4 | 建模工具：Blender 3.6+ / AI 生模工具

---

## 一、流水线总览

```
[美术/AI 生模]
     │
     ▼
[Blender 规范处理]  ── 单位/朝向/轴/减面/UV展开
     │
     ▼
[导出 FBX / glTF]   ── 导出规范（见第二节）
     │
     ▼
[UE5 导入向导]      ── 导入设置（见第三节）
     │
     ├─→ Static Mesh  ── Nanite 启用 + LOD
     ├─→ Skeletal Mesh ── 绑定验证 + LOD 手动制作
     └─→ Texture Pack  ── 格式/压缩/命名
           │
           ▼
     [材质蓝图挂载]   ── 材质实例创建 + 参数赋值（见第四节）
           │
           ▼
     [数据表登记]     ── CardDataTable / CharacterDataTable（见第五节）
           │
           ▼
     [视觉验收]       ── tech_artist + art_director 联合审验
           │
           ▼
     [版本提交]       ── Git LFS + Perforce（视项目选择）
```

---

## 二、Blender 处理规范

### 2.1 单位设置

```
场景单位：Metric，Unit Scale = 0.01（即 1 Blender unit = 1 cm）
原因：UE5 默认 1 UU = 1 cm
```

### 2.2 轴向规范

| 项目 | Blender 设置 | UE5 对应 |
|------|-------------|----------|
| 前向 | Y 轴负方向（-Y = 模型面朝向） | X 轴正方向 |
| 上方 | Z 轴正方向 | Z 轴正方向 |
| 导出时 FBX 轴变换 | `Forward = -Z Forward`，`Up = Y Up` | 导入 UE 后自动对齐 |

**导出前必做检查**：
- [ ] Apply All Transforms（Ctrl+A → All Transforms）
- [ ] 原点（Origin）在模型底部中心（角色/卡牌）或几何中心（道具）
- [ ] 无多余顶点/重叠面（Merge by Distance）
- [ ] 法线朝向正确（Overlay → Face Orientation，全蓝无红）

### 2.3 模型规格要求

| 资产类型 | 面数上限 | UV 通道 | 备注 |
|----------|---------|---------|------|
| 卡牌 Static Mesh（Nanite） | 50,000 tri | UV0（贴图），UV1（光照贴图） | Nanite 自动降面 |
| 灵将角色 LOD0 | 15,000 tri | UV0，UV1 | 骨骼权重 ≤ 4 bones/vert |
| 灵将角色 LOD1 | 6,000 tri | UV0 | — |
| 灵将角色 LOD2 | 2,000 tri | UV0 | — |
| 场景道具（Nanite） | 100,000 tri | UV0，UV1 | — |
| 场景植被 LOD0 | 8,000 tri | UV0 | — |

### 2.4 AI 生模工具接入补充

适用工具：Meshy、Tripo3D、Rodin、CSM 等。

**AI 模型后处理步骤**（Blender）：

1. 导入 AI 生成的 FBX/OBJ/GLB。
2. **拓扑清理**：Remesh Modifier（Voxel，Voxel Size=1cm）→ 重新布线，确保合理面流。
3. **UV 重展开**：Smart UV Project 或手动 Seam 展开（AI 模型 UV 通常不可用）。
4. **法线烘焙**：高模 → 低模法线贴图烘焙（Blender Cycles Bake → Normal Map）。
5. **材质整理**：删除 AI 自带材质槽，改为标准 PBR 插槽（Base Color/Normal/ORM）。
6. 按上述规格检查并导出。

---

## 三、UE5 导入设置

### 3.1 Static Mesh 导入

| 设置项 | 推荐值 |
|--------|--------|
| Import as Static Mesh | YES |
| Build Nanite | YES（场景 + 卡牌） |
| Generate Lightmap UVs | YES（Source Lightmap Index = UV1） |
| Normal Import Method | Import Normals and Tangents |
| Transform → ImportUniformScale | 1.0 |
| Remove Degenerates | YES |

**导入后必做**：
- [ ] 在 Static Mesh Editor → Details → Nanite 面板验证 Enabled = true
- [ ] 检查 Collision 设置（卡牌：Use Complex as Simple；场景道具：Simple Box/Capsule）

### 3.2 Skeletal Mesh 导入

| 设置项 | 推荐值 |
|--------|--------|
| Import Animations | YES（和 Mesh 一起） |
| Import Mesh | YES |
| Skeleton | 绑定到项目统一 Skeleton（`SK_WuxiaCharBase`） |
| Normal Import Method | Import Normals and Tangents |
| Create Physics Asset | YES |

**LOD 导入**：导入完成后，在 Skeletal Mesh Editor → LOD 面板手动添加 LOD1/LOD2（FBX 独立文件或 Blender 导出多 LOD）。

### 3.3 Texture 导入

| 纹理类型 | 导入设置 |
|----------|----------|
| Albedo / BaseColor | sRGB = true，Compression = BC7 |
| Normal Map | sRGB = false，Compression = BC5，Flip Green Channel = 视情况 |
| ORM（Roughness/Metallic/AO） | sRGB = false，Compression = BC7，TextureGroup = World（非 UI） |
| Emissive | sRGB = true，Compression = BC7 |
| LUT | sRGB = false，Compression = No Compression，Mip Gen = No MipMaps |
| 粒子 Sprite | sRGB = true，Compression = BC7，TextureGroup = Effects |

---

## 四、材质蓝图挂载流程

### 4.1 卡牌材质挂载（静态流程）

```
步骤 1：导入卡牌 Texture Pack（T_Card_[ID]_Albedo / Normal / ORM / Emissive）
步骤 2：在 Content/Art/Cards/Materials/ 创建新材质实例
        右键 M_Card_Front → Create Material Instance → 命名为 MI_Card_[ID]_[Element]_Front
步骤 3：双击实例，赋值各贴图参数（Albedo、Normal、ORM、Emissive）
步骤 4：设置 ElementColor（参考 RENDER_PLAN.md 五行色表）
步骤 5：在 SM_Card_[ID] 的 Static Mesh 设置中，Element 0 = MI_Card_[ID]_[Element]_Front
                                                    Element 1 = MI_Card_GlowBorder_[Element]
                                                    Element 2 = MI_Card_Back
```

### 4.2 角色材质挂载

```
步骤 1：导入角色 Texture Pack
步骤 2：创建 MI_Char_[CharID]_Body / MI_Char_[CharID]_Weapon
步骤 3：在 Skeletal Mesh 设置中挂载对应材质实例
步骤 4：在 AnimBlueprint 中暴露状态参数（攻击/受伤/死亡）供材质动态响应
```

### 4.3 场景材质挂载

- 场景物件使用 **Master Material（M_Scene_PBR）** 的实例，区分 Tile 贴图和唯一贴图。
- 植被使用 **M_Foliage_InkStyle**，挂载双面材质（Two-Sided=true），开启 Wind Shader。

---

## 五、数据表登记规范

### 5.1 卡牌数据表（DT_CardLibrary）

**路径**：`Content/Data/DT_CardLibrary.uasset`  
**结构体**：`FCardData`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `CardID` | FName | 唯一 ID，如 `Card_NuWa_001` |
| `CardName` | FText | 显示名（本地化） |
| `CardType` | ECardType（Enum） | 灵将/符箓/文脉 |
| `Element` | EWuxingElement（Enum） | 金/木/水/火/土 |
| `StaticMeshRef` | TSoftObjectPtr\<UStaticMesh\> | 卡牌 3D Mesh 软引用 |
| `CharacterMeshRef` | TSoftObjectPtr\<USkeletalMesh\> | 灵将角色 Mesh（灵将卡专用） |
| `FrontMaterialRef` | TSoftObjectPtr\<UMaterialInstance\> | 正面材质实例 |
| `BorderMaterialRef` | TSoftObjectPtr\<UMaterialInstance\> | 边框材质实例 |
| `SummonVFXRef` | TSoftObjectPtr\<UNiagaraSystem\> | 召唤特效 |
| `DeathVFXRef` | TSoftObjectPtr\<UNiagaraSystem\> | 阵亡特效 |
| `CardThumbnail` | TSoftObjectPtr\<UTexture2D\> | UI 缩略图 |
| `ATK` | int32 | 攻击力 |
| `DEF` | int32 | 防御力 |
| `HP` | int32 | 生命值 |
| `ManaCost` | int32 | 灵力费用 |
| `BondTags` | TArray\<FName\> | 羁绊标签组 |
| `AbilityTags` | TArray\<FName\> | 技能标签 |

**登记流程**：
1. 美术/技美确认模型和材质挂载完毕，填写该行数据表。
2. 使用 **软引用（Soft Reference）** 避免全量资产加载。
3. 策划在数据表填写 ATK/DEF/HP/ManaCost。
4. 技美验证 Mesh / Material / VFX 引用有效（无 None）。

### 5.2 命名约定

| 资产类型 | 命名格式 | 示例 |
|----------|----------|------|
| Static Mesh | `SM_Card_[ID]` | `SM_Card_NuWa_001` |
| Skeletal Mesh | `SK_Char_[ID]` | `SK_Char_NuWa` |
| Material（Master） | `M_[用途]` | `M_Card_Front` |
| Material Instance | `MI_[ID]_[用途]` | `MI_Card_NuWa_001_Front` |
| Texture | `T_[ID]_[通道]` | `T_Card_NuWa_001_Albedo` |
| Niagara System | `NS_[特效名]` | `NS_InkSplash` |
| Blueprint | `BP_[功能]` | `BP_CardActor` |
| DataTable | `DT_[表名]` | `DT_CardLibrary` |

---

## 六、版本控制与协作规范

### 6.1 Git LFS 大文件管理

`.gitattributes` 追踪规则（已配置或待配置）：
```
*.uasset filter=lfs diff=lfs merge=lfs -text
*.umap filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
```

### 6.2 资产交付清单（每次提交前确认）

```
[ ] Blender 文件（.blend）存放于 Assets/Source/[类型]/
[ ] 导出 FBX 存放于 Assets/Export/[类型]/
[ ] UE 导入并验证无报错（Content Browser 无黄色感叹号）
[ ] 材质实例创建并赋值完毕
[ ] DT_CardLibrary 行已填写（软引用有效）
[ ] 在 Editor 中预览效果截图，发送给 tech_artist + art_director 审核
```

---

## 七、PoC Demo 快速接入清单

工程目录：`/opt/sourcecode/games/wenmai-shanhai-card`

### PoC 1：旋转水墨卡牌

```
1. 导入 SM_Card_Placeholder（占位盒体，按规格比例）
2. 创建 MI_Card_Test_Front（临时材质，挂载测试贴图）
3. 创建 BP_CardDemo_Actor：
   - Mesh Component = SM_Card_Placeholder
   - Timeline 驱动 Y 轴旋转（360°/3s）
   - SetScalarParameterValue 驱动 GlowIntensity 脉动
   - 鼠标悬停 → FloatHeight 插值动画
4. PostProcessVolume 挂载 MI_InkWash_PostProcess（Weight=1.0）
5. Bloom Intensity = 0.5，验证边框发光效果
```

### PoC 2：昆仑墟场景（Lumen + 水墨后处理）

```
1. 导入 3 块场景石块 SM_KunlunRock_[A/B/C]（占位几何）
2. 启用 Nanite，放置于 WM_KunlunTest 关卡
3. Directional Light（Lumen 配置见 RENDER_PLAN.md）
4. PostProcessVolume：MI_InkWash_PostProcess + T_LUT_InkWash_256x16
5. 截图对比开启/关闭水墨后处理效果
```

### PoC 3：符箓共鸣粒子组合

```
1. 在 BP_TalismanDemo 中顺序触发：
   NS_TalismanGlow（5 次，五行各一）→ 延迟 0.3s → NS_WuxingBarrier
2. 验证两个粒子系统共存时 Draw Call 和帧率
3. NS_AuspiciousCloud 持续播放作为背景
```

---

*首个 PoC 完成后由 tech_artist 与 art_director 联合做视觉验收，填写验收报告并更新本文档。*
