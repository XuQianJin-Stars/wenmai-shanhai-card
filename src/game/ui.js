// DOM layer: small element helper, card detail panel, banners, toasts, story dialogue box, modals.
// Visual rules: docs/art/UI_VISUAL.md (xuan paper, ink, cinnabar seal, 40 chars/s brush reveal).
import { card, EL, TYPE_ZH, GRADE_ZH, BONDS, GRADE_BONUS } from '../data/cards.js';
import { faceCanvas, artCanvas } from '../render/cardFace.js';
import { canvas } from '../render/ink.js';
import { paintArt } from '../render/cardArt.js';

export function h(tag, attrs = {}, ...kids) {
  if (attrs instanceof Node || Array.isArray(attrs) || typeof attrs !== 'object') { kids.unshift(attrs); attrs = {}; }
  const [t, ...cls] = tag.split('.');
  const e = document.createElement(t || 'div');
  if (cls.length) e.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
}
export const clear = (e) => { while (e.firstChild) e.firstChild.remove(); return e; };

/** A <canvas> element showing a card face (copied from the texture cache). */
export function faceEl(id, grade = 0, { w = 256, cls = '' } = {}) {
  const src = faceCanvas(id, grade);
  const c = h('canvas.face' + (cls ? '.' + cls : ''));
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  c.style.width = `${w}px`;
  return c;
}
export function portraitEl(motif, size = 120, seed = 5) {
  const c = canvas(size * 2, size * 2);
  paintArt(c.getContext('2d'), size * 2, size * 2, motif, { seed });
  c.className = 'portrait';
  c.style.width = c.style.height = `${size}px`;
  return c;
}

/** Full rules + culture text of a card. `live` = current unit view (atk/def/hp, statuses) when on the board. */
export function cardInfo(id, grade = 0, { live = null, cost = null } = {}) {
  const d = card(id);
  const el = d.el ? EL[d.el] : null;
  const g = GRADE_BONUS[grade];
  const box = h('div.info');
  box.append(h('div.info-head',
    h('span.info-name', { text: d.name }),
    h('span.info-tags', { text: [d.zhuo ? '浊灵' : TYPE_ZH[d.type], el ? `${el.zh}·${el.beast}` : '', GRADE_ZH[grade]].filter(Boolean).join(' · ') }),
  ));
  const cst = cost ?? d.cost;
  const meta = [`费用 ${cst}${cost != null && cost !== d.cost ? `（原 ${d.cost}）` : ''}`];
  if (d.type === 'general') {
    const v = live ?? { atk: d.atk + g.atk, def: d.def + g.def, hp: d.hp + g.hp, maxHp: d.hp + g.hp };
    meta.push(`攻 ${v.atk}　防 ${v.def}　血 ${v.hp}/${v.maxHp}`);
  }
  box.append(h('div.info-meta', { text: meta.join('　|　') }));
  box.append(h('div.info-text', { text: d.text }));
  if (d.skill) {
    const on = grade >= 1;
    box.append(h('div.info-skill' + (on ? '' : '.locked'), h('b', { text: `【${d.skill.name}】${d.skill.cost} 灵力` }), ' ', d.skill.text, on ? '' : h('i', { text: '（珍品解锁）' })));
  }
  if (d.up) box.append(h('div.info-skill' + (grade >= 1 ? '' : '.locked'), h('b', { text: '【珍品】' }), ' ', d.up, grade >= 1 ? '' : h('i', { text: '（升阶后生效）' })));
  if (live?.st?.length) box.append(h('div.info-status', { text: '状态：' + [...new Set(live.st)].map((k) => STATUS_ZH[k] ?? k).join('、') }));
  if (d.bonds?.length) box.append(h('div.info-bonds', d.bonds.map((b) => h('span.bond-chip', { title: BONDS[b].text, text: `${BONDS[b].name}·${BONDS[b].title}` }))));
  if (d.quote) box.append(h('blockquote.info-quote', h('div', { text: d.quote }), h('cite', { text: d.source })));
  if (d.flavor) box.append(h('div.info-flavor', { text: d.flavor }));
  return box;
}
export const STATUS_ZH = { stun: '眩晕', seal: '封印（不能用技能）', bleed: '流血', immune: '免疫负面', defUp: '防御提升', atkUp: '攻击提升',
  atkDown: '攻击削弱', defDown: '破防', dodge: '潜行（闪避 1 次攻击）', reflect: '反伤', ctrlImmune: '控制免疫' };

// ── transient overlays ──
let layer = null;
export function setLayer(el) { layer = el; }
export function toast(text, { cls = '', ms = 1800 } = {}) {
  const t = h('div.toast' + (cls ? '.' + cls : ''), { text });
  layer.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 500); }, ms);
}
/** Big centred brush title (turn start, bond names…). Resolves when it has faded. */
export function banner(title, sub = '', { cls = '', ms = 1500 } = {}) {
  return new Promise((res) => {
    const b = h('div.banner' + (cls ? '.' + cls : ''), h('div.banner-ink'), h('div.banner-title', { text: title }), sub ? h('div.banner-sub', { text: sub }) : null);
    layer.append(b);
    requestAnimationFrame(() => b.classList.add('in'));
    setTimeout(() => { b.classList.remove('in'); b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 450); }, ms);
  });
}

/** Modal with buttons: [{label, value, primary}] → Promise(value). */
export function modal(title, body, buttons = [{ label: '确定', value: true, primary: true }], { cls = '', closable = true } = {}) {
  return new Promise((res) => {
    const close = (v) => { m.classList.remove('in'); setTimeout(() => m.remove(), 250); res(v); };
    const m = h('div.modal' + (cls ? '.' + cls : ''), { onclick: (e) => { if (closable && e.target === m) close(null); } },
      h('div.modal-box',
        title ? h('div.modal-title', { text: title }) : null,
        h('div.modal-body', typeof body === 'string' ? h('p', { text: body }) : body),
        h('div.modal-btns', buttons.map((b) => h('button.btn' + (b.primary ? '.primary' : ''), { onclick: () => close(b.value), text: b.label }))),
      ));
    layer.append(m);
    requestAnimationFrame(() => m.classList.add('in'));
  });
}

/**
 * Story dialogue (UI_VISUAL: 逐字显示 40 字/秒). lines: [{who, text, stage}]; onStage(cue) runs stage directions.
 * Resolves when finished or skipped.
 */
export function dialogue(lines, { onStage = null, sfx = null, portraits = {} } = {}) {
  return new Promise((res) => {
    let i = -1, typing = null, full = '';
    const name = h('div.dlg-name'), text = h('div.dlg-text'), pic = h('div.dlg-pic');
    const skip = h('button.dlg-skip', { text: '跳过 ≫', onclick: (e) => { e.stopPropagation(); finish(); } });
    const box = h('div.dialogue', { onclick: () => next() }, h('div.dlg-box', pic, h('div.dlg-body', name, text), h('div.dlg-more', { text: '▼' })), skip);
    const keys = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } else if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', keys);
    layer.append(box);
    requestAnimationFrame(() => box.classList.add('in'));
    function finish() {
      clearInterval(typing);
      window.removeEventListener('keydown', keys);
      box.classList.remove('in');
      setTimeout(() => box.remove(), 350);
      res();
    }
    function next() {
      if (typing) { clearInterval(typing); typing = null; text.textContent = full; return; }
      i++;
      if (i >= lines.length) return finish();
      const L = lines[i];
      if (L.stage) onStage?.(L.stage);
      sfx?.();
      name.textContent = L.who || '';
      box.classList.toggle('narration', !L.who);
      clear(pic);
      const p = portraits[L.who];
      if (p) pic.append(p());
      full = L.text;
      let n = 0;
      text.textContent = '';
      typing = setInterval(() => {
        n = Math.min(full.length, n + 1);
        text.textContent = full.slice(0, n);
        if (n >= full.length) { clearInterval(typing); typing = null; }
      }, 25);
    }
    next();
  });
}

export function fade(el, on, ms = 450) {
  el.style.transition = `opacity ${ms}ms`;
  el.style.opacity = on ? '1' : '0';
  el.style.pointerEvents = on ? 'auto' : 'none';
  return new Promise((r) => setTimeout(r, ms));
}
export { artCanvas };
