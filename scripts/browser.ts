import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium, type Browser } from '@playwright/test';

const require = createRequire(import.meta.url);

/**
 * Launches Chromium for the asset scripts. Set PW_CHANNEL=msedge (or chrome) to
 * reuse a browser that is already installed instead of downloading one with
 * `npx playwright install chromium`.
 */
export function launch(): Promise<Browser> {
  return chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
}

function fontData(pkgFile: string): string {
  return readFileSync(require.resolve(pkgFile)).toString('base64');
}

/** @font-face rules with the self-hosted fonts inlined, for pages built with setContent(). */
export function fontFaces(): string {
  return `
    @font-face { font-family: 'Anton'; font-weight: 400; font-display: block;
      src: url(data:font/woff2;base64,${fontData('@fontsource/anton/files/anton-latin-400-normal.woff2')}) format('woff2'); }
    @font-face { font-family: 'Public Sans'; font-weight: 100 900; font-display: block;
      src: url(data:font/woff2;base64,${fontData('@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2')}) format('woff2'); }`;
}
