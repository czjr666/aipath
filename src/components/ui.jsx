// ============================================================
// 设计系统基础原子组件 —— 直接复用 style.css / lesson.css 的类
// ============================================================
import { useState } from 'react'
import { useUI } from '../i18n/LangContext.jsx'

// 语义色药丸：type ∈ sky | terracotta | amber | sage | ink
export function Pill({ type = 'ink', children }) {
  return <span className={`pill pill-${type}`}>{children}</span>
}

// 难度点：n=亮起的点数（共 3）
export function Dots({ n = 1, total = 3 }) {
  return (
    <span className="dots">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < n ? 'dot on' : 'dot'} />
      ))}
    </span>
  )
}

// 课程小节：标题 + 可选导语
export function Lsec({ title, lead, children }) {
  return (
    <section className="lsec">
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </section>
  )
}

// 演示面板外壳：左舞台 + 右说明
export function DemoPanel({ title, hint, stage, side }) {
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{title}</span>
        {hint && <span className="demo-hint">{hint}</span>}
      </div>
      <div className="demo-body">
        <div className="demo-stage">{stage}</div>
        <div className="demo-side">{side}</div>
      </div>
    </div>
  )
}

// 切换胶囊组
export function Chips({ options, value, onChange }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.key}
          className={`chip${o.key === value ? ' active' : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// 点击揭晓卡
export function FlipCard({ q, pill, why }) {
  const [revealed, setRevealed] = useState(false)
  const t = useUI()
  return (
    <button className={`flip-card${revealed ? ' revealed' : ''}`} onClick={() => setRevealed(true)}>
      <div className="fc-q">{q}</div>
      <div className="fc-tap">{t.ui.tapReveal}</div>
      <div className="fc-a">
        <Pill type={pill.type}>{pill.text}</Pill>
        <div className="why">{why}</div>
      </div>
    </button>
  )
}

// 滑块行
export function SliderRow({ label, min, max, step, value, onChange, format = (v) => v }) {
  return (
    <div className="slider-row">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="val">{format(value)}</span>
    </div>
  )
}

// 再挖一铲：机制条目下的进阶折叠段（默认收起，不打断主线阅读）
export function DeepDive({ title, children }) {
  return (
    <details className="dig">
      <summary>{title}</summary>
      <div className="dig-body">{children}</div>
    </details>
  )
}

// 练习项（可展开答案）
export function QuizItem({ q, children }) {
  const t = useUI()
  return (
    <div className="quiz-item">
      <div className="q">{q}</div>
      <details>
        <summary>{t.ui.viewAnswer}</summary>
        <div className="ans">{children}</div>
      </details>
    </div>
  )
}
