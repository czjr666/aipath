import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// RAG 进阶 ② · 切得好,量得出(进阶切分 + 评估)
// 事实依据:LangChain/LlamaIndex 官方文档(进阶 chunking)、
// Anthropic《Introducing Contextual Retrieval》(2024-09-19,
// 检索失败率 Top-20 相对下降 49%/+重排 67%,自评口径)、
// RAGAS(arXiv:2309.15217)。
// ============================================================

const C = {
  zh: {
    conceptTitle: '💡 核心概念:切分定上限,评估定方向',
    conceptLead: '上一节解决了“怎么查得准”。但还有两件事——一前一后——决定你的 RAG 能走多远。其一在检索之前:资料“怎么切块”。切坏了,一个完整答案被劈成两半分到两个块里,任何检索都不可能把它捞全——切分,定的是检索能达到的上限。其二在调优之时:你“怎么知道”改动有没有用。RAG 的旋钮一大把(块大小、重叠、Top-k、阈值、要不要重排……),凭感觉调是大忌——评估,定的是你优化的方向。',
    contrastTag1: '直觉印象',
    contrastBig1: <>切多大块无所谓,RAG 好不好<span className="gap">凭感觉</span>调调就行</>,
    contrastNote1: '把切分当杂活,把效果当玄学。',
    contrastTag2: '真实机制',
    contrastBig2: <>切分是检索的<span className="hl">硬上限</span>,而 RAG 必须<span className="hl">分层量化评估</span>,否则你是在盲调</>,
    contrastNote2: '“垃圾进垃圾出”先发生在切分;“测不准就调不动”发生在评估。',
    exampleEn: <>两句话定调:<span className="hl">切分决定“答案在不在某一块里”,评估决定“你知不知道自己在变好还是变坏”。</span> 这一节把这一前一后两件事补齐,你的 RAG 才算从“能跑”走向“可控”。</>,
    exampleZh: <>承接 L28 的“亲手切文档”:那一课教你切,这一课教你<b>切得聪明</b>,并第一次回答“怎么证明它真的变好了”——这也呼应 L29 的评估精神。</>,
    // A. 进阶切分
    chunkTitle: '📖 一、进阶切分:别让答案被劈成两半',
    chunkLead: '最朴素的切分按固定字数一刀刀切,问题是它对内容“无知”——可能正好把一句完整的因果、一张表、一段定义从中间切断。下面四种进阶切法,层层缓解这个问题。',
    chunk: [
      { n: '01', term: '固定大小 + 重叠:最基础的“防切断”', tag: '入门',
        body: <>在按字数切的基础上,让相邻块<b>重叠一小段</b>(overlap),这样即使一句话被切到边界,前后块各保留了一份,不至于丢失。代价要记住:块<b>太小</b>→单块信息不全;块<b>太大</b>→稀释重点、混入噪声、还更贵。块大小和重叠,是要权衡的旋钮。</>,
        analogy: <><b>类比:</b>撕长卷分页时,每页结尾多抄一两行到下一页开头,免得正好把关键句撕断。</> },
      { n: '02', term: '语义切分:在“话题转折处”下刀', tag: '更自然',
        body: <>不按死板字数,而是看<b>句子之间的语义相似度</b>,在话题明显转折的地方才断开,让每一块都是一个完整的意群。<span className="footnote">注意:语义切分计算开销更大,且有研究表明它<b>不一定</b>稳定优于固定切分——别当成“必然更好”的银弹,要用评估来验证。</span></>,
        analogy: <><b>类比:</b>分段不按“每 200 字一段”,而按“讲完一个意思再换段”,读起来才不别扭。</> },
      { n: '03', term: '父文档检索:小块去查,大块来答', tag: '两头兼顾',
        body: <>这里有个矛盾:检索想要<b>小块</b>(精准命中、信号不被稀释),但生成想要<b>大块</b>(上下文完整、不断章取义)。<b>父文档检索</b>同时满足:用小块去<b>检索</b>,命中后却把它所在的<b>大块(父文档)</b>取出来喂给模型。检索的归检索,上下文的归上下文。</>,
        analogy: <><b>类比:</b>用精确的关键词定位到书里的某一句(小块),但读的时候把<b>整段甚至整页</b>读完(大块),才不会理解偏。</> },
      { n: '04', term: '上下文化检索:入库前给每块加一句“它在讲啥”', tag: 'Anthropic',
        body: <>一个块单独拎出来常常看不懂(“它的营收增长了 3%”——谁的?哪年?)。Anthropic 的 <b>Contextual Retrieval</b> 在入库前,让 LLM 给每个块生成一句<b>定位说明</b>(“这段出自 2023 年 Q2 财报,讲 ACME 公司营收”),拼到块前面再做向量与 BM25 索引,检索自然更准。<span className="footnote">官方自评:Top-20 检索失败率相对下降约 49%,再叠加重排序约 67%——衡量的是“检索阶段”,非端到端答案准确率。</span></>,
        analogy: <><b>类比:</b>给每张零散的便利贴顶部补一行“这是哪份文件、哪一节的”,以后翻找时一眼就知道它属于哪、说的是什么。</> },
    ],
    chunkSourceNote: (
      <>
        固定/重叠/语义/父文档切分见 LangChain、LlamaIndex 官方文档;上下文化检索见 Anthropic{' '}
        <a href="https://www.anthropic.com/news/contextual-retrieval" target="_blank" rel="noreferrer">《Introducing Contextual Retrieval》</a>(2024-09);其 49% / 67% 为“Top-20 检索失败率相对下降”的官方自评口径,会随数据集变化。
      </>
    ),
    // B. 评估
    evalTitle: '📖 二、评估:RAG 答错了,先分清是谁的锅',
    evalLead: 'RAG 答错时,根因往往是两类完全不同的问题之一:要么检索根本没把对的资料捞上来,要么资料捞对了、模型却忽略它甚至瞎编。这两类要用不同的尺子量、用不同的方法修。把它们混在一起“凭感觉调”,你很可能在修错的那一层。',
    evalCards: [
      { n: '①', term: '检索质量:该找的找全了吗?找回的相关吗?', tag: '检索层',
        body: <>两个指标:<b>上下文召回率(context recall)</b>——回答问题所需的资料,是否都被检索到了(漏了就是检索的锅);<b>上下文精确率(context precision)</b>——检索回来的内容里,真正相关的占多少(太多噪声会带偏模型)。这一层坏了,要回到上一节:混合检索、重排、查询改写、以及本节的切分。</> },
      { n: '②', term: '生成忠实度:答案忠于资料吗?切题吗?', tag: '生成层',
        body: <><b>忠实度(faithfulness)</b>——答案里的每个说法,是否都能在检索到的资料里找到依据(找不到依据=幻觉/瞎编);<b>答案相关性(answer relevance)</b>——答案是否真的回应了问题。这一层坏了,要修的是提示词、模型、或“强制让它只依据给定资料作答+给出引用”。</> },
    ],
    evalSourceNote: (
      <>
        检索/生成两类指标与自动评估见 RAGAS(<a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noreferrer">arXiv:2309.15217</a>,2023)及 docs.ragas.io;注意其指标多为 LLM 打分,会随评判模型/版本漂移,适合<b>相对比较</b>而非绝对真值。
      </>
    ),
    // 演示
    demoSecTitle: '🎛️ 交互演示:RAG 体检台 —— 同样答错,病灶可能天差地别',
    demoSecLead: '下面三个案例的“最终答案”都不理想。点开每一个,把它拆成两层看:检索层(对的资料捞到了吗)和生成层(模型有没有忠于资料)。你会发现,看起来一样的“答错”,病灶可能在完全不同的层——这正是为什么必须分层评估。',
    demo: {
      title: '🎛️ RAG 失败诊断 · 分层体检',
      hint: '把“答错”拆成 检索层 / 生成层 两层看',
      caseLabel: '选一个案例:',
      qLabel: '问题',
      ansLabel: '最终答案',
      retrievalLayer: '检索层 · 对的资料捞到了吗',
      genLayer: '生成层 · 答案忠于资料吗',
      ok: '✓ 正常',
      bad: '✗ 出问题',
      diagLabel: '诊断',
      cases: [
        {
          tag: '案例 A',
          q: '我们的退款政策是几天内?',
          ans: '一般电商通常支持 7 天无理由退款。',
          retrievalOk: false,
          genOk: true,
          retrievalNote: '检索回来的全是“配送时效”“发票开具”等无关页,没有任何一页讲退款政策。',
          genNote: '模型很“老实”:没瞎编公司政策,只能给了个泛泛的行业常识。',
          diag: '病灶在检索层(context recall 低):该找的“退款政策”没被捞到,生成再忠实也无米下炊。修法回到上一节——混合检索 / 查询改写 / 更好的切分。',
        },
        {
          tag: '案例 B',
          q: '我们的退款政策是几天内?',
          ans: '我们支持 30 天无理由退款。',
          retrievalOk: true,
          genOk: false,
          retrievalNote: '检索完全正确:召回了《退款政策》页,白纸黑字写着“15 天内可退”。',
          genNote: '模型没忠于资料,把“15 天”说成了“30 天”——典型的生成幻觉。',
          diag: '病灶在生成层(faithfulness 低):资料对了,模型却瞎编。修法是提示词约束(只依据给定资料、给出引用)、换更稳的模型。',
        },
        {
          tag: '案例 C',
          q: '我们的退款政策是几天内?',
          ans: '根据《退款政策》,自签收起 15 天内可无理由退款。',
          retrievalOk: true,
          genOk: true,
          retrievalNote: '召回了正确的《退款政策》页。',
          genNote: '答案完全基于检索内容,数字一致,还带了出处。',
          diag: '两层都健康:检索召回正确、生成忠实于资料且切题。这才是一次合格的 RAG 回答。',
        },
      ],
    },
    // 误区
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '上下文窗口那么大,chunk 切大点、甚至整篇塞进去最省事',
        good: '块太大稀释重点、混入噪声、变贵,检索粒度也变粗;常用父文档检索两头兼顾',
        why: <><b>病因:</b>“窗口够大就整篇塞”忽略了两件事:① 检索是按块算相似度的,块越大、一个块里混的主题越多,相似度信号越糊,反而更难精确命中;② 塞进太多无关内容会稀释重点、触发“中间遗忘”、推高 token 成本。所以不是越大越好。要“检索精准”又要“上下文完整”,标准解法是<b>父文档检索</b>:小块检索、大块喂给模型。</>,
      },
      {
        bad: 'RAG 好不好,拿几个问题试试、看着顺眼就行',
        good: '必须分“检索质量”和“生成忠实度”两层量化评估,否则会修错层',
        why: <><b>病因:</b>“看着还行”既不可复现、也定位不到病灶。同样是答错,可能是检索没召回(该修检索),也可能是检索对了模型瞎编(该修生成)——凭感觉你分不清,很容易在错的层瞎使劲。正确做法是建一套评估集,分别量检索层(context recall/precision)和生成层(faithfulness/answer relevance),用 RAGAS 这类工具自动化。先能<b>量</b>,才能谈<b>调</b>。</>,
      },
      {
        bad: '语义切分、上下文化检索是“高级货”,上了一定更好',
        good: '它们有额外开销、也不保证稳定更优;要用评估验证,数字也要看口径',
        why: <><b>病因:</b>新技术容易被当成银弹。但语义切分计算更重、且有研究显示未必稳定胜过固定切分;Contextual Retrieval 效果确实好,但官方那个“失败率降 49%/67%”是 <b>Top-20 检索失败率的相对下降、且是自家评测</b>,不是“答案准确率提升 67%”。养成习惯:任何“更好”都先问“在什么数据上、用什么指标、谁测的”,再用自己的评估集验证。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 你的 RAG 又答错了。怎么快速判断是“检索的锅”还是“生成的锅”?两者各对应什么指标、该怎么修?',
        a: <>把检索到的内容<b>打印出来看一眼</b>:① 如果里面<b>根本没有</b>回答所需的资料 → 是<b>检索层</b>的锅(context recall 低),修法是混合检索 / 重排 / 查询改写 / 更好的切分;② 如果资料<b>明明在里面</b>、模型却答错或编造 → 是<b>生成层</b>的锅(faithfulness 低),修法是提示词约束“只依据给定资料并给出引用”、或换更稳的模型。先分层,再对症,别在错的层瞎调。</>,
      },
      {
        q: '2. 父文档检索为什么要“用小块去检索,却返回大块给模型”?它在调和什么矛盾?',
        a: <>调和的是<b>“检索想要小、生成想要大”</b>的矛盾。<b>检索</b>偏好小块:粒度细、主题单一,相似度信号不被稀释,更容易精准命中;但<b>生成</b>偏好大块:上下文完整,不会断章取义。父文档检索两头兼顾——拿<b>小块</b>去匹配查询(检索精准),命中后把小块所在的<b>父级大块</b>取出来喂给模型(上下文完整)。一句话:用小块定位,用大块回答。</>,
      },
      {
        q: '3. 同事说:“我们上了语义切分,RAG 肯定更好了。” 你应该怎么审视这句话?',
        a: <>不能直接接受。语义切分听起来高级,但①它<b>计算开销更大</b>;②已有研究表明它<b>不一定</b>稳定优于简单的固定大小切分,效果依数据而定。正确态度是:把它当成一个<b>待验证的假设</b>,而不是结论——用一套固定的评估集(分别量检索层与生成层指标)做 A/B,对比换切分前后的数字,确认在<b>你自己的数据</b>上确实变好,再下结论。“更高级”不等于“更好”。</>,
      },
    ],
    finalTitle: '➡️ RAG 进阶 ②小结 · 下一节:单次检索不够时',
    finalP1: <>这一节补齐了检索的“上游”和“下游”:上游是<b>切分</b>——固定+重叠、语义切分、父文档检索、上下文化检索,决定“答案在不在某一块里”;下游是<b>评估</b>——把“答错”拆成检索层(召回/精确)与生成层(忠实/切题),让你能量化地优化,而不是盲调。</>,
    finalP2: <>到这里,你已经能把“查一次、拼进去”这条标准 RAG 链路做到相当扎实。但有些问题,<b>查一次根本不够</b>:需要分几步、查了再查,甚至要跨多篇文档做全局综合。下一节 RAG ③ 就进入进阶架构:Agentic RAG、多跳检索、GraphRAG,以及那个绕不开的问题——“上下文窗口越来越大,RAG 会被淘汰吗?”</>,
  },

  en: {
    conceptTitle: '💡 Core Idea: chunking sets the ceiling, evaluation sets the direction',
    conceptLead: 'The last lesson solved "how to find it accurately." But two more things — one before, one after — decide how far your RAG can go. First, before retrieval: how the material is "chunked." Chunk it badly and a complete answer gets split across two chunks, so no retriever can ever bring it back whole — chunking sets the ceiling retrieval can reach. Second, while tuning: how you "know" a change helped. RAG has a pile of knobs (chunk size, overlap, Top-k, threshold, rerank or not…), and tuning by feel is a cardinal sin — evaluation sets the direction you optimize in.',
    contrastTag1: 'Gut impression',
    contrastBig1: <>Chunk size hardly matters; whether RAG is good is tuned<span className="gap">by feel</span></>,
    contrastNote1: 'Treat chunking as a chore and quality as mysticism.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Chunking is a <span className="hl">hard ceiling</span> for retrieval, and RAG must be <span className="hl">evaluated quantitatively, layer by layer</span>, or you\'re tuning blind</>,
    contrastNote2: '"Garbage in, garbage out" starts at chunking; "can\'t measure, can\'t tune" happens at evaluation.',
    exampleEn: <>Two lines set the tone: <span className="hl">chunking decides "whether the answer is in some chunk at all," evaluation decides "whether you know you\'re getting better or worse."</span> This lesson fills in this before-and-after, taking your RAG from "runs" to "controllable."</>,
    exampleZh: <>Building on L28\'s "chunk a document yourself": that lesson taught you to chunk, this one teaches you to <b>chunk smartly</b>, and for the first time answers "how to prove it actually got better" — echoing L29\'s evaluation spirit.</>,
    chunkTitle: '📖 Part One — Advanced Chunking: don\'t let the answer get split in half',
    chunkLead: 'The crudest chunking slices by a fixed character count, but it\'s "blind" to content — it may cut a complete cause-effect, a table, or a definition right down the middle. The four advanced methods below progressively ease this.',
    chunk: [
      { n: '01', term: 'Fixed size + overlap: the basic "anti-cut"', tag: 'entry',
        body: <>On top of slicing by length, let adjacent chunks <b>overlap a little</b>, so even if a sentence lands on a boundary, the chunks before and after each keep a copy, avoiding loss. Remember the costs: chunks <b>too small</b> → a single chunk lacks full info; <b>too large</b> → dilutes focus, mixes in noise, costs more. Chunk size and overlap are knobs to trade off.</>,
        analogy: <><b>Analogy:</b> tearing a long scroll into pages, copy the last line or two onto the start of the next page so you don\'t tear a key sentence in half.</> },
      { n: '02', term: 'Semantic chunking: cut at the "topic turn"', tag: 'more natural',
        body: <>Instead of rigid character counts, look at <b>semantic similarity between sentences</b> and break only where the topic clearly turns, so each chunk is a complete unit of meaning. <span className="footnote">Note: semantic chunking costs more compute, and studies show it does <b>not</b> reliably beat fixed-size chunking — don\'t treat it as a silver bullet; verify with evaluation.</span></>,
        analogy: <><b>Analogy:</b> paragraph not "every 200 words" but "finish one idea before a new paragraph" — that\'s what reads naturally.</> },
      { n: '03', term: 'Parent-document retrieval: search small, answer large', tag: 'best of both',
        body: <>There\'s a tension: retrieval wants <b>small chunks</b> (precise hits, undiluted signal), but generation wants <b>large chunks</b> (full context, no quoting out of context). <b>Parent-document retrieval</b> satisfies both: <b>retrieve</b> with small chunks, but on a hit, pull the <b>large chunk (parent document)</b> it belongs to and feed that to the model. Retrieval to retrieval, context to context.</>,
        analogy: <><b>Analogy:</b> use a precise keyword to locate one sentence in a book (small chunk), but when reading, read the <b>whole paragraph or page</b> (large chunk) so you don\'t misunderstand.</> },
      { n: '04', term: 'Contextual retrieval: add a "what this is about" line before indexing', tag: 'Anthropic',
        body: <>A chunk alone is often incomprehensible ("its revenue grew 3%" — whose? which year?). Anthropic\'s <b>Contextual Retrieval</b>, before indexing, has an LLM generate a <b>locating note</b> for each chunk ("from ACME\'s 2023 Q2 report, on revenue"), prepends it, then embeds and BM25-indexes — so retrieval is naturally more accurate. <span className="footnote">Official self-eval: Top-20 retrieval failure rate down ~49% relatively, ~67% with reranking — measuring the "retrieval stage," not end-to-end answer accuracy.</span></>,
        analogy: <><b>Analogy:</b> add a top line to each loose sticky note saying "which document and section this is from," so later you instantly know where it belongs and what it says.</> },
    ],
    chunkSourceNote: (
      <>
        Fixed/overlap/semantic/parent-document chunking: LangChain and LlamaIndex docs; contextual retrieval: Anthropic{' '}
        <a href="https://www.anthropic.com/news/contextual-retrieval" target="_blank" rel="noreferrer">"Introducing Contextual Retrieval"</a> (2024-09); its 49% / 67% are the official self-evaluated "relative drop in Top-20 retrieval failure rate," and vary by dataset.
      </>
    ),
    evalTitle: '📖 Part Two — Evaluation: when RAG answers wrong, first pin down whose fault it is',
    evalLead: 'When RAG answers wrong, the root cause is usually one of two very different problems: either retrieval didn\'t bring up the right material, or the material was right but the model ignored it or fabricated. These need different rulers to measure and different fixes. Mixing them and "tuning by feel," you\'ll likely be fixing the wrong layer.',
    evalCards: [
      { n: '①', term: 'Retrieval quality: did it find all it should? is what it found relevant?', tag: 'retrieval layer',
        body: <>Two metrics: <b>context recall</b> — was all the material needed to answer actually retrieved (missing = retrieval\'s fault); <b>context precision</b> — of what was retrieved, how much is truly relevant (too much noise misleads the model). If this layer is broken, go back to the last lesson: hybrid search, reranking, query rewriting, and this lesson\'s chunking.</> },
      { n: '②', term: 'Generation faithfulness: is the answer true to the material? on-topic?', tag: 'generation layer',
        body: <><b>Faithfulness</b> — can every claim in the answer be grounded in the retrieved material (no grounding = hallucination); <b>answer relevance</b> — does the answer actually address the question. If this layer is broken, fix the prompt, the model, or "force it to answer only from the given material + cite sources."</> },
    ],
    evalSourceNote: (
      <>
        Retrieval/generation metric families and automated evaluation: RAGAS (<a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noreferrer">arXiv:2309.15217</a>, 2023) and docs.ragas.io; note its metrics are largely LLM-judged and drift with the judge model/version, suited to <b>relative comparison</b>, not absolute truth.
      </>
    ),
    demoSecTitle: '🎛️ Interactive Demo: the RAG Clinic — same wrong answer, very different ailments',
    demoSecLead: 'The "final answer" in all three cases below is unsatisfactory. Open each and split it into two layers: the retrieval layer (was the right material found) and the generation layer (did the model stay true to it). You\'ll see that an identical-looking "wrong answer" can have ailments in completely different layers — exactly why you must evaluate layer by layer.',
    demo: {
      title: '🎛️ RAG Failure Diagnosis · layered checkup',
      hint: 'split "wrong answer" into retrieval / generation layers',
      caseLabel: 'Pick a case:',
      qLabel: 'Question',
      ansLabel: 'Final answer',
      retrievalLayer: 'Retrieval layer · was the right material found',
      genLayer: 'Generation layer · is the answer true to the material',
      ok: '✓ OK',
      bad: '✗ broken',
      diagLabel: 'Diagnosis',
      cases: [
        {
          tag: 'Case A',
          q: 'How many days is our refund policy?',
          ans: 'E-commerce generally supports 7-day no-questions returns.',
          retrievalOk: false,
          genOk: true,
          retrievalNote: 'Everything retrieved is irrelevant ("delivery times," "invoicing"); not one page covers the refund policy.',
          genNote: 'The model is "honest": it didn\'t fabricate a company policy, only gave generic industry common knowledge.',
          diag: 'Ailment in the retrieval layer (low context recall): the "refund policy" that should be found wasn\'t, so no faithfulness can help with no material. Fix it via the last lesson — hybrid search / query rewriting / better chunking.',
        },
        {
          tag: 'Case B',
          q: 'How many days is our refund policy?',
          ans: 'We support 30-day no-questions returns.',
          retrievalOk: true,
          genOk: false,
          retrievalNote: 'Retrieval is perfect: the "Refund Policy" page was recalled, stating in black and white "returns within 15 days."',
          genNote: 'The model wasn\'t faithful to the material, turning "15 days" into "30 days" — a textbook generation hallucination.',
          diag: 'Ailment in the generation layer (low faithfulness): the material was right, the model fabricated. Fix it with prompt constraints (answer only from given material, cite sources) or a steadier model.',
        },
        {
          tag: 'Case C',
          q: 'How many days is our refund policy?',
          ans: 'Per the Refund Policy, no-questions returns within 15 days of receipt.',
          retrievalOk: true,
          genOk: true,
          retrievalNote: 'The correct "Refund Policy" page was recalled.',
          genNote: 'The answer is fully grounded in the retrieved material, the number matches, and it cites the source.',
          diag: 'Both layers healthy: retrieval recalled correctly, generation is faithful and on-topic. This is a qualified RAG answer.',
        },
      ],
    },
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'The context window is huge, so just chunk big — even stuff whole documents in',
        good: 'Too-large chunks dilute focus, add noise, cost more, and coarsen retrieval granularity; parent-document retrieval handles both ends',
        why: <><b>Cause:</b> "the window is big, stuff the whole doc" ignores two things: ① retrieval scores similarity per chunk, and the bigger the chunk, the more topics mixed in, the blurrier the signal, making precise hits harder; ② stuffing too much irrelevant content dilutes focus, triggers "lost in the middle," and raises token cost. So bigger isn\'t better. To get "precise retrieval" and "complete context," the standard solution is <b>parent-document retrieval</b>: retrieve small, feed the model large.</>,
      },
      {
        bad: 'Whether RAG is good — just try a few questions and eyeball it',
        good: 'You must quantify across two layers — retrieval quality and generation faithfulness — or you\'ll fix the wrong layer',
        why: <><b>Cause:</b> "looks fine" is neither reproducible nor able to localize the ailment. The same wrong answer could be retrieval not recalling (fix retrieval) or retrieval right but the model fabricating (fix generation) — by feel you can\'t tell, and easily strain at the wrong layer. The right way is to build an eval set and separately measure the retrieval layer (context recall/precision) and generation layer (faithfulness/answer relevance), automated with tools like RAGAS. Be able to <b>measure</b> before you <b>tune</b>.</>,
      },
      {
        bad: 'Semantic chunking and contextual retrieval are "advanced," so they must be better',
        good: 'They have extra cost and don\'t guarantee a stable win; verify with evaluation, and read the numbers\' fine print',
        why: <><b>Cause:</b> new tech is easily mistaken for a silver bullet. But semantic chunking is heavier and studies show it doesn\'t reliably beat fixed chunking; Contextual Retrieval is genuinely good, but the official "failure down 49%/67%" is the <b>relative drop in Top-20 retrieval failure rate, on its own eval</b>, not "answer accuracy up 67%." Build the habit: for any "better," first ask "on what data, by what metric, measured by whom," then verify on your own eval set.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Your RAG answered wrong again. How do you quickly tell whether it\'s "retrieval\'s fault" or "generation\'s fault"? What metric does each map to, and how to fix?',
        a: <><b>Print the retrieved content</b> and look: ① if it <b>doesn\'t contain</b> the material needed to answer → it\'s the <b>retrieval layer</b> (low context recall), fix with hybrid search / reranking / query rewriting / better chunking; ② if the material <b>is clearly there</b> but the model answers wrong or fabricates → it\'s the <b>generation layer</b> (low faithfulness), fix with prompt constraints "answer only from the given material and cite sources," or a steadier model. Layer first, then treat the cause — don\'t strain at the wrong layer.</>,
      },
      {
        q: '2. Why does parent-document retrieval "retrieve with small chunks but return large chunks to the model"? What tension does it reconcile?',
        a: <>It reconciles the tension that <b>"retrieval wants small, generation wants large."</b> <b>Retrieval</b> prefers small chunks: fine-grained, single-topic, undiluted similarity signal, easier to hit precisely; but <b>generation</b> prefers large chunks: complete context, no quoting out of context. Parent-document retrieval does both — match the query with the <b>small chunk</b> (precise retrieval), then on a hit pull the <b>parent large chunk</b> it belongs to and feed that to the model (complete context). In a line: locate with small, answer with large.</>,
      },
      {
        q: '3. A colleague says: "We switched to semantic chunking, so RAG is definitely better now." How should you scrutinize this?',
        a: <>Don\'t accept it outright. Semantic chunking sounds advanced, but ① it\'s <b>more compute-heavy</b>; ② studies show it does <b>not</b> reliably beat simple fixed-size chunking, with results depending on the data. The right stance: treat it as a <b>hypothesis to verify</b>, not a conclusion — A/B it on a fixed eval set (measuring retrieval- and generation-layer metrics separately), compare the numbers before and after the chunking change, and confirm it truly improved on <b>your own data</b> before concluding. "More advanced" ≠ "better."</>,
      },
    ],
    finalTitle: '➡️ Advanced RAG ② recap · Next: When One Retrieval Isn\'t Enough',
    finalP1: <>This lesson filled in retrieval\'s "upstream" and "downstream": upstream is <b>chunking</b> — fixed+overlap, semantic, parent-document, contextual retrieval — deciding "whether the answer is in some chunk at all"; downstream is <b>evaluation</b> — splitting "wrong answers" into the retrieval layer (recall/precision) and generation layer (faithfulness/relevance), letting you optimize quantitatively instead of blindly.</>,
    finalP2: <>By now you can make the standard "retrieve once, stuff it in" pipeline quite solid. But some questions <b>can\'t be answered with one retrieval</b>: they need several steps, search-then-search, even global synthesis across many documents. The next lesson, RAG ③, enters advanced architectures: Agentic RAG, multi-hop retrieval, GraphRAG, and the unavoidable question — "as context windows grow, will RAG be obsolete?"</>,
  },
}

// ---- RAG 失败分层诊断演示 ----
function EvalDemo({ c }) {
  const d = c.demo
  const [ci, setCi] = useState(0)
  const cs = d.cases[ci]

  const Layer = ({ title, ok, note }) => (
    <div style={{
      border: `1px solid ${ok ? 'var(--sage)' : 'var(--terracotta)'}`,
      borderRadius: 12, background: ok ? 'var(--sage-bg)' : 'var(--terracotta-bg)',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: ok ? 'var(--sage)' : 'var(--terracotta)' }}>{ok ? d.ok : d.bad}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55 }}>{note}</div>
    </div>
  )

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 20 }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>{d.caseLabel}</div>
          <div className="chips">
            {d.cases.map((cc, i) => (
              <button key={i} className={`chip${i === ci ? ' active' : ''}`} onClick={() => setCi(i)}>{cc.tag}</button>
            ))}
          </div>
        </div>

        <div className="example" style={{ margin: 0 }}>
          <div className="zh"><b>{d.qLabel}:</b> {cs.q}</div>
          <div className="zh" style={{ marginTop: 6 }}><b>{d.ansLabel}:</b> <span style={{ color: cs.retrievalOk && cs.genOk ? 'var(--sage)' : 'var(--terracotta)' }}>{cs.ans}</span></div>
        </div>

        <div className="use-grid cols-2">
          <Layer title={d.retrievalLayer} ok={cs.retrievalOk} note={cs.retrievalNote} />
          <Layer title={d.genLayer} ok={cs.genOk} note={cs.genNote} />
        </div>

        <div style={{ borderLeft: '3px solid var(--fg-2)', paddingLeft: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 4 }}>{d.diagLabel}</div>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--fg-1)' }}>{cs.diag}</p>
        </div>
      </div>
    </div>
  )
}

export default function LRag2() {
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

      <Lsec title={c.chunkTitle} lead={c.chunkLead}>
        <div className="card row-list">
          {c.chunk.map((l, i) => (
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
        <p className="footnote source-note">{c.chunkSourceNote}</p>
      </Lsec>

      <Lsec title={c.evalTitle} lead={c.evalLead}>
        <div className="use-grid cols-2">
          {c.evalCards.map((l, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{l.tag}</div>
              <div className="en"><span className="pill pill-ink" style={{ marginRight: 8 }}>{l.n}</span><b>{l.term}</b></div>
              <div className="zh" style={{ marginTop: 6 }}>{l.body}</div>
            </div>
          ))}
        </div>
        <p className="footnote source-note">{c.evalSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <EvalDemo c={c} />
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
