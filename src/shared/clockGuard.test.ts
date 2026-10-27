import { describe, expect, it } from 'vitest'
import { checkClock, CLOCK_SLACK_MS, clockWentBack } from './clockGuard'

const HOUR = 3_600_000
const T = Date.UTC(2026, 9, 26, 12)

describe('clock guard', () => {
  it('notices the clock going back past the latest time seen', () => {
    expect(clockWentBack(T, T - 24 * HOUR)).toBe(true)
    expect(clockWentBack(T, T - CLOCK_SLACK_MS - 1)).toBe(true)
  })
  it('allows small corrections and a first start', () => {
    expect(clockWentBack(T, T - 60_000)).toBe(false)
    expect(clockWentBack(0, T)).toBe(false)
    expect(clockWentBack(T, T + 48 * HOUR)).toBe(false)
  })
  it('saves the latest time at most once a minute, and raises one alert', () => {
    expect(checkClock(T, T + 30_000, false)).toBe('none')
    expect(checkClock(T, T + 60_000, false)).toBe('save')
    expect(checkClock(T, T - 2 * HOUR, false)).toBe('alert')
    expect(checkClock(T, T - 2 * HOUR, true)).toBe('none')
  })
})
