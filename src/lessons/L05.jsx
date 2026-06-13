import { useState } from 'react'
import { Lsec, Chips, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// 拟合三档演示的曲线与误差，在模块作用域预算一次（确定性、无随机）
// ============================================================
const X0 = 36, X1 = 428, Y0 = 292, Y1 = 16
const px = (x) => X0 + ((X1 - X0) * x) / 10
const py = (y) => Y0 - ((Y0 - Y1) * y) / 10

const truth = (x) => 4.8 + 2.0 * Math.sin(0.8 * x - 0.4)

const TRAIN = [
  [0.5, 5.4], [1.3, 5.2], [2.1, 7.3], [2.9, 6.2], [3.7, 6.6], [4.5, 4.0],
  [5.3, 4.3], [6.1, 2.3], [6.9, 3.6], [7.7, 3.1], [8.5, 5.7], [9.4, 5.5],
]
const TEST = [[1.7, 6.6], [3.3, 6.1], [4.9, 4.3], [6.5, 2.6], [8.1, 4.7]]
const BUMPS = [2.0, -2.2, 1.9, -2.0, 2.1, -2.0, 1.9, -2.2, 2.0, -2.1, 1.9]

// 欠拟合：最小二乘直线
let sx = 0, sy = 0, sxx = 0, sxy = 0
TRAIN.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y })
const n = TRAIN.length
const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
const icpt = (sy - slope * sx) / n

function sampleFn(f, a, b, k) {
  const out = []
  for (let i = 0; i <= k; i++) {
    const x = a + ((b - a) * i) / k
    out.push([x, f(x)])
  }
  return out
}

// 过拟合：Catmull-Rom 样条穿过每个训练点 + 段间扭动
function wiggleThrough(pts, perSeg, bumps) {
  const P = [pts[0]].concat(pts, [pts[pts.length - 1]])
  const out = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3]
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg, t2 = t * t, t3 = t2 * t
      const cr = (c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t +
        (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 +
        (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)
      out.push([cr(0), cr(1) + bumps[i] * Math.sin(Math.PI * t)])
    }
  }
  out.push(pts[pts.length - 1].slice())
  return out
}

const lineS = sampleFn((x) => icpt + slope * x, 0.15, 9.85, 40)
const goodS = sampleFn((x) => truth(x) + 0.15 * Math.sin(2.2 * x + 1), 0.15, 9.85, 80)
const overS = wiggleThrough(TRAIN, 24, BUMPS)

function evalAt(s, x) {
  if (x <= s[0][0]) return s[0][1]
  for (let i = 1; i < s.length; i++) {
    if (s[i][0] >= x) {
      const t = (x - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1)
      return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * t
    }
  }
  return s[s.length - 1][1]
}
const mae = (s, pts) => pts.reduce((a, [x, y]) => a + Math.abs(evalAt(s, x) - y), 0) / pts.length

const toPath = (s) =>
  s.map((p, i) =>
    (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(Math.max(0.1, Math.min(9.9, p[1]))).toFixed(1),
  ).join(' ')

const TRUE_PATH = toPath(sampleFn(truth, 0.15, 9.85, 80))
// 三档拟合的几何与误差（与语言无关）；可见文案见 C[lang].modes
const MODES = {
  under: { path: toPath(lineS), color: 'var(--amber)', tr: mae(lineS, TRAIN), te: mae(lineS, TEST) },
  good: { path: toPath(goodS), color: 'var(--sage)', tr: mae(goodS, TRAIN), te: mae(goodS, TEST) },
  over: { path: toPath(overS), color: 'var(--terracotta)', tr: mae(overS, TRAIN), te: mae(overS, TEST) },
}
const ERR_MAX = 2.4
const barH = (v) => Math.max(2, Math.min(100, (v / ERR_MAX) * 100)) + '%'

// 双语内容层：结构 / class / 交互 / 几何均不变，仅文本按语言取用。
// 富文本（含 <b>、<span>、<br/>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    goalsTitle: '🎯 你将学会',
    goals: [
      '用“刷题 vs 高考”这一个比喻，说清训练集、验证集、测试集的分工',
      '看懂过拟合：模型为什么会“背答案”，以及如何用两个误差数字一眼识破它',
      '认清数据质量三大坑：垃圾数据、数据偏见、数据泄漏',
      '建立 AI 最重要的一条常识：目标从来不是记住见过的数据，而是泛化到没见过的数据',
    ],
    conceptTitle: '💡 核心概念：刷题 vs 高考',
    conceptLead:
      '想象两个备考的学生。一个把练习册的每道题连答案一起背了下来；另一个做题时琢磨的是方法。平时小测验，背答案的那位回回满分 —— 直到高考换了一批新题。',
    contrast0: {
      tag: '背答案的学生 · 过拟合',
      big: <>平时刷题<span className="gap">全对</span>，<br />高考<span className="gap">一塌糊涂</span></>,
      note: <>他记住的是每道题的答案，题目换个数字就不会了。模型把训练数据连噪声带巧合一起死记硬背，这就是<b>过拟合（overfitting）</b>。</>,
    },
    contrast1: {
      tag: '真学会的学生 · 泛化',
      big: <>平时偶有<span className="hl">小错</span>，<br />高考<span className="hl">稳定发挥</span></>,
      note: <>他学到的是解题方法，没见过的题照样会做。模型在<b>没见过的数据</b>上依然表现良好，叫<b>泛化（generalization）</b>。</>,
    },
    conceptClose: <>记住：AI 的目的从来不是记住训练数据 —— 那一块硬盘就够了。它存在的全部意义是泛化。所以判断一个模型行不行，只看一对数字：<b>训练误差 vs 测试误差</b>。训练误差很小、测试误差很大，就是过拟合 —— 两者的差距，就是它“背答案”的程度。</>,
    splitTitle: '📖 三份数据：作业、模拟考、高考',
    splitLead: '既然不能拿“平时成绩”当真，炼丹师们的做法是：动手训练之前，先把手里的数据切成三份，各司其职、互不重叠。',
    splitCards: [
      {
        label: '平时作业 · 占大头（约 70–80%）',
        term: <>训练集 <b>Training Set</b></>,
        body: <>模型唯一被允许用来<b>学习</b>的数据：看题、做题、对答案、调整权重 —— 第 4 课那场“摸索下山”，就发生在这片山地上。</>,
      },
      {
        label: '模拟考 · 约 10–15%',
        term: <>验证集 <b>Validation Set</b></>,
        body: <>不用来学，只用来<b>摸底</b>：调超参数（比如下山的步长）、在几个候选模型里挑出最好的那个。模拟考可以反复考。</>,
      },
      {
        label: '高考 · 约 10–15%',
        term: <>测试集 <b>Test Set</b></>,
        body: <>模型从头到尾没见过的数据，<b>只许最后用一次</b>，给出最终成绩。只有这个分数，才代表模型的真实水平。</>,
      },
    ],
    splitFootnote: '比例只是常见习惯，不是铁律；真正的铁律只有一条 —— 三份数据绝不许互相掺和。',
    garbageTitle: '📖 垃圾进，垃圾出：数据的三大坑',
    garbageLead: '模型是数据的镜子：数据里有什么，它就学什么 —— 包括错误、偏见和你不小心塞进去的“作弊小抄”。工程师有句老话：Garbage in, garbage out（垃圾进，垃圾出）。',
    garbageCards: [
      {
        label: '坑一 · Garbage In',
        term: '垃圾数据',
        body: <>标错的标签、重复的样本、满屏噪声 —— 模型分不清对错，只会照单全收。错标 10% 的数据，等于认认真真教模型犯 10% 的错。</>,
      },
      {
        label: '坑二 · Bias',
        term: '数据偏见',
        body: <>如果训练数据里的医生几乎都是男性，模型就把“医生 = 男性”当成规律：翻译时默认医生是“他”，招聘模型压低女性简历的分数（亚马逊真踩过这个坑，模型最终被弃用）。<b>模型不会比喂给它的数据更公正。</b></>,
      },
      {
        label: '坑三 · Data Leakage',
        term: '数据泄漏',
        body: <><b>考题混进了练习册</b> —— 最隐蔽的作弊。模型“考前见过题”，测试成绩虚高，一上线就现出原形。典型案例：测试样本混进训练集、用“未来”的信息预测过去、同一个病人的记录同时出现在训练集和测试集。</>,
      },
    ],
    demoSecTitle: '🎛️ 交互演示：三种学法，一眼分高下',
    demoSecLead: '同一组数据，三种学法。12 个实心点是训练数据（平时练习题），它们背后的真实规律是那条灰色虚线 —— 一条平缓的曲线；点没有正好落在线上，因为现实数据总带噪声。空心点是新抽的 5 道“考试题”，三种模型谁都没见过。逐个点击三档，盯紧右侧两根误差条。',
    demoTitle: '🎛️ 交互演示 · 欠拟合 / 刚好 / 过拟合',
    demoHint: '点击切换三档拟合，三档都试试',
    svgAria: '散点图：实心点为训练数据，空心点为考试数据，可切换三种拟合曲线',
    axisX: '输入 x（想象成：房子面积）',
    axisY: '输出 y（房价）',
    legendTrain: '训练点（练习题）',
    legendTest: '考试点（新题）',
    legendTruth: '真实规律',
    chips: [
      { key: 'under', label: '欠拟合' },
      { key: 'good', label: '刚好' },
      { key: 'over', label: '过拟合' },
    ],
    modes: {
      under: { title: '欠拟合 · 学得太浅', period: '训练误差大 · 考试误差也大',
        desc: '一条直线，连大方向都没抓住 —— 像上课只记了一句口诀的学生。练习题做不对，考试自然也不行：两根误差条都很高。' },
      good: { title: '刚好 · 学到了规律', period: '训练误差小 · 考试误差也小',
        desc: '平滑曲线贴住了真实趋势（看它几乎和灰色虚线重合），但不去追逐每个点的噪声。练习偶有小错，考试稳定发挥 —— 这就是泛化。' },
      over: { title: '过拟合 · 背下了答案', period: '训练误差 ≈ 0 · 考试误差爆炸',
        desc: '曲线扭来扭去，精确穿过每一个训练点：训练误差归零，看似完美。但在没见过的空心考试点上错得离谱 —— 它背下的是噪声，不是规律。' },
    },
    errAria: '训练误差与考试误差对比条形图',
    errTrainLbl: '训练误差（练习题）',
    errTestLbl: '考试误差（新题）',
    demoFootnote: '误差 = 曲线到各点的平均纵向距离，数字越小越好。注意过拟合档：练习全对，考试爆炸。',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '训练准确率 99%，这模型真棒',
        good: '先问一句：测试集上多少？训练 99%、测试 70%，恰恰说明它在背答案',
        why: <><b>病因：</b>把“平时成绩”当成了“真实水平”。训练集成绩是开卷考试 —— 模型见过这些题。任何只报训练成绩的宣传，都等于零信息。</>,
      },
      {
        bad: '数据越多越好，使劲堆就完了',
        good: '质量和分布优先：错标数据越多越糟；分布不对，再多也白搭',
        why: <><b>病因：</b>“大数据”宣传留下的惯性。一百万条标错的样本，是一百万次认真的误导；只用城市房价数据训练，再多也预测不了农村 —— 模型学的是数据的<b>分布</b>，不是数据的<b>体积</b>。</>,
      },
      {
        bad: '测试集嘛，多考几次，挑成绩最好的模型上线',
        good: '测试集只许最后用一次；反复用它调参，它就变成了验证集，成绩开始虚高',
        why: <><b>病因：</b>没意识到“看一眼成绩再回头改模型”本身就是泄题。每根据测试成绩调整一次，测试集的信息就漏进模型一分，它就再也代表不了“没见过的数据”。高考只能考一次，道理相同。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 模型 A：训练准确率 99%、测试 72%；模型 B：训练 88%、测试 86%。该上线哪个？为什么？',
        a: <><b>选 B。</b>A 训练与测试差了 27 个百分点，典型的过拟合 —— 平时全对、高考翻车，上线面对的全是“没见过的题”。B 两个成绩接近且测试更高，泛化能力才是真实力。</>,
      },
      {
        q: '2. 把“平时作业 / 模拟考 / 高考”和“训练集 / 验证集 / 测试集”对应起来，并回答：为什么“高考”只能考一次？',
        a: <><b>平时作业 = 训练集</b>（用来学），<b>模拟考 = 验证集</b>（用来调超参数、挑模型，可反复考），<b>高考 = 测试集</b>（只出最终成绩）。一旦按测试成绩回头改模型，考题信息就泄漏进了模型，测试集实质上沦为第二个验证集，分数从此虚高、不再可信。</>,
      },
      {
        q: '3. 你训练一个“预测病人是否患病”的模型，把同一位病人的多条检查记录随机分进训练集和测试集。测试准确率高达 97%，能开香槟吗？',
        a: <><b>不能，这是数据泄漏。</b>模型在训练时已经见过这位病人的其他记录，测试时它认出的是“这个人”，而不是学会了判断疾病 —— 考题混进了练习册。正确做法是<b>按病人切分</b>：同一个人的所有记录，只能整体进训练集或整体进测试集。</>,
      },
    ],
  },

  en: {
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'Use one analogy — "drilling practice problems vs. the final exam" — to clearly explain the roles of the training, validation, and test sets',
      'Understand overfitting: why a model "memorizes the answers," and how to spot it at a glance with two error numbers',
      'Recognize the three big data-quality traps: garbage data, data bias, and data leakage',
      'Build the single most important piece of common sense in AI: the goal is never to memorize the data you’ve seen, but to generalize to data you haven’t',
    ],
    conceptTitle: '💡 Core Idea: Drilling Practice vs. the Final Exam',
    conceptLead:
      'Imagine two students preparing for an exam. One memorizes every problem in the workbook along with its answer; the other thinks about the method while solving. On the weekly quizzes, the one who memorized scores full marks every time — until the final exam swaps in a fresh batch of problems.',
    contrast0: {
      tag: 'The Memorizing Student · Overfitting',
      big: <>Practice problems <span className="gap">all correct</span>,<br />final exam <span className="gap">a total mess</span></>,
      note: <>He memorized the answer to each problem, so change a number and he’s lost. The model rote-memorizes the training data — noise and coincidences included — and that is <b>overfitting</b>.</>,
    },
    contrast1: {
      tag: 'The Student Who Truly Learned · Generalization',
      big: <>An occasional <span className="hl">small slip</span> in practice,<br />steady <span className="hl">performance on the final</span></>,
      note: <>He learned the method, so he can solve problems he’s never seen. The model still performs well on <b>data it hasn’t seen</b>, which is called <b>generalization</b>.</>,
    },
    conceptClose: <>Remember: the purpose of AI is never to memorize the training data — a hard drive would do for that. Its entire reason for existing is to generalize. So to judge whether a model is any good, look at just one pair of numbers: <b>training error vs. test error</b>. A tiny training error with a large test error is overfitting — and the gap between them is exactly how much it’s "memorizing the answers."</>,
    splitTitle: '📖 Three Data Splits: Homework, Mock Exam, Final',
    splitLead: 'Since you can’t take "everyday grades" at face value, here’s what the model "alchemists" do: before training, split the data on hand into three parts, each with its own job and none overlapping.',
    splitCards: [
      {
        label: 'Homework · the bulk (about 70–80%)',
        term: <><b>Training Set</b></>,
        body: <>The only data the model is allowed to <b>learn</b> from: read the problems, solve them, check the answers, adjust the weights — that "groping your way downhill" from Lesson 4 happens on this terrain.</>,
      },
      {
        label: 'Mock Exam · about 10–15%',
        term: <><b>Validation Set</b></>,
        body: <>Not for learning, only for <b>taking stock</b>: tuning hyperparameters (like the step size for going downhill) and picking the best among several candidate models. Mock exams can be taken over and over.</>,
      },
      {
        label: 'Final Exam · about 10–15%',
        term: <><b>Test Set</b></>,
        body: <>Data the model has never seen from start to finish, <b>to be used only once, at the very end</b>, to produce the final grade. Only this score reflects the model’s true ability.</>,
      },
    ],
    splitFootnote: 'The ratios are just common practice, not an iron rule; there’s only one true iron rule — the three splits must never mix with one another.',
    garbageTitle: '📖 Garbage In, Garbage Out: the Three Big Data Traps',
    garbageLead: 'A model is a mirror of its data: whatever is in the data, it learns — including the errors, the biases, and the "cheat sheet" you slipped in by accident. Engineers have an old saying: Garbage in, garbage out.',
    garbageCards: [
      {
        label: 'Trap 1 · Garbage In',
        term: 'Garbage Data',
        body: <>Mislabeled labels, duplicate samples, screens full of noise — the model can’t tell right from wrong and simply takes it all in. Mislabeling 10% of the data is teaching the model, diligently, to make 10% of its mistakes.</>,
      },
      {
        label: 'Trap 2 · Bias',
        term: 'Data Bias',
        body: <>If almost all the doctors in the training data are male, the model takes "doctor = male" as a rule: in translation it defaults to "he" for a doctor, and a hiring model marks down women’s résumés (Amazon really fell into this trap, and the model was eventually scrapped). <b>A model will never be fairer than the data you feed it.</b></>,
      },
      {
        label: 'Trap 3 · Data Leakage',
        term: 'Data Leakage',
        body: <><b>Exam questions slipped into the workbook</b> — the most insidious form of cheating. The model "saw the questions before the exam," so its test score is inflated, and it shows its true colors the moment it goes live. Classic cases: test samples leaking into the training set, using "future" information to predict the past, and the same patient’s records appearing in both the training and test sets.</>,
      },
    ],
    demoSecTitle: '🎛️ Interactive: Three Ways to Learn, Told Apart at a Glance',
    demoSecLead: 'The same dataset, three ways to learn. The 12 solid dots are the training data (the everyday practice problems), and the true pattern behind them is that gray dashed line — a gentle curve; the dots don’t land exactly on it, because real-world data always carries noise. The hollow dots are 5 freshly drawn "exam questions" that none of the three models has seen. Click through the three settings one by one and keep your eye on the two error bars on the right.',
    demoTitle: '🎛️ Interactive · Underfit / Just Right / Overfit',
    demoHint: 'Click to switch between the three fits — try all three',
    svgAria: 'Scatter plot: solid dots are training data, hollow dots are exam data, with three switchable fitting curves',
    axisX: 'Input x (imagine: house size)',
    axisY: 'Output y (house price)',
    legendTrain: 'Training points (practice problems)',
    legendTest: 'Exam points (new problems)',
    legendTruth: 'True pattern',
    chips: [
      { key: 'under', label: 'Underfit' },
      { key: 'good', label: 'Just Right' },
      { key: 'over', label: 'Overfit' },
    ],
    modes: {
      under: { title: 'Underfit · Learned Too Shallow', period: 'Large training error · large exam error too',
        desc: 'A straight line that doesn’t even capture the broad trend — like a student who only memorized a single mnemonic in class. It gets the practice problems wrong, so of course it fails the exam too: both error bars are high.' },
      good: { title: 'Just Right · Learned the Pattern', period: 'Small training error · small exam error too',
        desc: 'A smooth curve hugs the true trend (see how it nearly overlaps the gray dashed line), without chasing the noise in every point. An occasional small slip in practice, steady performance on the exam — this is generalization.' },
      over: { title: 'Overfit · Memorized the Answers', period: 'Training error ≈ 0 · exam error explodes',
        desc: 'The curve wiggles all over, passing exactly through every training point: the training error drops to zero, looking perfect. But on the unseen hollow exam points it’s wildly off — what it memorized was the noise, not the pattern.' },
    },
    errAria: 'Bar chart comparing training error and exam error',
    errTrainLbl: 'Training error (practice)',
    errTestLbl: 'Exam error (new problems)',
    demoFootnote: 'Error = the average vertical distance from the curve to the points; smaller is better. Notice the overfit setting: perfect on practice, exploding on the exam.',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Training accuracy is 99% — what a great model',
        good: 'First ask: what’s the test-set score? 99% on training and 70% on test is exactly the sign it’s memorizing the answers',
        why: <><b>Cause:</b> mistaking "everyday grades" for "true ability." The training-set score is an open-book exam — the model has seen those questions. Any claim that reports only the training score carries zero information.</>,
      },
      {
        bad: 'The more data the better — just pile it on',
        good: 'Quality and distribution come first: more mislabeled data only makes things worse, and if the distribution is wrong, no amount helps',
        why: <><b>Cause:</b> the inertia left over from "big data" hype. A million mislabeled samples are a million diligent acts of misdirection; train only on urban house prices and no amount will predict rural ones — the model learns the <b>distribution</b> of the data, not its <b>volume</b>.</>,
      },
      {
        bad: 'It’s just the test set — run it a few times and ship the model with the best score',
        good: 'The test set may be used only once, at the end; use it repeatedly to tune and it turns into a validation set, with scores starting to inflate',
        why: <><b>Cause:</b> not realizing that "peeking at the score and then going back to change the model" is itself leaking the questions. Every time you adjust based on the test score, a little more of the test set’s information leaks into the model, and it can no longer represent "data it hasn’t seen." A final exam can be taken only once — same principle.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Model A: 99% training accuracy, 72% test; Model B: 88% training, 86% test. Which should you ship, and why?',
        a: <><b>Choose B.</b> A’s training and test scores differ by 27 percentage points — classic overfitting: perfect in practice, crashing on the final, and once live it faces nothing but "questions it hasn’t seen." B’s two scores are close and its test score is higher; generalization is what real ability looks like.</>,
      },
      {
        q: '2. Match "homework / mock exam / final" with "training set / validation set / test set," and answer: why can the "final" be taken only once?',
        a: <><b>Homework = training set</b> (used to learn), <b>mock exam = validation set</b> (used to tune hyperparameters and pick models, can be taken repeatedly), <b>final = test set</b> (gives only the final grade). The moment you go back and change the model based on the test score, information about the questions leaks into the model; the test set effectively degrades into a second validation set, and its scores become inflated and untrustworthy from then on.</>,
      },
      {
        q: '3. You train a model to "predict whether a patient is sick," and randomly split one patient’s multiple test records across the training and test sets. Test accuracy hits 97% — time to pop the champagne?',
        a: <><b>No — this is data leakage.</b> During training the model already saw this patient’s other records, so at test time it recognizes "this person" rather than having learned to judge the disease — the exam questions slipped into the workbook. The right approach is to <b>split by patient</b>: all of one person’s records must go entirely into the training set or entirely into the test set.</>,
      },
    ],
  },
}

function FitDemo({ c }) {
  const [key, setKey] = useState('over')
  const m = MODES[key]
  const t = c.modes[key]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="fit-svg" viewBox="0 0 440 320" width="420" aria-label={c.svgAria}>
            <line x1="36" y1="16" x2="36" y2="292" stroke="var(--hairline-strong)" strokeWidth="1" />
            <line x1="36" y1="292" x2="428" y2="292" stroke="var(--hairline-strong)" strokeWidth="1" />
            <text x="232" y="314" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.axisX}</text>
            <text x="12" y="154" textAnchor="middle" fontSize="11" fill="var(--fg-2)" transform="rotate(-90 12 154)">{c.axisY}</text>
            <circle cx="48" cy="30" r="4.5" fill="var(--sky)" />
            <text x="58" y="34" fontSize="11" fill="var(--fg-1)">{c.legendTrain}</text>
            <circle cx="168" cy="30" r="4.5" fill="none" stroke="var(--terracotta)" strokeWidth="2" />
            <text x="178" y="34" fontSize="11" fill="var(--fg-1)">{c.legendTest}</text>
            <line x1="276" y1="30" x2="300" y2="30" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="306" y="34" fontSize="11" fill="var(--fg-1)">{c.legendTruth}</text>
            <path d={TRUE_PATH} fill="none" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.75" />
            <path d={m.path} fill="none" stroke={m.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <g>
              {TRAIN.map(([x, y], i) => (
                <circle key={i} cx={px(x)} cy={py(y)} r="4.5" fill="var(--sky)" stroke="var(--bg-card)" strokeWidth="1.5" />
              ))}
            </g>
            <g>
              {TEST.map(([x, y], i) => (
                <circle key={i} cx={px(x)} cy={py(y)} r="4.5" fill="none" stroke="var(--terracotta)" strokeWidth="2" />
              ))}
            </g>
          </svg>
        </div>
        <div className="demo-side">
          <Chips
            options={c.chips}
            value={key}
            onChange={setKey}
          />
          <h4 style={{ marginTop: 14 }}>{t.title}</h4>
          <div className="period">{t.period}</div>
          <p>{t.desc}</p>
          <div className="err-bars" aria-label={c.errAria}>
            <div className="err-col">
              <div className="err-track"><div className="err-fill" style={{ background: 'var(--sky)', height: barH(m.tr) }} /></div>
              <div className="err-val">{m.tr.toFixed(1)}</div>
              <div className="err-lbl">{c.errTrainLbl}</div>
            </div>
            <div className="err-col">
              <div className="err-track"><div className="err-fill" style={{ background: 'var(--terracotta)', height: barH(m.te) }} /></div>
              <div className="err-val">{m.te.toFixed(1)}</div>
              <div className="err-lbl">{c.errTestLbl}</div>
            </div>
          </div>
          <p className="footnote" style={{ marginTop: 12 }}>{c.demoFootnote}</p>
        </div>
      </div>
    </div>
  )
}

export default function L05() {
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
            <span className="tag pill pill-terracotta">{c.contrast0.tag}</span>
            <div className="big">{c.contrast0.big}</div>
            <div className="note">{c.contrast0.note}</div>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">{c.contrast1.tag}</span>
            <div className="big">{c.contrast1.big}</div>
            <div className="note">{c.contrast1.note}</div>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 16 }}>{c.conceptClose}</p>
      </Lsec>

      <Lsec
        title={c.splitTitle}
        lead={c.splitLead}
      >
        <div className="use-grid">
          {c.splitCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.term}</div>
              <div className="zh">{u.body}</div>
            </div>
          ))}
        </div>
        <p className="footnote" style={{ marginTop: 12 }}>{c.splitFootnote}</p>
      </Lsec>

      <Lsec
        title={c.garbageTitle}
        lead={c.garbageLead}
      >
        <div className="use-grid">
          {c.garbageCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.term}</div>
              <div className="zh">{u.body}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.demoSecTitle}
        lead={c.demoSecLead}
      >
        <FitDemo c={c} />
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
