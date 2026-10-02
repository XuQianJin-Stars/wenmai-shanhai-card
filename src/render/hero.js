// Hero medallion (主将) and deck stack for the battle table.
import * as THREE from 'three';
import { canvas, brush, seal, INK, FONT_BRUSH, FONT_SERIF, rgba } from './ink.js';
import { paintArt } from './cardArt.js';
import { backTexture, CARD_W, CARD_H } from './cardMesh.js';

// Custom portrait images (same map as ui.js)
const CUSTOM_PORTRAITS = {
  guardian: () => {
    const g = window.__save?.data?.settings?.guardianGender || 'male';
    return `card-art/guardian-${g}.jpg`;
  },
  mist: 'card-art/boss-mist.jpg',
  shade: 'card-art/boss-shade.jpg',
  husk: 'card-art/boss-husk.jpg',
  inkling: 'card-art/boss-inkling.jpg',
  nameplate: 'card-art/boss-nameplate.jpg',
  nishang: 'card-art/boss-nishang.jpg',
  puppet: 'card-art/boss-puppet.jpg',
  robeGhost: 'card-art/boss-robeGhost.jpg',
  juexiang: 'card-art/juexiang.jpg',
  giant: 'card-art/giant.jpg',
  swordsman: 'card-art/swordsman.jpg',
  judge: 'card-art/judge.jpg',
  poet: 'card-art/poet.jpg',
  'myth-erlang': 'card-art/myth-erlang.jpg',
  'sanguo-clerk': 'card-art/sanguo-clerk.jpg',
  'wudai-painter': 'card-art/wudai-painter.jpg',
  'wanqing-student': 'card-art/wanqing-student.jpg',
  'minguo-editor': 'card-art/minguo-editor.jpg',
  'LJ-086': 'card-art/LJ-086.jpg',
  'LJ-104': 'card-art/LJ-104.jpg',
  'LJ-091': 'card-art/LJ-091.jpg',
  brokenSlip: 'card-art/boss-brokenSlip.jpg',
  gagMist: 'card-art/boss-gagMist.jpg',
  sophist: 'card-art/boss-sophist.jpg',
  marshWalker: 'card-art/boss-marshWalker.jpg',
  banner: 'card-art/boss-banner.jpg',
  zhaohun: 'card-art/boss-zhaohun.jpg',
  beacon: 'card-art/boss-beacon.jpg',
  ember: 'card-art/boss-ember.jpg',
  fenshu: 'card-art/boss-fenshu.jpg',
  drunkInk: 'card-art/boss-drunkInk.jpg',
  cutString: 'card-art/boss-cutString.jpg',
  talker: 'card-art/boss-talker.jpg',
  quicksand: 'card-art/boss-quicksand.jpg',
  peelFlyer: 'card-art/boss-peelFlyer.jpg',
  sealedCave: 'card-art/boss-sealedCave.jpg',
  bannedBook: 'card-art/boss-bannedBook.jpg',
  lostCure: 'card-art/boss-lostCure.jpg',
  jinhui: 'card-art/boss-jinhui.jpg',
  deadKiln: 'card-art/boss-deadKiln.jpg',
  lostPlan: 'card-art/boss-lostPlan.jpg',
  wangchuan: 'card-art/boss-wangchuan.jpg',
  shishengGhost: 'card-art/boss-shishengGhost.jpg',
  peeledGreen: 'card-art/boss-peeledGreen.jpg',
  nvwaSpirit: 'card-art/nvwaSpirit.jpg',
  kongzi: 'card-art/kongzi.jpg', laozi: 'card-art/laozi.jpg', zhuangzi: 'card-art/zhuangzi.jpg',
  mozi: 'card-art/mozi.jpg', quyuan: 'card-art/quyuan.jpg', shangui: 'card-art/shangui.jpg',
  xiangjun: 'card-art/xiangjun.jpg', sima: 'card-art/sima.jpg', zhangqian: 'card-art/zhangqian.jpg',
  cailun: 'card-art/cailun.jpg', shuzu: 'card-art/shuzu.jpg', wangxizhi: 'card-art/wangxizhi.jpg',
  taoyuanming: 'card-art/taoyuanming.jpg', jikang: 'card-art/jikang.jpg', gukaizhi: 'card-art/gukaizhi.jpg',
  xuanzang: 'card-art/xuanzang.jpg', lezun: 'card-art/lezun.jpg', painter: 'card-art/painter.jpg',
  caoxueqin: 'card-art/caoxueqin.jpg', wuchengen: 'card-art/wuchengen.jpg', lishizhen: 'card-art/lishizhen.jpg',
  xuxiake: 'card-art/xuxiake.jpg', zhangheng: 'card-art/zhangheng.jpg', zuchongzhi: 'card-art/zuchongzhi.jpg',
  libing: 'card-art/libing.jpg', songyingxing: 'card-art/songyingxing.jpg', zhenghe: 'card-art/zhenghe.jpg',
  mazu: 'card-art/mazu.jpg', mahuan: 'card-art/mahuan.jpg', kilnman: 'card-art/kilnman.jpg',
  fanqin: 'card-art/fanqin.jpg', zhuxi: 'card-art/zhuxi.jpg', zhengqiao: 'card-art/zhengqiao.jpg',
  zhenren: 'card-art/zhenren.jpg', liqingzhao: 'card-art/liqingzhao.jpg', xinqiji: 'card-art/xinqiji.jpg',
  zhangzeduan: 'card-art/zhangzeduan.jpg', wangximeng: 'card-art/wangximeng.jpg',
  cottage: 'card-art/cottage.jpg', river: 'card-art/river.jpg', snowOath: 'card-art/snowOath.jpg',
  peony: 'card-art/peony.jpg', loom: 'card-art/loom.jpg', flute: 'card-art/flute.jpg',
  youth: 'card-art/youth.jpg', dancer: 'card-art/dancer.jpg',
  chenzhou: 'card-art/chenzhou.jpg', emptyShelf: 'card-art/emptyShelf.jpg',
  dancerGhost: 'card-art/dancerGhost.jpg', scholarGhost: 'card-art/scholarGhost.jpg',
  sanqie: 'card-art/sanqie.jpg', wuren: 'card-art/emptyShelf.jpg',
};

const artCache = new Map();
const artListeners = new Map(); // motif → Set<callback>
const artLoaded = new Set();
function portrait(motif, onReady = null) {
  let c = artCache.get(motif);
  if (!c) {
    c = canvas(420, 420);
    paintArt(c.getContext('2d'), 420, 420, motif, { seed: 31 });
    artCache.set(motif, c);
    const custom = CUSTOM_PORTRAITS[motif];
    if (custom) {
      const url = typeof custom === 'function' ? custom() : custom;
      const img = new Image();
      const finish = () => {
        artLoaded.add(motif);
        // 先抄出来再清空。回调里如果又登记，不能在同一次遍历里被叫到，否则会无限重画。
        const fns = [...(artListeners.get(motif) ?? [])];
        artListeners.set(motif, new Set());
        for (const fn of fns) fn();
      };
      img.onload = () => {
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 420, 420);
        const s = Math.max(420 / img.width, 420 / img.height);
        const dw = img.width * s, dh = img.height * s;
        ctx.drawImage(img, (420 - dw) / 2, (420 - dh) / 2, dw, dh);
        finish();
      };
      img.onerror = () => finish();
      img.src = url;
    } else artLoaded.add(motif);
  }
  if (onReady && !artLoaded.has(motif)) {
    if (!artListeners.has(motif)) artListeners.set(motif, new Set());
    artListeners.get(motif).add(onReady);
  }
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
    // 绘稿到位后只重画这一次。不能写在 _draw 里，每次重画都会再登记一个回调。
    portrait(this.motif, () => { this.key = ''; this._draw(); });
  }
  placeRing(parent) { parent.add(this.ring); this.ring.position.set(this.position.x, 0.03, this.position.z + 0.2); }
  setGlow(color, k = 1) { if (color != null) this.ringMat.color.set(color); this.glowTarget = color == null ? 0 : k; }
  tick(dt, t) {
    this.ringMat.opacity += (this.glowTarget * (0.7 + 0.3 * Math.sin(t * 5)) - this.ringMat.opacity) * Math.min(1, dt * 10);
    this.ring.visible = this.ringMat.opacity > 0.01;
  }
  set({ hp, maxHp, red = 0, armorUp = false }) {
    this._lastSet = { hp, maxHp, red, armorUp };
    const key = `${hp}/${maxHp}/${red}`;
    if (key === this.key) return;
    this.key = key;
    this._draw();
  }
  _draw() {
    const { hp, maxHp, red } = this._lastSet;
    this.key = `${hp}/${maxHp}/${red}`;
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
