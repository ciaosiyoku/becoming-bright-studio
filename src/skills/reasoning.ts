import type { Calc } from './numbers'
import { int, numberChoices, pick, shuffled, withAnswer } from './random'
import type { Choice } from './types'

// The reasoning subjects (owner's request, Nov 2026), in English like the English skills:
//   Quantitative reasoning: missing numbers, number machines, number stories.
//   Verbal reasoning:       word analogies, the odd word out, letter codes.
//   Qualitative reasoning:  reasoning about qualities: the odd picture out, which is biggest, fastest or oldest,
//                           and which word describes three things.
// Each kind makes fresh questions from its skill's params (pick), the same values always giving the same question
// (build), as in numbers.ts. Every answer is checked independently in content.test.ts.

type Values = Record<string, number | string>
const n = (v: Values, key: string) => Number(v[key])

export type ReasonKind = 'qr-balance' | 'qr-machine' | 'qr-story' | 'vr-analogy' | 'odd-one-out' | 'vr-code' | 'ql-compare' | 'ql-common'

/** A number machine step: "+3", "-2", "x4" or "/2". */
export function applyStep(x: number, step: string): number {
  const k = Number(step.slice(1))
  switch (step[0]) {
    case '+':
      return x + k
    case '-':
      return x - k
    case 'x':
      return x * k
    default:
      return x / k
  }
}
/** How a step is shown: "+3", "−2", "×4", "÷2". */
export const showStep = (step: string) => step.replace('-', '−').replace('x', '×').replace('/', '÷')

/** A word with each letter moved `shift` places along the alphabet (Z wraps to A). Pure (tested). */
export function shiftWord(word: string, shift: number): string {
  return [...word.toUpperCase()].map((c) => String.fromCharCode(((((c.charCodeAt(0) - 65 + shift) % 26) + 26) % 26) + 65)).join('')
}

type Item2 = [word: string, emoji?: string]
const choiceOf = ([word, emoji]: Item2): Choice => (emoji ? { label: word, emoji } : { label: word })

export const REASON_CALC: Record<ReasonKind, Calc> = {
  // A missing number: "? + 3 = 7", "8 − ? = 5", "? × 4 = 20" (params: max; ops: add, sub, mul; mulMax)
  'qr-balance': {
    pick: (def, r) => {
      const max = Number(def.params.max)
      const op = pick(r, def.params.ops as string[])
      const first = r() < 0.5
      if (op === 'add') {
        const a = int(r, 0, max)
        const b = int(r, 0, max - a)
        return first ? { op, a, b, c: a + b, blank: 'first', answer: a, shown: `? + ${b} = ${a + b}`, full: `${a} + ${b} = ${a + b}` } : { op, a, b, c: a + b, blank: 'second', answer: b, shown: `${a} + ? = ${a + b}`, full: `${a} + ${b} = ${a + b}` }
      }
      if (op === 'sub') {
        const a = int(r, 1, max)
        const b = int(r, 0, a)
        return first ? { op, a, b, c: a - b, blank: 'first', answer: a, shown: `? − ${b} = ${a - b}`, full: `${a} − ${b} = ${a - b}` } : { op, a, b, c: a - b, blank: 'second', answer: b, shown: `${a} − ? = ${a - b}`, full: `${a} − ${b} = ${a - b}` }
      }
      const top = Number(def.params.mulMax ?? 10)
      const a = int(r, 2, top)
      const b = int(r, 2, top)
      return first ? { op, a, b, c: a * b, blank: 'first', answer: a, shown: `? × ${b} = ${a * b}`, full: `${a} × ${b} = ${a * b}` } : { op, a, b, c: a * b, blank: 'second', answer: b, shown: `${a} × ? = ${a * b}`, full: `${a} × ${b} = ${a * b}` }
    },
    build: (def, v, r) => ({ visual: { kind: 'sum', text: String(v.shown) }, ...numberChoices(r, n(v, 'answer'), Math.max(Number(def.params.max), 100)) }),
  },
  // A number machine: a number goes in, one or two steps change it: what comes out? (params: steps, steps2, ins)
  'qr-machine': {
    pick: (def, r) => {
      const [lo, hi] = def.params.ins as [number, number]
      const step1 = pick(r, def.params.steps as string[])
      const second = def.params.steps2 as string[] | undefined
      const step2 = second ? pick(r, second) : ''
      let x = int(r, lo, hi)
      // Never below zero, and division only when it comes out whole.
      if (step1[0] === '/') x = Math.max(1, Math.round(x / Number(step1.slice(1)))) * Number(step1.slice(1))
      if (step1[0] === '-') x = Math.max(x, Number(step1.slice(1)))
      const mid = applyStep(x, step1)
      const out = step2 ? applyStep(mid, step2) : mid
      if (out < 0) return { in: x, step1, step2: '', machine: showStep(step1), answer: mid, working: `${x} ${showStep(step1)} = ${mid}` }
      return {
        in: x,
        step1,
        step2,
        machine: step2 ? `${showStep(step1)} then ${showStep(step2)}` : showStep(step1),
        answer: out,
        working: step2 ? `${x} ${showStep(step1)} = ${mid}, then ${mid} ${showStep(step2)} = ${out}` : `${x} ${showStep(step1)} = ${out}`,
      }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.in} → [ ${v.machine} ] → ?` }, ...numberChoices(r, n(v, 'answer'), 1000) }),
  },
  // A number story (params: rules: add, take, times, share, unit; max; names; things [word, picture])
  'qr-story': {
    pick: (def, r) => {
      const rule = pick(r, def.params.rules as string[])
      const max = Number(def.params.max)
      const name = pick(r, def.params.names as string[])
      const [thing, emoji] = pick(r, def.params.things as [string, string][])
      const base = { rule, name, thing, emoji }
      switch (rule) {
        case 'add': {
          // At least 2 to start with ("2 apples", never "1 apples").
          const a = int(r, 2, max - 1)
          const b = int(r, 1, max - a)
          return { ...base, a, b, answer: a + b }
        }
        case 'take': {
          const a = int(r, 2, max)
          const b = int(r, 1, a - 1)
          return { ...base, a, b, answer: a - b }
        }
        case 'times': {
          const a = int(r, 2, 10)
          const b = int(r, 2, 10)
          return { ...base, a, b, answer: a * b }
        }
        case 'share': {
          const b = int(r, 2, 10)
          const each = int(r, 2, 10)
          return { ...base, a: b * each, b, answer: each }
        }
        default: {
          // unit: a things cost c pence: how much do b cost?
          const a = int(r, 2, 6)
          const price = int(r, 2, 12)
          let b = int(r, 2, 9)
          if (b === a) b = a + 1
          return { ...base, a, b, c: a * price, answer: b * price, price }
        }
      }
    },
    build: (_def, v, r) => ({ visual: { kind: 'picture', emoji: String(v.emoji) }, ...numberChoices(r, n(v, 'answer'), 1000, [-2, -1, 1, 2, 10]) }),
  },
  // "Hot is to cold as up is to …?" (params: relations: { name: [[a, b], …] })
  'vr-analogy': {
    pick: (def, r) => {
      const relations = def.params.relations as Record<string, [string, string][]>
      const rule = pick(r, Object.keys(relations))
      const [p, q] = shuffled(relations[rule], r)
      return { rule, a: p[0], b: p[1], c: q[0], answer: q[1] }
    },
    build: (def, v, r) => {
      const pairs = (def.params.relations as Record<string, [string, string][]>)[String(v.rule)]
      const others = shuffled(
        pairs.map((x) => x[1]).filter((w) => w !== v.answer && w !== v.b && w !== v.c),
        r,
      ).slice(0, 2)
      return { visual: { kind: 'sum', text: `${v.a} → ${v.b}    ${v.c} → ?` }, ...withAnswer(r, { label: String(v.answer) }, others.map((label) => ({ label }))) }
    },
  },
  // Which is the odd one out? Three from one group, one from another (params: groups: { name: [[word, picture?], …] })
  'odd-one-out': {
    pick: (def, r) => {
      const groups = def.params.groups as Record<string, Item2[]>
      const [same, other] = shuffled(Object.keys(groups), r)
      const three = shuffled(groups[same], r).slice(0, 3)
      const odd = pick(r, groups[other])
      return { group: same, oddGroup: other, items: three.map((x) => x[0]).sort().join(', '), answer: odd[0] }
    },
    build: (def, v, r) => {
      const groups = def.params.groups as Record<string, Item2[]>
      const find = (word: string) => Object.values(groups).flat().find((x) => x[0] === word)!
      const three = String(v.items).split(', ').map(find)
      // The skill's picture above the choices (the choices are the question).
      return { visual: { kind: 'picture', emoji: def.emoji }, ...withAnswer(r, choiceOf(find(String(v.answer))), shuffled(three, r).map(choiceOf)) }
    },
  },
  // A letter code: "If CAT is DBU, how is DOG written?" (params: words; shifts)
  'vr-code': {
    pick: (def, r) => {
      const shift = pick(r, def.params.shifts as number[])
      const [w1, w2] = shuffled(def.params.words as string[], r)
      return { shift, w1: w1.toUpperCase(), c1: shiftWord(w1, shift), w2: w2.toUpperCase(), answer: shiftWord(w2, shift), move: `${shift > 0 ? '+' : '−'}${Math.abs(shift)}` }
    },
    build: (_def, v, r) => {
      const s = n(v, 'shift')
      const wrongShifts = [s + 1, s - 1, s + 2, -s].filter((x, i, all) => x !== s && x % 26 !== 0 && all.indexOf(x) === i)
      const wrong = shuffled(wrongShifts, r)
        .slice(0, 2)
        .map((x) => ({ label: shiftWord(String(v.w2), x) }))
      return { visual: { kind: 'sum', text: `${v.w1} → ${v.c1}   ${v.w2} → ?` }, ...withAnswer(r, { label: String(v.answer) }, wrong) }
    },
  },
  // Which is the biggest (fastest, oldest …)? Three from a list ordered least to most (params: lists; asks)
  'ql-compare': {
    pick: (def, r) => {
      const lists = def.params.lists as Record<string, Item2[]>
      const list = pick(r, Object.keys(lists))
      const ask = pick(r, (def.params.asks as string[] | undefined) ?? ['most', 'least'])
      const idx = shuffled(
        lists[list].map((_, i) => i),
        r,
      )
        .slice(0, 3)
        .sort((a, b) => a - b)
      const words = idx.map((i) => lists[list][i][0])
      return { rule: `${list}-${ask}`, list, ask, items: words.join('|'), order: words.join(', '), answer: ask === 'most' ? words[2] : words[0] }
    },
    build: (def, v, r) => {
      const all = (def.params.lists as Record<string, Item2[]>)[String(v.list)]
      const three = String(v.items)
        .split('|')
        .map((w) => all.find((x) => x[0] === w)!)
      const right = three.find((x) => x[0] === v.answer)!
      return {
        visual: { kind: 'picture', emoji: def.emoji },
        ...withAnswer(
          r,
          choiceOf(right),
          shuffled(
            three.filter((x) => x !== right),
            r,
          ).map(choiceOf),
        ),
      }
    },
  },
  // Which word describes all three? (params: qualities: { quality: [thing, …] })
  'ql-common': {
    pick: (def, r) => {
      const qualities = def.params.qualities as Record<string, string[]>
      const answer = pick(r, Object.keys(qualities))
      const three = shuffled(qualities[answer], r).slice(0, 3)
      return { answer, things: three.join(', '), last: three[2], first: three.slice(0, 2).join(', ') }
    },
    build: (def, v, r) => {
      const others = shuffled(
        Object.keys(def.params.qualities as Record<string, string[]>).filter((q) => q !== v.answer),
        r,
      ).slice(0, 2)
      return { visual: { kind: 'sum', text: String(v.things) }, ...withAnswer(r, { label: String(v.answer) }, others.map((label) => ({ label }))) }
    },
  },
}
