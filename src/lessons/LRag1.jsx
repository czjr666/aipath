import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// RAG 进阶 ① · 为什么查不准,怎么查准(高级检索)
// 接 L18《RAG》。事实依据:BEIR(arXiv:2104.08663)、SBERT Retrieve&Re-rank
// 官方文档、HyDE(Gao et al. arXiv:2212.10496, ACL 2023)、RAG-Fusion / RRF。
// ============================================================

const C = {
  zh: {
    conceptTitle: '💡 核心概念:RAG 查不准,八成不是模型笨,是“没找对资料”',
    conceptLead: 'L18 里你已经搭起了 RAG 的骨架:把资料切块、转成向量、按相似度检索、拼进上下文让模型回答。但真把它用起来,你很快会撞上同一堵墙——它答得不对,或者答得很泛。新手第一反应是“模型不行”,于是去换更大的模型;但十有八九,问题出在中间那步:检索(retrieval)根本没把对的资料捞上来。模型再聪明,拿到的是错小抄,也只能照着错。',
    contrastTag1: '直觉印象',
    contrastBig1: <>RAG 答不好,是<span className="gap">模型不够强</span>,换个大模型就好了</>,
    contrastNote1: '把锅甩给“大脑”,于是不停换更贵的模型。',
    contrastTag2: '真实机制',
    contrastBig2: <>大多数 RAG 的瓶颈在<span className="hl">检索这一步</span>:对的资料没被捞上来,模型只能照着错小抄答</>,
    contrastNote2: '提升检索质量,往往比换模型便宜得多、有效得多。',
    exampleEn: <>一句话定调:<span className="hl">RAG 的上限,是检索的上限。</span> 检索没召回正确文档,后面再强的模型也救不回来——所以这一课只干一件事:把“查得准”这步做扎实,靠三件套:混合检索、重排序、查询改写。</>,
    exampleZh: <>这正是 L18“开卷考试”比喻的下半句:小抄带了还不够,你得真的<b>翻到对的那一页</b>。这一课讲的就是怎么翻得又快又准。</>,
    // 三件套
    kitTitle: '📖 高级检索三件套:把“查得准”一层层做厚',
    kitLead: '玩具 RAG 只做一件事:把问题转成一个向量,按相似度捞最近的几块。生产级 RAG 在这之上加三层。每条配一个生活类比,也点出它治的是哪种“查不准”。',
    kit: [
      { n: '01', term: '混合检索:向量 + 关键词,各补各的盲区', tag: '别漏精确词',
        body: <>纯向量擅长“懂意思”(把“登录转圈”和“无法进入账号”看成近义),但会<b>漏掉精确词面</b>——错误码 <code>E-4012</code>、产品型号、人名、专有缩写,这些恰恰最该精确命中。老牌的<b>关键词检索(BM25)</b>正好相反:精确词面一抓一个准,却不懂同义改写。两者失败模式互补,所以<b>合起来用</b>(hybrid),向量管语义、BM25 管精确词。</>,
        analogy: <><b>类比:</b>查资料时,一边凭“大概讲什么”去翻(向量),一边用 Ctrl+F 搜精确的型号编号(关键词)。两种都用,才不漏。</> },
      { n: '02', term: '重排序:先粗捞一大把,再精挑几条', tag: '把对的顶上来',
        body: <>检索有个两难:算得快的(双编码器,query 和文档分开编码、能预存向量)不够准,算得准的(<b>交叉编码器</b>,把 query 和文档拼在一起细读)太慢、没法对全库逐一算。生产做法是<b>两阶段</b>:先用快的<b>粗召回 Top-50</b>(宁可多捞、别漏),再用慢而准的交叉编码器<b>精排出 Top-5</b>。这一步通常是性价比最高的质量旋钮。</>,
        analogy: <><b>类比:</b>招聘先用关键词海筛出 50 份简历(快、糙),再让面试官逐份细读挑出 5 个(慢、准)。没人会让面试官一开始就读完全部上万份。</> },
      { n: '03', term: '查询改写:先把问题“翻译”成资料的说法', tag: '对齐措辞',
        body: <>用户的问法常和文档的写法对不上:你问“这破软件咋老闪退”,文档里写的是“应用程序异常终止的处理”。<b>查询改写</b>让 LLM 先把问题<b>改写/扩展成更检索友好的多个版本</b>再去查;更激进的 <b>HyDE</b> 干脆让 LLM <b>先编一个“假设答案”</b>,再拿这个假答案去检索真文档——因为“答案”往往比“问题”在用词上更接近目标文档。</>,
        analogy: <><b>类比:</b>去外国问路,与其用母语硬问,不如先把问题翻译成当地话、甚至先想象“路牌大概怎么写”,再照着找。</> },
    ],
    kitSourceNote: (
      <>
        稠密检索在罕见词/域外的短板见 BEIR 基准(<a href="https://arxiv.org/abs/2104.08663" target="_blank" rel="noreferrer">arXiv:2104.08663</a>);两阶段“召回+重排”见{' '}
        <a href="https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html" target="_blank" rel="noreferrer">Sentence-Transformers 官方文档</a>
        ;HyDE 见 Gao 等《Precise Zero-Shot Dense Retrieval without Relevance Labels》(<a href="https://arxiv.org/abs/2212.10496" target="_blank" rel="noreferrer">arXiv:2212.10496</a>, ACL 2023)。
      </>
    ),
    // 演示
    demoSecTitle: '🎛️ 交互演示:同一个刁钻问题,三种检索谁能命中正解',
    demoSecLead: '一个真实工单的问题里,既有精确编号(E-4012),又有口语化的症状描述(一直转圈)。点下面三种检索方式,看各自捞回哪几篇、正解(⭐)排第几——你会亲眼看到向量和关键词各自的盲区,以及“混合+重排”怎么把正解顶到第一。',
    demo: {
      title: '🎛️ 检索方式对比 · 谁能把正解排第一',
      hint: '⭐ = 唯一正解(既含编号又贴合症状)',
      query: '用户问题:“登录一直转圈,后台报 E-4012,怎么修?”',
      modes: { vec: '纯向量(只懂语义)', kw: '纯关键词 / BM25(只抓精确词)', hybrid: '混合 + 重排(两者合并精排)' },
      rankLabel: '正解排名',
      missed: '未命中 ✗',
      hitN: (n) => `第 ${n} 名`,
      retrieved: '已召回',
      verdictVec: '纯向量:捞到了“转圈/卡住”这类同义页,却漏了只靠编号匹配的《E-4012 手册》,也没能把最全的正解排到第一。',
      verdictKw: '纯关键词:靠 E-4012 命中了含编号的文档,却漏了换了说法、不含编号的概念页;而且正解和无关手册同分,分不出高下。',
      verdictHybrid: '混合 + 重排:两路结果合并后精排,“既含编号又贴合症状”的正解稳稳排第一 —— 这就是三件套的威力。',
    },
    docTitles: {
      concept: '《登录页面一直转圈、卡住的排查》',
      manual: '《E-4012 故障码处理手册》',
      target: '《登录报错 E-4012:令牌过期导致页面卡住》',
      e4011: '《E-4011 网络超时说明》',
      pay: '《支付失败的常见原因》',
      avatar: '《如何修改头像》',
    },
    // 误区
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'RAG 答得不好,就是大模型不够聪明,换个更强的模型',
        good: '先查检索:对的资料有没有被捞上来。检索是上限,模型只能在捞到的资料里发挥',
        why: <><b>病因:</b>“答错=脑子笨”是最省事的归因,于是不停换更贵的模型,钱花了效果有限。但 RAG 是开卷考试:<b>小抄错了,学霸也抄错</b>。排查顺序应该反过来——先确认检索召回了正确文档(打印出检索到的内容看一眼),再谈生成。很多“模型不行”的锅,其实是混合检索缺失、Top-k 设太小、或问题与文档措辞对不上。</>,
      },
      {
        bad: '用了向量检索就够了,语义搜索是万能的',
        good: '向量会漏精确词(编号/型号/人名),要叠加关键词检索(BM25)做混合',
        why: <><b>病因:</b>向量检索“很 AI、很高级”,容易让人以为它包打天下。但它的强项是语义泛化,短板正是<b>精确词面匹配</b>:你搜订单号 <code>20240614-88</code>、错误码、罕见专名,向量常常给你一堆“语义相近但不是它”的东西。BEIR 等基准早就显示稠密检索在罕见词/域外场景会掉链子。对这类查询,老土的 BM25 反而稳——所以生产系统几乎都是两者混合。</>,
      },
      {
        bad: '查不准?把 Top-k 调大、多塞几篇进上下文就行了',
        good: '盲目调大 k 会引入更多噪声、还更贵;正确做法是“粗召回大 + 重排序精挑小”',
        why: <><b>病因:</b>“多给点资料”听起来稳,但把 k 从 5 调到 50 直接塞给模型,等于把 45 篇噪声也塞了进去——模型更容易被带偏(还记得 L18 的“干扰项”和长上下文的“中间遗忘”),token 成本也飙升。正解是<b>两阶段</b>:粗召回可以捞 50 篇(宽),但要再用交叉编码器<b>重排序精挑出最相关的 5 篇</b>(准)喂给模型。捞得宽 ≠ 喂得多。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 你的客服 RAG 在被问到“错误码 E-4012 怎么解决”时总答非所问,但问“登录问题”却答得不错。最可能是哪出了问题?怎么修?',
        a: <>最可能是<b>纯向量检索漏了精确词</b>。“E-4012”是个精确词面,向量检索擅长语义、却常抓不准这种编号/型号,于是把一堆“语义相近但不含该码”的文档捞了上来;而“登录问题”是宽泛语义,向量正好擅长。<b>修法:加关键词检索(BM25)做混合检索</b>,让 BM25 精确命中含 E-4012 的文档,再与向量结果合并、重排。这是混合检索的典型适用场景。</>,
      },
      {
        q: '2. “粗召回 Top-50 再重排出 Top-5”,为什么不直接“精确地只召回 Top-5”一步到位?',
        a: <>因为“快”和“准”在检索里很难兼得。能对<b>全库逐一打分</b>的必须是<b>快的</b>方法(双编码器:文档向量可预先算好存起来),但它不够准;<b>准的</b>方法(交叉编码器:把 query 和每篇文档拼起来细读)太慢,没法对成千上万篇逐一算。于是分两段:用快的<b>宽召回</b>(Top-50,宁多勿漏)把候选缩到几十篇,再用慢而准的交叉编码器只对这几十篇<b>精排</b>出 Top-5。一步到位做不到,是因为没有又快又准的单一方法。</>,
      },
      {
        q: '3. HyDE 让模型“先编一个假设答案,再拿它去检索”。明明可能编错,为什么反而能提升检索?',
        a: <>因为检索靠的是<b>文本相似度</b>,而<b>“答案”在用词和结构上,往往比“问题”更接近目标文档</b>。用户的问题可能很口语、很短(“咋老闪退”),与文档措辞对不上;而一个假设答案(哪怕细节是编的)会自然带上该领域的术语和句式(“应用程序异常终止通常由……”),拿它去做向量检索,更容易命中真正相关的文档。注意:用的是假设答案的<b>向量</b>去捞<b>真实</b>文档,最终喂给模型的仍是检索回来的真资料,编造的细节不会进入最终答案。</>,
      },
    ],
    finalTitle: '➡️ RAG 进阶 ①小结 · 下一节:切得好,量得出',
    finalP1: <>这一节把 RAG 最常被忽视、却最关键的一环补上了:<b>查得准</b>。记住三件套——<b>混合检索</b>(向量+关键词补盲区)、<b>重排序</b>(粗召回大、精排小)、<b>查询改写</b>(对齐问题与文档的措辞)。它们共同回答了“为什么我的 RAG 查不准”。</>,
    finalP2: <>但检索质量还有更上游的两个决定因素:资料<b>怎么切</b>(切坏了,正确答案被劈成两半,再好的检索也捞不全),以及你<b>怎么知道</b>自己的 RAG 到底好不好(凭感觉调参是大忌)。下一节 RAG ② 就讲这两件事:进阶切分,与如何量化评估一个 RAG 系统。</>,
  },

  en: {
    conceptTitle: '💡 Core Idea: when RAG misses, it\'s usually not a dumb model — it\'s "didn\'t find the right material"',
    conceptLead: 'In L18 you built RAG\'s skeleton: chunk the material, embed it, retrieve by similarity, stuff it into context, and let the model answer. But put it to real use and you hit the same wall: it answers wrong, or too vaguely. The beginner\'s reflex is "the model is weak," so they swap in a bigger one. But nine times out of ten the problem is the middle step: retrieval didn\'t bring up the right material. However smart the model, given a wrong cheat sheet it can only copy the wrong thing.',
    contrastTag1: 'Gut impression',
    contrastBig1: <>RAG answers poorly because<span className="gap">the model isn\'t strong enough</span>; a bigger model fixes it</>,
    contrastNote1: 'Blame the "brain," and keep paying for pricier models.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Most RAG bottlenecks are in<span className="hl">retrieval</span>: the right material isn\'t brought up, so the model can only copy a wrong cheat sheet</>,
    contrastNote2: 'Improving retrieval is often far cheaper and more effective than swapping models.',
    exampleEn: <>One line sets the tone: <span className="hl">RAG\'s ceiling is retrieval\'s ceiling.</span> If retrieval doesn\'t recall the right document, no model downstream can save it — so this lesson does one thing: make "find it accurately" solid, via three moves: hybrid search, reranking, query rewriting.</>,
    exampleZh: <>This is the second half of L18\'s "open-book exam" metaphor: bringing the cheat sheet isn\'t enough — you have to actually <b>turn to the right page</b>. This lesson is about turning to it fast and accurately.</>,
    kitTitle: '📖 The Advanced Retrieval Trio: thickening "find it accurately" layer by layer',
    kitLead: 'Toy RAG does one thing: embed the question and grab the nearest few chunks by similarity. Production RAG adds three layers on top. Each comes with an everyday analogy and names the kind of "miss" it cures.',
    kit: [
      { n: '01', term: 'Hybrid search: vectors + keywords cover each other\'s blind spots', tag: 'don\'t miss exact terms',
        body: <>Pure vectors are great at "meaning" (seeing "login spinning" and "can\'t get into account" as synonyms) but <b>miss exact surface terms</b> — error code <code>E-4012</code>, model numbers, names, acronyms, exactly what should match precisely. Classic <b>keyword search (BM25)</b> is the opposite: nails exact terms but doesn\'t get paraphrases. Their failure modes are complementary, so you <b>combine them</b> (hybrid): vectors for semantics, BM25 for exact terms.</>,
        analogy: <><b>Analogy:</b> researching, you both skim by "what it\'s roughly about" (vectors) and Ctrl+F the exact model number (keywords). Use both, miss nothing.</> },
      { n: '02', term: 'Reranking: scoop up a big batch first, then handpick a few', tag: 'float the right one up',
        body: <>Retrieval has a dilemma: the fast method (bi-encoder, encoding query and doc separately so vectors can be precomputed) isn\'t accurate enough; the accurate method (<b>cross-encoder</b>, reading query and doc jointly) is too slow to score the whole corpus. Production uses <b>two stages</b>: a fast <b>coarse recall of Top-50</b> (scoop generously, don\'t miss), then a slow-but-accurate cross-encoder to <b>rerank down to Top-5</b>. This is often the highest-ROI quality knob.</>,
        analogy: <><b>Analogy:</b> hiring first keyword-screens 50 résumés (fast, rough), then has interviewers read each to pick 5 (slow, accurate). Nobody has interviewers read all ten thousand up front.</> },
      { n: '03', term: 'Query rewriting: translate the question into the material\'s wording first', tag: 'align phrasing',
        body: <>Users\' phrasing often doesn\'t match the docs: you ask "why does this junk keep crashing," the doc says "handling abnormal application termination." <b>Query rewriting</b> has the LLM first <b>rewrite/expand the question into several retrieval-friendly versions</b>; the bolder <b>HyDE</b> has the LLM <b>fabricate a "hypothetical answer"</b> first, then retrieve real docs with it — because an "answer" is usually closer in wording to the target document than the "question" is.</>,
        analogy: <><b>Analogy:</b> asking directions abroad, rather than insisting in your own language, first translate the question into the local tongue — even imagine how the signs are worded — then go find it.</> },
    ],
    kitSourceNote: (
      <>
        Dense retrieval\'s weakness on rare/out-of-domain terms: the BEIR benchmark (<a href="https://arxiv.org/abs/2104.08663" target="_blank" rel="noreferrer">arXiv:2104.08663</a>); the two-stage "recall + rerank": {' '}
        <a href="https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html" target="_blank" rel="noreferrer">Sentence-Transformers docs</a>
        ; HyDE: Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels" (<a href="https://arxiv.org/abs/2212.10496" target="_blank" rel="noreferrer">arXiv:2212.10496</a>, ACL 2023).
      </>
    ),
    demoSecTitle: '🎛️ Interactive Demo: one tricky question, which retrieval floats the right answer to #1',
    demoSecLead: 'A real ticket\'s question contains both an exact code (E-4012) and a colloquial symptom (keeps spinning). Click the three retrieval methods below and see which docs each scoops up and where the right answer (⭐) ranks — you\'ll see the blind spots of vectors and keywords, and how "hybrid + rerank" floats the right answer to #1.',
    demo: {
      title: '🎛️ Retrieval Methods Compared · who ranks the answer #1',
      hint: '⭐ = the one correct doc (has both the code and the symptom)',
      query: 'User question: "Login keeps spinning, backend reports E-4012, how to fix?"',
      modes: { vec: 'Pure vector (semantics only)', kw: 'Pure keyword / BM25 (exact terms only)', hybrid: 'Hybrid + rerank (merge then rerank)' },
      rankLabel: 'Answer\'s rank',
      missed: 'missed ✗',
      hitN: (n) => `#${n}`,
      retrieved: 'retrieved',
      verdictVec: 'Pure vector: found synonym pages like "spinning/stuck," but missed the code-only "E-4012 Manual," and failed to rank the most complete answer first.',
      verdictKw: 'Pure keyword: hit the code-bearing docs via E-4012, but missed the paraphrased concept page without the code; and the answer ties with an irrelevant manual, indistinguishable.',
      verdictHybrid: 'Hybrid + rerank: after merging both and reranking, the answer that "has both the code and fits the symptom" sits firmly at #1 — the power of the trio.',
    },
    docTitles: {
      concept: '"Troubleshooting a login page that keeps spinning / freezing"',
      manual: '"E-4012 Fault Code Handling Manual"',
      target: '"Login error E-4012: token expiry causes the page to hang"',
      e4011: '"E-4011 Network Timeout Notes"',
      pay: '"Common Causes of Payment Failure"',
      avatar: '"How to Change Your Avatar"',
    },
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'RAG answering poorly means the model isn\'t smart enough; swap in a stronger one',
        good: 'Check retrieval first: was the right material brought up? Retrieval is the ceiling; the model can only work with what was retrieved',
        why: <><b>Cause:</b> "wrong answer = dumb brain" is the lazy attribution, so people keep paying for pricier models with limited gains. But RAG is an open-book exam: <b>a wrong cheat sheet makes even an A-student copy wrong</b>. Reverse the order — first confirm retrieval recalled the right doc (print what was retrieved and look), then talk generation. Many "the model is weak" complaints are really missing hybrid search, too-small Top-k, or question-vs-doc wording mismatch.</>,
      },
      {
        bad: 'Vector search is enough; semantic search is all-powerful',
        good: 'Vectors miss exact terms (codes/models/names); add keyword search (BM25) for a hybrid',
        why: <><b>Cause:</b> vector search feels "AI and advanced," tempting the belief it does everything. But its strength is semantic generalization; its weakness is exactly <b>exact-term matching</b>: search an order number <code>20240614-88</code>, an error code, a rare proper noun, and vectors often hand you "semantically close but not it." Benchmarks like BEIR long showed dense retrieval falters on rare/out-of-domain terms. For such queries, plain old BM25 is steadier — so production systems are almost all hybrids.</>,
      },
      {
        bad: 'Missing the mark? Just raise Top-k and stuff more docs into context',
        good: 'Blindly raising k adds noise and cost; the right move is "large coarse recall + reranked small selection"',
        why: <><b>Cause:</b> "give it more material" sounds safe, but raising k from 5 to 50 and dumping it on the model also dumps in 45 noise docs — easier to mislead (recall L18\'s "distractors" and long-context "lost in the middle"), and token cost soars. The fix is <b>two stages</b>: coarse recall can scoop 50 (wide), but then a cross-encoder <b>reranks to the 5 most relevant</b> (accurate) for the model. Scooping wide ≠ feeding much.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Your support RAG always wanders off when asked "how to solve error code E-4012," but answers "login problems" well. What\'s most likely wrong, and how to fix it?',
        a: <>Most likely <b>pure vector retrieval missing the exact term</b>. "E-4012" is an exact surface term; vector search is great at semantics but often can\'t pin down such codes/models, so it scoops up "semantically close but code-less" docs; "login problems" is broad semantics, which vectors handle well. <b>Fix: add keyword search (BM25) for a hybrid</b>, letting BM25 precisely hit docs containing E-4012, then merge with vector results and rerank. A textbook case for hybrid search.</>,
      },
      {
        q: '2. "Coarse recall Top-50 then rerank to Top-5" — why not just "precisely recall only the Top-5" in one shot?',
        a: <>Because "fast" and "accurate" are hard to combine in retrieval. The method that can <b>score the whole corpus</b> must be the <b>fast</b> one (bi-encoder: doc vectors precomputed and stored), but it\'s not accurate enough; the <b>accurate</b> method (cross-encoder: read query and each doc jointly) is too slow to run over thousands of docs. So split into two: a fast <b>wide recall</b> (Top-50, better too many than too few) narrows candidates to dozens, then the slow-accurate cross-encoder <b>reranks</b> only those to Top-5. One shot fails because there\'s no single method that\'s both fast and accurate.</>,
      },
      {
        q: '3. HyDE has the model "fabricate a hypothetical answer, then retrieve with it." It might be wrong — so why does it improve retrieval?',
        a: <>Because retrieval runs on <b>text similarity</b>, and <b>an "answer" is usually closer in wording and structure to the target document than the "question" is</b>. A user\'s question can be colloquial and short ("why does it keep crashing"), mismatching the docs; a hypothetical answer (even with fabricated details) naturally carries the domain\'s terms and phrasing ("abnormal application termination is usually caused by…"), so retrieving with it more easily hits truly relevant docs. Note: it\'s the hypothetical answer\'s <b>vector</b> used to fetch <b>real</b> docs; what\'s fed to the model is still the retrieved real material, so the fabricated details don\'t enter the final answer.</>,
      },
    ],
    finalTitle: '➡️ Advanced RAG ① recap · Next: Chunk Well, Measure Well',
    finalP1: <>This lesson filled in RAG\'s most overlooked yet most critical link: <b>finding it accurately</b>. Remember the trio — <b>hybrid search</b> (vectors + keywords cover blind spots), <b>reranking</b> (wide recall, narrow selection), <b>query rewriting</b> (align question and doc wording). Together they answer "why does my RAG miss the mark."</>,
    finalP2: <>But retrieval quality has two more upstream determinants: <b>how you chunk</b> the material (chunk it badly and the right answer is split in half, beyond any retriever\'s reach), and <b>how you know</b> whether your RAG is actually any good (tuning by gut feeling is a cardinal sin). The next lesson, RAG ②, covers exactly these: advanced chunking, and how to quantitatively evaluate a RAG system.</>,
  },
}

// ---- 检索方式对比演示 ----
// 文档库与查询用语言无关的 token 匹配;标题文案在 C[lang].docTitles。
// sem=语义关键词,kw=精确词面,star=唯一正解(既含编号又贴合症状)。
const DOCS = [
  { id: 'concept', sem: ['login', 'spin', 'stuck'], kw: [] },
  { id: 'manual', sem: ['troubleshoot'], kw: ['E-4012'] },
  { id: 'target', sem: ['login', 'stuck', 'error'], kw: ['E-4012'], star: true },
  { id: 'e4011', sem: ['net', 'timeout'], kw: ['E-4011'] },
  { id: 'pay', sem: ['pay', 'order'], kw: [] },
  { id: 'avatar', sem: ['avatar'], kw: [] },
]
const QUERY = { sem: ['login', 'spin', 'stuck', 'error'], kw: ['E-4012'] }

function RetrievalDemo({ c }) {
  const d = c.demo
  const [mode, setMode] = useState('vec')

  const docs = DOCS
  const qSem = QUERY.sem
  const qKw = QUERY.kw

  const vec = (x) => x.sem.filter((k) => qSem.includes(k)).length
  const kw = (x) => x.kw.filter((k) => qKw.includes(k)).length
  const rer = (x) => vec(x) + kw(x) * 1.5

  let ranked
  if (mode === 'vec') ranked = docs.map((x) => ({ x, s: vec(x) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s)
  else if (mode === 'kw') ranked = docs.map((x) => ({ x, s: kw(x) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s)
  else ranked = docs.map((x) => ({ x, s: rer(x) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s)

  const top = ranked.slice(0, 3)
  const topIds = top.map((r) => r.x.id)
  const starRank = top.findIndex((r) => r.x.star) // 0-based among top3
  const verdict = mode === 'vec' ? d.verdictVec : mode === 'kw' ? d.verdictKw : d.verdictHybrid
  const vColor = mode === 'hybrid' ? 'var(--sage)' : 'var(--terracotta)'

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 22 }}>
        <div className="example" style={{ margin: 0 }}><div className="en" style={{ fontWeight: 700 }}>{d.query}</div></div>

        <div className="chips">
          {['vec', 'kw', 'hybrid'].map((m) => (
            <button key={m} className={`chip${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>{d.modes[m]}</button>
          ))}
        </div>

        {/* 文档库 */}
        <div style={{ display: 'grid', gap: 8 }}>
          {docs.map((doc) => {
            const r = topIds.indexOf(doc.id)
            const hit = r >= 0
            return (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                border: `1px solid ${hit ? (doc.star ? 'var(--sage)' : 'var(--hairline-strong)') : 'var(--hairline)'}`,
                borderRadius: 10,
                background: hit ? (doc.star ? 'var(--sage-bg)' : 'var(--bg-inset)') : 'transparent',
                opacity: hit ? 1 : 0.4,
                padding: '10px 14px', transition: 'all .25s ease',
              }}>
                <span style={{ width: 30, flex: 'none', fontWeight: 800, fontSize: 13, color: hit ? 'var(--fg-0)' : 'var(--fg-2)' }}>{hit ? `#${r + 1}` : '–'}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--fg-0)' }}>{doc.star ? '⭐ ' : ''}{c.docTitles[doc.id]}</span>
              </div>
            )
          })}
        </div>

        {/* 正解排名 */}
        <div style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 600 }}>{d.rankLabel}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: starRank === 0 ? 'var(--sage)' : starRank > 0 ? 'var(--amber)' : 'var(--terracotta)' }}>{starRank >= 0 ? d.hitN(starRank + 1) : d.missed}</span>
        </div>

        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: vColor }}>{verdict}</p>
      </div>
    </div>
  )
}

export default function LRag1() {
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

      <Lsec title={c.kitTitle} lead={c.kitLead}>
        <div className="card row-list">
          {c.kit.map((l, i) => (
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
        <p className="footnote source-note">{c.kitSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <RetrievalDemo c={c} />
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
