import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
  },
});
