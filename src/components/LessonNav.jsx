import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { stages, lessons, lessonNo } from '../data/lessons.js'
import { useLang, useUI } from '../i18n/LangContext.jsx'
import { pick } from '../i18n/pick.js'

// 课程页目录：宽屏为左侧固定栏；窄屏隐藏侧栏，改用右下角「目录」按钮唤出抽屉。
export default function LessonNav({ currentSlug, collapsed = false, onToggleCollapsed }) {
  const activeRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1340px)').matches
  )
  const { pathname } = useLocation()
  const { lang } = useLang()
  const t = useUI()
  const tocInteractive = wide ? !collapsed : open
  const peekInteractive = wide && collapsed

  // 进入某课时，把当前条目滚动到目录可视区中央
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [currentSlug])

  // 切换课程（路由变化）后自动收起抽屉
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // 抽屉打开时锁定页面滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1340px)')
    const onChange = () => setWide(media.matches)
    onChange()
    if (media.addEventListener) media.addEventListener('change', onChange)
    else media.addListener?.(onChange)
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', onChange)
      else media.removeListener?.(onChange)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const isTyping = target?.closest?.('input, textarea, select, [contenteditable="true"]')
      if (isTyping || event.repeat || (!event.metaKey && !event.ctrlKey) || event.key.toLowerCase() !== 'b') return

      event.preventDefault()
      if (window.matchMedia('(max-width: 1339px)').matches) {
        setOpen((v) => !v)
      } else {
        onToggleCollapsed?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onToggleCollapsed])

  return (
    <>
      {/* 窄屏唤出按钮 */}
      <button
        className="toc-fab"
        aria-label={t.lessonNav.openAria}
        aria-expanded={open}
        title={t.lessonNav.shortcutHint}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span>{t.lessonNav.fab}</span>
      </button>

      <button
        className={`toc-peek${collapsed ? ' show' : ''}`}
        aria-label={t.lessonNav.expandAria}
        aria-hidden={!peekInteractive}
        aria-keyshortcuts="Meta+B Control+B"
        disabled={!peekInteractive}
        tabIndex={peekInteractive ? 0 : -1}
        title={t.lessonNav.shortcutHint}
        onClick={onToggleCollapsed}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span>{t.lessonNav.fab}</span>
      </button>

      {/* 窄屏抽屉遮罩 */}
      <div
        className={`toc-backdrop${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`lesson-toc${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}
        aria-label={t.lessonNav.asideAria}
        aria-hidden={!tocInteractive}
        inert={tocInteractive ? undefined : ''}
        title={t.lessonNav.shortcutHint}
      >
        <div className="toc-head">
          <span className="toc-title">{t.lessonNav.headTitle}</span>
          <span className="toc-shortcut" aria-hidden="true">{t.lessonNav.shortcutHint}</span>
          <button
            className="toc-toggle"
            aria-label={t.lessonNav.collapseAria}
            aria-keyshortcuts="Meta+B Control+B"
            title={t.lessonNav.shortcutHint}
            onClick={onToggleCollapsed}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="toc-close" aria-label={t.lessonNav.closeAria} onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        {stages.map((st, si) => (
          <div className="toc-stage" key={si}>
            <div className="toc-stage-title">{pick(st.num, lang)} · {pick(st.title, lang).split(' · ')[0]}</div>
            <ul>
              {lessons
                .filter((l) => l.stage === si)
                .map((l) => {
                  const active = l.slug === currentSlug
                  return (
                    <li key={l.id}>
                      <Link
                        ref={active ? activeRef : null}
                        className={`toc-item${active ? ' active' : ''}`}
                        to={`/lesson/${l.slug}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="toc-no">{lessonNo(l)}</span>
                        <span className="toc-name">{pick(l.title, lang)}</span>
                      </Link>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </aside>
    </>
  )
}
