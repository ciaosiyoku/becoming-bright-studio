import type { AgeBand } from '@/skills/ages'

/** Where a fable comes from (all are old, public-domain tales, retold for this app in our own words). */
export type FableFrom =
  | 'aesop'
  | 'panchatantra'
  | 'jataka'
  | 'india'
  | 'anansi'
  | 'nigeria'
  | 'westAfrica'
  | 'laFontaine'
  | 'grimm'
  | 'andersen'
  | 'russia'
  | 'china'
  | 'japan'
  | 'folk'

export interface Fable {
  id: string
  title: string
  /** A picture from public/emoji. */
  emoji: string
  from: FableFrom
  /** The story, a few short paragraphs. */
  text: string[]
  /** The lesson, one sentence. */
  moral: string
}

export type FableShelf = Record<AgeBand, Fable[]>
