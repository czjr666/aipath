import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / 交互 / 数值 / SVG 几何均不变，仅可见文本按语言取用。
// 富文本（含 <b>）以 JSX 片段存储；演示里随数据拼接的句子改为以 c 取文案的函数。
const C = {
  zh: {
    apps: ['聊天应用', 'IDE 助手', 'Agent 产品', '办公插件'],
    tools: ['文件系统', '数据库', '浏览器', 'GitHub', '日历'],
    extra: '搜索引擎',
    demo: {
      title: '🎛️ 交互演示 · 集成数量大对比',
      hint: '切换模式 · 点击节点高亮连线',
      svgAria: 'AI 应用与工具的连线对比图：没有标准时两两连线，有了 MCP 总线后只需 N+M 条',
      appsAxis: (N) => <>AI 应用 × {N}</>,
      toolsAxis: (M) => <>工具 / 数据源 × {M}</>,
      modes: [['mess', '没有标准'], ['mcp', '有了 MCP']],
      titleMess: '没有标准：蜘蛛网',
      titleMcp: '有了 MCP：总线',
      formulaMess: (N, M, extra) => <>{N} 个应用 × {M} 个工具 = <b>{N * M}</b> 条专线{extra ? `（新工具 +${N} 条）` : ''}</>,
      formulaMcp: (N, M, extra) => <>{N} 个应用 + {M} 个工具 = <b>{N + M}</b> 条接入{extra ? '（新工具 +1 条）' : ''}</>,
      descBus: 'MCP 总线本身不含任何模型 —— 它只是一份“怎么对话”的协议，像 USB-C 插口不发电，却让所有设备互通。',
      descMess: '每家应用为每个工具单独写接入代码：连线 = 应用数 × 工具数。点击任意节点，看它背着多少条专线。',
      descMcp: '中间是 MCP 总线：工具方写一次 server、应用方接一次 client，即插即用 —— 连线 = 应用数 + 工具数。',
      descAppMess: (name, M) => `「${name}」要用 ${M} 个工具，就得写 ${M} 套接入代码；任何一个工具升级，这些代码都可能要跟着改。`,
      descAppMcp: (name, M) => `「${name}」只接 1 条线（实现一次 MCP client），就能即插即用全部 ${M} 个工具。`,
      descNewMess: (name, N) => `新工具「${name}」上线：${N} 家应用每家都得再写一套接入 —— 蜘蛛网一下子多了 ${N} 条线。`,
      descNewMcp: (name, N) => `新工具「${name}」上线：工具方写 1 个 MCP server 挂上总线，${N} 个应用立刻全部可用 —— 只多 1 条线。`,
      descToolMess: (name, N) => `「${name}」要服务 ${N} 个应用，就要被接入 ${N} 次 —— 每家一套，谁来维护？`,
      descToolMcp: (name, N) => `「${name}」方只写了 1 个 MCP server，${N} 个应用全部即插即用。`,
      extraOff: (extra) => `－ 下线这个新工具（${extra}）`,
      extraOn: (extra) => `＋ 上线一个新工具（${extra}）`,
      footnote: '提示：再点一次可以下线新工具；点击空白处取消高亮。',
    },
    flips: [
      { q: '各家大模型的官方 API（按 token 计费的那个接口）', pill: { type: 'terracotta', text: '模型层' }, why: '智能的源头。第 26 课你将第一次直接调用它 —— 没有这层，上面三层全是空架子。' },
      { q: 'ChatGPT 网页版', pill: { type: 'sky', text: '应用层' }, why: '注意区分：ChatGPT 是包装好的产品，背后的 GPT 模型 API 才在模型层 —— 一字之差，隔了三层。' },
      { q: 'LangChain（把“检索→拼提示→调模型”串成流水线的库）', pill: { type: 'amber', text: '框架层' }, why: '编排框架：帮开发者少写样板代码的脚手架，最终用户看不见它。' },
      { q: 'GitHub 官方提供的 MCP server', pill: { type: 'sage', text: '协议层（工具方）' }, why: '工具方按 MCP 协议把能力挂出来 —— 写一次，所有支持 MCP 的应用即插即用。' },
      { q: 'Cursor（IDE 里的 AI 编程助手）', pill: { type: 'sky', text: '应用层' }, why: '你直接使用的产品都在应用层。它同时也是 MCP 里的 Host —— 可以装各种 server 来扩展能力。' },
      { q: 'Anthropic / OpenAI 的官方 Python SDK', pill: { type: 'amber', text: '框架层' }, why: 'SDK 把 HTTP 请求包装成几行代码，是通往模型层的便桥 —— 第 26 课会用到。' },
    ],
    goalsTitle: '🎯 你将学会',
    goals: [
      '看出第 19 课留下的尾巴：模型会“开申请单”了，但每个应用接每个工具仍要单独写胶水代码 —— N 个应用 × M 个工具 = N×M 套集成，乘法让生态长不大',
      '一句话说清 MCP：AI 应用与外部世界之间的统一插口（比喻 USB-C）—— 工具方按协议写一次 MCP server，所有支持 MCP 的应用即插即用，乘法变加法',
      '分清 MCP 的三种能力（Tools / Resources / Prompts）和三个角色（Host / Client / Server），用人话说出各自是谁',
      '在“模型层 → 框架层 → 协议层 → 应用层”的生态地图上定位自己：第 26-28 课动手主要打交道的是模型层 API，用现成 MCP server 是低代码扩展能力的捷径',
    ],
    conceptTitle: '💡 核心概念：插口统一之前，每台设备自带一套线',
    conceptLead: '接着第 19 课往下说。那一课的结论是：模型只开“申请单”，真正执行工具的是宿主程序。但有个问题当时按下没表 —— 宿主和每个工具之间的对接代码，谁来写？查天气要对接天气 API、读文件要对接文件系统、连仓库要对接 GitHub……在没有标准的年代，每个应用团队都得为每个工具单独写一套“胶水代码”。数一数账就知道这条路走不远：',
    contrastMess: {
      pill: '没有标准',
      big: <>N 个应用 × M 个工具 = <span className="gap">N×M</span> 套胶水代码</>,
      note: '每对组合单独接：4 个应用 × 5 个工具就是 20 套。工具一升级，所有应用跟着改；新应用入场，所有工具重接一遍 —— 谁都不堪重负，生态没法长大。',
    },
    contrastMcp: {
      pill: '有了统一插口',
      big: <>各自只接一次 = <span className="hl">N+M</span> 次接入</>,
      note: '工具方写一次 server、应用方接一次 client：4+5=9。新工具上线只加 1，所有应用立刻可用 —— 增长从乘法变加法，生态才滚得起来。',
    },
    mcpIntro: <>这就是 <b>MCP（Model Context Protocol，模型上下文协议）</b>要解决的问题：2024 年底由 Anthropic 开源，2025 年起 OpenAI、Google 等主流玩家相继跟进，如今已是行业事实标准之一。它做的事一句话 —— <b>在 AI 应用与外部世界之间，定义一个统一插口。</b></>,
    exampleEn: <>MCP 之于 AI 应用，就像 <span className="hl">USB-C</span> 之于电子设备</>,
    exampleZh: '插口统一之前，每台设备配专属充电器和数据线；统一之后，设备方和配件方各自适配一次 USB-C，互相即插即用。MCP 同理：工具方按协议写一次 MCP server，所有支持 MCP 的应用都能直接用 —— 不需要认识彼此，只需要认识插口。',
    capTitle: '📖 拆开一个 MCP server：三种能力，三个角色',
    capLead: '统一插口里到底流过什么？MCP 规定 server 可以向应用提供三类东西 —— 第一类你其实已经认识了：',
    caps: [
      { label: '能力一 · 可调用的动作', term: <>Tools <b>工具</b></>, body: '发消息、查数据库、跑代码。就是第 19 课 function calling 那一套 —— 模型开申请单、宿主执行；只是工具现在长在 server 里，按统一格式自我介绍。' },
      { label: '能力二 · 可读取的数据', term: <>Resources <b>资源</b></>, body: '文档、表格、日志等数据/文件。应用把它拉进上下文（第 17 课的书桌）供模型阅读 —— 读数据不必再伪装成“调一次工具”。' },
      { label: '能力三 · 预置的问法', term: <>Prompts <b>提示模板</b></>, body: '工具方最懂“怎么问自家工具效果最好”（第 16 课的手艺），干脆把成熟问法打包成模板挂出来，用户即选即用。' },
    ],
    rolesLead: <>再认三个角色 —— 文档和新闻里高频出现，人话一句话就够：</>,
    rolesHead: ['角色', '人话：它是谁', '例子'],
    roles: [
      { be: 'Host 宿主', who: '你正在用的那个 AI 应用本体 —— 决定接哪些 server、放行哪些操作。第 19 课里“签字执行”的就是它', ex: 'Claude Desktop、IDE 助手、Chat 产品' },
      { be: 'Client 客户端', who: 'Host 体内的“连接器”，专职和某一个 server 通话，一对一配对 —— 用户全程感觉不到它的存在', ex: '应用内置的 MCP 连接模块' },
      { be: 'Server 服务器', who: '工具方写的“提供方”：把工具/数据/模板按协议包装好挂出来，跑在本地或远程都行', ex: '文件系统 server、GitHub server、数据库 server' },
    ],
    mapTitle: '📖 生态全景：四层地图，找到你的位置',
    mapLead: '把镜头拉远。MCP 只是 AI 工程生态里的一层 —— 从模型到你手里的产品，中间隔着清晰的四层分工。从地基往上看：',
    layers: [
      { pill: { type: 'terracotta', text: '第 1 层' }, term: <>模型<b>层</b></>, body: '各家大模型 API：GPT、Claude、Gemini、DeepSeek……智能的源头，按 token 计费（第 11 课），上面三层全建在它之上。' },
      { pill: { type: 'amber', text: '第 2 层' }, term: <>框架<b>层</b></>, body: '官方 SDK、LangChain 等编排框架 —— 把“调模型”包装成几行代码，帮开发者少写样板，用户看不见它。' },
      { pill: { type: 'sage', text: '第 3 层' }, term: <>协议<b>层</b></>, body: 'MCP 等标准 —— 规定应用与工具/数据怎么对话。本课主角住在这层：它不是软件包，是一份“接口说明书”。' },
      { pill: { type: 'sky', text: '第 4 层' }, term: <>应用<b>层</b></>, body: 'IDE 助手、Chat 产品、Agent 产品 —— 所有下层能力最终在这里见到用户，也是 MCP 的 Host 所在。' },
    ],
    mapNote: <>给你定位两句话：<b>第 26-28 课动手时，你主要打交道的是模型层 API</b>（申请 key、发请求、读响应）；而想给手边的 AI 应用快速加能力 —— 查 GitHub、连数据库、读本地文件 —— <b>用现成的 MCP server 是低代码捷径</b>：社区已有大量现成 server（清单以官方目录为准），装上即用，一行胶水代码都不用写。</>,
    flipLead: <>练练眼力：下面 6 个东西各属于哪一层？先自己判断，再点卡片揭晓。</>,
    demoTitle: '🎛️ 交互演示：数一数，蜘蛛网 vs 总线',
    demoLead: '把核心概念那笔账画出来。左边 4 个 AI 应用，右边 5 个工具/数据源 —— 切换两种世界，点击任意节点看它背着多少条线；再试试“上线一个新工具”，感受乘法和加法的差距。',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'MCP 是 Anthropic 发布的一个新模型',
        good: 'MCP 是协议（接口标准），里面不含任何模型 —— 它规定“怎么对话”，不负责“谁来思考”',
        why: <><b>病因：</b>名字里带 Model 二字，新闻又常把它和模型发布混在一起报道。判断方法回到比喻：USB-C 插口本身不发电、不存数据，只是让设备互通；MCP 同理 —— 换用任何支持它的模型或应用，协议本身一个字都不用改。它属于生态地图的协议层，而模型住在模型层。</>,
      },
      {
        bad: '接了 MCP，AI 就能随便动我的电脑',
        good: 'AI 能做什么，由 server 暴露什么、host 授权什么共同决定 —— 权限始终在用户手里',
        why: <><b>病因：</b>把“接口打通”误当“权限全开”。回忆第 19 课的安全边界：模型只开申请单，执行前有宿主把关 —— MCP 没有改变这一点。server 只暴露被允许的目录和动作，host 对危险操作仍要弹窗让你确认，两道闸缺一不可。真正要警惕的是装来路不明的 server —— 就像别把捡来的 U 盘往电脑上插。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 公司里有 10 个 AI 应用，市面上有 8 个常用工具。没有标准时要写多少套集成？全走 MCP 呢？第 9 个工具上线时，两种世界各要做什么？',
        a: <>没有标准：10 × 8 = <b>80 套</b>胶水代码；全走 MCP：10 + 8 = <b>18 次接入</b>（应用方、工具方各接一次插口）。第 9 个工具上线：没有标准 → 10 个应用每家再写一套（+10）；MCP → 工具方写 1 个 server（+1），所有应用立刻可用。<b>增长从乘法变加法</b> —— 这就是“生态才能长大”的数学原因。</>,
      },
      {
        q: '2. 把三样东西归入 Tools / Resources / Prompts：①“把这条消息发到团队群” ②“本季度销售数据表的内容” ③“一键生成周报的提问模板”。再答：你在 Claude Desktop 里装了一个日历 server，Host / Client / Server 各是谁？',
        a: <>① <b>Tools</b>（可调用的动作，会改变外部世界）② <b>Resources</b>（可读取的数据，拉进上下文供模型阅读）③ <b>Prompts</b>（预置的提示模板，即选即用）。角色：<b>Host</b> = Claude Desktop（应用本体，决定授权）；<b>Client</b> = 它体内与日历 server 通话的连接器；<b>Server</b> = 日历方提供的那个小程序。</>,
      },
      {
        q: '3. 朋友装了一个文件系统 MCP server 之后慌了：“AI 现在能删我整个硬盘了！”用本课和第 19 课的知识，给他三句安抚和一句提醒。',
        a: <>三句安抚：① <b>server 只暴露被配置的东西</b> —— 文件 server 通常只授权指定文件夹，不是整个硬盘；② <b>host 还有一道闸</b> —— 删除这类危险操作要人工确认，这是第 19 课的铁律；③ <b>模型从不亲手执行</b> —— 它只开申请单，最后签字的是宿主和你。一句提醒：这一切的前提是 server 本身可信 —— <b>别装来路不明的 server</b>，如同别乱插捡来的 U 盘。</>,
      },
    ],
  },

  en: {
    apps: ['Chat app', 'IDE assistant', 'Agent product', 'Office plugin'],
    tools: ['File system', 'Database', 'Browser', 'GitHub', 'Calendar'],
    extra: 'Search engine',
    demo: {
      title: '🎛️ Interactive · Integration Count Showdown',
      hint: 'Switch modes · click a node to highlight its wires',
      svgAria: 'A wiring comparison between AI apps and tools: without a standard, everything connects pairwise; with the MCP bus, only N+M connections are needed',
      appsAxis: (N) => <>AI apps × {N}</>,
      toolsAxis: (M) => <>Tools / data sources × {M}</>,
      modes: [['mess', 'No standard'], ['mcp', 'With MCP']],
      titleMess: 'No standard: a spider web',
      titleMcp: 'With MCP: a bus',
      formulaMess: (N, M, extra) => <>{N} apps × {M} tools = <b>{N * M}</b> dedicated wires{extra ? ` (new tool +${N} wires)` : ''}</>,
      formulaMcp: (N, M, extra) => <>{N} apps + {M} tools = <b>{N + M}</b> connections{extra ? ' (new tool +1 wire)' : ''}</>,
      descBus: 'The MCP bus itself contains no model — it is just a protocol for "how to talk," like a USB-C port that supplies no power yet lets all devices interconnect.',
      descMess: 'Each app writes its own integration code for each tool: wires = apps × tools. Click any node to see how many dedicated wires it carries.',
      descMcp: 'In the middle is the MCP bus: a tool provider writes one server, an app connects one client, plug and play — wires = apps + tools.',
      descAppMess: (name, M) => `"${name}" needs ${M} tools, so it must write ${M} sets of integration code; whenever any one tool is upgraded, all of this code may have to change too.`,
      descAppMcp: (name, M) => `"${name}" connects just 1 wire (implementing one MCP client) to plug-and-play all ${M} tools.`,
      descNewMess: (name, N) => `New tool "${name}" launches: all ${N} apps each have to write another integration — the spider web suddenly gains ${N} more wires.`,
      descNewMcp: (name, N) => `New tool "${name}" launches: the tool provider writes 1 MCP server onto the bus, and all ${N} apps can use it instantly — just 1 more wire.`,
      descToolMess: (name, N) => `"${name}" has to serve ${N} apps, so it must be integrated ${N} times — one set each. Who maintains all that?`,
      descToolMcp: (name, N) => `The "${name}" side wrote just 1 MCP server, and all ${N} apps plug-and-play it.`,
      extraOff: (extra) => `− Take this new tool offline (${extra})`,
      extraOn: (extra) => `＋ Launch a new tool (${extra})`,
      footnote: 'Tip: click again to take the new tool offline; click empty space to clear the highlight.',
    },
    flips: [
      { q: 'The official API of each large model (the token-billed endpoint)', pill: { type: 'terracotta', text: 'Model layer' }, why: 'The source of intelligence. In Lesson 26 you will call it directly for the first time — without this layer, the three above are empty shells.' },
      { q: 'The ChatGPT web app', pill: { type: 'sky', text: 'Application layer' }, why: 'Mind the distinction: ChatGPT is a packaged product; the GPT model API behind it is what sits in the model layer — one word apart, three layers away.' },
      { q: 'LangChain (a library that strings "retrieve → assemble prompt → call model" into a pipeline)', pill: { type: 'amber', text: 'Framework layer' }, why: 'An orchestration framework: scaffolding that saves developers boilerplate code, invisible to the end user.' },
      { q: "GitHub's official MCP server", pill: { type: 'sage', text: 'Protocol layer (tool side)' }, why: 'The tool provider exposes its capabilities per the MCP protocol — write it once, and every MCP-supporting app gets plug-and-play access.' },
      { q: 'Cursor (the AI coding assistant in the IDE)', pill: { type: 'sky', text: 'Application layer' }, why: 'The products you use directly all live in the application layer. It is also a Host in MCP — you can install various servers to extend its capabilities.' },
      { q: "Anthropic / OpenAI's official Python SDK", pill: { type: 'amber', text: 'Framework layer' }, why: 'An SDK wraps HTTP requests into a few lines of code — a convenient bridge to the model layer, which you will use in Lesson 26.' },
    ],
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'Spot the loose end Lesson 19 left behind: the model can "file a request" now, but each app still has to write glue code for each tool — N apps × M tools = N×M integrations, and multiplication keeps the ecosystem from growing',
      'State MCP in one sentence: a unified port between AI apps and the outside world (think USB-C) — a tool provider writes one MCP server per the protocol, and every MCP-supporting app plugs and plays, turning multiplication into addition',
      'Tell apart MCP\'s three capabilities (Tools / Resources / Prompts) and three roles (Host / Client / Server), and say in plain words who each is',
      'Locate yourself on the ecosystem map "model layer → framework layer → protocol layer → application layer": in Lessons 26-28 you mostly deal with the model-layer API, and using off-the-shelf MCP servers is the low-code shortcut to extending capabilities',
    ],
    conceptTitle: '💡 Core Idea: Before Ports Were Unified, Every Device Brought Its Own Cables',
    conceptLead: 'Picking up where Lesson 19 left off. That lesson concluded: the model only "files a request"; the host program is what actually executes the tool. But one question was set aside back then — who writes the integration code between the host and each tool? Checking the weather means integrating a weather API, reading files means integrating the file system, connecting to a repo means integrating GitHub… In the days without a standard, every app team had to write a separate set of "glue code" for every tool. Count it up and you can see this road doesn\'t go far:',
    contrastMess: {
      pill: 'No standard',
      big: <>N apps × M tools = <span className="gap">N×M</span> sets of glue code</>,
      note: 'Each pair connected separately: 4 apps × 5 tools is 20 sets. When a tool is upgraded, every app changes with it; when a new app arrives, every tool gets reconnected — everyone is overwhelmed, and the ecosystem cannot grow.',
    },
    contrastMcp: {
      pill: 'With a unified port',
      big: <>Each connects just once = <span className="hl">N+M</span> connections</>,
      note: 'A tool provider writes one server, an app connects one client: 4+5=9. Launching a new tool adds just 1, and every app can use it instantly — growth turns from multiplication into addition, and the ecosystem starts to roll.',
    },
    mcpIntro: <>This is the problem <b>MCP (Model Context Protocol)</b> sets out to solve: open-sourced by Anthropic in late 2024, with major players like OpenAI and Google following suit from 2025, it is now one of the industry\'s de facto standards. What it does, in one sentence — <b>it defines a unified port between AI apps and the outside world.</b></>,
    exampleEn: <>MCP is to AI apps what <span className="hl">USB-C</span> is to electronic devices</>,
    exampleZh: 'Before ports were unified, every device came with its own charger and cable; once unified, device makers and accessory makers each adapt to USB-C once, and everything plugs and plays. MCP is the same: a tool provider writes one MCP server per the protocol, and every MCP-supporting app can use it directly — they don\'t need to know each other, only the port.',
    capTitle: '📖 Inside an MCP server: Three Capabilities, Three Roles',
    capLead: 'What actually flows through the unified port? MCP specifies three kinds of things a server can offer an app — and you already know the first one:',
    caps: [
      { label: 'Capability 1 · Callable actions', term: <>Tools <b>tools</b></>, body: 'Send a message, query a database, run code. It\'s the same function-calling setup from Lesson 19 — the model files a request, the host executes; only now the tools live inside a server and introduce themselves in a unified format.' },
      { label: 'Capability 2 · Readable data', term: <>Resources <b>resources</b></>, body: 'Data and files like documents, spreadsheets, and logs. The app pulls them into context (the desk from Lesson 17) for the model to read — reading data no longer has to masquerade as "calling a tool."' },
      { label: 'Capability 3 · Preset phrasings', term: <>Prompts <b>prompt templates</b></>, body: 'The tool provider knows best "how to ask its own tool for the best results" (the craft from Lesson 16), so it simply packages proven phrasings into templates and exposes them, ready for users to pick and use.' },
    ],
    rolesLead: <>Now meet the three roles — they show up constantly in docs and the news, and one plain sentence is enough:</>,
    rolesHead: ['Role', 'In plain words: who it is', 'Examples'],
    roles: [
      { be: 'Host', who: 'The AI app itself that you are using — it decides which servers to connect and which operations to allow. It\'s the one "signing off on execution" in Lesson 19', ex: 'Claude Desktop, IDE assistants, chat products' },
      { be: 'Client', who: 'The "connector" inside the Host, dedicated to talking with one specific server, paired one-to-one — the user never feels its presence', ex: 'The app\'s built-in MCP connection module' },
      { be: 'Server', who: 'The "provider" written by the tool side: it packages tools/data/templates per the protocol and exposes them, running locally or remotely', ex: 'File-system server, GitHub server, database server' },
    ],
    mapTitle: '📖 Ecosystem Panorama: A Four-Layer Map, Find Your Spot',
    mapLead: 'Pull the camera back. MCP is just one layer in the AI engineering ecosystem — from the model to the product in your hands, there is a clear four-layer division of labor in between. Looking up from the foundation:',
    layers: [
      { pill: { type: 'terracotta', text: 'Layer 1' }, term: <>Model <b>layer</b></>, body: 'The large-model APIs of each vendor: GPT, Claude, Gemini, DeepSeek… the source of intelligence, billed per token (Lesson 11), with the three layers above all built on top of it.' },
      { pill: { type: 'amber', text: 'Layer 2' }, term: <>Framework <b>layer</b></>, body: 'Official SDKs, orchestration frameworks like LangChain — they wrap "calling the model" into a few lines of code, save developers boilerplate, and stay invisible to users.' },
      { pill: { type: 'sage', text: 'Layer 3' }, term: <>Protocol <b>layer</b></>, body: 'Standards like MCP — they specify how apps talk to tools/data. This lesson\'s protagonist lives here: it\'s not a software package, it\'s an "interface spec."' },
      { pill: { type: 'sky', text: 'Layer 4' }, term: <>Application <b>layer</b></>, body: 'IDE assistants, chat products, agent products — where all the lower layers\' capabilities finally meet the user, and also where MCP\'s Host resides.' },
    ],
    mapNote: <>Two sentences to place yourself: <b>when you get hands-on in Lessons 26-28, you mainly deal with the model-layer API</b> (request a key, send a request, read the response); and to quickly add capabilities to an AI app at hand — query GitHub, connect a database, read local files — <b>using an off-the-shelf MCP server is the low-code shortcut</b>: the community already has plenty of ready-made servers (treat the official directory as the authoritative list), install and go, without writing a single line of glue code.</>,
    flipLead: <>Train your eye: which layer does each of the 6 things below belong to? Decide for yourself first, then tap a card to reveal.</>,
    demoTitle: '🎛️ Interactive Demo: Count Them — Spider Web vs. Bus',
    demoLead: 'Let\'s draw out the arithmetic from the core idea. On the left are 4 AI apps, on the right 5 tools/data sources — switch between the two worlds, click any node to see how many wires it carries; then try "launch a new tool" and feel the gap between multiplication and addition.',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'MCP is a new model released by Anthropic',
        good: 'MCP is a protocol (an interface standard) and contains no model — it specifies "how to talk," not "who does the thinking"',
        why: <><b>Cause:</b> the word Model is in the name, and the news often lumps it together with model releases. Go back to the analogy to decide: a USB-C port supplies no power and stores no data, it merely lets devices interconnect; MCP is the same — switch to any model or app that supports it, and the protocol itself doesn\'t change a single word. It belongs to the protocol layer of the ecosystem map, while models live in the model layer.</>,
      },
      {
        bad: 'Once MCP is connected, AI can mess with my computer at will',
        good: 'What AI can do is decided jointly by what the server exposes and what the host authorizes — control always stays in the user\'s hands',
        why: <><b>Cause:</b> mistaking "the interface is connected" for "all permissions are open." Recall the safety boundary from Lesson 19: the model only files a request, and the host gates it before execution — MCP did not change this. A server only exposes the allowed directories and actions, and the host still pops up a confirmation for dangerous operations; both gates are essential. What you really need to watch out for is installing a server of unknown origin — just like not plugging a found USB stick into your computer.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A company has 10 AI apps, and there are 8 commonly used tools on the market. How many integrations must be written without a standard? And with MCP all the way? When the 9th tool launches, what does each world have to do?',
        a: <>Without a standard: 10 × 8 = <b>80 sets</b> of glue code; with MCP all the way: 10 + 8 = <b>18 connections</b> (the app side and the tool side each connect to the port once). When the 9th tool launches: without a standard → each of the 10 apps writes another set (+10); with MCP → the tool provider writes 1 server (+1), and all apps can use it instantly. <b>Growth turns from multiplication into addition</b> — that\'s the mathematical reason "the ecosystem can grow."</>,
      },
      {
        q: '2. Sort three things into Tools / Resources / Prompts: ① "send this message to the team group" ② "the contents of this quarter\'s sales data table" ③ "a question template that generates a weekly report in one click." Then answer: you\'ve installed a calendar server in Claude Desktop — who is the Host / Client / Server?',
        a: <>① <b>Tools</b> (callable actions that change the outside world) ② <b>Resources</b> (readable data pulled into context for the model to read) ③ <b>Prompts</b> (preset prompt templates, ready to pick and use). Roles: <b>Host</b> = Claude Desktop (the app itself, deciding authorization); <b>Client</b> = the connector inside it that talks to the calendar server; <b>Server</b> = the little program provided by the calendar side.</>,
      },
      {
        q: '3. A friend panics after installing a file-system MCP server: "AI can now delete my entire hard drive!" Using what you learned in this lesson and Lesson 19, give them three reassurances and one reminder.',
        a: <>Three reassurances: ① <b>a server only exposes what it\'s configured to</b> — a file server is usually authorized for specific folders, not the whole hard drive; ② <b>the host has another gate</b> — dangerous operations like deletion require manual confirmation, the iron rule from Lesson 19; ③ <b>the model never executes anything itself</b> — it only files a request; the host and you do the final sign-off. One reminder: all of this assumes the server itself is trustworthy — <b>don\'t install servers of unknown origin</b>, just as you wouldn\'t plug in a found USB stick.</>,
      },
    ],
  },
}

// ============================================================
// 蜘蛛网 vs 总线连线演示
// ============================================================
function spread(n, top, bottom) {
  const ys = []
  for (let i = 0; i < n; i++) ys.push(n === 1 ? (top + bottom) / 2 : top + (i * (bottom - top)) / (n - 1))
  return ys
}

function EcoNode({ x, cy, w, label, fill, stroke, type, idx, sel, onSel }) {
  const isSel = sel && sel.type === type && (type === 'bus' || sel.idx === idx)
  return (
    <g className={`eco-node${isSel ? ' sel' : ''}`} onClick={(e) => { e.stopPropagation(); onSel({ type, idx }) }}>
      <rect x={x} y={cy - 15} width={w} height="30" rx="8" fill={fill} stroke={stroke} />
      <text x={x + w / 2} y={cy + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--fg-0)">{label}</text>
    </g>
  )
}

function EcoDemo({ c }) {
  const d = c.demo
  const APPS = c.apps
  const TOOLS = c.tools
  const EXTRA = c.extra
  const [mode, setMode] = useState('mess')
  const [extra, setExtra] = useState(false)
  const [sel, setSel] = useState(null)

  const tools = extra ? [...TOOLS, EXTRA] : TOOLS
  const N = APPS.length
  const M = tools.length
  const aY = spread(N, 50, 312)
  const tY = spread(M, 50, 312)

  const wireCls = (a, t) => {
    let hot = false
    if (sel) {
      if (sel.type === 'bus') hot = true
      else if (sel.type === 'app') hot = a === sel.idx
      else if (sel.type === 'tool') hot = t === sel.idx
    }
    return `wire${hot ? ' hot' : ''}${sel && !hot ? ' dimmed' : ''}`
  }

  // 右侧文案
  let title, formula, desc
  if (mode === 'mess') {
    title = d.titleMess
    formula = d.formulaMess(N, M, extra)
  } else {
    title = d.titleMcp
    formula = d.formulaMcp(N, M, extra)
  }
  if (!sel || sel.type === 'bus') {
    if (sel && sel.type === 'bus') desc = d.descBus
    else if (mode === 'mess') desc = d.descMess
    else desc = d.descMcp
  } else if (sel.type === 'app') {
    const name = APPS[sel.idx]
    desc = mode === 'mess'
      ? d.descAppMess(name, M)
      : d.descAppMcp(name, M)
  } else {
    const name = tools[sel.idx]
    const isNew = extra && sel.idx === TOOLS.length
    if (isNew) {
      desc = mode === 'mess'
        ? d.descNewMess(name, N)
        : d.descNewMcp(name, N)
    } else {
      desc = mode === 'mess'
        ? d.descToolMess(name, N)
        : d.descToolMcp(name, N)
    }
  }

  const toggleExtra = () => {
    const ne = !extra
    setExtra(ne)
    setSel(ne ? { type: 'tool', idx: TOOLS.length } : null)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="eco-svg" viewBox="0 0 460 352" width="430" aria-label={d.svgAria} onClick={() => setSel(null)}>
            <text x="80" y="18" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">{d.appsAxis(N)}</text>
            <text x="380" y="18" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">{d.toolsAxis(M)}</text>
            {/* 连线 */}
            {mode === 'mess'
              ? APPS.flatMap((_, a) => tools.map((__, t) => (
                  <line key={`${a}-${t}`} className={wireCls(a, t)} x1="134" y1={aY[a]} x2="326" y2={tY[t]} />
                )))
              : [
                  ...APPS.map((_, a) => <line key={`a${a}`} className={wireCls(a, null)} x1="134" y1={aY[a]} x2="216" y2={aY[a]} />),
                  ...tools.map((_, t) => <line key={`t${t}`} className={wireCls(null, t)} x1="244" y1={tY[t]} x2="326" y2={tY[t]} />),
                ]}
            {/* MCP 总线 */}
            {mode === 'mcp' && (
              <g className={`eco-node${sel && sel.type === 'bus' ? ' sel' : ''}`} onClick={(e) => { e.stopPropagation(); setSel({ type: 'bus', idx: 0 }) }}>
                <rect x="216" y="34" width="28" height="293" rx="14" fill="var(--sage-bg)" stroke="var(--sage)" />
                {['M', 'C', 'P'].map((c, i) => <text key={c} x="230" y={166 + i * 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{c}</text>)}
              </g>
            )}
            {/* 节点 */}
            {APPS.map((label, a) => <EcoNode key={`app${a}`} x={26} cy={aY[a]} w={108} label={label} fill="var(--sky-bg)" stroke="var(--sky)" type="app" idx={a} sel={sel} onSel={setSel} />)}
            {tools.map((label, t) => <EcoNode key={`tool${t}`} x={326} cy={tY[t]} w={108} label={label} fill="var(--amber-bg)" stroke="var(--amber)" type="tool" idx={t} sel={sel} onSel={setSel} />)}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {d.modes.map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => { setMode(k); setSel(null) }}>{label}</button>
            ))}
          </div>
          <h4>{title}</h4>
          <div className="period" id="mcp-formula">{formula}</div>
          <p>{desc}</p>
          <div className="chips mt14">
            <button className={`chip${extra ? ' active' : ''}`} onClick={toggleExtra}>{extra ? d.extraOff(EXTRA) : d.extraOn(EXTRA)}</button>
          </div>
          <p className="footnote mt14">{d.footnote}</p>
        </div>
      </div>
    </div>
  )
}

export default function L24() {
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
            <div className="tag"><span className="pill pill-ink">{c.contrastMess.pill}</span></div>
            <div className="big">{c.contrastMess.big}</div>
            <p className="note">{c.contrastMess.note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastMcp.pill}</span></div>
            <div className="big">{c.contrastMcp.big}</div>
            <p className="note">{c.contrastMcp.note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.mcpIntro}</p>
        <div className="example">
          <div className="en">{c.exampleEn}</div>
          <div className="zh">{c.exampleZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.capTitle}
        lead={c.capLead}
      >
        <div className="use-grid">
          {c.caps.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.term}</div><div className="zh">{u.body}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.rolesLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.rolesHead[0]}</th><th>{c.rolesHead[1]}</th><th>{c.rolesHead[2]}</th></tr></thead>
            <tbody>
              {c.roles.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td>{r.who}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec
        title={c.mapTitle}
        lead={c.mapLead}
      >
        <div className="use-grid cols-4">
          {c.layers.map((l, i) => (
            <div className="card use-card" key={i}><div className="label"><Pill type={l.pill.type}>{l.pill.text}</Pill></div><div className="en">{l.term}</div><div className="zh">{l.body}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.mapNote}</p>
        <p className="lead mt14">{c.flipLead}</p>
        <div className="flip-grid">
          {c.flips.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
        </div>
      </Lsec>

      <Lsec
        title={c.demoTitle}
        lead={c.demoLead}
      >
        <EcoDemo c={c} />
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
