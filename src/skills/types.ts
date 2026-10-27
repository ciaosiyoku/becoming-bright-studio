import type { Lang } from '@/i18n'
import type { BankKind } from './bank'
import type { CalcKind } from './numbers'
import type { WordKind } from './words'

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
  /** Other prompts, chosen by the question's "rule" value (e.g. "after" or "before"). */
  prompts?: Record<string, string>
  /** Read aloud instead of the prompt, when saying the word must not show it ("Which letter does sun start with?"). */
  say?: string
  /** The one-line reason shown after every answer. */
  reason: string
  /** Other reasons, chosen by the question's "rule" value (e.g. "an" or "a" for "a" or "an"). */
  reasons?: Record<string, string>
}

export interface SkillDef {
  id: string
  /** Which question maker (generate.ts). */
  kind: GeneratorKind
  /** The group on the home screen. */
  subject: Subject
  /** About which school stage it belongs to (Cambridge Primary: 0 = before Stage 1, up to 7 = a stretch past 6). */
  stage: number
  /** The teaching order within its subject (the home screen shows skills in this order). */
  order: number
  /** Settings for the question maker, e.g. { "max": 5 } or word lists. Each maker reads its own (generate.ts). */
  params: Record<string, unknown>
  /** The picture on the home screen (public/emoji). */
  emoji: string
  /** "en": an English skill (letters and words), taught in English whatever the app language; "fr": a French skill. */
  only?: 'en' | 'fr'
  /** The teach card's example: fixed values, so the card is always the same. */
  example: Record<string, number | string>
  text: Partial<Record<Lang, SkillText>> & { en: SkillText }
}

export type Subject = 'numbers' | 'words' | 'patterns' | 'science' | 'french'

export type GeneratorKind = 'count' | 'add' | 'subtract' | 'one-more' | 'one-less' | 'bigger' | 'first-sound' | 'a-an' | 'rhyme' | CalcKind | WordKind | BankKind

/** What the question shows. */
export type Visual =
  /** n pictures to count. */
  | { kind: 'count'; emoji: string; n: number }
  /** A sum written big ("3 + 2"). */
  | { kind: 'sum'; text: string }
  /** One picture, with its word under it (or without, when the word would give the answer away). */
  | { kind: 'picture'; emoji: string; word?: string }
  /** A picture pattern with a gap at the end ("?"), or with the gap filled in (teach cards). */
  | { kind: 'pattern'; items: string[]; filled?: string }
  /** Tens and ones: bars of ten and single squares (place value). */
  | { kind: 'blocks'; tens: number; ones: number }
  /** Two pictures with their words (the rhyming teach card). */
  | { kind: 'pair'; a: { emoji: string; word: string }; b: { emoji: string; word: string } }

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
  /** What the question shows (none: the choices are the question, as in "Which is bigger?"). */
  visual?: Visual
  /** Drawn with the reason (and on the teach card). */
  line?: Line
  choices: Choice[]
  /** Index of the right choice. */
  answer: number
}

/** Returns 0 ≤ n < 1, like Math.random (seeded in tests). */
export type Random = () => number
