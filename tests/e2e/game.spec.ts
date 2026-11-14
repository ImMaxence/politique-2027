import { expect, test } from '@playwright/test';
import { openGame, startMatch, watchErrors } from './helpers';

test('a match can be played with the keyboard only', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page, 'fr');

  // Camp, then level, with Tab / Enter only.
  await page.locator('[data-camp="gauche"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#levels-title')).toBeFocused();
  await page.locator('[data-level="1"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-screen="match"]')).toBeVisible();

  // 1 selects the first figure and moves focus to the courtyard.
  await page.keyboard.press('1');
  await expect(page.locator('.card[data-unit="glucksmann"]')).toHaveAttribute('aria-pressed', 'true');
  const focused = page.locator('[data-cell]:focus');
  await expect(focused).toHaveCount(1);

  // Arrows move inside the grid; Enter places the figure.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  const units = await page.evaluate(() => window.__P2027__.state()!.units.map((u) => [u.def.id, u.lane, u.col]));
  expect(units).toEqual([['glucksmann', 1, 0]]);
  await expect(page.locator('[data-cell]:focus')).toHaveAttribute('aria-label', /Raphaël Glucksmann/);
  // The announcement carries the figure's position and its catchphrase.
  await expect(page.locator('[data-slot="live"]')).toContainText('Raphaël Glucksmann');
  await expect(page.locator('[data-slot="live"]')).toContainText('Rendez-vous sur la place publique');

  // R arms the reshuffle tool, Enter removes the figure and refunds a quarter.
  await page.keyboard.press('r');
  await expect(page.locator('[data-action="remove"]')).toHaveAttribute('aria-pressed', 'true');
  const before = await page.evaluate(() => window.__P2027__.state()!.resources);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__P2027__.state()!.units.length)).toBe(0);
  // 12 back (a quarter of 50), give or take a passive +25 landing in between on a slow run.
  const refund = (await page.evaluate(() => window.__P2027__.state()!.resources)) - before;
  expect(refund % 25).toBe(12);

  // P pauses and traps the game behind the dialog; Escape resumes.
  await page.keyboard.press('p');
  await expect(page.locator('[data-overlay="pause"]')).toBeVisible();
  await expect(page.locator('[data-action="resume"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-overlay="pause"]')).toBeHidden();

  expect(errors).toEqual([]);
});

test('placing with the mouse spends votes and reports errors', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'droite', 1);

  await page.locator('.card[data-unit="bardella"]').click();
  await page.locator('[data-cell]').nth(1 * 9 + 2).click();
  expect(await page.evaluate(() => window.__P2027__.state()!.resources)).toBe(50);

  // Not enough left for a second one: the game says so instead of failing silently.
  // (The card is aria-disabled but stays clickable on purpose, hence `force`.)
  await page.locator('.card[data-unit="sarkozy"]').click({ force: true });
  await page.locator('[data-cell]').nth(2 * 9 + 0).click();
  await expect(page.locator('[data-slot="alert"]')).toHaveText('Not enough votes.');
  expect(await page.evaluate(() => window.__P2027__.state()!.units.length)).toBe(1);
});

test('winning unlocks the next level and is remembered', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'centre', 1);
  await page.evaluate(() => window.__P2027__.advance(400, true));

  const result = page.locator('[data-overlay="result"]');
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome', 'won');
  await expect(result.locator('[data-slot="headline"]')).not.toBeEmpty();
  await expect(result.locator('[data-slot="unlock"]')).toContainText('Élisabeth Borne');
  await expect(result.locator('[data-action="next"]')).toBeFocused();

  await result.locator('[data-action="calendar"]').click();
  await expect(page.locator('[data-level="2"]')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('[data-level="3"]')).toHaveAttribute('aria-disabled', 'true');

  // Progress survives a reload (localStorage) and the calendar opens directly.
  await page.reload();
  await page.waitForSelector('#game[data-ready="true"]');
  await expect(page.locator('[data-screen="levels"]')).toBeVisible();
  await expect(page.locator('[data-level="2"]')).toHaveAttribute('aria-disabled', 'false');
});

test('doing nothing loses the match', async ({ page }) => {
  await openGame(page, 'fr');
  await startMatch(page, 'gauche', 1);
  await page.evaluate(() => window.__P2027__.advance(400, false));
  const result = page.locator('[data-overlay="result"]');
  await expect(result).toHaveAttribute('data-outcome', 'lost');
  await expect(result.locator('[data-action="next"]')).toBeHidden();
  await expect(result.locator('[data-action="retry"]')).toBeFocused();
});

test('locked levels explain themselves instead of starting', async ({ page }) => {
  await openGame(page, 'fr');
  await page.locator('[data-camp="droite"]').click();
  await page.locator('[data-level="4"]').click({ force: true });
  await expect(page.locator('[data-screen="levels"]')).toBeVisible();
  await expect(page.locator('[data-slot="live"]')).toContainText('Verrouillé');
});

test('the street level brings reinforcements every camp can call', async ({ page }) => {
  await openGame(page, 'fr');
  await startMatch(page, 'autres', 2);
  await page.evaluate(() => window.__P2027__.advance(420, true));
  const result = page.locator('[data-overlay="result"]');
  await expect(result).toHaveAttribute('data-outcome', 'won');
  await expect(result.locator('[data-slot="unlock"]')).toContainText('Renforts disponibles');
  await expect(result.locator('[data-slot="unlock"]')).toContainText('Sapeurs-pompiers');

  await result.locator('[data-action="next"]').click();
  await expect(page.locator('.card')).toHaveCount(6);
  await expect(page.locator('.card--neutral')).toHaveCount(2);

  // 6 selects the fire brigade; its hose puts out a burning bin in the lane.
  await page.evaluate(() => window.__P2027__.spawn('poubelle', 2, 6));
  await page.keyboard.press('6');
  await expect(page.locator('.card[data-unit="pompiers"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__P2027__.state()!.units.length)).toBe(0);
});

test('tariffs raise the price printed on every card while the guest is on the board', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'droite', 5);
  const cost = page.locator('.card[data-unit="bardella"] .card__cost');
  await expect(cost).toHaveAttribute('data-label', '100');
  await expect(page.locator('.card')).toHaveCount(7);

  await page.evaluate(() => window.__P2027__.spawn('trump', 2, 8.5));
  await expect(cost).toHaveAttribute('data-label', '125');
  await expect(page.locator('.card[data-unit="bardella"]')).toHaveClass(/is-taxed/);
  await expect(page.locator('#card-desc-bardella')).toContainText('Cost 125');
  await expect(page.locator('[data-slot="alert"]')).toContainText('Tariffs');
});

test.describe('on a phone held upright', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the match is drawn in landscape, and stays playable', async ({ page }) => {
    await openGame(page, 'fr');
    await startMatch(page, 'centre', 1);
    const game = page.locator('#game');
    await expect(game).toHaveClass(/is-forced/);

    // Drawn a quarter turn round: on the upright screen the stage is taller than wide,
    // and it fills the screen without making the page scroll.
    const stage = (await page.locator('.stage').boundingBox())!;
    expect(stage.height).toBeGreaterThan(stage.width);
    expect(stage.x).toBeGreaterThanOrEqual(0);
    expect(stage.x + stage.width).toBeLessThanOrEqual(390);
    expect(stage.y + stage.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // Taps still land where they should.
    await page.locator('.card[data-unit="bayrou"]').tap();
    await page.locator('[data-cell]').nth(2 * 9 + 0).tap();
    expect(await page.evaluate(() => window.__P2027__.state()!.units.map((u) => [u.def.id, u.lane, u.col]))).toEqual([['bayrou', 2, 0]]);

    // Turning the phone for real: no more rotation, same side-column layout.
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(game).not.toHaveClass(/is-forced/);
    await expect(game).toHaveClass(/is-compact/);

    // Upright again, the pause menu can release the orientation — and remembers it.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(game).toHaveClass(/is-forced/);
    await page.locator('[data-action="pause"]').tap();
    const toggle = page.locator('[data-action="orientation"]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(game).not.toHaveClass(/is-forced/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('politique2027:save')!).forceLandscape)).toBe(false);
  });
});

test('every card shows which family it belongs to', async ({ page }) => {
  await openGame(page, 'fr');
  await startMatch(page, 'autres', 5);
  const types = await page.locator('.card').evaluateAll((cards) =>
    cards.map((card) => [(card as HTMLElement).dataset.unit, (card as HTMLElement).dataset.type, card.querySelector('.card__type')?.textContent]),
  );
  expect(types).toEqual([
    ['bmacron', 'money', 'Votes'],
    ['villepin', 'attack', 'Attaque'],
    ['lassalle', 'defence', 'Défense'],
    ['poutou', 'attack', 'Attaque'],
    ['riner', 'defence', 'Défense'],
    ['crs', 'defence', 'Défense'],
    ['pompiers', 'effect', 'Effet'],
  ]);
  // The family is also part of what a screen reader hears.
  await expect(page.locator('#card-desc-pompiers')).toContainText('Type : Effet');
});

test('the tax inspector withholds votes at source', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'gauche', 3);
  const before = await page.evaluate(() => window.__P2027__.state()!.resources);
  await page.evaluate(() => {
    window.__P2027__.spawn('impots', 2, 8);
    return window.__P2027__.advance(6, false);
  });
  expect(await page.evaluate(() => window.__P2027__.state()!.resources)).toBeLessThan(before);
});

test('the campaign trump card charges, fires and resets', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'gauche', 2);
  const button = page.locator('[data-action="ultimate"]');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await page.evaluate(() => window.__P2027__.advance(76, true));
  await expect(button).toHaveAttribute('aria-disabled', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-disabled', 'true');
});
