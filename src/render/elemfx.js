// Volumetric five-element effects: 雷 lightning · 火 flame · 水 water · 风 wind · 土 earth · 金 metal · 木 wood.
// createFx() hands us its private spawn/rng so these live in the same pooled lifetime system as the
// rest of the VFX. Each element runs a three-beat structure — charge, burst, residue — and drives the
// scene lighting plus the post-process shock uniforms, so a cast is felt across the whole frame.
import * as THREE from 'three';
import { ease } from './tween.js';

/** Cheap value-noise fbm, shared by the flame / water / wind shaders. */
const NOISE = `
  float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.02; a *= 0.5; } return v; }
`;

export function elementalFx({ spawn, R, api, app }) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const post = app.post.uniforms;
  const jitter = (v, k) => v.clone().add(V((R() - 0.5) * k, 0, (R() - 0.5) * k * 0.75));

  /** Shader material whose `time` advances with the effect and whose `o` is the master opacity. */
  const animMat = (frag, colorA, colorB, extra = {}) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, o: { value: 1 }, cA: { value: new THREE.Color(colorA) }, cB: { value: new THREE.Color(colorB) }, ...extra },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vView;
      void main(){ vUv = uv; vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `${NOISE}\nuniform float time; uniform float o; uniform vec3 cA; uniform vec3 cB;
      varying vec2 vUv; varying vec3 vN; varying vec3 vView;
      float facing(){ return abs(dot(normalize(vN), normalize(vView))); }\n${frag}`,
  });
  /** Drive a shader material's clock for the life of the effect. */
  const clock = (mat, m, life, fn) => { let t = 0; spawn(m, life, (k, dt) => { t += dt; mat.uniforms.time.value = t; fn(k, t); }); };

  const api2 = {
    // ══ impact layer: what makes a hit felt rather than merely seen ═════════════════════
    /** Pulsing point light, so the effect actually lights the board and the figures on it. */
    light(p, { color = '#ffffff', power = 40, dist = 16, life = 0.8, flicker = 0, rise = 0.12 } = {}) {
      const l = new THREE.PointLight(new THREE.Color(color), 0, dist, 1.6);
      l.position.copy(p).add(V(0, 1.2, 0));
      spawn(l, life, (k) => {
        const env = k < rise ? k / rise : Math.pow(1 - (k - rise) / (1 - rise), 1.7);
        l.intensity = power * env * (flicker ? 1 - flicker * R() : 1);
      });
      return l;
    },
    /** Screen-space shock: warps and colour-splits the frame as the wave sweeps outward. */
    shock(p, { amp = 1, life = 0.6, aberr = 1.2, streak = 0 } = {}) {
      const v = p.clone().project(app.camera);
      post.swC.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
      post.swAmp.value = amp;
      post.swT.value = 0.001;
      if (aberr) post.aberr.value = Math.max(post.aberr.value, aberr);
      if (streak) post.streak.value = Math.max(post.streak.value, streak);
      spawn(new THREE.Object3D(), life, (k) => { post.swT.value = k >= 1 ? -1 : k; });
    },
    /** A hard ring of energy racing outward across the table. */
    shockRing(p, { color = '#ffffff', size = 8, life = 0.55, y = 0.04 } = {}) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { o: { value: 1 }, w: { value: 0.1 }, c: { value: new THREE.Color(color) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float o; uniform float w; uniform vec3 c; varying vec2 vUv;
          void main(){ float r = length(vUv - 0.5) * 2.0;
            float a = smoothstep(w - 0.26, w - 0.02, r) * (1.0 - smoothstep(w - 0.02, w + 0.05, r));
            gl_FragColor = vec4(c * (1.0 + a * 0.5), a * o * 0.8); }`,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(p.x, p.y + y, p.z);
      spawn(m, life, (k) => { mat.uniforms.w.value = 0.08 + ease.out(k) * 0.94; mat.uniforms.o.value = Math.pow(1 - k, 1.4); });
    },
    /** Glowing fissures tearing outward from the point of impact. */
    cracks(p, { color = '#ffb060', n = 8, len = 3.6, life = 1.2 } = {}) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + R() * 0.5, L = len * (0.5 + R() * 0.8), pts = [V(p.x, p.y + 0.03, p.z)];
        for (let k = 1; k <= 4; k++) {
          const t = k / 4;
          pts.push(V(p.x + Math.cos(a) * L * t + (R() - 0.5) * 0.45, p.y + 0.03, p.z + Math.sin(a) * L * t * 0.75 + (R() - 0.5) * 0.35));
        }
        const mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { o: { value: 1 }, g: { value: 0 }, c: { value: new THREE.Color(color) } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform float o; uniform float g; uniform vec3 c; varying vec2 vUv;
            void main(){ float a = (1.0 - smoothstep(g - 0.18, g, vUv.x)) * (1.0 - vUv.x * 0.65);
              gl_FragColor = vec4(c, a * o * 0.75); }`,
        });
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 4), mat);
        spawn(m, life, (k) => { mat.uniforms.g.value = ease.out(Math.min(1, k * 4)); mat.uniforms.o.value = Math.pow(1 - k, 1.6); });
      }
    },
    /** Anticipation: motes racing inward while a core swells, held just before the release. */
    charge(p, { color = '#ffffff', n = 28, r = 3.4, life = 0.45, h = 0.8, core = true } = {}) {
      const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), a0 = [], r0 = [], y0 = [], d0 = [];
      for (let i = 0; i < n; i++) { a0.push(R() * 6.283); r0.push(r * (0.5 + R() * 0.8)); y0.push(R() * 2.4); d0.push(R() * 0.4); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      spawn(pts, life, (k) => {
        for (let i = 0; i < n; i++) {
          const t = Math.max(0, Math.min(1, (k - d0[i]) / (1 - d0[i])));
          const e = ease.in(t), rr = r0[i] * (1 - e), ang = a0[i] + e * 3.6;
          pos[i * 3] = p.x + Math.cos(ang) * rr; pos[i * 3 + 1] = p.y + h + y0[i] * (1 - e); pos[i * 3 + 2] = p.z + Math.sin(ang) * rr * 0.75;
        }
        g.attributes.position.needsUpdate = true;
        pts.material.opacity = Math.min(1, (1 - k) * 3);
      });
      if (core) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        c.position.set(p.x, p.y + h, p.z);
        spawn(c, life, (k) => { const e = ease.in(k); c.scale.setScalar(0.25 + e * 1.1); c.material.opacity = (0.15 + e * 0.45) * (1 - k * 0.4); });
      }
      api.ring(p, { color, size: r * 1.7, life: life * 1.2 });
    },
    /** Crescent blade — a partial torus used for wind slashes and wave crests. */
    crescent(p, { color = '#ffffff', r = 1.2, tube = 0.035, arc = 1.9, life = 0.7, dir = 0, tilt = 0, travel = 4, spin = 0 } = {}) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 28, arc), mat);
      m.rotation.set(tilt, 0, -arc / 2);
      const holder = new THREE.Group();
      holder.add(m);
      holder.rotation.y = -dir;
      holder.position.copy(p);
      spawn(holder, life, (k) => {
        const e = ease.out(k);
        holder.position.set(p.x + Math.cos(dir) * travel * e, p.y + 0.5, p.z + Math.sin(dir) * travel * 0.75 * e);
        holder.scale.setScalar(0.5 + e * 0.9);
        m.rotation.x = tilt + spin * k;
        mat.opacity = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.95;
      });
    },
    /** Tumbling solid chunks thrown from a point — rock, ice, splinters. */
    debris(p, { color = '#8a7a5a', n = 10, speed = 5, life = 1.1, size = 0.18, gravity = 11 } = {}) {
      for (let i = 0; i < n; i++) {
        const a = R() * 6.283, sp = speed * (0.5 + R() * 0.8), up = 3.5 + R() * 4.5;
        const sc = size * (0.55 + R());
        const m = new THREE.Mesh(new THREE.TetrahedronGeometry(sc),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.9, flatShading: true, emissive: new THREE.Color(color), emissiveIntensity: 0.3 }));
        const vel = V(Math.cos(a) * sp, up, Math.sin(a) * sp * 0.75);
        const rot = V(R() * 9, R() * 9, R() * 9);
        m.position.copy(p);
        spawn(m, life, (k, dt) => {
          vel.y -= gravity * dt;
          m.position.addScaledVector(vel, dt);
          m.rotation.x += rot.x * dt; m.rotation.y += rot.y * dt; m.rotation.z += rot.z * dt;
          if (m.position.y < p.y) { m.position.y = p.y; vel.y *= -0.35; vel.multiplyScalar(0.6); }
          m.scale.setScalar(Math.max(0.01, 1 - Math.pow(k, 4)));
        });
      }
    },

    // ══ 雷 ══════════════════════════════════════════════════════════════════════════════
    /** Sky charge, then a forked strike with ground arcs crawling away from the hit. */
    bolt(p, { color = '#fff6d0', glow = '#9fc0ff', from = 12, spread = 2.2, branches = 5, life = 0.8 } = {}) {
      api2.charge(p, { color: glow, r: 3.2, life: 0.42, h: 1.2 });
      api2.light(p, { color: glow, power: 14, life: 0.4, dist: 12 });
      setTimeout(() => api2.boltStrike(p, { color, glow, from, spread, branches, life }), 300);
    },
    boltStrike(p, { color, glow, from, spread, branches, life }) {
      const chan = (x0, z0, y0, wob) => {
        const pts = [];
        for (let i = 0; i <= 16; i++) {
          const k = i / 16;
          pts.push(V(x0 + (p.x - x0) * k + (R() - 0.5) * wob * (1 - k), y0 + (p.y - y0) * k,
            z0 + (p.z - z0) * k + (R() - 0.5) * wob * 0.8 * (1 - k)));
        }
        return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.08);
      };
      const main = chan(p.x + (R() - 0.5) * spread, p.z - 0.6 + (R() - 0.5) * spread, from, 1.0);
      for (const [w, col, op] of [[0.34, glow, 0.14], [0.14, glow, 0.35], [0.055, color, 0.8], [0.022, '#ffffff', 0.95]]) {
        const m = new THREE.Mesh(new THREE.TubeGeometry(main, 64, w, 6),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        spawn(m, life, (k) => { m.material.opacity = op * Math.pow(1 - k, 1.5) * (0.5 + 0.5 * Math.sin(k * 90 + w * 40)); });
      }
      for (let b = 0; b < branches; b++) {                    // forks peeling off the main channel
        const t = 0.2 + R() * 0.55, org = main.getPoint(t);
        const end = org.clone().add(V((R() - 0.5) * 4, -1.8 - R() * 2.6, (R() - 0.5) * 3));
        const pts = [org];
        for (let i = 1; i <= 5; i++) pts.push(org.clone().lerp(end, i / 5).add(V((R() - 0.5) * 0.55, 0, (R() - 0.5) * 0.45)));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.05, 5),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        spawn(m, life * 0.6, (k) => { m.material.opacity = (1 - k) * 0.85 * (0.35 + 0.65 * Math.sin(k * 70)); });
      }
      api2.light(p, { color: '#dce8ff', power: 45, dist: 22, life: 0.5, rise: 0.02, flicker: 0.45 });
      api2.shock(p, { amp: 1.0, life: 0.55, aberr: 1.6, streak: 0.5 });
      api2.shockRing(p, { color: glow, size: 12, life: 0.55 });
      api2.cracks(p, { color: glow, n: 9, len: 4, life: 0.9 });
      api.burst(p, { color, size: 2.6, life: 0.5 });
      api.sparks(p, { color, n: 44, speed: 7, gravity: -4, life: 0.7 });
      for (let i = 0; i < 4; i++) setTimeout(() => api2.groundArc(p, color), 120 + i * 90);
      setTimeout(() => api2.boltEcho(p, color, glow), 110);
      setTimeout(() => api2.boltEcho(p, color, glow), 240);
    },
    /** A residual arc skittering across the table after the strike. */
    groundArc(p, color) {
      const a = R() * 6.283, L = 2 + R() * 2.4, pts = [V(p.x, p.y + 0.05, p.z)];
      for (let i = 1; i <= 6; i++) {
        const t = i / 6;
        pts.push(V(p.x + Math.cos(a) * L * t + (R() - 0.5) * 0.5, p.y + 0.05 + R() * 0.25, p.z + Math.sin(a) * L * t * 0.75 + (R() - 0.5) * 0.4));
      }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.035, 4),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      spawn(m, 0.3, (k) => { m.material.opacity = (1 - k) * (0.3 + 0.7 * Math.sin(k * 60)); });
    },
    boltEcho(p, color, glow) {
      const pts = [], x0 = p.x + (R() - 0.5) * 3.4;
      for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(V(x0 + (p.x - x0) * k + (R() - 0.5) * 0.7, 11 * (1 - k) + p.y, p.z - 0.4 + (R() - 0.5) * 0.6)); }
      for (const [w, c, o] of [[0.09, glow, 0.22], [0.032, color, 0.7]]) {
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, w, 5),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        spawn(m, 0.26, (k) => { m.material.opacity = (1 - k) * o; });
      }
      api2.light(p, { color: '#dce8ff', power: 26, dist: 20, life: 0.2, rise: 0.02 });
    },

    // ══ 火 ══════════════════════════════════════════════════════════════════════════════
    /** A roaring column wrapped in fire ribbons, throwing embers and trailing smoke. */
    flameColumn(p, { color = '#ff9020', color2 = '#7a1202', h = 4.4, r = 0.72, life = 1.5 } = {}) {
      const mat = animMat(`
        void main(){
          float wob = sin(vUv.y * 9.0 - time * 5.0) * 0.06;
          float n = fbm(vec2(vUv.x * 7.0 + wob * 6.0, vUv.y * 3.4 - time * 2.6));
          float n2 = fbm(vec2(vUv.x * 13.0, vUv.y * 6.0 - time * 4.1));
          float taper = pow(1.0 - vUv.y, 0.75);
          float shape = (n * 0.8 + n2 * 0.4) * taper * 1.6;
          float a = smoothstep(0.62, 0.94, shape);          // threshold sits inside the noise range,
          float core = smoothstep(1.15, 1.45, shape);        // so the silhouette breaks into tongues
          vec3 c = mix(cA, cB, clamp(vUv.y * 1.7 - n * 0.35, 0.0, 1.0));
          c = mix(c, vec3(1.0, 0.88, 0.55), core * 0.22);
          float f = smoothstep(0.05, 0.55, facing());
          gl_FragColor = vec4(c * (0.85 + 0.3 * taper), (a * 0.9 + core * 0.3) * o * f);
        }`, color, color2);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r, h, 20, 12, true), mat);
      m.position.set(p.x, p.y + h / 2 - 0.35, p.z);
      clock(mat, m, life, (k, t) => {
        mat.uniforms.o.value = k < 0.18 ? k / 0.18 : 1 - Math.pow((k - 0.18) / 0.82, 2);
        m.scale.set(1 + Math.sin(t * 9) * 0.07, 0.75 + ease.out(Math.min(1, k * 3)) * 0.3, 1 + Math.cos(t * 7) * 0.07);
      });
      const coreMat = animMat(`void main(){ float n = fbm(vec2(vUv.x*4.0, vUv.y*3.0 - time*2.6)); float a = smoothstep(0.52,0.82, n*(1.0-vUv.y)*2.2);
        gl_FragColor = vec4(mix(cA,cB,vUv.y)*0.7, a*o*smoothstep(0.05,0.5,facing())); }`, '#ffd880', color);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.3, h * 0.5, 14, 8, true), coreMat);
      core.position.set(p.x, p.y + h * 0.26 - 0.25, p.z);
      clock(coreMat, core, life * 0.9, (k) => { coreMat.uniforms.o.value = Math.sin(Math.min(1, k) * Math.PI) * 0.22; });

      const outMat = animMat(`
        void main(){
          float n = fbm(vec2(vUv.x * 5.0 - time * 0.8, vUv.y * 2.6 - time * 1.9));
          float taper = pow(1.0 - vUv.y, 0.8);
          float a = smoothstep(0.72, 1.0, n * taper * 1.7);
          gl_FragColor = vec4(mix(cA, cB, vUv.y) * 0.7, a * o * smoothstep(0.04, 0.5, facing()));
        }`, '#ff8a20', '#a02008');
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 1.5, h * 1.1, 18, 12, true), outMat);
      outer.position.set(p.x, p.y + h * 0.55 - 0.35, p.z);
      clock(outMat, outer, life, (k, t) => {
        outMat.uniforms.o.value = Math.sin(Math.min(1, k * 1.1) * Math.PI) * 0.6;
        outer.rotation.y = -t * 0.8;
      });
      api2.light(p, { color: '#ff8a30', power: 30, dist: 15, life, flicker: 0.35, rise: 0.08 });
      api2.shockRing(p, { color: '#ff7a20', size: r * 9, life: 0.55 });
      api2.shock(p, { amp: 0.7, life: 0.5, aberr: 1.1 });
      for (let i = 0; i < 3; i++) api.sparks(jitter(p, r * 1.4).add(V(0, 0.15, 0)), { color: i ? '#ffb040' : '#fff0c0', n: 22, speed: 2.6 + i, gravity: 2.4, life: life * (0.7 + i * 0.15) });
      setTimeout(() => api2.smoke(p, { h: h * 1.1, r: r * 1.5 }), 420);
    },
    /** Dark curls lifting off after a fire dies down. */
    smoke(p, { h = 4, r = 1, n = 3, life = 1.8 } = {}) {
      for (let i = 0; i < n; i++) {
        const mat = animMat(`void main(){ float nn = fbm(vec2(vUv.x*4.0, vUv.y*2.2 - time*0.7));
          float a = smoothstep(0.42, 0.8, nn * (1.0 - vUv.y) * 1.9) * smoothstep(0.0, 0.25, vUv.y);
          gl_FragColor = vec4(mix(cA, cB, vUv.y), a*o*smoothstep(0.05,0.5,facing())); }`, '#2a2420', '#5a5048');
        mat.blending = THREE.NormalBlending;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 0.5, h, 14, 10, true), mat);
        m.position.set(p.x + (R() - 0.5) * r, p.y + h / 2, p.z + (R() - 0.5) * r);
        clock(mat, m, life, (k) => {
          mat.uniforms.o.value = Math.sin(Math.min(1, k) * Math.PI) * 0.4;
          m.position.y = p.y + h / 2 + k * 1.4;
          m.scale.setScalar(0.7 + k * 0.6);
          m.rotation.y = k * 1.2 + i;
        });
      }
    },
    /** Spiral ribbons winding up a column — shared by fire and wind. */
    swirl(p, { color = '#ffffff', tip = null, h = 3.4, r = 1.3, arms = 5, life = 1.6, turns = 7.5, w = 0.032, taper = 0.75 } = {}) {
      for (let a = 0; a < arms; a++) {
        const a0 = (a / arms) * 6.283, pts = [];
        const y0 = R() * 0.3, y1 = 0.7 + R() * 0.35, wob = 0.12 + R() * 0.22, ph = R() * 6.283;
        const spin = turns * (0.7 + R() * 0.6);
        for (let i = 0; i <= 20; i++) {
          const k = i / 20, ang = a0 + k * spin;
          const rr = r * (1.15 - k * taper) * (1 + Math.sin(k * 5 + ph) * wob);
          pts.push(V(Math.cos(ang) * rr, (y0 + k * y1) * h, Math.sin(ang) * rr * 0.75));
        }
        const mat = animMat(`void main(){ float t = vUv.x; float a = smoothstep(0.0,0.1,t)*(1.0-smoothstep(0.6,1.0,t)); gl_FragColor = vec4(mix(cA,cB,t)*0.95, a*o); }`, color, tip ?? color);
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 52, w, 5), mat);
        m.position.copy(p);
        spawn(m, life, (k) => { mat.uniforms.o.value = Math.sin(Math.min(1, k * 1.1) * Math.PI) * 0.6; m.rotation.y = k * 3.4 + a * 0.2; });
      }
    },

    // ══ 水 ══════════════════════════════════════════════════════════════════════════════
    /** A crown of water thrown up over a spinning whirlpool, with crests sweeping outward. */
    waterColumn(p, { color = '#7fc8f8', color2 = '#12446e', h = 3.4, r = 0.95, life = 1.5 } = {}) {
      const mat = animMat(`
        void main(){
          float n = fbm(vec2(vUv.x * 9.0, vUv.y * 3.2 - time * 1.5));
          float n2 = fbm(vec2(vUv.x * 17.0 + 4.0, vUv.y * 7.0 - time * 2.2));
          float taper = 1.0 - vUv.y;
          float a = smoothstep(0.62, 0.95, (n * 0.75 + n2 * 0.45) * taper * 2.1);
          float sheen = smoothstep(0.66, 1.0, n2);
          vec3 c = mix(cB, cA, clamp(vUv.y * 0.35 + sheen * 0.4, 0.0, 1.0));
          gl_FragColor = vec4(c * 1.0, a * o * 0.95 * smoothstep(0.04, 0.5, facing()));
        }`, color, color2);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 0.3, h, 22, 12, true), mat);
      m.position.set(p.x, p.y + h / 2 - 0.3, p.z);
      clock(mat, m, life, (k) => {
        const rise = ease.out(Math.min(1, k * 2.2));
        m.scale.set(1, 0.25 + rise * 0.85, 1);
        m.position.y = p.y + (h / 2) * (0.25 + rise * 0.85);
        mat.uniforms.o.value = k < 0.13 ? k / 0.13 : 1 - Math.pow((k - 0.13) / 0.87, 1.6);
      });
      api2.whirl(p, { color: '#5fb8ec', r: r * 3.4, life: life * 0.95 });
      api2.swirl(p, { color: '#4fa8e0', tip: '#bfe4ff', h: h * 0.8, r: r * 1.7, arms: 3, life: life * 0.8, turns: 4.5, w: 0.026 });
      api2.light(p, { color: '#7ac0f0', power: 42, dist: 16, life });
      api2.shockRing(p, { color, size: r * 10, life: 0.6 });
      api2.shock(p, { amp: 0.9, life: 0.55, aberr: 1.3 });
      for (let i = 0; i < 2; i++) api.ring(p, { color: '#8fcdf0', size: r * (2.6 + i * 2.2), life: 0.9 + i * 0.35 });
      for (let i = 0; i < 4; i++) api2.crescent(p, { color: '#9fd8f8', r: 0.85, tube: 0.03, arc: 2.1, dir: (i / 4) * 6.283, travel: 5.4, tilt: 1.15, life: 0.75 });
      api.sparks(p.clone().add(V(0, 0.4, 0)), { color, n: 46, speed: 4.2, gravity: -8, life: 1.1 });
      api2.debris(jitter(p, 0.4), { color: '#bfe4ff', n: 8, speed: 3.4, size: 0.1, life: 0.9 });
    },
    /** Spiral whirlpool disc spinning on the table. */
    whirl(p, { color = '#bfe4ff', r = 3, life = 1.3 } = {}) {
      const mat = animMat(`
        void main(){
          vec2 d = vUv - 0.5; float rr = length(d) * 2.0; float ang = atan(d.y, d.x);
          float sp = sin(ang * 3.0 + rr * 9.0 - time * 7.0) * 0.5 + 0.5;
          float a = sp * (1.0 - smoothstep(0.35, 1.0, rr)) * smoothstep(0.02, 0.2, rr);
          gl_FragColor = vec4(mix(cB, cA, sp) * 0.85, a * o);
        }`, color, '#ffffff');
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(p.x, p.y + 0.05, p.z);
      clock(mat, m, life, (k) => { mat.uniforms.o.value = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.32; m.rotation.z = -k * 4; });
    },

    // ══ 风 ══════════════════════════════════════════════════════════════════════════════
    /** A funnel with body, ribbons winding up it, and blades flung off the rim. */
    vortex(p, { color = '#b8cdd8', h = 4, r = 1.4, life = 1.7, arms = 5 } = {}) {
      const mat = animMat(`
        void main(){
          float n = fbm(vec2(vUv.x * 6.0 + time * 1.6, vUv.y * 3.0 - time * 1.1));
          float a = smoothstep(0.44, 0.86, n * 1.7) * (1.0 - smoothstep(0.7, 1.0, vUv.y)) * smoothstep(0.0, 0.15, vUv.y);
          gl_FragColor = vec4(mix(cA, cB, n) * 0.8, a * o * smoothstep(0.03, 0.45, facing()));
        }`, color, '#eaf2f6');
      const funnel = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 0.25, h, 24, 14, true), mat);
      funnel.position.set(p.x, p.y + h / 2 - 0.3, p.z);
      clock(mat, funnel, life, (k) => { mat.uniforms.o.value = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.45; funnel.rotation.y = k * 9; });

      api2.swirl(p, { color, tip: '#eef6fa', h, r, arms, life, turns: 7, w: 0.022 });
      api2.whirl(p, { color, r: r * 2.6, life: life * 0.9 });
      api2.light(p, { color: '#dcebf2', power: 26, dist: 14, life });
      api2.shock(p, { amp: 0.8, life: 0.6, aberr: 0.9, streak: 0.35 });
      for (let i = 0; i < 7; i++) {
        setTimeout(() => api2.crescent(p, { color: '#cfe6f2', r: 0.75 + R() * 0.4, tube: 0.028, arc: 2.2, dir: R() * 6.283, travel: 6, tilt: 0.9 + R() * 0.5, life: 0.65, spin: 2 }), i * 70);
      }
      const n = 54, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), ph = [], sp = [];
      for (let i = 0; i < n; i++) { ph.push(R() * 6.283); sp.push(0.4 + R() * 1.1); pos.set([p.x, p.y, p.z], i * 3); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.17, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      spawn(pts, life, (k) => {
        for (let i = 0; i < n; i++) {
          const y = (k * sp[i] * 1.6) % 1, ang = ph[i] + y * 9 + k * 5, rr = r * (1.3 - y * 0.9);
          pos[i * 3] = p.x + Math.cos(ang) * rr; pos[i * 3 + 1] = p.y + y * h; pos[i * 3 + 2] = p.z + Math.sin(ang) * rr * 0.75;
        }
        g.attributes.position.needsUpdate = true;
        pts.material.opacity = Math.sin(k * Math.PI) * 0.9;
      });
      api2.shockRing(p, { color, size: r * 8, life: 0.7 });
    },

    // ══ 土 ══════════════════════════════════════════════════════════════════════════════
    /** The ground shudders, then stone teeth punch up through it in a spreading ring. */
    spikes(p, { color = '#7a6a54', n = 8, r = 1.7, life = 1.6, h = 2.6 } = {}) {
      api2.cracks(p, { color: '#e0b060', n: 10, len: r * 2.4, life: life * 0.8 });
      api2.shockRing(p, { color: '#e8d4a8', size: r * 6, life: 0.6 });
      api2.shock(p, { amp: 1.2, life: 0.6, aberr: 1.4 });
      api2.light(p, { color: '#e8c070', power: 30, dist: 14, life: 0.7 });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + R() * 0.35, rr = r * (0.5 + R() * 0.55);
        const hh = h * (0.7 + R() * 0.7), w = 0.4 + R() * 0.28;
        const m = new THREE.Mesh(new THREE.ConeGeometry(w, hh, 5),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.9, flatShading: true, emissive: new THREE.Color('#3a2e22'), emissiveIntensity: 0.5 }));
        const x = p.x + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr * 0.75;
        m.position.set(x, p.y - hh, z);
        m.rotation.set((R() - 0.5) * 0.4, R() * 3, (R() - 0.5) * 0.4);
        m.castShadow = true;
        const d = i * 0.04;
        spawn(m, life, (k) => {
          const t = Math.max(0, Math.min(1, (k * life - d) / (life * 0.22)));
          const out = k < 0.7 ? ease.back(t) : ease.back(t) * (1 - (k - 0.7) / 0.3);
          m.position.y = p.y - hh + hh * 0.74 * out;
        });
        if (i % 2 === 0) api.sparks(V(x, p.y + 0.1, z), { color: '#c8b48a', n: 9, speed: 2, gravity: 6, life: 0.7 });
      }
      api2.debris(p, { color: '#9a8a68', n: 9, speed: 5, life: 1.1, size: 0.18 });
      api.sparks(p.clone().add(V(0, 0.2, 0)), { color: '#d8c8a0', n: 22, speed: 2.8, gravity: 7, life: 0.85 });
    },

    // ══ 金 ══════════════════════════════════════════════════════════════════════════════
    /** Blades orbit, lock on, then converge into one bright cut. */
    bladeStorm(p, { color = '#ffe6a0', n = 12, life = 1.0 } = {}) {
      api2.charge(p, { color, r: 4, life: 0.34, h: 0.7, core: false });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + R() * 0.3, d0 = 3.4 + R() * 1.8;
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.055, 1.5, 4),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        m.rotation.z = Math.PI / 2;
        m.scale.set(1, 1, 0.45);
        const delay = 0.12 + R() * 0.22;
        spawn(m, life, (k) => {
          const t = Math.max(0, Math.min(1, (k * life - delay) / (life * 0.42)));
          const ang = a + (1 - t) * 1.6, d = d0 * (1 - ease.in(t));
          m.position.set(p.x + Math.cos(ang) * d, p.y + 0.55 + Math.sin(a * 2) * 0.3 * (1 - t), p.z + Math.sin(ang) * d * 0.75);
          m.rotation.y = -ang;
          m.material.opacity = t < 1 ? 0.95 * (0.25 + 0.75 * t) : 0;
        });
      }
      setTimeout(() => {
        const c = p.clone().add(V(0, 0.55, 0));
        api2.light(c, { color: '#ffe0a0', power: 95, dist: 18, life: 0.45, rise: 0.03 });
        api2.shock(c, { amp: 1.3, life: 0.5, aberr: 1.8, streak: 0.55 });
        api2.shockRing(p, { color, size: 10, life: 0.5 });
        api2.cracks(p, { color: '#ffd070', n: 6, len: 3.2, life: 0.8 });
        for (let i = 0; i < 3; i++) api2.crescent(p, { color: '#ffdf9a', r: 1.3, tube: 0.045, arc: 2.6, dir: i * 2.1, travel: 5.5, tilt: 1.3, life: 0.55 });
        api.burst(c, { color, size: 2.6, life: 0.5 });
        api.sparks(c, { color, n: 44, speed: 6.5, gravity: -2, life: 0.7 });
        api2.debris(c, { color: '#e8d090', n: 10, speed: 5, size: 0.11, life: 0.8 });
      }, 340);
    },

    // ══ 木 ══════════════════════════════════════════════════════════════════════════════
    /** Shoots climbing out of the ground, bursting into blossom as they reach height. */
    vines(p, { color = '#4a8c5c', n = 7, h = 3.0, r = 1.2, life = 1.9 } = {}) {
      api2.light(p, { color: '#8ad890', power: 24, dist: 14, life });
      api2.shockRing(p, { color: '#9fe0a8', size: r * 7, life: 0.7 });
      api2.whirl(p, { color: '#9fe0a8', r: r * 2.2, life: life * 0.7 });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + R() * 0.6, rr = r * (0.3 + R() * 0.8);
        const bx = p.x + Math.cos(a) * rr, bz = p.z + Math.sin(a) * rr * 0.75;
        const hh = h * (0.7 + R() * 0.6), lean = (R() - 0.5) * 1.2, pts = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V(bx + Math.sin(t * 4 + a) * 0.3 + lean * t, p.y + t * hh, bz + Math.cos(t * 3 + a) * 0.24)); }
        const mat = animMat(`void main(){ float t = vUv.x; float a = 1.0 - smoothstep(0.75, 1.0, t); gl_FragColor = vec4(mix(cA,cB,t), a*o); }`, color, '#9fd08a');
        mat.blending = THREE.NormalBlending;
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.065, 5), mat);
        m.scale.y = 0.01;
        const d = i * 0.05;
        spawn(m, life, (k) => {
          const t = Math.max(0, Math.min(1, (k * life - d) / (life * 0.38)));
          m.scale.y = 0.02 + ease.out(t) * 0.98;
          mat.uniforms.o.value = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        });
        const tip = V(bx + lean, p.y + hh, bz);
        setTimeout(() => {                                   // blossom opening at the tip
          api.burst(tip, { color: '#d8f0c0', size: 1.3, life: 0.6 });
          api.petals(tip, { color: '#bfe8a0', n: 6, spread: 1.1, life: life * 0.7, rise: 0.4 });
        }, 320 + i * 55);
      }
      api.petals(p.clone().add(V(0, 0.6, 0)), { color: '#8ac070', n: 14, spread: r * 2, life: life * 0.9, rise: 0.5 });
    },
  };

  /** 五行 dispatcher: element key → its signature eruption. */
  api2.element = (el, p, o = {}) => ({
    metal: () => api2.bladeStorm(p, o),
    wood: () => api2.vines(p, o),
    water: () => api2.waterColumn(p, o),
    fire: () => api2.flameColumn(p, o),
    earth: () => api2.spikes(p, o),
    wind: () => api2.vortex(p, o),
    thunder: () => api2.bolt(p, o),
  }[el] ?? (() => api.burst(p, o)))();

  // Bleed the one-shot post uniforms off every frame so an impact fades instead of sticking.
  app.onFrame((dt) => {
    post.aberr.value = Math.max(0, post.aberr.value - dt * 3.4);
    post.streak.value = Math.max(0, post.streak.value - dt * 3.0);
  });

  return api2;
}
