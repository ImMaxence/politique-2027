import { expect, test, type Page } from '@playwright/test';
import { PAGES, openGame, startMatch } from './helpers';

/** Every request a page makes, minus inlined data. */
function recordRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) urls.push(url);
  });
  return urls;
}

// The privacy policy promises: no cookie, no tracker, no third-party request.
for (const { url } of PAGES) {
  test(`${url} talks to no other origin and sets no cookie`, async ({ page, context, baseURL }) => {
    const requests = recordRequests(page);
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    const origin = new URL(baseURL!).origin;

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.filter((u) => new URL(u).origin !== origin)).toEqual([]);
    expect(await response!.headerValue('set-cookie')).toBeNull();
    expect(await context.cookies()).toEqual([]);
  });
}

test('a full match makes no network request beyond the page itself', async ({ page, context, baseURL }) => {
  await openGame(page, 'fr');
  const requests = recordRequests(page);
  await startMatch(page, 'gauche', 3);
  await page.evaluate(() => window.__P2027__.advance(120, true));
  await page.waitForTimeout(500);

  const origin = new URL(baseURL!).origin;
  expect(requests.filter((u) => new URL(u).origin !== origin)).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  // Progress is kept in localStorage only, under the single documented key.
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['politique2027:save']);
});

test('security.txt is published', async ({ request }) => {
  const response = await request.get('/.well-known/security.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toMatch(/^Contact: https:\/\//m);
  expect(text).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
});
