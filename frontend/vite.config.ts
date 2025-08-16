import { defineConfig } from 'vite'
// @ts-ignore
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/external': {
        target: 'https://devpg.bluewalnut.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
        secure: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    // 환경 변수 호환성을 위해
    global: 'globalThis',
  },
})