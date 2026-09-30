// Generated reverb impulse response: a wide grass valley under open sky. No walls, so the early field is sparse and
// soft (ground bounce, a few distant slopes), and the tail darkens quickly because high frequencies die in the air
// and the grass. Stereo channels are decorrelated. Adapted from Long Wind (MIT).
import { mulberry32 } from '../rules/rng.js';

export function makeIR(ctx, { seconds = 4, rt60 = 3.2, seed = 3, bright = 8500, dark = 700, early = 10 } = {}) {
  const sr = ctx.sampleRate, n = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c), rng = mulberry32(seed * 97 + c * 31);
    // late tail: noise × exponential decay, through a lowpass whose cutoff falls with time (air absorption)
    let y = 0, y2 = 0;
    const k60 = -6.9078 / rt60;           // ln(0.001)/rt60
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const fc = dark + (bright - dark) * Math.exp(-t / 0.45);
      const a = 1 - Math.exp(-2 * Math.PI * fc / sr);
      const w = rng() * 2 - 1;
      y += a * (w - y); y2 += a * (y - y2);            // 2-pole
      const onset = Math.min(1, t / 0.018);             // smooth build-up (no wall = no hard onset)
      d[i] = y2 * Math.exp(k60 * t) * onset * 1.6;
    }
    // early reflections: ground bounce + distant slopes
    for (let e = 0; e < early; e++) {
      const t = 0.006 + Math.pow(rng(), 1.6) * 0.11;
      const i0 = Math.floor(t * sr), amp = (0.5 - 0.35 * (t / 0.12)) * (rng() < 0.5 ? -1 : 1);
      const len = Math.floor(sr * (0.0008 + rng() * 0.0015));
      for (let j = 0; j < len && i0 + j < n; j++) d[i0 + j] += amp * Math.sin(Math.PI * j / len) * (0.6 + 0.4 * rng());
    }
    // tail fade to zero at the end
    const f = Math.floor(0.25 * sr);
    for (let i = n - f; i < n; i++) d[i] *= (n - i) / f;
  }
  return buf;
}
