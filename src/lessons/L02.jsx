import { useEffect, useRef, useState } from 'react'
import { Lsec, Chips, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    // ============================================================
    // 交互一：可转动的学习循环
    // ============================================================
    steps: [
      { title: '① 喂数据', sub: '原料进场 · 只在开局发生一次', desc: '把 10 万封邮件连同人工标好的“垃圾 / 正常”一起交给模型。此刻它的参数还是随机数，对垃圾邮件一无所知 —— 1000 封试卷大约要错 493 封。' },
      { title: '② 模型预测', sub: '用当前参数，硬着头皮猜', desc: '对每封邮件给出判断：“是垃圾邮件吗？”参数有多离谱，猜得就有多离谱 —— 开局基本等于抛硬币。' },
      { title: '③ 与正确答案比对', sub: '量出“错了多少”', desc: '把猜测和人工标注一对，数出错题数：误差就是一个实打实的数字。没有玄学，只有对与错。' },
      { title: '④ 微调参数', sub: '朝更准的方向，拧一点点', desc: '照着误差，把参数往“下次能少错几封”的方向轻轻拧一下，然后立刻回到第 ② 步再猜一遍。单圈进步小得可怜 —— 但它一秒能转几千圈。' },
      { title: '✓ 误差足够小：训练完成', sub: '跳出循环 · 规则到手', desc: '误差降到可接受，循环停止。此刻固化在参数里的那套判断方式，就是机器“自己找出的规则”。上线之后它默认不再学习，只负责执行（见小练习第 3 题）。' },
    ],
    rounds: [
      { label: '第 1 圈', err: 471 }, { label: '第 2 圈', err: 455 }, { label: '第 3 圈', err: 440 },
      { label: '第 10 圈', err: 392 }, { label: '第 100 圈', err: 241 }, { label: '第 1000 圈', err: 118 },
      { label: '第 1 万圈', err: 46 }, { label: '第 100 万圈', err: 12 },
    ],
    loop: {
      demoTitle: '🎛️ 交互演示 · 一次完整的学习循环',
      demoHint: '点击节点看每一步在干嘛 · 或点“自动转圈”看误差一路下降',
      svgAria: '机器学习训练循环流程图',
      n0a: '① 数据', n0b: '10 万封已标注邮件',
      n1a: '② 模型预测', n1b: '“这封是垃圾邮件吗？”',
      n2a: '③ 与正确答案比对', n2b: '量出“错了多少” = 误差',
      n3a: '④ 微调参数', n3b: '朝更准的方向拧一点点',
      centerDone: '✓ 100 万圈转完', centerStart: '🔁 还没开始转', centerRound: '🔁 ',
      centerErr: (errN) => <>1000 封试卷 · 错 {errN} 封</>,
      exitA: '✓ 误差足够小：训练完成', exitB: '学到的参数 = 它找到的规则',
      chips: [
        { key: 0, label: '① 喂数据' }, { key: 1, label: '② 预测' }, { key: 2, label: '③ 比对' },
        { key: 3, label: '④ 微调' }, { key: 4, label: '✓ 出口' },
      ],
      step: '▸ 走一步',
      playDone: '✓ 已转完', playPause: '⏸ 暂停', playStart: '▶ 自动转圈',
      reset: '↺ 重置',
      errLabel: '误差：1000 封试卷里猜错',
      errUnit: (errN) => <>{errN} 封</>,
    },

    // ============================================================
    // 交互二：大模型的练习册（猜下一个词）
    // ============================================================
    sents: [
      { prompt: '床前明月＿', note: '✓ 答案自带：原文下一个词就是「光」—— 没人标注，原文就是答案。',
        toks: [{ t: '光', p: 0.78 }, { t: '色', p: 0.1 }, { t: '影', p: 0.06 }, { t: '饼', p: 0.04 }, { t: '鸭', p: 0.02 }] },
      { prompt: '今天天气真＿', note: '✓ 这题没有唯一答案：「好」「不错」「冷」都常见，它学的是一整张概率表。',
        toks: [{ t: '好', p: 0.45 }, { t: '不错', p: 0.24 }, { t: '冷', p: 0.17 }, { t: '差', p: 0.1 }, { t: '香蕉', p: 0.04 }] },
      { prompt: '猫蹲在＿', note: '✓ 概率里藏着常识：猫不爱下水、也上不了月亮 —— 全是从文本统计里白捡的。',
        toks: [{ t: '窗台上', p: 0.41 }, { t: '键盘上', p: 0.27 }, { t: '沙发上', p: 0.22 }, { t: '水里', p: 0.06 }, { t: '月亮上', p: 0.04 }] },
    ],
    stages: [
      { max: 8, data: '0 字', title: '刚出厂 · 纯乱猜', desc: '参数全是随机数，五个候选的概率几乎一样。这时它连“你好”都接不顺 —— 所谓“语言天赋”，一点也没有。' },
      { max: 50, data: '几亿字', title: '训练中 · 循环疯转', desc: '每道填空题都自带答案：猜 → 对答案 → 微调，同一个循环在海量文本上日夜重复。常见说法的概率被一点点推高，离谱选项被一点点压低。' },
      { max: 88, data: '一座图书馆', title: '规律开始沉淀', desc: '语言的套路、常识、甚至整首唐诗，都以“谁更可能接在谁后面”的形式压进参数。没有谁教它语法 —— 统计本身就够了。' },
      { max: 1e9, data: '整个互联网', title: '训练完成 · 概率笃定', desc: '分布已经非常笃定。但注意：它并没有“理解”月光，只是「光」接在这句诗后面的统计证据压倒性地多 —— 这正是下面误区 ③ 要拆的。' },
    ],
    nextTok: {
      demoTitle: '🎛️ 交互演示 · 大模型的练习册：猜下一个词',
      demoHint: '换一句话 · 拖动“训练量”，看概率怎么被一口一口喂出来',
      svgAria: '下一个词概率演示',
      task: '模型的任务：猜下一个词是什么（5 个候选）',
      sliderLabel: '训练量',
    },

    flips: [
      { q: '大模型预训练：把整个互联网切成“猜下一个词”的填空题', pill: { type: 'sage', text: '自监督（监督学习的免费版）' },
        why: '题目和答案都来自原文本身，零人工标注 —— 这正是它能吃下万亿个词的原因。' },
      { q: 'ChatGPT 训练的最后一关：人类给回答打分，好评加分、差评扣分', pill: { type: 'terracotta', text: '强化学习' },
        why: '没有标准答案，只有事后的奖惩 —— 这就是 RLHF 里那个“RL”。' },
      { q: '房产 App 用历史成交记录，预测你家小区的房子能卖多少万', pill: { type: 'sky', text: '监督学习 · 回归' },
        why: '历史成交自带标准答案（真实价格），猜的是一个连续的数 —— 填数字题就是回归。' },
      { q: '音乐 App 把口味相近的听众自动聚成圈子，事先没人规定分几类', pill: { type: 'amber', text: '无监督学习 · 聚类' },
        why: '没有任何标准答案，机器自己在数据里找结构 —— 典型的聚类。' },
      { q: '指令微调：人工写好一万条“问题 + 模范回答”喂给大模型', pill: { type: 'sky', text: '监督学习' },
        why: '模范回答就是人标的标准答案 —— 和垃圾邮件那本“练习册”本质相同，只是题目换成了对话。' },
      { q: '游戏 AI 自己跟自己下一亿盘棋：赢了加分，输了扣分', pill: { type: 'terracotta', text: '强化学习' },
        why: 'AlphaGo 同款配方：试错 + 奖励，在海量对局里摸出拿高分的策略。' },
    ],

    goalsTitle: '🎯 你将学会',
    goals: [
      '一句话说清传统编程和机器学习的根本区别：规则到底是谁找出来的',
      '分清三种学习范式 —— 监督、无监督、强化，看到任何 AI 应用都能立刻归类',
      '亲手转动“猜 → 比对 → 微调”的训练循环，看着误差一圈一圈降下来',
      '看懂 ChatGPT 的配方：把互联网变成万亿道“填空题”，三种范式一条流水线用齐',
      '拆穿三个流行误解：“自学成精”、“数据越多越好”、“模型理解了任务”',
    ],

    conceptTitle: '💡 核心概念：把箭头掉个头',
    conceptLead: '想象你是 2002 年的工程师，老板要你写一个垃圾邮件过滤器，你手里只有一种武器：if-else。先看两条技术路线的根本差别 —— 整个 AI 时代，就藏在这两张卡片的箭头方向里。',
    contrastOldTag: '老路 · 传统编程',
    contrastOldBig: <>规则 + 数据 <span className="gap">→</span> 答案</>,
    contrastOldNote: '人来写规则。程序员把判断逻辑一条条写成代码，数据流进来，按规则算出答案。规则说得清的任务（算个税、算运费）它又快又稳 —— 可规则说不清的呢？',
    contrastNewTag: '新路 · 机器学习',
    contrastNewBig: <>数据 + 答案 <span className="gap">→</span> <span className="hl">规则</span></>,
    contrastNewNote: <>人只提供原料：一大堆数据，外加每条数据的正确答案。机器反过来<b>自己找规则</b> —— 它找出来的这套规则，就是我们常说的“模型”。</>,
    conceptExEn: 'if 含“中奖” → 拦截；if 含“免费” → 拦截；if 标题全是大写 → 拦截……',
    conceptExZh: <>写到第 500 条规则，骗子把“中奖”改成“中　奖”或“恭喜您獲獎”，全部失效；继续补规则，规则之间又开始互相打架，正常邮件被误杀 —— 这叫<b>规则爆炸</b>，老路的死穴。</>,
    conceptOutro: <>机器学习的解法干脆利落：收集 10 万封邮件，人工标好“垃圾 / 正常”，整批喂给算法，让它自己统计出“哪些特征组合最可疑”。它学出的判别规则比 500 条 if-else 细腻得多，而且骗子一变招，再喂一批新邮件重新训练就能跟上。这次掉头的真正威力在于：那些人类<b>会做、却说不清怎么做</b>的事 —— 认猫、听语音、做翻译 —— 第一次变得可解。你写不出“猫”的定义，但你拿得出一百万张猫的照片。</>,

    paradigmsTitle: '📖 三种学习范式：答案从哪儿来',
    paradigmsLead: '“喂数据”也分三种喂法，区别只在一个问题上：正确答案从哪儿来？这三个词在 AI 新闻里出场率极高，认清它们，后面的课会轻松很多。',
    pCards: [
      { label: '范式一 · 答案人来标', en: <>监督学习 <b>Supervised</b></>,
        zh: <>拿“带答案的练习册”刷题：每条数据都配有标准答案。猜“是不是垃圾邮件”这类选择题叫<b>分类</b>，猜“这套房值多少万”这类填数字题叫<b>回归</b>。工业界落地的模型，大半是它。</> },
      { label: '范式二 · 没有答案', en: <>无监督学习 <b>Unsupervised</b></>,
        zh: <>只给数据、不给答案，让机器自己发现结构。最常见的是<b>聚类</b>：把千万用户按行为自动分成“剁手党”“比价党”“潜水党”—— 分几群、按什么分，事先没人规定。</> },
      { label: '范式三 · 试错 + 奖励', en: <>强化学习 <b>Reinforcement</b></>,
        zh: <>没有练习册，只有一个会打分的环境：做对加分、做错扣分，在海量试错里摸索出拿高分的<b>策略</b>。AlphaGo 的神之一手、打游戏的 AI、学走路的机器人，都靠它。</> },
    ],
    paradigmsExEn: '三秒归类口诀：先问“答案从哪来？”',
    paradigmsExZh: '答案是人提前标好的 → 监督学习；压根没有答案、只想找结构 → 无监督学习；答案是环境事后给的奖惩 → 强化学习。记牢这三个词 —— 待会儿你会看到，造一个 ChatGPT，三种喂法会在同一条流水线上全部登场。',

    loopSecTitle: '📖 学习是个循环：猜 → 比对 → 微调',
    loopSecLead: '知道了“机器自己找规则”，下一个问题自然是：它到底怎么找？答案朴素得让人意外 —— 不靠灵感，靠一个不断重复的小循环。这次别光看图，亲手转一转它：',
    tableHead: ['步骤', '机器在做什么', '放到垃圾邮件里看'],
    tableRows: [
      { be: '① 喂数据', ex1: '给模型看一批样本和对应的正确答案', ex2: '10 万封邮件，每封都标了“垃圾 / 正常”' },
      { be: '② 模型预测', ex1: '用当前参数硬着头皮先猜一个答案', ex2: '刚开始纯属乱猜，对错大约各一半' },
      { be: '③ 比对答案', ex1: '把猜测和标准答案一比，算出误差', ex2: '“这 1000 封里猜错了 380 封”' },
      { be: '④ 微调参数', ex1: '朝让误差变小的方向，把参数拧一点点', ex2: '调完再猜：错 379 封 —— 进步了一丁点' },
    ],
    loopSecOutro: <>这个“猜 → 比对 → 微调”的闭环，行话就叫<b>训练（training）</b>。你刚才亲眼看到了：单看一圈进步小得可怜，但它一秒能转成千上万圈 —— “学习”的全部秘密就是<b>笨办法 × 巨大次数</b>。至于第④步“朝哪个方向拧、拧多少”是怎么算出来的，那是深度学习最核心的魔法，留给第 4 课《训练就是下山》专门讲；下一课（第 3 课）先去认识被拧的东西 —— 参数本人。</>,

    chatgptTitle: '🤖 同一个循环，喂出 ChatGPT',
    chatgptLead: '你可能想问：这套“猜 → 比对 → 微调”，跟 ChatGPT 这样的大语言模型（LLM）有什么关系？答案是：关系就是全部 —— 大模型就是这个循环开到极限的产物。变化只有两处：题目换了，规模炸了。',
    chatgptExEn: <>题目：从“这封邮件是垃圾吗”，换成“<span className="hl">猜下一个词</span>”</>,
    chatgptExZh: <>把互联网上的文本遮住一截让模型猜：“床前明月＿”。妙处在于：<b>答案自带</b> —— 下一个词就写在原文里，根本不用人工标注。机器自己出题、自己对答案，行话叫<b>自监督学习</b>，可以理解成“监督学习的免费版”。标注免费，数据规模才能从 10 万封邮件，冲到<b>万亿个词</b>。</>,
    chatgptMid: <>一个朴素到让人不敢信的事实：ChatGPT 写诗、写代码、答题的全部本事，都是从“猜下一个词”这一道题里长出来的 —— 题目足够简单 + 数据足够海量 + 循环转够多次，仅此而已。拖动下面的滑块，亲手“喂大”一个小模型：</>,
    chatgptAfter: <>当然，光会接话还成不了 ChatGPT。从“复读机”到“助手”，要闯三关 —— 注意看每张卡片上的范式标签：上一节的三种学法，在这条流水线里<b>全部登场</b>。</>,
    chatgptCards: [
      { label: '第一关 · 烧掉绝大部分算力', en: <>预训练 <b>Pretraining</b></>,
        pillType: 'sage', pillText: '自监督 ≈ 监督学习的免费版',
        zh: '拿海量互联网文本刷“猜下一个词”，几个月转上万亿圈。出炉时它已装下语言、知识和套路，但只会接话。第 12 课细讲。' },
      { label: '第二关 · 学会“好好答题”', en: <>指令微调 <b>SFT</b></>,
        pillType: 'sky', pillText: '监督学习',
        zh: '人工精心写一批“问题 + 模范回答”喂给它 —— 这回答案真是人标的。它从“只会接话的复读机”，变成“会回答问题的助手”。' },
      { label: '第三关 · 磨脾气', en: <>人类反馈强化学习 <b>RLHF</b></>,
        pillType: 'terracotta', pillText: '强化学习',
        zh: '让人给它的回答打分：有用、诚实加分，胡说、冒犯扣分。在奖惩里反复试错，把说话方式磨得让人放心。第 13 课细讲。' },
    ],

    sortTitle: '🎛️ 动手分一分：这是哪种学法？',
    sortLead: '下面 6 个场景分别用的哪种范式？先自己判断，再点卡片揭晓。口诀照旧：答案从哪儿来？',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '机器学习 = 机器像人一样“自学成精”',
        good: '它是一个纯数学的优化过程：照着误差信号，机械地把一堆数字微调到位',
        why: <><b>病因：</b>“学习”这个词太有人味。机器没有好奇心、也不会顿悟，它只是没日没夜地重复“猜 → 比对 → 微调”。ChatGPT 也不例外 —— 它的全部“学习”，就是把“猜下一个词”这道题做了上万亿遍。把它想成“自动调参的统计机器”，你对它能力和短板的预判反而会准得多。</>,
      },
      {
        bad: '数据越多，模型一定越好',
        good: '数据的质量与分布往往比数量更关键 —— 垃圾进，垃圾出',
        why: <><b>病因：</b>新闻总爱炫耀“用了多少万亿数据”。可 100 万条标错的样本，不如 1 万条标对的；只用大城市房价训练的模型，搬到县城必然失灵 —— 数据没覆盖到的情形，模型学不会。大模型厂商如今花大价钱“洗数据”、买高质量语料，正是这个道理。这个坑第 5 课细讲。</>,
      },
      {
        bad: '模型答对了，说明它“理解”了任务',
        good: '它只是拟合了统计规律：在见过的数据里，找到了特征与答案之间的相关性',
        why: <><b>病因：</b>拟人化的宣传语。一个经典翻车案例：区分狼和哈士奇的模型，实际学到的规律是“背景有雪 = 狼”—— 因为训练照片里狼总站在雪地上。换一张草地上的狼，它立刻认错。大模型的“一本正经胡说八道”（幻觉）同根同源：它输出的是“统计上最像答案的词”，而不是“查证过的事实”，第 29 课细讲。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 把三个系统归到对应范式：A. 银行用十年带结果的放贷记录，预测新申请人会不会违约；B. 电商把千万用户按购物行为自动分成几群，事先没人规定分几类；C. 游戏 AI 靠“赢了加分、输了扣分”自己练成高手。',
        a: <><b>A 监督学习</b>（历史记录自带答案“违约 / 没违约”，是分类问题）；<b>B 无监督学习</b>（没有标准答案，自己找结构，即聚类）；<b>C 强化学习</b>（试错 + 奖励）。口诀照用：答案从哪来？</>,
      },
      {
        q: '2. 公司有两个需求：“自动判断报销金额是否超标”和“识别发票照片上的文字”。分别该用传统编程还是机器学习？',
        a: <>金额是否超标：规则一句话就能说清（金额 &gt; 限额），<b>传统编程</b>一行 if 搞定，又快又稳还可解释；识别照片文字：规则根本写不出来，但带答案的样本好收集，该上<b>机器学习</b>。记住工程铁律：能用 if 写清楚的事，永远别先上机器学习。</>,
      },
      {
        q: '3. 判断：一个训练完成、已经上线的垃圾邮件过滤模型，每天处理新邮件时，还在继续“学习”吗？',
        a: <><b>默认不在。</b>训练和使用（行话叫“推理”）是两个分开的阶段：上线后参数被“冻结”，它只是在执行已经学到的规则。想让它变聪明，要收集新数据、重新训练一轮再上线 —— 这也是大模型会有“知识截止日期”的原因。</>,
      },
      {
        q: '4. 大模型预训练吃掉了几乎整个互联网的文本，却基本不需要人工标注。它的“标准答案”是从哪来的？',
        a: <><b>答案就藏在数据里。</b>把原文遮住一截让模型“猜下一个词”，被遮住的词本身就是标准答案 —— 机器自己出题、自己对答案（自监督学习）。标注成本约等于零，规模才能从“10 万封邮件”冲到“万亿个词”；而到了指令微调和 RLHF 阶段，就重新需要人来写答案、打分了。</>,
      },
    ],
  },

  en: {
    // ============================================================
    // Interactive 1: the spinnable learning loop
    // ============================================================
    steps: [
      { title: '① Feed data', sub: 'Raw material arrives · happens once at the start', desc: 'Hand the model 100,000 emails, each labeled “spam / not spam” by humans. Right now its parameters are still random numbers and it knows nothing about spam — out of 1,000 test emails it gets about 493 wrong.' },
      { title: '② Model predicts', sub: 'Guess as best it can with current parameters', desc: 'It judges each email: “Is this spam?” The more off its parameters are, the more off its guesses are — at the start it’s basically a coin flip.' },
      { title: '③ Compare with the right answer', sub: 'Measure “how wrong it is”', desc: 'Match the guesses against the human labels and count the errors: the error is a hard number. No mysticism, just right and wrong.' },
      { title: '④ Tweak parameters', sub: 'Nudge a little toward more accurate', desc: 'Following the error, gently nudge the parameters in the direction of “getting a few more right next time,” then immediately go back to step ② and guess again. The progress per loop is pathetically small — but it can spin thousands of loops a second.' },
      { title: '✓ Error small enough: training done', sub: 'Exit the loop · the rules are yours', desc: 'When the error drops to an acceptable level, the loop stops. The decision-making baked into the parameters at this moment is the rule the machine “found on its own.” Once deployed, it by default no longer learns — it just executes (see Quiz question 3).' },
    ],
    rounds: [
      { label: 'Loop 1', err: 471 }, { label: 'Loop 2', err: 455 }, { label: 'Loop 3', err: 440 },
      { label: 'Loop 10', err: 392 }, { label: 'Loop 100', err: 241 }, { label: 'Loop 1,000', err: 118 },
      { label: 'Loop 10K', err: 46 }, { label: 'Loop 1M', err: 12 },
    ],
    loop: {
      demoTitle: '🎛️ Interactive · One full learning loop',
      demoHint: 'Click a node to see what each step does · or hit “Auto-spin” to watch the error fall',
      svgAria: 'Machine-learning training loop flowchart',
      n0a: '① Data', n0b: '100K labeled emails',
      n1a: '② Model predicts', n1b: '“Is this spam?”',
      n2a: '③ Compare with the answer', n2b: 'Measure “how wrong” = error',
      n3a: '④ Tweak parameters', n3b: 'Nudge toward more accurate',
      centerDone: '✓ 1M loops done', centerStart: '🔁 Not started yet', centerRound: '🔁 ',
      centerErr: (errN) => <>1,000 test emails · {errN} wrong</>,
      exitA: '✓ Error small enough: training done', exitB: 'Learned parameters = the rule it found',
      chips: [
        { key: 0, label: '① Feed' }, { key: 1, label: '② Predict' }, { key: 2, label: '③ Compare' },
        { key: 3, label: '④ Tweak' }, { key: 4, label: '✓ Exit' },
      ],
      step: '▸ Step once',
      playDone: '✓ Done', playPause: '⏸ Pause', playStart: '▶ Auto-spin',
      reset: '↺ Reset',
      errLabel: 'Out of 1,000 test emails',
      errUnit: (errN) => <>{errN} wrong</>,
    },

    // ============================================================
    // Interactive 2: the LLM’s workbook (guess the next word)
    // ============================================================
    sents: [
      { prompt: '床前明月＿', note: '✓ The answer comes free: the next word in the original text is “光” (moonlight) — no one labels it, the source text is the answer.',
        toks: [{ t: '光', p: 0.78 }, { t: '色', p: 0.1 }, { t: '影', p: 0.06 }, { t: '饼', p: 0.04 }, { t: '鸭', p: 0.02 }] },
      { prompt: '今天天气真＿', note: '✓ This one has no single answer: “好,” “不错,” “冷” are all common — what it learns is a whole probability table.',
        toks: [{ t: '好', p: 0.45 }, { t: '不错', p: 0.24 }, { t: '冷', p: 0.17 }, { t: '差', p: 0.1 }, { t: '香蕉', p: 0.04 }] },
      { prompt: '猫蹲在＿', note: '✓ Common sense hides in the probabilities: cats don’t like water and can’t reach the moon — all picked up for free from text statistics.',
        toks: [{ t: '窗台上', p: 0.41 }, { t: '键盘上', p: 0.27 }, { t: '沙发上', p: 0.22 }, { t: '水里', p: 0.06 }, { t: '月亮上', p: 0.04 }] },
    ],
    stages: [
      { max: 8, data: '0 chars', title: 'Fresh off the line · pure guessing', desc: 'The parameters are all random, so all five candidates have nearly equal probability. At this point it can’t even continue “hello” smoothly — there’s no “language talent” whatsoever.' },
      { max: 50, data: 'hundreds of millions of chars', title: 'Training · the loop spins like mad', desc: 'Every fill-in-the-blank comes with its own answer: guess → check → tweak, the same loop repeating day and night over huge amounts of text. The probability of common phrasings is nudged up bit by bit, while absurd options are pushed down.' },
      { max: 88, data: 'a library', title: 'Patterns start to settle', desc: 'Language’s patterns, common sense, even whole Tang poems get compressed into the parameters as “who is more likely to follow whom.” No one teaches it grammar — the statistics alone are enough.' },
      { max: 1e9, data: 'the entire internet', title: 'Training done · probabilities are confident', desc: 'The distribution is now very confident. But note: it has not “understood” moonlight; it’s just that the statistical evidence for “光” following this line of poetry is overwhelming — exactly what Misconception ③ below will take apart.' },
    ],
    nextTok: {
      demoTitle: '🎛️ Interactive · The LLM’s workbook: guess the next word',
      demoHint: 'Switch sentences · drag “training volume” to see how the probabilities get fed in bite by bite',
      svgAria: 'Next-word probability demo',
      task: 'The model’s task: guess the next word (5 candidates)',
      sliderLabel: 'Training volume',
    },

    flips: [
      { q: 'LLM pretraining: slicing the entire internet into “guess the next word” fill-in-the-blanks', pill: { type: 'sage', text: 'Self-supervised (the free version of supervised learning)' },
        why: 'Both question and answer come from the source text itself, with zero human labeling — exactly why it can devour trillions of words.' },
      { q: 'ChatGPT training’s final stage: humans score the responses, upvotes add points, downvotes subtract', pill: { type: 'terracotta', text: 'Reinforcement learning' },
        why: 'No correct answer, only after-the-fact rewards and penalties — this is the “RL” in RLHF.' },
      { q: 'A real-estate app uses historical sale records to predict how much a home in your neighborhood will sell for', pill: { type: 'sky', text: 'Supervised learning · regression' },
        why: 'Historical sales come with their own answer (the real price), and you’re guessing a continuous number — fill-in-the-number is regression.' },
      { q: 'A music app automatically clusters listeners with similar tastes into groups, with no one specifying how many groups in advance', pill: { type: 'amber', text: 'Unsupervised learning · clustering' },
        why: 'There’s no answer at all; the machine finds structure in the data on its own — a textbook case of clustering.' },
      { q: 'Instruction tuning: humans write 10,000 “question + model answer” pairs to feed the LLM', pill: { type: 'sky', text: 'Supervised learning' },
        why: 'The model answer is the human-labeled ground truth — fundamentally the same as the spam “workbook,” just with dialogue swapped in for the questions.' },
      { q: 'A game AI plays a hundred million games against itself: a win adds points, a loss subtracts', pill: { type: 'terracotta', text: 'Reinforcement learning' },
        why: 'The same recipe as AlphaGo: trial-and-error + rewards, feeling out a high-scoring strategy across huge numbers of games.' },
    ],

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'State in one sentence the fundamental difference between traditional programming and machine learning: who exactly finds the rules',
      'Tell apart the three learning paradigms — supervised, unsupervised, reinforcement — and instantly categorize any AI application you see',
      'Spin the “guess → compare → tweak” training loop yourself and watch the error fall loop by loop',
      'Understand the recipe for ChatGPT: turn the internet into trillions of “fill-in-the-blanks,” using all three paradigms on one assembly line',
      'Bust three popular myths: “it teaches itself into mastery,” “more data is always better,” and “the model understood the task”',
    ],

    conceptTitle: '💡 Core Idea: Flip the Arrow Around',
    conceptLead: 'Imagine you’re an engineer in 2002, and your boss asks you to write a spam filter, with only one weapon in hand: if-else. First look at the fundamental difference between two technical routes — the entire AI era is hidden in the direction of the arrows on these two cards.',
    contrastOldTag: 'Old way · traditional programming',
    contrastOldBig: <>Rules + Data <span className="gap">→</span> Answers</>,
    contrastOldNote: 'Humans write the rules. Programmers code up the decision logic one line at a time, data flows in, and the rules compute an answer. For tasks whose rules are clear (computing income tax, computing shipping) it’s fast and stable — but what about tasks whose rules can’t be spelled out?',
    contrastNewTag: 'New way · machine learning',
    contrastNewBig: <>Data + Answers <span className="gap">→</span> <span className="hl">Rules</span></>,
    contrastNewNote: <>Humans only supply the raw material: a big pile of data, plus the correct answer for each piece. The machine, conversely, <b>finds the rules itself</b> — the set of rules it finds is what we commonly call the “model.”</>,
    conceptExEn: 'if contains “you won” → block; if contains “free” → block; if subject is all caps → block…',
    conceptExZh: <>By the 500th rule, scammers change “中奖” (you won) into “中　奖” or “恭喜您獲獎,” and everything breaks; keep patching rules and they start fighting each other, killing legitimate emails — this is the <b>rule explosion</b>, the old way’s fatal flaw.</>,
    conceptOutro: <>Machine learning’s solution is clean and decisive: collect 100,000 emails, label them “spam / not spam” by hand, feed the whole batch to the algorithm, and let it figure out on its own “which combinations of features are most suspicious.” The discriminating rules it learns are far more nuanced than 500 if-else statements, and when scammers change tactics, you just feed in a fresh batch of emails and retrain to keep up. The real power of flipping the arrow this time is that things humans <b>can do but can’t explain how</b> — recognizing cats, transcribing speech, translating — become solvable for the first time. You can’t write a definition of “cat,” but you can produce a million photos of cats.</>,

    paradigmsTitle: '📖 Three Learning Paradigms: Where the Answer Comes From',
    paradigmsLead: '“Feeding data” also comes in three styles, differing on just one question: where does the correct answer come from? These three terms show up constantly in AI news; nail them down and the later lessons get much easier.',
    pCards: [
      { label: 'Paradigm 1 · humans label the answer', en: <>Supervised learning <b>Supervised</b></>,
        zh: <>Drill problems with “a workbook that has the answers”: every data point comes with a ground-truth answer. Guessing “is this spam” is a multiple-choice task called <b>classification</b>; guessing “how much is this house worth” is a fill-in-the-number task called <b>regression</b>. The majority of models deployed in industry are this kind.</> },
      { label: 'Paradigm 2 · no answer', en: <>Unsupervised learning <b>Unsupervised</b></>,
        zh: <>Give only data, no answers, and let the machine discover structure on its own. The most common is <b>clustering</b>: automatically splitting tens of millions of users by behavior into “big spenders,” “price comparers,” “lurkers” — how many groups, and split by what, is not specified in advance.</> },
      { label: 'Paradigm 3 · trial-and-error + reward', en: <>Reinforcement learning <b>Reinforcement</b></>,
        zh: <>No workbook, just an environment that hands out scores: do it right, gain points; do it wrong, lose points; feel out a high-scoring <b>policy</b> through massive trial-and-error. AlphaGo’s godlike move, game-playing AIs, and robots learning to walk all rely on it.</> },
    ],
    paradigmsExEn: 'Three-second categorizing rule: first ask, “Where does the answer come from?”',
    paradigmsExZh: 'The answer was labeled by humans in advance → supervised learning; there’s no answer at all and you just want to find structure → unsupervised learning; the answer is a reward or penalty handed out by the environment after the fact → reinforcement learning. Memorize these three terms — soon you’ll see that building a ChatGPT puts all three feeding styles on the same assembly line.',

    loopSecTitle: '📖 Learning Is a Loop: Guess → Compare → Tweak',
    loopSecLead: 'Now that we know “the machine finds the rules itself,” the next question is naturally: how exactly does it find them? The answer is surprisingly plain — not inspiration, but a small loop repeated over and over. This time don’t just look at the diagram, spin it yourself:',
    tableHead: ['Step', 'What the machine is doing', 'In the spam example'],
    tableRows: [
      { be: '① Feed data', ex1: 'Show the model a batch of samples and their correct answers', ex2: '100,000 emails, each labeled “spam / not spam”' },
      { be: '② Model predicts', ex1: 'Force out a guess using the current parameters', ex2: 'At first it’s pure guessing, roughly half right half wrong' },
      { be: '③ Compare answers', ex1: 'Match the guesses against the ground truth and compute the error', ex2: '“It got 380 of these 1,000 wrong”' },
      { be: '④ Tweak parameters', ex1: 'Nudge the parameters a little in the direction that shrinks the error', ex2: 'Guess again after tweaking: 379 wrong — a tiny bit of progress' },
    ],
    loopSecOutro: <>This “guess → compare → tweak” closed loop is, in the jargon, called <b>training</b>. You just saw it with your own eyes: one loop alone makes pathetically little progress, but it can spin thousands upon thousands of loops a second — the whole secret of “learning” is <b>a dumb method × an enormous number of times</b>. As for how step ④’s “which direction to nudge and how much” is computed, that’s deep learning’s most core magic, saved for Lesson 4, “Training Is Walking Downhill”; the next lesson (Lesson 3) first introduces the thing being nudged — the parameters themselves.</>,

    chatgptTitle: '🤖 The Same Loop, Fed Into ChatGPT',
    chatgptLead: 'You might be wondering: what does this “guess → compare → tweak” have to do with a large language model (LLM) like ChatGPT? The answer is: everything — an LLM is just this loop taken to the extreme. Only two things change: the question, and the scale.',
    chatgptExEn: <>The question: from “is this email spam” to “<span className="hl">guess the next word</span>”</>,
    chatgptExZh: <>Cover up part of the text on the internet and have the model guess: “床前明月＿.” The beauty is that <b>the answer comes free</b> — the next word is written right there in the original text, with no human labeling needed. The machine sets its own questions and checks its own answers; the jargon is <b>self-supervised learning</b>, which you can think of as “the free version of supervised learning.” Because labeling is free, the data scale can rocket from 100,000 emails up to <b>trillions of words</b>.</>,
    chatgptMid: <>A fact so plain it’s hard to believe: all of ChatGPT’s ability to write poetry, write code, and answer questions grows out of this single task of “guess the next word” — a simple enough question + enough data + enough loops, and that’s all. Drag the slider below to “grow” a small model with your own hands:</>,
    chatgptAfter: <>Of course, being able to continue a sentence doesn’t make a ChatGPT. Going from “parrot” to “assistant” takes three stages — watch the paradigm label on each card: the three learning styles from the last section all <b>make an appearance</b> on this assembly line.</>,
    chatgptCards: [
      { label: 'Stage 1 · burns the vast majority of the compute', en: <>Pretraining <b>Pretraining</b></>,
        pillType: 'sage', pillText: 'Self-supervised ≈ the free version of supervised learning',
        zh: 'Drill “guess the next word” on huge amounts of internet text, spinning trillions of loops over several months. When it emerges it already holds language, knowledge, and patterns, but can only continue sentences. Covered in detail in Lesson 12.' },
      { label: 'Stage 2 · learn to “answer properly”', en: <>Instruction tuning <b>SFT</b></>,
        pillType: 'sky', pillText: 'Supervised learning',
        zh: 'Humans carefully write a batch of “question + model answer” pairs to feed it — and this time the answers really are human-labeled. It goes from “a parrot that only continues sentences” to “an assistant that answers questions.”' },
      { label: 'Stage 3 · polish its temperament', en: <>Reinforcement learning from human feedback <b>RLHF</b></>,
        pillType: 'terracotta', pillText: 'Reinforcement learning',
        zh: 'Have humans score its responses: helpful and honest gains points, nonsense and offensive loses points. Through repeated trial-and-error under rewards and penalties, its way of speaking gets polished until it’s reassuring. Covered in detail in Lesson 13.' },
    ],

    sortTitle: '🎛️ Sort Them Yourself: Which Learning Style Is This?',
    sortLead: 'Which paradigm does each of the 6 scenarios below use? Decide for yourself first, then tap a card to reveal. Same rule as before: where does the answer come from?',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Machine learning = the machine “teaches itself into mastery” like a human',
        good: 'It’s a purely mathematical optimization process: following an error signal, it mechanically tweaks a pile of numbers into place',
        why: <><b>Cause:</b> the word “learning” is too human. The machine has no curiosity and never has an epiphany; it just repeats “guess → compare → tweak” day and night. ChatGPT is no exception — all of its “learning” is doing the “guess the next word” task trillions of times. Think of it as “a statistical machine that auto-tunes its parameters,” and your predictions about its abilities and weaknesses will actually be far more accurate.</>,
      },
      {
        bad: 'More data always makes the model better',
        good: 'The quality and distribution of data often matter more than the quantity — garbage in, garbage out',
        why: <><b>Cause:</b> the news loves to brag about “how many trillions of data points were used.” But 1 million mislabeled samples are worth less than 10,000 correctly labeled ones; a model trained only on big-city housing prices will inevitably fail when moved to a county town — situations the data doesn’t cover, the model can’t learn. The reason LLM vendors now spend big money to “clean data” and buy high-quality corpora is exactly this. This pitfall is covered in detail in Lesson 5.</>,
      },
      {
        bad: 'The model got it right, which means it “understood” the task',
        good: 'It merely fit a statistical pattern: within the data it has seen, it found a correlation between features and answers',
        why: <><b>Cause:</b> anthropomorphizing marketing copy. A classic failure case: a model meant to tell wolves from huskies actually learned the rule “snow in the background = wolf” — because in the training photos wolves always stood on snow. Show it a wolf on grass and it instantly gets it wrong. An LLM’s “confidently talking nonsense” (hallucination) has the same root: what it outputs is “the word that statistically most looks like the answer,” not “a verified fact,” covered in detail in Lesson 29.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Sort three systems into their paradigms: A. A bank uses ten years of loan records with outcomes to predict whether a new applicant will default; B. An e-commerce site automatically splits tens of millions of users by shopping behavior into a few groups, with no one specifying how many in advance; C. A game AI trains itself into an expert by “a win adds points, a loss subtracts.”',
        a: <><b>A supervised learning</b> (the historical records come with the answer “defaulted / didn’t,” a classification problem); <b>B unsupervised learning</b> (no ground-truth answer, finds structure on its own — i.e., clustering); <b>C reinforcement learning</b> (trial-and-error + reward). Use the rule again: where does the answer come from?</>,
      },
      {
        q: '2. A company has two needs: “automatically judge whether a reimbursement amount exceeds the limit” and “recognize the text on a photographed invoice.” Which should use traditional programming and which machine learning?',
        a: <>Whether the amount exceeds the limit: the rule can be stated in one sentence (amount &gt; limit), so <b>traditional programming</b> handles it with a single if — fast, stable, and explainable; recognizing text in a photo: the rules simply can’t be written down, but labeled samples are easy to collect, so go with <b>machine learning</b>. Remember the engineering iron law: never reach for machine learning first for anything you can spell out clearly with an if.</>,
      },
      {
        q: '3. True or false: a spam filter model that has finished training and is already deployed — as it handles new emails every day, is it still “learning”?',
        a: <><b>By default, no.</b> Training and use (jargon: “inference”) are two separate phases: once deployed, the parameters are “frozen,” and it’s merely executing the rules it already learned. To make it smarter, you collect new data, run another round of training, and redeploy — which is also why LLMs have a “knowledge cutoff date.”</>,
      },
      {
        q: '4. LLM pretraining devours the text of nearly the entire internet, yet needs almost no human labeling. Where does its “ground-truth answer” come from?',
        a: <><b>The answer is hidden in the data itself.</b> Cover up part of the original text and have the model “guess the next word”; the covered word is itself the ground-truth answer — the machine sets its own questions and checks its own answers (self-supervised learning). The labeling cost is roughly zero, which is why the scale can rocket from “100,000 emails” to “trillions of words”; and at the instruction-tuning and RLHF stages, humans are once again needed to write answers and assign scores.</>,
      },
    ],
  },
}

function TrainingLoopDemo({ c, steps, rounds }) {
  const LAST = rounds.length - 1
  const START_ERR = 493
  const [cur, setCur] = useState(0)
  const [round, setRound] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)
  // 用 ref 保存最新状态，供 interval 回调读取
  const stateRef = useRef({ cur: 0, round: -1 })
  stateRef.current = { cur, round }

  const err = (r) => (r < 0 ? START_ERR : rounds[r].err)
  const isDone = (c, r) => c === 4 && r === LAST

  function stopPlay() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setPlaying(false)
  }

  function advance() {
    const { cur: c, round: r } = stateRef.current
    if (c === 4) return
    if (c === 0) { setCur(1); return }
    if (c === 3) {
      const nr = r + 1
      if (nr >= LAST) { setRound(LAST); setCur(4); setFinished(true); stopPlay(); return }
      setRound(nr); setCur(1); return
    }
    setCur(c + 1)
  }

  function jump(step) { stopPlay(); setCur(step) }
  function reset() { stopPlay(); setRound(-1); setCur(0); setFinished(false) }

  function togglePlay() {
    if (finished) return
    if (timerRef.current) { stopPlay(); return }
    setPlaying(true)
    timerRef.current = setInterval(advance, 560)
  }

  useEffect(() => {
    if (reduceMotion()) { setRound(LAST); setCur(4); setFinished(true) }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const done = isDone(cur, round)
  const errN = err(round)
  const nodeCls = (k) => `ln${k === cur ? ' active' : ' dim'}`

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body single">
        <div className="demo-stage">
          <svg id="loop-svg" viewBox="0 0 680 368" width="660" role="img" aria-label={c.svgAria}>
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--fg-2)" />
              </marker>
              <marker id="arr-sage" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--sage)" />
              </marker>
            </defs>
            <g className={nodeCls(0)} onClick={() => jump(0)}>
              <rect x="16" y="140" width="132" height="84" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="82" y="178" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{c.n0a}</text>
              <text x="82" y="198" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.n0b}</text>
            </g>
            <g className={nodeCls(1)} onClick={() => jump(1)}>
              <rect x="212" y="48" width="172" height="84" rx="12" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1.5" />
              <text x="298" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{c.n1a}</text>
              <text x="298" y="106" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.n1b}</text>
            </g>
            <g className={nodeCls(2)} onClick={() => jump(2)}>
              <rect x="468" y="48" width="196" height="84" rx="12" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="566" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{c.n2a}</text>
              <text x="566" y="106" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.n2b}</text>
            </g>
            <g className={nodeCls(3)} onClick={() => jump(3)}>
              <rect x="468" y="232" width="196" height="84" rx="12" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1.5" />
              <text x="566" y="270" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{c.n3a}</text>
              <text x="566" y="290" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.n3b}</text>
            </g>
            <path d="M 148 166 C 184 166, 176 90, 206 90" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 384 90 L 462 90" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 566 132 L 566 225" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 468 274 C 350 274, 298 212, 298 138" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <text x="392" y="182" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">
              {done ? c.centerDone : round < 0 ? c.centerStart : c.centerRound + rounds[round].label}
            </text>
            <text x="392" y="202" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.centerErr(errN)}</text>
            <path d="M 462 300 C 390 300, 320 306, 246 308" fill="none" stroke="var(--sage)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#arr-sage)" />
            <g className={nodeCls(4)} onClick={() => jump(4)}>
              <rect x="16" y="272" width="222" height="76" rx="12" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x="127" y="304" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{c.exitA}</text>
              <text x="127" y="324" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{c.exitB}</text>
            </g>
          </svg>
        </div>
      </div>
      <div className="demo-foot">
        <div>
          <Chips
            options={c.chips}
            value={cur}
            onChange={jump}
          />
          <div className="loop-controls">
            <button className="chip" onClick={() => { stopPlay(); advance() }}>{c.step}</button>
            <button className={`chip${playing ? ' active' : ''}`} disabled={finished} onClick={togglePlay}>
              {finished ? c.playDone : playing ? c.playPause : c.playStart}
            </button>
            <button className="chip" onClick={reset}>{c.reset}</button>
          </div>
          <div className={`errbar${done ? ' done' : ''}`}>
            <div className="errbar-top"><span>{c.errLabel}</span><b>{c.errUnit(errN)}</b></div>
            <div className="errbar-track"><div className="errbar-fill" style={{ width: (errN / 1000) * 100 + '%' }} /></div>
          </div>
        </div>
        <div>
          <h4>{steps[cur].title}</h4>
          <div className="period">{steps[cur].sub}</div>
          <p>{steps[cur].desc}</p>
        </div>
      </div>
    </div>
  )
}

function NextTokenDemo({ c, sents, stages }) {
  const [cur, setCur] = useState(0)
  const [v, setV] = useState(() => (reduceMotion() ? 100 : 0))
  const s = sents[cur]
  const t = v / 100
  const e = t * t * (3 - 2 * t)
  const probs = s.toks.map((tk) => 0.2 + (tk.p - 0.2) * e)
  const mx = Math.max(...probs)
  const peaked = mx - Math.min(...probs) > 0.04
  const st = stages.filter((x) => v < x.max)[0] || stages[stages.length - 1]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tok-svg" viewBox="0 0 440 292" width="420" role="img" aria-label={c.svgAria}>
            <text x="16" y="34" fontSize="19" fontWeight="700" fill="var(--fg-0)">{s.prompt}</text>
            <text x="16" y="56" fontSize="11" fill="var(--fg-2)">{c.task}</text>
            {s.toks.map((tk, i) => {
              const y = 76 + i * 38
              const top = peaked && probs[i] === mx
              return (
                <g key={i}>
                  <text x="16" y={y + 14} fontSize="13" fontWeight="600" fill="var(--fg-0)">{tk.t}</text>
                  <rect x="86" y={y} width="288" height="18" rx="6" fill="var(--bg-inset)" stroke="var(--hairline)" />
                  <rect className="bar" x="86" y={y} width={Math.min(288, 6 + probs[i] * 340)} height="18" rx="6" fill={top ? 'var(--sage)' : 'var(--sky)'} />
                  <text x="430" y={y + 13} textAnchor="end" fontSize="12" fontWeight="700" fill={top ? 'var(--sage)' : 'var(--fg-1)'}>{Math.round(probs[i] * 100)}%</text>
                </g>
              )
            })}
            <text id="tok-note" x="16" y="280" fontSize="11.5" fontWeight="600" fill="var(--sage)" opacity={v >= 88 ? 1 : 0}>{s.note}</text>
          </svg>
        </div>
        <div className="demo-side">
          <Chips
            options={sents.map((x, i) => ({ key: i, label: x.prompt }))}
            value={cur}
            onChange={setCur}
          />
          <div className="slider-row">
            <label>{c.sliderLabel}</label>
            <input type="range" min={0} max={100} step={1} value={v} onChange={(ev) => setV(+ev.target.value)} />
            <span className="val" id="tok-stage-val">{st.data}</span>
          </div>
          <h4>{st.title}</h4>
          <p>{st.desc}</p>
        </div>
      </div>
    </div>
  )
}

export default function L02() {
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
            <div className="tag"><span className="pill pill-ink">{c.contrastOldTag}</span></div>
            <div className="big">{c.contrastOldBig}</div>
            <p className="note">{c.contrastOldNote}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastNewTag}</span></div>
            <div className="big">{c.contrastNewBig}</div>
            <p className="note">{c.contrastNewNote}</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">{c.conceptExEn}</div>
          <div className="zh">{c.conceptExZh}</div>
        </div>
        <p className="lead mt14">{c.conceptOutro}</p>
      </Lsec>

      <Lsec
        title={c.paradigmsTitle}
        lead={c.paradigmsLead}
      >
        <div className="use-grid">
          {c.pCards.map((p, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{p.label}</div>
              <div className="en">{p.en}</div>
              <div className="zh">{p.zh}</div>
            </div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.paradigmsExEn}</div>
          <div className="zh">{c.paradigmsExZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.loopSecTitle}
        lead={c.loopSecLead}
      >
        <TrainingLoopDemo c={c.loop} steps={c.steps} rounds={c.rounds} />
        <div className="card mt14">
          <table className="match">
            <thead>
              <tr><th>{c.tableHead[0]}</th><th>{c.tableHead[1]}</th><th>{c.tableHead[2]}</th></tr>
            </thead>
            <tbody>
              {c.tableRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td className="ex">{r.ex1}</td><td className="ex">{r.ex2}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.loopSecOutro}</p>
      </Lsec>

      <Lsec
        title={c.chatgptTitle}
        lead={c.chatgptLead}
      >
        <div className="example">
          <div className="en">{c.chatgptExEn}</div>
          <div className="zh">{c.chatgptExZh}</div>
        </div>
        <p className="lead mt14">{c.chatgptMid}</p>
        <NextTokenDemo c={c.nextTok} sents={c.sents} stages={c.stages} />
        <p className="lead mt14">{c.chatgptAfter}</p>
        <div className="use-grid">
          {c.chatgptCards.map((card, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{card.label}</div>
              <div className="en">{card.en}</div>
              <div className="zh"><span className={`pill pill-${card.pillType}`}>{card.pillText}</span></div>
              <div className="zh">{card.zh}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.sortTitle}
        lead={c.sortLead}
      >
        <div className="flip-grid">
          {c.flips.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
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
    </>
  )
}
