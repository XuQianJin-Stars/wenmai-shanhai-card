// Minimal tween/timeline system driven by the render loop. Game-time aware (pauses with the game).
export const ease = {
  linear: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

const active = new Set();

/** tween(duration, onUpdate(k, t), { ease, delay }) → Promise resolved on completion. */
export function tween(dur, fn, { ease: e = ease.out, delay = 0 } = {}) {
  return new Promise((resolve) => {
    active.add({ t: -delay, dur: Math.max(1e-4, dur), fn, e, resolve });
  });
}
/** Animate numeric props of an object (e.g. a Vector3) to targets. */
export function to(obj, props, dur, opts = {}) {
  const from = {};
  for (const k of Object.keys(props)) from[k] = obj[k];
  return tween(dur, (k) => { for (const p of Object.keys(props)) obj[p] = from[p] + (props[p] - from[p]) * k; }, opts);
}
export const wait = (s) => tween(s, () => {});

export function updateTweens(dt) {
  for (const a of [...active]) {
    a.t += dt;
    if (a.t < 0) continue;
    const u = Math.min(1, a.t / a.dur);
    a.fn(a.e(u), u);
    if (u >= 1) { active.delete(a); a.resolve(); }
  }
}
export const tweenCount = () => active.size;
