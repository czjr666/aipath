import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { createCosmos } from './viz/cosmos.js'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// 双语内容层：结构 / class / id / 交互 / 3D 坐标与数值均不变，仅可见文本按语言取用。
// 富文本以 JSX 片段存储，渲染输出与单语版逐字一致（不再使用 HTML 字符串）。
const C = {
  zh: {
    // ① 星空演示
    views: {
      all: { title: '整片星空 · 36 个词', desc: <>意思相近的词在空间里自动抱团，群落之间隔着大片“真空”。转一转就能体会：方位本身没有意义，有意义的只是相对距离。</> },
      animal: { title: '动物群落', desc: <>猫、狗、老虎、熊猫……它们总出现在相似的句子里（喂、养、毛茸茸、动物园），训练后被推进了同一片角落。</> },
      food: { title: '食物群落', desc: <>米饭和面条贴得最近，披萨、汉堡稍微偏向一侧 —— 真实模型里甚至能看出“中餐 / 西餐”的次级结构。</> },
      emotion: { title: '情感群落', desc: <>注意：「开心」和「悲伤」意思相反，距离却不远 —— 因为它们的语境几乎一样（“我感到 ____”）。embedding 度量的是语境相似，反义词常常是近邻。</> },
      job: { title: '职业群落', desc: <>医生、教师、律师……共享“上班、执照、职责”这类语境。真实空间里它们还会各自靠近自己的工作场所词：医生挨着医院，教师挨着学校。</> },
      relation: { title: '关系向量 · 两组平行箭头', desc: <>红色箭头都是“性别方向”（国王→女王、男人→女人、王子→公主），蓝色箭头都是“首都方向”（中国→北京、日本→东京、法国→巴黎）。关系 = 可以搬运的方向。</> },
    },
    analogy: { title: '国王 − 男人 + 女人 ≈ ？', desc: <>红色箭头 = 女人 − 男人，正是“性别”这层关系。把同一支箭头平移到「国王」头上，落点就在「女王」附近 —— 关系像积木一样可以搬运、相加。</> },
    cosmosKeys: { all: '全部', animal: '动物', food: '食物', emotion: '情感', job: '职业', relation: '关系向量' },
    fallback: '3D 演示未能加载（浏览器不支持 WebGL，或资源加载失败）。文字版结论照样成立：36 个词按语义聚成 6 个群落 —— 动物、食物、情感、职业各自抱团；而「男人→女人」与「国王→女王」两支箭头互相平行，「中国→北京」与「日本→东京」也互相平行。把「女人 − 男人」这支箭头加到「国王」上，落点就在「女王」附近。',
    cosmosFallTitle: '3D 演示未能加载',
    cosmosDemoTitle: '🌌 交互演示 · 漫游词向量空间',
    cosmosDemoHint: '拖动旋转 · 滚轮缩放 · 点胶囊高亮群落',
    cosmosAria: '3D 词向量星空：36 个中文词按语义聚成动物、食物、情感、职业等群落，可旋转缩放',
    cosmosPlay: '▶ 演示：国王 − 男人 + 女人',

    // ② 训练步进
    trainWord: { 猫: '猫', 狗: '狗', 兔子: '兔子', 老虎: '老虎', 米饭: '米饭', 面条: '面条', 饺子: '饺子', 披萨: '披萨', 开心: '开心', 难过: '难过' },
    trainSteps: [
      { t: '第 0 轮 · 出生即混乱', d: <>训练开始前，每个词领到的是纯随机坐标：「猫」挨着「面条」，「开心」漂在「老虎」旁边。模型此刻对语言一无所知 —— 点「训练一步」，开始做填空题。</> },
      { t: '第 1 轮 ·「____ 在沙发上打盹」', d: <>这类句子的空格里，猫、狗、兔子都常是标准答案。每做一题，就把“可以互换”的词往彼此身边推一小步 —— 注意三只小动物开始变色、靠拢。</> },
      { t: '第 2 轮 ·「来一碗热腾腾的 ____」', d: <>米饭、面条、饺子总和“碗、热、吃”作伴，被推进了同一片区域。没有谁定义过“食物”这个类别 —— 类别是统计出来的。</> },
      { t: '第 3 轮 ·「考完试我特别 ____」', d: <>开心和难过都能填进“我特别 ____”，语境几乎一样，于是被推到一起 —— 这正是反义词常常是近邻的原因：embedding 度量的是语境相似，不是褒贬。</> },
      { t: '第 4 轮 ·「动物园新来了一只 ____」', d: <>老虎归队。它前几轮“掉队”，只因出现频率低、轮到它的题少 —— 罕见词的坐标天生学得更慢、更不准。</> },
      { t: '第 5 轮 ·「____ 趁热吃，配可乐绝了」', d: <>披萨滑进食物区。三个群落边界已清晰可见 —— 而我们做的只是反复填空、错了就推一把。</> },
      { t: '第 6 轮 · 亿万道题做完', d: <>群落自己浮现了 —— 这就是“坐标不是人标的”的完整含义：聚类是统计的副产品。真实训练是几十亿句话、几百维坐标、万亿次做题，但原理与你刚才看到的一模一样。</> },
    ],
    trainDemoTitle: '🧪 交互演示 · 亲手把坐标“推”出来',
    trainDemoHint: '点「训练一步」· 看群落自己浮现',
    trainAria: '训练演示：十个词从随机位置出发，随训练轮次逐步聚成动物、食物、情感三个群落',
    trainStep: '▶ 训练一步',
    trainAll: '⏩ 一键训完',
    trainReset: '⟲ 重置',
    trainErr: '猜错程度',

    // ③ 苹果语境
    appleTxt: {
      none: { t: '静态词向量的困境', d: <>word2vec 给每个词只发一张“身份证”。「苹果」只能卡在水果区和科技区中间的尴尬地带 —— 哪边都沾点，哪边都不像。一词多义，被压扁成了平均值。</> },
      fruit: { t: '上下文把它拽进水果区', d: <>在大模型内部，「苹果」先查表领到初始向量，随后被「甜」「两斤」这些邻居一层层修正 —— 整句读完，它已经漂进水果群落。这就是语境化向量：“活”的坐标。</> },
      tech: { t: '同一个词，另一个灵魂', d: <>换个句子，「发布」「手机」把同一个「苹果」拽向科技区。至于每个词究竟如何“参考”周围的词来更新自己 —— 那正是下一课注意力机制的全部剧情。</> },
    },
    appleDot: { 香蕉: '香蕉', 桃子: '桃子', 甜: '甜', 手机: '手机', 电脑: '电脑', 发布会: '发布会' },
    appleWord: '苹果',
    ctxDemoTitle: '🍎 交互演示 · 同一个「苹果」，两个灵魂',
    ctxDemoHint: '点句子 · 看上下文拽动坐标',
    ctxAria: '语境演示：左侧水果群落、右侧科技群落，「苹果」的点随所选句子在两个群落之间移动',
    ctxFruitCluster: '水果群落',
    ctxTechCluster: '科技群落',
    ctxKeys: { none: '「苹果」孤零零一个词', fruit: '「苹果真甜，再买两斤」', tech: '「苹果发布了新款手机」' },

    // 正文
    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话说清什么是 embedding：给每个词在空间里安排一个坐标，意思越近、坐得越近</>,
      <>看懂明星算式 国王 − 男人 + 女人 ≈ 女王 —— 词与词的“关系”也变成了方向一致的箭头</>,
      <>分清示意与真相：真实向量是几百到几千维的，而且坐标不是人标的，是模型自己学出来的</>,
      <>亲手“训练”一次：在交互演示里看坐标怎么被亿万道填空题一步步推出来</>,
      <>看清 embedding 在 ChatGPT 体内的位置：第一站查表领坐标，随后被上下文层层改写成“活”向量</>,
      <>知道“万物皆可 embedding”：语义搜索、推荐系统、RAG 检索共用的同一块地基</>,
    ],

    conceptTitle: '💡 核心概念：把词钉进空间，“意思”第一次能算了',
    conceptLead: '上一课 CNN 吃的是像素 —— 图片天生就是数字。可文字不是：计算机看「猫」这个字，只看到一个字符编号，编号挨着的两个字意思可以毫不相干。Embedding（嵌入）干的事就一件：给每个词在一个空间里安排一个坐标点，并且保证 —— 意思越近的词，坐得越近。这个坐标，就是这个词的 embedding。',
    humanTag: '人类的方式 · 查词典',
    humanBig: <>「猫」= <span className="gap">“一种哺乳动物，善捕鼠，会喵喵叫……”</span></>,
    humanNote: '用别的词解释这个词，循环不止：查“哺乳动物”又得查“哺乳”。计算机读完整本词典，仍然算不出“猫”和“狗”到底有多像。',
    machineTag: '机器的方式 · 给坐标',
    machineBig: <>「猫」= <span className="hl">(0.82, −1.30, 2.41, …)</span></>,
    machineNote: '一个词 = 空间里的一个点。“像不像”不需要任何解释 —— 量一下两点之间的距离就行，距离是小学就会算的东西。',
    distEn: <><span className="hl">距离 = 语义相似度</span>，这是本课唯一要背下来的等式</>,
    distZh: <>猫和狗离得近，猫和披萨离得远，猫和“民法典”几乎在两个星系。意义（meaning）这种最虚无缥缈的东西，<b>第一次变成了可以计算的对象</b> —— 后面的注意力、Transformer、第 18 课的 RAG，全部踩在这块地基上。</>,
    conceptTail: '所以当你给 ChatGPT 发一句话时，它做的第一件事不是“读”，而是把每个词换成这样一串数字 —— 词先变成向量，神经网络才有的吃。Embedding 是文字世界和数字世界之间唯一的海关。',

    formulaTitle: '🧭 明星算式：国王 − 男人 + 女人 ≈ 女王',
    formulaLead: '坐标既然是数字，就能加减。2013 年 word2vec 论文里的一个发现让全世界惊掉下巴：对词向量做小学算术，结果居然有意义。',
    formula: <>国王 <span className="op">−</span> 男人 <span className="op">+</span> 女人 <span className="op">≈</span> <span className="res">女王</span></>,
    formulaZh: <>人话拆解：<b>女人 − 男人</b> 这两点之间的箭头，捕捉到的正是“性别”这层关系；把这支箭头原样平移到「国王」头上，落点离「女王」最近。换句话说 —— <b>词与词的“关系”，在这个空间里是一个可以搬运的方向。</b></>,
    formulaP1: <>更妙的是，同一种关系对应的箭头是<b>互相平行</b>的：所有“性别箭头”指向一致，所有“首都箭头”指向一致。模型没人教过它什么叫首都，但“首都关系”作为一个方向，自己浮现在了空间里。</>,
    formulaTableHead: ['关系', '箭头 A', '箭头 B', '几何特征'],
    formulaRows: [
      ['性别', '男人 → 女人', '国王 → 女王', '方向近似平行'],
      ['首都', '中国 → 北京', '日本 → 东京', '方向近似平行'],
      ['时态（英文语料）', 'walk → walked', 'go → went', '方向近似平行'],
    ],
    formulaP2: <>一句校准：注意算式里是 <b>≈ 不是 =</b>。这种类比在真实模型里“经常成立、并不保证”，研究者也发现不少例子要靠排除原词等小技巧才漂亮。把它当直觉的窗口，别当数学定理。</>,

    clarifyTitle: '🔬 两个关键澄清：别被星空图骗了',
    clarifyLead: '下面马上要看 3D 演示，但先打两针预防针 —— 这两点恰恰是 embedding 最容易被误解的地方。',
    clarify1Label: '澄清一 · 关于维度',
    clarify1En: <>3D 星空只是<b>降维示意</b></>,
    clarify1Zh: <>真实 embedding 通常是<b>几百到几千维</b>：word2vec 时代常用 300 维，如今大模型内部的词向量普遍上千维。维度高，才装得下一个词的多重身份 ——「苹果」要同时靠近水果、手机和“红色”。任何 3D 图都像把地球仪压成平面地图：方便看，必有失真。</>,
    clarify2Label: '澄清二 · 关于来历',
    clarify2En: <>坐标<b>不是人标的</b>，是学出来的</>,
    clarify2Zh: <>没有任何语言学家给“猫”填过坐标。模型在海量文本里反复做“预测邻居词”的填空题，用第 4 课的梯度下降把猜错的程度一点点压低 —— <b>谁总出现在相似的语境里，谁的坐标就被一点点推近</b>。全自动，零人工标注，坐标只是训练的副产品。</>,
    firthEn: '“看一个词总跟谁作伴，你就懂了它。” —— 语言学家 J.R. Firth，1957',
    firthZh: <>这叫<b>分布假设</b>。“猫”和“狗”都能填进“____ 在沙发上睡觉”“带 ____ 去打疫苗”，于是它们被推到一起。Embedding 学到的“意思”，本质是亿万条语境的统计压缩。</>,

    cosmosSecTitle: '🎛️ 交互演示：词向量星空',
    cosmosSecLead: '下面是一片手工设计的 3D 教学星空：36 个中文词、6 个语义群落。拖动旋转、滚轮缩放，先看“抱团”，再点红色按钮看类比算式动起来。',
    cosmosSecTail: '再次提醒：这些坐标是作者为教学手工摆放的 3D 示意。真实模型里它们是几百上千维、由训练自动确定的 —— 但“近 = 像、关系 = 方向”这两条直觉，原封不动地成立。',

    trainSecTitle: '📖 深入展开｜坐标是怎么被“推”出来的：一道做了亿万遍的填空题',
    trainSecLead: '前面反复说“坐标是学出来的”，这一节把“学”字拆开看。你会发现整个过程朴素得近乎离谱：模型从头到尾只在做一件事 —— 填空题。没有语言学家参与，没有人批改过一份“语义标准答案”。',
    trainCardA: { label: '是什么 · 一句话', en: <>训练 = 亿万道<b>填空题</b></>, zh: <>把一句正常的话挖掉一个词 ——「猫在沙发上 ____」—— 让模型用周围的词去猜被挖掉的是什么。word2vec 干的就是这件事；今天大模型预训练的“猜下一个词”（第 12 课），是同一招的放大版。</> },
    trainCardB: { label: '为什么非它不可', en: <>因为“意思”<b>没法人工标</b></>, zh: <>汉语几十万词，每个词上千个坐标值，没有任何团队填得完；更要命的是，“意思”本来就没有标准答案，唯一可靠的线索是<b>用法</b>。而互联网恰好免费提供了亿万句“自带答案的填空题”—— 一个标注员都不用雇。</> },
    trainStepLead: '它如何一步步工作？只有四步，第 4 课的梯度下降在这里重新登场：',
    trainSteps4: [
      { label: '第 1 步', en: <>随机撒点</>, zh: <>训练开始时，每个词领到一串纯随机数字。此刻「猫」可能紧挨着「民法典」—— 空间一片混沌，模型对语言一无所知。</> },
      { label: '第 2 步', en: <>做题：用邻居猜空格</>, zh: <>读到「猫在沙发上打盹」，遮住「猫」，让模型拿“沙发”“打盹”的坐标去猜空格 —— 它会给词表里每个词打一个“像不像答案”的分。</> },
      { label: '第 3 步', en: <>错了就推一把</>, zh: <>猜错了，就顺着“哪里错了”回头修改坐标：把正确答案往这个语境拉近一点，把瞎猜的词推远一点。每次只动一点点 —— 正是第 4 课下山的那一小步。</> },
      { label: '第 4 步', en: <>重复亿万次</>, zh: <>「猫」和「狗」总出现在同款语境里，于是被一次次推向同一片区域。群落、性别箭头、首都箭头 —— 全是这个笨办法攒出来的副产品。</> },
    ],
    trainDemoLead: '空说无凭，下面亲手“训练”一次。十个词从随机位置出发，每点一次「训练一步」，就相当于做完一大批填空题 —— 盯住灰点怎么变色、归队：',
    trainDeadEn: <>这个办法的死穴：<span className="hl">一个词只有一个点</span></>,
    trainDeadZh: <>「苹果真甜」和「苹果发布会」里的“苹果”明明是两个意思，老式词向量却只能发给它一个坐标 —— 多义词被压扁成了平均值。另外，语料里的偏见也会原样压进空间：如果文本里“医生”总和“他”作伴，空间里就会留下这道歪箭头。多义的难题怎么破？接着往下看 —— 这正是大模型对老词向量的关键跃迁。</>,

    bodySecTitle: '📖 深入展开｜在 ChatGPT 体内：embedding 是第一站，而且是“活”的',
    bodySecLead: 'word2vec 是 2013 年的技术，为什么今天用 ChatGPT、Claude 的你还必须懂它？因为每个大模型体内都装着它的继承者，而且完成了一次关键升级：坐标从“死”的变成了“活”的。先看它在大模型流水线里的位置 ——',
    pipeCards: [
      { label: '入口 · 第一站', en: <>每个 token 先<b>查表领坐标</b></>, zh: <>你发出的话先被切成 token（第 11 课细讲），模型做的第一件事就是到体内那张 embedding 表里，把每个 token 换成一个向量。从这一刻起，所有计算只见数字，再也见不到文字。</> },
      { label: '中段 · 几十层“调味”', en: <>向量被上下文<b>不断改写</b></>, zh: <>查表领到的只是“字典义”。接下来几十层注意力（下一课）让每个词的向量参考周围的词反复修正 —— 整句读完，「苹果」可能已被「发布会」拽进科技区。这叫<b>语境化向量</b>，是大模型与 word2vec 的分水岭。</> },
      { label: '出口 · 还是比距离', en: <>生成回答也靠<b>这片空间</b></>, zh: <>模型吐下一个词时，本质是拿当前语境的向量去和词表里所有候选词比“匹配度”—— 谁匹配谁概率大（怎么按概率抽签，第 14 课讲）。大模型的一进一出，都发生在向量空间里。</> },
    ],
    ctxSecLead: '“活”坐标长什么样？下面这个演示里，「苹果」的位置不再固定 —— 点不同的句子，看上下文把它拽向哪边：',
    ctxSecTail: '懂了“查表 + 改写”这条流水线，你平时在 ChatGPT / Claude 里看到的很多“灵性瞬间”就都有了解释 ——',
    phenomTableHead: ['你看到的现象', '背后的向量空间机制'],
    phenomRows: [
      { a: '换种说法问，它照样懂', b: <>「怎么退货」和「如何申请退款」字面几乎不重合，向量却近乎重合 —— 模型理解的是空间里的<b>位置</b>，不是字面。</> },
      { a: '打错字也大多能猜对', b: <>「机器学系是什么」—— 上下文会把错字的向量“拉回”正确语义附近：邻居词决定了它落进哪个群落。</> },
      { a: '中文提问，能用上英文世界的知识', b: <>多语言训练把「猫」和 cat 嵌到了几乎同一个点 —— 知识挂在位置上，不挂在语种上。</> },
      { a: '接上知识库就能答内部问题', b: <>RAG：把公司文档切块算成向量入库，提问时按距离捞最近的几块塞给模型 —— 第 18 课带你亲手搭。</> },
    ],
    boundEn: <>边界提醒：距离近 = <span className="hl">语境像</span>，不等于“事实对”</>,
    boundZh: <>「我爱你」和「我恨你」的向量相当近 —— 句式、场景几乎一样。所以语义检索偶尔会捞回“长得像但答非所问”的段落；向量空间也分不清真话和谣言，它压缩的是语言的统计规律，不是世界的真相。这条边界，第 18 课（RAG 的坑）和第 29 课（幻觉与评估）还会反复用到。</>,

    everySecTitle: '🌐 万物皆可 embedding',
    everySecLead: '这套“压成向量、按距离办事”的思路完全不挑对象。只要能定义“谁和谁应该相近”，任何东西都能被嵌进同一种空间 —— 这正是它成为现代 AI 基础设施的原因。',
    everyCards: [
      { label: '不止是词', en: <>句子与文档 <b>→ 一个点</b></>, zh: <>整段话也能压成一个向量：“今天股市大跌”和“A 股全线重挫”用词不同，点却紧挨着 —— 比对关键词的老办法看不出这层关系。</> },
      { label: '跨越媒介', en: <>图片与文字 <b>→ 同一空间</b></>, zh: <>CLIP 这类模型把图和文嵌进同一片空间：“一只奔跑的狗”这句话的点，就挨着狗狗照片的点。以文搜图、以图搜图由此而来。</> },
      { label: '连人也可以', en: <>用户与商品 <b>→ 同一空间</b></>, zh: <>推荐系统把你的口味和千万件商品放进一个空间，你的点附近漂着什么，首页就给你推什么 —— “猜你喜欢”猜的其实是距离。</> },
    ],
    appTableHead: ['应用', '怎么用“距离”办事'],
    appRows: [
      { a: '语义搜索', b: <>搜“便宜的住处”，能命中“经济型酒店” —— 关键词一个不重合，向量距离却很近。搜索从“对字”升级为“对意思”。</> },
      { a: '推荐 / 去重', b: <>把你听过的歌变成向量求平均，附近的歌就是新歌单；两篇新闻向量几乎重合，就是洗稿或重复，自动归并。</> },
      { a: 'RAG 检索', b: <>公司文档切块、向量化入库；你提问时，先按距离捞出最相关的几块，再喂给大模型作答 —— 完整流程第 18 课拆给你看。</> },
    ],
    everyTail: <>业界甚至把这件事做成了独立的产品形态：专门的 <b>embedding 模型</b>（输入文字、吐出向量，不聊天）和<b>向量数据库</b>（专门按距离检索的仓库）。第 18、28 课，你会亲手把这两块积木拼成一个能回答内部问题的系统 —— 到那时回头看，会发现整套系统的灵魂就是本课这一句：距离 = 语义相似度。</>,

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: <>每个维度都有明确含义，比如第 7 维代表“性别”、第 42 维代表“大小”</>, good: <>绝大多数维度没有人能读懂的含义，“性别”这类概念散落在几百个维度的组合方向里</>, why: <><b>病因：</b>把 embedding 想象成一张人设计的表格 —— 身高一栏、性别一栏。实际上坐标系是训练自动形成的，单独抽出某一维看，几乎全是噪声；像“性别方向”这种可解释的箭头，是研究者<b>事后</b>从整体里挖出来的维度组合，不是某一根坐标轴。</> },
      { bad: <>embedding 是查一本巨大的“词→数字”词典查出来的固定数值</>, good: <>它是模型在海量文本上训练出来的统计产物 —— 换一批语料、换一个模型，坐标就完全不同</>, why: <><b>病因：</b>“词变数字”听起来像查表。早期 word2vec 训练完确实能存成一张静态表，但表里的数值是<b>学</b>出来的，不是谁规定的；而现代大模型里，同一个词的向量还会随上下文实时变化 ——「苹果发布会」和「苹果真甜」里的“苹果”不是同一个点，怎么变的，正是下一课注意力机制的故事。</> },
      { bad: <>两句话向量距离近，说明它们意思相同、内容可信</>, good: <>距离近只说明“语境相似”—— 反义句、立场相反的句子常常是近邻</>, why: <><b>病因：</b>把“语义相似度”听成了“等价”。embedding 来自“看谁总出现在同款语境”，而「股价大涨」和「股价大跌」恰恰共享同款语境，距离反而很近。做语义搜索和 RAG 时务必记住这一条 —— 否则会把“看起来像”的错误答案当成正确答案。</> },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 用本课的概念解释：为什么在向量搜索里，搜“便宜的住处”能找到“经济型酒店”，哪怕两句话没有一个字相同？', a: <>因为搜索比对的不是文字而是 <b>embedding 之间的距离</b>。“便宜的住处”和“经济型酒店”在海量文本里出现的语境高度相似（订房、价格、评价……），训练后它们的向量被推得很近 —— 距离近就会被检索出来，字面重不重合根本不参与计算。</> },
      { q: '2. 仿照明星算式做一道题：巴黎 − 法国 + 日本 ≈ ？，并说出每一步在“搬运”什么。', a: <><b>≈ 东京。</b>「巴黎 − 法国」这支箭头捕捉的是“首都”关系；把它平移加到「日本」上，落点自然在「东京」附近 —— 和性别箭头一样，首都箭头在空间里也是近似平行的。</> },
      { q: '3. 朋友兴奋地说：“我发现模型向量的第 42 维存的就是词的褒贬！”这个说法有什么问题？', a: <>问题在于<b>把“方向”当成了“坐标轴”</b>。绝大多数单个维度不可解读，褒贬这类语义通常是几百个维度的组合方向；就算他真在数据里找到了一个与褒贬相关的方向，那也是事后挖掘的产物，且换个模型、换批语料就会变 —— 没有任何机制保证它恰好落在第 42 根轴上。</> },
      { q: '4. 在 word2vec 里「苹果」只有一个固定向量，在 ChatGPT 这类大模型里它却“会动”。用本课概念解释这个区别，并说明“动”的动力来自哪里。', a: <>word2vec 是<b>静态词向量</b>：一词一点，「苹果」的水果义和公司义被压成一个平均位置。大模型里 token 先查 embedding 表领到初始向量，随后被几十层网络按上下文反复改写成<b>语境化向量</b> ——「苹果真甜」里它漂向水果群落，「苹果发布会」里漂向科技群落。“动力”来自周围的词：每个词参考邻居来更新自己，至于具体怎么参考，就是下一课注意力机制的内容。</> },
    ],
  },

  en: {
    // ① Cosmos demo
    views: {
      all: { title: 'The whole cosmos · 36 words', desc: <>Words with similar meanings cluster on their own, with vast stretches of "vacuum" between clusters. Spin it around and you’ll feel it: orientation itself means nothing; only relative distance carries meaning.</> },
      animal: { title: 'Animal cluster', desc: <>cat, dog, tiger, panda… they keep showing up in similar sentences (feed, raise, fluffy, zoo), so after training they get pushed into the same corner.</> },
      food: { title: 'Food cluster', desc: <>rice and noodles sit closest together; pizza and burger lean slightly to one side — a real model can even reveal a sub-structure of "Chinese cuisine / Western cuisine."</> },
      emotion: { title: 'Emotion cluster', desc: <>Note: "happy" and "sad" are opposite in meaning, yet not far apart — because their contexts are nearly identical ("I feel ____"). Embedding measures contextual similarity, so antonyms are often near neighbors.</> },
      job: { title: 'Occupation cluster', desc: <>doctor, teacher, lawyer… share contexts like "go to work, license, duties." In a real space they’d each also sit near their workplace words: doctor next to hospital, teacher next to school.</> },
      relation: { title: 'Relation vectors · two sets of parallel arrows', desc: <>The red arrows are all the "gender direction" (king→queen, man→woman, prince→princess); the blue arrows are all the "capital direction" (China→Beijing, Japan→Tokyo, France→Paris). A relation = a direction you can carry around.</> },
    },
    analogy: { title: 'king − man + woman ≈ ?', desc: <>The red arrow = woman − man, which is exactly the "gender" relation. Translate that same arrow onto "king" and the landing point lands right near "queen" — relations can be carried around and added, like building blocks.</> },
    cosmosKeys: { all: 'All', animal: 'Animals', food: 'Food', emotion: 'Emotions', job: 'Occupations', relation: 'Relation vectors' },
    fallback: 'The 3D demo failed to load (your browser lacks WebGL support, or assets failed to load). The text version of the conclusion still holds: 36 words cluster by meaning into 6 groups — animals, food, emotions, occupations each huddle together; and the "man→woman" and "king→queen" arrows are parallel to each other, as are "China→Beijing" and "Japan→Tokyo." Add the "woman − man" arrow onto "king" and the landing point is right near "queen."',
    cosmosFallTitle: 'The 3D demo failed to load',
    cosmosDemoTitle: '🌌 Interactive · Roam the Word-Vector Cosmos',
    cosmosDemoHint: 'Drag to rotate · scroll to zoom · tap a chip to highlight a cluster',
    cosmosAria: '3D word-vector cosmos: 36 words clustered by meaning into animals, food, emotions, occupations and more; rotatable and zoomable',
    cosmosPlay: '▶ Demo: king − man + woman',

    // ② Training stepper
    trainWord: { 猫: 'cat', 狗: 'dog', 兔子: 'rabbit', 老虎: 'tiger', 米饭: 'rice', 面条: 'noodles', 饺子: 'dumpling', 披萨: 'pizza', 开心: 'happy', 难过: 'sad' },
    trainSteps: [
      { t: 'Round 0 · Chaos from birth', d: <>Before training starts, every word is handed purely random coordinates: "cat" sits next to "noodles," "happy" drifts beside "tiger." The model knows nothing about language at this moment — click "Train one step" to start the fill-in-the-blank quiz.</> },
      { t: 'Round 1 · "____ is napping on the sofa"', d: <>For blanks in sentences like this, cat, dog, and rabbit are all common right answers. With each problem, words that are "interchangeable" get nudged a little closer — watch the three little animals start changing color and drawing together.</> },
      { t: 'Round 2 · "A piping-hot bowl of ____"', d: <>rice, noodles, and dumpling always keep company with "bowl, hot, eat," so they get pushed into the same region. No one ever defined the category "food" — the category is a statistical product.</> },
      { t: 'Round 3 · "After the exam I felt really ____"', d: <>both happy and sad can fill in "I felt really ____," with near-identical context, so they get pushed together — exactly why antonyms are often near neighbors: embedding measures contextual similarity, not positive/negative sentiment.</> },
      { t: 'Round 4 · "The zoo just got a new ____"', d: <>tiger rejoins the group. It "lagged behind" in earlier rounds only because it appears infrequently and few problems involve it — rare words inherently learn their coordinates more slowly and less accurately.</> },
      { t: 'Round 5 · "Eat the ____ while it’s hot; with cola it’s amazing"', d: <>pizza slides into the food zone. The three clusters’ boundaries are now clearly visible — and all we did was fill in blanks over and over, nudging things whenever we got one wrong.</> },
      { t: 'Round 6 · Billions of problems done', d: <>the clusters emerged on their own — this is the full meaning of "coordinates aren’t labeled by humans": clustering is a byproduct of statistics. Real training is billions of sentences, hundreds of dimensions, and trillions of problems, but the principle is exactly what you just saw.</> },
    ],
    trainDemoTitle: '🧪 Interactive · Push the Coordinates Out by Hand',
    trainDemoHint: 'Click "Train one step" · watch the clusters emerge on their own',
    trainAria: 'Training demo: ten words start from random positions and gradually cluster into animals, food, and emotions over training rounds',
    trainStep: '▶ Train one step',
    trainAll: '⏩ Train all at once',
    trainReset: '⟲ Reset',
    trainErr: 'How wrong the guess is',

    // ③ Apple context
    appleTxt: {
      none: { t: 'The plight of static word vectors', d: <>word2vec issues each word only a single "ID card." "Apple" can only get stuck in the awkward zone between the fruit area and the tech area — it touches both, fits neither. Polysemy gets flattened into an average.</> },
      fruit: { t: 'Context drags it into the fruit area', d: <>Inside a large model, "apple" first looks up the table to get an initial vector, then gets revised layer by layer by neighbors like "sweet" and "two pounds" — by the time the whole sentence is read, it has drifted into the fruit cluster. This is the contextualized vector: a "living" coordinate.</> },
      tech: { t: 'Same word, another soul', d: <>Switch the sentence, and "launch" and "phone" drag the very same "apple" toward the tech area. As for exactly how each word "refers to" its neighbors to update itself — that’s the entire plot of the next lesson’s attention mechanism.</> },
    },
    appleDot: { 香蕉: 'banana', 桃子: 'peach', 甜: 'sweet', 手机: 'phone', 电脑: 'computer', 发布会: 'launch event' },
    appleWord: 'apple',
    ctxDemoTitle: '🍎 Interactive · The Same "Apple," Two Souls',
    ctxDemoHint: 'Tap a sentence · watch context drag the coordinate',
    ctxAria: 'Context demo: a fruit cluster on the left, a tech cluster on the right; the "apple" point moves between the two clusters depending on the chosen sentence',
    ctxFruitCluster: 'Fruit cluster',
    ctxTechCluster: 'Tech cluster',
    ctxKeys: { none: '"apple" all by itself', fruit: '"The apple is so sweet, buy two more pounds"', tech: '"Apple launched a new phone"' },

    // Body
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>Explain in one sentence what an embedding is: give every word a coordinate in a space, where closer meaning means closer seating</>,
      <>Read the famous equation king − man + woman ≈ queen — the "relation" between words also becomes arrows pointing the same way</>,
      <>Tell the illustration from the truth: real vectors have hundreds to thousands of dimensions, and the coordinates aren’t labeled by humans — the model learns them itself</>,
      <>"Train" one yourself: in an interactive demo, watch how coordinates get pushed out, one step at a time, by billions of fill-in-the-blank problems</>,
      <>See where embedding sits inside ChatGPT: the first stop is a table lookup for coordinates, then context rewrites them layer by layer into "living" vectors</>,
      <>Know that "everything can be embedded": semantic search, recommendation systems, and RAG retrieval share the very same foundation</>,
    ],

    conceptTitle: '💡 Core Idea: Pin Words Into a Space, and "Meaning" Becomes Computable for the First Time',
    conceptLead: 'Last lesson the CNN ate pixels — images are inherently numbers. But text isn’t: when a computer looks at the character "cat," it only sees a character code, and two adjacent codes can mean utterly unrelated things. Embedding does just one thing: assign every word a coordinate point in a space, and guarantee that — the closer two words are in meaning, the closer they sit. That coordinate is the word’s embedding.',
    humanTag: 'The human way · look it up in a dictionary',
    humanBig: <>"cat" = <span className="gap">"a mammal, good at catching mice, goes meow…"</span></>,
    humanNote: 'Explaining a word with other words loops forever: look up "mammal" and you have to look up "mammary." A computer can read the entire dictionary and still not compute just how similar "cat" and "dog" really are.',
    machineTag: 'The machine way · give it coordinates',
    machineBig: <>"cat" = <span className="hl">(0.82, −1.30, 2.41, …)</span></>,
    machineNote: 'One word = one point in a space. "How similar" needs no explanation at all — just measure the distance between two points, and distance is something you learned to compute in grade school.',
    distEn: <><span className="hl">distance = semantic similarity</span> — the one equation you must memorize this lesson</>,
    distZh: <>cat and dog are close, cat and pizza are far, and cat and "civil code" are practically in two different galaxies. Meaning, the most ethereal thing of all, <b>becomes a computable object for the first time</b> — the attention, Transformer, and Lesson 18’s RAG to come all stand on this foundation.</>,
    conceptTail: 'So when you send ChatGPT a sentence, the first thing it does isn’t "read" — it turns each word into a string of numbers like this. Words become vectors first, only then can the neural network eat them. Embedding is the one and only customs checkpoint between the world of text and the world of numbers.',

    formulaTitle: '🧭 The Famous Equation: king − man + woman ≈ queen',
    formulaLead: 'Since coordinates are numbers, you can add and subtract them. A finding in the 2013 word2vec paper dropped jaws worldwide: do grade-school arithmetic on word vectors, and the result actually means something.',
    formula: <>king <span className="op">−</span> man <span className="op">+</span> woman <span className="op">≈</span> <span className="res">queen</span></>,
    formulaZh: <>In plain terms: the arrow between the two points <b>woman − man</b> captures exactly the "gender" relation; translate that arrow as-is onto "king" and the landing point is closest to "queen." In other words — <b>the "relation" between words is, in this space, a direction you can carry around.</b></>,
    formulaP1: <>Even better, the arrows for the same relation are <b>parallel to each other</b>: all the "gender arrows" point one way, all the "capital arrows" point one way. No one ever taught the model what a capital is, yet "the capital relation" emerged on its own in the space as a direction.</>,
    formulaTableHead: ['Relation', 'Arrow A', 'Arrow B', 'Geometric feature'],
    formulaRows: [
      ['Gender', 'man → woman', 'king → queen', 'Roughly parallel directions'],
      ['Capital', 'China → Beijing', 'Japan → Tokyo', 'Roughly parallel directions'],
      ['Tense (English corpus)', 'walk → walked', 'go → went', 'Roughly parallel directions'],
    ],
    formulaP2: <>One calibration: note the equation uses <b>≈, not =</b>. This kind of analogy "often holds but isn’t guaranteed" in real models, and researchers have found plenty of cases that only look clean after tricks like excluding the original words. Treat it as a window into intuition, not a mathematical theorem.</>,

    clarifyTitle: '🔬 Two Key Clarifications: Don’t Be Fooled by the Cosmos Diagram',
    clarifyLead: 'We’re about to see the 3D demo, but first two vaccinations — these are precisely the points where embedding is most easily misunderstood.',
    clarify1Label: 'Clarification 1 · About dimensions',
    clarify1En: <>The 3D cosmos is just a <b>dimension-reduced illustration</b></>,
    clarify1Zh: <>A real embedding usually has <b>hundreds to thousands of dimensions</b>: the word2vec era commonly used 300 dimensions, and today’s word vectors inside large models are routinely in the thousands. High dimensionality is what holds a word’s multiple identities — "apple" must be near fruit, phone, and "red" all at once. Any 3D diagram is like flattening a globe into a flat map: convenient to view, but inevitably distorted.</>,
    clarify2Label: 'Clarification 2 · About origin',
    clarify2En: <>Coordinates <b>aren’t labeled by humans</b> — they’re learned</>,
    clarify2Zh: <>No linguist ever filled in coordinates for "cat." The model repeatedly does "predict the neighboring word" fill-in-the-blank problems over massive text, using Lesson 4’s gradient descent to push down how wrong the guesses are, bit by bit — <b>whoever keeps appearing in similar contexts has their coordinates nudged closer together</b>. Fully automatic, zero human labeling; the coordinates are merely a byproduct of training.</>,
    firthEn: '"You shall know a word by the company it keeps." — linguist J.R. Firth, 1957',
    firthZh: <>This is called the <b>distributional hypothesis</b>. Both "cat" and "dog" can fill "____ sleeps on the sofa" and "take the ____ to get vaccinated," so they get pushed together. The "meaning" an embedding learns is, at its core, a statistical compression of billions of contexts.</>,

    cosmosSecTitle: '🎛️ Interactive Demo: The Word-Vector Cosmos',
    cosmosSecLead: 'Below is a hand-designed 3D teaching cosmos: 36 words, 6 semantic clusters. Drag to rotate, scroll to zoom; first watch the "huddling," then click the red button to see the analogy equation come to life.',
    cosmosSecTail: 'A reminder once more: these coordinates are a 3D illustration hand-placed by the author for teaching. In a real model they’re hundreds to thousands of dimensions, determined automatically by training — but the two intuitions, "close = similar, relation = direction," hold exactly as-is.',

    trainSecTitle: '📖 Going Deeper｜How the Coordinates Get "Pushed" Out: A Fill-in-the-Blank Done Billions of Times',
    trainSecLead: 'We’ve said over and over that "the coordinates are learned"; this section takes the word "learn" apart. You’ll find the whole process almost absurdly humble: from start to finish the model does just one thing — fill in blanks. No linguist takes part, and no one ever graded a "semantic answer key."',
    trainCardA: { label: 'What it is · in one sentence', en: <>Training = billions of <b>fill-in-the-blank problems</b></>, zh: <>Take a normal sentence and remove one word — "the cat is ____ on the sofa" — and have the model use the surrounding words to guess what was removed. That’s exactly what word2vec does; today’s large-model pretraining of "guess the next word" (Lesson 12) is the scaled-up version of the same trick.</> },
    trainCardB: { label: 'Why it has to be this', en: <>Because "meaning" <b>can’t be labeled by hand</b></>, zh: <>Chinese has hundreds of thousands of words, each with thousands of coordinate values — no team could ever fill them all in; worse, "meaning" has no answer key to begin with, and the only reliable clue is <b>usage</b>. And the internet happens to provide, for free, billions of "fill-in-the-blank problems that come with their own answers" — without hiring a single annotator.</> },
    trainStepLead: 'How does it work, step by step? Just four steps, with Lesson 4’s gradient descent making a reappearance here:',
    trainSteps4: [
      { label: 'Step 1', en: <>Scatter points at random</>, zh: <>When training starts, every word is handed a string of purely random numbers. At this moment "cat" might be right next to "civil code" — the space is utter chaos, and the model knows nothing about language.</> },
      { label: 'Step 2', en: <>Do the problem: guess the blank from the neighbors</>, zh: <>Reading "the cat is napping on the sofa," cover up "cat" and have the model use the coordinates of "sofa" and "napping" to guess the blank — it gives every word in the vocabulary a "how much it looks like the answer" score.</> },
      { label: 'Step 3', en: <>Got it wrong? Give it a push</>, zh: <>When it guesses wrong, it goes back and edits the coordinates along "where it went wrong": pulling the correct answer a bit closer to this context, pushing the wildly-guessed word a bit farther away. Only a tiny move each time — exactly that small downhill step from Lesson 4.</> },
      { label: 'Step 4', en: <>Repeat billions of times</>, zh: <>"cat" and "dog" keep appearing in the same kind of context, so they get pushed toward the same region over and over. Clusters, gender arrows, capital arrows — all of them are byproducts that this dumb method piled up.</> },
    ],
    trainDemoLead: 'Talk is cheap, so let’s "train" one by hand below. Ten words start from random positions; each click of "Train one step" is like finishing a big batch of fill-in-the-blank problems — watch how the gray dots change color and rejoin their groups:',
    trainDeadEn: <>This method’s fatal flaw: <span className="hl">a word has only one point</span></>,
    trainDeadZh: <>The "apple" in "the apple is so sweet" and in "Apple’s launch event" clearly mean two different things, yet old-style word vectors can only issue it a single coordinate — polysemy gets flattened into an average. On top of that, biases in the corpus get compressed into the space as-is: if "doctor" always keeps company with "he" in the text, a crooked arrow gets left behind in the space. How do we crack polysemy? Read on — this is exactly the key leap from old word vectors to large models.</>,

    bodySecTitle: '📖 Going Deeper｜Inside ChatGPT: Embedding Is the First Stop, and It’s "Alive"',
    bodySecLead: 'word2vec is 2013 tech, so why must you, using ChatGPT and Claude today, still understand it? Because every large model carries its heir inside, and it completed one key upgrade: the coordinates went from "dead" to "alive." First see where it sits in the large-model pipeline —',
    pipeCards: [
      { label: 'Entrance · the first stop', en: <>Each token first <b>looks up the table for its coordinate</b></>, zh: <>The sentence you send is first cut into tokens (detailed in Lesson 11), and the first thing the model does is go to that embedding table inside it and turn each token into a vector. From this moment on, all computation sees only numbers and never sees text again.</> },
      { label: 'Midsection · dozens of layers of "seasoning"', en: <>The vectors get <b>continuously rewritten</b> by context</>, zh: <>What the lookup gives you is only the "dictionary meaning." Next, dozens of layers of attention (the next lesson) let each word’s vector refer to its neighbors and get revised again and again — by the time the whole sentence is read, "apple" may already have been dragged into the tech zone by "launch event." This is called a <b>contextualized vector</b>, the watershed between large models and word2vec.</> },
      { label: 'Exit · still comparing distance', en: <>Generating the answer also relies on <b>this space</b></>, zh: <>When the model spits out the next word, it’s essentially taking the current context’s vector and comparing "match score" against every candidate in the vocabulary — whoever matches gets a higher probability (how it draws lots by probability is covered in Lesson 14). A large model’s entire in-and-out happens in vector space.</> },
    ],
    ctxSecLead: 'What does a "living" coordinate look like? In the demo below, "apple"’s position is no longer fixed — tap different sentences and see which way context drags it:',
    ctxSecTail: 'Once you understand the "look up + rewrite" pipeline, many of the "moments of brilliance" you usually see in ChatGPT / Claude all have an explanation —',
    phenomTableHead: ['What you see', 'The vector-space mechanism behind it'],
    phenomRows: [
      { a: 'Ask it a different way, it still understands', b: <>"How do I return this" and "how do I apply for a refund" barely overlap in wording, yet their vectors nearly coincide — the model understands the <b>position</b> in the space, not the literal words.</> },
      { a: 'It mostly guesses right even with typos', b: <>"What is machne learning" — context "pulls" the typo’s vector back near the correct meaning: the neighboring words decide which cluster it lands in.</> },
      { a: 'Ask in Chinese, draw on knowledge from the English-speaking world', b: <>Multilingual training embeds "cat" and 猫 at nearly the same point — knowledge hangs on position, not on language.</> },
      { a: 'Hook up a knowledge base and it answers internal questions', b: <>RAG: chunk company docs into vectors and store them; at question time, fetch the nearest few by distance and feed them to the model — Lesson 18 walks you through building it by hand.</> },
    ],
    boundEn: <>A boundary reminder: close distance = <span className="hl">similar context</span>, not "factually correct"</>,
    boundZh: <>The vectors of "I love you" and "I hate you" are quite close — nearly identical in sentence pattern and scene. So semantic retrieval occasionally fetches back passages that "look alike but miss the point"; vector space also can’t tell truth from rumor, since it compresses the statistical regularities of language, not the truth of the world. This boundary comes up repeatedly in Lesson 18 (the pitfalls of RAG) and Lesson 29 (hallucination and evaluation).</>,

    everySecTitle: '🌐 Everything Can Be Embedded',
    everySecLead: 'This "compress into a vector, do business by distance" idea is utterly indifferent to its subject. As long as you can define "who should be close to whom," anything can be embedded into the same kind of space — which is exactly why it became modern AI’s infrastructure.',
    everyCards: [
      { label: 'Not just words', en: <>Sentences and documents <b>→ a point</b></>, zh: <>A whole paragraph can also be compressed into one vector: "the stock market crashed today" and "A-shares plunged across the board" use different words yet their points sit right next to each other — the old keyword-matching approach can’t see this connection.</> },
      { label: 'Across media', en: <>Images and text <b>→ the same space</b></>, zh: <>Models like CLIP embed images and text into the same space: the point of the sentence "a running dog" sits right next to the point of a photo of a dog. Searching images by text, and images by images, comes from this.</> },
      { label: 'Even people', en: <>Users and products <b>→ the same space</b></>, zh: <>Recommendation systems put your taste and tens of millions of products into one space; whatever drifts near your point is what gets recommended on your home page — "picks for you" is really guessing distance.</> },
    ],
    appTableHead: ['Application', 'How it does business by "distance"'],
    appRows: [
      { a: 'Semantic search', b: <>Search "a cheap place to stay" and it hits "budget hotel" — not a single keyword overlaps, yet the vector distance is tiny. Search upgrades from "matching characters" to "matching meaning."</> },
      { a: 'Recommendation / dedup', b: <>Turn the songs you’ve listened to into vectors and average them; the nearby songs make a new playlist. Two news articles whose vectors nearly coincide are plagiarism or duplicates, merged automatically.</> },
      { a: 'RAG retrieval', b: <>Chunk and vectorize company docs into a store; when you ask, first fetch the most relevant chunks by distance, then feed them to the large model to answer — Lesson 18 breaks down the full flow for you.</> },
    ],
    everyTail: <>The industry has even turned this into standalone product forms: dedicated <b>embedding models</b> (input text, output a vector, no chatting) and <b>vector databases</b> (warehouses built to retrieve by distance). In Lessons 18 and 28, you’ll assemble these two building blocks by hand into a system that can answer internal questions — and looking back then, you’ll find the soul of the whole system is this one line from today’s lesson: distance = semantic similarity.</>,

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: <>Every dimension has a clear meaning — say, dimension 7 stands for "gender," dimension 42 for "size"</>, good: <>The vast majority of dimensions have no human-readable meaning; concepts like "gender" are scattered across combined directions of hundreds of dimensions</>, why: <><b>Cause:</b> imagining an embedding as a human-designed spreadsheet — a column for height, a column for gender. In reality the coordinate system forms automatically through training, and pulling out any single dimension is almost all noise; an interpretable arrow like the "gender direction" is a combination of dimensions that researchers dug out of the whole <b>after the fact</b>, not any single coordinate axis.</> },
      { bad: <>An embedding is a fixed value looked up from a giant "word → numbers" dictionary</>, good: <>It’s a statistical product trained on massive text — swap the corpus or swap the model and the coordinates are completely different</>, why: <><b>Cause:</b> "words become numbers" sounds like a table lookup. Early word2vec really could be saved as a static table after training, but the values in that table are <b>learned</b>, not decreed by anyone; and in modern large models, the same word’s vector also changes in real time with context — the "apple" in "Apple’s launch event" and in "the apple is so sweet" aren’t the same point, and how it changes is exactly the next lesson’s attention-mechanism story.</> },
      { bad: <>If two sentences’ vectors are close in distance, their meaning is the same and the content is trustworthy</>, good: <>Close distance only means "similar context" — opposite sentences and sentences with opposing stances are often near neighbors</>, why: <><b>Cause:</b> hearing "semantic similarity" as "equivalence." Embedding comes from "see who keeps appearing in the same kind of context," and "the stock price soared" and "the stock price plunged" happen to share the same kind of context, so they’re actually close in distance. When doing semantic search and RAG, be sure to remember this — otherwise you’ll take a "looks alike" wrong answer for a correct one.</> },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. Using this lesson’s concepts, explain: why can a vector search for "a cheap place to stay" find "budget hotel," even though the two phrases don’t share a single character?', a: <>Because the search compares not the words but the <b>distance between embeddings</b>. "A cheap place to stay" and "budget hotel" appear in highly similar contexts across massive text (booking, price, reviews…), so after training their vectors get pushed very close — close distance means it gets retrieved, and whether the literal characters overlap doesn’t enter the computation at all.</> },
      { q: '2. Do a problem in the style of the famous equation: Paris − France + Japan ≈ ?, and say what each step is "carrying."', a: <><b>≈ Tokyo.</b> The arrow "Paris − France" captures the "capital" relation; translate and add it onto "Japan" and the landing point naturally falls near "Tokyo" — just like the gender arrow, the capital arrow is also roughly parallel in the space.</> },
      { q: '3. A friend excitedly says: "I discovered that dimension 42 of the model’s vectors stores a word’s positive/negative sentiment!" What’s wrong with this claim?', a: <>The problem is <b>mistaking a "direction" for a "coordinate axis."</b> The vast majority of single dimensions can’t be interpreted, and sentiment like positive/negative is usually a combined direction of hundreds of dimensions; even if they really found a direction in the data correlated with sentiment, that’s a product of after-the-fact digging, and it changes when you swap models or swap corpora — there’s no mechanism guaranteeing it happens to land on axis number 42.</> },
      { q: '4. In word2vec "apple" has only one fixed vector, but in large models like ChatGPT it "moves." Use this lesson’s concepts to explain the difference, and say where the "movement"’s driving force comes from.', a: <>word2vec is a <b>static word vector</b>: one word, one point, with "apple"’s fruit sense and company sense compressed into one average position. In a large model, the token first looks up the embedding table to get an initial vector, then dozens of layers rewrite it according to context into a <b>contextualized vector</b> — in "the apple is so sweet" it drifts toward the fruit cluster, in "Apple’s launch event" toward the tech cluster. The "driving force" comes from the surrounding words: each word refers to its neighbors to update itself, and exactly how it refers to them is the content of the next lesson’s attention mechanism.</> },
    ],
  },
}

// ============================================================
// ① 词向量星空（three.js）
// ============================================================
const COSMOS_KEY_ORDER = ['all', 'animal', 'food', 'emotion', 'job', 'relation']

function CosmosDemo({ c }) {
  const { lang } = useLang()
  const hostRef = useRef(null)
  const ctrlRef = useRef(null)
  const [activeKey, setActiveKey] = useState('all')
  const [textKey, setTextKey] = useState('all')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ctrl
    try {
      ctrl = createCosmos(hostRef.current, { lang })
      ctrlRef.current = ctrl
    } catch (e) {
      setFailed(true)
    }
    return () => ctrl?.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 语言切换：只换 3D 标签语言，不重建场景、不重置相机/动画。
  useEffect(() => {
    ctrlRef.current?.setLang(lang)
  }, [lang])

  const text = textKey === 'analogy' ? c.analogy : c.views[textKey]
  const select = (key) => { setActiveKey(key); setTextKey(key); ctrlRef.current?.select(key) }
  const analogy = () => { setActiveKey(null); setTextKey('analogy'); ctrlRef.current?.startAnalogy() }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.cosmosDemoTitle}</span>
        <span className="demo-hint">{c.cosmosDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div id="cosmos" ref={hostRef} aria-label={c.cosmosAria}>
            {failed && <div className="cosmos-fallback"><b>{c.cosmosFallTitle}</b><p>{c.fallback}</p></div>}
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            {COSMOS_KEY_ORDER.map((k) => (
              <button key={k} className={`chip${k === activeKey ? ' active' : ''}`} disabled={failed} onClick={() => select(k)}>{c.cosmosKeys[k]}</button>
            ))}
          </div>
          <div className="chips" style={{ marginTop: 14 }}>
            <button className="chip chip-play" disabled={failed} onClick={analogy}>{c.cosmosPlay}</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{text.title}</h4>
          <p>{text.desc}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 训练步进：看坐标被填空题一步步推出来
// ============================================================
// [词, 颜色变量, 起点x, 起点y, 终点x, 终点y, 成团轮次]
const TRAIN_WORDS = [
  ['猫', '--sage', 330, 236, 76, 64, 1], ['狗', '--sage', 96, 272, 120, 86, 1],
  ['兔子', '--sage', 388, 64, 70, 110, 1], ['老虎', '--sage', 206, 124, 126, 130, 4],
  ['米饭', '--amber', 58, 72, 330, 62, 2], ['面条', '--amber', 244, 286, 372, 86, 2],
  ['饺子', '--amber', 142, 186, 324, 106, 2], ['披萨', '--amber', 404, 196, 368, 128, 5],
  ['开心', '--terracotta', 302, 148, 196, 252, 3], ['难过', '--terracotta', 46, 206, 248, 272, 3],
]
const progress = (feat, step) => {
  if (step <= 0) return 0
  if (step >= 6) return 1
  return Math.min(1, 0.1 * step + (step >= feat ? 0.6 : 0))
}

function TrainDemo({ c }) {
  const [step, setStep] = useState(() => (reduceMotion() ? 6 : 0))
  const s = c.trainSteps[step]
  const errPct = [100, 78, 61, 45, 30, 16, 7][step]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.trainDemoTitle}</span>
        <span className="demo-hint">{c.trainDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="train-svg" viewBox="0 0 440 330" width="440" aria-label={c.trainAria}>
            {TRAIN_WORDS.map((w, i) => {
              const p = progress(w[6], step)
              const x = w[2] + (w[4] - w[2]) * p
              const y = w[3] + (w[5] - w[3]) * p
              return (
                <g key={i} className="tw" style={{ transform: `translate(${x}px,${y}px)` }}>
                  <circle r="7" style={{ fill: step >= w[6] ? `var(${w[1]})` : 'var(--fg-2)' }} />
                  <text y="-12" textAnchor="middle">{c.trainWord[w[0]]}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip chip-play" onClick={() => setStep((v) => Math.min(6, v + 1))}>{c.trainStep}</button>
            <button className="chip" onClick={() => setStep(6)}>{c.trainAll}</button>
            <button className="chip" onClick={() => setStep(0)}>{c.trainReset}</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{s.t}</h4>
          <p>{s.d}</p>
          <div className="errbar-row">
            <span>{c.trainErr}</span>
            <div className="errbar"><i style={{ width: errPct + '%' }} /></div>
            <span className="ev">{errPct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③「苹果」语境漂移
// ============================================================
const APPLE_POS = { none: [218, 236], fruit: [128, 122], tech: [304, 124] }
const APPLE_DOTS = [
  [78, 98, '香蕉', '--sage'], [134, 76, '桃子', '--sage'], [100, 156, '甜', '--sage'],
  [352, 100, '手机', '--sky'], [300, 74, '电脑', '--sky'], [336, 162, '发布会', '--sky'],
]
const APPLE_KEY_ORDER = ['none', 'fruit', 'tech']

function CtxDemo({ c }) {
  const [key, setKey] = useState('none')
  const [x, y] = APPLE_POS[key]
  const txt = c.appleTxt[key]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.ctxDemoTitle}</span>
        <span className="demo-hint">{c.ctxDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ctx-svg" viewBox="0 0 440 300" width="440" aria-label={c.ctxAria}>
            <circle cx="110" cy="112" r="84" style={{ fill: 'var(--sage-bg)', stroke: 'var(--sage)', strokeWidth: 1.2, strokeDasharray: '5 5' }} />
            <text x="110" y="36" textAnchor="middle" style={{ fill: 'var(--sage)', fontSize: 12, fontWeight: 700 }}>{c.ctxFruitCluster}</text>
            <circle cx="330" cy="114" r="86" style={{ fill: 'var(--sky-bg)', stroke: 'var(--sky)', strokeWidth: 1.2, strokeDasharray: '5 5' }} />
            <text x="330" y="34" textAnchor="middle" style={{ fill: 'var(--sky)', fontSize: 12, fontWeight: 700 }}>{c.ctxTechCluster}</text>
            {APPLE_DOTS.map(([dx, dy, label, color], i) => (
              <g key={i} style={{ transform: `translate(${dx}px,${dy}px)` }}>
                <circle r="5" style={{ fill: `var(${color})` }} />
                <text y="-10" textAnchor="middle" style={{ fill: 'var(--fg-1)', fontSize: 12, fontWeight: 600 }}>{c.appleDot[label]}</text>
              </g>
            ))}
            <g id="apple-g" style={{ transform: `translate(${x}px,${y}px)` }}>
              <circle r="9" style={{ fill: 'var(--terracotta)' }} />
              <text y="-16" textAnchor="middle" style={{ fill: 'var(--fg-0)', fontSize: 14, fontWeight: 700 }}>{c.appleWord}</text>
            </g>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {APPLE_KEY_ORDER.map((k) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{c.ctxKeys[k]}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{txt.t}</h4>
          <p>{txt.d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L08() {
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
            <div className="tag"><span className="pill pill-terracotta">{c.humanTag}</span></div>
            <div className="big">{c.humanBig}</div>
            <p className="note">{c.humanNote}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.machineTag}</span></div>
            <div className="big">{c.machineBig}</div>
            <p className="note">{c.machineNote}</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">{c.distEn}</div>
          <div className="zh">{c.distZh}</div>
        </div>
        <p className="lead mt14">{c.conceptTail}</p>
      </Lsec>

      <Lsec
        title={c.formulaTitle}
        lead={c.formulaLead}
      >
        <div className="example">
          <div className="formula">{c.formula}</div>
          <div className="zh">{c.formulaZh}</div>
        </div>
        <p className="lead mt14">{c.formulaP1}</p>
        <table className="match card">
          <thead><tr><th>{c.formulaTableHead[0]}</th><th>{c.formulaTableHead[1]}</th><th>{c.formulaTableHead[2]}</th><th>{c.formulaTableHead[3]}</th></tr></thead>
          <tbody>
            {c.formulaRows.map((row, i) => (
              <tr key={i}><td className="be">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td className="ex">{row[3]}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="lead mt14">{c.formulaP2}</p>
      </Lsec>

      <Lsec
        title={c.clarifyTitle}
        lead={c.clarifyLead}
      >
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">{c.clarify1Label}</div>
            <div className="en">{c.clarify1En}</div>
            <div className="zh">{c.clarify1Zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.clarify2Label}</div>
            <div className="en">{c.clarify2En}</div>
            <div className="zh">{c.clarify2Zh}</div>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">{c.firthEn}</div>
          <div className="zh">{c.firthZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.cosmosSecTitle}
        lead={c.cosmosSecLead}
      >
        <CosmosDemo c={c} />
        <p className="lead mt14">{c.cosmosSecTail}</p>
      </Lsec>

      <Lsec
        title={c.trainSecTitle}
        lead={c.trainSecLead}
      >
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">{c.trainCardA.label}</div>
            <div className="en">{c.trainCardA.en}</div>
            <div className="zh">{c.trainCardA.zh}</div>
          </div>
          <div className="card use-card">
            <div className="label">{c.trainCardB.label}</div>
            <div className="en">{c.trainCardB.en}</div>
            <div className="zh">{c.trainCardB.zh}</div>
          </div>
        </div>
        <p className="lead mt14">{c.trainStepLead}</p>
        <div className="use-grid cols-2">
          {c.trainSteps4.map((st, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{st.label}</div>
              <div className="en">{st.en}</div>
              <div className="zh">{st.zh}</div>
            </div>
          ))}
        </div>
        <p className="lead mt14">{c.trainDemoLead}</p>
        <TrainDemo c={c} />
        <div className="example mt14">
          <div className="en">{c.trainDeadEn}</div>
          <div className="zh">{c.trainDeadZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.bodySecTitle}
        lead={c.bodySecLead}
      >
        <div className="use-grid">
          {c.pipeCards.map((p, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{p.label}</div>
              <div className="en">{p.en}</div>
              <div className="zh">{p.zh}</div>
            </div>
          ))}
        </div>
        <p className="lead mt14">{c.ctxSecLead}</p>
        <CtxDemo c={c} />
        <p className="lead mt14">{c.ctxSecTail}</p>
        <table className="match card">
          <thead><tr><th>{c.phenomTableHead[0]}</th><th>{c.phenomTableHead[1]}</th></tr></thead>
          <tbody>
            {c.phenomRows.map((row, i) => (
              <tr key={i}><td className="be">{row.a}</td><td className="ex">{row.b}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="example mt14">
          <div className="en">{c.boundEn}</div>
          <div className="zh">{c.boundZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.everySecTitle}
        lead={c.everySecLead}
      >
        <div className="use-grid">
          {c.everyCards.map((p, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{p.label}</div>
              <div className="en">{p.en}</div>
              <div className="zh">{p.zh}</div>
            </div>
          ))}
        </div>
        <table className="match card mt14">
          <thead><tr><th>{c.appTableHead[0]}</th><th>{c.appTableHead[1]}</th></tr></thead>
          <tbody>
            {c.appRows.map((row, i) => (
              <tr key={i}><td className="be">{row.a}</td><td className="ex">{row.b}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="lead mt14">{c.everyTail}</p>
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
