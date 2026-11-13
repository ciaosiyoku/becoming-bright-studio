import type { SkillMeta } from './types'

// Age ranges: the parent gives each child an age (4 to 12), and the child chooses among the skills of their range.
// A skill belongs to the ranges in its JSON "ages", or else to the range of its school stage.

export type AgeBand = '4-5' | '6-7' | '8-9' | '10-12'
export const AGE_BANDS: AgeBand[] = ['4-5', '6-7', '8-9', '10-12']
export const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** The range of an age (under 4 counts as 4, over 12 as 12). */
export function bandOf(age: number): AgeBand {
  if (age <= 5) return '4-5'
  if (age <= 7) return '6-7'
  if (age <= 9) return '8-9'
  return '10-12'
}

/** The range of a school stage (Cambridge Primary: 0 = before Stage 1, up to 7 = a stretch past 6). */
const bandOfStage = (stage: number): AgeBand => (stage <= 0 ? '4-5' : stage <= 2 ? '6-7' : stage <= 4 ? '8-9' : '10-12')

/** The ranges a skill is for. */
export const skillBands = (def: SkillMeta): AgeBand[] => (def.ages?.length ? def.ages : [bandOfStage(def.stage)])

/** Whether a skill suits a child of this age (no age yet: every skill). */
export const suitsAge = (def: SkillMeta, age: number | null | undefined): boolean => age == null || skillBands(def).includes(bandOf(age))
