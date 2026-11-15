import { describe, expect, it } from 'vitest'
import { newChild } from '@/app/state'
import { itemKey, seeded } from '@/skills/generate'
import { ALL_SKILLS } from '@/skills/all'
import { fill } from '@/skills/index'
import { type CheckAnswer, checksOf, finishSession, newSession, nextSkill, passOf, resultOf, stepOf } from './session'

const check = (right: boolean, n = 1): CheckAnswer => ({ right, prompt: `What is ${n} + 1?`, given: right ? String(n + 1) : '9', answer: String(n + 1) })
const day = new Date(2026, 9, 27, 12)

describe('a session', () => {
  it('has 2 guided tries and 10 checks, all different, none the teach example', () => {
    const def = ALL_SKILLS.find((s) => s.id === 'add-5')!
    const s = newSession(def, seeded(3))
    expect(s.items).toHaveLength(12)
    expect(new Set(s.items.map(itemKey)).size).toBe(12)
    expect(s.items.map(itemKey)).not.toContain(JSON.stringify(def.example))
    expect([0, 1, 2, 11].map((i) => stepOf(i))).toEqual([
      { kind: 'guided', n: 1, of: 2 },
      { kind: 'guided', n: 2, of: 2 },
      { kind: 'check', n: 1, of: 10 },
      { kind: 'check', n: 10, of: 10 },
    ])
  })
  it('is mastered with 8 of 10 checks right, not with 7', () => {
    const of = (right: number) => Array.from({ length: 10 }, (_, i) => check(i < right))
    expect(resultOf(of(8))).toEqual({ right: 8, mastered: true })
    expect(resultOf(of(7))).toEqual({ right: 7, mastered: false })
  })
  it('lets the grown-ups choose 5, 7 or 10 checks, passing with 80 %', () => {
    const def = ALL_SKILLS.find((s) => s.id === 'add-10')!
    expect(newSession(def, seeded(4), 'en', 5).items).toHaveLength(7)
    expect(newSession(def, seeded(4), 'en', 7).items).toHaveLength(9)
    expect([5, 7, 10].map(passOf)).toEqual([4, 6, 8])
    expect(stepOf(8, 7)).toEqual({ kind: 'check', n: 7, of: 7 })
    expect(resultOf([true, true, true, true, false].map((r) => check(r)))).toEqual({ right: 4, mastered: true })
    expect(checksOf(7)).toBe(7)
    expect(checksOf(undefined)).toBe(10)
    expect(checksOf(6)).toBe(10)
  })
  it('saves the result and the misses; a mastered skill stays mastered', () => {
    let c = newChild('Sam', '#000', 'c1')
    c = finishSession(c, 'add-5', [check(true), check(false, 2), ...Array.from({ length: 8 }, () => check(true))], day)
    expect(c.skills['add-5']).toEqual({ mastered: true, masteredOn: '2026-10-27', sessions: 1, lastScore: 9, lastOf: 10 })
    expect(c.misses).toEqual([{ day: '2026-10-27', skill: 'add-5', prompt: 'What is 2 + 1?', given: '9', answer: '3' }])
    c = finishSession(c, 'add-5', Array.from({ length: 10 }, () => check(false)), new Date(2026, 9, 28))
    expect(c.skills['add-5']).toMatchObject({ mastered: true, masteredOn: '2026-10-27', sessions: 2, lastScore: 0 })
  })
})

describe('the skill path', () => {
  const order = ['a', 'b', 'c']
  it('suggests the first skill not learnt yet', () => {
    const c = { ...newChild('Sam', '#000', 'c1'), skills: { a: { mastered: true, sessions: 1, lastScore: 5 } } }
    expect(nextSkill(c, order)).toBe('b')
    expect(nextSkill({ ...c, skills: Object.fromEntries(order.map((id) => [id, { mastered: true, sessions: 1, lastScore: 5 }])) }, order)).toBeNull()
  })
})

describe('words', () => {
  it('fills placeholders from the question', () => {
    expect(fill('Start at {a}, jump {b} → {answer}.', { a: 2, b: 1, answer: 3 })).toBe('Start at 2, jump 1 → 3.')
    expect(fill('{unknown} stays', {})).toBe('{unknown} stays')
  })
})
