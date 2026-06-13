import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

function Code({ html }) {
  return (
    <pre className="code">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

// 双语内容层：结构 / class / 交互 / SVG 几何均不变，仅文本按语言取用。
// 代码块命令、标识符、参数（7B、Q4 等）逐字不变；仅中文注释与中文展示字符串双语化。
const C = {
  zh: {
    codeRun: `<span class="cm"># ① 安装：打开 ollama.com 下载安装包，一路下一步（macOS / Windows / Linux 都有）</span>

<span class="cm"># ② 拉起一个模型 —— 一条命令，下载和运行全包了</span>
ollama run qwen3:8b

<span class="cm"># ③ 没有第三步，已经可以聊了：</span>
>>> 帮我把这段话翻译成英文：今天天气不错
Sure! "The weather is nice today."`,
    codeSwitch: `client = OpenAI(
    base_url=<span class="str">"http://localhost:11434/v1"</span>,  <span class="cm"># ← 原来指向云端，现在指向你自己的电脑</span>
    api_key=<span class="str">"ollama"</span>,                      <span class="cm"># ← 本地不计费也不验身份，填个非空字符串即可</span>
)
<span class="cm"># 再把 model 改成 "qwen3:8b"，流式输出、messages 列表……一切照常工作</span>`,

    qmodes: {
      fp16: {
        title: 'FP16 · 出厂原版',
        period: '每参数 16 位（2 字节）· 7B 本体 ≈ 14 GB',
        analogy: '🎧 类比：录音棚无损 WAV —— 一点不丢，体积最大',
        desc: '模型出厂时，每个参数都是一个 16 位的小数，精度拉满。但 7B 模型光本体就要 14 GB，多数笔记本直接装不下 —— 所以本地玩家几乎不跑原版，先压缩再说。',
        tags: ['体积 100%', '精度损失：无'],
      },
      q8: {
        title: 'Q8 · 体积砍半',
        period: '每参数 8 位（1 字节）· 7B 本体 ≈ 7 GB',
        analogy: '🎧 类比：高码率 mp3 —— 体积减半，耳朵基本听不出',
        desc: '把每个参数压到 8 位，整个模型体积砍半，回答质量几乎无损 —— 内存富余时的稳妥之选。',
        tags: ['体积 50%', '精度损失：几乎无感'],
      },
      q4: {
        title: 'Q4 · 本地玩家默认档',
        period: '每参数 4 位（0.5 字节）· 7B 本体 ≈ 3.5 GB',
        analogy: '🎧 类比：普通 mp3 —— 体积只剩 1/4，日常听照样香',
        desc: '压到 4 位，体积只剩 1/4，精度损一点点 —— 日常对话、翻译、总结基本无感。省下的内存还能换大一号的模型，这正是 Q4 成为默认选择的原因。',
        tags: ['体积 25%', '精度损失：一点点'],
      },
    },
    qaDemoTitle: '🎛️ 小演示 · 量化显微镜',
    qaDemoHint: '点按钮切换压缩档位，看体积和精度怎么变',
    qaSvgAria: '量化示意：一个参数占用的二进制位数，以及整个 7B 模型的内存占用变化',
    qaMicro: '🔬 显微镜下：一个参数（权重）占多少位',
    qaValPrefix: '这个参数存下的数值：',
    qaValSuffix: '（示意）',
    qaFar: '🗺️ 拉远看：整个 7B 模型占多少内存',
    qaBodyPrefix: '7B 模型本体 ≈ ',
    qaBodySuffix: ' GB',
    qaNote: '位块与数值为示意 · 真实量化按块混合进行',
    qaChips: [['fp16', 'FP16 原版'], ['q8', '压成 Q8'], ['q4', '压成 Q4']],

    calcDemoTitle: '🎛️ 交互演示 · 本地模型内存计算器',
    calcDemoHint: '选参数量 × 量化档，看标尺上的圆点变色',
    calcSvgAria: '内存需求估算：所需内存在 8GB 到 64GB 常见配置标尺上的位置',
    calcNeedMid: '（十亿参数）× ',
    calcNeedSuffix: ' 字节 × 1.2 开销',
    legendOk: '● 能跑',
    legendTight: '● 吃力（卡线）',
    legendNo: '● 跑不动',
    calcRuler: '常见内存配置标尺（对数刻度）· 圆点 = 该配置跑不跑得动',
    optLabel1: '① 选参数量（模型名里的数字）',
    optLabel2: '② 选量化档（每参数字节数）',
    optLabel3: '③ 看哪台机器跑得动',
    qChips: [[0.5, 'Q4 · 0.5 字节'], [1, 'Q8 · 1 字节'], [2, 'FP16 · 2 字节']],
    calcVerdict: { ok: '能跑', tight: '吃力', no: '跑不动' },
    calcNotes: {
      n8: '入门甜点档：近几年的主流电脑基本都能跑。',
      n16: '16GB 内存的主流笔记本即可胜任。',
      n32: '得上 32GB 内存 —— 进阶玩家的配置。',
      n64: '只有 64GB 级别的大内存机器（如高配 Mac）才稳得住。',
      none: '家用电脑基本无缘 —— 这个档位属于工作站和机房。',
    },
    calcFootnote: '粗略估算：长对话的 KV cache 会再吃几 GB，"吃力"档需要关闭大程序、调小上下文碰运气。以实测为准。',

    goalsTitle: '🎯 你将学会',
    goals: [
      '三步把一个开源大模型跑在自己电脑上 —— 不要 API key、不要网络、不要钱',
      '看懂模型下载页上的黑话：7B 是参数量、Q4/Q8 是量化档、GGUF 是文件格式',
      '学会口算"我的电脑能跑多大的模型"：参数量 × 量化字节数，再加两成开销',
      '给本地模型摆正预期：哪些活交给它、哪些活仍然留给云端旗舰',
    ],

    conceptTitle: '💡 核心概念：把大模型"请回家"的三个理由',
    conceptLead: '上一课的聊天机器人有两根"脐带"：网线和账单 —— 每句话都要发去云端，每个 token 都在计费。这一课我们把脐带剪了：模型整个搬进你的电脑。值得这么折腾的理由有三个。',
    reasons: [
      { label: '理由一 · 隐私', en: <>数据<b>不出门</b></>, zh: '病历、合同、日记、公司代码 —— 推理全程发生在你的内存里，断网照样跑，一个字节都不上传。这是任何云端条款都给不了的硬保证。' },
      { label: '理由二 · 成本', en: <>账单<b>归零</b></>, zh: '第 26 课算过：全量重发让重度使用越聊越贵，Agent 一跑账单起飞。本地模型下载一次随便造 —— 电费就是全部成本。' },
      { label: '理由三 · 乐趣', en: <>完全<b>属于你</b></>, zh: '换模型、改人设、拆开 API 做实验，没有限速、没有审核、没有"服务调整公告"。第 25 课的开源版图，从这里开始变成你的玩具。' },
    ],
    conceptP: <>这扇门是被<b>开源权重模型</b>（第 25 课）推开的：Llama、Qwen、DeepSeek 们把训练好的参数公开放出来，任何人都能下载。于是问题只剩一个 —— 动辄几百亿参数的庞然大物，怎么塞进你这台内存有限的电脑？这正是本课的主线。</>,

    runTitle: '🚀 三行命令，模型进家门',
    runLead: <>先尝到甜头再讲原理。<b>Ollama</b> 是目前最省心的本地模型管家：下载、运行、管理一条龙，三步开聊（其实要敲的只有一条命令）。</>,
    runDemoTitle: '⌨️ 终端 · 从零到开聊',
    runDemoHint: '首次运行会自动下载几个 GB 的模型文件',
    runFootnote: '模型名会不断更新换代（写到这里时 qwen3 系列是热门选择），跑之前去 Ollama 官网的模型库抄最新名字。完全不想碰命令行？LM Studio 提供同样能力的图形界面，鼠标点点即可。',
    runP1: <>接着是本课最爽的一刻：<b>Ollama 装好后，会在你电脑的 11434 端口常驻一个服务，对外说的正是"OpenAI 兼容 API"这门普通话</b>。也就是说，第 26 课那 30 行 chat.py，改两行就从云端切到了本地：</>,
    switchDemoTitle: '📄 chat.py · 只改两行，云端切本地',
    switchDemoHint: '其余 28 行原封不动',
    runP2: <>这就是"OpenAI 兼容"五个字的全部含义：<b>应用代码一行不改，模型随便换</b>。开发调试用本地模型免费试错，上线再换回云端旗舰；下一课搭 RAG，这个开关还会再扳一次。</>,

    jargonTitle: '🔤 黑话解码：7B、Q4、GGUF 是什么意思',
    jargonLead: '打开 Ollama 的模型库，你会看到一排让人头大的名字：qwen3:8b、llama3.3:70b-q4_K_M……别慌，黑话总共就四个，这张表是本课的核心价值：',
    jargonTh: ['黑话', '一句话人话', '多说一句'],
    jargonRows: [
      { be: '7B / 70B', plain: '参数量：70 亿 / 700 亿个可调"旋钮"', ex: 'B = Billion（十亿）。第 15 课的规模法则在此兑现：参数越多通常越聪明 —— 也越吃内存。挑模型先看这个数。' },
      { be: 'Q4 / Q8', plain: '量化：每个参数从 16 位压到 4 / 8 位', ex: '相当于把无损音乐压成 mp3：Q4 体积只剩 1/4，精度只损一点点。下面的"量化显微镜"亲手压给你看。' },
      { be: 'GGUF', plain: '本地推理通用的模型文件格式', ex: '你下载的那个几 GB 的文件就是它。源自 llama.cpp 生态，Ollama、LM Studio 都认 —— 模型界的"通用集装箱"。' },
      { be: '上下文 32K', plain: '能记多长的对话 —— 这也吃内存', ex: '聊得越长，KV cache（第 17 课）越大，内存占用在模型本体之上继续涨。内存吃紧时，调小上下文是隐藏的省内存开关。' },
    ],
    jargonP: <>四个黑话里，<b>量化</b>最值得亲眼看一遍。模型出厂时每个参数都是一个 16 位的小数；量化就是"砍位数"—— 位数减半，整个模型体积就减半。点下面的按钮，把一个 7B 模型从原版一路压到 Q4：</>,
    jargonFootnote: '为什么敢砍？因为模型的"知识"分摊在几十亿个参数的整体分布里，单个参数粗一点，大局几乎不受影响 —— 和 mp3 砍掉人耳不敏感的细节是同一种聪明。',

    calcTitle: '🎛️ 交互演示：我的电脑能跑哪个模型？',
    calcLead: <>本地跑模型的第一道门槛不是显卡多强，而是<b>模型能不能整个装进内存</b>。好消息：看名字就能口算。本课唯一的式子 ——</>,
    formula: '所需内存（GB）≈ 参数量（B）× 每参数字节数 × 1.2',
    calcP1: <>三个数各是什么：<b>参数量</b>就是名字里的 7、14、70（单位十亿）；<b>每参数字节数</b>由量化档决定 —— FP16 是 2 字节、Q8 是 1 字节、Q4 是 0.5 字节；<b>× 1.2</b> 是给运行时开销留的两成余量。例：7B 的 Q4 版 ≈ 7 × 0.5 × 1.2 ≈ 4.2 GB —— 8GB 内存的电脑就能跑。下面的计算器替你算全了：</>,
    calcP2: <>标尺上还藏着一个反常识：跑本地模型，<b>Mac 反而是甜点机器</b>。台式机的独立显卡，显存和内存是两块分开的（显卡标 12GB 显存，那就是上限）；而 Mac 的<b>统一内存显存内存一体</b>，买 64GB 就能拿出一大半喂给模型 —— 这正是上面 64GB 那一档常被 Mac 玩家点亮的原因。</>,

    expectTitle: '🪞 诚实预期：跑得起 ≠ 跑得好',
    expectLead: '第 25 课说过开源在追赶，但请认清：你电脑里跑的 7B 量化版，既不是开源最强（最强的那档你也装不下），更不是云端前沿 —— 中间隔着明显的代差。它像一台家用打印机：印作业、印合同利索得很，别指望印出版级画册。',
    expectLocalTag: '交给本地',
    expectLocalBig: <>量大、简单、<span className="hl">敏感</span>的活</>,
    expectLocalNote: '批量打标签、抽取信息、改写润色、总结隐私文档 —— 不限量、不要钱、数据不出门。还有最重要的一项：随便折腾着学。',
    expectCloudTag: '留给云端',
    expectCloudBig: <>复杂、烧脑、<span className="gap">要质量</span>的活</>,
    expectCloudNote: '多步推理、长程 Agent 任务、高质量长文 —— 这些是前沿模型的主场。本地 7B 硬刚，只会刷新你对"幻觉"的认识。',
    expectP: <>幸运的是，你已经掌握了两全的姿势：同一份代码，<b>base_url 一换就能在本地和云端之间切换</b>。敏感数据走本地，硬骨头丢云端 —— 这才是工程师的答案，而不是站队。</>,

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '装上 Ollama，等于白嫖了一个 ChatGPT',
        good: <>本地小模型和云端前沿模型有明显代差 —— 它是"够用的助手"，不是免费的 Claude / GPT</>,
        why: <><b>病因：</b>都叫"大模型"，名字相似掩盖了规模差距。你跑的是 7B 量化版，云端旗舰的参数量大它一到两个数量级，身后还站着整个机房。翻译、总结这类简单任务感觉不出差距，一到复杂推理、长链路任务就原形毕露。预期摆正了，它反而处处是惊喜。</>,
      },
      {
        bad: '没有 NVIDIA 显卡，本地大模型与我无缘',
        good: <>Mac 统一内存是公认甜点，纯 CPU 也能跑 —— 区别只是每秒吐字的速度</>,
        why: <><b>病因：</b>把"训练"和"推理"混为一谈。训练确实离不开机房级显卡（第 12 课），但推理只要模型装得进内存就能算。llama.cpp 生态把 CPU 推理优化到了可用的程度；Mac 的统一内存更是让"显存不够"这个老大难直接消失。没有独显的电脑跑 7B Q4，慢一点，但门是开着的。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quizLead: '前两题口算就行，第三题留给你的终端。',
    quiz: [
      {
        q: '1. 朋友的笔记本有 16GB 内存，想本地跑某个 32B 模型的 Q4 版。帮他口算一下，可行吗？不行的话退到哪一档？',
        a: <><b>32 × 0.5 × 1.2 ≈ 19.2 GB，超过 16GB —— 跑不动。</b>退一档：14B 的 Q4 版 ≈ 14 × 0.5 × 1.2 ≈ 8.4 GB，16GB 机器能跑且留有余量。这就是黑话的实用价值：不用下载、不用试错，看名字就能下结论。</>,
      },
      {
        q: '2. 同一个模型有 Q4 和 Q8 两个版本，你的内存两个都装得下，该选哪个？',
        a: <>这是道权衡题，<b>没有标准答案</b>：Q8 更接近原版精度；Q4 省下的内存可以换更长的上下文（KV cache）、更流畅的多任务，甚至直接换大一号的模型 —— 同样约 8.4 GB，14B Q4 通常比 7B Q8 更聪明（参数量优先于精度，这是本地圈的常见经验）。多数人默认 Q4，不满意再升。</>,
      },
      {
        q: '3. 动手题：把第 26 课的 chat.py 接到本地 Ollama 上，一共要改哪几处？改完怎么验证"数据不出门"？',
        a: <>三处：① <b>base_url</b> 改为 http://localhost:11434/v1；② <b>model</b> 改成本地模型名（以你 ollama list 列出的为准）；③ <b>api_key</b> 填任意非空字符串（本地不验证）。其余代码一行不动，流式输出照常工作。验证方式简单粗暴：<b>拔掉网线（或关 Wi-Fi）再聊一句</b> —— 还能回答，就证明推理真的发生在你的电脑里。</>,
      },
    ],
  },

  en: {
    codeRun: `<span class="cm"># ① Install: open ollama.com, download the installer, click through (macOS / Windows / Linux all available)</span>

<span class="cm"># ② Pull up a model — one command handles both download and run</span>
ollama run qwen3:8b

<span class="cm"># ③ There is no step three; you can already chat:</span>
>>> Translate this for me into English: 今天天气不错
Sure! "The weather is nice today."`,
    codeSwitch: `client = OpenAI(
    base_url=<span class="str">"http://localhost:11434/v1"</span>,  <span class="cm"># ← used to point to the cloud, now points to your own computer</span>
    api_key=<span class="str">"ollama"</span>,                      <span class="cm"># ← local: no billing, no identity check; any non-empty string works</span>
)
<span class="cm"># Then change model to "qwen3:8b"; streaming, the messages list… everything keeps working as before</span>`,

    qmodes: {
      fp16: {
        title: 'FP16 · factory original',
        period: '16 bits per parameter (2 bytes) · 7B body ≈ 14 GB',
        analogy: '🎧 Analogy: studio lossless WAV — nothing lost, biggest in size',
        desc: 'As it ships, every parameter is a 16-bit decimal, precision maxed out. But a 7B model is already 14 GB of body alone, more than most laptops can hold — so local players almost never run the original; compress it first.',
        tags: ['Size 100%', 'Precision loss: none'],
      },
      q8: {
        title: 'Q8 · size halved',
        period: '8 bits per parameter (1 byte) · 7B body ≈ 7 GB',
        analogy: '🎧 Analogy: high-bitrate mp3 — half the size, your ears barely notice',
        desc: 'Squeeze each parameter down to 8 bits and the whole model halves in size with almost no loss in answer quality — the safe pick when memory is plentiful.',
        tags: ['Size 50%', 'Precision loss: barely noticeable'],
      },
      q4: {
        title: 'Q4 · the local default',
        period: '4 bits per parameter (0.5 byte) · 7B body ≈ 3.5 GB',
        analogy: '🎧 Analogy: ordinary mp3 — only 1/4 the size, still great for daily listening',
        desc: 'Squeezed to 4 bits, the size drops to just 1/4 with a tiny bit of precision lost — barely felt for everyday chat, translation, and summaries. The memory saved can buy a size-up model, which is exactly why Q4 became the default choice.',
        tags: ['Size 25%', 'Precision loss: a tiny bit'],
      },
    },
    qaDemoTitle: '🎛️ Mini Demo · the quantization microscope',
    qaDemoHint: 'Tap a button to switch compression level and watch size and precision change',
    qaSvgAria: 'Quantization illustration: the number of binary bits one parameter takes, and how the memory footprint of the whole 7B model changes',
    qaMicro: '🔬 Under the microscope: how many bits one parameter (weight) takes',
    qaValPrefix: 'Value stored in this parameter: ',
    qaValSuffix: ' (illustrative)',
    qaFar: '🗺️ Zoom out: how much memory the whole 7B model takes',
    qaBodyPrefix: '7B model body ≈ ',
    qaBodySuffix: ' GB',
    qaNote: 'Bit blocks and values are illustrative · real quantization mixes block by block',
    qaChips: [['fp16', 'FP16 original'], ['q8', 'Compress to Q8'], ['q4', 'Compress to Q4']],

    calcDemoTitle: '🎛️ Interactive · local model memory calculator',
    calcDemoHint: 'Pick parameter count × quantization level and watch the dots on the ruler change color',
    calcSvgAria: 'Memory requirement estimate: where the needed memory sits on a ruler of common 8GB-to-64GB configurations',
    calcNeedMid: ' (billion params) × ',
    calcNeedSuffix: ' bytes × 1.2 overhead',
    legendOk: '● Runs',
    legendTight: '● Tight (on the edge)',
    legendNo: '● Won\'t run',
    calcRuler: 'Ruler of common memory configs (log scale) · a dot = whether that config can run it',
    optLabel1: '① Pick parameter count (the number in the model name)',
    optLabel2: '② Pick quantization level (bytes per parameter)',
    optLabel3: '③ See which machine can run it',
    qChips: [[0.5, 'Q4 · 0.5 byte'], [1, 'Q8 · 1 byte'], [2, 'FP16 · 2 bytes']],
    calcVerdict: { ok: 'Runs', tight: 'Tight', no: 'Won\'t run' },
    calcNotes: {
      n8: 'The entry-level sweet spot: most mainstream computers from recent years can run it.',
      n16: 'A mainstream laptop with 16GB of memory is up to the task.',
      n32: 'You\'ll need 32GB of memory — an enthusiast\'s setup.',
      n64: 'Only a 64GB-class large-memory machine (such as a high-spec Mac) holds up steadily.',
      none: 'Home computers are basically out of luck — this tier belongs to workstations and server rooms.',
    },
    calcFootnote: 'Rough estimate: the KV cache of a long conversation eats a few more GB; the "Tight" tier means closing big apps and shrinking the context to chance it. Trust real-world testing.',

    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      'Run an open-source LLM on your own computer in three steps — no API key, no network, no money',
      'Read the jargon on a model download page: 7B is parameter count, Q4/Q8 are quantization levels, GGUF is the file format',
      'Learn to estimate in your head "how big a model my computer can run": parameter count × quantization bytes, plus 20% overhead',
      'Set the right expectations for local models: which jobs to hand them, which still go to the cloud flagships',
    ],

    conceptTitle: '💡 Core Idea: three reasons to "bring the big model home"',
    conceptLead: 'Last lesson\'s chatbot had two "umbilical cords": the network cable and the bill — every line goes to the cloud, every token is metered. This lesson we cut both cords: the whole model moves into your computer. There are three reasons it\'s worth the trouble.',
    reasons: [
      { label: 'Reason 1 · Privacy', en: <>Data <b>never leaves</b></>, zh: 'Medical records, contracts, diaries, company code — inference happens entirely in your own memory, runs fine offline, and not a single byte is uploaded. That\'s a hard guarantee no cloud terms can give you.' },
      { label: 'Reason 2 · Cost', en: <>The bill <b>goes to zero</b></>, zh: 'Lesson 26 did the math: resending everything in full makes heavy use cost more the longer you chat, and an Agent run sends the bill soaring. A local model: download once, tinker freely — electricity is the entire cost.' },
      { label: 'Reason 3 · Fun', en: <>Entirely <b>yours</b></>, zh: 'Swap models, change personas, take the API apart and experiment — no rate limits, no moderation, no "service adjustment notices." Lesson 25\'s open-source map starts becoming your toy right here.' },
    ],
    conceptP: <>This door was pushed open by <b>open-weight models</b> (Lesson 25): Llama, Qwen, and DeepSeek release their trained parameters publicly, and anyone can download them. So only one question remains — how do you fit a behemoth with tens of billions of parameters into your computer with its limited memory? That's exactly the through-line of this lesson.</>,

    runTitle: '🚀 Three lines of command, and the model is home',
    runLead: <>Taste the payoff first, theory later. <b>Ollama</b> is currently the most hassle-free local model manager: download, run, and manage all in one — three steps to start chatting (really there\'s only one command to type).</>,
    runDemoTitle: '⌨️ Terminal · from zero to chatting',
    runDemoHint: 'The first run automatically downloads a model file of several GB',
    runFootnote: 'Model names keep getting updated and replaced (the qwen3 series was a popular choice at the time of writing); before running, copy the latest name from the model library on Ollama\'s official site. Don\'t want to touch the command line at all? LM Studio offers the same capability with a graphical interface — just click around with the mouse.',
    runP1: <>Next comes the most satisfying moment of this lesson: <b>once Ollama is installed, it keeps a service resident on port 11434 of your computer, and the language it speaks to the outside is exactly the "OpenAI-compatible API"</b>. In other words, those 30 lines of chat.py from Lesson 26 switch from cloud to local with just two lines changed:</>,
    switchDemoTitle: '📄 chat.py · change just two lines, cloud to local',
    switchDemoHint: 'The other 28 lines stay untouched',
    runP2: <>That's the whole meaning of "OpenAI-compatible": <b>not a single line of app code changes, swap models freely</b>. Use a local model for free trial-and-error during development and debugging, then switch back to a cloud flagship for production; next lesson we build RAG, and this switch gets flipped once more.</>,

    jargonTitle: '🔤 Jargon Decoded: what do 7B, Q4, GGUF mean',
    jargonLead: 'Open Ollama\'s model library and you\'ll see a row of head-spinning names: qwen3:8b, llama3.3:70b-q4_K_M… Don\'t panic, there are only four bits of jargon in total, and this table is the core value of the lesson:',
    jargonTh: ['Jargon', 'In one plain sentence', 'A bit more'],
    jargonRows: [
      { be: '7B / 70B', plain: 'Parameter count: 7 billion / 70 billion adjustable "knobs"', ex: 'B = Billion. Lesson 15\'s scaling laws cash in here: more parameters usually means smarter — and hungrier for memory. Check this number first when picking a model.' },
      { be: 'Q4 / Q8', plain: 'Quantization: each parameter squeezed from 16 bits down to 4 / 8 bits', ex: 'Like compressing lossless music into mp3: Q4 is only 1/4 the size, with just a tiny bit of precision lost. The "quantization microscope" below compresses it for you by hand.' },
      { be: 'GGUF', plain: 'The common model file format for local inference', ex: 'That several-GB file you download is exactly this. It comes from the llama.cpp ecosystem, and both Ollama and LM Studio recognize it — the model world\'s "universal shipping container."' },
      { be: 'Context 32K', plain: 'How long a conversation it can remember — this eats memory too', ex: 'The longer you chat, the bigger the KV cache (Lesson 17), and memory usage keeps climbing on top of the model body. When memory is tight, shrinking the context is the hidden memory-saving switch.' },
    ],
    jargonP: <>Of the four bits of jargon, <b>quantization</b> is the one most worth seeing with your own eyes. As it ships, every parameter is a 16-bit decimal; quantization is just "cutting bits" — halve the bits, and the whole model halves in size. Click the buttons below to compress a 7B model all the way from original down to Q4:</>,
    jargonFootnote: 'Why dare to cut? Because a model\'s "knowledge" is spread across the overall distribution of billions of parameters; making a single parameter coarser barely affects the big picture — the same kind of cleverness as mp3 cutting the details human ears aren\'t sensitive to.',

    calcTitle: '🎛️ Interactive: which model can my computer run?',
    calcLead: <>The first hurdle to running a model locally isn\'t how strong your GPU is, but <b>whether the model fits entirely into memory</b>. Good news: you can estimate it from the name. The lesson\'s one and only formula ——</>,
    formula: 'Memory needed (GB) ≈ parameter count (B) × bytes per parameter × 1.2',
    calcP1: <>What each of the three numbers is: <b>parameter count</b> is the 7, 14, 70 in the name (unit: billion); <b>bytes per parameter</b> is set by the quantization level — FP16 is 2 bytes, Q8 is 1 byte, Q4 is 0.5 byte; <b>× 1.2</b> leaves a 20% margin for runtime overhead. Example: the Q4 version of 7B ≈ 7 × 0.5 × 1.2 ≈ 4.2 GB — a computer with 8GB of memory can run it. The calculator below does all the math for you:</>,
    calcP2: <>The ruler also hides a counterintuitive fact: for running local models, <b>a Mac is actually the sweet-spot machine</b>. A desktop\'s dedicated GPU keeps VRAM and RAM as two separate blocks (a GPU labeled 12GB VRAM means that\'s the ceiling); whereas a Mac\'s <b>unified memory merges VRAM and RAM</b>, so buy 64GB and you can hand a large chunk of it to the model — exactly why that 64GB tier above is so often lit up by Mac players.</>,

    expectTitle: '🪞 Honest Expectations: can run ≠ runs well',
    expectLead: 'Lesson 25 said open source is catching up, but be clear-eyed: the 7B quantized version running on your computer is neither the strongest open-source model (you can\'t fit that tier either) nor the cloud frontier — there\'s a clear generation gap in between. It\'s like a home printer: brilliant at printing homework and contracts, but don\'t expect publication-grade art prints.',
    expectLocalTag: 'Hand to local',
    expectLocalBig: <>High-volume, simple, <span className="hl">sensitive</span> jobs</>,
    expectLocalNote: 'Batch labeling, information extraction, rewriting and polishing, summarizing private documents — unlimited, free, and the data never leaves. And the most important one: tinker with it freely to learn.',
    expectCloudTag: 'Leave to the cloud',
    expectCloudBig: <>Complex, brain-burning, <span className="gap">quality-critical</span> jobs</>,
    expectCloudNote: 'Multi-step reasoning, long-running Agent tasks, high-quality long-form writing — these are the home turf of frontier models. A local 7B trying to muscle through will only refresh your understanding of "hallucination."',
    expectP: <>Luckily, you\'ve already mastered the best-of-both stance: with the same code, <b>just swap base_url to switch between local and cloud</b>. Sensitive data goes local, the hard bones get tossed to the cloud — that\'s the engineer\'s answer, not picking a side.</>,

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Installing Ollama means scoring a free ChatGPT',
        good: <>A small local model and a frontier cloud model have a clear generation gap — it\'s a "good-enough assistant," not a free Claude / GPT</>,
        why: <><b>Cause:</b> both are called "large models," and the similar name masks the gap in scale. What you run is a 7B quantized version; a cloud flagship has one to two orders of magnitude more parameters, with an entire data center standing behind it. On simple tasks like translation and summarization you can\'t feel the difference, but the moment you hit complex reasoning or long-chain tasks it shows its true colors. Get the expectations right and it\'s full of pleasant surprises instead.</>,
      },
      {
        bad: 'Without an NVIDIA GPU, local LLMs are out of reach for me',
        good: <>Mac unified memory is the recognized sweet spot, and pure CPU can run them too — the only difference is the words-per-second speed</>,
        why: <><b>Cause:</b> conflating "training" with "inference." Training really does require data-center-grade GPUs (Lesson 12), but inference only needs the model to fit into memory to compute. The llama.cpp ecosystem has optimized CPU inference to a usable level; and a Mac\'s unified memory makes the perennial "not enough VRAM" problem disappear outright. A computer without a dedicated GPU running 7B Q4 is slower, but the door is open.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quizLead: 'The first two you can do in your head; the third is left to your terminal.',
    quiz: [
      {
        q: '1. A friend\'s laptop has 16GB of memory and wants to run the Q4 version of some 32B model locally. Estimate for them: is it feasible? If not, which tier should they fall back to?',
        a: <><b>32 × 0.5 × 1.2 ≈ 19.2 GB, over 16GB — won\'t run.</b> Fall back one tier: the Q4 version of 14B ≈ 14 × 0.5 × 1.2 ≈ 8.4 GB, which a 16GB machine can run with room to spare. That\'s the practical value of the jargon: no downloading, no trial-and-error, you can reach a conclusion just from the name.</>,
      },
      {
        q: '2. The same model comes in both Q4 and Q8 versions, and your memory can hold both. Which should you pick?',
        a: <>This is a trade-off question with <b>no standard answer</b>: Q8 is closer to original precision; the memory Q4 saves can buy a longer context (KV cache), smoother multitasking, or even a size-up model outright — at the same ~8.4 GB, 14B Q4 is usually smarter than 7B Q8 (parameter count over precision, a common rule of thumb in local circles). Most people default to Q4 and upgrade if unsatisfied.</>,
      },
      {
        q: '3. Hands-on: to connect Lesson 26\'s chat.py to a local Ollama, how many places need changing in total? After that, how do you verify "the data never leaves"?',
        a: <>Three places: ① <b>base_url</b> changed to http://localhost:11434/v1; ② <b>model</b> changed to a local model name (per what your ollama list shows); ③ <b>api_key</b> set to any non-empty string (local doesn\'t verify it). The rest of the code doesn\'t change a line, and streaming output works as usual. The verification is crude but effective: <b>unplug the network cable (or turn off Wi-Fi) and chat one more line</b> — if it still answers, that proves inference truly happens on your computer.</>,
      },
    ],
  },
}

// ============================================================
// 演示一：量化显微镜
// ============================================================
const QMODES = {
  fp16: { bits: 16, val: '0.2731934', size: 14, savedTxt: '' },
  q8:   { bits: 8,  val: '≈ 0.273',   size: 7,   savedTxt: { zh: '已省下 ≈ 7 GB',    en: 'Saved ≈ 7 GB' } },
  q4:   { bits: 4,  val: '≈ 0.27',    size: 3.5, savedTxt: { zh: '已省下 ≈ 10.5 GB', en: 'Saved ≈ 10.5 GB' } },
}

function QaDemo({ c, lang }) {
  const [key, setKey] = useState('fp16')
  const g = QMODES[key]
  const m = c.qmodes[key]
  const savedTxt = key === 'fp16' ? '' : g.savedTxt[lang] || g.savedTxt.zh
  const wf = (340 * g.size) / 14
  return (
    <div className="card demo" style={{ marginTop: 14 }}>
      <div className="demo-head">
        <span className="demo-title">{c.qaDemoTitle}</span>
        <span className="demo-hint">{c.qaDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="qa-svg" viewBox="0 0 400 250" width="390" aria-label={c.qaSvgAria}>
            <text x="30" y="22" fontSize="11" fontWeight="600" fill="var(--fg-2)">{c.qaMicro}</text>
            <g>
              {Array.from({ length: 16 }, (_, i) =>
                i < g.bits ? (
                  <rect key={i} x={30 + i * 21.4} y="34" width="18" height="22" rx="4" fill="var(--sky)" fillOpacity="0.85" />
                ) : (
                  <rect key={i} x={30 + i * 21.4} y="34" width="18" height="22" rx="4" fill="none" stroke="var(--fg-2)" strokeDasharray="3 3" opacity="0.4" />
                )
              )}
            </g>
            <text x="30" y="92" fontSize="12" fill="var(--fg-0)">{c.qaValPrefix + g.val + (key === 'fp16' ? '' : c.qaValSuffix)}</text>
            <text x="30" y="124" fontSize="11" fontWeight="600" fill="var(--fg-2)">{c.qaFar}</text>
            <g>
              <rect x="30" y="134" width={wf} height="26" rx="5" fill="var(--sky)" fillOpacity="0.8" />
              {g.size < 14 && (
                <rect x={30 + wf + 3} y="134" width={340 - wf - 3} height="26" rx="5" fill="none" stroke="var(--fg-2)" strokeDasharray="4 4" opacity="0.45" />
              )}
            </g>
            <text x="30" y="182" fontSize="11.5" fill="var(--fg-0)">{c.qaBodyPrefix + g.size + c.qaBodySuffix}</text>
            <text x="370" y="182" textAnchor="end" fontSize="11.5" fill="var(--sage)">{savedTxt}</text>
            <text x="30" y="218" fontSize="12.5" fill="var(--fg-1)">{m.analogy}</text>
            <text x="30" y="240" fontSize="10" fill="var(--fg-2)">{c.qaNote}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.qaChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{m.title}</h4>
          <div className="period">{m.period}</div>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示二：内存计算器
// ============================================================
const CONFIGS = [8, 16, 32, 64]
const V = {
  ok:    { c: 'var(--sage)',       pill: 'sage' },
  tight: { c: 'var(--amber)',      pill: 'amber' },
  no:    { c: 'var(--terracotta)', pill: 'terracotta' },
}
const xOf = (gb) => {
  const v = Math.min(Math.max(gb, 2), 512)
  return 30 + ((Math.log2(v) - 1) / 8) * 340
}
const verdictOf = (need, mem) => {
  const r = need / mem
  return r <= 0.8 ? 'ok' : r <= 1.1 ? 'tight' : 'no'
}
const fmt = (n) => {
  const r = Math.round(n * 10) / 10
  return r % 1 === 0 ? String(r) : r.toFixed(1)
}

function CalcDemo({ c }) {
  const [p, setP] = useState(14)
  const [q, setQ] = useState(1)
  const need = p * q * 1.2
  let minOk = null
  const rows = CONFIGS.map((mem) => {
    const v = verdictOf(need, mem)
    if (v === 'ok' && minOk === null) minOk = mem
    return { mem, v }
  })
  const note =
    minOk === 8  ? c.calcNotes.n8
    : minOk === 16 ? c.calcNotes.n16
    : minOk === 32 ? c.calcNotes.n32
    : minOk === 64 ? c.calcNotes.n64
    : c.calcNotes.none

  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">{c.calcDemoTitle}</span>
        <span className="demo-hint">{c.calcDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="calc-svg" viewBox="0 0 400 240" width="400" aria-label={c.calcSvgAria}>
            <text x="200" y="52" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--fg-0)">{'≈ ' + fmt(need) + ' GB'}</text>
            <text x="200" y="76" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">{p + c.calcNeedMid + q + c.calcNeedSuffix}</text>
            <g id="calc-needle" transform={`translate(${xOf(need).toFixed(1)},0)`}>
              <line x1="0" y1="92" x2="0" y2="136" stroke="var(--fg-0)" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M -6 136 L 6 136 L 0 148 Z" fill="var(--fg-0)" />
            </g>
            <line x1="30" y1="150" x2="370" y2="150" stroke="var(--hairline-strong)" strokeWidth="1.5" />
            <g>
              {rows.map(({ mem, v }) => {
                const x = xOf(mem)
                return (
                  <g key={mem}>
                    <line x1={x} y1="144" x2={x} y2="156" stroke="var(--fg-2)" strokeWidth="1.5" />
                    <text x={x} y="172" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--fg-1)">{mem + 'GB'}</text>
                    <circle cx={x} cy="186" r="4.5" fill={V[v].c} />
                  </g>
                )
              })}
            </g>
            <text x="200" y="212" textAnchor="middle" fontSize="10.5">
              <tspan fill="var(--sage)">{c.legendOk}</tspan>
              <tspan dx="14" fill="var(--amber)">{c.legendTight}</tspan>
              <tspan dx="14" fill="var(--terracotta)">{c.legendNo}</tspan>
            </text>
            <text x="200" y="232" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.calcRuler}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="opt-label">{c.optLabel1}</div>
          <div className="chips">
            {[7, 14, 32, 70].map((v) => (
              <button key={v} className={`chip${p === v ? ' active' : ''}`} onClick={() => setP(v)}>{v}B</button>
            ))}
          </div>
          <div className="opt-label">{c.optLabel2}</div>
          <div className="chips">
            {c.qChips.map(([v, label]) => (
              <button key={v} className={`chip${q === v ? ' active' : ''}`} onClick={() => setQ(v)}>{label}</button>
            ))}
          </div>
          <div className="opt-label">{c.optLabel3}</div>
          <div className="stat-pills">
            {rows.map(({ mem, v }) => <Pill key={mem} type={V[v].pill}>{mem + 'GB → ' + c.calcVerdict[v]}</Pill>)}
          </div>
          <p style={{ fontSize: 13 }}>{note}</p>
          <p className="footnote" style={{ marginTop: 10 }}>{c.calcFootnote}</p>
        </div>
      </div>
    </div>
  )
}

export default function L27() {
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
        <div className="use-grid">
          {c.reasons.map((r, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{r.label}</div>
              <div className="en">{r.en}</div>
              <div className="zh">{r.zh}</div>
            </div>
          ))}
        </div>
        <p>{c.conceptP}</p>
      </Lsec>

      <Lsec
        title={c.runTitle}
        lead={c.runLead}
      >
        <div className="card demo">
          <div className="demo-head">
            <span className="demo-title">{c.runDemoTitle}</span>
            <span className="demo-hint">{c.runDemoHint}</span>
          </div>
          <Code html={c.codeRun} />
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>{c.runFootnote}</p>
        <p style={{ marginTop: 20 }}>{c.runP1}</p>
        <div className="card demo" style={{ marginTop: 14 }}>
          <div className="demo-head">
            <span className="demo-title">{c.switchDemoTitle}</span>
            <span className="demo-hint">{c.switchDemoHint}</span>
          </div>
          <Code html={c.codeSwitch} />
        </div>
        <p>{c.runP2}</p>
      </Lsec>

      <Lsec
        title={c.jargonTitle}
        lead={c.jargonLead}
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.jargonTh[0]}</th><th>{c.jargonTh[1]}</th><th>{c.jargonTh[2]}</th></tr></thead>
            <tbody>
              {c.jargonRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td>{r.plain}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 20 }}>{c.jargonP}</p>
        <QaDemo c={c} lang={lang} />
        <p className="footnote" style={{ marginTop: 10 }}>{c.jargonFootnote}</p>
      </Lsec>

      <Lsec
        title={c.calcTitle}
        lead={c.calcLead}
      >
        <div className="card l26-formula">{c.formula}</div>
        <p>{c.calcP1}</p>
        <CalcDemo c={c} />
        <p>{c.calcP2}</p>
      </Lsec>

      <Lsec
        title={c.expectTitle}
        lead={c.expectLead}
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.expectLocalTag}</span></div>
            <div className="big">{c.expectLocalBig}</div>
            <p className="note">{c.expectLocalNote}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.expectCloudTag}</span></div>
            <div className="big">{c.expectCloudBig}</div>
            <p className="note">{c.expectCloudNote}</p>
          </div>
        </div>
        <p>{c.expectP}</p>
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

      <Lsec
        title={c.quizTitle}
        lead={c.quizLead}
      >
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>
    </>
  )
}
