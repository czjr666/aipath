import { useEffect, useRef, useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 双语内容层：结构 / class / SVG 几何 / 交互 / 数值均不变，仅可见文本按语言取用。
// 注意：演示用的中文 token（今天/天气/真/好/…，猫把鱼叼回了窝里）与其概率一一对应，
// 翻译会破坏“逐字预测下一个中文 token”的演示对齐，故保留为中文不译；只翻译讲解性文本。
const C = {
  zh: {
    // ① 流水线
    tfData: {
      input: { title: '① 输入文本', period: '起点 · 一切从一句话开始',
        desc: '模型收到「今天天气真」，整条流水线只为回答一个问题：下一个词最可能是什么？注意，此刻它还只是一串字符 —— 机器并不“认识”汉字，接下来的每一层都在把它翻译成机器能算的东西。', tags: ['「今天天气真」', '任务：续写'] },
      token: { title: '② 分词 Tokenize', period: '切成模型认识的最小单位',
        desc: '句子被切成 token：今天 / 天气 / 真，每个 token 对应词表里的一个编号。大模型的“字典”里装的不是汉字而是 token —— 具体怎么切、为什么按 token 计费，第 11 课专门拆解。', tags: ['token', '词表编号', '第 11 课预告'] },
      embed: { title: '③ 向量化 + 位置编码', period: '变成数字，再补回语序',
        desc: '每个 token 换成一个高维语义向量 —— 就是第 8 课的 Embedding，意思相近的词向量也相近。但 Transformer 整句并行处理，天生不知道词的先后，「我打他」会等于「他打我」。所以每个向量还要叠加位置编码（positional encoding），把并行丢掉的语序补回来。', tags: ['Embedding（第 8 课）', '位置编码'] },
      block: { title: '④ Transformer 块 ×N', period: '流水线的心脏 · 反复加工几十轮',
        desc: '每个块两道工序：先过自注意力 —— 所有词开圆桌会、交换信息，就是第 9 课的“划重点”；再过前馈网络 —— 每个词带着新情报各自深加工。旁边绕行的虚线是残差连接：输出 = 原件 + 本层批注，哪怕某层没学到东西也不碍事，所以叠几十层照样训得动。GPT-3 叠了 96 个这样的块 —— 块内细节见下一节“发动机舱”。', tags: ['自注意力（第 9 课）', '前馈网络', '残差连接'] },
      softmax: { title: '⑤ 输出层 Softmax', period: '把打分压成概率',
        desc: '反复加工后的向量交给输出层，给词表里几万个 token 各打一个分数；softmax 是一个“压分器”，把这串杂乱分数压成一组加起来正好 100% 的百分比 —— 这就是模型对“下一个词是谁”的全部判断，没有别的秘密。', tags: ['词表打分', '概率分布'] },
      predict: { title: '⑥ 预测下一个 token', period: '好 58% · 不错 21% · 冷 9%',
        desc: '从概率分布里挑一个词（怎么挑、“温度”如何影响选择，第 14 课讲），接到句尾变成「今天天气真好」—— 然后整条流水线对新句子再跑一遍，预测下下个词。ChatGPT 逐字往外蹦，就是这么来的 —— 下面的“自回归生成器”可以亲手玩这件事。', tags: ['自回归', '第 14 课预告'] },
    },
    pipeAria: 'Transformer 流水线分层图：自下而上依次是输入文本、分词、向量化加位置编码、N 个 Transformer 块、Softmax 输出层、预测下一个 token',
    pipeTitle: '🏭 Transformer 流水线 · 自下而上',
    pipeHint: '点击图中各层或右侧按钮切换',
    svg: {
      predictTitle: '⑥ 预测下一个 token',
      softmaxTitle: '⑤ 输出层 · Softmax',
      softmaxSub: '给词表里每个 token 打分 → 压成概率',
      blockTitle: '④ Transformer 块',
      residual: '残差连接 →',
      ffnTitle: '前馈网络 FFN',
      ffnSub: '每个词各自深加工',
      attnTitle: '自注意力',
      attnSub: '所有词互看一眼 · 交换信息（第 9 课）',
      embedTitle: '③ 向量化 + 位置编码',
      embedSub1: 'token → 语义向量（第 8 课 Embedding）',
      embedSub2: '＋ 位置戳 ① ② ③，把语序补回来',
      tokenTitle: '② 分词 Tokenize',
      inputTitle: '① 输入文本',
      inputSub: '「今天天气真」→ 请预测下一个词',
    },
    pipeChips: [['input', '① 输入'], ['token', '② 分词'], ['embed', '③ 向量+位置'], ['block', '④ Transformer 块'], ['softmax', '⑤ Softmax'], ['predict', '⑥ 预测']],
    walkPause: '⏸ 暂停',
    walkPlay: '▶ 自动走一遍流水线',

    // ② 自回归生成器
    genSteps: [
      { note: '「真」后面大概率接形容词 —— 训练语料里这种搭配出现过亿万次。这次掷骰子选中了概率最高的「好」。注意：此刻它对再下一个字毫无概念。' },
      { note: '标点也是 token！「今天天气真好」说完，最自然的是停顿一下接后半句 —— 逗号胜出。整句话刚刚从底到顶重新跑了一遍流水线。' },
      { note: '注意分布变平了：逗号之后路有很多条，模型的把握没有刚才大。这种“分布平缓处”正是 AI 回答多样性的来源 —— 同题重问，常在这里走岔。' },
      { note: '「适合」一出，后面大概率接动作。模型自己生成的「好」「，」「适合」此刻也通过自注意力参与了这次预测 —— 它在接自己的龙。' },
      { note: '「出去走走」是高频搭配，分布又变陡了。每生成一个 token，流水线就完整重跑一遍 —— 没有缓存、没有腹稿。' },
      { note: '句号概率最高 —— 模型判断这句话说完了。真实的大模型里还有一个看不见的「结束」token，生成到它，回答就停笔。' },
    ],
    genTitle: '⌨️ 文字接龙 · 一次一个 token',
    genHint: '点「蹦出下一个字」逐步生成',
    genHintBars: '模型已就位 —— 点「蹦出下一个字」，看它先给候选词打分、再挑一个',
    genNext: '▸ 蹦出下一个字',
    genAutoPause: '⏸ 暂停',
    genAutoPlay: '▶▶ 自动生成',
    genReset: '⟲ 重来',
    genSide0: { title: '第 0 步 · 一切就绪', period: '提示词：「今天天气真」', desc: '点左边的按钮，让模型完整跑一遍流水线：给词表里所有 token 打分、压成概率，再从中挑一个接到句尾。每点一次 = 一次完整的前向计算。（概率为教学示意，量级参考真实模型的典型行为。）', tags: ['提示词 3 个 token', '待生成'] },
    genSideDone: { title: '生成结束 · 6 次独立预测', period: '今天天气真好，适合出去走走。', desc: '整句话是 6 次互相独立的预测拼出来的：写「好」的时候，模型并不知道后面会出现「走走」。这就是 ChatGPT 逐字蹦出回答的真正原因 —— 不是打字机动画，是它真实的工作节奏。点「重来」可以再看一遍。', tags: ['自回归', '无腹稿', '第 14 课：换种掷法'] },
    genStepTitle: (step, pick) => `第 ${step} 步 · 蹦出「${pick}」`,
    genStepPeriod: (step) => `已生成 ${step} / 6 个 token · 流水线已完整运转 ${step} 次`,
    genStepTag: '打分 → 压成概率 → 掷骰子',

    // ③ 视野对比
    scopeTitle: '👀 视野对比 · 同一句话，两种读法',
    scopeHint: '先选家族，再点任意一个词',
    scopeModes: [['bert', 'BERT · 完形填空'], ['gpt', 'GPT · 文字接龙']],
    scopeAria: '句子：猫把鱼叼回了窝里，点击任意词查看模型视野',
    scopeLegend: { see: '看得见', predicting: '正在预测', blind: '看不见' },
    scopeBert: (pos, w, n) => ({
      title: 'BERT · 完形填空式阅读', period: `正在预测第 ${pos + 1} 个词「${w}」`,
      desc: `「${w}」被挖掉了，但 BERT 左右两边共 ${n - 1} 个词全部看得见 —— 像做完形填空，前后线索一起用。这种双向全局视野让它特别擅长判断、分类、找相关；代价是它没法从左到右流畅地“写”出一篇长文。`,
      tags: [['sage', '双向视野'], ['ink', '理解型任务']],
    }),
    scopeGpt: (pos, w, n) => ({
      title: 'GPT · 文字接龙式阅读', period: `正在预测第 ${pos + 1} 个词「${w}」`,
      desc: (pos === 0
        ? '预测开头第一个词时，GPT 左边一个字都没有 —— 全凭训练语料里“句子通常怎么开头”的统计直觉。'
        : `预测「${w}」时，GPT 只看得见左边 ${pos} 个词，右边 ${n - 1 - pos} 个词对它来说还不存在。`) +
        ' 看似瞎了一只眼，但正因为永远只看左边，它才能一个字一个字把句子写出来 —— 这就是今天所有对话大模型的工作方式。',
      tags: [['sky', '单向视野'], ['ink', '生成型任务']],
    }),

    // 正文
    goalsTitle: '🎯 你将学会',
    goals: [
      <>说清 2017 年《Attention Is All You Need》为什么是 AI 史的分水岭 —— GPT 和 BERT 的 T，都是 Transformer</>,
      <>沿流水线走完一遍：一句话如何被分词、变向量、反复加工，最后变成“下一个词”的概率分布</>,
      <>拆开 Transformer 块的“三件套”：自注意力、前馈网络、残差连接各自是干什么的、缺了哪个都不行</>,
      <>用两个硬理由解释 Transformer 为什么淘汰了 RNN：并行训练、长距离依赖</>,
      <>把你在 ChatGPT / Claude 里亲眼见过的现象 —— 逐字蹦出、上下文有上限、同题不同答 —— 一一连回流水线上的具体机制</>,
    ],
    conceptTitle: '💡 核心概念：不要循环，注意力就够了',
    conceptLead: '2017 年，Google 的八位研究员发表了一篇论文，标题狂得像宣言 ——《Attention Is All You Need》：注意力就是你需要的一切。潜台词是：统治语言 AI 多年的循环网络（RNN）可以扔了，光靠第 9 课讲的注意力机制，就能搭出更强的架构。他们造出的新架构叫 Transformer。事实证明这不是狂言：GPT 的 T、BERT 的 T 都是它，Claude 和 Gemini 也是它的后代 —— 你今天用到的几乎每个大模型，骨架都是这一副。',
    contrastBefore: '2017 之前 · RNN 时代',
    contrastBeforeBig: <>像传纸条：一个词一个词往后传，<span className="gap">传到后面忘了前面</span></>,
    contrastBeforeNote: '循环网络必须按顺序逐词处理，没法并行；长句子里远处的信息层层转手，传到末尾所剩无几。',
    contrastAfter: '2017 之后 · Transformer',
    contrastAfterBig: <>像开圆桌会：整句话<span className="hl">同时入场，任意两词直接对话</span></>,
    contrastAfterNote: '注意力让每个词直接看到所有词；整句并行计算，GPU 火力全开 —— 这才喂得下整个互联网的文本。',
    fourStepLead: '它对每句话做的事，可以浓缩成四步流水线 —— 先记个轮廓，下面的交互演示会逐层拆开：',
    fourSteps: [
      { label: '第 1 步 · 切', en: <>分词 <b>Token</b></>, zh: '把句子切成 token，查词表换成编号。' },
      { label: '第 2 步 · 变', en: <>向量 <b>+ 位置</b></>, zh: '每个 token 变成语义向量，再盖一个“位置戳”补回语序。' },
      { label: '第 3 步 · 磨', en: <>N 个块 <b>反复加工</b></>, zh: '自注意力（self-attention）交换信息 + 前馈网络各自深加工，叠几十轮。' },
      { label: '第 4 步 · 猜', en: <>输出 <b>概率分布</b></>, zh: '给词表里所有 token 打分：下一个词最可能是谁？' },
    ],
    conceptSourceNote: (
      <>
        本课的架构出自 2017 年那篇奠基论文：Vaswani 等（8 位作者）{' '}
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
          Attention Is All You Need
        </a>
        。
      </>
    ),
    demo1Title: '🎛️ 交互演示 · 词语加工流水线',
    demo1Lead: '输入「今天天气真」，看一条 Transformer 流水线怎样把它逐层向上加工，最后给出「好 58% / 不错 21% / 冷 9%」的概率分布。流水线自下而上：从底部的输入文本开始，点击每一层（或右侧按钮）查看它的职责，也可以让它自动走一遍。',
    mechTitle: '📖 深入展开 · 拆开发动机舱：块里的三件套',
    mechLead: '流水线第④层是整个架构的心脏：几十个一模一样的“块”首尾相接（GPT-3 叠了 96 个）。每个块里只有三样东西 —— 自注意力、前馈网络、残差连接。下面把每一件按“是什么 → 为什么非它不可 → 怎么工作 → 局限在哪”拆透。看懂这一节，你就看懂了所有大模型的发动机。',
    mechs: [
      {
        pill: { type: 'sky', text: '第 1 件 · 自注意力' }, name: '圆桌会议：所有词互相交换情报',
        ps: [
          <><span className="q">是什么。</span>第 9 课那套“划重点”机制的全员版：句子里每个词都环顾整句，决定该重点参考谁、参考多少，然后把对方的信息按比例“吸”过来更新自己。</>,
          <><span className="q">为什么非它不可。</span>没有它，每个词只能孤零零地自我加工 —— “苹果”永远分不清自己是水果还是手机公司。语义藏在<b>词与词的关系</b>里，必须有一个交换信息的环节。</>,
          <><span className="q">怎么工作。</span>想象每个词进会场前印好了三张名片：一张写“<b>我在找什么</b>”（行话叫 Query），一张写“<b>我能提供什么</b>”（Key），一张装着“<b>真要拿就拿这些</b>”的内容（Value）。开会时，每个词拿自己的“我在找”逐一对照所有人的“我能提供”，配对越成功，就从对方那里拿走越多内容。在「这个苹果很甜」里，“苹果”的“我在找”会和“甜”的“我能提供”一拍即合 —— 于是“苹果”的向量被掺入“甜”的信息，悄悄滑向“水果”那一侧；换成「苹果发布了新手机」，同一个词就会被“发布”“手机”拉向“公司”那一侧。而且会议不止开一场：每个块里同时开好几场（行话叫“多头”），有的场子专盯语法搭配，有的专盯“它”指代谁，有的盯情感色彩 —— 散会后各场结论汇总成一份。</>,
          <><span className="q">局限。</span>圆桌会人人都要和人人对话：句子长一倍，对话次数翻四倍。这笔“平方账单”就是大模型上下文窗口有上限的根源（第 17 课细讲）。</>,
        ],
      },
      {
        pill: { type: 'amber', text: '第 2 件 · 前馈网络 FFN' }, name: '独立车间：每个词各自深加工',
        ps: [
          <><span className="q">是什么。</span>一个小型神经网络（就是第 5、6 课那种），每个词<b>单独</b>通过它，词与词互不打扰。</>,
          <><span className="q">为什么非它不可。</span>只开会不消化，信息就只是被反复搅拌。注意力负责“交流”，前馈网络负责“思考”：把刚收集来的情报提炼成更抽象的判断 —— 从“苹果旁边有个甜字”提炼出“这是正面评价的食物”。一收一炼，配合成一轮完整加工。</>,
          <><span className="q">怎么工作。</span>每个词带着开会更新过的向量走进车间，过两道变换出来 —— 进去是“原料”，出来是“半成品”，交给下一个块再开会、再加工。逐块向上，特征越来越抽象：底层的块还在处理“哪个词修饰哪个词”，高层的块已经在表达“这句话在讽刺”这种级别的判断。</>,
          <><span className="q">一个彩蛋。</span>研究者发现，模型的大量“事实记忆” —— 比如“巴黎”与“法国首都”的关联 —— 主要就存放在各层前馈网络的参数里。它不只是加工车间，还是模型的“知识仓库”，参数量占了一个块的大头。</>,
        ],
      },
      {
        pill: { type: 'sage', text: '第 3 件 · 残差连接' }, name: '直达电梯：保证叠 96 层也训得动',
        ps: [
          <><span className="q">是什么。</span>每道工序旁边都留了一条绕行通道（流水线图里那两条虚线）。本课唯一值得记的“式子”，用人话写就是：<b>这一层的输出 = 原件 + 本层的批注</b>。每一层只在原文件上贴便利贴，而不是把文件重写一遍。</>,
          <><span className="q">为什么非它不可。</span>没有它，几十层连续“重写”会把原始信息越磨越淡，训练时的纠错信号也传不回底层 —— 深网络会直接训崩。有了它，最坏情况不过是“这层的批注没价值，原件原样往上传”，深度变成了只赚不赔的买卖。这个 2015 年来自图像识别领域的发明，是 Transformer 敢叠到几十上百层的底气。</>,
          <><span className="q">局限与代价。</span>三件套本身没有“理解”任何东西 —— 它们做的是超大规模的统计与变换，“懂语言”是这些机制堆到足够规模后<b>涌现</b>出来的表现（第 12 课细说）。另外块也不是叠得越多越好：层数翻倍，成本翻倍，效果的提升却越来越小，这正是各家公司拼“规模效率”的战场。</>,
        ],
      },
    ],
    mechSourceNote: (
      <>
        残差连接源自图像识别的 ResNet，He 等 2015{' '}
        <a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">
          Deep Residual Learning for Image Recognition
        </a>
        ；“事实记忆主要存放在前馈网络里”的研究见 Geva 等 2021{' '}
        <a href="https://arxiv.org/abs/2012.14913" target="_blank" rel="noreferrer">
          Transformer Feed-Forward Layers Are Key-Value Memories
        </a>
        。
      </>
    ),
    punchTitle: '📖 两记重拳：它凭什么淘汰 RNN',
    punchLead: '学术界从不缺新架构，Transformer 能横扫一切，靠的不是巧思，而是两个实打实的工程优势。',
    punchTh: ['较量回合', '🐢 RNN · 串行传纸条', '⚡ Transformer · 并行圆桌会'],
    punchRows: [
      ['训练速度', '必须等上一个词算完才能算下一个，昂贵的 GPU 大部分时间在围观', '整句话同时计算，GPU 的并行算力被吃满 —— 互联网级语料从“训不动”变成“训得完”'],
      ['长距离依赖', '第 1 个词的信息要传到第 1000 个词，像传话游戏，传着传着就忘了', '第 1 个词和第 1000 个词通过注意力直接对话，距离再远也不衰减'],
      ['各自的账单', '结构简单、推理省内存，但优点到此为止', '注意力的计算量随句长平方增长 —— 这是大模型“上下文窗口”有限的根源（第 17 课）'],
    ],
    punchAfter: <>第一拳尤其致命：大模型时代的入场券是“用海量数据训练超大网络”，而 RNN 的串行天性让它根本排不进这个赛道。<b>不是 RNN 不够聪明，是它喂不饱。</b>“喂得饱”这个工程优势，最终滚成了智能上的代差 —— 这是 AI 史反复上演的剧本：赢在算力友好，而不是赢在精巧。</>,
    demo2Title: '🎛️ 交互演示 · 自回归生成器：亲手让模型蹦字',
    demo2Lead: '流水线一次只产出一个 token。那 ChatGPT 一大段一大段的回答是哪来的？答案：选一个字接到句尾，把新句子重新跑一遍流水线，再选下一个 —— 行话叫“自回归”（autoregressive）。下面亲手跑一遍：每点一次按钮 = 流水线完整运转一次。注意观察每一步的概率分布怎么变（数字为教学示意）。',
    demo2After: <>玩到最后你会发现一件颠覆直觉的事：写「好」的那一刻，模型完全不知道后面会出现「走走」。<b>整句话是六次互相独立的预测拼出来的</b> —— ChatGPT 逐字蹦出回答，不是打字机特效，而是它真实的工作节奏。这也解释了它为什么偶尔“说到一半把自己绕进去”：每一步都只对“下一个字”负责，没有谁在监督全文。</>,
    phenoTitle: '📖 深入展开 · 你见过的现象，背后全是它',
    phenoLead: '这一课讲的不是屠龙之技 —— 你每天在 ChatGPT、Claude 里撞见的“怪现象”，几乎条条能在流水线上找到根源。对照着读，机制才算真的学会了。',
    phenoTh: ['你在 ChatGPT / Claude 里看到的', '流水线上的根源'],
    phenoRows: [
      ['回答逐字逐词往外蹦，越长的回答等得越久', '自回归：一次只预测一个 token，接到句尾后整条流水线重跑一遍。100 个字 = 100 次完整计算，所以字越多越慢'],
      ['聊得太长，它开始“忘记”开头说过的设定；上下文窗口有硬上限', '自注意力人人对话人人，计算量随长度平方暴涨 —— 窗口必须设上限；超出的部分被截掉，模型是真的“没看见”（第 17 课）'],
      ['同一个问题问两遍，答案不一样', '流水线的终点是概率分布而非唯一答案，回答是从分布里“掷骰子”挑出来的；骰子怎么掷、“温度”怎么调，第 14 课讲'],
      ['API 按 token 计费，同样的意思中文常比英文“贵”', '流水线第一道工序是分词 —— 模型的账本以 token 记，而中文在多数词表里被切得更碎（第 11 课）'],
      ['让它“一步一步想”，答案明显变聪明；推理模型“思考”得越久越准', '多写的每个字都是新一轮完整的流水线计算 —— 草稿纸就是追加算力。“先打草稿再回答”的全部原理，见第 23 课'],
    ],
    phenoAfter: <>反过来这张表也是“防忽悠指南”：下次看到“我们的 AI 会通篇构思再下笔”之类的宣传，你可以直接对照第一行 —— 只要它是 Transformer 自回归路线，就是一个字一个字蹦的。</>,
    familyTitle: '📖 两大家族：会读的 BERT，会写的 GPT',
    familyLead: '原始论文里的 Transformer 是“编码器（encoder）+ 解码器（decoder）”两半拼成的，用来做机器翻译。后来的研究者各取一半，分出了两条路线。',
    familyCards: [
      { label: '编码器路线 · 2018 · Google', en: <>BERT <b>理解型</b></>, zh: <>训练方式是“完形填空”：挖掉句中一个词，让模型看着<b>前后双向</b>的上下文把它填回来。擅长理解类任务 —— 搜索相关度、文本分类、情感判断，Google 搜索曾大规模用它理解你的查询。</> },
      { label: '解码器路线 · 2018 · OpenAI', en: <>GPT <b>生成型</b></>, zh: <>训练方式是“文字接龙”：只许看左边，预测下一个 token。看似比 BERT“瞎了一只眼”，但<b>会接龙就能写出一切</b> —— ChatGPT、Claude、Gemini，今天的大模型基本都是这条路线。</> },
    ],
    familyMid: <>两条路线的全部分歧，浓缩成一个问题：<b>预测一个词时，允许看哪边？</b>点下面的词，亲眼比较两家的“视野”。</>,
    familyAfter: <>为什么“瞎了一只眼”的生成型笑到了最后？因为“预测下一个词”逼着模型理解一切：要接好“这道题的答案是”，就得真的会做题。规模上去之后，理解类任务也能直接用“生成答案”来完成 —— 让 GPT 判断一条评论的情感，只需问它“这条评论是好评还是差评？”，它接龙写出“好评”，分类就做完了。<b>一个接龙模型通吃读写</b>，而 BERT 永远写不了长文。这背后“规模出奇迹”的故事，第 12 课预训练专门讲。</>,
    familySourceNote: (
      <>
        两大家族的原始论文：BERT 见 Devlin 等 2018{' '}
        <a href="https://arxiv.org/abs/1810.04805" target="_blank" rel="noreferrer">
          BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding
        </a>
        ；GPT 见 Radford 等 2018《Improving Language Understanding by Generative Pre-Training》（OpenAI）。
      </>
    ),
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'Transformer 是某个 AI 产品或某个具体模型',
        good: '它是一张架构蓝图 —— 像“内燃机”之于汽车，GPT、BERT、Claude、Gemini 是照这张图纸造出的不同型号',
        why: <><b>病因：</b>新闻里 Transformer 总和具体产品名连在一起出现。记住三层关系：<b>架构</b>是设计图（Transformer），<b>模型</b>是按图纸训练出的成品（GPT-4、Claude），<b>产品</b>是包装好的服务（ChatGPT）。说“Transformer 发布了新版本”就像说“内燃机出了新款轿车”。顺带一提：各家模型的差异主要在块数多少、训练数据和调教方式，发动机舱里的三件套大同小异。</>,
      },
      {
        bad: 'GPT 回答时已经想好了整句话，逐字蹦出来只是“打字机动画”',
        good: '它一次只预测一个 token，拼到句尾后再跑一遍流水线预测下一个 —— 逐字蹦出来就是它真实的工作节奏',
        why: <><b>病因：</b>人说话前往往有完整腹稿，于是把 AI 也想象成这样。实际上 GPT 是“自回归”生成：写第 100 个字时，它自己也不知道第 101 个字是什么 —— 上面的生成器你已经亲手验证过了。第 14 课的温度采样、第 23 课的“先打草稿再回答”，都建立在这个事实之上。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. Transformer 把整句话并行处理，速度起飞 —— 那它怎么分得清「我打他」和「他打我」？',
        a: <>靠<b>位置编码</b>。并行处理本身不分先后，等于把句子拆成一袋词。所以在向量化时要给每个 token 盖一个“位置戳”（第 1 个、第 2 个……），把并行丢掉的语序信息随向量一起送进流水线。</> },
      { q: '2. 下面三个任务，更适合 BERT 家族还是 GPT 家族？①搜索引擎判断网页与查询是否相关 ②写作软件帮你把邮件续写完 ③和客服机器人多轮对话',
        a: <><b>① BERT，② ③ GPT。</b>判断相关性是理解任务，能双向看全文的 BERT 是行家；续写和对话本质都是“预测下一个 token”，正是 GPT 路线的本职工作。</> },
      { q: '3. 朋友抱怨：“我把 300 页合同粘给 AI，它说超出长度限制了 —— 这么先进的模型连个文件都装不下？”用本课知识替模型“喊冤”。',
        a: <>根源是<b>自注意力的“平方账单”</b>：圆桌会上人人都要和人人对话，文本长一倍，计算量翻四倍。300 页合同的注意力开销是天文数字，所以上下文窗口必须设上限 —— 这不是偷工减料，是架构的固有代价。怎么缓解（检索、摘要、分段），第 17 课讲。</> },
      { q: '4. 有创业者宣称：“我们用 RNN 在互联网级语料上训练了一个超大模型。”用本课知识，你会提出什么疑虑？',
        a: <>最大疑虑是<b>训练速度</b>：RNN 必须逐词串行计算，GPU 的并行算力用不上，互联网级语料根本喂不进去 —— 这正是当年大家集体转向 Transformer 的原因。其次，RNN 的长距离依赖在长文档上也撑不住。除非对方有真正的架构创新（近年确有让循环结构复兴的新尝试），否则值得追问细节。</> },
    ],
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '到这里，深度学习的四大基石（网络 / 卷积 / 向量 / 注意力）拼成了一台完整的引擎——Transformer。从下一课起进入“大模型篇”：这台引擎到底怎么被练成 ChatGPT？第一步，回到流水线最底层那道被一带而过的工序——分词。模型眼里没有“字”，只有 token；它怎么切、为什么中文更费 token、为什么按 token 计费，下一课全拆开。',
    bridgeSteps: ['引擎已组装（Transformer）', '进入大模型篇', '先看最底层：分词', '下一课：Token'],
  },

  en: {
    // ① Pipeline
    tfData: {
      input: { title: '① Input text', period: 'The starting point · it all begins with one sentence',
        desc: 'The model receives 「今天天气真」, and the whole pipeline exists to answer just one question: what is the most likely next word? Note that right now it is still just a string of characters — the machine does not "know" Chinese, and every layer that follows is busy translating it into something the machine can compute.', tags: ['「今天天气真」', 'Task: continuation'] },
      token: { title: '② Tokenize', period: 'Cut into the smallest units the model knows',
        desc: 'The sentence is cut into tokens: 今天 / 天气 / 真, and each token maps to an index in the vocabulary. A large model\'s "dictionary" holds tokens, not Chinese characters — exactly how it splits text, and why you are billed per token, gets its own breakdown in Lesson 11.', tags: ['token', 'vocab index', 'Lesson 11 preview'] },
      embed: { title: '③ Vectorize + positional encoding', period: 'Turn into numbers, then add word order back',
        desc: 'Each token becomes a high-dimensional semantic vector — exactly the Embedding from Lesson 8, where words with similar meaning have similar vectors. But the Transformer processes the whole sentence in parallel and inherently has no sense of order, so 「我打他」 would equal 「他打我」. So each vector also has positional information stacked onto it, adding back the word order that parallelism threw away.', tags: ['Embedding (Lesson 8)', 'Positional encoding'] },
      block: { title: '④ Transformer block ×N', period: 'The heart of the pipeline · reprocessed dozens of times',
        desc: 'Each block has two stages: first self-attention — all words hold a round-table meeting and exchange information, exactly the "highlighting" from Lesson 9; then the feed-forward network — each word, carrying its new intel, does its own deep processing. The dashed bypass lines beside them are residual connections: output = original + this layer\'s notes, so even if a layer learns nothing it does no harm — that is why you can stack dozens of layers and still train them. GPT-3 stacked 96 such blocks — for the details inside a block, see the "engine bay" section below.', tags: ['Self-attention (Lesson 9)', 'Feed-forward network', 'Residual connection'] },
      softmax: { title: '⑤ Output layer Softmax', period: 'Squeeze scores into probabilities',
        desc: 'The repeatedly processed vector is handed to the output layer, which gives each of the tens of thousands of tokens in the vocabulary a score; softmax is a "score squeezer" that compresses this messy list of scores into a set of percentages that add up to exactly 100% — this is the model\'s entire judgment about "who the next word is," with no other secret.', tags: ['Vocab scoring', 'Probability distribution'] },
      predict: { title: '⑥ Predict the next token', period: '好 58% · 不错 21% · 冷 9%',
        desc: 'Pick a word from the probability distribution (how you pick, and how "temperature" affects the choice, is covered in Lesson 14), append it to the sentence to get 「今天天气真好」 — then the whole pipeline runs again on the new sentence to predict the word after that. ChatGPT spitting out text character by character comes exactly from this — the "autoregressive generator" below lets you play with it hands-on.', tags: ['Autoregressive', 'Lesson 14 preview'] },
    },
    pipeAria: 'Layered diagram of the Transformer pipeline: from bottom to top, input text, tokenization, vectorization plus positional encoding, N Transformer blocks, the Softmax output layer, and predicting the next token',
    pipeTitle: '🏭 Transformer pipeline · bottom to top',
    pipeHint: 'Click a layer in the diagram or a button on the right to switch',
    svg: {
      predictTitle: '⑥ Predict the next token',
      softmaxTitle: '⑤ Output layer · Softmax',
      softmaxSub: 'Score every token in the vocab → squeeze into probabilities',
      blockTitle: '④ Transformer block',
      residual: 'Residual connection →',
      ffnTitle: 'Feed-forward network FFN',
      ffnSub: 'Each word processes itself deeply',
      attnTitle: 'Self-attention',
      attnSub: 'Every word glances at all the others · exchanges info (Lesson 9)',
      embedTitle: '③ Vectorize + positional encoding',
      embedSub1: 'token → semantic vector (Lesson 8 Embedding)',
      embedSub2: '+ position stamps ① ② ③, adding word order back',
      tokenTitle: '② Tokenize',
      inputTitle: '① Input text',
      inputSub: '「今天天气真」 → please predict the next word',
    },
    pipeChips: [['input', '① Input'], ['token', '② Tokenize'], ['embed', '③ Vector+pos'], ['block', '④ Transformer block'], ['softmax', '⑤ Softmax'], ['predict', '⑥ Predict']],
    walkPause: '⏸ Pause',
    walkPlay: '▶ Auto-walk the pipeline once',

    // ② Autoregressive generator
    genSteps: [
      { note: 'After 「真」 an adjective is highly likely — this kind of pairing appeared billions of times in the training corpus. This roll of the dice landed on the highest-probability 「好」. Note: right now it has no idea what the character after that will be.' },
      { note: 'Punctuation is a token too! After saying 「今天天气真好」, the most natural move is to pause and continue with the second half — the comma wins. The whole sentence just ran through the pipeline again from bottom to top.' },
      { note: 'Notice the distribution has flattened: after the comma there are many paths, and the model is less certain than before. These "flat spots in the distribution" are exactly the source of variety in AI answers — ask the same question again and it often forks right here.' },
      { note: 'Once 「适合」 appears, an action is likely to follow. The model\'s own generated 「好」「，」「适合」 now also take part in this prediction through self-attention — it is continuing its own chain.' },
      { note: '「出去走走」 is a high-frequency pairing, so the distribution sharpens again. Every time a token is generated, the pipeline runs fully again — no cache, no rough draft in mind.' },
      { note: 'The period has the highest probability — the model judges the sentence is finished. In a real large model there is also an invisible "end" token; generate it, and the answer stops.' },
    ],
    genTitle: '⌨️ Word chain · one token at a time',
    genHint: 'Click "Pop out the next character" to generate step by step',
    genHintBars: 'The model is ready — click "Pop out the next character" to watch it score the candidates first, then pick one',
    genNext: '▸ Pop out the next character',
    genAutoPause: '⏸ Pause',
    genAutoPlay: '▶▶ Auto-generate',
    genReset: '⟲ Restart',
    genSide0: { title: 'Step 0 · all set', period: 'Prompt: 「今天天气真」', desc: 'Click the button on the left to let the model run the full pipeline once: score every token in the vocabulary, squeeze into probabilities, then pick one and append it to the sentence. Each click = one full forward pass. (Probabilities are illustrative for teaching, with magnitudes referencing typical real-model behavior.)', tags: ['Prompt: 3 tokens', 'To be generated'] },
    genSideDone: { title: 'Generation done · 6 independent predictions', period: '今天天气真好，适合出去走走。', desc: 'The whole sentence was stitched together from 6 mutually independent predictions: when it wrote 「好」, the model did not know 「走走」 would appear later. This is the real reason ChatGPT pops out answers character by character — it is not a typewriter animation, it is its genuine working rhythm. Click "Restart" to watch it again.', tags: ['Autoregressive', 'No rough draft', 'Lesson 14: a different roll'] },
    genStepTitle: (step, pick) => `Step ${step} · popped out 「${pick}」`,
    genStepPeriod: (step) => `${step} / 6 tokens generated · the pipeline has run fully ${step} times`,
    genStepTag: 'Score → squeeze into probabilities → roll the dice',

    // ③ Scope comparison
    scopeTitle: '👀 Scope comparison · one sentence, two ways to read it',
    scopeHint: 'Pick a family first, then click any word',
    scopeModes: [['bert', 'BERT · fill-in-the-blank'], ['gpt', 'GPT · word chain']],
    scopeAria: 'Sentence: 猫把鱼叼回了窝里. Click any word to see the model\'s field of view',
    scopeLegend: { see: 'visible', predicting: 'predicting now', blind: 'invisible' },
    scopeBert: (pos, w, n) => ({
      title: 'BERT · fill-in-the-blank reading', period: `Predicting word #${pos + 1}, 「${w}」`,
      desc: `「${w}」 has been masked out, but BERT can see all ${n - 1} words on both sides — like a fill-in-the-blank, using clues before and after together. This bidirectional, global field of view makes it especially good at judging, classifying, and finding relevance; the cost is that it cannot fluently "write" a long passage from left to right.`,
      tags: [['sage', 'Bidirectional view'], ['ink', 'Understanding tasks']],
    }),
    scopeGpt: (pos, w, n) => ({
      title: 'GPT · word-chain reading', period: `Predicting word #${pos + 1}, 「${w}」`,
      desc: (pos === 0
        ? 'When predicting the very first word, GPT has not a single character to its left — it relies entirely on the statistical intuition from the training corpus about "how sentences usually start."'
        : `When predicting 「${w}」, GPT can only see the ${pos} word(s) on its left; the ${n - 1 - pos} word(s) on its right simply do not exist for it yet.`) +
        ' It looks blind in one eye, but precisely because it only ever looks left, it can write a sentence out one character at a time — and this is how every conversational large model today works.',
      tags: [['sky', 'Unidirectional view'], ['ink', 'Generation tasks']],
    }),

    // Body
    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>Explain why the 2017 paper "Attention Is All You Need" was a watershed in AI history — the T in both GPT and BERT is Transformer</>,
      <>Walk the pipeline end to end: how a sentence is tokenized, vectorized, reprocessed over and over, and finally turned into a probability distribution over the "next word"</>,
      <>Take apart the "three-piece set" of a Transformer block: what self-attention, the feed-forward network, and residual connections each do, and why none can be missing</>,
      <>Use two hard reasons to explain why Transformer rendered RNNs obsolete: parallel training and long-range dependencies</>,
      <>Connect the phenomena you have seen with your own eyes in ChatGPT / Claude — character-by-character output, the context limit, different answers to the same question — back to the specific mechanisms in the pipeline, one by one</>,
    ],
    conceptTitle: '💡 Core Idea: Forget recurrence, attention is all you need',
    conceptLead: 'In 2017, eight researchers at Google published a paper with a title as bold as a manifesto — "Attention Is All You Need." The subtext: the recurrent networks (RNNs) that had ruled language AI for years could be thrown out, and the attention mechanism from Lesson 9 alone was enough to build a stronger architecture. The new architecture they built is called the Transformer. It turned out to be no idle boast: the T in GPT, the T in BERT, are both it, and Claude and Gemini are its descendants too — almost every large model you use today shares this same skeleton.',
    contrastBefore: 'Before 2017 · the RNN era',
    contrastBeforeBig: <>Like passing notes: word by word down the line, <span className="gap">by the time it reaches the end the start is forgotten</span></>,
    contrastBeforeNote: 'A recurrent network must process word by word in order, with no parallelism; in a long sentence, distant information is relayed hand to hand and barely anything survives by the end.',
    contrastAfter: 'After 2017 · the Transformer',
    contrastAfterBig: <>Like a round-table meeting: the whole sentence <span className="hl">enters at once, any two words talk directly</span></>,
    contrastAfterNote: 'Attention lets every word see all the others directly; the whole sentence is computed in parallel, with the GPU firing at full power — only this can feed on the entire internet\'s text.',
    fourStepLead: 'What it does to each sentence boils down to a four-step pipeline — get the outline first; the interactive demo below takes it apart layer by layer:',
    fourSteps: [
      { label: 'Step 1 · Cut', en: <>Tokenize <b>Token</b></>, zh: 'Cut the sentence into tokens, look them up in the vocab, swap for indices.' },
      { label: 'Step 2 · Transform', en: <>Vector <b>+ position</b></>, zh: 'Turn each token into a semantic vector, then stamp a "position mark" to add word order back.' },
      { label: 'Step 3 · Grind', en: <>N blocks <b>reprocessing</b></>, zh: 'Self-attention exchanges info + the feed-forward network processes each deeply, stacked over dozens of rounds.' },
      { label: 'Step 4 · Guess', en: <>Output <b>probability distribution</b></>, zh: 'Score every token in the vocab: who is most likely to be the next word?' },
    ],
    conceptSourceNote: (
      <>
        This lesson’s architecture comes from the 2017 foundational paper: Vaswani et al. (8 authors),{' '}
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
          Attention Is All You Need
        </a>
        .
      </>
    ),
    demo1Title: '🎛️ Interactive · The word-processing pipeline',
    demo1Lead: 'Enter 「今天天气真」 and watch a Transformer pipeline process it layer by layer upward, finally giving the probability distribution 「好 58% / 不错 21% / 冷 9%」. The pipeline runs bottom to top: starting from the input text at the bottom, click each layer (or a button on the right) to see its job, or let it walk through automatically.',
    mechTitle: '📖 Going deeper · Opening the engine bay: the three-piece set inside a block',
    mechLead: 'Layer ④ of the pipeline is the heart of the whole architecture: dozens of identical "blocks" connected end to end (GPT-3 stacked 96). Inside each block there are only three things — self-attention, the feed-forward network, and residual connections. Below we take each apart along "what it is → why it is indispensable → how it works → where its limits lie." Understand this section, and you understand the engine of every large model.',
    mechs: [
      {
        pill: { type: 'sky', text: 'Piece 1 · Self-attention' }, name: 'Round-table meeting: all words exchange intel with each other',
        ps: [
          <><span className="q">What it is.</span> The all-hands version of the "highlighting" mechanism from Lesson 9: every word in the sentence looks around at the whole sentence, decides whom to focus on and by how much, then "absorbs" the others\' information in proportion to update itself.</>,
          <><span className="q">Why it is indispensable.</span> Without it, each word can only process itself in isolation — "apple" could never tell whether it is a fruit or a phone company. Meaning hides in the <b>relationships between words</b>, so there must be a stage for exchanging information.</>,
          <><span className="q">How it works.</span> Imagine each word printed three name cards before entering the meeting hall: one says "<b>what I\'m looking for</b>" (jargon: Query), one says "<b>what I can offer</b>" (Key), and one holds the actual content of "<b>if you really want it, take this</b>" (Value). During the meeting, each word holds up its "what I\'m looking for" and checks it one by one against everyone\'s "what I can offer"; the better the match, the more content it takes from that party. In 「这个苹果很甜」, "apple\'s" "what I\'m looking for" clicks with "sweet\'s" "what I can offer" — so the vector for "apple" gets infused with the information of "sweet," quietly sliding toward the "fruit" side; switch to 「苹果发布了新手机」, and the same word gets pulled by "released" and "phone" toward the "company" side. And there is more than one meeting: each block holds several at once (jargon: "multi-head"), some sessions watching grammatical pairings, some watching what "it" refers to, some watching emotional tone — when they adjourn, the conclusions from all sessions are merged into one.</>,
          <><span className="q">Limits.</span> At a round table everyone must talk to everyone: double the sentence length and the number of conversations quadruples. This "squared bill" is the root cause of the upper limit on a large model\'s context window (detailed in Lesson 17).</>,
        ],
      },
      {
        pill: { type: 'amber', text: 'Piece 2 · Feed-forward network FFN' }, name: 'A private workshop: each word processes itself deeply',
        ps: [
          <><span className="q">What it is.</span> A small neural network (just like the kind in Lessons 5 and 6) that each word passes through <b>on its own</b>, with words not disturbing one another.</>,
          <><span className="q">Why it is indispensable.</span> Only meeting and never digesting just stirs the information around repeatedly. Attention handles "communication," the feed-forward network handles "thinking": refining the intel just gathered into a more abstract judgment — from "there is a \'sweet\' next to \'apple\'" to "this is a positively reviewed food." Gather then refine, working together into one complete round of processing.</>,
          <><span className="q">How it works.</span> Each word walks into the workshop carrying the vector updated in the meeting, passes through two transformations, and comes out — in goes "raw material," out comes a "semi-finished part," handed to the next block to meet and process again. Going up block by block, the features get more and more abstract: lower blocks are still handling "which word modifies which," while higher blocks are already expressing judgments at the level of "this sentence is being sarcastic."</>,
          <><span className="q">An easter egg.</span> Researchers found that much of a model\'s "factual memory" — for example the association between "Paris" and "the capital of France" — is mainly stored in the parameters of the feed-forward networks across the layers. It is not just a processing workshop but the model\'s "knowledge warehouse," accounting for the bulk of a block\'s parameters.</>,
        ],
      },
      {
        pill: { type: 'sage', text: 'Piece 3 · Residual connection' }, name: 'An express elevator: makes even 96 stacked layers trainable',
        ps: [
          <><span className="q">What it is.</span> Beside each stage there is a bypass channel (the two dashed lines in the pipeline diagram). The only "formula" worth remembering in this lesson, put in plain words, is: <b>this layer\'s output = the original + this layer\'s notes</b>. Each layer only sticks sticky notes onto the original file, rather than rewriting the file from scratch.</>,
          <><span className="q">Why it is indispensable.</span> Without it, dozens of consecutive "rewrites" would grind the original information ever fainter, and the error-correcting signal during training could not flow back to the lower layers — the deep network would simply collapse in training. With it, the worst case is just "this layer\'s notes are worthless, pass the original up unchanged," turning depth into a no-lose bet. This invention from image recognition in 2015 is what gave the Transformer the nerve to stack dozens to hundreds of layers.</>,
          <><span className="q">Limits and costs.</span> The three-piece set itself does not "understand" anything — what they do is massive-scale statistics and transformations, and "knowing language" is a behavior that <b>emerges</b> once these mechanisms are stacked to sufficient scale (detailed in Lesson 12). Also, more blocks is not always better: double the layers, double the cost, yet the gains shrink — and this is exactly the battlefield where companies compete on "scaling efficiency."</>,
        ],
      },
    ],
    mechSourceNote: (
      <>
        Residual connections come from ResNet in image recognition, He et al. 2015{' '}
        <a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">
          Deep Residual Learning for Image Recognition
        </a>
        ; for the finding that "factual memory is mainly stored in the feed-forward networks," see Geva et al. 2021{' '}
        <a href="https://arxiv.org/abs/2012.14913" target="_blank" rel="noreferrer">
          Transformer Feed-Forward Layers Are Key-Value Memories
        </a>
        .
      </>
    ),
    punchTitle: '📖 Two knockout punches: how it rendered RNNs obsolete',
    punchLead: 'Academia is never short of new architectures; the Transformer swept everything not on cleverness but on two solid engineering advantages.',
    punchTh: ['Round', '🐢 RNN · serial note-passing', '⚡ Transformer · parallel round table'],
    punchRows: [
      ['Training speed', 'Must wait for the previous word to finish before computing the next; expensive GPUs spend most of their time as spectators', 'The whole sentence is computed at once, saturating the GPU\'s parallel compute — internet-scale corpora go from "untrainable" to "trainable to completion"'],
      ['Long-range dependencies', 'Information from word #1 must travel to word #1000, like a game of telephone, forgotten along the way', 'Word #1 and word #1000 talk directly through attention, with no decay no matter how far apart'],
      ['Each one\'s bill', 'Simple structure, memory-efficient inference, but the upsides end there', 'Attention\'s compute grows with the square of sentence length — this is the root of the limited "context window" in large models (Lesson 17)'],
    ],
    punchAfter: <>The first punch is especially fatal: the ticket into the large-model era is "training a huge network on massive data," and the RNN\'s serial nature simply bars it from this race. <b>It is not that RNNs are not smart enough, it is that they can\'t be fed enough.</b> The engineering advantage of "being feedable" eventually snowballed into a generational gap in intelligence — a script AI history replays over and over: winning by being compute-friendly, not by being ingenious.</>,
    demo2Title: '🎛️ Interactive · The autoregressive generator: make the model pop out characters yourself',
    demo2Lead: 'The pipeline only produces one token at a time. So where do ChatGPT\'s big paragraphs of answers come from? The answer: pick a character, append it to the sentence, run the new sentence through the pipeline again, then pick the next — jargon: "autoregressive." Run it yourself below: each button click = one full run of the pipeline. Watch how the probability distribution changes at every step (numbers are illustrative for teaching).',
    demo2After: <>Play to the end and you will discover something counterintuitive: at the moment it wrote 「好」, the model had no idea 「走走」 would appear later. <b>The whole sentence was stitched together from six mutually independent predictions</b> — ChatGPT popping out answers character by character is not a typewriter effect but its genuine working rhythm. This also explains why it occasionally "talks itself into a corner halfway through": each step is responsible only for the "next character," with no one supervising the whole text.</>,
    phenoTitle: '📖 Going deeper · The phenomena you have seen are all this, behind the scenes',
    phenoLead: 'This lesson is not some impractical skill — almost every "weird phenomenon" you bump into daily in ChatGPT and Claude traces back to the pipeline. Read it side by side, and only then have you truly learned the mechanism.',
    phenoTh: ['What you see in ChatGPT / Claude', 'The root in the pipeline'],
    phenoRows: [
      ['Answers pop out word by word, and longer answers take longer to wait for', 'Autoregressive: it predicts only one token at a time, then reruns the whole pipeline after appending it to the sentence. 100 characters = 100 full computations, so more characters means slower'],
      ['Chat too long and it starts "forgetting" the setup you mentioned at the start; the context window has a hard limit', 'In self-attention everyone talks to everyone, so compute explodes with the square of length — the window must have an upper limit; anything beyond is truncated, and the model genuinely "doesn\'t see" it (Lesson 17)'],
      ['Ask the same question twice and the answers differ', 'The pipeline\'s endpoint is a probability distribution, not a single answer; the reply is "dice-rolled" out of the distribution — how the dice are rolled and how "temperature" is tuned is covered in Lesson 14'],
      ['APIs bill per token, and the same meaning in Chinese is often "pricier" than in English', 'The pipeline\'s first stage is tokenization — the model\'s ledger is kept in tokens, and Chinese gets chopped into finer pieces in most vocabularies (Lesson 11)'],
      ['Tell it to "think step by step" and the answer gets noticeably smarter; reasoning models get more accurate the longer they "think"', 'Every extra character written is a fresh full run of the pipeline — the scratch paper is added compute. The full principle of "draft first, then answer" is in Lesson 23'],
    ],
    phenoAfter: <>Read in reverse, this table is also an "anti-hype guide": next time you see marketing like "our AI composes the whole piece before putting pen to paper," check it directly against the first row — as long as it is on the Transformer autoregressive route, it pops out one character at a time.</>,
    familyTitle: '📖 Two great families: BERT that reads, GPT that writes',
    familyLead: 'The Transformer in the original paper was an "encoder + decoder" pieced together from two halves, used for machine translation. Later researchers each took one half, splitting into two routes.',
    familyCards: [
      { label: 'Encoder route · 2018 · Google', en: <>BERT <b>understanding type</b></>, zh: <>Its training method is "fill-in-the-blank": mask a word in the sentence and let the model fill it back in by looking at the context on <b>both sides, bidirectionally</b>. It excels at understanding tasks — search relevance, text classification, sentiment judgment; Google Search once used it at scale to understand your queries.</> },
      { label: 'Decoder route · 2018 · OpenAI', en: <>GPT <b>generation type</b></>, zh: <>Its training method is "word chain": only allowed to look left, predicting the next token. It looks like it is "blind in one eye" compared with BERT, but <b>if it can play the chain it can write anything</b> — ChatGPT, Claude, Gemini; today\'s large models are basically all on this route.</> },
    ],
    familyMid: <>The entire divergence between the two routes boils down to one question: <b>when predicting a word, which side may it look at?</b> Click the words below to compare the two families\' "fields of view" with your own eyes.</>,
    familyAfter: <>Why did the generation type, "blind in one eye," have the last laugh? Because "predict the next word" forces the model to understand everything: to continue "the answer to this problem is" well, it has to actually be able to solve the problem. Once scale grows, understanding tasks can also be done directly by "generating an answer" — to have GPT judge a review\'s sentiment, just ask it "is this review positive or negative?" and it chains out "positive," and the classification is done. <b>One chain model handles both reading and writing</b>, whereas BERT can never write a long passage. The story of "scale works miracles" behind this gets its own treatment in Lesson 12 on pre-training.</>,
    familySourceNote: (
      <>
        The original papers of the two families: for BERT see Devlin et al. 2018{' '}
        <a href="https://arxiv.org/abs/1810.04805" target="_blank" rel="noreferrer">
          BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding
        </a>
        ; for GPT see Radford et al. 2018, "Improving Language Understanding by Generative Pre-Training" (OpenAI).
      </>
    ),
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'The Transformer is some AI product or some specific model',
        good: 'It is an architectural blueprint — like the "internal combustion engine" is to cars, with GPT, BERT, Claude, and Gemini being different models built from this drawing',
        why: <><b>Cause:</b> in the news "Transformer" always shows up alongside specific product names. Remember the three layers: the <b>architecture</b> is the design (Transformer), the <b>model</b> is the finished product trained from the drawing (GPT-4, Claude), and the <b>product</b> is the packaged service (ChatGPT). Saying "Transformer released a new version" is like saying "the internal combustion engine released a new car." By the way: the differences between models lie mainly in the number of blocks, the training data, and the tuning method, while the three-piece set in the engine bay is much the same.</>,
      },
      {
        bad: 'GPT has the whole sentence figured out when it answers; popping it out character by character is just a "typewriter animation"',
        good: 'It predicts only one token at a time, appends it to the sentence, then reruns the pipeline to predict the next — popping out character by character is its genuine working rhythm',
        why: <><b>Cause:</b> people often have a complete rough draft in mind before speaking, so they imagine AI works that way too. In reality GPT generates "autoregressively": when writing the 100th character, it does not itself know what the 101st will be — you already verified this hands-on with the generator above. Lesson 14\'s temperature sampling and Lesson 23\'s "draft first, then answer" are both built on this fact.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. The Transformer processes the whole sentence in parallel, so speed takes off — then how does it tell 「我打他」 apart from 「他打我」?',
        a: <>By <b>positional encoding</b>. Parallel processing itself has no sense of order, which is like turning the sentence into a bag of words. So during vectorization, each token gets a "position stamp" (1st, 2nd, ...), sending the word-order information that parallelism threw away into the pipeline along with the vector.</> },
      { q: '2. Of the three tasks below, which suits the BERT family better and which the GPT family? ① a search engine judging whether a web page is relevant to a query ② writing software helping you finish an email ③ a multi-turn conversation with a customer-service bot',
        a: <><b>① BERT, ② ③ GPT.</b> Judging relevance is an understanding task, and BERT, which can read the whole text bidirectionally, is the expert; continuation and conversation are both essentially "predict the next token," exactly the day job of the GPT route.</> },
      { q: '3. A friend complains: "I pasted a 300-page contract to the AI and it said I exceeded the length limit — such an advanced model can\'t even hold a single file?" Use this lesson\'s knowledge to "plead the model\'s case."',
        a: <>The root is <b>self-attention\'s "squared bill"</b>: at the round table everyone must talk to everyone, so doubling the text quadruples the compute. The attention cost for a 300-page contract is astronomical, so the context window must have an upper limit — this is not cutting corners but an inherent cost of the architecture. How to ease it (retrieval, summarization, chunking) is covered in Lesson 17.</> },
      { q: '4. An entrepreneur claims: "We trained a huge model with an RNN on an internet-scale corpus." Using this lesson\'s knowledge, what concern would you raise?',
        a: <>The biggest concern is <b>training speed</b>: an RNN must compute word by word serially, so the GPU\'s parallel compute goes unused and an internet-scale corpus simply cannot be fed in — exactly why everyone collectively switched to the Transformer back then. Next, the RNN\'s long-range dependencies also fail to hold up on long documents. Unless they have a genuine architectural innovation (in recent years there have indeed been new attempts to revive recurrent structures), it is worth pressing for details.</> },
    ],
    bridgeTitle: '➡️ How This Leads to Lesson 11',
    bridgeLead: 'With this, the four pillars of deep learning (networks / convolution / vectors / attention) come together into a complete engine — the Transformer. From the next lesson on, we enter the "large models" stage: how exactly is this engine trained into ChatGPT? The first step is to return to that bottom stage of the pipeline we glossed over — tokenization. In the model\'s eyes there are no "characters," only tokens; how it splits them, why Chinese costs more tokens, and why you\'re billed per token — the next lesson takes it all apart.',
    bridgeSteps: ['Engine assembled (Transformer)', 'Enter the large-models stage', 'First, the bottom stage: tokenization', 'Next: Tokens'],
  },
}

// ============================================================
// ① Transformer 流水线分层图
// ============================================================
const TF_ORDER = ['input', 'token', 'embed', 'block', 'softmax', 'predict']

function PipelineDemo({ c }) {
  const [key, setKey] = useState('input')
  const [walking, setWalking] = useState(false)
  const walkRef = useRef(null)
  const idxRef = useRef(0)
  const pulseRef = useRef(null)
  const reduced = reduceMotion()

  function stopWalk() {
    if (walkRef.current) clearInterval(walkRef.current)
    walkRef.current = null
    setWalking(false)
  }
  function startWalk() {
    idxRef.current = 0
    setKey(TF_ORDER[0])
    setWalking(true)
    walkRef.current = setInterval(() => {
      idxRef.current += 1
      if (idxRef.current >= TF_ORDER.length) { stopWalk(); return }
      setKey(TF_ORDER[idxRef.current])
    }, 2200)
  }
  const pick = (k) => { stopWalk(); setKey(k) }

  // 信号脉冲：一粒数据自下而上跑完流水线
  useEffect(() => {
    if (reduced) return
    const dot = pulseRef.current
    if (!dot) return
    const Y0 = 596, Y1 = 18, PERIOD = 5600
    let raf = 0
    const frame = (t) => {
      const p = (t % PERIOD) / PERIOD
      dot.setAttribute('cy', (Y0 + (Y1 - Y0) * p).toFixed(1))
      dot.setAttribute('opacity', p < 0.03 || p > 0.97 ? '0' : '0.9')
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  useEffect(() => () => { if (walkRef.current) clearInterval(walkRef.current) }, [])

  const cls = (k) => `tf-layer${k === key ? ' active' : ' dim'}`
  const d = c.tfData[key]
  const s = c.svg

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.pipeTitle}</span>
        <span className="demo-hint">{c.pipeHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tf-svg" viewBox="0 0 340 612" width="340" aria-label={c.pipeAria}>
            <defs>
              <marker id="tfarr" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0 0 L8 4 L0 8 Z" fill="var(--fg-2)" />
              </marker>
            </defs>
            <g stroke="var(--fg-2)" strokeWidth="1.5">
              <path d="M170 551 L170 538" markerEnd="url(#tfarr)" />
              <path d="M170 473 L170 461" markerEnd="url(#tfarr)" />
              <path d="M170 397 L170 383" markerEnd="url(#tfarr)" />
              <path d="M170 175 L170 161" markerEnd="url(#tfarr)" />
              <path d="M170 109 L170 95" markerEnd="url(#tfarr)" />
            </g>
            <g className={cls('predict')} onClick={() => pick('predict')}>
              <rect className="lr" x="36" y="12" width="268" height="78" rx="10" fill="var(--glass)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="170" y="33" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{s.predictTitle}</text>
              <rect x="46" y="44" width="88" height="32" rx="8" fill="var(--sage-bg)" stroke="var(--sage)" />
              <text x="90" y="64" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">好 58%</text>
              <rect x="142" y="44" width="80" height="32" rx="8" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="182" y="64" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">不错 21%</text>
              <rect x="230" y="44" width="64" height="32" rx="8" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="262" y="64" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">冷 9%</text>
            </g>
            <g className={cls('softmax')} onClick={() => pick('softmax')}>
              <rect className="lr" x="36" y="112" width="268" height="44" rx="9" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1.5" />
              <text x="170" y="130" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{s.softmaxTitle}</text>
              <text x="170" y="147" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">{s.softmaxSub}</text>
            </g>
            <g className={cls('block')} onClick={() => pick('block')}>
              <rect className="lr" x="36" y="178" width="268" height="200" rx="12" fill="var(--glass)" stroke="var(--sage)" strokeWidth="1.5" />
              <text x="50" y="199" fontSize="13" fontWeight="700" fill="var(--fg-0)">{s.blockTitle}</text>
              <rect x="254" y="184" width="40" height="20" rx="10" fill="var(--sage)" />
              <text x="274" y="198" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bg-0)">×N</text>
              <path d="M172 366 C 292 360, 292 292, 179 288" fill="none" stroke="var(--sage)" strokeWidth="1.3" strokeDasharray="4 3" />
              <path d="M178 283 C 292 276, 292 218, 179 212" fill="none" stroke="var(--sage)" strokeWidth="1.3" strokeDasharray="4 3" />
              <g stroke="var(--fg-2)" strokeWidth="1.5">
                <path d="M170 372 L170 356" markerEnd="url(#tfarr)" />
                <path d="M170 308 L170 270" markerEnd="url(#tfarr)" />
                <path d="M170 222 L170 182" />
              </g>
              <circle cx="170" cy="286" r="7" fill="var(--bg-card)" stroke="var(--sage)" strokeWidth="1.3" />
              <text x="170" y="290" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--sage)">+</text>
              <circle cx="170" cy="211" r="7" fill="var(--bg-card)" stroke="var(--sage)" strokeWidth="1.3" />
              <text x="170" y="215" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--sage)">+</text>
              <text x="156" y="290" textAnchor="end" fontSize="9.5" fill="var(--sage)">{s.residual}</text>
              <rect x="80" y="222" width="180" height="42" rx="8" fill="var(--amber-bg)" stroke="var(--amber)" />
              <text x="170" y="240" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">{s.ffnTitle}</text>
              <text x="170" y="255" textAnchor="middle" fontSize="10" fill="var(--fg-1)">{s.ffnSub}</text>
              <rect x="80" y="308" width="180" height="42" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" />
              <text x="170" y="326" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">{s.attnTitle}</text>
              <text x="170" y="341" textAnchor="middle" fontSize="10" fill="var(--fg-1)">{s.attnSub}</text>
            </g>
            <g className={cls('embed')} onClick={() => pick('embed')}>
              <rect className="lr" x="36" y="400" width="268" height="56" rx="9" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="170" y="419" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{s.embedTitle}</text>
              <text x="170" y="435" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">{s.embedSub1}</text>
              <text x="170" y="449" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">{s.embedSub2}</text>
            </g>
            <g className={cls('token')} onClick={() => pick('token')}>
              <rect className="lr" x="36" y="476" width="268" height="54" rx="9" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1.5" />
              <text x="170" y="494" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{s.tokenTitle}</text>
              <rect x="86" y="501" width="52" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="112" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">今天</text>
              <rect x="152" y="501" width="52" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="178" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">天气</text>
              <rect x="218" y="501" width="36" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="236" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">真</text>
            </g>
            <g className={cls('input')} onClick={() => pick('input')}>
              <rect className="lr" x="36" y="554" width="268" height="46" rx="9" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="170" y="572" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{s.inputTitle}</text>
              <text x="170" y="589" textAnchor="middle" fontSize="11" fill="var(--fg-1)">{s.inputSub}</text>
            </g>
            {!reduced && <circle ref={pulseRef} cx="170" cy="596" r="4" fill="var(--terracotta)" opacity="0" />}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.pipeChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => pick(k)}>{label}</button>
            ))}
          </div>
          {!reduced && (
            <div className="chips" style={{ marginTop: 8 }}>
              <button className={`chip${walking ? ' active' : ''}`} onClick={() => (walking ? stopWalk() : startWalk())}>{walking ? c.walkPause : c.walkPlay}</button>
            </div>
          )}
          <h4 style={{ marginTop: 14 }}>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 自回归生成器
// ============================================================
// 演示 token 与概率一一对应，保持中文不译；讲解性的 note 走 C[lang]。
const PROMPT = ['今天', '天气', '真']
const GEN_PICKS = ['好', '，', '适合', '出去', '走走', '。']
const GEN_CANDS = [
  [['好', 58], ['不错', 21], ['冷', 9], ['热', 5], ['差', 3]],
  [['，', 46], ['啊', 22], ['。', 14], ['！', 9], ['呀', 4]],
  [['适合', 34], ['我们', 19], ['阳光', 14], ['出去', 11], ['心情', 8]],
  [['出去', 42], ['散步', 17], ['晒太阳', 13], ['出门', 11], ['郊游', 6]],
  [['走走', 47], ['玩', 24], ['散步', 12], ['逛逛', 7], ['透气', 4]],
  [['。', 61], ['！', 15], ['，', 11], ['吧', 7], ['呀', 3]],
]
const GEN_LEN = GEN_PICKS.length

function GenDemo({ c }) {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const autoRef = useRef(null)
  const stepRef = useRef(0)
  stepRef.current = step
  const reduced = reduceMotion()

  function stopAuto() {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = null
    setAuto(false)
  }
  function startAuto() {
    if (stepRef.current >= GEN_LEN) return
    setAuto(true)
    setStep((s) => Math.min(GEN_LEN, s + 1))
    autoRef.current = setInterval(() => {
      if (stepRef.current >= GEN_LEN) { stopAuto(); return }
      setStep((s) => Math.min(GEN_LEN, s + 1))
    }, 1400)
  }
  const next = () => { stopAuto(); setStep((s) => Math.min(GEN_LEN, s + 1)) }
  const reset = () => { stopAuto(); setStep(0) }

  useEffect(() => {
    if (reduced) setStep(GEN_LEN)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [])

  const done = step >= GEN_LEN
  const cur = step > 0
    ? { pick: GEN_PICKS[step - 1], cands: GEN_CANDS[step - 1], note: c.genSteps[step - 1].note }
    : null

  // 右侧文案
  let side
  if (step === 0) side = c.genSide0
  else if (done) side = c.genSideDone
  else side = { title: c.genStepTitle(step, cur.pick), period: c.genStepPeriod(step), desc: cur.note, tags: [c.genStepTag] }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.genTitle}</span>
        <span className="demo-hint">{c.genHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage stage-col">
          <div className="gen-sent" aria-live="polite">
            {PROMPT.map((t, i) => <span key={'p' + i} className="gtoken">{t}</span>)}
            {GEN_PICKS.slice(0, step).map((p, i) => (
              <span key={'g' + i} className={`gtoken gen${i === step - 1 ? ' latest' : ''}`}>{p}</span>
            ))}
            {!done && <span className="gcursor">▌</span>}
          </div>
          <div className="gen-bars">
            {cur ? cur.cands.map((cand, i) => {
              const picked = cand[0] === cur.pick
              return (
                <div key={i} className={`gbar${picked ? ' pick' : ''}`}>
                  <span className="gtok">{cand[0]}</span>
                  <div className="gtrack"><div className="gfill" style={{ width: cand[1] + '%' }} /></div>
                  <span className="gpct">{cand[1]}%{picked ? ' ✓' : ''}</span>
                </div>
              )
            }) : <p className="ghint">{c.genHintBars}</p>}
          </div>
          <div className="gen-ctrl">
            <button className="chip" disabled={done} onClick={next}>{c.genNext}</button>
            {!reduced && <button className={`chip${auto ? ' active' : ''}`} disabled={done} onClick={() => (auto ? stopAuto() : startAuto())}>{auto ? c.genAutoPause : c.genAutoPlay}</button>}
            <button className="chip" onClick={reset}>{c.genReset}</button>
          </div>
        </div>
        <div className="demo-side">
          <h4>{side.title}</h4>
          <div className="period">{side.period}</div>
          <p>{side.desc}</p>
          <div className="tags">{side.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③ BERT / GPT 视野对比
// ============================================================
// 演示句子保留中文不译（每个 token 是可点击的演示数据）。
const SCOPE_WORDS = ['猫', '把', '鱼', '叼', '回', '了', '窝', '里']

function ScopeDemo({ c }) {
  const [mode, setMode] = useState('bert')
  const [pos, setPos] = useState(2)
  const w = SCOPE_WORDS[pos]

  const side = mode === 'bert'
    ? c.scopeBert(pos, w, SCOPE_WORDS.length)
    : c.scopeGpt(pos, w, SCOPE_WORDS.length)

  const tokClass = (i) => {
    if (i === pos) return 'stok cur'
    if (mode === 'bert') return 'stok vis'
    return i < pos ? 'stok vis' : 'stok blind'
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.scopeTitle}</span>
        <span className="demo-hint">{c.scopeHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage stage-col">
          <div className="chips" style={{ justifyContent: 'center' }}>
            {c.scopeModes.map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <div className="scope-row" aria-label={c.scopeAria}>
            {SCOPE_WORDS.map((word, i) => (
              <button key={i} className={tokClass(i)} onClick={() => setPos(i)}>{i === pos ? '？' : word}</button>
            ))}
          </div>
          <div className="scope-legend">
            <span><span className="sw" style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)' }} />{c.scopeLegend.see}</span>
            <span><span className="sw" style={{ background: 'var(--terracotta-bg)', border: '1px dashed var(--terracotta)' }} />{c.scopeLegend.predicting}</span>
            <span><span className="sw" style={{ background: 'var(--bg-inset)', border: '1px solid var(--hairline-strong)', opacity: 0.4 }} />{c.scopeLegend.blind}</span>
          </div>
        </div>
        <div className="demo-side">
          <h4>{side.title}</h4>
          <div className="period">{side.period}</div>
          <p>{side.desc}</p>
          <div className="tags">{side.tags.map(([t, label], i) => <Pill key={i} type={t}>{label}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L10() {
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

      <Lsec title={c.conceptTitle} lead={c.conceptLead}>
        <div className="contrast">
          <div className="card contrast-card">
            <span className="tag pill pill-terracotta">{c.contrastBefore}</span>
            <div className="big">{c.contrastBeforeBig}</div>
            <p className="note">{c.contrastBeforeNote}</p>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">{c.contrastAfter}</span>
            <div className="big">{c.contrastAfterBig}</div>
            <p className="note">{c.contrastAfterNote}</p>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.fourStepLead}</p>
        <div className="use-grid cols-4">
          {c.fourSteps.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.conceptSourceNote}</p>
      </Lsec>

      <Lsec title={c.demo1Title} lead={c.demo1Lead}>
        <PipelineDemo c={c} />
      </Lsec>

      <Lsec title={c.mechTitle} lead={c.mechLead}>
        <div className="card row-list">
          {c.mechs.map((m, i) => (
            <div className="mech" key={i}>
              <div className="mech-head"><span className={`pill pill-${m.pill.type}`}>{m.pill.text}</span><span className="mech-name">{m.name}</span></div>
              {m.ps.map((p, j) => <p key={j}>{p}</p>)}
            </div>
          ))}
        </div>
        <p className="footnote source-note">{c.mechSourceNote}</p>
      </Lsec>

      <Lsec title={c.punchTitle} lead={c.punchLead}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>{c.punchTh[0]}</th><th>{c.punchTh[1]}</th><th>{c.punchTh[2]}</th></tr></thead>
            <tbody>
              {c.punchRows.map((row, i) => (
                <tr key={i}><td className="be">{row[0]}</td><td className="ex">{row[1]}</td><td className="ex">{row[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 14 }}>{c.punchAfter}</p>
      </Lsec>

      <Lsec title={c.demo2Title} lead={c.demo2Lead}>
        <GenDemo c={c} />
        <p className="lead" style={{ marginTop: 14 }}>{c.demo2After}</p>
      </Lsec>

      <Lsec title={c.phenoTitle} lead={c.phenoLead}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match map">
            <thead><tr><th>{c.phenoTh[0]}</th><th>{c.phenoTh[1]}</th></tr></thead>
            <tbody>
              {c.phenoRows.map((row, i) => (
                <tr key={i}><td>{row[0]}</td><td className="ex">{row[1]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 14 }}>{c.phenoAfter}</p>
      </Lsec>

      <Lsec title={c.familyTitle} lead={c.familyLead}>
        <div className="use-grid cols-2">
          {c.familyCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.en}</div>
              <div className="zh">{u.zh}</div>
            </div>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.familyMid}</p>
        <ScopeDemo c={c} />
        <p className="lead" style={{ marginTop: 14 }}>{c.familyAfter}</p>
        <p className="footnote source-note">{c.familySourceNote}</p>
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
