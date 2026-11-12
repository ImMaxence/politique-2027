// @ts-check
import { defineConfig } from 'astro/config';

// Static site: every page is prerendered and served by nginx (see Dockerfile).
export default defineConfig({
  site: 'https://politique2027.mbonnici.fr',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /fr/jouer -> fr/jouer.html, so canonical URLs carry no trailing slash.
    format: 'file',
    inlineStylesheets: 'auto',
  },
  // Lossless whitespace handling: the copy is prose-heavy (legal pages, FAQ).
  compressHTML: true,
  // No code blocks on the site: skip Shiki, whose inline styles are incompatible with the CSP.
  markdown: { syntaxHighlight: false },
  security: {
    // Emits a per-page <meta http-equiv="content-security-policy"> with hashes
    // for the bundled scripts and styles. frame-ancestors lives in nginx.conf
    // because it cannot be set from a meta tag.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  server: { port: 4321 },
});
