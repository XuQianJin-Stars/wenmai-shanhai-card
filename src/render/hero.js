// Hero medallion (主将) and deck stack for the battle table.
import * as THREE from 'three';
import { canvas, brush, seal, INK, FONT_BRUSH, FONT_SERIF, rgba } from './ink.js';
import { paintArt } from './cardArt.js';
import { backTexture, CARD_W, CARD_H } from './cardMesh.js';

const artCache = new Map();
function portrait(motif) {
  let c = artCache.get(motif);
  if (!c) { c = canvas(420, 420); paintArt(c.getContext('2d'), 420, 420, motif, { seed: 31 }); artCache.set(motif, c); }
  return c;
}

export class HeroMesh extends THREE.Group {
  constructor({ name, motif, enemy = false }) {
    super();
    this.name_ = name; this.motif = motif; this.enemy = enemy;
    this.c = canvas(512, 600);
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    const w = 1.55, hh = w * 600 / 512;
    this.plate = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshStandardMaterial({ map: this.tex, transparent: true, roughness: 0.8, alphaTest: 0.05 }));
    this.plate.castShadow = true;
    this.plate.userData.hero = this;
    this.add(this.plate);
    this.hit = this.plate;
    // glow ring on the ground for targeting
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xff5040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.02, 48), this.ringMat);
    ring.rotation.x = -Math.PI / 2;
    this.ring = ring;
    this.glowTarget = 0;
    this.key = '';
    this.set({ hp: 20, maxHp: 20 });
  }
  placeRing(parent) { parent.add(this.ring); this.ring.position.set(this.position.x, 0.03, this.position.z + 0.2); }
  setGlow(color, k = 1) { if (color != null) this.ringMat.color.set(color); this.glowTarget = color == null ? 0 : k; }
  tick(dt, t) {
    this.ringMat.opacity += (this.glowTarget * (0.7 + 0.3 * Math.sin(t * 5)) - this.ringMat.opacity) * Math.min(1, dt * 10);
    this.ring.visible = this.ringMat.opacity > 0.01;
  }
  set({ hp, maxHp, red = 0, armorUp = false }) {
    const key = `${hp}/${maxHp}/${red}`;
    if (key === this.key) return;
    this.key = key;
    const ctx = this.c.getContext('2d'), W = 512;
    ctx.clearRect(0, 0, W, 600);
    const cx = W / 2, cy = 236, R = 200;
    // paper disc + portrait
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(0, 0, W, 600);
    ctx.drawImage(portrait(this.motif), cx - R, cy - R, R * 2, R * 2);
    const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,20,10,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 600);
    ctx.restore();
    // brush ring frame
    const b = brush(ctx, this.enemy ? 41 : 42);
    const ring = []; for (let t = 0; t <= 1.02; t += 0.02) ring.push([cx + Math.cos(t * 6.283 - 1.2) * R, cy + Math.sin(t * 6.283 - 1.2) * R]);
    b.stroke(ring, { w: 16, color: this.enemy ? '#2a1a1a' : INK, alpha: 0.95, dry: 0.4, taper: [0.02, 0.15] });
    ctx.strokeStyle = this.enemy ? '#7a2a22' : '#c8a04a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, R - 14, 0, Math.PI * 2); ctx.stroke();
    // name banner
    ctx.fillStyle = this.enemy ? '#3a1a18' : '#2a2418';
    ctx.beginPath(); ctx.moveTo(60, 452); ctx.lineTo(452, 452); ctx.lineTo(430, 520); ctx.lineTo(82, 520); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c8a04a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f3e7cc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${this.name_.length > 4 ? 40 : 46}px ${FONT_BRUSH}`;
    ctx.fillText(this.name_, cx, 487);
    // HP seal (cinnabar) bottom-right of the disc
    const hx = cx + 150, hy = cy + 150, low = hp <= maxHp * 0.3;
    ctx.fillStyle = low ? '#8a1a14' : '#b8322a';
    ctx.beginPath(); ctx.arc(hx, hy, 66, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3e1c0'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#fff6e6'; ctx.font = `bold 70px ${FONT_SERIF}`;
    ctx.fillText(String(Math.max(0, hp)), hx, hy + 4);
    ctx.font = `24px ${FONT_SERIF}`; ctx.fillStyle = 'rgba(255,240,220,0.8)';
    ctx.fillText(`/${maxHp}`, hx, hy + 48);
    // damage reduction shield
    if (red > 0) {
      const sx = cx - 150, sy = cy + 150;
      ctx.fillStyle = '#2a4a6a';
      ctx.beginPath(); ctx.moveTo(sx, sy - 52); ctx.lineTo(sx + 44, sy - 34); ctx.lineTo(sx + 38, sy + 18); ctx.lineTo(sx, sy + 50); ctx.lineTo(sx - 38, sy + 18); ctx.lineTo(sx - 44, sy - 34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `bold 44px ${FONT_SERIF}`; ctx.fillText(`-${red}`, sx, sy);
    }
    this.tex.needsUpdate = true;
  }
  /** World position of the portrait centre (for effects). */
  center(v = new THREE.Vector3()) { return this.plate.getWorldPosition(v).add(new THREE.Vector3(0, 0.15, 0)); }
  dispose() { this.tex.dispose(); this.plate.material.dispose(); this.plate.geometry.dispose(); this.ringMat.dispose(); this.ring.geometry.dispose(); }
}

/** Stack of card backs whose height tracks the remaining deck. */
export class DeckStack extends THREE.Group {
  constructor() {
    super();
    const top = new THREE.MeshStandardMaterial({ map: backTexture(), roughness: 0.6 });
    const side = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.9 });
    this.box = new THREE.Mesh(new THREE.BoxGeometry(CARD_W * 0.62, 1, CARD_H * 0.62), [side, side, top, side, side, side]);
    this.box.castShadow = true; this.box.receiveShadow = true;
    this.add(this.box);
    this.c = canvas(256, 96);
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false, toneMapped: false }));
    this.label.scale.set(0.9, 0.34, 1);
    this.label.renderOrder = 5;
    this.add(this.label);
    this.n = -1;
    this.set(20);
  }
  set(n) {
    if (n === this.n) return;
    this.n = n;
    const hgt = Math.max(0.004, n * 0.014);
    this.box.scale.y = hgt; this.box.position.y = hgt / 2;
    this.box.visible = n > 0;
    this.label.position.set(0, hgt + 0.3, 0.35);
    const ctx = this.c.getContext('2d');
    ctx.clearRect(0, 0, 256, 96);
    ctx.fillStyle = 'rgba(20,16,12,0.7)'; ctx.beginPath(); ctx.roundRect(8, 12, 240, 72, 30); ctx.fill();
    ctx.fillStyle = n <= 3 ? '#ff8a70' : '#f1e3c4'; ctx.font = `44px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`牌库 ${n}`, 128, 50);
    this.tex.needsUpdate = true;
  }
  top(v = new THREE.Vector3()) { return this.getWorldPosition(v).add(new THREE.Vector3(0, this.box.scale.y + 0.05, 0)); }
}
export { rgba, seal };
