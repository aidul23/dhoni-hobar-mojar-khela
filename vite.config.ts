/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development the game server runs separately (npm run dev:server).
    proxy: { '/ws': { target: 'ws://localhost:8787', ws: true } },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
