import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Booting Nest, running migrations and argon2 hashing take a few seconds
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
