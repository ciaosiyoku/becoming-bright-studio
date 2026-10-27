#!/usr/bin/env node
// Draws the Becoming Bright Studio logo: every file in brand/ (SVGs, PNG sizes, favicon.ico) from the artwork below.
// Not part of the build (the results are committed). To change the logo, edit here and run:
//   npm i --no-save opentype.js playwright-core
//   node scripts/make-brand.mjs            (uses Microsoft Edge or Chrome to render the PNGs)
// The wordmark text is converted to outlines with Fredoka SemiBold (SIL OFL, from @fontsource/fredoka), so no font
// needs to be installed wherever the SVGs are shown.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import * as opentype from 'opentype.js'
import { chromium } from 'playwright-core'

// ---- Colours (brand/README.md) ----
const C = {
  night: '#1B2540',
  cream: '#FFF8F0',
  gold: '#F8C24A',
  amber: '#E08A1E',
  coral: '#E2557E',
  teal: '#178C84',
  leafGreen: '#2E9E62',
}

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1E2850"/><stop offset=".45" stop-color="#4A3F86"/><stop offset=".72" stop-color="#C9628A"/><stop offset="1" stop-color="#FFB36B"/>
  </linearGradient>
  <radialGradient id="sun" cx=".5" cy=".38" r=".62">
    <stop offset="0" stop-color="#FFF4C7"/><stop offset=".5" stop-color="#FFD15C"/><stop offset="1" stop-color="#F29A2E"/>
  </radialGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
  <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46C07F"/><stop offset="1" stop-color="#1D7A50"/></linearGradient>
  <linearGradient id="coralLeaf" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F58AAA"/><stop offset="1" stop-color="#C93C68"/></linearGradient>
  <linearGradient id="tealLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3CC4B8"/><stop offset="1" stop-color="#0F7A72"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2A1240" flood-opacity=".35"/></filter>
</defs>`

/** Sun rays fanning above the horizon (angles in degrees from straight up). */
function rays(cx, cy, inner, outer) {
  return [-80, -60, -40, -20, 0, 20, 40, 60, 80]
    .map((a) => {
      const r = (a * Math.PI) / 180
      const x1 = cx + inner * Math.sin(r)
      const y1 = cy - inner * Math.cos(r)
      const len = a % 40 === 0 ? outer : outer - 26
      const x2 = cx + len * Math.sin(r)
      const y2 = cy - len * Math.cos(r)
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`
    })
    .join('')
}

/** The sprout: a stem with a coral leaf (the child) and a teal leaf (the parent). */
const SPROUT = `<g filter="url(#soft)">
    <path d="M256 452 C256 410 252 380 256 334" stroke="${C.leafGreen}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M254 352 C226 316 186 312 160 326 C176 362 222 378 254 352 Z" fill="url(#coralLeaf)"/>
    <path d="M258 340 C286 300 330 292 358 306 C344 346 296 366 258 340 Z" fill="url(#tealLeaf)"/>
    <path d="M250 350 C226 334 200 330 178 332" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M262 338 C288 320 314 314 338 314" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>`

/** The artwork in a 512 × 512 box. `sky`: draw the dawn sky (icons); without it, the mark for any background. */
function artwork({ sky }) {
  const stars = sky
    ? `<g fill="#FFF8F0"><circle cx="96" cy="92" r="5" opacity=".9"/><circle cx="150" cy="58" r="3" opacity=".7"/><circle cx="418" cy="80" r="4" opacity=".85"/><circle cx="372" cy="46" r="2.6" opacity=".6"/><circle cx="452" cy="140" r="2.6" opacity=".5"/><circle cx="62" cy="160" r="2.6" opacity=".45"/></g>`
    : ''
  return `${stars}
  <circle cx="256" cy="300" r="200" fill="url(#halo)"/>
  <g stroke="#FFD15C" stroke-width="14" stroke-linecap="round" opacity=".95">${rays(256, 300, 132, 196)}</g>
  <circle cx="256" cy="300" r="112" fill="url(#sun)"/>
  <path d="M0 360 C110 318 190 332 256 346 C330 362 420 330 512 352 L512 512 L0 512 Z" fill="url(#hill)"/>
  ${SPROUT}`
}

const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>\n${DEFS}\n${body}\n</svg>\n`

/** App icon with rounded corners, square (iOS rounds it), and maskable (art inside the 80 % safe zone). */
const clip = (rx) => `<clipPath id="tile"><rect width="512" height="512" rx="${rx}"/></clipPath>`
const ICON = svg(512, 512, `<defs>${clip(112)}</defs><g clip-path="url(#tile)"><rect width="512" height="512" fill="url(#sky)"/>${artwork({ sky: true })}</g>`)
const SQUARE = svg(512, 512, `<rect width="512" height="512" fill="url(#sky)"/>${artwork({ sky: true })}`)
const MASKABLE = svg(512, 512, `<rect width="512" height="512" fill="url(#sky)"/><g transform="translate(51.2 51.2) scale(.8)">${artwork({ sky: true })}</g><path d="M0 410 C120 380 380 380 512 405 L512 512 L0 512 Z" fill="url(#hill)"/>`)

/** The mark without a background: sun, rays, a round hill and the sprout, cut to a circle. */
const MARK_BODY = `<defs><clipPath id="disc"><circle cx="256" cy="290" r="222"/></clipPath></defs><g clip-path="url(#disc)">${artwork({ sky: false })}</g>`
const MARK = svg(512, 512, MARK_BODY)

// ---- Wordmarks: text as outlines ----
const font = opentype.parse(readFileSync('node_modules/@fontsource/fredoka/files/fredoka-latin-600-normal.woff').buffer)
/** Text as an SVG path, its left edge at x and baseline at y; returns the path and its width. */
// Laid out letter by letter, each letter drawn at the origin and moved with translate: opentype.js 1.3 writes
// "NaN" into some of Fredoka's letters when they are drawn away from the origin, and browsers stop drawing a
// path at the first NaN. A kerning value that is not a number counts as 0.
function text(str, x, y, size, fill) {
  const scale = size / font.unitsPerEm
  const glyphs = font.stringToGlyphs(str)
  let at = x
  const parts = glyphs.map((g, i) => {
    const d = g.getPath(0, 0, size).toPathData(2)
    if (d.includes('NaN')) throw new Error(`bad outline for "${str}"`)
    const part = d ? `<path transform="translate(${at.toFixed(2)} ${y})" d="${d}"/>` : ''
    const kern = i + 1 < glyphs.length ? font.getKerningValue(g, glyphs[i + 1]) : 0
    at += (g.advanceWidth + (Number.isFinite(kern) ? kern : 0)) * scale
    return part
  })
  return { d: `<g fill="${fill}">${parts.join('')}</g>`, width: at - x }
}

function wordmark(dark, oneLine) {
  const ink = dark ? C.cream : C.night
  const bright = dark ? C.gold : C.amber
  const markSize = oneLine ? 150 : 220
  const mark = `<g transform="translate(10 ${oneLine ? 6 : 10}) scale(${markSize / 512})">${MARK_BODY}</g>`
  if (oneLine) {
    const x0 = markSize + 26
    const a = text('Becoming ', x0, 112, 80, ink)
    const b = text('Bright ', x0 + a.width, 112, 80, bright)
    const c = text('Studio', x0 + a.width + b.width, 112, 80, ink)
    const w = Math.ceil(x0 + a.width + b.width + c.width + 16)
    return svg(w, 165, `${mark}${a.d}${b.d}${c.d}`)
  }
  const x0 = markSize + 30
  const a = text('Becoming ', x0, 112, 84, ink)
  const b = text('Bright', x0 + a.width, 112, 84, bright)
  const c = text('Studio', x0, 204, 84, ink)
  const w = Math.ceil(x0 + Math.max(a.width + b.width, c.width) + 16)
  return svg(w, 240, `${mark}${a.d}${b.d}${c.d}`)
}

const FILES = {
  'icon.svg': ICON,
  'icon-square.svg': SQUARE,
  'icon-maskable.svg': MASKABLE,
  'mark.svg': MARK,
  'wordmark-light.svg': wordmark(false, false),
  'wordmark-dark.svg': wordmark(true, false),
  'wordmark-line-light.svg': wordmark(false, true),
  'wordmark-line-dark.svg': wordmark(true, true),
}
mkdirSync('brand/png', { recursive: true })
for (const [name, content] of Object.entries(FILES)) writeFileSync(`brand/${name}`, content)

// ---- PNGs, rendered by the browser ----
const PNGS = [
  ...[16, 32, 48, 96, 192, 512, 1024].map((s) => ['icon.svg', `icon-${s}.png`, s, s]),
  ['icon-maskable.svg', 'icon-maskable-192.png', 192, 192],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512, 512],
  ['icon-square.svg', 'apple-touch-icon-180.png', 180, 180],
  ['icon-square.svg', 'apple-touch-icon-512.png', 512, 512],
  ['mark.svg', 'mark.png', 512, 512],
]
const sizeOf = (s) => s.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number)
for (const name of ['wordmark-light.svg', 'wordmark-dark.svg', 'wordmark-line-light.svg', 'wordmark-line-dark.svg']) {
  const [w, h] = sizeOf(FILES[name])
  PNGS.push([name, name.replace('.svg', '.png'), w * 2, h * 2])
}
const browsers = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
const browser = await chromium.launch({ executablePath: browsers.find((b) => existsSync(b)) })
const page = await browser.newPage()
for (const [from, to, w, h] of PNGS) {
  await page.setViewportSize({ width: w, height: h })
  const data = Buffer.from(FILES[from]).toString('base64')
  await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:${w}px;height:${h}px}</style><img src="data:image/svg+xml;base64,${data}">`)
  // Wait until the picture is fully decoded and painted: big ones are drawn in pieces.
  await page.evaluate(() => document.images[0].decode())
  await page.waitForTimeout(150)
  writeFileSync(`brand/png/${to}`, await page.screenshot({ omitBackground: true }))
}
await browser.close()

// ---- favicon.ico: the 16, 32 and 48 px PNGs inside one ICO file ----
const pngs = [16, 32, 48].map((s) => readFileSync(`brand/png/icon-${s}.png`))
const header = Buffer.alloc(6 + 16 * pngs.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(pngs.length, 4)
let offset = header.length
pngs.forEach((png, i) => {
  const s = [16, 32, 48][i]
  const at = 6 + 16 * i
  header.writeUInt8(s, at)
  header.writeUInt8(s, at + 1)
  header.writeUInt16LE(1, at + 4)
  header.writeUInt16LE(32, at + 6)
  header.writeUInt32LE(png.length, at + 8)
  header.writeUInt32LE(offset, at + 12)
  offset += png.length
})
writeFileSync('brand/favicon.ico', Buffer.concat([header, ...pngs]))
console.log(`make-brand: ${Object.keys(FILES).length} SVGs, ${PNGS.length} PNGs and favicon.ico in brand/`)
