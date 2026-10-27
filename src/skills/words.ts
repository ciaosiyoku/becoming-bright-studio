import type { Calc } from './numbers'
import { int, pick, shuffled, withAnswer } from './random'
import type { Random } from './types'

// The English sound and word skills brought back from the original (reading and spelling words, the missing letter,
// plurals, the past tense, alphabetical order, opposites, short forms, comparing, words that mean or sound the
// same, word classes, prefixes). Taught in English in every app language. Word lists live in each skill's JSON
// ("params"), chosen so every question has exactly one right answer (content.test.ts checks them).
// Each kind is a picker and a builder, like the number kinds (numbers.ts); "rule" picks a skill's prompt or reason.

export type WordKind = 'match-word' | 'missing-letter' | 'spelling' | 'plural' | 'past' | 'alphabet' | 'opposite' | 'contraction' | 'comparison' | 'synonym' | 'homophone' | 'word-class' | 'prefix'

type Word = [word: string, emoji: string]
type Values = Record<string, number | string>
const words = (params: Record<string, unknown>) => params.words as Word[]
const pairs = (params: Record<string, unknown>) => params.pairs as [string, string][]
const labels = (xs: string[]) => xs.map((label) => ({ label }))

/** Up to `count` different items of a list, none equal to `except` (by `same`). */
function others<T>(r: Random, list: readonly T[], except: T, count = 2, same = (a: T, b: T) => a === b): T[] {
  return shuffled(list, r)
    .filter((x) => !same(x, except))
    .filter((x, i, all) => all.findIndex((y) => same(x, y)) === i)
    .slice(0, count)
}

/** Wrong spellings a child might write: a dropped letter, a doubled letter, two letters swapped, a vowel changed. */
export function misspellings(word: string, r: Random, count = 2): string[] {
  const vowels = 'aeiou'
  const makers: ((w: string) => string)[] = [
    (w) => {
      const i = 1 + Math.floor(r() * (w.length - 1))
      return w.slice(0, i) + w.slice(i + 1)
    },
    (w) => {
      const i = Math.floor(r() * w.length)
      return w.slice(0, i + 1) + w[i] + w.slice(i + 1)
    },
    (w) => {
      const i = 1 + Math.floor(r() * (w.length - 2))
      return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2)
    },
    (w) => {
      const at = [...w].map((c, i) => (vowels.includes(c) ? i : -1)).filter((i) => i >= 0)
      if (at.length === 0) return w
      const i = pick(r, at)
      return w.slice(0, i) + pick(r, [...vowels].filter((x) => x !== w[i])) + w.slice(i + 1)
    },
  ]
  const out: string[] = []
  for (let guard = 0; out.length < count && guard < 50; guard++) {
    const m = pick(r, makers)(word)
    if (m !== word && m.length > 1 && !out.includes(m)) out.push(m)
  }
  return out
}

/** Which plural rule a pair follows (for the reason). */
function pluralRule(one: string, many: string): string {
  if (many === one) return 'same'
  if (many === `${one}s`) return 's'
  if (many === `${one}es`) return /o$/.test(one) ? 'o-es' : 'es'
  if (one.endsWith('y') && many === `${one.slice(0, -1)}ies`) return 'ies'
  if (/(f|fe)$/.test(one) && many.endsWith('ves')) return 'ves'
  return 'special'
}

/** Which past-tense rule a pair follows (for the reason). */
function pastRule(now: string, then: string): string {
  if (then === `${now}ed`) return 'ed'
  if (then === `${now}d`) return 'd'
  if (then === `${now}${now.at(-1)}ed`) return 'double'
  if (now.endsWith('y') && then === `${now.slice(0, -1)}ied`) return 'ied'
  return 'special'
}

/** Wrong forms built by the regular rule, so the choice teaches the exception. */
function wrongForms(base: string, right: string, endings: string[]): string[] {
  return [...new Set(endings.map((e) => base + e).filter((f) => f !== right))].slice(0, 2)
}

export const WORD_CALC: Record<WordKind, Calc> = {
  // Which word goes with the picture? (params: words; the wrong words start with other letters)
  'match-word': {
    pick: (def, r) => {
      const [word, emoji] = pick(r, words(def.params))
      return { word, emoji, answer: word }
    },
    build: (def, v, r) => {
      const pool = words(def.params).map(([w]) => w)
      const wrong = others(r, pool, String(v.word), 2, (a, b) => a[0] === b[0])
      return { visual: { kind: 'picture', emoji: String(v.emoji) }, ...withAnswer(r, { label: String(v.word) }, labels(wrong)) }
    },
  },
  // Which letter is missing? (params: words up to 5 letters; common: words a wrong letter must not make)
  'missing-letter': {
    pick: (def, r) => {
      const [word, emoji] = pick(r, words(def.params))
      const i = int(r, 1, word.length - 1)
      return { word, emoji, gap: word.slice(0, i) + '_' + word.slice(i + 1), at: i, answer: word[i] }
    },
    build: (def, v, r) => {
      const word = String(v.word)
      const i = Number(v.at)
      const common = new Set((def.params.common as string).split(' '))
      // A missing vowel gets consonants as wrong answers and the other way round, and no wrong letter makes a real word.
      const pool = ('aeiou'.includes(word[i]) ? 'bdfgklmnprst' : 'aeiou').split('').filter((l) => !common.has(word.slice(0, i) + l + word.slice(i + 1)))
      return { visual: { kind: 'picture', emoji: String(v.emoji) }, ...withAnswer(r, { label: word[i] }, labels(others(r, pool, word[i]))) }
    },
  },
  // How do you spell the word for the picture? (params: words)
  spelling: {
    pick: (def, r) => {
      const [word, emoji] = pick(r, words(def.params))
      return { word, emoji, answer: word, letters: word.split('').join('-') }
    },
    build: (_def, v, r) => ({ visual: { kind: 'picture', emoji: String(v.emoji) }, ...withAnswer(r, { label: String(v.word) }, labels(misspellings(String(v.word), r))) }),
  },
  // One …, two …? (params: pairs of one and many)
  plural: {
    pick: (def, r) => {
      const [one, many] = pick(r, pairs(def.params))
      return { one, answer: many, rule: pluralRule(one, many) }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `1 ${v.one} → 2 ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(wrongForms(String(v.one), String(v.answer), ['s', 'es', '']))) }),
  },
  // Yesterday I …? (params: pairs of now and then)
  past: {
    pick: (def, r) => {
      const [now, then] = pick(r, pairs(def.params))
      return { now, answer: then, rule: pastRule(now, then) }
    },
    build: (_def, v, r) => {
      const now = String(v.now)
      return { visual: { kind: 'sum', text: `${now} → ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(wrongForms(now, String(v.answer), now.endsWith('e') ? ['s', ''] : ['ed', 's']))) }
    },
  },
  // Which word comes first in the alphabet? Three words with different first letters (params: words)
  alphabet: {
    pick: (def, r) => {
      const chosen: string[] = []
      for (const [w] of shuffled(words(def.params), r)) {
        if (!chosen.some((c) => c[0] === w[0])) chosen.push(w)
        if (chosen.length === 3) break
      }
      const answer = [...chosen].sort()[0]
      return { words: chosen.join(' '), answer, letter: answer[0] }
    },
    build: (_def, v) => {
      const chosen = String(v.words).split(' ')
      return { visual: { kind: 'sum', text: 'a b c d e …' }, choices: labels(chosen), answer: chosen.indexOf(String(v.answer)) }
    },
  },
  // What is the opposite of …? (params: pairs)
  opposite: {
    pick: (def, r) => {
      const pair = pick(r, pairs(def.params))
      const [word, answer] = r() < 0.5 ? pair : [pair[1], pair[0]]
      return { word, answer }
    },
    build: (def, v, r) => {
      const wrong = others(r, pairs(def.params).flat(), String(v.answer), 3)
        .filter((w) => w !== v.word)
        .slice(0, 2)
      return { visual: { kind: 'sum', text: `${v.word} ↔ ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(wrong)) }
    },
  },
  // The short form of … (params: pairs of long and short): the apostrophe too early, or missing
  contraction: {
    pick: (def, r) => {
      const [long, short] = pick(r, pairs(def.params))
      return { long, answer: short }
    },
    build: (_def, v, r) => {
      const short = String(v.answer)
      const i = short.indexOf("'")
      const early = short.slice(0, i - 1) + "'" + short[i - 1] + short.slice(i + 1)
      return { visual: { kind: 'sum', text: `${v.long} → ?` }, ...withAnswer(r, { label: short }, labels([early, short.replace("'", '')])) }
    },
  },
  // tall, taller, …? (params: triples)
  comparison: {
    pick: (def, r) => {
      const [word, more, most] = pick(r, def.params.triples as [string, string, string][])
      return { word, more, answer: most, rule: most.endsWith('est') && most.startsWith(word.slice(0, 2)) ? 'est' : 'special' }
    },
    build: (_def, v, r) => {
      const word = String(v.word)
      const wrong = [word + 'est' !== v.answer ? word + 'est' : `most ${word}`, `${v.more}est`]
      return { visual: { kind: 'sum', text: `${word}, ${v.more}, ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(wrong)) }
    },
  },
  // Which word means almost the same as …? (params: pairs)
  synonym: {
    pick: (def, r) => {
      const pair = pick(r, pairs(def.params))
      const [word, answer] = r() < 0.5 ? pair : [pair[1], pair[0]]
      return { word, answer }
    },
    build: (def, v, r) => {
      const rest = pairs(def.params)
        .filter((p) => !p.includes(String(v.word)))
        .flat()
      return { visual: { kind: 'sum', text: `${v.word} ≈ ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(others(r, rest, String(v.answer)))) }
    },
  },
  // Which word fits? Words that sound the same (params: sentences, each with its right word and set)
  homophone: {
    pick: (def, r) => {
      const h = pick(r, def.params.sentences as { sentence: string; right: string; set: string[] }[])
      return { sentence: h.sentence, answer: h.right, set: h.set.join('|'), full: h.sentence.replace('___', h.right) }
    },
    build: (_def, v, r) => ({
      visual: { kind: 'sum', text: String(v.sentence).replace('___', '?') },
      ...withAnswer(
        r,
        { label: String(v.answer) },
        labels(
          String(v.set)
            .split('|')
            .filter((w) => w !== v.answer),
        ),
      ),
    }),
  },
  // Which word is a noun, a verb or an adjective? (params: classes, words that belong to one class only)
  'word-class': {
    pick: (def, r) => {
      const classes = def.params.classes as Record<string, string[]>
      const kind = pick(r, Object.keys(classes))
      return { answer: pick(r, classes[kind]), rule: kind, kind }
    },
    build: (def, v, r) => {
      const classes = def.params.classes as Record<string, string[]>
      const wrong = Object.keys(classes)
        .filter((k) => k !== v.kind)
        .map((k) => pick(r, classes[k]))
      return { visual: { kind: 'sum', text: `${v.kind}: ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(wrong)) }
    },
  },
  // Which word means "not …"? (params: pairs of word and "not" word; prefixes)
  prefix: {
    pick: (def, r): Values => {
      const [word, answer] = pick(r, pairs(def.params))
      return { word, answer, prefix: answer.slice(0, answer.length - word.length) }
    },
    build: (def, v, r) => {
      const used = String(v.prefix)
      const nots = ['im', 'in', 'il', 'ir']
      const pool = (def.params.prefixes as string[]).filter((p) => p !== used && !(nots.includes(p) && nots.includes(used)))
      return { visual: { kind: 'sum', text: `not ${v.word} → ?` }, ...withAnswer(r, { label: String(v.answer) }, labels(others(r, pool, used).map((p) => p + v.word))) }
    },
  },
}
