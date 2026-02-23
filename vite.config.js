// vite.config.js
// 🚨 [New] 구글 로봇을 위한 사이트맵 자동 생성 플러그인 도입
// 🚨 [Fix] 배포 시마다 최신 라우트 정보를 수집하여 sitemap.xml과 robots.txt를 자동 생성하도록 설정

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 🚨 [New] 사이트맵 생성 설정
    Sitemap({
      hostname: 'https://gateo.kr',
      // 구글이 수집해야 할 주요 경로들을 명시합니다.
      dynamicRoutes: [
        '/',
        '/auth/login',
        '/auth/signup',
        '/auth/forgot-password',
        '/auth/update-password'
      ]
    })
  ],
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