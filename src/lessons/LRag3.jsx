import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// RAG 进阶 ③ · 单次检索不够时(进阶架构)
// 事实依据:Self-RAG(Asai et al. arXiv:2310.11511, ICLR 2024)、
// IRCoT(Trivedi et al. arXiv:2212.10509, ACL 2023)、
// 微软 GraphRAG(arXiv:2404.16130, 2024)、
// Lost in the Middle(Liu et al. arXiv:2307.03172, 2023)、
// Retrieval meets Long Context(Xu et al. arXiv:2310.03025)。
// ============================================================

const C = {
  zh: {
    conceptTitle: '💡 核心概念:有些问题,查一次根本不够',
    conceptLead: '前两节,你已经能把“查一次、拼进上下文、让模型答”这条标准 RAG 链路做得相当扎实——检索查得准、资料切得好、效果量得出。但现实里有一类问题,无论你检索多准、切分多好,单次检索都答不了:因为答案不躺在任何单独一段里,而要分几步查、或跨多篇文档综合。这一节,就讲当标准 RAG 不够用时,人们怎么给它升级。',
    contrastTag1: '直觉印象',
    contrastBig1: <>RAG 永远是<span className="gap">查一次 → 拼上下文 → 回答</span></>,
    contrastNote1: '把 RAG 理解成一个固定的一次性动作。',
    contrastTag2: '真实机制',
    contrastBig2: <>复杂问题要<span className="hl">多步检索、让模型自主决定查几次,甚至先把全库连成知识图谱</span></>,
    contrastNote2: '检索可以是一个循环、一段推理,而不只是一次查询。',
    exampleEn: <>举个会让标准 RAG 卡住的问题:<span className="hl">“《盗梦空间》的导演,还执导过哪些拿了奥斯卡的电影?”</span> 单次检索只能查到“导演是诺兰”;要回答完整,得拿这个中间结果<b>再查一次</b>。这就需要“多跳”。</>,
    exampleZh: <>这一节是 RAG 三部曲的收官,也和 L20「Agent」正面会合:当检索本身变成一个由模型驱动的循环,RAG 就长出了 Agent 的样子。</>,
    // 进阶架构
    archTitle: '📖 四种进阶架构:让检索学会“多查几次”和“看全局”',
    archLead: '标准 RAG 是“一次性、局部、被动”的检索。下面四种升级,分别在“次数、视野、主动性、与长上下文的关系”上突破它。每条配一个生活类比。',
    arch: [
      { n: '01', term: 'Agentic / Self-RAG:让模型自己决定要不要查、查几次', tag: '主动',
        body: <>标准 RAG 不管问题难易,都<b>固定查一次</b>。Agentic RAG 把检索交给模型自主调度:简单问题可以<b>不查</b>(它本来就会),复杂问题可以<b>查很多次</b>、边查边修正。<b>Self-RAG</b> 更进一步,训练模型用特殊的“反思标记”自己判断<b>该不该检索、检索到的有没有用、自己的答案站不站得住</b>。这其实就是把 L20 的 Agent 循环套在了检索上。</>,
        analogy: <><b>类比:</b>新手客服每个问题都翻一遍手册;老手会判断——这个张口就答,那个得查三处资料交叉确认。Agentic RAG 就是那个会判断的老手。</> },
      { n: '02', term: '多跳检索:这一步的答案,是下一步的问题', tag: '分步',
        body: <>有些问题<b>必须分步</b>:要先查到 A,才知道该去查 B。“《盗梦空间》导演还导过哪些获奖片”——先查到“诺兰”,才能拿“诺兰”去查他的获奖作品。<b>多跳检索</b>把“检索”和“推理”<b>交错</b>起来:查一点 → 想一步 → 再查 → 再想,直到拼齐答案。</>,
        analogy: <><b>类比:</b>查案:先找到目击者(第一跳),从他口中得到嫌疑人名字,再去查这个人的不在场证明(第二跳)。线索是一环扣一环挖出来的。</> },
      { n: '03', term: 'GraphRAG:先把全库连成知识图谱,再答“全局题”', tag: '看全局',
        body: <>普通 RAG 按 chunk 相似度检索,擅长“局部事实”题(某条规定是什么),但遇到<b>全局/综合题</b>(“把这几百份报告的主要矛盾总结一下”“X 和 Y 之间有什么关联”)就抓瞎——因为答案分散在大量文档里,没有哪一块能命中。微软的 <b>GraphRAG</b> 先用 LLM 把全库抽成<b>知识图谱</b>(实体 + 关系),再做社区聚类与分层摘要,于是能回答需要“纵观全局”的问题。</>,
        analogy: <><b>类比:</b>问“这本书的人物关系”,你不能靠翻到某一页回答,得先画一张人物关系图,再从图上看全貌。GraphRAG 就是先建这张图。</> },
      { n: '04', term: '长上下文 vs RAG:不是替代,是分工', tag: '别误判',
        body: <>“上下文窗口都几百万 token 了,直接全塞进去,RAG 是不是该退休了?”——不是。长上下文有四个硬伤:<b>贵</b>(每轮重算整段)、<b>慢</b>、<b>“中间遗忘”</b>(放在长上下文中段的信息容易被忽略)、<b>难溯源难更新</b>(改一条要重灌)。RAG 则精准、可给出处、可实时增删、便宜。二者<b>互补</b>:RAG 负责从海量、动态知识里精准取料,长上下文适合一次性深读少数长文档。</>,
        analogy: <><b>类比:</b>长上下文像“把整箱资料抱进考场摊开”——带得多,却翻得慢、容易看花眼;RAG 像“开卷且有目录,精准翻到那几页”。考的范围越大越动态,后者越划算。</> },
    ],
    archSourceNote: (
      <>
        Self-RAG 见 Asai 等(<a href="https://arxiv.org/abs/2310.11511" target="_blank" rel="noreferrer">arXiv:2310.11511</a>, ICLR 2024);多跳“边想边查”见 IRCoT(<a href="https://arxiv.org/abs/2212.10509" target="_blank" rel="noreferrer">arXiv:2212.10509</a>);GraphRAG 见微软(<a href="https://arxiv.org/abs/2404.16130" target="_blank" rel="noreferrer">arXiv:2404.16130</a>);“中间遗忘”见 Lost in the Middle(<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noreferrer">arXiv:2307.03172</a>)。
      </>
    ),
    // 演示
    demoSecTitle: '🎛️ 交互演示:单次 RAG vs 多跳,answer 同一个两跳问题',
    demoSecLead: '问题:“《盗梦空间》的导演,还执导过哪些拿了奥斯卡的电影?”——这是个典型的两跳问题。切换“单次 / 多跳”,点“下一步检索”,看标准 RAG 怎么在第一步就卡住,而多跳怎么用第一步的结果驱动第二步、最终拼出完整答案。',
    demo: {
      title: '🎛️ 单次 RAG vs 多跳检索',
      hint: '同一个两跳问题,两种检索策略',
      question: '《盗梦空间》的导演,还执导过哪些拿了奥斯卡的电影?',
      modeSingle: '单次 RAG(查一次)',
      modeMulti: '多跳检索(查→想→再查)',
      nextStep: '下一步检索 ▸',
      reset: '↺ 重置',
      startHint: '点上面的「下一步检索」按钮开始。',
      stepLabel: (n) => `第 ${n} 跳`,
      queryLabel: '本次检索',
      gotLabel: '检索到',
      answerLabel: '当前能给出的答案',
      singleSteps: [
        { query: '《盗梦空间》 导演 还执导过 奥斯卡 电影', got: '《盗梦空间》的导演是克里斯托弗·诺兰。(库里没有任何一段同时包含“盗梦空间导演”和“他的获奖作品”)', answer: '只知道导演是诺兰,无法回答他还导过哪些获奖片。' },
      ],
      singleStuck: '⛔ 标准 RAG 到此为止:它只查一次,而这个问题的第二跳信息(诺兰的获奖作品)需要先知道“导演是诺兰”才能去查。单次检索拿不到。',
      multiSteps: [
        { query: '《盗梦空间》 的导演是谁', got: '《盗梦空间》(2010)由克里斯托弗·诺兰执导。', answer: '已知:导演 = 克里斯托弗·诺兰。还需查他的获奖作品 →' },
        { query: '克里斯托弗·诺兰 执导 奥斯卡获奖 电影', got: '《奥本海默》(2023,诺兰执导)获奥斯卡最佳影片、最佳导演等。', answer: '完整答案:《盗梦空间》的导演是克里斯托弗·诺兰,他执导的《奥本海默》获得了奥斯卡最佳影片与最佳导演。' },
      ],
      multiDone: '✓ 多跳成功:第一跳拿到“诺兰”,用它驱动第二跳查到获奖作品,两步信息一拼,问题解决。',
    },
    // 误区
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '上下文窗口都几百万 token 了,全塞进去就行,RAG 要被淘汰了',
        good: '长上下文与 RAG 互补:前者贵、慢、有“中间遗忘”、难溯源难更新;RAG 仍是精准、可溯源、可实时更新的主力',
        why: <><b>病因:</b>“窗口够大=不用检索”只算了“装得下”,没算“划不划算、靠不靠谱”。把海量资料每轮全塞进去:① <b>成本</b>随上下文长度线性甚至更快增长;② 有<b>“中间遗忘”</b>(lost-in-the-middle)——放在长上下文中段的关键信息常被忽略;③ <b>难溯源</b>(不知道答案出自哪句)、<b>难更新</b>(改一条要重灌整段)。RAG 恰好补这些:精准取相关、能给出处、能实时增删、还便宜。主流共识是二者<b>互补</b>,不是替代。</>,
      },
      {
        bad: 'RAG 就是“查一次拼进去”,这是它的固定形态',
        good: '检索可以是循环:让模型自主决定查不查、查几次(Agentic),或分步交错检索与推理(多跳)',
        why: <><b>病因:</b>入门时学的就是“查一次”,容易把它当成 RAG 的全部。但很多真实问题要么简单到<b>不必查</b>(强行查反而引噪),要么复杂到<b>必须查很多次</b>(多跳)。把“要不要查、查几次”交给模型自主调度(Agentic / Self-RAG),或让它“查一点→推一步→再查”(多跳),RAG 就从一次性动作变成了一个由模型驱动的循环——这也正是它和 L20 Agent 的交汇点。</>,
      },
      {
        bad: 'GraphRAG 更高级、能答全局题,那就所有场景都用它',
        good: 'GraphRAG 擅长全局/综合题,但建图成本高;简单事实问答用普通 RAG 往往更划算',
        why: <><b>病因:</b>“更高级”又被当成“都该用”。GraphRAG 的强项是需要纵观全局、跨大量文档综合的问题,代价是要先用 LLM 把全库抽成知识图谱——<b>建图与维护成本高</b>。对“某条规定是什么”这类局部事实问答,普通向量 RAG 又快又准又便宜,上 GraphRAG 是杀鸡用牛刀。正确做法是<b>按问题类型选架构</b>:局部事实→标准 RAG;全局综合→GraphRAG;多步推理→多跳/Agentic。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. “《盗梦空间》的导演还执导过哪些获奖片”——为什么标准 RAG 容易答不好?Agentic / 多跳怎么解决?',
        a: <>因为这是个<b>两跳问题</b>:答案不在任何单独一段里。标准 RAG 只检索一次,通常只能命中“导演是诺兰”,却拿不到“诺兰的获奖作品”——因为要先知道“诺兰”这个中间结果,才能去查第二跳。<b>多跳 / Agentic RAG</b> 把检索变成循环:第一跳查到“诺兰”→ 用它驱动第二跳查“诺兰的奥斯卡获奖作品”→ 两步信息合并作答。检索从“一次性动作”变成了“查→想→再查”的过程。</>,
      },
      {
        q: '2. 有人说:“上下文都 200 万 token 了,RAG 可以退休了。” 用本课至少三点反驳。',
        a: <>① <b>成本与速度</b>:把海量资料每轮整段塞进去,token 成本随长度飙升、延迟也高,而 RAG 只取相关的一小部分,又快又省;② <b>中间遗忘</b>(lost-in-the-middle):放在长上下文中段的关键信息容易被模型忽略,塞得越多未必读得越准;③ <b>溯源与更新</b>:RAG 能指出答案来自哪篇文档(可溯源),知识更新只需改库里那一条;长上下文既难定位出处,改一条还得重灌整段。结论:二者<b>互补</b>——长上下文适合一次性深读少数长文,RAG 适合从海量、动态知识里精准、可溯源地取料。</>,
      },
      {
        q: '3. 什么样的问题适合上 GraphRAG,什么样的不适合?为什么?',
        a: <><b>适合:</b>需要<b>纵观全局、跨大量文档综合</b>的问题——“把这几百份报告的共同主题总结一下”“X 和 Y 之间有什么关联链条”。这类答案分散在很多文档里,没有哪一块能命中,而 GraphRAG 先把全库抽成知识图谱 + 分层摘要,正好擅长。<b>不适合:</b>“某条规定具体是什么”这类<b>局部事实问答</b>——普通向量 RAG 又快又准又便宜,而 GraphRAG 要先花大成本建图,属杀鸡用牛刀。一句话:按问题类型选架构,别一刀切。</>,
      },
    ],
    finalTitle: '🏁 RAG 三部曲收官:从“能跑”到“查得准、切得好、答得全”',
    finalP1: <>三节走下来,你手里已经有了一整套把玩具 RAG 升级成生产 RAG 的工具箱:① <b>查得准</b>——混合检索、重排序、查询改写;② <b>切得好、量得出</b>——进阶切分与上下文化检索,加上分检索/生成两层的量化评估;③ <b>答得全</b>——Agentic、多跳、GraphRAG,以及看清长上下文与 RAG 的互补分工。</>,
    finalP2: <>留一张选型心智图:<b>局部事实问答</b>→ 标准 RAG(查准 + 切好);<b>多步推理</b>→ 多跳 / Agentic;<b>全局综合</b>→ GraphRAG;<b>少数长文深读</b>→ 长上下文。想动手把这些落到代码,回看 L28 实战;想把“好不好”量化成红线,回看 L29 评估。RAG 仍在飞速演进,但万变不离其宗:<b>让模型在回答前,先拿到对的资料。</b></>,
  },

  en: {
    conceptTitle: '💡 Core Idea: some questions can\'t be answered with one retrieval',
    conceptLead: 'Over the last two lessons, you can now make the standard "retrieve once, stuff into context, let the model answer" pipeline quite solid — retrieval is accurate, chunks are good, quality is measurable. But there\'s a class of questions that no amount of retrieval accuracy or chunking quality can answer in one shot: the answer doesn\'t sit in any single passage, but requires several steps, or synthesis across many documents. This lesson is about how people upgrade RAG when the standard form isn\'t enough.',
    contrastTag1: 'Gut impression',
    contrastBig1: <>RAG is always<span className="gap">retrieve once → stuff context → answer</span></>,
    contrastNote1: 'Treating RAG as one fixed, one-shot action.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Complex questions need<span className="hl">multi-step retrieval, letting the model decide how many times to search, even pre-linking the whole corpus into a knowledge graph</span></>,
    contrastNote2: 'Retrieval can be a loop, a line of reasoning — not just one query.',
    exampleEn: <>Take a question that stumps standard RAG: <span className="hl">"The director of Inception — what other Oscar-winning films has he directed?"</span> One retrieval only finds "the director is Nolan"; to answer fully you must <b>search again</b> with that intermediate result. That needs "multi-hop."</>,
    exampleZh: <>This lesson closes the RAG trilogy and meets L20 "Agents" head-on: once retrieval itself becomes a model-driven loop, RAG takes on the shape of an Agent.</>,
    archTitle: '📖 Four Advanced Architectures: teaching retrieval to "search again" and "see the whole"',
    archLead: 'Standard RAG is "one-shot, local, passive" retrieval. The four upgrades below break past it on "frequency, scope, initiative, and its relationship to long context." Each with an everyday analogy.',
    arch: [
      { n: '01', term: 'Agentic / Self-RAG: let the model decide whether and how many times to search', tag: 'proactive',
        body: <>Standard RAG <b>always searches once</b>, regardless of difficulty. Agentic RAG hands retrieval to the model to schedule: easy questions may <b>skip</b> searching (it already knows), hard ones may <b>search many times</b>, correcting as it goes. <b>Self-RAG</b> goes further, training the model to use special "reflection tokens" to judge <b>whether to retrieve, whether what it got is useful, and whether its own answer holds up</b>. This is essentially L20\'s Agent loop wrapped around retrieval.</>,
        analogy: <><b>Analogy:</b> a novice agent looks up the manual for every question; a veteran judges — this one I answer instantly, that one I cross-check across three sources. Agentic RAG is that judging veteran.</> },
      { n: '02', term: 'Multi-hop retrieval: this step\'s answer is the next step\'s question', tag: 'stepwise',
        body: <>Some questions <b>must</b> be stepwise: you must find A before you know to search for B. "What other award-winning films has Inception\'s director made" — first find "Nolan," then use "Nolan" to search his award winners. <b>Multi-hop retrieval</b> <b>interleaves</b> retrieval and reasoning: search a bit → think a step → search again → think, until the answer is assembled.</>,
        analogy: <><b>Analogy:</b> solving a case: first find the witness (hop one), get the suspect\'s name from them, then check that person\'s alibi (hop two). Clues are dug up link by link.</> },
      { n: '03', term: 'GraphRAG: link the whole corpus into a knowledge graph, then answer "global" questions', tag: 'see the whole',
        body: <>Ordinary RAG retrieves by chunk similarity, great at "local fact" questions (what does a rule say), but stumped by <b>global/synthesis</b> questions ("summarize the main tensions across these hundreds of reports," "what\'s the link between X and Y") — the answer is scattered across many documents, with no single chunk to hit. Microsoft\'s <b>GraphRAG</b> first has an LLM extract the whole corpus into a <b>knowledge graph</b> (entities + relations), then does community clustering and hierarchical summarization, so it can answer questions needing a "whole-picture" view.</>,
        analogy: <><b>Analogy:</b> asked "the character relationships in this book," you can\'t answer by flipping to one page; you draw a relationship chart first, then read the whole from it. GraphRAG builds that chart first.</> },
      { n: '04', term: 'Long context vs RAG: not replacement, but division of labor', tag: 'don\'t misjudge',
        body: <>"Context windows are millions of tokens now — just stuff it all in; should RAG retire?" No. Long context has four weaknesses: <b>expensive</b> (re-reads the whole each turn), <b>slow</b>, <b>"lost in the middle"</b> (info in the middle of long context is easily ignored), <b>hard to source and update</b> (change one item, re-load everything). RAG is precise, citeable, updatable in real time, and cheap. They\'re <b>complementary</b>: RAG fetches precisely from vast, dynamic knowledge; long context suits deep one-off reads of a few long documents.</>,
        analogy: <><b>Analogy:</b> long context is "hauling the whole box of files into the exam and spreading them out" — lots carried, but slow to flip and easy to lose your place; RAG is "open-book with an index, flip precisely to those pages." The broader and more dynamic the scope, the more the latter pays off.</> },
    ],
    archSourceNote: (
      <>
        Self-RAG: Asai et al. (<a href="https://arxiv.org/abs/2310.11511" target="_blank" rel="noreferrer">arXiv:2310.11511</a>, ICLR 2024); multi-hop "reason-while-retrieving": IRCoT (<a href="https://arxiv.org/abs/2212.10509" target="_blank" rel="noreferrer">arXiv:2212.10509</a>); GraphRAG: Microsoft (<a href="https://arxiv.org/abs/2404.16130" target="_blank" rel="noreferrer">arXiv:2404.16130</a>); "lost in the middle": Liu et al. (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noreferrer">arXiv:2307.03172</a>).
      </>
    ),
    demoSecTitle: '🎛️ Interactive Demo: single-shot RAG vs multi-hop, on the same two-hop question',
    demoSecLead: 'Question: "The director of Inception — what other Oscar-winning films has he directed?" — a classic two-hop question. Toggle "single / multi-hop," click "next retrieval," and watch standard RAG get stuck at step one, while multi-hop uses step one\'s result to drive step two and assembles the full answer.',
    demo: {
      title: '🎛️ Single-shot RAG vs Multi-hop Retrieval',
      hint: 'same two-hop question, two retrieval strategies',
      question: 'The director of Inception — what other Oscar-winning films has he directed?',
      modeSingle: 'Single-shot RAG (search once)',
      modeMulti: 'Multi-hop (search → think → search)',
      nextStep: 'Next retrieval ▸',
      reset: '↺ Reset',
      startHint: 'Click "Next retrieval" above to begin.',
      stepLabel: (n) => `Hop ${n}`,
      queryLabel: 'This retrieval',
      gotLabel: 'Retrieved',
      answerLabel: 'Answer possible so far',
      singleSteps: [
        { query: 'Inception director other Oscar films directed', got: 'The director of Inception is Christopher Nolan. (No single passage contains both "Inception\'s director" and "his award-winning films.")', answer: 'Only knows the director is Nolan; cannot say what other award-winning films he made.' },
      ],
      singleStuck: '⛔ Standard RAG ends here: it searches once, but this question\'s second hop (Nolan\'s award winners) requires first knowing "the director is Nolan." One retrieval can\'t get there.',
      multiSteps: [
        { query: 'Who is the director of Inception', got: 'Inception (2010) was directed by Christopher Nolan.', answer: 'Known: director = Christopher Nolan. Still need his award-winning films →' },
        { query: 'Christopher Nolan directed Oscar-winning films', got: 'Oppenheimer (2023, directed by Nolan) won the Oscar for Best Picture, Best Director, and more.', answer: 'Full answer: Inception\'s director is Christopher Nolan; his film Oppenheimer won the Oscars for Best Picture and Best Director.' },
      ],
      multiDone: '✓ Multi-hop succeeds: hop one gets "Nolan," which drives hop two to his award winners; assemble the two steps and the question is solved.',
    },
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Context windows are millions of tokens now — just stuff it all in; RAG is obsolete',
        good: 'Long context and RAG are complementary: the former is expensive, slow, "lost in the middle," hard to source and update; RAG remains the precise, citeable, real-time-updatable workhorse',
        why: <><b>Cause:</b> "big enough window = no retrieval" only counts "fits," not "worth it / reliable." Stuffing vast material in every turn: ① <b>cost</b> grows linearly or faster with context length; ② <b>"lost in the middle"</b> — key info in the middle of long context is often ignored; ③ <b>hard to source</b> (which sentence the answer came from) and <b>hard to update</b> (change one item, reload the whole). RAG fills exactly these: fetch only the relevant, give sources, add/remove in real time, and cheap. The mainstream consensus is <b>complementary</b>, not replacement.</>,
      },
      {
        bad: 'RAG is "retrieve once and stuff in" — that\'s its fixed form',
        good: 'Retrieval can be a loop: let the model decide whether and how many times to search (Agentic), or interleave retrieval and reasoning stepwise (multi-hop)',
        why: <><b>Cause:</b> beginners learn "search once," easily mistaking it for all of RAG. But many real questions are either simple enough to <b>not need a search</b> (forcing one adds noise) or complex enough to <b>need many</b> (multi-hop). Handing "whether and how often to search" to the model (Agentic / Self-RAG), or letting it "search → reason → search" (multi-hop), turns RAG from a one-shot action into a model-driven loop — exactly where it meets L20\'s Agent.</>,
      },
      {
        bad: 'GraphRAG is more advanced and answers global questions, so use it everywhere',
        good: 'GraphRAG excels at global/synthesis questions but is costly to build; for simple fact Q&A, ordinary RAG is often more economical',
        why: <><b>Cause:</b> "more advanced" again mistaken for "use it always." GraphRAG\'s strength is questions needing a whole-picture view and synthesis across many documents, at the cost of first having an LLM extract the whole corpus into a knowledge graph — <b>expensive to build and maintain</b>. For "what does a rule say" local fact Q&A, ordinary vector RAG is fast, accurate, and cheap; GraphRAG is overkill. The right way is to <b>choose the architecture by question type</b>: local fact → standard RAG; global synthesis → GraphRAG; multi-step reasoning → multi-hop / Agentic.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. "What other award-winning films has Inception\'s director made" — why does standard RAG struggle, and how do Agentic / multi-hop solve it?',
        a: <>Because it\'s a <b>two-hop question</b>: the answer isn\'t in any single passage. Standard RAG retrieves once and usually only hits "the director is Nolan," but can\'t get "Nolan\'s award winners" — that requires first knowing the intermediate result "Nolan" to drive the second hop. <b>Multi-hop / Agentic RAG</b> makes retrieval a loop: hop one finds "Nolan" → use it to drive hop two for "Nolan\'s Oscar winners" → merge the two steps to answer. Retrieval goes from a one-shot action to a "search → think → search" process.</>,
      },
      {
        q: '2. Someone says: "Context is 2M tokens now, RAG can retire." Rebut with at least three points from this lesson.',
        a: <>① <b>Cost and speed</b>: stuffing vast material in every turn makes token cost soar with length and latency high, while RAG fetches only a small relevant part — faster and cheaper; ② <b>lost in the middle</b>: key info in the middle of long context is easily ignored, so more isn\'t read more accurately; ③ <b>sourcing and updating</b>: RAG can point to which document an answer came from (citeable) and updates by changing just that one item in the store; long context is hard to source and requires reloading the whole to change one item. Conclusion: <b>complementary</b> — long context for deep one-off reads of a few long docs, RAG for precise, citeable fetching from vast, dynamic knowledge.</>,
      },
      {
        q: '3. What kind of question suits GraphRAG, and what doesn\'t? Why?',
        a: <><b>Suits:</b> questions needing a <b>whole-picture view and synthesis across many documents</b> — "summarize the common themes across these hundreds of reports," "what\'s the chain of connection between X and Y." Such answers are scattered across many docs with no single chunk to hit, and GraphRAG\'s corpus-wide knowledge graph + hierarchical summaries are exactly suited. <b>Doesn\'t suit:</b> "what exactly does a rule say" <b>local fact Q&A</b> — ordinary vector RAG is fast, accurate, and cheap, while GraphRAG must first pay to build the graph, an overkill. In a line: choose the architecture by question type, don\'t one-size-fit-all.</>,
      },
    ],
    finalTitle: '🏁 The RAG Trilogy Concludes: from "it runs" to "accurate retrieval, good chunking, complete answers"',
    finalP1: <>Three lessons in, you hold a full toolbox for upgrading toy RAG to production RAG: ① <b>find it accurately</b> — hybrid search, reranking, query rewriting; ② <b>chunk well, measure well</b> — advanced chunking and contextual retrieval, plus two-layer (retrieval/generation) quantitative evaluation; ③ <b>answer completely</b> — Agentic, multi-hop, GraphRAG, and a clear view of how long context and RAG divide the labor.</>,
    finalP2: <>Keep a selection mental map: <b>local fact Q&A</b> → standard RAG (accurate retrieval + good chunks); <b>multi-step reasoning</b> → multi-hop / Agentic; <b>global synthesis</b> → GraphRAG; <b>deep read of a few long docs</b> → long context. To put these into code, revisit L28 hands-on; to turn "good or not" into hard lines, revisit L29 evaluation. RAG keeps evolving fast, but the essence never changes: <b>get the model the right material before it answers.</b></>,
  },
}

// ---- 单次 vs 多跳检索演示 ----
function MultiHopDemo({ c }) {
  const d = c.demo
  const [multi, setMulti] = useState(false)
  const [step, setStep] = useState(0) // 已完成的检索跳数

  const steps = multi ? d.multiSteps : d.singleSteps
  const maxStep = steps.length
  const done = step >= maxStep
  const switchMode = (m) => { setMulti(m); setStep(0) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 20 }}>
        <div className="example" style={{ margin: 0 }}><div className="en" style={{ fontWeight: 700 }}>❓ {d.question}</div></div>

        <div className="chips">
          <button className={`chip${!multi ? ' active' : ''}`} onClick={() => switchMode(false)}>{d.modeSingle}</button>
          <button className={`chip${multi ? ' active' : ''}`} onClick={() => switchMode(true)}>{d.modeMulti}</button>
        </div>

        <div className="chips">
          <button className="chip" disabled={done} onClick={() => setStep((s) => Math.min(maxStep, s + 1))}>{d.nextStep}</button>
          <button className="chip" onClick={() => setStep(0)}>{d.reset}</button>
        </div>

        {/* 检索步骤 */}
        <div style={{ display: 'grid', gap: 10 }}>
          {steps.slice(0, step).map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '14px 16px', display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sky)' }}>{d.stepLabel(i + 1)}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-1)' }}><b>{d.queryLabel}:</b> <code>{s.query}</code></div>
              <div style={{ fontSize: 13, color: 'var(--fg-1)' }}><b>{d.gotLabel}:</b> {s.got}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-0)', borderTop: '1px solid var(--hairline)', paddingTop: 6 }}><b>{d.answerLabel}:</b> {s.answer}</div>
            </div>
          ))}
          {step === 0 && <p className="footnote" style={{ margin: 0 }}>{d.startHint}</p>}
        </div>

        {/* 结论 */}
        {done && (
          <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: multi ? 'var(--sage)' : 'var(--terracotta)' }}>
            {multi ? d.multiDone : d.singleStuck}
          </p>
        )}
      </div>
    </div>
  )
}

export default function LRag3() {
  const { lang } = useLang()
  const c = C[lang] || C.zh

  return (
    <>
      <Lsec title={c.conceptTitle} lead={c.conceptLead}>
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
        <div className="example mt14">
          <div className="en">{c.exampleEn}</div>
          <div className="zh">{c.exampleZh}</div>
        </div>
      </Lsec>

      <Lsec title={c.archTitle} lead={c.archLead}>
        <div className="card row-list">
          {c.arch.map((l, i) => (
            <div className="example" key={i}>
              <div className="en">
                <span className="pill pill-ink" style={{ marginRight: 8 }}>{l.n}</span>
                <b>{l.term}</b>
                <span className="pill pill-sky" style={{ marginLeft: 8 }}>{l.tag}</span>
              </div>
              <div className="zh" style={{ marginTop: 6 }}>{l.body}</div>
              <div className="zh" style={{ marginTop: 6, color: 'var(--fg-2)' }}>{l.analogy}</div>
            </div>
          ))}
        </div>
        <p className="footnote source-note">{c.archSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <MultiHopDemo c={c} />
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

      <Lsec title={c.finalTitle}>
        <div className="card card-pad">
          <p style={{ fontSize: 16, lineHeight: 1.9 }}>{c.finalP1}</p>
          <p style={{ fontSize: 16, lineHeight: 1.9, marginTop: 12 }}>{c.finalP2}</p>
        </div>
      </Lsec>
    </>
  )
}
