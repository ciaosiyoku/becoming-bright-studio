import { SUBJECTS, type Subject } from '@/access/catalogue'
import type { Progress, Score } from '@/data/types'
import { LADDERS } from '@/lessons/ladder'
import { masteryOf } from '@/reports/report'

// The learning garden on the Learn screen: every skill the child has practised is a plant, a seedling while it
// grows and a tree once it is known. It shows learning itself growing (not stars or minutes), and it never shrinks:
// a skill counts over all the answers ever given. Pure (tested in garden.test.ts).

export interface Plant {
  subject: Subject
  step: string
  known: boolean
}

export interface Garden {
  /** Known skills first, then growing ones; each in ladder order. */
  plants: Plant[]
  /** Questions learnt from mistakes (left the review boxes as known), ever. */
  learnt: number
}

export function gardenOf(p: Progress): Garden {
  const perStep = new Map<string, Score>()
  for (const steps of Object.values(p.attempts)) {
    for (const [step, s] of Object.entries(steps)) {
      const sum = perStep.get(step) ?? { right: 0, total: 0 }
      perStep.set(step, { right: sum.right + s.right, total: sum.total + s.total })
    }
  }
  const inReview = new Map<string, number>()
  for (const item of p.review) inReview.set(item.question.step ?? '', (inReview.get(item.question.step ?? '') ?? 0) + 1)
  const plants = SUBJECTS.flatMap((subject) =>
    LADDERS[subject].flatMap((step): Plant[] => {
      const s = perStep.get(step.id)
      return s ? [{ subject, step: step.id, known: masteryOf(s, inReview.get(step.id) ?? 0) === 'known' }] : []
    }),
  )
  return {
    plants: [...plants.filter((x) => x.known), ...plants.filter((x) => !x.known)],
    learnt: Object.values(p.mastered).reduce((a, b) => a + b, 0),
  }
}
