import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { LangProvider } from './i18n/LangContext.jsx'

// 部署新版本后，旧页面懒加载已被替换的课程分包会 404，自动刷新拿到新版本
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

// 全局设计系统（暖纸 + 墨色单色品牌，自动深色模式）
import './styles/style.css'
import './styles/lesson.css'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LangProvider>
  </React.StrictMode>,
)
