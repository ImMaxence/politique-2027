import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { LANGS } from '../i18n/game';
import { PRIORITY, ROUTE_KEYS, absolute, path } from '../i18n/routes';

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

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
