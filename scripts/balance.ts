/**
 * Balance report: plays every level with every camp using the reference bot,
 * over several seeds, and prints win rate / polls left / duration.
 *
 *   npm run balance            # 8 seeds per pairing
 *   npm run balance -- 20      # 20 seeds per pairing
 *   npm run balance -- 8 hard  # hard mode (bigger waves)
 *   npm run balance -- 8 easy  # easy mode (smaller waves, softer opponents)
 */
import { LEVELS } from '../src/game/data/levels';
import { CAMP_IDS } from '../src/game/data/types';
import { botAct } from '../src/game/sim/bot';
import { TICK, createGame, step, type GameState } from '../src/game/sim/engine';

const seeds = Number(process.argv[2] ?? 8);
const hard = process.argv.includes('hard');
const easy = process.argv.includes('easy');
const MAX_TIME = 900;

export function simulate(camp: (typeof CAMP_IDS)[number], level: number, seed: number, idle = false): GameState {
  const state = createGame({ camp, level, seed, hard, easy });
  let tick = 0;
  while (state.status === 'playing' && state.time < MAX_TIME) {
    if (!idle && tick % 20 === 0) botAct(state);
    step(state, TICK);
    state.events.length = 0;
    tick++;
  }
  return state;
}

const rows: Record<string, string | number>[] = [];
for (const level of LEVELS) {
  for (const camp of CAMP_IDS) {
    let wins = 0;
    let polls = 0;
    let time = 0;
    for (let s = 1; s <= seeds; s++) {
      const result = simulate(camp, level.id, s * 7919);
      if (result.status === 'won') wins++;
      polls += result.polls;
      time += result.time;
    }
    const idle = simulate(camp, level.id, 4242, true);
    rows.push({
      level: level.id,
      camp,
      'bot wins': `${wins}/${seeds}`,
      'avg polls': (polls / seeds).toFixed(1),
      'avg time': `${Math.round(time / seeds)}s`,
      idle: idle.status,
    });
  }
}
console.table(rows);
