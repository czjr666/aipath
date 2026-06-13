import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLang, useUI } from '../i18n/LangContext.jsx'

// 毛玻璃吸顶导航。品牌回首页；区块链接在首页内平滑滚动，跨页则先回首页再滚动。
export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { lang, toggle } = useLang()
  const t = useUI()

  function goSection(e, id) {
    e.preventDefault()
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    if (pathname === '/') {
      scroll()
    } else {
      navigate('/')
      // 等首页挂载后再滚动
      setTimeout(scroll, 60)
    }
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/">
          <span className="brand-dot">AI</span>Path
        </Link>
        <div className="nav-links">
          <a href="/#idea" onClick={(e) => goSection(e, 'idea')}>{t.nav.idea}</a>
          <a href="/#path" onClick={(e) => goSection(e, 'path')}>{t.nav.path}</a>
          <a href="/#usage" onClick={(e) => goSection(e, 'usage')}>{t.nav.usage}</a>
          <button
            className="nav-lang"
            onClick={toggle}
            aria-label={t.nav.switchLang}
            title={t.nav.switchLang}
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <a
            className="nav-github"
            href="https://github.com/buynao/aipath"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.nav.github}
            title={t.nav.github}
          >
            <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  )
}
