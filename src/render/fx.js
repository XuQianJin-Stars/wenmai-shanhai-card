// Battle VFX (docs/art/VFX_VISUAL.md, web version): ink splashes, summon rings, element sigils, floating numbers,
// talisman fire, lightning, the targeting brush-arrow. All pooled-by-lifetime meshes with additive/ink materials.
import * as THREE from 'three';
import { tween, ease } from './tween.js';
import { canvas, brush, rgba, FONT_BRUSH, FONT_SERIF, INK } from './ink.js';
import { EL } from '../data/cards.js';
import { mulberry32 } from '../rules/rng.js';
import { elementalFx } from './elemfx.js';

const R = mulberry32(99);
const texCache = new Map();
function ctex(key, w, h, paint) {
  let t = texCache.get(key);
  if (!t) {
    const c = canvas(w, h);
    paint(c.getContext('2d'), w, h);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, t);
  }
  return t;
}
const splashTex = (k) => ctex(`splash${k}`, 256, 256, (ctx, w, h) => {
  const b = brush(ctx, 10 + k);
  b.wash(b.blob(w / 2, h / 2, w * 0.2, h * 0.2, { wob: 0.35 }), { color: INK, alpha: 0.95, blur: 2, edge: 0.5 });
  b.splatter(w / 2, h / 2, w * 0.45, { n: 60, size: 5, alpha: 0.9 });
  for (let i = 0; i < 6; i++) { const a = R() * 6.28; b.stroke([[w / 2, h / 2], [w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * h * 0.4]], { w: 6, dry: 0.5, taper: [0.02, 0.9] }); }
});
const ringTex = () => ctex('ring', 512, 512, (ctx, w, h) => {
  const b = brush(ctx, 5);
  const pts = []; for (let t = 0; t <= 1.02; t += 0.02) pts.push([w / 2 + Math.cos(t * 6.283) * w * 0.4, h / 2 + Math.sin(t * 6.283) * h * 0.4]);
  b.stroke(pts, { w: 22, color: '#ffffff', alpha: 0.95, dry: 0.6, taper: [0.02, 0.2] });
});
const sigilTex = (el) => ctex(`sigil:${el}`, 512, 512, (ctx, w, h) => {
  const c = EL[el]?.color ?? '#c8a04a';
  ctx.translate(w / 2, h / 2);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, w * 0.46, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, w * 0.42, 0, 6.283); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, w * 0.2, 0, 6.283); ctx.stroke();
  const chars = el === 'barrier' ? ['金', '木', '水', '火', '土'] : el === 'yinyang' ? ['阴', '阳', '阴', '阳'] : [EL[el]?.zh ?? '文', EL[el]?.beast?.[0] ?? '', EL[el]?.beast?.[1] ?? '', EL[el]?.zh ?? ''];
  ctx.fillStyle = '#fff'; ctx.font = `${w * 0.1}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => { const a = (i / chars.length) * 6.283 - Math.PI / 2; ctx.fillText(ch, Math.cos(a) * w * 0.31, Math.sin(a) * h * 0.31); });
  for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.283; ctx.fillRect(Math.cos(a) * w * 0.44 - 2, Math.sin(a) * h * 0.44 - 2, 4, 4); }
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = c; ctx.fillRect(-w, -h, w * 2, h * 2);
});
const glyphTex = (ch) => ctex(`glyph:${ch}`, 128, 128, (ctx, w, h) => {
  ctx.font = `${w * 0.78}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff'; ctx.fillText(ch, w / 2, h / 2 + 4);
});
const petalTex = () => ctex('petal', 64, 64, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.46, h * 0.26, 0.35, 0, 6.283); ctx.fill();
});
const glowTex = () => ctex('glow', 128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

export function createFx(app) {
  const { scene, camera } = app;
  const root = new THREE.Group();
  root.name = 'fx';
  scene.add(root);
  const live = new Set();

  function spawn(mesh, life, update) {
    root.add(mesh);
    const it = { mesh, life, t: 0, update };
    live.add(it);
    return it;
  }
  app.onFrame((dt) => {
    for (const it of [...live]) {
      it.t += dt;
      const k = Math.min(1, it.t / it.life);
      it.update?.(k, dt);
      if (k >= 1) { live.delete(it); root.remove(it.mesh); it.mesh.geometry?.dispose(); if (it.mesh.material && !it.mesh.material.userData.shared) it.mesh.material.dispose(); }
    }
    arrowTick(dt);
  });

  function flatPlane(tex, size, { color = 0xffffff, additive = false, opacity = 1 } = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !additive }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  const api = {
    /** Ink splash on the table at p. */
    splash(p, { size = 1.4, color = 0x111111 } = {}) {
      const m = flatPlane(splashTex(Math.floor(R() * 3)), size, { color });
      m.position.set(p.x, 0.03 + R() * 0.01, p.z);
      m.rotation.z = R() * 6.28;
      spawn(m, 1.6, (k) => { const s = 0.4 + ease.out(Math.min(1, k * 3)) * 0.8; m.scale.setScalar(s); m.material.opacity = k < 0.6 ? 0.85 : 0.85 * (1 - (k - 0.6) / 0.4); });
    },
    /** Expanding ring (summon shockwave). */
    ring(p, { color = '#c8a04a', size = 3, life = 0.9, y = 0.05 } = {}) {
      const m = flatPlane(ringTex(), 1, { color: new THREE.Color(color), additive: true });
      m.position.set(p.x, y, p.z);
      spawn(m, life, (k) => { m.scale.setScalar(0.3 + ease.out(k) * size); m.material.opacity = 1 - k; m.rotation.z += 0.02; });
    },
    /** Rotating element sigil (resonance) lying on the table; returns handle with .stop(). */
    sigil(p, el, { size = 3.4, life = 2.6, persist = false } = {}) {
      const m = flatPlane(sigilTex(el), size, { additive: true, opacity: 0 });
      m.position.set(p.x, 0.04, p.z);
      const it = spawn(m, persist ? 1e9 : life, (k, dt) => {
        m.rotation.z += dt * 0.4;
        const t = it.t;
        m.material.opacity = persist ? Math.min(0.55, t * 1.5) * (0.8 + 0.2 * Math.sin(t * 2)) : Math.sin(Math.min(1, k) * Math.PI) * 0.9;
        if (!persist) m.scale.setScalar(0.7 + k * 0.4);
      });
      return { stop() { it.life = it.t + 0.001; }, mesh: m };
    },
    /** Soft glow burst at a 3D point. */
    burst(p, { color = '#ffd88a', size = 2.2, life = 0.6 } = {}) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      s.position.copy(p);
      spawn(s, life, (k) => { s.scale.setScalar(size * (0.5 + k)); s.material.opacity = 1 - k; });
    },
    /** Sparks flying out (additive points). */
    sparks(p, { color = '#ffb050', n = 26, speed = 3, life = 0.8, gravity = -4 } = {}) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), vel = [];
      for (let i = 0; i < n; i++) {
        pos.set([p.x, p.y, p.z], i * 3);
        const a = R() * 6.28, e = R() * 1.2;
        vel.push([Math.cos(a) * Math.cos(e) * speed * (0.4 + R()), Math.sin(e) * speed * (0.5 + R()), Math.sin(a) * Math.cos(e) * speed * (0.4 + R())]);
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex(), toneMapped: false }));
      spawn(m, life, (k, dt) => {
        for (let i = 0; i < n; i++) { vel[i][1] += gravity * dt; pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] += vel[i][1] * dt; pos[i * 3 + 2] += vel[i][2] * dt; }
        g.attributes.position.needsUpdate = true;
        m.material.opacity = 1 - k;
      });
    },
    /** Rising number / word in brush font. */
    text(p, str, { color = '#f4e2c0', size = 0.9, stroke = '#1a1a1a', life = 1.3, rise = 1.1 } = {}) {
      const c = canvas(512, 160), ctx = c.getContext('2d');
      ctx.font = `${str.length > 3 ? 88 : 120}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 14; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, 256, 84);
      ctx.fillStyle = color; ctx.fillText(str, 256, 84);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
      s.renderOrder = 20;
      s.position.copy(p);
      const y0 = p.y;
      spawn(s, life, (k) => {
        const pop = k < 0.15 ? ease.back(k / 0.15) : 1;
        s.scale.set(size * 3.2 * pop, size * pop, 1);
        s.position.y = y0 + ease.out(k) * rise;
        s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      });
      s.material.userData.onDispose = () => t.dispose();
    },
    /** Jagged lightning from the sky to p. */
    lightning(p, { color = '#fff6d0' } = {}) {
      const pts = [];
      let x = p.x + (R() - 0.5) * 2, z = p.z - 1;
      for (let i = 0; i <= 12; i++) {
        const k = i / 12;
        pts.push(new THREE.Vector3(x + (p.x - x) * k + (R() - 0.5) * 0.5 * (1 - k), 9 * (1 - k) + p.y, z + (p.z - z) * k + (R() - 0.5) * 0.4 * (1 - k)));
      }
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 40, 0.05, 5);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      spawn(m, 0.45, (k) => { m.material.opacity = (1 - k) * (0.6 + 0.4 * Math.sin(k * 60)); });
      api.burst(p, { color, size: 3, life: 0.5 });
    },
    /** Pillar of light (bond activation, chapter end). */
    pillar(p, { color = '#ffd88a', h = 8, life = 1.8, r = 0.8 } = {}) {
      const g = new THREE.CylinderGeometry(r, r * 1.3, h, 24, 1, true);
      g.translate(0, h / 2, 0);
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { color: { value: new THREE.Color(color) }, o: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 color; uniform float o; varying vec2 vUv; void main(){ float a = (1.0 - vUv.y) * o * (0.6 + 0.4*sin(vUv.x*40.0)); gl_FragColor = vec4(color*1.4, a); }' });
      const m = new THREE.Mesh(g, mat);
      m.position.set(p.x, 0, p.z);
      spawn(m, life, (k) => { mat.uniforms.o.value = Math.sin(k * Math.PI) * 0.8; m.scale.set(1 + k * 0.5, 0.3 + ease.out(k) * 0.7, 1 + k * 0.5); });
    },
    /** Brush glyphs drifting up from p (poem lines, 李白/苏轼). */
    glyphs(p, str, { color = '#ffe2a0', spread = 1.6, life = 1.8, size = 0.55 } = {}) {
      [...str].forEach((ch, i) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTex(ch), color: new THREE.Color(color), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        s.renderOrder = 19;
        const x0 = p.x + (R() - 0.5) * spread, z0 = p.z + (R() - 0.5) * spread * 0.6, y0 = p.y + R() * 0.4, sway = R() * 6.28, d = i * 0.08;
        spawn(s, life + d, (k) => {
          const t = Math.max(0, (k * (life + d) - d) / life);
          s.position.set(x0 + Math.sin(sway + t * 5) * 0.2, y0 + ease.out(t) * 1.8, z0);
          s.scale.setScalar(size * (t < 0.2 ? t / 0.2 : 1));
          s.material.opacity = t <= 0 ? 0 : t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        });
      });
    },
    /** Petals / leaves drifting down around p. */
    petals(p, { color = '#e8a0b8', n = 18, life = 1.9, spread = 3, size = 0.34, rise = 1.2 } = {}) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.6), new THREE.MeshBasicMaterial({ map: petalTex(), color: new THREE.Color(color), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
        const x0 = p.x + (R() - 0.5) * spread, z0 = p.z + (R() - 0.5) * spread * 0.7, y0 = p.y + rise + R() * 2.2;
        const sway = R() * 6.28, spin = (R() - 0.5) * 4, fall = 1.3 + R() * 1.1, d = R() * 0.5;
        spawn(m, life + d, (k) => {
          const t = Math.max(0, (k * (life + d) - d) / life);
          m.position.set(x0 + Math.sin(sway + t * 5) * 0.5, y0 - t * fall * 1.8, z0 + Math.cos(sway + t * 4) * 0.35);
          m.rotation.set(t * spin, sway + t * spin * 1.4, t * spin * 0.6);
          m.material.opacity = t <= 0 ? 0 : t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
        });
      }
    },
    /** Silk ribbons sweeping outward from p. */
    ribbon(p, { color = '#e8c070', n = 3, life = 1.2, len = 3.6, w = 0.16, y = 0.7 } = {}) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 6.28 + R(), lift = 0.9 + R() * 1.1;
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.1) {
          const a = a0 + t * 2.2;
          pts.push(new THREE.Vector3(p.x + Math.cos(a) * len * t, p.y + y + Math.sin(t * Math.PI) * lift, p.z + Math.sin(a) * len * t * 0.6));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { color: { value: new THREE.Color(color) }, o: { value: 0 } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
          // fade along the stroke so it reads as a brush sweep rather than a tube
          fragmentShader: 'uniform vec3 color; uniform float o; varying vec2 vUv; void main(){ float t = vUv.x; float a = smoothstep(0.0,0.12,t) * (1.0 - smoothstep(0.55,1.0,t)); gl_FragColor = vec4(color*1.25, a*o); }',
        });
        const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, w, 6, false), mat);
        spawn(m, life, (k) => { mat.uniforms.o.value = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.9; m.scale.setScalar(0.55 + ease.out(k) * 0.65); });
      }
    },
    /** A bright tapered line from a to b (a hit, a gaze, a thrown thing). */
    beam(a, b, { color = '#ffe6a0', life = 0.5, w = 0.07 } = {}) {
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.25, 0));
      const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 24, w, 6, false);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      spawn(m, life, (k) => { m.material.opacity = (1 - k) * (0.7 + 0.3 * Math.sin(k * 40)); });
      api.burst(b, { color, size: 1.6, life: life * 0.9 });
    },
    /** Streaks falling straight down over an area (rain, ash, sand). */
    rain(p, { color = '#9fc8e0', n = 30, life = 1.1, spread = 5, from = 5, speed = 6 } = {}) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), y0 = [], delay = [];
      for (let i = 0; i < n; i++) {
        pos.set([p.x + (R() - 0.5) * spread, p.y + from * (0.5 + R()), p.z + (R() - 0.5) * spread * 0.7], i * 3);
        y0.push(pos[i * 3 + 1]); delay.push(R() * 0.4);
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.24, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex(), toneMapped: false }));
      spawn(m, life, (k, dt) => {
        for (let i = 0; i < n; i++) if (k * life > delay[i]) pos[i * 3 + 1] = Math.max(p.y, pos[i * 3 + 1] - speed * dt);
        g.attributes.position.needsUpdate = true;
        m.material.opacity = k < 0.7 ? 0.9 : 0.9 * (1 - (k - 0.7) / 0.3);
      });
    },
    /** Motes circling a unit (a halo, a swarm, an idea). */
    orbit(p, { color = '#ffd88a', n = 14, life = 1.5, r = 1.7, h = 0.6, turns = 1.5 } = {}) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), ph = [];
      for (let i = 0; i < n; i++) { ph.push((i / n) * 6.28); pos.set([p.x, p.y + h, p.z], i * 3); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.26, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex(), toneMapped: false }));
      spawn(m, life, (k) => {
        for (let i = 0; i < n; i++) {
          const a = ph[i] + k * turns * 6.28, rr = r * (0.3 + ease.out(k) * 0.9);
          pos[i * 3] = p.x + Math.cos(a) * rr;
          pos[i * 3 + 1] = p.y + h + Math.sin(a * 2 + k * 3) * 0.45;
          pos[i * 3 + 2] = p.z + Math.sin(a) * rr * 0.6;
        }
        g.attributes.position.needsUpdate = true;
        m.material.opacity = Math.sin(k * Math.PI) * 0.95;
      });
    },
    /** A protective shell blooming over p: bright at the rim, near-invisible face on. */
    dome(p, { color = '#9fd8ff', r = 1.6, life = 1.1, y = 0 } = {}) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
        uniforms: { color: { value: new THREE.Color(color) }, o: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0);
          vV = normalize(-mv.xyz); vY = uv.y; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 color; uniform float o; varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){ float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
          float band = 0.35 + 0.65 * smoothstep(0.0, 0.5, vY);
          gl_FragColor = vec4(color * 1.6, rim * 0.6 * band * o); }`,
      });
      const m = new THREE.Mesh(new THREE.SphereGeometry(r * 1.2, 28, 16, 0, 6.283, 0, Math.PI / 2), mat);
      m.position.set(p.x, p.y + y, p.z);
      m.scale.y = 0.8;
      spawn(m, life, (k) => { const s = 0.45 + ease.out(k) * 0.75; m.scale.set(s, s * 0.8, s); mat.uniforms.o.value = Math.sin(k * Math.PI) * 0.95; });
      api.ring(p, { color, size: r * 1.5, life: life * 0.8 });
    },
    /** Angular fragments thrown outward (stone, shell, porcelain). */
    shards(p, { color = '#d8d0c0', n = 14, life = 1.0, size = 0.3, speed = 4.2 } = {}) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.TetrahedronGeometry(size * (0.5 + R())),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, toneMapped: false }));
        m.position.copy(p);
        const a = R() * 6.28, e = 0.3 + R() * 0.9, sp = speed * (0.5 + R());
        const v = new THREE.Vector3(Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp, Math.sin(a) * Math.cos(e) * sp);
        const spin = new THREE.Vector3(R() * 6, R() * 6, R() * 6);
        spawn(m, life, (k, dt) => {
          v.y -= 9 * dt;
          m.position.addScaledVector(v, dt);
          m.rotation.set(m.rotation.x + spin.x * dt, m.rotation.y + spin.y * dt, m.rotation.z + spin.z * dt);
          m.material.opacity = 1 - k;
        });
      }
    },
    /** Fire licking up around p (焚天). */
    fire(p, { n = 30, life = 1.0, spread = 0.6 } = {}) {
      for (let i = 0; i < 3; i++) api.sparks(new THREE.Vector3(p.x + (R() - 0.5) * spread, p.y, p.z + (R() - 0.5) * spread), { color: i ? '#ff7a2a' : '#ffd060', n: n / 3, speed: 2, gravity: 3, life });
      api.burst(p, { color: '#ff7a30', size: 2, life: 0.7 });
    },
  };

  Object.assign(api, elementalFx({ spawn, R, api, app }));   // 五行 / 雷 / 风 (see elemfx.js)

  // ── targeting arrow: a curved brush ribbon from source to the cursor ──
  let arrow = null;
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xb8322a, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, side: THREE.DoubleSide, toneMapped: false });
  arrowMat.userData.shared = true;
  const headMat = arrowMat;
  let arrowFrom = new THREE.Vector3(), arrowTo = new THREE.Vector3();
  function arrowTick() {
    if (!arrow) return;
    const a = arrowFrom, b = arrowTo;
    const mid = a.clone().lerp(b, 0.5); mid.y += 1.2 + a.distanceTo(b) * 0.15;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    arrow.body.geometry.dispose();
    arrow.body.geometry = new THREE.TubeGeometry(curve, 24, 0.045, 6);
    const tip = curve.getPoint(1), before = curve.getPoint(0.94);
    arrow.head.position.copy(tip);
    arrow.head.lookAt(tip.clone().add(tip.clone().sub(before)));
    arrow.head.rotateX(Math.PI / 2);
  }
  api.arrowShow = (from, color = 0xb8322a) => {
    if (!arrow) {
      arrow = new THREE.Group();
      arrow.body = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat);
      arrow.head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), headMat);
      arrow.add(arrow.body, arrow.head);
      arrow.renderOrder = 30; arrow.body.renderOrder = 30; arrow.head.renderOrder = 30;
      root.add(arrow);
    }
    arrowMat.color.set(color);
    arrowFrom.copy(from); arrowTo.copy(from);
    arrow.visible = true;
  };
  api.arrowTo = (p) => { if (arrow) arrowTo.copy(p); };
  api.arrowHide = () => { if (arrow) arrow.visible = false; arrow && (arrow.body.geometry.dispose(), root.remove(arrow)); arrow = null; };
  api.clear = () => { for (const it of live) { root.remove(it.mesh); } live.clear(); api.arrowHide(); };
  api.tween = tween;
  return api;
}
