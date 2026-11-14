import type { Page } from '@playwright/test';
import { LANGS, type Lang } from '../../src/i18n/game';
import { ROUTE_KEYS, path, type RouteKey } from '../../src/i18n/routes';

export interface PageRef {
  lang: Lang;
  route: RouteKey;
  url: string;
}

/** Every localised page of the site. */
export const PAGES: PageRef[] = LANGS.flatMap((lang) => ROUTE_KEYS.map((route) => ({ lang, route, url: path(lang, route) })));

interface Hook {
  state(): { status: string; time: number; hard: boolean; resources: number; polls: number; tariff: number; units: { def: { id: string }; lane: number; col: number }[] } | null;
  start(camp: string, level: number, seed?: number): Promise<void>;
  team(camp: string, level: number): Promise<void>;
  advance(seconds: number, bot?: boolean): Promise<void>;
  spawn(enemyId: string, lane: number, x: number): void;
  unlockAll(): void;
  intros(on: boolean): void;
}

declare global {
  interface Window {
    __P2027__: Hook;
  }
}

export async function openGame(page: Page, lang: Lang = 'fr'): Promise<void> {
  await page.goto(`${path(lang, 'play')}?e2e=1`);
  await page.waitForSelector('#game[data-ready="true"]');
}

export async function startMatch(page: Page, camp: string, level: number): Promise<void> {
  await page.evaluate(([c, l]) => window.__P2027__.start(c as string, l as number, 2027), [camp, level] as const);
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
}

/** Collects console errors (CSP violations included) for the lifetime of the page. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
