import { useState, useRef, useEffect } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 静态高亮代码块：内容由本课作者掌控，安全
function Code({ html }) {
  return (
    <pre className="code">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 代码块标识符、API、函数名逐字不变；仅中文注释与中文展示字符串双语化。
const C = {
  zh: {
    codeFull: `import os
from openai import OpenAI                <span class="cm"># ① 先 pip install openai</span>

client = OpenAI(
    api_key=os.environ[<span class="str">"API_KEY"</span>],       <span class="cm"># ① key 读自环境变量，绝不写死在代码里</span>
    <span class="cm"># base_url="https://…/v1",           # 想连别家模型？通常改这行 + key 即可</span>
)

messages = [                             <span class="cm"># ③ 对话历史，从"人物小传"开始</span>
    {<span class="str">"role"</span>: <span class="str">"system"</span>, <span class="str">"content"</span>: <span class="str">"你是一位耐心的中文 AI 助教，回答简洁。"</span>}
]

print(<span class="str">"开始聊天吧（输入 quit 退出）"</span>)
while True:                              <span class="cm"># ④ 多轮对话 = 一个循环 + 一个 list</span>
    user_input = input(<span class="str">"\\n你："</span>)
    if user_input.strip() == <span class="str">"quit"</span>:
        break
    messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})

    stream = client.chat.completions.create(
        model=<span class="str">"gpt-4o-mini"</span>,             <span class="cm"># ② 用哪个模型，写名字就行</span>
        messages=messages,               <span class="cm"># ④ 注意：每轮都发"全部"历史</span>
        stream=True,                     <span class="cm"># ⑤ 流式：边生成边返回</span>
    )

    reply = <span class="str">""</span>
    print(<span class="str">"AI："</span>, end=<span class="str">""</span>)
    for chunk in stream:                 <span class="cm"># ⑤ 一小块一小块地收</span>
        piece = chunk.choices[0].delta.content or <span class="str">""</span>
        print(piece, end=<span class="str">""</span>, flush=True)
        reply += piece

    messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})  <span class="cm"># ④ 回复也存进历史</span>
    print()`,
    code1: `<span class="cm"># 终端里执行：</span>
pip install openai                       <span class="cm"># 装官方 SDK，一行搞定</span>

<span class="cm"># macOS / Linux：把 key 存进环境变量（仅当前终端生效）</span>
export API_KEY=<span class="str">"sk-…你的密钥…"</span>
<span class="cm"># Windows PowerShell 写法：$env:API_KEY = "sk-…"</span>`,
    code2: `resp = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>,                <span class="cm"># 点哪道"菜"：模型名（能力、价格各不同）</span>
    messages=[
        {<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: <span class="str">"用一句话解释 token 是什么"</span>}
    ],
)
print(resp.choices[0].message.content)   <span class="cm"># 模型的回复藏在这里</span>`,
    code3: `messages = [
    {<span class="str">"role"</span>: <span class="str">"system"</span>,    <span class="str">"content"</span>: <span class="str">"你是一位毒舌影评人，嘴狠但在理。"</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"《流浪地球》好看吗？"</span>},
    {<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: <span class="str">"特效在线。剧本嘛……我们还是聊特效吧。"</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"那第二部呢？"</span>},
]`,
    code4: `messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})       <span class="cm"># 你说的，存进去</span>
stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages)                  <span class="cm"># 整个列表全量重发！</span>
messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})    <span class="cm"># 它说的，也存进去</span>`,
    code5: `stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages,
    stream=True,                         <span class="cm"># 打开流式开关</span>
)
for chunk in stream:                     <span class="cm"># 每个 chunk 带着刚生成的几个字</span>
    print(chunk.choices[0].delta.content or <span class="str">""</span>, end=<span class="str">""</span>, flush=True)`,

    stream: {
      full: '「token」是模型读写文字的最小单位。它不是想好整句话再说，而是一个 token 一个 token 地往外吐 —— 流式输出只是把这个过程原样直播给你。',
      waiting: '（等待发送…）',
      waitResp: '⏳ 等待响应',
      sentReq: '请求已发出…',
      sStatFirstA: '首字出现：',
      sStatFirstB: '约 0.3 秒',
      sStatFullA: ' · 全文完成：约 ',
      sStatFullB: ' 秒',
      nStatFirstA: '首字出现：',
      nStatFirstB: '约 ',
      nStatFirstC: ' 秒',
      nStatFirstD: ' —— 全文一次到齐，前面全在干等',
      sStatLiveA: '首字出现：',
      sStatLiveB: '0.3 秒',
      sStatLiveC: ' ✓ 已经在读了',
      demoTitle: '🎛️ 小演示 · 流式 vs 非流式',
      demoHint: '同一个回答，两种返回方式，同时发出',
      termLabelS: 'stream=True · 边生成边发',
      termLabelN: 'stream=False · 生成完再发',
      btnReplay: '↻ 再放一遍',
      btnPlay: '▶ 同时发出两个请求',
    },

    cost: {
      wan: ' 万',
      demoTitle: '🎛️ 算一算 · 聊到第几轮，一共花多少钱？',
      demoHint: '费率与 token 数均为数量级示例，以官网为准',
      svgAria: '柱状图：每一轮要重发的输入 token 随轮数线性增长',
      titlePrefix: '第 ',
      titleMid: ' 轮：要重发约 ',
      titleSuffix: ' token',
      axis1: '第 1 轮',
      axis30: '第 30 轮',
      axisLabel: '每根柱子 = 该轮要重发的输入 token（历史越长越贵）',
      sliderLabel: '对话轮数',
      assume: '假设每轮你说约 200 token、AI 答约 200 token；费率取上文示例值。',
      statThisRound: '这一轮要重发的输入',
      statCum: '累计消耗 token',
      statFee: '累计估算费用',
      tokUnit: ' token',
      noteSmall: '不到 1 分钱 —— 单聊确实便宜。',
      noteMid: '几分钱量级 —— 仍然便宜，但注意柱子越长越高。',
      noteBig: '几毛钱量级 —— 想象 Agent 一天自动跑几百轮，再乘以用户数。',
    },

    mem: {
      sysText: '你是一位耐心的 AI 课程助教',
      rounds: [
        { u: '我叫小拓，刚开始学 AI。', a: '你好小拓！欢迎入坑，想先聊点什么？',
          desc: '你的话和它的回复都被 append 进了 list。注意：刚才发出去的是整个列表（system + 你这句），不止一句话。' },
        { u: '我叫什么名字？', a: '你叫小拓 —— 上一句你刚说过呀。',
          desc: '它"记得"名字，不是因为记性好，而是带名字的那条消息刚刚又被你的代码原封不动重发了一遍。剪刀已解锁 ✂️' },
        { u: '再问一遍：我叫什么？', a: null, desc: null },
      ],
      initTitle: '初始状态',
      initDesc: 'messages 里只有一条 system —— 给模型的人物小传。右边的云端什么都不知道，也什么都不会记。',
      startHint: '点「发送下一轮」开始',
      sentMsgsA: '本轮发送 ',
      sentMsgsB: ' 条消息',
      tokApproxA: '约 ',
      tokApproxB: ' token（粗算）',
      lastCut: '抱歉，这段对话里没出现过你的名字……',
      lastNoCut: '还是小拓呀，这是你第三次问了。',
      lastCutDesc: '失忆实锤：带名字的消息被你删了，而模型那头从来就没存过任何东西。所谓"记忆"，就是你代码里那个 list —— 第 17 课验证完毕。',
      lastNoCutDesc: '历史还在 list 里，它就永远"记得"。点「重置」，这次在第 3 轮之前先点 ✂️ 砍掉历史，再看看它的反应。',
      titleSentA: '第 ',
      titleSentB: ' 轮已发送',
      aiPrefix: 'AI：「',
      aiMid: '」 — ',
      titleDoneA: '演示结束 · 第 ',
      titleDoneB: ' 轮',
      cutTitle: '历史已删除',
      cutDesc: '✂️ 第 1、2 轮被你从 list 里删掉了（只留 system）。注意模型那边毫无反应 —— 它本来就什么都没存。现在发送第 3 轮试试。',
      cutStats: '已删除 4 条历史',
      demoTitle: '🎛️ 交互演示 · messages 列表与"失忆"实验',
      demoHint: '点「发送下一轮」推进剧情；第 3 轮前可以动剪刀',
      svgAria: '左侧为代码中的 messages 列表，右侧为无状态的云端模型，每轮请求全量重发列表',
      codeHeader: '你的代码里：messages = [ … ]',
      arrowResend: '全量重发',
      arrowReply: '新回复',
      cloud: '☁️ 云端模型',
      cloudSub1: '无状态 · 处理完即忘',
      cloudSub2: '什么都不存',
      btnSend: '▸ 发送下一轮',
      btnCut: '✂️ 砍掉历史',
      btnReset: '↺ 重置',
    },

    goalsTitle: '🎯 你将学会',
    goals: [
      '跑通人生第一次大模型 API 调用：装 SDK、配 key、发请求、收回复',
      '读懂 model / messages / role 三个核心参数，看穿"多轮记忆"其实是你代码里的一个 list',
      '会用流式输出，并能粗算一次对话大概花多少钱',
      '记牢 API key 的三条安全底线，避开新手最贵的翻车现场',
    ],

    conceptTitle: '💡 核心概念：所谓"做 AI 应用"，本质是发一个 HTTP 请求',
    conceptLead: <>前 25 课你看着别人造模型：万亿 token 预训练（第 12 课）、RLHF 对齐（第 13 课）、烧掉的电够一座城用。好消息是：那都是<b>造模型的人</b>的事。<b>用模型的人</b>只需要会一件事 —— 把一段文字发给云端，把生成的文字收回来。整件事，30 行 Python 写完。</>,
    contrastTag1: '想象中',
    contrastBig1: <>做 AI 应用 <span className="gap">=</span> 读论文、买显卡、训练模型</>,
    contrastNote1: '那是第 12、13 课"造模型"的剧情 —— 烧的是大厂的钱，暂时轮不到你操心。',
    contrastTag2: '实际上',
    contrastBig2: <>做 AI 应用 <span className="gap">=</span> <span className="hl">发一个 HTTP 请求，拿回一段文字</span></>,
    contrastNote2: '模型早已训练好、部署好，按 token 出租。你要做的只是"点菜"。',
    fullLead: '先把完整代码端上来 —— 一个能在终端里持续对话的聊天机器人。看不懂没关系，下一节逐段拆：',
    fullDemoTitle: '📄 chat.py · 完整可运行（约 30 行）',
    fullDemoHint: '注释里的 ①–⑤ 对应下一节的五个段落',
    footnote: '本课用 Python + OpenAI 兼容风格的 SDK 演示。Anthropic 等各家官方 SDK 形态大同小异（都是"建客户端 → 传 model 和 messages → 收回复"）；DeepSeek、Qwen、Kimi 等很多国产模型直接兼容这套接口 —— 改 base_url 和 key 就能连。',

    breakdownTitle: '🔍 逐段拆解：30 行代码，5 个段落',
    breakdownLead: '每一段先上代码，再说人话。读完这节，上面那 30 行对你就没有秘密了。',
    seg1Title: '装 SDK，把 key 藏进环境变量',
    seg1P: <>先去模型厂商的开发者控制台注册、生成一个 <b>API key</b> —— 一串通常以 sk- 开头的长字符串。它同时是你的<b>身份证</b>和<b>银行卡</b>：服务器靠它认出你是谁，也靠它从你账户里扣费。所以第一条纪律现在就立下：<b>key 只放环境变量（或密钥管理服务），永远不写进代码</b>。代码里那句 <code>os.environ["API_KEY"]</code> 就是"运行时再去环境里取"的意思 —— 代码可以发给任何人看，key 不行。</>,
    seg2Title: '发起一次对话请求：model 和 messages',
    seg2P: <>剥掉 SDK 的糖衣，这就是一个 <b>HTTPS POST 请求</b>：把一段 JSON 发到厂商的服务器，几秒后收到一段 JSON 回复，SDK 只是帮你拼参数、拆响应。必填的只有两个：<b>model</b> 是菜单上的菜名 —— 各家型号能力和价格差几十倍（第 25 课的版图派上用场了）；<b>messages</b> 是对话内容，一个列表。回复套在 <code>choices[0].message.content</code> 里，看着绕，背下来就行。</>,
    seg3Title: 'messages 与三种 role：一场三人剧本',
    seg3P: 'messages 里每条消息都标着 role —— 谁在说话：',
    seg3Th: ['role', '谁在说话', '拿来干什么'],
    seg3Rows: [
      { role: 'system', who: '导演', ex: <>给模型的"人物小传"：身份、语气、规矩。第 16 课的提示工程，主战场就在这一条。</> },
      { role: 'user', who: '用户', ex: <>你（或你的用户）每一轮说的话。</> },
      { role: 'assistant', who: '模型', ex: <>模型以前的回复。注意：多轮对话时，是<b>你的代码</b>把它塞回列表里的。</> },
    ],
    seg4Title: '多轮对话的真相：自己维护 list，每轮全量重发',
    seg4P: <>第 17 课埋的伏笔在这里兑现：<b>API 服务器完全无状态</b> —— 每个请求都是孤立的，处理完即忘，它连"上一轮"这个概念都没有。想"接着聊"，唯一的办法是你自己维护 messages 列表，<b>每一轮把全部历史原封不动重发一遍</b>。两个直接推论：一，越聊越贵（历史越长，输入 token 越多）；二，把历史从 list 里删掉，它就当场"失忆"。这两件事，下面的交互演示都能亲手验证。</>,
    seg5Title: '流式输出：体感快的秘密',
    seg5P: <>第 10 课讲过：模型本来就是<b>一个 token 一个 token</b> 往外吐的。非流式 = 等它全部吐完，打包发给你；流式 = 吐一点立刻推一点。<b>总耗时几乎一样，但"第一个字出现的时间"天差地别</b> —— ChatGPT 的打字机效果不是装酷，是体验刚需。眼见为实：</>,

    priceTitle: '💸 价格直觉，外加三条保命规则',
    priceLead: <>第一次绑卡充值前，先建立数量级直觉。账单只看两个数：<b>你发进去多少 token，它新生成多少 token</b>（第 11 课说过，token 是大模型世界的计量单位）。本课唯一的式子：</>,
    formula: '费用 ＝ 输入 token 数 × 输入单价 ＋ 输出 token 数 × 输出单价',
    priceP1: <><b>输入</b>指你发出的整个 messages —— 含 system 和全部历史，这就是"越聊越贵"的根源；<b>输出</b>指模型新生成的内容，单价通常比输入贵几倍。单价按"每百万 token"标价，<b>随时在变，以官网为准</b>。拿一组数量级示例算一笔：设输入 ¥2 / 百万 token、输出 ¥8 / 百万 token，一次普通问答（输入 500 + 输出 300 token）≈ 500×¥0.000002 ＋ 300×¥0.000008 ≈ <b>¥0.003，三厘钱</b>。结论：单次对话通常不到几分钱 —— 但别急着放心，拖拖下面的滑块：</>,
    priceP2: <>看到柱子的形状了吗？因为全量重发，<b>每一轮的开销都比上一轮高</b>。即便如此，人对人聊天 30 轮也才几毛钱。真正烧钱的是第 20 课的 <b>Agent 循环</b>：一次任务自己跑几十轮，每轮还塞进大段工具结果和文档 —— 消耗直接跳一到两个数量级。写循环调 API 之前，先在控制台设好<b>用量上限</b>。</>,
    priceP3: <><b>然后是三条保命规则。</b>每年都有新手把 key 写进代码传上 GitHub，几分钟内被扫 key 爬虫捡走，醒来收到一张天价账单 —— 别做下一个：</>,
    rules: [
      { label: '规则一', en: <>key <b>不进代码仓库</b></>, zh: '环境变量或密钥管理服务才是 key 的家。一旦 push 到公开仓库，就当它已经泄露 —— 扫 key 的爬虫比你的同事先看到。' },
      { label: '规则二', en: <>key <b>不进前端页面</b></>, zh: '网页、小程序里的代码人人可看。正确姿势：前端只跟你自己的后端说话，由后端拿着 key 代发请求。' },
      { label: '规则三', en: <>泄露<b>立刻吊销重发</b></>, zh: '别抱侥幸。控制台里一键吊销旧 key、生成新 key，再检查账单 —— 处理流程对标"银行卡密码泄露"。' },
    ],

    memSecTitle: '🎛️ 交互演示：亲手戳破"记忆"的幻觉',
    memSecLead: <>第 ④ 段说"记忆只是你代码里的 list"，现在亲手验证。左边是你代码里的 messages 列表，右边是云端模型。<b>推进三轮对话，在第 3 轮之前试试那把剪刀</b> —— 看看删掉 list 里的历史后，模型还"记得"你吗。</>,

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '调 API 就等于把我的数据送去训练模型了',
        good: '主流厂商的 API 数据默认不用于训练 —— 但各家政策不同，务必读数据条款',
        why: <><b>病因：</b>把"免费聊天产品"和"API"混为一谈。面向消费者的免费产品，有的确实会用对话改进模型（通常可关闭）；而 API 走的是商用条款，主流厂商默认不拿请求数据训练。涉及公司机密或用户隐私时，别靠印象 —— 打开数据政策逐条核对，必要时签企业协议。</>,
      },
      {
        bad: '代码在我电脑上跑，所以模型也在我电脑上跑',
        good: '推理发生在云端 GPU 集群，你的 30 行代码只是发了一个 HTTP 请求',
        why: <><b>病因：</b>回复打印在自己的终端里，造成"计算就在本地"的错觉。其实你的代码是"点菜"，做菜的是厂商机房里成排的 GPU —— 这也是断网就用不了、每次调用都花钱的原因。想让模型真正在自己电脑上跑？这正是下一课的主题。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quizLead: '三个改造方向，每个都只动一两行代码 —— 但各自回收一节前面的课。',
    quiz: [
      {
        q: '1. 把 chat.py 第 11 行的 system 内容改成"毒舌影评人"，再聊几句电影。观察什么变了、什么没变？',
        a: <>比如改成 <b>"你是一位毒舌影评人，嘴狠但在理，拒绝商业互吹。"</b> 你会发现整场对话的人设、语气全变了，而你每轮的提问方式完全不用改 —— 这就是 system 作为"人物小传"的威力（第 16 课）：写一次，管全场，不必每轮重复。</>,
      },
      {
        q: '2. 在 create() 里加 temperature 参数，分别用 0.2 和 1.2，把同一个问题各问 5 次。预测一下两组答案的差别？',
        a: <><b>低温（0.2）：5 次答案几乎一模一样</b>，稳定、保守，适合查事实、写代码；<b>高温（1.2）：5 次五花八门</b>，适合头脑风暴。原理是第 14 课的采样温度 —— 温度只改变"抽签"的胆量。注意各家参数取值范围和默认值略有差异，以文档为准。</>,
      },
      {
        q: '3. 在发送前加一行 messages = [messages[0], messages[-1]]（只留 system 和你最新一句），它会怎样？',
        a: <>它会<b>当场"失忆"</b>：之前聊过的名字、话题全部不认账 —— 因为对模型来说，没被发来的消息从未存在过。这验证了第 17 课：模型无状态，"记忆"全在你代码的 list 里。顺带这也是最朴素的省 token 手段；正经做法叫"上下文管理"：保留 system + 摘要 + 最近几轮。</>,
      },
    ],
  },

  en: {
    codeFull: `import os
from openai import OpenAI                <span class="cm"># ① first run pip install openai</span>

client = OpenAI(
    api_key=os.environ[<span class="str">"API_KEY"</span>],       <span class="cm"># ① key read from an env var, never hard-coded</span>
    <span class="cm"># base_url="https://…/v1",           # want another vendor's model? usually just change this line + key</span>
)

messages = [                             <span class="cm"># ③ chat history, starting from the "character bio"</span>
    {<span class="str">"role"</span>: <span class="str">"system"</span>, <span class="str">"content"</span>: <span class="str">"You are a patient AI teaching assistant; keep answers concise."</span>}
]

print(<span class="str">"Let's chat (type quit to exit)"</span>)
while True:                              <span class="cm"># ④ multi-turn chat = one loop + one list</span>
    user_input = input(<span class="str">"\\nYou: "</span>)
    if user_input.strip() == <span class="str">"quit"</span>:
        break
    messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})

    stream = client.chat.completions.create(
        model=<span class="str">"gpt-4o-mini"</span>,             <span class="cm"># ② which model to use — just write its name</span>
        messages=messages,               <span class="cm"># ④ note: every turn sends the "entire" history</span>
        stream=True,                     <span class="cm"># ⑤ streaming: return as it generates</span>
    )

    reply = <span class="str">""</span>
    print(<span class="str">"AI: "</span>, end=<span class="str">""</span>)
    for chunk in stream:                 <span class="cm"># ⑤ receive piece by piece</span>
        piece = chunk.choices[0].delta.content or <span class="str">""</span>
        print(piece, end=<span class="str">""</span>, flush=True)
        reply += piece

    messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})  <span class="cm"># ④ store the reply into history too</span>
    print()`,
    code1: `<span class="cm"># run in the terminal:</span>
pip install openai                       <span class="cm"># install the official SDK, one line</span>

<span class="cm"># macOS / Linux: store the key in an env var (current terminal only)</span>
export API_KEY=<span class="str">"sk-…your secret key…"</span>
<span class="cm"># Windows PowerShell syntax: $env:API_KEY = "sk-…"</span>`,
    code2: `resp = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>,                <span class="cm"># which "dish" to order: the model name (capability and price vary)</span>
    messages=[
        {<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: <span class="str">"Explain in one sentence what a token is"</span>}
    ],
)
print(resp.choices[0].message.content)   <span class="cm"># the model's reply is hidden in here</span>`,
    code3: `messages = [
    {<span class="str">"role"</span>: <span class="str">"system"</span>,    <span class="str">"content"</span>: <span class="str">"You are a savage film critic — sharp-tongued but on point."</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"Is The Wandering Earth any good?"</span>},
    {<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: <span class="str">"The effects deliver. The script… let's just talk about the effects."</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"And the sequel?"</span>},
]`,
    code4: `messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})       <span class="cm"># what you said, stored in</span>
stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages)                  <span class="cm"># the whole list is resent in full!</span>
messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})    <span class="cm"># what it said, stored in too</span>`,
    code5: `stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages,
    stream=True,                         <span class="cm"># flip on the streaming switch</span>
)
for chunk in stream:                     <span class="cm"># each chunk carries the few chars just generated</span>
    print(chunk.choices[0].delta.content or <span class="str">""</span>, end=<span class="str">""</span>, flush=True)`,

    stream: {
      full: 'A "token" is the smallest unit a model reads and writes text in. It doesn\'t think out a whole sentence first; it spits out one token at a time — streaming simply broadcasts that process to you as it happens.',
      waiting: '(waiting to send…)',
      waitResp: '⏳ waiting for response',
      sentReq: 'request sent…',
      sStatFirstA: 'First char appears: ',
      sStatFirstB: 'about 0.3s',
      sStatFullA: ' · full text done: about ',
      sStatFullB: 's',
      nStatFirstA: 'First char appears: ',
      nStatFirstB: 'about ',
      nStatFirstC: 's',
      nStatFirstD: ' — the full text arrives all at once, everything before is dead waiting',
      sStatLiveA: 'First char appears: ',
      sStatLiveB: '0.3s',
      sStatLiveC: ' ✓ already reading',
      demoTitle: '🎛️ Mini Demo · streaming vs non-streaming',
      demoHint: 'Same answer, two return modes, sent at the same time',
      termLabelS: 'stream=True · send as it generates',
      termLabelN: 'stream=False · send after generating',
      btnReplay: '↻ Play again',
      btnPlay: '▶ Send both requests at once',
    },

    cost: {
      wan: 'k',
      demoTitle: '🎛️ Do the Math · how much does it cost by turn N?',
      demoHint: 'Rates and token counts are order-of-magnitude examples; check the official site',
      svgAria: 'Bar chart: the input tokens resent each turn grow linearly with the number of turns',
      titlePrefix: 'Turn ',
      titleMid: ': about ',
      titleSuffix: ' tokens to resend',
      axis1: 'Turn 1',
      axis30: 'Turn 30',
      axisLabel: 'Each bar = input tokens resent that turn (longer history, more expensive)',
      sliderLabel: 'Number of turns',
      assume: 'Assume each turn you say ~200 tokens and the AI answers ~200 tokens; rates use the example values above.',
      statThisRound: 'Input to resend this turn',
      statCum: 'Cumulative tokens used',
      statFee: 'Cumulative estimated cost',
      tokUnit: ' tokens',
      noteSmall: 'Less than a cent — single chats really are cheap.',
      noteMid: 'A few cents — still cheap, but watch the bars getting taller.',
      noteBig: 'A few dimes — imagine an Agent running hundreds of turns a day, times your user count.',
    },

    mem: {
      sysText: 'You are a patient AI course teaching assistant',
      rounds: [
        { u: 'I\'m Tuo, just starting to learn AI.', a: 'Hi Tuo! Welcome aboard — what would you like to talk about first?',
          desc: 'Both your message and its reply were appended into the list. Note: what just got sent was the entire list (system + your line), not a single message.' },
        { u: 'What\'s my name?', a: 'You\'re Tuo — you just said so in the previous line.',
          desc: 'It "remembers" the name not because of a good memory, but because the message containing the name was just resent verbatim by your code. The scissors are unlocked ✂️' },
        { u: 'Asking again: what\'s my name?', a: null, desc: null },
      ],
      initTitle: 'Initial state',
      initDesc: 'messages contains only one system entry — the character bio for the model. The cloud on the right knows nothing and remembers nothing.',
      startHint: 'Click "Send next turn" to start',
      sentMsgsA: 'Sent ',
      sentMsgsB: ' messages this turn',
      tokApproxA: 'about ',
      tokApproxB: ' tokens (rough)',
      lastCut: 'Sorry, your name never appeared in this conversation…',
      lastNoCut: 'Still Tuo — that\'s the third time you\'ve asked.',
      lastCutDesc: 'Amnesia confirmed: you deleted the message with the name, and the model side never stored anything in the first place. So-called "memory" is just that list in your code — Lesson 17 verified.',
      lastNoCutDesc: 'As long as the history stays in the list, it "remembers" forever. Click "Reset," and this time hit ✂️ to cut the history before turn 3, then watch its reaction.',
      titleSentA: 'Turn ',
      titleSentB: ' sent',
      aiPrefix: 'AI: "',
      aiMid: '" — ',
      titleDoneA: 'Demo over · turn ',
      titleDoneB: '',
      cutTitle: 'History deleted',
      cutDesc: '✂️ You deleted turns 1 and 2 from the list (only system left). Notice the model side doesn\'t react at all — it never stored anything anyway. Now try sending turn 3.',
      cutStats: 'Deleted 4 history entries',
      demoTitle: '🎛️ Interactive · the messages list & the "amnesia" experiment',
      demoHint: 'Click "Send next turn" to advance; you can use the scissors before turn 3',
      svgAria: 'On the left is the messages list in code; on the right is the stateless cloud model, with each request resending the full list',
      codeHeader: 'In your code: messages = [ … ]',
      arrowResend: 'resend in full',
      arrowReply: 'new reply',
      cloud: '☁️ Cloud model',
      cloudSub1: 'Stateless · forgets once done',
      cloudSub2: 'Stores nothing',
      btnSend: '▸ Send next turn',
      btnCut: '✂️ Cut the history',
      btnReset: '↺ Reset',
    },

    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      'Make your first-ever LLM API call work end to end: install the SDK, set the key, send the request, get the reply',
      'Understand the three core parameters model / messages / role, and see that "multi-turn memory" is really just a list in your code',
      'Use streaming output, and roughly estimate how much one conversation costs',
      'Lock in the three security bottom lines for an API key, and dodge the most expensive beginner blowup',
    ],

    conceptTitle: '💡 Core Idea: "building an AI app" is essentially sending one HTTP request',
    conceptLead: <>For the past 25 lessons you watched others build models: trillion-token pretraining (Lesson 12), RLHF alignment (Lesson 13), enough electricity burned to power a city. Good news: that's all the job of <b>the people who build models</b>. <b>People who use models</b> only need to know one thing — send some text to the cloud, get the generated text back. The whole thing fits in 30 lines of Python.</>,
    contrastTag1: 'Imagined',
    contrastBig1: <>Building an AI app <span className="gap">=</span> reading papers, buying GPUs, training models</>,
    contrastNote1: 'That\'s the "building models" storyline from Lessons 12 and 13 — it burns big tech\'s money, not your concern for now.',
    contrastTag2: 'In reality',
    contrastBig2: <>Building an AI app <span className="gap">=</span> <span className="hl">sending one HTTP request, getting back some text</span></>,
    contrastNote2: 'The model is long trained and deployed, rented out by the token. All you do is "order off the menu."',
    fullLead: 'Let\'s put the complete code on the table first — a chatbot that holds a continuous conversation in your terminal. It\'s fine if it doesn\'t make sense yet; the next section breaks it down piece by piece:',
    fullDemoTitle: '📄 chat.py · complete and runnable (~30 lines)',
    fullDemoHint: 'The ①–⑤ in the comments map to the five paragraphs in the next section',
    footnote: 'This lesson demonstrates with Python + an OpenAI-compatible-style SDK. Official SDKs from Anthropic and others are largely similar (all "create a client → pass model and messages → get the reply"); many domestic models like DeepSeek, Qwen, and Kimi are directly compatible with this interface — change base_url and key to connect.',

    breakdownTitle: '🔍 Line-by-Line: 30 lines of code, 5 paragraphs',
    breakdownLead: 'Each part shows the code first, then plain talk. After this section, those 30 lines hold no secrets for you.',
    seg1Title: 'Install the SDK, hide the key in an env var',
    seg1P: <>First go to the model vendor's developer console to register and generate an <b>API key</b> — a long string usually starting with sk-. It's both your <b>ID card</b> and your <b>bank card</b>: the server uses it to recognize who you are, and to bill your account. So the first discipline is set right now: <b>keep the key only in env vars (or a secrets manager), never in code</b>. That line <code>os.environ["API_KEY"]</code> means "fetch it from the environment at runtime" — you can show your code to anyone, but not the key.</>,
    seg2Title: 'Make one chat request: model and messages',
    seg2P: <>Strip away the SDK's sugar and this is just an <b>HTTPS POST request</b>: send a chunk of JSON to the vendor's server, get a chunk of JSON back a few seconds later; the SDK just assembles the params and unpacks the response. Only two fields are required: <b>model</b> is the dish name on the menu — capabilities and prices differ by tens of times across models (Lesson 25's map comes in handy); <b>messages</b> is the conversation content, a list. The reply is wrapped in <code>choices[0].message.content</code> — looks roundabout, just memorize it.</>,
    seg3Title: 'messages and the three roles: a three-character script',
    seg3P: 'Every message in messages is labeled with a role — who\'s speaking:',
    seg3Th: ['role', 'who\'s speaking', 'what it\'s for'],
    seg3Rows: [
      { role: 'system', who: 'director', ex: <>The "character bio" for the model: identity, tone, rules. The prompt engineering of Lesson 16 plays out mainly on this one entry.</> },
      { role: 'user', who: 'user', ex: <>What you (or your user) say each turn.</> },
      { role: 'assistant', who: 'model', ex: <>The model's previous replies. Note: in multi-turn chats, it's <b>your code</b> that stuffs them back into the list.</> },
    ],
    seg4Title: 'The truth about multi-turn chat: you maintain the list, resending it all each turn',
    seg4P: <>The hook planted in Lesson 17 pays off here: <b>the API server is completely stateless</b> — every request is isolated, forgotten once handled; it doesn't even have a concept of "the previous turn." To "keep chatting," the only way is to maintain the messages list yourself and <b>resend the entire history verbatim every turn</b>. Two direct corollaries: one, the longer you chat the more it costs (longer history, more input tokens); two, delete the history from the list and it instantly "loses its memory." Both can be verified by hand in the interactive demo below.</>,
    seg5Title: 'Streaming output: the secret to feeling fast',
    seg5P: <>Lesson 10 covered it: the model spits out text <b>one token at a time</b> by nature. Non-streaming = wait until it's all out, then package and send to you; streaming = push a bit the moment it's out. <b>Total time is nearly the same, but "the time the first character appears" is worlds apart</b> — ChatGPT's typewriter effect isn't for show, it's an experience essential. Seeing is believing:</>,

    priceTitle: '💸 Price Intuition, plus three life-saving rules',
    priceLead: <>Before topping up with a card for the first time, build order-of-magnitude intuition. The bill looks at only two numbers: <b>how many tokens you send in, how many it newly generates</b> (as Lesson 11 said, the token is the unit of measure in the LLM world). The lesson's one and only formula:</>,
    formula: 'Cost ＝ input token count × input unit price ＋ output token count × output unit price',
    priceP1: <><b>Input</b> means the entire messages you send — including system and the full history; this is the root of "the longer you chat the more it costs." <b>Output</b> means what the model newly generates, with a unit price usually several times higher than input. Unit prices are quoted "per million tokens" and <b>change anytime — check the official site</b>. With one set of order-of-magnitude examples: say input ¥2 / million tokens, output ¥8 / million tokens, one ordinary Q&A (input 500 + output 300 tokens) ≈ 500×¥0.000002 ＋ 300×¥0.000008 ≈ <b>¥0.003, three-tenths of a cent</b>. Conclusion: a single conversation usually costs less than a few cents — but don't relax just yet, drag the slider below:</>,
    priceP2: <>See the shape of the bars? Because everything is resent in full, <b>every turn costs more than the last</b>. Even so, 30 turns of human-to-human chat is only a few dimes. What really burns money is the <b>Agent loop</b> from Lesson 20: one task runs itself for dozens of turns, each stuffing in big chunks of tool results and documents — the consumption jumps one to two orders of magnitude. Before writing a loop that calls the API, set a <b>usage limit</b> in the console first.</>,
    priceP3: <><b>Then the three life-saving rules.</b> Every year a beginner writes the key into code and pushes it to GitHub; within minutes a key-scanning crawler grabs it, and they wake up to a sky-high bill — don't be the next one:</>,
    rules: [
      { label: 'Rule 1', en: <>key <b>stays out of the repo</b></>, zh: 'Env vars or a secrets manager are the key\'s home. Once pushed to a public repo, treat it as already leaked — the key-scanning crawlers see it before your coworkers do.' },
      { label: 'Rule 2', en: <>key <b>stays out of the frontend</b></>, zh: 'Code in web pages and mini-apps is visible to everyone. The right way: the frontend only talks to your own backend, and the backend holds the key to forward requests.' },
      { label: 'Rule 3', en: <>if leaked, <b>revoke and reissue at once</b></>, zh: 'Don\'t take chances. In the console, revoke the old key and generate a new one with one click, then check the bill — handle it the way you would a "leaked bank card PIN."' },
    ],

    memSecTitle: '🎛️ Interactive: pop the illusion of "memory" with your own hands',
    memSecLead: <>Paragraph ④ said "memory is just a list in your code" — now verify it yourself. On the left is the messages list in your code; on the right is the cloud model. <b>Advance three turns of conversation, and try those scissors before turn 3</b> — see whether, after deleting the history from the list, the model still "remembers" you.</>,

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Calling the API means my data is sent off to train the model',
        good: 'Mainstream vendors\' API data is not used for training by default — but policies differ, so read the data terms',
        why: <><b>Cause:</b> conflating "free chat products" with "the API." Some consumer-facing free products do use conversations to improve the model (usually toggleable); the API runs on commercial terms, and mainstream vendors don't train on request data by default. When company secrets or user privacy are involved, don't rely on impressions — open the data policy and check it line by line, and sign an enterprise agreement if needed.</>,
      },
      {
        bad: 'The code runs on my computer, so the model runs on my computer too',
        good: 'Inference happens on a cloud GPU cluster; your 30 lines of code just sent one HTTP request',
        why: <><b>Cause:</b> the reply prints in your own terminal, creating the illusion that "the computation is local." In fact your code is "ordering off the menu"; the cooking is done by rows of GPUs in the vendor's data center — which is also why it stops working offline and costs money on every call. Want the model to truly run on your own computer? That's exactly the topic of the next lesson.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quizLead: 'Three directions to modify it, each touching only one or two lines — but each cashes in an earlier lesson.',
    quiz: [
      {
        q: '1. Change the system content on line 11 of chat.py to a "savage film critic," then chat a bit about movies. Observe what changed and what didn\'t.',
        a: <>For example change it to <b>"You are a savage film critic, sharp-tongued but on point, refusing mutual commercial flattery."</b> You\'ll find the persona and tone of the whole conversation change, while the way you phrase each question doesn\'t change at all — that\'s the power of system as the "character bio" (Lesson 16): write it once, it governs the whole session, no need to repeat each turn.</>,
      },
      {
        q: '2. Add a temperature parameter in create(), use 0.2 and 1.2 respectively, and ask the same question 5 times each. Predict the difference between the two sets of answers?',
        a: <><b>Low temperature (0.2): the 5 answers are nearly identical</b> — stable, conservative, good for fact lookup and writing code; <b>high temperature (1.2): the 5 are all over the place</b> — good for brainstorming. The principle is the sampling temperature from Lesson 14 — temperature only changes how bold the "draw" is. Note that each vendor\'s parameter range and default vary slightly; check the docs.</>,
      },
      {
        q: '3. Add one line before sending: messages = [messages[0], messages[-1]] (keep only system and your latest line). What happens?',
        a: <>It will <b>"lose its memory" on the spot</b>: names and topics discussed before are all disavowed — because to the model, messages that weren\'t sent never existed. This verifies Lesson 17: the model is stateless, and "memory" lives entirely in the list in your code. Incidentally this is also the most naive way to save tokens; the proper approach is called "context management": keep system + a summary + the most recent few turns.</>,
      },
    ],
  },
}

// ============================================================
// 演示一：流式 vs 非流式
// ============================================================

function StreamDemo({ c }) {
  const FULL = c.full
  const CHARS = Array.from(FULL)
  const STEP = 38, DELAY = 300
  const TOTAL = DELAY + CHARS.length * STEP
  const SECS = (TOTAL / 1000).toFixed(1)

  const [sText, setSText] = useState(c.waiting)
  const [nText, setNText] = useState(c.waiting)
  const [sStat, setSStat] = useState(null)
  const [nStat, setNStat] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)
  const timers = useRef([])
  const dotTimer = useRef(null)

  const clearAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (dotTimer.current) { clearInterval(dotTimer.current); dotTimer.current = null }
  }
  useEffect(() => clearAll, [])

  const finalState = () => {
    setSText(FULL); setNText(FULL)
    setSStat(<>{c.sStatFirstA}<b>{c.sStatFirstB}</b>{c.sStatFullA}{SECS}{c.sStatFullB}</>)
    setNStat(<>{c.nStatFirstA}<b>{c.nStatFirstB}{SECS}{c.nStatFirstC}</b>{c.nStatFirstD}</>)
    setDone(true); setPlaying(false)
  }

  const play = () => {
    clearAll()
    if (REDUCED) { finalState(); return }
    setPlaying(true); setDone(false)
    setSText(''); setNText(c.waitResp)
    setSStat(c.sentReq); setNStat(c.sentReq)
    let acc = ''
    CHARS.forEach((ch, i) => {
      timers.current.push(setTimeout(() => {
        acc += ch
        setSText(acc)
        if (i === 0) setSStat(<>{c.sStatLiveA}<b>{c.sStatLiveB}</b>{c.sStatLiveC}</>)
      }, DELAY + i * STEP))
    })
    let dots = 0
    dotTimer.current = setInterval(() => {
      dots = (dots + 1) % 4
      setNText(c.waitResp + '.'.repeat(dots))
    }, 350)
    timers.current.push(setTimeout(() => {
      if (dotTimer.current) { clearInterval(dotTimer.current); dotTimer.current = null }
      finalState()
    }, TOTAL + 60))
  }

  return (
    <div className="card demo" style={{ marginTop: 14 }}>
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-pad">
        <div className="term-grid">
          <div>
            <div className="term-label">{c.termLabelS}</div>
            <div className="term">{sText}</div>
            <div className="term-stat">{sStat}</div>
          </div>
          <div>
            <div className="term-label">{c.termLabelN}</div>
            <div className="term">{nText}</div>
            <div className="term-stat">{nStat}</div>
          </div>
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          <button className="chip" onClick={play} disabled={playing}>
            {done ? c.btnReplay : c.btnPlay}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示二：算钱滑块
// ============================================================
const IN_PRICE = 2 / 1e6, OUT_PRICE = 8 / 1e6
const SYS = 50, U = 200, A = 200, MAX_N = 30
const inTok = (k) => SYS + (k - 1) * (U + A) + U
const MAX_TOK = inTok(MAX_N)

function CostDemo({ c }) {
  const fmtTok = (t) => (t >= 10000 ? (t / 10000).toFixed(1) + c.wan : String(t))
  const [n, setN] = useState(8)
  let cumIn = 0
  for (let k = 1; k <= n; k++) cumIn += inTok(k)
  const cumOut = A * n
  const fee = cumIn * IN_PRICE + cumOut * OUT_PRICE
  const feeStr = fee < 0.01 ? '≈ ¥' + fee.toFixed(4) : '≈ ¥' + fee.toFixed(2)
  const note =
    fee < 0.01 ? c.noteSmall
    : fee < 0.1 ? c.noteMid
    : c.noteBig

  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="cost-svg" viewBox="0 0 380 200" width="380" aria-label={c.svgAria}>
            <line x1="12" y1="152" x2="372" y2="152" stroke="var(--hairline-strong)" strokeWidth="1" />
            {Array.from({ length: MAX_N }, (_, i) => {
              const k = i + 1
              const h = Math.max(4, (inTok(k) / MAX_TOK) * 132)
              const fill = k < n ? 'var(--sky)' : k === n ? 'var(--amber)' : 'var(--hairline)'
              return (
                <rect key={k} x={14 + i * 12} y={152 - h} width="9" height={h} rx="2" fill={fill}>
                  <title>{c.titlePrefix + k + c.titleMid + inTok(k) + c.titleSuffix}</title>
                </rect>
              )
            })}
            <text x="14" y="168" fontSize="9" fill="var(--fg-2)">{c.axis1}</text>
            <text x="372" y="168" fontSize="9" textAnchor="end" fill="var(--fg-2)">{c.axis30}</text>
            <text x="192" y="188" fontSize="10" textAnchor="middle" fill="var(--fg-2)">{c.axisLabel}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="slider-row">
            <label htmlFor="cost-rounds">{c.sliderLabel}</label>
            <input type="range" id="cost-rounds" min="1" max="30" value={n} onChange={(e) => setN(+e.target.value)} />
            <span className="val">{n}</span>
          </div>
          <p style={{ fontSize: 13 }}>{c.assume}</p>
          <div className="cost-stats">
            <div><span>{c.statThisRound}</span><b>{c.tokApproxA}{fmtTok(inTok(n))}{c.tokUnit}</b></div>
            <div><span>{c.statCum}</span><b>{c.tokApproxA}{fmtTok(cumIn + cumOut)}{c.tokUnit}</b></div>
            <div><span>{c.statFee}</span><b>{feeStr}</b></div>
          </div>
          <p style={{ fontSize: 13 }}>{note}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示三：messages 列表与"失忆"实验
// ============================================================
const ROLE_STYLE = {
  system:    { fill: 'var(--bg-inset)', stroke: 'var(--hairline-strong)', limit: 12 },
  user:      { fill: 'var(--sky-bg)',   stroke: 'var(--sky)',             limit: 13 },
  assistant: { fill: 'var(--sage-bg)',  stroke: 'var(--sage)',            limit: 11 },
}
const trunc = (t, n) => (t.length > n ? t.slice(0, n) + '…' : t)

function MemDemo({ c }) {
  const ROUNDS = c.rounds
  const [msgs, setMsgs] = useState([{ role: 'system', text: c.sysText, cut: false }])
  const [idx, setIdx] = useState(0)
  const [cut, setCut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [title, setTitle] = useState(c.initTitle)
  const [desc, setDesc] = useState(c.initDesc)
  const [stats, setStats] = useState(<span className="pill pill-ink">{c.startHint}</span>)
  const [pulseKey, setPulseKey] = useState(0)
  const finishTimer = useRef(null)
  useEffect(() => () => { if (finishTimer.current) clearTimeout(finishTimer.current) }, [])

  const sendDisabled = busy || done || idx >= ROUNDS.length
  const cutDisabled = busy || done || cut || idx < 2

  const reset = () => {
    if (finishTimer.current) clearTimeout(finishTimer.current)
    setMsgs([{ role: 'system', text: c.sysText, cut: false }])
    setIdx(0); setCut(false); setBusy(false); setDone(false)
    setTitle(c.initTitle)
    setDesc(c.initDesc)
    setStats(<span className="pill pill-ink">{c.startHint}</span>)
  }

  const showStats = (list) => {
    const sent = list.filter((m) => !m.cut)
    const chars = sent.reduce((s, m) => s + m.text.length + 4, 0)
    setStats(
      <>
        <span className="pill pill-sky">{c.sentMsgsA}{sent.length}{c.sentMsgsB}</span>
        <span className="pill pill-amber">{c.tokApproxA}{Math.round(chars * 1.5)}{c.tokApproxB}</span>
      </>
    )
  }

  const send = () => {
    if (sendDisabled) return
    setBusy(true)
    const r = ROUNDS[idx]
    const isLast = idx === ROUNDS.length - 1
    const a = isLast ? (cut ? c.lastCut : c.lastNoCut) : r.a
    const d = isLast
      ? (cut ? c.lastCutDesc : c.lastNoCutDesc)
      : r.desc

    const withUser = [...msgs, { role: 'user', text: r.u, cut: false }]
    setMsgs(withUser)
    showStats(withUser)
    setTitle(c.titleSentA + (idx + 1) + c.titleSentB)
    if (!REDUCED) setPulseKey((k) => k + 1)

    const finish = () => {
      setMsgs([...withUser, { role: 'assistant', text: a, cut: false }])
      setDesc(c.aiPrefix + a + c.aiMid + d)
      const ni = idx + 1
      setIdx(ni)
      if (ni >= ROUNDS.length) { setDone(true); setTitle(c.titleDoneA + ni + c.titleDoneB) }
      setBusy(false)
    }
    if (REDUCED) finish()
    else finishTimer.current = setTimeout(finish, 650)
  }

  const doCut = () => {
    if (cutDisabled) return
    setCut(true)
    setMsgs((list) => list.map((m, i) => (i > 0 ? { ...m, cut: true } : m)))
    setTitle(c.cutTitle)
    setDesc(c.cutDesc)
    setStats(<span className="pill pill-terracotta">{c.cutStats}</span>)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="mem-svg" viewBox="0 0 400 290" width="400" aria-label={c.svgAria}>
            <text x="14" y="20" fontSize="11" fontWeight="600" fill="var(--fg-2)">{c.codeHeader}</text>
            <g>
              {msgs.map((m, i) => {
                const y = 30 + i * 32
                const s = ROLE_STYLE[m.role]
                return (
                  <g key={i} opacity={m.cut ? 0.35 : 1}>
                    <rect x="12" y={y} width="188" height="26" rx="7" fill={s.fill} stroke={s.stroke} strokeWidth="1" />
                    <text x="22" y={y + 17} fontSize="10" fill="var(--fg-0)">{m.role + ' · ' + trunc(m.text, s.limit)}</text>
                    {m.cut && <line x1="12" y1={y + 13} x2="200" y2={y + 13} stroke="var(--terracotta)" strokeWidth="1.5" />}
                  </g>
                )
              })}
            </g>
            <g key={pulseKey} className={pulseKey ? 'pulse' : undefined}>
              <path d="M 206 112 L 252 112" stroke="var(--fg-2)" strokeWidth="1.5" fill="none" />
              <path d="M 252 112 l -7 -4 v 8 z" fill="var(--fg-2)" />
              <text x="229" y="102" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--fg-1)">{c.arrowResend}</text>
              <path d="M 252 156 L 206 156" stroke="var(--fg-2)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
              <path d="M 206 156 l 7 -4 v 8 z" fill="var(--fg-2)" />
              <text x="229" y="172" textAnchor="middle" fontSize="9" fill="var(--fg-2)">{c.arrowReply}</text>
            </g>
            <rect x="258" y="94" width="130" height="84" rx="12" fill="var(--glass)" stroke="var(--hairline-strong)" />
            <text x="323" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{c.cloud}</text>
            <text x="323" y="146" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.cloudSub1}</text>
            <text x="323" y="162" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.cloudSub2}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" onClick={send} disabled={sendDisabled}>{c.btnSend}</button>
            <button className="chip" onClick={doCut} disabled={cutDisabled}>{c.btnCut}</button>
            <button className="chip" onClick={reset}>{c.btnReset}</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{title}</h4>
          <p>{desc}</p>
          <div className="stat-pills">{stats}</div>
        </div>
      </div>
    </div>
  )
}

export default function L26() {
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
        <p>{c.fullLead}</p>
        <div className="card demo" style={{ marginTop: 14 }}>
          <div className="demo-head">
            <span className="demo-title">{c.fullDemoTitle}</span>
            <span className="demo-hint">{c.fullDemoHint}</span>
          </div>
          <Code html={c.codeFull} />
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>{c.footnote}</p>
      </Lsec>

      <Lsec
        title={c.breakdownTitle}
        lead={c.breakdownLead}
      >
        <div className="seg">
          <h3><span className="num">①</span>{c.seg1Title}</h3>
          <Code html={c.code1} />
          <p>{c.seg1P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">②</span>{c.seg2Title}</h3>
          <Code html={c.code2} />
          <p>{c.seg2P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">③</span>{c.seg3Title}</h3>
          <Code html={c.code3} />
          <p>{c.seg3P}</p>
          <div className="card" style={{ marginTop: 12 }}>
            <table className="match">
              <thead><tr><th>{c.seg3Th[0]}</th><th>{c.seg3Th[1]}</th><th>{c.seg3Th[2]}</th></tr></thead>
              <tbody>
                {c.seg3Rows.map((r, i) => (
                  <tr key={i}><td className="be">{r.role}</td><td>{r.who}</td><td className="ex">{r.ex}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="seg">
          <h3><span className="num">④</span>{c.seg4Title}</h3>
          <Code html={c.code4} />
          <p>{c.seg4P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">⑤</span>{c.seg5Title}</h3>
          <Code html={c.code5} />
          <p>{c.seg5P}</p>
          <StreamDemo c={c.stream} />
        </div>
      </Lsec>

      <Lsec
        title={c.priceTitle}
        lead={c.priceLead}
      >
        <div className="card l26-formula">{c.formula}</div>
        <p>{c.priceP1}</p>
        <CostDemo c={c.cost} />
        <p>{c.priceP2}</p>
        <p style={{ marginTop: 20 }}>{c.priceP3}</p>
        <div className="use-grid" style={{ marginTop: 14 }}>
          {c.rules.map((r, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{r.label}</div>
              <div className="en">{r.en}</div>
              <div className="zh">{r.zh}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.memSecTitle}
        lead={c.memSecLead}
      >
        <MemDemo c={c.mem} />
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

      <Lsec
        title={c.quizTitle}
        lead={c.quizLead}
      >
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>
    </>
  )
}
