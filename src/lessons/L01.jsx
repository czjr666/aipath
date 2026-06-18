import { useState } from "react";
import {
  Lsec,
  DemoPanel,
  Chips,
  Pill,
  FlipCard,
  QuizItem,
} from "../components/ui.jsx";
import { useLang } from "../i18n/LangContext.jsx";

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    venn: {
      data: {
        ai: {
          title: "人工智能 Artificial Intelligence",
          period: "1956 年 · 达特茅斯会议命名",
          desc: "让机器表现出智能的一切努力 —— 是一个领域、一个梦想，而不是某种具体技术。手写规则的专家系统、棋类搜索算法都属于这一圈，哪怕它们完全不会“学习”。",
          tags: ["专家系统", "深蓝下棋", "路径搜索"],
        },
        ml: {
          title: "机器学习 Machine Learning",
          period: "1980 年代 · 兴起为主流路线",
          desc: "实现 AI 的一条路线：不再由人逐条写规则，而是让机器从数据中自动找出规律。数据越多，通常表现越好 —— “学习”二字从此有了实义。",
          tags: ["垃圾邮件过滤", "推荐系统", "信用评分"],
        },
        dl: {
          title: "深度学习 Deep Learning",
          period: "2012 年 · AlexNet 引爆",
          desc: "机器学习的一种方法：用层数很深的神经网络自动学习特征。这一轮 AI 浪潮的全部主角 —— ChatGPT、Midjourney、自动驾驶感知 —— 都基于它。",
          tags: ["ChatGPT", "人脸识别", "AlphaGo"],
        },
      },
      svgAria: "三个嵌套的圆：人工智能包含机器学习，机器学习包含深度学习",
      rings: {
        ai: { name: "人工智能 AI", sub: "1956 ·「让机器有智能」的梦想" },
        ml: { name: "机器学习 ML", sub: "20 世纪 80 年代 · 从数据中学规则" },
        dl: { name: "深度学习 DL", sub: "2012 · 多层神经网络" },
      },
      chips: [
        { key: "ai", label: "人工智能" },
        { key: "ml", label: "机器学习" },
        { key: "dl", label: "深度学习" },
      ],
      panelTitle: "🎛️ 交互演示 · AI 的三个圈",
      panelHint: "点击圆环或下方按钮切换",
    },
    goalsTitle: "🎯 你将学会",
    goals: [
      "一句话说清 AI、机器学习、深度学习的包含关系，看新闻不再发懵",
      "知道三个圈各自的代表技术和典型产品",
      "掌握一个判断标准：这个产品到底有没有在“学习”",
      "记住三个关键年份：1956、20 世纪 80 年代、2012 —— 三个圈各自的起点",
    ],
    conceptTitle: "💡 核心概念：三个套在一起的圈",
    conceptLead:
      "人工智能是最大的圈，机器学习是其中一种实现方式，深度学习又是机器学习里最重要的一类方法。它们像三个套在一起的圆：AI 包含机器学习，机器学习包含深度学习。今天所有刷屏的 AI —— ChatGPT、Midjourney、自动驾驶 —— 几乎都在最里面那个小圈里。点击下图的每一环看看。",
    threeTitle: "📖 三个圈，三句话",
    threeLead: "把它们各自最关键的一句话记住，这一课的核心就掌握了。",
    useCards: [
      {
        label: "最外圈 · 1956 年起",
        term: (
          <>
            人工智能 <b>AI</b>
          </>
        ),
        body: (
          <>
            让机器表现出智能的<b>一切</b>努力 ——
            包括手写规则的老方法。早年的专家系统、下棋程序都算
            AI，但它们不会“学习”。
          </>
        ),
      },
      {
        label: "中间圈 · 20 世纪 80 年代兴起",
        term: (
          <>
            机器学习 <b>ML</b>
          </>
        ),
        body: (
          <>
            不再由人写规则，而是让机器<b>从数据里自己找规律</b>。垃圾邮件过滤、推荐系统是它的经典代表作。
          </>
        ),
      },
      {
        label: "最内圈 · 2012 年爆发",
        term: (
          <>
            深度学习 <b>DL</b>
          </>
        ),
        body: (
          <>
            用<b>多层神经网络</b>做机器学习。人脸识别、AlphaGo、ChatGPT ——
            这一轮 AI 浪潮的主角全在这里。
          </>
        ),
      },
    ],
    handsTitle: "🎛️ 动手分一分",
    handsLead:
      "下面 6 个东西分别属于哪个圈？先自己判断，再点卡片揭晓答案。判断标准只有一条：它有没有从数据中学习？用的是不是神经网络？",
    flips: [
      {
        q: "1997 年击败国际象棋世界冠军的“深蓝”",
        pill: { type: "sky", text: "最外圈 · 传统 AI" },
        why: "它靠的是开发者预先写好的下棋规则，而不是从棋谱数据中自己找规律。这正好说明：AI 这个大圈里，有些技术并不需要“学习”。",
      },
      {
        q: "邮箱的垃圾邮件过滤器",
        pill: { type: "amber", text: "中间圈 · 机器学习" },
        why: "从海量“垃圾 / 正常”邮件样本中学出规律，经典机器学习的教科书案例。",
      },
      {
        q: "ChatGPT",
        pill: { type: "sage", text: "最内圈 · 深度学习" },
        why: "基于深度神经网络（Transformer）的大语言模型。这就是前面说的包含关系：它同时属于深度学习、机器学习和 AI。",
      },
      {
        q: "手机相册自动按人脸分类",
        pill: { type: "sage", text: "最内圈 · 深度学习" },
        why: "人脸识别靠卷积神经网络（第 7 课会讲），是深度学习最早落地的应用之一。",
      },
      {
        q: "“智能”空调：温度高于 26℃ 自动制冷",
        pill: { type: "ink", text: "圈外 · 写死的规则" },
        why: "只是一条写死的判断规则，没有任何学习。营销里的“智能”和技术上的 AI，常常不是一回事。",
      },
      {
        q: "购物网站的“猜你喜欢”",
        pill: { type: "amber", text: "中间圈 · 机器学习" },
        why: "从你和千万用户的行为数据中学习偏好。常见做法会根据相似用户的行为来推荐，新一代系统也开始用深度学习。",
      },
    ],
    pitfallsTitle: "⚠️ 常见误区",
    pitfalls: [
      {
        bad: "AI 就是机器人",
        good: "机器人是“身体”，AI 是“大脑”—— 大多数 AI（比如 ChatGPT）根本没有身体",
        why: (
          <>
            <b>病因：</b>科幻电影的视觉印象。实际上 AI
            绝大多数时候只是服务器里运行的程序，而很多机器人（如流水线机械臂）只执行固定动作，并没有
            AI。
          </>
        ),
      },
      {
        bad: "深度学习这么火，其他机器学习方法都过时了",
        good: "在表格类数据上，一些经典机器学习方法至今常常胜过神经网络",
        why: (
          <>
            <b>病因：</b>
            新闻只报道深度学习的突破。工业界的风控、定价、销量预测大量使用经典机器学习方法
            —— 方法没有高低，只有合不合适。
          </>
        ),
      },
      {
        bad: "ChatGPT 这么聪明，说明通用人工智能（AGI）已经实现了",
        good: "目前所有落地的 AI 都是“专用 AI”，AGI 何时到来仍是开放问题",
        why: (
          <>
            <b>病因：</b>
            把“对话流畅”等同于“全面智能”。大模型在很多任务上仍会出错和“幻觉”（第
            29 课细讲），离稳定可靠的通用智能还有距离 ——
            距离多远，专家们也在激烈争论。
          </>
        ),
      },
    ],
    quizTitle: "✍️ 小练习",
    quiz: [
      {
        q: "1. 判断：所有深度学习模型都是机器学习模型吗？所有机器学习系统都是 AI 吗？",
        a: (
          <>
            <b>都是。</b>深度学习属于机器学习，机器学习属于
            人工智能。小圈一定属于大圈，但反过来不成立：深蓝是
            AI，却不是机器学习。
          </>
        ),
      },
      {
        q: "2. 朋友的创业产品宣称“搭载 AI 技术”。你想判断它是真有学习能力还是营销话术，该问什么？",
        a: (
          <>
            问一句：<b>“它从什么数据里学习？数据变多它会变好吗？”</b>
            如果答案是“规则是我们配置好的”，那它更可能只是普通程序，再套上了营销说法；如果它确实随数据迭代变强，才是机器学习。
          </>
        ),
      },
      {
        q: "3. 把三个年份和事件连起来：1956 / 20 世纪 80 年代 / 2012 —— 深度学习爆发、AI 概念诞生、机器学习兴起。",
        a: (
          <>
            <b>1956</b> 达特茅斯会议提出“人工智能”一词 → <b>20 世纪 80 年代</b>{" "}
            机器学习作为独立路线兴起 → <b>2012</b> AlexNet
            在图像识别竞赛中碾压对手，深度学习时代开启。
          </>
        ),
      },
    ],
  },

  en: {
    venn: {
      data: {
        ai: {
          title: "Artificial Intelligence",
          period: "1956 · Named at the Dartmouth Workshop",
          desc: "Every effort to make machines act intelligently — a field and a dream, not one specific technology. Hand-coded expert systems and game-search algorithms belong to this circle, even though they don’t “learn” at all.",
          tags: ["Expert systems", "Deep Blue", "Pathfinding"],
        },
        ml: {
          title: "Machine Learning",
          period: "1980s · Rose to the mainstream",
          desc: "One route to AI: instead of humans writing rules one by one, let the machine find patterns in data automatically. More data usually means better performance — this is where “learning” gains real meaning.",
          tags: ["Spam filtering", "Recommenders", "Credit scoring"],
        },
        dl: {
          title: "Deep Learning",
          period: "2012 · Ignited by AlexNet",
          desc: "A method within machine learning: use many-layered neural networks to learn features automatically. Every star of this AI wave — ChatGPT, Midjourney, self-driving perception — is built on it.",
          tags: ["ChatGPT", "Face recognition", "AlphaGo"],
        },
      },
      svgAria:
        "Three nested circles: AI contains machine learning, which contains deep learning",
      rings: {
        ai: { name: "AI", sub: "1956 · the dream of “intelligent machines”" },
        ml: { name: "ML", sub: "1980s · learning rules from data" },
        dl: { name: "DL", sub: "2012 · many-layered neural nets" },
      },
      chips: [
        { key: "ai", label: "AI" },
        { key: "ml", label: "Machine Learning" },
        { key: "dl", label: "Deep Learning" },
      ],
      panelTitle: "🎛️ Interactive · The Three Circles of AI",
      panelHint: "Click a ring or a button below to switch",
    },
    goalsTitle: "🎯 What You’ll Learn",
    goals: [
      "State in one sentence how AI, machine learning, and deep learning nest — and stop feeling lost reading the news",
      "Know the signature techniques and typical products of each circle",
      "Master one test: is this product actually “learning” or not",
      "Remember three key years: 1956, 1980s, 2012 — the starting point of each circle",
    ],
    conceptTitle: "💡 Core Idea: Three Nested Circles",
    conceptLead:
      "AI is the biggest circle (a dream), machine learning is one circle inside it (a route), and deep learning is a smaller circle still (a method). Almost every AI in the headlines today — ChatGPT, Midjourney, self-driving — lives in that innermost circle. Click each ring below.",
    threeTitle: "📖 Three Circles, Three Sentences",
    threeLead:
      "Memorize the single most important sentence for each, and this lesson has already paid for itself.",
    useCards: [
      {
        label: "Outer circle · since 1956",
        term: (
          <>
            Artificial Intelligence <b>AI</b>
          </>
        ),
        body: (
          <>
            Every <b>effort</b> to make machines act intelligently — including
            the old rule-writing approach. Early expert systems and chess
            programs all count as AI, but they don’t “learn.”
          </>
        ),
      },
      {
        label: "Middle circle · rose in the 1980s",
        term: (
          <>
            Machine Learning <b>ML</b>
          </>
        ),
        body: (
          <>
            No longer humans writing rules, but machines{" "}
            <b>finding patterns in data themselves</b>. Spam filtering and
            recommender systems are its classic showcases.
          </>
        ),
      },
      {
        label: "Inner circle · exploded in 2012",
        term: (
          <>
            Deep Learning <b>DL</b>
          </>
        ),
        body: (
          <>
            Doing machine learning with <b>many-layered neural networks</b>.
            Face recognition, AlphaGo, ChatGPT — the stars of this AI wave are
            all here.
          </>
        ),
      },
    ],
    handsTitle: "🎛️ Sort Them Yourself",
    handsLead:
      "Which circle does each of the 6 things below belong to? Decide for yourself first, then tap a card to reveal the answer. There’s just one test: does it learn from data? Does it use a neural network?",
    flips: [
      {
        q: "“Deep Blue,” which beat the world chess champion in 1997",
        pill: { type: "sky", text: "Outer circle · classic AI" },
        why: "It won by brute-force search plus human-written evaluation rules, and doesn’t learn from data — it’s AI, but not machine learning.",
      },
      {
        q: "Your email’s spam filter",
        pill: { type: "amber", text: "Middle circle · machine learning" },
        why: "It learns patterns from huge numbers of “spam / not spam” samples — a textbook case of classic machine learning.",
      },
      {
        q: "ChatGPT",
        pill: { type: "sage", text: "Inner circle · deep learning" },
        why: "A large language model based on deep neural networks (the Transformer); it’s also machine learning and AI — nested dolls, remember?",
      },
      {
        q: "Your phone’s photo app auto-sorting by face",
        pill: { type: "sage", text: "Inner circle · deep learning" },
        why: "Face recognition relies on convolutional neural networks (covered in Lesson 7), one of the earliest real-world applications of deep learning.",
      },
      {
        q: "A “smart” AC that cools automatically above 26°C",
        pill: { type: "ink", text: "Outside · hard-coded rules" },
        why: "Just one if-else, no learning at all. Marketing’s “smart” and technical AI are often not the same thing.",
      },
      {
        q: "A shopping site’s “picks for you”",
        pill: { type: "amber", text: "Middle circle · machine learning" },
        why: "It learns your preferences from your behavior and that of millions of users. The classic approach uses collaborative filtering; newer ones increasingly use deep learning.",
      },
    ],
    pitfallsTitle: "⚠️ Common Misconceptions",
    pitfalls: [
      {
        bad: "AI is just robots",
        good: "A robot is the “body,” AI is the “brain” — most AI (like ChatGPT) has no body at all",
        why: (
          <>
            <b>Cause:</b> the visual impression from sci-fi movies. In reality
            AI is most often just a program running on a server, while many
            robots (like assembly-line arms) only perform fixed motions and
            contain no AI.
          </>
        ),
      },
      {
        bad: "Deep learning is so hot that other machine-learning methods are obsolete",
        good: "On tabular data, classic methods like gradient-boosted trees still often beat neural networks",
        why: (
          <>
            <b>Cause:</b> the news only reports deep-learning breakthroughs.
            Industry uses classic machine learning heavily for risk control,
            pricing, and sales forecasting — no method is superior, only more or
            less suitable.
          </>
        ),
      },
      {
        bad: "ChatGPT is so smart that artificial general intelligence (AGI) must already be here",
        good: "Every deployed AI today is “narrow AI”; when AGI will arrive is still an open question",
        why: (
          <>
            <b>Cause:</b> equating “fluent conversation” with “all-round
            intelligence.” Large models still make mistakes and “hallucinate” on
            many tasks (detailed in Lesson 29), and remain a way off from
            stable, reliable general intelligence — exactly how far is something
            experts still hotly debate.
          </>
        ),
      },
    ],
    quizTitle: "✍️ Quick Quiz",
    quiz: [
      {
        q: "1. True or false: are all deep-learning models machine-learning models? Are all machine-learning systems AI?",
        a: (
          <>
            <b>Both true.</b> Deep learning ⊂ machine learning ⊂ AI; a smaller
            circle necessarily belongs to the larger one. But not the reverse:
            Deep Blue is AI, yet not machine learning.
          </>
        ),
      },
      {
        q: "2. A friend’s startup claims its product is “powered by AI.” To tell whether it truly learns or it’s just marketing, what should you ask?",
        a: (
          <>
            Ask one thing:{" "}
            <b>
              “What data does it learn from? Does it get better as the data
              grows?”
            </b>{" "}
            If the answer is “we configured the rules,” it’s just an ordinary
            program plus a buzzword; only if it genuinely improves as data
            accumulates is it machine learning.
          </>
        ),
      },
      {
        q: "3. Match the three years with the events: 1956 / 1980s / 2012 — deep learning explodes, the term AI is born, machine learning rises.",
        a: (
          <>
            <b>1956</b> the Dartmouth workshop coins the term “artificial
            intelligence” → <b>1980s</b> machine learning rises as an
            independent route → <b>2012</b> AlexNet crushes the competition in
            an image-recognition contest, opening the deep-learning era.
          </>
        ),
      },
    ],
  },
};

// 交互三圈 SVG
function VennDemo({ c }) {
  const [key, setKey] = useState("ai");
  const d = c.data[key];
  const ringClass = (k) => `venn-ring${k === key ? " active" : " dim"}`;

  const stage = (
    <svg id="venn" viewBox="0 0 400 400" width="360" aria-label={c.svgAria}>
      <g className={ringClass("ai")} onClick={() => setKey("ai")}>
        <circle
          cx="200"
          cy="200"
          r="172"
          fill="var(--sky)"
          fillOpacity="0.5"
          stroke="var(--sky)"
          strokeWidth="1.5"
        />
        <text
          x="200"
          y="62"
          textAnchor="middle"
          fontSize="15"
          fill="var(--fg-0)"
        >
          {c.rings.ai.name}
        </text>
        <text
          className="sub"
          x="200"
          y="80"
          textAnchor="middle"
          fill="var(--fg-1)"
        >
          {c.rings.ai.sub}
        </text>
      </g>
      <g className={ringClass("ml")} onClick={() => setKey("ml")}>
        <circle
          cx="200"
          cy="240"
          r="120"
          fill="var(--amber)"
          fillOpacity="0.5"
          stroke="var(--amber)"
          strokeWidth="1.5"
        />
        <text
          x="200"
          y="152"
          textAnchor="middle"
          fontSize="14"
          fill="var(--fg-0)"
        >
          {c.rings.ml.name}
        </text>
        <text
          className="sub"
          x="200"
          y="169"
          textAnchor="middle"
          fill="var(--fg-1)"
        >
          {c.rings.ml.sub}
        </text>
      </g>
      <g className={ringClass("dl")} onClick={() => setKey("dl")}>
        <circle
          cx="200"
          cy="285"
          r="64"
          fill="var(--sage)"
          fillOpacity="0.55"
          stroke="var(--sage)"
          strokeWidth="1.5"
        />
        <text
          x="200"
          y="282"
          textAnchor="middle"
          fontSize="13"
          fill="var(--fg-0)"
        >
          {c.rings.dl.name}
        </text>
        <text
          className="sub"
          x="200"
          y="299"
          textAnchor="middle"
          fill="var(--fg-1)"
        >
          {c.rings.dl.sub}
        </text>
      </g>
    </svg>
  );

  const side = (
    <>
      <Chips options={c.chips} value={key} onChange={setKey} />
      <h4 style={{ marginTop: 14 }}>{d.title}</h4>
      <div className="period">{d.period}</div>
      <p>{d.desc}</p>
      <div className="tags">
        {d.tags.map((t) => (
          <Pill key={t} type="ink">
            {t}
          </Pill>
        ))}
      </div>
    </>
  );

  return (
    <DemoPanel
      title={c.panelTitle}
      hint={c.panelHint}
      stage={stage}
      side={side}
    />
  );
}

export default function L01() {
  const { lang } = useLang();
  const c = C[lang] || C.zh;

  return (
    <>
      <Lsec title={c.goalsTitle}>
        <div className="card goals">
          {c.goals.map((g, i) => (
            <div className="goal-item" key={i}>
              <span className="tick">✓</span>
              {g}
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.conceptTitle} lead={c.conceptLead}>
        <VennDemo c={c.venn} />
      </Lsec>

      <Lsec title={c.threeTitle} lead={c.threeLead}>
        <div className="use-grid">
          {c.useCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.term}</div>
              <div className="zh">{u.body}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.handsTitle} lead={c.handsLead}>
        <div className="flip-grid">
          {c.flips.map((f, i) => (
            <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />
          ))}
        </div>
      </Lsec>

      <Lsec title={c.pitfallsTitle}>
        <div className="card alert-card row-list">
          {c.pitfalls.map((p, i) => (
            <div className="alert-item" key={i}>
              <div className="wrong-right">
                <div className="wr-line bad">
                  <span className="wr-mark">✗</span>
                  <span className="wr-text">{p.bad}</span>
                </div>
                <div className="wr-line good">
                  <span className="wr-mark">✓</span>
                  <span className="wr-text">{p.good}</span>
                </div>
              </div>
              <p className="why">{p.why}</p>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.quizTitle}>
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>
              {qz.a}
            </QuizItem>
          ))}
        </div>
      </Lsec>
    </>
  );
}
