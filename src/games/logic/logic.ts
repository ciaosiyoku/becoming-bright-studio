import { int, pick, shuffled } from '@/skills/random'
import type { Random } from '@/skills/types'

// Picture logic: a grid of cells, each some pictures; one cell is missing. The child finds the rule and picks the
// missing cell from three. Rules get harder by level:
//   rows    — each row has its own picture, each column its own number of pictures;
//   latin   — every picture once in each row and each column (like a sudoku);
//   growing — each row adds the same number of pictures from left to right, starting from a different number.
// Every puzzle has exactly one right choice, worked out from the rule (tested). Pure with a seeded random.

export interface Cell {
  emoji: string
  count: number
}

export interface LogicPuzzle {
  rule: 'rows' | 'latin' | 'growing'
  size: number
  cells: Cell[]
  /** Index of the missing cell. */
  missing: number
  choices: Cell[]
  answer: number
}

const PICTURES = ['star', 'heart', 'sun', 'moon', 'snowflake', 'fruit-apple', 'fruit-banana', 'fruit-cherries', 'animal-frog', 'animal-fox', 'animal-penguin', 'droplet', 'seedling', 'bell']

const same = (a: Cell, b: Cell) => a.emoji === b.emoji && a.count === b.count

function grid(rule: LogicPuzzle['rule'], size: number, r: Random): Cell[] {
  const emojis = shuffled(PICTURES, r).slice(0, size)
  if (rule === 'rows') {
    const counts = shuffled([1, 2, 3, 4].slice(0, Math.max(size, 2)), r).slice(0, size)
    return Array.from({ length: size * size }, (_, i) => ({ emoji: emojis[Math.floor(i / size)], count: counts[i % size] }))
  }
  if (rule === 'latin') {
    const shift = int(r, 1, size - 1)
    const count = int(r, 1, 2)
    return Array.from({ length: size * size }, (_, i) => ({ emoji: emojis[(i % size + Math.floor(i / size) * shift) % size], count }))
  }
  // growing: row k starts at a different number and adds `step` each column.
  const step = int(r, 1, 2)
  const starts = shuffled([1, 2, 3], r).slice(0, size)
  return Array.from({ length: size * size }, (_, i) => ({ emoji: emojis[0], count: starts[Math.floor(i / size)] + step * (i % size) }))
}

/** Rules and grid size for a level. */
export function logicLevel(level: number): { size: number; rules: LogicPuzzle['rule'][] } {
  if (level <= 1) return { size: 2, rules: ['rows'] }
  if (level === 2) return { size: 3, rules: ['rows'] }
  if (level === 3) return { size: 3, rules: ['rows', 'latin'] }
  return { size: 3, rules: ['rows', 'latin', 'growing'] }
}

export function makeLogic(level: number, r: Random): LogicPuzzle {
  const { size, rules } = logicLevel(level)
  const rule = pick(r, rules)
  const cells = grid(rule, size, r)
  const missing = int(r, size * size - size, size * size - 1)
  const right = cells[missing]
  // Wrong choices: the right picture with a wrong number, and a picture from elsewhere in the grid with the right number.
  const wrong: Cell[] = []
  const counts = [right.count + 1, right.count - 1, right.count + 2].filter((c) => c >= 1)
  for (const c of counts) if (wrong.length < 1) wrong.push({ emoji: right.emoji, count: c })
  const others = shuffled([...new Set(cells.map((c) => c.emoji))].filter((e) => e !== right.emoji), r)
  const extra = others.length ? others : shuffled(PICTURES.filter((e) => e !== right.emoji), r)
  wrong.push({ emoji: extra[0], count: right.count })
  if (wrong.length < 2 || wrong.some((w) => same(w, right))) wrong.push({ emoji: extra[1] ?? extra[0], count: right.count + 1 })
  const choices = shuffled([right, ...wrong.slice(0, 2)], r)
  return { rule, size, cells, missing, choices, answer: choices.findIndex((c) => same(c, right)) }
}

/** Whether the grid with `cell` in the gap follows the puzzle's rule (used by the test to check the one answer). */
export function followsRule(p: LogicPuzzle, cell: Cell): boolean {
  const g = p.cells.map((c, i) => (i === p.missing ? cell : c))
  const n = p.size
  const row = (k: number) => g.slice(k * n, k * n + n)
  const col = (k: number) => Array.from({ length: n }, (_, j) => g[j * n + k])
  if (p.rule === 'rows')
    return Array.from({ length: n }, (_, k) => row(k)).every((cs) => cs.every((c) => c.emoji === cs[0].emoji)) && Array.from({ length: n }, (_, k) => col(k)).every((cs) => cs.every((c) => c.count === cs[0].count))
  if (p.rule === 'latin') {
    const lines = [...Array.from({ length: n }, (_, k) => row(k)), ...Array.from({ length: n }, (_, k) => col(k))]
    return lines.every((cs) => new Set(cs.map((c) => c.emoji)).size === n) && g.every((c) => c.count === g[0].count)
  }
  return Array.from({ length: n }, (_, k) => row(k)).every((cs) => cs.every((c, j) => c.emoji === g[0].emoji && c.count - cs[0].count === j * (cs[1].count - cs[0].count))) && row(0)[1].count - row(0)[0].count === row(1)[1].count - row(1)[0].count
}
