import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PAGES, openGame, startMatch } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function audit(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

// The site has a single (dark) theme. The audits run with a browser that prefers
// light on purpose: the system preference must not change anything.
test.describe('axe', () => {
  test.use({ colorScheme: 'light' });

  for (const { url } of PAGES) {
    test(`${url} has no detectable accessibility violation`, async ({ page }) => {
      await page.goto(url);
      await audit(page);
    });
  }

  test('game: calendar, match and pause screens', async ({ page }) => {
    test.slow(); // three audits while the match is rendering
    await openGame(page, 'fr');
    await page.locator('[data-camp="centre"]').click();
    await expect(page.locator('[data-screen="levels"]')).toBeVisible();
    await audit(page);

    await startMatch(page, 'centre', 1);
    await audit(page);

    await page.locator('[data-action="pause"]').click();
    await expect(page.locator('[data-overlay="pause"]')).toBeVisible();
    await audit(page);
  });

  test('game: result screen', async ({ page }) => {
    test.slow();
    await openGame(page, 'en');
    await startMatch(page, 'gauche', 1);
    await page.evaluate(() => window.__P2027__.advance(400, true));
    await expect(page.locator('[data-overlay="result"]')).toBeVisible();
    await audit(page);
  });
});

test.describe('axe — phone held upright', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('game: a match drawn in forced landscape, and its pause menu', async ({ page }) => {
    test.slow();
    await openGame(page, 'fr');
    await startMatch(page, 'autres', 3);
    await expect(page.locator('#game')).toHaveClass(/is-forced/);
    await audit(page);
    await page.locator('[data-action="pause"]').tap();
    await expect(page.locator('[data-action="orientation"]')).toBeVisible();
    await audit(page);
  });
});

test('game: a match with every card, reinforcements included', async ({ page }) => {
  test.slow();
  await openGame(page, 'en');
  await startMatch(page, 'autres', 5);
  await expect(page.locator('.card')).toHaveCount(7);
  await audit(page);
});

test('404 page has no detectable accessibility violation', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await audit(page);
});
