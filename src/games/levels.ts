import { useStore } from '@/app/store'
import { activeChild, updateChild } from '@/app/state'
import { bandOf } from '@/skills/ages'

// Levels for the thinking games: a game starts at the child's age (4–5 → level 1, up to 10–12 → level 4) and goes
// up one level after each win, so it stays a little hard. Kept per child (state.ts, Child.levels).

export type GameId = 'sudoku' | 'hanoi' | 'sequence' | 'logic'
export const MAX_LEVEL = 8

/** The first level for an age (no age yet: level 2). */
export const startLevel = (age: number | null | undefined): number => (age == null ? 2 : { '4-5': 1, '6-7': 2, '8-9': 3, '10-12': 4 }[bandOf(age)])

/** The child's level in a game, and a way to go up (after a win) or down (to make it easier). */
export function useLevel(game: GameId) {
  const { state, update } = useStore()
  const child = activeChild(state)
  const level = child?.levels?.[game] ?? startLevel(child?.age)
  const setLevel = (n: number) => {
    if (!child) return
    const next = Math.max(1, Math.min(MAX_LEVEL, n))
    update((s) => updateChild(s, child.id, (c) => ({ ...c, levels: { ...c.levels, [game]: next } })))
  }
  return { level, up: () => setLevel(level + 1), down: () => setLevel(level - 1), set: setLevel }
}
