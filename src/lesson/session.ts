import { type Child, isoDate, MAX_MISSES, type Miss } from '@/app/state'
import type { Lang } from '@/i18n'
import { makeItems } from '@/skills/generate'
import type { Item, Random, SkillDef } from '@/skills/types'

// One session of one skill (docs/LEARNING-CONTRACT.md):
//
//   teach card  →  2 guided tries (do not count)  →  5, 7 or 10 checks (one try each; 10 unless the grown-ups chose
//   fewer)  →  result: 4 of 5, 6 of 7 or 8 of 10 (80 % or more) = mastered
//
// After every answer, right or wrong, the right answer and a one-line reason are shown until the child taps
// "Next". Pure functions (tested in session.test.ts).

export const GUIDED = 2
/** Checks per lesson the grown-ups can choose (Settings → What your child can open). */
export const CHECK_OPTIONS = [5, 7, 10] as const
export type CheckCount = (typeof CHECK_OPTIONS)[number]
export const DEFAULT_CHECKS: CheckCount = 10
/** Checks right to pass: 80 % or more (4 of 5, 6 of 7, 8 of 10). */
export const passOf = (checks: number) => Math.ceil(checks * 0.8)
/** A saved choice, or the default when it is missing or not one of the options. */
export const checksOf = (saved: unknown): CheckCount => (CHECK_OPTIONS.includes(saved as CheckCount) ? (saved as CheckCount) : DEFAULT_CHECKS)

export interface Session {
  skill: string
  /** GUIDED guided tries, then `checks` checks: all different, none equal to the teach card's example. */
  items: Item[]
  checks: number
}

export const newSession = (def: SkillDef, r: Random = Math.random, lang: Lang = 'en', checks: number = DEFAULT_CHECKS): Session => ({ skill: def.id, items: makeItems(def, GUIDED + checks, r, [def.example], lang), checks })

/** A step of the session by its index: 0..1 guided, then the checks. */
export const stepOf = (index: number, checks: number = DEFAULT_CHECKS): { kind: 'guided' | 'check'; n: number; of: number } =>
  index < GUIDED ? { kind: 'guided', n: index + 1, of: GUIDED } : { kind: 'check', n: index - GUIDED + 1, of: checks }

/** One answered check, as the parent screen needs it. */
export interface CheckAnswer {
  right: boolean
  prompt: string
  given: string
  answer: string
}

/** The result of the checks. */
export function resultOf(checks: CheckAnswer[]): { right: number; mastered: boolean } {
  const right = checks.filter((c) => c.right).length
  return { right, mastered: right >= passOf(checks.length) }
}

/**
 * A child after a finished session: the skill's sessions and last score, mastered once 80 % of the checks were right
 * (it stays mastered), and the misses kept for the parent screen. Pure.
 */
const add = (day: Child['lessons'][string] | undefined, right: number, checks: number) => ({ count: (day?.count ?? 0) + 1, right: (day?.right ?? 0) + right, checks: (day?.checks ?? 0) + checks })

export function finishSession(child: Child, skill: string, checks: CheckAnswer[], day: Date): Child {
  const { right, mastered } = resultOf(checks)
  const before = child.skills[skill] ?? { mastered: false, sessions: 0, lastScore: null }
  const date = isoDate(day)
  const misses: Miss[] = checks.filter((c) => !c.right).map((c) => ({ day: date, skill, prompt: c.prompt, given: c.given, answer: c.answer }))
  return {
    ...child,
    // A passed lesson earns time (app/access.ts).
    passes: mastered ? { ...child.passes, [date]: (child.passes[date] ?? 0) + 1 } : child.passes,
    lessons: { ...child.lessons, [date]: add(child.lessons[date], right, checks.length) },
    skills: {
      ...child.skills,
      [skill]: {
        mastered: before.mastered || mastered,
        masteredOn: before.mastered ? before.masteredOn : mastered ? date : undefined,
        sessions: before.sessions + 1,
        lastScore: right,
        lastOf: checks.length,
      },
    },
    misses: [...child.misses, ...misses].slice(-MAX_MISSES),
  }
}

/** A skill to suggest next: the first one (in list order) not mastered yet, or null when every skill is. */
export const nextSkill = (child: Child, order: string[]): string | null => order.find((id) => !child.skills[id]?.mastered) ?? null
