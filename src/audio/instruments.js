// Synthesised Chinese instruments. Adapted from Long Wind (MIT).
//
// 古琴 guqin — Karplus–Strong string rendered in JS into an AudioBuffer (24 kHz: the string has little above 10 kHz),
//   with a fractional delay that follows a pitch path, so a note can slide (上/下), wobble (吟/猱) or walk to the next
//   pitch without a new pluck (走手音). Finger friction on silk adds a faint squeak while sliding. Excitation is a
//   one-period noise burst with a pluck-position comb. Harmonics (泛音) are additive glassy partials.
//   A shared body filter (two resonances + air lowpass) is applied once on the music bus by music.js.
// 箫 xiao — real-time nodes: soft periodic wave + breath noise band tracking the pitch, scooped onset, delayed vibrato.
// 堂鼓 tanggu — pitch-dropping membrane with inharmonic overtones and a stick transient; rim clicks.
// 锣 gong — inharmonic partials with the Chinese opera gong's downward glide.
import { mulberry32 } from '../rules/rng.js';

export const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const QIN_SR = 24000;

/**
 * Render one guqin note. path: [[t, semitoneOffset], ...] keyframes (cosine-eased between), relative to `midi`.
 * vib: { rate, depth (semitones), start, decay } for 吟/猱. Returns an AudioBuffer (mono).
 */
export function renderQin(ctx, { midi = 50, dur = 4, vel = 0.8, path = null, vib = null, bright = 0.5, pluckPos = 0.16, t60 = null, seed = 1, squeak = 0.5 } = {}) {
  const sr = QIN_SR, n = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, n, sr);
  const out = buf.getChannelData(0);
  const rng = mulberry32(seed * 2654435761 >>> 0);
  const f0 = midiHz(midi);
  const minHz = f0 * Math.pow(2, -7 / 12) * 0.98;          // allow slides down to a fifth below
  const L = Math.ceil(sr / minHz) + 8;
  const line = new Float32Array(L);
  let w = 0;
  // decay: low strings ring for ages, high ones less
  const T60 = t60 ?? Math.max(1.6, 7.5 - (midi - 36) * 0.14);
  // excitation: one period of lowpassed noise with a pluck-position comb, + a small thump
  const P0 = sr / f0, exLen = Math.floor(P0);
  const ex = new Float32Array(exLen + 2);
  let lp = 0;
  const lpa = 0.25 + 0.6 * bright;
  for (let i = 0; i < exLen; i++) { lp += lpa * ((rng() * 2 - 1) - lp); ex[i] = lp; }
  const cb = Math.max(1, Math.round(exLen * pluckPos));
  for (let i = exLen - 1; i >= cb; i--) ex[i] -= ex[i - cb];
  let mean = 0; for (let i = 0; i < exLen; i++) mean += ex[i]; mean /= exLen;
  for (let i = 0; i < exLen; i++) ex[i] = (ex[i] - mean) * vel * 0.9;

  const S = 0.5 - 0.35 * bright;             // loop filter: 0.5 = classic average (dark), lower = brighter
  let prevSemi = path ? path[0][1] : 0, sq = 0, sqLP = 0, dc = 0, dcIn = 0;
  const semiAt = (t) => {
    let s = 0;
    if (path) {
      if (t <= path[0][0]) s = path[0][1];
      else if (t >= path[path.length - 1][0]) s = path[path.length - 1][1];
      else for (let k = 0; k < path.length - 1; k++) {
        const [ta, sa] = path[k], [tb, sb] = path[k + 1];
        if (t >= ta && t < tb) { const u = (t - ta) / (tb - ta); s = sa + (sb - sa) * (0.5 - 0.5 * Math.cos(Math.PI * u)); break; }
      }
    }
    if (vib && t > vib.start) {
      const a = vib.depth * Math.min(1, (t - vib.start) / 0.25) * Math.exp(-(t - vib.start) * (vib.decay ?? 0.6));
      s += a * Math.sin(2 * Math.PI * vib.rate * (t - vib.start));
    }
    return s;
  };
  let semi = semiAt(0), gLoop = 0, per = P0;
  for (let i = 0; i < n; i++) {
    if ((i & 15) === 0) {                     // update the pitch path every 16 samples (0.7 ms)
      const t = i / sr;
      semi = semiAt(t);
      const f = f0 * Math.pow(2, semi / 12);
      per = sr / f - S;                        // compensate the loop filter delay
      gLoop = Math.pow(0.001, 1 / (f * T60));
      const ds = Math.abs(semi - prevSemi) * sr / 16;   // semitones per second
      prevSemi = semi;
      sq = Math.min(1, ds / 12) * squeak;
    }
    // fractional read at w - per
    let rp = w - per; if (rp < 0) rp += L;
    const i0 = Math.floor(rp), fr = rp - i0, i1 = (i0 + 1) % L, im = (i0 - 1 + L) % L;
    const a = line[i0] + (line[i1] - line[i0]) * fr;   // y[n - per]
    const b = line[im] + (line[i0] - line[im]) * fr;   // y[n - per - 1]
    let y = gLoop * ((1 - S) * a + S * b);
    if (i < exLen) y += ex[i];
    line[w] = y;
    w = (w + 1) % L;
    // silk squeak: band-limited noise gated by slide speed and the string's current energy
    let v = y;
    if (sq > 0.001) { sqLP += 0.35 * ((rng() * 2 - 1) - sqLP); v += (rng() * 2 - 1 - sqLP) * sq * 0.05 * Math.min(1, Math.abs(y) * 6 + 0.2); }
    // DC blocker
    dc = v - dcIn + 0.995 * dc; dcIn = v;
    out[i] = dc;
  }
  // soft onset (1.5 ms) and tail fade
  const a0 = Math.floor(sr * 0.0015); for (let i = 0; i < a0; i++) out[i] *= i / a0;
  const fz = Math.floor(sr * 0.25); for (let i = Math.max(0, n - fz); i < n; i++) out[i] *= (n - i) / fz;
  return buf;
}

/** Guqin harmonic (泛音): glassy, nearly pure; partials slightly stretched. Returns a mono AudioBuffer. */
export function renderHarmonic(ctx, { midi = 74, dur = 4, vel = 0.7, seed = 1 } = {}) {
  const sr = QIN_SR, n = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const rng = mulberry32(seed * 7 + 3);
  const f = midiHz(midi);
  const parts = [[1, 1, 3.2], [2.003, 0.22, 1.4], [3.01, 0.08, 0.8], [0.5, 0.05, 2.0]];
  for (const [r, amp, t60] of parts) {
    const fr = f * r * (1 + (rng() - 0.5) * 0.0008);
    if (fr > sr * 0.45) continue;
    const k = -6.9 / t60, ph = rng() * 6.28, w = 2 * Math.PI * fr / sr;
    for (let i = 0; i < n; i++) d[i] += amp * Math.sin(w * i + ph) * Math.exp(k * i / sr);
  }
  const att = Math.floor(sr * 0.004);
  for (let i = 0; i < n; i++) d[i] *= vel * 0.32 * (i < att ? i / att : 1);
  const fz = Math.floor(sr * 0.2); for (let i = Math.max(0, n - fz); i < n; i++) d[i] *= (n - i) / fz;
  return buf;
}

/** Play a rendered buffer at time t through E.out. */
export function playBuffer(E, buf, t, { gain = 1, pan = 0, rev = 0.3, echo = 0, bus = 'music', rate = 1, dest = null } = {}) {
  const s = E.ctx.createBufferSource();
  s.buffer = buf; s.playbackRate.value = rate;
  if (dest) {
    const g = E.ctx.createGain(); g.gain.value = gain;
    if (pan) { const p = E.ctx.createStereoPanner(); p.pan.value = pan; s.connect(p).connect(g); } else s.connect(g);
    g.connect(dest);
  } else E.out(s, { bus, gain, pan, rev, echo });
  s.start(t);
  E.track(s, t + buf.duration);
  return s;
}

const xiaoWaves = new WeakMap(); // PeriodicWave belongs to one context (live and offline differ)
/** 箫: breathy vertical bamboo flute. */
export function playXiao(E, { t, midi = 74, dur = 2.5, vel = 0.6, pan = 0.1, scoop = 0.45, vibDepth = 0.18, dest = null, bus = 'music', rev = 0.55 } = {}) {
  const { ctx } = E;
  let xiaoWave = xiaoWaves.get(ctx);
  if (!xiaoWave) {
    const re = new Float32Array([0, 1, 0.22, 0.1, 0.045, 0.025, 0.012]), im = new Float32Array(re.length);
    xiaoWave = ctx.createPeriodicWave(re, im);
    xiaoWaves.set(ctx, xiaoWave);
  }
  const f = midiHz(midi);
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(xiaoWave);
  osc.frequency.setValueAtTime(f * Math.pow(2, -scoop / 12), t);
  osc.frequency.exponentialRampToValueAtTime(f, t + 0.16);
  // delayed vibrato
  const lfo = ctx.createOscillator(); lfo.frequency.value = 4.6 + E.rng() * 0.8;
  const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, t);
  lfoG.gain.linearRampToValueAtTime(0, t + Math.min(0.5, dur * 0.3));
  lfoG.gain.linearRampToValueAtTime(f * (Math.pow(2, vibDepth / 12) - 1), t + Math.min(1.2, dur * 0.7));
  lfo.connect(lfoG).connect(osc.frequency);
  // amplitude: slow breath onset, gentle swell, soft release
  const amp = ctx.createGain(); amp.gain.value = 0;
  const att = Math.min(0.22, dur * 0.25), rel = Math.min(0.45, dur * 0.35);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(vel * 0.16, t + att);
  amp.gain.linearRampToValueAtTime(vel * 0.2, t + dur * 0.6);
  amp.gain.setTargetAtTime(0, t + dur - rel, rel / 3);
  // breath: noise band around the pitch + a little air on top
  const nz = E.noiseSrc(E.noise.white, t, dur + 0.3);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 4;
  const air = ctx.createBiquadFilter(); air.type = 'highpass'; air.frequency.value = 3500;
  const bG = ctx.createGain(); bG.gain.setValueAtTime(0, t);
  bG.gain.linearRampToValueAtTime(vel * 0.09, t + att * 0.6);
  bG.gain.linearRampToValueAtTime(vel * 0.035, t + att + 0.2);
  bG.gain.setTargetAtTime(0, t + dur - rel, rel / 3);
  const aG = ctx.createGain(); aG.gain.setValueAtTime(0, t);
  aG.gain.linearRampToValueAtTime(vel * 0.018, t + att);
  aG.gain.setTargetAtTime(0, t + dur - rel, rel / 3);
  nz.connect(bp).connect(bG); nz.connect(air).connect(aG);
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3200; tone.Q.value = 0.4;
  osc.connect(amp).connect(tone);
  bG.connect(tone); aG.connect(tone);
  if (dest) {
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; tone.connect(p).connect(dest); } else tone.connect(dest);
  } else E.out(tone, { bus, pan, gain: 1, rev, echo: 0.12 });
  osc.start(t); lfo.start(t);
  osc.stop(t + dur + 0.6); lfo.stop(t + dur + 0.6);
  E.track(osc, t + dur + 0.6);
}

/** 堂鼓 tanggu drum. tone 0 = centre (deep), 1 = rim click. */
export function playDrum(E, { t, vel = 0.8, tone = 0, pitch = 1, pan = 0, dest = null, bus = 'music', rev = 0.28, big = false } = {}) {
  const { ctx } = E;
  const o = ctx.createGain();
  if (tone < 0.5) {
    const f0 = (big ? 82 : 98) * pitch, f1 = (big ? 44 : 55) * pitch, dec = big ? 0.75 : 0.42;
    const body = ctx.createOscillator(); body.type = 'sine';
    body.frequency.setValueAtTime(f0, t); body.frequency.exponentialRampToValueAtTime(f1, t + 0.22);
    const bg = ctx.createGain(); bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(vel, t + 0.003); bg.gain.setTargetAtTime(0, t + 0.01, dec / 3);
    body.connect(bg).connect(o);
    for (const [r, a, d] of [[1.59, 0.35, 0.16], [2.14, 0.22, 0.1], [2.65, 0.12, 0.07]]) {
      const ov = ctx.createOscillator(); ov.frequency.setValueAtTime(f0 * r, t); ov.frequency.exponentialRampToValueAtTime(f1 * r * 1.08, t + 0.2);
      const og = ctx.createGain(); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(vel * a, t + 0.002); og.gain.setTargetAtTime(0, t + 0.004, d / 3);
      ov.connect(og).connect(o); ov.start(t); ov.stop(t + d * 2 + 0.1);
    }
    const nz = E.noiseSrc(E.noise.white, t, 0.08);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vel * 0.35, t); ng.gain.setTargetAtTime(0, t + 0.002, 0.012);
    nz.connect(lp).connect(ng).connect(o);
    body.start(t); body.stop(t + dec * 2.5 + 0.1);
    E.track(body, t + dec * 2.5);
  } else {
    const nz = E.noiseSrc(E.noise.white, t, 0.06);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 * pitch; bp.Q.value = 2.2;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vel * 0.5, t); ng.gain.setTargetAtTime(0, t + 0.001, 0.012);
    nz.connect(bp).connect(ng).connect(o);
    const k = ctx.createOscillator(); k.frequency.value = 820 * pitch;
    const kg = ctx.createGain(); kg.gain.setValueAtTime(vel * 0.25, t); kg.gain.setTargetAtTime(0, t + 0.001, 0.018);
    k.connect(kg).connect(o); k.start(t); k.stop(t + 0.15);
  }
  if (dest) {
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; o.connect(p).connect(dest); } else o.connect(dest);
  } else E.out(o, { bus, pan, rev });
}

/** 锣 gong (opera 大锣): inharmonic partials gliding down, shimmering noise. */
export function playGong(E, { t, vel = 0.7, pan = 0, bus = 'music', rev = 0.45, dest = null } = {}) {
  const { ctx } = E;
  const o = ctx.createGain();
  const base = 180;
  for (const [r, a, d] of [[1, 1, 3.5], [1.47, 0.6, 2.6], [2.09, 0.45, 2.0], [2.56, 0.3, 1.6], [3.3, 0.22, 1.2], [4.18, 0.14, 0.9]]) {
    const os = ctx.createOscillator();
    os.frequency.setValueAtTime(base * r, t);
    os.frequency.exponentialRampToValueAtTime(base * r * 0.93, t + 1.6);   // the downward "wang" glide
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a * 0.22, t + 0.012); g.gain.setTargetAtTime(0, t + 0.05, d / 3);
    os.connect(g).connect(o); os.start(t); os.stop(t + d * 2.5);
  }
  const nz = E.noiseSrc(E.noise.white, t, 1.6);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8;
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(vel * 0.08, t + 0.01); ng.gain.setTargetAtTime(0, t + 0.05, 0.35);
  nz.connect(bp).connect(ng).connect(o);
  if (dest) o.connect(dest); else E.out(o, { bus, pan, rev, echo: 0.15 });
}
