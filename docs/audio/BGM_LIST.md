# BGM_LIST.md — 《文脉·山海卡》首批 BGM 需求清单

> 版本：v1.3  
> 音频总监：audio  
> AI 工具选型说明：Suno AI（v4） / Udio（备选）  
> 最后更新：2026-04-30  
> 变更 v1.1：补充每首 BGM 版权来源标注（应 team-lead 要求）  
> 变更 v1.2：修复 AUD-HIGH-001（BGM #4 Udio Prompt 调式音名歧义）；修复 AUD-MID-001（BGM #2 Layer 4 琵琶违反昆仑墟风格禁令）  
> 变更 v1.3：新增盲听评审评分标准（AU-MED-002）；BGM #3 战斗层强化说明（AU-LOW-001）

---

## 工具选型总览

| 工具 | 优势 | 适用 BGM | 注意事项 |
|------|------|---------|---------|
| **Suno v4** | 中国传统乐器识别较好，支持 Custom Mode 精细 Prompt | BGM #1, #2, #3, #5 | 需明确指定乐器名，避免自动加西洋弦乐 |
| **Udio** | 对器乐纯音轨支持更稳定，无人声风险更低 | BGM #4, #6, #7 | 需在 Style 中指定"no vocals, no choir" |
| **人工拼接（DAW）** | 将多个 AI 片段拼接，配合手动编排 | 所有 BGM 精修版 | Reaper / Audacity 可胜任 |

**版权说明**：Suno v4 商业计划（Pro/Premier）生成内容版权归用户所有，可用于商业发布。Udio 需确认当前条款（见 LICENSES.md）。

---

## BGM #1 — 主菜单（Main Menu）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_main_menu` |
| **调式** | 宫调式（C 宫五声，接近 Am pentatonic） |
| **BPM** | 58 BPM（散板感，允许 ±4 BPM 自由渐变） |
| **时长** | 3:00 – 3:30（含 loop） |
| **Loop 点** | 0:08 入 → 3:00 回（开头 8s 为非 loop 引子） |
| **编制** | 古琴（主）+ 箫（副）+ 磬（点缀）+ Granular Pad（底） |
| **AI 工具** | Suno v4 Custom Mode |
| **版权来源** | Suno v4 Pro/Premier 计划（生成内容版权归用户所有）；底层 Granular Pad 若取自外部：仅使用 Freesound CC0 授权素材 |

**情绪曲线**：
```
0:00–0:08  [引子] 单音磬声渐入，极静
0:08–0:40  [建立] 古琴低弦单句，宫调式，稀疏
0:40–1:20  [展开] 箫加入，两乐器呼应对话
1:20–2:00  [高潮] 箜篌轻琶音加入，音色最丰富
2:00–2:40  [渐退] 逐步减少乐器，回到古琴独奏
2:40–3:00  [尾声→Loop] 回到引子音型，无缝衔接
```

**Suno Prompt（Custom Mode）**：
```
Style: Chinese guqin ambient meditation, ancient pentatonic, 
       sparse xiao flute, qing (stone chime) accent, granular pad drone,
       no percussion, no drums, no vocals, no choir, no western strings,
       slow tempo ~58bpm, D minor pentatonic, reverb cave acoustic
Genre: Instrumental, Ancient Chinese, Ambient
Mood: Serene, Contemplative, Vast, Ancient
Instruments: Guqin (ancient 7-string zither), Xiao flute, Stone chime, 
             atmospheric pad
```

**质量标准**：生成多版本（建议 6 版），选择古琴音色最自然（非合成器模拟感）的版本。

---

## BGM #2 — 昆仑墟战斗（Battle - Kunlun）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_battle_kunlun` |
| **调式** | 羽调式（A 羽五声，接近 A minor pentatonic） |
| **BPM** | 96 BPM |
| **时长** | 2:30 – 3:00（分层 Stems 格式） |
| **Loop 点** | 0:04 引子 → 2:30 loop（精确到小节线） |
| **编制** | 竹笛（主旋律）+ 箫 Pad + 磬（节拍点缀）+ 轻低鼓（半速律动）|
| **AI 工具** | Suno v4 |
| **版权来源** | Suno v4 Pro/Premier 计划；分层 Stem 全部由 Suno 生成，无外部采样 |

**分层要求（Stems）**：
```
Layer 0 (Ambient):  granular wind pad + 远山空间感混响
Layer 1 (Melody):   竹笛主旋律（羽调式，每句之间留白 2-3 拍）
Layer 2 (Rhythm):   低音堂鼓半速律动（每 2 拍一击，极轻）
Layer 3 (Harmony):  箜篌流动琶音（进入战斗中期后加入）
Layer 4 (Intensity):编磬快速点击短句（HP 危急时加入，增加紧迫感；v1.2 修复：原琵琶违反昆仑墟「禁用琵琶」规则，改为编磬以保持清冷气质）
```

**情绪曲线**：
```
0:00–0:20  [进场] 风声 + 磬单击，静谧开场
0:20–0:50  [Layer 1] 竹笛孤句主旋律入，空灵清冷
0:50–1:20  [+Layer 2] 节奏层加入，战斗感建立
1:20–1:50  [+Layer 3] 和声充实，中等紧张度
1:50–2:30  [高潮循环] 四层全开，但仍保持"冷峻"而非"热血"
2:30→Loop  回到 0:04
```

**Suno Prompt**：
```
Style: Ancient Chinese battle music, pentatonic dizi flute melody, 
       xiao bamboo flute pad, light taiko half-time beat,
       sparse qin chime accents, no vocals, no choir, no western orchestra,
       96bpm, A minor pentatonic, spacious reverb, cool ethereal atmosphere
Genre: Instrumental Battle Music, Ancient Chinese
Mood: Cold, Vast, Determined, Mythic
Instruments: Dizi (bamboo flute), xiao, taiko drum (light), 
             bianqing (stone chime set, fast clicks), qing stone chime
```

---

## BGM #3 — 古戏台战斗（Battle - Theater）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_battle_theater` |
| **调式** | 徵调式（G 徵五声，热烈明朗） |
| **BPM** | 132 BPM |
| **时长** | 2:30 – 3:00（分层 Stems） |
| **Loop 点** | 0:02 → 2:30 |
| **编制** | 横笛/鼓（主驱动）+ 琵琶（和声层）+ 板+堂鼓（节奏骨架）+ 三弦（色彩） |
| **AI 工具** | Suno v4 |
| **版权来源** | Suno v4 Pro/Premier 计划；Layer 4 锣击若需真实录音替换，须使用 CC0 授权采样（Freesound ID 待填写）|
| **AU-LOW-001 调整** | 与书斋 BGM #4（古琴独奏+低BPM）的反差强化：战斗BGM #3 改以**横笛+堂鼓为主旋律驱动**，古琴仅作和声辅助层；书斋BGM #4 古琴独奏+木鱼极简律动，两场景切换时情绪落差明确 |

**分层要求（Stems）**：
```
Layer 0 (Base):     板+堂鼓底层节奏骨架（始终）
Layer 1 (Melody):   琵琶快速弹挑主旋律（始终）
Layer 2 (Counter):  横笛对位副旋律（战斗开始激活）
Layer 3 (Fill):     三弦和声填充（紧张度>50% 激活）
Layer 4 (Drama):    锣一击 + 密集鼓点段落（Boss 出场/技能释放）
```

**情绪曲线**：
```
0:00–0:08  [起板] 板击三下 → 鼓点起，传统戏曲开场
0:08–0:40  [展开] 琵琶主旋律全速推进，徵调式明快
0:40–1:20  [对位] 横笛加入对话，增加活力
1:20–2:00  [高潮] 全层叠加，戏台狂欢感
2:00–2:30  [变奏重复] 保持热度，节奏微变化
2:30→Loop  无缝回到起板后的第 4 拍
```

**Suno Prompt**：
```
Style: Chinese opera theater battle music, pipa lute fast picking,
       dizi flute counter melody, ban (clapper) and drum rhythm backbone,
       sanxian pluck harmony, 132bpm, G pentatonic, 
       lively festive but martial, no vocals, no choir, no western strings,
       traditional Chinese folk ensemble
Genre: Chinese Folk Battle, Theater Music, Instrumental
Mood: Vibrant, Lively, Energetic, Festive-Martial
Instruments: Pipa, Dizi, Ban (wood block), Taiko, Sanxian (3-string lute)
```

---

## BGM #4 — 书斋战斗（Battle - Study）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_battle_study` |
| **调式** | 宫调式（C 宫五声，稳重内敛） |
| **BPM** | 76 BPM（相对其他战斗 BGM 明显较慢，突出书斋"静中有张力"） |
| **时长** | 2:30 – 3:00 |
| **Loop 点** | 0:06 → 2:30 |
| **编制** | 古琴（主）+ 木鱼轻律动 + 箫（紧张层）+ 低频 Drone（底） |
| **AI 工具** | Udio（人声风险更低，纯器乐控制更精确） |
| **版权来源** | Udio Standard/Pro 付费计划（版权归用户）；Layer 0 蜡烛/书房环境底音：Freesound CC0（ID 待填写，搜索关键词：candle crackle CC0）|

**分层要求（Stems）**：
```
Layer 0 (Ambient):  蜡烛声 granular 处理 + 书房底层静默感
Layer 1 (Melody):   古琴散板旋律（稀疏，每句留白 3-4 拍）
Layer 2 (Rhythm):   木鱼极轻律动（进入战斗激活，音量 -20dB）
Layer 3 (Tension):  箫长音上行（紧张度>60% 激活，制造压迫感）
Layer 4 (Crisis):   低频 Drone 渐强（HP 危急时，古琴奏快速颤弦）
```

**情绪曲线**：
```
0:00–0:20  [寂静开场] 书房底层氛围，古琴单音
0:20–1:00  [基调建立] 古琴稀疏旋律，宫调式，沉着
1:00–1:40  [张力增加] 木鱼律动激活，节拍感建立
1:40–2:10  [紧迫转折] 箫上行长音，和声张力
2:10–2:30  [高潮] 古琴颤弦 + 全层叠加，"智者之怒"
2:30→Loop  退回基调，等待下一次紧张
```

**Udio Prompt**：
```
ancient chinese guqin solo meditation, slow 76bpm, C pentatonic scale (C-D-E-G-A),
wooden fish light percussion texture, xiao bamboo flute tension layer,
no vocals, no choir, no drums, no percussion except minimal wood block,
contemplative scholar atmosphere, candle ambience, ink and paper space
```

---

## BGM #5 — Boss 战（Boss Battle）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_boss_battle` |
| **调式** | 羽调式为主 → 调式模糊化处理（加入偏音） |
| **BPM** | 112 BPM |
| **时长** | 3:00 – 3:30 |
| **Loop 点** | 0:12 → 3:00（前 12s 为非 loop 开场） |
| **编制** | 编钟（开场主题）+ 琵琶（主战斗旋律）+ 堂鼓（骨干节奏）+ 磬反转采样（特效） |
| **AI 工具** | Suno v4 + 手动拼接 DAW 后期 |
| **版权来源** | Suno v4 Pro/Premier 计划；DAW 后期处理为原创工作，无版权问题；Layer 3 磬逆向采样若使用外部素材须为 Freesound CC0 |

**分层要求（Stems）**：
```
Layer 0 (Foundation): 低频 Drone + 编钟高泛音衰减
Layer 1 (Main):       琵琶强力主旋律，带偏音增加张力
Layer 2 (Drive):      堂鼓大节奏律动（始终）
Layer 3 (Ornament):   磬逆向采样音效点缀（每 8 拍一次）
Layer 4 (Climax):     全层 + 竹笛高音冲破（Boss 进入最终形态）
```

**情绪曲线**：
```
0:00–0:12  [开场仪式] 编钟庄严单击 × 3，磬回声，Boss 入场感
0:12–0:40  [主题建立] 琵琶 + 堂鼓，威压感，不急躁
0:40–1:20  [激化] 节奏密度增加，加入偏音色彩
1:20–2:00  [激战] 四层同时，最大张力
2:00–2:30  [Boss 技能段落] 节奏断点 + 磬逆向音效（制造仪式感）
2:30–3:00  [最终高潮] 竹笛高音冲出，全力推进
3:00→Loop  回到 0:12 主题
```

**Suno Prompt**：
```
Style: Chinese boss battle music, bianzhong bell ominous opening,
       pipa intense driving melody, large taiko drum heavy beat,
       reversed qing chime sfx accent, dark pentatonic with chromatic tension,
       112bpm, A minor with blue notes, ancient mythological supernatural,
       no vocals, no choir, epic but not western orchestral
Genre: Boss Battle, Ancient Chinese Epic, Instrumental
Mood: Ominous, Powerful, Mythic, Relentless
Instruments: Bianzhong bells, Pipa, Taiko drum, Qing chime (reversed)
```

---

## BGM #6 — 胜利（Victory）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_victory` |
| **调式** | 角调式（E 角五声，清新积极） |
| **BPM** | 104 BPM |
| **时长** | 0:45 – 1:00（短曲，一次播放不循环） |
| **Loop 点** | 无（线性播放） |
| **编制** | 箜篌流动琶音 + 竹笛明亮旋律 + 磬点缀 + 轻鼓收尾 |
| **AI 工具** | Udio |
| **版权来源** | Udio Standard/Pro 付费计划（版权归用户）；短曲无需外部采样 |

**情绪曲线**：
```
0:00–0:08  [瞬间释放] 磬清脆一击 + 箜篌上行琶音
0:08–0:35  [欢欣展开] 竹笛明亮主旋律，角调式，欢快不俗气
0:35–0:52  [收束] 旋律渐收，磬轻点尾声
0:52–1:00  [余韵] 箜篌单音衰减至静
```

**Udio Prompt**：
```
ancient chinese victory fanfare, konghou harp flowing arpeggios,
bright dizi bamboo flute melody, light qing chime, 104bpm, E pentatonic,
joyful triumphant but elegant not bombastic, 
no western brass, no choir, no percussion except light drum ending,
short piece ~50 seconds, graceful celebration
```

---

## BGM #7 — 失败（Defeat）

| 属性 | 数值 |
|------|------|
| **文件 ID** | `bgm_defeat` |
| **调式** | 商调式（D 商五声，苍凉悲壮） |
| **BPM** | 52 BPM（3/4 拍） |
| **时长** | 0:50 – 1:10（短曲，一次播放不循环） |
| **Loop 点** | 无（线性播放） |
| **编制** | 二胡单音（主）+ 古琴低弦 + 极轻堂鼓远击 |
| **AI 工具** | Suno v4 |
| **版权来源** | Suno v4 Pro/Premier 计划；如需真实二胡采样替换 AI 生成版：Spitfire LABS 中式弦乐包（免费，商业可用，需注册）或 Freesound CC0 |

**情绪曲线**：
```
0:00–0:10  [沉默入场] 2-3 秒静默 → 古琴单音低叹
0:10–0:40  [叹息展开] 二胡主旋律，商调式，苍凉不崩溃
0:40–0:58  [渐弱] 乐器逐一退出，留二胡最后长音
0:58–1:05  [消逝] 二胡长音衰减至静
```

**Suno Prompt**：
```
Style: Ancient Chinese defeat lament, erhu solo melody sorrowful,
       guqin low string accompaniment, distant taiko drum single hit,
       52bpm 3/4 time, D minor pentatonic, contemplative loss not dramatic cry,
       no choir, no vocals, intimate chamber acoustic, 
       fade to silence ending, ~55 seconds
Genre: Ancient Chinese, Lament, Instrumental Solo
Mood: Melancholic, Contemplative, Dignified Sorrow
Instruments: Erhu (2-string fiddle), Guqin, distant Taiko
```

---

## 生成工作流程

### 步骤一：提示词迭代
1. 以上 Prompt 为基础版本，首次生成后根据结果调整
2. 重点调整维度：主奏乐器音色（"更像真实古琴，减少合成感"）、节奏密度、空间混响量

### 步骤二：多版本生成
- 每首 BGM 生成 **至少 6 个版本**
- 版本存放：`references/audio/bgm_candidates/bgm_[id]_v[n].mp3`

### 步骤三：盲听评估（AU-MED-002 — 量化评审标准）

> 本标准由 audio + critic 共同确认。每首 BGM 小样须达到总分 ≥13（含循环 Pass）方可进入实现阶段。

#### 评审维度与评分标准

| 维度 | 满分 | 评分说明 |
|------|------|---------|
| **风格符合度** | 5分 | 5=完全感知到水墨/传统中国美学，无西方流行感；3=有传统感但存在明显西洋弦乐/合唱；1=感知不到中国风 |
| **情绪匹配度** | 5分 | 5=战斗BGM给人明确紧张感，探索/菜单BGM有悠远意境；3=情绪基本对但边界模糊；1=情绪与场景完全不符 |
| **循环缝合点** | Pass/Fail | Pass=BGM Loop 接缝在 4 小节内无明显突兀感（听不出"重置"）；Fail=接缝明显可感知 |
| **混音响度** | 5分 | 5=响度在 -14 LUFS ±2 范围内；3=响度偏离超过 ±3 LUFS；1=响度严重不合规（削波或过低）|

**合格线**：总分 ≥13 分，且循环评审为 Pass。

#### 盲听流程（critic 执行）
1. 不看场景标签，直接听，30秒内写下第一感受
2. 对照上表打分（风格/情绪/响度），判定循环缝合点
3. 输出：通过 / 需调整（附具体修改建议，指向 Prompt 参数或 DAW 处理方式）

- 生成完成后通过 SendMessage 发送给 critic 盲听附上候选版本路径（`references/audio/bgm_candidates/`）

### 步骤四：精修
- 选定版本后，在 DAW（Reaper/Audacity）中处理：
  - 设置精确 Loop 点（过零点编辑）
  - 响度标准化（见 AUDIO_STYLE.md 响度规范）
  - 导出 .ogg Vorbis q5

---

*文档由 audio 团队维护，BGM 候选版本待 critic 盲听后最终确认。*
