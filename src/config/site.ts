import pkg from '../../package.json' with { type: 'json' };

/** Single source of truth for everything site-wide (SEO, legal pages, footer). */
export const SITE = {
  name: 'Politique 2027',
  url: 'https://politique2027.mbonnici.fr',
  version: pkg.version,
  /** ISO date of the last content/legal update. Bump it with each release. */
  updated: '2026-11-12',
  published: '2026-11-12',
  author: {
    name: 'Maxence Bonnici',
    url: 'https://mbonnici.fr',
    github: 'https://github.com/ImMaxence',
    contact: { fr: 'https://mbonnici.fr/fr/contact', en: 'https://mbonnici.fr/en/contact' },
  },
  repo: 'https://github.com/ImMaxence/politique-2027',
  /** The site has one theme, and it is dark. */
  themeColor: '#141a36',
} as const;
