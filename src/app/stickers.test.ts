import { describe, expect, it } from 'vitest'
import type { SkillMeta } from '@/skills/types'
import { newChild, type Child } from './state'
import { earnedIds, newStickers, totalStars } from './stickers'

const skill = (id: string, subject: SkillMeta['subject']) => ({ id, subject }) as SkillMeta
const SKILLS = [skill('add-5', 'numbers'), skill('add-10', 'numbers'), skill('a-an', 'words'), skill('rhyme', 'words'), skill('ab', 'patterns')]
const learnt = (c: Child, id: string, lastScore = 4): Child => ({ ...c, skills: { ...c.skills, [id]: { mastered: true, sessions: 1, lastScore } } })

describe('stickers', () => {
  it('none before any skill is learnt', () => {
    expect(earnedIds(newChild('Sam', '#000'), SKILLS, '2026-11-13')).toEqual([])
  })
  it('the first tree and the first tree of a subject', () => {
    const c = learnt(newChild('Sam', '#000'), 'add-5')
    expect(earnedIds(c, SKILLS, '2026-11-13')).toEqual(['first-tree', 'maths-1'])
  })
  it('5 of 5 right earns the star sticker; a streak of 3 days the fire', () => {
    let c = learnt(newChild('Sam', '#000'), 'a-an', 5)
    c = { ...c, lessons: { '2026-11-11': { count: 1, right: 5, checks: 5 }, '2026-11-12': { count: 1, right: 4, checks: 5 }, '2026-11-13': { count: 1, right: 3, checks: 5 } } }
    expect(earnedIds(c, SKILLS, '2026-11-13')).toEqual(['first-tree', 'english-1', 'perfect', 'days-3'])
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
