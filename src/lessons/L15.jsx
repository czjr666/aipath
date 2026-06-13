import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// Scaling 双图切换：幂律下降 vs 涌现跳变
// 双语内容层：结构 / class / id / SVG 几何 / 数值 / 交互均不变，仅可见文本按语言取用。
// 富文本（含 <b>）以 JSX 片段存储，渲染输出与单语版逐字一致。
// ============================================================

// 幂律图三条线的几何与颜色（演示数据，不翻译；label 走 C）
const POW_LINES = [
  { key: 'param', color: 'var(--sky)', ly: 58, solid: 'M70,66 L270,122', dash: 'M270,122 L425,166',
    dots: [[85, 68], [120, 82], [155, 88], [190, 102], [225, 108], [258, 120]], hollow: [425, 166] },
  { key: 'data', color: 'var(--amber)', ly: 96, solid: 'M70,104 L270,160', dash: 'M270,160 L425,204',
    dots: [[85, 109], [120, 117], [155, 129], [190, 136], [225, 149], [258, 156]], hollow: [425, 204] },
  { key: 'compute', color: 'var(--sage)', ly: 134, solid: 'M70,142 L270,198', dash: 'M270,198 L425,242',
    dots: [[85, 145], [120, 158], [155, 164], [190, 177], [225, 184], [258, 196]], hollow: [425, 242] },
]
const EMG_DOTS = [[90, 249], [130, 248], [170, 247], [210, 245], [250, 243], [285, 236], [322, 150], [340, 103], [362, 73], [395, 64], [425, 61]]

const C = {
  zh: {
    info: {
      pow: { title: '幂律下降：一条能外推的直线', period: 'OpenAI 2020 · Kaplan 等 / DeepMind 2022',
        desc: '横纵轴都换成对数刻度后，损失随参数、数据、算力的放大各自走成直线。实心点 = 真实训过的小模型；虚线与空心点 = 拿尺子延长直线，“预读”还没训的大模型成绩。',
        tags: ['可预测', '先小后大', '军备竞赛的保险单'],
        note: '三条线纵向错开只为看清，斜率为手绘示意；真实论文里横轴跨越七个以上数量级，点依然排成直线。' },
      emg: { title: '涌现跳变：趴了很久，猛地起跳', period: 'Wei 等 2022 · 多步算术（示意）',
        desc: '灰色虚线：平均损失全程平滑下降，毫无异动。红线：「多步算术全对率」在临界规模前几乎贴零，跨线后陡然蹿升 —— 这就是被称为“涌现”的现象。',
        tags: ['临界规模', '全对才得分', '仍在争论'],
        note: '提醒：换成“按步骤给部分分”的量尺后，这条红线可能变回平缓爬坡 —— 跳变是否真实，学界仍在争论。' },
    },
    powLabels: { param: '参数量', data: '数据量', compute: '算力' },

    demoTitle: '🎛️ 交互演示 · 可预测的损失 vs 不可预测的能力',
    demoHint: '点右侧胶囊切换两张图',
    powAria: '示意图：对数坐标下损失随参数、数据、算力放大各自沿直线下降',
    powYAxis: '损失（越低越好 · 对数刻度）',
    schematic: '示意图 · 非真实数据',
    powXAxis: '规模 →（对数刻度 · 每一格 = ×10）',
    powMeasured: '实测：一排便宜的小模型',
    powExtrap: '外推：直线照画下去',
    powHollow: '空心点 = 预测中的大模型',
    emgAria: '示意图：模型规模跨过临界点后多步算术全对率陡升',
    emgYAxis: '「多步算术」全对率',
    emgXAxis: '模型规模 →（对数刻度）',
    emgAvgLoss: '平均损失：仍在平滑下降（另一把尺子 · 示意）',
    emgCritical: '临界规模',
    emgFloor: '长期趴地板：几乎全错',
    emgJump: '突然会了',
    figChips: [['pow', '图一 · 幂律下降'], ['emg', '图二 · 涌现跳变']],
    focusLabel: '聚焦一条线：',
    focusChips: [['all', '全部'], ['param', '参数量'], ['data', '数据量'], ['compute', '算力']],

    goalsTitle: '🎯 你将学会',
    goals: [
      <>看懂大模型军备竞赛的底层逻辑：幂律让「砸 1 亿美元能买到多强」在开训之前就可以预读</>,
      <>掌握 Chinchilla 配平法则：参数与数据要按比例喂（经验比约每参数配 20 个 token），光堆参数是“营养不良”</>,
      <>理解涌现与它的争议：为什么平均分平滑上涨，多步推理却像“突然开窍”—— 以及这可能是评分方式造成的假象</>,
      <>看清 2024 年后的转向：纯堆参数收益放缓，前沿押注测试时计算与数据质量（第 23 课预告）</>,
    ],

    conceptTitle: '💡 核心概念：开炉之前，结果已经写在直线上',
    conceptLead: '先看一个让外行费解的新闻现象：某公司宣布融资几十亿美元，要建“十万卡集群”训练下一代模型 —— 钱还没花，CEO 已经敢向投资人保证新模型会强多少。要知道一次旗舰训练烧掉上亿美元、跑好几个月、中途不能重来，这种“赌局”怎么敢开？答案是：这根本不是赌局。2020 年 OpenAI 的研究者（Kaplan 等人）系统地做了一件笨功夫的事 —— 训练一大批从小到大的语言模型，记下每个的损失，然后发现了本课的主角。',
    contrastTagA: '直觉印象',
    contrastBigA: <>训大模型像炼丹 <span className="gap">→</span> 开炉前没人知道结果</>,
    contrastNoteA: '按这个理解，没有谁敢在训练前就向董事会承诺性能 —— 可厂商偏偏敢，而且一代接一代地敢。',
    contrastTagB: '真实机制',
    contrastBigB: <>损失沿幂律平滑下降，小模型画线、大模型<span className="hl">外推</span></>,
    contrastNoteB: '规模横跨好几个数量级，这条规律都不打弯。大模型的成绩，在开训之前就写在直线的延长线上。',
    conceptP1: <>先复习一个词：<b>损失（loss）</b>，就是预训练那场“猜下一个词”考试的平均错误程度（第 12 课），越低说明模型的语言功力越深。Kaplan 等人发现：把模型放大，损失的下降不是忽快忽慢的玄学，而是惊人地规律 ——<b>参数量每扩大 10 倍，损失就按一个固定的比例再降一截；数据量、算力也各自如此</b>。这种“每翻 10 倍、按固定比例改善”的规律，数学上叫<b>幂律</b>（power law）。你不需要记定义，只需要记它最值钱的性质：把坐标纸换成对数刻度（每一格代表 ×10），幂律曲线就变成一条<b>笔直的线</b> —— 而直线，是可以拿尺子往右延长的。于是整个流程变成四步：</>,
    useCards1: [
      { label: '第 1 步 · 便宜', en: <>训<b>一排小模型</b></>, zh: '从小到大训一串模型，每个都便宜，几天就出结果 —— 成本只是目标大模型的千分之一、万分之一。' },
      { label: '第 2 步 · 描点', en: <>对数纸上<b>描点</b></>, zh: '横轴是规模、纵轴是损失，都换成对数刻度，把每个小模型的成绩点上去。' },
      { label: '第 3 步 · 连线', en: <>点连成<b>直线</b></>, zh: '幂律保证这些点近乎完美地排在一条直线上 —— 这是大自然送给 AI 行业的礼物。' },
      { label: '第 4 步 · 外推', en: <>沿直线<b>外推</b></>, zh: '把直线延长 100 倍、10000 倍，读出还没训的大模型会“考多少分”，再决定砸不砸钱。' },
    ],
    conceptP2: '这不是纸面理论，是被反复验证过的工程实践 —— 最有名的一次验证来自 GPT-4：',
    exampleEnA: 'GPT-4 技术报告（2023）：用算力不到它万分之一的小模型做实验，提前准确预测了 GPT-4 训练完成后的最终损失。',
    exampleZhA: <>上亿美元的训练还没开始，结果已经先被“算”出来了。“大力出奇迹”第一次有了数学保证 —— 这就是大模型军备竞赛的底层逻辑：<b>敢砸钱，是因为回报可以预读。</b></>,
    conceptP3: '把你见过的新闻现象和这条规律连上线：',
    matchHead1: ['你在新闻 / 产品里看到的', '背后的机制'],
    matchRows1: [
      [<><b>“万卡集群”“百亿融资”，听起来像疯狂豪赌</b></>, '幂律让回报提前可算 —— 这是工程预算，不是赌博'],
      [<><b>每代模型发布前，业内就默认“下一代会更强”</b></>, '三条幂律线还没走平，外推的延长线上写着“继续变强”'],
      [<><b>模型名字里的 7B、70B、405B</b></>, '参数量（Billion，十亿）是幂律三轴之一，规模最直观的标尺'],
      [<><b>GPT-4 还没发布，OpenAI 内部已知道它大概多强</b></>, '小模型实验 + 外推，万分之一的算力提前锁定答案'],
    ],
    conceptP4: <>不过注意两件事。第一，幂律预测的是<b>损失</b> —— 一张几十万道猜词题的<b>平均成绩单</b>；平均分可以外推，“会不会做某一类题”却未必跟着平均分平滑变化（涌现一节见）。第二，“参数、数据、算力”三个轴该按什么比例加大，2020 年的论文给出了一个<b>误导业界两年</b>的答案 —— 先说这件事。</>,

    chinTitle: '📖 Chinchilla：光堆参数不够，参数和数据要配平',
    chinLead: '一次训练烧掉的算力，大致由两样东西相乘决定：模型多大（参数量）× 喂了多少数据（token 数）。预算固定时，这是一道分配题 —— 要更大的脑袋，还是让脑袋多读书？2020 年的论文给的答案偏向“脑袋优先”，于是业界掀起一场纯粹的参数竞赛：GPT-3 1750 亿、Gopher 2800 亿、Megatron-Turing 5300 亿……参数翻了几倍，喂的数据却几乎停在原地（几千亿 token 上下）。',
    chinP1: <>2022 年，DeepMind 决定重做这道分配题：训练 <b>400 多个</b>不同“大小 × 饭量”组合的模型，逐一比较同样预算下谁最强。结论震动业界 ——<b>最优配比大约是每 1 个参数配 20 个 token</b>。按这把尺子一量，当时所有的巨无霸模型集体“露馅”：</>,
    exampleEnB: 'Gopher：2800 亿参数，按配比该喂约 5.6 万亿 token —— 实际只喂了约 3000 亿，不到所需的二十分之一。',
    exampleZhB: <>一身巨人的骨架，没吃过几顿饱饭 —— 这就是“<b>营养不良</b>”：钱大量花在撑大脑容量上，脑子里却没装进足够的世界。参数是潜力，数据才是把潜力填满的东西。</>,
    chinP2: <>DeepMind 顺手做了一次公开处刑式的验证：按新配比训练一个叫 <b>Chinchilla</b>（龙猫）的模型 —— 参数只有 Gopher 的四分之一，数据却多喂四倍多，总算力两者相同：</>,
    chinTableHead: ['', 'Gopher（2021）', 'Chinchilla（2022）'],
    chinTableRows: [
      ['参数量', '2800 亿', <>700 亿（只有 1/4）</>],
      ['训练数据', '约 3000 亿 token', <>约 1.4 万亿 token（4 倍多）</>],
      ['训练算力', '相同', '相同'],
      ['成绩', '营养不良的巨人', <>吃饱饭的小个子，<b>全面胜出</b></>],
    ],
    chinP3: <>同样的钱，换个分法，白捡一截性能 —— 此后所有前沿实验室的训练配方都被改写。至于 2020 年为什么算错，复盘原因相当技术化（一些训练设置没随规模调对，导致低估了数据的价值），对我们重要的是教训：<b>Scaling 不是无脑堆某一个轴，三个轴要配平着一起放大。</b></>,
    chinP4: '但故事还有反转：20 : 1 是“训练预算固定”下的最优解，后来大家发现真正该算的是另一本账 —— 模型训完要被调用亿万次，小模型每次调用便宜得多。于是厂商开始故意“过量喂养”：给几十亿参数的小模型喂上十几万亿 token（每参数上千个，远超 20 : 1），多花的训练费靠之后亿万次的便宜调用赚回来。你手机上能离线跑动的那些小模型，多半就是这么喂出来的。这不是 Chinchilla 错了，而是优化目标从“训练最划算”换成了“训练 + 服务总账最划算”—— 法则没变，账本变了。',

    emgTitle: '📖 涌现：平均分平滑上涨，某些题突然会做',
    emgLead: '用过不同代模型的人都有这种体感：给上一代模型出一道多步应用题，它一本正经地胡说；换下一代，突然就会一步步算了。能力似乎不是“渐渐变好”，而是“某天突然开窍”。这和幂律的“平滑”矛盾吗？先看现场：',
    exampleEnC: '题目：筐里有 23 个苹果，先拿走 7 个，剩下的平分给 4 个人，每人分到几个？',
    exampleZhC: <><b>规模不够的模型：</b>「每人分 5 个。」—— 张口就答，自信且错；追问过程，它还会现编一段看似合理的“算法”。<b>跨过临界规模的模型：</b>「先算剩余：23 拿走 7，还剩 16；再平分：16 个分给 4 人，每人 4 个。」—— 不仅答对，还开始自发列步骤。在标准评测里，这类任务的得分曲线长期贴着 0%，跨过某个规模后陡然蹿到很高 —— 研究者把这种跳变叫<b>涌现</b>（emergence）。</>,
    emgP1: <>为什么平均分平滑、单项却会跳？关键在于：损失是几十万道猜词题的<b>平均</b>成绩，平均分稳步上涨，完全不妨碍“某一类题”原地踏步很久再猛涨。把多步题想成<b>走钢丝</b>就懂了：四步推理，一步踩空、满盘皆输，而评测通常也只认“全对”。现在让模型平滑进步 —— 每一步的把握从五成涨到八成、再到九成五：每步五成时，四步连对的机会不到一成；每步八成，也才四成左右；每步九成五，四步连对一下子到了八成多。<b>单步能力在平滑爬坡，“全对率”却先趴在地板上很久，然后猛地起跳</b> —— 平滑的内功，配上“全对才得分”的考法，天然长出一条 S 形跳变曲线。被报告过涌现的能力还有不少：多位数算术、思维链推理（「让我们一步一步想」这句咒语只对足够大的模型有效，第 23 课细讲）、理解复杂的多重指令……</>,
    emgP2: <>不过要诚实补充一盆冷水。2023 年斯坦福的研究者发表了一篇标题就很挑衅的论文 ——《涌现能力是海市蜃楼吗？》：同一批模型、同一个任务，把“全对才得分”换成“按步骤给部分分”的平滑指标，<b>不少著名的陡峭跳变立刻变回平缓爬坡</b>。跳的可能不是能力，是量尺。学界至今争论：有些任务换了平滑指标依然陡峭，“真涌现”可能存在；但至少可以确定，一部分轰动一时的“涌现”是评分方式造出的视觉效果，而不是模型内部发生了什么神秘质变。</>,
    emgP3: <>对你真正重要的结论只有一条：<b>平均损失可以提前算，单项能力何时出现，至今没人能提前算。</b>幂律给军备竞赛上了保险，涌现（无论真假）给它留了悬念 —— 所以厂商训完新模型，还得跑几千个评测才知道这一代“突然会了”什么。可预测与不可预测，正好是本课交互演示的两张图。</>,

    demoSecTitle: '🎛️ 交互演示：Scaling 的两副面孔',
    demoSecLead: '图一是 Scaling Laws 的“保险单”：对数坐标纸上三条直线，左半段实心点是真实训过的小模型，右半段虚线是外推 —— 大模型还没训，成绩已写在线上。图二是涌现的“悬念”：同一时期平均损失平滑下降（灰色虚线），「多步算术全对率」却在临界规模处猛然蹿升。两张都是手绘示意图，重在形状，别抠数值。',

    ceilTitle: '🧭 天花板之争：大力还能出多久的奇迹',
    ceilLead: '故事讲到 2024 年，画风变了。三条幂律线在数学上依然成立 —— 问题是，沿着线往右走的“路费”开始失控。业界开始公开讨论：纯堆参数这条路，是不是快到头了？',
    ceilCards: [
      { label: '第一堵墙 · 数据', en: <>高质量数据<b>接近用尽</b></>, zh: '幂律要的是优质 token，而公开互联网的高质量文本是有限的 —— 前沿模型一次训练吞掉的数据量，与研究机构估计的“全网精华存量”已是同一数量级。复印更多低质网页，喂不出更聪明的模型。' },
      { label: '第二堵墙 · 成本', en: <>花费<b>指数级上涨</b></>, zh: '在对数轴上右移一格，等于真金白银 ×10。旗舰训练成本已是亿美元级，下一代普遍估计要到十亿美元级（具体数字各家讳莫如深，记数量级即可），电力和芯片同样吃紧。' },
      { label: '更扎心的 · 收益', en: <>提升的<b>体感在变钝</b></>, zh: '这其实是幂律自己的预言：越往右，同样 ×10 的投入换来的损失下降越小。损失还在降，但用户那一声“哇”越来越贵 —— 性价比曲线先于幂律弯了腰。' },
    ],
    ceilP1: '于是从 2024 年起，前沿竞争转向了新轴线 —— 不是放弃 Scaling，而是换地方 Scaling：',
    ceilCards2: [
      { label: '新轴线 ① · 第 23 课预告', en: <>测试时计算：<b>答题时多想</b></>, zh: '与其把算力全砸在训练上，不如让模型答题前多“思考”几步 —— 2024 年底 OpenAI 的 o 系列、2025 年初 DeepSeek-R1 把这条路线推成主流。规模竞赛没有结束，只是从“训练时堆”转向“回答时堆”。' },
      { label: '新轴线 ② · 数据墙的解法', en: <>数据质量与<b>合成数据</b></>, zh: '从“喂更多”转向“喂更好”：精筛、改写，甚至用强模型生成“教材级”训练数据再喂给下一代。同样的算力，一份好数据顶几份烂数据 —— 这是被数据墙逼出来的新工艺。' },
    ],
    ceilFootnote: '“Scaling 已死”和“Scaling 万岁”都是标题党。2025 年的公认现状是：大力仍然出奇迹，但奇迹的单价在飞涨；前沿实验室一边继续堆规模，一边把更多筹码押向新轴线 —— 力气还得使，关键变成了往哪使。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '幂律这么可靠，规模无限堆下去必然到达 AGI',
        good: '幂律保证的只是“猜词平均错误”平滑下降，不等于所有能力线性变强；数据、成本、电力也各有物理上限',
        why: <><b>病因：</b>把“损失”这张平均成绩单错当成“智能”本身。损失逼近极限时还剩多少能力提升，没人能从幂律里读出来 —— 涌现之争恰恰说明单项能力与平均分并不同步。而且直线往右每走一格都要真金白银 ×10：数学上的直线，撞的是物理上的墙（数据墙、成本墙）。</>,
      },
      {
        bad: 'Scaling Laws 时代，小模型没有价值',
        good: '蒸馏后的小模型 + 端侧部署是另一条重要战线 —— 手机、汽车、隐私场景全指着它',
        why: <><b>病因：</b>只盯着“最强”，忘了“够用、便宜、离线”。让大模型当老师，把本事“蒸馏”进小模型（第 27 课细讲），再配上 Chinchilla 式的“过量喂养”，几十亿参数就能覆盖大量日常任务 —— 单次调用成本差几个数量级，端侧运行还不用上传数据。前沿在堆规模，产业在缩规模，两条战线同时成立。</>,
      },
      {
        bad: '“涌现”说明模型在某一刻突然开窍，甚至萌生了意识',
        good: '涌现描述的是评测分数的跳变；模型内部能力是连续爬坡的，部分跳变还可能是评分方式造出的假象',
        why: <><b>病因：</b>拟人化 + 媒体偏爱戏剧性叙事。模型没有“开窍瞬间”：单步能力一直在平滑提升，是“全对才得分”的考法把平缓爬坡显示成了起跳（走钢丝效应）。把分数跳变脑补成“觉醒”，就从科学滑进了科幻。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 某实验室要训下一代旗舰模型：预计烧掉十亿美元、训练半年、中途不能重来。董事会问 CEO：“你怎么保证训出来不翻车？”请替 CEO 用本课内容回答。',
        a: <><b>先小后大，画线外推。</b>先训一排成本只有目标模型千分之一、万分之一的小模型，把损失点在对数坐标纸上 —— 幂律保证这些点排成直线；把直线延长到目标规模，开训前就能读出大模型的最终损失。GPT-4 正是这么做的：技术报告称用不到其万分之一算力的小模型，提前准确预测了最终损失。诚实的 CEO 还该补一句：能预测的是<b>平均损失</b>，某项具体能力（比如多步推理）何时出现，目前没人能提前算。</>,
      },
      {
        q: '2. 朋友说：“算力预算固定的话，当然全砸参数，模型越大越聪明。”用 Chinchilla 的发现反驳他，并解释为什么今天的厂商反而常给小模型“过量喂数据”。',
        a: <><b>参数和数据要配平。</b>DeepMind 2022 年训了 400 多个模型找最优配比：训练预算固定时，每 1 个参数大约配 20 个 token 最划算。光堆参数等于“长骨架不吃饭”—— 吃饱饭的 700 亿参数 Chinchilla，全面胜过 4 倍大却营养不良的 Gopher（两者算力相同）。至于“过量喂养”：20 : 1 只是<b>训练成本</b>最优，而模型训完要被调用亿万次，小模型每次调用便宜得多 —— 多花训练费换一个更小更便宜的模型，总账反而划算，所以几十亿参数的小模型常被喂到每参数上千个 token。</>,
      },
      {
        q: '3. 一篇论文宣称“我们的模型在 X 任务上出现了涌现”。基于本课的“海市蜃楼”之争，你该追问哪两个问题？',
        a: <>① <b>评分是不是“全对才得分”？</b>多步任务用全对率打分，天然会把平滑的单步进步显示成 S 形跳变 —— 走钢丝效应。② <b>换成给部分分的平滑指标，曲线还跳吗？</b>2023 年斯坦福的研究发现，不少著名“涌现”换把量尺就变回平缓爬坡。两问之后曲线依然陡峭，才值得认真讨论“真涌现”—— 但无论真假，“单项能力无法提前预测”这一点都成立。</>,
      },
    ],
  },

  en: {
    info: {
      pow: { title: 'Power-law decline: a straight line you can extrapolate', period: 'OpenAI 2020 · Kaplan et al. / DeepMind 2022',
        desc: 'Once both axes are switched to log scale, loss falls along a straight line as parameters, data, and compute each scale up. Solid dots = small models actually trained; dashed line and hollow dots = extending the line with a ruler to "read ahead" the score of a big model not yet trained.',
        tags: ['Predictable', 'Small first, then big', 'The arms race\'s insurance policy'],
        note: 'The three lines are offset vertically only for clarity, and the slopes are hand-drawn illustrations; in the real papers the x-axis spans seven-plus orders of magnitude, and the dots still fall on a straight line.' },
      emg: { title: 'Emergent jump: flat for ages, then a sudden leap', period: 'Wei et al. 2022 · multi-step arithmetic (illustrative)',
        desc: 'Gray dashed line: average loss falls smoothly throughout, no anomalies. Red line: "multi-step arithmetic full-correct rate" hugs near zero before the critical scale, then shoots up sharply past it — this is the phenomenon called "emergence."',
        tags: ['Critical scale', 'Score only if fully correct', 'Still debated'],
        note: 'A reminder: switch to a "partial credit per step" yardstick and this red line may turn back into a gentle climb — whether the jump is real is still debated in the field.' },
    },
    powLabels: { param: 'Parameters', data: 'Data', compute: 'Compute' },

    demoTitle: '🎛️ Interactive · Predictable loss vs. unpredictable abilities',
    demoHint: 'Tap the pills on the right to switch figures',
    powAria: 'Schematic: under log coordinates, loss falls along a straight line as parameters, data, and compute each scale up',
    powYAxis: 'Loss (lower is better · log scale)',
    schematic: 'Schematic · not real data',
    powXAxis: 'Scale →(log scale · each cell = ×10)',
    powMeasured: 'Measured: a row of cheap small models',
    powExtrap: 'Extrapolation: keep drawing the line',
    powHollow: 'Hollow dots = the predicted big models',
    emgAria: 'Schematic: once model scale crosses the critical point, the multi-step arithmetic full-correct rate jumps sharply',
    emgYAxis: '"Multi-step arithmetic" full-correct rate',
    emgXAxis: 'Model scale →(log scale)',
    emgAvgLoss: 'Average loss: still falling smoothly (a different yardstick · illustrative)',
    emgCritical: 'Critical scale',
    emgFloor: 'Long stuck on the floor: almost all wrong',
    emgJump: 'Suddenly gets it',
    figChips: [['pow', 'Fig. 1 · Power-law decline'], ['emg', 'Fig. 2 · Emergent jump']],
    focusLabel: 'Focus on one line:',
    focusChips: [['all', 'All'], ['param', 'Parameters'], ['data', 'Data'], ['compute', 'Compute']],

    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>Grasp the underlying logic of the large-model arms race: power laws let you "read ahead," before training even starts, how strong $100M can buy</>,
      <>Master the Chinchilla balancing rule: parameters and data must be fed in proportion (the rule of thumb is about 20 tokens per parameter); piling on parameters alone is "malnutrition"</>,
      <>Understand emergence and its controversy: why average scores rise smoothly yet multi-step reasoning seems to "suddenly click" — and why this may be an illusion created by the scoring method</>,
      <>See the post-2024 shift: returns from piling on parameters alone slow down, and the frontier bets on test-time compute and data quality (previewed in Lesson 23)</>,
    ],

    conceptTitle: '💡 Core Idea: before the furnace is lit, the result is already written on the line',
    conceptLead: 'First, a news phenomenon that baffles outsiders: a company announces it has raised billions of dollars to build a "100,000-GPU cluster" to train its next-generation model — before a cent is spent, the CEO already dares to promise investors how much stronger the new model will be. Keep in mind that a single flagship training run burns over $100M, takes months, and can\'t be redone midway — how dare anyone open such a "bet"? The answer: it isn\'t a bet at all. In 2020, OpenAI\'s researchers (Kaplan et al.) did a piece of grindingly tedious work — training a whole batch of language models from small to large, recording each one\'s loss, and then discovering the star of this lesson.',
    contrastTagA: 'Gut impression',
    contrastBigA: <>Training a big model is like alchemy <span className="gap">→</span> no one knows the result before the furnace is opened</>,
    contrastNoteA: 'On this view, no one would dare promise the board a performance figure before training — yet vendors do exactly that, generation after generation.',
    contrastTagB: 'The real mechanism',
    contrastBigB: <>Loss falls smoothly along a power law; small models draw the line, big models <span className="hl">extrapolate</span></>,
    contrastNoteB: 'Across several orders of magnitude in scale, this law never bends. A big model\'s score is written on the line\'s extension before training even begins.',
    conceptP1: <>First, a refresher on one word: <b>loss</b>, the average degree of error on that pretraining "guess the next word" exam (Lesson 12) — the lower it is, the deeper the model\'s command of language. Kaplan et al. found that as you scale a model up, the fall in loss isn\'t fickle voodoo but astonishingly regular — <b>every 10× increase in parameters drops the loss by a fixed proportion; the same holds for data and compute</b>. This pattern of "improving by a fixed proportion per 10×" is called, in math, a <b>power law</b>. You don\'t need to memorize the definition, just its most valuable property: switch the graph paper to log scale (each cell represents ×10) and the power-law curve becomes a <b>perfectly straight line</b> — and a straight line can be extended to the right with a ruler. So the whole process boils down to four steps:</>,
    useCards1: [
      { label: 'Step 1 · Cheap', en: <>Train <b>a row of small models</b></>, zh: 'Train a series of models from small to large; each is cheap and finishes in a few days — the cost is just a thousandth or ten-thousandth of the target big model.' },
      { label: 'Step 2 · Plot', en: <><b>Plot points</b> on log paper</>, zh: 'The x-axis is scale and the y-axis is loss, both on log scale; plot each small model\'s score.' },
      { label: 'Step 3 · Connect', en: <>Connect into a <b>straight line</b></>, zh: 'The power law guarantees these points fall almost perfectly on a straight line — nature\'s gift to the AI industry.' },
      { label: 'Step 4 · Extrapolate', en: <><b>Extrapolate</b> along the line</>, zh: 'Extend the line 100×, 10,000×, read off what "score" the untrained big model will get, then decide whether to spend the money.' },
    ],
    conceptP2: 'This isn\'t paper theory but repeatedly validated engineering practice — the most famous validation comes from GPT-4:',
    exampleEnA: 'GPT-4 technical report (2023): using small models with less than a ten-thousandth of its compute, they accurately predicted GPT-4\'s final loss before training was finished.',
    exampleZhA: <>Before the $100M+ training run had even started, the result had already been "computed" in advance. "Scale brings miracles" had, for the first time, a mathematical guarantee — and this is the underlying logic of the large-model arms race: <b>they dare to spend big because the return can be read ahead.</b></>,
    conceptP3: 'Connect the news phenomena you\'ve seen to this law:',
    matchHead1: ['What you see in the news / products', 'The mechanism behind it'],
    matchRows1: [
      [<><b>"10,000-GPU clusters," "billion-dollar funding" — sounds like an insane gamble</b></>, 'Power laws make the return computable in advance — this is an engineering budget, not a gamble'],
      [<><b>Before each generation ships, the industry assumes "the next one will be stronger"</b></>, 'The three power-law lines haven\'t flattened yet; the extrapolated extension reads "keeps getting stronger"'],
      [<><b>The 7B, 70B, 405B in model names</b></>, 'Parameter count (Billion) is one of the power law\'s three axes — the most intuitive yardstick of scale'],
      [<><b>Before GPT-4 shipped, OpenAI internally already knew roughly how strong it would be</b></>, 'Small-model experiments + extrapolation locked in the answer ahead of time with a ten-thousandth of the compute'],
    ],
    conceptP4: <>But note two things. First, power laws predict <b>loss</b> — an <b>average report card</b> over hundreds of thousands of word-guessing questions; the average can be extrapolated, but "whether it can do a certain type of question" doesn\'t necessarily change smoothly with the average (see the emergence section). Second, regarding what proportions to scale the three axes — "parameters, data, compute" — the 2020 paper gave an answer that <b>misled the industry for two years</b> — let\'s talk about that first.</>,

    chinTitle: '📖 Chinchilla: parameters alone aren\'t enough; parameters and data must be balanced',
    chinLead: 'The compute burned by one training run is roughly the product of two things: how big the model is (parameter count) × how much data it\'s fed (token count). With a fixed budget, this is an allocation problem — a bigger brain, or more reading for the brain? The 2020 paper\'s answer leaned toward "brain first," so the industry launched a pure parameter race: GPT-3 175B, Gopher 280B, Megatron-Turing 530B... parameters multiplied several-fold, yet the data fed stayed almost put (a few hundred billion tokens).',
    chinP1: <>In 2022, DeepMind decided to redo this allocation problem: training <b>over 400</b> models with different "size × appetite" combinations, comparing one by one which was strongest under the same budget. The conclusion shook the industry — <b>the optimal ratio is about 20 tokens per parameter</b>. Measured by this yardstick, all the giant models of the time were collectively "exposed":</>,
    exampleEnB: 'Gopher: 280B parameters, which per the ratio should be fed about 5.6 trillion tokens — it was actually fed only about 300 billion, less than a twentieth of what it needed.',
    exampleZhB: <>A giant\'s frame that has rarely eaten its fill — this is "<b>malnutrition</b>": the money went largely into expanding the brain\'s capacity, but not enough of the world was packed into it. Parameters are potential; data is what fills that potential.</>,
    chinP2: <>DeepMind threw in a public-execution-style validation: training a model called <b>Chinchilla</b> under the new ratio — with only a quarter of Gopher\'s parameters but more than four times the data, the two using the same total compute:</>,
    chinTableHead: ['', 'Gopher (2021)', 'Chinchilla (2022)'],
    chinTableRows: [
      ['Parameters', '280B', <>70B (just 1/4)</>],
      ['Training data', 'About 300B tokens', <>About 1.4T tokens (4×+)</>],
      ['Training compute', 'Same', 'Same'],
      ['Result', 'A malnourished giant', <>A well-fed little one, <b>winning across the board</b></>],
    ],
    chinP3: <>Same money, a different split, free performance gained — and from then on every frontier lab\'s training recipe was rewritten. As for why the 2020 math was off, the post-mortem is fairly technical (some training settings weren\'t tuned with scale, leading to underestimating data\'s value); what matters to us is the lesson: <b>Scaling isn\'t mindlessly piling on one axis — all three axes must be scaled up in balance.</b></>,
    chinP4: 'But the story has a twist: 20 : 1 is the optimum under a "fixed training budget"; people later realized the real account to compute is a different one — once trained, a model gets called hundreds of millions of times, and a small model is far cheaper per call. So vendors started deliberately "over-feeding": feeding a few-billion-parameter small model tens of trillions of tokens (thousands per parameter, far beyond 20 : 1), recouping the extra training cost through the cheap calls that follow. Those small models that can run offline on your phone are mostly fed this way. This isn\'t Chinchilla being wrong; it\'s the optimization goal shifting from "cheapest to train" to "cheapest on the train + serve total account" — the law didn\'t change, the ledger did.',

    emgTitle: '📖 Emergence: average scores rise smoothly, yet certain problems are suddenly solved',
    emgLead: 'Anyone who has used different generations of models knows the feeling: give a previous-generation model a multi-step word problem and it confidently talks nonsense; switch to the next generation and it suddenly works through it step by step. Ability seems not to "gradually improve" but to "suddenly click one day." Does this contradict the "smoothness" of power laws? First, the scene:',
    exampleEnC: 'Question: a basket has 23 apples; take away 7, then split the rest evenly among 4 people — how many does each get?',
    exampleZhC: <><b>An undersized model:</b> "5 each." — answering off the cuff, confident and wrong; press it for the steps and it will fabricate a plausible-looking "algorithm." <b>A model past the critical scale:</b> "First the remainder: 23 take away 7 leaves 16; then split evenly: 16 among 4 people, 4 each." — not only correct, but spontaneously laying out the steps. In standard evaluations, the score curve for such tasks hugs 0% for a long time, then shoots up sharply past a certain scale — researchers call this jump <b>emergence</b>.</>,
    emgP1: <>Why is the average smooth yet a single item jumps? The key: loss is the <b>average</b> score over hundreds of thousands of word-guessing questions, and a steadily rising average is perfectly compatible with "a certain type of question" staying flat for a long time before surging. Think of multi-step problems as <b>walking a tightrope</b> and it clicks: four steps of reasoning — one misstep and the whole thing collapses, and evaluations usually only count "all correct." Now let the model improve smoothly — its confidence at each step rising from 50% to 80%, then to 95%: at 50% per step, the chance of four in a row is under 10%; at 80%, only about 40%; at 95%, four in a row suddenly reaches over 80%. <b>Single-step ability climbs smoothly, yet the "full-correct rate" stays on the floor for a long time, then suddenly leaps</b> — smooth inner skill, paired with a "score only if fully correct" test, naturally grows an S-shaped jump curve. Many other abilities have been reported as emergent: multi-digit arithmetic, chain-of-thought reasoning (the spell "let\'s think step by step" only works on sufficiently large models, detailed in Lesson 23), understanding complex multi-part instructions...</>,
    emgP2: <>But an honest splash of cold water is in order. In 2023, Stanford researchers published a paper with a deliberately provocative title — "Are Emergent Abilities a Mirage?": for the same set of models and the same task, switching "score only if fully correct" to a smooth "partial credit per step" metric, <b>many famous steep jumps immediately turned back into gentle climbs</b>. What jumped may not be the ability but the yardstick. The field still debates: some tasks stay steep even under a smooth metric, so "true emergence" may exist; but at least it\'s certain that some of the once-sensational "emergence" is a visual effect created by the scoring method, not some mysterious qualitative change inside the model.</>,
    emgP3: <>There\'s only one conclusion that really matters to you: <b>average loss can be computed in advance; when a single ability appears, no one can compute in advance to this day.</b> Power laws insure the arms race; emergence (real or not) leaves it with suspense — so after a vendor finishes a new model, they still have to run thousands of evaluations to learn what this generation "suddenly got." Predictable and unpredictable are exactly the two figures in this lesson\'s interactive demo.</>,

    demoSecTitle: '🎛️ Interactive Demo: the two faces of Scaling',
    demoSecLead: 'Figure 1 is Scaling Laws\' "insurance policy": three straight lines on log graph paper, with solid dots on the left half being small models actually trained and the dashed line on the right half being extrapolation — the big model isn\'t trained yet, but its score is already on the line. Figure 2 is emergence\'s "suspense": over the same period average loss falls smoothly (gray dashed line), yet the "multi-step arithmetic full-correct rate" suddenly shoots up at the critical scale. Both are hand-drawn schematics; focus on the shape, don\'t fuss over the numbers.',

    ceilTitle: '🧭 The ceiling debate: how long can scale keep making miracles',
    ceilLead: 'By the time the story reaches 2024, the mood has changed. The three power-law lines still hold mathematically — the problem is that the "toll" for walking rightward along them is spiraling out of control. The industry has begun openly discussing: is the pure-parameter-piling road nearly at its end?',
    ceilCards: [
      { label: 'Wall one · Data', en: <>High-quality data is <b>nearly exhausted</b></>, zh: 'Power laws want quality tokens, and high-quality text on the public internet is finite — the data one frontier training run devours is already the same order of magnitude as research institutes\' estimates of "the web\'s total premium stock." Copying more low-quality web pages won\'t feed out a smarter model.' },
      { label: 'Wall two · Cost', en: <>Spending rises <b>exponentially</b></>, zh: 'Moving one cell rightward on the log axis equals ×10 in real money. Flagship training costs are already in the $100M range; the next generation is widely estimated to reach the $1B range (vendors stay tight-lipped about exact figures, so just remember the order of magnitude), and power and chips are equally strained.' },
      { label: 'More painful · Returns', en: <>The perceived gain is <b>dulling</b></>, zh: 'This is actually the power law\'s own prophecy: the farther right you go, the smaller the loss drop bought by the same ×10 investment. Loss is still falling, but the user\'s "wow" gets ever more expensive — the value-for-money curve bent before the power law did.' },
    ],
    ceilP1: 'So from 2024 on, frontier competition shifted to new axes — not abandoning Scaling, but Scaling elsewhere:',
    ceilCards2: [
      { label: 'New axis ① · Lesson 23 preview', en: <>Test-time compute: <b>think more when answering</b></>, zh: 'Rather than pouring all compute into training, let the model "think" a few more steps before answering — OpenAI\'s o series in late 2024 and DeepSeek-R1 in early 2025 pushed this route into the mainstream. The scale race isn\'t over; it just shifted from "piling on at training time" to "piling on at answer time."' },
      { label: 'New axis ② · The data-wall fix', en: <>Data quality and <b>synthetic data</b></>, zh: 'Shifting from "feed more" to "feed better": careful filtering, rewriting, even using strong models to generate "textbook-grade" training data to feed the next generation. With the same compute, one batch of good data is worth several batches of bad — a new craft forced into being by the data wall.' },
    ],
    ceilFootnote: '"Scaling is dead" and "long live Scaling" are both clickbait. The consensus reality in 2025 is: scale still makes miracles, but the unit price of a miracle is soaring; frontier labs keep piling on scale while placing more chips on the new axes — effort is still needed, the key has become where to spend it.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Power laws are so reliable that piling on scale indefinitely must reach AGI',
        good: 'Power laws only guarantee a smooth fall in "average word-guessing error," which doesn\'t equal all abilities scaling linearly; data, cost, and power each have physical limits too',
        why: <><b>Cause:</b> mistaking "loss," an average report card, for "intelligence" itself. How much ability gain remains as loss approaches its limit — no one can read that off the power law — and the emergence debate shows precisely that single abilities and the average aren\'t in sync. Plus, every cell rightward along the line costs ×10 in real money: the mathematical straight line crashes into physical walls (the data wall, the cost wall).</>,
      },
      {
        bad: 'In the Scaling Laws era, small models have no value',
        good: 'Distilled small models + on-device deployment are another important front — phones, cars, and privacy-sensitive scenarios all depend on them',
        why: <><b>Cause:</b> fixating only on "the strongest," forgetting "good enough, cheap, offline." Let a big model be the teacher and "distill" its skills into a small model (detailed in Lesson 27), pair that with Chinchilla-style "over-feeding," and a few billion parameters can cover plenty of everyday tasks — orders of magnitude cheaper per call, and running on-device avoids uploading data. The frontier is piling on scale, the industry is shrinking it, and both fronts hold at once.</>,
      },
      {
        bad: '"Emergence" means the model suddenly clicks at some moment, perhaps even gaining consciousness',
        good: 'Emergence describes a jump in evaluation scores; the model\'s internal ability climbs continuously, and some jumps may even be an illusion created by the scoring method',
        why: <><b>Cause:</b> anthropomorphism + the media\'s love of dramatic narratives. The model has no "moment of clicking": single-step ability improves smoothly all along, and it\'s the "score only if fully correct" test that displays a gentle climb as a leap (the tightrope effect). Imagining a score jump as "awakening" slides from science into science fiction.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A lab is about to train its next-generation flagship: expected to burn $1B, train for half a year, with no redo midway. The board asks the CEO: "How do you guarantee it won\'t flop?" Answer for the CEO using this lesson.',
        a: <><b>Small first, then big; draw the line and extrapolate.</b> First train a row of small models costing only a thousandth or ten-thousandth of the target model, and plot the loss on log graph paper — power laws guarantee these points fall on a straight line; extend the line to the target scale and you can read off the big model\'s final loss before training starts. GPT-4 did exactly this: the technical report says small models with less than a ten-thousandth of its compute accurately predicted the final loss in advance. An honest CEO should add: what can be predicted is the <b>average loss</b>; when a specific ability (like multi-step reasoning) appears, no one can compute in advance for now.</>,
      },
      {
        q: '2. A friend says: "With a fixed compute budget, of course pour it all into parameters — the bigger the model, the smarter." Rebut them with Chinchilla\'s finding, and explain why today\'s vendors instead often "over-feed data" to small models.',
        a: <><b>Parameters and data must be balanced.</b> In 2022 DeepMind trained over 400 models to find the optimal ratio: under a fixed training budget, about 20 tokens per parameter is most economical. Piling on parameters alone is "growing a frame without eating" — the well-fed 70B-parameter Chinchilla beat the 4×-bigger but malnourished Gopher across the board (both with the same compute). As for "over-feeding": 20 : 1 is only optimal for <b>training cost</b>, while a trained model gets called hundreds of millions of times, and a small model is far cheaper per call — spending more on training to get a smaller, cheaper model makes the total account worth it, so few-billion-parameter small models are often fed thousands of tokens per parameter.</>,
      },
      {
        q: '3. A paper claims "our model showed emergence on task X." Based on this lesson\'s "mirage" debate, which two questions should you press?',
        a: <>① <b>Is the scoring "score only if fully correct"?</b> Grading multi-step tasks by full-correct rate naturally displays smooth single-step progress as an S-shaped jump — the tightrope effect. ② <b>Switch to a smooth partial-credit metric — does the curve still jump?</b> Stanford\'s 2023 research found many famous "emergences" turn back into gentle climbs once the yardstick changes. Only if the curve stays steep after both questions is "true emergence" worth serious discussion — but real or not, "single abilities can\'t be predicted in advance" holds either way.</>,
      },
    ],
  },
}

function ScalingDemo({ c }) {
  const [fig, setFig] = useState('pow')
  const [focus, setFocus] = useState('all')
  const d = c.info[fig]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          {fig === 'pow' ? (
            <svg id="demo-pow" className={`lx-enter${focus !== 'all' ? ' focus' : ''}`} viewBox="0 0 460 300" width="440" aria-label={c.powAria}>
              <text x="60" y="16" fontSize="11" fill="var(--fg-2)">{c.powYAxis}</text>
              <text x="436" y="16" textAnchor="end" fontSize="11" fill="var(--fg-2)">{c.schematic}</text>
              <line x1="60" y1="24" x2="60" y2="252" stroke="var(--fg-2)" strokeWidth="1" />
              <line x1="60" y1="252" x2="440" y2="252" stroke="var(--fg-2)" strokeWidth="1" />
              {[132, 204, 276, 348, 420].map((x) => <line key={x} x1={x} y1="252" x2={x} y2="257" stroke="var(--fg-2)" strokeWidth="1" />)}
              <text x="250" y="280" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.powXAxis}</text>
              <line x1="270" y1="30" x2="270" y2="252" stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="3 5" />
              <text x="165" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-1)">{c.powMeasured}</text>
              <text x="352" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-1)">{c.powExtrap}</text>
              <text x="352" y="56" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">{c.powHollow}</text>
              {POW_LINES.map((ln) => (
                <g key={ln.key} className={`pl-line${focus === ln.key ? ' hot' : ''}`}>
                  <text x="74" y={ln.ly} fontSize="12" fontWeight="700" fill={ln.color}>{c.powLabels[ln.key]}</text>
                  <path d={ln.solid} fill="none" stroke={ln.color} strokeWidth="2.5" />
                  <path d={ln.dash} fill="none" stroke={ln.color} strokeWidth="2" strokeDasharray="6 6" opacity="0.85" />
                  {ln.dots.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="3" fill={ln.color} />)}
                  <circle cx={ln.hollow[0]} cy={ln.hollow[1]} r="4.5" fill="var(--bg-card)" stroke={ln.color} strokeWidth="2" />
                </g>
              ))}
            </svg>
          ) : (
            <svg id="demo-emg" className="lx-enter" viewBox="0 0 460 300" width="440" aria-label={c.emgAria}>
              <text x="60" y="16" fontSize="11" fill="var(--fg-2)">{c.emgYAxis}</text>
              <text x="436" y="16" textAnchor="end" fontSize="11" fill="var(--fg-2)">{c.schematic}</text>
              <line x1="60" y1="24" x2="60" y2="252" stroke="var(--fg-2)" strokeWidth="1" />
              <line x1="60" y1="252" x2="440" y2="252" stroke="var(--fg-2)" strokeWidth="1" />
              <line x1="56" y1="48" x2="60" y2="48" stroke="var(--fg-2)" strokeWidth="1" />
              <line x1="56" y1="150" x2="60" y2="150" stroke="var(--fg-2)" strokeWidth="1" />
              <text x="52" y="52" textAnchor="end" fontSize="10" fill="var(--fg-2)">100%</text>
              <text x="52" y="154" textAnchor="end" fontSize="10" fill="var(--fg-2)">50%</text>
              <text x="52" y="252" textAnchor="end" fontSize="10" fill="var(--fg-2)">0%</text>
              <text x="250" y="280" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.emgXAxis}</text>
              <path d="M70,84 C190,112 310,142 430,166" fill="none" stroke="var(--fg-2)" strokeWidth="2" strokeDasharray="7 5" opacity="0.75" />
              <text x="76" y="70" fontSize="11" fill="var(--fg-2)">{c.emgAvgLoss}</text>
              <line x1="320" y1="34" x2="320" y2="252" stroke="var(--terracotta)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
              <text x="320" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--terracotta)">{c.emgCritical}</text>
              <path d="M70,249 C150,248 220,246 268,241 C300,237 312,180 330,130 C348,80 372,66 430,61" fill="none" stroke="var(--terracotta)" strokeWidth="2.5" />
              {EMG_DOTS.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="3.5" fill="var(--terracotta)" />)}
              <text x="175" y="228" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-1)">{c.emgFloor}</text>
              <text x="392" y="46" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--terracotta)">{c.emgJump}</text>
            </svg>
          )}
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.figChips.map(([k, label]) => (
              <button key={k} className={`chip${k === fig ? ' active' : ''}`} onClick={() => setFig(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
          {fig === 'pow' && (
            <div>
              <div className="lx-sub">{c.focusLabel}</div>
              <div className="chips">
                {c.focusChips.map(([k, label]) => (
                  <button key={k} className={`chip${k === focus ? ' active' : ''}`} onClick={() => setFocus(k)}>{label}</button>
                ))}
              </div>
            </div>
          )}
          <p className="lx-note">{d.note}</p>
        </div>
      </div>
    </div>
  )
}

export default function L15() {
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
            <div className="tag"><span className="pill pill-ink">{c.contrastTagA}</span></div>
            <div className="big">{c.contrastBigA}</div>
            <p className="note">{c.contrastNoteA}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastTagB}</span></div>
            <div className="big">{c.contrastBigB}</div>
            <p className="note">{c.contrastNoteB}</p>
          </div>
        </div>
        <p className="lead mt14">{c.conceptP1}</p>
        <div className="use-grid cols-4">
          {c.useCards1.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.conceptP2}</p>
        <div className="example">
          <div className="en">{c.exampleEnA}</div>
          <div className="zh">{c.exampleZhA}</div>
        </div>
        <p className="lead mt14">{c.conceptP3}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead1[0]}</th><th>{c.matchHead1[1]}</th></tr></thead>
            <tbody>
              {c.matchRows1.map((r, i) => (
                <tr key={i}><td>{r[0]}</td><td className="ex">{r[1]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.conceptP4}</p>
      </Lsec>

      <Lsec
        title={c.chinTitle}
        lead={c.chinLead}
      >
        <p className="lead">{c.chinP1}</p>
        <div className="example">
          <div className="en">{c.exampleEnB}</div>
          <div className="zh">{c.exampleZhB}</div>
        </div>
        <p className="lead mt14">{c.chinP2}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.chinTableHead[0]}</th><th>{c.chinTableHead[1]}</th><th>{c.chinTableHead[2]}</th></tr></thead>
            <tbody>
              {c.chinTableRows.map((r, i) => (
                <tr key={i}><td className="be">{r[0]}</td><td className="ex">{r[1]}</td><td className="ex">{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.chinP3}</p>
        <p className="lead">{c.chinP4}</p>
      </Lsec>

      <Lsec
        title={c.emgTitle}
        lead={c.emgLead}
      >
        <div className="example">
          <div className="en">{c.exampleEnC}</div>
          <div className="zh">{c.exampleZhC}</div>
        </div>
        <p className="lead mt14">{c.emgP1}</p>
        <p className="lead">{c.emgP2}</p>
        <p className="lead">{c.emgP3}</p>
      </Lsec>

      <Lsec
        title={c.demoSecTitle}
        lead={c.demoSecLead}
      >
        <ScalingDemo c={c} />
      </Lsec>

      <Lsec
        title={c.ceilTitle}
        lead={c.ceilLead}
      >
        <div className="use-grid">
          {c.ceilCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.ceilP1}</p>
        <div className="use-grid cols-2">
          {c.ceilCards2.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote mt14">{c.ceilFootnote}</p>
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
