import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { stages, lessons } from '../data/lessons.js'
import { useLang, useUI } from '../i18n/LangContext.jsx'
import { pick } from '../i18n/pick.js'

// 课程页目录：宽屏为左侧固定栏；窄屏隐藏侧栏，改用右下角「目录」按钮唤出抽屉。
export default function LessonNav({ currentSlug }) {
  const activeRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { lang } = useLang()
  const t = useUI()

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

  return (
    <>
      {/* 窄屏唤出按钮 */}
      <button
        className="toc-fab"
        aria-label={t.lessonNav.openAria}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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

      <aside className={`lesson-toc${open ? ' open' : ''}`} aria-label={t.lessonNav.asideAria}>
        <div className="toc-head">
          <span>{t.lessonNav.headTitle}</span>
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
                        <span className="toc-no">{String(l.id).padStart(2, '0')}</span>
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
