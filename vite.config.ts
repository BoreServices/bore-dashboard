import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { apiDevServer } from './vite-plugin-api'

export default defineConfig({
  plugins: [react(), apiDevServer()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
})
