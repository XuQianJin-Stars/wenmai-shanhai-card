// Audio (docs/audio/AUDIO_STYLE.md, SFX_LIST.md — web version). Everything is synthesised at run time:
//   UI: 木鱼 wood block, 磬 chime, paper rustle; cards: 灵将 war drum + leather, 符箓 brush-on-paper + dissipating air,
//   文脉 guqin pluck with a long tail (the "stays in play" signal from CORE_LOOP §十一); combat: whoosh, thud, ink;
//   bonds: 编钟 chord; resonance: element timbres; music: generative pentatonic guqin / 箫 / 堂鼓 per scene.
import { createEngine } from './engine.js';
import { renderQin, renderHarmonic, playBuffer, playXiao, playDrum, playGong, midiHz } from './instruments.js';

const SCALES = {                 // pentatonic modes as semitone sets above a tonic
  gong: [0, 2, 4, 7, 9],         // 宫
  shang: [0, 2, 5, 7, 10],       // 商
  yu: [0, 3, 5, 7, 10],          // 羽
  zhi: [0, 2, 5, 7, 9],          // 徵
};
const SCENE_MUSIC = {
  menu: { tonic: 50, mode: 'gong', bpm: 56, drums: 0, xiao: 0.5, harm: 0.3, density: 0.45 },
  kunlun: { tonic: 50, mode: 'yu', bpm: 62, drums: 0.25, xiao: 0.45, harm: 0.35, density: 0.5 },
  stage: { tonic: 52, mode: 'zhi', bpm: 84, drums: 0.8, xiao: 0.35, harm: 0.1, density: 0.6 },
  study: { tonic: 48, mode: 'gong', bpm: 50, drums: 0, xiao: 0.2, harm: 0.5, density: 0.35 },
  boss: { tonic: 45, mode: 'shang', bpm: 72, drums: 1, xiao: 0.3, harm: 0.1, density: 0.55 },
  victory: { tonic: 55, mode: 'gong', bpm: 70, drums: 0.3, xiao: 0.6, harm: 0.4, density: 0.6 },
  defeat: { tonic: 45, mode: 'yu', bpm: 44, drums: 0, xiao: 0.5, harm: 0.2, density: 0.3 },
  story: { tonic: 50, mode: 'yu', bpm: 48, drums: 0, xiao: 0.4, harm: 0.5, density: 0.3 },
  changan: { tonic: 53, mode: 'zhi', bpm: 76, drums: 0.45, xiao: 0.55, harm: 0.3, density: 0.6 },
  nishang: { tonic: 47, mode: 'yu', bpm: 60, drums: 0.7, xiao: 0.65, harm: 0.35, density: 0.45 },
  juexiang: { tonic: 43, mode: 'shang', bpm: 54, drums: 0.9, xiao: 0.4, harm: 0.25, density: 0.4 },
  // chapters 4–10: one key per scene, one per chapter boss
  jixia: { tonic: 50, mode: 'gong', bpm: 66, drums: 0.35, xiao: 0.4, harm: 0.4, density: 0.55 },
  chu: { tonic: 49, mode: 'yu', bpm: 58, drums: 0.3, xiao: 0.7, harm: 0.45, density: 0.45 },
  han: { tonic: 46, mode: 'shang', bpm: 70, drums: 0.75, xiao: 0.3, harm: 0.2, density: 0.5 },
  lanting: { tonic: 54, mode: 'zhi', bpm: 60, drums: 0.15, xiao: 0.5, harm: 0.5, density: 0.45 },
  dunhuang: { tonic: 51, mode: 'shang', bpm: 74, drums: 0.6, xiao: 0.6, harm: 0.3, density: 0.6 },
  jiangnan: { tonic: 53, mode: 'gong', bpm: 64, drums: 0.3, xiao: 0.45, harm: 0.45, density: 0.5 },
  tiangong: { tonic: 48, mode: 'yu', bpm: 56, drums: 0.4, xiao: 0.35, harm: 0.55, density: 0.4 },
  biantong: { tonic: 45, mode: 'shang', bpm: 78, drums: 0.9, xiao: 0.25, harm: 0.15, density: 0.6 },
  zhaohun: { tonic: 44, mode: 'yu', bpm: 52, drums: 0.7, xiao: 0.8, harm: 0.3, density: 0.4 },
  fenshu: { tonic: 42, mode: 'shang', bpm: 80, drums: 1, xiao: 0.2, harm: 0.1, density: 0.6 },
  qingtan: { tonic: 47, mode: 'zhi', bpm: 62, drums: 0.5, xiao: 0.55, harm: 0.35, density: 0.45 },
  liusha: { tonic: 43, mode: 'yu', bpm: 68, drums: 0.8, xiao: 0.5, harm: 0.2, density: 0.5 },
  jinhui: { tonic: 44, mode: 'shang', bpm: 72, drums: 0.85, xiao: 0.3, harm: 0.2, density: 0.55 },
  wangchuan: { tonic: 40, mode: 'yu', bpm: 48, drums: 0.9, xiao: 0.45, harm: 0.4, density: 0.35 },
  quanzhou: { tonic: 52, mode: 'zhi', bpm: 72, drums: 0.5, xiao: 0.6, harm: 0.35, density: 0.55 },
  cangshu: { tonic: 47, mode: 'gong', bpm: 52, drums: 0.1, xiao: 0.35, harm: 0.6, density: 0.35 },
  chenzhou: { tonic: 41, mode: 'yu', bpm: 58, drums: 0.85, xiao: 0.55, harm: 0.25, density: 0.45 },
  wuren: { tonic: 39, mode: 'gong', bpm: 44, drums: 0.5, xiao: 0.4, harm: 0.5, density: 0.3 },
};
const EL_PITCH = { metal: 74, wood: 67, water: 62, fire: 71, earth: 57 };

export function createAudio() {
  let E = null, ctx = null;
  let vol = { master: 0.8, music: 0.7, sfx: 0.9 };
  const qinCache = new Map();
  const music = { key: null, timer: null, next: 0, step: 0, phrase: [], intensity: 0 };

  function ensure() {
    if (E) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC({ latencyHint: 'interactive' });
    E = createEngine(ctx, { seed: 11, volume: vol.master });
    applyVol();
    return true;
  }
  function applyVol() {
    if (!E) return;
    E.setVolume(vol.master);
    E.setMusicLevel(0.9 * vol.music);
    E.buses.sfx.gain.value = vol.sfx;
    E.buses.ui.gain.value = 0.7 * vol.sfx;
  }
  const now = () => ctx.currentTime + 0.01;

  function qin(midi, dur = 3.5, vel = 0.7, opts = {}) {
    const key = `${midi}:${Math.round(dur)}:${opts.slide ?? 0}`;
    let b = qinCache.get(key);
    if (!b) {
      b = renderQin(ctx, { midi, dur, vel: 0.85, seed: midi * 7 + 3, path: opts.slide ? [[0, 0], [0.25, 0], [0.7, opts.slide]] : null,
        vib: opts.vib ? { rate: 5, depth: 0.25, start: 0.4, decay: 0.8 } : null });
      qinCache.set(key, b);
    }
    return b;
  }
  function bell(t, midi, { vel = 0.5, bus = 'sfx', dur = 3, rev = 0.5 } = {}) {
    const f = midiHz(midi), o = ctx.createGain();
    for (const [r, a, d] of [[1, 1, dur], [2.76, 0.45, dur * 0.5], [5.4, 0.25, dur * 0.3], [8.93, 0.12, dur * 0.2], [0.5, 0.2, dur * 0.8]]) {
      const os = ctx.createOscillator(); os.frequency.value = f * r;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * a * 0.3, t + 0.004); g.gain.setTargetAtTime(0, t + 0.01, d / 4);
      os.connect(g).connect(o); os.start(t); os.stop(t + d * 1.5); E.track(os, t + d * 1.5);
    }
    E.out(o, { bus, rev, echo: 0.1 });
  }
  function noiseHit(t, { f = 1200, q = 1, dur = 0.12, vel = 0.5, type = 'bandpass', bus = 'sfx', sweep = null, rev = 0.15, pan = 0 } = {}) {
    const n = E.noiseSrc(E.noise.white, t, dur + 0.05);
    const bp = ctx.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q;
    if (sweep) { bp.frequency.setValueAtTime(sweep[0], t); bp.frequency.exponentialRampToValueAtTime(sweep[1], t + dur); }
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + Math.min(0.01, dur * 0.2)); g.gain.setTargetAtTime(0, t + dur * 0.3, dur / 3);
    n.connect(bp).connect(g);
    E.out(g, { bus, rev, pan });
  }
  function tone(t, f, { dur = 0.2, vel = 0.3, type = 'sine', bus = 'sfx', glide = null, rev = 0.2 } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.005); g.gain.setTargetAtTime(0, t + dur * 0.3, dur / 3);
    o.connect(g); E.out(g, { bus, rev }); o.start(t); o.stop(t + dur * 2); E.track(o, t + dur * 2);
  }
  const woodblock = (t, pitch = 1, vel = 0.5) => { tone(t, 780 * pitch, { dur: 0.06, vel: vel * 0.6, type: 'triangle', bus: 'ui', rev: 0.1 }); noiseHit(t, { f: 2400 * pitch, q: 4, dur: 0.03, vel: vel * 0.4, bus: 'ui' }); };

  const SFX = {
    hover: (t) => noiseHit(t, { f: 4000, q: 2, dur: 0.05, vel: 0.08, bus: 'ui', rev: 0 }),
    click: (t) => woodblock(t, 1, 0.5),
    back: (t) => woodblock(t, 0.8, 0.4),
    error: (t) => { woodblock(t, 0.6, 0.5); woodblock(t + 0.09, 0.55, 0.4); },
    draw: (t) => noiseHit(t, { f: 3000, q: 0.7, dur: 0.16, vel: 0.22, sweep: [1800, 5200], bus: 'ui' }),
    pick: (t) => noiseHit(t, { f: 2600, q: 1, dur: 0.08, vel: 0.15, bus: 'ui' }),
    playGeneral: (t) => { playDrum(E, { t, vel: 0.9, big: true, bus: 'sfx', rev: 0.3 }); noiseHit(t + 0.01, { f: 500, q: 0.8, dur: 0.18, vel: 0.35, type: 'lowpass' }); E.punch(t, 4); },
    playTalisman: (t) => { noiseHit(t, { f: 1800, q: 0.6, dur: 0.35, vel: 0.3, sweep: [900, 3800] }); noiseHit(t + 0.3, { f: 6000, q: 0.5, dur: 0.6, vel: 0.12, sweep: [6000, 12000], rev: 0.5 }); },
    playWenmai: (t) => { playBuffer(E, qin(55, 5), t, { gain: 0.9, bus: 'sfx', rev: 0.5 }); playBuffer(E, renderHarmonic(ctx, { midi: 79, dur: 4 }), t + 0.05, { gain: 0.5, bus: 'sfx', rev: 0.6 }); },
    attack: (t) => noiseHit(t, { f: 900, q: 0.9, dur: 0.22, vel: 0.35, sweep: [500, 2600], rev: 0.1 }),
    hit: (t, o = {}) => { playDrum(E, { t, vel: 0.6 + (o.heavy ? 0.3 : 0), bus: 'sfx', rev: 0.15, pitch: o.heavy ? 0.8 : 1.1 }); noiseHit(t, { f: 700, q: 1.2, dur: 0.1, vel: 0.4 }); if (o.heavy) E.punch(t, 6); },
    counter: (t) => { tone(t, 1400, { dur: 0.12, vel: 0.2, type: 'square', glide: 900 }); },
    die: (t) => { playGong(E, { t, vel: 0.35, bus: 'sfx', rev: 0.4 }); noiseHit(t + 0.1, { f: 400, q: 0.5, dur: 1.2, vel: 0.2, type: 'lowpass', sweep: [1200, 200], rev: 0.6 }); },
    heal: (t) => { bell(t, 81, { vel: 0.35, dur: 2 }); bell(t + 0.08, 88, { vel: 0.25, dur: 2 }); },
    buff: (t) => { [74, 79, 83].forEach((m, i) => bell(t + i * 0.06, m, { vel: 0.25, dur: 1.5 })); },
    debuff: (t) => { tone(t, 330, { dur: 0.5, vel: 0.2, type: 'triangle', glide: 180, rev: 0.4 }); },
    stun: (t) => { noiseHit(t, { f: 800, q: 2, dur: 0.6, vel: 0.25, sweep: [2000, 300], rev: 0.5 }); tone(t, 220, { dur: 0.6, vel: 0.15, glide: 110 }); },
    burn: (t) => { for (let i = 0; i < 8; i++) noiseHit(t + i * 0.06 + Math.random() * 0.03, { f: 2000 + Math.random() * 3000, q: 3, dur: 0.04, vel: 0.2 }); noiseHit(t, { f: 600, q: 0.5, dur: 0.8, vel: 0.3, type: 'lowpass', sweep: [300, 1500] }); },
    thunder: (t) => { noiseHit(t, { f: 3000, q: 0.3, dur: 0.1, vel: 0.7, type: 'highpass' }); noiseHit(t + 0.05, { f: 200, q: 0.4, dur: 1.8, vel: 0.8, type: 'lowpass', sweep: [600, 60], rev: 0.6 }); E.punch(t, 8); },
    mist: (t) => noiseHit(t, { f: 400, q: 0.6, dur: 0.9, vel: 0.3, type: 'lowpass', sweep: [200, 900], rev: 0.5 }),
    bond: (t) => { [62, 69, 74, 78].forEach((m, i) => bell(t + i * 0.12, m, { vel: 0.5, dur: 4, rev: 0.7 })); playGong(E, { t: t + 0.5, vel: 0.2, bus: 'sfx', rev: 0.6 }); },
    resonance: (t, o = {}) => { const m = EL_PITCH[o.el] ?? 67; bell(t, m, { vel: 0.45, dur: 3.5, rev: 0.7 }); bell(t + 0.18, m + 7, { vel: 0.3, dur: 3, rev: 0.7 }); playBuffer(E, renderHarmonic(ctx, { midi: m + 12, dur: 4 }), t + 0.3, { gain: 0.6, bus: 'sfx', rev: 0.7 }); },
    turn: (t, o = {}) => { if (o.mine) { woodblock(t, 1.2, 0.6); bell(t + 0.05, 86, { vel: 0.3, dur: 1.5, bus: 'ui' }); } else woodblock(t, 0.9, 0.4); },
    mana: (t) => bell(t, 93, { vel: 0.18, dur: 1 }),
    dialog: (t) => noiseHit(t, { f: 2800, q: 0.8, dur: 0.12, vel: 0.12, sweep: [2000, 4000], bus: 'ui' }),
    upgrade: (t) => { [67, 71, 74, 79, 83].forEach((m, i) => bell(t + i * 0.08, m, { vel: 0.35, dur: 2.5 })); },
    victory: (t) => { playGong(E, { t, vel: 0.5, bus: 'sfx', rev: 0.5 }); [62, 66, 69, 74].forEach((m, i) => bell(t + 0.3 + i * 0.15, m, { vel: 0.45, dur: 4 })); },
    defeat: (t) => { playGong(E, { t, vel: 0.4, bus: 'sfx', rev: 0.6 }); playBuffer(E, qin(45, 6, 0.8, { slide: -2 }), t + 0.4, { gain: 1, bus: 'sfx', rev: 0.6 }); },
    poem: (t) => { [62, 64, 67, 69, 74].forEach((m, i) => playBuffer(E, qin(m, 3), t + i * 0.11, { gain: 0.5, bus: 'sfx', rev: 0.55, pan: (i - 2) * 0.15 })); },
    snap: (t) => { playBuffer(E, qin(57, 3, 0.8, { slide: -3 }), t, { gain: 0.9, bus: 'sfx', rev: 0.6 }); tone(t + 0.02, 1900, { dur: 0.08, vel: 0.25, type: 'square', glide: 600 }); },
    shuffle: (t) => { for (let i = 0; i < 6; i++) noiseHit(t + i * 0.05, { f: 3200, q: 0.8, dur: 0.05, vel: 0.12, bus: 'ui' }); },
  };

  // ── generative music ──
  function scheduleMusic() {
    const M = SCENE_MUSIC[music.key];
    if (!M || !E) return;
    const beat = 60 / M.bpm;
    const scale = SCALES[M.mode];
    const note = (deg, oct = 0) => M.tonic + scale[((deg % 5) + 5) % 5] + 12 * (Math.floor(deg / 5) + oct);
    while (music.next < ctx.currentTime + 1.5) {
      const t = music.next, s = music.step++;
      const bar = Math.floor(s / 8), inBar = s % 8;
      const dens = M.density + music.intensity * 0.15;
      // phrase: a slow walking line on the guqin (the melody), re-drawn every 4 bars
      if (s % 32 === 0) {
        music.phrase = [];
        let d = 5 + Math.floor(Math.random() * 3);
        for (let k = 0; k < 8; k++) { d += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]; d = Math.max(2, Math.min(10, d)); music.phrase.push(d); }
      }
      if (inBar % 2 === 0 && Math.random() < dens) {
        const d = music.phrase[(Math.floor(s / 2)) % 8];
        const slide = Math.random() < 0.18 ? (Math.random() < 0.5 ? -2 : 2) : 0;
        playBuffer(E, qin(note(d), 4, 0.7, { slide, vib: Math.random() < 0.3 }), t, { gain: 0.55, bus: 'music', rev: 0.45, pan: (Math.random() - 0.5) * 0.4 });
      }
      if (inBar === 0) playBuffer(E, qin(note(0, -1), 6), t, { gain: 0.45, bus: 'music', rev: 0.5 });   // low drone string
      if (M.harm && Math.random() < M.harm * 0.2) playBuffer(E, renderHarmonic(ctx, { midi: note(5 + Math.floor(Math.random() * 5), 1), dur: 4, seed: s }), t, { gain: 0.35, bus: 'music', rev: 0.6, pan: 0.3 });
      if (M.xiao && s % 16 === 4 && Math.random() < M.xiao) playXiao(E, { t, midi: note(music.phrase[3] ?? 7, 1), dur: beat * 5, vel: 0.5, bus: 'music', rev: 0.6 });
      const dr = M.drums * (0.6 + music.intensity * 0.6);
      if (dr > 0) {
        if (inBar === 0 && Math.random() < dr) playDrum(E, { t, vel: 0.45 * dr, bus: 'music', big: true, rev: 0.3 });
        if (inBar === 4 && Math.random() < dr * 0.7) playDrum(E, { t, vel: 0.3 * dr, bus: 'music', rev: 0.3 });
        if ((inBar === 6 || inBar === 7) && Math.random() < dr * 0.4) playDrum(E, { t, vel: 0.25, tone: 1, bus: 'music' });
        if (bar % 8 === 7 && inBar === 7 && Math.random() < dr * 0.5) playGong(E, { t, vel: 0.15, bus: 'music' });
      }
      music.next += beat / 2;
    }
  }

  return {
    unlock() { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); },
    get ready() { return !!E && ctx.state === 'running'; },
    sfx(name, o = {}) {
      if (!E || ctx.state !== 'running') return;
      if (E.voices() > 90 && !['bond', 'victory', 'defeat'].includes(name)) return;
      try { SFX[name]?.(now() + (o.delay ?? 0), o); } catch (e) { console.warn('sfx', name, e); }
    },
    music(key) {
      if (!ensure()) return;
      if (music.key === key) return;
      music.key = key;
      if (!music.timer) music.timer = setInterval(() => { if (ctx.state === 'running') scheduleMusic(); }, 250);
      music.next = Math.max(music.next, ctx.currentTime + 0.3);
      music.step = 0;
      if (key) E.duck(9, ctx.currentTime, 1.5);
    },
    intensity(k) { music.intensity = Math.max(0, Math.min(1, k)); },
    setVolume(v) { vol = { ...vol, ...v }; applyVol(); },
    get volume() { return { ...vol }; },
    muffle(k) { E?.setMuffle(k); },
  };
}
