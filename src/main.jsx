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

// 浏览器网页翻译（Chrome/Edge 内置、沉浸式翻译等）会把文本节点换成自己的包裹节点。
// React 在路由切换、卸载旧课树时调用 removeChild / insertBefore，发现节点已被换走，
// 便在提交阶段抛 "The node to be removed is not a child of this node" 并整页白屏
//（内容最密的 L30 切换时最易触发）。下面让这两个操作在父节点不匹配时安全跳过，
// 而非抛错——React 团队针对该问题的通行兜底。配合 index.html 的 notranslate，双保险。
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child
    return originalRemoveChild.apply(this, arguments)
  }
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode
    return originalInsertBefore.apply(this, arguments)
  }
}

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
