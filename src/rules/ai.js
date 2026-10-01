// AI opponent (AISystem). One-ply search: simulate every legal action on a cloned state, score the result, take the
// best until "end turn" scores highest. Difficulty adds noise and, on hard, looks one reply-attack ahead.
import { act, legalActions, atkOf, defOf, opp, heroReduction, isGuard } from './engine.js';
import { card } from '../data/cards.js';
import { mulberry32 } from './rng.js';

const clone = (s) => structuredClone(s);

function unitValue(s, u) {
  const a = atkOf(s, u), d = defOf(s, u);
  let v = a * 1.1 + d * 0.8 + u.hp * 0.7 + 1.5;
  for (const x of u.st) {
    if (x.k === 'stun') v -= 1.5 + a * 0.4;
    else if (x.k === 'seal') v -= 0.6;
    else if (x.k === 'bleed') v -= 1.2;
    else if (x.k === 'dodge') v += 1.5;
    else if (x.k === 'immune') v += 0.8;
    else if (x.k === 'reflect') v += 0.8;
  }
  if (u.grade >= 1 && card(u.id).skill) v += 1;
  return v;
}

/** Board threat that side `i` can bring against the other hero next turn (ignores blockers for a pessimistic read). */
function threat(s, i) {
  const P = s.players[i], O = s.players[opp(i)];
  if (O.board.some(isGuard)) return 0;
  const atks = P.board.filter((u) => !u.st.some((x) => x.k === 'stun')).map((u) => atkOf(s, u)).sort((a, b) => b - a).slice(0, 2);
  const red = heroReduction(s, opp(i));
  return atks.reduce((t, a) => t + (a <= 2 ? a : Math.max(2, a - red)), 0);
}

export function evaluate(s, me) {
  if (s.over) return s.winner === me ? 1e6 : -1e6;
  const P = s.players[me], O = s.players[opp(me)];
  let v = 0;
  v += P.hp * 1.1 - O.hp * 1.5;
  if (O.hp <= 8) v += (8 - O.hp) * 1.2;           // press toward lethal
  for (const u of P.board) v += unitValue(s, u);
  for (const u of O.board) v -= unitValue(s, u) * 1.05;
  for (const w of P.wenmai) v += 1.4 + card(w.id).cost * 0.6;
  for (const w of O.wenmai) v -= 1.4 + card(w.id).cost * 0.6;
  for (const w of P.zhen ?? []) v += 1.6 + card(w.id).cost * 0.5;
  for (const w of O.zhen ?? []) v -= 1.6 + card(w.id).cost * 0.5;
  v += P.hand.length * 0.9 - O.hand.length * 0.5;
  for (const k of ['metal', 'wood', 'water', 'fire', 'earth']) { if (P.res[k]) v += 1.5; if (O.res[k]) v -= 1.5; }
  if (P.barrierTurns) v += 1.5;
  const oppThreat = threat(s, opp(me));
  if (oppThreat >= P.hp) v -= 40;
  else v -= oppThreat * 0.3;
  if (!P.deck.length) v -= 6;
  return v;
}

export function createAI({ level = 'normal', seed = 1 } = {}) {
  const rng = mulberry32(seed);
  const noise = level === 'easy' ? 3 : level === 'normal' ? 0.6 : 0;
  function score(s, a, me) {
    const c = clone(s);
    act(c, a);
    let v = evaluate(c, me);
    if (level === 'hard' && a.type !== 'end' && !c.over) {
      // pessimistic peek: after this action, what does ending the turn cost us?
      const e = clone(c);
      act(e, { type: 'end' });
      v = v * 0.7 + evaluate(e, me) * 0.3;
    }
    return v + (rng() * 2 - 1) * noise;
  }
  return {
    level,
    /** Pick the next action for the active player. */
    choose(s) {
      const me = s.active;
      const acts = legalActions(s);
      const base = evaluate(s, me) + (level === 'easy' ? 0.5 : 0.05);
      let best = { type: 'end' }, bestV = base;
      for (const a of acts) {
        if (a.type === 'end') continue;
        const v = score(s, a, me);
        if (v > bestV) { bestV = v; best = a; }
      }
      return best;
    },
  };
}

/** Run the active player's whole turn with `ai` (tests / autoplay). Returns all events. */
export function playTurn(s, ai, limit = 60) {
  const me = s.active, all = [];
  for (let k = 0; k < limit && !s.over && s.active === me; k++) all.push(...act(s, ai.choose(s)));
  if (!s.over && s.active === me) all.push(...act(s, { type: 'end' }));
  return all;
}
