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
  const tickets = (await page.locator('.hud__cards').boundingBox())!;
  // The board and the column of tickets both fit inside the 390 px tall viewport…
  for (const box of [stage, tickets]) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }
  // …side by side; the board uses nearly the whole height and its squares are comfortable touch targets.
  expect(tickets.x + tickets.width).toBeLessThanOrEqual(stage.x);
  expect(stage.height).toBeGreaterThan(360);
  const cell = (await page.locator('[data-cell]').nth(20).boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(44);
  expect(cell.height).toBeGreaterThanOrEqual(44);

  // Every ticket shows the name of its figure and, in full, the family of the card.
  await expect(page.locator('.card')).toHaveCount(8);
  for (const card of await page.locator('.card').all()) {
    const type = card.locator('.card__type');
    await expect(type).toBeVisible();
    expect(['Money', 'Attack', 'Effect', 'Defence']).toContain(await type.textContent());
    const label = (await type.boundingBox())!;
    expect(label.height).toBeGreaterThanOrEqual(10);
    await expect(card.locator('.card__name')).toBeVisible();
  }

  // Controls sit over the top of the scenery, inside the board, and none is clipped or stacked on another.
  const controls = page.locator('.hud .card, .hud .tool, .hud .icon-btn, .hud__res, .hud__status');
  const boxes = await controls.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  for (const a of boxes) {
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.x + a.width).toBeLessThanOrEqual(844);
    expect(a.y + a.height).toBeLessThanOrEqual(390);
    for (const b of boxes) {
      if (a === b) continue;
      const apart = a.x + a.width <= b.x + 0.5 || b.x + b.width <= a.x + 0.5 || a.y + a.height <= b.y + 0.5 || b.y + b.height <= a.y + 0.5;
      expect(apart).toBe(true);
    }
  }
  const firstLane = (await page.locator('[data-cell]').first().boundingBox())!;
  for (const action of ['remove', 'ultimate', 'speed', 'mute', 'pause']) {
    const box = (await page.locator(`[data-action="${action}"]`).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(stage.x);
    expect(box.x + box.width).toBeLessThanOrEqual(stage.x + stage.width);
    expect(box.y + box.height).toBeLessThanOrEqual(firstLane.y); // above the first lane
  }
  // The scenery is cropped around the courtyard: the squares get the room, and every one stays in view.
  const last = (await page.locator('[data-cell]').last().boundingBox())!;
  expect(firstLane.x).toBeGreaterThanOrEqual(stage.x);
  expect(last.x + last.width).toBeLessThanOrEqual(stage.x + stage.width);
  expect(last.y + last.height).toBeLessThanOrEqual(stage.y + stage.height);
  expect(cell.width).toBeGreaterThanOrEqual(60);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

// From a small phone to a short laptop window: the side column is used wherever the window is short.
for (const [width, height] of [
  [640, 360],
  [667, 375],
  [1366, 640],
]) {
  test(`${width}×${height}: tickets and board fit, and removing figures takes over the bar`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openGame(page, 'fr');
    await startMatch(page, 'droite', 7);
    await expect(page.locator('#game')).toHaveClass(/is-compact/);
    await expect(page.locator('.card')).toHaveCount(8);
    const inside = async (selector: string) => {
      for (const box of await page.locator(selector).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    };
    await inside('.stage, .hud__res, .card, .card__type, .card__cost, .hud .tool, .hud .icon-btn, .hud__status');
    // A ticket never cuts its family short: the chip is as wide as its text.
    for (const chip of await page.locator('.card__type').all()) {
      expect(await chip.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    }

    // Removal mode: the bar says what the next tap does, in place of the trump card and the polls.
    await expect(page.locator('.hud__mode')).toBeHidden();
    await page.locator('[data-action="remove"]').click();
    await expect(page.locator('#game')).toHaveClass(/is-removing/);
    await expect(page.locator('.hud__mode')).toBeVisible();
    await expect(page.locator('.hud__mode')).toHaveText('Retrait : touche une figure');
    await expect(page.locator('[data-action="ultimate"]')).toBeHidden();
    await inside('.hud__mode, .hud .icon-btn, [data-action="remove"]');
    await page.locator('[data-action="remove"]').click();
    await expect(page.locator('.hud__mode')).toBeHidden();
    await expect(page.locator('[data-action="ultimate"]')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

// Any landscape window, from a phone to a monitor: the tickets on the left and the board
// fill the window from edge to edge, the whole match is in view and nothing is cut short.
for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [1280, 720],
  [1024, 768],
  [937, 382],
]) {
  test(`${width}×${height}: tickets and board fill the window edge to edge`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openGame(page, 'fr');
    await startMatch(page, 'droite', 7);
    await expect(page.locator('#game')).toHaveClass(/is-compact/);
    const page_w = await page.evaluate(() => document.documentElement.clientWidth);
    const stage = (await page.locator('.stage').boundingBox())!;
    const tickets = (await page.locator('.hud__cards').boundingBox())!;
    expect(tickets.x).toBeLessThanOrEqual(8);
    expect(stage.x + stage.width).toBeGreaterThanOrEqual(page_w - 8);
    expect(tickets.x + tickets.width).toBeLessThanOrEqual(stage.x);
    // The board uses (nearly) the whole height or the whole width, whichever runs out first.
    expect(stage.y).toBeGreaterThanOrEqual(-1);
    expect(stage.y + stage.height).toBeLessThanOrEqual(height + 1);
    for (const chip of await page.locator('.card__type').all()) {
      expect(await chip.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    const last = (await page.locator('[data-cell]').last().boundingBox())!;
    expect(last.x + last.width).toBeLessThanOrEqual(stage.x + stage.width);
    expect(last.y + last.height).toBeLessThanOrEqual(stage.y + stage.height);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

test('a long title word breaks instead of widening the page while the display font is missing', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route('**/*.woff2', (route) => route.abort());
  for (const url of ['/fr/confidentialite', '/fr/accessibilite', '/en/accessibility']) {
    await page.goto(url);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  }
});

test('reduced motion is honoured by the page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fr');
  const behaviour = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(behaviour).toBe('auto');
});
