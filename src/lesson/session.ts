import { type Child, isoDate, MAX_MISSES, type Miss } from '@/app/state'
import { makeItems } from '@/skills/generate'
import type { Item, Random, SkillDef } from '@/skills/types'

// One session of one skill (docs/LEARNING-CONTRACT.md):
//
//   teach card  →  2 guided tries (do not count)  →  5 checks (one try each)  →  result: 4 of 5 = mastered
//
// After every answer, right or wrong, the right answer and a one-line reason are shown until the child taps
// "Next". Pure functions (tested in session.test.ts).

export const GUIDED = 2
export const CHECKS = 5
export const PASS = 4

export interface Session {
  skill: string
  /** GUIDED guided tries, then CHECKS checks: all different, none equal to the teach card's example. */
  items: Item[]
}

export const newSession = (def: SkillDef, r: Random = Math.random): Session => ({ skill: def.id, items: makeItems(def, GUIDED + CHECKS, r, [def.example]) })

/** A step of the session by its index: 0..1 guided, 2..6 checks. */
export const stepOf = (index: number): { kind: 'guided' | 'check'; n: number; of: number } =>
  index < GUIDED ? { kind: 'guided', n: index + 1, of: GUIDED } : { kind: 'check', n: index - GUIDED + 1, of: CHECKS }

/** One answered check, as the parent screen needs it. */
export interface CheckAnswer {
  right: boolean
  prompt: string
  given: string
  answer: string
}

/** The result of the five checks. */
export function resultOf(checks: CheckAnswer[]): { right: number; mastered: boolean } {
  const right = checks.filter((c) => c.right).length
  return { right, mastered: right >= PASS }
}

/**
 * A child after a finished session: the skill's sessions and last score, mastered once 4 of 5 checks were right
 * (it stays mastered), and the misses kept for the parent screen. Pure.
 */
export function finishSession(child: Child, skill: string, checks: CheckAnswer[], day: Date): Child {
  const { right, mastered } = resultOf(checks)
  const before = child.skills[skill] ?? { mastered: false, sessions: 0, lastScore: null }
  const date = isoDate(day)
  const misses: Miss[] = checks.filter((c) => !c.right).map((c) => ({ day: date, skill, prompt: c.prompt, given: c.given, answer: c.answer }))
  return {
    ...child,
    skills: {
      ...child.skills,
      [skill]: {
        mastered: before.mastered || mastered,
        masteredOn: before.mastered ? before.masteredOn : mastered ? date : undefined,
        sessions: before.sessions + 1,
        lastScore: right,
      },
    },
    misses: [...child.misses, ...misses].slice(-MAX_MISSES),
  }
}

/** Is a skill open? The first always; every other once the one before it is mastered (or it is itself). */
export function isOpen(child: Child, order: string[], skill: string): boolean {
  const i = order.indexOf(skill)
  if (i <= 0) return i === 0
  return Boolean(child.skills[skill]?.mastered || child.skills[order[i - 1]]?.mastered)
}

/** Today's lesson: the first skill not mastered yet, or null when every skill is. */
export const nextSkill = (child: Child, order: string[]): string | null => order.find((id) => !child.skills[id]?.mastered) ?? null
