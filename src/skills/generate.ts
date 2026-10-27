import type { Choice, GeneratorKind, Item, Random, SkillDef } from './types'

// The question makers: one per kind of skill. Each makes a fresh question from the skill's params, with exactly
// one right answer among its choices (content.test.ts checks every skill in every language). Pure with a seeded
// random (tested).

export const int = (r: Random, min: number, max: number) => min + Math.floor(r() * (max - min + 1))
export const pick = <T,>(r: Random, list: readonly T[]): T => list[Math.floor(r() * list.length)]

/** A shuffled copy (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], r: Random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The right choice among the wrong ones, at a random place. */
export function withAnswer(r: Random, right: Choice, wrong: Choice[]): { choices: Choice[]; answer: number } {
  const answer = int(r, 0, wrong.length)
  const choices = [...wrong]
  choices.splice(answer, 0, right)
  return { choices, answer }
}

/** Two wrong numbers near the right one: never negative, never above `max`, all different. */
export function nearNumbers(r: Random, right: number, max: number): number[] {
  const out: number[] = []
  for (let guard = 0; out.length < 2 && guard < 50; guard++) {
    const n = right + pick(r, [-2, -1, 1, 2])
    if (n >= 0 && n <= max && n !== right && !out.includes(n)) out.push(n)
  }
  for (let n = 0; out.length < 2; n++) if (n !== right && !out.includes(n)) out.push(n)
  return out
}

const numberChoices = (r: Random, right: number, max: number) =>
  withAnswer(
    r,
    { label: String(right) },
    nearNumbers(r, right, max).map((n) => ({ label: String(n) })),
  )

type Maker = (def: SkillDef, r: Random) => Item
type Word = [word: string, emoji: string]

const num = (def: SkillDef, key: string) => Number(def.params[key])
const words = (def: SkillDef) => def.params.words as Word[]
const seq = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(', ')

const MAKERS: Record<GeneratorKind, Maker> = {
  // How many pictures? (params: min, max, emojis)
  count: (def, r) => {
    const n = int(r, num(def, 'min'), num(def, 'max'))
    const thing = pick(r, def.params.emojis as string[])
    return { values: { answer: n, seq: seq(n), thing }, visual: { kind: 'count', emoji: thing, n }, ...numberChoices(r, n, num(def, 'max')) }
  },
  // a + b, the answer at most max (params: max)
  add: (def, r) => {
    const max = num(def, 'max')
    const a = int(r, 1, max - 1)
    const b = int(r, 1, max - a)
    return { values: { a, b, answer: a + b }, visual: { kind: 'sum', text: `${a} + ${b}` }, line: { max: 10, from: a, by: b }, ...numberChoices(r, a + b, max) }
  },
  // a − b, a at most max, the answer at least 1 (params: max)
  subtract: (def, r) => {
    const a = int(r, 2, num(def, 'max'))
    const b = int(r, 1, a - 1)
    return { values: { a, b, answer: a - b }, visual: { kind: 'sum', text: `${a} − ${b}` }, line: { max: 10, from: a, by: -b }, ...numberChoices(r, a - b, num(def, 'max')) }
  },
  // One more than n (params: max, the biggest answer)
  'one-more': (def, r) => {
    const n = int(r, 1, num(def, 'max') - 1)
    return { values: { n, answer: n + 1 }, visual: { kind: 'sum', text: `${n} + 1` }, line: { max: 10, from: n, by: 1 }, ...numberChoices(r, n + 1, num(def, 'max')) }
  },
  // One less than n (params: max, the biggest n)
  'one-less': (def, r) => {
    const n = int(r, 2, num(def, 'max'))
    return { values: { n, answer: n - 1 }, visual: { kind: 'sum', text: `${n} − 1` }, line: { max: 10, from: n, by: -1 }, ...numberChoices(r, n - 1, num(def, 'max')) }
  },
  // Which of two numbers is bigger? The two numbers are the choices (params: max)
  bigger: (def, r) => {
    const a = int(r, 1, num(def, 'max'))
    let b = a
    while (b === a) b = int(r, 1, num(def, 'max'))
    const big = Math.max(a, b)
    const small = Math.min(a, b)
    return { values: { answer: big, small }, line: { max: Math.max(10, big), from: small, by: big - small }, ...withAnswer(r, { label: String(big) }, [{ label: String(small) }]) }
  },
  // The first letter of a word, shown as a picture only (params: words, [word, emoji])
  'first-sound': (def, r) => {
    const [word, emoji] = pick(r, words(def))
    const letter = word[0]
    const others = shuffled([...new Set(words(def).map(([w]) => w[0]))].filter((l) => l !== letter), r).slice(0, 2)
    return { values: { word, answer: letter }, visual: { kind: 'picture', emoji }, ...withAnswer(r, { label: letter }, others.map((l) => ({ label: l }))) }
  },
  // "a" or "an" before a word (params: words, [word, emoji, article])
  'a-an': (def, r) => {
    const [word, emoji, article] = pick(r, def.params.words as [string, string, string][])
    const other = article === 'an' ? 'a' : 'an'
    return { values: { word, answer: article, rule: article }, visual: { kind: 'picture', emoji, word }, ...withAnswer(r, { label: article }, [{ label: other }]) }
  },
  // Which picture rhymes with this one? (params: families, { end, words: [word, emoji][] })
  rhyme: (def, r) => {
    const families = def.params.families as { end: string; words: Word[] }[]
    const family = pick(r, families)
    const [target, match] = shuffled(family.words, r)
    const wrong = shuffled(families.filter((f) => f !== family), r)
      .slice(0, 2)
      .map((f) => pick(r, f.words))
    const choice = ([word, emoji]: Word) => ({ label: word, emoji })
    return { values: { word: target[0], answer: match[0], end: family.end }, visual: { kind: 'picture', emoji: target[1], word: target[0] }, ...withAnswer(r, choice(match), wrong.map(choice)) }
  },
}

type Teach = (def: SkillDef) => Pick<Item, 'visual' | 'line'>
const ex = (def: SkillDef, key: string) => def.example[key]
const exNum = (def: SkillDef, key: string) => Number(def.example[key])

/** What the teach card shows, from the skill's fixed example. */
const TEACH: Record<GeneratorKind, Teach> = {
  count: (def) => ({ visual: { kind: 'count', emoji: String(ex(def, 'thing')), n: exNum(def, 'answer') } }),
  add: (def) => ({ visual: { kind: 'sum', text: `${exNum(def, 'a')} + ${exNum(def, 'b')} = ${exNum(def, 'answer')}` }, line: { max: 10, from: exNum(def, 'a'), by: exNum(def, 'b') } }),
  subtract: (def) => ({ visual: { kind: 'sum', text: `${exNum(def, 'a')} − ${exNum(def, 'b')} = ${exNum(def, 'answer')}` }, line: { max: 10, from: exNum(def, 'a'), by: -exNum(def, 'b') } }),
  'one-more': (def) => ({ visual: { kind: 'sum', text: `${exNum(def, 'n')} + 1 = ${exNum(def, 'answer')}` }, line: { max: 10, from: exNum(def, 'n'), by: 1 } }),
  'one-less': (def) => ({ visual: { kind: 'sum', text: `${exNum(def, 'n')} − 1 = ${exNum(def, 'answer')}` }, line: { max: 10, from: exNum(def, 'n'), by: -1 } }),
  bigger: (def) => ({ visual: { kind: 'sum', text: `${exNum(def, 'small')}   ${exNum(def, 'answer')}` }, line: { max: 10, from: exNum(def, 'small'), by: exNum(def, 'answer') - exNum(def, 'small') } }),
  'first-sound': (def) => ({ visual: { kind: 'picture', emoji: String(ex(def, 'thing')), word: String(ex(def, 'word')) } }),
  'a-an': (def) => ({ visual: { kind: 'pair', a: { emoji: String(ex(def, 'emoji')), word: `an ${ex(def, 'word')}` }, b: { emoji: String(ex(def, 'otherEmoji')), word: `a ${ex(def, 'other')}` } } }),
  rhyme: (def) => ({ visual: { kind: 'pair', a: { emoji: String(ex(def, 'emoji')), word: String(ex(def, 'word')) }, b: { emoji: String(ex(def, 'answerEmoji')), word: String(ex(def, 'answer')) } } }),
}

/** The teach card's picture and number line, and its values for the sentence. */
export const teachCard = (def: SkillDef): Pick<Item, 'visual' | 'line' | 'values'> => ({ ...TEACH[def.kind](def), values: def.example })

/** A fresh question for a skill. */
export const makeItem = (def: SkillDef, r: Random = Math.random): Item => MAKERS[def.kind](def, r)

/** The same question is the same values (the order of the buttons does not matter). */
export const itemKey = (item: Item) => JSON.stringify(item.values)

/** `count` different questions, none equal to `avoid` (the teach example). */
export function makeItems(def: SkillDef, count: number, r: Random = Math.random, avoid: Record<string, number | string>[] = []): Item[] {
  const seen = new Set(avoid.map((v) => JSON.stringify(v)))
  const out: Item[] = []
  for (let tries = 0; out.length < count && tries < 300; tries++) {
    const item = makeItem(def, r)
    if (seen.has(itemKey(item))) continue
    seen.add(itemKey(item))
    out.push(item)
  }
  // A small skill can run out of different questions: then a question may come again, never twice in a row.
  while (out.length < count) {
    const item = makeItem(def, r)
    if (out.length === 0 || itemKey(out[out.length - 1]) !== itemKey(item)) out.push(item)
  }
  return out
}

/** Seeded random numbers (mulberry32), for tests. */
export function seeded(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
