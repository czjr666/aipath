import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / SVG 几何 / 交互逻辑均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    // ① 开放程度阶梯
    rows: ['API / 产品入口', '权重文件（模型本体）', '训练代码与配方', '训练数据（语料）'],
    modes: {
      closed: { name: '闭源 API', period: '只租能力，不卖模型',
        desc: '你拿到的是服务，不是模型。模型住在厂商的服务器里，你通过 API 租用它的能力 —— 像点外卖：菜很好吃，但厨房不让进，菜也不让带走。', tags: ['GPT', 'Claude', 'Gemini'],
        states: [['yes', '提供 —— 按 token 计费'], ['no', '不提供'], ['no', '不提供'], ['no', '不提供']] },
      open: { name: '开放权重', period: '业内说的“开源模型”九成在这一档',
        desc: '你拿到模型文件本身，可以搬回自己机器上自由部署、微调 —— 像买到了做好的菜：能加热、能改刀，但菜谱不给，没法从头复现。', tags: ['Llama', 'Qwen', 'DeepSeek', 'Mistral'],
        states: [['yes', '官方或第三方托管均有'], ['yes', '可自由下载、本地部署'], ['half', '多数只给技术报告，细节留白'], ['no', '极少公开 —— 数据是底牌']] },
      full: { name: '全开源', period: '少数派，多由科研机构推动',
        desc: '权重、训练代码、训练数据全公开，理论上可以从零复现整个模型 —— 这才是软件意义上的“开源”。图的是可研究、可审计，目前以科研驱动为主。', tags: ['OLMo（Allen AI）'],
        states: [['yes', '提供'], ['yes', '公开'], ['yes', '全流程公开'], ['yes', '语料公开可查']] },
    },
    ladderDemoTitle: '🎛️ 交互演示 · 一个模型能“开放”到什么程度',
    ladderDemoHint: '点击胶囊切换，看四层组件谁公开、谁上锁',
    ladderSvgAria: '模型开放程度的四层阶梯',
    ladderChips: [['closed', '闭源 API'], ['open', '开放权重'], ['full', '全开源']],

    // ② 选型方向仪
    qs: [
      { name: '① 数据', label: '① 数据能出网吗？', opts: [{ t: '能出网', side: 'closed' }, { t: '不能，太敏感', side: 'open', hard: true }] },
      { name: '② 预算', label: '② 预算偏好哪种？', opts: [{ t: '按量付费 OPEX', side: 'closed' }, { t: '一次性投入 CAPEX', side: 'open' }] },
      { name: '③ 定制', label: '③ 需要深度定制吗？', opts: [{ t: '提示词就够', side: 'closed' }, { t: '要微调魔改', side: 'open' }] },
      { name: '④ 运维', label: '④ 团队有运维能力吗？', opts: [{ t: '没人管 GPU', side: 'closed' }, { t: '有 GPU 团队', side: 'open' }] },
    ],
    gaugeDemoTitle: '🎛️ 交互演示 · 开放权重还是闭源 API？',
    gaugeDemoHint: '点右侧选项，方向仪实时摆动',
    gaugeSvgAria: '选型方向仪：四个问题的答案共同决定指针偏向闭源 API 还是开放权重',
    gaugeLeftLabel: '闭源 API',
    gaugeRightLabel: '开放权重',
    qSep: '：',
    pullHard: '一票否决 ▶ 必须可本地部署',
    pullOpen: '▶ 偏开放权重',
    pullClosed: '◀ 偏闭源 API',
    verdict: {
      hard: { title: '建议：开放权重（本地 / 私有化部署）', desc: '“数据不能出网”是硬约束，直接否决所有公网 API。其余三问只影响怎么落地：没有运维就买私有化一体机或外包部署，有运维就自建。' },
      open: (open, closed) => ({ title: `建议：倾向开放权重（${open} : ${closed}）`, desc: '多数信号指向自己部署：投入是固定成本，量越大越划算。建议先用小尺寸模型试点，验证效果再加码硬件。' }),
      closed: (open, closed) => ({ title: `建议：倾向闭源 API（${closed} : ${open}）`, desc: '按 token 付费、零运维、随开随用 —— 对当前条件是最省心的起点。等用量上来或需求变深，再回来重做一遍四问。' }),
      tie: { title: '建议：五五开，先 API 起步', desc: '信号打平时，工程界的常见做法是：先用闭源 API 最快跑通业务，少绑定厂商私有功能、留好切换余地，后续随用量与需求再迁移。' },
    },

    flips: [
      { q: '医院要做内部病历问答系统', pill: { type: 'sage', text: '开放权重' }, why: '病历是最敏感的数据，“不能出网”一票否决 —— 本地部署的开放权重（或厂商私有化方案）是唯一方向。' },
      { q: '给自己装一个个人写作助手', pill: { type: 'sky', text: '闭源 API' }, why: '没有隐私硬约束、用量小，按 token 付费几乎零门槛；为写作文自购 GPU，连电费都不划算。' },
      { q: '创业公司要在两周内做出 MVP', pill: { type: 'sky', text: '闭源 API' }, why: '第一要务是验证需求：OPEX 起步最快、零运维。等跑通了、用量大了，再回头评估迁移到开放权重省钱。' },
      { q: '科研团队要复现一个模型实验', pill: { type: 'sage', text: '开放权重（最好全开源）' }, why: '研究要检查、修改、复跑模型内部，闭源 API 是黑箱；若连训练过程都要复现，只有 OLMo 这类全开源才够。' },
      { q: '车间里的离线工业质检设备', pill: { type: 'sage', text: '开放权重' }, why: '产线常常物理断网，API 根本调不通 —— 只能把模型搬进本地设备，这正是开放权重的主场。' },
      { q: '电商公司想微调一个“懂自家话术”的客服模型', pill: { type: 'sage', text: '开放权重' }, why: '要把自家话术“焊进”模型，需要深度微调甚至改结构 —— 闭源只开放有限微调接口，自由度不够。' },
    ],

    goalsTitle: '🎯 你将学会',
    goals: [
      <>识破名字陷阱：业内说的“开源模型”九成其实是“开放权重”—— 给你做好的菜（模型文件），不给菜谱（数据与配方）；真·全开源如 OLMo 是少数派</>,
      <>用五个维度对照两条路线：获取方式、数据隐私、能力上限、成本结构、可定制</>,
      <>在 2025 年的版图上点名两大阵营：GPT / Claude / Gemini 与 Llama / Qwen / DeepSeek / Mistral 等，并知道 DeepSeek-R1 为什么是分水岭</>,
      <>背下选型四问：数据出不出网？预算 OPEX 还是 CAPEX？要不要微调？有没有运维？—— 把问题从“哪个最强”换成“哪个最合适”</>,
    ],

    conceptTitle: '💡 核心概念：你听到的“开源模型”，多数是“开放权重”',
    conceptLead: '先正名。开源软件（Linux、Python）的“开源”指源代码全公开：拿到的是菜谱，每一行都能检查，理论上能从头复现。而新闻里的“开源大模型”，九成给你的只是权重文件 —— 那几十亿个“旋钮”（第 3 课的权重）训练完成后的最终读数。你能下载、能部署、能微调，但它是一盘做好的菜：训练数据（食材）、训练代码与配方（火候），统统不公开。准确的叫法是开放权重（open weights）。点下面的胶囊，看三档“开放程度”到底差在哪一层。',
    conceptExEn: <>开放权重 = 给你<span className="hl">做好的菜</span>，不给菜谱</>,
    conceptExZh: <>能加热（部署）、能改刀（微调），但厨房不让进。为什么大家都藏菜谱？训练数据既是商业公司最贵的底牌，又埋着版权地雷 —— “开放权重”正是商业利益与开放精神之间的折中。本课从此统一用语：<b>开放权重 vs 闭源 API</b>。</>,

    tableTitle: '📖 两条路线，五个维度',
    tableLead: '闭源 API 像点外卖：随点随吃、按量付费，但厨房在别人家；开放权重像自己开伙：菜（模型）免费拿，但锅碗瓢盆（GPU）、水电（运维）全得自己置办。五个维度一张表：',
    tableHead: ['维度', '闭源 API', '开放权重'],
    tableRows: [
      { be: '获取方式', closed: '注册账号、照文档发请求，几分钟跑通（第 26 课动手）', open: '下载权重文件，部署到自己的 GPU / 服务器（第 27 课动手）' },
      { be: '数据隐私', closed: '数据必须发送到厂商服务器 ——“出网”', open: '可完全本地运行，数据一步不出门' },
      { be: '能力上限', closed: '前沿能力通常率先出现在闭源旗舰', open: '紧追，且差距在快速缩小（见下文 R1 时刻）' },
      { be: '成本结构', closed: '按 token 计费，用多少付多少（OPEX，价格以官网为准）', open: '权重免费，但 GPU、电费、运维人力是真金白银（CAPEX）' },
      { be: '可定制', closed: '受限：提示词 + 厂商开放的有限微调接口', open: '自由：可微调、可裁剪、可“魔改”到任何形状' },
    ],

    mapTitle: '🗺️ 版图速览：谁在哪条线上（截至 2025）',
    mapLead: '下面是截至 2025 年的格局快照 —— 这个领域更新极快，名单与排位请以各家最新发布为准。一句话记定位，不背跑分。先看闭源三巨头：模型不出门，能力当服务卖。',
    mapCards1: [
      { label: '闭源 API · 美国', en: <>OpenAI <b>GPT</b></>, zh: 'ChatGPT 的缔造者，把大模型带进大众视野；对话、多模态、推理产品线最全，至今是行业风向标。' },
      { label: '闭源 API · 美国', en: <>Anthropic <b>Claude</b></>, zh: '以 AI 安全研究立身，长文本、代码与 Agent 能力是口碑招牌，在工程师群体中粘性极高。' },
      { label: '闭源 API · 美国', en: <>Google <b>Gemini</b></>, zh: '原生多模态路线，背靠搜索、安卓与办公全家桶 —— 论分发渠道无人能敌。' },
    ],
    mapLead2: '再看开放权重阵营：模型文件给你，部署随你 —— 中国力量在这一边格外密集。',
    mapCards2: [
      { label: '开放权重 · 美国', en: <>Meta <b>Llama</b></>, zh: '把“开放权重”变成行业惯例的带头人，衍生模型与工具生态最庞大；注意其许可证带商用条款，并非传统开源协议。' },
      { label: '开放权重 · 中国', en: <>阿里 <b>Qwen</b></>, zh: '通义千问家族：尺寸谱系最全、迭代最勤的开放权重系列之一，在全球开发者社区的采用量名列前茅。' },
      { label: '开放权重 · 中国', en: <>DeepSeek <b>深度求索</b></>, zh: '以极致工程效率著称的“性价比之王”，R1 一夜改写了“开放权重永远慢半拍”的叙事（见下一节）。' },
      { label: '开放权重 · 欧洲', en: <>Mistral <b>米斯特拉尔</b></>, zh: '欧洲的独苗级代表，以“小而高效”起家（MoE 路线的早期推手），开放权重与商业 API 两条腿走路。' },
      { label: '开放权重 · 中国', en: <>月之暗面 <b>Kimi</b></>, zh: '以超长上下文出圈的明星创业公司，2025 年携 K2 系列加入开放权重阵营。' },
      { label: '开放权重 · 中国', en: <>智谱 <b>GLM</b></>, zh: '清华系出身，国内最早一批做中英双语大模型的团队，GLM 系列持续开放迭代。' },
    ],
    mapExEn: <>阵营的边界正在<span className="hl">变模糊</span></>,
    mapExZh: <>闭源三家也各有开放权重支线：Google 有 Gemma，OpenAI 也在 2025 年放出了 gpt-oss。两条路线是一道光谱而非两座阵地 —— 同一家公司常常两头下注。</>,

    r1Title: '⚡ DeepSeek-R1 时刻：差距可以被急剧压缩',
    r1Lead: '第 23 课讲过推理模型：让模型先“打草稿”再回答，用测试时算力换智力。2025 年 1 月，这条故事线在开放权重阵营炸响 —— DeepSeek-R1 以开放权重 + 宽松许可发布，推理能力直逼当时最强的闭源推理模型，而训练投入远低于外界对“前沿模型”的想象（具体数字有争议，“便宜得多”是共识）。一周之内它冲上多国应用商店榜首，甚至引发美股科技股震荡。震动的原因不是它“最强”，而是它证明了：闭源领先的护城河，可能比所有人以为的浅得多。',
    r1Before: { tag: 'R1 之前的默认假设', big: <>开放权重永远落后闭源<span className="gap">一到两年</span></>, note: '前沿能力先出现在闭源旗舰，开放阵营追着复刻。于是选型逻辑很粗暴：要最强，就得交钱、交数据。' },
    r1After: { tag: 'R1 之后的新共识', big: <>差距可以被<span className="hl">急剧压缩</span></>, note: '两条路线的距离不再是“代差”，而是会被随时拉近的“身位”。选型问题从“哪个最强”，变成“哪个最合适”—— 下一节给你四问。' },

    gaugeTitle: '🎛️ 选型四问：拨一拨方向仪',
    gaugeLead: '真实项目里不需要背榜单，只需要回答四个问题。点右侧选项，看方向仪往哪边摆 —— 注意第一问是一票否决项：数据不能出网时，其余三问只决定“怎么落地”，不再决定“选哪边”。',

    flipsTitle: '🎛️ 场景练手：六个项目分一分',
    flipsLead: '用刚才的四问给下面 6 个真实场景做判断：更适合开放权重还是闭源 API？先自己过一遍四问，再点卡片对答案。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: '开源（开放权重）= 免费', good: '权重不要钱，但跑模型的 GPU、电费、运维人力都是钱 —— 用量大才划算',
        why: <><b>病因：</b>把“下载免费”当成“使用免费”，这是手机 App 时代的思维惯性。大模型是吞电的重资产：小用量时，按 token 付费的闭源 API 往往反而更便宜；开放权重省下的是按量付费，换来的是固定投入 —— 翻盘点在“量”。</> },
      { bad: '闭源一定更强，开放权重是“将就用”', good: '分场景：前沿推理常由闭源旗舰领跑，但大量日常任务开放权重早已绰绰有余',
        why: <><b>病因：</b>只盯着排行榜头部。翻译、摘要、客服、内部问答这类任务根本用不到“最强”，够用、合规、便宜才是赢家 —— R1 时刻更证明头部差距随时可能被压缩。选型看的是“任务够不够用 + 约束满不满足”，不是榜单第一名。</> },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 同事说：“DeepSeek 权重能免费下载，所以换成它就一分钱不用花了。”这句话哪里对、哪里错？',
        a: <><b>“免费下载”对，“一分钱不花”错。</b>自己跑模型要 GPU（买或租）、电费、运维人力；用量小的时候，按 token 付费的 API 往往更省。另一条路是用第三方平台托管的 DeepSeek API —— 那又回到了按量付费，只是单价可能更低。</> },
      { q: '2. 一家律所想做内部合同问答工具：材料高度敏感，团队没有任何 GPU 运维经验。用四问走一遍，给出方向。',
        a: <>第一问就触发<b>一票否决</b>：合同不能出网 → 方向锁定可本地 / 私有化部署的开放权重。“没有运维”不改变方向，只改变落地方式：买厂商的私有化一体机、托管私有云，或外包部署 —— 先用小尺寸模型试点，验证效果再加码。</> },
      { q: '3. 填空：前沿能力通常在 ____ 率先出现；但大量日常任务，____ 已经绰绰有余。所以选型问题从“哪个最强”变成了 ____。',
        a: <><b>闭源旗舰 / 开放权重 / “哪个最合适”。</b>这也是 DeepSeek-R1 时刻的最大遗产：差距能被急剧压缩，盲目追“最强”不如老老实实回答四问。</> },
    ],
  },

  en: {
    // ① Openness ladder
    rows: ['API / product access', 'Weight files (the model itself)', 'Training code & recipe', 'Training data (corpus)'],
    modes: {
      closed: { name: 'Closed API', period: 'You rent the capability, you don’t buy the model',
        desc: 'What you get is a service, not a model. The model lives on the vendor’s servers, and you rent its capabilities through an API — like ordering takeout: the food is great, but you can’t enter the kitchen and you can’t take the dish home.', tags: ['GPT', 'Claude', 'Gemini'],
        states: [['yes', 'Provided — billed per token'], ['no', 'Not provided'], ['no', 'Not provided'], ['no', 'Not provided']] },
      open: { name: 'Open weights', period: 'Nine in ten of the “open-source models” people talk about sit here',
        desc: 'You get the model files themselves and can bring them back to your own machine to deploy and fine-tune freely — like buying a finished dish: you can reheat it and recut it, but you don’t get the recipe and can’t reproduce it from scratch.', tags: ['Llama', 'Qwen', 'DeepSeek', 'Mistral'],
        states: [['yes', 'Hosted officially or by third parties'], ['yes', 'Free to download and deploy locally'], ['half', 'Mostly just a technical report, details left blank'], ['no', 'Rarely public — the data is the trump card']] },
      full: { name: 'Fully open source', period: 'A minority, mostly driven by research institutions',
        desc: 'Weights, training code, and training data are all public; in theory you can reproduce the whole model from zero — this is “open source” in the software sense. The goal is to be researchable and auditable, and for now it is mostly research-driven.', tags: ['OLMo (Allen AI)'],
        states: [['yes', 'Provided'], ['yes', 'Public'], ['yes', 'Whole pipeline public'], ['yes', 'Corpus public and inspectable']] },
    },
    ladderDemoTitle: '🎛️ Interactive · How “open” can a model actually be',
    ladderDemoHint: 'Click a pill to switch and see which of the four layers are public and which are locked',
    ladderSvgAria: 'A four-layer ladder of model openness',
    ladderChips: [['closed', 'Closed API'], ['open', 'Open weights'], ['full', 'Fully open source']],

    // ② Selection compass
    qs: [
      { name: '① Data', label: '① Can the data leave your network?', opts: [{ t: 'Can go off-network', side: 'closed' }, { t: 'No, too sensitive', side: 'open', hard: true }] },
      { name: '② Budget', label: '② Which budget do you prefer?', opts: [{ t: 'Pay-as-you-go OPEX', side: 'closed' }, { t: 'One-time investment CAPEX', side: 'open' }] },
      { name: '③ Customize', label: '③ Do you need deep customization?', opts: [{ t: 'Prompts are enough', side: 'closed' }, { t: 'Need fine-tuning & hacking', side: 'open' }] },
      { name: '④ Ops', label: '④ Does the team have ops capability?', opts: [{ t: 'No one to manage GPUs', side: 'closed' }, { t: 'Have a GPU team', side: 'open' }] },
    ],
    gaugeDemoTitle: '🎛️ Interactive · Open weights or closed API?',
    gaugeDemoHint: 'Click the options on the right and watch the compass swing in real time',
    gaugeSvgAria: 'Selection compass: the answers to four questions together decide whether the needle leans toward closed API or open weights',
    gaugeLeftLabel: 'Closed API',
    gaugeRightLabel: 'Open weights',
    qSep: ': ',
    pullHard: 'Veto ▶ must be locally deployable',
    pullOpen: '▶ leans open weights',
    pullClosed: '◀ leans closed API',
    verdict: {
      hard: { title: 'Recommendation: open weights (local / on-premise deployment)', desc: '“Data can’t leave the network” is a hard constraint that directly rules out every public API. The other three questions only affect how you implement it: with no ops, buy an on-premise appliance or outsource the deployment; with ops, build it yourself.' },
      open: (open, closed) => ({ title: `Recommendation: lean toward open weights (${open} : ${closed})`, desc: 'Most signals point to self-hosting: the investment is a fixed cost, and the larger your volume, the more worthwhile it gets. Start with a small model as a pilot, validate the results, then scale up the hardware.' }),
      closed: (open, closed) => ({ title: `Recommendation: lean toward closed API (${closed} : ${open})`, desc: 'Pay per token, zero ops, ready whenever you are — for your current conditions this is the most hassle-free starting point. Once volume grows or your needs deepen, come back and run the four questions again.' }),
      tie: { title: 'Recommendation: it’s a tie, start with an API', desc: 'When signals are even, the common engineering practice is: use a closed API first to get the business running fastest, avoid binding to the vendor’s proprietary features, leave room to switch, and migrate later as volume and needs grow.' },
    },

    flips: [
      { q: 'A hospital building an internal medical-record Q&A system', pill: { type: 'sage', text: 'Open weights' }, why: 'Medical records are the most sensitive data; “can’t go off-network” is a veto — locally deployed open weights (or a vendor’s on-premise solution) is the only direction.' },
      { q: 'Setting up a personal writing assistant for yourself', pill: { type: 'sky', text: 'Closed API' }, why: 'No hard privacy constraint and low volume, so pay-per-token has almost zero barrier; buying your own GPU just to write essays doesn’t even pay for the electricity.' },
      { q: 'A startup that needs to ship an MVP in two weeks', pill: { type: 'sky', text: 'Closed API' }, why: 'The top priority is validating the need: OPEX starts fastest, zero ops. Once it works and volume grows, revisit migrating to open weights to save money.' },
      { q: 'A research team reproducing a model experiment', pill: { type: 'sage', text: 'Open weights (ideally fully open source)' }, why: 'Research needs to inspect, modify, and rerun the model internals; a closed API is a black box. If even the training process must be reproduced, only fully open-source projects like OLMo are enough.' },
      { q: 'An offline industrial-inspection device on the factory floor', pill: { type: 'sage', text: 'Open weights' }, why: 'Production lines are often physically disconnected, so an API simply can’t be reached — you can only bring the model into the local device, which is exactly where open weights shine.' },
      { q: 'An e-commerce company fine-tuning a support model that “speaks its own playbook”', pill: { type: 'sage', text: 'Open weights' }, why: 'Welding your own playbook into the model needs deep fine-tuning or even architecture changes — closed models only expose limited fine-tuning interfaces, not enough freedom.' },
    ],

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>See through the naming trap: nine in ten of the so-called “open-source models” are really “open weights” — you get the finished dish (the model files), not the recipe (the data and process); truly fully open source like OLMo is the minority</>,
      <>Compare the two routes across five dimensions: how you get it, data privacy, capability ceiling, cost structure, and customizability</>,
      <>Name the two big camps on the 2025 map: GPT / Claude / Gemini versus Llama / Qwen / DeepSeek / Mistral and others, and understand why DeepSeek-R1 was a watershed</>,
      <>Memorize the four selection questions: can the data go off-network? OPEX or CAPEX budget? fine-tuning needed? ops in place? — turning the question from “which is strongest” into “which fits best”</>,
    ],

    conceptTitle: '💡 Core Idea: the “open-source models” you hear about are mostly “open weights”',
    conceptLead: 'First, let’s get the names right. The “open” in open-source software (Linux, Python) means the source code is fully public: you get the recipe, can inspect every line, and could in theory reproduce it from scratch. But the “open-source LLMs” in the news mostly give you only the weight files — the final readings of those billions of “knobs” (the weights from Lesson 3) after training is done. You can download, deploy, and fine-tune them, but it’s a finished dish: the training data (the ingredients) and the training code & recipe (the heat and timing) are all kept private. The accurate term is open weights. Click the pills below to see exactly which layer the three tiers of “openness” differ at.',
    conceptExEn: <>Open weights = giving you the <span className="hl">finished dish</span>, not the recipe</>,
    conceptExZh: <>You can reheat it (deploy) and recut it (fine-tune), but the kitchen is off-limits. Why does everyone hide the recipe? Training data is both a commercial company’s most expensive trump card and a copyright minefield — “open weights” is exactly the compromise between commercial interest and the open spirit. From here on this lesson uses one consistent vocabulary: <b>open weights vs closed API</b>.</>,

    tableTitle: '📖 Two Routes, Five Dimensions',
    tableLead: 'A closed API is like ordering takeout: order and eat anytime, pay as you go, but the kitchen is in someone else’s house; open weights is like cooking your own: the dish (the model) is free to take, but the pots and pans (GPUs) and the water and electricity (ops) are all yours to provide. Five dimensions in one table:',
    tableHead: ['Dimension', 'Closed API', 'Open weights'],
    tableRows: [
      { be: 'How you get it', closed: 'Register an account, send requests per the docs, running in minutes (hands-on in Lesson 26)', open: 'Download the weight files and deploy them to your own GPUs / servers (hands-on in Lesson 27)' },
      { be: 'Data privacy', closed: 'Data must be sent to the vendor’s servers — “off-network”', open: 'Can run fully locally, the data never leaves' },
      { be: 'Capability ceiling', closed: 'Frontier capabilities usually appear first in the closed flagships', open: 'Following close behind, and the gap is shrinking fast (see the R1 moment below)' },
      { be: 'Cost structure', closed: 'Billed per token, pay for what you use (OPEX, prices per the official site)', open: 'Weights are free, but GPUs, electricity, and ops staff are real money (CAPEX)' },
      { be: 'Customizability', closed: 'Limited: prompts + the limited fine-tuning interfaces the vendor opens up', open: 'Free: you can fine-tune, prune, and “hack” it into any shape' },
    ],

    mapTitle: '🗺️ Map at a Glance: who’s on which line (as of 2025)',
    mapLead: 'Below is a snapshot of the landscape as of 2025 — this field moves extremely fast, so check each player’s latest release for names and rankings. Remember the one-line positioning, don’t memorize benchmark scores. First, the three closed giants: the model stays in-house, the capability is sold as a service.',
    mapCards1: [
      { label: 'Closed API · USA', en: <>OpenAI <b>GPT</b></>, zh: 'The creator of ChatGPT, which brought large models into the public eye; the most complete lineup across chat, multimodal, and reasoning products, and still the industry bellwether.' },
      { label: 'Closed API · USA', en: <>Anthropic <b>Claude</b></>, zh: 'Built on AI safety research; long-context, coding, and Agent capabilities are its reputation, with very high stickiness among engineers.' },
      { label: 'Closed API · USA', en: <>Google <b>Gemini</b></>, zh: 'A natively multimodal route, backed by the full suite of Search, Android, and Office — unmatched on distribution channels.' },
    ],
    mapLead2: 'Now the open-weights camp: the model files are yours, deploy them however you like — and Chinese players are especially dense on this side.',
    mapCards2: [
      { label: 'Open weights · USA', en: <>Meta <b>Llama</b></>, zh: 'The leader who made “open weights” an industry norm, with the largest ecosystem of derivative models and tools; note its license carries commercial terms and is not a traditional open-source license.' },
      { label: 'Open weights · China', en: <>Alibaba <b>Qwen</b></>, zh: 'The Tongyi Qianwen family: one of the most complete size lineups and most frequently iterated open-weights series, with adoption among the world’s top in the global developer community.' },
      { label: 'Open weights · China', en: <>DeepSeek <b>深度求索</b></>, zh: 'The “king of cost-performance,” known for extreme engineering efficiency; R1 rewrote the narrative that “open weights are always a step behind” overnight (see the next section).' },
      { label: 'Open weights · Europe', en: <>Mistral <b>米斯特拉尔</b></>, zh: 'Europe’s flagship lone wolf, which started out “small and efficient” (an early champion of the MoE route), walking on two legs of open weights and a commercial API.' },
      { label: 'Open weights · China', en: <>Moonshot <b>Kimi</b></>, zh: 'A star startup that broke out with ultra-long context, joining the open-weights camp in 2025 with the K2 series.' },
      { label: 'Open weights · China', en: <>Zhipu <b>GLM</b></>, zh: 'Born of the Tsinghua lineage, one of the earliest teams in China to build bilingual Chinese-English large models, with the GLM series continually open and iterating.' },
    ],
    mapExEn: <>The boundaries between camps are <span className="hl">blurring</span></>,
    mapExZh: <>The three closed players each have open-weights branches too: Google has Gemma, and OpenAI also released gpt-oss in 2025. The two routes are a spectrum, not two fortresses — the same company often bets on both sides.</>,

    r1Title: '⚡ The DeepSeek-R1 Moment: the gap can be sharply compressed',
    r1Lead: 'Lesson 23 covered reasoning models: let the model “draft” first and then answer, trading test-time compute for intelligence. In January 2025, this storyline detonated in the open-weights camp — DeepSeek-R1 was released with open weights and a permissive license, its reasoning ability rivaling the strongest closed reasoning models at the time, while its training investment was far below what outsiders imagined a “frontier model” required (the exact numbers are disputed, but “much cheaper” is the consensus). Within a week it topped app-store charts in multiple countries and even shook US tech stocks. The shock wasn’t that it was “the strongest,” but that it proved: the moat of the closed lead may be far shallower than everyone assumed.',
    r1Before: { tag: 'The default assumption before R1', big: <>Open weights always trail closed by <span className="gap">one to two years</span></>, note: 'Frontier capabilities appear first in the closed flagships, and the open camp chases to replicate them. So the selection logic was crude: to get the strongest, you had to pay up and hand over data.' },
    r1After: { tag: 'The new consensus after R1', big: <>The gap can be <span className="hl">sharply compressed</span></>, note: 'The distance between the two routes is no longer a “generation gap” but a “lead” that can be closed at any time. The selection question shifts from “which is strongest” to “which fits best” — the next section gives you four questions.' },

    gaugeTitle: '🎛️ The Four Selection Questions: nudge the compass',
    gaugeLead: 'Real projects don’t require memorizing leaderboards, only answering four questions. Click the options on the right and watch which way the compass swings — note that the first question is a veto: when data can’t go off-network, the other three only decide “how to implement,” no longer “which side to choose.”',

    flipsTitle: '🎛️ Practice Scenarios: sort six projects',
    flipsLead: 'Use the four questions you just learned to judge the 6 real scenarios below: better suited to open weights or a closed API? Run through the four questions yourself first, then tap a card to check your answer.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: 'Open source (open weights) = free', good: 'The weights cost nothing, but the GPUs, electricity, and ops staff to run the model all cost money — it only pays off at high volume',
        why: <><b>Cause:</b> mistaking “free to download” for “free to use,” a thinking habit from the mobile-app era. Large models are power-hungry heavy assets: at low volume, a pay-per-token closed API is often cheaper instead; what open weights save is the pay-as-you-go fee, in exchange for a fixed investment — the tipping point is “volume.”</> },
      { bad: 'Closed must be stronger, open weights are just “making do”', good: 'It depends on the scenario: frontier reasoning is often led by the closed flagships, but for a great many everyday tasks open weights have long been more than enough',
        why: <><b>Cause:</b> staring only at the top of the leaderboard. Tasks like translation, summarization, customer support, and internal Q&A don’t need “the strongest” at all; good-enough, compliant, and cheap is the winner — and the R1 moment further proves the gap at the top can be compressed at any time. Selection is about “is the task good enough + are the constraints met,” not the No. 1 on the leaderboard.</> },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. A colleague says: “DeepSeek’s weights are free to download, so switching to it costs nothing at all.” What’s right and what’s wrong here?',
        a: <><b>“Free to download” is right, “costs nothing at all” is wrong.</b> Running the model yourself needs GPUs (bought or rented), electricity, and ops staff; at low volume, a pay-per-token API is often cheaper. The other path is using a DeepSeek API hosted on a third-party platform — but that returns to pay-as-you-go, just possibly at a lower unit price.</> },
      { q: '2. A law firm wants to build an internal contract Q&A tool: the material is highly sensitive, and the team has no GPU ops experience at all. Run through the four questions and give a direction.',
        a: <>The first question already triggers a <b>veto</b>: contracts can’t go off-network → the direction is locked to open weights that can be deployed locally / on-premise. “No ops” doesn’t change the direction, only the implementation: buy a vendor’s on-premise appliance, host on a private cloud, or outsource the deployment — start with a small model as a pilot, validate the results, then scale up.</> },
      { q: '3. Fill in the blanks: frontier capabilities usually appear first in ____; but for a great many everyday tasks, ____ is already more than enough. So the selection question changes from “which is strongest” to ____.',
        a: <><b>The closed flagships / open weights / “which fits best.”</b> This is also the greatest legacy of the DeepSeek-R1 moment: the gap can be sharply compressed, so blindly chasing “the strongest” is worse than honestly answering the four questions.</> },
    ],
  },
}

const GLYPH = { yes: '✓', half: '◐', no: '✕' }
const ICON = { yes: 'var(--sage)', half: 'var(--amber)', no: 'var(--fg-2)' }
const FILL = { yes: 'var(--sage-bg)', half: 'var(--amber-bg)', no: 'var(--bg-inset)' }
const EDGE = { yes: 'var(--sage)', half: 'var(--amber)', no: 'var(--hairline-strong)' }

function LadderDemo({ c }) {
  const [key, setKey] = useState('closed')
  const m = c.modes[key]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.ladderDemoTitle}</span>
        <span className="demo-hint">{c.ladderDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ladder-svg" viewBox="0 0 440 312" width="420" aria-label={c.ladderSvgAria}>
            {c.rows.map((row, i) => {
              const [st, note] = m.states[i]
              const y = 8 + i * 76, cy = y + 32
              const fgMain = st === 'no' ? 'var(--fg-2)' : 'var(--fg-0)'
              return (
                <g key={i} className="lrow">
                  <rect x="14" y={y} width="412" height="64" rx="10" fill={FILL[st]} stroke={EDGE[st]} strokeWidth="1.2" />
                  <circle cx="44" cy={cy} r="13" fill="none" stroke={ICON[st]} strokeWidth="1.6" />
                  <text x="44" y={cy + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill={ICON[st]}>{GLYPH[st]}</text>
                  <text x="70" y={cy - 5} fontSize="13.5" fontWeight="700" fill={fgMain}>{row}</text>
                  <text x="70" y={cy + 15} fontSize="11.5" fill="var(--fg-1)">{note}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.ladderChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{m.name}</h4>
          <div className="period">{m.period}</div>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

function GaugeDemo({ c }) {
  const QS = c.qs
  const [chosen, setChosen] = useState([0, 0, 0, 0])
  let open = 0, closed = 0, hard = false
  chosen.forEach((ci, i) => {
    const o = QS[i].opts[ci]
    if (o.side === 'open') open++; else closed++
    if (o.hard) hard = true
  })
  const cx = hard ? 392 : 220 + ((open - closed) / 4) * 170
  const markerFill = hard ? 'var(--terracotta)' : open > closed ? 'var(--sage)' : open < closed ? 'var(--sky)' : 'var(--amber)'

  let title, desc
  if (hard) { ({ title, desc } = c.verdict.hard) }
  else if (open > closed) { ({ title, desc } = c.verdict.open(open, closed)) }
  else if (closed > open) { ({ title, desc } = c.verdict.closed(open, closed)) }
  else { ({ title, desc } = c.verdict.tie) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.gaugeDemoTitle}</span>
        <span className="demo-hint">{c.gaugeDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="gauge-svg" viewBox="0 0 440 330" width="420" aria-label={c.gaugeSvgAria}>
            <text x="30" y="28" fontSize="13" fontWeight="700" fill="var(--sky)">{c.gaugeLeftLabel}</text>
            <text x="410" y="28" textAnchor="end" fontSize="13" fontWeight="700" fill="var(--sage)">{c.gaugeRightLabel}</text>
            <line x1="30" y1="58" x2="410" y2="58" stroke="var(--hairline-strong)" strokeWidth="6" strokeLinecap="round" />
            <line x1="220" y1="46" x2="220" y2="70" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle id="gauge-marker" cx={cx} cy="58" r="12" fill={markerFill} stroke="var(--bg-0)" strokeWidth="2.5" />
            {QS.map((q, i) => {
              const o = q.opts[chosen[i]]
              const y = 102 + i * 56
              let pull, color
              if (o.hard) { pull = c.pullHard; color = 'var(--terracotta)' }
              else if (o.side === 'open') { pull = c.pullOpen; color = 'var(--sage)' }
              else { pull = c.pullClosed; color = 'var(--sky)' }
              return (
                <g key={i}>
                  <rect x="20" y={y} width="400" height="40" rx="8" fill="var(--bg-inset)" stroke="var(--hairline)" />
                  <text x="36" y={y + 25} fontSize="12.5" fontWeight="600" fill="var(--fg-0)">{q.name}{c.qSep}{o.t}</text>
                  <text x="404" y={y + 25} textAnchor="end" fontSize="12.5" fontWeight="700" fill={color}>{pull}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          {QS.map((q, qi) => (
            <div key={qi} className="qrow">
              <div className="qlabel">{q.label}</div>
              <div className="chips">
                {q.opts.map((o, oi) => (
                  <button key={oi} className={`chip${chosen[qi] === oi ? ' active' : ''}`} onClick={() => setChosen((cc) => cc.map((v, j) => (j === qi ? oi : v)))}>{o.t}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="verdict">
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function L25() {
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
        <LadderDemo c={c} />
        <div className="example mt14">
          <div className="en">{c.conceptExEn}</div>
          <div className="zh">{c.conceptExZh}</div>
        </div>
      </Lsec>

      <Lsec title={c.tableTitle} lead={c.tableLead}>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.tableHead[0]}</th><th>{c.tableHead[1]}</th><th>{c.tableHead[2]}</th></tr></thead>
            <tbody>
              {c.tableRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td>{r.closed}</td><td className="ex">{r.open}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec title={c.mapTitle} lead={c.mapLead}>
        <div className="use-grid">
          {c.mapCards1.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.mapLead2}</p>
        <div className="use-grid">
          {c.mapCards2.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.mapExEn}</div>
          <div className="zh">{c.mapExZh}</div>
        </div>
      </Lsec>

      <Lsec title={c.r1Title} lead={c.r1Lead}>
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.r1Before.tag}</span></div>
            <div className="big">{c.r1Before.big}</div>
            <p className="note">{c.r1Before.note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.r1After.tag}</span></div>
            <div className="big">{c.r1After.big}</div>
            <p className="note">{c.r1After.note}</p>
          </div>
        </div>
      </Lsec>

      <Lsec title={c.gaugeTitle} lead={c.gaugeLead}>
        <GaugeDemo c={c} />
      </Lsec>

      <Lsec title={c.flipsTitle} lead={c.flipsLead}>
        <div className="flip-grid">
          {c.flips.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
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
