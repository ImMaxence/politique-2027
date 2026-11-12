import { SITE } from '../config/site';
import type { Lang } from './game';

/** Localised slugs. The French and English URLs of a page are alternates of each other. */
export const ROUTES = {
  home: { fr: '', en: '' },
  play: { fr: 'jouer', en: 'play' },
  characters: { fr: 'personnages', en: 'characters' },
  legal: { fr: 'mentions-legales', en: 'legal-notice' },
  privacy: { fr: 'confidentialite', en: 'privacy-policy' },
  terms: { fr: 'conditions-utilisation', en: 'terms-of-use' },
  accessibility: { fr: 'accessibilite', en: 'accessibility' },
} as const;

export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];
export const LEGAL_KEYS: RouteKey[] = ['legal', 'privacy', 'terms', 'accessibility'];

/** Site-relative path, without a trailing slash: /fr, /fr/jouer… */
export function path(lang: Lang, key: RouteKey): string {
  const slug = ROUTES[key][lang];
  return slug ? `/${lang}/${slug}` : `/${lang}`;
}

export function absolute(pathname: string): string {
  return `${SITE.url}${pathname}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

/** Relative weight of each page in the sitemap. */
export const PRIORITY: Record<RouteKey, number> = {
  home: 1,
  play: 0.9,
  characters: 0.8,
  legal: 0.2,
  privacy: 0.2,
  terms: 0.2,
  accessibility: 0.3,
};
