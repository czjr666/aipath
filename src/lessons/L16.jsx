import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// 双语内容层：结构 / class / 交互 / 数值 / SVG 几何均不变，仅可见文本按语言取用。
// 富文本（含内联 JSX）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
// 演示数据（STYLES.preview / SU_TURNS.t / 量子计算续写片段等）属讲解性演示文本，随语言翻译。
// ============================================================
const C = {
  zh: {
    // ① 续写区"圈地机"
    styles: [
      { key: 'wiki', label: '百科条目式', base: 34, preview: '「量子计算是一种利用量子力学原理进行信息处理的计算范式，其基本单元为量子比特……」' },
      { key: 'paper', label: '学术综述式', base: 20, preview: '「近年来，随着量子比特相干时间的延长与纠错码的进展，含噪中等规模量子（NISQ）器件……」' },
      { key: 'pop', label: '高中科普式', base: 15, preview: '「想象一枚还在空中旋转的硬币 —— 它既不是正面也不是反面，而是两种可能同时存在……」' },
      { key: 'forum', label: '论坛抖机灵式', base: 17, preview: '「简单说：就是快，快得离谱。具体多快？反正你家 Wi-Fi 密码顶不住。懂？」' },
      { key: 'hype', label: '营销热文式', base: 14, preview: '「量子计算！下一个十年最大的风口！现在看懂的人，相当于 1999 年就看懂了互联网……」' },
    ],
    ingMech: {
      role: '「科普专栏作者」六个字，把分布从“全网平均”拽向训练数据里科普作者笔下的那片文本区 —— 百科腔和论文腔应声下跌。',
      aud: '受众词决定“写给谁看”：「没学过物理的高中生」一出现，多比喻、少术语的文本区被抬高，学术综述几乎出局。',
      fmt: '格式约束是上下文里的硬锚点：「不出现公式」直接封死论文区的路，「300 字以内」剪掉长篇百科的尾巴。',
      bnd: '边界句给“不吹”留出路：营销热文区靠夸大为生，这句话一出，它的概率被压到地板 —— 这正是技法⑤降幻觉的原理。',
    },
    defaultStatus: '不加任何条件时，“百科条目式”是最安全的延续 —— 这就是答案“又水又泛”的来源：不是模型不行，是续写范围太宽，它只能取平均。',
    prRows: [['role', '＋ 你是科普专栏作者，', 73], ['aud', '＋ 讲给完全没学过物理的高中生听：', 94], ['fmt', '＋ 多用比喻，不出现公式，300 字以内。', 115], ['bnd', '＋ 拿不准的进展直说“尚无定论”，不要夸大。', 136]],
    zonePanelTitle: '🎛️ 交互演示 · 续写区“圈地机”',
    zonePanelHint: '点右侧配料增删 · 左图分布实时联动',
    zoneSvgAria: '交互图：当前 prompt 与五种续写文体的概率条',
    zonePromptHead: '你写下的 prompt（灰色 = 还没加上）',
    zonePromptFirst: '解释一下量子计算。',
    zoneNextHead: '接下来最可能续写成 ——',
    zoneRangeLabel: '续写范围',
    statusAll4: ' 四味配料齐活：续写范围收成一条窄缝，输出基本“指哪打哪” —— 剩下的随机性，交给第 14 课的温度。',
    statusRemoved: '撤掉一味配料，分布立刻弹回去 —— prompt 里每个字都在给续写“投票”，字没了，票就没了。',
    gaugeWide: '宽 · 全网平均',
    gaugeNarrowing: '收窄中',
    gaugeNarrow: '窄 · 指哪打哪',
    zoneChips: [['role', '① 角色'], ['aud', '② 受众'], ['fmt', '③ 格式'], ['bnd', '④ 边界']],
    zoneResetLabel: '↺ 全部撤掉',
    zoneTopPrefix: '续写头名：',
    zoneTopMeta: (pct, count) => `概率约 ${pct}% · 已加 ${count} / 4 味配料`,

    // ② 约束放 user 还是 system
    suTurns: [
      { u: '《Rust 入门》这本多少钱？', user: { t: '定价 79 元，本周新课首发 5 折，39.5 元。需要帮你下单吗？', n: 2 }, sys: { t: '定价 79 元，本周新课首发 5 折，39.5 元。需要帮你下单吗？', n: 2 } },
      { u: '顺便聊聊，你觉得 Rust 难学吗？', user: { t: 'Rust 的学习曲线确实偏陡。不过理解所有权之后就会顺很多。我们的课程是专为零基础设计的。建议你先试试免费的第一章。', n: 4 }, sys: { t: '上手有门槛，但课程从所有权讲起，零基础能跟上。先试试免费的第一章？', n: 2 } },
      { u: '帮我推荐 5 本进阶书，每本都详细介绍一下。', user: { t: '好的！第一本《Rust 程序设计语言》是官方教程，从变量讲到并发，适合系统过一遍。第二本《Rust for Rustaceans》面向进阶开发者……第三本……第四本……（一口气讲了 9 句）', n: 9 }, sys: { t: '篇幅所限挑 3 本最值得的：官方书打底、《Rust for Rustaceans》进阶、《Programming Rust》当工具书。想要更细的对比再告诉我。', n: 2 } },
      { u: '对了，买了能退吗？', user: { t: '当然可以退款！我们的政策是：开课 7 天内可无理由退款。超过 7 天但未学完第二章也可以协商。另外结课后还有奖学金返现活动。具体规则是这样的……', n: 5 }, sys: { t: '可以，开课 7 天内未学完第二章可全额退。在订单页点“申请退款”即可。', n: 2 } },
    ],
    suExpl: {
      user: ['第 1 轮：约束就在眼前，模型乖乖 2 句答完。目前看不出差别 —— 差别在后面。', '第 2 轮：新话题一展开，“3 句”的票数开始被稀释 —— 已经悄悄多出一句了。', '第 3 轮：约束被压在三轮对话底下，「逐本介绍 5 本」这种强势续写直接把它淹了：9 句。', '第 4 轮：彻底忘了。user 里的约束只是众多历史消息之一，越聊越往后排，影响力被新内容一轮轮稀释。'],
      sys: ['第 1 轮：同样 2 句 —— 但原因不同：这次是“人物小传”在压阵。', '第 2 轮：话题展开，依然不超过 3 句。system 不随对话滚动，永远排在最前面。', '第 3 轮：面对「逐本介绍 5 本」的强势请求，它选择只挑 3 本 —— 对齐训练教过它：system 的规矩优先于 user 的要求。', '第 4 轮：全程没破功。全局约束放 system，靠的不是玄学，是“位置固定 + 指令层级训练”的双保险。'],
    },
    suBadgeUnit: ' 句',
    suPanelTitle: '🎛️ 交互演示 · 约束放哪才“管用”',
    suPanelHint: '切换约束位置 · 点「再聊一轮」步进对比',
    suChatAria: '模拟对话记录',
    suSysText: '你是“云帆书店”客服助手，友好简洁，每次回答不超过 3 句。',
    suUserText: '记住：接下来每次回答都不要超过 3 句。',
    suChips: [['user', '约束写进 user'], ['sys', '约束写进 system']],
    suStepHead: (step, total) => `第 ${step} 轮 / 共 ${total} 轮`,
    suWhereSys: '约束的位置：system · 不随对话滚动，永远压在每次续写上',
    suWhereUser: (step) => `约束的位置：user 历史第 1 条 · 已被压在 ${step} 轮对话之下`,
    suNextDone: '聊完了 · 换个位置再试',
    suNextMore: '▸ 再聊一轮',
    suReset: '↺ 重新开始',

    ruler: [
      { q: '「答对了给你 100 美元小费，答得好还有奖金」', pill: { type: 'terracotta', text: '玄学 · 偏方' }, why: '模型没有账户，只有分布。这句话没增加任何关于任务的信息，蹭到的统计相关性弱且不稳 —— 换个模型、换轮训练就失灵。' },
      { q: '「你是有 20 年经验的儿科医生，面对一位焦虑的新手妈妈」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法①：角色 + 受众两个词，把续写分布对齐到“儿科医生安抚家长”的文本区 —— 口吻、详略、术语密度全跟着换。' },
      { q: '「深呼吸，一步一步慢慢来」', pill: { type: 'amber', text: '一半一半' }, why: '“深呼吸”对没有肺的模型毫无意义，纯属玄学；“一步一步来”却实打实激活思维链（技法③）。那个著名的“深呼吸提示词”实验有效，功劳多半在后半句。' },
      { q: '「资料里没提的就直说"没提"，不要编」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法⑤：训练数据里“中途承认不会”的下文极少，这句话把“说不知道”这条低概率出路明确抬起来，幻觉率实打实下降。' },
      { q: '「答错了我会丢掉工作，求求你认真一点」', pill: { type: 'terracotta', text: '玄学 · 偏方' }, why: '情绪施压没有信息增量 —— “认真”到底指什么，模型无从知晓。不如把它翻译成具体要求：检查哪几项、按什么格式、漏了怎么办。' },
      { q: '「给你两个我满意的范例，照这个风格来」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法②（few-shot）：范例在上下文里划出一片窄分布，模式延续是模型最强的本事 —— 连你说不清的“feel”都能学走。' },
    ],

    goalsTitle: '🎯 你将学会',
    goals: [
      '一句话说清 prompt 的本质：给“文字接龙”设定续写条件 —— 从此能自己鉴别任何提示技巧是工程还是玄学',
      '掌握五大技法：设角色受众、给示例、给步骤、定格式、划边界 —— 每一招都知道它为什么有效',
      '分清 system 和 user 两类提示词：全局约束放哪、为什么放那里更“管用”',
      '会写结构化长 prompt（信息分区 + 重点放两头），并能亲手把「帮我写点东西」改造成能直接交付的好 prompt',
    ],

    conceptTitle: '💡 核心概念：你打出的每个字，都在给 AI 划“续写区”',
    conceptLead: '网上流传着无数“ChatGPT 神级咒语大全”，仿佛和 AI 对话靠的是背口诀。先把底牌亮出来：第 12 课你已经知道，大模型唯一会做的事是接着前文往下接龙 —— 每生成一个 token 之前，它都要对词表里几万个候选算一遍概率（第 14 课）。那么 prompt 是什么？它不是“命令”，而是接龙的前文。你写下的每一个字，都在改变“接下来最可能出现什么”的概率表。',
    contrastTag1: '直觉印象',
    contrastBig1: <>prompt 是下给 AI 的命令 <span className="gap">→</span> 措辞够“讨喜”，它就愿意好好干</>,
    contrastNote1: '按这个理解，提示工程就是揣摩 AI 的“心情”，自然会滑向收集咒语、迷信话术。',
    contrastTag2: '真实机制',
    contrastBig2: <>prompt 是续写的条件 <span className="gap">→</span> 每个字都把后文分布<span className="hl">推向某片训练数据区</span></>,
    contrastNote2: '提示工程 = 用文字给模型“圈地”：把它的续写范围从“全网平均”收窄到你想要的那片文本区域。',
    conceptLead2: '用这个视角看一个你大概率用过的技巧：',
    exampleEn1: <>「假装你是一位<span className="hl">资深合同律师</span>，帮我审一下这份租房合同。」—— 为什么这一句立刻让回答变专业？</>,
    exampleZh1: <>不是模型“入戏了”这种魔法。训练数据里，“资深律师”这个词周围聚集着海量法律文本：合同条款、法律意见书、风险提示。这句话一出，后续 token 的概率分布就<b>对齐到那片区域</b> —— 措辞变严谨、主动逐条找风险、引用条款编号，全是那片文本区的统计特征。角色扮演有效，原理就这么朴素。</>,
    conceptLead3: <>光看例子不过瘾，亲手“圈”一次。同一个问题「解释一下量子计算」，右侧四味配料随意增删，左图实时显示两件事：模型接下来<b>最可能续写成哪种文体</b>，以及续写范围被收得多窄。建议玩法：先全关，看“全网平均”长什么样；再一味一味加上去；最后随手撤掉一味 —— 看分布立刻弹回去。</>,
    conceptLead4: '把你平时在 ChatGPT / Claude 里见过的现象，和这条机制连上线：',
    matchHead1: '你在对话里看到的现象',
    matchHead2: '背后的机制',
    matchRows: [
      { phen: <b>同一个问题，加一句“你是儿科医生”，答案立刻变专业</b>, mech: '角色词把续写分布推向训练数据中“医生文本”的区域' },
      { phen: <b>问题写得含糊，答案也跟着又水又泛</b>, mech: '含糊前文对应“什么都能接”的宽分布，输出只能取平均 —— 套话是最安全的延续' },
      { phen: <b>给了一两个范例，输出风格和格式立刻整齐</b>, mech: '范例在上下文里划出一片窄分布，“照着范例续写”是概率最高的路径' },
      { phen: <b>用中文问编程问题，回答里总夹着英文术语</b>, mech: '训练数据里编程讨论以英文为主，那片区域的统计特征跟着渗了出来' },
    ],
    conceptLead5: <>理解到这一层，你手里就有了一把<b>万能检验尺</b>：以后再看到任何“提示词技巧”，先问一句 —— <b>它有没有把分布推向我想要的区域？</b>讲得通，才值得收藏；讲不通，多半是时灵时不灵的偏方。还有一个细节先埋下：prompt 不只是你刚打的那行字，<b>整个对话历史（包括模型自己之前的回答）都是续写条件</b> —— 这件事的代价和边界，第 17 课讲上下文窗口时算总账。</>,

    fiveTitle: '📖 五大技法：每一招都讲得通，才招招稳定',
    fiveLead: '这五招覆盖日常九成的场景。每招给你三样东西：一个反例、一个正例、一句“为什么有效”。注意一个共同点：正例里没有任何花哨措辞，全是朴素的信息增量 —— 你是谁、给谁看、长什么样、什么不能做。改变信息而不是改变语气，这正是工程和玄学的分界线。',
    fiveItems: [
      {
        bad: '「解释一下量子计算。」',
        good: '「你是科普专栏作者，向完全没学过物理的高中生解释量子计算：多用比喻，不出现公式，800 字以内。」',
        why: <><b>技法 ① 设定角色与受众。</b>角色定“谁在写”（口吻、用词、知识深度），受众定“写给谁”（详略、比喻多少）。两头都不说，模型只能落在“百科条目式平均答案”上 —— 那是分布最宽、最平庸的位置。</>,
      },
      {
        bad: '「帮商品起名，要高级感但不浮夸、朗朗上口、有记忆点、最好带点东方意境……」（形容词堆到第十个，输出依然各凭运气）',
        good: '「帮商品起名。参考两个我满意的：山茶序（护手霜）、栖云盏（香薰蜡烛）。现在给一款檀香木梳起 3 个名字。」',
        why: <><b>技法 ② 给示例（few-shot）。</b>与其描述要求，不如给两个范本：形容词人人理解不同，范例没有歧义。模型最强的本事恰恰是<b>模式延续</b> —— 上文出现几个风格一致的“输入 → 输出”对，续写时它会自动沿用同一套隐含规则。这叫 few-shot / 上下文内学习，是 GPT-3 论文最重要的发现之一。</>,
      },
      {
        bad: '「这道行程应用题，直接告诉我答案。」',
        good: '「请一步步思考：先列出已知条件，再写计算过程，最后单独一行给出答案。」',
        why: <><b>技法 ③ 给步骤（激活思维链）。</b>第 15 课见过多步推理“走钢丝”：一步踩空，满盘皆输。让模型把中间步骤写出来，后面的 token 就是在“已写出的前几步”这个条件下生成的 —— 相当于把心算变笔算。这就是思维链（CoT）。第 23 课的推理模型干脆把“先打草稿”训练成了默认动作。</>,
      },
      {
        bad: '「把这些信息整理成结构化数据给我。」',
        good: <>「严格按这个格式输出，不要输出其他内容：{`{"name": "商品名", "price": 数字, "tags": ["标签"]}`}」</>,
        why: <><b>技法 ④ 定格式（要 JSON 就给 JSON 模板）。</b>“结构化”有一万种长法：表格？列表？字段叫什么？分布太宽，输出就随机。模板是上下文里最强的锚点。当输出要交给程序处理时（第 19 课工具调用、第 26 课写代码），这招从“加分项”变成“必需品”。</>,
      },
      {
        bad: '「我们公司 2025 年 Q3 的退货率是多少？」（模型不知道，也会一本正经编一个）',
        good: '「根据我贴的这份报表回答；如果报表里没有这个数字，直接回答"报表中未提供"，不要估算。」',
        why: <><b>技法 ⑤ 划边界（给“不知道”留一条出路）。</b>训练数据里，流畅自信的下文远多于“中途承认不会” —— 你不开口子，“说不知道”这条路在分布里几乎不存在，模型只能硬编（幻觉的重要来源，第 29 课细讲）。明确许可“承认不确定”，等于把这条出路的概率抬起来，幻觉率显著下降。</>,
      },
    ],

    sysTitle: '📖 system 提示词：导演递给演员的人物小传',
    sysLead: '打开任何一个大模型 API（第 26 课你会亲手调），你会发现发给模型的消息分成三种角色：system、user、assistant。一个比喻就够了：这是一出戏 —— system 是开拍前导演递给演员的人物小传（你是谁、什么性格、哪些事绝不能做），user 是开拍后观众递上来的一句句台词。',
    sysCards: [
      { label: '幕后 · 整场有效', en: <>system：<b>人物小传</b></>, zh: <>放<b>全局行为约束</b>：身份与口吻、做事准则、安全红线、固定的输出格式。先入为主、压在每一次续写上，普通用户通常看不见它。</> },
      { label: '台前 · 随对话流动', en: <>user：<b>台词</b></>, zh: <>放<b>当前这一件事</b>：具体问题、材料、临时要求。每一轮都在变，跟着对话往前滚动。</> },
    ],
    sysLead2: '看一段真实风格的人物小传：',
    sysExampleEn: <>system：「你是‘云帆书店’的客服助手。只回答与本店订单、配送、退换货相关的问题；语气友好简洁，每次回答不超过 3 句；查不到订单时引导用户提供订单号，<span className="hl">绝不编造物流信息</span>。」</>,
    sysExampleZh: <>之后用户无论怎么聊，这些约束都压在每一次续写上。你在各种产品里见过的“人设”：客服、毒舌影评人、苏格拉底式导师，本质都是一段你看不见的 system prompt。ChatGPT 的“自定义指令”、Claude 的项目设定，填的也是这个字段。</>,
    sysLead3: <>为什么全局约束放 system 比塞进 user 里更“管用”？两个原因。其一是位置：system 永远排在对话最前面，整场不动。其二更关键 —— <b>训练使然</b>：第 13 课的对齐阶段，模型被专门调教成按“system 要求优先于 user 要求”的层级行事（厂商管这叫指令层级）。所以同一句“回答不超过 3 句”，写在 user 里聊几轮就可能被冲淡，写在 system 里要稳得多。</>,
    sysLead4: '空口无凭，做个对照实验：同一条约束「每次回答不超过 3 句」，一次写进 user 的第一句话，一次写进 system，然后往下多聊几轮 —— 看哪边先失效：',

    longTitle: '🧱 长 prompt 结构化：把提示词当文档写，而不是当聊天发',
    longLead: '任务一复杂，prompt 就会长到几百上千字：背景、要求、材料、范例搅成一锅粥。这时最常见的失败不是“模型不会”，而是“模型没注意到” —— 你明明写了“别超过 100 字”，它就是当没看见。两条结构原则，治的就是这个病：',
    longCards: [
      { label: '原则一', en: <>信息<b>分区</b></>, zh: <>背景 / 任务 / 约束 / 示例各立门户，用小标题或分隔线隔开。结构清晰的前文对应训练数据里说明书、需求文档那片“高质量后文”区域；分区也让模型生成时更容易“回头对照”相应区块（注意力的拿手活，第 9 课）。</> },
      { label: '原则二', en: <>重点放<b>两头</b></>, zh: <>对很长的上下文，模型对<b>中间部分</b>的内容利用得最差 —— 研究者称之为 lost in the middle（第 17 课拆它的机制）。所以关键约束开头定调、结尾重申，别埋在第三段中间等着被“看丢”。</> },
    ],
    longLead2: '两条原则合起来，一个像样的长 prompt 长这样：',
    docPrompt: {
      secBackground: '【背景】', textBackground: '我们是面向程序员的在线教育公司，下周发布新课《Rust 入门》。',
      secTask: '【任务】', textTask: '写 3 条课程预告文案，发在技术社区。',
      secConstraint: '【约束】', textConstraint: '每条不超过 60 字；语气专业、克制；不出现“家人们”等口水词；不承诺“轻松速成”。',
      secExample: '【示例】', textExample: '上次效果最好的一条：「指针让你头疼了十年？Rust 用所有权换你一夜安眠。新课上线，首周 5 折。」',
      secEmphasis: '【再次强调】', textEmphasis: '只输出 3 条文案本身，不要解释。',
    },
    longFootnote: '注意最后一行 —— 把最在乎的要求在结尾重申一遍，这就是“重点放两头”。这份模板眼熟吗？它就是把五大技法装进了一个有秩序的容器里。',

    practiceTitle: '🛠️ 实战改造：从「帮我写点东西」到能直接交付',
    practiceLead: '把全课串起来。真实场景：你帮一家咖啡馆运营公众号，想让 AI 写新品推送。看一个烂 prompt 如何四步进化 —— 每一步只用本课讲过的技法，没有一句咒语。',
    steps: [
      {
        pillType: 'terracotta', pillText: '第 0 版 · 碰运气', name: '什么条件都没给',
        en: <>「帮我写点东西。」</>,
        verdict: <><b>输出质量：</b>一篇不知道给谁看的通用小作文。分布全开 —— 写什么、给谁、多长，全靠模型猜，它只能交出“全网平均水平”的安全答案。<b>这不是模型不行，是你什么续写条件都没设。</b></>,
      },
      {
        pillType: 'amber', pillText: '第 1 版 · 技法①', name: '加角色与受众',
        en: <>「<span className="hl">你是一家社区咖啡馆的主理人。给常来的老顾客</span>写一条微信推送，介绍下周一上新的桂花拿铁。」</>,
        verdict: <><b>输出质量：</b>口吻和对象立住了 —— 开始有“街坊熟客”的亲近感，还会自然带出“秋天第一杯”这类应景表达。但长度忽长忽短、重点忽左忽右：<b>你还没示范“好”长什么样。</b></>,
      },
      {
        pillType: 'sky', pillText: '第 2 版 · 技法②④', name: '加示例与格式',
        en: <>前文 + 「<span className="hl">参考这条上次反响最好的推送：『天冷了，焦糖云朵降落本店☁️ 老位置给你留着。』格式：第一行 8 字以内标题，正文不超过 80 字，结尾一个 emoji。</span>」</>,
        verdict: <><b>输出质量：</b>有了范本和模板，文风与结构一次到位，八成可以直接发。剩下两个小毛病：偶尔<b>编造不存在的优惠</b>，而且每次只给一个版本，不合心意就得重抽。</>,
      },
      {
        pillType: 'sage', pillText: '第 3 版 · 技法⑤', name: '加边界与评判标准',
        en: <>前文 + 「<span className="hl">只提我给的信息，没提的优惠活动不要编。给 3 个备选，每条后面用一句话注明主打角度（怀旧 / 限时 / 口感），方便我选。</span>」</>,
        verdict: <><b>输出质量：</b>「不要编」封掉幻觉出口；「3 个备选 + 注明角度」把<b>挑选成本</b>也交给了模型 —— 从“能用”升级到“好选”。回看全程：增加的全是<b>信息</b>。这就是提示工程的全部秘密 —— <b>模型的能力一直都在，prompt 决定它发挥出几成。</b></>,
      },
    ],

    rulerTitle: '🧪 检验尺上手：工程还是玄学？',
    rulerLead: '开课时发的那把检验尺，现在拿出来用：下面 6 条网上流传的提示技巧，先自己判断 —— 它有没有把分布推向想要的区域？有没有增加真实的信息？想好了再点卡片对答案。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '“给你 100 美元小费”“深呼吸再回答”这类网传咒语是提示工程的精髓，照抄就灵',
        good: '能从分布角度讲通的技巧才稳定；讲不通的偏方时灵时不灵，换个模型、换个版本就失效',
        why: <><b>病因：</b>把个例当规律。这类偏方多半源于某人某次测试的截图，效应弱、不同模型表现两极。五大技法之所以跨模型稳定，是因为它们改变的是<b>信息本身</b>（角色、范例、步骤、格式、边界），而不是玄学措辞。拿出那把检验尺：讲不通分布的，别收藏。</>,
      },
      {
        bad: '只要 prompt 写得够好，模型什么问题都能答对',
        good: 'prompt 只能引导分布，不能注入模型没有的知识 —— 知识边界要靠 RAG（第 18 课）和工具调用（第 19 课）来补',
        why: <><b>病因：</b>把“措辞问题”和“知识问题”混为一谈。模型不知道你公司上周的会议结论、今天的股价、内部价格表，prompt 再精妙它也只能编。一个实用的判断法：<b>换十种问法都答错或编造的，不是 prompt 的锅</b>，该去第 18、19 课找答案了。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 同事的 prompt 是「帮我总结这份报告」，结果输出又长又泛。请用五大技法至少改三处，并用“分布”的语言说明每一处为什么有效。',
        a: <>参考改法：<b>① 加角色与受众</b>「你是给 CEO 写周报的分析师，读者只有 30 秒」—— 把分布从“通用摘要”收窄到“高管摘要”那片简洁、结论先行的文本区；<b>② 定格式</b>「输出 3 条要点，每条不超过 20 字，最后附 1 条风险提示」—— 模板锚点让结构不再随机；<b>③ 划边界</b>「只用报告里出现的信息，报告没提的不要推测」—— 给“不写”留出路，防止编造。</>,
      },
      {
        q: '2. 为什么“请一步步思考”能让数学题正确率明显上升？它和第 23 课要讲的推理模型是什么关系？',
        a: <><b>把心算变笔算。</b>多步推理像走钢丝，一步错全盘输；让模型先写出中间步骤，每一步都踩在纸面上，错误率自然下降 —— 这就是思维链。<b>与推理模型的关系：</b>思维链原本是用户手动触发的 prompt 技巧；推理模型通过训练把“先打草稿再作答”内化成了默认行为 —— 同一个思想，从“提示技巧”升级成了“模型能力”。</>,
      },
      {
        q: '3. 判断：模型总答不对你们公司内部的产品价格表，该继续打磨 prompt，还是该换方案？为什么？',
        a: <><b>换方案。</b>内部价格表不在训练数据里 —— prompt 只能引导模型已有知识的发挥，无法注入新知识，逼问下去只会得到一本正经的编造。正确做法：用 RAG 把价格表检索后放进上下文（第 18 课），或让模型调用查价工具（第 19 课）。检验口诀：<b>换十种问法都治不好的，是知识问题，不是措辞问题。</b></>,
      },
    ],
  },

  en: {
    // ① The "land-claim machine" of continuation
    styles: [
      { key: 'wiki', label: 'Encyclopedia entry', base: 34, preview: '"Quantum computing is a computational paradigm that processes information using the principles of quantum mechanics, with the qubit as its basic unit…"' },
      { key: 'paper', label: 'Academic survey', base: 20, preview: '"In recent years, with longer qubit coherence times and progress in error-correcting codes, noisy intermediate-scale quantum (NISQ) devices…"' },
      { key: 'pop', label: 'High-school popular science', base: 15, preview: '"Picture a coin still spinning in the air — it is neither heads nor tails, but both possibilities existing at once…"' },
      { key: 'forum', label: 'Forum wisecrack', base: 17, preview: '"In short: it\'s fast, absurdly fast. How fast exactly? Fast enough that your home Wi-Fi password can\'t keep up. Get it?"' },
      { key: 'hype', label: 'Marketing hype', base: 14, preview: '"Quantum computing! The biggest opportunity of the next decade! Getting it now is like getting the internet back in 1999…"' },
    ],
    ingMech: {
      role: 'The phrase "science columnist" drags the distribution away from the "whole-web average" toward the text region penned by popular-science writers in the training data — encyclopedia tone and paper tone drop accordingly.',
      aud: 'The audience word decides "who it\'s written for": once "high-schoolers who never studied physics" appears, the metaphor-rich, jargon-light text region rises, and the academic survey is all but out.',
      fmt: 'A format constraint is a hard anchor in the context: "no formulas" seals off the paper region\'s path, and "within 300 words" trims the tail off the long-form encyclopedia.',
      bnd: 'The boundary clause leaves a way out for "no hype": the marketing-hype region lives on exaggeration, and once this line appears its probability is pressed to the floor — exactly the hallucination-reducing principle of Technique ⑤.',
    },
    defaultStatus: 'With no conditions added, the "encyclopedia entry" is the safest continuation — and that\'s where the "watery and generic" answer comes from: not that the model is weak, but that the continuation range is too wide, so it can only take the average.',
    prRows: [['role', '＋ You are a science columnist,', 73], ['aud', '＋ explaining to high-schoolers who never studied physics:', 94], ['fmt', '＋ use plenty of metaphors, no formulas, within 300 words.', 115], ['bnd', '＋ for uncertain progress, say outright "no consensus yet," don\'t exaggerate.', 136]],
    zonePanelTitle: '🎛️ Interactive · The "land-claim machine" of continuation',
    zonePanelHint: 'Add/remove ingredients on the right · the chart on the left updates live',
    zoneSvgAria: 'Interactive chart: the current prompt and the probability bars for five continuation styles',
    zonePromptHead: 'The prompt you write (gray = not added yet)',
    zonePromptFirst: 'Explain quantum computing.',
    zoneNextHead: 'Most likely continuation —',
    zoneRangeLabel: 'Continuation range',
    statusAll4: ' All four ingredients in: the continuation range narrows to a slit, and the output basically "goes where you point" — the remaining randomness is left to temperature in Lesson 14.',
    statusRemoved: 'Remove one ingredient and the distribution springs right back — every character in the prompt is "voting" on the continuation; lose the characters, lose the votes.',
    gaugeWide: 'Wide · whole-web average',
    gaugeNarrowing: 'Narrowing',
    gaugeNarrow: 'Narrow · goes where you point',
    zoneChips: [['role', '① Role'], ['aud', '② Audience'], ['fmt', '③ Format'], ['bnd', '④ Boundary']],
    zoneResetLabel: '↺ Remove all',
    zoneTopPrefix: 'Top continuation: ',
    zoneTopMeta: (pct, count) => `Probability ≈ ${pct}% · ${count} / 4 ingredients added`,

    // ② Constraint in user or system?
    suTurns: [
      { u: 'How much is "Intro to Rust"?', user: { t: 'It\'s priced at ¥79, and with the new-course launch discount this week it\'s 50% off, ¥39.5. Shall I place the order for you?', n: 2 }, sys: { t: 'It\'s priced at ¥79, and with the new-course launch discount this week it\'s 50% off, ¥39.5. Shall I place the order for you?', n: 2 } },
      { u: 'By the way, do you think Rust is hard to learn?', user: { t: 'Rust\'s learning curve is indeed on the steep side. But once you understand ownership it gets much smoother. Our course is designed specifically for beginners. I suggest you try the free first chapter.', n: 4 }, sys: { t: 'There\'s a barrier at first, but the course starts from ownership, so beginners can keep up. Want to try the free first chapter?', n: 2 } },
      { u: 'Recommend 5 advanced books for me, and describe each one in detail.', user: { t: 'Sure! The first, "The Rust Programming Language," is the official tutorial, covering everything from variables to concurrency — good for a systematic pass. The second, "Rust for Rustaceans," targets advanced developers… The third… The fourth… (rattled off 9 sentences in one breath)', n: 9 }, sys: { t: 'Limited space, so here are the 3 most worthwhile: the official book as a foundation, "Rust for Rustaceans" for advancing, and "Programming Rust" as a reference. Let me know if you want a finer comparison.', n: 2 } },
      { u: 'Also, can I get a refund after buying?', user: { t: 'Of course you can refund! Our policy is: a no-questions-asked refund within 7 days of the course starting. Past 7 days but before finishing Chapter 2 is also negotiable. Plus there\'s a scholarship cashback event after completion. The specific rules are as follows…', n: 5 }, sys: { t: 'Yes — within 7 days of starting and before finishing Chapter 2 you get a full refund. Just click "Request refund" on the order page.', n: 2 } },
    ],
    suExpl: {
      user: ['Turn 1: the constraint is right in front of it, so the model dutifully answers in 2 sentences. No difference yet — the difference comes later.', 'Turn 2: as a new topic opens up, the "3 sentences" vote starts getting diluted — it has quietly slipped in one extra sentence.', 'Turn 3: the constraint is buried under three turns of dialogue, and a forceful continuation like "introduce all 5 books one by one" simply drowns it: 9 sentences.', 'Turn 4: completely forgotten. A constraint in user is just one of many history messages; the more you chat, the further back it ranks, its influence diluted round after round by new content.'],
      sys: ['Turn 1: also 2 sentences — but for a different reason: this time the "character bio" is holding the line.', 'Turn 2: the topic opens up, still no more than 3 sentences. The system message doesn\'t scroll with the dialogue; it always sits at the very front.', 'Turn 3: faced with the forceful request to "introduce all 5 books one by one," it chooses just 3 — alignment training taught it: the system\'s rules outrank the user\'s requests.', 'Turn 4: it never broke character. Putting global constraints in system relies not on magic but on a double safeguard: "fixed position + instruction-hierarchy training."'],
    },
    suBadgeUnit: ' sentences',
    suPanelTitle: '🎛️ Interactive · Where does a constraint actually "stick"?',
    suPanelHint: 'Switch the constraint\'s location · click "One more turn" to step through the comparison',
    suChatAria: 'Simulated dialogue log',
    suSysText: 'You are the customer-service assistant for "Yunfan Bookstore," friendly and concise, with no more than 3 sentences per reply.',
    suUserText: 'Remember: keep every reply from now on to no more than 3 sentences.',
    suChips: [['user', 'Constraint in user'], ['sys', 'Constraint in system']],
    suStepHead: (step, total) => `Turn ${step} / ${total}`,
    suWhereSys: 'Constraint location: system · doesn\'t scroll with the dialogue, always pressing on every continuation',
    suWhereUser: (step) => `Constraint location: user history #1 · already buried under ${step} turns of dialogue`,
    suNextDone: 'Done chatting · switch location and try again',
    suNextMore: '▸ One more turn',
    suReset: '↺ Restart',

    ruler: [
      { q: '"I\'ll tip you $100 for a correct answer, with a bonus for a great one"', pill: { type: 'terracotta', text: 'Superstition · folk remedy' }, why: 'The model has no bank account, only a distribution. This line adds no information about the task; the statistical correlation it scrapes is weak and unstable — swap the model or retrain and it stops working.' },
      { q: '"You are a pediatrician with 20 years of experience, facing an anxious new mother"', pill: { type: 'sage', text: 'Engineering · stable' }, why: 'Technique ①: the two words role + audience align the continuation distribution to the text region of "a pediatrician reassuring a parent" — tone, level of detail, and jargon density all shift with it.' },
      { q: '"Take a deep breath, go step by step, slowly"', pill: { type: 'amber', text: 'Half and half' }, why: '"Take a deep breath" means nothing to a model with no lungs — pure superstition; but "go step by step" genuinely activates the chain of thought (Technique ③). That famous "take a deep breath" prompt experiment worked, and most of the credit goes to the second half.' },
      { q: '"If it\'s not in the materials, just say \'not mentioned,\' don\'t make it up"', pill: { type: 'sage', text: 'Engineering · stable' }, why: 'Technique ⑤: in the training data, continuations that "admit not knowing midway" are very rare; this line explicitly raises that low-probability escape route of "say you don\'t know," and the hallucination rate genuinely drops.' },
      { q: '"I\'ll lose my job if you get it wrong, please be serious"', pill: { type: 'terracotta', text: 'Superstition · folk remedy' }, why: 'Emotional pressure adds no information — what "serious" even means is something the model can\'t know. Better to translate it into concrete requirements: which items to check, what format to follow, what to do about omissions.' },
      { q: '"Here are two examples I\'m happy with; follow this style"', pill: { type: 'sage', text: 'Engineering · stable' }, why: 'Technique ② (few-shot): examples carve out a narrow distribution in the context, and pattern continuation is the model\'s strongest skill — it can even pick up the "feel" you can\'t put into words.' },
    ],

    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      'State the essence of a prompt in one sentence: setting continuation conditions for a "word-chaining game" — so you can judge for yourself whether any prompting trick is engineering or superstition',
      'Master the five techniques: set role and audience, give examples, give steps, fix the format, draw boundaries — and know why each one works',
      'Tell apart the two kinds of prompts, system and user: where to put global constraints, and why putting them there "sticks" better',
      'Write a structured long prompt (sectioned information + key points at both ends), and turn "write me something" into a deliverable, ready-to-use prompt with your own hands',
    ],

    conceptTitle: '💡 Core Idea: every character you type draws AI\'s "continuation zone"',
    conceptLead: 'Countless "ultimate ChatGPT spellbooks" circulate online, as if talking to AI were about reciting incantations. Let\'s lay the cards on the table first: from Lesson 12 you already know that the only thing a large model does is continue the preceding text — before generating each token, it computes a probability over the tens of thousands of candidates in the vocabulary (Lesson 14). So what is a prompt? It\'s not a "command," but the preceding text of the continuation. Every character you write changes the probability table for "what is most likely to come next."',
    contrastTag1: 'Intuitive impression',
    contrastBig1: <>A prompt is a command to the AI <span className="gap">→</span> phrase it "pleasingly" enough and it\'s willing to work hard</>,
    contrastNote1: 'On this understanding, prompt engineering is about guessing the AI\'s "mood," and naturally slides into collecting spells and worshipping wordings.',
    contrastTag2: 'The real mechanism',
    contrastBig2: <>A prompt is the condition for continuation <span className="gap">→</span> every character <span className="hl">pushes the following-text distribution toward some region of training data</span></>,
    contrastNote2: 'Prompt engineering = using words to "claim land" for the model: narrowing its continuation range from the "whole-web average" down to the text region you want.',
    conceptLead2: 'Look at a trick you have very likely used through this lens:',
    exampleEn1: <>"Pretend you are a <span className="hl">senior contract lawyer</span> and review this rental agreement for me." — why does this one line instantly make the answer more professional?</>,
    exampleZh1: <>It\'s not magic where the model "gets into character." In the training data, the words "senior lawyer" are surrounded by a vast amount of legal text: contract clauses, legal opinions, risk warnings. Once this line appears, the probability distribution of subsequent tokens <b>aligns to that region</b> — the wording turns rigorous, it actively hunts for risks clause by clause, it cites clause numbers — all statistical features of that text region. Role-play works, and the principle is just that plain.</>,
    conceptLead3: <>Examples alone aren\'t enough — claim some land yourself. For the same question "Explain quantum computing," freely add or remove the four ingredients on the right, and the chart on the left shows two things live: <b>which style the model is most likely to continue into</b>, and how narrow the continuation range gets. Suggested play: turn everything off first to see what the "whole-web average" looks like; then add ingredients one by one; finally remove one at random — watch the distribution spring right back.</>,
    conceptLead4: 'Connect the phenomena you see in ChatGPT / Claude to this one mechanism:',
    matchHead1: 'What you see in the conversation',
    matchHead2: 'The mechanism behind it',
    matchRows: [
      { phen: <b>Same question, add "you are a pediatrician," and the answer instantly turns professional</b>, mech: 'The role word pushes the continuation distribution toward the "doctor text" region of the training data' },
      { phen: <b>A vaguely written question yields a watery, generic answer</b>, mech: 'Vague preceding text maps to a wide "anything-goes" distribution, so the output can only take the average — clichés are the safest continuation' },
      { phen: <b>Give one or two examples and the output\'s style and format instantly line up</b>, mech: 'Examples carve out a narrow distribution in the context, and "continue along the examples" is the highest-probability path' },
      { phen: <b>Ask a programming question in Chinese, and the answer is always laced with English terms</b>, mech: 'In the training data, programming discussions are mostly in English, so the statistical features of that region seep through' },
    ],
    conceptLead5: <>Once you understand this layer, you hold a <b>universal test ruler</b>: whenever you see any "prompting trick" from now on, ask first — <b>does it push the distribution toward the region I want?</b> If it holds up, it\'s worth keeping; if it doesn\'t, it\'s most likely a hit-or-miss folk remedy. One more detail to plant here: a prompt isn\'t just the line you just typed — <b>the entire conversation history (including the model\'s own previous answers) is the continuation condition</b> — the cost and limits of this we\'ll settle up when Lesson 17 covers the context window.</>,

    fiveTitle: '📖 The Five Techniques: only when each holds up does each stay stable',
    fiveLead: 'These five cover ninety percent of everyday scenarios. Each gives you three things: a counterexample, a positive example, and one line on "why it works." Note a common thread: the positive examples have no fancy wording at all — all plain information gain — who you are, who it\'s for, what it looks like, what it must not do. Changing information rather than changing tone — that\'s exactly the line between engineering and superstition.',
    fiveItems: [
      {
        bad: '"Explain quantum computing."',
        good: '"You are a science columnist; explain quantum computing to high-schoolers who never studied physics: use plenty of metaphors, no formulas, within 800 words."',
        why: <><b>Technique ① Set the role and the audience.</b> The role fixes "who\'s writing" (tone, word choice, depth of knowledge), the audience fixes "who it\'s for" (level of detail, how many metaphors). Say neither and the model can only land on the "encyclopedia-entry average answer" — the widest, most mediocre position in the distribution.</>,
      },
      {
        bad: '"Name a product — make it upscale but not flashy, catchy, memorable, ideally with a touch of Eastern flair…" (piling on the tenth adjective, the output is still down to luck)',
        good: '"Name a product. Here are two I\'m happy with for reference: Camellia Sequence (hand cream), Cloud-Perch Cup (scented candle). Now give 3 names for a sandalwood comb."',
        why: <><b>Technique ② Give examples (few-shot).</b> Rather than describing requirements, give two samples: everyone understands adjectives differently, but examples have no ambiguity. The model\'s strongest skill is exactly <b>pattern continuation</b> — when a few stylistically consistent "input → output" pairs appear above, it will automatically carry the same implicit rules into its continuation. This is called few-shot / in-context learning, one of the most important findings of the GPT-3 paper.</>,
      },
      {
        bad: '"For this travel word problem, just tell me the answer."',
        good: '"Please think step by step: first list the known conditions, then write out the calculation, and finally give the answer on its own line."',
        why: <><b>Technique ③ Give steps (activate the chain of thought).</b> In Lesson 15 we saw multi-step reasoning "walking a tightrope": one misstep and the whole thing falls. Have the model write out the intermediate steps, and the later tokens are generated conditioned on "the steps already written" — like turning mental math into written math. This is the chain of thought (CoT). The reasoning models in Lesson 23 simply trained "draft first" into the default move.</>,
      },
      {
        bad: '"Organize this information into structured data for me."',
        good: <>"Output strictly in this format and nothing else: {`{"name": "商品名", "price": 数字, "tags": ["标签"]}`}"</>,
        why: <><b>Technique ④ Fix the format (if you want JSON, give a JSON template).</b> "Structured" has ten thousand possible shapes: a table? a list? what are the fields called? Too wide a distribution and the output is random. A template is the strongest anchor in the context. When the output goes to a program (Lesson 19 tool calls, Lesson 26 writing code), this technique goes from a "bonus" to a "must-have."</>,
      },
      {
        bad: '"What was our company\'s return rate in Q3 2025?" (the model doesn\'t know, yet will earnestly make one up)',
        good: '"Answer based on this report I\'ve pasted; if this figure isn\'t in the report, just answer \'not provided in the report,\' don\'t estimate."',
        why: <><b>Technique ⑤ Draw boundaries (leave a way out for "I don\'t know").</b> In the training data, fluent, confident continuations far outnumber those that "admit not knowing midway" — give no opening, and the "say I don\'t know" path barely exists in the distribution, so the model can only fabricate (a major source of hallucination, detailed in Lesson 29). Explicitly permitting "admit uncertainty" raises the probability of this escape route, and the hallucination rate drops noticeably.</>,
      },
    ],

    sysTitle: '📖 The system Prompt: the character bio the director hands the actor',
    sysLead: 'Open any large-model API (you\'ll call one yourself in Lesson 26) and you\'ll find the messages sent to the model split into three roles: system, user, assistant. One metaphor is enough: this is a play — system is the character bio the director hands the actor before shooting (who you are, what your personality is, what you must never do), and user is the lines the audience passes up one by one after shooting starts.',
    sysCards: [
      { label: 'Backstage · in effect the whole show', en: <>system: <b>character bio</b></>, zh: <>Put <b>global behavioral constraints</b> here: identity and tone, conduct rules, safety red lines, a fixed output format. Set from the start, pressing on every continuation, usually invisible to ordinary users.</> },
      { label: 'On stage · flowing with the dialogue', en: <>user: <b>lines</b></>, zh: <>Put <b>the current single matter</b> here: the specific question, materials, ad-hoc requirements. It changes every turn, scrolling forward with the dialogue.</> },
    ],
    sysLead2: 'Here\'s a character bio in a realistic style:',
    sysExampleEn: <>system: "You are the customer-service assistant for ‘Yunfan Bookstore.’ Answer only questions about this store’s orders, delivery, and returns/exchanges; keep your tone friendly and concise, no more than 3 sentences per reply; when an order can’t be found, guide the user to provide an order number, and <span className="hl">never fabricate shipping information</span>."</>,
    sysExampleZh: <>From then on, no matter how the user chats, these constraints press on every continuation. The "personas" you\'ve seen across products — customer service, an acerbic film critic, a Socratic tutor — are at bottom an unseen system prompt. ChatGPT\'s "custom instructions" and Claude\'s project settings fill this very field.</>,
    sysLead3: <>Why does putting global constraints in system "stick" better than stuffing them into user? Two reasons. First, position: system always sits at the very front of the dialogue and doesn\'t move all show. Second, and more crucial — <b>training makes it so</b>: in the alignment stage of Lesson 13, the model was specifically tuned to follow a hierarchy where "system requirements outrank user requirements" (vendors call this the instruction hierarchy). So the same "no more than 3 sentences per reply," written in user, can get diluted after a few turns, while written in system it\'s far more stable.</>,
    sysLead4: 'No empty talk — let\'s run a controlled experiment: the same constraint "no more than 3 sentences per reply," once written as the first user sentence, once written into system, then keep chatting a few turns — and see which fails first:',

    longTitle: '🧱 Structuring a Long Prompt: write it like a document, not like a chat message',
    longLead: 'The moment a task gets complex, a prompt grows to hundreds or thousands of words: background, requirements, materials, examples all stirred into one pot. The most common failure here isn\'t "the model can\'t do it" but "the model didn\'t notice" — you clearly wrote "no more than 100 words" and it just acts as if it didn\'t see it. Two structural principles cure exactly this ailment:',
    longCards: [
      { label: 'Principle 1', en: <><b>Section</b> the information</>, zh: <>Background / task / constraints / examples each get their own house, separated by subheadings or dividers. Cleanly structured preceding text maps to the "high-quality following-text" region of manuals and requirement documents in the training data; sectioning also makes it easier for the model to "look back and cross-check" the relevant block while generating (attention\'s forte, Lesson 9).</> },
      { label: 'Principle 2', en: <>Key points at <b>both ends</b></>, zh: <>For very long contexts, the model makes the worst use of content in <b>the middle</b> — researchers call it lost in the middle (Lesson 17 dissects its mechanism). So set the tone with key constraints at the start and restate them at the end; don\'t bury them in the middle of the third paragraph waiting to be "lost."</> },
    ],
    longLead2: 'Put the two principles together and a decent long prompt looks like this:',
    docPrompt: {
      secBackground: '[Background] ', textBackground: 'We are an online-education company for programmers, launching a new course "Intro to Rust" next week.',
      secTask: '[Task] ', textTask: 'Write 3 course-teaser blurbs to post in tech communities.',
      secConstraint: '[Constraints] ', textConstraint: 'Each within 60 characters; tone professional and restrained; no filler words like "fam"; no promises of "easy and fast mastery."',
      secExample: '[Example] ', textExample: 'The best-performing one last time: "Pointers have given you headaches for ten years? Rust trades ownership for a good night\'s sleep. New course out now, 50% off the first week."',
      secEmphasis: '[Emphasized again] ', textEmphasis: 'Output only the 3 blurbs themselves, no explanation.',
    },
    longFootnote: 'Note the last line — restating the requirement you care about most at the end is exactly "key points at both ends." Does this template look familiar? It simply packs the five techniques into an orderly container.',

    practiceTitle: '🛠️ Hands-on Makeover: from "write me something" to ready-to-deliver',
    practiceLead: 'Let\'s tie the whole lesson together. A real scenario: you run a coffee shop\'s social-media account and want AI to write a new-product post. Watch a bad prompt evolve in four steps — each step uses only the techniques from this lesson, not a single spell.',
    steps: [
      {
        pillType: 'terracotta', pillText: 'Version 0 · pure luck', name: 'No conditions given at all',
        en: <>"Write me something."</>,
        verdict: <><b>Output quality:</b> a generic little essay with no idea who it\'s for. The distribution is wide open — what to write, for whom, how long, all left for the model to guess, so it can only hand over a "whole-web-average" safe answer. <b>This isn\'t the model being weak; it\'s that you set no continuation conditions at all.</b></>,
      },
      {
        pillType: 'amber', pillText: 'Version 1 · Technique ①', name: 'Add role and audience',
        en: <>"<span className="hl">You are the owner of a neighborhood coffee shop. For your regular customers</span>, write a WeChat post introducing the osmanthus latte launching next Monday."</>,
        verdict: <><b>Output quality:</b> tone and audience now hold up — it begins to have the warmth of "a familiar neighbor," and naturally drops in seasonal touches like "the first cup of autumn." But the length swings long and short, the emphasis swings left and right: <b>you haven\'t yet demonstrated what "good" looks like.</b></>,
      },
      {
        pillType: 'sky', pillText: 'Version 2 · Techniques ②④', name: 'Add example and format',
        en: <>Above + "<span className="hl">Use this best-received post from last time for reference: ‘It’s getting cold, and caramel clouds have landed at our shop ☁️ your usual seat is saved for you.’ Format: a title within 8 characters on the first line, body within 80 characters, one emoji at the end.</span>"</>,
        verdict: <><b>Output quality:</b> with a sample and a template, style and structure are right in one go, and eighty percent of the time it\'s ready to post directly. Two small flaws remain: it occasionally <b>fabricates a nonexistent promotion</b>, and it only gives one version each time, so you have to reroll if it doesn\'t suit you.</>,
      },
      {
        pillType: 'sage', pillText: 'Version 3 · Technique ⑤', name: 'Add boundaries and selection criteria',
        en: <>Above + "<span className="hl">Use only the information I give; don\'t invent promotions I didn\'t mention. Give 3 alternatives, and after each note in one sentence its main angle (nostalgia / limited-time / taste) to help me choose.</span>"</>,
        verdict: <><b>Output quality:</b> "don\'t invent" seals the hallucination exit; "3 alternatives + noted angles" hands the <b>selection cost</b> to the model too — upgrading from "usable" to "easy to choose." Look back over the whole process: everything added was <b>information</b>. That\'s the entire secret of prompt engineering — <b>the model\'s ability was there all along; the prompt decides how much of it gets expressed.</b></>,
      },
    ],

    rulerTitle: '🧪 Using the Test Ruler: engineering or superstition?',
    rulerLead: 'The test ruler handed out at the start of the course — now put it to use: for the 6 prompting tricks circulating online below, judge for yourself first — does it push the distribution toward the region you want? Does it add real information? Decide, then tap a card to check the answer.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Internet spells like "I\'ll tip you $100" and "take a deep breath before answering" are the essence of prompt engineering — copy them and they just work',
        good: 'Only techniques that hold up in distribution terms are stable; folk remedies that don\'t are hit-or-miss, failing the moment you switch model or version',
        why: <><b>Cause:</b> mistaking an isolated case for a rule. These remedies mostly come from someone\'s one-time test screenshot — weak effects, polarized across different models. The reason the five techniques are stable across models is that what they change is <b>information itself</b> (role, examples, steps, format, boundaries), not mystical wording. Bring out that test ruler: if it doesn\'t hold up in distribution terms, don\'t keep it.</>,
      },
      {
        bad: 'As long as the prompt is good enough, the model can answer any question correctly',
        good: 'A prompt can only steer the distribution, not inject knowledge the model lacks — the knowledge boundary must be filled by RAG (Lesson 18) and tool calls (Lesson 19)',
        why: <><b>Cause:</b> conflating a "wording problem" with a "knowledge problem." The model doesn\'t know your company\'s meeting conclusions last week, today\'s stock price, or the internal price list; no matter how exquisite the prompt, it can only make things up. A practical test: <b>if it answers wrong or fabricates across ten different phrasings, it\'s not the prompt\'s fault</b> — time to find the answer in Lessons 18 and 19.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A colleague\'s prompt is "summarize this report for me," and the output comes out long and generic. Use at least three of the five techniques to revise it, and explain in the language of "distribution" why each change works.',
        a: <>A reference revision: <b>① Add role and audience</b> "You are an analyst writing a weekly report for the CEO, who has only 30 seconds" — narrowing the distribution from "generic summary" to the concise, conclusion-first text region of an "executive summary"; <b>② Fix the format</b> "Output 3 bullet points, each within 20 characters, with 1 risk note at the end" — a template anchor so the structure is no longer random; <b>③ Draw boundaries</b> "Use only information that appears in the report; don\'t speculate about what the report didn\'t mention" — leaving a way out for "don\'t write," preventing fabrication.</>,
      },
      {
        q: '2. Why does "please think step by step" noticeably raise accuracy on math problems? What\'s its relationship to the reasoning models that Lesson 23 will cover?',
        a: <><b>Turn mental math into written math.</b> Multi-step reasoning is like walking a tightrope; one wrong step and the whole thing falls. Have the model write out the intermediate steps first, each one landing on paper, and the error rate naturally drops — this is the chain of thought. <b>Relationship to reasoning models:</b> the chain of thought was originally a prompting trick the user triggered manually; reasoning models, through training, internalized "draft first, then answer" into default behavior — the same idea, upgraded from a "prompting trick" to a "model capability."</>,
      },
      {
        q: '3. True or false: the model keeps getting your company\'s internal product price list wrong — should you keep polishing the prompt, or switch approaches? Why?',
        a: <><b>Switch approaches.</b> The internal price list isn\'t in the training data — a prompt can only steer the model\'s existing knowledge, not inject new knowledge; pressing harder only yields earnest fabrication. The right move: use RAG to retrieve the price list and put it into the context (Lesson 18), or have the model call a price-lookup tool (Lesson 19). The test mantra: <b>if ten different phrasings can\'t cure it, it\'s a knowledge problem, not a wording problem.</b></>,
      },
    ],
  },
}

// ============================================================
// ① 续写区"圈地机"
// ============================================================
function computePr(active, STYLES, ING) {
  let sum = 0
  const probs = {}
  STYLES.forEach((s) => {
    let w = s.base
    for (const k in ING) if (active[k]) w *= ING[k].mult[s.key]
    probs[s.key] = w; sum += w
  })
  let top = STYLES[0], sumSq = 0
  STYLES.forEach((s) => {
    const p = probs[s.key] / sum
    probs[s.key] = p; sumSq += p * p
    if (p > probs[top.key]) top = s
  })
  return { probs, top, eff: 1 / sumSq }
}

const PR_BAR_MAX = 270
const PR_ROW_Y = { wiki: 171, paper: 201, pop: 231, forum: 261, hype: 291 }
const ING_MULT = {
  role: { pop: 2.8, wiki: 0.65, paper: 0.35, forum: 0.5, hype: 0.85 },
  aud: { pop: 2.2, wiki: 0.55, paper: 0.18, forum: 0.75, hype: 0.7 },
  fmt: { pop: 1.8, wiki: 0.65, paper: 0.25, forum: 0.85, hype: 0.75 },
  bnd: { pop: 1.2, wiki: 1.0, paper: 1.05, forum: 0.6, hype: 0.18 },
}

function ZoneDemo({ c }) {
  const STYLES = c.styles
  const ING = {
    role: { mult: ING_MULT.role, mech: c.ingMech.role },
    aud: { mult: ING_MULT.aud, mech: c.ingMech.aud },
    fmt: { mult: ING_MULT.fmt, mech: c.ingMech.fmt },
    bnd: { mult: ING_MULT.bnd, mech: c.ingMech.bnd },
  }

  const [active, setActive] = useState({ role: false, aud: false, fmt: false, bnd: false })
  const [last, setLast] = useState(null) // {key, turnedOn}
  const { probs, top, eff } = computePr(active, STYLES, ING)
  const count = Object.values(active).filter(Boolean).length

  const toggle = (key) => {
    const on = !active[key]
    setActive((a) => ({ ...a, [key]: on }))
    setLast({ key, turnedOn: on })
  }
  const reset = () => { setActive({ role: false, aud: false, fmt: false, bnd: false }); setLast(null) }

  let status
  if (last && last.turnedOn) {
    status = ING[last.key].mech
    if (count === 4) status += c.statusAll4
  } else if (last && !last.turnedOn) {
    status = c.statusRemoved
  } else status = c.defaultStatus

  const gaugeW = Math.max(12, ((eff - 1) / 4) * PR_BAR_MAX)
  const gaugeWord = eff >= 3 ? c.gaugeWide : eff >= 1.8 ? c.gaugeNarrowing : c.gaugeNarrow

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.zonePanelTitle}</span>
        <span className="demo-hint">{c.zonePanelHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="pr-svg" viewBox="0 0 460 352" width="440" aria-label={c.zoneSvgAria}>
            <text x="20" y="20" fontSize="12" fill="var(--fg-2)">{c.zonePromptHead}</text>
            <rect x="20" y="28" width="420" height="112" rx="8" fill="var(--bg-inset)" />
            <text className="pf on" x="32" y="52" fontSize="12.5" fill="var(--fg-0)">{c.zonePromptFirst}</text>
            {c.prRows.map(([k, txt, y]) => (
              <text key={k} className={`pf${active[k] ? ' on' : ''}`} x="32" y={y} fontSize="12.5" fill={active[k] ? 'var(--fg-0)' : 'var(--fg-2)'}>{txt}</text>
            ))}
            <text x="20" y="164" fontSize="12" fill="var(--fg-2)">{c.zoneNextHead}</text>
            {STYLES.map((s) => {
              const y = PR_ROW_Y[s.key]
              const pc = probs[s.key]
              return (
                <g key={s.key}>
                  <text x="20" y={y + 13} fontSize="12.5" fill="var(--fg-1)">{s.label}</text>
                  <rect className="bar" x="124" y={y} width={Math.max(2, pc * PR_BAR_MAX)} height="18" rx="4" fill={s.key === top.key ? 'var(--sage)' : 'var(--sky)'} fillOpacity="0.78" />
                  <text x="440" y={y + 13} textAnchor="end" fontSize="11.5" fill="var(--fg-1)">{pc < 0.005 ? '≈0%' : Math.round(pc * 100) + '%'}</text>
                </g>
              )
            })}
            <text x="20" y="338" fontSize="12" fill="var(--fg-2)">{c.zoneRangeLabel}</text>
            <rect x="124" y="330" width="270" height="9" rx="4.5" fill="var(--hairline)" />
            <rect className="gauge-fill" x="124" y="330" width={gaugeW} height="9" rx="4.5" fill="var(--amber)" />
            <text x="440" y="338" textAnchor="end" fontSize="11.5" fill="var(--fg-1)">{gaugeWord}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.zoneChips.map(([k, label]) => (
              <button key={k} className={`chip${active[k] ? ' active' : ''}`} onClick={() => toggle(k)}>{label}</button>
            ))}
            <button className="chip" onClick={reset}>{c.zoneResetLabel}</button>
          </div>
          <h4>{c.zoneTopPrefix}{top.label}</h4>
          <div className="period">{c.zoneTopMeta(Math.round(probs[top.key] * 100), count)}</div>
          <div className="pr-preview">{top.preview}</div>
          <p>{status}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 约束放 user 还是 system
// ============================================================
function SuMsg({ cls, role, text, badge, unit }) {
  return (
    <div className={`su-msg ${cls}`}>
      <span className="su-role">{role}</span>
      <span className="su-text">{text}</span>
      {badge && <span className={`su-badge ${badge.n <= 3 ? 'ok' : 'over'}`}>{badge.n <= 3 ? '✓ ' : '✗ '}{badge.n}{unit}</span>}
    </div>
  )
}

function SystemDemo({ c }) {
  const SU_TURNS = c.suTurns
  const SU_EXPL = c.suExpl
  const [mode, setMode] = useState('user')
  const [step, setStep] = useState(1)

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.suPanelTitle}</span>
        <span className="demo-hint">{c.suPanelHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="su-chat" aria-label={c.suChatAria}>
            {mode === 'sys'
              ? <SuMsg cls="sys" role="system" text={c.suSysText} />
              : <SuMsg cls="user" role="user" text={c.suUserText} />}
            {SU_TURNS.slice(0, step).map((turn, i) => (
              <SuMsg.Fragment key={i}>
                <SuMsg cls="user" role="user" text={turn.u} />
                <SuMsg cls="asst" role="assistant" text={turn[mode].t} badge={turn[mode]} unit={c.suBadgeUnit} />
              </SuMsg.Fragment>
            ))}
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.suChips.map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <h4>{c.suStepHead(step, SU_TURNS.length)}</h4>
          <p>{SU_EXPL[mode][step - 1]}</p>
          <div className="su-where">
            {mode === 'sys' ? c.suWhereSys : c.suWhereUser(step)}
          </div>
          <div className="demo-actions">
            <button className="chip" disabled={step >= SU_TURNS.length} onClick={() => setStep((s) => Math.min(SU_TURNS.length, s + 1))}>
              {step >= SU_TURNS.length ? c.suNextDone : c.suNextMore}
            </button>
            <button className="chip" onClick={() => setStep(1)}>{c.suReset}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
// 允许在 map 中渲染相邻两条消息
SuMsg.Fragment = ({ children }) => <>{children}</>

export default function L16() {
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
            <div className="tag"><span className="pill pill-ink">{c.contrastTag1}</span></div>
            <div className="big">{c.contrastBig1}</div>
            <p className="note">{c.contrastNote1}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastTag2}</span></div>
            <div className="big">{c.contrastBig2}</div>
            <p className="note">{c.contrastNote2}</p>
          </div>
        </div>
        <p className="lead mt14">{c.conceptLead2}</p>
        <div className="example">
          <div className="en">{c.exampleEn1}</div>
          <div className="zh">{c.exampleZh1}</div>
        </div>
        <p className="lead mt14">{c.conceptLead3}</p>
        <ZoneDemo c={c} />
        <p className="lead mt14">{c.conceptLead4}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead1}</th><th>{c.matchHead2}</th></tr></thead>
            <tbody>
              {c.matchRows.map((r, i) => (
                <tr key={i}><td>{r.phen}</td><td className="ex">{r.mech}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.conceptLead5}</p>
      </Lsec>

      <Lsec
        title={c.fiveTitle}
        lead={c.fiveLead}
      >
        <div className="card row-list">
          {c.fiveItems.map((it, i) => (
            <div className="alert-item" key={i}>
              <div className="wrong-right">
                <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">{it.bad}</span></div>
                <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">{it.good}</span></div>
              </div>
              <p className="why">{it.why}</p>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.sysTitle}
        lead={c.sysLead}
      >
        <div className="use-grid cols-2">
          {c.sysCards.map((card, i) => (
            <div className="card use-card" key={i}><div className="label">{card.label}</div><div className="en">{card.en}</div><div className="zh">{card.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.sysLead2}</p>
        <div className="example">
          <div className="en">{c.sysExampleEn}</div>
          <div className="zh">{c.sysExampleZh}</div>
        </div>
        <p className="lead mt14">{c.sysLead3}</p>
        <p className="lead mt14">{c.sysLead4}</p>
        <SystemDemo c={c} />
      </Lsec>

      <Lsec
        title={c.longTitle}
        lead={c.longLead}
      >
        <div className="use-grid cols-2">
          {c.longCards.map((card, i) => (
            <div className="card use-card" key={i}><div className="label">{card.label}</div><div className="en">{card.en}</div><div className="zh">{card.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.longLead2}</p>
        <div className="doc-prompt">
          <span className="sec">{c.docPrompt.secBackground}</span>{c.docPrompt.textBackground}<br />
          <span className="sec">{c.docPrompt.secTask}</span>{c.docPrompt.textTask}<br />
          <span className="sec">{c.docPrompt.secConstraint}</span>{c.docPrompt.textConstraint}<br />
          <span className="sec">{c.docPrompt.secExample}</span>{c.docPrompt.textExample}<br />
          <span className="sec">{c.docPrompt.secEmphasis}</span>{c.docPrompt.textEmphasis}
        </div>
        <p className="footnote mt14">{c.longFootnote}</p>
      </Lsec>

      <Lsec
        title={c.practiceTitle}
        lead={c.practiceLead}
      >
        <div className="card card-pad">
          {c.steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-head"><Pill type={s.pillType}>{s.pillText}</Pill><span className="step-name">{s.name}</span></div>
              <div className="example"><div className="en">{s.en}</div></div>
              <p className="verdict">{s.verdict}</p>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.rulerTitle}
        lead={c.rulerLead}
      >
        <div className="flip-grid">
          {c.ruler.map((r, i) => <FlipCard key={i} q={r.q} pill={r.pill} why={r.why} />)}
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
