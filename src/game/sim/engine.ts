/**
 * Deterministic, DOM-free simulation of a Politique 2027 match.
 *
 * The renderer, the HUD and the audio only ever read this state and drain
 * `state.events`; everything that changes the outcome of a match happens here,
 * which is what lets the unit tests and the balance bot run it headlessly.
 */
import { COLS, ROWS, levelDef } from '../data/levels';
import { CAMPS, REINFORCEMENTS, UNITS, enemyDef, rivalsOf } from '../data/units';
import type { CampId, EnemyDef, LevelDef, ProjectileKind, UltimateId, UnitDef } from '../data/types';

export const TICK = 1 / 60;
export const PASSIVE_INTERVAL = 9;
export const PASSIVE_AMOUNT = 25;
export const ULT_CHARGE_TIME = 75;
export const REFUND_RATIO = 0.25;
export const SPAWN_X = COLS + 0.6;
export const STRIKE_DURATION = 6;
export const FRENZY_DURATION = 9;
export const CENSURE_TARGETS = 3;
/** The family-benefits office (CAF) pays out now and then… when the file is complete. */
export const CAF_AMOUNT = 50;
export const CAF_FIRST = 32;
const CAF_COMPLETE_FILE = 0.75;
const MAX_ENEMIES = 70;
const BURST_GAP = 0.14;

export interface Unit {
  id: number;
  def: UnitDef;
  lane: number;
  col: number;
  hp: number;
  /** Main ability cooldown (meaning depends on the ability). */
  timer: number;
  burstLeft: number;
  burstTimer: number;
  /** Seconds left with the microphone cut. */
  silenced: number;
  born: number;
  lastHit: number;
  lastAct: number;
}

export interface Enemy {
  id: number;
  def: EnemyDef;
  camp: CampId;
  lane: number;
  x: number;
  hp: number;
  slowT: number;
  slowF: number;
  auraSlow: number;
  /** True while something is slowing this opponent (read by the renderer). */
  slowed: boolean;
  stunT: number;
  traitTimer: number;
  attacking: boolean;
  /** Motorists only: true once the tank is empty. */
  dry: boolean;
  born: number;
  lastHit: number;
}

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  lane: number;
  x: number;
  speed: number;
  damage: number;
  pierce: number;
  hit: number[];
  slow?: { factor: number; duration: number };
  stun?: number;
}

export interface Card {
  def: UnitDef;
  cooldown: number;
}

export type GameEvent =
  | { type: 'place'; lane: number; col: number; unitId: string }
  | { type: 'remove'; lane: number; col: number; unitId: string; refund: number }
  | { type: 'produce'; lane: number; col: number; amount: number }
  | { type: 'passive'; amount: number }
  | { type: 'shoot'; lane: number; col: number; kind: ProjectileKind }
  | { type: 'hit'; lane: number; x: number; kind: ProjectileKind | 'melee' }
  | { type: 'unitDown'; lane: number; col: number; unitId: string }
  | { type: 'enemyDown'; lane: number; x: number; enemyId: string; camp: CampId; boss: boolean }
  | { type: 'leak'; lane: number; enemyId: string; loss: number }
  | { type: 'wave'; index: number; total: number; big: boolean; final: boolean }
  | { type: 'spawn'; lane: number; enemyId: string; boss: boolean }
  | { type: 'boom'; lane: number; col: number; area: 'lane' | 'square'; unitId: string }
  | { type: 'shout'; lane: number; col: number; unitId: string }
  | { type: 'blast'; lane: number; x: number }
  | { type: 'silence'; lane: number; x: number; range: number }
  | { type: 'checkpoint'; lane: number; col: number }
  | { type: 'hose'; lane: number; col: number }
  | { type: 'dry'; lane: number; x: number }
  | { type: 'tariff'; on: boolean }
  | { type: 'censure'; hits: { lane: number; x: number }[] }
  | { type: 'tax'; lane: number; x: number; amount: number }
  | { type: 'interview'; lane: number; col: number }
  | { type: 'caf'; amount: number }
  | { type: 'ultimate'; id: UltimateId }
  | { type: 'win' }
  | { type: 'lose' };

export type PlaceError = 'over' | 'locked' | 'lane' | 'occupied' | 'cost' | 'cooldown';

interface Spawn {
  at: number;
  enemyId: string;
  lane: number;
  camp: CampId;
}

export interface GameState {
  camp: CampId;
  level: LevelDef;
  seed: number;
  time: number;
  resources: number;
  polls: number;
  grid: (Unit | null)[][];
  units: Unit[];
  enemies: Enemy[];
  projectiles: Projectile[];
  cards: Card[];
  ult: { id: UltimateId; charge: number; strike: number; frenzy: number };
  wave: {
    /** Index of the next wave to launch. */
    next: number;
    nextAt: number;
    lastStart: number;
    pending: Spawn[];
    lastLane: number;
  };
  passiveTimer: number;
  /** Seconds until the family-benefits office next looks at the file. */
  cafTimer: number;
  /** Cost multiplier applied to every card (1 unless tariffs are in force). */
  tariff: number;
  status: 'playing' | 'won' | 'lost';
  stats: { placed: number; kills: number; leaked: number; produced: number; wavesCleared: number };
  events: GameEvent[];
  nextId: number;
  rngState: number;
}

// ───────────────────────────── helpers ─────────────────────────────

/** mulberry32: small, fast and good enough for wave shuffling. */
function rand(state: GameState): number {
  state.rngState = (state.rngState + 0x6d2b79f5) | 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pick<T>(state: GameState, items: readonly T[]): T {
  return items[Math.floor(rand(state) * items.length)];
}

function unitX(unit: Unit): number {
  return unit.col + 0.5;
}

function totalWaves(level: LevelDef): number {
  return level.waves;
}

export function isFinalWaveLaunched(state: GameState): boolean {
  return !state.level.endless && state.wave.next >= totalWaves(state.level);
}

// ───────────────────────────── setup ─────────────────────────────

export interface GameOptions {
  camp: CampId;
  level: number;
  seed?: number;
}

export function createGame(options: GameOptions): GameState {
  const level = levelDef(options.level);
  const camp = CAMPS[options.camp];
  const seed = options.seed ?? 2027;
  const grid: (Unit | null)[][] = [];
  for (let lane = 0; lane < ROWS; lane++) grid.push(new Array<Unit | null>(COLS).fill(null));

  return {
    camp: camp.id,
    level,
    seed,
    time: 0,
    resources: level.startResources,
    polls: level.polls,
    grid,
    units: [],
    enemies: [],
    projectiles: [],
    cards: [...camp.roster.slice(0, level.slots), ...(level.reinforcements ? REINFORCEMENTS : [])].map((id) => ({
      def: UNITS[id],
      cooldown: 0,
    })),
    ult: { id: camp.ultimate, charge: 0, strike: 0, frenzy: 0 },
    wave: { next: 0, nextAt: level.firstWaveAt, lastStart: 0, pending: [], lastLane: -1 },
    passiveTimer: PASSIVE_INTERVAL,
    cafTimer: CAF_FIRST,
    tariff: 1,
    status: 'playing',
    stats: { placed: 0, kills: 0, leaked: 0, produced: 0, wavesCleared: 0 },
    events: [],
    nextId: 1,
    rngState: seed | 0,
  };
}

// ───────────────────────────── player actions ─────────────────────────────

/** What a card costs right now: tariffs round every price up to the next multiple of 5. */
export function costOf(state: GameState, def: UnitDef): number {
  return state.tariff > 1 ? Math.ceil((def.cost * state.tariff) / 5) * 5 : def.cost;
}

export function canPlace(state: GameState, unitId: string, lane: number, col: number): PlaceError | null {
  if (state.status !== 'playing') return 'over';
  const card = state.cards.find((c) => c.def.id === unitId);
  if (!card) return 'locked';
  if (!state.level.lanes.includes(lane) || col < 0 || col >= COLS) return 'lane';
  if (state.grid[lane][col]) return 'occupied';
  if (card.cooldown > 0) return 'cooldown';
  if (state.resources < costOf(state, card.def)) return 'cost';
  return null;
}

export function placeUnit(state: GameState, unitId: string, lane: number, col: number): PlaceError | null {
  const error = canPlace(state, unitId, lane, col);
  if (error) return error;
  const card = state.cards.find((c) => c.def.id === unitId)!;
  const def = card.def;
  const ability = def.ability;
  let timer = 0;
  if (ability.kind === 'generator') timer = ability.firstDelay;
  else if (ability.kind === 'bomb' || ability.kind === 'hose') timer = ability.fuse;
  else if (ability.kind === 'shooter') timer = 0.6;
  else if (ability.kind === 'shout') timer = Math.min(1.5, ability.interval / 2);

  const unit: Unit = {
    id: state.nextId++, def, lane, col, hp: def.hp, timer,
    burstLeft: 0, burstTimer: 0, silenced: 0, born: state.time, lastHit: -9, lastAct: -9,
  };
  state.grid[lane][col] = unit;
  state.units.push(unit);
  state.resources -= costOf(state, def);
  card.cooldown = def.recharge;
  state.stats.placed++;
  state.events.push({ type: 'place', lane, col, unitId });
  return null;
}

/** "Remaniement": dismiss a figure and recover part of its cost. */
export function removeUnit(state: GameState, lane: number, col: number): boolean {
  if (state.status !== 'playing') return false;
  const unit = state.grid[lane]?.[col];
  if (!unit) return false;
  const refund = Math.floor(unit.def.cost * REFUND_RATIO);
  state.resources += refund;
  dropUnit(state, unit);
  state.events.push({ type: 'remove', lane, col, unitId: unit.def.id, refund });
  return true;
}

export function ultimateReady(state: GameState): boolean {
  return state.status === 'playing' && state.ult.charge >= ULT_CHARGE_TIME;
}

export function useUltimate(state: GameState): boolean {
  if (!ultimateReady(state)) return false;
  state.ult.charge = 0;
  switch (state.ult.id) {
    case 'greve':
      // General strike: every opponent stops walking, talking and plotting.
      state.ult.strike = STRIKE_DURATION;
      break;
    case 'dissolution':
      // Everyone back to the voters — and the campaign chest goes with it.
      for (const enemy of state.enemies) {
        enemy.x = SPAWN_X - rand(state) * 0.9;
        enemy.attacking = false;
      }
      state.resources = 0;
      break;
    case 'trocadero':
      // Giant rally: the whole camp speaks twice as fast.
      state.ult.frenzy = FRENZY_DURATION;
      break;
    case 'censure': {
      // No-confidence vote: the three toughest opponents on the board are toppled.
      // Heavyweights survive it, but lose half of their credibility.
      const targets = [...state.enemies].filter((e) => e.x <= COLS + 0.2).sort((a, b) => b.hp - a.hp).slice(0, CENSURE_TARGETS);
      for (const enemy of targets) hurtEnemy(state, enemy, enemy.def.boss ? enemy.def.hp * 0.5 : enemy.hp);
      state.events.push({ type: 'censure', hits: targets.map((e) => ({ lane: e.lane, x: e.x })) });
      break;
    }
  }
  state.events.push({ type: 'ultimate', id: state.ult.id });
  return true;
}

// ───────────────────────────── wave director ─────────────────────────────

export function spawnEnemy(state: GameState, enemyId: string, lane: number, camp: CampId, x = SPAWN_X): Enemy | null {
  if (state.enemies.length >= MAX_ENEMIES) return null;
  const def = enemyDef(enemyId);
  const enemy: Enemy = {
    id: state.nextId++, def, camp: def.camp ?? camp, lane, x, hp: def.hp,
    slowT: 0, slowF: 1, auraSlow: 1, slowed: false, stunT: 0,
    traitTimer: def.trait && 'interval' in def.trait ? def.trait.interval * 0.6 : 0,
    attacking: false, dry: false, born: state.time, lastHit: -9,
  };
  state.enemies.push(enemy);
  // Heavyweights and named guests get an entrance announcement.
  state.events.push({ type: 'spawn', lane, enemyId, boss: !!def.boss || !!def.portrait });
  return enemy;
}

function nextLane(state: GameState): number {
  const lanes = state.level.lanes;
  let lane = pick(state, lanes);
  if (lane === state.wave.lastLane && lanes.length > 1) lane = pick(state, lanes);
  state.wave.lastLane = lane;
  return lane;
}

function launchWave(state: GameState): void {
  const { level, wave } = state;
  const index = wave.next;
  const rivals = rivalsOf(state.camp);
  const final = !level.endless && index === level.waves - 1;
  const big = level.endless ? index % 5 === 4 : level.bigWaves.includes(index);

  let budget = level.baseBudget + level.growth * index;
  if (big) budget = budget * 1.5 + 2;

  const ids: string[] = [];

  // Headliners from the two rival camps.
  if (index >= level.starsFrom) {
    const lieutenants = rivals.flatMap((c) => CAMPS[c].roster).filter((id) => !UNITS[id].boss);
    const count = big ? 2 : rand(state) < 0.6 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const id = pick(state, lieutenants);
      const cost = UNITS[id].attacker!.threat;
      if (cost <= budget + 2) {
        ids.push(`star:${id}`);
        budget -= cost;
      }
    }
  }

  // Anonymous extras fill the rest of the budget.
  const pool = level.pool.filter((p) => p.from <= index);
  let guard = 200;
  while (budget >= 1 && guard-- > 0) {
    const affordable = pool.filter((p) => enemyDef(p.id).threat <= budget);
    if (!affordable.length) break;
    const total = affordable.reduce((sum, p) => sum + p.weight, 0);
    let roll = rand(state) * total;
    let chosen = affordable[0];
    for (const entry of affordable) {
      roll -= entry.weight;
      if (roll <= 0) {
        chosen = entry;
        break;
      }
    }
    ids.push(chosen.id);
    budget -= enemyDef(chosen.id).threat;
  }

  const window = Math.min(20, Math.max(6, 4 + ids.length * 1.3));
  for (const enemyId of ids) {
    wave.pending.push({
      at: state.time + 1.5 + rand(state) * window,
      enemyId,
      lane: nextLane(state),
      camp: pick(state, rivals),
    });
  }

  // Bosses close the show.
  const bossCount = level.endless ? (big ? 1 : 0) : final ? level.bosses : 0;
  if (bossCount > 0) {
    const bosses = rivals.flatMap((c) => CAMPS[c].roster).filter((id) => UNITS[id].boss);
    const first = Math.floor(rand(state) * bosses.length);
    for (let i = 0; i < bossCount; i++) {
      const id = bosses[(first + i) % bosses.length];
      wave.pending.push({
        at: state.time + window * 0.6 + i * 6,
        enemyId: `star:${id}`,
        lane: nextLane(state),
        camp: rivals[0],
      });
    }
  }

  // Named guests (a certain foreign leader) turn up for the finale; every tenth wave in endless mode.
  const guestDue = level.endless ? index % 10 === 9 : final;
  if (guestDue) {
    const invited = (level.guests ?? []).filter((id) => {
      const only = enemyDef(id).onlyAgainst;
      return !only || only === state.camp;
    });
    invited.forEach((enemyId, i) => {
      wave.pending.push({ at: state.time + window * 0.45 + i * 5, enemyId, lane: nextLane(state), camp: rivals[0] });
    });
  }

  wave.pending.sort((a, b) => a.at - b.at);
  wave.lastStart = state.time;
  wave.next = index + 1;
  wave.nextAt = state.time + level.waveGap + (big ? 8 : 0);
  state.events.push({ type: 'wave', index, total: level.waves, big, final });
}

function updateDirector(state: GameState): void {
  const { wave, level } = state;
  const moreWaves = level.endless || wave.next < level.waves;
  if (moreWaves) {
    const boardClear = wave.pending.length === 0 && state.enemies.length === 0;
    const early = wave.next > 0 && boardClear && state.time >= wave.lastStart + 6;
    if (state.time >= wave.nextAt || early) {
      if (wave.next > 0 && boardClear) state.stats.wavesCleared = wave.next;
      launchWave(state);
    }
  }
  while (wave.pending.length && wave.pending[0].at <= state.time) {
    const spawn = wave.pending.shift()!;
    spawnEnemy(state, spawn.enemyId, spawn.lane, spawn.camp);
  }
}

// ───────────────────────────── combat ─────────────────────────────

function dropUnit(state: GameState, unit: Unit): void {
  if (state.grid[unit.lane][unit.col] === unit) state.grid[unit.lane][unit.col] = null;
  const index = state.units.indexOf(unit);
  if (index >= 0) state.units.splice(index, 1);
}

function hurtEnemy(state: GameState, enemy: Enemy, amount: number): void {
  enemy.hp -= amount;
  enemy.lastHit = state.time;
}

function hurtUnit(state: GameState, unit: Unit, amount: number): void {
  unit.hp -= amount;
  unit.lastHit = state.time;
}

function enemiesAhead(state: GameState, lane: number, fromX: number, toX: number): Enemy[] {
  return state.enemies.filter((e) => e.lane === lane && e.hp > 0 && e.x >= fromX && e.x <= toX);
}

function fire(state: GameState, unit: Unit): void {
  const ability = unit.def.ability;
  if (ability.kind !== 'shooter') return;
  for (const offset of ability.lanes ?? [0]) {
    const lane = unit.lane + offset;
    if (!state.level.lanes.includes(lane)) continue;
    state.projectiles.push({
      id: state.nextId++, kind: ability.projectile, lane, x: unitX(unit) + 0.25,
      speed: ability.speed, damage: ability.damage, pierce: ability.pierce ?? 0, hit: [],
      slow: ability.slow, stun: ability.stun,
    });
  }
  unit.lastAct = state.time;
  state.events.push({ type: 'shoot', lane: unit.lane, col: unit.col, kind: ability.projectile });
}

function explode(state: GameState, unit: Unit): void {
  const ability = unit.def.ability;
  if (ability.kind !== 'bomb') return;
  const x = unitX(unit);
  for (const enemy of state.enemies) {
    const inArea =
      ability.area === 'lane'
        ? enemy.lane === unit.lane && enemy.x <= SPAWN_X
        : Math.abs(enemy.lane - unit.lane) <= 1 && Math.abs(enemy.x - x) <= 1.6;
    if (inArea) hurtEnemy(state, enemy, ability.damage);
  }
  if (ability.friendlyFire) {
    for (const ally of state.units) {
      if (ally !== unit && Math.abs(ally.lane - unit.lane) <= 1 && Math.abs(ally.col - unit.col) <= 1) {
        hurtUnit(state, ally, ability.friendlyFire);
      }
    }
  }
  state.events.push({ type: 'boom', lane: unit.lane, col: unit.col, area: ability.area, unitId: unit.def.id });
  dropUnit(state, unit);
}

function updateUnits(state: GameState, dt: number): void {
  // Rallies make every cooldown tick twice as fast.
  const pace = state.ult.frenzy > 0 ? 2 : 1;

  for (const unit of [...state.units]) {
    const ability = unit.def.ability;
    if (unit.silenced > 0) {
      unit.silenced -= dt;
      if (ability.kind !== 'bomb' && ability.kind !== 'hose') continue;
    }

    switch (ability.kind) {
      case 'generator': {
        unit.timer -= dt;
        if (unit.timer <= 0) {
          unit.timer += ability.interval;
          state.resources += ability.amount;
          state.stats.produced += ability.amount;
          unit.lastAct = state.time;
          state.events.push({ type: 'produce', lane: unit.lane, col: unit.col, amount: ability.amount });
        }
        break;
      }
      case 'shooter': {
        unit.timer -= dt * pace;
        if (unit.burstLeft > 0) {
          unit.burstTimer -= dt * pace;
          if (unit.burstTimer <= 0) {
            fire(state, unit);
            unit.burstLeft--;
            unit.burstTimer = BURST_GAP;
          }
        } else if (unit.timer <= 0) {
          const x = unitX(unit);
          const hasTarget = (ability.lanes ?? [0]).some(
            (offset) => enemiesAhead(state, unit.lane + offset, x - 0.3, COLS + 0.2).length > 0,
          );
          if (hasTarget) {
            unit.timer = ability.interval;
            unit.burstLeft = (ability.burst ?? 1) - 1;
            unit.burstTimer = BURST_GAP;
            fire(state, unit);
          }
        }
        break;
      }
      case 'wall': {
        if (ability.healAura) {
          for (const ally of state.units) {
            if (ally === unit || ally.hp >= ally.def.hp) continue;
            if (Math.abs(ally.lane - unit.lane) <= 1 && Math.abs(ally.col - unit.col) <= 1) {
              ally.hp = Math.min(ally.def.hp, ally.hp + ability.healAura * dt);
            }
          }
        }
        if (ability.regen && unit.hp < unit.def.hp) {
          unit.hp = Math.min(unit.def.hp, unit.hp + ability.regen * dt);
        }
        if (ability.checkpoint) {
          unit.timer -= dt;
          if (unit.timer <= 0) {
            const x = unitX(unit);
            const stopped = enemiesAhead(state, unit.lane, x - 0.4, x + 0.75).filter((e) => (e.def.resist ?? 0) < 1);
            if (stopped.length) {
              unit.timer = ability.checkpoint.interval;
              unit.lastAct = state.time;
              for (const enemy of stopped) {
                enemy.stunT = Math.max(enemy.stunT, ability.checkpoint.stun * (1 - (enemy.def.resist ?? 0)));
                enemy.attacking = false;
              }
              state.events.push({ type: 'checkpoint', lane: unit.lane, col: unit.col });
            } else {
              unit.timer = 0.25;
            }
          }
        }
        break;
      }
      case 'bomb': {
        unit.timer -= dt;
        if (unit.timer <= 0) explode(state, unit);
        break;
      }
      case 'hose': {
        unit.timer -= dt;
        if (unit.timer <= 0) {
          for (const enemy of state.enemies) {
            if (enemy.lane !== unit.lane || enemy.x > SPAWN_X) continue;
            if (enemy.def.fire) {
              hurtEnemy(state, enemy, enemy.hp); // the fire is out
              continue;
            }
            const resist = enemy.def.resist ?? 0;
            hurtEnemy(state, enemy, ability.damage);
            enemy.x = Math.min(SPAWN_X, enemy.x + ability.knockback * (1 - resist));
            if (resist < 1) {
              enemy.slowT = Math.max(enemy.slowT, ability.slow.duration * (1 - resist * 0.5));
              enemy.slowF = ability.slow.factor;
            }
            enemy.attacking = false;
          }
          state.events.push({ type: 'hose', lane: unit.lane, col: unit.col });
          dropUnit(state, unit);
        }
        break;
      }
      case 'shout': {
        unit.timer -= dt * pace;
        if (unit.timer <= 0) {
          const x = unitX(unit);
          const targets = enemiesAhead(state, unit.lane, x - 0.3, x + ability.range);
          if (targets.length) {
            unit.timer = ability.interval;
            unit.lastAct = state.time;
            for (const enemy of targets) {
              hurtEnemy(state, enemy, ability.damage);
              const push = ability.knockback * (1 - (enemy.def.resist ?? 0));
              enemy.x = Math.min(SPAWN_X, enemy.x + push);
              enemy.attacking = false;
            }
            state.events.push({ type: 'shout', lane: unit.lane, col: unit.col, unitId: unit.def.id });
          }
        }
        break;
      }
      case 'aura': {
        const x = unitX(unit);
        for (const enemy of enemiesAhead(state, unit.lane, x - 0.3, x + ability.range)) {
          enemy.auraSlow = Math.min(enemy.auraSlow, ability.slow);
          enemy.hp -= ability.dps * dt;
        }
        break;
      }
    }
  }
}

function updateProjectiles(state: GameState, dt: number): void {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const shot = state.projectiles[i];
    const from = shot.x;
    shot.x += shot.speed * dt;

    const targets = state.enemies
      .filter((e) => e.lane === shot.lane && e.hp > 0 && !shot.hit.includes(e.id) && e.x >= from - 0.3 && e.x <= shot.x + 0.25)
      .sort((a, b) => a.x - b.x);

    let spent = false;
    for (const enemy of targets) {
      hurtEnemy(state, enemy, shot.damage);
      const resist = enemy.def.resist ?? 0;
      if (shot.slow && resist < 1) {
        enemy.slowT = Math.max(enemy.slowT, shot.slow.duration * (1 - resist * 0.5));
        enemy.slowF = shot.slow.factor;
      }
      if (shot.stun && resist < 1) {
        enemy.stunT = Math.max(enemy.stunT, shot.stun * (1 - resist));
        enemy.attacking = false;
      }
      shot.hit.push(enemy.id);
      state.events.push({ type: 'hit', lane: shot.lane, x: enemy.x, kind: shot.kind });
      if (shot.pierce-- <= 0) {
        spent = true;
        break;
      }
    }
    if (spent || shot.x > COLS + 1) state.projectiles.splice(i, 1);
  }
}

function updateEnemies(state: GameState, dt: number): void {
  const onStrike = state.ult.strike > 0;

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const def = enemy.def;
    const auraSlow = enemy.auraSlow;
    enemy.auraSlow = 1; // re-applied each tick by the aura owners
    if (enemy.slowT > 0) enemy.slowT -= dt;
    const slow = Math.min(enemy.slowT > 0 ? enemy.slowF : 1, auraSlow);
    enemy.slowed = slow < 1;
    if (onStrike) {
      enemy.attacking = false;
      continue;
    }
    if (enemy.stunT > 0) {
      enemy.stunT -= dt;
      enemy.attacking = false;
      continue;
    }

    const trait = def.trait;
    const reach = trait?.kind === 'ranged' ? trait.range : 0.62;
    // Following the money: only the money-makers are worth stopping for.
    const investigating = trait?.kind === 'investigate';
    let target: Unit | null = null;
    let best = Infinity;
    for (let col = 0; col < COLS; col++) {
      const unit = state.grid[enemy.lane][col];
      if (!unit) continue;
      if (investigating && unit.def.ability.kind !== 'generator') continue;
      const gap = enemy.x - unitX(unit);
      if (gap >= -0.35 && gap <= reach && gap < best) {
        best = gap;
        target = unit;
      }
    }

    if (target) {
      const melee = best <= 0.62;
      if (trait?.kind === 'blast' && melee) {
        // The controversy goes off: everyone nearby takes it, the author leaves the stage.
        for (const unit of state.units) {
          if (Math.abs(unit.lane - enemy.lane) <= 1 && Math.abs(unitX(unit) - enemy.x) <= 1.3) {
            hurtUnit(state, unit, trait.damage);
          }
        }
        state.events.push({ type: 'blast', lane: enemy.lane, x: enemy.x });
        enemy.hp = 0;
        continue;
      }
      if (investigating) {
        // The interview starts: no comment, and no endorsements either while it lasts.
        if (!enemy.attacking) state.events.push({ type: 'interview', lane: target.lane, col: target.col });
        target.silenced = Math.max(target.silenced, 0.25);
      }
      enemy.attacking = true;
      hurtUnit(state, target, def.dps * dt);
      const ability = target.def.ability;
      if (melee && ability.kind === 'wall' && ability.thorns) {
        enemy.hp -= ability.thorns * dt;
      }
    } else {
      enemy.attacking = false;
      let speed = def.speed;
      if (trait?.kind === 'fuel') {
        // Fast out of the gate, then the tank runs dry.
        if (!enemy.dry && SPAWN_X - enemy.x >= trait.range) {
          enemy.dry = true;
          state.events.push({ type: 'dry', lane: enemy.lane, x: enemy.x });
        }
        if (enemy.dry) speed = trait.slowSpeed;
      }
      enemy.x -= speed * slow * dt;
    }

    if (trait?.kind === 'burn') {
      for (const unit of state.units) {
        if (Math.abs(unit.lane - enemy.lane) <= 1 && Math.abs(unitX(unit) - enemy.x) <= trait.radius) {
          hurtUnit(state, unit, trait.dps * dt);
        }
      }
    }

    if (trait && 'interval' in trait && enemy.x < COLS) {
      enemy.traitTimer -= dt;
      if (enemy.traitTimer <= 0) {
        enemy.traitTimer = trait.interval;
        if (trait.kind === 'summon') {
          const lanes = state.level.lanes.filter((l) => Math.abs(l - enemy.lane) <= 1);
          spawnEnemy(state, trait.what, pick(state, lanes), enemy.camp, Math.min(SPAWN_X, enemy.x + 0.4));
        } else if (trait.kind === 'silence') {
          let any = false;
          for (const unit of state.units) {
            const gap = enemy.x - unitX(unit);
            if (unit.lane === enemy.lane && gap >= -0.35 && gap <= trait.range) {
              unit.silenced = trait.duration;
              any = true;
            }
          }
          if (any) state.events.push({ type: 'silence', lane: enemy.lane, x: enemy.x, range: trait.range });
          else enemy.traitTimer = 1;
        } else if (trait.kind === 'tax') {
          const taken = Math.min(state.resources, trait.amount);
          if (taken > 0) {
            state.resources -= taken;
            state.events.push({ type: 'tax', lane: enemy.lane, x: enemy.x, amount: taken });
          }
        }
      }
    }
  }
}

function cleanup(state: GameState): void {
  for (const unit of [...state.units]) {
    if (unit.hp <= 0) {
      dropUnit(state, unit);
      state.events.push({ type: 'unitDown', lane: unit.lane, col: unit.col, unitId: unit.def.id });
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    if (enemy.hp <= 0) {
      state.enemies.splice(i, 1);
      state.stats.kills++;
      state.events.push({
        type: 'enemyDown', lane: enemy.lane, x: enemy.x, enemyId: enemy.def.id, camp: enemy.camp, boss: !!enemy.def.boss,
      });
    } else if (enemy.x < -0.15) {
      state.enemies.splice(i, 1);
      state.polls = Math.max(0, state.polls - enemy.def.leak);
      state.stats.leaked++;
      state.events.push({ type: 'leak', lane: enemy.lane, enemyId: enemy.def.id, loss: enemy.def.leak });
    }
  }

  if (state.polls <= 0) {
    state.status = 'lost';
    state.events.push({ type: 'lose' });
  } else if (isFinalWaveLaunched(state) && state.wave.pending.length === 0 && state.enemies.length === 0) {
    state.status = 'won';
    state.stats.wavesCleared = state.level.waves;
    state.events.push({ type: 'win' });
  }
}

/** Advance the match by one fixed tick. */
export function step(state: GameState, dt: number = TICK): void {
  if (state.status !== 'playing') return;
  state.time += dt;

  state.passiveTimer -= dt;
  if (state.passiveTimer <= 0) {
    state.passiveTimer += PASSIVE_INTERVAL;
    state.resources += PASSIVE_AMOUNT;
    state.events.push({ type: 'passive', amount: PASSIVE_AMOUNT });
  }
  state.cafTimer -= dt;
  if (state.cafTimer <= 0) {
    state.cafTimer = 38 + rand(state) * 20;
    // Three times out of four the transfer arrives; otherwise a document is missing.
    const amount = rand(state) < CAF_COMPLETE_FILE ? CAF_AMOUNT : 0;
    state.resources += amount;
    state.events.push({ type: 'caf', amount });
  }
  for (const card of state.cards) if (card.cooldown > 0) card.cooldown = Math.max(0, card.cooldown - dt);
  if (state.ult.charge < ULT_CHARGE_TIME) state.ult.charge = Math.min(ULT_CHARGE_TIME, state.ult.charge + dt);
  if (state.ult.strike > 0) state.ult.strike -= dt;
  if (state.ult.frenzy > 0) state.ult.frenzy -= dt;

  // Tariffs apply for as long as their author stands in the courtyard.
  let tariff = 1;
  for (const enemy of state.enemies) {
    const trait = enemy.def.trait;
    if (trait?.kind === 'tariff' && enemy.x <= COLS) tariff = Math.max(tariff, trait.factor);
  }
  if (tariff !== state.tariff) {
    state.tariff = tariff;
    state.events.push({ type: 'tariff', on: tariff > 1 });
  }

  updateDirector(state);
  updateUnits(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  cleanup(state);
}

/** 3 stars for a clean sheet, 2 if at least half the polls survive, 1 otherwise. */
export function starsFor(state: GameState): number {
  if (state.status !== 'won') return 0;
  if (state.polls >= state.level.polls) return 3;
  return state.polls * 2 >= state.level.polls ? 2 : 1;
}

export function scoreFor(state: GameState): number {
  return state.stats.kills * 10 + state.polls * 250 + state.stats.wavesCleared * 100;
}
