// Battle environments for chapters 4–10 (LORE_BIBLE §2.5). scenes.js owns the shared pieces —
// sky dome, painted backdrop, table, lights, motes — and passes them in; each scene here is a palette,
// a backdrop painter and a handful of props.
import * as THREE from 'three';
import { canvas, brush, paper, rgba, mix, FONT_BRUSH } from './ink.js';
import { mulberry32 } from '../rules/rng.js';

/** Distant hills painted straight into a backdrop canvas. */
function hills(b, ctx, w, h, { base = 0.6, color = '#3a4450', alpha = 0.5, peak = 0.16 } = {}) {
  const pts = [[0, h]];
  let x = -20;
  pts.push([x, h * base]);
  while (x < w + 40) { const st = w * (0.05 + b.R() * 0.08); pts.push([x + st * 0.5, h * (base - peak - b.R() * 0.08)]); x += st; pts.push([x, h * (base - b.R() * 0.04)]); }
  pts.push([w + 40, h]);
  b.wash(pts, { color, alpha, blur: 4, edge: 0.5 });
}
/** Eaved roof silhouettes marching across the horizon. */
function roofline(b, ctx, w, h, { base = 0.78, color = '#2a2220', alpha = 0.85, lit = '255,200,120' } = {}) {
  let x = -30;
  while (x < w + 30) {
    const rw = 70 + b.R() * 120, rh = 22 + b.R() * 34;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x + rw * 0.1, h * base - rh * 0.6, rw * 0.8, h);
    ctx.beginPath();
    ctx.moveTo(x - 8, h * base - rh * 0.55);
    ctx.quadraticCurveTo(x + rw * 0.2, h * base - rh * 0.72, x + rw * 0.3, h * base - rh);
    ctx.lineTo(x + rw * 0.7, h * base - rh);
    ctx.quadraticCurveTo(x + rw * 0.8, h * base - rh * 0.72, x + rw + 8, h * base - rh * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    if (b.R() < 0.6) { ctx.fillStyle = `rgba(${lit},${(0.4 + b.R() * 0.5).toFixed(2)})`; ctx.fillRect(x + rw * (0.3 + b.R() * 0.3), h * base - rh * 0.3, 8, 11); }
    x += rw + b.R() * 14;
  }
}
function floatChars(b, ctx, w, h, str, { n = 30, color = '255,230,170', size = 0.045, y0 = 0.08, y1 = 0.55 } = {}) {
  ctx.font = `${h * size}px ${FONT_BRUSH}`; ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(${color},${(0.2 + b.R() * 0.45).toFixed(2)})`; ctx.fillText(str[i % str.length], b.r(0, w), b.r(h * y0, h * y1)); }
}
function sunGlow(ctx, w, h, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, h * r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

/**
 * Scene descriptions. Each entry: palette + backdrop painter + optional props(root, H, variant).
 * `floor` picks how the table surface is painted: stone | wood | paved | sand | water.
 */
export function lateScenes(H) {
  const { canvasTex, skyDome, backdrop, paintStone, paintWood, paintFlagstones, addLights, motes, rock, pineTree } = H;

  /** Simple lantern-on-a-pole, reused by several scenes. */
  const lampPost = (mats, x, z, { h = 3.6, dir = 1 } = {}) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, h, 8), mats.wood);
    pole.position.y = h / 2; pole.castShadow = true; g.add(pole);
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mats.lantern);
    lan.scale.y = 1.2; lan.position.set(dir * 0.6, h - 0.6, 0); g.add(lan);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), mats.wood);
    arm.position.set(dir * 0.3, h - 0.15, 0); g.add(arm);
    g.position.set(x, 0, z);
    return g;
  };
  const M = () => ({
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2014, roughness: 0.85 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: 0x8a1c14, roughness: 0.55 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc8a04a, roughness: 0.35, metalness: 0.7 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x6a6458, roughness: 0.95 }),
    tile: new THREE.MeshStandardMaterial({ color: 0x2a2626, roughness: 0.8 }),
    lantern: new THREE.MeshStandardMaterial({ color: 0xff5a30, emissive: 0xff3a10, emissiveIntensity: 1.7, roughness: 0.6 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x7a6a3a, roughness: 0.45, metalness: 0.65 }),
  });

  return {
    // ── 稷下学宫 ──────────────────────────────────────────────────────────
    jixia: (variant) => {
      const night = variant === 'night';
      return {
        sky: night ? ['#0e1420', '#2a3040', '#0a0c10'] : ['#8aa0a4', '#dfe4d4', '#a8b4a0'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 41);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (night) { g.addColorStop(0, '#111826'); g.addColorStop(1, '#2e3a3a'); } else { g.addColorStop(0, '#a8bcb8'); g.addColorStop(1, '#e4e8d8'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          if (!night) sunGlow(ctx, w, h, 0.3, 0.42, 0.7, 'rgba(255,244,210,0.55)', 'rgba(255,244,210,0)');
          hills(b, ctx, w, h, { base: 0.66, color: night ? '#141c24' : '#7a8a78', alpha: 0.5 });
          // the hall: a raised platform with columns
          ctx.fillStyle = night ? '#1a2028' : '#6a5c44';
          ctx.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.32);
          for (let k = 0; k < 7; k++) { ctx.fillStyle = night ? '#28303a' : '#8a7a58'; ctx.fillRect(w * (0.2 + k * 0.09), h * 0.5, w * 0.022, h * 0.3); }
          ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.5); ctx.lineTo(w * 0.5, h * 0.36); ctx.lineTo(w * 0.88, h * 0.5); ctx.closePath();
          ctx.fillStyle = night ? '#0e141c' : '#3a3630'; ctx.fill();
          ctx.fillStyle = `rgba(232,212,154,${night ? 0.5 : 0.85})`; ctx.font = `${h * 0.1}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('稷 下 学 宫', w * 0.5, h * 0.62);
          floatChars(b, ctx, w, h, '仁义道德兼爱非攻逍遥', { n: 26, color: night ? '190,210,230' : '90,80,60', y1: 0.4 });
        },
        floor: { kind: 'stone', base: night ? '#4a4c46' : '#7a7a62' },
        ground: night ? '#171c20' : '#5a5c48',
        inkDark: !night,
        fog: [night ? 0x101820 : 0xc8ccb8, 28, 90],
        lights: night
          ? { hemiSky: 0x5a6a8a, hemiGround: 0x1a1c20, hemiI: 1.0, key: 0xc8d8ff, keyI: 1.9, keyPos: [-4, 12, -6], fill: [0xffb070, 0.4, [4, 4, 5]] }
          : { hemiSky: 0xdfe8d8, hemiGround: 0x5a5a48, hemiI: 1.3, key: 0xfff2d0, keyI: 2.5, keyPos: [-6, 12, 4] },
        motes: { n: night ? 50 : 70, color: night ? '#a8c0e0' : '#e8e0b0' },
        props: (root) => {
          const mats = M();
          // bamboo-slip bundles stacked at the table corners
          const R = mulberry32(77);
          for (const [x, z] of [[-7.4, -3.4], [7.4, -3.6], [-7.6, 2.6], [7.6, 2.8]]) {
            const g = new THREE.Group();
            for (let k = 0; k < 7; k++) {
              const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.5, 0.07), mats.wood);
              s.position.set((k - 3) * 0.09, 0.75, R() * 0.1);
              s.rotation.z = (R() - 0.5) * 0.2;
              s.castShadow = true; g.add(s);
            }
            g.position.set(x, 0, z); g.rotation.y = R() * 3; root.add(g);
          }
          for (const x of [-8.2, 8.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 7, 14), mats.wood); p.position.set(x, 3.5, -4.6); p.castShadow = true; root.add(p); }
          if (variant !== 'court') for (const z of [-4, 2.4]) for (const s of [-1, 1]) root.add(lampPost(mats, s * 7.6, z, { dir: -s }));
          const t = pineTree(mulberry32(12), 1.1); t.position.set(-9, 0, 1.5); root.add(t);
        },
      };
    },

    // ── 云梦泽 ────────────────────────────────────────────────────────────
    chu: (variant) => {
      const river = variant === 'river';
      return {
        sky: river ? ['#3a3050', '#9a8ab0', '#4a4058'] : ['#22303a', '#7a9098', '#2a3a3a'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 53);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (river) { g.addColorStop(0, '#2a2440'); g.addColorStop(1, '#8a7a9a'); } else { g.addColorStop(0, '#1e2a34'); g.addColorStop(1, '#6a8088'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          sunGlow(ctx, w, h, 0.5, 0.42, 0.55, 'rgba(210,200,240,0.4)', 'rgba(210,200,240,0)');
          hills(b, ctx, w, h, { base: 0.6, color: river ? '#3a3050' : '#26343a', alpha: 0.55, peak: 0.2 });
          // reeds along the whole horizon
          for (let i = 0; i < 90; i++) {
            const x = b.r(0, w), y = h * b.r(0.72, 0.88);
            b.stroke([[x, h], [x + b.r(-16, 16), y]], { w: b.r(2, 5), color: '#2a3a2e', alpha: 0.6, dry: 0.5 });
          }
          for (let i = 0; i < 5; i++) b.mist(w, h, h * (0.6 + i * 0.07), { alpha: 0.3, color: '#c8d0d8', n: 7 });
          if (variant === 'shrine') {   // a little shrine out on the water
            ctx.fillStyle = '#2a1e22'; ctx.fillRect(w * 0.42, h * 0.5, w * 0.16, h * 0.26);
            ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.5); ctx.lineTo(w * 0.5, h * 0.4); ctx.lineTo(w * 0.62, h * 0.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(200,180,200,0.7)';
            for (let k = 0; k < 4; k++) ctx.fillRect(w * (0.36 + k * 0.1), h * 0.44, w * 0.012, h * 0.24);
          }
          floatChars(b, ctx, w, h, '山鬼湘君国殇天问', { n: 18, color: '210,200,240', y0: 0.1, y1: 0.5 });
        },
        floor: { kind: 'stone', base: '#4a5a58' },
        ground: river ? '#2a2438' : '#1e2a2a',
        fog: [river ? 0x3a3450 : 0x22303a, 22, 80],
        lights: { hemiSky: 0x7a8ab0, hemiGround: 0x1a2420, hemiI: 1.1, key: 0xc0c8f0, keyI: 1.9, keyPos: [2, 11, -6], fill: [0x7aa090, 0.45, [-5, 4, 5]] },
        motes: { n: 70, color: '#b8d0e0' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(31);
          for (let k = 0; k < 10; k++) {   // reed clumps round the rim
            const a = R() * 6.28, x = Math.cos(a) * 8.4, z = Math.sin(a) * 5.6;
            if (Math.abs(z) < 3.8 && Math.abs(x) < 6.6) continue;
            const g = new THREE.Group();
            for (let i = 0; i < 6; i++) {
              const s = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 1.6 + R(), 5), new THREE.MeshStandardMaterial({ color: 0x3a4a34, roughness: 0.95 }));
              s.position.set((R() - 0.5) * 0.4, 0.9, (R() - 0.5) * 0.4); s.rotation.z = (R() - 0.5) * 0.4; g.add(s);
            }
            g.position.set(x, -0.6, z); root.add(g);
          }
          if (variant === 'shrine' || variant === 'river') {   // 招魂幡
            for (const [x, z] of [[-6.6, -4.2], [6.6, -4.2]]) {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5, 8), mats.wood);
              pole.position.set(x, 2.5, z); root.add(pole);
              const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.4), new THREE.MeshStandardMaterial({ color: 0xd8c8d0, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
              cloth.position.set(x + 0.4, 3.4, z);
              cloth.userData.tick = (dt, t) => { cloth.rotation.y = Math.sin(t * 0.7 + x) * 0.3; };
              root.add(cloth);
            }
          }
          for (let k = 0; k < 5; k++) { const r = rock(mulberry32(90 + k), 0.4 + R() * 0.4, 0x4a5450); r.position.set((R() - 0.5) * 15, -0.5, -5 - R() * 3); root.add(r); }
        },
      };
    },

    // ── 未央宫 ────────────────────────────────────────────────────────────
    han: (variant) => {
      const ruin = variant === 'ruin';
      return {
        sky: ['#6a5238', '#d8b880', '#7a6448'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 61);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, ruin ? '#3a2a20' : '#5a4430'); g.addColorStop(1, '#c8a878');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          sunGlow(ctx, w, h, 0.76, 0.5, 0.8, 'rgba(255,200,120,0.55)', 'rgba(255,200,120,0)');
          hills(b, ctx, w, h, { base: 0.64, color: '#6a4a38', alpha: 0.45 });
          // the great rammed-earth terrace
          ctx.fillStyle = ruin ? '#4a3828' : '#8a6a48';
          ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.86); ctx.lineTo(w * 0.22, h * 0.46); ctx.lineTo(w * 0.78, h * 0.46); ctx.lineTo(w * 0.9, h * 0.86); ctx.closePath(); ctx.fill();
          if (!ruin) { ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.moveTo(w * 0.18, h * 0.46); ctx.lineTo(w * 0.5, h * 0.3); ctx.lineTo(w * 0.82, h * 0.46); ctx.closePath(); ctx.fill(); }
          for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(40,28,20,0.6)'; ctx.fillRect(w * (0.26 + k * 0.085), h * 0.5, w * 0.03, h * 0.3); }
          // watchtowers marching off to the horizon
          for (let i = 0; i < 5; i++) {
            const x = w * (0.04 + i * 0.24), s = 1 - i * 0.1;
            ctx.fillStyle = 'rgba(60,44,30,0.75)';
            ctx.fillRect(x, h * (0.68 - 0.05 * s), w * 0.03 * s, h * 0.14 * s);
          }
          for (let i = 0; i < 40; i++) { const x = b.r(0, w); b.stroke([[x, b.r(0, h)], [x - 40, b.r(0, h) + 12]], { w: 1.6, color: '#d8b880', alpha: 0.22, dry: 0 }); }
          floatChars(b, ctx, w, h, '究天人之际通古今之变', { n: 20, color: '255,220,160', y1: 0.36 });
        },
        floor: { kind: 'paved', base: '#8a7048', dark: '#3a2c1e' },
        ground: '#5a4430',
        inkDark: true,
        fog: [0x6a5238, 26, 95],
        lights: { hemiSky: 0xffc890, hemiGround: 0x3a2818, hemiI: 1.15, key: 0xffc070, keyI: 2.5, keyPos: [7, 11, -5], fill: [0x8090c0, 0.4, [-5, 5, 5]] },
        motes: { n: 80, color: '#ffd8a0' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(63);
          // fallen column bases and a pair of stone gate-pillars (汉阙)
          for (const [x, z] of [[-7.6, -3.8], [7.6, -3.8]]) {
            const col = new THREE.Mesh(new THREE.BoxGeometry(1, 5.4, 1), mats.stone);
            col.position.set(x, 2.7, z); col.castShadow = true; root.add(col);
            const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), mats.tile);
            cap.position.set(x, 5.6, z); root.add(cap);
            const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.4, 0.7, 4), mats.tile);
            eave.rotation.y = Math.PI / 4; eave.position.set(x, 6.2, z); root.add(eave);
          }
          for (let k = 0; k < 7; k++) {
            const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.35, 12), mats.stone);
            d.position.set((R() - 0.5) * 16, -0.45, -5.5 - R() * 4); d.receiveShadow = true; root.add(d);
          }
          if (ruin) for (let k = 0; k < 4; k++) { const r = rock(mulberry32(140 + k), 0.5 + R() * 0.5, 0x6a5a48); r.position.set((R() - 0.5) * 14, -0.5, 5.5 + R() * 2); root.add(r); }
        },
      };
    },

    // ── 兰亭 ──────────────────────────────────────────────────────────────
    lanting: (variant) => {
      const dusk = variant === 'dusk';
      return {
        sky: dusk ? ['#3a3a4a', '#c8a880', '#4a4a44'] : ['#9ab0a0', '#e4ecd8', '#b0bca8'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 71);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (dusk) { g.addColorStop(0, '#3a3a4e'); g.addColorStop(1, '#c8a878'); } else { g.addColorStop(0, '#a8c0aa'); g.addColorStop(1, '#eef0dc'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          hills(b, ctx, w, h, { base: 0.52, color: dusk ? '#3a4440' : '#88a08a', alpha: 0.3, peak: 0.2 });
          hills(b, ctx, w, h, { base: 0.66, color: dusk ? '#2a3230' : '#6a8470', alpha: 0.4, peak: 0.14 });
          // a wall of bamboo
          for (let i = 0; i < 70; i++) {
            const x = b.r(0, w), tall = h * b.r(0.3, 0.72);
            b.stroke([[x, h], [x + b.r(-12, 12), h - tall]], { w: b.r(4, 9), color: dusk ? '#2a3a2c' : mix('#4A8C5C', '#1a1a1a', 0.3), alpha: 0.55, dry: 0.5 });
            for (let k = 1; k < 4; k++) { const y = h - tall * (k / 4); b.stroke([[x, y], [x + b.r(20, 44) * (b.R() < 0.5 ? -1 : 1), y - b.r(8, 22)]], { w: 2.2, color: dusk ? '#33452f' : '#4A8C5C', alpha: 0.5, dry: 0.2 }); }
          }
          for (let i = 0; i < 4; i++) b.mist(w, h, h * (0.66 + i * 0.06), { alpha: 0.3, color: '#eef0e4', n: 6 });
          floatChars(b, ctx, w, h, '流觞曲水永和九年', { n: 14, color: dusk ? '255,220,180' : '90,100,80', y1: 0.4 });
        },
        floor: { kind: 'stone', base: dusk ? '#5a5a50' : '#78806a' },
        ground: dusk ? '#33322c' : '#5a6450',
        inkDark: !dusk,
        fog: [dusk ? 0x4a4444 : 0xc8d0bc, 26, 90],
        lights: dusk
          ? { hemiSky: 0xc8a888, hemiGround: 0x2a2a24, hemiI: 1.1, key: 0xffc890, keyI: 2.2, keyPos: [-7, 9, -4], fill: [0x90a0c0, 0.45, [5, 5, 5]] }
          : { hemiSky: 0xdfeee0, hemiGround: 0x4a5040, hemiI: 1.35, key: 0xf4ffe0, keyI: 2.4, keyPos: [4, 12, 4] },
        motes: { n: 60, color: dusk ? '#ffd8a0' : '#d8f0c0' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(83);
          // the winding stream: a thin dark ribbon behind the table, with cups on it
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-11, 0.02, -6.5), new THREE.Vector3(-4, 0.02, -5.2), new THREE.Vector3(2, 0.02, -6.6), new THREE.Vector3(9, 0.02, -5.4), new THREE.Vector3(12, 0.02, -6.2)]);
          const water = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.55, 8, false), new THREE.MeshStandardMaterial({ color: 0x3a5a66, roughness: 0.25, metalness: 0.2 }));
          water.position.y = -0.3; root.add(water);
          for (let k = 0; k < 4; k++) {
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.6 }));
            const t0 = 0.15 + k * 0.22;
            cup.userData.tick = (dt, t) => { const p = curve.getPoint((t0 + t * 0.03) % 1); cup.position.set(p.x, 0.3, p.z); };
            root.add(cup);
          }
          for (let k = 0; k < 9; k++) {   // bamboo stalks as 3D props
            const x = (R() - 0.5) * 20, z = -7 - R() * 4;
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6 + R() * 3, 7), new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.9 }));
            st.position.set(x, 3.4, z); st.rotation.z = (R() - 0.5) * 0.12; st.castShadow = true; root.add(st);
          }
          for (let k = 0; k < 4; k++) { const r = rock(mulberry32(170 + k), 0.45 + R() * 0.4, 0x5a6458); r.position.set((R() - 0.5) * 15, -0.5, -5.6 - R() * 2); root.add(r); }
          if (dusk) for (const s of [-1, 1]) root.add(lampPost(mats, s * 7.4, -1, { dir: -s, h: 3.2 }));
        },
      };
    },

    // ── 莫高窟 ────────────────────────────────────────────────────────────
    dunhuang: (variant) => {
      const night = variant === 'night', inside = variant === 'cave';
      return {
        sky: night ? ['#0c1020', '#2a2a44', '#0a0a10'] : ['#7a4a28', '#e0a860', '#8a5a30'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 91);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (night) { g.addColorStop(0, '#0e1226'); g.addColorStop(1, '#3a3048'); }
          else if (inside) { g.addColorStop(0, '#2a1810'); g.addColorStop(1, '#6a3e20'); }
          else { g.addColorStop(0, '#6a3a20'); g.addColorStop(1, '#e8b878'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          if (night) { sunGlow(ctx, w, h, 0.28, 0.2, 0.3, 'rgba(230,236,255,0.85)', 'rgba(230,236,255,0)'); }
          else sunGlow(ctx, w, h, 0.7, 0.44, 0.7, 'rgba(255,190,110,0.6)', 'rgba(255,190,110,0)');
          if (!inside) {   // dunes
            for (let i = 0; i < 5; i++) {
              const y = h * (0.6 + i * 0.08);
              b.wash([[0, y], [w * 0.3, y - h * 0.06], [w * 0.62, y + h * 0.03], [w, y - h * 0.04], [w, h], [0, h]], { color: night ? '#2a2438' : '#b88a50', alpha: 0.4, blur: 6, edge: 0.2 });
            }
          }
          // the honeycombed cliff
          const cy = inside ? 0.0 : 0.16;
          ctx.fillStyle = night ? '#141220' : inside ? '#5a3418' : '#7a5230';
          ctx.fillRect(0, h * cy, w, h * (inside ? 1 : 0.6));
          for (let r = 0; r < (inside ? 5 : 3); r++) for (let c = 0; c < 14; c++) {
            const x = w * (0.02 + c * 0.072) + (r % 2) * w * 0.03, y = h * (cy + 0.12 + r * 0.16);
            ctx.fillStyle = night ? '#080810' : '#241208';
            ctx.beginPath(); ctx.ellipse(x, y, w * 0.022, h * 0.055, 0, 0, 6.28); ctx.fill();
            if (b.R() < (night ? 0.35 : 0.55)) {
              const gg = ctx.createRadialGradient(x, y, 0, x, y, w * 0.035);
              gg.addColorStop(0, 'rgba(255,190,110,0.75)'); gg.addColorStop(1, 'rgba(255,190,110,0)');
              ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, w * 0.035, 0, 6.28); ctx.fill();
            }
          }
          if (inside) {   // flying-apsara ribbons across the wall
            for (let k = 0; k < 6; k++) {
              const p = []; const y0 = h * b.r(0.1, 0.7);
              for (let t = 0; t < 1; t += 0.06) p.push([w * t, y0 + Math.sin(t * 7 + k) * h * 0.08]);
              b.stroke(p, { w: 14, color: ['#c8a04a', '#2a6a7a', '#b8322a'][k % 3], alpha: 0.3, dry: 0.5, taper: [0.1, 0.8] });
            }
          }
          floatChars(b, ctx, w, h, '莫高千佛飞天', { n: 14, color: night ? '200,214,255' : '255,220,150', y1: 0.3 });
        },
        floor: { kind: 'sand', base: night ? '#3a3448' : '#9a7448', dark: '#3a2818' },
        ground: night ? '#241f34' : '#6a4a28',
        fog: [night ? 0x14142a : 0x7a5230, 24, 85],
        lights: night
          ? { hemiSky: 0x6a7ab0, hemiGround: 0x1a1420, hemiI: 1.0, key: 0xc8d4ff, keyI: 1.9, keyPos: [-4, 12, -5], fill: [0xffa060, 0.5, [4, 4, 5]] }
          : { hemiSky: 0xffc088, hemiGround: 0x3a2010, hemiI: 1.15, key: 0xffb870, keyI: 2.4, keyPos: [6, 11, -4], fill: [0x90a0c0, 0.35, [-5, 5, 5]] },
        motes: { n: 90, color: night ? '#c0c8ff' : '#ffc880' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(97);
          for (let k = 0; k < 6; k++) { const r = rock(mulberry32(200 + k), 0.4 + R() * 0.6, night ? 0x3a3448 : 0x8a6a44); r.position.set((R() - 0.5) * 17, -0.5, -5.6 - R() * 3); root.add(r); }
          if (inside || night) for (const [x, z] of [[-6.8, -3.6], [6.8, -3.6]]) {   // oil lamps in niches
            const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
            lamp.scale.y = 1.6; lamp.position.set(x, 1.3, z); root.add(lamp);
            const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.16, 12), mats.bronze);
            dish.position.set(x, 0.8, z); root.add(dish);
            const pl = new THREE.PointLight(0xffb060, 18, 10, 1.5); pl.position.set(x, 1.5, z);
            pl.userData.tick = (dt, t) => { pl.intensity = 16 + Math.sin(t * 12 + x) * 2.4; };
            root.add(pl);
          }
          if (!inside) for (let k = 0; k < 3; k++) {   // a stub of the old poplar line
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3.4, 7), mats.wood);
            t.position.set(-10 + k * 9.5, 1.7, -8); t.rotation.z = (R() - 0.5) * 0.2; t.castShadow = true; root.add(t);
          }
        },
      };
    },

    // ── 江南市井 ──────────────────────────────────────────────────────────
    jiangnan: (variant) => {
      const night = variant === 'night';
      return {
        sky: night ? ['#0e1420', '#28303e', '#0a0c12'] : ['#8a9aa4', '#dfe4e2', '#a8b0ac'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 103);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (night) { g.addColorStop(0, '#0e1420'); g.addColorStop(1, '#38404a'); } else { g.addColorStop(0, '#9aacb4'); g.addColorStop(1, '#e8eae4'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          if (night) sunGlow(ctx, w, h, 0.72, 0.18, 0.28, 'rgba(236,240,255,0.7)', 'rgba(236,240,255,0)');
          hills(b, ctx, w, h, { base: 0.56, color: night ? '#1a222c' : '#8a9a94', alpha: 0.35, peak: 0.12 });
          // whitewashed walls with dark tile roofs
          for (let pass = 0; pass < 2; pass++) {
            let x = -40;
            while (x < w + 40) {
              const bw = 90 + b.R() * 140, bh = h * (0.16 + b.R() * 0.14) * (1 - pass * 0.25), base = h * (0.74 + pass * 0.06);
              ctx.fillStyle = night ? 'rgba(200,206,210,0.5)' : 'rgba(240,242,238,0.95)';
              ctx.fillRect(x, base - bh, bw, bh + h * 0.2);
              ctx.fillStyle = night ? '#161a20' : '#3a3e42';
              ctx.beginPath(); ctx.moveTo(x - 10, base - bh); ctx.quadraticCurveTo(x + bw / 2, base - bh - h * 0.05, x + bw + 10, base - bh); ctx.lineTo(x + bw + 10, base - bh + h * 0.02); ctx.quadraticCurveTo(x + bw / 2, base - bh - h * 0.03, x - 10, base - bh + h * 0.02); ctx.closePath(); ctx.fill();
              if (b.R() < 0.7) { ctx.fillStyle = `rgba(255,200,120,${night ? 0.85 : 0.4})`; ctx.fillRect(x + bw * 0.3, base - bh * 0.6, bw * 0.18, h * 0.05); }
              x += bw + b.R() * 20;
            }
          }
          // the river + reflections
          ctx.fillStyle = night ? 'rgba(20,30,44,0.9)' : 'rgba(120,150,150,0.55)';
          ctx.fillRect(0, h * 0.88, w, h * 0.12);
          for (let i = 0; i < 26; i++) { const x = b.r(0, w); ctx.fillStyle = `rgba(255,200,120,${(night ? 0.3 : 0.12) * b.r(0.4, 1)})`; ctx.fillRect(x, h * 0.89, b.r(6, 26), 3); }
          floatChars(b, ctx, w, h, '石头记西游本草游记', { n: 16, color: night ? '220,226,240' : '90,100,100', y1: 0.4 });
        },
        floor: { kind: 'paved', base: night ? '#4a4e54' : '#8a8a80', dark: '#22262a' },
        ground: night ? '#171b22' : '#5a5e5a',
        fog: [night ? 0x101620 : 0xc8ccc8, 26, 88],
        lights: night
          ? { hemiSky: 0x6a7a9a, hemiGround: 0x1a1a20, hemiI: 1.0, key: 0xc8d8ff, keyI: 1.8, keyPos: [3, 12, -6], fill: [0xffb070, 0.55, [-4, 4, 5]] }
          : { hemiSky: 0xdfe8e8, hemiGround: 0x4a4a44, hemiI: 1.3, key: 0xfff4e0, keyI: 2.3, keyPos: [-5, 12, 4] },
        motes: { n: 55, color: night ? '#ffd0a0' : '#e8f0e8' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(109);
          for (const z of [-4, 2.6]) for (const s of [-1, 1]) root.add(lampPost(mats, s * 7.5, z, { dir: -s, h: 3.4 }));
          // a moored boat with an arched canopy
          const boat = new THREE.Group();
          const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 3.4, 4, 10), new THREE.MeshStandardMaterial({ color: 0x2e2018, roughness: 0.9 }));
          hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, 0.55); hull.position.y = 0.3; boat.add(hull);
          const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 12, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.95, side: THREE.DoubleSide }));
          canopy.rotation.z = Math.PI / 2; canopy.position.set(0.2, 0.7, 0); boat.add(canopy);
          boat.position.set(-8.6, -0.35, -6.4); boat.rotation.y = 0.2;
          boat.userData.tick = (dt, t) => { boat.position.y = -0.35 + Math.sin(t * 0.8) * 0.05; boat.rotation.z = Math.sin(t * 0.6) * 0.02; };
          root.add(boat);
          for (let k = 0; k < 5; k++) {   // stacked crates / book bundles on the quay
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), mats.wood);
            box.position.set(7 + (R() - 0.5), 0.2 + Math.floor(k / 2) * 0.42, -5.4 + (k % 2) * 0.6);
            box.castShadow = true; root.add(box);
          }
        },
      };
    },

    // ── 泉州港 ────────────────────────────────────────────────────────────
    quanzhou: (variant) => {
      const night = variant === 'sea', deck = variant === 'ship';
      return {
        sky: night ? ['#060a16', '#182436', '#060810'] : ['#3a5a7a', '#cfe0ea', '#6a8496'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 131);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (night) { g.addColorStop(0, '#060a16'); g.addColorStop(1, '#22364a'); } else { g.addColorStop(0, '#4a6e8e'); g.addColorStop(1, '#d8e6ec'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          if (night) sunGlow(ctx, w, h, 0.68, 0.16, 0.26, 'rgba(232,238,255,0.8)', 'rgba(232,238,255,0)');
          else sunGlow(ctx, w, h, 0.22, 0.2, 0.55, 'rgba(255,240,200,0.5)', 'rgba(255,240,200,0)');
          hills(b, ctx, w, h, { base: 0.54, color: night ? '#101a26' : '#5a7286', alpha: 0.45, peak: 0.14 });
          // the sea, then the forest of masts along the quay
          ctx.fillStyle = night ? 'rgba(12,22,34,0.9)' : 'rgba(90,130,150,0.55)';
          ctx.fillRect(0, h * 0.6, w, h * 0.4);
          for (let i = 0; i < 40; i++) { const x = b.r(0, w), y = b.r(h * 0.62, h * 0.96); ctx.fillStyle = `rgba(${night ? '180,205,235' : '240,248,250'},${b.r(0.1, 0.4).toFixed(2)})`; ctx.fillRect(x, y, b.r(10, 40), 2); }
          const n = deck ? 5 : 13;
          for (let i = 0; i < n; i++) {
            const x = w * (0.03 + i * (0.94 / n)) + b.r(-12, 12), s = deck ? 1.5 : 0.7 + b.R() * 0.5;
            const base = h * (0.62 + b.R() * 0.06);
            ctx.strokeStyle = night ? 'rgba(20,28,38,0.95)' : 'rgba(45,35,25,0.9)'; ctx.lineWidth = 4 * s;
            ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + b.r(-6, 6), base - h * 0.4 * s); ctx.stroke();
            for (let k = 0; k < 3; k++) {   // battened sails
              const sy = base - h * 0.34 * s + k * h * 0.1 * s;
              ctx.fillStyle = night ? 'rgba(40,52,66,0.85)' : `rgba(${[200, 170, 120]},${(0.6 + b.R() * 0.3).toFixed(2)})`;
              ctx.fillRect(x, sy, w * 0.035 * s, h * 0.08 * s);
            }
            ctx.fillStyle = night ? 'rgba(16,24,34,0.95)' : 'rgba(58,40,26,0.95)';
            ctx.beginPath(); ctx.ellipse(x, base + h * 0.02, w * 0.03 * s, h * 0.022 * s, 0, 0, 6.28); ctx.fill();
          }
          // the stone pagoda that guided ships in
          const px = w * 0.86, py = h * 0.6, ph = h * 0.34;
          ctx.fillStyle = night ? '#0e1622' : '#6a6458';
          for (let i = 0; i < 5; i++) {
            const w0 = ph * (0.26 - i * 0.03), yb = py - i * ph / 5;
            ctx.fillRect(px - w0 / 2, yb - ph / 5, w0, ph / 5);
            ctx.fillRect(px - w0 * 0.72, yb - ph / 5, w0 * 1.44, 5);
          }
          floatChars(b, ctx, w, h, '刺桐番舶市舶', { n: 12, color: night ? '200,216,240' : '255,240,200', y1: 0.34 });
        },
        floor: { kind: 'paved', base: night ? '#3a4450' : '#8a8478', dark: '#26303a' },
        ground: night ? '#0c1520' : '#4a5a66',
        fog: [night ? 0x0a1220 : 0x5a7080, 26, 92],
        lights: night
          ? { hemiSky: 0x6a80b0, hemiGround: 0x101820, hemiI: 1.0, key: 0xc8d8ff, keyI: 1.9, keyPos: [3, 12, -6], fill: [0xffa060, 0.45, [-5, 4, 5]] }
          : { hemiSky: 0xcfe4f0, hemiGround: 0x4a5040, hemiI: 1.3, key: 0xfff0d0, keyI: 2.4, keyPos: [-6, 12, 4] },
        motes: { n: 70, color: night ? '#b8ccf0' : '#f0f4e8' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(139);
          // crates and jars stacked on the quay
          for (let k = 0; k < 10; k++) {
            const side = k % 2 ? 1 : -1, x = side * (7.2 + R() * 1.4), z = -4.6 + (k % 5) * 2.1;
            if (R() < 0.45) {
              const jar = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshStandardMaterial({ color: 0xeef2f0, roughness: 0.35 }));
              jar.scale.y = 1.25; jar.position.set(x, -0.1, z); jar.castShadow = true; root.add(jar);
            } else {
              const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), mats.wood);
              box.position.set(x, -0.25, z); box.rotation.y = R(); box.castShadow = true; root.add(box);
            }
          }
          // a moored junk astern of the table
          const boat = new THREE.Group();
          const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 5.2, 4, 12), new THREE.MeshStandardMaterial({ color: 0x2e2018, roughness: 0.9 }));
          hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, 0.5); hull.position.y = 0.5; boat.add(hull);
          for (const [mx, mh] of [[-1.6, 4.4], [0.6, 6], [2.4, 3.8]]) {
            const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, mh, 8), mats.wood);
            mast.position.set(mx, 0.6 + mh / 2, 0); boat.add(mast);
            const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.5, mh * 0.62), new THREE.MeshStandardMaterial({ color: night ? 0x3a4450 : 0xc8a878, roughness: 0.95, side: THREE.DoubleSide }));
            sail.position.set(mx + 0.75, 0.9 + mh * 0.5, 0); boat.add(sail);
          }
          boat.position.set(0, -0.7, -10.5); boat.rotation.y = 0.12;
          boat.userData.tick = (dt, t) => { boat.position.y = -0.7 + Math.sin(t * 0.6) * 0.07; boat.rotation.z = Math.sin(t * 0.5) * 0.015; };
          root.add(boat);
          for (const z of [-3.6, 2.8]) for (const s of [-1, 1]) root.add(lampPost(mats, s * 7.6, z, { dir: -s, h: 3.4 }));
        },
      };
    },

    // ── 藏书楼 ────────────────────────────────────────────────────────────
    cangshu: (variant) => {
      const lamp = variant === 'lamp', court = variant === 'court';
      return {
        sky: lamp ? ['#080808', '#181410', '#060504'] : court ? ['#6a7a84', '#dfe4e0', '#8a9490'] : ['#18120c', '#3a2c1e', '#100c08'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 149);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          if (court) { g.addColorStop(0, '#7a8a92'); g.addColorStop(1, '#e4e8e2'); }
          else if (lamp) { g.addColorStop(0, '#0a0908'); g.addColorStop(1, '#2a2118'); }
          else { g.addColorStop(0, '#1c150e'); g.addColorStop(1, '#4a3826'); }
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          if (court) {   // the courtyard: pool, wall, the two-storey hall
            hills(b, ctx, w, h, { base: 0.42, color: '#8a9490', alpha: 0.25, peak: 0.1 });
            ctx.fillStyle = 'rgba(238,240,234,0.95)'; ctx.fillRect(w * 0.06, h * 0.3, w * 0.88, h * 0.42);
            ctx.fillStyle = '#3a3e42';
            ctx.beginPath(); ctx.moveTo(w * 0.02, h * 0.3); ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.98, h * 0.3); ctx.lineTo(w * 0.98, h * 0.34); ctx.quadraticCurveTo(w * 0.5, h * 0.24, w * 0.02, h * 0.34); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#3a3e42'; ctx.fillRect(w * 0.06, h * 0.5, w * 0.88, h * 0.02);
            for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(60,44,28,0.9)'; ctx.fillRect(w * (0.1 + i * 0.105), h * 0.34, w * 0.045, h * 0.15); }
            for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,220,160,0.35)'; ctx.fillRect(w * (0.1 + i * 0.105), h * 0.54, w * 0.045, h * 0.14); }
            ctx.fillStyle = 'rgba(70,96,104,0.55)'; ctx.fillRect(0, h * 0.74, w, h * 0.26);   // 天一池
            for (let i = 0; i < 20; i++) { const x = b.r(0, w); ctx.fillStyle = `rgba(230,240,240,${b.r(0.1, 0.3).toFixed(2)})`; ctx.fillRect(x, b.r(h * 0.76, h * 0.96), b.r(14, 50), 2); }
          } else {   // inside: wall after wall of book cases
            const rows = 5, cols = 11;
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
              const x = w * (0.01 + c * 0.09), y = h * (0.05 + r * 0.17), cw = w * 0.085, ch2 = h * 0.155;
              ctx.fillStyle = lamp ? '#241a12' : '#3a2a1c'; ctx.fillRect(x, y, cw, ch2);
              ctx.fillStyle = 'rgba(12,8,6,0.9)'; ctx.fillRect(x + 4, y + 4, cw - 8, ch2 - 8);
              let bx = x + 6;
              while (bx < x + cw - 10) {
                const bw = 4 + b.R() * 8;
                const lit = lamp ? Math.max(0, 1 - Math.abs(x - w * 0.26) / (w * 0.4)) : 1;
                ctx.fillStyle = mix(['#8a6a48', '#6a4a3a', '#4a5a4a', '#7a5a5a'][Math.floor(b.R() * 4)], '#180f0a', 1 - 0.35 - lit * 0.4);
                ctx.fillRect(bx, y + ch2 * 0.18, bw, ch2 * 0.66);
                bx += bw + 2;
              }
            }
            if (lamp) sunGlow(ctx, w, h, 0.26, 0.62, 0.5, 'rgba(255,190,100,0.55)', 'rgba(255,170,80,0)');
          }
          floatChars(b, ctx, w, h, '经史子集天一生水', { n: 10, color: court ? '90,100,100' : '230,200,150', y0: 0.04, y1: 0.3 });
        },
        floor: { kind: 'wood', base: lamp ? '#4a3420' : court ? '#7a6a52' : '#5a3e26' },
        ground: lamp ? '#140e08' : court ? '#4a5254' : '#241a10',
        fog: [lamp ? 0x100b06 : court ? 0x8a9490 : 0x241a10, 24, 80],
        lights: court
          ? { hemiSky: 0xdfe8e4, hemiGround: 0x4a4436, hemiI: 1.3, key: 0xfff4e0, keyI: 2.3, keyPos: [-5, 12, 4] }
          : { hemiSky: 0x6a5a44, hemiGround: 0x18120c, hemiI: 0.95, key: 0xffc880, keyI: lamp ? 1.7 : 2.1, keyPos: [-6, 10, 3], fill: [0xffa050, 0.6, [4, 4, 5]] },
        motes: { n: court ? 50 : 80, color: court ? '#e8f0e8' : '#ffd8a0' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(151);
          // book cases flanking the table
          for (const s of [-1, 1]) {
            const cse = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 5.6), mats.darkWood);
            frame.position.y = 2.2; frame.castShadow = true; cse.add(frame);
            for (let r = 0; r < 4; r++) for (let k = 0; k < 16; k++) {
              const bk = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.1 + R() * 0.1), new THREE.MeshStandardMaterial({ color: [0x8a6a48, 0x6a4a3a, 0x4a5a4a, 0x7a5a5a][Math.floor(R() * 4)], roughness: 0.9 }));
              bk.position.set(s * -0.12, 0.7 + r * 1.05, -2.5 + k * 0.33 + R() * 0.05);
              cse.add(bk);
            }
            cse.position.set(s * 8.4, -0.6, -2); root.add(cse);
          }
          // the desk with its single lamp
          const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 1.4), mats.wood);
          desk.position.set(0, 0.55, -8.2); desk.castShadow = true; root.add(desk);
          for (const dx of [-1.3, 1.3]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), mats.darkWood); leg.position.set(dx, 0, -8.2); root.add(leg); }
          const book = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0xefe6d0, roughness: 0.9 }));
          book.position.set(0.3, 0.68, -8.2); book.rotation.y = 0.1; root.add(book);
          const flame = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
          flame.scale.y = 1.8; flame.position.set(-1.1, 0.95, -8.2); root.add(flame);
          const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.12, 12), mats.bronze);
          dish.position.set(-1.1, 0.72, -8.2); root.add(dish);
          const pl = new THREE.PointLight(0xffb060, lamp ? 30 : 18, 14, 1.5); pl.position.set(-1.1, 1.2, -8.2);
          pl.userData.tick = (dt, t) => { pl.intensity = (lamp ? 28 : 17) + Math.sin(t * 11) * 2.2; flame.scale.y = 1.8 + Math.sin(t * 17) * 0.2; };
          root.add(pl);
          if (court) {   // the fire-pool in front of the hall
            const pool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshStandardMaterial({ color: 0x3a5a62, roughness: 0.2, metalness: 0.3 }));
            pool.rotation.x = -Math.PI / 2; pool.position.set(0, -0.58, 6.5); root.add(pool);
          }
        },
      };
    },

    // ── 观星台 ────────────────────────────────────────────────────────────
    tiangong: (variant) => {
      const star = variant === 'star';
      return {
        sky: star ? ['#04060e', '#10182c', '#04050a'] : ['#0e1626', '#3a3040', '#140e0a'],
        paint: (ctx, w, h) => {
          const b = brush(ctx, 113);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, star ? '#04060e' : '#0e1424'); g.addColorStop(1, star ? '#1a2032' : '#4a3020');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          for (let i = 0; i < 260; i++) {   // the real point of this scene: a sky full of stars
            const x = b.r(0, w), y = b.r(0, h * 0.72);
            ctx.fillStyle = `rgba(230,238,255,${b.r(0.2, 0.95).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(x, y, b.r(0.8, 2.4), 0, 6.28); ctx.fill();
          }
          for (let k = 0; k < 5; k++) {   // constellation lines
            let x = b.r(w * 0.05, w * 0.9), y = b.r(h * 0.06, h * 0.5);
            ctx.strokeStyle = 'rgba(180,200,240,0.35)'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(x, y);
            for (let s = 0; s < 4; s++) { x += b.r(-90, 110); y += b.r(-50, 60); ctx.lineTo(x, y); ctx.moveTo(x, y); }
            ctx.stroke();
          }
          hills(b, ctx, w, h, { base: 0.78, color: '#0c1018', alpha: 0.8, peak: 0.1 });
          // the terrace itself, plus workshop fires at its foot
          ctx.fillStyle = '#181c22';
          ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.82); ctx.lineTo(w * 0.38, h * 0.42); ctx.lineTo(w * 0.62, h * 0.42); ctx.lineTo(w * 0.7, h * 0.82); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(200,170,90,0.8)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(w * 0.5, h * 0.38, h * 0.07, 0, 6.28); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.38, h * 0.07, h * 0.025, 0, 0, 6.28); ctx.stroke();
          for (let i = 0; i < 7; i++) {
            const x = w * (0.06 + i * 0.14);
            if (x > w * 0.28 && x < w * 0.72) continue;
            const gg = ctx.createRadialGradient(x, h * 0.84, 0, x, h * 0.84, h * 0.1);
            gg.addColorStop(0, 'rgba(255,150,60,0.8)'); gg.addColorStop(1, 'rgba(255,150,60,0)');
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, h * 0.84, h * 0.1, 0, 6.28); ctx.fill();
          }
          floatChars(b, ctx, w, h, '天工开物格物致知', { n: 12, color: '200,220,255', y0: 0.5, y1: 0.75 });
        },
        floor: { kind: 'stone', base: star ? '#3a4048' : '#4a4640' },
        ground: star ? '#0a0e18' : '#1e1a1c',
        fog: [star ? 0x080c16 : 0x1a1620, 26, 95],
        lights: star
          ? { hemiSky: 0x506088, hemiGround: 0x101018, hemiI: 0.95, key: 0xc8d8ff, keyI: 1.8, keyPos: [0, 13, -4], fill: [0xff9040, 0.5, [-5, 3, 5]] }
          : { hemiSky: 0x5a6a90, hemiGround: 0x2a1810, hemiI: 1.0, key: 0xffc890, keyI: 2.1, keyPos: [-5, 11, -4], fill: [0xff8030, 0.6, [5, 3, 5]] },
        motes: { n: 70, color: star ? '#c8d8ff' : '#ffa050' },
        props: (root) => {
          const mats = M();
          const R = mulberry32(127);
          // an armillary sphere on a plinth behind the table
          const arm = new THREE.Group();
          const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), mats.stone);
          plinth.position.y = 0.6; plinth.castShadow = true; arm.add(plinth);
          for (const [rot, tilt] of [[0, 0], [Math.PI / 2, 0], [0, Math.PI / 2], [0.7, 0.4]]) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 8, 40), mats.bronze);
            ring.rotation.set(tilt, rot, 0); ring.position.y = 2.3; arm.add(ring);
          }
          const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc060, emissiveIntensity: 1.2 }));
          core.position.y = 2.3; arm.add(core);
          arm.userData.tick = (dt, t) => { arm.rotation.y = t * 0.12; };
          arm.position.set(0, -0.62, -9); root.add(arm);
          // furnaces at the sides
          for (const s of [-1, 1]) {
            const kiln = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.95 }));
            kiln.position.set(s * 8.4, 0.28, -5.2); kiln.castShadow = true; root.add(kiln);
            const fire = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff9030 }));
            fire.position.set(s * 8.4, 1.28, -5.2); root.add(fire);
            const pl = new THREE.PointLight(0xff7a20, 24, 14, 1.6); pl.position.set(s * 8.4, 1.6, -5.2);
            pl.userData.tick = (dt, t) => { pl.intensity = 22 + Math.sin(t * 9 + s) * 3; fire.scale.setScalar(1 + Math.sin(t * 14 + s) * 0.12); };
            root.add(pl);
          }
          for (let k = 0; k < 4; k++) { const r = rock(mulberry32(230 + k), 0.35 + R() * 0.4, 0x3a4048); r.position.set((R() - 0.5) * 16, -0.5, 5.6 + R() * 2); root.add(r); }
        },
      };
    },
  };
}
