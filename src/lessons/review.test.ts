import { describe, expect, it } from 'vitest'
import { completeMission } from '@/progress/progress'
import { EMPTY_PROGRESS } from '@/data/types'
import { missionRound } from './ladder'
import { numberQuestion, type Question, questionKey, seeded, workedLine } from './question'
import { dueReview, MAX_REVIEW, mixIn, type ReviewItem, reviewCounts, reviewQuestion, updateReview } from './review'

const day = (iso: string) => new Date(`${iso}T12:00:00`)
const q = (n: number): Question => numberQuestion(seeded(n), `What is ${n} + ${n}?`, 2 * n, { kind: 'text', text: `${n} + ${n}` })
const wrong = (question: Question) => ({ question, lang: 'en' as const, right: false })
const right = (question: Question) => ({ question, lang: 'en' as const, right: true })

describe('review boxes', () => {
  it('puts a wrong answer in box 1 for tomorrow', () => {
    const { items } = updateReview([], 'maths', [wrong(q(3))], day('2026-10-26'))
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ key: questionKey(q(3)), subject: 'maths', lang: 'en', box: 1, due: '2026-10-27', since: '2026-10-26' })
  })
  it('moves a known question up a box at a time, at growing gaps, then out', () => {
    let items: ReviewItem[] = updateReview([], 'maths', [wrong(q(3))], day('2026-10-01')).items
    const steps: [string, number, string][] = [
      ['2026-10-02', 2, '2026-10-05'],
      ['2026-10-05', 3, '2026-10-12'],
      ['2026-10-12', 4, '2026-11-02'],
    ]
    for (const [on, box, due] of steps) {
      items = updateReview(items, 'maths', [right(q(3))], day(on)).items
      expect(items[0]).toMatchObject({ box, due })
    }
    const last = updateReview(items, 'maths', [right(q(3))], day('2026-11-02'))
    expect(last.items).toHaveLength(0)
    expect(last.mastered).toBe(1)
  })
  it('sends a question answered wrong again back to box 1, keeping the day it was first missed', () => {
    let items = updateReview([], 'maths', [wrong(q(3))], day('2026-10-01')).items
    items = updateReview(items, 'maths', [right(q(3))], day('2026-10-02')).items
    items = updateReview(items, 'maths', [wrong(q(3))], day('2026-10-05')).items
    expect(items[0]).toMatchObject({ box: 1, due: '2026-10-06', since: '2026-10-01' })
  })
  it('ignores right answers to questions that are not in the boxes', () => {
    expect(updateReview([], 'maths', [right(q(3))], day('2026-10-01'))).toEqual({ items: [], mastered: 0 })
  })
  it('finds the same question again with its buttons in another order', () => {
    const items = updateReview([], 'maths', [wrong(q(3))], day('2026-10-01')).items
    const again = reviewQuestion(items[0], seeded(9))
    expect(questionKey(again)).toBe(questionKey(q(3)))
    expect(again.review).toBe(true)
    expect(updateReview(items, 'maths', [right(again)], day('2026-10-02')).items[0].box).toBe(2)
  })
  it('keeps at most MAX_REVIEW questions, the newest', () => {
    const many = Array.from({ length: MAX_REVIEW + 5 }, (_, i) => wrong(q(i + 1)))
    const { items } = updateReview([], 'maths', many, day('2026-10-01'))
    expect(items).toHaveLength(MAX_REVIEW)
    expect(items[items.length - 1].key).toBe(questionKey(q(MAX_REVIEW + 5)))
  })
  it('gives the due questions of a subject and language, longest waiting first', () => {
    let items = updateReview([], 'maths', [wrong(q(1))], day('2026-10-01')).items
    items = updateReview(items, 'maths', [wrong(q(2))], day('2026-10-03')).items
    items = [...items, ...updateReview([], 'world', [wrong(q(5))], day('2026-10-01')).items]
    expect(dueReview(items, 'maths', 'en', '2026-10-02', 5).map((i) => i.question.prompt)).toEqual(['What is 1 + 1?'])
    expect(dueReview(items, 'maths', 'en', '2026-10-09', 5)).toHaveLength(2)
    expect(dueReview(items, 'maths', 'de', '2026-10-09', 5)).toHaveLength(0)
    expect(dueReview(items, 'maths', 'en', '2026-10-09', 1)[0].question.prompt).toBe('What is 1 + 1?')
    expect(reviewCounts(items, '2026-10-02')).toEqual({ waiting: 3, due: 2 })
  })
  it('spreads review questions through a round, never first', () => {
    expect(mixIn<number | string>([1, 2, 3, 4, 5, 6, 7, 8], ['a', 'b'])).toEqual([1, 2, 3, 'a', 4, 5, 6, 'b', 7, 8])
    expect(mixIn<number | string>([1], ['a'])[0]).toBe(1)
    expect(mixIn([1, 2], [])).toEqual([1, 2])
  })
})

describe('mission rounds with review', () => {
  it('mixes in at most a fifth of the round from the boxes, without asking a question twice', () => {
    const missed = Array.from({ length: 6 }, (_, i) => q(i + 1))
    const items = updateReview([], 'maths', missed.map(wrong), day('2026-10-01')).items
    const round = missionRound('maths', 3, 10, 'en', items, '2026-10-02', seeded(4))
    expect(round).toHaveLength(10)
    expect(round.filter((x) => x.review)).toHaveLength(2)
    expect(new Set(round.map(questionKey)).size).toBe(10)
  })
  it('a finished mission files wrong answers and moves the level by the new questions only', () => {
    const fresh = q(7)
    const old = { ...q(8), review: true }
    const answers = [
      { step: 'add-10', prompt: fresh.prompt, given: '1', answer: '14', right: false, question: fresh, lang: 'en' as const },
      { step: 'add-10', prompt: old.prompt, given: '16', answer: '16', right: true, question: old, lang: 'en' as const },
    ]
    const start = { ...EMPTY_PROGRESS, review: updateReview([], 'maths', [wrong(q(8))], day('2026-10-01')).items }
    const p = completeMission(start, 'maths', answers, { day: day('2026-10-02'), stage: 2, counts: false })
    expect(p.review.map((i) => [i.question.prompt, i.box])).toEqual([
      ['What is 8 + 8?', 2],
      ['What is 7 + 7?', 1],
    ])
    expect(p.recent.maths).toEqual([])
  })
})

describe('explanations', () => {
  it('shows why a number rounds the way it does, and the steps of a sequence', async () => {
    const { MATHS } = await import('./maths')
    const { PATTERNS } = await import('./patterns')
    const round = MATHS.find((s) => s.id.startsWith('round'))
    expect(round).toBeDefined()
    for (let i = 0; i < 20; i++) {
      const q = round!.make(seeded(i), 'en')
      expect(q.explain?.[0]).toMatch(/digit is \d: .* to \d+\.$/)
      expect(q.explain?.[0]).toContain(q.choices[q.answer].label)
    }
    const seq = PATTERNS.find((s) => s.id.includes('step') || s.id.includes('count'))
    if (seq) expect(seq.make(seeded(1), 'en').explain?.[0]).toMatch(/^[+−×]\d+/)
  })
})

describe('worked line', () => {
  it('works out the sum shown with the question', () => {
    expect(workedLine(numberQuestion(seeded(1), 'x', 56, { kind: 'text', text: '8 × 7' }))).toBe('8 × 7 = 56')
    expect(workedLine(numberQuestion(seeded(1), 'x', 30, { kind: 'text', text: '34 ≈ ?' }))).toBe('34 ≈ 30')
    expect(workedLine(numberQuestion(seeded(1), 'x', 5, { kind: 'text', text: '4, ?' }))).toBe('4, 5')
    expect(workedLine(numberQuestion(seeded(1), 'x', 120, { kind: 'text', text: '2 h = ? min' }))).toBe('2 h = 120 min')
  })
  it('gives nothing when the picture is not a calculation', () => {
    expect(workedLine(numberQuestion(seeded(1), 'x', 3, { kind: 'text', text: '345' }))).toBeNull()
    expect(workedLine(numberQuestion(seeded(1), 'x', 3, { kind: 'emoji', name: 'apple', count: 3 }))).toBeNull()
  })
})
