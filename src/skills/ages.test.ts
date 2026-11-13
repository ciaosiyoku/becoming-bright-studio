import { describe, expect, it } from 'vitest'
import { AGE_BANDS, bandOf, skillBands, suitsAge } from './ages'
import { bankOf } from './bank'
import { itemKey, makeItem, seeded } from './generate'
import { ALL_SKILLS as SKILLS } from './all'
import { SUBJECTS } from './index'
import type { SkillDef } from './types'

/** Questions counted per skill at most, so one big generator can't fill a range alone. */
const CAP = 150
/** Each subject has at least this many different questions for every age range. */
const PER_RANGE = 300

/** Different questions a skill can ask (up to CAP): a bank's length, or what its generator makes. */
function questions(def: SkillDef): number {
  if (def.kind === 'bank') return Math.min(CAP, bankOf(def, def.only ?? 'en').length)
  const r = seeded(11)
  const seen = new Set<string>()
  for (let i = 0; i < 4000 && seen.size < CAP; i++) seen.add(itemKey(makeItem(def, r)))
  return seen.size
}

describe('age ranges', () => {
  it('puts every age from 4 to 12 in a range', () => {
    expect([4, 5, 6, 7, 8, 9, 10, 11, 12].map(bandOf)).toEqual(['4-5', '4-5', '6-7', '6-7', '8-9', '8-9', '10-12', '10-12', '10-12'])
  })

  it('shows every skill before an age is set, and only the age range after', () => {
    const def = SKILLS.find((s) => skillBands(s).length === 1 && skillBands(s)[0] === '8-9')!
    expect(suitsAge(def, null)).toBe(true)
    expect(suitsAge(def, 8)).toBe(true)
    expect(suitsAge(def, 5)).toBe(false)
  })

  const counts = new Map<string, number>()
  for (const def of SKILLS) {
    const n = questions(def)
    for (const band of skillBands(def)) counts.set(`${def.subject} ${band}`, (counts.get(`${def.subject} ${band}`) ?? 0) + n)
  }
  for (const subject of SUBJECTS)
    for (const band of AGE_BANDS)
      it(`${subject}, ages ${band}: at least ${PER_RANGE} different questions`, () => {
        expect(counts.get(`${subject} ${band}`) ?? 0).toBeGreaterThanOrEqual(PER_RANGE)
      })
})
