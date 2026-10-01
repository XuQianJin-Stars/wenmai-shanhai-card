// Progress save (localStorage). Everything is validated on load so a hand-edited or stale save can never break the game.
import { CARDS, UPGRADE_COST, PLAYER_CARD_IDS } from '../data/cards.js';
import { STARTER_CARDS, STARTER_DECK, DECK_SIZE, MAX_COPIES, LEVELS } from '../data/story.js';
import { GUARDIAN, guardianCost, boonOf, guardianRank } from '../data/guardian.js';

const KEY = 'wenmai_save_v1';
export const MAX_DECKS = 6;
const DECK_NUM = ['一', '二', '三', '四', '五', '六'];

export function defaultSave() {
  const starter = [...STARTER_DECK];
  return {
    v: 3,                              // 3 = 唐宋拆成两章之后（见 migrateLevelId / migrateChapterNo）
    fragments: 0,
    owned: [...STARTER_CARDS],        // card ids the player may put in a deck
    grades: {},                       // id → 0 | 1 | 2  (凡 / 灵 / 圣)
    guardian: {},                     // 修行 key → 等级（见 data/guardian.js）
    decks: [{ name: '牌组一', cards: [...starter] }],
    deckOn: 0,                        // 进战斗用的是 decks[deckOn]
    deck: starter,
    done: [],                         // completed level ids
    seenPrologue: false,              // chapter 1 prologue (kept as its own flag for older saves)
    seenPro: [],                      // chapter numbers ≥2 whose prologue has been watched
    seenBonds: [],                    // bond ids whose culture note has been shown
    stats: { wins: 0, losses: 0, games: 0 },
    quizDone: [],                      // 文脉闯关 ch key，首通过后不再给碎片
    quizDaily: { day: '', done: false },
    settings: { master: 0.8, music: 0.7, sfx: 0.9, speed: 1, timer: true, quality: 'high', hints: true, guardianGender: 'male' },
  };
}

// 存档里存的是关卡 id 和章号，两样都被改过，所以有两道迁移，按存档版本依次补上。
//
// v1 → v2：关卡 id 原本是 chN-M，章号一按朝代重排就全对不上，于是改成朝代拼音前缀。
// v2 → v3：「唐宋古风」拆成「大唐气象」和「两宋风雅」，唐那三关的 id 由 tangsong-* 改为
//          datang-*，新的两宋插在第八章，原第八章往后的章号统统 +1。
// 每张表只在读到对应旧版本时走一次——新存档已经是新编号，再翻一遍就翻错了。
const OLD_CH = { 1: 'shenhua', 2: 'tangsong', 3: 'feiyi', 4: 'xianqin', 5: 'chuci', 6: 'qinhan',
  7: 'weijin', 8: 'dunhuang', 9: 'shijing', 10: 'tiangong', 11: 'haisi', 12: 'guizang' };
const OLD_N = { 1: 1, 2: 7, 3: 11, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 9, 10: 10, 11: 8, 12: 12 };
const migrateLevelId = (id) => (typeof id === 'string' ? id.replace(/^ch(\d+)-(\d+)$/, (m, c, k) => (OLD_CH[c] ? `${OLD_CH[c]}-${k}` : m)) : id);
const splitTangSong = (id) => (typeof id === 'string' ? id.replace(/^tangsong-(\d+)$/, 'datang-$1') : id);
const shiftChapterNo = (n) => (n >= 8 ? n + 1 : n);

/**
 * 把任意一坨 JSON 洗成一份合法存档：非法字段丢掉，旧版本按 v 号依次迁移。
 * 导出是为了能在 Node 里直接测迁移——关卡 id 和章号都被改过不止一次，这条路得有回归测试。
 */
export function migrateSave(raw) {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const num = (v, lo, hi, def) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);
  d.fragments = Math.floor(num(raw.fragments, 0, 1e6, 0));
  if (Array.isArray(raw.owned)) d.owned = [...new Set([...STARTER_CARDS, ...raw.owned.filter((id) => PLAYER_CARD_IDS.includes(id))])];
  if (raw.grades && typeof raw.grades === 'object') for (const [id, g] of Object.entries(raw.grades)) if (CARDS[id] && d.owned.includes(id)) d.grades[id] = Math.floor(num(g, 0, 2, 0));
  if (raw.guardian && typeof raw.guardian === 'object') for (const t of GUARDIAN) d.guardian[t.k] = Math.floor(num(raw.guardian[t.k], 0, t.max, 0));
  const deckName = (s, i) => {
    const t = typeof s === 'string' ? s.trim().slice(0, 8) : '';
    return t || `牌组${DECK_NUM[i] ?? i + 1}`;
  };
  const legalDeck = (arr) => {
    if (!Array.isArray(arr)) return null;
    const deck = arr.filter((id) => d.owned.includes(id));
    return deckProblem(deck) === null ? deck : null;
  };
  const decks = [];
  if (Array.isArray(raw.decks)) {
    for (const slot of raw.decks.slice(0, MAX_DECKS)) {
      if (!slot || typeof slot !== 'object') continue;
      const cards = legalDeck(slot.cards);
      if (!cards) continue;
      decks.push({ name: deckName(slot.name, decks.length), cards });
    }
  }
  if (!decks.length) decks.push({ name: '牌组一', cards: legalDeck(raw.deck) ?? [...STARTER_DECK] });
  d.decks = decks;
  d.deckOn = Number.isInteger(raw.deckOn) && raw.deckOn >= 0 && raw.deckOn < decks.length ? raw.deckOn : 0;
  d.deck = [...decks[d.deckOn].cards];
  const old = !(raw.v >= 2), preSplit = !(raw.v >= 3);
  if (Array.isArray(raw.done)) {
    d.done = raw.done
      .map((id) => (old ? migrateLevelId(id) : id))
      .map((id) => (preSplit ? splitTangSong(id) : id))
      .filter((id) => LEVELS.some((l) => l.id === id));
  }
  d.seenPrologue = !!raw.seenPrologue;
  const chNo = (n) => (preSplit ? shiftChapterNo(old ? OLD_N[n] ?? n : n) : n);
  const pro = new Set(Array.isArray(raw.seenPro)
    ? raw.seenPro.filter((n) => Number.isInteger(n) && n >= 2 && n <= 99).map(chNo) : []);
  if (raw.seenPrologue2) pro.add(chNo(2));   // saves written before the prologue flags were generalised
  if (raw.seenPrologue3) pro.add(chNo(3));
  d.seenPro = [...pro].sort((a, b) => a - b);
  if (Array.isArray(raw.seenBonds)) d.seenBonds = raw.seenBonds.filter((x) => typeof x === 'string');
  if (raw.stats) for (const k of ['wins', 'losses', 'games']) d.stats[k] = Math.floor(num(raw.stats[k], 0, 1e7, 0));
  if (Array.isArray(raw.quizDone)) d.quizDone = [...new Set(raw.quizDone.filter((id) => typeof id === 'string'))];
  if (raw.quizDaily && typeof raw.quizDaily === 'object') {
    const day = typeof raw.quizDaily.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.quizDaily.day) ? raw.quizDaily.day : '';
    d.quizDaily = { day, done: !!raw.quizDaily.done };
  }
  if (raw.settings) {
    const s = raw.settings;
    d.settings.master = num(s.master, 0, 1, d.settings.master);
    d.settings.music = num(s.music, 0, 1, d.settings.music);
    d.settings.sfx = num(s.sfx, 0, 1, d.settings.sfx);
    d.settings.speed = num(s.speed, 0.5, 2, 1);
    d.settings.timer = s.timer !== false;
    d.settings.hints = s.hints !== false;
    d.settings.quality = ['low', 'high'].includes(s.quality) ? s.quality : 'high';
    d.settings.guardianGender = s.guardianGender === 'female' ? 'female' : 'male';
  }
  return d;
}

/** null if the deck is legal, otherwise a Chinese reason. */
export function deckProblem(deck) {
  if (deck.length !== DECK_SIZE) return `牌组需恰好 ${DECK_SIZE} 张（当前 ${deck.length}）`;
  const n = {};
  for (const id of deck) {
    if (!CARDS[id]) return '含有未知卡牌';
    n[id] = (n[id] ?? 0) + 1;
    if (n[id] > MAX_COPIES) return `「${CARDS[id].name}」最多 ${MAX_COPIES} 张`;
  }
  if (!deck.some((id) => CARDS[id].type === 'general')) return '至少需要 1 张灵将';
  return null;
}

/**
 * { deck, out } with `id` swapped in for a card of the same type, or null if it cannot be placed.
 * The card that leaves is the one closest in cost to the newcomer (duplicates first), so a run of
 * unlocks never quietly turns the deck into a pile of six-drops.
 */
export function insertCard(deck, id) {
  const d = CARDS[id];
  if (deck.includes(id)) return null;
  const n = (x) => deck.filter((y) => y === x).length;
  const rank = (x) => Math.abs(CARDS[x].cost - d.cost) * 10 + (n(x) >= 2 ? 0 : 5) + CARDS[x].cost * 0.1;
  const pick = deck.map((x, i) => ({ x, i })).filter(({ x }) => CARDS[x].type === d.type)
    .sort((a, b) => rank(a.x) - rank(b.x))[0];
  if (!pick) return null;
  const next = [...deck]; next[pick.i] = id;
  if (deckProblem(next)) return null;
  return { deck: next, out: pick.x };
}

export function createSave() {
  let data;
  try { data = migrateSave(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { data = defaultSave(); }
  const api = {
    get data() { return data; },
    write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode: progress lives for the session */ } },
    reset() { data = defaultSave(); api.write(); },
    grade(id) { return data.grades[id] ?? 0; },
    grades() { return { ...data.grades }; },
    owns(id) { return data.owned.includes(id); },
    unlock(id) { if (CARDS[id] && !data.owned.includes(id)) { data.owned.push(id); return true; } return false; },
    upgradeCost(id) { const g = api.grade(id); return g >= 2 ? null : UPGRADE_COST[g]; },
    canUpgrade(id) { const c = api.upgradeCost(id); return api.owns(id) && c !== null && data.fragments >= c; },
    upgrade(id) {
      if (!api.canUpgrade(id)) return false;
      data.fragments -= api.upgradeCost(id);
      data.grades[id] = api.grade(id) + 1;
      api.write();
      return true;
    },
    guardianLevel(k) { return data.guardian[k] ?? 0; },
    guardianCost(k) { return guardianCost(k, api.guardianLevel(k)); },
    canGuardian(k) { const c = api.guardianCost(k); return c !== null && data.fragments >= c; },
    upgradeGuardian(k) {
      if (!api.canGuardian(k)) return false;
      data.fragments -= api.guardianCost(k);
      data.guardian[k] = api.guardianLevel(k) + 1;
      api.write();
      return true;
    },
    /** 引擎认识的加成结构，直接塞进 createGame 的 player 里。 */
    boon() { return boonOf(data.guardian); },
    /** 修行是否已经全部点满。 */
    guardianMaxed() { return GUARDIAN.every((t) => api.guardianLevel(t.k) >= t.max); },
    /** 六条路加起来的境界，给主菜单和修行页显示用。 */
    guardianRank() { return guardianRank(data.guardian); },
    deckName() { return data.decks[data.deckOn]?.name ?? '牌组'; },
    /** Put a newly unlocked card into the active deck in place of the cheapest duplicate of the same type. Returns the replaced id. */
    autoInsert(id) {
      const r = insertCard(data.deck, id);
      if (!r) return null;
      data.deck = r.deck;
      if (data.decks[data.deckOn]) data.decks[data.deckOn].cards = [...r.deck];
      return r.out;
    },
    setDeck(deck) {
      if (deckProblem(deck)) return false;
      const cards = [...deck];
      data.deck = cards;
      if (data.decks[data.deckOn]) data.decks[data.deckOn].cards = [...cards];
      api.write();
      return true;
    },
    /** 换成另一套已经组好的牌。不合法的不能拿去打。 */
    useDeck(i) {
      const slot = data.decks[i];
      if (!slot || deckProblem(slot.cards)) return false;
      data.deckOn = i;
      data.deck = [...slot.cards];
      api.write();
      return true;
    },
    /** 按当前出战牌组复制一套，并立刻改用它。满了返回 -1。 */
    addDeck(cards) {
      if (data.decks.length >= MAX_DECKS) return -1;
      const src = cards && deckProblem(cards) === null ? cards : data.deck;
      const i = data.decks.length;
      data.decks.push({ name: `牌组${DECK_NUM[i] ?? i + 1}`, cards: [...src] });
      data.deckOn = i;
      data.deck = [...src];
      api.write();
      return i;
    },
    renameDeck(i, name) {
      const slot = data.decks[i];
      if (!slot) return false;
      const t = String(name ?? '').trim().slice(0, 8);
      if (!t) return false;
      slot.name = t;
      api.write();
      return true;
    },
    removeDeck(i) {
      if (data.decks.length <= 1 || !data.decks[i]) return false;
      data.decks.splice(i, 1);
      if (i < data.deckOn) data.deckOn--;
      else if (data.deckOn >= data.decks.length) data.deckOn = data.decks.length - 1;
      data.deck = [...data.decks[data.deckOn].cards];
      api.write();
      return true;
    },
    sawPrologue(n) { return n === 1 ? data.seenPrologue : data.seenPro.includes(n); },
    markPrologue(n) { if (n === 1) data.seenPrologue = true; else if (!data.seenPro.includes(n)) data.seenPro.push(n); },
    complete(levelId) { if (!data.done.includes(levelId)) data.done.push(levelId); },
    isDone(levelId) { return data.done.includes(levelId); },
    levelOpen(i) { return i === 0 || data.done.includes(LEVELS[i - 1].id); },
  };
  return api;
}
