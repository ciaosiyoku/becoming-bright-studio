import { type Area, type Child, isoDate, type Miss } from '@/app/state'

// Learning reports for the grown-ups: what a child did today, in the last 7 days or in the last 30 days.
// Everything comes from what the app already keeps on the device (lessons, passes, learnt skills, misses and time
// per area); nothing is sent anywhere. Pure (tested in report.test.ts).

export type Period = 'day' | 'week' | 'month'
export const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 }
export const AREAS: Area[] = ['lessons', 'games', 'media', 'explore']

export interface Report {
  /** The days counted, oldest first ("YYYY-MM-DD"). */
  days: string[]
  lessons: number
  passed: number
  checks: number
  right: number
  /** Checks right in percent, or null without checks. */
  accuracy: number | null
  /** Skills learnt in the period (ids, in the order they were learnt). */
  learnt: string[]
  misses: Miss[]
  /** Seconds per area. */
  time: Record<Area, number>
  /** Days with any lesson or any time in the app. */
  activeDays: number
  /** Lessons per day, oldest first (the little chart). */
  perDay: number[]
}

/** The days of a period ending on `today`, oldest first. */
export function periodDays(period: Period, today: Date): string[] {
  return Array.from({ length: PERIOD_DAYS[period] }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (PERIOD_DAYS[period] - 1 - i))
    return isoDate(d)
  })
}

export function makeReport(child: Child, period: Period, today: Date): Report {
  const days = periodDays(period, today)
  const inPeriod = new Set(days)
  const sum = (f: (day: string) => number) => days.reduce((n, d) => n + f(d), 0)
  const checks = sum((d) => child.lessons[d]?.checks ?? 0)
  const right = sum((d) => child.lessons[d]?.right ?? 0)
  const time = Object.fromEntries(AREAS.map((a) => [a, sum((d) => child.usage[d]?.[a] ?? 0)])) as Record<Area, number>
  return {
    days,
    lessons: sum((d) => child.lessons[d]?.count ?? 0),
    passed: sum((d) => child.passes[d] ?? 0),
    checks,
    right,
    accuracy: checks > 0 ? Math.round((100 * right) / checks) : null,
    learnt: Object.entries(child.skills)
      .filter(([, p]) => p.mastered && p.masteredOn && inPeriod.has(p.masteredOn))
      .sort(([, a], [, b]) => (a.masteredOn! < b.masteredOn! ? -1 : 1))
      .map(([id]) => id),
    misses: child.misses.filter((m) => inPeriod.has(m.day)),
    time,
    activeDays: days.filter((d) => (child.lessons[d]?.count ?? 0) > 0 || Object.values(child.usage[d] ?? {}).some((s) => s > 0)).length,
    perDay: days.map((d) => child.lessons[d]?.count ?? 0),
  }
}

/** "1 h 5 min", "12 min", "0 min" (time in the reports). */
export function duration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`
}
