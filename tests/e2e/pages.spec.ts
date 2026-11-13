import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { url: '/fr/personnages/emmanuel-macron', alt: '/en/characters/emmanuel-macron', h1: 'Emmanuel Macron' },
  { url: '/en/characters/elise-lucet', alt: '/fr/personnages/elise-lucet', h1: 'Élise Lucet' },
  { url: '/fr/personnages/bernard-cazeneuve', alt: '/en/characters/bernard-cazeneuve', h1: 'Bernard Cazeneuve' },
  { url: '/fr/soirees/le-debat-d-entre-deux-tours', alt: '/en/nights/the-run-off-debate', h1: "Le débat d'entre-deux-tours" },
  { url: '/en/nights/the-run-off', alt: '/fr/soirees/le-second-tour', h1: 'The Run-off' },
];

for (const { url, alt, h1 } of PAGES) {
  test(`${url}: its own title, address, alternate and no accessibility violation`, async ({ page, baseURL }) => {
    const response = await page.goto(url);
    expect(response!.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(h1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical!.endsWith(url)).toBe(true);
    const other = url.startsWith('/fr') ? 'en' : 'fr';
    expect((await page.locator(`link[rel="alternate"][hreflang="${other}"]`).getAttribute('href'))!.endsWith(alt)).toBe(true);
    // The language switch goes to the same figure or night.
    expect(await page.locator('.nav__tools a').getAttribute('href')).toBe(alt);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    expect(baseURL).toBeTruthy();
  });
}

test('the characters page links every figure to its page, and the sitemap lists them', async ({ page, request }) => {
  await page.goto('/fr/personnages');
  const links = await page.locator('.figure-card h3 a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(links.length).toBe(34);
  expect(links).toContain('/fr/personnages/nathalie-arthaud');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/en/characters/xavier-bertrand');
  expect(sitemap).toContain('/fr/soirees/cohabitation');
});
