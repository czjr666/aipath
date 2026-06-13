import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../i18n/LangContext.jsx'

// 首页 hero：一个“正在思考的 LLM”
// 逐字打字机生成课程相关的句子，同时展示它脑中的活动：
//  - 右侧：下一个字的 top-5 候选概率条，随 temperature 实时重塑
//  - 文字上方：注意力高亮 —— 思考时前文相关的字会亮起，并有细线连向光标
//  - temperature 滑杆可拧：低温永远选最高概率（严谨复读机），
//    高温会采样到低概率候选甚至“放飞”字（琥珀 = 非最优，红 = 放飞）
// 纯 DOM + SVG 实现，颜色全部来自设计系统 CSS 变量
//
// 双语：结构 / 逻辑 / 动画时序 / 概率与坐标全部不变，仅可见文本按语言取用。
// 中文逐字生成（text 为字符串，按字符索引）；英文逐词生成（text 为等长的词数组，
// 按词索引，indexing/.length 与字符串一致），每词含尾随空格用于自然分隔。

const C = {
  zh: {
    sentences: [
      {
        text: '大模型每次只猜下一个字',
        alts: [
          ['小', '语', '神'],
          ['脑', '师', '块'],
          ['样', '块', '特'],
          ['其', '一', '总'],
          ['天', '回', '步'],
          ['都', '就', '能'],
          ['想', '看', '算'],
          ['这', '那', '后'],
          ['一', '两', '几'],
          ['个', '串', '句'],
          ['词', '步', '题'],
        ],
      },
      {
        text: '注意力就是给重点加权',
        alts: [
          ['专', '用', '集'],
          ['射', '入', '视'],
          ['点', '区', '机'],
          ['其', '不', '也'],
          ['像', '在', '会'],
          ['把', '为', '让'],
          ['关', '焦', '难'],
          ['要', '心', '词'],
          ['打', '赋', '升'],
          ['分', '星', '码'],
        ],
      },
      {
        text: '学习就是不断调整权重',
        alts: [
          ['训', '记', '复'],
          ['练', '会', '题'],
          ['也', '不', '其'],
          ['像', '要', '得'],
          ['反', '持', '慢'],
          ['停', '住', '等'],
          ['更', '修', '训'],
          ['节', '试', '优'],
          ['参', '方', '模'],
          ['数', '值', '量'],
        ],
      },
      {
        text: '向量是机器理解词的方式',
        alts: [
          ['词', '张', '矢'],
          ['日', '来', '导'],
          ['给', '在', '让'],
          ['电', '让', '计'],
          ['械', '灵', '长'],
          ['认', '读', '学'],
          ['会', '析', '顺'],
          ['字', '话', '句'],
          ['和', '与', '之'],
          ['模', '形', '招'],
          ['法', '向', '案'],
        ],
      },
    ],
    silly: ['香', '蕉', '喵', '咕', '梦', '锅'],
    zones: { strict: '严谨', balanced: '平衡', wild: '放飞' },
    done: '生成完毕，换一句…',
    guessing: (pos, total) => `正在猜第 ${pos + 1} / ${total} 个字`,
    statusR: '第 15 课 · 下一个字的游戏',
    sideLabel: '它脑中的候选 · 下一个字',
    tempHint: '往右拧，看它开始胡说八道 →',
  },
  en: {
    sentences: [
      {
        text: ['an ', 'LLM ', 'only ', 'guesses ', 'one ', 'word ', 'at ', 'a ', 'time '],
        alts: [
          ['the ', 'one ', 'this '],
          ['model ', 'agent ', 'brain '],
          ['just ', 'still ', 'ever '],
          ['picks ', 'sees ', 'plans '],
          ['its ', 'the ', 'next '],
          ['token ', 'step ', 'guess '],
          ['per ', 'each ', 'in '],
          ['one ', 'the ', 'each '],
          ['turn ', 'step ', 'loop '],
        ],
      },
      {
        text: ['attention ', 'simply ', 'weighs ', 'what ', 'matters ', 'most '],
        alts: [
          ['focus ', 'context ', 'memory '],
          ['just ', 'merely ', 'always '],
          ['scores ', 'ranks ', 'picks '],
          ['which ', 'where ', 'that '],
          ['counts ', 'helps ', 'fits '],
          ['here ', 'now ', 'first '],
        ],
      },
      {
        text: ['learning ', 'is ', 'just ', 'tuning ', 'the ', 'weights ', 'again '],
        alts: [
          ['training ', 'practice ', 'study '],
          ['means ', 'stays ', 'feels '],
          ['simply ', 'slowly ', 'really '],
          ['nudging ', 'fixing ', 'shaping '],
          ['its ', 'each ', 'all '],
          ['params ', 'values ', 'biases '],
          ['often ', 'slowly ', 'daily '],
        ],
      },
      {
        text: ['vectors ', 'are ', 'how ', 'machines ', 'grasp ', 'word ', 'meaning '],
        alts: [
          ['numbers ', 'arrays ', 'tensors '],
          ['stay ', 'become ', 'mean '],
          ['where ', 'why ', 'what '],
          ['models ', 'agents ', 'computers '],
          ['read ', 'learn ', 'sense '],
          ['token ', 'text ', 'symbol '],
          ['sense ', 'value ', 'space '],
        ],
      },
    ],
    silly: ['banana ', 'meow ', 'zap ', 'oops ', 'dream ', 'wow '],
    zones: { strict: 'strict', balanced: 'balanced', wild: 'wild' },
    done: 'Done — on to the next…',
    guessing: (pos, total) => `Guessing token ${pos + 1} / ${total}`,
    statusR: 'Lesson 15 · The next-token game',
    sideLabel: 'Candidates in its mind · next token',
    tempHint: 'Crank it up and watch it ramble →',
  },
}

const THINK_MS = 1050
const SAMPLE_MS = 420
const DONE_MS = 2400

// 该步的候选表：真实下一个字 + 3 个似是而非的 + 1 个放飞的
function buildCands(sentences, silly, si, pos) {
  const s = sentences[si]
  const p0 = 0.5 + 0.22 * Math.abs(Math.sin(si * 5 + pos * 1.7))
  const rest = 1 - p0 - 0.02
  const split = [0.55, 0.3, 0.15]
  const cands = [{ ch: s.text[pos], p: p0, kind: 'top' }]
  ;(s.alts[pos] || []).forEach((ch, i) => cands.push({ ch, p: rest * split[i], kind: 'alt' }))
  cands.push({ ch: silly[(si + pos) % silly.length], p: 0.02, kind: 'wild' })
  return cands
}

// temperature 重塑分布：q_i ∝ p_i^(1/T)
function adjust(cands, temp) {
  const ws = cands.map((c) => Math.pow(c.p, 1 / temp))
  const sum = ws.reduce((a, b) => a + b, 0)
  return ws.map((w) => w / sum)
}

// 注意力权重（演示用）：近邻强衰减 + 一个较早位置的“相关字”尖峰
function attnWeights(si, pos) {
  const w = []
  for (let j = 0; j < pos; j++) {
    let v = Math.exp(-(pos - 1 - j) * 0.55)
    if (pos >= 4 && j === (si * 3 + pos * 2) % (pos - 2)) v = Math.max(v, 0.9)
    w.push(v)
  }
  const m = Math.max(...w, 1e-6)
  return w.map((v) => v / m)
}

function tempZone(t, zones) {
  if (t < 0.5) return { label: zones.strict, cls: '' }
  if (t <= 1.1) return { label: zones.balanced, cls: '' }
  return { label: zones.wild, cls: 'hot' }
}

export default function LLMHero() {
  const { lang } = useLang()
  const L = C[lang] || C.zh
  const SENTENCES = L.sentences
  const SILLY = L.silly

  const [si, setSi] = useState(0)
  const [pos, setPos] = useState(0)
  const [phase, setPhase] = useState('think') // think | sample | done
  const [out, setOut] = useState([]) // [{ ch, kind }]
  const [winner, setWinner] = useState(null)
  const [temp, setTemp] = useState(0.7)
  const [jit, setJit] = useState(0)
  const [visible, setVisible] = useState(true)
  const [arcs, setArcs] = useState([])

  const tempRef = useRef(temp)
  tempRef.current = temp
  const rootRef = useRef(null)
  const charRefs = useRef([])
  const cursorRef = useRef(null)

  const cands = useMemo(() => buildCands(SENTENCES, SILLY, si, pos), [SENTENCES, SILLY, si, pos])
  const probs = useMemo(() => adjust(cands, temp), [cands, temp])
  const attn = useMemo(() => attnWeights(si, pos), [si, pos])

  // 切换语言时两套示例数据长度不同，重置状态机回到起点（hero 重新生成可接受）
  useEffect(() => {
    setSi(0)
    setPos(0)
    setPhase('think')
    setOut([])
    setWinner(null)
    setArcs([])
  }, [lang])

  // 状态机：think → sample →（下一字 think | done）→ 换一句
  useEffect(() => {
    if (!visible) return
    let tm
    if (phase === 'think') {
      const jt = setInterval(() => setJit((j) => j + 1), 300)
      tm = setTimeout(() => {
        clearInterval(jt)
        const q = adjust(buildCands(SENTENCES, SILLY, si, pos), tempRef.current)
        let r = Math.random()
        let idx = 0
        for (let i = 0; i < q.length; i++) {
          r -= q[i]
          if (r <= 0) {
            idx = i
            break
          }
        }
        setWinner(idx)
        setPhase('sample')
      }, THINK_MS)
      return () => {
        clearTimeout(tm)
        clearInterval(jt)
      }
    }
    if (phase === 'sample') {
      tm = setTimeout(() => {
        const c = cands[winner] || cands[0]
        setOut((o) => [...o, { ch: c.ch, kind: c.kind }])
        setWinner(null)
        if (pos + 1 >= SENTENCES[si].text.length) {
          setPhase('done')
        } else {
          setPos(pos + 1)
          setPhase('think')
        }
      }, SAMPLE_MS)
      return () => clearTimeout(tm)
    }
    if (phase === 'done') {
      tm = setTimeout(() => {
        setOut([])
        setPos(0)
        setSi((s) => (s + 1) % SENTENCES.length)
        setPhase('think')
      }, DONE_MS)
      return () => clearTimeout(tm)
    }
  }, [phase, pos, si, winner, visible, cands])

  // 滚出视口暂停（定时器不再续期）
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    if (rootRef.current) io.observe(rootRef.current)
    return () => io.disconnect()
  }, [])

  // 注意力连线：从权重最高的前文字连到光标
  useLayoutEffect(() => {
    if (phase !== 'think' || pos < 2 || !rootRef.current || !cursorRef.current) {
      setArcs([])
      return
    }
    const box = rootRef.current.getBoundingClientRect()
    const cur = cursorRef.current.getBoundingClientRect()
    const cx = cur.left - box.left + cur.width / 2
    const cy = cur.top - box.top
    const top = attn
      .map((w, j) => ({ w, j }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 3)
      .filter((a) => a.w > 0.25)
    setArcs(
      top
        .map(({ w, j }) => {
          const el = charRefs.current[j]
          if (!el) return null
          const r = el.getBoundingClientRect()
          const x = r.left - box.left + r.width / 2
          const y = r.top - box.top
          const lift = 26 + Math.abs(cx - x) * 0.18
          return { d: `M ${x} ${y} Q ${(x + cx) / 2} ${y - lift} ${cx} ${cy}`, w }
        })
        .filter(Boolean),
    )
  }, [phase, pos, out, attn])

  const zone = tempZone(temp, L.zones)
  const done = phase === 'done'
  const total = SENTENCES[si].text.length

  return (
    <div className="llm-hero" ref={rootRef}>
      <svg className="lh-arcs" aria-hidden="true">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} style={{ opacity: 0.25 + a.w * 0.6 }} />
        ))}
      </svg>

      <div className="lh-status">
        <span className={'lh-dot' + (done ? ' ok' : '')} />
        {done ? L.done : L.guessing(pos, total)}
        <span className="lh-status-r">{L.statusR}</span>
      </div>

      <div className="lh-main">
        <div className="lh-text" aria-live="polite">
          {out.map((c, j) => (
            <span
              key={j}
              ref={(el) => (charRefs.current[j] = el)}
              className={'lh-ch ' + c.kind}
              style={
                phase === 'think' && attn[j] > 0.04
                  ? { backgroundColor: `color-mix(in srgb, var(--amber) ${Math.round(attn[j] * 36)}%, transparent)` }
                  : undefined
              }
            >
              {c.ch}
            </span>
          ))}
          {!done && <span className="lh-cursor" ref={cursorRef} />}
          {done && <span className="lh-end">✓</span>}
        </div>

        <div className="lh-side">
          <div className="lh-side-label">{L.sideLabel}</div>
          {cands.map((c, i) => {
            const q = probs[i]
            const jw = phase === 'think' ? 1 + 0.05 * Math.sin(jit * 2.1 + i * 2.6) : 1
            const w = Math.min(1, q * jw)
            const isWin = phase === 'sample' && winner === i
            const isLose = phase === 'sample' && winner !== i
            return (
              <div key={i} className={'lh-cand' + (isWin ? ' win' : '') + (isLose ? ' lose' : '')}>
                <span className={'lh-cand-ch ' + c.kind}>{c.ch}</span>
                <span className="lh-bar">
                  <span className={'lh-bar-fill ' + c.kind} style={{ width: `${Math.max(1.5, w * 100)}%` }} />
                </span>
                <span className="lh-pct">{Math.round(q * 100)}%</span>
              </div>
            )
          })}

          <div className="lh-temp">
            <label htmlFor="lh-temp-input">
              temperature <b>{temp.toFixed(2)}</b>
              <span className={'lh-zone ' + zone.cls}>{zone.label}</span>
            </label>
            <input
              id="lh-temp-input"
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
            />
            <div className="lh-temp-hint">{L.tempHint}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
