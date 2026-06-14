// 生成社交分享图 og-image —— 还原站点设计系统（暖纸质感 + 墨色品牌）。
// 用 Playwright 渲染 HTML 模板后截图，输出 2400×1260（1200×630 @2x）。
// 用法: node scripts/og-image.mjs            → 同时生成中英两版
//       node scripts/og-image.mjs en         → 只生成英文版 public/og-image-en.png
//       node scripts/og-image.mjs zh         → 只生成中文版 public/og-image.png
import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 两种语言的文案 —— 与 src/i18n/strings.js 的 home / brand 对齐。
const VARIANTS = {
  zh: {
    out: 'public/og-image.png',
    htmlLang: 'zh-CN',
    brand: '通识课',           // logo 方块里是 “AI”，外面接 “通识课” → AI 通识课
    h1a: '为中文学习者设计的',
    h1b: 'AI 入门课',
    features: '可视化 · 交互演示 · 6 阶段 30 课 · 几乎零数学',
  },
  en: {
    out: 'public/og-image-en.png',
    htmlLang: 'en',
    brand: 'Essentials',       // AI + Essentials → AI Essentials
    h1a: 'An Intuitive',
    h1b: 'Intro to AI',
    features: 'Visual · Interactive demos · 6 stages, 30 lessons · Almost zero math',
  },
}

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`

function html(v) {
  return `<!doctype html><html lang="${v.htmlLang}"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: ${FONT};
    background: linear-gradient(135deg, #FDFBF6 0%, #F4EFE2 100%);
    color: #1A1410; -webkit-font-smoothing: antialiased;
    position: relative; overflow: hidden;
  }
  .frame {
    position: absolute; inset: 20px; border: 1px solid rgba(26,20,16,0.08);
    border-radius: 28px;
  }
  .pad { position: absolute; inset: 0; padding: 76px 84px;
    display: flex; flex-direction: column; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .dot {
    width: 60px; height: 60px; border-radius: 16px;
    background: #1A1410; color: #FAF6EC;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
  }
  .brand-name { font-size: 30px; font-weight: 700; letter-spacing: -0.01em; }
  h1 {
    font-size: 86px; font-weight: 800; line-height: 1.12; letter-spacing: -0.025em;
    color: #1A1410;
  }
  .caret {
    display: inline-block; width: 0.46em; height: 0.1em; vertical-align: -0.04em;
    border-bottom: 8px solid #1A1410; margin-left: 6px;
  }
  .features { font-size: 28px; font-weight: 500; color: #8B8275; letter-spacing: -0.005em; }
  </style></head><body>
    <div class="frame"></div>
    <div class="pad">
      <div class="brand">
        <span class="dot">AI</span>
        <span class="brand-name">${v.brand}</span>
      </div>
      <h1>${v.h1a}<br>${v.h1b}<span class="caret"></span></h1>
      <div class="features">${v.features}</div>
    </div>
  </body></html>`
}

const which = process.argv[2]
const langs = which ? [which] : ['zh', 'en']

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

for (const lang of langs) {
  const v = VARIANTS[lang]
  if (!v) { console.error(`unknown lang: ${lang}`); continue }
  await page.setContent(html(v), { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  const out = path.join(ROOT, v.out)
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log('✓', v.out)
}

await browser.close()
