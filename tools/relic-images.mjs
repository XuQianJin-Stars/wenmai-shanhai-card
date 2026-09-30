// 从 Wikimedia Commons 给文物志取实物照片。
//
// 为什么不直接抓博物馆官网：文物本身早过了保护期，但拍它的那张照片是另一件受著作权保护的作品，
// 国博、三星堆、湖北省博这些站都挂着「版权所有」。本作要发到 GitHub Pages 上公开访问，
// 把它们的图打包进仓库属于再分发。Commons 上的图带机器可读的许可证和署名要求，照着标就合规；
// 古画（千里江山图、清明上河图、步辇图）那几张更省事——平面公有领域作品的忠实翻拍按 PD-Art 处理。
//
// 官网仍然有用，只是当外链：每件文物在文物志里带一条「官方藏品页」，链接不涉及版权。
//
//   node tools/relic-images.mjs           # 按 QUERY 表检索，写 src/data/relicImages.js 和 public/relics/
//   node tools/relic-images.mjs --dry     # 只打印检索结果，不下载
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { RELICS } from '../src/data/relics.js';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'wenmai-shanhai-card/1.0 (https://github.com/XuQianJin-Stars/wenmai-shanhai-card)';
const WIDTH = 600;            // 文物志详情那一栏最宽也就这么大，再大是白下（整包约 3 MB）

// 检索词按「文物的通用英文名／拉丁转写」给，Commons 上的中文文件名远不如英文全。
// 值可以是一个检索词，也可以直接写死 File:xxx —— 有些条目搜出来第一张不是最好的那张。
const QUERY = {
  'sanxingdui-mask': 'File:Bronze Mask with Protruding Eyes.jpg',
  'sanxingdui-tree': 'Sanxingdui bronze tree',
  'hongshan-dragon': 'Hongshan jade dragon National Museum China',
  houmuwu: 'Houmuwu ding',
  hezun: 'He zun bronze',
  'goujian-sword': 'Sword of Goujian',
  'guodian-slips': 'Guodian Chu Slips',
  'zenghouyi-bells': 'Bianzhong of Marquis Yi of Zeng',
  'renwu-yulong': 'Man Riding a Dragon painting Chu',
  bingmayong: 'Terracotta Army',
  tongbenma: 'File:Eastern Han Bronze Galloping Horse (10094835555).jpg',
  suoshachanyi: 'File:直裾素纱襌衣, 2018-09-28.jpg',
  'changxin-lamp': 'Changxin Palace Lamp',
  lantingxu: 'Lantingji Xu Shenlong',
  luoshenfu: 'Nymph of the Luo River',
  'zhulin-brick': 'Seven Sages of the Bamboo Grove brick relief',
  cangjingdong: 'File:Dunhuang Cave 16.jpg',
  jingangjing: 'Diamond Sutra 868',
  'mogao-45': 'File:Mogao Caves (23344276603).jpg',
  'qianli-jiangshan': 'A Thousand Li of Rivers and Mountains',
  qingming: 'File:Alongtheriver QingMing.jpg',
  // 葡萄花鸟纹银香囊：Commons 上没有可用图，这一条走画的那版卡面
  hejiacun: null,
  bunian: 'Emperor Taizong Receiving the Tibetan Envoy',
  'ruyao-xi': 'Ru ware brush washer',
  'nanhai-1': 'Nanhai One shipwreck',
  'yuan-qinghua': 'Yuan blue and white meiping Xiao He',
  bencao: 'File:Bencao Gangmu 33-36.jpg',
  'yongle-dadian': 'Yongle Encyclopedia',
  'tiangong-kaiwu': 'Tiangong Kaiwu',
  jianyi: 'File:Abridged Armilla Nanjing.JPG',
  kesi: 'Kesi silk tapestry Song',
  kunqu: 'Kunqu opera performance',
  tianyige: 'Tianyi Pavilion Ningbo',
};

// 官方藏品页／官网。链接不涉及版权，放在详情里既有出处又给人一条能自己查下去的路。
const OFFICIAL = {
  'sanxingdui-mask': 'https://www.sxd.cn/', 'sanxingdui-tree': 'https://www.sxd.cn/',
  'hongshan-dragon': 'https://www.chnmuseum.cn/', houmuwu: 'https://www.chnmuseum.cn/',
  hezun: 'http://www.bjqtm.com/', 'goujian-sword': 'https://www.hbww.org/',
  'guodian-slips': 'http://www.jmsbwg.com/', 'zenghouyi-bells': 'https://www.hbww.org/',
  'renwu-yulong': 'https://www.hnmuseum.com/', bingmayong: 'https://www.bmy.com.cn/',
  tongbenma: 'https://www.gansumuseum.com/', suoshachanyi: 'https://www.hnmuseum.com/',
  'changxin-lamp': 'http://www.hebeimuseum.org.cn/', lantingxu: 'https://www.dpm.org.cn/',
  luoshenfu: 'https://www.dpm.org.cn/', 'zhulin-brick': 'https://www.njmuseum.com/',
  cangjingdong: 'https://www.dha.ac.cn/', jingangjing: 'https://www.bl.uk/',
  'mogao-45': 'https://www.dha.ac.cn/', 'qianli-jiangshan': 'https://www.dpm.org.cn/',
  qingming: 'https://www.dpm.org.cn/', hejiacun: 'https://www.sxhm.com/',
  bunian: 'https://www.dpm.org.cn/', 'ruyao-xi': 'https://www.dpm.org.cn/',
  'nanhai-1': 'http://www.msm.org.cn/', 'yuan-qinghua': 'https://www.njmuseumadmin.com/',
  bencao: 'https://www.nlc.cn/', 'yongle-dadian': 'https://www.nlc.cn/',
  'tiangong-kaiwu': 'https://www.nlc.cn/', jianyi: 'http://www.pmo.cas.cn/',
  kesi: 'https://www.dpm.org.cn/', kunqu: 'https://www.zgysyjy.org.cn/',
  tianyige: 'https://www.tianyige.com.cn/',
};

const get = async (params) => {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: 2, origin: '*', ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};

/** 找一个候选文件名：写死的 File: 直接用，否则在 Commons 的文件命名空间里搜第一条。 */
async function findFile(q) {
  if (q.startsWith('File:')) return q;
  const j = await get({ action: 'query', list: 'search', srnamespace: 6, srlimit: 3, srsearch: q });
  return j.query?.search?.[0]?.title ?? null;
}

/** 取缩略图地址和许可证元数据。没有明确许可证的一律跳过——宁可缺图，不要来路不明的图。 */
async function fileInfo(title) {
  const j = await get({ action: 'query', titles: title, prop: 'imageinfo', iiurlwidth: WIDTH,
    iiprop: 'url|extmetadata|mime' });
  const p = j.query?.pages?.[0];
  const ii = p?.imageinfo?.[0];
  if (!ii || !ii.mime?.startsWith('image/')) return null;
  const m = ii.extmetadata ?? {};
  const txt = (k) => (m[k]?.value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const license = txt('LicenseShortName');
  if (!license) return null;
  return {
    file: title,
    thumb: ii.thumburl,
    mime: ii.mime,
    page: ii.descriptionurl,
    license,
    author: txt('Artist') || '未署名',
    credit: txt('Credit'),
  };
}

const dry = process.argv.includes('--dry');
const out = {};
const missing = [];
for (const r of RELICS) {
  const q = QUERY[r.id];
  if (q === null) continue;            // 明确查过、Commons 上没有的，不用每次再报一遍
  if (!q) { missing.push(`${r.id}（没配检索词）`); continue; }
  try {
    const title = await findFile(q);
    const info = title ? await fileInfo(title) : null;
    if (!info) { missing.push(`${r.id}（Commons 上没搜到带许可证的图）`); continue; }
    out[r.id] = { ...info, official: OFFICIAL[r.id] ?? null };
    console.log(`${r.id.padEnd(18)} ${info.license.padEnd(14)} ${info.file}`);
  } catch (e) {
    missing.push(`${r.id}（${e.message}）`);
  }
}
console.log(`\n${Object.keys(out).length}/${RELICS.length} 有图`);
if (missing.length) console.log('缺：\n  ' + missing.join('\n  '));
if (dry) process.exit(0);

// 图片下到 public/relics/，不走热链：Commons 的 upload 域在国内不稳，
// 而且离线打开也该看得见。原图动辄几十 MB，只存 WIDTH 宽的缩略图。
mkdirSync('public/relics', { recursive: true });
for (const [id, v] of Object.entries(out)) {
  // 后缀按 mime 取，不按 URL 结尾——缩略图地址带一长串查询参数，从里面切后缀会切出一堆垃圾。
  // Commons 会把 tif/png 原图渲染成 jpg 缩略图，所以这里认的是缩略图的类型。
  const ext = { 'image/png': 'png', 'image/gif': 'gif' }[v.mime] ?? 'jpg';
  const path = `public/relics/${id}.${ext}`;
  if (!existsSync(path)) {
    const r = await fetch(v.thumb, { headers: { 'User-Agent': UA } });
    writeFileSync(path, Buffer.from(await r.arrayBuffer()));
  }
  // 缩到 WIDTH 再压一道。iiurlwidth 只是「不超过」，Commons 常常给回比要的更大的一档，
  // 一张三四百 KB，三十几张就是 5 MB 多，对一个网页游戏太重。
  // sips 是 macOS 自带的；别的平台上没有就算了，图还在，只是大一点。
  try {
    execFileSync('sips', ['--resampleWidth', String(WIDTH), '-s', 'format', 'jpeg', '-s', 'formatOptions', '58', path, '--out', path], { stdio: 'ignore' });
  } catch { /* 没有 sips 就不压 */ }
  v.src = `relics/${id}.${ext}`;
  delete v.thumb; delete v.mime;
}

const q = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const body = Object.entries(out)
  .map(([id, v]) => `  ${q(id)}: { ${['src', 'file', 'page', 'license', 'author', 'credit', 'official']
    .filter((k) => v[k]).map((k) => `${k}: ${q(v[k])}`).join(', ')} },`)
  .join('\n');
writeFileSync('src/data/relicImages.js', `// 文物志的实物照片。这个文件是 tools/relic-images.mjs 生成的，别手改——改了下次重跑就没了。
//
// 图全部来自 Wikimedia Commons，每条都带原始文件名、许可证和作者，文物志详情里照着渲染署名，
// 这是 CC-BY / CC-BY-SA 要求的。博物馆官网只作外链（official），不取图：
// 文物本身是公有领域的，但拍它的照片不是，而本作是要公开部署的。
//
//   src       public/relics/ 下的本地副本（${WIDTH}px 宽）
//   page      Commons 上的文件页，署名要链到这里
//   official  官方藏品页／馆方官网
export const RELIC_IMAGES = {
${body}
};
`);
const bytes = Object.values(out).reduce((a, v) => a + statSync(`public/${v.src}`).size, 0);
console.log(`\n写好 src/data/relicImages.js 和 public/relics/（${Object.keys(out).length} 张，${(bytes / 1048576).toFixed(1)} MB）`);
