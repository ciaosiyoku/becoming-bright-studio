import { describe, expect, it } from 'vitest'
import { EMPTY_PROGRESS } from '@/data/types'
import { gardenOf } from './garden'

describe('learning garden', () => {
  it('is empty before the first mission', () => {
    expect(gardenOf(EMPTY_PROGRESS)).toEqual({ plants: [], learnt: 0 })
  })
  it('grows a plant per skill practised, trees (known) first, over all days', () => {
    const p = {
      ...EMPTY_PROGRESS,
      attempts: {
        '2026-01-05': { 'add-10': { right: 2, total: 6 }, 'count-10': { right: 5, total: 5 } },
        '2026-10-20': { 'count-10': { right: 5, total: 5 } },
      },
      mastered: { '2026-02-01': 3, '2026-10-20': 2 },
    }
    expect(gardenOf(p)).toEqual({
      plants: [
        { subject: 'maths', step: 'count-10', known: true },
        { subject: 'maths', step: 'add-10', known: false },
      ],
      learnt: 5,
    })
  })
})
