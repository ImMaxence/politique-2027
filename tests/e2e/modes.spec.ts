import { expect, test } from '@playwright/test';
import { dailySetup } from '../../src/game/modes';
import { openGame, startMatch } from './helpers';

test('the daily challenge is the same night, camp and waves for everybody today', async ({ page }) => {
  await openGame(page, 'fr');
  await page.locator('[data-camp="gauche"]').click();
  await page.locator('[data-mode="daily"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  const today = dailySetup();
  const state = await page.evaluate(() => {
    const s = window.__P2027__.state()!;
    return { camp: (s as unknown as { camp: string }).camp, level: (s as unknown as { level: { id: number } }).level.id, seed: (s as unknown as { seed: number }).seed };
  });
  expect(state).toEqual({ camp: today.camp, level: today.level, seed: today.seed });
});

test('a turn-based duel: play, hand over, and the second player sees the score to beat', async ({ page }) => {
  await openGame(page, 'en');
  await page.locator('[data-camp="centre"]').click();
  await page.locator('[data-mode="duel"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  const seed = await page.evaluate(() => (window.__P2027__.state() as unknown as { seed: number }).seed);
  await page.evaluate(() => window.__P2027__.advance(600, true));
  const result = page.locator('[data-overlay="result"]');
  await expect(result).toBeVisible();
  await expect(result.locator('[data-slot="notes"]')).toContainText('Duel code:');
  await result.locator('[data-action="duel-pass"]').click();
  await page.waitForSelector('[data-overlay="result"][hidden]', { state: 'attached' });
  expect(await page.evaluate(() => (window.__P2027__.state() as unknown as { seed: number }).seed)).toBe(seed);
  await page.evaluate(() => window.__P2027__.advance(600, true));
  await expect(result).toBeVisible();
  await expect(result.locator('[data-slot="notes"]')).toContainText('to beat:');
  await expect(result.locator('[data-action="duel-pass"]')).toBeHidden();
});

test('a duel link opens on the calendar and starts the same match', async ({ page }) => {
  await page.goto('/fr/jouer?e2e=1&duel=5-2-k3j9x-1sz');
  await page.waitForSelector('#game[data-ready="true"]');
  await page.locator('[data-camp="autres"]').click();
  const banner = page.locator('[data-slot="duel-banner"]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('La Droite');
  await banner.locator('[data-action="duel-accept"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  const state = await page.evaluate(() => {
    const s = window.__P2027__.state() as unknown as { camp: string; level: { id: number }; seed: number };
    return { camp: s.camp, level: s.level.id, seed: s.seed };
  });
  expect(state).toEqual({ camp: 'droite', level: 5, seed: parseInt('k3j9x', 36) });
});

test('two players on one screen: the attacker sends opponents with the left-hand keys or the buttons', async ({ page }) => {
  await openGame(page, 'fr');
  await page.locator('[data-camp="droite"]').click();
  await page.locator('[data-mode="versus"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  await expect(page.locator('[data-slot="versus"]')).toBeVisible();
  await expect(page.locator('[data-slot="wave-label"]')).toContainText('Temps');
  await page.locator('[data-cell]').first().focus();
  // Physical keys: E picks the third kind (a pundit), D sends it down the third lane.
  await page.keyboard.press('KeyE');
  await expect(page.locator('[data-kind="pundit"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('KeyD');
  await page.locator('[data-lane="0"]').click();
  const enemies = await page.evaluate(() => (window.__P2027__.state() as unknown as { enemies: { lane: number; def: { id: string } }[] }).enemies.map((e) => [e.def.id, e.lane]));
  expect(enemies).toEqual([['pundit', 2], ['pundit', 0]]);
});

test('the debate: tapping a soundbite sends it back', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'gauche', 7);
  const before = await page.evaluate(() => {
    const s = window.__P2027__.state() as unknown as { resources: number; punchlines: unknown[] };
    s.punchlines.push({ id: 1, lane: 2, col: 3, life: 4, max: 4 });
    return s.resources;
  });
  await page.locator('[data-cell]').nth(2 * 9 + 3).click();
  const after = await page.evaluate(() => {
    const s = window.__P2027__.state() as unknown as { resources: number; punchlines: unknown[] };
    return { resources: s.resources, left: s.punchlines.length };
  });
  expect(after.left).toBe(0);
  expect(after.resources).toBeGreaterThanOrEqual(before + 15);
});

test('speed cycles normal, fast, slow; S reads the board; the pause menu switches the music', async ({ page }) => {
  await openGame(page, 'fr');
  await startMatch(page, 'centre', 2);
  const speed = page.locator('[data-action="speed"]');
  await expect(speed).toHaveAttribute('aria-label', /×1/);
  await speed.click();
  await expect(speed).toHaveAttribute('aria-label', /×2/);
  await speed.click();
  await expect(speed).toHaveAttribute('aria-label', /×½/);
  await speed.click();
  await expect(speed).toHaveAttribute('aria-label', /×1/);

  await page.locator('[data-cell]').nth(20).focus();
  await page.keyboard.press('s');
  await expect(page.locator('[data-slot="live"]')).toContainText('Couloir 1');

  await page.locator('[data-action="pause"]').click();
  const music = page.locator('[data-action="music"]');
  await expect(music).toHaveAttribute('aria-pressed', 'true');
  await music.click();
  await expect(music).toHaveAttribute('aria-pressed', 'false');
});

test('achievements are earned and listed, and the night starts with its goal', async ({ page }) => {
  await openGame(page, 'en');
  await page.locator('[data-camp="gauche"]').click();
  await page.locator('[data-level="1"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  await expect(page.locator('[data-slot="live"]')).toContainText('They want your endorsements');
  await expect(page.locator('[data-slot="polls"]')).toHaveAttribute('aria-label', /Your 500 endorsements/);

  await page.evaluate(() => window.__P2027__.advance(400, true));
  await expect(page.locator('[data-overlay="result"] [data-slot="notes"]')).toContainText('Achievement unlocked: First Term');
  await page.locator('[data-action="calendar"]').click();
  await expect(page.locator('[data-achievement="firstWin"]')).toHaveClass(/is-earned/);
});

test('from night 6 the deck is picked on the team screen, turncoats included', async ({ page }) => {
  await openGame(page, 'en');
  await page.evaluate(() => window.__P2027__.team('gauche', 7));
  const screen = page.locator('[data-screen="team"]');
  await expect(screen).toBeVisible();
  await expect(screen.locator('[data-slot="team-count"]')).toHaveText('8/8 cards picked');
  // Full: a ninth card is refused until one is taken out.
  await screen.locator('[data-card="samu"]').click();
  await expect(screen.locator('[data-card="samu"]')).toHaveAttribute('aria-pressed', 'false');
  await screen.locator('[data-card="pompiers"]').click();
  await screen.locator('[data-card="royal"]').click();
  await screen.locator('[data-card="samu"]').click();
  await screen.locator('[data-card="attal"]').click();
  await expect(screen.locator('[data-card="attal"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(screen.locator('[data-slot="team-transfuges-title"]')).toHaveText('Turncoats (1/2)');
  await expect(screen.locator('[data-card="lepen"]')).toHaveCount(0); // no rival headliner
  await expect(screen.locator('[data-card="macron"]')).toHaveCount(0);
  await screen.locator('[data-action="team-go"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  await expect(page.locator('.card[data-unit="attal"]')).toBeVisible();
  await expect(page.locator('.card[data-unit="samu"]')).toBeVisible();
  await expect(page.locator('.card[data-unit="pompiers"]')).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('politique2027:save')!).teams.gauche);
  expect(saved).toContain('attal');
});

test('stars buy upgrades on the calendar', async ({ page }) => {
  await openGame(page, 'en');
  await page.evaluate(() => {
    localStorage.setItem('politique2027:save', '{"v":4,"camp":"droite","progress":{"droite":{"unlocked":4,"stars":{"1":3,"2":2},"endlessBest":0,"finished":false}}}');
  });
  await page.reload();
  await page.waitForSelector('#game[data-ready="true"]');
  const panel = page.locator('details.upgrades');
  await panel.locator('summary').click();
  await expect(panel.locator('summary')).toHaveText('Upgrades (5 ★ to spend)');
  await panel.locator('[data-upgrade="bardella"]').click();
  await expect(panel.locator('summary')).toHaveText('Upgrades (3 ★ to spend)');
  await panel.locator('[data-upgrade="bardella"]').click();
  await expect(panel.locator('summary')).toHaveText('Upgrades (0 ★ to spend)');
  await expect(panel.locator('[data-upgrade="bardella"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-achievement="maxed"]')).toHaveClass(/is-earned/);
  const level = await page.evaluate(() => JSON.parse(localStorage.getItem('politique2027:save')!).upgrades.droite.bardella);
  expect(level).toBe(3);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('a long press on a card opens its full description without picking it', async ({ page }) => {
    await openGame(page, 'fr');
    await startMatch(page, 'droite', 2);
    await page.locator('.card[data-unit="bardella"]').evaluate((card) => {
      card.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
    });
    const sheet = page.locator('[data-overlay="intro"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading')).toHaveText('Jordan Bardella');
    await expect(sheet.locator('[data-slot="intro-tag"]')).toHaveText('Fiche');
    await sheet.locator('[data-action="intro-ok"]').tap();
    await expect(sheet).toBeHidden();
  });
});
