// 3D card: rounded thin slab with canvas faces, a glow halo (playable / selected / target), a burn-dissolve for
// talismans (docs/tech_art/SHADERS/card_material.md), and for generals on the board a stats plate + status icons.
import * as THREE from 'three';
import { card, EL } from '../data/cards.js';
import { faceCanvas, backCanvas, drawStats, FACE_W, FACE_H, onCustomArtLoad } from './cardFace.js';
import { canvas, roundRect, FONT_SERIF, FONT_BRUSH } from './ink.js';

export const CARD_W = 1, CARD_H = FACE_H / FACE_W, CARD_T = 0.014;

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function planeFromShape(shape, w, h) {
  const g = new THREE.ShapeGeometry(shape, 6);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

const shape = roundedShape(CARD_W, CARD_H, 0.06);
const G = {
  face: planeFromShape(shape, CARD_W, CARD_H),
  edge: new THREE.ExtrudeGeometry(shape, { depth: CARD_T, bevelEnabled: false, curveSegments: 6 }),
  glow: planeFromShape(roundedShape(CARD_W * 1.2, CARD_H * 1.14, 0.16), CARD_W * 1.2, CARD_H * 1.14),
};
G.face.computeVertexNormals();
G.edge.translate(0, 0, -CARD_T / 2);

const texCache = new Map();
function tex(key, make) {
  let t = texCache.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(make());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    texCache.set(key, t);
  }
  return t;
}
export const faceTexture = (id, grade) => tex(`f:${id}:${grade}`, () => faceCanvas(id, grade));
export const backTexture = () => tex('back', () => backCanvas());
// The texture keeps the canvas it was born with. When the painting arrives later, copy onto that canvas.
onCustomArtLoad((id) => {
  for (const [key, t] of texCache) {
    if (!key.startsWith(`f:${id}:`)) continue;
    const grade = Number(key.slice(`f:${id}:`.length));
    const fresh = faceCanvas(id, grade);
    const ctx = t.image.getContext('2d');
    ctx.clearRect(0, 0, t.image.width, t.image.height);
    ctx.drawImage(fresh, 0, 0);
    t.needsUpdate = true;
  }
});

const edgeMat = new THREE.MeshStandardMaterial({ color: 0xb89a5a, roughness: 0.5, metalness: 0.4 });
const backMat = () => new THREE.MeshStandardMaterial({ map: backTexture(), roughness: 0.6, metalness: 0.1 });

const GLOW_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const GLOW_FS = /* glsl */`
uniform vec3 color; uniform float opacity; uniform float time; varying vec2 vUv;
void main(){
  vec2 q = abs(vUv - 0.5) * 2.0;
  vec2 inner = vec2(1.0 / 1.2, 1.0 / 1.14);
  vec2 d = max(q - inner * 0.94, 0.0) / (1.0 - inner * 0.94);
  float r = length(d);
  float a = smoothstep(1.0, 0.0, r) * step(0.0001, max(d.x, d.y));
  a *= 0.75 + 0.25 * sin(time * 3.0 + (vUv.x + vUv.y) * 6.0);
  gl_FragColor = vec4(color * 1.6, a * opacity);
}`;

/** Burn-dissolve injected into the face material. */
function addBurn(mat) {
  mat.userData.burn = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uBurn = mat.userData.burn;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBurnUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBurnUv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uBurn; varying vec2 vBurnUv;
      float bh(vec2 p){ p = fract(p*vec2(233.34,851.73)); p += dot(p,p+23.45); return fract(p.x*p.y); }
      float bn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(bh(i),bh(i+vec2(1,0)),f.x),mix(bh(i+vec2(0,1)),bh(i+vec2(1,1)),f.x),f.y); }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      if (uBurn > 0.0) {
        float n = bn(vBurnUv*6.0)*0.6 + bn(vBurnUv*18.0)*0.4;
        n = n*0.8 + (1.0 - vBurnUv.y)*0.25;
        float th = uBurn*1.25 - 0.1;
        if (n < th) discard;
        float e = smoothstep(th + 0.08, th, n);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(3.0, 1.2, 0.25), e);
      }`);
  };
  mat.customProgramCacheKey = () => `burn:${mat.type}`;
}

export class CardMesh extends THREE.Group {
  constructor(id, grade = 0, { faceDown = false } = {}) {
    super();
    this.cardId = id; this.grade = grade;
    this.faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(id, grade), roughness: 0.72, metalness: 0.0, transparent: false });
    addBurn(this.faceMat);
    this.body = new THREE.Group();
    this.add(this.body);
    const front = new THREE.Mesh(G.face, this.faceMat);
    front.position.z = CARD_T / 2 + 0.0005;
    const back = new THREE.Mesh(G.face, backMat());
    back.rotation.y = Math.PI; back.position.z = -CARD_T / 2 - 0.0005;
    const edge = new THREE.Mesh(G.edge, edgeMat);
    for (const m of [front, back, edge]) { m.castShadow = true; m.userData.card = this; this.body.add(m); }
    this.front = front; this.back = back;
    this.glowMat = new THREE.ShaderMaterial({ vertexShader: GLOW_VS, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color(0x7fe0a0) }, opacity: { value: 0 }, time: { value: 0 } } });
    this.glow = new THREE.Mesh(G.glow, this.glowMat);
    this.glow.position.z = -CARD_T;
    this.glow.renderOrder = -1;
    this.body.add(this.glow);
    this.hit = front;           // raycast target
    this.glowTarget = 0;
    if (faceDown) this.body.rotation.y = Math.PI;
    this.stats = null;
  }
  setGrade(g) {
    if (g === this.grade) return;
    this.grade = g;
    this.faceMat.map = faceTexture(this.cardId, g);
    this.faceMat.needsUpdate = true;
  }
  setGlow(color, strength = 1) {
    if (color != null) this.glowMat.uniforms.color.value.set(color);
    this.glowTarget = color == null ? 0 : strength;
  }
  /**
   * 图鉴预览：纸面覆一层清漆（clearcoat），高光走真正的灯，不在 UV 上画条。
   * 战场上的卡不走这条，免得满场反光。
   */
  setSheen(on) {
    if (!on || this.faceMat.isMeshPhysicalMaterial) return;
    const map = this.faceMat.map;
    this.faceMat.dispose();
    this.faceMat = new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.7,
      metalness: 0,
      clearcoat: 0.78,
      clearcoatRoughness: 0.32,
    });
    addBurn(this.faceMat);
    this.front.material = this.faceMat;
  }
  set burn(v) { this.faceMat.userData.burn.value = v; }
  get burn() { return this.faceMat.userData.burn.value; }
  tick(dt, t) {
    const u = this.glowMat.uniforms;
    u.opacity.value += (this.glowTarget - u.opacity.value) * Math.min(1, dt * 10);
    u.time.value = t;
    this.glow.visible = u.opacity.value > 0.01;
    this.stats?.tick(dt, t);
  }
  /** Board presentation: a stats plate beneath the card. */
  attachStats() {
    if (this.stats) return this.stats;
    this.stats = new StatPlate(this);
    this.add(this.stats);
    return this.stats;
  }
  dispose() {
    this.faceMat.dispose(); this.glowMat.dispose(); this.back.material.dispose();
    this.stats?.dispose();
  }
}

const STATUS_ICON = {
  stun: { ch: '晕', c: '#2a4a7a' }, seal: { ch: '封', c: '#8c6040' }, bleed: { ch: '血', c: '#b8322a' },
  immune: { ch: '定', c: '#c8a04a' }, defUp: { ch: '护', c: '#c8a04a' }, atkUp: { ch: '勇', c: '#c03a2a' },
  atkDown: { ch: '弱', c: '#5a5a5a' }, defDown: { ch: '破', c: '#5a5a5a' }, dodge: { ch: '隐', c: '#6a8aa8' },
  reflect: { ch: '反', c: '#c8a04a' }, ctrlImmune: { ch: '醒', c: '#4a8c5c' },
};

/** Stats plate (攻/防/血 medallions + status seals + 守护 / 可行动 marks) drawn to a small canvas. */
class StatPlate extends THREE.Group {
  constructor(cm) {
    super();
    this.c = canvas(512, 190);
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2 * 190 / 512), this.mat);
    m.position.set(0, -CARD_H / 2 - 0.1, 0.04);
    m.renderOrder = 2;
    this.add(m);
    this.mesh = m;
    this.cm = cm;
    this.key = '';
  }
  set(v, { guard = false, ready = false } = {}) {
    const key = JSON.stringify([v.atk, v.def, v.hp, v.maxHp, v.base, v.st, v.gear, guard, ready]);
    if (key === this.key) return;
    this.key = key;
    const ctx = this.c.getContext('2d');
    ctx.clearRect(0, 0, 512, 190);
    ctx.fillStyle = 'rgba(20,18,15,0.72)';
    roundRect(ctx, 20, 30, 472, 96, 40); ctx.fill();
    ctx.strokeStyle = ready ? '#8fe0a8' : 'rgba(200,160,74,0.7)'; ctx.lineWidth = ready ? 5 : 3; ctx.stroke();
    drawStats(ctx, v, { y: 78, gap: 150, r: 40, font: 46 });
    const st = [...new Set(v.st)].filter((k) => STATUS_ICON[k]);
    if (guard) st.unshift('guard');
    if (v.gear) st.unshift('gear');            // 佩戴的器物排在最前，一眼能看出这名灵将被押了注
    st.slice(0, 6).forEach((k, i) => {
      const x = 256 + (i - (Math.min(6, st.length) - 1) / 2) * 62, y = 158;
      const ic = k === 'guard' ? { ch: '守', c: '#1a5276' }
        : k === 'gear' ? { ch: (card(v.gear).short ?? '器')[0], c: '#3f6a6e' }
          : STATUS_ICON[k];
      ctx.fillStyle = ic.c; roundRect(ctx, x - 26, y - 26, 52, 52, 8); ctx.fill();
      ctx.strokeStyle = '#f1e6cf'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f7f0e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `34px ${FONT_BRUSH}`; ctx.fillText(ic.ch, x, y + 2);
    });
    this.tex.needsUpdate = true;
  }
  tick() {}
  dispose() { this.tex.dispose(); this.mat.dispose(); this.mesh.geometry.dispose(); }
}

/** Card-back mesh used for decks and the opponent's hand. */
export function backOnly() {
  return new CardMesh('ZL-001', 0, { faceDown: true });
}

export function elementColor(el) { return EL[el]?.color ?? '#c8a04a'; }
export { STATUS_ICON };
export const cardDef = card;
export { FONT_SERIF };
