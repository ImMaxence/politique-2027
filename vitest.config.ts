import { defineConfig } from 'vitest/config';

// Unit tests only cover the DOM-free simulation; browser tests live in tests/e2e (Playwright).
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
