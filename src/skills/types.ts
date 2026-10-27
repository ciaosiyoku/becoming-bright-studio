import type { Lang } from '@/i18n'

// What a skill is (src/skills/<id>.json) and what one generated question looks like.
//
// The JSON holds the words; the numbers are made in code (generate.ts), fresh each time, so the same question is
// not learnt by heart. Placeholders like {a}, {b}, {answer} or {word} in the words are filled from the question.

/** The sentences of a skill in one language. */
export interface SkillText {
  /** Shown on the home screen and to parents ("Add within 5"). */
  title: string
  /** The teach card's one sentence, read aloud (filled from the teach example). */
  teach: string
  /** The question, shown and read aloud. */
  prompt: string
  /** The one-line reason shown after every answer. */
  reason: string
}

export interface SkillDef {
  id: string
  /** Which question maker (generate.ts). */
  kind: GeneratorKind
  /** Settings for the question maker, e.g. { "max": 5 }. */
  params: Record<string, number | string[] | string[][]>
  /** The picture on the home screen (public/emoji). */
  emoji: string
  /** "en": an English skill (letters and words), taught in English whatever the app language. */
  only?: 'en'
  /** The teach card's example: fixed values, so the card is always the same. */
  example: Record<string, number | string>
  text: Partial<Record<Lang, SkillText>> & { en: SkillText }
}

export type GeneratorKind = 'count' | 'add' | 'subtract' | 'one-more' | 'one-less' | 'bigger' | 'first-sound' | 'a-an' | 'rhyme'

/** What the question shows. */
export type Visual =
  /** n pictures to count. */
  | { kind: 'count'; emoji: string; n: number }
  /** A sum written big ("3 + 2"). */
  | { kind: 'sum'; text: string }
  /** One picture, with its word under it (or without, when the word would give the answer away). */
  | { kind: 'picture'; emoji: string; word?: string }

/** A number line from 0 to `max`, with a jump from `from` by `by` (negative: back). Teach cards and reasons. */
export interface Line {
  max: number
  from: number
  by: number
}

export interface Choice {
  label?: string
  emoji?: string
}

/** One generated question. */
export interface Item {
  /** Values for the placeholders in the skill's words. */
  values: Record<string, number | string>
  visual: Visual
  /** Drawn with the reason (and on the teach card). */
  line?: Line
  choices: Choice[]
  /** Index of the right choice. */
  answer: number
}

/** Returns 0 ≤ n < 1, like Math.random (seeded in tests). */
export type Random = () => number
