// Boot + screen flow: title → main menu → 故事模式 / 自由对战 / 卡牌图鉴·升阶 / 牌组编成 / 设置.
// URL switches for testing: ?battle=ch1-1|p-stage  &auto=1 (AI plays both sides)  &screen=collection|deck|story|practice
//   &speed=2  &reset=1 (fresh save)  &unlock=1 (all cards, 999 fragments)
import * as THREE from 'three';
import { createApp } from '../render/app.js';
import { buildScene, disposeScene } from '../render/scenes.js';
import { createFx } from '../render/fx.js';
import { CardMesh } from '../render/cardMesh.js';
import { tween, ease, wait } from '../render/tween.js';
import { createAudio } from '../audio/audio.js';
import { createSave, deckProblem } from './save.js';
import { startBattle, battleCamPos, BATTLE_CAM } from './battle.js';
import { h, clear, faceEl, cardInfo, portraitEl, banner, toast, modal, dialogue, setLayer, fade, touch } from './ui.js';
import { canFullscreen, isFullscreen, standalone, requestFullscreen, toggleFullscreen } from './fullscreen.js';
import { CARDS, card, PLAYER_CARD_IDS, TYPE_ZH, GRADE_ZH, EL, BONDS } from '../data/cards.js';
import { LEVELS, CHAPTERS, chapterEnd, SPEAKER_ART, PRACTICE, REWARD_PRACTICE, DECK_SIZE, MAX_COPIES } from '../data/story.js';

const MENU_CAM = { pos: new THREE.Vector3(0, 2.2, 9), look: new THREE.Vector3(0, 3.2, -30) };

export async function boot(params, fontsReady) {
  const load = document.getElementById('load');
  window.__load?.(0.15, '研墨');
  await fontsReady();
  window.__load?.(0.35, '铺纸');
  const app = createApp(document.getElementById('c'));
  const fx = createFx(app);
  const audio = createAudio();
  const save = createSave();
  if (params.get('reset')) save.reset();
  if (params.get('unlock')) { for (const id of PLAYER_CARD_IDS) save.unlock(id); save.data.fragments = 999; save.write(); }
  if (params.get('speed')) save.data.settings.speed = +params.get('speed');
  const applyVol = () => audio.setVolume({ master: save.data.settings.master, music: save.data.settings.music, sfx: save.data.settings.sfx });
  applyVol();

  const root = document.getElementById('ui');
  setLayer(root);
  const screen = h('div.screen');
  const curtain = h('div.curtain');
  root.append(screen, curtain);
  const ctx = { app, fx, audio, save, root, openSettings: () => settingsModal() };
  window.__app = app; window.__save = save;

  // unlock WebAudio on the first gesture anywhere
  const unlock = () => { audio.unlock(); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // ── stage (3D environment) ──
  let stage = null, stageKey = '', viewer = null;
  const tickers = app.onFrame((dt, t) => { for (const f of stage?.userData.tickers ?? []) f(dt, t); viewer?.userData.tick?.(dt, t); });
  void tickers;
  function setStage(kind, variant) {
    const key = `${kind}:${variant ?? ''}`;
    if (key === stageKey) return;
    if (stage) { app.scene.remove(stage); disposeScene(stage); }
    stage = buildScene(kind, variant);
    app.scene.add(stage);
    app.scene.fog = stage.userData.fog ?? null;
    stageKey = key;
  }
  function menuCam() { app.camera.position.copy(MENU_CAM.pos); app.camera.lookAt(MENU_CAM.look); }
  function battleCam() { app.camera.position.copy(battleCamPos(app.camera)); app.camera.lookAt(BATTLE_CAM.look); }
  async function transition(fn) {
    await fade(curtain, true, 380);
    await fn();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await fade(curtain, false, 520);
  }

  // floating 3D card in front of the camera (dialogue cues, collection viewer)
  function showViewer(id, grade = 0, { pos = new THREE.Vector3(0, 0, -3.2), scale = 1, spin = true } = {}) {
    hideViewer();
    const m = new CardMesh(id, grade);
    m.position.copy(pos); m.scale.setScalar(0.01);
    m.setGlow('#ffd88a', 0.8);
    app.camera.add(m);
    viewer = m;
    let drag = null, vy = 0;
    m.userData.tick = (dt, t) => {
      m.tick(dt, t);
      if (spin && !drag) { vy *= 0.95; m.rotation.y = Math.sin(t * 0.6) * 0.35 + vy; }
      m.position.y = pos.y + Math.sin(t * 1.1) * 0.03;
    };
    tween(0.6, (k) => m.scale.setScalar(scale * k), { ease: ease.back });
    return m;
  }
  function hideViewer() {
    if (!viewer) return;
    const m = viewer; viewer = null;
    tween(0.25, (k) => m.scale.multiplyScalar(1 - k * 0.5)).then(() => { app.camera.remove(m); m.dispose(); });
  }

  // ── common chrome ──
  function frame(title, { back = null, extra = null } = {}) {
    clear(screen);
    screen.className = 'screen show';
    const top = h('div.top',
      back ? h('button.btn.back', { text: '‹ 返回', onclick: () => { audio.sfx('back'); back(); } }) : null,
      h('div.top-title', { text: title }),
      h('div.frag', { title: '文脉碎片：用于升阶卡牌' }, h('span.frag-ico'), h('span.frag-n', { text: String(save.data.fragments) })),
      extra);
    const body = h('div.body');
    screen.append(top, body);
    return body;
  }
  const btn = (label, onclick, cls = '') => h('button.btn' + (cls ? '.' + cls : ''), { onclick: (e) => { audio.sfx('click'); onclick(e); }, onpointerenter: () => audio.sfx('hover') }, label);

  // ── title ──
  async function title() {
    setStage('menu'); menuCam();
    audio.music('menu');
    clear(screen);
    screen.className = 'screen show title-screen';
    const start = h('div.press', { text: '— 点击任意处 开卷 —' });
    screen.append(h('div.logo', h('div.logo-main', { text: '文脉' }), h('div.logo-dot', { text: '·' }), h('div.logo-sub', { text: '山海卡' })),
      h('div.tagline', { text: '以卡为笔，以牌为墨 —— 守护那些快被遗忘的名字' }), start,
      h('div.credit', { text: 'three.js · WebAudio 实时合成 · 程序化水墨' }));
    await new Promise((r) => {
      const go = (e) => {
        screen.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go);
        // 手机、平板上浏览器外壳要吃掉不少画面，开卷这一下正好是可以请求全屏的用户手势。
        if (touch() && e.type === 'pointerdown' && !standalone()) requestFullscreen();
        r();
      };
      screen.addEventListener('pointerdown', go); window.addEventListener('keydown', go);
    });
    audio.unlock();
    audio.music('menu');
    audio.sfx('bond');
    return mainMenu();
  }

  function mainMenu() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    clear(screen);
    screen.className = 'screen show menu-screen';
    const cur = CHAPTERS.filter(chapterOpen).at(-1);
    const done = cur.levels.filter((L) => save.isDone(L.id)).length;
    const items = [
      ['故事模式', `${cur.title.split(' · ')[1]} · ${done}/${cur.levels.length}`, () => storyMap()],
      ['自由对战', `${PRACTICE.length} 处场景 · 三档难度`, () => practice()],
      ['卡牌图鉴', `已得 ${save.data.owned.length}/${PLAYER_CARD_IDS.length} · 升阶`, () => collection()],
      ['牌组编成', `${save.data.deck.length}/${DECK_SIZE} 张`, () => deckBuilder()],
      ['设　　置', '音量 · 速度 · 计时', () => settingsModal()],
      ['帮　　助', '玩法 · 操作 · 屏幕', () => helpModal()],
    ];
    screen.append(
      h('div.logo.small', h('div.logo-main', { text: '文脉' }), h('div.logo-dot', { text: '·' }), h('div.logo-sub', { text: '山海卡' })),
      h('div.menu', items.map(([t, sub, fn], i) => h('button.menu-item', { style: { animationDelay: `${i * 70}ms` }, onpointerenter: () => audio.sfx('hover'), onclick: () => { audio.sfx('click'); fn(); } },
        h('span.menu-t', { text: t }), h('span.menu-s', { text: sub })))),
      h('div.frag.corner', { title: '文脉碎片' }, h('span.frag-ico'), h('span.frag-n', { text: String(save.data.fragments) })),
      h('div.stats', { text: `战绩 ${save.data.stats.wins} 胜 ${save.data.stats.losses} 负` }),
    );
  }

  // ── story ──
  const chapterOpen = (C) => C.n === 1 || save.isDone(CHAPTERS[C.n - 2].levels.at(-1).id);
  const seenOf = (C) => save.sawPrologue(C.n);
  const chapterOf = (L) => CHAPTERS.find((C) => C.levels.some((x) => x.id === L.id)) ?? CHAPTERS[0];
  let storyTab = null;
  function storyMap(n = storyTab) {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    const openChs = CHAPTERS.filter(chapterOpen);
    const C = CHAPTERS.find((x) => x.n === n && chapterOpen(x)) ?? openChs.at(-1);
    storyTab = C.n;
    const tabs = h('div.tabs.ch-tabs', CHAPTERS.map((x) => h('button.tab' + (x === C ? '.on' : '') + (chapterOpen(x) ? '' : '.locked'), {
      text: x.num, title: x.title,
      onclick: () => { if (!chapterOpen(x)) { audio.sfx('error'); toast(`通关「${CHAPTERS[x.n - 2].short}」后开启`); return; } audio.sfx('click'); storyMap(x.n); } })));
    const body = frame(`故事模式 · ${C.title}`, { back: mainMenu, extra: tabs });
    const list = h('div.levels');
    const seen = seenOf(C);
    list.append(h('div.level' + (seen ? '.done' : ''), { onclick: () => { audio.sfx('click'); runPrologue(true, C); } },
      h('div.level-no', { text: '序' }), h('div.level-main', h('div.level-t', { text: C.prologue.title }), h('div.level-d', { text: C.desc }))));
    C.levels.forEach((L, k) => {
      const i = LEVELS.findIndex((x) => x.id === L.id);
      const open = save.levelOpen(i) && seen, done = save.isDone(L.id);
      list.append(h('div.level' + (open ? '' : '.locked') + (done ? '.done' : ''), { onclick: () => { if (!open) { audio.sfx('error'); toast(seen ? '先完成上一关' : '先观看序章'); return; } audio.sfx('click'); runLevel(L); } },
        h('div.level-no', { text: ['一', '二', '三', '四', '五'][k] }),
        h('div.level-main', h('div.level-t', { text: L.title }), h('div.level-d', { text: L.desc }),
          h('div.level-r', { text: `首通奖励：碎片 ×${L.reward.fragments}${L.reward.unlock.length ? ' · 解锁 ' + L.reward.unlock.map((id) => card(id).name).join('、') : ''}` })),
        done ? h('div.level-seal', { text: '已通' }) : null,
        portraitEl(L.enemy.portrait, 84, i + 3)));
    });
    const next = CHAPTERS.find((x) => x.n === C.n + 1);
    if (next && !chapterOpen(next)) list.append(h('div.level.locked', h('div.level-no', { text: '续' }), h('div.level-main', h('div.level-t', { text: next.title }), h('div.level-d', { text: `通关「${C.levels.at(-1).title.split(' · ')[1]}」后开启` })),
      portraitEl(next.levels.at(-1).enemy.portrait, 84, next.n + 40)));
    if (!next) list.append(h('div.level.locked', h('div.level-no', { text: '续' }), h('div.level-main', h('div.level-t', { text: '文脉未完' }), h('div.level-d', { text: '更多篇章，筹备之中' }))));
    body.append(list);
  }

  const portraits = Object.fromEntries(Object.entries(SPEAKER_ART).map(([who, motif], k) => [who, () => portraitEl(motif, 96, 7 + k)]));
  function stageCue(cue) {
    if (cue === 'glow') { fx.burst(app.camera.localToWorld(new THREE.Vector3(0, 0, -4)), { color: '#ffd88a', size: 5, life: 1.4 }); audio.sfx('resonance', { el: 'metal' }); }
    else if (cue === 'mirror') { app.post.uniforms.flashColor.value.set(0xd0e8ff); tween(0.9, (k) => { app.post.uniforms.flash.value = 0.5 * (1 - k); }); audio.sfx('mist'); }
    else if (cue.startsWith('card:')) { showViewer(cue.slice(5), 0, { pos: new THREE.Vector3(0, 0.25, -3.4), scale: 0.95 }); audio.sfx('bond'); }
    else if (cue === 'sky') { app.post.uniforms.flashColor.value.set(0xffe6a0); tween(1.4, (k) => { app.post.uniforms.flash.value = 0.7 * (1 - k); }); audio.sfx('victory'); }
    else if (cue === 'end') {
      hideViewer();
      const e = chapterEnd(curChapter);
      banner(e.title, e.sub, { cls: 'title', ms: 2600 });
    }
  }
  async function talk(lines) {
    screen.className = 'screen';
    await dialogue(lines, { onStage: stageCue, sfx: () => audio.sfx('dialog'), portraits });
    hideViewer();
  }
  let curChapter = 1;
  async function runPrologue(thenMap, C = CHAPTERS[0]) {
    curChapter = C.n;
    await transition(async () => { clear(screen); screen.className = 'screen'; setStage('study'); battleCam(); app.camera.position.set(0, 4.2, 9.5); app.camera.lookAt(0, 3, -6); });
    audio.music('study');
    await banner(C.prologue.title, '', { cls: 'title', ms: 1600 });
    await talk(C.prologue.lines);
    save.markPrologue(C.n);
    save.write();
    if (thenMap) await transition(async () => storyMap(C.n));
  }

  function battleCfg(L, extra = {}) {
    return { title: L.title, enemy: L.enemy, ai: L.ai, playerFirst: L.playerFirst !== false, tutorial: !!L.tutorial, playerDeck: L.playerDeck, ordered: !!L.ordered,
      autoplay: params.get('auto') === '1', ...extra };
  }
  async function fight(L, cfg) {
    await transition(async () => { clear(screen); screen.className = 'screen'; setStage(L.scene, L.variant); battleCam(); });
    audio.music(L.music ?? L.scene);
    const res = await startBattle(ctx, cfg);
    save.data.stats.games++;
    if (res.won) save.data.stats.wins++; else save.data.stats.losses++;
    save.write();
    return res;
  }
  async function runLevel(L) {
    const C = chapterOf(L);
    curChapter = C.n;
    if (!seenOf(C)) await runPrologue(false, C);
    await transition(async () => { clear(screen); screen.className = 'screen'; setStage(L.scene, L.variant); app.camera.position.set(0, 3.6, 10.5); app.camera.lookAt(0, 1.2, -4); });
    audio.music('story');
    await banner(L.title, L.desc, { cls: 'title', ms: 2000 });
    await talk(L.pre);
    for (;;) {
      const res = await fight(L, battleCfg(L));
      const first = res.won && !save.isDone(L.id);
      const reward = { fragments: res.won ? (first ? L.reward.fragments : REWARD_PRACTICE.win) : REWARD_PRACTICE.loss, unlock: [] };
      if (first) {
        for (const id of L.reward.unlock) if (save.unlock(id)) { reward.unlock.push(id); const out = save.autoInsert(id); if (out) (reward.swapped ??= []).push([id, out]); }
        save.complete(L.id);
      }
      save.data.fragments += reward.fragments;
      save.write();
      const next = await resultScreen(res, reward, { retry: !res.won });
      if (next === 'retry') continue;
      if (res.won) {
        audio.music('story');
        await transition(async () => { clear(screen); screen.className = 'screen'; app.camera.position.set(0, 3.6, 10.5); app.camera.lookAt(0, 1.2, -4); });
        await talk(L.post);
      }
      break;
    }
    await transition(async () => storyMap(chapterOf(L).n));
  }

  async function resultScreen(res, reward, { retry = false } = {}) {
    audio.music(res.won ? 'victory' : 'defeat');
    clear(screen);
    screen.className = 'screen show result-screen';
    return new Promise((resolve) => {
      const unlocks = reward.unlock.map((id) => h('div.unlock', faceEl(id, 0, { w: 150 }), h('div', { text: `解锁「${card(id).name}」` })));
      screen.append(h('div.result' + (res.won ? '.win' : '.lose'),
        h('div.result-big', { text: res.won ? '胜' : '败' }),
        h('div.result-sub', { text: res.forfeited ? '认输离场' : res.won ? `历经 ${res.turns} 回合，文脉得续。` : res.reason === 'deck' ? '牌库耗尽，功亏一篑。' : '文脉黯淡……再整旗鼓。' }),
        h('div.result-reward', h('span.frag-ico'), h('span', { text: `文脉碎片 +${reward.fragments}` }), h('span.dim', { text: `（共 ${save.data.fragments}）` })),
        unlocks.length ? h('div.unlocks', unlocks) : null,
        unlocks.length ? h('div.dim', { text: reward.swapped?.length
          ? `已自动编入牌组：${reward.swapped.map(([a, b]) => `「${card(a).name}」替换「${card(b).name}」`).join('，')}。可在「牌组编成」中调整。`
          : '新卡牌已加入图鉴，可在「牌组编成」中使用。' }) : null,
        h('div.result-btns',
          retry ? btn('再战一局', () => resolve('retry'), 'primary') : null,
          btn(res.won ? '继续' : '返回', () => resolve('next'), retry ? '' : 'primary'))));
      if (unlocks.length) audio.sfx('upgrade', { delay: 0.6 });
    });
  }

  // ── practice ──
  function practice() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    const body = frame('自由对战', { back: mainMenu });
    let level = 'normal';
    const diff = h('div.seg', [['easy', '入门'], ['normal', '寻常'], ['hard', '宗师']].map(([k, t]) => h('button' + (k === level ? '.on' : ''), { text: t, onclick: (e) => { audio.sfx('click'); level = k; diff.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); } })));
    const prob = deckProblem(save.data.deck);
    if (prob) body.append(h('div.warn', { text: `当前牌组不可用：${prob}` }));
    body.append(h('div.row', h('span', { text: '难度：' }), diff, h('span.dim', { text: `胜利 +${REWARD_PRACTICE.win} 碎片 · 失败 +${REWARD_PRACTICE.loss}` })),
      h('div.opps', PRACTICE.map((P, i) => h('div.opp', { onclick: async () => {
        if (prob) { audio.sfx('error'); toast('请先在「牌组编成」中组好 20 张牌'); return; }
        audio.sfx('click');
        const L = { ...P, ai: level, playerFirst: Math.random() < 0.5 };
        for (;;) {
          const res = await fight(L, battleCfg(L, { title: P.title }));
          const reward = { fragments: res.forfeited ? 0 : res.won ? REWARD_PRACTICE.win : REWARD_PRACTICE.loss, unlock: [] };
          save.data.fragments += reward.fragments; save.write();
          const nx = await resultScreen(res, reward, { retry: true });
          if (nx !== 'retry') break;
        }
        await transition(async () => practice());
      } }, portraitEl(P.enemy.portrait, 140, i + 11), h('div.opp-t', { text: P.title }), h('div.opp-d', { text: `对手：${P.enemy.name}` })))));
  }

  // ── collection / upgrade ──
  function collection(sel = null) {
    setStage('menu'); menuCam();
    audio.music('menu');
    const body = frame('卡牌图鉴 · 升阶', { back: () => { hideViewer(); mainMenu(); } });
    const all = [...PLAYER_CARD_IDS, ...Object.keys(CARDS).filter((id) => CARDS[id].zhuo)];
    let filter = 'all';
    const grid = h('div.grid');
    const side = h('div.side');
    const tabs = h('div.seg', [['all', '全部'], ['general', '灵将'], ['talisman', '符箓'], ['wenmai', '文脉'], ['zhuo', '浊灵']].map(([k, t]) =>
      h('button' + (k === filter ? '.on' : ''), { text: t, onclick: (e) => { audio.sfx('click'); filter = k; tabs.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); draw(); } })));
    function draw() {
      clear(grid);
      for (const id of all) {
        const d = CARDS[id];
        if (filter === 'zhuo' ? !d.zhuo : filter !== 'all' && (d.zhuo || d.type !== filter)) continue;
        const owned = d.zhuo || save.owns(id), g = save.grade(id);
        const cell = h('div.cell' + (owned ? '' : '.locked') + (sel === id ? '.sel' : ''), { onclick: () => { audio.sfx('pick'); sel = id; draw(); pickCard(id); } },
          faceEl(id, owned ? g : 0, { w: 118 }),
          !owned ? h('div.lock', { text: '未解锁' }) : g ? h('div.grade-tag.g' + g, { text: GRADE_ZH[g] }) : null,
          owned && !d.zhuo && save.canUpgrade(id) ? h('div.up-dot', { title: '可升阶' }) : null);
        grid.append(cell);
      }
    }
    function pickCard(id) {
      clear(side);
      const d = CARDS[id], owned = d.zhuo || save.owns(id), g = save.grade(id);
      showViewer(id, owned ? g : 0, { pos: new THREE.Vector3(0.3, 0.02, -3.2), scale: 0.78 });
      side.append(cardInfo(id, owned ? g : 0));
      if (d.lore) side.append(h('div.lore', h('b', { text: '典故　' }), d.lore));
      if (!owned) side.append(h('div.warn', { text: '尚未解锁：通关故事关卡获得。' }));
      else if (!d.zhuo) {
        const cost = save.upgradeCost(id);
        if (cost == null) side.append(h('div.maxed', { text: '已臻极品' }));
        else side.append(h('div.upgrade', h('div', { text: `升阶至「${GRADE_ZH[g + 1]}」：消耗 ${cost} 文脉碎片（全属性提升${d.skill && g === 0 ? '，解锁主动技能' : d.up && g === 0 ? '，解锁珍品效果' : ''}）` }),
          btn(`升阶 · ${cost} 碎片`, async () => {
            if (!save.upgrade(id)) { audio.sfx('error'); toast(`碎片不足（需要 ${cost}）`); return; }
            audio.sfx('upgrade');
            fx.burst(app.camera.localToWorld(new THREE.Vector3(0.3, 0.02, -3.2)), { color: '#ffd88a', size: 4, life: 1 });
            await banner('升阶成功', `${d.name} · ${GRADE_ZH[save.grade(id)]}`, { cls: 'res', ms: 1300 });
            collection(id);
          }, save.canUpgrade(id) ? 'primary' : 'disabled')));
      }
    }
    body.append(h('div.coll', h('div.coll-left', tabs, grid), side));
    draw();
    pickCard(sel ?? all[0]);
    if (!sel) sel = all[0];
  }

  // ── deck builder ──
  function deckBuilder() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    let deck = [...save.data.deck];
    const body = frame('牌组编成', { back: () => leave() });
    const pool = h('div.pool'), list = h('div.decklist'), head = h('div.deck-head'), infoBox = h('div.deck-info');
    const count = (id) => deck.filter((x) => x === id).length;
    async function leave() {
      const prob = deckProblem(deck);
      if (JSON.stringify(deck) !== JSON.stringify(save.data.deck)) {
        if (prob) { const ok = await modal('牌组未完成', `${prob}。离开将放弃本次修改。`, [{ label: '放弃修改', value: true }, { label: '继续编辑', value: false, primary: true }]); if (!ok) return; }
        else save.setDeck(deck);
      }
      mainMenu();
    }
    function draw() {
      clear(pool); clear(list); clear(head);
      const prob = deckProblem(deck);
      const types = { general: 0, talisman: 0, wenmai: 0 };
      deck.forEach((id) => types[card(id).type]++);
      const curve = Array(8).fill(0); deck.forEach((id) => curve[Math.min(7, card(id).cost)]++);
      head.append(h('div.deck-n' + (prob ? '.bad' : ''), { text: `${deck.length} / ${DECK_SIZE}` }),
        h('div.dim', { text: `灵将 ${types.general} · 符箓 ${types.talisman} · 文脉 ${types.wenmai}` }),
        h('div.curve', curve.map((n, c) => h('div.bar', { title: `${c}${c === 7 ? '+' : ''} 费：${n} 张` }, h('i', { style: { height: `${Math.min(64, n * 7)}px` } }), h('span', { text: c === 7 ? '7+' : c })))),
        prob ? h('div.warn', { text: prob }) : h('div.ok', { text: '牌组可用 ✓' }));
      for (const id of save.data.owned.slice().sort((a, b) => card(a).cost - card(b).cost || a.localeCompare(b))) {
        const n = count(id);
        pool.append(h('div.cell' + (n >= MAX_COPIES ? '.full' : ''), {
          onclick: () => { if (deck.length >= DECK_SIZE) { audio.sfx('error'); toast('牌组已满 20 张'); return; } if (n >= MAX_COPIES) { audio.sfx('error'); toast(`同名卡最多 ${MAX_COPIES} 张`); return; } audio.sfx('pick'); deck.push(id); draw(); },
          onpointerenter: () => { clear(infoBox); infoBox.append(cardInfo(id, save.grade(id))); },
        }, faceEl(id, save.grade(id), { w: 104 }), h('div.cnt', { text: `${n}/${MAX_COPIES}` })));
      }
      const uniq = [...new Set(deck)].sort((a, b) => card(a).cost - card(b).cost || a.localeCompare(b));
      for (const id of uniq) {
        const d = card(id);
        list.append(h('div.deck-row.t-' + d.type, { onclick: () => { audio.sfx('back'); deck.splice(deck.lastIndexOf(id), 1); draw(); },
          onpointerenter: () => { clear(infoBox); infoBox.append(cardInfo(id, save.grade(id))); } },
          h('span.cost', { text: d.cost }), h('span.nm', { text: d.name }), h('span.el', { style: { color: EL[d.el]?.color }, text: EL[d.el]?.zh ?? '' }), h('span.x', { text: `×${count(id)}` })));
      }
    }
    body.append(h('div.deckb', h('div.deck-pool', h('div.hint2', { text: '点击卡牌加入牌组 · 点击右侧条目移除 · 每张同名卡最多 2 张' }), pool),
      h('div.deck-side', head, list, h('div.deck-btns',
        btn('保存牌组', () => { const p = deckProblem(deck); if (p) { audio.sfx('error'); toast(p); return; } save.setDeck(deck); toast('牌组已保存'); }, 'primary'),
        btn('清空', () => { deck = []; draw(); }),
        btn('自动补全', () => {
          const owned = save.data.owned.slice().sort(() => Math.random() - 0.5);
          const want = { general: 10, talisman: 6, wenmai: 4 };
          for (const t of ['general', 'talisman', 'wenmai']) for (const id of owned) {
            while (deck.length < DECK_SIZE && card(id).type === t && count(id) < MAX_COPIES && deck.filter((x) => card(x).type === t).length < want[t]) deck.push(id);
          }
          for (const id of owned) while (deck.length < DECK_SIZE && count(id) < MAX_COPIES) deck.push(id);
          draw();
        })), infoBox)));
    draw();
  }

  // ── help ──
  const bullets = (...items) => h('ul.help-list', items.map((t) => h('li', { text: t })));

  /** 「全屏」开关。只在真的能全屏时出现——否则全屏这件事属于帮助，不属于设置。 */
  function fullscreenButton() {
    const b = h('button.btn.small', { text: isFullscreen() ? '退出全屏' : '进入全屏', onclick: async () => {
      await toggleFullscreen();
      b.textContent = isFullscreen() ? '退出全屏' : '进入全屏';
    } });
    return b;
  }

  function screenPane() {
    const step = (n, text) => h('li', h('i', { text: String(n) }), text);
    const pane = h('div.help-pane',
      bullets(
        '牌桌是横向构图，请横屏游玩；竖屏时卡面会小到读不了字。',
        '画面按视口宽高比自动取景，窗口是什么比例都能玩。',
      ));
    if (standalone()) {
      pane.append(h('p.dim.small', { text: '当前已从主屏幕图标以独立窗口运行，这就是全屏。' }));
      return pane;
    }
    if (canFullscreen()) {
      pane.append(h('div.set-row', h('span', { text: '全屏' }), fullscreenButton()),
        h('p.dim.small', { text: '触屏设备在标题页「开卷」时也会自动请求全屏。' }));
      return pane;
    }
    // iPhone 的 Safari（以及微信等内置浏览器）没有全屏 API，只能走主屏幕图标。
    pane.append(
      h('p', { text: 'iPhone 的 Safari 不支持网页全屏，地址栏和标签栏收不起来。把游戏存成主屏幕图标，从图标启动就是真全屏了：' }),
      h('ol.steps',
        step(1, '点屏幕下方（横屏时在右上角）的「分享」按钮'),
        step(2, '在列表里下滑，选「添加到主屏幕」'),
        step(3, '回主屏幕，从「文脉·山海卡」图标启动'),
      ),
      h('p.dim.small', { text: '若是从微信、抖音等 App 里打开的，先点右上角「···」→「在 Safari 中打开」。' }),
      h('p.dim.small', { text: 'iPad 与电脑支持网页全屏，那里这一栏会是个开关。' }),
    );
    return pane;
  }

  function helpModal() {
    const panes = {
      玩法: () => h('div.help-pane', bullets(
        '双方主将各 20 点气血，先把对方主将打空者胜。',
        '每个自己的回合灵力上限 +1（最多 10）并回满，同时抽 1 张牌；手牌上限 7 张。',
        '灵将（金框）留在场上，下个回合起可以攻击，最多同时 5 名。',
        '符箓（银白框）即时生效，用完就消散。',
        '文脉（竹青框）进入文脉区持续生效，最多 6 张。',
        '每回合最多攻击 2 次。对方有【守护】灵将时必须先击破它，否则可以直取主将。',
        '五行相克：金克木、木克土、土克水、水克火、火克金，克制时伤害 ×1.3，目标会闪红光。',
        '在卡牌图鉴里用文脉碎片升阶，升到珍品会解锁卡牌自带的技能。',
      )),
      操作: () => h('div.help-pane', bullets(
        '出牌：把手牌往牌桌上拖；或者点一下手牌，再点落点。',
        '攻击：先点自己的灵将，再点要打的目标。',
        '技能：选中灵将后点出现的技能按钮。',
        touch() ? '看卡面详情：点一下卡牌。' : '看卡面详情：把鼠标停在卡牌上。',
        '取消选中：点空白处、按右键，或者按 Esc。',
        '「録」是战报，「☰」是暂停菜单（Esc 也能开）。',
      )),
      屏幕: screenPane,
    };
    const keys = Object.keys(panes);
    const body = h('div.help-body');
    const tabs = h('div.seg.help-tabs', keys.map((k, i) => h('button' + (i === 0 ? '.on' : ''), { text: k, onclick: (e) => {
      tabs.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      e.target.classList.add('on');
      audio.sfx('click');
      clear(body).append(panes[k]());
    } })));
    body.append(panes[keys[0]]());
    return modal('帮助', h('div.help', tabs, body), [{ label: '知道了', value: true, primary: true }]);
  }

  // ── settings ──
  async function settingsModal() {
    const st = save.data.settings;
    const slider = (label, key) => h('label.set-row', h('span', { text: label }), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[key],
      oninput: (e) => { st[key] = +e.target.value; applyVol(); } }));
    const check = (label, key) => h('label.set-row', h('span', { text: label }), h('input', { type: 'checkbox', checked: st[key] ? true : null, onchange: (e) => { st[key] = e.target.checked; } }));
    const speed = h('div.seg', [[0.75, '慢'], [1, '中'], [1.5, '快'], [2, '极快']].map(([v, t]) => h('button' + (st.speed === v ? '.on' : ''), { text: t, onclick: (e) => { st.speed = v; speed.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); } })));
    const body = h('div.settings',
      slider('总音量', 'master'), slider('音乐', 'music'), slider('音效', 'sfx'),
      h('label.set-row', h('span', { text: '动画速度' }), speed),
      check('回合计时（一炷香 · 30 秒）', 'timer'), check('教学提示', 'hints'),
      canFullscreen() && !standalone() ? h('div.set-row', h('span', { text: '全屏' }), fullscreenButton()) : null,
      h('div.set-row', h('span', { text: '存档' }), h('button.btn.small', { text: '重置全部进度', onclick: async () => {
        const ok = await modal('重置进度', '将清除全部碎片、解锁、升阶与关卡进度，确定吗？', [{ label: '确定重置', value: true }, { label: '取消', value: false, primary: true }]);
        if (ok) { save.reset(); toast('进度已重置'); location.reload(); }
      } })),
      h('div.dim.small', { text: '音乐与音效全部由 WebAudio 实时合成：古琴、箫、堂鼓、编钟、锣。' }));
    await modal('设置', body, [{ label: '完成', value: true, primary: true }]);
    save.write();
    if (screen.classList.contains('menu-screen')) mainMenu();
  }

  window.__nav = { title, mainMenu, storyMap, practice, collection, deckBuilder, runLevel, runPrologue };
  // ── go ──
  setStage('menu'); menuCam();
  window.__load?.(1, '');
  await new Promise((r) => setTimeout(r, 250));
  load?.classList.add('done');
  setTimeout(() => load?.remove(), 1300);

  const jump = params.get('battle');
  const scr = params.get('screen');
  if (jump) {
    const L = LEVELS.find((l) => l.id === jump) ?? PRACTICE.find((p) => p.id === jump);
    if (L) {
      if (!save.data.seenPrologue) { save.data.seenPrologue = true; }
      setStage(L.scene, L.variant); battleCam();
      window.__ready = true;
      audio.music(L.music ?? L.scene);
      const res = await startBattle(ctx, battleCfg({ ai: 'normal', ...L }));
      await resultScreen(res, { fragments: 0, unlock: [] });
      return mainMenu();
    }
  }
  if (scr) {
    ({ collection, deck: deckBuilder, story: storyMap, practice, menu: mainMenu }[scr] ?? mainMenu)();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
  await title();
}
