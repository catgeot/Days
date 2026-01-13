import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
	server: {
		host:'0.0.0.0', //핵심 :localhost만 고집하지 않고 모든 ip 접속을 허용함
		port:5173, //포트 번호 고정(선택사항)
	},
})
