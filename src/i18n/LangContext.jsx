// ============================================================
// 语言上下文：zh / en 切换，localStorage 持久化，自建无第三方库。
// 网址不带 locale —— 切换仅在内存生效，刷新由 localStorage 记忆。
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UI, META } from './strings.js'

const LangContext = createContext(null)
const STORAGE_KEY = 'aipath-lang'
const SUPPORTED = ['zh', 'en']

// 初始语言：localStorage 优先；否则按浏览器语言（zh-* → zh，其余默认 en）。
function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED.includes(saved)) return saved
  } catch {
    /* localStorage 不可用（隐私模式等）时静默回退 */
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language || 'en').toLowerCase()
  return nav.startsWith('zh') ? 'zh' : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial)

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* 忽略写入失败 */
    }
  }, [])

  const toggle = useCallback(() => {
    setLangState((cur) => {
      const next = cur === 'zh' ? 'en' : 'zh'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* 忽略写入失败 */
      }
      return next
    })
  }, [])

  // 同步 <html lang> 与文档 title / description。
  // 课程页会在 LessonPage 内再覆写一次 title（带课名），那次以依赖 [lang] 的 effect 后写为准。
  useEffect(() => {
    const meta = META[lang] || META.zh
    document.documentElement.lang = meta.lang
    document.title = meta.title
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', meta.description)
    // 社交分享图随语言切换：og-image(中) / og-image-en(英)
    const setMeta = (sel, val) => {
      const el = document.querySelector(sel)
      if (el && val) el.setAttribute('content', val)
    }
    setMeta('meta[property="og:image"]', meta.ogImage)
    setMeta('meta[name="twitter:image"]', meta.ogImage)
    setMeta('meta[property="og:image:alt"]', meta.title)
    setMeta('meta[property="og:title"]', meta.title)
    setMeta('meta[name="twitter:title"]', meta.title)
    setMeta('meta[property="og:locale"]', meta.ogLocale)
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within <LangProvider>')
  return ctx
}

// 便捷：直接拿当前语言的 UI 文案树（整体回退 zh）
export function useUI() {
  const { lang } = useLang()
  return UI[lang] || UI.zh
}
