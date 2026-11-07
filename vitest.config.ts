import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Default run = improved suite (unit + page integration).
// The original AI-generated first suite is kept in tests/first/ as evidence; run it with `npm run test:first`.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'tests/first/**'],
  },
});
