import { describe, expect, it } from 'vitest'
import { seeded } from '@/skills/random'
import { isSolved, mixedBoard, neighbours, slide, solvedBoard } from './sliding'

describe('number slide', () => {
  it('knows the solved board and the neighbours of a place', () => {
    expect(solvedBoard(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
    expect(isSolved(solvedBoard(4))).toBe(true)
    expect(neighbours(4, 3).sort()).toEqual([1, 3, 5, 7])
    expect(neighbours(0, 3).sort()).toEqual([1, 3])
  })
  it('slides only a number next to the gap', () => {
    const b = solvedBoard(3)
    expect(slide(b, 7, 3)).toEqual([1, 2, 3, 4, 5, 6, 7, 0, 8])
    expect(slide(b, 0, 3)).toBe(b)
  })
  it('mixes into a board that is not solved but can be (it is made of legal slides)', () => {
    for (const seed of [1, 2, 3]) {
      const b = mixedBoard(3, seeded(seed))
      expect(isSolved(b)).toBe(false)
      expect([...b].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    }
  })
})
