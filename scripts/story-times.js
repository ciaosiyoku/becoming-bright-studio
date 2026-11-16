// Times each story paragraph against its LibriVox recording, for the story film (src/media/storyText.ts).
//
// Run it in the browser console on the app's own page (https://ciaosiyoku.github.io/becoming-bright-studio/), so the
// story texts can be fetched; it streams every recording from archive.org (about 51 hours, nothing is kept), finds the
// reader's pauses, and fits the paragraphs onto them. Progress is kept in localStorage ("bbs-timing"), so it can be
// stopped and run again. At the end, run `storyTimesDownload()` and put the file's books into
// public/stories/times/<book>.json (scripts/split-story-times.py does that).
//
// How a recording is fitted: the sound is measured every 50 ms; the quietest 15 % sets the level for "quiet", and a
// quiet stretch of 0.3 s or more is a pause. A recording is a spoken introduction, the paragraphs, then a short
// closing line. For each possible end of the introduction (one of the longer pauses in the first 75 s) and start of
// the closing line (one in the last 50 s), every paragraph boundary is placed on a pause, in order, as close as
// possible to where the paragraph's words put it (measured in speaking time, so long pauses don't push the rest
// late), preferring longer pauses; the introduction should be about 18 s of speech and the closing line about 5 s.
// The best fit gives where the story starts (the end of the introduction) and how long the closing line is. Fitting
// each paragraph onto its own pause was tried too, but a sentence pause is easily taken for a paragraph pause, so
// only the start and end are kept: in between, the time is shared out by the paragraphs' words, as before.

const analyse = async (url) => {
  const buf = await fetch(url).then((r) => {
    if (!r.ok) throw new Error('http ' + r.status)
    return r.arrayBuffer()
  })
  const ctx = new OfflineAudioContext(1, 8000, 8000)
  const ab = await ctx.decodeAudioData(buf)
  const d = ab.getChannelData(0), sr = ab.sampleRate, win = Math.round(sr * 0.05), F = 0.05
  const rms = new Float32Array(Math.floor(d.length / win))
  for (let i = 0; i < rms.length; i++) {
    let s = 0
    for (let k = i * win; k < (i + 1) * win; k++) s += d[k] * d[k]
    rms[i] = Math.sqrt(s / win)
  }
  const sorted = Array.from(rms).sort((a, b) => a - b)
  const thr = Math.max(sorted[Math.floor(sorted.length * 0.15)] * 2.5, 1e-4)
  const S = new Float32Array(rms.length + 1)
  for (let i = 0; i < rms.length; i++) S[i + 1] = S[i] + (rms[i] >= thr ? F : 0)
  const pauses = []
  let run = 0
  for (let i = 0; i <= rms.length; i++) {
    if (i < rms.length && rms[i] < thr) run++
    else {
      if (run >= 6) { const a = i - run; pauses.push({ s: a * F, e: i * F, len: run * F, Ss: S[a], Se: S[i] }) }
      run = 0
    }
  }
  return { dur: ab.duration, pauses, total: S[rms.length] }
}

const align = (words, A) => {
  const P = words.length, tot = words.reduce((a, b) => a + b + 2, 0)
  const f = [0]
  for (const w of words) f.push(f[f.length - 1] + (w + 2) / tot)
  const ps = A.pauses, dur = A.dur
  const top = (arr, n) => arr.sort((x, y) => y.len - x.len).slice(0, n)
  const starts0 = [{ s: 0, e: 0, len: 0, Ss: 0, Se: 0 }, ...top(ps.filter((p) => p.e > 3 && p.e < Math.min(75, dur * 0.35)), 25)]
  const ends0 = [...top(ps.filter((p) => p.s > dur - 50 && p.s < dur - 0.5), 15), { s: dur, e: dur, len: 0, Ss: A.total, Se: A.total }]
  let best = null
  for (const a of starts0)
    for (const z of ends0) {
      const span = z.Ss - a.Se
      if (span < 20 || z.s <= a.e) continue
      const pre = a.Se, post = A.total - z.Ss
      const cost0 = ((pre - 18) / 7) ** 2 + ((post - 5) / 4) ** 2 - 2 * Math.min(a.len, 2) - 2 * Math.min(z.len, 2)
      const inner = []
      for (const p of ps) if (p.s > a.e && p.e < z.s) inner.push({ e: p.e, len: p.len, r: (p.Ss - a.Se) / span })
      let prev = [{ k: -1, c: 0, back: null }], ok = true
      for (let j = 1; j < P && ok; j++) {
        const next = []
        let pi = 0, bestPrev = null
        for (let k = 0; k < inner.length; k++) {
          const dr = inner[k].r - f[j]
          if (dr < -0.12) continue
          if (dr > 0.12) break
          while (pi < prev.length && prev[pi].k < k) { if (!bestPrev || prev[pi].c < bestPrev.c) bestPrev = prev[pi]; pi++ }
          if (!bestPrev) continue
          next.push({ k, c: bestPrev.c + (dr * 60) ** 2 - 1.5 * Math.min(inner[k].len, 2), back: bestPrev })
        }
        if (!next.length) ok = false
        else prev = next
      }
      if (!ok) continue
      const end = prev.reduce((m, x) => (x.c < m.c ? x : m))
      const total = cost0 + end.c
      if (!best || total < best.cost) {
        const ks = []
        for (let n = end; n && n.k >= 0; n = n.back) ks.unshift(n.k)
        best = { cost: total, starts: [a.e, ...ks.map((k) => inner[k].e)], post }
      }
    }
  return best
}

window.storyTimes = async () => {
  const src = await fetch('https://raw.githubusercontent.com/ciaosiyoku/becoming-bright-studio/main/src/media/storyList.ts').then((r) => r.text())
  const list = []
  for (const b of src.split(/\n  \{\n    id: '/).slice(1)) {
    const book = b.split("'")[0]
    for (const m of b.matchAll(/\{ id: '([^']+)', title: .*?url: `\$\{IA\}([^`]+)`/g)) list.push([book, m[1], 'https://archive.org/download/' + m[2]])
  }
  const done = JSON.parse(localStorage.getItem('bbs-timing') || '{}'), texts = {}
  for (const [book, id, url] of list) {
    if (done[id]) continue
    try {
      texts[book] ??= await fetch(`stories/${book}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
      const paras = texts[book][id]
      if (!paras) continue
      const words = paras.map((p) => p.split(/\s+/).filter(Boolean).length)
      const A = await analyse(url)
      const fit = align(words, A)
      if (!fit) { console.warn(id, 'no fit'); continue }
      const start = fit.starts[0], end = A.dur - Math.max(4, Math.min(15, fit.post * 1.3))
      const total = words.reduce((a, w) => a + w + 2, 0)
      let acc = 0
      done[id] = { book, s: words.map((w) => { const at = start + (acc / total) * (end - start); acc += w + 2; return Math.round(at * 10) / 10 }) }
      localStorage.setItem('bbs-timing', JSON.stringify(done))
      console.log(id, Object.keys(done).length)
    } catch (e) {
      console.warn(id, e)
    }
  }
}

window.storyTimesDownload = () => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([localStorage.getItem('bbs-timing') || '{}'], { type: 'application/json' }))
  a.download = 'stories-timing.json'
  a.click()
}
