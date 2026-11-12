import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { SITE_STRINGS } from '../i18n/site';

export const GET: APIRoute = () => {
  const manifest = {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE_STRINGS.fr.meta.home.description,
    lang: 'fr',
    start_url: '/fr/jouer',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
