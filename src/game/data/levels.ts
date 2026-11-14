import type { LevelDef } from './types';

export const ROWS = 5;
export const COLS = 9;

/**
 * Campaign nights 1-9. Each one has a theme: a crowd, the thing it is after (the
 * `goal`, piled at the end of every row) and sometimes a guest. Budgets are tuned
 * with `npm run balance`: the reference bot must win every night with every camp,
 * and an idle player must lose.
 */
export const LEVELS: LevelDef[] = [
  {
    // A village square: rival campaigners are after the mayors' signatures.
    id: 1, scene: 'mairie', goal: 'parrainages', lanes: [1, 2, 3], startResources: 150, polls: 5,
    waves: 6, baseBudget: 2, growth: 1.1, bigWaves: [5],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 2, from: 3 },
    ],
    starsFrom: 99, bosses: 0, firstWaveAt: 22, waveGap: 24, slots: 3, reinforcements: false,
  },
  {
    // The Agricultural Show: farmers, tractors and the star cow want the farm subsidies.
    id: 2, scene: 'salon', goal: 'pac', lanes: [0, 1, 2, 3, 4], startResources: 175, polls: 5,
    waves: 8, baseBudget: 3, growth: 1.5, bigWaves: [4, 7],
    pool: [
      { id: 'agriculteur', weight: 5, from: 0 },
      { id: 'militant', weight: 2, from: 0 },
      { id: 'placard', weight: 2, from: 2 },
      { id: 'vache', weight: 1, from: 3 },
      { id: 'tracteur', weight: 1, from: 4 },
    ],
    starsFrom: 6, bosses: 0, firstWaveAt: 24, waveGap: 25, slots: 4, reinforcements: false,
  },
  {
    // A school blockade: the pupils want their confiscated phones back, and the network goes down.
    id: 3, scene: 'lycee', goal: 'portables', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 8, baseBudget: 4, growth: 2.3, bigWaves: [4, 7],
    pool: [
      { id: 'lyceen', weight: 6, from: 0 },
      { id: 'trottinette', weight: 2, from: 1 },
      { id: 'poubelle', weight: 1.5, from: 2 },
      { id: 'placard', weight: 1, from: 3 },
      { id: 'militant', weight: 1, from: 0 },
    ],
    starsFrom: 99, bosses: 0, guests: ['niel'], firstWaveAt: 24, waveGap: 25, slots: 4, reinforcements: true,
  },
  {
    // 17 October 2026: the street against the cost of living. Yellow vests, pupils, unions,
    // burning bins and motorists who have seen the price of petrol all want a full trolley.
    id: 4, scene: 'rue', goal: 'caddie', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 8, baseBudget: 5, growth: 2.9, bigWaves: [4, 7],
    pool: [
      { id: 'gilet', weight: 4, from: 0 },
      { id: 'lyceen', weight: 3, from: 0 },
      { id: 'syndicat', weight: 2, from: 1 },
      { id: 'poubelle', weight: 2, from: 1 },
      { id: 'trottinette', weight: 1.5, from: 2 },
      { id: 'auto', weight: 2, from: 2 },
      { id: 'smicard', weight: 1.5, from: 3 },
    ],
    starsFrom: 99, bosses: 0, guests: ['hugo'], twists: ['manif'], firstWaveAt: 24, waveGap: 25, slots: 5, reinforcements: true,
  },
  {
    // The TV debate: pundits after the speaking time, and the rival headliners on set.
    id: 5, scene: 'plateau', goal: 'micros', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 9, baseBudget: 6, growth: 3.4, bigWaves: [4, 8],
    pool: [
      { id: 'pundit', weight: 5, from: 0 },
      { id: 'militant', weight: 3, from: 0 },
      { id: 'placard', weight: 3, from: 1 },
      { id: 'patron', weight: 1, from: 3 },
      { id: 'cnews', weight: 1, from: 4 },
    ],
    starsFrom: 2, bosses: 0, guests: ['lucet'], twists: ['force'], firstWaveAt: 24, waveGap: 26, slots: 5, reinforcements: true,
  },
  {
    // International summit: a guest arrives with his tariffs on French cheese and wine.
    id: 6, scene: 'sommet', goal: 'terroir', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 9, baseBudget: 7, growth: 3.3, bigWaves: [4, 8],
    pool: [
      { id: 'militant', weight: 4, from: 0 },
      { id: 'placard', weight: 3, from: 0 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'auto', weight: 1.5, from: 2 },
      { id: 'impots', weight: 1.2, from: 1 },
      { id: 'patron', weight: 1.5, from: 2 },
      { id: 'bus', weight: 1, from: 5 },
    ],
    starsFrom: 3, bosses: 0, guests: ['trump'], twists: ['manif'], firstWaveAt: 24, waveGap: 26, slots: 6, reinforcements: true,
  },
  {
    // The first round: everybody wants the ballot boxes.
    id: 7, scene: 'elysee', goal: 'urnes', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 10, baseBudget: 8, growth: 4.3, bigWaves: [4, 9],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 1 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'lyceen', weight: 2, from: 2 },
      { id: 'gilet', weight: 1.5, from: 1 },
      { id: 'agriculteur', weight: 1.5, from: 2 },
      { id: 'smicard', weight: 2, from: 1 },
      { id: 'syndicat', weight: 1, from: 3 },
      { id: 'bus', weight: 1, from: 5 },
    ],
    starsFrom: 2, bosses: 1, guests: ['squeezie'], twists: ['manif', 'force'], firstWaveAt: 24, waveGap: 27, slots: 6, reinforcements: true,
  },
  {
    // The debate between the two rounds: one heavyweight on the other side of the desk, their
    // "petites phrases" raining down on the board, and everybody after your notes.
    id: 8, scene: 'plateau', goal: 'fiches', lanes: [0, 1, 2, 3, 4], startResources: 225, polls: 5,
    waves: 10, baseBudget: 9, growth: 4.8, bigWaves: [4, 9],
    pool: [
      { id: 'militant', weight: 4, from: 0 },
      { id: 'pundit', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 1 },
      { id: 'cnews', weight: 1, from: 3 },
      { id: 'patron', weight: 1, from: 4 },
      { id: 'bus', weight: 1, from: 6 },
    ],
    starsFrom: 1, bosses: 1, punchlines: { interval: 6.5, life: 4.5 }, firstWaveAt: 24, waveGap: 26, slots: 6, reinforcements: true,
  },
  {
    // The run-off: two rival headliners, and everybody wants the armchair.
    id: 9, scene: 'elysee-nuit', goal: 'fauteuil', lanes: [0, 1, 2, 3, 4], startResources: 225, polls: 5,
    waves: 12, baseBudget: 8, growth: 3.4, bigWaves: [3, 7, 11],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 0 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'impots', weight: 1, from: 2 },
      { id: 'syndicat', weight: 1, from: 3 },
      { id: 'poubelle', weight: 1, from: 3 },
      { id: 'bus', weight: 1.2, from: 4 },
      { id: 'cnews', weight: 0.8, from: 5 },
      { id: 'tracteur', weight: 0.8, from: 5 },
    ],
    starsFrom: 1, bosses: 2, twists: ['manif'], firstWaveAt: 24, waveGap: 27, slots: 6, reinforcements: true,
  },
];

export const LAST_LEVEL = LEVELS[LEVELS.length - 1].id;

/** Two players on one screen: the attacker sends opponents from a budget, the defender holds for three minutes. */
export const VERSUS: LevelDef = {
  id: -1, scene: 'plateau', goal: 'micros', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
  waves: Number.POSITIVE_INFINITY, baseBudget: 0, growth: 0, bigWaves: [], pool: [],
  starsFrom: 99, bosses: 0, firstWaveAt: 1e9, waveGap: 1e9, slots: 6, reinforcements: true,
  versus: { duration: 180 },
};

/** Level 0: the endless "Cohabitation" mode, unlocked by finishing the campaign. Everybody wants the budget. */
export const ENDLESS: LevelDef = {
  id: 0, scene: 'elysee', goal: 'budget', lanes: [0, 1, 2, 3, 4], startResources: 225, polls: 5,
  waves: Number.POSITIVE_INFINITY, baseBudget: 5, growth: 2.4, bigWaves: [],
  pool: [
    { id: 'militant', weight: 5, from: 0 },
    { id: 'placard', weight: 3, from: 1 },
    { id: 'pundit', weight: 3, from: 2 },
    { id: 'lyceen', weight: 3, from: 3 },
    { id: 'trottinette', weight: 1.5, from: 3 },
    { id: 'gilet', weight: 2, from: 3 },
    { id: 'syndicat', weight: 2, from: 3 },
    { id: 'smicard', weight: 1.5, from: 2 },
    { id: 'poubelle', weight: 1, from: 4 },
    { id: 'auto', weight: 1.5, from: 5 },
    { id: 'agriculteur', weight: 2, from: 2 },
    { id: 'impots', weight: 1, from: 4 },
    { id: 'patron', weight: 1, from: 5 },
    { id: 'vache', weight: 0.8, from: 6 },
    { id: 'bus', weight: 1.2, from: 6 },
    { id: 'tracteur', weight: 1, from: 7 },
    { id: 'cnews', weight: 1, from: 8 },
  ],
  starsFrom: 3, bosses: 1, guests: ['trump', 'niel', 'hugo', 'lucet', 'squeezie'], twists: ['manif', 'force'], firstWaveAt: 24, waveGap: 25, slots: 6, reinforcements: true, endless: true,
};

export function levelDef(id: number): LevelDef {
  if (id === 0) return ENDLESS;
  if (id === VERSUS.id) return VERSUS;
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}
