import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// AI 通识课 — React 单页应用
// base 用相对路径，方便部署到任意子路径 / 静态托管
export default defineConfig({
  base: './',
  plugins: [react()],
})
