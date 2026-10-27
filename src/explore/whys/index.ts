import { WHYS_BODY } from './body'
import { WHYS_HOME } from './home'
import { WHYS_NATURE } from './nature'
import { WHYS_SKY } from './sky'
import type { WhyTopic } from './types'

// 100 Whys: short, true answers to things children wonder about around them, 25 per topic. To verify again
// before v1, like all facts (ROADMAP.md).

export const WHY_TOPICS: WhyTopic[] = ['body', 'nature', 'sky', 'home']
export const WHYS = [...WHYS_BODY, ...WHYS_NATURE, ...WHYS_SKY, ...WHYS_HOME]
