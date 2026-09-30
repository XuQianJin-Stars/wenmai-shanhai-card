// Renderer, camera and the ink-wash post pass (docs/tech_art/SHADERS/ink_wash_postprocess.md, web version):
//   scene → MSAA HDR target (+depth) → one full-screen pass: depth-Sobel ink outlines, desaturation toward
//   Saturation≈0.7, warm paper tint, xuan-paper grain, soft vignette, ACES tone map, sRGB out.
import * as THREE from 'three';
import { updateTweens } from './tween.js';

const POST_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FS = /* glsl */`
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 res; uniform float time; uniform float near; uniform float far;
uniform float inkStrength; uniform float saturation; uniform float grain; uniform float vignette; uniform float flash;
uniform vec3 flashColor; uniform float desat;
uniform float bloom; uniform float aberr; uniform float streak;
uniform vec2 swC; uniform float swT; uniform float swAmp;
varying vec2 vUv;
float linDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// Bright-pass gather on a golden-angle spiral: gives every additive VFX a real glow halo.
vec3 bloomGather(vec2 uv, vec2 px) {
  vec3 acc = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < 20; i++) {
    float fi = float(i) + 0.5;
    float t = fi / 20.0;
    vec2 o = vec2(cos(fi * 2.39996), sin(fi * 2.39996)) * sqrt(t) * 16.0 * px;
    vec3 c = texture2D(tColor, uv + o).rgb;
    float l = max(0.0, dot(c, vec3(0.299, 0.587, 0.114)) - 0.80);
    float w = 1.0 - t;
    acc += c * l * w; wsum += w;
  }
  return acc / max(wsum, 0.001);
}

void main() {
  vec2 px = 1.0 / res;
  float aspect = res.x / res.y;
  vec2 uv = vUv;
  float ring = 0.0;
  if (swT >= 0.0) {                      // expanding shock ring warps the image as it passes
    vec2 d = (vUv - swC) * vec2(aspect, 1.0);
    float r = length(d);
    float w = swT * 1.15;
    ring = smoothstep(w - 0.10, w - 0.02, r) * (1.0 - smoothstep(w - 0.02, w + 0.10, r));
    ring *= (1.0 - swT);
    uv += normalize(d + 1e-5) * vec2(1.0 / aspect, 1.0) * ring * swAmp * 0.075;
  }
  // wobble the sampling a hair so lines look brushed, not vector
  vec2 wob = (vec2(noise(vUv * res * 0.05), noise(vUv * res * 0.05 + 7.3)) - 0.5) * px * 1.2;
  float d = linDepth(uv);
  float s = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 o = k == 0 ? vec2(px.x, 0.0) : k == 1 ? vec2(0.0, px.y) : k == 2 ? vec2(px.x, px.y) : vec2(-px.x, px.y);
    float a = linDepth(uv + o + wob), b = linDepth(uv - o + wob);
    s = max(s, abs(a + b - 2.0 * d) / max(d, 0.001));
  }
  float edge = smoothstep(0.03, 0.09, s) * inkStrength;
  float ca = aberr + ring * 0.45;
  vec2 rad = (uv - 0.5) * vec2(aspect, 1.0);
  vec3 col;
  if (ca > 0.001) {
    vec2 off = rad * ca * 0.012;
    col = vec3(texture2D(tColor, uv + off).r, texture2D(tColor, uv).g, texture2D(tColor, uv - off).b);
  } else col = texture2D(tColor, uv).rgb;
  if (streak > 0.001) {                  // zoom lines punched outward from frame centre
    vec3 st = vec3(0.0);
    for (int i = 1; i <= 6; i++) st += texture2D(tColor, uv + (uv - 0.5) * float(i) * 0.016 * streak).rgb;
    col = mix(col, st / 6.0, min(0.75, streak));
  }
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, saturation);
  col = mix(col, vec3(lum) * vec3(0.95, 0.92, 0.86), desat);
  col *= vec3(1.03, 1.0, 0.94);
  col = mix(col, vec3(0.06, 0.065, 0.075), edge * 0.85);
  // paper grain: fibres + mottling, multiplied
  float g = noise(vUv * res * 0.6) * 0.5 + noise(vUv * res * 0.15 + 3.1) * 0.5;
  float fib = noise(vec2(vUv.x * res.x * 0.02, vUv.y * res.y * 0.9));
  col *= 1.0 - grain * (g * 0.7 + fib * 0.3);
  // vignette toward warm ink
  vec2 q = vUv - 0.5; q.x *= res.x / res.y;
  float v = smoothstep(0.35, 1.05, length(q));
  col = mix(col, col * vec3(0.55, 0.5, 0.45), v * vignette);
  if (bloom > 0.001) col += min(bloomGather(uv, px) * bloom, vec3(0.6));
  col += flashColor * flash;
  col += flashColor * ring * 0.10;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createApp(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 200);
  scene.add(camera);

  let rt = null;
  const post = new THREE.ShaderMaterial({
    vertexShader: POST_VS, fragmentShader: POST_FS, toneMapped: true, depthTest: false, depthWrite: false,
    uniforms: {
      tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) }, time: { value: 0 },
      near: { value: camera.near }, far: { value: camera.far }, inkStrength: { value: 0.85 }, saturation: { value: 0.78 },
      grain: { value: 0.07 }, vignette: { value: 0.75 }, flash: { value: 0 }, flashColor: { value: new THREE.Color(1, 0.95, 0.8) },
      desat: { value: 0 }, bloom: { value: 0.55 }, aberr: { value: 0 }, streak: { value: 0 },
      swC: { value: new THREE.Vector2(0.5, 0.5) }, swT: { value: -1 }, swAmp: { value: 1 },
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  quad.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function makeRT(w, h) {
    rt?.dispose();
    rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    rt.depthTexture = new THREE.DepthTexture(w, h);
    rt.depthTexture.type = THREE.UnsignedIntType;
    post.uniforms.tColor.value = rt.texture;
    post.uniforms.tDepth.value = rt.depthTexture;
  }

  const listeners = new Set();
  const api = {
    renderer, scene, camera, post, THREE,
    size: { w: 1, h: 1 },
    time: 0, paused: false, frame: 0,
    onFrame(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onResize: null,
    stats: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, fps: Math.round(api.fps) }),
    fps: 60,
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    api.size = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    makeRT(Math.floor(w * pr), Math.floor(h * pr));
    post.uniforms.res.value.set(w * pr, h * pr);
    api.onResize?.(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    api.fps = api.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    api.time += dt;
    api.frame++;
    post.uniforms.time.value = api.time;
    updateTweens(dt);
    for (const fn of listeners) fn(dt, api.time);
    renderer.info.reset();
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return api;
}
