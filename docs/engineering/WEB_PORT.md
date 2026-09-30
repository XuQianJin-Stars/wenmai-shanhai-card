# 网页版实现说明（UE5 → three.js）

本目录其余文档按 UE5 方案编写。可玩版本改用 three.js + Vite 在浏览器中实现；玩法、数值、卡表和剧情仍以 `docs/design`、`docs/narrative` 为准。对应关系如下。

| UE5 方案 | 网页实现 |
|---|---|
| `DT_Cards` / `DT_Levels` / `DT_Dialogues` | `src/data/cards.js`、`src/data/story.js` |
| `BattleSystem` / `BondSystem` / `ResonanceSystem` | `src/rules/engine.js`（纯数据，事件驱动） |
| `AISystem` | `src/rules/ai.js` |
| `BP_TurnManager`（30 秒回合计时） | `src/game/battle.js`（「一炷香」计时，可在设置中关闭） |
| `M_Card_Master`、燃烧溶解材质 | `src/render/cardMesh.js`（Canvas 卡面 + `onBeforeCompile` 燃烧溶解） |
| 水墨后期（`ink_wash_postprocess.md`） | `src/render/app.js` 全屏着色器 |
| Niagara 特效库 | `src/render/fx.js`（泼墨、冲击环、五行法阵、雷电、光柱、火花、飘字） |
| 场景（昆仑墟 / 古戏台 / 书斋 / 长安城 + 稷下学宫 / 云梦泽 / 未央宫 / 兰亭 / 莫高窟 / 江南 / 观星台 / 泉州港 / 藏书楼） | `src/render/scenes.js` |
| MetaSounds / 音频规范 | `src/audio/`（WebAudio 实时合成） |
| `WBP_*` UMG 界面 | `src/game/ui.js`、`src/game/boot.js`、`src/ui/game.css` |
| SaveGame | `src/game/save.js`（localStorage，读档时逐项校验） |

## 与文档的差异

- 「守场」按关键词【守护】实现：未被眩晕的守护灵将必须先被击破，否则可以直接攻击主将。最初实现为「任意灵将都阻挡攻击主将」，模拟对局中 120 局里有 105 局以牌库耗尽告终，因此改成现在的规则。守护卡为女娲、铁拐李、门神，以及浊灵 ZL-004、ZL-005。
- 美术全部程序化生成：卡面立绘为 Canvas 2D 水墨笔触，不使用概念图素材。
- 自由对战的十套对手卡组按 `npm run soak` 的结果做了微调，各卡组互相对局的胜率大致落在 32%–61%（p-chu 偏弱，作为轻松局保留）。第一章首领关用初始卡组的胜率约 32%；带上前两关的解锁卡并升阶两张后约 82%。
- 第二章「唐宋古风篇」为可玩版本新增内容。LORE_BIBLE §2.2 只给出长安城的场景设定，因此卡牌效果、浊灵（ZL-007～012）、首领被动「曲终」和剧情对白都是本作原创；卡面引文只用能确认原文的诗文典籍（杜甫、苏轼、韩愈、白居易、孟郊、李白、沈括、陆羽），并逐条注明出处。难度按 `npm run soak` 调整：用自动编入前面所有解锁卡、并升阶三张的卡组，三关胜率约为 92% / 73% / 49%。
- v1.2 将故事模式由 3 章扩为 10 章，v1.3 再增两章至十二章（设定见 LORE_BIBLE §2.5）。为了不让每新增一章就多出五处 switch 分支，第 4–10 章的卡牌效果改为声明式：`src/rules/cardfx.js` 用一张表描述每张卡在 summon / skill / turn / onHit 等时机做什么，引擎在 `ctxFor()` 里准备好一组原语后调用；第 1–3 章仍保留原有的显式分支（测试锁定了它们的行为）。首领被动、按"场上 N 张成员"生效的章节羁绊、场景与卡面也都改成了数据驱动（`PASSIVES`、`BONDS[*].auto`、`scenesLate.js`、`cardArtLate.js`）。
- 难度以 `npm run soak` 校准，模拟时会按玩家实际进度重建牌组：前面各关的解锁卡按游戏内规则自动编入，并把那些关卡发放的碎片花在升阶上（珍品会解锁主动技能，是后期战力的大头；早期版本没模拟这一点，导致第 4 章之后的胜率被严重低估）。当前十二章三十六关的参考胜率大致为每章 85% / 70% / 50%。
- `insertCard()`（自动编入新解锁卡）改为替换**费用最接近**的同类卡，而不是最便宜的那张。按旧规则连开七章之后，20 张牌里会堆出十一张 5 费灵将，曲线彻底塌掉。
- 卡牌专属特效放在 `src/game/cardvfx.js`：一张 `卡牌 id → { summon / skill / play }` 的表，每条是若干「图层」（形状 + 颜色 + 位置锚点）。战斗视图在播放 summon / skill / play 事件时按 id 查表，所以加特效不需要动规则层，也不会多出事件类型；没有配置的卡仍走通用的召唤光环与技能光柱。规则层在结算中途需要的特效（如焚天符的群体灼烧）仍由引擎发 `fx` 事件。
- 为此在 `src/render/fx.js` 增加了 petals / ribbon / beam / rain / orbit / dome / shards 七个图元。绸带与护罩用 ShaderMaterial：绸带沿弧长淡出以模拟笔锋收尾，护罩用 rim 项让壳体只在轮廓发亮（早期版本用线框球和双面实体，都太像科幻 UI，与水墨不搭）。
