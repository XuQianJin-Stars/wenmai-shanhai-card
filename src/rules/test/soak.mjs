// AI-vs-AI soak: `npm run soak [games]`. Catches rule crashes and reports balance numbers
// (first-player win rate, game length, deck matchups, story difficulty with the starter deck).
import { createGame } from '../engine.js';
import { createAI, playTurn } from '../ai.js';
import { LEVELS, PRACTICE, STARTER_DECK } from '../../data/story.js';
import { insertCard } from '../../game/save.js';

const N = +(process.argv[2] ?? 200);
const decks = { starter: STARTER_DECK, ...Object.fromEntries(PRACTICE.map((p) => [p.id, p.enemy.deck])) };

function run(cfg, levels, seed) {
  const s = createGame({ seed, ...cfg });
  const ais = [createAI({ level: levels[0], seed: seed * 3 + 1 }), createAI({ level: levels[1], seed: seed * 7 + 2 })];
  let guard = 0;
  while (!s.over && guard++ < 200) playTurn(s, ais[s.active]);
  return { winner: s.over ? s.winner : -1, turns: s.turn, s };
}

let errors = 0;
const t0 = Date.now();
// 1) mirror-ish matchups: first-player advantage and length
{
  const names = Object.keys(decks);
  let firstWins = 0, games = 0, turns = 0, draws = 0, deckouts = 0;
  const table = {};
  for (let g = 0; g < N; g++) {
    const a = names[g % names.length], b = names[Math.floor(g / names.length) % names.length];
    const first = g % 2;
    try {
      const r = run({ first, players: [{ deck: decks[a] }, { deck: decks[b] }] }, ['normal', 'normal'], 1000 + g);
      games++; turns += r.turns;
      if (r.winner < 0) draws++;
      else {
        if (r.winner === first) firstWins++;
        const w = r.winner === 0 ? a : b, l = r.winner === 0 ? b : a;
        table[w] = table[w] ?? { w: 0, l: 0 }; table[w].w++;
        table[l] = table[l] ?? { w: 0, l: 0 }; table[l].l++;
      }
      if (r.s.players.some((P) => P.fatigue)) deckouts++;
    } catch (e) { errors++; if (errors < 5) console.error(`game ${g}:`, e.stack); }
  }
  console.log(`matchups: ${games} games, first-player win ${(100 * firstWins / Math.max(1, games - draws)).toFixed(1)}%, ` +
    `avg ${(turns / games).toFixed(1)} turns (≈${(turns / games / 2).toFixed(1)} each), unfinished ${draws}, deck-outs ${deckouts}`);
  for (const [k, v] of Object.entries(table)) console.log(`  ${k.padEnd(10)} ${v.w}-${v.l}  (${(100 * v.w / (v.w + v.l)).toFixed(0)}%)`);
}
// 2) story levels: starter deck (normal AI playing for the human) vs each level's configured AI.
//    The boss is also measured with the deck a player realistically has by then (ch1-1/ch1-2 unlocks + 25 fragments spent).
const PROGRESSED = { deck: STARTER_DECK.map((id, i) => (id === 'FL-002' ? 'LJ-001' : id === 'LJ-007' && i === 0 ? 'LJ-002' : id === 'WM-001' ? 'FL-005' : id)),
  grades: { 'LJ-004': 1, 'LJ-006': 1 } };
// Chapter 2 is measured with the deck the player has by then: every earlier unlock auto-inserted (as the game does) plus
// the upgrades ~50 fragments buy. Each level gets the unlocks of the levels before it.
/**
 * The deck and upgrades a player realistically holds when they reach `upTo`: every earlier reward
 * auto-inserted exactly as the game does, and the fragments those levels paid out spent on upgrades
 * (珍品 10 → unlocks the active skill, 极品 25). Without this the sim badly understates late-game power.
 */
const progressAt = (upTo) => {
  let deck = [...STARTER_DECK], frag = 0;
  for (const L of LEVELS) {
    if (L.id === upTo) break;
    frag += L.reward.fragments;
    for (const id of L.reward.unlock) deck = insertCard(deck, id)?.deck ?? deck;
  }
  const grades = {};
  const uniq = [...new Set(deck)];
  for (const cost of [10, 25]) for (const id of uniq) {           // everything to 珍品 first, then 极品
    if (frag < cost || (grades[id] ?? 0) !== (cost === 10 ? 0 : 1)) continue;
    frag -= cost; grades[id] = (grades[id] ?? 0) + 1;
  }
  return { deck, grades };
};
const late = LEVELS.filter((L) => L.chapter > 1).map((L) => ({ ...L, deckOverride: progressAt(L.id) }));
for (const L of [...LEVELS.filter((L) => !L.chapter), { ...LEVELS[2], id: 'ch1-3+', title: '首领关（带解锁与升阶）', progressed: true }, ...late]) {
  let wins = 0, games = 0, turns = 0;
  const n = Math.max(20, Math.floor(N / 4));
  for (let g = 0; g < n; g++) {
    try {
      const first = L.playerFirst ? 0 : 1;
      const r = run({ first, players: [
        L.deckOverride ?? (L.progressed ? PROGRESSED : null) ?? { deck: L.playerDeck ?? STARTER_DECK, ordered: !!L.ordered },
        { deck: L.enemy.deck, hp: L.enemy.hp, passive: L.enemy.passive, grades: L.enemy.grades },
      ] }, ['normal', L.ai], 5000 + g);
      games++; turns += r.turns; if (r.winner === 0) wins++;
    } catch (e) { errors++; if (errors < 5) console.error(`${L.id} game ${g}:`, e.stack); }
  }
  console.log(`${L.id} ${L.title}: player(normal AI) wins ${(100 * wins / games).toFixed(0)}%, avg ${(turns / games).toFixed(1)} turns`);
}
console.log(`errors: ${errors}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
process.exit(errors ? 1 : 0);
