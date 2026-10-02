// 故事卷轴底部的历史示意地图。东西向略拉开，好铺进手卷下沿的留白。
// 海岸是同一张地理底图；朱砂色块随章节换成那个时代的大致范围。示意图，不是测绘图。

const LON0 = 73, LON1 = 135, LAT0 = 18, LAT1 = 54;
const W = 1280, H = 400, PADX = 24, PADY = 18;
const VB_W = W + PADX * 2, VB_H = H + PADY * 2;

const px = (lon) => PADX + (lon - LON0) / (LON1 - LON0) * W;
const py = (lat) => PADY + (LAT1 - lat) / (LAT1 - LAT0) * H;
const ring = (pairs) => pairs.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(' ');

const COAST = [
  [135, 48.5], [131, 44.5], [124.5, 40], [121.2, 38.9],
  [119, 39.2], [117.8, 39],
  [120, 37.8], [122.6, 37.4], [120.8, 36.1], [119.5, 35.4],
  [120.2, 34], [121.8, 31.2], [122, 29.8], [121, 28],
  [119.6, 26], [118.1, 24.5], [117, 23.4], [114.2, 22.5],
  [110.3, 21.2], [109.5, 21.5], [108, 21.6],
  [106.5, 22.5], [103, 22.5], [100, 22], [97.5, 24],
  [98, 27.5], [95, 29], [91, 28], [85, 28.5], [80, 31], [78.5, 32.5],
  [73.5, 39], [75, 40.5], [80, 42], [87, 49], [90, 47.5],
  [95, 44], [105, 42], [112, 45], [118, 48], [124, 53], [130, 47.5], [135, 48.5],
];
const YELLOW = [[96, 35], [101, 34], [104, 37], [106, 40], [109, 41], [111, 38], [110, 35], [112, 35], [114, 35], [116, 36], [118, 37], [119.2, 37.8]];
const YANG = [[92, 33], [97, 30], [100, 30], [103, 29], [106, 30], [109, 30], [111, 31], [114, 30.5], [116, 30], [118, 31], [120, 32], [121.5, 31.3]];
const WALL = [[104, 37.5], [107, 37], [110, 39], [112, 40.5], [114, 40.5], [116, 40.5], [118, 40.3], [120, 40.2]];

const ERA = {
  myth: { caption: '上古 · 山海', cosmos: true },
  zhou: {
    caption: '先秦 · 列国',
    realm: [[106, 35], [109, 38], [114, 40.5], [117, 41], [119, 37], [118, 34], [115, 31], [111, 30], [107, 32], [105, 34]],
    places: [['秦', 108, 34.5], ['齐', 118, 36.5], ['楚', 112, 31], ['燕', 116, 40], ['赵', 114, 38], ['魏', 112, 35], ['韩', 110, 34.5]],
  },
  chu: {
    caption: '楚辞 · 南国',
    realm: [[106, 35], [109, 38], [114, 40.5], [117, 41], [119, 37], [118, 34], [115, 31], [111, 30], [107, 32], [105, 34]],
    focus: [[109, 32.5], [114, 32], [115, 28], [111, 27], [108, 29]],
    places: [['楚', 112, 30.5], ['郢', 112.2, 30.3], ['洞庭', 113, 29]],
  },
  han: {
    caption: '秦汉 · 一统',
    realm: [[94, 40], [106, 38], [114, 41], [120, 41], [121, 36], [120, 28], [114, 23], [106, 24], [102, 30], [96, 36]],
    wall: true,
    places: [['咸阳', 108.7, 34.3], ['长城', 114, 40.6], ['岭南', 113, 23.2], ['敦煌', 94.7, 40.1]],
  },
  three: {
    caption: '三国',
    parts: [
      ['wei', [[106, 38], [118, 40], [120, 35], [114, 33], [108, 34]]],
      ['shu', [[103, 33], [107, 32], [107, 29], [103, 29], [102, 31]]],
      ['wu', [[112, 32], [121, 32], [120, 24], [114, 24], [111, 29]]],
    ],
    places: [['魏', 113, 36], ['蜀', 104, 30.8], ['吴', 118, 30]],
  },
  jin: {
    caption: '魏晋 · 中朝',
    realm: [[104, 37], [114, 40], [119, 36], [118, 30], [112, 29], [105, 32]],
    places: [['洛阳', 112.4, 34.6], ['长安', 108.9, 34.3], ['建康', 118.8, 32.1]],
  },
  split: {
    caption: '南北朝',
    parts: [
      ['north', [[106, 40], [120, 41], [121, 35], [112, 34], [105, 36]]],
      ['south', [[108, 32], [121, 32], [120, 23], [112, 24], [107, 29]]],
    ],
    places: [['北朝', 114, 38], ['南朝', 118, 30], ['长江', 114, 30.6]],
  },
  tang: {
    caption: '大唐 · 丝路',
    realm: [[88, 42], [104, 41], [118, 41], [121, 32], [118, 23], [108, 23], [100, 28], [90, 36]],
    road: [[108.9, 34.3], [102, 37], [94.7, 40.1], [88, 41]],
    wall: true,
    places: [['长安', 108.9, 34.3], ['敦煌', 94.7, 40.1], ['洛阳', 112.4, 34.6], ['广州', 113.3, 23.1]],
  },
  five: {
    caption: '五代十国',
    parts: [
      ['wei', [[110, 36], [115, 36.5], [116, 33.5], [111, 33]]],
      ['wu', [[116, 32.5], [121, 32], [120, 28], [116, 28.5]]],
    ],
    places: [['中原', 113, 34.8], ['江南', 119, 31], ['蜀', 104, 30.7]],
  },
  song: {
    caption: '两宋',
    parts: [
      ['song', [[104, 33], [112, 35], [118, 35], [121, 28], [116, 23], [108, 25], [103, 30]]],
      ['liao', [[114, 42], [122, 42], [121, 37], [115, 37]]],
      ['xia', [[100, 40], [106, 39], [107, 35], [101, 35]]],
    ],
    places: [['汴京', 114.3, 34.8], ['辽', 119, 41], ['西夏', 103, 37.5], ['临安', 120.2, 30.3]],
  },
  yuan: {
    caption: '蒙元',
    realm: [[80, 46], [110, 48], [124, 46], [122, 32], [116, 23], [100, 25], [85, 32], [78, 40]],
    places: [['大都', 116.4, 39.9], ['杭州', 120.2, 30.3], ['大理', 100.2, 25.7]],
  },
  ming: {
    caption: '明清',
    realm: [[98, 42], [116, 42], [122, 38], [121, 26], [114, 22], [106, 23], [100, 28], [96, 38]],
    wall: true,
    places: [['北京', 116.4, 39.9], ['南京', 118.8, 32.1], ['广州', 113.3, 23.1]],
  },
  sea: {
    caption: '海丝 · 远航',
    realm: [[98, 42], [116, 42], [122, 38], [121, 26], [114, 22], [106, 23], [100, 28], [96, 38]],
    route: [[118.6, 24.9], [121, 22], [116, 19], [110, 18.5]],
    places: [['泉州', 118.6, 24.9], ['广州', 113.3, 23.1], ['南京', 118.8, 32.1]],
  },
  qing: {
    caption: '晚清',
    realm: [[86, 46], [116, 46], [124, 42], [122, 28], [114, 22], [102, 24], [90, 32], [82, 40]],
    places: [['北京', 116.4, 39.9], ['上海', 121.5, 31.2], ['广州', 113.3, 23.1]],
  },
  republic: {
    caption: '民国',
    places: [['南京', 118.8, 32.1], ['北平', 116.4, 39.9], ['上海', 121.5, 31.2]],
  },
  craft: {
    caption: '天工 · 造物',
    places: [['都江堰', 103.6, 31], ['长安', 108.9, 34.3], ['洛阳', 112.4, 34.6]],
  },
  now: {
    caption: '今日',
    places: [['北京', 116.4, 39.9], ['江南', 120, 31]],
  },
};

const KEY = {
  shenhua: 'myth', xianqin: 'zhou', chuci: 'chu', qinhan: 'han', weijin: 'jin',
  sanguo: 'three', nanbei: 'split', dunhuang: 'tang', datang: 'tang', wudai: 'five',
  liangsong: 'song', mengyuan: 'yuan', haisi: 'sea', shijing: 'ming', guizang: 'ming',
  tiangong: 'craft', wanqing: 'qing', minguo: 'republic', feiyi: 'now', dangdai: 'now',
};

const poly = (pairs, cls) => `<polygon class="${cls}" points="${ring(pairs)}"/>`;
const line = (pairs, cls) => `<polyline class="${cls}" points="${ring(pairs)}"/>`;
const dots = (places) => places.map(([name, lon, lat]) => {
  const x = px(lon).toFixed(1), y = py(lat).toFixed(1);
  return `<g class="place"><circle cx="${x}" cy="${y}" r="3.4"/><text x="${+x + 8}" y="${+y + 5}">${name}</text></g>`;
}).join('');

// 山海经的世界不是后来的海岸。中间一块陆地，四海环绕，昆仑在西，扶桑在东。
function mythSvg() {
  const cap = ERA.myth.caption;
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <ellipse class="sea" cx="300" cy="200" rx="150" ry="78"/>
    <ellipse class="sea" cx="1040" cy="210" rx="160" ry="86"/>
    <ellipse class="sea" cx="680" cy="78" rx="200" ry="46"/>
    <ellipse class="sea" cx="700" cy="360" rx="210" ry="48"/>
    <path class="myth-land" d="M500,214 C520,150 640,128 770,150 C900,172 960,214 938,262 C916,312 790,334 660,322 C530,310 470,272 500,214 Z"/>
    <path class="peak" d="M455,168 L478,124 M492,128 L512,168"/>
    <path class="peak" d="M548,196 L578,142 L612,198 M590,168 L624,138 L656,190"/>
    <path class="river" d="M600,178 C680,190 760,210 860,196"/>
    <path class="tree" d="M1024,236 L1024,186 M1024,204 L1002,186 M1024,200 L1048,184 M1024,216 L1000,210 M1024,214 L1050,208"/>
    <g class="place"><text x="520" y="168">昆仑</text></g>
    <g class="place"><text x="430" y="112">不周</text></g>
    <g class="place"><text x="990" y="168">扶桑</text></g>
    <g class="place"><text x="230" y="168">西海</text></g>
    <g class="place"><text x="1088" y="168">东海</text></g>
    <g class="place"><text x="640" y="58">北海</text></g>
    <g class="place"><text x="660" y="392">南海</text></g>
    <text class="era-cap" x="${PADX}" y="${VB_H - 8}">${cap}</text>
  </svg>`;
}

export function eraSvg(key) {
  const era = ERA[KEY[key] ?? 'myth'];
  if (era.cosmos) return mythSvg();
  const realms = [
    era.realm ? poly(era.realm, 'realm') : '',
    era.focus ? poly(era.focus, 'realm focus') : '',
    ...(era.parts ?? []).map(([cls, pts]) => poly(pts, `realm ${cls}`)),
  ].join('');
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <polygon class="land" points="${ring(COAST)}"/>
    <ellipse class="isle" cx="${px(109.7).toFixed(1)}" cy="${py(19.2).toFixed(1)}" rx="18" ry="10"/>
    ${realms}
    ${line(YELLOW, 'river')}
    ${line(YANG, 'river')}
    ${era.wall ? line(WALL, 'wall') : ''}
    ${era.road ? line(era.road, 'road') : ''}
    ${era.route ? line(era.route, 'route') : ''}
    ${dots(era.places)}
    <text class="era-cap" x="${PADX}" y="${VB_H - 8}">${era.caption}</text>
  </svg>`;
}

export function eraMap(key) {
  const era = ERA[KEY[key] ?? 'myth'];
  const base = import.meta.env.BASE_URL || './';
  const img = `${base}card-art/era-${KEY[key] ?? 'myth'}.jpg`;
  const el = document.createElement('div');
  el.className = 'era-map';
  el.setAttribute('aria-label', era.caption);
  el.innerHTML = `<img src="${img}" alt="">
    <span class="era-cap">${era.caption}</span>`;
  return el;
}
