import type { LevelDef } from './types';

export const ROWS = 5;
export const COLS = 9;

/**
 * Campaign levels 1-7. Budgets are tuned with `npm run balance`: the reference
 * bot must win every level with every camp, and an idle player must lose.
 */
export const LEVELS: LevelDef[] = [
  {
    // A village square: mayors hold the endorsements.
    id: 1, scene: 'mairie', lanes: [1, 2, 3], startResources: 150, polls: 5,
    waves: 6, baseBudget: 2, growth: 1.1, bigWaves: [5],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 2, from: 3 },
    ],
    starsFrom: 99, bosses: 0, guests: ['durif'], firstWaveAt: 22, waveGap: 24, slots: 3, reinforcements: false,
  },
  {
    id: 2, scene: 'salon', lanes: [0, 1, 2, 3, 4], startResources: 175, polls: 5,
    waves: 8, baseBudget: 3, growth: 1.5, bigWaves: [4, 7],
    pool: [
      { id: 'militant', weight: 4, from: 0 },
      { id: 'agriculteur', weight: 3, from: 1 },
      { id: 'placard', weight: 2, from: 2 },
      { id: 'pundit', weight: 2, from: 3 },
      { id: 'tracteur', weight: 1, from: 4 },
    ],
    starsFrom: 6, bosses: 0, firstWaveAt: 24, waveGap: 25, slots: 4, reinforcements: false,
  },
  {
    // The street: school blockades, burning bins and motorists who have seen the price of petrol.
    id: 3, scene: 'rue', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 8, baseBudget: 5, growth: 2.9, bigWaves: [4, 7],
    pool: [
      { id: 'lyceen', weight: 5, from: 0 },
      { id: 'militant', weight: 1, from: 0 },
      { id: 'gilet', weight: 3, from: 1 },
      { id: 'poubelle', weight: 2, from: 1 },
      { id: 'auto', weight: 2, from: 2 },
      { id: 'impots', weight: 1.5, from: 3 },
      { id: 'placard', weight: 1, from: 3 },
    ],
    starsFrom: 99, bosses: 0, guests: ['squeezie'], firstWaveAt: 24, waveGap: 25, slots: 4, reinforcements: true,
  },
  {
    id: 4, scene: 'plateau', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 9, baseBudget: 6, growth: 3.4, bigWaves: [4, 8],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 1 },
      { id: 'pundit', weight: 4, from: 0 },
      { id: 'patron', weight: 1, from: 3 },
    ],
    starsFrom: 2, bosses: 0, guests: ['hugo'], firstWaveAt: 24, waveGap: 26, slots: 5, reinforcements: true,
  },
  {
    // International summit: a guest arrives with his tariffs.
    id: 5, scene: 'sommet', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 9, baseBudget: 7, growth: 3.3, bigWaves: [4, 8],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 0 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'auto', weight: 1.5, from: 2 },
      { id: 'impots', weight: 1.2, from: 1 },
      { id: 'patron', weight: 1.2, from: 2 },
      { id: 'bus', weight: 1, from: 5 },
    ],
    starsFrom: 3, bosses: 0, guests: ['trump'], firstWaveAt: 24, waveGap: 26, slots: 6, reinforcements: true,
  },
  {
    id: 6, scene: 'elysee', lanes: [0, 1, 2, 3, 4], startResources: 200, polls: 5,
    waves: 10, baseBudget: 8, growth: 4.3, bigWaves: [4, 9],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 1 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'lyceen', weight: 2, from: 2 },
      { id: 'gilet', weight: 1.5, from: 1 },
      { id: 'agriculteur', weight: 1.5, from: 2 },
      { id: 'bus', weight: 1, from: 5 },
    ],
    starsFrom: 2, bosses: 1, firstWaveAt: 24, waveGap: 27, slots: 6, reinforcements: true,
  },
  {
    id: 7, scene: 'elysee-nuit', lanes: [0, 1, 2, 3, 4], startResources: 225, polls: 5,
    waves: 12, baseBudget: 9, growth: 3.9, bigWaves: [3, 7, 11],
    pool: [
      { id: 'militant', weight: 5, from: 0 },
      { id: 'placard', weight: 3, from: 0 },
      { id: 'pundit', weight: 3, from: 1 },
      { id: 'impots', weight: 1, from: 2 },
      { id: 'poubelle', weight: 1, from: 3 },
      { id: 'bus', weight: 1.2, from: 4 },
      { id: 'tracteur', weight: 0.8, from: 5 },
    ],
    starsFrom: 1, bosses: 2, firstWaveAt: 24, waveGap: 27, slots: 6, reinforcements: true,
  },
];

export const LAST_LEVEL = LEVELS[LEVELS.length - 1].id;

/** Level 0: the endless "Cohabitation" mode, unlocked by finishing the campaign. */
export const ENDLESS: LevelDef = {
  id: 0, scene: 'elysee', lanes: [0, 1, 2, 3, 4], startResources: 225, polls: 5,
  waves: Number.POSITIVE_INFINITY, baseBudget: 5, growth: 2.4, bigWaves: [],
  pool: [
    { id: 'militant', weight: 5, from: 0 },
    { id: 'placard', weight: 3, from: 1 },
    { id: 'pundit', weight: 3, from: 2 },
    { id: 'lyceen', weight: 3, from: 3 },
    { id: 'gilet', weight: 2, from: 3 },
    { id: 'poubelle', weight: 1, from: 4 },
    { id: 'auto', weight: 1.5, from: 5 },
    { id: 'agriculteur', weight: 2, from: 2 },
    { id: 'impots', weight: 1, from: 4 },
    { id: 'patron', weight: 1, from: 5 },
    { id: 'bus', weight: 1.2, from: 6 },
    { id: 'tracteur', weight: 1, from: 7 },
  ],
  starsFrom: 3, bosses: 1, guests: ['trump', 'hugo', 'squeezie', 'durif'], firstWaveAt: 24, waveGap: 25, slots: 6, reinforcements: true, endless: true,
};

export function levelDef(id: number): LevelDef {
  if (id === 0) return ENDLESS;
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}
