import type { AchievementId } from './achievements';

/**
 * The wardrobe: looks won with achievements. Your own figures wear them on the board;
 * they change nothing to the game. Names and descriptions live in src/i18n/game.ts.
 */
export const COSMETICS = [
  { id: 'sash', group: 'sash', achievement: 'firstWin' },
  { id: 'shades', group: 'shades', achievement: 'cleanSheet' },
  { id: 'goldCards', group: 'cards', achievement: 'dailyDone' },
  { id: 'flamesBlue', group: 'flames', achievement: 'maxed' },
  { id: 'flamesPurple', group: 'flames', achievement: 'allCamps' },
  { id: 'flamesTricolour', group: 'flames', achievement: 'streak' },
] as const satisfies readonly { id: string; group: string; achievement: AchievementId }[];

export type CosmeticId = (typeof COSMETICS)[number]['id'];
export const COSMETIC_IDS: readonly CosmeticId[] = COSMETICS.map((c) => c.id);

/** The colour of the level-up flames. */
export type FlameColour = 'classic' | 'blue' | 'purple' | 'tricolour';

function cosmeticOf(id: CosmeticId) {
  return COSMETICS.find((c) => c.id === id)!;
}

/** The look a given achievement unlocks, if any. */
export function rewardOf(achievement: AchievementId): CosmeticId | undefined {
  return COSMETICS.find((c) => c.achievement === achievement)?.id;
}

export function isUnlocked(id: CosmeticId, achievements: readonly AchievementId[]): boolean {
  return achievements.includes(cosmeticOf(id).achievement);
}

/** Puts a look on or takes it off; a new flame colour replaces the previous one. */
export function toggleCosmetic(worn: readonly CosmeticId[], id: CosmeticId): CosmeticId[] {
  if (worn.includes(id)) return worn.filter((x) => x !== id);
  const group = cosmeticOf(id).group;
  return [...worn.filter((x) => cosmeticOf(x).group !== group), id];
}

/** Keeps known looks only, once each, and a single flame colour. */
export function cleanWardrobe(items: readonly unknown[]): CosmeticId[] {
  let worn: CosmeticId[] = [];
  for (const item of items) {
    if (typeof item !== 'string' || !(COSMETIC_IDS as readonly string[]).includes(item) || worn.includes(item as CosmeticId)) continue;
    worn = toggleCosmetic(worn, item as CosmeticId);
  }
  return worn;
}

export function flamesOf(worn: readonly CosmeticId[]): FlameColour {
  if (worn.includes('flamesBlue')) return 'blue';
  if (worn.includes('flamesPurple')) return 'purple';
  if (worn.includes('flamesTricolour')) return 'tricolour';
  return 'classic';
}

/** What the figures wear, and a key naming that look ('' for none) to find its pictures. */
export interface Look {
  sash: boolean;
  shades: boolean;
  key: string;
}

export function lookOf(worn: readonly CosmeticId[]): Look {
  const sash = worn.includes('sash');
  const shades = worn.includes('shades');
  return { sash, shades, key: [sash && 'sash', shades && 'shades'].filter(Boolean).join('+') };
}
