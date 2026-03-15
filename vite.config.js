import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    Sitemap(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  esbuild: {
    pure: ['console.log'],
    drop: ['debugger'],
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 🚨 [강화] 수동으로 이름표를 붙여주는 대신, 패키지 이름에 따라 자동으로 쪼개주는 함수 적용
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 가장 무거운 3D 라이브러리 분리
            if (id.includes('three')) return 'three';
            if (id.includes('globe')) return 'globe';
            // 이미지 압축 라이브러리 분리
            if (id.includes('browser-image-compression')) return 'image-compression';
            // 기존 분리 항목들
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';

            // 그 외 자잘한 외부 라이브러리들은 모두 'vendor'로 묶음
            return 'vendor';
          }
        }
      }
    }
  }
});
