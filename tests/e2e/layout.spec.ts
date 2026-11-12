import { expect, test, type Page } from '@playwright/test';
import { PAGES, openGame, startMatch } from './helpers';

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

// 320 px is the WCAG reflow width; 640 px is what a 1280 px window shows at 200% zoom.
for (const width of [320, 640]) {
  test.describe(`${width}px wide`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const { url } of PAGES) {
      test(`${url} reflows without horizontal scrolling`, async ({ page }) => {
        await page.goto(url);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
      });
    }

    test('the match screen fits and keeps its controls reachable', async ({ page }) => {
      await openGame(page, 'fr');
      await startMatch(page, 'droite', 2);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      for (const action of ['pause', 'mute', 'remove', 'ultimate']) {
        await expect(page.locator(`[data-action="${action}"]`)).toBeVisible();
      }
      // Touch targets: every courtyard square stays at least 24 × 24 CSS px (WCAG 2.5.8).
      const box = await page.locator('[data-cell]').nth(20).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    });
  });
}

test('a phone held sideways shows the whole courtyard', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openGame(page, 'en');
  await startMatch(page, 'centre', 5); // the fullest toolbar: six figures and two reinforcements
  const stage = (await page.locator('.stage').boundingBox())!;
  const hud = (await page.locator('.hud').boundingBox())!;
  // The courtyard and the side column both fit inside the 390 px tall viewport…
  for (const box of [stage, hud]) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }
  // …side by side, and the courtyard squares are comfortable touch targets.
  expect(hud.x + hud.width).toBeLessThanOrEqual(stage.x);
  const cell = (await page.locator('[data-cell]').nth(20).boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(44);
  expect(cell.height).toBeGreaterThanOrEqual(44);
  // No control is clipped or stacked on another one.
  const controls = page.locator('.hud .card, .hud .tool, .hud .icon-btn');
  const boxes = await controls.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  for (const a of boxes) {
    expect(a.x).toBeGreaterThanOrEqual(hud.x);
    expect(a.x + a.width).toBeLessThanOrEqual(hud.x + hud.width + 0.5);
    for (const b of boxes) {
      if (a === b) continue;
      const apart = a.x + a.width <= b.x + 0.5 || b.x + b.width <= a.x + 0.5 || a.y + a.height <= b.y + 0.5 || b.y + b.height <= a.y + 0.5;
      expect(apart).toBe(true);
    }
  }
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

test('reduced motion is honoured by the page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fr');
  const behaviour = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(behaviour).toBe('auto');
});
