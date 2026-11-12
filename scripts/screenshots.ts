/**
 * Captures the README screenshots from a running build.
 *
 *   npm run build && npm run preview        # in one terminal
 *   PW_CHANNEL=msedge npm run screenshots   # in another (BASE_URL defaults to http://localhost:4321)
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { launch } from './browser';

const base = process.env.BASE_URL ?? 'http://localhost:4321';
const out = resolve(import.meta.dirname, '..', 'docs');
mkdirSync(out, { recursive: true });

interface Hook {
  state(): { status: string; enemies: { x: number; def: { id: string } }[] } | null;
  start(camp: string, level: number, seed?: number): Promise<void>;
  advance(seconds: number, bot?: boolean): Promise<void>;
}

async function match(page: Page, lang: string, slug: string, camp: string, level: number, seconds: number, until?: string): Promise<void> {
  await page.goto(`${base}/${lang}/${slug}?e2e=1`);
  await page.waitForSelector('#game[data-ready="true"]');
  await page.evaluate(
    async ([c, l, s, wanted]) => {
      const hook = (window as unknown as { __P2027__: Hook }).__P2027__;
      await hook.start(c as string, l as number, 2027);
      await hook.advance(s as number, true);
      // Optionally keep playing until a given opponent has walked onto the board.
      for (let i = 0; wanted && i < 200; i++) {
        const state = hook.state();
        if (!state || state.status !== 'playing' || state.enemies.some((e) => e.def.id === wanted && e.x < 7.5)) break;
        await hook.advance(1.5, true);
      }
    },
    [camp, level, seconds, until ?? ''] as const,
  );
  // Let the match run for real for a few seconds so that speech bubbles and effects are on screen.
  await page.waitForFunction(() => true, undefined, { timeout: 1000 });
  await page.waitForTimeout(6500);
}

const browser = await launch();
const errors: string[] = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`${page.url()} — ${msg.text()}`));
  page.on('response', (res) => res.status() >= 400 && errors.push(`${res.status()} ${res.url()}`));
  page.on('pageerror', (err) => errors.push(`${page.url()} — ${err.message}`));

  await page.goto(`${base}/en`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(out, 'home.png') });

  await page.goto(`${base}/en/play`);
  await page.waitForSelector('#game[data-ready="true"]');
  await page.locator('#game').screenshot({ path: resolve(out, 'camp-select.png') });

  const shots: [string, string, string, string, number, number, string?][] = [
    ['gameplay.png', 'en', 'play', 'centre', 7, 150],
    ['gameplay-street.png', 'fr', 'jouer', 'gauche', 3, 95, 'poubelle'],
    ['gameplay-summit.png', 'en', 'play', 'droite', 5, 150, 'trump'],
    ['gameplay-studio.png', 'fr', 'jouer', 'autres', 4, 120],
    ['gameplay-show.png', 'en', 'play', 'autres', 2, 110, 'tracteur'],
    ['gameplay-village.png', 'fr', 'jouer', 'droite', 1, 80],
  ];
  for (const [file, lang, slug, camp, level, seconds, until] of shots) {
    await match(page, lang, slug, camp, level, seconds, until);
    await page.locator('#game').screenshot({ path: resolve(out, file) });
  }

  // Removal mode: the board dims and every figure can be taken off.
  await match(page, 'en', 'play', 'gauche', 6, 120);
  await page.locator('[data-action="remove"]').click();
  await page.waitForTimeout(500);
  await page.locator('#game').screenshot({ path: resolve(out, 'gameplay-remove.png') });
  await context.close();

  // A phone held sideways: tickets on the left, the board over the whole height.
  const phone = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const small = await phone.newPage();
  small.on('pageerror', (err) => errors.push(`${small.url()} — ${err.message}`));
  await match(small, 'en', 'play', 'droite', 6, 110);
  await small.screenshot({ path: resolve(out, 'gameplay-phone.png') });
  await phone.close();

  console.log(`Screenshots written to ${out}`);
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('Console errors:\n' + errors.join('\n'));
  process.exitCode = 1;
}
