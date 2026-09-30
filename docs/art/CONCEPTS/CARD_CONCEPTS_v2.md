# 《文脉·山海卡》核心卡牌概念稿 — CONCEPTS v2

**版本：** v2.0  
**作者：** Art Director  
**基准文档：** STYLE_GUIDE v1.2 / VFX_VISUAL v1.2 / CORE_LOOP v2 / CARD_LIST v0.3  
**变更记录：**
- v2.0：M1 正式开工版；女娲属性由「土」更改为「火」（全文件同步）；新增女娲火行召唤粒子视觉需求（供 tech_artist 预注册 NS_NuWa_FireAppear）；所有 Prompt 对齐 STYLE_GUIDE v1.2 三类卡牌视觉语言速查表；跳过 FL-006/WM-004（D-HIGH-001/002 修订中）

**质检标准：** 所有 Prompt 必须规避"西方奇幻/日系卡通"风格，确保中国典籍气质。  
**卡牌类型参照：** 灵将卡=看到人｜符箓卡=看到红｜文脉卡=看到器/景

---

## 质检原则（每张卡牌必须满足）

1. 造型语言参考汉代画像石、敦煌壁画、宋代人物绢画，而非 ACG 或 RPG 游戏画风
2. 禁止出现西方奇幻元素：机械翅膀、魔法阵、欧式铠甲、西方神祇符号
3. 禁止日系卡通特征：超大眼睛、锥子下巴、粉红发色、萌系表情
4. 禁止刻板符号：龙袍+机甲、熊猫+功夫、网红脸立绘
5. 色彩参考矿物色：赭石、石青、石绿、朱砂、宣纸白，非高饱和卡通色
6. ⚠️ 禁止卡牌背景使用"冷色→金色"大面积双色渐变（如石青渐变至藤黄）
7. 边框色：灵将卡=五行属性色+水墨黑内框；符箓卡=朱砂红+藤黄金边；文脉卡=赭石或墨色+宣纸白内框

---

## 01 — 盘古（开天辟地者）

**卡牌类别：** 灵将卡（文脉级）  
**属性：** 创世 · 混沌（跨属性）  
**费用：** 5 费  
**文化来源：** 《三五历纪》《太平御览》  
**视觉类型标识：** 灵将卡 — 看到人；人物立绘占画面 60-70%；混沌属性边框参考水墨黑+赭石双色内框

### Prompt A（主版本）

```
Ancient Chinese mythological figure Pangu, creator of the world,
depicted in the style of Han Dynasty bronze vessel relief carvings and Song Dynasty ink wash painting.
Massive primordial giant with stone-textured skin marked by natural cracks and moss,
holding a jade axe (yuè) modeled after Liangzhu culture neolithic jade artifacts.
Flowing robes woven from cloud and mist, earth-tone palette: raw umber, mineral ochre, stone grey.
Surrounded by swirling primal chaos ink wash background — heavy black ink dispersing into pale xuan paper white.
Facial features reference Qin/Han terracotta warriors: strong jaw, wide-set eyes, calm authority, NOT Western fantasy muscular hero.
No Western fantasy armor. No Japanese anime proportions.
Figure occupies 65% of frame, background is 35% ink wash negative space.
Card border: ink black (#1A1A1A) outer frame, raw umber (#8C6040 — earth element accent) inner line.
3D render, Unreal Engine 5 Lumen lighting, ink wash post-process, Chinese ink painting aesthetics,
traditional mineral pigment color palette, volumetric ink particle effects.
```

### Prompt B（备用/动态版本）

```
Pangu splitting heaven from earth, depicted as ancient Chinese cosmological deity,
referencing Mawangdui silk painting T-shaped banner (马王堆帛画) compositional style.
Figure viewed from below at dramatic low angle, arms raised, sky splitting above,
primordial mountain rising beneath feet.
Stone and earth textures dominate body — not flesh, not metal, but living geological strata.
Ink wash explosion radiating from body: 泼墨 (splash ink) technique, black ink erupting into void.
Color: 90% monochrome ink tones + accent 朱砂 red at axe blade edge only.
Chinese calligraphy seal stamp aesthetic. NO glow effects. NO western magical aura.
Human figure as absolute visual subject (60-70% of card face).
Single-tone ink wash background — NO dual-color gradient (no warm-to-gold transitions).
Unreal Engine 5, Nanite geometry, real-time global illumination, ink wash material shader.
```

---

## 02 — 女娲（补天造人者）

**卡牌类别：** 灵将卡（文脉级）  
**属性：** ⚠️ 火（朱砂红 `#C03A2A`） — 正式确认，v2.0 起全文件统一（原 v1.0 "土"属性已废弃）  
**费用：** 5 费  
**文化来源：** 《淮南子·览冥训》《风俗通义》  
**视觉类型标识：** 灵将卡 — 看到人；人物立绘占画面 60-70%；火属性边框 `#C03A2A` + 水墨黑内框

> **⚠️ 美术提示（关键）：** 女娲属性由 v1.0「土」改为「火」，视觉色调须完全对应火行——
> 主色为朱砂红 `#C03A2A` 系列，摒弃赭土黄色调。炼石补天场景（火炉/熔融矿石）是核心视觉意象。
> 第二关出场粒子颜色须为火色（`#C03A2A`），禁止使用土黄色。

### Prompt A（补天主版本 — 火行定稿）

```
Nüwa, Chinese mother goddess repairing the sky with five-colored stones,
depicted in Han Dynasty stone relief mural style (汉代石刻画像) combined with Tang Dynasty mural figure aesthetics.
Female deity with serpentine lower body (subtle scaled coil, mineral green 石绿 — secondary color only),
upper body in flowing silk hanfu in deep cinnabar red (朱砂 #C03A2A).
Standing before a cosmic forge furnace radiating molten fire light — cinnabar red and raw ember glow.
Hands raised, holding a glowing fragment of sky-mending stone (补天石),
stone emitting five mineral colors: cinnabar red dominant, with 石青 azure, 石绿 malachite, 赭石 ochre, 藤黄 gamboge accents.
Face: Song Dynasty Guanyin sculpture reference — serene, wide forehead, determined eyes, NOT downcast compassion but focused will.
Natural skin tone using 赭石 ochre underlayer, warm fire light from below.
Background: Sky fracture crack (sharp ink-black line) above, forge fire rising below,
smoke rendered as ink wash ascending clouds — NOT photorealistic fire, but 泼墨 ink wash fire.
Color palette: Cinnabar red dominant (#C03A2A), mineral fire orange (#D35400 accent),
ink black structural lines, xuan paper white negative space — NO earth yellow, NO clay tones.
Figure occupies 65% of frame. Card border: fire red #C03A2A outer frame, ink black inner frame.
NOT anime moe aesthetic. NOT Western goddess aesthetic. NOT earth-mother brown palette.
Unreal Engine 5, 3D card art, fire ink particle shader, 4K texture PBR workflow.
```

### Prompt B（七彩石特写版本）

```
Nüwa melting five-colored sacred stones in celestial furnace to repair the sky,
Chinese mythological scene referencing 《淮南子·览冥训》, fire element interpretation.
Five mineral stones arranged around furnace, glowing with authentic mineral colors:
朱砂 cinnabar red (dominant — fire attribute), 石青 azure, 石绿 malachite, 赭石 ochre, 藤黄 gamboge.
Figure kneeling before cosmic furnace in mudra-like gesture from Tang Dynasty mural figures,
cinnabar red hanfu illuminated from below by furnace fire — warm fire light, NOT earth tone.
Composition: vertical scroll painting format, serpentine body flowing downward,
sky repair fracture shown as sharp ink-black crack above, fire rising from below.
Fire rendered as 泼墨 (splash ink) technique — NOT photorealistic flame, but ink-wash fire shapes.
Ink wash background: graduated from dense fire-black (#1A1A1A with warm tint) to pale paper white.
Color emphasis: cinnabar red #C03A2A as primary tone, cold accents minimal.
No Western magic sparkles. No anime hair highlights. No earth/clay color palette.
Ancient Chinese fire cosmological art style.
```

---

### 女娲火行召唤特效视觉需求（供 tech_artist 预注册 NS_NuWa_FireAppear）

> **交付目标：** tech_artist（Niagara 系统预注册参数参考）  
> **触发场景：** 女娲卡拖入战场（召唤时）；第二关剧情出场（CS 镜头）

```
视觉描述：
女娲从熔融朱砂中"凝聚"成形——
不是爆炸式出场，而是如同古代窑变：
炙热的朱砂矿物粒子从下方聚合向上，
形成蛇尾→腰→肩→头的凝聚轨迹（1.5–2.0s），
伴随轻薄的水墨晕染（偏暖色，赭石调）在周围扩散，
最终粒子消散，女娲完整立绘浮现。

关键约束：
- 粒子颜色：朱砂红 #C03A2A（主体 70%） + 朱磦橙 #D35400（飞散 30%）
- 禁止出现土黄色（#8C6040 / #7B3F00 系列）
- 禁止蓝光/石青色粒子（属性混淆）
- 火焰形态：水墨泼墨感（笔触状，边缘毛糙），NOT 物理粒子火焰

Niagara 参数（建议）：
- System Name: NS_NuWa_FireAppear
- 粒子类型: GPU Sprite（聚合轨迹）+ Mesh Particle（矿物碎片感）
- 聚合方向: 由下向上，场景底部 → 角色中心（Vector Field 引导）
- Spawn Rate: 爆发式聚合，0–0.5s 内 400 粒子，0.5–1.5s 减至 80 粒/秒
- 速度: 聚合向内，2–6 m/s，带 Curl Noise 微抖动
- 颜色: #C03A2A（出生）→ #D35400（中段飞散）→ #8C8C8C 淡墨（消亡）
- Emissive: 出生时 2.0，消亡时 0.2（火光高峰在聚合中段）
- 尺寸: 0.02–0.08m，聚合时小，消散时略大
- 寿命: 0.3–0.8s（聚合粒子短寿命，快速到达目标后消失）
- 附加: 卡面 Dissolve In 同步（0.3s 后开始溶解显形）

Post Process 联动（短暂，0.5s）：
- 屏幕整体暖色偏移（Color Grading Temperature +500K，0.3s 内恢复）
- 地面 Decal：小范围朱砂红墨晕扩散（半径 0.5m，Decal 材质用火系矿物色）
```

---

## 03 — 嫦娥（月宫守望者）

**卡牌类别：** 灵将卡（极品）  
**属性：** 月华 · 阴（水属性近似，使用水属性色 `#2A4A7A` + 螺钿银 `#C0C0C0`）  
**费用：** 4 费  
**文化来源：** 《淮南子》《搜神记》《全唐诗·嫦娥》  
**视觉类型标识：** 灵将卡 — 看到人；人物立绘占画面 60-70%；水/阴属性边框 `#2A4A7A` + 螺钿银内框

### Prompt A（月宫版本）

```
Chang'e, Chinese moon goddess, depicted in the style of Tang Dynasty Dunhuang cave mural apsara figures (飞天壁画).
Female figure in layered silk hanfu — flowing sleeves extending into ribbon-like cloud trails,
not fantasy wings. Hair in Tang Dynasty 螺髻 (snail coil bun) with jade hairpins.
Holding jade rabbit, posed mid-step as if floating, referencing Dunhuang flying figure posture.
Color palette: Lunar silver 螺钿银 (#C0C0C0), cold stone blue 石青 (#2A4A7A), deep ink black shadow,
minimal 朱砂 accent at lips only.
Background: Full moon rendered as rice paper circle with lunar landscape ink wash inside,
osmanthus tree silhouette (桂树) in pure black ink brushwork.
Single-tone cold blue ink wash background — NO dual-color gradient, NO warm gold tones.
Melancholy expression — NOT smiling idol, NOT cute anime — the isolation of 《嫦娥》by Li Shangyin.
Figure occupies 65% of frame. Card border: water blue #2A4A7A outer frame, ink black inner frame.
3D Unreal Engine 5, moonlight Lumen GI, lunar particle effects (silver micro-dots), ink wash post-processing.
```

### Prompt B（奔月瞬间）

```
Chang'e ascending to the moon, a moment of regret frozen in time,
capturing the emotional resonance of 唐代诗意 — elegant grief, not heroic triumph.
Figure in dynamic mid-flight pose, silk robes and ribbons streaming behind,
rendered with 吴道子 (Wu Daozi) style of 吴带当风 (clothing flowing like wind).
Left hand holding elixir bottle (灵药瓶), right hand reaching toward fading earth below.
Scale: moon large in background, earth landscape tiny below — cosmic loneliness expressed through scale.
Color: near-monochrome ink wash with single color accent of 石青 blue moon glow,
fabric translucency rendered through ink wash layering, NOT modern game transparency.
Background ink wash: cold stone blue gradient on xuan paper — single tone, NO warm gold overlay.
Traditional Chinese literati painting (文人画) aesthetic. NO fantasy glow aura.
```

---

## 04 — 吕洞宾（剑仙行者）

**卡牌类别：** 灵将卡（极品）  
**属性：** 剑气 · 仙（金属性，边框 `#C8A04A`）  
**费用：** 4 费  
**文化来源：** 《历代神仙通鉴》《警世通言》  
**视觉类型标识：** 灵将卡 — 看到人；人物立绘占画面 60-70%；金属性边框 `#C8A04A` + 水墨黑内框

### Prompt A（剑仙版本）

```
Lü Dongbin, one of the Eight Immortals (八仙), Taoist sword immortal,
depicted in Northern Song Dynasty literati figure painting style (文人墨客画风).
Scholar-warrior aesthetic — NOT warrior armor, but Taoist robe (道袍) in dark ink tones,
carrying 断邪剑 (sword on back, not in hand), holding a 拂尘 (horsetail whisk).
Face: Middle-aged male, scholar's bearing, slight smile suggesting hidden depth,
reference Song Dynasty portrait painting faces — angular but not sharp, wise but not stern.
Hat: 纯阳巾 (Chunyang headscarf). Long beard. Ink-black hair with single white streak.
Background: Mountain path at dusk, pine trees in 北宋院体画 (Song Academy) style,
single-tone ink-washed mist — monochrome ink background, NO warm-to-gold gradient.
Color: Ink black dominant (85%), accent 朱砂 at sword tassel only, gold #C8A04A at sword guard trim.
Figure occupies 65% of frame. Card border: gold #C8A04A outer frame, ink black inner frame.
NO Western wizard staff. NO anime spiky hair. NO glowing magic blade.
Traditional Chinese Taoist aesthetic, Unreal Engine 5 3D card art.
```

### Prompt B（云中剑气版本）

```
Lü Dongbin commanding ink-black sword energy flowing like calligraphy brushstroke,
depicting his legendary 剑法 (sword art) as 草书 (cursive calligraphy) in motion.
Sword energy visualized NOT as light beams but as dynamic ink-wash brushstrokes in 3D space —
black ink trails with 飞白 (dry brush) texture.
Figure at center, calm and still while chaos unfolds around him.
Taoist robes undisturbed — mastery expressed through stillness, not dramatic action pose.
Composition reference: 梁楷 (Liang Kai) splash ink figure paintings — few brushstrokes suggesting much.
Color: 墨分五色 (five shades of ink) — 焦 burnt black to 淡 pale grey, xuan paper white negative space.
Minimal color: single 石青 accent at robe collar lining, gold #C8A04A hairpin accent only.
3D ink wash shader, Unreal Engine 5 Lumen, calligraphy particle effect system.
```

---

## 05 — 门神（守护双将）

**卡牌类别：** 灵将卡（珍品，双联卡）  
**属性：** 镇守 · 辟邪（土属性，边框 `#8C6040`）  
**费用：** 3 费 × 2（双联）  
**文化来源：** 《三教源流搜神大全》，秦叔宝与尉迟恭门神传说  
**视觉类型标识：** 灵将卡 — 看到人（双人构图）；人物各占单张卡面 60-70%；土属性边框 `#8C6040` + 水墨黑内框

### Prompt A（木版年画风格）

```
Chinese Door Gods (门神) Qin Shubao and Yuchi Gong as a matched pair,
depicted in the style of Yangliuqing New Year woodblock print (杨柳青年画) translated into 3D.
Two armored generals facing each other in mirror symmetry — traditional door god composition.
Armor: Tang Dynasty 明光铠 (bright armor) referencing archaeological museum examples,
NOT fantasy plate armor. Decorative armor with painted tiger heads on shoulder guards.
Weapons: battle-axe (金锏/鞭) held upright, NOT pointing outward.
Expression: dignified, fierce but not violent — protective guardian aesthetic.
Color palette: Mineral colors — 朱砂 red armor accents, 石青 blue uniform underlayer,
金箔 gold armor trim (#C8A04A), ink black outline, 宣纸 white background.
Symmetric composition with traditional 门框 (door frame) red border element.
Figure occupies 65% of each card. Background: single-tone ink wash, NO gradient.
Card border (each card): earth #8C6040 outer frame, ink black inner frame.
Style: 3D card art with New Year woodblock print color blocking aesthetic,
bold outlines, flat mineral pigment areas, limited gradient. Unreal Engine 5.
```

### Prompt B（写意版本）

```
Chinese Door God guardian spirit in more ink wash expressive rendering,
referencing Han Dynasty stone relief guardian figures (石刻门卫神将).
Single figure composition, full armor general with dramatic pose — one hand raised in 辟邪手印 (warding mudra).
Armor design based on authentic Tang military artifacts from Shaanxi History Museum collection.
Face: strong, imposing, eyes wide in vigilant stare — human dignity not monster ferocity.
Background: Deep ink wash black dissolving to xuan paper white at edges — monochrome, single tone.
Red 福 character seal visible in upper corner (negative space).
Color: predominantly ink monochrome, 朱砂 red as power accent for armor highlights only.
No fantasy glowing runes. No Western knight helmet. No Japanese oni aesthetic.
Ancient Chinese protective deity art, 3D Unreal Engine 5, ink wash material shader.
```

---

## 06 — 皮影人（影幕游侠）

**卡牌类别：** 文脉卡（珍品）  
**属性：** 变幻 · 非遗  
**费用：** 2 费  
**文化来源：** 陕西皮影戏，中国非物质文化遗产  
**视觉类型标识：** 文脉卡 — 看到器/景；皮影工艺本体为主视觉（非遗技艺场景）；赭石 `#8C6040` + 宣纸白内框

### Prompt A（皮影本体版本）

```
Chinese shadow puppet figure (皮影戏) — the craft object itself as card subject,
maintaining the authentic aesthetic of Shaanxi Huaxian shadow puppet craftsmanship.
SUBJECT IS THE PUPPET OBJECT, not a character: thin translucent ox-hide skin (皮),
intricate carved lacework body, vivid painted patterns in mineral colors.
Colors: 朱砂 red (#C03A2A), 石青 blue (#2A4A7A), 藤黄 yellow (#F4D03F), ink black outlines.
Posed in classic martial arts stance (武生造型) referencing opera martial character (武生行当).
Background: Performance lamp glow behind (油灯光晕) — warm amber light from behind,
casting exaggerated shadow on white silk screen — composition centers on craft, not battle.
Color: authentic shadow puppet colors — flat mineral color blocking with black outline,
minimal gradient, flat like original craft. Single warm amber light source.
Card border: raw umber #8C6040 outer frame, xuan paper white (#F5F0E8) inner frame.
Background is single-tone: xuan paper white with amber lamp glow — NO dual-color gradient.
3D card rendering maintaining 2D aesthetic of original art form. Cultural heritage documentation quality.
```

### Prompt B（影幕对决版本）

```
Shadow puppet warrior emerging from screen surface into 3D reality —
a 非遗 (intangible cultural heritage) spirit given form,
transitioning from flat silhouette on white screen to three-dimensional presence.
Split composition: lower half as flat shadow silhouette on white silk screen,
upper half breaking through into full 3D mineral-color rendered figure.
Representing cultural awakening — traditional art form becoming alive.
Puppet costume: Shaanxi opera wusheng (武生) style with ornate carved ox-hide patterns,
colors must match authentic 皮影 regional tradition: bright 朱砂 red (#C03A2A), 石青 blue, warm gold 藤黄.
Face: stylized puppet face with exaggerated almond eyes and sharp chin
— THIS IS INTENTIONAL as authentic shadow puppet aesthetics, NOT criticizable as anime.
Background: single-tone ink wash with warm lamp amber at edges — NO cold-to-gold gradient.
Card border: raw umber #8C6040 outer frame, xuan paper white inner frame.
Background: xuan paper bottom with ancient text line watermark (《山海经》illustration style).
Unreal Engine 5, 3D card art, authentic Chinese intangible cultural heritage visual language.
```

---

## 07 — 哪吒（莲花战神）【新增】

**卡牌类别：** 灵将卡（珍品）  
**属性：** 火（朱砂红 `#C03A2A`）  
**费用：** 3 费  
**文化来源：** 《封神演义》《西游记》  
**视觉类型标识：** 灵将卡 — 看到人；少年神将立绘占画面 65%；火属性边框 `#C03A2A` + 水墨黑内框

> **设计说明：** 哪吒与女娲同属火行，视觉差异在于：女娲以"造化/熔炉"为火行意象，哪吒以"莲花武将/战斗"为火行意象。禁止将哪吒设计成影视 IP 形象，参考原典《封神演义》插图与古代武生戏曲造型。

### Prompt A（莲花战神版本）

```
Nezha, Chinese youthful fire deity and warrior from 《封神演义》,
depicted in the style of Ming Dynasty woodblock novel illustration (明代木刻版画).
Young male deity, 15-16 years apparent age, NOT cute chibi, but fierce warrior child.
Proportions: 6-head figure (shorter than adult immortals — emphasize youth, not fantasy loli).
Costume: 混天绫 (Huntian Ling — red silk sash) streaming dynamically from both shoulders,
风火轮 (Wind Fire Wheels) beneath feet — rendered as spinning cinnabar wheels with fire ink trails, NOT neon.
Holding 乾坤圈 (Universe Ring) weapon — jade/white gold ring, NOT Western halo.
Face: fierce, determined, angular — NOT kawaii, NOT modern game shonen face.
Reference: ancient door god child warriors in temple murals.
Fire particles: ink-wash fire trail from Wind Fire Wheels — cinnabar red #C03A2A brush-stroke fire.
Background: ink wash explosion of fire, 泼墨 style, black ink infused with cinnabar red glow.
Color: 混天绫 in cinnabar red #C03A2A, skin in warm 赭石 ochre tone, 火轮 in #D35400 fire orange.
Figure occupies 65% of frame. Card border: fire red #C03A2A outer frame, ink black inner frame.
NO anime spiky hair. NO modern fire effects. NO Western angel/demon wings.
3D Unreal Engine 5, ink wash fire shader, Ming Dynasty woodblock aesthetic.
```

### Prompt B（风火轮特写版本）

```
Nezha riding Wind Fire Wheels in mid-battle stance,
composition focusing on the 风火轮 (Wind Fire Wheels) and 混天绫 silk sash dynamic motion.
Low camera angle, looking up at figure against ink wash sky.
风火轮 spinning rapidly, trailing cinnabar red ink-wash fire strokes (NOT laser/neon trails).
混天绫 silk sash creating dynamic S-curve composition — inspired by 吴道子 clothing flow style.
乾坤圈 glinting with gold mineral color (#C8A04A) in held hand.
Face visible but upper body is primary — show battle intensity, NOT full portrait.
Fire ink background: dense 泼墨 spreading from wheels, monochrome black-to-grey with cinnabar accents.
Color restraint: cinnabar red dominant, ink black structural, single gold accent at ring only.
No photorealistic fire. No Western fantasy fire. Traditional Chinese woodblock illustration translated to 3D.
```

---

## 08 — 太乙真人（演法神仙）【新增】

**卡牌类别：** 灵将卡（极品）  
**属性：** 金（金箔金 `#C8A04A`）  
**费用：** 4 费  
**文化来源：** 《封神演义》  
**视觉类型标识：** 灵将卡 — 看到人；仙人立绘占画面 65%；金属性边框 `#C8A04A` + 水墨黑内框

### Prompt A（云端仙人版本）

```
Taiyi Zhenren, Taoist immortal master from 《封神演义》,
depicted in Tang Dynasty Taoist celestial figure painting style.
Elder male immortal with long white beard, calm benevolent expression,
NOT stern sorcerer — the teacher archetype, scholarly dignity.
Costume: Taoist robes in layered cream/white (宣纸白 #F5F0E8) with gold brocade trim (#C8A04A),
八卦 trigram pattern on robe hem — SUBTLE, not garish.
Holding lotus flower (莲花) in one hand, or holding jade ruyi scepter.
Seated or floating on 九色鹿 (Nine-colored Deer) or celestial cloud — traditional celestial transport.
Aura: gold mineral light from body — NOT neon halo, but 金箔 textured glow,
referencing gold leaf Buddhist iconography from Dunhuang caves.
Background: heavenly cloud sea, ink wash cumulus in cold blue-grey tones,
gold Emissive from figure contrasting cold cloud background.
Color: cream/white robes, gold #C8A04A accents, ink black detail lines.
Figure 65% of frame. Card border: gold #C8A04A outer frame, ink black inner frame.
NO fantasy wizard. NO Gandalf reference. Ancient Chinese Taoist immortal iconography.
Unreal Engine 5, 4K PBR, celestial Lumen GI lighting.
```

---

## 09 — 九天玄女（天书传授者）【新增】

**卡牌类别：** 灵将卡（文脉级）  
**属性：** 水（石青 `#2A4A7A`）  
**费用：** 5 费  
**文化来源：** 《云笈七签》《太平广记》  
**视觉类型标识：** 灵将卡 — 看到人；神女立绘占画面 65%；水属性边框 `#2A4A7A` + 水墨黑内框

### Prompt A（天书降授版本）

```
Jiutian Xuannü (Mysterious Lady of the Nine Heavens), ancient Chinese war goddess and celestial teacher,
depicted in Tang Dynasty celestial figure mural style (天界人物壁画).
Female immortal figure in full ceremonial regalia — celestial armor over flowing silk,
armor referencing Tang Dynasty female warrior (女将) archaeological references, NOT revealing fantasy armor.
Holding a jade scroll (天书) — the celestial military text she is transmitting.
Expression: authoritative, commanding, the teacher of Yellow Emperor — NOT gentle goddess, but battle-tested divine general.
Color palette: Deep stone blue (#2A4A7A) for armor, cold silver-blue highlights (#2E86C1),
朱砂 red (#C03A2A) minimal accent at armor joints, spiral cloud motifs in cold ink blue.
Background: Nine heavens cloud strata — layered ink wash in progressively lighter cold blue tones,
stars as white ink dots on dark indigo upper background.
Hair: Tang Dynasty formal celestial coiffure with phoenix jade hairpins.
Figure 65% of frame. Card border: water blue #2A4A7A outer frame, ink black inner frame.
NO anime magical girl. NO Western valkyrie armor. Tang Dynasty female authority aesthetic.
Unreal Engine 5, Lumen cold light, celestial particle effects.
```

---

## 10 — 山海经·夔（典籍文物卡）【新增】

**卡牌类别：** 文脉卡（珍品）  
**属性：** — （文脉卡无属性）  
**费用：** 1 费  
**文化来源：** 《山海经·大荒东经》："有兽，状如牛，苍身而无角，一足……其名曰夔"  
**视觉类型标识：** 文脉卡 — 看到器/景；典籍图像为主视觉，无人物，无战斗感；赭石 `#8C6040` + 宣纸白内框

### Prompt A（古籍插图版本）

```
Kui, the one-legged divine beast from 《山海经》 (Classic of Mountains and Seas),
depicted as an ancient illustrated manuscript entry — NOT a battle scene, NOT a character portrait.
Art style: Song Dynasty 《山海经图》 manuscript illustration aesthetic,
brush line drawing with flat mineral color fill — the book page IS the card.
Kui depicted as: ox-shaped body, blue-grey skin (苍身 = cold mineral grey #5A5A5A),
single leg, no horns. Proportions following ancient Chinese mythological bestiaries, NOT modern game monster design.
Composition: beast in center-right, ancient Chinese text annotation visible on left side,
ink brushwork border simulating old book page with aged xuan paper texture.
Color: predominantly ink grey/black lines on xuan paper white (#F5F0E8 background),
minimal mineral color fill: 石青 cold grey-blue body (#2A4A7A low saturation wash),
赭石 ground below feet, text in ink black.
Background: aged xuan paper texture, subtle foxing marks, scrollwork borders.
NO fantasy monster design. NO game creature design. The aesthetic is a BOOK PAGE come to life.
Card border: raw umber #8C6040 outer frame, xuan paper white (#F5F0E8) inner frame.
Background watermark: 《山海经》text line watermark (古籍线条 style).
3D Unreal Engine 5, card rendered to look like an ancient illustrated bestiary page.
```

---

## 跳过卡牌（待 D-HIGH 修订完成后补充）

以下两张卡牌因设计仍在修订中（D-HIGH-001/002），视觉定稿暂缓：

| 卡牌 | 跳过原因 | 预期解锁时间 |
|------|---------|------------|
| FL-006 雷击符 | D-HIGH-001 符箓直伤规则文本修订中 | 待 designer 确认后 |
| WM-004（文脉卡） | D-HIGH-002 文脉卡机制修订中 | 待 designer 确认后 |

---

## 补充说明

### 通用 Negative Prompt（所有卡牌通用反向提示词）

```
western fantasy, european medieval armor, magical sparkles, neon glow,
anime eyes, anime proportions, big eyes, small chin, korean idol face,
game character network face (网游立绘), photorealistic modern fashion,
dragon robe + mecha (龙袍机甲), panda + kung fu, lotus fairy (莲花仙子 bling),
gradient rainbow hair, blue purple magic aura, explosion fireball,
saturated jewel tones, pastel colors, white background studio shot,
cold-to-gold dual color gradient background (冷色到金色双色渐变背景),
earth yellow / clay brown on fire-attribute characters (火行角色禁用土黄色调)
```

### 女娲火行专用 Negative Prompt（追加）

```
earth tone dominant, clay yellow, raw umber dominant palette,
brown serpent body, soil goddess aesthetic,
土黄色, 泥土色调, 大地母亲色系
```

### 风格参考图资源建议

- 马王堆汉墓帛画（数字版，湖南省博物馆开放资源）
- 敦煌莫高窟壁画（敦煌研究院数字敦煌数据库）
- 杨柳青木版年画（天津杨柳青博物馆图录）
- 陕西皮影（华县皮影博物馆）
- 故宫藏宋代人物画（故宫博物院文物数字化项目）
- 明代木刻版画《封神演义》插图（国家图书馆古籍数字化资源）
- 《山海经图》宋代绘本（故宫博物院藏）
- 敦煌 158 窟唐代女性供养人像（水属性女将参考）

### 三类卡牌边框色速查

| 卡牌类型 | 外框色 | 内框色 |
|---------|--------|--------|
| 灵将卡（金属性） | `#C8A04A` | `#1A1A1A` |
| 灵将卡（木属性） | `#4A8C5C` | `#1A1A1A` |
| 灵将卡（水/阴属性） | `#2A4A7A` | `#1A1A1A` |
| 灵将卡（火属性） | `#C03A2A` | `#1A1A1A` |
| 灵将卡（土属性） | `#8C6040` | `#1A1A1A` |
| 符箓卡 | `#C03A2A` | `#F4D03F` |
| 文脉卡 | `#8C6040` 或 `#3D3D3D` | `#F5F0E8` |
