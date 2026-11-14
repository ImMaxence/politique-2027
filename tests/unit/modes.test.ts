import { afterEach, describe, expect, it } from 'vitest';
import { unlockAchievements } from '../../src/game/achievements';
import { LAST_LEVEL, VERSUS } from '../../src/game/data/levels';
import { CAMP_IDS } from '../../src/game/data/types';
import { dailySetup, duelCode, parseDuel } from '../../src/game/modes';
import {
  RIPOSTE_DAMAGE, RIPOSTE_REWARD, TICK, VERSUS_KINDS, catchPunchline, createGame, placeUnit, spawnEnemy, step, versusSend,
  type GameState,
} from '../../src/game/sim/engine';
import { blankSave, loadSave } from '../../src/game/storage';

function run(state: GameState, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / TICK) && state.status === 'playing'; i++) step(state);
}

describe('daily challenge and duel codes', () => {
  it('gives everybody the same challenge on a given day, and another one the next day', () => {
    const a = dailySetup('2026-11-14');
    expect(dailySetup('2026-11-14')).toEqual(a);
    expect(a.level).toBeGreaterThanOrEqual(2);
    expect(a.level).toBeLessThanOrEqual(LAST_LEVEL);
    expect(CAMP_IDS).toContain(a.camp);
    const week = ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'].map((d) => dailySetup(d));
    expect(new Set(week.map((s) => s.seed)).size).toBe(4);
  });

  it('fits a duel in a short code, score included, and refuses anything else', () => {
    const setup = { mode: 'duel' as const, level: 5, camp: 'autres' as const, seed: 123456789 };
    const open = duelCode(setup);
    expect(parseDuel(open)).toEqual({ ...setup, rival: undefined });
    const played = duelCode(setup, 2340);
    expect(played.length).toBeLessThan(20);
    expect(parseDuel(played)).toEqual({ ...setup, rival: 2340 });
    for (const junk of ['', 'abc', '0-1-zz', '5-7-zz', '5-1-zz-zz-zz', '<script>']) expect(parseDuel(junk)).toBeNull();
  });
});

describe('the debate', () => {
  it('a soundbite sent back pays and hits the frontmost opponent; one left alone silences its square', () => {
    const state = createGame({ camp: 'gauche', level: 8 });
    state.wave.next = 1; // the soundbites start with the first wave
    state.resources = 1000;
    expect(placeUnit(state, 'hollande', 2, 1)).toBeNull();
    const front = spawnEnemy(state, 'militant', 2, 'droite', 6)!;
    state.punchlines.push({ id: 999, lane: 2, col: 4, life: 3, max: 3 });
    const before = state.resources;
    expect(catchPunchline(state, 2, 4)).toBe(true);
    expect(state.resources).toBe(before + RIPOSTE_REWARD);
    expect(front.hp).toBe(front.def.hp - RIPOSTE_DAMAGE);
    expect(catchPunchline(state, 2, 4)).toBe(false);

    state.punchlines.push({ id: 1000, lane: 2, col: 1, life: 0.05, max: 3 });
    state.punchTimer = 99;
    run(state, 0.2);
    expect(state.grid[2][1]!.silenced).toBeGreaterThan(2);
  });
});

describe('two players on one screen', () => {
  it('the attacker spends a budget that refills; the defender wins when the clock runs out', () => {
    const state = createGame({ camp: 'centre', level: VERSUS.id });
    expect(state.versus).not.toBeNull();
    run(state, 30);
    expect(state.enemies).toHaveLength(0); // no waves of its own
    const budget = state.versus!.budget;
    expect(versusSend(state, 'bus', 2)).toBeNull();
    expect(state.versus!.budget).toBeCloseTo(budget - VERSUS_KINDS.bus, 5);
    expect(state.enemies.map((e) => e.def.id)).toEqual(['bus']);
    state.versus!.budget = 1;
    expect(versusSend(state, 'star', 1)).toBe('budget');
    expect(versusSend(state, 'militant', 9)).toBe('lane');
    state.enemies.length = 0;
    run(state, 200);
    expect(state.status).toBe('won');
  });
});

describe('saves', () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  function withStorage(data: unknown): void {
    const store = new Map([['politique2027:save', JSON.stringify(data)]]);
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    };
  }

  it('moves a 1.x run-off night to night 9, so that nobody loses access to it', () => {
    withStorage({ v: 2, camp: 'droite', progress: { droite: { unlocked: 7, stars: { 6: 3, 7: 2 }, endlessBest: 4, finished: true } } });
    const save = loadSave();
    expect(save.progress.droite.unlocked).toBe(9);
    expect(save.progress.droite.stars).toEqual({ 7: 3, 9: 2 });
    expect(save.progress.droite.finished).toBe(true);
    expect(save.speed).toBe(1);
    expect(save.music).toBe(true);
  });

  it('makes room for the school blockade: 2.x nights from the street onwards move up one', () => {
    withStorage({ v: 3, camp: 'gauche', progress: { gauche: { unlocked: 4, stars: { 2: 1, 3: 2, 4: 3 }, endlessBest: 0, finished: false } }, bench: { gauche: true } });
    const save = loadSave();
    expect(save.progress.gauche.unlocked).toBe(5);
    expect(save.progress.gauche.stars).toEqual({ 2: 1, 4: 2, 5: 3 });
    expect(save.v).toBe(4);
    expect('bench' in save).toBe(false);
  });

  it('keeps the decks and the upgrades, and drops what makes no sense', () => {
    withStorage({ v: 4, teams: { gauche: ['hollande', 'samu', 'nobody', 3] }, upgrades: { gauche: { hollande: 3, royal: 9, nobody: 2, ruffin: 1 } } });
    const save = loadSave();
    expect(save.teams.gauche).toEqual(['hollande', 'samu']);
    expect(save.upgrades.gauche).toEqual({ hollande: 3, royal: 3 });
    expect(save.teams.centre).toEqual([]);
  });

  it('keeps the daily scores', () => {
    withStorage({ v: 4, daily: { '2026-11-13': 1200, '2026-11-14': 900, junk: 5 } });
    expect(loadSave().daily).toEqual({ '2026-11-13': 1200, '2026-11-14': 900 });
  });

  it('earns achievements from progress and running totals', () => {
    const save = blankSave();
    expect(unlockAchievements(save)).toEqual([]);
    save.progress.gauche.stars[1] = 3;
    save.counters.wonOver = 50;
    expect(unlockAchievements(save)).toEqual(['firstWin', 'cleanSheet', 'peoplesVoice']);
    expect(unlockAchievements(save)).toEqual([]);
  });
});
