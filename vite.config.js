import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 핵심 : localhost만 고집하지 않고 모든 ip 접속을 허용함
    port: 5173,      // 포트 번호 고정(선택사항)
  },
  // 🚨 [Fix/New] 배포 시 정밀 로그 제거를 위한 esbuild 설정 추가
  esbuild: {
    // console.log와 debugger만 제거하고, error/warn은 유지하여 비관적 설계(장애 대응)를 지원함
    pure: ['console.log'], 
    drop: ['debugger'],
  },
  build: {
    // 빌드 결과물을 최적화함
    minify: 'esbuild',
  }
})