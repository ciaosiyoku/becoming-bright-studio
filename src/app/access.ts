import type { Access, ItemId } from './items'
import type { Child, Family } from './state'

// Earned time: each passed lesson (4 of 5 checks) gives `minutesPerLesson`, up to `maxPerDay` a day. "Earn first"
// items open only while some of today's earned time is left, and use it up while they are open. Pure (tested).

/** Minutes earned on a day. */
export const earnedMinutes = (child: Child, family: Family, day: string) => Math.min(family.rewards.maxPerDay, (child.passes[day] ?? 0) * family.rewards.minutesPerLesson)

/** Earned seconds still left on a day. */
export const earnedSecondsLeft = (child: Child, family: Family, day: string) => Math.max(0, earnedMinutes(child, family, day) * 60 - (child.earnedUsed[day] ?? 0))

export type ItemState = 'hidden' | 'open' | 'earned' | 'locked'

/** Can the child open an item now, and how: always open, with earned time, or locked until a lesson is done. */
export function itemState(rule: Access | undefined, secondsLeft: number): ItemState {
  if (rule === 'off') return 'hidden'
  if (rule === 'open' || rule === undefined) return 'open'
  return secondsLeft > 0 ? 'earned' : 'locked'
}

export const isOpen = (s: ItemState) => s === 'open' || s === 'earned'

/** The rule for an item (an item added later gets its default). */
export const accessOf = (family: Family, id: ItemId, fallback: Access): Access => family.access[id] ?? fallback
