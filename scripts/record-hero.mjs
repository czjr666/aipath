// 录制首屏 LLMHero 交互动画 → webm（之后用 ffmpeg 裁剪转 mp4/gif）
// 用法: node scripts/record-hero.mjs [url] [lang]
import { chromium } from 'playwright'
import fs from 'fs'

const URL = process.argv[2] || 'http://localhost:5174/'
const LANG = process.argv[3] || 'zh' // zh | en
const OUT = 'media'
fs.mkdirSync(OUT, { recursive: true })

const VW = 1440, VH = 940

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: VW, height: VH } },
})
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })

// 切语言（站点把语言存在 localStorage，简单起见直接设置后刷新）
if (LANG === 'en') {
  await page.evaluate(() => { try { localStorage.setItem('aipath-lang', 'en') } catch {} })
  await page.reload({ waitUntil: 'networkidle' })
}

const viz = page.locator('.hero-viz')
await viz.waitFor({ state: 'visible' })
await viz.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

const box = await viz.boundingBox()
fs.writeFileSync(`${OUT}/box.json`, JSON.stringify(box))
console.log('hero-viz box:', box)

// 让打字机先跑一会儿
await page.waitForTimeout(3200)

// 拖动温度滑杆，展示概率条随温度重塑
const slider = page.locator('.lh-temp input[type=range]')
const sb = await slider.boundingBox()
if (sb) {
  const y = sb.y + sb.height / 2
  const x0 = sb.x + 6, x1 = sb.x + sb.width - 6
  await page.mouse.move(x0 + (x1 - x0) * 0.25, y)
  await page.mouse.down()
  // 拉向高温
  for (let i = 0; i <= 20; i++) {
    await page.mouse.move(x0 + (x1 - x0) * (0.25 + 0.7 * i / 20), y)
    await page.waitForTimeout(60)
  }
  await page.waitForTimeout(900)
  // 拉回低温
  for (let i = 0; i <= 20; i++) {
    await page.mouse.move(x1 - (x1 - x0) * (0.7 * i / 20), y)
    await page.waitForTimeout(60)
  }
  await page.mouse.up()
}

// 再让它继续生成一会儿
await page.waitForTimeout(3800)

await context.close() // 触发 video 落盘
await browser.close()

// 找到生成的 webm 文件名
const webm = fs.readdirSync(OUT).filter(f => f.endsWith('.webm')).map(f => ({ f, t: fs.statSync(`${OUT}/${f}`).mtimeMs })).sort((a, b) => b.t - a.t)[0]
console.log('VIDEO:', `${OUT}/${webm.f}`)
