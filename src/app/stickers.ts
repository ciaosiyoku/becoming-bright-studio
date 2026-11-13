import type { SkillMeta, Subject } from '@/skills/types'
import type { Child } from './state'
import { streaks } from './streak'

// Stickers: milestones in learning, worked out from the child's progress (nothing extra is saved, so they also come
// back with a backup). Every sticker comes from lessons: none for time spent, taps or games
// (docs/LEARNING-CONTRACT.md: no reward that isn't earned by learning). Pure (tested).

/** How a sticker is earned (the screen says it in the app's language). */
export type StickerRule =
  | { kind: 'first' }
  | { kind: 'firstOf'; subject: Subject }
  | { kind: 'trees'; n: number }
  | { kind: 'subjectTrees'; subject: Subject; n: number }
  | { kind: 'perfect' }
  | { kind: 'days'; n: number }

export interface Sticker {
  id: string
  /** Its picture (public/emoji). */
  emoji: string
  rule: StickerRule
}

export const STICKERS: Sticker[] = [
  { id: 'first-tree', emoji: 'seedling', rule: { kind: 'first' } },
  { id: 'maths-1', emoji: 'animal-owl', rule: { kind: 'firstOf', subject: 'numbers' } },
  { id: 'english-1', emoji: 'animal-fox', rule: { kind: 'firstOf', subject: 'words' } },
  { id: 'patterns-1', emoji: 'animal-snail', rule: { kind: 'firstOf', subject: 'patterns' } },
  { id: 'science-1', emoji: 'light', rule: { kind: 'firstOf', subject: 'science' } },
  { id: 'french-1', emoji: 'animal-parrot', rule: { kind: 'firstOf', subject: 'french' } },
  { id: 'perfect', emoji: 'glowstar', rule: { kind: 'perfect' } },
  { id: 'days-3', emoji: 'fire', rule: { kind: 'days', n: 3 } },
  { id: 'trees-5', emoji: 'animal-frog', rule: { kind: 'trees', n: 5 } },
  { id: 'english-3', emoji: 'books', rule: { kind: 'subjectTrees', subject: 'words', n: 3 } },
  { id: 'days-7', emoji: 'medal', rule: { kind: 'days', n: 7 } },
  { id: 'trees-10', emoji: 'trophy', rule: { kind: 'trees', n: 10 } },
]

/** The learnt skills (trees), with their subjects. `skills` = every skill (skills/index.ts: SKILLS). */
export const learntSkills = (child: Child, skills: SkillMeta[]) => skills.filter((s) => child.skills[s.id]?.mastered)

/** Has the child earned this sticker? */
export function earned(sticker: Sticker, child: Child, skills: SkillMeta[], today: string): boolean {
  const learnt = learntSkills(child, skills)
  const r = sticker.rule
  switch (r.kind) {
    case 'first':
      return learnt.length >= 1
    case 'firstOf':
      return learnt.some((s) => s.subject === r.subject)
    case 'trees':
      return learnt.length >= r.n
    case 'subjectTrees':
      return learnt.filter((s) => s.subject === r.subject).length >= r.n
    case 'perfect':
      return Object.values(child.skills).some((p) => p.lastScore === 5)
    case 'days':
      return streaks(child, today).best >= r.n
  }
}

/** The ids of the stickers the child has. */
export const earnedIds = (child: Child, skills: SkillMeta[], today: string): string[] => STICKERS.filter((s) => earned(s, child, skills, today)).map((s) => s.id)

/** The stickers in `after` that weren't in `before` (a lesson just earned them): for the "New sticker!" card. */
export const newStickers = (before: string[], after: string[]): Sticker[] => STICKERS.filter((s) => after.includes(s.id) && !before.includes(s.id))

/** All the stars: one for every check answered right, ever. */
export const totalStars = (child: Child): number => Object.values(child.lessons ?? {}).reduce((sum, day) => sum + (day.right ?? 0), 0)
