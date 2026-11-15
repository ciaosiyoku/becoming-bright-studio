import { describe, expect, it } from 'vitest'
import type { SkillMeta } from '@/skills/types'
import { newChild, type Child } from './state'
import { earnedIds, newStickers, STICKERS, totalStars } from './stickers'

const skill = (id: string, subject: SkillMeta['subject'], ages?: SkillMeta['ages']) => ({ id, subject, stage: 0, ages }) as SkillMeta
const SKILLS = [skill('add-5', 'numbers'), skill('add-10', 'numbers'), skill('a-an', 'words'), skill('rhyme', 'words'), skill('ab', 'patterns')]
const learnt = (c: Child, id: string, lastScore = 4): Child => ({ ...c, skills: { ...c.skills, [id]: { mastered: true, sessions: 1, lastScore } } })

describe('stickers', () => {
  it('are 100, each with its own id and its own picture', () => {
    expect(STICKERS).toHaveLength(100)
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(100)
    expect(new Set(STICKERS.map((s) => s.emoji)).size).toBe(100)
  })
  it('every picture exists', () => {
    const files = new Set(Object.keys(import.meta.glob('/public/emoji/*.png')).map((f) => f.replace('/public/emoji/', '').replace('.png', '')))
    expect(STICKERS.map((s) => s.emoji).filter((e) => !files.has(e))).toEqual([])
  })
  it('none before any lesson', () => {
    expect(earnedIds(newChild('Sam', '#000'), SKILLS, '2026-11-13')).toEqual([])
  })
  it('the first tree and the first tree of a subject', () => {
    const c = learnt(newChild('Sam', '#000'), 'add-5')
    expect(earnedIds(c, SKILLS, '2026-11-13')).toEqual(['first-tree', 'maths-1'])
  })
  it('lessons, days, stars and 5 of 5 all count', () => {
    let c = learnt(newChild('Sam', '#000'), 'a-an', 5)
    c = { ...c, lessons: { '2026-11-11': { count: 1, right: 5, checks: 5 }, '2026-11-12': { count: 1, right: 4, checks: 5 }, '2026-11-13': { count: 1, right: 3, checks: 5 } } }
    const ids = earnedIds(c, SKILLS, '2026-11-13')
    expect(ids).toEqual(expect.arrayContaining(['first-tree', 'english-1', 'perfect', 'days-2', 'days-3', 'lessons-1', 'stars-10', 'perfect-english']))
    expect(ids).not.toContain('lessons-5')
    expect(ids).not.toContain('all-english')
  })
  it('every skill of a subject for the age earns its sticker', () => {
    const forAges = [skill('one', 'patterns', ['4-5']), skill('two', 'patterns', ['4-5']), skill('hard', 'patterns', ['10-12'])]
    let c = { ...newChild('Sam', '#000', 'x', 5) }
    c = learnt(learnt(c, 'one'), 'two')
    expect(earnedIds(c, forAges, '2026-11-13')).toContain('all-patterns')
  })
  it('says which stickers a lesson just earned', () => {
    expect(newStickers(['first-tree'], ['first-tree', 'maths-1']).map((s) => s.id)).toEqual(['maths-1'])
    expect(newStickers(['first-tree'], ['first-tree'])).toEqual([])
  })
  it('counts a star for every check answered right', () => {
    const c = { ...newChild('Sam', '#000'), lessons: { a: { count: 2, right: 7, checks: 10 }, b: { count: 1, right: 5, checks: 5 } } }
    expect(totalStars(c)).toBe(12)
  })
})
