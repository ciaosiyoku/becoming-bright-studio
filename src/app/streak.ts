import { type Child, isoDate } from './state'

// Streaks: days in a row with at least one finished lesson. Today still counts as part of the streak until it ends:
// a streak from yesterday is kept (not yet broken) while the child hasn't had a lesson today. Pure (tested).

const dayBefore = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return isoDate(new Date(y, m - 1, d - 1))
}

const learnt = (child: Child, day: string) => (child.lessons?.[day]?.count ?? 0) > 0

/** The current streak (days in a row up to today, or up to yesterday if today has no lesson yet), and the best ever. */
export function streaks(child: Child, today: string): { current: number; best: number; today: boolean } {
  let current = 0
  let day = learnt(child, today) ? today : dayBefore(today)
  while (learnt(child, day)) {
    current++
    day = dayBefore(day)
  }
  const days = Object.keys(child.lessons ?? {})
    .filter((d) => learnt(child, d))
    .sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const d of days) {
    run = prev && dayBefore(d) === prev ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current), today: learnt(child, today) }
}

/** The last `n` days up to today, oldest first, each with whether it had a lesson (the streak's week row). */
export function lastDays(child: Child, today: string, n = 7): { day: string; done: boolean }[] {
  const days = [today]
  while (days.length < n) days.unshift(dayBefore(days[0]))
  return days.map((day) => ({ day, done: learnt(child, day) }))
}
