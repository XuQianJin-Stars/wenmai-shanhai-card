// Canvas-2D ink-brush toolkit: tapered strokes with dry-brush breakup, soft washes that bleed, splatter, xuan paper,
// seals and cloud/回纹 ornaments. Everything is procedural and seeded, so a card always paints the same way.
import { mulberry32 } from '../rules/rng.js';

export const INK = '#1A1A1A';
export const PAPER = '#F5F0E8';
export const FONT_BRUSH = "'Ma Shan Zheng','STKaiti','Kaiti SC','KaiTi','STXingkai',serif";
export const FONT_SERIF = "'Noto Serif SC','Songti SC','STSong','SimSun',serif";

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export function mix(h1, h2, k) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** A seeded painter bound to a context. */
export function brush(ctx, seed = 1) {
  const R = mulberry32(seed);
  const r = (a = 0, b = 1) => a + (b - a) * R();

  // Catmull-Rom through control points → dense polyline
  function spline(pts, step = 3) {
    if (pts.length < 3) return pts.slice();
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const n = Math.max(2, Math.ceil(len / step));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /**
   * Tapered brush stroke. w: max width; taper: [start, end] 0..1 fraction of length used to swell/thin;
   * dry: 0..1 how much the bristles break up toward the tail; alpha: ink density.
   */
  function stroke(pts, { w = 8, color = INK, alpha = 0.92, taper = [0.15, 0.55], dry = 0.3, press = null } = {}) {
    const P = spline(pts, 2.5);
    if (P.length < 2) return;
    let L = 0; const acc = [0];
    for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc.push(L); }
    const width = (i) => {
      const u = acc[i] / (L || 1);
      if (press) return w * press(u);
      const a = Math.min(1, u / Math.max(0.01, taper[0])), b = Math.min(1, (1 - u) / Math.max(0.01, taper[1]));
      return w * Math.pow(Math.min(a, b), 0.6) * (0.85 + 0.15 * Math.sin(u * 9 + seed));
    };
    // body: filled polygon from offset edges
    const left = [], right = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const hw = width(i) / 2;
      left.push([P[i][0] + nx * hw, P[i][1] + ny * hw]);
      right.push([P[i][0] - nx * hw, P[i][1] - ny * hw]);
    }
    ctx.save();
    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
    // dry-brush: bristle gaps cut out near the tail, bristle streaks near the edges
    if (dry > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      const nb = 5 + Math.floor(w / 3);
      for (let k = 0; k < nb; k++) {
        const off = r(-0.45, 0.45), start = r(0.35, 0.8) + (1 - dry) * 0.3;
        ctx.strokeStyle = `rgba(0,0,0,${r(0.25, 0.8) * dry})`;
        ctx.lineWidth = r(0.6, Math.max(1, w * 0.09));
        ctx.beginPath();
        let begun = false;
        for (let i = 0; i < P.length; i++) {
          const u = acc[i] / (L || 1);
          if (u < start) continue;
          const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
          let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          const x = P[i][0] + nx * width(i) * off, y = P[i][1] + ny * width(i) * off;
          if (!begun) { ctx.moveTo(x, y); begun = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Soft bleeding wash inside a closed path (points), with a darker "tide line" at the edge. */
  function wash(pts, { color = INK, alpha = 0.25, blur = 6, edge = 0.35, smooth = true } = {}) {
    const P = smooth ? spline([...pts, pts[0]], 4) : pts;
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
    if (edge > 0) {
      ctx.filter = `blur(${Math.max(0.6, blur * 0.25)}px)`;
      ctx.strokeStyle = rgba(color, alpha * edge);
      ctx.lineWidth = 1.5 + blur * 0.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Blob: a wobbly closed shape around (x, y). */
  function blob(x, y, rx, ry, { n = 14, wob = 0.18, rot = 0 } = {}) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rot;
      const k = 1 + r(-wob, wob);
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
    }
    return pts;
  }

  function splatter(x, y, radius, { n = 30, color = INK, alpha = 0.8, size = 3 } = {}) {
    ctx.save();
    ctx.fillStyle = rgba(color, alpha);
    for (let i = 0; i < n; i++) {
      const a = r(0, Math.PI * 2), d = Math.pow(R(), 1.8) * radius, s = r(0.3, 1) * size * (1 - d / radius * 0.6);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** Layered distant mountains (远山): pale washes stacked back to front. */
  function mountains(w, h, { base = 0.62, layers = 3, color = INK, alpha = 0.16, peak = 0.22 } = {}) {
    for (let l = 0; l < layers; l++) {
      const y0 = h * (base + l * 0.07), amp = h * peak * (1 - l * 0.22);
      const pts = [[0, h]];
      let x = 0;
      pts.push([0, y0 - r(0, amp * 0.5)]);
      while (x < w) {
        x += r(w * 0.08, w * 0.2);
        pts.push([x, y0 - r(amp * 0.2, amp)]);
      }
      pts.push([w, h]);
      wash(pts, { color, alpha: alpha * (1 + l * 0.5), blur: 5 - l, edge: 0.5, smooth: false });
    }
  }

  function mist(w, h, y, { alpha = 0.55, color = PAPER, n = 6 } = {}) {
    for (let i = 0; i < n; i++) {
      wash(blob(r(0, w), y + r(-h * 0.04, h * 0.04), r(w * 0.25, w * 0.5), r(h * 0.02, h * 0.05)), { color, alpha, blur: 12, edge: 0 });
    }
  }

  /** 祥云 auspicious cloud curl at (x, y), size s. */
  function cloud(x, y, s, { color = INK, alpha = 0.8, w = 3 } = {}) {
    const spiral = (cx, cy, rad, dir) => {
      const pts = [];
      for (let t = 0; t <= 1.6; t += 0.08) {
        const a = dir * t * Math.PI * 1.6, rr = rad * (1 - t * 0.5);
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      return pts;
    };
    stroke(spiral(x, y, s, 1), { w, color, alpha, dry: 0.1, taper: [0.1, 0.6] });
    stroke(spiral(x + s * 1.3, y - s * 0.2, s * 0.8, -1), { w: w * 0.9, color, alpha, dry: 0.1, taper: [0.1, 0.6] });
    stroke([[x - s * 1.4, y + s * 0.9], [x, y + s * 1.05], [x + s * 1.6, y + s * 0.8], [x + s * 2.6, y + s * 0.95]], { w: w * 0.8, color, alpha, dry: 0.2 });
  }

  return { R, r, spline, stroke, wash, blob, splatter, mountains, mist, cloud, ctx };
}

/** Xuan paper: warm base, fibres, faint mottling. */
export function paper(ctx, w, h, { base = PAPER, seed = 3, fibres = 1, dark = 0 } = {}) {
  const R = mulberry32(seed);
  ctx.save();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (R() - 0.5) * 10;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.05 * fibres;
  ctx.strokeStyle = dark ? '#000' : '#6b5a40';
  for (let i = 0; i < (w * h) / 900 * fibres; i++) {
    const x = R() * w, y = R() * h, a = R() * Math.PI, l = 4 + R() * 18;
    ctx.lineWidth = 0.4 + R() * 0.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  ctx.globalAlpha = 0.06;
  ctx.filter = 'blur(18px)';
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = R() < 0.5 ? '#a08050' : '#fff8e8';
    ctx.beginPath(); ctx.arc(R() * w, R() * h, 20 + R() * w * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Square cinnabar seal (印章) with one or two characters. */
export function seal(ctx, x, y, s, text, { color = '#C0392B', inverse = false, font = FONT_BRUSH, seed = 5 } = {}) {
  const R = mulberry32(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((R() - 0.5) * 0.06);
  if (!inverse) {
    ctx.fillStyle = color;
    roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.08); ctx.fill();
    ctx.fillStyle = '#f4e9d8';
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;
    roundRect(ctx, -s / 2 + s * 0.05, -s / 2 + s * 0.05, s * 0.9, s * 0.9, s * 0.06); ctx.stroke();
    ctx.fillStyle = color;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (text.length === 1) {
    ctx.font = `${s * 0.72}px ${font}`;
    ctx.fillText(text, 0, s * 0.04);
  } else {
    ctx.font = `${s * 0.42}px ${font}`;
    ctx.fillText(text[0], s * 0.2, -s * 0.2); ctx.fillText(text[1], s * 0.2, s * 0.24);
    if (text[2]) ctx.fillText(text[2], -s * 0.2, -s * 0.2);
    if (text[3]) ctx.fillText(text[3], -s * 0.2, s * 0.24);
  }
  // worn edges
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(0,0,0,${R() * 0.6})`;
    const a = R() * Math.PI * 2, d = s * (0.3 + R() * 0.25);
    ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, R() * s * 0.03, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 回纹 key-fret corner ornament. */
export function huiwen(ctx, x, y, s, { color = INK, lw = 2, flipX = 1, flipY = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(flipX, flipY);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'square';
  const u = s / 5;
  ctx.beginPath();
  ctx.moveTo(0, 5 * u); ctx.lineTo(0, 0); ctx.lineTo(5 * u, 0);
  ctx.moveTo(u, 5 * u); ctx.lineTo(u, u); ctx.lineTo(4 * u, u); ctx.lineTo(4 * u, 3 * u); ctx.lineTo(2 * u, 3 * u); ctx.lineTo(2 * u, 2 * u); ctx.lineTo(3 * u, 2 * u);
  ctx.stroke();
  ctx.restore();
}

/** Wrap text into lines that fit maxW (CJK: per character; keeps 【…】 tokens together). */
export function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        if ('，。；：、）」』！？'.includes(ch)) { line += ch; lines.push(line); line = ''; continue; }
        lines.push(line); line = ch;
      } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}
