import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
      '@pages': '/src/pages',
      '@lib': '/src/lib',
      '@stores': '/src/stores',
      '@types': '/src/types',
      '@styles': '/src/styles',
      '@content': '/src/content',
      '@db': '/src/db',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/format.ts', 'src/lib/search.ts', 'src/stores/cartStore.ts', 'src/stores/wishlistStore.ts'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
