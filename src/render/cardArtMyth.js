// 人间诸神的卡面。一个人，一件认得出的东西：天眼、弓、钓竿、太阳、鸟、卦、塔。
const GOLD = '#C8A04A', RED = '#C03A2A', INK = '#1a1a1a';
const line = (b, a, z, o = {}) => b.stroke([a, [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2 + (o.sag ?? 0)], z], o);

export function mythMotifs({ sky, figure, flame, wave, scrollFrame }) {
  const M = {};

  const dusk = (b, w, h, { top = '#e4d2ae', bottom = '#f3ead8', sun = '#e8b060' } = {}) => {
    sky(b, w, h, { top, bottom, sun: [w * 0.78, h * 0.22, h * 0.09, sun] });
    b.mountains(w, h, { base: 0.62, layers: 3, color: '#6a5f50', alpha: 0.22, peak: 0.18 });
  };

  // 杨戬：额上竖眼，三尖两刃，脚边一只犬。
  M['myth-erlang'] = (b, w, h) => {
    dusk(b, w, h, { top: '#ddd0b4', bottom: '#f0e6d2', sun: '#e8c878' });
    const f = figure(b, w * 0.48, h * 0.96, h * 0.72, { robe: '#3a3428', accent: GOLD, head: 'hat', sleeve: 0.9, width: 1.05 });
    b.wash(b.blob(f.head[0], f.head[1] - 8, 3.2, 4.2), { color: '#f2e6a8', alpha: 0.95, blur: 1.2, edge: 0.4 });
    const px = f.rh[0] + 8, py = f.rh[1] - 36;
    b.stroke([[px, py + 70], [px - 2, py + 28], [px, py]], { w: 5, color: '#c8b48a', taper: [0.2, 0.05], dry: 0.2 });
    line(b, [px - 16, py - 2], [px + 16, py + 2], { w: 4, color: '#e8d8a0', dry: 0.15 });
    line(b, [px - 8, py - 14], [px, py], { w: 3, color: '#e8d8a0', dry: 0.1 });
    line(b, [px + 8, py - 14], [px, py], { w: 3, color: '#e8d8a0', dry: 0.1 });
    b.wash(b.blob(w * 0.22, h * 0.9, 16, 10, { rot: -0.2 }), { color: '#2a241c', alpha: 0.9, blur: 1.5, edge: 0.6 });
    b.stroke([[w * 0.16, h * 0.86], [w * 0.1, h * 0.8]], { w: 3, color: '#2a241c', taper: [0.4, 0.1], dry: 0.3 });
  };

  // 后羿：一张弓，九个太阳只剩被射中的那个。
  M['myth-houyi'] = (b, w, h) => {
    dusk(b, w, h, { top: '#e8c8a8', bottom: '#f6e6d0', sun: '#e07040' });
    for (let i = 0; i < 8; i++) {
      const x = w * (0.12 + (i % 4) * 0.16), y = h * (0.16 + Math.floor(i / 4) * 0.12);
      b.wash(b.blob(x, y, 7, 7), { color: '#e8a060', alpha: 0.35, blur: 2, edge: 0.2 });
    }
    const f = figure(b, w * 0.4, h * 0.96, h * 0.7, { robe: '#6a3020', accent: RED, head: 'bun', sleeve: 1.1, lean: 0.15, width: 0.95 });
    const bow = [];
    for (let t = 0; t <= 1; t += 0.08) bow.push([f.lh[0] + 6 + Math.sin(t * Math.PI) * 22, f.head[1] + t * 78]);
    b.stroke(bow, { w: 4, color: '#5a3a22', dry: 0.25, taper: [0.2, 0.2] });
    line(b, bow[0], bow[bow.length - 1], { w: 1.4, color: '#e8d8c0', dry: 0.1 });
    b.stroke([[f.rh[0] - 4, f.head[1] + 20], [w * 0.86, h * 0.2]], { w: 2.2, color: '#3a2a18', taper: [0.05, 0.4], dry: 0.15 });
    flame(b, w * 0.86, h * 0.2, 28, { n: 4 });
  };

  // 姜子牙：钓竿入水，身边一卷榜。
  M['myth-jiang'] = (b, w, h) => {
    dusk(b, w, h, { top: '#d8d2c0', bottom: '#efe8d8', sun: '#c8b890' });
    wave(b, -10, h * 0.78, w + 20, { n: 5, s: 1 });
    const f = figure(b, w * 0.42, h * 0.9, h * 0.68, { robe: '#4a4034', accent: '#8C6040', head: 'hat', sleeve: 1.2, width: 1.15 });
    b.stroke([[f.rh[0], f.rh[1]], [w * 0.78, h * 0.42], [w * 0.8, h * 0.76]], { w: 3, color: '#5a4030', dry: 0.35, taper: [0.15, 0.4] });
    b.wash(b.blob(w * 0.72, h * 0.7, 14, 22, { rot: 0.08 }), { color: '#e8dcc0', alpha: 0.9, blur: 1, edge: 0.7 });
    for (let i = 0; i < 4; i++) line(b, [w * 0.66, h * 0.64 + i * 6], [w * 0.78, h * 0.65 + i * 6], { w: 1, color: INK, dry: 0.4 });
  };

  // 夸父：朝太阳跑，手里的杖已经松了。
  M['myth-kuafu'] = (b, w, h) => {
    sky(b, w, h, { top: '#e8b090', bottom: '#f6d8c0', sun: [w * 0.82, h * 0.2, h * 0.12, '#e85a30'] });
    b.mountains(w, h, { base: 0.7, alpha: 0.2 });
    const f = figure(b, w * 0.4, h * 0.98, h * 0.78, { robe: '#5a3020', accent: RED, head: 'long', sleeve: 1.3, lean: 0.35, stance: 1.4, width: 1.3 });
    b.stroke([[f.rh[0] + 10, f.rh[1] + 10], [w * 0.7, h * 0.92]], { w: 6, color: '#6b4a2a', taper: [0.2, 0.15], dry: 0.3 });
    b.splatter(w * 0.78, h * 0.22, 20, { n: 10, color: '#e85a30', alpha: 0.4, size: 2 });
  };

  // 精卫：一只鸟，嘴里一块石头，下面是海。
  M['myth-jingwei'] = (b, w, h) => {
    sky(b, w, h, { top: '#c8d4e4', bottom: '#e8eef4', sun: [w * 0.2, h * 0.18, h * 0.06, '#f0f4f8'] });
    for (let r = 0; r < 4; r++) wave(b, -20, h * (0.62 + r * 0.08), w + 40, { n: 6, s: 1, color: '#3a5878' });
    const x = w * 0.48, y = h * 0.4;
    b.stroke([[x - 28, y + 6], [x, y - 4], [x + 36, y + 8]], { w: 5, color: '#2a241c', taper: [0.3, 0.15], dry: 0.25 });
    b.wash(b.blob(x + 8, y, 16, 8, { rot: -0.2 }), { color: '#2a241c', alpha: 0.92, blur: 1.2, edge: 0.7 });
    b.wash(b.blob(x + 22, y - 2, 5, 3.5), { color: '#f4f0e6', alpha: 0.95, blur: 0.6, edge: 0.8 });
    b.wash(b.blob(x + 30, y + 2, 5, 4), { color: '#8C6040', alpha: 0.95, blur: 0.8, edge: 0.6 });
    b.wash(b.blob(x + 4, y - 6, 3, 2.2), { color: '#C03A2A', alpha: 0.9, blur: 0.5, edge: 0.5 });
  };

  // 伏羲：人身之后一圈八卦。
  M['myth-fuxi'] = (b, w, h) => {
    dusk(b, w, h, { top: '#d4e0cc', bottom: '#eef2e4', sun: '#c8d8a0' });
    const cx = w * 0.5, cy = h * 0.46;
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 4);
      const x = cx + Math.cos(a) * w * 0.32, y = cy + Math.sin(a) * h * 0.28;
      for (let k = 0; k < 3; k++) {
        const broken = ((i + k) % 2 === 0);
        const yk = y - 8 + k * 6;
        if (broken) {
          line(b, [x - 10, yk], [x - 2, yk], { w: 2.2, color: INK, dry: 0.15 });
          line(b, [x + 2, yk], [x + 10, yk], { w: 2.2, color: INK, dry: 0.15 });
        } else line(b, [x - 10, yk], [x + 10, yk], { w: 2.2, color: INK, dry: 0.15 });
      }
    }
    figure(b, w * 0.5, h * 0.98, h * 0.62, { robe: '#2e4030', accent: '#4A8C5C', head: 'bun', sleeve: 1.15, width: 1 });
  };

  // 白素贞：白衣，身后一座塔，脚边是水。
  M['myth-baishe'] = (b, w, h) => {
    sky(b, w, h, { top: '#d4dce8', bottom: '#eef2f4' });
    wave(b, 0, h * 0.9, w, { n: 6, s: 1.1, color: '#6a88a8' });
    const tx = w * 0.78;
    b.wash([[tx - 16, h * 0.78], [tx + 16, h * 0.78], [tx + 10, h * 0.28], [tx - 10, h * 0.28]], { color: '#6a5a48', alpha: 0.75, blur: 1, edge: 0.8 });
    for (let i = 0; i < 5; i++) line(b, [tx - 12, h * (0.7 - i * 0.08)], [tx + 12, h * (0.7 - i * 0.08)], { w: 2, color: '#3a3028', dry: 0.3 });
    const f = figure(b, w * 0.4, h * 0.94, h * 0.7, { robe: '#f4f0e8', accent: '#d8e4ee', head: 'bun', sleeve: 1.35, width: 0.9 });
    const coil = [];
    for (let t = 0; t < 1.4; t += 0.06) coil.push([f.sh[0] + Math.cos(t * 6.28) * (28 - t * 10), h * 0.9 + Math.sin(t * 6.28) * 8 - t * 6]);
    b.stroke(coil, { w: 8, color: '#f7f4ee', alpha: 0.9, dry: 0.25, taper: [0.1, 0.7] });
  };

  M['myth-scroll'] = (b, w, h) => scrollFrame(b, w, h, (iw, ih) => {
    b.mountains(iw, ih, { base: 0.55, layers: 3, color: '#5a6a58', alpha: 0.35, peak: 0.28 });
    wave(b, 8, ih * 0.72, iw - 16, { n: 4, s: 0.8, color: '#3a5878' });
    b.wash(b.blob(iw * 0.3, ih * 0.4, 10, 6), { color: '#2a241c', alpha: 0.8, blur: 1, edge: 0.5 });
    flame(b, iw * 0.72, ih * 0.32, 22, { n: 3 });
  });

  return M;
}
