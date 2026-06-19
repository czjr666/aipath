import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { createConvScan, KERNELS } from './viz/convScan.js'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    pixelAria: '一张 8×8 灰度图：每个格子同时显示其像素亮度值',
    keyList: [['h', '水平边缘'], ['v', '垂直边缘'], ['sharp', '锐化'], ['blur', '模糊']],
    demoStatusReady: '就绪 —— 点「播放」让探测器出发',
    demoTitle: '🎛️ 交互演示 · 卷积核扫描一张图',
    demoHint: '选一个核 → 播放，或「单步」逐格观察',
    demoCanvasAria: '卷积演示：3×3 卷积核在 12×12 灰度图上逐格滑动，右侧 10×10 特征图按响应强度逐格点亮',
    btnPlay: '▶ 播放',
    btnPause: '⏸ 暂停',
    btnStep: '⏭ 单步',
    btnReset: '↺ 重置',
    goalsTitle: '🎯 你将学会',
    goals: [
      <>说出图像在计算机里到底是什么：一张 0~255 的数字网格，“看懂图像” = 在网格里找模式</>,
      <>看懂卷积核的工作方式：一枚 3×3 的小探测器逐格滑动，遇到匹配的局部就强烈响应</>,
      <>理解 CNN 的层叠之力：边缘 → 纹理 → 部件 —— 正是第 6 课“逐层抽象”的视觉实例</>,
      <>识破两个流行误解：AI 并没有“看见”整体；识别得准也不等于真的理解</>,
    ],
    conceptTitle: '💡 核心概念：在计算机眼里，图像是一张数字表',
    conceptLead: '先纠正一个根深蒂固的想象：计算机里并不存在“画面”。打开任何一张图片，存储的只是一张表格 —— 每个格子（像素）记一个亮度数字。所谓“看”，是对这张表格做数学。',
    contrastTag1: '直觉印象',
    contrastBig1: <>计算机存下了一幅<span className="gap">“画面”</span></>,
    contrastNote1: '仿佛硬盘里真有图案、轮廓和一只猫，计算机睁眼就能“看到”它们。',
    contrastTag2: '真实机制',
    contrastBig2: <>计算机存下一张<span className="hl">数字网格</span></>,
    contrastNote2: '每格是一个 0~255 的亮度值：0 纯黑，255 纯白。彩色图也只是红、绿、蓝三张这样的表叠在一起。',
    pixFootnote: <>↑ 同一份数据的两种读法：站远看是个“7”，凑近看是 64 个数字。<br />计算机只有“凑近看”这一种视角 —— 它从未见过左边那个“7”。</>,
    conceptOutro: <>于是“看懂图像”被翻译成一道数学题：<b>在数字网格里找模式</b> —— 哪里数字突然跳变（那是边缘），哪里有规律地重复（那是纹理），哪些模式总是结伴出现（那是眼睛、车轮这样的部件）。卷积神经网络 CNN，就是为这道题而生的机器。</>,
    kernelTitle: '🔍 卷积核：一枚扛着模板巡逻的 3×3 小探测器',
    kernelLead: 'CNN 的最小零件叫卷积核（kernel）：一张 3×3 的小表格，里面装着它要找的“模式模板”。它从图像左上角出发，逐格滑动，每停一步就问一句：「我脚下这 9 个像素，长得像我的模板吗？」像，就输出一个大数（强烈响应）；不像，就输出接近 0。',
    formula1En: '响应 = 窗口里 9 个像素 × 核里 9 个权重，再加总',
    formula1Zh: '这是全课唯一的式子，它本质上是“相似度打分”：脚下图案和模板越匹配，得分越高；图案平平无奇，得分接近 0。把所有位置的得分按原位置拼起来，就得到一张“特征图”（feature map）—— 标记着“哪里有我要找的东西”。',
    kernelMid: '换一个核里的数字，就换了一种探测目标 —— 同一张图，不同的核“看到”完全不同的东西：',
    useCards1: [
      { label: '找“亮度跳变”', en: <>边缘核 <b>Edge</b></>, zh: '两侧权重一正一负，亮度突变处响应最大 —— 物体的轮廓就此现形。' },
      { label: '找“两条边相交”', en: <>角点核 <b>Corner</b></>, zh: '对拐角形状敏感。桌角、窗框、眼角这类关键点，都逃不过它。' },
      { label: '找“规律重复”', en: <>纹理核 <b>Texture</b></>, zh: '对条纹、斑点、网格这类重复图案响应强烈 —— 毛发与布料的签名。' },
    ],
    learnedEn: <>关键转折：CNN 的核<span className="hl">不是人设计的，是学出来的</span></>,
    learnedZh: '上面这些是人类手工设计的经典滤波器，图像处理用了几十年。CNN 的突破在于：核里的 9 个数字本身就是权重，靠第 4 课讲的梯度下降从数据里自动调出来 —— 任务需要什么探测器，网络就自己“长出”什么探测器。一层里几十上百个核并行巡逻，各找各的模式。',
    layerTitle: '🏗️ 层叠之力：从边缘到人脸的三级跳',
    layerLead: '一个核只能找一种局部小模式，真正的魔法在“叠层”。第 6 课说过，深度网络靠逐层抽象把简单特征拼成复杂概念 —— CNN 就是它在视觉上的完美实例：下一层的核，扫描的是上一层的特征图，于是探测目标逐层升级。',
    tableHead: ['层级', '它在找什么', '好比汉字里的'],
    tableRows: [
      ['第 1 层', '边缘、色块、明暗突变', '笔画'],
      ['第 2 层', '把边缘拼成纹理、圆弧、简单形状', '部首'],
      ['第 3 层', '把形状拼成部件：眼睛、鼻子、车轮', '单字'],
      ['更深层', '把部件拼成整体：人脸、汽车、猫', '词句'],
    ],
    poolEn: <>池化 <span className="hl">Pooling</span>：缩图保要点</>,
    poolZh: '层与层之间常夹一步池化：每 2×2 格只保留最大响应，特征图边长减半。好处有二 —— 图变小、算得快；猫往旁边挪两个像素照样认得（这叫“抗位移”，shift invariance）。像把地图缩小：细节丢了，地标还在。',
    layerOutro: '这条“边缘 → 纹理 → 部件 → 整体”的流水线，此刻正运行在你身边的无数设备里：',
    useCards2: [
      { label: '口袋里 · 每天几十次', en: <>人脸解锁 <b>Face ID</b></>, zh: '用卷积网络提取你五官的特征，与注册时的模板比对，毫秒级完成 —— 第 1 层找的边缘最终拼成了“你”。' },
      { label: '医院里', en: <>医学影像读片 <b>Medical</b></>, zh: '在 CT、X 光、眼底照片里圈出疑似病灶。多项研究中，CNN 在特定病种的检出上可达资深医师水平 —— 但它是“提醒助手”，最终诊断仍由医生负责。' },
      { label: '马路上', en: <>自动驾驶感知 <b>Perception</b></>, zh: '从摄像头画面里框出车辆、行人、车道线。感知系统的视觉部分大量依赖 CNN（近年也与 Transformer 混合使用）。' },
      { label: '工厂里', en: <>工业质检 <b>Inspection</b></>, zh: '流水线上逐件拍照，找划痕、裂缝、缺件。比人眼快、不知疲倦，也不会下午三点开始走神。' },
    ],
    demoSecTitle: '🎛️ 交互演示：亲眼看一次卷积（convolution）',
    demoSecLead: '左边是一张 12×12 的灰度小图（一个“7”），中间的 3×3 卷积核扛着模板从左上角扫到右下角，右边 10×10 的特征图逐格点亮 —— 越亮代表响应越强。切换不同的核，看看它们各自“在乎”什么。',
    demoSecFootnote: '为什么输出是 10×10？—— 12 格宽的图里，3 格宽的窗口只有 12 − 3 + 1 = 10 个落脚位置，纵向同理。',
    medSourceNote: (
      <>
        “CNN 在特定病种检出上可达资深医师水平”的代表性研究见 Gulshan 等 2016 年《JAMA》糖尿病视网膜病变筛查论文{' '}
        <a href="https://jamanetwork.com/journals/jama/fullarticle/2588763" target="_blank" rel="noreferrer">
          Development and Validation of a Deep Learning Algorithm for Detection of Diabetic Retinopathy in Retinal Fundus Photographs
        </a>
        。
      </>
    ),
    advSourceNote: (
      <>
        在停车标志上贴贴纸使模型误判为限速牌的实验，见 Eykholt 等 2018 年论文{' '}
        <a href="https://arxiv.org/abs/1707.08945" target="_blank" rel="noreferrer">
          Robust Physical-World Attacks on Deep Learning Visual Classification
        </a>
        。
      </>
    ),
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: <>CNN 像人一样“看见”了一只完整的猫</>,
        good: <>它只是把成千上万个局部模式的响应，统计性地组合成一个判断</>,
        why: <><b>病因：</b>拟人化想象。CNN 没有“整体印象”，只有层层叠加的局部匹配分数 —— 耳朵尖的得分 + 胡须纹理的得分 + 毛发斑纹的得分，加起来超过阈值就报“猫”。所以背景诡异、姿势罕见、光线极端时它会翻车：它认的是“模式组合”，不是“猫”这个概念。</>,
      },
      {
        bad: <>识别准确率高，说明它真的理解了图像</>,
        good: <>在停车标志上贴几张小贴纸，就可能让模型把它认成限速牌 —— 这叫对抗样本（adversarial example）</>,
        why: <><b>病因：</b>把“统计拟合得好”当成“语义理解”。对人眼几乎无影响的微小扰动，能让 CNN 满盘皆错 —— 因为它依赖的是像素层面的数字模式，而不是“停车标志意味着必须停车”的含义。对抗样本是计算机视觉安全研究的核心课题，也时刻提醒我们：识别 ≠ 理解。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 一张 100×100 的灰度照片，在计算机里到底是什么？一共多少个数字？',
        a: <><b>一张 100×100 的数字网格，共 10,000 个 0~255 的亮度值。</b>彩色照片则是三张表（红/绿/蓝），3 万个数字。所谓“看懂这张照片”，就是在这一万个数字里找模式。</>,
      },
      {
        q: '2. 垂直边缘核（左列 −1、右列 +1）扫过一片纯色天空 —— 窗口里 9 个像素的数值几乎相同。它的响应大约是多少？为什么？',
        a: <><b>接近 0。</b>左列乘 −1、右列乘 +1，数值相同就正负相消。卷积核找的是“变化”：没有亮度跳变，就没有边缘，自然没有响应。这也解释了演示里笔画内部和空白处为何一片漆黑，被点亮的只有轮廓。</>,
      },
      {
        q: '3. 演示里输入图是 12×12、卷积核 3×3，为什么特征图是 10×10 而不是 12×12？',
        a: <><b>因为 3 格宽的窗口在 12 格宽的图上只有 12 − 3 + 1 = 10 个落脚位置</b>，纵向同理，所以输出 10×10。真实 CNN 常在图像四周补一圈 0（叫 padding），让输出保持原尺寸。</>,
      },
    ],
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '这一课你看清了：图像本质是数字网格，CNN 用层层卷积把像素拼成边缘、部件、整张脸。但计算机要处理的不只有图像 —— 文字呢？「猫」这个字在网络眼里又该是什么数字？下一课给出答案：把每个词变成一串坐标，扔进一个“语义空间”，让意思相近的词彼此靠近。',
    bridgeSteps: ['图像 = 数字网格（已懂）', '文字也得变数字', '每个词配一串坐标', '下一课：Embedding'],
  },

  en: {
    pixelAria: 'An 8×8 grayscale image: each cell also shows its pixel brightness value',
    keyList: [['h', 'Horizontal edge'], ['v', 'Vertical edge'], ['sharp', 'Sharpen'], ['blur', 'Blur']],
    demoStatusReady: 'Ready — click "Play" to send the detector off',
    demoTitle: '🎛️ Interactive · Scan an Image With a Kernel',
    demoHint: 'Pick a kernel → Play, or "Step" to watch cell by cell',
    demoCanvasAria: 'Convolution demo: a 3×3 kernel slides cell by cell over a 12×12 grayscale image, and the 10×10 feature map on the right lights up cell by cell according to response strength',
    btnPlay: '▶ Play',
    btnPause: '⏸ Pause',
    btnStep: '⏭ Step',
    btnReset: '↺ Reset',
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>Say what an image actually is inside a computer: a grid of numbers from 0–255, where "understanding an image" = finding patterns in the grid</>,
      <>Grasp how a kernel works: a little 3×3 detector slides cell by cell, responding strongly wherever it meets a matching local patch</>,
      <>Understand the power of stacking in a CNN: edges → textures → parts — exactly the visual instance of Lesson 6’s "layer-by-layer abstraction"</>,
      <>See through two popular misconceptions: AI does not "see" the whole; and recognizing accurately does not mean it truly understands</>,
    ],
    conceptTitle: '💡 Core Idea: To a Computer, an Image Is a Table of Numbers',
    conceptLead: 'First, correct a deep-rooted mental image: there is no "picture" inside a computer. Open any image, and all that’s stored is a table — each cell (a pixel) records one brightness number. So-called "seeing" is doing math on this table.',
    contrastTag1: 'Intuitive impression',
    contrastBig1: <>The computer stored a <span className="gap">"picture"</span></>,
    contrastNote1: 'As if there were real patterns, outlines, and a cat sitting on the hard drive, and the computer could "see" them the moment it opens its eyes.',
    contrastTag2: 'The real mechanism',
    contrastBig2: <>The computer stored a <span className="hl">grid of numbers</span></>,
    contrastNote2: 'Each cell is a brightness value from 0–255: 0 is pure black, 255 is pure white. A color image is just three such tables — red, green, and blue — stacked together.',
    pixFootnote: <>↑ Two ways to read the same data: stand back and it’s a "7"; lean in and it’s 64 numbers.<br />The computer has only the "lean-in" view — it has never seen the "7" on the left.</>,
    conceptOutro: <>So "understanding an image" gets translated into a math problem: <b>find patterns in the grid of numbers</b> — where the numbers jump suddenly (that’s an edge), where there’s regular repetition (that’s a texture), which patterns always appear together (those are parts like eyes and wheels). The convolutional neural network (CNN) is the machine built for this problem.</>,
    kernelTitle: '🔍 The Kernel: a 3×3 Detector Patrolling With a Template',
    kernelLead: 'The smallest part of a CNN is the kernel: a little 3×3 table holding the "pattern template" it’s looking for. Starting from the top-left of the image, it slides cell by cell, and at every stop it asks: "Do the 9 pixels under me look like my template?" If yes, it outputs a big number (a strong response); if not, it outputs something close to 0.',
    formula1En: 'response = the 9 pixels in the window × the 9 weights in the kernel, then summed',
    formula1Zh: 'This is the only formula in the whole lesson, and it’s essentially "similarity scoring": the better the patch underfoot matches the template, the higher the score; a bland patch scores close to 0. Stitch the scores from every position back into their original positions and you get a "feature map" — marking "where the thing I’m looking for is."',
    kernelMid: 'Change the numbers in a kernel and you change what it detects — on the same image, different kernels "see" completely different things:',
    useCards1: [
      { label: 'Find "brightness jumps"', en: <>Edge kernel <b>Edge</b></>, zh: 'With positive weights on one side and negative on the other, it responds most strongly where brightness changes abruptly — and an object’s outline emerges.' },
      { label: 'Find "two edges meeting"', en: <>Corner kernel <b>Corner</b></>, zh: 'Sensitive to corner shapes. Key points like table corners, window frames, and eye corners can’t escape it.' },
      { label: 'Find "regular repetition"', en: <>Texture kernel <b>Texture</b></>, zh: 'Responds strongly to repeating patterns like stripes, dots, and grids — the signature of fur and fabric.' },
    ],
    learnedEn: <>The key turning point: a CNN’s kernels <span className="hl">aren’t designed by humans, they’re learned</span></>,
    learnedZh: 'The ones above are classic filters hand-designed by humans, used in image processing for decades. The CNN breakthrough is this: the 9 numbers in a kernel are themselves weights, tuned automatically from data via the gradient descent from Lesson 4 — whatever detector the task needs, the network "grows" that detector on its own. Within one layer, dozens or hundreds of kernels patrol in parallel, each hunting its own pattern.',
    layerTitle: '🏗️ The Power of Stacking: a Triple Jump From Edges to Faces',
    layerLead: 'A single kernel can only find one kind of small local pattern; the real magic is in "stacking layers." As Lesson 6 said, deep networks assemble simple features into complex concepts through layer-by-layer abstraction — and the CNN is its perfect visual instance: the next layer’s kernels scan the previous layer’s feature maps, so the detection targets level up layer by layer.',
    tableHead: ['Layer', 'What it’s looking for', 'Its counterpart in Chinese characters'],
    tableRows: [
      ['Layer 1', 'Edges, color blocks, light/dark jumps', 'Strokes'],
      ['Layer 2', 'Assembling edges into textures, arcs, simple shapes', 'Radicals'],
      ['Layer 3', 'Assembling shapes into parts: eyes, noses, wheels', 'Single characters'],
      ['Deeper layers', 'Assembling parts into wholes: faces, cars, cats', 'Words and phrases'],
    ],
    poolEn: <>Pooling <span className="hl">Pooling</span>: shrink the image, keep the essentials</>,
    poolZh: 'Between layers there’s often a pooling step: for every 2×2 cells keep only the maximum response, halving the feature map’s side length. It has two benefits — the image shrinks and computation speeds up; and a cat shifted two pixels to the side is still recognized (this is called "shift invariance"). It’s like shrinking a map: the details are lost, but the landmarks remain.',
    layerOutro: 'This "edges → textures → parts → wholes" pipeline is, at this very moment, running in countless devices around you:',
    useCards2: [
      { label: 'In your pocket · dozens of times a day', en: <>Face unlock <b>Face ID</b></>, zh: 'It uses a convolutional network to extract features of your facial features, compares them against the template from enrollment, and finishes in milliseconds — the edges found by Layer 1 ultimately assemble into "you."' },
      { label: 'In the hospital', en: <>Medical imaging <b>Medical</b></>, zh: 'It circles suspected lesions in CT, X-ray, and fundus images. In many studies, CNNs reach the level of senior physicians at detecting certain conditions — but it’s a "reminder assistant," and the final diagnosis still rests with the doctor.' },
      { label: 'On the road', en: <>Autonomous-driving perception <b>Perception</b></>, zh: 'It boxes out vehicles, pedestrians, and lane lines from camera footage. The vision part of a perception system relies heavily on CNNs (in recent years also mixed with Transformers).' },
      { label: 'In the factory', en: <>Industrial inspection <b>Inspection</b></>, zh: 'It photographs each item on the line, looking for scratches, cracks, and missing parts. Faster than the human eye, tireless, and it won’t start zoning out at three in the afternoon.' },
    ],
    demoSecTitle: '🎛️ Interactive Demo: See a Convolution With Your Own Eyes',
    demoSecLead: 'On the left is a small 12×12 grayscale image (a "7"), in the middle a 3×3 kernel carries its template and scans from top-left to bottom-right, and on the right a 10×10 feature map lights up cell by cell — brighter means a stronger response. Switch between kernels to see what each one "cares about."',
    demoSecFootnote: 'Why is the output 10×10? — In an image 12 cells wide, a window 3 cells wide has only 12 − 3 + 1 = 10 landing positions, and the same holds vertically.',
    medSourceNote: (
      <>
        For a representative study behind "CNNs reach senior-physician level at detecting certain conditions," see Gulshan et al. 2016 (JAMA),{' '}
        <a href="https://jamanetwork.com/journals/jama/fullarticle/2588763" target="_blank" rel="noreferrer">
          Development and Validation of a Deep Learning Algorithm for Detection of Diabetic Retinopathy in Retinal Fundus Photographs
        </a>
        .
      </>
    ),
    advSourceNote: (
      <>
        For the experiment where stickers on a stop sign make the model read it as a speed-limit sign, see Eykholt et al. 2018,{' '}
        <a href="https://arxiv.org/abs/1707.08945" target="_blank" rel="noreferrer">
          Robust Physical-World Attacks on Deep Learning Visual Classification
        </a>
        .
      </>
    ),
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: <>A CNN, like a human, "sees" a complete cat</>,
        good: <>It merely combines the responses of thousands of local patterns, statistically, into a single judgment</>,
        why: <><b>Cause:</b> anthropomorphic imagination. A CNN has no "overall impression," only layer-upon-layer local match scores — the score for pointy ears + the score for whisker texture + the score for fur markings; add them up past a threshold and it reports "cat." So when the background is bizarre, the pose is rare, or the lighting is extreme, it fails: it recognizes a "combination of patterns," not the concept "cat."</>,
      },
      {
        bad: <>High recognition accuracy means it truly understands the image</>,
        good: <>Stick a few small stickers on a stop sign and the model may read it as a speed-limit sign — this is called an adversarial example</>,
        why: <><b>Cause:</b> mistaking "fits the statistics well" for "semantic understanding." Tiny perturbations that barely affect the human eye can make a CNN go completely wrong — because it relies on numerical patterns at the pixel level, not the meaning that "a stop sign means you must stop." Adversarial examples are a core topic in computer-vision security research, and a constant reminder: recognition ≠ understanding.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A 100×100 grayscale photo — what is it really, inside a computer? How many numbers in total?',
        a: <><b>A 100×100 grid of numbers, 10,000 brightness values from 0–255 in all.</b> A color photo is three tables (red/green/blue), 30,000 numbers. So-called "understanding this photo" is finding patterns among these ten thousand numbers.</>,
      },
      {
        q: '2. A vertical edge kernel (left column −1, right column +1) scans across a patch of solid-color sky — the 9 pixels in the window are nearly identical. About what is its response, and why?',
        a: <><b>Close to 0.</b> The left column times −1 and the right column times +1; identical values cancel out positive against negative. A kernel looks for "change": with no brightness jump there’s no edge, and naturally no response. This also explains why, in the demo, the stroke interiors and the blank areas stay pitch black, and only the outlines light up.</>,
      },
      {
        q: '3. In the demo the input image is 12×12 and the kernel is 3×3 — why is the feature map 10×10 rather than 12×12?',
        a: <><b>Because a window 3 cells wide has only 12 − 3 + 1 = 10 landing positions on an image 12 cells wide</b>, and the same holds vertically, so the output is 10×10. Real CNNs often pad a ring of 0s around the image (called padding) to keep the output at the original size.</>,
      },
    ],
    bridgeTitle: '➡️ How This Leads to Lesson 8',
    bridgeLead: 'This lesson made it clear: an image is fundamentally a grid of numbers, and a CNN uses layers of convolution to assemble pixels into edges, parts, and a whole face. But images aren’t the only thing computers must handle — what about text? What number should the word "cat" be in the network’s eyes? The next lesson answers: turn every word into a string of coordinates and drop it into a "semantic space," so words close in meaning sit close together.',
    bridgeSteps: ['Image = number grid (done)', 'Text must become numbers too', 'Each word gets coordinates', 'Next: Embedding'],
  },
}

// 像素数字网格（核心概念配图）—— 灰阶为像素数据本身，不走主题色
const PIX = ['........', '.######.', '.....##.', '....##..', '...##...', '..##....', '..##....', '........']
function PixelGrid({ c }) {
  const C = 34, n = 8
  const cells = []
  PIX.forEach((row, r) => {
    for (let c = 0; c < n; c++) {
      const i = r * n + c
      const v = row[c] === '#' ? 212 + ((i * 37) % 44) : 6 + ((i * 23) % 20)
      const tc = v > 140 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.82)'
      cells.push(
        <g key={i}>
          <rect x={c * C + 1} y={r * C + 1} width={C - 2} height={C - 2} rx="3" fill={`rgb(${v},${v},${v})`} />
          <text x={c * C + C / 2} y={r * C + C / 2 + 3.5} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={tc}>{v}</text>
        </g>,
      )
    }
  })
  return (
    <svg viewBox={`0 0 ${n * C} ${n * C}`} width="300" aria-label={c.pixelAria}>{cells}</svg>
  )
}

function ConvDemo({ c }) {
  const { lang } = useLang()
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [key, setKey] = useState('h')
  const [status, setStatus] = useState(c.demoStatusReady)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const ctrl = createConvScan(canvasRef.current, { onStatus: setStatus, onPlaying: setPlaying, lang })
    ctrlRef.current = ctrl
    ctrl.selectKernel('h')
    return () => ctrl.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 语言切换：只刷新画布文案与状态行，不重置扫描动画。
  useEffect(() => {
    ctrlRef.current?.setLang(lang)
  }, [lang])

  const select = (k) => { setKey(k); ctrlRef.current?.selectKernel(k) }
  const kd = KERNELS[key]
  const pick = (f) => (f && typeof f === 'object' ? (f[lang] || f.zh) : f)

  return (
    <div className="card demo conv-demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-stage">
        <canvas ref={canvasRef} aria-label={c.demoCanvasAria} />
      </div>
      <div className="demo-side">
        <div className="chips">
          {c.keyList.map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => select(k)}>{label}</button>
          ))}
        </div>
        <div className="ctrl-row">
          <button className="chip" onClick={() => ctrlRef.current?.togglePlay()}>{playing ? c.btnPause : c.btnPlay}</button>
          <button className="chip" onClick={() => ctrlRef.current?.step()}>{c.btnStep}</button>
          <button className="chip" onClick={() => ctrlRef.current?.reset()}>{c.btnReset}</button>
        </div>
        <h4>{pick(kd.name)}</h4>
        <div className="period">{pick(kd.sub)}</div>
        <p>{pick(kd.desc)}</p>
        <div className="period" id="ck-status">{status}</div>
      </div>
    </div>
  )
}

export default function L07() {
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
            <span className="tag pill pill-terracotta">{c.contrastTag1}</span>
            <div className="big">{c.contrastBig1}</div>
            <p className="note">{c.contrastNote1}</p>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">{c.contrastTag2}</span>
            <div className="big">{c.contrastBig2}</div>
            <p className="note">{c.contrastNote2}</p>
          </div>
        </div>
        <div className="card pix-card">
          <PixelGrid c={c} />
          <p className="footnote">{c.pixFootnote}</p>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.conceptOutro}</p>
      </Lsec>

      <Lsec
        title={c.kernelTitle}
        lead={c.kernelLead}
      >
        <div className="example">
          <div className="en">{c.formula1En}</div>
          <div className="zh">{c.formula1Zh}</div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.kernelMid}</p>
        <div className="use-grid">
          {c.useCards1.map((card, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{card.label}</div>
              <div className="en">{card.en}</div>
              <div className="zh">{card.zh}</div>
            </div>
          ))}
        </div>
        <div className="example" style={{ marginTop: 14 }}>
          <div className="en">{c.learnedEn}</div>
          <div className="zh">{c.learnedZh}</div>
        </div>
      </Lsec>

      <Lsec
        title={c.layerTitle}
        lead={c.layerLead}
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.tableHead[0]}</th><th>{c.tableHead[1]}</th><th>{c.tableHead[2]}</th></tr></thead>
            <tbody>
              {c.tableRows.map((row, i) => (
                <tr key={i}><td className="be">{row[0]}</td><td className="ex">{row[1]}</td><td>{row[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="example" style={{ marginTop: 14 }}>
          <div className="en">{c.poolEn}</div>
          <div className="zh">{c.poolZh}</div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>{c.layerOutro}</p>
        <div className="use-grid cols-2">
          {c.useCards2.map((card, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{card.label}</div>
              <div className="en">{card.en}</div>
              <div className="zh">{card.zh}</div>
            </div>
          ))}
        </div>
        <p className="footnote source-note">{c.medSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.demoSecTitle}
        lead={c.demoSecLead}
      >
        <ConvDemo c={c} />
        <span className="footnote" style={{ display: 'block', marginTop: 12 }}>{c.demoSecFootnote}</span>
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
        <p className="footnote source-note">{c.advSourceNote}</p>
      </Lsec>

      <Lsec title={c.quizTitle}>
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.bridgeTitle} lead={c.bridgeLead}>
        <div className="bridge-flow">
          {c.bridgeSteps.map((step, i) => (
            <span className="bridge-flow-item" key={step}>
              <span className="bridge-flow-step">
                <b>{i + 1}</b>
                {step}
              </span>
              {i < c.bridgeSteps.length - 1 && <span className="bridge-flow-arrow">→</span>}
            </span>
          ))}
        </div>
      </Lsec>
    </>
  )
}
