import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n'
import { exampleItem, makeItem, seeded, teachCard } from './generate'
import { itemWords, SKILLS, skillLang } from './index'
import type { Item, SkillDef } from './types'

// The original's best test, kept: every question of every skill has exactly one right answer, and it is true,
// in every language the app ships. The answer is worked out here independently of the question maker.

const ROUNDS = 300
const label = (item: Item, i: number) => item.choices[i].label ?? item.choices[i].emoji ?? ''
const right = (item: Item) => label(item, item.answer)
const vowel = /^[aeiou]/

/** What is wrong with a question, or null. */
function problem(def: SkillDef, item: Item): string | null {
  const v = item.values
  const labels = item.choices.map((_, i) => label(item, i))
  if (new Set(labels).size !== labels.length) return `two choices are the same: ${labels.join(', ')}`
  if (item.answer < 0 || item.answer >= item.choices.length) return 'answer out of range'
  const onlyOne = (truth: (l: string) => boolean) => labels.filter(truth).length === 1 && truth(right(item))
  switch (def.kind) {
    case 'count':
      return item.visual?.kind === 'count' && onlyOne((l) => Number(l) === (item.visual as { n: number }).n) ? null : 'wrong count'
    case 'add':
      return onlyOne((l) => Number(l) === Number(v.a) + Number(v.b)) && Number(v.answer) <= Number(def.params.max) ? null : 'wrong sum'
    case 'subtract':
      return onlyOne((l) => Number(l) === Number(v.a) - Number(v.b)) && Number(v.answer) >= 1 ? null : 'wrong difference'
    case 'one-more':
      return onlyOne((l) => Number(l) === Number(v.n) + 1) ? null : 'wrong one more'
    case 'one-less':
      return onlyOne((l) => Number(l) === Number(v.n) - 1) ? null : 'wrong one less'
    case 'bigger':
      return onlyOne((l) => labels.every((o) => o === l || Number(l) > Number(o))) ? null : 'wrong bigger'
    case 'first-sound':
      return onlyOne((l) => l === String(v.word)[0]) ? null : `wrong first letter of ${v.word}`
    case 'a-an':
      return onlyOne((l) => l === (vowel.test(String(v.word)) ? 'an' : 'a')) ? null : `wrong article for ${v.word}`
    case 'rhyme': {
      const families = def.params.families as { end: string; words: [string, string][] }[]
      const family = families.find((f) => f.words.some(([w]) => w === v.word))!
      const rhymes = (w: string) => w !== v.word && family.words.some(([x]) => x === w)
      if (labels.includes(String(v.word))) return 'the word itself is a choice'
      return onlyOne(rhymes) && family.words.every(([w]) => w.endsWith(family.end.slice(1))) ? null : `wrong rhyme for ${v.word}`
    }
    case 'picture-pattern': {
      // The shown pictures repeat every `unit`; the next one is the one `unit` back.
      const items = (item.visual as { items: string[] }).items
      const unit = Number(v.unit)
      if (!items.every((x, i) => i < unit || x === items[i - unit])) return 'the pattern does not repeat'
      const next = items[items.length - unit]
      const emojis = item.choices.map((c) => c.emoji)
      return new Set(emojis).size === emojis.length && emojis.filter((e) => e === next).length === 1 && emojis[item.answer] === next ? null : 'wrong next picture'
    }
    case 'sequence':
    case 'growing': {
      // The next number from the shown ones: same step, doubling, or a step that grows by the same amount.
      const xs = String(v.items).split(', ').map(Number)
      const d = xs.slice(1).map((x, i) => x - xs[i])
      const g = d.slice(1).map((x, i) => x - d[i])
      const last = xs[xs.length - 1]
      const next = d.every((x) => x === d[0]) ? last + d[0] : xs.slice(1).every((x, i) => x === 2 * xs[i]) ? 2 * last : g.every((x) => x === g[0]) ? last + d[d.length - 1] + g[0] : NaN
      return onlyOne((l) => Number(l) === next) ? null : `wrong next number after ${v.items}`
    }
    case 'neighbour':
      return onlyOne((l) => Number(l) === Number(v.n) + (v.rule === 'after' ? 1 : -1)) ? null : 'wrong neighbour'
    case 'add-sub':
    case 'add-sub-big':
    case 'tens': {
      const want = v.op === '+' ? Number(v.a) + Number(v.b) : Number(v.a) - Number(v.b)
      if (def.kind === 'tens' && Number(v.b) % 10 !== 0) return 'not whole tens'
      return onlyOne((l) => Number(l) === want) && want >= 0 ? null : `wrong ${v.a} ${v.op} ${v.b}`
    }
    case 'tens-ones': {
      const b = item.visual as { kind: string; tens: number; ones: number }
      return b.kind === 'blocks' && onlyOne((l) => Number(l) === 10 * b.tens + b.ones) ? null : 'wrong tens and ones'
    }
    case 'times':
      return (def.params.tables as number[]).includes(Number(v.t)) && onlyOne((l) => Number(l) === Number(v.n) * Number(v.t)) ? null : 'wrong product'
    case 'time-units':
      return onlyOne((l) => Number(l) === 60 * Number(v.n)) ? null : 'wrong time'
    case 'place-value': {
      const digits = String(v.n).split('')
      const at = digits.indexOf(String(v.d))
      if (at < 0 || digits.lastIndexOf(String(v.d)) !== at) return 'digit not there exactly once'
      return onlyOne((l) => Number(l) === Number(v.d) * 10 ** (digits.length - 1 - at)) ? null : 'wrong place value'
    }
    case 'round': {
      const to = Number(def.params.to)
      return onlyOne((l) => Number(l) === Math.floor((Number(v.n) + to / 2) / to) * to) ? null : `wrong rounding of ${v.n}`
    }
    case 'divide':
      return Number(v.total) % Number(v.d) === 0 && onlyOne((l) => Number(l) * Number(v.d) === Number(v.total)) ? null : 'wrong quotient'
    case 'multiply':
      return onlyOne((l) => Number(l) === Number(v.a) * Number(v.b)) ? null : 'wrong product'
    case 'fraction':
      return Number(v.n) % Number(v.d) === 0 && onlyOne((l) => Number(l) === Number(v.n) / Number(v.d)) ? null : 'wrong fraction'
    case 'percent':
      return onlyOne((l) => Number(l) === (Number(v.n) * Number(v.p)) / 100) && Number.isInteger((Number(v.n) * Number(v.p)) / 100) ? null : 'wrong percentage'
    case 'order-ops': {
      // Worked out here from the expression itself (× and ÷ before + and −, brackets first).
      const value = Function(`return (${String(v.expr).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')})`)() as number
      return onlyOne((l) => Number(l) === value) ? null : `wrong value of ${v.expr}`
    }
    case 'square':
      return onlyOne((l) => Number(l) === Number(v.n) ** 2) ? null : 'wrong square'
    case 'match-word':
      return onlyOne((l) => l === v.word) ? null : `wrong word for ${v.word}`
    case 'missing-letter': {
      const common = new Set(String(def.params.common).split(' '))
      const fits = (l: string) => String(v.gap).replace('_', l) === v.word
      const makesWord = labels.some((l) => !fits(l) && common.has(String(v.gap).replace('_', l)))
      return onlyOne(fits) && !makesWord ? null : `wrong missing letter in ${v.gap}`
    }
    case 'spelling':
      return onlyOne((l) => l === v.word) ? null : `wrong spelling of ${v.word}`
    case 'plural':
    case 'past':
    case 'contraction': {
      const key = new Map(def.params.pairs as [string, string][])
      const asked = String(v.one ?? v.now ?? v.long)
      return onlyOne((l) => l === key.get(asked)) ? null : `wrong form of ${asked}`
    }
    case 'comparison': {
      const triple = (def.params.triples as string[][]).find((t) => t[0] === v.word)!
      return onlyOne((l) => l === triple[2]) ? null : `wrong comparison of ${v.word}`
    }
    case 'opposite':
    case 'synonym': {
      // The right word is the word's partner; no wrong word is a partner of the word.
      const partners = (def.params.pairs as string[][]).filter((p) => p.includes(String(v.word))).flatMap((p) => p.filter((w) => w !== v.word))
      return onlyOne((l) => partners.includes(l)) ? null : `wrong partner of ${v.word}`
    }
    case 'alphabet': {
      const firsts = labels.map((l) => l[0])
      return new Set(firsts).size === labels.length && onlyOne((l) => l === [...labels].sort()[0]) ? null : 'wrong first word'
    }
    case 'homophone': {
      const h = (def.params.sentences as { sentence: string; right: string }[]).find((x) => x.sentence === v.sentence)!
      return onlyOne((l) => l === h.right) ? null : `wrong word for: ${v.sentence}`
    }
    case 'word-class': {
      const classes = def.params.classes as Record<string, string[]>
      const inClass = (w: string) => Object.keys(classes).filter((k) => classes[k].includes(w))
      return labels.every((l) => inClass(l).length === 1) && onlyOne((l) => inClass(l)[0] === v.kind) ? null : `wrong ${v.kind}`
    }
    case 'prefix': {
      const key = new Map(def.params.pairs as [string, string][])
      return onlyOne((l) => l === key.get(String(v.word))) ? null : `wrong "not ${v.word}"`
    }
    default:
      return `no check for ${def.kind}`
  }
}

describe('every question has exactly one right answer, and it is true', () => {
  for (const def of SKILLS) {
    it(def.id, () => {
      const r = seeded(def.id.length * 97)
      const problems = new Set<string>()
      for (let i = 0; i < ROUNDS; i++) {
        const item = makeItem(def, r)
        const p = problem(def, item)
        if (p) problems.add(`${p} (${JSON.stringify(item.values)})`)
      }
      expect([...problems].slice(0, 5)).toEqual([])
    })
  }
})

describe('every teach card shows a true example', () => {
  for (const def of SKILLS) {
    const item = exampleItem(def)
    if (item) it(def.id, () => expect(problem(def, item)).toBeNull())
  }
})

describe('every skill is complete in every language it is taught in', () => {
  for (const def of SKILLS)
    for (const { id: lang } of LANGS) {
      it(`${def.id} · ${lang}`, () => {
        const taught = skillLang(def, lang)
        if (def.only !== 'en') expect(taught, 'translated').toBe(lang)
        const t = def.text[taught]!
        expect(t.title.length > 2 && t.teach.length > 10 && t.prompt.length > 2).toBe(true)
        const r = seeded(7)
        for (let i = 0; i < 50; i++) {
          const words = itemWords(def, makeItem(def, r), lang)
          for (const [k, s] of Object.entries(words)) if (k !== 'teach') expect(s, `${k}: ${s}`).not.toMatch(/\{\w+\}/)
          expect(words.reason.length, 'a reason').toBeGreaterThan(5)
        }
        expect(itemWords(def, teachCard(def), lang).teach).not.toMatch(/\{\w+\}/)
      })
    }
})

describe('pictures', () => {
  it('every picture a skill uses exists', () => {
    const names = new Set<string>()
    for (const def of SKILLS) {
      names.add(def.emoji)
      const card = teachCard(def)
      const add = (v: Item['visual']) => {
        if (!v) return
        if (v.kind === 'count' || v.kind === 'picture') names.add(v.emoji)
        if (v.kind === 'pair') [v.a.emoji, v.b.emoji].forEach((e) => names.add(e))
      }
      add(card.visual)
      const r = seeded(1)
      for (let i = 0; i < 200; i++) {
        const item = makeItem(def, r)
        add(item.visual)
        item.choices.forEach((c) => c.emoji && names.add(c.emoji))
      }
    }
    const files = new Set(Object.keys(import.meta.glob('/public/emoji/*.png')).map((f) => f.replace('/public/emoji/', '').replace('.png', '')))
    expect([...names].filter((n) => !files.has(n))).toEqual([])
  })
})

describe('the skill list', () => {
  it('has skills with different ids, each with a subject, a stage and a teach card', () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length)
    for (const def of SKILLS) expect(['numbers', 'words', 'patterns'].includes(def.subject) && def.stage >= 0 && def.stage <= 7 && def.order > 0, def.id).toBe(true)
    for (const subject of ['numbers', 'words', 'patterns']) {
      const orders = SKILLS.filter((s) => s.subject === subject).map((s) => s.order)
      expect(new Set(orders).size, `${subject}: each order once`).toBe(orders.length)
    }
    for (const def of SKILLS) expect(teachCard(def).visual, def.id).toBeDefined()
  })
})
