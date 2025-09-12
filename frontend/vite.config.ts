import { defineConfig, loadEnv } from 'vite'
// @ts-ignore
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [
      react(),
      // 번들 분석기 (프로덕션 빌드시에만)
      mode === 'analyze' && visualizer({
        filename: 'build/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      open: true,
      proxy: {
        '/api/external': {
          target: 'https://devpg.bluewalnut.co.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/external/, ''),
          secure: true,
        },
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'build',
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // React 관련 라이브러리를 별도 청크로 분리
            'react-vendor': ['react', 'react-dom'],
            
            // Monaco Editor를 별도 청크로 분리 (큰 라이브러리)
            'monaco': ['@monaco-editor/react'],
            
            // 통신 관련 라이브러리
            'network': ['axios', 'sockjs-client', '@stomp/stompjs'],
            
            // 라우팅 관련
            'router': ['react-router-dom'],
            
            // 스타일링 관련
            'styling': ['styled-components', 'react-syntax-highlighter'],
            
            // DND 라이브러리들
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          },
        },
      },
    },
    define: {
      // 환경 변수 호환성을 위해
      global: 'globalThis',
    },
    // Tree shaking 최적화
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios'
      ],
      exclude: ['@monaco-editor/react']
    },
  };
});