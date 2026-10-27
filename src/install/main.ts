import '@fontsource/andika/latin-400.css'
import '@fontsource/andika/latin-700.css'
import '@fontsource/fredoka/latin-600.css'
import qrcode from 'qrcode-generator'
import { deviceLang, stringsFor } from '@/i18n'
import { DEVICES, type Device, detectDevice } from './device'
import './install.css'

// The install page (install.html): what the app is (a web app that does not block other apps), the steps for the
// device that opened it, the other devices one tap away, and a QR code for opening this page on a tablet. It
// speaks the device's language. No React: it is small.

/** Where the source code lives. */
const SOURCE_URL = 'https://github.com/ciaosiyoku/becoming-bright-studio'

const lang = deviceLang()
const t = stringsFor(lang)
document.documentElement.lang = lang
document.title = t.install.title

const appUrl = new URL('./', location.href).href
const here = location.href.split('#')[0].split('?')[0]
const device = detectDevice(navigator.userAgent, navigator.maxTouchPoints)

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const steps = (d: Device) => `<ol class="steps">${t.install.steps[d].map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`

function qr(text: string): string {
  const code = qrcode(0, 'M')
  code.addData(text)
  code.make()
  return code.createSvgTag({ cellSize: 5, margin: 2, scalable: true })
}

document.getElementById('install')!.innerHTML = `
  <header>
    <img src="./icons/icon.svg" alt="" width="96" height="96" />
    <div>
      <h1>${esc(t.install.title)}</h1>
      <p class="tagline">${esc(t.tagline)}</p>
      <p class="what">${esc(t.install.what)}</p>
      <p>${esc(t.install.intro)}</p>
    </div>
  </header>
  <section class="card">
    <h2>${esc(t.install.forDevice)}: ${esc(t.install.devices[device])}</h2>
    ${steps(device)}
    <div class="actions"><a class="button" href="${appUrl}">${esc(t.install.open)}</a></div>
    <p class="note">${esc(t.install.staying)}</p>
  </section>
  <div class="two">
    <section class="card qr">
      <h2>${esc(t.install.qrTitle)}</h2>
      ${qr(here)}
      <p class="note">${esc(t.install.qrText)}</p>
    </section>
    <section class="card">
      <h2>${esc(t.install.privacyTitle)}</h2>
      <p>${esc(t.install.privacy)}</p>
    </section>
  </div>
  <section class="card">
    <h2>${esc(t.install.otherDevices)}</h2>
    ${DEVICES.filter((d) => d !== device)
      .map((d) => `<details><summary>${esc(t.install.devices[d])}</summary>${steps(d)}</details>`)
      .join('')}
  </section>
  <footer>
    <p>${esc(t.appName)} · ${esc(t.install.credit)}</p>
    <p><a href="${SOURCE_URL}">${esc(t.install.source)}</a></p>
  </footer>
`
