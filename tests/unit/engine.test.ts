import { describe, expect, it } from 'vitest';
import { LAST_LEVEL, LEVELS } from '../../src/game/data/levels';
import { CAMP_IDS, type CampId } from '../../src/game/data/types';
import { CAMPS, EXTRAS, GUESTS, REINFORCEMENTS, UNITS, categoryOf } from '../../src/game/data/units';
import { botAct } from '../../src/game/sim/bot';
import {
  PASSIVE_AMOUNT, PASSIVE_INTERVAL, REFUND_RATIO, SPAWN_X, TICK, ULT_CHARGE_TIME,
  costOf, createGame, placeUnit, removeUnit, spawnEnemy, starsFor, step, useUltimate, type GameState,
} from '../../src/game/sim/engine';
import { GAME_STRINGS, LANGS } from '../../src/i18n/game';

function run(state: GameState, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / TICK) && state.status === 'playing'; i++) step(state);
}

function play(camp: CampId, level: number, seed: number, idle = false): GameState {
  const state = createGame({ camp, level, seed });
  let tick = 0;
  while (state.status === 'playing' && state.time < 900) {
    if (!idle && tick % 20 === 0) botAct(state);
    step(state);
    state.events.length = 0;
    tick++;
  }
  return state;
}

describe('data', () => {
  it('has four camps of six figures in unlock order', () => {
    expect(CAMP_IDS).toHaveLength(4);
    for (const camp of CAMP_IDS) {
      const roster = CAMPS[camp].roster.map((id) => UNITS[id]);
      expect(roster).toHaveLength(6);
      expect(roster.map((u) => u.slot)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(roster.every((u) => u.camp === camp && u.attacker)).toBe(true);
      expect(roster[0].ability.kind).toBe('generator');
      expect(roster[2].ability.kind).toBe('wall');
      expect(roster[5].boss).toBe(true);
    }
  });

  it('has a French and an English text, with at least one line, for every figure and extra', () => {
    for (const lang of LANGS) {
      const t = GAME_STRINGS[lang];
      for (const id of Object.keys(UNITS)) {
        expect(t.figures[id], `${lang}:${id}`).toBeDefined();
        expect(t.figures[id].lines.length).toBeGreaterThan(0);
      }
      for (const id of Object.keys(EXTRAS)) expect(t.extras[id], `${lang}:${id}`).toBeTruthy();
      for (const level of [0, ...LEVELS.map((l) => l.id)]) expect(t.levels[level], `${lang}:level ${level}`).toBeDefined();
    }
  });
});

describe('placing figures', () => {
  it('starts with the level budget and only the unlocked cards', () => {
    const state = createGame({ camp: 'gauche', level: 1 });
    expect(state.resources).toBe(LEVELS[0].startResources);
    expect(state.cards.map((c) => c.def.id)).toEqual(['glucksmann', 'hollande', 'roussel']);
  });

  it('adds the public-service reinforcements once the street level opens them', () => {
    const state = createGame({ camp: 'autres', level: 3 });
    expect(state.cards.map((c) => c.def.id)).toEqual(['bmacron', 'villepin', 'lassalle', 'tondelier', ...REINFORCEMENTS]);
  });

  it('charges the cost and starts the card cooldown', () => {
    const state = createGame({ camp: 'centre', level: 1 });
    expect(placeUnit(state, 'attal', 2, 3)).toBeNull();
    expect(state.resources).toBe(LEVELS[0].startResources - UNITS.attal.cost);
    expect(state.grid[2][3]?.def.id).toBe('attal');
    expect(placeUnit(state, 'attal', 2, 4)).toBe('cooldown');
  });

  it('refuses invalid placements', () => {
    const state = createGame({ camp: 'droite', level: 1 });
    expect(placeUnit(state, 'lepen', 2, 0)).toBe('locked');
    expect(placeUnit(state, 'bardella', 0, 0)).toBe('lane'); // level 1 only opens lanes 1-3
    expect(placeUnit(state, 'bardella', 2, 0)).toBeNull();
    expect(placeUnit(state, 'ciotti', 2, 0)).toBe('occupied');
    state.resources = 0;
    expect(placeUnit(state, 'ciotti', 2, 1)).toBe('cost');
  });

  it('refunds part of the cost on a reshuffle', () => {
    const state = createGame({ camp: 'gauche', level: 1 });
    placeUnit(state, 'hollande', 2, 2);
    const before = state.resources;
    expect(removeUnit(state, 2, 2)).toBe(true);
    expect(state.resources).toBe(before + Math.floor(UNITS.hollande.cost * REFUND_RATIO));
    expect(state.grid[2][2]).toBeNull();
    expect(removeUnit(state, 2, 2)).toBe(false);
  });
});

describe('economy', () => {
  it('pays the passive income and the generators', () => {
    const state = createGame({ camp: 'centre', level: 1 });
    placeUnit(state, 'bayrou', 2, 0);
    const afterPlacing = state.resources;
    run(state, PASSIVE_INTERVAL + 0.1);
    // one passive tick + one Bayrou payout (first delay 5 s)
    expect(state.resources).toBe(afterPlacing + PASSIVE_AMOUNT + 25);
  });
});

describe('combat', () => {
  it('lets a shooter take down an activist before it reaches the steps', () => {
    const state = createGame({ camp: 'droite', level: 1 });
    placeUnit(state, 'bardella', 2, 0);
    spawnEnemy(state, 'militant', 2, 'gauche');
    run(state, 20);
    expect(state.enemies).toHaveLength(0);
    expect(state.stats.kills).toBe(1);
    expect(state.polls).toBe(5);
  });

  it('costs poll points when an opponent reaches the steps', () => {
    const state = createGame({ camp: 'gauche', level: 1 });
    spawnEnemy(state, 'pundit', 2, 'droite', 1);
    run(state, 5);
    expect(state.polls).toBe(4);
    expect(state.stats.leaked).toBe(1);
  });

  it('ends the match when the polls hit zero', () => {
    const state = createGame({ camp: 'gauche', level: 1 });
    for (let i = 0; i < 5; i++) spawnEnemy(state, 'pundit', 1 + (i % 3), 'droite', 0.5);
    run(state, 5);
    expect(state.status).toBe('lost');
    expect(starsFor(state)).toBe(0);
  });

  it('clears a whole lane with the 49.3', () => {
    const state = createGame({ camp: 'centre', level: 6 });
    for (let i = 0; i < 4; i++) spawnEnemy(state, 'placard', 2, 'gauche', 4 + i);
    spawnEnemy(state, 'placard', 3, 'gauche', 5);
    expect(placeUnit(state, 'borne', 2, 1)).toBeNull();
    run(state, 1.5);
    expect(state.enemies.map((e) => e.lane)).toEqual([3]);
    expect(state.grid[2][1]).toBeNull();
  });

  it('fires on three lanes at the same time with Macron', () => {
    const state = createGame({ camp: 'centre', level: 6 });
    state.resources = 500;
    placeUnit(state, 'macron', 2, 0);
    spawnEnemy(state, 'militant', 2, 'droite', 6);
    run(state, 0.8);
    expect(new Set(state.projectiles.map((p) => p.lane))).toEqual(new Set([1, 2, 3]));
  });

  it('walls hold the line', () => {
    const state = createGame({ camp: 'droite', level: 1 });
    placeUnit(state, 'ciotti', 2, 4);
    spawnEnemy(state, 'militant', 2, 'centre', 6);
    run(state, 25);
    expect(state.polls).toBe(5);
    expect(state.enemies[0].x).toBeGreaterThan(4);
  });

  it('Riner throws back whoever comes within reach', () => {
    const state = createGame({ camp: 'autres', level: 6 });
    state.resources = 500;
    placeUnit(state, 'riner', 2, 2);
    const enemy = spawnEnemy(state, 'placard', 2, 'droite', 3.2)!;
    run(state, 2.2);
    expect(enemy.x).toBeGreaterThan(4.5);
    expect(enemy.hp).toBeLessThan(EXTRAS.placard.hp);
  });

  it('Lassalle recovers on his own', () => {
    const state = createGame({ camp: 'autres', level: 1 });
    placeUnit(state, 'lassalle', 2, 3);
    const unit = state.grid[2][3]!;
    unit.hp = 200;
    run(state, 5);
    expect(unit.hp).toBeGreaterThan(250);
  });
});

describe('street events and reinforcements', () => {
  it('a burning bin scorches nearby figures until the fire brigade puts it out', () => {
    const state = createGame({ camp: 'gauche', level: 3 });
    placeUnit(state, 'hollande', 2, 2);
    const bin = spawnEnemy(state, 'poubelle', 2, 'droite', 3.2)!;
    const unit = state.grid[2][2]!;
    run(state, 2);
    expect(unit.hp).toBeLessThan(UNITS.hollande.hp);

    expect(placeUnit(state, 'pompiers', 2, 6)).toBeNull();
    run(state, 1);
    expect(state.enemies).not.toContain(bin);
    expect(state.grid[2][6]).toBeNull(); // the truck leaves once the job is done
  });

  it('the fire hose soaks and pushes back everyone else in the lane', () => {
    const state = createGame({ camp: 'centre', level: 3 });
    const enemy = spawnEnemy(state, 'militant', 2, 'droite', 4)!;
    const other = spawnEnemy(state, 'militant', 3, 'droite', 4)!;
    placeUnit(state, 'pompiers', 2, 0);
    run(state, 1);
    expect(enemy.x).toBeGreaterThan(4.6);
    expect(enemy.slowed).toBe(true);
    expect(other.x).toBeLessThan(4);
  });

  it('the riot police line checks papers: whoever is in contact stands still', () => {
    const state = createGame({ camp: 'droite', level: 3 });
    placeUnit(state, 'crs', 2, 3);
    const enemy = spawnEnemy(state, 'lyceen', 2, 'gauche', 4.1)!;
    run(state, 1.2);
    expect(enemy.stunT).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'checkpoint')).toBe(true);
  });

  it('motorists race in, then run out of petrol', () => {
    const state = createGame({ camp: 'gauche', level: 3 });
    const car = spawnEnemy(state, 'auto', 2, 'droite')!;
    run(state, 4);
    expect(car.dry).toBe(false);
    expect(SPAWN_X - car.x).toBeGreaterThan(2);
    run(state, 6);
    expect(car.dry).toBe(true);
    const x = car.x;
    run(state, 2);
    expect(x - car.x).toBeLessThan(0.3);
  });

  it('tariffs make every card dearer while their author is on the board', () => {
    const state = createGame({ camp: 'droite', level: 5 });
    expect(costOf(state, UNITS.bardella)).toBe(100);
    const guest = spawnEnemy(state, 'trump', 2, 'gauche', 8)!;
    run(state, 0.1);
    expect(state.tariff).toBe(1.25);
    expect(costOf(state, UNITS.bardella)).toBe(125);
    expect(costOf(state, UNITS.sarkozy)).toBe(95); // 93.75 rounded up to the next 5
    state.resources = 110;
    expect(placeUnit(state, 'bardella', 1, 0)).toBe('cost');
    guest.hp = 0;
    run(state, 0.1);
    expect(state.tariff).toBe(1);
    expect(placeUnit(state, 'bardella', 1, 0)).toBeNull();
  });
});

describe('money, taxes and guests', () => {
  it('sorts every card into one of four families', () => {
    const family = (id: string) => categoryOf(UNITS[id]);
    expect(['bayrou', 'sarkozy', 'bmacron'].map(family)).toEqual(['money', 'money', 'money']);
    expect(['attal', 'melenchon', 'borne', 'lepen'].map(family)).toEqual(['attack', 'attack', 'attack', 'attack']);
    expect(['lemaire', 'royal', 'tondelier', 'pompiers'].map(family)).toEqual(['effect', 'effect', 'effect', 'effect']);
    expect(['ciotti', 'roussel', 'riner', 'crs'].map(family)).toEqual(['defence', 'defence', 'defence', 'defence']);
  });

  it('the tax inspector withholds at source for as long as he is on the board', () => {
    const state = createGame({ camp: 'centre', level: 3 });
    const before = state.resources;
    const inspector = spawnEnemy(state, 'impots', 2, 'droite', 8)!;
    run(state, 8.5); // two withholdings, and no other income yet
    expect(state.resources).toBe(before - 20);
    inspector.hp = 0;
    run(state, 0.3);
    expect(state.resources).toBe(before - 20);
  });

  it('the investigative reporter walks past every figure to question the money-makers', () => {
    const state = createGame({ camp: 'centre', level: 6 });
    state.resources = 1000;
    expect(placeUnit(state, 'bayrou', 2, 0)).toBeNull(); // money
    expect(placeUnit(state, 'philippe', 2, 4)).toBeNull(); // a wall she does not stop for
    const reporter = spawnEnemy(state, 'lucet', 2, 'droite', 5.2)!;
    const bayrou = state.grid[2][0]!;
    const wall = state.grid[2][4]!;
    run(state, 5);
    expect(reporter.x).toBeLessThan(4.5); // straight past the wall…
    expect(wall.hp).toBe(wall.def.hp); // …without a word to it
    run(state, 16);
    expect(reporter.attacking).toBe(true); // …and on to the money
    expect(state.events.some((e) => e.type === 'interview' && e.lane === 2 && e.col === 0)).toBe(true);
    // While the interview lasts the money-maker brings in nothing.
    // (Unquestioned, it would have paid out within these three seconds: see the 7.5 s interval.)
    const produced = state.stats.produced;
    run(state, 3);
    expect(bayrou.hp).toBeGreaterThan(0);
    expect(bayrou.silenced).toBeGreaterThan(0);
    expect(state.stats.produced).toBe(produced);
  });

  it('the rolling-news van keeps bringing pundits', () => {
    const state = createGame({ camp: 'gauche', level: 4 });
    spawnEnemy(state, 'cnews', 2, 'droite', 8.5);
    run(state, 12);
    expect(state.enemies.filter((e) => e.def.id === 'pundit').length).toBeGreaterThanOrEqual(2);
  });

  it('a trade unionist puts the figure he debates with on strike', () => {
    const state = createGame({ camp: 'gauche', level: 3 });
    state.resources = 1000;
    expect(placeUnit(state, 'hollande', 2, 3)).toBeNull();
    const hollande = state.grid[2][3]!;
    spawnEnemy(state, 'syndicat', 2, 'droite', 4.3);
    run(state, 1);
    expect(state.events.some((e) => e.type === 'picket' && e.col === 3)).toBe(true);
    const shots = state.projectiles.length;
    run(state, 3);
    expect(hollande.silenced).toBeGreaterThan(0);
    expect(state.projectiles.length).toBeLessThanOrEqual(shots); // no new speech while on strike
  });

  it('a minimum-wage worker walks past everyone, and winning him over pays', () => {
    const state = createGame({ camp: 'centre', level: 6 });
    state.resources = 1000;
    expect(placeUnit(state, 'philippe', 2, 6)).toBeNull();
    const voter = spawnEnemy(state, 'smicard', 2, 'droite', 7.2)!;
    run(state, 4);
    expect(voter.x).toBeLessThan(6.3); // through the wall without stopping
    const before = state.resources;
    voter.hp = 0;
    run(state, TICK);
    expect(state.events.some((e) => e.type === 'wonOver' && e.amount === 15)).toBe(true);
    expect(state.resources - before).toBeGreaterThanOrEqual(15);
  });

  it('the red carpet speeds up whoever walks behind its owner', () => {
    const state = createGame({ camp: 'gauche', level: 2 });
    spawnEnemy(state, 'lisnard', 2, 'droite', 6);
    const behind = spawnEnemy(state, 'militant', 2, 'droite', 8)!;
    const elsewhere = spawnEnemy(state, 'militant', 3, 'droite', 8)!;
    run(state, 2);
    expect(8 - behind.x).toBeCloseTo((8 - elsewhere.x) * 1.5, 1);
  });

  it('the Zucman tax, when it passes, sends the CAC 40 bosses on the board away for their share', () => {
    const outcomes = new Set<boolean>();
    for (let seed = 1; seed <= 12 && outcomes.size < 2; seed++) {
      const state = createGame({ camp: 'gauche', level: 4, seed });
      spawnEnemy(state, 'patron', 1, 'droite', 8.6);
      spawnEnemy(state, 'patron', 3, 'droite', 8.6);
      const before = state.resources;
      run(state, 26); // the first vote comes after 25 s
      const vote = state.events.find((e) => e.type === 'zucman');
      expect(vote).toBeDefined();
      if (vote?.type !== 'zucman') continue;
      outcomes.add(vote.adopted);
      const bosses = state.enemies.filter((e) => e.def.id === 'patron').length;
      if (vote.adopted) {
        expect(vote.exiles).toHaveLength(2);
        expect(bosses).toBe(0);
        expect(state.resources - before).toBeGreaterThanOrEqual(50);
      } else {
        expect(bosses).toBe(2);
      }
    }
    expect(outcomes).toEqual(new Set([true, false])); // it passes… or not
  });

  it('the benefits office looks at the file from time to time', () => {
    const state = createGame({ camp: 'gauche', level: 2, seed: 5 });
    run(state, 100); // the first look at the file comes after 32 s, the next 38 to 58 s later
    const transfers = state.events.filter((e) => e.type === 'caf');
    expect(transfers.length).toBeGreaterThanOrEqual(2);
    expect(transfers.every((e) => e.type === 'caf' && (e.amount === 0 || e.amount === 50))).toBe(true);
  });

  it('gives every guest a portrait, a name and a line in both languages', () => {
    for (const id of GUESTS) {
      expect(EXTRAS[id].portrait).toBe(id);
      for (const lang of LANGS) expect(GAME_STRINGS[lang].figures[id].lines.length).toBeGreaterThan(0);
    }
  });

  it('a guest who took a public stand against one camp only turns up against that camp', () => {
    const invited = (camp: CampId) => {
      const state = createGame({ camp, level: 3, seed: 11 });
      const seen = new Set<string>();
      let tick = 0;
      while (state.status === 'playing' && state.time < 600) {
        if (tick++ % 20 === 0) botAct(state);
        step(state);
        for (const e of state.events) if (e.type === 'spawn') seen.add(e.enemyId);
        state.events.length = 0;
      }
      return seen.has('squeezie');
    };
    expect(invited('droite')).toBe(true);
    expect(invited('gauche')).toBe(false);
    expect(invited('centre')).toBe(false);
  });
});

describe('camp ultimates', () => {
  function charged(camp: CampId): GameState {
    const state = createGame({ camp, level: 6 });
    state.ult.charge = ULT_CHARGE_TIME;
    return state;
  }

  it('is not available before it is charged', () => {
    expect(useUltimate(createGame({ camp: 'gauche', level: 6 }))).toBe(false);
  });

  it('general strike freezes every opponent', () => {
    const state = charged('gauche');
    const enemy = spawnEnemy(state, 'militant', 2, 'droite', 5)!;
    expect(useUltimate(state)).toBe(true);
    run(state, 2);
    expect(enemy.x).toBe(5);
  });

  it('dissolution sends everyone back and empties the chest', () => {
    const state = charged('centre');
    const enemy = spawnEnemy(state, 'militant', 2, 'droite', 2)!;
    useUltimate(state);
    expect(enemy.x).toBeGreaterThan(8.5);
    expect(state.resources).toBe(0);
  });

  it('the Trocadéro rally doubles the rate of fire', () => {
    const fired = (rally: boolean) => {
      const state = charged('droite');
      placeUnit(state, 'bardella', 2, 0);
      spawnEnemy(state, 'bus', 2, 'gauche', 8);
      if (rally) useUltimate(state);
      run(state, 6);
      return state.events.filter((e) => e.type === 'shoot').length;
    };
    expect(fired(true)).toBeGreaterThan(fired(false) * 1.6);
  });

  it('a no-confidence vote topples the three toughest opponents and halves a heavyweight', () => {
    const state = charged('autres');
    spawnEnemy(state, 'militant', 1, 'droite', 5);
    spawnEnemy(state, 'placard', 2, 'droite', 5);
    spawnEnemy(state, 'bus', 3, 'droite', 5);
    const boss = spawnEnemy(state, 'star:macron', 4, 'centre', 5)!;
    useUltimate(state);
    run(state, 0.05);
    expect(state.enemies.map((e) => e.def.id).sort()).toEqual(['militant', 'star:macron']);
    expect(boss.hp).toBeCloseTo(UNITS.macron.attacker!.hp / 2, 0);
  });
});

describe('campaign balance', () => {
  it('ends on the run-off', () => {
    expect(LAST_LEVEL).toBe(7);
  });

  it('is deterministic for a given seed', () => {
    const a = play('centre', 2, 99);
    const b = play('centre', 2, 99);
    expect([a.status, a.time, a.polls, a.stats.kills]).toEqual([b.status, b.time, b.polls, b.stats.kills]);
  });

  for (const level of LEVELS) {
    for (const camp of CAMP_IDS) {
      it(`level ${level.id} is winnable as ${camp} and lost by standing still`, () => {
        const outcomes = [7919, 15838, 23757].map((seed) => play(camp, level.id, seed).status);
        expect(outcomes.filter((s) => s === 'won').length).toBeGreaterThanOrEqual(2);
        expect(play(camp, level.id, 4242, true).status).toBe('lost');
      });
    }
  }
});
