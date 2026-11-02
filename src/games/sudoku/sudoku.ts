import { shuffled } from '@/skills/random'
import type { Random } from '@/skills/types'

// Mini sudoku: every row, every column and every box holds each symbol once. 4 × 4 (boxes of 2 × 2) or 6 × 6
// (boxes of 2 rows × 3 columns). Puzzles always have exactly one solution, so every cell can be worked out by
// reasoning, never guessed. Pure with a seeded random (tested).

export type Grid = number[] // row by row; 0 = empty; symbols are 1..size

export interface Sudoku {
  size: 4 | 6
  puzzle: Grid
  solution: Grid
}

const boxOf = (size: number) => (size === 4 ? { rows: 2, cols: 2 } : { rows: 2, cols: 3 })

/** Whether `value` can go at `i` without repeating in its row, column or box. */
export function fits(grid: Grid, size: number, i: number, value: number): boolean {
  const row = Math.floor(i / size)
  const col = i % size
  const { rows, cols } = boxOf(size)
  const r0 = row - (row % rows)
  const c0 = col - (col % cols)
  for (let k = 0; k < size; k++) {
    if (k !== col && grid[row * size + k] === value) return false
    if (k !== row && grid[k * size + col] === value) return false
  }
  for (let r = r0; r < r0 + rows; r++) for (let c = c0; c < c0 + cols; c++) if (r * size + c !== i && grid[r * size + c] === value) return false
  return true
}

/** How many solutions a grid has, counting up to `limit`. */
export function countSolutions(grid: Grid, size: number, limit = 2): number {
  const i = grid.indexOf(0)
  if (i < 0) return 1
  let n = 0
  for (let v = 1; v <= size && n < limit; v++) {
    if (!fits(grid, size, i, v)) continue
    grid[i] = v
    n += countSolutions(grid, size, limit - n)
    grid[i] = 0
  }
  return n
}

/** A full, valid grid: a pattern solution with its symbols, rows within bands and bands shuffled. */
function solvedGrid(size: 4 | 6, r: Random): Grid {
  const { rows, cols } = boxOf(size)
  const symbols = shuffled(Array.from({ length: size }, (_, i) => i + 1), r)
  const bands = shuffled(Array.from({ length: size / rows }, (_, i) => i), r)
  const rowOrder = bands.flatMap((b) => shuffled(Array.from({ length: rows }, (_, i) => b * rows + i), r))
  const stacks = shuffled(Array.from({ length: size / cols }, (_, i) => i), r)
  const colOrder = stacks.flatMap((s) => shuffled(Array.from({ length: cols }, (_, i) => s * cols + i), r))
  const pattern = (row: number, col: number) => (cols * (row % rows) + Math.floor(row / rows) + col) % size
  return rowOrder.flatMap((row) => colOrder.map((col) => symbols[pattern(row, col)]))
}

/** A puzzle with about `holes` empty cells and exactly one solution. */
export function makeSudoku(size: 4 | 6, holes: number, r: Random): Sudoku {
  const solution = solvedGrid(size, r)
  const puzzle = [...solution]
  let empty = 0
  for (const i of shuffled(puzzle.map((_, k) => k), r)) {
    if (empty >= holes) break
    const keep = puzzle[i]
    puzzle[i] = 0
    if (countSolutions([...puzzle], size) === 1) empty++
    else puzzle[i] = keep
  }
  return { size, puzzle, solution }
}

/** Size, empty cells and pictures (or numbers) for a level. */
export function sudokuLevel(level: number): { size: 4 | 6; holes: number; pictures: boolean } {
  if (level <= 1) return { size: 4, holes: 5, pictures: true }
  if (level === 2) return { size: 4, holes: 8, pictures: true }
  if (level === 3) return { size: 4, holes: 10, pictures: false }
  if (level === 4) return { size: 6, holes: 12, pictures: false }
  return { size: 6, holes: Math.min(26, 12 + 3 * (level - 4)), pictures: false }
}

export const isSolvedSudoku = (grid: Grid, solution: Grid) => grid.every((v, i) => v === solution[i])
