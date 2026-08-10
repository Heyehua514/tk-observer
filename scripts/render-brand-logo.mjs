import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('../apps/web/node_modules/playwright')

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceDir = `${root}/apps/web/src/assets/brand`
const outputDir = `${root}/design-assets/tk-observer-logo`

export const LOGO_EXPORTS = [
  {
    source: 'tk-observer-mark.svg',
    output: 'tk-observer-mark-1024.png',
  },
  {
    source: 'tk-observer-mark-symbol.svg',
    output: 'tk-observer-mark-symbol-1024.png',
  },
  {
    source: 'tk-observer-mark-mono.svg',
    output: 'tk-observer-mark-mono-1024.png',
  },
]

function svgDataUrl(source) {
  return `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`
}

async function renderSquare(page, source, output) {
  await page.setViewportSize({ width: 1024, height: 1024 })
  await page.setContent(`
    <!doctype html>
    <html>
      <head><style>html,body{margin:0;width:1024px;height:1024px;background:transparent}img{display:block;width:1024px;height:1024px}</style></head>
      <body><img alt="" src="${svgDataUrl(source)}"></body>
    </html>
  `)
  await page.screenshot({ path: output, omitBackground: true })
}

async function renderPreview(page, primary, symbol, mono) {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.setContent(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <style>
          *{box-sizing:border-box}html,body{margin:0;width:1600px;height:1000px;overflow:hidden}body{font-family:Inter,"PingFang SC",sans-serif;color:#173149;background:#edf3f7}
          .canvas{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(145deg,#fff 3%,#f1f6f8 50%,#e4edf2 100%)}
          .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(31,92,82,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(31,92,82,.045) 1px,transparent 1px);background-size:58px 58px;mask-image:linear-gradient(90deg,transparent,black 35%,black)}
          .brand{position:absolute;left:74px;top:60px;display:flex;align-items:center;gap:18px;font-size:28px;font-weight:760;letter-spacing:0}.brand img{width:64px;height:64px}.brand small{display:block;margin-top:4px;font-size:12px;font-weight:550;letter-spacing:.12em;color:#738498}
          .form{position:absolute;left:74px;top:230px;width:430px}.form h1{margin:0;font-size:44px;letter-spacing:0}.form p{margin:15px 0 38px;color:#708195;font-size:17px}.label{margin:18px 0 8px;font-size:13px;font-weight:650}.input{height:54px;border:1px solid rgba(70,103,120,.2);border-radius:8px;background:rgba(255,255,255,.68);box-shadow:inset 0 1px 0 #fff}.button{height:54px;margin-top:24px;border-radius:8px;background:#087d6e;color:#fff;display:grid;place-items:center;font-weight:700;box-shadow:0 16px 28px rgba(8,125,110,.2)}
          .stage{position:absolute;right:45px;top:62px;width:930px;height:730px;transform:perspective(1200px) rotateY(-4deg)}
          .glass{position:absolute;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.44);backdrop-filter:blur(22px) saturate(125%);box-shadow:0 34px 70px rgba(50,83,98,.13),inset 0 1px 0 #fff}.slab-a{inset:88px 80px 30px 70px;border-radius:60px;transform:rotate(-7deg)}.slab-b{right:24px;top:0;width:390px;height:430px;border-radius:48px;transform:rotate(12deg);background:rgba(223,234,239,.52)}.slab-c{left:5px;top:130px;width:490px;height:180px;border-radius:28px;transform:rotate(8deg)}
          .hero-logo{position:absolute;right:175px;top:175px;width:300px;height:300px;border-radius:70px;filter:drop-shadow(0 34px 30px rgba(6,63,55,.18));transform:rotate(4deg)}
          .float{position:absolute;border-radius:22px;box-shadow:0 22px 34px rgba(47,80,95,.14)}.float.one{left:145px;top:305px;width:150px;height:62px;background:#16c3a5;transform:rotate(-10deg)}.float.two{left:310px;bottom:115px;width:88px;height:88px;border-radius:50%;background:rgba(109,156,255,.8)}.float.three{right:110px;bottom:72px;width:150px;height:70px;background:rgba(255,255,255,.72);border:1px solid #fff}
          .variants{position:absolute;left:74px;right:74px;bottom:48px;height:140px;border-top:1px solid rgba(75,104,120,.15);display:flex;align-items:center;gap:44px}.variant{display:flex;align-items:center;gap:15px}.variant img{width:70px;height:70px}.variant .small{width:32px;height:32px}.variant b{display:block;font-size:14px}.variant span{display:block;margin-top:4px;color:#7b8a9b;font-size:12px}.dark{padding:15px 22px;border-radius:12px;background:#173149;color:#fff}.glass-chip{padding:15px 22px;border:1px solid #fff;border-radius:12px;background:rgba(255,255,255,.5);backdrop-filter:blur(12px)}
        </style>
      </head>
      <body>
        <main class="canvas">
          <div class="grid"></div>
          <div class="brand"><img src="${svgDataUrl(primary)}" alt=""><div>TK观察工作台<small>TK OBSERVER WORKBENCH</small></div></div>
          <section class="form"><h1>欢迎回来</h1><p>看见增长信号，推动团队行动。</p><div class="label">邮箱</div><div class="input"></div><div class="label">密码</div><div class="input"></div><div class="button">登录工作台</div></section>
          <section class="stage"><div class="glass slab-a"></div><div class="glass slab-b"></div><div class="glass slab-c"></div><img class="hero-logo" src="${svgDataUrl(primary)}" alt=""><div class="float one"></div><div class="float two"></div><div class="float three"></div></section>
          <section class="variants"><div class="variant"><img src="${svgDataUrl(primary)}" alt=""><div><b>主应用图标</b><span>1024 / 64 / 32px</span></div></div><div class="variant dark"><img class="small" src="${svgDataUrl(symbol)}" alt=""><div><b>深色侧边栏</b><span>透明符号</span></div></div><div class="variant glass-chip"><img class="small" src="${svgDataUrl(symbol)}" alt=""><div><b>毛玻璃界面</b><span>透明符号</span></div></div><div class="variant"><img class="small" src="${svgDataUrl(mono)}" alt=""><div><b>单色印刷</b><span>一个前景色</span></div></div></section>
        </main>
      </body>
    </html>
  `)
  await page.screenshot({ path: `${outputDir}/tk-observer-logo-preview.png` })
}

export async function renderBrandLogos() {
  await mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ deviceScaleFactor: 1 })

  try {
    const sources = await Promise.all(
      LOGO_EXPORTS.map(({ source }) => readFile(`${sourceDir}/${source}`, 'utf8'))
    )
    for (const [index, item] of LOGO_EXPORTS.entries()) {
      await renderSquare(page, sources[index], `${outputDir}/${item.output}`)
    }
    await renderPreview(page, ...sources)
  } finally {
    await browser.close()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await renderBrandLogos()
}
