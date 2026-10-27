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

const MAKERS: Partial<Record<GeneratorKind, Maker>> = {
  add: (def, r) => {
    const max = Number(def.params.max)
    const a = int(r, 1, max - 1)
    const b = int(r, 1, max - a)
    const sum = a + b
    return { values: { a, b, answer: sum }, visual: { kind: 'sum', text: `${a} + ${b}` }, line: { max: 10, from: a, by: b }, ...numberChoices(r, sum, max) }
  },
}

type Teach = (def: SkillDef) => Pick<Item, 'visual' | 'line'>

/** What the teach card shows, from the skill's fixed example. */
const TEACH: Partial<Record<GeneratorKind, Teach>> = {
  add: (def) => {
    const { a, b } = def.example as { a: number; b: number }
    return { visual: { kind: 'sum', text: `${a} + ${b} = ${a + b}` }, line: { max: 10, from: a, by: b } }
  },
}

/** The teach card's picture and number line, and its values for the sentence. */
export function teachCard(def: SkillDef): Pick<Item, 'visual' | 'line' | 'values'> {
  const teach = TEACH[def.kind]
  if (!teach) throw new Error(`no teach card for ${def.kind}`)
  return { ...teach(def), values: def.example }
}

/** A fresh question for a skill. */
export function makeItem(def: SkillDef, r: Random = Math.random): Item {
  const make = MAKERS[def.kind]
  if (!make) throw new Error(`no question maker for ${def.kind}`)
  return make(def, r)
}

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
