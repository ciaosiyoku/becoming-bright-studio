// Tower of Hanoi: move the whole tower to the last peg, one disc at a time, never a bigger disc on a smaller one.
// Planning ahead: the fewest moves for n discs is 2ⁿ − 1. Pure (tested).

/** Three pegs, each a list of disc sizes from the bottom up. */
export type Pegs = [number[], number[], number[]]

export const startPegs = (discs: number): Pegs => [Array.from({ length: discs }, (_, i) => discs - i), [], []]

export const fewestMoves = (discs: number) => 2 ** discs - 1

/** Whether the top disc of `from` may go on `to`. */
export function canMove(pegs: Pegs, from: number, to: number): boolean {
  if (from === to) return false
  const disc = pegs[from].at(-1)
  const top = pegs[to].at(-1)
  return disc !== undefined && (top === undefined || disc < top)
}

/** The pegs after a move (the same pegs when the move isn't allowed). */
export function move(pegs: Pegs, from: number, to: number): Pegs {
  if (!canMove(pegs, from, to)) return pegs
  const next = pegs.map((p) => [...p]) as Pegs
  next[to].push(next[from].pop()!)
  return next
}

export const isDone = (pegs: Pegs, discs: number) => pegs[2].length === discs

/** Discs for a level: 2 at level 1, up to 7. */
export const hanoiDiscs = (level: number) => Math.min(7, level + 1)
