// ============================================================
// 卷积扫描演示控制器（canvas，框架无关）
//   createConvScan(canvas, { onStatus, onPlaying, lang })
//   → { selectKernel, togglePlay, step, reset, setLang, dispose }
// React 负责核的选择/按钮/文案；控制器负责画布绘制与逐格扫描。
// lang 'zh' | 'en'，默认 'zh'，可通过 setLang 实时切换（仅重渲文案，不重置扫描）。
// ============================================================
const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif'
const N = 12, K = 3, M = N - K + 1 // 12×12 输入 · 3×3 核 · 10×10 特征图

// ----- 双语可见文案（数值矩阵不在此处，KERNELS 仅文本字段双语化）-----
const STR = {
  zh: {
    inputTitle: '输入图像 12×12',
    kernelTitle: '卷积核 3×3',
    fmapTitle: '特征图 10×10',
    inputCaption: '每格 = 一个 0~255 的亮度值',
    fmapCaption: '越亮 = 响应越强',
    response: '响应强度 ',
    ready: '就绪 —— 点「播放」让探测器出发',
    scanning: (pos, row, col) =>
      '扫描中 · 第 ' + (pos + 1) + '/100 格 · 输出位置（行 ' + row + '，列 ' + col + '）',
    finished: '扫描完成 · 100 个响应值拼成了右侧特征图',
  },
  en: {
    inputTitle: 'Input image 12×12',
    kernelTitle: 'Kernel 3×3',
    fmapTitle: 'Feature map 10×10',
    inputCaption: 'Each cell = a brightness value 0–255',
    fmapCaption: 'Brighter = stronger response',
    response: 'Response ',
    ready: 'Ready — click "Play" to send the detector off',
    scanning: (pos, row, col) =>
      'Scanning · cell ' + (pos + 1) + '/100 · output position (row ' + row + ', col ' + col + ')',
    finished: 'Scan complete · 100 response values assembled into the feature map on the right',
  },
}

const PATTERN = [
  '............', '.##########.', '.##########.', '........##..',
  '.......##...', '......##....', '.....##.....', '.....##.....',
  '....##......', '....##......', '...##.......', '............',
]
const IMG = []
PATTERN.forEach((row, r) => {
  for (let c = 0; c < N; c++) {
    const i = r * N + c
    IMG.push(row[c] === '#' ? 222 + ((i * 31) % 34) : 6 + ((i * 29) % 17))
  }
})

const b = 1 / 9
export const KERNELS = {
  h: {
    name: { zh: '水平边缘核', en: 'Horizontal edge kernel' },
    sub: { zh: '检测上下方向的亮度跳变', en: 'Detects top-to-bottom brightness jumps' },
    desc: {
      zh: '上排 −1、下排 +1：窗口里“上暗下亮”得正高分，“上亮下暗”得负高分（取绝对值后同样点亮）。看特征图：7 的横杠轮廓被点亮，笔画内部和空白处一片漆黑 —— 没有变化，就没有响应。',
      en: 'Top row −1, bottom row +1: in the window, "dark-above, bright-below" scores high positive, "bright-above, dark-below" scores high negative (taking the absolute value lights up both). Look at the feature map: the outline of the 7\'s horizontal bar lights up, while the stroke interiors and blank areas stay pitch black — no change, no response.',
    },
    maxAbs: 1,
    w: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], norm: (s) => Math.min(1, Math.abs(s) / 600) },
  v: {
    name: { zh: '垂直边缘核', en: 'Vertical edge kernel' },
    sub: { zh: '检测左右方向的亮度跳变', en: 'Detects left-to-right brightness jumps' },
    desc: {
      zh: '左列 −1、右列 +1：专找“左右亮度突变”。这次轮到 7 的斜笔画两侧发亮，横杠中段反而安静 —— 同一张图，换一个核，“看到”的世界完全不同。',
      en: 'Left column −1, right column +1: it hunts specifically for "left-right brightness jumps." This time the sides of the 7\'s diagonal stroke light up, while the middle of the horizontal bar stays quiet — same image, swap the kernel, and the world it "sees" is completely different.',
    },
    maxAbs: 1,
    w: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], norm: (s) => Math.min(1, Math.abs(s) / 600) },
  sharp: {
    name: { zh: '锐化核', en: 'Sharpen kernel' },
    sub: { zh: '放大每个像素与邻居的差异', en: 'Amplifies each pixel\'s difference from its neighbors' },
    desc: {
      zh: '中心 5、上下左右 −1：等于“自己 − 邻居平均”再放大，差异被强化。输出仍像原图，但笔画边缘变“脆”。修图软件里的「锐化」按钮，底层就是这张 3×3 小表格。',
      en: 'Center 5, the four neighbors −1: equivalent to "itself − the neighbor average" and then amplified, so differences are reinforced. The output still looks like the original, but the stroke edges turn "crisp." The "Sharpen" button in photo editors is, underneath, exactly this little 3×3 table.',
    },
    maxAbs: 5,
    w: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], norm: (s) => Math.min(1, Math.max(0, s) / 255) },
  blur: {
    name: { zh: '模糊核', en: 'Blur kernel' },
    sub: { zh: '把每个像素换成邻域平均值', en: 'Replaces each pixel with its neighborhood average' },
    desc: {
      zh: '9 个格子都是 1/9：每个像素被换成 3×3 邻域的平均值，尖锐的笔画被抹开。毛玻璃效果、隐私打码的第一步，往往就是它。',
      en: 'All nine cells are 1/9: each pixel is replaced by the average of its 3×3 neighborhood, smearing out sharp strokes. The frosted-glass effect, and the first step of privacy pixelation, often start right here.',
    },
    maxAbs: b,
    w: [[b, b, b], [b, b, b], [b, b, b]], norm: (s) => Math.min(1, Math.max(0, s) / 255) },
}

const W = 684, H = 304
const IX = 10, IY = 36, IC = 20
const KX = 288, KY = 102, KC = 36
const OX = 430, OY = 36, OC = 24

export function createConvScan(canvas, { onStatus, onPlaying, lang: lang0 }) {
  const ctx = canvas.getContext('2d')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let lang = lang0 || 'zh'
  const T = () => STR[lang] || STR.zh

  let colors = {}
  function readColors() {
    const s = getComputedStyle(document.documentElement)
    colors = {
      fg0: s.getPropertyValue('--fg-0').trim(), fg1: s.getPropertyValue('--fg-1').trim(),
      fg2: s.getPropertyValue('--fg-2').trim(), hairS: s.getPropertyValue('--hairline-strong').trim(),
      accent: s.getPropertyValue('--accent').trim(), sage: s.getPropertyValue('--sage').trim(),
      terra: s.getPropertyValue('--terracotta').trim(), inset: s.getPropertyValue('--bg-inset').trim(),
    }
  }
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  let cur = 'h', pos = -1, playing = false, timer = null
  let fmap = new Array(M * M).fill(null)

  function convAt(idx) {
    const r = Math.floor(idx / M), c = idx % M, k = KERNELS[cur]
    let s = 0
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) s += IMG[(r + i) * N + (c + j)] * k.w[i][j]
    return k.norm(s)
  }
  const fmt = (v) => (Math.abs(v - b) < 1e-9 ? '1/9' : (v < 0 ? '−' : '') + Math.abs(v))

  function draw() {
    ctx.clearRect(0, 0, W, H)
    const k = KERNELS[cur]
    const has = pos >= 0
    const idx = Math.min(Math.max(pos, 0), M * M - 1)
    const r = Math.floor(idx / M), c = idx % M

    const t = T()
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = colors.fg2; ctx.font = '600 12px ' + FONT
    ctx.fillText(t.inputTitle, IX + (IC * N) / 2, 24)
    ctx.fillText(t.kernelTitle, KX + KC * 1.5, KY - 12)
    ctx.fillText(t.fmapTitle, OX + (OC * M) / 2, 24)
    ctx.font = '11px ' + FONT
    ctx.fillText(t.inputCaption, IX + (IC * N) / 2, IY + IC * N + 18)
    ctx.fillText(t.fmapCaption, OX + (OC * M) / 2, OY + OC * M + 18)
    ctx.font = '600 18px ' + FONT
    ctx.fillText('∗', 269, 164); ctx.fillText('=', 415, 164)

    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = IMG[i * N + j]
      ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'
      ctx.fillRect(IX + j * IC + 0.5, IY + i * IC + 0.5, IC - 1, IC - 1)
    }

    if (has) {
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 2.5
      ctx.strokeRect(IX + c * IC + 1, IY + r * IC + 1, IC * K - 2, IC * K - 2)
      ctx.globalAlpha = 0.3; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(IX + (c + K) * IC, IY + r * IC); ctx.lineTo(KX, KY)
      ctx.moveTo(IX + (c + K) * IC, IY + (r + K) * IC); ctx.lineTo(KX, KY + KC * K)
      ctx.stroke(); ctx.globalAlpha = 1
    }

    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
      const x = KX + j * KC, y = KY + i * KC, w = k.w[i][j]
      ctx.fillStyle = colors.inset
      ctx.fillRect(x + 0.5, y + 0.5, KC - 1, KC - 1)
      if (w !== 0) {
        ctx.fillStyle = w > 0 ? colors.sage : colors.terra
        ctx.globalAlpha = 0.16 + (0.34 * Math.abs(w)) / k.maxAbs
        ctx.fillRect(x + 0.5, y + 0.5, KC - 1, KC - 1)
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = colors.fg0
      ctx.font = (fmt(w) === '1/9' ? '700 11px ' : '700 14px ') + FONT
      ctx.textBaseline = 'middle'
      ctx.fillText(fmt(w), x + KC / 2, y + KC / 2 + 1)
      ctx.textBaseline = 'alphabetic'
    }
    ctx.strokeStyle = colors.hairS; ctx.lineWidth = 1
    ctx.strokeRect(KX + 0.5, KY + 0.5, KC * K - 1, KC * K - 1)

    ctx.fillStyle = colors.fg1; ctx.font = '600 12px ' + FONT
    ctx.fillText(t.response + (has && fmap[idx] != null ? fmap[idx].toFixed(2) : '—'), KX + KC * 1.5, KY + KC * K + 26)

    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
      const v = fmap[i * M + j]
      const g = v == null ? 8 : Math.round(8 + v * 247)
      ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'
      ctx.fillRect(OX + j * OC + 0.5, OY + i * OC + 0.5, OC - 1, OC - 1)
    }
    if (has) {
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 2
      ctx.strokeRect(OX + c * OC + 1, OY + r * OC + 1, OC - 2, OC - 2)
    }
  }

  function setStatus() {
    const t = T()
    if (pos < 0) onStatus(t.ready)
    else if (pos < M * M - 1) onStatus(t.scanning(pos, Math.floor(pos / M) + 1, (pos % M) + 1))
    else onStatus(t.finished)
  }
  function setPlaying(v) { playing = v; onPlaying(v) }
  function stop() {
    setPlaying(false)
    if (timer) { clearInterval(timer); timer = null }
  }
  function step() {
    if (pos >= M * M - 1) { stop(); return }
    pos++
    fmap[pos] = convAt(pos)
    draw(); setStatus()
    if (pos >= M * M - 1) stop()
  }
  function resetMap() {
    pos = -1
    fmap = new Array(M * M).fill(null)
    draw(); setStatus()
  }
  function play() {
    if (pos >= M * M - 1) resetMap()
    setPlaying(true)
    timer = setInterval(step, 80)
  }
  function finish() {
    for (let i = 0; i < M * M; i++) fmap[i] = convAt(i)
    pos = M * M - 1
    stop(); draw(); setStatus()
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => { readColors(); draw() }
  mq.addEventListener('change', onScheme)

  readColors()
  setupCanvas()

  return {
    selectKernel(key) {
      cur = key
      stop()
      if (reduceMotion) finish()
      else { resetMap(); play() }
    },
    togglePlay() { playing ? stop() : play() },
    step() { stop(); step() },
    reset() { stop(); resetMap() },
    // 切换语言：仅更新 lang 并用新语言重渲画布文案与状态行，
    // 不重建 canvas、不重置扫描动画状态（pos / fmap 保持不变）。
    setLang(next) {
      if (next !== 'zh' && next !== 'en') return
      lang = next
      draw(); setStatus()
    },
    dispose() {
      stop()
      mq.removeEventListener('change', onScheme)
    },
  }
}
