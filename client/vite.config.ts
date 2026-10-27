import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  optimizeDeps: {
    include: ['ag-grid-community', 'ag-grid-react'],
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
