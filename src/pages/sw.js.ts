import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { PHOTOS } from '../game/data/photos';

/** Every photo head, so that a match started offline still shows real faces. */
const HEADS = Object.entries(PHOTOS).flatMap(([id, faces]) => faces.map((face) => `/heads/${id}-${face}.webp`));

/**
 * Service worker: keeps a copy of the game on the device so that it opens and
 * plays offline (and from the home screen). It only ever talks to this site, and
 * stores nothing but the site's own files. The cache name carries the version, so
 * a release replaces the old copy.
 */
const source = `const CACHE = 'politique2027-${SITE.version}';
const PAGES = ['/', '/fr', '/en', '/fr/jouer', '/en/play', '/site.webmanifest', '/favicon.svg', '/icon-192.png'];
const PLAY = ['/fr/jouer', '/en/play'];
const HEADS = ${JSON.stringify(HEADS)};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PAGES);
    // The game pages' own scripts and styles, and the fonts those styles use.
    const assets = new Set();
    for (const page of PLAY) {
      const response = await cache.match(page);
      const html = response ? await response.text() : '';
      for (const match of html.matchAll(/(?:src|href)="(\\/_astro\\/[^"]+)"/g)) assets.add(match[1]);
    }
    for (const sheet of [...assets].filter((url) => url.endsWith('.css'))) {
      const css = await (await fetch(sheet)).text();
      for (const match of css.matchAll(/url\\((\\/_astro\\/[^)]*latin-[^)]*\\.woff2)\\)/g)) {
        if (!match[1].includes('latin-ext')) assets.add(match[1]);
      }
    }
    await cache.addAll([...assets, ...HEADS]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const keep = (response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  };
  if (request.mode === 'navigate') {
    // Pages: the network first, so that news arrive; the copy when offline.
    event.respondWith(
      fetch(request).then(keep).catch(async () =>
        (await caches.match(request)) || (await caches.match(url.pathname.startsWith('/en') ? '/en/play' : '/fr/jouer')),
      ),
    );
    return;
  }
  // Scripts, styles, fonts and pictures are versioned or rarely change: the copy first.
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then(keep)));
});
`;

export const GET: APIRoute = () =>
  new Response(source, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
