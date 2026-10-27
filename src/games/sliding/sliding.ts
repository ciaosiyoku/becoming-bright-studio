// Number slide: the numbers 1 to n² − 1 on an n × n board with one gap; tap a number next to the gap to slide it in,
// until they are in order with the gap last. Mixed by random legal slides from the solved board, so every board can
// be solved. Pure (sliding.test.ts).

/** board[position] = the number at that position, 0 for the gap. */
export type Board = number[]

export const solvedBoard = (n: number): Board => [...Array.from({ length: n * n - 1 }, (_, i) => i + 1), 0]
export const isSolved = (b: Board) => b.every((x, i) => x === (i === b.length - 1 ? 0 : i + 1))

/** The positions next to `pos` (up, down, left, right) on an n × n board. */
export function neighbours(pos: number, n: number): number[] {
  const r = Math.floor(pos / n)
  const c = pos % n
  return [r > 0 ? pos - n : -1, r < n - 1 ? pos + n : -1, c > 0 ? pos - 1 : -1, c < n - 1 ? pos + 1 : -1].filter((p) => p >= 0)
}

/** The board after tapping `pos`: the number slides into the gap if it is next to it; otherwise nothing changes. */
export function slide(b: Board, pos: number, n: number): Board {
  const gap = b.indexOf(0)
  if (!neighbours(gap, n).includes(pos)) return b
  const next = [...b]
  ;[next[gap], next[pos]] = [next[pos], 0]
  return next
}

/** A mixed board: `moves` random slides from the solved one (never undoing the last), never already solved. */
export function mixedBoard(n: number, random = Math.random, moves = n * n * 20): Board {
  let b = solvedBoard(n)
  let last = -1
  do {
    for (let i = 0; i < moves; i++) {
      const gap = b.indexOf(0)
      const options = neighbours(gap, n).filter((p) => p !== last)
      const pos = options[Math.floor(random() * options.length)]
      b = slide(b, pos, n)
      last = gap
    }
  } while (isSolved(b))
  return b
}
