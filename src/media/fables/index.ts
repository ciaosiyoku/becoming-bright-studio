// Fables: 50 short fables for each age range, old public-domain tales from Aesop, India (Panchatantra, Jataka, folk
// tales), Anansi stories, Nigerian and West African tales, La Fontaine, Grimm, Andersen, Russia, China, Japan and
// folk tales, retold for this app in our own words. In English; Mary or Barry reads them aloud.

import type { AgeBand } from '@/skills/ages'
import { FABLES_4_5 } from './f4-5'
import { FABLES_6_7 } from './f6-7'
import { FABLES_8_9 } from './f8-9'
import { FABLES_10_12 } from './f10-12'
import { MORE_4_5 } from './m4-5'
import { MORE_6_7 } from './m6-7'
import { MORE_8_9 } from './m8-9'
import { MORE_10_12 } from './m10-12'
import type { Fable } from './types'

export type { Fable, FableFrom } from './types'

export const FABLES: Record<AgeBand, Fable[]> = {
  '4-5': [...FABLES_4_5, ...MORE_4_5],
  '6-7': [...FABLES_6_7, ...MORE_6_7],
  '8-9': [...FABLES_8_9, ...MORE_8_9],
  '10-12': [...FABLES_10_12, ...MORE_10_12],
}

/** The id a fable has in a child's list of things heard (it shares the list with the stories). */
export const fableKey = (f: Fable) => `fable-${f.id}`
