// Battle view + controller. The rules engine owns the truth (src/rules/engine.js); this file turns its events into
// motion (cards flying, burning, lunging, ink splashing) and turns pointer input into engine actions.
//
// Table layout (world units, table top y = 0, camera looks down from +z):
//   enemy hero / deck  z ≈ -2.95 (right)     enemy 文脉 z = -3.0 (left)
//   enemy generals     z = -1.35
//   player generals    z =  1.05
//   player hero / deck z ≈  2.45 (right)     player 文脉 z = 2.72 (left)
//   hands live in camera space (player: bottom fan, opponent: card backs along the top edge)
import * as THREE from 'three';
import {
  createGame, act, legalActions, canPlay, canAttack, canSkill, playTargets, attackTargets, skillTargets,
  unitView, findUnit, findAny, costOf, skillCost, heroReduction, bondState, isGuard, RULES,
} from '../rules/engine.js';
import { createAI } from '../rules/ai.js';
import { card, EL, BONDS, RESONANCES, EL_KEYS } from '../data/cards.js';
import { TUTORIAL_HINTS } from '../data/story.js';
import { CardMesh, CARD_H } from '../render/cardMesh.js';
import { statsOf } from '../render/cardFace.js';
import { HeroMesh, DeckStack } from '../render/hero.js';
import { tween, wait, ease } from '../render/tween.js';
import { h, clear, cardInfo, faceEl, banner, toast, modal, STATUS_ZH } from './ui.js';
import { SIGNATURE, murkSignature } from './cardvfx.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TILT = 0.5;                                  // board cards lean back toward the camera
const BOARD_Z = [1.05, -1.35], BOARD_S = [1.08, 1.0];
const WM_Z = [2.72, -3.0];
const HERO_P = [V(4.0, 0, 2.25), V(4.0, 0, -2.85)];
const DECK_P = [V(5.45, 0, 2.6), V(5.45, 0, -2.9)];
const HAND_D = 3.4;
const COL = { play: 0x7fe0a0, sel: 0xffd070, foe: 0xff5a40, ally: 0x80c8ff, hint: 0xffc040 };
/** Boss passives, as the HUD describes them. `mine` is written for the player, `foe` for the enemy hero panel. */
const PASSIVE_ZH = {
  chaos: { name: '混沌之压', every: 3, mine: '我方灵将永久 -1 防御并受 1 点伤害', foe: '对方灵将永久 -1 防御并受 1 点伤害。' },
  nishang: { name: '曲终', every: 3, mine: '我方灵将 ATK -2（1 回合），霓裳断魂回复 3 点生命', foe: '对方灵将 ATK -2（1 回合），自身回复 3 点生命。' },
  juexiang: { name: '散场', every: 3, mine: '我方灵将技能被封印 1 回合，对方获得 1 点额外灵力', foe: '封印对方灵将技能 1 回合，自身获得 1 点额外灵力。' },
  biantong: { name: '辩锋', every: 3, mine: '对方抽 2 张牌，我方灵将 ATK -1（1 回合）', foe: '自身抽 2 张牌，对方灵将 ATK -1（1 回合）。' },
  zhaohun: { name: '招魂', every: 3, mine: '对方从弃牌堆召回 1 张灵将并回复 2 点生命', foe: '从弃牌堆召回 1 张费用 ≤4 的灵将，自身回复 1 点生命。' },
  fenshu: { name: '焚典', every: 3, mine: '我方灵将受 1 点伤害，并烧掉 1 张手牌', foe: '对方灵将受 1 点伤害，并烧掉对方 1 张手牌。' },
  qingtan: { name: '清谈', every: 3, mine: '我方灵将技能被封印 1 回合，对方抽 1 张牌', foe: '封印对方灵将技能 1 回合，自身抽 1 张牌。' },
  liusha: { name: '掩埋', every: 3, mine: '我方灵将受 1 点伤害并永久 -1 防御，对方回复 2 点生命', foe: '对方灵将受 1 点伤害并永久 -1 防御，自身回复 1 点生命。' },
  jinhui: { name: '禁毁', every: 3, mine: '对方抽 2 张牌并获得 1 点灵力，我方灵将防御 -1', foe: '自身抽 2 张牌并获得 1 点灵力，对方灵将防御 -1。' },
  wangchuan: { name: '忘川', every: 2, mine: '我方灵将 ATK -1，遗忘之渊回复 2 点生命并抽 1 张牌', foe: '对方灵将 ATK -1，自身回复 2 点生命并抽 1 张牌。' },
  chenzhou: { name: '覆舟', every: 3, mine: '我方灵将受 1 点伤害且 ATK -1，沉舟之影回复 2 点生命并抽 1 张牌', foe: '对方灵将受 1 点伤害且 ATK -1，自身回复 2 点生命并抽 1 张牌。' },
  wuren: { name: '合卷', every: 3, mine: '烧掉我方 1 张手牌，我方灵将 ATK -1，无人读回复 1 点生命', foe: '烧掉对方 1 张手牌，对方灵将 ATK -1，自身回复 1 点生命。' },
};
const ST_TEXT = { stun: ['眩晕', '#8fb4ff'], seal: ['封印', '#d8a070'], bleed: ['流血', '#ff6a5a'], immune: ['免疫', '#ffe08a'], defUp: ['护体', '#ffe08a'],
  atkUp: ['勇武', '#ffb080'], atkDown: ['削弱', '#b0b0b0'], defDown: ['破防', '#b0b0b0'], dodge: ['潜行', '#a8d0f0'], reflect: ['反伤', '#ffe08a'] };
const NEG_ST = new Set(['stun', 'seal', 'bleed', 'atkDown', 'defDown']);
export const BATTLE_CAM = { pos: V(0, 10.1, 7.7), look: V(0, 0, 0.62) };

/**
 * ctx: { app, fx, audio, save, root (DOM layer) }
 * cfg: { title, enemy: {name, hp, deck, grades, portrait, passive, ordered}, ai, playerFirst, tutorial, playerDeck, ordered, seed, autoplay }
 * → Promise<{ won, turns, reason, forfeited }>
 */
export function startBattle(ctx, cfg) {
  const { app, fx, audio, save } = ctx;
  const { scene, camera } = app;
  const settings = save.data.settings;
  const S = () => settings.speed || 1;
  const W = (t) => wait(t / S());
  const seed = cfg.seed ?? ((Date.now() ^ (Math.random() * 1e9)) >>> 0);

  const s = createGame({
    seed, first: cfg.playerFirst === false ? 1 : 0,
    players: [
      { name: '守护者', deck: cfg.playerDeck ?? save.data.deck, grades: save.grades(), ordered: !!cfg.ordered },
      { name: cfg.enemy.name, deck: cfg.enemy.deck, grades: cfg.enemy.grades ?? {}, hp: cfg.enemy.hp, passive: cfg.enemy.passive, ordered: !!cfg.enemy.ordered },
    ],
  });
  const ai = createAI({ level: cfg.ai ?? 'normal', seed: seed ^ 0x5bd1 });
  const autoAI = cfg.autoplay ? createAI({ level: 'normal', seed: seed ^ 77 }) : null;

  // ── 3D objects ──
  const world = new THREE.Group(); world.name = 'battle';
  scene.add(world);
  const handG = new THREE.Group(); handG.name = 'hands';
  camera.add(handG);
  const meshes = new Map();             // uid → CardMesh
  const info = new Map();               // uid → { p, zone }
  const heroes = [
    new HeroMesh({ name: '守护者', motif: 'guardian' }),
    new HeroMesh({ name: cfg.enemy.name, motif: cfg.enemy.portrait ?? 'mist', enemy: true }),
  ];
  heroes.forEach((hm, i) => {
    hm.position.copy(HERO_P[i]).setY(0.78);
    hm.rotation.x = -0.62;
    world.add(hm); hm.placeRing(world);
    hm.heroIndex = i;
  });
  const decks = [new DeckStack(), new DeckStack()];
  decks.forEach((d, i) => { d.position.copy(DECK_P[i]); world.add(d); });
  const sigils = {};                    // `${p}:${kind}` → handle

  // ── DOM HUD ──
  const hud = h('div.battle');
  const detail = h('div.detail');
  const logBox = h('div.log');
  const mkMana = (cls) => h('div.mana.' + cls, h('div.mana-num'), h('div.mana-beads', Array.from({ length: 10 }, () => h('i'))));
  const manaMe = mkMana('me'), manaFoe = mkMana('foe');
  const chipsMe = h('div.chips.me'), chipsFoe = h('div.chips.foe');
  const incense = h('div.incense', h('div.incense-stick', h('div.incense-ember')), h('div.incense-smoke'));
  const endBtn = h('button.endturn', { onclick: () => { audio.sfx('click'); endTurn(); } }, h('span.endturn-t', { text: '结束回合' }), h('span.endturn-s'));
  const skillBtn = h('button.skill-btn', { onclick: () => useSkill() });
  const hint = h('div.hint');
  const turnTag = h('div.turn-tag');
  const menuBtn = h('button.icon-btn.menu-btn', { title: '菜单', text: '☰', onclick: () => pauseMenu() });
  const logBtn = h('button.icon-btn.log-btn', { title: '战报', text: '録', onclick: () => logBox.classList.toggle('open') });
  hud.append(menuBtn, logBtn, logBox, detail, manaMe, manaFoe, chipsMe, chipsFoe,
    h('div.endturn-wrap', turnTag, endBtn, incense), skillBtn, hint);
  ctx.root.append(hud);

  // ── controller state ──
  let mode = 'busy';                    // busy | idle | target
  let pending = null;                   // { kind: 'play'|'attack'|'skill', uid, targets: [] }
  let selHand = null, hoverUid = null, hoverObj = null, drag = null, press = null;
  let turnResolve = null, finished = false, paused = false, forfeited = false;
  let timeLeft = 0, timerOn = false;
  const TURN_TIME = 30;
  let shake = 0;
  const overrideHp = new Map();

  const log = (text, cls = '') => {
    logBox.prepend(h('div.log-line' + (cls ? '.' + cls : ''), { text }));
    while (logBox.childNodes.length > 80) logBox.lastChild.remove();
  };
  const nameOf = (uid) => { const f = findAny(s, uid); const id = f?.u.id ?? meshes.get(uid)?.cardId; return id ? card(id).name : '?'; };
  const tName = (t) => (t?.startsWith?.('H') ? s.players[+t[1]].name : nameOf(t));

  // ── transforms ──
  function moveTo(obj, { pos, rot, scale }, dur = 0.35, e = ease.out) {
    const tok = (obj.userData.tok = (obj.userData.tok ?? 0) + 1);
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.x;
    const q1 = rot ? new THREE.Quaternion().setFromEuler(rot) : q0.clone();
    const s1 = scale ?? s0, p1 = pos ?? p0;
    if (dur <= 0) { obj.position.copy(p1); obj.quaternion.copy(q1); obj.scale.setScalar(s1); return Promise.resolve(); }
    return tween(dur / S(), (k) => {
      if (obj.userData.tok !== tok) return;
      obj.position.lerpVectors(p0, p1, k);
      obj.quaternion.slerpQuaternions(q0, q1, k);
      obj.scale.setScalar(s0 + (s1 - s0) * k);
    }, { ease: e });
  }
  const boardSlot = (p, k, n) => {
    const sc = BOARD_S[p];
    return { pos: V((k - (n - 1) / 2) * 1.2, 0.02 + Math.sin(TILT) * CARD_H / 2 * sc, BOARD_Z[p] - Math.cos(TILT) * CARD_H / 2 * sc + 0.35), rot: new THREE.Euler(-Math.PI / 2 + TILT, 0, 0), scale: sc };
  };
  const wmSlot = (p, k) => ({ pos: V(-4.95 + k * 0.6, 0.12, WM_Z[p] - 0.1), rot: new THREE.Euler(-Math.PI / 2 + 0.3, 0, 0), scale: 0.5 });
  const castSpot = () => ({ pos: V(0, 2.4, 1.2), rot: new THREE.Euler().setFromQuaternion(camera.quaternion), scale: 0.95 });

  const setShadow = (m, on) => { if (m.userData.shadow === on) return; m.userData.shadow = on; m.body.traverse((o) => { if (o.isMesh && o !== m.glow) o.castShadow = on; }); };
  function makeMesh(uid, p) {
    const f = findAny(s, uid);
    const m = new CardMesh(f.u.id, f.u.grade ?? 0, { faceDown: p === 1 });
    m.uid = uid;
    setShadow(m, false);
    meshes.set(uid, m);
    return m;
  }
  function removeMesh(uid) {
    const m = meshes.get(uid);
    if (!m) return;
    m.parent?.remove(m);
    m.dispose();
    meshes.delete(uid); info.delete(uid);
  }

  // ── layout ──
  function layoutHand(p, dur = 0.3) {
    const list = s.players[p].hand.filter((u) => meshes.has(u.uid) && u.uid !== drag?.uid);
    const n = list.length;
    list.forEach((u, k) => {
      const m = meshes.get(u.uid);
      info.set(u.uid, { p, zone: 'hand' });
      if (m.parent !== handG) handG.attach(m);
      setShadow(m, false);
      const off = k - (n - 1) / 2;
      if (p === 0) {
        const sp = Math.min(0.5, 3.3 / Math.max(1, n));
        const up = u.uid === hoverUid || u.uid === selHand;
        moveTo(m, {
          pos: V(off * sp, up ? -0.6 : -0.98 - Math.abs(off) * 0.012, -HAND_D + k * 0.004 + (up ? 0.35 : 0)),
          rot: new THREE.Euler(0, 0, up ? 0 : -off * 0.035), scale: up ? 0.6 : 0.44,
        }, dur);
      } else {
        moveTo(m, { pos: V(off * 0.17, 1.12, -HAND_D - k * 0.002), rot: new THREE.Euler(0, 0, Math.PI + off * 0.04), scale: 0.2 }, dur);
      }
    });
  }
  function layoutBoard(p, dur = 0.35, e = ease.out) {
    const list = s.players[p].board.filter((u) => meshes.has(u.uid));
    list.forEach((u, k) => {
      const m = meshes.get(u.uid);
      info.set(u.uid, { p, zone: 'board' });
      if (m.parent !== world) world.attach(m);
      setShadow(m, true);
      if (!m.stats) m.attachStats();
      m.body.rotation.y = 0;
      refreshPlate(m, u);
      moveTo(m, boardSlot(p, k, list.length), dur, e);
    });
  }
  function layoutWenmai(p, dur = 0.4) {
    s.players[p].wenmai.filter((u) => meshes.has(u.uid)).forEach((u, k) => {
      const m = meshes.get(u.uid);
      info.set(u.uid, { p, zone: 'wenmai' });
      if (m.parent !== world) world.attach(m);
      setShadow(m, true);
      m.body.rotation.y = 0;
      moveTo(m, wmSlot(p, k), dur);
    });
  }
  function layoutAll(dur = 0.3) {
    for (const p of [0, 1]) { layoutHand(p, dur); layoutBoard(p, dur); layoutWenmai(p, dur); }
    // anything the state no longer shows (e.g. an interrupted animation) goes away
    const live = new Set();
    for (const P of s.players) for (const z of ['hand', 'board', 'wenmai']) for (const u of P[z]) live.add(u.uid);
    for (const uid of [...meshes.keys()]) if (!live.has(uid)) removeMesh(uid);
    // meshes the state shows but we never animated in (safety net)
    for (const P of s.players) for (const z of ['hand', 'board', 'wenmai']) for (const u of P[z]) if (!meshes.has(u.uid)) {
      const m = makeMesh(u.uid, P.i);
      m.position.copy(DECK_P[P.i]); m.scale.setScalar(0.3); world.add(m);
      if (z === 'hand') layoutHand(P.i, dur); else if (z === 'board') layoutBoard(P.i, dur); else layoutWenmai(P.i, dur);
    }
  }
  function refreshPlate(m, u) {
    if (!m.stats) return;
    u = u ?? findUnit(s, m.uid);
    if (!u) return;
    const v = unitView(s, u), base = statsOf(u.id, u.grade).base;
    m.stats.set({ atk: v.atk, def: v.def, hp: overrideHp.get(u.uid) ?? v.hp, maxHp: v.maxHp, base, st: v.st },
      { guard: isGuard(u), ready: u.owner === 0 && s.active === 0 && !s.over && (v.canAttack || v.canSkill) });
  }
  function refreshHeroes() {
    for (const i of [0, 1]) {
      const P = s.players[i];
      heroes[i].set({ hp: overrideHp.get(`H${i}`) ?? P.hp, maxHp: P.maxHp, red: heroReduction(s, i) });
      decks[i].set(P.deck.length);
    }
  }

  // ── HUD ──
  function manaView(el, P) {
    el.querySelector('.mana-num').textContent = `${P.mana}/${P.maxMana}`;
    el.querySelectorAll('.mana-beads i').forEach((b, k) => { b.className = k < P.mana ? 'on' : k < P.maxMana ? 'used' : ''; });
  }
  function chips(el, i) {
    clear(el);
    const P = s.players[i], b = bondState(s, i);
    for (const e of EL_KEYS) if (P.res[e] > 0) el.append(h('span.chip.res', { style: { borderColor: EL[e].color }, title: RESONANCES[e].text, text: `${RESONANCES[e].name} ${P.res[e]}` }));
    if (P.barrierTurns > 0) el.append(h('span.chip.res', { title: RESONANCES.barrier.text, text: `五行结界 ${P.barrierTurns}` }));
    for (const k of Object.keys(BONDS)) if (b[k] > 0) el.append(h('span.chip.bond', { title: BONDS[k].text, text: BONDS[k].title + (k === 'genesis' || k === 'zhensha' || k === 'feiyi' ? (b[k] > 1 ? ` ·${b[k]}` : '') : '') }));
    if (P.kunlun > 0) el.append(h('span.chip', { title: '灵将费用 -1', text: `昆仑镜 ${P.kunlun}` }));
    const red = heroReduction(s, i);
    if (red) el.append(h('span.chip', { title: '主将每次受伤减免（不叠加，取最高）', text: `减伤 ${red}` }));
    const pas = PASSIVE_ZH[P.passive];
    if (pas) el.append(h('span.chip.danger', { title: `每 ${pas.every} 个自身回合：${pas.mine}`, text: `${pas.name} ${pas.every - (P.turns % pas.every)}` }));
  }
  function refreshHUD() {
    manaView(manaMe, s.players[0]); manaView(manaFoe, s.players[1]);
    chips(chipsMe, 0); chips(chipsFoe, 1);
    refreshHeroes();
    const mine = s.active === 0 && !s.over;
    endBtn.disabled = !mine || mode === 'busy' || !!cfg.autoplay;
    const idle = mine && legalActions(s).length === 1;
    endBtn.classList.toggle('ready', idle);
    endBtn.querySelector('.endturn-s').textContent = mine ? (idle ? '无可用行动' : `第 ${s.players[0].turns} 回合`) : '对手行动中';
    turnTag.textContent = mine ? '我方回合' : s.over ? '' : '对手回合';
    turnTag.className = 'turn-tag ' + (mine ? 'me' : 'foe');
    incense.style.visibility = timerOn ? 'visible' : 'hidden';
    audio.intensity(1 - Math.min(s.players[0].hp / s.players[0].maxHp, s.players[1].hp / s.players[1].maxHp));
    for (const m of meshes.values()) if (m.stats) refreshPlate(m);
    // persistent resonance sigils under each side
    for (const i of [0, 1]) {
      const P = s.players[i];
      for (const k of [...EL_KEYS, 'barrier']) {
        const on = k === 'barrier' ? P.barrierTurns > 0 : P.res[k] > 0, key = `${i}:${k}`;
        if (on && !sigils[key]) sigils[key] = fx.sigil(V(k === 'barrier' ? 0 : -1.6 + EL_KEYS.indexOf(k) * 0.8, 0, BOARD_Z[i] + 0.1), k, { size: k === 'barrier' ? 5.6 : 2.8, persist: true });
        if (!on && sigils[key]) { sigils[key].stop(); delete sigils[key]; }
      }
    }
    refreshSkillBtn();
  }

  // ── highlights ──
  function targetsOf(p) {
    if (!p) return [];
    return p.targets ?? [];
  }
  function refreshHighlights() {
    for (const m of meshes.values()) m.setGlow(null);
    heroes.forEach((hm) => hm.setGlow(null));
    if (s.over) return;
    const mine = s.active === 0 && mode !== 'busy' && !cfg.autoplay;
    if (!mine) return;
    const P = s.players[0];
    const hintId = cfg.tutorial && settings.hints ? TUTORIAL_HINTS[P.turns]?.card : null;
    for (const u of P.hand) {
      const m = meshes.get(u.uid);
      if (!m) continue;
      if (u.uid === selHand || u.uid === pending?.uid) m.setGlow(COL.sel, 1);
      else if (canPlay(s, 0, u)) m.setGlow(hintId === u.id ? COL.hint : COL.play, hintId === u.id ? 1 : 0.55);
    }
    for (const u of P.board) {
      const m = meshes.get(u.uid);
      if (!m) continue;
      if (u.uid === pending?.uid) m.setGlow(COL.sel, 1);
      else if (canAttack(s, u) || canSkill(s, u)) m.setGlow(COL.play, 0.55);
    }
    if (mode === 'target' && pending) {
      for (const t of targetsOf(pending)) {
        const friendly = t.startsWith('H') ? t === 'H0' : findUnit(s, t)?.owner === 0;
        const c = friendly ? COL.ally : COL.foe;
        const hot = hoverObj && (hoverObj.uid === t || hoverObj.hero === t);
        if (t.startsWith('H')) heroes[+t[1]].setGlow(c, hot ? 1.3 : 0.8);
        else meshes.get(t)?.setGlow(c, hot ? 1.3 : 0.85);
      }
    }
  }

  // ── positions for effects ──
  const posOf = (t) => {
    if (!t) return V(0, 0.5, 0);
    if (t.startsWith?.('H')) return heroes[+t[1]].center();
    const m = meshes.get(t);
    return m ? m.getWorldPosition(new THREE.Vector3()).add(V(0, 0.2, 0.1)) : V(0, 0.5, 0);
  };
  const sideCenter = (p) => V(0, 0.3, BOARD_Z[p]);
  function flash(color = 0xfff2d0, k = 0.5, dur = 0.5) {
    app.post.uniforms.flashColor.value.set(color);
    return tween(dur, (e) => { app.post.uniforms.flash.value = k * (1 - e); }, { ease: ease.out });
  }

  // ── event playback ──
  async function burnOut(m, { splash = true } = {}) {
    if (!m) return;
    const p = m.getWorldPosition(new THREE.Vector3());
    fx.sparks(p, { color: '#ffb050', n: 18, speed: 1.6, gravity: 1.5 });
    if (splash) fx.splash(V(p.x, 0, p.z), { size: 1.2 });
    await tween(0.65 / S(), (k) => { m.burn = k; }, { ease: ease.linear });
    removeMesh(m.uid);
  }
  function shakeMesh(m, amt = 0.08) {
    if (!m) return;
    const b = m.body;
    tween(0.35 / S(), (k, u) => { b.position.x = Math.sin(u * 40) * amt * (1 - u); }, { ease: ease.linear }).then(() => { b.position.x = 0; });
  }

  async function onEvent(e) {
    switch (e.t) {
      case 'draw': {
        const m = makeMesh(e.uid, e.p);
        m.position.copy(decks[e.p].top());
        m.rotation.set(-Math.PI / 2, 0, 0);
        m.scale.setScalar(0.62);
        if (e.p === 0) m.body.rotation.y = Math.PI;
        world.add(m);
        layoutHand(e.p, e.silent ? 0.35 : 0.45);
        if (e.p === 0) tween(0.45 / S(), (k) => { m.body.rotation.y = Math.PI * (1 - k); });
        audio.sfx('draw');
        await W(e.silent ? 0.07 : 0.22);
        break;
      }
      case 'recover': {
        const m = makeMesh(e.uid, e.p);
        m.position.copy(HERO_P[e.p]).setY(1.2); m.scale.setScalar(0.2); world.add(m);
        layoutHand(e.p, 0.5);
        fx.burst(HERO_P[e.p].clone().setY(1), { color: '#9fe0b0' });
        audio.sfx('heal');
        log(`${s.players[e.p].name} 取回「${card(e.id).name}」`);
        await W(0.35);
        break;
      }
      case 'play': {
        const d = card(e.id);
        let m = meshes.get(e.uid) ?? makeMesh(e.uid, e.p);
        if (!m.parent) handG.add(m);
        log(`${s.players[e.p].name} 打出「${d.name}」${e.target ? ` → ${tName(e.target)}` : ''}`, e.p ? 'foe' : 'me');
        if (e.p === 1) { // reveal what the opponent played
          if (m.parent !== handG) handG.attach(m);
          const rev = moveTo(m, { pos: V(-1.2, 0.2, -3.1), rot: new THREE.Euler(0, 0, 0), scale: 0.5 }, 0.4);
          tween(0.4 / S(), (k) => { m.body.rotation.y = Math.PI * (1 - k); });
          audio.sfx('pick');
          await rev;
          await W(0.75);
        }
        if (d.type === 'talisman') {
          world.attach(m);
          await moveTo(m, castSpot(), 0.35);
          m.setGlow(EL[d.el]?.color ?? '#ffd070', 1.4);
          audio.sfx('playTalisman');
          fx.burst(m.position.clone(), { color: EL[d.el]?.color ?? '#ffd070', size: 3 });
          await signature(e.id, 'play', e, m.position.clone());
          if (e.target) fx.arrowShow(m.position.clone(), EL[d.el]?.color ?? 0xffd070), fx.arrowTo(posOf(e.target));
          await W(0.35);
          fx.arrowHide();
        } else if (e.p === 0) {
          audio.sfx('pick');
        }
        manaView(e.p ? manaFoe : manaMe, { ...s.players[e.p], mana: e.mana });
        break;
      }
      case 'summon': {
        const m = meshes.get(e.uid);
        if (!m) break;
        world.attach(m);
        m.body.rotation.y = 0;
        const list = s.players[e.p].board.filter((u) => meshes.has(u.uid));
        const k = list.findIndex((u) => u.uid === e.uid);
        const slot = boardSlot(e.p, k, list.length);
        await moveTo(m, { pos: slot.pos.clone().add(V(0, 1.6, 0.3)), rot: slot.rot, scale: slot.scale * 1.15 }, 0.28);
        layoutBoard(e.p, 0.2, ease.in);
        await W(0.2);
        const d = card(e.id);
        audio.sfx('playGeneral');
        fx.ring(V(slot.pos.x, 0, BOARD_Z[e.p] + 0.3), { color: EL[d.el]?.color ?? '#c8a04a', size: 2.6 });
        fx.splash(V(slot.pos.x, 0, BOARD_Z[e.p] + 0.4), { size: 1.6 });
        await signature(e.id, 'summon', e, V(slot.pos.x, 0.2, BOARD_Z[e.p] + 0.3));
        shake = Math.max(shake, card(e.id).cost >= 5 ? 0.25 : 0.1);
        await W(0.25);
        break;
      }
      case 'wenmai': {
        layoutWenmai(e.p, 0.5);
        audio.sfx('playWenmai');
        await W(0.5);
        const i = s.players[e.p].wenmai.findIndex((u) => u.uid === e.uid);
        const sl = wmSlot(e.p, Math.max(0, i));
        fx.ring(V(sl.pos.x, 0, sl.pos.z), { color: '#7ad0a0', size: 1.6, life: 1.2 });
        fx.pillar(V(sl.pos.x, 0, sl.pos.z), { color: '#8fe0b0', h: 3, r: 0.35, life: 1.2 });
        await signature(e.id, 'play', e, V(sl.pos.x, 0.2, sl.pos.z));
        await W(0.3);
        break;
      }
      case 'wenmaiOut': {
        log(`「${card(e.id).name}」${e.why === 'burn' ? '被焚毁' : e.why === 'expire' ? '效力耗尽' : '被挤出文脉区'}`);
        await burnOut(meshes.get(e.uid));
        layoutWenmai(e.p);
        break;
      }
      case 'discard': {
        const m = meshes.get(e.uid);
        if (e.why === 'handLimit') log(`手牌已满，「${card(e.id).name}」被弃置`);
        if (m) { audio.sfx('burn'); await burnOut(m, { splash: false }); }
        layoutHand(e.p);
        break;
      }
      case 'attack': {
        const m = meshes.get(e.uid);
        log(`「${nameOf(e.uid)}」攻击 ${tName(e.target)}`, e.p ? 'foe' : 'me');
        if (!m) break;
        const home = m.position.clone(), q = m.quaternion.clone(), sc = m.scale.x;
        const tp = posOf(e.target);
        const to = home.clone().lerp(tp, 0.72).setY(home.y + 0.5);
        audio.sfx('attack');
        await moveTo(m, { pos: home.clone().add(V(0, 0.5, e.p ? -0.3 : 0.3)), rot: new THREE.Euler().setFromQuaternion(q), scale: sc * 1.08 }, 0.16);
        await moveTo(m, { pos: to }, 0.13, ease.in);
        shake = Math.max(shake, 0.14);
        fx.sparks(tp, { color: '#ffe0a0', n: 16, speed: 2.4 });
        fx.crescent(tp.clone().setY(0), { color: '#ffe8b0', r: 0.75, tube: 0.04, arc: 2.4, dir: e.p ? 1.57 : -1.57, travel: 0.6, tilt: 1.2, life: 0.32 });
        moveTo(m, { pos: home, scale: sc }, 0.3);
        break;
      }
      case 'damage': {
        const p = posOf(e.target);
        overrideHp.set(e.target, e.hp);
        const heavy = e.amount >= 5;
        fx.text(p.clone().add(V(0, 0.4, 0.2)), `-${e.amount}`, { color: e.fixed ? '#ffb070' : '#ff5a40', size: heavy ? 1.1 : 0.85 });
        if (e.blocked > 0) fx.text(p.clone().add(V(0.7, 0.1, 0.2)), `减${e.blocked}`, { color: '#a8c8ff', size: 0.5, life: 1 });
        fx.splash(V(p.x, 0, p.z + 0.2), { size: heavy ? 1.6 : 1.1, color: 0x1a0a08 });
        fx.light(p, { color: '#ff9060', power: heavy ? 26 : 12, dist: 9, life: 0.28, rise: 0.04 });
        if (heavy) {
          fx.shock(p, { amp: 0.8, life: 0.42, aberr: 1.1 });
          fx.shockRing(V(p.x, 0, p.z), { color: '#ffa070', size: 5.5, life: 0.4 });
          fx.debris(V(p.x, 0.3, p.z), { color: '#6a4a3a', n: 6, speed: 3.6, size: 0.12, life: 0.7 });
        }
        audio.sfx('hit', { heavy });
        if (e.target.startsWith('H')) {
          refreshHeroes(); shake = Math.max(shake, heavy ? 0.42 : 0.2);
          fx.shock(p, { amp: heavy ? 1.2 : 0.6, life: 0.5, aberr: heavy ? 1.8 : 0.9, streak: heavy ? 0.45 : 0 });
          if (e.target === 'H0') flash(0xff3020, 0.22, 0.45);
        }
        else { const m = meshes.get(e.target); shakeMesh(m); if (m) refreshPlate(m); }
        await W(0.28);
        break;
      }
      case 'heal': {
        const p = posOf(e.target);
        overrideHp.set(e.target, e.hp);
        fx.text(p.clone().add(V(0, 0.4, 0.2)), `+${e.amount}`, { color: '#8fe08a', size: 0.8 });
        fx.burst(p, { color: '#a8f0a0', size: 1.6 });
        audio.sfx('heal');
        if (e.target.startsWith('H')) refreshHeroes(); else { const m = meshes.get(e.target); if (m) refreshPlate(m); }
        await W(0.25);
        break;
      }
      case 'die': {
        log(`「${card(e.id).name}」陨落`, 'dim');
        audio.sfx('die');
        overrideHp.delete(e.uid);
        const dp = posOf(e.uid).clone().setY(0);
        fx.shockRing(dp, { color: '#c8907a', size: 5, life: 0.5 });
        fx.debris(dp.clone().setY(0.4), { color: '#4a3a30', n: 9, speed: 4, size: 0.14, life: 0.9 });
        fx.light(dp, { color: '#ff7040', power: 22, dist: 9, life: 0.4 });
        await burnOut(meshes.get(e.uid));
        layoutBoard(e.p);
        await W(0.1);
        break;
      }
      case 'status': {
        const m = meshes.get(e.uid);
        if (m) refreshPlate(m);
        if (!e.on) { if (e.k === 'ctrlCap') fx.text(posOf(e.uid).add(V(0, 0.6, 0)), '挣脱控制', { color: '#8fe0a8', size: 0.6 }); break; }
        const [txt, col] = ST_TEXT[e.k] ?? [STATUS_ZH[e.k] ?? e.k, '#fff'];
        fx.text(posOf(e.uid).add(V(0, 0.7, 0)), txt, { color: col, size: 0.6, life: 1.1 });
        audio.sfx(e.k === 'stun' ? 'stun' : NEG_ST.has(e.k) ? 'debuff' : 'buff');
        await W(0.2);
        break;
      }
      case 'buff': {
        const parts = [];
        if (e.atk) parts.push(`${e.atk > 0 ? '+' : ''}${e.atk}攻`);
        if (e.def) parts.push(`${e.def > 0 ? '+' : ''}${e.def}防`);
        fx.text(posOf(e.uid).add(V(0, 0.7, 0)), parts.join(' '), { color: (e.atk ?? 0) + (e.def ?? 0) >= 0 ? '#ffe08a' : '#c0a0a0', size: 0.55 });
        const m = meshes.get(e.uid); if (m) refreshPlate(m);
        await W(0.12);
        break;
      }
      case 'skill': {
        const d = card(e.id);
        log(`「${d.name}」施展【${d.skill.name}】${e.target ? ` → ${tName(e.target)}` : ''}`, e.p ? 'foe' : 'me');
        const m = meshes.get(e.uid);
        m?.setGlow('#ffd070', 1.6);
        fx.text(posOf(e.uid).add(V(0, 1, 0)), d.skill.name, { color: '#ffe6a0', size: 0.75, life: 1.4 });
        if (!SIGNATURE[e.id]?.skill) fx.pillar(posOf(e.uid).setY(0), { color: EL[d.el]?.color ?? '#ffd070', h: 4, r: 0.5, life: 1 });
        audio.sfx('buff');
        await signature(e.id, 'skill', e, posOf(e.uid));
        manaView(e.p ? manaFoe : manaMe, { ...s.players[e.p], mana: e.mana });
        if (e.target) { fx.arrowShow(posOf(e.uid), 0xffd070); fx.arrowTo(posOf(e.target)); }
        await W(0.55);
        fx.arrowHide();
        break;
      }
      case 'counter': {
        fx.text(posOf(e.uid).add(V(-0.5, 1, 0)), '克制', { color: '#ff9a40', size: 0.6 });
        meshes.get(e.uid)?.setGlow('#ff3a20', 1.4);
        const src = e.from && findAny(s, e.from);
        const el = src && card(src.u.id).el;
        if (el) fx.element(el, posOf(e.uid).clone().setY(0), { h: 1.8, r: 0.45, n: 4, life: 1, arms: 3 });
        audio.sfx('counter');
        break;
      }
      case 'dodge': fx.text(posOf(e.uid).add(V(0, 0.8, 0)), '闪避', { color: '#a8d0f0', size: 0.7 }); audio.sfx('mist'); await W(0.25); break;
      case 'resist': fx.text(posOf(e.uid).add(V(0, 0.8, 0)), '免疫', { color: '#ffe08a', size: 0.7 }); audio.sfx('buff'); await W(0.2); break;
      case 'bond': {
        const B = BONDS[e.bond];
        log(`${s.players[e.p].name} 羁绊激活：${B.name}·${B.title}${e.level > 1 ? `（${e.level} 阶）` : ''}`, 'gold');
        audio.sfx('bond');
        fx.pillar(sideCenter(e.p).setY(0), { color: '#ffd88a', h: 9, r: 1.6, life: 2.2 });
        fx.charge(sideCenter(e.p).setY(0), { color: '#ffe0a0', r: 5, life: 0.6, h: 1.2, core: false });
        fx.shock(sideCenter(e.p), { amp: 0.9, life: 0.7, aberr: 1.2, streak: 0.6 });
        fx.shockRing(sideCenter(e.p).setY(0), { color: '#ffd88a', size: 12, life: 0.8 });
        fx.ring(sideCenter(e.p), { color: '#ffd88a', size: 6, life: 1.4 });
        flash(0xffe0a0, 0.25, 0.8);
        const first = e.p === 0 && !save.data.seenBonds.includes(e.bond);
        if (first) { save.data.seenBonds.push(e.bond); save.write(); }
        await banner(`${B.title}`, first ? B.line : `${B.name}${e.level > 1 ? ` · ${e.level} 阶` : ''}`, { cls: 'bond', ms: (first ? 3000 : 1500) / S() });
        break;
      }
      case 'resonance': {
        const R = RESONANCES[e.kind];
        log(`${s.players[e.p].name} 五行共鸣：${R.name}`, 'gold');
        const col = EL[e.kind]?.color ?? '#ffd88a';
        audio.sfx('resonance', { el: e.kind });
        fx.sigil(sideCenter(e.p), EL[e.kind] ? e.kind : e.kind === 'barrier' ? 'barrier' : e.kind === 'yinyang' ? 'yinyang' : 'earth', { size: 6, life: 2.4 });
        if (EL[e.kind]) {
          fx.element(e.kind, sideCenter(e.p).setY(0), { life: 1.8 });
          for (const u of s.players[e.p].board) if (card(u.id).el === e.kind) fx.element(e.kind, posOf(u.uid).clone().setY(0), { h: 2, r: 0.5, n: 4, life: 1.3 });
        } else if (e.kind === 'barrier') {
          for (const el of EL_KEYS) fx.element(el, sideCenter(e.p).setY(0).add(V((EL_KEYS.indexOf(el) - 2) * 2.2, 0, 0)), { h: 2.2, r: 0.5, n: 4, life: 1.4 });
        }
        flash(col, 0.3, 0.8);
        shake = Math.max(shake, 0.2);
        await banner(R.name, R.text, { cls: 'res', ms: 1700 / S() });
        break;
      }
      case 'resonanceEnd': {
        const R = RESONANCES[e.kind];
        if (R) toast(`${s.players[e.p].name}的「${R.name}」${e.why === 'countered' ? '被反制' : e.why === 'yinyang' ? '被阴阳驱散' : '消散'}`);
        break;
      }
      case 'mana': {
        manaView(e.p ? manaFoe : manaMe, { ...s.players[e.p], mana: e.mana });
        fx.text(HERO_P[e.p].clone().setY(1.8), `+${e.gain} 灵力`, { color: '#8fd8ff', size: 0.55 });
        audio.sfx('mana');
        break;
      }
      case 'fx': await onFx(e); break;
      case 'turn': {
        overrideHp.clear();
        const mine = e.p === 0;
        audio.sfx('turn', { mine });
        log(`—— 第 ${s.players[e.p].turns} 回合 · ${s.players[e.p].name} ——`, 'turn');
        manaView(mine ? manaMe : manaFoe, { ...s.players[e.p], mana: e.mana, maxMana: e.maxMana });
        await banner(mine ? '我方回合' : '对手回合', mine ? `灵力 ${e.mana}` : '', { cls: mine ? 'turn-me' : 'turn-foe', ms: 800 / S() });
        break;
      }
      case 'costMod': toast('一张文脉卡费用 -1'); break;
      default: break;
    }
  }

  /**
   * Play a card's signature flourish (src/game/cardvfx.js). Everything is optional: a card with no
   * entry just keeps the generic summon ring / skill pillar.
   */
  async function signature(id, phase, e, home) {
    const C = card(id);
    const spec = SIGNATURE[id]?.[phase] ?? murkSignature(id, phase, C.el, C.type);
    if (!spec) return;
    const p = e.p ?? 0;
    const at = (where) => {
      if (where === 'target' && e.target) return posOf(e.target);
      if (where === 'foe') return sideCenter(1 - p).setY(0.5);
      if (where === 'mine') return sideCenter(p).setY(0.5);
      if (where === 'hero') return HERO_P[p].clone().setY(0.9);
      if (where === 'foeHero') return HERO_P[1 - p].clone().setY(0.9);
      return home.clone();
    };
    if (spec.flash) flash(new THREE.Color(spec.flash[0]).getHex(), spec.flash[1], 0.7);
    if (spec.shake) shake = Math.max(shake, spec.shake);
    if (spec.sfx) audio.sfx(spec.sfx, spec.el ? { el: spec.el } : {});
    for (const l of spec.layers) {
      const q = at(l.at);
      switch (l.shape) {
        case 'burst': fx.burst(q.clone().setY(q.y + 0.4), { color: l.color, size: l.size ?? 2.4 }); break;
        case 'ring': fx.ring(q.clone().setY(0.04), { color: l.color, size: l.r ?? 2.6, life: l.life ?? 1 }); break;
        case 'rings': for (let k = 0; k < (l.n ?? 3); k++) fx.ring(q.clone().setY(0.04 + k * 0.01), { color: l.color, size: (l.r ?? 2.4) + k * 1.1, life: (l.life ?? 1) + k * 0.15 }); break;
        case 'pillar': fx.pillar(q.clone().setY(0), { color: l.color, h: l.h ?? 4.5, r: l.r ?? 0.5, life: l.life ?? 1.3 }); break;
        case 'dome': fx.dome(q.clone().setY(0.05), { color: l.color, r: l.r ?? 1.6, life: l.life ?? 1.1 }); break;
        case 'orbit': fx.orbit(q.clone().setY(0.2), { color: l.color, n: l.n ?? 14, r: l.r ?? 0.9, life: l.life ?? 1.4, turns: l.turns ?? 1.5 }); break;
        case 'petals': fx.petals(q.clone().setY(0.2), { color: l.color, n: l.n ?? 16, spread: l.spread ?? 1.8, life: l.life ?? 1.8 }); break;
        case 'ribbon': fx.ribbon(q.clone().setY(0), { color: l.color, n: l.n ?? 3, len: l.len ?? 2.6, life: l.life ?? 1.1 }); break;
        case 'rain': fx.rain(q.clone().setY(0.1), { color: l.color, n: l.n ?? 26, spread: l.spread ?? 3, speed: l.speed ?? 6, life: l.life ?? 1 }); break;
        case 'shards': fx.shards(q.clone().setY(q.y + 0.3), { color: l.color, n: l.n ?? 14, size: l.size ?? 0.18 }); break;
        case 'sparks': fx.sparks(q.clone().setY(q.y + 0.3), { color: l.color, n: l.n ?? 24, speed: l.speed ?? 3 }); break;
        case 'beam': fx.beam(home.clone().setY(home.y + 0.4), q.clone().setY(q.y + 0.3), { color: l.color, w: l.w ?? 0.07 }); break;
        case 'splash': fx.splash(q.clone().setY(0), { size: l.size ?? 2 }); break;
        case 'fire': fx.fire(q.clone()); break;
        case 'lightning': fx.lightning(q.clone()); break;
        case 'flame': fx.flameColumn(q.clone().setY(0), { color: l.color, color2: l.color2, h: l.h ?? 3, r: l.r ?? 0.7, life: l.life ?? 1.5 }); break;
        case 'waterColumn': fx.waterColumn(q.clone().setY(0), { color: l.color, h: l.h ?? 2.8, r: l.r ?? 0.9, life: l.life ?? 1.4 }); break;
        case 'vortex': fx.vortex(q.clone().setY(0), { color: l.color, h: l.h ?? 3.4, r: l.r ?? 1.3, arms: l.n ?? 5, life: l.life ?? 1.6 }); break;
        case 'spikes': fx.spikes(q.clone().setY(0), { color: l.color, n: l.n ?? 7, r: l.r ?? 1.8, h: l.h ?? 1.5, life: l.life ?? 1.5 }); break;
        case 'blades': fx.bladeStorm(q.clone().setY(0), { color: l.color, n: l.n ?? 9, life: l.life ?? 0.9 }); break;
        case 'vines': fx.vines(q.clone().setY(0), { color: l.color, n: l.n ?? 5, h: l.h ?? 2.6, r: l.r ?? 1.1, life: l.life ?? 1.8 }); break;
        case 'bolt': fx.bolt(q.clone().setY(0), { color: l.color, life: l.life ?? 0.55 }); break;
        case 'element': fx.element(l.el, q.clone().setY(0), { h: l.h, r: l.r, n: l.n, life: l.life }); break;
        case 'glyphs': fx.glyphs(q.clone().setY(q.y + 0.3), l.glyphs, { color: l.color, spread: l.spread ?? 1.8 }); break;
        case 'text': fx.text(q.clone().setY(q.y + 1.2), l.text, { color: l.color, size: l.size ?? 0.7 }); break;
        default: break;
      }
    }
    if (spec.wait) await W(spec.wait);
  }

  /** Shared presentation for a chapter boss's recurring passive. */
  async function bossCue(e, name, sub, tint, ringColor, glyph) {
    log(`${s.players[e.p].name}发动「${name}」`, 'foe');
    flash(tint, 0.5, 1.1);
    app.post.uniforms.desat.value = 0.6;
    tween(1.5, (k) => { app.post.uniforms.desat.value = 0.6 * (1 - k); });
    fx.ring(sideCenter(1 - e.p), { color: ringColor, size: 9, life: 1.3 });
    fx.glyphs(HERO_P[e.p].clone().setY(1.2), glyph, { color: ringColor, spread: 3 });
    audio.sfx('die');
    shake = 0.32;
    await banner(name, sub, { cls: 'danger', ms: 1300 / S() });
  }

  async function onFx(e) {
    switch (e.kind) {
      case 'kaitian': {
        const p = posOf(e.uid);
        fx.pillar(p.clone().setY(0), { color: '#ffd070', h: 12, r: 0.9, life: 1.6 });
        flash(0xffe6a0, 0.6, 0.9);
        shake = 0.45;
        audio.sfx('thunder');
        fx.ring(sideCenter(1 - e.p), { color: '#ffd070', size: 8, life: 1.1 });
        fx.text(p.clone().add(V(0, 1.4, 0)), '开天辟地', { color: '#ffe6a0', size: 1.1, life: 1.6 });
        await W(0.5);
        break;
      }
      case 'lit': fx.fire(posOf(e.uid)); fx.text(posOf(e.uid).add(V(0, 1, 0)), '烛照', { color: '#ffb060', size: 0.6 }); audio.sfx('burn'); await W(0.3); break;
      case 'fentian': {
        audio.sfx('burn');
        flash(0xff6020, 0.3, 0.6);
        for (const u of s.players[1 - e.p].board) fx.flameColumn(posOf(u.uid).clone().setY(0), { h: 2.6, r: 0.6, life: 1.2 });
        shake = Math.max(shake, 0.25);
        await W(0.4);
        break;
      }
      case 'thunder': fx.bolt(posOf(e.target).clone().setY(0)); flash(0xf0f4ff, 0.55, 0.4); audio.sfx('thunder'); shake = 0.4; await W(0.4); break;
      case 'mist': fx.splash(posOf(e.target).setY(0), { size: 2.2 }); audio.sfx('mist'); await W(0.3); break;
      case 'kunlun': fx.pillar(HERO_P[e.p].clone().setY(0), { color: '#a0e8ff', h: 6, r: 1 }); fx.text(HERO_P[e.p].clone().setY(2.2), '昆仑镜照', { color: '#bfefff', size: 0.7 }); audio.sfx('resonance', { el: 'water' }); await W(0.5); break;
      case 'freeTalisman': fx.text(HERO_P[e.p].clone().setY(2.2), '下一张符箓免费', { color: '#ffe6a0', size: 0.6 }); await W(0.3); break;
      case 'chaos': {
        log('沉迹怨灵施放「混沌之压」', 'foe');
        flash(0x301040, 0.5, 1.0);
        app.post.uniforms.desat.value = 0.6;
        tween(1.4, (k) => { app.post.uniforms.desat.value = 0.6 * (1 - k); });
        fx.ring(sideCenter(1 - e.p), { color: '#6a2a8a', size: 9, life: 1.3 });
        audio.sfx('die'); shake = 0.4;
        await banner('混沌之压', '我方灵将防御 -1，并受 1 点伤害', { cls: 'danger', ms: 1300 / S() });
        break;
      }
      case 'poem': {
        const p = e.aoe ? sideCenter(1 - e.p).setY(0.6) : posOf(e.uid);
        fx.glyphs(p, e.aoe ? '君不见黄河之水天上来' : '斗酒诗百篇', { spread: e.aoe ? 4 : 1.4 });
        if (e.aoe) { fx.text(posOf(e.uid).add(V(0, 1.4, 0)), '将进酒', { color: '#ffe6a0', size: 0.9 }); flash(0xffe6a0, 0.3, 0.6); }
        audio.sfx('poem');
        await W(e.aoe ? 0.6 : 0.3);
        break;
      }
      case 'river': {
        const p = posOf(e.target);
        fx.glyphs(posOf(e.target), '大江东去', { color: '#bfe4ff', spread: 1.2 });
        fx.ring(p.clone().setY(0), { color: '#6ab0ff', size: 3.5, life: 1 });
        fx.sparks(p, { color: '#9fd0ff', n: 30, speed: 3 });
        audio.sfx('mist');
        await W(0.4);
        break;
      }
      case 'string':
        fx.ring(sideCenter(1 - e.p), { color: '#d8c080', size: 7, life: 1 });
        fx.text(sideCenter(1 - e.p).setY(1.4), '断弦', { color: '#e8d8a0', size: 0.7 });
        audio.sfx('snap');
        await W(0.35);
        break;
      case 'ink': fx.splash(posOf(e.target).setY(0), { size: 1.8 }); audio.sfx('mist'); await W(0.2); break;
      case 'sword': {
        const p = posOf(e.target);
        fx.sparks(p, { color: '#ff9a60', n: 34, speed: 4, gravity: -2 });
        fx.text(p.clone().add(V(0, 1.2, 0)), '剑器', { color: '#ffc0a0', size: 0.7 });
        audio.sfx('attack');
        await W(0.3);
        break;
      }
      case 'snow': {
        const p = e.uid ? posOf(e.uid) : sideCenter(e.p).setY(1);
        fx.sparks(p.clone().setY(3.2), { color: '#eaf0ff', n: 40, speed: 1.6, gravity: -2.2, life: 1.2 });
        fx.glyphs(p, '六月飞雪', { color: '#e8eeff', spread: 2.4 });
        audio.sfx('debuff');
        await W(0.35);
        break;
      }
      case 'huanhun': {
        const p = posOf(e.uid);
        fx.pillar(p.clone().setY(0), { color: '#ff9ab8', h: 5, r: 0.7, life: 1.2 });
        fx.glyphs(p, '生者可以死', { color: '#ffc0d4', spread: 1.6 });
        audio.sfx('bond');
        await W(0.45);
        break;
      }
      case 'shuimo':
        fx.ring(sideCenter(1 - e.p), { color: '#8ab4d8', size: 8, life: 1.4 });
        fx.text(sideCenter(1 - e.p).setY(1.4), '冷板慢拍', { color: '#cfe4f4', size: 0.7 });
        audio.sfx('stun');
        await W(0.35);
        break;
      case 'embroider':
        fx.sparks(HERO_P[e.p].clone().setY(1.2), { color: '#e8b0c0', n: 30, speed: 2.4, gravity: -1 });
        fx.text(HERO_P[e.p].clone().setY(2.2), '双面绣', { color: '#f4d0dc', size: 0.7 });
        audio.sfx('buff');
        await W(0.3);
        break;
      case 'curtain': fx.splash(posOf(e.target).setY(0), { size: 2.4, color: 0x4a3a2a }); audio.sfx('stun'); await W(0.25); break;
      case 'juexiang': {
        log('空台绝响宣告「散场」', 'foe');
        flash(0x201a14, 0.5, 1.1);
        app.post.uniforms.desat.value = 0.7;
        tween(1.6, (k) => { app.post.uniforms.desat.value = 0.7 * (1 - k); });
        fx.ring(sideCenter(1 - e.p), { color: '#c8b088', size: 9, life: 1.4 });
        fx.glyphs(HERO_P[e.p].clone().setY(1.2), '眼看他楼塌了', { color: '#e0d0b0', spread: 3 });
        audio.sfx('die');
        shake = 0.35;
        await banner('散场', '我方灵将技能被封印 1 回合，空台绝响多得 1 点灵力', { cls: 'danger', ms: 1300 / S() });
        break;
      }
      // chapters 4–10: card flourishes keyed off c.fx(kind) in cardfx.js
      case 'tan': fx.glyphs(posOf(e.uid), '有教无类', { color: '#ffe2a0', spread: 1.6 }); audio.sfx('bond'); await W(0.3); break;
      case 'water': fx.ring(posOf(e.uid).setY(0), { color: '#7ab8e0', size: 4, life: 1.1 }); fx.glyphs(posOf(e.uid), '上善若水', { color: '#bfe4ff' }); audio.sfx('mist'); await W(0.35); break;
      case 'kun': fx.glyphs(posOf(e.uid).add(V(0, 0.6, 0)), '鲲鹏', { color: '#cfe8d8', spread: 2.2, size: 0.8 }); fx.sparks(posOf(e.uid), { color: '#9fd0b0', n: 26, speed: 3 }); audio.sfx('buff'); await W(0.3); break;
      case 'qiusuo': fx.glyphs(posOf(e.uid), '上下求索', { color: '#c8b0e8', spread: 1.8 }); audio.sfx('poem'); await W(0.35); break;
      case 'shiji': fx.glyphs(posOf(e.uid), '究天人之际', { color: '#e8d8a0', spread: 2 }); audio.sfx('bond'); await W(0.35); break;
      case 'road': fx.ring(posOf(e.uid).setY(0), { color: '#e8c070', size: 4.5, life: 1.2 }); fx.text(posOf(e.uid).add(V(0, 1.2, 0)), '凿空', { color: '#ffe6a0', size: 0.8 }); audio.sfx('buff'); await W(0.35); break;
      case 'lanting': fx.glyphs(posOf(e.uid), '游目骋怀', { color: '#d8e8f0', spread: 1.8 }); audio.sfx('poem'); await W(0.35); break;
      case 'guangling': fx.ring(sideCenter(1 - e.p), { color: '#d8c890', size: 8, life: 1.2 }); fx.text(sideCenter(1 - e.p).setY(1.4), '广陵散', { color: '#e8d8a0', size: 0.8 }); audio.sfx('snap'); await W(0.4); break;
      case 'feitian': { const p = posOf(e.uid); fx.sparks(p, { color: '#ffc880', n: 34, speed: 3, gravity: -1 }); fx.glyphs(p, '飞天', { color: '#ffd8a0', spread: 1.6 }); audio.sfx('buff'); await W(0.3); break; }
      case 'dream': fx.glyphs(posOf(e.uid), '满纸荒唐言', { color: '#c8c0e0', spread: 2 }); audio.sfx('poem'); await W(0.35); break;
      case 'sky': fx.pillar(posOf(e.uid).setY(0), { color: '#bcd0ff', h: 7, r: 0.8, life: 1.4 }); audio.sfx('resonance', { el: 'metal' }); await W(0.4); break;
      // chapter bosses
      case 'biantong': await bossCue(e, '辩锋', '诡辩巨影抽 2 张牌，我方灵将 ATK -1', 0x3a3050, '#b0a0e0', '白马非马'); break;
      case 'zhaohun': await bossCue(e, '招魂', '从弃牌堆召回 1 张灵将，并回复 2 点生命', 0x2a2440, '#d8b0f0', '魂兮归来'); break;
      case 'fenshu': await bossCue(e, '焚典', '我方灵将受 1 点伤害，并烧掉 1 张手牌', 0x3a1408, '#ff9040', '焚书'); break;
      case 'qingtan': await bossCue(e, '清谈', '我方灵将技能被封印 1 回合', 0x223040, '#c8d8e8', '有无之辩'); break;
      case 'liusha': await bossCue(e, '掩埋', '我方灵将受 1 点伤害并损失 1 点防御', 0x3a2c1c, '#e8c890', '流沙'); break;
      case 'jinhui': await bossCue(e, '禁毁', '对方抽 2 张牌，我方灵将防御 -1', 0x2a1a10, '#ffb070', '禁毁书目'); break;
      case 'wangchuan': await bossCue(e, '忘川', '我方灵将 ATK -1，遗忘之渊回复 2 点生命', 0x080c18, '#8aa0c8', '忘'); break;
      case 'chenzhou': await bossCue(e, '覆舟', '我方灵将受 1 点伤害且 ATK -1，对方回复 2 点生命', 0x0a1828, '#9ac0e0', '覆舟'); break;
      case 'wuren': await bossCue(e, '合卷', '烧掉我方 1 张手牌，我方灵将 ATK -1', 0x140e08, '#e8c890', '合卷'); break;
      // 第十一 / 十二章卡牌
      case 'sail': { const p = posOf(e.uid); fx.ring(p.clone().setY(0), { color: '#8ac0e0', size: 5, life: 1.3 }); fx.glyphs(p, '涉沧溟', { color: '#cfe4ff', spread: 2 }); audio.sfx('buff'); await W(0.4); break; }
      case 'kiln': { const p = posOf(e.uid); fx.fire(p); fx.text(p.clone().add(V(0, 1.2, 0)), '入窑一色', { color: '#ffd0a0', size: 0.7 }); await W(0.35); break; }
      case 'tianyi': { const p = posOf(e.uid); fx.ring(p.clone().setY(0), { color: '#7ab0c8', size: 4.5, life: 1.2 }); fx.glyphs(p, '天一生水', { color: '#bfe4f4', spread: 1.8 }); audio.sfx('buff'); await W(0.4); break; }
      case 'catalog': fx.glyphs(posOf(e.uid), '经史子集', { color: '#e8d8a0', spread: 1.8 }); audio.sfx('bond'); await W(0.35); break;
      case 'oracle': { const p = posOf(e.uid); fx.sparks(p, { color: '#ffb060', n: 26, speed: 2.6 }); fx.glyphs(p, '卜', { color: '#ffd8a0', spread: 1.2 }); audio.sfx('burn'); await W(0.35); break; }
      case 'nishang': {
        log('霓裳断魂奏响「曲终」', 'foe');
        flash(0x203060, 0.45, 1.1);
        app.post.uniforms.desat.value = 0.5;
        tween(1.4, (k) => { app.post.uniforms.desat.value = 0.5 * (1 - k); });
        fx.ring(sideCenter(1 - e.p), { color: '#8aa0e0', size: 9, life: 1.4 });
        fx.glyphs(HERO_P[e.p].clone().setY(1.2), '惊破霓裳羽衣曲', { color: '#c8d4ff', spread: 3 });
        audio.sfx('snap');
        await banner('曲终', '我方灵将 ATK -2（1 回合），霓裳断魂回复 3 点生命', { cls: 'danger', ms: 1300 / S() });
        break;
      }
      default: break;
    }
  }

  let playing = Promise.resolve();
  function play(evs) {
    playing = playing.then(async () => {
      for (const e of evs) { if (finished) return; await onEvent(e); }
      overrideHp.clear();
      layoutAll();
      refreshHUD();
    });
    return playing;
  }

  // ── actions ──
  async function doAction(a) {
    if (s.over || finished) return;
    mode = 'busy';
    cancelSelect(false);
    refreshHighlights();
    refreshHUD();
    let ev;
    try { ev = act(s, a); } catch (err) { console.warn(err); toast('此举不可行'); mode = 'idle'; refreshHighlights(); return; }
    await play(ev);
    if (s.over || s.active !== 0) { timerOn = false; turnResolve?.(); turnResolve = null; return; }
    mode = 'idle';
    refreshHUD();
    refreshHighlights();
  }
  function endTurn() {
    if (mode === 'busy' || s.active !== 0 || s.over) return;
    hint.classList.remove('show');
    doAction({ type: 'end' });
  }
  function useSkill() {
    const u = findUnit(s, pending?.uid ?? skillBtn.dataset.uid);
    if (!u || !canSkill(s, u)) return;
    audio.sfx('click');
    const tg = skillTargets(s, u);
    if (!tg) return doAction({ type: 'skill', uid: u.uid });
    pending = { kind: 'skill', uid: u.uid, targets: tg };
    mode = 'target';
    fx.arrowShow(posOf(u.uid), 0xffd070);
    toast(`选择【${card(u.id).skill.name}】的目标`, { ms: 1200 });
    refreshHighlights();
  }
  function refreshSkillBtn() {
    const u = pending && pending.kind !== 'play' ? findUnit(s, pending.uid) : null;
    if (u && u.owner === 0 && canSkill(s, u) && mode !== 'busy') {
      const sk = card(u.id).skill;
      skillBtn.innerHTML = '';
      skillBtn.append(h('b', { text: `施展【${sk.name}】` }), h('span', { text: `${skillCost(s, u)} 灵力 · ${sk.text}` }));
      skillBtn.dataset.uid = u.uid;
      skillBtn.classList.add('show');
    } else skillBtn.classList.remove('show');
  }
  function cancelSelect(redraw = true) {
    pending = null; selHand = null;
    if (mode === 'target') mode = 'idle';
    fx.arrowHide();
    if (redraw) { layoutHand(0, 0.2); refreshHighlights(); refreshSkillBtn(); }
  }
  function playReason(u) {
    const P = s.players[0], d = card(u.id);
    if (costOf(s, 0, u) > P.mana) return `灵力不足（需要 ${costOf(s, 0, u)}）`;
    if (d.type === 'general' && P.board.length >= RULES.MAX_BOARD) return '场上灵将已满（5）';
    if (d.target === 'enemyGeneral') return '没有可指定的敌方灵将';
    if (d.target === 'friendlyGeneral') return '没有可指定的我方灵将';
    return '现在不能打出';
  }
  function attackReason(u) {
    if (u.sleep) return '刚召唤的灵将下回合才能攻击';
    if (u.st.some((x) => x.k === 'stun')) return '眩晕中，无法行动';
    if (s.players[0].attacksUsed >= RULES.MAX_ATTACKS) return `本回合攻击次数已用完（${RULES.MAX_ATTACKS}）`;
    if (u.attacks > 0) return '本回合已攻击';
    return '无法攻击';
  }
  function beginPlay(u) {
    const tg = playTargets(s, 0, u);
    if (tg && tg.length) {
      pending = { kind: 'play', uid: u.uid, targets: tg, optional: card(u.id).target === 'friendlyGeneralOpt' };
      selHand = u.uid;
      mode = 'target';
      layoutHand(0, 0.2);
      setTimeout(() => { if (pending?.uid === u.uid) fx.arrowShow(posOf(u.uid), 0x7fe0a0); }, 150);
      refreshHighlights();
      return true;
    }
    return false;
  }

  // ── input ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
  let lastPointer = { x: 0, y: 0 };
  function setNdc(ev) {
    const r = app.renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    lastPointer = { x: ev.clientX, y: ev.clientY, h: r.height };
  }
  function pick() {
    ray.setFromCamera(ndc, camera);
    const objs = [];
    for (const m of meshes.values()) { const inf = info.get(m.uid); if (inf && !(inf.p === 1 && inf.zone === 'hand')) objs.push(m.hit); }
    for (const hm of heroes) objs.push(hm.hit);
    const hit = ray.intersectObjects(objs, false)[0];
    if (!hit) return null;
    const o = hit.object;
    if (o.userData.hero) return { hero: `H${o.userData.hero.heroIndex}` };
    const cm = o.userData.card;
    return cm ? { uid: cm.uid, ...info.get(cm.uid) } : null;
  }
  const tablePoint = () => { ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(tablePlane, new THREE.Vector3()) ?? V(0, 0.35, 0); };
  const isTarget = (o) => o && pending && targetsOf(pending).includes(o.uid ?? o.hero);

  let detailTimer = 0, detailFor = null;
  function showDetail(o) {
    const key = o ? o.uid ?? o.hero : null;
    if (key === detailFor) return;
    detailFor = key;
    clearTimeout(detailTimer);
    if (!o) { detail.classList.remove('show'); return; }
    detailTimer = setTimeout(() => {
      clear(detail);
      if (o.hero) {
        const i = +o.hero[1], P = s.players[i];
        detail.append(h('div.info', h('div.info-head', h('span.info-name', { text: P.name }), h('span.info-tags', { text: '主将' })),
          h('div.info-meta', { text: `生命 ${P.hp}/${P.maxHp}　手牌 ${P.hand.length}　牌库 ${P.deck.length}　文脉 ${P.wenmai.length}/6` }),
          h('div.info-text', { text: heroReduction(s, i) ? `每次受伤减免 ${heroReduction(s, i)}（单次至少 2 点）` : '单次受伤至少 2 点。牌库耗尽而需抽牌时判负。' }),
          PASSIVE_ZH[P.passive]
            ? h('div.info-skill', h('b', { text: `【${PASSIVE_ZH[P.passive].name}】` }), ` 每 ${PASSIVE_ZH[P.passive].every} 个自身回合：${PASSIVE_ZH[P.passive].foe}`) : null));
      } else {
        const f = findAny(s, o.uid);
        if (!f) return;
        const u = f.u;
        const live = f.zone === 'board' ? unitView(s, u) : null;
        detail.append(faceEl(u.id, u.grade, { w: 200 }), cardInfo(u.id, u.grade, { live, cost: f.zone === 'hand' && f.P.i === 0 ? costOf(s, 0, u) : null }));
      }
      detail.classList.add('show');
    }, o.zone === 'hand' ? 350 : 200);
  }

  function onMove(ev) {
    setNdc(ev);
    if (finished) return;
    const o = pick();
    if (press && !drag && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 12) {
      const u = s.players[0].hand.find((x) => x.uid === press.uid);
      if (u && canPlay(s, 0, u)) {
        if (!beginPlay(u)) { drag = { uid: u.uid }; selHand = u.uid; showDetail(null); }
      }
      press = null;
    }
    if (drag) {
      const m = meshes.get(drag.uid);
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 3.0;
      if (m) moveTo(m, { pos: V(ndc.x * t * camera.aspect, ndc.y * t, -3.0), rot: new THREE.Euler(0, 0, 0), scale: 0.55 }, 0);
      const above = ev.clientY < lastPointer.h * 0.7;
      m?.setGlow(above ? COL.sel : COL.play, above ? 1.4 : 0.6);
      return;
    }
    const prevHover = hoverUid;
    hoverUid = o && o.zone === 'hand' && o.p === 0 && mode !== 'target' ? o.uid : null;
    if (hoverUid !== prevHover) { layoutHand(0, 0.18); if (hoverUid) audio.sfx('hover'); }
    const prevObj = hoverObj;
    hoverObj = o;
    if (mode === 'target') {
      fx.arrowTo(isTarget(o) ? posOf(o.uid ?? o.hero) : tablePoint());
      if ((prevObj?.uid ?? prevObj?.hero) !== (o?.uid ?? o?.hero)) refreshHighlights();
    }
    showDetail(o);
    app.renderer.domElement.style.cursor = o && (o.p === 0 || isTarget(o)) ? 'pointer' : 'default';
  }
  function onDown(ev) {
    audio.unlock();
    setNdc(ev);
    if (finished || paused) return;
    if (ev.button === 2) { cancelSelect(); return; }
    if (mode === 'busy' || s.active !== 0 || cfg.autoplay) return;
    const o = pick();
    if (mode === 'target') {
      if (isTarget(o)) {
        const a = { type: pending.kind, uid: pending.uid, target: o.uid ?? o.hero };
        audio.sfx('click');
        doAction(a);
        return;
      }
      if (pending.kind === 'play' && o?.uid === pending.uid && pending.optional) { doAction({ type: 'play', uid: pending.uid }); return; }
      if (pending.kind !== 'play' && o?.uid === pending.uid) return;   // re-clicked the attacker: keep aiming
      audio.sfx('back');
      cancelSelect();
      if (!o || o.p !== 0) return;
    }
    if (!o) { if (selHand) { const u = s.players[0].hand.find((x) => x.uid === selHand); if (u && canPlay(s, 0, u) && ev.clientY < lastPointer.h * 0.7) { doAction({ type: 'play', uid: u.uid }); return; } cancelSelect(); } return; }
    if (o.p === 0 && o.zone === 'hand') { press = { uid: o.uid, x: ev.clientX, y: ev.clientY }; return; }
    if (o.p === 0 && o.zone === 'board') {
      const u = findUnit(s, o.uid);
      if (selHand) cancelSelect();
      const ca = canAttack(s, u), cs = canSkill(s, u);
      if (!ca && !cs) { toast(attackReason(u)); audio.sfx('error'); return; }
      audio.sfx('pick');
      pending = { kind: ca ? 'attack' : 'skill', uid: u.uid, targets: ca ? attackTargets(s, u) : [] };
      if (ca) { mode = 'target'; fx.arrowShow(posOf(u.uid), 0xb8322a); }
      else { mode = 'idle'; }
      refreshHighlights();
      refreshSkillBtn();
      if (!ca && cs) toast('本回合已无法攻击，可施展技能', { ms: 1200 });
      return;
    }
    if (selHand && o.zone !== 'hand') {
      const u = s.players[0].hand.find((x) => x.uid === selHand);
      if (u && canPlay(s, 0, u)) { doAction({ type: 'play', uid: u.uid }); return; }
    }
    cancelSelect();
  }
  function onUp(ev) {
    setNdc(ev);
    if (finished) return;
    if (drag) {
      const u = s.players[0].hand.find((x) => x.uid === drag.uid);
      const above = ev.clientY < lastPointer.h * 0.7;
      drag = null;
      if (u && above && canPlay(s, 0, u)) { doAction({ type: 'play', uid: u.uid }); return; }
      selHand = null;
      layoutHand(0, 0.25);
      refreshHighlights();
      return;
    }
    if (mode === 'target' && pending?.kind === 'play') {
      const o = pick();
      if (isTarget(o)) { doAction({ type: 'play', uid: pending.uid, target: o.uid ?? o.hero }); return; }
    }
    if (press) {
      const u = s.players[0].hand.find((x) => x.uid === press.uid);
      press = null;
      if (!u) return;
      if (!canPlay(s, 0, u)) { toast(playReason(u)); audio.sfx('error'); return; }
      if (selHand === u.uid) { doAction({ type: 'play', uid: u.uid }); return; }
      if (beginPlay(u)) { audio.sfx('pick'); return; }
      selHand = u.uid;
      audio.sfx('pick');
      toast('再次点击或拖到场上即可打出', { ms: 1200 });
      layoutHand(0, 0.2);
      refreshHighlights();
    }
  }
  function onKey(ev) {
    if (finished || paused) return;
    if (ev.key === 'Escape') { if (pending || selHand) cancelSelect(); else pauseMenu(); }
    else if ((ev.key === 'Enter' || ev.key === 'e' || ev.key === 'E') && !ev.repeat) endTurn();
  }
  const canvasEl = app.renderer.domElement;
  const noCtx = (e) => e.preventDefault();
  canvasEl.addEventListener('pointermove', onMove);
  canvasEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('keydown', onKey);
  canvasEl.addEventListener('contextmenu', noCtx);

  // ── per-frame ──
  const camBase = BATTLE_CAM.pos.clone();
  const offFrame = app.onFrame((dt, t) => {
    for (const m of meshes.values()) {
      m.tick(dt, t);
      const inf = info.get(m.uid);
      if (inf?.zone === 'board' && !m.userData.bob) m.body.position.y = Math.sin(t * 1.3 + m.uid.length * 1.7 + (+m.uid.slice(1) || 0)) * 0.03;
    }
    heroes.forEach((hm) => hm.tick(dt, t));
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 1.4);
      camera.position.set(camBase.x + (Math.random() - 0.5) * shake * 0.4, camBase.y + (Math.random() - 0.5) * shake * 0.3, camBase.z + (Math.random() - 0.5) * shake * 0.3);
    } else if (camera.position.distanceToSquared(camBase) > 1e-6 && !introRunning) camera.position.lerp(camBase, Math.min(1, dt * 8));
    if (timerOn && !paused && mode !== 'busy' && !document.querySelector('.modal')) {
      timeLeft -= dt;
      const k = Math.max(0, timeLeft / TURN_TIME);
      incense.style.setProperty('--k', k.toFixed(3));
      incense.classList.toggle('low', timeLeft < 8);
      if (timeLeft <= 0) { timerOn = false; toast('一炷香燃尽，回合结束'); cancelSelect(); endTurn(); }
    }
  });

  // ── pause / forfeit ──
  async function pauseMenu() {
    if (paused || finished) return;
    paused = true;
    audio.sfx('click');
    const v = await modal('暂停', h('div.pause-body',
      h('p', { text: '快捷键：Enter / E 结束回合，Esc 取消选择，右键取消。' }),
      h('p', { text: '拖动手牌到场上即可打出；需要目标的牌会拉出指向箭头。' })),
    [{ label: '继续', value: 'resume', primary: true }, { label: '设置', value: 'settings' }, { label: '认输', value: 'forfeit' }]);
    paused = false;
    if (v === 'settings') { await ctx.openSettings?.(); }
    if (v === 'forfeit') {
      const ok = await modal('认输', '确定要认输离开这场对局吗？', [{ label: '认输', value: true, primary: true }, { label: '取消', value: false }]);
      if (ok) { forfeited = true; s.over = true; s.winner = 1; turnResolve?.(); turnResolve = null; }
    }
  }

  // ── turn loops ──
  async function aiTurn() {
    await W(0.45);
    let n = 0;
    while (!s.over && !finished && s.active === 1 && n++ < 40) {
      while (paused) await wait(0.2);
      const a = ai.choose(s);
      await play(act(s, a));
      if (a.type !== 'end') await W(0.3);
    }
    if (!s.over && s.active === 1) await play(act(s, { type: 'end' }));
  }
  function playerTurn() {
    return new Promise((res) => {
      turnResolve = res;
      mode = 'idle';
      const P = s.players[0];
      timeLeft = TURN_TIME;
      timerOn = settings.timer && !cfg.tutorial && !cfg.autoplay;
      const tip = cfg.tutorial && settings.hints ? TUTORIAL_HINTS[P.turns] : null;
      if (tip) { hint.textContent = tip.text; hint.classList.add('show'); } else hint.classList.remove('show');
      refreshHUD();
      refreshHighlights();
      if (cfg.autoplay) (async () => {
        let n = 0;
        while (!s.over && s.active === 0 && n++ < 40) { await W(0.25); const a = autoAI.choose(s); await doAction(a); }
      })();
    });
  }

  let introRunning = false;
  async function intro() {
    introRunning = true;
    camera.position.set(0, 16, 14);
    camera.lookAt(BATTLE_CAM.look);
    const from = camera.position.clone();
    await tween(1.4, (k) => { camera.position.lerpVectors(from, BATTLE_CAM.pos, k); camera.lookAt(BATTLE_CAM.look); }, { ease: ease.inOut });
    introRunning = false;
    await banner(cfg.title ?? '对局开始', s.first === 0 ? '我方先手' : '对手先手', { cls: 'title', ms: 1300 });
  }

  // debug / automation hooks
  const screenOf = (t) => {
    const p = t.startsWith('H') ? heroes[+t[1]].center() : meshes.get(t)?.getWorldPosition(new THREE.Vector3());
    if (!p) return null;
    p.project(camera);
    const r = canvasEl.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  };
  window.__battle = { s, act: doAction, meshes, screenOf, legal: () => legalActions(s), get mode() { return mode; },
    /** Debug: play a card's signature VFX without needing the board state that would trigger it. */
    sig: (id, phase = 'summon', target = null) => signature(id, phase, { p: 0, id, target }, V(0, 0.2, 0)),
    fx, elem: (el, o = {}, at = [0, 0, 0]) => fx.element(el, V(...at), o), win() { s.players[1].hp = 0; s.over = true; s.winner = 0; turnResolve?.(); }, lose() { s.players[0].hp = 0; s.over = true; s.winner = 1; turnResolve?.(); } };

  async function run() {
    refreshHeroes();
    await intro();
    await play(s.ev);
    while (!s.over && !finished) {
      if (s.active === 1) await aiTurn();
      else await playerTurn();
      await playing;
    }
    timerOn = false;
    mode = 'busy';
    refreshHighlights();
    const won = s.winner === 0;
    const reason = forfeited ? 'forfeit' : s.players[won ? 1 : 0].fatigue ? 'deck' : 'hp';
    if (!forfeited) {
      const loserHero = heroes[won ? 1 : 0];
      const p = loserHero.center();
      fx.pillar(p.clone().setY(0), { color: won ? '#ffd88a' : '#6a2a2a', h: 10, r: 1.2, life: 2.4 });
      for (let k = 0; k < 4; k++) setTimeout(() => fx.splash(V(p.x + (Math.random() - 0.5) * 2, 0, p.z + (Math.random() - 0.5) * 2), { size: 2 }), k * 120);
      tween(1.2, (k) => { loserHero.plate.material.opacity = 1 - k * 0.8; loserHero.position.y = 0.78 - k * 0.3; });
      audio.sfx(won ? 'victory' : 'defeat');
      if (!won) { app.post.uniforms.desat.value = 0; tween(1.5, (k) => { app.post.uniforms.desat.value = k * 0.7; }); }
      await banner(won ? '胜' : '败', won ? (reason === 'deck' ? '对手牌库耗尽' : '文脉得续') : reason === 'deck' ? '牌库耗尽' : '文脉黯淡', { cls: won ? 'win' : 'lose', ms: 2200 });
    }
    return { won, turns: s.players[0].turns, reason, forfeited };
  }

  function dispose() {
    finished = true;
    offFrame();
    canvasEl.removeEventListener('pointermove', onMove);
    canvasEl.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('keydown', onKey);
    canvasEl.removeEventListener('contextmenu', noCtx);
    canvasEl.style.cursor = 'default';
    for (const uid of [...meshes.keys()]) removeMesh(uid);
    heroes.forEach((hm) => hm.dispose());
    for (const k of Object.keys(sigils)) sigils[k].stop();
    fx.clear();
    scene.remove(world);
    camera.remove(handG);
    hud.remove();
    app.post.uniforms.desat.value = 0;
    app.post.uniforms.flash.value = 0;
    camera.position.copy(camBase);
    delete window.__battle;
  }

  return run().finally(dispose);
}
