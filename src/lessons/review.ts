import type { Subject } from '@/access/catalogue'
import type { Lang } from '@/i18n'
import { addDays, isoDate } from '@/shared/date'
import { type Question, questionKey, type Random, shuffled } from './question'

// Review boxes (the Leitner system): a question answered wrong comes back on later days until it is known.
//
//   wrong answer          → box 1, back tomorrow
//   right in box 1, 2, 3  → the next box, back after 3, 7 or 21 days
//   right in box 4        → known: it leaves the boxes (counted as mastered for the reports)
//   wrong again, any box  → back to box 1
//
// Each mission round mixes in up to REVIEW_SHARE of its questions from the boxes that are due (oldest first), so
// the child meets a hard question again after seeing why it was wrong, then again at growing gaps: spaced
// practice. Pure functions (tested in review.test.ts).

export type Box = 1 | 2 | 3 | 4
/** Days until a question in each box comes back. */
export const BOX_GAP_DAYS: Record<Box, number> = { 1: 1, 2: 3, 3: 7, 4: 21 }
/** At most this share of a round comes from the review boxes. */
export const REVIEW_SHARE = 0.2
/** The boxes keep at most this many questions (the ones waiting longest go first when full). */
export const MAX_REVIEW = 300

export interface ReviewItem {
  /** questionKey of the question. */
  key: string
  subject: Subject
  /** The language the question is written in (English lessons are always 'en'). */
  lang: Lang
  question: Question
  box: Box
  /** "YYYY-MM-DD": the day it is asked again. */
  due: string
  /** "YYYY-MM-DD": the day it was first answered wrong. */
  since: string
}

/** One answered question, as the review boxes need it. */
export interface ReviewAnswer {
  question: Question
  lang: Lang
  right: boolean
}

/** Questions of a subject (in its language) due on `today`, the longest-waiting first, at most `max`. */
export function dueReview(items: readonly ReviewItem[], subject: Subject, lang: Lang, today: string, max: number): ReviewItem[] {
  return items
    .filter((i) => i.subject === subject && i.lang === lang && i.due <= today)
    .sort((a, b) => (a.due === b.due ? a.box - b.box : a.due < b.due ? -1 : 1))
    .slice(0, Math.max(0, max))
}

/** A question from the boxes, with its buttons in a new order (the place of the right answer is not learnt). */
export function reviewQuestion(item: ReviewItem, r: Random = Math.random): Question {
  const q = item.question
  const order = shuffled(
    q.choices.map((_, i) => i),
    r,
  )
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer), review: true }
}

/** The question as kept in the boxes: without marks that belong to one round. */
const stored = (q: Question): Question => {
  const { review: _review, ...rest } = q
  return rest
}

/**
 * The boxes after a round: wrong answers go to box 1, right answers to questions in the boxes move one box up
 * (or leave the boxes from box 4). Returns the new boxes and how many questions became known. Pure (tested).
 */
export function updateReview(items: readonly ReviewItem[], subject: Subject, answers: readonly ReviewAnswer[], day: Date): { items: ReviewItem[]; mastered: number } {
  const date = isoDate(day)
  const due = (box: Box) => isoDate(addDays(day, BOX_GAP_DAYS[box]))
  const byKey = new Map(items.map((i) => [i.key, i]))
  let mastered = 0
  for (const a of answers) {
    const key = questionKey(a.question)
    const old = byKey.get(key)
    if (a.right) {
      if (!old) continue
      if (old.box === 4) {
        byKey.delete(key)
        mastered++
      } else {
        const box = (old.box + 1) as Box
        byKey.set(key, { ...old, box, due: due(box) })
      }
    } else {
      // Deleted first, so a question answered wrong again moves to the end (the newest are kept when full).
      byKey.delete(key)
      byKey.set(key, { key, subject, lang: a.lang, question: stored(a.question), box: 1, due: due(1), since: old?.since ?? date })
    }
  }
  return { items: [...byKey.values()].slice(-MAX_REVIEW), mastered }
}

/** How many questions wait in the boxes, and how many of them are due on `today`. */
export function reviewCounts(items: readonly ReviewItem[], today: string): { waiting: number; due: number } {
  return { waiting: items.length, due: items.filter((i) => i.due <= today).length }
}

/**
 * Review questions spread through a round (never first: the round starts with its warm-up), keeping the order
 * of both lists. Pure (tested).
 */
export function mixIn<T>(round: readonly T[], extra: readonly T[]): T[] {
  if (extra.length === 0) return [...round]
  const out = [...round]
  const gap = (round.length + 1) / (extra.length + 1)
  extra.forEach((q, i) => out.splice(Math.max(1, Math.round(gap * (i + 1))) + i, 0, q))
  return out
}
