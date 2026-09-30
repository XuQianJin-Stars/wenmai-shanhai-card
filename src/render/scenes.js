// Battle environments (docs/art/SCENES/SCENE_DESIGN_v1.md): 昆仑墟 (floating jade platform over a sea of clouds), 长安 (lantern-lit street at dusk),
// 古戏台 (lantern-lit opera stage), 书斋 (scholar's study at night). Procedural geometry + ink-painted backdrops.
import * as THREE from 'three';
import { canvas, brush, paper, rgba, mix, INK, PAPER, FONT_BRUSH, seal } from './ink.js';
import { mulberry32 } from '../rules/rng.js';
import { lateScenes } from './scenesLate.js';

function canvasTex(c, { repeat = null, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

function skyDome(top, mid, bottom) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bottom, smoothstep(0.0, -0.4, h)); gl_FragColor = vec4(c, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), mat);
  m.renderOrder = -10;
  return m;
}

/** A painted panorama on a partial cylinder behind the table. */
function backdrop(paint, { radius = 55, height = 34, y = 4, arc = Math.PI * 1.25, w = 2400, h = 700, transparent = true } = {}) {
  const c = canvas(w, h);
  paint(c.getContext('2d'), w, h);
  const t = canvasTex(c);
  const geo = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true, Math.PI - arc / 2, arc);
  const mat = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, transparent, depthWrite: false, fog: false, toneMapped: true });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  m.scale.x = -1;   // seen from inside the cylinder the texture would read mirrored
  m.renderOrder = -5;
  return m;
}

function paintMountains(ctx, w, h, { seed = 1, layers = [[0.5, 0.18, '#5d6b68'], [0.62, 0.28, '#3e4a47'], [0.74, 0.42, '#26302e']], sun = null, clouds = true } = {}) {
  const b = brush(ctx, seed);
  ctx.clearRect(0, 0, w, h);
  if (sun) {
    const [x, y, r, c] = sun;
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * h * 3);
    g.addColorStop(0, rgba(c, 0.8)); g.addColorStop(0.3, rgba(c, 0.25)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(c, 0.95); ctx.beginPath(); ctx.arc(x * w, y * h, r * h, 0, Math.PI * 2); ctx.fill();
  }
  for (const [base, alpha, col] of layers) {
    const pts = [[0, h]];
    let x = -20;
    const R = b.R;
    pts.push([x, h * base]);
    while (x < w + 40) {
      const step = w * (0.03 + R() * 0.07);
      const peak = h * (base - 0.08 - R() * 0.22);
      pts.push([x + step * 0.5, peak]);
      x += step;
      pts.push([x, h * (base - R() * 0.06)]);
    }
    pts.push([w + 40, h]);
    b.wash(pts, { color: col, alpha, blur: 3, edge: 0.7 });
    // texture strokes (皴法) down the slopes
    for (let i = 0; i < 70; i++) {
      const sx = R() * w, sy = h * (base - R() * 0.2);
      b.stroke([[sx, sy], [sx + (R() - 0.5) * 20, sy + 20 + R() * 40]], { w: 2 + R() * 3, color: col, alpha: alpha * 1.2, dry: 0.7 });
    }
    if (clouds) b.mist(w, h, h * (base + 0.02), { alpha: 0.35, color: '#e8e4da', n: 9 });
  }
}

function paintClouds(ctx, w, h, seed = 4, { color = '#f2efe6', alpha = 0.55 } = {}) {
  const b = brush(ctx, seed);
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    b.wash(b.blob(b.r(0, w), b.r(0, h), b.r(w * 0.04, w * 0.14), b.r(h * 0.02, h * 0.06), { wob: 0.3 }), { color, alpha: alpha * b.r(0.4, 1), blur: 16, edge: 0 });
  }
  for (let i = 0; i < 30; i++) b.cloud(b.r(0, w), b.r(0, h), b.r(10, 26), { color: '#ffffff', alpha: 0.35, w: 3 });
}

function paintStone(ctx, w, h, { seed = 2, base = '#6f7a73', lines = '#d8b860', rings = true } = {}) {
  const R = mulberry32(seed);
  paper(ctx, w, h, { base, seed, fibres: 0.4, dark: 1 });
  const b = brush(ctx, seed);
  for (let i = 0; i < 40; i++) b.wash(b.blob(R() * w, R() * h, 40 + R() * 140, 30 + R() * 90), { color: R() < 0.5 ? '#3c4541' : '#9aa59e', alpha: 0.12, blur: 20, edge: 0 });
  for (let i = 0; i < 60; i++) {
    const x = R() * w, y = R() * h;
    b.stroke([[x, y], [x + (R() - 0.5) * 60, y + (R() - 0.5) * 60], [x + (R() - 0.5) * 120, y + (R() - 0.5) * 120]], { w: 1.2 + R() * 2, color: '#2a302d', alpha: 0.25, dry: 0.6 });
  }
  if (rings) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = rgba(lines, 0.55); ctx.lineWidth = 5;
    for (const r of [0.46, 0.43, 0.25]) { ctx.beginPath(); ctx.ellipse(0, 0, w * r, h * r, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.lineWidth = 3;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * w * 0.25, Math.sin(a) * h * 0.25); ctx.lineTo(Math.cos(a) * w * 0.43, Math.sin(a) * h * 0.43); ctx.stroke();
    }
    // trigram marks around the ring
    const tri = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
    ctx.fillStyle = rgba(lines, 0.6); ctx.font = `${w * 0.035}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    tri.forEach((t, k) => { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; ctx.fillText(t, Math.cos(a) * w * 0.445, Math.sin(a) * h * 0.445); });
    ctx.restore();
  }
}

function paintWood(ctx, w, h, { seed = 5, base = '#5a3a22', dark = '#2e1c10', planks = 8, horizontal = true } = {}) {
  const R = mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const n = planks, L = horizontal ? h : w;
  for (let k = 0; k < n; k++) {
    const p0 = (k / n) * L, p1 = ((k + 1) / n) * L;
    ctx.fillStyle = mix(base, dark, R() * 0.35);
    if (horizontal) ctx.fillRect(0, p0, w, p1 - p0); else ctx.fillRect(p0, 0, p1 - p0, h);
    ctx.strokeStyle = rgba(dark, 0.9); ctx.lineWidth = 3;
    ctx.beginPath(); if (horizontal) { ctx.moveTo(0, p0); ctx.lineTo(w, p0); } else { ctx.moveTo(p0, 0); ctx.lineTo(p0, h); } ctx.stroke();
    for (let g = 0; g < 26; g++) {
      ctx.strokeStyle = rgba(R() < 0.5 ? dark : '#8a6040', 0.18 + R() * 0.2); ctx.lineWidth = 1 + R() * 2;
      ctx.beginPath();
      const o = p0 + R() * (p1 - p0);
      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = t * (horizontal ? w : h), b2 = o + Math.sin(t * 8 + g + k) * 3 + (R() - 0.5) * 1.5;
        if (horizontal) (t ? ctx.lineTo(a, b2) : ctx.moveTo(a, b2)); else (t ? ctx.lineTo(b2, a) : ctx.moveTo(b2, a));
      }
      ctx.stroke();
    }
  }
}

/** Board overlay: 楚河汉界-style centre stroke, unit slots, 文脉 zones. Transparent, sits on any table. */
function paintOverlay(ctx, w, h, { ink = INK, gold = '#c8a04a' } = {}) {
  const b = brush(ctx, 77);
  ctx.clearRect(0, 0, w, h);
  const X = (x) => (x / 12 + 0.5) * w, Z = (z) => (z / 8 + 0.5) * h;
  // centre river stroke
  b.stroke([[X(-5.4), Z(-0.12)], [X(-2), Z(-0.2)], [X(2), Z(-0.08)], [X(5.4), Z(-0.16)]], { w: 7, color: ink, alpha: 0.45, dry: 0.7, taper: [0.1, 0.3] });
  ctx.fillStyle = rgba(ink, 0.35); ctx.font = `${h * 0.045}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('文 脉', X(-4.4), Z(-0.14) - h * 0.035);
  ctx.fillText('守 护', X(4.4), Z(-0.14) - h * 0.035);
  // unit slots
  for (const [zc, n] of [[1.05, 5], [-1.35, 5]]) {
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * 1.04;
      const cx = X(x), cz = Z(zc + 0.15), sw = w * 0.066, sh = h * 0.07;
      ctx.strokeStyle = rgba(gold, 0.22); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(cx, cz, sw, sh * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // 文脉 zones (left, beside the heroes)
  for (const z of [2.72, -3.0]) {
    ctx.strokeStyle = rgba(gold, 0.3); ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(X(-5.35), Z(z - 0.55), X(-2.05) - X(-5.35), Z(z + 0.55) - Z(z - 0.55));
    ctx.setLineDash([]);
  }
}

// ───────────────────────────── scene builders ─────────────────────────────
function addLights(group, { hemiSky, hemiGround, hemiI, key, keyI, keyPos, fill = null }) {
  group.add(new THREE.HemisphereLight(hemiSky, hemiGround, hemiI));
  const d = new THREE.DirectionalLight(key, keyI);
  d.position.set(...keyPos);
  d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  Object.assign(d.shadow.camera, { left: -9, right: 9, top: 7, bottom: -7, near: 1, far: 40 });
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02; d.shadow.radius = 4;
  group.add(d);
  if (fill) { const f = new THREE.DirectionalLight(fill[0], fill[1]); f.position.set(...fill[2]); group.add(f); }
  return d;
}

function motes(count, { color = '#f4d58a', spread = [14, 6, 10], size = 0.06, y = 1.5 } = {}) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), ph = new Float32Array(count);
  const R = mulberry32(9);
  for (let i = 0; i < count; i++) { p[i * 3] = (R() - 0.5) * spread[0]; p[i * 3 + 1] = y + R() * spread[1]; p[i * 3 + 2] = (R() - 0.5) * spread[2]; ph[i] = R() * 100; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(color) }, size: { value: size * 400 } },
    vertexShader: `attribute float phase; uniform float time; uniform float size; varying float vA;
      void main(){ vec3 q = position; q.y += sin(time*0.3 + phase)*0.4 + mod(time*0.08 + phase*0.1, 3.0) - 1.5; q.x += sin(time*0.2+phase*1.7)*0.3;
      vA = 0.5 + 0.5*sin(time*1.3 + phase); vec4 mv = modelViewMatrix*vec4(q,1.0); gl_PointSize = size / -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d)*vA; gl_FragColor = vec4(color*1.5, a*0.8); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.userData.tick = (dt, t) => { mat.uniforms.time.value = t; };
  return pts;
}

function pineTree(R, scale = 1) {
  const g = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.95 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x2c4234, roughness: 0.9 });
  const trunkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, 1.2, 0.1), new THREE.Vector3(-0.2, 2.4, 0), new THREE.Vector3(0.4, 3.4, -0.1)]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 20, 0.14, 6), bark);
  trunk.castShadow = true;
  g.add(trunk);
  for (let k = 0; k < 5; k++) {
    const p = trunkCurve.getPoint(0.45 + k * 0.13);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.7 + R() * 0.4, 12, 8), leaf);
    pad.scale.set(1.6, 0.35, 1.1);
    pad.position.set(p.x + (R() - 0.5) * 1.2, p.y + 0.1, p.z + (R() - 0.5) * 0.6);
    pad.castShadow = true;
    g.add(pad);
  }
  g.scale.setScalar(scale);
  return g;
}
function rock(R, s = 1, color = 0x4a524d) {
  const geo = new THREE.DodecahedronGeometry(1, 3);
  const p = geo.attributes.position;
  const ph = [R() * 6, R() * 6, R() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 0.82 + 0.16 * Math.sin(x * 2.3 + ph[0]) * Math.cos(z * 2.1 + ph[1]) + 0.08 * Math.sin(y * 4 + ph[2]);
    p.setXYZ(i, x * k, Math.max(-0.35, y * k * 0.75), z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  m.scale.setScalar(s);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function buildKunlun(root, variant = 'edge') {
  const R = mulberry32(21);
  const dusk = variant === 'summit';
  root.add(skyDome(dusk ? '#4a4c58' : '#9fb3b0', dusk ? '#b8a48a' : '#e8e2d2', dusk ? '#6a5a4a' : '#c9c6b8'));
  root.add(backdrop((ctx, w, h) => paintMountains(ctx, w, h, { seed: 3, sun: dusk ? null : [0.62, 0.28, 0.05, '#f3e2b0'],
    layers: dusk ? [[0.52, 0.3, '#4a4448'], [0.64, 0.4, '#2e282a'], [0.78, 0.55, '#1a1618']] : undefined })));
  if (dusk) { // the rift in the sky
    root.add(backdrop((ctx, w, h) => {
      const b = brush(ctx, 8);
      ctx.clearRect(0, 0, w, h);
      const pts = [[w * 0.3, h * 0.05], [w * 0.42, h * 0.2], [w * 0.4, h * 0.3], [w * 0.52, h * 0.45], [w * 0.5, h * 0.55]];
      ctx.save(); ctx.filter = 'blur(18px)'; b.stroke(pts, { w: 60, color: '#ff9a4a', alpha: 0.5, dry: 0 }); ctx.restore();
      b.stroke(pts, { w: 10, color: '#ffe0a0', alpha: 0.9, dry: 0.2 });
      for (let i = 0; i < 8; i++) b.wash(b.blob(b.r(0, w), b.r(0, h * 0.4), b.r(80, 240), b.r(30, 80)), { color: '#141012', alpha: 0.35, blur: 20, edge: 0 });
    }, { radius: 50, height: 30, y: 8 }));
  }
  // cloud sea
  const cc = canvas(1024, 1024); paintClouds(cc.getContext('2d'), 1024, 1024, 4, { color: dusk ? '#8a7a6a' : '#f4f0e6' });
  const ct = canvasTex(cc, { repeat: [3, 3] });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.9, depthWrite: false }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -3.2;
  sea.userData.tick = (dt) => { ct.offset.x += dt * 0.004; ct.offset.y += dt * 0.002; };
  root.add(sea);
  // platform
  const top = canvas(2048, 1400); paintStone(top.getContext('2d'), 2048, 1400, { seed: 2, base: dusk ? '#5d625e' : '#7d8a82' });
  const topTex = canvasTex(top);
  const side = new THREE.MeshStandardMaterial({ color: 0x3a403c, roughness: 0.9 });
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.92, 0.7, 8, 1), [side, new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.82 }), side]);
  slab.rotation.y = Math.PI / 8;
  slab.scale.set(7.6, 1, 5.4);
  slab.position.y = -0.35;
  slab.receiveShadow = true;
  // CylinderGeometry top-cap UVs are circular; remap them to our rectangle
  const uv = slab.geometry.attributes.uv, pos = slab.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getY(i) - 0.35) < 1e-4) {
    const x = pos.getX(i), z = pos.getZ(i), a = Math.PI / 8, rx = x * Math.cos(a) - z * Math.sin(a), rz = x * Math.sin(a) + z * Math.cos(a);
    uv.setXY(i, rx * 0.5 + 0.5, 0.5 - rz * 0.5);
  }
  root.add(slab);
  // underside rock
  const under = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 8, 3), new THREE.MeshStandardMaterial({ color: 0x2f3531, roughness: 1, flatShading: true }));
  under.scale.set(6.6, 5, 4.8); under.position.y = -3.2; under.rotation.x = Math.PI; under.rotation.y = Math.PI / 8;
  root.add(under);
  // pines + rocks on the rim
  for (const [x, z, s, ry] of [[-7.4, -3.6, 1.1, 0.4], [7.2, -3.8, 0.95, 2.2], [-8.2, 1.8, 0.8, 1.0]]) {
    const t = pineTree(R, s); t.position.set(x, 0, z); t.rotation.y = ry; root.add(t);
  }
  for (let k = 0; k < 9; k++) {
    const a = R() * Math.PI * 2, r = rock(R, 0.3 + R() * 0.5);
    r.position.set(Math.cos(a) * 7.1, 0.05, Math.sin(a) * 4.9);
    if (Math.abs(r.position.z) < 3.8 && Math.abs(r.position.x) < 6.3) continue;
    root.add(r);
  }
  // floating islets in the distance
  for (let k = 0; k < 6; k++) {
    const isl = new THREE.Group();
    const c = new THREE.Mesh(new THREE.ConeGeometry(1, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0x3a423d, flatShading: true, roughness: 1 }));
    c.rotation.x = Math.PI; isl.add(c);
    const t = pineTree(R, 0.4); t.position.y = 1.1; isl.add(t);
    const s = 0.8 + R() * 1.4;
    isl.scale.setScalar(s);
    isl.position.set((R() - 0.5) * 60, -1 + R() * 6, -18 - R() * 22);
    const y0 = isl.position.y, ph = R() * 6;
    isl.userData.tick = (dt, t2) => { isl.position.y = y0 + Math.sin(t2 * 0.3 + ph) * 0.3; };
    root.add(isl);
  }
  if (variant === 'stele') {
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.95 }));
    st.position.set(0, 1.4, -5.6); st.rotation.z = 0.05; st.castShadow = true;
    const tc = canvas(256, 512); const tx = tc.getContext('2d');
    paper(tx, 256, 512, { base: '#6a655c', seed: 3, dark: 1 });
    tx.fillStyle = 'rgba(30,26,22,0.8)'; tx.font = `120px ${FONT_BRUSH}`; tx.textAlign = 'center';
    tx.fillText('造', 128, 200); tx.fillText('化', 128, 340);
    st.material = [st.material, st.material, st.material, st.material, new THREE.MeshStandardMaterial({ map: canvasTex(tc), roughness: 0.9 }), st.material];
    root.add(st);
  }
  root.add(motes(dusk ? 90 : 60, { color: dusk ? '#ff9a5a' : '#f4d58a' }));
  const key = addLights(root, dusk
    ? { hemiSky: 0x9a8a9a, hemiGround: 0x3a2a20, hemiI: 1.1, key: 0xffb070, keyI: 2.4, keyPos: [-6, 12, -4] }
    : { hemiSky: 0xdfe8e4, hemiGround: 0x6a6050, hemiI: 1.3, key: 0xfff0d0, keyI: 2.6, keyPos: [5, 13, 3], fill: [0x9fb8d0, 0.4, [-6, 5, -4]] });
  root.userData.fog = new THREE.Fog(dusk ? 0x6a5a50 : 0xd8d6cc, 30, 110);
  return key;
}

/** 古戏台. variant: '' 夜台 | 'shadow' 皮影棚（白幕前） | 'dawn' 散场后的空台 */
function buildStage(root, variant = '') {
  const R = mulberry32(31);
  const shadow = variant === 'shadow', dawn = variant === 'dawn';
  root.add(shadow ? skyDome('#1a1208', '#3a2410', '#0c0806')
    : dawn ? skyDome('#2a3038', '#8a8272', '#3a3630') : skyDome('#14121a', '#2a1e1c', '#0c0a0a'));
  // curtain backdrop
  root.add(backdrop((ctx, w, h) => {
    const b = brush(ctx, 12);
    if (shadow) {   // a lit white screen with puppet silhouettes behind it
      ctx.fillStyle = '#1c1208'; ctx.fillRect(0, 0, w, h);
      const sx = w * 0.26, sw = w * 0.48, sy = h * 0.12, sh = h * 0.6;
      const g = ctx.createRadialGradient(sx + sw / 2, sy + sh * 0.5, 0, sx + sw / 2, sy + sh * 0.5, sw * 0.7);
      g.addColorStop(0, '#fff0c8'); g.addColorStop(0.6, '#f0d090'); g.addColorStop(1, '#c89040');
      ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#3a1a0c'; ctx.lineWidth = 14; ctx.strokeRect(sx, sy, sw, sh);
      for (const [fx, lean, hgt] of [[0.4, 1, 0.34], [0.58, -1, 0.3]]) {
        // puppet silhouette: head, robe, one raised sleeve, one trailing sleeve
        const px = sx + sw * fx, py = sy + sh * 0.92, ph = h * hgt, hw = ph * 0.16;
        b.wash([[px - hw, py], [px + hw, py], [px + hw * 0.7, py - ph * 0.72], [px - hw * 0.7, py - ph * 0.72]], { color: '#2a0e06', alpha: 0.95, blur: 1, edge: 0.6 });
        b.wash(b.blob(px, py - ph * 0.82, hw * 0.55, hw * 0.62), { color: '#2a0e06', alpha: 0.95, blur: 0.8, edge: 0.7 });
        b.wash([[px, py - ph * 0.9], [px + lean * hw * 0.9, py - ph * 1.02], [px + lean * hw * 0.5, py - ph * 0.84]], { color: '#2a0e06', alpha: 0.95, blur: 0.6, edge: 0.6 });
        b.stroke([[px + lean * hw * 0.5, py - ph * 0.66], [px + lean * hw * 1.9, py - ph * 0.86], [px + lean * hw * 2.6, py - ph * 0.5]], { w: ph * 0.1, color: '#2a0e06', alpha: 0.92, dry: 0.3, taper: [0.2, 0.6] });
        b.stroke([[px - lean * hw * 0.5, py - ph * 0.64], [px - lean * hw * 1.6, py - ph * 0.34], [px - lean * hw * 1.9, py - ph * 0.06]], { w: ph * 0.09, color: '#2a0e06', alpha: 0.9, dry: 0.3, taper: [0.2, 0.7] });
      }
      for (let i = 0; i < 26; i++) b.wash(b.blob(b.r(0, w), b.r(h * 0.7, h), b.r(30, 90), b.r(10, 26)), { color: '#0c0806', alpha: 0.5, blur: 14, edge: 0 });
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (dawn) { g.addColorStop(0, '#6a5a4a'); g.addColorStop(1, '#8a6a52'); } else { g.addColorStop(0, '#3a0c0a'); g.addColorStop(1, '#6a1a14'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 40) { ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.15 * Math.sin(x * 0.05)})`; ctx.fillRect(x, 0, 20, h); }
    ctx.strokeStyle = `rgba(200,160,74,${dawn ? 0.3 : 0.6})`; ctx.lineWidth = 6;
    ctx.strokeRect(w * 0.3, h * 0.12, w * 0.4, h * 0.5);
    for (let i = 0; i < 12; i++) b.cloud(w * (0.32 + (i % 6) * 0.065), h * (0.2 + Math.floor(i / 6) * 0.3), 16, { color: '#c8a04a', alpha: dawn ? 0.25 : 0.5, w: 3 });
    ctx.fillStyle = `rgba(232,212,154,${dawn ? 0.4 : 0.85})`; ctx.font = `${h * 0.16}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('出将', w * 0.2, h * 0.4); ctx.fillText('入相', w * 0.8, h * 0.4);
    ctx.fillText('古 戏 台', w * 0.5, h * 0.37);
    if (dawn) for (let i = 0; i < 30; i++) b.wash(b.blob(b.r(0, w), b.r(0, h), b.r(60, 200), b.r(20, 60)), { color: '#b8ac98', alpha: 0.12, blur: 22, edge: 0 });
  }, { radius: 16, height: 16, y: 6, arc: Math.PI * 0.9, transparent: false }));
  // stage floor
  const fc = canvas(2048, 1400); paintWood(fc.getContext('2d'), 2048, 1400, { seed: 5, base: dawn ? '#7a5e40' : '#6a4428', planks: 10 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 10), [0, 1, 2, 3, 4, 5].map((i) => i === 2
    ? new THREE.MeshStandardMaterial({ map: canvasTex(fc), roughness: 0.7 }) : new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.8 })));
  floor.position.y = -0.3; floor.receiveShadow = true;
  root.add(floor);
  // pillars with gold bands
  const red = new THREE.MeshStandardMaterial({ color: 0x8a1c14, roughness: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc8a04a, roughness: 0.35, metalness: 0.7 });
  for (const x of [-7.2, 7.2]) for (const z of [-4.6, 3.6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 9, 16), red);
    p.position.set(x, 4.2, z); p.castShadow = true; root.add(p);
    for (const y of [0.4, 7.8]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), gold); band.position.set(x, y, z); root.add(band); }
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 0.6), red);
  beam.position.set(0, 8.4, -4.6); root.add(beam);
  // lanterns
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xff5a30, emissive: 0xff3a10, emissiveIntensity: 1.6, roughness: 0.6 });
  const deadLantern = new THREE.MeshStandardMaterial({ color: 0x6a4a3a, emissive: 0x201410, emissiveIntensity: 0.3, roughness: 0.85 });
  for (let k = 0; k < 6; k++) {
    const lit = dawn ? k === 2 : true;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), lit ? lanternMat : deadLantern);
    l.scale.y = 1.2;
    const x = -6 + k * 2.4;
    l.position.set(x, 6.6, -4.4);
    const y0 = l.position.y, ph = R() * 6;
    l.userData.tick = (dt, t) => { l.position.y = y0 + Math.sin(t * 0.8 + ph) * 0.05; l.rotation.z = Math.sin(t * 0.6 + ph) * 0.05; };
    root.add(l);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), gold); cap.position.set(x, 7.15, -4.4); root.add(cap);
  }
  if (shadow) {   // the oil lamp that throws the puppets onto the screen
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    lamp.scale.y = 1.7; lamp.position.set(0, 1.1, -3.4); root.add(lamp);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.2, 14), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 }));
    dish.position.set(0, 0.5, -3.4); root.add(dish);
    const lp = new THREE.PointLight(0xffb060, 26, 12, 1.4); lp.position.set(0, 1.3, -3.4);
    lp.userData.tick = (dt, t) => { lp.intensity = 24 + Math.sin(t * 13) * 2.4; lamp.scale.y = 1.7 + Math.sin(t * 19) * 0.18; };
    root.add(lp);
  }
  if (dawn) {   // toppled drum and gong frame left behind after the troupe scattered
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.9 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1, 18), new THREE.MeshStandardMaterial({ color: 0x7a2a18, roughness: 0.8 }));
    drum.rotation.z = Math.PI / 2; drum.rotation.y = 0.4; drum.position.set(-6.2, 0.4, -3.2); drum.castShadow = true; root.add(drum);
    const frame = new THREE.Group();
    for (const x of [-0.7, 0.7]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.6, 8), wood); p.position.set(x, 1.3, 0); frame.add(p); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), wood); top.position.y = 2.6; frame.add(top);
    const g2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x9a7a2a, roughness: 0.5, metalness: 0.6 }));
    g2.rotation.x = Math.PI / 2; g2.position.y = 1.8; g2.castShadow = true; frame.add(g2);
    frame.position.set(6.4, 0, -3.4); frame.rotation.y = -0.4; root.add(frame);
  }
  const pl = new THREE.PointLight(0xff8a50, dawn ? 10 : 30, 18, 1.6); pl.position.set(0, 5.5, -3); root.add(pl);
  root.add(motes(50, { color: dawn ? '#d8ccb0' : '#ffb070', spread: [14, 5, 8] }));
  const key = addLights(root, shadow
    ? { hemiSky: 0xffb070, hemiGround: 0x1a1008, hemiI: 1.0, key: 0xffc880, keyI: 2.2, keyPos: [0, 10, -6], fill: [0xff9040, 0.5, [0, 3, 4]] }
    : dawn
      ? { hemiSky: 0xb8c0cc, hemiGround: 0x3a2e24, hemiI: 1.2, key: 0xffe0b0, keyI: 2.2, keyPos: [-8, 9, -6], fill: [0x90a0c0, 0.5, [5, 5, 5]] }
      : { hemiSky: 0x9a6a5a, hemiGround: 0x2a1410, hemiI: 1.0, key: 0xffd0a0, keyI: 2.6, keyPos: [3, 12, 5] });
  root.userData.fog = new THREE.Fog(shadow ? 0x1a1008 : dawn ? 0x6a6458 : 0x1a1010, 25, 60);
  return key;
}

function buildStudy(root) {
  const R = mulberry32(41);
  root.add(skyDome('#101418', '#1c2026', '#0a0a0c'));
  // back wall with a round moon window and bookshelves
  root.add(backdrop((ctx, w, h) => {
    const b = brush(ctx, 21);
    paper(ctx, w, h, { base: '#3a3026', seed: 4, dark: 1, fibres: 0.5 });
    // shelves
    for (const x0 of [0.04, 0.72]) {
      for (let r = 0; r < 4; r++) {
        const y = h * (0.12 + r * 0.2);
        ctx.fillStyle = '#20160e'; ctx.fillRect(w * x0, y + h * 0.15, w * 0.24, h * 0.02);
        let x = w * x0 + 6;
        while (x < w * (x0 + 0.23)) {
          const bw = 10 + R() * 18, bh = h * (0.09 + R() * 0.05);
          ctx.fillStyle = ['#6a3a22', '#2a3a4a', '#4a5a3a', '#8a7a5a', '#5a2a1e'][Math.floor(R() * 5)];
          ctx.fillRect(x, y + h * 0.15 - bh, bw, bh);
          ctx.fillStyle = 'rgba(232,212,154,0.4)'; ctx.fillRect(x + bw * 0.3, y + h * 0.15 - bh * 0.8, bw * 0.4, bh * 0.3);
          x += bw + 2;
        }
      }
    }
    // moon window
    const cx = w * 0.5, cy = h * 0.42, rr = h * 0.3;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, '#2a3a4e'); g.addColorStop(1, '#141c26');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
    const mg = ctx.createRadialGradient(cx + rr * 0.35, cy - rr * 0.35, 0, cx + rr * 0.35, cy - rr * 0.35, rr * 0.5);
    mg.addColorStop(0, 'rgba(250,244,225,1)'); mg.addColorStop(0.35, 'rgba(250,244,225,0.95)'); mg.addColorStop(0.4, 'rgba(250,244,225,0.2)'); mg.addColorStop(1, 'rgba(250,244,225,0)');
    ctx.fillStyle = mg; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.clip();
    b.stroke([[cx - rr, cy + rr * 0.3], [cx - rr * 0.3, cy + rr * 0.1], [cx + rr * 0.2, cy + rr * 0.4]], { w: 8, color: '#0c0c0c', dry: 0.6 });
    for (let i = 0; i < 30; i++) b.stroke([[cx - rr * 0.8 + i * 8, cy + rr * 0.25], [cx - rr * 0.8 + i * 8 + 8, cy + rr * 0.1]], { w: 2, color: '#0c0c0c', alpha: 0.8, dry: 0 });
    ctx.restore();
    ctx.strokeStyle = '#1c120a'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    // hanging calligraphy
    ctx.fillStyle = '#e8dcc4'; ctx.fillRect(w * 0.33, h * 0.08, w * 0.04, h * 0.55); ctx.fillRect(w * 0.63, h * 0.08, w * 0.04, h * 0.55);
    ctx.fillStyle = '#1a1a1a'; ctx.font = `${w * 0.028}px ${FONT_BRUSH}`; ctx.textAlign = 'center';
    '文脉千秋在'.split('').forEach((c, i) => ctx.fillText(c, w * 0.35, h * (0.16 + i * 0.1)));
    '山海一卷中'.split('').forEach((c, i) => ctx.fillText(c, w * 0.65, h * (0.16 + i * 0.1)));
  }, { radius: 15, height: 14, y: 5, arc: Math.PI * 0.95, transparent: false }));
  // desk
  const dc = canvas(2048, 1400); paintWood(dc.getContext('2d'), 2048, 1400, { seed: 8, base: '#4a2e1c', dark: '#1e120a', planks: 5, horizontal: false });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 10), [0, 1, 2, 3, 4, 5].map((i) => i === 2
    ? new THREE.MeshStandardMaterial({ map: canvasTex(dc), roughness: 0.55 }) : new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 })));
  desk.position.y = -0.25; desk.receiveShadow = true;
  root.add(desk);
  // a sheet of xuan paper under the play area
  const pc = canvas(1024, 700); paper(pc.getContext('2d'), 1024, 700, { seed: 6 });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 8.2), new THREE.MeshStandardMaterial({ map: canvasTex(pc), roughness: 0.95 }));
  sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.005; sheet.receiveShadow = true;
  root.add(sheet);
  // inkstone, brush, candle
  const stone = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.9), new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.4 }));
  stone.position.set(6.9, 0.1, 2.6); stone.castShadow = true; root.add(stone);
  const brushM = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a3a }));
  brushM.rotation.z = Math.PI / 2; brushM.rotation.y = 0.4; brushM.position.set(6.6, 0.08, 3.6); root.add(brushM);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0xc03a2a, roughness: 0.6 }));
  candle.position.set(-6.8, 0.45, -3.2); root.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd080 }));
  flame.scale.y = 2; flame.position.set(-6.8, 1.05, -3.2); root.add(flame);
  const pl = new THREE.PointLight(0xffa050, 26, 16, 1.5); pl.position.set(-6.8, 1.6, -3.2); root.add(pl);
  pl.userData.tick = (dt, t) => { pl.intensity = 24 + Math.sin(t * 11) * 1.5 + Math.sin(t * 23) * 1.2; flame.scale.y = 2 + Math.sin(t * 17) * 0.2; };
  root.add(pl);
  root.add(motes(30, { color: '#ffd8a0', spread: [12, 4, 8], size: 0.04 }));
  const key = addLights(root, { hemiSky: 0x6a7a9a, hemiGround: 0x2a1a10, hemiI: 1.0, key: 0xd8e0ff, keyI: 1.9, keyPos: [2, 12, -6], fill: [0xffc080, 0.6, [-4, 6, 6]] });
  root.userData.fog = new THREE.Fog(0x0c0c10, 22, 50);
  return key;
}

// ───────────────────────────── 长安城 (LORE_BIBLE §2.2) ─────────────────────────────
const CHANGAN_VERSE = '长安一片月万户捣衣声春风得意马蹄疾一日看尽长安花大江东去李白斗酒诗百篇国破山河在城春草木深';

function paintChanganSky(ctx, w, h, { night = false, pagodaX = 0.62, pagodaH = 0.5, seed = 13 } = {}) {
  const b = brush(ctx, seed);
  ctx.clearRect(0, 0, w, h);
  // sunset glow or the moon
  if (night) {
    const mx = w * 0.36, my = h * 0.3, r = h * 0.07;
    const g = ctx.createRadialGradient(mx, my, r * 0.3, mx, my, r * 5);
    g.addColorStop(0, 'rgba(236,238,255,0.95)'); g.addColorStop(0.2, 'rgba(236,238,255,0.9)'); g.addColorStop(0.22, 'rgba(180,190,230,0.25)'); g.addColorStop(1, 'rgba(120,130,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else {
    const g = ctx.createRadialGradient(w * 0.42, h * 0.62, 0, w * 0.42, h * 0.62, h * 0.9);
    g.addColorStop(0, 'rgba(255,200,120,0.95)'); g.addColorStop(0.25, 'rgba(240,140,70,0.55)'); g.addColorStop(1, 'rgba(160,60,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,196,110,1)'; ctx.beginPath(); ctx.arc(w * 0.42, h * 0.6, h * 0.04, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) b.wash(b.blob(b.r(0, w), b.r(h * 0.1, h * 0.45), b.r(120, 360), b.r(10, 26)), { color: '#c8604a', alpha: 0.35, blur: 10, edge: 0 });
  }
  // 终南山 far away
  const hill = night ? '#1c2034' : '#6a3a3a';
  const pts = [[0, h]]; let x = -20; pts.push([x, h * 0.62]);
  while (x < w + 40) { const st = w * (0.05 + b.R() * 0.08); pts.push([x + st * 0.5, h * (0.5 - b.R() * 0.08)]); x += st; pts.push([x, h * 0.58]); }
  pts.push([w + 40, h]);
  b.wash(pts, { color: hill, alpha: 0.5, blur: 4, edge: 0.5 });
  // city skyline: rows of eaved roofs, a gate tower, the pagoda
  const roofCol = night ? '#0c0e18' : '#2a1818';
  for (let row = 0; row < 2; row++) {
    const base = h * (0.74 + row * 0.08);
    let rx = -30;
    while (rx < w + 30) {
      const rw = 60 + b.R() * 110, rh = 18 + b.R() * 30 + row * 8;
      ctx.fillStyle = roofCol; ctx.globalAlpha = 0.75 + row * 0.2;
      ctx.fillRect(rx + rw * 0.1, base - rh * 0.6, rw * 0.8, rh + h);
      ctx.beginPath(); ctx.moveTo(rx - 8, base - rh * 0.55); ctx.quadraticCurveTo(rx + rw * 0.2, base - rh * 0.7, rx + rw * 0.3, base - rh);
      ctx.lineTo(rx + rw * 0.7, base - rh); ctx.quadraticCurveTo(rx + rw * 0.8, base - rh * 0.7, rx + rw + 8, base - rh * 0.55); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      if (b.R() < 0.6) { ctx.fillStyle = `rgba(255,${180 + Math.floor(b.R() * 50)},110,${0.5 + b.R() * 0.4})`; ctx.fillRect(rx + rw * (0.3 + b.R() * 0.3), base - rh * 0.3, 7, 9); }
      rx += rw + b.R() * 12;
    }
  }
  // gate tower
  const gx = w * 0.3, gy = h * 0.74;
  ctx.fillStyle = roofCol;
  ctx.fillRect(gx - 90, gy - 40, 180, 60);
  ctx.beginPath(); ctx.moveTo(gx - 130, gy - 40); ctx.quadraticCurveTo(gx - 80, gy - 52, gx - 70, gy - 80); ctx.lineTo(gx + 70, gy - 80); ctx.quadraticCurveTo(gx + 80, gy - 52, gx + 130, gy - 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,190,110,0.7)'; for (let k = -2; k <= 2; k++) ctx.fillRect(gx + k * 30 - 5, gy - 30, 10, 14);
  // 大雁塔
  const px = w * pagodaX, py = h * 0.8, ph = h * pagodaH, tiers = 7, th = ph / (tiers + 0.8);
  ctx.fillStyle = night ? '#141626' : '#3a2420';
  for (let i = 0; i < tiers; i++) {
    const w0 = ph * (0.3 - i * 0.03), yb = py - i * th, yt = yb - th * 0.82;
    ctx.beginPath(); ctx.moveTo(px - w0 / 2, yb); ctx.lineTo(px + w0 / 2, yb); ctx.lineTo(px + w0 * 0.44, yt); ctx.lineTo(px - w0 * 0.44, yt); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px - w0 * 0.62, yt + 4); ctx.lineTo(px + w0 * 0.62, yt + 4); ctx.lineTo(px + w0 * 0.5, yt - 5); ctx.lineTo(px - w0 * 0.5, yt - 5); ctx.fill();
  }
  ctx.fillRect(px - 3, py - tiers * th - th * 0.6, 6, th * 0.9);
  ctx.fillStyle = 'rgba(255,200,120,0.6)'; for (let i = 0; i < tiers; i++) ctx.fillRect(px - 5, py - i * th - th * 0.55, 10, th * 0.28);
  // poem glyphs drifting in the sky
  ctx.font = `${h * 0.045}px ${FONT_BRUSH}`; ctx.textAlign = 'center';
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = night ? `rgba(210,220,255,${0.2 + b.R() * 0.35})` : `rgba(255,230,170,${0.25 + b.R() * 0.4})`;
    ctx.fillText(CHANGAN_VERSE[i % CHANGAN_VERSE.length], b.r(0, w), b.r(h * 0.08, h * 0.55));
  }
}

function paintFlagstones(ctx, w, h, { seed = 17, base = '#6e6256', dark = '#2e2620' } = {}) {
  const R = mulberry32(seed);
  paper(ctx, w, h, { base: dark, seed, fibres: 0.2, dark: 1 });
  const rows = 12;
  for (let r = 0; r < rows; r++) {
    const y0 = (r / rows) * h, rh = h / rows;
    let x = -R() * 120;
    while (x < w) {
      const sw = 140 + R() * 160;
      ctx.fillStyle = mix(base, dark, R() * 0.35);
      ctx.fillRect(x + 4, y0 + 4, sw - 8, rh - 8);
      ctx.fillStyle = `rgba(255,240,210,${0.04 + R() * 0.05})`; ctx.fillRect(x + 8, y0 + 8, sw - 16, (rh - 16) * 0.3);
      x += sw;
    }
  }
  const b = brush(ctx, seed);
  for (let i = 0; i < 30; i++) b.wash(b.blob(R() * w, R() * h, 60 + R() * 160, 40 + R() * 80), { color: R() < 0.5 ? dark : '#a89880', alpha: 0.1, blur: 20, edge: 0 });
  for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h; b.stroke([[x, y], [x + (R() - 0.5) * 50, y + (R() - 0.5) * 30]], { w: 1.5, color: dark, alpha: 0.35, dry: 0.6 }); }
}

function lanternPost(mats, x, z, { h = 4.2, dir = 1, lit = true } = {}) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, h, 8), mats.wood);
  pole.position.y = h / 2; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.1), mats.wood);
  arm.position.set(dir * 0.45, h - 0.2, 0); g.add(arm);
  const lan = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), lit ? mats.lantern : mats.lanternDim);
  lan.scale.y = 1.25;
  const lx = dir * 0.85, ly = h - 0.75;
  lan.position.set(lx, ly, 0); g.add(lan);
  for (const dy of [0.44, -0.44]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), mats.gold); cap.position.set(lx, ly + dy, 0); g.add(cap); }
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.4, 6), mats.lantern); tassel.position.set(lx, ly - 0.68, 0); g.add(tassel);
  const ph = x * 1.7 + z;
  lan.userData.tick = (dt, t) => { lan.rotation.z = Math.sin(t * 0.7 + ph) * 0.06; };
  g.position.set(x, 0, z);
  return g;
}

function glyphSprites(count, { color = '#ffe2a0', spread = [18, 6, 10], y = 1.5, seed = 5 } = {}) {
  const R = mulberry32(seed), g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const ch = CHANGAN_VERSE[Math.floor(R() * CHANGAN_VERSE.length)];
    const c = canvas(96, 96), x = c.getContext('2d');
    x.font = `72px ${FONT_BRUSH}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#fff'; x.shadowBlur = 8; x.fillStyle = '#fff'; x.fillText(ch, 48, 52);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(c), color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const x0 = (R() - 0.5) * spread[0], z0 = -7 - R() * spread[2], y0 = y + R() * spread[1], ph = R() * 10, sp = 0.15 + R() * 0.2;
    s.scale.setScalar(0.35 + R() * 0.3);
    s.userData.tick = (dt, t) => {
      const k = ((t * sp + ph) % spread[1]);
      s.position.set(x0 + Math.sin(t * 0.3 + ph) * 0.5, y0 + k - spread[1] / 2, z0);
      s.material.opacity = Math.sin((k / spread[1]) * Math.PI) * 0.8;
    };
    g.add(s);
  }
  return g;
}

function buildChangan(root, variant = 'street') {
  const night = variant === 'palace';
  root.add(night ? skyDome('#070a18', '#232846', '#0a0a12') : skyDome('#2e2c4c', '#e8905a', '#3a2220'));
  root.add(backdrop((ctx, w, h) => paintChanganSky(ctx, w, h, { night, pagodaX: variant === 'pagoda' ? 0.5 : 0.66, pagodaH: variant === 'pagoda' ? 0.68 : 0.45 }), { radius: 50, height: 34, y: 6 }));
  // paved street as the table
  const fc = canvas(2048, 1400); paintFlagstones(fc.getContext('2d'), 2048, 1400, night ? { base: '#4a4a56', dark: '#1c1c24' } : {});
  const floor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 10), [0, 1, 2, 3, 4, 5].map((i) => i === 2
    ? new THREE.MeshStandardMaterial({ map: canvasTex(fc), roughness: 0.85 }) : new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.9 })));
  floor.position.y = -0.3; floor.receiveShadow = true;
  root.add(floor);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: night ? 0x14141c : 0x3a2c24, roughness: 1 }));
  street.rotation.x = -Math.PI / 2; street.position.y = -0.62; street.receiveShadow = true;
  root.add(street);
  const mats = {
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2014, roughness: 0.8 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc8a04a, roughness: 0.35, metalness: 0.7 }),
    lantern: new THREE.MeshStandardMaterial({ color: 0xff5a30, emissive: 0xff3a10, emissiveIntensity: 1.8, roughness: 0.6 }),
    lanternDim: new THREE.MeshStandardMaterial({ color: 0x5a3a44, emissive: 0x3a2a50, emissiveIntensity: 0.6, roughness: 0.7 }),
    red: new THREE.MeshStandardMaterial({ color: 0x8a1c14, roughness: 0.55 }),
    tile: new THREE.MeshStandardMaterial({ color: 0x2a2626, roughness: 0.8 }),
  };
  // lantern posts down both sides of the street
  for (const z of [-4.2, -0.6, 3.0]) for (const s of [-1, 1]) root.add(lanternPost(mats, s * 7.4, z, { dir: -s, lit: !night || z > 0 }));
  // a string of lanterns across the back
  const n = 9;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), x = -7 + t * 14, y = 5.6 - Math.sin(t * Math.PI) * 0.9;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), night && k % 2 ? mats.lanternDim : mats.lantern);
    l.scale.y = 1.25; l.position.set(x, y, -5.4);
    const ph = k * 0.9, y0 = y;
    l.userData.tick = (dt, tt) => { l.position.y = y0 + Math.sin(tt * 0.9 + ph) * 0.04; };
    root.add(l);
  }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-7.4, 6.2, -5.4), new THREE.Vector3(0, 4.3, -5.4), new THREE.Vector3(7.4, 6.2, -5.4)), 24, 0.02, 4), mats.wood);
  root.add(rope);
  // a row of shop houses along the far side of the street
  const Rh = mulberry32(night ? 71 : 73);
  const win = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xffa040, emissiveIntensity: night ? 1.2 : 0.9 });
  const wall = new THREE.MeshStandardMaterial({ color: night ? 0x2a2a36 : 0x6a4a36, roughness: 0.9 });
  for (let x = -16; x < 16;) {
    const w = 3 + Rh() * 2.2, d = 3, hh = 1.7 + Rh() * 1.2, z = -10.5 - Rh() * 1.5;
    if (variant === 'palace' && Math.abs(x + w / 2) < 5.5) { x += w + 0.3; continue; }
    const hs = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), wall); body.position.y = hh / 2; body.castShadow = true; hs.add(body);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1, 1, 4, 1), mats.tile);
    roof.rotation.y = Math.PI / 4; roof.scale.set(w * 0.82, 1.1, d * 0.82); roof.position.y = hh + 0.5; hs.add(roof);
    for (const px of [-w / 2 + 0.25, w / 2 - 0.25]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, hh, 0.18), mats.red); p.position.set(px, hh / 2, d / 2 + 0.05); hs.add(p); }
    const nw = Math.max(1, Math.floor(w / 1.4));
    for (let k = 0; k < nw; k++) if (Rh() < (night ? 0.55 : 0.75)) {
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), win);
      wm.position.set(-w / 2 + (k + 0.5) * (w / nw), hh * 0.55, d / 2 + 0.01); hs.add(wm);
    }
    hs.position.set(x + w / 2, -0.62, z);
    root.add(hs);
    x += w + 0.3;
  }
  if (variant === 'palace') { // 梨园 old stage behind the table
    const stage = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(9, 1.2, 3.6), mats.wood); base.position.y = 0; base.receiveShadow = true; stage.add(base);
    for (const x of [-4, 4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 5, 12), mats.red); p.position.set(x, 3, 0.9); p.castShadow = true; stage.add(p); }
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 6.4, 1.4, 4, 1), mats.tile); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.5; roof.position.y = 6; stage.add(roof);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9, 0.35, 0.35), mats.red); beam.position.set(0, 5.2, 0.9); stage.add(beam);
    stage.position.set(0, -0.2, -10.5);
    root.add(stage);
  }
  root.add(glyphSprites(night ? 26 : 34, { color: night ? '#c8d4ff' : '#ffe2a0', spread: [18, 7, 8], y: 3 }));
  root.add(motes(night ? 40 : 60, { color: night ? '#b0c0ff' : '#ffb070', spread: [16, 5, 10] }));
  for (const x of [-6.8, 6.8]) { const pl = new THREE.PointLight(0xff8a50, night ? 14 : 20, 14, 1.6); pl.position.set(x, 3.6, -0.6); root.add(pl); }
  const key = addLights(root, night
    ? { hemiSky: 0x5a6a9a, hemiGround: 0x1a1420, hemiI: 1.0, key: 0xc8d4ff, keyI: 2.0, keyPos: [0, 13, -8], fill: [0xff9a60, 0.4, [-4, 5, 6]] }
    : { hemiSky: 0xffc8a0, hemiGround: 0x3a2418, hemiI: 1.1, key: 0xffb070, keyI: 2.5, keyPos: [-7, 10, -7], fill: [0x8090c0, 0.45, [6, 6, 6]] });
  root.userData.fog = new THREE.Fog(night ? 0x10121e : 0x5a3a30, 28, 90);
  return key;
}

function buildMenu(root) {
  // title backdrop: a vast ink landscape with the floating platform far off
  root.add(skyDome('#8a9c9a', '#e6e0d0', '#b8b4a6'));
  root.add(backdrop((ctx, w, h) => paintMountains(ctx, w, h, { seed: 11, sun: [0.7, 0.3, 0.05, '#f3e2b0'] }), { radius: 50 }));
  const cc = canvas(1024, 1024); paintClouds(cc.getContext('2d'), 1024, 1024, 5);
  const ct = canvasTex(cc, { repeat: [3, 3] });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.9, depthWrite: false }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -3.2;
  sea.userData.tick = (dt) => { ct.offset.x += dt * 0.006; };
  root.add(sea);
  root.add(motes(80, { color: '#f4d58a', spread: [20, 8, 14], y: 0 }));
  const key = addLights(root, { hemiSky: 0xdfe8e4, hemiGround: 0x6a6050, hemiI: 1.4, key: 0xfff0d0, keyI: 2.4, keyPos: [5, 13, 3] });
  root.userData.fog = new THREE.Fog(0xd8d6cc, 30, 110);
  return key;
}

// ───────────────────────────── chapters 4–10 (scenesLate.js) ─────────────────────────────
const LATE = lateScenes({ canvasTex, skyDome, backdrop, paintStone, paintWood, paintFlagstones, addLights, motes, rock, pineTree });

/** Builds one of the late-chapter scenes from its description: sky, backdrop, table, props, lights. */
function buildFromSpec(root, spec) {
  root.add(skyDome(...spec.sky));
  // Only a band of the cylinder is ever on screen (roughly v 0.3–0.7 at the battle camera), so each
  // painting is squeezed into exactly that band: sky above it, ground below it, nothing wasted.
  root.add(backdrop((ctx, w, h) => {
    const sg = ctx.createLinearGradient(0, 0, 0, h * 0.34);
    sg.addColorStop(0, spec.sky[0]); sg.addColorStop(1, spec.sky[1]);
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h * 0.34);
    ctx.save();
    ctx.translate(0, h * 0.26); ctx.scale(1, 0.52);
    spec.paint(ctx, w, h);
    ctx.restore();
    const g = ctx.createLinearGradient(0, h * 0.78, 0, h * 0.86);
    g.addColorStop(0, rgba(spec.ground, 0)); g.addColorStop(1, spec.ground);
    ctx.fillStyle = g; ctx.fillRect(0, h * 0.78, w, h * 0.08);
    ctx.fillStyle = spec.ground; ctx.fillRect(0, h * 0.86 - 1, w, h * 0.14 + 1);
    const gb = brush(ctx, 57);   // keep the ground band from reading as one flat colour
    for (let i = 0; i < 26; i++) gb.wash(gb.blob(gb.r(0, w), gb.r(h * 0.8, h), gb.r(60, 220), gb.r(8, 22)), { color: mix(spec.ground, '#ffffff', 0.25), alpha: 0.12, blur: 14, edge: 0 });
    for (let i = 0; i < 18; i++) gb.wash(gb.blob(gb.r(0, w), gb.r(h * 0.8, h), gb.r(40, 160), gb.r(6, 16)), { color: mix(spec.ground, '#000000', 0.4), alpha: 0.14, blur: 16, edge: 0 });
  }, { radius: 50, height: 34, y: 6 }));
  const F = spec.floor;
  const fc = canvas(2048, 1400);
  if (F.kind === 'wood') paintWood(fc.getContext('2d'), 2048, 1400, { seed: 5, base: F.base, planks: 10 });
  else if (F.kind === 'paved' || F.kind === 'sand') paintFlagstones(fc.getContext('2d'), 2048, 1400, { base: F.base, dark: F.dark ?? '#2e2620', seed: F.kind === 'sand' ? 23 : 17 });
  else paintStone(fc.getContext('2d'), 2048, 1400, { seed: 2, base: F.base, rings: false });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 10), [0, 1, 2, 3, 4, 5].map((i) => i === 2
    ? new THREE.MeshStandardMaterial({ map: canvasTex(fc), roughness: 0.85 }) : new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.9 })));
  floor.position.y = -0.3; floor.receiveShadow = true;
  root.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: new THREE.Color(spec.ground), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true;
  root.add(ground);
  spec.props?.(root);
  root.add(motes(spec.motes.n, { color: spec.motes.color, spread: [17, 6, 10] }));
  addLights(root, spec.lights);
  root.userData.fog = new THREE.Fog(spec.fog[0], spec.fog[1], spec.fog[2]);
}

/** Build a scene root. kind: kunlun | stage | study | changan | menu | one of the late-chapter scenes. */
export function buildScene(kind, variant) {
  const root = new THREE.Group();
  root.name = `scene:${kind}`;
  let spec = null;
  if (kind === 'stage') buildStage(root, variant);
  else if (kind === 'study') buildStudy(root);
  else if (kind === 'menu') buildMenu(root);
  else if (kind === 'changan') buildChangan(root, variant);
  else if (LATE[kind]) { spec = LATE[kind](variant); buildFromSpec(root, spec); }
  else buildKunlun(root, variant);
  if (kind !== 'menu') {
    const darkInk = kind === 'kunlun' || spec?.inkDark;
    const oc = canvas(2048, 1366); paintOverlay(oc.getContext('2d'), 2048, 1366, darkInk ? {} : { ink: '#e8dcc4', gold: '#e8c872' });
    const ov = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshBasicMaterial({ map: canvasTex(oc), transparent: true, depthWrite: false, opacity: kind === 'study' ? 0.9 : 1 }));
    ov.rotation.x = -Math.PI / 2; ov.position.y = 0.012; ov.renderOrder = 1;
    if (kind === 'study') ov.material.map = canvasTex((() => { const c = canvas(2048, 1366); paintOverlay(c.getContext('2d'), 2048, 1366, {}); return c; })());
    root.add(ov);
  }
  root.userData.tickers = [];
  root.traverse((o) => { if (o.userData.tick) root.userData.tickers.push(o.userData.tick); });
  return root;
}

export function disposeScene(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) { if (typeof m === 'object') { m.map?.dispose(); m.dispose?.(); } }
  });
}
export { seal };
