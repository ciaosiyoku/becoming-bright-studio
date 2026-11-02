import { describe, expect, it } from 'vitest'
import { seeded } from '@/skills/random'
import { canMove, fewestMoves, hanoiDiscs, isDone, move, startPegs } from './hanoi/hanoi'
import { followsRule, makeLogic } from './logic/logic'
import { startLevel } from './levels'
import { countSolutions, fits, isSolvedSudoku, makeSudoku, sudokuLevel } from './sudoku/sudoku'

describe('levels', () => {
  it('start from the child’s age', () => {
    expect([4, 6, 8, 11, null].map(startLevel)).toEqual([1, 2, 3, 4, 2])
  })
})

describe('mini sudoku', () => {
  for (let level = 1; level <= 8; level++)
    it(`level ${level}: a valid full solution, and a puzzle with exactly one solution`, () => {
      const { size, holes } = sudokuLevel(level)
      for (let k = 0; k < 15; k++) {
        const s = makeSudoku(size, holes, seeded(level * 100 + k))
        expect(s.solution.every((v, i) => fits(s.solution, size, i, v))).toBe(true)
        expect(countSolutions([...s.puzzle], size)).toBe(1)
        expect(s.puzzle.every((v, i) => v === 0 || v === s.solution[i])).toBe(true)
        expect(s.puzzle.filter((v) => v === 0).length).toBeGreaterThanOrEqual(Math.min(holes, size === 4 ? 8 : holes) - 2)
        expect(isSolvedSudoku(s.solution, s.solution)).toBe(true)
      }
    })
})

describe('tower of Hanoi', () => {
  it('never puts a bigger disc on a smaller one, and the fewest moves solve it', () => {
    let pegs = startPegs(3)
    expect(canMove(pegs, 0, 1)).toBe(true)
    pegs = move(pegs, 0, 2)
    expect(move(pegs, 0, 2)).toBe(pegs) // 2 on 1: not allowed
    // The classic solution, recursively.
    const solve = (n: number, from: number, to: number, via: number, out: [number, number][]) => {
      if (n === 0) return
      solve(n - 1, from, via, to, out)
      out.push([from, to])
      solve(n - 1, via, to, from, out)
    }
    for (const n of [2, 3, 5]) {
      const steps: [number, number][] = []
      solve(n, 0, 2, 1, steps)
      expect(steps.length).toBe(fewestMoves(n))
      const end = steps.reduce((p, [a, b]) => move(p, a, b), startPegs(n))
      expect(isDone(end, n)).toBe(true)
    }
    expect([1, 3, 8].map(hanoiDiscs)).toEqual([2, 4, 7])
  })
})

describe('picture logic', () => {
  for (let level = 1; level <= 5; level++)
    it(`level ${level}: exactly one choice follows the rule`, () => {
      const r = seeded(level)
      for (let k = 0; k < 300; k++) {
        const p = makeLogic(level, r)
        expect(p.choices).toHaveLength(3)
        const keys = p.choices.map((c) => `${c.emoji}×${c.count}`)
        expect(new Set(keys).size, keys.join(' ')).toBe(3)
        expect(p.choices.filter((c) => followsRule(p, c)).length, `${p.rule} ${keys.join(' ')}`).toBe(1)
        expect(followsRule(p, p.choices[p.answer])).toBe(true)
      }
    })
})
