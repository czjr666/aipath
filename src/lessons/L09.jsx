import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// 词块居中布局：返回 [{x, w, cx}]
function layout(words, viewW, gap, charW, pad) {
  const widths = words.map((w) => w.length * charW + pad)
  const total = widths.reduce((s, w) => s + w, 0) + gap * (widths.length - 1)
  let x = (viewW - total) / 2
  return widths.map((w) => {
    const box = { x, w, cx: x + w / 2 }
    x += w + gap
    return box
  })
}
const selfArc = (c, y, up) => `M ${c - 12} ${y} C ${c - 28} ${y - up} ${c + 28} ${y - up} ${c + 12} ${y}`
const qArc = (x1, x2, y, h) => `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - h} ${x2} ${y}`

// ============================================================
// 双语内容层：结构 / class / 几何 / 数值 / 交互均不变，仅可见文本按语言取用。
// 演示用的中文例句词（苹果 / 它 / 小猫 等）是教学数据本身，与逐词权重一一对应，
// 翻译会破坏演示，故保持不变；只翻译讲解性文本。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
// ============================================================

// ① 传话游戏 vs 圆桌会议
const RELAY_WORDS = ['小明', '说', '周末', '他', '要', '回家']
const RELAY_FOCUS = 3
const DECAY = [100, 70, 49, 34, 24, 17]
const RELAY_ATTN = [0.44, 0.1, 0.12, 0.2, 0.08, 0.06]

// ② 注意力透视镜
const SENTS_BASE = {
  a: { words: ['苹果', '发布', '了', '新', '手机'], defaultIdx: 0,
    weights: [[0.3, 0.28, 0.04, 0.08, 0.3], [0.3, 0.3, 0.06, 0.1, 0.24], [0.12, 0.45, 0.25, 0.06, 0.12], [0.1, 0.14, 0.06, 0.25, 0.45], [0.22, 0.18, 0.04, 0.28, 0.28]] },
  b: { words: ['这个', '苹果', '真', '甜'], defaultIdx: 1,
    weights: [[0.3, 0.45, 0.08, 0.17], [0.18, 0.3, 0.1, 0.42], [0.07, 0.18, 0.25, 0.5], [0.08, 0.4, 0.22, 0.3]] },
  c: { words: ['小猫', '追', '蝴蝶', '它', '跑得', '飞快'], defaultIdx: 3,
    weights: [[0.3, 0.26, 0.12, 0.16, 0.1, 0.06], [0.3, 0.24, 0.3, 0.06, 0.06, 0.04], [0.1, 0.38, 0.3, 0.08, 0.08, 0.06], [0.42, 0.08, 0.14, 0.22, 0.08, 0.06], [0.26, 0.1, 0.06, 0.26, 0.2, 0.12], [0.1, 0.12, 0.06, 0.16, 0.34, 0.22]] },
}

// ③ 多头注意力
const HEAD_WORDS = ['苹果', '发布', '了', '新', '手机', '它', '很', '轻薄']
const HEADS_BASE = {
  syntax: { color: 'var(--amber)', arcs: [[3, 4, 0.9], [1, 0, 0.75], [1, 4, 0.7], [6, 7, 0.85]] },
  coref: { color: 'var(--terracotta)', arcs: [[5, 4, 0.95], [5, 0, 0.3]] },
  sem: { color: 'var(--sage)', arcs: [[0, 4, 0.85], [0, 1, 0.6], [4, 7, 0.6], [0, 7, 0.35]] },
  all: {},
}

const C = {
  zh: {
    relayMeta: {
      relay: { title: '传话游戏：一张纸条传到底',
        desc: '老方法（RNN）从左到右逐词读：全句记忆压在一张小纸条上，一棒一棒往右传，每传一棒丢一点。轮到「他」想找主人时，「小明」只剩三成 —— 句子越长，开头忘得越干净。更糟的是：第 4 棒必须等第 3 棒，永远没法并行。',
        tags: ['长句必忘事', '必须排队算'] },
      attn: { title: '圆桌会议：人人直连，一步到位',
        desc: '注意力把“接力”改成“圆桌”：「他」想找主人，直接回头看「小明」—— 中间隔 3 个词还是 3 万个词，都是一步直达、零磨损。并且每个词的环顾互不等待、同时开工 —— 正合 GPU 的胃口，大模型训得动全靠这一点。',
        tags: ['距离不衰减', '全员并行'] },
    },
    relayDemoTitle: '🎛️ 交互演示 · 「他」是谁？两种读法的命运',
    relayDemoHint: '点按钮切换读法 · 数值为教学示意',
    relayAria: '对比演示：老方法逐词传递信息逐渐衰减，注意力让「他」直接连线「小明」',
    relayDotLabel: '圆点 = 纸条里「小明」信息的残留浓度',
    relayChips: [['relay', '传话游戏 · 老方法 RNN'], ['attn', '圆桌会议 · 注意力']],

    sentNames: {
      a: '例句 A · 「苹果 发布 了 新 手机」',
      b: '例句 B · 「这个 苹果 真 甜」',
      c: '例句 C · 「小猫 追 蝴蝶 ，它 跑得 飞快」',
    },
    sentDesc: {
      a: ['它把最重的注意力分给了「发布」和「手机」。这两个邻居告诉它：这里的苹果是一家科技公司 —— 吸收之后，它的新表示明显偏向“公司”。', '动词在找自己的搭档：重点看「苹果」（谁发布）和「手机」（发布什么）—— 主语和宾语各拉一条粗线。', '虚词没什么独立含义，几乎贴着「发布」—— 它的任务只是给动词补上“已完成”的信息。', '形容词死死盯住「手机」—— 它在确认自己修饰的名词是谁。', '它看「新」（被谁修饰），也回看「苹果」「发布」—— 确认自己是这场发布会的主角。'],
      b: ['指示词紧贴「苹果」—— 它的职责就是宣告：我说的是眼前这一个。', '换了一句话，它把最重的注意力压在「甜」上 —— 只有水果才会甜，公司不会。对比例句 A：同一个词，因为邻居不同，吸收后的新表示完全不同。', '程度副词盯着「甜」—— 它修饰的是“甜”到什么程度。', '它回头看「苹果」确认是谁甜，顺便接收「真」递来的加强语气。'],
      c: ['主角在确认自己的动作：重点看「追」—— 我在干什么；也分一份给「它」，因为后半句还会再提到自己。', '动词照例找搭档：左手「小猫」（谁在追），右手「蝴蝶」（追什么）—— 各拉一条粗线，句子骨架就立住了。', '被追的一方紧盯「追」—— 确认自己在这个动作里当宾语。', '本句的明星：「它」把最重的 42% 压回「小猫」—— 跑得飞快的是小猫。注意「蝴蝶」也分到 14%：指代有歧义时，权重也会犹豫着分裂，不会全押一边。这就是 Q/K/V 那场“图书馆借书”的最终账单。', '动作在找主人：看「它」，再顺着「它」回看「小猫」—— 一层层叠起来，远亲也能连上。', '程度词看着「跑得」—— 我修饰的是跑的速度；顺带看一眼「它」，确认这速度属于谁。'],
    },
    lensSelf: '自己',
    lensDemoTitle: '🎛️ 同一个「苹果」，两种眼神；一个「它」，当场认主',
    lensDemoHint: '点击词块切换视角 · 权重为教学示意值',
    lensAria: '注意力权重示意图：从选中的词向句中所有词画弧线，线越粗表示注意力权重越大',
    lensWordAria: (word) => `选中「${word}」，查看它的注意力分布`,
    lensChips: [['a', '苹果发布了新手机'], ['b', '这个苹果真甜'], ['c', '小猫追蝴蝶，它跑得飞快']],
    lensWhoTitle: (w) => <>「{w}」在看谁？</>,
    lensFootnote: '权重由本课手工设计、用于演示直觉；真实模型的权重由训练得出，且每层每头都不同。',

    headMeta: {
      syntax: { title: '语法头 · 搭句子骨架',
        desc: '它盯“谁修饰谁、谁是谁的主语宾语”：「新」挂上「手机」、「发布」左手牵「苹果」右手牵「手机」、「很」黏住「轻薄」。这类头先把句子的承重墙立起来。', tags: ['新 → 手机', '发布 → 苹果·手机', '很 → 轻薄'] },
      coref: { title: '指代头 · 「它」指谁',
        desc: '最重的一条线把「它」连回「手机」—— 轻薄的是手机，不是苹果公司。注意它还试探地看了一眼「苹果」：指代常有歧义，这个头的权重也不会全押一边。', tags: ['它 → 手机（重）', '它 → 苹果（轻）'] },
      sem: { title: '语义头 · 谁和谁一伙',
        desc: '「苹果」「发布」「手机」「轻薄」互相拉紧成“科技一伙”—— 正是这股拉力，把这一句里的「苹果」拽向科技公司，而不是水果摊。', tags: ['苹果 ↔ 手机', '科技一伙抱团'] },
      all: { title: '三个头拼起来 = 多头注意力',
        desc: '三个头各画各的线、互不商量，各得一份小笔记；最后拼接、融合成这一层的输出。真实大模型一层往往就有几十个头、再叠几十层 —— 没有哪个头看见全貌，拼起来才是“理解”。', tags: ['语法头', '指代头', '语义头', '拼接融合'] },
    },
    headDemoTitle: '🎭 交互演示 · 一句话，三种划重点的方式',
    headDemoHint: '点按钮切换“头” · 连线为教学示意',
    headAria: '多头注意力演示：同一句话，语法头、指代头、语义头各自画出不同的关注连线',
    headChips: [['syntax', '语法头'], ['coref', '指代头'], ['sem', '语义头'], ['all', '三头拼起来']],

    goalsTitle: '🎯 你将学会',
    goals: [
      '一句话说清注意力在干什么：每个词环顾四周，按相关性加权吸收邻居的信息',
      '明白它为什么非存在不可：在“传话游戏 vs 圆桌会议”演示里，亲眼看老方法怎么把长句忘光',
      '用一次“图书馆借书”看懂 Q、K、V 三个角色 —— 全程人话，零数学门槛',
      '理解多头注意力为什么要“多头”，并亲手切换语法头 / 指代头 / 语义头，看它们各划各的重点',
      '点开三个句子：看同一个「苹果」因上下文关注完全不同的词，看「它」如何找到自己的主人',
      '能解释你在 ChatGPT / Claude 里的日常体验：为什么长对话记得住开头、为什么聊得越久越慢越贵',
    ],

    conceptTitle: '💡 核心概念：固定的坐标，装不下流动的语义',
    conceptLead: '第 8 课给了每个词一个向量坐标，但那个坐标是固定的——像印进字典就不再改动。可「苹果发布了新手机」和「这个苹果真甜」里，分明是两个“苹果”：一家公司、一种水果。一个点装不下两个意思。注意力机制的使命，就是把“字典坐标”升级成“现场坐标”。',
    concept8Tag: '第 8 课的困境',
    concept8Big: <>「苹果」永远停在<span className="gap">同一个点</span>上</>,
    concept8Note: '静态 embedding 是查字典：一词一坐标，不管上下文。多义词被迫压扁成一个“平均含义”，公司和水果挤在同一个向量里。',
    conceptAttnTag: '注意力的解法',
    conceptAttnBig: <>每个词<span className="hl">环顾四周</span>，当场重新定位</>,
    conceptAttnNote: <>看见「发布」「手机」，这个「苹果」就漂向科技公司；看见「甜」，那个「苹果」就漂向水果。新表示是<b>上下文化</b>的 —— 每句话现算一次。</>,
    conceptStepsLead: <>它的做法说穿了只有三步 —— 句中<b>每个词</b>都各自做一遍：</>,
    conceptTableHead: ['步骤', '干什么', '一句话画面'],
    conceptTableRows: [
      { be: '① 打分', do: <>对句中所有词（<b>包括自己</b>）各打一个相关性分数</>, ex: '“你和我有多大关系？”' },
      { be: '② 换算', do: <>把高低不一的分数换算成一组<b>总和为 100%</b> 的“吸收比例”</>, ex: '“按关系亲疏分配预算”' },
      { be: '③ 吸收', do: '按比例把所有词的信息混合起来，得到自己的新表示', ex: '“重要的邻居多听，无关的少听”' },
    ],
    conceptOutro: <>就这么多。所谓“划重点”，本质是一次<b>按相关性混合信息</b>的操作：比例大的词，在新表示里占的份额就大。你发给 ChatGPT 的每一句话，里面的每个词都要过这道工序 —— 而且是几十层、每层几十遍地反复过。</>,

    whyTitle: '🧗 为什么非它不可：从“传话游戏”到“圆桌会议”',
    whyLead: '在注意力出现之前（2017 年以前），主流方法（RNN，循环神经网络）是从左到右逐词读的：整句话的记忆被压缩在一张“小纸条”上，一棒一棒往右传。这个设计有两处致命伤，恰好都被注意力一次治好 —— 点下面两个按钮对比：',
    whyMid: <>把两处治好的地方说透 ——</>,
    whyCard1Label: '致命伤一 · 远距离失忆',
    whyCard1En: <>纸条传得越远，<b>磨损越狠</b></>,
    whyCard1Zh: <>“我小时候在外婆家养的那只总爱晒太阳的猫……<b>它</b>”—— 传话式读法走到「它」时，开头的「猫」早被一路的新词冲淡了。注意力则让「它」直接回头看「猫」：<b>隔 3 个词和隔 3 万个词，都是一步直达、零磨损</b>。这就是大模型能“读”几十万字长文的根基。</>,
    whyCard2Label: '致命伤二 · 必须排队',
    whyCard2En: <>第 4 棒必须<b>等第 3 棒</b></>,
    whyCard2Zh: <>传话是串行的：后一个词必须等前一个词处理完，几万词的文章就得老老实实传几万棒，GPU 上千个计算单元只能干瞪眼。注意力让<b>所有词同时环顾、同时开工</b> —— 训练速度起飞，模型才堆得起后来的千亿参数（第 15 课）。</>,
    whyOutro: <>一句话总结：注意力不是“锦上添花的小改进”，而是同时解决了<b>记不住</b>和<b>算不快</b>两大瓶颈的换代方案。2017 年那篇论文标题说得直白 ——《Attention Is All You Need》（注意力就是你的全部所需），它催生的架构就是下一课的主角 Transformer。</>,

    qkvTitle: '📚 Q、K、V：到图书馆借一次书',
    qkvLead: '前面的“打分”具体怎么打？工程上，每个词的向量会分别过三道训练学出来的“变身工序”，分裂成三个角色 —— 就像同一个人在图书馆里可以既是提问的读者、又是被检索的藏书。想象你走进一座图书馆：',
    qkvRole1Label: 'Q · 我想找什么',
    qkvRole1En: <>Query <b>提问单</b></>,
    qkvRole1Zh: <>这个词作为“读者”发出的问题。比如「它」的 Query 大致在问：<b>我指代的是谁？</b></>,
    qkvRole2Label: 'K · 我能被怎么找到',
    qkvRole2En: <>Key <b>索引标签</b></>,
    qkvRole2Zh: <>每个词挂出的检索标签，声明“我这里有什么”。「小猫」的 Key 大致写着：<b>我是个动物名词、本句主角</b>。</>,
    qkvRole3Label: 'V · 我实际提供什么',
    qkvRole3En: <>Value <b>书的内容</b></>,
    qkvRole3Zh: '真正被吸收的信息本体。匹配成功后，借走的是 Value —— 标签只用来找书，内容才是收获。',
    qkvWalkLead: <>拿「小猫追蝴蝶，它跑得飞快」里的「它」当读者，把借书全程走一遍 ——</>,
    qkvStep1Label: '第 1 步 · 递出提问单（Q）',
    qkvStep1En: <>「它」在找<b>一个刚出场的主角</b></>,
    qkvStep1Zh: '「它」的提问单大致写着：“我指代谁？最好是个会动的、刚被提到的家伙。” 这张单子不是谁规定的，是训练中自己学出来的提问方式。',
    qkvStep2Label: '第 2 步 · 逐一对标签（K）',
    qkvStep2En: <>挨个对照，<b>各打一个分</b></>,
    qkvStep2Zh: '拿提问单对全馆标签：「小猫」的标签“动物·本句主角”——高分；「蝴蝶」“动物·配角”——中等分；「追」“动作”——低分。提问和标签越对路，分越高。',
    qkvStep3Label: '第 3 步 · 换算借阅比例',
    qkvStep3En: <>分数 → <b>总和 100% 的比例</b></>,
    qkvStep3Zh: <>高低分被换算成借阅配额：小猫 42%、蝴蝶 14%、其余拿零头。注意：<b>谁都不会被完全拒借</b> —— 分低只是借得少，这让模型不会武断地“一票否决”。</>,
    qkvStep4Label: '第 4 步 · 按比例摘抄（V）',
    qkvStep4En: <>汇编成「它」的<b>新笔记</b></>,
    qkvStep4Zh: '按配额从每本书摘抄内容，汇成一份新笔记 —— 这就是「它」的上下文化新表示。从这一刻起，「它」的向量里流着 42% 的「小猫」：模型“知道”了它指谁。',
    qkvFormula: 'Attention(Q, K, V) = softmax( QKᵀ / √d ) · V',
    qkvFormulaZh: '整门课唯一的一行公式，看不懂完全不影响 —— 它说的就是上面四步，下表逐项翻译成图书馆里的动作。',
    qkvTableHead: ['公式片段', '图书馆里的动作', '实际在干什么'],
    qkvTableRows: [
      { be: 'QKᵀ', act: '拿提问单逐一对照所有书的索引标签', ex: '每对词打一个相关性分数 —— 第 8 课“方向越一致越相关”的直觉，在这里上岗' },
      { be: '÷ √d', act: '管理员把分数整体压一压', ex: '向量越长分数天然越大，先压一压，免得换算比例时一家独大、训练不稳' },
      { be: 'softmax', act: '把对照结果换算成“借阅比例”，总和 100%', ex: '原始分数 → 一组总和为 100% 的注意力权重（“换算比例”这个动作的学名）' },
      { be: '· V', act: '按比例从每本书摘抄内容，汇编成笔记', ex: '把所有 Value 按比例混合 —— 这份“笔记”就是该词的新表示' },
    ],
    qkvFootnote: '为什么要把一个词拆成三个角色？因为“我想找什么”和“我能提供什么”经常不是一回事：「它」最想找的是别人（主语），自己能提供的信息却很少。拆开 Q 和 K，模型才能学会这种不对称的眼神。',

    lensSecTitle: '🎛️ 注意力透视镜：点一个词，看它在看谁',
    lensSecLead: '三句话任你拆。点击任意词块，弧线会从它伸向句中所有词（含一条绕回自己的小环）——线越粗越深，注意力权重越大，词下方标出百分比，总和为 100%。建议的玩法：先对比前两句里的「苹果」，再到第三句点「它」，亲眼看刚才那场“图书馆借书”的结果。',

    headSecTitle: '🎭 多头注意力：几十位编辑，各划各的重点',
    headSecLead: '一次注意力 = 一种“看法”。可语言里值得关注的关系远不止一种：语法上谁搭配谁、指代上谁是谁、语义上谁和谁一伙……一个头忙不过来，于是把向量切成若干份，让多个“头”并行各看各的，比如：',
    headCard1Label: '有的头 · 盯语法搭配',
    headCard1En: '谁修饰谁',
    headCard1Zh: '「新」该挂在哪个名词上？「发布」的主语和宾语在哪？这类头把句子的骨架搭起来。',
    headCard2Label: '有的头 · 盯指代关系',
    headCard2En: <>「它」指谁</>,
    headCard2Zh: '「小猫追蝴蝶，它跑得飞快」—— 这类头负责把「它」重重地连回「小猫」。',
    headCard3Label: '有的头 · 盯语义关联',
    headCard3En: '谁和谁一伙',
    headCard3Zh: '「苹果」「甜」「手机」谁跟谁亲？多义词主要靠这类头认清自己这次是什么意思。',
    headMidLead: <>空说不如亲手切。同一句「苹果发布了新手机，它很轻薄」，三个头各画各的线 —— 切换看看每个头眼里的句子长什么样，最后点“拼起来”：</>,
    headOutro: <>每个头独立做一遍“打分 → 换算比例 → 吸收”，各得一份小笔记，最后<b>拼接起来</b>再融合成完整的新表示。GPT 级别的模型每层往往有几十个头、再叠几十层 —— 一句话被翻来覆去“划重点”的次数，远超任何人类读者。</>,
    headFootnote: '诚实备注：头的分工是训练中自己“长”出来的，没有人规定“3 号头管指代”。研究者只是在事后分析里观察到，确实有不少头呈现出这类清晰可辨的职能 —— 也有大量头的职能至今没人看得懂。',

    chatTitle: '📖 深入展开｜在 ChatGPT 体内：你看到的“灵性瞬间”，多半是注意力在干活',
    chatLead: '先记住一个事实：模型生成回答时，每吐一个新词，都要让它对前文的全部内容做一遍本课的“环顾” —— 你的提问、它自己刚说过的话、几十轮之前的闲聊，统统在被打分的名单上。懂了这一点，很多日常体验就有了解释：',
    chatTableHead: ['你在 ChatGPT / Claude 里看到的现象', '背后的注意力机制'],
    chatTableRows: [
      { be: '聊了几十轮，它还记得你开头说的名字', ex: '生成每个新词都要环顾全部历史，名字隔得再远也是一步直达 —— 前提是还没被挤出上下文窗口（第 17 课）。' },
      { be: '你说“把刚才第二点展开讲讲”，它知道指什么', ex: '指代头把「第二点」连回前文对应段落 —— 和「它」连回「小猫」是同一种本事，只是连线跨得更远。' },
      { be: '你贴半截代码让它续写，命名和缩进风格保持一致', ex: '续写的每个新词都在按比例吸收前文的命名习惯、格式风格 —— “风格”就藏在注意力的权重分布里。' },
      { be: '同一个词，放进不同问题里它理解得不一样', ex: '上下文化表示每次都现场重算：你问“苹果股价”和“苹果热量”，体内那个「苹果」吸收的邻居完全不同。' },
    ],
    chatOutro: <>还有一层容易被忽略的纵深：注意力是<b>层层叠加</b>的。第 1 层里，「苹果」只能吸收字面邻居的信息；到第 5 层，它吸收的邻居已经各自吸收过自己的邻居 —— 信息像涟漪一样扩散；到第 20 层，它身上携带的可能是“整段话在聊产品发布会”这种段落级的理解。几十层 × 每层几十个头，一句话被划重点几百遍 —— 所谓“深度”理解，就是这么一层层垒出来的。</>,
    chatExEn: <>一个对话现场的小推论：<span className="hl">“重要的话放最后说”为什么常常有效</span></>,
    chatExZh: '注意力虽然能直连任意距离，但权重终究是分出来的 —— 上下文越长，每个词分到的关注越稀。把关键指令放在提示词的开头或结尾、而不是埋在中段，往往更容易被“划中重点”。这条提示词技巧的原理（lost in the middle 现象），第 16、17 课会专门展开。',

    limitTitle: '📖 深入展开｜它的局限：每对词都要握手，账单按平方涨',
    limitLead: '圆桌会议的代价是握手次数。每个词都要和每个词打一遍分：10 个词的句子要打 100 次分，100 个词要打 1 万次，10 万词的长文要打 100 亿次 —— 词数翻倍，握手账单翻四倍。这是注意力与生俱来的体质，也是你能在产品里实实在在摸到的三堵墙：',
    limitCard1Label: '你摸到的墙 ①',
    limitCard1En: <>上下文窗口<b>有上限</b></>,
    limitCard1Zh: '不是模型“不想记”，是握手账单付不起：窗口扩一倍，计算与显存大约要翻四倍。各家拼命宣传“百万 token 长上下文”，本质是在和这张平方账单搏斗。',
    limitCard2Label: '你摸到的墙 ②',
    limitCard2En: <>聊得越久，<b>越慢越贵</b></>,
    limitCard2Zh: '每生成一个新词，都要跟全部历史握一轮手 —— 对话越长，每一步越吃力。API 按 token 计费、长对话费用陡涨，根子也在这里。',
    limitCard3Label: '业界的回应',
    limitCard3En: <>一场“省握手”<b>军备竞赛</b></>,
    limitCard3Zh: '只跟附近的词握手（滑动窗口）、只挑重点词握手（稀疏注意力）、把旧对话压缩成摘要……各种“偷工减料的艺术”层出不穷 —— 全是在平方账单上抠预算。',
    limitExEn: <>边界提醒：注意力<span className="hl">只负责搬运，不负责消化</span></>,
    limitExZh: '它做的事是“把相关的信息按比例搬到一起”，搬完之后真正的加工 —— 提炼、变换、记忆 —— 要靠每层后面跟着的另一个部件（前馈网络）完成。注意力是大模型的心脏，但心脏不是全身。零件怎么组装成完整的 Transformer，下一课见。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: '注意力机制 = 人类的注意力，模型在“有意识地聚焦”',
        good: '它只是按相似度混合信息 —— 一套机械的打分加权流程，没有意识，也没有“聚焦”的主观体验',
        why: <><b>病因：</b>名字起得太拟人。“Attention” 只是研究者借人类认知打的比方，机制本身就是本课那三步：打分 → 换算比例 → 加权吸收。把它当成“AI 长出了人类式注意力”，会高估模型对世界的理解。</> },
      { bad: '模型像人一样，从左往右一个词一个词地读句子',
        good: '所有词同时并行处理；谁先谁后的顺序信息，靠“位置编码”额外补进向量里',
        why: <><b>病因：</b>把自己的阅读习惯投射给了模型。注意力对全句一视同仁、一次算完 —— 这正是本课“圆桌会议”演示的第二个卖点：能在 GPU 上大规模并行，远快于逐词传话的老方法（RNN）。顺序到底怎么补？下一课 Transformer 见分晓。</> },
      { bad: '看一张注意力权重图，就能解释模型“为什么这么回答”',
        good: '权重只是亿万个中间计算值里的一小撮；“注意力能不能当解释”在研究界至今争论不休',
        why: <><b>病因：</b>本课的弧线图太直观，容易让人以为模型脑内真有一张“重点清单”。实际上单个头的权重和最终答案之间还隔着几十层的混合与改写 —— 拿一张权重图断言模型的“理由”，就像凭一帧监控画面给整部电影写剧情梗概。</> },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 「苹果发布了新手机」和「这个苹果真甜」—— 两个「苹果」在第 8 课的 embedding 层输出相同吗？经过注意力层之后呢？为什么？',
        a: <><b>embedding 层相同，注意力层之后不同。</b>静态 embedding 一词一坐标，两个「苹果」拿到同一个向量；注意力层让它们各自按比例吸收邻居 —— 一个重点吸收了「发布」「手机」，另一个重点吸收了「甜」，于是得到两个不同的上下文化向量。这正是注意力存在的意义。</> },
      { q: '2. 用 Q / K / V 拆解一个熟悉的场景：你在搜索引擎输入「附近的川菜馆」。Query、Key、Value 分别对应什么？',
        a: <><b>Query = 你的搜索词</b>（我想找什么）；<b>Key = 每家店的索引信息</b>（名称、品类、标签 —— 我能被怎么搜到）；<b>Value = 店铺详情内容</b>（我实际提供什么）。打分就是搜索词和各家索引的匹配度。区别在于：搜索引擎倾向“取排名靠前的”，注意力是“按匹配度对所有 Value 加权混合”，谁都贡献一点。</> },
      { q: '3. 既然多头注意力最后还是要拼起来，为什么不干脆用一个“超级大头”一次算完？',
        a: <>一个头一次只能学出<b>一种看句子的方式</b>。多个头并行，各自在自己的子空间里打分：有的学语法搭配、有的学指代、有的学语义关联，拼接后视角互补 —— 好比多位编辑各划各的重点再汇总，比一位编辑用一支笔划到底，捕捉的关系更丰富。本课的“三头拼起来”演示就是这幅画面。</> },
      { q: '4. 朋友抱怨：“跟 AI 聊到第 200 轮，它回复越来越慢，听说费用还按对话长度涨 —— 是服务器不行吧？” 用本课的“握手账单”替 AI 喊个冤。',
        a: <>不是服务器的锅，是注意力的天性：<b>每生成一个新词，都要跟前文所有词握一遍手打分</b>。对话越长，每一步要握的手越多 —— 而且词数翻倍、握手次数大约翻四倍，速度和费用按平方恶化。这也是上下文窗口有上限的根本原因（第 17 课细讲），各家的“长上下文”竞赛，比的就是谁更会在这张账单上省钱。</> },
    ],
  },

  en: {
    relayMeta: {
      relay: { title: 'Telephone game: one note passed all the way down',
        desc: 'The old method (the RNN) reads left to right, word by word: the whole sentence’s memory is squeezed onto a tiny note and handed down the line, losing a little at each hop. By the time it’s 「他」’s turn to find its owner, only 30% of 「小明」 is left — the longer the sentence, the cleaner the start is forgotten. Worse still: hop 4 must wait for hop 3, so there’s no parallelism, ever.',
        tags: ['Forgets long sentences', 'Must compute in line'] },
      attn: { title: 'Round table: everyone connects directly, in one step',
        desc: 'Attention turns the “relay” into a “round table”: 「他」 wants its owner and simply looks straight back at 「小明」 — whether 3 words or 30,000 words apart, it’s one direct step with zero wear. And every word’s scan waits for no one, all firing at once — exactly to a GPU’s taste, and the only reason big models can be trained at all.',
        tags: ['No decay with distance', 'Everyone in parallel'] },
    },
    relayDemoTitle: '🎛️ Interactive · Who is 「他」? Two readings, two fates',
    relayDemoHint: 'Click a button to switch readings · values are illustrative',
    relayAria: 'Comparison demo: the old method passes information word by word and it gradually decays, while attention links 「他」 directly to 「小明」',
    relayDotLabel: 'Dot = remaining concentration of 「小明」’s info on the note',
    relayChips: [['relay', 'Telephone game · old method (RNN)'], ['attn', 'Round table · attention']],

    sentNames: {
      a: 'Sentence A · 「苹果 发布 了 新 手机」',
      b: 'Sentence B · 「这个 苹果 真 甜」',
      c: 'Sentence C · 「小猫 追 蝴蝶 ，它 跑得 飞快」',
    },
    sentDesc: {
      a: ['It gives its heaviest attention to 「发布」 and 「手机」. These two neighbors tell it: the apple here is a tech company — and after absorbing them, its new representation clearly leans toward “company.”', 'The verb is looking for its partners: it focuses on 「苹果」 (who released) and 「手机」 (what was released) — one thick line each to subject and object.', 'A function word has little meaning of its own and clings almost entirely to 「发布」 — its only job is to add the “completed” aspect to the verb.', 'The adjective fixes firmly on 「手机」 — it’s confirming which noun it modifies.', 'It looks at 「新」 (which modifies it) and back at 「苹果」 and 「发布」 — confirming it’s the star of this launch.'],
      b: ['The demonstrative clings to 「苹果」 — its job is simply to announce: I mean this very one in front of us.', 'In a different sentence, it puts its heaviest attention on 「甜」 — only fruit can be sweet, a company can’t. Compare Sentence A: the same word, with different neighbors, ends up with a completely different representation after absorbing.', 'The degree adverb watches 「甜」 — it modifies just how sweet.', 'It looks back at 「苹果」 to confirm who is sweet, and along the way takes in the intensifier passed over by 「真」.'],
      c: ['The protagonist confirms its own action: it focuses on 「追」 — what I’m doing; it also gives a share to 「它」, since the second half will mention it again.', 'The verb looks for its partners as usual: 「小猫」 on its left (who is chasing), 「蝴蝶」 on its right (chasing what) — a thick line each, and the sentence’s skeleton stands up.', 'The one being chased stares at 「追」 — confirming it plays the object in this action.', 'The star of this sentence: 「它」 puts its heaviest 42% back on 「小猫」 — it’s the kitten that runs fast. Note that 「蝴蝶」 also gets 14%: when reference is ambiguous, the weights hesitate and split rather than betting everything on one side. This is the final tab from that “borrowing books at the library” trip through Q/K/V.', 'The action looks for its owner: it looks at 「它」, then follows 「它」 back to 「小猫」 — stacking layer on layer, even distant relations connect.', 'The degree word watches 「跑得」 — I modify the speed of running; it also glances at 「它」 to confirm whose speed this is.'],
    },
    lensSelf: 'self',
    lensDemoTitle: '🎛️ One 「苹果」, two looks; one 「它」, identifying its owner on the spot',
    lensDemoHint: 'Click a word block to switch viewpoints · weights are illustrative',
    lensAria: 'Attention-weight diagram: arcs are drawn from the selected word to every word in the sentence; thicker lines mean greater attention weight',
    lensWordAria: (word) => `Select 「${word}」 to see its attention distribution`,
    lensChips: [['a', '苹果发布了新手机'], ['b', '这个苹果真甜'], ['c', '小猫追蝴蝶，它跑得飞快']],
    lensWhoTitle: (w) => <>Who is 「{w}」 looking at?</>,
    lensFootnote: 'These weights are hand-designed for this lesson to convey intuition; a real model’s weights come from training and differ for every layer and every head.',

    headMeta: {
      syntax: { title: 'Syntax head · framing the sentence skeleton',
        desc: 'It watches “who modifies whom, who is whose subject or object”: 「新」 hooks onto 「手机」, 「发布」 holds 「苹果」 on its left and 「手机」 on its right, 「很」 sticks to 「轻薄」. Heads like this raise the load-bearing walls of the sentence first.', tags: ['新 → 手机', '发布 → 苹果·手机', '很 → 轻薄'] },
      coref: { title: 'Coreference head · who does 「它」 refer to',
        desc: 'The heaviest line links 「它」 back to 「手机」 — what’s thin and light is the phone, not the company Apple. Note it also tentatively glances at 「苹果」: reference is often ambiguous, so this head doesn’t bet all its weight on one side either.', tags: ['它 → 手机（heavy）', '它 → 苹果（light）'] },
      sem: { title: 'Semantic head · who belongs with whom',
        desc: '「苹果」, 「发布」, 「手机」, and 「轻薄」 pull tight into a “tech crowd” — and it’s exactly this pull that drags the 「苹果」 in this sentence toward the tech company, not the fruit stand.', tags: ['苹果 ↔ 手机', 'The tech crowd huddles'] },
      all: { title: 'Three heads combined = multi-head attention',
        desc: 'The three heads each draw their own lines without consulting one another, each getting its own little notes; in the end they’re concatenated and fused into this layer’s output. A real big model often has dozens of heads per layer, stacked over dozens of layers — no single head sees the whole picture; putting them together is what “understanding” is.', tags: ['Syntax head', 'Coreference head', 'Semantic head', 'Concatenate & fuse'] },
    },
    headDemoTitle: '🎭 Interactive · One sentence, three ways of marking what matters',
    headDemoHint: 'Click a button to switch “heads” · lines are illustrative',
    headAria: 'Multi-head attention demo: for the same sentence, the syntax head, coreference head, and semantic head each draw different attention links',
    headChips: [['syntax', 'Syntax head'], ['coref', 'Coreference head'], ['sem', 'Semantic head'], ['all', 'All three combined']],

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'State in one sentence what attention does: each word scans its surroundings and absorbs neighbors’ information, weighted by relevance',
      'Understand why it absolutely had to exist: in the “telephone game vs round table” demo, watch with your own eyes how the old method forgets a long sentence',
      'Grasp the three roles of Q, K, V through one “borrowing books at the library” story — all in plain words, zero math required',
      'Understand why multi-head attention needs to be “multi-head,” and switch between the syntax / coreference / semantic heads yourself to see what each marks',
      'Open three sentences: see the same 「苹果」 attend to completely different words depending on context, and see how 「它」 finds its owner',
      'Be able to explain your everyday experience in ChatGPT / Claude: why a long chat remembers the beginning, and why the longer you chat the slower and pricier it gets',
    ],

    conceptTitle: '💡 Core Idea: a fixed coordinate can’t hold flowing meaning',
    conceptLead: 'Lesson 8 gave each word a vector coordinate, but that coordinate is fixed — like being printed in a dictionary and never changed again. Yet in 「苹果发布了新手机」 and 「这个苹果真甜」 there are clearly two “apples”: a company and a fruit. One point can’t hold two meanings. The mission of the attention mechanism is to upgrade that “dictionary coordinate” into an “on-the-spot coordinate.”',
    concept8Tag: 'The dilemma of Lesson 8',
    concept8Big: <>「苹果」 forever stays at <span className="gap">the same point</span></>,
    concept8Note: 'A static embedding is a dictionary lookup: one word, one coordinate, regardless of context. A polysemous word is forced to flatten into a single “average meaning,” cramming the company and the fruit into the same vector.',
    conceptAttnTag: 'Attention’s solution',
    conceptAttnBig: <>Each word <span className="hl">scans its surroundings</span> and re-positions itself on the spot</>,
    conceptAttnNote: <>Seeing 「发布」 and 「手机」, this 「苹果」 drifts toward the tech company; seeing 「甜」, that 「苹果」 drifts toward the fruit. The new representation is <b>contextualized</b> — recomputed fresh for every sentence.</>,
    conceptStepsLead: <>Stripped down, it’s just three steps — and <b>every word</b> in the sentence runs through each of them:</>,
    conceptTableHead: ['Step', 'What it does', 'In one phrase'],
    conceptTableRows: [
      { be: '① Score', do: <>Give a relevance score to every word in the sentence (<b>including itself</b>)</>, ex: '“How related are you and I?”' },
      { be: '② Convert', do: <>Convert the varied scores into a set of “absorption ratios” that <b>sum to 100%</b></>, ex: '“Allocate the budget by how close the relationship is”' },
      { be: '③ Absorb', do: 'Mix all words’ information by those ratios to get its own new representation', ex: '“Listen more to important neighbors, less to irrelevant ones”' },
    ],
    conceptOutro: <>That’s all. So-called “marking what matters” is essentially one operation of <b>mixing information by relevance</b>: a word with a larger ratio takes a larger share in the new representation. Every sentence you send to ChatGPT has each of its words go through this process — and over dozens of layers, dozens of times per layer, again and again.</>,

    whyTitle: '🧗 Why it had to be: from “telephone game” to “round table”',
    whyLead: 'Before attention appeared (before 2017), the mainstream method (the RNN, the recurrent neural network) read left to right, word by word: the whole sentence’s memory was compressed onto a “tiny note” and handed down the line, hop by hop. This design has two fatal flaws, both happening to be cured by attention in one stroke — click the two buttons below to compare:',
    whyMid: <>Let’s spell out both cures —</>,
    whyCard1Label: 'Fatal flaw one · long-distance amnesia',
    whyCard1En: <>The farther the note travels, the <b>worse the wear</b></>,
    whyCard1Zh: <>“That cat I raised at my grandma’s when I was little, the one that always loved sunbathing… <b>它</b>” — by the time a telephone-style reading reaches 「它」, the opening 「猫」 has long been diluted by all the new words along the way. Attention instead lets 「它」 look straight back at 「猫」: <b>3 words apart or 30,000 words apart, it’s one direct step with zero wear</b>. This is the foundation that lets big models “read” documents of hundreds of thousands of characters.</>,
    whyCard2Label: 'Fatal flaw two · forced to queue',
    whyCard2En: <>Hop 4 must <b>wait for hop 3</b></>,
    whyCard2Zh: <>Telephone is serial: the next word must wait until the previous one is processed, so an article of tens of thousands of words must dutifully pass tens of thousands of hops, while a GPU’s thousands of compute units can only stare blankly. Attention lets <b>all words scan and start work at the same time</b> — training speed takes off, and only then can a model stack up the later hundreds of billions of parameters (Lesson 15).</>,
    whyOutro: <>In one sentence: attention is not a “nice-to-have minor improvement,” but a generational replacement that simultaneously solves the two bottlenecks of <b>can’t remember</b> and <b>can’t compute fast</b>. That 2017 paper’s title says it plainly — “Attention Is All You Need” — and the architecture it spawned is the star of the next lesson: the Transformer.</>,

    qkvTitle: '📚 Q, K, V: borrowing a book at the library',
    qkvLead: 'How exactly is the earlier “scoring” done? In engineering, each word’s vector passes separately through three trained “transformation steps,” splitting into three roles — just as one person in a library can be both a reader asking questions and a book on the shelf being searched. Imagine walking into a library:',
    qkvRole1Label: 'Q · what I’m looking for',
    qkvRole1En: <>Query <b>the request slip</b></>,
    qkvRole1Zh: <>The question this word asks as a “reader.” For example, 「它」’s Query roughly asks: <b>who do I refer to?</b></>,
    qkvRole2Label: 'K · how I can be found',
    qkvRole2En: <>Key <b>the index tag</b></>,
    qkvRole2Zh: <>The search tag each word puts up, declaring “here’s what I’ve got.” 「小猫」’s Key roughly reads: <b>I’m an animal noun, the protagonist of this sentence</b>.</>,
    qkvRole3Label: 'V · what I actually offer',
    qkvRole3En: <>Value <b>the book’s content</b></>,
    qkvRole3Zh: 'The actual body of information that gets absorbed. Once a match succeeds, what’s borrowed is the Value — the tag is only used to find the book; the content is the real gain.',
    qkvWalkLead: <>Take 「它」 in 「小猫追蝴蝶，它跑得飞快」 as the reader and walk through the whole borrowing process —</>,
    qkvStep1Label: 'Step 1 · hand over the request slip (Q)',
    qkvStep1En: <>「它」 is looking for <b>a protagonist that just appeared</b></>,
    qkvStep1Zh: '「它」’s request slip roughly reads: “Who do I refer to? Preferably someone that moves and was just mentioned.” This slip isn’t prescribed by anyone — it’s the way of asking that the model learned by itself during training.',
    qkvStep2Label: 'Step 2 · check the tags one by one (K)',
    qkvStep2En: <>Check them one by one, <b>scoring each</b></>,
    qkvStep2Zh: 'Match the request slip against every tag in the library: 「小猫」’s tag “animal · protagonist of this sentence” — high score; 「蝴蝶」 “animal · supporting role” — medium score; 「追」 “action” — low score. The better the question matches the tag, the higher the score.',
    qkvStep3Label: 'Step 3 · convert into borrowing ratios',
    qkvStep3En: <>Scores → <b>ratios summing to 100%</b></>,
    qkvStep3Zh: <>The high and low scores are converted into borrowing quotas: 小猫 42%, 蝴蝶 14%, the rest get scraps. Note: <b>no one is ever fully refused</b> — a low score just means borrowing less, which keeps the model from arbitrarily casting a “veto.”</>,
    qkvStep4Label: 'Step 4 · copy out by ratio (V)',
    qkvStep4En: <>Compile 「它」’s <b>new notes</b></>,
    qkvStep4Zh: 'Copy content from each book according to the quota and compile a set of new notes — this is 「它」’s contextualized new representation. From this moment on, 「它」’s vector carries 42% of 「小猫」: the model “knows” who it refers to.',
    qkvFormula: 'Attention(Q, K, V) = softmax( QKᵀ / √d ) · V',
    qkvFormulaZh: 'The only line of formula in the whole course, and not getting it doesn’t matter at all — it says exactly the four steps above, and the table below translates each piece into actions in the library.',
    qkvTableHead: ['Formula piece', 'The action in the library', 'What it actually does'],
    qkvTableRows: [
      { be: 'QKᵀ', act: 'Match the request slip against every book’s index tag one by one', ex: 'Give every pair of words a relevance score — Lesson 8’s intuition that “the more aligned the directions, the more related” goes to work here' },
      { be: '÷ √d', act: 'The librarian presses all the scores down a bit', ex: 'Longer vectors naturally give bigger scores, so press them down first to keep one party from dominating the ratios and destabilizing training' },
      { be: 'softmax', act: 'Convert the matching results into “borrowing ratios” that sum to 100%', ex: 'Raw scores → a set of attention weights summing to 100% (the technical name for the “convert into ratios” action)' },
      { be: '· V', act: 'Copy content from each book by ratio and compile it into notes', ex: 'Mix all the Values by ratio — these “notes” are the word’s new representation' },
    ],
    qkvFootnote: 'Why split one word into three roles? Because “what I’m looking for” and “what I can offer” are often not the same thing: 「它」 most wants to find someone else (the subject), yet has very little of its own to offer. Only by separating Q and K can the model learn this asymmetric gaze.',

    lensSecTitle: '🎛️ Attention scope: click a word, see who it’s looking at',
    lensSecLead: 'Three sentences, yours to take apart. Click any word block and arcs reach out from it to every word in the sentence (including a small loop back to itself) — the thicker and darker the line, the greater the attention weight; a percentage is marked under each word, summing to 100%. Suggested play: first compare the 「苹果」 in the first two sentences, then go to the third sentence and click 「它」 to see, with your own eyes, the result of that “borrowing books at the library” trip just now.',

    headSecTitle: '🎭 Multi-head attention: dozens of editors, each marking their own highlights',
    headSecLead: 'One round of attention = one “view.” But the relationships worth noticing in language are far more than one kind: in syntax, who pairs with whom; in reference, who is whom; in semantics, who belongs with whom… One head can’t handle it all, so the vector is sliced into several parts and multiple “heads” run in parallel, each looking at its own thing — for example:',
    headCard1Label: 'Some heads · watch syntactic pairing',
    headCard1En: 'Who modifies whom',
    headCard1Zh: 'Which noun should 「新」 hook onto? Where are 「发布」’s subject and object? Heads like this build up the sentence’s skeleton.',
    headCard2Label: 'Some heads · watch reference',
    headCard2En: <>Who does 「它」 refer to</>,
    headCard2Zh: '「小猫追蝴蝶，它跑得飞快」 — heads like this are responsible for linking 「它」 heavily back to 「小猫」.',
    headCard3Label: 'Some heads · watch semantic association',
    headCard3En: 'Who belongs with whom',
    headCard3Zh: 'Which of 「苹果」, 「甜」, 「手机」 are close to which? Polysemous words mainly rely on heads like this to figure out which meaning they take this time.',
    headMidLead: <>Words fall short of hands-on. For the same sentence 「苹果发布了新手机，它很轻薄」, the three heads each draw their own lines — switch to see what the sentence looks like in each head’s eyes, then click “combined”:</>,
    headOutro: <>Each head independently runs one “score → convert into ratios → absorb,” each getting its own little notes, and in the end they’re <b>concatenated</b> and fused into the complete new representation. A GPT-class model often has dozens of heads per layer, stacked over dozens of layers — the number of times one sentence is “marked for what matters,” over and over, far exceeds any human reader.</>,
    headFootnote: 'Honest note: a head’s division of labor “grows” out of training on its own; no one prescribes that “head #3 handles reference.” Researchers merely observed, in post-hoc analysis, that quite a few heads do exhibit such clearly identifiable functions — while plenty of other heads’ functions remain something no one can make sense of to this day.',

    chatTitle: '📖 Going Deeper｜Inside ChatGPT: the “spark moments” you see are mostly attention at work',
    chatLead: 'First, remember one fact: when the model generates a reply, every new word it produces makes it run this lesson’s “scan” over the entire preceding content — your question, what it just said itself, small talk from dozens of turns ago, all on the list to be scored. Understand this, and many everyday experiences become explainable:',
    chatTableHead: ['What you see in ChatGPT / Claude', 'The attention mechanism behind it'],
    chatTableRows: [
      { be: 'Dozens of turns in, it still remembers the name you said at the start', ex: 'Generating each new word means scanning the entire history, so a name is one direct step away no matter how far back it is — as long as it hasn’t been pushed out of the context window (Lesson 17).' },
      { be: 'You say “expand on the second point from earlier,” and it knows what you mean', ex: 'A coreference head links 「the second point」 back to the corresponding earlier paragraph — the same skill as 「它」 linking back to 「小猫」, just over a longer span.' },
      { be: 'You paste half a snippet of code for it to continue, and the naming and indentation style stay consistent', ex: 'Each new word of the continuation absorbs, by ratio, the naming habits and formatting style of the preceding text — “style” is hidden in the distribution of attention weights.' },
      { be: 'The same word is understood differently when placed in different questions', ex: 'A contextualized representation is recomputed on the spot every time: when you ask about “Apple’s stock price” versus “an apple’s calories,” that 「苹果」 inside absorbs completely different neighbors.' },
    ],
    chatOutro: <>There’s also a depth easily overlooked: attention is <b>stacked layer upon layer</b>. In layer 1, 「苹果」 can only absorb information from its literal neighbors; by layer 5, the neighbors it absorbs have each already absorbed their own neighbors — information spreads like ripples; by layer 20, what it carries may be a paragraph-level understanding like “this whole passage is about a product launch.” Dozens of layers × dozens of heads per layer, one sentence marked for what matters hundreds of times — so-called “deep” understanding is built up exactly like this, layer by layer.</>,
    chatExEn: <>A small inference from a live conversation: <span className="hl">why “save the important words for last” often works</span></>,
    chatExZh: 'Although attention can connect across any distance directly, the weights are, after all, divided up — the longer the context, the thinner the attention each word gets. Putting key instructions at the beginning or end of the prompt, rather than buried in the middle, tends to make them more likely to “get marked.” The principle behind this prompting tip (the lost-in-the-middle phenomenon) will be covered specifically in Lessons 16 and 17.',

    limitTitle: '📖 Going Deeper｜Its limits: every pair of words must shake hands, and the bill grows by the square',
    limitLead: 'The price of the round table is the number of handshakes. Every word must score with every other word: a 10-word sentence needs 100 scorings, 100 words need 10,000, a 100,000-word document needs 10 billion — double the words, and the handshake bill quadruples. This is attention’s innate constitution, and also the three walls you can really feel in products:',
    limitCard1Label: 'A wall you feel ①',
    limitCard1En: <>The context window <b>has a ceiling</b></>,
    limitCard1Zh: 'It’s not that the model “doesn’t want to remember” — it’s that the handshake bill can’t be paid: double the window, and compute and memory roughly quadruple. The way every vendor frantically advertises “million-token long context” is, at its core, a fight against this square-law bill.',
    limitCard2Label: 'A wall you feel ②',
    limitCard2En: <>The longer you chat, the <b>slower and pricier</b></>,
    limitCard2Zh: 'Every new word generated must shake hands once with the entire history — the longer the conversation, the harder each step gets. APIs bill by the token, and the cost of long conversations climbing steeply is rooted here too.',
    limitCard3Label: 'The industry’s response',
    limitCard3En: <>An arms race to <b>“save handshakes”</b></>,
    limitCard3Zh: 'Shaking hands only with nearby words (sliding window), shaking hands only with key words (sparse attention), compressing old conversation into a summary… all sorts of “arts of cutting corners” keep emerging — all of them scrimping a budget out of the square-law bill.',
    limitExEn: <>A boundary reminder: attention <span className="hl">only moves things around, it doesn’t digest</span></>,
    limitExZh: 'What it does is “move related information together by ratio”; after the moving, the real processing — refining, transforming, remembering — is done by another component that follows each layer (the feed-forward network). Attention is the heart of a big model, but the heart isn’t the whole body. How the parts assemble into a complete Transformer — see you next lesson.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: 'The attention mechanism = human attention; the model is “consciously focusing”',
        good: 'It merely mixes information by similarity — a mechanical scoring-and-weighting process, with no consciousness and no subjective experience of “focusing”',
        why: <><b>Cause:</b> the name is too anthropomorphic. “Attention” is just a metaphor researchers borrowed from human cognition; the mechanism itself is this lesson’s three steps: score → convert into ratios → weighted absorption. Treating it as “the AI has grown a human-style attention” overestimates the model’s understanding of the world.</> },
      { bad: 'The model reads a sentence one word at a time, left to right, like a person',
        good: 'All words are processed in parallel at once; the order information of who comes first is added separately into the vector via “positional encoding”',
        why: <><b>Cause:</b> projecting your own reading habits onto the model. Attention treats the whole sentence equally and computes it in one pass — which is exactly the second selling point of this lesson’s “round table” demo: it can be massively parallelized on a GPU, far faster than the old word-by-word telephone method (the RNN). How is order actually added back? The next lesson, on the Transformer, reveals the answer.</> },
      { bad: 'Looking at one attention-weight diagram lets you explain “why the model answered this way”',
        good: 'The weights are just a tiny handful among hundreds of millions of intermediate computation values; whether “attention can serve as an explanation” is still hotly debated in the research community',
        why: <><b>Cause:</b> this lesson’s arc diagrams are so intuitive that it’s easy to imagine the model really has a “highlight list” in its head. In reality, between a single head’s weights and the final answer lie dozens of layers of mixing and rewriting — asserting the model’s “reasons” from one weight diagram is like writing a whole movie’s plot summary from a single frame of surveillance footage.</> },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. In 「苹果发布了新手机」 and 「这个苹果真甜」 — do the two 「苹果」 produce the same output at Lesson 8’s embedding layer? What about after the attention layer? Why?',
        a: <><b>The same at the embedding layer, different after the attention layer.</b> A static embedding gives one word one coordinate, so both 「苹果」 get the same vector; the attention layer makes each absorb its neighbors by ratio — one mainly absorbs 「发布」 and 「手机」, the other mainly absorbs 「甜」, yielding two different contextualized vectors. This is precisely why attention exists.</> },
      { q: '2. Use Q / K / V to break down a familiar scenario: you type 「附近的川菜馆」 into a search engine. What do Query, Key, and Value correspond to?',
        a: <><b>Query = your search terms</b> (what I’m looking for); <b>Key = each restaurant’s index info</b> (name, category, tags — how I can be searched for); <b>Value = the restaurant’s detail content</b> (what I actually offer). Scoring is the match between the search terms and each restaurant’s index. The difference: search engines tend to “take the top-ranked,” while attention “weights and mixes all Values by match score,” with everyone contributing a bit.</> },
      { q: '3. Since multi-head attention ends up concatenated anyway, why not just use one “super head” to compute it all at once?',
        a: <>One head can only learn <b>one way of looking at the sentence</b> at a time. Multiple heads run in parallel, each scoring in its own subspace: some learn syntactic pairing, some learn reference, some learn semantic association, and concatenated they complement each other’s viewpoints — like several editors each marking their own highlights then pooling them, capturing richer relationships than one editor marking everything with a single pen. This lesson’s “all three combined” demo is exactly this picture.</> },
      { q: '4. A friend complains: “Chatting with the AI to turn 200, its replies get slower and slower, and I hear the cost rises with conversation length — isn’t the server just bad?” Use this lesson’s “handshake bill” to clear the AI’s name.',
        a: <>It’s not the server’s fault, it’s attention’s nature: <b>every new word generated must shake hands and score with every word in the preceding text</b>. The longer the conversation, the more handshakes each step needs — and double the words, roughly quadruple the handshakes, so speed and cost worsen by the square. This is also the fundamental reason the context window has a ceiling (detailed in Lesson 17), and what every vendor’s “long context” race competes on is who can scrimp more out of this bill.</> },
    ],
  },
}

// ============================================================
// ① 传话游戏 vs 圆桌会议
// ============================================================
function RelayDemo({ c }) {
  const [mode, setMode] = useState('relay')
  const VIEW_W = 440, WORD_Y = 128, WORD_H = 36, GAP = 14, PCT_Y = 190
  const boxes = layout(RELAY_WORDS, VIEW_W, GAP, 20, 18)
  const m = c.relayMeta[mode]
  const maxA = Math.max(...RELAY_ATTN)

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.relayDemoTitle}</span>
        <span className="demo-hint">{c.relayDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="relay-svg" viewBox="0 0 440 200" width="420" aria-label={c.relayAria}>
            {mode === 'relay' ? (
              <>
                <text x={VIEW_W / 2} y="22" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{c.relayDotLabel}</text>
                {boxes.map((box, i) => (
                  <g key={'d' + i}>
                    <circle className="attn-arc" cx={box.cx} cy={WORD_Y - 56} r="10" fill="var(--terracotta)" fillOpacity={(DECAY[i] / 100).toFixed(2)} stroke="var(--terracotta)" strokeOpacity="0.5" />
                    <text x={box.cx} y={WORD_Y - 34} textAnchor="middle" fontSize="11" fontWeight={i === RELAY_FOCUS ? 700 : 500} fill={i === RELAY_FOCUS ? 'var(--terracotta)' : 'var(--fg-2)'}>{DECAY[i]}%</text>
                  </g>
                ))}
                {boxes.slice(0, -1).map((box, i) => {
                  const y = WORD_Y + WORD_H / 2
                  const x1 = box.x + box.w + 2, x2 = boxes[i + 1].x - 2
                  return (
                    <g key={'a' + i}>
                      <line className="attn-arc" x1={x1} y1={y} x2={x2 - 6} y2={y} stroke="var(--fg-2)" strokeWidth="2" />
                      <path className="attn-arc" d={`M ${x2 - 7} ${y - 5} L ${x2} ${y} L ${x2 - 7} ${y + 5} Z`} fill="var(--fg-2)" />
                    </g>
                  )
                })}
              </>
            ) : (
              <>
                {RELAY_ATTN.map((w, j) => {
                  const sw = (1 + w * 16).toFixed(1)
                  const op = Math.min(0.95, 0.2 + w * 1.6).toFixed(2)
                  const d = j === RELAY_FOCUS ? selfArc(boxes[j].cx, WORD_Y, 38)
                    : qArc(boxes[RELAY_FOCUS].cx, boxes[j].cx, WORD_Y, 32 + Math.abs(boxes[j].cx - boxes[RELAY_FOCUS].cx) * 0.32)
                  return <path key={j} className="attn-arc" d={d} fill="none" stroke="var(--sky)" strokeWidth={sw} strokeLinecap="round" opacity={op} />
                })}
                {boxes.map((box, j) => (
                  <text key={'p' + j} x={box.cx} y={PCT_Y} textAnchor="middle" fontSize="11" fontWeight={RELAY_ATTN[j] === maxA ? 700 : 500} fill={RELAY_ATTN[j] === maxA ? 'var(--fg-0)' : 'var(--fg-2)'}>{Math.round(RELAY_ATTN[j] * 100)}%</text>
                ))}
              </>
            )}
            {RELAY_WORDS.map((word, i) => {
              const box = boxes[i]
              const sel = i === RELAY_FOCUS
              return (
                <g key={'w' + i}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="9" fill={sel ? 'var(--accent)' : 'var(--bg-inset)'} stroke={sel ? 'var(--accent)' : 'var(--hairline-strong)'} strokeWidth="1.2" />
                  <text x={box.cx} y={WORD_Y + 24} textAnchor="middle" fontSize="15" fontWeight="600" fill={sel ? 'var(--on-accent)' : 'var(--fg-0)'}>{word}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.relayChips.map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{m.title}</h4>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 注意力透视镜
// ============================================================
function AttnLensDemo({ c }) {
  const [curKey, setCurKey] = useState('a')
  const [curIdx, setCurIdx] = useState(SENTS_BASE.a.defaultIdx)
  const VIEW_W = 440, WORD_Y = 152, WORD_H = 36, GAP = 14, PCT_Y = 208
  const sent = SENTS_BASE[curKey]
  const boxes = layout(sent.words, VIEW_W, GAP, 20, 18)
  const weights = sent.weights[curIdx]
  const maxW = Math.max(...weights)
  const ranked = weights.map((w, j) => ({ w, label: j === curIdx ? c.lensSelf : sent.words[j] })).sort((p, q) => q.w - p.w).slice(0, 3)

  const select = (key) => { setCurKey(key); setCurIdx(SENTS_BASE[key].defaultIdx) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.lensDemoTitle}</span>
        <span className="demo-hint">{c.lensDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="attn-svg" viewBox="0 0 440 224" width="420" aria-label={c.lensAria}>
            {weights.map((w, j) => {
              const sw = (1 + w * 16).toFixed(1)
              const op = Math.min(0.95, 0.2 + w * 1.6).toFixed(2)
              const d = j === curIdx ? selfArc(boxes[j].cx, WORD_Y, 40)
                : qArc(boxes[curIdx].cx, boxes[j].cx, WORD_Y, 36 + Math.abs(boxes[j].cx - boxes[curIdx].cx) * 0.34)
              return <path key={j} className="attn-arc" d={d} fill="none" stroke="var(--sky)" strokeWidth={sw} strokeLinecap="round" opacity={op} />
            })}
            {sent.words.map((word, i) => {
              const box = boxes[i]
              const sel = i === curIdx
              const strongest = weights[i] === maxW
              return (
                <g key={i} className="attn-word" tabIndex={0} role="button" aria-label={c.lensWordAria(word)}
                  onClick={() => setCurIdx(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurIdx(i) } }}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="9" fill={sel ? 'var(--accent)' : 'var(--bg-inset)'} stroke={sel ? 'var(--accent)' : 'var(--hairline-strong)'} strokeWidth="1.2" />
                  <text x={box.cx} y={WORD_Y + 24} textAnchor="middle" fontSize="15" fontWeight="600" fill={sel ? 'var(--on-accent)' : 'var(--fg-0)'}>{word}</text>
                  <text x={box.cx} y={PCT_Y} textAnchor="middle" fontSize="11" fontWeight={strongest ? 700 : 500} fill={strongest ? 'var(--fg-0)' : 'var(--fg-2)'}>{Math.round(weights[i] * 100)}%</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.lensChips.map(([k, label]) => (
              <button key={k} className={`chip${k === curKey ? ' active' : ''}`} onClick={() => select(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{c.lensWhoTitle(sent.words[curIdx])}</h4>
          <div className="period">{c.sentNames[curKey]}</div>
          <p>{c.sentDesc[curKey][curIdx]}</p>
          <div className="tags">{ranked.map((t, k) => <Pill key={k} type={k === 0 ? 'sage' : 'ink'}>{t.label} {Math.round(t.w * 100)}%</Pill>)}</div>
          <p className="footnote">{c.lensFootnote}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③ 多头注意力
// ============================================================
function MultiHeadDemo({ c }) {
  const [key, setKey] = useState('syntax')
  const VIEW_W = 480, WORD_Y = 150, WORD_H = 34, GAP = 10
  const boxes = layout(HEAD_WORDS, VIEW_W, GAP, 18, 16)
  const head = c.headMeta[key]

  const arcPaths = []
  const involved = {}
  const pushArcs = (arcs, color, thin) => {
    arcs.forEach((a, i) => {
      const x1 = boxes[a[0]].cx, x2 = boxes[a[1]].cx, w = a[2]
      const h = 26 + Math.abs(x2 - x1) * 0.3
      arcPaths.push({
        key: color + i + a[0] + a[1], d: qArc(x1, x2, WORD_Y, h), color,
        sw: ((thin ? 1 : 1.5) + w * (thin ? 4 : 5.5)).toFixed(1), op: (0.35 + w * 0.55).toFixed(2),
      })
    })
  }
  if (key === 'all') {
    ['syntax', 'coref', 'sem'].forEach((k) => pushArcs(HEADS_BASE[k].arcs, HEADS_BASE[k].color, true))
  } else {
    pushArcs(HEADS_BASE[key].arcs, HEADS_BASE[key].color, false)
    HEADS_BASE[key].arcs.forEach((a) => { involved[a[0]] = HEADS_BASE[key].color; involved[a[1]] = HEADS_BASE[key].color })
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.headDemoTitle}</span>
        <span className="demo-hint">{c.headDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="head-svg" viewBox="0 0 480 200" width="460" aria-label={c.headAria}>
            {arcPaths.map((p) => (
              <path key={p.key} className="attn-arc" d={p.d} fill="none" stroke={p.color} strokeWidth={p.sw} strokeLinecap="round" opacity={p.op} />
            ))}
            {HEAD_WORDS.map((word, i) => {
              const box = boxes[i]
              const hl = involved[i]
              return (
                <g key={i}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="8" fill="var(--bg-inset)" stroke={hl || 'var(--hairline-strong)'} strokeWidth={hl ? 1.8 : 1.2} />
                  <text x={box.cx} y={WORD_Y + 23} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--fg-0)">{word}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.headChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{head.title}</h4>
          <p>{head.desc}</p>
          <div className="tags">{head.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L09() {
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
            <div className="tag"><span className="pill pill-terracotta">{c.concept8Tag}</span></div>
            <div className="big">{c.concept8Big}</div>
            <p className="note">{c.concept8Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.conceptAttnTag}</span></div>
            <div className="big">{c.conceptAttnBig}</div>
            <p className="note">{c.conceptAttnNote}</p>
          </div>
        </div>
        <p className="lead mt">{c.conceptStepsLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.conceptTableHead[0]}</th><th>{c.conceptTableHead[1]}</th><th>{c.conceptTableHead[2]}</th></tr></thead>
            <tbody>
              {c.conceptTableRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td>{r.do}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt">{c.conceptOutro}</p>
      </Lsec>

      <Lsec title={c.whyTitle} lead={c.whyLead}>
        <RelayDemo c={c} />
        <p className="lead mt">{c.whyMid}</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">{c.whyCard1Label}</div>
            <div className="en">{c.whyCard1En}</div>
            <div className="zh">{c.whyCard1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.whyCard2Label}</div>
            <div className="en">{c.whyCard2En}</div>
            <div className="zh">{c.whyCard2Zh}</div>
          </div>
        </div>
        <p className="lead mt">{c.whyOutro}</p>
      </Lsec>

      <Lsec title={c.qkvTitle} lead={c.qkvLead}>
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">{c.qkvRole1Label}</div>
            <div className="en">{c.qkvRole1En}</div>
            <div className="zh">{c.qkvRole1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.qkvRole2Label}</div>
            <div className="en">{c.qkvRole2En}</div>
            <div className="zh">{c.qkvRole2Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.qkvRole3Label}</div>
            <div className="en">{c.qkvRole3En}</div>
            <div className="zh">{c.qkvRole3Zh}</div>
          </div>
        </div>
        <p className="lead mt">{c.qkvWalkLead}</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">{c.qkvStep1Label}</div>
            <div className="en">{c.qkvStep1En}</div>
            <div className="zh">{c.qkvStep1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.qkvStep2Label}</div>
            <div className="en">{c.qkvStep2En}</div>
            <div className="zh">{c.qkvStep2Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.qkvStep3Label}</div>
            <div className="en">{c.qkvStep3En}</div>
            <div className="zh">{c.qkvStep3Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.qkvStep4Label}</div>
            <div className="en">{c.qkvStep4En}</div>
            <div className="zh">{c.qkvStep4Zh}</div>
          </div>
        </div>
        <div className="example mt">
          <div className="en formula-line">{c.qkvFormula}</div>
          <div className="zh" style={{ textAlign: 'center' }}>{c.qkvFormulaZh}</div>
        </div>
        <div className="card mt">
          <table className="match">
            <thead><tr><th>{c.qkvTableHead[0]}</th><th>{c.qkvTableHead[1]}</th><th>{c.qkvTableHead[2]}</th></tr></thead>
            <tbody>
              {c.qkvTableRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td>{r.act}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote mt">{c.qkvFootnote}</p>
      </Lsec>

      <Lsec title={c.lensSecTitle} lead={c.lensSecLead}>
        <AttnLensDemo c={c} />
      </Lsec>

      <Lsec title={c.headSecTitle} lead={c.headSecLead}>
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">{c.headCard1Label}</div>
            <div className="en">{c.headCard1En}</div>
            <div className="zh">{c.headCard1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.headCard2Label}</div>
            <div className="en">{c.headCard2En}</div>
            <div className="zh">{c.headCard2Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.headCard3Label}</div>
            <div className="en">{c.headCard3En}</div>
            <div className="zh">{c.headCard3Zh}</div>
          </div>
        </div>
        <p className="lead mt">{c.headMidLead}</p>
        <MultiHeadDemo c={c} />
        <p className="lead mt">{c.headOutro}</p>
        <p className="footnote">{c.headFootnote}</p>
      </Lsec>

      <Lsec title={c.chatTitle} lead={c.chatLead}>
        <table className="match card">
          <thead><tr><th>{c.chatTableHead[0]}</th><th>{c.chatTableHead[1]}</th></tr></thead>
          <tbody>
            {c.chatTableRows.map((r, i) => (
              <tr key={i}><td className="be">{r.be}</td><td className="ex">{r.ex}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="lead mt">{c.chatOutro}</p>
        <div className="example mt">
          <div className="en">{c.chatExEn}</div>
          <div className="zh">{c.chatExZh}</div>
        </div>
      </Lsec>

      <Lsec title={c.limitTitle} lead={c.limitLead}>
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">{c.limitCard1Label}</div>
            <div className="en">{c.limitCard1En}</div>
            <div className="zh">{c.limitCard1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.limitCard2Label}</div>
            <div className="en">{c.limitCard2En}</div>
            <div className="zh">{c.limitCard2Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.limitCard3Label}</div>
            <div className="en">{c.limitCard3En}</div>
            <div className="zh">{c.limitCard3Zh}</div>
          </div>
        </div>
        <div className="example mt">
          <div className="en">{c.limitExEn}</div>
          <div className="zh">{c.limitExZh}</div>
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
