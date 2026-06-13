import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, QuizItem } from '../components/ui.jsx'
import LossChart from '../components/LossChart.jsx'
import { createGradientDescent } from './viz/gradientDescent.js'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    fallback:
      '3D 演示无法启动（浏览器不支持 WebGL，或资源加载失败）。不过画面可以想象：一片起伏的山谷地形，小球从随机位置出发，每一步摸一摸脚下坡度、朝最陡的下坡挪一小步，最终在谷底停下；学习率太大时，它会在两侧山壁间来回弹跳，甚至被甩出地形。',
    initialStatus: '点「自动播放」开始下山，或用「单步」一步一步走。',
    demoTitle: '🎛️ 交互演示 · 梯度下降 3D 损失地形',
    demoHint: '拖动旋转视角 · 滚轮缩放',
    sideTitle: '下山控制台',
    sidePeriod: '小球只凭脚下坡度决定下一步',
    lrLabel: '学习率',
    btnStep: '单步 ▸',
    btnPause: '⏸ 暂停',
    btnPlay: '自动播放',
    btnReset: '重新随机起点',
    chartFootnote: '↑ 损失下降曲线（Recharts 实时绘制）：每走一步记一个点',
    sideAdvice: (
      <>
        建议顺序：① 学习率 0.15 自动播放，看小球稳稳下山；② 调到 0.03，感受磨蹭；③ 拉到 1.2 以上换个起点，看它在谷壁间弹跳、甚至被甩出地形；④ 多换几次起点 —— 总有一次会停进那个浅坑，那就是局部最优。
      </>
    ),
    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话讲清损失函数 —— 给“猜错的程度”打分的尺子，并能亲手算一个平方损失</>,
      <>在脑中放一幅终身受用的画面：训练 = 蒙眼下山，梯度指方向，学习率定步幅</>,
      <>亲手调学习率，看见“太小磨蹭、太大震荡甚至被甩飞”的全过程</>,
      <>说清局部最优是什么，以及为什么在亿万维空间里它没那么可怕</>,
    ],
    conceptTitle: '💡 核心概念：把“错”变成一座山',
    conceptLead:
      '上一课你认识了神经元：它用权重给输入打分。可权重的数值从哪来？答案朴素得让人意外 —— 一开始全是随机数，模型满嘴胡说。所谓“训练”，就是把亿万个随机数一点点调成有用的数。整件事只有三步棋。',
    steps: [
      {
        label: '第 1 步 · 立一把尺子',
        term: <>损失函数 <b>Loss</b></>,
        body: <>给每一次“猜错”打分：错得越离谱，分数越高。有了这把尺子，“模型好不好”第一次变成了<b>一个可计算的数字</b>。</>,
      },
      {
        label: '第 2 步 · 定一个目标',
        term: <>损失<b>最小化</b></>,
        body: <>训练的全部目标就一句话：找到让损失尽可能小的那组参数。AI 没有“想学好”的愿望，它只是被算法推着往损失更低处挪。</>,
      },
      {
        label: '第 3 步 · 选一种走法',
        term: <>梯度下降 <b>Gradient Descent</b></>,
        body: <>把损失想象成海拔，训练就是<b>蒙着眼下山</b>：摸摸脚下哪边最陡，朝下坡迈一小步，再摸再迈 —— 重复亿万次。</>,
      },
    ],
    formula1En: <>损失 = (猜的值 − 真实值)<sup>2</sup></>,
    formula1Zh: <>最常用的一把尺子：平方损失。预测房价时，猜 520 万、实际 500 万，差 20，损失 400；猜 510 万只差 10，损失 100。平方有两个用意：<b>抹掉正负号</b>（多猜少猜都算错），以及<b>狠狠放大离谱的错误</b> —— 差 20 的罚分是差 10 的 4 倍。</>,
    rolesLead: '这套“下山法”里有四个固定角色。记牢这四张卡，后面每一课都会反复用到。',
    roles: [
      {
        label: '角色一 · 计分尺',
        term: <>损失函数 <b>Loss Function</b></>,
        body: <>把“错得有多离谱”压成一个数。它定义了那座山的<b>形状</b> —— 换一把尺子，山就换一座。</>,
      },
      {
        label: '角色二 · 脚下的坡感',
        term: <>梯度 <b>Gradient</b></>,
        body: <>告诉你当前位置<b>哪个方向坡最陡</b>。它只感知脚下这一小块地，看不见整座山 —— 这就是“蒙眼”的含义。</>,
      },
      {
        label: '角色三 · 步幅',
        term: <>学习率 <b>Learning Rate</b></>,
        body: <>每一步迈多大。太小：磨蹭半天下不了山；太大：一脚跨过谷底、在两侧山壁间来回弹跳，甚至直接飞出去。下面的演示里你可以亲手试。</>,
      },
      {
        label: '角色四 · 小坑陷阱',
        term: <>局部最优 <b>Local Minimum</b></>,
        body: <>下进一个小坑，四面都是上坡，蒙着眼的你以为到底了 —— 其实远处还有更深的谷。这是梯度下降<b>天生的局限</b>。</>,
      },
    ],
    walkTitle: '📖 蒙眼下山：每一步到底发生了什么',
    walkLead:
      '为什么强调“蒙着眼”？因为模型永远看不到整座山的全貌 —— 它唯一能做的，是感知自己脚下这一小块地的坡度。把下山的每个要素翻译成训练术语，对照如下。',
    tableHead: ['下山时的你', '训练中的模型', '一句话点破'],
    tableRows: [
      ['山的海拔', '损失值', '海拔越低，错得越少'],
      ['你站的位置', '当前参数（所有权重）', '挪动位置 = 修改参数'],
      ['脚下的坡度', '梯度', '指向最陡的方向，只能感知脚下'],
      ['一步的大小', '学习率', '由人提前设定，最重要的“旋钮”之一'],
      ['走到走不动', '收敛', '梯度 ≈ 0，训练到此为止'],
    ],
    formula2En: <>新位置 = 旧位置 − 学习率 × 梯度</>,
    formula2Zh: <>整个深度学习最核心的一行式子，人话版：梯度指向上坡，所以取负号<b>朝反方向</b>走；走多远由学习率决定。GPT 级别模型的训练，本质就是这行式子重复亿万次 —— 没有顿悟，没有灵感，只有挪步。</>,
    dimsTitle: '📖 诚实补充：真实的山有亿万个维度',
    dimsLead: '3D 演示是一个善意的“谎言”—— 真实的下山发生在你无法想象的空间里。但好消息恰恰也藏在那里。',
    dimsParas: [
      <><b>维度的真相：</b>演示里只有 2 个参数（小球的横、纵坐标），所以山是三维的。真实大模型动辄数十亿、上千亿个参数 —— <b>每个参数都是一个可以挪动的方向</b>，下山发生在亿万维空间里。没有任何人“看见”过那座山，3D 地形只是把它压扁之后给你的示意图。</>,
      <><b>高维的好消息：</b>直觉上维度越高越容易迷路，数学上恰恰相反 —— 维度一高，“四面八方全是上坡”的死坑（真正的局部最优）反而<b>非常罕见</b>：亿万个方向里，总有几个还能往下走。高维空间里更常见的是<b>鞍点</b>（一些方向上坡、另一些方向下坡），而实际使用的下山算法通常能从鞍点附近晃出去。</>,
      <><b>实践的共识：</b>所以工程师从不执着于“全局最优”。用改良版的梯度下降（比如 Adam —— 它会为每个方向自适应地微调步幅），找到一个<b>足够低、泛化又好</b>的谷底，模型就足够好用。“完美是好的敌人”，在 AI 训练里是字面意义的真理。</>,
    ],
    demoSecTitle: '🎛️ 交互演示：亲手把小球推下山',
    demoSecLead:
      '是时候亲眼看了。下面这片起伏地形就是一个损失函数（它真的有两个山谷：一深一浅），小球 = 当前参数的位置，每一步都严格按“新位置 = 旧位置 − 学习率 × 梯度”计算，轨迹线记录它走过的路。',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: <>AI 训练像人类一样会“开窍”、会“顿悟”</>,
        good: <>训练只是“新位置 = 旧位置 − 学习率 × 梯度”重复亿万次的数值优化，没有任何灵光乍现的瞬间</>,
        why: <><b>病因：</b>媒体偏爱“AI 学会了”“AI 领悟了”这类拟人动词。打开真实的训练日志，你只会看到损失值一点一点往下掉 —— 即便模型最终表现出惊人的“涌现能力”（第 15 课），底层也只是这条平滑下山路的日积月累。</>,
      },
      {
        bad: <>学习率越大，学得越快</>,
        good: <>适中才快：过大会一脚跨过谷底，在两侧山壁间来回震荡，甚至损失越走越高、彻底发散</>,
        why: <><b>病因：</b>把“步子大”等同于“进度快”。山谷往往很窄，大步会直接踩到对面山壁上，比原来还高。回到上面的演示，把学习率拉到 1.2 以上 —— 亲眼看小球被甩出山谷，比任何解释都管用。</>,
      },
      {
        bad: <>只要训练得够久，总能找到全局最优</>,
        good: <>梯度下降只保证“一路向下”，不保证下到全世界最低点 —— 但实践上“足够低”就够好用</>,
        why: <><b>病因：</b>把优化当成必须满分的考试。亿万维空间根本无法穷举，工程上的共识是：找到一个泛化得好的低谷，远比执着理论上的最优重要 —— “泛化”是什么？下一课正好讲。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 用平方损失算一算：某房实际成交 500 万，模型 A 预测 510 万，模型 B 预测 530 万。两者损失各是多少？B 的罚分是 A 的几倍？',
        a: <>A 差 10，损失 10² = <b>100</b>；B 差 30，损失 30² = <b>900</b>。差距只有 3 倍，罚分却是 <b>9 倍</b> —— 平方损失就是故意的：它对离谱的错误格外严厉，逼着模型优先修正大错。</>,
      },
      {
        q: '2. 既然目标是找最低点，为什么不让计算机把整座山“看一遍”、直接挑出最低处，而要蒙着眼一步步摸索？',
        a: <>因为山有<b>亿万个维度</b>。哪怕每个参数只试 10 个取值，10 亿个参数的组合数也是 10 的 10 亿次方 —— 宇宙里的原子加起来都不够记。穷举不可能，于是只剩一条路：从随机起点出发，凭局部坡度一步步走。<b>梯度下降不是最聪明的办法，而是唯一付得起的办法。</b></>,
      },
      {
        q: '3. 把学习率设成 0.001 和 1.5，分别大概率会发生什么？实践中常用什么策略兼顾两头？',
        a: <>0.001：每步太小，<b>下降极慢</b>，走几百步可能还在半山腰；1.5：步子太大，<b>一脚跨过谷底踩上对面山壁</b>，损失来回震荡甚至越来越大（发散）。实践常用<b>先大后小</b>的学习率调度：开局大步快速接近山谷，越接近谷底步幅越小，稳稳落底。</>,
      },
    ],
  },

  en: {
    fallback:
      'The 3D demo couldn’t start (your browser lacks WebGL support, or assets failed to load). But you can picture it: a rolling valley terrain where a ball starts from a random position, and at each step it feels the slope underfoot and edges a little way down the steepest descent, finally settling at the valley floor; when the learning rate is too large, it bounces back and forth between the valley walls, or even gets flung off the terrain.',
    initialStatus: 'Click "Auto-play" to start descending, or use "Step" to go one step at a time.',
    demoTitle: '🎛️ Interactive · Gradient Descent on a 3D Loss Landscape',
    demoHint: 'Drag to rotate the view · scroll to zoom',
    sideTitle: 'Descent Console',
    sidePeriod: 'The ball decides its next step from the slope underfoot alone',
    lrLabel: 'Learning rate',
    btnStep: 'Step ▸',
    btnPause: '⏸ Pause',
    btnPlay: 'Auto-play',
    btnReset: 'Re-randomize start',
    chartFootnote: '↑ Loss-descent curve (drawn live with Recharts): one point logged per step',
    sideAdvice: (
      <>
        Suggested order: ① At learning rate 0.15, auto-play and watch the ball descend steadily; ② drop it to 0.03 and feel the crawl; ③ push it above 1.2 and pick a new start to see it bounce off the valley walls, or even get flung off the terrain; ④ re-randomize the start a few times — sooner or later it will settle into that shallow pit, which is a local minimum.
      </>
    ),
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>Explain the loss function in one sentence — the ruler that scores "how wrong the guess is" — and compute a squared loss by hand</>,
      <>Hold a lifelong mental image: training = descending a mountain blindfolded, the gradient points the way, the learning rate sets the stride</>,
      <>Tune the learning rate yourself and watch the full arc of "too small crawls, too large oscillates or even flings off"</>,
      <>Explain what a local minimum is, and why it’s far less scary in a space of billions of dimensions</>,
    ],
    conceptTitle: '💡 Core Idea: Turn "Wrong" Into a Mountain',
    conceptLead:
      'Last lesson you met the neuron: it scores inputs using weights. But where do the weights’ values come from? The answer is surprisingly humble — at first they’re all random numbers, and the model talks nonsense. So-called "training" is the slow tuning of billions of random numbers into useful ones. The whole thing comes down to just three moves.',
    steps: [
      {
        label: 'Step 1 · Set up a ruler',
        term: <>Loss function <b>Loss</b></>,
        body: <>Score every "wrong guess": the more outrageous the error, the higher the score. With this ruler, "is the model any good" becomes, for the first time, <b>a computable number</b>.</>,
      },
      {
        label: 'Step 2 · Set a goal',
        term: <>Loss <b>minimization</b></>,
        body: <>The entire goal of training is one sentence: find the set of parameters that makes the loss as small as possible. AI has no wish to "do well"; it’s merely pushed by the algorithm toward lower loss.</>,
      },
      {
        label: 'Step 3 · Choose a way to walk',
        term: <>Gradient descent <b>Gradient Descent</b></>,
        body: <>Picture the loss as elevation, and training as <b>descending a mountain blindfolded</b>: feel which way is steepest underfoot, take a small step downhill, feel again and step again — repeated billions of times.</>,
      },
    ],
    formula1En: <>Loss = (predicted − actual)<sup>2</sup></>,
    formula1Zh: <>The most common ruler: squared loss. When predicting house prices, guess 5.2M against an actual 5.0M, off by 20, loss 400; guess 5.1M, off by just 10, loss 100. The square serves two purposes: <b>erasing the sign</b> (over- or under-guessing both count as wrong), and <b>harshly amplifying outrageous errors</b> — being off by 20 is penalized 4 times as much as being off by 10.</>,
    rolesLead: 'This "descent method" has four fixed roles. Memorize these four cards; every lesson ahead will use them again and again.',
    roles: [
      {
        label: 'Role 1 · The scoring ruler',
        term: <>Loss function <b>Loss Function</b></>,
        body: <>Compresses "how outrageous the error is" into a single number. It defines the mountain’s <b>shape</b> — change the ruler, and you change the mountain.</>,
      },
      {
        label: 'Role 2 · The slope underfoot',
        term: <>Gradient <b>Gradient</b></>,
        body: <>Tells you <b>which direction is steepest</b> at your current position. It senses only the small patch underfoot, not the whole mountain — that’s what "blindfolded" means.</>,
      },
      {
        label: 'Role 3 · The stride',
        term: <>Learning rate <b>Learning Rate</b></>,
        body: <>How big each step is. Too small: you crawl forever and never get down; too large: you overstep the valley floor, bounce back and forth between the walls, or even fly right off. You can try it yourself in the demo below.</>,
      },
      {
        label: 'Role 4 · The pit trap',
        term: <>Local minimum <b>Local Minimum</b></>,
        body: <>You descend into a small pit, surrounded on all sides by uphill, and blindfolded you think you’ve hit bottom — but there’s a deeper valley off in the distance. This is gradient descent’s <b>inherent limitation</b>.</>,
      },
    ],
    walkTitle: '📖 Blindfolded Descent: What Actually Happens Each Step',
    walkLead:
      'Why insist on "blindfolded"? Because the model can never see the whole mountain — the one thing it can do is sense the slope of the small patch underfoot. Each element of the descent translates into a training term, mapped below.',
    tableHead: ['You, descending', 'The model, training', 'In one sentence'],
    tableRows: [
      ['Elevation of the mountain', 'Loss value', 'The lower the elevation, the fewer the errors'],
      ['Where you’re standing', 'Current parameters (all weights)', 'Moving = modifying parameters'],
      ['The slope underfoot', 'Gradient', 'Points to the steepest direction; senses only underfoot'],
      ['The size of a step', 'Learning rate', 'Set by humans in advance, one of the most important "knobs"'],
      ['Walking until you can’t', 'Convergence', 'Gradient ≈ 0, training stops here'],
    ],
    formula2En: <>new position = old position − learning rate × gradient</>,
    formula2Zh: <>The single most central line of all deep learning, in plain words: the gradient points uphill, so we negate it and walk <b>the opposite way</b>; how far we walk is set by the learning rate. Training a GPT-class model is, at its core, this one line repeated billions of times — no epiphany, no inspiration, just stepping.</>,
    dimsTitle: '📖 An Honest Footnote: The Real Mountain Has Billions of Dimensions',
    dimsLead: 'The 3D demo is a well-meaning "lie" — the real descent happens in a space you can’t possibly picture. But the good news is hidden right there, too.',
    dimsParas: [
      <><b>The truth about dimensions:</b> the demo has only 2 parameters (the ball’s x and y coordinates), so the mountain is three-dimensional. Real large models have billions to hundreds of billions of parameters — <b>each parameter is a direction you can move in</b>, and the descent happens in a space of billions of dimensions. No one has ever "seen" that mountain; the 3D terrain is just a flattened illustration of it for you.</>,
      <><b>The good news about high dimensions:</b> intuitively, more dimensions seem easier to get lost in, but the math says the opposite — once dimensions are high, the dead-end pit where "everything in every direction is uphill" (a true local minimum) becomes <b>extremely rare</b>: among billions of directions, there’s always one or two you can still go down. Far more common in high-dimensional space are <b>saddle points</b> (uphill in some directions, downhill in others), and the descent algorithms used in practice can usually wobble out of a saddle point’s vicinity.</>,
      <><b>The consensus in practice:</b> so engineers never obsess over the "global optimum." Using an improved gradient descent (such as Adam — which adaptively fine-tunes the stride for each direction) to find a valley floor that is <b>low enough and generalizes well</b>, the model is good enough to use. "Perfect is the enemy of good" is, in AI training, literally true.</>,
    ],
    demoSecTitle: '🎛️ Interactive Demo: Push the Ball Down the Mountain Yourself',
    demoSecLead:
      'Time to see it for yourself. The rolling terrain below is a loss function (it really does have two valleys: one deep, one shallow), the ball = the current parameters’ position, every step is computed strictly by "new position = old position − learning rate × gradient", and the trail line records the path it has walked.',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: <>AI training, like a human, will "get it" or have an "epiphany"</>,
        good: <>Training is just numerical optimization — "new position = old position − learning rate × gradient" repeated billions of times — with no flash-of-insight moment at all</>,
        why: <><b>Cause:</b> the media love anthropomorphic verbs like "the AI learned" and "the AI realized." Open a real training log and all you’ll see is the loss value ticking down a little at a time — even when the model ultimately shows astonishing "emergent abilities" (Lesson 15), underneath it’s only the daily accumulation of this smooth downhill path.</>,
      },
      {
        bad: <>The larger the learning rate, the faster it learns</>,
        good: <>Moderate is fast: too large oversteps the valley floor, oscillating back and forth between the walls, and can even drive the loss higher and higher until it fully diverges</>,
        why: <><b>Cause:</b> equating "big steps" with "fast progress." Valleys are often narrow, so a big step lands straight on the opposite wall, higher than before. Go back to the demo above and push the learning rate above 1.2 — watching the ball get flung out of the valley beats any explanation.</>,
      },
      {
        bad: <>Train long enough and you’ll always find the global optimum</>,
        good: <>Gradient descent only guarantees "always going down," not reaching the lowest point in the world — but in practice, "low enough" is good enough</>,
        why: <><b>Cause:</b> treating optimization like an exam you must ace. A space of billions of dimensions simply can’t be exhaustively searched, and the engineering consensus is: finding a low valley that generalizes well matters far more than chasing the theoretical optimum — and what is "generalization"? The next lesson covers exactly that.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Compute with squared loss: a house actually sold for 5.0M, model A predicts 5.1M, model B predicts 5.3M. What is each one’s loss? How many times A’s penalty is B’s?',
        a: <>A is off by 10, loss 10² = <b>100</b>; B is off by 30, loss 30² = <b>900</b>. The gap is only 3×, yet the penalty is <b>9×</b> — squared loss does this on purpose: it’s especially harsh on outrageous errors, forcing the model to fix the big ones first.</>,
      },
      {
        q: '2. Since the goal is to find the lowest point, why not just have the computer "look over" the whole mountain and pick out the lowest spot directly, instead of feeling its way step by step blindfolded?',
        a: <>Because the mountain has <b>billions of dimensions</b>. Even if each parameter is tried at only 10 values, the number of combinations for a billion parameters is 10 to the power of a billion — more than all the atoms in the universe could record. Exhaustive search is impossible, so only one path remains: start from a random point and walk step by step on the local slope. <b>Gradient descent isn’t the smartest method, it’s the only one we can afford.</b></>,
      },
      {
        q: '3. Set the learning rate to 0.001 and to 1.5 — what most likely happens in each case? What strategy is commonly used in practice to balance both?',
        a: <>0.001: each step is too small, the <b>descent is glacially slow</b>, and after a few hundred steps you may still be halfway up; 1.5: the step is too big, you <b>overstep the valley floor and land on the opposite wall</b>, the loss oscillating back and forth or even growing larger (diverging). In practice a <b>large-then-small</b> learning-rate schedule is common: big strides early to approach the valley quickly, smaller strides the closer you get to the floor, settling in steadily.</>,
      },
    ],
  },
}

function GradientDescentDemo({ c }) {
  const { lang } = useLang()
  const wrapRef = useRef(null)
  const ctrlRef = useRef(null)
  const lrRef = useRef(0.15)

  const [lr, setLr] = useState(0.15)
  const [status, setStatus] = useState(c.initialStatus)
  const [history, setHistory] = useState([])
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    lrRef.current = lr
  }, [lr])

  useEffect(() => {
    let ctrl
    try {
      ctrl = createGradientDescent(wrapRef.current, {
        getLR: () => lrRef.current,
        onStatus: setStatus,
        onHistory: setHistory,
        onPlaying: setPlaying,
        lang,
      })
      ctrlRef.current = ctrl
    } catch (e) {
      setFailed(true)
    }
    return () => ctrl?.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 语言切换：只刷新演示内的状态文案，不重建 3D 场景。
  useEffect(() => {
    ctrlRef.current?.setLang(lang)
  }, [lang])

  const disabled = failed

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="gd-wrap" ref={wrapRef}>
            {failed && <div className="gd-fallback">{c.fallback}</div>}
          </div>
        </div>
        <div className="demo-side">
          <h4>{c.sideTitle}</h4>
          <div className="period">{c.sidePeriod}</div>

          <SliderRow
            label={c.lrLabel}
            min={0.01}
            max={1.5}
            step={0.01}
            value={lr}
            onChange={setLr}
            format={(v) => v.toFixed(2)}
          />

          <div className="chips">
            <button className="chip" disabled={disabled} onClick={() => ctrlRef.current?.step()}>
              {c.btnStep}
            </button>
            <button
              className={`chip${playing ? ' active' : ''}`}
              disabled={disabled}
              onClick={() => ctrlRef.current?.togglePlay()}
            >
              {playing ? c.btnPause : c.btnPlay}
            </button>
            <button className="chip" disabled={disabled} onClick={() => ctrlRef.current?.reset()}>
              {c.btnReset}
            </button>
          </div>

          <div className="gd-status" dangerouslySetInnerHTML={{ __html: status }} />

          <LossChart data={history} />
          <div className="footnote">{c.chartFootnote}</div>

          <p>
            {c.sideAdvice}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function L04() {
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
        <div className="use-grid">
          {c.steps.map((s, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{s.label}</div>
              <div className="en">{s.term}</div>
              <div className="zh">{s.body}</div>
            </div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.formula1En}</div>
          <div className="zh">{c.formula1Zh}</div>
        </div>
        <p className="lead mt14">{c.rolesLead}</p>
        <div className="use-grid cols-2">
          {c.roles.map((r, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{r.label}</div>
              <div className="en">{r.term}</div>
              <div className="zh">{r.body}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.walkTitle}
        lead={c.walkLead}
      >
        <div className="card">
          <table className="match">
            <thead>
              <tr><th>{c.tableHead[0]}</th><th>{c.tableHead[1]}</th><th>{c.tableHead[2]}</th></tr>
            </thead>
            <tbody>
              {c.tableRows.map((row, i) => (
                <tr key={i}><td className="be">{row[0]}</td><td>{row[1]}</td><td className="ex">{row[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="example mt14">
          <div className="en">{c.formula2En}</div>
          <div className="zh">{c.formula2Zh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.dimsTitle}
        lead={c.dimsLead}
      >
        <div className="card card-pad prose">
          {c.dimsParas.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.demoSecTitle}
        lead={c.demoSecLead}
      >
        <GradientDescentDemo c={c} />
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
