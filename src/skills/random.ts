import type { Choice, Random } from './types'

// Random helpers for the question makers. Pure with a seeded random (tested through the skills).

export const int = (r: Random, min: number, max: number) => min + Math.floor(r() * (max - min + 1))
export const pick = <T,>(r: Random, list: readonly T[]): T => list[Math.floor(r() * list.length)]

/** A shuffled copy (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], r: Random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The right choice among the wrong ones, at a random place. */
export function withAnswer(r: Random, right: Choice, wrong: Choice[]): { choices: Choice[]; answer: number } {
  const answer = int(r, 0, wrong.length)
  const choices = [...wrong]
  choices.splice(answer, 0, right)
  return { choices, answer }
}

/** Two wrong numbers near the right one (by one of `spread`): never negative, never above `max`, all different. */
export function nearNumbers(r: Random, right: number, max: number, spread: readonly number[] = [-2, -1, 1, 2]): number[] {
  const out: number[] = []
  for (let guard = 0; out.length < 2 && guard < 50; guard++) {
    const n = right + pick(r, spread)
    if (n >= 0 && n <= max && n !== right && !out.includes(n)) out.push(n)
  }
  for (let n = 0; out.length < 2; n++) if (n !== right && !out.includes(n)) out.push(n)
  return out
}

/** The right number among two near it, at a random place. */
export const numberChoices = (r: Random, right: number, max: number, spread?: readonly number[]) =>
  withAnswer(
    r,
    { label: String(right) },
    nearNumbers(r, right, max, spread).map((n) => ({ label: String(n) })),
  )

/** Seeded random numbers (mulberry32), for tests. */
export function seeded(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
