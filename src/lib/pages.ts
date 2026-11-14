import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENDLESS, LEVELS } from '../game/data/levels';
import { CAMP_IDS } from '../game/data/types';
import { CAMPS, GUESTS } from '../game/data/units';
import { GAME_STRINGS, type Lang } from '../i18n/game';

/**
 * One page per named figure and per campaign night, for people who search for a
 * character or a level by name. Slugs come from the names, the same in both
 * languages for figures and translated for nights.
 */
export const SECTIONS = {
  figures: { fr: 'personnages', en: 'characters' },
  nights: { fr: 'soirees', en: 'nights' },
} as const;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Every named figure: the four line-ups and the guests. */
export const FIGURE_IDS = [...CAMP_IDS.flatMap((camp) => CAMPS[camp].roster), ...GUESTS];
export const NIGHT_IDS = [...LEVELS.map((l) => l.id), ENDLESS.id];

export function figureSlug(id: string): string {
  return slugify(GAME_STRINGS.fr.figures[id].name);
}

export function nightSlug(id: number, lang: Lang): string {
  return slugify(GAME_STRINGS[lang].levels[id].name);
}

export function figurePath(lang: Lang, id: string): string {
  return `/${lang}/${SECTIONS.figures[lang]}/${figureSlug(id)}`;
}

export function nightPath(lang: Lang, id: number): string {
  return `/${lang}/${SECTIONS.nights[lang]}/${nightSlug(id, lang)}`;
}

/** The page's own social picture once `npm run assets` / `npm run screenshots` made it, the site's otherwise. */
function picture(file: string): string {
  return existsSync(resolve(process.cwd(), 'public', file.slice(1))) ? file : '/og.png';
}

export function figureImage(id: string): string {
  return picture(`/og/${figureSlug(id)}.jpg`);
}

export function nightImage(id: number): string {
  return picture(`/og/nights/${nightSlug(id, 'fr')}.jpg`);
}
