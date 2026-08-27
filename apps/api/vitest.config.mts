import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    sequence: { concurrent: false },
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    forks: { singleFork: true },
    env: {
      // Test DB terpisah dari dev.db (packages/database/dev.test.db)
      DATABASE_URL: 'file:../dev.test.db',
      AUTH_SECRET: 'test-secret-key',
    },
  },
});
