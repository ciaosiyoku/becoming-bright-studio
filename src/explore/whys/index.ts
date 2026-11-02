import { WHYS_BODY } from './body'
import { WHYS_BODY_NATURE_MORE } from './body-nature-more'
import { WHYS_EARTH } from './earth'
import { WHYS_FOOD } from './food'
import { WHYS_HISTORY } from './history'
import { WHYS_HOME } from './home'
import { WHYS_NATURE } from './nature'
import { WHYS_PEOPLE } from './people'
import { WHYS_PLAY } from './play'
import { WHYS_SKY } from './sky'
import { WHYS_SKY_HOME_MORE } from './sky-home-more'
import { WHYS_TRANSPORT } from './transport'
import type { WhyTopic } from './types'

// 500 Whys: short, true answers to things children wonder about around them, 50 in each of ten topics. To verify
// again before v1, like all facts (ROADMAP.md).

export const WHY_TOPICS: WhyTopic[] = ['body', 'nature', 'sky', 'home', 'food', 'transport', 'earth', 'people', 'history', 'play']
export const WHYS = [...WHYS_BODY, ...WHYS_NATURE, ...WHYS_SKY, ...WHYS_HOME, ...WHYS_BODY_NATURE_MORE, ...WHYS_SKY_HOME_MORE, ...WHYS_FOOD, ...WHYS_TRANSPORT, ...WHYS_EARTH, ...WHYS_PEOPLE, ...WHYS_HISTORY, ...WHYS_PLAY]
