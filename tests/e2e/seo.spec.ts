import { expect, test } from '@playwright/test';
import { SITE } from '../../src/config/site';
import { absolute, otherLang, path } from '../../src/i18n/routes';
import { PAGES, watchErrors } from './helpers';

for (const { lang, route, url } of PAGES) {
  test(`${url} carries complete metadata`, async ({ page }) => {
    const errors = watchErrors(page);
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(15);
    expect(title.length).toBeLessThanOrEqual(65);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description!.length).toBeGreaterThan(60);
    expect(description!.length).toBeLessThanOrEqual(200);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absolute(url));
    const other = otherLang(lang);
    await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute('href', absolute(path(other, route)));
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', absolute(path('fr', route)));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', absolute('/og.png'));
    await expect(page.locator('h1')).toHaveCount(1);

    // Structured data must be valid JSON with a schema.org context.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const block of blocks) expect(JSON.parse(block)['@context']).toBe('https://schema.org');
    if (route === 'home') {
      const types = blocks.map((b) => JSON.parse(b)['@type']);
      expect(types).toEqual(expect.arrayContaining(['WebSite', 'VideoGame', 'FAQPage']));
    } else {
      expect(blocks.some((b) => JSON.parse(b)['@type'] === 'BreadcrumbList')).toBe(true);
    }

    // The language switch leads to the same page in the other language.
    await page.locator(`.nav__tools a[hreflang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path(other, route)}$`));

    // No console error: this also catches Content-Security-Policy violations.
    expect(errors).toEqual([]);
  });
}

test('sitemap lists every page with its alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const { url } of PAGES) expect(xml).toContain(`<loc>${absolute(url)}</loc>`);
  expect(xml.match(/<url>/g)).toHaveLength(PAGES.length);
  expect(xml).toContain('hreflang="x-default"');
});

test('robots.txt welcomes crawlers and points to the sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-agent: *\nAllow: /');
  expect(robots).toContain('User-agent: GPTBot');
  expect(robots).toContain('User-agent: ClaudeBot');
  expect(robots).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
  expect(robots).not.toContain('Disallow');
});

test('llms.txt follows the expected shape', async ({ request }) => {
  const text = await (await request.get('/llms.txt')).text();
  expect(text.startsWith(`# ${SITE.name}\n\n> `)).toBe(true);
  expect(text).toContain(absolute(path('en', 'play')));
  const full = await (await request.get('/llms-full.txt')).text();
  for (const name of ['Emmanuel Macron', 'Jean-Luc Mélenchon', 'Marine Le Pen', 'General Strike', 'Dissolution']) {
    expect(full).toContain(name);
  }
});

test('the theme switch cycles and persists', async ({ page }) => {
  await page.goto('/fr');
  const html = page.locator('html');
  const toggle = page.locator('[data-theme-toggle]');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(html).not.toHaveAttribute('data-theme', /.+/);
});
