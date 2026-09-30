# M6_narrative.md — Milestone 6：故事模式第一章接入

**目标**：故事模式第一章（3关）端到端可玩通关，含对话系统、剧情过场、关卡解锁  
**阶段对应**：ROADMAP Sprint 3-3 / 3-4  
**版本**：v0.1 | 维护人：engineer  
**前置依赖**：M5_progression 验收通过；narrative 提供 CH1_SCRIPT.md  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `BP_DialogueManager` | Blueprint Actor | `Content/WX_Core/NarrativeSystem/` | [ ] |
| `BP_StoryFlowController` | Blueprint Actor | `Content/WX_Core/NarrativeSystem/` | [ ] |
| `BP_CinematicTrigger` | Blueprint Actor | `Content/WX_Core/NarrativeSystem/` | [ ] |
| `WBP_DialogueBox` | UMG Widget | `Content/WX_UI/Battle/` | [ ] |
| `DT_Dialogues`（第一章全部节点） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `DT_Levels`（Ch1 L1-L3完整数据） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `L_StoryMode_Ch1_L1` | Level | `Content/WX_Maps/` | [ ] |
| `L_StoryMode_Ch1_L2` | Level | `Content/WX_Maps/` | [ ] |
| `L_StoryMode_Ch1_L3` | Level | `Content/WX_Maps/` | [ ] |
| `LS_Ch1_Intro`（占位过场） | Level Sequence | `Content/WX_Art/Cinematics/` | [ ] |
| `L_Test_Dialogue` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. 对话系统（DialogueManager）
- [ ] `BP_DialogueManager::StartDialogue(StartNodeID)`：从 DT_Dialogues 读取起始节点
- [ ] 驱动 `WBP_DialogueBox`：显示 SpeakerName + DialogueText + 立绘
- [ ] 「下一句」按钮或点击屏幕 → 读取 NextNodeID → 继续播放
- [ ] `AutoAdvance=true` 时启动计时器自动前进
- [ ] 对话结束（NextNodeID 为空）→ 广播 `OnDialogueFinished()`
- [ ] 角色动作：对话时触发对应 AnimMontage（通过 AnimTag 查找）

### 2. 故事流程控制（StoryFlowController）
- [ ] 管理第一章关卡序列：`Level_Ch1_L1 → L2 → L3`
- [ ] 关卡流程：
  ```
  加载关卡 → 播放战前对话（PreBattleDialogueID）
           → 开始战斗（启动 GameMode::InitBattle）
           → 战斗结束（胜利）→ 播放战后对话（PostBattleDialogueID）
           → 发放奖励（碎片 + 卡牌）→ 更新 SaveGame 通关记录
           → 解锁下一关（或进入通关庆祝流程）
  ```
- [ ] 失败处理：战斗失败 → 弹出「再战」/「返回主菜单」选项

### 3. 关卡过场（CinematicTrigger）
- [ ] `BP_CinematicTrigger`：在关卡 BeginPlay 或特定触发器激活时，播放 Level Sequence
- [ ] `LS_Ch1_Intro`：占位版本——镜头移动 + 文字淡入字幕（无需复杂角色动画）
- [ ] 过场结束 → 触发 `OnCinematicFinished()` → DialogueManager 开始对话

### 4. 对话UI（WBP_DialogueBox）
- [ ] 底部对话框：角色立绘（左/右）+ 说话人名 + 对话文本（逐字播放动画）
- [ ] 对话框不遮挡战斗场景（透明度80%半透明背景）
- [ ] 支持「战前对话」（黑屏上显示）和「战中提示对话」（半透明叠加战斗场景）

### 5. DataTable 填写
- [ ] `DT_Dialogues`：按 narrative 提供的 CH1_SCRIPT.md 填写全部对话节点（估算约 30-50 节点）
- [ ] `DT_Levels`：填写 Ch1 L1-L3 完整数据（场景/敌人牌组/对话ID/奖励）

### 6. 三关关卡搭建
- [ ] `L_StoryMode_Ch1_L1`（浑沌初开）：场景 L_Battle_KunlunXu，放置 StoryFlowController，配置关卡数据
- [ ] `L_StoryMode_Ch1_L2`（女娲补天）：同场景，不同敌人牌组和对话
- [ ] `L_StoryMode_Ch1_L3`（神话终章）：略增难度，Boss级AI牌组

### 7. 测试地图
- [ ] `L_Test_Dialogue`：单独测试对话系统（放置 DialogueManager，PIE中播放完整对话序列，验证节点跳转/AutoAdvance/对话结束事件）

---

## 协作接口

| 依赖方 | 接口 | 备注 |
|--------|------|------|
| `narrative` | `docs/narrative/CH1_SCRIPT.md` | 对话节点原稿，engineer 按此填写 DT_Dialogues |
| `narrative` | `docs/narrative/CULTURE_STORIES.md` | 20张卡牌文化故事文本，填入 DT_Cards.FlavorText |
| `art_director` | 角色立绘纹理（T_Portrait_*） | WBP_DialogueBox 需要立绘资产 |
| `tech_artist` | `LS_Ch1_Intro` 过场动画配置 | engineer 搭框架，tech_artist 填充镜头 |

---

## 验收标准

- [ ] 故事模式从主菜单可进入，关卡按序解锁
- [ ] 战前对话完整播放（逐字动画），点击可前进
- [ ] 战斗胜利后战后对话播放，奖励正确发放
- [ ] 三关均可通关，通关后保存进度
- [ ] 失败后「再战」功能正常
- [ ] 文化故事在 WBP_CardDetail 中可查阅（FlavorText 不为空）
- [ ] Output Log 零 Warning / 零 Error
- [ ] `L_Test_Dialogue` 对话系统单独可验证

---

## Demo 录制说明

录制 GIF（时长 ≤ 30秒）：从主菜单进入故事模式 → 战前对话 → 一局对战 → 胜利对话 → 奖励发放。  
放置于：`docs/engineering/MILESTONES/M6/demo/`

---

*版本：v0.1 | 2026-04-30*
