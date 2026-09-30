# 《文脉·山海卡》美术方向 Outline v1.0

**版本：** v1.0  
**作者：** Art Director  
**对应任务：** producer TEAM_BOARD — art_director 首批任务

---

## 一、新中式水墨 3D 风格参考方向

### 参考意象（5+ 方向）

1. **宋代院体山水**（如范宽《溪山行旅图》）
   - 构图：近实远虚三段式，大量留白，山体被雾气截断
   - 适用：场景背景层、卡牌背景水墨处理

2. **敦煌壁画飞天人物**（莫高窟唐代壁画）
   - 造型：飘带流动、无翅膀的飞翔感、服饰层次丰富
   - 适用：嫦娥、仙人类角色造型参考

3. **汉代画像石线刻**（山东武氏祠石刻）
   - 造型：粗犷有力的线条，扁平化造型，力量感强
   - 适用：盘古、门神等力量型角色底层结构参考

4. **杨柳青木版年画**（天津杨柳青）
   - 特征：矿物色平涂，黑色轮廓鲜明，喜庆饱和度控制
   - 适用：古戏台场景整体色调、门神卡牌颜色处理

5. **陕西皮影戏造型**（华县皮影）
   - 特征：侧面剪影，透空雕刻，色彩鲜艳但有传统规律
   - 适用：皮影人卡牌造型、UI 装饰性图标风格

6. **UE5 水墨 Shader 参考**（国内独立游戏《墨境》类风格）
   - 技术方向：卡通渲染 + 边缘描边 + 后期水墨滤镜
   - 适用：整体渲染管线风格定义

---

## 二、UE5 Marketplace 中式资源清单（推荐采购）

| 资源类型 | 搜索关键词 | 预估价格 | 优先级 |
|----------|-----------|---------|--------|
| 古建筑模块化 | "Chinese Architecture Modular Pack" | $30–60 | ★★★ |
| 中式植物（松竹梅） | "Asian Pine" / "Chinese Garden Plants" | $20–40 | ★★★ |
| 中式室内家具 | "Ancient Chinese Furniture" | $20–40 | ★★ |
| 水墨材质/Shader | "Ink Wash Material" / "Chinese Ink Shader" | $15–30 | ★★★ |
| 灯笼道具 | "Chinese Lantern Props" | $10–20 | ★★ |
| 烟雾/云雾 VFX | "Eastern Cloud VFX" / "Smoke Niagara" | $15–25 | ★★ |
| 传统纹样笔刷 | "Chinese Pattern Texture" | $10–15 | ★ |

*实际资源 ID 待 tech_artist 在 Marketplace 查询确认后更新*

---

## 三、卡牌美术规格摘要

详见：[CARD_ART_SPEC.md](./CARD_ART_SPEC.md)

**核心参数：**
- 卡牌尺寸：6.3 × 8.8 × 0.4 cm（世界空间）
- 贴图规格：文脉级/极品 4K，珍品 2K，凡品 1K
- 渲染方式：Scene Capture 角色 → Render Target → 卡牌贴图
- PBR 通道：BaseColor / Metallic / Roughness / Normal / Emissive / AO
- 边框：等级区分（回纹/云纹/莲纹/万字纹，4级）

---

## 四、三个场景美术方向

详见：[SCENES/SCENE_DESIGN_v1.md](./SCENES/SCENE_DESIGN_v1.md)

| 场景 | 色调 | 情绪基调 | 核心元素 |
|------|------|----------|---------|
| 昆仑墟 | 石青冷调 | 苍茫神秘 | 悬浮山石 + 古松 + 积墨云 |
| 古戏台 | 朱红暖调 | 热烈民俗 | 戏台建筑 + 红灯笼 + 幕布 |
| 书斋 | 宣纸暖白 | 宁静书卷 | 古书案 + 格子窗 + 竹影 |

---

## 五、已完成交付物索引

| 文档 | 路径 | 状态 |
|------|------|------|
| 风格手册 | `docs/art/STYLE_GUIDE.md` | ✅ 完成 |
| 卡牌美术规格 | `docs/art/CARD_ART_SPEC.md` | ✅ 完成 |
| 6张核心卡牌概念稿 | `docs/art/CONCEPTS/CARD_CONCEPTS_v1.md` | ✅ 完成 |
| 3个场景设计 | `docs/art/SCENES/SCENE_DESIGN_v1.md` | ✅ 完成 |
| UI视觉规范 | `docs/art/UI_VISUAL.md` | ✅ 完成 |
| VFX粒子视觉语言 | `docs/art/VFX_VISUAL.md` | ✅ 完成 |

---

## 六、待 critic 审核重点

1. STYLE_GUIDE.md 的色板和禁用色定义是否足够清晰防止"廉价感"
2. CONCEPTS 中 6 张卡牌 Prompt 是否有效规避西方奇幻/日系风险
3. 场景构图原则是否与策划总纲中的文化定位匹配

---

*待 critic 审核通过后，本系列文档进入 v1.1 修订。*
