/**
 * Captures the README screenshots from a running build.
 *
 *   npm run build && npm run preview        # in one terminal
 *   PW_CHANNEL=msedge npm run screenshots   # in another (BASE_URL defaults to http://localhost:4321)
 *
 * Also writes one picture per campaign night to public/og/nights/ (their page's social card).
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { NIGHT_IDS, nightSlug } from '../src/lib/pages';
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
    ['gameplay.png', 'en', 'play', 'gauche', 9, 300, 'star:lepen'],
    ['gameplay-school.png', 'fr', 'jouer', 'droite', 3, 150, 'niel'],
    ['gameplay-street.png', 'fr', 'jouer', 'gauche', 4, 95, 'poubelle'],
    ['gameplay-summit.png', 'en', 'play', 'droite', 6, 150, 'trump'],
    ['gameplay-studio.png', 'fr', 'jouer', 'autres', 5, 120],
    ['gameplay-show.png', 'en', 'play', 'autres', 2, 110, 'vache'],
    ['gameplay-village.png', 'fr', 'jouer', 'droite', 1, 80],
  ];
  for (const [file, lang, slug, camp, level, seconds, until] of shots) {
    await match(page, lang, slug, camp, level, seconds, until);
    await page.locator('#game').screenshot({ path: resolve(out, file) });
  }

  // Removal mode: the board dims and every figure can be taken off.
  await match(page, 'en', 'play', 'gauche', 7, 120);
  await page.locator('[data-action="remove"]').click();
  await page.waitForTimeout(500);
  await page.locator('#game').screenshot({ path: resolve(out, 'gameplay-remove.png') });

  // The run-off debate: soundbites to send back before they land.
  await match(page, 'en', 'play', 'droite', 8, 70);
  await page.evaluate(() => {
    const state = (window as unknown as { __P2027__: { state(): { punchlines: object[] } } }).__P2027__.state();
    state.punchlines.push({ id: 9001, lane: 1, col: 5, life: 3, max: 4.5 }, { id: 9002, lane: 3, col: 3, life: 1.2, max: 4.5 });
  });
  await page.waitForTimeout(300);
  await page.locator('#game').screenshot({ path: resolve(out, 'gameplay-debate.png') });

  // A "New!" card: the match waits while a rival headliner is introduced, with her powers as a boss.
  await match(page, 'en', 'play', 'centre', 7, 50);
  await page.evaluate(() => {
    const hook = (window as unknown as { __P2027__: { intros(on: boolean): void; spawn(id: string, lane: number, x: number): void } }).__P2027__;
    hook.intros(true);
    hook.spawn('star:lepen', 2, 8.4);
  });
  await page.waitForTimeout(600);
  await page.locator('#game').screenshot({ path: resolve(out, 'new-card.png') });

  // Two players on one screen: the attacker's column on the right.
  await page.goto(`${base}/en/play?e2e=1`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#game[data-ready="true"]');
  await page.locator('[data-camp="autres"]').click();
  await page.locator('[data-mode="versus"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  await page.evaluate(() => (window as unknown as { __P2027__: { advance(s: number, bot: boolean): Promise<void> } }).__P2027__.advance(40, true));
  for (const [kind, lane] of [['bus', 1], ['pundit', 3], ['militant', 0], ['star', 2]] as const) {
    await page.locator(`[data-kind="${kind}"]`).click();
    await page.locator(`[data-lane="${lane}"]`).click();
  }
  await page.waitForTimeout(4500);
  await page.locator('#game').screenshot({ path: resolve(out, 'gameplay-versus.png') });
  await context.close();

  // A phone held sideways: tickets on the left, the board over the whole height.
  const phone = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const small = await phone.newPage();
  small.on('pageerror', (err) => errors.push(`${small.url()} — ${err.message}`));
  await match(small, 'fr', 'jouer', 'droite', 4, 110);
  await small.screenshot({ path: resolve(out, 'gameplay-phone.png') });
  await phone.close();

  // One picture per night: the stage a minute into the match.
  mkdirSync(resolve(out, '..', 'public/og/nights'), { recursive: true });
  const card = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const nightPage = await card.newPage();
  const camps = ['gauche', 'centre', 'droite', 'autres'];
  for (const [i, id] of NIGHT_IDS.entries()) {
    if (id === 0) await nightPage.goto(`${base}/fr/jouer?e2e=1`).then(() => nightPage.waitForSelector('#game[data-ready="true"]')).then(() => nightPage.evaluate(() => (window as unknown as { __P2027__: { unlockAll(): void } }).__P2027__.unlockAll()));
    await match(nightPage, 'fr', 'jouer', camps[i % 4], id, id === 8 ? 70 : 60);
    const file = resolve(out, '..', 'public/og/nights', `${nightSlug(id, 'fr')}.jpg`);
    await nightPage.locator('.stage').screenshot({ path: file, type: 'jpeg', quality: 80 });
  }
  await card.close();

  console.log(`Screenshots written to ${out}`);
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('Console errors:\n' + errors.join('\n'));
  process.exitCode = 1;
}
