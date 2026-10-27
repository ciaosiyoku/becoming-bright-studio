import { describe, expect, it } from 'vitest'
import { seeded } from '@/skills/generate'
import { SKILLS } from '@/skills/index'
import { GAME_SECONDS, makeCards, PAIRS, secondsLeft } from './pairs'

describe('memory game cards', () => {
  for (const def of SKILLS) {
    it(`${def.id}: 4 to ${PAIRS} pairs, each a question side and its answer, no answer twice`, () => {
      const cards = makeCards(def, seeded(def.id.length))
      const pairs = cards.length / 2
      expect(pairs).toBeGreaterThanOrEqual(4)
      expect(pairs).toBeLessThanOrEqual(PAIRS)
      for (let p = 0; p < pairs; p++) {
        const pair = cards.filter((c) => c.pair === p)
        expect(pair.map((c) => c.face.kind).sort()).toEqual(pair[0].face.kind === 'choice' ? ['choice', pair[1].face.kind].sort() : [pair[0].face.kind, 'choice'].sort())
      }
      const answers = cards.flatMap((c) => (c.face.kind === 'choice' ? [c.face.choice.label ?? c.face.choice.emoji] : []))
      expect(new Set(answers).size).toBe(pairs)
    })
  }
  it('gives 5 minutes per learnt skill', () => {
    expect(secondsLeft(undefined)).toBe(GAME_SECONDS)
    expect(secondsLeft(200)).toBe(100)
    expect(secondsLeft(400)).toBe(0)
  })
})
