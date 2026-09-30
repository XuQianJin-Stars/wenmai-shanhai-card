# M1_skeleton.md — Milestone 1：工程骨架

**目标**：工程骨架跑通——空关卡可启动 + 主菜单可跳转 + BattleHUD 可显示  
**阶段对应**：ROADMAP Sprint 1-1 / 1-2  
**版本**：v0.1 | 维护人：engineer  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `WX_GameMode` | Blueprint | `Content/WX_Core/GameFramework/` | [ ] |
| `WX_GameState` | Blueprint | `Content/WX_Core/GameFramework/` | [ ] |
| `WX_PlayerController` | Blueprint | `Content/WX_Core/GameFramework/` | [ ] |
| `L_MainMenu` | Level | `Content/WX_Maps/` | [ ] |
| `L_Battle_KunlunXu` | Level（白盒） | `Content/WX_Maps/` | [ ] |
| `WBP_MainMenu` | UMG Widget | `Content/WX_UI/Menus/` | [ ] |
| `WBP_BattleHUD` | UMG Widget（占位） | `Content/WX_UI/Battle/` | [ ] |
| `DT_Cards`（5条测试数据） | DataTable | `Content/WX_Data/DataTables/` | [ ] |
| `L_Test_Skeleton` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. 工程初始化
- [ ] 以 Card Games Template 为基础建立工程
- [ ] 建立 Content/ 目录结构（WX_Core / WX_UI / WX_Art / WX_Data / WX_Maps）
- [ ] 配置 Enhanced Input：鼠标左键选牌、右键取消、Enter/Space 确认
- [ ] 配置 Git LFS（纹理/模型/音频 纳入 LFS 追踪）

### 2. GameFramework 三件套
- [ ] `WX_GameMode`：仅壳，设置默认 PlayerController/GameState
- [ ] `WX_GameState`：暴露 `PlayerHP`、`EnemyHP`、`CurrentMana`、`CurrentTurn` 变量（占位）
- [ ] `WX_PlayerController`：绑定 Enhanced Input Action，空实现

### 3. 主菜单场景
- [ ] `L_MainMenu`：空场景 + `WBP_MainMenu` 添加到 Viewport
- [ ] `WBP_MainMenu`：「故事模式」按钮跳转 `L_Battle_KunlunXu`；「退出」按钮退出游戏

### 4. 战斗HUD占位
- [ ] `WBP_BattleHUD`：显示占位文字（HP / Mana / Turn / Hand Area空区域）
- [ ] 在 `WX_GameMode::BeginPlay` 中添加到 Viewport

### 5. DataTable 骨架
- [ ] 创建 `FWX_CardRow` Struct（按 DATA_TABLES.md 定义字段）
- [ ] 创建 `DT_Cards`，填入 5 条最简测试数据（盘古/女娲/驱邪符/增益符/文脉牌各1）

### 6. 测试地图
- [ ] `L_Test_Skeleton`：空地图中放置 `WX_GameMode`，打印 GameState 变量到 Output Log
- [ ] 验证：PIE 运行无 Warning / 无 Error

---

## 验收标准

- [ ] 工程 PIE 启动不崩溃，Output Log 零 Warning / 零 Error
- [ ] 主菜单界面可显示，「故事模式」按钮可跳转战斗关卡
- [ ] 战斗关卡中 WBP_BattleHUD 可显示（占位文字）
- [ ] `DT_Cards` 可在蓝图中用 GetDataTableRow 读取，输出 CardID 到 Output Log
- [ ] `L_Test_Skeleton` 可一键复现以上验证

---

## Demo 录制说明

完成后录制截图或 GIF，放置于：  
`docs/engineering/MILESTONES/M1/demo/`

截图内容：主菜单界面截图 + Output Log 零错误截图。

---

*版本：v0.1 | 2026-04-30*
