// Everything a child can open besides the lessons, and the grown-ups' rule for each (docs/LEARNING-CONTRACT.md):
//   off   – hidden
//   open  – always open
//   earn  – opens only with time earned by finishing lessons (earned time counts down while it is used)
// Lessons are always open. Pure data and helpers (tested in access.test.ts).

export type Access = 'off' | 'open' | 'earn'
export type Tab = 'games' | 'media' | 'explore'

export const ITEMS = {
  memory: { tab: 'games', emoji: 'puzzle', access: 'earn' },
  builder: { tab: 'games', emoji: 'letters', access: 'earn' },
  codebreaker: { tab: 'games', emoji: 'key', access: 'earn' },
  puzzle: { tab: 'games', emoji: 'framed', access: 'earn' },
  sliding: { tab: 'games', emoji: 'abacus', access: 'earn' },
  radio: { tab: 'media', emoji: 'radio', access: 'earn' },
  stories: { tab: 'media', emoji: 'openbook', access: 'open' },
  videos: { tab: 'media', emoji: 'tv', access: 'earn' },
  places: { tab: 'explore', emoji: 'map', access: 'open' },
  whys: { tab: 'explore', emoji: 'globe', access: 'open' },
  facts: { tab: 'explore', emoji: 'sparkles', access: 'open' },
} as const satisfies Record<string, { tab: Tab; emoji: string; access: Access }>

export type ItemId = keyof typeof ITEMS
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[]
export const itemsOf = (tab: Tab) => ITEM_IDS.filter((id) => ITEMS[id].tab === tab)

/** The rules a new family starts with: lessons first, then games and screen time once earned. */
export const defaultAccess = (): Record<ItemId, Access> => Object.fromEntries(ITEM_IDS.map((id) => [id, ITEMS[id].access])) as Record<ItemId, Access>
