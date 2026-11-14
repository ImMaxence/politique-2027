import { describe, expect, it } from 'vitest';
import { ENDLESS, LAST_LEVEL, LEVELS, VERSUS } from '../../src/game/data/levels';
import { CAMP_IDS, DIFFICULTIES, type CampId, type Difficulty } from '../../src/game/data/types';
import {
  CAMPS, DECK_SIZE, EXTRAS, GUESTS, REINFORCEMENTS, TIER_BOOST, UNITS, canMerge, cardPool, categoryOf, headlinerOf, reinforcementsFor, tierDef, transfugesFor,
} from '../../src/game/data/units';
import { botAct } from '../../src/game/sim/bot';
import {
  EASY_HP, EASY_START, PASSIVE_AMOUNT, PASSIVE_INTERVAL, REFUND_RATIO, RULE_VOTES, SPAWN_X, TICK, ULT_CHARGE_TIME,
  canPlace, costOf, createGame, mergeCost, placeUnit, playOn, removeUnit, spawnEnemy, starsFor, step, useUltimate, type GameState,
} from '../../src/game/sim/engine';
import { PORTRAIT_IDS } from '../../src/game/render/portraits';
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
  it('has four camps of six figures in unlock order: a headliner with powers, then an effect figure', () => {
    expect(CAMP_IDS).toHaveLength(4);
    for (const camp of CAMP_IDS) {
      const roster = CAMPS[camp].roster.map((id) => UNITS[id]);
      expect(roster).toHaveLength(6);
      expect(roster.map((u) => u.slot)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(categoryOf(roster[5])).toBe('effect');
      expect(headlinerOf(camp)).toBe(roster[4].id);
      expect(roster.every((u) => u.camp === camp && u.attacker)).toBe(true);
      expect(roster[0].ability.kind).toBe('generator');
      expect(roster[2].ability.kind).toBe('wall');
      expect(roster[3].ability.kind).toBe('bomb');
      expect(roster[4].boss).toBe(true);
      expect(roster[4].attacker!.powers!.length).toBeGreaterThan(0);
    }
  });

  it('has a photo head for every named figure, and a credit for every photo', async () => {
    const { PHOTOS, CREDITS } = await import('../../src/game/data/photos');
    for (const id of [...CAMP_IDS.flatMap((c) => CAMPS[c].roster), ...GUESTS]) expect(PHOTOS[id], id).toContain('neutral');
    for (const [id, faces] of Object.entries(PHOTOS)) {
      for (const face of faces) {
        const credit = CREDITS.find((c) => c.id === id && c.expression === face);
        expect(credit, `${id}-${face}`).toBeDefined();
        expect(credit!.author && credit!.license && credit!.source.startsWith('https://commons.wikimedia.org/')).toBeTruthy();
      }
    }
  });

  it('gives every night a goal and both languages a name for it', () => {
    for (const level of [...LEVELS, ENDLESS, VERSUS]) {
      for (const lang of LANGS) expect(GAME_STRINGS[lang].goals[level.goal], `${lang}:${level.id}`).toBeDefined();
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
    expect(state.cards.map((c) => c.def.id)).toEqual(['glucksmann', 'hollande', 'royal']);
  });

  it('adds the public-service reinforcements once the school blockade opens them, then one more every night', () => {
    const state = createGame({ camp: 'autres', level: 3 });
    expect(state.cards.map((c) => c.def.id)).toEqual(['bmacron', 'villepin', 'lassalle', 'poutou', 'crs', 'pompiers']);
    expect(reinforcementsFor(5)).toEqual(['crs', 'pompiers', 'radar']);
    expect(reinforcementsFor(9)).toEqual(REINFORCEMENTS);
    expect(reinforcementsFor(0)).toEqual(REINFORCEMENTS);
    expect(createGame({ camp: 'gauche', level: 5 }).cards.map((c) => c.def.id)).toEqual([...CAMPS.gauche.roster.slice(0, 5), 'crs', 'pompiers', 'radar']);
  });

  it('takes the chosen deck from night 6: at most eight cards, turncoats but no rival headliner', () => {
    const pool = cardPool('centre', 7, 6, true);
    expect(pool.length).toBeGreaterThan(DECK_SIZE);
    expect(createGame({ camp: 'centre', level: 7 }).cards).toHaveLength(DECK_SIZE);
    expect(transfugesFor('centre', 5, 5)).toEqual([]);
    expect(transfugesFor('centre', 7, 6)).toContain('ciotti');
    expect(transfugesFor('centre', 7, 6)).not.toContain('lepen');
    const deck = ['bayrou', 'samu', 'boulangere', 'ciotti', 'lepen', 'nobody', 'macron'];
    expect(createGame({ camp: 'centre', level: 7, deck }).cards.map((c) => c.def.id)).toEqual(['bayrou', 'samu', 'boulangere', 'ciotti', 'macron']);
  });

  it('the same figure played on itself goes up a level, for more than the card costs', () => {
    const state = createGame({ camp: 'droite', level: 2 });
    state.resources = 2000;
    const def = UNITS.bardella;
    const ready = () => (state.cards.find((c) => c.def.id === 'bardella')!.cooldown = 0);
    expect(placeUnit(state, 'bardella', 2, 2)).toBeNull();
    const unit = state.grid[2][2]!;
    unit.hp = 10;
    ready();
    expect(playOn(state, 'bardella', 2, 2)).toEqual({ tier: 2, cost: mergeCost(state, def, 2) });
    expect(mergeCost(state, def, 2)).toBeGreaterThan(def.cost);
    const before = state.resources;
    expect(placeUnit(state, 'bardella', 2, 2)).toBeNull();
    expect(state.units).toHaveLength(1);
    expect(unit.tier).toBe(2);
    expect(state.resources).toBe(before - mergeCost(state, def, 2));
    expect(unit.def.hp).toBe(Math.round(def.hp * TIER_BOOST[2].hp));
    expect(unit.hp).toBe(unit.def.hp); // all its credibility back
    const [a, b] = [unit.def.ability, def.ability];
    expect(a.kind === 'shooter' && b.kind === 'shooter' && a.damage > b.damage && a.interval < b.interval).toBe(true);
    expect(state.events.some((e) => e.type === 'merge' && e.tier === 2)).toBe(true);
    // Level 3 is the top; another figure cannot go there at all.
    ready();
    expect(mergeCost(state, def, 3)).toBeGreaterThan(mergeCost(state, def, 2));
    expect(placeUnit(state, 'bardella', 2, 2)).toBeNull();
    expect(unit.tier).toBe(3);
    ready();
    expect(canPlace(state, 'bardella', 2, 2)).toBe('maxed');
    expect(canPlace(state, 'sarkozy', 2, 2)).toBe('occupied');
    expect(state.stats).toMatchObject({ placed: 1, merged: 2, maxed: 1 });
    // Taking it off refunds part of everything spent on it.
    const spent = unit.spent;
    expect(spent).toBe(def.cost + mergeCost(state, def, 2) + mergeCost(state, def, 3));
    const left = state.resources;
    removeUnit(state, 2, 2);
    expect(state.resources).toBe(left + Math.floor(spent * REFUND_RATIO));
  });

  it('every card has a puppet for the board, reinforcements included', () => {
    for (const id of Object.keys(UNITS)) expect(PORTRAIT_IDS).toContain(id);
  });

  it('every hit reports the damage it does, levels included', () => {
    const state = createGame({ camp: 'droite', level: 2 });
    state.resources = 2000;
    placeUnit(state, 'bardella', 2, 0);
    spawnEnemy(state, 'militant', 2, 'gauche', 4);
    run(state, 4);
    const hits = state.events.filter((e) => e.type === 'damage');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toMatchObject({ type: 'damage', lane: 2, amount: 20 });
    state.cards.find((c) => c.def.id === 'bardella')!.cooldown = 0;
    placeUnit(state, 'bardella', 2, 0);
    state.events.length = 0;
    spawnEnemy(state, 'militant', 2, 'gauche', 4);
    run(state, 4);
    // A shot fired before the merge keeps its 20; the next ones take off 30.
    expect(state.events.some((e) => e.type === 'damage' && e.amount === 30)).toBe(true);
  });

  it('a merge costs what it says, and one-shot cards never merge', () => {
    const state = createGame({ camp: 'droite', level: 2 });
    state.resources = 2000;
    expect(placeUnit(state, 'bardella', 1, 1)).toBeNull();
    state.resources = mergeCost(state, UNITS.bardella, 2) - 1;
    state.cards.find((c) => c.def.id === 'bardella')!.cooldown = 0;
    expect(canPlace(state, 'bardella', 1, 1)).toBe('cost');
    expect(canMerge(UNITS.profs)).toBe(false);
    expect(canMerge(UNITS.pompiers)).toBe(false);
    expect(canMerge(UNITS.bayrou)).toBe(true);
    // Votes stay round numbers.
    for (const id of ['bayrou', 'sarkozy', 'glucksmann', 'bmacron', 'boulangere']) {
      const a = tierDef(UNITS[id], 3).ability;
      expect(a.kind === 'generator' && a.amount % 5 === 0).toBe(true);
    }
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
    expect(placeUnit(state, 'retailleau', 2, 0)).toBe('occupied');
    state.resources = 0;
    expect(placeUnit(state, 'retailleau', 2, 1)).toBe('cost');
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
    placeUnit(state, 'retailleau', 2, 4);
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
    expect(['pompiers'].map(family)).toEqual(['effect']);
    expect(['retailleau', 'royal', 'riner', 'crs'].map(family)).toEqual(['defence', 'defence', 'defence', 'defence']);
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

  it('zero tolerance: whoever comes near Retailleau slows right down', () => {
    const state = createGame({ camp: 'droite', level: 1 });
    expect(placeUnit(state, 'retailleau', 2, 2)).toBeNull();
    const near = spawnEnemy(state, 'militant', 2, 'gauche', 3.8)!;
    const free = spawnEnemy(state, 'militant', 3, 'gauche', 3.8)!;
    run(state, 1);
    expect(3.8 - near.x).toBeCloseTo((3.8 - free.x) * 0.6, 2);
  });

  it('the Zucman tax, when it passes, sends the CAC 40 bosses on the board away for their share', () => {
    const outcomes = new Set<boolean>();
    for (let seed = 1; seed <= 12 && outcomes.size < 2; seed++) {
      const state = createGame({ camp: 'gauche', level: 6, seed });
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

  it('hard mode sends bigger waves, and nothing else changes', () => {
    const spawned = (hard: boolean) => {
      const state = createGame({ camp: 'centre', level: 6, seed: 3, hard });
      let count = 0;
      while (state.time < 150) {
        step(state);
        count += state.events.filter((e) => e.type === 'spawn').length;
        state.events.length = 0;
        state.polls = 99; // keep the idle match going
      }
      return { count, start: state.level.startResources };
    };
    const normal = spawned(false);
    const hard = spawned(true);
    expect(hard.count).toBeGreaterThan(normal.count * 1.15);
    expect(hard.start).toBe(normal.start);
  });

  it('easy mode sends smaller waves of softer opponents, with more votes to start with', () => {
    const spawned = (easy: boolean) => {
      const state = createGame({ camp: 'centre', level: 6, seed: 3, easy });
      const start = state.resources;
      let count = 0;
      while (state.time < 150) {
        step(state);
        count += state.events.filter((e) => e.type === 'spawn').length;
        state.events.length = 0;
        state.polls = 99; // keep the idle match going
      }
      return { count, start, state };
    };
    const normal = spawned(false);
    const easy = spawned(true);
    expect(easy.count).toBeLessThan(normal.count * 0.85);
    expect(easy.start).toBe(normal.start + EASY_START);
    const soft = createGame({ camp: 'centre', level: 6, easy: true });
    expect(spawnEnemy(soft, 'militant', 2, 'gauche')!.hp).toBe(Math.round(EXTRAS.militant.hp * EASY_HP));
    // Hard wins over easy if both are asked for.
    expect(createGame({ camp: 'centre', level: 6, easy: true, hard: true }).easy).toBe(false);
  });

  it('five difficulties, from very easy to extreme, in order', () => {
    const night = (difficulty: Difficulty) => {
      const state = createGame({ camp: 'centre', level: 6, seed: 3, difficulty });
      const start = state.resources;
      let count = 0;
      while (state.time < 150) {
        step(state);
        count += state.events.filter((e) => e.type === 'spawn').length;
        state.events.length = 0;
        state.polls = 99;
      }
      const militant = spawnEnemy(createGame({ camp: 'centre', level: 6, difficulty }), 'militant', 2, 'gauche')!.hp;
      return { count, start, militant };
    };
    const nights = DIFFICULTIES.map(night);
    for (let i = 1; i < nights.length; i++) {
      expect(nights[i].count).toBeGreaterThanOrEqual(nights[i - 1].count);
      expect(nights[i].start).toBeLessThanOrEqual(nights[i - 1].start);
      expect(nights[i].militant).toBeGreaterThanOrEqual(nights[i - 1].militant);
    }
    expect(nights[4].count).toBeGreaterThan(nights[0].count * 2);
    expect(createGame({ camp: 'centre', level: 6, difficulty: 'extreme' }).hard).toBe(true); // counts as hard for the achievement
    expect(createGame({ camp: 'centre', level: 6, hard: true }).difficulty).toBe('hard'); // the old shorthand still works
  });

  it('the rules of the day do what they say', () => {
    // Double votes: the trickle and the "Votes" figures bring in twice as much.
    const votes = createGame({ camp: 'centre', level: 2, rule: 'doubleVotes' });
    const before = votes.resources;
    run(votes, PASSIVE_INTERVAL + 0.05);
    expect(votes.resources - before).toBe(PASSIVE_AMOUNT * RULE_VOTES);
    // No reshuffle: a figure cannot be taken off.
    const stay = createGame({ camp: 'centre', level: 2, rule: 'noRemove' });
    placeUnit(stay, 'attal', 2, 2);
    expect(removeUnit(stay, 2, 2)).toBe(false);
    expect(stay.grid[2][2]).not.toBeNull();
    // Sales: 30% off, longer recharge.
    const sale = createGame({ camp: 'centre', level: 2, rule: 'sale' });
    expect(costOf(sale, UNITS.attal)).toBe(Math.ceil((UNITS.attal.cost * 0.7) / 5) * 5);
    placeUnit(sale, 'attal', 2, 2);
    expect(sale.cards.find((c) => c.def.id === 'attal')!.cooldown).toBeCloseTo(UNITS.attal.recharge * 1.5);
    // Hard heads: tougher opponents, more votes to start with.
    const tough = createGame({ camp: 'centre', level: 2, rule: 'tough' });
    expect(tough.resources).toBe(LEVELS[1].startResources + 150);
    expect(spawnEnemy(tough, 'militant', 2, 'gauche')!.hp).toBe(Math.round(EXTRAS.militant.hp * 1.3));
    // Merges at cost: a level costs the card's price.
    const merge = createGame({ camp: 'droite', level: 2, rule: 'cheapMerge' });
    expect(mergeCost(merge, UNITS.bardella, 3)).toBe(UNITS.bardella.cost);
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
      const state = createGame({ camp, level: 7, seed: 11 });
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

describe('the newcomers', () => {
  function board(camp: CampId = 'gauche'): GameState {
    const state = createGame({ camp, level: 0, seed: 3 });
    state.resources = 5000;
    return state;
  }

  it('the speed camera flashes its whole lane and slows everyone down', () => {
    const state = board();
    state.cards.push({ def: UNITS.radar, cooldown: 0 });
    expect(placeUnit(state, 'radar', 2, 1)).toBeNull();
    const a = spawnEnemy(state, 'militant', 2, 'droite', 5)!;
    const b = spawnEnemy(state, 'militant', 2, 'droite', 8)!;
    run(state, 1.2);
    expect(state.events.some((e) => e.type === 'flash')).toBe(true);
    expect(a.slowed && b.slowed).toBe(true);
    expect(a.hp).toBeLessThan(EXTRAS.militant.hp);
  });

  it('the paramedics give their neighbours credibility back', () => {
    const state = board();
    state.cards.push({ def: UNITS.samu, cooldown: 0 });
    placeUnit(state, 'royal', 2, 3);
    const royal = state.grid[2][3]!;
    royal.hp = 100;
    expect(placeUnit(state, 'samu', 2, 2)).toBeNull();
    run(state, 1.2);
    expect(royal.hp).toBeGreaterThanOrEqual(160);
  });

  it('the teachers send the pupils back to class, and the Council censors the toughest opponent', () => {
    const state = board();
    state.cards.push({ def: UNITS.profs, cooldown: 0 }, { def: UNITS.conseil, cooldown: 0 });
    const pupil = spawnEnemy(state, 'lyceen', 1, 'droite', 6)!;
    const placard = spawnEnemy(state, 'placard', 1, 'droite', 7)!;
    expect(placeUnit(state, 'profs', 1, 0)).toBeNull();
    run(state, 1.2);
    expect(state.enemies).not.toContain(pupil);
    expect(placard.hp).toBe(EXTRAS.placard.hp - 320);
    const bus = spawnEnemy(state, 'bus', 3, 'droite', 6)!;
    spawnEnemy(state, 'militant', 3, 'droite', 5);
    expect(placeUnit(state, 'conseil', 3, 0)).toBeNull();
    run(state, 1.4);
    expect(bus.hp).toBeLessThan(EXTRAS.bus.hp * 0.5);
  });

  it('Frexit sends the frontmost opponent back to the gate; Ciotti locks the door', () => {
    const state = board('autres');
    expect(placeUnit(state, 'philippot', 2, 0)).toBeNull();
    const front = spawnEnemy(state, 'militant', 2, 'droite', 3)!;
    run(state, 1.1);
    expect(front.x).toBeGreaterThan(8.5);
    const locked = board('droite');
    expect(placeUnit(locked, 'ciotti', 2, 2)).toBeNull();
    const near = spawnEnemy(locked, 'militant', 2, 'gauche', 4.4)!;
    run(locked, 1.6);
    expect(near.stunT).toBeGreaterThan(1);
  });
});

describe("headliners' powers", () => {
  /** A board with a figure in front of the boss, the boss on stage and its powers ready. */
  function stage(boss: string, camp: CampId = 'autres'): { state: GameState; enemy: ReturnType<typeof spawnEnemy> } {
    const state = createGame({ camp, level: 7, seed: 5 });
    state.resources = 5000;
    const enemy = spawnEnemy(state, boss, 2, 'droite', 6.2)!;
    enemy.powerTimers = enemy.powerTimers.map(() => 0.05);
    return { state, enemy };
  }

  it('announces a power before it lands, and stands still meanwhile', () => {
    const { state, enemy } = stage('star:melenchon');
    placeUnit(state, 'villepin', 2, 4);
    run(state, 0.2);
    expect(enemy!.cast?.kind).toBe('roar');
    expect(state.events.some((e) => e.type === 'cast' && e.power === 'roar')).toBe(true);
    const x = enemy!.x;
    run(state, 0.5);
    expect(enemy!.x).toBe(x);
    run(state, 0.6);
    expect(state.grid[2][4]!.silenced).toBeGreaterThan(1.5); // "La République, c'est moi !"
  });

  it('Mélenchon sends a hologram to another lane', () => {
    const { state } = stage('star:melenchon');
    run(state, 3);
    const holo = state.enemies.find((e) => e.def.id === 'hologram');
    expect(holo).toBeDefined();
    expect(holo!.lane).not.toBe(2);
    expect(holo!.def.ghost).toBe(true);
  });

  it('Macron crosses the street when a figure stands in his way, and dissolves the squares ahead', () => {
    const { state, enemy } = stage('star:macron');
    placeUnit(state, 'villepin', 2, 4);
    placeUnit(state, 'lassalle', 3, 4);
    run(state, 1.2);
    expect(enemy!.lane).not.toBe(2);
    const later = stage('star:macron');
    placeUnit(later.state, 'lassalle', 2, 4);
    placeUnit(later.state, 'villepin', 3, 5);
    later.enemy!.powerTimers = [99, 0.05];
    run(later.state, 0.2);
    expect(later.enemy!.cast?.zone).toEqual({ lane: 2, col: 4 });
    const before = later.state.resources;
    run(later.state, 1.8);
    expect(later.state.grid[2][4]).toBeNull();
    expect(later.state.grid[3][5]).toBeNull();
    expect(later.state.resources - before).toBeGreaterThanOrEqual((UNITS.lassalle.cost + UNITS.villepin.cost) / 2);
    expect(later.state.cards.find((c) => c.def.id === 'lassalle')!.cooldown).toBe(0);
  });

  it('Le Pen appeals once: back on her feet with 40% of her credibility', () => {
    const { state, enemy } = stage('star:lepen');
    enemy!.hp = 0;
    run(state, TICK);
    expect(state.enemies).toContain(enemy);
    expect(enemy!.revived).toBe(true);
    expect(enemy!.hp).toBeCloseTo(UNITS.lepen.attacker!.hp * 0.4, 0);
    enemy!.hp = 0;
    run(state, TICK);
    expect(state.enemies).not.toContain(enemy);
    expect(state.events.some((e) => e.type === 'enemyDown' && e.enemyId === 'star:lepen' && e.revived)).toBe(true);
  });

  it('Riner throws the figure he faces, and fights harder below half', () => {
    const { state, enemy } = stage('star:riner', 'centre');
    expect(placeUnit(state, 'philippe', 2, 5)).toBeNull();
    enemy!.x = 6.0;
    run(state, 1.2);
    expect(state.events.some((e) => e.type === 'power' && e.power === 'ippon')).toBe(true);
    expect(state.grid[2][5]!.hp).toBeLessThan(UNITS.philippe.hp * 0.5);
    enemy!.hp = enemy!.def.hp * 0.4;
    run(state, TICK * 2);
    expect(enemy!.enraged).toBe(true);
  });

  it('Xavier Niel takes the network down in three lanes', () => {
    const { state } = stage('niel');
    placeUnit(state, 'villepin', 1, 1);
    placeUnit(state, 'lassalle', 4, 1);
    run(state, 1.5);
    expect(state.grid[1][1]!.silenced).toBeGreaterThan(0);
    expect(state.grid[4][1]!.silenced).toBe(0);
  });

  it('Trump doubles his tariffs once he is in trouble', () => {
    const { state, enemy } = stage('trump');
    run(state, 0.1);
    expect(state.tariff).toBe(1.25);
    enemy!.hp = enemy!.def.hp * 0.4;
    run(state, 0.1);
    expect(state.tariff).toBe(1.5);
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
  it('ends on the run-off, after the debate', () => {
    expect(LAST_LEVEL).toBe(9);
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
