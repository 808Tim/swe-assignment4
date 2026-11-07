import { defineConfig } from 'vitest/config';

// Runs only the original (unreviewed) AI-generated suite.
export default defineConfig({
  test: {
    include: ['tests/first/**/*.test.ts'],
  },
});
