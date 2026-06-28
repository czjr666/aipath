import { Link } from 'react-router-dom'
import { lessonNeighbors, lessonNo } from '../data/lessons.js'
import { useLang, useUI } from '../i18n/LangContext.jsx'
import { pick } from '../i18n/pick.js'

// 上下课导航。首课的“上一课”指向课程目录。
export default function Pager({ lesson }) {
  const { prev, next } = lessonNeighbors(lesson)
  const { lang } = useLang()
  const t = useUI()

  return (
    <div className="pager">
      {prev ? (
        <Link className="card prev" to={`/lesson/${prev.slug}`}>
          <div className="dir">{t.pager.prevDir}</div>
          <div className="name">
            <span className="pager-no">{lessonNo(prev)}</span>
            <span className="pager-title">{pick(prev.title, lang)}</span>
          </div>
        </Link>
      ) : (
        <Link className="card prev" to="/#path">
          <div className="dir">{t.pager.tocBackDir}</div>
          <div className="name">
            <span className="pager-title">{t.pager.pathName}</span>
          </div>
        </Link>
      )}
      {next ? (
        <Link className="card next" to={`/lesson/${next.slug}`}>
          <div className="dir">{t.pager.nextDir}</div>
          <div className="name">
            <span className="pager-no">{lessonNo(next)}</span>
            <span className="pager-title">{pick(next.title, lang)}</span>
          </div>
        </Link>
      ) : (
        <Link className="card next" to="/#path">
          <div className="dir">{t.pager.tocFwdDir}</div>
          <div className="name">
            <span className="pager-title">{t.pager.backToPath}</span>
          </div>
        </Link>
      )}
    </div>
  )
}
