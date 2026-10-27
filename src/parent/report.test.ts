import { describe, expect, it } from 'vitest'
import { newChild } from '@/app/state'
import { duration, makeReport, periodDays } from './report'

const today = new Date(2026, 9, 26)

describe('learning reports', () => {
  it('counts the days of a period, ending today', () => {
    expect(periodDays('day', today)).toEqual(['2026-10-26'])
    expect(periodDays('week', today)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'])
    expect(periodDays('month', today)).toHaveLength(30)
    expect(periodDays('month', today)[0]).toBe('2026-09-27')
  })

  it('adds up lessons, checks, learnt skills, misses and time inside the period only', () => {
    const child = {
      ...newChild('Sam', '#5b6cf0', 'a'),
      lessons: { '2026-10-26': { count: 2, right: 9, checks: 10 }, '2026-10-22': { count: 1, right: 3, checks: 5 }, '2026-09-01': { count: 5, right: 25, checks: 25 } },
      passes: { '2026-10-26': 2, '2026-09-01': 5 },
      skills: {
        'add-5': { mastered: true, masteredOn: '2026-10-26', sessions: 2, lastScore: 5 },
        'count-5': { mastered: true, masteredOn: '2026-10-22', sessions: 1, lastScore: 4 },
        'count-10': { mastered: true, masteredOn: '2026-09-01', sessions: 1, lastScore: 5 },
      },
      misses: [
        { day: '2026-10-26', skill: 'add-5', prompt: '2 + 2', given: '5', answer: '4' },
        { day: '2026-09-01', skill: 'add-5', prompt: '1 + 2', given: '4', answer: '3' },
      ],
      usage: { '2026-10-26': { lessons: 600, games: 300 }, '2026-10-21': { explore: 120 } },
    }
    const day = makeReport(child, 'day', today)
    expect([day.lessons, day.passed, day.checks, day.right, day.accuracy]).toEqual([2, 2, 10, 9, 90])
    expect(day.learnt).toEqual(['add-5'])
    expect(day.misses).toHaveLength(1)
    expect(day.time).toEqual({ lessons: 600, games: 300, media: 0, explore: 0 })

    const week = makeReport(child, 'week', today)
    expect([week.lessons, week.passed, week.checks, week.right, week.accuracy]).toEqual([3, 2, 15, 12, 80])
    expect(week.learnt).toEqual(['count-5', 'add-5'])
    expect(week.activeDays).toBe(3)
    expect(week.perDay).toEqual([0, 0, 1, 0, 0, 0, 2])
    expect(week.time.explore).toBe(120)
  })

  it('has no accuracy without checks', () => {
    expect(makeReport(newChild('Ada', '#5b6cf0', 'b'), 'week', today).accuracy).toBeNull()
  })

  it('writes time in minutes and hours', () => {
    expect(duration(0)).toBe('0 min')
    expect(duration(12 * 60 + 20)).toBe('12 min')
    expect(duration(65 * 60)).toBe('1 h 5 min')
  })
})
