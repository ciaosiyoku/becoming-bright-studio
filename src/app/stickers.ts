import { suitsAge } from '@/skills/ages'
import type { SkillMeta, Subject } from '@/skills/types'
import type { Child } from './state'
import { streaks } from './streak'

// Stickers: 100 milestones in learning, each with its own picture, worked out from the child's progress (nothing
// extra is saved, so they also come back with a backup). Every sticker comes from lessons: none for time spent, taps
// or games (docs/LEARNING-CONTRACT.md: no reward that isn't earned by learning). Pure (tested).

/** How a sticker is earned (the screen says it in the app's language). */
export type StickerRule =
  | { kind: 'first' }
  | { kind: 'firstOf'; subject: Subject }
  | { kind: 'trees'; n: number }
  | { kind: 'subjectTrees'; subject: Subject; n: number }
  | { kind: 'perfect' }
  | { kind: 'days'; n: number }
  | { kind: 'lessons'; n: number }
  | { kind: 'learningDays'; n: number }
  | { kind: 'stars'; n: number }
  | { kind: 'perfectCount'; n: number }
  | { kind: 'perfectIn'; subject: Subject }
  | { kind: 'allOf'; subject: Subject }

export interface Sticker {
  id: string
  /** Its picture (public/emoji): every sticker has its own. */
  emoji: string
  rule: StickerRule
}

const SUBJECTS: Subject[] = ['numbers', 'words', 'patterns', 'science', 'french', 'verbal', 'quantitative', 'qualitative']
/** Short names in sticker ids. */
const ID: Record<Subject, string> = { numbers: 'maths', words: 'english', patterns: 'patterns', science: 'science', french: 'french', verbal: 'verbal', quantitative: 'quantitative', qualitative: 'qualitative' }

/** The first twelve, as they were (their ids and pictures stay). */
const FIRST: Sticker[] = [
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

/** The other 88, as rules; their pictures come from PICTURES, in order. */
const MORE: Omit<Sticker, 'emoji'>[] = [
  { id: 'verbal-1', rule: { kind: 'firstOf', subject: 'verbal' } },
  { id: 'quantitative-1', rule: { kind: 'firstOf', subject: 'quantitative' } },
  { id: 'qualitative-1', rule: { kind: 'firstOf', subject: 'qualitative' } },
  ...[3, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150].map((n) => ({ id: `trees-${n}`, rule: { kind: 'trees', n } as StickerRule })),
  ...SUBJECTS.flatMap((subject) => [3, 5, 10].filter((n) => !(subject === 'words' && n === 3)).map((n) => ({ id: `${ID[subject]}-${n}`, rule: { kind: 'subjectTrees', subject, n } as StickerRule }))),
  ...[2, 5, 10, 14, 21, 30].map((n) => ({ id: `days-${n}`, rule: { kind: 'days', n } as StickerRule })),
  ...[1, 5, 10, 25, 50, 100, 200, 365, 500].map((n) => ({ id: `lessons-${n}`, rule: { kind: 'lessons', n } as StickerRule })),
  ...[5, 10, 20, 30, 50, 100].map((n) => ({ id: `learning-days-${n}`, rule: { kind: 'learningDays', n } as StickerRule })),
  ...[10, 25, 50, 100, 250, 500, 1000, 2000, 5000].map((n) => ({ id: `stars-${n}`, rule: { kind: 'stars', n } as StickerRule })),
  ...[3, 5, 10, 20, 50].map((n) => ({ id: `perfect-${n}`, rule: { kind: 'perfectCount', n } as StickerRule })),
  ...SUBJECTS.map((subject) => ({ id: `perfect-${ID[subject]}`, rule: { kind: 'perfectIn', subject } as StickerRule })),
  ...SUBJECTS.map((subject) => ({ id: `all-${ID[subject]}`, rule: { kind: 'allOf', subject } as StickerRule })),
]

/** A picture for each of the 88, none used twice (and none of the first twelve's). */
const PICTURES = [
  'speech', 'abacus', 'palette',
  'tree', 'animal-butterfly', 'animal-hedgehog', 'animal-rabbit', 'animal-koala', 'animal-panda', 'deer', 'animal-giraffe', 'animal-elephant', 'animal-spouting-whale', 'mountain',
  'chart', 'calendar', 'clock', 'puzzle', 'framed', 'notes', 'magnet', 'thermometer', 'globe', 'letters', 'scroll', 'gradcap', 'openbook', 'memo', 'map', 'animal-lady-beetle', 'animal-honeybee', 'animal-chipmunk', 'animal-hippopotamus', 'animal-kangaroo', 'animal-otter', 'animal-peacock', 'animal-flamingo',
  'sun', 'sun-small-cloud', 'sun-cloud', 'star', 'sparkles', 'moon',
  'footprints', 'shoe', 'backpack', 'school', 'bus', 'minibus', 'airplane', 'road', 'house',
  'cookie', 'cake', 'gift', 'party', 'ribbon', 'xmas',
  'fruit-apple', 'fruit-banana', 'fruit-cherries', 'fruit-strawberry', 'fruit-watermelon', 'fruit-pineapple', 'fruit-mango', 'fruit-peach', 'fruit-kiwi',
  'heart', 'bell', 'key', 'teddy', 'game',
  'animal-turtle', 'animal-dolphin', 'animal-penguin', 'animal-lion', 'animal-tiger', 'animal-zebra', 'animal-horse', 'animal-swan',
  'animal-octopus', 'animal-crab', 'animal-seal', 'animal-bear', 'animal-camel', 'animal-cow', 'animal-sloth', 'animal-beaver',
]

export const STICKERS: Sticker[] = [...FIRST, ...MORE.map((s, i) => ({ ...s, emoji: PICTURES[i] }))]

/** The learnt skills (trees), with their subjects. `skills` = every skill (skills/index.ts: SKILLS). */
export const learntSkills = (child: Child, skills: SkillMeta[]) => skills.filter((s) => child.skills[s.id]?.mastered)

/** All the stars: one for every check answered right, ever. */
export const totalStars = (child: Child): number => Object.values(child.lessons ?? {}).reduce((sum, day) => sum + (day.right ?? 0), 0)

/** Has the child earned this sticker? */
export function earned(sticker: Sticker, child: Child, skills: SkillMeta[], today: string): boolean {
  const learnt = learntSkills(child, skills)
  const perfectSkills = skills.filter((s) => child.skills[s.id]?.lastScore === 5)
  const days = Object.values(child.lessons ?? {})
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
    case 'lessons':
      return days.reduce((sum, d) => sum + (d.count ?? 0), 0) >= r.n
    case 'learningDays':
      return days.filter((d) => (d.count ?? 0) > 0).length >= r.n
    case 'stars':
      return totalStars(child) >= r.n
    case 'perfectCount':
      return perfectSkills.length >= r.n
    case 'perfectIn':
      return perfectSkills.some((s) => s.subject === r.subject)
    case 'allOf': {
      // Every skill of the subject for the child's age (every skill before an age is set).
      const forAge = skills.filter((s) => s.subject === r.subject && suitsAge(s, child.age))
      return forAge.length > 0 && forAge.every((s) => child.skills[s.id]?.mastered)
    }
  }
}

/** The ids of the stickers the child has. */
export const earnedIds = (child: Child, skills: SkillMeta[], today: string): string[] => STICKERS.filter((s) => earned(s, child, skills, today)).map((s) => s.id)

/** The stickers in `after` that weren't in `before` (a lesson just earned them): for the "New sticker!" card. */
export const newStickers = (before: string[], after: string[]): Sticker[] => STICKERS.filter((s) => after.includes(s.id) && !before.includes(s.id))
