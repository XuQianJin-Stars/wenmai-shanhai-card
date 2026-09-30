// Audio engine core: noise buffers, the master chain and the shared spaces. Works with a live AudioContext or an
// OfflineAudioContext (every scheduling call takes an explicit time), so the same graph can be rendered to WAV.
//
//   voices ─┬─► bus (music ─► muffle | sfx ─► duck ─► world | amb ─► world | ui) ─► sum ─► glue ─► makeup ─► limiter ─► master
//           │   (world = sfx + amb ─► slow-mo lowpass)
//           ├─► reverb send ─► pre-delay ─► HP 160 Hz ─► Convolver (generated valley IR) ─► sum
//           └─► echo send ─► two cross-fed delays (0.41 / 0.58 s, LP in the loop) ─► sum   ("the far ridge answers")
//
// Adapted from Long Wind (MIT, https://github.com/jbang2004/long-wind).
//   const E = createEngine(ctx, { seed })
//   E.ctx, E.sr, E.buses.{music,sfx,amb,ui}, E.reverb (send input), E.echo (send input), E.noise.{white,pink,brown}
//   E.out(node, { bus = 'sfx', pan = 0, gain = 1, rev = 0, echo = 0, t }) → the gain node node was routed into
//   E.env(param, t, points)    — schedule [[dt, value, 'lin'|'exp'|'set'|'tgt', tau?], ...] relative to t
//   E.noiseSrc(buf, t, dur, { loop, rate }) → AudioBufferSourceNode started at a random offset
//   E.setVolume(v, t), E.setMuffle(k, t) (0 clear … 1 muffled, for pause), E.setSlowmo(k, t) (0 … 1: world lowpass +
//   longer reverb while game time is slowed), E.duck(db, t, release) (music only)
//   E.punch(t, db, release) — transient duck of music + ambience under an impact; E.shaper(drive) → tanh WaveShaper
//   E.voices() → active one-shot count (for voice limiting); E.track(node, endTime) registers a one-shot
import { mulberry32 } from '../rules/rng.js';
import { makeIR } from './ir.js';

function makeNoise(ctx, seconds, kind, channels, seed) {
  const sr = ctx.sampleRate, n = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(channels, n, sr);
  for (let c = 0; c < channels; c++) {
    const d = buf.getChannelData(c), rng = mulberry32(seed + c * 7919);
    if (kind === 'white') { for (let i = 0; i < n; i++) d[i] = rng() * 2 - 1; }
    else if (kind === 'pink') {
      // Paul Kellet's refined pink filter
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = rng() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    } else { // brown
      let last = 0;
      for (let i = 0; i < n; i++) { last = (last + 0.02 * (rng() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    }
    // seamless loop: crossfade the last 50 ms into the start
    const x = Math.floor(0.05 * sr);
    for (let i = 0; i < x; i++) { const k = i / x; d[i] = d[i] * k + d[n - x + i] * (1 - k); }
    for (let i = n - x; i < n; i++) d[i] = d[i - (n - x)];
  }
  return buf;
}

export function createEngine(ctx, { seed = 7, volume = 0.8 } = {}) {
  const sr = ctx.sampleRate;
  const rng = mulberry32(seed * 131 + 1);
  const noise = {
    white: makeNoise(ctx, 3, 'white', 1, seed + 1),
    pink: makeNoise(ctx, 9, 'pink', 2, seed + 11),
    brown: makeNoise(ctx, 5, 'brown', 1, seed + 23),
  };

  // ---- master chain ----
  const sum = ctx.createGain();
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -20; glue.knee.value = 12; glue.ratio.value = 2.6; glue.attack.value = 0.008; glue.release.value = 0.25;
  const makeup = ctx.createGain(); makeup.gain.value = 1.45;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.0015; limiter.release.value = 0.09;
  const master = ctx.createGain(); master.gain.value = volume;
  const dcBlock = ctx.createBiquadFilter(); dcBlock.type = 'highpass'; dcBlock.frequency.value = 22; dcBlock.Q.value = 0.6;
  sum.connect(dcBlock).connect(glue).connect(makeup).connect(limiter).connect(master).connect(ctx.destination);

  // ---- buses (music gets a muffle filter for pause) ----
  const buses = {};
  for (const name of ['music', 'sfx', 'amb', 'ui']) { buses[name] = ctx.createGain(); }
  const muffle = ctx.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000; muffle.Q.value = 0.5;
  const duckG = ctx.createGain();
  // the "world" (sfx + ambience) shares one lowpass that closes in slow-motion: time thickens, the air goes dull
  const world = ctx.createGain();
  const slowLP = ctx.createBiquadFilter(); slowLP.type = 'lowpass'; slowLP.frequency.value = 20000; slowLP.Q.value = 0.6;
  world.connect(slowLP).connect(sum);
  // transient punch: every heavy impact briefly pulls the music and the wind down so the blow owns the moment
  const punchMusic = ctx.createGain(), punchAmb = ctx.createGain();
  buses.music.connect(muffle).connect(punchMusic).connect(sum);
  buses.sfx.connect(duckG).connect(world);
  buses.amb.connect(punchAmb).connect(world);
  buses.ui.connect(sum);
  buses.music.gain.value = 0.9; buses.sfx.gain.value = 1; buses.amb.gain.value = 0.85; buses.ui.gain.value = 0.7;

  // ---- reverb: generated IR of a wide valley (dark, 4 s) ----
  const reverb = ctx.createGain();
  const pre = ctx.createDelay(0.2); pre.delayTime.value = 0.028;
  const revHP = ctx.createBiquadFilter(); revHP.type = 'highpass'; revHP.frequency.value = 160;
  const conv = ctx.createConvolver();
  conv.buffer = makeIR(ctx, { seconds: 4.2, rt60: 3.4, seed: seed + 5 });
  const revOut = ctx.createGain(); revOut.gain.value = 0.9;
  reverb.connect(pre).connect(revHP).connect(conv).connect(revOut).connect(sum);

  // ---- valley echo: cross-fed stereo delays with a darkening loop ----
  const echo = ctx.createGain();
  const eL = ctx.createDelay(1.5), eR = ctx.createDelay(1.5);
  eL.delayTime.value = 0.41; eR.delayTime.value = 0.58;
  const eLP = ctx.createBiquadFilter(); eLP.type = 'lowpass'; eLP.frequency.value = 2400;
  const eHP = ctx.createBiquadFilter(); eHP.type = 'highpass'; eHP.frequency.value = 300;
  const fbL = ctx.createGain(), fbR = ctx.createGain(); fbL.gain.value = 0.32; fbR.gain.value = 0.32;
  const merge = ctx.createChannelMerger(2);
  echo.connect(eHP).connect(eLP);
  eLP.connect(eL); eL.connect(fbL).connect(eR); eR.connect(fbR).connect(eL);
  eL.connect(merge, 0, 0); eR.connect(merge, 0, 1);
  const echoOut = ctx.createGain(); echoOut.gain.value = 0.55;
  merge.connect(echoOut).connect(sum);

  let musicBase = 0.9;
  // ---- helpers ----
  let active = 0;
  function track(src, end) {
    active++;
    src.onended = () => { active--; };
    return src;
  }
  function out(node, { bus = 'sfx', pan = 0, gain = 1, rev = 0, echo: ec = 0 } = {}) {
    const g = ctx.createGain(); g.gain.value = gain;
    let tail = node;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); tail = p; }
    tail.connect(g);
    g.connect(buses[bus] ?? buses.sfx);
    if (rev > 0) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s).connect(reverb); }
    if (ec > 0) { const s = ctx.createGain(); s.gain.value = ec; g.connect(s).connect(echo); }
    return g;
  }
  // points: [[dt, value, mode, tau]] ; mode 'set' | 'lin' | 'exp' | 'tgt'
  function env(param, t, points) {
    for (const [dt, v, mode = 'lin', tau = 0.1] of points) {
      const at = t + dt;
      if (mode === 'set') param.setValueAtTime(v, at);
      else if (mode === 'exp') param.exponentialRampToValueAtTime(Math.max(v, 1e-5), at);
      else if (mode === 'tgt') param.setTargetAtTime(v, at, tau);
      else param.linearRampToValueAtTime(v, at);
    }
    return param;
  }
  function noiseSrc(buf, t, dur, { loop = false, rate = 1 } = {}) {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = loop; s.playbackRate.value = rate;
    const off = rng() * Math.max(0, buf.duration - (loop ? 0 : dur) - 0.01);
    s.start(t, off);
    if (dur !== Infinity) s.stop(t + dur + 0.02);
    return track(s, t + dur);
  }
  function setVolume(v, t = ctx.currentTime) { master.gain.setTargetAtTime(Math.max(0, Math.min(1.5, v)), t, 0.08); }
  function setMuffle(k, t = ctx.currentTime) {
    muffle.frequency.setTargetAtTime(k > 0 ? 20000 * Math.pow(600 / 20000, k) : 20000, t, 0.25);
    buses.music.gain.setTargetAtTime(musicBase * (1 - 0.45 * k), t, 0.25);
    buses.amb.gain.setTargetAtTime(0.85 * (1 - 0.35 * k), t, 0.3);
    duckG.gain.setTargetAtTime(1 - 0.6 * k, t, 0.2);
  }
  let slowK = 0;
  function setSlowmo(k, t = ctx.currentTime) {
    k = Math.max(0, Math.min(1, k));
    if (Math.abs(k - slowK) < 0.01) return;
    slowK = k;
    slowLP.frequency.setTargetAtTime(20000 * Math.pow(1100 / 20000, k), t, 0.08);
    revOut.gain.setTargetAtTime(0.9 + 0.9 * k, t, 0.15);
  }
  function duck(db, t = ctx.currentTime, release = 0.6) {
    const g = Math.pow(10, -Math.abs(db) / 20);
    buses.music.gain.cancelScheduledValues(t);
    buses.music.gain.setTargetAtTime(musicBase * g, t, 0.01);
    buses.music.gain.setTargetAtTime(musicBase, t + 0.05, release / 3);
  }

  function punch(t = ctx.currentTime, db = 6, release = 0.25) {
    const g = Math.pow(10, -Math.abs(db) / 20);
    for (const n of [punchMusic.gain, punchAmb.gain]) {
      n.cancelScheduledValues(t);
      n.setTargetAtTime(g, t, 0.004);
      n.setTargetAtTime(1, t + 0.03, release / 3);
    }
  }
  // saturation: tanh curves cached by drive (a WaveShaper per voice, the curve shared)
  const curves = new Map();
  function shaper(drive = 2) {
    const key = Math.round(drive * 10);
    let c = curves.get(key);
    if (!c) {
      c = new Float32Array(1024);
      const d = key / 10, nrm = Math.tanh(d);
      for (let i = 0; i < c.length; i++) { const x = (i / (c.length - 1)) * 2 - 1; c[i] = Math.tanh(x * d) / nrm; }
      curves.set(key, c);
    }
    const w = ctx.createWaveShaper(); w.curve = c; w.oversample = '2x';
    return w;
  }

  return {
    ctx, sr, rng, noise, buses, reverb, echo, master, sum, limiter,
    out, env, noiseSrc, track, setVolume, setMuffle, setSlowmo, duck, punch, shaper,
    voices: () => active,
    setMusicLevel(v) { musicBase = v; buses.music.gain.setTargetAtTime(v, ctx.currentTime, 0.1); },
  };
}
