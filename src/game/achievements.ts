import { LEVELS } from './data/levels';
import { CAMP_IDS } from './data/types';
import type { Save } from './storage';

/**
 * Achievements, kept on the device with the rest of the progress. Each one is
 * checked against the save (counters and progress) after the events that can
 * earn it; names and descriptions live in src/i18n/game.ts.
 */
export const ACHIEVEMENTS = [
  'firstWin',
  'cleanSheet',
  'grandSlam',
  'allCamps',
  'taxExile',
  'peoplesVoice',
  'socialDialogue',
  'noComment',
  'lidl',
  'appeal',
  'transfuge',
  'maxed',
  'cohabitation',
  'hardRunoff',
  'dailyDone',
  'versus',
  'debater',
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number];

/** Running totals across every match. */
export interface Counters {
  exiled: number;
  wonOver: number;
  unionists: number;
  ripostes: number;
  lucet: number;
  /** Xavier Niel sent home. */
  niel: number;
  /** Marine Le Pen beaten after her appeal. */
  appeal: number;
  /** Nights played with a turncoat in the deck. */
  transfuges: number;
  /** Figures taken to level 3 during a match. */
  maxed: number;
  dailies: number;
  versus: number;
  hardRunoff: number;
}

export function blankCounters(): Counters {
  return { exiled: 0, wonOver: 0, unionists: 0, ripostes: 0, lucet: 0, niel: 0, appeal: 0, transfuges: 0, maxed: 0, dailies: 0, versus: 0, hardRunoff: 0 };
}

function earned(id: AchievementId, save: Save): boolean {
  const c = save.counters;
  const camps = CAMP_IDS.map((camp) => save.progress[camp]);
  switch (id) {
    case 'firstWin':
      return camps.some((p) => Object.keys(p.stars).length > 0);
    case 'cleanSheet':
      return camps.some((p) => Object.values(p.stars).some((s) => s === 3));
    case 'grandSlam':
      return camps.some((p) => LEVELS.every((l) => p.stars[l.id] === 3));
    case 'allCamps':
      return camps.every((p) => Object.keys(p.stars).length > 0);
    case 'taxExile':
      return c.exiled >= 10;
    case 'peoplesVoice':
      return c.wonOver >= 50;
    case 'socialDialogue':
      return c.unionists >= 30;
    case 'noComment':
      return c.lucet >= 1;
    case 'lidl':
      return c.niel >= 1;
    case 'appeal':
      return c.appeal >= 1;
    case 'transfuge':
      return c.transfuges >= 1;
    case 'maxed':
      return c.maxed >= 1;
    case 'cohabitation':
      return camps.some((p) => p.endlessBest >= 20);
    case 'hardRunoff':
      return c.hardRunoff >= 1;
    case 'dailyDone':
      return c.dailies >= 1;
    case 'versus':
      return c.versus >= 1;
    case 'debater':
      return c.ripostes >= 10;
  }
}

/** Marks the achievements newly earned and returns them (in list order). */
export function unlockAchievements(save: Save): AchievementId[] {
  const fresh = ACHIEVEMENTS.filter((id) => !save.achievements.includes(id) && earned(id, save));
  save.achievements.push(...fresh);
  return fresh;
}
