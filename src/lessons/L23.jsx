import { useState } from 'react'
import { Lsec, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / id / 交互 / 数值 / SVG 几何均不变，仅可见文本按语言取用。
// 富文本（含内联 JSX）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    rmMode: {
      fast: { title: '直答模式 = 系统 1', period: '一次前向押答案 · 每个 token 思考量恒定',
        desc: '模型读完题，下一个 token 就得开始写答案 ——“假设、算差、换算”几步连环全压进一次前向计算里。像被主持人逼着抢答的选手：蒙对一半已经是运气。' },
      slow: { title: '慢思考模式 = 系统 2', period: '先打草稿再作答 · 用 token 换答对率',
        desc: '同一个模型，先写草稿再作答。每行只做一小步，写下的内容立刻成为下一行的依据 —— 心算变笔算。' },
    },
    rmDraft: [
      '① 先摆条件：头 35 个，脚 94 只；鸡 2 只脚，兔 4 只脚。',
      '② 假设 35 只全是鸡：脚只有 70 只，比实际少 24 只。',
      '③ 每把一只鸡换成兔，脚多 2 只 —— 补上 24 只脚，要换 12 次。',
      '④ 所以兔有 12 只，鸡是剩下的 23 只。',
      '⑤ 等等，验算一下：头 23 加 12 是 35 ✓；脚 46 加 48 是 94 ✓。',
      '⑥ 两项都对上了，可以作答。',
    ],
    rmNotes: [
      '点「下一步」逐行揭开草稿。盯住一点：每一行都只做一小步，而且都踩在前面已写下的内容上。',
      '① 复述条件 = 把关键数字搬进最近的上下文 —— 后面每一步的注意力都更容易命中它们（第 9 课）。',
      '② 大题的第一刀：先算一个“全是鸡”的简化世界。这一步本身足够小，一次前向稳稳吃下。',
      '③ 关键衔接：上一行写下的“少 24 只”就躺在纸面上 —— 这一步直接引用它，不需要任何“心算记忆”。',
      '④ 换算完成。注意到了吗：直答模式正是在这一步翻的车 —— 把它单独拎出来做，就稳了。',
      '⑤ 招牌动作：反思与验算。没人教过这个动作 —— 它是强化学习里“验算过的草稿更常拿到奖励”筛出来的本能。',
      '⑥ 草稿收束，正式作答。同一个模型，多花几十个 token 的“测试时计算”，答对率从约三成抬到约九成（示意）。',
    ],
    demoTitle: '🎛️ 交互演示 · 直答 vs 慢思考',
    demoHint: '切换模式 · 慢思考可逐步播放',
    rmUser: '鸡兔同笼：数头共 35 个，数脚共 94 只。鸡、兔各有几只？',
    fastRole: '直答模式（系统 1）',
    fastAns: <>鸡有 12 只，兔有 23 只。<span className="mark">✗</span></>,
    fastNote: '一次前向直接押答案：两个数字都“撞”出来了，鸡兔正好写反 —— 最后那步换算没踩稳。',
    slowRole: '慢思考模式（系统 2）· 缩进部分是草稿',
    slowAns: <>鸡有 23 只，兔有 12 只。<span className="mark">✓</span></>,
    chipFast: '直答模式',
    chipSlow: '慢思考模式',
    btnNext: '▸ 下一步',
    btnAll: '⏩ 看完整草稿',
    btnReset: '↺ 重来',
    svgAria: '直答与慢思考两种模式在多步应用题上的答对率示意对比',
    svgTitle: '同一批多步应用题 · 答对率（示意数据）',
    svgFast: '直答',
    svgFastPct: '约三成',
    svgSlow: '慢思考',
    svgSlowPct: '约九成',
    svgFoot: '数字为示意，量级参考思维链论文中的对比实验',
    flips: [
      { q: '把一封措辞强硬的催款邮件改得客气一点', pill: { type: 'sky', text: '普通模型就好' }, why: '语气改写是预训练接龙的看家本领，一次前向就稳 —— 开慢思考只多了等待和账单。' },
      { q: '排班代码偶尔把跨月的班少算一天，找出原因', pill: { type: 'amber', text: '开慢思考' }, why: '要沿执行路径多步追踪、构造边界反例 —— 链条长且可验证，正是推理模型的主场。' },
      { q: '把一篇 3000 字的行业新闻翻译成英文', pill: { type: 'sky', text: '普通模型就好' }, why: '翻译接近“逐句对照”，几乎没有多步链条 —— 草稿换不来答对率，纯付学费。' },
      { q: '规划 5 天 3 城的出差：航班、预算、会议时间互相牵制', pill: { type: 'amber', text: '开慢思考' }, why: '多约束互相打架，要试方案、发现冲突、回头调整 —— 反思与回溯的用武之地。' },
      { q: '把今天 1 小时的会议记录压成 5 条要点', pill: { type: 'sky', text: '普通模型就好' }, why: '信息压缩一遍前向就够，摘要场景还要求快 —— 慢思考的延迟反而是减分项。' },
      { q: '一道数学竞赛的压轴证明题', pill: { type: 'amber', text: '开慢思考' }, why: 'o1 / R1 的成名战场：链条长、答案可验证 —— 思考 token 给得越足，得分爬得越高。' },
    ],
    goalsTitle: '🎯 你将学会',
    goals: [
      <>用“系统 1 / 系统 2”一句话说清直答与慢思考的差别，并解释前 22 课的模型做多步数学为什么容易翻车 —— 每个 token 的思考量是恒定的</>,
      <>讲清思维链为什么有效：写出来的步骤进入上下文（第 17 课的书桌），成为后续 token 的依据 —— 一道大题被拆成多次“只走一步”的小前向</>,
      <>看懂 o1 / DeepSeek-R1 的训练思路：在答案可自动验证的任务上做强化学习，让“打草稿”从技巧内化成本能 —— 反思、验算、换思路全是自己长出来的</>,
      <>认出第二条 scaling 曲线“测试时计算”（兑现第 15 课结尾的钩子），并掌握选型直觉：什么题值得多想一会儿，什么题杀鸡不用牛刀</>,
    ],
    conceptTitle: '💡 核心概念：系统 1 抢答，系统 2 打草稿',
    conceptLead: '先拿你自己做个实验。请在一秒内作答：球拍和球一共 1.1 元，球拍比球贵 1 元，球多少钱？—— 绝大多数人脱口而出“0.1 元”。慢下来打个草稿才发现：那样球拍就是 1.1 元，总价变成 1.2 元了；正确答案是 0.05 元。心理学家卡尼曼把脑内这两套流程命名为系统 1 和系统 2，这对概念恰好是本课的钥匙：',
    sys1Pill: '系统 1 · 快思考',
    sys1Big: <>脱口而出 —— 快、省力，<span className="gap">但</span>遇到陷阱题就栽</>,
    sys1Note: '认人脸、读母语、答“法国首都”全靠它。优点是瞬间出活，缺点是只会顺着直觉里最顺滑的那条路走 ——“0.1 元”就是这么来的。',
    sys2Pill: '系统 2 · 慢思考',
    sys2Big: <>打草稿 —— 慢、费力，<span className="hl">一步步可靠推进</span></>,
    sys2Note: '算 17 乘 24、做行程规划时它才上线。特征是把中间结果写下来，随时回头检查 —— 草稿纸是它的外接内存。',
    keyLine: <>现在说本课最重要的一句话：<b>前 22 课讲的所有模型，默认都活在系统 1 里。</b>机制在第 10 课就埋好了 —— 模型每生成一个 token，就是把整条上下文过一遍<b>固定层数</b>的网络：一次前向计算，不多不少。题目再难，它也没法“多想一会儿再开口”。对比两道题的待遇：</>,
    ex1En: <>「法国的首都是哪？」→ 一次前向，<span className="hl">绰绰有余</span></>,
    ex1Zh: '“查记忆”型问题正是文字接龙的舒适区：训练数据里见过千万遍，概率最高的下一个 token 就是“巴黎”。',
    ex2En: <>「鸡兔同笼，头 35 个、脚 94 只，各几只？」→ 还是一次前向，<span className="hl">挤不下了</span></>,
    ex2Zh: '“假设全是鸡 → 算脚差 → 换算只数”是一条几步连环的链。直接开口作答，等于把整条链压进吐出第一个数字之前的那一次计算里 —— 第 15 课“走钢丝”讲过：一步踩空，满盘皆输。',
    budgetLead: '这不是模型“笨”，是架构分给每个 token 的思考预算就是恒定的一份 —— 难题没资格多领。把这个事实揣在兜里，你在产品里见过的一串现象立刻全通了：',
    matchHead: ['你在 ChatGPT / DeepSeek 里看到的现象', '背后的机制'],
    matchRows: [
      { p: <b>问常识秒答秒对；问多步应用题同样“秒答”，却常错</b>, m: '每个 token 的计算量恒定 —— 难题没有多分到一点算力，几步连环全挤进一次前向' },
      { p: <b>加一句「请一步一步想」，正确率肉眼可见地涨</b>, m: '思维链：写出的步骤进入上下文，成为后续 token 的依据（本课第一节）' },
      { p: <b>开“深度思考”后回答前转圈良久，还能展开一段灰色思考过程</b>, m: '推理模型在生成草稿 —— 用测试时计算换答对率（本课第二节）' },
      { p: <b>同一道难题，推理模式更慢、更贵，但确实更准</b>, m: '草稿 token 也要逐个生成、也按 token 计费 —— 延迟和账单，换的就是答对率' },
    ],
    cotIntro: '既然难题败在“思考预算恒定”，最朴素的解法就摆在眼前：能不能让模型像人一样，先打草稿再作答？2022 年，研究者发现答案是 —— 能，而且只要一句话。',
    conceptSourceNote: (
      <>
        “系统 1 / 系统 2”与开头那道“球拍和球”题，出自心理学家 Daniel Kahneman 2011 年的著作{' '}
        <a href="https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow" target="_blank" rel="noreferrer">
          《思考，快与慢》
        </a>
        。
      </>
    ),
    cotTitle: '📖 思维链：一句话，把心算变笔算',
    cotLead: '谷歌的研究者 2022 年发现：不动模型一个参数，只在提问时让它“把步骤写出来”—— 给几个带步骤的范例，或干脆加一句「让我们一步一步想」—— 大模型在数学应用题上的答对率立刻大涨，部分测试集上翻了两三倍。这招被命名为思维链（Chain of Thought，CoT），就是第 16 课技法③的本尊。先看它长什么样：',
    cotEx1En: '直答：「外套先涨价一成、再降价一成，比原价贵还是便宜？」→「一样。」✗',
    cotEx1Zh: '涨完再降，基数已经变了 —— 但“一样”是直觉里最顺滑的下文，系统 1 一口咬下。',
    cotEx2En: <>思维链：同一题 + 一句「请一步步想」→「设原价 100 元；涨一成到 110 元；再降一成要降 11 元，得 99 元 —— <span className="hl">比原价便宜</span>。」✓</>,
    cotEx2Zh: '同一个模型，一个参数没动。唯一的区别：答案前面多了三行字。',
    cotLayerLead: '为什么“多写几行字”就能救命？拆成三层看 —— 每一层都是前面课程埋好的机制，这里只是接上电：',
    cotCards: [
      { label: '第一层 · 草稿进上下文', en: <>写下的字 = <b>新的依据</b></>, zh: '模型生成的每个 token 都会排进上下文（第 17 课的书桌）。自己写的草稿和你打的问题享受同等待遇 —— 后续所有生成都以它为条件。' },
      { label: '第二层 · 心算变笔算', en: <>中间结果<b>落在纸面</b></>, zh: '「涨一成到 110 元」一旦写出来，下一步就不用在“脑中”硬记 —— 注意力直接回头看这行字（第 9 课）。不靠记忆靠纸面，错误率骤降。' },
      { label: '第三层 · 大题化小', en: <>一道大题 = <b>多次小前向</b></>, zh: '四步的题拆成四次“只走一步”的生成，每一步的难度都落回一次前向能稳吃的范围 —— 一串系统 1，接力模拟出了系统 2。' },
    ],
    cotSummary: <>一句话总结思维链：<b>它没有让模型变聪明，只是让每一步都退回系统 1 能稳吃的难度。</b>但作为 prompt 层面的技巧，它有三个天生软肋：第一，<b>得靠你提醒</b> —— 忘了这句“咒语”，模型就回到抢答模式；第二，<b>一条道走到黑</b> —— 接龙生成不回头（第 12 课），第二步写错了它极少主动擦掉重来，后面整条链跟着错；第三，<b>不会换思路</b> —— 一条路走进死胡同，它不会退回岔口试另一条。“会打草稿”和“草稿打得好”是两回事。把后者也教给模型的，是 2024 年开始的下一幕。</>,
    cotSourceNote: (
      <>
        “一句话让模型先写步骤”出自 Wei 等 2022{' '}
        <a href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noreferrer">
          Chain-of-Thought Prompting Elicits Reasoning
        </a>
        。
      </>
    ),
    rmTitle: '📖 推理模型：把打草稿炼成本能',
    rmLead: '2024 年 9 月，OpenAI 发布 o1：第一个不用任何提醒、自己先写长草稿再作答的主流模型。2025 年 1 月，DeepSeek-R1 跟上，并把训练方法连同模型权重一起摊开给所有人。如果你在 DeepSeek 里勾过“深度思考”，对这一幕不会陌生：',
    rmEx1En: <>提问后先滚出一大段灰色小字：「嗯，用户问的是排期冲突……先试着按依赖排序……<span className="hl">等等，这里不对</span>，A 和 B 不能并行，我重新算一下……」</>,
    rmEx1Zh: '几十秒后才出现正式回答。那段灰色小字就是草稿 —— 不是表演给你看的，是它答题的真实工序（“真实”到什么程度，误区一节再泼一盆冷水）。ChatGPT 的“思考中…”、Claude 的扩展思考，同理，只是草稿默认折叠或隐藏。',
    rmRlLead: <>怎么把“打草稿”从技巧炼成本能？最直觉的路是第 13 课的老配方 SFT：雇人写几百万份完美草稿让模型模仿。这条路有两个死结：教科书级的草稿<b>又贵又少</b>；更要命的是，人类的解题路径未必是对模型最顺手的路径 —— 逼它模仿，像逼左撇子照右手字帖练字。突破口藏在任务本身：<b>数学题的答案，机器能自动判分；代码对不对，跑一遍测试就知道。</b>对错既然不需要人来评，就可以让模型放开手脚自己试 —— 试对了给糖。这正是强化学习的用武之地：</>,
    flowSteps: [
      <><b>出题。</b>从可自动验证的题库里抽题：数学题配标准答案，编程题配单元测试。</>,
      <><b>放手生成。</b>让模型自由写“草稿 + 答案”，同一道题采样很多份 —— 思路五花八门，长短不一。</>,
      <><b>机器判分。</b>只看最终答案对不对，不评判草稿写得“像不像人”—— 没有人类阅卷员，规模想多大就多大。</>,
      <><b>强化。</b>引向正确答案的草稿被奖励，模型朝“那样打草稿”的方向更新。和第 13 课的 RLHF 同门，只是奖励来自“对不对”的硬标准，不是人类口味。</>,
      <><b>循环成千上万轮。</b>草稿越来越长、越来越“会”—— 哪些招式有用，由答对率说了算。</>,
    ],
    ahaLead: <>整个流程里，没有人教过模型任何一个“思考动作”。但训练到中段，奇妙的事发生了：R1 的训练记录显示，模型<b>自发</b>写出「等等，让我重新检查这一步」，然后真的回头找到错误、换一条思路重来 —— 研究团队把这一刻称作“顿悟时刻”（aha moment）。反思、验算、回溯、换思路 —— 恰好补上思维链三个软肋的招式，全是在“答对才有糖”的压力下自己长出来的，像第 15 课的涌现一样，没人把它们写进任何一行代码。R1 把权重和方法和盘托出之后，几个月内全行业跟进出各自的推理模型 —— 这张开源与闭源的版图，第 25 课展开细说。</>,
    curveLead: '现在可以兑现第 15 课结尾埋的钩子了。那一课说：纯堆参数的收益放缓，前沿把筹码押向“测试时计算”。推理模型就是这枚筹码落地的样子 —— 在“把模型养大”之外，AI 多了第二条提升曲线：',
    curve1Pill: '第一条曲线 · 训练时计算',
    curve1Big: <>把模型<span className="gap">养大</span> —— 更多参数、更多数据、更多 GPU</>,
    curve1Note: '第 15 课的主角。投入以月、以亿美元计，一次性的“教育投资”，换一个更博学的底子。',
    curve2Pill: '第二条曲线 · 测试时计算',
    curve2Big: <>答题时<span className="hl">多想一会儿</span> —— 草稿额度越足，难题得分越高</>,
    curve2Note: 'o1 的技术报告里给出了和第 15 课神似的上升曲线，横轴换成了“答题时的思考量”。投入以秒、以 token 计 —— 按题付费的“临场发挥”。',
    billLead: <>第二条曲线不是免费午餐，账单分两栏：<b>延迟</b> —— 转圈几十秒，在闲聊场景足以劝退用户；<b>费用</b> —— 草稿 token 和答案 token 一样逐个生成、一样计费，一道难题的草稿常比最终答案长几倍到几十倍（各家计价细节不同，以官网为准）。于是“该不该开慢思考”成了真功夫，直觉只有一条：</>,
    pickCards: [
      { label: '值得多想一会儿', en: <>数学 · 代码 · <b>多约束规划</b></>, zh: '链条长、错一步全错、对错常可验证 —— 草稿的每一行都在实打实地换答对率，延迟和费用花得值。' },
      { label: '杀鸡不用牛刀', en: <>闲聊 · 摘要 · <b>翻译改写</b></>, zh: '一步到位的“直觉题”，普通模型一次前向就稳，还更快更便宜。开慢思考只多了等待和账单，偶尔还“想多了”绕弯。' },
    ],
    footnote: '不少产品已经把这条直觉做成了开关甚至自动分诊：简单问题走快路，难题才进慢思考。你手动选型的判断力，正在变成系统里的路由逻辑。',
    practiceLead: '纸上谈兵不如练一把。下面 6 个任务，该不该开“慢思考”？先自己判断，再点卡片对答案：',
    rmSourceNote: (
      <>
        DeepSeek-R1 把“纯靠强化学习自发学会推理”的方法与权重一并公开，见 DeepSeek 2025{' '}
        <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noreferrer">
          DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning
        </a>
        ；OpenAI o1 见{' '}
        <a href="https://openai.com/index/learning-to-reason-with-llms/" target="_blank" rel="noreferrer">
          Learning to Reason with LLMs（2024）
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '从提示工程到 RAG、工具调用、agent，再到这一课的推理模型——这些零件不会各自孤立地存在，它们要被拼装成真实的产品。可每家工具、每个数据源接口都不一样，开发者重复造轮子。下一课讲 MCP 与 AI 工程生态：一个想当“AI 应用 USB 接口”的开放协议，外加一张把这一阶段所有名词串起来的工程全景图。',
    bridgeSteps: ['推理是又一块拼图', '零件要拼成产品', '但接口五花八门', '下一课：MCP 与工程生态'],
    demoSecTitle: '🎛️ 交互演示：同一道题，两种答法',
    demoSecLead: '把全课收进一道经典题。先看“直答模式”怎么翻车，再切到“慢思考模式”逐行播放草稿 —— 盯住两件事：每一行如何踩着上一行往前走；以及第 ⑤ 行那个推理模型的招牌动作 —— 验算。',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '推理模型全面碾压普通模型，以后什么任务都该用它',
        good: '它的优势集中在长链条、可验证的难题；简单任务上更慢更贵，还可能“想多了”绕弯',
        why: <><b>病因：</b>把“新一代”理解成“全面替代”。慢思考的收益来自“把大题拆小”，可闲聊、改写、翻译本来就是一步到位的小题 —— 草稿带来的额外 token 纯属成本。研究和实测还发现“过度思考”现象：简单问题生成大段草稿，偶尔把本来正确的第一直觉推翻成错的。普通模型与推理模型是工具箱里的两把工具，不是新旧交替 —— 这也是为什么各家产品都保留了“快 / 慢”两条路。</>,
      },
      {
        bad: '展开的那段思考过程，就是模型脑子里真实的思考',
        good: '草稿是“被奖励出来的有用文本”—— 它确实帮模型答对题，但不保证如实反映内部计算',
        why: <><b>病因：</b>拟人化加字面化。草稿和答案一样是逐 token 接龙生成的文本（第 12 课），训练只奖励“草稿引向正确答案”，从没奖励过“草稿如实汇报计算过程”。可解释性研究发现两者可能不一致：模型有时先“心里有了”倾向的答案，再生成一段看起来合理的推导 —— 事后合理化；草稿里只字未提的因素也可能实际左右了答案。诚实地说：草稿非常有用，但把它当“思维直播”看，目前证据不够 —— 这仍是开放的研究问题。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 回到开头的球拍题。用本课机制解释：模型为什么容易答错这类“陷阱题”？为什么在提问里加一句“先写出每一步再作答”就常常能救回来？',
        a: <><b>错因：</b>“0.1 元”是直觉里最顺滑的接龙 —— 一次前向押概率最高的下文，正中陷阱；每个 token 思考量恒定，“验证一下”这个动作根本没有发生的机会。<b>救法：</b>写步骤让中间结果进入上下文 ——「如果球 0.1 元，球拍 1.1 元，总价 1.2 元，不对」白纸黑字摆在桌面上，后续 token 在纸面证据的条件下生成，陷阱当场现形。心算变笔算。</>,
      },
      {
        q: '2. 朋友盯着 DeepSeek-R1 滚动的思考过程感叹：“你看，AI 思考的样子和人一模一样，这就是它的内心独白。” 这句话有两处要打折扣，分别是什么？',
        a: <><b>第一处：</b>草稿是逐 token 接龙生成的文本，训练奖励的是“引向正确答案”，不是“如实汇报内部计算”—— 研究发现草稿与真实计算路径可能不一致，有时是事后合理化，所以“内心独白”言过其实。<b>第二处：</b>“和人一模一样”也不成立 —— 反思、验算这些招式是强化学习在可验证任务上筛出来的得分策略，长得像人类思考，出身完全不同。</>,
      },
      {
        q: '3. 你在公司负责接入 AI，手上三件事：① 客服 FAQ 自动回复 ② 跨部门项目排期（人力、工期、依赖互相牵制）③ 营销文案润色。哪些值得开推理模式？用“两笔账”说明理由。',
        a: <><b>只有 ② 值得。</b>两笔账：<b>时间账</b> —— 推理模式开口前要先生成大段草稿，FAQ 用户等不起几十秒，排期任务等得起也值得等；<b>金钱账</b> —— 草稿 token 照常计费，常比答案长几倍到几十倍，① ③ 这类一步到位的任务花这笔钱换不来答对率提升，还可能“想多了”把本来顺手的文案改绕。</>,
      },
    ],
  },

  en: {
    rmMode: {
      fast: { title: 'Direct-answer mode = System 1', period: 'One forward pass to commit · constant thinking per token',
        desc: 'The moment the model finishes reading, the very next token has to start writing the answer — "assume, compute the gap, convert," all chained into a single forward pass. Like a contestant forced to buzz in: getting it half right is already luck.' },
      slow: { title: 'Slow-thinking mode = System 2', period: 'Draft first, then answer · trade tokens for accuracy',
        desc: 'The same model, drafting before answering. Each line takes just one small step, and what it writes immediately becomes the basis for the next line — mental math turns into pen-and-paper math.' },
    },
    rmDraft: [
      '① Lay out the conditions first: 35 heads, 94 feet; a chicken has 2 feet, a rabbit has 4.',
      '② Assume all 35 are chickens: that gives only 70 feet, 24 fewer than the actual count.',
      '③ Each chicken swapped for a rabbit adds 2 feet — to make up 24 feet, swap 12 times.',
      '④ So there are 12 rabbits, and the remaining 23 are chickens.',
      '⑤ Wait, let me verify: 23 + 12 heads is 35 ✓; 46 + 48 feet is 94 ✓.',
      '⑥ Both check out, ready to answer.',
    ],
    rmNotes: [
      'Click "Next step" to reveal the draft line by line. Watch one thing: each line takes only a small step, and each one stands on what was already written above.',
      '① Restating the conditions = moving the key numbers into the nearest context — every later step\'s attention can hit them more easily (Lesson 9).',
      '② The first cut at a big problem: compute a simplified "all chickens" world. This step is small enough that one forward pass handles it cleanly.',
      '③ The key handoff: the "24 short" written on the line above is right there on the page — this step quotes it directly, with no "mental memory" needed.',
      '④ Conversion done. Notice it? This is exactly where direct-answer mode crashed — pull it out as its own step and it holds.',
      '⑤ The signature move: reflection and verification. No one taught this action — it\'s an instinct selected by RL, where "drafts that get verified more often earn the reward."',
      '⑥ The draft wraps up, the formal answer follows. Same model, a few dozen extra tokens of "test-time compute," and accuracy climbs from about 30% to about 90% (illustrative).',
    ],
    demoTitle: '🎛️ Interactive · Direct answer vs slow thinking',
    demoHint: 'Switch modes · slow thinking plays step by step',
    rmUser: 'Chickens and rabbits in a cage: counting heads gives 35, counting feet gives 94. How many chickens and how many rabbits?',
    fastRole: 'Direct-answer mode (System 1)',
    fastAns: <>There are 12 chickens and 23 rabbits.<span className="mark">✗</span></>,
    fastNote: 'One forward pass commits straight to the answer: both numbers got "blurted" out, with chickens and rabbits swapped — that last conversion step didn\'t land.',
    slowRole: 'Slow-thinking mode (System 2) · the indented part is the draft',
    slowAns: <>There are 23 chickens and 12 rabbits.<span className="mark">✓</span></>,
    chipFast: 'Direct answer',
    chipSlow: 'Slow thinking',
    btnNext: '▸ Next step',
    btnAll: '⏩ See the full draft',
    btnReset: '↺ Restart',
    svgAria: 'Illustrative comparison of accuracy on multi-step word problems between direct-answer and slow-thinking modes',
    svgTitle: 'Same batch of multi-step word problems · accuracy (illustrative data)',
    svgFast: 'Direct',
    svgFastPct: '~30%',
    svgSlow: 'Slow think',
    svgSlowPct: '~90%',
    svgFoot: 'Numbers are illustrative; the magnitude references the comparison experiments in the chain-of-thought paper',
    flips: [
      { q: 'Soften the tone of a sternly worded payment-reminder email', pill: { type: 'sky', text: 'A regular model is fine' }, why: 'Rewriting tone is the bread and butter of pretrained next-token prediction; one forward pass nails it — turning on slow thinking only adds waiting and a bill.' },
      { q: 'Scheduling code occasionally undercounts a cross-month shift by a day — find the cause', pill: { type: 'amber', text: 'Turn on slow thinking' }, why: 'It needs multi-step tracing along the execution path and constructing edge-case counterexamples — long, verifiable chains are exactly the reasoning model\'s home turf.' },
      { q: 'Translate a 3,000-word industry news article into English', pill: { type: 'sky', text: 'A regular model is fine' }, why: 'Translation is close to "sentence-by-sentence matching," with almost no multi-step chain — a draft buys no extra accuracy, just tuition paid for nothing.' },
      { q: 'Plan a 5-day, 3-city business trip: flights, budget, and meeting times all constrain each other', pill: { type: 'amber', text: 'Turn on slow thinking' }, why: 'Multiple constraints clash, so you have to try plans, spot conflicts, and go back to adjust — prime territory for reflection and backtracking.' },
      { q: 'Compress today\'s one-hour meeting notes into 5 bullet points', pill: { type: 'sky', text: 'A regular model is fine' }, why: 'Compressing information takes just one forward pass, and summarization also demands speed — slow thinking\'s latency is a minus here.' },
      { q: 'The final proof problem from a math competition', pill: { type: 'amber', text: 'Turn on slow thinking' }, why: 'The signature battleground of o1 / R1: long chains, verifiable answers — the more thinking tokens you grant, the higher the score climbs.' },
    ],
    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>State in one sentence the difference between direct answering and slow thinking using "System 1 / System 2," and explain why the models in the first 22 lessons stumble on multi-step math — the thinking budget per token is constant</>,
      <>Explain why chain-of-thought works: the written-out steps enter the context (the desk from Lesson 17) and become the basis for later tokens — one big problem is split into many small "single-step" forward passes</>,
      <>Understand the training idea behind o1 / DeepSeek-R1: do RL on tasks whose answers can be auto-verified, turning "drafting" from a trick into internalized instinct — reflection, verification, and switching approaches all grow on their own</>,
      <>Recognize the second scaling curve, "test-time compute" (cashing in the hook left at the end of Lesson 15), and grasp the selection intuition: which problems are worth thinking about longer, and which don\'t need the heavy artillery</>,
    ],
    conceptTitle: '💡 Core Idea: System 1 buzzes in, System 2 drafts',
    conceptLead: 'First run an experiment on yourself. Answer within one second: a bat and a ball cost 1.1 yuan together, and the bat costs 1 yuan more than the ball — how much is the ball? Most people blurt out "0.1 yuan." Slow down and draft it, and you find: that would make the bat 1.1 yuan, so the total becomes 1.2 yuan; the correct answer is 0.05 yuan. The psychologist Kahneman named these two mental processes System 1 and System 2, and this pair of concepts happens to be the key to this lesson:',
    sys1Pill: 'System 1 · fast thinking',
    sys1Big: <>Blurting it out — fast, effortless, <span className="gap">but</span> it trips on trick questions</>,
    sys1Note: 'Recognizing faces, reading your native language, answering "the capital of France" all rely on it. Its strength is instant output; its weakness is that it only follows the smoothest path in intuition — "0.1 yuan" is exactly how it arises.',
    sys2Pill: 'System 2 · slow thinking',
    sys2Big: <>Drafting — slow, effortful, <span className="hl">advancing reliably step by step</span></>,
    sys2Note: 'It only comes online for computing 17 times 24 or planning an itinerary. Its trait is writing down intermediate results and checking back anytime — scratch paper is its external memory.',
    keyLine: <>Now for the single most important sentence of this lesson: <b>all the models covered in the first 22 lessons live in System 1 by default.</b> The mechanism was laid down back in Lesson 10 — every token the model generates means running the entire context through a network of <b>fixed depth</b>: one forward pass, no more, no less. However hard the problem, it can't "think a bit longer before speaking." Compare how two problems are treated:</>,
    ex1En: <>"What is the capital of France?" → one forward pass, <span className="hl">more than enough</span></>,
    ex1Zh: '"Look-it-up" questions are exactly the comfort zone of next-word prediction: seen tens of millions of times in the training data, the highest-probability next token is "Paris."',
    ex2En: <>"Chickens and rabbits in a cage, 35 heads and 94 feet — how many of each?" → still one forward pass, <span className="hl">no room to squeeze it in</span></>,
    ex2Zh: '"Assume all chickens → compute the foot gap → convert to counts" is a chain of several linked steps. Answering straight away means cramming the whole chain into the single computation before the first digit comes out — Lesson 15\'s "tightrope walk" said it: one misstep, and the whole thing collapses.',
    budgetLead: 'This isn\'t the model being "dumb"; it\'s that the architecture allots each token exactly one constant share of thinking budget — hard problems don\'t get to draw more. Pocket this fact, and a whole string of things you\'ve seen in products suddenly all make sense:',
    matchHead: ['What you see in ChatGPT / DeepSeek', 'The mechanism behind it'],
    matchRows: [
      { p: <b>Common-sense questions are answered instantly and correctly; multi-step word problems are answered just as "instantly," but often wrong</b>, m: 'The compute per token is constant — hard problems get no extra compute, so several linked steps all cram into one forward pass' },
      { p: <b>Add "please think step by step" and accuracy visibly rises</b>, m: 'Chain-of-thought: the written-out steps enter the context and become the basis for later tokens (first section of this lesson)' },
      { p: <b>Turn on "deep thinking" and it spins for a while before answering, then can unfold a gray thinking process</b>, m: 'The reasoning model is generating a draft — trading test-time compute for accuracy (second section of this lesson)' },
      { p: <b>On the same hard problem, reasoning mode is slower and pricier, but genuinely more accurate</b>, m: 'Draft tokens are also generated one by one and billed per token — what the latency and the bill buy is accuracy' },
    ],
    cotIntro: 'Since hard problems fail because the "thinking budget is constant," the most naive fix is right in front of us: can we make the model draft before answering, like a human does? In 2022, researchers found the answer is — yes, and it takes just one sentence.',
    conceptSourceNote: (
      <>
        "System 1 / System 2" and the opening "bat and ball" puzzle come from psychologist Daniel Kahneman's 2011 book{' '}
        <a href="https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow" target="_blank" rel="noreferrer">
          Thinking, Fast and Slow
        </a>
        .
      </>
    ),
    cotTitle: '📖 Chain-of-Thought: one sentence turns mental math into pen-and-paper math',
    cotLead: 'Google researchers found in 2022 that without touching a single model parameter, just making it "write out the steps" when asked — giving a few worked examples, or simply adding "let\'s think step by step" — sends a large model\'s accuracy on math word problems soaring, doubling or tripling on some test sets. This trick was named chain-of-thought (CoT), and it\'s the very technique ③ from Lesson 16. First, see what it looks like:',
    cotEx1En: 'Direct answer: "A coat\'s price rises 10% then falls 10% — is it more expensive or cheaper than the original?" → "The same." ✗',
    cotEx1Zh: 'After rising then falling, the base has already changed — but "the same" is the smoothest continuation in intuition, and System 1 bites down on it.',
    cotEx2En: <>Chain-of-thought: the same question + "please think step by step" → "Let the original price be 100 yuan; up 10% to 110 yuan; then down 10% means subtracting 11 yuan, giving 99 yuan — <span className="hl">cheaper than the original</span>." ✓</>,
    cotEx2Zh: 'The same model, not one parameter changed. The only difference: three extra lines before the answer.',
    cotLayerLead: 'Why does "writing a few more lines" save the day? Break it into three layers — each is a mechanism laid down in earlier lessons, here just plugged in:',
    cotCards: [
      { label: 'Layer 1 · draft enters the context', en: <>What\'s written = <b>new evidence</b></>, zh: 'Every token the model generates lines up in the context (the desk from Lesson 17). The draft it writes itself enjoys the same treatment as the question you typed — all later generation is conditioned on it.' },
      { label: 'Layer 2 · mental math becomes pen-and-paper', en: <>Intermediate results <b>land on the page</b></>, zh: 'Once "up 10% to 110 yuan" is written, the next step doesn\'t have to hold it "in mind" — attention just looks back at that line (Lesson 9). Relying on the page instead of memory, the error rate plummets.' },
      { label: 'Layer 3 · big problem made small', en: <>One big problem = <b>many small forward passes</b></>, zh: 'A four-step problem splits into four "single-step" generations, each step\'s difficulty falling back into the range one forward pass can handle cleanly — a chain of System 1s relays to simulate System 2.' },
    ],
    cotSummary: <>Chain-of-thought in one sentence: <b>it didn\'t make the model smarter, it just pushed every step back to a difficulty System 1 can handle cleanly.</b> But as a prompt-level trick, it has three built-in weaknesses: first, <b>it depends on you reminding it</b> — forget the "incantation" and the model reverts to buzz-in mode; second, <b>it commits to one path</b> — next-token generation doesn\'t look back (Lesson 12), so if step two is wrong it rarely erases and redoes it, and the rest of the chain follows the error; third, <b>it won\'t switch approaches</b> — walk into a dead end and it won\'t back up to the fork to try another route. "Able to draft" and "drafts well" are two different things. Teaching the model the latter, too, is the next act that began in 2024.</>,
    cotSourceNote: (
      <>
        "One sentence to make the model write out steps" comes from Wei et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noreferrer">
          Chain-of-Thought Prompting Elicits Reasoning
        </a>
        .
      </>
    ),
    rmTitle: '📖 Reasoning Models: forging drafting into instinct',
    rmLead: 'In September 2024, OpenAI released o1: the first mainstream model that, without any prompting, writes a long draft on its own before answering. In January 2025, DeepSeek-R1 followed, and laid the training method bare — along with the model weights — for everyone. If you\'ve ever ticked "deep thinking" in DeepSeek, this scene will be familiar:',
    rmEx1En: <>After the question, a big block of gray small text first scrolls out: "Hmm, the user is asking about a scheduling conflict... let me try ordering by dependencies first... <span className="hl">wait, this isn\'t right</span>, A and B can\'t run in parallel, let me recompute..."</>,
    rmEx1Zh: 'Only after tens of seconds does the formal answer appear. That block of gray small text is the draft — not a performance for you, but the real workflow by which it answers (just how "real" gets a cold splash of water in the misconceptions section). ChatGPT\'s "Thinking…" and Claude\'s extended thinking work the same way, only the draft is collapsed or hidden by default.',
    rmRlLead: <>How do you forge "drafting" from a trick into instinct? The most intuitive route is Lesson 13\'s old recipe, SFT: hire people to write millions of perfect drafts for the model to imitate. This route has two dead knots: textbook-grade drafts are <b>expensive and scarce</b>; worse still, a human\'s solving path isn\'t necessarily the most natural one for the model — forcing it to imitate is like forcing a left-hander to practice from a right-hand copybook. The breakthrough hides in the task itself: <b>a math problem\'s answer can be auto-graded by machine; whether code is correct, you find out by running the tests.</b> Since right and wrong don\'t need a human to judge, you can let the model try freely with its hands untied — get it right, get a treat. This is exactly where reinforcement learning shines:</>,
    flowSteps: [
      <><b>Pose the problem.</b> Draw from an auto-verifiable problem bank: math problems paired with reference answers, coding problems paired with unit tests.</>,
      <><b>Let it generate freely.</b> Let the model write "draft + answer" freely, sampling many attempts for the same problem — wildly varied approaches, of every length.</>,
      <><b>Machine grading.</b> Only look at whether the final answer is correct, with no judgment of whether the draft "looks human" — no human graders, so the scale can be as large as you like.</>,
      <><b>Reinforce.</b> Drafts that lead to the correct answer are rewarded, and the model updates toward "drafting like that." Same family as Lesson 13\'s RLHF, only the reward comes from the hard standard of "right or wrong," not human taste.</>,
      <><b>Loop tens of thousands of rounds.</b> Drafts grow longer and more "skilled" — which moves are useful is decided by accuracy.</>,
    ],
    ahaLead: <>Throughout the whole process, no one taught the model a single "thinking action." But midway through training, something marvelous happened: R1\'s training logs show the model <b>spontaneously</b> writing "wait, let me re-check this step," then actually going back, finding the error, and restarting with a different approach — the research team called this moment the "aha moment." Reflection, verification, backtracking, switching approaches — exactly the moves that patch chain-of-thought\'s three weaknesses — all grew on their own under the pressure of "only correct answers get a treat," just like the emergence in Lesson 15, with no one writing them into a single line of code. After R1 laid its weights and method on the table, within months the whole industry followed with their own reasoning models — and that map of open versus closed source gets the full treatment in Lesson 25.</>,
    curveLead: 'Now we can cash in the hook left at the end of Lesson 15. That lesson said: the returns from piling on parameters alone are slowing, and the frontier is betting its chips on "test-time compute." Reasoning models are what that chip looks like when it lands — beyond "growing the model bigger," AI now has a second improvement curve:',
    curve1Pill: 'First curve · train-time compute',
    curve1Big: <>Grow the model <span className="gap">bigger</span> — more parameters, more data, more GPUs</>,
    curve1Note: 'The star of Lesson 15. The investment is measured in months and hundreds of millions of dollars, a one-time "education investment" that buys a more knowledgeable foundation.',
    curve2Pill: 'Second curve · test-time compute',
    curve2Big: <>Think a bit <span className="hl">longer</span> at answer time — the more drafting budget, the higher the score on hard problems</>,
    curve2Note: 'o1\'s technical report gives a rising curve strikingly like Lesson 15\'s, with the horizontal axis swapped for "amount of thinking at answer time." The investment is measured in seconds and tokens — a pay-per-problem "live performance."',
    billLead: <>The second curve isn\'t a free lunch; the bill has two columns: <b>latency</b> — spinning for tens of seconds, enough to drive users away in a casual-chat setting; and <b>cost</b> — draft tokens are generated one by one and billed just like answer tokens, and a hard problem\'s draft is often several to dozens of times longer than the final answer (pricing details differ by vendor; check the official site). So "should I turn on slow thinking" becomes real skill, and the intuition has just one line:</>,
    pickCards: [
      { label: 'Worth thinking longer', en: <>Math · code · <b>multi-constraint planning</b></>, zh: 'Long chains, where one wrong step dooms it all, and right/wrong is often verifiable — every line of the draft genuinely buys accuracy, so the latency and cost are well spent.' },
      { label: 'No heavy artillery needed', en: <>Chit-chat · summarization · <b>translation and rewriting</b></>, zh: 'One-shot "intuition problems," where a regular model nails it in one forward pass, faster and cheaper. Turning on slow thinking only adds waiting and a bill, and occasionally "overthinks" itself into a detour.' },
    ],
    footnote: 'Many products have already turned this intuition into a switch, or even automatic triage: simple questions take the fast lane, hard ones go to slow thinking. The judgment you exercise picking by hand is becoming routing logic inside the system.',
    practiceLead: 'Talk is cheap — let\'s practice. For the 6 tasks below, should slow thinking be turned on? Decide for yourself first, then tap a card to check the answer:',
    rmSourceNote: (
      <>
        DeepSeek-R1 released both the method ("reasoning learned purely via reinforcement learning") and the weights, see DeepSeek 2025,{' '}
        <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noreferrer">
          DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning
        </a>
        ; OpenAI o1 is described in{' '}
        <a href="https://openai.com/index/learning-to-reason-with-llms/" target="_blank" rel="noreferrer">
          Learning to Reason with LLMs (2024)
        </a>
        .
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 24',
    bridgeLead: 'From prompt engineering to RAG, tool calling, agents, and this lesson\'s reasoning models — these parts don\'t exist in isolation; they get assembled into real products. But every tool and every data-source interface is different, and developers keep reinventing the wheel. The next lesson covers MCP and the AI engineering ecosystem: an open protocol aiming to be the "USB port for AI apps," plus a panorama that ties together every term from this stage.',
    bridgeSteps: ['Reasoning is one more piece', 'Parts assemble into products', 'But interfaces vary wildly', 'Next: MCP & the ecosystem'],
    demoSecTitle: '🎛️ Interactive Demo: one problem, two ways to answer',
    demoSecLead: 'The whole lesson distilled into one classic problem. First watch "direct-answer mode" crash, then switch to "slow-thinking mode" and play the draft line by line — watch two things: how each line steps forward off the line above; and that signature reasoning-model move on line ⑤ — verification.',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Reasoning models crush regular models across the board, so you should use them for every task from now on',
        good: 'Their advantage is concentrated in long-chain, verifiable hard problems; on simple tasks they\'re slower and pricier, and may even "overthink" into a detour',
        why: <><b>Cause:</b> reading "next generation" as "wholesale replacement." Slow thinking\'s payoff comes from "splitting a big problem into small ones," but chit-chat, rewriting, and translation are inherently one-shot small problems — the extra tokens a draft brings are pure cost. Research and real-world tests also find an "overthinking" phenomenon: simple questions generate a long draft, occasionally overturning a first intuition that was right into a wrong one. Regular models and reasoning models are two tools in the toolbox, not an old-versus-new succession — which is exactly why every vendor keeps both a "fast" and a "slow" lane.</>,
      },
      {
        bad: 'The thinking process it unfolds is the model\'s real thinking inside its head',
        good: 'The draft is "useful text that got rewarded" — it does help the model answer correctly, but it\'s not guaranteed to faithfully reflect the internal computation',
        why: <><b>Cause:</b> anthropomorphizing plus taking it literally. Like the answer, the draft is text generated token by token (Lesson 12); training only rewards "the draft leading to the correct answer," and never rewarded "the draft faithfully reporting the computation process." Interpretability research finds the two can diverge: sometimes the model first "has in mind" a preferred answer, then generates a plausible-looking derivation — post-hoc rationalization; factors never mentioned in the draft may also have actually driven the answer. Honestly: the draft is very useful, but treating it as a "live broadcast of thought" lacks sufficient evidence for now — this remains an open research question.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Back to the bat-and-ball problem at the start. Use this lesson\'s mechanism to explain: why is the model prone to getting such "trick questions" wrong? And why does adding "write out each step before answering" to the prompt often save it?',
        a: <><b>Why it fails:</b> "0.1 yuan" is the smoothest continuation in intuition — one forward pass commits to the highest-probability next text, straight into the trap; with thinking per token constant, the act of "verifying" has no chance to happen at all. <b>The fix:</b> writing the steps gets intermediate results into the context — "if the ball is 0.1 yuan, the bat is 1.1 yuan, the total is 1.2 yuan, that\'s wrong" sits in black and white on the table, later tokens are generated conditioned on the on-page evidence, and the trap is exposed on the spot. Mental math becomes pen-and-paper math.</>,
      },
      {
        q: '2. A friend watches DeepSeek-R1\'s scrolling thinking process and marvels: "Look, AI thinks exactly like a human — this is its inner monologue." There are two points here that need discounting; what are they?',
        a: <><b>First point:</b> the draft is text generated token by token, and training rewards "leading to the correct answer," not "faithfully reporting the internal computation" — research finds the draft and the real computation path can diverge, sometimes as post-hoc rationalization, so "inner monologue" overstates it. <b>Second point:</b> "exactly like a human" doesn\'t hold either — moves like reflection and verification are scoring strategies selected by RL on verifiable tasks; they look like human thinking but have a completely different origin.</>,
      },
      {
        q: '3. You\'re in charge of bringing AI into your company, with three things on your plate: ① auto-replies for customer-service FAQs ② cross-department project scheduling (staffing, timelines, and dependencies all constrain each other) ③ polishing marketing copy. Which are worth turning on reasoning mode for? Justify it with "two ledgers."',
        a: <><b>Only ② is worth it.</b> Two ledgers: the <b>time ledger</b> — reasoning mode has to generate a long draft before speaking, FAQ users can\'t wait tens of seconds, while a scheduling task both can and is worth waiting for; the <b>money ledger</b> — draft tokens are billed as usual, often several to dozens of times longer than the answer, and for one-shot tasks like ① and ③ that spend buys no accuracy gain, and may even "overthink" smooth copy into a detour.</>,
      },
    ],
  },
}

function ReasonDemo({ c }) {
  const [mode, setMode] = useState('fast')
  const [step, setStep] = useState(0)
  const d = c.rmMode[mode]
  const RM_DRAFT = c.rmDraft

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="rm-chat">
            <div className="rm-bubble rm-user">{c.rmUser}</div>
            {mode === 'fast' ? (
              <div className="rm-bubble rm-ai">
                <div className="rm-role">{c.fastRole}</div>
                <p className="rm-ans bad">{c.fastAns}</p>
                <p className="rm-note">{c.fastNote}</p>
              </div>
            ) : (
              <div className="rm-bubble rm-ai">
                <div className="rm-role">{c.slowRole}</div>
                <div className="rm-draft">
                  {RM_DRAFT.map((line, i) => (
                    <div key={i} className={`rm-dline${i < step ? ' on' : ''}${i === step - 1 ? ' now' : ''}`}>{line}</div>
                  ))}
                </div>
                <p className={`rm-ans good${step < RM_DRAFT.length ? ' rm-final-dim' : ''}`}>{c.slowAns}</p>
              </div>
            )}
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['fast', c.chipFast], ['slow', c.chipSlow]].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          {mode === 'slow' && (
            <>
              <div className="chips mt14">
                <button className="chip" onClick={() => setStep((s) => Math.min(RM_DRAFT.length, s + 1))}>{c.btnNext}</button>
                <button className="chip" onClick={() => setStep(RM_DRAFT.length)}>{c.btnAll}</button>
                <button className="chip" onClick={() => setStep(0)}>{c.btnReset}</button>
              </div>
              <div className="rm-stepnote">{c.rmNotes[step]}</div>
            </>
          )}
          <svg id="rm-bars" className="mt14" viewBox="0 0 250 92" width="240" aria-label={c.svgAria}>
            <text x="0" y="12" fontSize="11" fill="var(--fg-2)">{c.svgTitle}</text>
            <g style={{ opacity: mode === 'fast' ? 1 : 0.35 }}>
              <text x="58" y="40" fontSize="11.5" textAnchor="end" fill="var(--fg-0)">{c.svgFast}</text>
              <rect x="66" y="29" width="130" height="14" rx="7" fill="var(--bg-inset)" />
              <rect x="66" y="29" width="42" height="14" rx="7" fill="var(--terracotta)" fillOpacity="0.8" />
              <text x="202" y="40" fontSize="11" fill="var(--fg-1)">{c.svgFastPct}</text>
            </g>
            <g style={{ opacity: mode === 'slow' ? 1 : 0.35 }}>
              <text x="58" y="66" fontSize="11.5" textAnchor="end" fill="var(--fg-0)">{c.svgSlow}</text>
              <rect x="66" y="55" width="130" height="14" rx="7" fill="var(--bg-inset)" />
              <rect x="66" y="55" width="120" height="14" rx="7" fill="var(--sage)" fillOpacity="0.9" />
              <text x="202" y="66" fontSize="11" fill="var(--fg-1)">{c.svgSlowPct}</text>
            </g>
            <text x="0" y="88" fontSize="10" fill="var(--fg-2)">{c.svgFoot}</text>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function L23() {
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
            <div className="tag"><span className="pill pill-ink">{c.sys1Pill}</span></div>
            <div className="big">{c.sys1Big}</div>
            <p className="note">{c.sys1Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.sys2Pill}</span></div>
            <div className="big">{c.sys2Big}</div>
            <p className="note">{c.sys2Note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.keyLine}</p>
        <div className="example">
          <div className="en">{c.ex1En}</div>
          <div className="zh">{c.ex1Zh}</div>
        </div>
        <div className="example">
          <div className="en">{c.ex2En}</div>
          <div className="zh">{c.ex2Zh}</div>
        </div>
        <p className="lead mt14">{c.budgetLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead[0]}</th><th>{c.matchHead[1]}</th></tr></thead>
            <tbody>
              {c.matchRows.map((r, i) => (
                <tr key={i}><td>{r.p}</td><td className="ex">{r.m}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.cotIntro}</p>
        <p className="footnote source-note">{c.conceptSourceNote}</p>
      </Lsec>

      <Lsec title={c.cotTitle} lead={c.cotLead}>
        <div className="example">
          <div className="en">{c.cotEx1En}</div>
          <div className="zh">{c.cotEx1Zh}</div>
        </div>
        <div className="example">
          <div className="en">{c.cotEx2En}</div>
          <div className="zh">{c.cotEx2Zh}</div>
        </div>
        <p className="lead mt14">{c.cotLayerLead}</p>
        <div className="use-grid">
          {c.cotCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.cotSummary}</p>
        <p className="footnote source-note">{c.cotSourceNote}</p>
      </Lsec>

      <Lsec title={c.rmTitle} lead={c.rmLead}>
        <div className="example">
          <div className="en">{c.rmEx1En}</div>
          <div className="zh">{c.rmEx1Zh}</div>
        </div>
        <p className="lead mt14">{c.rmRlLead}</p>
        <div className="card flow-card">
          <div className="flow">
            {c.flowSteps.map((t, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{t}</span></div>
            ))}
          </div>
        </div>
        <p className="lead mt14">{c.ahaLead}</p>
        <p className="lead mt14">{c.curveLead}</p>
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.curve1Pill}</span></div>
            <div className="big">{c.curve1Big}</div>
            <p className="note">{c.curve1Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.curve2Pill}</span></div>
            <div className="big">{c.curve2Big}</div>
            <p className="note">{c.curve2Note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.billLead}</p>
        <div className="use-grid cols-2">
          {c.pickCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote mt14">{c.footnote}</p>
        <p className="lead mt14">{c.practiceLead}</p>
        <div className="flip-grid">
          {c.flips.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
        </div>
        <p className="footnote source-note">{c.rmSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <ReasonDemo c={c} />
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
