import { Link } from 'react-router-dom'
import { lessonById } from '../data/lessons.js'
import { useLang, useUI } from '../i18n/LangContext.jsx'
import { pick } from '../i18n/pick.js'

// 上下课导航。首课的“上一课”指向课程目录。
export default function Pager({ lesson }) {
  const prev = lessonById(lesson.id - 1)
  const next = lessonById(lesson.id + 1)
  const { lang } = useLang()
  const t = useUI()

  return (
    <div className="pager">
      {prev ? (
        <Link className="card prev" to={`/lesson/${prev.slug}`}>
          <div className="dir">{t.pager.prevDir}</div>
          <div className="name">{String(prev.id).padStart(2, '0')} {pick(prev.title, lang)}</div>
        </Link>
      ) : (
        <Link className="card prev" to="/#path">
          <div className="dir">{t.pager.tocBackDir}</div>
          <div className="name">{t.pager.pathName}</div>
        </Link>
      )}
      {next ? (
        <Link className="card next" to={`/lesson/${next.slug}`}>
          <div className="dir">{t.pager.nextDir}</div>
          <div className="name">{String(next.id).padStart(2, '0')} {pick(next.title, lang)}</div>
        </Link>
      ) : (
        <Link className="card next" to="/#path">
          <div className="dir">{t.pager.tocFwdDir}</div>
          <div className="name">{t.pager.backToPath}</div>
        </Link>
      )}
    </div>
  )
}
