# M5_progression.md — Milestone 5：升阶系统 + 存档

**目标**：文脉碎片收集 + 卡牌升阶（凡品→珍品→极品）+ SaveGame 持久化  
**阶段对应**：ROADMAP Sprint 2-3 / 2-5  
**版本**：v0.1 | 维护人：engineer  
**前置依赖**：M4_bond_resonance 验收通过  

---

## 交付物清单

| 资产 | 类型 | 路径 | 状态 |
|------|------|------|------|
| `BP_FragmentManager` | Blueprint Actor | `Content/WX_Core/Progression/` | [ ] |
| `BP_CardUpgradeManager` | Blueprint Actor | `Content/WX_Core/Progression/` | [ ] |
| `WX_SaveGame` | C++ USaveGame子类 | `Source/WuXia3DCard/Serialization/` | [ ] |
| `WBP_UpgradePanel` | UMG Widget | `Content/WX_UI/Popup/` | [ ] |
| `WBP_CollectionView` | UMG Widget（卡牌收藏界面） | `Content/WX_UI/Menus/` | [ ] |
| `DT_Cards`（填写UpgradeCost字段） | DataTable 更新 | `Content/WX_Data/DataTables/` | [ ] |
| `L_Test_Save` | 测试地图 | `Content/WX_Maps/` | [ ] |

---

## 任务明细

### 1. 文脉碎片管理（FragmentManager）
- [ ] 持有 `FragmentCount`（int32），初始值从 SaveGame 读取
- [ ] `AddFragments(Count)`：增加碎片，写入 SaveGame，广播 `OnFragmentChanged(NewCount)`
- [ ] `SpendFragments(Count)` → `bool`：检查并扣减碎片
- [ ] 对局胜利时：调用 `AddFragments(DT_Levels 中 RewardFragmentCount)`

### 2. 卡牌升阶（CardUpgradeManager）
- [ ] `CanUpgrade(CardID)` → `bool`：读取当前品级 + DT_Cards 升阶费用，对比碎片余量
- [ ] `UpgradeCard(CardID)`：
  - 调用 `FragmentManager::SpendFragments(cost)`
  - 更新该卡牌的运行时 Grade（存入 SaveGame）
  - Lv1→Lv2：切换 Mesh 到 Mesh_Lv2，解锁 SkillID_Lv2
  - 广播 `OnCardUpgraded(CardID, NewGrade)`
- [ ] 属性提升：每级 ATK/DEF/HP 提升 ≤5%（精确倍率存 DT_Cards 中，此处读取应用）

### 3. SaveGame（C++ USaveGame子类）
- [ ] `WX_SaveGame`（C++）：字段：
  - `OwnedCards : TMap<FName, FWX_SavedCard>`（CardID → 品级/解锁状态）
  - `FragmentCount : int32`
  - `CompletedLevels : TArray<FName>`（已通关关卡ID）
  - `UnlockedStories : TArray<FName>`（已解锁文化故事ID）
- [ ] `WX_SaveGame::SaveToSlot()` / `LoadFromSlot()`：封装 UGameplayStatics::SaveGame/LoadGame
- [ ] **禁止裸字符串拼接**，字段全部用 UPROPERTY 序列化
- [ ] 存档槽名常量：`WX_SAVE_SLOT = "WuxiaCardSave_v1"`

### 4. 升阶 UI
- [ ] `WBP_UpgradePanel`：展示选中卡牌当前品级、升阶所需碎片数、当前碎片余量、升阶预览（Mesh切换预览）
- [ ] 「升阶」按钮绑定 `BP_CardUpgradeManager::UpgradeCard()`；碎片不足时按钮变灰
- [ ] 升阶成功后显示简单庆祝动画（WBP层面：星星粒子UI Widget Animation）

### 5. 卡牌收藏界面
- [ ] `WBP_CollectionView`：网格展示所有已拥有卡牌；点击卡牌打开 `WBP_CardDetail` + 升阶入口
- [ ] 从 SaveGame 读取拥有状态，未拥有卡牌显示为剪影（灰色遮罩）

### 6. 测试地图
- [ ] `L_Test_Save`：
  - 模拟赢得一局 → 获得碎片 → 升阶盘古 → 退出PIE → 重新进入 → 验证碎片/品级已持久化
  - Output Log 打印存档读写日志

---

## 验收标准

- [ ] 对局胜利后碎片数量正确增加
- [ ] 碎片足够时可升阶，不足时按钮禁用
- [ ] 升阶后 3D 模型切换至 Lv2 版本（占位模型可接受）
- [ ] Lv2 解锁专属技能（WBP_CardDetail 技能栏显示新技能）
- [ ] 退出游戏重进后存档数据正确恢复（碎片/品级/通关记录）
- [ ] SaveGame 无裸字符串拼接，序列化字段全部通过 UPROPERTY
- [ ] Output Log 零 Warning / 零 Error
- [ ] `L_Test_Save` 可一键复现存档读写验证

---

## Demo 录制说明

录制截图序列（3张）：
1. 对局胜利，碎片增加
2. 升阶成功，Mesh切换
3. 重进游戏后数据保留

放置于：`docs/engineering/MILESTONES/M5/demo/`

---

*版本：v0.1 | 2026-04-30*
