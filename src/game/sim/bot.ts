/**
 * A deliberately average player used to keep the campaign honest: every level
 * must be winnable by this bot with every camp, and unwinnable by doing nothing.
 * It is only used by the balance script and the tests.
 */
import { COLS } from '../data/levels';
import type { UnitDef } from '../data/types';
import { canPlace, catchPunchline, costOf, placeUnit, ultimateReady, useUltimate, type GameState, type Unit } from './engine';

function freeCol(state: GameState, lane: number, preferred: number[]): number {
  for (const col of preferred) if (!state.grid[lane][col]) return col;
  return -1;
}

function laneUnits(state: GameState, lane: number): Unit[] {
  return state.units.filter((u) => u.lane === lane);
}

function isAttacker(def: UnitDef): boolean {
  return def.ability.kind === 'shooter' || def.ability.kind === 'shout';
}

function laneThreat(state: GameState, lane: number): number {
  return state.enemies.filter((e) => e.lane === lane).reduce((sum, e) => sum + e.hp, 0);
}

function tryPlace(state: GameState, def: UnitDef | undefined, lane: number, cols: number[]): boolean {
  if (!def) return false;
  const col = freeCol(state, lane, cols);
  if (col < 0) return false;
  if (canPlace(state, def.id, lane, col)) return false;
  return placeUnit(state, def.id, lane, col) === null;
}

/** Call a couple of times per simulated second. Places at most one figure per call. */
export function botAct(state: GameState): void {
  if (state.status !== 'playing') return;
  // The debate: an average player sends back three soundbites out of five, after a moment.
  for (const line of [...state.punchlines]) {
    if (line.id % 5 < 3 && line.max - line.life > 1.6) catchPunchline(state, line.lane, line.col);
  }
  const lanes = state.level.lanes;
  const cards = state.cards.map((c) => c.def);
  const roster = cards.filter((d) => d.camp !== 'neutre');
  const generator = roster.find((d) => d.ability.kind === 'generator');
  const shooter = roster.find((d) => d.slot === 1);
  const walls = cards.filter((d) => d.ability.kind === 'wall');
  const support = roster.find((d) => d.slot === 5) ?? roster.find((d) => d.slot === 3);
  const bomb = roster.find((d) => d.ability.kind === 'bomb');
  const boss = roster.find((d) => d.boss);
  const hose = cards.find((d) => d.ability.kind === 'hose');

  // Ultimate: when the courtyard gets crowded close to the steps.
  if (ultimateReady(state)) {
    const close = state.enemies.filter((e) => e.x < 4.5).length;
    const bossClose = state.enemies.some((e) => e.def.boss && e.x < 5.5);
    const affordable = state.ult.id !== 'dissolution' || state.resources < 125;
    if ((close >= 4 || bossClose) && affordable) useUltimate(state);
  }

  // Fire brigade: a burning bin is rolling in, or a lane is overrun.
  if (hose) {
    for (const lane of lanes) {
      const here = state.enemies.filter((e) => e.lane === lane && e.x < COLS);
      const fire = here.some((e) => e.def.fire && e.x < 7);
      const swamped = here.filter((e) => e.x < 3).length >= 3;
      if ((fire || swamped) && tryPlace(state, hose, lane, [8, 7, 6, 5, 4, 3, 2, 1])) return;
    }
  }

  // Bombs: only when they pay for themselves.
  if (bomb && bomb.ability.kind === 'bomb') {
    if (bomb.ability.area === 'lane') {
      const lane = [...lanes].sort((a, b) => laneThreat(state, b) - laneThreat(state, a))[0];
      const count = state.enemies.filter((e) => e.lane === lane && e.x < COLS).length;
      if (laneThreat(state, lane) >= 900 || count >= 4) {
        if (tryPlace(state, bomb, lane, [8, 7, 6, 5, 4, 3])) return;
      }
    } else {
      let best = { score: 0, lane: -1, col: -1 };
      for (const lane of lanes) {
        for (let col = 1; col < COLS; col++) {
          if (state.grid[lane][col]) continue;
          const hit = state.enemies.filter((e) => Math.abs(e.lane - lane) <= 1 && Math.abs(e.x - (col + 0.5)) <= 1.4);
          const score = hit.reduce((sum, e) => sum + Math.min(e.hp, 650), 0);
          if (score > best.score) best = { score, lane, col };
        }
      }
      if (best.score >= 900 && !canPlace(state, bomb.id, best.lane, best.col)) {
        placeUnit(state, bomb.id, best.lane, best.col);
        return;
      }
    }
  }

  // Never leave an attacked lane without someone who can answer.
  const exposed = lanes
    .filter((lane) => laneThreat(state, lane) > 0 && !laneUnits(state, lane).some((u) => isAttacker(u.def)))
    .sort((a, b) => {
      const nearest = (lane: number) => Math.min(...state.enemies.filter((e) => e.lane === lane).map((e) => e.x));
      return nearest(a) - nearest(b);
    });
  if (exposed.length) {
    tryPlace(state, shooter, exposed[0], [2, 3, 1, 4]);
    return; // save up rather than spend elsewhere
  }

  // Economy.
  const generators = state.units.filter((u) => u.def.ability.kind === 'generator').length;
  const generatorTarget = Math.min(lanes.length + 1, 2 + Math.floor(state.time / 22));
  if (generator && generators < generatorTarget) {
    const lane = [...lanes].sort(
      (a, b) =>
        laneUnits(state, a).filter((u) => u.def.ability.kind === 'generator').length -
        laneUnits(state, b).filter((u) => u.def.ability.kind === 'generator').length,
    )[0];
    if (tryPlace(state, generator, lane, [0, 1])) return;
    if (state.resources < costOf(state, generator)) return;
  }

  // Reinforce the lane under the most pressure.
  const pressured = [...lanes].sort((a, b) => laneThreat(state, b) - laneThreat(state, a));
  for (const lane of pressured) {
    const threat = laneThreat(state, lane);
    if (threat <= 0) break;
    const here = laneUnits(state, lane);
    const attackers = here.filter((u) => isAttacker(u.def)).length;
    const nearest = Math.min(...state.enemies.filter((e) => e.lane === lane).map((e) => e.x));

    if (!here.some((u) => u.def.ability.kind === 'wall') && threat > 350 && nearest < 7.5) {
      const col = Math.max(3, Math.min(6, Math.floor(nearest) - 1));
      const cols = [col, col - 1, col + 1].filter((c) => c >= 2 && c < COLS);
      for (const wall of walls) if (tryPlace(state, wall, lane, cols)) return;
    }
    if (threat > attackers * 420) {
      if (support && !here.some((u) => u.def.id === support.id) && tryPlace(state, support, lane, [4, 3, 5])) return;
      if (boss && threat > 900 && tryPlace(state, boss, lane, [3, 2, 4])) return;
      if (tryPlace(state, shooter, lane, [2, 3, 1, 4, 5])) return;
    }
  }

  // Quiet moment: thicken the line, starting with the thinnest lane.
  if (state.resources >= 200) {
    const thinnest = [...lanes].sort(
      (a, b) =>
        laneUnits(state, a).filter((u) => isAttacker(u.def)).length -
        laneUnits(state, b).filter((u) => isAttacker(u.def)).length,
    )[0];
    const attackers = laneUnits(state, thinnest).filter((u) => isAttacker(u.def)).length;
    if (boss && attackers >= 1 && state.resources >= costOf(state, boss) + 50) {
      const middle = lanes[Math.floor(lanes.length / 2)];
      if (tryPlace(state, boss, state.grid[middle][3] ? thinnest : middle, [3, 2, 4])) return;
    }
    if (attackers < 3) tryPlace(state, shooter, thinnest, [2, 3, 1, 4, 5]);
  }
}
