import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { LANGS } from '../i18n/game';
import { PRIORITY, ROUTE_KEYS, absolute, path } from '../i18n/routes';
import { FIGURE_IDS, NIGHT_IDS, figurePath, nightPath } from '../lib/pages';

/**
 * Hand-rolled sitemap: the French and English pages have different slugs, so
 * each URL lists its exact alternates (hreflang) instead of relying on a prefix swap.
 */
export const GET: APIRoute = () => {
  const urls = ROUTE_KEYS.flatMap((route) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${absolute(path(alt, route))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(path('fr', route))}"/>`,
      ].join('\n');
      return [
        '  <url>',
        `    <loc>${absolute(path(lang, route))}</loc>`,
        `    <lastmod>${SITE.updated}</lastmod>`,
        `    <priority>${PRIORITY[route].toFixed(1)}</priority>`,
        alternates,
        '  </url>',
      ].join('\n');
    }),
  );

  // Figure and night pages: each with its alternate in the other language.
  const extra = [
    ...FIGURE_IDS.map((id) => ({ fr: figurePath('fr', id), en: figurePath('en', id), priority: 0.6 })),
    ...NIGHT_IDS.map((id) => ({ fr: nightPath('fr', id), en: nightPath('en', id), priority: 0.5 })),
  ].flatMap((page) =>
    LANGS.map((lang) =>
      [
        '  <url>',
        `    <loc>${absolute(page[lang])}</loc>`,
        `    <lastmod>${SITE.updated}</lastmod>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        ...LANGS.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${absolute(page[alt])}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(page.fr)}"/>`,
        '  </url>',
      ].join('\n'),
    ),
  );

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    ...extra,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
