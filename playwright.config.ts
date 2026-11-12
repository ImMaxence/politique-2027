import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the production build (`npm run build` first).
 * Set PW_CHANNEL=msedge or chrome to use an installed browser instead of
 * downloading one with `npx playwright install chromium`.
 * Set BASE_URL to test another target, e.g. the Docker container.
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:4321';
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, testMatch: /layout\.spec\.ts/ },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run preview', url: `${baseURL}/fr`, reuseExistingServer: true, timeout: 60_000 },
});
