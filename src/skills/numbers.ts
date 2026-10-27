import { int, numberChoices, pick, withAnswer } from './random'
import type { Lang } from '@/i18n'
import type { Item, Random, SkillDef } from './types'

// The number skills brought back from the original (bigger numbers, times tables, place value, rounding, time,
// division, fractions, percentages, order of operations, squares). Each kind has two parts:
//   pick:  the numbers of a fresh question (random)
//   build: the question made from those numbers (the same numbers always give the same question)
// so a teach card is simply `build` on the skill's fixed example, with the answer filled in (generate.ts).
// Values named "rule" choose between a skill's prompts and reasons (e.g. "add" or "sub"). Pure (content.test.ts).

type Values = Record<string, number | string>
export interface Calc {
  pick: (def: SkillDef, r: Random) => Values
  /** `lang`: the language of answers that are words (science banks); numbers and English words ignore it. */
  build: (def: SkillDef, v: Values, r: Random, lang: Lang) => Omit<Item, 'values'>
}

const p = (def: SkillDef, key: string) => Number(def.params[key])
const n = (v: Values, key: string) => Number(v[key])
const coin = (r: Random) => r() < 0.5
/** A number line only for small numbers (it shows 0 to 20). */
const lineFor = (from: number, by: number) => (Math.max(from, from + by) <= 20 && Math.min(from, from + by) >= 0 ? { max: Math.max(10, Math.ceil(Math.max(from, from + by) / 10) * 10), from, by } : undefined)

export type CalcKind = 'picture-pattern' | 'sequence' | 'growing' | 'neighbour' | 'add-sub' | 'tens' | 'tens-ones' | 'times' | 'time-units' | 'place-value' | 'round' | 'add-sub-big' | 'divide' | 'multiply' | 'fraction' | 'percent' | 'order-ops' | 'square'

/** The steps between numbers, as shown in a reason: "+3   +3   +3" or "×2   ×2". */
const stepsText = (all: number[], times = false) =>
  all
    .slice(1)
    .map((x, i) => (times ? `×${x / all[i]}` : x >= all[i] ? `+${x - all[i]}` : `−${all[i] - x}`))
    .join('   ')

export const CALC: Record<CalcKind, Calc> = {
  // What comes next in a picture pattern? (params: rules such as "AB" or "AABB"; pictures)
  'picture-pattern': {
    pick: (def, r) => {
      const rule = pick(r, def.params.rules as string[])
      const pictures = def.params.pictures as string[]
      const symbols: string[] = []
      while (symbols.length < 3) {
        const s = pick(r, pictures)
        if (!symbols.includes(s)) symbols.push(s)
      }
      const at = (i: number) => symbols['ABC'.indexOf(rule[i % rule.length])]
      const shown = Math.max(5, rule.length * 2)
      return { rule, unit: rule.length, items: Array.from({ length: shown }, (_, i) => at(i)).join(' '), symbols: symbols.join(' '), answer: at(shown) }
    },
    build: (_def, v, r) => {
      const symbols = String(v.symbols).split(' ')
      const wrong = symbols.filter((s) => s !== v.answer).slice(0, 2)
      return { visual: { kind: 'pattern', items: String(v.items).split(' ') }, ...withAnswer(r, { emoji: String(v.answer) }, wrong.map((s) => ({ emoji: s }))) }
    },
  },
  // Which number comes next? A fixed step (params: steps, start: [min, max]; double: the share of doubling ones)
  sequence: {
    pick: (def, r) => {
      if (def.params.double && r() < Number(def.params.double)) {
        const first = int(r, 1, 5)
        const all = [first, first * 2, first * 4, first * 8, first * 16]
        return { items: all.slice(0, 4).join(', '), answer: all[4], steps: stepsText(all, true) }
      }
      const step = pick(r, def.params.steps as number[])
      const [min, max] = def.params.start as [number, number]
      const first = step < 0 ? int(r, min, max) - step * 4 : int(r, min, max)
      const all = Array.from({ length: 5 }, (_, i) => first + i * step)
      return { items: all.slice(0, 4).join(', '), answer: all[4], steps: stepsText(all) }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.items}, ?` }, ...numberChoices(r, n(v, 'answer'), 1000, [-2, -1, 1, 2, 10]) }),
  },
  // A growing step: square numbers, or a step that grows by the same amount each time
  growing: {
    pick: (_def, r) => {
      let all: number[]
      if (r() < 0.3) {
        const k = int(r, 1, 3)
        all = [k, k + 1, k + 2, k + 3, k + 4].map((x) => x * x)
      } else {
        const step = int(r, 1, 4)
        const grow = int(r, 1, 2)
        all = [int(r, 1, 10)]
        for (let i = 0; i < 4; i++) all.push(all[i] + step + i * grow)
      }
      return { items: all.slice(0, 4).join(', '), answer: all[4], steps: stepsText(all) }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.items}, ?` }, ...numberChoices(r, n(v, 'answer'), 1000, [-2, -1, 1, 2]) }),
  },
  // Numbers to 20: the one after or the one before (params: max)
  neighbour: {
    pick: (def, r) => {
      const v = int(r, 2, p(def, 'max') - 1)
      return coin(r) ? { n: v, answer: v + 1, rule: 'after' } : { n: v, answer: v - 1, rule: 'before' }
    },
    build: (def, v, r) => ({
      visual: { kind: 'sum', text: v.rule === 'after' ? `${v.n}, ?` : `?, ${v.n}` },
      line: lineFor(n(v, 'n'), v.rule === 'after' ? 1 : -1),
      ...numberChoices(r, n(v, 'answer'), p(def, 'max')),
    }),
  },
  // Adding or taking away (params: max, the biggest number; minB, the smallest number added)
  'add-sub': {
    pick: (def, r) => {
      const max = p(def, 'max')
      if (coin(r)) {
        const a = int(r, 1, max - p(def, 'minB'))
        const b = int(r, p(def, 'minB'), max - a)
        return { a, b, op: '+', answer: a + b, rule: 'add' }
      }
      const a = int(r, 2, max)
      const b = int(r, 1, a - 1)
      return { a, b, op: '−', answer: a - b, rule: 'sub' }
    },
    build: (def, v, r) => ({
      visual: { kind: 'sum', text: `${v.a} ${v.op} ${v.b}` },
      line: lineFor(n(v, 'a'), v.op === '+' ? n(v, 'b') : -n(v, 'b')),
      ...numberChoices(r, n(v, 'answer'), p(def, 'max'), p(def, 'max') > 20 ? [-10, -1, 1, 10] : undefined),
    }),
  },
  // Adding or taking away whole tens within 100: counting in tens
  tens: {
    pick: (_def, r) => {
      for (;;) {
        const a = int(r, 1, 9) * 10 + int(r, 0, 9)
        const b = int(r, 1, 5) * 10
        const add = coin(r)
        if (add && a + b <= 99) return { a, b, op: '+', answer: a + b, rule: 'add', steps: Array.from({ length: b / 10 + 1 }, (_, i) => a + 10 * i).join(', ') }
        if (!add && a - b >= 1) return { a, b, op: '−', answer: a - b, rule: 'sub', steps: Array.from({ length: b / 10 + 1 }, (_, i) => a - 10 * i).join(', ') }
      }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.a} ${v.op} ${v.b}` }, ...numberChoices(r, n(v, 'answer'), 99, [-10, -1, 1, 10]) }),
  },
  // Tens and ones make which number? Shown as bars of ten and single squares
  'tens-ones': {
    pick: (_def, r) => {
      const t = int(r, 1, 9)
      const o = int(r, 0, 9)
      return { t, o, tens: t * 10, answer: t * 10 + o }
    },
    build: (_def, v, r) => ({ visual: { kind: 'blocks', tens: n(v, 't'), ones: n(v, 'o') }, ...numberChoices(r, n(v, 'answer'), 99, [-10, -1, 1, 10]) }),
  },
  // Times tables (params: tables)
  times: {
    pick: (def, r) => {
      const t = pick(r, def.params.tables as number[])
      const k = int(r, 1, 10)
      return { n: k, t, answer: k * t, counting: Array.from({ length: k }, (_, i) => (i + 1) * t).join(', ') }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.n} × ${v.t}` }, ...numberChoices(r, n(v, 'answer'), 100, [-n(v, 't'), n(v, 't'), -1, 1]) }),
  },
  // Minutes in hours, or seconds in minutes
  'time-units': {
    pick: (_def, r) => {
      // From 2, so no sentence says "1 hours".
      const k = int(r, 2, 5)
      return { n: k, answer: 60 * k, rule: coin(r) ? 'hours' : 'minutes' }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: v.rule === 'hours' ? `${v.n} h = ? min` : `${v.n} min = ? s` }, ...numberChoices(r, n(v, 'answer'), 300, [-60, 60, -10, 10]) }),
  },
  // What is a digit worth in a 3-digit number? (three different digits, none 0)
  'place-value': {
    pick: (_def, r) => {
      const digits: number[] = []
      while (digits.length < 3) {
        const d = int(r, 1, 9)
        if (!digits.includes(d)) digits.push(d)
      }
      const place = int(r, 0, 2)
      const d = digits[place]
      return { d, n: digits[0] * 100 + digits[1] * 10 + digits[2], answer: d * [100, 10, 1][place], rule: ['hundreds', 'tens', 'ones'][place] }
    },
    build: (_def, v, r) => {
      const d = n(v, 'd')
      return {
        visual: { kind: 'sum', text: String(v.n) },
        ...withAnswer(
          r,
          { label: String(v.answer) },
          [100, 10, 1].map((x) => d * x).filter((x) => x !== n(v, 'answer')).map((x) => ({ label: String(x) })),
        ),
      }
    },
  },
  // Round to the nearest 10 or 100 (params: to); halves round up
  round: {
    pick: (def, r) => {
      const to = p(def, 'to')
      let x = 0
      while (x % to === 0) x = to === 10 ? int(r, 11, 99) : int(r, 101, 999)
      const down = Math.floor(x / to) * to
      const digit = to === 10 ? x % 10 : Math.floor((x % 100) / 10)
      const up = digit >= 5
      return { n: x, to, digit, answer: up ? down + to : down, rule: up ? 'up' : 'down' }
    },
    build: (_def, v, r) => {
      const to = n(v, 'to')
      const right = n(v, 'answer')
      const down = Math.floor(n(v, 'n') / to) * to
      const wrong = right === down ? [down + to, down - to > 0 ? down - to : down + 2 * to] : [down, right + to]
      return { visual: { kind: 'sum', text: `${v.n} ≈ ?` }, ...withAnswer(r, { label: String(right) }, wrong.map((x) => ({ label: String(x) }))) }
    },
  },
  // Adding or taking away within 1000
  'add-sub-big': {
    pick: (_def, r) => {
      const a = int(r, 100, 899)
      const b = int(r, 11, 99)
      return coin(r) ? { a, b, op: '+', answer: a + b, rule: 'add' } : { a, b, op: '−', answer: a - b, rule: 'sub' }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.a} ${v.op} ${v.b}` }, ...numberChoices(r, n(v, 'answer'), 1000, [-10, 10, -1, 1, 100]) }),
  },
  // Dividing (params: dMin, dMax, qMin, qMax: divisor and answer; or minTotal, maxTotal for 3-digit numbers)
  divide: {
    pick: (def, r) => {
      const d = int(r, p(def, 'dMin'), p(def, 'dMax'))
      const qMin = def.params.minTotal ? Math.ceil(p(def, 'minTotal') / d) : p(def, 'qMin')
      const qMax = def.params.maxTotal ? Math.floor(p(def, 'maxTotal') / d) : p(def, 'qMax')
      const q = int(r, qMin, qMax)
      return { total: q * d, d, answer: q }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.total} ÷ ${v.d}` }, ...numberChoices(r, n(v, 'answer'), 1000, [-1, 1, -2, 2, 10]) }),
  },
  // Multiplying: split the first number into tens and ones (params: aMin, aMax, bMin, bMax)
  multiply: {
    pick: (def, r) => {
      const a = int(r, p(def, 'aMin'), p(def, 'aMax'))
      const b = int(r, p(def, 'bMin'), p(def, 'bMax'))
      const aT = a - (a % 10)
      return { a, b, answer: a * b, aT, aO: a % 10, p1: aT * b, p2: (a % 10) * b }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.a} × ${v.b}` }, ...numberChoices(r, n(v, 'answer'), 10000, [-n(v, 'b'), n(v, 'b'), -10, 10]) }),
  },
  // A unit fraction of an amount: 1/d of n
  fraction: {
    pick: (_def, r) => {
      const d = pick(r, [2, 3, 4, 5])
      const total = int(r, 2, 12) * d
      return { d, n: total, answer: total / d }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `1/${v.d} · ${v.n}` }, ...numberChoices(r, n(v, 'answer'), 60) }),
  },
  // A percentage of an amount (params: percents); the amounts are multiples of 20, so every answer is whole
  percent: {
    pick: (def, r) => {
      const pc = pick(r, def.params.percents as number[])
      const total = int(r, 1, 20) * 20
      return { p: pc, n: total, tenth: total / 10, answer: (total * pc) / 100 }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.p}% · ${v.n}` }, ...numberChoices(r, n(v, 'answer'), 400, [-5, 5, -10, 10, 1]) }),
  },
  // × and ÷ before + and −; brackets first. The usual mistake (left to right) is one of the wrong answers
  'order-ops': {
    pick: (_def, r): Values => {
      const [a, b, c] = [int(r, 2, 12), int(r, 2, 9), int(r, 2, 9)]
      const kind = int(r, 0, 2)
      if (kind === 0) return { a, b, c, bc: b * c, expr: `${a} + ${b} × ${c}`, answer: a + b * c, wrongWay: (a + b) * c, rule: 'times-first' }
      if (kind === 1) return { a, b, c, bc: b * c, total: b * c + a, expr: `${b * c + a} − ${b} × ${c}`, answer: a, wrongWay: (b * c + a - b) * c, rule: 'times-before-minus' }
      return { a, b, c, ab: a + b, expr: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, wrongWay: a + b * c, rule: 'brackets' }
    },
    build: (_def, v, r) => {
      const right = n(v, 'answer')
      const wrongWay = n(v, 'wrongWay')
      const wrong = [wrongWay !== right && wrongWay >= 0 ? wrongWay : right + 10, right + pick(r, [-2, -1, 1, 2])]
      if (wrong[1] === wrong[0] || wrong[1] < 0) wrong[1] = right + 3
      return { visual: { kind: 'sum', text: String(v.expr) }, ...withAnswer(r, { label: String(right) }, wrong.map((x) => ({ label: String(x) }))) }
    },
  },
  // Square numbers: n² = n × n
  square: {
    pick: (_def, r) => {
      const k = int(r, 4, 15)
      return { n: k, answer: k * k }
    },
    build: (_def, v, r) => ({ visual: { kind: 'sum', text: `${v.n}²` }, ...numberChoices(r, n(v, 'answer'), 400, [-n(v, 'n'), n(v, 'n'), 2 * n(v, 'n') - 1, 1]) }),
  },
}
