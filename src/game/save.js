// Progress save (localStorage). Everything is validated on load so a hand-edited or stale save can never break the game.
import { CARDS, UPGRADE_COST, PLAYER_CARD_IDS } from '../data/cards.js';
import { STARTER_CARDS, STARTER_DECK, DECK_SIZE, MAX_COPIES, LEVELS } from '../data/story.js';

const KEY = 'wenmai_save_v1';

export function defaultSave() {
  return {
    v: 1,
    fragments: 0,
    owned: [...STARTER_CARDS],        // card ids the player may put in a deck
    grades: {},                       // id → 0 | 1 | 2  (凡 / 灵 / 圣)
    deck: [...STARTER_DECK],
    done: [],                         // completed level ids
    seenPrologue: false,              // chapter 1 prologue (kept as its own flag for older saves)
    seenPro: [],                      // chapter numbers ≥2 whose prologue has been watched
    seenBonds: [],                    // bond ids whose culture note has been shown
    stats: { wins: 0, losses: 0, games: 0 },
    settings: { master: 0.8, music: 0.7, sfx: 0.9, speed: 1, timer: true, quality: 'high', hints: true },
  };
}

function validate(raw) {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const num = (v, lo, hi, def) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);
  d.fragments = Math.floor(num(raw.fragments, 0, 1e6, 0));
  if (Array.isArray(raw.owned)) d.owned = [...new Set([...STARTER_CARDS, ...raw.owned.filter((id) => PLAYER_CARD_IDS.includes(id))])];
  if (raw.grades && typeof raw.grades === 'object') for (const [id, g] of Object.entries(raw.grades)) if (CARDS[id] && d.owned.includes(id)) d.grades[id] = Math.floor(num(g, 0, 2, 0));
  if (Array.isArray(raw.deck)) {
    const deck = raw.deck.filter((id) => d.owned.includes(id));
    if (deckProblem(deck) === null) d.deck = deck;
  }
  if (Array.isArray(raw.done)) d.done = raw.done.filter((id) => LEVELS.some((l) => l.id === id));
  d.seenPrologue = !!raw.seenPrologue;
  const pro = new Set(Array.isArray(raw.seenPro) ? raw.seenPro.filter((n) => Number.isInteger(n) && n >= 2 && n <= 99) : []);
  if (raw.seenPrologue2) pro.add(2);   // saves written before the prologue flags were generalised
  if (raw.seenPrologue3) pro.add(3);
  d.seenPro = [...pro].sort((a, b) => a - b);
  if (Array.isArray(raw.seenBonds)) d.seenBonds = raw.seenBonds.filter((x) => typeof x === 'string');
  if (raw.stats) for (const k of ['wins', 'losses', 'games']) d.stats[k] = Math.floor(num(raw.stats[k], 0, 1e7, 0));
  if (raw.settings) {
    const s = raw.settings;
    d.settings.master = num(s.master, 0, 1, d.settings.master);
    d.settings.music = num(s.music, 0, 1, d.settings.music);
    d.settings.sfx = num(s.sfx, 0, 1, d.settings.sfx);
    d.settings.speed = num(s.speed, 0.5, 2, 1);
    d.settings.timer = s.timer !== false;
    d.settings.hints = s.hints !== false;
    d.settings.quality = ['low', 'high'].includes(s.quality) ? s.quality : 'high';
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
  try { data = validate(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { data = defaultSave(); }
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
    /** Put a newly unlocked card into the deck in place of the cheapest duplicate of the same type. Returns the replaced id. */
    autoInsert(id) {
      const r = insertCard(data.deck, id);
      if (!r) return null;
      data.deck = r.deck;
      return r.out;
    },
    setDeck(deck) { if (deckProblem(deck)) return false; data.deck = [...deck]; api.write(); return true; },
    sawPrologue(n) { return n === 1 ? data.seenPrologue : data.seenPro.includes(n); },
    markPrologue(n) { if (n === 1) data.seenPrologue = true; else if (!data.seenPro.includes(n)) data.seenPro.push(n); },
    complete(levelId) { if (!data.done.includes(levelId)) data.done.push(levelId); },
    isDone(levelId) { return data.done.includes(levelId); },
    levelOpen(i) { return i === 0 || data.done.includes(LEVELS[i - 1].id); },
  };
  return api;
}
