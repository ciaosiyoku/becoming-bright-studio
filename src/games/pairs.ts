import { itemKey, makeItem, shuffled } from '@/skills/generate'
import type { Lang } from '@/i18n'
import { bankOf } from '@/skills/bank'
import { skillLang } from '@/skills/index'
import type { Choice, Random, SkillDef, Visual } from '@/skills/types'

// The memory game (Games tab), made of a learnt skill's own questions. Its cards
// come from the skill's own questions: each pair is a question side ("3 + 2", four apples, a picture) and its
// answer ("5", "4", "an apple"). Pure with a seeded random (tested).

/** Pairs in a game: 6, or fewer when a skill has fewer different answers (add within 5 has only 2, 3, 4, 5). */
export const PAIRS = 6

/** One side of a pair: what a question shows, or its answer. */
export type Face = { kind: 'visual'; visual: Visual } | { kind: 'choice'; choice: Choice } | { kind: 'text'; text: string }

export interface Card {
  /** Cards with the same pair match. */
  pair: number
  face: Face
}

const answerKey = (c: Choice) => c.label ?? c.emoji ?? ''

/** A question bank makes memory cards only with at least 4 different answers ("le", "la", "l’" has 3). */
export const hasCards = (def: SkillDef, lang: Lang = 'en') => def.kind !== 'bank' || new Set(bankOf(def, skillLang(def, lang)).map((q) => q[1])).size >= 4

/** Up to `PAIRS` pairs of cards from a skill's questions, shuffled: no two pairs share a question or an answer. */
export function makeCards(def: SkillDef, r: Random = Math.random, lang: Lang = 'en'): Card[] {
  const pairs: Card[][] = []
  const seenQuestions = new Set<string>()
  const seenAnswers = new Set<string>()
  for (let tries = 0; pairs.length < PAIRS && tries < 500; tries++) {
    const item = makeItem(def, r, lang)
    // "a" or "an" has only two answers: its answer card is the whole phrase ("an apple").
    const answer: Choice = def.kind === 'a-an' ? { label: `${item.values.answer} ${item.values.word}` } : item.choices[item.answer]
    if (seenQuestions.has(itemKey(item)) || seenAnswers.has(answerKey(answer))) continue
    seenQuestions.add(itemKey(item))
    seenAnswers.add(answerKey(answer))
    const n = pairs.length
    // "Which is bigger?" has no picture: its question side is the two numbers.
    // A question bank's picture alone doesn't say what is asked: its question side is the question.
    const question: Face =
      def.kind === 'bank'
        ? { kind: 'text', text: String(item.values[`q_${skillLang(def, lang)}`]) }
        : item.visual
          ? { kind: 'visual', visual: item.visual }
          : { kind: 'text', text: item.choices.map(answerKey).join(' · ') }
    pairs.push([
      { pair: n, face: question },
      { pair: n, face: { kind: 'choice', choice: answer } },
    ])
  }
  return shuffled(pairs.flat(), r)
}

