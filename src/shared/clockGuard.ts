// Earned time and the learning streak count by the device's date, so turning the clock forward gives a "new day"
// with a fresh allowance. Turning it forward leaves a trace: the app has seen a later time than the clock shows
// once it is turned back (or once the real date catches up). This keeps the latest time the app has seen
// (Usage.lastSeen) and notices when the clock goes back past it. Earned time then pauses until a parent checks.
// Date.now() counts in UTC, so time zones and summer time do not move it. Pure functions (tested).

/** Small corrections (the device setting its clock from the network) are not counted as a change. */
export const CLOCK_SLACK_MS = 10 * 60_000
/** lastSeen is saved at most this often, so the log is not written on every tick. */
export const LAST_SEEN_STEP_MS = 60_000

export interface ClockAlert {
  /** The latest time the app had seen (ms since 1970). */
  lastSeen: number
  /** The clock's time when the change was noticed. */
  noticedAt: number
}

/** The clock now shows a time well before one the app has already seen. */
export const clockWentBack = (lastSeen: number, now: number) => lastSeen > 0 && now < lastSeen - CLOCK_SLACK_MS

/** What to do on a tick: nothing, save the new latest time, or raise an alert. */
export function checkClock(lastSeen: number, now: number, alerted: boolean): 'none' | 'save' | 'alert' {
  if (alerted) return 'none'
  if (clockWentBack(lastSeen, now)) return 'alert'
  return now >= lastSeen + LAST_SEEN_STEP_MS ? 'save' : 'none'
}
