import { expect, test } from '@playwright/test';
import { openGame, startMatch } from './helpers';

test('a special opponent gets a "New!" card the first time only, and the match waits for it', async ({ page }) => {
  await openGame(page, 'fr');
  await startMatch(page, 'gauche', 3);
  await page.evaluate(() => window.__P2027__.intros(true));
  await page.evaluate(() => window.__P2027__.spawn('syndicat', 2, 8.5));

  const card = page.locator('[data-overlay="intro"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toHaveText('Syndicaliste');
  await expect(card).toContainText('grève');
  await expect(card.locator('[data-action="intro-ok"]')).toBeFocused();
  // The match is on hold while the card is open.
  const before = await page.evaluate(() => window.__P2027__.state()!.time);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__P2027__.state()!.time)).toBe(before);

  await card.locator('[data-action="intro-ok"]').click();
  await expect(card).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__P2027__.state()!.time)).toBeGreaterThan(before);

  // Seen once: the next one walks on without a card. A guest's card says what he does.
  await page.evaluate(() => window.__P2027__.spawn('syndicat', 1, 8.5));
  await page.waitForTimeout(300);
  await expect(card).toBeHidden();
  await page.evaluate(() => window.__P2027__.spawn('niel', 3, 8.5));
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toHaveText('Xavier Niel');
  await expect(card.locator('[data-slot="intro-power"]')).toContainText('Coupure réseau');
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('politique2027:save')!).seen);
  expect(seen).toEqual(['syndicat', 'niel']);
});

test('the calendar says who turns up each night, guests included', async ({ page }) => {
  await openGame(page, 'fr');
  await page.locator('[data-camp="droite"]').click();
  const street = page.locator('[data-level="4"] .level-card__cast');
  await expect(street).toContainText('Syndicaliste');
  await expect(street).toContainText('Smicard');
  await expect(street).toContainText('HugoDécrypte');
  // Squeezie only comes against the Right.
  const firstRound = page.locator('[data-level="7"] .level-card__cast');
  await expect(firstRound.getByText('Squeezie')).toBeVisible();
  await page.locator('[data-action="change-camp"]').click();
  await page.locator('[data-camp="gauche"]').click();
  await expect(firstRound.getByText('Squeezie')).toBeHidden();
  await expect(page.locator('[data-level="3"] .level-card__cast')).toContainText('Xavier Niel');
  // And what the crowd is after.
  await expect(page.locator('[data-level="2"] .level-card__goal')).toContainText('Les subventions agricoles');
});

test('hard mode is a choice on the calendar, remembered and applied to the match', async ({ page }) => {
  await openGame(page, 'en');
  await page.locator('[data-camp="centre"]').click();
  const hard = page.locator('[data-action="difficulty"][data-value="hard"]');
  await expect(hard).toHaveAttribute('aria-pressed', 'false');
  await hard.click();
  await expect(hard).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-action="difficulty"][data-value="normal"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-level="1"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  expect(await page.evaluate(() => window.__P2027__.state()!.hard)).toBe(true);
  await page.reload();
  await page.waitForSelector('#game[data-ready="true"]');
  await expect(page.locator('[data-action="difficulty"][data-value="hard"]')).toHaveAttribute('aria-pressed', 'true');
});

test('easy mode is a choice on the calendar too: smaller waves, more votes to start with', async ({ page }) => {
  await openGame(page, 'en');
  await page.locator('[data-camp="gauche"]').click();
  const easy = page.locator('[data-action="difficulty"][data-value="easy"]');
  await easy.click();
  await expect(easy).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-action="difficulty"][data-value="normal"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-level="1"]').click();
  await page.waitForSelector('[data-screen="match"]:not([hidden])');
  const state = await page.evaluate(() => window.__P2027__.state()!);
  expect(state.easy).toBe(true);
  expect(state.hard).toBe(false);
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('politique2027:save')!));
  expect(save.difficulty).toBe('easy');
});

test('the pause menu lists the keyboard shortcuts', async ({ page }) => {
  await openGame(page, 'en');
  await startMatch(page, 'autres', 1);
  await page.locator('[data-action="pause"]').click();
  const keys = page.locator('[data-overlay="pause"] .panel__keys');
  await expect(keys).toBeVisible();
  await expect(keys).toContainText('Enter to place');
});

test('the result can be shared as a picture', async ({ page }) => {
  // Stand in for the system share sheet.
  await page.addInitScript(() => {
    const shared: { type: string; size: number; text: string }[] = [];
    (window as unknown as { __shared: typeof shared }).__shared = shared;
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: async (data: { files: File[]; text: string }) => {
        shared.push({ type: data.files[0].type, size: data.files[0].size, text: data.text });
      },
      configurable: true,
    });
  });
  await openGame(page, 'en');
  await startMatch(page, 'droite', 1);
  await page.evaluate(() => window.__P2027__.advance(400, true));
  const result = page.locator('[data-overlay="result"]');
  await expect(result).toBeVisible();
  await result.locator('[data-action="share"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length)).toBe(1);
  const [shot] = await page.evaluate(() => (window as unknown as { __shared: { type: string; size: number; text: string }[] }).__shared);
  expect(shot.type).toBe('image/png');
  expect(shot.size).toBeGreaterThan(20_000);
  expect(shot.text).toContain('Politique 2027');
});

test('the site can be installed and played offline', async ({ page, request }) => {
  await page.goto('/fr/jouer');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  const manifest = await (await request.get('/site.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  const worker = await request.get('/sw.js');
  expect(worker.status()).toBe(200);
  expect(worker.headers()['content-type']).toContain('javascript');
  const source = await worker.text();
  expect(source).toMatch(/const CACHE = 'politique2027-\d+\.\d+\.\d+'/);
  // The worker only ever handles this site's own requests.
  expect(source).toContain('url.origin !== self.location.origin');
  // On a desktop, no "add to home screen" tip.
  await expect(page.locator('[data-slot="install-tip"]')).toBeHidden();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a tip explains how to play full screen, and can be dismissed for good', async ({ page }) => {
    await page.goto('/fr/jouer');
    await page.waitForSelector('#game[data-ready="true"]');
    const tip = page.locator('[data-slot="install-tip"]');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('écran d’accueil');
    await tip.locator('[data-action="dismiss-install"]').tap();
    await expect(tip).toBeHidden();
    await page.reload();
    await page.waitForSelector('#game[data-ready="true"]');
    await expect(tip).toBeHidden();
  });
});
