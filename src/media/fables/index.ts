// Fables: 20 short fables for each age range, old public-domain tales from Aesop, the Panchatantra, the Jataka,
// Anansi stories, Nigerian and West African tortoise tales, La Fontaine and folk tales, retold for this app in our own
// words. In English; Mary or Barry reads them aloud.

import type { AgeBand } from '@/skills/ages'
import { FABLES_4_5 } from './f4-5'
import { FABLES_6_7 } from './f6-7'
import { FABLES_8_9 } from './f8-9'
import { FABLES_10_12 } from './f10-12'
import type { Fable } from './types'

export type { Fable, FableFrom } from './types'

export const FABLES: Record<AgeBand, Fable[]> = {
  '4-5': FABLES_4_5,
  '6-7': FABLES_6_7,
  '8-9': FABLES_8_9,
  '10-12': FABLES_10_12,
}

/** The id a fable has in a child's list of things heard (it shares the list with the stories). */
export const fableKey = (f: Fable) => `fable-${f.id}`
