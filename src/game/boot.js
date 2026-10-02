// Boot + screen flow: title → main menu → 故事模式 / 自由对战 / 卡牌图鉴·升阶 / 牌组编成 / 设置.
// URL switches for testing: ?battle=shenhua-1|p-stage  &auto=1 (AI plays both sides)  &screen=collection|deck|story|practice|quiz
//   &speed=2  &reset=1 (fresh save)  &unlock=1 (all cards, 999 fragments)
import * as THREE from 'three';
import { createApp } from '../render/app.js';
import { buildScene, disposeScene } from '../render/scenes.js';
import { createFx } from '../render/fx.js';
import { CardMesh, CARD_W, CARD_H } from '../render/cardMesh.js';
import { tween, ease, wait } from '../render/tween.js';
import { createAudio } from '../audio/audio.js';
import { createSave, deckProblem, MAX_DECKS } from './save.js';
import { startBattle, battleCamPos, BATTLE_CAM } from './battle.js';
import { h, clear, faceEl, cardInfo, portraitEl, banner, toast, modal, dialogue, setLayer, fade, touch } from './ui.js';
import { eraMap } from '../ui/eraMap.js';
import { canFullscreen, isFullscreen, standalone, requestFullscreen, toggleFullscreen } from './fullscreen.js';
import { CARDS, card, PLAYER_CARD_IDS, TYPE_ZH, GRADE_ZH, EL, BONDS } from '../data/cards.js';
import { LEVELS, CHAPTERS, chapterEnd, SPEAKER_ART, PRACTICE, practiceReward, DECK_SIZE, MAX_COPIES } from '../data/story.js';
import { GUARDIAN } from '../data/guardian.js';
import { RELICS_BY_CARD, RELICS_BY_CHAPTER } from '../data/relics.js';
import { RELIC_IMAGES } from '../data/relicImages.js';
import { RULES } from '../rules/engine.js';
import { QUIZ_STAGES, QUIZ_N, QUIZ_NEED, QUIZ_PERFECT, QUIZ_DAILY_EACH, quizPassReward, quizStageOpen, dealQuiz, todayKey } from '../data/quiz.js';

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
  let stage = null, stageKey = '', viewer = null, viewerLamp = null;
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
    m.setGlow('#ffd88a', 0.45);
    m.setSheen(true);
    app.camera.add(m);
    viewer = m;
    // 灯挂在相机上、不跟卡一起转。侧上方一盏主光，清漆高光才会在翻面上走；
    // 近点光会在画面中间烧出一块，看起来像贴了层膜。
    dropLamp();
    viewerLamp = new THREE.Group();
    const fill = new THREE.HemisphereLight(0xfff4e6, 0x6a5a48, 0.82);
    const key = new THREE.PointLight(0xfff1d2, 2.2, 10, 2);
    key.position.copy(pos).add(new THREE.Vector3(1.05, 0.72, 1.25));
    viewerLamp.add(fill, key);
    app.camera.add(viewerLamp);
    let drag = null, vy = 0;
    m.userData.tick = (dt, t) => {
      m.tick(dt, t);
      if (spin && !drag) { vy *= 0.95; m.rotation.y = Math.sin(t * 0.6) * 0.35 + vy; }
      m.position.y = pos.y + Math.sin(t * 1.1) * 0.03;
    };
    tween(0.6, (k) => m.scale.setScalar(scale * k), { ease: ease.back });
    return m;
  }
  /**
   * 按一块 DOM 空当把 3D 预览卡摆进去。纸底是不透明的，浮卡画在 canvas 上，
   * 所以空当必须透明——详情栏顶上留一个 .side-face 洞，卡在洞里转。
   * 坐标跟画布同一套：app.size 走 visualViewport，iPad 底下那条工具栏骗不到。
   */
  function slotFromRect(el, { z = -3.2, max = 0.86 } = {}) {
    const box = el?.getBoundingClientRect();
    if (!box || box.width < 40 || box.height < 40) return null;
    const vv = window.visualViewport;
    const vw = app.size?.w || vv?.width || innerWidth;
    const vh = app.size?.h || vv?.height || innerHeight;
    const ox = vv?.offsetLeft ?? 0, oy = vv?.offsetTop ?? 0;
    const halfH = Math.abs(z) * Math.tan((app.camera.fov * Math.PI) / 360);
    const halfW = halfH * app.camera.aspect;
    const x = ((box.left + box.width / 2 - ox) / vw - 0.5) * halfW * 2;
    const y = (0.5 - (box.top + box.height / 2 - oy) / vh) * halfH * 2;
    const scale = Math.min(max, (box.width / vw) * halfW * 2 / CARD_W, (box.height / vh) * halfH * 2 / CARD_H);
    return { pos: new THREE.Vector3(x, y, z), scale };
  }

  function placeViewer(id, grade, hole) {
    const slot = slotFromRect(hole ?? document.querySelector('.coll .side-face'));
    if (slot) showViewer(id, grade, slot); else hideViewer();
  }

  function dropLamp() {
    if (!viewerLamp) return;
    viewerLamp.traverse((o) => { if (o.isLight) o.dispose(); });
    app.camera.remove(viewerLamp);
    viewerLamp = null;
  }
  function hideViewer() {
    dropLamp();
    if (!viewer) return;
    const m = viewer; viewer = null;
    tween(0.25, (k) => m.scale.multiplyScalar(1 - k * 0.5)).then(() => { app.camera.remove(m); m.dispose(); });
  }

  // ── common chrome ──
  // 每次换屏都把上一屏挂的窗口级监听（目前只有图鉴的 resize）一并撤掉，省得越积越多。
  let screenAbort = null;
  const onScreen = (type, fn) => window.addEventListener(type, fn, { signal: screenAbort.signal });

  function frame(title, { back = null, extra = null } = {}) {
    screenAbort?.abort(); screenAbort = new AbortController();
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

  const guardianSub = () => {
    const r = save.guardianRank(), name = r.name.replace(/\u3000/g, '');
    return r.level ? `${name} · ${r.level} / ${r.max} 重 · 气血 ${RULES.HERO_HP + save.boon().hp}` : '修行 · 永久强化主将';
  };

  function mainMenu() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    clear(screen);
    screen.className = 'screen show menu-screen';
    const cur = CHAPTERS.filter(chapterOpen).at(-1);
    const done = cur.levels.filter((L) => save.isDone(L.id)).length;
    const seal = ['壹', '贰', '叁', '肆'];
    // 前四项做成立轴，竖排；后五项是轴下的签条。iPhone 横屏把签条收成底部一排印。
    const play = [
      ['故事模式', `${cur.title.split(' · ')[1]} · ${done}/${cur.levels.length}`, () => storyMap()],
      ['自由对战', `${PRACTICE.length} 处场景 · 三档难度`, () => practice()],
      ['文脉闯关', quizSub(), () => quizMap()],
      ['卡牌图鉴', `已得 ${save.data.owned.length}/${PLAYER_CARD_IDS.length} · 升阶`, () => openCollection()],
    ];
    const more = [
      ['文物志', '文物', relicSub(), () => relicScreen()],
      ['守护者', '修行', guardianSub(), () => guardianScreen()],
      ['牌组编成', '牌组', `${save.deckName()} · ${save.data.deck.length}/${DECK_SIZE}`, () => deckBuilder()],
      ['设置', '设置', '音量 · 速度 · 计时', () => settingsModal()],
      ['帮助', '帮助', '玩法 · 操作 · 屏幕', () => helpModal()],
    ];
    const plaque = (t, sub, fn, i) => h('button.plaque', {
      style: { animationDelay: `${i * 80}ms` }, 'aria-label': `${t}，${sub}`,
      onpointerenter: () => audio.sfx('hover'), onclick: () => { audio.sfx('click'); fn(); },
    },
      h('span.plaque-rod.top'),
      h('span.plaque-seal', { text: seal[i] }),
      h('span.plaque-t', { text: t }),
      h('span.plaque-s', { text: sub }),
      h('span.plaque-rod.bot'));
    const slip = (t, dock, sub, fn, i) => h('button.slip', {
      style: { animationDelay: `${(play.length + i) * 70}ms` }, 'aria-label': `${t}，${sub}`,
      onpointerenter: () => audio.sfx('hover'), onclick: () => { audio.sfx('click'); fn(); },
    },
      h('span.menu-t', { text: t }), h('span.menu-dock', { text: dock }), h('span.menu-s', { text: sub }));
    screen.append(
      h('div.logo.small',
        h('div.logo-main', { text: '文脉' }), h('div.logo-dot', { text: '·' }), h('div.logo-sub', { text: '山海卡' }),
        h('div.logo-seal', { text: '山' }),
        h('div.logo-brush', { html: '<svg viewBox="0 0 240 16" preserveAspectRatio="none" aria-hidden="true"><path d="M2 10 C 28 4, 70 13, 120 8 S 196 12, 238 5" fill="none" stroke="#1a1612" stroke-width="3.4" stroke-linecap="round"/></svg>' })),
      h('div.menu',
        h('div.menu-play', play.map(([t, sub, fn], i) => plaque(t, sub, fn, i))),
        h('div.menu-more', more.map(([t, dock, sub, fn], i) => slip(t, dock, sub, fn, i))),
        h('div.stats', { text: `战绩 ${save.data.stats.wins} 胜 ${save.data.stats.losses} 负` })),
      h('div.frag.corner', { title: '文脉碎片' }, h('span.frag-ico'), h('span.frag-n', { text: String(save.data.fragments) })),
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
    const at = CHAPTERS.indexOf(C);
    const goCh = (x) => {
      if (!x) return;
      if (!chapterOpen(x)) { audio.sfx('error'); toast(`通关「${CHAPTERS[x.n - 2].short}」后开启`); return; }
      audio.sfx('click'); storyMap(x.n);
    };
    const prev = CHAPTERS[at - 1], nextCh = CHAPTERS[at + 1];
    const tabs = h('div.tabs.ch-tabs');
    const stepBtn = (text, target, title) => h('button.tab.ch-step' + (target ? '' : '.locked'), {
      text, title, onclick: () => goCh(target) });
    const chapterBtn = (x) => h('button.tab' + (x === C ? '.on' : '') + (chapterOpen(x) ? '' : '.locked'), {
      text: x.num, title: x.title, onclick: () => goCh(x) });
    // 竖条高度只够放下若干章。放不下的收成中间的省略号，不出现滚动条。
    const railItems = (slots) => {
      const n = CHAPTERS.length;
      if (n <= slots) return CHAPTERS.map((ch) => ({ kind: 'ch', ch }));
      let gapBefore = true, gapAfter = true, start = 0, end = n;
      for (let pass = 0; pass < 3; pass++) {
        const inner = Math.max(1, slots - (gapBefore ? 1 : 0) - (gapAfter ? 1 : 0));
        start = at - Math.floor((inner - 1) / 2);
        start = Math.max(0, Math.min(start, n - inner));
        end = start + inner;
        const nextBefore = start > 0, nextAfter = end < n;
        if (nextBefore === gapBefore && nextAfter === gapAfter) break;
        gapBefore = nextBefore; gapAfter = nextAfter;
      }
      const items = [];
      if (start > 0) items.push({ kind: 'gap', from: 0, to: start - 1 });
      for (let i = start; i < end; i++) items.push({ kind: 'ch', ch: CHAPTERS[i] });
      if (end < n) items.push({ kind: 'gap', from: end, to: n - 1 });
      return items;
    };
    const jumpGap = (from, to) => {
      const mid = Math.floor((from + to) / 2);
      let best = null, bestD = Infinity;
      for (let i = from; i <= to; i++) {
        if (!chapterOpen(CHAPTERS[i])) continue;
        const d = Math.abs(i - mid);
        if (d < bestD) { best = CHAPTERS[i]; bestD = d; }
      }
      if (!best) { audio.sfx('error'); toast('这些章节还没开启'); return; }
      goCh(best);
    };
    let railFrame = 0;
    const fillRail = () => {
      cancelAnimationFrame(railFrame);
      railFrame = requestAnimationFrame(() => {
      const listH = sheet.offsetHeight;
      if (listH < 48) return;
      if (tabs.style.height === `${listH}px` && tabs.childElementCount > 2) return;
      tabs.style.height = listH + 'px';
      const avail = tabs.clientHeight;
      clear(tabs);
      const probeStep = stepBtn('上一页', prev, '');
      const probeTab = h('button.tab', { text: '二十' });
      tabs.append(probeStep, probeTab);
      const stepH = probeStep.offsetHeight || 1;
      const rowH = probeTab.offsetHeight || 1;
      const slots = Math.max(1, Math.floor((avail - stepH * 2) / rowH));
      clear(tabs);
      tabs.append(stepBtn('上一页', prev, prev ? `上一页 · ${prev.title}` : '已经是第一章'));
      for (const item of railItems(slots)) {
        if (item.kind === 'gap') {
          const a = CHAPTERS[item.from], b = CHAPTERS[item.to];
          tabs.append(h('button.tab.ch-gap', {
            text: '…', title: item.from === item.to ? a.title : `${a.title} 至 ${b.title}`,
            onclick: () => jumpGap(item.from, item.to) }));
        } else tabs.append(chapterBtn(item.ch));
      }
      tabs.append(stepBtn('下一页', nextCh, nextCh ? (chapterOpen(nextCh) ? `下一页 · ${nextCh.title}` : `通关「${C.short}」后开启`) : '已经是最后一章'));
      // 行数按自然高度算完再平摊余数，底边贴齐关卡列表，单行不会被拉得很高。
      for (const b of tabs.children) b.style.flexGrow = '1';
      });
    };
    const body = frame(`故事模式 · ${C.title}`, { back: mainMenu, extra: deckSwitch(() => storyMap(C.n)) });
    screen.classList.add('story-screen');
    const railWatch = new ResizeObserver(() => fillRail());
    screenAbort.signal.addEventListener('abort', () => railWatch.disconnect());
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
    const sheet = h('div.scroll-sheet', list, eraMap(C.key));
    body.append(h('div.story-map',
      h('div.handscroll',
        h('div.handscroll-rod', { 'aria-hidden': 'true' }),
        sheet,
        h('div.handscroll-rod', { 'aria-hidden': 'true' })),
      tabs));
    railWatch.observe(sheet);
    fillRail();
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
      const R = practiceReward(L.ai);      // 重打按关卡本身的难度给，前期的关卡刷不出后期的量
      const reward = { fragments: res.won ? (first ? L.reward.fragments : R.win) : R.loss, unlock: [] };
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
          ? `已自动编入「${save.deckName()}」：${reward.swapped.map(([a, b]) => `「${card(a).name}」替换「${card(b).name}」`).join('，')}。可在「牌组编成」中调整。`
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
    const payout = h('span.dim');
    const showPayout = () => { const R = practiceReward(level); payout.textContent = `胜利 +${R.win} 碎片 · 失败 +${R.loss}`; };
    showPayout();
    const diff = h('div.seg', [['easy', '入门'], ['normal', '寻常'], ['hard', '宗师']].map(([k, t]) => h('button' + (k === level ? '.on' : ''), { text: t, onclick: (e) => { audio.sfx('click'); level = k; showPayout(); diff.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); } })));
    const prob = deckProblem(save.data.deck);
    if (prob) body.append(h('div.warn', { text: `当前牌组不可用：${prob}` }));
    body.append(h('div.row', h('span', { text: '出战：' }), deckSwitch(() => practice()), h('span', { text: '难度：' }), diff, payout),
      h('div.opps', PRACTICE.map((P, i) => h('div.opp', { onclick: async () => {
        if (prob) { audio.sfx('error'); toast('请先在「牌组编成」中组好 20 张牌'); return; }
        audio.sfx('click');
        const L = { ...P, ai: level, playerFirst: Math.random() < 0.5 };
        for (;;) {
          const res = await fight(L, battleCfg(L, { title: P.title }));
          const R = practiceReward(L.ai);
          const reward = { fragments: res.forfeited ? 0 : res.won ? R.win : R.loss, unlock: [] };
          save.data.fragments += reward.fragments; save.write();
          const nx = await resultScreen(res, reward, { retry: true });
          if (nx !== 'retry') break;
        }
        await transition(async () => practice());
      } }, portraitEl(P.enemy.portrait, 140, i + 11), h('div.opp-t', { text: P.title }), h('div.opp-d', { text: `对手：${P.enemy.name}` })))));
  }

  // ── collection / upgrade ──
  // 图鉴要逐张铺牌面。很快就好的话不闪一下；超过一会儿再盖上「铺开图鉴」。
  let busyEl = null;
  function showBusy(text) {
    if (busyEl) return;
    busyEl = h('div.busy', { role: 'status', 'aria-live': 'polite' },
      h('div.busy-card',
        h('div.busy-seal', { text: '卷' }),
        h('div.busy-t', { text }),
        h('div.busy-line')));
    root.append(busyEl);
    requestAnimationFrame(() => busyEl?.classList.add('in'));
  }
  function hideBusy() {
    const el = busyEl;
    if (!el) return;
    busyEl = null;
    el.classList.remove('in');
    el.classList.add('out');
    setTimeout(() => el.remove(), 280);
  }
  function openCollection() {
    let opened = false;
    const timer = setTimeout(() => { if (!opened) showBusy('铺开图鉴'); }, 140);
    const finish = () => { opened = true; clearTimeout(timer); hideBusy(); };
    requestAnimationFrame(() => collection(null, finish));
  }

  function collection(sel = null, onReady = null) {
    setStage('menu'); menuCam();
    audio.music('menu');
    const body = frame('卡牌图鉴 · 升阶', { back: () => { hideViewer(); mainMenu(); } });
    const all = [...PLAYER_CARD_IDS, ...Object.keys(CARDS).filter((id) => CARDS[id].zhuo)];
    let filter = 'all';
    const grid = h('div.grid');
    const side = h('div.side');
    const tabs = h('div.seg', [['all', '全部'], ['general', '灵将'], ['talisman', '符箓'], ['wenmai', '文脉'], ['artifact', '器物'], ['formation', '阵法'], ['zhuo', '浊灵']].map(([k, t]) =>
      h('button' + (k === filter ? '.on' : ''), { text: t, onclick: (e) => { audio.sfx('click'); filter = k; tabs.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); draw(); } })));
    let drawGen = 0;
    let ready = onReady;
    const finish = () => { const fn = ready; ready = null; fn?.(); };
    screenAbort.signal.addEventListener('abort', finish);
    function draw() {
      const gen = ++drawGen;
      clear(grid);
      const ids = all.filter((id) => {
        const d = CARDS[id];
        return filter === 'zhuo' ? d.zhuo : filter === 'all' || (!d.zhuo && d.type === filter);
      });
      let i = 0;
      const step = () => {
        if (gen !== drawGen || screenAbort.signal.aborted) return;
        const t0 = performance.now();
        while (i < ids.length && performance.now() - t0 < 14) {
          const id = ids[i++];
          const d = CARDS[id];
          const owned = d.zhuo || save.owns(id), g = save.grade(id);
          grid.append(h('div.cell' + (owned ? '' : '.locked') + (sel === id ? '.sel' : ''), { onclick: () => { audio.sfx('pick'); sel = id; draw(); pickCard(id); } },
            faceEl(id, owned ? g : 0, { w: 118 }),
            !owned ? h('div.lock', { text: '未解锁' }) : g ? h('div.grade-tag.g' + g, { text: GRADE_ZH[g] }) : null,
            owned && !d.zhuo && save.canUpgrade(id) ? h('div.up-dot', { title: '可升阶' }) : null));
        }
        if (i < ids.length) requestAnimationFrame(step);
        else finish();
      };
      step();
    }
    function pickCard(id) {
      clear(side);
      const d = CARDS[id], owned = d.zhuo || save.owns(id), g = save.grade(id);
      const hole = h('div.side-face');
      const paper = h('div.side-paper');
      paper.append(cardInfo(id, owned ? g : 0));
      if (d.lore) paper.append(h('div.lore', h('b', { text: '典故　' }), d.lore));
      for (const r of RELICS_BY_CARD[id] ?? []) paper.append(relicCard(r));
      if (!owned) paper.append(h('div.warn', { text: '尚未解锁：通关故事关卡获得。' }));
      else if (!d.zhuo) {
        const cost = save.upgradeCost(id);
        if (cost == null) paper.append(h('div.maxed', { text: '已臻极品' }));
        else paper.append(h('div.upgrade', h('div', { text: `升阶至「${GRADE_ZH[g + 1]}」：消耗 ${cost} 文脉碎片（全属性提升${d.skill && g === 0 ? '，解锁主动技能' : d.up && g === 0 ? '，解锁珍品效果' : ''}）` }),
          btn(`升阶 · ${cost} 碎片`, async () => {
            if (!save.upgrade(id)) { audio.sfx('error'); toast(`碎片不足（需要 ${cost}）`); return; }
            audio.sfx('upgrade');
            fx.burst(app.camera.localToWorld(new THREE.Vector3(0.3, 0.02, -3.2)), { color: '#ffd88a', size: 4, life: 1 });
            await banner('升阶成功', `${d.name} · ${GRADE_ZH[save.grade(id)]}`, { cls: 'res', ms: 1300 });
            collection(id);
          }, save.canUpgrade(id) ? 'primary' : 'disabled')));
      }
      side.append(hole, paper);
      // 洞的尺寸要等进文档才量得准，下一帧再摆 3D 卡。
      requestAnimationFrame(() => placeViewer(id, owned ? g : 0, hole));
    }
    body.append(h('div.coll', h('div.coll-left', tabs, grid), side));
    // 空当宽度是量出来的，窗口一变 / iPad 转屏 / 分屏都不作数了，得重新摆。
    let t = 0;
    const relayout = () => {
      clearTimeout(t);
      t = setTimeout(() => { if (sel) pickCard(sel); }, 150);
    };
    onScreen('resize', relayout);
    onScreen('orientationchange', relayout);
    window.visualViewport?.addEventListener('resize', relayout, { signal: screenAbort.signal });
    draw();
    pickCard(sel ?? all[0]);
    if (!sel) sel = all[0];
  }

  // ── 文物志 ──
  // 卡牌讲传说，文物讲「东西还在，你可以去看」。按章解锁：打通哪一章，就看得到那一章的文物。
  const relicOpenChapters = () => CHAPTERS.filter((C) => save.isDone(C.levels.at(-1).id));
  const relicsSeen = () => relicOpenChapters().reduce((n, C) => n + (RELICS_BY_CHAPTER[C.key] ?? []).length, 0);
  const relicTotal = Object.values(RELICS_BY_CHAPTER).reduce((n, list) => n + list.length, 0);
  const relicSub = () => {
    const n = relicsSeen();
    return n ? `已录 ${n}/${relicTotal} 件 · 按朝代` : '通关章节解锁真实文物';
  };

  /**
   * 一条文物：卡牌详情和文物志共用这一块。
   *
   * 照片来自 Wikimedia Commons，署名行是 CC-BY / CC-BY-SA 要求的，不能省。
   * 没有照片的条目（目前只有葡萄花鸟纹银香囊）就只出文字，不留空框。
   * 馆方官网只作外链——文物本身在公有领域，拍它的照片不是。
   */
  function relicCard(r) {
    const img = RELIC_IMAGES[r.id];
    return h('div.relic',
      img ? h('figure.relic-fig',
        h('img', { src: img.src, alt: r.name, loading: 'lazy', decoding: 'async' }),
        h('figcaption',
          h('a', { href: img.page, target: '_blank', rel: 'noopener' }, `${img.author} / ${img.license}`),
          ' · Wikimedia Commons')) : null,
      h('div.relic-head', h('i.relic-tag', { text: '文物' }), h('b', { text: r.name }), h('span', { text: r.era })),
      h('div.relic-meta', { text: r.found }),
      h('div.relic-meta', { text: `现藏　${r.where}` }),
      r.spec ? h('div.relic-spec', { text: r.spec }) : null,
      h('div.relic-note', { text: r.note }),
      img?.official ? h('a.relic-link', { href: img.official, target: '_blank', rel: 'noopener', text: '官方藏品页 ↗' }) : null);
  }

  function relicScreen() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    const body = frame('文物志', { back: () => mainMenu() });
    const list = h('div.relics');
    for (const C of CHAPTERS) {
      const items = RELICS_BY_CHAPTER[C.key] ?? [];
      if (!items.length) continue;
      const open = save.isDone(C.levels.at(-1).id);
      list.append(h('div.relic-era',
        h('div.relic-era-t', h('b', { text: C.short }), h('span', { text: open ? `${items.length} 件` : '未解锁' })),
        open
          ? h('div.relic-grid', items.map(relicCard))
          : h('div.relic-lock', { text: `通关「${C.short}」后录入此处的 ${items.length} 件文物。` })));
    }
    body.append(h('div.relic-intro', { text: '这里的每一件都真实存在，年代、出土地与现藏机构均据公开著录。看完了，可以去馆里看原件。' }), list);
  }

  // ── 文脉闯关 ──
  // 通关对应故事章才开那一关（第一章随时可考）。每关 5 题、对 4 题过；首通给碎片，重考只练手。
  // 「今日一问」每天一次，从已开的题库里抽，答对一题一片碎片。
  const quizOpen = (S) => quizStageOpen(S, save, CHAPTERS);
  const quizCleared = (ch) => save.data.quizDone.includes(ch);
  const dailyReady = () => save.data.quizDaily.day !== todayKey();
  const quizSub = () => {
    const open = QUIZ_STAGES.filter(quizOpen).length;
    const done = save.data.quizDone.filter((ch) => QUIZ_STAGES.some((S) => S.ch === ch)).length;
    return `${done}/${open} 关已过 · ${dailyReady() ? '今日一问未考' : '今日一问已毕'}`;
  };

  function quizMap() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    const body = frame('文脉闯关', { back: mainMenu });
    const list = h('div.levels.quiz-list');
    const dailyOn = dailyReady();
    list.append(h('div.level' + (dailyOn ? '' : '.done'), {
      onclick: () => {
        if (!dailyOn) { audio.sfx('error'); toast('今日一问已经答过，明日再来'); return; }
        audio.sfx('click');
        const bank = QUIZ_STAGES.filter(quizOpen).flatMap((S) => S.bank);
        runQuiz({
          title: '今日一问',
          bank,
          daily: true,
        });
      },
    },
      h('div.level-no', { text: '日' }),
      h('div.level-main',
        h('div.level-t', { text: dailyOn ? '今日一问' : '今日一问 · 已毕' }),
        h('div.level-d', { text: '从已开考的篇章里抽 5 题。答对一题得 1 碎片，每天一次。' }),
        h('div.level-r', { text: dailyOn ? `最多 +${QUIZ_N * QUIZ_DAILY_EACH} 碎片` : '明日刷新' }))));

    for (const [i, S] of QUIZ_STAGES.entries()) {
      const C = CHAPTERS.find((x) => x.key === S.ch);
      const open = quizOpen(S), done = quizCleared(S.ch);
      const pass = quizPassReward(C?.n ?? i + 1);
      list.append(h('div.level' + (open ? '' : '.locked') + (done ? '.done' : ''), {
        onclick: () => {
          if (!open) { audio.sfx('error'); toast(`通关「${C?.short ?? S.title}」后开考`); return; }
          audio.sfx('click');
          runQuiz({ title: S.title, bank: S.bank, ch: S.ch, n: C?.n ?? i + 1, first: !done });
        },
      },
        h('div.level-no', { text: C?.num ?? String(i + 1) }),
        h('div.level-main',
          h('div.level-t', { text: `${C?.short ?? ''} · ${S.title}` }),
          h('div.level-d', { text: S.desc }),
          h('div.level-r', { text: done ? '已过 · 重考不再给碎片' : open ? `5 题对 ${QUIZ_NEED} 过关 · 首通碎片 ×${pass}（全对再 +${QUIZ_PERFECT}）` : `通关「${C?.short}」后开考` })),
        done ? h('div.level-seal', { text: '已过' }) : null));
    }
    body.append(h('div.quiz-intro', { text: '题目出自文物志和能核实的公开史实。考过了，可以去馆里把原件对一遍。' }), list);
  }

  async function runQuiz({ title, bank, ch = null, n = 1, first = false, daily = false }) {
    const qs = dealQuiz(bank, QUIZ_N);
    let score = 0;
    for (let i = 0; i < qs.length; i++) {
      const hit = await askQuiz(title, qs[i], i, qs.length, score);
      if (hit == null) return;
      if (hit) score++;
    }
    let gain = 0, passed = score >= QUIZ_NEED;
    if (daily) {
      gain = score * QUIZ_DAILY_EACH;
      save.data.quizDaily = { day: todayKey(), done: true };
    } else if (first && passed) {
      gain = quizPassReward(n) + (score === QUIZ_N ? QUIZ_PERFECT : 0);
      if (ch && !save.data.quizDone.includes(ch)) save.data.quizDone.push(ch);
    }
    save.data.fragments += gain;
    save.write();
    audio.music(passed || daily ? 'victory' : 'defeat');
    if (gain) audio.sfx('upgrade'); else audio.sfx(passed ? 'bond' : 'error');

    const body = frame('文脉闯关', { back: quizMap });
    const line = daily
      ? `今日答对 ${score} / ${QUIZ_N}。`
      : (passed ? (score === QUIZ_N ? '全部答对。' : `过关，答对 ${score} / ${QUIZ_N}。`) : `未过关，答对 ${score} / ${QUIZ_N}（需 ${QUIZ_NEED}）。`);
    const pay = gain
      ? `文脉碎片 +${gain}（共 ${save.data.fragments}）。`
      : (daily ? '' : (first ? '通过后才给碎片。' : '此关已经给过首通奖励，重考不再给碎片。'));
    body.append(h('div.quiz-paper.quiz-end',
      h('div.quiz-k', { text: title }),
      h('div.quiz-q', { text: daily ? '今日一问 · 毕' : (passed ? '闯关通过' : '再读一读') }),
      h('div.quiz-note', { text: `${line} ${pay}`.trim() }),
      h('div.quiz-end-btns',
        !daily ? btn('再考一回', () => runQuiz({ title, bank, ch, n, first: false, daily: false })) : null,
        btn('返回', quizMap, 'primary'))));
  }

  function askQuiz(title, q, i, total, score) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (settled) return; settled = true; resolve(v); };
      const body = frame(`${title} · ${i + 1}/${total}`, { back: () => { done(null); quizMap(); } });
      let locked = false, picked = false;
      const opts = h('div.quiz-opts');
      const TAG = ['甲', '乙', '丙', '丁'];
      const note = h('div.quiz-note', { text: q.note });
      const next = h('div.quiz-next', btn(i + 1 === total ? '看结果' : '下一问', () => { if (locked) done(picked); }, 'primary'));
      q.opts.forEach((t, k) => {
        opts.append(h('button.quiz-opt', { onclick: () => {
          if (locked) return;
          locked = true;
          picked = k === q.ans;
          audio.sfx(picked ? 'bond' : 'error');
          [...opts.children].forEach((el, j) => {
            if (j === q.ans) el.classList.add('ok');
            else if (j === k) el.classList.add('no');
          });
          opts.classList.add('locked');
          note.classList.add('on');
          next.classList.add('on');
        } }, h('span.tag', { text: TAG[k] }), t));
      });
      body.append(h('div.quiz-paper',
        h('div.quiz-bar',
          h('span.quiz-k', { text: `第 ${i + 1} / ${total} 问` }),
          h('span.quiz-k', { text: `已对 ${score}` })),
        h('div.quiz-q', { text: q.ask }),
        opts, note, next));
    });
  }

  // ── guardian cultivation ──
  function guardianScreen() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    const body = frame('守护者 · 修行', { back: () => mainMenu() });
    const rows = h('div.gd-rows');
    const boon = () => save.boon();

    function draw() {
      clear(rows);
      for (const t of GUARDIAN) {
        const lv = save.guardianLevel(t.k);
        const cost = save.guardianCost(t.k);
        const pips = h('div.gd-pips', Array.from({ length: t.max }, (_, i) => h('i' + (i < lv ? '.on' : ''))));
        const now = lv ? t.text(lv) : '尚未修行';
        const next = cost === null ? null : t.text(lv + 1);
        rows.append(h('div.gd-row' + (cost === null ? '.full' : ''),
          h('div.gd-head', h('span.gd-name', { text: t.name }), h('span.gd-sub', { text: t.sub }), pips),
          h('div.gd-now', { text: now }),
          next ? h('div.gd-next', { text: `下一级：${next}` }) : h('div.gd-next', { text: '已至圆满' }),
          h('div.gd-lore', { text: t.lore }),
          cost === null
            ? h('div.gd-full', { text: '圆满' })
            : btn(`修行 · ${cost} 碎片`, async () => {
              if (!save.upgradeGuardian(t.k)) { audio.sfx('error'); toast(`碎片不足（需要 ${cost}）`); return; }
              audio.sfx('upgrade');
              fx.burst(app.camera.localToWorld(new THREE.Vector3(0, 0.2, -3.4)), { color: '#9ad6a0', size: 3.4, life: 0.9 });
              await banner('修行有成', `${t.name.replace(/\u3000/g, '')} · ${t.text(save.guardianLevel(t.k))}`, { cls: 'res', ms: 1300 });
              guardianScreen();
            }, save.canGuardian(t.k) ? 'primary' : 'disabled'),
        ));
      }
    }

    const b = boon();
    const sign = (n, s) => (n ? s + n : '0');      // 没点的时候写「0」，别写成「-0」
    const summary = h('div.gd-sum', [
      [String(RULES.HERO_HP + b.hp), '气血上限'],
      [sign(b.armor, '-'), '受伤减免'],
      [sign(b.regen, '+'), '每回合回复'],
      [sign(b.mana, '+'), '首回合灵力'],
      [String(RULES.HAND_FIRST + b.hand), '先手起手牌'],
      [String(RULES.MAX_HAND + b.handCap), '手牌上限'],
    ].map(([v, label]) => h('div.gd-stat', h('b', { text: v }), h('span', { text: label }))));

    const rank = save.guardianRank();
    body.append(h('div.gd',
      h('div.gd-left', portraitEl('guardian', 190, 3),
        h('div.gd-title', h('span', { text: '守护者' }), h('i.gd-rank', { text: rank.name })),
        h('div.gd-flavor', { text: '碎片既能养卡，也能养人。' }),
        h('div.gd-bar', h('i', { style: { width: `${(rank.level / rank.max) * 100}%` } })),
        h('div.gd-prog', { text: rank.next ? `修行 ${rank.level} / ${rank.max} 重 · 再 ${rank.next.need} 重入「${rank.next.name.replace(/\u3000/g, '')}」` : `修行 ${rank.max} 重 · 已至圆满` }),
        summary),
      rows));
    draw();
  }

  // 出战牌组。故事模式、自由对战都用这一排切换，不用先回编成页。
  function deckSwitch(redraw) {
    return h('div.seg.deck-switch', save.data.decks.map((d, i) => h('button' + (i === save.data.deckOn ? '.on' : ''), {
      text: d.name, title: i === save.data.deckOn ? '当前出战' : '改用这套牌组出战',
      onclick: () => {
        if (i === save.data.deckOn) return;
        if (!save.useDeck(i)) { audio.sfx('error'); toast('这套牌组还不能用'); return; }
        audio.sfx('click');
        redraw();
      },
    })));
  }

  // ── deck builder ──
  function deckBuilder() {
    setStage('menu'); menuCam(); hideViewer();
    audio.music('menu');
    let deck = [...save.data.deck];
    const body = frame('牌组编成', { back: () => leave() });
    const pool = h('div.pool'), list = h('div.decklist'), head = h('div.deck-head'), infoBox = h('div.deck-info'), tabs = h('div.deck-tabs');
    const count = (id) => deck.filter((x) => x === id).length;
    const dirty = () => JSON.stringify(deck) !== JSON.stringify(save.data.deck);
    async function keepOrDrop() {
      if (!dirty()) return true;
      const prob = deckProblem(deck);
      if (prob) {
        const ok = await modal('牌组未完成', `${prob}。切换将放弃这次修改。`, [{ label: '放弃修改', value: true }, { label: '继续编辑', value: false, primary: true }]);
        return !!ok;
      }
      save.setDeck(deck);
      return true;
    }
    async function leave() {
      if (!(await keepOrDrop())) return;
      mainMenu();
    }
    function draw() {
      clear(pool); clear(list); clear(head); clear(tabs);
      const seg = h('div.seg');
      save.data.decks.forEach((d, i) => {
        seg.append(h('button' + (i === save.data.deckOn ? '.on' : ''), {
          text: d.name, title: i === save.data.deckOn ? '当前出战' : '改用这套出战',
          onclick: async () => {
            if (i === save.data.deckOn) return;
            if (!(await keepOrDrop())) return;
            if (!save.useDeck(i)) { audio.sfx('error'); toast('这套牌组还不能用'); return; }
            audio.sfx('click');
            deck = [...save.data.deck];
            draw();
          },
        }));
      });
      tabs.append(h('span.deck-bar-l', { text: '出战' }), seg);
      if (save.data.decks.length < MAX_DECKS) tabs.append(h('button.btn.small', { text: '新建', onclick: async () => {
        if (!(await keepOrDrop())) return;
        if (save.addDeck() < 0) { audio.sfx('error'); toast(`最多 ${MAX_DECKS} 套`); return; }
        audio.sfx('click');
        deck = [...save.data.deck];
        toast(`已新建「${save.deckName()}」，并设为出战`);
        draw();
      } }));
      const prob = deckProblem(deck);
      const types = { general: 0, talisman: 0, wenmai: 0, artifact: 0, formation: 0 };
      deck.forEach((id) => types[card(id).type]++);
      const curve = Array(8).fill(0); deck.forEach((id) => curve[Math.min(7, card(id).cost)]++);
      head.append(h('div.deck-n' + (prob ? '.bad' : ''), { text: `${deck.length} / ${DECK_SIZE}` }),
        h('div.dim', { text: `灵将 ${types.general} · 符箓 ${types.talisman} · 文脉 ${types.wenmai} · 器物 ${types.artifact} · 阵法 ${types.formation}` }),
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
    body.append(h('div.deckb', h('div.deck-pool', tabs, h('div.hint2', { text: '点上方牌组切换出战 · 点卡牌加入 · 点右侧条目移除 · 同名最多 2 张' }), pool),
      h('div.deck-side', head, list, h('div.deck-btns',
        btn('保存牌组', () => { const p = deckProblem(deck); if (p) { audio.sfx('error'); toast(p); return; } save.setDeck(deck); toast(`「${save.deckName()}」已保存`); }, 'primary'),
        btn('改名', async () => {
          const input = h('input.deck-rename', { type: 'text', value: save.deckName(), maxlength: '8' });
          requestAnimationFrame(() => input.focus());
          const ok = await modal('牌组名称', h('div', h('p', { text: '最多 8 个字。' }), input), [{ label: '确定', value: true, primary: true }, { label: '取消', value: false }]);
          if (!ok) return;
          if (!save.renameDeck(save.data.deckOn, input.value)) { audio.sfx('error'); toast('名字不能是空的'); return; }
          draw();
        }),
        btn('删除', async () => {
          if (save.data.decks.length <= 1) { audio.sfx('error'); toast('至少留一套牌组'); return; }
          const ok = await modal('删除牌组', `删除「${save.deckName()}」？出战会改到剩下的一套。`, [{ label: '删除', value: true }, { label: '取消', value: false, primary: true }]);
          if (!ok) return;
          save.removeDeck(save.data.deckOn);
          deck = [...save.data.deck];
          draw();
        }),
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
        '阵法（靛紫框）进入阵法区持续生效，最多 2 座。两座齐开时，我方灵将攻击和防御 +1。',
        '每回合最多攻击 2 次。对方有【守护】灵将时必须先击破它，否则可以直取主将。',
        '五行相克：金克木、木克土、土克水、水克火、火克金，克制时伤害 ×1.3，目标会闪红光。',
        '在卡牌图鉴里用文脉碎片升阶，升到珍品会解锁卡牌自带的技能。',
        '碎片也能在「守护者」里修行，六条路永久强化主将：气血上限、受伤减免、每回合回复、首回合灵力、起手牌、手牌上限。',
        '碎片来自故事关首通、文脉闯关、自由对战和重打关卡；闯关首通给碎片，重考不再给，另有每日一问。',
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
  // 存档导出 / 导入。进度只活在 localStorage 里，换浏览器、清缓存、或者被谁手抖覆盖一次就没了，
  // 所以留一个能自己拿走的副本。格式就是存档本身的 JSON，migrateSave() 会把不合法的字段挡掉，旧版本也在那里补迁移。
  function exportSave() {
    save.write();
    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([JSON.stringify(save.data, null, 1)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: `wenmai-save-${stamp}.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('存档已导出');
  }

  function importSave() {
    const inp = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      let raw;
      try { raw = JSON.parse(await f.text()); } catch { return toast('读不出来：不是有效的存档文件'); }
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.done)) return toast('读不出来：不像是本游戏的存档');
      const ok = await modal('导入存档', `将用「${f.name}」覆盖当前进度（已通 ${raw.done.length} 关），确定吗？`,
        [{ label: '确定导入', value: true }, { label: '取消', value: false, primary: true }]);
      if (!ok) return;
      // 直接写进 localStorage 再刷新：让 createSave 走一遍 migrateSave，脏字段自然被洗掉。
      localStorage.setItem('wenmai_save_v1', JSON.stringify(raw));
      location.reload();
    };
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  }

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
      h('div.set-row', h('span', { text: '存档' }),
        h('div.set-btns',
          h('button.btn.small', { text: '导出', onclick: () => exportSave() }),
          h('button.btn.small', { text: '导入', onclick: () => importSave() }),
          h('button.btn.small', { text: '重置全部进度', onclick: async () => {
            const ok = await modal('重置进度', '将清除全部碎片、解锁、升阶与关卡进度，确定吗？', [{ label: '确定重置', value: true }, { label: '取消', value: false, primary: true }]);
            if (ok) { save.reset(); toast('进度已重置'); location.reload(); }
          } }))),
      h('div.dim.small', { text: '音乐与音效全部由 WebAudio 实时合成：古琴、箫、堂鼓、编钟、锣。' }));
    await modal('设置', body, [{ label: '完成', value: true, primary: true }]);
    save.write();
    if (screen.classList.contains('menu-screen')) mainMenu();
  }

    window.__nav = { title, mainMenu, storyMap, practice, collection, deckBuilder, quizMap, runLevel, runPrologue };
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
    ({ collection, deck: deckBuilder, story: storyMap, practice, quiz: quizMap, menu: mainMenu }[scr] ?? mainMenu)();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
  await title();
}
