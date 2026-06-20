import { useState } from 'react'
import { Lsec, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① BPE 焊接步进器
// 注意：CHARS 是「中文示例句被切成 token」的演示数据，与计费/数量演示对齐；
// 翻译会破坏切分演示，故全程保留原中文，只翻译讲解性文本（note / START_NOTE）。
// MERGES 的 a/b 是演示 token，同样保留原中文。
// ============================================================
const CHARS = ['今', '天', '天', '气', '真', '好', '，', '我', '们', '一', '起', '学', '习', '人', '工', '智', '能']
const MERGES_NOTES = {
  zh: [
    '扫遍语料：「今」和「天」相邻出现的次数名列前茅（几十亿次的量级），第一批被焊成整块。注意第二个「天」没被动到 —— 它后面跟的是「气」，不是这对组合。',
    '「天」「气」也是黄金搭档（天气、天气预报、坏天气……），焊！从此「天气」整块出场，不再拆开。',
    '「们」几乎只出现在「我 / 你 / 他」这类字后面，这种强绑定组合最容易被焊死。',
    '「一起」在日常语料里高频出现，顺利入表。注意逗号「，」一直独立成块 —— 标点也是 token。',
    '「学习」同理 —— 高频双字词一个接一个被焊成整块，句子越来越短。',
    '「人工」先入表。此刻「智」「能」还是两个散块，别急。',
    '「智能」也入表。关键的事情发生了：现在「人工」和「智能」变成了一对高频相邻的“块”。',
    '焊接的原料不一定是单字 —— 已焊成的块还能再焊！「人工」+「智能」相邻频率够高，于是四个字的「人工智能」整块入表。17 块就这样缩成了 9 块；真实训练会重复几万轮，直到词表达到预定大小。',
  ],
  en: [
    'Sweep the corpus: "今" and "天" rank among the most frequent adjacent pairs (on the order of billions of occurrences), so they are welded into a single block first. Notice the second "天" is untouched — what follows it is "气", not this pair.',
    '"天" and "气" are another golden pair (天气, 天气预报, 坏天气…) — weld! From now on "天气" always appears as one block and is never split again.',
    '"们" appears almost only after characters like "我 / 你 / 他", and such tightly bound combinations are the easiest to weld shut.',
    '"一起" shows up frequently in everyday corpora and enters the vocabulary smoothly. Notice the comma "，" has stayed its own block all along — punctuation is a token too.',
    'Same story for "学习" — high-frequency two-character words get welded into single blocks one after another, and the sentence keeps getting shorter.',
    '"人工" enters first. For now "智" and "能" are still two loose blocks — be patient.',
    '"智能" enters too. Now the key thing happens: "人工" and "智能" have become a frequently adjacent pair of "blocks".',
    'The raw material for welding need not be single characters — already-welded blocks can be welded again! "人工" + "智能" are adjacent often enough, so the four-character "人工智能" enters as one whole block. That is how 17 blocks shrink to 9; real training repeats this for tens of thousands of rounds, until the vocabulary reaches its target size.',
  ],
}
const MERGES = [
  { a: '今', b: '天' },
  { a: '天', b: '气' },
  { a: '我', b: '们' },
  { a: '一', b: '起' },
  { a: '学', b: '习' },
  { a: '人', b: '工' },
  { a: '智', b: '能' },
  { a: '人工', b: '智能' },
]
const START_NOTE = {
  zh: '起点：词表里只有最小单元 —— 单个字（和字节）。任何句子都拼得出来，但切得最碎：这句话要 17 块，连逗号也算一块。点「下一步」开始焊接。',
  en: 'Starting point: the vocabulary holds only the smallest units — single characters (and bytes). Any sentence can be assembled, but it is split as finely as possible: this sentence takes 17 blocks, with the comma counting as one. Click "Next" to start welding.',
}

function tokensAt(n) {
  let arr = CHARS.slice()
  let fresh = []
  for (let m = 0; m < n; m++) {
    const mg = MERGES[m]
    const res = []
    fresh = []
    for (let i = 0; i < arr.length; i++) {
      if (i < arr.length - 1 && arr[i] === mg.a && arr[i + 1] === mg.b) {
        res.push(mg.a + mg.b)
        if (m === n - 1) fresh.push(res.length - 1)
        i++
      } else {
        res.push(arr[i])
      }
    }
    arr = res
  }
  return { arr, fresh }
}

function BpeDemo({ c }) {
  const [step, setStep] = useState(() => (reduceMotion() ? MERGES.length : 0))
  const state = tokensAt(step)
  const count = state.arr.length
  const mg = step > 0 ? MERGES[step - 1] : null
  const note = step > 0 ? c.mergeNotes[step - 1] : null

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="bpe-stage-inner">
            <div className="bpe-blocks" aria-label={c.blocksAria}>
              {state.arr.map((t, i) => (
                <span key={i} className={`mini-tok tkc${i % 4}${state.fresh.includes(i) ? ' bpe-new' : ''}`}>{t}</span>
              ))}
            </div>
            <div className="bpe-meter">
              <div className="bm-label"><span>{c.meterLabel}</span><span>{c.meterCount(count)}</span></div>
              <div className="bm-track"><div className="bm-fill" style={{ width: (count / CHARS.length) * 100 + '%' }} /></div>
            </div>
          </div>
        </div>
        <div className="demo-side">
          {step === 0 ? (
            <>
              <h4>{c.round0Title}</h4>
              <div className="period">{c.round0Period}</div>
              <div className="bpe-formula"><span className="footnote">{c.round0Formula}</span></div>
              <p aria-live="polite">{c.startNote}</p>
            </>
          ) : (
            <>
              <h4>{c.roundTitle(step, MERGES.length)}</h4>
              <div className="period">{c.roundPeriod}</div>
              <div className="bpe-formula">
                <span className="mini-tok tkc0">{mg.a}</span> + <span className="mini-tok tkc1">{mg.b}</span> → <span className="mini-tok tkc3">{mg.a + mg.b}</span>
              </div>
              <p aria-live="polite">{note}</p>
            </>
          )}
          <div className="bpe-ctrl">
            <button className="chip" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>{c.btnPrev}</button>
            <button className="chip" disabled={step === MERGES.length} onClick={() => setStep((s) => Math.min(MERGES.length, s + 1))}>{c.btnNext}</button>
            <button className="chip" disabled={step === MERGES.length} onClick={() => setStep(MERGES.length)}>{c.btnFinish}</button>
            <button className="chip" disabled={step === 0} onClick={() => setStep(0)}>{c.btnReset}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 示意版分词器
// 注意：CN_WORDS / EN_VOCAB / PRESETS 是分词演示数据，翻译会破坏切分演示，
// 全程保留不动；只翻译 PRESET_LABELS 的可见标签与讲解性文本。
// ============================================================
const CN_WORDS = new Set(['今天', '明天', '今晚', '天气', '我们', '你们', '他们', '大家', '学习', '人工', '智能', '模型', '语言', '数据', '训练', '机器', '计算', '时间', '工作', '喜欢', '什么', '怎么', '哪个', '可以', '不是', '没有', '知道', '现在', '已经', '因为', '所以', '但是', '如果', '一起', '老师', '学生', '朋友', '世界', '问题', '开心', '火锅', '中文', '英文', '汉字'])
const EN_VOCAB = ['ligence', 'ization', 'ificial', 'intel', 'token', 'break', 'berry', 'trans', 'model', 'learn', 'izer', 'able', 'tion', 'love', 'chat', 'form', 'good', 'the', 'and', 'art', 'gpt', 'str', 'ing', 'day', 'you', 'aw', 'un', 'er', 'ed', 'ly', 're', 'in', 'is', 'it', 'an', 'on', 'at', 'or', 'to', 'of'].sort((a, b) => b.length - a.length)
const PRESETS = ['今天天气真好，我们一起学习人工智能。', 'The unbreakable tokenizer loves strawberry!', '我们用 ChatGPT 学习 token 化。', '9.11 和 9.9 哪个大？3.14159 呢？', '今晚吃火锅🍲，开心😄🎉']
const PRESET_LABELS = {
  zh: [['0', '中文句'], ['1', '英文句'], ['2', '中英混合'], ['3', '一串数字'], ['4', 'emoji']],
  en: [['0', 'Chinese'], ['1', 'English'], ['2', 'Mixed'], ['3', 'Numbers'], ['4', 'emoji']],
}

const isCJK = (ch) => /[一-鿿]/.test(ch)
const isLatin = (ch) => /[A-Za-z]/.test(ch)
const isDigit = (ch) => /[0-9]/.test(ch)
function fakeId(s) {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991
  return 100 + (h % 89000)
}
function segmentEnglish(word) {
  const toks = []
  const lower = word.toLowerCase()
  let i = 0
  while (i < lower.length) {
    let matched = null
    for (let k = 0; k < EN_VOCAB.length; k++) {
      if (lower.startsWith(EN_VOCAB[k], i)) { matched = EN_VOCAB[k]; break }
    }
    const len = matched ? matched.length : 1
    toks.push({ t: word.slice(i, i + len), n: 1 })
    i += len
  }
  return toks
}
function tokenize(text) {
  const chars = Array.from(text)
  let toks = []
  let i = 0
  while (i < chars.length) {
    const ch = chars[i]
    const cp = ch.codePointAt(0)
    if (/\s/.test(ch) || cp === 0xfe0f || cp === 0x200d) { i++; continue }
    if (isCJK(ch)) {
      const two = ch + (chars[i + 1] || '')
      if (CN_WORDS.has(two)) { toks.push({ t: two, n: 1 }); i += 2 } else { toks.push({ t: ch, n: 1 }); i += 1 }
      continue
    }
    if (isLatin(ch)) {
      let j = i
      while (j < chars.length && isLatin(chars[j])) j++
      toks = toks.concat(segmentEnglish(chars.slice(i, j).join('')))
      i = j; continue
    }
    if (isDigit(ch)) {
      let dd = i
      while (dd < chars.length && isDigit(chars[dd])) dd++
      const run = chars.slice(i, dd).join('')
      for (let p = 0; p < run.length; p += 2) toks.push({ t: run.slice(p, p + 2), n: 1 })
      i = dd; continue
    }
    if (cp > 0xffff || (cp >= 0x2600 && cp <= 0x27bf)) { toks.push({ t: ch, n: 2, byte: true }); i++; continue }
    toks.push({ t: ch, n: 1 }); i++
  }
  return toks
}

function TokenizerDemo({ c }) {
  const [text, setText] = useState(PRESETS[0])
  const [active, setActive] = useState('0')
  const toks = tokenize(text)
  const total = toks.reduce((s, t) => s + t.n, 0)
  const charCount = Array.from(text.replace(/\s/g, '')).length
  const ratio = charCount ? c.ratio((total / charCount).toFixed(1)) : ''

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="tok-body">
        <div className="chips">
          {c.presetLabels.map(([i, label]) => (
            <button key={i} className={`chip${active === i ? ' active' : ''}`} onClick={() => { setActive(i); setText(PRESETS[+i]) }}>{label}</button>
          ))}
        </div>
        <textarea className="tok-input" rows="3" aria-label={c.inputAria} placeholder={c.placeholder}
          value={text} onChange={(e) => { setActive(null); setText(e.target.value) }} />
        <div className="tok-out" aria-live="polite">
          {toks.length === 0 ? (
            <span className="tok-empty">{c.empty}</span>
          ) : (
            toks.map((tk, i) => (
              <span key={i} className={`tok tkc${i % 4}`}>
                <span className="tt">{tk.t}</span>
                <span className="tid">{tk.byte ? c.byteLabel(tk.n) : `#${fakeId(tk.t)}`}</span>
              </span>
            ))
          )}
        </div>
        <div className="tok-stats">{toks.length > 0 && c.stats(total, charCount, ratio)}</div>
        <p className="footnote">{c.tokFootnote}</p>
      </div>
    </div>
  )
}

const Mini = ({ c, children }) => <span className={`mini-tok tkc${c}`}>{children}</span>

const C = {
  zh: {
    bpe: {
      demoTitle: '🎛️ 交互演示 · BPE 焊接步进器',
      demoHint: '点「下一步」逐轮焊接，红圈是本轮新块',
      blocksAria: '当前句子的 token 切分状态',
      meterLabel: '这句话的 token 数',
      meterCount: (n) => `${n} 块（起点 17）`,
      round0Title: '第 0 轮 · 起点',
      round0Period: '词表 = 单字与字节',
      round0Formula: '尚未焊接 —— 一切还是单字。',
      startNote: START_NOTE.zh,
      roundTitle: (step, total) => `第 ${step} 轮 · 共 ${total} 轮`,
      roundPeriod: '本轮新块入表，获得一个新编号',
      mergeNotes: MERGES_NOTES.zh,
      btnPrev: '◀ 上一步',
      btnNext: '下一步 ▶',
      btnFinish: '⏭ 一键焊完',
      btnReset: '↺ 重置',
    },
    tok: {
      demoTitle: '🎛️ 交互演示 · 示意版分词器',
      demoHint: '输入或点击例句，实时查看切分结果',
      presetLabels: PRESET_LABELS.zh,
      inputAria: '输入要切分的文字',
      placeholder: '在这里输入任何文字…',
      empty: '输入点什么，这里会实时显示切分结果…',
      byteLabel: (n) => `字节 ×${n}`,
      ratio: (r) => `，平均每个字符约 ${r} 个 token`,
      stats: (total, charCount, ratio) => <>共 <b>{total}</b> 个 token（{charCount} 个字符，不含空格{ratio}）</>,
      tokFootnote: '块下方的编号是示意值，不对应任何真实模型。空格在真实分词器中通常并入后面的词块，这里为直观起见直接省略；标着 ×2 的 emoji 表示它按字节拆成约 2 块。试着对比“中文句”和“英文句”的 token 数，亲眼看看密度差异。',
    },
    guess: [
      { q: '「今天」会切成几块？', pill: { type: 'sage', text: '1 块 · 整词' }, why: '高频双字词，BPE 早早把它焊成一整块 —— 常见词的待遇。' },
      { q: '「unbreakable」会切成几块？', pill: { type: 'amber', text: '约 3 块 · 子词' }, why: '长词按常见子词拆开：un·break·able —— 前缀、词根、后缀正好都是高频组合。' },
      { q: '「ChatGPT」会切成几块？', pill: { type: 'sage', text: '1 到 2 块' }, why: '出镜率太高，“Chat”和“GPT”早已整块入表；更新的词表甚至把整个词收成一块。' },
      { q: '「饕餮」会切成几块？', pill: { type: 'terracotta', text: '约 4 到 6 块 · 字节碎块' }, why: '词表里没有整块，退回字节层 —— 一个冷僻汉字常被切成两三个字节块，两个字加起来约半打。' },
      { q: '「🍲」会切成几块？', pill: { type: 'terracotta', text: '2 到 3 块 · 字节碎块' }, why: '这个 emoji 本身占 4 个字节，词表多半没收录整块，只能按字节拼凑。' },
      { q: '「9.11」会切成几块？', pill: { type: 'sky', text: '3 块 · 数字分家' }, why: '数字和小数点各自成块 —— 这正是“9.11 比 9.9 大”翻车事故的第一现场。' },
    ],
    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话说清 token 是什么：文本的“乐高积木块”，每块对应一个编号</>,
      <>明白为什么必须切块：逐字看太碎、整词看会爆炸 —— token 是被两头逼出来的折中</>,
      <>亲眼看 BPE 怎么把高频组合一轮轮“焊”成新块：常见词整块、生僻词拆碎</>,
      <>用 token 视角解释一串怪现象：数不清字母、9.11 比 9.9 “大”、半个词往外蹦、按 token 计费</>,
      <>亲手玩一个示意版分词器，再猜猜各种词会被切成几块</>,
    ],
    conceptTitle: '💡 核心概念：先切块，再编号',
    conceptLead: '大模型从不“看字”。你打的每句话，在进入模型前都会被切成一块块文本积木 —— token，每块对应词表里的一个编号。模型吃进去的是编号序列，吐出来的也是编号序列，最后一步才被还原成文字。',
    youThinkTag: '你以为',
    youThinkBig: <>模型在逐字阅读<span className="gap">「今天天气真好」</span></>,
    youThinkNote: '仿佛屏幕对面坐着一个识字的人，一笔一画都看在眼里。',
    actualTag: '实际上',
    actualBig: <>它收到的是 <span className="hl">[3742, 1102, 88, 451]</span></>,
    actualNote: '一串编号。哪个编号常和哪个编号搭配，它在训练中见得太多了；可“字长什么样”，它从未见过。',
    journeyTitle: '📖 一句话的旅程',
    journeyLead: '从你按下回车，到屏幕上出现回答，文字其实经历了一趟“编号往返”。',
    pipe: [
      { label: '① 你打的字', val: '今天天气真好' },
      { label: '② 切成 token 块', val: <><Mini c={0}>今天</Mini><Mini c={1}>天气</Mini><Mini c={2}>真</Mini><Mini c={3}>好</Mini></> },
      { label: '③ 变成编号', val: '[3742, 1102, 88, 451]' },
      { label: '④ 模型计算', val: '吐出新编号，再还原成文字给你看' },
    ],
    pipeNote: <>负责“文字 ↔ 编号”来回翻译的程序叫<b>分词器（tokenizer）</b>。它不是模型的一部分，而是站在模型门口的翻译官 —— 编号是示意值，每家模型的词表和编号都不同。第 8 课讲过的 Embedding，正是把这些编号变成向量的下一步。</>,
    journeyOutro: <>这趟旅程在“出口”那头同样成立：模型每算完<b>一个</b>新编号，系统就立刻把它翻译成文字发到你屏幕上 —— 这就是 ChatGPT、Claude 回答时字一小段一小段往外“蹦”的原因。蹦出来的最小单位是 token 块，不是字，所以偶尔会先蹦出半个词，下一拍才补全。</>,
    whyTitle: '📖 深入展开 · 为什么非“切块”不可',
    whyLead: '看上去“切块”像是多此一举 —— 直接逐字读、或者按词读，不行吗？还真不行。token 是被两条死路逼出来的活路。',
    whyCards: [
      { label: '死路 ① · 逐字看（字符级）', en: <>句子变成<b>超长队列</b></>, zh: <>每个字一块，一篇千字文就是上千步。而模型内部“每块都要和每块打招呼”（第 10 课的注意力），队列一长，算力开销和工作记忆都被迅速撑爆 —— 像用米粒砌墙：什么都能砌，就是太慢太贵。</> },
      { label: '死路 ② · 整词看（词级）', en: <>词表<b>收不完</b>，新词<b>不认识</b></>, zh: <>网络新梗、人名、错别字、代码变量名……词是造不完的。凡是词表外的词，只能统统标成“不认识”，整段信息当场丢失 —— 像只用预制房间盖楼：图纸上没有的户型就盖不了。</> },
      { label: '活路 · 高频整块、低频拆碎', en: <><b>BPE</b>：两头的好处都要</>, zh: <>常见词焊成整块（省步数），生僻词拆到字节（任何输入都拼得出来，永远不会“不认识”），词表大小还能精确控制。这正是下一节的主角。</> },
    ],
    whyOutro: <>所以“切块”不是设计者的洁癖，而是工程上的最优折中。理解了这一点，BPE 的每一步都顺理成章 —— 它要做的，无非是<b>自动找出“哪些组合值得焊成整块”</b>。</>,
    bpeTitle: '🧱 BPE：把高频组合“焊”成积木',
    bpeLead: '切块的方案不是人拍脑袋定的，而是从海量语料里统计出来的。主流做法叫 BPE（字节对编码），思想简单到一句话：谁总挨在一起，就把谁焊成一块。',
    bpeSteps: [
      { en: '第 0 步 · 全部拆碎', zh: <>词表里只有几百个最小单元（字符或字节）：<Mini c={0}>今</Mini><Mini c={1}>天</Mini><Mini c={2}>天</Mini><Mini c={3}>气</Mini><Mini c={0}>真</Mini><Mini c={1}>好</Mini> —— 任何文字都能拼出来，只是切得很碎。</> },
      { en: '第 1 步 · 数频率', zh: <>扫一遍语料：哪两块最常相邻？「今」+「天」可能出现了几十亿次，遥遥领先。</> },
      { en: '第 2 步 · 焊接成新块', zh: <>把<Mini c={0}>今天</Mini>注册成一个新块，发一个新编号。从此它整块出场，不再拆开。</> },
      { en: '第 3 步 · 重复几万次', zh: <>不断“数频率 → 焊接”，最终得到几万到二十几万块的词表（数量级，各家不同）。高频的词成了整块，低频的词只能用碎块拼。</> },
    ],
    bpeDemoIntro: <>光看文字不过瘾 —— 下面这个步进器，让你<b>一轮一轮亲眼看焊接发生</b>：同一句话从 17 块碎渣，怎么一步步缩成 9 块积木。</>,
    bpeDemoFootnote: '焊接顺序与频次为教学示意。真实 BPE 在字节层面操作、按全部语料统计频率，焊接会重复几万到几十万轮。',
    densityIntro: <>于是出现了一条铁律：<b>越常见，块越大；越生僻，越碎。</b>这直接决定了不同语言的“token 密度”——</>,
    densityCards: [
      { label: '英文 · 数量级', en: <>1 个 token 装下<b>约四分之三个词</b></>, zh: <>常见词整块（the、token），长词拆成子词（un·break·able）。1000 个 token 大约能装 750 个英文词。</> },
      { label: '中文 · 数量级', en: <>1 个字花 <b>1 到 2 个 token</b></>, zh: <>高频词可整词一块（“今天”），多数字单字一块，生僻字拆成字节碎块。不同分词器差异很大，记住数量级即可。</> },
      { label: '生僻字与 emoji', en: <>1 个字符花 <b>2 到 3 个 token</b></>, zh: <>词表里没有整块，就退回字节层拼凑 —— 一个 emoji 或冷僻汉字常要花两三块的“运费”。</> },
    ],
    tradeoffIntro: <>那为什么不把块焊得更大、词表做得更猛，让一句话只占两三块？因为<b>两头都有代价</b>，BPE 的甜点区是试出来的 ——</>,
    tradeoffCards: [
      { label: '块太大的代价', en: <>每块的“经验”变<b>薄</b></>, zh: <>块越长越专用，在语料里出现的次数就越少，模型攒不下足够的“语感”；而且几十万个块各自都要占一份参数，词表本身就会变得臃肿。</> },
      { label: '块太小的代价', en: <>每句话的队列变<b>长</b></>, zh: <>块太碎就退回死路①：序列变长、每一步都更贵、工作记忆吃紧。主流词表停在几万到二十几万块 —— 不是理论推出来的真理，而是工程上反复权衡的结果。</> },
    ],
    tryTitle: '🎛️ 亲手切一句试试',
    tryLead: '下面是一个示意版分词器：中文优先匹配约 40 个硬编码的常见双字词、否则逐字；英文按一张小小的子词表贪心切分；数字两位一切。这是教学简化版 —— 真实 BPE 的词表有几万到几十万块，切法也更细腻，但“切块 + 编号”的感觉是一样的。',
    weirdTitle: '🔍 三个怪现象，一个解释',
    weirdLead: '很多“大模型怎么连这都不会”的新闻，换上 token 眼镜一看，立刻不奇怪了。',
    weirdCards: [
      { label: '怪现象 ①', en: <>数不清 strawberry 里有几个 <b>r</b></>, zh: <>它看到的不是 10 个字母，而是 <Mini c={0}>str</Mini><Mini c={1}>aw</Mini><Mini c={2}>berry</Mini> 三个编号块。问它字母数，就像隔着电话问你“我刚才那句话一共多少笔画”。</> },
      { label: '怪现象 ②', en: <>认为 9.11 比 9.9 <b>大</b></>, zh: <>切块后是 <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={2}>11</Mini> 对 <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={3}>9</Mini>。逐块对照时「11」压过「9」—— 像版本号、像日期，就是不像小数。数字被切块后，比较并不天然按数值进行。</> },
      { label: '怪现象 ③', en: <>为什么按 <b>token</b> 计费</>, zh: <>token 是模型每一步计算的基本单位：吃进多少块、吐出多少块，算力就花多少。所以 API 按 token 收费，模型的“工作记忆”上限（上下文窗口，context window）也按 token 数 —— 第 17 课细讲。</> },
    ],
    forensicTitle: '📖 深入展开 · 现象反查：你在 ChatGPT / Claude 里见过的这些事',
    forensicLead: '学会了机制，就能反过来“破案”。下面每一条你大概率亲眼见过 —— 左边是现象，右边是 token 层面的真相。',
    forensicHead: ['你看到的现象', '背后的 token 机制'],
    forensicRows: [
      { ph: '回答一小段一小段地“蹦”，偶尔先蹦出半个词', ex: '模型一步只算出一个 token，系统算完立刻发给你（流式输出，streaming）。蹦出的最小单位是块不是字，半个词（一个子词块）先露面再正常不过。' },
      { ph: '同样的内容，中文对话比英文“烧”额度烧得快', ex: '中文 token 密度低：一个字常花 1 到 2 块，而英文一块能装大半个词。计费和上下文额度都按块数算，中文天然要交“语言税”。' },
      { ph: '让它倒着拼单词、数笔画、写藏头诗，常常翻车', ex: '字母和笔画在切块时就被“封进”块里了，模型看不见块的内部 —— 它靠训练时的统计印象在猜，不是在看。新一代模型常调用代码工具来绕过这个盲区。' },
      { ph: '聊得太长，它开始忘记你开头说过什么', ex: '模型的工作记忆（上下文窗口）按 token 数设上限，挤不下的部分会被截掉。也因此“长文档问答”贵且难 —— 第 17 课展开。' },
      { ph: '个别奇怪的字符串能让它当场胡言乱语', ex: '“故障 token”：编号在词表里、训练语料中却几乎没出现过，模型对这个编号毫无经验。早年著名的 SolidGoldMagikarp（一个论坛用户名）就是这样一块“幽灵积木”。' },
    ],
    forensicOutro: <>这套“现象 → token”的破案思路值得记住：以后再看到大模型犯莫名其妙的错，先问一句 ——<b>“它看到的块，和我看到的字，是一回事吗？”</b>多数谜团到这里就解开了。</>,
    forensicSourceNote: (
      <>
        “故障 token（glitch token）”里最著名的 SolidGoldMagikarp，由 Rumbelow 与 Watkins 2023 在{' '}
        <a href="https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation" target="_blank" rel="noreferrer">
          SolidGoldMagikarp (plus, prompt generation)
        </a>
        中记录。
      </>
    ),
    bpeSourceNote: (
      <>
        BPE 最早是 Gage 1994 提出的数据压缩算法；把它用于神经网络分词的是 Sennrich、Haddow、Birch 2016{' '}
        <a href="https://arxiv.org/abs/1508.07909" target="_blank" rel="noreferrer">
          Neural Machine Translation of Rare Words with Subword Units
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '这一课把你打的字拆成了一串 token 编号，模型门口的“翻译官”就位了。但模型本身现在还是一张白纸——它怎么从这些编号里学到知识？下一课进入预训练：把整个互联网切成 token，让模型反复玩“预测下一个 token”的文字接龙，玩上万亿次，九成的能力就是这么长出来的。',
    bridgeSteps: ['文字已切成 token', '把整个互联网都切成 token', '反复预测下一个 token', '下一课：预训练'],
    guessTitle: '🧩 猜猜切几块',
    guessLead: '检验一下手感：下面这些词在典型分词器里会被切成几块？先在心里报个数，再点卡片揭晓。块数因分词器而异，对上数量级就算赢。',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: '一个 token 就是一个单词 / 一个汉字', good: 'token 可能是半个词、一个词组、一个标点，甚至只是一个字节 —— 完全由语料里的出现频率决定', why: <><b>病因：</b>“词元”这个译名太像“词”了。其实 BPE 只认频率不认语法：“今天”够高频就是一整块，“饕餮”太冷门就被拆成字节碎渣 —— 块的边界和人类的“词”边界经常对不上。</> },
      { bad: '模型认识每一个汉字，理解它的字形和笔画', good: '模型只认识 token 编号 —— “字”这个概念对它根本不存在', why: <><b>病因：</b>拟人化想象。模型收到的永远是 [3742, 1102, …] 这样的编号序列，字长什么样、由几笔写成，它无从得知。它对“字”的一切感觉，都是从编号的搭配规律里间接学来的 —— 所以拆字、数笔画、玩字形谜语，恰恰是它的天然盲区。</> },
      { bad: '分词器是模型的一部分，会在使用中跟着变聪明', good: '分词器在模型训练开始前就定稿冻结了 —— 它只是一张查频率定下来的“切块对照表”', why: <><b>病因：</b>把“翻译官”当成了“大脑”。流程上是先用语料统计出词表、冻结分词器，然后整个训练和之后的所有对话都用这同一张表。所以一个新梗火起来之后，老模型依然按旧表把它切成碎块 —— 这也是模型带“年代感”的原因之一。</> },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 朋友吐槽：“连 strawberry 里有几个 r 都数不对，还叫人工智能？”请你用本课的知识替模型“喊冤”。', a: <>模型看到的不是字母，而是 <b>[str][aw][berry] 三个 token 编号</b>。字母层面的信息在切块时就被“封装”了，它只能靠训练中的统计印象猜 —— 这是分词机制的盲区，不是智力问题。（新一代模型常靠调用代码工具来绕过这个盲区。）</> },
      { q: '2. 同样意思的一段话，用中文写和用英文写，哪个通常消耗更多 token？这对 API 账单意味着什么？', a: <>通常<b>中文更多</b>：英文一个 token 平均装下大半个词，而中文一个字常要花 1 到 2 个 token，同义内容的中文 token 数往往更高。按 token 计费时，同样的话中文版常常更贵 —— 不过不同分词器对中文的优化差异很大，以实际切分为准。</> },
      { q: '3. 把 9.11 和 9.9 分别写成示意 token 序列，并解释模型为什么可能比错大小。', a: <>9.11 → <b>[9][.][11]</b>，9.9 → <b>[9][.][9]</b>。模型不是按数值比较，而是按块的统计规律“接龙”：「11」压过「9」这件事在版本号、日期、章节号里大量成立，于是它顺势答错。把问题改写成“按小数比较”或让它列竖式，正确率会明显上升。</> },
      { q: '4. ChatGPT 回答时，字是一小段一小段“蹦”出来的，偶尔还会先蹦出半个词。用本课的机制解释这个现象。', a: <>模型每一步只产出<b>一个 token 编号</b>，系统算完立刻把它还原成文字发给你 —— 这叫流式输出。蹦出来的最小单位是 token 块而不是字，所以半个词（一个子词块）先出现、下一拍再补全，完全符合机制。</> },
    ],
  },

  en: {
    bpe: {
      demoTitle: '🎛️ Interactive · BPE Welding Stepper',
      demoHint: 'Click "Next" to weld round by round; the red ring is this round\'s new block',
      blocksAria: 'Current token segmentation of the sentence',
      meterLabel: 'Tokens in this sentence',
      meterCount: (n) => `${n} blocks (started at 17)`,
      round0Title: 'Round 0 · Starting point',
      round0Period: 'Vocabulary = single characters and bytes',
      round0Formula: 'No welding yet — everything is still single characters.',
      startNote: START_NOTE.en,
      roundTitle: (step, total) => `Round ${step} · of ${total}`,
      roundPeriod: 'A new block enters the vocabulary this round and gets a new ID',
      mergeNotes: MERGES_NOTES.en,
      btnPrev: '◀ Previous',
      btnNext: 'Next ▶',
      btnFinish: '⏭ Weld all',
      btnReset: '↺ Reset',
    },
    tok: {
      demoTitle: '🎛️ Interactive · A Toy Tokenizer',
      demoHint: 'Type or click an example sentence to see the split in real time',
      presetLabels: PRESET_LABELS.en,
      inputAria: 'Enter the text to tokenize',
      placeholder: 'Type any text here…',
      empty: 'Type something and the split result will show up here in real time…',
      byteLabel: (n) => `bytes ×${n}`,
      ratio: (r) => `, about ${r} tokens per character on average`,
      stats: (total, charCount, ratio) => <><b>{total}</b> tokens in total ({charCount} characters, excluding spaces{ratio})</>,
      tokFootnote: 'The IDs under each block are illustrative and don\'t correspond to any real model. In real tokenizers a space is usually merged into the following block; here it is simply dropped for clarity. An emoji marked ×2 means it splits into about 2 byte-blocks. Try comparing the token counts of "Chinese" and "English" and see the density difference for yourself.',
    },
    guess: [
      { q: 'How many blocks does "今天" split into?', pill: { type: 'sage', text: '1 block · whole word' }, why: 'A high-frequency two-character word; BPE welded it into one whole block early on — the treatment common words get.' },
      { q: 'How many blocks does "unbreakable" split into?', pill: { type: 'amber', text: 'about 3 blocks · subwords' }, why: 'Long words split into common subwords: un·break·able — prefix, root, and suffix all happen to be high-frequency combinations.' },
      { q: 'How many blocks does "ChatGPT" split into?', pill: { type: 'sage', text: '1 to 2 blocks' }, why: 'It appears so often that "Chat" and "GPT" entered the vocabulary as whole blocks long ago; newer vocabularies even fold the whole word into one block.' },
      { q: 'How many blocks does "饕餮" split into?', pill: { type: 'terracotta', text: 'about 4 to 6 blocks · byte fragments' }, why: 'No whole block exists in the vocabulary, so it falls back to the byte level — one obscure Chinese character is often split into two or three byte blocks, so two of them add up to about half a dozen.' },
      { q: 'How many blocks does "🍲" split into?', pill: { type: 'terracotta', text: '2 to 3 blocks · byte fragments' }, why: 'This emoji itself takes 4 bytes; the vocabulary most likely has no whole block for it, so it can only be pieced together byte by byte.' },
      { q: 'How many blocks does "9.11" split into?', pill: { type: 'sky', text: '3 blocks · digits split apart' }, why: 'The digits and the decimal point each become their own block — exactly the scene of the "9.11 is bigger than 9.9" crash.' },
    ],
    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>Say in one sentence what a token is: text\'s "Lego brick", with each block mapped to an ID</>,
      <>Understand why splitting is a must: character by character is too fragmented, whole words explode — a token is a compromise forced from both ends</>,
      <>See for yourself how BPE "welds" high-frequency combinations into new blocks round by round: common words as whole blocks, rare ones split apart</>,
      <>Use the token lens to explain a string of oddities: can\'t count letters, 9.11 "bigger than" 9.9, half a word popping out, billing by token</>,
      <>Play with a toy tokenizer yourself, then guess how many blocks various words split into</>,
    ],
    conceptTitle: '💡 Core Idea: Split First, Then Number',
    conceptLead: 'A large model never "reads characters". Every sentence you type is, before entering the model, split into text bricks — tokens, each mapped to an ID in the vocabulary. What the model takes in is a sequence of IDs, what it spits out is also a sequence of IDs, and only the very last step turns them back into text.',
    youThinkTag: 'You think',
    youThinkBig: <>The model reads <span className="gap">"今天天气真好"</span> character by character</>,
    youThinkNote: 'As if a literate person were sitting across the screen, taking in every stroke.',
    actualTag: 'In reality',
    actualBig: <>What it receives is <span className="hl">[3742, 1102, 88, 451]</span></>,
    actualNote: 'A string of IDs. Which ID often goes with which, it has seen far too much of in training; but "what a character looks like", it has never seen.',
    journeyTitle: '📖 The Journey of a Sentence',
    journeyLead: 'From the moment you press Enter to the answer appearing on screen, the text actually makes an "ID round trip".',
    pipe: [
      { label: '① What you type', val: '今天天气真好' },
      { label: '② Split into token blocks', val: <><Mini c={0}>今天</Mini><Mini c={1}>天气</Mini><Mini c={2}>真</Mini><Mini c={3}>好</Mini></> },
      { label: '③ Turned into IDs', val: '[3742, 1102, 88, 451]' },
      { label: '④ Model computes', val: 'spits out new IDs, then turns them back into text for you' },
    ],
    pipeNote: <>The program that handles the back-and-forth "text ↔ ID" translation is called the <b>tokenizer</b>. It is not part of the model but an interpreter standing at the model\'s door — the IDs are illustrative, and every model has a different vocabulary and IDs. The Embedding from Lesson 8 is exactly the next step that turns these IDs into vectors.</>,
    journeyOutro: <>This journey holds at the "exit" end too: every time the model finishes computing <b>one</b> new ID, the system immediately translates it into text and sends it to your screen — this is why ChatGPT and Claude "pop" their answers out a little chunk at a time. The smallest unit popping out is a token block, not a character, so occasionally half a word appears first and is completed on the next beat.</>,
    whyTitle: '📖 Going Deeper · Why "Splitting" Is Unavoidable',
    whyLead: 'Splitting looks like overkill — can\'t we just read character by character, or word by word? Actually, no. The token is the way out forced by two dead ends.',
    whyCards: [
      { label: 'Dead end ① · char by char (character level)', en: <>The sentence becomes a <b>very long queue</b></>, zh: <>One block per character means a thousand-character essay is thousands of steps. And inside the model "every block must greet every other block" (the attention from Lesson 10); once the queue gets long, both compute cost and working memory blow up fast — like building a wall out of rice grains: you can build anything, it\'s just too slow and too expensive.</> },
      { label: 'Dead end ② · whole words (word level)', en: <>The vocabulary <b>can never finish</b>, new words are <b>unrecognized</b></>, zh: <>Internet memes, names, typos, code variable names… words are endless. Any word outside the vocabulary can only be marked "unknown", and a whole chunk of information is lost on the spot — like building only from prefab rooms: any layout not on the blueprint can\'t be built.</> },
      { label: 'The way out · whole blocks for frequent, fragments for rare', en: <><b>BPE</b>: get the best of both ends</>, zh: <>Common words are welded into whole blocks (saving steps), rare ones split down to bytes (any input can be assembled, never "unknown"), and the vocabulary size can be controlled precisely. This is exactly the star of the next section.</> },
    ],
    whyOutro: <>So "splitting" is not the designers\' fussiness but the engineering optimum. Once you grasp this, every step of BPE follows naturally — all it has to do is <b>automatically find out "which combinations are worth welding into whole blocks"</b>.</>,
    bpeTitle: '🧱 BPE: "Welding" High-Frequency Combinations into Bricks',
    bpeLead: 'The splitting scheme is not decided off the top of someone\'s head, but computed statistically from massive corpora. The mainstream method is BPE (byte pair encoding), and the idea is as simple as one sentence: whoever always sticks together, weld them into one block.',
    bpeSteps: [
      { en: 'Step 0 · split everything apart', zh: <>The vocabulary holds only a few hundred smallest units (characters or bytes): <Mini c={0}>今</Mini><Mini c={1}>天</Mini><Mini c={2}>天</Mini><Mini c={3}>气</Mini><Mini c={0}>真</Mini><Mini c={1}>好</Mini> — any text can be assembled, just split very finely.</> },
      { en: 'Step 1 · count frequencies', zh: <>Sweep the corpus once: which two blocks are most often adjacent? "今" + "天" may have appeared billions of times, far ahead of the rest.</> },
      { en: 'Step 2 · weld into a new block', zh: <>Register <Mini c={0}>今天</Mini> as a new block and issue a new ID. From now on it appears as one whole block and is never split.</> },
      { en: 'Step 3 · repeat tens of thousands of times', zh: <>Keep doing "count frequencies → weld", and you finally get a vocabulary of tens of thousands to a couple hundred thousand blocks (an order of magnitude, differing per provider). Frequent words become whole blocks; infrequent ones can only be pieced together from fragments.</> },
    ],
    bpeDemoIntro: <>Words alone aren\'t enough — the stepper below lets you <b>watch the welding happen round by round</b>: how the same sentence shrinks step by step from 17 fragments to 9 bricks.</>,
    bpeDemoFootnote: 'The welding order and frequencies are illustrative for teaching. Real BPE operates at the byte level, counts frequencies over the entire corpus, and the welding repeats for tens to hundreds of thousands of rounds.',
    densityIntro: <>So there emerges an iron rule: <b>the more common, the bigger the block; the rarer, the more fragmented.</b> This directly determines the "token density" of different languages —</>,
    densityCards: [
      { label: 'English · order of magnitude', en: <>1 token holds <b>about three-quarters of a word</b></>, zh: <>Common words are whole blocks (the, token), long words split into subwords (un·break·able). 1000 tokens hold roughly 750 English words.</> },
      { label: 'Chinese · order of magnitude', en: <>1 character costs <b>1 to 2 tokens</b></>, zh: <>High-frequency words can be one block as a whole word ("今天"), most characters are one block each, and rare characters split into byte fragments. Tokenizers vary a lot; just remember the order of magnitude.</> },
      { label: 'Rare characters and emoji', en: <>1 character costs <b>2 to 3 tokens</b></>, zh: <>With no whole block in the vocabulary, it falls back to piecing together bytes — an emoji or an obscure Chinese character often costs two or three blocks of "shipping fee".</> },
    ],
    tradeoffIntro: <>Then why not weld bigger blocks and make the vocabulary even bigger, so a sentence takes only two or three blocks? Because <b>both ends have a cost</b>, and BPE\'s sweet spot is found by trial —</>,
    tradeoffCards: [
      { label: 'The cost of blocks too big', en: <>Each block\'s "experience" gets <b>thin</b></>, zh: <>The longer a block, the more specialized it is, the fewer times it appears in the corpus, so the model can\'t accumulate enough "language sense"; and hundreds of thousands of blocks each take up a share of parameters, so the vocabulary itself becomes bloated.</> },
      { label: 'The cost of blocks too small', en: <>Each sentence\'s queue gets <b>long</b></>, zh: <>Blocks too fragmented fall back to dead end ①: longer sequences, every step more expensive, working memory strained. Mainstream vocabularies stop at tens of thousands to a couple hundred thousand blocks — not a truth derived from theory, but the result of repeated engineering trade-offs.</> },
    ],
    tryTitle: '🎛️ Try Splitting a Sentence Yourself',
    tryLead: 'Below is a toy tokenizer: for Chinese it first matches about 40 hard-coded common two-character words, otherwise character by character; for English it greedily splits using a tiny subword table; for numbers it cuts every two digits. This is a simplified teaching version — a real BPE vocabulary has tens to hundreds of thousands of blocks and splits more subtly, but the feel of "split + number" is the same.',
    weirdTitle: '🔍 Three Oddities, One Explanation',
    weirdLead: 'Many "how can a large model not even do this" headlines stop being strange the moment you put on token glasses.',
    weirdCards: [
      { label: 'Oddity ①', en: <>Can\'t count how many <b>r</b>\'s are in strawberry</>, zh: <>What it sees is not 10 letters but three ID blocks: <Mini c={0}>str</Mini><Mini c={1}>aw</Mini><Mini c={2}>berry</Mini>. Asking it for the letter count is like asking you over the phone "how many strokes were in the sentence I just said".</> },
      { label: 'Oddity ②', en: <>Thinks 9.11 is <b>bigger than</b> 9.9</>, zh: <>After splitting it\'s <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={2}>11</Mini> versus <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={3}>9</Mini>. Comparing block by block, "11" beats "9" — like a version number, like a date, just not like a decimal. Once numbers are split into blocks, comparison doesn\'t naturally go by numeric value.</> },
      { label: 'Oddity ③', en: <>Why billing is by <b>token</b></>, zh: <>The token is the basic unit of every computation step the model takes: how many blocks go in, how many come out, that\'s how much compute is spent. So APIs charge by token, and the model\'s "working memory" cap (the context window) is also measured in tokens — detailed in Lesson 17.</> },
    ],
    forensicTitle: '📖 Going Deeper · Reverse-Lookup: Things You\'ve Seen in ChatGPT / Claude',
    forensicLead: 'Once you understand the mechanism, you can "crack the case" in reverse. You\'ve very likely witnessed each line below — the phenomenon on the left, the token-level truth on the right.',
    forensicHead: ['What you see', 'The token mechanism behind it'],
    forensicRows: [
      { ph: 'The answer "pops" out a chunk at a time, occasionally with half a word first', ex: 'The model computes only one token per step, and the system sends it to you the moment it\'s done (streaming output). The smallest unit popping out is a block, not a character, so half a word (one subword block) showing up first is perfectly normal.' },
      { ph: 'For the same content, a Chinese conversation "burns" quota faster than English', ex: 'Chinese token density is low: one character often costs 1 to 2 blocks, while one English block holds most of a word. Both billing and context quota count by block, so Chinese inherently pays a "language tax".' },
      { ph: 'Asking it to spell words backwards, count strokes, or write acrostics often fails', ex: 'Letters and strokes get "sealed inside" the block at split time, and the model can\'t see inside a block — it guesses from statistical impressions in training, it isn\'t looking. Newer models often call code tools to get around this blind spot.' },
      { ph: 'Chat too long and it starts forgetting what you said at the beginning', ex: 'The model\'s working memory (context window) is capped in number of tokens, and whatever doesn\'t fit gets truncated. That\'s also why "long-document QA" is expensive and hard — expanded in Lesson 17.' },
      { ph: 'A few odd strings can make it spout gibberish on the spot', ex: '"Glitch tokens": the ID is in the vocabulary but barely appeared in the training corpus, so the model has no experience with it at all. The famously early SolidGoldMagikarp (a forum username) was exactly such a "ghost brick".' },
    ],
    forensicOutro: <>This "phenomenon → token" detective approach is worth remembering: next time you see a large model make an inexplicable mistake, first ask — <b>"Are the blocks it sees the same thing as the characters I see?"</b> Most mysteries are solved right there.</>,
    forensicSourceNote: (
      <>
        The most famous "glitch token", SolidGoldMagikarp, was documented by Rumbelow and Watkins, 2023, in{' '}
        <a href="https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation" target="_blank" rel="noreferrer">
          SolidGoldMagikarp (plus, prompt generation)
        </a>
        .
      </>
    ),
    bpeSourceNote: (
      <>
        BPE was originally a data-compression algorithm from Gage 1994; applying it to neural tokenization was Sennrich, Haddow & Birch 2016,{' '}
        <a href="https://arxiv.org/abs/1508.07909" target="_blank" rel="noreferrer">
          Neural Machine Translation of Rare Words with Subword Units
        </a>
        .
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 12',
    bridgeLead: 'This lesson split your text into a string of token IDs — the "interpreter" at the model\'s door is now in place. But the model itself is still a blank slate: how does it learn knowledge from these IDs? The next lesson enters pretraining: slice the entire internet into tokens and have the model play "predict the next token" over and over, trillions of times — and that is where ninety percent of its ability grows from.',
    bridgeSteps: ['Text split into tokens', 'Slice the whole internet into tokens', 'Predict the next token, repeatedly', 'Next: Pretraining'],
    guessTitle: '🧩 Guess the Block Count',
    guessLead: 'Test your instinct: how many blocks do the words below split into in a typical tokenizer? Call out a number in your head first, then tap the card to reveal. The count varies by tokenizer; getting the order of magnitude right counts as a win.',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: 'One token is one word / one Chinese character', good: 'A token might be half a word, a phrase, a punctuation mark, or even just one byte — entirely decided by how often it appears in the corpus', why: <><b>Cause:</b> the term "token" (词元 in Chinese) sounds too much like "word". In fact BPE only cares about frequency, not grammar: "今天" is frequent enough to be one whole block, "饕餮" is too obscure and gets split into byte fragments — block boundaries often don\'t line up with humans\' "word" boundaries.</> },
      { bad: 'The model recognizes every Chinese character and understands its shape and strokes', good: 'The model only recognizes token IDs — the concept of a "character" simply doesn\'t exist for it', why: <><b>Cause:</b> anthropomorphic imagination. What the model receives is always an ID sequence like [3742, 1102, …]; what a character looks like, how many strokes it takes, it has no way to know. Everything it senses about a "character" is learned indirectly from the co-occurrence patterns of IDs — which is exactly why splitting characters, counting strokes, and shape-based riddles are its natural blind spots.</> },
      { bad: 'The tokenizer is part of the model and gets smarter as it\'s used', good: 'The tokenizer is finalized and frozen before the model\'s training even begins — it\'s just a "split lookup table" set by counting frequencies', why: <><b>Cause:</b> mistaking the "interpreter" for the "brain". The procedure is: first compute the vocabulary from a corpus and freeze the tokenizer, then all of training and every later conversation use this same table. So after a new meme catches on, the old model still splits it into fragments by the old table — one of the reasons models carry a "sense of their era".</> },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. A friend complains: "It can\'t even count how many r\'s are in strawberry, and it calls itself AI?" Use what you learned in this lesson to "defend" the model.', a: <>The model doesn\'t see letters but <b>three token IDs: [str][aw][berry]</b>. Letter-level information is "encapsulated" at split time, so it can only guess from statistical impressions in training — this is a blind spot of the tokenization mechanism, not an intelligence problem. (Newer models often get around this blind spot by calling code tools.)</> },
      { q: '2. For a passage of the same meaning, written in Chinese versus in English, which usually consumes more tokens? What does this mean for the API bill?', a: <>Usually <b>Chinese costs more</b>: an English token holds most of a word on average, while a Chinese character often costs 1 to 2 tokens, so the token count for the same content is usually higher in Chinese. When billing by token, the Chinese version of the same text is often more expensive — though tokenizers differ a lot in how well they optimize for Chinese, so go by the actual split.</> },
      { q: '3. Write 9.11 and 9.9 as illustrative token sequences, and explain why the model might compare their sizes wrong.', a: <>9.11 → <b>[9][.][11]</b>, 9.9 → <b>[9][.][9]</b>. The model doesn\'t compare by numeric value but "continues the chain" by the statistical patterns of blocks: "11" beating "9" holds widely in version numbers, dates, and chapter numbers, so it follows along and answers wrong. Rewriting the question as "compare as decimals" or having it do long-form arithmetic noticeably raises accuracy.</> },
      { q: '4. When ChatGPT answers, the text "pops" out a chunk at a time, occasionally with half a word first. Explain this with the mechanism from this lesson.', a: <>The model produces only <b>one token ID</b> per step, and the system turns it back into text and sends it to you the moment it\'s done — this is called streaming output. The smallest unit popping out is a token block, not a character, so half a word (one subword block) appearing first and being completed on the next beat fits the mechanism perfectly.</> },
    ],
  },
}

export default function L11() {
  const { lang } = useLang()
  const c = C[lang] || C.zh

  return (
    <>
      <Lsec title={c.goalsTitle}>
        <div className="card goals">
          {c.goals.map((g, i) => (
            <div className="goal-item" key={i}><span className="tick">✓</span>{g}</div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.conceptTitle}
        lead={c.conceptLead}
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag">{c.youThinkTag}</div>
            <div className="big">{c.youThinkBig}</div>
            <div className="note">{c.youThinkNote}</div>
          </div>
          <div className="card contrast-card">
            <div className="tag">{c.actualTag}</div>
            <div className="big">{c.actualBig}</div>
            <div className="note">{c.actualNote}</div>
          </div>
        </div>
      </Lsec>

      <Lsec title={c.journeyTitle} lead={c.journeyLead}>
        <div className="card card-pad">
          <div className="pipe">
            <div className="pipe-step"><div className="ps-label">{c.pipe[0].label}</div><div className="ps-val">{c.pipe[0].val}</div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">{c.pipe[1].label}</div><div className="ps-val">{c.pipe[1].val}</div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">{c.pipe[2].label}</div><div className="ps-val">{c.pipe[2].val}</div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">{c.pipe[3].label}</div><div className="ps-val">{c.pipe[3].val}</div></div>
          </div>
          <p className="footnote pipe-note">{c.pipeNote}</p>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.journeyOutro}</p>
      </Lsec>

      <Lsec
        title={c.whyTitle}
        lead={c.whyLead}
      >
        <div className="use-grid">
          {c.whyCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.en}</div>
              <div className="zh">{u.zh}</div>
            </div>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.whyOutro}</p>
      </Lsec>

      <Lsec
        title={c.bpeTitle}
        lead={c.bpeLead}
      >
        <div className="card row-list">
          {c.bpeSteps.map((s, i) => (
            <div className="example" key={i}><div className="en">{s.en}</div><div className="zh">{s.zh}</div></div>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 22 }}>{c.bpeDemoIntro}</p>
        <BpeDemo c={c.bpe} />
        <p className="footnote" style={{ marginTop: 10 }}>{c.bpeDemoFootnote}</p>
        <p className="lead" style={{ marginTop: 22 }}>{c.densityIntro}</p>
        <div className="use-grid">
          {c.densityCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 22 }}>{c.tradeoffIntro}</p>
        <div className="use-grid cols-2">
          {c.tradeoffCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.bpeSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.tryTitle}
        lead={c.tryLead}
      >
        <TokenizerDemo c={c.tok} />
      </Lsec>

      <Lsec title={c.weirdTitle} lead={c.weirdLead}>
        <div className="use-grid">
          {c.weirdCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.forensicTitle}
        lead={c.forensicLead}
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.forensicHead[0]}</th><th>{c.forensicHead[1]}</th></tr></thead>
            <tbody>
              {c.forensicRows.map((r, i) => (
                <tr key={i}><td className="ph">{r.ph}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.forensicOutro}</p>
        <p className="footnote source-note">{c.forensicSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.guessTitle}
        lead={c.guessLead}
      >
        <div className="flip-grid">
          {c.guess.map((g, i) => <FlipCard key={i} q={g.q} pill={g.pill} why={g.why} />)}
        </div>
      </Lsec>

      <Lsec title={c.pitfallsTitle}>
        <div className="card alert-card row-list">
          {c.pitfalls.map((p, i) => (
            <div className="alert-item" key={i}>
              <div className="wrong-right">
                <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">{p.bad}</span></div>
                <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">{p.good}</span></div>
              </div>
              <p className="why">{p.why}</p>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.quizTitle}>
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.bridgeTitle} lead={c.bridgeLead}>
        <div className="bridge-flow">
          {c.bridgeSteps.map((step, i) => (
            <span className="bridge-flow-item" key={step}>
              <span className="bridge-flow-step">
                <b>{i + 1}</b>
                {step}
              </span>
              {i < c.bridgeSteps.length - 1 && <span className="bridge-flow-arrow">→</span>}
            </span>
          ))}
        </div>
      </Lsec>
    </>
  )
}
